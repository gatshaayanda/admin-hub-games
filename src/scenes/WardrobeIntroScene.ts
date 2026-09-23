import Phaser from 'phaser';

export class WardrobeIntroScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private poseClock = 0;
  private leaving = false;

  constructor() {
    super('WardrobeIntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#171b19');

    const g = this.add.graphics();
    g.fillStyle(0x171b19, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x24352c, 1).fillRect(0, 0, width, 58);
    g.fillStyle(0x101512, 1).fillRect(0, height - 82, width, 82);

    this.add.text(28, 20, 'WARDROBE · CHARACTER LAB', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setOrigin(0, 0.5);

    this.add.text(width - 28, 20, 'SHOOTERS TRIGGER · PLAYER COPY', {
      fontFamily: 'monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#e8c95c',
    }).setOrigin(1, 0.5);

    const panelW = Math.min(width * 0.86, 760);
    const panelH = Math.min(height * 0.58, 410);
    const panel = this.add.rectangle(width / 2, height * 0.49, panelW, panelH, 0x202a24, 1)
      .setStrokeStyle(2, 0x526d5d, 1);

    this.add.text(panel.x, panel.y - panel.height * 0.38, 'THE CHARACTER WORKBENCH', {
      fontFamily: 'monospace',
      fontSize: Math.max(20, Math.min(34, Math.min(width, height) * 0.055)) + 'px',
      fontStyle: 'bold',
      color: '#e8c95c',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(panel.x, panel.y - panel.height * 0.22,
      'This is a safe copy of the Shooters Trigger lobby character.\n\nWe will use this room to inspect sprite sheets, frames, poses,\nanimations and free/open art tools before changing the real game.',
      {
        fontFamily: 'monospace',
        fontSize: Math.max(11, Math.min(15, Math.min(width, height) * 0.024)) + 'px',
        color: '#d8dfd8',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: panelW * 0.82 },
      }).setOrigin(0.5);

    this.player = this.createPlayer(panel.x, panel.y + panel.height * 0.12);
    this.player.setScale(Math.min(2.8, Math.max(1.8, Math.min(width, height) / 220)));

    const toolLine = this.add.text(panel.x, panel.y + panel.height * 0.36,
      'READY TO INSPECT · NO NEW ART PACKAGE INSTALLED',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#8fb39b',
        align: 'center',
      }).setOrigin(0.5);

    const enter = this.add.text(width / 2, height - 40, 'TAP / ENTER · OPEN LAB', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f4f1df',
      backgroundColor: '#315845',
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });

    const continueLab = () => this.openLab();
    enter.on('pointerdown', (event: Phaser.Input.EventData) => {
      event.stopPropagation();
      continueLab();
    });
    this.input.keyboard?.on('keydown-ENTER', continueLab);
    this.input.keyboard?.on('keydown-SPACE', continueLab);

    this.tweens.add({ targets: toolLine, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', continueLab);
      this.input.keyboard?.off('keydown-SPACE', continueLab);
      enter.destroy();
    });
  }

  update(_time: number, delta: number) {
    this.poseClock += delta;
    const pose = this.player?.getAt(1) as Phaser.GameObjects.Graphics | undefined;
    if (!pose) return;
    const bob = Math.sin(this.poseClock / 420) * 1.2;
    pose.setY(bob);
  }

  private openLab() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('WardrobeLabScene');
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 40, 34, 12, 0x000000, 0.28);
    const g = this.add.graphics();

    // Deliberate copy of the current Shooters Trigger Home Field character.
    g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20, 24, 18);
    g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17, 13, 12);
    g.fillStyle(0xd4a45d, 1).fillCircle(-7, -17, 2.5).fillCircle(7, -17, 2.5);
    g.fillStyle(0x5a7348, 1).fillEllipse(0, -23, 25, 12);
    g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8, 8, 7, 2);
    g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4, 30, 22, 8);
    g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1, 20, 14, 4);
    g.fillStyle(0x2f6b4e, 1)
      .fillRoundedRect(-17, 0, 7, 15, 3)
      .fillRoundedRect(10, 0, 7, 15, 3);
    g.fillStyle(0xd4a45d, 1)
      .fillCircle(-14, 15, 3)
      .fillCircle(14, 15, 3);
    g.fillStyle(0x29372f, 1).fillRoundedRect(-11, 16, 22, 7, 3);
    g.fillStyle(0x566052, 1).fillRoundedRect(-10, 20, 8, 13, 2).fillRoundedRect(2, 20, 8, 13, 2);
    g.fillStyle(0x202522, 1).fillRoundedRect(-12, 30, 10, 7, 2).fillRoundedRect(2, 30, 10, 7, 2);

    container.add([shadow, g]);
    return container;
  }
}

