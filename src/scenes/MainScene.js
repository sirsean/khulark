import Phaser from 'phaser';
import GameState from '../state/GameState.js';
import MoodSystem from '../systems/MoodSystem.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.gameState = new GameState();
    this.khularkSprite = null;
    this.statBars = {};
    this.lastFeedTime = 0;
    this.lastPetTime = 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Load game state
    this.gameState.load();
    const stats = this.gameState.getKhularkStats();

    // Background color
    this.cameras.main.setBackgroundColor('#e8dcc8');

    // Add title
    this.add.text(width / 2, 50, 'KHULARK', {
      font: 'bold 40px monospace',
      fill: '#d97706',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Create stat bars
    this.createStatBars(width, stats);

    // Create khulark sprite in center
    const bodyState = MoodSystem.determineBodyState(stats.hunger);
    const spriteKey = MoodSystem.getSpriteKey(bodyState);
    this.khularkSprite = this.add.image(width / 2, height / 2, spriteKey);
    this.khularkSprite.setScale(0.5); // Adjust scale as needed
    this.khularkSprite.setInteractive({ cursor: 'pointer' });

    // Pet interaction on sprite click
    this.khularkSprite.on('pointerdown', () => this.handlePet());

    // Create interaction buttons
    this.createButtons(width, height);

    // Update body state
    this.gameState.setBodyState(bodyState);

    // Save state on page unload
    window.addEventListener('beforeunload', () => {
      this.gameState.save();
    });
  }

  createStatBars(width, stats) {
    const barWidth = 300;
    const barHeight = 20;
    const startY = 120;
    const spacing = 40;

    const statConfig = [
      { name: 'hunger', label: 'Hunger', color: 0xff6b6b, value: stats.hunger },
      { name: 'affection', label: 'Affection', color: 0xff69b4, value: stats.affection },
      { name: 'sanity', label: 'Sanity', color: 0x69b4ff, value: stats.sanity }
    ];

    statConfig.forEach((stat, index) => {
      const y = startY + (index * spacing);

      // Label
      this.add.text(width / 2 - barWidth / 2, y - 20, stat.label, {
        font: '16px monospace',
        fill: '#000000'
      });

      // Bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0xccbaa8, 1);
      barBg.fillRect(width / 2 - barWidth / 2, y, barWidth, barHeight);

      // Bar fill
      const barFill = this.add.graphics();
      barFill.fillStyle(stat.color, 1);
      const fillWidth = (stat.value / 100) * barWidth;
      barFill.fillRect(width / 2 - barWidth / 2, y, fillWidth, barHeight);

      // Value text
      const valueText = this.add.text(width / 2 + barWidth / 2 + 10, y + barHeight / 2, 
        Math.round(stat.value) + '%', {
        font: '14px monospace',
        fill: '#000000'
      }).setOrigin(0, 0.5);

      this.statBars[stat.name] = { barFill, valueText, barWidth, x: width / 2 - barWidth / 2, y, color: stat.color };
    });
  }

  createButtons(width, height) {
    const buttonY = height - 150;
    const buttonWidth = 200;
    const buttonHeight = 60;

    // Feed button
    const feedBtn = this.createButton(width / 2 - 110, buttonY, buttonWidth, buttonHeight, 'FEED', 0xff6b6b);
    feedBtn.on('pointerdown', () => this.handleFeed());

    // Pet button
    const petBtn = this.createButton(width / 2 + 110, buttonY, buttonWidth, buttonHeight, 'PET', 0xff69b4);
    petBtn.on('pointerdown', () => this.handlePet());
  }

  createButton(x, y, width, height, text, color) {
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.lineStyle(3, 0xffffff, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      font: 'bold 24px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(width, height);
    button.setInteractive({ cursor: 'pointer' });

    // Hover effect
    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.lineStyle(3, 0xffffff, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.lineStyle(3, 0xffffff, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    return button;
  }

  handleFeed() {
    const now = Date.now();
    const cooldown = 30000; // 30 seconds

    if (now - this.lastFeedTime < cooldown) {
      this.showFeedback('Too soon! Wait a bit...', 0xff6b6b);
      return;
    }

    this.lastFeedTime = now;
    this.gameState.modifyStat('hunger', 20);
    
    const stats = this.gameState.getKhularkStats();
    this.updateStatBars(stats);
    this.updateKhularkSprite(stats.hunger);
    
    this.showFeedback('+20 Hunger!', 0x00ff00);
    this.animateKhulark('feed');
  }

  handlePet() {
    const now = Date.now();
    const cooldown = 15000; // 15 seconds

    if (now - this.lastPetTime < cooldown) {
      this.showFeedback('Give them space...', 0xff69b4);
      return;
    }

    this.lastPetTime = now;
    this.gameState.modifyStat('affection', 10);
    
    const stats = this.gameState.getKhularkStats();
    this.updateStatBars(stats);
    
    this.showFeedback('+10 Affection!', 0x00ff00);
    this.animateKhulark('pet');
  }

  updateStatBars(stats) {
    ['hunger', 'affection', 'sanity'].forEach(statName => {
      const bar = this.statBars[statName];
      if (bar) {
        const value = stats[statName];
        const fillWidth = (value / 100) * bar.barWidth;
        
        bar.barFill.clear();
        bar.barFill.fillStyle(bar.color, 1);
        bar.barFill.fillRect(bar.x, bar.y, fillWidth, 20);
        
        bar.valueText.setText(Math.round(value) + '%');
      }
    });
  }

  updateKhularkSprite(hunger) {
    const bodyState = MoodSystem.determineBodyState(hunger);
    const spriteKey = MoodSystem.getSpriteKey(bodyState);
    
    if (this.khularkSprite.texture.key !== spriteKey) {
      this.khularkSprite.setTexture(spriteKey);
      this.gameState.setBodyState(bodyState);
    }
  }

  animateKhulark(type) {
    // Simple bounce animation
    this.tweens.add({
      targets: this.khularkSprite,
      scaleX: 0.55,
      scaleY: 0.55,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  showFeedback(text, color) {
    const width = this.cameras.main.width;
    const feedbackText = this.add.text(width / 2, 350, text, {
      font: 'bold 20px monospace',
      fill: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: feedbackText,
      alpha: 0,
      y: 300,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => feedbackText.destroy()
    });
  }
}
