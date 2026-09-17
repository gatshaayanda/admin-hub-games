import Phaser from 'phaser';

export class GameShellScene extends Phaser.Scene {
  constructor() {
    super('GameShellScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b0d0c');

    this.add.text(width / 2, height / 2 - 34, 'THE WORLD', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.075, 50)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 22, 'The reusable game shell is ready.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.032, 20)}px`,
      color: '#858585',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 66, 'Next: give the world a place to explore.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.024, 16)}px`,
      color: '#555555',
    }).setOrigin(0.5);
  }
}
