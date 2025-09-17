/**
 * Movement Configuration - Centralized movement settings
 * This ensures all movement systems use consistent values
 */

export class MovementConfig {
  // Base movement speed for all characters (units per second)
  public static readonly BASE_MOVE_SPEED = 20;
  
  // Network synchronization settings
  public static readonly NETWORK_UPDATE_RATE = 20; // Updates per second (50ms interval)
  public static readonly NETWORK_UPDATE_INTERVAL = 1000 / MovementConfig.NETWORK_UPDATE_RATE; // 50ms
  
  // Movement thresholds
  public static readonly MIN_MOVEMENT_THRESHOLD = 0.1; // Minimum movement to register
  public static readonly POSITION_PRECISION = 100; // Round to 2 decimal places (x100)
  
  // Network player interpolation
  public static readonly NETWORK_LERP_SPEED = 8.0; // How fast network players catch up
  public static readonly MAX_INTERPOLATION_DISTANCE = 15.0; // Max distance for smooth interpolation (increased)
  
  /**
   * Get the movement speed for a character type
   */
  public static getMovementSpeed(characterClass?: string): number {
    // Could vary by class in the future
    return MovementConfig.BASE_MOVE_SPEED;
  }
  
  /**
   * Get network interpolation factor for smooth movement
   */
  public static getNetworkLerpFactor(deltaTime: number): number {
    return 1 - Math.exp(-MovementConfig.NETWORK_LERP_SPEED * deltaTime);
  }
  
  /**
   * Round position to network precision
   */
  public static roundPosition(value: number): number {
    return Math.round(value * MovementConfig.POSITION_PRECISION) / MovementConfig.POSITION_PRECISION;
  }
}
