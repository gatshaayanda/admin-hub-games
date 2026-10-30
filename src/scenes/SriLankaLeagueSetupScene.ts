import Phaser from 'phaser';

export class SriLankaLeagueSetupScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('SriLankaLeagueSetupScene');
  }

  create() {
    const render = () => {
      this.children.removeAll(true);
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor('#34271f');
      const panelWidth = Math.min(width * 0.88, 760);
      const panelHeight = Math.min(height * 0.72, 390);
      this.add.rectangle(width / 2, height / 2, width, height, 0x34271f, 1);
      this.add.rectangle(width / 2, height * 0.17, width, height * 0.34, 0xb7834e, 1);
      this.add.rectangle(width / 2, height * 0.36, width, height * 0.04, 0x6d4a30, 1);
      const panel = this.add.rectangle(width / 2, height * 0.56, panelWidth, panelHeight, 0x46362a, 0.98)
        .setStrokeStyle(2, 0xe7c887, 0.8);

      this.add.text(width / 2, panel.y - panel.height * 0.39, 'THE STREET RULES', {
        fontFamily: 'Arial, sans-serif', fontSize: Math.max(25, Math.min(40, height * 0.075)) + 'px',
        fontStyle: 'bold', color: '#fff4df', align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, panel.y - panel.height * 0.11,
        'One player. One football. Two brick goalposts.\nScore three goals to become the street champion.',
        {
          fontFamily: 'Arial, sans-serif', fontSize: Math.max(15, Math.min(20, height * 0.034)) + 'px',
          color: '#f0ddc2', align: 'center', lineSpacing: 8, wordWrap: { width: panelWidth * 0.82 },
        }).setOrigin(0.5);
      this.add.text(width / 2, panel.y + panel.height * 0.17,
        'PHONE: LEFT STICK TO MOVE · RUN TO SPRINT · KICK TO SHOOT\nDESKTOP: W A S D / ARROWS · SHIFT TO SPRINT · SPACE TO KICK\nP OR ESCAPE TO PAUSE',
        {
          fontFamily: 'monospace', fontSize: Math.max(9, Math.min(13, height * 0.021)) + 'px',
          color: '#e7c887', align: 'center', lineSpacing: 8, wordWrap: { width: panelWidth * 0.86 },
        }).setOrigin(0.5);

      const button = this.add.rectangle(width / 2, height * 0.86, Math.min(320, width * 0.72), 54, 0xe7c887, 1)
        .setStrokeStyle(2, 0xfff4df, 0.8).setInteractive({ useHandCursor: false });
      this.add.text(button.x, button.y, 'KICK OFF  →', {
        fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#34271f', letterSpacing: 1.4,
      }).setOrigin(0.5);
      button.on('pointerdown', () => this.startMatch());
    };

    render();
    this.scale.on(Phaser.Scale.Events.RESIZE, render, this);
    const enter = () => this.startMatch();
    this.input.keyboard?.once('keydown-ENTER', enter);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, render, this);
      this.input.keyboard?.off('keydown-ENTER', enter);
    });
  }

  private startMatch() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 52, 39, 29);
    this.time.delayedCall(300, () => this.scene.start('SriLankaLeagueGameScene'));
  }
}
