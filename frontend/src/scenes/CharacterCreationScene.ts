/**
 * Character Creation Scene - Create new characters
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GraphicsUtils } from '../utils/GraphicsUtils';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';

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
    const baseFontSize = Math.min(width, height) / 60;
    
    // Enhanced atmospheric background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    
    // Add atmospheric particles
    const particles = GothicTitleUtils.createAtmosphericParticles(this, width, height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22],
      quantity: 3,
      speed: { min: 10, max: 25 },
      alpha: { min: 0.1, max: 0.3 }
    });
    
    // Enhanced Gothic Title
    const gothicTitle = GothicTitleUtils.createDrippingTitle(
      this,
      width / 2,
      height * 0.12,
      'CREATE YOUR',
      'CHAMPION',
      {
        mainSize: baseFontSize * 1.2,
        subSize: baseFontSize * 1.0,
        mainColor: '#8B0000',
        subColor: '#FFD700',
        spacing: 50,
        drippingEffect: true,
        glowEffect: true
      }
    );
    
    // Add gothic separator
    GothicTitleUtils.createGothicSeparator(
      this,
      width / 2,
      height * 0.22,
      width * 0.6,
      {
        color: 0x8B0000,
        ornamentColor: '#FFD700',
        thickness: 3,
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
    const baseFontSize = Math.min(width, height) / 80;
    
    // Name label
    this.add.text(width / 2, height * 0.25, 'Character Name:', {
      fontSize: `${baseFontSize * 1.2}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    
    // Create HTML input for character name
    this.createHTMLNameInput();
  }

  private createHTMLNameInput() {
    const { width, height } = this.scale;
    
    // Remove existing input
    const existingInput = document.getElementById('character-name-input');
    if (existingInput) {
      existingInput.remove();
    }
    
    // Create name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter character name';
    nameInput.id = 'character-name-input';
    nameInput.maxLength = 20;
    nameInput.style.cssText = `
      position: absolute;
      left: 50%;
      top: 30%;
      transform: translate(-50%, -50%);
      width: 250px;
      padding: 10px;
      background: rgba(20, 20, 20, 0.9);
      border: 2px solid #8B0000;
      border-radius: 6px;
      color: #F5F5DC;
      font-family: 'Cinzel', serif;
      font-size: 16px;
      text-align: center;
      z-index: 1000;
    `;
    
    nameInput.addEventListener('input', (e) => {
      this.characterName = (e.target as HTMLInputElement).value;
      this.updateCharacterPreview(); // Update preview when name changes
    });
    
    document.body.appendChild(nameInput);
  }

  private createClassSelection() {
    const { width, height } = this.scale;
    const baseFontSize = Math.min(width, height) / 80;
    
    // Class selection title
    this.add.text(width / 2, height * 0.4, 'Choose Your Path:', {
      fontSize: `${baseFontSize * 1.2}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
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
    
    const slotWidth = 180;
    const startX = width / 2 - slotWidth;
    
    classes.forEach((classData, index) => {
      const x = startX + index * slotWidth;
      const y = height * 0.55;
      
      this.createClassSlot(x, y, classData, baseFontSize);
    });
  }

  private createClassSlot(x: number, y: number, classData: any, fontSize: number) {
    const isSelected = this.selectedClass === classData.name;
    
    // Slot background
    const slotBg = this.add.rectangle(x, y, 160, 200, isSelected ? classData.color : 0x2d1b1b, 0.8);
    slotBg.setStrokeStyle(3, isSelected ? 0xFFD700 : 0x8B0000);
    
    // Class icon
    this.add.text(x, y - 60, classData.icon, {
      fontSize: `${fontSize * 2.5}px`
    }).setOrigin(0.5);
    
    // Class name
    this.add.text(x, y - 20, classData.title, {
      fontSize: `${fontSize * 1.2}px`,
      color: isSelected ? '#FFD700' : '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    
    // Stats focus
    this.add.text(x, y + 5, classData.stats, {
      fontSize: `${fontSize * 0.8}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    
    // Description
    this.add.text(x, y + 40, classData.description, {
      fontSize: `${fontSize * 0.7}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      wordWrap: { width: 140 }
    }).setOrigin(0.5);
    
    // Make interactive
    const hitArea = this.add.rectangle(x, y, 160, 200, 0x000000, 0).setInteractive();
    
    hitArea.on('pointerdown', () => {
      this.selectClass(classData.name);
    });
  }

  private createCharacterPreview() {
    const { width, height } = this.scale;
    const baseFontSize = Math.min(width, height) / 80;
    
    // Preview panel
    GraphicsUtils.createUIPanel(
      this,
      width - 250,
      height * 0.3,
      200,
      300,
      0x1a1a1a,
      0x8B0000,
      2
    );
    
    // Preview title
    this.add.text(width - 150, height * 0.35, 'Preview', {
      fontSize: `${baseFontSize * 1.2}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    
    // Character preview (will update based on selection)
    this.updateCharacterPreview();
  }

  private updateCharacterPreview() {
    const { width, height } = this.scale;
    const baseFontSize = Math.min(width, height) / 80;
    
    // Remove existing preview elements
    const existingPreview = this.children.getByName('character-preview');
    if (existingPreview) {
      existingPreview.destroy();
    }
    
    // Preview character
    const previewContainer = this.add.container(width - 150, height * 0.5);
    previewContainer.setName('character-preview');
    
    // Character model placeholder
    const characterModel = this.add.circle(0, -20, 40, this.getClassColor(this.selectedClass));
    characterModel.setStrokeStyle(2, 0x8B0000);
    previewContainer.add(characterModel);
    
    // Class icon
    const classIcon = this.add.text(0, -20, this.getClassIcon(this.selectedClass), {
      fontSize: `${baseFontSize * 2}px`
    }).setOrigin(0.5);
    previewContainer.add(classIcon);
    
    // Character name
    if (this.characterName) {
      const nameText = this.add.text(0, 20, this.characterName, {
        fontSize: `${baseFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      previewContainer.add(nameText);
    }
    
    // Selected class
    const classText = this.add.text(0, 40, this.selectedClass.charAt(0).toUpperCase() + this.selectedClass.slice(1), {
      fontSize: `${baseFontSize * 0.9}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    previewContainer.add(classText);
  }

  private createActionButtons() {
    const { width, height } = this.scale;
    const baseFontSize = Math.min(width, height) / 80;
    
    // Enhanced Create character button
    GothicTitleUtils.createEnhancedGothicButton(
      this,
      width / 2 - 100,
      height * 0.85,
      180,
      50,
      'Create Champion',
      () => this.createCharacter(),
      {
        fontSize: baseFontSize * 1.1,
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
      width / 2 + 100,
      height * 0.85,
      120,
      50,
      'Back',
      () => this.goBack(),
      {
        fontSize: baseFontSize,
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
    
    // Remove existing messages
    const existingMessage = this.children.getByName('success-message');
    if (existingMessage) {
      existingMessage.destroy();
    }
    
    // Show success message
    const successText = this.add.text(width / 2, height * 0.9, message, {
      fontSize: '18px',
      color: '#228B22',
      fontFamily: 'Cinzel, serif',
      backgroundColor: '#000000',
      padding: { x: 15, y: 8 }
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
    super.destroy();
  }
}
