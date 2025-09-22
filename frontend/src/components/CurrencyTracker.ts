/**
 * Currency Tracker Component
 * Displays gold, crafting materials, PvP tokens, and other currencies
 * Based on MECHANICAL_DESIGN.md economy specifications
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface Currency {
  id: string;
  name: string;
  icon: string;
  amount: number;
  maxAmount?: number;
  color: string;
  tooltip?: string;
  category: 'primary' | 'crafting' | 'pvp' | 'special';
  displayOrder: number;
}

export interface CurrencyTrackerConfig extends UIComponentConfig {
  showCategories?: boolean;
  compactMode?: boolean;
  maxDisplayed?: number;
  verticalLayout?: boolean;
  showTooltips?: boolean;
}

export class CurrencyTracker extends UIComponent {
  private currencyConfig: CurrencyTrackerConfig;
  private currencies: Currency[] = [];
  private visibleCurrencies: Currency[] = [];
  private currentCategory: 'all' | 'primary' | 'crafting' | 'pvp' | 'special' = 'all';
  
  // UI Elements
  private currencyPanel?: Phaser.GameObjects.Graphics;
  private currencyContainer?: Phaser.GameObjects.Container;
  private categoryButtons?: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  }>;
  
  private currencyElements: Map<string, {
    container: Phaser.GameObjects.Container;
    icon: Phaser.GameObjects.Text;
    amountText: Phaser.GameObjects.Text;
    nameText?: Phaser.GameObjects.Text;
    progressBar?: {
      bg: Phaser.GameObjects.Graphics;
      fill: Phaser.GameObjects.Graphics;
    };
  }> = new Map();

  constructor(scene: Phaser.Scene, config: CurrencyTrackerConfig = {}) {
    super(scene, config);
    this.currencyConfig = {
      showCategories: true,
      compactMode: false,
      maxDisplayed: 8,
      verticalLayout: true,
      showTooltips: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createCurrencyTracker();
    
    this.initializeCurrencies();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createCurrencyTracker(): void {
    const panelWidth = this.currencyConfig.compactMode ? 200 : 280;
    const panelHeight = this.calculatePanelHeight();
    
    // Main currency panel
    this.currencyPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight, 0.85);
    
    // Title
    this.createTitle();
    
    // Category filters
    if (this.currencyConfig.showCategories) {
      this.createCategoryButtons();
    }
    
    // Currency container
    this.createCurrencyContainer();
    
    // Update display
    this.updateCurrencyDisplay();
  }

  private calculatePanelHeight(): number {
    const baseHeight = 50; // Title
    const categoryHeight = this.currencyConfig.showCategories ? 35 : 0;
    const currencyHeight = this.currencyConfig.compactMode ? 25 : 35;
    const maxVisible = Math.min(this.visibleCurrencies.length, this.currencyConfig.maxDisplayed!);
    
    return baseHeight + categoryHeight + (maxVisible * currencyHeight) + 20; // Extra padding
  }

  private createTitle(): void {
    const panelWidth = this.currencyConfig.compactMode ? 200 : 280;
    
    const title = this.createGothicText(panelWidth / 2, 15, 'Currencies', 16, '#FFD700');
    title.setOrigin(0.5, 0);
  }

  private createCategoryButtons(): void {
    if (!this.currencyConfig.showCategories) return;
    
    const panelWidth = this.currencyConfig.compactMode ? 200 : 280;
    const categories = ['all', 'primary', 'crafting', 'pvp'];
    const buttonWidth = (panelWidth - 30) / categories.length;
    const buttonHeight = 20;
    const startY = 40;
    
    this.categoryButtons = new Map();
    
    categories.forEach((category, index) => {
      const x = 15 + (index * buttonWidth);
      
      const categoryContainer = this.scene.add.container(x, startY);
      this.addElement(categoryContainer);
      
      // Button background
      const background = this.scene.add.graphics();
      const isActive = category === this.currentCategory;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, buttonWidth - 2, buttonHeight, 3);
      background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, buttonWidth - 2, buttonHeight, 3);
      categoryContainer.add(background);
      
      // Button text
      const buttonText = this.scene.add.text(buttonWidth / 2 - 1, buttonHeight / 2, 
        category.charAt(0).toUpperCase() + category.slice(1), {
        fontSize: `${9 * this.uiScale}px`,
        color: isActive ? '#F5F5DC' : '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      categoryContainer.add(buttonText);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(
        buttonWidth / 2 - 1, buttonHeight / 2, buttonWidth - 2, buttonHeight, 0x000000, 0
      ).setInteractive();
      categoryContainer.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.setCategory(category as any);
      });
      
      this.categoryButtons.set(category, {
        container: categoryContainer,
        background,
        text: buttonText
      });
    });
  }

  private createCurrencyContainer(): void {
    const panelWidth = this.currencyConfig.compactMode ? 200 : 280;
    const startY = this.currencyConfig.showCategories ? 75 : 45;
    const containerHeight = this.calculatePanelHeight() - startY - 10;
    
    this.currencyContainer = this.scene.add.container(15, startY);
    this.addElement(this.currencyContainer);
    
    // Container background
    const containerBg = this.scene.add.graphics();
    containerBg.fillStyle(0x1a1a1a, 0.6);
    containerBg.fillRoundedRect(0, 0, panelWidth - 30, containerHeight, 6);
    containerBg.lineStyle(1, 0x666666);
    containerBg.strokeRoundedRect(0, 0, panelWidth - 30, containerHeight, 6);
    this.currencyContainer.add(containerBg);
  }

  private setCategory(category: 'all' | 'primary' | 'crafting' | 'pvp' | 'special'): void {
    if (category === this.currentCategory) return;
    
    // Update category buttons
    this.categoryButtons?.forEach((button, buttonCategory) => {
      const isActive = buttonCategory === category;
      const buttonWidth = ((this.currencyConfig.compactMode ? 200 : 280) - 30) / 4;
      
      button.background.clear();
      button.background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      button.background.fillRoundedRect(0, 0, buttonWidth - 2, 20, 3);
      button.background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      button.background.strokeRoundedRect(0, 0, buttonWidth - 2, 20, 3);
      button.text.setColor(isActive ? '#F5F5DC' : '#C0C0C0');
    });
    
    this.currentCategory = category;
    this.updateCurrencyDisplay();
  }

  private updateCurrencyDisplay(): void {
    if (!this.currencyContainer) return;
    
    // Filter currencies by category
    this.visibleCurrencies = this.currencies.filter(currency => {
      if (this.currentCategory === 'all') return true;
      return currency.category === this.currentCategory;
    });
    
    // Sort by display order
    this.visibleCurrencies.sort((a, b) => a.displayOrder - b.displayOrder);
    
    // Limit displayed currencies
    this.visibleCurrencies = this.visibleCurrencies.slice(0, this.currencyConfig.maxDisplayed);
    
    // Clear existing currency displays (except background)
    const background = this.currencyContainer.list[0];
    this.currencyContainer.removeAll();
    this.currencyContainer.add(background);
    this.currencyElements.clear();
    
    // Display currencies
    this.visibleCurrencies.forEach((currency, index) => {
      this.createCurrencyDisplay(currency, index);
    });
    
    // Update panel height
    this.updatePanelHeight();
  }

  private createCurrencyDisplay(currency: Currency, index: number): void {
    if (!this.currencyContainer) return;
    
    const panelWidth = this.currencyConfig.compactMode ? 200 : 280;
    const currencyHeight = this.currencyConfig.compactMode ? 25 : 35;
    const y = 10 + (index * currencyHeight);
    
    // Currency container
    const currencyDisplayContainer = this.scene.add.container(0, y);
    this.currencyContainer.add(currencyDisplayContainer);
    
    // Currency background (for hover effect)
    const currencyBg = this.scene.add.graphics();
    currencyBg.fillStyle(0x000000, 0);
    currencyBg.fillRoundedRect(5, 0, panelWidth - 40, currencyHeight - 2, 4);
    currencyDisplayContainer.add(currencyBg);
    
    // Currency icon
    const icon = this.scene.add.text(10, currencyHeight / 2, currency.icon, {
      fontSize: `${18 * this.uiScale}px`,
      color: currency.color
    }).setOrigin(0, 0.5);
    currencyDisplayContainer.add(icon);
    
    // Currency amount
    const amountText = this.scene.add.text(panelWidth - 50, currencyHeight / 2, 
      this.formatCurrencyAmount(currency.amount), {
      fontSize: `${12 * this.uiScale}px`,
      color: currency.color,
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(1, 0.5);
    currencyDisplayContainer.add(amountText);
    
    // Currency name (if not compact mode)
    let nameText: Phaser.GameObjects.Text | undefined;
    if (!this.currencyConfig.compactMode) {
      nameText = this.scene.add.text(35, currencyHeight / 2, currency.name, {
        fontSize: `${11 * this.uiScale}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0, 0.5);
      currencyDisplayContainer.add(nameText);
    }
    
    // Progress bar (if currency has max amount)
    let progressBar: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics } | undefined;
    if (currency.maxAmount && currency.maxAmount > 0) {
      const progressY = currencyHeight - 8;
      const progressWidth = panelWidth - 60;
      const progressHeight = 4;
      
      progressBar = this.createCurrencyProgressBar(
        10, progressY, progressWidth, progressHeight, currency
      );
      currencyDisplayContainer.add(progressBar.bg);
      currencyDisplayContainer.add(progressBar.fill);
    }
    
    // Interactive area for tooltips
    if (this.currencyConfig.showTooltips) {
      const hitArea = this.scene.add.rectangle(
        (panelWidth - 40) / 2, currencyHeight / 2, panelWidth - 40, currencyHeight - 2, 0x000000, 0
      ).setInteractive();
      currencyDisplayContainer.add(hitArea);
      
      hitArea.on('pointerover', () => {
        currencyBg.fillStyle(0x4a0000, 0.3);
        currencyBg.fillRoundedRect(5, 0, panelWidth - 40, currencyHeight - 2, 4);
        
        if (currency.tooltip) {
          this.showCurrencyTooltip(currency, (panelWidth - 40) / 2, 0);
        }
      });
      
      hitArea.on('pointerout', () => {
        currencyBg.clear();
        currencyBg.fillStyle(0x000000, 0);
        currencyBg.fillRoundedRect(5, 0, panelWidth - 40, currencyHeight - 2, 4);
        
        this.hideCurrencyTooltip();
      });
    }
    
    // Store elements
    this.currencyElements.set(currency.id, {
      container: currencyDisplayContainer,
      icon,
      amountText,
      nameText,
      progressBar
    });
  }

  private createCurrencyProgressBar(
    x: number, y: number, width: number, height: number, currency: Currency
  ): { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics } {
    const progress = currency.maxAmount ? currency.amount / currency.maxAmount : 0;
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(x, y, width, height, height / 2);
    
    // Fill
    const fill = this.scene.add.graphics();
    fill.fillStyle(Phaser.Display.Color.HexStringToColor(currency.color).color, 0.8);
    fill.fillRoundedRect(x + 1, y + 1, (width - 2) * progress, height - 2, (height - 2) / 2);
    
    return { bg, fill };
  }

  private formatCurrencyAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      return amount.toString();
    }
  }

  private showCurrencyTooltip(currency: Currency, x: number, y: number): void {
    if (!currency.tooltip) return;
    
    let tooltipText = `${currency.name}\n${currency.tooltip}`;
    if (currency.maxAmount) {
      tooltipText += `\n${currency.amount}/${currency.maxAmount}`;
    } else {
      tooltipText += `\n${currency.amount}`;
    }
    
    const tooltip = this.createGothicText(x, y - 10, tooltipText, 10, '#FFFFFF');
    tooltip.setOrigin(0.5, 1).setName('currencyTooltip');
    tooltip.setBackgroundColor('#000000');
    tooltip.setPadding(6);
  }

  private hideCurrencyTooltip(): void {
    const tooltip = this.container.getByName('currencyTooltip');
    if (tooltip) {
      tooltip.destroy();
    }
  }

  private updatePanelHeight(): void {
    const newHeight = this.calculatePanelHeight();
    const panelWidth = this.currencyConfig.compactMode ? 200 : 280;
    
    if (this.currencyPanel) {
      this.currencyPanel.clear();
      this.currencyPanel.fillStyle(0x0a0a0a, 0.85);
      this.currencyPanel.fillRoundedRect(0, 0, panelWidth, newHeight, 8 * this.uiScale);
      this.currencyPanel.lineStyle(2 * this.uiScale, 0x8B0000);
      this.currencyPanel.strokeRoundedRect(0, 0, panelWidth, newHeight, 8 * this.uiScale);
    }
  }

  private initializeCurrencies(): void {
    this.currencies = [
      {
        id: 'gold',
        name: 'Gold',
        icon: '🪙',
        amount: 2450,
        color: '#FFD700',
        category: 'primary',
        displayOrder: 1,
        tooltip: 'Primary currency used for trading, repairs, and purchases'
      },
      {
        id: 'gems',
        name: 'Gems',
        icon: '💎',
        amount: 125,
        color: '#4B0082',
        category: 'primary',
        displayOrder: 2,
        tooltip: 'Premium currency for special items and services'
      },
      {
        id: 'iron_ore',
        name: 'Iron Ore',
        icon: '🪨',
        amount: 18,
        maxAmount: 100,
        color: '#C0C0C0',
        category: 'crafting',
        displayOrder: 10,
        tooltip: 'Used in blacksmithing to create weapons and armor'
      },
      {
        id: 'leather',
        name: 'Leather',
        icon: '🦴',
        amount: 24,
        maxAmount: 50,
        color: '#8B4513',
        category: 'crafting',
        displayOrder: 11,
        tooltip: 'Used in leatherworking to create light armor'
      },
      {
        id: 'cloth',
        name: 'Cloth',
        icon: '🧵',
        amount: 31,
        maxAmount: 75,
        color: '#DDA0DD',
        category: 'crafting',
        displayOrder: 12,
        tooltip: 'Used in tailoring to create robes and cloth armor'
      },
      {
        id: 'mana_crystals',
        name: 'Mana Crystals',
        icon: '🔮',
        amount: 7,
        maxAmount: 20,
        color: '#8A2BE2',
        category: 'crafting',
        displayOrder: 13,
        tooltip: 'Used in enchanting to enhance gear with magical properties'
      },
      {
        id: 'honor_points',
        name: 'Honor Points',
        icon: '⚔️',
        amount: 1250,
        maxAmount: 5000,
        color: '#DC143C',
        category: 'pvp',
        displayOrder: 20,
        tooltip: 'Earned through PvP combat, used to purchase PvP gear'
      },
      {
        id: 'arena_tokens',
        name: 'Arena Tokens',
        icon: '🏆',
        amount: 45,
        maxAmount: 200,
        color: '#FFD700',
        category: 'pvp',
        displayOrder: 21,
        tooltip: 'Earned through arena victories, used for elite PvP rewards'
      },
      {
        id: 'faction_rep',
        name: 'Faction Reputation',
        icon: '🛡️',
        amount: 2800,
        maxAmount: 5000,
        color: '#4169E1',
        category: 'special',
        displayOrder: 30,
        tooltip: 'Standing with your chosen faction, unlocks special gear and quests'
      }
    ];
    
    this.updateVisibleCurrencies();
  }

  private updateVisibleCurrencies(): void {
    this.visibleCurrencies = this.currencies.filter(currency => {
      if (this.currentCategory === 'all') return true;
      return currency.category === this.currentCategory;
    });
  }

  public updateCurrency(currencyId: string, amount: number): void {
    const currency = this.currencies.find(c => c.id === currencyId);
    if (!currency) return;
    
    const oldAmount = currency.amount;
    currency.amount = Math.max(0, amount);
    
    // Cap at max amount if applicable
    if (currency.maxAmount) {
      currency.amount = Math.min(currency.amount, currency.maxAmount);
    }
    
    // Update display
    const elements = this.currencyElements.get(currencyId);
    if (elements) {
      elements.amountText.setText(this.formatCurrencyAmount(currency.amount));
      
      // Update progress bar if applicable
      if (elements.progressBar && currency.maxAmount) {
        const progress = currency.amount / currency.maxAmount;
        elements.progressBar.fill.clear();
        elements.progressBar.fill.fillStyle(Phaser.Display.Color.HexStringToColor(currency.color).color, 0.8);
        // Would need to recreate with stored dimensions
      }
    }
    
    // Show currency change animation
    if (amount !== oldAmount) {
      this.showCurrencyChangeAnimation(currencyId, amount - oldAmount);
    }
    
    this.scene.events.emit('currency:updated', { currencyId, oldAmount, newAmount: amount });
  }

  private showCurrencyChangeAnimation(currencyId: string, change: number): void {
    const elements = this.currencyElements.get(currencyId);
    if (!elements) return;
    
    const changeText = change > 0 ? `+${change}` : change.toString();
    const changeColor = change > 0 ? '#32CD32' : '#FF4444';
    
    const animText = this.scene.add.text(
      elements.amountText.x + 20,
      elements.amountText.y,
      changeText,
      {
        fontSize: `${12 * this.uiScale}px`,
        color: changeColor,
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5);
    
    this.currencyContainer?.add(animText);
    
    // Animate the change text
    this.scene.tweens.add({
      targets: animText,
      y: animText.y - 20,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        animText.destroy();
      }
    });
  }

  public addCurrency(currencyId: string, amount: number): void {
    const currency = this.currencies.find(c => c.id === currencyId);
    if (currency) {
      this.updateCurrency(currencyId, currency.amount + amount);
    }
  }

  public removeCurrency(currencyId: string, amount: number): boolean {
    const currency = this.currencies.find(c => c.id === currencyId);
    if (!currency || currency.amount < amount) {
      return false; // Insufficient funds
    }
    
    this.updateCurrency(currencyId, currency.amount - amount);
    return true;
  }

  public getCurrencyAmount(currencyId: string): number {
    const currency = this.currencies.find(c => c.id === currencyId);
    return currency?.amount || 0;
  }

  public canAfford(currencyId: string, amount: number): boolean {
    return this.getCurrencyAmount(currencyId) >= amount;
  }

  public getAllCurrencies(): Currency[] {
    return [...this.currencies];
  }

  public getCurrenciesByCategory(category: Currency['category']): Currency[] {
    return this.currencies.filter(c => c.category === category);
  }

  protected onResize(width: number, height: number): void {
    // Recreate currency tracker with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.categoryButtons?.clear();
    this.currencyElements.clear();
    this.create();
  }
}
