/**
 * Inventory Component
 * Grid-based item management with drag & drop support
 * Supports stackable items, sorting, and filtering
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'misc';
  stackSize: number;
  maxStackSize: number;
  description: string;
  value: number;
  level?: number;
  stats?: { [key: string]: number };
  slot?: string; // Equipment slot if applicable
}

export interface InventorySlot {
  index: number;
  item: InventoryItem | null;
  locked: boolean;
}

export interface InventoryConfig extends UIComponentConfig {
  rows?: number;
  columns?: number;
  slotSize?: number;
  allowDragDrop?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
}

export class Inventory extends UIComponent {
  private inventoryConfig: InventoryConfig;
  private slots: InventorySlot[] = [];
  private filteredSlots: InventorySlot[] = [];
  private currentFilter: string = 'all';
  private searchTerm: string = '';
  
  // UI Elements
  private inventoryPanel?: Phaser.GameObjects.Graphics;
  private slotElements: Map<number, {
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    stackText: Phaser.GameObjects.Text;
    rarityBorder: Phaser.GameObjects.Graphics;
    hitArea: Phaser.GameObjects.Rectangle;
  }> = new Map();
  
  private filterButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private searchInput?: Phaser.GameObjects.Text;
  private titleText?: Phaser.GameObjects.Text;
  
  // Drag & Drop
  private draggedItem: InventoryItem | null = null;
  private draggedFromSlot: number = -1;
  private dragPreview?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: InventoryConfig = {}) {
    super(scene, config);
    
    this.inventoryConfig = {
      rows: 6,
      columns: 8,
      slotSize: 45,
      allowDragDrop: true,
      showFilters: true,
      showSearch: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.initializeSlots();
    this.createInventory();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createInventory(): void {
    const { rows, columns, slotSize } = this.inventoryConfig;
    const panelWidth = (columns! * slotSize!) + (columns! * 4) + 40; // 4px spacing + padding
    const panelHeight = (rows! * slotSize!) + (rows! * 4) + 120; // Extra space for filters and title
    
    // Main inventory panel
    this.inventoryPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Title
    this.createTitle();
    
    // Filter buttons
    if (this.inventoryConfig.showFilters) {
      this.createFilterButtons();
    }
    
    // Search box
    if (this.inventoryConfig.showSearch) {
      this.createSearchBox();
    }
    
    // Inventory grid
    this.createInventoryGrid();
    
    // Initialize with filtered view
    this.updateFilteredView();
  }

  private initializeSlots(): void {
    const totalSlots = this.inventoryConfig.rows! * this.inventoryConfig.columns!;
    
    for (let i = 0; i < totalSlots; i++) {
      this.slots.push({
        index: i,
        item: null,
        locked: false
      });
    }
  }

  private createTitle(): void {
    this.titleText = this.createGothicText(
      (this.inventoryConfig.columns! * this.inventoryConfig.slotSize!) / 2 + 20,
      15,
      'Inventory',
      18,
      '#DC143C'
    );
    this.titleText.setOrigin(0.5, 0);
  }

  private createFilterButtons(): void {
    const filters = [
      { key: 'all', name: 'All', icon: '📦' },
      { key: 'weapon', name: 'Weapons', icon: '⚔️' },
      { key: 'armor', name: 'Armor', icon: '🛡️' },
      { key: 'consumable', name: 'Consumables', icon: '🍷' },
      { key: 'material', name: 'Materials', icon: '🔩' },
      { key: 'quest', name: 'Quest', icon: '📜' }
    ];
    
    const buttonWidth = 60;
    const buttonHeight = 25;
    const startX = 20;
    const startY = 45;
    
    filters.forEach((filter, index) => {
      const x = startX + (index * (buttonWidth + 5));
      const y = startY;
      
      const container = this.scene.add.container(x, y);
      this.addElement(container);
      
      // Button background
      const background = this.scene.add.graphics();
      const isActive = filter.key === this.currentFilter;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
      background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
      container.add(background);
      
      // Filter icon and text
      const icon = this.scene.add.text(8, buttonHeight / 2, filter.icon, {
        fontSize: '12px',
        color: '#F5F5DC'
      }).setOrigin(0, 0.5);
      container.add(icon);
      
      const text = this.scene.add.text(25, buttonHeight / 2, filter.name, {
        fontSize: '10px',
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0, 0.5);
      container.add(text);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(buttonWidth / 2, buttonHeight / 2, buttonWidth, buttonHeight, 0x000000, 0)
        .setInteractive();
      container.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.setFilter(filter.key);
      });
      
      this.filterButtons.set(filter.key, container);
    });
  }

  private createSearchBox(): void {
    const searchY = this.inventoryConfig.showFilters ? 80 : 45;
    
    // Search background
    const searchBg = this.scene.add.graphics();
    searchBg.fillStyle(0x000000, 0.8);
    searchBg.fillRoundedRect(20, searchY, 200, 25, 4);
    searchBg.lineStyle(1, 0x666666);
    searchBg.strokeRoundedRect(20, searchY, 200, 25, 4);
    this.addElement(searchBg);
    
    // Search placeholder text
    this.searchInput = this.scene.add.text(25, searchY + 12, 'Search items...', {
      fontSize: '12px',
      color: '#999999',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0, 0.5);
    this.addElement(this.searchInput);
    
    // TODO: Implement actual text input when Phaser supports it better
    // For now, this is a visual placeholder
  }

  private createInventoryGrid(): void {
    const { rows, columns, slotSize } = this.inventoryConfig;
    const startY = this.inventoryConfig.showSearch ? 115 : (this.inventoryConfig.showFilters ? 80 : 45);
    
    for (let row = 0; row < rows!; row++) {
      for (let col = 0; col < columns!; col++) {
        const slotIndex = row * columns! + col;
        const x = 20 + col * (slotSize! + 4);
        const y = startY + row * (slotSize! + 4);
        
        this.createInventorySlot(slotIndex, x, y);
      }
    }
  }

  private createInventorySlot(index: number, x: number, y: number): void {
    const { slotSize } = this.inventoryConfig;
    const slot = this.slots[index];
    
    // Slot background
    const background = this.scene.add.graphics();
    background.fillStyle(0x2d1b1b, 0.8);
    background.fillRoundedRect(x, y, slotSize!, slotSize!, 6);
    background.lineStyle(2, 0x666666);
    background.strokeRoundedRect(x, y, slotSize!, slotSize!, 6);
    this.addElement(background);
    
    // Item icon (empty initially)
    const icon = this.scene.add.text(x + slotSize! / 2, y + slotSize! / 2, '', {
      fontSize: `${slotSize! * 0.6}px`,
      color: '#F5F5DC'
    }).setOrigin(0.5);
    this.addElement(icon);
    
    // Stack size text
    const stackText = this.scene.add.text(x + slotSize! - 4, y + slotSize! - 4, '', {
      fontSize: '10px',
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: 'bold'
    }).setOrigin(1, 1);
    this.addElement(stackText);
    
    // Rarity border (initially hidden)
    const rarityBorder = this.scene.add.graphics();
    rarityBorder.setVisible(false);
    this.addElement(rarityBorder);
    
    // Interactive hit area
    const hitArea = this.scene.add.rectangle(x + slotSize! / 2, y + slotSize! / 2, slotSize!, slotSize!, 0x000000, 0)
      .setInteractive();
    this.addElement(hitArea);
    
    // Store elements
    this.slotElements.set(index, {
      background,
      icon,
      stackText,
      rarityBorder,
      hitArea
    });
    
    this.setupSlotInteractivity(index);
  }

  private setupSlotInteractivity(slotIndex: number): void {
    const elements = this.slotElements.get(slotIndex);
    if (!elements) return;
    
    const { hitArea, background } = elements;
    const { slotSize } = this.inventoryConfig;
    const slot = this.slots[slotIndex];
    
    // Get slot position
    const col = slotIndex % this.inventoryConfig.columns!;
    const row = Math.floor(slotIndex / this.inventoryConfig.columns!);
    const startY = this.inventoryConfig.showSearch ? 115 : (this.inventoryConfig.showFilters ? 80 : 45);
    const x = 20 + col * (slotSize! + 4);
    const y = startY + row * (slotSize! + 4);
    
    // Hover effects
    hitArea.on('pointerover', () => {
      if (!slot.item) return;
      
      background.clear();
      background.fillStyle(0x4a0000, 0.9);
      background.fillRoundedRect(x, y, slotSize!, slotSize!, 6);
      background.lineStyle(2, 0xDC143C);
      background.strokeRoundedRect(x, y, slotSize!, slotSize!, 6);
      
      this.showItemTooltip(slot.item, x + slotSize! / 2, y);
    });
    
    hitArea.on('pointerout', () => {
      background.clear();
      background.fillStyle(0x2d1b1b, 0.8);
      background.fillRoundedRect(x, y, slotSize!, slotSize!, 6);
      background.lineStyle(2, this.getRarityColor(slot.item?.rarity));
      background.strokeRoundedRect(x, y, slotSize!, slotSize!, 6);
      
      this.hideItemTooltip();
    });
    
    // Click handling
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleRightClick(slotIndex);
      } else {
        this.handleLeftClick(slotIndex);
      }
    });
    
    // Drag handling
    if (this.inventoryConfig.allowDragDrop) {
      hitArea.on('dragstart', () => {
        if (slot.item) {
          this.startDrag(slotIndex);
        }
      });
      
      hitArea.on('drag', (pointer: Phaser.Input.Pointer) => {
        this.updateDragPreview(pointer.x, pointer.y);
      });
      
      hitArea.on('dragend', () => {
        this.endDrag();
      });
      
      hitArea.on('drop', () => {
        this.handleDrop(slotIndex);
      });
    }
  }

  private handleLeftClick(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot.item) return;
    
    console.log(`Left clicked item: ${slot.item.name}`);
    this.scene.events.emit('inventory:item:selected', { slot: slotIndex, item: slot.item });
  }

  private handleRightClick(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot.item) return;
    
    console.log(`Right clicked item: ${slot.item.name}`);
    
    // Handle consumables
    if (slot.item.type === 'consumable') {
      this.useItem(slotIndex);
    } else {
      // Show context menu for other items
      this.showContextMenu(slotIndex);
    }
  }

  private useItem(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot.item || slot.item.type !== 'consumable') return;
    
    console.log(`Using item: ${slot.item.name}`);
    
    // Decrease stack size
    slot.item.stackSize--;
    
    if (slot.item.stackSize <= 0) {
      // Remove item completely
      slot.item = null;
    }
    
    this.updateSlotDisplay(slotIndex);
    this.scene.events.emit('inventory:item:used', { slotIndex, item: slot.item });
  }

  private showContextMenu(slotIndex: number): void {
    // TODO: Implement context menu
    console.log(`Context menu for slot ${slotIndex}`);
  }

  private startDrag(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot.item) return;
    
    this.draggedItem = slot.item;
    this.draggedFromSlot = slotIndex;
    
    // Create drag preview
    this.dragPreview = this.scene.add.container(0, 0);
    const previewIcon = this.scene.add.text(0, 0, slot.item.icon, {
      fontSize: '32px',
      color: '#F5F5DC'
    }).setOrigin(0.5);
    this.dragPreview.add(previewIcon);
    this.dragPreview.setAlpha(0.8);
  }

  private updateDragPreview(x: number, y: number): void {
    if (this.dragPreview) {
      this.dragPreview.setPosition(x, y);
    }
  }

  private endDrag(): void {
    if (this.dragPreview) {
      this.dragPreview.destroy();
      this.dragPreview = undefined;
    }
    
    this.draggedItem = null;
    this.draggedFromSlot = -1;
  }

  private handleDrop(targetSlotIndex: number): void {
    if (!this.draggedItem || this.draggedFromSlot === -1) return;
    
    const sourceSlot = this.slots[this.draggedFromSlot];
    const targetSlot = this.slots[targetSlotIndex];
    
    if (targetSlot.locked) return;
    
    // Handle item swapping or stacking
    if (!targetSlot.item) {
      // Move item to empty slot
      targetSlot.item = sourceSlot.item;
      sourceSlot.item = null;
    } else if (targetSlot.item.id === this.draggedItem.id && 
               targetSlot.item.stackSize < targetSlot.item.maxStackSize) {
      // Stack items
      const transferAmount = Math.min(
        sourceSlot.item!.stackSize,
        targetSlot.item.maxStackSize - targetSlot.item.stackSize
      );
      
      targetSlot.item.stackSize += transferAmount;
      sourceSlot.item!.stackSize -= transferAmount;
      
      if (sourceSlot.item!.stackSize <= 0) {
        sourceSlot.item = null;
      }
    } else {
      // Swap items
      const tempItem = targetSlot.item;
      targetSlot.item = sourceSlot.item;
      sourceSlot.item = tempItem;
    }
    
    this.updateSlotDisplay(this.draggedFromSlot);
    this.updateSlotDisplay(targetSlotIndex);
    
    this.scene.events.emit('inventory:items:moved', {
      from: this.draggedFromSlot,
      to: targetSlotIndex
    });
  }

  private updateSlotDisplay(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    const elements = this.slotElements.get(slotIndex);
    if (!elements) return;
    
    const { icon, stackText, rarityBorder, background } = elements;
    const { slotSize } = this.inventoryConfig;
    
    // Get slot position for border updates
    const col = slotIndex % this.inventoryConfig.columns!;
    const row = Math.floor(slotIndex / this.inventoryConfig.columns!);
    const startY = this.inventoryConfig.showSearch ? 115 : (this.inventoryConfig.showFilters ? 80 : 45);
    const x = 20 + col * (slotSize! + 4);
    const y = startY + row * (slotSize! + 4);
    
    if (slot.item) {
      // Show item
      icon.setText(slot.item.icon).setVisible(true);
      
      // Show stack size if > 1
      if (slot.item.stackSize > 1) {
        stackText.setText(slot.item.stackSize.toString()).setVisible(true);
      } else {
        stackText.setVisible(false);
      }
      
      // Update rarity border
      const rarityColor = this.getRarityColor(slot.item.rarity);
      background.clear();
      background.fillStyle(0x2d1b1b, 0.8);
      background.fillRoundedRect(x, y, slotSize!, slotSize!, 6);
      background.lineStyle(2, rarityColor);
      background.strokeRoundedRect(x, y, slotSize!, slotSize!, 6);
    } else {
      // Empty slot
      icon.setVisible(false);
      stackText.setVisible(false);
      
      background.clear();
      background.fillStyle(0x2d1b1b, 0.8);
      background.fillRoundedRect(x, y, slotSize!, slotSize!, 6);
      background.lineStyle(2, 0x666666);
      background.strokeRoundedRect(x, y, slotSize!, slotSize!, 6);
    }
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

  private showItemTooltip(item: InventoryItem, x: number, y: number): void {
    // Create tooltip content
    let tooltipText = `${item.name}\n`;
    tooltipText += `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} ${item.type}\n`;
    if (item.level) tooltipText += `Level ${item.level}\n`;
    tooltipText += `\n${item.description}\n`;
    if (item.value > 0) tooltipText += `\nValue: ${item.value} gold`;
    
    const tooltip = this.createGothicText(x, y - 10, tooltipText, 10, '#FFFFFF');
    tooltip.setOrigin(0.5, 1).setName('itemTooltip');
    tooltip.setBackgroundColor('#000000');
    tooltip.setPadding(8);
  }

  private hideItemTooltip(): void {
    const tooltip = this.container.getByName('itemTooltip');
    if (tooltip) {
      tooltip.destroy();
    }
  }

  public setFilter(filter: string): void {
    this.currentFilter = filter;
    this.updateFilterButtons();
    this.updateFilteredView();
  }

  private updateFilterButtons(): void {
    this.filterButtons.forEach((container, filterKey) => {
      const background = container.list[0] as Phaser.GameObjects.Graphics;
      const isActive = filterKey === this.currentFilter;
      
      background.clear();
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, 60, 25, 4);
      background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, 60, 25, 4);
    });
  }

  private updateFilteredView(): void {
    // Filter slots based on current filter and search term
    this.filteredSlots = this.slots.filter(slot => {
      if (!slot.item) return true; // Always show empty slots
      
      // Apply type filter
      if (this.currentFilter !== 'all' && slot.item.type !== this.currentFilter) {
        return false;
      }
      
      // Apply search filter
      if (this.searchTerm && !slot.item.name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Update display
    this.slots.forEach((slot, index) => {
      const elements = this.slotElements.get(index);
      if (elements) {
        const isVisible = this.filteredSlots.includes(slot);
        elements.background.setVisible(isVisible);
        elements.icon.setVisible(isVisible && !!slot.item);
        elements.stackText.setVisible(isVisible && !!slot.item && slot.item.stackSize > 1);
        elements.hitArea.setVisible(isVisible);
      }
    });
  }

  public addItem(item: InventoryItem): boolean {
    // Try to stack with existing items first
    for (const slot of this.slots) {
      if (slot.item && slot.item.id === item.id && 
          slot.item.stackSize < slot.item.maxStackSize) {
        const spaceAvailable = slot.item.maxStackSize - slot.item.stackSize;
        const amountToAdd = Math.min(spaceAvailable, item.stackSize);
        
        slot.item.stackSize += amountToAdd;
        item.stackSize -= amountToAdd;
        
        this.updateSlotDisplay(slot.index);
        
        if (item.stackSize <= 0) {
          return true; // Item fully added
        }
      }
    }
    
    // Find empty slot
    const emptySlot = this.slots.find(slot => !slot.item && !slot.locked);
    if (emptySlot) {
      emptySlot.item = { ...item };
      this.updateSlotDisplay(emptySlot.index);
      return true;
    }
    
    return false; // No space available
  }

  public removeItem(itemId: string, amount: number = 1): number {
    let removedAmount = 0;
    
    for (const slot of this.slots) {
      if (slot.item && slot.item.id === itemId && removedAmount < amount) {
        const toRemove = Math.min(slot.item.stackSize, amount - removedAmount);
        slot.item.stackSize -= toRemove;
        removedAmount += toRemove;
        
        if (slot.item.stackSize <= 0) {
          slot.item = null;
        }
        
        this.updateSlotDisplay(slot.index);
      }
    }
    
    return removedAmount;
  }

  public getItems(): InventoryItem[] {
    return this.slots
      .filter(slot => slot.item)
      .map(slot => slot.item!);
  }

  public sortInventory(): void {
    // Collect all items
    const items: InventoryItem[] = [];
    this.slots.forEach(slot => {
      if (slot.item) {
        items.push(slot.item);
        slot.item = null;
      }
    });
    
    // Sort by rarity, then by type, then by name
    const rarityOrder = { 'legendary': 0, 'epic': 1, 'rare': 2, 'uncommon': 3, 'common': 4 };
    items.sort((a, b) => {
      const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      
      const typeDiff = a.type.localeCompare(b.type);
      if (typeDiff !== 0) return typeDiff;
      
      return a.name.localeCompare(b.name);
    });
    
    // Place items back in slots
    let slotIndex = 0;
    for (const item of items) {
      while (slotIndex < this.slots.length && this.slots[slotIndex].locked) {
        slotIndex++;
      }
      
      if (slotIndex < this.slots.length) {
        this.slots[slotIndex].item = item;
        this.updateSlotDisplay(slotIndex);
        slotIndex++;
      }
    }
    
    console.log('Inventory sorted');
  }

  protected onResize(width: number, height: number): void {
    // Recreate the inventory with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.slotElements.clear();
    this.filterButtons.clear();
    this.create();
  }
}
