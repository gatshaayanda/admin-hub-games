import Phaser from 'phaser';

export class PresidentsShoesIntroScene extends Phaser.Scene {
  private leaving = false;
  private ready = false;

  constructor() {
    super('PresidentsShoesIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f6efe2');

    const g = this.add.graphics();
    g.fillStyle(0xf6efe2, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x0f5a60, 1).fillRect(0, height * 0.70, width, height * 0.30);
    g.fillStyle(0xd7a93d, 1).fillRect(0, 0, width, Math.max(8, height * 0.018));
    g.fillStyle(0x1b3430, 0.12).fillCircle(width * 0.84, height * 0.22, Math.max(50, Math.min(width, height) * 0.14));

    this.add.text(width / 2, height * 0.17, "PRESIDENT'S\nSHOES", {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(34, Math.min(72, Math.min(width, height) * 0.12)) + 'px',
      fontStyle: 'bold',
      color: '#123f3d',
      align: 'center',
      lineSpacing: -6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.34, 'BOTSWANA · FICTIONAL · CHOICES', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(12, Math.min(17, Math.min(width, height) * 0.028)) + 'px',
      fontStyle: 'bold',
      color: '#0f5a60',
      letterSpacing: 2,
      align: 'center',
    }).setOrigin(0.5);

    const panel = this.add.rectangle(width / 2, height * 0.55, Math.min(width * 0.86, 760), Math.min(height * 0.34, 270), 0xfffbf3, 1)
      .setStrokeStyle(3, 0x0f5a60, 0.85);

    this.add.text(panel.x, panel.y - panel.height * 0.27, 'Your first week starts now.', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(20, Math.min(30, Math.min(width, height) * 0.05)) + 'px',
      fontStyle: 'bold',
      color: '#173d39',
      align: 'center',
      wordWrap: { width: panel.width * 0.82 },
    }).setOrigin(0.5);

    this.add.text(panel.x, panel.y + panel.height * 0.02, 'Water. Traffic. The clinic. The kgotla.\nPeople need answers — and somebody has to choose.\n\nMake the call. Then deal with what you started.', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(15, Math.min(20, Math.min(width, height) * 0.033)) + 'px',
      color: '#405b58',
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: panel.width * 0.82 },
    }).setOrigin(0.5);

    const hint = this.add.text(width / 2, height * 0.86, 'TAP TO STEP INTO THE SHOES', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#d7a93d',
      letterSpacing: 1.5,
    }).setOrigin(0.5).setAlpha(0);

    const continueGame = () => {
      if (this.ready) this.enterSetup();
    };

    this.input.on('pointerdown', continueGame);
    this.input.keyboard?.on('keydown', continueGame);

    this.time.delayedCall(900, () => {
      if (this.leaving) return;
      this.ready = true;
      hint.setAlpha(1);
      this.tweens.add({ targets: hint, alpha: 0.35, duration: 750, yoyo: true, repeat: -1 });
      this.time.delayedCall(5200, () => this.enterSetup());
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', continueGame);
      this.input.keyboard?.off('keydown', continueGame);
    });
  }

  private enterSetup() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 15, 90, 96);
    this.time.delayedCall(400, () => this.scene.start('PresidentsShoesSetupScene'));
  }
}
