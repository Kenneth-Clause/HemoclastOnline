/**
 * Action Bar / Hotbar Component
 * Slots for abilities, consumables, and items with keybinding support
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface ActionBarSlot {
  id: string;
  icon?: string;
  cooldown?: number;
  maxCooldown?: number;
  keybind?: string;
  tooltip?: string;
  charges?: number;
  maxCharges?: number;
}

export interface ActionBarConfig extends UIComponentConfig {
  slotCount?: number;
  slotSize?: number;
  slotSpacing?: number;
  showKeybinds?: boolean;
  showCooldowns?: boolean;
}

export class ActionBar extends UIComponent {
  private slots: ActionBarSlot[] = [];
  private slotElements: Map<string, {
    background: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    keybind: Phaser.GameObjects.Text;
    cooldownOverlay: Phaser.GameObjects.Graphics;
    cooldownText: Phaser.GameObjects.Text;
    chargeText?: Phaser.GameObjects.Text;
    hitArea: Phaser.GameObjects.Rectangle;
  }> = new Map();
  
  private actionBarConfig: ActionBarConfig;
  private globalCooldownActive: boolean = false;
  private globalCooldownDuration: number = 1500; // 1.5 seconds

  constructor(scene: Phaser.Scene, config: ActionBarConfig = {}) {
    super(scene, config);
    
    this.actionBarConfig = {
      slotCount: 10,
      slotSize: 50,
      slotSpacing: 8,
      showKeybinds: true,
      showCooldowns: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    
    this.initializeSlots(); // Initialize slots data first
    this.createActionBar();  // Then create UI elements
    this.setupKeyboardInput();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createActionBar(): void {
    const { slotCount, slotSize, slotSpacing } = this.actionBarConfig;
    const totalWidth = (slotCount! * slotSize!) + ((slotCount! - 1) * slotSpacing!);
    
    // Create background panel
    this.createGothicPanel(-10 * this.uiScale, -10 * this.uiScale, 
      totalWidth + 20 * this.uiScale, slotSize! + 20 * this.uiScale);
    
    // Create slots
    for (let i = 0; i < slotCount!; i++) {
      this.createSlot(i);
    }
  }

  private initializeSlots(): void {
    const { slotCount } = this.actionBarConfig;
    const defaultKeybinds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'E'];
    
    // Clear existing slots
    this.slots = [];
    
    for (let i = 0; i < slotCount!; i++) {
      this.slots.push({
        id: `slot_${i}`,
        keybind: defaultKeybinds[i] || '',
        tooltip: `Skill Slot ${i + 1}`
      });
    }
  }

  private createSlot(index: number): void {
    const { slotSize, slotSpacing } = this.actionBarConfig;
    const x = index * (slotSize! + slotSpacing!);
    const y = 0;
    const slot = this.slots[index];

    // Enhanced slot background with gradient effect
    const background = this.scene.add.graphics();
    
    // Create gradient background
    background.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2d1b1b, 0x2d1b1b, 0.9);
    background.fillRoundedRect(x, y, slotSize!, slotSize!, 8 * this.uiScale);
    
    // Enhanced border with inner glow effect
    background.lineStyle(3 * this.uiScale, 0x8B0000, 0.8);
    background.strokeRoundedRect(x, y, slotSize!, slotSize!, 8 * this.uiScale);
    
    // Inner highlight
    background.lineStyle(1 * this.uiScale, 0xFF4444, 0.3);
    background.strokeRoundedRect(x + 2, y + 2, slotSize! - 4, slotSize! - 4, 6 * this.uiScale);
    
    this.addElement(background);

    // Enhanced slot icon with variety based on slot
    const skillIcons = ['⚔️', '🛡️', '🏹', '🔥', '⚡', '❄️', '🌟', '💊', '🗡️', '🏺'];
    const icon = this.scene.add.text(x + slotSize! / 2, y + slotSize! / 2, skillIcons[index] || '⚔️', {
      fontSize: `${28 * this.uiScale}px`,
      color: '#F5F5DC',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Add subtle glow effect to icon
    icon.setTint(0xFFFFFF);
    this.addElement(icon);

    // Keybind display
    const keybind = this.createGothicText(
      x + slotSize! - 8 * this.uiScale, 
      y + 8 * this.uiScale, 
      slot.keybind || '', 
      10, 
      '#FFD700'
    ).setOrigin(1, 0);

    // Cooldown overlay (initially hidden)
    const cooldownOverlay = this.scene.add.graphics();
    cooldownOverlay.setVisible(false);
    this.addElement(cooldownOverlay);

    // Cooldown text
    const cooldownText = this.scene.add.text(x + slotSize! / 2, y + slotSize! / 2, '', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
    this.addElement(cooldownText);

    // Charge text (for stackable items)
    const chargeText = this.scene.add.text(
      x + 8 * this.uiScale, 
      y + slotSize! - 8 * this.uiScale, 
      '', 
      {
        fontSize: `${12 * this.uiScale}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 1).setVisible(false);
    this.addElement(chargeText);

    // Interactive hit area
    const hitArea = this.scene.add.rectangle(
      x + slotSize! / 2, 
      y + slotSize! / 2, 
      slotSize!, 
      slotSize!, 
      0x000000, 
      0
    ).setInteractive();
    this.addElement(hitArea);

    // Store elements
    this.slotElements.set(slot.id, {
      background,
      icon,
      keybind,
      cooldownOverlay,
      cooldownText,
      chargeText,
      hitArea
    });

    this.setupSlotInteractivity(slot.id, index);
  }

  private setupSlotInteractivity(slotId: string, index: number): void {
    const elements = this.slotElements.get(slotId);
    if (!elements) return;

    const { background, hitArea } = elements;
    const { slotSize } = this.actionBarConfig;
    const x = index * (slotSize! + this.actionBarConfig.slotSpacing!);
    const y = 0;

    // Hover effects
    hitArea.on('pointerover', () => {
      background.clear();
      background.fillStyle(0x4a0000, 0.9);
      background.fillRoundedRect(x, y, slotSize!, slotSize!, 8 * this.uiScale);
      background.lineStyle(2 * this.uiScale, 0xDC143C);
      background.strokeRoundedRect(x, y, slotSize!, slotSize!, 8 * this.uiScale);
      
      // Show tooltip
      this.showTooltip(slotId, x + slotSize! / 2, y);
    });

    hitArea.on('pointerout', () => {
      background.clear();
      background.fillStyle(0x2d1b1b, 0.8);
      background.fillRoundedRect(x, y, slotSize!, slotSize!, 8 * this.uiScale);
      background.lineStyle(2 * this.uiScale, 0x8B0000);
      background.strokeRoundedRect(x, y, slotSize!, slotSize!, 8 * this.uiScale);
      
      this.hideTooltip();
    });

    hitArea.on('pointerdown', () => {
      this.activateSlot(slotId);
    });
  }

  private setupKeyboardInput(): void {
    if (!this.scene.input.keyboard) return;

    // Set up keybind listeners
    this.slots.forEach((slot, index) => {
      if (slot.keybind) {
        const keyObj = this.scene.input.keyboard?.addKey(slot.keybind);
        keyObj?.on('down', () => {
          this.activateSlot(slot.id);
        });
      }
    });
  }

  public activateSlot(slotId: string): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || this.isSlotOnCooldown(slotId) || this.globalCooldownActive) return;

    console.log(`Activating slot: ${slotId}`);
    
    // Trigger global cooldown
    this.triggerGlobalCooldown();
    
    // Start slot-specific cooldown if applicable
    if (slot.cooldown && slot.maxCooldown) {
      this.startSlotCooldown(slotId, slot.maxCooldown);
    }

    // Handle charges
    if (slot.charges !== undefined && slot.charges > 0) {
      slot.charges--;
      this.updateSlotCharges(slotId);
    }

    // Emit activation event
    this.scene.events.emit('actionbar:slot:activated', { slotId, slot });
  }

  private triggerGlobalCooldown(): void {
    this.globalCooldownActive = true;
    
    // Visual indicator for global cooldown
    this.slotElements.forEach((elements) => {
      elements.background.setAlpha(0.5);
    });

    this.scene.time.delayedCall(this.globalCooldownDuration, () => {
      this.globalCooldownActive = false;
      this.slotElements.forEach((elements) => {
        elements.background.setAlpha(1);
      });
    });
  }

  private startSlotCooldown(slotId: string, duration: number): void {
    const slot = this.slots.find(s => s.id === slotId);
    const elements = this.slotElements.get(slotId);
    if (!slot || !elements) return;

    slot.cooldown = duration;
    const { cooldownOverlay, cooldownText } = elements;
    const slotIndex = this.slots.findIndex(s => s.id === slotId);
    const { slotSize, slotSpacing } = this.actionBarConfig;
    const x = slotIndex * (slotSize! + slotSpacing!);
    const y = 0;

    cooldownOverlay.setVisible(true);
    cooldownText.setVisible(true);

    const updateCooldown = () => {
      if (slot.cooldown! <= 0) {
        cooldownOverlay.setVisible(false);
        cooldownText.setVisible(false);
        slot.cooldown = undefined;
        return;
      }

      // Draw cooldown sweep
      const progress = 1 - (slot.cooldown! / duration);
      const angle = progress * Math.PI * 2 - Math.PI / 2;
      
      cooldownOverlay.clear();
      cooldownOverlay.fillStyle(0x000000, 0.7);
      cooldownOverlay.slice(
        x + slotSize! / 2, 
        y + slotSize! / 2, 
        slotSize! / 2 - 2, 
        -Math.PI / 2, 
        angle, 
        false
      );
      cooldownOverlay.fillPath();

      cooldownText.setText(Math.ceil(slot.cooldown! / 1000).toString());
      
      slot.cooldown! -= 100;
      this.scene.time.delayedCall(100, updateCooldown);
    };

    updateCooldown();
  }

  private updateSlotCharges(slotId: string): void {
    const slot = this.slots.find(s => s.id === slotId);
    const elements = this.slotElements.get(slotId);
    if (!slot || !elements) return;

    const { chargeText } = elements;
    if (slot.charges !== undefined && slot.maxCharges !== undefined) {
      chargeText!.setText(slot.charges.toString()).setVisible(slot.charges > 0);
    }
  }

  private isSlotOnCooldown(slotId: string): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    return slot?.cooldown !== undefined && slot.cooldown > 0;
  }

  private showTooltip(slotId: string, x: number, y: number): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot?.tooltip) return;

    // Simple tooltip implementation
    const tooltip = this.createGothicText(x, y - 30, slot.tooltip, 12, '#FFFFFF');
    tooltip.setOrigin(0.5, 1);
    tooltip.setName('tooltip');
  }

  private hideTooltip(): void {
    const tooltip = this.container.getByName('tooltip');
    if (tooltip) {
      tooltip.destroy();
    }
  }

  public setSlot(index: number, slot: Partial<ActionBarSlot>): void {
    if (index < 0 || index >= this.slots.length) return;
    
    Object.assign(this.slots[index], slot);
    this.updateSlotDisplay(index);
  }

  private updateSlotDisplay(index: number): void {
    const slot = this.slots[index];
    const elements = this.slotElements.get(slot.id);
    if (!elements) return;

    // Update icon
    if (slot.icon) {
      elements.icon.setText(slot.icon);
    }

    // Update charges
    if (slot.charges !== undefined) {
      this.updateSlotCharges(slot.id);
    }
  }

  protected onResize(width: number, height: number): void {
    // Recalculate positions based on new screen size
    this.destroy();
    this.create();
  }
}
