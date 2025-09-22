/**
 * UI Scene - Enhanced Game Interface Overlay
 * Now integrated with the new component-based UI system
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';
import { UIManager } from '../components/UIManager';
import { startUIDemo } from '../utils/UIDemo';
import { activateFullUIDemo } from '../utils/UITestScript';

export class UIScene extends Scene {
  private gameStore: GameStore;
  private uiManager!: UIManager;
  private uiScale: number = 1;
  private baseFontSize: number = 16;
  
  // Legacy UI elements (for additional UI not covered by components)
  private chatContainer!: Phaser.GameObjects.Container;
  private minimap!: Phaser.GameObjects.Graphics;
  private uiElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'UIScene' });
    this.gameStore = GameStore.getInstance();
  }

  create() {
    console.log('🎮 UIScene: Starting to create UI...');
    this.createUI();
    this.setupEventListeners();
    console.log('✅ UIScene: UI creation complete!');
  }

  private createUI() {
    // Clear existing UI elements
    this.clearUI();
    
    const { width, height } = this.scale;
    
    // Update scale factors
    this.uiScale = ResponsiveLayout.getUIScale(width, height);
    this.baseFontSize = ResponsiveLayout.getScaledFontSize(16, width, height);
    
    // Initialize the new UI Manager with all core components
    this.uiManager = new UIManager(this, {
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
      compactMode: width < 1200 // Auto-enable compact mode on smaller screens
    });
    
    console.log('🎯 UIScene: Initializing UI Manager...');
    this.uiManager.initialize();
    console.log('✅ UIScene: UI Manager initialized successfully!');
    
    // Create additional UI elements not covered by components
    this.createResponsiveChatPanel();
    this.createResponsiveMinimap();
    
    // Initialize with some sample data for testing
    this.initializeSampleData();
    
    // Start UI demo after a short delay to ensure everything is initialized
    this.time.delayedCall(1000, () => {
      startUIDemo(this.uiManager);
      
      // Show comprehensive UI guide
      this.time.delayedCall(2000, () => {
        activateFullUIDemo();
      });
    });
  }

  private clearUI() {
    // Remove all existing UI elements
    this.uiElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.uiElements = [];
  }

  // Public method called by main.ts on resize
  public handleResize(newWidth: number, newHeight: number) {
    this.scale.resize(newWidth, newHeight);
    
    // Let the UI Manager handle component resizing
    if (this.uiManager) {
      // The UI Manager will handle its own resize through the scene's resize event
      // We just need to recreate the additional UI elements
      this.createResponsiveChatPanel();
      this.createResponsiveMinimap();
    } else {
      // Fallback to full recreation if UI Manager not initialized
      this.createUI();
    }
  }

  private initializeSampleData() {
    // Initialize with sample player data
    this.gameStore.store.setState((state) => ({
      ...state,
      player: {
        name: 'Grimjaw the Warrior',
        level: 8,
        class: 'Guardian',
        health: 180,
        maxHealth: 200,
        mana: 85,
        maxMana: 110,
        classResource: {
          name: 'Rage',
          value: 45,
          maxValue: 100,
          color: '#FF4500'
        }
      },
      party: {
        members: [
          {
            id: 'player1',
            name: 'DarkKnight_92',
            level: 8,
            class: 'Guardian',
            role: 'tank' as const,
            health: 195,
            maxHealth: 220,
            mana: 60,
            maxMana: 80,
            isOnline: true,
            isInRange: true,
            hasLineOfSight: true,
            isLeader: true,
            buffs: [
              { id: 'def_boost', name: 'Defense Boost', icon: '🛡️', duration: 30000 }
            ],
            debuffs: []
          },
          {
            id: 'player2',
            name: 'MysticMage',
            level: 7,
            class: 'Elementalist',
            role: 'dps' as const,
            health: 120,
            maxHealth: 150,
            mana: 180,
            maxMana: 200,
            isOnline: true,
            isInRange: true,
            hasLineOfSight: true,
            isLeader: false,
            buffs: [
              { id: 'mana_regen', name: 'Mana Regeneration', icon: '✨', duration: 45000 }
            ],
            debuffs: []
          },
          {
            id: 'player3',
            name: 'SilentBlade',
            level: 8,
            class: 'Oracle',
            role: 'healer' as const,
            health: 140,
            maxHealth: 160,
            mana: 160,
            maxMana: 190,
            isOnline: true,
            isInRange: false, // Out of range example
            hasLineOfSight: true,
            isLeader: false,
            buffs: [
              { id: 'heal_bonus', name: 'Healing Bonus', icon: '✚', duration: 60000 }
            ],
            debuffs: []
          }
        ]
      }
    }));

    // Set up some sample action bar skills
    const actionBar = this.uiManager.getActionBar();
    if (actionBar) {
      actionBar.setSlot(0, {
        id: 'slot_0',
        icon: '⚔️',
        tooltip: 'Power Strike\nDeals heavy damage\nCooldown: 8s',
        maxCooldown: 8000
      });
      
      actionBar.setSlot(1, {
        id: 'slot_1',
        icon: '🛡️',
        tooltip: 'Shield Slam\nStuns enemy\nCooldown: 12s',
        maxCooldown: 12000
      });
      
      actionBar.setSlot(2, {
        id: 'slot_2',
        icon: '🍷',
        tooltip: 'Health Potion\nRestores 50 HP',
        charges: 5,
        maxCharges: 5
      });
    }
  }

  
  private createResponsiveChatPanel() {
    const { width, height } = this.scale;
    const chatPanel = ResponsiveLayout.getResponsiveLayout('CHAT_PANEL', width, height);
    
    // Chat panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a0a, 0.8);
    panel.fillRoundedRect(chatPanel.x, chatPanel.y, chatPanel.width, chatPanel.height, 8 * this.uiScale);
    panel.lineStyle(1 * this.uiScale, 0x666666);
    panel.strokeRoundedRect(chatPanel.x, chatPanel.y, chatPanel.width, chatPanel.height, 8 * this.uiScale);
    this.uiElements.push(panel);
    
    // Chat title
    const title = this.add.text(chatPanel.x + 10 * this.uiScale, chatPanel.y + 10 * this.uiScale, 'Guild Chat',
      ResponsiveLayout.getTextStyle(14, width, height, {
        color: '#228B22',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    this.uiElements.push(title);
    
    // Mock chat messages
    const messages = [
      { player: 'DarkKnight_92', message: 'Anyone up for the crypt raid?', color: '#DC143C' },
      { player: 'MysticMage', message: 'I can heal, count me in!', color: '#4B0082' },
      { player: 'SilentBlade', message: 'Need one more DPS', color: '#228B22' }
    ];
    
    messages.forEach((msg, index) => {
      const msgText = this.add.text(chatPanel.x + 10 * this.uiScale, chatPanel.y + (40 + index * 20) * this.uiScale, `${msg.player}: ${msg.message}`,
        ResponsiveLayout.getTextStyle(11, width, height, {
          color: msg.color,
          fontFamily: 'Cinzel, serif',
          wordWrap: { width: chatPanel.width - 20 * this.uiScale }
        })
      );
      this.uiElements.push(msgText);
    });
  }
  
  private createResponsiveMinimap() {
    const { width, height } = this.scale;
    const minimap = ResponsiveLayout.getResponsiveLayout('MINIMAP', width, height);
    
    // Minimap background
    const mapGraphics = this.add.graphics();
    mapGraphics.fillStyle(0x000000, 0.8);
    mapGraphics.fillCircle(minimap.x + minimap.width / 2, minimap.y + minimap.height / 2, minimap.width / 2);
    mapGraphics.lineStyle(2 * this.uiScale, 0x8B0000);
    mapGraphics.strokeCircle(minimap.x + minimap.width / 2, minimap.y + minimap.height / 2, minimap.width / 2);
    this.uiElements.push(mapGraphics);
    
    // Minimap title
    const title = this.add.text(minimap.x + minimap.width / 2, minimap.y - 20 * this.uiScale, 'Map',
      ResponsiveLayout.getTextStyle(14, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    this.uiElements.push(title);
    
    // Player dot
    const centerX = minimap.x + minimap.width / 2;
    const centerY = minimap.y + minimap.height / 2;
    const playerDot = this.add.circle(centerX, centerY, 3 * this.uiScale, 0xDC143C);
    this.uiElements.push(playerDot);
    
    // Mock location markers
    const marker1 = this.add.circle(centerX - 20 * this.uiScale, centerY - 20 * this.uiScale, 2 * this.uiScale, 0x228B22);
    const marker2 = this.add.circle(centerX + 20 * this.uiScale, centerY + 20 * this.uiScale, 2 * this.uiScale, 0xFFD700);
    this.uiElements.push(marker1, marker2);
  }
  

  private setupEventListeners() {
    // Listen for game state changes
    this.gameStore.subscribe((state) => {
      // Update UI based on state changes
      this.updateUI(state);
    });
    
    // Additional keyboard shortcuts not handled by UI Manager
    this.input.keyboard?.on('keydown-I', () => {
      console.log('Toggle inventory');
      // TODO: Implement inventory toggle
    });
    
    this.input.keyboard?.on('keydown-C', () => {
      console.log('Toggle character sheet');
      // TODO: Implement character sheet toggle
    });
    
    this.input.keyboard?.on('keydown-G', () => {
      console.log('Toggle guild panel');
      // TODO: Implement guild panel toggle
    });
  }

  private updateUI(state: any) {
    // The UI Manager handles most UI updates automatically
    // This method is for any additional UI elements not covered by components
  }

  public destroy() {
    // Clean up UI Manager
    if (this.uiManager) {
      this.uiManager.destroy();
    }
    
    // Clean up remaining UI elements
    this.clearUI();
    
    super.destroy();
  }
}
