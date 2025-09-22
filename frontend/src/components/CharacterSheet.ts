/**
 * Character Sheet Component
 * Displays character stats, gear slots, and progression information
 * Based on MECHANICAL_DESIGN.md specifications
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface CharacterStats {
  // Primary Stats (SRD foundation)
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Secondary Stats
  criticalChance: number;
  haste: number;
  lifesteal: number;
  block: number;
  spellPenetration: number;
  
  // Utility Stats
  movementSpeed: number;
  healthRegen: number;
  manaRegen: number;
  aoeRadius: number;
  healingBonus: number;
}

export interface GearSlot {
  id: string;
  name: string;
  type: 'head' | 'chest' | 'legs' | 'hands' | 'feet' | 'shoulders' | 'mainhand' | 'offhand' | 'ring1' | 'ring2' | 'necklace' | 'trinket';
  item: any | null; // Will use InventoryItem type
  icon: string;
  position: { x: number; y: number };
}

export interface CharacterInfo {
  name: string;
  level: number;
  experience: number;
  maxExperience: number;
  class: string;
  subclass?: string;
  race: string;
  gearScore: number;
  stats: CharacterStats;
  gearSlots: GearSlot[];
}

export interface CharacterSheetConfig extends UIComponentConfig {
  showGearSlots?: boolean;
  showStats?: boolean;
  showProgression?: boolean;
  compactMode?: boolean;
}

export class CharacterSheet extends UIComponent {
  private characterSheetConfig: CharacterSheetConfig;
  private characterInfo: CharacterInfo;
  
  // UI Elements
  private characterPanel?: Phaser.GameObjects.Graphics;
  private gearSlotElements: Map<string, {
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    itemIcon: Phaser.GameObjects.Text;
    hitArea: Phaser.GameObjects.Rectangle;
  }> = new Map();
  
  private statTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private progressBars: Map<string, {
    bg: Phaser.GameObjects.Graphics;
    fill: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  }> = new Map();
  
  private paperDoll?: Phaser.GameObjects.Container;
  private statsPanel?: Phaser.GameObjects.Container;
  private progressionPanel?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: CharacterSheetConfig = {}) {
    super(scene, config);
    
    this.characterSheetConfig = {
      showGearSlots: true,
      showStats: true,
      showProgression: true,
      compactMode: false,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.initializeCharacterInfo();
    this.createCharacterSheet();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createCharacterSheet(): void {
    const panelWidth = this.characterSheetConfig.compactMode ? 600 : 800;
    const panelHeight = this.characterSheetConfig.compactMode ? 500 : 650;
    
    // Main character sheet panel
    this.characterPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Title
    this.createTitle();
    
    // Character info section
    this.createCharacterInfo();
    
    // Paper doll (gear visualization)
    if (this.characterSheetConfig.showGearSlots) {
      this.createPaperDoll();
    }
    
    // Stats panel
    if (this.characterSheetConfig.showStats) {
      this.createStatsPanel();
    }
    
    // Progression panel
    if (this.characterSheetConfig.showProgression) {
      this.createProgressionPanel();
    }
  }

  private initializeCharacterInfo(): void {
    // Initialize with default character data
    this.characterInfo = {
      name: 'Grimjaw the Warrior',
      level: 8,
      experience: 1250,
      maxExperience: 1500,
      class: 'Fighter',
      subclass: 'Guardian',
      race: 'Human',
      gearScore: 245,
      stats: {
        // Primary Stats
        strength: 18,
        dexterity: 12,
        constitution: 16,
        intelligence: 10,
        wisdom: 13,
        charisma: 14,
        
        // Secondary Stats
        criticalChance: 8.5,
        haste: 12.3,
        lifesteal: 3.2,
        block: 15.8,
        spellPenetration: 0,
        
        // Utility Stats
        movementSpeed: 105,
        healthRegen: 2.5,
        manaRegen: 1.8,
        aoeRadius: 100,
        healingBonus: 5.0
      },
      gearSlots: this.initializeGearSlots()
    };
  }

  private initializeGearSlots(): GearSlot[] {
    return [
      // Armor slots arranged in paper doll layout
      { id: 'head', name: 'Head', type: 'head', item: null, icon: '🎩', position: { x: 150, y: 80 } },
      { id: 'shoulders', name: 'Shoulders', type: 'shoulders', item: null, icon: '👔', position: { x: 150, y: 120 } },
      { id: 'chest', name: 'Chest', type: 'chest', item: null, icon: '🦺', position: { x: 150, y: 160 } },
      { id: 'hands', name: 'Hands', type: 'hands', item: null, icon: '🧤', position: { x: 150, y: 200 } },
      { id: 'legs', name: 'Legs', type: 'legs', item: null, icon: '👖', position: { x: 150, y: 240 } },
      { id: 'feet', name: 'Feet', type: 'feet', item: null, icon: '👢', position: { x: 150, y: 280 } },
      
      // Weapon slots
      { id: 'mainhand', name: 'Main Hand', type: 'mainhand', item: null, icon: '⚔️', position: { x: 100, y: 180 } },
      { id: 'offhand', name: 'Off Hand', type: 'offhand', item: null, icon: '🛡️', position: { x: 200, y: 180 } },
      
      // Jewelry slots
      { id: 'necklace', name: 'Necklace', type: 'necklace', item: null, icon: '📿', position: { x: 150, y: 50 } },
      { id: 'ring1', name: 'Ring 1', type: 'ring1', item: null, icon: '💍', position: { x: 80, y: 220 } },
      { id: 'ring2', name: 'Ring 2', type: 'ring2', item: null, icon: '💍', position: { x: 220, y: 220 } },
      { id: 'trinket', name: 'Trinket', type: 'trinket', item: null, icon: '🔮', position: { x: 150, y: 320 } }
    ];
  }

  private createTitle(): void {
    const title = this.createGothicText(
      (this.characterSheetConfig.compactMode ? 600 : 800) / 2,
      15,
      'Character Sheet',
      20,
      '#DC143C'
    );
    title.setOrigin(0.5, 0);
  }

  private createCharacterInfo(): void {
    const startX = 20;
    const startY = 50;
    
    // Character name and level
    const nameText = this.createGothicText(startX, startY, this.characterInfo.name, 18, '#F5F5DC');
    
    const levelText = this.createGothicText(
      startX, 
      startY + 25, 
      `Level ${this.characterInfo.level} ${this.characterInfo.race} ${this.characterInfo.subclass || this.characterInfo.class}`, 
      14, 
      '#C0C0C0'
    );
    
    // Gear Score
    const gearScoreText = this.createGothicText(
      startX, 
      startY + 50, 
      `Gear Score: ${this.characterInfo.gearScore}`, 
      14, 
      '#FFD700'
    );
    
    // Experience bar
    this.createExperienceBar(startX, startY + 80);
  }

  private createExperienceBar(x: number, y: number): void {
    const barWidth = 250;
    const barHeight = 20;
    
    const expPercent = this.characterInfo.experience / this.characterInfo.maxExperience;
    
    const expBar = this.createResourceBar(x, y, barWidth, barHeight, '#FFD700', expPercent);
    
    const expText = this.createGothicText(
      x + barWidth / 2,
      y + barHeight / 2,
      `${this.characterInfo.experience} / ${this.characterInfo.maxExperience} XP`,
      11,
      '#000000'
    );
    expText.setOrigin(0.5);
    
    this.progressBars.set('experience', {
      bg: expBar.bg,
      fill: expBar.fill,
      text: expText
    });
  }

  private createPaperDoll(): void {
    if (!this.characterSheetConfig.showGearSlots) return;
    
    const paperDollX = 50;
    const paperDollY = 120;
    
    this.paperDoll = this.scene.add.container(paperDollX, paperDollY);
    this.addElement(this.paperDoll);
    
    // Paper doll background
    const dollBg = this.scene.add.graphics();
    dollBg.fillStyle(0x1a1a1a, 0.5);
    dollBg.fillRoundedRect(-20, -20, 240, 280, 8);
    dollBg.lineStyle(2, 0x8B0000);
    dollBg.strokeRoundedRect(-20, -20, 240, 280, 8);
    this.paperDoll.add(dollBg);
    
    // Character silhouette
    const silhouette = this.scene.add.text(100, 150, '🧙‍♂️', {
      fontSize: '80px',
      color: '#2F2F2F'
    }).setOrigin(0.5);
    this.paperDoll.add(silhouette);
    
    // Create gear slots
    this.characterInfo.gearSlots.forEach(slot => {
      this.createGearSlot(slot);
    });
  }

  private createGearSlot(slot: GearSlot): void {
    if (!this.paperDoll) return;
    
    const slotSize = 40;
    const { x, y } = slot.position;
    
    // Slot background
    const background = this.scene.add.graphics();
    background.fillStyle(0x2d1b1b, 0.8);
    background.fillRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 6);
    background.lineStyle(2, 0x666666);
    background.strokeRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 6);
    this.paperDoll.add(background);
    
    // Slot icon (empty slot indicator)
    const icon = this.scene.add.text(x, y, slot.icon, {
      fontSize: `${slotSize * 0.6}px`,
      color: '#666666'
    }).setOrigin(0.5);
    this.paperDoll.add(icon);
    
    // Item icon (hidden initially)
    const itemIcon = this.scene.add.text(x, y, '', {
      fontSize: `${slotSize * 0.7}px`,
      color: '#F5F5DC'
    }).setOrigin(0.5);
    itemIcon.setVisible(false);
    this.paperDoll.add(itemIcon);
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x000000, 0)
      .setInteractive();
    this.paperDoll.add(hitArea);
    
    // Store elements
    this.gearSlotElements.set(slot.id, {
      background,
      icon,
      itemIcon,
      hitArea
    });
    
    this.setupGearSlotInteractivity(slot);
  }

  private setupGearSlotInteractivity(slot: GearSlot): void {
    const elements = this.gearSlotElements.get(slot.id);
    if (!elements) return;
    
    const { hitArea, background } = elements;
    const slotSize = 40;
    const { x, y } = slot.position;
    
    hitArea.on('pointerover', () => {
      background.clear();
      background.fillStyle(0x4a0000, 0.9);
      background.fillRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 6);
      background.lineStyle(2, 0xDC143C);
      background.strokeRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 6);
      
      if (slot.item) {
        this.showGearTooltip(slot.item, x, y - slotSize);
      } else {
        this.showSlotTooltip(slot.name, x, y - slotSize);
      }
    });
    
    hitArea.on('pointerout', () => {
      background.clear();
      background.fillStyle(0x2d1b1b, 0.8);
      background.fillRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 6);
      background.lineStyle(2, slot.item ? this.getRarityColor(slot.item.rarity) : 0x666666);
      background.strokeRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 6);
      
      this.hideTooltip();
    });
    
    hitArea.on('pointerdown', () => {
      this.handleGearSlotClick(slot);
    });
  }

  private handleGearSlotClick(slot: GearSlot): void {
    console.log(`Clicked gear slot: ${slot.name}`);
    this.scene.events.emit('charactersheet:gearslot:clicked', slot);
  }

  private createStatsPanel(): void {
    if (!this.characterSheetConfig.showStats) return;
    
    const panelX = this.characterSheetConfig.compactMode ? 320 : 400;
    const panelY = 120;
    const panelWidth = this.characterSheetConfig.compactMode ? 260 : 180;
    const panelHeight = 350;
    
    this.statsPanel = this.scene.add.container(panelX, panelY);
    this.addElement(this.statsPanel);
    
    // Stats panel background
    const statsBg = this.scene.add.graphics();
    statsBg.fillStyle(0x1a1a1a, 0.7);
    statsBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    statsBg.lineStyle(2, 0x8B0000);
    statsBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    this.statsPanel.add(statsBg);
    
    // Stats title
    const statsTitle = this.scene.add.text(panelWidth / 2, 15, 'Character Stats', {
      fontSize: '16px',
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 0);
    this.statsPanel.add(statsTitle);
    
    this.createPrimaryStats();
    this.createSecondaryStats();
    this.createUtilityStats();
  }

  private createPrimaryStats(): void {
    if (!this.statsPanel) return;
    
    const startY = 45;
    const lineHeight = 20;
    
    // Primary stats section
    const primaryTitle = this.scene.add.text(10, startY, 'Primary Attributes', {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.statsPanel.add(primaryTitle);
    
    const primaryStats = [
      { name: 'Strength', value: this.characterInfo.stats.strength, description: 'Melee power, carry weight' },
      { name: 'Dexterity', value: this.characterInfo.stats.dexterity, description: 'Crit chance, dodge, ranged accuracy' },
      { name: 'Constitution', value: this.characterInfo.stats.constitution, description: 'HP, resistances' },
      { name: 'Intelligence', value: this.characterInfo.stats.intelligence, description: 'Spell power, mana regen' },
      { name: 'Wisdom', value: this.characterInfo.stats.wisdom, description: 'Healing effectiveness, mana efficiency' },
      { name: 'Charisma', value: this.characterInfo.stats.charisma, description: 'Social mechanics, guild bonuses' }
    ];
    
    primaryStats.forEach((stat, index) => {
      const y = startY + 25 + (index * lineHeight);
      
      const statText = this.scene.add.text(15, y, `${stat.name}: ${stat.value}`, {
        fontSize: '12px',
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      });
      this.statsPanel.add(statText);
      this.statTexts.set(`primary_${stat.name.toLowerCase()}`, statText);
    });
  }

  private createSecondaryStats(): void {
    if (!this.statsPanel) return;
    
    const startY = 185;
    const lineHeight = 18;
    
    // Secondary stats section
    const secondaryTitle = this.scene.add.text(10, startY, 'Combat Stats', {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.statsPanel.add(secondaryTitle);
    
    const secondaryStats = [
      { name: 'Critical Chance', value: this.characterInfo.stats.criticalChance, suffix: '%' },
      { name: 'Haste', value: this.characterInfo.stats.haste, suffix: '%' },
      { name: 'Lifesteal', value: this.characterInfo.stats.lifesteal, suffix: '%' },
      { name: 'Block', value: this.characterInfo.stats.block, suffix: '%' },
      { name: 'Spell Penetration', value: this.characterInfo.stats.spellPenetration, suffix: '' }
    ];
    
    secondaryStats.forEach((stat, index) => {
      const y = startY + 25 + (index * lineHeight);
      
      const statText = this.scene.add.text(15, y, `${stat.name}: ${stat.value}${stat.suffix}`, {
        fontSize: '11px',
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      });
      this.statsPanel.add(statText);
      this.statTexts.set(`secondary_${stat.name.toLowerCase().replace(' ', '_')}`, statText);
    });
  }

  private createUtilityStats(): void {
    if (!this.statsPanel) return;
    
    const startY = 280;
    const lineHeight = 18;
    
    // Utility stats section
    const utilityTitle = this.scene.add.text(10, startY, 'Utility Stats', {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.statsPanel.add(utilityTitle);
    
    const utilityStats = [
      { name: 'Movement Speed', value: this.characterInfo.stats.movementSpeed, suffix: '%' },
      { name: 'Health Regen', value: this.characterInfo.stats.healthRegen, suffix: '/sec' },
      { name: 'Mana Regen', value: this.characterInfo.stats.manaRegen, suffix: '/sec' }
    ];
    
    utilityStats.forEach((stat, index) => {
      const y = startY + 25 + (index * lineHeight);
      
      const statText = this.scene.add.text(15, y, `${stat.name}: ${stat.value}${stat.suffix}`, {
        fontSize: '11px',
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      });
      this.statsPanel.add(statText);
      this.statTexts.set(`utility_${stat.name.toLowerCase().replace(' ', '_')}`, statText);
    });
  }

  private createProgressionPanel(): void {
    if (!this.characterSheetConfig.showProgression) return;
    
    const panelX = this.characterSheetConfig.compactMode ? 320 : 600;
    const panelY = 120;
    const panelWidth = this.characterSheetConfig.compactMode ? 260 : 180;
    const panelHeight = 200;
    
    this.progressionPanel = this.scene.add.container(panelX, panelY);
    this.addElement(this.progressionPanel);
    
    // Progression panel background
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(0x1a1a1a, 0.7);
    progressBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    progressBg.lineStyle(2, 0x8B0000);
    progressBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    this.progressionPanel.add(progressBg);
    
    // Progression title
    const progressTitle = this.scene.add.text(panelWidth / 2, 15, 'Progression', {
      fontSize: '16px',
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 0);
    this.progressionPanel.add(progressTitle);
    
    // Next level info
    const nextLevelText = this.scene.add.text(10, 45, `Next Level: ${this.characterInfo.level + 1}`, {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.progressionPanel.add(nextLevelText);
    
    // Experience needed
    const expNeeded = this.characterInfo.maxExperience - this.characterInfo.experience;
    const expNeededText = this.scene.add.text(10, 70, `Experience Needed: ${expNeeded}`, {
      fontSize: '12px',
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    });
    this.progressionPanel.add(expNeededText);
    
    // Subclass info
    if (this.characterInfo.subclass) {
      const subclassText = this.scene.add.text(10, 95, `Subclass: ${this.characterInfo.subclass}`, {
        fontSize: '12px',
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      });
      this.progressionPanel.add(subclassText);
    }
    
    // Available skill points (placeholder)
    const skillPointsText = this.scene.add.text(10, 120, 'Skill Points: 2', {
      fontSize: '12px',
      color: '#32CD32',
      fontFamily: 'Cinzel, serif'
    });
    this.progressionPanel.add(skillPointsText);
    
    // Talent tree button
    const talentButton = this.createButton(10, 150, panelWidth - 20, 30, 'Open Talent Tree', () => {
      this.openTalentTree();
    });
  }

  private openTalentTree(): void {
    console.log('Opening talent tree...');
    this.scene.events.emit('charactersheet:talent_tree:open');
  }

  private showGearTooltip(item: any, x: number, y: number): void {
    // Create gear tooltip with stats
    let tooltipText = `${item.name}\n`;
    tooltipText += `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} ${item.type}\n`;
    if (item.level) tooltipText += `Level ${item.level}\n`;
    if (item.stats) {
      tooltipText += '\nStats:\n';
      Object.entries(item.stats).forEach(([stat, value]) => {
        tooltipText += `+${value} ${stat}\n`;
      });
    }
    tooltipText += `\n${item.description}`;
    
    const tooltip = this.createGothicText(x, y, tooltipText, 10, '#FFFFFF');
    tooltip.setOrigin(0.5, 1).setName('gearTooltip');
    tooltip.setBackgroundColor('#000000');
    tooltip.setPadding(8);
  }

  private showSlotTooltip(slotName: string, x: number, y: number): void {
    const tooltip = this.createGothicText(x, y, `${slotName}\n(Empty)`, 10, '#FFFFFF');
    tooltip.setOrigin(0.5, 1).setName('slotTooltip');
    tooltip.setBackgroundColor('#000000');
    tooltip.setPadding(8);
  }

  private hideTooltip(): void {
    const gearTooltip = this.container.getByName('gearTooltip');
    const slotTooltip = this.container.getByName('slotTooltip');
    if (gearTooltip) gearTooltip.destroy();
    if (slotTooltip) slotTooltip.destroy();
  }

  private getRarityColor(rarity?: string): number {
    const colors = {
      'common': 0x9d9d9d,
      'uncommon': 0x1eff00,
      'rare': 0x0070dd,
      'epic': 0xa335ee,
      'legendary': 0xff8000
    };
    return colors[rarity as keyof typeof colors] || 0x666666;
  }

  public updateCharacterInfo(info: Partial<CharacterInfo>): void {
    Object.assign(this.characterInfo, info);
    
    // Update UI elements
    this.updateStatsDisplay();
    this.updateProgressionDisplay();
    this.updateGearDisplay();
  }

  private updateStatsDisplay(): void {
    // Update stat text elements
    this.statTexts.forEach((textElement, key) => {
      if (key.startsWith('primary_')) {
        const statName = key.replace('primary_', '');
        const value = this.characterInfo.stats[statName as keyof CharacterStats];
        textElement.setText(`${statName.charAt(0).toUpperCase() + statName.slice(1)}: ${value}`);
      }
      // Similar updates for secondary and utility stats...
    });
  }

  private updateProgressionDisplay(): void {
    // Update experience bar
    const expBar = this.progressBars.get('experience');
    if (expBar) {
      const expPercent = this.characterInfo.experience / this.characterInfo.maxExperience;
      // Update bar fill (would need to recreate or store original dimensions)
      expBar.text.setText(`${this.characterInfo.experience} / ${this.characterInfo.maxExperience} XP`);
    }
  }

  private updateGearDisplay(): void {
    // Update gear slot displays
    this.characterInfo.gearSlots.forEach(slot => {
      const elements = this.gearSlotElements.get(slot.id);
      if (elements) {
        if (slot.item) {
          elements.itemIcon.setText(slot.item.icon).setVisible(true);
          elements.icon.setVisible(false);
        } else {
          elements.itemIcon.setVisible(false);
          elements.icon.setVisible(true);
        }
      }
    });
  }

  public equipItem(slotId: string, item: any): boolean {
    const slot = this.characterInfo.gearSlots.find(s => s.id === slotId);
    if (!slot) return false;
    
    // Check if item can be equipped in this slot
    if (item.slot !== slot.type) return false;
    
    const previousItem = slot.item;
    slot.item = item;
    
    this.updateGearDisplay();
    this.scene.events.emit('charactersheet:item:equipped', { slot: slotId, item, previousItem });
    
    return true;
  }

  public unequipItem(slotId: string): any | null {
    const slot = this.characterInfo.gearSlots.find(s => s.id === slotId);
    if (!slot || !slot.item) return null;
    
    const item = slot.item;
    slot.item = null;
    
    this.updateGearDisplay();
    this.scene.events.emit('charactersheet:item:unequipped', { slot: slotId, item });
    
    return item;
  }

  protected onResize(width: number, height: number): void {
    // Recreate the character sheet with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.gearSlotElements.clear();
    this.statTexts.clear();
    this.progressBars.clear();
    this.create();
  }
}
