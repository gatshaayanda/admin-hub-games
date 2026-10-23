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
      this.add.text(width / 2, height * 0.17, 'WELCOME TO PAWS WORLD', {
        fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(24, Math.min(42, height * 0.07))}px`,
        fontStyle: 'bold', color: '#233e30', align: 'center',
      }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.30,
        'Jackie, Tiger and Percy are waiting on the home range.\nExplore the farm, find the pen on your map, and guide the flock.',
        {
          fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(15, Math.min(20, height * 0.033))}px`,
          color: '#536b57', align: 'center', lineSpacing: 8,
          wordWrap: { width: width * 0.84 },
        }).setOrigin(0.5);
      this.add.text(width / 2, height * 0.52,
        'YOUR FIRST DAY\n\n✓ Switch between all three dogs\n✓ Move with the pad or tap the ground\n✓ Use HERD to guide sheep and goats\n✓ Use STALK to approach wildlife quietly',
        {
          fontFamily: 'monospace', fontSize: `${Math.max(12, Math.min(17, height * 0.027))}px`,
          color: '#233e30', align: 'center', lineSpacing: 7,
        }).setOrigin(0.5);
      const button = this.add.text(width / 2, height * 0.83, 'ENTER PAWS WORLD  →', {
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
