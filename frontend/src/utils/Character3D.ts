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
  onAnimationStateChanged?: (newState: 'idle' | 'walking' | 'running') => void; // Callback for animation state changes
}

export class Character3D {
  static test() {
    DebugConsole.info('SYSTEM', '🧪 Character3D SIMPLIFIED VERSION 4.0 - Direct GLTF Loading');
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
  
  // Smooth interpolation for all networked players (enhancement overlay)
  private networkTargetPosition: THREE.Vector3 | null = null;
  private networkTargetRotation: THREE.Euler | null = null;
  private interpolationEnabled: boolean = MovementConfig.INTERPOLATION_ENABLED_BY_DEFAULT; // Enable by default for smooth movement
  private isMainPlayer: boolean = false; // True for the player you control, false for other networked players
  private lastNetworkUpdateTime: number = 0; // Track when last network update was received
  
  // References
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;
  private camera: THREE.Camera | null = null;
  private name: string;
  private characterClass: string;
  private onAnimationStateChanged?: (newState: 'idle' | 'walking' | 'running') => void;
  
  // Terrain following
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private terrainMesh: THREE.Mesh | null = null;
  
  // Initialization state
  public isFullyInitialized: boolean = false;

  constructor(config: Character3DConfig) {
    const debugConsole = DebugConsole.getInstance();
    debugConsole.addLogLegacy('WARN', ['🚨 CHARACTER3D SIMPLIFIED VERSION 4.0 - Direct GLTF Loading 🚨']);
    
    // Debug flag for Game3DScene
    (window as any).CHARACTER3D_CONSTRUCTOR_CALLED = true;
    DebugConsole.debug('SYSTEM', '🎬 CHARACTER3D: Constructor called successfully');
    
    // Store references
    this.scene = config.scene;
    this.physicsWorld = config.physicsWorld;
    this.name = config.name;
    this.characterClass = config.characterClass;
    this.camera = config.camera || null;
    this.terrainMesh = config.terrainMesh || null;
    this.onAnimationStateChanged = config.onAnimationStateChanged;
    
    // Create main group for character
    this.group = new THREE.Group();
    this.group.position.copy(config.position);
    
    // Hide the group initially to prevent bind pose flash
    this.group.visible = false;
    
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
    this.animationState = 'idle'; // Explicitly set initial animation state
    
    DebugConsole.debug('SYSTEM', `✅ Character3D constructor completed for ${this.name}`);
    DebugConsole.debug('SYSTEM', `🎬 CHARACTER3D: Constructor finished - methods available`);
  }
  
  private async loadCharacter(config: Character3DConfig): Promise<void> {
    const debugConsole = DebugConsole.getInstance();
    const modelPath = config.modelPath || '/models/characters/Godot/default_anims.glb';
    
    DebugConsole.debug('ASSETS', `🔄 Loading character: ${this.name}`);
    debugConsole.addLogLegacy('WARN', [`🔄 SIMPLE: Loading GLTF directly: ${modelPath}`]);
    
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
        
        // IMPORTANT: Don't add model to scene yet - set up animations first to avoid bind pose flash
        this.model.position.set(0, 0, 0);
        
        DebugConsole.debug('SCENE', `📏 Model prepared, will add after animation setup`);
      }
      
      // Setup materials for visibility
      this.setupModelMaterials();
      
      // Create nameplate
      this.createNameplate();
      
      // Setup animations
      this.setupAnimations();
      
      // NOW position the character after animations are set up
      this.positionCharacterOnGround();
      
      debugConsole.addLogLegacy('LOG', [`✅ SIMPLE: Character loaded successfully. Group children: ${this.group.children.length}`]);
      DebugConsole.info('ASSETS', `✅ Character ${this.name} loaded with ${this.animations.length} animations`);
      
    } catch (error) {
      debugConsole.addLogLegacy('ERROR', [`❌ SIMPLE: Failed to load character: ${error}`]);
      DebugConsole.error('ASSETS', `❌ Failed to load character ${this.name}:`, error);
      
      // Make character visible anyway to prevent permanent invisibility
      this.group.visible = true;
      DebugConsole.warn('ASSETS', `👁️ Character made visible due to loading error`);
      
      // Still mark as initialized to prevent indefinite waiting
      setTimeout(() => {
        this.isFullyInitialized = true;
        DebugConsole.warn('ASSETS', `✅ Character ${this.name} marked as initialized despite loading error`);
      }, 100);
      
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
    
    DebugConsole.debug('ASSETS', `🎨 Applied materials to character model`);
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
    DebugConsole.debug('SCENE', `🏷️ Created nameplate for ${cleanName}`);
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
    
    DebugConsole.debug('SCENE', `🔧 Positioned character: height=${modelHeight.toFixed(2)}, y=${(-minY - 0.85).toFixed(2)}`);
  }
  
