import Phaser from 'phaser';

export class GameShellScene extends Phaser.Scene {
  constructor() {
    super('GameShellScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#111111');

    this.add.text(width / 2, height / 2 - 24, 'GAME SHELL', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.08, 48)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 32, 'Ready for the first game.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.035, 22)}px`,
      color: '#a0a0a0',
    }).setOrigin(0.5);
  }
}