export class WardrobeLabScene extends Phaser.Scene {
  private character!: Phaser.GameObjects.Container;
  private selected = 'BASE COPY';

  constructor() {
    super('WardrobeLabScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#101512');

    this.add.text(26, 22, 'WARDROBE · LAB BENCH', {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: '#f4f1df'
    });

    this.add.text(26, 52, 'CURRENT ASSET · SHOOTERS TRIGGER LOBBY CHARACTER COPY', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#8fb39b'
    });

    const bench = this.add.rectangle(width * 0.5, height * 0.52, Math.min(width * 0.5, 360), Math.min(height * 0.58, 330), 0x202a24, 1)
      .setStrokeStyle(2, 0x526d5d, 1);

    this.character = this.createCharacter(bench.x, bench.y);
    this.character.setScale(Math.min(3.8, Math.max(2.2, Math.min(width, height) / 170)));

    this.add.text(bench.x, bench.y + bench.height * 0.42, 'BASE COPY', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#e8c95c'
    }).setOrigin(0.5);

    const rightX = Math.min(width - 190, bench.x + bench.width * 0.5 + 150);
    const options = [
      ['BASE COPY', 'Current procedural character'],
      ['SPRITESHEET', 'Frame grid / atlas inspection'],
      ['POSES', 'Idle · walk · aim · fire'],
      ['EQUIPMENT', 'Mask · marker · clothing layers'],
      ['EXPORT', 'Phaser-ready PNG / JSON'],
    ];

    options.forEach(([title, detail], index) => {
      const y = 130 + index * 72;
      const item = this.add.rectangle(rightX, y, 280, 58, index === 0 ? 0x315845 : 0x202a24, 1)
        .setStrokeStyle(1, 0x526d5d, 1)
        .setInteractive({ useHandCursor: false });
      this.add.text(rightX - 122, y - 10, title, {
        fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#f4f1df'
      });
      this.add.text(rightX - 122, y + 9, detail, {
        fontFamily: 'monospace', fontSize: '8px', color: '#8fb39b'
      });
      item.on('pointerdown', () => this.select(title, item));
    });

    this.add.text(26, height - 52,
      'FREE-FIRST PIPELINE · INSPECT TOOLS BEFORE INSTALLING PACKAGES · NO SHOOTERS RUNTIME CHANGES',
      {
        fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#8fb39b',
        wordWrap: { width: width - 52 }
      });

    const back = this.add.text(width - 26, height - 28, 'BACK TO GAME LIBRARY', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#f4f1df'
    }).setOrigin(1).setInteractive({ useHandCursor: false });
    back.on('pointerdown', () => window.location.href = '/');

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  private select(label: string, item: Phaser.GameObjects.Rectangle) {
    this.selected = label;
    this.add.text(this.scale.width / 2, 84, 'SELECTED · ' + this.selected, {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#e8c95c'
    }).setOrigin(0.5).setDepth(10);
    item.setFillStyle(0x315845, 1);
  }

  private createCharacter(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 40, 34, 12, 0x000000, 0.28);
    const g = this.add.graphics();
    g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20, 24, 18);
    g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17, 13, 12);
    g.fillStyle(0xd4a45d, 1).fillCircle(-7, -17, 2.5).fillCircle(7, -17, 2.5);
    g.fillStyle(0x5a7348, 1).fillEllipse(0, -23, 25, 12);
    g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8, 8, 7, 2);
    g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4, 30, 22, 8);
    g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1, 20, 14, 4);
    g.fillStyle(0x2f6b4e, 1)
      .fillRoundedRect(-17, 0, 7, 15, 3)
      .fillRoundedRect(10, 0, 7, 15, 3);
    g.fillStyle(0xd4a45d, 1)
      .fillCircle(-14, 15, 3)
      .fillCircle(14, 15, 3);
    g.fillStyle(0x29372f, 1).fillRoundedRect(-11, 16, 22, 7, 3);
    g.fillStyle(0x566052, 1).fillRoundedRect(-10, 20, 8, 13, 2).fillRoundedRect(2, 20, 8, 13, 2);
    g.fillStyle(0x202522, 1).fillRoundedRect(-12, 30, 10, 7, 2).fillRoundedRect(2, 30, 10, 7, 2);
    container.add([shadow, g]);
    return container;
  }
}
