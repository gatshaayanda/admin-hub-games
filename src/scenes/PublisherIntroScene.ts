import Phaser from 'phaser';

export class PublisherIntroScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#d9c28f');

    this.drawWorld(width, height);

    // The player is already part of the world: the intro is their arrival,
    // not a separate title screen.
    const player = this.createPlayer(-36, height * 0.72);
    const shadow = this.add.ellipse(-36, height * 0.75, 24, 9, 0x4a3524, 0.28);

    const brand = this.add.text(width * 0.08, height * 0.12, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#2c241d',
      letterSpacing: 2,
    }).setAlpha(0);

    const prompt = this.add.text(width / 2, height - 34, 'WASD / ARROWS TO MOVE', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff6dc',
      stroke: '#2c241d',
      strokeThickness: 4,
      letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [player, shadow],
      x: `+=${width * 0.44}`,
      duration: 2500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const bob = Math.sin(this.time.now / 95) * 2;
        player.y = height * 0.72 + bob;
        shadow.x = player.x;
      },
      onComplete: () => {
        this.tweens.add({
          targets: brand,
          alpha: 1,
          duration: 450,
          yoyo: true,
          hold: 900,
        });

        this.tweens.add({
          targets: prompt,
          alpha: 1,
          duration: 500,
        });
      },
    });

    this.time.delayedCall(3700, () => this.leaveIntro());
    this.input.keyboard?.once('keydown', () => this.leaveIntro());
    this.input.once('pointerdown', () => this.leaveIntro());
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(500, 24, 20, 16);
    this.time.delayedCall(500, () => this.scene.start('GameShellScene', { introComplete: true }));
  }

  private drawWorld(width: number, height: number) {
    const g = this.add.graphics();

    // Kalahari-inspired earth and warm sky/ground palette.
    g.fillStyle(0xe5d39f, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xc89b62, 1).fillRect(0, height * 0.38, width, height * 0.62);

    // Soft grass patches.
    for (let x = 24; x < width; x += 54) {
      const y = height * 0.46 + ((x * 17) % 90);
      g.fillStyle(0x71804a, 0.8).fillRect(x, y, 18, 8);
      g.fillStyle(0x8e9858, 0.7).fillRect(x + 6, y - 7, 7, 7);
    }

    // Main red-earth path.
    g.fillStyle(0xa96545, 1);
    g.beginPath();
    g.moveTo(0, height * 0.77);
    g.lineTo(width * 0.25, height * 0.65);
    g.lineTo(width * 0.56, height * 0.68);
    g.lineTo(width, height * 0.56);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fillPath();

    // Low compound wall.
    g.fillStyle(0x8d7254, 1).fillRect(width * 0.62, height * 0.36, width * 0.31, 12);
    g.fillStyle(0x6e5945, 1).fillRect(width * 0.62, height * 0.36 + 12, width * 0.31, 4);

    // Small home / studio building.
    g.fillStyle(0xe9dfc4, 1).fillRect(width * 0.66, height * 0.22, width * 0.18, height * 0.15);
    g.fillStyle(0x59635a, 1);
    g.beginPath();
    g.moveTo(width * 0.63, height * 0.22);
    g.lineTo(width * 0.75, height * 0.12);
    g.lineTo(width * 0.87, height * 0.22);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x9a704e, 1).fillRect(width * 0.73, height * 0.28, 22, 38);
    g.fillStyle(0x7890a0, 1).fillRect(width * 0.68, height * 0.26, 20, 18);
    g.fillStyle(0x7890a0, 1).fillRect(width * 0.80, height * 0.26, 20, 18);

    // Water tank and a small sign establish a lived-in place without turning it into a logo screen.
    g.fillStyle(0x6f7471, 1).fillRect(width * 0.88, height * 0.24, 26, 54);
    g.fillStyle(0x4f5654, 1).fillRect(width * 0.875, height * 0.22, 36, 10);
    g.fillStyle(0x4a3a2b, 1).fillRect(width * 0.48, height * 0.48, 74, 38);
    g.fillStyle(0xcbb68a, 1).fillRect(width * 0.485, height * 0.485, 64, 24);
    g.fillStyle(0x342a22, 1).fillRect(width * 0.495, height * 0.49, 44, 3);

    this.add.text(width * 0.52, height * 0.505, 'ADMIN HUB', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#342a22',
    }).setOrigin(0.5);

    // Acacia-like silhouettes.
    this.drawTree(width * 0.18, height * 0.29, 1.15);
    this.drawTree(width * 0.47, height * 0.26, 0.82);
    this.drawTree(width * 0.93, height * 0.48, 0.72);

    // Small rocks/flowers add depth.
    for (let i = 0; i < 12; i += 1) {
      const x = 30 + ((i * 137) % Math.max(80, width - 60));
      const y = height * 0.48 + ((i * 71) % Math.max(40, height * 0.42));
      g.fillStyle(i % 2 ? 0x77644e : 0x9a805e, 1).fillRect(x, y, 7, 4);
    }
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x6b4c35, 1).fillRect(x - 5 * scale, y + 18 * scale, 10 * scale, 48 * scale);
    g.fillStyle(0x455b38, 1);
    g.fillRect(x - 42 * scale, y, 84 * scale, 18 * scale);
    g.fillRect(x - 29 * scale, y - 12 * scale, 58 * scale, 16 * scale);
    g.fillRect(x - 14 * scale, y - 21 * scale, 28 * scale, 12 * scale);
    g.fillStyle(0x647447, 1).fillRect(x - 31 * scale, y - 4 * scale, 62 * scale, 8 * scale);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    // Chunky 2D character: dark skin, teal shirt, warm trousers, small backpack.
    g.fillStyle(0x2e241e, 1).fillRect(-9, -20, 18, 10);
    g.fillStyle(0x6e432c, 1).fillRect(-8, -13, 16, 13);
    g.fillStyle(0x1f6b68, 1).fillRect(-10, 0, 20, 19);
    g.fillStyle(0xd4a45d, 1).fillRect(-9, 19, 7, 12);
    g.fillStyle(0xd4a45d, 1).fillRect(2, 19, 7, 12);
    g.fillStyle(0x263b3a, 1).fillRect(-11, 29, 9, 5);
    g.fillStyle(0x263b3a, 1).fillRect(2, 29, 9, 5);
    g.fillStyle(0x5b3d2a, 1).fillRect(9, 3, 6, 16);

    container.add(g);
    return container;
  }
}
