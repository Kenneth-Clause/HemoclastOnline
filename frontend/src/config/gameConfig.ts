/**
 * Phaser game configuration for HemoclastOnline
 */

import { Types } from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { LoginScene } from '../scenes/LoginScene';
import { CharacterSelectionScene } from '../scenes/CharacterSelectionScene';
import { CharacterCreationScene } from '../scenes/CharacterCreationScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameScene } from '../scenes/GameScene';
import { Game3DTestScene } from '../scenes/Game3DTestScene';
import { UIScene } from '../scenes/UIScene';
import { CityScene } from '../scenes/CityScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { CreditsScene } from '../scenes/CreditsScene';

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Remove min/max constraints to allow true responsive scaling
    // min: {
    //   width: 1024,
    //   height: 768,
    // },
    // max: {
    //   width: 3840,
    //   height: 2160,
    // },
    zoom: 1,
    expandParent: false,
    autoRound: true,
  },
  
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  
  scene: [
    BootScene,
    LoginScene,
    CharacterSelectionScene,
    CharacterCreationScene,
    MenuScene,
    GameScene,
    Game3DTestScene,
    UIScene,
    CityScene,
    SettingsScene,
    CreditsScene,
  ],
  
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
    roundPixels: true,
    transparent: false,
    powerPreference: 'high-performance',
    batchSize: 4096,
    maxTextures: 16,
  },
  
  audio: {
    disableWebAudio: false,
  },
  
  input: {
    mouse: true,
    touch: true,
    smoothFactor: 0.2,
  },
  
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};
