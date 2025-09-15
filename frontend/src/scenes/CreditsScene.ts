/**
 * Credits Scene - Game credits and acknowledgments
 */

import { Scene } from 'phaser';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { GameStore } from '../stores/gameStore';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export class CreditsScene extends Scene {
  private sceneElements: Phaser.GameObjects.GameObject[] = [];
  private gameStore: GameStore;
  private creditsContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'CreditsScene' });
    this.gameStore = GameStore.getInstance();
  }

  create() {
    this.createUI();
    this.startCreditsScroll();
  }

  private createUI() {
    this.clearUI();
    
    const { width, height } = this.scale;
    
    // Dark atmospheric background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    this.sceneElements.push(bg);
    
    // Add atmospheric particles
    const particles = GothicTitleUtils.createAtmosphericParticles(this, width, height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22, 0xFFD700],
      quantity: 4,
      speed: { min: 5, max: 20 },
      alpha: { min: 0.1, max: 0.4 }
    });
    if (particles) {
      this.sceneElements.push(particles);
    }
    
    // Enhanced Gothic Title
    const gothicTitle = GothicTitleUtils.createDrippingTitle(
      this,
      width / 2,
      height * 0.15,
      'CREDITS',
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
    
    // Create scrolling credits
    this.createScrollingCredits();
    
    // Mobile detection for responsive buttons
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Mobile-friendly button dimensions and positioning
    let buttonWidth, buttonHeight, buttonFontSize, buttonY, backButtonX, skipButtonX;
    if (isMobileLayout) {
      buttonWidth = Math.max(100, 120 * uiScale);
      buttonHeight = Math.max(30, 35 * uiScale);
      buttonFontSize = Math.max(12, 13 * uiScale);
      buttonY = height - Math.max(30, 35 * uiScale);
      backButtonX = Math.max(60, buttonWidth / 2 + 10);
      skipButtonX = width - Math.max(60, buttonWidth / 2 + 10);
    } else {
      buttonWidth = 150;
      buttonHeight = 40;
      buttonFontSize = 14;
      buttonY = height - 50;
      backButtonX = 100;
      skipButtonX = width - 100;
    }
    
    // Back button - mobile-friendly
    const backButton = GothicTitleUtils.createEnhancedGothicButton(
      this,
      backButtonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      '← Back',
      () => this.goBack(),
      {
        fontSize: buttonFontSize,
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
    
    // Skip button - mobile-friendly
    const skipButtonWidth = isMobileLayout ? Math.max(80, 100 * uiScale) : 120;
    const skipButton = GothicTitleUtils.createEnhancedGothicButton(
      this,
      skipButtonX,
      buttonY,
      skipButtonWidth,
      buttonHeight,
      'Skip →',
      () => this.goBack(),
      {
        fontSize: buttonFontSize,
        bgColor: 0x2d1b1b,
        borderColor: 0x666666,
        textColor: '#C0C0C0',
        hoverBgColor: 0x4a0000,
        hoverBorderColor: 0x8B0000,
        hoverTextColor: '#FFD700',
        glowEffect: false,
        shadowEffect: true
      }
    );
    this.sceneElements.push(skipButton.background);
    this.sceneElements.push(skipButton.text);
    this.sceneElements.push(skipButton.hitArea);
  }

  private createScrollingCredits() {
    const { width, height } = this.scale;
    
    // Mobile detection for responsive text
    const isMobile = ResponsiveLayout.isMobile(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const isActualMobileDevice = ResponsiveLayout.isMobileDevice();
    const isMobileLayout = (isActualMobileDevice || width < 400) && isMobile && mobileAdjustments.isPortrait;
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    
    // Create container for scrolling credits
    this.creditsContainer = this.add.container(width / 2, height);
    this.sceneElements.push(this.creditsContainer);
    
    // Credits data
    const creditsData = [
      { type: 'title', text: 'HEMOCLAST ONLINE' },
      { type: 'subtitle', text: 'Gothic Fantasy MMO-lite' },
      { type: 'space' },
      
      { type: 'section', text: 'DEVELOPMENT TEAM' },
      { type: 'credit', text: 'Game Design & Programming' },
      { type: 'name', text: 'Lead Developer' },
      { type: 'space' },
      
      { type: 'credit', text: 'UI/UX Design' },
      { type: 'name', text: 'Interface Designer' },
      { type: 'space' },
      
      { type: 'credit', text: 'Game Art & Graphics' },
      { type: 'name', text: 'Visual Artist' },
      { type: 'space' },
      
      { type: 'section', text: 'SPECIAL THANKS' },
      { type: 'credit', text: 'Phaser.js Framework' },
      { type: 'name', text: 'Photon Storm Ltd.' },
      { type: 'space' },
      
      { type: 'credit', text: 'Font Families' },
      { type: 'name', text: 'Google Fonts - Nosifer, Cinzel, Creepster' },
      { type: 'space' },
      
      { type: 'credit', text: 'Inspiration' },
      { type: 'name', text: 'Classic Gothic Fantasy Games' },
      { type: 'space' },
      
      { type: 'section', text: 'TECHNOLOGY STACK' },
      { type: 'credit', text: 'Frontend Framework' },
      { type: 'name', text: 'Phaser 3 Game Engine' },
      { type: 'space' },
      
      { type: 'credit', text: 'Backend Framework' },
      { type: 'name', text: 'FastAPI (Python)' },
      { type: 'space' },
      
      { type: 'credit', text: 'Database' },
      { type: 'name', text: 'PostgreSQL' },
      { type: 'space' },
      
      { type: 'credit', text: 'Build Tools' },
      { type: 'name', text: 'Vite, TypeScript, Docker' },
      { type: 'space' },
      { type: 'space' },
      
      { type: 'section', text: 'COMMUNITY' },
      { type: 'credit', text: 'Beta Testers' },
      { type: 'name', text: 'Early Access Players' },
      { type: 'space' },
      
      { type: 'credit', text: 'Feedback & Suggestions' },
      { type: 'name', text: 'Discord Community' },
      { type: 'space' },
      { type: 'space' },
      
      { type: 'title', text: 'THANK YOU FOR PLAYING!' },
      { type: 'subtitle', text: 'Join the darkness, embrace the adventure' },
      { type: 'space' },
      { type: 'space' },
      { type: 'space' },
    ];
    
    let currentY = 0;
    
    creditsData.forEach((credit) => {
      if (credit.type === 'space') {
        currentY += 30;
        return;
      }
      
      let textStyle: any = {
        fontFamily: 'Cinzel, serif',
        stroke: '#000000',
        strokeThickness: 1
      };
      
      switch (credit.type) {
        case 'title':
          textStyle = {
            ...textStyle,
            fontSize: isMobileLayout ? `${Math.max(24, 28 * uiScale)}px` : '32px',
            color: '#8B0000',
            fontWeight: '700',
            fontFamily: 'Nosifer, serif',
            strokeThickness: isMobileLayout ? 1 : 2
          };
          currentY += isMobileLayout ? 15 : 20;
          break;
          
        case 'subtitle':
          textStyle = {
            ...textStyle,
            fontSize: isMobileLayout ? `${Math.max(14, 16 * uiScale)}px` : '18px',
            color: '#FFD700',
            fontStyle: 'italic',
            fontWeight: '600'
          };
          currentY += isMobileLayout ? 12 : 15;
          break;
          
        case 'section':
          textStyle = {
            ...textStyle,
            fontSize: isMobileLayout ? `${Math.max(18, 20 * uiScale)}px` : '24px',
            color: '#DC143C',
            fontWeight: '700',
            strokeThickness: isMobileLayout ? 1 : 2
          };
          currentY += isMobileLayout ? 20 : 25;
          break;
          
        case 'credit':
          textStyle = {
            ...textStyle,
            fontSize: isMobileLayout ? `${Math.max(13, 14 * uiScale)}px` : '16px',
            color: '#F5F5DC',
            fontWeight: '600'
          };
          currentY += isMobileLayout ? 8 : 10;
          break;
          
        case 'name':
          textStyle = {
            ...textStyle,
            fontSize: isMobileLayout ? `${Math.max(11, 12 * uiScale)}px` : '14px',
            color: '#C0C0C0',
            fontStyle: 'italic'
          };
          currentY += isMobileLayout ? 4 : 5;
          break;
      }
      
      const text = this.add.text(0, currentY, credit.text || '', textStyle).setOrigin(0.5, 0);
      this.creditsContainer!.add(text);
      
      currentY += parseInt(textStyle.fontSize) + 15;
    });
  }

  private startCreditsScroll() {
    const { height } = this.scale;
    
    // Auto-scroll credits
    this.time.addEvent({
      delay: 50,
      callback: () => {
        if (this.creditsContainer) {
          this.creditsContainer.y -= 1;
          
          // Reset when credits finish scrolling
          if (this.creditsContainer.y < -2000) {
            this.creditsContainer.y = height;
          }
        }
      },
      loop: true
    });
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
    this.creditsContainer = null;
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
