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
  
  // Network player interpolation - Enhanced for smooth movement
  public static readonly NETWORK_LERP_SPEED = 12.0; // How fast network players catch up (increased for responsiveness)
  public static readonly MAX_INTERPOLATION_DISTANCE = 10.0; // Max distance for smooth interpolation
  public static readonly INTERPOLATION_ENABLED_BY_DEFAULT = true; // Enable interpolation by default for networked players
  public static readonly ADAPTIVE_INTERPOLATION = true; // Use adaptive interpolation based on distance and latency
  
  /**
   * Get the movement speed for a character type
   */
  public static getMovementSpeed(_characterClass?: string): number {
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
   * Get adaptive interpolation factor based on distance and conditions
   */
  public static getAdaptiveInterpolationFactor(deltaTime: number, distance: number, isStaleMessage: boolean = false): number {
    if (!MovementConfig.ADAPTIVE_INTERPOLATION) {
      return MovementConfig.getNetworkLerpFactor(deltaTime);
    }
    
    const baseFactor = MovementConfig.getNetworkLerpFactor(deltaTime);
    
    // Increase interpolation speed for distant targets or stale messages
    let adaptiveFactor = baseFactor;
    
    if (isStaleMessage) {
      adaptiveFactor *= 2.0; // Faster catch-up for stale messages
    } else if (distance > 5.0) {
      adaptiveFactor *= (1 + distance * 0.1); // Scale by distance
    }
    
    // Cap the maximum interpolation factor to prevent overshooting
    return Math.min(adaptiveFactor, 0.9);
  }
  
  /**
   * Round position to network precision
   */
  public static roundPosition(value: number): number {
    return Math.round(value * MovementConfig.POSITION_PRECISION) / MovementConfig.POSITION_PRECISION;
  }
}
