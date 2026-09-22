import Phaser from 'phaser';
import { adminHubAudio } from '../audio';
import { renderCatalog } from '../catalog';

export class PublisherIntroScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('PublisherIntroScene');
  }

  create() {
    adminHubAudio.start();

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#070b1d');
    this.drawWorld(width, height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.add.text(width * 0.07, height * 0.08, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#a9b8d6',
      letterSpacing: 2.5,
    }).setDepth(30);

    this.add.text(width * 0.07, height * 0.25, 'GAMES ARE\nBEING BUILT HERE.', {
      fontFamily: 'monospace',
      fontSize: `${Math.max(32, Math.min(72, Math.min(width, height) * 0.115))}px`,
      fontStyle: 'bold',
      color: '#f4f7ff',
      lineSpacing: -4,
      letterSpacing: -1,
    }).setDepth(30);

    const copyWidth = Math.min(width * 0.72, 690);
    this.add.text(width * 0.07, height * 0.52,
      'An evolving browser-game lab from Admin Hub — building\nplayable worlds, systems and reusable game foundations\nwith Phaser, TypeScript and the web.', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: `${Math.max(15, Math.min(21, Math.min(width, height) * 0.032))}px`,
        color: '#c8d3e8',
        lineSpacing: 7,
        wordWrap: { width: copyWidth },
      }).setDepth(30);

    const focus = this.add.text(width * 0.07, height * 0.70,
      'CURRENT BUILD  /  SHOOTERS TRIGGER\nMobile-first paintball combat · training · evasion · arena', {
        fontFamily: 'monospace',
        fontSize: `${Math.max(10, Math.min(14, Math.min(width, height) * 0.022))}px`,
        fontStyle: 'bold',
        color: '#55d6c2',
        lineSpacing: 8,
        letterSpacing: 1,
      }).setDepth(30);

    const buttonWidth = Math.min(width * 0.72, 360);
    const buttonHeight = 58;
    const buttonX = width * 0.07 + buttonWidth / 2;
    const buttonY = height * 0.86;

    const button = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x55d6c2, 1)
      .setDepth(40)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(buttonX, buttonY, 'ENTER GAME LIBRARY  →', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#07151a',
      letterSpacing: 1.2,
    }).setOrigin(0.5).setDepth(41);

    const enter = () => this.leaveIntro();
    button.on('pointerdown', enter);
    this.input.keyboard?.on('keydown-ENTER', enter);
    this.input.keyboard?.on('keydown-SPACE', enter);

    this.tweens.add({
      targets: [button, buttonText],
      alpha: 0.78,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.keyboard?.off('keydown-ENTER', enter);
      this.input.keyboard?.off('keydown-SPACE', enter);
    });

    void focus;
  }

  private handleResize(width: number, height: number) {
    if (this.leaving) return;
    this.cameras.main.setViewport(0, 0, width, height);
  }

  private leaveIntro() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 7, 11, 29);
    this.time.delayedCall(300, () => {
      renderCatalog((gameId) => {
        if (gameId === 'hall') this.scene.start('HallIntroScene');
        if (gameId === 'presidents-shoes') this.scene.start('PresidentsShoesIntroScene');
        if (gameId === 'shooters-trigger') this.scene.start('ShootersTriggerIntroScene');
      });
    });
  }

  private drawWorld(width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(0x070b1d, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x111a42, 1).fillRect(0, height * 0.32, width, height * 0.38);
    g.fillStyle(0x0d1830, 1).fillRect(0, height * 0.70, width, height * 0.30);

    for (let i = 0; i < 70; i += 1) {
      const x = (i * 173.7) % width;
      const y = (i * 83.9) % (height * 0.62);
      const radius = i % 9 === 0 ? 1.5 : i % 3 === 0 ? 1 : 0.65;
      g.fillStyle(i % 7 === 0 ? 0xe2bd67 : 0xdce7ff, i % 5 === 0 ? 0.9 : 0.58);
      g.fillCircle(x, y, radius);
    }

    g.fillStyle(0x24385b, 0.55).fillCircle(width * 0.80, height * 0.25, Math.max(70, Math.min(width, height) * 0.19));
    g.fillStyle(0x55d6c2, 0.08).fillCircle(width * 0.80, height * 0.25, Math.max(115, Math.min(width, height) * 0.27));
    g.fillStyle(0xe2bd67, 0.9).fillCircle(width * 0.80, height * 0.25, Math.max(24, Math.min(width, height) * 0.055));

    g.fillStyle(0x050816, 1);
    g.beginPath();
    g.moveTo(0, height * 0.68);
    g.lineTo(width * 0.14, height * 0.61);
    g.lineTo(width * 0.28, height * 0.66);
    g.lineTo(width * 0.42, height * 0.57);
    g.lineTo(width * 0.56, height * 0.65);
    g.lineTo(width * 0.70, height * 0.56);
    g.lineTo(width * 0.86, height * 0.63);
    g.lineTo(width, height * 0.57);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x24385b, 0.95);
    g.fillRect(width * 0.16, height * 0.53, 28, height * 0.16);
    g.fillRect(width * 0.20, height * 0.48, 20, height * 0.21);
    g.fillRect(width * 0.80, height * 0.51, 30, height * 0.18);
    g.fillRect(width * 0.84, height * 0.46, 20, height * 0.23);
    g.fillStyle(0x55d6c2, 0.75);
    g.fillRect(width * 0.195, height * 0.50, 4, height * 0.10);
    g.fillRect(width * 0.835, height * 0.48, 4, height * 0.10);

    g.lineStyle(1, 0x55d6c2, 0.12);
    for (let i = 0; i < 8; i += 1) {
      const y = height * (0.72 + i * 0.035);
      g.lineBetween(width * 0.08, y, width * 0.92, y);
    }
  }
}
