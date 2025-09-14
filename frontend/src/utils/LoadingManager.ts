/**
 * Production-ready loading state management for HemoclastOnline
 */

import { ResponsiveLayout } from './ResponsiveLayout';

export interface LoadingState {
  id: string;
  message: string;
  progress?: number; // 0-1 for progress bar
  cancellable?: boolean;
  onCancel?: () => void;
  type: 'spinner' | 'progress' | 'dots';
}

export class LoadingManager {
  private static instance: LoadingManager;
  private scene?: Phaser.Scene;
  private activeLoaders: Map<string, { state: LoadingState; elements: Phaser.GameObjects.GameObject[] }> = new Map();
  private overlay?: Phaser.GameObjects.Graphics;
  private container?: Phaser.GameObjects.Container;

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  /**
   * Initialize with a Phaser scene
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Show loading state
   */
  show(options: Omit<LoadingState, 'id'>): string {
    if (!this.scene) return '';

    const id = this.generateId();
    const loadingState: LoadingState = {
      ...options,
      id
    };

    // Create overlay if first loader
    if (this.activeLoaders.size === 0) {
      this.createOverlay();
    }

    const elements = this.createLoadingElements(loadingState);
    this.activeLoaders.set(id, { state: loadingState, elements });

    return id;
  }

  /**
   * Update loading progress
   */
  updateProgress(id: string, progress: number, message?: string): void {
    const loader = this.activeLoaders.get(id);
    if (!loader) return;

    loader.state.progress = Math.max(0, Math.min(1, progress));
    if (message) {
      loader.state.message = message;
    }

    this.updateLoadingElements(loader);
  }

  /**
   * Update loading message
   */
  updateMessage(id: string, message: string): void {
    const loader = this.activeLoaders.get(id);
    if (!loader) return;

    loader.state.message = message;
    this.updateLoadingElements(loader);
  }

