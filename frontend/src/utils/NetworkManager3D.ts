/**
 * NetworkManager3D - Handles 3D multiplayer networking and synchronization
 */

import * as THREE from 'three';
import { GameStore } from '../stores/gameStore';

export interface Player3DData {
  client_id: string;
  character_id: string;
  character_name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  animation: string;
  health: number;
  timestamp: number;
}

export interface Network3DMessage {
  type: string;
  data: any;
}

export class NetworkManager3D {
  private gameStore: GameStore;
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  
  // Network event handlers
  public onPlayerJoined: ((playerData: Player3DData) => void) | null = null;
  public onPlayerMoved: ((playerData: Player3DData) => void) | null = null;
  public onPlayerLeft: ((playerId: string) => void) | null = null;
  public onChatMessage: ((message: any) => void) | null = null;
  
  // Position tracking for optimization
  private lastBroadcastPosition: THREE.Vector3 | null = null;
  private lastBroadcastRotation: THREE.Quaternion | null = null;
  private lastBroadcastTime = 0;
  private readonly BROADCAST_INTERVAL = 100; // ms
  private readonly MIN_POSITION_CHANGE = 0.1; // units
  private readonly MIN_ROTATION_CHANGE = 0.05; // radians
  
  constructor(gameStore: GameStore) {
    this.gameStore = gameStore;
  }
  
  public async connect(): Promise<void> {
    try {
      const playerId = localStorage.getItem('hemoclast_player_id');
      const characterId = localStorage.getItem('hemoclast_character_id');
      
      if (!playerId || !characterId) {
        console.warn('Missing player or character ID for 3D multiplayer connection');
        return;
      }
      
      const clientId = `${playerId}_${characterId}`;
      
      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host;
      if (window.location.port === '5173') {
        host = window.location.hostname + ':8000';
      }
      
      const token = localStorage.getItem('hemoclast_token');
      if (!token) {
        console.error('No authentication token found for 3D WebSocket connection');
        return;
      }
      
      const wsUrl = `${protocol}//${host}/ws/${clientId}?token=${encodeURIComponent(token)}`;
      
      console.log('🌐 Connecting to 3D multiplayer server:', wsUrl);
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('✅ Connected to 3D multiplayer server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Update game store
        this.gameStore.store.getState().setWebSocket(this.websocket);
        this.gameStore.store.getState().setConnected(true);
        
        // Send initial spawn message
        this.sendPlayerSpawn();
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const message: Network3DMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing 3D WebSocket message:', error);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error('3D WebSocket error:', error);
        this.isConnected = false;
        this.gameStore.store.getState().setConnected(false);
      };
      
      this.websocket.onclose = () => {
        console.log('Disconnected from 3D multiplayer server');
        this.isConnected = false;
        this.gameStore.store.getState().setWebSocket(null);
        this.gameStore.store.getState().setConnected(false);
        
        // Attempt reconnection
        this.attemptReconnection();
      };
      
    } catch (error) {
      console.error('Failed to connect to 3D multiplayer server:', error);
    }
  }
  
