import Phaser from 'phaser';
import { gameMetadata } from '../game/GameConfig';

export class PublisherIntroScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#050505');

    const glow = this.add.circle(
      width / 2,
      height * 0.46,
      Math.min(width, height) * 0.22,
      0xffffff,
      0.025,
    );

    const rule = this.add.rectangle(
      width / 2,
      height * 0.54,
      Math.min(width * 0.34, 280),
      1,
      0xffffff,
      0.18,
    );

    const adminHub = this.add.text(width / 2, height * 0.34, 'ADMIN HUB', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.085, 62)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const games = this.add.text(width / 2, height * 0.45, 'GAMES', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.055, 40)}px`,
      letterSpacing: 12,
      color: '#ffffff',
    }).setOrigin(0.5);

    const presents = this.add.text(width / 2, height * 0.58, 'presents...', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.min(width * 0.032, 22)}px`,
      fontStyle: 'italic',
      color: '#a8a8a8',
    }).setOrigin(0.5);

    const title = this.add.text(width / 2, height * 0.69, gameMetadata.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.075, 54)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(width / 2, height * 0.76, gameMetadata.subtitle ?? '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.min(width * 0.026, 18)}px`,
      color: '#777777',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    const continueText = this.add.text(width / 2, height - 30, 'PRESS ANY KEY · CLICK TO ENTER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      letterSpacing: 2,
      color: '#666666',
    }).setOrigin(0.5).setAlpha(0);

    [glow, rule, adminHub, games, presents].forEach((element) => element.setAlpha(0));

    this.tweens.add({
      targets: glow,
      alpha: 1,
      duration: 1200,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: rule,
      alpha: 1,
      duration: 700,
      delay: 500,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: adminHub,
      alpha: 1,
      duration: 700,
      delay: 250,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: games,
      alpha: 1,
      duration: 700,
      delay: 500,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: presents,
      alpha: 1,
      duration: 650,
      delay: 850,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 850,
      delay: 1450,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: subtitle,
          alpha: 1,
          duration: 650,
          ease: 'Sine.easeOut',
        });

        this.tweens.add({
          targets: continueText,
          alpha: 1,
          duration: 500,
          delay: 350,
          ease: 'Sine.easeOut',
        });
      },
    });

    this.input.keyboard?.on('keydown', () => this.leaveIntro());
    this.input.on('pointerdown', () => this.leaveIntro());
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;

    this.cameras.main.fadeOut(650, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start('GameShellScene'));
  }
}
