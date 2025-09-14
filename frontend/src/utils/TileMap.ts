/**
 * Tile-based map system for RuneScape-like world
 */

import { Scene } from 'phaser';
import { Pathfinding } from './Pathfinding';

export interface TileMapConfig {
  width: number;
  height: number;
  tileSize: number;
  mapData?: number[][];
}

export interface TileType {
  id: number;
  name: string;
  color: number;
  walkable: boolean;
  texture?: string;
}

export class TileMap {
  private scene: Scene;
  private width: number;
  private height: number;
  private tileSize: number;
  private mapData: number[][] = [];
  private tileSprites: Phaser.GameObjects.Rectangle[][];
  
  // Define tile types
  private tileTypes: { [key: number]: TileType } = {
    0: { id: 0, name: 'grass', color: 0x228B22, walkable: true },      // Grass - walkable
    1: { id: 1, name: 'stone', color: 0x696969, walkable: false },     // Stone wall - blocked
    2: { id: 2, name: 'water', color: 0x4169E1, walkable: false },     // Water - blocked
    3: { id: 3, name: 'dirt', color: 0x8B4513, walkable: true },       // Dirt path - walkable
    4: { id: 4, name: 'tree', color: 0x006400, walkable: false },      // Tree - blocked
    5: { id: 5, name: 'sand', color: 0xF4A460, walkable: true },       // Sand - walkable
  };

  constructor(scene: Scene, config: TileMapConfig) {
    this.scene = scene;
    this.width = config.width;
    this.height = config.height;
    this.tileSize = config.tileSize;
    
    // Initialize map data
    if (config.mapData) {
      this.mapData = config.mapData;
    } else {
      this.generateDefaultMap();
    }
    
    this.tileSprites = [];
    this.createTileSprites();
  }

  private generateDefaultMap(): void {
    this.mapData = [];
    
    for (let y = 0; y < this.height; y++) {
      this.mapData[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Create a simple map with borders and some obstacles
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          this.mapData[y][x] = 1; // Stone border
        } else if (Math.random() < 0.1) {
          this.mapData[y][x] = 4; // Random trees
        } else if (Math.random() < 0.05) {
          this.mapData[y][x] = 2; // Random water
        } else if (Math.random() < 0.15) {
          this.mapData[y][x] = 3; // Dirt paths
        } else {
          this.mapData[y][x] = 0; // Grass
        }
      }
    }
    
    // Ensure spawn area is clear (center of map)
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    for (let y = centerY - 2; y <= centerY + 2; y++) {
      for (let x = centerX - 2; x <= centerX + 2; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          this.mapData[y][x] = 0; // Clear grass area
        }
      }
    }
  }

  private createTileSprites(): void {
    for (let y = 0; y < this.height; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < this.width; x++) {
        const tileId = this.mapData[y][x];
        const tileType = this.tileTypes[tileId] || this.tileTypes[0];
        
        const worldX = x * this.tileSize + this.tileSize / 2;
        const worldY = y * this.tileSize + this.tileSize / 2;
        
        // Create tile sprite
        const tile = this.scene.add.rectangle(
          worldX,
          worldY,
          this.tileSize,
          this.tileSize,
          tileType.color
        );
        
        // Add subtle border for visual clarity
        tile.setStrokeStyle(1, 0x000000, 0.2);
        
        // Add some texture variation
        if (tileType.name === 'grass') {
          // Add grass texture with slight color variation
          const variation = (Math.random() - 0.5) * 0x202020;
          tile.setFillStyle(tileType.color + variation);
        } else if (tileType.name === 'water') {
          // Add water animation
          this.scene.tweens.add({
            targets: tile,
            alpha: 0.7,
            duration: 2000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
        
        this.tileSprites[y][x] = tile;
      }
    }
  }

  public getTileAt(x: number, y: number): number {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return 1; // Return blocked tile for out of bounds
    }
    return this.mapData[y][x];
  }

  public setTileAt(x: number, y: number, tileId: number): void {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      this.mapData[y][x] = tileId;
      
      // Update sprite
      const tileType = this.tileTypes[tileId] || this.tileTypes[0];
      this.tileSprites[y][x].setFillStyle(tileType.color);
    }
  }

  public isWalkable(x: number, y: number): boolean {
    const tileId = this.getTileAt(x, y);
    const tileType = this.tileTypes[tileId];
    return tileType ? tileType.walkable : false;
  }

  public worldToGrid(worldX: number, worldY: number): { x: number, y: number } {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize)
    };
  }

  public gridToWorld(gridX: number, gridY: number): { x: number, y: number } {
    return {
      x: gridX * this.tileSize + this.tileSize / 2,
      y: gridY * this.tileSize + this.tileSize / 2
    };
  }

  public getMapData(): number[][] {
    return this.mapData;
  }

  public getWorldBounds(): { width: number, height: number } {
    return {
      width: this.width * this.tileSize,
      height: this.height * this.tileSize
    };
  }

  public getCenterPosition(): { x: number, y: number } {
    return this.gridToWorld(Math.floor(this.width / 2), Math.floor(this.height / 2));
  }

  // Method to find nearest walkable tile
  public findNearestWalkableTile(worldX: number, worldY: number): { x: number, y: number } | null {
    const gridPos = this.worldToGrid(worldX, worldY);
    
    const nearestGrid = Pathfinding.findNearestWalkableTile(
      gridPos.x,
      gridPos.y,
      (x: number, y: number) => this.isWalkable(x, y),
      this.width,
      this.height,
      15 // Search within 15 tiles
    );
    
    return nearestGrid ? this.gridToWorld(nearestGrid.x, nearestGrid.y) : null;
  }

  // Pathfinding using A* algorithm
  public findPath(startX: number, startY: number, endX: number, endY: number): { x: number, y: number }[] {
    const start = this.worldToGrid(startX, startY);
    const end = this.worldToGrid(endX, endY);
    
    // Find path in grid coordinates
    const gridPath = Pathfinding.findPath(
      start.x,
      start.y,
      end.x,
      end.y,
      (x: number, y: number) => this.isWalkable(x, y),
      this.width,
      this.height,
      {
        allowDiagonal: true,
        diagonalCost: 14,
        straightCost: 10
      }
    );
    
    if (gridPath.length === 0) {
      return []; // No path found
    }
    
    // Smooth the path to remove unnecessary waypoints
    const smoothedGridPath = Pathfinding.smoothPath(
      gridPath,
      (x: number, y: number) => this.isWalkable(x, y)
    );
    
    // Convert back to world coordinates
    return smoothedGridPath.map(point => this.gridToWorld(point.x, point.y));
  }

  public destroy(): void {
    // Clean up tile sprites
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tileSprites[y] && this.tileSprites[y][x]) {
          this.tileSprites[y][x].destroy();
        }
      }
    }
    this.tileSprites = [];
  }
}
