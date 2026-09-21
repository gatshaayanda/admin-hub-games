import Phaser from 'phaser';

export class ShootersTriggerIntroScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('ShootersTriggerIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#14261d');
    const g = this.add.graphics();
    g.fillStyle(0x173324, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x254b32, 1).fillRect(0, height * 0.62, width, height * 0.38);
    g.fillStyle(0xe8c95c, 1).fillRect(0, 0, width, Math.max(5, height * 0.012));

    this.add.text(width / 2, height * 0.18, 'SHOOTERS\nTRIGGER', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(38, Math.min(78, Math.min(width, height) * 0.13)) + 'px',
      fontStyle: 'bold', color: '#f4f1df', align: 'center', lineSpacing: -7,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.39, 'PAINTBALL · FIELD TRAINING · MOVEMENT + AIM', {
      fontFamily: 'monospace', fontSize: Math.max(10, Math.min(16, Math.min(width, height) * 0.026)) + 'px',
      fontStyle: 'bold', color: '#e8c95c', letterSpacing: 1.4,
    }).setOrigin(0.5);

    const panel = this.add.rectangle(width / 2, height * 0.60, Math.min(width * 0.86, 760), Math.min(height * 0.30, 220), 0x102018, 0.94)
      .setStrokeStyle(3, 0x8ab56a, 0.75);

    this.add.text(panel.x, panel.y - panel.height * 0.25, 'THE FIELD IS YOURS.', {
      fontFamily: 'monospace', fontSize: Math.max(14, Math.min(21, Math.min(width, height) * 0.035)) + 'px',
      fontStyle: 'bold', color: '#f4f1df', align: 'center', wordWrap: { width: panel.width * 0.82 },
    }).setOrigin(0.5);

    this.add.text(panel.x, panel.y + panel.height * 0.08,
      'Learn the field by moving through it. Walk, use cover, aim, fire\nand build the movement feel before the full match is rebuilt.',
      {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: Math.max(14, Math.min(19, Math.min(width, height) * 0.031)) + 'px',
        color: '#cbd9c4', align: 'center', lineSpacing: 6,
        wordWrap: { width: panel.width * 0.82 },
      }).setOrigin(0.5);

    const hint = this.add.text(width / 2, height * 0.88, 'TAP TO ENTER TRAINING', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: '#e8c95c', letterSpacing: 1.4,
    }).setOrigin(0.5);

    const enter = () => this.enterSetup();
    this.input.once('pointerdown', enter);
    this.input.keyboard?.once('keydown', enter);
    this.tweens.add({ targets: hint, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', enter);
      this.input.keyboard?.off('keydown', enter);
    });
  }

  private enterSetup() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(350, 16, 26, 19);
    this.time.delayedCall(350, () => this.scene.start('ShootersTriggerSetupScene'));
  }
}
