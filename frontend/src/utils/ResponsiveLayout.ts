/**
 * Responsive Layout System for HemoclastOnline
 * Provides viewport-relative UI positioning that adapts to any screen size
 */

export class ResponsiveLayout {
  private static baseWidth = 1920;
  private static baseHeight = 1080;
  private static minWidth = 1024;
  private static minHeight = 768;
  
  /**
   * Get the current UI scale factor based on screen size
   */
  static getUIScale(currentWidth: number, currentHeight: number): number {
    // Calculate scale based on actual screen dimensions (no artificial minimums)
    const scaleX = currentWidth / this.baseWidth;
    const scaleY = currentHeight / this.baseHeight;
    
    // Use minimum scale to ensure everything fits, with reasonable bounds
    const scale = Math.min(scaleX, scaleY);
    return Math.max(0.2, Math.min(1.5, scale)); // Allow scaling down to 20% for very small screens
  }
  
  /**
   * Get viewport-relative position that adapts to screen size
   */
  static getViewportPosition(x: number, y: number, currentWidth: number, currentHeight: number): { x: number, y: number } {
    // Convert from base coordinates to viewport-relative coordinates
    const relativeX = x / this.baseWidth;
    const relativeY = y / this.baseHeight;
    
    return {
      x: relativeX * currentWidth,
      y: relativeY * currentHeight
    };
  }

  /**
   * Get anchored position for UI elements (supports different anchor points)
   */
  static getAnchoredPosition(
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'top-center' | 'bottom-center',
    offsetX: number,
    offsetY: number,
    currentWidth: number,
    currentHeight: number
  ): { x: number, y: number } {
    const scale = this.getUIScale(currentWidth, currentHeight);
    const scaledOffsetX = offsetX * scale;
    const scaledOffsetY = offsetY * scale;

    switch (anchor) {
      case 'top-left':
        return { x: scaledOffsetX, y: scaledOffsetY };
      case 'top-right':
        return { x: currentWidth - scaledOffsetX, y: scaledOffsetY };
      case 'bottom-left':
        return { x: scaledOffsetX, y: currentHeight - scaledOffsetY };
      case 'bottom-right':
        return { x: currentWidth - scaledOffsetX, y: currentHeight - scaledOffsetY };
      case 'center':
        return { x: currentWidth / 2 + scaledOffsetX, y: currentHeight / 2 + scaledOffsetY };
      case 'top-center':
        return { x: currentWidth / 2 + scaledOffsetX, y: scaledOffsetY };
      case 'bottom-center':
        return { x: currentWidth / 2 + scaledOffsetX, y: currentHeight - scaledOffsetY };
      default:
        return { x: scaledOffsetX, y: scaledOffsetY };
    }
  }
  
  /**
   * Get scaled font size that maintains readability
   */
  static getScaledFontSize(baseFontSize: number, currentWidth: number, currentHeight: number): number {
    const scale = this.getUIScale(currentWidth, currentHeight);
    return Math.max(12, baseFontSize * scale); // Minimum 12px for readability
  }
  
  /**
   * Get scaled dimensions for UI elements
   */
  static getScaledDimensions(baseWidth: number, baseHeight: number, currentWidth: number, currentHeight: number): { width: number, height: number } {
    const scale = this.getUIScale(currentWidth, currentHeight);
    
    return {
      width: baseWidth * scale,
      height: baseHeight * scale
    };
  }
  
  /**
   * Responsive layout definitions using anchor-based positioning
   */
  static readonly LAYOUT = {
    // Top panel - anchored to top, full width with margins
    TOP_PANEL: {
      anchor: 'top-left' as const,
      offsetX: 10,
      offsetY: 10,
      widthPercent: 0.99, // 99% of screen width
      height: 100
    },
    
    // Bottom panel - anchored to bottom, full width with margins
    BOTTOM_PANEL: {
      anchor: 'bottom-left' as const,
      offsetX: 10,
      offsetY: 110, // 100px height + 10px margin
      widthPercent: 0.99,
      height: 100
    },
    
    // Left panel - anchored to left side
    LEFT_PANEL: {
      anchor: 'top-left' as const,
      offsetX: 10,
      offsetY: 120,
      width: 300,
      heightPercent: 0.75 // 75% of available height
    },
    
    // Right panel - anchored to right side
    RIGHT_PANEL: {
      anchor: 'top-right' as const,
      offsetX: 310, // 300px width + 10px margin
      offsetY: 120,
      width: 300,
      heightPercent: 0.75
    },
    
    // Chat panel - anchored to bottom-left
    CHAT_PANEL: {
      anchor: 'bottom-left' as const,
      offsetX: 10,
      offsetY: 250, // Above bottom panel
      width: 400,
      height: 210
    },
    
    // Minimap - anchored to top-right
    MINIMAP: {
      anchor: 'top-right' as const,
      offsetX: 200, // 180px width + 20px margin
      offsetY: 200,
      width: 180,
      height: 180
    },
    
    // Action bar - centered at bottom
    ACTION_BAR: {
      anchor: 'bottom-center' as const,
      offsetX: 0,
      offsetY: 90, // Above bottom panel
      slotSize: 60,
      slotSpacing: 10,
      totalSlots: 6
    },
    
    // Resource bars - top-left area
    RESOURCE_BARS: {
      anchor: 'top-left' as const,
      offsetX: 300,
      offsetY: 30,
      width: 250,
      height: 18,
      spacing: 22
    },
    
    // Currency display - top-right
    CURRENCY: {
      anchor: 'top-right' as const,
      offsetX: 200,
      offsetY: 30
    },
    
    // Menu buttons - very close to title, increased button spacing
    MENU_BUTTONS: {
      anchor: 'center' as const,
      offsetX: 0,
      offsetY: 0,
      width: 300,
      height: 60,
      spacing: 75
    },
    
    // Title positions - center top
    TITLE: {
      line1: { anchor: 'top-center' as const, offsetX: 0, offsetY: 200 },
      line2: { anchor: 'top-center' as const, offsetX: 0, offsetY: 280 },
      subtitle: { anchor: 'top-center' as const, offsetX: 0, offsetY: 350 }
    }
  };
  
