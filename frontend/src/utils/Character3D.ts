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
  terrainMesh?: THREE.Mesh; // Optional terrain mesh for height detection
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
  
  // Terrain following
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private terrainMesh: THREE.Mesh | null = null;
  
  // Initialization state
  public isFullyInitialized: boolean = false;

  constructor(config: Character3DConfig) {
    const debugConsole = DebugConsole.getInstance();
    debugConsole.addLog('WARN', ['🚨 CHARACTER3D SIMPLIFIED VERSION 4.0 - Direct GLTF Loading 🚨']);
    
    // Debug flag for Game3DScene
    (window as any).CHARACTER3D_CONSTRUCTOR_CALLED = true;
    console.log('🎬 CHARACTER3D: Constructor called successfully');
    
    // Store references
    this.scene = config.scene;
    this.physicsWorld = config.physicsWorld;
    this.name = config.name;
    this.characterClass = config.characterClass;
    this.camera = config.camera || null;
    this.terrainMesh = config.terrainMesh || null;
    
    // Create main group for character
    this.group = new THREE.Group();
    this.group.position.copy(config.position);
    
    // Add to scene immediately
    this.scene.add(this.group);
    
    // Load character asynchronously
    this.loadCharacter(config);
    
    // Create physics body
    this.createPhysicsBody(config.position);
    
    // Ensure character starts in proper idle state
    this.targetPosition = null;
    this.isMoving = false;
    this.movementDirection.set(0, 0, 0);
    
    console.log(`✅ Character3D simplified constructor completed for ${this.name}`);
    console.log(`🎬 CHARACTER3D: Constructor finished - methods should be available`);
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
    this.nameplate.scale.set(3.5, 1.15, 1); // Just a bit bigger for better visibility
    
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
    this.model.position.set(0, -minY - 0, 0); // Raise character up to proper ground level
    
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
      console.log(`🎭 CONSERVATIVE: Starting gentle idle animation setup for ${idleClip.name}`);
      
      // CONSERVATIVE APPROACH: Gentle animation setup
      this.mixer.stopAllAction();
      
      // Create action normally
      this.currentAction = this.mixer.clipAction(idleClip);
      
      // Standard setup
      this.currentAction.reset();
      this.currentAction.setEffectiveWeight(1.0);
      this.currentAction.setEffectiveTimeScale(1.0);
      this.currentAction.enabled = true;
      this.currentAction.clampWhenFinished = false;
      this.currentAction.loop = THREE.LoopRepeat;
      this.currentAction.play();
      
      this.animationState = 'idle';
      console.log(`🎭 CONSERVATIVE: Started idle animation: ${idleClip.name}`);
      
      // Gentle animation updates - just enough to override bind pose
      for (let i = 0; i < 8; i++) {
        this.mixer.update(0.033);
      }
      
      console.log(`🎭 CONSERVATIVE: Applied 8 gentle animation updates`);
      
      // Call standard playAnimation method once
      this.playAnimation('idle');
      
      // Additional gentle updates after playAnimation call
      for (let i = 0; i < 3; i++) {
        this.mixer.update(0.033);
      }
      
      console.log(`🎭 CONSERVATIVE: Animation initialization complete - should be standing normally`);
      
      // Mark as fully initialized after reasonable delay
      setTimeout(() => {
        this.isFullyInitialized = true;
        console.log(`✅ Character ${this.name} fully initialized and ready - Animation state: ${this.animationState}`);
      }, 300); // Short delay
      
    } else {
      console.error(`❌ CRITICAL: No idle animation found!`);
      this.animations.forEach(clip => console.error(`Available: ${clip.name}`));
      
      // Even without animations, mark as initialized
      setTimeout(() => {
        this.isFullyInitialized = true;
      }, 300);
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
    
    // CRITICAL: When WASD stops, ensure ALL movement states are cleared
    if (!this.isMoving && wasMoving) {
      this.targetPosition = null; // Clear any lingering click-to-move
      this.movementDirection.set(0, 0, 0); // Ensure direction is zero
    }
    
    // Face movement direction smoothly
    if (this.isMoving) {
      const angle = Math.atan2(direction.x, direction.z);
      this.group.rotation.y = angle; // Direct for keyboard input responsiveness
    }
    
    // Update animation only when movement state actually changes
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
    
    // Gentle spawn protection: Only fix obvious issues
    if (!this.isFullyInitialized && this.animationState === 'walking' && !this.targetPosition && this.movementDirection.length() === 0) {
      console.log(`🔧 Gentle spawn protection: Fixing walking animation during spawn`);
      this.animationState = 'walking'; // Force change
      this.playAnimation('idle');
    }
    
    // Handle movement
    this.updateMovement(deltaTime);
    
    // IMMEDIATE STOP CHECK: Additional safety check in main update loop (only after initialization)
    if (this.isFullyInitialized && this.targetPosition && this.animationState === 'walking') {
      const currentPos = this.group.position;
      const targetDistance = currentPos.distanceTo(this.targetPosition);
      const currentVelocity = this.physicsBody.velocity.length();
      
      // If we're close and not moving much, stop immediately
      if (targetDistance < 0.2 && currentVelocity < 0.5) {
        console.log(`🛑 UPDATE LOOP STOP: Distance ${targetDistance.toFixed(3)}, velocity ${currentVelocity.toFixed(3)}`);
        this.targetPosition = null;
        this.isMoving = false;
        this.physicsBody.velocity.set(0, 0, 0);
        this.animationState = 'walking'; // Force change
        this.playAnimation('idle');
      }
    }
    
    // Sync physics to visual
    this.syncPhysicsToVisual();
    
    // Safety check: ensure animation state matches actual movement state (only after initialization)
    // Only run this check very occasionally to avoid interfering with normal transitions
    if (this.isFullyInitialized && Math.floor(Date.now() / 1000) % 5 === 0) { // Every 5 seconds, very infrequent
      const shouldBeMoving = this.targetPosition !== null || this.movementDirection.length() > 0;
      const actuallyMoving = this.physicsBody.velocity.length() > 0.1;
      
      // Only correct if there's a clear mismatch AND physics confirms the state
      if (shouldBeMoving && !actuallyMoving && this.animationState === 'walking') {
        console.log('🔧 Animation state correction: stuck walking but not moving - forcing idle');
        this.targetPosition = null;
        this.isMoving = false;
        this.animationState = 'walking'; // Force change
        this.playAnimation('idle');
      } else if (!shouldBeMoving && actuallyMoving && this.animationState === 'idle') {
        console.log('🔧 Animation state correction: moving but idle - forcing walking');
        this.playAnimation('walking');
      }
    }
    
    // Update nameplate to face camera
    if (this.nameplate && this.camera) {
      this.nameplate.lookAt(this.camera.position);
    }
  }
  
  private updateMovement(deltaTime: number): void {
    if (!this.physicsBody) return;
    
    const velocity = new CANNON.Vec3(0, 0, 0);
    
    if (this.targetPosition) {
      // Click-to-move
      const currentPos = this.group.position;
      const direction = new THREE.Vector3().subVectors(this.targetPosition, currentPos);
      const distance = direction.length();
      
      if (distance > 0.3) {
        direction.normalize();
        
        // Face movement direction
        const angle = Math.atan2(direction.x, direction.z);
        this.group.rotation.y = angle;
        
        velocity.x = direction.x * this.moveSpeed;
        velocity.z = direction.z * this.moveSpeed;
      } else {
        // Close to target - stop immediately with no deceleration
        this.targetPosition = null;
        this.isMoving = false;
        this.physicsBody.velocity.set(0, 0, 0);
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
    
    // Simple sync - just copy physics position to group (no terrain following for now)
    this.group.position.set(
      this.physicsBody.position.x,
      Math.max(0, this.physicsBody.position.y),
      this.physicsBody.position.z
    );
  }
  
  /**
   * Get the terrain height at a specific X,Z position using raycasting
   */
  private getTerrainHeight(x: number, z: number): number {
    if (!this.terrainMesh) {
      return 0; // Default ground level if no terrain mesh
    }
    
    // Cast ray downward from high above the position
    const rayOrigin = new THREE.Vector3(x, 100, z); // Start ray from high above
    const rayDirection = new THREE.Vector3(0, -1, 0); // Point downward
    
    this.raycaster.set(rayOrigin, rayDirection);
    const intersects = this.raycaster.intersectObject(this.terrainMesh);
    
    if (intersects.length > 0) {
      // Return the Y coordinate of the intersection point
      return intersects[0].point.y;
    }
    
    // If no intersection found, return default ground level
    return 0;
  }
  
  private playAnimation(animationName: 'idle' | 'walking' | 'running'): void {
    if (!this.mixer || this.animationState === animationName) return;
    
    // Map to Quaternius animation names
    const animationMap = {
      idle: 'Idle_Loop',
      walking: 'Walk_Loop',
      running: 'Jog_Fwd_Loop'
    };
    
    const targetAnimName = animationMap[animationName];
    const targetClip = this.animations.find(clip => clip.name === targetAnimName);
    
    if (!targetClip) {
      console.warn(`❌ Animation not found: ${targetAnimName}`);
      return;
    }
    
    const previousAction = this.currentAction;
    const newAction = this.mixer.clipAction(targetClip);
    
    // Configure new animation
    newAction.reset();
    newAction.setEffectiveWeight(1.0);
    newAction.setEffectiveTimeScale(1.0);
    newAction.enabled = true;
    newAction.clampWhenFinished = false;
    newAction.loop = THREE.LoopRepeat;
    
    // Handle transition
    if (previousAction && previousAction !== newAction) {
      // Smooth crossfade between animations
      const fadeTime = 0.2; // Shorter fade for more responsive feel
      
      previousAction.fadeOut(fadeTime);
      newAction.fadeIn(fadeTime);
      
      // Ensure previous action stops completely after fade
      setTimeout(() => {
        if (previousAction && previousAction !== this.currentAction) {
          previousAction.stop();
          previousAction.enabled = false;
        }
      }, fadeTime * 1000 + 50); // Small buffer to ensure fade completes
    } else {
      newAction.setEffectiveWeight(1.0);
    }
    
    newAction.play();
    this.currentAction = newAction;
    this.animationState = animationName;
    
    console.log(`🎭 Playing animation: ${targetAnimName} (transition from ${previousAction?.getClip().name || 'none'})`);
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
    // Character is moving if either keyboard movement is active OR click-to-move target exists
    const keyboardMoving = this.isMoving;
    const hasTarget = this.targetPosition !== null;
    return keyboardMoving || hasTarget;
  }
  
  public getCurrentAnimationState(): 'idle' | 'walking' | 'running' {
    return this.animationState;
  }
  
  public emergencyStop(): void {
    console.log('🚨 EMERGENCY STOP: Forcing complete movement and animation stop');
    
    // Clear ALL movement states aggressively
    this.targetPosition = null;
    this.movementDirection.set(0, 0, 0);
    this.isMoving = false;
    // Clear all movement states
    
    // Stop physics immediately
    if (this.physicsBody) {
      this.physicsBody.velocity.set(0, 0, 0);
      this.physicsBody.angularVelocity.set(0, 0, 0);
    }
    
    // Force animation to idle with nuclear approach
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.animationState = 'walking'; // Force state change
      this.playAnimation('idle');
      
      // Force multiple animation updates
      for (let i = 0; i < 5; i++) {
        this.mixer.update(0.033);
      }
    }
    
    // Verify all states are cleared
    console.log(`🔍 Emergency stop complete - isMoving: ${this.isMoving}, hasTarget: ${this.targetPosition !== null}, isCurrentlyMoving: ${this.isCurrentlyMoving()}`);
  }
  
  public setAnimationState(state: 'idle' | 'walking' | 'running'): void {
    if (this.animationState !== state) {
      this.playAnimation(state);
    }
  }
  
  public setTerrainMesh(terrainMesh: THREE.Mesh | null): void {
    this.terrainMesh = terrainMesh;
    console.log(`🏔️ Terrain mesh ${terrainMesh ? 'set' : 'cleared'} for character ${this.name}`);
  }
  
  public debugAnimationState(): void {
    console.log(`🔍 DEBUG ${this.name}: Animation State Report`);
    console.log(`  - animationState: ${this.animationState}`);
    console.log(`  - isFullyInitialized: ${this.isFullyInitialized}`);
    console.log(`  - targetPosition: ${this.targetPosition ? 'SET' : 'NULL'}`);
    console.log(`  - isMoving: ${this.isMoving}`);
    console.log(`  - movementDirection length: ${this.movementDirection.length()}`);
    console.log(`  - currentAction: ${this.currentAction?.getClip().name || 'NULL'}`);
    console.log(`  - mixer: ${this.mixer ? 'ACTIVE' : 'NULL'}`);
    
    if (this.currentAction) {
      console.log(`  - currentAction enabled: ${this.currentAction.enabled}`);
      console.log(`  - currentAction weight: ${this.currentAction.getEffectiveWeight()}`);
      console.log(`  - currentAction time: ${this.currentAction.time}`);
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