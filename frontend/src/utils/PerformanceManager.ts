/**
 * Production-ready performance optimization for HemoclastOnline
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  sceneObjects: number;
  textureMemory: number;
}

export interface PerformanceSettings {
  targetFPS: number;
  maxObjects: number;
  enableObjectPooling: boolean;
  enableTextureOptimization: boolean;
  enableBatching: boolean;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private scene?: Phaser.Scene;
  private settings: PerformanceSettings = {
    targetFPS: 60,
    maxObjects: 1000,
    enableObjectPooling: true,
    enableTextureOptimization: true,
    enableBatching: true,
    qualityLevel: 'high'
  };
  
  private objectPools: Map<string, Phaser.GameObjects.GameObject[]> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentFPS = 60;
  private performanceTimer?: Phaser.Time.TimerEvent;

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * Initialize performance manager
   */
  initialize(scene: Phaser.Scene, settings?: Partial<PerformanceSettings>): void {
    this.scene = scene;
    this.settings = { ...this.settings, ...settings };
    
    this.detectDeviceCapabilities();
    this.setupPerformanceMonitoring();
    this.optimizeRenderer();
    this.loadPerformanceSettings();
  }

  /**
   * Get object from pool or create new one
   */
  getPooledObject<T extends Phaser.GameObjects.GameObject>(
    type: string,
    creator: () => T
  ): T {
    if (!this.settings.enableObjectPooling) {
      return creator();
    }

    const pool = this.objectPools.get(type) || [];
    
    if (pool.length > 0) {
      const obj = pool.pop() as T;
      obj.setActive(true).setVisible(true);
      return obj;
    }
    
    return creator();
  }

  /**
   * Return object to pool
   */
  returnToPool(type: string, object: Phaser.GameObjects.GameObject): void {
    if (!this.settings.enableObjectPooling) {
      object.destroy();
      return;
    }

    object.setActive(false).setVisible(false);
    
    const pool = this.objectPools.get(type) || [];
    if (pool.length < 50) { // Max pool size
      pool.push(object);
      this.objectPools.set(type, pool);
    } else {
      object.destroy();
    }
  }

  /**
   * Optimize scene performance
   */
  optimizeScene(scene: Phaser.Scene): void {
    // Enable batching for better performance
    if (this.settings.enableBatching) {
      scene.add.group().runChildUpdate = false;
    }

    // Set culling bounds
    const { width, height } = scene.scale;
    scene.cameras.main.setBounds(0, 0, width, height);

    // Optimize physics if present
    if (scene.physics?.world) {
      scene.physics.world.setBounds(0, 0, width, height);
      // Reduce physics iterations for better performance
      scene.physics.world.fixedStep = false;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const memoryInfo = (performance as any).memory;
    
    return {
      fps: this.currentFPS,
      memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0,
      renderTime: this.lastFrameTime,
      sceneObjects: this.scene?.children.list.length || 0,
      textureMemory: this.getTextureMemoryUsage()
    };
  }

  /**
   * Update performance settings
   */
  updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.savePerformanceSettings();
    this.applySettings();
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const metrics = this.getCurrentMetrics();
    const recommendations: string[] = [];

    if (metrics.fps < 30) {
      recommendations.push('Consider reducing quality settings for better performance');
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push('High memory usage detected. Consider restarting the game');
    }

    if (metrics.sceneObjects > this.settings.maxObjects) {
      recommendations.push('Too many objects in scene. Performance may be affected');
    }

    if (metrics.textureMemory > 50) {
      recommendations.push('High texture memory usage. Consider reducing texture quality');
    }

    return recommendations;
  }

  /**
   * Auto-adjust quality based on performance
   */
  autoAdjustQuality(): void {
    const metrics = this.getCurrentMetrics();
    
    if (metrics.fps < 25 && this.settings.qualityLevel !== 'low') {
      // Reduce quality if FPS is too low
      const qualityLevels = ['ultra', 'high', 'medium', 'low'];
      const currentIndex = qualityLevels.indexOf(this.settings.qualityLevel);
      if (currentIndex < qualityLevels.length - 1) {
        this.updateSettings({ qualityLevel: qualityLevels[currentIndex + 1] as any });
        console.log(`Performance: Reduced quality to ${this.settings.qualityLevel}`);
      }
    } else if (metrics.fps > 55 && this.settings.qualityLevel !== 'ultra') {
      // Increase quality if performance is good
      const qualityLevels = ['low', 'medium', 'high', 'ultra'];
      const currentIndex = qualityLevels.indexOf(this.settings.qualityLevel);
      if (currentIndex < qualityLevels.length - 1) {
        this.updateSettings({ qualityLevel: qualityLevels[currentIndex + 1] as any });
        console.log(`Performance: Increased quality to ${this.settings.qualityLevel}`);
      }
    }
  }

  /**
   * Clean up unused resources
   */
  cleanupResources(): void {
    if (!this.scene) return;

    // Clean up object pools
    this.objectPools.forEach((pool, type) => {
      pool.forEach(obj => obj.destroy());
    });
    this.objectPools.clear();

    // Clean up textures
    this.scene.textures.each((texture: Phaser.Textures.Texture) => {
      if (!texture.manager.exists(texture.key)) {
        texture.destroy();
      }
    });

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Detect device capabilities and adjust settings
   */
  private detectDeviceCapabilities(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      // No WebGL support, use low quality
      this.settings.qualityLevel = 'low';
      return;
    }

    // Check for hardware capabilities
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      this.settings.qualityLevel = 'medium';
      this.settings.maxObjects = 500;
    }

    // Check memory
    const memoryInfo = (navigator as any).deviceMemory;
    if (memoryInfo && memoryInfo < 4) {
      this.settings.qualityLevel = 'medium';
    }

    // Check CPU cores
    const cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) {
      this.settings.enableBatching = true;
      this.settings.maxObjects = Math.min(this.settings.maxObjects, 750);
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.scene) return;

    this.performanceTimer = this.scene.time.addEvent({
      delay: 1000, // Check every second
      callback: this.updatePerformanceMetrics,
      callbackScope: this,
      loop: true
    });

    // Monitor frame rate
    this.scene.time.addEvent({
      delay: 100,
      callback: this.updateFPS,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Update FPS calculation
   */
  private updateFPS(): void {
    if (!this.scene) return;

    const currentTime = this.scene.time.now;
    this.frameCount++;

    if (currentTime - this.lastFrameTime >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const metrics = this.getCurrentMetrics();
    this.performanceHistory.push(metrics);

    // Keep only last 60 seconds of data
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift();
    }

    // Auto-adjust quality if enabled
    if (this.performanceHistory.length > 10) {
      this.autoAdjustQuality();
    }
  }

  /**
   * Optimize renderer settings
   */
  private optimizeRenderer(): void {
    if (!this.scene) return;

    const renderer = this.scene.sys.game.renderer;
    
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      // WebGL optimizations
      renderer.setBlendMode(Phaser.BlendModes.NORMAL);
      
      // Adjust based on quality level
      switch (this.settings.qualityLevel) {
        case 'low':
          renderer.antialias = false;
          break;
        case 'medium':
          renderer.antialias = true;
          break;
        case 'high':
        case 'ultra':
          renderer.antialias = true;
          break;
      }
    }
  }

  /**
   * Apply current settings
   */
  private applySettings(): void {
    if (!this.scene) return;

    // Apply quality settings
    this.optimizeRenderer();
    
    // Update target FPS
    this.scene.sys.game.loop.targetFps = this.settings.targetFPS;
  }

  /**
   * Get texture memory usage estimate
   */
  private getTextureMemoryUsage(): number {
    if (!this.scene) return 0;

    let totalMemory = 0;
    this.scene.textures.each((texture: Phaser.Textures.Texture) => {
      if (texture.source && texture.source.length > 0) {
        const source = texture.source[0];
        if (source.image) {
          totalMemory += (source.width * source.height * 4) / 1024 / 1024; // Assume 4 bytes per pixel
        }
      }
    });

    return totalMemory;
  }

  /**
   * Load performance settings from storage
   */
  private loadPerformanceSettings(): void {
    const saved = localStorage.getItem('hemoclast_performance');
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved);
        this.settings = { ...this.settings, ...savedSettings };
      } catch (error) {
        console.warn('Failed to load performance settings:', error);
      }
    }
  }

  /**
   * Save performance settings to storage
   */
  private savePerformanceSettings(): void {
    try {
      localStorage.setItem('hemoclast_performance', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save performance settings:', error);
    }
  }

  /**
   * Clean up performance manager
   */
  destroy(): void {
    if (this.performanceTimer) {
      this.performanceTimer.destroy();
    }
    
    this.cleanupResources();
    this.scene = undefined;
  }
}

export default PerformanceManager;
