export default class ParticleManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Create heart particles for petting interaction
   */
  emitHearts(x, y) {
    const hearts = [];
    const numHearts = 3 + Math.floor(Math.random() * 3); // 3-5 hearts

    for (let i = 0; i < numHearts; i++) {
      const offsetX = (Math.random() - 0.5) * 40;
      const heart = this.scene.add.text(x + offsetX, y, '♥', {
        fontSize: '24px',
        fill: '#ff69b4'
      }).setOrigin(0.5);

      hearts.push(heart);

      // Animate heart floating up and fading
      this.scene.tweens.add({
        targets: heart,
        y: y - 100 - Math.random() * 50,
        x: heart.x + (Math.random() - 0.5) * 60,
        alpha: 0,
        scale: 1.5,
        duration: 1500 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => heart.destroy()
      });
    }

    return hearts;
  }

  /**
   * Create sparkle particles for feeding
   */
  emitSparkles(x, y, color = 0xffa500) {
    const sparkles = [];
    const numSparkles = 5 + Math.floor(Math.random() * 5); // 5-10 sparkles

    for (let i = 0; i < numSparkles; i++) {
      const angle = (Math.PI * 2 * i) / numSparkles + Math.random() * 0.5;
      const distance = 30 + Math.random() * 40;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(color, 1);
      sparkle.fillCircle(0, 0, 3);
      sparkle.setPosition(x, y);

      sparkles.push(sparkle);

      // Animate sparkle outward and fade
      this.scene.tweens.add({
        targets: sparkle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 800 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }

    return sparkles;
  }

  /**
   * Create warning pulse effect for low stats
   */
  emitWarningPulse(x, y) {
    const warning = this.scene.add.text(x, y - 60, '!', {
      fontSize: '32px',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      scale: 1.5,
      alpha: 0,
      y: y - 100,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => warning.destroy()
    });

    return warning;
  }

  /**
   * Create stat change indicator (floating number)
   */
  emitStatChange(x, y, text, color = '#00ff00') {
    const statText = this.scene.add.text(x, y, text, {
      fontSize: '20px',
      fill: color,
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: statText,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => statText.destroy()
    });

    return statText;
  }

  /**
   * Create ripple effect for touch interaction
   */
  emitRipple(x, y) {
    const ripple = this.scene.add.graphics();
    ripple.lineStyle(3, 0xffffff, 0.8);
    ripple.strokeCircle(0, 0, 10);
    ripple.setPosition(x, y);

    this.scene.tweens.add({
      targets: ripple,
      alpha: 0,
      scale: 3,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => ripple.destroy()
    });

    return ripple;
  }

  /**
   * Create decay visual effect
   */
  emitDecayEffect(x, y) {
    const numParticles = 4;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles;
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x666666, 0.6);
      particle.fillCircle(0, 0, 4);
      particle.setPosition(x, y);

      particles.push(particle);

      const targetX = x + Math.cos(angle) * 50;
      const targetY = y + Math.sin(angle) * 50 + 30; // Drift downward

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.3,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    return particles;
  }
}
