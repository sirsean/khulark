export default class FeedingSystem {
  constructor(scene, gameState, audioManager) {
    this.scene = scene;
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.apiEndpoint = '/feed-photo';
  }

  /**
   * Upload photo blob to worker API and process response
   */
  async uploadPhoto(imageBlob) {
    try {
      // Create form data with image
      const formData = new FormData();
      formData.append('image', imageBlob, 'photo.jpg');

      // Show loading state
      this.showProcessingState();

      // Upload to worker
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      // Hide loading state
      this.hideProcessingState();

      // Process the AI response
      return this.processResponse(result);
    } catch (error) {
      console.error('Error uploading photo:', error);
      this.hideProcessingState();

      // Return fallback response
      return this.getFallbackResponse();
    }
  }

  /**
   * Process AI response and update game state
   */
  processResponse(response) {
    const { hunger, affection, sanity, speech, alertText } = response;

    // Apply stat changes
    if (hunger) {
      this.gameState.modifyStat('hunger', hunger);
    }
    if (affection) {
      this.gameState.modifyStat('affection', affection);
    }
    if (sanity) {
      this.gameState.modifyStat('sanity', sanity);
    }

    // Play appropriate sound based on total stat change
    const totalChange = (hunger || 0) + (affection || 0) + (sanity || 0);
    if (totalChange > 15) {
      this.audioManager.playFeed();
    } else if (totalChange > 0) {
      this.audioManager.playEating();
    } else {
      this.audioManager.playReaction();
    }

    return {
      hunger,
      affection,
      sanity,
      speech,
      alertText,
    };
  }

  /**
   * Get fallback response when AI fails
   */
  getFallbackResponse() {
    return {
      hunger: 0,
      affection: -5,
      sanity: -10,
      speech: "Something feels wrong. I don't like this at all...",
      alertText: "The khulark recoils from the strange offering.",
    };
  }

  /**
   * Show processing/loading state
   */
  showProcessingState() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create overlay
    this.processingOverlay = this.scene.add.graphics();
    this.processingOverlay.fillStyle(0x000000, 0.7);
    this.processingOverlay.fillRect(0, 0, width, height);
    this.processingOverlay.setDepth(1000);

    // Create loading text
    this.loadingText = this.scene.add.text(width / 2, height / 2, 'PROCESSING...', {
      font: 'bold 32px monospace',
      fill: '#d97706',
      stroke: '#000',
      strokeThickness: 3,
    });
    this.loadingText.setOrigin(0.5);
    this.loadingText.setDepth(1001);

    // Animate loading text
    this.scene.tweens.add({
      targets: this.loadingText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Play processing sounds
    this.audioManager.playProcessing();
  }

  /**
   * Hide processing/loading state
   */
  hideProcessingState() {
    if (this.processingOverlay) {
      this.processingOverlay.destroy();
      this.processingOverlay = null;
    }
    if (this.loadingText) {
      this.scene.tweens.killTweensOf(this.loadingText);
      this.loadingText.destroy();
      this.loadingText = null;
    }
  }
}
