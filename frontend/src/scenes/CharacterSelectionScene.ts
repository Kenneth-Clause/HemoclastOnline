/**
 * Character Selection Scene - Choose or create characters
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GraphicsUtils } from '../utils/GraphicsUtils';

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
      fontWeight: '600',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Show guest warning if applicable
    this.showGuestWarning();
    
    // Load player's characters
    await this.loadCharacters();
    
    // Display character slots
    this.displayCharacterSlots();
    
    // Add Enter World button (centered below character slots)
    this.createEnterWorldButton();
    
    // Add bottom left buttons (Logout, Settings, Credits)
    this.createBottomLeftButtons();
  }

  private showGuestWarning() {
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    
    // Only show warning for actual guest accounts (not registered users)
    if (isGuest && !isRegistered) {
      const { width, height } = this.scale;
      const baseFontSize = Math.min(width, height) / 100;
      
      // Warning panel - repositioned to accommodate new header
      GraphicsUtils.createUIPanel(
        this,
        width / 2 - 300,
        height * 0.26,
        600,
        60,
        0x4a0000,
        0xDC143C,
        2
      );
      
      // Warning text
      this.add.text(width / 2, height * 0.28, '⚠️ Guest Account Warning', {
        fontSize: `${baseFontSize * 1.2}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5);
      
      this.add.text(width / 2, height * 0.30, 'Your progress is stored locally. Create an account to secure your data!', {
        fontSize: `${baseFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0.5);
      
      // Create account button
      const createAccountBtn = this.add.text(width - 100, height * 0.30, 'Create Account →', {
        fontSize: `${baseFontSize}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      }).setOrigin(0.5).setInteractive();
      
      createAccountBtn.on('pointerover', () => {
        createAccountBtn.setColor('#FFFFFF');
      });
      
      createAccountBtn.on('pointerout', () => {
        createAccountBtn.setColor('#FFD700');
      });
      
      createAccountBtn.on('pointerdown', () => {
        this.upgradeGuestAccount();
      });
    }
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
    const slotWidth = 200;
    const slotHeight = 300;
    const spacing = 50;
    
    // Calculate total width needed for 3 slots: (3 * slotWidth) + (2 * spacing)
    const totalWidth = (3 * slotWidth) + (2 * spacing);
    const startX = (width - totalWidth) / 2 + slotWidth / 2; // Add half slot width since slots are centered on their x position
    
    // Adjust slot positioning based on whether guest warning is shown
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    const showGuestWarning = isGuest && !isRegistered;
    
    const slotY = showGuestWarning ? height * 0.60 : height * 0.50;
    
    // Display 3 character slots
    for (let i = 0; i < 3; i++) {
      const x = startX + i * (slotWidth + spacing);
      const character = this.characters[i] || null;
      
      this.createCharacterSlot(x, slotY, slotWidth, slotHeight, character, i);
    }
  }

  private createCharacterSlot(x: number, y: number, width: number, height: number, character: any, slotIndex: number) {
    const baseFontSize = Math.min(this.scale.width, this.scale.height) / 80;
    
    // Check if this character is selected
    const selectedCharacterId = localStorage.getItem('hemoclast_character_id');
    const isSelected = character && selectedCharacterId && character.id.toString() === selectedCharacterId;
    
    // Slot background with enhanced styling - highlight if selected
    const backgroundColor = character ? (isSelected ? 0x4a0000 : 0x2d1b1b) : 0x1a1a1a;
    const borderColor = character ? (isSelected ? 0xFFD700 : 0x8B0000) : 0x666666;
    const borderWidth = character ? (isSelected ? 4 : 3) : 2;
    
    const slotBg = GraphicsUtils.createUIPanel(
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
      this.displayExistingCharacter(x, y, character, baseFontSize);
    } else {
      // Empty slot - create new character
      this.displayEmptySlot(x, y, slotIndex, baseFontSize);
    }
  }

  private displayExistingCharacter(x: number, y: number, character: any, fontSize: number) {
    // Character portrait placeholder
    const portrait = this.add.circle(x, y - 80, 50, this.getClassColor(character.character_class));
    portrait.setStrokeStyle(3, 0x8B0000);
    
    // Class icon
    this.add.text(x, y - 80, this.getClassIcon(character.character_class), {
      fontSize: `${fontSize * 2}px`
    }).setOrigin(0.5);
    
    // Character name
    this.add.text(x, y - 10, character.name, {
      fontSize: `${fontSize * 1.2}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5);
    
    // Character class and level
    this.add.text(x, y + 15, `${character.character_class} • Level ${character.level}`, {
      fontSize: `${fontSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif'
    }).setOrigin(0.5);
    
    // Select button (changed from Play)
    const selectButton = GraphicsUtils.createRuneScapeButton(
      this,
      x,
      y + 80,
      120,
      35,
      'Select',
      fontSize,
      () => this.selectCharacter(character)
    );
    
    // Enhanced Delete button with better visual feedback
    const deleteButton = this.add.graphics();
    const deleteText = this.add.text(x, y + 120, 'Delete', {
      fontSize: `${fontSize * 0.8}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Draw delete button with danger styling
    const drawDeleteButton = (bgColor: number, borderColor: number, glowing: boolean = false) => {
      deleteButton.clear();
      
      // Add glow effect if hovering
      if (glowing) {
        deleteButton.fillStyle(borderColor, 0.3);
        deleteButton.fillRoundedRect(x - 54, y + 101, 108, 38, 6);
      }
      
      // Main button background
      deleteButton.fillStyle(bgColor, 0.9);
      deleteButton.fillRoundedRect(x - 50, y + 105, 100, 30, 4);
      
      // Border
      deleteButton.lineStyle(2, borderColor);
      deleteButton.strokeRoundedRect(x - 50, y + 105, 100, 30, 4);
    };
    
    // Initial button state
    drawDeleteButton(0x4a0000, 0xDC143C);
    
    // Enhanced interactive area with proper cursor
    const deleteHitArea = this.add.rectangle(x, y + 120, 110, 35, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    // Enhanced hover effects
    deleteHitArea.on('pointerover', () => {
      drawDeleteButton(0x8B0000, 0xFF6666, true);
      deleteText.setColor('#FFFFFF');
      deleteText.setScale(1.05);
    });
    
    deleteHitArea.on('pointerout', () => {
      drawDeleteButton(0x4a0000, 0xDC143C);
      deleteText.setColor('#FFD700');
      deleteText.setScale(1.0);
    });
    
    deleteHitArea.on('pointerdown', () => {
      // Press animation
      deleteText.setScale(0.95);
      this.time.delayedCall(100, () => {
        deleteText.setScale(1.0);
        this.confirmDeleteCharacter(character);
      });
    });
  }

  private displayEmptySlot(x: number, y: number, slotIndex: number, fontSize: number) {
    // Empty slot icon
    this.add.text(x, y - 50, '➕', {
      fontSize: `${fontSize * 3}px`,
      color: '#666666'
    }).setOrigin(0.5);
    
    // Create character text
    this.add.text(x, y, 'Create New\nCharacter', {
      fontSize: `${fontSize}px`,
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create button
    GraphicsUtils.createRuneScapeButton(
      this,
      x,
      y + 80,
      120,
      35,
      'Create',
      fontSize,
      () => this.createNewCharacter()
    );
  }

  private createEnterWorldButton() {
    const { width, height } = this.scale;
    const baseFontSize = Math.min(width, height) / 80;
    
    // Check if a character is selected
    const selectedCharacterId = localStorage.getItem('hemoclast_character_id');
    const isCharacterSelected = selectedCharacterId && this.characters.some(char => char && char.id.toString() === selectedCharacterId);
    
    // Position below character slots
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    const showGuestWarning = isGuest && !isRegistered;
    const buttonY = showGuestWarning ? height * 0.85 : height * 0.80;
    
    // Create Enter World button
    const enterWorldButton = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2,
      buttonY,
      180,
      50,
      'Enter World',
      baseFontSize * 1.2,
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
    const baseFontSize = Math.min(width, height) / 80;
    const buttonX = 100;
    const buttonSpacing = 45;
    const bottomMargin = 30;
    
    // Stack buttons vertically with logout at the bottom
    const logoutY = height - bottomMargin;
    const settingsY = logoutY - buttonSpacing;
    const creditsY = settingsY - buttonSpacing;
    
    // Credits button (top)
    const creditsButton = GraphicsUtils.createRuneScapeButton(
      this,
      buttonX,
      creditsY,
      100,
      35,
      'Credits',
      baseFontSize * 0.9,
      () => this.goToCredits()
    );
    
    // Settings button (middle)
    const settingsButton = GraphicsUtils.createRuneScapeButton(
      this,
      buttonX,
      settingsY,
      100,
      35,
      'Settings',
      baseFontSize * 0.9,
      () => this.goToSettings()
    );
    
    // Logout button (bottom)
    const logoutButton = GraphicsUtils.createRuneScapeButton(
      this,
      buttonX,
      logoutY,
      120,
      35,
      '← Logout',
      baseFontSize * 0.9,
      () => this.logout()
    );
  }
  
  private enterWorld() {
    const selectedCharacterId = localStorage.getItem('hemoclast_character_id');
    
    if (!selectedCharacterId) {
      this.showError('Please select a character first');
      return;
    }
    
    // Go to the game world
    this.cleanupForm();
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
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
      fontWeight: '600',
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
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setDepth(200);
    
    // Enhanced dialog panel - taller to accommodate input
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - 350,
      height / 2 - 175,
      700,
      350,
      0x1a1a1a,
      0xDC143C,
      4
    );
    panel.setDepth(201);
    
    // Warning title with enhanced styling
    const title = this.add.text(width / 2, height / 2 - 130, '⚠️ PERMANENT DELETION', {
      fontSize: '24px',
      color: '#DC143C',
      fontFamily: 'Nosifer, serif',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(202);
    
    // Character name being deleted
    const characterName = this.add.text(width / 2, height / 2 - 90, `"${character.name}"`, {
      fontSize: '20px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      fontWeight: '700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(202);
    
    // Warning message - split into multiple lines for better readability
    const warning1 = this.add.text(width / 2, height / 2 - 60, 'This action CANNOT be undone!', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5).setDepth(202);
    
    const warning2 = this.add.text(width / 2, height / 2 - 35, 'All progress, items, and achievements will be lost forever.', {
      fontSize: '14px',
      color: '#C0C0C0',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(202);
    
    // Instruction text
    const instruction = this.add.text(width / 2, height / 2 - 5, 'Type "DELETE" below to confirm:', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5).setDepth(202);
    
    // Create HTML input for typing DELETE and buttons
    const { confirmBtn, cancelBtn } = this.createDeleteConfirmationInput(character, [overlay, panel, title, characterName, warning1, warning2, instruction]);
    
    // Add click outside to cancel functionality
    overlay.setInteractive();
    overlay.on('pointerdown', (pointer: any) => {
      const panelBounds = {
        left: width / 2 - 350,
        right: width / 2 + 350,
        top: height / 2 - 175,
        bottom: height / 2 + 175
      };
      
      // Only close if clicking outside the panel
      if (pointer.x < panelBounds.left || pointer.x > panelBounds.right || 
          pointer.y < panelBounds.top || pointer.y > panelBounds.bottom) {
        this.closeDeleteDialog([overlay, panel, title, characterName, warning1, warning2, instruction, confirmBtn, cancelBtn]);
      }
    });
  }
  
  private createDeleteConfirmationInput(character: any, dialogElements: any[]): { confirmBtn: Phaser.GameObjects.Text, cancelBtn: Phaser.GameObjects.Text } {
    const { width, height } = this.scale;
    
    // Remove existing input if any
    const existingInput = document.getElementById('delete-confirmation-input');
    if (existingInput) {
      existingInput.remove();
    }
    
    // Create confirmation input positioned below the instruction text
    const confirmInput = document.createElement('input');
    confirmInput.type = 'text';
    confirmInput.placeholder = 'Type DELETE to confirm';
    confirmInput.id = 'delete-confirmation-input';
    confirmInput.maxLength = 6;
    confirmInput.style.cssText = `
      position: absolute;
      left: 50%;
      top: 55%;
      transform: translate(-50%, -50%);
      width: 280px;
      padding: 15px;
      background: rgba(10, 10, 10, 0.95);
      border: 3px solid #DC143C;
      border-radius: 8px;
      color: #F5F5DC;
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      z-index: 1001;
      outline: none;
      letter-spacing: 2px;
    `;
    
    // Create the bottom buttons first
    const confirmBtn = this.add.text(width / 2 - 80, height / 2 + 130, 'Confirm', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: '700',
      backgroundColor: '#DC143C',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
    
    const cancelBtn = this.add.text(width / 2 + 80, height / 2 + 130, 'Cancel', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600',
      backgroundColor: '#666666',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
    
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
    // Show upgrade dialog
    const { width, height } = this.scale;
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(100);
    
    // Dialog panel
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - 250,
      height / 2 - 150,
      500,
      300,
      0x2d1b1b,
      0x8B0000,
      3
    );
    panel.setDepth(101);
    
    // Dialog content
    this.add.text(width / 2, height / 2 - 100, 'Secure Your Progress', {
      fontSize: '24px',
      color: '#8B0000',
      fontFamily: 'Nosifer, serif'
    }).setOrigin(0.5).setDepth(102);
    
    this.add.text(width / 2, height / 2 - 50, 
      'Create a permanent account to:\n• Secure your characters and progress\n• Access from any device\n• Receive exclusive rewards', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(102);
    
    // Create account button
    const createBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 - 80,
      height / 2 + 50,
      140,
      40,
      'Create Account',
      14,
      () => {
        this.cleanupForm();
        this.scene.start('LoginScene');
      }
    );
    createBtn.background.setDepth(102);
    createBtn.text.setDepth(103);
    
    // Continue as guest button
    const continueBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 + 80,
      height / 2 + 50,
      140,
      40,
      'Continue as Guest',
      14,
      () => {
        overlay.destroy();
        panel.destroy();
        createBtn.background.destroy();
        createBtn.text.destroy();
        continueBtn.background.destroy();
        continueBtn.text.destroy();
      }
    );
    continueBtn.background.setDepth(102);
    continueBtn.text.setDepth(103);
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
    
    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(200);
    
    // Dialog panel
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - 300,
      height / 2 - 150,
      600,
      300,
      0x2d1b1b,
      0x8B0000,
      3
    );
    panel.setDepth(201);
    
    // Dialog title
    const title = this.add.text(width / 2, height / 2 - 100, 'Guest Account Options', {
      fontSize: '24px',
      color: '#8B0000',
      fontFamily: 'Nosifer, serif'
    }).setOrigin(0.5).setDepth(202);
    
    // Dialog message
    const message = this.add.text(width / 2, height / 2 - 40, 
      'Your guest progress is saved locally.\nWhat would you like to do?', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(202);
    
    // Continue as guest button
    const continueBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 - 120,
      height / 2 + 20,
      200,
      40,
      'Continue as Guest',
      14,
      () => {
        // Just go back to login but keep the token
        this.closeGuestDialog([overlay, panel, title, message]);
        this.cleanupForm();
        this.scene.start('LoginScene');
      }
    );
    continueBtn.background.setDepth(202);
    continueBtn.text.setDepth(203);
    
    // Create account button
    const createBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 + 120,
      height / 2 + 20,
      200,
      40,
      'Create Secure Account',
      14,
      () => {
        // Keep guest data for potential account upgrade
        this.closeGuestDialog([overlay, panel, title, message]);
        this.cleanupForm();
        this.scene.start('LoginScene');
      }
    );
    createBtn.background.setDepth(202);
    createBtn.text.setDepth(203);
    
    // Full logout button (warning)
    const logoutBtn = this.add.text(width / 2, height / 2 + 80, 'Full Logout (Lose Progress)', {
      fontSize: '14px',
      color: '#DC143C',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(202).setInteractive();
    
    logoutBtn.on('pointerover', () => {
      logoutBtn.setColor('#FF6666');
    });
    
    logoutBtn.on('pointerout', () => {
      logoutBtn.setColor('#DC143C');
    });
    
    logoutBtn.on('pointerdown', () => {
      this.closeGuestDialog([overlay, panel, title, message]);
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
