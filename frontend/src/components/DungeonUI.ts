/**
 * Dungeon UI Component
 * Boss HP bars, mechanics warnings, AoE markers, and debuff alerts
 * Based on MECHANICAL_DESIGN.md dungeon specifications
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface BossInfo {
  id: string;
  name: string;
  title?: string;
  level: number;
  health: number;
  maxHealth: number;
  shield?: number;
  maxShield?: number;
  phases: BossPhase[];
  currentPhase: number;
  mechanics: BossMechanic[];
  immunities: string[];
}

export interface BossPhase {
  id: string;
  name: string;
  healthThreshold: number; // Percentage when phase starts
  description: string;
  color: string;
}

export interface BossMechanic {
  id: string;
  name: string;
  type: 'aoe' | 'debuff' | 'add_spawn' | 'environment' | 'interrupt';
  description: string;
  warning: string;
  icon: string;
  castTime?: number;
  duration?: number;
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'deadly';
}

export interface DungeonInfo {
  id: string;
  name: string;
  difficulty: 'normal' | 'heroic' | 'mythic';
  recommendedLevel: number;
  timeLimit?: number;
  objectives: string[];
  completedObjectives: string[];
}

export interface DungeonUIConfig extends UIComponentConfig {
  showMechanicsWarnings?: boolean;
  showPhaseIndicator?: boolean;
  compactMode?: boolean;
  autoHideWarnings?: boolean;
}

export class DungeonUI extends UIComponent {
  private dungeonConfig: DungeonUIConfig;
  private bossInfo: BossInfo | null = null;
  private dungeonInfo: DungeonInfo | null = null;
  private activeMechanics: BossMechanic[] = [];
  
  // UI Elements
  private bossHealthBar?: {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    healthFill: Phaser.GameObjects.Graphics;
    shieldFill?: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    healthText: Phaser.GameObjects.Text;
    phaseIndicator?: Phaser.GameObjects.Text;
  };
  
  private mechanicsContainer?: Phaser.GameObjects.Container;
  private warningsContainer?: Phaser.GameObjects.Container;
  private objectivesContainer?: Phaser.GameObjects.Container;
  
  private mechanicElements: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    nameText: Phaser.GameObjects.Text;
    timerBar?: {
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
    };
    warningPulse?: Phaser.GameObjects.Graphics;
  }> = new Map();

  constructor(scene: Phaser.Scene, config: DungeonUIConfig = {}) {
    super(scene, config);
    this.dungeonConfig = {
      showMechanicsWarnings: true,
      showPhaseIndicator: true,
      compactMode: false,
      autoHideWarnings: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createDungeonUI();
    
    this.hide(); // Hidden until in dungeon
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createDungeonUI(): void {
    // Create boss health bar at top center
    this.createBossHealthBar();
    
    // Create mechanics warnings
    if (this.dungeonConfig.showMechanicsWarnings) {
      this.createMechanicsWarnings();
    }
    
    // Create dungeon objectives
    this.createDungeonObjectives();
  }

  private createBossHealthBar(): void {
    const { width } = this.scene.scale;
    const barWidth = this.dungeonConfig.compactMode ? 400 : 600;
    const barHeight = this.dungeonConfig.compactMode ? 40 : 60;
    const x = width / 2 - barWidth / 2;
    const y = 20;
    
    const bossContainer = this.scene.add.container(x, y);
    this.addElement(bossContainer);
    
    // Boss bar background
    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRoundedRect(0, 0, barWidth, barHeight, 8);
    background.lineStyle(3, 0xFF8C00); // Orange border for boss
    background.strokeRoundedRect(0, 0, barWidth, barHeight, 8);
    bossContainer.add(background);
    
    // Health fill
    const healthFill = this.scene.add.graphics();
    bossContainer.add(healthFill);
    
    // Shield fill (if applicable)
    let shieldFill: Phaser.GameObjects.Graphics | undefined;
    if (this.bossInfo?.shield) {
      shieldFill = this.scene.add.graphics();
      bossContainer.add(shieldFill);
    }
    
    // Boss name and title
    const nameText = this.scene.add.text(barWidth / 2, 15, '', {
      fontSize: `${16 * this.uiScale}px`,
      color: '#FF8C00',
      fontFamily: 'Cinzel, serif',
      fontWeight: '700'
    }).setOrigin(0.5, 0);
    bossContainer.add(nameText);
    
    // Health text
    const healthText = this.scene.add.text(barWidth / 2, barHeight - 15, '', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 1);
    bossContainer.add(healthText);
    
    // Phase indicator
    let phaseIndicator: Phaser.GameObjects.Text | undefined;
    if (this.dungeonConfig.showPhaseIndicator) {
      phaseIndicator = this.scene.add.text(barWidth - 10, 10, '', {
        fontSize: `${12 * this.uiScale}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(1, 0);
      bossContainer.add(phaseIndicator);
    }
    
    this.bossHealthBar = {
      container: bossContainer,
      background,
      healthFill,
      shieldFill,
      nameText,
      healthText,
      phaseIndicator
    };
    
    // Initially hidden
    bossContainer.setVisible(false);
  }

  private createMechanicsWarnings(): void {
    const { width, height } = this.scene.scale;
    
    this.mechanicsContainer = this.scene.add.container(width / 2, height / 2);
    this.addElement(this.mechanicsContainer);
    
    this.warningsContainer = this.scene.add.container(width / 2, 150);
    this.addElement(this.warningsContainer);
  }

  private createDungeonObjectives(): void {
    const { width } = this.scene.scale;
    const objectivesX = 20;
    const objectivesY = 100;
    
    this.objectivesContainer = this.scene.add.container(objectivesX, objectivesY);
    this.addElement(this.objectivesContainer);
    
    // Objectives background
    const objectivesBg = this.scene.add.graphics();
    objectivesBg.fillStyle(0x0a0a0a, 0.8);
    objectivesBg.fillRoundedRect(0, 0, 300, 200, 8);
    objectivesBg.lineStyle(2, 0x8B0000);
    objectivesBg.strokeRoundedRect(0, 0, 300, 200, 8);
    this.objectivesContainer.add(objectivesBg);
    
    // Initially hidden
    this.objectivesContainer.setVisible(false);
  }

  public setBoss(bossInfo: BossInfo): void {
    this.bossInfo = bossInfo;
    this.updateBossDisplay();
    
    if (this.bossHealthBar) {
      this.bossHealthBar.container.setVisible(true);
    }
    
    this.show();
  }

  public clearBoss(): void {
    this.bossInfo = null;
    
    if (this.bossHealthBar) {
      this.bossHealthBar.container.setVisible(false);
    }
    
    this.clearAllMechanics();
  }

  private updateBossDisplay(): void {
    if (!this.bossInfo || !this.bossHealthBar) return;
    
    const { nameText, healthText, healthFill, shieldFill, phaseIndicator } = this.bossHealthBar;
    const barWidth = this.dungeonConfig.compactMode ? 400 : 600;
    const barHeight = this.dungeonConfig.compactMode ? 40 : 60;
    
    // Update name
    const displayName = this.bossInfo.title ? 
      `${this.bossInfo.name}, ${this.bossInfo.title}` : 
      this.bossInfo.name;
    nameText.setText(displayName);
    
    // Update health bar
    const healthPercent = this.bossInfo.health / this.bossInfo.maxHealth;
    healthFill.clear();
    healthFill.fillStyle(0x8B0000);
    healthFill.fillRoundedRect(3, 25, (barWidth - 6) * healthPercent, 15, 4);
    
    // Update shield bar
    if (this.bossInfo.shield && this.bossInfo.maxShield && shieldFill) {
      const shieldPercent = this.bossInfo.shield / this.bossInfo.maxShield;
      shieldFill.clear();
      shieldFill.fillStyle(0x4169E1);
      shieldFill.fillRoundedRect(3, 20, (barWidth - 6) * shieldPercent, 5, 2);
    }
    
    // Update health text
    if (healthPercent > 0.1) {
      healthText.setText(`${this.bossInfo.health.toLocaleString()}/${this.bossInfo.maxHealth.toLocaleString()}`);
    } else {
      healthText.setText(`${Math.round(healthPercent * 100)}%`); // Show percentage when low
    }
    
    // Update phase indicator
    if (phaseIndicator && this.bossInfo.phases.length > 1) {
      const currentPhase = this.bossInfo.phases[this.bossInfo.currentPhase];
      phaseIndicator.setText(`Phase ${this.bossInfo.currentPhase + 1}: ${currentPhase.name}`);
      phaseIndicator.setColor(currentPhase.color);
    }
  }

  public updateBossHealth(health: number, shield?: number): void {
    if (this.bossInfo) {
      this.bossInfo.health = Math.max(0, health);
      if (shield !== undefined && this.bossInfo.maxShield) {
        this.bossInfo.shield = Math.max(0, shield);
      }
      this.updateBossDisplay();
      
      // Check for phase transitions
      this.checkPhaseTransition();
    }
  }

  private checkPhaseTransition(): void {
    if (!this.bossInfo) return;
    
    const healthPercent = this.bossInfo.health / this.bossInfo.maxHealth;
    
    // Check if we should transition to next phase
    for (let i = this.bossInfo.currentPhase + 1; i < this.bossInfo.phases.length; i++) {
      const phase = this.bossInfo.phases[i];
      if (healthPercent <= phase.healthThreshold / 100) {
        this.transitionToPhase(i);
        break;
      }
    }
  }

  private transitionToPhase(phaseIndex: number): void {
    if (!this.bossInfo || phaseIndex >= this.bossInfo.phases.length) return;
    
    this.bossInfo.currentPhase = phaseIndex;
    const phase = this.bossInfo.phases[phaseIndex];
    
    // Show phase transition warning
    this.showPhaseTransitionWarning(phase);
    
    this.updateBossDisplay();
    this.scene.events.emit('dungeon:boss:phase_transition', { phase, bossInfo: this.bossInfo });
  }

  private showPhaseTransitionWarning(phase: BossPhase): void {
    if (!this.warningsContainer) return;
    
    const { width } = this.scene.scale;
    
    // Large warning text
    const warningText = this.scene.add.text(0, 0, `${phase.name.toUpperCase()}!`, {
      fontSize: `${32 * this.uiScale}px`,
      color: phase.color,
      fontFamily: 'Cinzel, serif',
      fontWeight: '700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.warningsContainer.add(warningText);
    
    // Phase description
    const descText = this.scene.add.text(0, 40, phase.description, {
      fontSize: `${16 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.warningsContainer.add(descText);
    
    // Animate warning
    this.scene.tweens.add({
      targets: [warningText, descText],
      scaleX: { from: 0.5, to: 1.2 },
      scaleY: { from: 0.5, to: 1.2 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Fade out after display
        this.scene.tweens.add({
          targets: [warningText, descText],
          alpha: 0,
          duration: 1000,
          delay: 2000,
          onComplete: () => {
            warningText.destroy();
            descText.destroy();
          }
        });
      }
    });
  }

  public addMechanic(mechanic: BossMechanic): void {
    this.activeMechanics.push(mechanic);
    this.createMechanicWarning(mechanic);
    
    // Auto-remove after duration
    if (mechanic.duration) {
      this.scene.time.delayedCall(mechanic.duration, () => {
        this.removeMechanic(mechanic.id);
      });
    }
  }

  public removeMechanic(mechanicId: string): void {
    this.activeMechanics = this.activeMechanics.filter(m => m.id !== mechanicId);
    
    const elements = this.mechanicElements.get(mechanicId);
    if (elements) {
      elements.container.destroy();
      this.mechanicElements.delete(mechanicId);
    }
  }

  private createMechanicWarning(mechanic: BossMechanic): void {
    if (!this.mechanicsContainer) return;
    
    const warningWidth = 250;
    const warningHeight = 60;
    const y = this.activeMechanics.length * (warningHeight + 10);
    
    // Warning container
    const mechanicContainer = this.scene.add.container(0, y);
    this.mechanicsContainer.add(mechanicContainer);
    
    // Warning background
    const background = this.scene.add.graphics();
    const severityColor = this.getSeverityColor(mechanic.severity);
    background.fillStyle(severityColor, 0.8);
    background.fillRoundedRect(-warningWidth / 2, 0, warningWidth, warningHeight, 8);
    background.lineStyle(3, severityColor);
    background.strokeRoundedRect(-warningWidth / 2, 0, warningWidth, warningHeight, 8);
    mechanicContainer.add(background);
    
    // Warning pulse effect for deadly mechanics
    let warningPulse: Phaser.GameObjects.Graphics | undefined;
    if (mechanic.severity === 'deadly') {
      warningPulse = this.scene.add.graphics();
      warningPulse.lineStyle(6, 0xFF0000, 0.6);
      warningPulse.strokeRoundedRect(-warningWidth / 2 - 3, -3, warningWidth + 6, warningHeight + 6, 11);
      mechanicContainer.add(warningPulse);
      
      // Pulse animation
      this.scene.tweens.add({
        targets: warningPulse,
        alpha: { from: 0.6, to: 0.1 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Mechanic icon
    const icon = this.scene.add.text(-warningWidth / 2 + 20, warningHeight / 2, mechanic.icon, {
      fontSize: `${24 * this.uiScale}px`,
      color: '#FFFFFF'
    }).setOrigin(0, 0.5);
    mechanicContainer.add(icon);
    
    // Mechanic name
    const nameText = this.scene.add.text(-warningWidth / 2 + 50, 15, mechanic.name, {
      fontSize: `${14 * this.uiScale}px`,
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    mechanicContainer.add(nameText);
    
    // Warning text
    const warningText = this.scene.add.text(-warningWidth / 2 + 50, 35, mechanic.warning, {
      fontSize: `${11 * this.uiScale}px`,
      color: '#FFFF00',
      fontFamily: 'Cinzel, serif',
      wordWrap: { width: warningWidth - 70 }
    });
    mechanicContainer.add(warningText);
    
    // Timer bar (if mechanic has duration)
    let timerBar: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics } | undefined;
    if (mechanic.duration) {
      timerBar = this.createMechanicTimer(mechanicContainer, mechanic, warningWidth);
    }
    
    // Store elements
    this.mechanicElements.set(mechanic.id, {
      container: mechanicContainer,
      background,
      icon,
      nameText,
      timerBar,
      warningPulse
    });
    
    // Auto-hide warning if configured
    if (this.dungeonConfig.autoHideWarnings && mechanic.type !== 'debuff') {
      this.scene.time.delayedCall(5000, () => {
        if (this.mechanicElements.has(mechanic.id)) {
          this.removeMechanic(mechanic.id);
        }
      });
    }
  }

  private createMechanicTimer(
    container: Phaser.GameObjects.Container, 
    mechanic: BossMechanic, 
    warningWidth: number
  ): { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics } {
    const timerY = 50;
    const timerWidth = warningWidth - 20;
    const timerHeight = 6;
    
    // Timer background
    const timerBg = this.scene.add.graphics();
    timerBg.fillStyle(0x000000, 0.6);
    timerBg.fillRoundedRect(-warningWidth / 2 + 10, timerY, timerWidth, timerHeight, timerHeight / 2);
    container.add(timerBg);
    
    // Timer fill
    const timerFill = this.scene.add.graphics();
    container.add(timerFill);
    
    // Start timer countdown
    this.updateMechanicTimer(mechanic, timerFill, -warningWidth / 2 + 10, timerY, timerWidth, timerHeight);
    
    return { bg: timerBg, fill: timerFill };
  }

  private updateMechanicTimer(
    mechanic: BossMechanic,
    timerFill: Phaser.GameObjects.Graphics,
    x: number, y: number, width: number, height: number
  ): void {
    if (!mechanic.duration || mechanic.duration <= 0) return;
    
    const progress = mechanic.duration / (mechanic.castTime || mechanic.duration);
    const color = progress > 0.5 ? 0xFFD700 : (progress > 0.25 ? 0xFF8C00 : 0xFF4444);
    
    timerFill.clear();
    timerFill.fillStyle(color);
    timerFill.fillRoundedRect(x + 1, y + 1, (width - 2) * progress, height - 2, (height - 2) / 2);
    
    mechanic.duration -= 100;
    
    if (mechanic.duration > 0) {
      this.scene.time.delayedCall(100, () => {
        this.updateMechanicTimer(mechanic, timerFill, x, y, width, height);
      });
    }
  }

  private getSeverityColor(severity: BossMechanic['severity']): number {
    const colors = {
      'low': 0x32CD32,
      'medium': 0xFFD700,
      'high': 0xFF8C00,
      'deadly': 0xFF0000
    };
    return colors[severity];
  }

  public setDungeon(dungeonInfo: DungeonInfo): void {
    this.dungeonInfo = dungeonInfo;
    this.updateObjectivesDisplay();
    
    if (this.objectivesContainer) {
      this.objectivesContainer.setVisible(true);
    }
  }

  private updateObjectivesDisplay(): void {
    if (!this.dungeonInfo || !this.objectivesContainer) return;
    
    // Clear existing objectives (except background)
    const background = this.objectivesContainer.list[0];
    this.objectivesContainer.removeAll();
    this.objectivesContainer.add(background);
    
    // Dungeon title
    const dungeonTitle = this.scene.add.text(150, 15, this.dungeonInfo.name, {
      fontSize: `${16 * this.uiScale}px`,
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 0);
    this.objectivesContainer.add(dungeonTitle);
    
    // Difficulty and level
    const difficultyText = this.scene.add.text(150, 35, 
      `${this.dungeonInfo.difficulty.toUpperCase()} (Level ${this.dungeonInfo.recommendedLevel})`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5, 0);
    this.objectivesContainer.add(difficultyText);
    
    // Time limit (if applicable)
    if (this.dungeonInfo.timeLimit) {
      const timeText = this.formatTimeRemaining(this.dungeonInfo.timeLimit);
      const timerText = this.scene.add.text(150, 55, `⏰ ${timeText}`, {
        fontSize: `${12 * this.uiScale}px`,
        color: this.dungeonInfo.timeLimit < 300000 ? '#FF4444' : '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0.5, 0);
      this.objectivesContainer.add(timerText);
    }
    
    // Objectives
    this.dungeonInfo.objectives.forEach((objective, index) => {
      const y = 80 + (index * 20);
      const isCompleted = this.dungeonInfo!.completedObjectives.includes(objective);
      
      const checkmark = isCompleted ? '✓' : '○';
      const objText = `${checkmark} ${objective}`;
      const color = isCompleted ? '#32CD32' : '#F5F5DC';
      
      const objectiveText = this.scene.add.text(15, y, objText, {
        fontSize: `${11 * this.uiScale}px`,
        color: color,
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: 270 }
      });
      this.objectivesContainer.add(objectiveText);
    });
  }

  private formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  }

  public completeObjective(objective: string): void {
    if (this.dungeonInfo && !this.dungeonInfo.completedObjectives.includes(objective)) {
      this.dungeonInfo.completedObjectives.push(objective);
      this.updateObjectivesDisplay();
      
      // Check if all objectives completed
      if (this.dungeonInfo.completedObjectives.length === this.dungeonInfo.objectives.length) {
        this.scene.events.emit('dungeon:completed', this.dungeonInfo);
      }
    }
  }

  public showAoEWarning(x: number, y: number, radius: number, duration: number = 3000): void {
    if (!this.mechanicsContainer) return;
    
    // Convert world coordinates to screen coordinates (placeholder)
    const screenX = x;
    const screenY = y;
    
    // AoE warning circle
    const aoeWarning = this.scene.add.graphics();
    aoeWarning.lineStyle(4, 0xFF0000, 0.8);
    aoeWarning.strokeCircle(screenX, screenY, radius);
    aoeWarning.fillStyle(0xFF0000, 0.2);
    aoeWarning.fillCircle(screenX, screenY, radius);
    this.mechanicsContainer.add(aoeWarning);
    
    // Pulse animation
    this.scene.tweens.add({
      targets: aoeWarning,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      alpha: { from: 0.8, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: Math.floor(duration / 1200)
    });
    
    // Remove after duration
    this.scene.time.delayedCall(duration, () => {
      aoeWarning.destroy();
    });
  }

  public showDebuffAlert(debuffName: string, severity: 'low' | 'medium' | 'high' | 'deadly'): void {
    if (!this.warningsContainer) return;
    
    const alertColor = this.getSeverityColor(severity);
    
    // Create debuff alert
    const alert = this.scene.add.text(0, -50, `${debuffName.toUpperCase()}!`, {
      fontSize: `${20 * this.uiScale}px`,
      color: Phaser.Display.Color.IntegerToColor(alertColor).rgba,
      fontFamily: 'Cinzel, serif',
      fontWeight: '700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.warningsContainer.add(alert);
    
    // Flash animation
    this.scene.tweens.add({
      targets: alert,
      alpha: { from: 1, to: 0.3 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 400,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        alert.destroy();
      }
    });
  }

  private clearAllMechanics(): void {
    this.activeMechanics = [];
    this.mechanicElements.forEach(elements => {
      elements.container.destroy();
    });
    this.mechanicElements.clear();
  }

  public updateDungeonTimer(timeRemaining: number): void {
    if (this.dungeonInfo) {
      this.dungeonInfo.timeLimit = timeRemaining;
      this.updateObjectivesDisplay();
    }
  }

  protected onResize(width: number, height: number): void {
    // Recreate dungeon UI with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.mechanicElements.clear();
    this.create();
  }
}
