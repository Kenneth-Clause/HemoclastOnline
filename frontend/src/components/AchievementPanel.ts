/**
 * Achievement Panel Component
 * Achievement tracking, rewards, titles, cosmetics, and mounts
 * Based on UI_DESIGN.md achievement and retention specifications
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'exploration' | 'social' | 'crafting' | 'pvp' | 'dungeon' | 'special';
  type: 'progress' | 'milestone' | 'hidden' | 'meta';
  icon: string;
  points: number;
  
  // Progress tracking
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedDate?: Date;
  
  // Rewards
  rewards: {
    experience?: number;
    gold?: number;
    title?: string;
    cosmetic?: string;
    mount?: string;
    item?: {
      id: string;
      name: string;
      icon: string;
    };
  };
  
  // Display
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isHidden: boolean; // Hidden until discovered
  prerequisite?: string; // Required achievement ID
}

export interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  achievements: Achievement[];
  completedCount: number;
  totalCount: number;
}

export interface AchievementPanelConfig extends UIComponentConfig {
  showProgress?: boolean;
  showRewards?: boolean;
  compactMode?: boolean;
  achievementsPerPage?: number;
  enableSearch?: boolean;
}

export class AchievementPanel extends UIComponent {
  private achievementConfig: AchievementPanelConfig;
  private achievements: Achievement[] = [];
  private categories: AchievementCategory[] = [];
  private currentCategory: string = 'all';
  private currentPage: number = 0;
  private searchTerm: string = '';
  private filteredAchievements: Achievement[] = [];
  
  // UI Elements
  private achievementPanel?: Phaser.GameObjects.Graphics;
  private headerContainer?: Phaser.GameObjects.Container;
  private categoryContainer?: Phaser.GameObjects.Container;
  private achievementContainer?: Phaser.GameObjects.Container;
  private progressSummary?: Phaser.GameObjects.Container;
  
  private categoryButtons: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    countText: Phaser.GameObjects.Text;
  }> = new Map();
  
  private achievementElements: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    nameText: Phaser.GameObjects.Text;
    descText: Phaser.GameObjects.Text;
    progressBar?: {
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
      text: Phaser.GameObjects.Text;
    };
    rewardIcons: Phaser.GameObjects.Text[];
    completedIcon?: Phaser.GameObjects.Text;
  }> = new Map();

  constructor(scene: Phaser.Scene, config: AchievementPanelConfig = {}) {
    super(scene, config);
    
    this.achievementConfig = {
      showProgress: true,
      showRewards: true,
      compactMode: false,
      achievementsPerPage: 8,
      enableSearch: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.initializeAchievements();
    this.createAchievementPanel();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createAchievementPanel(): void {
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    const panelHeight = this.achievementConfig.compactMode ? 500 : 650;
    
    // Main achievement panel
    this.achievementPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Header with title and progress summary
    this.createHeader();
    
    // Category buttons
    this.createCategoryButtons();
    
    // Achievement container
    this.createAchievementContainer();
    
    // Update display
    this.updateAchievementDisplay();
  }

  private createHeader(): void {
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    
    this.headerContainer = this.scene.add.container(0, 0);
    this.addElement(this.headerContainer);
    
    // Title
    const title = this.createGothicText(panelWidth / 2, 15, 'Achievements', 20, '#FFD700');
    title.setOrigin(0.5, 0);
    this.headerContainer.add(title);
    
    // Progress summary
    this.createProgressSummary();
  }

  private createProgressSummary(): void {
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    
    this.progressSummary = this.scene.add.container(panelWidth / 2, 45);
    this.addElement(this.progressSummary);
    
    const completedAchievements = this.achievements.filter(a => a.isCompleted).length;
    const totalPoints = this.achievements.filter(a => a.isCompleted).reduce((sum, a) => sum + a.points, 0);
    
    // Overall progress
    const progressText = this.scene.add.text(0, 0, 
      `${completedAchievements}/${this.achievements.length} Completed`, {
      fontSize: `${14 * this.uiScale}px`,
      color: '#32CD32',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 0);
    this.progressSummary.add(progressText);
    
    // Achievement points
    const pointsText = this.scene.add.text(0, 20, `${totalPoints} Achievement Points`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5, 0);
    this.progressSummary.add(pointsText);
  }

  private createCategoryButtons(): void {
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    const buttonWidth = (panelWidth - 60) / this.categories.length;
    const buttonHeight = 35;
    const startY = 85;
    
    this.categoryContainer = this.scene.add.container(0, 0);
    this.addElement(this.categoryContainer);
    
    // Add "All" category
    const allCategory = {
      id: 'all',
      name: 'All',
      icon: '🏆',
      color: '#FFD700',
      completedCount: this.achievements.filter(a => a.isCompleted).length,
      totalCount: this.achievements.length
    };
    
    const allCategories = [allCategory, ...this.categories];
    
    allCategories.forEach((category, index) => {
      const x = 30 + (index * buttonWidth);
      
      const categoryButtonContainer = this.scene.add.container(x, startY);
      this.categoryContainer.add(categoryButtonContainer);
      
      // Button background
      const background = this.scene.add.graphics();
      const isActive = category.id === this.currentCategory;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, buttonWidth - 5, buttonHeight, 6);
      background.lineStyle(2, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, buttonWidth - 5, buttonHeight, 6);
      categoryButtonContainer.add(background);
      
      // Category icon
      const icon = this.scene.add.text(15, 10, category.icon, {
        fontSize: `${16 * this.uiScale}px`
      });
      categoryButtonContainer.add(icon);
      
      // Category name
      const nameText = this.scene.add.text(35, 8, category.name, {
        fontSize: `${12 * this.uiScale}px`,
        color: isActive ? '#F5F5DC' : '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      });
      categoryButtonContainer.add(nameText);
      
      // Progress count
      const countText = this.scene.add.text(35, 22, `${category.completedCount}/${category.totalCount}`, {
        fontSize: `${10 * this.uiScale}px`,
        color: isActive ? '#32CD32' : '#999999',
        fontFamily: 'Cinzel, serif'
      });
      categoryButtonContainer.add(countText);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(
        (buttonWidth - 5) / 2, buttonHeight / 2, buttonWidth - 5, buttonHeight, 0x000000, 0
      ).setInteractive();
      categoryButtonContainer.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.setCategory(category.id);
      });
      
      this.categoryButtons.set(category.id, {
        container: categoryButtonContainer,
        background,
        text: nameText,
        countText
      });
    });
  }

  private createAchievementContainer(): void {
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    const panelHeight = this.achievementConfig.compactMode ? 500 : 650;
    const startY = 130;
    const containerHeight = panelHeight - startY - 20;
    
    this.achievementContainer = this.scene.add.container(30, startY);
    this.addElement(this.achievementContainer);
    
    // Container background
    const containerBg = this.scene.add.graphics();
    containerBg.fillStyle(0x1a1a1a, 0.6);
    containerBg.fillRoundedRect(0, 0, panelWidth - 60, containerHeight, 8);
    containerBg.lineStyle(1, 0x666666);
    containerBg.strokeRoundedRect(0, 0, panelWidth - 60, containerHeight, 8);
    this.achievementContainer.add(containerBg);
  }

  private setCategory(categoryId: string): void {
    if (categoryId === this.currentCategory) return;
    
    // Update category buttons
    this.categoryButtons.forEach((button, buttonCategory) => {
      const isActive = buttonCategory === categoryId;
      const buttonWidth = ((this.achievementConfig.compactMode ? 700 : 900) - 60) / (this.categories.length + 1);
      
      button.background.clear();
      button.background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      button.background.fillRoundedRect(0, 0, buttonWidth - 5, 35, 6);
      button.background.lineStyle(2, isActive ? 0xDC143C : 0x666666);
      button.background.strokeRoundedRect(0, 0, buttonWidth - 5, 35, 6);
      button.text.setColor(isActive ? '#F5F5DC' : '#C0C0C0');
      button.countText.setColor(isActive ? '#32CD32' : '#999999');
    });
    
    this.currentCategory = categoryId;
    this.currentPage = 0;
    this.updateAchievementDisplay();
  }

  private updateAchievementDisplay(): void {
    if (!this.achievementContainer) return;
    
    // Filter achievements
    this.filteredAchievements = this.achievements.filter(achievement => {
      // Category filter
      if (this.currentCategory !== 'all' && achievement.category !== this.currentCategory) {
        return false;
      }
      
      // Search filter
      if (this.searchTerm && !achievement.name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Hide hidden achievements that haven't been discovered
      if (achievement.isHidden && !achievement.isCompleted && achievement.progress === 0) {
        return false;
      }
      
      return true;
    });
    
    // Sort achievements (completed first, then by category, then by name)
    this.filteredAchievements.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? -1 : 1;
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    // Clear existing displays (except background)
    const background = this.achievementContainer.list[0];
    this.achievementContainer.removeAll();
    this.achievementContainer.add(background);
    this.achievementElements.clear();
    
    // Pagination
    const startIndex = this.currentPage * this.achievementConfig.achievementsPerPage!;
    const endIndex = startIndex + this.achievementConfig.achievementsPerPage!;
    const pageAchievements = this.filteredAchievements.slice(startIndex, endIndex);
    
    // Display achievements
    pageAchievements.forEach((achievement, index) => {
      this.createAchievementDisplay(achievement, index);
    });
    
    // Pagination controls
    if (this.filteredAchievements.length > this.achievementConfig.achievementsPerPage!) {
      this.createPaginationControls();
    }
  }

  private createAchievementDisplay(achievement: Achievement, index: number): void {
    if (!this.achievementContainer) return;
    
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    const achievementHeight = this.achievementConfig.compactMode ? 60 : 80;
    const y = 15 + (index * (achievementHeight + 10));
    
    // Achievement container
    const achievementDisplayContainer = this.scene.add.container(0, y);
    this.achievementContainer.add(achievementDisplayContainer);
    
    // Achievement background
    const background = this.scene.add.graphics();
    const bgColor = achievement.isCompleted ? 0x1a4a1a : 0x2F2F2F;
    const borderColor = achievement.isCompleted ? 0x32CD32 : this.getRarityColor(achievement.rarity);
    background.fillStyle(bgColor, 0.8);
    background.fillRoundedRect(10, 0, panelWidth - 80, achievementHeight, 8);
    background.lineStyle(2, borderColor);
    background.strokeRoundedRect(10, 0, panelWidth - 80, achievementHeight, 8);
    achievementDisplayContainer.add(background);
    
    // Achievement icon
    const icon = this.scene.add.text(25, achievementHeight / 2, achievement.icon, {
      fontSize: `${32 * this.uiScale}px`,
      color: achievement.isCompleted ? '#FFD700' : '#C0C0C0'
    }).setOrigin(0, 0.5);
    achievementDisplayContainer.add(icon);
    
    // Completed checkmark
    let completedIcon: Phaser.GameObjects.Text | undefined;
    if (achievement.isCompleted) {
      completedIcon = this.scene.add.text(panelWidth - 100, 15, '✓', {
        fontSize: `${24 * this.uiScale}px`,
        color: '#32CD32'
      });
      achievementDisplayContainer.add(completedIcon);
    }
    
    // Achievement name
    const nameColor = achievement.isCompleted ? '#32CD32' : this.getRarityTextColor(achievement.rarity);
    const nameText = this.scene.add.text(70, 12, achievement.name, {
      fontSize: `${14 * this.uiScale}px`,
      color: nameColor,
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    achievementDisplayContainer.add(nameText);
    
    // Achievement description
    const descText = this.scene.add.text(70, 30, achievement.description, {
      fontSize: `${11 * this.uiScale}px`,
      color: achievement.isCompleted ? '#F5F5DC' : '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      wordWrap: { width: panelWidth - 200 }
    });
    achievementDisplayContainer.add(descText);
    
    // Progress bar (if not completed and has progress)
    let progressBar: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text } | undefined;
    if (!achievement.isCompleted && achievement.maxProgress > 1 && this.achievementConfig.showProgress) {
      progressBar = this.createAchievementProgressBar(achievement, achievementDisplayContainer, panelWidth - 80, achievementHeight);
    }
    
    // Reward icons
    const rewardIcons: Phaser.GameObjects.Text[] = [];
    if (this.achievementConfig.showRewards) {
      rewardIcons.push(...this.createRewardIcons(achievement, achievementDisplayContainer, panelWidth - 80));
    }
    
    // Points display
    const pointsText = this.scene.add.text(panelWidth - 120, achievementHeight - 15, `${achievement.points} pts`, {
      fontSize: `${10 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(1, 1);
    achievementDisplayContainer.add(pointsText);
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(
      (panelWidth - 80) / 2, achievementHeight / 2, panelWidth - 80, achievementHeight, 0x000000, 0
    ).setInteractive();
    achievementDisplayContainer.add(hitArea);
    
    hitArea.on('pointerover', () => {
      background.setAlpha(1.2);
    });
    
    hitArea.on('pointerout', () => {
      background.setAlpha(1.0);
    });
    
    hitArea.on('pointerdown', () => {
      this.showAchievementDetails(achievement);
    });
    
    // Store elements
    this.achievementElements.set(achievement.id, {
      container: achievementDisplayContainer,
      background,
      icon,
      nameText,
      descText,
      progressBar,
      rewardIcons,
      completedIcon
    });
  }

  private createAchievementProgressBar(
    achievement: Achievement,
    container: Phaser.GameObjects.Container,
    maxWidth: number,
    containerHeight: number
  ): { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text } {
    const progressY = containerHeight - 20;
    const progressWidth = maxWidth - 140;
    const progressHeight = 12;
    const progressX = 70;
    
    const progress = achievement.progress / achievement.maxProgress;
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(progressX, progressY, progressWidth, progressHeight, progressHeight / 2);
    bg.lineStyle(1, 0x666666);
    bg.strokeRoundedRect(progressX, progressY, progressWidth, progressHeight, progressHeight / 2);
    container.add(bg);
    
    // Fill
    const fill = this.scene.add.graphics();
    fill.fillStyle(0x32CD32);
    fill.fillRoundedRect(progressX + 1, progressY + 1, (progressWidth - 2) * progress, progressHeight - 2, (progressHeight - 2) / 2);
    container.add(fill);
    
    // Progress text
    const text = this.scene.add.text(progressX + progressWidth / 2, progressY + progressHeight / 2, 
      `${achievement.progress}/${achievement.maxProgress}`, {
      fontSize: `${9 * this.uiScale}px`,
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    container.add(text);
    
    return { bg, fill, text };
  }

  private createRewardIcons(achievement: Achievement, container: Phaser.GameObjects.Container, maxWidth: number): Phaser.GameObjects.Text[] {
    const icons: Phaser.GameObjects.Text[] = [];
    const startX = maxWidth - 60;
    const iconY = 15;
    let iconIndex = 0;
    
    // Experience reward
    if (achievement.rewards.experience) {
      const expIcon = this.scene.add.text(startX - (iconIndex * 25), iconY, '✨', {
        fontSize: `${16 * this.uiScale}px`,
        color: '#4169E1'
      }).setOrigin(0.5);
      container.add(expIcon);
      icons.push(expIcon);
      iconIndex++;
    }
    
    // Gold reward
    if (achievement.rewards.gold) {
      const goldIcon = this.scene.add.text(startX - (iconIndex * 25), iconY, '🪙', {
        fontSize: `${16 * this.uiScale}px`
      }).setOrigin(0.5);
      container.add(goldIcon);
      icons.push(goldIcon);
      iconIndex++;
    }
    
    // Title reward
    if (achievement.rewards.title) {
      const titleIcon = this.scene.add.text(startX - (iconIndex * 25), iconY, '👑', {
        fontSize: `${16 * this.uiScale}px`,
        color: '#FFD700'
      }).setOrigin(0.5);
      container.add(titleIcon);
      icons.push(titleIcon);
      iconIndex++;
    }
    
    // Cosmetic reward
    if (achievement.rewards.cosmetic) {
      const cosmeticIcon = this.scene.add.text(startX - (iconIndex * 25), iconY, '🎨', {
        fontSize: `${16 * this.uiScale}px`,
        color: '#FF69B4'
      }).setOrigin(0.5);
      container.add(cosmeticIcon);
      icons.push(cosmeticIcon);
      iconIndex++;
    }
    
    // Mount reward
    if (achievement.rewards.mount) {
      const mountIcon = this.scene.add.text(startX - (iconIndex * 25), iconY, '🐎', {
        fontSize: `${16 * this.uiScale}px`,
        color: '#8A2BE2'
      }).setOrigin(0.5);
      container.add(mountIcon);
      icons.push(mountIcon);
      iconIndex++;
    }
    
    return icons;
  }

  private createPaginationControls(): void {
    if (!this.achievementContainer) return;
    
    const panelWidth = this.achievementConfig.compactMode ? 700 : 900;
    const panelHeight = this.achievementConfig.compactMode ? 500 : 650;
    const totalPages = Math.ceil(this.filteredAchievements.length / this.achievementConfig.achievementsPerPage!);
    const y = panelHeight - 200;
    
    // Previous button
    if (this.currentPage > 0) {
      const prevButton = this.createButton(
        15, y, 80, 25, 'Previous', () => {
          this.currentPage--;
          this.updateAchievementDisplay();
        }
      );
    }
    
    // Page indicator
    const pageText = this.scene.add.text((panelWidth - 60) / 2, y + 12, 
      `Page ${this.currentPage + 1} of ${totalPages}`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    this.achievementContainer.add(pageText);
    
    // Next button
    if (this.currentPage < totalPages - 1) {
      const nextButton = this.createButton(
        panelWidth - 155, y, 80, 25, 'Next', () => {
          this.currentPage++;
          this.updateAchievementDisplay();
        }
      );
    }
  }

  private getRarityColor(rarity: string): number {
    const colors = {
      'common': 0x9d9d9d,
      'rare': 0x0070dd,
      'epic': 0xa335ee,
      'legendary': 0xff8000
    };
    return colors[rarity as keyof typeof colors] || 0x666666;
  }

  private getRarityTextColor(rarity: string): string {
    const colors = {
      'common': '#9d9d9d',
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };
    return colors[rarity as keyof typeof colors] || '#F5F5DC';
  }

  private showAchievementDetails(achievement: Achievement): void {
    console.log(`Showing details for achievement: ${achievement.name}`);
    
    // Create detailed tooltip or modal
    let detailText = `${achievement.name}\n\n${achievement.description}\n\n`;
    
    if (!achievement.isCompleted) {
      detailText += `Progress: ${achievement.progress}/${achievement.maxProgress}\n`;
    } else {
      detailText += `Completed: ${achievement.completedDate?.toLocaleDateString()}\n`;
    }
    
    detailText += `Points: ${achievement.points}\n\nRewards:\n`;
    
    if (achievement.rewards.experience) detailText += `• ${achievement.rewards.experience} Experience\n`;
    if (achievement.rewards.gold) detailText += `• ${achievement.rewards.gold} Gold\n`;
    if (achievement.rewards.title) detailText += `• Title: "${achievement.rewards.title}"\n`;
    if (achievement.rewards.cosmetic) detailText += `• Cosmetic: ${achievement.rewards.cosmetic}\n`;
    if (achievement.rewards.mount) detailText += `• Mount: ${achievement.rewards.mount}\n`;
    if (achievement.rewards.item) detailText += `• Item: ${achievement.rewards.item.name}\n`;
    
    this.scene.events.emit('achievements:details:show', { achievement, detailText });
  }

  public updateAchievementProgress(achievementId: string, progress: number): void {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.isCompleted) return;
    
    const oldProgress = achievement.progress;
    achievement.progress = Math.min(progress, achievement.maxProgress);
    
    // Check if completed
    if (achievement.progress >= achievement.maxProgress && !achievement.isCompleted) {
      this.completeAchievement(achievementId);
    } else {
      // Update display
      const elements = this.achievementElements.get(achievementId);
      if (elements && elements.progressBar) {
        const progressPercent = achievement.progress / achievement.maxProgress;
        elements.progressBar.fill.clear();
        elements.progressBar.fill.fillStyle(0x32CD32);
        // Would need to recreate with stored dimensions
        elements.progressBar.text.setText(`${achievement.progress}/${achievement.maxProgress}`);
      }
    }
    
    this.scene.events.emit('achievements:progress:updated', { 
      achievementId, 
      oldProgress, 
      newProgress: achievement.progress 
    });
  }

  public completeAchievement(achievementId: string): void {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.isCompleted) return;
    
    achievement.isCompleted = true;
    achievement.completedDate = new Date();
    achievement.progress = achievement.maxProgress;
    
    // Show completion notification
    this.showAchievementCompletionNotification(achievement);
    
    // Update category counts
    this.updateCategoryCounts();
    
    // Update progress summary
    if (this.progressSummary) {
      this.progressSummary.removeAll();
      this.createProgressSummary();
    }
    
    // Refresh display
    this.updateAchievementDisplay();
    
    this.scene.events.emit('achievements:completed', achievement);
  }

  private showAchievementCompletionNotification(achievement: Achievement): void {
    const { width, height } = this.scene.scale;
    
    // Create achievement notification
    const notificationContainer = this.scene.add.container(width / 2, height / 2 - 100);
    
    // Notification background
    const notificationBg = this.scene.add.graphics();
    notificationBg.fillStyle(0x0a0a0a, 0.95);
    notificationBg.fillRoundedRect(-200, -60, 400, 120, 12);
    notificationBg.lineStyle(3, 0xFFD700);
    notificationBg.strokeRoundedRect(-200, -60, 400, 120, 12);
    notificationContainer.add(notificationBg);
    
    // Achievement completed text
    const completedText = this.scene.add.text(0, -35, 'ACHIEVEMENT UNLOCKED!', {
      fontSize: `${18 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '700'
    }).setOrigin(0.5);
    notificationContainer.add(completedText);
    
    // Achievement name
    const achievementName = this.scene.add.text(0, -10, achievement.name, {
      fontSize: `${16 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    notificationContainer.add(achievementName);
    
    // Achievement icon
    const achievementIcon = this.scene.add.text(-150, -10, achievement.icon, {
      fontSize: `${40 * this.uiScale}px`
    }).setOrigin(0.5);
    notificationContainer.add(achievementIcon);
    
    // Points earned
    const pointsEarned = this.scene.add.text(0, 15, `+${achievement.points} Achievement Points`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#32CD32',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    notificationContainer.add(pointsEarned);
    
    // Rewards
    if (achievement.rewards.title || achievement.rewards.cosmetic || achievement.rewards.mount) {
      let rewardText = 'Rewards: ';
      if (achievement.rewards.title) rewardText += `Title "${achievement.rewards.title}" `;
      if (achievement.rewards.cosmetic) rewardText += `${achievement.rewards.cosmetic} `;
      if (achievement.rewards.mount) rewardText += `${achievement.rewards.mount} `;
      
      const rewardsText = this.scene.add.text(0, 35, rewardText, {
        fontSize: `${11 * this.uiScale}px`,
        color: '#8A2BE2',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0.5);
      notificationContainer.add(rewardsText);
    }
    
    // Animate notification
    notificationContainer.setAlpha(0).setScale(0.5);
    
    this.scene.tweens.add({
      targets: notificationContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.out'
    });
    
    // Auto-hide after delay
    this.scene.time.delayedCall(5000, () => {
      this.scene.tweens.add({
        targets: notificationContainer,
        alpha: 0,
        scaleY: 0.8,
        duration: 300,
        onComplete: () => {
          notificationContainer.destroy();
        }
      });
    });
  }

  private updateCategoryCounts(): void {
    this.categories.forEach(category => {
      const categoryAchievements = this.achievements.filter(a => a.category === category.id);
      category.completedCount = categoryAchievements.filter(a => a.isCompleted).length;
      category.totalCount = categoryAchievements.length;
    });
  }

  private initializeAchievements(): void {
    // Initialize categories
    this.categories = [
      {
        id: 'combat',
        name: 'Combat',
        icon: '⚔️',
        color: '#DC143C',
        achievements: [],
        completedCount: 0,
        totalCount: 0
      },
      {
        id: 'exploration',
        name: 'Exploration',
        icon: '🗺️',
        color: '#32CD32',
        achievements: [],
        completedCount: 0,
        totalCount: 0
      },
      {
        id: 'social',
        name: 'Social',
        icon: '👥',
        color: '#4169E1',
        achievements: [],
        completedCount: 0,
        totalCount: 0
      },
      {
        id: 'crafting',
        name: 'Crafting',
        icon: '🔨',
        color: '#8B4513',
        achievements: [],
        completedCount: 0,
        totalCount: 0
      },
      {
        id: 'dungeon',
        name: 'Dungeons',
        icon: '🏛️',
        color: '#8A2BE2',
        achievements: [],
        completedCount: 0,
        totalCount: 0
      }
    ];
    
    // Initialize sample achievements
    this.achievements = [
      {
        id: 'first_kill',
        name: 'First Blood',
        description: 'Defeat your first enemy in combat.',
        category: 'combat',
        type: 'milestone',
        icon: '⚔️',
        points: 10,
        progress: 1,
        maxProgress: 1,
        isCompleted: true,
        completedDate: new Date('2024-09-01'),
        rewards: { experience: 100, gold: 25 },
        rarity: 'common',
        isHidden: false
      },
      {
        id: 'damage_dealer',
        name: 'Damage Dealer',
        description: 'Deal 10,000 total damage to enemies.',
        category: 'combat',
        type: 'progress',
        icon: '💥',
        points: 25,
        progress: 7500,
        maxProgress: 10000,
        isCompleted: false,
        rewards: { experience: 500, title: 'the Destroyer' },
        rarity: 'rare',
        isHidden: false
      },
      {
        id: 'critical_master',
        name: 'Critical Master',
        description: 'Land 100 critical hits.',
        category: 'combat',
        type: 'progress',
        icon: '💫',
        points: 20,
        progress: 67,
        maxProgress: 100,
        isCompleted: false,
        rewards: { experience: 300, cosmetic: 'Critical Strike Effect' },
        rarity: 'rare',
        isHidden: false
      },
      {
        id: 'explorer',
        name: 'World Explorer',
        description: 'Discover 10 different locations.',
        category: 'exploration',
        type: 'progress',
        icon: '🌍',
        points: 30,
        progress: 4,
        maxProgress: 10,
        isCompleted: false,
        rewards: { experience: 750, mount: 'Swift Travel Horse' },
        rarity: 'epic',
        isHidden: false
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 20 friends to your friends list.',
        category: 'social',
        type: 'progress',
        icon: '🦋',
        points: 15,
        progress: 8,
        maxProgress: 20,
        isCompleted: false,
        rewards: { experience: 200, title: 'the Friendly' },
        rarity: 'common',
        isHidden: false
      },
      {
        id: 'guild_founder',
        name: 'Guild Founder',
        description: 'Create or join a guild.',
        category: 'social',
        type: 'milestone',
        icon: '🏰',
        points: 25,
        progress: 1,
        maxProgress: 1,
        isCompleted: true,
        completedDate: new Date('2024-08-15'),
        rewards: { experience: 400, gold: 100 },
        rarity: 'rare',
        isHidden: false
      },
      {
        id: 'dungeon_crawler',
        name: 'Dungeon Crawler',
        description: 'Complete 5 different dungeons.',
        category: 'dungeon',
        type: 'progress',
        icon: '🗝️',
        points: 50,
        progress: 2,
        maxProgress: 5,
        isCompleted: false,
        rewards: { experience: 1000, title: 'the Dungeon Master', cosmetic: 'Dungeon Explorer Cloak' },
        rarity: 'epic',
        isHidden: false
      },
      {
        id: 'secret_achievement',
        name: '???',
        description: 'A mysterious achievement awaits discovery...',
        category: 'special',
        type: 'hidden',
        icon: '❓',
        points: 100,
        progress: 0,
        maxProgress: 1,
        isCompleted: false,
        rewards: { title: 'the Mysterious', mount: 'Shadow Steed', cosmetic: 'Mysterious Aura' },
        rarity: 'legendary',
        isHidden: true
      }
    ];
    
    // Update category counts
    this.updateCategoryCounts();
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public getCompletedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.isCompleted);
  }

  public getAchievementsByCategory(category: string): Achievement[] {
    return this.achievements.filter(a => a.category === category);
  }

  public getTotalAchievementPoints(): number {
    return this.achievements.filter(a => a.isCompleted).reduce((sum, a) => sum + a.points, 0);
  }

  protected onResize(width: number, height: number): void {
    // Recreate achievement panel with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.categoryButtons.clear();
    this.achievementElements.clear();
    this.create();
  }
}
