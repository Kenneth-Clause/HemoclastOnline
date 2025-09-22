/**
 * Party Frames Component
 * Group members' HP/Mana/Energy with role indicators and range/LoS indication
 */

import { UIComponent, UIComponentConfig } from './UIComponent';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface PartyMember {
  id: string;
  name: string;
  level: number;
  class: string;
  role: 'tank' | 'dps' | 'healer';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  energy?: number;
  maxEnergy?: number;
  isOnline: boolean;
  isInRange: boolean;
  hasLineOfSight: boolean;
  isLeader: boolean;
  buffs: Array<{
    id: string;
    name: string;
    icon: string;
    duration: number;
  }>;
  debuffs: Array<{
    id: string;
    name: string;
    icon: string;
    duration: number;
  }>;
}

export interface PartyFramesConfig extends UIComponentConfig {
  maxMembers?: number;
  showBuffs?: boolean;
  compactMode?: boolean;
  verticalLayout?: boolean;
}

export class PartyFrames extends UIComponent {
  private party: PartyMember[] = [];
  private memberFrames: Map<string, {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Graphics;
    portrait: Phaser.GameObjects.Text;
    nameText: Phaser.GameObjects.Text;
    levelText: Phaser.GameObjects.Text;
    roleIcon: Phaser.GameObjects.Text;
    leaderIcon?: Phaser.GameObjects.Text;
    healthBar: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
    resourceBar: { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics };
    healthText: Phaser.GameObjects.Text;
    resourceText: Phaser.GameObjects.Text;
    statusOverlay: Phaser.GameObjects.Graphics;
    buffsContainer: Phaser.GameObjects.Container;
  }> = new Map();
  
  private partyFramesConfig: PartyFramesConfig;

  constructor(scene: Phaser.Scene, config: PartyFramesConfig = {}) {
    super(scene, config);
    
    this.partyFramesConfig = {
      maxMembers: 5,
      showBuffs: true,
      compactMode: false,
      verticalLayout: true,
      ...config
    };
    
    // Re-create the UI now that config is set
    this.container.removeAll(true);
    this.elements = [];
    this.createPartyFrames();
    
    // Re-setup interactivity now that UI is created
    this.setupInteractivity();
  }

  protected create(): void {
    // Empty - we'll create after config is set
  }

  private createPartyFrames(): void {
    // Initially empty - frames are created as party members are added
    this.updatePartyDisplay();
  }

  public setParty(members: PartyMember[]): void {
    this.party = members.slice(0, this.partyFramesConfig.maxMembers);
    this.updatePartyDisplay();
  }

  public addPartyMember(member: PartyMember): void {
    if (this.party.length >= this.partyFramesConfig.maxMembers!) return;
    
    this.party.push(member);
    this.updatePartyDisplay();
  }

  public removePartyMember(memberId: string): void {
    this.party = this.party.filter(member => member.id !== memberId);
    this.updatePartyDisplay();
  }

  public updatePartyMember(memberId: string, updates: Partial<PartyMember>): void {
    const member = this.party.find(m => m.id === memberId);
    if (member) {
      Object.assign(member, updates);
      this.updateMemberFrame(memberId);
    }
  }

  private updatePartyDisplay(): void {
    // Clear existing frames
    this.memberFrames.forEach((frame) => {
      frame.container.destroy();
    });
    this.memberFrames.clear();

    // Create frames for current party members
    this.party.forEach((member, index) => {
      this.createMemberFrame(member, index);
    });
  }

