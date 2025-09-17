/**
 * Character3D - 3D character representation with physics and networking
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface Character3DConfig {
  scene: THREE.Scene;
  physicsWorld: CANNON.World;
  name: string;
  characterClass: 'warrior' | 'rogue' | 'mage';
  position: THREE.Vector3;
}

export class Character3D {
  // Visual components
  private group: THREE.Group;
  private mesh: THREE.Mesh | null = null;
  private nameplate: THREE.Sprite | null = null;
  
  // Physics components
  private physicsBody: CANNON.Body;
  
  // Animation and movement
  private mixer: THREE.AnimationMixer | null = null;
  private currentAnimation: THREE.AnimationAction | null = null;
  private moveSpeed = 12; // Units per second - increased for better feel
  private isMoving = false;
  private movementDirection = new THREE.Vector3();
  private targetPosition: THREE.Vector3 | null = null;
  
  // Animation state tracking
  private currentAnimationState: 'idle' | 'walking' | 'running' = 'idle';
  private lastAnimationState: 'idle' | 'walking' | 'running' = 'idle';
  
  // Three.js animation tracking (not Phaser)
  private walkingAnimation: { active: boolean; startTime: number } = { active: false, startTime: 0 };
  
  // Click-to-move timeout tracking
  private clickMoveStartTime: number = 0;
  private readonly CLICK_MOVE_TIMEOUT = 10000; // 10 seconds max for click-to-move
  
  // Character properties
  private name: string;
  private characterClass: string;
  private health = 100;
  private maxHealth = 100;
  
  // References
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;
  
  constructor(config: Character3DConfig) {
    this.scene = config.scene;
    this.physicsWorld = config.physicsWorld;
    this.name = config.name;
    this.characterClass = config.characterClass;
    
    this.createCharacterMesh();
    this.createPhysicsBody(config.position);
    this.createNameplate();
    this.setupAnimations();
    
    // Add to scene
    this.scene.add(this.group);
    
    console.log(`✨ Created 3D character: ${this.name} (${this.characterClass})`);
  }
  
  private createCharacterMesh(): void {
    // Create group to hold all character components
    this.group = new THREE.Group();
    
    // For now, create a simple character representation
    // In production, you'd load actual 3D character models
    this.createSimpleCharacterGeometry();
  }
  
  private createSimpleCharacterGeometry(): void {
    // Create a simple character using basic geometries
    // This will be replaced with actual 3D models later
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.6, 8);
    const bodyMaterial = this.getClassMaterial();
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    head.receiveShadow = true;
    this.group.add(head);
    
    // Arms (cylinders)
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 1.2, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    this.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 1.2, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    this.group.add(rightArm);
    
    // Legs (cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.8, 6);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    this.group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    this.group.add(rightLeg);
    
    // Weapon based on class
    this.addClassSpecificWeapon();
    
    // Store main mesh reference
    this.mesh = body;
  }
  
  private getClassMaterial(): THREE.Material {
    // Different colors for different classes
    switch (this.characterClass) {
      case 'warrior':
        return new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
      case 'rogue':
        return new THREE.MeshLambertMaterial({ color: 0x2F4F2F }); // Dark green
      case 'mage':
        return new THREE.MeshLambertMaterial({ color: 0x4B0082 }); // Indigo
      default:
        return new THREE.MeshLambertMaterial({ color: 0x808080 }); // Gray
    }
  }
  
  private addClassSpecificWeapon(): void {
    let weaponGeometry: THREE.BufferGeometry;
    const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    
    switch (this.characterClass) {
      case 'warrior':
        // Sword
        weaponGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
        break;
      case 'rogue':
        // Dagger
        weaponGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
        break;
      case 'mage':
        // Staff
        weaponGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
        break;
      default:
        return; // No weapon
    }
    
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.7, 1.2, 0);
    weapon.rotation.z = -Math.PI / 4;
    weapon.castShadow = true;
    this.group.add(weapon);
  }
  
  private createPhysicsBody(position: THREE.Vector3): void {
    // Create physics body for collision detection
    const shape = new CANNON.Cylinder(0.3, 0.4, 1.6, 8);
    this.physicsBody = new CANNON.Body({
      mass: 1, // Character has mass for physics
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.1 })
    });
    
    // Lock rotation on X and Z axes (character stays upright)
    this.physicsBody.fixedRotation = true;
    this.physicsBody.updateMassProperties();
    
    this.physicsWorld.addBody(this.physicsBody);
  }
  
  private createNameplate(): void {
    // Create sprite-based nameplate
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw nameplate background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 16, canvas.width, 32);
    
    // Draw nameplate text
    context.fillStyle = '#F5F5DC';
    context.font = '24px Cinzel, serif';
    context.textAlign = 'center';
    context.fillText(this.name, canvas.width / 2, 40);
    
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    this.nameplate = new THREE.Sprite(material);
    this.nameplate.position.y = 2.5; // Above character head
    this.nameplate.scale.set(2, 0.5, 1);
    
    this.group.add(this.nameplate);
  }
  
  private setupAnimations(): void {
    // For now, create simple procedural animations
    // In production, you'd load actual animation clips
    this.mixer = new THREE.AnimationMixer(this.group);
    
    // Create simple idle animation (slight bobbing)
    const idleKeyframes = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 1, 2],
      [0, 0, 0, 0, 0.05, 0, 0, 0, 0]
    );
    
    const idleClip = new THREE.AnimationClip('idle', 2, [idleKeyframes]);
    const idleAction = this.mixer.clipAction(idleClip);
    idleAction.loop = THREE.LoopRepeat;
    
    this.currentAnimation = idleAction;
    this.currentAnimation.play();
  }
  
  public setMovementDirection(direction: THREE.Vector3): void {
    this.movementDirection.copy(direction);
    const wasMoving = this.isMoving;
    this.isMoving = direction.length() > 0;
    
    // CRITICAL: Cancel click-to-move if keyboard input detected
    if (this.isMoving && this.targetPosition) {
      console.log('🎮 WASD OVERRIDE: Canceling click-to-move target');
      this.targetPosition = null;
    }
    
    // Update character rotation to face movement direction
    if (this.isMoving) {
      const angle = Math.atan2(direction.x, direction.z);
      this.group.rotation.y = angle;
    }
    
    // Update animation state based on movement
    if (this.isMoving && !wasMoving) {
      // Started moving
      this.setAnimationState('walking');
      console.log('🚶 Started WASD walking animation');
    } else if (!this.isMoving && wasMoving) {
      // Stopped moving
      this.setAnimationState('idle');
      console.log('🛑 Stopped WASD - idle animation');
    }
  }
  
  public moveToPosition(targetPosition: THREE.Vector3, isLocalPlayer: boolean = true): void {
    // For network players, just move directly without validation
    if (!isLocalPlayer) {
      console.log(`👥 NETWORK: Moving other player to (${targetPosition.x.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
      this.setPosition(targetPosition);
      return;
    }
    
    // LOCAL PLAYER CLICK-TO-MOVE VALIDATION
    console.log('🖱️ LOCAL CLICK-TO-MOVE: Starting validation...');
    
    // Validate target position
    if (!targetPosition || !isFinite(targetPosition.x) || !isFinite(targetPosition.z)) {
      console.error('🚨 INVALID TARGET: Target position is invalid:', targetPosition);
      return;
    }
    
    const currentPos = this.group.position;
    const distance = targetPosition.distanceTo(currentPos);
    
    // Reject targets that are too far
    if (distance > 100) {
      console.warn(`🚨 TARGET TOO FAR: Distance ${distance.toFixed(1)} > 100, rejecting click-to-move`);
      return;
    }
    
    // Validate target is within reasonable world bounds
    if (Math.abs(targetPosition.x) > 95 || Math.abs(targetPosition.z) > 95) {
      console.warn(`🚨 TARGET OUT OF BOUNDS: (${targetPosition.x.toFixed(1)}, ${targetPosition.z.toFixed(1)}) - rejecting`);
      return;
    }
    
    // Cancel any existing WASD movement
    this.movementDirection.set(0, 0, 0);
    
    this.targetPosition = targetPosition.clone();
    this.targetPosition.y = 1; // Force ground level
    this.clickMoveStartTime = Date.now(); // Start timeout tracking
    
    console.log(`🖱️ VALID TARGET: Moving from (${currentPos.x.toFixed(1)}, ${currentPos.z.toFixed(1)}) to (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)}) - distance: ${distance.toFixed(1)}`);
    
    // Face the target position
    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition, this.group.position)
      .normalize();
    
    if (direction.length() > 0) {
      const angle = Math.atan2(direction.x, direction.z);
      this.group.rotation.y = angle;
    }
    
    // Set walking animation for click-to-move
    this.setAnimationState('walking');
  }
  
  public update(deltaTime: number): void {
    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    // Update Three.js-based animations
    this.updateThreeJSAnimations();
    
    // Handle movement
    this.updateMovement(deltaTime);
    
    // Sync physics body position with visual representation
    this.syncPhysicsToVisual();
    
    // Update nameplate to always face camera
    if (this.nameplate) {
      // This would need camera reference in a real implementation
      // For now, keep it simple
    }
  }
  
  private updateThreeJSAnimations(): void {
    // Handle walking animation (bobbing effect)
    if (this.walkingAnimation.active && this.mesh) {
      const elapsedTime = Date.now() - this.walkingAnimation.startTime;
      const bobIntensity = 0.05;
      const bobSpeed = 0.01;
      
      // Create bobbing effect using sine wave
      const bobOffset = Math.sin(elapsedTime * bobSpeed) * bobIntensity;
      this.mesh.scale.y = 1 + bobOffset;
    }
  }
  
  private updateMovement(deltaTime: number): void {
    const velocity = new CANNON.Vec3(0, 0, 0);
    
    // Emergency stop if character is too far from origin
    const currentPos = this.group.position;
    const distanceFromOrigin = currentPos.length();
    
    if (distanceFromOrigin > 150) {
      console.error(`🚨 EMERGENCY STOP: Character too far from origin (${distanceFromOrigin.toFixed(1)}), resetting to center`);
      this.setPosition(new THREE.Vector3(0, 1, 0));
      this.targetPosition = null;
      this.setAnimationState('idle');
      return;
    }
    
    if (this.targetPosition) {
      // Check for click-to-move timeout
      const clickMoveElapsed = Date.now() - this.clickMoveStartTime;
      if (clickMoveElapsed > this.CLICK_MOVE_TIMEOUT) {
        console.warn(`⏰ TIMEOUT: Click-to-move taking too long (${clickMoveElapsed}ms), canceling target`);
        this.targetPosition = null;
        this.setAnimationState('idle');
        return;
      }
      
      // CRITICAL FIX: Use physics body position for accurate distance calculation
      const actualCurrentPos = new THREE.Vector3(
        this.physicsBody.position.x,
        this.physicsBody.position.y,
        this.physicsBody.position.z
      );
      
      // Click-to-move behavior
      const direction = new THREE.Vector3()
        .subVectors(this.targetPosition, actualCurrentPos);
      
      const distance = direction.length();
      
      if (distance > 0.5) { // Increased threshold for more precise stopping
        direction.normalize();
        velocity.x = direction.x * this.moveSpeed;
        velocity.z = direction.z * this.moveSpeed;
        this.isMoving = true;
        
        console.log(`🏃 MOVEMENT: Current: (${actualCurrentPos.x.toFixed(1)}, ${actualCurrentPos.z.toFixed(1)}), Target: (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)}), Distance: ${distance.toFixed(1)}, Velocity: (${velocity.x.toFixed(1)}, ${velocity.z.toFixed(1)})`);
        
        // Ensure walking animation is playing
        if (this.currentAnimationState !== 'walking') {
          this.setAnimationState('walking');
        }
      } else {
        // Reached target - snap to exact position
        console.log(`🎯 REACHED TARGET: Snapping from (${actualCurrentPos.x.toFixed(1)}, ${actualCurrentPos.z.toFixed(1)}) to (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)})`);
        
        this.group.position.copy(this.targetPosition);
        this.physicsBody.position.set(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);
        this.targetPosition = null;
        this.isMoving = false;
        
        // Stop animation - go to idle
        this.setAnimationState('idle');
        console.log('🎯 Reached click target - stopping animation');
      }
    } else if (this.movementDirection.length() > 0) {
      // Keyboard movement
      const normalizedDirection = this.movementDirection.clone().normalize();
      velocity.x = normalizedDirection.x * this.moveSpeed;
      velocity.z = normalizedDirection.z * this.moveSpeed;
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
    
    // Apply movement to physics body
    this.physicsBody.velocity.x = velocity.x;
    this.physicsBody.velocity.z = velocity.z;
    
    // Keep character grounded (prevent floating)
    if (this.physicsBody.position.y > 1) {
      this.physicsBody.velocity.y = Math.min(this.physicsBody.velocity.y, 0);
    }
  }
  
  private syncPhysicsToVisual(): void {
    // Sync visual position with physics body
    this.group.position.set(
      this.physicsBody.position.x,
      Math.max(0, this.physicsBody.position.y), // Keep above ground
      this.physicsBody.position.z
    );
    
    // Debug position sync
    if (this.targetPosition) {
      console.log(`🔄 SYNC: Physics: (${this.physicsBody.position.x.toFixed(1)}, ${this.physicsBody.position.z.toFixed(1)}), Visual: (${this.group.position.x.toFixed(1)}, ${this.group.position.z.toFixed(1)})`);
    }
  }
  
  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }
  
  public setPosition(position: THREE.Vector3): void {
    this.group.position.copy(position);
    this.physicsBody.position.copy(position as any);
  }
  
  public getRotation(): THREE.Euler {
    return this.group.rotation.clone();
  }
  
  public setRotation(rotation: THREE.Euler): void {
    this.group.rotation.copy(rotation);
  }
  
  // Expose group for direct access (needed for rotation in Game3DScene)
  public getGroup(): THREE.Group {
    return this.group;
  }
  
  public setOpacity(opacity: number): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.transparent = opacity < 1;
            material.opacity = opacity;
          });
        } else {
          child.material.transparent = opacity < 1;
          child.material.opacity = opacity;
        }
      }
    });
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
    return this.currentAnimationState;
  }
  
  public emergencyStop(): void {
    console.log('🚨 EMERGENCY STOP: Clearing all movement and targets');
    this.targetPosition = null;
    this.movementDirection.set(0, 0, 0);
    this.isMoving = false;
    this.setAnimationState('idle');
    
    // Stop physics movement
    this.physicsBody.velocity.set(0, 0, 0);
  }
  
  public setAnimationState(state: 'idle' | 'walking' | 'running', force: boolean = false): void {
    if (this.currentAnimationState !== state || force) {
      this.lastAnimationState = this.currentAnimationState;
      this.currentAnimationState = state;
      
      console.log(`🎭 Animation state changed: ${this.lastAnimationState} → ${this.currentAnimationState}`);
      
      // Update visual animation
      this.updateAnimationVisuals();
    }
  }
  
  private updateAnimationVisuals(): void {
    // Update visual representation based on animation state
    switch (this.currentAnimationState) {
      case 'idle':
        this.stopMovementAnimation();
        break;
      case 'walking':
      case 'running':
        this.startMovementAnimation();
        break;
    }
  }
  
  private startMovementAnimation(): void {
    // Start Three.js-based movement animation
    this.walkingAnimation.active = true;
    this.walkingAnimation.startTime = Date.now();
    console.log('🚶 Started Three.js walking animation');
  }
  
  private stopMovementAnimation(): void {
    // Stop Three.js-based movement animation
    this.walkingAnimation.active = false;
    
    // Reset mesh scale
    if (this.mesh) {
      this.mesh.scale.set(1, 1, 1);
    }
    console.log('🛑 Stopped Three.js walking animation');
  }
  
  public getHealth(): number {
    return this.health;
  }
  
  public setHealth(health: number): void {
    this.health = Math.max(0, Math.min(health, this.maxHealth));
    
    // Update visual health indicator if needed
    this.updateHealthDisplay();
  }
  
  private updateHealthDisplay(): void {
    // Add health bar above nameplate
    // Implementation would go here
  }
  
  public takeDamage(damage: number): void {
    this.setHealth(this.health - damage);
    
    // Add damage animation/effect
    this.playDamageEffect();
  }
  
  private playDamageEffect(): void {
    // Flash red briefly
    if (this.mesh) {
      const originalMaterial = this.mesh.material;
      const damageMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      
      this.mesh.material = damageMaterial;
      
      setTimeout(() => {
        if (this.mesh) {
          this.mesh.material = originalMaterial;
        }
      }, 200);
    }
  }
  
  public playAnimation(animationName: string): void {
    // Switch to different animation
    // Implementation would depend on loaded animation clips
    console.log(`Playing animation: ${animationName}`);
  }
  
  public destroy(): void {
    // Remove from physics world
    this.physicsWorld.removeBody(this.physicsBody);
    
    // Remove from scene
    this.scene.remove(this.group);
    
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
    
    // Clean up animations
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    console.log(`🧹 Destroyed 3D character: ${this.name}`);
  }
}
