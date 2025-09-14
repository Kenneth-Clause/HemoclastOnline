/**
 * Hexagonal tile-based map system for RuneScape-like world
 * 
 * Hexagonal grids have several advantages over square grids:
 * - More natural movement (6 directions instead of 8)
 * - All neighbors are equidistant
 * - Better visual appeal and more organic feel
 * - No diagonal movement speed issues
 * 
 * However, they are more complex to implement:
 * - Coordinate system conversion is more complex
 * - Pathfinding algorithms need adjustment
 * - Rendering requires offset calculations
 */

import { Scene } from 'phaser';
import { Pathfinding } from './Pathfinding';

export interface HexTileMapConfig {
  width: number;
  height: number;
  hexSize: number;
  mapData?: number[][];
}

export interface HexCoordinate {
  q: number; // Column
  r: number; // Row
  s: number; // Third coordinate (q + r + s = 0)
}

export interface PixelCoordinate {
  x: number;
  y: number;
}

export class HexTileMap {
  private scene: Scene;
  private width: number;
  private height: number;
  private hexSize: number;
  private mapData: number[][] = [];
  private tileSprites: Phaser.GameObjects.Polygon[][] = [];
  
  // Hex tile types (same as square tiles)
  private tileTypes: { [key: number]: any } = {
    0: { id: 0, name: 'grass', color: 0x228B22, walkable: true },
    1: { id: 1, name: 'stone', color: 0x696969, walkable: false },
    2: { id: 2, name: 'water', color: 0x4169E1, walkable: false },
    3: { id: 3, name: 'dirt', color: 0x8B4513, walkable: true },
    4: { id: 4, name: 'tree', color: 0x006400, walkable: false },
    5: { id: 5, name: 'sand', color: 0xF4A460, walkable: true },
  };

  constructor(scene: Scene, config: HexTileMapConfig) {
    this.scene = scene;
    this.width = config.width;
    this.height = config.height;
    this.hexSize = config.hexSize;
    
    if (config.mapData) {
      this.mapData = config.mapData;
    } else {
      this.generateDefaultMap();
    }
    
    this.tileSprites = [];
    this.createHexTileSprites();
  }

  private generateDefaultMap(): void {
    this.mapData = [];
    
    for (let r = 0; r < this.height; r++) {
      this.mapData[r] = [];
      for (let q = 0; q < this.width; q++) {
        // Create borders and random obstacles
        if (r === 0 || r === this.height - 1 || q === 0 || q === this.width - 1) {
          this.mapData[r][q] = 1; // Stone border
        } else if (Math.random() < 0.1) {
          this.mapData[r][q] = 4; // Random trees
        } else if (Math.random() < 0.05) {
          this.mapData[r][q] = 2; // Random water
        } else if (Math.random() < 0.15) {
          this.mapData[r][q] = 3; // Dirt paths
        } else {
          this.mapData[r][q] = 0; // Grass
        }
      }
    }
    
    // Clear spawn area (center)
    const centerQ = Math.floor(this.width / 2);
    const centerR = Math.floor(this.height / 2);
    for (let r = centerR - 2; r <= centerR + 2; r++) {
      for (let q = centerQ - 2; q <= centerQ + 2; q++) {
        if (r >= 0 && r < this.height && q >= 0 && q < this.width) {
          this.mapData[r][q] = 0;
        }
      }
    }
  }

  private createHexTileSprites(): void {
    for (let r = 0; r < this.height; r++) {
      this.tileSprites[r] = [];
      for (let q = 0; q < this.width; q++) {
        const tileId = this.mapData[r][q];
        const tileType = this.tileTypes[tileId] || this.tileTypes[0];
        
        const pixel = this.hexToPixel({ q, r, s: -q - r });
        
        // Create hexagon shape
        const hexPoints = this.getHexagonPoints();
        const hex = this.scene.add.polygon(
          pixel.x, 
          pixel.y, 
          hexPoints, 
          tileType.color
        );
        
        // Add border
        hex.setStrokeStyle(1, 0x000000, 0.3);
        
        // Add texture variation for grass
        if (tileType.name === 'grass') {
          const variation = (Math.random() - 0.5) * 0x202020;
          hex.setFillStyle(tileType.color + variation);
        } else if (tileType.name === 'water') {
          // Water animation
          this.scene.tweens.add({
            targets: hex,
            alpha: 0.7,
            duration: 2000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
        
        this.tileSprites[r][q] = hex;
      }
    }
  }

  private getHexagonPoints(): number[] {
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = this.hexSize * Math.cos(angle);
      const y = this.hexSize * Math.sin(angle);
      points.push(x, y);
    }
    return points;
  }

  // Convert hex coordinates to pixel coordinates
  private hexToPixel(hex: HexCoordinate): PixelCoordinate {
    const x = this.hexSize * (3/2 * hex.q);
    const y = this.hexSize * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    return { x, y };
  }

  // Convert pixel coordinates to hex coordinates
  private pixelToHex(pixel: PixelCoordinate): HexCoordinate {
    const q = (2/3 * pixel.x) / this.hexSize;
    const r = (-1/3 * pixel.x + Math.sqrt(3)/3 * pixel.y) / this.hexSize;
    const s = -q - r;
    
    // Round to nearest hex
    return this.hexRound({ q, r, s });
  }

  private hexRound(hex: HexCoordinate): HexCoordinate {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    let s = Math.round(hex.s);
    
    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - hex.s);
    
    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }
    
    return { q, r, s };
  }