  private setupAnimations(): void {
    if (!this.mixer || this.animations.length === 0) return;
    
    // List all available animations first with detailed info
    DebugConsole.debug('ASSETS', `🎭 Available animations (${this.animations.length}): ${this.animations.map(clip => clip.name).join(', ')}`);
    // Detailed animation info only in verbose mode
    DebugConsole.verbose('ASSETS', `Animation details: ${this.animations.map(clip => `${clip.name}(${clip.duration.toFixed(2)}s)`).join(', ')}`, 10000);
    
    // Try different animation selection strategies
    DebugConsole.debug('ANIMATION', `🔍 Looking for idle animations...`);
    
    // Strategy 1: Look for exact matches first
    let idleClip = this.animations.find(clip => clip.name === 'Idle_Loop');
    if (idleClip) {
      DebugConsole.debug('ANIMATION', `✅ Found idle animation: "Idle_Loop"`);
    } else {
      // Strategy 2: Look for other idle variations
      idleClip = this.animations.find(clip => 
        clip.name === 'idle' ||
        clip.name === 'Idle' ||
        clip.name === 'IDLE'
      );
      if (idleClip) {
        DebugConsole.debug('ANIMATION', `✅ Found idle variation: "${idleClip.name}"`);
      } else {
        // Strategy 3: Look for anything containing "idle"
        idleClip = this.animations.find(clip => 
          clip.name.toLowerCase().includes('idle')
        );
        if (idleClip) {
          DebugConsole.debug('ANIMATION', `✅ Found idle animation: "${idleClip.name}"`);
        } else {
          // Strategy 4: Look for standing poses
          idleClip = this.animations.find(clip => 
            clip.name.toLowerCase().includes('stand') ||
            clip.name.toLowerCase().includes('pose')
          );
          if (idleClip) {
            DebugConsole.debug('ANIMATION', `✅ Found standing pose: "${idleClip.name}"`);
          } else {
            // Strategy 5: Use first animation as fallback
            if (this.animations.length > 0) {
              idleClip = this.animations[0];
              DebugConsole.warn('ANIMATION', `⚠️ Fallback: Using first animation "${idleClip.name}"`);
            }
          }
        }
      }
    }
    
    if (idleClip) {
      DebugConsole.debug('ANIMATION', `🎭 Setting up idle animation: ${idleClip.name}`);
      
      // FIRST: Add the model to the scene BEFORE setting up animations
      // This ensures the animation mixer has a proper scene context
      if (this.model && this.model.parent !== this.group) {
        this.group.add(this.model);
        DebugConsole.debug('SCENE', `📏 Model added to scene before animation setup`);
      }
      
      // SECOND: Now set up the animation with the model properly in the scene
      this.mixer.stopAllAction();
      
      // Create and configure the idle action
      this.currentAction = this.mixer.clipAction(idleClip);
      this.currentAction.reset();
      this.currentAction.setEffectiveWeight(1.0);
      this.currentAction.setEffectiveTimeScale(1.0);
      this.currentAction.enabled = true;
      this.currentAction.clampWhenFinished = false;
      this.currentAction.loop = THREE.LoopRepeat;
      this.currentAction.play();
      
      this.animationState = 'idle';
      DebugConsole.debug('ANIMATION', `🎭 Idle animation configured: ${idleClip.name}`);
      
      // THIRD: Apply animation updates with the model properly in the scene
      for (let i = 0; i < 10; i++) {
        this.mixer.update(0.016); // Just a few updates to establish the pose
      }
      
      DebugConsole.debug('ANIMATION', `🎭 Applied animation updates`);
      
      // FOURTH: Make the character visible
      this.group.visible = true;
      DebugConsole.info('SCENE', `👁️ Character made visible: ${this.name}`);
      
      // Mark as fully initialized after reasonable delay
      setTimeout(() => {
        this.isFullyInitialized = true;
        DebugConsole.info('SYSTEM', `✅ Character ${this.name} fully initialized - Animation: ${this.animationState}`);
      }, 300); // Short delay
      
    } else {
      DebugConsole.error('ANIMATION', `❌ CRITICAL: No idle animation found!`);
      DebugConsole.error('ANIMATION', `Available animations: ${this.animations.map(clip => clip.name).join(', ')}`);
      
      // Add the model to scene even without animations
      if (this.model && this.model.parent !== this.group) {
        this.group.add(this.model);
        DebugConsole.warn('SCENE', `📏 Model added to scene without animations`);
      }
      
      // Make character visible even without animations
      this.group.visible = true;
      DebugConsole.warn('SCENE', `👁️ Character made visible without animations`);
      
      // Even without animations, mark as initialized
      setTimeout(() => {
        this.isFullyInitialized = true;
        DebugConsole.warn('SYSTEM', `✅ Character ${this.name} marked as initialized without animations`);
      }, 100);
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
      DebugConsole.debug('MOVEMENT', `🏃 ${this.name} started moving`);
    } else if (!this.isMoving && wasMoving) {
      this.playAnimation('idle');
      DebugConsole.debug('MOVEMENT', `🛑 ${this.name} stopped moving`);
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
      DebugConsole.debug('MOVEMENT', `🔧 Gentle spawn protection: Fixing walking animation during spawn`);
      this.animationState = 'walking'; // Force change
      this.playAnimation('idle');
    }
    
    // Handle movement - only main player controls their own movement
    if (this.isMainPlayer) {
      this.updateMovement(deltaTime);
    }
    
    // Handle smooth interpolation (enhancement overlay)
    if (this.interpolationEnabled) {
      this.updateNetworkInterpolation(deltaTime);
    }
    
    // IMMEDIATE STOP CHECK: Only for main player (only after initialization)
    if (this.isMainPlayer && this.isFullyInitialized && this.targetPosition && this.animationState === 'walking') {
      const currentPos = this.group.position;
      const targetDistance = currentPos.distanceTo(this.targetPosition);
      const currentVelocity = this.physicsBody.velocity.length();
      
      // If we're close and not moving much, stop immediately
      if (targetDistance < 0.2 && currentVelocity < 0.5) {
        DebugConsole.debug('MOVEMENT', `🛑 UPDATE LOOP STOP: Distance ${targetDistance.toFixed(3)}, velocity ${currentVelocity.toFixed(3)}`);
        this.targetPosition = null;
        this.isMoving = false;
        this.physicsBody.velocity.set(0, 0, 0);
        this.animationState = 'walking'; // Force change
        this.playAnimation('idle');
      }
    }
    
    // Sync physics to visual - only for main player
    if (this.isMainPlayer) {
      this.syncPhysicsToVisual();
    }
    
    // Safety check: Only for main player - ensure animation state matches actual movement state
    if (this.isMainPlayer && this.isFullyInitialized && Math.floor(Date.now() / 1000) % 5 === 0) { // Every 5 seconds, very infrequent
      const shouldBeMoving = this.targetPosition !== null || this.movementDirection.length() > 0;
      const actuallyMoving = this.physicsBody.velocity.length() > 0.1;
      
      // Only correct if there's a clear mismatch AND physics confirms the state
      if (shouldBeMoving && !actuallyMoving && this.animationState === 'walking') {
        DebugConsole.debug('ANIMATION', '🔧 Animation state correction: stuck walking but not moving - forcing idle');
        this.targetPosition = null;
        this.isMoving = false;
        this.animationState = 'walking'; // Force change
        this.playAnimation('idle');
      } else if (!shouldBeMoving && actuallyMoving && this.animationState === 'idle') {
        DebugConsole.debug('ANIMATION', '🔧 Animation state correction: moving but idle - forcing walking');
        this.playAnimation('walking');
      }
    }
    
    // Update nameplate to face camera
    if (this.nameplate && this.camera) {
      this.nameplate.lookAt(this.camera.position);
    }
  }
  
