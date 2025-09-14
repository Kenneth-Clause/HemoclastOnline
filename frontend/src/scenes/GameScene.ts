/**
 * Game Scene - RuneScape-like game world with omnidirectional character movement
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { Character } from '../utils/Character';
import { TileMap } from '../utils/TileMap';
import { InputManager } from '../utils/InputManager';

export class GameScene extends Scene {
  private gameStore: GameStore;
  private character: Character | null = null;
  private tileMap: TileMap | null = null;
  private inputManager: InputManager | null = null;
  private camera: Phaser.Cameras.Scene2D.Camera | null = null;
  
  // Multiplayer
  private otherPlayers: Map<string, Character> = new Map();
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  
  // Movement synchronization
  private lastBroadcastPosition: { x: number, y: number } | null = null;
  private movementBroadcastTimer: Phaser.Time.TimerEvent | null = null;
  private lastBroadcastTime: number = 0;
  private isPathfinding: boolean = false; // Track if character is following a path
  private readonly MOVEMENT_BROADCAST_INTERVAL = 100; // Higher frequency (10 FPS) for smoother animations
  private readonly MIN_MOVEMENT_DISTANCE = 3; // Lower threshold for more responsive movement
  private readonly MAX_BROADCAST_DELAY = 120; // Shorter delay for better responsiveness
  private readonly POSITION_PRECISION = 1; // Round positions to nearest pixel for consistency
  
  // Multiplayer movement tracking
  private otherPlayerTargets: Map<string, { x: number, y: number, timestamp: number }> = new Map();
  private otherPlayerSmoothMovement: Map<string, Phaser.Tweens.Tween | null> = new Map();
  private lastBroadcastDirection: string | null = null;
  
  // Game world settings
  private readonly TILE_SIZE = 32;
  private readonly MAP_WIDTH = 50;
  private readonly MAP_HEIGHT = 50;
  private readonly CHARACTER_SPEED = 2;

  constructor() {
    super({ key: 'GameScene' });
    this.gameStore = GameStore.getInstance();
  }

  async create() {
    
    // Ensure we have the current character loaded
    await this.ensureCharacterLoaded();
    
    // Create the tile-based world
    this.createTileWorld();
    
    // Create and setup the character
    this.createCharacter();
    
    // Setup camera to follow character
    this.setupCamera();
    
    // Setup input handling
    this.setupInput();
    
    // Create UI elements (preserving Gothic styling)
    this.createUI();
    
    // Add atmospheric effects (keeping the Gothic theme)
    this.createAtmosphericEffects();
    
    // Initialize multiplayer connection
    await this.initializeMultiplayer();
  }

  private async ensureCharacterLoaded(): Promise<void> {
    const gameState = this.gameStore.store.getState();
    const characterId = localStorage.getItem('hemoclast_character_id');
    
    // If we already have character data in game state, we're good
    if (gameState.currentCharacter?.name) {
      console.log('Character already loaded in game state:', gameState.currentCharacter.name);
      return;
    }
    
    // If we have a character ID but no character data, try to reload from API
    if (characterId) {
      console.log('Attempting to reload character from API, ID:', characterId);
      
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
            const currentCharacter = characters.find((char: any) => char.id.toString() === characterId);
            
            if (currentCharacter) {
              console.log('Reloaded character from API:', currentCharacter.name);
              gameState.setCharacter(currentCharacter);
              return;
            } else {
              console.warn('Character not found in API response:', characterId);
            }
          } else {
            console.warn('Failed to reload character from API:', response.status);
          }
        }
      } catch (error) {
        console.warn('Error reloading character from API:', error);
      }
    }
    
    // Final fallback: check for guest character
    const guestCharacter = localStorage.getItem('hemoclast_guest_character');
    if (guestCharacter) {
      try {
        const guestData = JSON.parse(guestCharacter);
        console.log('Loading guest character:', guestData.name);
        gameState.setCharacter(guestData);
      } catch (e) {
        console.warn('Failed to parse guest character data:', e);
      }
    }
  }

  private createTileWorld(): void {
    // Create the tile-based map
    this.tileMap = new TileMap(this, {
      width: this.MAP_WIDTH,
      height: this.MAP_HEIGHT,
      tileSize: this.TILE_SIZE
    });
    
    // Set world bounds for physics and camera
    const worldBounds = this.tileMap.getWorldBounds();
    this.physics.world.setBounds(0, 0, worldBounds.width, worldBounds.height);
  }

  private createCharacter(): void {
    if (!this.tileMap) return;
    
    // Get center position of the map
    const centerPos = this.tileMap.getCenterPosition();
    
    // Get character name for display (not username)
    const gameState = this.gameStore.store.getState();
    let characterName = gameState.currentCharacter?.name;
    
    console.log('Character name resolution debug:', {
      gameStateCharacter: gameState.currentCharacter,
      characterName: characterName,
      characterId: localStorage.getItem('hemoclast_character_id'),
      playerId: localStorage.getItem('hemoclast_player_id')
    });
    
    if (!characterName) {
      // Fallback 1: Check localStorage for guest character
      const guestCharacter = localStorage.getItem('hemoclast_guest_character');
      if (guestCharacter) {
        try {
          const guestData = JSON.parse(guestCharacter);
          characterName = guestData.name;
        } catch (e) {
          console.warn('Failed to parse guest character data:', e);
        }
      }
    }
    
    if (!characterName) {
      // No valid character name found - this shouldn't happen if character is properly selected
      characterName = 'Your Character';
      console.warn('No character name found for local character - character may not be properly selected');
    }
    
    // Create the character with nameplate showing character name
    this.character = new Character(this, {
      x: centerPos.x,
      y: centerPos.y,
      tileSize: this.TILE_SIZE,
      speed: this.CHARACTER_SPEED,
      name: characterName,
      showName: true
    });
  }

  private setupCamera(): void {
    if (!this.character || !this.tileMap) return;
    
    // Get main camera
    this.camera = this.cameras.main;
    
    // Set world bounds for camera
    const worldBounds = this.tileMap.getWorldBounds();
    this.camera.setBounds(0, 0, worldBounds.width, worldBounds.height);
    
    // Make camera follow the character smoothly
    this.camera.startFollow(this.character, true, 0.05, 0.05);
    
    // Set zoom level (adjust as needed)
    this.camera.setZoom(1.5);
  }

  private setupInput(): void {
    // Create input manager
    this.inputManager = new InputManager(this, {
      enableKeyboard: true,
      enableMouse: true,
      enableTouch: true
    });
    
    // Handle movement input
    this.inputManager.onMovementStart((direction: string) => {
      if (this.character) {
        // WASD takes priority - cancel any ongoing click-to-move
        if (this.isPathfinding) {
          console.log('🎮 WASD interrupted click-to-move');
          this.character.stopPathFollowing(); // Stop pathfinding
          this.character.cancelTweenMovement(); // Stop any tween movement
          this.isPathfinding = false;
          this.stopMovementBroadcasting();
        }
        
        this.character.startMoving(direction);
        
        // Start real-time movement broadcasting
        this.startMovementBroadcasting();
        
        // Immediately broadcast movement start for instant feedback
        this.broadcastPlayerMovement(this.character.x, this.character.y);
      }
    });
    
    this.inputManager.onMovementStop(() => {
      if (this.character) {
        console.log('🛑 Movement stopped - broadcasting final position');
        this.character.stopMoving();
        
        // Stop real-time broadcasting and send final position
        this.stopMovementBroadcasting();
        
        // Send final precise position (this should broadcast 'idle' state)
        this.broadcastPlayerMovement(this.character.x, this.character.y);
      }
    });
    
    // Handle mouse/touch click movement
    this.inputManager.onMouseClickEvent((worldX: number, worldY: number) => {
      if (this.character && this.tileMap) {
        // Click-to-move takes priority - stop any ongoing WASD movement
        if (this.character.isCurrentlyMoving() && !this.isPathfinding) {
          console.log('🖱️ Click-to-move interrupted WASD');
          this.character.stopMoving(); // Stop WASD movement
          this.stopMovementBroadcasting();
        }
        
        // Find nearest walkable tile
        const targetPos = this.tileMap.findNearestWalkableTile(worldX, worldY);
        if (targetPos) {
          // Ensure precise target coordinates
          const preciseTargetX = Math.round(targetPos.x / this.POSITION_PRECISION) * this.POSITION_PRECISION;
          const preciseTargetY = Math.round(targetPos.y / this.POSITION_PRECISION) * this.POSITION_PRECISION;
          
          // Move character to clicked position with enhanced smoothness
          this.character.smoothMoveToPosition(preciseTargetX, preciseTargetY, this.tileMap, () => {
            // Called when movement completes (for tween-based short distance moves)
            this.isPathfinding = false;
            this.stopMovementBroadcasting();
            // Send final position to ensure other players see the character stop
            this.broadcastPlayerMovement(this.character!.x, this.character!.y);
            console.log('🎯 Click-to-move completed - broadcasting final idle state');
          });
          
          // Mark as pathfinding and start broadcasting actual position during movement
          this.isPathfinding = true;
          this.startMovementBroadcasting();
          
          // DON'T broadcast target position immediately - let the movement broadcasting handle it
          // The character will broadcast its actual position as it moves toward the target
        }
      }
    });

    // Handle nameplate toggle
    this.inputManager.onNameplateToggle(() => {
      if (this.character) {
        this.character.toggleNameplate();
      }
    });
  }

  private createUI(): void {
    const { width, height } = this.scale;
    
    // Create a simple UI overlay that stays fixed to camera
    const uiContainer = this.add.container(0, 0);
    uiContainer.setScrollFactor(0); // Keep UI fixed to screen
    
    // Gothic-styled mini-map background (top-right corner)
    const miniMapBg = this.add.rectangle(width - 120, 80, 200, 150, 0x2d1b1b, 0.8);
    miniMapBg.setStrokeStyle(2, 0x8B0000);
    uiContainer.add(miniMapBg);
    
    // Mini-map title
    const miniMapTitle = this.add.text(width - 120, 30, 'World Map', {
      fontSize: '16px',
      color: '#8B0000',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    uiContainer.add(miniMapTitle);
    
    // Instructions (bottom-left corner)
    const instructions = this.add.text(20, height - 100, 
      'WASD/Arrow Keys: Move\nMouse Click: Move to location\nN Key: Toggle nameplate', {
      fontSize: '14px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
      backgroundColor: 'rgba(45, 27, 27, 0.8)',
      padding: { x: 10, y: 8 }
    }).setOrigin(0, 1);
    uiContainer.add(instructions);
    
    // Return to menu button (top-left corner)
    GothicTitleUtils.createEnhancedGothicButton(
      this,
      80,
      30,
      140,
      30,
      '← Return to Menu',
      () => {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      },
      {
        fontSize: 12,
        bgColor: 0x2d1b1b,
        borderColor: 0x8B0000,
        textColor: '#F5F5DC',
        hoverBgColor: 0x4a0000,
        hoverBorderColor: 0xDC143C,
        hoverTextColor: '#FFD700',
        glowEffect: true,
        shadowEffect: true
      }
    );
    // Menu button is already created with fixed positioning
  }

  private createAtmosphericEffects(): void {
    // Add subtle Gothic atmospheric particles that don't interfere with gameplay
    const worldBounds = this.tileMap?.getWorldBounds();
    if (!worldBounds) return;
    
    // Create floating particles across the world
    GothicTitleUtils.createAtmosphericParticles(this, worldBounds.width, worldBounds.height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22, 0x8B4513],
      quantity: 8,
      speed: { min: 10, max: 30 },
      alpha: { min: 0.05, max: 0.15 },
      scale: { min: 0.2, max: 0.8 }
    });
    
    // Add subtle ambient lighting effects
    const ambientOverlay = this.add.rectangle(
      worldBounds.width / 2, 
      worldBounds.height / 2, 
      worldBounds.width, 
      worldBounds.height, 
      0x1a0a0a, 
      0.2
    );
    ambientOverlay.setDepth(-1); // Behind everything else
  }

  private async initializeMultiplayer(): Promise<void> {
    try {
      // Generate unique client ID from player and character data
      const playerId = localStorage.getItem('hemoclast_player_id');
      const characterId = localStorage.getItem('hemoclast_character_id');
      
      if (!playerId || !characterId) {
        console.warn('Missing player or character ID for multiplayer connection');
        return;
      }
      
      const clientId = `${playerId}_${characterId}`;
      
      // Determine WebSocket URL (handle both development and production)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // In development, connect to backend on port 8000
      // In production, use the same host as the frontend
      let host = window.location.host;
      if (window.location.port === '5173') {
        // Development mode - connect to backend on port 8000
        host = window.location.hostname + ':8000';
      }
      
      const wsUrl = `${protocol}//${host}/ws/${clientId}`;
      
      console.log('Connecting to multiplayer server:', wsUrl);
      
      // Create WebSocket connection
      const websocket = new WebSocket(wsUrl);
      
      // Setup WebSocket event handlers
      websocket.onopen = () => {
        console.log('Connected to multiplayer server');
        this.gameStore.store.getState().setWebSocket(websocket);
        this.gameStore.store.getState().setConnected(true);
        
        // Reset reconnection attempts on successful connection
        this.reconnectAttempts = 0;
        
        // Send initial player spawn message
        this.sendPlayerSpawn();
      };
      
      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMultiplayerMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.gameStore.store.getState().setConnected(false);
      };
      
      websocket.onclose = () => {
        console.log('Disconnected from multiplayer server');
        this.gameStore.store.getState().setWebSocket(null);
        this.gameStore.store.getState().setConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000); // Cap at 10 seconds
          console.log(`Attempting to reconnect in ${delay/1000} seconds... (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
          
          this.time.delayedCall(delay, () => {
            this.initializeMultiplayer();
          });
        } else {
          console.log('Max reconnection attempts reached. Multiplayer disabled.');
        }
      };
      
    } catch (error) {
      console.error('Failed to initialize multiplayer connection:', error);
    }
  }

  private sendPlayerSpawn(): void {
    const gameState = this.gameStore.store.getState();
    const websocket = gameState.websocket;
    
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    if (!this.character) {
      return;
    }
    
    // Get character name for multiplayer display
    // Try multiple sources to get the character name
    let characterName = gameState.currentCharacter?.name;
    
    if (!characterName) {
      // Fallback 1: Check localStorage for guest character
      const guestCharacter = localStorage.getItem('hemoclast_guest_character');
      if (guestCharacter) {
        try {
          const guestData = JSON.parse(guestCharacter);
          characterName = guestData.name;
        } catch (e) {
          console.warn('Failed to parse guest character data:', e);
        }
      }
    }
    
    if (!characterName) {
      // No valid character name found - this shouldn't happen if character is properly selected
      characterName = 'Unknown Character';
      console.warn('No character name found - character may not be properly selected');
    }
    
    console.log('Multiplayer spawn debug:', {
      finalCharacterName: characterName,
      gameStateCharacter: gameState.currentCharacter,
      username: localStorage.getItem('hemoclast_username'),
      player: gameState.player,
      characterId: localStorage.getItem('hemoclast_character_id'),
      guestCharacter: localStorage.getItem('hemoclast_guest_character')
    });
    
    // Get character ID with fallback for guest characters
    let characterId = localStorage.getItem('hemoclast_character_id');
    if (!characterId && gameState.currentCharacter?.id) {
      characterId = gameState.currentCharacter.id.toString();
    }
    if (!characterId) {
      // Fallback for guest characters - use timestamp or player_id
      const playerId = localStorage.getItem('hemoclast_player_id');
      characterId = playerId || Date.now().toString();
    }
    
    const spawnMessage = {
      type: 'player_spawn',
      data: {
        player_id: localStorage.getItem('hemoclast_player_id'),
        character_id: characterId,
        character_name: characterName, // Using actual character name
        position: {
          x: this.character.x,
          y: this.character.y
        },
        timestamp: Date.now()
      }
    };
    
    websocket.send(JSON.stringify(spawnMessage));
    console.log('Sent player spawn message:', spawnMessage);
  }

  private handleMultiplayerMessage(message: any): void {
    console.log('Received multiplayer message:', message);
    
    switch (message.type) {
      case 'player_joined':
        this.handlePlayerJoined(message.data);
        break;
      case 'player_left':
        this.handlePlayerLeft(message.data);
        break;
      case 'player_moved':
        this.handlePlayerMoved(message.data);
        break;
      case 'chat_message':
        this.handleChatMessage(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handlePlayerJoined(data: any): void {
    console.log('Player joined:', data);
    
    const clientId = data.client_id;
    const characterName = data.character_name || 'Unknown Player';
    const position = data.position || { x: 400, y: 400 };
    
    // Don't create a character for ourselves
    const gameState = this.gameStore.store.getState();
    let myCharacterId = localStorage.getItem('hemoclast_character_id');
    if (!myCharacterId && gameState.currentCharacter?.id) {
      myCharacterId = gameState.currentCharacter.id.toString();
    }
    if (!myCharacterId) {
      const playerId = localStorage.getItem('hemoclast_player_id');
      myCharacterId = playerId || Date.now().toString();
    }
    const myClientId = `${localStorage.getItem('hemoclast_player_id')}_${myCharacterId}`;
    if (clientId === myClientId) {
      return;
    }
    
    // Create visual representation of the other player
    if (!this.otherPlayers.has(clientId)) {
      const otherPlayer = new Character(this, {
        x: position.x,
        y: position.y,
        tileSize: this.TILE_SIZE,
        speed: this.CHARACTER_SPEED,
        name: characterName,
        showName: true
      });
      
      // Make other players slightly transparent to distinguish from local player
      otherPlayer.setAlpha(0.8);
      
      this.otherPlayers.set(clientId, otherPlayer);
      console.log(`✓ Created visual representation for ${characterName} (${clientId})`);
    }
  }

  private handlePlayerLeft(data: any): void {
    console.log('Player left:', data);
    
    const clientId = data.client_id;
    
    // Remove visual representation of the player
    if (this.otherPlayers.has(clientId)) {
      const otherPlayer = this.otherPlayers.get(clientId);
      if (otherPlayer) {
        otherPlayer.destroy();
        this.otherPlayers.delete(clientId);
        
        // Clean up movement tracking for this player
        const existingTween = this.otherPlayerSmoothMovement.get(clientId);
        if (existingTween) {
          existingTween.stop();
        }
        this.otherPlayerSmoothMovement.delete(clientId);
        this.otherPlayerTargets.delete(clientId);
        
        console.log(`✓ Removed visual representation for ${clientId}`);
      }
    }
  }

  private handlePlayerMoved(data: any): void {
    const clientId = data.client_id;
    const position = data.position;
    const timestamp = data.timestamp;
    
    // Validate position data
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      console.warn(`Invalid position data from ${clientId}:`, position);
      return;
    }
    
    // Validate position is within reasonable world bounds
    const worldBounds = this.tileMap?.getWorldBounds();
    if (worldBounds) {
      if (position.x < 0 || position.x > worldBounds.width || 
          position.y < 0 || position.y > worldBounds.height) {
        console.warn(`Position out of bounds from ${clientId}:`, position);
        return;
      }
    }
    
    // Update position of other player's visual representation
    if (this.otherPlayers.has(clientId)) {
      const otherPlayer = this.otherPlayers.get(clientId);
      if (otherPlayer && this.tileMap) {
        // Ensure position precision consistency
        const preciseX = Math.round(position.x / this.POSITION_PRECISION) * this.POSITION_PRECISION;
        const preciseY = Math.round(position.y / this.POSITION_PRECISION) * this.POSITION_PRECISION;
        
        // Calculate distance from current position to target
        const dx = preciseX - otherPlayer.x;
        const dy = preciseY - otherPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Update target position for this player
        this.otherPlayerTargets.set(clientId, { x: preciseX, y: preciseY, timestamp });
        
        // Check for potential desync or large movements
        const messageAge = Date.now() - timestamp;
        const isStaleMessage = messageAge > 1000; // More lenient threshold
        const isLargeJump = distance > 75; // Balanced threshold to detect real jumps
        
        // Cancel any existing smooth movement for this player
        const existingTween = this.otherPlayerSmoothMovement.get(clientId);
        if (existingTween) {
          existingTween.stop();
          this.otherPlayerSmoothMovement.set(clientId, null);
        }
        
        if (isStaleMessage || isLargeJump) {
          // Instant positioning for stale messages or large jumps
          otherPlayer.setPosition(preciseX, preciseY);
          // Update animation state for instant moves
          if (data.direction && data.isMoving !== undefined) {
            otherPlayer.setAnimationState(data.direction, data.isMoving);
          }
          console.log(`⚡ Instant sync ${clientId} to (${preciseX}, ${preciseY}) - ${isStaleMessage ? 'stale' : 'large jump'} (${distance.toFixed(1)}px)`);
        } else if (distance > 5) {
          // Smooth interpolation for medium distances with improved easing
          const moveDuration = Math.min(120, Math.max(80, distance * 2.5)); // Better duration scaling
          const smoothTween = this.tweens.add({
            targets: otherPlayer,
            x: preciseX,
            y: preciseY,
            duration: moveDuration,
            ease: 'Sine.easeOut', // Smoother easing function
            onUpdate: () => {
              // Update animation during movement for smoother appearance
              if (data.direction && data.isMoving !== undefined) {
                otherPlayer.setAnimationState(data.direction, data.isMoving);
              }
            },
            onComplete: () => {
              this.otherPlayerSmoothMovement.set(clientId, null);
              // Ensure final animation state is set
              if (data.direction && data.isMoving !== undefined) {
                otherPlayer.setAnimationState(data.direction, data.isMoving);
              }
            }
          });
          this.otherPlayerSmoothMovement.set(clientId, smoothTween);
          console.log(`🚶 Smooth move ${clientId} to (${preciseX}, ${preciseY}) - ${distance.toFixed(1)}px in ${moveDuration}ms`);
        } else if (distance > 1) {
          // Direct positioning for small distances
          otherPlayer.setPosition(preciseX, preciseY);
          // Update animation state for small moves
          if (data.direction && data.isMoving !== undefined) {
            otherPlayer.setAnimationState(data.direction, data.isMoving);
          }
          console.log(`📍 Precise sync ${clientId} to (${preciseX}, ${preciseY}) - micro-adjustment`);
        } else {
          // Very small movement - just update animation state without moving
          if (data.direction && data.isMoving !== undefined) {
            otherPlayer.setAnimationState(data.direction, data.isMoving);
            console.log(`🎭 Animation update ${clientId}: ${data.direction}, moving: ${data.isMoving}`);
          }
        }
        // If distance <= 1px, ignore to prevent jitter
      }
    }
  }

  private handleChatMessage(data: any): void {
    console.log('Chat message:', data);
    // TODO: Display chat message in UI
  }

  private startMovementBroadcasting(): void {
    // Stop any existing timer
    this.stopMovementBroadcasting();
    
    // Reset broadcast tracking for new movement session
    this.lastBroadcastTime = Date.now();
    
    // Start broadcasting position updates during movement
    this.movementBroadcastTimer = this.time.addEvent({
      delay: this.MOVEMENT_BROADCAST_INTERVAL,
      callback: () => {
        if (this.character) {
          this.broadcastPlayerMovementIfChanged(this.character.x, this.character.y);
        }
      },
      loop: true
    });
  }

  private stopMovementBroadcasting(): void {
    if (this.movementBroadcastTimer) {
      this.movementBroadcastTimer.remove();
      this.movementBroadcastTimer = null;
    }
  }

  private broadcastPlayerMovementIfChanged(x: number, y: number): void {
    const currentTime = Date.now();
    
    // Ensure position precision for local character too
    const preciseX = Math.round(x / this.POSITION_PRECISION) * this.POSITION_PRECISION;
    const preciseY = Math.round(y / this.POSITION_PRECISION) * this.POSITION_PRECISION;
    
    // Get current direction for comparison
    const currentDirection = this.character?.getCurrentDirection()?.key || 'idle';
    
    // Check if we should broadcast based on distance, time, OR direction change
    let shouldBroadcast = false;
    
    if (!this.lastBroadcastPosition) {
      // First movement - always broadcast
      shouldBroadcast = true;
    } else {
      const dx = Math.abs(preciseX - this.lastBroadcastPosition.x);
      const dy = Math.abs(preciseY - this.lastBroadcastPosition.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeSinceLastBroadcast = currentTime - this.lastBroadcastTime;
      const directionChanged = currentDirection !== this.lastBroadcastDirection;
      
      // Broadcast if any of these conditions are met:
      // 1. Moved significant distance
      // 2. Time limit exceeded (ensures consistency)
      // 3. Direction changed (for animation updates)
      shouldBroadcast = distance >= this.MIN_MOVEMENT_DISTANCE || 
                       timeSinceLastBroadcast >= this.MAX_BROADCAST_DELAY ||
                       directionChanged;
    }
    
    if (shouldBroadcast) {
      // Update tracking variables with precise coordinates
      this.lastBroadcastPosition = { x: preciseX, y: preciseY };
      this.lastBroadcastTime = currentTime;
      this.lastBroadcastDirection = currentDirection;
      
      // Send the precise movement update
      this.broadcastPlayerMovement(preciseX, preciseY);
    }
  }

  private broadcastPlayerMovement(x: number, y: number): void {
    const gameState = this.gameStore.store.getState();
    const websocket = gameState.websocket;
    
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Round positions to ensure pixel-perfect precision across clients
    const preciseX = Math.round(x / this.POSITION_PRECISION) * this.POSITION_PRECISION;
    const preciseY = Math.round(y / this.POSITION_PRECISION) * this.POSITION_PRECISION;
    
    // Use character name for consistency with spawn message
    const characterName = gameState.currentCharacter?.name || 
                         'Unknown Character';
    
    // Get current animation state from character
    const currentDirection = this.character?.getCurrentDirection();
    const isMoving = this.character?.isCurrentlyMoving() || false;
    
    const moveMessage = {
      type: 'player_move',
      data: {
        player_id: localStorage.getItem('hemoclast_player_id'),
        character_id: localStorage.getItem('hemoclast_character_id'),
        character_name: characterName, // Using actual character name
        position: { x: preciseX, y: preciseY }, // Use precise coordinates
        direction: currentDirection?.key || 'idle', // Animation direction
        isMoving: isMoving, // Movement state
        timestamp: Date.now()
      }
    };
    
    websocket.send(JSON.stringify(moveMessage));
  }

  public update(): void {
    // Update input manager
    if (this.inputManager) {
      this.inputManager.update();
    }
    
    // Update character
    if (this.character) {
      this.character.update();
      
      // Check if pathfinding is complete
      if (this.isPathfinding && !this.character.isFollowingPath()) {
        this.isPathfinding = false;
        this.stopMovementBroadcasting();
        // Send final position when pathfinding completes
        this.broadcastPlayerMovement(this.character.x, this.character.y);
      }
    }
    
    // Update other players
    this.otherPlayers.forEach((otherPlayer) => {
      otherPlayer.update();
    });
  }
  
  // Clean up when scene is destroyed  
  public destroy(): void {
    // Close WebSocket connection
    const gameState = this.gameStore.store.getState();
    const websocket = gameState.websocket;
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      // Send player disconnect message
      const disconnectMessage = {
        type: 'player_disconnect',
        data: {
          player_id: localStorage.getItem('hemoclast_player_id'),
          character_id: localStorage.getItem('hemoclast_character_id'),
          timestamp: Date.now()
        }
      };
      
      websocket.send(JSON.stringify(disconnectMessage));
      websocket.close();
    }
    
    // Clear WebSocket from store
    this.gameStore.store.getState().setWebSocket(null);
    this.gameStore.store.getState().setConnected(false);
    
    // Stop movement broadcasting
    this.stopMovementBroadcasting();
    
    // Clean up other players
    this.otherPlayers.forEach((otherPlayer) => {
      otherPlayer.destroy();
    });
    this.otherPlayers.clear();
    
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    
    if (this.tileMap) {
      this.tileMap.destroy();
    }
    
    // Call parent destroy without super.destroy() as it doesn't exist in Phaser Scene
  }
}
