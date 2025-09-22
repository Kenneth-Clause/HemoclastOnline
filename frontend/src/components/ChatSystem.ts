/**
 * Chat System Component
 * Multi-channel chat with emotes, links, and social features
 * Supports General, Party, Guild, Trade, Whisper channels
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system' | 'emote' | 'combat' | 'loot';
  color?: string;
  isFromPlayer?: boolean;
}

export type ChatChannel = 'general' | 'party' | 'guild' | 'trade' | 'whisper' | 'system' | 'combat' | 'loot';

export interface ChatSystemConfig extends UIComponentConfig {
  maxMessages?: number;
  showTimestamps?: boolean;
  enableEmotes?: boolean;
  enableLinks?: boolean;
  compactMode?: boolean;
  defaultChannels?: ChatChannel[];
}

export class ChatSystem extends UIComponent {
  private chatConfig: ChatSystemConfig;
  private messages: ChatMessage[] = [];
  private activeChannel: ChatChannel = 'general';
  private availableChannels: ChatChannel[] = ['general', 'party', 'guild', 'trade', 'whisper', 'system'];
  private isInputActive: boolean = false;
  private currentInput: string = '';
  
  // UI Elements
  private chatPanel?: Phaser.GameObjects.Graphics;
  private messagesContainer?: Phaser.GameObjects.Container;
  private channelTabs?: Map<ChatChannel, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    unreadIndicator?: Phaser.GameObjects.Graphics;
    unreadCount: number;
  }>;
  private inputContainer?: Phaser.GameObjects.Container;
  private inputBackground?: Phaser.GameObjects.Graphics;
  private inputText?: Phaser.GameObjects.Text;
  private scrollBar?: {
    track: Phaser.GameObjects.Graphics;
    thumb: Phaser.GameObjects.Graphics;
    position: number;
  };
  
  // Scroll and display
  private scrollPosition: number = 0;
  private maxVisibleMessages: number = 10;
  private messageElements: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, config: ChatSystemConfig = {}) {
    super(scene, config);
    this.chatConfig = {
      maxMessages: 200,
      showTimestamps: false,
      enableEmotes: true,
      enableLinks: true,
      compactMode: false,
      defaultChannels: ['general', 'party', 'guild', 'trade', 'whisper'],
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createChatSystem();
    
    this.availableChannels = this.chatConfig.defaultChannels || this.availableChannels;
    this.initializeSampleMessages();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createChatSystem(): void {
    const panelWidth = this.chatConfig.compactMode ? 350 : 450;
    const panelHeight = this.chatConfig.compactMode ? 200 : 280;
    
    // Main chat panel
    this.chatPanel = this.createGothicPanel(0, 0, panelWidth, panelHeight, 0.9);
    
    // Channel tabs
    this.createChannelTabs();
    
    // Messages area
    this.createMessagesArea();
    
    // Input area
    this.createInputArea();
    
    // Scroll bar
    this.createScrollBar();
    
    // Initial message display
    this.updateMessageDisplay();
    
    // Setup keyboard input
    this.setupKeyboardInput();
  }

  private createChannelTabs(): void {
    const panelWidth = this.chatConfig.compactMode ? 350 : 450;
    const tabHeight = 25;
    const tabWidth = Math.floor((panelWidth - 20) / this.availableChannels.length);
    
    this.channelTabs = new Map();
    
    this.availableChannels.forEach((channel, index) => {
      const x = 10 + (index * tabWidth);
      const y = 5;
      
      const tabContainer = this.scene.add.container(x, y);
      this.addElement(tabContainer);
      
      // Tab background
      const background = this.scene.add.graphics();
      const isActive = channel === this.activeChannel;
      background.fillStyle(isActive ? 0x8B0000 : 0x2F2F2F, 0.8);
      background.fillRoundedRect(0, 0, tabWidth - 2, tabHeight, 4);
      background.lineStyle(1, isActive ? 0xDC143C : 0x666666);
      background.strokeRoundedRect(0, 0, tabWidth - 2, tabHeight, 4);
      tabContainer.add(background);
      
      // Tab text
      const tabText = this.scene.add.text(tabWidth / 2 - 1, tabHeight / 2, this.getChannelDisplayName(channel), {
        fontSize: `${10 * this.uiScale}px`,
        color: isActive ? '#F5F5DC' : '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      tabContainer.add(tabText);
      
      // Unread indicator (initially hidden)
      const unreadIndicator = this.scene.add.graphics();
      unreadIndicator.fillStyle(0xFF4444);
      unreadIndicator.fillCircle(tabWidth - 8, 8, 6);
      unreadIndicator.setVisible(false);
      tabContainer.add(unreadIndicator);
      
      // Interactive area
      const hitArea = this.scene.add.rectangle(tabWidth / 2 - 1, tabHeight / 2, tabWidth - 2, tabHeight, 0x000000, 0)
        .setInteractive();
      tabContainer.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        this.switchToChannel(channel);
      });
      
      this.channelTabs.set(channel, {
        container: tabContainer,
        background,
        text: tabText,
        unreadIndicator,
        unreadCount: 0
      });
    });
  }

  private createMessagesArea(): void {
    const panelWidth = this.chatConfig.compactMode ? 350 : 450;
    const panelHeight = this.chatConfig.compactMode ? 200 : 280;
    const messagesHeight = panelHeight - 60; // Account for tabs and input
    
    this.messagesContainer = this.scene.add.container(10, 35);
    this.addElement(this.messagesContainer);
    
    // Messages background
    const messagesBg = this.scene.add.graphics();
    messagesBg.fillStyle(0x000000, 0.6);
    messagesBg.fillRoundedRect(0, 0, panelWidth - 40, messagesHeight, 4);
    messagesBg.lineStyle(1, 0x666666);
    messagesBg.strokeRoundedRect(0, 0, panelWidth - 40, messagesHeight, 4);
    this.messagesContainer.add(messagesBg);
    
    // Set up clipping mask for messages
    const maskShape = this.scene.add.graphics();
    maskShape.fillRect(10, 35, panelWidth - 40, messagesHeight);
    const mask = maskShape.createGeometryMask();
    this.messagesContainer.setMask(mask);
    
    this.maxVisibleMessages = Math.floor(messagesHeight / 18); // 18px per message line
  }

  private createInputArea(): void {
    const panelWidth = this.chatConfig.compactMode ? 350 : 450;
    const panelHeight = this.chatConfig.compactMode ? 200 : 280;
    const inputY = panelHeight - 25;
    
    this.inputContainer = this.scene.add.container(10, inputY);
    this.addElement(this.inputContainer);
    
    // Input background
    this.inputBackground = this.scene.add.graphics();
    this.inputBackground.fillStyle(0x1a1a1a, 0.9);
    this.inputBackground.fillRoundedRect(0, 0, panelWidth - 40, 20, 4);
    this.inputBackground.lineStyle(1, this.isInputActive ? 0xDC143C : 0x666666);
    this.inputBackground.strokeRoundedRect(0, 0, panelWidth - 40, 20, 4);
    this.inputContainer.add(this.inputBackground);
    
    // Input text
    this.inputText = this.scene.add.text(5, 10, this.getInputPrompt(), {
      fontSize: `${11 * this.uiScale}px`,
      color: this.isInputActive ? '#F5F5DC' : '#999999',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0, 0.5);
    this.inputContainer.add(this.inputText);
    
    // Interactive area for input focus
    const inputHitArea = this.scene.add.rectangle(
      (panelWidth - 40) / 2, 10, panelWidth - 40, 20, 0x000000, 0
    ).setInteractive();
    this.inputContainer.add(inputHitArea);
    
    inputHitArea.on('pointerdown', () => {
      this.activateInput();
    });
  }

  private createScrollBar(): void {
    const panelWidth = this.chatConfig.compactMode ? 350 : 450;
    const panelHeight = this.chatConfig.compactMode ? 200 : 280;
    const messagesHeight = panelHeight - 60;
    const scrollBarX = panelWidth - 25;
    
    this.scrollBar = {
      track: this.scene.add.graphics(),
      thumb: this.scene.add.graphics(),
      position: 0
    };
    
    // Scroll track
    this.scrollBar.track.fillStyle(0x2F2F2F, 0.6);
    this.scrollBar.track.fillRoundedRect(scrollBarX, 35, 10, messagesHeight, 5);
    this.addElement(this.scrollBar.track);
    
    // Scroll thumb
    const thumbHeight = Math.max(20, messagesHeight * (this.maxVisibleMessages / Math.max(this.messages.length, 1)));
    this.scrollBar.thumb.fillStyle(0x8B0000, 0.8);
    this.scrollBar.thumb.fillRoundedRect(scrollBarX + 1, 36, 8, thumbHeight, 4);
    this.addElement(this.scrollBar.thumb);
    
    // Make thumb interactive
    const thumbHitArea = this.scene.add.rectangle(
      scrollBarX + 5, 36 + thumbHeight / 2, 8, thumbHeight, 0x000000, 0
    ).setInteractive({ draggable: true });
    this.addElement(thumbHitArea);
    
    thumbHitArea.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.handleScrollDrag(dragY);
    });
  }

  private setupKeyboardInput(): void {
    if (!this.scene.input.keyboard) return;
    
    // Enter key to activate/send chat
    const enterKey = this.scene.input.keyboard.addKey('ENTER');
    enterKey.on('down', () => {
      if (this.isInputActive) {
        this.sendMessage();
      } else {
        this.activateInput();
      }
    });
    
    // Escape to deactivate input
    const escapeKey = this.scene.input.keyboard.addKey('ESC');
    escapeKey.on('down', () => {
      if (this.isInputActive) {
        this.deactivateInput();
      }
    });
    
    // TODO: Implement actual text input when Phaser supports it better
    // For now, this is a simulation
  }

  private getChannelDisplayName(channel: ChatChannel): string {
    const names = {
      'general': 'General',
      'party': 'Party',
      'guild': 'Guild',
      'trade': 'Trade',
      'whisper': 'Whisper',
      'system': 'System',
      'combat': 'Combat',
      'loot': 'Loot'
    };
    return names[channel] || channel;
  }

  private getChannelColor(channel: ChatChannel): string {
    const colors = {
      'general': '#F5F5DC',
      'party': '#4169E1',
      'guild': '#32CD32',
      'trade': '#FFD700',
      'whisper': '#FF69B4',
      'system': '#FFA500',
      'combat': '#FF4444',
      'loot': '#00FF7F'
    };
    return colors[channel] || '#F5F5DC';
  }

  private getInputPrompt(): string {
    if (!this.isInputActive) {
      return 'Press Enter to chat...';
    }
    
    const prompts = {
      'general': 'Say: ',
      'party': 'Party: ',
      'guild': 'Guild: ',
      'trade': 'Trade: ',
      'whisper': 'Whisper: ',
      'system': 'System: '
    };
    
    return prompts[this.activeChannel] || 'Chat: ';
  }

  private switchToChannel(channel: ChatChannel): void {
    if (channel === this.activeChannel) return;
    
    // Update old tab
    const oldTab = this.channelTabs?.get(this.activeChannel);
    if (oldTab) {
      oldTab.background.clear();
      oldTab.background.fillStyle(0x2F2F2F, 0.8);
      oldTab.background.fillRoundedRect(0, 0, 
        Math.floor(((this.chatConfig.compactMode ? 350 : 450) - 20) / this.availableChannels.length) - 2, 25, 4);
      oldTab.background.lineStyle(1, 0x666666);
      oldTab.background.strokeRoundedRect(0, 0, 
        Math.floor(((this.chatConfig.compactMode ? 350 : 450) - 20) / this.availableChannels.length) - 2, 25, 4);
      oldTab.text.setColor('#C0C0C0');
    }
    
    // Update new tab
    const newTab = this.channelTabs?.get(channel);
    if (newTab) {
      newTab.background.clear();
      newTab.background.fillStyle(0x8B0000, 0.8);
      newTab.background.fillRoundedRect(0, 0, 
        Math.floor(((this.chatConfig.compactMode ? 350 : 450) - 20) / this.availableChannels.length) - 2, 25, 4);
      newTab.background.lineStyle(1, 0xDC143C);
      newTab.background.strokeRoundedRect(0, 0, 
        Math.floor(((this.chatConfig.compactMode ? 350 : 450) - 20) / this.availableChannels.length) - 2, 25, 4);
      newTab.text.setColor('#F5F5DC');
      
      // Clear unread indicator
      newTab.unreadIndicator?.setVisible(false);
      newTab.unreadCount = 0;
    }
    
    this.activeChannel = channel;
    this.updateMessageDisplay();
    this.updateInputPrompt();
    
    console.log(`Switched to ${channel} channel`);
  }

  private updateInputPrompt(): void {
    if (this.inputText) {
      this.inputText.setText(this.getInputPrompt());
      this.inputText.setColor(this.isInputActive ? '#F5F5DC' : '#999999');
    }
  }

  private activateInput(): void {
    this.isInputActive = true;
    this.currentInput = '';
    
    if (this.inputBackground) {
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0x1a1a1a, 0.9);
      this.inputBackground.fillRoundedRect(0, 0, 
        (this.chatConfig.compactMode ? 350 : 450) - 40, 20, 4);
      this.inputBackground.lineStyle(2, 0xDC143C);
      this.inputBackground.strokeRoundedRect(0, 0, 
        (this.chatConfig.compactMode ? 350 : 450) - 40, 20, 4);
    }
    
    this.updateInputPrompt();
  }

  private deactivateInput(): void {
    this.isInputActive = false;
    this.currentInput = '';
    
    if (this.inputBackground) {
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0x1a1a1a, 0.9);
      this.inputBackground.fillRoundedRect(0, 0, 
        (this.chatConfig.compactMode ? 350 : 450) - 40, 20, 4);
      this.inputBackground.lineStyle(1, 0x666666);
      this.inputBackground.strokeRoundedRect(0, 0, 
        (this.chatConfig.compactMode ? 350 : 450) - 40, 20, 4);
    }
    
    this.updateInputPrompt();
  }

  private sendMessage(): void {
    if (!this.currentInput.trim()) {
      this.deactivateInput();
      return;
    }
    
    // Handle slash commands
    if (this.currentInput.startsWith('/')) {
      this.handleSlashCommand(this.currentInput);
    } else {
      // Send regular message
      this.addMessage({
        id: `msg_${Date.now()}`,
        channel: this.activeChannel,
        sender: 'You',
        content: this.currentInput,
        timestamp: new Date(),
        type: 'message',
        isFromPlayer: true
      });
    }
    
    this.deactivateInput();
  }

  private handleSlashCommand(command: string): void {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    
    switch (cmd) {
      case '/w':
      case '/whisper':
        if (parts.length >= 3) {
          const target = parts[1];
          const message = parts.slice(2).join(' ');
          this.addMessage({
            id: `msg_${Date.now()}`,
            channel: 'whisper',
            sender: 'You',
            content: `to [${target}]: ${message}`,
            timestamp: new Date(),
            type: 'message',
            color: '#FF69B4',
            isFromPlayer: true
          });
        }
        break;
        
      case '/g':
      case '/guild':
        if (parts.length >= 2) {
          const message = parts.slice(1).join(' ');
          this.addMessage({
            id: `msg_${Date.now()}`,
            channel: 'guild',
            sender: 'You',
            content: message,
            timestamp: new Date(),
            type: 'message',
            isFromPlayer: true
          });
        }
        break;
        
      case '/p':
      case '/party':
        if (parts.length >= 2) {
          const message = parts.slice(1).join(' ');
          this.addMessage({
            id: `msg_${Date.now()}`,
            channel: 'party',
            sender: 'You',
            content: message,
            timestamp: new Date(),
            type: 'message',
            isFromPlayer: true
          });
        }
        break;
        
      case '/emote':
      case '/me':
        if (parts.length >= 2) {
          const emote = parts.slice(1).join(' ');
          this.addMessage({
            id: `msg_${Date.now()}`,
            channel: this.activeChannel,
            sender: 'You',
            content: `*${emote}*`,
            timestamp: new Date(),
            type: 'emote',
            color: '#DDA0DD',
            isFromPlayer: true
          });
        }
        break;
        
      default:
        this.addMessage({
          id: `msg_${Date.now()}`,
          channel: 'system',
          sender: 'System',
          content: `Unknown command: ${cmd}`,
          timestamp: new Date(),
          type: 'system',
          color: '#FF4444'
        });
        break;
    }
  }

  private updateMessageDisplay(): void {
    // Clear existing message elements
    this.messageElements.forEach(element => element.destroy());
    this.messageElements = [];
    
    // Filter messages for active channel
    const channelMessages = this.messages.filter(msg => 
      msg.channel === this.activeChannel || 
      (this.activeChannel === 'general' && ['system', 'combat', 'loot'].includes(msg.channel))
    );
    
    // Calculate visible messages based on scroll position
    const startIndex = Math.max(0, channelMessages.length - this.maxVisibleMessages + this.scrollPosition);
    const endIndex = Math.min(channelMessages.length, startIndex + this.maxVisibleMessages);
    
    const visibleMessages = channelMessages.slice(startIndex, endIndex);
    
    // Display messages
    visibleMessages.forEach((message, index) => {
      const y = index * 18 + 10;
      const messageText = this.formatMessage(message);
      const color = message.color || this.getChannelColor(message.channel);
      
      const textElement = this.scene.add.text(5, y, messageText, {
        fontSize: `${11 * this.uiScale}px`,
        color: color,
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: (this.chatConfig.compactMode ? 350 : 450) - 60 }
      });
      
      this.messagesContainer?.add(textElement);
      this.messageElements.push(textElement);
    });
  }

  private formatMessage(message: ChatMessage): string {
    let formatted = '';
    
    if (this.chatConfig.showTimestamps) {
      const time = message.timestamp.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      formatted += `[${time}] `;
    }
    
    if (message.type === 'emote') {
      formatted += message.content;
    } else if (message.type === 'system') {
      formatted += message.content;
    } else {
      formatted += `${message.sender}: ${message.content}`;
    }
    
    return formatted;
  }

  private handleScrollDrag(dragY: number): void {
    const panelHeight = this.chatConfig.compactMode ? 200 : 280;
    const messagesHeight = panelHeight - 60;
    const scrollRange = messagesHeight - 40; // Account for thumb height
    
    const normalizedPosition = Math.max(0, Math.min(1, (dragY - 36) / scrollRange));
    const maxScroll = Math.max(0, this.messages.length - this.maxVisibleMessages);
    
    this.scrollPosition = Math.floor(normalizedPosition * maxScroll);
    this.updateMessageDisplay();
  }

  public addMessage(message: ChatMessage): void {
    this.messages.push(message);
    
    // Trim messages if over limit
    if (this.messages.length > this.chatConfig.maxMessages!) {
      this.messages.shift();
    }
    
    // Update unread indicators for inactive channels
    if (message.channel !== this.activeChannel && !message.isFromPlayer) {
      const tab = this.channelTabs?.get(message.channel);
      if (tab) {
        tab.unreadCount++;
        tab.unreadIndicator?.setVisible(true);
      }
    }
    
    // Auto-scroll to bottom if we're at the bottom
    if (this.scrollPosition === 0) {
      this.updateMessageDisplay();
    }
    
    this.scene.events.emit('chat:message:added', message);
  }

  public sendSystemMessage(content: string, channel: ChatChannel = 'system'): void {
    this.addMessage({
      id: `sys_${Date.now()}`,
      channel,
      sender: 'System',
      content,
      timestamp: new Date(),
      type: 'system',
      color: '#FFA500'
    });
  }

  public sendCombatMessage(content: string): void {
    this.addMessage({
      id: `combat_${Date.now()}`,
      channel: 'combat',
      sender: '',
      content,
      timestamp: new Date(),
      type: 'combat',
      color: '#FF4444'
    });
  }

  public sendLootMessage(content: string): void {
    this.addMessage({
      id: `loot_${Date.now()}`,
      channel: 'loot',
      sender: '',
      content,
      timestamp: new Date(),
      type: 'loot',
      color: '#00FF7F'
    });
  }

  private initializeSampleMessages(): void {
    const sampleMessages: ChatMessage[] = [
      {
        id: 'sample_1',
        channel: 'general',
        sender: 'DarkKnight_92',
        content: 'Anyone up for the Whispering Woods dungeon?',
        timestamp: new Date(Date.now() - 300000),
        type: 'message'
      },
      {
        id: 'sample_2',
        channel: 'general',
        sender: 'MysticMage',
        content: 'I can heal! Level 8 Oracle here.',
        timestamp: new Date(Date.now() - 240000),
        type: 'message'
      },
      {
        id: 'sample_3',
        channel: 'guild',
        sender: 'GuildMaster_Aldric',
        content: 'Guild meeting tonight at 8 PM! Important announcements.',
        timestamp: new Date(Date.now() - 180000),
        type: 'message'
      },
      {
        id: 'sample_4',
        channel: 'trade',
        sender: 'MerchantBob',
        content: 'WTS [Iron Sword] - 50 gold! Whisper me!',
        timestamp: new Date(Date.now() - 120000),
        type: 'message'
      },
      {
        id: 'sample_5',
        channel: 'party',
        sender: 'SilentBlade',
        content: 'Ready for the boss fight?',
        timestamp: new Date(Date.now() - 60000),
        type: 'message'
      },
      {
        id: 'sample_6',
        channel: 'system',
        sender: 'System',
        content: 'Server maintenance in 1 hour.',
        timestamp: new Date(Date.now() - 30000),
        type: 'system',
        color: '#FFA500'
      }
    ];
    
    sampleMessages.forEach(msg => this.addMessage(msg));
  }

  public clearChannel(channel: ChatChannel): void {
    this.messages = this.messages.filter(msg => msg.channel !== channel);
    this.updateMessageDisplay();
  }

  public setTimestampsVisible(visible: boolean): void {
    this.chatConfig.showTimestamps = visible;
    this.updateMessageDisplay();
  }

  protected onResize(width: number, height: number): void {
    // Recreate chat system with new dimensions
    this.elements.forEach(element => element.destroy());
    this.elements = [];
    this.channelTabs?.clear();
    this.messageElements = [];
    this.create();
  }
}
