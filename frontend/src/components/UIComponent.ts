/**
 * Base UI Component Class
 * Provides common functionality for all UI components
 */

import { Scene } from 'phaser';
import { ResponsiveLayout } from '../utils/ResponsiveLayout';

export interface UIComponentConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  interactive?: boolean;
  alpha?: number;
}

export abstract class UIComponent {
  protected scene: Scene;
  protected container: Phaser.GameObjects.Container;
  protected config: UIComponentConfig;
  protected elements: Phaser.GameObjects.GameObject[] = [];
  protected isVisible: boolean = true;
  protected uiScale: number = 1;

  constructor(scene: Scene, config: UIComponentConfig = {}) {
    this.scene = scene;
    this.config = { visible: true, interactive: true, alpha: 1, ...config };
    this.container = scene.add.container(config.x || 0, config.y || 0);
    this.isVisible = config.visible ?? true;
    
    this.updateScale();
    this.create();
    this.setupInteractivity();
  }

  protected updateScale() {
    const { width, height } = this.scene.scale;
    this.uiScale = ResponsiveLayout.getUIScale(width, height);
  }

  protected abstract create(): void;

  protected setupInteractivity() {
    if (this.config.interactive) {
      // Only set interactive if container has content or explicit size
      if (this.container.list.length > 0) {
        // Container has content, safe to set interactive
        this.container.setInteractive();
      } else if (this.config.width && this.config.height) {
        // Container has explicit size, set it and make interactive
        this.container.setSize(this.config.width, this.config.height);
        this.container.setInteractive();
      }
      // Otherwise, skip interactivity setup - it will be called again after UI creation
    }
  }

  public show() {
    this.container.setVisible(true);
    this.isVisible = true;
  }

  public hide() {
    this.container.setVisible(false);
    this.isVisible = false;
  }

  public toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  public setAlpha(alpha: number) {
    this.container.setAlpha(alpha);
  }

  public destroy() {
    this.elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.container.destroy();
  }

  public resize(width: number, height: number) {
    this.updateScale();
    this.onResize(width, height);
  }

  protected abstract onResize(width: number, height: number): void;

  protected addElement(element: Phaser.GameObjects.GameObject) {
    this.elements.push(element);
    this.container.add(element);
  }

  protected createGothicPanel(x: number, y: number, width: number, height: number, alpha: number = 0.9) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0a0a0a, alpha);
    panel.fillRoundedRect(x, y, width, height, 8 * this.uiScale);
    panel.lineStyle(2 * this.uiScale, 0x8B0000);
    panel.strokeRoundedRect(x, y, width, height, 8 * this.uiScale);
    this.addElement(panel);
    return panel;
  }

  protected createGothicText(x: number, y: number, text: string, fontSize: number = 16, color: string = '#F5F5DC') {
    const { width, height } = this.scene.scale;
    const textElement = this.scene.add.text(x, y, text,
      ResponsiveLayout.getTextStyle(fontSize, width, height, {
        color: color,
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    );
    this.addElement(textElement);
    return textElement;
  }

  protected createResourceBar(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string, 
    fillPercent: number,
    withGlow: boolean = true
  ) {
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(x, y, width, height, height / 2);
    bg.lineStyle(1 * this.uiScale, 0x666666);
    bg.strokeRoundedRect(x, y, width, height, height / 2);
    this.addElement(bg);
    
    // Fill
    const fill = this.scene.add.graphics();
    const colorValue = Phaser.Display.Color.HexStringToColor(color).color;
    fill.fillStyle(colorValue);
    fill.fillRoundedRect(x + 2, y + 2, (width - 4) * fillPercent, height - 4, (height - 4) / 2);
    this.addElement(fill);

    // Glow effect
    if (withGlow) {
      const glow = this.scene.add.graphics();
      glow.fillStyle(colorValue, 0.3);
      glow.fillRoundedRect(x - 1, y - 1, width + 2, height + 2, (height + 2) / 2);
      this.container.addAt(glow, 0); // Add behind other elements
      this.elements.push(glow);
    }

    return { bg, fill };
  }

  protected createButton(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    text: string,
    onClick?: () => void,
    style: 'primary' | 'secondary' = 'primary'
  ) {
    const button = this.scene.add.graphics();
    const baseColor = style === 'primary' ? 0x8B0000 : 0x2F2F2F;
    const hoverColor = style === 'primary' ? 0xDC143C : 0x666666;
    
    // Draw button
    button.fillStyle(baseColor, 0.9);
    button.fillRoundedRect(x, y, width, height, 6 * this.uiScale);
    button.lineStyle(2 * this.uiScale, 0x8B0000);
    button.strokeRoundedRect(x, y, width, height, 6 * this.uiScale);
    this.addElement(button);

    // Button text
    const { width: screenWidth, height: screenHeight } = this.scene.scale;
    const buttonText = this.scene.add.text(x + width / 2, y + height / 2, text,
      ResponsiveLayout.getTextStyle(14, screenWidth, screenHeight, {
        color: '#F5F5DC',
        fontFamily: 'Cinzel, serif',
        fontWeight: '600'
      })
    ).setOrigin(0.5);
    this.addElement(buttonText);

    // Interactive area
    const hitArea = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0)
      .setInteractive();
    this.addElement(hitArea);

    // Hover effects
    hitArea.on('pointerover', () => {
      button.clear();
      button.fillStyle(hoverColor, 0.9);
      button.fillRoundedRect(x, y, width, height, 6 * this.uiScale);
      button.lineStyle(2 * this.uiScale, 0xFFD700);
      button.strokeRoundedRect(x, y, width, height, 6 * this.uiScale);
      buttonText.setColor('#FFD700');
    });

    hitArea.on('pointerout', () => {
      button.clear();
      button.fillStyle(baseColor, 0.9);
      button.fillRoundedRect(x, y, width, height, 6 * this.uiScale);
      button.lineStyle(2 * this.uiScale, 0x8B0000);
      button.strokeRoundedRect(x, y, width, height, 6 * this.uiScale);
      buttonText.setColor('#F5F5DC');
    });

    hitArea.on('pointerdown', () => {
      if (onClick) onClick();
    });

    return { button, text: buttonText, hitArea };
  }
}
