/**
 * Game3DScene - Three.js 3D game world with Neverwinter Nights-style gameplay
 * This scene will eventually replace GameScene.ts as we migrate to full 3D
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameStore } from '../stores/gameStore';
import { Character3D } from '../utils/Character3D';
import { Environment3D } from '../utils/Environment3D';
import { NetworkManager3D } from '../utils/NetworkManager3D';

export interface Game3DConfig {
  container: HTMLElement;
  width: number;
  height: number;
}

export class Game3DScene {
  // Core Three.js components
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  
  // Physics world
  private physicsWorld: CANNON.World;
  
  // Game systems
  private gameStore: GameStore;
  private character: Character3D | null = null;
  private environment: Environment3D | null = null;
  private networkManager: NetworkManager3D | null = null;
  
  // Multiplayer
  private otherPlayers: Map<string, Character3D> = new Map();
  
  // 3D Movement broadcasting
  private lastBroadcastPosition: THREE.Vector3 | null = null;
  private lastBroadcastRotation: THREE.Quaternion | null = null;
  private movementBroadcastTimer: number | null = null;
  private lastBroadcastTime: number = 0;
  private isMoving3D: boolean = false; // Track movement state for broadcasting
  private readonly MOVEMENT_BROADCAST_INTERVAL = 50; // 20 FPS for smooth 3D movement
  private readonly MIN_MOVEMENT_DISTANCE = 0.5; // Units in 3D space
  private readonly MAX_BROADCAST_DELAY = 100; // Maximum delay between broadcasts
  
  // Input handling
  private keys: { [key: string]: boolean } = {};
  private mouse = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  
  // Performance tracking
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  
  // Camera controls
  private cameraTarget = new THREE.Vector3();
  private cameraDistance = 15;
  private cameraHeight = 10;
  private cameraAngle = Math.PI / 6; // 30 degrees
  private cameraRotationY = 0;
  
  constructor(config: Game3DConfig) {
    this.gameStore = GameStore.getInstance();
    
    this.initializeThreeJS(config);
    this.initializePhysics();
    this.initializeEnvironment();
    this.initializeInput();
    this.initializeNetworking();
    
    // Start the render loop
    this.animate();
    
    console.log('🎮 3D Game Scene initialized - Welcome to 3D HemoclastOnline!');
  }
  
  private initializeThreeJS(config: Game3DConfig): void {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4a4a4a); // Lighter gritty background
    this.clock = new THREE.Clock();
    
    // Create camera (perspective for 3D depth)
    this.camera = new THREE.PerspectiveCamera(
      60, // Field of view
      config.width / config.height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    // Create renderer with optimizations
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable shadows for atmospheric lighting
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enhanced lighting for gothic atmosphere
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    
    // Add renderer to DOM
    config.container.appendChild(this.renderer.domElement);
    
    // Add atmospheric lighting
    this.setupLighting();
  }
  
  private setupLighting(): void {
    // Ambient light (brighter for gritty atmosphere)
    const ambientLight = new THREE.AmbientLight(0x808080, 0.6); // Much brighter ambient
    this.scene.add(ambientLight);
    
    // Directional light (stronger sunlight)
    const directionalLight = new THREE.DirectionalLight(0xFFE4B5, 1.2); // Warm daylight
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Shadow settings
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    this.scene.add(directionalLight);
    
    // Atmospheric fog for depth (lighter and less dense)
    this.scene.fog = new THREE.Fog(0x6a6a6a, 80, 300);
  }
  
  private initializePhysics(): void {
    // Create Cannon.js physics world
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0); // Earth gravity
    this.physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    
    // Create ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 }); // Static body
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.physicsWorld.addBody(groundBody);
  }
  
  private async initializeEnvironment(): Promise<void> {
    // Create 3D environment manager
    this.environment = new Environment3D(this.scene, this.physicsWorld);
    await this.environment.loadBasicEnvironment();
  }
  
  private async initializeCharacter(): Promise<void> {
    if (!this.environment) return;
    
    // Get character data from game store
    const gameState = this.gameStore.store.getState();
    let characterData = gameState.currentCharacter;
    
    // Try to load character data from localStorage if not in game store
    if (!characterData) {
      const characterId = localStorage.getItem('hemoclast_character_id');
      if (characterId) {
        console.log('Loading character data from localStorage for 3D scene');
        try {
          const token = localStorage.getItem('hemoclast_token');
          if (token) {
            const response = await fetch('/api/v1/characters/', {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const characters = await response.json();
              characterData = characters.find((char: any) => char.id.toString() === characterId);
              
              if (characterData) {
                console.log('✅ Loaded character for 3D world:', characterData.name);
                // Update game store with character data
                gameState.setCharacter(characterData);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load character data:', error);
        }
      }
    }
    
    // Fallback to guest character or create default
    if (!characterData) {
      const guestCharacter = localStorage.getItem('hemoclast_guest_character');
      if (guestCharacter) {
        try {
          characterData = JSON.parse(guestCharacter);
          console.log('✅ Using guest character for 3D world:', characterData.name);
        } catch (e) {
          console.warn('Failed to parse guest character data:', e);
        }
      }
    }
    
    // Final fallback to test character
    if (!characterData) {
      console.log('Creating default test character for 3D scene');
      characterData = {
        id: 999,
        name: 'Test Character',
        character_class: 'warrior',
        level: 1
      };
    }
    
    // Create 3D character
    this.character = new Character3D({
      scene: this.scene,
      physicsWorld: this.physicsWorld,
      name: characterData.name || 'Player',
      characterClass: characterData.character_class || 'warrior',
      position: new THREE.Vector3(0, 1, 0) // Start above ground
    });
    
    console.log('✨ Created 3D character:', {
      name: characterData.name,
      class: characterData.character_class,
      level: characterData.level
    });
    
    // Set camera to follow character
    this.cameraTarget.copy(this.character.getPosition());
    this.updateCameraPosition();
  }
  
  private initializeInput(): void {
    // Keyboard input
    window.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
      
      // Camera rotation with Q/E keys
      if (event.code === 'KeyQ') {
        this.cameraRotationY -= 0.1;
      } else if (event.code === 'KeyE') {
        this.cameraRotationY += 0.1;
      }
      
      // Emergency stop with X key
      if (event.code === 'KeyX' && this.character) {
        console.log('🚨 MANUAL EMERGENCY STOP: X key pressed');
        this.character.emergencyStop();
      }
    });
    
    window.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });
    
    // Mouse input for click-to-move
    this.renderer.domElement.addEventListener('click', (event) => {
      this.handleMouseClick(event);
    });
    
    // Mouse wheel for camera zoom
    this.renderer.domElement.addEventListener('wheel', (event) => {
      this.cameraDistance += event.deltaY * 0.01;
      this.cameraDistance = Math.max(5, Math.min(30, this.cameraDistance));
      event.preventDefault();
    });
  }
  
  private async initializeNetworking(): Promise<void> {
    // Initialize 3D network manager
    this.networkManager = new NetworkManager3D(this.gameStore);
    
    // Set up network event handlers
    this.networkManager.onPlayerJoined = (playerData) => {
      this.handlePlayerJoined(playerData);
    };
    
    this.networkManager.onPlayerMoved = (playerData) => {
      this.handlePlayerMoved(playerData);
    };
    
    this.networkManager.onPlayerLeft = (playerId) => {
      this.handlePlayerLeft(playerId);
    };
    
    // Connect to multiplayer server
    await this.networkManager.connect();
  }
  
  private handleMouseClick(event: MouseEvent): void {
    if (!this.character) return;
    
    console.log('🖱️ CLICK DEBUG: Mouse click detected');
    
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    console.log(`🖱️ CLICK DEBUG: Mouse NDC: (${this.mouse.x.toFixed(3)}, ${this.mouse.y.toFixed(3)})`);
    console.log(`🖱️ CLICK DEBUG: Camera position: (${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`);
    
    // Cast ray from camera through mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    console.log(`🖱️ CLICK DEBUG: Ray origin: (${this.raycaster.ray.origin.x.toFixed(1)}, ${this.raycaster.ray.origin.y.toFixed(1)}, ${this.raycaster.ray.origin.z.toFixed(1)})`);
    console.log(`🖱️ CLICK DEBUG: Ray direction: (${this.raycaster.ray.direction.x.toFixed(3)}, ${this.raycaster.ray.direction.y.toFixed(3)}, ${this.raycaster.ray.direction.z.toFixed(3)})`);
    
    // Alternative approach: Intersect with actual terrain if available
    let targetPosition: THREE.Vector3 | null = null;
    let intersectionFound = false;
    
    // Try to intersect with terrain mesh first
    if (this.environment && this.environment.terrain) {
      const intersects = this.raycaster.intersectObject(this.environment.terrain);
      if (intersects.length > 0) {
        targetPosition = intersects[0].point;
        intersectionFound = true;
        console.log(`🖱️ CLICK DEBUG: Terrain intersection found`);
      }
    }
    
    // Fallback to ground plane intersection
    if (!intersectionFound) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      targetPosition = new THREE.Vector3();
      intersectionFound = this.raycaster.ray.intersectPlane(groundPlane, targetPosition) !== null;
      console.log(`🖱️ CLICK DEBUG: Ground plane intersection: ${intersectionFound}`);
    }
    
    console.log(`🖱️ CLICK DEBUG: Intersection found: ${intersectionFound !== null}`);
    
    if (intersectionFound && targetPosition) {
      console.log(`🖱️ CLICK DEBUG: Raw intersection: (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
      
      // Check if intersection is reasonable
      const distanceFromOrigin = targetPosition.length();
      const characterPos = this.character.getPosition();
      const distanceFromCharacter = targetPosition.distanceTo(characterPos);
      
      console.log(`🖱️ CLICK DEBUG: Distance from origin: ${distanceFromOrigin.toFixed(1)}`);
      console.log(`🖱️ CLICK DEBUG: Distance from character: ${distanceFromCharacter.toFixed(1)}`);
      
      // Reject unreasonable targets
      if (distanceFromOrigin > 200 || distanceFromCharacter > 100) {
        console.warn(`🚨 CLICK DEBUG: Target too far, rejecting. Origin: ${distanceFromOrigin.toFixed(1)}, Character: ${distanceFromCharacter.toFixed(1)}`);
        return;
      }
      
      // Clamp target position to reasonable bounds
      const maxDistance = 90;
      targetPosition.x = Math.max(-maxDistance, Math.min(maxDistance, targetPosition.x));
      targetPosition.z = Math.max(-maxDistance, Math.min(maxDistance, targetPosition.z));
      targetPosition.y = 1; // Keep character at ground level
      
      console.log(`🖱️ CLICK DEBUG: Final target: (${targetPosition.x.toFixed(1)}, ${targetPosition.y}, ${targetPosition.z.toFixed(1)})`);
      
      // Move character to clicked position
      this.character.moveToPosition(targetPosition);
    } else {
      console.warn('🚨 CLICK DEBUG: No intersection found with ground plane');
    }
  }
  
  private handleInput(): void {
    if (!this.character) return;
    
    // WASD movement
    const moveVector = new THREE.Vector3();
    
    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;
    
    // Apply camera rotation to movement
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotationY);
      this.character.setMovementDirection(moveVector);
      
      // Start broadcasting movement immediately when movement begins
      if (!this.isMoving3D) {
        this.isMoving3D = true;
        console.log('🎮 Started WASD movement - beginning broadcast');
      }
    } else {
      this.character.setMovementDirection(new THREE.Vector3(0, 0, 0));
      
      // Stop broadcasting when movement ends
      if (this.isMoving3D) {
        this.isMoving3D = false;
        console.log('🛑 Stopped WASD movement - final broadcast');
        // Send one final position update
        this.broadcastMovementIfNeeded();
      }
    }
  }
  
  private updateCameraPosition(): void {
    if (!this.character) return;
    
    // Smooth camera following
    const characterPos = this.character.getPosition();
    this.cameraTarget.lerp(characterPos, 0.05);
    
    // Calculate camera position based on target, distance, height, and rotation
    const cameraX = this.cameraTarget.x + Math.sin(this.cameraRotationY) * this.cameraDistance;
    const cameraZ = this.cameraTarget.z + Math.cos(this.cameraRotationY) * this.cameraDistance;
    const cameraY = this.cameraTarget.y + this.cameraHeight;
    
    this.camera.position.set(cameraX, cameraY, cameraZ);
    this.camera.lookAt(this.cameraTarget);
  }
  
  private handlePlayerJoined(playerData: any): void {
    const playerId = playerData.client_id;
    
    console.log('🎭 MULTIPLAYER: Player joining 3D world:', {
      clientId: playerId,
      name: playerData.character_name,
      class: playerData.character_class,
      position: playerData.position,
      currentPlayers: this.otherPlayers.size
    });
    
    if (this.otherPlayers.has(playerId)) {
      console.log('⚠️ Player already exists, skipping');
      return;
    }
    
    // Create 3D representation of other player with slight spawn offset
    const spawnX = (playerData.position?.x || 0) + (Math.random() - 0.5) * 4; // Random offset ±2 units
    const spawnZ = (playerData.position?.z || 0) + (Math.random() - 0.5) * 4;
    
    const otherPlayer = new Character3D({
      scene: this.scene,
      physicsWorld: this.physicsWorld,
      name: playerData.character_name || 'Other Player',
      characterClass: playerData.character_class || 'warrior',
      position: new THREE.Vector3(spawnX, 1, spawnZ)
    });
    
    // Make other players slightly transparent and add glow effect
    otherPlayer.setOpacity(0.9);
    
    this.otherPlayers.set(playerId, otherPlayer);
    console.log(`✅ MULTIPLAYER: Created player ${playerData.character_name} at (${spawnX.toFixed(1)}, 1, ${spawnZ.toFixed(1)}). Total players: ${this.otherPlayers.size + 1}`);
  }
  
  private handlePlayerMoved(playerData: any): void {
    const playerId = playerData.client_id;
    const otherPlayer = this.otherPlayers.get(playerId);
    
    if (!otherPlayer || !playerData.position) {
      console.log(`⚠️ Cannot update player ${playerId}: player not found or no position data`);
      return;
    }
    
    console.log(`🏃 MULTIPLAYER: Player ${playerData.character_name} moved to (${playerData.position.x.toFixed(1)}, ${playerData.position.y.toFixed(1)}, ${playerData.position.z.toFixed(1)})`);
    
    // Update other player's position smoothly
    const targetPosition = new THREE.Vector3(
      playerData.position.x,
      playerData.position.y,
      playerData.position.z
    );
    
    // Update rotation if provided
    if (playerData.rotation) {
      const targetRotation = new THREE.Euler(
        playerData.rotation.x,
        playerData.rotation.y,
        playerData.rotation.z
      );
      otherPlayer.setRotation(targetRotation);
    }
    
    // Apply animation state BEFORE moving
    if (playerData.animation) {
      console.log(`🎭 Setting animation state for ${playerData.character_name}: ${playerData.animation}`);
      otherPlayer.setAnimationState(playerData.animation as 'idle' | 'walking' | 'running', true);
    }
    
    // Move other player (NOT local player) - use network movement
    if (playerData.animation !== 'idle') {
      otherPlayer.moveToPosition(targetPosition, false); // false = not local player
    } else {
      // If idle, snap to position immediately (no sliding)
      otherPlayer.setPosition(targetPosition);
      console.log(`🛑 Player ${playerData.character_name} is idle - snapping to position`);
    }
  }
  
  private handlePlayerLeft(playerId: string): void {
    const otherPlayer = this.otherPlayers.get(playerId);
    
    if (otherPlayer) {
      otherPlayer.destroy();
      this.otherPlayers.delete(playerId);
      console.log(`✓ Player ${playerId} left the 3D world`);
    }
  }
  
  private broadcastMovementIfNeeded(): void {
    if (!this.character || !this.networkManager) return;
    
    const currentTime = Date.now();
    const currentPosition = this.character.getPosition();
    const currentRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.character.getRotation().y, 0));
    const isCharacterMoving = this.character.isCurrentlyMoving();
    
    // Check if we should broadcast
    let shouldBroadcast = false;
    
    if (!this.lastBroadcastPosition || !this.lastBroadcastRotation) {
      // First broadcast
      shouldBroadcast = true;
    } else {
      const positionChange = currentPosition.distanceTo(this.lastBroadcastPosition);
      const rotationChange = Math.abs(currentRotation.angleTo(this.lastBroadcastRotation));
      const timeSinceLastBroadcast = currentTime - this.lastBroadcastTime;
      
      // Broadcast if:
      // 1. Position changed significantly
      // 2. Rotation changed significantly  
      // 3. Maximum time delay reached
      // 4. Movement state changed (started/stopped moving)
      shouldBroadcast = positionChange >= this.MIN_MOVEMENT_DISTANCE ||
                       rotationChange >= 0.1 ||
                       timeSinceLastBroadcast >= this.MAX_BROADCAST_DELAY ||
                       (isCharacterMoving !== this.isMoving3D);
    }
    
    if (shouldBroadcast) {
      // Update tracking variables
      this.lastBroadcastPosition = currentPosition.clone();
      this.lastBroadcastRotation = currentRotation.clone();
      this.lastBroadcastTime = currentTime;
      this.isMoving3D = isCharacterMoving;
      
      // Get current animation state from character
      const animationState = this.character.getCurrentAnimationState();
      
      // Broadcast the update
      this.networkManager.broadcastPlayerUpdate(
        currentPosition, 
        currentRotation, 
        animationState
      );
      
      console.log(`📡 Broadcasting 3D position: (${currentPosition.x.toFixed(1)}, ${currentPosition.y.toFixed(1)}, ${currentPosition.z.toFixed(1)}) - ${animationState}`);
    }
  }

  private updatePerformanceStats(): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    // Initialize lastFrameTime if not set
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return;
    }
    
    if (currentTime - this.lastFrameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
      
      // Only warn about low FPS after the scene has had time to stabilize
      if (this.fps < 30 && this.fps > 0) {
        console.warn(`⚠️ Low FPS detected: ${this.fps}`);
      }
    }
  }
  
  public async start(): Promise<void> {
    // Initialize character after environment is ready
    await this.initializeCharacter();
    
    console.log('🚀 3D Game Scene started successfully!');
  }
  
  public update(): void {
    const deltaTime = this.clock.getDelta();
    
    // Handle input
    this.handleInput();
    
    // Update physics
    this.physicsWorld.step(1/60, deltaTime, 3);
    
    // Update character
    if (this.character) {
      this.character.update(deltaTime);
      
      // Broadcast movement if character is moving or position changed
      this.broadcastMovementIfNeeded();
    }
    
    // Update other players
    this.otherPlayers.forEach(player => {
      player.update(deltaTime);
    });
    
    // Update camera
    this.updateCameraPosition();
    
    // Update environment
    if (this.environment) {
      this.environment.update(deltaTime);
    }
    
    // Update networking
    if (this.networkManager) {
      this.networkManager.update(deltaTime);
    }
    
    // Performance tracking
    this.updatePerformanceStats();
  }
  
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    this.update();
    this.render();
  };
  
  public handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  public getFPS(): number {
    return this.fps;
  }
  
  public getTriangleCount(): number {
    return this.renderer.info.render.triangles;
  }
  
  public destroy(): void {
    // Clean up Three.js resources
    this.scene.clear();
    this.renderer.dispose();
    
    // Clean up physics
    this.physicsWorld.bodies.forEach(body => {
      this.physicsWorld.removeBody(body);
    });
    
    // Clean up other players
    this.otherPlayers.forEach(player => {
      player.destroy();
    });
    this.otherPlayers.clear();
    
    // Clean up character
    if (this.character) {
      this.character.destroy();
    }
    
    // Clean up network manager
    if (this.networkManager) {
      this.networkManager.disconnect();
    }
    
    console.log('🧹 3D Game Scene cleaned up');
  }
}
