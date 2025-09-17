/**
 * AssetLoader - Handles loading and caching of 3D assets
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DebugConsole } from './DebugConsole';
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
  
  // Asset tracking for performance monitoring
  private loadingAssets: Set<string> = new Set();
  private assetSizes: Map<string, number> = new Map();
  private loadTimes: Map<string, number> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private totalMemoryUsage = 0;

  private constructor() {
    // Initialize GLTF loader
    this.gltfLoader = new GLTFLoader();
    
    // Initialize DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/'); // Path to DRACO decoder
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    DebugConsole.info('ASSETS', '🎯 AssetLoader initialized with GLTF and DRACO support');
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
      this.cacheHits++;
      DebugConsole.debug('ASSETS', `💾 Cache hit: ${assetPath} (${this.cacheHits} hits, ${this.cacheMisses} misses)`);
      this.logCacheStats();
      return this.cloneCharacterAsset(this.assetCache.get(assetPath)!);
    }

    // Check if already loading
    if (this.loadingPromises.has(assetPath)) {
      DebugConsole.debug('ASSETS', `⏳ Asset already loading: ${assetPath}`);
      return this.loadingPromises.get(assetPath)!;
    }

    // Start loading
    this.cacheMisses++;
    this.loadingAssets.add(assetPath);
    const startTime = performance.now();
    DebugConsole.info('ASSETS', `🔄 Loading asset: ${assetPath}`);
    
    const loadingPromise = this.loadGLTFAsset(assetPath, config);
    this.loadingPromises.set(assetPath, loadingPromise);

    try {
      const asset = await loadingPromise;
      const loadTime = performance.now() - startTime;
      
      // Track asset metrics
      this.loadTimes.set(assetPath, loadTime);
      this.loadingAssets.delete(assetPath);
      
      // Cache the original asset
      this.assetCache.set(assetPath, asset);
      this.loadingPromises.delete(assetPath);
      
      // Estimate memory usage
      const estimatedSize = this.estimateAssetSize(asset);
      this.assetSizes.set(assetPath, estimatedSize);
      this.totalMemoryUsage += estimatedSize;
      
      DebugConsole.info('ASSETS', `✅ Asset loaded: ${assetPath} (${loadTime.toFixed(0)}ms, ~${(estimatedSize/1024).toFixed(1)}KB)`);
      this.logMemoryUsage();
      
      // Return a clone for use
      return this.cloneCharacterAsset(asset);
    } catch (error) {
      this.loadingAssets.delete(assetPath);
      this.loadingPromises.delete(assetPath);
      DebugConsole.error('ASSETS', `❌ Failed to load asset: ${assetPath} - ${error}`);
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
              animationNames: animations.map(clip => clip.name),
              hasSkeleton: !!skeleton,
              meshes: this.countMeshes(scene)
            });

                resolve(asset);
              } catch (error) {
                console.error(`❌ Error processing GLTF asset: ${assetPath}`, error);
                reject(new Error(`Failed to process GLTF: ${error instanceof Error ? error.message : 'Unknown error'}`));
              }
            },
            (progress) => {
              const percent = (progress.loaded / progress.total * 100).toFixed(1);
              console.log(`📈 Loading progress for ${assetPath}: ${percent}%`);
            },
            (error) => {
              console.error(`❌ Failed to load GLTF asset: ${assetPath}`, error);
              reject(new Error(`GLTF load error: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
    let clip = asset.animations.find(clip => clip.name === animationName);
    
    if (!clip) {
      console.warn(`Animation "${animationName}" not found in asset. Available animations:`, asset.animations.map(c => c.name));
      
      // Try common fallbacks
      const fallbacks = [
        animationName.toLowerCase(),
        animationName.toUpperCase(),
        animationName.charAt(0).toUpperCase() + animationName.slice(1).toLowerCase()
      ];
      
      for (const fallback of fallbacks) {
        clip = asset.animations.find(c => c.name === fallback);
        if (clip) {
          console.log(`🎭 Using fallback animation: "${clip.name}" for "${animationName}"`);
          break;
        }
      }
      
      // If still no animation found, use the first available animation
      if (!clip && asset.animations.length > 0) {
        clip = asset.animations[0];
        console.log(`🎭 Using first available animation: "${clip.name}" as fallback for "${animationName}"`);
      }
      
      if (!clip) {
        console.error(`❌ No animations available in asset`);
        return null;
      }
    }

    const action = asset.mixer.clipAction(clip);
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.play();
    
    console.log(`🎭 Playing animation: ${clip.name} (requested: ${animationName}, loop: ${loop})`);
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
    
    DebugConsole.info('ASSETS', '🧹 AssetLoader disposed');
  }

  // Asset tracking and performance methods
  private estimateAssetSize(asset: CharacterAsset): number {
    let size = 0;
    
    // Estimate geometry size
    asset.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        const attributes = geometry.attributes;
        
        for (const name in attributes) {
          const attribute = attributes[name];
          size += attribute.array.byteLength;
        }
        
        if (geometry.index) {
          size += geometry.index.array.byteLength;
        }
      }
    });
    
    // Estimate animation size
    asset.animations.forEach(clip => {
      clip.tracks.forEach(track => {
        size += track.values.byteLength + track.times.byteLength;
      });
    });
    
    return size;
  }
  
  private logCacheStats(): void {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? ((this.cacheHits / totalRequests) * 100).toFixed(1) : '0';
    
    DebugConsole.debug('ASSETS', `Cache stats: ${hitRate}% hit rate (${this.cacheHits}/${totalRequests})`, 10000);
  }
  
  private logMemoryUsage(): void {
    const totalMB = (this.totalMemoryUsage / 1024 / 1024).toFixed(1);
    const assetCount = this.assetCache.size;
    const loadingCount = this.loadingAssets.size;
    
    DebugConsole.debug('ASSETS', `Memory: ${totalMB}MB across ${assetCount} assets (${loadingCount} loading)`, 5000);
  }
  
  public getAssetStats(): {
    cacheHits: number;
    cacheMisses: number;
    totalMemoryMB: number;
    assetCount: number;
    loadingCount: number;
    averageLoadTime: number;
  } {
    const loadTimes = Array.from(this.loadTimes.values());
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;
      
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      totalMemoryMB: this.totalMemoryUsage / 1024 / 1024,
      assetCount: this.assetCache.size,
      loadingCount: this.loadingAssets.size,
      averageLoadTime
    };
  }
  
  public clearCache(): void {
    const clearedCount = this.assetCache.size;
    const clearedMemory = (this.totalMemoryUsage / 1024 / 1024).toFixed(1);
    
    this.assetCache.clear();
    this.loadingPromises.clear();
    this.assetSizes.clear();
    this.loadTimes.clear();
    this.totalMemoryUsage = 0;
    
    DebugConsole.info('ASSETS', `🧹 Cleared ${clearedCount} assets, freed ${clearedMemory}MB`);
  }
}
