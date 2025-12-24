export default class AudioManager {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.sounds = {};
    this.ambientMusic = null;
    this.isEnabled = true;
  }

  /**
   * Initialize audio manager and load sound settings
   */
  init() {
    // Get sound enabled setting from game state
    const state = this.gameState.state;
    if (state && state.player && state.player.settings) {
      this.isEnabled = state.player.settings.soundEnabled !== false;
    }
  }

  /**
   * Play a sound effect
   */
  playSound(key, volume = 1.0) {
    if (!this.isEnabled) return;

    try {
      if (this.sounds[key]) {
        this.sounds[key].play({ volume });
      }
    } catch (error) {
      console.warn(`Failed to play sound: ${key}`, error);
    }
  }

  /**
   * Play UI click sound
   */
  playClick() {
    // Since we don't have audio files yet, we can use Phaser's built-in Web Audio
    // to generate simple beep sounds as placeholders
    if (!this.isEnabled) return;
    
    try {
      // Create a simple beep using Web Audio API
      const context = this.scene.sound.context;
      if (!context) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.05);
    } catch (error) {
      console.warn('Failed to play click sound', error);
    }
  }

  /**
   * Play feed success sound
   */
  playFeed() {
    if (!this.isEnabled) return;
    
    try {
      const context = this.scene.sound.context;
      if (!context) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Ascending tone for positive feedback
      oscillator.frequency.setValueAtTime(400, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.15, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.15);
    } catch (error) {
      console.warn('Failed to play feed sound', error);
    }
  }

  /**
   * Play pet success sound
   */
  playPet() {
    if (!this.isEnabled) return;
    
    try {
      const context = this.scene.sound.context;
      if (!context) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Gentle tone for petting
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.12, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.2);
    } catch (error) {
      console.warn('Failed to play pet sound', error);
    }
  }

  /**
   * Play warning/error sound
   */
  playWarning() {
    if (!this.isEnabled) return;
    
    try {
      const context = this.scene.sound.context;
      if (!context) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Low tone for warning
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } catch (error) {
      console.warn('Failed to play warning sound', error);
    }
  }

  /**
   * Start ambient music loop
   */
  startAmbient() {
    // Placeholder for when we have actual audio files
    // For now, we'll skip ambient to avoid annoying beeps
  }

  /**
   * Stop ambient music
   */
  stopAmbient() {
    if (this.ambientMusic && this.ambientMusic.isPlaying) {
      this.ambientMusic.stop();
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound() {
    this.isEnabled = !this.isEnabled;
    
    // Update game state
    if (this.gameState.state && this.gameState.state.player && this.gameState.state.player.settings) {
      this.gameState.state.player.settings.soundEnabled = this.isEnabled;
      this.gameState.save();
    }

    if (!this.isEnabled) {
      this.stopAmbient();
    }

    return this.isEnabled;
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    if (this.scene.sound && this.scene.sound.volume !== undefined) {
      this.scene.sound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Register a sound for later use
   */
  registerSound(key, sound) {
    this.sounds[key] = sound;
  }

  /**
   * Clean up audio resources
   */
  destroy() {
    this.stopAmbient();
    this.sounds = {};
  }
}
