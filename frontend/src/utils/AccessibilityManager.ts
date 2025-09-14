/**
 * Production-ready accessibility management for HemoclastOnline
 */

export interface AccessibilityOptions {
  enableScreenReader?: boolean;
  enableKeyboardNavigation?: boolean;
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private scene?: Phaser.Scene;
  private options: AccessibilityOptions = {
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    enableHighContrast: false,
    enableReducedMotion: false,
    fontSize: 'medium'
  };
  private focusedElement?: Phaser.GameObjects.GameObject;
  private focusableElements: Phaser.GameObjects.GameObject[] = [];
  private currentFocusIndex = 0;

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize accessibility manager
   */
  initialize(scene: Phaser.Scene, options?: Partial<AccessibilityOptions>): void {
    this.scene = scene;
    this.options = { ...this.options, ...options };
    
    this.setupKeyboardNavigation();
    this.loadUserPreferences();
    this.detectSystemPreferences();
    this.createARIAStructure();
  }

  /**
   * Register a focusable element
   */
  registerFocusable(element: Phaser.GameObjects.GameObject, options: {
    role?: string;
    label?: string;
    description?: string;
    onActivate?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
  } = {}): void {
    this.focusableElements.push(element);
    
    // Store accessibility data on the element
    (element as any).accessibilityData = {
      role: options.role || 'button',
      label: options.label || 'Interactive element',
      description: options.description,
      onActivate: options.onActivate,
      onFocus: options.onFocus,
      onBlur: options.onBlur,
      tabIndex: this.focusableElements.length - 1
    };

    // Make element interactive if not already
    if (!element.input) {
      element.setInteractive();
    }

    // Add keyboard activation
    element.on('pointerdown', () => {
      this.setFocus(element);
      if (options.onActivate) {
        options.onActivate();
      }
    });
  }

  /**
   * Set focus to a specific element
   */
  setFocus(element: Phaser.GameObjects.GameObject): void {
    // Blur current focus
    if (this.focusedElement) {
      this.blurElement(this.focusedElement);
    }

    this.focusedElement = element;
    this.currentFocusIndex = this.focusableElements.indexOf(element);
    
    this.focusElement(element);
    this.announceToScreenReader(element);
  }

  /**
   * Move focus to next element
   */
  focusNext(): void {
    if (this.focusableElements.length === 0) return;
    
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    const nextElement = this.focusableElements[this.currentFocusIndex];
    this.setFocus(nextElement);
  }

  /**
   * Move focus to previous element
   */
  focusPrevious(): void {
    if (this.focusableElements.length === 0) return;
    
    this.currentFocusIndex = this.currentFocusIndex === 0 
      ? this.focusableElements.length - 1 
      : this.currentFocusIndex - 1;
    const prevElement = this.focusableElements[this.currentFocusIndex];
    this.setFocus(prevElement);
  }

  /**
   * Activate currently focused element
   */
  activateFocused(): void {
    if (!this.focusedElement) return;
    
    const accessibilityData = (this.focusedElement as any).accessibilityData;
    if (accessibilityData?.onActivate) {
      accessibilityData.onActivate();
    }
  }

  /**
   * Clear all focusable elements (call when scene changes)
   */
  clearFocusableElements(): void {
    if (this.focusedElement) {
      this.blurElement(this.focusedElement);
    }
    
    this.focusableElements = [];
    this.focusedElement = undefined;
    this.currentFocusIndex = 0;
  }

  /**
   * Announce message to screen reader
   */
  announceToScreenReader(element: Phaser.GameObjects.GameObject | string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.options.enableScreenReader) return;

    let message: string;
    
    if (typeof element === 'string') {
      message = element;
    } else {
      const accessibilityData = (element as any).accessibilityData;
      message = accessibilityData?.label || 'Interactive element';
      
      if (accessibilityData?.description) {
        message += `. ${accessibilityData.description}`;
      }
    }

    // Create or update ARIA live region
    let liveRegion = document.getElementById('phaser-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'phaser-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;
  }

