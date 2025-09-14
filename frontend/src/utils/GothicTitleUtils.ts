/**
 * Gothic Title Utilities - Enhanced dripping blood effects and gothic styling
 */

export class GothicTitleUtils {
  /**
   * Create enhanced gothic title with dripping blood effect
   */
  static createDrippingTitle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    mainText: string,
    subText: string = '',
    options: {
      mainSize?: number;
      subSize?: number;
      mainColor?: string;
      subColor?: string;
      spacing?: number;
      drippingEffect?: boolean;
      glowEffect?: boolean;
    } = {}
  ): { mainTitle: Phaser.GameObjects.Text, subTitle?: Phaser.GameObjects.Text, effects: Phaser.GameObjects.Graphics[] } {
    const {
      mainSize = 72,
      subSize = 48,
      mainColor = '#8B0000',
      subColor = '#FFD700',
      spacing = 60,
      drippingEffect = true,
      glowEffect = true
    } = options;

    const effects: Phaser.GameObjects.Graphics[] = [];

    // Create dripping blood effect graphics
    if (drippingEffect) {
      const drippingGraphics = scene.add.graphics();
      this.createDrippingEffect(drippingGraphics, x, y - 20, mainText.length * (mainSize * 0.6));
      effects.push(drippingGraphics);
    }

    // Create glow effect
    if (glowEffect) {
      const glowGraphics = scene.add.graphics();
      this.createGlowEffect(glowGraphics, x, y, mainText.length * (mainSize * 0.6), mainSize);
      effects.push(glowGraphics);
    }

    // Main title with enhanced shadow and stroke
    const mainTitle = scene.add.text(x, y, mainText, {
      fontSize: `${mainSize}px`,
      color: mainColor,
      fontFamily: 'Nosifer, serif',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: mainColor,
        blur: 15,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);

    // Add pulsing animation to main title
    scene.tweens.add({
      targets: mainTitle,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    let subTitle: Phaser.GameObjects.Text | undefined;
    if (subText) {
      // Subtitle with complementary styling
      subTitle = scene.add.text(x, y + spacing, subText, {
        fontSize: `${subSize}px`,
        color: subColor,
        fontFamily: 'Nosifer, serif',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: subColor,
          blur: 12,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);

      // Add subtle floating animation to subtitle
      scene.tweens.add({
        targets: subTitle,
        y: y + spacing - 5,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return { mainTitle, subTitle, effects };
  }

  /**
   * Create dripping blood effect
   */
  private static createDrippingEffect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number) {
    graphics.clear();
    
    // Create multiple drips along the text width
    const numDrips = Math.floor(width / 80) + 2;
    
    for (let i = 0; i < numDrips; i++) {
      const dripX = x - width / 2 + (i * width / (numDrips - 1)) + (Math.random() - 0.5) * 20;
      const dripLength = 20 + Math.random() * 30;
      
      // Create gradient drip effect
      graphics.fillGradientStyle(0x8B0000, 0x8B0000, 0x4a0000, 0x2d0000, 1, 1, 0.3, 0);
      
      // Main drip body
      graphics.fillRect(dripX - 2, y, 4, dripLength);
      
      // Drip tip (teardrop shape)
      graphics.fillCircle(dripX, y + dripLength, 3);
      
      // Add smaller secondary drips
      if (Math.random() > 0.5) {
        const secondaryLength = dripLength * 0.6;
        graphics.fillRect(dripX - 1, y + 10, 2, secondaryLength);
        graphics.fillCircle(dripX, y + 10 + secondaryLength, 2);
      }
    }
  }

  /**
   * Create glowing aura effect
   */
  private static createGlowEffect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number) {
    graphics.clear();
    
    // Create layered glow effect
    const glowLayers = 5;
    
    for (let i = glowLayers; i > 0; i--) {
      const glowSize = i * 8;
      const alpha = 0.1 / i;
      
      graphics.fillStyle(0x8B0000, alpha);
      graphics.fillRoundedRect(
        x - width / 2 - glowSize,
        y - height / 2 - glowSize,
        width + glowSize * 2,
        height + glowSize * 2,
        glowSize / 2
      );
    }
    
    // Add pulsing animation to glow
    graphics.scene.tweens.add({
      targets: graphics,
      alpha: 0.3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create decorative gothic separator
   */
  static createGothicSeparator(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    options: {
      color?: number;
      ornamentColor?: string;
      thickness?: number;
      ornaments?: boolean;
    } = {}
  ): Phaser.GameObjects.Graphics {
    const {
      color = 0x8B0000,
      ornamentColor = '#FFD700',
      thickness = 3,
      ornaments = true
    } = options;

    const graphics = scene.add.graphics();
    
    // Main separator line with gradient effect
    graphics.lineStyle(thickness, color, 1);
    graphics.lineBetween(x - width / 2, y, x + width / 2, y);
    
    // Add decorative elements
    if (ornaments) {
      // Left ornament
      scene.add.text(x - width / 2 - 25, y, '⚜', {
        fontSize: '20px',
        color: ornamentColor,
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      // Right ornament
      scene.add.text(x + width / 2 + 25, y, '⚜', {
        fontSize: '20px',
        color: ornamentColor,
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      // Center ornament
      scene.add.text(x, y, '☩', {
        fontSize: '24px',
        color: ornamentColor,
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    }

    return graphics;
  }

  /**
   * Create enhanced gothic button with special effects
   */
  static createEnhancedGothicButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    callback: () => void,
    options: {
      fontSize?: number;
      bgColor?: number;
      borderColor?: number;
      textColor?: string;
      hoverBgColor?: number;
      hoverBorderColor?: number;
      hoverTextColor?: string;
      glowEffect?: boolean;
      shadowEffect?: boolean;
    } = {}
  ): { background: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text, hitArea: Phaser.GameObjects.Rectangle } {
    const {
      fontSize = 16,
      bgColor = 0x2d1b1b,
      borderColor = 0x8B0000,
      textColor = '#F5F5DC',
      hoverBgColor = 0x4a0000,
      hoverBorderColor = 0xDC143C,
      hoverTextColor = '#FFD700',
      glowEffect = true,
      shadowEffect = true
    } = options;

    // Button background with enhanced styling
    const background = scene.add.graphics();
    
    const drawButton = (bg: number, border: number, glow: boolean = false) => {
      background.clear();
      
      // Add glow effect if enabled
      if (glow && glowEffect) {
        background.fillStyle(border, 0.2);
        background.fillRoundedRect(x - width/2 - 4, y - height/2 - 4, width + 8, height + 8, 8);
        background.fillStyle(border, 0.1);
        background.fillRoundedRect(x - width/2 - 8, y - height/2 - 8, width + 16, height + 16, 12);
      }
      
      // Main button background
      background.fillStyle(bg, 0.9);
      background.fillRoundedRect(x - width/2, y - height/2, width, height, 6);
      
      // Border with gradient effect
      background.lineStyle(3, border);
      background.strokeRoundedRect(x - width/2, y - height/2, width, height, 6);
      
      // Inner highlight
      background.lineStyle(1, border, 0.5);
      background.strokeRoundedRect(x - width/2 + 2, y - height/2 + 2, width - 4, height - 4, 4);
    };

    // Initial button state
    drawButton(bgColor, borderColor);

    // Button text with enhanced styling
    const buttonText = scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: textColor,
      fontFamily: 'Cinzel, serif',
      fontWeight: '600',
      stroke: '#000000',
      strokeThickness: shadowEffect ? 2 : 0,
      shadow: shadowEffect ? {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        stroke: false,
        fill: true
      } : undefined
    }).setOrigin(0.5);

    // Interactive hit area
    const hitArea = scene.add.rectangle(x, y, width, height, 0x000000, 0).setInteractive();

    // Hover effects - removed problematic scaling
    hitArea.on('pointerover', () => {
      drawButton(hoverBgColor, hoverBorderColor, true);
      buttonText.setColor(hoverTextColor);
      
      // Add subtle text scale animation only
      scene.tweens.add({
        targets: buttonText,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 150,
        ease: 'Power2'
      });
    });

    hitArea.on('pointerout', () => {
      drawButton(bgColor, borderColor);
      buttonText.setColor(textColor);
      
      // Reset text scale
      scene.tweens.add({
        targets: buttonText,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    hitArea.on('pointerdown', () => {
      // Press animation - only animate text to avoid positioning issues
      scene.tweens.add({
        targets: buttonText,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: callback
      });
    });

    return { background, text: buttonText, hitArea };
  }

  /**
   * Create gothic decorative frame for forms and panels
   */
  static createGothicFrame(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      bgColor?: number;
      borderColor?: number;
      ornamentColor?: string;
      cornerOrnaments?: boolean;
      sideOrnaments?: boolean;
      ornamentSize?: number;
    } = {}
  ): { frame: Phaser.GameObjects.Graphics, ornaments: Phaser.GameObjects.Text[] } {
    const {
      bgColor = 0x1a1a1a,
      borderColor = 0x8B0000,
      ornamentColor = '#FFD700',
      cornerOrnaments = true,
      sideOrnaments = true,
      ornamentSize = 16
    } = options;

    const ornaments: Phaser.GameObjects.Text[] = [];

    // Create enhanced frame graphics
    const frame = scene.add.graphics();
    
    // Background with subtle gradient effect
    frame.fillStyle(bgColor, 0.95);
    frame.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
    
    // Main border
    frame.lineStyle(3, borderColor);
    frame.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
    
    // Inner highlight border
    frame.lineStyle(1, 0xDC143C, 0.6);
    frame.strokeRoundedRect(x - width/2 + 2, y - height/2 + 2, width - 4, height - 4, 10);

    // Add corner ornaments
    if (cornerOrnaments) {
      const ornamentOffset = 20;
      
      // Top-left corner
      const topLeft = scene.add.text(
        x - width/2 + ornamentOffset, 
        y - height/2 + ornamentOffset, 
        '⚜', {
          fontSize: `${ornamentSize}px`,
          color: ornamentColor,
          stroke: '#000000',
          strokeThickness: 1
        }
      ).setOrigin(0.5);
      ornaments.push(topLeft);
      
      // Top-right corner
      const topRight = scene.add.text(
        x + width/2 - ornamentOffset, 
        y - height/2 + ornamentOffset, 
        '⚜', {
          fontSize: `${ornamentSize}px`,
          color: ornamentColor,
          stroke: '#000000',
          strokeThickness: 1
        }
      ).setOrigin(0.5);
      ornaments.push(topRight);
      
      // Bottom-left corner
      const bottomLeft = scene.add.text(
        x - width/2 + ornamentOffset, 
        y + height/2 - ornamentOffset, 
        '⚜', {
          fontSize: `${ornamentSize}px`,
          color: ornamentColor,
          stroke: '#000000',
          strokeThickness: 1
        }
      ).setOrigin(0.5);
      ornaments.push(bottomLeft);
      
      // Bottom-right corner
      const bottomRight = scene.add.text(
        x + width/2 - ornamentOffset, 
        y + height/2 - ornamentOffset, 
        '⚜', {
          fontSize: `${ornamentSize}px`,
          color: ornamentColor,
          stroke: '#000000',
          strokeThickness: 1
        }
      ).setOrigin(0.5);
      ornaments.push(bottomRight);
    }

    // Add side ornaments
    if (sideOrnaments) {
      // Left side
      const leftOrnament = scene.add.text(
        x - width/2 - 15, 
        y, 
        '☩', {
          fontSize: `${ornamentSize + 4}px`,
          color: ornamentColor,
          stroke: '#000000',
          strokeThickness: 1
        }
      ).setOrigin(0.5);
      ornaments.push(leftOrnament);
      
      // Right side
      const rightOrnament = scene.add.text(
        x + width/2 + 15, 
        y, 
        '☩', {
          fontSize: `${ornamentSize + 4}px`,
          color: ornamentColor,
          stroke: '#000000',
          strokeThickness: 1
        }
      ).setOrigin(0.5);
      ornaments.push(rightOrnament);
    }

    // Add subtle pulsing animation to ornaments
    ornaments.forEach((ornament, index) => {
      scene.tweens.add({
        targets: ornament,
        alpha: 0.7,
        duration: 2000 + (index * 200), // Stagger the animations
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    return { frame, ornaments };
  }

  /**
   * Create atmospheric particle effects
   */
  static createAtmosphericParticles(
    scene: Phaser.Scene,
    width: number,
    height: number,
    options: {
      colors?: number[];
      quantity?: number;
      speed?: { min: number, max: number };
      alpha?: { min: number, max: number };
      scale?: { min: number, max: number };
    } = {}
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    const {
      colors = [0x8B0000, 0x4B0082, 0x228B22],
      quantity = 3,
      speed = { min: 10, max: 30 },
      alpha = { min: 0.1, max: 0.4 },
      scale = { min: 0.3, max: 1.5 }
    } = options;

    try {
      // Create a simple 1x1 white pixel texture for particles
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xFFFFFF);
      graphics.fillRect(0, 0, 1, 1);
      graphics.generateTexture('gothic_particle', 1, 1);
      graphics.destroy();

      const particles = scene.add.particles(0, 0, 'gothic_particle', {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        scale: scale,
        alpha: alpha,
        tint: colors,
        speed: speed,
        lifespan: { min: 4000, max: 8000 },
        quantity: quantity,
        blendMode: 'ADD',
        frequency: 500
      });

      return particles;
    } catch (error) {
      console.warn('Could not create atmospheric particles:', error);
      return null;
    }
  }
}
