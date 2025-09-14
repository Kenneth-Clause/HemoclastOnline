/**
 * Input Manager for handling keyboard and mouse input for character movement
 */

import { Scene } from 'phaser';

export interface InputConfig {
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableTouch: boolean;
}

export class InputManager {
  private scene: Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
  private isEnabled: boolean = true;
  private config: InputConfig;
  
  // Movement state
  private movementState = {
    up: false,
    down: false,
    left: false,
    right: false
  };
  
  // Callbacks
  private onMoveStart: ((direction: string) => void) | null = null;
  private onMoveStop: (() => void) | null = null;
  private onMouseClick: ((worldX: number, worldY: number) => void) | null = null;
  private onToggleNameplate: (() => void) | null = null;

  constructor(scene: Scene, config: InputConfig = { enableKeyboard: true, enableMouse: true, enableTouch: true }) {
    this.scene = scene;
    this.config = config;
    
    this.setupKeyboardInput();
    this.setupMouseInput();
    this.setupTouchInput();
  }

  private setupKeyboardInput(): void {
    if (!this.config.enableKeyboard || !this.scene.input.keyboard) return;
    
    // Arrow keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // WASD keys
    this.wasdKeys = {
      W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      N: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N)
    };

    // Setup special key handlers
    this.setupSpecialKeys();
  }

  private setupMouseInput(): void {
    if (!this.config.enableMouse) return;
    
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isEnabled && this.onMouseClick) {
        // Convert screen coordinates to world coordinates
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        this.onMouseClick(worldX, worldY);
      }
    });
  }

  private setupTouchInput(): void {
    if (!this.config.enableTouch) return;
    
    // Touch input is handled through the same pointer events as mouse
    // Additional touch-specific gestures could be added here
  }

  private setupSpecialKeys(): void {
    if (!this.wasdKeys.N) return;
    
    // Handle N key press for nameplate toggle
    this.wasdKeys.N.on('down', () => {
      if (this.isEnabled && this.onToggleNameplate) {
        this.onToggleNameplate();
      }
    });
  }

  public update(): void {
    if (!this.isEnabled) return;
    
    this.updateKeyboardInput();
  }

  private updateKeyboardInput(): void {
    if (!this.cursors && Object.keys(this.wasdKeys).length === 0) return;
    
    // Check movement keys
    const newMovementState = {
      up: (this.cursors?.up.isDown || this.wasdKeys.W?.isDown) || false,
      down: (this.cursors?.down.isDown || this.wasdKeys.S?.isDown) || false,
      left: (this.cursors?.left.isDown || this.wasdKeys.A?.isDown) || false,
      right: (this.cursors?.right.isDown || this.wasdKeys.D?.isDown) || false
    };
    
    // Determine movement direction
    const direction = this.getMovementDirection(newMovementState);
    const wasMoving = this.isMoving();
    const isMoving = direction !== null;
    const previousDirection = this.getMovementDirection(this.movementState);
    
    // Update movement state first
    this.movementState = newMovementState;
    
    // Handle movement changes with better state management
    if (!wasMoving && isMoving && direction) {
      // Started moving
      if (this.onMoveStart) {
        this.onMoveStart(direction);
      }
    } else if (wasMoving && !isMoving) {
      // Stopped moving
      if (this.onMoveStop) {
        this.onMoveStop();
      }
    } else if (isMoving && direction && direction !== previousDirection) {
      // Direction changed while moving - update immediately
      if (this.onMoveStart) {
        this.onMoveStart(direction);
      }
    }
  }

  private getMovementDirection(state: typeof this.movementState): string | null {
    // 8-directional movement
    if (state.up && state.left) return 'up-left';
    if (state.up && state.right) return 'up-right';
    if (state.down && state.left) return 'down-left';
    if (state.down && state.right) return 'down-right';
    if (state.up) return 'up';
    if (state.down) return 'down';
    if (state.left) return 'left';
    if (state.right) return 'right';
    
    return null;
  }

  private isMoving(): boolean {
    return this.movementState.up || this.movementState.down || 
           this.movementState.left || this.movementState.right;
  }

  // Event handlers
  public onMovementStart(callback: (direction: string) => void): void {
    this.onMoveStart = callback;
  }

  public onMovementStop(callback: () => void): void {
    this.onMoveStop = callback;
  }

  public onMouseClickEvent(callback: (worldX: number, worldY: number) => void): void {
    this.onMouseClick = callback;
  }

  public onNameplateToggle(callback: () => void): void {
    this.onToggleNameplate = callback;
  }

  // Control methods
  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
    // Stop any current movement
    if (this.isMoving() && this.onMoveStop) {
      this.onMoveStop();
    }
    this.movementState = { up: false, down: false, left: false, right: false };
  }

  public isInputEnabled(): boolean {
    return this.isEnabled;
  }

  // Utility methods
  public getCurrentDirection(): string | null {
    return this.getMovementDirection(this.movementState);
  }

  public isKeyDown(key: string): boolean {
    switch (key.toLowerCase()) {
      case 'up':
      case 'w':
        return this.movementState.up;
      case 'down':
      case 's':
        return this.movementState.down;
      case 'left':
      case 'a':
        return this.movementState.left;
      case 'right':
      case 'd':
        return this.movementState.right;
      default:
        return false;
    }
  }

  public destroy(): void {
    // Clean up event listeners
    this.scene.input.off('pointerdown');
    
    // Clear callbacks
    this.onMoveStart = null;
    this.onMoveStop = null;
    this.onMouseClick = null;
    this.onToggleNameplate = null;
  }
}
