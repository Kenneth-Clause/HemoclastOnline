/**
 * HemoclastOnline - Main Entry Point
 * Gothic Fantasy MMO-lite Frontend
 */

import { Game } from 'phaser';
import { gameConfig } from './config/gameConfig';
import { GameStore } from './stores/gameStore';
import './styles/main.css';

// Initialize game store
const gameStore = GameStore.getInstance();

// Initialize Phaser game
const game = new Game(gameConfig);

// Store game instance globally for access from scenes
(window as any).game = game;
(window as any).gameStore = gameStore;

// Hide initial loading screen once Phaser is ready
game.events.once('ready', () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
});

// Handle window resize with proper scaling and scene updates
const handleResize = () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;
  
  // Resize the game canvas
  game.scale.resize(newWidth, newHeight);
  
  // Notify all active scenes about the resize
  game.scene.scenes.forEach(scene => {
    if (scene.scene.isActive() && typeof (scene as any).handleResize === 'function') {
      (scene as any).handleResize(newWidth, newHeight);
    }
  });
};

// Debounce resize events for better performance
let resizeTimeout: NodeJS.Timeout;
const debouncedResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 100);
};

window.addEventListener('resize', debouncedResize);
window.addEventListener('orientationchange', () => {
  // Orientation change needs a slight delay
  setTimeout(debouncedResize, 200);
});

// Initial resize
handleResize();

console.log('🩸 HemoclastOnline initialized - Gothic Fantasy Awaits...');
