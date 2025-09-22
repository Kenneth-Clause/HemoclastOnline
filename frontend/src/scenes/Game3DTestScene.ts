/**
 * Game3DTestScene - Test scene to demonstrate 3D integration
 * This scene shows how to integrate Three.js 3D with existing Phaser scenes
 */

import { Scene } from 'phaser';
import { GameStore } from '../stores/gameStore';
import { Game3DScene } from './Game3DScene';
import { GothicTitleUtils } from '../utils/GothicTitleUtils';
import { createDirectUI, DirectUIActivation } from '../utils/DirectUIActivation';
import { DebugConsole } from '../utils/DebugConsole';

export class Game3DTestScene extends Scene {
  private gameStore: GameStore;
  private game3D: Game3DScene | null = null;
  private threejsContainer: HTMLElement | null = null;
  private directUI: DirectUIActivation | null = null;
  
  // UI elements
  private instructionsText: Phaser.GameObjects.Text | null = null;
  private performanceText: Phaser.GameObjects.Text | null = null;
  private backButton: Phaser.GameObjects.Container | null = null;
  
  constructor() {
    super({ key: 'Game3DTestScene' });
    this.gameStore = GameStore.getInstance();
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Create dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    
    // Create container for Three.js canvas
    this.createThreeJSContainer();
    
    // Initialize 3D scene
    this.initialize3DScene();
    
    // Create UI overlay
    this.createUIOverlay();
    
    // Activate UI system directly in this scene
    console.log('🎯 Game3DTestScene: Activating UI system directly...');
    
    // Add a small delay to ensure everything is ready
    this.time.delayedCall(1000, () => {
      this.directUI = createDirectUI(this);
      console.log('✅ Game3DTestScene: Direct UI system activated!');
    });
    
    // Handle window resize
    this.scale.on('resize', this.handleResize, this);
    
    // Add keyboard shortcut for manual UI activation
    this.input.keyboard?.on('keydown-U', () => {
      this.activateUISystem();
    });
    
    DebugConsole.info('SCENE', '🎮 3D Test Scene created with full UI system');
    console.log('🎮 3D Scene with Complete UI System Active!');
    console.log('🎯 Press the keyboard shortcuts to test all UI components:');
    console.log('  I - Inventory, C - Character Sheet, J - Quest Tracker');
    console.log('  G - Guild Panel, O - Friends List, Y - Achievements, L - Daily Tasks');
    console.log('  F12 - Toggle all UI, F1-F3 - Toggle individual components');
    console.log('');
    console.log('🔧 If UI is not visible:');
    console.log('  - Click the "🎮 Activate UI System" button');
    console.log('  - Or press U key to manually activate');
    console.log('  - Or use console: activateFullUIDemo()');
  }
  
