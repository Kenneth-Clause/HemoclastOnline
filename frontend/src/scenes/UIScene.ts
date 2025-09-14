/**
 * UI Scene - Enhanced Game Interface Overlay
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export class UIScene extends Scene {
  private gameStore: GameStore;
  private healthBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private experienceBar!: Phaser.GameObjects.Graphics;
  private chatContainer!: Phaser.GameObjects.Container;
  private minimap!: Phaser.GameObjects.Graphics;
  private uiScale: number = 1;
  private baseFontSize: number = 16;
  private uiElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'UIScene' });
    this.gameStore = GameStore.getInstance();
  }

  create() {
    this.createUI();
    this.setupEventListeners();
  }

  private createUI() {
    // Clear existing UI elements
    this.clearUI();
    
    const { width, height } = this.scale;
    
    // Update scale factors
    this.uiScale = ResponsiveLayout.getUIScale(width, height);
    this.baseFontSize = ResponsiveLayout.getScaledFontSize(16, width, height);
    
    // Create main UI panels with responsive positioning
    this.createResponsiveTopPanel();
    this.createResponsiveBottomPanel();
    this.createResponsiveSidePanel();
    this.createResponsiveChatPanel();
    this.createResponsiveMinimap();
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
    this.createUI();
  }

  private createResponsiveTopPanel() {
    const { width, height } = this.scale;
    
    // Get responsive layout positions
    const topPanel = ResponsiveLayout.getResponsiveLayout('TOP_PANEL', width, height);
    const resourceBars = ResponsiveLayout.getResponsiveLayout('RESOURCE_BARS', width, height);
    const currency = ResponsiveLayout.getResponsiveLayout('CURRENCY', width, height);
    
    // Top panel background with responsive positioning
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a0a, 0.9);
    panel.fillRoundedRect(topPanel.x, topPanel.y, topPanel.width, topPanel.height, 8 * this.uiScale);
    panel.lineStyle(2 * this.uiScale, 0x8B0000);
    panel.strokeRoundedRect(topPanel.x, topPanel.y, topPanel.width, topPanel.height, 8 * this.uiScale);
    this.uiElements.push(panel);
    
    // Character info with responsive positioning
    const characterName = this.add.text(topPanel.x + 20 * this.uiScale, topPanel.y + 20 * this.uiScale, 'Grimjaw the Warrior',
      ResponsiveLayout.getTextStyle(18, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    this.uiElements.push(characterName);
    
    const characterInfo = this.add.text(topPanel.x + 20 * this.uiScale, topPanel.y + 45 * this.uiScale, 'Level 8 • Crimson Brotherhood',
      ResponsiveLayout.getTextStyle(14, width, height, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      })
    );
    this.uiElements.push(characterInfo);
    
    // Resource bars with responsive positioning
    this.createResponsiveResourceBars(resourceBars, width, height);
    
    // Currency display with responsive positioning
    this.createResponsiveCurrencyDisplay(currency, width, height);
  }

  private createResponsiveResourceBars(layout: any, screenWidth: number, screenHeight: number) {
    // Health bar
    this.createResponsiveResourceBar(
      layout.x, 
      layout.y, 
      layout.width, 
      layout.height, 
      '#8B0000', 
      'Health: 180/200', 
      0.9,
      screenWidth,
      screenHeight
    );
    
    // Mana bar
    this.createResponsiveResourceBar(
      layout.x, 
      layout.y + layout.spacing, 
      layout.width, 
      layout.height, 
      '#4B0082', 
      'Mana: 85/110', 
      0.77,
      screenWidth,
      screenHeight
    );
    
    // Experience bar
    this.createResponsiveResourceBar(
      layout.x, 
      layout.y + layout.spacing * 2, 
      layout.width, 
      layout.height, 
      '#FFD700', 
      'XP: 1250/1500', 
      0.83,
      screenWidth,
      screenHeight
    );
  }

  private createResponsiveResourceBar(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string, 
    text: string, 
    fillPercent: number,
    screenWidth: number,
    screenHeight: number
  ) {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(x, y, width, height, height / 2);
    bg.lineStyle(1 * this.uiScale, 0x666666);
    bg.strokeRoundedRect(x, y, width, height, height / 2);
    this.uiElements.push(bg);
    
    // Fill
    const fill = this.add.graphics();
    fill.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    fill.fillRoundedRect(x + 2, y + 2, (width - 4) * fillPercent, height - 4, (height - 4) / 2);
    this.uiElements.push(fill);
    
    // Text
    const textElement = this.add.text(x + width / 2, y + height / 2, text,
      ResponsiveLayout.getTextStyle(12, screenWidth, screenHeight, {
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontWeight: '500'
      })
    ).setOrigin(0.5);
    this.uiElements.push(textElement);
  }
  
  private createResponsiveCurrencyDisplay(layout: any, screenWidth: number, screenHeight: number) {
    // Gold
    const goldText = this.add.text(layout.x, layout.y, '🪙 2,450',
      ResponsiveLayout.getTextStyle(16, screenWidth, screenHeight, {
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    this.uiElements.push(goldText);
    
    // Gems
    const gemsText = this.add.text(layout.x, layout.y + ResponsiveLayout.getScaledFontSize(20, screenWidth, screenHeight), '💎 125',
      ResponsiveLayout.getTextStyle(16, screenWidth, screenHeight, {
        color: '#4B0082',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    this.uiElements.push(gemsText);
    
    // Materials
    const materialsText = this.add.text(layout.x, layout.y + ResponsiveLayout.getScaledFontSize(40, screenWidth, screenHeight), '🔩 18',
      ResponsiveLayout.getTextStyle(16, screenWidth, screenHeight, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    this.uiElements.push(materialsText);
  }
  
  private createResponsiveBottomPanel() {
    const { width, height } = this.scale;
    const bottomPanel = ResponsiveLayout.getResponsiveLayout('BOTTOM_PANEL', width, height);
    
    // Bottom panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a0a, 0.9);
    panel.fillRoundedRect(bottomPanel.x, bottomPanel.y, bottomPanel.width, bottomPanel.height, 8 * this.uiScale);
    panel.lineStyle(2 * this.uiScale, 0x8B0000);
    panel.strokeRoundedRect(bottomPanel.x, bottomPanel.y, bottomPanel.width, bottomPanel.height, 8 * this.uiScale);
    this.uiElements.push(panel);
    
    // Action bar
    this.createResponsiveActionBar();
  }
  
  private createResponsiveSidePanel() {
    const { width, height } = this.scale;
    const rightPanel = ResponsiveLayout.getResponsiveLayout('RIGHT_PANEL', width, height);
    
    // Right side panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a0a, 0.9);
    panel.fillRoundedRect(rightPanel.x, rightPanel.y, rightPanel.width, rightPanel.height, 8 * this.uiScale);
    panel.lineStyle(2 * this.uiScale, 0x8B0000);
    panel.strokeRoundedRect(rightPanel.x, rightPanel.y, rightPanel.width, rightPanel.height, 8 * this.uiScale);
    this.uiElements.push(panel);
    
    // Panel title
    const title = this.add.text(rightPanel.x + rightPanel.width / 2, rightPanel.y + 20 * this.uiScale, 'Quest Log',
      ResponsiveLayout.getTextStyle(16, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    this.uiElements.push(title);
    
    // Mock quest entries
    const quests = [
      'Clear the Whispering Woods',
      'Defeat the Crypt Guardian', 
      'Collect Ancient Runes'
    ];
    
    quests.forEach((quest, index) => {
      const questText = this.add.text(rightPanel.x + 10 * this.uiScale, rightPanel.y + (50 + index * 25) * this.uiScale, `• ${quest}`,
        ResponsiveLayout.getTextStyle(12, width, height, {
          color: '#C0C0C0',
          fontFamily: 'Cinzel, serif',
          wordWrap: { width: rightPanel.width - 20 * this.uiScale }
        })
      );
      this.uiElements.push(questText);
    });
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
  
  private createResponsiveActionBar() {
    const { width, height } = this.scale;
    const actionBar = ResponsiveLayout.getResponsiveLayout('ACTION_BAR', width, height);
    
    // Create skill slots with responsive positioning
    for (let i = 0; i < actionBar.totalSlots; i++) {
      const x = actionBar.x + i * (actionBar.slotSize + actionBar.slotSpacing);
      this.createResponsiveSkillSlot(x, actionBar.y, actionBar.slotSize, i, width, height);
    }
  }

  private createCurrencyDisplay() {
    const { width } = this.scale;
    
    // Gold
    this.add.text(width - 200, 30, '🪙 2,450', {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    
    // Gems
    this.add.text(width - 200, 50, '💎 125', {
      fontSize: '16px',
      color: '#4B0082',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    
    // Materials
    this.add.text(width - 200, 70, '🔩 18', {
      fontSize: '16px',
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
  }

  private createBottomPanel() {
    const { width, height } = this.scale;
    
    // Bottom panel background
    const bottomPanel = this.add.graphics();
    bottomPanel.fillStyle(0x0a0a0a, 0.9);
    bottomPanel.fillRoundedRect(10, height - 110, width - 20, 100, 8);
    bottomPanel.lineStyle(2, 0x8B0000);
    bottomPanel.strokeRoundedRect(10, height - 110, width - 20, 100, 8);
    
    // Action bar
    this.createActionBar();
  }

  private createActionBar() {
    const { width, height } = this.scale;
    const slotSize = 60;
    const slotSpacing = 10;
    const totalSlots = 6;
    const startX = (width - (totalSlots * slotSize + (totalSlots - 1) * slotSpacing)) / 2;
    const slotY = height - 80;
    
    // Create skill slots
    for (let i = 0; i < totalSlots; i++) {
      const x = startX + i * (slotSize + slotSpacing);
      this.createSkillSlot(x, slotY, slotSize, i);
    }
  }

  private createResponsiveSkillSlot(x: number, y: number, size: number, index: number, screenWidth: number, screenHeight: number) {
    // Slot background
    const slot = this.add.graphics();
    slot.fillStyle(0x2d1b1b, 0.8);
    slot.fillRoundedRect(x, y, size, size, 8 * this.uiScale);
    slot.lineStyle(2 * this.uiScale, 0x8B0000);
    slot.strokeRoundedRect(x, y, size, size, 8 * this.uiScale);
    this.uiElements.push(slot);
    
    // Slot number
    const slotNumber = this.add.text(x + size - 8 * this.uiScale, y + 8 * this.uiScale, (index + 1).toString(),
      ResponsiveLayout.getTextStyle(12, screenWidth, screenHeight, {
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(1, 0);
    this.uiElements.push(slotNumber);
    
    // Mock skill icon (placeholder)
    const skillIcon = this.add.text(x + size / 2, y + size / 2, '⚔️', {
      fontSize: `${ResponsiveLayout.getScaledFontSize(24, screenWidth, screenHeight)}px`
    }).setOrigin(0.5);
    this.uiElements.push(skillIcon);
    
    // Make interactive
    const hitArea = this.add.rectangle(x + size / 2, y + size / 2, size, size, 0x000000, 0)
      .setInteractive();
    this.uiElements.push(hitArea);
    
    hitArea.on('pointerover', () => {
      slot.clear();
      slot.fillStyle(0x4a0000, 0.9);
      slot.fillRoundedRect(x, y, size, size, 8 * this.uiScale);
      slot.lineStyle(2 * this.uiScale, 0xDC143C);
      slot.strokeRoundedRect(x, y, size, size, 8 * this.uiScale);
    });
    
    hitArea.on('pointerout', () => {
      slot.clear();
      slot.fillStyle(0x2d1b1b, 0.8);
      slot.fillRoundedRect(x, y, size, size, 8 * this.uiScale);
      slot.lineStyle(2 * this.uiScale, 0x8B0000);
      slot.strokeRoundedRect(x, y, size, size, 8 * this.uiScale);
    });
    
    hitArea.on('pointerdown', () => {
      console.log(`Skill slot ${index + 1} activated`);
      // this.sound.play('skill_use', { volume: 0.6 });
    });
  }

  private createSidePanel() {
    const { width, height } = this.scale;
    
    // Right side panel
    const sidePanel = this.add.graphics();
    sidePanel.fillStyle(0x0a0a0a, 0.9);
    sidePanel.fillRoundedRect(width - 210, 120, 200, height - 240, 8);
    sidePanel.lineStyle(2, 0x8B0000);
    sidePanel.strokeRoundedRect(width - 210, 120, 200, height - 240, 8);
    
    // Panel title
    this.add.text(width - 110, 135, 'Quest Log', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    
    // Mock quest entries
    const quests = [
      'Clear the Whispering Woods',
      'Defeat the Crypt Guardian', 
      'Collect Ancient Runes'
    ];
    
    quests.forEach((quest, index) => {
      this.add.text(width - 200, 160 + index * 25, `• ${quest}`, {
        fontSize: '12px',
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: 180 }
      });
    });
  }

  private createChatPanel() {
    const { width, height } = this.scale;
    
    // Chat panel
    const chatPanel = this.add.graphics();
    chatPanel.fillStyle(0x0a0a0a, 0.8);
    chatPanel.fillRoundedRect(10, height - 250, 400, 130, 8);
    chatPanel.lineStyle(1, 0x666666);
    chatPanel.strokeRoundedRect(10, height - 250, 400, 130, 8);
    
    // Chat title
    this.add.text(20, height - 240, 'Guild Chat', {
      fontSize: '14px',
      color: '#228B22',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    
    // Mock chat messages
    const messages = [
      { player: 'DarkKnight_92', message: 'Anyone up for the crypt raid?', color: '#DC143C' },
      { player: 'MysticMage', message: 'I can heal, count me in!', color: '#4B0082' },
      { player: 'SilentBlade', message: 'Need one more DPS', color: '#228B22' }
    ];
    
    messages.forEach((msg, index) => {
      this.add.text(20, height - 220 + index * 20, `${msg.player}: ${msg.message}`, {
        fontSize: '11px',
        color: msg.color,
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: 370 }
      });
    });
  }

  private createMinimap() {
    const { width } = this.scale;
    
    // Minimap background
    const minimap = this.add.graphics();
    minimap.fillStyle(0x000000, 0.8);
    minimap.fillCircle(width - 100, 200, 60);
    minimap.lineStyle(2, 0x8B0000);
    minimap.strokeCircle(width - 100, 200, 60);
    
    // Minimap title
    this.add.text(width - 100, 130, 'Map', {
      fontSize: '14px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    
    // Player dot
    this.add.circle(width - 100, 200, 3, 0xDC143C);
    
    // Mock location markers
    this.add.circle(width - 120, 180, 2, 0x228B22); // Quest marker
    this.add.circle(width - 80, 220, 2, 0xFFD700);  // Treasure marker
  }

  private setupEventListeners() {
    // Listen for game state changes
    this.gameStore.subscribe((state) => {
      // Update UI based on state changes
      this.updateUI(state);
    });
    
    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-I', () => {
      console.log('Toggle inventory');
    });
    
    this.input.keyboard?.on('keydown-C', () => {
      console.log('Toggle character sheet');
    });
    
    this.input.keyboard?.on('keydown-G', () => {
      console.log('Toggle guild panel');
    });
  }

  private updateUI(state: any) {
    // Update resource bars, currency, etc. based on game state
    // This would be called when the game state changes
  }
}
