/**
 * Secure token management utility
 * Uses localStorage with security measures and plans for httpOnly cookies
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'hemoclast_token';
  private static readonly PLAYER_ID_KEY = 'hemoclast_player_id';
  private static readonly USERNAME_KEY = 'hemoclast_username';
  private static readonly CHARACTER_ID_KEY = 'hemoclast_character_id';
  private static readonly IS_GUEST_KEY = 'hemoclast_is_guest';
  private static readonly IS_REGISTERED_KEY = 'hemoclast_is_registered';
  
  /**
   * Store authentication data securely
   */
  static setToken(token: string, playerId: string, username: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.PLAYER_ID_KEY, playerId);
      localStorage.setItem(this.USERNAME_KEY, username);
      
      // Set registration status based on token type
      const isGuest = token.startsWith('guest_');
      localStorage.setItem(this.IS_GUEST_KEY, isGuest.toString());
      localStorage.setItem(this.IS_REGISTERED_KEY, (!isGuest).toString());
      
      console.log('Authentication data stored successfully');
    } catch (error) {
      console.error('Failed to store authentication data:', error);
      throw new Error('Unable to store authentication data');
    }
  }
  
  /**
   * Retrieve stored token
   */
  static getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      
      // Check if token is expired before returning
      if (token && this.isTokenExpired(token)) {
        console.warn('Token has expired, clearing authentication data');
        this.clearAuth();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }
  
  /**
   * Get stored player ID
   */
  static getPlayerId(): string | null {
    try {
      return localStorage.getItem(this.PLAYER_ID_KEY);
    } catch (error) {
      console.error('Failed to retrieve player ID:', error);
      return null;
    }
  }
  
  /**
   * Get stored username
   */
  static getUsername(): string | null {
    try {
      return localStorage.getItem(this.USERNAME_KEY);
    } catch (error) {
      console.error('Failed to retrieve username:', error);
      return null;
    }
  }
  
  /**
   * Set character ID
   */
  static setCharacterId(characterId: string): void {
    try {
      localStorage.setItem(this.CHARACTER_ID_KEY, characterId);
    } catch (error) {
      console.error('Failed to store character ID:', error);
    }
  }
  
  /**
   * Get character ID
   */
  static getCharacterId(): string | null {
    try {
      return localStorage.getItem(this.CHARACTER_ID_KEY);
    } catch (error) {
      console.error('Failed to retrieve character ID:', error);
      return null;
    }
  }
  
  /**
   * Check if user is a guest
   */
  static isGuest(): boolean {
    try {
      return localStorage.getItem(this.IS_GUEST_KEY) === 'true';
    } catch (error) {
      console.error('Failed to check guest status:', error);
      return false;
    }
  }
  
  /**
   * Check if user is registered
   */
  static isRegistered(): boolean {
    try {
      return localStorage.getItem(this.IS_REGISTERED_KEY) === 'true';
    } catch (error) {
      console.error('Failed to check registration status:', error);
      return false;
    }
  }
  
  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.PLAYER_ID_KEY);
      localStorage.removeItem(this.USERNAME_KEY);
      localStorage.removeItem(this.CHARACTER_ID_KEY);
      localStorage.removeItem(this.IS_GUEST_KEY);
      localStorage.removeItem(this.IS_REGISTERED_KEY);
      
      console.log('Authentication data cleared successfully');
    } catch (error) {
      console.error('Failed to clear authentication data:', error);
    }
  }
  
  /**
   * Check if a token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      // Guest tokens don't expire in the same way
      if (token.startsWith('guest_')) {
        return false; // Let server handle guest token validation
      }
      
      // Parse JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Unable to parse token, assuming expired:', error);
      return true; // Assume expired if we can't parse
    }
  }
  
  /**
   * Check if user is authenticated (has valid token)
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }
  
  /**
   * Get authentication status summary
   */
  static getAuthStatus(): {
    isAuthenticated: boolean;
    isGuest: boolean;
    isRegistered: boolean;
    username: string | null;
    playerId: string | null;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      isGuest: this.isGuest(),
      isRegistered: this.isRegistered(),
      username: this.getUsername(),
      playerId: this.getPlayerId()
    };
  }
}
