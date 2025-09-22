/**
 * Combat UI Component
 * Floating combat text, damage numbers, combat state tracking
 * Based on UI_DESIGN.md combat-specific requirements
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface CombatEvent {
  id: string;
  type: 'damage' | 'healing' | 'critical' | 'dodge' | 'resist' | 'block' | 'miss' | 'absorb';
  value: number;
  source: string;
  target: string;
  damageType?: 'physical' | 'fire' | 'cold' | 'lightning' | 'divine' | 'unholy';
  isCritical?: boolean;
  position: { x: number; y: number };
  timestamp: Date;
}

export interface CombatState {
  inCombat: boolean;
  combatStartTime?: Date;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealingDone: number;
  dps: number; // Damage per second
  hps: number; // Healing per second
}

export interface FloatingTextOptions {
  fontSize?: number;
  color?: string;
  duration?: number;
  moveDistance?: number;
  fadeDelay?: number;
  outline?: boolean;
  bounce?: boolean;
}

export interface CombatUIConfig extends UIComponentConfig {
  showFloatingText?: boolean;
  showCombatStats?: boolean;
  maxFloatingTexts?: number;
  textDuration?: number;
  enableCombatLog?: boolean;
}

export class CombatUI extends UIComponent {
  private combatConfig: CombatUIConfig;
  private combatState: CombatState = {
    inCombat: false,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalHealingDone: 0,
    dps: 0,
    hps: 0
  };
  
  private floatingTexts: Phaser.GameObjects.Text[] = [];
  private combatEvents: CombatEvent[] = [];
  private combatStatsContainer?: Phaser.GameObjects.Container;
  private combatLogContainer?: Phaser.GameObjects.Container;
  
  // DPS/HPS calculation
  private damageHistory: Array<{ timestamp: Date; amount: number }> = [];
  private healingHistory: Array<{ timestamp: Date; amount: number }> = [];
  private statsUpdateTimer?: number;

  constructor(scene: Phaser.Scene, config: CombatUIConfig = {}) {
    super(scene, config);
    
    this.combatConfig = {
      showFloatingText: true,
      showCombatStats: true,
      maxFloatingTexts: 20,
      textDuration: 3000,
      enableCombatLog: false,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createCombatUI();
    this.startStatsCalculation();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createCombatUI(): void {
    // Combat stats display
    if (this.combatConfig.showCombatStats) {
      this.createCombatStatsDisplay();
    }
    
    // Combat log (if enabled)
    if (this.combatConfig.enableCombatLog) {
      this.createCombatLog();
    }
  }

  private createCombatStatsDisplay(): void {
    const { width } = this.scene.scale;
    const statsWidth = this.combatConfig.compactMode ? 180 : 220;
    const statsHeight = 120;
    const x = width - statsWidth - 20;
    const y = 200;
    
    this.combatStatsContainer = this.scene.add.container(x, y);
    this.addElement(this.combatStatsContainer);
    
    // Stats background
    const statsBg = this.scene.add.graphics();
    statsBg.fillStyle(0x0a0a0a, 0.8);
    statsBg.fillRoundedRect(0, 0, statsWidth, statsHeight, 8);
    statsBg.lineStyle(2, 0x8B0000);
    statsBg.strokeRoundedRect(0, 0, statsWidth, statsHeight, 8);
    this.combatStatsContainer.add(statsBg);
    
    // Title
    const title = this.scene.add.text(statsWidth / 2, 10, 'Combat Stats', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 0);
    this.combatStatsContainer.add(title);
    
    // DPS display
    const dpsText = this.scene.add.text(10, 35, 'DPS: 0', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FF4444',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.combatStatsContainer.add(dpsText);
    
    // HPS display
    const hpsText = this.scene.add.text(10, 55, 'HPS: 0', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#32CD32',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.combatStatsContainer.add(hpsText);
    
    // Total damage dealt
    const totalDamageText = this.scene.add.text(10, 75, 'Total Damage: 0', {
      fontSize: `${11 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif'
    });
    this.combatStatsContainer.add(totalDamageText);
    
    // Total healing done
    const totalHealingText = this.scene.add.text(10, 95, 'Total Healing: 0', {
      fontSize: `${11 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif'
    });
    this.combatStatsContainer.add(totalHealingText);
    
    // Initially hidden
    this.combatStatsContainer.setVisible(false);
  }

  private createCombatLog(): void {
    const { width, height } = this.scene.scale;
    const logWidth = 300;
    const logHeight = 200;
    const x = 20;
    const y = height - logHeight - 320; // Above chat
    
    this.combatLogContainer = this.scene.add.container(x, y);
    this.addElement(this.combatLogContainer);
    
    // Log background
    const logBg = this.scene.add.graphics();
    logBg.fillStyle(0x0a0a0a, 0.7);
    logBg.fillRoundedRect(0, 0, logWidth, logHeight, 8);
    logBg.lineStyle(1, 0x666666);
    logBg.strokeRoundedRect(0, 0, logWidth, logHeight, 8);
    this.combatLogContainer.add(logBg);
    
    // Title
    const title = this.scene.add.text(logWidth / 2, 10, 'Combat Log', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 0);
    this.combatLogContainer.add(title);
    
    // Initially hidden
    this.combatLogContainer.setVisible(false);
  }

  private startStatsCalculation(): void {
    this.statsUpdateTimer = window.setInterval(() => {
      this.updateCombatStats();
    }, 1000); // Update every second
  }

  private updateCombatStats(): void {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Calculate DPS (damage in last minute)
    this.damageHistory = this.damageHistory.filter(entry => entry.timestamp > oneMinuteAgo);
    const totalDamageLastMinute = this.damageHistory.reduce((sum, entry) => sum + entry.amount, 0);
    this.combatState.dps = Math.round(totalDamageLastMinute / 60);
    
    // Calculate HPS (healing in last minute)
    this.healingHistory = this.healingHistory.filter(entry => entry.timestamp > oneMinuteAgo);
    const totalHealingLastMinute = this.healingHistory.reduce((sum, entry) => sum + entry.amount, 0);
    this.combatState.hps = Math.round(totalHealingLastMinute / 60);
    
    // Update display
    this.updateStatsDisplay();
  }

  private updateStatsDisplay(): void {
    if (!this.combatStatsContainer || !this.combatStatsContainer.visible) return;
    
    const children = this.combatStatsContainer.list;
    
    // Update DPS text (index 1)
    const dpsText = children[1] as Phaser.GameObjects.Text;
    if (dpsText) {
      dpsText.setText(`DPS: ${this.combatState.dps}`);
    }
    
    // Update HPS text (index 2)
    const hpsText = children[2] as Phaser.GameObjects.Text;
    if (hpsText) {
      hpsText.setText(`HPS: ${this.combatState.hps}`);
    }
    
    // Update total damage (index 3)
    const totalDamageText = children[3] as Phaser.GameObjects.Text;
    if (totalDamageText) {
      totalDamageText.setText(`Total Damage: ${this.combatState.totalDamageDealt.toLocaleString()}`);
    }
    
    // Update total healing (index 4)
    const totalHealingText = children[4] as Phaser.GameObjects.Text;
    if (totalHealingText) {
      totalHealingText.setText(`Total Healing: ${this.combatState.totalHealingDone.toLocaleString()}`);
    }
  }

  public addCombatEvent(event: CombatEvent): void {
    this.combatEvents.push(event);
    
    // Update combat state
    if (event.target === 'player' || event.source === 'player') {
      if (!this.combatState.inCombat) {
        this.enterCombat();
      }
      
      // Track damage/healing
      if (event.source === 'player') {
        if (event.type === 'damage' || event.type === 'critical') {
          this.combatState.totalDamageDealt += event.value;
          this.damageHistory.push({ timestamp: event.timestamp, amount: event.value });
        } else if (event.type === 'healing') {
          this.combatState.totalHealingDone += event.value;
          this.healingHistory.push({ timestamp: event.timestamp, amount: event.value });
        }
      }
      
      if (event.target === 'player' && (event.type === 'damage' || event.type === 'critical')) {
        this.combatState.totalDamageTaken += event.value;
      }
    }
    
    // Show floating text
    if (this.combatConfig.showFloatingText) {
      this.showFloatingCombatText(event);
    }
    
    // Add to combat log
    if (this.combatConfig.enableCombatLog) {
      this.addToCombatLog(event);
    }
    
    // Trim old events
    if (this.combatEvents.length > 100) {
      this.combatEvents.shift();
    }
    
    this.scene.events.emit('combat:event:added', event);
  }

  private showFloatingCombatText(event: CombatEvent): void {
    if (this.floatingTexts.length >= this.combatConfig.maxFloatingTexts!) {
      // Remove oldest floating text
      const oldestText = this.floatingTexts.shift();
      if (oldestText) {
        oldestText.destroy();
      }
    }
    
    const options = this.getCombatTextOptions(event);
    const text = this.formatCombatText(event);
    
    // Create floating text
    const floatingText = this.scene.add.text(event.position.x, event.position.y, text, {
      fontSize: `${options.fontSize}px`,
      color: options.color,
      fontFamily: 'Cinzel, serif',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: options.outline ? 2 : 0
    }).setOrigin(0.5);
    
    this.floatingTexts.push(floatingText);
    
    // Animate floating text
    this.animateFloatingText(floatingText, options);
  }

  private getCombatTextOptions(event: CombatEvent): FloatingTextOptions {
    const baseOptions: FloatingTextOptions = {
      fontSize: 16 * this.uiScale,
      duration: this.combatConfig.textDuration!,
      moveDistance: 50,
      fadeDelay: 1000,
      outline: true,
      bounce: false
    };
    
    switch (event.type) {
      case 'critical':
        return {
          ...baseOptions,
          fontSize: 24 * this.uiScale,
          color: '#FFD700',
          bounce: true,
          moveDistance: 70
        };
        
      case 'damage':
        return {
          ...baseOptions,
          color: event.source === 'player' ? '#FF4444' : '#FFFFFF',
          fontSize: event.isCritical ? 20 * this.uiScale : 16 * this.uiScale
        };
        
      case 'healing':
        return {
          ...baseOptions,
          color: '#32CD32',
          fontSize: event.isCritical ? 20 * this.uiScale : 16 * this.uiScale
        };
        
      case 'dodge':
        return {
          ...baseOptions,
          color: '#00BFFF',
          fontSize: 18 * this.uiScale,
          bounce: true
        };
        
      case 'resist':
        return {
          ...baseOptions,
          color: '#8A2BE2',
          fontSize: 18 * this.uiScale
        };
        
      case 'block':
        return {
          ...baseOptions,
          color: '#C0C0C0',
          fontSize: 18 * this.uiScale
        };
        
      case 'miss':
        return {
          ...baseOptions,
          color: '#999999',
          fontSize: 14 * this.uiScale
        };
        
      case 'absorb':
        return {
          ...baseOptions,
          color: '#4169E1',
          fontSize: 16 * this.uiScale
        };
        
      default:
        return baseOptions;
    }
  }

  private formatCombatText(event: CombatEvent): string {
    switch (event.type) {
      case 'damage':
      case 'critical':
        return event.isCritical ? `${event.value}!` : event.value.toString();
        
      case 'healing':
        return `+${event.value}`;
        
      case 'dodge':
        return 'DODGE';
        
      case 'resist':
        return 'RESIST';
        
      case 'block':
        return `BLOCK (${event.value})`;
        
      case 'miss':
        return 'MISS';
        
      case 'absorb':
        return `ABSORB (${event.value})`;
        
      default:
        return event.value.toString();
    }
  }

  private animateFloatingText(text: Phaser.GameObjects.Text, options: FloatingTextOptions): void {
    const startY = text.y;
    const endY = startY - options.moveDistance!;
    
    // Initial scale animation for critical hits
    if (options.bounce) {
      this.scene.tweens.add({
        targets: text,
        scaleX: { from: 0.5, to: 1.3 },
        scaleY: { from: 0.5, to: 1.3 },
        duration: 200,
        ease: 'Back.out',
        yoyo: true,
        repeat: 0
      });
    }
    
    // Upward movement
    this.scene.tweens.add({
      targets: text,
      y: endY,
      duration: options.duration!,
      ease: 'Power2'
    });
    
    // Random horizontal drift
    const driftAmount = (Math.random() - 0.5) * 40;
    this.scene.tweens.add({
      targets: text,
      x: text.x + driftAmount,
      duration: options.duration!,
      ease: 'Sine.inOut'
    });
    
    // Fade out
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: options.duration! - options.fadeDelay!,
      delay: options.fadeDelay!,
      onComplete: () => {
        const index = this.floatingTexts.indexOf(text);
        if (index > -1) {
          this.floatingTexts.splice(index, 1);
        }
        text.destroy();
      }
    });
  }

  private addToCombatLog(event: CombatEvent): void {
    if (!this.combatLogContainer) return;
    
    const logText = this.formatCombatLogEntry(event);
    const logColor = this.getCombatLogColor(event);
    
    // Add to combat log display
    const logEntry = this.scene.add.text(10, 30 + (this.combatEvents.length % 15) * 12, logText, {
      fontSize: `${10 * this.uiScale}px`,
      color: logColor,
      fontFamily: 'Cinzel, serif'
    });
    this.combatLogContainer.add(logEntry);
    
    // Remove old entries if too many
    if (this.combatLogContainer.list.length > 16) { // 1 for background + title + 15 entries
      const oldEntry = this.combatLogContainer.list[2]; // Skip background and title
      oldEntry.destroy();
    }
  }

  private formatCombatLogEntry(event: CombatEvent): string {
    const time = event.timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    switch (event.type) {
      case 'damage':
      case 'critical':
        return `[${time}] ${event.source} hits ${event.target} for ${event.value}${event.isCritical ? ' (CRIT)' : ''}`;
        
      case 'healing':
        return `[${time}] ${event.source} heals ${event.target} for ${event.value}`;
        
      case 'dodge':
        return `[${time}] ${event.target} dodges ${event.source}'s attack`;
        
      case 'resist':
        return `[${time}] ${event.target} resists ${event.source}'s spell`;
        
      case 'block':
        return `[${time}] ${event.target} blocks ${event.value} damage from ${event.source}`;
        
      case 'miss':
        return `[${time}] ${event.source} misses ${event.target}`;
        
      default:
        return `[${time}] ${event.source} -> ${event.target}: ${event.value}`;
    }
  }

  private getCombatLogColor(event: CombatEvent): string {
    switch (event.type) {
      case 'damage':
      case 'critical':
        return event.source === 'player' ? '#FF4444' : '#FFAAAA';
        
      case 'healing':
        return '#32CD32';
        
      case 'dodge':
      case 'resist':
        return '#00BFFF';
        
      case 'block':
        return '#C0C0C0';
        
      case 'miss':
        return '#999999';
        
      default:
        return '#F5F5DC';
    }
  }

  public enterCombat(): void {
    if (this.combatState.inCombat) return;
    
    this.combatState.inCombat = true;
    this.combatState.combatStartTime = new Date();
    
    // Reset combat stats
    this.combatState.totalDamageDealt = 0;
    this.combatState.totalDamageTaken = 0;
    this.combatState.totalHealingDone = 0;
    this.damageHistory = [];
    this.healingHistory = [];
    
    // Show combat stats
    if (this.combatStatsContainer) {
      this.combatStatsContainer.setVisible(true);
    }
    
    // Show combat log
    if (this.combatLogContainer) {
      this.combatLogContainer.setVisible(true);
    }
    
    console.log('Entered combat');
    this.scene.events.emit('combat:entered');
  }

  public exitCombat(): void {
    if (!this.combatState.inCombat) return;
    
    this.combatState.inCombat = false;
    
    // Hide combat stats after delay
    this.scene.time.delayedCall(5000, () => {
      if (this.combatStatsContainer) {
        this.combatStatsContainer.setVisible(false);
      }
    });
    
    // Hide combat log after delay
    this.scene.time.delayedCall(10000, () => {
      if (this.combatLogContainer) {
        this.combatLogContainer.setVisible(false);
      }
    });
    
    console.log('Exited combat');
    this.scene.events.emit('combat:exited', {
      duration: this.combatState.combatStartTime ? 
        Date.now() - this.combatState.combatStartTime.getTime() : 0,
      stats: { ...this.combatState }
    });
  }

  // Convenience methods for common combat events
  public showDamage(target: string, amount: number, isCritical: boolean = false, position: { x: number; y: number }): void {
    this.addCombatEvent({
      id: `damage_${Date.now()}`,
      type: isCritical ? 'critical' : 'damage',
      value: amount,
      source: 'player',
      target,
      isCritical,
      position,
      timestamp: new Date()
    });
  }

  public showHealing(target: string, amount: number, isCritical: boolean = false, position: { x: number; y: number }): void {
    this.addCombatEvent({
      id: `healing_${Date.now()}`,
      type: 'healing',
      value: amount,
      source: 'player',
      target,
      isCritical,
      position,
      timestamp: new Date()
    });
  }

  public showDodge(target: string, position: { x: number; y: number }): void {
    this.addCombatEvent({
      id: `dodge_${Date.now()}`,
      type: 'dodge',
      value: 0,
      source: 'enemy',
      target,
      position,
      timestamp: new Date()
    });
  }

  public showResist(target: string, position: { x: number; y: number }): void {
    this.addCombatEvent({
      id: `resist_${Date.now()}`,
      type: 'resist',
      value: 0,
      source: 'enemy',
      target,
      position,
      timestamp: new Date()
    });
  }

  public showBlock(target: string, blockedAmount: number, position: { x: number; y: number }): void {
    this.addCombatEvent({
      id: `block_${Date.now()}`,
      type: 'block',
      value: blockedAmount,
      source: 'enemy',
      target,
      position,
      timestamp: new Date()
    });
  }

  public getCombatStats(): CombatState {
    return { ...this.combatState };
  }

  public clearCombatStats(): void {
    this.combatState = {
      inCombat: false,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalHealingDone: 0,
      dps: 0,
      hps: 0
    };
    this.damageHistory = [];
    this.healingHistory = [];
    this.combatEvents = [];
    this.updateStatsDisplay();
  }

  public toggleCombatStats(): void {
    if (this.combatStatsContainer) {
      this.combatStatsContainer.setVisible(!this.combatStatsContainer.visible);
    }
  }

  public toggleCombatLog(): void {
    if (this.combatLogContainer) {
      this.combatLogContainer.setVisible(!this.combatLogContainer.visible);
    }
  }

  protected onResize(width: number, height: number): void {
    // Recreate combat UI with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.floatingTexts = [];
    this.create();
  }

  public destroy(): void {
    // Clear stats update timer
    if (this.statsUpdateTimer) {
      clearInterval(this.statsUpdateTimer);
    }
    
    // Clear floating texts
    this.floatingTexts.forEach(text => text.destroy());
    this.floatingTexts = [];
    
    super.destroy();
  }
}
