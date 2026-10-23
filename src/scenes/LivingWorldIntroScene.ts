import Phaser from 'phaser';

export class LivingWorldIntroScene extends Phaser.Scene {
  constructor() {
    super('LivingWorldIntroScene');
  }

  create() {
    const render = () => {
      const { width, height } = this.scale;
      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor('#172b22');
      this.add.text(width / 2, height * 0.18, 'PAWS WORLD', {
        fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(30, Math.min(64, height * 0.11))}px`,
        fontStyle: 'bold', color: '#f3edda', letterSpacing: 2, align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.29, 'ONE WORLD. MANY LIVES.', {
        fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
        color: '#d7bd79', letterSpacing: 2, align: 'center',
      }).setOrigin(0.5);
      const copy = [
        'A home range for Jackie, Tiger and Percy.',
        'Explore a living farm, care for your dogs, and guide sheep and goats.',
        'Move freely, read the range map, and learn how animals react.',
        '',
        'A 2D world with clear landmarks and phone-first controls.',
        'Herding, stalking and teamwork begin here.',
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
    };
    const enterSetup = () => this.scene.start('LivingWorldSetupScene');
    this.input.keyboard?.once('keydown-ENTER', enterSetup);
    render();
    this.scale.on(Phaser.Scale.Events.RESIZE, render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, render, this));
  }
}
