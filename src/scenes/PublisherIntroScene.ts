import Phaser from 'phaser';
import { gameMetadata } from '../game/GameConfig';

export class PublisherIntroScene extends Phaser.Scene {
  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#080808');

    const adminHub = this.add.text(width / 2, height * 0.38, 'ADMIN HUB', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.09, 64)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const games = this.add.text(width / 2, height * 0.48, 'GAMES', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.065, 44)}px`,
      letterSpacing: 8,
      color: '#ffffff',
    }).setOrigin(0.5);

    const presents = this.add.text(width / 2, height * 0.60, 'presents...', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.min(width * 0.035, 24)}px`,
      fontStyle: 'italic',
      color: '#b8b8b8',
    }).setOrigin(0.5);

    const elements = [adminHub, games, presents];
    elements.forEach((element) => element.setAlpha(0));

    this.tweens.add({
      targets: adminHub,
      alpha: 1,
      duration: 650,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: games,
      alpha: 1,
      duration: 650,
      delay: 350,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: presents,
      alpha: 1,
      duration: 650,
      delay: 750,
      ease: 'Sine.easeOut',
      onComplete: () => this.showGameTitle(),
    });

    this.input.keyboard?.on('keydown', () => this.skipIntro());
    this.input.on('pointerdown', () => this.skipIntro());
  }

  private showGameTitle() {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height * 0.73, gameMetadata.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.075, 52)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => this.scene.start('GameShellScene'));
      },
    });
  }

  private skipIntro() {
    if (this.scene.isActive('PublisherIntroScene')) {
      this.scene.start('GameShellScene');
    }
  }
}
