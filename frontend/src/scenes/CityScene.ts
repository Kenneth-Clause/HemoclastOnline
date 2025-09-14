/**
 * City Scene - Town plaza with player presence
 */

import { Scene } from 'phaser';

export class CityScene extends Scene {
  constructor() {
    super({ key: 'CityScene' });
  }

  create() {
    const { width, height } = this.scale;
    
    // City placeholder
    this.add.rectangle(width / 2, height / 2, width, height, 0x3a2a1a);
    
    this.add.text(width / 2, height / 2, 'Town Plaza\n(Coming Soon)', {
      fontSize: '28px',
      color: '#ffaa00',
      align: 'center'
    }).setOrigin(0.5);
  }
}
