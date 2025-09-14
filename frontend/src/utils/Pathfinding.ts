/**
 * A* Pathfinding implementation for tile-based movement
 */

export interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

export interface PathfindingOptions {
  allowDiagonal: boolean;
  diagonalCost: number;
  straightCost: number;
}

export class Pathfinding {
  private static readonly DEFAULT_OPTIONS: PathfindingOptions = {
    allowDiagonal: true,
    diagonalCost: 14, // Approximately sqrt(2) * 10
    straightCost: 10
  };

  /**
   * Find path using A* algorithm
   */
  public static findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isWalkableCallback: (x: number, y: number) => boolean,
    mapWidth: number,
    mapHeight: number,
    options: Partial<PathfindingOptions> = {}
  ): { x: number; y: number }[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Validate start and end positions
    if (!isWalkableCallback(startX, startY) || !isWalkableCallback(endX, endY)) {
      return [];
    }

    const openList: PathNode[] = [];
    const closedList: Set<string> = new Set();
    
    // Create start node
    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.calculateHeuristic(startX, startY, endX, endY),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    
    openList.push(startNode);
    
    while (openList.length > 0) {
      // Find node with lowest f cost
      let currentNode = openList[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
          currentIndex = i;
        }
      }
      
      // Move current node from open to closed list
      openList.splice(currentIndex, 1);
      closedList.add(`${currentNode.x},${currentNode.y}`);
      
      // Check if we reached the goal
      if (currentNode.x === endX && currentNode.y === endY) {
        return this.reconstructPath(currentNode);
      }
      
      // Check all neighbors
      const neighbors = this.getNeighbors(currentNode, mapWidth, mapHeight, opts.allowDiagonal);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // Skip if in closed list or not walkable
        if (closedList.has(neighborKey) || !isWalkableCallback(neighbor.x, neighbor.y)) {
          continue;
        }
        
        // Calculate movement cost
        const isDiagonal = Math.abs(neighbor.x - currentNode.x) === 1 && 
                          Math.abs(neighbor.y - currentNode.y) === 1;
        const movementCost = isDiagonal ? opts.diagonalCost : opts.straightCost;
        const tentativeG = currentNode.g + movementCost;
        
        // Check if this path to neighbor is better
        const existingNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
        
        if (!existingNode) {
          // New node
          const newNode: PathNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.calculateHeuristic(neighbor.x, neighbor.y, endX, endY),
            f: 0,
            parent: currentNode
          };
          newNode.f = newNode.g + newNode.h;
          openList.push(newNode);
        } else if (tentativeG < existingNode.g) {
          // Better path to existing node
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = currentNode;
        }
      }
    }
    
    // No path found
    return [];
  }

  /**
   * Calculate heuristic distance (Manhattan distance)
   */
  private static calculateHeuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Get valid neighbors for a node
   */
  private static getNeighbors(
    node: PathNode, 
    mapWidth: number, 
    mapHeight: number, 
    allowDiagonal: boolean
  ): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    
    // 4-directional movement
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];
    
    // Add diagonal directions if allowed
    if (allowDiagonal) {
      directions.push(
        { x: -1, y: -1 }, // Up-Left
        { x: 1, y: -1 },  // Up-Right
        { x: -1, y: 1 },  // Down-Left
        { x: 1, y: 1 }    // Down-Right
      );
    }
    
    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;
      
      // Check bounds
      if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
        neighbors.push({ x: newX, y: newY });
      }
    }
    
    return neighbors;
  }

  /**
   * Reconstruct path from goal node back to start
   */
  private static reconstructPath(goalNode: PathNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let currentNode: PathNode | null = goalNode;
    
    while (currentNode !== null) {
      path.unshift({ x: currentNode.x, y: currentNode.y });
      currentNode = currentNode.parent;
    }
    
    return path;
  }

  /**
   * Smooth path by removing unnecessary waypoints
   */
  public static smoothPath(
    path: { x: number; y: number }[],
    isWalkableCallback: (x: number, y: number) => boolean
  ): { x: number; y: number }[] {
    if (path.length <= 2) return path;
    
    const smoothedPath: { x: number; y: number }[] = [path[0]];
    let currentIndex = 0;
    
    while (currentIndex < path.length - 1) {
      let furthestIndex = currentIndex + 1;
      
      // Find the furthest point we can reach in a straight line
      for (let i = currentIndex + 2; i < path.length; i++) {
        if (this.hasLineOfSight(
          path[currentIndex], 
          path[i], 
          isWalkableCallback
        )) {
          furthestIndex = i;
        } else {
          break;
        }
      }
      
      smoothedPath.push(path[furthestIndex]);
      currentIndex = furthestIndex;
    }
    
    return smoothedPath;
  }

  /**
   * Check if there's a clear line of sight between two points
   */
  private static hasLineOfSight(
    start: { x: number; y: number },
    end: { x: number; y: number },
    isWalkableCallback: (x: number, y: number) => boolean
  ): boolean {
    // Use Bresenham's line algorithm to check all tiles along the line
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const sx = start.x < end.x ? 1 : -1;
    const sy = start.y < end.y ? 1 : -1;
    let err = dx - dy;
    
    let x = start.x;
    let y = start.y;
    
    while (true) {
      // Check if current tile is walkable
      if (!isWalkableCallback(x, y)) {
        return false;
      }
      
      // Reached end point
      if (x === end.x && y === end.y) {
        break;
      }
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    
    return true;
  }

  /**
   * Find nearest walkable tile to a given position
   */
  public static findNearestWalkableTile(
    targetX: number,
    targetY: number,
    isWalkableCallback: (x: number, y: number) => boolean,
    mapWidth: number,
    mapHeight: number,
    maxDistance: number = 10
  ): { x: number; y: number } | null {
    // Check if target is already walkable
    if (isWalkableCallback(targetX, targetY)) {
      return { x: targetX, y: targetY };
    }
    
    // Breadth-first search for nearest walkable tile
    const visited = new Set<string>();
    const queue: { x: number; y: number; distance: number }[] = [
      { x: targetX, y: targetY, distance: 0 }
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key) || current.distance > maxDistance) {
        continue;
      }
      
      visited.add(key);
      
      if (isWalkableCallback(current.x, current.y)) {
        return { x: current.x, y: current.y };
      }
      
      // Add neighbors
      const neighbors = this.getNeighbors(
        { x: current.x, y: current.y, g: 0, h: 0, f: 0, parent: null },
        mapWidth,
        mapHeight,
        true
      );
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey)) {
          queue.push({
            x: neighbor.x,
            y: neighbor.y,
            distance: current.distance + 1
          });
        }
      }
    }
    
    return null; // No walkable tile found within range
  }
}
