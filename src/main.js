import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainScene from './scenes/MainScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, PreloadScene, MainScene],
  backgroundColor: '#e8dcc8'
};

const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});
