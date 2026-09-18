import Phaser from 'phaser';

export class PublisherIntroScene extends Phaser.Scene {
  private leaving = false;
  private elapsed = 0;
  private background?: Phaser.GameObjects.Graphics;
  private stars?: Phaser.GameObjects.Graphics;
  private horizon?: Phaser.GameObjects.Graphics;
  private player?: Phaser.GameObjects.Container;
  private playerGlow?: Phaser.GameObjects.Arc;
  private logoMark?: Phaser.GameObjects.Graphics;
  private logoTitle?: Phaser.GameObjects.Text;
  private logoRule?: Phaser.GameObjects.Rectangle;
  private presents?: Phaser.GameObjects.Text;
  private topLabel?: Phaser.GameObjects.Text;
  private veil?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#070b1d');
    this.buildScene(this.scale.width, this.scale.height);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  update(_time: number, delta: number) {
    if (this.leaving) return;
    this.elapsed += delta;

    if (this.elapsed < 700) {
      const p = Phaser.Math.Clamp(this.elapsed / 700, 0, 1);
      this.setVeil(1 - p);
      this.positionPlayer(0);
      return;
    }

    if (this.elapsed < 3300) {
      const p = Phaser.Math.Clamp((this.elapsed - 700) / 2600, 0, 1);
      this.setVeil(0);
      this.positionPlayer(p);
      return;
    }

    if (this.elapsed < 4000) {
      this.positionPlayer(1);
      this.setVeil(0);
      return;
    }

    if (this.elapsed < 4950) {
      const p = Phaser.Math.Clamp((this.elapsed - 4000) / 950, 0, 1);
      this.positionPlayer(1);
      this.revealBrand(Phaser.Math.Easing.Cubic.Out(p));
      return;
    }

    if (this.elapsed < 6750) {
      this.positionPlayer(1);
      this.revealBrand(1);
      return;
    }

    if (this.elapsed < 7550) {
      const p = Phaser.Math.Clamp((this.elapsed - 6750) / 800, 0, 1);
      this.revealBrand(1 - Phaser.Math.Easing.Cubic.InOut(p));
      this.setVeil(p);
      return;
    }

    this.leaveIntro();
  }

