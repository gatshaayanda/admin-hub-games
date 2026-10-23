import Phaser from 'phaser';

export class LivingWorldIntroScene extends Phaser.Scene {
  constructor() {
    super('LivingWorldIntroScene');
  }

  create() {
    const render = () => {
      const { width, height } = this.scale;
      this.children.removeAll();
      this.cameras.main.setBackgroundColor('#172b22');
      this.add.text(width / 2, height * 0.18, 'LIVING WORLD', {
        fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(30, Math.min(64, height * 0.11))}px`,
        fontStyle: 'bold', color: '#f3edda', letterSpacing: 2, align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.29, 'ONE WORLD. MANY LIVES.', {
        fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
        color: '#d7bd79', letterSpacing: 2, align: 'center',
      }).setOrigin(0.5);
      const copy = [
        'A living-world simulation foundation.',
        'Animals need care. Grazing recovers. Water runs low.',
        'Time moves forward while you are away.',
        '',
        'This first build tests the world clock and persistence.',
        '3D animals, herding and wildlife will build on this same world.',
      ].join('\n');
      this.add.text(width / 2, height * 0.49, copy, {
        fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(15, Math.min(21, height * 0.034))}px`,
        color: '#e2e9dd', align: 'center', lineSpacing: 9,
        wordWrap: { width: Math.min(width * 0.84, 760) },
      }).setOrigin(0.5);
      const button = this.add.text(width / 2, height * 0.82, 'ENTER THE WORLD  →', {
        fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold',
        color: '#172b22', backgroundColor: '#d7bd79', padding: { x: 24, y: 17 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: false });
      button.on('pointerdown', () => this.scene.start('LivingWorldSetupScene'));
      this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('LivingWorldSetupScene'));
    };
    render();
    this.scale.on(Phaser.Scale.Events.RESIZE, render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, render, this));
  }
}
