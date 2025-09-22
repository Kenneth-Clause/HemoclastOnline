/**
 * Friends List Component
 * Online/offline status, invite, whisper, block features
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface Friend {
  id: string;
  name: string;
  level: number;
  class: string;
  isOnline: boolean;
  status: 'online' | 'away' | 'busy' | 'offline';
  location?: string;
  lastSeen: Date;
  note?: string;
  isFavorite?: boolean;
}

export interface FriendsListConfig extends UIComponentConfig {
  showOfflineFriends?: boolean;
  compactMode?: boolean;
  maxFriends?: number;
  enableNotes?: boolean;
}

export class FriendsList extends UIComponent {
  private friendsListConfig: FriendsListConfig;
  private friends: Friend[] = [];
  private filteredFriends: Friend[] = [];
  private currentFilter: 'all' | 'online' | 'offline' | 'favorites' = 'all';
  
  // UI Elements
  private friendsPanel?: Phaser.GameObjects.Graphics;
  private headerContainer?: Phaser.GameObjects.Container;
  private friendsContainer?: Phaser.GameObjects.Container;
  private filterButtons?: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  }>;
  
  // Scroll handling
  private scrollPosition: number = 0;
  private maxVisibleFriends: number = 8;

  constructor(scene: Phaser.Scene, config: FriendsListConfig = {}) {
    super(scene, config);
    
    this.friendsListConfig = {
      showOfflineFriends: true,
      compactMode: false,
      maxFriends: 50,
      enableNotes: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.initializeSampleFriends();
    this.createFriendsList();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
    
    this.hide(); // Hidden by default
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createFriendsList(): void {
    const panelWidth = this.friendsListConfig.compactMode ? 280 : 350;
    const panelHeight = this.friendsListConfig.compactMode ? 350 : 450;
    
    // Main friends panel
    this.friendsPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight);
    
    // Header
    this.createHeader();
    
    // Filter buttons
    this.createFilterButtons();
    
    // Friends container
    this.createFriendsContainer();
    
    // Update display
    this.updateFriendsDisplay();
  }

  private createHeader(): void {
    const panelWidth = this.friendsListConfig.compactMode ? 280 : 350;
    
    this.headerContainer = this.scene.add.container(0, 0);
    this.addElement(this.headerContainer);
    
    // Title
    const title = this.createGothicText(panelWidth / 2, 15, 'Friends List', 16, '#DC143C');
    title.setOrigin(0.5, 0);
    this.headerContainer.add(title);
    
    // Friend count
    const onlineFriends = this.friends.filter(f => f.isOnline).length;
    const countText = this.createGothicText(
      panelWidth / 2, 35, 
      `${onlineFriends}/${this.friends.length} Online`, 
      12, '#C0C0C0'
    );
    countText.setOrigin(0.5, 0);
    this.headerContainer.add(countText);
  }

  private createFilterButtons(): void {
    const panelWidth = this.friendsListConfig.compactMode ? 280 : 350;
    const filters = [
      { key: 'all', name: 'All', icon: '👥' },
      { key: 'online', name: 'Online', icon: '🟢' },
      { key: 'favorites', name: '⭐', icon: '' }
    ];
    
    const buttonWidth = (panelWidth - 40) / filters.length;
    const buttonHeight = 25;
    const startY = 55;
    
    this.filterButtons = new Map();
    
    filters.forEach((filter, index) => {
      const x = 20 + (index * buttonWidth);
      
      const filterContainer = this.scene.add.container(x, startY);
      this.addElement(filterContainer);
      
      // Button background
      const background = this.scene.add.graphics();
      const isActive = filter.key === this.currentFilter;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, buttonWidth - 2, buttonHeight, 4);
      background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, buttonWidth - 2, buttonHeight, 4);
      filterContainer.add(background);
      
      // Button text
      const displayText = filter.icon ? `${filter.icon} ${filter.name}` : filter.name;
      const buttonText = this.scene.add.text(buttonWidth / 2 - 1, buttonHeight / 2, displayText, {
        fontSize: `${10 * this.uiScale}px`,
        color: isActive ? '#F5F5DC' : '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      filterContainer.add(buttonText);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(
        buttonWidth / 2 - 1, buttonHeight / 2, buttonWidth - 2, buttonHeight, 0x000000, 0
      ).setInteractive();
      filterContainer.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.setFilter(filter.key as any);
      });
      
      this.filterButtons.set(filter.key, {
        container: filterContainer,
        background,
        text: buttonText
      });
    });
  }

  private createFriendsContainer(): void {
    const panelWidth = this.friendsListConfig.compactMode ? 280 : 350;
    const panelHeight = this.friendsListConfig.compactMode ? 350 : 450;
    const containerHeight = panelHeight - 110; // Account for header and filters
    
    this.friendsContainer = this.scene.add.container(20, 90);
    this.addElement(this.friendsContainer);
    
    // Friends list background
    const friendsBg = this.scene.add.graphics();
    friendsBg.fillStyle(0x1a1a1a, 0.6);
    friendsBg.fillRoundedRect(0, 0, panelWidth - 40, containerHeight, 6);
    friendsBg.lineStyle(1, 0x666666);
    friendsBg.strokeRoundedRect(0, 0, panelWidth - 40, containerHeight, 6);
    this.friendsContainer.add(friendsBg);
    
    // Set up clipping mask
    const maskShape = this.scene.add.graphics();
    maskShape.fillRect(20, 90, panelWidth - 40, containerHeight);
    const mask = maskShape.createGeometryMask();
    this.friendsContainer.setMask(mask);
    
    this.maxVisibleFriends = Math.floor(containerHeight / 40); // 40px per friend entry
  }

  private setFilter(filter: 'all' | 'online' | 'offline' | 'favorites'): void {
    if (filter === this.currentFilter) return;
    
    // Update filter buttons
    this.filterButtons?.forEach((button, buttonFilter) => {
      const isActive = buttonFilter === filter;
      button.background.clear();
      button.background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      button.background.fillRoundedRect(0, 0, 
        ((this.friendsListConfig.compactMode ? 280 : 350) - 40) / 3 - 2, 25, 4);
      button.background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      button.background.strokeRoundedRect(0, 0, 
        ((this.friendsListConfig.compactMode ? 280 : 350) - 40) / 3 - 2, 25, 4);
      button.text.setColor(isActive ? '#F5F5DC' : '#C0C0C0');
    });
    
    this.currentFilter = filter;
    this.updateFriendsDisplay();
  }

  private updateFriendsDisplay(): void {
    if (!this.friendsContainer) return;
    
    // Clear existing friend elements (except background)
    const background = this.friendsContainer.list[0];
    this.friendsContainer.removeAll();
    this.friendsContainer.add(background);
    
    // Filter friends
    this.filteredFriends = this.friends.filter(friend => {
      switch (this.currentFilter) {
        case 'online':
          return friend.isOnline;
        case 'offline':
          return !friend.isOnline;
        case 'favorites':
          return friend.isFavorite;
        default:
          return this.friendsListConfig.showOfflineFriends || friend.isOnline;
      }
    });
    
    // Sort friends (online first, then by name)
    this.filteredFriends.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return b.isOnline ? 1 : -1; // Online friends first
      }
      return a.name.localeCompare(b.name);
    });
    
    // Display friends
    const visibleFriends = this.filteredFriends.slice(
      this.scrollPosition, 
      this.scrollPosition + this.maxVisibleFriends
    );
    
    visibleFriends.forEach((friend, index) => {
      this.createFriendEntry(friend, index);
    });
    
    // Update header count
    this.updateHeaderCount();
  }

  private createFriendEntry(friend: Friend, index: number): void {
    if (!this.friendsContainer) return;
    
    const panelWidth = this.friendsListConfig.compactMode ? 280 : 350;
    const entryHeight = 35;
    const y = 10 + (index * 40);
    
    // Friend entry background
    const entryBg = this.scene.add.graphics();
    const bgAlpha = friend.isOnline ? 0.8 : 0.4;
    entryBg.fillStyle(0x2F2F2F, bgAlpha);
    entryBg.fillRoundedRect(5, y, panelWidth - 50, entryHeight, 4);
    this.friendsContainer.add(entryBg);
    
    // Status indicator
    const statusColor = this.getStatusColor(friend.status);
    const statusIndicator = this.scene.add.graphics();
    statusIndicator.fillStyle(statusColor);
    statusIndicator.fillCircle(15, y + entryHeight / 2, 6);
    this.friendsContainer.add(statusIndicator);
    
    // Friend name
    const nameColor = friend.isOnline ? '#F5F5DC' : '#999999';
    const friendName = this.scene.add.text(30, y + 8, friend.name, {
      fontSize: `${12 * this.uiScale}px`,
      color: nameColor,
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    });
    this.friendsContainer.add(friendName);
    
    // Friend level and class
    const friendInfo = this.scene.add.text(30, y + 22, `${friend.level} ${friend.class}`, {
      fontSize: `${10 * this.uiScale}px`,
      color: friend.isOnline ? '#C0C0C0' : '#666666',
      fontFamily: 'Cinzel, serif'
    });
    this.friendsContainer.add(friendInfo);
    
    // Location or last seen
    let statusText = '';
    if (friend.isOnline && friend.location) {
      statusText = friend.location;
    } else if (!friend.isOnline) {
      statusText = this.getLastSeenText(friend.lastSeen);
    }
    
    if (statusText) {
      const statusTextElement = this.scene.add.text(
        panelWidth - 80, y + 15, statusText, {
        fontSize: `${9 * this.uiScale}px`,
        color: '#999999',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(1, 0.5);
      this.friendsContainer.add(statusTextElement);
    }
    
    // Favorite star
    if (friend.isFavorite) {
      const favoriteIcon = this.scene.add.text(panelWidth - 60, y + 8, '⭐', {
        fontSize: `${12 * this.uiScale}px`
      });
      this.friendsContainer.add(favoriteIcon);
    }
    
    // Interactive area
    const friendHitArea = this.scene.add.rectangle(
      (panelWidth - 50) / 2, y + entryHeight / 2, panelWidth - 50, entryHeight, 0x000000, 0
    ).setInteractive();
    this.friendsContainer.add(friendHitArea);
    
    // Friend interactions
    friendHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.showFriendContextMenu(friend);
      } else {
        this.selectFriend(friend);
      }
    });
    
    friendHitArea.on('pointerover', () => {
      entryBg.clear();
      entryBg.fillStyle(0x4a0000, friend.isOnline ? 0.9 : 0.6);
      entryBg.fillRoundedRect(5, y, panelWidth - 50, entryHeight, 4);
    });
    
    friendHitArea.on('pointerout', () => {
      entryBg.clear();
      entryBg.fillStyle(0x2F2F2F, friend.isOnline ? 0.8 : 0.4);
      entryBg.fillRoundedRect(5, y, panelWidth - 50, entryHeight, 4);
    });
  }

  private getStatusColor(status: Friend['status']): number {
    const colors = {
      'online': 0x32CD32,
      'away': 0xFFD700,
      'busy': 0xFF4444,
      'offline': 0x666666
    };
    return colors[status];
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

  private updateHeaderCount(): void {
    if (!this.headerContainer) return;
    
    const countElement = this.headerContainer.list[1] as Phaser.GameObjects.Text;
    if (countElement) {
      const onlineFriends = this.friends.filter(f => f.isOnline).length;
      countElement.setText(`${onlineFriends}/${this.friends.length} Online`);
    }
  }

  private selectFriend(friend: Friend): void {
    console.log(`Selected friend: ${friend.name}`);
    this.scene.events.emit('friends:friend:selected', friend);
  }

  private showFriendContextMenu(friend: Friend): void {
    console.log(`Context menu for ${friend.name}`);
    
    // Create context menu options
    const options = [];
    
    if (friend.isOnline) {
      options.push(
        { text: 'Whisper', action: () => this.whisperFriend(friend) },
        { text: 'Invite to Party', action: () => this.inviteToParty(friend) }
      );
    }
    
    options.push(
      { text: friend.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', 
        action: () => this.toggleFavorite(friend) },
      { text: 'View Profile', action: () => this.viewProfile(friend) },
      { text: 'Add Note', action: () => this.addNote(friend) },
      { text: '---', action: () => {} },
      { text: 'Remove Friend', action: () => this.removeFriend(friend) },
      { text: 'Block Player', action: () => this.blockPlayer(friend) }
    );
    
    // TODO: Implement actual context menu UI
    this.scene.events.emit('friends:context:show', { friend, options });
  }

  private whisperFriend(friend: Friend): void {
    console.log(`Whispering to ${friend.name}`);
    this.scene.events.emit('friends:whisper', friend);
  }

  private inviteToParty(friend: Friend): void {
    console.log(`Inviting ${friend.name} to party`);
    this.scene.events.emit('friends:party:invite', friend);
  }

  private toggleFavorite(friend: Friend): void {
    friend.isFavorite = !friend.isFavorite;
    console.log(`${friend.isFavorite ? 'Added' : 'Removed'} ${friend.name} ${friend.isFavorite ? 'to' : 'from'} favorites`);
    this.updateFriendsDisplay();
    this.scene.events.emit('friends:favorite:toggle', friend);
  }

  private viewProfile(friend: Friend): void {
    console.log(`Viewing profile for ${friend.name}`);
    this.scene.events.emit('friends:profile:view', friend);
  }

  private addNote(friend: Friend): void {
    console.log(`Adding note for ${friend.name}`);
    // TODO: Implement note dialog
    this.scene.events.emit('friends:note:add', friend);
  }

  private removeFriend(friend: Friend): void {
    console.log(`Removing friend: ${friend.name}`);
    this.friends = this.friends.filter(f => f.id !== friend.id);
    this.updateFriendsDisplay();
    this.scene.events.emit('friends:friend:removed', friend);
  }

  private blockPlayer(friend: Friend): void {
    console.log(`Blocking player: ${friend.name}`);
    this.scene.events.emit('friends:player:blocked', friend);
  }

  private initializeSampleFriends(): void {
    this.friends = [
      {
        id: 'friend_001',
        name: 'DarkKnight_92',
        level: 25,
        class: 'Berserker',
        isOnline: true,
        status: 'online',
        location: 'Whispering Woods',
        lastSeen: new Date(),
        isFavorite: true,
        note: 'Great tank player, always reliable'
      },
      {
        id: 'friend_002',
        name: 'MysticMage',
        level: 22,
        class: 'Elementalist',
        isOnline: true,
        status: 'away',
        location: 'Millbrook Village',
        lastSeen: new Date(),
        isFavorite: false
      },
      {
        id: 'friend_003',
        name: 'SilentBlade',
        level: 20,
        class: 'Assassin',
        isOnline: false,
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        isFavorite: true
      },
      {
        id: 'friend_004',
        name: 'HolyPriest',
        level: 27,
        class: 'Oracle',
        isOnline: true,
        status: 'busy',
        location: 'Dungeon: Crypt of Shadows',
        lastSeen: new Date(),
        isFavorite: false
      },
      {
        id: 'friend_005',
        name: 'IronShield',
        level: 24,
        class: 'Guardian',
        isOnline: false,
        status: 'offline',
        lastSeen: new Date(Date.now() - 86400000), // 1 day ago
        isFavorite: false
      },
      {
        id: 'friend_006',
        name: 'FireMaster',
        level: 19,
        class: 'Elementalist',
        isOnline: true,
        status: 'online',
        location: 'Trading Post',
        lastSeen: new Date(),
        isFavorite: false
      },
      {
        id: 'friend_007',
        name: 'ShadowStep',
        level: 21,
        class: 'Duelist',
        isOnline: false,
        status: 'offline',
        lastSeen: new Date(Date.now() - 7200000), // 2 hours ago
        isFavorite: false
      }
    ];
  }

  public addFriend(friend: Friend): void {
    if (this.friends.length >= this.friendsListConfig.maxFriends!) {
      console.log('Friends list is full');
      return;
    }
    
    // Check if already friends
    if (this.friends.some(f => f.id === friend.id)) {
      console.log('Already friends with this player');
      return;
    }
    
    this.friends.push(friend);
    this.updateFriendsDisplay();
    this.scene.events.emit('friends:friend:added', friend);
  }

  public updateFriendStatus(friendId: string, status: Partial<Friend>): void {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      Object.assign(friend, status);
      this.updateFriendsDisplay();
      this.scene.events.emit('friends:friend:updated', friend);
    }
  }

  public getFriends(): Friend[] {
    return [...this.friends];
  }

  public getOnlineFriends(): Friend[] {
    return this.friends.filter(f => f.isOnline);
  }

  public getFavoriteFriends(): Friend[] {
    return this.friends.filter(f => f.isFavorite);
  }

  protected onResize(width: number, height: number): void {
    // Recreate friends list with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.filterButtons?.clear();
    this.create();
  }
}
