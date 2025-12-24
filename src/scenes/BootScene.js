import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load any boot assets here if needed
  }

  create() {
    // Start the preload scene
    this.scene.start('PreloadScene');
  }
}
