const SAVE_KEY = 'khulark-save';
const SAVE_VERSION = 1;

const DEFAULT_STATE = {
  version: SAVE_VERSION,
  khulark: {
    hunger: 100,
    affection: 50,
    sanity: 60,
    lastSeenAt: Date.now(),
    bodyState: 'normal'
  },
  player: {
    foodInventory: [],
    settings: {
      soundEnabled: true
    }
  }
};

export default class GameState {
  constructor() {
    this.state = null;
  }

  load() {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Validate version
        if (parsed.version !== SAVE_VERSION) {
          console.warn('Save version mismatch, using defaults');
          this.state = this.createDefaultState();
          return this.state;
        }

        // Calculate time elapsed since last visit
        const now = Date.now();
        const elapsed = now - parsed.khulark.lastSeenAt;
        
        // Apply decay
        this.state = parsed;
        this.applyDecay(elapsed);
        this.state.khulark.lastSeenAt = now;
        
        this.save(); // Save updated state
        return this.state;
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
    
    // No save found or error occurred
    this.state = this.createDefaultState();
    this.save();
    return this.state;
  }

  save() {
    try {
      this.state.khulark.lastSeenAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving game state:', error);
      // Handle quota exceeded or other errors
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
      }
    }
  }

  applyDecay(elapsedMs) {
    const hoursElapsed = elapsedMs / (1000 * 60 * 60);
    
    // Decay rates per hour
    const HUNGER_DECAY = 10;
    const AFFECTION_DECAY = 5;
    const SANITY_DECAY = 3;

    // Apply decay and clamp between 0-100
    this.state.khulark.hunger = Math.max(0, this.state.khulark.hunger - (HUNGER_DECAY * hoursElapsed));
    this.state.khulark.affection = Math.max(0, this.state.khulark.affection - (AFFECTION_DECAY * hoursElapsed));
    this.state.khulark.sanity = Math.max(0, this.state.khulark.sanity - (SANITY_DECAY * hoursElapsed));
  }

  createDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  getKhularkStats() {
    return {
      hunger: this.state.khulark.hunger,
      affection: this.state.khulark.affection,
      sanity: this.state.khulark.sanity
    };
  }

  modifyStat(stat, amount) {
    if (this.state.khulark[stat] !== undefined) {
      const oldValue = this.state.khulark[stat];
      const newValue = Math.max(0, Math.min(100, oldValue + amount));
      this.state.khulark[stat] = newValue;
      this.save();
      return { oldValue, newValue };
    }
    return null;
  }

  setBodyState(bodyState) {
    this.state.khulark.bodyState = bodyState;
    this.save();
  }

  getBodyState() {
    return this.state.khulark.bodyState;
  }

  reset() {
    this.state = this.createDefaultState();
    this.save();
  }
}
