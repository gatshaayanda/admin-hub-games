import Phaser from 'phaser';

export class PublisherIntroScene extends Phaser.Scene {
  private leaving = false;
  private elapsed = 0;
  private worldGraphics?: Phaser.GameObjects.Graphics;
  private player?: Phaser.GameObjects.Container;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private ambientBrand?: Phaser.GameObjects.Text;
  private veil?: Phaser.GameObjects.Rectangle;
  private panel?: Phaser.GameObjects.Rectangle;
  private title?: Phaser.GameObjects.Text;
  private presents?: Phaser.GameObjects.Text;

  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.buildResponsiveScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  update(_time: number, delta: number) {
    if (this.leaving) return;

    this.elapsed += delta;

    if (this.elapsed < 850) {
      const progress = Phaser.Math.Clamp(this.elapsed / 850, 0, 1);
      this.setFade(1 - progress);
      this.positionPlayer(0);
      return;
    }

    if (this.elapsed < 4050) {
      const progress = Phaser.Math.Clamp((this.elapsed - 850) / 3200, 0, 1);
      this.setFade(0);
      this.positionPlayer(progress);
      return;
    }

    if (this.elapsed < 4650) {
      this.setFade(0);
      this.positionPlayer(1);
      return;
    }

    if (this.elapsed < 5500) {
      const progress = Phaser.Math.Clamp((this.elapsed - 4650) / 850, 0, 1);
      this.positionPlayer(1);
      this.setPublisherAlpha(Phaser.Math.Easing.Sine.Out(progress));
      return;
    }

    if (this.elapsed < 7350) {
      this.positionPlayer(1);
      this.setPublisherAlpha(1);
      return;
    }

    if (this.elapsed < 8150) {
      const progress = Phaser.Math.Clamp((this.elapsed - 7350) / 800, 0, 1);
      this.setPublisherAlpha(1 - Phaser.Math.Easing.Sine.InOut(progress));
      this.setFade(progress);
      return;
    }

    this.leaveIntro();
  }

  private buildResponsiveScene() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.worldGraphics = this.add.graphics().setDepth(1);
    this.drawWorld(width, height);

    this.player = this.createPlayer(-Math.max(48, width * 0.06), height * 0.72);
    this.player.setDepth(20);

    this.playerShadow = this.add.ellipse(this.player.x, height * 0.75, 28, 9, 0x3a2b21, 0.28)
      .setDepth(19);