  /**
   * Update accessibility options
   */
  updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.saveUserPreferences();
    this.applyOptions();
  }

  /**
   * Get current accessibility options
   */
  getOptions(): AccessibilityOptions {
    return { ...this.options };
  }

  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastMode(): boolean {
    return this.options.enableHighContrast || 
           window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion(): boolean {
    return this.options.enableReducedMotion || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get font size multiplier based on accessibility settings
   */
  getFontSizeMultiplier(): number {
    switch (this.options.fontSize) {
      case 'small': return 0.85;
      case 'medium': return 1.0;
      case 'large': return 1.15;
      case 'extra-large': return 1.3;
      default: return 1.0;
    }
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.scene || !this.options.enableKeyboardNavigation) return;

    // Tab navigation
    this.scene.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.shiftKey) {
        this.focusPrevious();
      } else {
        this.focusNext();
      }
    });

    // Enter/Space activation
    this.scene.input.keyboard?.on('keydown-ENTER', () => {
      this.activateFocused();
    });

    this.scene.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      this.activateFocused();
    });

    // Arrow key navigation
    this.scene.input.keyboard?.on('keydown-UP', () => {
      this.focusPrevious();
    });

    this.scene.input.keyboard?.on('keydown-DOWN', () => {
      this.focusNext();
    });

    // Escape to clear focus
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      if (this.focusedElement) {
        this.blurElement(this.focusedElement);
        this.focusedElement = undefined;
      }
    });
  }

  /**
   * Focus visual styling for an element
   */
  private focusElement(element: Phaser.GameObjects.GameObject): void {
    // Add visual focus indicator
    const focusGraphics = this.scene!.add.graphics();
    focusGraphics.lineStyle(3, 0xFFD700, 1);
    
    if (element instanceof Phaser.GameObjects.Rectangle) {
      const bounds = element.getBounds();
      focusGraphics.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
    } else if (element instanceof Phaser.GameObjects.Text) {
      const bounds = element.getBounds();
      focusGraphics.strokeRoundedRect(bounds.x - 4, bounds.y - 2, bounds.width + 8, bounds.height + 4, 4);
    } else {
      // Generic circular focus for other elements
      const bounds = element.getBounds();
      const radius = Math.max(bounds.width, bounds.height) / 2 + 5;
      focusGraphics.strokeCircle(bounds.centerX, bounds.centerY, radius);
    }

    // Store focus graphics on element for cleanup
    (element as any).focusGraphics = focusGraphics;

    // Call onFocus callback
    const accessibilityData = (element as any).accessibilityData;
    if (accessibilityData?.onFocus) {
      accessibilityData.onFocus();
    }
  }

  /**
   * Remove focus styling from an element
   */
  private blurElement(element: Phaser.GameObjects.GameObject): void {
    // Remove focus graphics
    const focusGraphics = (element as any).focusGraphics;
    if (focusGraphics) {
      focusGraphics.destroy();
      delete (element as any).focusGraphics;
    }

    // Call onBlur callback
    const accessibilityData = (element as any).accessibilityData;
    if (accessibilityData?.onBlur) {
      accessibilityData.onBlur();
    }
  }

  /**
   * Create ARIA structure for screen readers
   */
  private createARIAStructure(): void {
    if (!this.options.enableScreenReader) return;

    // Create main game region
    let gameRegion = document.getElementById('phaser-game-region');
    if (!gameRegion) {
      gameRegion = document.createElement('div');
      gameRegion.id = 'phaser-game-region';
      gameRegion.setAttribute('role', 'application');
      gameRegion.setAttribute('aria-label', 'HemoclastOnline Game');
      gameRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(gameRegion);
    }

    // Update game region with current scene info
    if (this.scene) {
      gameRegion.setAttribute('aria-label', `HemoclastOnline - ${this.scene.scene.key}`);
    }
  }

  /**
   * Load user accessibility preferences
   */
  private loadUserPreferences(): void {
    const saved = localStorage.getItem('hemoclast_accessibility');
    if (saved) {
      try {
        const savedOptions = JSON.parse(saved);
        this.options = { ...this.options, ...savedOptions };
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error);
      }
    }
  }

  /**
   * Save user accessibility preferences
   */
  private saveUserPreferences(): void {
    try {
      localStorage.setItem('hemoclast_accessibility', JSON.stringify(this.options));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  /**
   * Detect system accessibility preferences
   */
  private detectSystemPreferences(): void {
    // High contrast
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.options.enableHighContrast = true;
    }

    // Reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.options.enableReducedMotion = true;
    }

    // Font size (if available)
    const fontSize = window.getComputedStyle(document.documentElement).fontSize;
    const baseFontSize = parseFloat(fontSize);
    if (baseFontSize > 16) {
      this.options.fontSize = baseFontSize > 20 ? 'extra-large' : 'large';
    }
  }

  /**
   * Apply accessibility options to the game
   */
  private applyOptions(): void {
    // Apply high contrast if needed
    if (this.isHighContrastMode()) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (this.prefersReducedMotion()) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }

    // Update font size
    const multiplier = this.getFontSizeMultiplier();
    document.documentElement.style.setProperty('--font-size-multiplier', multiplier.toString());
  }

  /**
   * Clean up accessibility resources
   */
  destroy(): void {
    this.clearFocusableElements();
    
    // Remove ARIA regions
    const liveRegion = document.getElementById('phaser-live-region');
    if (liveRegion) {
      liveRegion.remove();
    }
    
    const gameRegion = document.getElementById('phaser-game-region');
    if (gameRegion) {
      gameRegion.remove();
    }
    
    this.scene = undefined;
  }
}

export default AccessibilityManager;
