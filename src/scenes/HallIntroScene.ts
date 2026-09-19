import Phaser from 'phaser';

const HALL_INTRO_KEY = 'admin-hub-games:hall-intro-v2-seen';
const HALL_INTRO_DURATION = 5400;

export class HallIntroScene extends Phaser.Scene {
  private leaving = false;
  private ready = false;
  private resizeHandler?: () => void;
  private introStartedAt = 0;
  private inputReadyAt = 0;

  constructor() {
    super('HallIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.introStartedAt = this.time.now;
    // The Hall cinematic must not consume the menu button's opening gesture.
    this.inputReadyAt = this.time.now + 350;
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.drawBackdrop(width, height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    const veil = this.add.rectangle(0, 0, width, height, 0x17110e, 1).setOrigin(0).setDepth(100);
    const moon = this.add.circle(width * 0.78, height * 0.23, Math.max(34, Math.min(width, height) * 0.075), 0xf2d27b, 0.92).setDepth(2).setAlpha(0);
    const hallGlow = this.add.circle(width * 0.50, height * 0.61, Math.max(90, Math.min(width, height) * 0.22), 0x4d9b98, 0.10).setDepth(3).setAlpha(0);
    const hall = this.createHall(width, height).setDepth(10).setAlpha(0);
    const player = this.createPlayer(-44, height * 0.77).setDepth(20).setAlpha(0);

    const title = this.add.text(width / 2, height * 0.16, 'WELCOME TO THE HALL', {
      fontFamily: 'monospace',
      fontSize: Math.max(20, Math.min(38, Math.min(width, height) * 0.075)) + 'px',
      fontStyle: 'bold', color: '#493526', letterSpacing: 2, align: 'center',
      wordWrap: { width: width * 0.86 },
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    const line = this.add.text(width / 2, height * 0.28, 'Ideas become games here.', {
      fontFamily: 'monospace',
      fontSize: Math.max(13, Math.min(20, Math.min(width, height) * 0.038)) + 'px',
      color: '#73533a', align: 'center',
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    const instruction = this.add.text(width / 2, height * 0.86, 'EXPLORE  ·  READ  ·  LEAVE SOMETHING BEHIND', {
      fontFamily: 'monospace',
      fontSize: Math.max(9, Math.min(13, Math.min(width, height) * 0.022)) + 'px',
      color: '#6a5140', letterSpacing: 1.2, align: 'center',
      wordWrap: { width: width * 0.86 },
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    const skipHint = this.add.text(width / 2, height * 0.93, 'TAP / PRESS A KEY TO ENTER', {
      fontFamily: 'monospace', fontSize: '10px', color: '#493526', letterSpacing: 1, align: 'center',
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    // The cinematic is presentation only. Input never depends on a timer having fired.
    const skip = () => {
      if (this.time.now < this.inputReadyAt) return;
      this.enterHall();
    };
    this.input.on('pointerdown', skip);
    this.input.keyboard?.on('keydown', skip);

    this.tweens.add({ targets: veil, alpha: 0, duration: 900, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: [moon, hallGlow], alpha: 1, duration: 1200, delay: 350, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: hall, alpha: 1, duration: 1100, delay: 650, ease: 'Sine.easeOut' });

    this.tweens.add({
      targets: player, alpha: 1, x: width * 0.40, duration: 1800, delay: 950, ease: 'Sine.easeInOut',
      onUpdate: () => { player.y = height * 0.77 + Math.sin(this.time.now / 130) * 1.8; },
    });

    this.time.delayedCall(2350, () => {
      if (this.leaving) return;
      this.tweens.add({ targets: [title, line], alpha: 1, y: '-=4', duration: 700, ease: 'Sine.easeOut' });
    });

    this.time.delayedCall(3150, () => {
      if (!this.leaving) this.tweens.add({ targets: instruction, alpha: 1, duration: 550 });
    });

    this.time.delayedCall(3800, () => {
      if (this.leaving) return;
      this.ready = true;
      skipHint.setAlpha(0.75);
      this.tweens.add({ targets: skipHint, alpha: 0.30, duration: 850, yoyo: true, repeat: -1 });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.off('pointerdown', skip);
      this.input.keyboard?.off('keydown', skip);
    });
  }

  update() {
    // Recover if the browser/PWA suspended the scene and delayed callbacks.
    if (!this.leaving && this.time.now - this.introStartedAt >= HALL_INTRO_DURATION) {
      this.ready = true;
      this.enterHall();
    }
  }

  private handleResize(width: number, height: number) {
    if (!this.leaving) this.cameras.main.setViewport(0, 0, width, height);
  }

  private enterHall() {
    if (this.leaving) return;
    this.leaving = true;
    try { window.localStorage.setItem(HALL_INTRO_KEY, 'seen'); } catch { /* optional */ }
    this.cameras.main.fadeOut(500, 22, 18, 14);
    this.time.delayedCall(500, () => this.scene.start('NameEntryScene'));
  }

  private drawBackdrop(width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(0xe8d6a8, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xd0ad70, 1).fillRect(0, height * 0.58, width, height * 0.42);
    g.fillStyle(0xa76545, 1);
    g.beginPath();
    g.moveTo(0, height * 0.72); g.lineTo(width * 0.25, height * 0.62); g.lineTo(width * 0.50, height * 0.67);
    g.lineTo(width * 0.76, height * 0.59); g.lineTo(width, height * 0.64); g.lineTo(width, height); g.lineTo(0, height);
    g.closePath(); g.fillPath();
    for (const [x, y, r] of [[0.12, 0.48, 18], [0.26, 0.43, 12], [0.86, 0.48, 16], [0.93, 0.41, 10]] as const) {
      g.fillStyle(0x405638, 0.9); g.fillCircle(width * x, height * y, r);
    }
  }

  private createHall(width: number, height: number) {
    const container = this.add.container(width * 0.58, height * 0.59);
    const w = Math.min(width * 0.50, 470);
    const h = Math.min(height * 0.34, 190);
    const shadow = this.add.ellipse(0, h * 0.54, w * 0.78, 24, 0x493526, 0.20);
    const building = this.add.rectangle(0, h * 0.10, w, h * 0.72, 0xe9dfc4, 1).setStrokeStyle(4, 0x2f7775, 1);
    const roof = this.add.triangle(0, -h * 0.35, w * 0.50 + 16, h * 0.55, 0, 0, -w * 0.50 - 16, h * 0.55, 0x2f7775, 1);
    const doorway = this.add.rectangle(0, h * 0.33, Math.min(44, w * 0.13), h * 0.28, 0x493526, 1);
    const glow = this.add.circle(0, h * 0.18, Math.min(54, w * 0.15), 0xf2d27b, 0.12).setStrokeStyle(3, 0xf2d27b, 0.75);
    const name = this.add.text(0, -h * 0.51, 'SYSTEMS HALL', {
      fontFamily: 'monospace', fontSize: Math.max(14, Math.min(25, w * 0.055)) + 'px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#493526', strokeThickness: 6, align: 'center',
    }).setOrigin(0.5);
    const stations = this.add.text(0, h * 0.57, 'IDEA WALL   ·   BUILD CHAMBER   ·   GAME GATE', {
      fontFamily: 'monospace', fontSize: Math.max(7, Math.min(11, w * 0.023)) + 'px', color: '#594838', align: 'center',
    }).setOrigin(0.5);
    container.add([shadow, building, roof, doorway, glow, name, stations]);
    this.tweens.add({ targets: glow, alpha: 0.28, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return container;
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x2e241e, 1).fillRect(-9, -20, 18, 9);
    g.fillStyle(0x6e432c, 1).fillRect(-8, -12, 16, 12);
    g.fillStyle(0x1f6b68, 1).fillRect(-10, 0, 20, 19);
    g.fillStyle(0xd4a45d, 1).fillRect(-9, 19, 7, 12).fillRect(2, 19, 7, 12);
    g.fillStyle(0x263b3a, 1).fillRect(-11, 30, 9, 5).fillRect(2, 30, 9, 5);
    g.fillStyle(0x5b3d2a, 1).fillRect(9, 3, 6, 16);
    container.add(g);
    return container;
  }
}