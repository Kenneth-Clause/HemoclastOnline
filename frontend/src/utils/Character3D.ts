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
  private moveStartTime: number = 0; // Track when movement started
  
  // References
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;
  private camera: THREE.Camera | null = null;
  private name: string;
  private characterClass: string;
  
  // Terrain following
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private terrainMesh: THREE.Mesh | null = null;

  constructor(config: Character3DConfig) {
    const debugConsole = DebugConsole.getInstance();
    debugConsole.addLog('WARN', ['🚨 CHARACTER3D SIMPLIFIED VERSION 4.0 - Direct GLTF Loading 🚨']);
    
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
    this.nameplate.scale.set(2.75, 1.15, 1); // Just a bit bigger for better visibility
    
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
      console.log('🎮 Cancelled click-to-move due to keyboard input');
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
    
    // Use terrain height instead of fixed Y value
    const terrainHeight = this.getTerrainHeight(targetPosition.x, targetPosition.z);
    this.targetPosition.y = terrainHeight + 1; // Character height above terrain
    
    this.moveStartTime = Date.now(); // Track when movement started
    
    // Cancel any keyboard movement
    this.movementDirection.set(0, 0, 0);
    this.isMoving = true; // Set to true since we're starting click-to-move
    
    // Start walking animation (only if not already walking)
    if (this.animationState !== 'walking') {
      this.playAnimation('walking');
    }
    
    console.log(`🖱️ Click-to-move target set: (${targetPosition.x.toFixed(1)}, ${this.targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)}) [terrain: ${terrainHeight.toFixed(2)}]`);
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
    
    // Safety check: ensure animation state matches actual movement state
    const shouldBeMoving = this.targetPosition !== null || this.movementDirection.length() > 0;
    if (shouldBeMoving && this.animationState === 'idle') {
      console.log('🔧 Animation state correction: should be walking but is idle');
      this.playAnimation('walking');
    } else if (!shouldBeMoving && this.animationState === 'walking') {
      console.log('🔧 Animation state correction: should be idle but is walking');
      this.playAnimation('idle');
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
      
      if (distance > 0.1) { // Reduced threshold for smoother arrival
        direction.normalize();
        
        // Smooth rotation towards target
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.group.rotation.y;
        const angleDiff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
        this.group.rotation.y += angleDiff * Math.min(deltaTime * 8, 1); // Smooth rotation
        
        // Apply movement velocity
        velocity.x = direction.x * this.moveSpeed;
        velocity.z = direction.z * this.moveSpeed;
        
        // Ensure walking animation is playing
        if (this.animationState !== 'walking') {
          this.playAnimation('walking');
        }
      } else {
        // We're close to target - start final approach
        const lerpFactor = Math.min(deltaTime * 10, 1); // Smooth final approach
        const oldPosition = this.group.position.clone();
        this.group.position.lerp(this.targetPosition, lerpFactor);
        this.physicsBody.position.set(this.group.position.x, this.group.position.y, this.group.position.z);
        
        // Check if we've actually moved very little (indicating we've reached the target)
        const positionChange = oldPosition.distanceTo(this.group.position);
        
        // Safety timeout: if movement takes too long, force stop (prevents stuck walking animation)
        const movementDuration = Date.now() - this.moveStartTime;
        const maxMovementTime = 30000; // 30 seconds maximum
        
        // Stop when we're very close to target OR when position barely changes between frames OR timeout
        if (distance < 0.05 || positionChange < 0.01 || movementDuration > maxMovementTime) {
          this.targetPosition = null;
          this.isMoving = false; // Update movement state
          this.playAnimation('idle');
          // Zero out velocity to ensure complete stop
          this.physicsBody.velocity.set(0, 0, 0);
          
          if (movementDuration > maxMovementTime) {
            console.log('⏰ Click-to-move timeout - forcing stop and idle animation');
          } else {
            console.log('🛑 Reached click-to-move destination, switching to idle');
          }
        }
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
    
    // Get terrain height at character position
    const terrainHeight = this.getTerrainHeight(this.physicsBody.position.x, this.physicsBody.position.z);
    
    // Sync position with terrain following
    this.group.position.set(
      this.physicsBody.position.x,
      Math.max(terrainHeight, this.physicsBody.position.y), // Follow terrain or physics, whichever is higher
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
    return this.isMoving || this.targetPosition !== null;
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
  
  public setTerrainMesh(terrainMesh: THREE.Mesh | null): void {
    this.terrainMesh = terrainMesh;
    console.log(`🏔️ Terrain mesh ${terrainMesh ? 'set' : 'cleared'} for character ${this.name}`);
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