import Phaser from 'phaser';

export class PublisherIntroScene extends Phaser.Scene {
  private leaving = false;
  private introReady = false;
  private resizeHandler?: () => void;

  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#070b1d');
    this.drawWorld(width, height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    const player = this.createPlayer(-48, height * 0.72);
    const shadow = this.add.ellipse(-48, height * 0.75, 28, 9, 0x000000, 0.35);
    player.setDepth(20);
    shadow.setDepth(19);

    const ambientBrand = this.add.text(width * 0.075, height * 0.085, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#a9b8d6',
      letterSpacing: 2.5,
    }).setDepth(30);

    const skipHint = this.add.text(width * 0.925, height * 0.90, 'TAP TO ENTER', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#a9b8d6', letterSpacing: 1.5,
    }).setOrigin(1, 0.5).setAlpha(0).setDepth(90);

    const skip = () => this.skipIntro();
    this.input.on('pointerdown', skip);
    this.input.keyboard?.on('keydown', skip);

    const fade = this.add.rectangle(0, 0, width, height, 0x070b1d, 1)
      .setOrigin(0)
      .setDepth(100);

    this.tweens.add({
      targets: fade,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeOut',
    });

    // Keep the cinematic sequence independent of viewport dimensions and input.
    // Opening the app always gives the publisher identity its intended moment.
    this.tweens.add({
      targets: [player, shadow],
      x: `+=${width * 0.50}`,
      duration: 3000,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const bob = Math.sin(this.time.now / 110) * 1.8;
        player.y = height * 0.72 + bob;
        shadow.x = player.x;
      },
      onComplete: () => {
        this.introReady = true;
        skipHint.setAlpha(0.82);
        this.tweens.add({ targets: skipHint, alpha: 0.38, duration: 900, yoyo: true, repeat: -1 });
        this.time.delayedCall(350, () => this.showPublisherCard(ambientBrand, width, height));
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.off('pointerdown', skip);
      this.input.keyboard?.off('keydown', skip);
    });
  }

  private handleResize(width: number, height: number) {
    if (this.leaving) return;
    this.cameras.main.setViewport(0, 0, width, height);
  }

  private showPublisherCard(ambientBrand: Phaser.GameObjects.Text, width: number, height: number) {
    if (this.leaving) return;

    const veil = this.add.rectangle(width / 2, height / 2, width, height, 0x16120f, 0.32)
      .setDepth(80)
      .setAlpha(0);

    const panelWidth = Math.min(width * 0.82, 720);
    const panelHeight = Math.min(height * 0.38, 210);
    const panel = this.add.rectangle(width / 2, height * 0.48, panelWidth, panelHeight, 0x10172d, 0.92)
      .setStrokeStyle(Math.max(2, Math.min(width, height) * 0.004), 0x55d6c2, 0.95)
      .setDepth(81)
      .setAlpha(0)
      .setScale(0.94);

    const titleSize = Math.max(30, Math.min(60, Math.min(width, height) * 0.10));
    const presentsSize = Math.max(15, Math.min(25, Math.min(width, height) * 0.04));

    const title = this.add.text(width / 2, height * 0.455, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: `${titleSize}px`,
      fontStyle: 'bold',
      color: '#f4f7ff',
      letterSpacing: Math.max(2, Math.round(titleSize * 0.06)),
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0).setScale(0.96);

    const presents = this.add.text(width / 2, height * 0.575, 'presents', {
      fontFamily: 'sans-serif',
      fontSize: `${presentsSize}px`,
      color: '#e2bd67',
      fontStyle: 'italic',
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0);


    const descriptor = this.add.text(width / 2, height * 0.635, 'BUILD  ·  PLAY  ·  RETURN', {
      fontFamily: 'monospace',
      fontSize: `${Math.max(9, Math.min(12, Math.min(width, height) * 0.018))}px`,
      color: '#a9b8d6',
      letterSpacing: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0);

    // The identity beat remains cinematic, but becomes skippable once the player has had a brief moment to see the world and character.
    this.tweens.add({
      targets: [veil, panel, title, presents, descriptor],
      alpha: 1,
      duration: 850,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: [panel, title],
      scale: 1,
      duration: 850,
      ease: 'Sine.easeOut',
    });

    // Hold for a full, repeatable publisher beat on laptop and phone.
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [veil, panel, title, presents],
        alpha: 0,
        duration: 1000,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          veil.destroy();
          panel.destroy();
          title.destroy();
          presents.destroy();
          descriptor.destroy();
          ambientBrand.setAlpha(1);
          this.time.delayedCall(300, () => this.leaveIntro());
        },
      });
    });
  }

  private skipIntro() {
    if (this.leaving) return;
    // A tap/key can arrive before the character reveal. It intentionally does
    // nothing then, but the handler stays alive so the player's next input can
    // skip once the identity beat is ready.
    if (!this.introReady) return;
    this.leaveIntro();
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(450, 22, 18, 14);
    this.time.delayedCall(450, () => this.scene.start('NameEntryScene'));
  }

  private drawWorld(width: number, height: number) {
    const g = this.add.graphics();

    g.fillStyle(0x070b1d, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x111a42, 1).fillRect(0, height * 0.30, width, height * 0.40);
    g.fillStyle(0x0d1830, 1).fillRect(0, height * 0.70, width, height * 0.30);

    // Publisher-world starfield: this identity belongs to Admin Hub Games, not to any one game's biome.
    for (let i = 0; i < 64; i += 1) {
      const x = (i * 173.7) % width;
      const y = (i * 83.9) % (height * 0.60);
      const radius = i % 9 === 0 ? 1.5 : i % 3 === 0 ? 1.0 : 0.65;
      g.fillStyle(i % 7 === 0 ? 0xe2bd67 : 0xdce7ff, i % 5 === 0 ? 0.90 : 0.58);
      g.fillCircle(x, y, radius);
    }

    g.fillStyle(0x24385b, 0.55).fillCircle(width * 0.76, height * 0.25, Math.max(70, Math.min(width, height) * 0.19));
    g.fillStyle(0x55d6c2, 0.08).fillCircle(width * 0.76, height * 0.25, Math.max(115, Math.min(width, height) * 0.27));
    g.fillStyle(0xe2bd67, 0.90).fillCircle(width * 0.76, height * 0.25, Math.max(24, Math.min(width, height) * 0.055));
    g.fillStyle(0xf4f7ff, 0.22).fillCircle(width * 0.75, height * 0.24, Math.max(16, Math.min(width, height) * 0.035));

    g.fillStyle(0x050816, 1);
    g.beginPath();
    g.moveTo(0, height * 0.68);
    g.lineTo(width * 0.14, height * 0.61);
    g.lineTo(width * 0.28, height * 0.66);
    g.lineTo(width * 0.42, height * 0.57);
    g.lineTo(width * 0.56, height * 0.65);
    g.lineTo(width * 0.70, height * 0.56);
    g.lineTo(width * 0.86, height * 0.63);
    g.lineTo(width, height * 0.57);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fillPath();

    // Abstract fantasy towers with small teal signal lights.
    g.fillStyle(0x24385b, 0.95);
    g.fillRect(width * 0.16, height * 0.53, 28, height * 0.16);
    g.fillRect(width * 0.20, height * 0.48, 20, height * 0.21);
    g.fillRect(width * 0.80, height * 0.51, 30, height * 0.18);
    g.fillRect(width * 0.84, height * 0.46, 20, height * 0.23);
    g.fillStyle(0x55d6c2, 0.75);
    g.fillRect(width * 0.195, height * 0.50, 4, height * 0.10);
    g.fillRect(width * 0.835, height * 0.48, 4, height * 0.10);

    g.lineStyle(1, 0x55d6c2, 0.12);
    for (let i = 0; i < 8; i += 1) {
      const y = height * (0.72 + i * 0.035);
      g.lineBetween(width * 0.08, y, width * 0.92, y);
    }
    g.fillStyle(0xe2bd67, 0.45);
    g.fillRect(width * 0.10, height * 0.695, width * 0.18, 1);
    g.fillRect(width * 0.72, height * 0.695, width * 0.18, 1);

    this.drawTree(width * 0.16, height * 0.29, 1.0);
    this.drawTree(width * 0.40, height * 0.28, 0.70);
    this.drawTree(width * 0.95, height * 0.43, 0.62);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x17213f, 1).fillRect(x - 5 * scale, y + 18 * scale, 10 * scale, 52 * scale);
    g.fillStyle(0x1f3155, 1);
    g.fillRect(x - 46 * scale, y, 92 * scale, 17 * scale);
    g.fillRect(x - 34 * scale, y - 11 * scale, 68 * scale, 16 * scale);
    g.fillRect(x - 17 * scale, y - 21 * scale, 34 * scale, 13 * scale);
    g.fillStyle(0x31546a, 1).fillRect(x - 33 * scale, y - 4 * scale, 66 * scale, 8 * scale);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x11182f, 1).fillRect(-10, -22, 20, 10);
    g.fillStyle(0xe6c982, 1).fillRect(-9, -14, 18, 14);
    g.fillStyle(0x1b8f8a, 1).fillRect(-11, 0, 22, 19);
    g.fillStyle(0x55d6c2, 0.90).fillRect(-3, 2, 6, 17);
    g.fillStyle(0xe2bd67, 1).fillRect(-9, 19, 7, 13);
    g.fillStyle(0xe2bd67, 1).fillRect(2, 19, 7, 13);
    g.fillStyle(0x10172d, 1).fillRect(-12, 30, 10, 5);
    g.fillStyle(0x10172d, 1).fillRect(2, 30, 10, 5);
    g.fillStyle(0xe2bd67, 1).fillRect(10, 3, 6, 16);
    g.fillStyle(0x55d6c2, 1).fillCircle(13, 1, 5);
    container.add(g);
    return container;
  }
}
