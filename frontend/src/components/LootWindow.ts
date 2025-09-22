/**
 * Loot Window Component
 * Handles loot distribution with Need/Greed roll system and personal loot display
 * Based on MECHANICAL_DESIGN.md loot distribution specifications
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface LootItem {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'misc';
  level?: number;
  stats?: { [key: string]: number };
  value: number;
  description: string;
  bindType: 'none' | 'boe' | 'bop'; // Bind on Equip / Bind on Pickup
  quantity: number;
}

export interface LootRoll {
  playerId: string;
  playerName: string;
  rollType: 'need' | 'greed' | 'pass';
  rollValue: number;
  timestamp: Date;
}

export interface LootEntry {
  item: LootItem;
  rollType: 'group' | 'personal';
  rolls: LootRoll[];
  winner?: string;
  rollEndTime?: Date;
  autoLootTimer?: number;
}

export interface LootWindowConfig extends UIComponentConfig {
  autoLootDelay?: number;
  showRollHistory?: boolean;
  compactMode?: boolean;
  rollDuration?: number;
}

export class LootWindow extends UIComponent {
  private lootConfig: LootWindowConfig;
  private lootEntries: LootEntry[] = [];
  private currentPlayerRolls: Map<string, 'need' | 'greed' | 'pass'> = new Map();
  
  // UI Elements
  private lootPanel?: Phaser.GameObjects.Graphics;
  private lootContainer?: Phaser.GameObjects.Container;
  private lootItemElements: Map<string, {
    container: Phaser.GameObjects.Container;
    itemIcon: Phaser.GameObjects.Text;
    itemName: Phaser.GameObjects.Text;
    rollButtons: {
      need: Phaser.GameObjects.Container;
      greed: Phaser.GameObjects.Container;
      pass: Phaser.GameObjects.Container;
    };
    rollDisplay: Phaser.GameObjects.Container;
    timerBar: {
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
    };
  }> = new Map();

  constructor(scene: Phaser.Scene, config: LootWindowConfig = {}) {
    super(scene, config);
    
    this.lootConfig = {
      autoLootDelay: 60000, // 1 minute
      showRollHistory: true,
      compactMode: false,
      rollDuration: 30000, // 30 seconds to roll
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createLootWindow();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createLootWindow(): void {
    const panelWidth = this.lootConfig.compactMode ? 400 : 500;
    const panelHeight = this.calculatePanelHeight();
    
    // Main loot panel
    this.lootPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Title
    this.createTitle();
    
    // Loot container
    this.createLootContainer();
    
    // Update display
    this.updateLootDisplay();
  }

  private calculatePanelHeight(): number {
    const baseHeight = 60; // Title and padding
    const itemHeight = this.lootConfig.compactMode ? 80 : 100;
    return baseHeight + (this.lootEntries.length * itemHeight);
  }

  private createTitle(): void {
    const panelWidth = this.lootConfig.compactMode ? 400 : 500;
    
    const title = this.createGothicText(panelWidth / 2, 15, 'Loot', 18, '#FFD700');
    title.setOrigin(0.5, 0);
  }

  private createLootContainer(): void {
    const panelWidth = this.lootConfig.compactMode ? 400 : 500;
    const containerHeight = this.calculatePanelHeight() - 60;
    
    this.lootContainer = this.scene.add.container(20, 45);
    this.addElement(this.lootContainer);
    
    // Container background
    const containerBg = this.scene.add.graphics();
    containerBg.fillStyle(0x1a1a1a, 0.6);
    containerBg.fillRoundedRect(0, 0, panelWidth - 40, containerHeight, 6);
    containerBg.lineStyle(1, 0x666666);
    containerBg.strokeRoundedRect(0, 0, panelWidth - 40, containerHeight, 6);
    this.lootContainer.add(containerBg);
  }

  private updateLootDisplay(): void {
    if (!this.lootContainer) return;
    
    // Clear existing loot displays (except background)
    const background = this.lootContainer.list[0];
    this.lootContainer.removeAll();
    this.lootContainer.add(background);
    this.lootItemElements.clear();
    
    // Display loot entries
    this.lootEntries.forEach((entry, index) => {
      this.createLootItemDisplay(entry, index);
    });
    
    // Update panel height
    this.updatePanelHeight();
  }

  private createLootItemDisplay(entry: LootEntry, index: number): void {
    if (!this.lootContainer) return;
    
    const panelWidth = this.lootConfig.compactMode ? 400 : 500;
    const itemHeight = this.lootConfig.compactMode ? 80 : 100;
    const y = 10 + (index * itemHeight);
    
    // Item container
    const itemContainer = this.scene.add.container(0, y);
    this.lootContainer.add(itemContainer);
    
    // Item background
    const itemBg = this.scene.add.graphics();
    const rarityColor = this.getRarityColor(entry.item.rarity);
    itemBg.fillStyle(0x2F2F2F, 0.8);
    itemBg.fillRoundedRect(5, 0, panelWidth - 60, itemHeight - 5, 6);
    itemBg.lineStyle(2, rarityColor);
    itemBg.strokeRoundedRect(5, 0, panelWidth - 60, itemHeight - 5, 6);
    itemContainer.add(itemBg);
    
    // Item icon
    const itemIcon = this.scene.add.text(20, itemHeight / 2, entry.item.icon, {
      fontSize: `${32 * this.uiScale}px`,
      color: '#F5F5DC'
    }).setOrigin(0, 0.5);
    itemContainer.add(itemIcon);
    
    // Item name and details
    const itemName = this.scene.add.text(60, 15, entry.item.name, {
      fontSize: `${14 * this.uiScale}px`,
      color: this.getRarityTextColor(entry.item.rarity),
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    itemContainer.add(itemName);
    
    const itemDetails = this.scene.add.text(60, 35, 
      `${entry.item.rarity.charAt(0).toUpperCase() + entry.item.rarity.slice(1)} ${entry.item.type}${entry.item.level ? ` (Level ${entry.item.level})` : ''}`, {
      fontSize: `${11 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    });
    itemContainer.add(itemDetails);
    
    // Quantity (if > 1)
    if (entry.item.quantity > 1) {
      const quantityText = this.scene.add.text(45, 45, `x${entry.item.quantity}`, {
        fontSize: `${12 * this.uiScale}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      });
      itemContainer.add(quantityText);
    }
    
    // Roll buttons or personal loot indicator
    if (entry.rollType === 'group') {
      this.createRollButtons(entry, itemContainer, panelWidth - 80, itemHeight);
    } else {
      this.createPersonalLootIndicator(entry, itemContainer, panelWidth - 80, itemHeight);
    }
    
    // Timer bar for group loot
    if (entry.rollType === 'group' && entry.rollEndTime) {
      this.createRollTimer(entry, itemContainer, panelWidth - 60, itemHeight);
    }
    
    // Roll display
    if (entry.rollType === 'group' && this.lootConfig.showRollHistory) {
      this.createRollDisplay(entry, itemContainer, panelWidth - 60, itemHeight);
    }
    
    // Store elements for updates
    this.lootItemElements.set(entry.item.id, {
      container: itemContainer,
      itemIcon,
      itemName,
      rollButtons: {} as any, // Will be populated by createRollButtons
      rollDisplay: itemContainer, // Placeholder
      timerBar: {} as any // Will be populated by createRollTimer
    });
  }

  private createRollButtons(entry: LootEntry, container: Phaser.GameObjects.Container, startX: number, itemHeight: number): void {
    const buttonWidth = 50;
    const buttonHeight = 20;
    const buttonSpacing = 5;
    const buttonsY = itemHeight / 2 - 10;
    
    const playerRoll = this.currentPlayerRolls.get(entry.item.id);
    
    // Need button
    const needButton = this.createLootButton(
      startX, buttonsY, buttonWidth, buttonHeight, 'Need', '#32CD32',
      playerRoll === 'need', () => this.rollForItem(entry.item.id, 'need')
    );
    container.add(needButton);
    
    // Greed button
    const greedButton = this.createLootButton(
      startX + buttonWidth + buttonSpacing, buttonsY, buttonWidth, buttonHeight, 'Greed', '#FFD700',
      playerRoll === 'greed', () => this.rollForItem(entry.item.id, 'greed')
    );
    container.add(greedButton);
    
    // Pass button
    const passButton = this.createLootButton(
      startX + (buttonWidth + buttonSpacing) * 2, buttonsY, buttonWidth, buttonHeight, 'Pass', '#999999',
      playerRoll === 'pass', () => this.rollForItem(entry.item.id, 'pass')
    );
    container.add(passButton);
  }

  private createLootButton(
    x: number, y: number, width: number, height: number, 
    text: string, color: string, isSelected: boolean, onClick: () => void
  ): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(isSelected ? 0x4a0000 : 0x2F2F2F, 0.8);
    buttonBg.fillRoundedRect(0, 0, width, height, 4);
    buttonBg.lineStyle(1, isSelected ? 0xDC143C : Phaser.Display.Color.HexStringToColor(color).color);
    buttonBg.strokeRoundedRect(0, 0, width, height, 4);
    buttonContainer.add(buttonBg);
    
    // Button text
    const buttonText = this.scene.add.text(width / 2, height / 2, text, {
      fontSize: `${10 * this.uiScale}px`,
      color: isSelected ? '#F5F5DC' : color,
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    buttonContainer.add(buttonText);
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setInteractive();
    buttonContainer.add(hitArea);
    
    hitArea.on('pointerdown', onClick);
    
    return buttonContainer;
  }

  private createPersonalLootIndicator(entry: LootEntry, container: Phaser.GameObjects.Container, startX: number, itemHeight: number): void {
    const indicator = this.scene.add.text(startX + 50, itemHeight / 2, 'Personal Loot', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#32CD32',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    container.add(indicator);
    
    // Auto-loot button
    const autoLootButton = this.createLootButton(
      startX, itemHeight / 2 - 10, 80, 20, 'Take All', '#4169E1',
      false, () => this.takePersonalLoot(entry.item.id)
    );
    container.add(autoLootButton);
  }

  private createRollTimer(entry: LootEntry, container: Phaser.GameObjects.Container, width: number, itemHeight: number): void {
    if (!entry.rollEndTime) return;
    
    const timerY = itemHeight - 15;
    const timerWidth = width - 20;
    const timerHeight = 8;
    
    // Timer background
    const timerBg = this.scene.add.graphics();
    timerBg.fillStyle(0x000000, 0.8);
    timerBg.fillRoundedRect(10, timerY, timerWidth, timerHeight, timerHeight / 2);
    container.add(timerBg);
    
    // Timer fill
    const timerFill = this.scene.add.graphics();
    container.add(timerFill);
    
    // Update timer
    this.updateRollTimer(entry, timerFill, 10, timerY, timerWidth, timerHeight);
  }

  private createRollDisplay(entry: LootEntry, container: Phaser.GameObjects.Container, width: number, itemHeight: number): void {
    const rollDisplayY = 55;
    
    entry.rolls.forEach((roll, index) => {
      const rollY = rollDisplayY + (index * 12);
      
      const rollText = `${roll.playerName}: ${roll.rollType.toUpperCase()} (${roll.rollValue})`;
      const rollColor = this.getRollTypeColor(roll.rollType);
      
      const rollElement = this.scene.add.text(60, rollY, rollText, {
        fontSize: `${9 * this.uiScale}px`,
        color: rollColor,
        fontFamily: 'Cinzel, serif'
      });
      container.add(rollElement);
    });
  }

  private updateRollTimer(
    entry: LootEntry, 
    timerFill: Phaser.GameObjects.Graphics,
    x: number, y: number, width: number, height: number
  ): void {
    if (!entry.rollEndTime) return;
    
    const now = Date.now();
    const timeRemaining = Math.max(0, entry.rollEndTime.getTime() - now);
    const progress = timeRemaining / this.lootConfig.rollDuration!;
    
    timerFill.clear();
    timerFill.fillStyle(timeRemaining < 10000 ? 0xFF4444 : 0xFFD700); // Red when < 10s
    timerFill.fillRoundedRect(x + 1, y + 1, (width - 2) * progress, height - 2, (height - 2) / 2);
    
    if (timeRemaining > 0) {
      this.scene.time.delayedCall(100, () => {
        this.updateRollTimer(entry, timerFill, x, y, width, height);
      });
    } else {
      // Timer expired, resolve rolls
      this.resolveRolls(entry);
    }
  }

  private updatePanelHeight(): void {
    const newHeight = this.calculatePanelHeight();
    const panelWidth = this.lootConfig.compactMode ? 400 : 500;
    
    if (this.lootPanel) {
      this.lootPanel.clear();
      this.lootPanel.fillStyle(0x0a0a0a, 0.9);
      this.lootPanel.fillRoundedRect(0, 0, panelWidth, newHeight, 8 * this.uiScale);
      this.lootPanel.lineStyle(2 * this.uiScale, 0x8B0000);
      this.lootPanel.strokeRoundedRect(0, 0, panelWidth, newHeight, 8 * this.uiScale);
    }
  }

  private getRarityColor(rarity: string): number {
    const colors = {
      'common': 0x9d9d9d,
      'uncommon': 0x1eff00,
      'rare': 0x0070dd,
      'epic': 0xa335ee,
      'legendary': 0xff8000
    };
    return colors[rarity as keyof typeof colors] || 0x666666;
  }

  private getRarityTextColor(rarity: string): string {
    const colors = {
      'common': '#9d9d9d',
      'uncommon': '#1eff00',
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };
    return colors[rarity as keyof typeof colors] || '#F5F5DC';
  }

  private getRollTypeColor(rollType: string): string {
    const colors = {
      'need': '#32CD32',
      'greed': '#FFD700',
      'pass': '#999999'
    };
    return colors[rollType as keyof typeof colors] || '#F5F5DC';
  }

  public addLoot(item: LootItem, isPersonalLoot: boolean = false): void {
    const entry: LootEntry = {
      item,
      rollType: isPersonalLoot ? 'personal' : 'group',
      rolls: [],
      rollEndTime: isPersonalLoot ? undefined : new Date(Date.now() + this.lootConfig.rollDuration!)
    };
    
    // Set auto-loot timer for personal loot
    if (isPersonalLoot) {
      entry.autoLootTimer = window.setTimeout(() => {
        this.autoLootItem(item.id);
      }, this.lootConfig.autoLootDelay!);
    }
    
    this.lootEntries.push(entry);
    this.updateLootDisplay();
    this.show();
    
    console.log(`Added ${isPersonalLoot ? 'personal' : 'group'} loot: ${item.name}`);
    this.scene.events.emit('loot:item:added', { item, isPersonalLoot });
  }

  private rollForItem(itemId: string, rollType: 'need' | 'greed' | 'pass'): void {
    const entry = this.lootEntries.find(e => e.item.id === itemId);
    if (!entry || entry.rollType !== 'group') return;
    
    // Check if player already rolled
    if (this.currentPlayerRolls.has(itemId)) {
      console.log('You have already rolled for this item');
      return;
    }
    
    // Generate roll value (1-100)
    const rollValue = rollType === 'pass' ? 0 : Math.floor(Math.random() * 100) + 1;
    
    const roll: LootRoll = {
      playerId: 'player',
      playerName: 'You',
      rollType,
      rollValue,
      timestamp: new Date()
    };
    
    entry.rolls.push(roll);
    this.currentPlayerRolls.set(itemId, rollType);
    
    console.log(`Rolled ${rollType.toUpperCase()} (${rollValue}) for ${entry.item.name}`);
    
    // Simulate other players rolling
    this.simulateOtherPlayerRolls(entry);
    
    this.updateLootDisplay();
    this.scene.events.emit('loot:roll:submitted', { itemId, rollType, rollValue });
  }

  private simulateOtherPlayerRolls(entry: LootEntry): void {
    const partyMembers = ['DarkKnight_92', 'MysticMage', 'SilentBlade', 'HolyPriest'];
    
    partyMembers.forEach((member, index) => {
      this.scene.time.delayedCall((index + 1) * 2000, () => {
        if (entry.rollEndTime && Date.now() < entry.rollEndTime.getTime()) {
          const rollTypes: Array<'need' | 'greed' | 'pass'> = ['need', 'greed', 'pass'];
          const randomRollType = rollTypes[Math.floor(Math.random() * rollTypes.length)];
          const rollValue = randomRollType === 'pass' ? 0 : Math.floor(Math.random() * 100) + 1;
          
          entry.rolls.push({
            playerId: `player_${index}`,
            playerName: member,
            rollType: randomRollType,
            rollValue,
            timestamp: new Date()
          });
          
          this.updateLootDisplay();
        }
      });
    });
  }

  private resolveRolls(entry: LootEntry): void {
    if (entry.rollType !== 'group' || entry.rolls.length === 0) return;
    
    // Determine winner based on Need > Greed priority and roll values
    const needRolls = entry.rolls.filter(r => r.rollType === 'need').sort((a, b) => b.rollValue - a.rollValue);
    const greedRolls = entry.rolls.filter(r => r.rollType === 'greed').sort((a, b) => b.rollValue - a.rollValue);
    
    let winner: LootRoll | undefined;
    
    if (needRolls.length > 0) {
      winner = needRolls[0];
    } else if (greedRolls.length > 0) {
      winner = greedRolls[0];
    }
    
    if (winner) {
      entry.winner = winner.playerName;
      console.log(`${winner.playerName} won ${entry.item.name} with ${winner.rollType.toUpperCase()} (${winner.rollValue})`);
      
      // Add to chat
      const chatSystem = this.scene.scene.get('UIScene')?.['uiManager']?.getChatSystem();
      if (chatSystem) {
        chatSystem.sendLootMessage(`${winner.playerName} won ${entry.item.name}!`);
      }
      
      this.scene.events.emit('loot:item:won', { item: entry.item, winner: winner.playerName });
    } else {
      console.log(`No one rolled for ${entry.item.name}`);
    }
    
    // Remove loot entry after a delay
    this.scene.time.delayedCall(3000, () => {
      this.removeLootEntry(entry.item.id);
    });
  }

  private takePersonalLoot(itemId: string): void {
    const entry = this.lootEntries.find(e => e.item.id === itemId);
    if (!entry || entry.rollType !== 'personal') return;
    
    console.log(`Taking personal loot: ${entry.item.name}`);
    
    // Clear auto-loot timer
    if (entry.autoLootTimer) {
      clearTimeout(entry.autoLootTimer);
    }
    
    this.scene.events.emit('loot:personal:taken', entry.item);
    this.removeLootEntry(itemId);
  }

  private autoLootItem(itemId: string): void {
    const entry = this.lootEntries.find(e => e.item.id === itemId);
    if (!entry || entry.rollType !== 'personal') return;
    
    console.log(`Auto-looting: ${entry.item.name}`);
    this.scene.events.emit('loot:personal:auto', entry.item);
    this.removeLootEntry(itemId);
  }

  private removeLootEntry(itemId: string): void {
    this.lootEntries = this.lootEntries.filter(e => e.item.id !== itemId);
    this.currentPlayerRolls.delete(itemId);
    this.lootItemElements.delete(itemId);
    
    if (this.lootEntries.length === 0) {
      this.hide();
    } else {
      this.updateLootDisplay();
    }
  }

  public clearAllLoot(): void {
    // Clear any auto-loot timers
    this.lootEntries.forEach(entry => {
      if (entry.autoLootTimer) {
        clearTimeout(entry.autoLootTimer);
      }
    });
    
    this.lootEntries = [];
    this.currentPlayerRolls.clear();
    this.lootItemElements.clear();
    this.hide();
  }

  public passOnAllItems(): void {
    this.lootEntries.forEach(entry => {
      if (entry.rollType === 'group' && !this.currentPlayerRolls.has(entry.item.id)) {
        this.rollForItem(entry.item.id, 'pass');
      }
    });
  }

  public needAllItems(): void {
    this.lootEntries.forEach(entry => {
      if (entry.rollType === 'group' && !this.currentPlayerRolls.has(entry.item.id)) {
        this.rollForItem(entry.item.id, 'need');
      }
    });
  }

  public greedAllItems(): void {
    this.lootEntries.forEach(entry => {
      if (entry.rollType === 'group' && !this.currentPlayerRolls.has(entry.item.id)) {
        this.rollForItem(entry.item.id, 'greed');
      }
    });
  }

  protected onResize(width: number, height: number): void {
    // Recreate loot window with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.lootItemElements.clear();
    this.create();
  }
}
