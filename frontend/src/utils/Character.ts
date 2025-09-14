/**
 * Character class for RuneScape-like character with omnidirectional movement
 */

import { Scene } from 'phaser';

export interface CharacterConfig {
  x: number;
  y: number;
  texture?: string;
  tileSize: number;
  speed: number;
  name?: string;
  showName?: boolean;
}

export interface Direction {
  x: number;
  y: number;
  key: string;
}

export class Character extends Phaser.GameObjects.Container {
  private scene: Scene;
  private sprite: Phaser.GameObjects.Rectangle;
  private nameplate: Phaser.GameObjects.Text | null = null;
  private nameplateBackground: Phaser.GameObjects.Rectangle | null = null;
  private tileSize: number;
  private speed: number;
  private isMoving: boolean = false;
  private currentDirection: Direction = { x: 0, y: 0, key: 'idle' };
  private characterName: string;
  private showName: boolean;
  
  // Pathfinding properties
  private _isFollowingPath: boolean = false;
  private currentPath: { x: number; y: number }[] = [];
  private currentPathIndex: number = 0;
  private pathMoveSpeed: number;
  
  // Tween-based movement tracking
  private _isUsingTweenMovement: boolean = false;
  
  // Movement directions (8-directional)
  private directions: { [key: string]: Direction } = {
    'up': { x: 0, y: -1, key: 'up' },
    'down': { x: 0, y: 1, key: 'down' },
    'left': { x: -1, y: 0, key: 'left' },
    'right': { x: 1, y: 0, key: 'right' },
    'up-left': { x: -1, y: -1, key: 'up-left' },
    'up-right': { x: 1, y: -1, key: 'up-right' },
    'down-left': { x: -1, y: 1, key: 'down-left' },
    'down-right': { x: 1, y: 1, key: 'down-right' }
  };

  constructor(scene: Scene, config: CharacterConfig) {
    super(scene, config.x, config.y);
    
    this.scene = scene;
    this.tileSize = config.tileSize;
    this.speed = config.speed;
    this.pathMoveSpeed = config.speed * 0.7; // Slower for click-to-move
    this.characterName = config.name || 'Player';
    this.showName = config.showName !== false; // Default to true
    
    this.createCharacterSprite();
    this.createNameplate();
    this.setupAnimations();
    
    // Add to scene
    scene.add.existing(this);
    
    // Enable physics if available
    if (scene.physics && scene.physics.world) {
      scene.physics.world.enable(this);
    }
  }

  private createCharacterSprite(): void {
    // Create a simple RuneScape-like character representation
    // For now, using colored rectangles - in production you'd use sprite sheets
    
    // Body
    this.sprite = this.scene.add.rectangle(0, 0, this.tileSize * 0.6, this.tileSize * 0.8, 0x8B4513);
    this.sprite.setStrokeStyle(2, 0x000000);
    this.add(this.sprite);
    
    // Head
    const head = this.scene.add.circle(0, -this.tileSize * 0.4, this.tileSize * 0.2, 0xFFDBB3);
    head.setStrokeStyle(2, 0x000000);
    this.add(head);
    
    // Simple weapon (sword)
    const weapon = this.scene.add.rectangle(this.tileSize * 0.3, -this.tileSize * 0.1, 4, this.tileSize * 0.6, 0xC0C0C0);
    weapon.setStrokeStyle(1, 0x000000);
    this.add(weapon);
    
    // Add a simple shadow
    const shadow = this.scene.add.ellipse(0, this.tileSize * 0.4, this.tileSize * 0.8, this.tileSize * 0.3, 0x000000, 0.3);
    this.add(shadow);
  }