  private buildScene(width: number, height: number) {
    this.background = this.add.graphics().setDepth(1);
    this.stars = this.add.graphics().setDepth(2);
    this.horizon = this.add.graphics().setDepth(3);
    this.drawBackground(width, height);

    this.player = this.createPlayer(-Math.max(60, width * 0.08), height * 0.72);
    this.player.setDepth(20);

    this.playerGlow = this.add.circle(this.player.x, height * 0.75, 26, 0x55d6c2, 0.10)
      .setDepth(19);

    this.topLabel = this.add.text(width / 2, Math.max(28, height * 0.075), 'A STUDIO FOR PLAYABLE WORLDS', {
      fontFamily: 'monospace',
      fontSize: Math.max(9, Math.min(12, width * 0.011)) + 'px',
      color: '#8da4c9',
      letterSpacing: 2.2,
      align: 'center',
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    this.logoMark = this.add.graphics().setDepth(31).setAlpha(0);
    this.drawLogoMark(width / 2, height * 0.43, Math.min(width, height));

    this.logoTitle = this.add.text(width / 2, height * 0.535, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: Math.max(24, Math.min(54, Math.min(width, height) * 0.082)) + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      letterSpacing: Math.max(3, Math.round(Math.min(width, height) * 0.006)),
      align: 'center',
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    this.logoRule = this.add.rectangle(width / 2, height * 0.595, Math.min(190, width * 0.34), 2, 0x55d6c2, 0.9)
      .setDepth(32).setScaleX(0).setAlpha(0);

    this.presents = this.add.text(width / 2, height * 0.64, 'presents', {
      fontFamily: 'sans-serif',
      fontSize: Math.max(14, Math.min(20, Math.min(width, height) * 0.031)) + 'px',
      color: '#e2bd67',
      letterSpacing: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    this.veil = this.add.rectangle(0, 0, width, height, 0x070b1d, 1)
      .setOrigin(0)
      .setDepth(100);

    this.setVeil(1);
    this.revealBrand(0);
  }

  private handleResize(width: number, height: number) {
    if (this.leaving) return;

    this.cameras.main.setViewport(0, 0, width, height);
    this.drawBackground(width, height);

    const p = Phaser.Math.Clamp((this.elapsed - 700) / 2600, 0, 1);
    if (this.player) {
      this.player.x = Phaser.Math.Linear(-Math.max(60, width * 0.08), width * 0.50, Phaser.Math.Easing.Sine.InOut(p));
      this.player.y = height * 0.72;
      this.playerGlow?.setPosition(this.player.x, height * 0.75);
    }

    this.topLabel?.setPosition(width / 2, Math.max(28, height * 0.075));
    this.logoTitle?.setPosition(width / 2, height * 0.535)
      .setFontSize(Math.max(24, Math.min(54, Math.min(width, height) * 0.082)));
    this.logoRule?.setPosition(width / 2, height * 0.595)
      .setSize(Math.min(190, width * 0.34), 2);
    this.presents?.setPosition(width / 2, height * 0.64)
      .setFontSize(Math.max(14, Math.min(20, Math.min(width, height) * 0.031)));

    this.logoMark?.clear();
    this.drawLogoMark(width / 2, height * 0.43, Math.min(width, height));
    this.veil?.setSize(width, height);
  }

  private drawBackground(width: number, height: number) {
    this.background?.clear();
    this.stars?.clear();
    this.horizon?.clear();

    const bg = this.background;
    const stars = this.stars;
    const horizon = this.horizon;
    if (!bg || !stars || !horizon) return;

    bg.fillGradientStyle(0x070b1d, 0x111a42, 0x070b1d, 0x182a52, 1);
    bg.fillRect(0, 0, width, height);

    bg.fillStyle(0x15234b, 0.55);
    bg.fillCircle(width * 0.76, height * 0.26, Math.max(90, Math.min(width, height) * 0.20));
    bg.fillStyle(0x55d6c2, 0.05);
    bg.fillCircle(width * 0.76, height * 0.26, Math.max(140, Math.min(width, height) * 0.30));

    for (let i = 0; i < 58; i += 1) {
      const x = (i * 173.7) % width;
      const y = (i * 83.9) % (height * 0.58);
      const radius = i % 9 === 0 ? 1.7 : i % 3 === 0 ? 1.2 : 0.7;
      stars.fillStyle(i % 7 === 0 ? 0xe2bd67 : 0xdce7ff, i % 5 === 0 ? 0.9 : 0.55);
      stars.fillCircle(x, y, radius);
    }

    stars.fillStyle(0xffffff, 0.08);
    stars.fillCircle(width * 0.76, height * 0.26, Math.max(38, Math.min(width, height) * 0.09));
    stars.fillStyle(0xe2bd67, 0.18);
    stars.fillCircle(width * 0.76, height * 0.26, Math.max(26, Math.min(width, height) * 0.065));

    horizon.fillStyle(0x050816, 1);
    horizon.beginPath();
    horizon.moveTo(0, height * 0.68);
    horizon.lineTo(width * 0.14, height * 0.60);
    horizon.lineTo(width * 0.28, height * 0.66);
    horizon.lineTo(width * 0.43, height * 0.57);
    horizon.lineTo(width * 0.58, height * 0.65);
    horizon.lineTo(width * 0.73, height * 0.55);
    horizon.lineTo(width * 0.86, height * 0.63);
    horizon.lineTo(width, height * 0.57);
    horizon.lineTo(width, height);
    horizon.lineTo(0, height);
    horizon.closePath();
    horizon.fillPath();

    horizon.fillStyle(0x0d1830, 1);
    horizon.fillRect(0, height * 0.70, width, height * 0.30);

    horizon.lineStyle(1, 0x55d6c2, 0.12);
    for (let i = 0; i < 9; i += 1) {
      const y = height * (0.71 + i * 0.035);
      horizon.lineBetween(width * 0.10, y, width * 0.90, y);
    }

    horizon.fillStyle(0xe2bd67, 0.55);
    horizon.fillRect(width * 0.13, height * 0.695, width * 0.18, 1);
    horizon.fillRect(width * 0.69, height * 0.695, width * 0.18, 1);
  }

  private drawLogoMark(x: number, y: number, minDimension: number) {
    const g = this.logoMark;
    if (!g) return;

    const s = Math.max(20, Math.min(42, minDimension * 0.065));
    g.lineStyle(Math.max(2, s * 0.055), 0x55d6c2, 1);
    g.strokeCircle(x, y, s);
    g.lineStyle(Math.max(1, s * 0.035), 0xe2bd67, 0.95);
    g.strokeCircle(x, y, s * 0.70);

    g.fillStyle(0x55d6c2, 0.95);
    g.fillTriangle(x, y - s * 0.46, x - s * 0.32, y + s * 0.28, x + s * 0.32, y + s * 0.28);

    g.fillStyle(0x070b1d, 1);
    g.fillCircle(x, y, s * 0.30);
    g.fillStyle(0xf4f7ff, 0.95);
    g.fillRect(x - s * 0.055, y - s * 0.17, s * 0.11, s * 0.34);
  }

  private positionPlayer(progress: number) {
    if (!this.player) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const eased = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp(progress, 0, 1));

    this.player.x = Phaser.Math.Linear(-Math.max(60, width * 0.08), width * 0.50, eased);
    this.player.y = height * 0.72 + Math.sin(this.elapsed / 105) * 1.2;
    this.playerGlow?.setPosition(this.player.x, height * 0.75);
  }

  private revealBrand(alpha: number) {
    this.topLabel?.setAlpha(alpha * 0.9);
    this.logoMark?.setAlpha(alpha);
    this.logoTitle?.setAlpha(alpha);
    this.logoRule?.setAlpha(alpha).setScale(1, 1);
    this.logoRule?.setScaleX(0.2 + alpha * 0.8);
    this.presents?.setAlpha(alpha);
    this.logoTitle?.setScale(0.97 + alpha * 0.03);
  }

  private setVeil(alpha: number) {
    this.veil?.setAlpha(Phaser.Math.Clamp(alpha, 0, 1));
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(450, 7, 11, 29);
    this.time.delayedCall(450, () => this.scene.start('NameEntryScene'));
  }

  private createPlayer(x: number, y: number) {
    const c = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 30, 30, 8, 0x000000, 0.35);

    const cloak = this.add.graphics();
    cloak.fillStyle(0x1b8f8a, 1);
    cloak.beginPath();
    cloak.moveTo(-13, 4);
    cloak.lineTo(13, 4);
    cloak.lineTo(9, 28);
    cloak.lineTo(-11, 28);
    cloak.closePath();
    cloak.fillPath();

    cloak.fillStyle(0x55d6c2, 0.85);
    cloak.fillRect(-3, 5, 6, 22);

    const body = this.add.graphics();
    body.fillStyle(0xe6c982, 1);
    body.fillCircle(0, -12, 8);
    body.fillStyle(0x10172d, 1);
    body.fillRect(-8, -21, 16, 7);
    body.fillRect(-11, -17, 22, 4);
    body.fillStyle(0x24385b, 1);
    body.fillRect(-8, -3, 16, 12);
    body.fillStyle(0xe2bd67, 1);
    body.fillRect(-10, 8, 7, 19);
    body.fillRect(3, 8, 7, 19);
    body.fillStyle(0x080d20, 1);
    body.fillRect(-12, 27, 9, 5);
    body.fillRect(3, 27, 9, 5);

    const staff = this.add.graphics();
    staff.lineStyle(3, 0xe2bd67, 1);
    staff.lineBetween(13, 2, 17, 29);
    staff.fillStyle(0x55d6c2, 1);
    staff.fillCircle(13, 0, 5);
    staff.fillStyle(0xffffff, 0.85);
    staff.fillCircle(13, 0, 2);

    c.add([shadow, cloak, body, staff]);
    return c;
  }
}