  private updateNetworkInterpolation(deltaTime: number): void {
    // Enhanced interpolation with proper smoothing and prediction
    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - this.lastNetworkUpdateTime;
    const isStaleMessage = timeSinceLastUpdate > 300; // Consider messages older than 300ms as stale
    
    // Interpolate position with improved logic
    if (this.networkTargetPosition) {
      const currentPos = this.group.position;
      const distance = currentPos.distanceTo(this.networkTargetPosition);
      
      if (distance > MovementConfig.MAX_INTERPOLATION_DISTANCE) {
        // If too far, teleport to prevent sliding across map
        this.group.position.copy(this.networkTargetPosition);
        this.networkTargetPosition = null; // Clear target after teleport
        DebugConsole.debug('MOVEMENT', `🚀 ${this.name}: Teleported to target (distance was ${distance.toFixed(2)})`);
        
        // Sync physics body when teleporting
        if (this.physicsBody) {
          this.physicsBody.position.copy(this.networkTargetPosition as any);
          this.physicsBody.velocity.set(0, 0, 0);
        }
      } else if (distance > 0.02) { // Reduced threshold for smoother movement
        // Use adaptive interpolation factor
        const adaptiveLerpFactor = MovementConfig.getAdaptiveInterpolationFactor(deltaTime, distance, isStaleMessage);
        this.group.position.lerp(this.networkTargetPosition, adaptiveLerpFactor);
        
        // Sync physics body position smoothly
        if (this.physicsBody) {
          const targetPhysicsPos = new CANNON.Vec3(
            this.group.position.x,
            this.group.position.y,
            this.group.position.z
          );
          this.physicsBody.position.copy(targetPhysicsPos);
          
          // Apply velocity towards target for natural movement
          const velocityDirection = new CANNON.Vec3(
            this.networkTargetPosition.x - this.group.position.x,
            0,
            this.networkTargetPosition.z - this.group.position.z
          );
          if (velocityDirection.length() > 0.001) {
            velocityDirection.normalize();
            const velocityMagnitude = Math.min(distance * MovementConfig.BASE_MOVE_SPEED * 0.5, MovementConfig.BASE_MOVE_SPEED);
            velocityDirection.scale(velocityMagnitude);
            this.physicsBody.velocity.set(velocityDirection.x, 0, velocityDirection.z);
          }
        }
        
        DebugConsole.verbose('MOVEMENT', `🌐 ${this.name}: Interpolating to target, distance: ${distance.toFixed(2)}, factor: ${adaptiveLerpFactor.toFixed(3)}`, 5000);
      } else {
        // Close enough - snap to target and clear
        this.group.position.copy(this.networkTargetPosition);
        this.networkTargetPosition = null;
        
        // Stop physics movement when reaching target
        if (this.physicsBody) {
          this.physicsBody.position.copy(this.group.position as any);
          this.physicsBody.velocity.set(0, 0, 0);
        }
        
        DebugConsole.verbose('MOVEMENT', `✅ ${this.name}: Reached interpolation target`, 3000);
      }
    }
    
    // Interpolate rotation with improved smoothing
    if (this.networkTargetRotation) {
      const currentRot = this.group.rotation;
      const targetQuat = new THREE.Quaternion().setFromEuler(this.networkTargetRotation);
      const currentQuat = new THREE.Quaternion().setFromEuler(currentRot);
      
      // Check if rotation difference is significant
      const rotationDifference = currentQuat.angleTo(targetQuat);
      
      if (rotationDifference > 0.02) { // Reduced threshold for smoother rotation
        // Use adaptive rotation interpolation
        const rotationFactor = MovementConfig.getAdaptiveInterpolationFactor(deltaTime, rotationDifference * 10, isStaleMessage);
        const adaptiveRotationFactor = Math.min(rotationFactor * 1.5, 0.9); // Slightly faster rotation
        currentQuat.slerp(targetQuat, adaptiveRotationFactor);
        this.group.rotation.setFromQuaternion(currentQuat);
        
        DebugConsole.verbose('MOVEMENT', `🔄 ${this.name}: Rotating, diff: ${rotationDifference.toFixed(3)}, factor: ${adaptiveRotationFactor.toFixed(3)}`, 5000);
      } else {
        // Close enough - snap to target and clear
        this.group.rotation.copy(this.networkTargetRotation);
        this.networkTargetRotation = null;
        
        DebugConsole.verbose('MOVEMENT', `✅ ${this.name}: Reached rotation target`, 3000);
      }
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
      
      if (distance > 0.3) {
        direction.normalize();
        
        // Face movement direction
        const angle = Math.atan2(direction.x, direction.z);
        this.group.rotation.y = angle;
        
        velocity.x = direction.x * this.moveSpeed;
        velocity.z = direction.z * this.moveSpeed;
      } else {
        // Close to target - stop immediately with no deceleration
        const wasMoving = this.targetPosition !== null || this.isMoving;
        this.targetPosition = null;
        this.isMoving = false;
        this.physicsBody.velocity.set(0, 0, 0);
        this.playAnimation('idle');
        if (wasMoving) {
          DebugConsole.debug('MOVEMENT', `🛑 CLICK-TO-MOVE: ${this.name} reached target - animation: idle`);
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
  private _getTerrainHeight(x: number, z: number): number {
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
      DebugConsole.warn('ANIMATION', `❌ Animation not found: ${targetAnimName}`);
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
    
    DebugConsole.debug('ANIMATION', `🎭 Playing animation: ${targetAnimName} (transition from ${previousAction?.getClip().name || 'none'})`);
    
    // Notify about animation state change for immediate network broadcasting
    if (this.onAnimationStateChanged) {
      this.onAnimationStateChanged(animationName);
    }
  }
  
  // Public API methods
  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }
  
  public setPosition(position: THREE.Vector3): void {
    // Debug: Log when position is being set directly
    DebugConsole.verbose('MOVEMENT', `🔧 Setting ${this.name} position to (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`, 3000);
    
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
    DebugConsole.warn('MOVEMENT', '🚨 EMERGENCY STOP: Forcing complete movement and animation stop');
    
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
    DebugConsole.debug('MOVEMENT', `🔍 Emergency stop complete - isMoving: ${this.isMoving}, hasTarget: ${this.targetPosition !== null}, isCurrentlyMoving: ${this.isCurrentlyMoving()}`);
  }
  
  public setAnimationState(state: 'idle' | 'walking' | 'running'): void {
    if (this.animationState !== state) {
      this.playAnimation(state);
    }
  }
  
  public setTerrainMesh(terrainMesh: THREE.Mesh | null): void {
    this.terrainMesh = terrainMesh;
    DebugConsole.debug('SCENE', `🏔️ Terrain mesh ${terrainMesh ? 'set' : 'cleared'} for character ${this.name}`);
  }
  
  public setInterpolationEnabled(enabled: boolean): void {
    this.interpolationEnabled = enabled;
    DebugConsole.debug('MOVEMENT', `🌐 ${this.name}: Interpolation ${enabled ? 'enabled' : 'disabled'}`);
    
    // Clear any pending interpolation targets when disabling
    if (!enabled) {
      this.networkTargetPosition = null;
      this.networkTargetRotation = null;
    }
  }
  
  public setAsMainPlayer(isMain: boolean = true): void {
    this.isMainPlayer = isMain;
    DebugConsole.info('SYSTEM', `👤 ${this.name}: Set as ${isMain ? 'MAIN' : 'OTHER'} player`);
  }
  
  public setSmoothPosition(targetPosition: THREE.Vector3): void {
    // Update network timing for adaptive interpolation
    this.lastNetworkUpdateTime = Date.now();
    
    DebugConsole.verbose('PHYSICS', `setSmoothPosition called for ${this.name}, interpolation: ${this.interpolationEnabled}`, 5000);
    
    if (this.interpolationEnabled) {
      // Set up smooth interpolation target
      this.networkTargetPosition = targetPosition.clone();
      DebugConsole.verbose('MOVEMENT', `🌐 ${this.name}: Set interpolation target (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`, 3000);
    } else {
      // Fallback: Direct position setting (reliable)
      // IMPORTANT: Clear physics velocity when setting network position to prevent drift
      if (this.physicsBody) {
        this.physicsBody.velocity.set(0, 0, 0);
        DebugConsole.verbose('PHYSICS', `${this.name}: Cleared physics velocity for network position`, 3000);
      }
      this.setPosition(targetPosition);
      DebugConsole.verbose('MOVEMENT', `📍 ${this.name}: Direct position set (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`, 3000);
    }
  }
  
  public setSmoothRotation(targetRotation: THREE.Euler): void {
    // Update network timing for adaptive interpolation
    this.lastNetworkUpdateTime = Date.now();
    
    if (this.interpolationEnabled) {
      // Set up smooth interpolation target
      this.networkTargetRotation = targetRotation.clone();
      DebugConsole.verbose('MOVEMENT', `🔄 ${this.name}: Set rotation target Y=${targetRotation.y.toFixed(2)}`, 3000);
    } else {
      // Fallback: Direct rotation setting (reliable)
      this.setRotation(targetRotation);
      DebugConsole.verbose('MOVEMENT', `🔄 ${this.name}: Direct rotation set Y=${targetRotation.y.toFixed(2)}`, 3000);
    }
  }
  
  
  public debugAnimationState(): void {
    DebugConsole.info('DEBUG', `🔍 ${this.name}: Animation State Report`);
    DebugConsole.info('DEBUG', `  - animationState: ${this.animationState}`);
    DebugConsole.info('DEBUG', `  - isFullyInitialized: ${this.isFullyInitialized}`);
    DebugConsole.info('DEBUG', `  - targetPosition: ${this.targetPosition ? 'SET' : 'NULL'}`);
    DebugConsole.info('DEBUG', `  - isMoving: ${this.isMoving}`);
    DebugConsole.info('DEBUG', `  - movementDirection length: ${this.movementDirection.length()}`);
    DebugConsole.info('DEBUG', `  - currentAction: ${this.currentAction?.getClip().name || 'NULL'}`);
    DebugConsole.info('DEBUG', `  - mixer: ${this.mixer ? 'ACTIVE' : 'NULL'}`);
    
    if (this.currentAction) {
      DebugConsole.info('DEBUG', `  - currentAction enabled: ${this.currentAction.enabled}`);
      DebugConsole.info('DEBUG', `  - currentAction weight: ${this.currentAction.getEffectiveWeight()}`);
      DebugConsole.info('DEBUG', `  - currentAction time: ${this.currentAction.time}`);
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
    
    DebugConsole.info('SYSTEM', `🧹 Destroyed character: ${this.name}`);
  }
}