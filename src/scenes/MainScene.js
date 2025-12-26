import Phaser from 'phaser';
import GameState from '../state/GameState.js';
import MoodSystem from '../systems/MoodSystem.js';
import ParticleManager from '../systems/ParticleManager.js';
import AudioManager from '../systems/AudioManager.js';
import FeedingSystem from '../systems/FeedingSystem.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.gameState = new GameState();
    this.khularkSprite = null;
    this.statBars = {};
    this.lastFeedTime = 0;
    this.lastPetTime = 0;
    this.feedCooldownMs = 0;
    this.decayTimer = null;
    this.lastDecayTime = Date.now();
    this.particleManager = null;
    this.audioManager = null;
    this.idleTimer = null;
    this.buttons = {};
    this.lastMoodCheck = Date.now();
    this.currentBackgroundColor = null;
    this.feedingSystem = null;
    this.speechBubble = null;

    // Petting gesture state
    this.isPetting = false;
    this.petGesture = null;
    this.lastPurrSoundTime = 0;
    this.lastPurrVibrationTime = 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Load game state
    this.gameState.load();
    const stats = this.gameState.getKhularkStats();

    // Initialize managers
    this.particleManager = new ParticleManager(this);
    this.audioManager = new AudioManager(this, this.gameState);
    this.audioManager.init();
    this.feedingSystem = new FeedingSystem(this, this.gameState, this.audioManager);

    // Set initial background color based on body state
    const bodyState = MoodSystem.determineBodyState(stats.hunger);
    const bgColor = MoodSystem.getBackgroundColor(bodyState);
    this.currentBackgroundColor = bgColor;
    this.cameras.main.setBackgroundColor(bgColor);

    // Add title (FringeV2)
    this.add.text(width / 2, 70, 'KHULARK', {
      fontFamily: 'FringeV2',
      fontSize: '42px',
      fill: '#d97706',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Create stat bars
    this.createStatBars(width, stats);

    // Create khulark sprite in center
    const spriteKey = MoodSystem.getSpriteKey(bodyState);
    this.khularkSprite = this.add.image(width / 2, height / 2, spriteKey);
    this.khularkSprite.setScale(0.5); // Adjust scale as needed
    this.khularkSprite.setInteractive({ cursor: 'pointer' });

    // Pet interaction by rubbing back and forth on the khulark
    this.khularkSprite.on('pointerdown', (pointer) => this.startPetGesture(pointer));
    this.khularkSprite.on('pointermove', (pointer) => this.updatePetGesture(pointer));
    this.khularkSprite.on('pointerup', () => this.endPetGesture());
    this.khularkSprite.on('pointerupoutside', () => this.endPetGesture());
    this.khularkSprite.on('pointerout', () => this.endPetGesture());

    // Create interaction buttons
    this.createButtons(width, height);

    // Update body state
    this.gameState.setBodyState(bodyState);

    // Save state on page unload
    window.addEventListener('beforeunload', () => {
      this.gameState.save();
    });

    // Start passive decay timer (updates every 10 seconds)
    this.startPassiveDecay();

    // Start idle animation system
    this.startIdleAnimations();
  }

  startPassiveDecay() {
    // Update stats every 10 seconds
    this.decayTimer = this.time.addEvent({
      delay: 10000, // 10 seconds
      callback: this.applyPassiveDecay,
      callbackScope: this,
      loop: true
    });
  }

  applyPassiveDecay() {
    const now = Date.now();
    const elapsedMs = now - this.lastDecayTime;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    // Decay rates per hour (same as GameState)
    const HUNGER_DECAY = 10;
    const AFFECTION_DECAY = 5;
    const SANITY_DECAY = 3;

    // Calculate decay amounts
    const hungerDecay = HUNGER_DECAY * elapsedHours;
    const affectionDecay = AFFECTION_DECAY * elapsedHours;
    const sanityDecay = SANITY_DECAY * elapsedHours;

    // Apply decay (negative values to decrease)
    this.gameState.modifyStat('hunger', -hungerDecay);
    this.gameState.modifyStat('affection', -affectionDecay);
    this.gameState.modifyStat('sanity', -sanityDecay);

    // Update UI
    const stats = this.gameState.getKhularkStats();
    this.updateStatBars(stats);
    this.updateKhularkSprite(stats.hunger);

    // Update last decay time
    this.lastDecayTime = now;
  }

  shutdown() {
    // Clean up timer when scene is destroyed
    if (this.decayTimer) {
      this.decayTimer.remove();
      this.decayTimer = null;
    }
  }

  destroy() {
    // Clean up timers when scene is destroyed
    if (this.decayTimer) {
      this.decayTimer.remove();
      this.decayTimer = null;
    }
    if (this.idleTimer) {
      this.idleTimer.remove();
      this.idleTimer = null;
    }
    if (this.audioManager) {
      this.audioManager.destroy();
    }
    super.destroy();
  }

  createStatBars(width, stats) {
    const barWidth = 300;
    const barHeight = 20;
    const startY = 120;
    const spacing = 40;

    const statConfig = [
      { name: 'hunger', label: 'Hunger', color: 0xff6b6b, value: stats.hunger, buttonColor: 0x8b4513 },
      { name: 'affection', label: 'Affection', color: 0xff69b4, value: stats.affection, buttonColor: 0x6b4423 },
      { name: 'sanity', label: 'Sanity', color: 0xa3e635, value: stats.sanity }
    ];

    statConfig.forEach((stat, index) => {
      const y = startY + (index * spacing);

      // Label (FringeV2 for stats)
      this.add.text(width / 2 - barWidth / 2, y - 20, stat.label, {
        font: '16px "FringeV2", monospace',
        fill: '#000000'
      });

      // Bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0xe8dcc8, 1);
      barBg.fillRect(width / 2 - barWidth / 2, y, barWidth, barHeight);

      // Bar fill
      const barFill = this.add.graphics();
      barFill.fillStyle(stat.color, 1);
      const fillWidth = (stat.value / 100) * barWidth;
      barFill.fillRect(width / 2 - barWidth / 2, y, fillWidth, barHeight);

      // Value text (FringeV2 for stat values)
      const valueText = this.add.text(width / 2 + barWidth / 2 + 10, y + barHeight / 2, 
        Math.round(stat.value) + '%', {
        font: '14px "FringeV2", monospace',
        fill: '#000000'
      }).setOrigin(1, 0.5);

      this.statBars[stat.name] = { 
        barFill, 
        valueText, 
        barWidth, 
        x: width / 2 - barWidth / 2, 
        y, 
        color: stat.color,
        baseColor: stat.color,
        currentWidth: fillWidth,
        isPulsing: false
      };
    });
  }

  createButtons(width, height) {
    const buttonY = height - 150;
    const buttonWidth = 200;
    const buttonHeight = 60;

    // Feed button - weathered rust/copper color
    const feedBtn = this.createButton(width / 2, buttonY, buttonWidth, buttonHeight, 'FEED', 0x8b4513);
    feedBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.handleFeed();
    });
    this.buttons.feed = feedBtn;

    // No dedicated PET button anymore; petting is done directly on the khulark sprite.
  }

  createButton(x, y, width, height, text, color) {
    const button = this.add.container(x, y);

    // Button background - use weathered metal style
    const bg = this.add.graphics();
    this.redrawButton(bg, width, height, color, 1.0);

    // Cooldown overlay (initially hidden)
    const cooldownOverlay = this.add.graphics();
    cooldownOverlay.setVisible(false);

    // Cooldown text (FringeV2)
    const cooldownText = this.add.text(0, 20, '', {
      font: '18px "FringeV2", monospace',
      fill: '#ffffff'
    }).setOrigin(0.5).setVisible(false);

    // Button text with retro styling (FringeV2)
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'FringeV2',
      fontSize: '26px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    button.add([bg, cooldownOverlay, buttonText, cooldownText]);
    button.setSize(width, height);
    button.setInteractive({ cursor: 'pointer' });

    // Store references for cooldown
    button.setData('bg', bg);
    button.setData('cooldownOverlay', cooldownOverlay);
    button.setData('cooldownText', cooldownText);
    button.setData('buttonText', buttonText);
    button.setData('baseColor', color);
    button.setData('width', width);
    button.setData('height', height);

    // Hover effect
    button.on('pointerover', () => {
      if (!button.getData('onCooldown')) {
        this.redrawButton(bg, width, height, color, 0.85);
      }
    });

    button.on('pointerout', () => {
      if (!button.getData('onCooldown')) {
        this.redrawButton(bg, width, height, color, 1.0);
      }
    });

    return button;
  }

  redrawButton(bg, width, height, color, alpha = 1.0) {
    bg.clear();
    
    // Base metal color (darker)
    const baseColor = this.darkenColor(color, 0.3);
    bg.fillStyle(baseColor, alpha);
    bg.fillRect(-width / 2, -height / 2, width, height);
    
    // Main button body with slight gradient effect (lighter center)
    bg.fillStyle(color, alpha);
    bg.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
    
    // Add weathering/patina spots
    this.addWeathering(bg, width, height, alpha);
    
    // Chunky outer border (dark metal edge)
    bg.lineStyle(5, 0x1a1a1a, 1);
    bg.strokeRect(-width / 2, -height / 2, width, height);
    
    // Inner worn edge (lighter, showing wear)
    bg.lineStyle(1, 0x4a3820, alpha * 0.8);
    bg.strokeRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6);
    
    // Highlight edge (top-left, simulating light)
    bg.lineStyle(2, 0xd4a574, alpha * 0.5);
    bg.beginPath();
    bg.moveTo(-width / 2 + 5, -height / 2 + 5);
    bg.lineTo(width / 2 - 5, -height / 2 + 5);
    bg.strokePath();
    bg.beginPath();
    bg.moveTo(-width / 2 + 5, -height / 2 + 5);
    bg.lineTo(-width / 2 + 5, height / 2 - 5);
    bg.strokePath();
    
    // Shadow edge (bottom-right)
    bg.lineStyle(2, 0x2a1a0a, alpha * 0.6);
    bg.beginPath();
    bg.moveTo(-width / 2 + 5, height / 2 - 5);
    bg.lineTo(width / 2 - 5, height / 2 - 5);
    bg.strokePath();
    bg.beginPath();
    bg.moveTo(width / 2 - 5, -height / 2 + 5);
    bg.lineTo(width / 2 - 5, height / 2 - 5);
    bg.strokePath();
    
    // Corner rivets/screws (darker, more industrial)
    const cornerSize = 7;
    const inset = 12;
    
    // Draw all 4 corner rivets
    const corners = [
      [-width / 2 + inset, -height / 2 + inset],
      [width / 2 - inset, -height / 2 + inset],
      [-width / 2 + inset, height / 2 - inset],
      [width / 2 - inset, height / 2 - inset]
    ];
    
    corners.forEach(([x, y]) => {
      // Outer dark ring
      bg.fillStyle(0x0a0a0a, 1);
      bg.fillCircle(x, y, cornerSize);
      // Inner metal ring
      bg.fillStyle(0x3a3a3a, alpha);
      bg.fillCircle(x, y, cornerSize - 1.5);
      // Center (screw slot)
      bg.lineStyle(1.5, 0x1a1a1a, 1);
      bg.beginPath();
      bg.moveTo(x - 3, y);
      bg.lineTo(x + 3, y);
      bg.strokePath();
    });
  }
  
  darkenColor(color, amount) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    const newR = Math.floor(r * (1 - amount));
    const newG = Math.floor(g * (1 - amount));
    const newB = Math.floor(b * (1 - amount));
    
    return (newR << 16) | (newG << 8) | newB;
  }
  
  addWeathering(bg, width, height, alpha) {
    // Add random patina/wear spots
    const spots = [
      { x: -width / 4, y: -height / 4, size: 8, color: 0x4a3820 },
      { x: width / 3, y: height / 4, size: 6, color: 0x6b5020 },
      { x: -width / 3, y: height / 3, size: 5, color: 0x5a4520 },
      { x: width / 4, y: -height / 3, size: 7, color: 0x3a2810 },
      { x: 0, y: height / 5, size: 4, color: 0x7a5520 }
    ];
    
    spots.forEach(spot => {
      bg.fillStyle(spot.color, alpha * 0.4);
      bg.fillCircle(spot.x, spot.y, spot.size);
      // Add smaller highlight within spot for depth
      bg.fillStyle(spot.color, alpha * 0.2);
      bg.fillCircle(spot.x + 1, spot.y - 1, spot.size * 0.6);
    });
    
    // Add some scratches
    bg.lineStyle(1, 0x2a2a2a, alpha * 0.3);
    bg.beginPath();
    bg.moveTo(-width / 3, -height / 4);
    bg.lineTo(-width / 4, -height / 3.5);
    bg.strokePath();
    
    bg.beginPath();
    bg.moveTo(width / 4, height / 3);
    bg.lineTo(width / 3, height / 4);
    bg.strokePath();
  }

  handleFeed() {
    const now = Date.now();
    const cooldown = this.feedCooldownMs || 0;

    if (cooldown > 0 && this.lastFeedTime > 0 && now - this.lastFeedTime < cooldown) {
      const remainingMs = cooldown - (now - this.lastFeedTime);
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      this.showFeedback(`Too soon! Wait ${remainingSec}s...`, 0xff6b6b);
      this.audioManager.playWarning();
      return;
    }

    // Play click sound
    this.audioManager.playClick();

    // Launch camera overlay
    this.scene.launch('CameraOverlay', {
      onPhoto: (imageBlob) => this.onPhotoTaken(imageBlob),
    });
  }

  async onPhotoTaken(imageBlob) {
    // Set last feed time to start cooldown
    this.lastFeedTime = Date.now();

    // Upload and process photo
    const response = await this.feedingSystem.uploadPhoto(imageBlob);

    // Determine dynamic cooldown based on how strong the stat changes were
    const hungerDelta = response.hunger || 0;
    const affectionDelta = response.affection || 0;
    const sanityDelta = response.sanity || 0;
    const totalDeltaMagnitude = Math.abs(hungerDelta + affectionDelta + sanityDelta);

    // Map totalDeltaMagnitude to a cooldown between 1s and 10s
    const MIN_COOLDOWN_MS = 1000;
    const MAX_COOLDOWN_MS = 10000;
    const MAX_DELTA_FOR_SCALING = 30; // >= this treated as "very strong" interaction

    const t = Math.max(0, Math.min(1, totalDeltaMagnitude / MAX_DELTA_FOR_SCALING));
    const cooldownMs = Math.round(MIN_COOLDOWN_MS + (MAX_COOLDOWN_MS - MIN_COOLDOWN_MS) * t);
    this.feedCooldownMs = cooldownMs;

    // Update UI with response
    const stats = this.gameState.getKhularkStats();
    this.updateStatBars(stats);
    this.updateKhularkSprite(stats.hunger);

    // Show speech bubble and alert
    this.showSpeechBubble(response.speech);
    this.showFeedback(response.alertText, 0xffa500);

    // Animate khulark
    this.animateKhulark('feed');

    // Show stat changes
    const spriteX = this.khularkSprite.x;
    const spriteY = this.khularkSprite.y;
    if (response.hunger) {
      this.particleManager.emitStatChange(spriteX - 30, spriteY - 80, 
        (response.hunger > 0 ? '+' : '') + response.hunger, 
        response.hunger > 0 ? '#00ff00' : '#ff6b6b');
    }
    if (response.affection) {
      this.particleManager.emitStatChange(spriteX, spriteY - 90,
        (response.affection > 0 ? '+' : '') + response.affection,
        response.affection > 0 ? '#ff69b4' : '#ff6b6b');
    }
    if (response.sanity) {
      this.particleManager.emitStatChange(spriteX + 30, spriteY - 80,
        (response.sanity > 0 ? '+' : '') + response.sanity,
        response.sanity > 0 ? '#a3e635' : '#ff6b6b');
    }

    // Show cooldown based on computed value (short for small changes, longer for big ones)
    this.showButtonCooldown(this.buttons.feed, this.feedCooldownMs);
  }

  handlePet() {
    const now = Date.now();
    const cooldown = 15000; // 15 seconds

    if (now - this.lastPetTime < cooldown) {
      this.showFeedback('Give them space...', 0xff69b4);
      this.audioManager.playWarning();
      this.animatePetCooldownWiggle();
      return;
    }

    this.lastPetTime = now;

    const affectionAmount = 10;
    const sanityAmount = affectionAmount / 2;

    const affectionResult = this.gameState.modifyStat('affection', affectionAmount);
    if (affectionResult) {
      this.tweenStat('affection', affectionResult.oldValue, affectionResult.newValue);
    }

    const sanityResult = this.gameState.modifyStat('sanity', sanityAmount);
    if (sanityResult) {
      this.tweenStat('sanity', sanityResult.oldValue, sanityResult.newValue);
    }
    
    // Particles and audio
    const spriteX = this.khularkSprite.x;
    const spriteY = this.khularkSprite.y;
    this.particleManager.emitHearts(spriteX, spriteY - 50);
    this.particleManager.emitStatChange(spriteX, spriteY - 80, `+${affectionAmount}`, '#ff69b4');
    this.particleManager.emitStatChange(spriteX + 30, spriteY - 80, `+${sanityAmount}`, '#a3e635');
    this.particleManager.emitRipple(spriteX, spriteY);
    this.audioManager.playPet();
    
    this.animateKhulark('pet');
    this.triggerHapticFeedback();
    
    // If we ever reintroduce a PET button, keep cooldown visuals guarded
    if (this.buttons.pet) {
      this.showButtonCooldown(this.buttons.pet, cooldown);
    }
  }

  startPetGesture(pointer) {
    this.isPetting = true;

    const x = pointer.worldX ?? pointer.x;
    const y = pointer.worldY ?? pointer.y;

    this.petGesture = {
      lastX: x,
      lastY: y,
      lastDirection: 0,
      directionChanges: 0,
      totalDistance: 0,
      triggered: false,
      startedAt: Date.now(),
    };
  }

  updatePetGesture(pointer) {
    if (!this.isPetting || !this.petGesture) return;

    const x = pointer.worldX ?? pointer.x;
    const y = pointer.worldY ?? pointer.y;

    const dx = x - this.petGesture.lastX;
    const dy = y - this.petGesture.lastY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 3) {
      // Ignore tiny jitter
      return;
    }

    // Continuous purr feedback while rubbing (independent of affection cooldown)
    const now = Date.now();
    const SOUND_INTERVAL = 200; // ms between purr sound bursts
    const VIBE_INTERVAL = 150;  // ms between vibration pulses

    if (now - this.lastPurrSoundTime > SOUND_INTERVAL) {
      this.lastPurrSoundTime = now;
      this.audioManager.playPet();
    }

    if (now - this.lastPurrVibrationTime > VIBE_INTERVAL) {
      this.lastPurrVibrationTime = now;
      this.triggerHapticFeedback();
    }

    this.petGesture.totalDistance += distance;

    const absDx = Math.abs(dx);
    if (absDx > 5) {
      const dir = dx > 0 ? 1 : -1;
      if (this.petGesture.lastDirection !== 0 && dir !== this.petGesture.lastDirection) {
        this.petGesture.directionChanges += 1;
      }
      this.petGesture.lastDirection = dir;
    }

    this.petGesture.lastX = x;
    this.petGesture.lastY = y;

    const MIN_DISTANCE = 40; // total pixels moved
    const MIN_DIRECTION_CHANGES = 2; // back-and-forth

    if (!this.petGesture.triggered &&
        this.petGesture.totalDistance > MIN_DISTANCE &&
        this.petGesture.directionChanges >= MIN_DIRECTION_CHANGES) {
      this.petGesture.triggered = true;
      this.handlePet();
    }
  }

  endPetGesture() {
    this.isPetting = false;
    this.petGesture = null;
  }

  triggerHapticFeedback() {
    // Try to vibrate the device on supported browsers (e.g. mobile)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        // Short purr-like vibration pattern
        navigator.vibrate([20, 40, 20]);
      }
    } catch (e) {
      // Ignore vibration errors/failures
    }
  }

  updateStatBars(stats) {
    ['hunger', 'affection', 'sanity'].forEach(statName => {
      const bar = this.statBars[statName];
      if (bar) {
        const value = stats[statName];
        const fillWidth = (value / 100) * bar.barWidth;
        
        // Get color based on stat level
        const color = this.getStatColor(value, bar.baseColor);
        
        // Animate to new width if it has a currentWidth property
        if (bar.currentWidth === undefined) {
          bar.currentWidth = fillWidth;
        }
        
        // Tween the bar width
        this.tweens.add({
          targets: bar,
          currentWidth: fillWidth,
          duration: 800,
          ease: 'Cubic.easeOut',
          onUpdate: () => {
            bar.barFill.clear();
            bar.barFill.fillStyle(color, 1);
            bar.barFill.fillRect(bar.x, bar.y, bar.currentWidth, 20);
          }
        });
        
        bar.valueText.setText(Math.round(value) + '%');
        
        // Pulse effect if stat is critical
        if (value < 20 && !bar.isPulsing) {
          bar.isPulsing = true;
          this.tweens.add({
            targets: bar.valueText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        } else if (value >= 20 && bar.isPulsing) {
          bar.isPulsing = false;
          this.tweens.killTweensOf(bar.valueText);
          bar.valueText.setScale(1);
        }
      }
    });
  }

  updateKhularkSprite(hunger) {
    const bodyState = MoodSystem.determineBodyState(hunger);
    const spriteKey = MoodSystem.getSpriteKey(bodyState);
    
    if (this.khularkSprite.texture.key !== spriteKey) {
      this.khularkSprite.setTexture(spriteKey);
      this.gameState.setBodyState(bodyState);
      
      // Transition background color to match new state
      this.transitionBackgroundColor(bodyState);
    }
  }

  animateKhulark(type) {
    if (type === 'feed') {
      // Squash and stretch for eating
      this.tweens.add({
        targets: this.khularkSprite,
        scaleX: 0.45,
        scaleY: 0.55,
        duration: 80,
        yoyo: true,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: this.khularkSprite,
            scaleX: 0.52,
            scaleY: 0.48,
            duration: 120,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        }
      });
    } else if (type === 'pet') {
      // Gentle sway for petting
      this.tweens.add({
        targets: this.khularkSprite,
        angle: -5,
        scaleX: 0.52,
        scaleY: 0.52,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.khularkSprite.angle = 0;
        }
      });
    } else {
      // Default bounce
      this.tweens.add({
        targets: this.khularkSprite,
        scaleX: 0.55,
        scaleY: 0.55,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  animatePetCooldownWiggle() {
    if (!this.khularkSprite) return;

    this.tweens.add({
      targets: this.khularkSprite,
      angle: { from: -7, to: 7 },
      duration: 100,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.khularkSprite.angle = 0;
      }
    });
  }

  showFeedback(text, color) {
    const width = this.cameras.main.width;
    const feedbackText = this.add.text(width / 2, 350, text, {
      fontFamily: 'FringeV2',
      fontSize: '20px',
      fill: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: width - 120 },
    }).setOrigin(0.5);
    feedbackText.setDepth(950); // Below speech bubble but above most things

    // Keep visible for 6 seconds, then fade out over 2 seconds
    this.time.delayedCall(6000, () => {
      this.tweens.add({
        targets: feedbackText,
        alpha: 0,
        y: 320,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => feedbackText.destroy()
      });
    });
  }

  startIdleAnimations() {
    // Start idle animation loop
    this.idleTimer = this.time.addEvent({
      delay: 3000 + Math.random() * 4000, // 3-7 seconds
      callback: this.playIdleAnimation,
      callbackScope: this,
      loop: true
    });
  }

  playIdleAnimation() {
    if (!this.khularkSprite) return;

    const stats = this.gameState.getKhularkStats();
    const mood = MoodSystem.getMoodDescription(stats.hunger, stats.affection, stats.sanity);

    // Different idle behaviors based on mood
    if (mood === 'critical' || mood === 'distressed') {
      // Sad/distressed idle - slow breathing, occasional droop
      this.tweens.add({
        targets: this.khularkSprite,
        scaleY: 0.48,
        y: this.khularkSprite.y + 5,
        duration: 1500,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    } else if (mood === 'content') {
      // Happy idle - bounce or wiggle
      const random = Math.random();
      if (random < 0.5) {
        // Little bounce
        this.tweens.add({
          targets: this.khularkSprite,
          y: this.khularkSprite.y - 20,
          duration: 300,
          yoyo: true,
          ease: 'Quad.easeOut'
        });
      } else {
        // Wiggle
        this.tweens.add({
          targets: this.khularkSprite,
          angle: 5,
          duration: 200,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.khularkSprite.angle = 0;
          }
        });
      }
    } else {
      // Neutral idle - gentle breathing
      this.tweens.add({
        targets: this.khularkSprite,
        scaleY: 0.51,
        duration: 2000,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Check for critical stats and show warnings
    this.checkCriticalStats(stats);
  }

  checkCriticalStats(stats) {
    const now = Date.now();
    if (now - this.lastMoodCheck < 30000) return; // Check every 30 seconds

    if (stats.hunger < 20 || stats.affection < 20 || stats.sanity < 20) {
      this.lastMoodCheck = now;
      this.particleManager.emitWarningPulse(
        this.khularkSprite.x,
        this.khularkSprite.y
      );
      this.screenShake();
      
      // Add tint to sprite
      this.tweens.add({
        targets: this.khularkSprite,
        tint: 0xff6666,
        duration: 200,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          this.khularkSprite.clearTint();
        }
      });
    }
  }

  getStatColor(value, baseColor) {
    // Return color based on stat value
    if (value >= 70) {
      return 0x00ff00; // Green
    } else if (value >= 40) {
      return baseColor; // Original color
    } else if (value >= 20) {
      return 0xffa500; // Orange
    } else {
      return 0xff0000; // Red
    }
  }

  screenShake() {
    // Shake the camera
    this.cameras.main.shake(200, 0.005);
  }

  flashScreen(color = 0xffffff, duration = 100) {
    const flash = this.add.graphics();
    flash.fillStyle(color, 0.3);
    flash.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    flash.setDepth(1000);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy()
    });
  }

  showSpeechBubble(text) {
    // Destroy existing speech bubble if any
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
    }

    const spriteX = this.khularkSprite.x;
    const spriteY = this.khularkSprite.y;
    const bubbleWidth = 400;
    const bubbleHeight = 120;
    const bubbleX = spriteX;
    const bubbleY = spriteY + 180; // Moved below khulark

    // Create container for speech bubble
    this.speechBubble = this.add.container(bubbleX, bubbleY);
    this.speechBubble.setDepth(900);

    // Draw retro-styled speech bubble
    const bubble = this.add.graphics();
    
    // Main bubble body
    bubble.fillStyle(0x2a2a2a, 1);
    bubble.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
    
    // Border
    bubble.lineStyle(4, 0xd97706, 1);
    bubble.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
    
    // Inner border
    bubble.lineStyle(2, 0x6b5020, 0.8);
    bubble.strokeRoundedRect(-bubbleWidth / 2 + 4, -bubbleHeight / 2 + 4, bubbleWidth - 8, bubbleHeight - 8, 6);
    
    // Pointer to khulark (now pointing up)
    bubble.fillStyle(0x2a2a2a, 1);
    bubble.fillTriangle(0, -bubbleHeight / 2 + 2, -15, -bubbleHeight / 2 - 15, 15, -bubbleHeight / 2 - 15);
    bubble.lineStyle(4, 0xd97706, 1);
    bubble.strokeTriangle(0, -bubbleHeight / 2 + 2, -15, -bubbleHeight / 2 - 15, 15, -bubbleHeight / 2 - 15);

    // Text (FringeV2 for speech)
    const speechText = this.add.text(0, 0, text, {
      font: '18px "FringeV2", monospace',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: bubbleWidth - 40 },
    });
    speechText.setOrigin(0.5);

    // Add to container
    this.speechBubble.add([bubble, speechText]);

    // Fade in animation
    this.speechBubble.setAlpha(0);
    this.tweens.add({
      targets: this.speechBubble,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.easeOut',
    });

    // Make interactive to dismiss
    bubble.setInteractive(
      new Phaser.Geom.Rectangle(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight),
      Phaser.Geom.Rectangle.Contains
    );
    bubble.on('pointerdown', () => this.hideSpeechBubble());

    // Auto-dismiss after 8 seconds (longer to read both speech and alert)
    this.time.delayedCall(8000, () => this.hideSpeechBubble());
  }

  hideSpeechBubble() {
    if (!this.speechBubble) return;

    this.tweens.add({
      targets: this.speechBubble,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (this.speechBubble) {
          this.speechBubble.destroy();
          this.speechBubble = null;
        }
      },
    });
  }

  transitionBackgroundColor(bodyState) {
    const targetColor = MoodSystem.getBackgroundColor(bodyState);
    
    // Skip if already at target color
    if (this.currentBackgroundColor === targetColor) return;
    
    // Parse hex colors to RGB
    const fromRGB = this.hexToRgb(this.currentBackgroundColor);
    const toRGB = this.hexToRgb(targetColor);
    
    if (!fromRGB || !toRGB) return;
    
    // Create temp object for tweening
    const colorTween = { r: fromRGB.r, g: fromRGB.g, b: fromRGB.b };
    
    this.tweens.add({
      targets: colorTween,
      r: toRGB.r,
      g: toRGB.g,
      b: toRGB.b,
      duration: 1200,
      ease: 'Cubic.easeInOut',
      onUpdate: () => {
        const r = Math.round(colorTween.r);
        const g = Math.round(colorTween.g);
        const b = Math.round(colorTween.b);
        const hexColor = this.rgbToHex(r, g, b);
        this.cameras.main.setBackgroundColor(hexColor);
      },
      onComplete: () => {
        this.currentBackgroundColor = targetColor;
      }
    });
  }
  
  hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    
    return { r, g, b };
  }
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  tweenStat(statName, fromValue, toValue) {
    const bar = this.statBars[statName];
    if (!bar) return;

    // Create a temp object to tween
    const tempStat = { value: fromValue };

    this.tweens.add({
      targets: tempStat,
      value: toValue,
      duration: 1400,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const fillWidth = (tempStat.value / 100) * bar.barWidth;
        const color = this.getStatColor(tempStat.value, bar.baseColor);
        
        bar.barFill.clear();
        bar.barFill.fillStyle(color, 1);
        bar.barFill.fillRect(bar.x, bar.y, fillWidth, 20);
        
        bar.valueText.setText(Math.round(tempStat.value) + '%');
        
        // Update currentWidth for consistency
        bar.currentWidth = fillWidth;
      }
    });
  }

  showButtonCooldown(button, cooldownMs) {
    if (!button) return;

    const bg = button.getData('bg');
    const overlay = button.getData('cooldownOverlay');
    const cooldownText = button.getData('cooldownText');
    const width = button.getData('width');
    const height = button.getData('height');
    const baseColor = button.getData('baseColor');

    // Mark button as on cooldown
    button.setData('onCooldown', true);
    button.disableInteractive();

    // Gray out button with retro style
    this.redrawButton(bg, width, height, 0x555555, 0.8);

    // Show cooldown overlay
    overlay.setVisible(true);
    cooldownText.setVisible(true);

    const startTime = Date.now();
    const updateInterval = 100;

    const updateCooldown = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, cooldownMs - elapsed);
      const progress = 1 - (remaining / cooldownMs);

      if (remaining <= 0) {
        // Cooldown complete
        button.setData('onCooldown', false);
        button.setInteractive();
        overlay.setVisible(false);
        cooldownText.setVisible(false);
        
        // Restore button appearance
        this.redrawButton(bg, width, height, baseColor, 1.0);
        return;
      }

      // Update cooldown display
      const seconds = Math.ceil(remaining / 1000);
      cooldownText.setText(String(seconds));

      // Draw progress overlay (fills from top down)
      overlay.clear();
      overlay.fillStyle(0x000000, 0.5);
      const fillHeight = height * (1 - progress);
      overlay.fillRect(-width / 2, -height / 2, width, fillHeight);

      // Schedule next update
      this.time.delayedCall(updateInterval, updateCooldown);
    };

    updateCooldown();
  }
}