  private createNameplate(): void {
    if (!this.showName) return;
    
    // Calculate nameplate position (above character head)
    const nameplateY = this.y - this.tileSize * 0.8;
    
    // Create nameplate text without background - positioned in world coordinates
    this.nameplate = this.scene.add.text(this.x, nameplateY, this.characterName, {
      fontSize: '12px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3 // Increased stroke for better visibility without background
    }).setOrigin(0.5);
    
    // Don't add to character container so it stays in world coordinates
    // this.add(this.nameplate); // Removed this line
    
    // Add subtle glow effect to nameplate
    this.scene.tweens.add({
      targets: this.nameplate,
      alpha: 0.8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private setupAnimations(): void {
    // In a full implementation, you'd create sprite animations here
    // For now, we'll handle visual direction changes in the update method
  }

  public startMoving(direction: string): void {
    if (this.directions[direction]) {
      // Stop any current pathfinding
      this.stopPathFollowing();
      
      this.currentDirection = this.directions[direction];
      this.isMoving = true;
      this.updateAnimation();
    }
  }

  public stopMoving(): void {
    this.isMoving = false;
    this.currentDirection = { x: 0, y: 0, key: 'idle' };
    this.updateAnimation();
  }

  public startFollowingPath(path: { x: number; y: number }[]): void {
    if (path.length < 2) return; // Need at least start and end point
    
    // Stop keyboard movement
    this.stopMoving();
    
    // Set up path following
    this.currentPath = path;
    this.currentPathIndex = 1; // Start from second point (first is current position)
    this._isFollowingPath = true;
    this.isMoving = true;
    this.updateAnimation();
  }

  public stopPathFollowing(): void {
    this._isFollowingPath = false;
    this.currentPath = [];
    this.currentPathIndex = 0;
  }

  public update(): void {
    if (this._isFollowingPath) {
      this.updatePathFollowing();
    } else if (this.isMoving && this.currentDirection) {
      // Handle keyboard movement
      this.updateKeyboardMovement();
    }
    
    // Update nameplate position to stay above character
    this.updateNameplatePosition();
  }

  private updateKeyboardMovement(): void {
    // Calculate frame-rate independent movement
    const deltaTime = this.scene.game.loop.delta / 1000; // Convert to seconds
    const frameSpeed = this.speed * 60 * deltaTime; // Consistent speed regardless of framerate
    
    // Calculate movement with normalized diagonal speed
    let deltaX = this.currentDirection.x * frameSpeed;
    let deltaY = this.currentDirection.y * frameSpeed;
    
    // Normalize diagonal movement to prevent faster diagonal movement
    if (this.currentDirection.x !== 0 && this.currentDirection.y !== 0) {
      const diagonalFactor = Math.sqrt(2) / 2; // Approximately 0.707
      deltaX *= diagonalFactor;
      deltaY *= diagonalFactor;
    }
    
    // Move the character
    this.x += deltaX;
    this.y += deltaY;
    
    // Update visual direction
    this.updateVisualDirection();
  }

  private updatePathFollowing(): void {
    if (this.currentPathIndex >= this.currentPath.length) {
      // Reached end of path
      this.stopPathFollowing();
      this.stopMoving();
      return;
    }
    
    const target = this.currentPath[this.currentPathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Use a more precise threshold for smoother movement
    if (distance < 2) {
      // Move to next waypoint
      this.currentPathIndex++;
      return;
    }
    
    // Calculate smooth movement speed (frame-rate independent)
    const deltaTime = this.scene.game.loop.delta / 1000; // Convert to seconds
    const moveSpeed = this.speed * 60 * deltaTime; // Same speed as WASD movement
    
    // Move towards current target with smooth interpolation
    const directionX = dx / distance;
    const directionY = dy / distance;
    
    // Use the smaller of: calculated movement or remaining distance
    const actualMoveDistance = Math.min(moveSpeed, distance);
    
    this.x += directionX * actualMoveDistance;
    this.y += directionY * actualMoveDistance;
    
    // Update visual direction for path following
    this.updateVisualDirectionFromVector(directionX, directionY);
  }

  private updateVisualDirectionFromVector(dirX: number, dirY: number): void {
    // Update current direction for visual effects
    this.currentDirection = {
      x: Math.sign(dirX),
      y: Math.sign(dirY),
      key: this.getDirectionKey(Math.sign(dirX), Math.sign(dirY))
    };
    
    this.updateVisualDirection();
  }

  private getDirectionKey(x: number, y: number): string {
    if (x === 0 && y === -1) return 'up';
    if (x === 0 && y === 1) return 'down';
    if (x === -1 && y === 0) return 'left';
    if (x === 1 && y === 0) return 'right';
    if (x === -1 && y === -1) return 'up-left';
    if (x === 1 && y === -1) return 'up-right';
    if (x === -1 && y === 1) return 'down-left';
    if (x === 1 && y === 1) return 'down-right';
    return 'idle';
  }

  private updateNameplatePosition(): void {
    if (this.nameplate && this.showName) {
      // Update nameplate position to stay above character
      this.nameplate.x = this.x;
      this.nameplate.y = this.y - this.tileSize * 0.8;
    }
  }

  private updateAnimation(): void {
    // Handle animation state changes
    if (this.isMoving) {
      // Add subtle movement animation
      this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 0.95,
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      // Stop movement animation
      this.scene.tweens.killTweensOf(this.sprite);
      this.sprite.setScale(1);
    }
  }

  private updateVisualDirection(): void {
    // Flip sprite based on horizontal movement
    if (this.currentDirection.x > 0) {
      this.setScale(1, 1); // Facing right
    } else if (this.currentDirection.x < 0) {
      this.setScale(-1, 1); // Facing left
    }
    
    // Add slight tilt based on diagonal movement
    let rotation = 0;
    if (this.currentDirection.x !== 0 && this.currentDirection.y !== 0) {
      rotation = Math.atan2(this.currentDirection.y, this.currentDirection.x) * 0.1;
    }
    this.setRotation(rotation);
  }

  public getGridPosition(): { x: number, y: number } {
    return {
      x: Math.floor(this.x / this.tileSize),
      y: Math.floor(this.y / this.tileSize)
    };
  }

  public setGridPosition(gridX: number, gridY: number): void {
    this.x = gridX * this.tileSize + this.tileSize / 2;
    this.y = gridY * this.tileSize + this.tileSize / 2;
  }

  public getWorldPosition(): { x: number, y: number } {
    return { x: this.x, y: this.y };
  }

  // Method to handle collision detection
  public canMoveTo(worldX: number, worldY: number, tileMap: number[][]): boolean {
    const gridX = Math.floor(worldX / this.tileSize);
    const gridY = Math.floor(worldY / this.tileSize);
    
    // Check bounds
    if (gridY < 0 || gridY >= tileMap.length || gridX < 0 || gridX >= tileMap[0].length) {
      return false;
    }
    
    // Check if tile is walkable (0 = walkable, 1+ = blocked)
    return tileMap[gridY][gridX] === 0;
  }

  // Move to target position using pathfinding
  public moveToPosition(targetX: number, targetY: number, tileMap?: any): void {
    if (tileMap) {
      // Use pathfinding to move to target
      const path = tileMap.findPath(this.x, this.y, targetX, targetY);
      if (path.length > 0) {
        this.startFollowingPath(path);
      }
    } else {
      // Fallback to direct movement (for compatibility)
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        y: targetY,
        duration: 500,
        ease: 'Power2'
      });
    }
  }

  // Smooth position interpolation for multiplayer (doesn't interfere with pathfinding)
  public smoothMoveTo(targetX: number, targetY: number, duration: number = 200): Phaser.Tweens.Tween {
    // Don't interrupt pathfinding for the main character
    return this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Power1.easeOut'
    });
  }

