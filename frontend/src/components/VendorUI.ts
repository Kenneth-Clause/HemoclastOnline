/**
 * Vendor UI Component
 * Buy/sell interface with repair functionality and confirm dialogs
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface VendorItem {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'misc';
  price: number;
  currency: 'gold' | 'gems' | 'honor_points' | 'arena_tokens';
  level?: number;
  stats?: { [key: string]: number };
  description: string;
  stock: number; // -1 for unlimited
  category: string;
}

export interface VendorInfo {
  id: string;
  name: string;
  type: 'general' | 'armor' | 'weapons' | 'consumables' | 'materials' | 'pvp' | 'special';
  greeting: string;
  buybackMultiplier: number; // How much vendor pays for items (0.0 - 1.0)
  repairCost: number; // Cost per durability point
  items: VendorItem[];
}

export interface VendorUIConfig extends UIComponentConfig {
  showCategories?: boolean;
  showRepair?: boolean;
  compactMode?: boolean;
  itemsPerPage?: number;
}

export class VendorUI extends UIComponent {
  private vendorConfig: VendorUIConfig;
  private vendorInfo: VendorInfo | null = null;
  private currentTab: 'buy' | 'sell' | 'repair' = 'buy';
  private currentCategory: string = 'all';
  private currentPage: number = 0;
  private playerInventory: any[] = []; // Would integrate with actual inventory
  
  // UI Elements
  private vendorPanel?: Phaser.GameObjects.Graphics;
  private headerContainer?: Phaser.GameObjects.Container;
  private tabContainer?: Phaser.GameObjects.Container;
  private contentContainer?: Phaser.GameObjects.Container;
  private categoryButtons?: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  }>;
  
  private itemElements: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    nameText: Phaser.GameObjects.Text;
    priceText: Phaser.GameObjects.Text;
    stockText?: Phaser.GameObjects.Text;
  }> = new Map();

  constructor(scene: Phaser.Scene, config: VendorUIConfig = {}) {
    super(scene, config);
    this.vendorConfig = {
      showCategories: true,
      showRepair: true,
      compactMode: false,
      itemsPerPage: 12,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createVendorUI();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createVendorUI(): void {
    const panelWidth = this.vendorConfig.compactMode ? 600 : 750;
    const panelHeight = this.vendorConfig.compactMode ? 450 : 550;
    
    // Main vendor panel
    this.vendorPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Header with vendor info
    this.createHeader();
    
    // Tab buttons (Buy/Sell/Repair)
    this.createTabButtons();
    
    // Category filters
    if (this.vendorConfig.showCategories) {
      // TODO: Implement category buttons
      // this.createCategoryButtons();
    }
    
    // Content container
    this.createContentContainer();
    
    // Update display
    this.updateContentDisplay();
  }

  private createHeader(): void {
    const panelWidth = this.vendorConfig.compactMode ? 600 : 750;
    
    this.headerContainer = this.scene.add.container(0, 0);
    this.addElement(this.headerContainer);
    
    if (this.vendorInfo) {
      // Vendor name
      const vendorName = this.createGothicText(panelWidth / 2, 15, this.vendorInfo.name, 18, '#FFD700');
      vendorName.setOrigin(0.5, 0);
      this.headerContainer.add(vendorName);
      
      // Vendor greeting
      const greeting = this.createGothicText(panelWidth / 2, 40, this.vendorInfo.greeting, 12, '#C0C0C0');
      greeting.setOrigin(0.5, 0);
      this.headerContainer.add(greeting);
    } else {
      const placeholder = this.createGothicText(panelWidth / 2, 25, 'No Vendor Selected', 16, '#999999');
      placeholder.setOrigin(0.5, 0);
      this.headerContainer.add(placeholder);
    }
  }

  private createTabButtons(): void {
    const panelWidth = this.vendorConfig.compactMode ? 600 : 750;
    const tabs = ['buy', 'sell'];
    if (this.vendorConfig.showRepair) {
      tabs.push('repair');
    }
    
    const tabWidth = (panelWidth - 40) / tabs.length;
    const tabHeight = 30;
    const startY = 65;
    
    this.tabContainer = this.scene.add.container(0, 0);
    this.addElement(this.tabContainer);
    
    tabs.forEach((tab, index) => {
      const x = 20 + (index * tabWidth);
      
      const tabButtonContainer = this.scene.add.container(x, startY);
      this.tabContainer.add(tabButtonContainer);
      
      // Tab background
      const background = this.scene.add.graphics();
      const isActive = tab === this.currentTab;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, tabWidth - 2, tabHeight, 6);
      background.lineStyle(2, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, tabWidth - 2, tabHeight, 6);
      tabButtonContainer.add(background);
      
      // Tab text
      const tabText = this.scene.add.text(tabWidth / 2 - 1, tabHeight / 2, 
        tab.charAt(0).toUpperCase() + tab.slice(1), {
        fontSize: `${14 * this.uiScale}px`,
        color: isActive ? '#F5F5DC' : '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      tabButtonContainer.add(tabText);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(
        tabWidth / 2 - 1, tabHeight / 2, tabWidth - 2, tabHeight, 0x000000, 0
      ).setInteractive();
      tabButtonContainer.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.switchToTab(tab as any);
      });
    });
  }

  private createContentContainer(): void {
    const panelWidth = this.vendorConfig.compactMode ? 600 : 750;
    const panelHeight = this.vendorConfig.compactMode ? 450 : 550;
    const startY = this.vendorConfig.showCategories ? 140 : 105;
    const containerHeight = panelHeight - startY - 20;
    
    this.contentContainer = this.scene.add.container(20, startY);
    this.addElement(this.contentContainer);
    
    // Content background
    const contentBg = this.scene.add.graphics();
    contentBg.fillStyle(0x1a1a1a, 0.7);
    contentBg.fillRoundedRect(0, 0, panelWidth - 40, containerHeight, 8);
    contentBg.lineStyle(1, 0x666666);
    contentBg.strokeRoundedRect(0, 0, panelWidth - 40, containerHeight, 8);
    this.contentContainer.add(contentBg);
  }

  private switchToTab(tab: 'buy' | 'sell' | 'repair'): void {
    if (tab === this.currentTab) return;
    
    this.currentTab = tab;
    this.currentPage = 0;
    
    // Update tab buttons (simplified - would need proper tab button references)
    console.log(`Switched to ${tab} tab`);
    
    this.updateContentDisplay();
  }

  private updateContentDisplay(): void {
    if (!this.contentContainer || !this.vendorInfo) return;
    
    // Clear content (except background)
    const background = this.contentContainer.list[0];
    this.contentContainer.removeAll();
    this.contentContainer.add(background);
    this.itemElements.clear();
    
    switch (this.currentTab) {
      case 'buy':
        this.createBuyTab();
        break;
      case 'sell':
        this.createSellTab();
        break;
      case 'repair':
        this.createRepairTab();
        break;
    }
  }

  private createBuyTab(): void {
    if (!this.contentContainer || !this.vendorInfo) return;
    
    // Filter items by category
    let items = this.vendorInfo.items;
    if (this.currentCategory !== 'all') {
      items = items.filter(item => item.category === this.currentCategory);
    }
    
    // Pagination
    const startIndex = this.currentPage * this.vendorConfig.itemsPerPage!;
    const endIndex = startIndex + this.vendorConfig.itemsPerPage!;
    const pageItems = items.slice(startIndex, endIndex);
    
    // Display items in grid
    const itemsPerRow = this.vendorConfig.compactMode ? 4 : 5;
    const itemSize = this.vendorConfig.compactMode ? 80 : 100;
    const itemSpacing = 10;
    
    pageItems.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = 15 + col * (itemSize + itemSpacing);
      const y = 15 + row * (itemSize + itemSpacing);
      
      this.createVendorItemDisplay(item, x, y, itemSize, 'buy');
    });
    
    // Pagination controls
    if (items.length > this.vendorConfig.itemsPerPage!) {
      this.createPaginationControls(items.length);
    }
  }

  private createSellTab(): void {
    if (!this.contentContainer) return;
    
    // Display player inventory items that can be sold
    const sellableItems = this.playerInventory.filter(item => 
      item.bindType === 'none' || item.bindType === 'boe'
    );
    
    const itemsPerRow = this.vendorConfig.compactMode ? 4 : 5;
    const itemSize = this.vendorConfig.compactMode ? 80 : 100;
    const itemSpacing = 10;
    
    sellableItems.forEach((item: any, index: number) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = 15 + col * (itemSize + itemSpacing);
      const y = 15 + row * (itemSize + itemSpacing);
      
      // Calculate sell price
      const sellPrice = Math.floor(item.value * (this.vendorInfo?.buybackMultiplier || 0.25));
      
      this.createPlayerItemDisplay(item, x, y, itemSize, sellPrice);
    });
    
    // Sell all button
    const sellAllButton = this.createButton(
      15, (this.vendorConfig.compactMode ? 450 : 550) - 150,
      120, 30, 'Sell All Junk', () => {
        this.sellAllJunk();
      }
    );
  }

  private createRepairTab(): void {
    if (!this.contentContainer || !this.vendorInfo) return;
    
    // Repair all section
    const repairAllCost = this.calculateRepairAllCost();
    
    const repairTitle = this.scene.add.text(20, 20, 'Repair Equipment', {
      fontSize: `${16 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(repairTitle);
    
    const repairCostText = this.scene.add.text(20, 45, `Total Repair Cost: ${repairAllCost} gold`, {
      fontSize: `${14 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif'
    });
    this.contentContainer.add(repairCostText);
    
    // Repair all button
    const repairAllButton = this.createButton(
      20, 75, 150, 30, 'Repair All', () => {
        this.repairAllItems();
      }
    );
    
    // Individual item repair (placeholder)
    const equipmentSlots = ['Head', 'Chest', 'Legs', 'Hands', 'Feet', 'Main Hand', 'Off Hand'];
    equipmentSlots.forEach((slot, index) => {
      const y = 120 + (index * 35);
      
      const slotText = this.scene.add.text(20, y, slot, {
        fontSize: `${12 * this.uiScale}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(slotText);
      
      const durabilityText = this.scene.add.text(150, y, '95/100', {
        fontSize: `${12 * this.uiScale}px`,
        color: '#32CD32',
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(durabilityText);
      
      const repairCost = Math.floor(Math.random() * 20) + 5;
      const repairButton = this.scene.add.text(250, y, `Repair (${repairCost}g)`, {
        fontSize: `${11 * this.uiScale}px`,
        color: '#4169E1',
        fontFamily: 'Cinzel, serif'
      }).setInteractive();
      this.contentContainer.add(repairButton);
      
      repairButton.on('pointerdown', () => {
        this.repairItem(slot, repairCost);
      });
    });
  }

  private createVendorItemDisplay(item: VendorItem, x: number, y: number, size: number, action: 'buy' | 'sell'): void {
    if (!this.contentContainer) return;
    
    // Item container
    const itemContainer = this.scene.add.container(x, y);
    this.contentContainer.add(itemContainer);
    
    // Item background
    const background = this.scene.add.graphics();
    const rarityColor = this.getRarityColor(item.rarity);
    background.fillStyle(0x2d1b1b, 0.8);
    background.fillRoundedRect(0, 0, size, size, 6);
    background.lineStyle(2, rarityColor);
    background.strokeRoundedRect(0, 0, size, size, 6);
    itemContainer.add(background);
    
    // Item icon
    const icon = this.scene.add.text(size / 2, size / 2 - 10, item.icon, {
      fontSize: `${size * 0.4}px`,
      color: '#F5F5DC'
    }).setOrigin(0.5);
    itemContainer.add(icon);
    
    // Item name
    const nameText = this.scene.add.text(size / 2, size - 25, item.name, {
      fontSize: `${9 * this.uiScale}px`,
      color: this.getRarityTextColor(item.rarity),
      fontFamily: 'Cinzel, serif',
      fontWeight: '600',
      wordWrap: { width: size - 10 }
    }).setOrigin(0.5, 0);
    itemContainer.add(nameText);
    
    // Price
    const currencyIcon = this.getCurrencyIcon(item.currency);
    const priceText = this.scene.add.text(size / 2, size - 8, `${currencyIcon}${item.price}`, {
      fontSize: `${10 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5, 1);
    itemContainer.add(priceText);
    
    // Stock indicator
    let stockText: Phaser.GameObjects.Text | undefined;
    if (item.stock >= 0) {
      stockText = this.scene.add.text(size - 5, 5, item.stock.toString(), {
        fontSize: `${8 * this.uiScale}px`,
        color: item.stock > 0 ? '#FFFFFF' : '#FF4444',
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      }).setOrigin(1, 0);
      itemContainer.add(stockText);
    }
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(size / 2, size / 2, size, size, 0x000000, 0)
      .setInteractive();
    itemContainer.add(hitArea);
    
    // Hover effects
    hitArea.on('pointerover', () => {
      background.clear();
      background.fillStyle(0x4a0000, 0.9);
      background.fillRoundedRect(0, 0, size, size, 6);
      background.lineStyle(2, 0xDC143C);
      background.strokeRoundedRect(0, 0, size, size, 6);
      
      this.showVendorItemTooltip(item, x + size / 2, y);
    });
    
    hitArea.on('pointerout', () => {
      background.clear();
      background.fillStyle(0x2d1b1b, 0.8);
      background.fillRoundedRect(0, 0, size, size, 6);
      background.lineStyle(2, rarityColor);
      background.strokeRoundedRect(0, 0, size, size, 6);
      
      this.hideVendorItemTooltip();
    });
    
    // Click to buy/sell
    hitArea.on('pointerdown', () => {
      if (action === 'buy') {
        this.buyItem(item);
      } else {
        this.sellItem(item);
      }
    });
    
    // Store elements
    this.itemElements.set(item.id, {
      container: itemContainer,
      background,
      icon,
      nameText,
      priceText,
      stockText
    });
  }

  private createPlayerItemDisplay(item: any, x: number, y: number, size: number, sellPrice: number): void {
    // Similar to createVendorItemDisplay but for player items
    this.createVendorItemDisplay({
      ...item,
      price: sellPrice,
      currency: 'gold' as const,
      stock: item.stackSize || 1,
      category: item.type
    }, x, y, size, 'sell');
  }

  private createPaginationControls(totalItems: number): void {
    if (!this.contentContainer) return;
    
    const totalPages = Math.ceil(totalItems / this.vendorConfig.itemsPerPage!);
    const panelWidth = this.vendorConfig.compactMode ? 600 : 750;
    const y = (this.vendorConfig.compactMode ? 450 : 550) - 180;
    
    // Previous button
    if (this.currentPage > 0) {
      const prevButton = this.createButton(
        15, y, 80, 25, 'Previous', () => {
          this.currentPage--;
          this.updateContentDisplay();
        }
      );
    }
    
    // Page indicator
    const pageText = this.scene.add.text(panelWidth / 2 - 20, y + 12, 
      `Page ${this.currentPage + 1} of ${totalPages}`, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    this.contentContainer.add(pageText);
    
    // Next button
    if (this.currentPage < totalPages - 1) {
      const nextButton = this.createButton(
        panelWidth - 115, y, 80, 25, 'Next', () => {
          this.currentPage++;
          this.updateContentDisplay();
        }
      );
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

  private getCurrencyIcon(currency: string): string {
    const icons = {
      'gold': '🪙',
      'gems': '💎',
      'honor_points': '⚔️',
      'arena_tokens': '🏆'
    };
    return icons[currency as keyof typeof icons] || '💰';
  }

  private showVendorItemTooltip(item: VendorItem, x: number, y: number): void {
    let tooltipText = `${item.name}\n`;
    tooltipText += `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} ${item.type}\n`;
    if (item.level) tooltipText += `Level ${item.level}\n`;
    if (item.stats) {
      tooltipText += '\nStats:\n';
      Object.entries(item.stats).forEach(([stat, value]) => {
        tooltipText += `+${value} ${stat}\n`;
      });
    }
    tooltipText += `\n${item.description}\n`;
    tooltipText += `\nPrice: ${item.price} ${item.currency}`;
    if (item.stock >= 0) {
      tooltipText += `\nStock: ${item.stock}`;
    }
    
    const tooltip = this.createGothicText(x, y - 10, tooltipText, 10, '#FFFFFF');
    tooltip.setOrigin(0.5, 1).setName('vendorTooltip');
    tooltip.setBackgroundColor('#000000');
    tooltip.setPadding(8);
  }

  private hideVendorItemTooltip(): void {
    const tooltip = this.container.getByName('vendorTooltip');
    if (tooltip) {
      tooltip.destroy();
    }
  }

  private buyItem(item: VendorItem): void {
    console.log(`Attempting to buy: ${item.name} for ${item.price} ${item.currency}`);
    
    // Check stock
    if (item.stock === 0) {
      console.log('Item out of stock');
      return;
    }
    
    // TODO: Check if player has enough currency
    // TODO: Show confirmation dialog for expensive items
    
    this.scene.events.emit('vendor:item:purchase', { item, vendor: this.vendorInfo });
  }

  private sellItem(item: any): void {
    const sellPrice = Math.floor(item.value * (this.vendorInfo?.buybackMultiplier || 0.25));
    console.log(`Selling: ${item.name} for ${sellPrice} gold`);
    
    this.scene.events.emit('vendor:item:sell', { item, price: sellPrice });
  }

  private calculateRepairAllCost(): number {
    // Placeholder calculation
    return Math.floor(Math.random() * 100) + 50;
  }

  private repairAllItems(): void {
    const cost = this.calculateRepairAllCost();
    console.log(`Repairing all items for ${cost} gold`);
    
    this.scene.events.emit('vendor:repair:all', { cost });
  }

  private repairItem(slot: string, cost: number): void {
    console.log(`Repairing ${slot} for ${cost} gold`);
    
    this.scene.events.emit('vendor:repair:item', { slot, cost });
  }

  private sellAllJunk(): void {
    console.log('Selling all junk items');
    
    this.scene.events.emit('vendor:sell:junk');
  }

  public setVendor(vendorInfo: VendorInfo): void {
    this.vendorInfo = vendorInfo;
    
    // Reset state
    this.currentTab = 'buy';
    this.currentCategory = 'all';
    this.currentPage = 0;
    
    // Update display
    if (this.isVisible) {
      this.updateContentDisplay();
      
      // Update header
      if (this.headerContainer) {
        this.headerContainer.removeAll();
        this.createHeader();
      }
    }
  }

  public setPlayerInventory(inventory: any[]): void {
    this.playerInventory = inventory;
    
    if (this.currentTab === 'sell') {
      this.updateContentDisplay();
    }
  }

  protected onResize(width: number, height: number): void {
    // Recreate vendor UI with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.categoryButtons?.clear();
    this.itemElements.clear();
    this.create();
  }
}
