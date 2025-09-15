/**
 * Settings Scene - Game settings and preferences
 */

import { Scene } from 'phaser';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { GameStore } from '../stores/gameStore';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export class SettingsScene extends Scene {
  private sceneElements: Phaser.GameObjects.GameObject[] = [];
  private gameStore: GameStore;
  private settings: any = {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.6,
    fullscreen: false,
    vsync: true,
    particles: true,
    animations: true
  };

  constructor() {
    super({ key: 'SettingsScene' });
    this.gameStore = GameStore.getInstance();
  }

  create() {
    this.createUI();
    this.loadSettings();
  }

  private createUI() {
    this.clearUI();
    
    const { width, height } = this.scale;
    
    // Dark atmospheric background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    this.sceneElements.push(bg);
    
    // Add atmospheric particles
    const particles = GothicTitleUtils.createAtmosphericParticles(this, width, height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22],
      quantity: 2,
      speed: { min: 10, max: 25 },
      alpha: { min: 0.1, max: 0.3 }
    });
    if (particles) {
      this.sceneElements.push(particles);
    }
    
    // Enhanced Gothic Title
    const gothicTitle = GothicTitleUtils.createDrippingTitle(
      this,
      width / 2,
      height * 0.15,
      'SETTINGS',
      '',
      {
        mainSize: Math.min(width, height) / 20,
        subSize: 0,
        mainColor: '#8B0000',
        subColor: '#FFD700',
        spacing: 0,
        drippingEffect: true,
        glowEffect: true
      }
    );
    
    this.sceneElements.push(gothicTitle.mainTitle);
    gothicTitle.effects.forEach(effect => this.sceneElements.push(effect));
    
    // Add gothic separator
    const separator = GothicTitleUtils.createGothicSeparator(
      this,
      width / 2,
      height * 0.25,
      width * 0.6,
      {
        color: 0x8B0000,
        ornamentColor: '#FFD700',
        thickness: 3,
        ornaments: true
      }
    );
    this.sceneElements.push(separator);
    
    // Create settings panels
    this.createAudioSettings();
    this.createGraphicsSettings();
    this.createGameplaySettings();
    
    // Back button
    const backButton = GothicTitleUtils.createEnhancedGothicButton(
      this,
      100,
      height - 50,
      150,
      40,
      '← Back',
      () => this.goBack(),
      {
        fontSize: 14,
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
    this.sceneElements.push(backButton.background);
    this.sceneElements.push(backButton.text);
    this.sceneElements.push(backButton.hitArea);
  }

  private createAudioSettings() {
    const { width, height } = this.scale;
    
    // Mobile detection
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Responsive panel dimensions and positioning
    let startY, panelWidth, panelX, panelHeight;
    if (isMobileLayout) {
      startY = height * 0.32;
      panelWidth = Math.min(320, width * 0.9);
      panelX = (width - panelWidth) / 2;
      panelHeight = 240; // Taller for mobile to accommodate content
    } else {
      startY = height * 0.35;
      panelWidth = width / 2 - 100;
      panelX = 50;
      panelHeight = 220;
    }
    
    // Audio Settings Panel
    const audioPanel = this.add.graphics();
    audioPanel.fillStyle(0x1a1a1a, 0.8);
    audioPanel.fillRoundedRect(panelX, startY - 20, panelWidth, panelHeight, 8);
    audioPanel.lineStyle(2, 0x8B0000);
    audioPanel.strokeRoundedRect(panelX, startY - 20, panelWidth, panelHeight, 8);
    this.sceneElements.push(audioPanel);
    
    // Audio Title - responsive sizing
    const titleFontSize = isMobileLayout ? 
      Math.max(16, 18 * uiScale) : 
      ResponsiveLayout.getScaledFontSize(20, width, height);
    const audioTitle = this.add.text(panelX + panelWidth / 2, startY, 'Audio Settings', {
      fontSize: `${titleFontSize}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(audioTitle);
    
    // Volume sliders (simplified as clickable options for now)
    const volumeSettings = [
      { name: 'Master Volume', key: 'masterVolume' },
      { name: 'Music Volume', key: 'musicVolume' },
      { name: 'SFX Volume', key: 'sfxVolume' },
      { name: 'Ambient Volume', key: 'ambientVolume' }
    ];
    
    // Mobile-friendly spacing and sizing
    const itemSpacing = isMobileLayout ? 30 : 35;
    const labelFontSize = isMobileLayout ? 
      Math.max(12, 13 * uiScale) : 
      ResponsiveLayout.getScaledFontSize(14, width, height);
    const buttonFontSize = isMobileLayout ? 
      Math.max(16, 18 * uiScale) : 
      ResponsiveLayout.getScaledFontSize(20, width, height);
    
    volumeSettings.forEach((setting, index) => {
      const y = startY + 40 + (index * itemSpacing);
      
      // Setting label - responsive positioning
      const labelX = panelX + (isMobileLayout ? 15 : 20);
      const label = this.add.text(labelX, y, setting.name, {
        fontSize: `${labelFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      });
      this.sceneElements.push(label);
      
      // Control area positioning - mobile-friendly
      const controlAreaX = isMobileLayout ? 
        panelX + panelWidth - 80 : 
        panelX + panelWidth - 120;
      
      // Mobile-friendly button spacing and sizing
      const buttonSpacing = isMobileLayout ? 25 : 30;
      const buttonPadding = isMobileLayout ? { x: 6, y: 3 } : { x: 8, y: 4 };
      const volumeFontSize = isMobileLayout ? 
        Math.max(12, 13 * uiScale) : 
        ResponsiveLayout.getScaledFontSize(14, width, height);
      
      // Decrease button
      const decreaseBtn = this.add.text(controlAreaX - buttonSpacing, y, '−', {
        fontSize: `${buttonFontSize}px`,
        color: '#DC143C',
        fontFamily: 'Cinzel, serif',
        backgroundColor: '#2d1b1b',
        padding: buttonPadding
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      // Volume display
      const volumeText = this.add.text(controlAreaX, y, `${Math.round(this.settings[setting.key] * 100)}%`, {
        fontSize: `${volumeFontSize}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif'
      }).setOrigin(0.5);
      
      // Increase button
      const increaseBtn = this.add.text(controlAreaX + buttonSpacing, y, '+', {
        fontSize: `${buttonFontSize}px`,
        color: '#228B22',
        fontFamily: 'Cinzel, serif',
        backgroundColor: '#2d1b1b',
        padding: buttonPadding
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      this.sceneElements.push(decreaseBtn, volumeText, increaseBtn);
      
      // Button hover effects
      decreaseBtn.on('pointerover', () => {
        decreaseBtn.setBackgroundColor('#4a0000');
      });
      
      decreaseBtn.on('pointerout', () => {
        decreaseBtn.setBackgroundColor('#2d1b1b');
      });
      
      increaseBtn.on('pointerover', () => {
        increaseBtn.setBackgroundColor('#004400');
      });
      
      increaseBtn.on('pointerout', () => {
        increaseBtn.setBackgroundColor('#2d1b1b');
      });
      
      // Button functionality
      decreaseBtn.on('pointerdown', () => {
        this.settings[setting.key] = Math.max(0, this.settings[setting.key] - 0.1);
        volumeText.setText(`${Math.round(this.settings[setting.key] * 100)}%`);
        this.saveSettings();
      });
      
      increaseBtn.on('pointerdown', () => {
        this.settings[setting.key] = Math.min(1, this.settings[setting.key] + 0.1);
        volumeText.setText(`${Math.round(this.settings[setting.key] * 100)}%`);
        this.saveSettings();
      });
    });
  }

  private createGraphicsSettings() {
    const { width, height } = this.scale;
    
    // Mobile detection
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Responsive panel dimensions and positioning
    let startY, panelWidth, panelX, panelHeight;
    if (isMobileLayout) {
      startY = height * 0.58; // Position below audio panel
      panelWidth = Math.min(320, width * 0.9);
      panelX = (width - panelWidth) / 2;
      panelHeight = 200;
    } else {
      startY = height * 0.35;
      panelWidth = width / 2 - 100;
      panelX = width / 2 + 50;
      panelHeight = 220;
    }
    
    // Graphics Settings Panel
    const graphicsPanel = this.add.graphics();
    graphicsPanel.fillStyle(0x1a1a1a, 0.8);
    graphicsPanel.fillRoundedRect(panelX, startY - 20, panelWidth, panelHeight, 8);
    graphicsPanel.lineStyle(2, 0x8B0000);
    graphicsPanel.strokeRoundedRect(panelX, startY - 20, panelWidth, panelHeight, 8);
    this.sceneElements.push(graphicsPanel);
    
    // Graphics Title - responsive sizing
    const titleFontSize = isMobileLayout ? 
      Math.max(16, 18 * uiScale) : 
      ResponsiveLayout.getScaledFontSize(20, width, height);
    const graphicsTitle = this.add.text(panelX + panelWidth / 2, startY, 'Graphics Settings', {
      fontSize: `${titleFontSize}px`,
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(graphicsTitle);
    
    // Toggle settings
    const graphicsSettings = [
      { name: 'Fullscreen', key: 'fullscreen' },
      { name: 'VSync', key: 'vsync' },
      { name: 'Particles', key: 'particles' },
      { name: 'Animations', key: 'animations' }
    ];
    
    // Mobile-friendly spacing and sizing
    const itemSpacing = isMobileLayout ? 30 : 35;
    const labelFontSize = isMobileLayout ? 
      Math.max(12, 13 * uiScale) : 
      ResponsiveLayout.getScaledFontSize(14, width, height);
    const toggleFontSize = isMobileLayout ? 
      Math.max(12, 13 * uiScale) : 
      ResponsiveLayout.getScaledFontSize(14, width, height);
    
    graphicsSettings.forEach((setting, index) => {
      const y = startY + 40 + (index * itemSpacing);
      
      // Setting label - responsive positioning
      const labelX = panelX + (isMobileLayout ? 15 : 20);
      const label = this.add.text(labelX, y, setting.name, {
        fontSize: `${labelFontSize}px`,
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      });
      this.sceneElements.push(label);
      
      // Toggle button - mobile-friendly positioning and sizing
      const toggleX = isMobileLayout ? 
        panelX + panelWidth - 40 : 
        panelX + panelWidth - 60;
      const togglePadding = isMobileLayout ? { x: 10, y: 5 } : { x: 12, y: 6 };
      const toggleBtn = this.add.text(toggleX, y, this.settings[setting.key] ? 'ON' : 'OFF', {
        fontSize: `${toggleFontSize}px`,
        color: this.settings[setting.key] ? '#228B22' : '#DC143C',
        fontFamily: 'Cinzel, serif',
        backgroundColor: this.settings[setting.key] ? '#004400' : '#440000',
        padding: togglePadding
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      this.sceneElements.push(toggleBtn);
      
      // Hover effects
      toggleBtn.on('pointerover', () => {
        if (this.settings[setting.key]) {
          toggleBtn.setBackgroundColor('#006600');
        } else {
          toggleBtn.setBackgroundColor('#660000');
        }
      });
      
      toggleBtn.on('pointerout', () => {
        toggleBtn.setBackgroundColor(this.settings[setting.key] ? '#004400' : '#440000');
      });
      
      // Toggle functionality
      toggleBtn.on('pointerdown', () => {
        this.settings[setting.key] = !this.settings[setting.key];
        toggleBtn.setText(this.settings[setting.key] ? 'ON' : 'OFF');
        toggleBtn.setColor(this.settings[setting.key] ? '#228B22' : '#DC143C');
        toggleBtn.setBackgroundColor(this.settings[setting.key] ? '#004400' : '#440000');
        this.saveSettings();
      });
    });
  }

  private createGameplaySettings() {
    const { width, height } = this.scale;
    const startY = height * 0.75; // Moved down to accommodate taller panels above
    
    // Gameplay Settings Panel
    const gameplayPanel = this.add.graphics();
    gameplayPanel.fillStyle(0x1a1a1a, 0.8);
    gameplayPanel.fillRoundedRect(width / 4, startY - 20, width / 2, 120, 8);
    gameplayPanel.lineStyle(2, 0x8B0000);
    gameplayPanel.strokeRoundedRect(width / 4, startY - 20, width / 2, 120, 8);
    this.sceneElements.push(gameplayPanel);
    
    // Gameplay Title
    const gameplayTitle = this.add.text(width / 2, startY, 'Gameplay Settings', {
      fontSize: '20px',
      color: '#FFD700',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(gameplayTitle);
    
    // Reset Settings Button
    const resetBtn = GothicTitleUtils.createEnhancedGothicButton(
      this,
      width / 2,
      startY + 50,
      200,
      35,
      'Reset to Defaults',
      () => this.resetSettings(),
      {
        fontSize: 14,
        bgColor: 0x4a0000,
        borderColor: 0xDC143C,
        textColor: '#FFD700',
        hoverBgColor: 0x8B0000,
        hoverBorderColor: 0xFF6666,
        hoverTextColor: '#FFFFFF',
        glowEffect: false,
        shadowEffect: true
      }
    );
    this.sceneElements.push(resetBtn.background);
    this.sceneElements.push(resetBtn.text);
    this.sceneElements.push(resetBtn.hitArea);
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('hemoclast_settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    }
  }

  private saveSettings() {
    localStorage.setItem('hemoclast_settings', JSON.stringify(this.settings));
  }

  private resetSettings() {
    this.settings = {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      ambientVolume: 0.6,
      fullscreen: false,
      vsync: true,
      particles: true,
      animations: true
    };
    this.saveSettings();
    this.createUI(); // Refresh UI to show reset values
  }

  private goBack() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Use the previous scene from the game store
      const previousScene = this.gameStore.store.getState().previousScene;
      
      // Determine which scene to return to
      let targetScene = 'LoginScene'; // Default fallback
      
      if (previousScene === 'CharacterSelectionScene') {
        targetScene = 'CharacterSelectionScene';
      } else if (previousScene === 'LoginScene') {
        targetScene = 'LoginScene';
      } else if (previousScene) {
        // If there's any other previous scene, use it
        targetScene = previousScene;
      } else {
        // Fallback logic: check if user is logged in
        const token = localStorage.getItem('hemoclast_token');
        targetScene = token ? 'CharacterSelectionScene' : 'LoginScene';
      }
      
      this.gameStore.store.getState().setScene(targetScene);
      this.scene.start(targetScene);
    });
  }

  private clearUI() {
    this.sceneElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.sceneElements = [];
  }

  // Public method for resize handling
  public handleResize(newWidth: number, newHeight: number) {
    this.scale.resize(newWidth, newHeight);
    this.createUI();
  }

  destroy() {
    this.clearUI();
  }
}
