import Phaser from 'phaser';

const INTRO_SEEN_KEY = 'admin-hub-games:presidents-shoes-intro-v1-seen';

export class PresidentsShoesIntroScene extends Phaser.Scene {
  private leaving = false;
  private ready = false;

  constructor() {
    super('PresidentsShoesIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#071018');

    const g = this.add.graphics();
    g.fillStyle(0x071018, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x123c3b, 0.72).fillRect(0, height * 0.58, width, height * 0.42);
    g.fillStyle(0xe0b65a, 0.9).fillCircle(width * 0.78, height * 0.22, Math.max(28, Math.min(width, height) * 0.055));
    g.fillStyle(0x0d2b31, 1);
    g.fillRect(width * 0.08, height * 0.52, width * 0.84, height * 0.24);

    for (let i = 0; i < 12; i += 1) {
      const x = width * (0.12 + (i % 6) * 0.15);
      const y = height * (0.49 + Math.floor(i / 6) * 0.06);
      g.fillStyle(i % 3 === 0 ? 0xe0b65a : 0x55d6c2, 0.65);
      g.fillRect(x, y, 7, 12);
    }

    this.add.text(width / 2, height * 0.16, "PRESIDENT'S SHOES", {
      fontFamily: 'monospace',
      fontSize: Math.max(24, Math.min(54, Math.min(width, height) * 0.095)) + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      letterSpacing: 2,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.29, 'A FICTIONAL DECISION STORY FROM BOTSWANA', {
      fontFamily: 'monospace',
      fontSize: Math.max(10, Math.min(14, Math.min(width, height) * 0.024)) + 'px',
      color: '#55d6c2',
      letterSpacing: 1.3,
      align: 'center',
    }).setOrigin(0.5);

    const panel = this.add.rectangle(width / 2, height * 0.56, Math.min(width * 0.82, 720), Math.min(height * 0.42, 240), 0x101b2d, 0.94)
      .setStrokeStyle(2, 0x55d6c2, 0.75);

    this.add.text(panel.x, panel.y - panel.height * 0.30, 'You have the office for a story.', {
      fontFamily: 'monospace',
      fontSize: Math.max(16, Math.min(24, Math.min(width, height) * 0.042)) + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      align: 'center',
      wordWrap: { width: panel.width * 0.82 },
    }).setOrigin(0.5);

    this.add.text(panel.x, panel.y - panel.height * 0.02,
      'Make decisions. See consequences. Live with trade-offs.\nThis is a fictional game, not presidential training or a prediction of real politics.',
      {
        fontFamily: 'sans-serif',
        fontSize: Math.max(13, Math.min(18, Math.min(width, height) * 0.032)) + 'px',
        color: '#a9b8d6',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: panel.width * 0.78 },
      }).setOrigin(0.5);

    const hint = this.add.text(width / 2, height * 0.84, 'TAP / PRESS A KEY TO CONTINUE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e0b65a',
      letterSpacing: 1.2,
    }).setOrigin(0.5).setAlpha(0);

    const continueGame = () => {
      if (this.ready) this.enterSetup();
    };

    this.input.on('pointerdown', continueGame);
    this.input.keyboard?.on('keydown', continueGame);

    this.time.delayedCall(900, () => {
      if (this.leaving) return;
      this.ready = true;
      hint.setAlpha(0.82);
      this.tweens.add({ targets: hint, alpha: 0.3, duration: 850, yoyo: true, repeat: -1 });
      this.time.delayedCall(2600, () => this.enterSetup());
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', continueGame);
      this.input.keyboard?.off('keydown', continueGame);
    });

    void INTRO_SEEN_KEY;
  }

  private enterSetup() {
    if (this.leaving) return;
    this.leaving = true;
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, 'seen');
    } catch {
      // Optional local storage.
    }
    this.cameras.main.fadeOut(400, 7, 16, 24);
    this.time.delayedCall(400, () => this.scene.start('PresidentsShoesSetupScene'));
  }
}
