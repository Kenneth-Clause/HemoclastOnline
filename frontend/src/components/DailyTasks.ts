/**
 * Daily Tasks Component
 * Daily/Weekly rotating quests and objectives with reset timers
 * Based on UI_DESIGN.md retention system specifications
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface DailyTask {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly';
  category: 'combat' | 'crafting' | 'social' | 'exploration' | 'dungeon' | 'pvp';
  icon: string;
  
  // Progress
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedDate?: Date;
  
  // Rewards
  rewards: {
    experience: number;
    gold: number;
    items?: Array<{
      id: string;
      name: string;
      icon: string;
      quantity: number;
    }>;
    currency?: Array<{
      type: string;
      amount: number;
    }>;
  };
  
  // Timing
  resetTime: Date;
  expiresAt: Date;
  
  // Difficulty and requirements
  difficulty: 'easy' | 'medium' | 'hard';
  requiredLevel: number;
  
  // Tracking
  isTracked: boolean;
}

export interface DailyTasksConfig extends UIComponentConfig {
  showWeeklyTasks?: boolean;
  compactMode?: boolean;
  maxTrackedTasks?: number;
  showRewards?: boolean;
  showTimers?: boolean;
}

export class DailyTasks extends UIComponent {
  private dailyTasksConfig: DailyTasksConfig;
  private dailyTasks: DailyTask[] = [];
  private weeklyTasks: DailyTask[] = [];
  private currentView: 'daily' | 'weekly' = 'daily';
  private trackedTasks: DailyTask[] = [];
  
  // UI Elements
  private tasksPanel?: Phaser.GameObjects.Graphics;
  private headerContainer?: Phaser.GameObjects.Container;
  private viewToggle?: Phaser.GameObjects.Container;
  private tasksContainer?: Phaser.GameObjects.Container;
  private resetTimerContainer?: Phaser.GameObjects.Container;
  
  private taskElements: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    nameText: Phaser.GameObjects.Text;
    descText: Phaser.GameObjects.Text;
    progressBar: {
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
      text: Phaser.GameObjects.Text;
    };
    rewardContainer: Phaser.GameObjects.Container;
    completedIcon?: Phaser.GameObjects.Text;
    trackButton?: Phaser.GameObjects.Container;
  }> = new Map();
  
  // Timers
  private resetTimer?: number;

  constructor(scene: Phaser.Scene, config: DailyTasksConfig = {}) {
    super(scene, config);
    
    this.dailyTasksConfig = {
      showWeeklyTasks: true,
      compactMode: false,
      maxTrackedTasks: 3,
      showRewards: true,
      showTimers: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.initializeTasks();
    this.createDailyTasks();
    this.startResetTimer();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createDailyTasks(): void {
    const panelWidth = this.dailyTasksConfig.compactMode ? 500 : 650;
    const panelHeight = this.dailyTasksConfig.compactMode ? 400 : 550;
    
    // Main tasks panel
    this.tasksPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Header with title and reset timer
    this.createHeader();
    
    // View toggle (Daily/Weekly)
    if (this.dailyTasksConfig.showWeeklyTasks) {
      this.createViewToggle();
    }
    
    // Tasks container
    this.createTasksContainer();
    
    // Update display
    this.updateTasksDisplay();
  }

  private createHeader(): void {
    const panelWidth = this.dailyTasksConfig.compactMode ? 500 : 650;
    
    this.headerContainer = this.scene.add.container(0, 0);
    this.addElement(this.headerContainer);
    
    // Title
    const title = this.createGothicText(panelWidth / 2, 15, 'Daily Tasks', 18, '#32CD32');
    title.setOrigin(0.5, 0);
    this.headerContainer.add(title);
    
    // Reset timer
    if (this.dailyTasksConfig.showTimers) {
      this.createResetTimer();
    }
  }

  private createResetTimer(): void {
    const panelWidth = this.dailyTasksConfig.compactMode ? 500 : 650;
    
    this.resetTimerContainer = this.scene.add.container(panelWidth / 2, 40);
    this.addElement(this.resetTimerContainer);
    
    const resetTime = this.getNextResetTime();
    const timeRemaining = resetTime.getTime() - Date.now();
    
    const timerText = this.scene.add.text(0, 0, 
      `Resets in: ${this.formatTimeRemaining(timeRemaining)}`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    this.resetTimerContainer.add(timerText);
  }

  private createViewToggle(): void {
    const panelWidth = this.dailyTasksConfig.compactMode ? 500 : 650;
    const toggleWidth = 200;
    const toggleHeight = 30;
    const x = panelWidth / 2 - toggleWidth / 2;
    const y = 70;
    
    this.viewToggle = this.scene.add.container(x, y);
    this.addElement(this.viewToggle);
    
    // Toggle background
    const toggleBg = this.scene.add.graphics();
    toggleBg.fillStyle(0x2F2F2F, 0.8);
    toggleBg.fillRoundedRect(0, 0, toggleWidth, toggleHeight, 6);
    toggleBg.lineStyle(2, 0x666666);
    toggleBg.strokeRoundedRect(0, 0, toggleWidth, toggleHeight, 6);
    this.viewToggle.add(toggleBg);
    
    // Daily button
    const dailyButton = this.createToggleButton(5, 5, toggleWidth / 2 - 7, toggleHeight - 10, 'Daily', 
      this.currentView === 'daily', () => this.switchView('daily'));
    this.viewToggle.add(dailyButton);
    
    // Weekly button
    const weeklyButton = this.createToggleButton(toggleWidth / 2 + 2, 5, toggleWidth / 2 - 7, toggleHeight - 10, 'Weekly', 
      this.currentView === 'weekly', () => this.switchView('weekly'));
    this.viewToggle.add(weeklyButton);
  }

  private createToggleButton(
    x: number, y: number, width: number, height: number, 
    text: string, isActive: boolean, onClick: () => void
  ): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(isActive ? 0x32CD32 : 0x2F2F2F, 0.8);
    buttonBg.fillRoundedRect(0, 0, width, height, 4);
    buttonContainer.add(buttonBg);
    
    // Button text
    const buttonText = this.scene.add.text(width / 2, height / 2, text, {
      fontSize: `${12 * this.uiScale}px`,
      color: isActive ? '#000000' : '#F5F5DC',
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

  private createTasksContainer(): void {
    const panelWidth = this.dailyTasksConfig.compactMode ? 500 : 650;
    const panelHeight = this.dailyTasksConfig.compactMode ? 400 : 550;
    const startY = this.dailyTasksConfig.showWeeklyTasks ? 110 : 80;
    const containerHeight = panelHeight - startY - 20;
    
    this.tasksContainer = this.scene.add.container(20, startY);
    this.addElement(this.tasksContainer);
    
    // Container background
    const containerBg = this.scene.add.graphics();
    containerBg.fillStyle(0x1a1a1a, 0.6);
    containerBg.fillRoundedRect(0, 0, panelWidth - 40, containerHeight, 8);
    containerBg.lineStyle(1, 0x666666);
    containerBg.strokeRoundedRect(0, 0, panelWidth - 40, containerHeight, 8);
    this.tasksContainer.add(containerBg);
  }

  private switchView(view: 'daily' | 'weekly'): void {
    if (view === this.currentView) return;
    
    this.currentView = view;
    
    // Update header title
    if (this.headerContainer) {
      const title = this.headerContainer.list[0] as Phaser.GameObjects.Text;
      title.setText(view === 'daily' ? 'Daily Tasks' : 'Weekly Tasks');
    }
    
    // Update toggle buttons (simplified - would need proper button references)
    console.log(`Switched to ${view} view`);
    
    this.updateTasksDisplay();
  }

  private updateTasksDisplay(): void {
    if (!this.tasksContainer) return;
    
    // Clear existing task displays (except background)
    const background = this.tasksContainer.list[0];
    this.tasksContainer.removeAll();
    this.tasksContainer.add(background);
    this.taskElements.clear();
    
    // Get tasks for current view
    const tasks = this.currentView === 'daily' ? this.dailyTasks : this.weeklyTasks;
    
    // Display tasks
    tasks.forEach((task, index) => {
      this.createTaskDisplay(task, index);
    });
  }

  private createTaskDisplay(task: DailyTask, index: number): void {
    if (!this.tasksContainer) return;
    
    const panelWidth = this.dailyTasksConfig.compactMode ? 500 : 650;
    const taskHeight = this.dailyTasksConfig.compactMode ? 70 : 90;
    const y = 15 + (index * (taskHeight + 10));
    
    // Task container
    const taskDisplayContainer = this.scene.add.container(0, y);
    this.tasksContainer.add(taskDisplayContainer);
    
    // Task background
    const background = this.scene.add.graphics();
    const bgColor = task.isCompleted ? 0x1a4a1a : 0x2F2F2F;
    const borderColor = task.isCompleted ? 0x32CD32 : this.getDifficultyColor(task.difficulty);
    background.fillStyle(bgColor, 0.8);
    background.fillRoundedRect(10, 0, panelWidth - 60, taskHeight, 8);
    background.lineStyle(2, borderColor);
    background.strokeRoundedRect(10, 0, panelWidth - 60, taskHeight, 8);
    taskDisplayContainer.add(background);
    
    // Task icon
    const icon = this.scene.add.text(25, taskHeight / 2, task.icon, {
      fontSize: `${24 * this.uiScale}px`,
      color: task.isCompleted ? '#32CD32' : '#F5F5DC'
    }).setOrigin(0, 0.5);
    taskDisplayContainer.add(icon);
    
    // Completed checkmark
    let completedIcon: Phaser.GameObjects.Text | undefined;
    if (task.isCompleted) {
      completedIcon = this.scene.add.text(panelWidth - 80, 15, '✓', {
        fontSize: `${20 * this.uiScale}px`,
        color: '#32CD32'
      });
      taskDisplayContainer.add(completedIcon);
    }
    
    // Task name
    const nameText = this.scene.add.text(55, 12, task.name, {
      fontSize: `${14 * this.uiScale}px`,
      color: task.isCompleted ? '#32CD32' : '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    taskDisplayContainer.add(nameText);
    
    // Task description
    const descText = this.scene.add.text(55, 28, task.description, {
      fontSize: `${11 * this.uiScale}px`,
      color: task.isCompleted ? '#C0C0C0' : '#999999',
      fontFamily: 'Cinzel, serif',
      wordWrap: { width: panelWidth - 180 }
    });
    taskDisplayContainer.add(descText);
    
    // Progress bar
    const progressBar = this.createTaskProgressBar(task, taskDisplayContainer, panelWidth - 60, taskHeight);
    
    // Reward container
    const rewardContainer = this.scene.add.container(panelWidth - 150, 15);
    taskDisplayContainer.add(rewardContainer);
    
    if (this.dailyTasksConfig.showRewards) {
      this.createTaskRewards(task, rewardContainer);
    }
    
    // Track button (if not completed)
    let trackButton: Phaser.GameObjects.Container | undefined;
    if (!task.isCompleted) {
      trackButton = this.createTrackButton(task, taskDisplayContainer, panelWidth - 100, taskHeight - 25);
    }
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(
      (panelWidth - 60) / 2, taskHeight / 2, panelWidth - 60, taskHeight, 0x000000, 0
    ).setInteractive();
    taskDisplayContainer.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      this.showTaskDetails(task);
    });
    
    // Store elements
    this.taskElements.set(task.id, {
      container: taskDisplayContainer,
      background,
      icon,
      nameText,
      descText,
      progressBar,
      rewardContainer,
      completedIcon,
      trackButton
    });
  }

  private createTaskProgressBar(
    task: DailyTask,
    container: Phaser.GameObjects.Container,
    maxWidth: number,
    containerHeight: number
  ): { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text } {
    const progressY = containerHeight - 18;
    const progressWidth = maxWidth - 200;
    const progressHeight = 10;
    const progressX = 55;
    
    const progress = task.progress / task.maxProgress;
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(progressX, progressY, progressWidth, progressHeight, progressHeight / 2);
    bg.lineStyle(1, 0x666666);
    bg.strokeRoundedRect(progressX, progressY, progressWidth, progressHeight, progressHeight / 2);
    container.add(bg);
    
    // Fill
    const fill = this.scene.add.graphics();
    const fillColor = task.isCompleted ? 0x32CD32 : 0x4169E1;
    fill.fillStyle(fillColor);
    fill.fillRoundedRect(progressX + 1, progressY + 1, (progressWidth - 2) * progress, progressHeight - 2, (progressHeight - 2) / 2);
    container.add(fill);
    
    // Progress text
    const text = this.scene.add.text(progressX + progressWidth / 2, progressY + progressHeight / 2, 
      `${task.progress}/${task.maxProgress}`, {
      fontSize: `${9 * this.uiScale}px`,
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    container.add(text);
    
    return { bg, fill, text };
  }

  private createTaskRewards(task: DailyTask, container: Phaser.GameObjects.Container): void {
    let iconIndex = 0;
    const iconSpacing = 25;
    
    // Experience reward
    if (task.rewards.experience > 0) {
      const expIcon = this.scene.add.text(iconIndex * iconSpacing, 0, '✨', {
        fontSize: `${16 * this.uiScale}px`,
        color: '#4169E1'
      }).setOrigin(0.5, 0);
      container.add(expIcon);
      
      const expText = this.scene.add.text(iconIndex * iconSpacing, 20, task.rewards.experience.toString(), {
        fontSize: `${8 * this.uiScale}px`,
        color: '#4169E1',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0.5, 0);
      container.add(expText);
      iconIndex++;
    }
    
    // Gold reward
    if (task.rewards.gold > 0) {
      const goldIcon = this.scene.add.text(iconIndex * iconSpacing, 0, '🪙', {
        fontSize: `${16 * this.uiScale}px`
      }).setOrigin(0.5, 0);
      container.add(goldIcon);
      
      const goldText = this.scene.add.text(iconIndex * iconSpacing, 20, task.rewards.gold.toString(), {
        fontSize: `${8 * this.uiScale}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0.5, 0);
      container.add(goldText);
      iconIndex++;
    }
    
    // Item rewards
    if (task.rewards.items) {
      task.rewards.items.forEach(item => {
        const itemIcon = this.scene.add.text(iconIndex * iconSpacing, 0, item.icon, {
          fontSize: `${16 * this.uiScale}px`
        }).setOrigin(0.5, 0);
        container.add(itemIcon);
        
        if (item.quantity > 1) {
          const quantityText = this.scene.add.text(iconIndex * iconSpacing, 20, item.quantity.toString(), {
            fontSize: `${8 * this.uiScale}px`,
            color: '#FFFFFF',
            fontFamily: 'Cinzel, serif'
          }).setOrigin(0.5, 0);
          container.add(quantityText);
        }
        iconIndex++;
      });
    }
  }

  private createTrackButton(task: DailyTask, container: Phaser.GameObjects.Container, x: number, y: number): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(x, y);
    container.add(buttonContainer);
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    const isTracked = task.isTracked;
    buttonBg.fillStyle(isTracked ? 0x4a0000 : 0x2F2F2F, 0.8);
    buttonBg.fillRoundedRect(0, 0, 60, 20, 4);
    buttonBg.lineStyle(1, isTracked ? 0xDC143C : 0x666666);
    buttonBg.strokeRoundedRect(0, 0, 60, 20, 4);
    buttonContainer.add(buttonBg);
    
    // Button text
    const buttonText = this.scene.add.text(30, 10, isTracked ? 'Untrack' : 'Track', {
      fontSize: `${9 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    buttonContainer.add(buttonText);
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(30, 10, 60, 20, 0x000000, 0).setInteractive();
    buttonContainer.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      this.toggleTaskTracking(task.id);
    });
    
    return buttonContainer;
  }

  private getDifficultyColor(difficulty: DailyTask['difficulty']): number {
    const colors = {
      'easy': 0x32CD32,
      'medium': 0xFFD700,
      'hard': 0xFF4444
    };
    return colors[difficulty];
  }

  private getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Reset at midnight
    return tomorrow;
  }

  private formatTimeRemaining(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private startResetTimer(): void {
    this.resetTimer = window.setInterval(() => {
      this.updateResetTimer();
    }, 1000);
  }

  private updateResetTimer(): void {
    if (!this.resetTimerContainer || !this.dailyTasksConfig.showTimers) return;
    
    const resetTime = this.getNextResetTime();
    const timeRemaining = resetTime.getTime() - Date.now();
    
    if (timeRemaining <= 0) {
      this.resetTasks();
      return;
    }
    
    const timerText = this.resetTimerContainer.list[0] as Phaser.GameObjects.Text;
    if (timerText) {
      timerText.setText(`Resets in: ${this.formatTimeRemaining(timeRemaining)}`);
    }
  }

  private resetTasks(): void {
    console.log(`Resetting ${this.currentView} tasks`);
    
    // Reset daily tasks
    if (this.currentView === 'daily') {
      this.dailyTasks.forEach(task => {
        if (!task.isCompleted) {
          task.progress = 0;
        }
        task.isCompleted = false;
        task.completedDate = undefined;
        task.resetTime = new Date();
        task.expiresAt = new Date(Date.now() + 86400000); // 24 hours
      });
    }
    
    // Generate new tasks (placeholder)
    this.generateNewTasks();
    
    this.updateTasksDisplay();
    this.scene.events.emit('daily_tasks:reset', { type: this.currentView });
  }

  private generateNewTasks(): void {
    // This would normally generate random tasks from a pool
    console.log('Generating new tasks...');
  }

  public updateTaskProgress(taskId: string, progress: number): void {
    const allTasks = [...this.dailyTasks, ...this.weeklyTasks];
    const task = allTasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return;
    
    task.progress = Math.min(progress, task.maxProgress);
    
    // Check if completed
    if (task.progress >= task.maxProgress) {
      this.completeTask(taskId);
    } else {
      // Update progress display
      const elements = this.taskElements.get(taskId);
      if (elements) {
        const progressPercent = task.progress / task.maxProgress;
        elements.progressBar.fill.clear();
        elements.progressBar.fill.fillStyle(0x4169E1);
        // Would need to recreate with stored dimensions
        elements.progressBar.text.setText(`${task.progress}/${task.maxProgress}`);
      }
    }
  }

  public completeTask(taskId: string): void {
    const allTasks = [...this.dailyTasks, ...this.weeklyTasks];
    const task = allTasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return;
    
    task.isCompleted = true;
    task.completedDate = new Date();
    task.progress = task.maxProgress;
    
    // Show completion notification
    this.showTaskCompletionNotification(task);
    
    // Update display
    this.updateTasksDisplay();
    
    this.scene.events.emit('daily_tasks:completed', task);
  }

  private showTaskCompletionNotification(task: DailyTask): void {
    const { width, height } = this.scene.scale;
    
    // Create notification
    const notification = this.scene.add.container(width - 300, 100);
    
    // Notification background
    const notificationBg = this.scene.add.graphics();
    notificationBg.fillStyle(0x1a4a1a, 0.95);
    notificationBg.fillRoundedRect(0, 0, 280, 80, 8);
    notificationBg.lineStyle(2, 0x32CD32);
    notificationBg.strokeRoundedRect(0, 0, 280, 80, 8);
    notification.add(notificationBg);
    
    // Task completed text
    const completedText = this.scene.add.text(140, 15, `${task.type.toUpperCase()} TASK COMPLETED!`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#32CD32',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    notification.add(completedText);
    
    // Task name
    const taskName = this.scene.add.text(140, 35, task.name, {
      fontSize: `${14 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    notification.add(taskName);
    
    // Rewards
    const rewardText = `+${task.rewards.experience} XP, +${task.rewards.gold} Gold`;
    const rewards = this.scene.add.text(140, 55, rewardText, {
      fontSize: `${10 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    notification.add(rewards);
    
    // Animate notification
    notification.setX(width + 280); // Start off-screen
    
    this.scene.tweens.add({
      targets: notification,
      x: width - 300,
      duration: 500,
      ease: 'Back.out'
    });
    
    // Auto-hide after delay
    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: notification,
        x: width + 280,
        duration: 300,
        onComplete: () => {
          notification.destroy();
        }
      });
    });
  }

  private toggleTaskTracking(taskId: string): void {
    const allTasks = [...this.dailyTasks, ...this.weeklyTasks];
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (task.isTracked) {
      // Untrack task
      task.isTracked = false;
      this.trackedTasks = this.trackedTasks.filter(t => t.id !== taskId);
    } else {
      // Track task
      if (this.trackedTasks.length >= this.dailyTasksConfig.maxTrackedTasks!) {
        // Remove oldest tracked task
        const oldestTracked = this.trackedTasks.shift();
        if (oldestTracked) {
          oldestTracked.isTracked = false;
        }
      }
      
      task.isTracked = true;
      this.trackedTasks.push(task);
    }
    
    this.updateTasksDisplay();
    this.scene.events.emit('daily_tasks:tracking:changed', { taskId, isTracked: task.isTracked });
  }

  private showTaskDetails(task: DailyTask): void {
    console.log(`Showing details for task: ${task.name}`);
    
    let detailText = `${task.name}\n\n${task.description}\n\n`;
    detailText += `Difficulty: ${task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}\n`;
    detailText += `Required Level: ${task.requiredLevel}\n`;
    detailText += `Type: ${task.type.charAt(0).toUpperCase() + task.type.slice(1)}\n\n`;
    
    if (!task.isCompleted) {
      detailText += `Progress: ${task.progress}/${task.maxProgress}\n`;
      const timeRemaining = task.expiresAt.getTime() - Date.now();
      detailText += `Expires in: ${this.formatTimeRemaining(timeRemaining)}\n\n`;
    }
    
    detailText += 'Rewards:\n';
    detailText += `• ${task.rewards.experience} Experience\n`;
    detailText += `• ${task.rewards.gold} Gold\n`;
    
    if (task.rewards.items) {
      task.rewards.items.forEach(item => {
        detailText += `• ${item.quantity}x ${item.name}\n`;
      });
    }
    
    this.scene.events.emit('daily_tasks:details:show', { task, detailText });
  }

  private initializeTasks(): void {
    // Initialize daily tasks
    this.dailyTasks = [
      {
        id: 'daily_001',
        name: 'Monster Slayer',
        description: 'Defeat 15 monsters of any type.',
        type: 'daily',
        category: 'combat',
        icon: '⚔️',
        progress: 8,
        maxProgress: 15,
        isCompleted: false,
        rewards: { experience: 500, gold: 100 },
        resetTime: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        difficulty: 'easy',
        requiredLevel: 1,
        isTracked: true
      },
      {
        id: 'daily_002',
        name: 'Herb Gatherer',
        description: 'Collect 20 crafting materials.',
        type: 'daily',
        category: 'crafting',
        icon: '🌿',
        progress: 12,
        maxProgress: 20,
        isCompleted: false,
        rewards: { 
          experience: 300, 
          gold: 75,
          items: [{ id: 'herb_pouch', name: 'Herb Pouch', icon: '🎒', quantity: 1 }]
        },
        resetTime: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        difficulty: 'easy',
        requiredLevel: 5,
        isTracked: false
      },
      {
        id: 'daily_003',
        name: 'Social Butterfly',
        description: 'Send 5 messages in guild chat.',
        type: 'daily',
        category: 'social',
        icon: '💬',
        progress: 3,
        maxProgress: 5,
        isCompleted: false,
        rewards: { experience: 200, gold: 50 },
        resetTime: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        difficulty: 'easy',
        requiredLevel: 1,
        isTracked: true
      }
    ];
    
    // Initialize weekly tasks
    this.weeklyTasks = [
      {
        id: 'weekly_001',
        name: 'Dungeon Master',
        description: 'Complete 3 different dungeons.',
        type: 'weekly',
        category: 'dungeon',
        icon: '🏛️',
        progress: 1,
        maxProgress: 3,
        isCompleted: false,
        rewards: { 
          experience: 2000, 
          gold: 500,
          items: [{ id: 'dungeon_key', name: 'Master Dungeon Key', icon: '🗝️', quantity: 1 }]
        },
        resetTime: new Date(),
        expiresAt: new Date(Date.now() + 604800000), // 7 days
        difficulty: 'hard',
        requiredLevel: 10,
        isTracked: true
      },
      {
        id: 'weekly_002',
        name: 'PvP Champion',
        description: 'Win 10 PvP battles.',
        type: 'weekly',
        category: 'pvp',
        icon: '🏆',
        progress: 4,
        maxProgress: 10,
        isCompleted: false,
        rewards: { 
          experience: 1500, 
          currency: [{ type: 'honor_points', amount: 500 }]
        },
        resetTime: new Date(),
        expiresAt: new Date(Date.now() + 604800000),
        difficulty: 'hard',
        requiredLevel: 15,
        isTracked: false
      }
    ];
    
    // Set up tracked tasks
    this.trackedTasks = [...this.dailyTasks, ...this.weeklyTasks].filter(task => task.isTracked);
  }

  public getDailyTasks(): DailyTask[] {
    return [...this.dailyTasks];
  }

  public getWeeklyTasks(): DailyTask[] {
    return [...this.weeklyTasks];
  }

  public getTrackedTasks(): DailyTask[] {
    return [...this.trackedTasks];
  }

  protected onResize(width: number, height: number): void {
    // Recreate daily tasks with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.categoryButtons.clear();
    this.taskElements.clear();
    this.create();
  }

  public destroy(): void {
    // Clear reset timer
    if (this.resetTimer) {
      clearInterval(this.resetTimer);
    }
    
    super.destroy();
  }
}
