/**
 * Character Creation Scene - Create new characters
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GraphicsUtils } from '../utils/GraphicsUtils';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export class CharacterCreationScene extends Scene {
  private gameStore: GameStore;
  private selectedClass: string = 'warrior';
  private characterName: string = '';

  constructor() {
    super({ key: 'CharacterCreationScene' });
    this.gameStore = GameStore.getInstance();
  }

  create() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Enhanced atmospheric background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    
    // Add atmospheric particles
    GothicTitleUtils.createAtmosphericParticles(this, width, height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22],
      quantity: 3,
      speed: { min: 10, max: 25 },
      alpha: { min: 0.1, max: 0.3 }
    });
    
    // Enhanced Gothic Title with responsive positioning - moved down for mobile
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    const titleYOffset = isMobileLayout ? height * 0.60 : 80 * uiScale; // Position just above red bar on mobile
    const titlePos = ResponsiveLayout.getAnchoredPosition('top-center', 0, titleYOffset, width, height);
    GothicTitleUtils.createDrippingTitle(
      this,
      titlePos.x,
      titlePos.y,
      'CREATE YOUR',
      'CHAMPION',
      {
        mainSize: isMobileLayout ? 
          ResponsiveLayout.getScaledFontSize(75, width, height) : // 25% bigger on mobile (28 * 1.25 = 35)
          ResponsiveLayout.getScaledFontSize(60, width, height),
        subSize: isMobileLayout ? 
          ResponsiveLayout.getScaledFontSize(75, width, height) : // 25% bigger on mobile (24 * 1.25 = 30)
          ResponsiveLayout.getScaledFontSize(60, width, height),
        mainColor: '#8B0000',
        subColor: '#FFD700',
        spacing: isMobileLayout ? 120 * uiScale : 50 * uiScale, // Much more spacing on mobile to push CHAMPION down
        drippingEffect: true,
        glowEffect: true
      }
    );
    
    // Add gothic separator with responsive positioning - positioned just above Character Name on mobile
    const separatorYOffset = isMobileLayout ? 
      height * 0.85 : // Much closer to Character Name (which is at 28%)
      200 * uiScale; // Moved down for desktop
    const separatorPos = ResponsiveLayout.getAnchoredPosition('top-center', 0, separatorYOffset, width, height);
    const separator = GothicTitleUtils.createGothicSeparator(
      this,
      separatorPos.x,
      separatorPos.y,
      Math.min(width * 0.8, 600 * uiScale),
      {
        color: 0x8B0000,
        ornamentColor: '#FFD700',
        thickness: Math.max(2, 3 * uiScale),
        ornaments: true
      }
    );
    // Set separator depth behind title for desktop
    if (!isMobileLayout && separator) {
      separator.setDepth(-1);
      // Also set depth for any ornament text objects that were just created
      const recentObjects = this.children.list.slice(-4); // Get the last 4 objects (graphics + 3 ornaments)
      recentObjects.forEach(obj => {
        if (obj.type === 'Text') {
          obj.setDepth(-1);
        }
      });
    }
    
    // Character name input
    this.createNameInput();
    
    // Class selection
    this.createClassSelection();
    
    // Character preview removed - not needed
    
    // Action buttons
    this.createActionButtons();
  }

  private createNameInput() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Name label with responsive positioning - positioned above class selection on mobile
    let labelPos;
    if (isMobileLayout) {
      // Mobile: Position above the "Choose Your Path" title
      labelPos = { x: width / 2, y: height * 0.28 }; // 28% down from top
    } else {
      // Desktop: Keep original positioning
      const labelYOffset = 220 * uiScale;
      labelPos = ResponsiveLayout.getAnchoredPosition('top-center', 0, labelYOffset, width, height);
    }
    this.add.text(labelPos.x, labelPos.y, 'Character Name:', {
      fontSize: `${ResponsiveLayout.getScaledFontSize(20, width, height)}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
    }).setOrigin(0.5);
    
    // Create HTML input for character name
    this.createHTMLNameInput();
  }

  private createHTMLNameInput() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 600) && isMobile;
    
    // Remove existing input
    const existingInput = document.getElementById('character-name-input');
    if (existingInput) {
      existingInput.remove();
    }
    
    // Get responsive input dimensions with enhanced mobile sizing
    const baseWidth = isMobileLayout ? 280 : 250;
    const baseHeight = isMobileLayout ? 50 : 40;
    const inputDimensions = ResponsiveLayout.getMobileInputDimensions(baseWidth, baseHeight, width, height);
    
    // Position input based on mobile vs desktop
    let inputPos;
    if (isMobileLayout) {
      // Mobile: Position below the character name label
      inputPos = { x: width / 2, y: height * 0.31 }; // 31% down from top
    } else {
      // Desktop: Keep original positioning
      const inputYOffset = 260 * uiScale;
      inputPos = ResponsiveLayout.getAnchoredPosition('top-center', 0, inputYOffset, width, height);
    }
    
    // Calculate position as percentage for CSS
    const leftPercent = (inputPos.x / width) * 100;
    const topPercent = (inputPos.y / height) * 100;
    
    // Enhanced mobile styling
    const borderWidth = isMobileLayout ? Math.max(2, 3 * uiScale) : Math.max(1, 2 * uiScale);
    const borderRadius = isMobileLayout ? Math.max(8, 10 * uiScale) : Math.max(4, 6 * uiScale);
    
    // Create name input with enhanced mobile styling
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = isMobileLayout ? 'Character name' : 'Enter character name';
    nameInput.id = 'character-name-input';
    nameInput.maxLength = 20;
    nameInput.style.cssText = `
      position: absolute;
      left: ${leftPercent}%;
      top: ${topPercent}%;
      transform: translate(-50%, -50%);
      width: ${inputDimensions.width}px;
      height: ${inputDimensions.height}px;
      padding: ${inputDimensions.padding}px;
      background: rgba(20, 20, 20, 0.95);
      border: ${borderWidth}px solid #8B0000;
      border-radius: ${borderRadius}px;
      color: #F5F5DC;
      font-family: 'Cinzel', serif;
      font-size: ${inputDimensions.fontSize}px;
      text-align: center;
      z-index: 1000;
      box-sizing: border-box;
      transition: all 0.3s ease;
      ${isMobileLayout ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);' : ''}
    `;
    
    // Enhanced mobile focus and blur effects
    nameInput.addEventListener('focus', () => {
      nameInput.style.borderColor = '#FFD700';
      nameInput.style.boxShadow = isMobileLayout 
        ? '0 0 15px rgba(255, 215, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)' 
        : '0 0 10px rgba(255, 215, 0, 0.3)';
    });
    
    nameInput.addEventListener('blur', () => {
      nameInput.style.borderColor = '#8B0000';
      nameInput.style.boxShadow = isMobileLayout 
        ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
        : 'none';
    });
    
    nameInput.addEventListener('input', (e) => {
      this.characterName = (e.target as HTMLInputElement).value;
      this.updateCharacterPreview(); // Update preview when name changes
    });
    
    document.body.appendChild(nameInput);
  }

  private createClassSelection() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Class selection title with responsive positioning - positioned above class cards
    let titlePos;
    if (isMobileLayout) {
      // Mobile: Position title closer to the class card
      titlePos = { x: width / 2, y: height * 0.38 }; // 38% down from top, closer to 55% class card
    } else {
      // Desktop: Move further down
      const titleYOffset = 420 * uiScale; // Moved down from 340
      titlePos = ResponsiveLayout.getAnchoredPosition('top-center', 0, titleYOffset, width, height);
    }
    
    this.add.text(titlePos.x, titlePos.y, 'Choose Your Path:', {
      fontSize: `${ResponsiveLayout.getScaledFontSize(20, width, height)}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
    }).setOrigin(0.5);
    
    // Class options
    const classes = [
      {
        name: 'warrior',
        title: 'Warrior',
        description: 'Stalwart defender with strength and vitality.\nSpecializes in tanking and bleeding enemies.',
        icon: '⚔️',
        color: 0x8B0000,
        stats: 'STR/VIT Focus'
      },
      {
        name: 'rogue',
        title: 'Rogue',
        description: 'Swift assassin with agility and cunning.\nMasters of critical strikes and combos.',
        icon: '🗡️',
        color: 0x228B22,
        stats: 'AGI/STR Focus'
      },
      {
        name: 'mage',
        title: 'Mage',
        description: 'Arcane scholar wielding elemental magic.\nControls the battlefield with spells.',
        icon: '🔮',
        color: 0x4B0082,
        stats: 'INT/VIT Focus'
      }
    ];
    
    if (isMobileLayout) {
      // Mobile: Use CharacterSelectionScene approach with navigation
      this.createMobileClassNavigation(classes, titlePos.y + 60 * uiScale, width, height);
    } else {
      // Desktop: Keep horizontal layout with even bigger cards
      const baseSlotWidth = 280; // Increased from 240
      const slotWidth = Math.max(240, baseSlotWidth * uiScale); // Increased minimum from 200
      const slotSpacing = Math.max(20, 30 * uiScale); // Increased spacing
      
      const totalWidth = classes.length * slotWidth + (classes.length - 1) * slotSpacing;
      const startX = width / 2 - totalWidth / 2 + slotWidth / 2;
      const y = titlePos.y + 220 * uiScale; // Moved down even further from 180
      
      classes.forEach((classData, index) => {
        const x = startX + index * (slotWidth + slotSpacing);
        const slotHeight = Math.max(300, 340 * uiScale); // Even bigger from 250/280
        
        this.createClassSlot(x, y, classData, slotWidth, slotHeight, width, height);
      });
    }
  }

  private currentMobileClassIndex: number = 0;

  private createMobileClassNavigation(classes: any[], startY: number, width: number, height: number) {
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Use larger mobile-friendly card dimensions (similar to CharacterSelectionScene)
    const slotWidth = Math.max(240, 300 * uiScale);
    const slotHeight = Math.max(280, 320 * uiScale); // Reduced height to fit better
    const slotX = width / 2;
    const slotY = height * 0.55; // Position below the input field and title (55% down from top)
    
    // Display current class card
    const currentClass = classes[this.currentMobileClassIndex];
    this.createClassSlot(slotX, slotY, currentClass, slotWidth, slotHeight, width, height);
    
    // Create navigation arrows
    const arrowY = slotY;
    const arrowSize = Math.max(30, 40 * uiScale);
    const arrowDistance = slotWidth / 2 + 60;
    
    // Left arrow
    if (this.currentMobileClassIndex > 0) {
      const leftArrow = this.add.text(slotX - arrowDistance, arrowY, '◀', {
        fontSize: `${arrowSize}px`,
        color: '#FFD700',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      leftArrow.on('pointerdown', () => {
        this.currentMobileClassIndex = Math.max(0, this.currentMobileClassIndex - 1);
        this.refreshMobileClassDisplay();
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
    if (this.currentMobileClassIndex < classes.length - 1) {
      const rightArrow = this.add.text(slotX + arrowDistance, arrowY, '▶', {
        fontSize: `${arrowSize}px`,
        color: '#FFD700',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      rightArrow.on('pointerdown', () => {
        this.currentMobileClassIndex = Math.min(classes.length - 1, this.currentMobileClassIndex + 1);
        this.refreshMobileClassDisplay();
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
    
    // Add class indicator dots
    this.createClassIndicators(classes, width, height, slotY, slotHeight);
  }
  
  private createClassIndicators(classes: any[], width: number, height: number, cardY: number, cardHeight: number) {
    const indicatorY = cardY + cardHeight / 2 + 40;
    const dotSpacing = 30;
    const startX = width / 2 - (dotSpacing * (classes.length - 1)) / 2;
    
    for (let i = 0; i < classes.length; i++) {
      const x = startX + i * dotSpacing;
      const isActive = i === this.currentMobileClassIndex;
      const isSelected = classes[i].name === this.selectedClass;
      
      let color = '#666666'; // Default
      if (isSelected) {
        color = '#FFD700'; // Selected class
      } else if (isActive) {
        color = '#C0C0C0'; // Currently viewing
      }
      
      const dot = this.add.circle(x, indicatorY, isActive ? 8 : 6, parseInt(color.replace('#', '0x')));
      dot.setStrokeStyle(2, 0x8B0000);
      
      // Make dots clickable
      dot.setInteractive({ useHandCursor: true });
      dot.on('pointerdown', () => {
        this.currentMobileClassIndex = i;
        this.refreshMobileClassDisplay();
      });
    }
  }
  
  private refreshMobileClassDisplay() {
    // Clear existing display and recreate
    this.children.removeAll();
    this.create();
  }

  private createClassSlot(x: number, y: number, classData: any, slotWidth: number, slotHeight: number, screenWidth: number, screenHeight: number) {
    const isSelected = this.selectedClass === classData.name;
    const uiScale = ResponsiveLayout.getUIScale(screenWidth, screenHeight);
    const isMobile = ResponsiveLayout.isMobile(screenWidth, screenHeight);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || screenWidth < 600) && isMobile;
    
    // Enhanced responsive slot dimensions with mobile optimization
    const actualWidth = Math.max(120, slotWidth - 20);
    const actualHeight = Math.max(160, slotHeight);
    const borderWidth = isMobileLayout ? Math.max(3, 4 * uiScale) : Math.max(2, 3 * uiScale);
    
    // Enhanced slot background with mobile-specific styling
    const slotBg = this.add.rectangle(x, y, actualWidth, actualHeight, isSelected ? classData.color : 0x2d1b1b, 0.8);
    slotBg.setStrokeStyle(borderWidth, isSelected ? 0xFFD700 : 0x8B0000);
    
    // Add subtle glow effect for selected state on mobile
    if (isSelected && isMobileLayout) {
      const glowEffect = this.add.graphics();
      glowEffect.lineStyle(2, 0xFFD700, 0.4);
      for (let i = 0; i < 3; i++) {
        glowEffect.strokeRoundedRect(
          x - actualWidth/2 - i * 2, 
          y - actualHeight/2 - i * 2, 
          actualWidth + i * 4, 
          actualHeight + i * 4, 
          6 + i
        );
      }
    }
    
    // Enhanced class icon with mobile scaling
    const iconSize = isMobileLayout ? 
      ResponsiveLayout.getScaledFontSize(48, screenWidth, screenHeight) : 
      ResponsiveLayout.getScaledFontSize(40, screenWidth, screenHeight);
    
    this.add.text(x, y - actualHeight * 0.3, classData.icon, {
      fontSize: `${iconSize}px`
    }).setOrigin(0.5);
    
    // Enhanced class name with mobile sizing
    const titleSize = isMobileLayout ? 
      ResponsiveLayout.getScaledFontSize(20, screenWidth, screenHeight) : 
      ResponsiveLayout.getScaledFontSize(18, screenWidth, screenHeight);
    
    this.add.text(x, y - actualHeight * 0.1, classData.title, {
      fontSize: `${titleSize}px`,
      color: isSelected ? '#FFD700' : '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: isMobileLayout ? 2 : 1
    }).setOrigin(0.5);
    
    // Enhanced stats focus with mobile sizing
    const statsSize = isMobileLayout ? 
      ResponsiveLayout.getScaledFontSize(16, screenWidth, screenHeight) : 
      ResponsiveLayout.getScaledFontSize(14, screenWidth, screenHeight);
    
    this.add.text(x, y + actualHeight * 0.02, classData.stats, {
      fontSize: `${statsSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    
    // Enhanced description with mobile sizing
    const descSize = isMobileLayout ? 
      ResponsiveLayout.getScaledFontSize(13, screenWidth, screenHeight) : 
      ResponsiveLayout.getScaledFontSize(12, screenWidth, screenHeight);
    
    this.add.text(x, y + actualHeight * 0.2, classData.description, {
      fontSize: `${descSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      wordWrap: { width: actualWidth - (isMobileLayout ? 30 : 20) },
      lineSpacing: isMobileLayout ? 2 : 0
    }).setOrigin(0.5);
    
    // Enhanced interactive area with mobile-friendly hit area and visual feedback
    const hitArea = this.add.rectangle(x, y, actualWidth, actualHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    // Enhanced mobile touch feedback
    if (isMobileLayout) {
      hitArea.on('pointerover', () => {
        if (!isSelected) {
          slotBg.setAlpha(0.9);
          slotBg.setStrokeStyle(borderWidth, 0xDC143C);
        }
      });
      
      hitArea.on('pointerout', () => {
        if (!isSelected) {
          slotBg.setAlpha(0.8);
          slotBg.setStrokeStyle(borderWidth, 0x8B0000);
        }
      });
    }
    
    hitArea.on('pointerdown', () => {
      // Add touch feedback animation on mobile
      if (isMobileLayout) {
        this.tweens.add({
          targets: slotBg,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 100,
          yoyo: true,
          ease: 'Power2'
        });
      }
      this.selectClass(classData.name);
    });
  }

  private createCharacterPreview() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 600) && isMobile;
    
    if (isMobile && mobileAdjustments.isPortrait) {
      // Enhanced mobile portrait preview - larger and more prominent
      const previewPos = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 200 * uiScale, width, height);
      const panelWidth = isMobileLayout ? Math.min(320, width * 0.9) : Math.min(280, width * 0.9);
      const panelHeight = isMobileLayout ? Math.max(180, 220 * uiScale) : Math.max(150, 180 * uiScale);
      
      // Enhanced panel with mobile styling
      GraphicsUtils.createUIPanel(
        this,
        previewPos.x,
        previewPos.y,
        panelWidth,
        panelHeight,
        0x1a1a1a,
        0x8B0000,
        isMobileLayout ? Math.max(2, 3 * uiScale) : Math.max(1, 2 * uiScale)
      );
      
      // Enhanced preview title with mobile sizing
      const titleSize = isMobileLayout ? 
        ResponsiveLayout.getScaledFontSize(20, width, height) : 
        ResponsiveLayout.getScaledFontSize(18, width, height);
      
      this.add.text(previewPos.x, previewPos.y - panelHeight * 0.35, 'Preview', {
        fontSize: `${titleSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        stroke: '#000000',
        strokeThickness: isMobileLayout ? 2 : 1
      }).setOrigin(0.5);
    } else {
      // Desktop and mobile landscape - enhanced right side panel
      const previewPos = ResponsiveLayout.getAnchoredPosition('top-right', 220 * uiScale, 300 * uiScale, width, height);
      const panelWidth = isMobileLayout ? Math.max(180, 220 * uiScale) : Math.max(160, 200 * uiScale);
      const panelHeight = isMobileLayout ? Math.max(240, 320 * uiScale) : Math.max(200, 300 * uiScale);
      
      // Enhanced panel with mobile considerations
      GraphicsUtils.createUIPanel(
        this,
        previewPos.x,
        previewPos.y,
        panelWidth,
        panelHeight,
        0x1a1a1a,
        0x8B0000,
        isMobileLayout ? Math.max(2, 3 * uiScale) : Math.max(1, 2 * uiScale)
      );
      
      // Enhanced preview title
      const titleSize = isMobileLayout ? 
        ResponsiveLayout.getScaledFontSize(20, width, height) : 
        ResponsiveLayout.getScaledFontSize(18, width, height);
      
      this.add.text(previewPos.x, previewPos.y - panelHeight * 0.35, 'Preview', {
        fontSize: `${titleSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        stroke: '#000000',
        strokeThickness: isMobileLayout ? 2 : 1
      }).setOrigin(0.5);
    }
    
    // Character preview (will update based on selection)
    this.updateCharacterPreview();
  }

  private updateCharacterPreview() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 600) && isMobile;
    
    // Remove existing preview elements
    const existingPreview = this.children.getByName('character-preview');
    if (existingPreview) {
      existingPreview.destroy();
    }
    
    // Calculate preview container position
    let containerPos;
    if (isMobile && mobileAdjustments.isPortrait) {
      containerPos = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 200 * uiScale, width, height);
    } else {
      containerPos = ResponsiveLayout.getAnchoredPosition('top-right', 220 * uiScale, 350 * uiScale, width, height);
    }
    
    // Preview character
    const previewContainer = this.add.container(containerPos.x, containerPos.y);
    previewContainer.setName('character-preview');
    
    // Enhanced character model placeholder with mobile sizing
    const modelRadius = isMobileLayout ? Math.max(35, 50 * uiScale) : Math.max(25, 40 * uiScale);
    const characterModel = this.add.circle(0, -20 * uiScale, modelRadius, this.getClassColor(this.selectedClass));
    characterModel.setStrokeStyle(isMobileLayout ? Math.max(2, 3 * uiScale) : Math.max(1, 2 * uiScale), 0x8B0000);
    previewContainer.add(characterModel);
    
    // Enhanced class icon with mobile sizing
    const iconSize = isMobileLayout ? 
      ResponsiveLayout.getScaledFontSize(40, width, height) : 
      ResponsiveLayout.getScaledFontSize(32, width, height);
    
    const classIcon = this.add.text(0, -20 * uiScale, this.getClassIcon(this.selectedClass), {
      fontSize: `${iconSize}px`
    }).setOrigin(0.5);
    previewContainer.add(classIcon);
    
    // Enhanced character name with mobile styling
    if (this.characterName) {
      const nameSize = isMobileLayout ? 
        ResponsiveLayout.getScaledFontSize(18, width, height) : 
        ResponsiveLayout.getScaledFontSize(16, width, height);
      
      const nameText = this.add.text(0, 20 * uiScale, this.characterName, {
        fontSize: `${nameSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        stroke: '#000000',
        strokeThickness: isMobileLayout ? 1 : 0
      }).setOrigin(0.5);
      previewContainer.add(nameText);
    }
    
    // Enhanced selected class with mobile styling
    const classSize = isMobileLayout ? 
      ResponsiveLayout.getScaledFontSize(16, width, height) : 
      ResponsiveLayout.getScaledFontSize(14, width, height);
    
    const classText = this.add.text(0, 40 * uiScale, this.selectedClass.charAt(0).toUpperCase() + this.selectedClass.slice(1), {
      fontSize: `${classSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    previewContainer.add(classText);
  }

  private createActionButtons() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    
    // Calculate button dimensions based on text content to prevent wrapping - adjusted mobile font sizes
    const createFontSize = ResponsiveLayout.getButtonFontSize(isMobileLayout ? 18 : 18, width, height);
    const backFontSize = ResponsiveLayout.getButtonFontSize(isMobileLayout ? 20 : 16, width, height);
    
    // Create temporary text objects to measure "Create Champion" text
    const tempCreateText = this.add.text(0, 0, 'Create Champion', {
      fontSize: `${createFontSize}px`,
      fontFamily: 'Cinzel, serif',
    });
    const tempBackText = this.add.text(0, 0, 'Back', {
      fontSize: `${backFontSize}px`,
      fontFamily: 'Cinzel, serif',
    });
    
    // Calculate required dimensions with padding
    const textPadding = isMobileLayout ? 40 : 32;
    const createRequiredWidth = tempCreateText.width + textPadding;
    const backRequiredWidth = tempBackText.width + textPadding;
    const buttonHeight = isMobileLayout ? Math.max(55, tempCreateText.height + 24) : Math.max(50, tempCreateText.height + 20);
    
    // Clean up temp text
    tempCreateText.destroy();
    tempBackText.destroy();
    
    // Use the larger of the two widths for both buttons to make them match
    const buttonWidth = Math.max(createRequiredWidth, backRequiredWidth);
    
    const createButtonDims = { width: buttonWidth, height: buttonHeight };
    const backButtonDims = { width: buttonWidth, height: buttonHeight };
    
    if (isMobileLayout) {
      // Mobile: Position buttons below class cards and indicators
      const buttonSpacing = 25 * uiScale;
      const buttonsY = height * 0.85; // Position lower to be below class cards and indicators
      
      // Create Champion button
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2,
        buttonsY,
        createButtonDims.width,
        createButtonDims.height,
        'Create Champion',
        () => this.createCharacter(),
        {
          fontSize: isMobileLayout ? 14 : 18, // Same font size for both mobile and desktop
          bgColor: 0x4a0000,
          borderColor: 0x8B0000,
          textColor: '#FFD700',
          hoverBgColor: 0x8B0000,
          hoverBorderColor: 0xFFD700,
          hoverTextColor: '#FFFFFF',
          glowEffect: true,
          shadowEffect: true
        }
      );
      
      // Back button below Create Champion - same size as Create Champion
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2,
        buttonsY + createButtonDims.height + buttonSpacing,
        backButtonDims.width,
        backButtonDims.height,
        'Back',
        () => this.goBack(),
        {
          fontSize: isMobileLayout ? 20 : 16, // Moderately larger font on mobile
          bgColor: 0x2d1b1b,
          borderColor: 0x666666,
          textColor: '#F5F5DC',
          hoverBgColor: 0x4a0000,
          hoverBorderColor: 0x8B0000,
          hoverTextColor: '#FFD700',
          glowEffect: false,
          shadowEffect: true
        }
      );
    } else {
      // Desktop: Stack buttons vertically and move them up
      const buttonsY = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 160 * uiScale, width, height).y; // Moved up from 80
      const buttonSpacing = 25 * uiScale; // Vertical spacing between buttons
      
      // Create character button (top button)
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2,
        buttonsY,
        createButtonDims.width,
        createButtonDims.height,
        'Create Champion',
        () => this.createCharacter(),
        {
          fontSize: 18, // Keep original desktop font size
          bgColor: 0x4a0000,
          borderColor: 0x8B0000,
          textColor: '#FFD700',
          hoverBgColor: 0x8B0000,
          hoverBorderColor: 0xFFD700,
          hoverTextColor: '#FFFFFF',
          glowEffect: true,
          shadowEffect: true
        }
      );
      
      // Back button (bottom button)
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2,
        buttonsY + createButtonDims.height + buttonSpacing,
        backButtonDims.width,
        backButtonDims.height,
        'Back',
        () => this.goBack(),
        {
          fontSize: 16, // Keep original desktop font size
          bgColor: 0x2d1b1b,
          borderColor: 0x666666,
          textColor: '#F5F5DC',
          hoverBgColor: 0x4a0000,
          hoverBorderColor: 0x8B0000,
          hoverTextColor: '#FFD700',
          glowEffect: false,
          shadowEffect: true
        }
      );
    }
  }

  private selectClass(className: string) {
    this.selectedClass = className;
    this.scene.restart(); // Refresh to show selection
  }

  private async createCharacter() {
    if (!this.characterName.trim()) {
      this.showError('Please enter a character name');
      return;
    }
    
    if (this.characterName.length < 3) {
      this.showError('Character name must be at least 3 characters');
      return;
    }
    
    const token = localStorage.getItem('hemoclast_token');
    const guestId = localStorage.getItem('hemoclast_guest_id');
    
    // Handle guest account character creation
    if (guestId && !token) {
      // For guest accounts, create a mock character locally
      const character = {
        id: Date.now(), // Use timestamp as mock ID
        name: this.characterName,
        character_class: this.selectedClass,
        level: 1,
        experience: 0,
        stats: {
          strength: 10,
          agility: 10,
          intelligence: 10,
          vitality: 10
        }
      };
      
      // Store guest character locally
      localStorage.setItem('hemoclast_guest_character', JSON.stringify(character));
      
      this.selectCharacter(character);
      return;
    }
    
    // Handle authenticated user character creation
    if (!token) {
      this.showError('Please log in to create a character');
      return;
    }
    
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Creating character:', { name: this.characterName, character_class: this.selectedClass });
      
      const response = await fetch('/api/v1/characters/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: this.characterName,
          character_class: this.selectedClass
        })
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const character = await response.json();
        console.log('Character created successfully:', character);
        
        // Clear the name input
        const nameInput = document.getElementById('character-name-input') as HTMLInputElement;
        if (nameInput) {
          nameInput.value = '';
        }
        
        this.selectCharacter(character);
      } else if (response.status === 401) {
        // Token expired or invalid
        console.warn('Authentication token expired during character creation');
        this.handleTokenExpiration();
        return;
      } else {
        const errorText = await response.text();
        console.error('Character creation error:', response.status, errorText);
        
        try {
          const error = JSON.parse(errorText);
          this.showError(error.detail || 'Failed to create character');
        } catch {
          this.showError(`Server error (${response.status}): ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private selectCharacter(character: any) {
    // Set selected character in game store
    this.gameStore.store.getState().setCharacter(character);
    
    // Store selected character ID
    localStorage.setItem('hemoclast_character_id', character.id.toString());
    
    // Show success message briefly
    this.showSuccess(`${character.name} the ${character.character_class} has been created!`);
    
    // Go to character selection to show the new character
    this.time.delayedCall(1500, () => {
      this.cleanupForm();
      this.scene.start('CharacterSelectionScene');
    });
  }
  
  private showSuccess(message: string) {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Remove existing messages
    const existingMessage = this.children.getByName('success-message');
    if (existingMessage) {
      existingMessage.destroy();
    }
    
    // Show success message with responsive positioning
    const messagePos = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 50 * uiScale, width, height);
    const successText = this.add.text(messagePos.x, messagePos.y, message, {
      fontSize: `${ResponsiveLayout.getScaledFontSize(16, width, height)}px`,
      color: '#228B22',
      fontFamily: 'Cinzel, serif',
      backgroundColor: '#000000',
      padding: { x: Math.max(10, 15 * uiScale), y: Math.max(6, 8 * uiScale) },
      align: 'center',
      wordWrap: { width: Math.min(400, width * 0.8) }
    }).setOrigin(0.5).setName('success-message');
    
    // Fade out after showing
    this.tweens.add({
      targets: successText,
      alpha: 0,
      duration: 1000,
      delay: 500,
      onComplete: () => {
        successText.destroy();
      }
    });
  }

  private goBack() {
    this.cleanupForm();
    this.scene.start('CharacterSelectionScene');
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

  private showError(message: string) {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Remove existing error
    const existingError = this.children.getByName('error-message');
    if (existingError) {
      existingError.destroy();
    }
    
    // Show error message with responsive positioning
    const messagePos = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 50 * uiScale, width, height);
    const errorText = this.add.text(messagePos.x, messagePos.y, message, {
      fontSize: `${ResponsiveLayout.getScaledFontSize(14, width, height)}px`,
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      backgroundColor: '#000000',
      padding: { x: Math.max(8, 10 * uiScale), y: Math.max(4, 5 * uiScale) },
      align: 'center',
      wordWrap: { width: Math.min(400, width * 0.8) }
    }).setOrigin(0.5).setName('error-message');
    
    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      if (errorText) {
        errorText.destroy();
      }
    });
  }

  private handleTokenExpiration() {
    // Show user-friendly message about session expiration
    this.showError('Your session has expired. Please log in again.');
    
    // Clear all stored auth data
    localStorage.removeItem('hemoclast_token');
    localStorage.removeItem('hemoclast_player_id');
    localStorage.removeItem('hemoclast_username');
    localStorage.removeItem('hemoclast_character_id');
    
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
    const input = document.getElementById('character-name-input');
    if (input) {
      input.remove();
    }
  }

  destroy() {
    this.cleanupForm();
  }
}
