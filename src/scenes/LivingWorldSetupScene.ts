import Phaser from 'phaser';

export class LivingWorldSetupScene extends Phaser.Scene {
  constructor() {
    super('LivingWorldSetupScene');
  }

  create() {
    const render = () => {
      const { width, height } = this.scale;
      this.children.removeAll(true)
      this.cameras.main.setBackgroundColor('#f3edda');
      this.add.text(width / 2, height * 0.17, 'YOUR HOME PADDOCK', {
        fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(24, Math.min(42, height * 0.07))}px`,
        fontStyle: 'bold', color: '#233e30', align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.30,
        'A small starter world is ready. Three goats, three grazing patches,\none water trough, and a world clock that continues when you leave.',
        {
          fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(15, Math.min(20, height * 0.033))}px`,
          color: '#536b57', align: 'center', lineSpacing: 8,
          wordWrap: { width: width * 0.84 },
        }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.52,
        'FIRST FOUNDATION CHECKPOINT\n\n✓ Versioned world state\n✓ Offline elapsed-time progression\n✓ Local save validation\n✓ A shared simulation for future game modes',
        {
          fontFamily: 'monospace', fontSize: `${Math.max(12, Math.min(17, height * 0.027))}px`,
          color: '#233e30', align: 'center', lineSpacing: 7,
        }).setOrigin(0.5);
      const button = this.add.text(width / 2, height * 0.83, 'OPEN WORLD DASHBOARD  →', {
        fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold',
        color: '#f3edda', backgroundColor: '#285440', padding: { x: 20, y: 16 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: false });
      button.on('pointerdown', () => this.scene.start('LivingWorldGameScene'));
    };
    const enterWorld = () => this.scene.start('LivingWorldGameScene');
    this.input.keyboard?.once('keydown-ENTER', enterWorld);
    render();
    this.scale.on(Phaser.Scale.Events.RESIZE, render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, render, this));
  }
}
