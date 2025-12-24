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
      fontFamily: 'FringeV2',
      fontSize: '32px',
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

    // Button text - match FEED button style (FringeV2, 16px, no bold)
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'FringeV2',
      fontSize: '16px',
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
    // Match FEED button's weathered metal style
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

    // Corner rivets/screws
    const cornerSize = 7;
    const inset = 12;

    const corners = [
      [-width / 2 + inset, -height / 2 + inset],
      [width / 2 - inset, -height / 2 + inset],
      [-width / 2 + inset, height / 2 - inset],
      [width / 2 - inset, height / 2 - inset],
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
    const spots = [
      { x: -width / 4, y: -height / 4, size: 8, color: 0x4a3820 },
      { x: width / 3, y: height / 4, size: 6, color: 0x6b5020 },
      { x: -width / 3, y: height / 3, size: 5, color: 0x5a4520 },
      { x: width / 4, y: -height / 3, size: 7, color: 0x3a2810 },
      { x: 0, y: height / 5, size: 4, color: 0x7a5520 },
    ];

    spots.forEach(spot => {
      bg.fillStyle(spot.color, alpha * 0.4);
      bg.fillCircle(spot.x, spot.y, spot.size);
      bg.fillStyle(spot.color, alpha * 0.2);
      bg.fillCircle(spot.x + 1, spot.y - 1, spot.size * 0.6);
    });

    // Scratches
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

    // Convert to blob and send immediately
    canvas.toBlob((blob) => {
      if (blob && this.onPhotoCallback) {
        this.onPhotoCallback(blob);
        this.closeCamera();
      }
    }, 'image/jpeg', 0.9);
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
