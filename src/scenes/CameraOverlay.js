import Phaser from 'phaser';

export default class CameraOverlay extends Phaser.Scene {
  constructor() {
    super({ key: 'CameraOverlay' });
    this.videoElement = null;
    this.stream = null;
    this.capturedImage = null;
    this.onPhotoCallback = null;
  }

  init(data) {
    this.onPhotoCallback = data.onPhoto;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create dark overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, width, height);

    // Create retro-styled camera interface frame
    const frameWidth = width - 80;
    const frameHeight = (frameWidth * 4) / 3; // 4:3 aspect ratio
    const frameX = 40;
    const frameY = 100;

    // Draw chunky metal frame
    this.drawMetalFrame(frameX, frameY, frameWidth, frameHeight);

    // Create DOM video element for camera preview
    this.createVideoElement(frameX, frameY, frameWidth, frameHeight);

    // Title
    this.add.text(width / 2, 50, 'FEED CAMERA', {
      font: 'bold 32px monospace',
      fill: '#d97706',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Create buttons
    const buttonY = frameY + frameHeight + 80;
    this.createButtons(width, buttonY);

    // Start camera
    this.startCamera();
  }

  drawMetalFrame(x, y, width, height) {
    const frame = this.add.graphics();
    
    // Outer dark border
    frame.fillStyle(0x1a1a1a, 1);
    frame.fillRect(x - 8, y - 8, width + 16, height + 16);
    
    // Main frame body
    frame.fillStyle(0x3a3a3a, 1);
    frame.fillRect(x - 4, y - 4, width + 8, height + 8);
    
    // Inner weathered border
    frame.lineStyle(2, 0x6b5020, 0.8);
    frame.strokeRect(x, y, width, height);
    
    // Corner rivets
    const cornerSize = 6;
    const corners = [
      [x - 6, y - 6],
      [x + width + 6, y - 6],
      [x - 6, y + height + 6],
      [x + width + 6, y + height + 6],
    ];
    
    corners.forEach(([cx, cy]) => {
      frame.fillStyle(0x0a0a0a, 1);
      frame.fillCircle(cx, cy, cornerSize);
      frame.fillStyle(0x3a3a3a, 1);
      frame.fillCircle(cx, cy, cornerSize - 1);
    });
  }

  createVideoElement(x, y, width, height) {
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('autoplay', 'true');
    this.videoElement.setAttribute('playsinline', 'true');
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.width = `${width}px`;
    this.videoElement.style.height = `${height}px`;
    this.videoElement.style.objectFit = 'cover';
    
    // Position it over the game canvas
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const scale = canvas.width / canvasRect.width;
    
    this.videoElement.style.left = `${canvasRect.left + x / scale}px`;
    this.videoElement.style.top = `${canvasRect.top + y / scale}px`;
    this.videoElement.style.transform = `scale(${1 / scale})`;
    this.videoElement.style.transformOrigin = 'top left';
    this.videoElement.style.zIndex = '1000';
    
    document.body.appendChild(this.videoElement);
  }

  createButtons(width, buttonY) {
    // Capture button
    this.captureBtn = this.createButton(width / 2 - 110, buttonY, 200, 60, 'CAPTURE', 0x8b4513);
    this.captureBtn.on('pointerdown', () => this.capturePhoto());
    
    // Close button
    this.closeBtn = this.createButton(width / 2 + 110, buttonY, 200, 60, 'CLOSE', 0x6b4423);
    this.closeBtn.on('pointerdown', () => this.closeCamera());
  }

  createButton(x, y, width, height, text, color) {
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    this.drawButton(bg, width, height, color);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      font: 'bold 20px monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(width, height);
    button.setInteractive({ cursor: 'pointer' });

    // Hover effect
    button.on('pointerover', () => {
      bg.clear();
      this.drawButton(bg, width, height, color, 0.8);
    });

    button.on('pointerout', () => {
      bg.clear();
      this.drawButton(bg, width, height, color, 1.0);
    });

    return button;
  }

  drawButton(bg, width, height, color, alpha = 1.0) {
    // Base
    bg.fillStyle(color, alpha);
    bg.fillRect(-width / 2, -height / 2, width, height);
    
    // Border
    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.strokeRect(-width / 2, -height / 2, width, height);
    
    // Highlight
    bg.lineStyle(2, 0xd4a574, alpha * 0.5);
    bg.beginPath();
    bg.moveTo(-width / 2 + 4, -height / 2 + 4);
    bg.lineTo(width / 2 - 4, -height / 2 + 4);
    bg.strokePath();
  }

  async startCamera() {
    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showError('Camera access denied or unavailable.');
    }
  }

