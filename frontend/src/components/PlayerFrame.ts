/**
 * Player Frame Component
 * Displays HP, Mana/Energy bars, buffs/debuffs, and class resource indicators
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  energy?: number;
  maxEnergy?: number;
  classResource?: {
    name: string;
    value: number;
    maxValue: number;
    color: string;
  };
}

export interface BuffDebuff {
  id: string;
  name: string;
  icon: string;
  duration: number;
  maxDuration: number;
  type: 'buff' | 'debuff';
  stacks?: number;
}

export interface PlayerFrameConfig extends UIComponentConfig {
  showClassResource?: boolean;
  showBuffs?: boolean;
  compactMode?: boolean;
}

export class PlayerFrame extends UIComponent {
  private stats: PlayerStats = {
    health: 180,
    maxHealth: 200,
    mana: 85,
    maxMana: 110
  };

  private buffsDebuffs: BuffDebuff[] = [];
  private playerFrameConfig: PlayerFrameConfig;
  
  // UI Elements
  private healthBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  private manaBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  private energyBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  private classResourceBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  
  private healthText?: Phaser.GameObjects.Text;
  private manaText?: Phaser.GameObjects.Text;
  private energyText?: Phaser.GameObjects.Text;
  private classResourceText?: Phaser.GameObjects.Text;
  private playerNameText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  
  private buffContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: PlayerFrameConfig = {}) {
    super(scene, config);
    
    this.playerFrameConfig = {
      showClassResource: true,
      showBuffs: true,
      compactMode: false,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createPlayerFrame();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createPlayerFrame(): void {
    const frameWidth = this.playerFrameConfig.compactMode ? 200 : 280;
    const frameHeight = this.calculateFrameHeight();
    
    // Main frame background
    this.createGothicPanel(0, 0, frameWidth * this.uiScale, frameHeight * this.uiScale);
    
    // Player info section
    this.createPlayerInfo();
    
    // Resource bars
    this.createResourceBars();
    
    // Class resource (if applicable)
    if (this.playerFrameConfig.showClassResource && this.stats.classResource) {
      this.createClassResourceBar();
    }
    
    // Buffs/Debuffs section
    if (this.playerFrameConfig.showBuffs) {
      this.createBuffsSection();
    }
  }

  private calculateFrameHeight(): number {
    let height = 80; // Base height for player info and main resources
    
    if (this.playerFrameConfig.showClassResource) {
      height += 30;
    }
    
    if (this.playerFrameConfig.showBuffs) {
      height += 50;
    }
    
    return height;
  }

  private createPlayerInfo(): void {
    const { width, height } = this.scene.scale;
    
    // Player name
    this.playerNameText = this.createGothicText(
      15 * this.uiScale, 
      15 * this.uiScale, 
      'Grimjaw the Warrior', 
      16, 
      '#F5F5DC'
    );

    // Level and class
    this.levelText = this.createGothicText(
      15 * this.uiScale, 
      35 * this.uiScale, 
      'Level 8 Guardian', 
      12, 
      '#C0C0C0'
    );
  }

  private createResourceBars(): void {
    const barWidth = this.playerFrameConfig.compactMode ? 160 : 240;
    const barHeight = 20;
    const startY = 55;
    
    // Health Bar
    this.healthBar = this.createResourceBar(
      15 * this.uiScale,
      startY * this.uiScale,
      barWidth * this.uiScale,
      barHeight * this.uiScale,
      '#8B0000',
      this.stats.health / this.stats.maxHealth
    );
    
    this.healthText = this.createGothicText(
      (15 + barWidth / 2) * this.uiScale,
      (startY + barHeight / 2) * this.uiScale,
      `${this.stats.health}/${this.stats.maxHealth}`,
      12,
      '#FFFFFF'
    ).setOrigin(0.5);

    // Mana/Energy Bar
    const resourceType = this.stats.energy !== undefined ? 'energy' : 'mana';
    const resourceValue = resourceType === 'energy' ? this.stats.energy! : this.stats.mana;
    const maxResourceValue = resourceType === 'energy' ? this.stats.maxEnergy! : this.stats.maxMana;
    const resourceColor = resourceType === 'energy' ? '#228B22' : '#4B0082';

    this.manaBar = this.createResourceBar(
      15 * this.uiScale,
      (startY + 30) * this.uiScale,
      barWidth * this.uiScale,
      barHeight * this.uiScale,
      resourceColor,
      resourceValue / maxResourceValue
    );
    
    this.manaText = this.createGothicText(
      (15 + barWidth / 2) * this.uiScale,
      (startY + 30 + barHeight / 2) * this.uiScale,
      `${resourceValue}/${maxResourceValue}`,
      12,
      '#FFFFFF'
    ).setOrigin(0.5);
  }

  private createClassResourceBar(): void {
    if (!this.stats.classResource) return;

    const barWidth = this.playerFrameConfig.compactMode ? 160 : 240;
    const barHeight = 16;
    const startY = 105;
    
    this.classResourceBar = this.createResourceBar(
      15 * this.uiScale,
      startY * this.uiScale,
      barWidth * this.uiScale,
      barHeight * this.uiScale,
      this.stats.classResource.color,
      this.stats.classResource.value / this.stats.classResource.maxValue
    );
    
    this.classResourceText = this.createGothicText(
      (15 + barWidth / 2) * this.uiScale,
      (startY + barHeight / 2) * this.uiScale,
      `${this.stats.classResource.name}: ${this.stats.classResource.value}/${this.stats.classResource.maxValue}`,
      10,
      '#FFFFFF'
    ).setOrigin(0.5);
  }

  private createBuffsSection(): void {
    const startY = this.stats.classResource ? 135 : 105;
    
    // Buffs/Debuffs container
    this.buffContainer = this.scene.add.container(15 * this.uiScale, startY * this.uiScale);
    this.addElement(this.buffContainer);
    
    // Section title
    const buffsTitle = this.createGothicText(0, 0, 'Effects', 10, '#FFD700');
    this.buffContainer.add(buffsTitle);
    
    this.updateBuffsDisplay();
  }

  private updateBuffsDisplay(): void {
    if (!this.buffContainer) return;
    
    // Clear existing buff icons (except title)
    const children = this.buffContainer.list.slice(1); // Skip title
    children.forEach(child => child.destroy());
    
    const iconSize = 24 * this.uiScale;
    const iconSpacing = 4 * this.uiScale;
    const maxIconsPerRow = 8;
    
    this.buffsDebuffs.forEach((effect, index) => {
      const row = Math.floor(index / maxIconsPerRow);
      const col = index % maxIconsPerRow;
      const x = col * (iconSize + iconSpacing);
      const y = 20 * this.uiScale + row * (iconSize + iconSpacing);
      
      this.createBuffIcon(effect, x, y, iconSize);
    });
  }

  private createBuffIcon(effect: BuffDebuff, x: number, y: number, size: number): void {
    if (!this.buffContainer) return;

    // Icon background
    const iconBg = this.scene.add.graphics();
    const bgColor = effect.type === 'buff' ? 0x228B22 : 0x8B0000;
    iconBg.fillStyle(bgColor, 0.8);
    iconBg.fillRoundedRect(x, y, size, size, 4);
    iconBg.lineStyle(1, effect.type === 'buff' ? 0x32CD32 : 0xDC143C);
    iconBg.strokeRoundedRect(x, y, size, size, 4);
    this.buffContainer.add(iconBg);

    // Icon
    const icon = this.scene.add.text(x + size / 2, y + size / 2, effect.icon, {
      fontSize: `${size * 0.6}px`,
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.buffContainer.add(icon);

    // Duration indicator
    if (effect.duration > 0) {
      const durationText = this.scene.add.text(x + size - 2, y + size - 2, 
        Math.ceil(effect.duration / 1000).toString(), {
        fontSize: `${size * 0.3}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      }).setOrigin(1, 1);
      this.buffContainer.add(durationText);
    }

    // Stacks indicator
    if (effect.stacks && effect.stacks > 1) {
      const stackText = this.scene.add.text(x + 2, y + size - 2, effect.stacks.toString(), {
        fontSize: `${size * 0.3}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      }).setOrigin(0, 1);
      this.buffContainer.add(stackText);
    }

    // Interactive area for tooltip
    const hitArea = this.scene.add.rectangle(x + size / 2, y + size / 2, size, size, 0x000000, 0)
      .setInteractive();
    this.buffContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      this.showEffectTooltip(effect, x + size / 2, y);
    });

    hitArea.on('pointerout', () => {
      this.hideEffectTooltip();
    });
  }

  private showEffectTooltip(effect: BuffDebuff, x: number, y: number): void {
    const tooltipText = `${effect.name}\nDuration: ${Math.ceil(effect.duration / 1000)}s`;
    const tooltip = this.createGothicText(x, y - 10, tooltipText, 10, '#FFFFFF');
    tooltip.setOrigin(0.5, 1).setName('effectTooltip');
    tooltip.setBackgroundColor('#000000');
    tooltip.setPadding(5);
  }

  private hideEffectTooltip(): void {
    const tooltip = this.container.getByName('effectTooltip');
    if (tooltip) {
      tooltip.destroy();
    }
  }

  public updateStats(newStats: Partial<PlayerStats>): void {
    Object.assign(this.stats, newStats);
    
    // Update health bar
    if (this.healthBar && this.healthText) {
      const healthPercent = this.stats.health / this.stats.maxHealth;
      this.updateResourceBarFill(this.healthBar.fill, healthPercent);
      this.healthText.setText(`${this.stats.health}/${this.stats.maxHealth}`);
    }
    
    // Update mana/energy bar
    if (this.manaBar && this.manaText) {
      const resourceType = this.stats.energy !== undefined ? 'energy' : 'mana';
      const resourceValue = resourceType === 'energy' ? this.stats.energy! : this.stats.mana;
      const maxResourceValue = resourceType === 'energy' ? this.stats.maxEnergy! : this.stats.maxMana;
      const resourcePercent = resourceValue / maxResourceValue;
      
      this.updateResourceBarFill(this.manaBar.fill, resourcePercent);
      this.manaText.setText(`${resourceValue}/${maxResourceValue}`);
    }
    
    // Update class resource bar
    if (this.classResourceBar && this.classResourceText && this.stats.classResource) {
      const resourcePercent = this.stats.classResource.value / this.stats.classResource.maxValue;
      this.updateResourceBarFill(this.classResourceBar.fill, resourcePercent);
      this.classResourceText.setText(
        `${this.stats.classResource.name}: ${this.stats.classResource.value}/${this.stats.classResource.maxValue}`
      );
    }
  }

  private updateResourceBarFill(fill: Phaser.GameObjects.Graphics, percent: number): void {
    // This would need to be implemented based on the original bar dimensions
    // For now, we'll recreate the fill
    fill.clear();
    // Implementation would depend on storing original bar parameters
  }

  public addBuff(buff: BuffDebuff): void {
    // Check if buff already exists (for stacking)
    const existingIndex = this.buffsDebuffs.findIndex(b => b.id === buff.id);
    
    if (existingIndex >= 0) {
      // Update existing buff
      this.buffsDebuffs[existingIndex] = buff;
    } else {
      // Add new buff
      this.buffsDebuffs.push(buff);
    }
    
    this.updateBuffsDisplay();
    
    // Start duration countdown
    this.startEffectCountdown(buff);
  }

  public removeBuff(buffId: string): void {
    this.buffsDebuffs = this.buffsDebuffs.filter(b => b.id !== buffId);
    this.updateBuffsDisplay();
  }

  private startEffectCountdown(effect: BuffDebuff): void {
    if (effect.duration <= 0) return;
    
    const countdown = () => {
      effect.duration -= 100;
      
      if (effect.duration <= 0) {
        this.removeBuff(effect.id);
        this.scene.events.emit('playerframe:effect:expired', effect);
      } else {
        this.scene.time.delayedCall(100, countdown);
      }
    };
    
    this.scene.time.delayedCall(100, countdown);
  }

  public setPlayerInfo(name: string, level: number, className: string): void {
    if (this.playerNameText) {
      this.playerNameText.setText(name);
    }
    
    if (this.levelText) {
      this.levelText.setText(`Level ${level} ${className}`);
    }
  }

  protected onResize(width: number, height: number): void {
    // Recreate the component with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.create();
  }
}
