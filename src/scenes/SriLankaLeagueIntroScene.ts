import Phaser from 'phaser';

export class SriLankaLeagueIntroScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('SriLankaLeagueIntroScene');
  }

  create() {
    const render = () => {
      this.children.removeAll(true);
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor('#d6a36a');
      const art = this.add.graphics();
      art.fillStyle(0x9d7046, 1).fillRect(0, height * 0.63, width, height * 0.37);
      art.fillStyle(0x5d4938, 1).fillRect(0, height * 0.72, width, height * 0.28);
      art.fillStyle(0xead7b4, 1).fillRect(0, height * 0.72, width, Math.max(3, height * 0.008));
      art.fillStyle(0xa84f37, 1).fillRect(width * 0.36, height * 0.54, width * 0.018, height * 0.12);
      art.fillStyle(0xa84f37, 1).fillRect(width * 0.62, height * 0.54, width * 0.018, height * 0.12);

      this.add.text(width / 2, height * 0.20, 'SRI LANKA', {
        fontFamily: 'Arial, sans-serif', fontSize: Math.max(38, Math.min(78, height * 0.14)) + 'px',
        fontStyle: 'bold', color: '#3a2a1c', letterSpacing: 2, align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.31, 'LEAGUE', {
        fontFamily: 'Arial, sans-serif', fontSize: Math.max(34, Math.min(62, height * 0.11)) + 'px',
        fontStyle: 'bold', color: '#f8edda', letterSpacing: 5, align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.43, 'BOTSWANA STREET FOOTBALL · FIRST TO 3', {
        fontFamily: 'monospace', fontSize: Math.max(9, Math.min(14, height * 0.024)) + 'px',
        fontStyle: 'bold', color: '#4a3525', letterSpacing: 1.1, align: 'center',
      }).setOrigin(0.5);
      const button = this.add.rectangle(width / 2, height * 0.86, Math.min(330, width * 0.76), 56, 0x2d261f, 1)
        .setStrokeStyle(2, 0xf0d08b, 0.9).setInteractive({ useHandCursor: false });
      this.add.text(button.x, button.y, 'ENTER THE STREET  →', {
        fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#fff8e9', letterSpacing: 1.1,
      }).setOrigin(0.5);
      button.on('pointerdown', () => this.enterSetup());
    };

    render();
    this.scale.on(Phaser.Scale.Events.RESIZE, render, this);
    const enter = () => this.enterSetup();
    this.input.keyboard?.once('keydown-ENTER', enter);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, render, this);
      this.input.keyboard?.off('keydown-ENTER', enter);
    });
  }

  private enterSetup() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(320, 72, 48, 29);
    this.time.delayedCall(320, () => this.scene.start('SriLankaLeagueSetupScene'));
  }
}