  // Get hex neighbors (6 directions instead of 8)
  private getHexNeighbors(hex: HexCoordinate): HexCoordinate[] {
    const directions = [
      { q: 1, r: 0, s: -1 },   // East
      { q: 1, r: -1, s: 0 },   // Northeast  
      { q: 0, r: -1, s: 1 },   // Northwest
      { q: -1, r: 0, s: 1 },   // West
      { q: -1, r: 1, s: 0 },   // Southwest
      { q: 0, r: 1, s: -1 }    // Southeast
    ];
    
    return directions.map(dir => ({
      q: hex.q + dir.q,
      r: hex.r + dir.r,
      s: hex.s + dir.s
    }));
  }

  public getTileAt(q: number, r: number): number {
    if (r < 0 || r >= this.height || q < 0 || q >= this.width) {
      return 1; // Blocked for out of bounds
    }
    return this.mapData[r][q];
  }

  public isWalkable(q: number, r: number): boolean {
    const tileId = this.getTileAt(q, r);
    const tileType = this.tileTypes[tileId];
    return tileType ? tileType.walkable : false;
  }

  public worldToHex(worldX: number, worldY: number): HexCoordinate {
    return this.pixelToHex({ x: worldX, y: worldY });
  }

  public hexToWorld(q: number, r: number): PixelCoordinate {
    return this.hexToPixel({ q, r, s: -q - r });
  }

  public getCenterPosition(): PixelCoordinate {
    const centerQ = Math.floor(this.width / 2);
    const centerR = Math.floor(this.height / 2);
    return this.hexToWorld(centerQ, centerR);
  }

  public getWorldBounds(): { width: number, height: number } {
    // Calculate approximate bounds for hex grid
    const maxPixel = this.hexToWorld(this.width - 1, this.height - 1);
    return {
      width: maxPixel.x + this.hexSize * 2,
      height: maxPixel.y + this.hexSize * 2
    };
  }

  // Pathfinding adapted for hexagonal grid
  public findPath(startX: number, startY: number, endX: number, endY: number): PixelCoordinate[] {
    const startHex = this.worldToHex(startX, startY);
    const endHex = this.worldToHex(endX, endY);
    
    // Convert hex coordinates to array indices for pathfinding
    const startArray = { x: startHex.q, y: startHex.r };
    const endArray = { x: endHex.q, y: endHex.r };
    
    // Use modified pathfinding for hex grid (only 6 directions)
    const gridPath = Pathfinding.findPath(
      startArray.x,
      startArray.y,
      endArray.x,
      endArray.y,
      (q: number, r: number) => this.isWalkable(q, r),
      this.width,
      this.height,
      {
        allowDiagonal: false, // Hex grids don't have diagonals
        diagonalCost: 10,     // Not used
        straightCost: 10
      }
    );
    
    if (gridPath.length === 0) {
      return [];
    }
    
    // Convert back to world coordinates
    return gridPath.map(point => this.hexToWorld(point.x, point.y));
  }

  public findNearestWalkableTile(worldX: number, worldY: number): PixelCoordinate | null {
    const hex = this.worldToHex(worldX, worldY);
    
    const nearestHex = Pathfinding.findNearestWalkableTile(
      hex.q,
      hex.r,
      (q: number, r: number) => this.isWalkable(q, r),
      this.width,
      this.height,
      15
    );
    
    return nearestHex ? this.hexToWorld(nearestHex.x, nearestHex.y) : null;
  }

  public destroy(): void {
    // Clean up hex sprites
    for (let r = 0; r < this.height; r++) {
      for (let q = 0; q < this.width; q++) {
        if (this.tileSprites[r] && this.tileSprites[r][q]) {
          this.tileSprites[r][q].destroy();
        }
      }
    }
    this.tileSprites = [];
  }
}