  private createMemberFrame(member: PartyMember, index: number): void {
    const frameWidth = this.partyFramesConfig.compactMode ? 180 : 220;
    const frameHeight = this.partyFramesConfig.compactMode ? 60 : 80;
    const spacing = 10;
    
    // Calculate position
    const x = this.partyFramesConfig.verticalLayout ? 0 : index * (frameWidth + spacing);
    const y = this.partyFramesConfig.verticalLayout ? index * (frameHeight + spacing) : 0;
    
    // Create member container
    const memberContainer = this.scene.add.container(x, y);
    this.addElement(memberContainer);
    
    // Frame background
    const background = this.scene.add.graphics();
    this.updateFrameBackground(background, member, frameWidth, frameHeight);
    memberContainer.add(background);
    
    // Portrait
    const portraitSize = this.partyFramesConfig.compactMode ? 40 : 50;
    const portrait = this.scene.add.text(
      10 + portraitSize / 2,
      frameHeight / 2,
      this.getClassIcon(member.class),
      {
        fontSize: `${portraitSize * 0.6}px`,
        color: this.getRoleColor(member.role)
      }
    ).setOrigin(0.5);
    memberContainer.add(portrait);
    
    // Member name
    const nameText = this.scene.add.text(
      portraitSize + 20,
      10,
      member.name,
      ResponsiveLayout.getTextStyle(14, this.scene.scale.width, this.scene.scale.height, {
        color: member.isOnline ? '#F5F5DC' : '#666666',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    memberContainer.add(nameText);
    
    // Level and class
    const levelText = this.scene.add.text(
      portraitSize + 20,
      28,
      `${member.level} ${member.class}`,
      ResponsiveLayout.getTextStyle(10, this.scene.scale.width, this.scene.scale.height, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      })
    );
    memberContainer.add(levelText);
    
    // Role icon
    const roleIcon = this.scene.add.text(
      frameWidth - 25,
      15,
      this.getRoleIcon(member.role),
      {
        fontSize: `${16 * this.uiScale}px`,
        color: this.getRoleColor(member.role)
      }
    ).setOrigin(0.5);
    memberContainer.add(roleIcon);
    
    // Leader icon (if applicable)
    let leaderIcon: Phaser.GameObjects.Text | undefined;
    if (member.isLeader) {
      leaderIcon = this.scene.add.text(
        frameWidth - 45,
        15,
        '👑',
        {
          fontSize: `${14 * this.uiScale}px`
        }
      ).setOrigin(0.5);
      memberContainer.add(leaderIcon);
    }
    
    // Health bar
    const healthBarY = this.partyFramesConfig.compactMode ? 45 : 50;
    const barWidth = frameWidth - portraitSize - 30;
    const barHeight = 12;
    
    const healthBar = this.createMemberResourceBar(
      portraitSize + 20,
      healthBarY,
      barWidth,
      barHeight,
      '#8B0000',
      member.health / member.maxHealth,
      memberContainer
    );
    
    // Resource bar (mana/energy)
    const resourceBarY = healthBarY + 15;
    const resourceType = member.energy !== undefined ? 'energy' : 'mana';
    const resourceValue = resourceType === 'energy' ? member.energy! : member.mana;
    const maxResourceValue = resourceType === 'energy' ? member.maxEnergy! : member.maxMana;
    const resourceColor = resourceType === 'energy' ? '#228B22' : '#4B0082';
    
    const resourceBar = this.createMemberResourceBar(
      portraitSize + 20,
      resourceBarY,
      barWidth,
      barHeight,
      resourceColor,
      resourceValue / maxResourceValue,
      memberContainer
    );
    
    // Health text
    const healthText = this.scene.add.text(
      portraitSize + 20 + barWidth / 2,
      healthBarY + barHeight / 2,
      this.partyFramesConfig.compactMode ? 
        `${Math.round((member.health / member.maxHealth) * 100)}%` :
        `${member.health}/${member.maxHealth}`,
      {
        fontSize: `${9 * this.uiScale}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      }
    ).setOrigin(0.5);
    memberContainer.add(healthText);
    
    // Resource text
    const resourceText = this.scene.add.text(
      portraitSize + 20 + barWidth / 2,
      resourceBarY + barHeight / 2,
      this.partyFramesConfig.compactMode ? 
        `${Math.round((resourceValue / maxResourceValue) * 100)}%` :
        `${resourceValue}/${maxResourceValue}`,
      {
        fontSize: `${9 * this.uiScale}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontWeight: 'bold'
      }
    ).setOrigin(0.5);
    memberContainer.add(resourceText);
    
    // Status overlay (for out of range/LoS indicators)
    const statusOverlay = this.scene.add.graphics();
    this.updateStatusOverlay(statusOverlay, member, frameWidth, frameHeight);
    memberContainer.add(statusOverlay);
    
    // Buffs container
    const buffsContainer = this.scene.add.container(portraitSize + 20, frameHeight - 20);
    memberContainer.add(buffsContainer);
    
    // Store frame elements
    this.memberFrames.set(member.id, {
      container: memberContainer,
      background,
      portrait,
      nameText,
      levelText,
      roleIcon,
      leaderIcon,
      healthBar,
      resourceBar,
      healthText,
      resourceText,
      statusOverlay,
      buffsContainer
    });
    
    // Update buffs display
    if (this.partyFramesConfig.showBuffs) {
      this.updateMemberBuffs(member.id);
    }
    
    // Make frame interactive
    this.setupMemberFrameInteractivity(member);
  }

  private createMemberResourceBar(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    fillPercent: number,
    container: Phaser.GameObjects.Container
  ) {
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(x, y, width, height, height / 2);
    bg.lineStyle(1, 0x666666);
    bg.strokeRoundedRect(x, y, width, height, height / 2);
    container.add(bg);
    
    // Fill
    const fill = this.scene.add.graphics();
    fill.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    fill.fillRoundedRect(x + 1, y + 1, (width - 2) * fillPercent, height - 2, (height - 2) / 2);
    container.add(fill);
    
    return { bg, fill };
  }

  private updateFrameBackground(
    background: Phaser.GameObjects.Graphics,
    member: PartyMember,
    width: number,
    height: number
  ): void {
    background.clear();
    
    // Base background
    background.fillStyle(0x0a0a0a, 0.9);
    background.fillRoundedRect(0, 0, width, height, 8 * this.uiScale);
    
    // Border color based on member status
    let borderColor = 0x8B0000; // Default red
    if (!member.isOnline) {
      borderColor = 0x666666; // Gray for offline
    } else if (!member.isInRange || !member.hasLineOfSight) {
      borderColor = 0xFFD700; // Gold for out of range/LoS
    }
    
    background.lineStyle(2 * this.uiScale, borderColor);
    background.strokeRoundedRect(0, 0, width, height, 8 * this.uiScale);
  }

  private updateStatusOverlay(
    overlay: Phaser.GameObjects.Graphics,
    member: PartyMember,
    width: number,
    height: number
  ): void {
    overlay.clear();
    
    if (!member.isOnline) {
      // Gray overlay for offline members
      overlay.fillStyle(0x000000, 0.6);
      overlay.fillRoundedRect(0, 0, width, height, 8 * this.uiScale);
    } else if (!member.isInRange || !member.hasLineOfSight) {
      // Subtle overlay for out of range/LoS
      overlay.fillStyle(0xFFD700, 0.1);
      overlay.fillRoundedRect(0, 0, width, height, 8 * this.uiScale);
    }
  }

  private updateMemberBuffs(memberId: string): void {
    const member = this.party.find(m => m.id === memberId);
    const frame = this.memberFrames.get(memberId);
    if (!member || !frame) return;
    
    // Clear existing buff icons
    frame.buffsContainer.removeAll(true);
    
    const iconSize = 16 * this.uiScale;
    const iconSpacing = 2 * this.uiScale;
    const maxIcons = 6; // Limit to prevent overflow
    
    // Show most important buffs/debuffs first
    const allEffects = [...member.buffs, ...member.debuffs]
      .sort((a, b) => b.duration - a.duration) // Longest duration first
      .slice(0, maxIcons);
    
    allEffects.forEach((effect, index) => {
      const x = index * (iconSize + iconSpacing);
      const y = 0;
      
      // Effect background
      const isDebuff = member.debuffs.some(d => d.id === effect.id);
      const bgColor = isDebuff ? 0x8B0000 : 0x228B22;
      
      const effectBg = this.scene.add.graphics();
      effectBg.fillStyle(bgColor, 0.8);
      effectBg.fillRoundedRect(x, y, iconSize, iconSize, 2);
      frame.buffsContainer.add(effectBg);
      
      // Effect icon
      const effectIcon = this.scene.add.text(
        x + iconSize / 2,
        y + iconSize / 2,
        effect.icon,
        {
          fontSize: `${iconSize * 0.7}px`,
          color: '#FFFFFF'
        }
      ).setOrigin(0.5);
      frame.buffsContainer.add(effectIcon);
    });
  }

  private setupMemberFrameInteractivity(member: PartyMember): void {
    const frame = this.memberFrames.get(member.id);
    if (!frame) return;
    
    const frameWidth = this.partyFramesConfig.compactMode ? 180 : 220;
    const frameHeight = this.partyFramesConfig.compactMode ? 60 : 80;
    
    // Interactive area
    const hitArea = this.scene.add.rectangle(
      frameWidth / 2,
      frameHeight / 2,
      frameWidth,
      frameHeight,
      0x000000,
      0
    ).setInteractive();
    frame.container.add(hitArea);
    
    // Click to target
    hitArea.on('pointerdown', () => {
      this.scene.events.emit('party:member:selected', member);
    });
    
    // Right-click for context menu
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.scene.events.emit('party:member:context', member);
      }
    });
    