  private createThreeJSContainer(): void {
    // Create HTML container for Three.js canvas
    this.threejsContainer = document.createElement('div');
    this.threejsContainer.id = 'threejs-container';
    this.threejsContainer.style.position = 'absolute';
    this.threejsContainer.style.top = '0';
    this.threejsContainer.style.left = '0';
    this.threejsContainer.style.width = '100%';
    this.threejsContainer.style.height = '100%';
    this.threejsContainer.style.zIndex = '1';
    this.threejsContainer.style.pointerEvents = 'auto';
    
    // Add to game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.appendChild(this.threejsContainer);
    } else {
      document.body.appendChild(this.threejsContainer);
    }
  }
  
  private async initialize3DScene(): Promise<void> {
    if (!this.threejsContainer) return;
    
    try {
      // Create 3D scene
      this.game3D = new Game3DScene({
        container: this.threejsContainer,
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Start the 3D scene
      await this.game3D.start();
      
      DebugConsole.info('SCENE', '✅ 3D Scene initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize 3D scene:', error);
      this.show3DError(error as Error);
    }
  }
  
  private createUIOverlay(): void {
    const { width, height } = this.scale;
    
    // Make Phaser canvas transparent and on top for UI
    const phaserCanvas = this.game.canvas;
    phaserCanvas.style.backgroundColor = 'transparent';
    phaserCanvas.style.zIndex = '10';
    phaserCanvas.style.pointerEvents = 'none'; // Let 3D scene handle most interactions
    
    // Title
    const title = this.add.text(width / 2, 50, '🩸 HemoclastOnline 3D', {
      fontSize: '32px',
      color: '#8B0000',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Instructions
    this.instructionsText = this.add.text(20, height - 200, this.getInstructionsText(), {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Cinzel, serif',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0, 1);
    
    // Performance display
    this.performanceText = this.add.text(width - 20, 20, 'Performance: Loading...', {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: 'monospace',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0);
    
    // Back button
    this.backButton = GothicTitleUtils.createEnhancedGothicButton(
      this,
      100,
      height - 50,
      160,
      40,
      '← Back to Menu',
      () => {
        this.returnToMenu();
      },
      {
        fontSize: 14,
        bgColor: 0x2d1b1b,
        borderColor: 0x8B0000,
        textColor: '#F5F5DC',
        hoverBgColor: 0x4a0000,
        hoverBorderColor: 0xDC143C,
        hoverTextColor: '#FFD700'
      }
    );
    
    // UI activation button (fallback if UI doesn't auto-load)
    const uiButton = GothicTitleUtils.createEnhancedGothicButton(
      this,
      280,
      height - 50,
      180,
      40,
      '🎮 Activate UI System',
      () => {
        this.activateUISystem();
      },
      {
        fontSize: 14,
        bgColor: 0x1a4a1a,
        borderColor: 0x32CD32,
        textColor: '#F5F5DC',
        hoverBgColor: 0x2d6a2d,
        hoverBorderColor: 0x00FF00,
        hoverTextColor: '#FFFFFF'
      }
    );
    
    // Enable pointer events for UI elements
    if (this.instructionsText) {
      this.instructionsText.setInteractive();
    }
    if (this.performanceText) {
      this.performanceText.setInteractive();
    }
    // Note: backButton is already interactive via GothicTitleUtils.createEnhancedGothicButton
  }
  
  private getInstructionsText(): string {
    return [
      '🎮 3D Controls:',
      'WASD - Move character',
      'Mouse Click - Move to location', 
      'Q/E - Rotate camera',
      'Mouse Wheel - Zoom camera',
      '',
      '🌟 Features:',
      '• Full 3D environment with physics',
      '• Gothic atmosphere with lighting',
      '• Multiplayer synchronization',
      '• Weather and day/night cycle',
      '• Performance optimization'
    ].join('\n');
  }
  
  private show3DError(error: Error): void {
    // Show error message if 3D fails to load
    const { width, height } = this.scale;
    
    const errorBg = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.6, 0x2d1b1b, 0.9);
    errorBg.setStrokeStyle(3, 0x8B0000);
    
    const errorTitle = this.add.text(width / 2, height / 2 - 100, '❌ 3D Initialization Failed', {
      fontSize: '24px',
      color: '#FF4444',
      fontFamily: 'Cinzel, serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const errorMessage = this.add.text(width / 2, height / 2, [
      'Failed to initialize 3D graphics.',
      'This could be due to:',
      '',
      '• WebGL not supported in your browser',
      '• Insufficient graphics capabilities',
      '• Browser security restrictions',
      '',
      `Error: ${error.message}`,
      '',
      'Please try updating your browser or use a different device.'
    ].join('\n'), {
      fontSize: '16px',
      color: '#F5F5DC',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: width * 0.7 }
    }).setOrigin(0.5);
    
    // Add fallback button
    GothicTitleUtils.createEnhancedGothicButton(
      this,
      width / 2,
      height / 2 + 150,
      200,
      40,
      'Return to 2D Mode',
      () => {
        this.returnToMenu();
      }
    );
  }
  
  private activateUISystem(): void {
    console.log('🎮 Manually activating UI system...');
    
    // Check if UIScene is already running
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive()) {
      console.log('✅ UIScene is already active');
      
      // Try to trigger the demo manually
      this.time.delayedCall(500, () => {
        console.log('🎯 Attempting to access UI demo...');
        
        // Access the global demo object if available
        const demo = (window as any).uiDemo;
        if (demo) {
          console.log('✅ UI Demo found - triggering manual activation');
          demo.triggerActionBarDemo();
          demo.triggerCombatUIDemo();
          demo.triggerLootDemo();
        } else {
          console.log('⚠️ UI Demo not found - try refreshing the page');
        }
        
        // Show manual activation guide
        const guide = (window as any).activateFullUIDemo;
        if (guide) {
          guide();
        }
      });
    } else {
      console.log('🎯 UIScene not active - launching now...');
      this.scene.launch('UIScene');
      
      // Wait a bit then try to activate demo
      this.time.delayedCall(2000, () => {
        const demo = (window as any).uiDemo;
        if (demo) {
          demo.triggerActionBarDemo();
        }
      });
    }
  }
  
  private activateUISystem(): void {
    console.log('🎮 Manually activating UI system...');
    
    if (this.directUI && this.directUI.isUIActive()) {
      console.log('✅ Direct UI system is already active');
      
      // Show activation guide
      const guide = (window as any).activateFullUIDemo;
      if (guide) {
        guide();
      }
      
      // Trigger some demo actions
      const demo = (window as any).uiDemo;
      if (demo) {
        demo.triggerActionBarDemo();
        demo.triggerCombatUIDemo();
      }
    } else {
      console.log('🎯 Creating new direct UI system...');
      this.directUI = createDirectUI(this);
    }
  }
  
  private returnToMenu(): void {
    DebugConsole.info('SCENE', '🔄 Returning to Menu');
    
    // Clean up direct UI system
    if (this.directUI) {
      this.directUI.deactivate();
      this.directUI = null;
    }
    
    // Stop UIScene if it's running
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
    
    // Clean up 3D scene
    if (this.game3D) {
      this.game3D.destroy();
      this.game3D = null;
    }
    
    // Remove Three.js container
    if (this.threejsContainer) {
      this.threejsContainer.remove();
      this.threejsContainer = null;
    }
    
    // Restore Phaser canvas properties
    const phaserCanvas = this.game.canvas;
    phaserCanvas.style.backgroundColor = '#1a1a1a';
    phaserCanvas.style.zIndex = '1';
    phaserCanvas.style.pointerEvents = 'auto';
    
    // Return to menu
    this.scene.start('MenuScene');
  }
  
  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const { width, height } = gameSize;
    
    // Update 3D scene size
    if (this.game3D) {
      this.game3D.handleResize(width, height);
    }
    
    // Update UI positions
    if (this.instructionsText) {
      this.instructionsText.setPosition(20, height - 200);
    }
    
    if (this.performanceText) {
      this.performanceText.setPosition(width - 20, 20);
    }
    
    if (this.backButton) {
      this.backButton.setPosition(100, height - 50);
    }
  };
  
  update(): void {
    // Update performance display
    if (this.game3D && this.performanceText) {
      const fps = this.game3D.getFPS();
      const triangles = this.game3D.getTriangleCount();
      
      this.performanceText.setText([
        `FPS: ${fps}`,
        `Triangles: ${triangles.toLocaleString()}`,
        `Memory: ${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 'N/A'} MB`
      ].join('\n'));
      
      // Change color based on performance
      if (fps < 30) {
        this.performanceText.setColor('#FF4444'); // Red for poor performance
      } else if (fps < 50) {
        this.performanceText.setColor('#FFAA00'); // Orange for moderate performance
      } else {
        this.performanceText.setColor('#44FF44'); // Green for good performance
      }
    }
  }
  
  destroy(): void {
    // Clean up 3D scene
    if (this.game3D) {
      this.game3D.destroy();
      this.game3D = null;
    }
    
    // Remove Three.js container
    if (this.threejsContainer) {
      this.threejsContainer.remove();
      this.threejsContainer = null;
    }
    
    // Restore Phaser canvas
    const phaserCanvas = this.game.canvas;
    if (phaserCanvas) {
      phaserCanvas.style.backgroundColor = '#1a1a1a';
      phaserCanvas.style.zIndex = '1';
      phaserCanvas.style.pointerEvents = 'auto';
    }
    
    // Remove event listeners
    this.scale.off('resize', this.handleResize);
    
    DebugConsole.info('SCENE', '🧹 3D Test Scene cleaned up');
    
    // Call parent destroy
    super.destroy();
  }
}
