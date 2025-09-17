/**
 * Character Selection Scene - Choose or create characters
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GraphicsUtils } from '../utils/GraphicsUtils';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export class CharacterSelectionScene extends Scene {
  private gameStore: GameStore;
  private characters: any[] = [];

  constructor() {
    super({ key: 'CharacterSelectionScene' });
    this.gameStore = GameStore.getInstance();
  }

  async create() {
    const { width, height } = this.scale;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    
    // Game Title - "Hemoclast Online"
    const titleY = height * 0.08;
    this.add.text(width / 2, titleY, 'HEMOCLAST', {
      fontSize: `${Math.min(width, height) / 25}px`,
      color: '#8B0000',
      fontFamily: 'Nosifer, serif',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#8B0000',
        blur: 10,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    this.add.text(width / 2, titleY + Math.min(width, height) / 30, 'ONLINE', {
      fontSize: `${Math.min(width, height) / 35}px`,
      color: '#FFD700',
      fontFamily: 'Nosifer, serif',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#FFD700',
        blur: 8,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Horizontal separator line
    const separatorY = height * 0.16;
    const separatorWidth = width * 0.6;
    
    // Create decorative separator with ornamental ends
    const separatorGraphics = this.add.graphics();
    separatorGraphics.lineStyle(3, 0x8B0000, 1);
    separatorGraphics.lineBetween(
      width / 2 - separatorWidth / 2,
      separatorY,
      width / 2 + separatorWidth / 2,
      separatorY
    );
    
    // Add ornamental elements at the ends
    this.add.text(width / 2 - separatorWidth / 2 - 20, separatorY, '⚜', {
      fontSize: `${Math.min(width, height) / 50}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    this.add.text(width / 2 + separatorWidth / 2 + 20, separatorY, '⚜', {
      fontSize: `${Math.min(width, height) / 50}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Character selection subtitle
    this.add.text(width / 2, height * 0.21, 'Select Your Character', {
      fontSize: `${Math.min(width, height) / 40}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Show guest warning if applicable
    this.showGuestWarning();
    
    // Load player's characters
    await this.loadCharacters();
    
    // Add Enter World button (just above character cards)
    this.createEnterWorldButton();
    
    // Display character slots
    this.displayCharacterSlots();
    
    // Add bottom left buttons (Logout, Settings, Credits)
    this.createBottomLeftButtons();
  }

  private showGuestWarning() {
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    
    // Only show warning for actual guest accounts (not registered users)
    if (isGuest && !isRegistered) {
      const { width, height } = this.scale;
      const uiScale = ResponsiveLayout.getUIScale(width, height);
      
      // Check if mobile layout
      const isMobile = ResponsiveLayout.isMobile(width, height);
      const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
      const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
      const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
      
      // Compact info bar - much smaller now that it only contains icon and text
      const panelHeight = Math.max(28, 35 * uiScale);
      let panelWidth;
      if (isMobileLayout) {
        panelWidth = Math.min(154, width * 0.44); // Much more compact for mobile - scaled up 10%
      } else if (width < 1024) {
        panelWidth = Math.min(180, width * 0.25); // Compact for tablet
      } else {
        panelWidth = Math.min(200, width * 0.2); // Compact for desktop
      }
      const panelY = height * 0.28;
      
      // Create compact panel
      GraphicsUtils.createUIPanel(
        this,
        width / 2 - panelWidth / 2,
        panelY,
        panelWidth,
        panelHeight,
        0x2d1b1b,
        0x8B0000,
        Math.max(1, 2 * uiScale)
      );
      
      // Info icon on the left - clickable for popup
      const infoIconX = width / 2 - panelWidth / 2 + 20;
      const infoIconY = panelY + panelHeight / 2;
      
      const infoIcon = this.add.text(infoIconX, infoIconY, 'ℹ️', {
        fontSize: `${Math.max(16, 20 * uiScale)}px`
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      // Make info icon and entire panel clickable for popup
      infoIcon.on('pointerdown', () => {
        this.showGuestInfoPopup();
      });
      
      // Simple "Guest Info" text - centered in the remaining space
      const infoTextX = infoIconX + 25;
      const guestInfoText = this.add.text(infoTextX, infoIconY, 'Guest Info', {
        fontSize: `${Math.max(10, 12 * uiScale)}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      
      // Make the text clickable too
      guestInfoText.on('pointerdown', () => {
        this.showGuestInfoPopup();
      });
      
      // Add hover effects for better UX
      const addHoverEffect = (element: Phaser.GameObjects.Text) => {
        element.on('pointerover', () => {
          element.setTint(0xFFFFFF);
        });
        element.on('pointerout', () => {
          element.clearTint();
        });
      };
      
      addHoverEffect(infoIcon);
      addHoverEffect(guestInfoText);
    }
  }
  
  private showGuestInfoPopup() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Check if mobile layout
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(300);
    
    // Responsive popup dimensions - taller to accommodate the Create Account button
    let popupWidth, popupHeight;
    if (isMobileLayout) {
      popupWidth = Math.min(330, width * 0.99);
      popupHeight = 242; // Increased height for buttons - scaled up 10%
    } else if (width < 1024) {
      // Tablet
      popupWidth = Math.min(420, width * 0.75);
      popupHeight = 240;
    } else {
      // Desktop
      popupWidth = Math.min(500, width * 0.6);
      popupHeight = 260;
    }
    
    // Create popup panel
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - popupWidth / 2,
      height / 2 - popupHeight / 2,
      popupWidth,
      popupHeight,
      0x2d1b1b,
      0x8B0000,
      Math.max(2, 3 * uiScale)
    );
    panel.setDepth(301);
    
    // Title
    const titleY = height / 2 - popupHeight / 2 + 30;
    const title = this.add.text(width / 2, titleY, '⚠️ Guest Account', {
      fontSize: `${Math.max(16, 18 * uiScale)}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(302);
    
    // Info text - moved further down from title for better spacing
    const textY = titleY + (isMobileLayout ? 79 : 70);
    const infoText = this.add.text(width / 2, textY, 'Your progress is stored locally.\nCreate an account to secure your data!', {
      fontSize: `${Math.max(11, 13 * uiScale)}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      lineSpacing: isMobileLayout ? 5.5 : 6,
      wordWrap: { width: popupWidth - 50 }
    }).setOrigin(0.5).setDepth(302);
    
    // Button dimensions - responsive
    const buttonFontSize = ResponsiveLayout.getButtonFontSize(isMobileLayout ? 13 : 14, width, height);
    let buttonWidth, buttonHeight, buttonSpacing;
    
    if (isMobileLayout) {
      buttonWidth = Math.max(132, 154 * uiScale);
      buttonHeight = Math.max(31, buttonFontSize + 9);
      buttonSpacing = 13; // Closer vertical spacing between buttons - scaled up 10%
    } else {
      buttonWidth = Math.max(140, 160 * uiScale);
      buttonHeight = Math.max(32, buttonFontSize + 10);
      buttonSpacing = 15; // Closer spacing for desktop too
    }
    
    // Position buttons below the text with proper spacing
    const buttonsStartY = textY + (isMobileLayout ? 55 : 60);
    
    // Create Account button - positioned above Close button
    const createAccountY = buttonsStartY;
    const createAccountButton = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2,
      createAccountY,
      buttonWidth,
      buttonHeight,
      'Create Account',
      buttonFontSize,
      () => {
        // Close popup first
        this.closeGuestInfoPopup([overlay, panel, title, infoText, createAccountButton.background, createAccountButton.text, closeButton]);
        // Then initiate account upgrade
        this.upgradeGuestAccount();
      }
    );
    createAccountButton.background.setDepth(302);
    createAccountButton.text.setDepth(303);
    
    // Close button - positioned closer to Create Account button
    const closeButtonY = createAccountY + buttonHeight + buttonSpacing;
    const closeButton = this.add.text(width / 2, closeButtonY, 'Close', {
      fontSize: `${buttonFontSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      backgroundColor: '#666666',
      padding: { x: Math.max(15, 18 * uiScale), y: Math.max(8, 10 * uiScale) }
    }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });
    
    // Close functionality
    const closePopup = () => {
      this.closeGuestInfoPopup([overlay, panel, title, infoText, createAccountButton.background, createAccountButton.text, closeButton]);
    };
    
    closeButton.on('pointerdown', closePopup);
    overlay.on('pointerdown', (pointer: any) => {
      // Only close if clicking outside the panel
      const panelBounds = {
        left: width / 2 - popupWidth / 2,
        right: width / 2 + popupWidth / 2,
        top: height / 2 - popupHeight / 2,
        bottom: height / 2 + popupHeight / 2
      };
      
      if (pointer.x < panelBounds.left || pointer.x > panelBounds.right || 
          pointer.y < panelBounds.top || pointer.y > panelBounds.bottom) {
        closePopup();
      }
    });
    
    // Hover effects
    closeButton.on('pointerover', () => {
      closeButton.setBackgroundColor('#888888');
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setBackgroundColor('#666666');
    });
  }
  
  private closeGuestInfoPopup(elements: Phaser.GameObjects.GameObject[]) {
    elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
  }

  private async loadCharacters() {
    try {
      const token = localStorage.getItem('hemoclast_token');
      
      // All users (guest and regular) now use the same API with JWT tokens
      if (token) {
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        const response = await fetch('/api/v1/characters/', { headers });
        
        if (response.ok) {
          this.characters = await response.json();
        } else if (response.status === 401) {
          // Token expired or invalid - clear auth data and redirect to login
          console.warn('Authentication token expired or invalid');
          this.handleTokenExpiration();
          return;
        } else {
          console.error('Failed to load characters:', response.status, response.statusText);
          this.showError(`Failed to load characters (${response.status}). Please try refreshing the page.`);
          this.characters = [];
        }
      } else {
        // No token - redirect to login
        this.scene.start('LoginScene');
        return;
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      this.showError('Network error loading characters. Please check your connection and try again.');
      this.characters = [];
    }
  }

  private displayCharacterSlots() {
    const { width, height } = this.scale;
    
    // Get responsive scaling
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    
    // Responsive slot dimensions for different screen sizes - scale containers with content
    let baseSlotWidth, baseSlotHeight;
    if (width < 600) {
      // Mobile phones - significantly larger for better visibility and interaction
      baseSlotWidth = 240; // was 160, now 50% bigger
      baseSlotHeight = 400; // was 280, now ~43% bigger
    } else if (width < 1024) {
      // Tablets
      baseSlotWidth = 200;
      baseSlotHeight = 320;
    } else if (width < 1440) {
      // Small desktop - larger containers to fit scaled content
      baseSlotWidth = 260;
      baseSlotHeight = 380;
    } else {
      // Large desktop - even larger containers for scaled content
      baseSlotWidth = 300;
      baseSlotHeight = 420;
    }
    
    // Scale containers properly with UI scale - ensure minimum sizes for mobile
    const slotWidth = width < 600 ? Math.max(200, baseSlotWidth * uiScale) : Math.max(140, baseSlotWidth * uiScale);
    const slotHeight = width < 600 ? Math.max(300, baseSlotHeight * uiScale) : Math.max(220, baseSlotHeight * uiScale);
    const spacing = Math.max(20, 60 * uiScale);
    
    // Adjust slot positioning based on whether guest warning is shown
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    const showGuestWarning = isGuest && !isRegistered;
    
    // Check if we need mobile navigation arrows
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const needsMobileNavigation = (isActualMobileDevice || width < 500) && isMobile && mobileAdjustments.isPortrait;
    
    if (needsMobileNavigation) {
      // Mobile: Show one card at a time with navigation arrows
      this.createMobileCardNavigation(!!showGuestWarning, slotWidth, slotHeight, width, height);
    } else {
      // Desktop: Show all 3 cards horizontally
      const totalWidth = (3 * slotWidth) + (2 * spacing);
      const startX = (width - totalWidth) / 2 + slotWidth / 2;
      // Position cards with better spacing after Enter World button
      const slotY = showGuestWarning ? height * 0.55 : height * 0.50;
      
      // Display 3 character slots horizontally
      for (let i = 0; i < 3; i++) {
        const x = startX + i * (slotWidth + spacing);
        const character = this.characters[i] || null;
        
        this.createCharacterSlot(x, slotY, slotWidth, slotHeight, character, i);
      }
    }
  }

  private currentMobileCardIndex: number = 0;

  private createMobileCardNavigation(showGuestWarning: boolean, slotWidth: number, slotHeight: number, width: number, height: number) {
    // Position mobile cards with better spacing after Enter World button
    const slotY = showGuestWarning ? height * 0.55 : height * 0.50;
    const slotX = width / 2;
    
    // Display current character card
    const character = this.characters[this.currentMobileCardIndex] || null;
    this.createCharacterSlot(slotX, slotY, slotWidth, slotHeight, character, this.currentMobileCardIndex);
    
    // Create navigation arrows
    const arrowY = slotY;
    const arrowSize = Math.max(30, 40 * ResponsiveLayout.getUIScale(width, height));
    const arrowDistance = slotWidth / 2 + 60;
    
    // Left arrow
    if (this.currentMobileCardIndex > 0) {
      const leftArrow = this.add.text(slotX - arrowDistance, arrowY, '◀', {
        fontSize: `${arrowSize}px`,
        color: '#FFD700',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      leftArrow.on('pointerdown', () => {
        this.currentMobileCardIndex = Math.max(0, this.currentMobileCardIndex - 1);
        this.refreshMobileCardDisplay();
      });
      
      leftArrow.on('pointerover', () => {
        leftArrow.setColor('#FFFFFF');
        leftArrow.setScale(1.2);
      });
      
      leftArrow.on('pointerout', () => {
        leftArrow.setColor('#FFD700');
        leftArrow.setScale(1.0);
      });
    }
    
    // Right arrow
    if (this.currentMobileCardIndex < 2) {
      const rightArrow = this.add.text(slotX + arrowDistance, arrowY, '▶', {
        fontSize: `${arrowSize}px`,
        color: '#FFD700',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      rightArrow.on('pointerdown', () => {
        this.currentMobileCardIndex = Math.min(2, this.currentMobileCardIndex + 1);
        this.refreshMobileCardDisplay();
      });
      
      rightArrow.on('pointerover', () => {
        rightArrow.setColor('#FFFFFF');
        rightArrow.setScale(1.2);
      });
      
      rightArrow.on('pointerout', () => {
        rightArrow.setColor('#FFD700');
        rightArrow.setScale(1.0);
      });
    }
    
    // Add card indicator dots
    this.createCardIndicators(width, height, showGuestWarning);
  }
  
  private createCardIndicators(width: number, height: number, showGuestWarning: boolean) {
    // Position dots right below the delete button area - updated for new card position
    const cardY = showGuestWarning ? height * 0.55 : height * 0.50; // Updated to match new card position
    const cardHeight = Math.max(220, 420 * ResponsiveLayout.getUIScale(width, height)); // Updated to match larger cards
    const indicatorY = cardY + cardHeight / 2 + 25; // Further down, below delete button
    const dotSpacing = 30;
    const startX = width / 2 - dotSpacing;
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * dotSpacing;
      const isActive = i === this.currentMobileCardIndex;
      const hasCharacter = this.characters[i] !== null && this.characters[i] !== undefined;
      
      let color = '#666666'; // Empty slot
      if (hasCharacter) {
        color = isActive ? '#FFD700' : '#C0C0C0'; // Has character
      }
      
      const dot = this.add.circle(x, indicatorY, isActive ? 8 : 6, parseInt(color.replace('#', '0x')));
      dot.setStrokeStyle(2, 0x8B0000);
      
      // Make dots clickable
      dot.setInteractive({ useHandCursor: true });
      dot.on('pointerdown', () => {
        this.currentMobileCardIndex = i;
        this.refreshMobileCardDisplay();
      });
    }
  }
  
  private refreshMobileCardDisplay() {
    // Clear existing display and recreate
    this.children.removeAll();
    this.create();
  }



  private createCharacterSlot(x: number, y: number, width: number, height: number, character: any, slotIndex: number) {
    // Use responsive text scaling for character slot text - increased base sizes
    const { width: screenWidth, height: screenHeight } = this.scale;
    const textFontSize = ResponsiveLayout.getScaledFontSize(20, screenWidth, screenHeight);
    const buttonFontSize = ResponsiveLayout.getButtonFontSize(16, screenWidth, screenHeight);
    
    // Check if this character is selected
    const selectedCharacterId = localStorage.getItem('hemoclast_character_id');
    const isSelected = character && selectedCharacterId && character.id.toString() === selectedCharacterId;
    
    // Slot background with enhanced styling - highlight if selected
    const backgroundColor = character ? (isSelected ? 0x4a0000 : 0x2d1b1b) : 0x1a1a1a;
    const borderColor = character ? (isSelected ? 0xFFD700 : 0x8B0000) : 0x666666;
    const borderWidth = character ? (isSelected ? 4 : 3) : 2;
    
    GraphicsUtils.createUIPanel(
      this,
      x - width/2,
      y - height/2,
      width,
      height,
      backgroundColor,
      borderColor,
      borderWidth
    );
    
    // Add enhanced glow effect for selected character
    if (character && isSelected) {
      const glowEffect = this.add.graphics();
      glowEffect.lineStyle(2, 0xFFD700, 0.6);
      for (let i = 0; i < 4; i++) {
        glowEffect.strokeRoundedRect(
          x - width/2 - i * 3, 
          y - height/2 - i * 3, 
          width + i * 6, 
          height + i * 6, 
          8 + i * 2
        );
      }
    } else if (character) {
      // Subtle glow for unselected characters
      const glowEffect = this.add.graphics();
      glowEffect.lineStyle(1, 0x8B0000, 0.3);
      for (let i = 0; i < 2; i++) {
        glowEffect.strokeRoundedRect(
          x - width/2 - i * 2, 
          y - height/2 - i * 2, 
          width + i * 4, 
          height + i * 4, 
          8 + i
        );
      }
    }
    
    if (character) {
      // Existing character
      this.displayExistingCharacter(x, y, character, textFontSize, buttonFontSize);
    } else {
      // Empty slot - create new character
      this.displayEmptySlot(x, y, slotIndex, textFontSize, buttonFontSize);
    }
  }

  private displayExistingCharacter(x: number, y: number, character: any, fontSize: number, buttonFontSize: number) {
    const { width: screenWidth, height: screenHeight } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(screenWidth, screenHeight);
    
    // Check if this is actually a mobile device/layout
    const isMobile = ResponsiveLayout.isMobile(screenWidth, screenHeight);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(screenWidth, screenHeight);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || screenWidth < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Character portrait placeholder - responsive sizing for different screen sizes
    let portraitRadius, portraitY, strokeWidth;
    if (isMobileLayout) {
      portraitRadius = Math.max(39, 55 * uiScale);
      portraitY = y - Math.max(66, 88 * uiScale);
      strokeWidth = Math.max(2, 3.3 * uiScale);
    } else if (screenWidth < 1024) {
      // Tablet
      portraitRadius = Math.max(50, 70 * uiScale);
      portraitY = y - Math.max(90, 110 * uiScale);
      strokeWidth = Math.max(3, 4 * uiScale);
    } else {
      // Desktop
      portraitRadius = Math.max(60, 80 * uiScale);
      portraitY = y - Math.max(100, 120 * uiScale);
      strokeWidth = Math.max(3, 5 * uiScale);
    }
    
    const portrait = this.add.circle(x, portraitY, portraitRadius, this.getClassColor(character.character_class));
    portrait.setStrokeStyle(strokeWidth, 0x8B0000);
    
    // Class icon - responsive sizing for different screen sizes
    let iconFontSize;
    if (isMobileLayout) {
      iconFontSize = Math.max(22, 31 * uiScale);
    } else if (screenWidth < 1024) {
      // Tablet
      iconFontSize = Math.max(28, 36 * uiScale);
    } else {
      // Desktop
      iconFontSize = ResponsiveLayout.getScaledFontSize(40, screenWidth, screenHeight);
    }
    
    this.add.text(x, portraitY, this.getClassIcon(character.character_class), {
      fontSize: `${iconFontSize}px`
    }).setOrigin(0.5);
    
    // Character name - mobile-specific positioning
    const nameY = isMobileLayout ? y - Math.max(11, 16.5 * uiScale) : y - Math.max(15, 20 * uiScale);
    this.add.text(x, nameY, character.name, {
      fontSize: isMobileLayout ? `${Math.max(15, fontSize * 1.1 * uiScale)}px` : `${fontSize}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    
    // Character class and level - mobile-specific positioning
    const classLevelY = isMobileLayout ? nameY + Math.max(22, 27.5 * uiScale) : nameY + Math.max(25, 30 * uiScale);
    this.add.text(x, classLevelY, `${character.character_class} • Level ${character.level}`, {
      fontSize: isMobileLayout ? `${Math.max(11, 13.2 * uiScale)}px` : `${ResponsiveLayout.getScaledFontSize(14, screenWidth, screenHeight)}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    
    // Select button - responsive dimensions for different screen sizes
    let selectButtonWidth, selectButtonHeight, selectButtonFontSize;
    if (isMobileLayout) {
      selectButtonWidth = Math.max(110, 143 * uiScale);
      selectButtonHeight = Math.max(31, 38.5 * uiScale);
      selectButtonFontSize = Math.max(11, buttonFontSize * 1.1 * uiScale);
    } else if (screenWidth < 1024) {
      // Tablet
      selectButtonWidth = Math.max(140, 170 * uiScale);
      selectButtonHeight = Math.max(35, 42 * uiScale);
      selectButtonFontSize = Math.max(12, buttonFontSize);
    } else {
      // Desktop - use original ResponsiveLayout sizing
      const touchFriendly = ResponsiveLayout.getTouchFriendlyButton(160, 50, screenWidth, screenHeight);
      selectButtonWidth = touchFriendly.width;
      selectButtonHeight = touchFriendly.height;
      selectButtonFontSize = buttonFontSize;
    }
    
    const buttonY = isMobileLayout ? y + Math.max(55, 71.5 * uiScale) : y + Math.max(70, 90 * uiScale);
    GraphicsUtils.createRuneScapeButton(
      this,
      x,
      buttonY,
      selectButtonWidth,
      selectButtonHeight,
      'Select',
      selectButtonFontSize,
      () => this.selectCharacter(character)
    );
    
    // Enhanced Delete button with mobile-specific positioning
    const deleteButton = this.add.graphics();
    const deleteButtonY = isMobileLayout ? buttonY + Math.max(38.5, 49.5 * uiScale) : buttonY + Math.max(50, 60 * uiScale);
    const deleteText = this.add.text(x, deleteButtonY, 'Delete', {
      fontSize: isMobileLayout ? `${Math.max(9, 11 * uiScale)}px` : `${ResponsiveLayout.getScaledFontSize(12, screenWidth, screenHeight)}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: Math.max(1, uiScale)
    }).setOrigin(0.5);
    
    // Responsive delete button dimensions for different screen sizes
    let deleteButtonWidth, deleteButtonHeight;
    if (isMobileLayout) {
      deleteButtonWidth = Math.max(66, 88 * uiScale);
      deleteButtonHeight = Math.max(22, 27.5 * uiScale);
    } else if (screenWidth < 1024) {
      // Tablet
      deleteButtonWidth = Math.max(90, 110 * uiScale);
      deleteButtonHeight = Math.max(28, 32 * uiScale);
    } else {
      // Desktop
      deleteButtonWidth = Math.max(100, 120 * uiScale);
      deleteButtonHeight = Math.max(30, 35 * uiScale);
    }
    
    // Draw delete button with danger styling
    const drawDeleteButton = (bgColor: number, borderColor: number, glowing: boolean = false) => {
      deleteButton.clear();
      
      // Add glow effect if hovering
      if (glowing) {
        deleteButton.fillStyle(borderColor, 0.3);
        deleteButton.fillRoundedRect(
          x - deleteButtonWidth / 2 - 3, 
          deleteButtonY - deleteButtonHeight / 2 - 3, 
          deleteButtonWidth + 6, 
          deleteButtonHeight + 6, 
          Math.max(3, 5 * uiScale)
        );
      }
      
      // Main button background
      deleteButton.fillStyle(bgColor, 0.9);
      deleteButton.fillRoundedRect(
        x - deleteButtonWidth / 2, 
        deleteButtonY - deleteButtonHeight / 2, 
        deleteButtonWidth, 
        deleteButtonHeight, 
        Math.max(2, 3 * uiScale)
      );
      
      // Border
      deleteButton.lineStyle(Math.max(1, 2 * uiScale), borderColor);
      deleteButton.strokeRoundedRect(
        x - deleteButtonWidth / 2, 
        deleteButtonY - deleteButtonHeight / 2, 
        deleteButtonWidth, 
        deleteButtonHeight, 
        Math.max(2, 3 * uiScale)
      );
    };
    
    // Initial button state
    drawDeleteButton(0x4a0000, 0xDC143C);
    
    // Enhanced interactive area with proper cursor - mobile-specific sizing
    const deleteHitArea = this.add.rectangle(x, deleteButtonY, deleteButtonWidth + 10, deleteButtonHeight + 10, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    // Enhanced hover effects
    deleteHitArea.on('pointerover', () => {
      drawDeleteButton(0x8B0000, 0xFF6666, true);
      if (deleteText && deleteText.active) {
        deleteText.setColor('#FFFFFF');
        deleteText.setScale(1.05);
      }
    });
    
    deleteHitArea.on('pointerout', () => {
      drawDeleteButton(0x4a0000, 0xDC143C);
      if (deleteText && deleteText.active) {
        deleteText.setColor('#FFD700');
        deleteText.setScale(1.0);
      }
    });
    
    deleteHitArea.on('pointerdown', () => {
      // Press animation
      if (deleteText && deleteText.active) {
        deleteText.setScale(0.95);
        this.time.delayedCall(100, () => {
          if (deleteText && deleteText.active) {
            deleteText.setScale(1.0);
          }
          this.confirmDeleteCharacter(character);
        });
      } else {
        this.confirmDeleteCharacter(character);
      }
    });
  }

  private displayEmptySlot(x: number, y: number, _slotIndex: number, fontSize: number, buttonFontSize: number) {
    const { width: screenWidth, height: screenHeight } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(screenWidth, screenHeight);
    
    // Check if this is actually a mobile device/layout
    const isMobile = ResponsiveLayout.isMobile(screenWidth, screenHeight);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(screenWidth, screenHeight);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || screenWidth < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Empty slot icon - responsive sizing for different screen sizes
    let iconY, iconFontSize;
    if (isMobileLayout) {
      iconY = y - Math.max(44, 66 * uiScale);
      iconFontSize = Math.max(33, 44 * uiScale);
    } else if (screenWidth < 1024) {
      // Tablet
      iconY = y - Math.max(60, 80 * uiScale);
      iconFontSize = Math.max(40, 50 * uiScale);
    } else {
      // Desktop
      iconY = y - Math.max(70, 90 * uiScale);
      iconFontSize = ResponsiveLayout.getScaledFontSize(60, screenWidth, screenHeight);
    }
    
    this.add.text(x, iconY, '➕', {
      fontSize: `${iconFontSize}px`,
      color: '#666666'
    }).setOrigin(0.5);
    
    // Create character text - mobile-specific positioning
    const textY = isMobileLayout ? y - Math.max(5.5, 11 * uiScale) : y - Math.max(5, 10 * uiScale);
    this.add.text(x, textY, 'Create New\nCharacter', {
      fontSize: isMobileLayout ? `${Math.max(13, fontSize * 1.1 * uiScale)}px` : `${fontSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create button - responsive dimensions for different screen sizes
    let createButtonWidth, createButtonHeight, createButtonFontSize;
    if (isMobileLayout) {
      createButtonWidth = Math.max(110, 143 * uiScale);
      createButtonHeight = Math.max(31, 38.5 * uiScale);
      createButtonFontSize = Math.max(11, buttonFontSize * 1.1 * uiScale);
    } else if (screenWidth < 1024) {
      // Tablet
      createButtonWidth = Math.max(140, 170 * uiScale);
      createButtonHeight = Math.max(35, 42 * uiScale);
      createButtonFontSize = Math.max(12, buttonFontSize);
    } else {
      // Desktop - use original ResponsiveLayout sizing
      const touchFriendly = ResponsiveLayout.getTouchFriendlyButton(160, 50, screenWidth, screenHeight);
      createButtonWidth = touchFriendly.width;
      createButtonHeight = touchFriendly.height;
      createButtonFontSize = buttonFontSize;
    }
    
    const buttonY = isMobileLayout ? y + Math.max(55, 71.5 * uiScale) : y + Math.max(70, 90 * uiScale);
    GraphicsUtils.createRuneScapeButton(
      this,
      x,
      buttonY,
      createButtonWidth,
      createButtonHeight,
      'Create',
      createButtonFontSize,
      () => this.createNewCharacter()
    );
  }

  private createEnterWorldButton() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Check screen type for mobile detection
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Check if a character is selected
    const selectedCharacterId = localStorage.getItem('hemoclast_character_id');
    const isCharacterSelected = selectedCharacterId && this.characters.some(char => char && char.id.toString() === selectedCharacterId);
    
    // Position Enter World button below the character cards for all screen sizes
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    const showGuestWarning = isGuest && !isRegistered;
    
    // Calculate where cards are positioned and place button below them - use consistent positioning like desktop
    let buttonY;
    if (showGuestWarning) {
      buttonY = height * 0.78; // Below cards when guest warning is shown (same for both mobile and desktop)
    } else {
      buttonY = height * 0.75; // Below cards when no guest warning (same for both mobile and desktop)
    }
    
    // Responsive button dimensions for all screen sizes including mobile
    const buttonFontSize = ResponsiveLayout.getButtonFontSize(16, width, height);
    let enterButtonWidth, enterButtonHeight;
    
    if (isMobileLayout) {
      // Mobile - touch-friendly dimensions
      enterButtonWidth = Math.max(220, 264 * uiScale);
      enterButtonHeight = Math.max(48, buttonFontSize + 18); // Minimum 48px for touch accessibility - scaled up 10%
    } else if (width < 1024) {
      // Tablet
      enterButtonWidth = Math.max(160, 200 * uiScale);
      enterButtonHeight = Math.max(32, buttonFontSize + 12);
    } else {
      // Desktop
      enterButtonWidth = Math.max(180, 220 * uiScale);
      enterButtonHeight = Math.max(36, buttonFontSize + 16);
    }
    
    const enterWorldButton = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2,
      buttonY,
      enterButtonWidth,
      enterButtonHeight,
      'Enter World',
      buttonFontSize,
      () => this.enterWorld()
    );
    
    // Disable button if no character selected
    if (!isCharacterSelected) {
      enterWorldButton.background.setAlpha(0.5);
      enterWorldButton.text.setAlpha(0.5);
      enterWorldButton.text.setText('Select Character');
    }
  }
  
  private createBottomLeftButtons() {
    const { width, height } = this.scale;
    
    // Check if this is actually a mobile device/layout
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Use responsive button font scaling
    const buttonFontSize = ResponsiveLayout.getButtonFontSize(14, width, height);
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Use the same horizontal layout for both mobile and desktop, but with mobile scaling
    const separatorY = height * 0.16; // Same Y position as the red line
    
    // Responsive button dimensions - smaller on mobile but still horizontal layout
    const buttonWidth = isMobileLayout ? Math.max(66, 77 * uiScale) : Math.max(80, 100 * uiScale);
    const buttonHeight = isMobileLayout ? Math.max(22, 26.4 * uiScale) : Math.max(24, 28 * uiScale);
    const horizontalSpacing = isMobileLayout ? Math.max(88, 99 * uiScale) : Math.max(120, 140 * uiScale);
    
    // Center the three buttons horizontally
    const centerX = width / 2;
    const settingsX = centerX - horizontalSpacing;
    const creditsX = centerX;
    const logoutX = centerX + horizontalSpacing;
    
    // Create buttons with higher depth to appear above the red line
    const buttonDepth = 10; // Higher than the default depth of the separator line
    
    // Settings button (left)
    const settingsButton = GraphicsUtils.createRuneScapeButton(
      this,
      settingsX,
      separatorY,
      buttonWidth,
      buttonHeight,
      'Settings',
      buttonFontSize,
      () => this.goToSettings()
    );
    settingsButton.background.setDepth(buttonDepth);
    settingsButton.text.setDepth(buttonDepth + 1);
    
    // Credits button (center)
    const creditsButton = GraphicsUtils.createRuneScapeButton(
      this,
      creditsX,
      separatorY,
      buttonWidth,
      buttonHeight,
      'Credits',
      buttonFontSize,
      () => this.goToCredits()
    );
    creditsButton.background.setDepth(buttonDepth);
    creditsButton.text.setDepth(buttonDepth + 1);
    
    // Logout button (right) - slightly wider for arrow
    const logoutButton = GraphicsUtils.createRuneScapeButton(
      this,
      logoutX,
      separatorY,
      isMobileLayout ? Math.max(buttonWidth, 82.5 * uiScale) : Math.max(buttonWidth, 110 * uiScale),
      buttonHeight,
      '← Logout',
      buttonFontSize,
      () => this.logout()
    );
    logoutButton.background.setDepth(buttonDepth);
    logoutButton.text.setDepth(buttonDepth + 1);
  }
  
  private enterWorld() {
    const selectedCharacterId = localStorage.getItem('hemoclast_character_id');
    
    if (!selectedCharacterId) {
      this.showError('Please select a character first');
      return;
    }
    
    // Go directly to the 3D game world instead of 2D
    console.log('🚀 Entering 3D world with character:', selectedCharacterId);
    this.cleanupForm();
    this.scene.start('Game3DTestScene');
  }
  
  private goToSettings() {
    this.gameStore.store.getState().setScene('SettingsScene');
    this.cleanupForm();
    this.scene.start('SettingsScene');
  }
  
  private goToCredits() {
    this.gameStore.store.getState().setScene('CreditsScene');
    this.cleanupForm();
    this.scene.start('CreditsScene');
  }

  private getClassColor(characterClass: string): number {
    const colors: { [key: string]: number } = {
      warrior: 0x8B0000,
      rogue: 0x228B22,
      mage: 0x4B0082
    };
    return colors[characterClass] || 0x666666;
  }

  private getClassIcon(characterClass: string): string {
    const icons: { [key: string]: string } = {
      warrior: '⚔️',
      rogue: '🗡️',
      mage: '🔮'
    };
    return icons[characterClass] || '❓';
  }

  private selectCharacter(character: any) {
    // Set selected character in game store
    this.gameStore.store.getState().setCharacter(character);
    
    // Store selected character ID
    localStorage.setItem('hemoclast_character_id', character.id.toString());
    
    // Show visual feedback that character is selected
    this.showCharacterSelected(character);
    
    // Refresh the scene to show the selected state
    this.scene.restart();
  }
  
  private showCharacterSelected(character: any) {
    const { width, height } = this.scale;
    
    // Show brief selection confirmation
    const confirmText = this.add.text(width / 2, height * 0.85, `${character.name} Selected!`, {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Fade out after 1 second
    this.time.delayedCall(1000, () => {
      if (confirmText) {
        confirmText.destroy();
      }
    });
  }

  private createNewCharacter() {
    // Go to character creation scene
    this.cleanupForm();
    this.scene.start('CharacterCreationScene');
  }

  private confirmDeleteCharacter(character: any) {
    const { width, height } = this.scale;
    
    // Get responsive scaling with mobile detection
    const scale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setDepth(200);
    
    // Mobile-friendly dialog dimensions
    let dialogWidth, dialogHeight;
    if (isMobileLayout) {
      dialogWidth = Math.min(385, width * 1.045);
      dialogHeight = Math.min(495, height * 0.99);
    } else if (width < 1024) {
      // Tablet
      dialogWidth = Math.min(500, width * 0.85);
      dialogHeight = Math.min(420, height * 0.8);
    } else {
      // Desktop
      dialogWidth = Math.min(600, width * 0.7);
      dialogHeight = 420;
    }
    
    // Enhanced dialog panel - responsive sizing
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - dialogWidth / 2,
      height / 2 - dialogHeight / 2,
      dialogWidth,
      dialogHeight,
      0x1a1a1a,
      0xDC143C,
      4
    );
    panel.setDepth(201);
    
    // Mobile-optimized font sizes
    const titleFontSize = isMobileLayout ? 
      Math.max(22, 24.2 * scale) : 
      ResponsiveLayout.getScaledFontSize(24, width, height);
    const nameFontSize = isMobileLayout ? 
      Math.max(18, 19.8 * scale) : 
      ResponsiveLayout.getScaledFontSize(20, width, height);
    const warningFontSize = isMobileLayout ? 
      Math.max(15, 16.5 * scale) : 
      ResponsiveLayout.getScaledFontSize(16, width, height);
    const detailFontSize = isMobileLayout ? 
      Math.max(13, 14.3 * scale) : 
      ResponsiveLayout.getScaledFontSize(14, width, height);
    
    // Calculate responsive positions with mobile-friendly spacing
    const centerY = height / 2;
    const startY = centerY - dialogHeight / 2 + (isMobileLayout ? 38.5 : 40);
    const lineSpacing = isMobileLayout ? 
      Math.max(33, 35.2 * scale) : 
      Math.max(35, 35 * scale);
    
    // Warning title with enhanced styling
    const title = this.add.text(width / 2, startY, '⚠️ PERMANENT DELETION', {
      fontSize: `${titleFontSize}px`,
      color: '#DC143C',
      fontFamily: 'Nosifer, serif',
      stroke: '#000000',
      strokeThickness: Math.max(1, 2 * scale),
      wordWrap: { width: dialogWidth - 30 }
    }).setOrigin(0.5).setDepth(202);
    
    // Character name being deleted
    const characterName = this.add.text(width / 2, startY + lineSpacing, `"${character.name}"`, {
      fontSize: `${nameFontSize}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: Math.max(1, 1 * scale)
    }).setOrigin(0.5).setDepth(202);
    
    // Warning message - mobile-optimized word wrapping
    const warning1 = this.add.text(width / 2, startY + lineSpacing * 2, 'THIS ACTION CANNOT BE UNDONE!', {
      fontSize: `${warningFontSize}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      wordWrap: { width: dialogWidth - (isMobileLayout ? 30 : 40) }
    }).setOrigin(0.5).setDepth(202);
    
    const warning2Y = startY + lineSpacing * (isMobileLayout ? 2.6 : 2.8);
    const warning2 = this.add.text(width / 2, warning2Y, 'ALL PROGRESS, ITEMS, AND ACHIEVEMENTS WILL BE LOST FOREVER', {
      fontSize: `${detailFontSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      lineSpacing: isMobileLayout ? 3 : 4,
      wordWrap: { width: dialogWidth - (isMobileLayout ? 30 : 40) }
    }).setOrigin(0.5).setDepth(202);
    
    // Instruction text - positioned based on mobile layout
    const instructionY = isMobileLayout ? 
      warning2Y + (lineSpacing * 1.5) : 
      startY + lineSpacing * 4.2;
    const instruction = this.add.text(width / 2, instructionY, 'TYPE "DELETE" BELOW TO CONFIRM:', {
      fontSize: `${warningFontSize}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      wordWrap: { width: dialogWidth - 30 }
    }).setOrigin(0.5).setDepth(202);
    
    // Create HTML input for typing DELETE and buttons with mobile-friendly dimensions
    const { confirmBtn, cancelBtn } = this.createDeleteConfirmationInput(
      character, 
      [overlay, panel, title, characterName, warning1, warning2, instruction],
      { 
        dialogWidth, 
        dialogHeight, 
        scale, 
        startY, 
        lineSpacing, 
        isMobile: isMobileLayout,
        instructionY 
      }
    );
    
    // Add click outside to cancel functionality with responsive bounds
    overlay.setInteractive();
    overlay.on('pointerdown', (pointer: any) => {
      const panelBounds = {
        left: width / 2 - dialogWidth / 2,
        right: width / 2 + dialogWidth / 2,
        top: height / 2 - dialogHeight / 2,
        bottom: height / 2 + dialogHeight / 2
      };
      
      // Only close if clicking outside the panel
      if (pointer.x < panelBounds.left || pointer.x > panelBounds.right || 
          pointer.y < panelBounds.top || pointer.y > panelBounds.bottom) {
        this.closeDeleteDialog([overlay, panel, title, characterName, warning1, warning2, instruction, confirmBtn, cancelBtn]);
      }
    });
  }
  
  private createDeleteConfirmationInput(
    character: any, 
    dialogElements: any[], 
    dimensions?: { dialogWidth: number, dialogHeight: number, scale: number, startY: number, lineSpacing: number, isMobile?: boolean, instructionY?: number }
  ): { confirmBtn: Phaser.GameObjects.Text, cancelBtn: Phaser.GameObjects.Text } {
    const { width, height } = this.scale;
    
    // Remove existing input if any
    const existingInput = document.getElementById('delete-confirmation-input');
    if (existingInput) {
      existingInput.remove();
    }
    
    // Use responsive dimensions if provided, otherwise fallback to legacy scaling
    const scale = dimensions?.scale || ResponsiveLayout.getUIScale(width, height);
    const isMobile = dimensions?.isMobile || ResponsiveLayout.isMobile(width, height);
    
    // Mobile-friendly input dimensions
    let inputWidth, inputHeight, inputFontSize;
    if (isMobile) {
      inputWidth = Math.min(275, (dimensions?.dialogWidth || 352) * 0.88);
      inputHeight = Math.max(44, 49.5 * scale);
      inputFontSize = Math.max(15, 17.6 * scale);
    } else {
      const inputDimensions = ResponsiveLayout.getMobileInputDimensions(280, 45, width, height);
      inputWidth = inputDimensions.width;
      inputHeight = inputDimensions.height;
      inputFontSize = inputDimensions.fontSize;
    }
    
    // Calculate input position - use instructionY if provided for better mobile positioning
    let inputYPos;
    if (dimensions?.instructionY) {
      inputYPos = dimensions.instructionY + (isMobile ? 45 : 50);
    } else if (dimensions) {
      inputYPos = Math.min(dimensions.startY + dimensions.lineSpacing * 5.5, height / 2 + dimensions.dialogHeight / 2 - 120);
    } else {
      inputYPos = height * 0.58;
    }
    const inputY = (inputYPos / height * 100);
    
    // Create confirmation input positioned below the instruction text
    const confirmInput = document.createElement('input');
    confirmInput.type = 'text';
    confirmInput.placeholder = 'Type DELETE to confirm';
    confirmInput.id = 'delete-confirmation-input';
    confirmInput.maxLength = 6;
    confirmInput.style.cssText = `
      position: absolute;
      left: 50%;
      top: ${inputY}%;
      transform: translate(-50%, -50%);
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: ${Math.max(8, 12 * scale)}px;
      background: rgba(10, 10, 10, 0.95);
      border: ${Math.max(2, 3 * scale)}px solid #DC143C;
      border-radius: ${Math.max(6, 8 * scale)}px;
      color: #F5F5DC;
      font-family: 'Cinzel', serif;
      font-size: ${inputFontSize}px;
      text-align: center;
      text-transform: uppercase;
      z-index: 1001;
      outline: none;
      letter-spacing: ${Math.max(1, 2 * scale)}px;
      box-sizing: border-box;
    `;
    
    // Mobile-friendly button dimensions and positioning
    let buttonHeight, buttonFontSize, buttonSpacing, buttonY;
    if (isMobile) {
      buttonHeight = Math.max(38.5, 44 * scale);
      buttonFontSize = Math.max(15, 17.6 * scale);
      buttonSpacing = 22; // Vertical spacing for mobile - scaled up 10%
      // Position buttons below input with adequate spacing
      buttonY = inputYPos + (isMobile ? 77 : 60);
    } else {
      const buttonDimensions = ResponsiveLayout.getTouchFriendlyButton(120, 45, width, height);
      buttonHeight = buttonDimensions.height;
      buttonFontSize = ResponsiveLayout.getButtonFontSize(16, width, height);
      buttonSpacing = Math.max(100, 120 * scale); // Horizontal spacing for desktop
      buttonY = dimensions ? 
        Math.min(dimensions.startY + dimensions.lineSpacing * 7.2, height / 2 + dimensions.dialogHeight / 2 - 60) : 
        (height / 2 + 150);
    }
    const buttonPadding = { x: Math.max(15, 20 * scale), y: Math.max(8, 12 * scale) };
    
    // Create buttons with mobile-friendly layout
    let confirmBtn, cancelBtn;
    if (isMobile) {
      // Mobile: Stack buttons vertically
      confirmBtn = this.add.text(width / 2, buttonY, 'CONFIRM', {
        fontSize: `${buttonFontSize}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        backgroundColor: '#DC143C',
        padding: buttonPadding
      }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
      
      cancelBtn = this.add.text(width / 2, buttonY + buttonHeight + buttonSpacing, 'CANCEL', {
        fontSize: `${buttonFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        backgroundColor: '#666666',
        padding: buttonPadding
      }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
    } else {
      // Desktop: Horizontal layout
      confirmBtn = this.add.text(width / 2 - buttonSpacing, buttonY, 'CONFIRM', {
        fontSize: `${buttonFontSize}px`,
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        backgroundColor: '#DC143C',
        padding: buttonPadding
      }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
      
      cancelBtn = this.add.text(width / 2 + buttonSpacing, buttonY, 'CANCEL', {
        fontSize: `${buttonFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        backgroundColor: '#666666',
        padding: buttonPadding
      }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
    }
    
    // Initially disable confirm button
    confirmBtn.setAlpha(0.5);
    confirmBtn.disableInteractive();
    
    // Add input validation and delete functionality
    const validateInput = () => {
      const inputValue = confirmInput.value.toUpperCase();
      
      if (inputValue === 'DELETE') {
        // Enable confirm button
        confirmBtn.setAlpha(1.0);
        confirmBtn.setInteractive({ useHandCursor: true });
        confirmInput.style.borderColor = '#228B22'; // Green border when valid
        confirmInput.style.boxShadow = '0 0 10px rgba(34, 139, 34, 0.5)';
      } else {
        // Disable confirm button
        confirmBtn.setAlpha(0.5);
        confirmBtn.disableInteractive();
        confirmInput.style.borderColor = '#DC143C'; // Red border when invalid
        confirmInput.style.boxShadow = '0 0 10px rgba(220, 20, 60, 0.5)';
      }
    };
    
    // Enhanced button effects
    confirmBtn.on('pointerover', () => {
      if (confirmBtn.alpha === 1.0) {
        confirmBtn.setBackgroundColor('#FF6666');
        confirmBtn.setScale(1.05);
      }
    });
    
    confirmBtn.on('pointerout', () => {
      confirmBtn.setBackgroundColor('#DC143C');
      confirmBtn.setScale(1.0);
    });
    
    confirmBtn.on('pointerdown', () => {
      this.deleteCharacter(character.id);
      this.closeDeleteDialog([...dialogElements, confirmBtn, cancelBtn]);
    });
    
    cancelBtn.on('pointerover', () => {
      cancelBtn.setBackgroundColor('#888888');
      cancelBtn.setScale(1.05);
    });
    
    cancelBtn.on('pointerout', () => {
      cancelBtn.setBackgroundColor('#666666');
      cancelBtn.setScale(1.0);
    });
    
    cancelBtn.on('pointerdown', () => {
      this.closeDeleteDialog([...dialogElements, confirmBtn, cancelBtn]);
    });
    
    // Enhanced input events
    confirmInput.addEventListener('input', validateInput);
    confirmInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDeleteDialog([...dialogElements, confirmBtn, cancelBtn]);
      }
      if (e.key === 'Enter' && confirmInput.value.toUpperCase() === 'DELETE' && confirmBtn.alpha === 1.0) {
        this.deleteCharacter(character.id);
        this.closeDeleteDialog([...dialogElements, confirmBtn, cancelBtn]);
      }
    });
    
    // Add focus and blur effects
    confirmInput.addEventListener('focus', () => {
      confirmInput.style.borderColor = '#FFD700';
      confirmInput.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.4)';
    });
    
    confirmInput.addEventListener('blur', () => {
      validateInput(); // Re-validate on blur
    });
    
    document.body.appendChild(confirmInput);
    
    // Focus the input after a short delay
    setTimeout(() => {
      confirmInput.focus();
      confirmInput.select(); // Select any existing text
    }, 150);
    
    return { confirmBtn, cancelBtn };
  }
  
  private async deleteCharacter(characterId: number) {
    try {
      const token = localStorage.getItem('hemoclast_token');
      
      if (!token) {
        this.showError('Authentication required');
        return;
      }
      
      const response = await fetch(`/api/v1/characters/${characterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        this.showSuccess(result.message);
        
        // Refresh the character list
        await this.loadCharacters();
        this.scene.restart();
      } else {
        const error = await response.json();
        this.showError(error.detail || 'Failed to delete character');
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    }
  }
  
  private closeDeleteDialog(elements: Phaser.GameObjects.GameObject[]) {
    elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    
    // Clean up the HTML input
    const confirmInput = document.getElementById('delete-confirmation-input');
    if (confirmInput) {
      confirmInput.remove();
    }
  }
  
  private showSuccess(message: string) {
    const { width, height } = this.scale;
    
    // Remove existing messages
    const existingMessage = this.children.getByName('success-message');
    if (existingMessage) {
      existingMessage.destroy();
    }
    
    // Show success message
    const successText = this.add.text(width / 2, height * 0.9, message, {
      fontSize: '16px',
      color: '#228B22',
      fontFamily: 'Cinzel, serif',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setName('success-message');
    
    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      if (successText) {
        successText.destroy();
      }
    });
  }
  
  private showError(message: string) {
    const { width, height } = this.scale;
    
    // Remove existing error
    const existingError = this.children.getByName('error-message');
    if (existingError) {
      existingError.destroy();
    }
    
    // Show error message
    const errorText = this.add.text(width / 2, height * 0.9, message, {
      fontSize: '16px',
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setName('error-message');
    
    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      if (errorText) {
        errorText.destroy();
      }
    });
  }

  private upgradeGuestAccount() {
    // Show upgrade dialog with improved messaging about data preservation
    const { width, height } = this.scale;
    
    // Get responsive scaling
    const scale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(100);
    
    // Enhanced responsive dialog dimensions for new content
    const baseDialogWidth = isMobile ? 495 : 500;
    const baseDialogHeight = isMobile ? 308 : 250; // Reduced height to eliminate empty space - scaled up 10%
    // Ensure minimum dialog size even at small scales
    const dialogWidth = Math.max(385, Math.min(baseDialogWidth * scale, width * 1.045));
    const dialogHeight = Math.max(264, Math.min(baseDialogHeight * scale, height * 0.88));
    
    // Dialog panel - responsive sizing
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - dialogWidth / 2,
      height / 2 - dialogHeight / 2,
      dialogWidth,
      dialogHeight,
      0x2d1b1b,
      0x8B0000,
      3
    );
    panel.setDepth(101);
    
    // Dialog title - "Secure your Progress" as single centered text
    const titleFontSize = ResponsiveLayout.getScaledFontSize(22, width, height);
    const titleY = height / 2 - dialogHeight / 2 + Math.max(40, 50 * scale);
    
    // Create centered title
    const titleText = this.add.text(width / 2, titleY, 'Secure your Progress', {
      fontSize: `${titleFontSize}px`,
      color: '#FFD700',
      fontFamily: 'Nosifer, serif',
      align: 'center'
    }).setOrigin(0.5).setDepth(102);
    
    // Create bullet points with new content
    const bulletFontSize = ResponsiveLayout.getScaledFontSize(15, width, height);
    const lineHeight = Math.max(24, bulletFontSize + 8);
    const startY = height / 2 - dialogHeight / 2 + Math.max(90, 100 * scale);
    
    // New simplified bullet point items
    const bulletPoints = [
      { text: '- Data stored permanently' },
      { text: '- Access from any device' }
    ];
    
    const bulletElements: Phaser.GameObjects.Text[] = [];
    
    bulletPoints.forEach((item, index) => {
      const yPos = startY + (index * lineHeight * 1.4);
      
      const bulletText = this.add.text(width / 2, yPos, item.text, {
        fontSize: `${bulletFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        align: 'center'
      }).setOrigin(0.5).setDepth(102);
      
      bulletElements.push(bulletText);
    });
  
    
    // Responsive button dimensions - make buttons just big enough for text
    const buttonFontSize = ResponsiveLayout.getButtonFontSize(13, width, height);
    const createButtonWidth = Math.max(132, 154 * scale);
    const createButtonHeight = Math.max(26.4, buttonFontSize + 8.8);
    const continueButtonWidth = Math.max(154, 176 * scale);
    const continueButtonHeight = Math.max(26.4, buttonFontSize + 8.8);
    const buttonY = height / 2 + dialogHeight / 2 - Math.max(38.5, 44 * scale);
    const buttonSpacing = isMobile ? Math.max(88, 99 * scale) : Math.max(100, 110 * scale);
    
    // Create account button - responsive
    const createBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 - buttonSpacing,
      buttonY,
      createButtonWidth,
      createButtonHeight,
      'CREATE ACCOUNT',
      buttonFontSize,
      () => {
        this.initiateAccountUpgrade();
      }
    );
    createBtn.background.setDepth(102);
    createBtn.text.setDepth(103);
    
    // Continue to select button - responsive
    const continueBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 + buttonSpacing,
      buttonY,
      continueButtonWidth,
      continueButtonHeight,
      'CONTINUE TO SELECT',
      buttonFontSize,
      () => {
        this.closeUpgradeDialog([
          overlay, panel, titleText, 
          createBtn.background, createBtn.text, continueBtn.background, continueBtn.text,
          ...bulletElements
        ]);
        // Stay in character selection scene
      }
    );
    continueBtn.background.setDepth(102);
    continueBtn.text.setDepth(103);
  }
  
  private closeUpgradeDialog(elements: (Phaser.GameObjects.GameObject | null)[]) {
    elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
  }
  
  private initiateAccountUpgrade() {
    // Store a flag indicating this is an upgrade from guest account
    localStorage.setItem('hemoclast_upgrading_guest', 'true');
    
    // Store current character data for preservation
    if (this.characters && this.characters.length > 0) {
      localStorage.setItem('hemoclast_guest_characters', JSON.stringify(this.characters));
    }
    
    // Store current player data
    const currentPlayerId = localStorage.getItem('hemoclast_player_id');
    const currentUsername = localStorage.getItem('hemoclast_username');
    if (currentPlayerId && currentUsername) {
      localStorage.setItem('hemoclast_guest_player_data', JSON.stringify({
        playerId: currentPlayerId,
        username: currentUsername
      }));
    }
    
    // Navigate to login scene for account creation
    this.cleanupForm();
    this.scene.start('LoginScene');
  }

  private logout() {
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    
    if (isGuest && !isRegistered) {
      // For guest accounts, show logout options
      this.showGuestLogoutDialog();
    } else {
      // For registered accounts, logout normally
      this.performFullLogout();
    }
  }
  
  private showGuestLogoutDialog() {
    const { width, height } = this.scale;
    
    // Get responsive scaling with mobile detection
    const scale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(200);
    
    // Mobile-friendly dialog dimensions
    let dialogWidth, dialogHeight;
    if (isMobileLayout) {
      dialogWidth = Math.min(352, width * 1.045);
      dialogHeight = Math.min(330, height * 0.88);
    } else if (width < 1024) {
      // Tablet
      dialogWidth = Math.min(450, width * 0.8);
      dialogHeight = Math.min(280, height * 0.7);
    } else {
      // Desktop
      dialogWidth = Math.min(500, width * 0.6);
      dialogHeight = 250;
    }
    
    // Dialog panel - responsive sizing
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - dialogWidth / 2,
      height / 2 - dialogHeight / 2,
      dialogWidth,
      dialogHeight,
      0x2d1b1b,
      0x8B0000,
      Math.max(2, 3 * scale)
    );
    panel.setDepth(201);
    
    // Dialog title - mobile-friendly sizing
    const titleFontSize = isMobileLayout ? 
      Math.max(20, 22 * scale) : 
      ResponsiveLayout.getScaledFontSize(22, width, height);
    const titleY = height / 2 - dialogHeight / 2 + (isMobileLayout ? 38.5 : 40);
    const title = this.add.text(width / 2, titleY, 'Guest Account Options', {
      fontSize: `${titleFontSize}px`,
      color: '#8B0000',
      fontFamily: 'Nosifer, serif',
      align: 'center',
      wordWrap: { width: dialogWidth - 30 }
    }).setOrigin(0.5).setDepth(202);
    
    // Dialog message - mobile-optimized
    const messageFontSize = isMobileLayout ? 
      Math.max(14, 15.4 * scale) : 
      ResponsiveLayout.getScaledFontSize(15, width, height);
    const messageY = titleY + (isMobileLayout ? 55 : 45);
    const message = this.add.text(width / 2, messageY, 
      'Your guest progress is saved locally.\nWhat would you like to do?', {
      fontSize: `${messageFontSize}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      lineSpacing: isMobileLayout ? 5.5 : 6,
      wordWrap: { width: dialogWidth - 40 }
    }).setOrigin(0.5).setDepth(202);
    
    // Mobile-friendly button layout
    const buttonFontSize = isMobileLayout ? 
      Math.max(13, 14.3 * scale) : 
      ResponsiveLayout.getButtonFontSize(13, width, height);
    
    let buttonWidth, buttonHeight, buttonLayout;
    if (isMobileLayout) {
      // Stack buttons vertically on mobile for better touch targets
      buttonWidth = Math.max(220, dialogWidth * 0.88);
      buttonHeight = Math.max(38.5, buttonFontSize + 13.2);
      buttonLayout = 'vertical';
    } else {
      // Horizontal layout for larger screens
      buttonWidth = Math.max(140, 160 * scale);
      buttonHeight = Math.max(28, buttonFontSize + 8);
      buttonLayout = 'horizontal';
    }
    
    if (buttonLayout === 'vertical') {
      // Mobile: Stack buttons vertically
      const buttonStartY = messageY + 66;
      const buttonSpacing = 16.5;
      
      // Full logout button - smaller and positioned at bottom (create first so it can be referenced)
      const logoutBtnY = height / 2 + dialogHeight / 2 - 25;
      const logoutBtn = this.add.text(width / 2, logoutBtnY, 'Full Logout (Lose Progress)', {
        fontSize: `${Math.max(11, 12 * scale)}px`,
        color: '#DC143C',
        fontFamily: 'Cinzel, serif',
        align: 'center'
      }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
      
      // Continue to select button
      const continueBtn = GraphicsUtils.createRuneScapeButton(
        this,
        width / 2,
        buttonStartY,
        buttonWidth,
        buttonHeight,
        'Continue to Select',
        buttonFontSize,
        () => {
          this.closeGuestDialog([overlay, panel, title, message, logoutBtn, continueBtn.background, continueBtn.text, createBtn.background, createBtn.text]);
        }
      );
      continueBtn.background.setDepth(202);
      continueBtn.text.setDepth(203);
      
      // Create account button
      const createBtn = GraphicsUtils.createRuneScapeButton(
        this,
        width / 2,
        buttonStartY + buttonHeight + buttonSpacing,
        buttonWidth,
        buttonHeight,
        'Create Account',
        buttonFontSize,
        () => {
          this.closeGuestDialog([overlay, panel, title, message, logoutBtn, continueBtn.background, continueBtn.text, createBtn.background, createBtn.text]);
          this.initiateAccountUpgrade();
        }
      );
      createBtn.background.setDepth(202);
      createBtn.text.setDepth(203);
      
      this.addLogoutButtonEffects(logoutBtn, [overlay, panel, title, message, logoutBtn, continueBtn.background, continueBtn.text, createBtn.background, createBtn.text]);
      
    } else {
      // Desktop/Tablet: Horizontal layout
      const buttonY = messageY + 50;
      const buttonSpacing = Math.max(110, 120 * scale);
      
      // Continue to select button
      const continueBtn = GraphicsUtils.createRuneScapeButton(
        this,
        width / 2 - buttonSpacing,
        buttonY,
        buttonWidth,
        buttonHeight,
        'Continue to Select',
        buttonFontSize,
        () => {
          this.closeGuestDialog([overlay, panel, title, message, logoutBtn]);
        }
      );
      continueBtn.background.setDepth(202);
      continueBtn.text.setDepth(203);
      
      // Create account button
      const createBtn = GraphicsUtils.createRuneScapeButton(
        this,
        width / 2 + buttonSpacing,
        buttonY,
        Math.max(120, 140 * scale),
        buttonHeight,
        'Create Account',
        buttonFontSize,
        () => {
          this.closeGuestDialog([overlay, panel, title, message, logoutBtn]);
          this.initiateAccountUpgrade();
        }
      );
      createBtn.background.setDepth(202);
      createBtn.text.setDepth(203);
      
      // Full logout button
      const logoutBtnY = height / 2 + dialogHeight / 2 - 25;
      const logoutBtn = this.add.text(width / 2, logoutBtnY, 'Full Logout (Lose Progress)', {
        fontSize: `${ResponsiveLayout.getScaledFontSize(13, width, height)}px`,
        color: '#DC143C',
        fontFamily: 'Cinzel, serif',
        align: 'center'
      }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
      
      this.addLogoutButtonEffects(logoutBtn, [overlay, panel, title, message, logoutBtn, continueBtn.background, continueBtn.text, createBtn.background, createBtn.text]);
    }
  }
  
  private addLogoutButtonEffects(logoutBtn: Phaser.GameObjects.Text, elementsToClose: Phaser.GameObjects.GameObject[]) {
    logoutBtn.on('pointerover', () => {
      if (logoutBtn && logoutBtn.active) {
        logoutBtn.setColor('#FF6666');
        logoutBtn.setScale(1.05);
      }
    });
    
    logoutBtn.on('pointerout', () => {
      if (logoutBtn && logoutBtn.active) {
        logoutBtn.setColor('#DC143C');
        logoutBtn.setScale(1.0);
      }
    });
    
    logoutBtn.on('pointerdown', () => {
      this.closeGuestDialog(elementsToClose);
      this.performFullLogout();
    });
  }
  
  private closeGuestDialog(elements: Phaser.GameObjects.GameObject[]) {
    elements.forEach(element => element.destroy());
  }
  
  private performFullLogout() {
    // Clear all stored auth data
    localStorage.removeItem('hemoclast_token');
    localStorage.removeItem('hemoclast_player_id');
    localStorage.removeItem('hemoclast_username');
    localStorage.removeItem('hemoclast_character_id');
    localStorage.removeItem('hemoclast_is_guest');
    localStorage.removeItem('hemoclast_is_registered');
    
    // Reset game store
    this.gameStore.store.getState().setPlayer(null as any);
    this.gameStore.store.getState().setCharacter(null as any);
    
    // Return to login
    this.cleanupForm();
    this.scene.start('LoginScene');
  }

  private handleTokenExpiration() {
    // Show user-friendly message about session expiration
    this.showError('Your session has expired. Please log in again.');
    
    // Clear all stored auth data (same as logout but with different messaging)
    localStorage.removeItem('hemoclast_token');
    localStorage.removeItem('hemoclast_player_id');
    localStorage.removeItem('hemoclast_username');
    localStorage.removeItem('hemoclast_character_id');
    
    // Keep guest/registered status for smoother re-authentication
    // Don't remove 'hemoclast_is_guest' or 'hemoclast_is_registered'
    
    // Reset game store
    this.gameStore.store.getState().setPlayer(null as any);
    this.gameStore.store.getState().setCharacter(null as any);
    
    // Delay redirect to allow user to see the error message
    this.time.delayedCall(2000, () => {
      this.cleanupForm();
      this.scene.start('LoginScene');
    });
  }

  private cleanupForm() {
    const form = document.getElementById('login-form');
    if (form) {
      form.remove();
    }
    
    // Also clean up delete confirmation input
    const deleteInput = document.getElementById('delete-confirmation-input');
    if (deleteInput) {
      deleteInput.remove();
    }
  }

  destroy() {
    this.cleanupForm();
  }
}