    this.ambientBrand = this.add.text(width * 0.055, height * 0.065, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: Math.max(14, Math.min(20, width * 0.018)) + 'px',
      fontStyle: 'bold',
      color: '#33271f',
      letterSpacing: 2.5,
    }).setDepth(30).setAlpha(0.9);

    this.veil = this.add.rectangle(0, 0, width, height, 0x16120f, 1)
      .setOrigin(0)
      .setDepth(100);

    const panelWidth = Math.min(width * 0.82, 720);
    const panelHeight = Math.min(height * 0.38, 210);

    this.panel = this.add.rectangle(width / 2, height * 0.48, panelWidth, panelHeight, 0x241c17, 0.94)
      .setStrokeStyle(Math.max(2, Math.min(width, height) * 0.004), 0xd2bc8e, 0.95)
      .setDepth(81)
      .setAlpha(0);

    const titleSize = Math.max(28, Math.min(60, Math.min(width, height) * 0.10));
    const presentsSize = Math.max(15, Math.min(25, Math.min(width, height) * 0.04));

    this.title = this.add.text(width / 2, height * 0.455, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: titleSize + 'px',
      fontStyle: 'bold',
      color: '#f5e7c4',
      letterSpacing: Math.max(2, Math.round(titleSize * 0.06)),
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0);

    this.presents = this.add.text(width / 2, height * 0.575, 'presents', {
      fontFamily: 'sans-serif',
      fontSize: presentsSize + 'px',
      color: '#d9c28f',
      fontStyle: 'italic',
      align: 'center',
    }).setOrigin(0.5).setDepth(82).setAlpha(0);

    this.setPublisherAlpha(0);
    this.setFade(1);
  }

  private handleResize(width: number, height: number) {
    if (this.leaving) return;

    this.cameras.main.setViewport(0, 0, width, height);
    this.worldGraphics?.clear();
    if (this.worldGraphics) this.drawWorld(width, height);

    const progress = Phaser.Math.Clamp((this.elapsed - 850) / 3200, 0, 1);
    if (this.player) {
      this.player.x = Phaser.Math.Linear(-Math.max(48, width * 0.06), width * 0.50, Phaser.Math.Easing.Sine.InOut(progress));
      this.player.y = height * 0.72;
      this.playerShadow?.setPosition(this.player.x, height * 0.75);
    }

    this.ambientBrand?.setPosition(width * 0.055, height * 0.065)
      .setFontSize(Math.max(14, Math.min(20, width * 0.018)));

    const panelWidth = Math.min(width * 0.82, 720);
    const panelHeight = Math.min(height * 0.38, 210);
    this.panel?.setPosition(width / 2, height * 0.48).setSize(panelWidth, panelHeight);

    const titleSize = Math.max(28, Math.min(60, Math.min(width, height) * 0.10));
    const presentsSize = Math.max(15, Math.min(25, Math.min(width, height) * 0.04));
    this.title?.setPosition(width / 2, height * 0.455).setFontSize(titleSize);
    this.presents?.setPosition(width / 2, height * 0.575).setFontSize(presentsSize);
    this.veil?.setSize(width, height);
  }

  private positionPlayer(progress: number) {
    if (!this.player) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const eased = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp(progress, 0, 1));

    this.player.x = Phaser.Math.Linear(-Math.max(48, width * 0.06), width * 0.50, eased);
    this.player.y = height * 0.72 + Math.sin(this.elapsed / 110) * 1.5;
    this.playerShadow?.setPosition(this.player.x, height * 0.75);
  }

  private setPublisherAlpha(alpha: number) {
    this.panel?.setAlpha(alpha);
    this.title?.setAlpha(alpha);
    this.presents?.setAlpha(alpha);
    this.panel?.setScale(0.94 + alpha * 0.06);
    this.title?.setScale(0.96 + alpha * 0.04);
    this.ambientBrand?.setAlpha(alpha >= 0.98 ? 0.9 : 0);
  }

  private setFade(alpha: number) {
    this.veil?.setAlpha(Phaser.Math.Clamp(alpha, 0, 1));
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(500, 22, 18, 14);
    this.time.delayedCall(500, () => this.scene.start('NameEntryScene'));
  }

  private drawWorld(width: number, height: number) {
    const g = this.worldGraphics;
    if (!g) return;

    g.fillStyle(0xd8c18d, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xc6a66c, 0.28).fillRect(0, 0, width, height * 0.34);
    g.fillStyle(0xd7b879, 1).fillRect(0, height * 0.34, width, height * 0.66);

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

    for (let x = 18; x < width; x += Math.max(30, width * 0.044)) {
      const y = height * 0.47 + ((x * 13) % Math.max(70, height * 0.20));
      g.fillStyle(0x71804a, 0.72).fillRect(x, y, 13, 5);
      g.fillStyle(0x899153, 0.65).fillRect(x + 4, y - 5, 5, 5);
    }

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

    g.fillStyle(0x707671, 1).fillRect(width * 0.865, height * 0.22, 24, 60);
    g.fillStyle(0x505653, 1).fillRect(width * 0.855, height * 0.20, 44, 11);
    g.fillStyle(0x505653, 1).fillRect(width * 0.873, height * 0.19, 8, 8);

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

    this.drawTree(width * 0.16, height * 0.29, 1.18);
    this.drawTree(width * 0.40, height * 0.28, 0.78);
    this.drawTree(width * 0.95, height * 0.43, 0.72);

    for (let i = 0; i < 18; i += 1) {
      const x = 24 + ((i * 149) % Math.max(80, width - 48));
      const y = height * 0.49 + ((i * 67) % Math.max(45, height * 0.42));
      g.fillStyle(i % 2 ? 0x79644d : 0x9b805d, 1).fillRect(x, y, 7, 4);
      if (i % 4 === 0) g.fillStyle(0x687648, 0.9).fillRect(x + 8, y - 4, 4, 8);
    }

    g.fillStyle(0xf5df9c, 0.72).fillCircle(width * 0.87, height * 0.14, Math.max(24, Math.min(42, width * 0.035)));
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.worldGraphics;
    if (!g) return;
    g.fillStyle(0x684a34, 1).fillRect(x - 5 * scale, y + 18 * scale, 10 * scale, 52 * scale);
    g.fillStyle(0x445a37, 1);
    g.fillRect(x - 46 * scale, y, 92 * scale, 17 * scale);
    g.fillRect(x - 34 * scale, y - 11 * scale, 68 * scale, 16 * scale);
    g.fillRect(x - 17 * scale, y - 21 * scale, 34 * scale, 13 * scale);
    g.fillStyle(0x637344, 1).fillRect(x - 33 * scale, y - 4 * scale, 66 * scale, 8 * scale);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 33, 24, 9, 0x4a3524, 0.28);

    const poseA = this.add.graphics();
    poseA.fillStyle(0x241d1a, 1).fillRect(-10, -22, 20, 10);
    poseA.fillStyle(0x70452e, 1).fillRect(-9, -14, 18, 14);
    poseA.fillStyle(0x236b68, 1).fillRect(-11, 0, 22, 19);
    poseA.fillStyle(0xd5a45d, 1).fillRect(-9, 19, 7, 13).fillRect(2, 19, 7, 13);
    poseA.fillStyle(0x253a38, 1).fillRect(-12, 30, 10, 5).fillRect(2, 30, 10, 5);
    poseA.fillStyle(0x5b3d2a, 1).fillRect(10, 3, 6, 16);

    const poseB = this.add.graphics();
    poseB.fillStyle(0x241d1a, 1).fillRect(-10, -22, 20, 10);
    poseB.fillStyle(0x70452e, 1).fillRect(-9, -14, 18, 14);
    poseB.fillStyle(0x236b68, 1).fillRect(-11, 1, 22, 19);
    poseB.fillStyle(0xd5a45d, 1).fillRect(-7, 20, 7, 13).fillRect(0, 18, 7, 13);
    poseB.fillStyle(0x253a38, 1).fillRect(-10, 31, 10, 5).fillRect(0, 29, 10, 5);
    poseB.fillStyle(0x5b3d2a, 1).fillRect(10, 4, 6, 16);

    container.add([shadow, poseA, poseB]);
    return container;
  }
}
