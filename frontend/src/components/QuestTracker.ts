/**
 * Quest Tracker Component
 * Displays active quests, objectives, and progress tracking
 * Integrates with keybind 'J' for quest log
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress?: number;
  maxProgress?: number;
  optional?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  level: number;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'guild' | 'dungeon';
  giver: string;
  location: string;
  objectives: QuestObjective[];
  rewards: {
    experience: number;
    gold: number;
    items?: Array<{
      id: string;
      name: string;
      icon: string;
      quantity: number;
    }>;
  };
  timeLimit?: number; // For timed quests
  isCompleted: boolean;
  isTracked: boolean;
  completedAt?: Date;
}

export interface QuestTrackerConfig extends UIComponentConfig {
  maxTrackedQuests?: number;
  compactMode?: boolean;
  showProgress?: boolean;
  showRewards?: boolean;
  collapsible?: boolean;
}

export class QuestTracker extends UIComponent {
  private questTrackerConfig: QuestTrackerConfig;
  private activeQuests: Quest[] = [];
  private trackedQuests: Quest[] = [];
  private isCollapsed: boolean = false;
  
  // UI Elements
  private trackerPanel?: Phaser.GameObjects.Graphics;
  private questElements: Map<string, {
    container: Phaser.GameObjects.Container;
    titleText: Phaser.GameObjects.Text;
    objectiveTexts: Phaser.GameObjects.Text[];
    progressBars: Array<{
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
      text: Phaser.GameObjects.Text;
    }>;
    collapseButton?: Phaser.GameObjects.Container;
  }> = new Map();
  
  private headerContainer?: Phaser.GameObjects.Container;
  private questContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: QuestTrackerConfig = {}) {
    super(scene, config);
    
    this.questTrackerConfig = {
      maxTrackedQuests: 5,
      compactMode: false,
      showProgress: true,
      showRewards: false,
      collapsible: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.initializeSampleQuests();
    this.createQuestTracker();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createQuestTracker(): void {
    const panelWidth = this.questTrackerConfig.compactMode ? 280 : 350;
    const panelHeight = this.calculatePanelHeight();
    
    // Main tracker panel
    this.trackerPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight, 0.85);
    
    // Header with title and collapse button
    this.createHeader();
    
    // Quest container
    this.createQuestContainer();
    
    // Update tracked quests display
    this.updateTrackedQuestsDisplay();
  }

  private calculatePanelHeight(): number {
    if (this.isCollapsed) return 40;
    
    const baseHeight = 60; // Header
    const questHeight = this.questTrackerConfig.compactMode ? 80 : 100;
    const maxQuests = Math.min(this.trackedQuests.length, this.questTrackerConfig.maxTrackedQuests!);
    
    return baseHeight + (maxQuests * questHeight);
  }

  private createHeader(): void {
    const panelWidth = this.questTrackerConfig.compactMode ? 280 : 350;
    
    this.headerContainer = this.scene.add.container(0, 0);
    this.addElement(this.headerContainer);
    
    // Title
    const title = this.createGothicText(15, 15, 'Quest Tracker', 16, '#DC143C');
    this.headerContainer.add(title);
    
    // Quest count
    const questCount = this.createGothicText(15, 35, `${this.trackedQuests.length} Active`, 12, '#C0C0C0');
    this.headerContainer.add(questCount);
    
    // Collapse button
    if (this.questTrackerConfig.collapsible) {
      const collapseButton = this.createCollapseButton(panelWidth - 30, 25);
      this.headerContainer.add(collapseButton);
    }
  }

  private createCollapseButton(x: number, y: number): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0x2F2F2F, 0.8);
    buttonBg.fillCircle(0, 0, 12);
    buttonBg.lineStyle(1, 0x666666);
    buttonBg.strokeCircle(0, 0, 12);
    buttonContainer.add(buttonBg);
    
    // Arrow icon
    const arrow = this.scene.add.text(0, 0, this.isCollapsed ? '▼' : '▲', {
      fontSize: '12px',
      color: '#F5F5DC'
    }).setOrigin(0.5);
    buttonContainer.add(arrow);
    
    // Interactive area
    const hitArea = this.scene.add.circle(0, 0, 12, 0x000000, 0).setInteractive();
    buttonContainer.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      this.toggleCollapse();
    });
    
    return buttonContainer;
  }

  private createQuestContainer(): void {
    this.questContainer = this.scene.add.container(0, 60);
    this.addElement(this.questContainer);
    
    if (this.isCollapsed) {
      this.questContainer.setVisible(false);
    }
  }

  private updateTrackedQuestsDisplay(): void {
    if (!this.questContainer) return;
    
    // Clear existing quest displays
    this.questElements.forEach(element => {
      element.container.destroy();
    });
    this.questElements.clear();
    this.questContainer.removeAll();
    
    // Display tracked quests
    this.trackedQuests.forEach((quest, index) => {
      if (index < this.questTrackerConfig.maxTrackedQuests!) {
        this.createQuestDisplay(quest, index);
      }
    });
    
    // Update panel height
    this.updatePanelHeight();
  }

  private createQuestDisplay(quest: Quest, index: number): void {
    if (!this.questContainer) return;
    
    const questHeight = this.questTrackerConfig.compactMode ? 80 : 100;
    const y = index * questHeight;
    const panelWidth = this.questTrackerConfig.compactMode ? 280 : 350;
    
    // Quest container
    const questDisplayContainer = this.scene.add.container(0, y);
    this.questContainer.add(questDisplayContainer);
    
    // Quest background
    const questBg = this.scene.add.graphics();
    questBg.fillStyle(0x1a1a1a, 0.6);
    questBg.fillRoundedRect(10, 0, panelWidth - 20, questHeight - 5, 6);
    questBg.lineStyle(1, this.getQuestTypeColor(quest.type));
    questBg.strokeRoundedRect(10, 0, panelWidth - 20, questHeight - 5, 6);
    questDisplayContainer.add(questBg);
    
    // Quest title with level and type indicator
    const titleText = `[${quest.level}] ${quest.title}`;
    const questTitle = this.scene.add.text(15, 8, titleText, {
      fontSize: this.questTrackerConfig.compactMode ? '12px' : '14px',
      color: this.getQuestTypeColor(quest.type, true),
      fontFamily: 'Cinzel, serif',
      fontWeight: '600',
      wordWrap: { width: panelWidth - 40 }
    });
    questDisplayContainer.add(questTitle);
    
    // Quest type indicator
    const typeIcon = this.getQuestTypeIcon(quest.type);
    const questTypeIndicator = this.scene.add.text(panelWidth - 35, 8, typeIcon, {
      fontSize: '16px'
    });
    questDisplayContainer.add(questTypeIndicator);
    
    // Objectives
    const objectiveTexts: Phaser.GameObjects.Text[] = [];
    const progressBars: Array<{
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
      text: Phaser.GameObjects.Text;
    }> = [];
    
    quest.objectives.forEach((objective, objIndex) => {
      const objY = 28 + (objIndex * 16);
      
      // Objective text
      const checkmark = objective.completed ? '✓' : '○';
      const objText = `${checkmark} ${objective.description}`;
      const color = objective.completed ? '#32CD32' : (objective.optional ? '#FFD700' : '#F5F5DC');
      
      const objectiveText = this.scene.add.text(20, objY, objText, {
        fontSize: this.questTrackerConfig.compactMode ? '10px' : '11px',
        color: color,
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: panelWidth - 60 }
      });
      questDisplayContainer.add(objectiveText);
      objectiveTexts.push(objectiveText);
      
      // Progress bar for objectives with progress
      if (this.questTrackerConfig.showProgress && objective.progress !== undefined && objective.maxProgress) {
        const progressY = objY + 12;
        const progressWidth = panelWidth - 60;
        const progressHeight = 8;
        
        const progressBar = this.createObjectiveProgressBar(
          20, progressY, progressWidth, progressHeight,
          objective.progress, objective.maxProgress
        );
        
        questDisplayContainer.add(progressBar.bg);
        questDisplayContainer.add(progressBar.fill);
        questDisplayContainer.add(progressBar.text);
        
        progressBars.push(progressBar);
      }
    });
    
    // Time limit indicator
    if (quest.timeLimit) {
      const timeText = this.formatTimeRemaining(quest.timeLimit);
      const timerText = this.scene.add.text(panelWidth - 80, questHeight - 20, `⏰ ${timeText}`, {
        fontSize: '10px',
        color: quest.timeLimit < 300000 ? '#FF4444' : '#FFD700', // Red if < 5 minutes
        fontFamily: 'Cinzel, serif'
      });
      questDisplayContainer.add(timerText);
    }
    
    // Interactive area for quest details
    const questHitArea = this.scene.add.rectangle(
      panelWidth / 2, questHeight / 2, panelWidth - 20, questHeight - 5, 0x000000, 0
    ).setInteractive();
    questDisplayContainer.add(questHitArea);
    
    questHitArea.on('pointerdown', () => {
      this.showQuestDetails(quest);
    });
    
    // Store quest display elements
    this.questElements.set(quest.id, {
      container: questDisplayContainer,
      titleText: questTitle,
      objectiveTexts,
      progressBars
    });
  }

  private createObjectiveProgressBar(
    x: number, y: number, width: number, height: number,
    progress: number, maxProgress: number
  ) {
    const progressPercent = progress / maxProgress;
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(x, y, width, height, height / 2);
    bg.lineStyle(1, 0x666666);
    bg.strokeRoundedRect(x, y, width, height, height / 2);
    
    // Fill
    const fill = this.scene.add.graphics();
    fill.fillStyle(0x32CD32);
    fill.fillRoundedRect(x + 1, y + 1, (width - 2) * progressPercent, height - 2, (height - 2) / 2);
    
    // Progress text
    const text = this.scene.add.text(x + width / 2, y + height / 2, `${progress}/${maxProgress}`, {
      fontSize: '8px',
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    return { bg, fill, text };
  }

  private updatePanelHeight(): void {
    const newHeight = this.calculatePanelHeight();
    const panelWidth = this.questTrackerConfig.compactMode ? 280 : 350;
    
    if (this.trackerPanel) {
      this.trackerPanel.clear();
      this.trackerPanel.fillStyle(0x0a0a0a, 0.85);
      this.trackerPanel.fillRoundedRect(0, 0, panelWidth, newHeight, 8 * this.uiScale);
      this.trackerPanel.lineStyle(2 * this.uiScale, 0x8B0000);
      this.trackerPanel.strokeRoundedRect(0, 0, panelWidth, newHeight, 8 * this.uiScale);
    }
  }

  private getQuestTypeColor(type: Quest['type'], asString: boolean = false): number | string {
    const colors = {
      'main': asString ? '#FF8C00' : 0xFF8C00,
      'side': asString ? '#F5F5DC' : 0xF5F5DC,
      'daily': asString ? '#32CD32' : 0x32CD32,
      'weekly': asString ? '#4169E1' : 0x4169E1,
      'guild': asString ? '#FFD700' : 0xFFD700,
      'dungeon': asString ? '#8A2BE2' : 0x8A2BE2
    };
    return colors[type] || (asString ? '#F5F5DC' : 0xF5F5DC);
  }

  private getQuestTypeIcon(type: Quest['type']): string {
    const icons = {
      'main': '⭐',
      'side': '📋',
      'daily': '📅',
      'weekly': '📆',
      'guild': '🏰',
      'dungeon': '🏛️'
    };
    return icons[type] || '📋';
  }

  private formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private showQuestDetails(quest: Quest): void {
    console.log(`Showing details for quest: ${quest.title}`);
    this.scene.events.emit('questtracker:quest:details', quest);
  }

  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.questContainer) {
      this.questContainer.setVisible(!this.isCollapsed);
    }
    
    this.updatePanelHeight();
    
    // Update collapse button
    if (this.headerContainer) {
      const collapseButton = this.headerContainer.list.find(child => 
        child instanceof Phaser.GameObjects.Container
      ) as Phaser.GameObjects.Container;
      
      if (collapseButton) {
        const arrow = collapseButton.list[1] as Phaser.GameObjects.Text;
        arrow.setText(this.isCollapsed ? '▼' : '▲');
      }
    }
  }

  private initializeSampleQuests(): void {
    this.activeQuests = [
      {
        id: 'main_001',
        title: 'Clear the Whispering Woods',
        description: 'The ancient woods have become corrupted by dark magic. Clear out the evil creatures and find the source of corruption.',
        level: 8,
        type: 'main',
        giver: 'Elder Theron',
        location: 'Millbrook Village',
        objectives: [
          {
            id: 'obj_001',
            description: 'Defeat corrupted wolves',
            completed: false,
            progress: 3,
            maxProgress: 8
          },
          {
            id: 'obj_002',
            description: 'Find the corruption source',
            completed: false
          },
          {
            id: 'obj_003',
            description: 'Collect shadow essence (Optional)',
            completed: false,
            progress: 1,
            maxProgress: 3,
            optional: true
          }
        ],
        rewards: {
          experience: 1200,
          gold: 150,
          items: [
            { id: 'sword_001', name: 'Forest Guardian Blade', icon: '⚔️', quantity: 1 }
          ]
        },
        isCompleted: false,
        isTracked: true
      },
      {
        id: 'side_001',
        title: 'The Missing Merchant',
        description: 'A merchant has gone missing on the trade route. Find out what happened to him.',
        level: 7,
        type: 'side',
        giver: 'Captain Marcus',
        location: 'Trade Post',
        objectives: [
          {
            id: 'obj_004',
            description: 'Search the old trade route',
            completed: true
          },
          {
            id: 'obj_005',
            description: 'Question the bandits',
            completed: false
          }
        ],
        rewards: {
          experience: 800,
          gold: 100
        },
        isCompleted: false,
        isTracked: true
      },
      {
        id: 'daily_001',
        title: 'Herb Gathering',
        description: 'Collect healing herbs for the village apothecary.',
        level: 5,
        type: 'daily',
        giver: 'Herbalist Mira',
        location: 'Millbrook Village',
        objectives: [
          {
            id: 'obj_006',
            description: 'Collect moonflower petals',
            completed: false,
            progress: 5,
            maxProgress: 10
          }
        ],
        rewards: {
          experience: 300,
          gold: 50
        },
        timeLimit: 86400000, // 24 hours
        isCompleted: false,
        isTracked: true
      },
      {
        id: 'guild_001',
        title: 'Guild Supply Run',
        description: 'Deliver supplies to the guild outpost in the northern territories.',
        level: 8,
        type: 'guild',
        giver: 'Guild Master Aldric',
        location: 'Guild Hall',
        objectives: [
          {
            id: 'obj_007',
            description: 'Deliver supply crates',
            completed: false,
            progress: 2,
            maxProgress: 5
          }
        ],
        rewards: {
          experience: 600,
          gold: 80
        },
        isCompleted: false,
        isTracked: true
      }
    ];
    
    this.trackedQuests = this.activeQuests.filter(quest => quest.isTracked);
  }

  public trackQuest(questId: string): void {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest || quest.isTracked) return;
    
    if (this.trackedQuests.length >= this.questTrackerConfig.maxTrackedQuests!) {
      // Remove oldest tracked quest
      const oldestTracked = this.trackedQuests.shift();
      if (oldestTracked) {
        oldestTracked.isTracked = false;
      }
    }
    
    quest.isTracked = true;
    this.trackedQuests.push(quest);
    this.updateTrackedQuestsDisplay();
  }

  public untrackQuest(questId: string): void {
    const questIndex = this.trackedQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    
    const quest = this.trackedQuests[questIndex];
    quest.isTracked = false;
    this.trackedQuests.splice(questIndex, 1);
    this.updateTrackedQuestsDisplay();
  }

  public updateQuestProgress(questId: string, objectiveId: string, progress: number): void {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return;
    
    objective.progress = progress;
    
    // Check if objective is completed
    if (objective.maxProgress && objective.progress >= objective.maxProgress) {
      objective.completed = true;
    }
    
    // Check if quest is completed
    const requiredObjectives = quest.objectives.filter(obj => !obj.optional);
    const completedRequired = requiredObjectives.filter(obj => obj.completed);
    
    if (completedRequired.length === requiredObjectives.length) {
      quest.isCompleted = true;
      quest.completedAt = new Date();
      this.scene.events.emit('questtracker:quest:completed', quest);
    }
    
    // Update display if quest is tracked
    if (quest.isTracked) {
      this.updateTrackedQuestsDisplay();
    }
  }

  public addQuest(quest: Quest): void {
    this.activeQuests.push(quest);
    
    if (quest.isTracked) {
      this.trackQuest(quest.id);
    }
    
    this.scene.events.emit('questtracker:quest:added', quest);
  }

  public completeQuest(questId: string): void {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    quest.isCompleted = true;
    quest.completedAt = new Date();
    
    // Remove from tracked quests
    this.untrackQuest(questId);
    
    this.scene.events.emit('questtracker:quest:completed', quest);
  }

  public getActiveQuests(): Quest[] {
    return this.activeQuests.filter(q => !q.isCompleted);
  }

  public getTrackedQuests(): Quest[] {
    return this.trackedQuests;
  }

  public getQuestById(questId: string): Quest | undefined {
    return this.activeQuests.find(q => q.id === questId);
  }

  protected onResize(width: number, height: number): void {
    // Recreate the quest tracker with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.questElements.clear();
    this.create();
  }
}