    // Hover effects
    hitArea.on('pointerover', () => {
      frame.background.setAlpha(1.2);
    });
    
    hitArea.on('pointerout', () => {
      frame.background.setAlpha(1.0);
    });
  }

  private updateMemberFrame(memberId: string): void {
    const member = this.party.find(m => m.id === memberId);
    const frame = this.memberFrames.get(memberId);
    if (!member || !frame) return;
    
    const frameWidth = this.partyFramesConfig.compactMode ? 180 : 220;
    const frameHeight = this.partyFramesConfig.compactMode ? 60 : 80;
    
    // Update background based on status
    this.updateFrameBackground(frame.background, member, frameWidth, frameHeight);
    
    // Update status overlay
    this.updateStatusOverlay(frame.statusOverlay, member, frameWidth, frameHeight);
    
    // Update name color based on online status
    frame.nameText.setColor(member.isOnline ? '#F5F5DC' : '#666666');
    
    // Update health bar
    const healthPercent = member.health / member.maxHealth;
    this.updateMemberResourceBarFill(frame.healthBar.fill, healthPercent, '#8B0000');
    
    // Update resource bar
    const resourceType = member.energy !== undefined ? 'energy' : 'mana';
    const resourceValue = resourceType === 'energy' ? member.energy! : member.mana;
    const maxResourceValue = resourceType === 'energy' ? member.maxEnergy! : member.maxMana;
    const resourceColor = resourceType === 'energy' ? '#228B22' : '#4B0082';
    const resourcePercent = resourceValue / maxResourceValue;
    
    this.updateMemberResourceBarFill(frame.resourceBar.fill, resourcePercent, resourceColor);
    
    // Update text displays
    frame.healthText.setText(
      this.partyFramesConfig.compactMode ? 
        `${Math.round(healthPercent * 100)}%` :
        `${member.health}/${member.maxHealth}`
    );
    
    frame.resourceText.setText(
      this.partyFramesConfig.compactMode ? 
        `${Math.round(resourcePercent * 100)}%` :
        `${resourceValue}/${maxResourceValue}`
    );
    
    // Update buffs
    if (this.partyFramesConfig.showBuffs) {
      this.updateMemberBuffs(memberId);
    }
  }

  private updateMemberResourceBarFill(
    fill: Phaser.GameObjects.Graphics,
    percent: number,
    color: string
  ): void {
    // This is a simplified version - in practice you'd store the original dimensions
    fill.clear();
    fill.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    // Would need to recreate with stored dimensions and new percentage
  }

  private getClassIcon(className: string): string {
    const icons: { [key: string]: string } = {
      'Fighter': '⚔️',
      'Guardian': '🛡️',
      'Berserker': '🪓',
      'Wizard': '🔮',
      'Elementalist': '🔥',
      'Arcanist': '✨',
      'Rogue': '🗡️',
      'Assassin': '💀',
      'Duelist': '⚔️',
      'Cleric': '✨',
      'Templar': '⚡',
      'Oracle': '🌟'
    };
    return icons[className] || '👤';
  }

  private getRoleIcon(role: PartyMember['role']): string {
    const icons = {
      'tank': '🛡️',
      'dps': '⚔️',
      'healer': '✚'
    };
    return icons[role];
  }

  private getRoleColor(role: PartyMember['role']): string {
    const colors = {
      'tank': '#4169E1',
      'dps': '#DC143C',
      'healer': '#32CD32'
    };
    return colors[role];
  }

  protected onResize(width: number, height: number): void {
    // Recreate all member frames with new dimensions
    this.updatePartyDisplay();
  }
}
