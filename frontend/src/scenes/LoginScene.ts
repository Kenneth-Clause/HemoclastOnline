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
    const gothicFrame = GothicTitleUtils.createGothicFrame(
      this,
      centerX,
      formCenterY,
      400,
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
    const formLeft = centerX - 200;
    const formRight = centerX + 200;
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
    
    // Form title (positioned based on form type - login needs less space than registration)
    const titleY = this.currentMode === 'login' ? formCenterY - 90 : formCenterY - 110;
    const formTitle = this.add.text(centerX, titleY, this.currentMode === 'login' ? 'Sign In' : 'Create Account',
      ResponsiveLayout.getTextStyle(24, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
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
    
    // Remove existing form if any
    const existingForm = document.getElementById('login-form');
    if (existingForm) {
      existingForm.remove();
    }
    
    // Create form container
    const formContainer = document.createElement('div');
    formContainer.id = 'login-form';
    formContainer.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      z-index: 1000;
      pointer-events: auto;
    `;
    
    // Username input
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Username';
    usernameInput.id = 'username';
    usernameInput.className = 'gothic-input';
    
    // Email input (for registration)
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';
    emailInput.id = 'email';
    emailInput.className = 'gothic-input';
    emailInput.style.display = this.currentMode === 'register' ? 'block' : 'none';
    
    // Password input
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.id = 'password';
    passwordInput.className = 'gothic-input';
    
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
    
    // Main action button (Login/Register) - positioned based on form type
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonY = this.currentMode === 'register' ? formCenterY + 130 : formCenterY + 90; // Login form is shorter, needs less space
    
    const buttonBg = this.add.rectangle(centerX, buttonY, buttonWidth, buttonHeight, 0x2d1b1b)
      .setStrokeStyle(2, 0x8B0000)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    const buttonText = this.add.text(centerX, buttonY, 
      this.currentMode === 'login' ? 'Sign In' : 'Create Account',
      ResponsiveLayout.getTextStyle(16, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(buttonText);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x4a0000);
      buttonBg.setStrokeStyle(2, 0xDC143C);
      buttonText.setColor('#FFD700');
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x2d1b1b);
      buttonBg.setStrokeStyle(2, 0x8B0000);
      buttonText.setColor('#F5F5DC');
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
    
    // Add Settings and Credits buttons to bottom left (for both modes)
    this.createBottomLeftButtons();
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

  private createBottomLeftButtons() {
    const { width, height } = this.scale;
    const baseFontSize = Math.min(width, height) / 80;
    const buttonX = 100;
    const buttonSpacing = 45;
    const bottomMargin = 30;
    
    // Stack buttons vertically in bottom left corner
    const creditsY = height - bottomMargin;
    const settingsY = creditsY - buttonSpacing;
    
    // Credits button (bottom)
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
    this.sceneElements.push(creditsButton.background);
    this.sceneElements.push(creditsButton.text);
    this.sceneElements.push(creditsButton.hitArea);
    
    // Settings button (top)
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
    this.sceneElements.push(settingsButton.background);
    this.sceneElements.push(settingsButton.text);
    this.sceneElements.push(settingsButton.hitArea);
  }

  private createActionButton(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    text: string, 
    callback: () => void,
    bgColor: number = 0x4A4A4A,
    borderColor: number = 0x666666,
    textColor: string = '#F5F5DC'
  ) {
    const { width: screenWidth, height: screenHeight } = this.scale;
    
    const buttonBg = this.add.rectangle(x, y, width, height, bgColor)
      .setStrokeStyle(2, borderColor)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    const buttonText = this.add.text(x, y, text,
      ResponsiveLayout.getTextStyle(16, screenWidth, screenHeight, {
        color: textColor,
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(buttonText);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      if (bgColor === 0x2d1b1b) {
        // Sign up button hover
        buttonBg.setFillStyle(0x4a0000);
        buttonBg.setStrokeStyle(2, 0xDC143C);
        buttonText.setColor('#FFD700');
      } else {
        // Guest button hover
        buttonBg.setFillStyle(0x666666);
        buttonBg.setStrokeStyle(2, 0x888888);
      }
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(bgColor);
      buttonBg.setStrokeStyle(2, borderColor);
      buttonText.setColor(textColor);
    });
    
    buttonBg.on('pointerdown', callback);
    
    return { bg: buttonBg, text: buttonText };
  }

  private createMultiLineActionButton(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    topText: string,
    bottomText: string,
    callback: () => void,
    bgColor: number = 0x4A4A4A,
    borderColor: number = 0x666666,
    textColor: string = '#F5F5DC'
  ) {
    const { width: screenWidth, height: screenHeight } = this.scale;
    
    const buttonBg = this.add.rectangle(x, y, width, height, bgColor)
      .setStrokeStyle(2, borderColor)
      .setInteractive();
    this.sceneElements.push(buttonBg);
    
    // Top text line
    const topButtonText = this.add.text(x, y - 10, topText,
      ResponsiveLayout.getTextStyle(16, screenWidth, screenHeight, {
        color: textColor,
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(topButtonText);
    
    // Bottom text line (username)
    const bottomButtonText = this.add.text(x, y + 12, bottomText,
      ResponsiveLayout.getTextStyle(14, screenWidth, screenHeight, {
        color: textColor,
        fontFamily: 'Cinzel, serif',
        fontWeight: '400',
        fontStyle: 'italic'
      })
    ).setOrigin(0.5);
    this.sceneElements.push(bottomButtonText);
    
    // Button hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x666666);
      buttonBg.setStrokeStyle(2, 0x888888);
      topButtonText.setColor('#FFFFFF');
      bottomButtonText.setColor('#FFFFFF');
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(bgColor);
      buttonBg.setStrokeStyle(2, borderColor);
      topButtonText.setColor(textColor);
      bottomButtonText.setColor(textColor);
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
  
  private createNewGuestAccount() {
    const { width, height } = this.scale;
    
    // Show warning dialog
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(100);
    
    const panel = GraphicsUtils.createUIPanel(
      this,
      width / 2 - 250,
      height / 2 - 100,
      500,
      200,
      0x4a0000,
      0xDC143C,
      3
    );
    panel.setDepth(101);
    
    // Warning content
    this.add.text(width / 2, height / 2 - 60, '⚠️ Warning', {
      fontSize: '24px',
      color: '#FFD700',
      fontFamily: 'Nosifer, serif'
    }).setOrigin(0.5).setDepth(102);
    
    this.add.text(width / 2, height / 2 - 20, 
      'Creating a new guest account will delete\nyour current progress. Continue?', {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(102);
    
    // Confirm button
    const confirmBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 - 80,
      height / 2 + 40,
      140,
      35,
      'Yes, Delete Progress',
      12,
      () => {
        this.closeNewGuestDialog([overlay, panel]);
        this.deleteOldGuestAndCreateNew();
      }
    );
    confirmBtn.background.setDepth(102);
    confirmBtn.text.setDepth(103);
    
    // Cancel button
    const cancelBtn = GraphicsUtils.createRuneScapeButton(
      this,
      width / 2 + 80,
      height / 2 + 40,
      140,
      35,
      'Cancel',
      12,
      () => {
        this.closeNewGuestDialog([overlay, panel]);
      }
    );
    cancelBtn.background.setDepth(102);
    cancelBtn.text.setDepth(103);
  }
  
  private closeNewGuestDialog(elements: Phaser.GameObjects.GameObject[]) {
    elements.forEach(element => element.destroy());
  }
  
  private deleteOldGuestAndCreateNew() {
    // Clear old guest data
    localStorage.removeItem('hemoclast_token');
    localStorage.removeItem('hemoclast_player_id');
    localStorage.removeItem('hemoclast_username');
    localStorage.removeItem('hemoclast_character_id');
    localStorage.removeItem('hemoclast_is_guest');
    
    // Create new guest account
    this.handleGuestLogin();
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
    
    const loadingId = this.loadingManager.show({
      type: 'spinner',
      message: this.currentMode === 'login' ? 'Signing in...' : 'Creating account...',
      cancellable: false // Prevent cancellation during critical auth process
    });
    
    try {
      const endpoint = this.currentMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const body = this.currentMode === 'login' 
        ? { username, password }
        : { username, email, password };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    // Store auth token first
    localStorage.setItem('hemoclast_token', authData.access_token);
    localStorage.setItem('hemoclast_player_id', authData.player_id.toString());
    localStorage.setItem('hemoclast_username', authData.username);
    
    // Mark as registered user (not guest)
    localStorage.setItem('hemoclast_is_registered', 'true');
    localStorage.removeItem('hemoclast_is_guest'); // Clear any guest flag
    
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
      `Welcome back, ${authData.username}!`,
      'Login Successful',
      2000 // Auto-dismiss after 2 seconds
    );
    
    // Immediate transition to character selection (no additional delay)
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.gameStore.store.getState().setScene('CharacterSelectionScene');
      this.scene.start('CharacterSelectionScene');
    });
  }

  private handleGuestSuccess(guestData: any) {
    // Store auth token (same as regular users)
    localStorage.setItem('hemoclast_token', guestData.access_token);
    localStorage.setItem('hemoclast_player_id', guestData.player_id.toString());
    localStorage.setItem('hemoclast_username', guestData.username);
    
    // Mark as guest user (not registered)
    localStorage.setItem('hemoclast_is_guest', 'true');
    localStorage.removeItem('hemoclast_is_registered'); // Clear any registered flag
    
    // Update game store
    this.gameStore.store.getState().setPlayer({
      id: guestData.player_id,
      name: guestData.username,
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
    
    // Clear notifications and show success
    this.notificationManager.dismissAll();
    this.notificationManager.success(
      `Welcome, ${guestData.username}!`,
      'Guest Account Created',
      2000
    );
    
    // Immediate transition
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.gameStore.store.getState().setScene('CharacterSelectionScene');
      this.scene.start('CharacterSelectionScene');
    });
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
    
    super.destroy();
  }
}
