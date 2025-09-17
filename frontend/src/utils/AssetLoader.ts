/**
 * AssetLoader - Handles loading and caching of 3D assets
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export interface CharacterAsset {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
  skeleton?: THREE.Skeleton;
}

export interface AssetConfig {
  path: string;
  scale?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
}

export class AssetLoader {
  private static instance: AssetLoader;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private assetCache: Map<string, CharacterAsset> = new Map();
  private loadingPromises: Map<string, Promise<CharacterAsset>> = new Map();

  private constructor() {
    // Initialize GLTF loader
    this.gltfLoader = new GLTFLoader();
    
    // Initialize DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/'); // Path to DRACO decoder
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    console.log('🎯 AssetLoader initialized with GLTF and DRACO support');
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Load a character asset with caching
   */
  public async loadCharacterAsset(assetPath: string, config?: AssetConfig): Promise<CharacterAsset> {
    // Check cache first
    if (this.assetCache.has(assetPath)) {
      console.log(`📦 Using cached asset: ${assetPath}`);
      return this.cloneCharacterAsset(this.assetCache.get(assetPath)!);
    }

    // Check if already loading
    if (this.loadingPromises.has(assetPath)) {
      console.log(`⏳ Asset already loading: ${assetPath}`);
      return this.loadingPromises.get(assetPath)!;
    }

    // Start loading
    const loadingPromise = this.loadGLTFAsset(assetPath, config);
    this.loadingPromises.set(assetPath, loadingPromise);

    try {
      const asset = await loadingPromise;
      
      // Cache the original asset
      this.assetCache.set(assetPath, asset);
      this.loadingPromises.delete(assetPath);
      
      console.log(`✅ Loaded and cached asset: ${assetPath}`);
      
      // Return a clone for use
      return this.cloneCharacterAsset(asset);
    } catch (error) {
      this.loadingPromises.delete(assetPath);
      throw error;
    }
  }

  /**
   * Load GLTF asset from file with proper error handling
   */
  private async loadGLTFAsset(assetPath: string, config?: AssetConfig): Promise<CharacterAsset> {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Loading GLTF asset: ${assetPath}`);
      
      // First check if the file exists by making a HEAD request
      fetch(assetPath, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Asset not found: ${response.status} ${response.statusText}`);
          }
          
          // Check content type
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/octet-stream') && !contentType.includes('model/gltf-binary')) {
            console.warn(`⚠️ Unexpected content type for ${assetPath}: ${contentType}`);
          }
          
          // File exists, proceed with GLTF loading
          this.gltfLoader.load(
            assetPath,
            (gltf) => {
              try {
                const scene = gltf.scene.clone();
                const animations = gltf.animations || [];
                
                // Apply configuration
                if (config) {
                  if (config.scale) {
                    scene.scale.setScalar(config.scale);
                  }
                  if (config.position) {
                    scene.position.copy(config.position);
                  }
                  if (config.rotation) {
                    scene.rotation.copy(config.rotation);
                  }
                }

                // Set up shadows
                scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Ensure materials are set up properly
                    if (child.material) {
                      if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                          material.needsUpdate = true;
                        });
                      } else {
                        child.material.needsUpdate = true;
                      }
                    }
                  }
                });

                // Create animation mixer
                const mixer = new THREE.AnimationMixer(scene);
                
                // Find skeleton if present
                let skeleton: THREE.Skeleton | undefined;
                scene.traverse((child) => {
                  if (child instanceof THREE.SkinnedMesh && child.skeleton) {
                    skeleton = child.skeleton;
                  }
                });

                const asset: CharacterAsset = {
                  scene,
                  animations,
                  mixer,
                  skeleton
                };

                console.log(`✨ GLTF asset loaded successfully:`, {
                  path: assetPath,
                  animations: animations.length,
                  hasSkeleton: !!skeleton,
                  meshes: this.countMeshes(scene)
                });

                resolve(asset);
              } catch (error) {
                console.error(`❌ Error processing GLTF asset: ${assetPath}`, error);
                reject(new Error(`Failed to process GLTF: ${error.message}`));
              }
            },
            (progress) => {
              const percent = (progress.loaded / progress.total * 100).toFixed(1);
              console.log(`📈 Loading progress for ${assetPath}: ${percent}%`);
            },
            (error) => {
              console.error(`❌ Failed to load GLTF asset: ${assetPath}`, error);
              reject(new Error(`GLTF load error: ${error.message || 'Unknown error'}`));
            }
          );
        })
        .catch(error => {
          console.warn(`⚠️ Asset file not found or inaccessible: ${assetPath}`, error.message);
          reject(new Error(`Asset not found: ${assetPath} - ${error.message}`));
        });
    });
  }

  /**
   * Clone a character asset for independent use
   */
  private cloneCharacterAsset(asset: CharacterAsset): CharacterAsset {
    const clonedScene = asset.scene.clone();
    const clonedMixer = new THREE.AnimationMixer(clonedScene);
    
    // Clone animations
    const clonedAnimations = asset.animations.map(clip => clip.clone());
    
    // Find skeleton in cloned scene
    let clonedSkeleton: THREE.Skeleton | undefined;
    clonedScene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        clonedSkeleton = child.skeleton;
      }
    });

    return {
      scene: clonedScene,
      animations: clonedAnimations,
      mixer: clonedMixer,
      skeleton: clonedSkeleton
    };
  }

  /**
   * Count meshes in a scene
   */
  private countMeshes(scene: THREE.Object3D): number {
    let count = 0;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        count++;
      }
    });
    return count;
  }

  /**
   * Get available animations for an asset
   */
  public getAnimationNames(asset: CharacterAsset): string[] {
    return asset.animations.map(clip => clip.name);
  }

  /**
   * Play an animation on a character asset
   */
  public playAnimation(asset: CharacterAsset, animationName: string, loop: boolean = true): THREE.AnimationAction | null {
    const clip = asset.animations.find(clip => clip.name === animationName);
    if (!clip) {
      console.warn(`Animation "${animationName}" not found in asset`);
      return null;
    }

    const action = asset.mixer.clipAction(clip);
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.play();
    
    console.log(`🎭 Playing animation: ${animationName} (loop: ${loop})`);
    return action;
  }

  /**
   * Blend between animations
   */
  public blendToAnimation(
    asset: CharacterAsset, 
    fromAction: THREE.AnimationAction | null, 
    toAnimationName: string, 
    blendTime: number = 0.3
  ): THREE.AnimationAction | null {
    const toAction = this.playAnimation(asset, toAnimationName);
    if (!toAction) return null;

    if (fromAction) {
      // Fade out old animation, fade in new one
      fromAction.fadeOut(blendTime);
      toAction.reset().fadeIn(blendTime).play();
      
      console.log(`🔄 Blending animations over ${blendTime}s: ${fromAction.getClip().name} → ${toAnimationName}`);
    } else {
      toAction.play();
    }

    return toAction;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clear cache
    this.assetCache.forEach(asset => {
      asset.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      asset.mixer.stopAllAction();
    });
    
    this.assetCache.clear();
    this.loadingPromises.clear();
    
    // Dispose loaders
    this.dracoLoader.dispose();
    
    console.log('🧹 AssetLoader disposed');
  }
}
