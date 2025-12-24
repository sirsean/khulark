import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainScene from './scenes/MainScene.js';
import CameraOverlay from './scenes/CameraOverlay.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  scale: {
    // Use FIT so the full vertical layout (title, bars, khulark, button)
    // is always visible, even on wide desktop viewports. This keeps the
    // mobile portrait aspect ratio but adds letterboxing on desktop
    // instead of cropping off the top/bottom.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, PreloadScene, MainScene, CameraOverlay],
  backgroundColor: '#EBE2D5' // Default cream color matching normal state
};

const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});
