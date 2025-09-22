/**
 * Guild Panel Component
 * Member management, ranks, permissions, guild bank, and buffs
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface GuildMember {
  id: string;
  name: string;
  level: number;
  class: string;
  rank: string;
  isOnline: boolean;
  lastSeen: Date;
  contributionPoints: number;
  joinDate: Date;
  note?: string;
}

export interface GuildRank {
  id: string;
  name: string;
  level: number; // Higher = more authority
  permissions: GuildPermission[];
  color: string;
}

export type GuildPermission = 
  | 'invite_members' 
  | 'kick_members' 
  | 'promote_members' 
  | 'demote_members' 
  | 'manage_ranks' 
  | 'access_bank' 
  | 'deposit_bank' 
  | 'withdraw_bank' 
  | 'guild_chat' 
  | 'officer_chat' 
  | 'edit_motd' 
  | 'manage_alliances';

export interface GuildInfo {
  id: string;
  name: string;
  tag: string;
  level: number;
  experience: number;
  maxExperience: number;
  memberCount: number;
  maxMembers: number;
  motd: string; // Message of the Day
  description: string;
  foundedDate: Date;
  treasury: number;
  activeBuffs: GuildBuff[];
}

export interface GuildBuff {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number;
  maxDuration: number;
  cost: number;
  effects: { [key: string]: number };
}

export interface GuildPanelConfig extends UIComponentConfig {
  showOfflineMembers?: boolean;
  compactMode?: boolean;
  defaultTab?: 'members' | 'ranks' | 'bank' | 'buffs' | 'info';
}

export class GuildPanel extends UIComponent {
  private guildPanelConfig: GuildPanelConfig;
  private guildInfo: GuildInfo;
  private guildMembers: GuildMember[] = [];
  private guildRanks: GuildRank[] = [];
  private currentTab: 'members' | 'ranks' | 'bank' | 'buffs' | 'info' = 'members';
  private playerPermissions: GuildPermission[] = [];
  
  // UI Elements
  private guildPanel?: Phaser.GameObjects.Graphics;
  private tabButtons?: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  }>;
  private contentContainer?: Phaser.GameObjects.Container;
  private headerContainer?: Phaser.GameObjects.Container;
  
  // Tab-specific containers
  private membersContainer?: Phaser.GameObjects.Container;
  private ranksContainer?: Phaser.GameObjects.Container;
  private bankContainer?: Phaser.GameObjects.Container;
  private buffsContainer?: Phaser.GameObjects.Container;
  private infoContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: GuildPanelConfig = {}) {
    super(scene, config);
    
    this.guildPanelConfig = {
      showOfflineMembers: true,
      compactMode: false,
      defaultTab: 'members',
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    
    this.currentTab = this.guildPanelConfig.defaultTab!;
    this.initializeSampleGuildData();
    this.createGuildPanel();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createGuildPanel(): void {
    const panelWidth = this.guildPanelConfig.compactMode ? 500 : 650;
    const panelHeight = this.guildPanelConfig.compactMode ? 400 : 550;
    
    // Main guild panel
    this.guildPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Header with guild info
    this.createHeader();
    
    // Tab buttons
    this.createTabButtons();
    
    // Content container
    this.createContentContainer();
    
    // Initialize with default tab
    this.switchToTab(this.currentTab);
  }

  private createHeader(): void {
    const panelWidth = this.guildPanelConfig.compactMode ? 500 : 650;
    
    this.headerContainer = this.scene.add.container(0, 0);
    this.addElement(this.headerContainer);
    
    // Guild name and tag
    const guildTitle = this.createGothicText(
      panelWidth / 2, 15, 
      `<${this.guildInfo.tag}> ${this.guildInfo.name}`, 
      18, '#DC143C'
    );
    guildTitle.setOrigin(0.5, 0);
    this.headerContainer.add(guildTitle);
    
    // Guild level and experience
    const guildLevel = this.createGothicText(
      panelWidth / 2, 40, 
      `Level ${this.guildInfo.level} Guild`, 
      14, '#FFD700'
    );
    guildLevel.setOrigin(0.5, 0);
    this.headerContainer.add(guildLevel);
    
    // Member count
    const memberCount = this.createGothicText(
      panelWidth / 2, 60, 
      `${this.guildInfo.memberCount}/${this.guildInfo.maxMembers} Members`, 
      12, '#C0C0C0'
    );
    memberCount.setOrigin(0.5, 0);
    this.headerContainer.add(memberCount);
  }

  private createTabButtons(): void {
    const panelWidth = this.guildPanelConfig.compactMode ? 500 : 650;
    const tabs = ['members', 'ranks', 'bank', 'buffs', 'info'];
    const tabWidth = (panelWidth - 40) / tabs.length;
    const tabHeight = 30;
    const startY = 85;
    
    this.tabButtons = new Map();
    
    tabs.forEach((tab, index) => {
      const x = 20 + (index * tabWidth);
      
      const tabContainer = this.scene.add.container(x, startY);
      this.addElement(tabContainer);
      
      // Tab background
      const background = this.scene.add.graphics();
      const isActive = tab === this.currentTab;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, tabWidth - 2, tabHeight, 6);
      background.lineStyle(2, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, tabWidth - 2, tabHeight, 6);
      tabContainer.add(background);
      
      // Tab text
      const tabText = this.scene.add.text(tabWidth / 2 - 1, tabHeight / 2, this.getTabDisplayName(tab), {
        fontSize: `${12 * this.uiScale}px`,
        color: isActive ? '#F5F5DC' : '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      tabContainer.add(tabText);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(tabWidth / 2 - 1, tabHeight / 2, tabWidth - 2, tabHeight, 0x000000, 0)
        .setInteractive();
      tabContainer.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.switchToTab(tab as any);
      });
      
      this.tabButtons.set(tab, {
        container: tabContainer,
        background,
        text: tabText
      });
    });
  }

  private createContentContainer(): void {
    const panelWidth = this.guildPanelConfig.compactMode ? 500 : 650;
    const panelHeight = this.guildPanelConfig.compactMode ? 400 : 550;
    const contentHeight = panelHeight - 130; // Account for header and tabs
    
    this.contentContainer = this.scene.add.container(20, 125);
    this.addElement(this.contentContainer);
    
    // Content background
    const contentBg = this.scene.add.graphics();
    contentBg.fillStyle(0x1a1a1a, 0.7);
    contentBg.fillRoundedRect(0, 0, panelWidth - 40, contentHeight, 8);
    contentBg.lineStyle(1, 0x666666);
    contentBg.strokeRoundedRect(0, 0, panelWidth - 40, contentHeight, 8);
    this.contentContainer.add(contentBg);
  }

  private getTabDisplayName(tab: string): string {
    const names = {
      'members': 'Members',
      'ranks': 'Ranks',
      'bank': 'Bank',
      'buffs': 'Buffs',
      'info': 'Info'
    };
    return names[tab as keyof typeof names] || tab;
  }

  private switchToTab(tab: 'members' | 'ranks' | 'bank' | 'buffs' | 'info'): void {
    if (tab === this.currentTab) return;
    
    // Update tab buttons
    this.tabButtons?.forEach((button, buttonTab) => {
      const isActive = buttonTab === tab;
      button.background.clear();
      button.background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      button.background.fillRoundedRect(0, 0, 
        ((this.guildPanelConfig.compactMode ? 500 : 650) - 40) / 5 - 2, 30, 6);
      button.background.lineStyle(2, isActive ? 0xDC143C : 0x666666);
      button.background.strokeRoundedRect(0, 0, 
        ((this.guildPanelConfig.compactMode ? 500 : 650) - 40) / 5 - 2, 30, 6);
      button.text.setColor(isActive ? '#F5F5DC' : '#C0C0C0');
    });
    
    // Clear content container (except background)
    if (this.contentContainer) {
      const background = this.contentContainer.list[0];
      this.contentContainer.removeAll();
      this.contentContainer.add(background);
    }
    
    this.currentTab = tab;
    
    // Load tab content
    switch (tab) {
      case 'members':
        this.createMembersTab();
        break;
      case 'ranks':
        this.createRanksTab();
        break;
      case 'bank':
        this.createBankTab();
        break;
      case 'buffs':
        this.createBuffsTab();
        break;
      case 'info':
        this.createInfoTab();
        break;
    }
  }

  private createMembersTab(): void {
    if (!this.contentContainer) return;
    
    const panelWidth = this.guildPanelConfig.compactMode ? 500 : 650;
    
    // Members list header
    const headerY = 15;
    const nameHeader = this.scene.add.text(15, headerY, 'Name', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(nameHeader);
    
    const rankHeader = this.scene.add.text(150, headerY, 'Rank', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(rankHeader);
    
    const levelHeader = this.scene.add.text(250, headerY, 'Level', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(levelHeader);
    
    const statusHeader = this.scene.add.text(320, headerY, 'Status', {
      fontSize: `${12 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(statusHeader);
    
    // Members list
    const visibleMembers = this.guildPanelConfig.showOfflineMembers ? 
      this.guildMembers : 
      this.guildMembers.filter(member => member.isOnline);
    
    visibleMembers.forEach((member, index) => {
      const y = 40 + (index * 25);
      
      // Member name
      const nameColor = member.isOnline ? '#F5F5DC' : '#999999';
      const memberName = this.scene.add.text(15, y, member.name, {
        fontSize: `${11 * this.uiScale}px`,
        color: nameColor,
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(memberName);
      
      // Member rank
      const rank = this.guildRanks.find(r => r.name === member.rank);
      const rankColor = rank?.color || '#C0C0C0';
      const memberRank = this.scene.add.text(150, y, member.rank, {
        fontSize: `${11 * this.uiScale}px`,
        color: rankColor,
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(memberRank);
      
      // Member level and class
      const memberLevel = this.scene.add.text(250, y, `${member.level} ${member.class}`, {
        fontSize: `${11 * this.uiScale}px`,
        color: nameColor,
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(memberLevel);
      
      // Online status
      const statusText = member.isOnline ? 'Online' : this.getLastSeenText(member.lastSeen);
      const statusColor = member.isOnline ? '#32CD32' : '#999999';
      const memberStatus = this.scene.add.text(320, y, statusText, {
        fontSize: `${10 * this.uiScale}px`,
        color: statusColor,
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(memberStatus);
      
      // Interactive area for member actions
      const memberHitArea = this.scene.add.rectangle(
        (panelWidth - 40) / 2, y + 10, panelWidth - 60, 20, 0x000000, 0
      ).setInteractive();
      this.contentContainer.add(memberHitArea);
      
      memberHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          this.showMemberContextMenu(member);
        } else {
          this.showMemberDetails(member);
        }
      });
    });
    
    // Guild controls (if player has permissions)
    if (this.hasPermission('invite_members')) {
      const inviteButton = this.createButton(
        15, (this.guildPanelConfig.compactMode ? 400 : 550) - 170,
        120, 25, 'Invite Member', () => {
          this.showInviteDialog();
        }
      );
    }
  }

  private createRanksTab(): void {
    if (!this.contentContainer) return;
    
    // Ranks list
    this.guildRanks.forEach((rank, index) => {
      const y = 20 + (index * 40);
      
      // Rank background
      const rankBg = this.scene.add.graphics();
      rankBg.fillStyle(0x2F2F2F, 0.6);
      rankBg.fillRoundedRect(15, y, (this.guildPanelConfig.compactMode ? 500 : 650) - 70, 35, 6);
      this.contentContainer.add(rankBg);
      
      // Rank name and level
      const rankName = this.scene.add.text(25, y + 8, `${rank.name} (Level ${rank.level})`, {
        fontSize: `${14 * this.uiScale}px`,
        color: rank.color,
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      });
      this.contentContainer.add(rankName);
      
      // Permissions preview
      const permissionCount = rank.permissions.length;
      const permissionsText = this.scene.add.text(25, y + 22, `${permissionCount} permissions`, {
        fontSize: `${10 * this.uiScale}px`,
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(permissionsText);
      
      // Edit button (if player has permission)
      if (this.hasPermission('manage_ranks')) {
        const editButton = this.scene.add.text(
          (this.guildPanelConfig.compactMode ? 500 : 650) - 80, y + 17, 'Edit', {
          fontSize: `${11 * this.uiScale}px`,
          color: '#4169E1',
          fontFamily: 'Cinzel, serif'
        }).setInteractive();
        this.contentContainer.add(editButton);
        
        editButton.on('pointerdown', () => {
          this.editRank(rank);
        });
      }
    });
  }

  private createBankTab(): void {
    if (!this.contentContainer) return;
    
    // Treasury display
    const treasuryText = this.scene.add.text(20, 20, `Guild Treasury: ${this.guildInfo.treasury} gold`, {
      fontSize: `${16 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(treasuryText);
    
    // Bank slots (placeholder)
    const slotsPerRow = 8;
    const slotSize = 40;
    const slotSpacing = 5;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < slotsPerRow; col++) {
        const x = 20 + col * (slotSize + slotSpacing);
        const y = 60 + row * (slotSize + slotSpacing);
        
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(0x2d1b1b, 0.8);
        slotBg.fillRoundedRect(x, y, slotSize, slotSize, 6);
        slotBg.lineStyle(2, 0x666666);
        slotBg.strokeRoundedRect(x, y, slotSize, slotSize, 6);
        this.contentContainer.add(slotBg);
      }
    }
    
    // Bank controls
    if (this.hasPermission('deposit_bank')) {
      const depositButton = this.createButton(20, 280, 100, 25, 'Deposit', () => {
        this.showBankDepositDialog();
      });
    }
    
    if (this.hasPermission('withdraw_bank')) {
      const withdrawButton = this.createButton(130, 280, 100, 25, 'Withdraw', () => {
        this.showBankWithdrawDialog();
      });
    }
  }

  private createBuffsTab(): void {
    if (!this.contentContainer) return;
    
    // Active buffs
    const activeBuffsTitle = this.scene.add.text(20, 20, 'Active Guild Buffs', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#32CD32',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(activeBuffsTitle);
    
    this.guildInfo.activeBuffs.forEach((buff, index) => {
      const y = 50 + (index * 60);
      
      // Buff background
      const buffBg = this.scene.add.graphics();
      buffBg.fillStyle(0x1a4a1a, 0.6);
      buffBg.fillRoundedRect(20, y, (this.guildPanelConfig.compactMode ? 500 : 650) - 80, 55, 6);
      this.contentContainer.add(buffBg);
      
      // Buff icon
      const buffIcon = this.scene.add.text(30, y + 27, buff.icon, {
        fontSize: `${24 * this.uiScale}px`
      }).setOrigin(0, 0.5);
      this.contentContainer.add(buffIcon);
      
      // Buff name and description
      const buffName = this.scene.add.text(70, y + 15, buff.name, {
        fontSize: `${12 * this.uiScale}px`,
        color: '#32CD32',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      });
      this.contentContainer.add(buffName);
      
      const buffDesc = this.scene.add.text(70, y + 30, buff.description, {
        fontSize: `${10 * this.uiScale}px`,
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(buffDesc);
      
      // Duration
      const timeRemaining = Math.ceil(buff.duration / 1000 / 60); // Convert to minutes
      const durationText = this.scene.add.text(
        (this.guildPanelConfig.compactMode ? 500 : 650) - 100, y + 27, 
        `${timeRemaining}m remaining`, {
        fontSize: `${10 * this.uiScale}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(1, 0.5);
      this.contentContainer.add(durationText);
    });
    
    // Available buffs to purchase
    const availableBuffsY = 50 + (this.guildInfo.activeBuffs.length * 60) + 20;
    const availableBuffsTitle = this.scene.add.text(20, availableBuffsY, 'Available Buffs', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(availableBuffsTitle);
    
    // Sample available buffs
    const availableBuffs = [
      { name: 'Guild Experience Boost', cost: 500, description: '+25% XP for all members' },
      { name: 'Crafting Bonus', cost: 300, description: '+10% crafting success rate' },
      { name: 'Combat Prowess', cost: 750, description: '+5% damage for all members' }
    ];
    
    availableBuffs.forEach((buff, index) => {
      const y = availableBuffsY + 30 + (index * 25);
      
      const buffText = this.scene.add.text(30, y, `${buff.name} - ${buff.cost} gold`, {
        fontSize: `${11 * this.uiScale}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      });
      this.contentContainer.add(buffText);
      
      const purchaseButton = this.scene.add.text(
        (this.guildPanelConfig.compactMode ? 500 : 650) - 100, y, 'Purchase', {
        fontSize: `${10 * this.uiScale}px`,
        color: '#4169E1',
        fontFamily: 'Cinzel, serif'
      }).setInteractive();
      this.contentContainer.add(purchaseButton);
      
      purchaseButton.on('pointerdown', () => {
        this.purchaseGuildBuff(buff.name, buff.cost);
      });
    });
  }

  private createInfoTab(): void {
    if (!this.contentContainer) return;
    
    // Guild information
    const infoY = 20;
    
    // MOTD
    const motdTitle = this.scene.add.text(20, infoY, 'Message of the Day', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(motdTitle);
    
    const motdText = this.scene.add.text(20, infoY + 25, this.guildInfo.motd, {
      fontSize: `${12 * this.uiScale}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      wordWrap: { width: (this.guildPanelConfig.compactMode ? 500 : 650) - 80 }
    });
    this.contentContainer.add(motdText);
    
    // Guild description
    const descTitle = this.scene.add.text(20, infoY + 80, 'Guild Description', {
      fontSize: `${14 * this.uiScale}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.contentContainer.add(descTitle);
    
    const descText = this.scene.add.text(20, infoY + 105, this.guildInfo.description, {
      fontSize: `${11 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      wordWrap: { width: (this.guildPanelConfig.compactMode ? 500 : 650) - 80 }
    });
    this.contentContainer.add(descText);
    
    // Guild stats
    const statsY = infoY + 180;
    const foundedText = this.scene.add.text(20, statsY, 
      `Founded: ${this.guildInfo.foundedDate.toLocaleDateString()}`, {
      fontSize: `${11 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    });
    this.contentContainer.add(foundedText);
    
    const levelText = this.scene.add.text(20, statsY + 20, 
      `Guild Level: ${this.guildInfo.level}`, {
      fontSize: `${11 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    });
    this.contentContainer.add(levelText);
    
    const expText = this.scene.add.text(20, statsY + 40, 
      `Experience: ${this.guildInfo.experience}/${this.guildInfo.maxExperience}`, {
      fontSize: `${11 * this.uiScale}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    });
    this.contentContainer.add(expText);
  }

  private getLastSeenText(lastSeen: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  private hasPermission(permission: GuildPermission): boolean {
    return this.playerPermissions.includes(permission);
  }

  private showMemberContextMenu(member: GuildMember): void {
    console.log(`Context menu for ${member.name}`);
    // TODO: Implement context menu
  }

  private showMemberDetails(member: GuildMember): void {
    console.log(`Showing details for ${member.name}`);
    // TODO: Implement member details dialog
  }

  private showInviteDialog(): void {
    console.log('Showing invite member dialog');
    // TODO: Implement invite dialog
  }

  private editRank(rank: GuildRank): void {
    console.log(`Editing rank: ${rank.name}`);
    // TODO: Implement rank editing dialog
  }

  private showBankDepositDialog(): void {
    console.log('Showing bank deposit dialog');
    // TODO: Implement bank deposit dialog
  }

  private showBankWithdrawDialog(): void {
    console.log('Showing bank withdraw dialog');
    // TODO: Implement bank withdraw dialog
  }

  private purchaseGuildBuff(buffName: string, cost: number): void {
    if (this.guildInfo.treasury >= cost) {
      console.log(`Purchasing ${buffName} for ${cost} gold`);
      // TODO: Implement buff purchase logic
    } else {
      console.log('Insufficient guild funds');
    }
  }

  private initializeSampleGuildData(): void {
    this.guildInfo = {
      id: 'guild_001',
      name: 'Crimson Brotherhood',
      tag: 'CRIM',
      level: 15,
      experience: 45000,
      maxExperience: 60000,
      memberCount: 28,
      maxMembers: 50,
      motd: 'Welcome to the Crimson Brotherhood! Guild raid tonight at 8 PM EST. Check the calendar for upcoming events.',
      description: 'A dedicated guild focused on both PvE progression and PvP dominance. We value teamwork, respect, and having fun together in the world of HemoclastOnline.',
      foundedDate: new Date('2024-01-15'),
      treasury: 12500,
      activeBuffs: [
        {
          id: 'exp_boost',
          name: 'Experience Boost',
          description: '+25% experience gain for all guild members',
          icon: '✨',
          duration: 3600000, // 1 hour
          maxDuration: 3600000,
          cost: 500,
          effects: { experience: 25 }
        }
      ]
    };
    
    this.guildRanks = [
      {
        id: 'guildmaster',
        name: 'Guild Master',
        level: 10,
        permissions: ['invite_members', 'kick_members', 'promote_members', 'demote_members', 'manage_ranks', 'access_bank', 'deposit_bank', 'withdraw_bank', 'guild_chat', 'officer_chat', 'edit_motd', 'manage_alliances'],
        color: '#FF8C00'
      },
      {
        id: 'officer',
        name: 'Officer',
        level: 8,
        permissions: ['invite_members', 'kick_members', 'promote_members', 'access_bank', 'deposit_bank', 'withdraw_bank', 'guild_chat', 'officer_chat'],
        color: '#4169E1'
      },
      {
        id: 'veteran',
        name: 'Veteran',
        level: 5,
        permissions: ['access_bank', 'deposit_bank', 'guild_chat'],
        color: '#32CD32'
      },
      {
        id: 'member',
        name: 'Member',
        level: 3,
        permissions: ['guild_chat'],
        color: '#F5F5DC'
      },
      {
        id: 'recruit',
        name: 'Recruit',
        level: 1,
        permissions: ['guild_chat'],
        color: '#C0C0C0'
      }
    ];
    
    this.guildMembers = [
      {
        id: 'member_001',
        name: 'GuildMaster_Aldric',
        level: 30,
        class: 'Guardian',
        rank: 'Guild Master',
        isOnline: true,
        lastSeen: new Date(),
        contributionPoints: 15000,
        joinDate: new Date('2024-01-15')
      },
      {
        id: 'member_002',
        name: 'Officer_Sarah',
        level: 28,
        class: 'Oracle',
        rank: 'Officer',
        isOnline: true,
        lastSeen: new Date(),
        contributionPoints: 12000,
        joinDate: new Date('2024-02-01')
      },
      {
        id: 'member_003',
        name: 'DarkKnight_92',
        level: 25,
        class: 'Berserker',
        rank: 'Veteran',
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        contributionPoints: 8500,
        joinDate: new Date('2024-03-15')
      },
      {
        id: 'member_004',
        name: 'MysticMage',
        level: 22,
        class: 'Elementalist',
        rank: 'Member',
        isOnline: true,
        lastSeen: new Date(),
        contributionPoints: 5200,
        joinDate: new Date('2024-05-10')
      },
      {
        id: 'member_005',
        name: 'SilentBlade',
        level: 20,
        class: 'Assassin',
        rank: 'Member',
        isOnline: false,
        lastSeen: new Date(Date.now() - 86400000), // 1 day ago
        contributionPoints: 3800,
        joinDate: new Date('2024-07-20')
      }
    ];
    
    // Set player permissions (assuming they're an Officer)
    this.playerPermissions = ['invite_members', 'kick_members', 'promote_members', 'access_bank', 'deposit_bank', 'withdraw_bank', 'guild_chat', 'officer_chat'];
  }

  public updateGuildInfo(info: Partial<GuildInfo>): void {
    Object.assign(this.guildInfo, info);
    
    // Refresh header if visible
    if (this.headerContainer) {
      this.headerContainer.removeAll();
      this.createHeader();
    }
  }

  public addGuildMember(member: GuildMember): void {
    this.guildMembers.push(member);
    this.guildInfo.memberCount = this.guildMembers.length;
    
    if (this.currentTab === 'members') {
      this.switchToTab('members'); // Refresh members tab
    }
  }

  public removeGuildMember(memberId: string): void {
    this.guildMembers = this.guildMembers.filter(m => m.id !== memberId);
    this.guildInfo.memberCount = this.guildMembers.length;
    
    if (this.currentTab === 'members') {
      this.switchToTab('members'); // Refresh members tab
    }
  }

  protected onResize(width: number, height: number): void {
    // Recreate guild panel with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.tabButtons?.clear();
    this.create();
  }
}
