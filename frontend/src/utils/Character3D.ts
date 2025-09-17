/**
 * Character3D - Simplified 3D character representation optimized for Godot GLTF assets
 * Designed to work with Quaternius Universal Animation Library
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MovementConfig } from '../config/movementConfig';
import { DebugConsole } from './DebugConsole';

export interface Character3DConfig {
  scene: THREE.Scene;
  physicsWorld: CANNON.World;
  name: string;
  characterClass: 'warrior' | 'rogue' | 'mage';
  position: THREE.Vector3;
  modelPath?: string;
  camera?: THREE.Camera;
}

export class Character3D {
  static test() {
    console.log('🧪 Character3D SIMPLIFIED VERSION 4.0 - Direct GLTF Loading');
    return true;
  }
  
  // Core components
  private group: THREE.Group;
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private nameplate: THREE.Sprite | null = null;
  private physicsBody!: CANNON.Body;
  
  // Animation state
  private currentAction: THREE.AnimationAction | null = null;
  private animations: THREE.AnimationClip[] = [];
  private animationState: 'idle' | 'walking' | 'running' = 'idle';
  
  // Movement
  private moveSpeed = MovementConfig.BASE_MOVE_SPEED;
  private isMoving = false;
  private movementDirection = new THREE.Vector3();
  private targetPosition: THREE.Vector3 | null = null;
  
  // References
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;
  private camera: THREE.Camera | null = null;
  private name: string;
  private characterClass: string;

  constructor(config: Character3DConfig) {
    const debugConsole = DebugConsole.getInstance();
    debugConsole.addLog('WARN', ['🚨 CHARACTER3D SIMPLIFIED VERSION 4.0 - Direct GLTF Loading 🚨']);
    
    // Store references
    this.scene = config.scene;
    this.physicsWorld = config.physicsWorld;
    this.name = config.name;
    this.characterClass = config.characterClass;
    this.camera = config.camera || null;
    
    // Create main group for character
    this.group = new THREE.Group();
    this.group.position.copy(config.position);
    
    // Add to scene immediately
    this.scene.add(this.group);
    
    // Load character asynchronously
    this.loadCharacter(config);
    
    // Create physics body
    this.createPhysicsBody(config.position);
    
    console.log(`✅ Character3D simplified constructor completed for ${this.name}`);
  }
  
  private async loadCharacter(config: Character3DConfig): Promise<void> {
    const debugConsole = DebugConsole.getInstance();
    const modelPath = config.modelPath || '/models/characters/Godot/default_anims.glb';
    
    debugConsole.addLog('WARN', [`🔄 SIMPLE: Loading GLTF directly: ${modelPath}`]);
    
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(modelPath, resolve, undefined, reject);
      });
      
      // Store the model and animations
      this.model = gltf.scene;
      this.animations = gltf.animations;
      
      if (this.model) {
        this.mixer = new THREE.AnimationMixer(this.model);
        
        // Apply scale first, then calculate positioning
        this.model.rotation.set(0, 0, 0);
        this.model.scale.setScalar(2); // Apply scale first
        
        // Add model to group first at origin
        this.model.position.set(0, 0, 0);
        this.group.add(this.model);
        
        console.log(`📏 Model added to group at origin, will position after animation setup`);
      }
      
      // Setup materials for visibility
      this.setupModelMaterials();
      
      // Create nameplate
      this.createNameplate();
      
      // Setup animations
      this.setupAnimations();
      
      // NOW position the character after animations are set up
      this.positionCharacterOnGround();
      
      debugConsole.addLog('LOG', [`✅ SIMPLE: Character loaded successfully. Group children: ${this.group.children.length}`]);
      console.log(`✅ SIMPLE: Character ${this.name} loaded with ${this.animations.length} animations`);
      
    } catch (error) {
      debugConsole.addLog('ERROR', [`❌ SIMPLE: Failed to load character: ${error}`]);
      console.error(`❌ Failed to load character ${this.name}:`, error);
      throw error;
    }
  }
  
  private setupModelMaterials(): void {
    if (!this.model) return;
    
    // Apply simple green material for visibility
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        const material = new THREE.MeshLambertMaterial({
          color: 0x00ff00,
          emissive: 0x002200
        });
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    console.log(`🎨 Applied materials to character model`);
  }
  
  private createNameplate(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512; // Larger canvas for better quality
    canvas.height = 128;
    
    // Clean name
    let cleanName = this.name || 'Player';
    cleanName = cleanName.replace(/^["']|["']$/g, '').trim();
    if (cleanName.length < 2) cleanName = 'Player';
    
    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple white text - no background, no outline
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#FFFFFF';
    context.fillText(cleanName, canvas.width / 2, canvas.height / 2);
    
    // Create sprite with proper transparency
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      alphaTest: 0.1, // Helps with transparency issues
      sizeAttenuation: true // Let nameplate scale naturally with distance
    });
    this.nameplate = new THREE.Sprite(material);
    this.nameplate.position.y = 3.5; // Closer to character
    this.nameplate.scale.set(2.65, 1.15, 1); // Just a bit bigger for better visibility
    
    this.group.add(this.nameplate);
    console.log(`🏷️ Created enhanced nameplate for ${cleanName}`);
  }
  
  private createPhysicsBody(position: THREE.Vector3): void {
    const shape = new CANNON.Cylinder(0.35, 0.35, 1.6, 8);
    this.physicsBody = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.1 })
    });
    
    this.physicsBody.fixedRotation = true;
    this.physicsBody.updateMassProperties();
    this.physicsWorld.addBody(this.physicsBody);
  }
  
  private positionCharacterOnGround(): void {
    if (!this.model) return;
    
    // Calculate bounds AFTER animations are set up and running
    const boundingBox = new THREE.Box3().setFromObject(this.model);
    const modelHeight = boundingBox.getSize(new THREE.Vector3()).y;
    const minY = boundingBox.min.y;
    
    // Position so feet are just above ground level
    this.model.position.set(0, -minY - 0.1, 0); // Raise character up to proper ground level
    
    console.log(`🔧 FINAL: Positioned character after animation setup - height: ${modelHeight.toFixed(2)}, y: ${(-minY - 0.85).toFixed(2)}`);
  }
  
  private setupAnimations(): void {
    if (!this.mixer || this.animations.length === 0) return;
    
    // List all available animations first
    console.log(`🎭 Available animations (${this.animations.length}):`);
    this.animations.forEach(clip => console.log(`  - ${clip.name}`));
    
    // Find and setup idle animation immediately - try multiple possible names
    const idleClip = this.animations.find(clip => 
      clip.name === 'Idle_Loop' || 
      clip.name === 'idle' ||
      clip.name === 'Idle' ||
      clip.name.toLowerCase().includes('idle')
    );
    
    if (idleClip) {
      this.currentAction = this.mixer.clipAction(idleClip);
      
      // NUCLEAR ANIMATION APPROACH: Stop all other actions first
      this.mixer.stopAllAction();
      
      this.currentAction.reset();
      this.currentAction.setEffectiveWeight(1.0);
      this.currentAction.setEffectiveTimeScale(1.0);
      this.currentAction.enabled = true;
      this.currentAction.clampWhenFinished = false;
      this.currentAction.loop = THREE.LoopRepeat;
      this.currentAction.play();
      
      this.animationState = 'idle';
      console.log(`🎭 NUCLEAR: Started idle animation: ${idleClip.name}`);
      
      // SUPER AGGRESSIVE: Force many animation updates
      for (let i = 0; i < 10; i++) {
        this.mixer.update(0.033);
      }
      
      console.log(`🎭 NUCLEAR: Forced 10 animation updates to override any default pose`);
      
      // ALSO call our standard playAnimation method to ensure proper setup
      this.playAnimation('idle');
      
    } else {
      console.error(`❌ CRITICAL: No idle animation found!`);
      this.animations.forEach(clip => console.error(`Available: ${clip.name}`));
    }
  }
  
  public setMovementDirection(direction: THREE.Vector3): void {
    this.movementDirection.copy(direction);
    const wasMoving = this.isMoving;
    this.isMoving = direction.length() > 0;
    
    // Cancel click-to-move if keyboard input
    if (this.isMoving && this.targetPosition) {
      this.targetPosition = null;
    }
    
    // Face movement direction
    if (this.isMoving) {
      const angle = Math.atan2(direction.x, direction.z);
      this.group.rotation.y = angle;
    }
    
    // Update animation
    if (this.isMoving && !wasMoving) {
      this.playAnimation('walking');
    } else if (!this.isMoving && wasMoving) {
      this.playAnimation('idle');
    }
  }
  
  public moveToPosition(targetPosition: THREE.Vector3): void {
    this.targetPosition = targetPosition.clone();
    this.targetPosition.y = 1;
    this.playAnimation('walking');
  }
  
  public update(deltaTime: number): void {
    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    // Handle movement
    this.updateMovement(deltaTime);
    
    // Sync physics to visual
    this.syncPhysicsToVisual();
    
    // Update nameplate to face camera
    if (this.nameplate && this.camera) {
      this.nameplate.lookAt(this.camera.position);
    }
  }
  
  private updateMovement(_deltaTime: number): void {
    if (!this.physicsBody) return;
    
    const velocity = new CANNON.Vec3(0, 0, 0);
    
    if (this.targetPosition) {
      // Click-to-move
      const currentPos = this.group.position;
      const direction = new THREE.Vector3().subVectors(this.targetPosition, currentPos);
      const distance = direction.length();
      
      if (distance > 0.5) {
        direction.normalize();
        velocity.x = direction.x * this.moveSpeed;
        velocity.z = direction.z * this.moveSpeed;
      } else {
        // Reached target
        this.group.position.copy(this.targetPosition);
        this.physicsBody.position.set(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);
        this.targetPosition = null;
        this.playAnimation('idle');
      }
    } else if (this.movementDirection.length() > 0) {
      // Keyboard movement
      const direction = this.movementDirection.clone().normalize();
      velocity.x = direction.x * this.moveSpeed;
      velocity.z = direction.z * this.moveSpeed;
    }
    
    // Apply velocity
    this.physicsBody.velocity.x = velocity.x;
    this.physicsBody.velocity.z = velocity.z;
  }
  
  private syncPhysicsToVisual(): void {
    if (!this.physicsBody) return;
    
    // Simple sync - just copy physics position to group
    this.group.position.set(
      this.physicsBody.position.x,
      Math.max(0, this.physicsBody.position.y),
      this.physicsBody.position.z
    );
  }
  
  private playAnimation(animationName: 'idle' | 'walking' | 'running'): void {
    if (!this.mixer) return;
    
    // Map to Quaternius animation names
    const animationMap = {
      idle: 'Idle_Loop',
      walking: 'Walk_Loop',
      running: 'Jog_Fwd_Loop'
    };
    
    const targetAnimName = animationMap[animationName];
    const targetClip = this.animations.find(clip => clip.name === targetAnimName);
    
    if (!targetClip) return;
    
    // Fade out current animation
    if (this.currentAction) {
      this.currentAction.fadeOut(0.3);
    }
    
    // Fade in new animation
    this.currentAction = this.mixer.clipAction(targetClip);
    this.currentAction.reset().fadeIn(0.3).play();
    this.animationState = animationName;
    
    console.log(`🎭 Playing animation: ${targetAnimName}`);
  }
  
  // Public API methods
  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }
  
  public setPosition(position: THREE.Vector3): void {
    this.group.position.copy(position);
    if (this.physicsBody) {
      this.physicsBody.position.copy(position as any);
    }
  }
  
  public getRotation(): THREE.Euler {
    return this.group.rotation.clone();
  }
  
  public setRotation(rotation: THREE.Euler): void {
    this.group.rotation.copy(rotation);
  }
  
  public getGroup(): THREE.Group {
    return this.group;
  }
  
  public getName(): string {
    return this.name;
  }
  
  public getCharacterClass(): string {
    return this.characterClass;
  }
  
  public isCurrentlyMoving(): boolean {
    return this.isMoving;
  }
  
  public getCurrentAnimationState(): 'idle' | 'walking' | 'running' {
    return this.animationState;
  }
  
  public emergencyStop(): void {
    this.targetPosition = null;
    this.movementDirection.set(0, 0, 0);
    this.isMoving = false;
    this.playAnimation('idle');
    if (this.physicsBody) {
      this.physicsBody.velocity.set(0, 0, 0);
    }
  }
  
  public setAnimationState(state: 'idle' | 'walking' | 'running'): void {
    if (this.animationState !== state) {
      this.playAnimation(state);
    }
  }
  
  public destroy(): void {
    // Remove from physics world
    if (this.physicsBody) {
      this.physicsWorld.removeBody(this.physicsBody);
    }
    
    // Remove from scene
    this.scene.remove(this.group);
    
    // Clean up animations
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    // Clean up geometries and materials
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    console.log(`🧹 Destroyed character: ${this.name}`);
  }
}