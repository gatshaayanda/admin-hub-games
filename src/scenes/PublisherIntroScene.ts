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

    const player = this.createPlayer(-48, height * 0.72);
    const shadow = this.add.ellipse(-48, height * 0.75, 28, 9, 0x3a2b21, 0.28);
    player.setDepth(20);
    shadow.setDepth(19);

    // A quiet environmental mark remains throughout the journey.
    const ambientBrand = this.add.text(width * 0.075, height * 0.085, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#33271f',
      letterSpacing: 2,
    }).setDepth(30);

    const fade = this.add.rectangle(0, 0, width, height, 0x16120f, 1)
      .setOrigin(0)
      .setDepth(100);

    this.tweens.add({
      targets: fade,
      alpha: 0,
      duration: 850,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: [player, shadow],
      x: `+=${width * 0.50}`,
      duration: 3100,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const bob = Math.sin(this.time.now / 110) * 1.8;
        player.y = height * 0.72 + bob;
        shadow.x = player.x;
      },
      onComplete: () => this.showPublisherCard(ambientBrand, width, height),
    });

    this.input.keyboard?.once('keydown', () => this.leaveIntro());
    this.input.once('pointerdown', () => this.leaveIntro());
  }

  private showPublisherCard(ambientBrand: Phaser.GameObjects.Text, width: number, height: number) {
    // The player has arrived. Stop the motion and give the publisher identity a real moment.
    const veil = this.add.rectangle(width / 2, height / 2, width, height, 0x16120f, 0.30)
      .setDepth(80)
      .setAlpha(0);

    const panelWidth = Math.min(width * 0.78, 700);
    const panelHeight = Math.min(height * 0.34, 190);
    const panel = this.add.rectangle(width / 2, height * 0.48, panelWidth, panelHeight, 0x241c17, 0.88)
      .setStrokeStyle(Math.max(2, Math.min(width, height) * 0.004), 0xd2bc8e, 0.9)
      .setDepth(81)
      .setAlpha(0)
      .setScale(0.94);

    const titleSize = Math.max(28, Math.min(56, Math.min(width, height) * 0.095));
    const presentsSize = Math.max(14, Math.min(24, Math.min(width, height) * 0.038));

    const title = this.add.text(width / 2, height * 0.455, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: `${titleSize}px`,
      fontStyle: 'bold',
      color: '#f5e7c4',
      letterSpacing: Math.max(2, Math.round(titleSize * 0.06)),
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0).setScale(0.96);

    const presents = this.add.text(width / 2, height * 0.575, 'presents', {
      fontFamily: 'sans-serif',
      fontSize: `${presentsSize}px`,
      color: '#d9c28f',
      fontStyle: 'italic',
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0);

    this.tweens.add({
      targets: [veil, panel, title, presents],
      alpha: 1,
      duration: 700,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: [panel, title],
      scale: 1,
      duration: 900,
      ease: 'Sine.easeOut',
    });

    // Hold the identity long enough to actually register on both laptop and phone.
    this.time.delayedCall(3100, () => {
      this.tweens.add({
        targets: [veil, panel, title, presents],
        alpha: 0,
        duration: 900,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          veil.destroy();
          panel.destroy();
          title.destroy();
          presents.destroy();
          ambientBrand.setAlpha(1);
          this.time.delayedCall(250, () => this.leaveIntro());
        },
      });
    });
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(650, 22, 18, 14);
    this.time.delayedCall(650, () => this.scene.start('NameEntryScene'));
  }

  private drawWorld(width: number, height: number) {
    const g = this.add.graphics();

    // Warm Botswana-inspired morning palette: dry grass, red earth and soft sky.
    g.fillStyle(0xe8d6a8, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xd7b879, 1).fillRect(0, height * 0.34, width, height * 0.66);

    // Distant horizon and low hills.
    g.fillStyle(0xb58d61, 1);
    g.beginPath();
    g.moveTo(0, height * 0.42);
    g.lineTo(width * 0.18, height * 0.34);
    g.lineTo(width * 0.33, height * 0.40);
    g.lineTo(width * 0.53, height * 0.31);
    g.lineTo(width * 0.76, height * 0.40);
    g.lineTo(width, height * 0.33);
    g.lineTo(width, height * 0.52);
    g.lineTo(0, height * 0.52);
    g.closePath();
    g.fillPath();

    // Grassy field.
    for (let x = 18; x < width; x += 42) {
      const y = height * 0.47 + ((x * 13) % 105);
      g.fillStyle(0x71804a, 0.72).fillRect(x, y, 13, 5);
      g.fillStyle(0x899153, 0.65).fillRect(x + 4, y - 5, 5, 5);
    }

    // Red-earth path leading into the settlement.
    g.fillStyle(0xa76545, 1);
    g.beginPath();
    g.moveTo(0, height * 0.78);
    g.lineTo(width * 0.20, height * 0.68);
    g.lineTo(width * 0.45, height * 0.70);
    g.lineTo(width * 0.66, height * 0.59);
    g.lineTo(width, height * 0.55);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fillPath();

    // A small compound/studio: a future landmark in the shared world.
    g.fillStyle(0x8d7254, 1).fillRect(width * 0.59, height * 0.35, width * 0.33, 11);
    g.fillStyle(0x705b48, 1).fillRect(width * 0.59, height * 0.35 + 11, width * 0.33, 4);

    g.fillStyle(0xe7dfc8, 1).fillRect(width * 0.64, height * 0.20, width * 0.19, height * 0.16);
    g.fillStyle(0x58635d, 1);
    g.beginPath();
    g.moveTo(width * 0.61, height * 0.20);
    g.lineTo(width * 0.735, height * 0.105);
    g.lineTo(width * 0.86, height * 0.20);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x9a704e, 1).fillRect(width * 0.72, height * 0.275, 22, 42);
    g.fillStyle(0x7693a0, 1).fillRect(width * 0.66, height * 0.25, 22, 19);
    g.fillStyle(0x7693a0, 1).fillRect(width * 0.79, height * 0.25, 22, 19);

    // Water tank / utility silhouette.
    g.fillStyle(0x707671, 1).fillRect(width * 0.865, height * 0.22, 24, 60);
    g.fillStyle(0x505653, 1).fillRect(width * 0.855, height * 0.20, 44, 11);
    g.fillStyle(0x505653, 1).fillRect(width * 0.873, height * 0.19, 8, 8);

    // Sign at the path: the brand exists in-world, not as a splash screen.
    g.fillStyle(0x4b392b, 1).fillRect(width * 0.46, height * 0.47, 7, 70);
    g.fillStyle(0x403126, 1).fillRect(width * 0.405, height * 0.465, 120, 39);
    g.fillStyle(0xd2bc8e, 1).fillRect(width * 0.412, height * 0.472, 106, 25);
    this.add.text(width * 0.465, height * 0.484, 'ADMIN HUB', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#403126',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8);
    this.add.text(width * 0.465, height * 0.514, 'GAMES', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#73563d',
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(8);

    // Acacia-inspired silhouettes.
    this.drawTree(width * 0.16, height * 0.29, 1.18);
    this.drawTree(width * 0.40, height * 0.28, 0.78);
    this.drawTree(width * 0.95, height * 0.43, 0.72);

    // Small rocks and scrub create a little visual life without heavy assets.
    for (let i = 0; i < 18; i += 1) {
      const x = 24 + ((i * 149) % Math.max(80, width - 48));
      const y = height * 0.49 + ((i * 67) % Math.max(45, height * 0.42));
      g.fillStyle(i % 2 ? 0x79644d : 0x9b805d, 1).fillRect(x, y, 7, 4);
      if (i % 4 === 0) g.fillStyle(0x687648, 0.9).fillRect(x + 8, y - 4, 4, 8);
    }

    // Soft sun disk.
    g.fillStyle(0xf5df9c, 0.72).fillCircle(width * 0.87, height * 0.14, 34);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x684a34, 1).fillRect(x - 5 * scale, y + 18 * scale, 10 * scale, 52 * scale);
    g.fillStyle(0x445a37, 1);
    g.fillRect(x - 46 * scale, y, 92 * scale, 17 * scale);
    g.fillRect(x - 34 * scale, y - 11 * scale, 68 * scale, 16 * scale);
    g.fillRect(x - 17 * scale, y - 21 * scale, 34 * scale, 13 * scale);
    g.fillStyle(0x637344, 1).fillRect(x - 33 * scale, y - 4 * scale, 66 * scale, 8 * scale);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    // The same simple hero language can be reused by the first real game.
    g.fillStyle(0x241d1a, 1).fillRect(-10, -22, 20, 10);
    g.fillStyle(0x70452e, 1).fillRect(-9, -14, 18, 14);
    g.fillStyle(0x236b68, 1).fillRect(-11, 0, 22, 19);
    g.fillStyle(0xd5a45d, 1).fillRect(-9, 19, 7, 13);
    g.fillStyle(0xd5a45d, 1).fillRect(2, 19, 7, 13);
    g.fillStyle(0x253a38, 1).fillRect(-12, 30, 10, 5);
    g.fillStyle(0x253a38, 1).fillRect(2, 30, 10, 5);
    g.fillStyle(0x5b3d2a, 1).fillRect(10, 3, 6, 16);

    container.add(g);
    return container;
  }
}
