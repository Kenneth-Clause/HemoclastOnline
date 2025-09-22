/**
 * Target Frame Component
 * Shows enemy HP, status effects, threat indicator, and cast bar
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface TargetInfo {
  id: string;
  name: string;
  level: number;
  type: 'player' | 'npc' | 'boss' | 'elite';
  health: number;
  maxHealth: number;
  shield?: number;
  maxShield?: number;
  classification?: string; // e.g., "Dungeon Boss", "Elite", "Champion"
}

export interface CastInfo {
  spellName: string;
  castTime: number;
  maxCastTime: number;
  canInterrupt: boolean;
  channeled?: boolean;
}

export interface ThreatInfo {
  playerThreat: number;
  maxThreat: number;
  threatLevel: 'low' | 'medium' | 'high' | 'tanking';
}

export interface TargetFrameConfig extends UIComponentConfig {
  showThreat?: boolean;
  showCastBar?: boolean;
  compactMode?: boolean;
}

export class TargetFrame extends UIComponent {
  private target: TargetInfo | null = null;
  private castInfo: CastInfo | null = null;
  private threatInfo: ThreatInfo | null = null;
  private targetFrameConfig: TargetFrameConfig;
  
  // UI Elements
  private targetPanel?: Phaser.GameObjects.Graphics;
  private healthBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  private shieldBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  private castBar?: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
  private threatIndicator?: Phaser.GameObjects.Graphics;
  
  private nameText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private healthText?: Phaser.GameObjects.Text;
  private castText?: Phaser.GameObjects.Text;
  private threatText?: Phaser.GameObjects.Text;
  
  private portraitFrame?: Phaser.GameObjects.Graphics;
  private portraitIcon?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: TargetFrameConfig = {}) {
    super(scene, config);
    
    this.targetFrameConfig = {
      showThreat: true,
      showCastBar: true,
      compactMode: false,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createTargetFrame();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    // Initially hidden until we have a target
    this.hide();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createTargetFrame(): void {
    const frameWidth = this.targetFrameConfig.compactMode ? 220 : 300;
    const frameHeight = this.calculateFrameHeight();
    
    // Main frame background
    this.targetPanel = this.createGothicPanel(0, 0, frameWidth * this.uiScale, frameHeight * this.uiScale);
    
    // Portrait section
    this.createPortraitSection();
    
    // Target info section
    this.createTargetInfo();
    
    // Health bar
    this.createHealthBar();
    
    // Shield bar (if applicable)
    this.createShieldBar();
    
    // Threat indicator
    if (this.targetFrameConfig.showThreat) {
      this.createThreatIndicator();
    }
    
    // Cast bar
    if (this.targetFrameConfig.showCastBar) {
      this.createCastBar();
    }
  }

  private calculateFrameHeight(): number {
    let height = 80; // Base height
    
    if (this.targetFrameConfig.showThreat) {
      height += 20;
    }
    
    if (this.targetFrameConfig.showCastBar) {
      height += 30;
    }
    
    return height;
  }

  private createPortraitSection(): void {
    const portraitSize = 50;
    
    // Portrait frame
    this.portraitFrame = this.scene.add.graphics();
    this.portraitFrame.fillStyle(0x2d1b1b, 0.9);
    this.portraitFrame.fillRoundedRect(10 * this.uiScale, 10 * this.uiScale, 
      portraitSize * this.uiScale, portraitSize * this.uiScale, 8 * this.uiScale);
    this.portraitFrame.lineStyle(2 * this.uiScale, 0x8B0000);
    this.portraitFrame.strokeRoundedRect(10 * this.uiScale, 10 * this.uiScale, 
      portraitSize * this.uiScale, portraitSize * this.uiScale, 8 * this.uiScale);
    this.addElement(this.portraitFrame);
    
    // Portrait icon (placeholder)
    this.portraitIcon = this.scene.add.text(
      (10 + portraitSize / 2) * this.uiScale,
      (10 + portraitSize / 2) * this.uiScale,
      '👹',
      {
        fontSize: `${30 * this.uiScale}px`,
        color: '#F5F5DC'
      }
    ).setOrigin(0.5);
    this.addElement(this.portraitIcon);
  }

  private createTargetInfo(): void {
    const startX = 70;
    
    // Target name
    this.nameText = this.createGothicText(
      startX * this.uiScale,
      15 * this.uiScale,
      'Select Target',
      16,
      '#F5F5DC'
    );
    
    // Level and classification
    this.levelText = this.createGothicText(
      startX * this.uiScale,
      35 * this.uiScale,
      '',
      12,
      '#C0C0C0'
    );
  }

  private createHealthBar(): void {
    const startX = 70;
    const startY = 50;
    const barWidth = this.targetFrameConfig.compactMode ? 130 : 200;
    const barHeight = 18;
    
    this.healthBar = this.createResourceBar(
      startX * this.uiScale,
      startY * this.uiScale,
      barWidth * this.uiScale,
      barHeight * this.uiScale,
      '#8B0000',
      1.0
    );
    
    this.healthText = this.createGothicText(
      (startX + barWidth / 2) * this.uiScale,
      (startY + barHeight / 2) * this.uiScale,
      '',
      11,
      '#FFFFFF'
    ).setOrigin(0.5);
  }

  private createShieldBar(): void {
    const startX = 70;
    const startY = 70;
    const barWidth = this.targetFrameConfig.compactMode ? 130 : 200;
    const barHeight = 12;
    
    this.shieldBar = this.createResourceBar(
      startX * this.uiScale,
      startY * this.uiScale,
      barWidth * this.uiScale,
      barHeight * this.uiScale,
      '#4169E1',
      0.0,
      false // No glow for shield bar
    );
    
    // Initially hidden
    this.shieldBar.bg.setVisible(false);
    this.shieldBar.fill.setVisible(false);
  }

  private createThreatIndicator(): void {
    if (!this.targetFrameConfig.showThreat) return;
    
    const startX = 10;
    const startY = 70;
    const indicatorSize = 50;
    
    this.threatIndicator = this.scene.add.graphics();
    this.addElement(this.threatIndicator);
    
    this.threatText = this.createGothicText(
      (startX + indicatorSize / 2) * this.uiScale,
      (startY + indicatorSize / 2) * this.uiScale,
      '',
      10,
      '#FFFFFF'
    ).setOrigin(0.5);
    
    this.updateThreatDisplay();
  }

  private createCastBar(): void {
    if (!this.targetFrameConfig.showCastBar) return;
    
    const startX = 10;
    const frameHeight = this.calculateFrameHeight();
    const startY = frameHeight - 35;
    const barWidth = this.targetFrameConfig.compactMode ? 200 : 280;
    const barHeight = 20;
    
    this.castBar = this.createResourceBar(
      startX * this.uiScale,
      startY * this.uiScale,
      barWidth * this.uiScale,
      barHeight * this.uiScale,
      '#FFD700',
      0.0
    );
    
    this.castText = this.createGothicText(
      (startX + barWidth / 2) * this.uiScale,
      (startY + barHeight / 2) * this.uiScale,
      '',
      11,
      '#000000'
    ).setOrigin(0.5);
    
    // Initially hidden
    this.hideCastBar();
  }

  public setTarget(target: TargetInfo | null): void {
    this.target = target;
    
    if (!target) {
      this.hide();
      return;
    }
    
    this.show();
    this.updateTargetDisplay();
  }

  private updateTargetDisplay(): void {
    if (!this.target) return;
    
    // Update name
    if (this.nameText) {
      const nameColor = this.getNameColor(this.target.type);
      this.nameText.setText(this.target.name).setColor(nameColor);
    }
    
    // Update level and classification
    if (this.levelText) {
      let levelText = `Level ${this.target.level}`;
      if (this.target.classification) {
        levelText += ` ${this.target.classification}`;
      }
      this.levelText.setText(levelText);
    }
    
    // Update portrait based on type
    if (this.portraitIcon) {
      const icon = this.getPortraitIcon(this.target.type);
      this.portraitIcon.setText(icon);
    }
    
    // Update portrait frame color
    if (this.portraitFrame) {
      const frameColor = this.getFrameColor(this.target.type);
      this.portraitFrame.clear();
      this.portraitFrame.fillStyle(0x2d1b1b, 0.9);
      this.portraitFrame.fillRoundedRect(10 * this.uiScale, 10 * this.uiScale, 
        50 * this.uiScale, 50 * this.uiScale, 8 * this.uiScale);
      this.portraitFrame.lineStyle(2 * this.uiScale, frameColor);
      this.portraitFrame.strokeRoundedRect(10 * this.uiScale, 10 * this.uiScale, 
        50 * this.uiScale, 50 * this.uiScale, 8 * this.uiScale);
    }
    
    this.updateHealthDisplay();
    this.updateShieldDisplay();
  }

  private updateHealthDisplay(): void {
    if (!this.target || !this.healthBar || !this.healthText) return;
    
    const healthPercent = this.target.health / this.target.maxHealth;
    this.updateResourceBarFill(this.healthBar.fill, healthPercent, '#8B0000');
    
    // Show percentage for bosses, actual numbers for others
    if (this.target.type === 'boss') {
      this.healthText.setText(`${Math.round(healthPercent * 100)}%`);
    } else {
      this.healthText.setText(`${this.target.health}/${this.target.maxHealth}`);
    }
  }

  private updateShieldDisplay(): void {
    if (!this.target || !this.shieldBar) return;
    
    if (this.target.shield && this.target.maxShield && this.target.shield > 0) {
      const shieldPercent = this.target.shield / this.target.maxShield;
      this.updateResourceBarFill(this.shieldBar.fill, shieldPercent, '#4169E1');
      this.shieldBar.bg.setVisible(true);
      this.shieldBar.fill.setVisible(true);
    } else {
      this.shieldBar.bg.setVisible(false);
      this.shieldBar.fill.setVisible(false);
    }
  }

  private updateResourceBarFill(fill: Phaser.GameObjects.Graphics, percent: number, color: string): void {
    // This is a simplified version - in practice you'd store the original dimensions
    fill.clear();
    fill.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    // Would need to recreate with stored dimensions and new percentage
  }

  public startCasting(castInfo: CastInfo): void {
    if (!this.targetFrameConfig.showCastBar) return;
    
    this.castInfo = castInfo;
    this.showCastBar();
    
    if (this.castText) {
      const interruptText = castInfo.canInterrupt ? ' (Interruptible)' : '';
      this.castText.setText(`${castInfo.spellName}${interruptText}`);
    }
    
    this.updateCastBar();
  }

  private updateCastBar(): void {
    if (!this.castInfo || !this.castBar) return;
    
    const progress = 1 - (this.castInfo.castTime / this.castInfo.maxCastTime);
    this.updateResourceBarFill(this.castBar.fill, progress, '#FFD700');
    
    if (this.castInfo.castTime > 0) {
      this.castInfo.castTime -= 100;
      this.scene.time.delayedCall(100, () => this.updateCastBar());
    } else {
      this.completeCast();
    }
  }

  private completeCast(): void {
    if (this.castInfo) {
      this.scene.events.emit('targetframe:cast:completed', this.castInfo);
      this.castInfo = null;
    }
    this.hideCastBar();
  }

  public interruptCast(): void {
    if (this.castInfo) {
      this.scene.events.emit('targetframe:cast:interrupted', this.castInfo);
      this.castInfo = null;
    }
    this.hideCastBar();
  }

  private showCastBar(): void {
    if (this.castBar) {
      this.castBar.bg.setVisible(true);
      this.castBar.fill.setVisible(true);
    }
    if (this.castText) {
      this.castText.setVisible(true);
    }
  }

  private hideCastBar(): void {
    if (this.castBar) {
      this.castBar.bg.setVisible(false);
      this.castBar.fill.setVisible(false);
    }
    if (this.castText) {
      this.castText.setVisible(false);
    }
  }

  public setThreat(threatInfo: ThreatInfo): void {
    this.threatInfo = threatInfo;
    this.updateThreatDisplay();
  }

  private updateThreatDisplay(): void {
    if (!this.threatInfo || !this.threatIndicator || !this.threatText) return;
    
    const startX = 10;
    const startY = 70;
    const indicatorSize = 50;
    
    // Clear and redraw threat indicator
    this.threatIndicator.clear();
    
    const threatColor = this.getThreatColor(this.threatInfo.threatLevel);
    const threatPercent = this.threatInfo.playerThreat / this.threatInfo.maxThreat;
    
    // Background circle
    this.threatIndicator.fillStyle(0x000000, 0.5);
    this.threatIndicator.fillCircle(
      (startX + indicatorSize / 2) * this.uiScale,
      (startY + indicatorSize / 2) * this.uiScale,
      (indicatorSize / 2) * this.uiScale
    );
    
    // Threat level arc
    this.threatIndicator.lineStyle(4 * this.uiScale, threatColor);
    this.threatIndicator.beginPath();
    this.threatIndicator.arc(
      (startX + indicatorSize / 2) * this.uiScale,
      (startY + indicatorSize / 2) * this.uiScale,
      (indicatorSize / 2 - 4) * this.uiScale,
      -Math.PI / 2,
      -Math.PI / 2 + (Math.PI * 2 * threatPercent),
      false
    );
    this.threatIndicator.strokePath();
    
    // Threat level text
    this.threatText.setText(Math.round(threatPercent * 100) + '%');
    this.threatText.setColor(this.getThreatTextColor(this.threatInfo.threatLevel));
  }

  private getNameColor(type: TargetInfo['type']): string {
    switch (type) {
      case 'boss': return '#FF8C00';
      case 'elite': return '#FFD700';
      case 'player': return '#00BFFF';
      default: return '#F5F5DC';
    }
  }

  private getPortraitIcon(type: TargetInfo['type']): string {
    switch (type) {
      case 'boss': return '💀';
      case 'elite': return '⭐';
      case 'player': return '👤';
      default: return '👹';
    }
  }

  private getFrameColor(type: TargetInfo['type']): number {
    switch (type) {
      case 'boss': return 0xFF8C00;
      case 'elite': return 0xFFD700;
      case 'player': return 0x00BFFF;
      default: return 0x8B0000;
    }
  }

  private getThreatColor(level: ThreatInfo['threatLevel']): number {
    switch (level) {
      case 'tanking': return 0xFF0000;
      case 'high': return 0xFF8C00;
      case 'medium': return 0xFFD700;
      default: return 0x228B22;
    }
  }

  private getThreatTextColor(level: ThreatInfo['threatLevel']): string {
    switch (level) {
      case 'tanking': return '#FF0000';
      case 'high': return '#FF8C00';
      case 'medium': return '#FFD700';
      default: return '#228B22';
    }
  }

  public updateHealth(health: number): void {
    if (this.target) {
      this.target.health = health;
      this.updateHealthDisplay();
    }
  }

  public updateShield(shield: number): void {
    if (this.target) {
      this.target.shield = shield;
      this.updateShieldDisplay();
    }
  }

  protected onResize(width: number, height: number): void {
    // Recreate the component with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.create();
    
    if (this.target) {
      this.updateTargetDisplay();
    }
  }
}
