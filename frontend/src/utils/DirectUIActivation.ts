/**
 * Direct UI Activation
 * Directly creates and manages UI components within a scene
 */

import { Scene } from 'phaser';
import { UIManager } from '../components/UIManager';
import { startUIDemo } from './UIDemo';
import { activateFullUIDemo } from './UITestScript';

export class DirectUIActivation {
  private scene: Scene;
  private uiManager: UIManager | null = null;
  private isActive: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public activate(): void {
    if (this.isActive) {
      console.log('UI system already active');
      return;
    }

    console.log('🎮 DirectUIActivation: Creating UI system...');
    
    try {
      // Create UI Manager directly in this scene
      this.uiManager = new UIManager(this.scene, {
        enableActionBar: true,
        enablePlayerFrame: true,
        enableTargetFrame: true,
        enablePartyFrames: true,
        enableInventory: true,
        enableCharacterSheet: true,
        enableQuestTracker: true,
        enableChatSystem: true,
        enableGuildPanel: true,
        enableFriendsList: true,
        enableLootWindow: true,
        enableCurrencyTracker: true,
        enableVendorUI: true,
        enableDungeonUI: true,
        enableCombatUI: true,
        enableAchievementPanel: true,
        enableDailyTasks: true,
        compactMode: this.scene.scale.width < 1200
      });

      console.log('🎯 DirectUIActivation: Initializing UI Manager...');
      this.uiManager.initialize();
      console.log('✅ DirectUIActivation: UI Manager initialized!');

      // Force show some UI components immediately
      const actionBar = this.uiManager.getActionBar();
      const playerFrame = this.uiManager.getPlayerFrame();
      const questTracker = this.uiManager.getQuestTracker();
      
      if (actionBar) {
        actionBar.show();
        console.log('✅ Action Bar shown');
      }
      if (playerFrame) {
        playerFrame.show();
        console.log('✅ Player Frame shown');
      }
      if (questTracker) {
        questTracker.show();
        console.log('✅ Quest Tracker shown');
      }

      this.isActive = true;

      // Add a simple test rectangle to verify UI is working
      const testRect = this.scene.add.rectangle(100, 100, 200, 50, 0xFF0000, 0.8);
      const testText = this.scene.add.text(100, 100, 'UI SYSTEM ACTIVE!', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      console.log('🔴 Test UI elements added to scene');

      // Start demo after initialization
      this.scene.time.delayedCall(1000, () => {
        if (this.uiManager) {
          console.log('🎯 DirectUIActivation: Starting UI demo...');
          startUIDemo(this.uiManager);
          
          // Show activation guide
          this.scene.time.delayedCall(2000, () => {
            activateFullUIDemo();
          });
        }
      });

    } catch (error) {
      console.error('❌ DirectUIActivation: Failed to create UI system:', error);
    }
  }

  public deactivate(): void {
    if (!this.isActive) return;

    console.log('🎮 DirectUIActivation: Deactivating UI system...');
    
    if (this.uiManager) {
      this.uiManager.destroy();
      this.uiManager = null;
    }

    this.isActive = false;
    console.log('✅ DirectUIActivation: UI system deactivated');
  }

  public getUIManager(): UIManager | null {
    return this.uiManager;
  }

  public isUIActive(): boolean {
    return this.isActive;
  }

  public toggleUI(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
}

// Export a global function for easy console access
export function createDirectUI(scene: Scene): DirectUIActivation {
  const directUI = new DirectUIActivation(scene);
  directUI.activate();
  
  // Make available globally for console testing
  (window as any).directUI = directUI;
  
  console.log('🎮 Direct UI system created! Available commands:');
  console.log('  directUI.toggleUI() - Toggle UI system');
  console.log('  directUI.getUIManager() - Access UI manager');
  console.log('  directUI.isUIActive() - Check if UI is active');
  
  return directUI;
}
