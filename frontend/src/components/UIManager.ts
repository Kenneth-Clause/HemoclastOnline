/**
 * UI Manager - Coordinates all UI components and handles layout
 * Integrates with the game's UI system and manages component lifecycle
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';
import { ActionBar } from './ActionBar';
import { PlayerFrame } from './PlayerFrame';
import { TargetFrame } from './TargetFrame';
import { PartyFrames } from './PartyFrames';
import { Inventory } from './Inventory';
import { CharacterSheet } from './CharacterSheet';
import { QuestTracker } from './QuestTracker';
import { ChatSystem } from './ChatSystem';
import { GuildPanel } from './GuildPanel';
import { FriendsList } from './FriendsList';
import { LootWindow } from './LootWindow';
import { CurrencyTracker } from './CurrencyTracker';
import { VendorUI } from './VendorUI';
import { DungeonUI } from './DungeonUI';
import { CombatUI } from './CombatUI';
import { AchievementPanel } from './AchievementPanel';
import { DailyTasks } from './DailyTasks';

export interface UIManagerConfig {
  enableActionBar?: boolean;
  enablePlayerFrame?: boolean;
  enableTargetFrame?: boolean;
  enablePartyFrames?: boolean;
  enableInventory?: boolean;
  enableCharacterSheet?: boolean;
  enableQuestTracker?: boolean;
  enableChatSystem?: boolean;
  enableGuildPanel?: boolean;
  enableFriendsList?: boolean;
  enableLootWindow?: boolean;
  enableCurrencyTracker?: boolean;
  enableVendorUI?: boolean;
  enableDungeonUI?: boolean;
  enableCombatUI?: boolean;
  enableAchievementPanel?: boolean;
  enableDailyTasks?: boolean;
  compactMode?: boolean;
}

export class UIManager {
  private scene: Scene;
  private gameStore: GameStore;
  private config: UIManagerConfig;
  
  // UI Components
  private actionBar?: ActionBar;
  private playerFrame?: PlayerFrame;
  private targetFrame?: TargetFrame;
  private partyFrames?: PartyFrames;
  private inventory?: Inventory;
  private characterSheet?: CharacterSheet;
  private questTracker?: QuestTracker;
  private chatSystem?: ChatSystem;
  private guildPanel?: GuildPanel;
  private friendsList?: FriendsList;
  private lootWindow?: LootWindow;
  private currencyTracker?: CurrencyTracker;
  private vendorUI?: VendorUI;
  private dungeonUI?: DungeonUI;
  private combatUI?: CombatUI;
  private achievementPanel?: AchievementPanel;
  private dailyTasks?: DailyTasks;
  
  // Layout management
  private isInitialized: boolean = false;
  private currentLayout: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  
  // Event handlers
  private resizeHandler?: () => void;
  private keyboardHandlers: Map<string, () => void> = new Map();

  constructor(scene: Scene, config: UIManagerConfig = {}) {
    this.scene = scene;
    this.gameStore = GameStore.getInstance();
    this.config = {
      enableActionBar: true,
      enablePlayerFrame: true,
      enableTargetFrame: true,
      enablePartyFrames: true,
      enableInventory: true,
      enableCharacterSheet: true,
      enableQuestTracker: true,
      enableChatSystem: true,
      enableGuildPanel: true,
      enableFriendsList: true,
      enableLootWindow: true,
      enableCurrencyTracker: true,
      enableVendorUI: true,
      enableDungeonUI: true,
      enableCombatUI: true,
      enableAchievementPanel: true,
      enableDailyTasks: true,
      compactMode: false,
      ...config
    };
    
    this.setupEventHandlers();
  }

  public initialize(): void {
    if (this.isInitialized) return;
    
    this.determineLayout();
    this.createUIComponents();
    this.positionComponents();
    this.setupKeyboardShortcuts();
    this.setupGameEventListeners();
    
    this.isInitialized = true;
    
    console.log('UI Manager initialized with layout:', this.currentLayout);
  }

  private determineLayout(): void {
    const { width, height } = this.scene.scale;
    
    if (width < 768) {
      this.currentLayout = 'mobile';
    } else if (width < 1200) {
      this.currentLayout = 'tablet';
    } else {
      this.currentLayout = 'desktop';
    }
  }

  private createUIComponents(): void {
    const { width, height } = this.scene.scale;
    const compactMode = this.config.compactMode || this.currentLayout !== 'desktop';
    
    // Action Bar
    if (this.config.enableActionBar) {
      const actionBarLayout = ResponsiveLayout.getResponsiveLayout('ACTION_BAR', width, height);
      this.actionBar = new ActionBar(this.scene, {
        x: actionBarLayout.x,
        y: actionBarLayout.y,
        slotCount: this.currentLayout === 'mobile' ? 6 : 10,
        slotSize: actionBarLayout.slotSize,
        slotSpacing: actionBarLayout.slotSpacing,
        compactMode
      });
    }
    
    // Player Frame
    if (this.config.enablePlayerFrame) {
      const playerFrameLayout = ResponsiveLayout.getResponsiveLayout('PLAYER_FRAME', width, height);
      this.playerFrame = new PlayerFrame(this.scene, {
        x: playerFrameLayout.x,
        y: playerFrameLayout.y,
        compactMode,
        showClassResource: true,
        showBuffs: true
      });
    }
    
    // Target Frame
    if (this.config.enableTargetFrame) {
      const targetFrameLayout = ResponsiveLayout.getResponsiveLayout('TARGET_FRAME', width, height);
      this.targetFrame = new TargetFrame(this.scene, {
        x: targetFrameLayout.x,
        y: targetFrameLayout.y,
        compactMode,
        showThreat: true,
        showCastBar: true
      });
    }
    
    // Party Frames
    if (this.config.enablePartyFrames) {
      const partyFramesLayout = ResponsiveLayout.getResponsiveLayout('PARTY_FRAMES', width, height);
      this.partyFrames = new PartyFrames(this.scene, {
        x: partyFramesLayout.x,
        y: partyFramesLayout.y,
        maxMembers: 5,
        compactMode,
        showBuffs: !compactMode,
        verticalLayout: true
      });
    }
    
    // Inventory
    if (this.config.enableInventory) {
      this.inventory = new Inventory(this.scene, {
        x: width / 2 - 200,
        y: height / 2 - 200,
        rows: compactMode ? 5 : 6,
        columns: compactMode ? 6 : 8,
        slotSize: compactMode ? 40 : 45,
        compactMode
      });
    }
    
    // Character Sheet
    if (this.config.enableCharacterSheet) {
      this.characterSheet = new CharacterSheet(this.scene, {
        x: width / 2 - 300,
        y: height / 2 - 250,
        compactMode
      });
    }
    
    // Quest Tracker
    if (this.config.enableQuestTracker) {
      this.questTracker = new QuestTracker(this.scene, {
        x: width - 370, // Right side of screen
        y: 20, // Top of screen
        compactMode,
        maxTrackedQuests: compactMode ? 3 : 5
      });
    }
    
    // Chat System
    if (this.config.enableChatSystem) {
      this.chatSystem = new ChatSystem(this.scene, {
        x: 20, // Bottom left
        y: height - 300, // Bottom of screen
        compactMode,
        maxMessages: 100
      });
    }
    
    // Guild Panel
    if (this.config.enableGuildPanel) {
      this.guildPanel = new GuildPanel(this.scene, {
        x: width / 2 - 325, // Center of screen
        y: height / 2 - 275,
        compactMode
      });
    }
    
    // Friends List
    if (this.config.enableFriendsList) {
      this.friendsList = new FriendsList(this.scene, {
        x: width - 370, // Right side of screen
        y: height / 2 - 225, // Center-right
        compactMode,
        maxFriends: 50
      });
    }
    
    // Loot Window
    if (this.config.enableLootWindow) {
      this.lootWindow = new LootWindow(this.scene, {
        x: width / 2 - 250, // Center of screen
        y: height / 2 - 150,
        compactMode
      });
    }
    
    // Currency Tracker
    if (this.config.enableCurrencyTracker) {
      this.currencyTracker = new CurrencyTracker(this.scene, {
        x: width - 300, // Top right
        y: 20,
        compactMode,
        maxDisplayed: compactMode ? 5 : 8
      });
    }
    
    // Vendor UI
    if (this.config.enableVendorUI) {
      this.vendorUI = new VendorUI(this.scene, {
        x: width / 2 - 375, // Center of screen
        y: height / 2 - 275,
        compactMode
      });
    }
    
    // Dungeon UI
    if (this.config.enableDungeonUI) {
      this.dungeonUI = new DungeonUI(this.scene, {
        x: 0, // Full screen overlay
        y: 0,
        compactMode
      });
    }
    
    // Combat UI
    if (this.config.enableCombatUI) {
      this.combatUI = new CombatUI(this.scene, {
        x: 0, // Full screen overlay for floating text
        y: 0,
        compactMode,
        showFloatingText: true,
        showCombatStats: true
      });
    }
    
    // Achievement Panel
    if (this.config.enableAchievementPanel) {
      this.achievementPanel = new AchievementPanel(this.scene, {
        x: width / 2 - 450, // Center of screen
        y: height / 2 - 325,
        compactMode
      });
    }
    
    // Daily Tasks
    if (this.config.enableDailyTasks) {
      this.dailyTasks = new DailyTasks(this.scene, {
        x: width - 370, // Right side of screen
        y: height / 2 + 50, // Below quest tracker
        compactMode
      });
    }
  }

  private positionComponents(): void {
    // Components are positioned during creation based on responsive layout
    // This method handles any additional positioning logic
    
    if (this.currentLayout === 'mobile') {
      this.setupMobileLayout();
    } else if (this.currentLayout === 'tablet') {
      this.setupTabletLayout();
    } else {
      this.setupDesktopLayout();
    }
  }

  private setupMobileLayout(): void {
    // Mobile-specific positioning adjustments
    if (this.actionBar) {
      // Move action bar to bottom center
      const { width, height } = this.scene.scale;
      this.actionBar.setPosition(width / 2 - 150, height - 80);
    }
    
    if (this.playerFrame) {
      // Position player frame at top-left
      this.playerFrame.setPosition(10, 10);
    }
    
    if (this.targetFrame) {
      // Position target frame at top-center
      const { width } = this.scene.scale;
      this.targetFrame.setPosition(width / 2 - 110, 10);
    }
    
    if (this.partyFrames) {
      // Position party frames on the left side
      this.partyFrames.setPosition(10, 120);
    }
  }

  private setupTabletLayout(): void {
    // Tablet-specific positioning
    if (this.actionBar) {
      const { width, height } = this.scene.scale;
      this.actionBar.setPosition(width / 2 - 200, height - 90);
    }
    
    if (this.playerFrame) {
      this.playerFrame.setPosition(20, 20);
    }
    
    if (this.targetFrame) {
      const { width } = this.scene.scale;
      this.targetFrame.setPosition(width - 320, 20);
    }
    
    if (this.partyFrames) {
      this.partyFrames.setPosition(20, 150);
    }
  }

  private setupDesktopLayout(): void {
    // Desktop layout - components use their default responsive positions
    // No additional adjustments needed as they're positioned optimally during creation
  }

  private setupEventHandlers(): void {
    // Resize handler
    this.resizeHandler = () => {
      this.handleResize();
    };
    
    this.scene.scale.on('resize', this.resizeHandler);
  }

  private setupKeyboardShortcuts(): void {
    if (!this.scene.input.keyboard) return;
    
    // Toggle UI components
    this.addKeyboardShortcut('F1', () => this.togglePlayerFrame());
    this.addKeyboardShortcut('F2', () => this.toggleTargetFrame());
    this.addKeyboardShortcut('F3', () => this.togglePartyFrames());
    this.addKeyboardShortcut('F12', () => this.toggleAllUI());
    
    // Main UI windows (based on KEYBINDS_DESIGN.md)
    this.addKeyboardShortcut('I', () => this.toggleInventory());
    this.addKeyboardShortcut('C', () => this.toggleCharacterSheet());
    this.addKeyboardShortcut('J', () => this.toggleQuestTracker());
    this.addKeyboardShortcut('B', () => this.toggleInventory()); // Alternative for bags
    
    // Social UI (based on KEYBINDS_DESIGN.md)
    this.addKeyboardShortcut('ENTER', () => this.toggleChatInput());
    this.addKeyboardShortcut('G', () => this.toggleGuildPanel());
    this.addKeyboardShortcut('O', () => this.toggleFriendsList());
    
    // Economy UI (based on KEYBINDS_DESIGN.md)
    this.addKeyboardShortcut('V', () => this.toggleVendorUI()); // Vendor when near NPC
    
    // Achievement and progression UI
    this.addKeyboardShortcut('Y', () => this.toggleAchievementPanel()); // Achievement panel
    this.addKeyboardShortcut('L', () => this.toggleDailyTasks()); // Daily tasks
    
    // UI scaling
    this.addKeyboardShortcut('CTRL+PLUS', () => this.adjustUIScale(0.1));
    this.addKeyboardShortcut('CTRL+MINUS', () => this.adjustUIScale(-0.1));
    this.addKeyboardShortcut('CTRL+ZERO', () => this.resetUIScale());
  }

  private addKeyboardShortcut(key: string, callback: () => void): void {
    const keyObj = this.scene.input.keyboard?.addKey(key);
    if (keyObj) {
      keyObj.on('down', callback);
      this.keyboardHandlers.set(key, callback);
    }
  }

  private setupGameEventListeners(): void {
    // Listen for game state changes
    this.gameStore.subscribe((state) => {
      this.updateUIFromGameState(state);
    });
    
    // Listen for component-specific events
    this.scene.events.on('actionbar:slot:activated', this.handleActionBarActivation, this);
    this.scene.events.on('party:member:selected', this.handlePartyMemberSelection, this);
    this.scene.events.on('targetframe:cast:completed', this.handleTargetCastCompleted, this);
    this.scene.events.on('targetframe:cast:interrupted', this.handleTargetCastInterrupted, this);
  }

  private updateUIFromGameState(state: any): void {
    // Update player frame with current stats
    if (this.playerFrame && state.player) {
      this.playerFrame.updateStats({
        health: state.player.health,
        maxHealth: state.player.maxHealth,
        mana: state.player.mana,
        maxMana: state.player.maxMana,
        energy: state.player.energy,
        maxEnergy: state.player.maxEnergy
      });
      
      if (state.player.name && state.player.level && state.player.class) {
        this.playerFrame.setPlayerInfo(
          state.player.name,
          state.player.level,
          state.player.class
        );
      }
    }
    
    // Update target frame
    if (this.targetFrame && state.target) {
      this.targetFrame.setTarget(state.target);
    }
    
    // Update party frames
    if (this.partyFrames && state.party) {
      this.partyFrames.setParty(state.party.members);
    }
  }

  private handleActionBarActivation(event: { slotId: string; slot: any }): void {
    console.log('Action bar slot activated:', event.slotId);
    // Handle skill/item activation logic
    this.gameStore.store.setState((state) => ({
      ...state,
      lastActionUsed: {
        slotId: event.slotId,
        timestamp: Date.now()
      }
    }));
  }

  private handlePartyMemberSelection(member: any): void {
    console.log('Party member selected:', member.name);
    // Set as target or perform other actions
    this.gameStore.store.setState((state) => ({
      ...state,
      target: {
        id: member.id,
        name: member.name,
        type: 'player',
        level: member.level,
        health: member.health,
        maxHealth: member.maxHealth
      }
    }));
  }

  private handleTargetCastCompleted(castInfo: any): void {
    console.log('Target completed cast:', castInfo.spellName);
    // Handle spell effects, damage, etc.
  }

  private handleTargetCastInterrupted(castInfo: any): void {
    console.log('Target cast interrupted:', castInfo.spellName);
    // Handle interrupt effects
  }

  private handleResize(): void {
    const { width, height } = this.scene.scale;
    
    // Update layout type
    this.determineLayout();
    
    // Resize all components
    this.actionBar?.resize(width, height);
    this.playerFrame?.resize(width, height);
    this.targetFrame?.resize(width, height);
    this.partyFrames?.resize(width, height);
    this.inventory?.resize(width, height);
    this.characterSheet?.resize(width, height);
    this.questTracker?.resize(width, height);
    this.chatSystem?.resize(width, height);
    this.guildPanel?.resize(width, height);
    this.friendsList?.resize(width, height);
    this.lootWindow?.resize(width, height);
    this.currencyTracker?.resize(width, height);
    this.vendorUI?.resize(width, height);
    this.dungeonUI?.resize(width, height);
    this.combatUI?.resize(width, height);
    this.achievementPanel?.resize(width, height);
    this.dailyTasks?.resize(width, height);
    
    // Reposition components for new layout
    this.positionComponents();
    
    console.log('UI Manager resized to:', width, 'x', height, 'Layout:', this.currentLayout);
  }

  // Public API methods
  public togglePlayerFrame(): void {
    if (this.playerFrame) {
      this.playerFrame.toggle();
    }
  }

  public toggleTargetFrame(): void {
    if (this.targetFrame) {
      this.targetFrame.toggle();
    }
  }

  public togglePartyFrames(): void {
    if (this.partyFrames) {
      this.partyFrames.toggle();
    }
  }

  public toggleInventory(): void {
    if (this.inventory) {
      this.inventory.toggle();
    }
  }

  public toggleCharacterSheet(): void {
    if (this.characterSheet) {
      this.characterSheet.toggle();
    }
  }

  public toggleQuestTracker(): void {
    if (this.questTracker) {
      this.questTracker.toggle();
    }
  }

  public toggleChatInput(): void {
    if (this.chatSystem) {
      // Chat system handles its own input activation
      this.scene.events.emit('chat:input:toggle');
    }
  }

  public toggleGuildPanel(): void {
    if (this.guildPanel) {
      this.guildPanel.toggle();
    }
  }

  public toggleFriendsList(): void {
    if (this.friendsList) {
      this.friendsList.toggle();
    }
  }

  public toggleVendorUI(): void {
    if (this.vendorUI) {
      this.vendorUI.toggle();
    }
  }

  public showLootWindow(): void {
    if (this.lootWindow) {
      this.lootWindow.show();
    }
  }

  public hideLootWindow(): void {
    if (this.lootWindow) {
      this.lootWindow.hide();
    }
  }

  public showDungeonUI(): void {
    if (this.dungeonUI) {
      this.dungeonUI.show();
    }
  }

  public hideDungeonUI(): void {
    if (this.dungeonUI) {
      this.dungeonUI.hide();
    }
  }

  public toggleAchievementPanel(): void {
    if (this.achievementPanel) {
      this.achievementPanel.toggle();
    }
  }

  public toggleDailyTasks(): void {
    if (this.dailyTasks) {
      this.dailyTasks.toggle();
    }
  }

  public toggleCombatUI(): void {
    if (this.combatUI) {
      this.combatUI.toggle();
    }
  }

  public toggleAllUI(): void {
    const anyVisible = this.isAnyUIVisible();
    
    if (anyVisible) {
      this.hideAllUI();
    } else {
      this.showAllUI();
    }
  }

  private isAnyUIVisible(): boolean {
    return !!(
      (this.playerFrame && this.playerFrame['isVisible']) ||
      (this.targetFrame && this.targetFrame['isVisible']) ||
      (this.partyFrames && this.partyFrames['isVisible']) ||
      (this.actionBar && this.actionBar['isVisible']) ||
      (this.inventory && this.inventory['isVisible']) ||
      (this.characterSheet && this.characterSheet['isVisible']) ||
      (this.questTracker && this.questTracker['isVisible']) ||
      (this.chatSystem && this.chatSystem['isVisible']) ||
      (this.guildPanel && this.guildPanel['isVisible']) ||
      (this.friendsList && this.friendsList['isVisible'])
    );
  }

  private hideAllUI(): void {
    this.playerFrame?.hide();
    this.targetFrame?.hide();
    this.partyFrames?.hide();
    this.actionBar?.hide();
    this.inventory?.hide();
    this.characterSheet?.hide();
    this.questTracker?.hide();
    this.chatSystem?.hide();
    this.guildPanel?.hide();
    this.friendsList?.hide();
  }

  private showAllUI(): void {
    this.playerFrame?.show();
    this.targetFrame?.show();
    this.partyFrames?.show();
    this.actionBar?.show();
    // Note: Don't auto-show modal windows like inventory, character sheet, guild panel
    // this.inventory?.show();
    // this.characterSheet?.show();
    // this.guildPanel?.show();
    // this.friendsList?.show();
    this.questTracker?.show(); // Quest tracker can be shown by default
    this.chatSystem?.show(); // Chat system should be visible by default
  }

  public adjustUIScale(delta: number): void {
    // Implementation would adjust the global UI scale
    console.log('Adjusting UI scale by:', delta);
  }

  public resetUIScale(): void {
    // Reset to default UI scale
    console.log('Resetting UI scale to default');
  }

  public setCompactMode(enabled: boolean): void {
    this.config.compactMode = enabled;
    
    // Recreate components with new compact mode setting
    this.destroy();
    this.isInitialized = false;
    this.initialize();
  }

  // Component getters
  public getActionBar(): ActionBar | undefined {
    return this.actionBar;
  }

  public getPlayerFrame(): PlayerFrame | undefined {
    return this.playerFrame;
  }

  public getTargetFrame(): TargetFrame | undefined {
    return this.targetFrame;
  }

  public getPartyFrames(): PartyFrames | undefined {
    return this.partyFrames;
  }

  public getInventory(): Inventory | undefined {
    return this.inventory;
  }

  public getCharacterSheet(): CharacterSheet | undefined {
    return this.characterSheet;
  }

  public getQuestTracker(): QuestTracker | undefined {
    return this.questTracker;
  }

  public getChatSystem(): ChatSystem | undefined {
    return this.chatSystem;
  }

  public getGuildPanel(): GuildPanel | undefined {
    return this.guildPanel;
  }

  public getFriendsList(): FriendsList | undefined {
    return this.friendsList;
  }

  public getLootWindow(): LootWindow | undefined {
    return this.lootWindow;
  }

  public getCurrencyTracker(): CurrencyTracker | undefined {
    return this.currencyTracker;
  }

  public getVendorUI(): VendorUI | undefined {
    return this.vendorUI;
  }

  public getDungeonUI(): DungeonUI | undefined {
    return this.dungeonUI;
  }

  public getCombatUI(): CombatUI | undefined {
    return this.combatUI;
  }

  public getAchievementPanel(): AchievementPanel | undefined {
    return this.achievementPanel;
  }

  public getDailyTasks(): DailyTasks | undefined {
    return this.dailyTasks;
  }

  public destroy(): void {
    // Remove event listeners
    if (this.resizeHandler) {
      this.scene.scale.off('resize', this.resizeHandler);
    }
    
    // Remove keyboard handlers
    this.keyboardHandlers.clear();
    
    // Remove game event listeners
    this.scene.events.off('actionbar:slot:activated', this.handleActionBarActivation, this);
    this.scene.events.off('party:member:selected', this.handlePartyMemberSelection, this);
    this.scene.events.off('targetframe:cast:completed', this.handleTargetCastCompleted, this);
    this.scene.events.off('targetframe:cast:interrupted', this.handleTargetCastInterrupted, this);
    
    // Destroy components
    this.actionBar?.destroy();
    this.playerFrame?.destroy();
    this.targetFrame?.destroy();
    this.partyFrames?.destroy();
    this.inventory?.destroy();
    this.characterSheet?.destroy();
    this.questTracker?.destroy();
    this.chatSystem?.destroy();
    this.guildPanel?.destroy();
    this.friendsList?.destroy();
    this.lootWindow?.destroy();
    this.currencyTracker?.destroy();
    this.vendorUI?.destroy();
    this.dungeonUI?.destroy();
    this.combatUI?.destroy();
    this.achievementPanel?.destroy();
    this.dailyTasks?.destroy();
    
    this.isInitialized = false;
  }
}
