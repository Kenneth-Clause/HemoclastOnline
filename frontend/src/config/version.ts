/**
 * Global Version Configuration
 * Centralized version management for the application
 */

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  stage: 'Alpha' | 'Beta' | 'RC' | 'Release';
  build?: string;
}

export class VersionManager {
  private static readonly VERSION: VersionInfo = {
    major: 0,
    minor: 0,
    patch: 15,
    stage: 'Alpha',
    build: undefined
  };

  /**
   * Get the formatted version string
   * @param includeStage Whether to include the development stage (Alpha, Beta, etc.)
   * @returns Formatted version string (e.g., "Alpha v0.0.1" or "v0.0.1")
   */
  static getVersionString(includeStage: boolean = true): string {
    const { major, minor, patch, stage, build } = this.VERSION;
    const versionNumber = `v${major}.${minor}.${patch}`;
    
    if (build) {
      const buildString = includeStage ? `${stage} ${versionNumber}.${build}` : `${versionNumber}.${build}`;
      return buildString;
    }
    
    return includeStage ? `${stage} ${versionNumber}` : versionNumber;
  }

  /**
   * Get the version info object
   */
  static getVersionInfo(): VersionInfo {
    return { ...this.VERSION };
  }

  /**
   * Get just the numeric version
   */
  static getNumericVersion(): string {
    const { major, minor, patch } = this.VERSION;
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Get the development stage
   */
  static getStage(): string {
    return this.VERSION.stage;
  }

  /**
   * Check if this is a development version
   */
  static isDevelopment(): boolean {
    return this.VERSION.stage !== 'Release';
  }
}
