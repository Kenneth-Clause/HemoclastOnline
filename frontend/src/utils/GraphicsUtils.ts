/**
 * Graphics utilities for high-resolution displays and RuneScape-style visuals
 */

export class GraphicsUtils {
  /**
   * Calculate responsive font size based on screen resolution
   */
  static getResponsiveFontSize(baseSize: number, width: number, height: number): number {
    const scale = Math.min(width / 1920, height / 1080);
    return Math.max(baseSize * 0.7, baseSize * scale);
  }

  /**
   * Get pixel-perfect positioning for crisp graphics
   */
  static pixelPerfect(value: number): number {
    return Math.round(value);
  }

  /**
   * Create high-resolution texture for UI elements
   */
  static createHiResTexture(scene: Phaser.Scene, key: string, width: number, height: number, color: number): void {
    const graphics = scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * Apply RuneScape-style text styling
   */
  static getRuneScapeTextStyle(fontSize: number, color: string = '#FFFFFF'): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontSize: `${fontSize}px`,
      color: color,
      fontFamily: 'Cinzel, serif',
      stroke: '#000000',
      strokeThickness: Math.max(1, fontSize / 16),
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 0,
        stroke: false,
        fill: true
      }
    };
  }

  /**
   * Create crisp UI panel with proper scaling
   */
  static createUIPanel(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    backgroundColor: number = 0x2d1b1b,
    borderColor: number = 0x8B0000,
    borderWidth: number = 2
  ): Phaser.GameObjects.Graphics {
    const panel = scene.add.graphics();
    
    // Background
    panel.fillStyle(backgroundColor, 0.9);
    panel.fillRoundedRect(x, y, width, height, 8);
    
    // Border
    panel.lineStyle(borderWidth, borderColor);
    panel.strokeRoundedRect(x, y, width, height, 8);
    
    return panel;
  }

  /**
   * Create animated resource bar with proper scaling
   */
  static createResourceBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
    fillPercent: number,
    text: string,
    fontSize: number
  ): { background: Phaser.GameObjects.Graphics, fill: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text } {
    // Background
    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRoundedRect(x, y, width, height, height / 2);
    background.lineStyle(1, 0x666666);
    background.strokeRoundedRect(x, y, width, height, height / 2);
    
    // Fill
    const fill = scene.add.graphics();
    fill.fillStyle(fillColor);
    fill.fillRoundedRect(x + 2, y + 2, (width - 4) * fillPercent, height - 4, (height - 4) / 2);
    
    // Text
    const textObj = scene.add.text(x + width / 2, y + height / 2, text, {
      fontSize: `${fontSize}px`,
      color: '#FFFFFF',
      fontFamily: 'Cinzel, serif',
      fontWeight: '500'
    }).setOrigin(0.5);
    
    return { background, fill, text: textObj };
  }

  /**
   * Get device pixel ratio for high-DPI displays
   */
  static getPixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  /**
   * Calculate optimal UI scale for different screen sizes
   */
  static getUIScale(width: number, height: number): number {
    // Base resolution: 1920x1080
    const baseWidth = 1920;
    const baseHeight = 1080;
    
    const scaleX = width / baseWidth;
    const scaleY = height / baseHeight;
    
    // Use the smaller scale to ensure UI fits on screen
    return Math.min(scaleX, scaleY);
  }

  /**
   * Create RuneScape-style button with proper scaling
   */
  static createRuneScapeButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    fontSize: number,
    callback: () => void
  ): { background: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text } {
    // Button background with gradient effect
    const background = scene.add.graphics();
    background.fillGradientStyle(0x4a3728, 0x4a3728, 0x2d1f17, 0x2d1f17);
    background.fillRoundedRect(x - width/2, y - height/2, width, height, 4);
    background.lineStyle(2, 0x8B0000);
    background.strokeRoundedRect(x - width/2, y - height/2, width, height, 4);
    
    // Button text
    const textObj = scene.add.text(x, y, text, GraphicsUtils.getRuneScapeTextStyle(fontSize, '#F5F5DC'))
      .setOrigin(0.5);
    
    // Make interactive
    const hitArea = scene.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive();
    
    hitArea.on('pointerover', () => {
      // Add null checks to prevent errors
      if (background && background.active) {
        background.clear();
        background.fillGradientStyle(0x6a4a38, 0x6a4a38, 0x4d2f27, 0x4d2f27);
        background.fillRoundedRect(x - width/2, y - height/2, width, height, 4);
        background.lineStyle(2, 0xDC143C);
        background.strokeRoundedRect(x - width/2, y - height/2, width, height, 4);
      }
      if (textObj && textObj.active) {
        textObj.setColor('#FFD700');
      }
    });
    
    hitArea.on('pointerout', () => {
      // Add null checks to prevent errors
      if (background && background.active) {
        background.clear();
        background.fillGradientStyle(0x4a3728, 0x4a3728, 0x2d1f17, 0x2d1f17);
        background.fillRoundedRect(x - width/2, y - height/2, width, height, 4);
        background.lineStyle(2, 0x8B0000);
        background.strokeRoundedRect(x - width/2, y - height/2, width, height, 4);
      }
      if (textObj && textObj.active) {
        textObj.setColor('#F5F5DC');
      }
    });
    
    hitArea.on('pointerdown', callback);
    
    return { background, text: textObj };
  }
}