  private attemptReconnection(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      
      console.log(`🔄 Attempting 3D reconnection in ${delay/1000} seconds... (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('❌ Max 3D reconnection attempts reached');
    }
  }
  
  private sendPlayerSpawn(): void {
    const gameState = this.gameStore.store.getState();
    let characterName = gameState.currentCharacter?.name;
    let characterClass = gameState.currentCharacter?.character_class || 'warrior';
    
    // Fallback to guest character data
    if (!characterName) {
      const guestCharacter = localStorage.getItem('hemoclast_guest_character');
      if (guestCharacter) {
        try {
          const guestData = JSON.parse(guestCharacter);
          characterName = guestData.name;
          characterClass = guestData.character_class || 'warrior';
        } catch (e) {
          console.warn('Failed to parse guest character data:', e);
        }
      }
    }
    
    // Final fallback
    if (!characterName) {
      characterName = 'Unknown Character';
    }
    
    const characterId = localStorage.getItem('hemoclast_character_id');
    const playerId = localStorage.getItem('hemoclast_player_id');
    
    const spawnMessage = {
      type: 'player_spawn_3d',
      data: {
        player_id: playerId,
        character_id: characterId,
        character_name: characterName,
        character_class: characterClass,
        position: { x: 0, y: 1, z: 0 }, // Default spawn position
        rotation: { x: 0, y: 0, z: 0, w: 1 }, // Default rotation (quaternion)
        animation: 'idle',
        health: 100,
        timestamp: Date.now()
      }
    };
    
    this.sendMessage(spawnMessage);
    console.log('📡 Sent 3D player spawn message:', spawnMessage);
  }
  
  private handleMessage(message: Network3DMessage): void {
    console.log('📡 NETWORK: Received 3D message:', message.type, message.data);
    
    switch (message.type) {
      case 'player_joined':
      case 'player_joined_3d':
        console.log('🎭 NETWORK: Processing player joined');
        if (this.onPlayerJoined) {
          this.onPlayerJoined(message.data);
        }
        break;
        
      case 'player_moved':
      case 'player_moved_3d':
        if (this.onPlayerMoved) {
          this.onPlayerMoved(message.data);
        }
        break;
        
      case 'player_left':
      case 'player_left_3d':
        if (this.onPlayerLeft) {
          this.onPlayerLeft(message.data.client_id);
        }
        break;
        
      case 'chat_message':
        if (this.onChatMessage) {
          this.onChatMessage(message.data);
        }
        break;
        
      default:
        console.log('Unknown 3D message type:', message.type);
    }
  }
  
  public broadcastPlayerUpdate(position: THREE.Vector3, rotation: THREE.Quaternion, animation: string = 'idle'): void {
    if (!this.isConnected || !this.websocket) return;
    
    const currentTime = Date.now();
    
    // Check if enough time has passed since last broadcast
    if (currentTime - this.lastBroadcastTime < this.BROADCAST_INTERVAL) {
      return;
    }
    
    // Check if position or rotation has changed significantly
    let shouldBroadcast = false;
    
    if (!this.lastBroadcastPosition || !this.lastBroadcastRotation) {
      shouldBroadcast = true;
    } else {
      const positionChange = position.distanceTo(this.lastBroadcastPosition);
      const rotationChange = Math.abs(rotation.angleTo(this.lastBroadcastRotation));
      
      if (positionChange > this.MIN_POSITION_CHANGE || rotationChange > this.MIN_ROTATION_CHANGE) {
        shouldBroadcast = true;
      }
    }
    
    if (shouldBroadcast) {
      const gameState = this.gameStore.store.getState();
      const characterName = gameState.currentCharacter?.name || 'Unknown Character';
      
      const moveMessage = {
        type: 'player_move_3d',
        data: {
          player_id: localStorage.getItem('hemoclast_player_id'),
          character_id: localStorage.getItem('hemoclast_character_id'),
          character_name: characterName,
          position: {
            x: Math.round(position.x * 100) / 100, // Round to 2 decimal places
            y: Math.round(position.y * 100) / 100,
            z: Math.round(position.z * 100) / 100
          },
          rotation: {
            x: Math.round(rotation.x * 1000) / 1000, // Round to 3 decimal places
            y: Math.round(rotation.y * 1000) / 1000,
            z: Math.round(rotation.z * 1000) / 1000,
            w: Math.round(rotation.w * 1000) / 1000
          },
          animation: animation,
          timestamp: currentTime
        }
      };
      
      this.sendMessage(moveMessage);
      
      // Update last broadcast tracking
      this.lastBroadcastPosition = position.clone();
      this.lastBroadcastRotation = rotation.clone();
      this.lastBroadcastTime = currentTime;
    }
  }
  
  public sendChatMessage(message: string, channel: string = 'global'): void {
    if (!this.isConnected) return;
    
    const chatMessage = {
      type: 'chat_message',
      data: {
        player_id: localStorage.getItem('hemoclast_player_id'),
        character_name: this.gameStore.store.getState().currentCharacter?.name || 'Unknown',
        message: message,
        channel: channel,
        timestamp: Date.now()
      }
    };
    
    this.sendMessage(chatMessage);
  }
  
  public sendCombatAction(targetId: string | null, skillId: number, position: THREE.Vector3, direction: THREE.Vector3): void {
    if (!this.isConnected) return;
    
    const combatMessage = {
      type: 'combat_action_3d',
      data: {
        caster_id: localStorage.getItem('hemoclast_character_id'),
        target_id: targetId,
        skill_id: skillId,
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        direction: {
          x: direction.x,
          y: direction.y,
          z: direction.z
        },
        timestamp: Date.now()
      }
    };
    
    this.sendMessage(combatMessage);
  }
  
  private sendMessage(message: Network3DMessage): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }
  
  public update(deltaTime: number): void {
    // Periodic connection health check
    if (!this.isConnected && this.websocket?.readyState === WebSocket.OPEN) {
      this.isConnected = true;
      this.gameStore.store.getState().setConnected(true);
    }
    
    // Handle any queued messages or periodic tasks
    // Implementation can be expanded as needed
  }
  
  public disconnect(): void {
    if (this.websocket) {
      // Send disconnect message
      const disconnectMessage = {
        type: 'player_disconnect_3d',
        data: {
          player_id: localStorage.getItem('hemoclast_player_id'),
          character_id: localStorage.getItem('hemoclast_character_id'),
          timestamp: Date.now()
        }
      };
      
      this.sendMessage(disconnectMessage);
      
      // Close connection
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.gameStore.store.getState().setWebSocket(null);
    this.gameStore.store.getState().setConnected(false);
    
    console.log('🔌 Disconnected from 3D multiplayer server');
  }
  
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  public getLatency(): number {
    // Simple latency measurement
    // In production, implement proper ping/pong latency tracking
    return this.lastBroadcastTime > 0 ? Date.now() - this.lastBroadcastTime : 0;
  }
}
