/**
 * Boot Scene - Initial loading and asset management
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';

export class BootScene extends Scene {
  private gameStore: GameStore;

  constructor() {
    super({ key: 'BootScene' });
    this.gameStore = GameStore.getInstance();
  }

  preload() {
    // Loading screen setup
    const { width, height } = this.scale;
    
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Update loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x8B0000, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // Load placeholder assets (replace with actual game assets)
    this.load.image('logo', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzhCMDAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SE88L3RleHQ+PC9zdmc+');
  }

  async create() {
    // Hide the initial HTML loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    this.gameStore.store.getState().setLoading(false);
    
    // Check if user is already logged in (both regular and guest accounts now use tokens)
    const token = localStorage.getItem('hemoclast_token');
    
    if (token) {
      // Validate token by attempting to fetch user info
      const isValidToken = await this.validateToken(token);
      
      if (isValidToken) {
        // Token is valid, go to character selection
        this.gameStore.store.getState().setScene('CharacterSelectionScene');
        this.scene.start('CharacterSelectionScene');
      } else {
        // Token is invalid/expired, clear it and go to login
        this.clearExpiredToken();
        this.gameStore.store.getState().setScene('LoginScene');
        this.scene.start('LoginScene');
      }
    } else {
      // No login found, go to login screen
      this.gameStore.store.getState().setScene('LoginScene');
      this.scene.start('LoginScene');
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Token validation failed:', error);
      return false;
    }
  }

  private clearExpiredToken() {
    console.warn('Token expired on startup, clearing authentication data');
    localStorage.removeItem('hemoclast_token');
    localStorage.removeItem('hemoclast_player_id');
    localStorage.removeItem('hemoclast_username');
    localStorage.removeItem('hemoclast_character_id');
    // Keep guest/registered status for smoother re-authentication
  }
}