  // Enhanced smooth click-to-move for short distances
  public smoothMoveToPosition(targetX: number, targetY: number, tileMap?: any, onComplete?: () => void): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // For short distances, use smooth tweening instead of pathfinding
    if (distance < 100) {
      // Stop any current movement
      this.stopMoving();
      this.stopPathFollowing();
      
      // Calculate direction for animation
      const directionX = Math.sign(dx);
      const directionY = Math.sign(dy);
      const directionKey = this.getDirectionKey(directionX, directionY);
      
      // Set moving state and direction
      this.isMoving = true;
      this._isUsingTweenMovement = true; // Mark as using tween movement
      this.currentDirection = { x: directionX, y: directionY, key: directionKey };
      this.updateAnimation();
      this.updateVisualDirection();
      
      // Calculate duration based on distance for consistent speed
      const duration = (distance / this.speed) * 16.67; // Approximately 60 FPS timing
      
      // Create smooth movement tween
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        y: targetY,
        duration: duration,
        ease: 'Sine.easeOut',
        onComplete: () => {
          // Stop movement when complete
          this._isUsingTweenMovement = false; // Clear tween movement flag
          this.stopMoving();
          // Notify the GameScene that movement is complete
          if (onComplete) {
            onComplete();
          }
        }
      });
    } else {
      // For longer distances, use pathfinding
      this.moveToPosition(targetX, targetY, tileMap);
    }
  }

  // Nameplate management methods
  public showNameplate(): void {
    if (this.nameplate) {
      this.nameplate.setVisible(true);
    }
    this.showName = true;
  }

  public hideNameplate(): void {
    if (this.nameplate) {
      this.nameplate.setVisible(false);
    }
    this.showName = false;
  }

  public updateName(newName: string): void {
    this.characterName = newName;
    if (this.nameplate) {
      this.nameplate.setText(newName);
    }
  }

  public getName(): string {
    return this.characterName;
  }

  public isNameVisible(): boolean {
    return this.showName && (this.nameplate?.visible || false);
  }

  // Toggle nameplate visibility
  public toggleNameplate(): void {
    if (this.isNameVisible()) {
      this.hideNameplate();
    } else {
      this.showNameplate();
    }
  }

  // Pathfinding status methods
  public isFollowingPath(): boolean {
    return this._isFollowingPath || this._isUsingTweenMovement;
  }

  public isUsingTweenMovement(): boolean {
    return this._isUsingTweenMovement;
  }

  public getCurrentPath(): { x: number; y: number }[] {
    return [...this.currentPath]; // Return a copy to prevent external modification
  }

  public getPathProgress(): { current: number; total: number } {
    return {
      current: this.currentPathIndex,
      total: this.currentPath.length
    };
  }

  // Animation and movement state methods
  public getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  public isCurrentlyMoving(): boolean {
    return this.isMoving;
  }

  public setAnimationState(direction: string, isMoving: boolean): void {
    // Handle idle state specially
    if (direction === 'idle') {
      this.currentDirection = { x: 0, y: 0, key: 'idle' };
      this.isMoving = false; // Force idle state
      this.updateAnimation();
      this.updateVisualDirection();
    } else if (this.directions[direction]) {
      this.currentDirection = this.directions[direction];
      this.isMoving = isMoving;
      this.updateAnimation();
      this.updateVisualDirection();
    }
  }

  // Clean up character and nameplate
  public destroy(): void {
    // Clean up nameplate
    if (this.nameplate) {
      this.nameplate.destroy();
      this.nameplate = null;
    }
    if (this.nameplateBackground) {
      this.nameplateBackground.destroy();
      this.nameplateBackground = null;
    }
    
    // Call parent destroy
    super.destroy();
  }
}