  /**
   * Hide specific loading state
   */
  hide(id: string): void {
    const loader = this.activeLoaders.get(id);
    if (!loader) return;

    // Animate out
    if (this.scene) {
      this.scene.tweens.add({
        targets: loader.elements,
        alpha: 0,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.destroyLoader(id);
        }
      });
    } else {
      this.destroyLoader(id);
    }
  }

  /**
   * Hide all loading states
   */
  hideAll(): void {
    Array.from(this.activeLoaders.keys()).forEach(id => this.hide(id));
  }

  /**
   * Check if any loaders are active
   */
  isLoading(): boolean {
    return this.activeLoaders.size > 0;
  }

  /**
   * Get active loader count
   */
  getActiveCount(): number {
    return this.activeLoaders.size;
  }

  /**
   * Create overlay background
   */
  private createOverlay(): void {
    if (!this.scene) return;

    const { width, height } = this.scene.scale;

    // Semi-transparent overlay with highest depth - above HTML elements too
    this.overlay = this.scene.add.graphics();
    this.overlay.fillStyle(0x000000, 0.8);
    this.overlay.fillRect(0, 0, width, height);
    this.overlay.setDepth(999999); // Maximum depth to be above everything
    this.overlay.setScrollFactor(0);

    // Container for loading elements
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(1000000); // Maximum depth for loading content
    this.container.setScrollFactor(0);

    // Immediately hide HTML form elements for snappy response
    const htmlForm = document.getElementById('login-form');
    if (htmlForm) {
      htmlForm.style.transition = 'opacity 0.1s ease-out'; // Very fast transition
      htmlForm.style.opacity = '0'; // Fade out quickly
      htmlForm.style.zIndex = '999'; // Lower than loading overlay
      htmlForm.style.pointerEvents = 'none'; // Disable interaction during loading
      
      // Completely hide after quick fade
      setTimeout(() => {
        if (htmlForm) {
          htmlForm.style.visibility = 'hidden';
        }
      }, 100);
    }

    // Faster overlay animation
    this.overlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration: 150, // Much faster animation
      ease: 'Power2.easeOut'
    });
  }

  /**
   * Create loading visual elements
   */
  private createLoadingElements(loadingState: LoadingState): Phaser.GameObjects.GameObject[] {
    if (!this.scene || !this.container) return [];

    const elements: Phaser.GameObjects.GameObject[] = [];
    const { width, height } = this.scene.scale;
    const scale = ResponsiveLayout.getUIScale(width, height);

    // Enhanced gothic panel with atmospheric effects
    const panelWidth = 450 * scale;
    const panelHeight = 220 * scale;
    
    const panel = this.scene.add.graphics();
    
    // Background with gradient effect
    panel.fillStyle(0x1a1a1a, 0.95);
    panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15 * scale);
    
    // Enhanced border with glow
    panel.lineStyle(4 * scale, 0x8B0000, 1);
    panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15 * scale);
    
    // Inner highlight border
    panel.lineStyle(2 * scale, 0xDC143C, 0.6);
    panel.strokeRoundedRect(-panelWidth/2 + 3, -panelHeight/2 + 3, panelWidth - 6, panelHeight - 6, 12 * scale);
    
    // Add corner ornaments
    const ornamentSize = 16 * scale;
    const ornamentOffset = 25 * scale;
    
    // Corner ornaments
    const topLeft = this.scene.add.text(-panelWidth/2 + ornamentOffset, -panelHeight/2 + ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    const topRight = this.scene.add.text(panelWidth/2 - ornamentOffset, -panelHeight/2 + ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    const bottomLeft = this.scene.add.text(-panelWidth/2 + ornamentOffset, panelHeight/2 - ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    const bottomRight = this.scene.add.text(panelWidth/2 - ornamentOffset, panelHeight/2 - ornamentOffset, '⚜', {
      fontSize: `${ornamentSize}px`,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    elements.push(panel, topLeft, topRight, bottomLeft, bottomRight);

    // Enhanced Gothic Title
    const titleText = this.scene.add.text(
      0,
      -panelHeight/2 + 40 * scale,
      'LOADING...',
      ResponsiveLayout.getTextStyle(28, width, height, {
        color: '#8B0000',
        fontFamily: 'Nosifer, serif',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#8B0000',
          blur: 12,
          stroke: true,
          fill: true
        }
      })
    ).setOrigin(0.5);
    elements.push(titleText);

    // Loading animation based on type
    switch (loadingState.type) {
      case 'spinner':
        const spinner = this.createSpinner(scale);
        elements.push(...spinner);
        break;
      case 'progress':
        const progressBar = this.createProgressBar(loadingState, scale);
        elements.push(...progressBar);
        break;
      case 'dots':
        const dots = this.createDots(scale);
        elements.push(...dots);
        break;
    }

    // Enhanced Message with glow effect
    const messageText = this.scene.add.text(
      0,
      panelHeight/2 - 60 * scale,
      loadingState.message,
      ResponsiveLayout.getTextStyle(18, width, height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: panelWidth - 40 * scale },
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#8B0000',
          blur: 6,
          stroke: true,
          fill: true
        }
      })
    ).setOrigin(0.5);
    messageText.setName(`message-${loadingState.id}`);
    
    // Add pulsing animation to message
    this.scene.tweens.add({
      targets: messageText,
      alpha: 0.8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    elements.push(messageText);

    // Cancel button if cancellable
    if (loadingState.cancellable && loadingState.onCancel) {
      const cancelButton = this.createCancelButton(loadingState, scale);
      elements.push(...cancelButton);
    }

    // Add elements to container
    this.container.add(elements);

    // Animate in
    elements.forEach(element => {
      element.setAlpha(0);
    });

    if (this.scene) {
      this.scene.tweens.add({
        targets: elements,
        alpha: 1,
        duration: 300,
        ease: 'Power2.easeOut'
      });
    }

    return elements;
  }

  /**
   * Create spinning loader
   */
  private createSpinner(scale: number): Phaser.GameObjects.GameObject[] {
    if (!this.scene) return [];

    const spinner = this.scene.add.graphics();
    const radius = 30 * scale;
    
    spinner.lineStyle(4 * scale, 0x8B0000);
    spinner.beginPath();
    spinner.arc(0, -20 * scale, radius, 0, Math.PI * 1.5);
    spinner.strokePath();

    // Animate rotation
    this.scene.tweens.add({
      targets: spinner,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });

    return [spinner];
  }

  /**
   * Create progress bar
   */
  private createProgressBar(loadingState: LoadingState, scale: number): Phaser.GameObjects.GameObject[] {
    if (!this.scene) return [];

    const elements: Phaser.GameObjects.GameObject[] = [];
    const barWidth = 300 * scale;
    const barHeight = 20 * scale;

    // Background
    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRoundedRect(-barWidth/2, -30 * scale, barWidth, barHeight, barHeight/2);
    background.lineStyle(2 * scale, 0x666666);
    background.strokeRoundedRect(-barWidth/2, -30 * scale, barWidth, barHeight, barHeight/2);
    elements.push(background);

    // Progress fill
    const progress = loadingState.progress || 0;
    const progressFill = this.scene.add.graphics();
    progressFill.fillStyle(0x8B0000);
    progressFill.fillRoundedRect(-barWidth/2 + 2, -30 * scale + 2, (barWidth - 4) * progress, barHeight - 4, (barHeight - 4)/2);
    progressFill.setName(`progress-${loadingState.id}`);
    elements.push(progressFill);

    // Progress text
    const progressText = this.scene.add.text(
      0,
      -20 * scale,
      `${Math.round(progress * 100)}%`,
      ResponsiveLayout.getTextStyle(12, this.scene.scale.width, this.scene.scale.height, {
        color: '#FFFFFF',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    progressText.setName(`progress-text-${loadingState.id}`);
    elements.push(progressText);

    return elements;
  }

  /**
   * Create animated dots
   */
  private createDots(scale: number): Phaser.GameObjects.GameObject[] {
    if (!this.scene) return [];

    const elements: Phaser.GameObjects.GameObject[] = [];
    const dotCount = 3;
    const spacing = 20 * scale;

    for (let i = 0; i < dotCount; i++) {
      const dot = this.scene.add.circle(
        (i - 1) * spacing,
        -20 * scale,
        6 * scale,
        0x8B0000
      );

      // Animate dots with staggered timing
      this.scene.tweens.add({
        targets: dot,
        scaleY: 0.3,
        duration: 600,
        delay: i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      elements.push(dot);
    }

    return elements;
  }

  /**
   * Create cancel button
   */
  private createCancelButton(loadingState: LoadingState, scale: number): Phaser.GameObjects.GameObject[] {
    if (!this.scene) return [];

    const elements: Phaser.GameObjects.GameObject[] = [];
    const buttonWidth = 100 * scale;
    const buttonHeight = 35 * scale;

    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0x4A4A4A, 0.8);
    buttonBg.fillRoundedRect(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight, 6 * scale);
    buttonBg.lineStyle(2 * scale, 0x666666);
    buttonBg.strokeRoundedRect(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight, 6 * scale);
    buttonBg.setInteractive(
      new Phaser.Geom.Rectangle(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains
    );
    elements.push(buttonBg);

    // Button text
    const buttonText = this.scene.add.text(
      0,
      67 * scale,
      'Cancel',
      ResponsiveLayout.getTextStyle(14, this.scene.scale.width, this.scene.scale.height, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif'
      })
    ).setOrigin(0.5);
    elements.push(buttonText);

    // Button interactions
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x666666, 0.9);
      buttonBg.fillRoundedRect(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight, 6 * scale);
      buttonBg.lineStyle(2 * scale, 0x888888);
      buttonBg.strokeRoundedRect(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight, 6 * scale);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4A4A4A, 0.8);
      buttonBg.fillRoundedRect(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight, 6 * scale);
      buttonBg.lineStyle(2 * scale, 0x666666);
      buttonBg.strokeRoundedRect(-buttonWidth/2, 50 * scale, buttonWidth, buttonHeight, 6 * scale);
    });

    buttonBg.on('pointerdown', () => {
      if (loadingState.onCancel) {
        loadingState.onCancel();
      }
      this.hide(loadingState.id);
    });

    return elements;
  }

  /**
   * Update existing loading elements
   */
  private updateLoadingElements(loader: { state: LoadingState; elements: Phaser.GameObjects.GameObject[] }): void {
    if (!this.scene) return;

    const { state, elements } = loader;

    // Update message
    const messageElement = elements.find(el => el.name === `message-${state.id}`) as Phaser.GameObjects.Text;
    if (messageElement) {
      messageElement.setText(state.message);
    }

    // Update progress bar if applicable
    if (state.type === 'progress' && state.progress !== undefined) {
      const progressElement = elements.find(el => el.name === `progress-${state.id}`) as Phaser.GameObjects.Graphics;
      const progressTextElement = elements.find(el => el.name === `progress-text-${state.id}`) as Phaser.GameObjects.Text;
      
      if (progressElement) {
        const { width } = this.scene.scale;
        const scale = ResponsiveLayout.getUIScale(width, this.scene.scale.height);
        const barWidth = 300 * scale;
        const barHeight = 20 * scale;

        progressElement.clear();
        progressElement.fillStyle(0x8B0000);
        progressElement.fillRoundedRect(-barWidth/2 + 2, -30 * scale + 2, (barWidth - 4) * state.progress, barHeight - 4, (barHeight - 4)/2);
      }

      if (progressTextElement) {
        progressTextElement.setText(`${Math.round(state.progress * 100)}%`);
      }
    }
  }

  /**
   * Destroy specific loader
   */
  private destroyLoader(id: string): void {
    const loader = this.activeLoaders.get(id);
    if (!loader) return;

    // Destroy elements
    loader.elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });

    this.activeLoaders.delete(id);

    // Remove overlay if no more loaders
    if (this.activeLoaders.size === 0) {
      this.destroyOverlay();
    }
  }

  /**
   * Destroy overlay
   */
  private destroyOverlay(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
    }

    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }

    // Quickly restore HTML form interaction and visibility
    const htmlForm = document.getElementById('login-form');
    if (htmlForm) {
      htmlForm.style.visibility = 'visible'; // Show immediately
      htmlForm.style.opacity = '1'; // Restore opacity
      htmlForm.style.zIndex = '1000'; // Restore normal z-index
      htmlForm.style.pointerEvents = 'auto'; // Re-enable interaction
      htmlForm.style.transition = ''; // Remove transition for instant restoration
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `loader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle window resize
   */
  handleResize(newWidth: number, newHeight: number): void {
    if (this.overlay) {
      this.overlay.clear();
      this.overlay.fillStyle(0x000000, 0.7);
      this.overlay.fillRect(0, 0, newWidth, newHeight);
    }

    if (this.container) {
      this.container.setPosition(newWidth / 2, newHeight / 2);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.hideAll();
    this.destroyOverlay();
    this.scene = undefined;
  }
}

export default LoadingManager;
