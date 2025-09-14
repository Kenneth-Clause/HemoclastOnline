/**
 * Production-ready notification system for HemoclastOnline
 */

import { ResponsiveLayout } from './ResponsiveLayout';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // 0 for persistent
  actions?: Array<{ text: string; callback: () => void; primary?: boolean }>;
  timestamp: number;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private scene?: Phaser.Scene;
  private notifications: Map<string, { notification: Notification; elements: Phaser.GameObjects.GameObject[] }> = new Map();
  private container?: Phaser.GameObjects.Container;
  private maxNotifications = 5;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize with a Phaser scene
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.createContainer();
  }

  /**
   * Create the notification container
   */
  private createContainer(): void {
    if (!this.scene) return;

    const { width, height } = this.scene.scale;
    
    // Create container positioned at top-right
    const position = ResponsiveLayout.getAnchoredPosition(
      'top-right',
      20,
      20,
      width,
      height
    );

    this.container = this.scene.add.container(position.x, position.y);
    this.container.setDepth(50000); // High depth but below loading overlay
  }

  /**
   * Show a notification
   */
  show(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    if (!this.scene || !this.container) return '';

    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? this.getDefaultDuration(notification.type)
    };

    // Remove oldest notification if at max capacity
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = Array.from(this.notifications.keys())[0];
      this.dismiss(oldestId);
    }

    const elements = this.createNotificationElements(fullNotification);
    this.notifications.set(id, { notification: fullNotification, elements });

    // Auto-dismiss if duration is set
    if (fullNotification.duration > 0) {
      this.scene.time.delayedCall(fullNotification.duration, () => {
        this.dismiss(id);
      });
    }

    this.updateLayout();
    return id;
  }

  /**
   * Show success notification
   */
  success(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'success', message, title, duration });
  }

  /**
   * Show error notification
   */
  error(message: string, title?: string, actions?: Notification['actions']): string {
    return this.show({ 
      type: 'error', 
      message, 
      title: title || 'Error',
      duration: 0, // Persistent by default
      actions 
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'warning', message, title, duration });
  }

  /**
   * Show info notification
   */
  info(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'info', message, title, duration });
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(id: string): void {
    const notificationData = this.notifications.get(id);
    if (!notificationData) return;

    // Animate out
    if (this.scene) {
      this.scene.tweens.add({
        targets: notificationData.elements,
        alpha: 0,
        x: '+=100',
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
          // Destroy elements
          notificationData.elements.forEach(element => {
            if (element && element.destroy) {
              element.destroy();
            }
          });
          this.notifications.delete(id);
          this.updateLayout();
        }
      });
    } else {
      // Fallback if no scene
      notificationData.elements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      this.notifications.delete(id);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    Array.from(this.notifications.keys()).forEach(id => this.dismiss(id));
  }

  /**
   * Create visual elements for a notification
   */
  private createNotificationElements(notification: Notification): Phaser.GameObjects.GameObject[] {
    if (!this.scene) return [];

    const elements: Phaser.GameObjects.GameObject[] = [];
    const { width, height } = this.scene.scale;
    const scale = ResponsiveLayout.getUIScale(width, height);

    // Notification dimensions
    const notificationWidth = 300 * scale;
    const notificationHeight = 80 * scale;
    const padding = 15 * scale;

    // Background
    const background = this.scene.add.graphics();
    const bgColor = this.getBackgroundColor(notification.type);
    const borderColor = this.getBorderColor(notification.type);

    background.fillStyle(bgColor, 0.95);
    background.fillRoundedRect(-notificationWidth, 0, notificationWidth, notificationHeight, 8 * scale);
    background.lineStyle(2 * scale, borderColor);
    background.strokeRoundedRect(-notificationWidth, 0, notificationWidth, notificationHeight, 8 * scale);
    
    elements.push(background);

    // Icon
    const icon = this.getIcon(notification.type);
    const iconText = this.scene.add.text(
      -notificationWidth + padding,
      padding,
      icon,
      ResponsiveLayout.getTextStyle(20, width, height, {
        color: this.getIconColor(notification.type)
      })
    );
    elements.push(iconText);

    // Title
    let textY = padding;
    if (notification.title) {
      const titleText = this.scene.add.text(
        -notificationWidth + padding + 30 * scale,
        textY,
        notification.title,
        ResponsiveLayout.getTextStyle(14, width, height, {
          color: '#F5F5DC',
          fontFamily: 'Cinzel, serif',
          fontWeight: '600'
        })
      );
      elements.push(titleText);
      textY += 20 * scale;
    }

    // Message
    const messageText = this.scene.add.text(
      -notificationWidth + padding + 30 * scale,
      textY,
      notification.message,
      ResponsiveLayout.getTextStyle(12, width, height, {
        color: '#C0C0C0',
        fontFamily: 'Cinzel, serif',
        wordWrap: { width: notificationWidth - 80 * scale }
      })
    );
    elements.push(messageText);

    // Close button
    const closeButton = this.scene.add.text(
      -padding,
      padding,
      '×',
      ResponsiveLayout.getTextStyle(18, width, height, {
        color: '#C0C0C0'
      })
    ).setOrigin(1, 0).setInteractive();

    closeButton.on('pointerover', () => {
      closeButton.setColor('#FFFFFF');
    });

    closeButton.on('pointerout', () => {
      closeButton.setColor('#C0C0C0');
    });

    closeButton.on('pointerdown', () => {
      this.dismiss(notification.id);
    });

    elements.push(closeButton);

    // Action buttons
    if (notification.actions && notification.actions.length > 0) {
      let buttonX = -notificationWidth + padding + 30 * scale;
      const buttonY = notificationHeight - 25 * scale;

      notification.actions.forEach((action, index) => {
        const buttonBg = this.scene!.add.graphics();
        const buttonColor = action.primary ? 0x8B0000 : 0x4A4A4A;
        
        buttonBg.fillStyle(buttonColor, 0.8);
        buttonBg.fillRoundedRect(buttonX, buttonY - 10, 60 * scale, 20 * scale, 4 * scale);
        buttonBg.lineStyle(1 * scale, action.primary ? 0xDC143C : 0x666666);
        buttonBg.strokeRoundedRect(buttonX, buttonY - 10, 60 * scale, 20 * scale, 4 * scale);
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(buttonX, buttonY - 10, 60 * scale, 20 * scale), Phaser.Geom.Rectangle.Contains);

        const buttonText = this.scene!.add.text(
          buttonX + 30 * scale,
          buttonY,
          action.text,
          ResponsiveLayout.getTextStyle(10, width, height, {
            color: '#F5F5DC',
            fontFamily: 'Cinzel, serif'
          })
        ).setOrigin(0.5);

        buttonBg.on('pointerover', () => {
          buttonBg.clear();
          buttonBg.fillStyle(action.primary ? 0xDC143C : 0x666666, 0.9);
          buttonBg.fillRoundedRect(buttonX, buttonY - 10, 60 * scale, 20 * scale, 4 * scale);
        });

        buttonBg.on('pointerout', () => {
          buttonBg.clear();
          buttonBg.fillStyle(buttonColor, 0.8);
          buttonBg.fillRoundedRect(buttonX, buttonY - 10, 60 * scale, 20 * scale, 4 * scale);
          buttonBg.lineStyle(1 * scale, action.primary ? 0xDC143C : 0x666666);
          buttonBg.strokeRoundedRect(buttonX, buttonY - 10, 60 * scale, 20 * scale, 4 * scale);
        });

        buttonBg.on('pointerdown', () => {
          action.callback();
          this.dismiss(notification.id);
        });

        elements.push(buttonBg, buttonText);
        buttonX += 70 * scale;
      });
    }

    // Add all elements to container
    this.container!.add(elements);

    // Animate in
    elements.forEach(element => {
      element.setAlpha(0);
      element.x += 100;
    });

    if (this.scene) {
      this.scene.tweens.add({
        targets: elements,
        alpha: 1,
        x: '-=100',
        duration: 300,
        ease: 'Power2.easeOut'
      });
    }

    return elements;
  }

  /**
   * Update notification layout
   */
  private updateLayout(): void {
    if (!this.container) return;

    const notifications = Array.from(this.notifications.values());
    let yOffset = 0;

    notifications.forEach(({ elements }) => {
      elements.forEach(element => {
        element.y = yOffset;
      });
      yOffset += 90; // Space between notifications
    });
  }

  /**
   * Get default duration based on notification type
   */
  private getDefaultDuration(type: Notification['type']): number {
    switch (type) {
      case 'success':
        return 3000;
      case 'info':
        return 4000;
      case 'warning':
        return 5000;
      case 'error':
        return 0; // Persistent
      default:
        return 4000;
    }
  }

  /**
   * Get background color for notification type
   */
  private getBackgroundColor(type: Notification['type']): number {
    switch (type) {
      case 'success':
        return 0x0D4F0D;
      case 'error':
        return 0x4A0000;
      case 'warning':
        return 0x4A3A00;
      case 'info':
        return 0x1A1A2E;
      default:
        return 0x2D2D2D;
    }
  }

  /**
   * Get border color for notification type
   */
  private getBorderColor(type: Notification['type']): number {
    switch (type) {
      case 'success':
        return 0x228B22;
      case 'error':
        return 0x8B0000;
      case 'warning':
        return 0xFFD700;
      case 'info':
        return 0x4B0082;
      default:
        return 0x666666;
    }
  }

  /**
   * Get icon for notification type
   */
  private getIcon(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  }

  /**
   * Get icon color for notification type
   */
  private getIconColor(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return '#228B22';
      case 'error':
        return '#DC143C';
      case 'warning':
        return '#FFD700';
      case 'info':
        return '#4B0082';
      default:
        return '#C0C0C0';
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle window resize
   */
  handleResize(newWidth: number, newHeight: number): void {
    if (!this.container) return;

    // Update container position
    const position = ResponsiveLayout.getAnchoredPosition(
      'top-right',
      20,
      20,
      newWidth,
      newHeight
    );

    this.container.setPosition(position.x, position.y);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.dismissAll();
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
    this.scene = undefined;
  }
}

export default NotificationManager;