  /**
   * Get responsive layout position and dimensions for current screen
   */
  static getResponsiveLayout(layoutKey: string, currentWidth: number, currentHeight: number): any {
    const layout = (this.LAYOUT as any)[layoutKey];
    if (!layout) return null;
    
    const scale = this.getUIScale(currentWidth, currentHeight);
    
    // Handle different layout types
    if (layout.anchor) {
      // Single layout with anchor
      return this.processLayoutItem(layout, currentWidth, currentHeight, scale);
    } else {
      // Complex layout with multiple items (like TITLE)
      const processedLayout: any = {};
      for (const [key, value] of Object.entries(layout)) {
        if (typeof value === 'object' && value !== null && (value as any).anchor) {
          processedLayout[key] = this.processLayoutItem(value, currentWidth, currentHeight, scale);
        } else {
          processedLayout[key] = value;
        }
      }
      return processedLayout;
    }
  }

  private static processLayoutItem(item: any, currentWidth: number, currentHeight: number, scale: number): any {
    const position = this.getAnchoredPosition(
      item.anchor,
      item.offsetX,
      item.offsetY,
      currentWidth,
      currentHeight
    );

    const result: any = {
      x: position.x,
      y: position.y,
      ...item
    };

    // Handle percentage-based dimensions
    if (item.widthPercent) {
      result.width = currentWidth * item.widthPercent;
    } else if (item.width) {
      result.width = item.width * scale;
    }

    if (item.heightPercent) {
      result.height = currentHeight * item.heightPercent;
    } else if (item.height) {
      result.height = item.height * scale;
    }

    // Scale other numeric properties
    ['slotSize', 'slotSpacing', 'spacing'].forEach(prop => {
      if (item[prop] && typeof item[prop] === 'number') {
        result[prop] = item[prop] * scale;
      }
    });

    return result;
  }

  /**
   * Legacy method for backward compatibility - use getResponsiveLayout instead
   */
  static getLayoutPosition(layoutKey: string, currentWidth: number, currentHeight: number): any {
    return this.getResponsiveLayout(layoutKey, currentWidth, currentHeight);
  }
  
  /**
   * Create responsive text style
   */
  static getTextStyle(baseFontSize: number, currentWidth: number, currentHeight: number, options: any = {}): any {
    const fontSize = this.getScaledFontSize(baseFontSize, currentWidth, currentHeight);
    
    return {
      fontSize: `${fontSize}px`,
      fontFamily: options.fontFamily || 'Cinzel, serif',
      color: options.color || '#F5F5DC',
      fontWeight: options.fontWeight || '400',
      stroke: options.stroke || '#000000',
      strokeThickness: options.strokeThickness || Math.max(1, fontSize / 24),
      ...options
    };
  }
  
  /**
   * Check if screen is mobile-sized
   */
  static isMobile(width: number, height: number): boolean {
    return width < 768 || height < 600;
  }
  
  /**
   * Get mobile-specific adjustments
   */
  static getMobileAdjustments(width: number, height: number): any {
    if (!this.isMobile(width, height)) return {};
    
    const isPortrait = height > width;
    const isLandscape = width > height;
    
    return {
      fontSizeMultiplier: isPortrait ? 1.3 : 1.1, // Larger text in portrait mode
      buttonSizeMultiplier: isPortrait ? 1.4 : 1.2, // Larger buttons for touch
      spacingMultiplier: isPortrait ? 1.6 : 1.3, // More spacing between elements
      minTouchTarget: 44, // Minimum touch target size (iOS guidelines)
      isPortrait,
      isLandscape,
      // Adjust layouts for mobile
      layoutAdjustments: {
        // Stack elements vertically on mobile portrait
        stackVertical: isPortrait,
        // Reduce panel sizes on mobile
        panelSizeMultiplier: isPortrait ? 0.9 : 0.95,
        // Increase margins on mobile
        marginMultiplier: isPortrait ? 1.5 : 1.2
      }
    };
  }

  /**
   * Get touch-friendly button dimensions
   */
  static getTouchFriendlyButton(baseWidth: number, baseHeight: number, currentWidth: number, currentHeight: number): { width: number, height: number } {
    const scale = this.getUIScale(currentWidth, currentHeight);
    const mobileAdjustments = this.getMobileAdjustments(currentWidth, currentHeight);
    
    const adjustedWidth = baseWidth * scale * (mobileAdjustments.buttonSizeMultiplier || 1);
    const adjustedHeight = Math.max(
      baseHeight * scale * (mobileAdjustments.buttonSizeMultiplier || 1),
      mobileAdjustments.minTouchTarget || 44
    );
    
    return {
      width: adjustedWidth,
      height: adjustedHeight
    };
  }

  /**
   * Check if device supports hover (not touch-only)
   */
  static supportsHover(): boolean {
    return window.matchMedia('(hover: hover)').matches;
  }

  /**
   * Get safe area insets for mobile devices (handles notches, etc.)
   */
  static getSafeAreaInsets(): { top: number, bottom: number, left: number, right: number } {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0')
    };
  }
}
