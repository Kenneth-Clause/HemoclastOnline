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
    
    // Enhanced Gothic Title with responsive positioning
    const titlePos = ResponsiveLayout.getAnchoredPosition('top-center', 0, 80 * uiScale, width, height);
    GothicTitleUtils.createDrippingTitle(
      this,
      titlePos.x,
      titlePos.y,
      'CREATE YOUR',
      'CHAMPION',
      {
        mainSize: ResponsiveLayout.getScaledFontSize(28, width, height),
        subSize: ResponsiveLayout.getScaledFontSize(24, width, height),
        mainColor: '#8B0000',
        subColor: '#FFD700',
        spacing: 50 * uiScale,
        drippingEffect: true,
        glowEffect: true
      }
    );
    
    // Add gothic separator with responsive positioning
    const separatorPos = ResponsiveLayout.getAnchoredPosition('top-center', 0, 160 * uiScale, width, height);
    GothicTitleUtils.createGothicSeparator(
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
    
    // Character name input
    this.createNameInput();
    
    // Class selection
    this.createClassSelection();
    
    // Character preview
    this.createCharacterPreview();
    
    // Action buttons
    this.createActionButtons();
  }

  private createNameInput() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Name label with responsive positioning
    const labelPos = ResponsiveLayout.getAnchoredPosition('top-center', 0, 220 * uiScale, width, height);
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
    
    // Remove existing input
    const existingInput = document.getElementById('character-name-input');
    if (existingInput) {
      existingInput.remove();
    }
    
    // Get responsive input dimensions
    const inputDimensions = ResponsiveLayout.getMobileInputDimensions(250, 40, width, height);
    const inputPos = ResponsiveLayout.getAnchoredPosition('top-center', 0, 260 * uiScale, width, height);
    
    // Calculate position as percentage for CSS
    const leftPercent = (inputPos.x / width) * 100;
    const topPercent = (inputPos.y / height) * 100;
    
    // Create name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter character name';
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
      background: rgba(20, 20, 20, 0.9);
      border: ${Math.max(1, 2 * uiScale)}px solid #8B0000;
      border-radius: ${Math.max(4, 6 * uiScale)}px;
      color: #F5F5DC;
      font-family: 'Cinzel', serif;
      font-size: ${inputDimensions.fontSize}px;
      text-align: center;
      z-index: 1000;
      box-sizing: border-box;
    `;
    
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
    
    // Class selection title with responsive positioning
    const titlePos = ResponsiveLayout.getAnchoredPosition('top-center', 0, 340 * uiScale, width, height);
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
    
    // Responsive class slot layout
    const baseSlotWidth = 180;
    const slotWidth = Math.max(140, baseSlotWidth * uiScale);
    const slotSpacing = Math.max(10, 20 * uiScale);
    
    if (isMobile && ResponsiveLayout.getMobileAdjustments(width, height).isPortrait) {
      // Stack vertically on mobile portrait
      const startY = titlePos.y + 60 * uiScale;
      const slotHeight = Math.max(180, 200 * uiScale);
      
      classes.forEach((classData, index) => {
        const x = width / 2;
        const y = startY + index * (slotHeight + slotSpacing);
        
        this.createClassSlot(x, y, classData, slotWidth, slotHeight, width, height);
      });
    } else {
      // Horizontal layout for desktop and mobile landscape
      const totalWidth = classes.length * slotWidth + (classes.length - 1) * slotSpacing;
      const startX = width / 2 - totalWidth / 2 + slotWidth / 2;
      const y = titlePos.y + 120 * uiScale;
      
      classes.forEach((classData, index) => {
        const x = startX + index * (slotWidth + slotSpacing);
        
        this.createClassSlot(x, y, classData, slotWidth, Math.max(180, 200 * uiScale), width, height);
      });
    }
  }

  private createClassSlot(x: number, y: number, classData: any, slotWidth: number, slotHeight: number, screenWidth: number, screenHeight: number) {
    const isSelected = this.selectedClass === classData.name;
    const uiScale = ResponsiveLayout.getUIScale(screenWidth, screenHeight);
    
    // Responsive slot dimensions
    const actualWidth = Math.max(120, slotWidth - 20);
    const actualHeight = Math.max(160, slotHeight);
    const borderWidth = Math.max(2, 3 * uiScale);
    
    // Slot background
    const slotBg = this.add.rectangle(x, y, actualWidth, actualHeight, isSelected ? classData.color : 0x2d1b1b, 0.8);
    slotBg.setStrokeStyle(borderWidth, isSelected ? 0xFFD700 : 0x8B0000);
    
    // Class icon
    this.add.text(x, y - actualHeight * 0.3, classData.icon, {
      fontSize: `${ResponsiveLayout.getScaledFontSize(40, screenWidth, screenHeight)}px`
    }).setOrigin(0.5);
    
    // Class name
    this.add.text(x, y - actualHeight * 0.1, classData.title, {
      fontSize: `${ResponsiveLayout.getScaledFontSize(18, screenWidth, screenHeight)}px`,
      color: isSelected ? '#FFD700' : '#F5F5DC',
      fontFamily: 'Cinzel, serif',
    }).setOrigin(0.5);
    
    // Stats focus
    this.add.text(x, y + actualHeight * 0.02, classData.stats, {
      fontSize: `${ResponsiveLayout.getScaledFontSize(14, screenWidth, screenHeight)}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    
    // Description
    this.add.text(x, y + actualHeight * 0.2, classData.description, {
      fontSize: `${ResponsiveLayout.getScaledFontSize(12, screenWidth, screenHeight)}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      wordWrap: { width: actualWidth - 20 }
    }).setOrigin(0.5);
    
    // Make interactive with touch-friendly hit area
    const hitArea = this.add.rectangle(x, y, actualWidth, actualHeight, 0x000000, 0).setInteractive();
    
    hitArea.on('pointerdown', () => {
      this.selectClass(classData.name);
    });
  }

  private createCharacterPreview() {
    const { width, height } = this.scale;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    
    if (isMobile && mobileAdjustments.isPortrait) {
      // On mobile portrait, place preview at bottom
      const previewPos = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 200 * uiScale, width, height);
      const panelWidth = Math.min(280, width * 0.9);
      const panelHeight = Math.max(150, 180 * uiScale);
      
      GraphicsUtils.createUIPanel(
        this,
        previewPos.x,
        previewPos.y,
        panelWidth,
        panelHeight,
        0x1a1a1a,
        0x8B0000,
        Math.max(1, 2 * uiScale)
      );
      
      // Preview title
      this.add.text(previewPos.x, previewPos.y - panelHeight * 0.35, 'Preview', {
        fontSize: `${ResponsiveLayout.getScaledFontSize(18, width, height)}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
      }).setOrigin(0.5);
    } else {
      // Desktop and mobile landscape - place on right side
      const previewPos = ResponsiveLayout.getAnchoredPosition('top-right', 220 * uiScale, 300 * uiScale, width, height);
      const panelWidth = Math.max(160, 200 * uiScale);
      const panelHeight = Math.max(200, 300 * uiScale);
      
      GraphicsUtils.createUIPanel(
        this,
        previewPos.x,
        previewPos.y,
        panelWidth,
        panelHeight,
        0x1a1a1a,
        0x8B0000,
        Math.max(1, 2 * uiScale)
      );
      
      // Preview title
      this.add.text(previewPos.x, previewPos.y - panelHeight * 0.35, 'Preview', {
        fontSize: `${ResponsiveLayout.getScaledFontSize(18, width, height)}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
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
    
    // Character model placeholder
    const modelRadius = Math.max(25, 40 * uiScale);
    const characterModel = this.add.circle(0, -20 * uiScale, modelRadius, this.getClassColor(this.selectedClass));
    characterModel.setStrokeStyle(Math.max(1, 2 * uiScale), 0x8B0000);
    previewContainer.add(characterModel);
    
    // Class icon
    const classIcon = this.add.text(0, -20 * uiScale, this.getClassIcon(this.selectedClass), {
      fontSize: `${ResponsiveLayout.getScaledFontSize(32, width, height)}px`
    }).setOrigin(0.5);
    previewContainer.add(classIcon);
    
    // Character name
    if (this.characterName) {
      const nameText = this.add.text(0, 20 * uiScale, this.characterName, {
        fontSize: `${ResponsiveLayout.getScaledFontSize(16, width, height)}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
      }).setOrigin(0.5);
      previewContainer.add(nameText);
    }
    
    // Selected class
    const classText = this.add.text(0, 40 * uiScale, this.selectedClass.charAt(0).toUpperCase() + this.selectedClass.slice(1), {
      fontSize: `${ResponsiveLayout.getScaledFontSize(14, width, height)}px`,
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
    
    // Get touch-friendly button dimensions
    const createButtonDims = ResponsiveLayout.getTouchFriendlyButton(180, 50, width, height);
    const backButtonDims = ResponsiveLayout.getTouchFriendlyButton(120, 50, width, height);
    
    if (isMobile && mobileAdjustments.isPortrait) {
      // Stack buttons vertically on mobile portrait
      const buttonSpacing = 20 * uiScale;
      const buttonsY = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 120 * uiScale, width, height).y;
      
      // Enhanced Create character button
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2,
        buttonsY - buttonSpacing,
        createButtonDims.width,
        createButtonDims.height,
        'Create Champion',
        () => this.createCharacter(),
        {
          fontSize: ResponsiveLayout.getButtonFontSize(18, width, height),
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
      
      // Enhanced Back button
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2,
        buttonsY + buttonSpacing,
        backButtonDims.width,
        backButtonDims.height,
        'Back',
        () => this.goBack(),
        {
          fontSize: ResponsiveLayout.getButtonFontSize(16, width, height),
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
      // Horizontal layout for desktop and mobile landscape
      const buttonsY = ResponsiveLayout.getAnchoredPosition('bottom-center', 0, 100 * uiScale, width, height).y;
      const buttonSpacing = Math.max(40, 80 * uiScale);
      
      // Enhanced Create character button
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2 - buttonSpacing,
        buttonsY,
        createButtonDims.width,
        createButtonDims.height,
        'Create Champion',
        () => this.createCharacter(),
        {
          fontSize: ResponsiveLayout.getButtonFontSize(18, width, height),
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
      
      // Enhanced Back button
      GothicTitleUtils.createEnhancedGothicButton(
        this,
        width / 2 + buttonSpacing,
        buttonsY,
        backButtonDims.width,
        backButtonDims.height,
        'Back',
        () => this.goBack(),
        {
          fontSize: ResponsiveLayout.getButtonFontSize(16, width, height),
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
