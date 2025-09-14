/**
 * Menu Scene - Enhanced Gothic Main Menu
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export class MenuScene extends Scene {
  private gameStore: GameStore;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private loadingElements: any = null;
  private buttonFontSize: number = 20;
  private menuElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'MenuScene' });
    this.gameStore = GameStore.getInstance();
  }

  preload() {
    // Create simple colored rectangles for UI elements
    this.load.image('particle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  }

  create() {
    this.createMenu();
  }

  private createMenu() {
    // Clear existing menu elements
    this.clearMenu();
    
    const { width, height } = this.scale;
    
    // Get responsive layout positions
    const titleLayout = ResponsiveLayout.getResponsiveLayout('TITLE', width, height);
    const buttonLayout = ResponsiveLayout.getResponsiveLayout('MENU_BUTTONS', width, height);
    
    // Dark atmospheric background with enhanced gradient
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    this.menuElements.push(bg);
    
    // Add enhanced atmospheric particles
    const particles = GothicTitleUtils.createAtmosphericParticles(this, width, height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22, 0xFFD700],
      quantity: 4,
      speed: { min: 20, max: 40 },
      alpha: { min: 0.1, max: 0.4 },
      scale: { min: 0.5, max: 2.0 }
    });
    if (particles) {
      this.menuElements.push(particles);
    }
    
    // Enhanced Gothic Title with dripping effects
    const gothicTitle = GothicTitleUtils.createDrippingTitle(
      this,
      titleLayout.line1.x,
      titleLayout.line1.y,
      'HEMOCLAST',
      'ONLINE',
      {
        mainSize: ResponsiveLayout.getScaledFontSize(64, width, height),
        subSize: ResponsiveLayout.getScaledFontSize(48, width, height),
        mainColor: '#8B0000',
        subColor: '#FFD700',
        spacing: 70,
        drippingEffect: true,
        glowEffect: true
      }
    );
    
    this.menuElements.push(gothicTitle.mainTitle);
    if (gothicTitle.subTitle) {
      this.menuElements.push(gothicTitle.subTitle);
    }
    gothicTitle.effects.forEach(effect => this.menuElements.push(effect));
    
    // Subtitle with responsive positioning
    const subtitleText = this.add.text(titleLayout.subtitle.x, titleLayout.subtitle.y, 'Gothic Fantasy MMO-lite',
      ResponsiveLayout.getTextStyle(20, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Creepster, serif'
      })
    ).setOrigin(0.5);
    this.menuElements.push(subtitleText);
    
    // Version info
    const versionText = this.add.text(titleLayout.subtitle.x, titleLayout.subtitle.y + ResponsiveLayout.getScaledFontSize(30, width, height), 'Alpha Version 1.0',
      ResponsiveLayout.getTextStyle(14, width, height, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif'
      })
    ).setOrigin(0.5);
    this.menuElements.push(versionText);
    
    // Create gothic box around menu buttons
    this.createMenuButtonBox(buttonLayout, width, height);
    
    // Main menu buttons with responsive layout
    this.createResponsiveMenuButtons(buttonLayout, width, height);
    
    // Footer text removed as requested
  }

  private clearMenu() {
    // Remove existing menu elements
    this.menuElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.menuElements = [];
    
    // Clear particles
    if (this.particles) {
      this.particles.destroy();
      this.particles = null;
    }
  }

  // Public method called by main.ts on resize
  public handleResize(newWidth: number, newHeight: number) {
    this.scale.resize(newWidth, newHeight);
    this.createMenu();
  }

  private createMenuButtonBox(buttonLayout: any, screenWidth: number, screenHeight: number) {
    // Calculate box dimensions to encompass all buttons
    const numButtons = 4;
    const boxWidth = buttonLayout.width + 60; // Add padding
    const boxHeight = (numButtons * buttonLayout.height) + ((numButtons - 1) * buttonLayout.spacing) + 40; // Reduced padding
    
    // Get the center position where buttons will be
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2 + buttonLayout.offsetY;
    
    // Adjust box position to start just above the first button with minimal spacing
    const firstButtonY = centerY - ((numButtons - 1) * buttonLayout.spacing) / 2 - buttonLayout.height / 2;
    const boxY = firstButtonY - 20; // Just above the first button with small spacing
    const boxCenterY = boxY + boxHeight / 2;
    
    // Create gothic panel background
    const menuBox = this.add.graphics();
    
    // Background with transparency
    menuBox.fillStyle(0x1a1a1a, 0.85);
    menuBox.fillRoundedRect(
      centerX - boxWidth / 2,
      boxY,
      boxWidth,
      boxHeight,
      12
    );
    
    // Outer border
    menuBox.lineStyle(3, 0x8B0000, 1);
    menuBox.strokeRoundedRect(
      centerX - boxWidth / 2,
      boxY,
      boxWidth,
      boxHeight,
      12
    );
    
    // Inner border for depth
    menuBox.lineStyle(1, 0x4a0000, 0.6);
    menuBox.strokeRoundedRect(
      centerX - boxWidth / 2 + 4,
      boxY + 4,
      boxWidth - 8,
      boxHeight - 8,
      8
    );
    
    // Add subtle corner ornaments
    const ornamentSize = 16;
    const ornamentOffset = 20;
    
    // Top corners
    this.add.text(centerX - boxWidth / 2 + ornamentOffset, boxY + ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    this.add.text(centerX + boxWidth / 2 - ornamentOffset, boxY + ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Bottom corners
    this.add.text(centerX - boxWidth / 2 + ornamentOffset, boxY + boxHeight - ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    this.add.text(centerX + boxWidth / 2 - ornamentOffset, boxY + boxHeight - ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    this.menuElements.push(menuBox);
  }

  private createAtmosphericEffects() {
    const { width, height } = this.scale;
    
    // Create floating particles for atmosphere
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      scale: { min: 0.5, max: 2 },
      alpha: { min: 0.1, max: 0.3 },
      tint: [0x8B0000, 0x4B0082, 0x228B22],
      speed: { min: 10, max: 30 },
      lifespan: { min: 3000, max: 6000 },
      quantity: 2,
      blendMode: 'ADD'
    });
    
    this.particles = particles;
  }

  private createResponsiveMenuButtons(buttonLayout: any, screenWidth: number, screenHeight: number) {
    // Button data with responsive positioning
    const buttons = [
      { text: 'Enter World', action: () => this.startGame() },
      { text: 'Character Selection', action: () => this.showCharacterSelection() },
      { text: 'Settings', action: () => this.showSettings() },
      { text: 'Credits', action: () => this.showCredits() }
    ];
    
    buttons.forEach((button, index) => {
      const y = buttonLayout.y + (index * buttonLayout.spacing);
      this.createResponsiveGothicButton(
        buttonLayout.x,
        y,
        buttonLayout.width,
        buttonLayout.height,
        button.text,
        button.action,
        screenWidth,
        screenHeight
      );
    });
  }

  private createResponsiveGothicButton(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    text: string, 
    callback: () => void,
    screenWidth: number,
    screenHeight: number
  ) {
    // Use enhanced gothic button from GothicTitleUtils
    const enhancedButton = GothicTitleUtils.createEnhancedGothicButton(
      this,
      x,
      y,
      width,
      height,
      text,
      callback,
      {
        fontSize: ResponsiveLayout.getScaledFontSize(20, screenWidth, screenHeight),
        bgColor: 0x2d1b1b,
        borderColor: 0x8B0000,
        textColor: '#F5F5DC',
        hoverBgColor: 0x4a0000,
        hoverBorderColor: 0xDC143C,
        hoverTextColor: '#FFD700',
        glowEffect: true,
        shadowEffect: true
      }
    );
    
    this.menuElements.push(enhancedButton.background);
    this.menuElements.push(enhancedButton.text);
    this.menuElements.push(enhancedButton.hitArea);
    
    return { bg: enhancedButton.background, text: enhancedButton.text };
  }

  private startGame() {
    // Go directly to character selection (no separate Enter World page)
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharacterSelectionScene');
    });
  }
  
  private showLoadingScreen() {
    const { width, height } = this.scale;
    
    // Create clean loading overlay
    const loadingOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    loadingOverlay.setDepth(1000);
    
    // Clean Gothic Title - "ENTERING THE"
    const enteringText = this.add.text(width / 2, height / 2 - 100, 'ENTERING THE', {
      fontSize: '32px',
      color: '#8B0000',
      fontFamily: 'Nosifer, serif',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#8B0000',
        blur: 10,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(1001);
    
    // Clean Gothic Subtitle - "DARK REALM"
    const realmText = this.add.text(width / 2, height / 2 - 50, 'DARK REALM', {
      fontSize: '28px',
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
    }).setOrigin(0.5).setDepth(1001);
    
    // Simple loading spinner
    const spinner = this.add.graphics().setDepth(1001);
    let spinnerAngle = 0;
    
    const spinnerTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        spinner.clear();
        spinner.lineStyle(4, 0x8B0000);
        spinner.beginPath();
        spinner.arc(width / 2, height / 2 + 30, 30, spinnerAngle, spinnerAngle + Math.PI * 1.5);
        spinner.strokePath();
        spinnerAngle += 0.2;
      },
      loop: true
    });
    
    // Simple loading text
    const loadingText = this.add.text(width / 2, height / 2 + 100, 'Preparing your adventure...', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontWeight: '600'
    }).setOrigin(0.5).setDepth(1001);
    
    // Store references for cleanup
    this.loadingElements = { 
      overlay: loadingOverlay, 
      title: enteringText, 
      subtitle: realmText,
      spinner, 
      text: loadingText, 
      timer: spinnerTimer 
    };
  }
  
  private hideLoadingScreen() {
    if (this.loadingElements) {
      this.loadingElements.overlay.destroy();
      this.loadingElements.title.destroy();
      if (this.loadingElements.subtitle) {
        this.loadingElements.subtitle.destroy();
      }
      this.loadingElements.spinner.destroy();
      this.loadingElements.text.destroy();
      this.loadingElements.timer.destroy();
      this.loadingElements = null;
    }
  }

  private showCharacterSelection() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharacterSelectionScene');
    });
  }

  private showSettings() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('SettingsScene');
    });
  }

  private showCredits() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CreditsScene');
    });
  }
}
