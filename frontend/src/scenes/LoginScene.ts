/**
 * Login Scene - User authentication and registration
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { GraphicsUtils } from '../utils/GraphicsUtils';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';
import { ErrorHandler } from '../utils/ErrorHandler';
import { NotificationManager } from '../utils/NotificationManager';
import { LoadingManager } from '../utils/LoadingManager';
import { VersionManager } from '../config';

export class LoginScene extends Scene {
  private gameStore: GameStore;
  private currentMode: 'login' | 'register' = 'login';
  private inputElements: any = {};
  private errorHandler: ErrorHandler;
  private notificationManager: NotificationManager;
  private loadingManager: LoadingManager;
  private sceneElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'LoginScene' });
    this.gameStore = GameStore.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.notificationManager = NotificationManager.getInstance();
    this.loadingManager = LoadingManager.getInstance();
  }

  create() {
    // Initialize managers
    this.notificationManager.initialize(this);
    this.loadingManager.initialize(this);
    
    // Check if this is a guest account upgrade and set to register mode
    const isUpgrading = localStorage.getItem('hemoclast_upgrading_guest') === 'true';
    if (isUpgrading) {
      this.currentMode = 'register';
    }
    
    this.createUI();
  }

  private createUI() {
    // Clear existing elements
    this.clearUI();
    
    const { width, height } = this.scale;
    
    // Dark atmospheric background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    this.sceneElements.push(bg);
    
    // Enhanced Gothic Title with dripping effects
    const titleLayout = ResponsiveLayout.getResponsiveLayout('TITLE', width, height);
    
    const welcomeText = this.add.text(titleLayout.subtitle.x, titleLayout.line1.y - 90, 'Welcome to',
      ResponsiveLayout.getTextStyle(28, width, height, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontStyle: 'italic'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(welcomeText);
    
    // Create enhanced gothic title with dripping effect
    const gothicTitle = GothicTitleUtils.createDrippingTitle(
      this,
      width / 2,
      titleLayout.line1.y + 10,
      'HEMOCLAST',
      'ONLINE',
      {
        mainSize: ResponsiveLayout.getScaledFontSize(72, width, height),
        subSize: ResponsiveLayout.getScaledFontSize(48, width, height),
        mainColor: '#8B0000',
        subColor: '#FFD700',
        spacing: 80,
        drippingEffect: true,
        glowEffect: true
      }
    );
    
    this.sceneElements.push(gothicTitle.mainTitle);
    if (gothicTitle.subTitle) {
      this.sceneElements.push(gothicTitle.subTitle);
    }
    gothicTitle.effects.forEach(effect => this.sceneElements.push(effect));
    
    // Add version display under the title (matching Welcome to styling)
    const versionText = this.add.text(
      width / 2, 
      titleLayout.line1.y + 150, // Position under the subtitle
      VersionManager.getVersionString(),
      ResponsiveLayout.getTextStyle(28, width, height, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        fontStyle: 'italic'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(versionText);
    
    // Show upgrade indicator if user is upgrading from guest account
    this.showUpgradeIndicator();
    
    // Add atmospheric particles
    const particles = GothicTitleUtils.createAtmosphericParticles(this, width, height, {
      colors: [0x8B0000, 0x4B0082, 0x228B22],
      quantity: 2,
      speed: { min: 15, max: 35 },
      alpha: { min: 0.1, max: 0.3 }
    });
    if (particles) {
      this.sceneElements.push(particles);
    }
    
    // Create login form
    this.createLoginForm();
    
    // Create bottom buttons (Sign Up and Guest)
    this.createBottomButtons();
  }

  private clearUI() {
    this.sceneElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.sceneElements = [];
  }

  // Public method called by main.ts on resize
  public handleResize(newWidth: number, newHeight: number) {
    this.scale.resize(newWidth, newHeight);
    this.notificationManager.handleResize(newWidth, newHeight);
    this.loadingManager.handleResize(newWidth, newHeight);
    this.createUI();
    // Recreate HTML form with new dimensions - use passed dimensions instead of this.scale
    if (document.getElementById('login-form')) {
      this.createHTMLFormWithDimensions(newWidth, newHeight);
    }
  }

  private createLoginForm() {
    const { width, height } = this.scale;
    
    // Get responsive layout positions
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Adjust form height based on mode (registration needs more space for email field)
    const formHeight = this.currentMode === 'register' ? 350 : 300;
    
    // Enhanced Gothic Form Background with decorative elements
    const formCenterY = centerY + 10; // Move form down to center it properly
    
    // Calculate responsive frame width using same approach as inputs
    const baseFrameWidth = 400;
    const frameWidth = Math.max(180, Math.min(baseFrameWidth, width * 0.3)); // 30% of viewport width, max 400px
    
    const gothicFrame = GothicTitleUtils.createGothicFrame(
      this,
      centerX,
      formCenterY,
      frameWidth,
      formHeight,
      {
        bgColor: 0x1a1a1a,
        borderColor: 0x8B0000,
        ornamentColor: '#FFD700',
        cornerOrnaments: false, // Remove corner ornaments as requested
        sideOrnaments: false,   // Remove side ornaments, will add outline-only ones
        ornamentSize: 14
      }
    );
    this.sceneElements.push(gothicFrame.frame);
    gothicFrame.ornaments.forEach(ornament => this.sceneElements.push(ornament));
    
    // Add gothic symbols only on the outline edges
    const formLeft = centerX - frameWidth/2;
    const formRight = centerX + frameWidth/2;
    const formTop = formCenterY - formHeight/2;
    const formBottom = formCenterY + formHeight/2;
    
    // Top edge symbols
    const topLeftSymbol = this.add.text(formLeft, formTop, '⚜', {
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(topLeftSymbol);
    
    const topRightSymbol = this.add.text(formRight, formTop, '⚜', {
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(topRightSymbol);
    
    // Bottom edge symbols
    const bottomLeftSymbol = this.add.text(formLeft, formBottom, '⚜', {
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(bottomLeftSymbol);
    
    const bottomRightSymbol = this.add.text(formRight, formBottom, '⚜', {
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(bottomRightSymbol);
    
    // Side edge symbols (middle of left and right edges)
    const leftSymbol = this.add.text(formLeft, formCenterY, '☩', {
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(leftSymbol);
    
    const rightSymbol = this.add.text(formRight, formCenterY, '☩', {
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(rightSymbol);
    
    // Add subtle pulsing animation to edge symbols
    [topLeftSymbol, topRightSymbol, bottomLeftSymbol, bottomRightSymbol, leftSymbol, rightSymbol].forEach((symbol, index) => {
      this.tweens.add({
        targets: symbol,
        alpha: 0.7,
        duration: 2000 + (index * 200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
    
    // Form title (positioned based on form type - login needs less space than registration) - moved up slightly
    const titleY = this.currentMode === 'login' ? formCenterY - 95 : formCenterY - 115; // Moved up 5px
    const formTitle = this.add.text(centerX, titleY, this.currentMode === 'login' ? 'Sign In' : 'Create Account',
      ResponsiveLayout.getTextStyle(24, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
      })
    ).setOrigin(0.5);
    this.sceneElements.push(formTitle);
    
    // Create HTML form elements (overlaid on canvas)
    this.createHTMLForm();
    
    // Action buttons
    this.createFormButtons();
  }

  private createHTMLForm() {
    const { width, height } = this.scale;
    this.createHTMLFormWithDimensions(width, height);
  }

  private createHTMLFormWithDimensions(width: number, height: number) {
    
    // Remove existing form if any
    const existingForm = document.getElementById('login-form');
    if (existingForm) {
      existingForm.remove();
    }
    
    // Use mobile-optimized input dimensions
    const inputDimensions = ResponsiveLayout.getMobileInputDimensions(300, 55, width, height);
    const inputWidth = inputDimensions.width;
    const inputHeight = inputDimensions.height;
    const fontSize = inputDimensions.fontSize;
    const padding = inputDimensions.padding;
    
    // Calculate gap with mobile adjustments
    const uiScale = ResponsiveLayout.getUIScale(width, height);
    const mobileAdjustments = ResponsiveLayout.getMobileAdjustments(width, height);
    const gap = 12 * uiScale * (mobileAdjustments.spacingMultiplier || 1);
    
    
    // Create form container with responsive positioning
    const formContainer = document.createElement('div');
    formContainer.id = 'login-form';
    formContainer.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%; 
      transform: translate(-50%, -50%);
      z-index: 1000;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${gap}px;
    `;
    
    // Create inputs with consistent scaling
    const inputStyle = `
      width: ${inputWidth}px !important;
      height: ${inputHeight}px !important;
      font-size: ${fontSize}px !important;
      padding: ${padding}px !important;
      box-sizing: border-box !important;
    `;
    
    // Username input
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Username';
    usernameInput.id = 'username';
    usernameInput.className = 'gothic-input';
    usernameInput.style.cssText += inputStyle;
    
    // Email input (for registration)
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';
    emailInput.id = 'email';
    emailInput.className = 'gothic-input';
    emailInput.style.cssText += inputStyle;
    emailInput.style.display = this.currentMode === 'register' ? 'block' : 'none';
    
    // Password input
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.id = 'password';
    passwordInput.className = 'gothic-input';
    passwordInput.style.cssText += inputStyle;
    
    // Add inputs to form
    formContainer.appendChild(usernameInput);
    formContainer.appendChild(emailInput);
    formContainer.appendChild(passwordInput);
    
    // Add form to page
    document.body.appendChild(formContainer);
    
    // Store references
    this.inputElements = { username: usernameInput, email: emailInput, password: passwordInput, container: formContainer };
  }

  private createFormButtons() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const formCenterY = centerY + 10; // Match the form positioning
    const isMobile = ResponsiveLayout.isMobile(width, height);
    
    // Button text based on mode
    const buttonTextContent = this.currentMode === 'login' ? 'Sign In' : 'Create Account';
    const fontSize = ResponsiveLayout.getButtonFontSize(16, width, height);
    
    // Create temporary text to measure dimensions
    const tempText = this.add.text(0, 0, buttonTextContent, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Cinzel, serif',
    });
    
    // Calculate required button dimensions based on text content
    const textPadding = isMobile ? 40 : 32; // More padding on mobile
    const requiredWidth = tempText.width + textPadding;
    const requiredHeight = Math.max(tempText.height + 20, isMobile ? 50 : 44); // Minimum touch-friendly height
    
    // Clean up temporary text
    tempText.destroy();
    
    // Use touch-friendly button dimensions but ensure it fits content
    const touchButton = ResponsiveLayout.getTouchFriendlyButton(200, 50, width, height);
    const buttonWidth = Math.max(touchButton.width, requiredWidth);
    const buttonHeight = Math.max(touchButton.height, requiredHeight);
    const buttonY = this.currentMode === 'register' ? formCenterY + 132 : formCenterY + 92;
    
    const buttonBg = this.add.rectangle(centerX, buttonY, buttonWidth, buttonHeight, 0x2d1b1b)
      .setStrokeStyle(2, 0x8B0000)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    const buttonText = this.add.text(centerX, buttonY, buttonTextContent, {
      fontSize: `${fontSize}px`,
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(buttonText);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(0x4a0000);
        buttonBg.setStrokeStyle(2, 0xDC143C);
      }
      if (buttonText && buttonText.active) {
        buttonText.setColor('#FFD700');
      }
    });
    
    buttonBg.on('pointerout', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(0x2d1b1b);
        buttonBg.setStrokeStyle(2, 0x8B0000);
      }
      if (buttonText && buttonText.active) {
        buttonText.setColor('#F5F5DC');
      }
    });
    
    buttonBg.on('pointerdown', () => {
      this.handleFormSubmit();
    });
  }

  private createBottomButtons() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    
    if (this.currentMode === 'login') {
      // LOGIN MODE: Show Sign Up + Guest buttons
      this.createLoginModeButtons(centerX, centerY);
    } else {
      // REGISTRATION MODE: Show only Back to Login button (styled like Sign Up)
      this.createRegistrationModeButtons(centerX, centerY);
    }
    
    // Add sound toggle button to bottom left (for both modes)
    this.createSoundToggleButton();
  }

  private createLoginModeButtons(centerX: number, centerY: number) {
    // Check if there's an existing guest session
    const existingGuestToken = localStorage.getItem('hemoclast_token');
    const isGuest = localStorage.getItem('hemoclast_is_guest');
    const isRegistered = localStorage.getItem('hemoclast_is_registered');
    const formCenterY = centerY + 10; // Match the moved form position
    
    // Sign Up button (below the form with proper spacing)
    this.createActionButton(
      centerX, formCenterY + 210, 200, 50,
      'Sign Up',
      () => this.toggleMode(),
      0x2d1b1b, 0x8B0000, '#F5F5DC'
    );
    
    // Divider
    const divider = this.add.text(centerX, formCenterY + 270, '- OR -',
      ResponsiveLayout.getTextStyle(12, this.scale.width, this.scale.height, {
        color: '#666666',
        fontFamily: 'Cinzel, serif'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(divider);
    
    // Guest button
    if (existingGuestToken && isGuest && !isRegistered) {
      const guestName = localStorage.getItem('hemoclast_username') || 'Guest';
      this.createMultiLineActionButton(
        centerX, formCenterY + 330, 200, 60, // Made button taller to accommodate two lines
        'Continue as',
        guestName,
        () => this.continueAsExistingGuest(),
        0x4A4A4A, 0x666666, '#F5F5DC'
      );
    } else {
      this.createActionButton(
        centerX, formCenterY + 330, 200, 50,
        'Play as Guest',
        () => this.handleGuestLogin(),
        0x4A4A4A, 0x666666, '#F5F5DC'
      );
    }
  }

  private createRegistrationModeButtons(centerX: number, centerY: number) {
    const formCenterY = centerY + 10; // Match the moved form position
    // REGISTRATION MODE: Only show Back to Login button (styled like the Sign Up button)
    this.createActionButton(
      centerX, formCenterY + 240, 200, 50, // Positioned below the taller registration form
      'Back to Login',
      () => this.toggleMode(),
      0x2d1b1b, 0x8B0000, '#F5F5DC' // Same styling as Sign Up button
    );
  }

  private createSoundToggleButton() {
    const { width, height } = this.scale;
    const isMobile = ResponsiveLayout.isMobile(width, height);
    
    // Position in bottom left corner with responsive sizing
    const buttonSize = isMobile ? 50 : 40;
    const margin = isMobile ? 25 : 20;
    const buttonX = margin + buttonSize / 2;
    const buttonY = height - margin - buttonSize / 2;
    
    // Get current sound state from localStorage (default to enabled)
    const isSoundEnabled = localStorage.getItem('hemoclast_sound_enabled') !== 'false';
    
    // Create circular button background
    const buttonBg = this.add.circle(buttonX, buttonY, buttonSize / 2, 0x2d1b1b)
      .setStrokeStyle(2, 0x8B0000)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    // Sound icon (🔊 for enabled, 🔇 for disabled)
    const soundIcon = this.add.text(buttonX, buttonY, isSoundEnabled ? '🔊' : '🔇', {
      fontSize: `${ResponsiveLayout.getButtonFontSize(isMobile ? 24 : 20, width, height)}px`,
      color: '#F5F5DC'
    }).setOrigin(0.5);
    this.sceneElements.push(soundIcon);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(0x4a0000);
        buttonBg.setStrokeStyle(2, 0xDC143C);
      }
      if (soundIcon && soundIcon.active) {
        soundIcon.setScale(1.1);
      }
    });
    
    buttonBg.on('pointerout', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(0x2d1b1b);
        buttonBg.setStrokeStyle(2, 0x8B0000);
      }
      if (soundIcon && soundIcon.active) {
        soundIcon.setScale(1.0);
      }
    });
    
    // Toggle sound on click
    buttonBg.on('pointerdown', () => {
      const currentState = localStorage.getItem('hemoclast_sound_enabled') !== 'false';
      const newState = !currentState;
      
      // Update localStorage
      localStorage.setItem('hemoclast_sound_enabled', newState.toString());
      
      // Update icon
      if (soundIcon && soundIcon.active) {
        soundIcon.setText(newState ? '🔊' : '🔇');
      }
      
      // TODO: Actually toggle game sound/music here
      // For now, just show a brief notification
      this.notificationManager.info(
        newState ? 'Sound enabled' : 'Sound disabled',
        'Audio',
        1500
      );
    });
  }


  private createActionButton(
    x: number, 
    y: number, 
    baseWidth: number, 
    baseHeight: number, 
    text: string, 
    callback: () => void,
    bgColor: number = 0x4A4A4A,
    borderColor: number = 0x666666,
    textColor: string = '#F5F5DC'
  ) {
    const { width: screenWidth, height: screenHeight } = this.scale;
    const isMobile = ResponsiveLayout.isMobile(screenWidth, screenHeight);
    
    // Calculate text dimensions to ensure button fits content
    const fontSize = ResponsiveLayout.getButtonFontSize(16, screenWidth, screenHeight);
    
    // Create temporary text object to measure dimensions
    const tempText = this.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Cinzel, serif',
    });
    
    // Calculate required button dimensions based on text content
    const textPadding = isMobile ? 40 : 32; // More padding on mobile
    const requiredWidth = tempText.width + textPadding;
    const requiredHeight = Math.max(tempText.height + 20, isMobile ? 50 : 44); // Minimum touch-friendly height
    
    // Clean up temporary text object
    tempText.destroy();
    
    // Use touch-friendly button dimensions but ensure it fits content
    const touchButton = ResponsiveLayout.getTouchFriendlyButton(baseWidth, baseHeight, screenWidth, screenHeight);
    const width = Math.max(touchButton.width, requiredWidth);
    const height = Math.max(touchButton.height, requiredHeight);
    
    const buttonBg = this.add.rectangle(x, y, width, height, bgColor)
      .setStrokeStyle(2, borderColor)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: textColor,
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(buttonText);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      if (buttonBg && buttonBg.active) {
        if (bgColor === 0x2d1b1b) {
          // Sign up button hover
          buttonBg.setFillStyle(0x4a0000);
          buttonBg.setStrokeStyle(2, 0xDC143C);
        } else {
          // Guest button hover
          buttonBg.setFillStyle(0x666666);
          buttonBg.setStrokeStyle(2, 0x888888);
        }
      }
      if (buttonText && buttonText.active && bgColor === 0x2d1b1b) {
        buttonText.setColor('#FFD700');
      }
    });
    
    buttonBg.on('pointerout', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(bgColor);
        buttonBg.setStrokeStyle(2, borderColor);
      }
      if (buttonText && buttonText.active) {
        buttonText.setColor(textColor);
      }
    });
    
    buttonBg.on('pointerdown', callback);
    
    return { bg: buttonBg, text: buttonText };
  }

  private createMultiLineActionButton(
    x: number, 
    y: number, 
    baseWidth: number, 
    baseHeight: number, 
    topText: string,
    bottomText: string,
    callback: () => void,
    bgColor: number = 0x4A4A4A,
    borderColor: number = 0x666666,
    textColor: string = '#F5F5DC'
  ) {
    const { width: screenWidth, height: screenHeight } = this.scale;
    const isMobile = ResponsiveLayout.isMobile(screenWidth, screenHeight);
    
    // Calculate text dimensions to ensure button fits content
    const topFontSize = ResponsiveLayout.getButtonFontSize(16, screenWidth, screenHeight);
    const bottomFontSize = ResponsiveLayout.getButtonFontSize(14, screenWidth, screenHeight);
    
    // Create temporary text objects to measure dimensions
    const tempTopText = this.add.text(0, 0, topText, {
      fontSize: `${topFontSize}px`,
      fontFamily: 'Cinzel, serif',
    });
    const tempBottomText = this.add.text(0, 0, bottomText, {
      fontSize: `${bottomFontSize}px`,
      fontFamily: 'Cinzel, serif',
      fontStyle: 'italic'
    });
    
    // Calculate required button dimensions based on text content
    const textPadding = isMobile ? 24 : 16; // More padding on mobile
    const lineSpacing = isMobile ? 6 : 4; // More line spacing on mobile
    const requiredWidth = Math.max(tempTopText.width, tempBottomText.width) + textPadding;
    const requiredHeight = tempTopText.height + tempBottomText.height + lineSpacing + (textPadding / 2);
    
    // Clean up temporary text objects
    tempTopText.destroy();
    tempBottomText.destroy();
    
    // Use touch-friendly button dimensions but ensure it fits content
    const touchButton = ResponsiveLayout.getTouchFriendlyButton(baseWidth, baseHeight, screenWidth, screenHeight);
    const width = Math.max(touchButton.width, requiredWidth);
    const height = Math.max(touchButton.height, requiredHeight);
    
    const buttonBg = this.add.rectangle(x, y, width, height, bgColor)
      .setStrokeStyle(2, borderColor)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    // Position text lines with proper spacing
    const textOffsetY = lineSpacing / 2;
    
    // Top text line
    const topButtonText = this.add.text(x, y - textOffsetY - 2, topText, {
      fontSize: `${topFontSize}px`,
      color: textColor,
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(topButtonText);
    
    // Bottom text line (username)
    const bottomButtonText = this.add.text(x, y + textOffsetY + 8, bottomText, {
      fontSize: `${bottomFontSize}px`,
      color: textColor,
      fontFamily: 'Cinzel, serif',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.sceneElements.push(bottomButtonText);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(0x666666);
        buttonBg.setStrokeStyle(2, 0x888888);
      }
      if (topButtonText && topButtonText.active) {
        topButtonText.setColor('#FFFFFF');
      }
      if (bottomButtonText && bottomButtonText.active) {
        bottomButtonText.setColor('#FFFFFF');
      }
    });
    
    buttonBg.on('pointerout', () => {
      if (buttonBg && buttonBg.active) {
        buttonBg.setFillStyle(bgColor);
        buttonBg.setStrokeStyle(2, borderColor);
      }
      if (topButtonText && topButtonText.active) {
        topButtonText.setColor(textColor);
      }
      if (bottomButtonText && bottomButtonText.active) {
        bottomButtonText.setColor(textColor);
      }
    });
    
    buttonBg.on('pointerdown', callback);
    
    return { bg: buttonBg, topText: topButtonText, bottomText: bottomButtonText };
  }
  
  private continueAsExistingGuest() {
    // Use existing guest token and go to character selection
    this.gameStore.store.getState().setScene('CharacterSelectionScene');
    this.cleanupForm();
    this.scene.start('CharacterSelectionScene');
  }
  

  private toggleMode() {
    this.currentMode = this.currentMode === 'login' ? 'register' : 'login';
    
    // Refresh the UI
    this.createUI();
  }

  private async handleFormSubmit() {
    const username = this.inputElements.username?.value?.trim();
    const email = this.inputElements.email?.value?.trim();
    const password = this.inputElements.password?.value;
    
    // Input validation
    if (!this.validateInputs(username, email, password)) {
      return;
    }
    
    // Clear any existing notifications to prevent stacking
    this.notificationManager.dismissAll();
    
    // Check if this is a guest account upgrade
    const isUpgrading = localStorage.getItem('hemoclast_upgrading_guest') === 'true';
    
    const loadingId = this.loadingManager.show({
      type: 'spinner',
      message: isUpgrading ? 'Converting guest account...' : 
               (this.currentMode === 'login' ? 'Signing in...' : 'Creating account...'),
      cancellable: false // Prevent cancellation during critical auth process
    });
    
    try {
      let endpoint: string;
      let body: any;
      let headers: any = { 'Content-Type': 'application/json' };
      
      if (isUpgrading) {
        // Guest account conversion - use existing guest token
        const guestToken = localStorage.getItem('hemoclast_token');
        endpoint = '/api/v1/auth/convert-guest';
        body = { email, password };
        headers['Authorization'] = `Bearer ${guestToken}`;
      } else {
        // Regular login/register flow
        endpoint = this.currentMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
        body = this.currentMode === 'login' 
          ? { username, password }
          : { username, email, password };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      const data = await this.errorHandler.handleApiResponse(response, 'Authentication');
      
      // Update loading message to show success
      this.loadingManager.updateMessage(loadingId, 'Authentication successful! Redirecting...');
      
      // Wait a moment before proceeding to ensure user sees the success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.loadingManager.hide(loadingId);
      this.handleAuthSuccess(data);
      
    } catch (error) {
      this.loadingManager.hide(loadingId);
      const gameError = this.errorHandler.handleError(error, 'Authentication');
      
      // Show clear error message without retry buttons
      let errorMessage = gameError.message;
      
      // Make error messages more specific and user-friendly
      if (gameError.details?.status === 401) {
        errorMessage = 'Invalid username or password. Please check your credentials and try again.';
      } else if (gameError.details?.status === 404) {
        errorMessage = 'Account not found. Please check your username or create a new account.';
      } else if (gameError.type === 'network') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      this.notificationManager.error(
        errorMessage,
        'Sign In Failed'
        // No action buttons - user can simply try again manually
      );
    }
  }

  private validateInputs(username: string, email: string, password: string): boolean {
    // Username validation
    if (!username) {
      this.notificationManager.warning('Please enter a username');
      return false;
    }
    
    if (username.length < 3) {
      this.notificationManager.warning('Username must be at least 3 characters long');
      return false;
    }
    
    if (username.length > 20) {
      this.notificationManager.warning('Username must be less than 20 characters');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.notificationManager.warning('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    // Password validation
    if (!password) {
      this.notificationManager.warning('Please enter a password');
      return false;
    }
    
    // Only enforce minimum length for registration, not login
    if (this.currentMode === 'register' && password.length < 6) {
      this.notificationManager.warning('Password must be at least 6 characters long');
      return false;
    }
    
    // Email validation for registration
    if (this.currentMode === 'register') {
      if (!email) {
        this.notificationManager.warning('Please enter an email address');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.notificationManager.warning('Please enter a valid email address');
        return false;
      }
    }
    
    return true;
  }

  private async handleGuestLogin() {
    // Clear any existing notifications
    this.notificationManager.dismissAll();
    
    const loadingId = this.loadingManager.show({
      type: 'spinner',
      message: 'Creating guest account...',
      cancellable: false
    });
    
    try {
      const response = await fetch('/api/v1/auth/guest', {
        method: 'POST'
      });
      
      const data = await this.errorHandler.handleApiResponse(response, 'Guest Login');
      
      // Update loading message
      this.loadingManager.updateMessage(loadingId, 'Guest account created! Redirecting...');
      
      // Wait a moment before proceeding
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.loadingManager.hide(loadingId);
      this.handleGuestSuccess(data);
      
    } catch (error) {
      this.loadingManager.hide(loadingId);
      const gameError = this.errorHandler.handleError(error, 'Guest Login');
      
      // Clear, simple error message without buttons
      let errorMessage = gameError.message;
      if (gameError.type === 'network') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (gameError.details?.status >= 500) {
        errorMessage = 'Server is temporarily unavailable. Please try again in a moment.';
      }
      
      this.notificationManager.error(
        errorMessage,
        'Guest Login Failed'
        // No action buttons - user can try again manually
      );
    }
  }

  private handleAuthSuccess(authData: any) {
    // Check if this is a guest account upgrade
    const isUpgrading = localStorage.getItem('hemoclast_upgrading_guest') === 'true';
    
    // Store auth token first (JWT for registered users, session token for guests)
    localStorage.setItem('hemoclast_token', authData.access_token || authData.session_token);
    localStorage.setItem('hemoclast_player_id', authData.player_id.toString());
    localStorage.setItem('hemoclast_username', authData.username);
    
    if (isUpgrading) {
      // Guest account was successfully converted - now it's a registered user
      localStorage.setItem('hemoclast_is_registered', 'true');
      localStorage.removeItem('hemoclast_is_guest');
      localStorage.removeItem('hemoclast_upgrading_guest');
      localStorage.removeItem('hemoclast_guest_characters');
      localStorage.removeItem('hemoclast_guest_player_data');
      
      this.completeAuthSuccess(authData, `Account converted successfully! Your progress has been preserved.`);
    } else if (authData.session_token) {
      // New guest account
      localStorage.setItem('hemoclast_is_guest', 'true');
      localStorage.removeItem('hemoclast_is_registered');
      
      this.completeAuthSuccess(authData, `Welcome, ${authData.username}!`);
    } else {
      // Regular registered user login/register
      localStorage.setItem('hemoclast_is_registered', 'true');
      localStorage.removeItem('hemoclast_is_guest');
      
      this.completeAuthSuccess(authData, `Welcome back, ${authData.username}!`);
    }
  }
  
  
  private completeAuthSuccess(authData: any, message: string) {
    // Update game store
    this.gameStore.store.getState().setPlayer({
      id: authData.player_id,
      name: authData.username,
      level: 1,
      experience: 0,
      health: 100,
      healthMax: 100,
      mana: 50,
      manaMax: 50,
      gold: 0,
      gems: 0
    });
    
    // Cleanup form
    this.cleanupForm();
    
    // Clear all notifications to prevent stacking
    this.notificationManager.dismissAll();
    
    // Show final success notification
    this.notificationManager.success(
      message,
      'Success',
      3000 // Show longer for upgrade messages
    );
    
    // Immediate transition to character selection (no additional delay)
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.gameStore.store.getState().setScene('CharacterSelectionScene');
      this.scene.start('CharacterSelectionScene');
    });
  }

  private handleGuestSuccess(guestData: any) {
    // Use the new unified auth success handler
    this.handleAuthSuccess(guestData);
  }

  private showUpgradeIndicator() {
    const isUpgrading = localStorage.getItem('hemoclast_upgrading_guest') === 'true';
    
    if (isUpgrading) {
      const { width, height } = this.scale;
      const isMobile = ResponsiveLayout.isMobile(width, height);
      
      // Mobile-optimized positioning - place below title but well above form
      const bannerY = isMobile ? height * 0.28 : height * 0.22; // Higher position to clear sign-in form
      const bannerWidth = Math.min(width * 0.9, 600); // Responsive width, max 600px
      const bannerHeight = isMobile ? 60 : 50; // Taller on mobile for better visibility
      
      // Show upgrade banner positioned to not cover title
      const banner = GraphicsUtils.createUIPanel(
        this,
        width / 2 - bannerWidth / 2,
        bannerY - bannerHeight / 2,
        bannerWidth,
        bannerHeight,
        0x4a0000,
        0xFFD700,
        2
      );
      this.sceneElements.push(banner);
      
      // Upgrade message with responsive font size
      const fontSize = ResponsiveLayout.getScaledFontSize(16, width, height);
      const upgradeText = this.add.text(width / 2, bannerY, 
        '🔄 Upgrading Guest Account - Your characters will be preserved!', {
        fontSize: `${fontSize}px`,
        color: '#FFD700',
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: bannerWidth - 20, useAdvancedWrap: true },
        align: 'center'
      }).setOrigin(0.5);
      this.sceneElements.push(upgradeText);
      
      // Add pulsing effect
      this.tweens.add({
        targets: upgradeText,
        alpha: 0.7,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private cleanupForm() {
    const form = document.getElementById('login-form');
    if (form) {
      form.remove();
    }
  }

  destroy() {
    this.cleanupForm();
    this.clearUI();
    
    // Cleanup managers
    this.notificationManager.destroy();
    this.loadingManager.destroy();
  }
}