  capturePhoto() {
    if (!this.videoElement || !this.stream) {
      this.showError('Camera not ready.');
      return;
    }

    // Create canvas to capture image
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        this.capturedImage = blob;
        this.showPreview(canvas);
      }
    }, 'image/jpeg', 0.9);
  }

  showPreview(canvas) {
    // Hide video and show preview
    if (this.videoElement) {
      this.videoElement.style.display = 'none';
    }

    // Create image from canvas
    const width = this.cameras.main.width;
    const frameWidth = width - 80;
    const frameHeight = (frameWidth * 4) / 3;
    const frameX = 40;
    const frameY = 100;

    // Convert canvas to data URL and create Phaser texture
    const dataUrl = canvas.toDataURL('image/jpeg');
    this.textures.once('addtexture', () => {
      const preview = this.add.image(frameX + frameWidth / 2, frameY + frameHeight / 2, 'captured-photo');
      preview.setDisplaySize(frameWidth, frameHeight);
      this.previewImage = preview;
    });
    this.textures.addBase64('captured-photo', dataUrl);

    // Update buttons to Send/Retake
    this.captureBtn.destroy();
    this.closeBtn.destroy();

    const buttonY = frameY + frameHeight + 80;
    this.sendBtn = this.createButton(width / 2 - 110, buttonY, 200, 60, 'SEND', 0x8b4513);
    this.sendBtn.on('pointerdown', () => this.sendPhoto());

    this.retakeBtn = this.createButton(width / 2 + 110, buttonY, 200, 60, 'RETAKE', 0x6b4423);
    this.retakeBtn.on('pointerdown', () => this.retakePhoto());
  }

  retakePhoto() {
    // Remove preview
    if (this.previewImage) {
      this.previewImage.destroy();
      this.previewImage = null;
    }

    // Show video again
    if (this.videoElement) {
      this.videoElement.style.display = 'block';
    }

    // Restore capture/close buttons
    this.sendBtn.destroy();
    this.retakeBtn.destroy();

    const width = this.cameras.main.width;
    const frameWidth = width - 80;
    const frameHeight = (frameWidth * 4) / 3;
    const buttonY = 100 + frameHeight + 80;
    
    this.captureBtn = this.createButton(width / 2 - 110, buttonY, 200, 60, 'CAPTURE', 0x8b4513);
    this.captureBtn.on('pointerdown', () => this.capturePhoto());
    
    this.closeBtn = this.createButton(width / 2 + 110, buttonY, 200, 60, 'CLOSE', 0x6b4423);
    this.closeBtn.on('pointerdown', () => this.closeCamera());
  }

  sendPhoto() {
    if (this.capturedImage && this.onPhotoCallback) {
      this.onPhotoCallback(this.capturedImage);
    }
    this.closeCamera();
  }

  closeCamera() {
    this.cleanup();
    this.scene.stop();
  }

  showError(message) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.add.text(width / 2, height / 2, message, {
      font: '20px monospace',
      fill: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // Auto-close after 3 seconds
    this.time.delayedCall(3000, () => this.closeCamera());
  }

  cleanup() {
    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Remove video element
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }
  }

  shutdown() {
    this.cleanup();
    super.shutdown();
  }
}
