import Phaser from 'phaser';

type WardrobeAction =
  | 'IDLE'
  | 'WALK'
  | 'WALK LEFT'
  | 'WALK RIGHT'
  | 'AIM LEFT'
  | 'AIM RIGHT'
  | 'FIRE'
  | 'BODY HIT'
  | 'HEADSHOT'
  | 'DEATH'
  | 'RESPAWN';

const ACTIONS: WardrobeAction[] = [
  'IDLE',
  'WALK',
  'WALK LEFT',
  'WALK RIGHT',
  'AIM LEFT',
  'AIM RIGHT',
  'FIRE',
  'BODY HIT',
  'HEADSHOT',
  'DEATH',
  'RESPAWN',
];

type WardrobeVariant = {
  name: string;
  shirt: number;
  shirtLight: number;
  pants: number;
  accent: number;
  hat: number;
  skin: number;
  hair: number;
  style: 'FIELD' | 'UTILITY' | 'URBAN' | 'TRAIL';
  gear: 'BANDANA' | 'VEST' | 'HOODIE' | 'CAP';
};

const VARIANTS: WardrobeVariant[] = [
  { name: 'FIELD GREEN', shirt: 0x2f6b4e, shirtLight: 0x4f8b65, pants: 0x566052, accent: 0xe8c95c, hat: 0x5a7348, skin: 0xd4a45d, hair: 0x3b2f28, style: 'FIELD', gear: 'CAP' },
  { name: 'DUST TRAIL', shirt: 0x7b5a3b, shirtLight: 0xa47a4c, pants: 0x5d5145, accent: 0xd9b36c, hat: 0x6f593f, skin: 0xb9784e, hair: 0x2d211c, style: 'TRAIL', gear: 'BANDANA' },
  { name: 'DARK UTILITY', shirt: 0x30483f, shirtLight: 0x50685a, pants: 0x343b38, accent: 0xd66a3d, hat: 0x29342f, skin: 0x8f5d43, hair: 0x1e1815, style: 'UTILITY', gear: 'VEST' },
  { name: 'TEAL RUNNER', shirt: 0x24676a, shirtLight: 0x4b9291, pants: 0x46535a, accent: 0xe8c95c, hat: 0x315f62, skin: 0xc98d62, hair: 0x4a3025, style: 'URBAN', gear: 'HOODIE' },
];

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
      'Exact Home Field copy first.\n\nNow the lab can play the character through discrete actions\nso we can judge the movement before touching the real game.',
      {
        fontFamily: 'monospace',
        fontSize: Math.max(11, Math.min(15, Math.min(width, height) * 0.024)) + 'px',
        color: '#d8dfd8',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: panelW * 0.82 },
      }).setOrigin(0.5);

    this.player = this.createCharacter(panel.x, panel.y + panel.height * 0.12);
    this.player.setScale(Math.min(2.8, Math.max(1.8, Math.min(width, height) / 220)));

    const toolLine = this.add.text(panel.x, panel.y + panel.height * 0.36,
      'REFERENCE COPY · OPEN THE LAB TO PLAY ACTIONS',
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
    enter.on('pointerdown', continueLab);
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
    if (!this.player) return;
    const baseY = this.scale.height * 0.49 + Math.min(this.scale.height * 0.58, 410) * 0.12;
    this.player.setY(baseY + Math.sin(this.poseClock / 420) * 1.2);
  }

  private openLab() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('WardrobeLabScene');
  }

  private createCharacter(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 40, 34, 12, 0x000000, 0.28);
    const body = this.drawCharacter('IDLE');
    container.add([shadow, body]);
    return container;
  }

  private drawCharacter(action: WardrobeAction): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const walking = action === 'WALK' || action === 'WALK LEFT' || action === 'WALK RIGHT';
    const step = walking ? 2 : 0;
    const lean = action === 'WALK LEFT' ? -2 : action === 'WALK RIGHT' ? 2 : 0;
    const aim = action === 'AIM LEFT' || action === 'AIM RIGHT' || action === 'FIRE';
    const aimDir = action === 'AIM LEFT' ? -1 : 1;
    const hit = action === 'BODY HIT';
    const headshot = action === 'HEADSHOT';
    const dead = action === 'DEATH';

    const bob = walking ? 1 : 0;
    const legOffset = walking ? step : 0;
    const armDrop = aim ? -7 : 0;

    if (!dead) {
      g.fillStyle(0x3b2f28, 1).fillEllipse(0 + lean, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0 + lean, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1)
        .fillCircle(-7 + lean, -17 + bob, 2.5)
        .fillCircle(7 + lean, -17 + bob, 2.5);
      g.fillStyle(0x5a7348, 1).fillEllipse(0 + lean, -23 + bob, 25, 12);

      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4 + lean, -8 + bob, 8, 7, 2);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15 + lean, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10 + lean, -1 + bob, 20, 14, 4);

      if (aim) {
        g.fillStyle(0x2f6b4e, 1)
          .fillRoundedRect(-16 + lean, -2 + bob, 7, 17, 3)
          .fillRoundedRect(9 + lean, -9 + armDrop + bob, 7, 20, 3);
        g.fillStyle(0xd4a45d, 1)
          .fillCircle(-13 + lean, 14 + bob, 3)
          .fillCircle(15 + lean, -11 + armDrop + bob, 3);
        this.drawMarker(g, aimDir, 15 + lean, -12 + armDrop + bob, action === 'FIRE');
      } else {
        g.fillStyle(0x2f6b4e, 1)
          .fillRoundedRect(-17 + lean, 0 + bob, 7, 15, 3)
          .fillRoundedRect(10 + lean, 0 + bob, 7, 15, 3);
        g.fillStyle(0xd4a45d, 1)
          .fillCircle(-14 + lean, 15 + bob, 3)
          .fillCircle(14 + lean, 15 + bob, 3);
      }

      g.fillStyle(0x29372f, 1).fillRoundedRect(-11 + lean, 16 + bob, 22, 7, 3);
      g.fillStyle(0x566052, 1)
        .fillRoundedRect(-10 + lean + legOffset, 20 + bob, 8, 13, 2)
        .fillRoundedRect(2 + lean - legOffset, 20 + bob, 8, 13, 2);
      g.fillStyle(0x202522, 1)
        .fillRoundedRect(-12 + lean + legOffset, 30 + bob, 10, 7, 2)
        .fillRoundedRect(2 + lean - legOffset, 30 + bob, 10, 7, 2);
    } else {
      g.setRotation(-0.95);
      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17, 13, 12);
      g.fillStyle(0x5a7348, 1).fillEllipse(0, -23, 25, 12);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4, 30, 22, 8);
      g.fillStyle(0x566052, 1)
        .fillRoundedRect(-10, 20, 8, 13, 2)
        .fillRoundedRect(2, 20, 8, 13, 2);
      g.fillStyle(0x202522, 1)
        .fillRoundedRect(-12, 30, 10, 7, 2)
        .fillRoundedRect(2, 30, 10, 7, 2);
    }

    if (hit) {
      g.fillStyle(0xd66a3d, 0.9).fillCircle(-10, 2, 5).fillCircle(9, 7, 4);
      g.lineStyle(2, 0xf0dfb6, 0.9);
      g.strokeCircle(-10, 2, 8);
      g.strokeCircle(9, 7, 7);
    }

    if (headshot) {
      g.fillStyle(0xd66a3d, 0.95).fillCircle(3, -20, 5);
      g.fillStyle(0xf0dfb6, 0.85).fillCircle(3, -20, 2);
    }

    return g;
  }

  private drawMarker(
    g: Phaser.GameObjects.Graphics,
    direction: number,
    x: number,
    y: number,
    firing: boolean,
  ) {
    const markerLength = firing ? 30 : 25;
    const endX = x + direction * markerLength;
    g.fillStyle(0x202522, 1).fillRoundedRect(x, y - 3, direction * markerLength, 6, 2);
    g.fillStyle(0x566052, 1).fillRoundedRect(endX - direction * 5, y - 5, 6, 10, 2);

    if (firing) {
      g.fillStyle(0xf0dfb6, 1).fillTriangle(
        endX + direction * 12, y,
        endX + direction * 2, y - 7,
        endX + direction * 2, y + 7,
      );
      g.fillStyle(0xd66a3d, 0.9).fillCircle(endX + direction * 5, y, 4);
    }
  }
}

export class WardrobeLabScene extends Phaser.Scene {
  private character!: Phaser.GameObjects.Container;
  private preview!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Ellipse;
  private actionText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private stepText!: Phaser.GameObjects.Text;
  private actionIndex = 0;
  private playing = false;
  private playTimer?: Phaser.Time.TimerEvent;
  private actionButtons: Phaser.GameObjects.Rectangle[] = [];
  private variantButtons: Phaser.GameObjects.Rectangle[] = [];
  private variantIndex = 0;

  constructor() {
    super('WardrobeLabScene');
  }

  create() {
    const { width, height } = this.scale;
    const portrait = height > width;
    const compact = portrait || width < 700;
    this.cameras.main.setBackgroundColor('#101512');

    const headerSize = compact ? 12 : 15;
    this.add.text(18, 18, 'WARDROBE · ACTION LAB', {
      fontFamily: 'monospace', fontSize: headerSize + 'px', fontStyle: 'bold', color: '#f4f1df'
    });

    this.add.text(18, compact ? 40 : 48,
      compact ? 'SHOOTERS TRIGGER · CHARACTER COPY' : 'SHOOTERS TRIGGER · HOME FIELD CHARACTER COPY · SAFE EXPERIMENT AREA',
      {
        fontFamily: 'monospace', fontSize: compact ? '8px' : '9px', fontStyle: 'bold', color: '#8fb39b'
      });

    this.actionText = this.add.text(width / 2, compact ? 72 : 86, '', {
      fontFamily: 'monospace', fontSize: compact ? '17px' : '18px', fontStyle: 'bold', color: '#e8c95c'
    }).setOrigin(0.5);

    this.stepText = this.add.text(width / 2, compact ? 94 : 110, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#8fb39b'
    }).setOrigin(0.5);

    const variantTop = compact ? 118 : 138;
    this.add.text(width / 2, variantTop, 'STYLE VARIATIONS · TAP TO TRY', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#e8c95c'
    }).setOrigin(0.5);

    const variantW = compact ? Math.min(112, (width - 36) / 4) : 128;
    const variantGap = compact ? 4 : 8;
    const variantTotal = VARIANTS.length * variantW + (VARIANTS.length - 1) * variantGap;
    const variantStart = width / 2 - variantTotal / 2 + variantW / 2;
    VARIANTS.forEach((variant, index) => {
      const button = this.add.rectangle(
        variantStart + index * (variantW + variantGap),
        variantTop + 22,
        variantW,
        30,
        0x202a24,
        1
      ).setStrokeStyle(1, 0x526d5d, 1).setInteractive({ useHandCursor: false });
      this.add.text(button.x, button.y, String(index + 1).padStart(2, '0') + ' · ' + variant.name, {
        fontFamily: 'monospace', fontSize: compact ? '6px' : '7px', fontStyle: 'bold',
        color: '#f4f1df', align: 'center', wordWrap: { width: variantW - 8 }
      }).setOrigin(0.5);
      button.on('pointerdown', () => this.showVariant(index));
      this.variantButtons.push(button);
    });

    const benchW = compact ? Math.min(width * 0.90, 520) : Math.min(width * 0.72, 560);
    const benchH = compact ? Math.min(height * 0.30, 220) : Math.min(height * 0.54, 380);
    const benchX = compact ? width / 2 : width * 0.43;
    const benchY = compact ? height * 0.36 : height * 0.47;

    this.add.rectangle(benchX, benchY, benchW, benchH, 0x202a24, 1)
      .setStrokeStyle(2, 0x526d5d, 1);

    this.add.text(benchX, benchY - benchH / 2 + 16, compact ? 'LIVE PREVIEW' : 'LIVE PREVIEW · PROCEDURAL BASELINE', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#8fb39b'
    }).setOrigin(0.5);

    this.shadow = this.add.ellipse(benchX, benchY + (compact ? benchH * 0.30 : 125), compact ? 68 : 92, compact ? 20 : 28, 0x000000, 0.28);
    this.character = this.add.container(benchX, benchY + (compact ? 42 : 82));
    this.preview = this.add.graphics();
    this.character.add(this.preview);
    this.character.setScale(compact
      ? Math.min(4.0, Math.max(2.8, Math.min(width, height) / 155))
      : Math.min(5.2, Math.max(3.2, Math.min(width, height) / 145)));

    this.detailText = this.add.text(benchX, benchY + benchH / 2 - 18, '', {
      fontFamily: 'monospace', fontSize: compact ? '8px' : '9px', color: '#d8dfd8', align: 'center',
      wordWrap: { width: benchW - 24 }
    }).setOrigin(0.5);

    const controlsTop = compact ? benchY + benchH / 2 + 20 : 146;
    const columns = compact ? 3 : 1;
    const gapX = compact ? 5 : 0;
    const gapY = compact ? 5 : 7;
    const buttonW = compact
      ? Math.min(112, (width - 36 - gapX * (columns - 1)) / columns)
      : 235;
    const buttonH = compact ? 34 : 32;
    const totalW = columns * buttonW + (columns - 1) * gapX;
    const controlsX = compact ? (width - totalW) / 2 + buttonW / 2 : Math.min(width - 155, benchX + benchW / 2 + 135);

    this.add.text(compact ? width / 2 : controlsX, controlsTop - 16, 'ACTION STRIP', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#e8c95c'
    }).setOrigin(0.5);

    ACTIONS.forEach((action, index) => {
      const row = compact ? Math.floor(index / columns) : index;
      const col = compact ? index % columns : 0;
      const x = compact ? controlsX + col * (buttonW + gapX) : controlsX;
      const y = compact ? controlsTop + row * (buttonH + gapY) : controlsTop + index * 39;
      const button = this.add.rectangle(x, y, buttonW, buttonH, 0x202a24, 1)
        .setStrokeStyle(1, 0x526d5d, 1)
        .setInteractive({ useHandCursor: false });
      this.add.text(x, y, String(index + 1).padStart(2, '0') + ' · ' + action, {
        fontFamily: 'monospace', fontSize: compact ? '7px' : '9px', fontStyle: 'bold', color: '#f4f1df',
        align: 'center', wordWrap: { width: buttonW - 8 }
      }).setOrigin(0.5);
      button.on('pointerdown', () => this.showAction(index));
      this.actionButtons.push(button);
    });

    const bottomY = height - (compact ? 30 : 55);
    const next = this.makeButton(compact ? width * 0.29 : width / 2 - 100, bottomY, compact ? Math.min(150, width * 0.42) : 190, 'NEXT ACTION →');
    next.setScale(compact ? 0.86 : 1);
    next.on('pointerdown', () => this.showAction((this.actionIndex + 1) % ACTIONS.length));

    const play = this.makeButton(compact ? width * 0.71 : width / 2 + 105, bottomY, compact ? Math.min(150, width * 0.42) : 190, '▶ FLOW THROUGH ALL');
    play.setScale(compact ? 0.86 : 1);
    play.on('pointerdown', () => this.toggleFlow(play));

    const reset = this.add.text(16, height - (compact ? 8 : 28), compact ? 'RESET' : 'RESET · BASE COPY', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#f4f1df'
    }).setOrigin(0, 1).setInteractive({ useHandCursor: false });
    reset.on('pointerdown', () => this.showAction(0));

    const back = this.add.text(width - 16, height - (compact ? 8 : 28), compact ? 'BACK' : 'BACK TO GAME LIBRARY', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#f4f1df'
    }).setOrigin(1, 1).setInteractive({ useHandCursor: false });
    back.on('pointerdown', () => window.location.href = '/');

    this.input.keyboard?.on('keydown-RIGHT', () => this.showAction((this.actionIndex + 1) % ACTIONS.length));
    this.input.keyboard?.on('keydown-SPACE', () => this.toggleFlow(play));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopFlow();
      this.input.keyboard?.removeAllListeners();
    });

    this.showVariant(0);
    this.showAction(0);
    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  private makeButton(x: number, y: number, width: number, label: string) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f4f1df',
      backgroundColor: '#315845',
      padding: { left: 15, right: 15, top: 10, bottom: 10 },
      align: 'center',
      fixedWidth: width,
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });
    return button;
  }

  private showVariant(index: number) {
    this.variantIndex = (index + VARIANTS.length) % VARIANTS.length;
    this.variantButtons.forEach((button, i) => {
      button.setFillStyle(i === this.variantIndex ? 0x315845 : 0x202a24, 1);
      button.setStrokeStyle(i === this.variantIndex ? 2 : 1, i === this.variantIndex ? 0xe8c95c : 0x526d5d, 1);
    });
    this.drawPreview(ACTIONS[this.actionIndex]);
    this.detailText.setText(this.describe(ACTIONS[this.actionIndex]) + ' · ' + VARIANTS[this.variantIndex].name);
  }

  private showAction(index: number, stopPlayback = true) {
    this.actionIndex = (index + ACTIONS.length) % ACTIONS.length;
    const action = ACTIONS[this.actionIndex];

    if (stopPlayback) this.stopFlow();
    this.actionText.setText(action);
    this.stepText.setText(
      'DISCRETE ACTION ' + String(this.actionIndex + 1).padStart(2, '0') +
      ' / ' + String(ACTIONS.length).padStart(2, '0')
    );

    this.actionButtons.forEach((button, i) => {
      button.setFillStyle(i === this.actionIndex ? 0x315845 : 0x202a24, 1);
      button.setStrokeStyle(i === this.actionIndex ? 2 : 1, i === this.actionIndex ? 0xe8c95c : 0x526d5d, 1);
    });

    this.preview.clear();
    this.drawPreview(action);
    this.detailText.setText(this.describe(action) + ' · ' + VARIANTS[this.variantIndex].name);

    this.playActionMotion(action);
  }

  private drawPreview(action: WardrobeAction) {
    const variant = VARIANTS[this.variantIndex];
    const walking = action === 'WALK' || action === 'WALK LEFT' || action === 'WALK RIGHT';
    const step = walking ? 2 : 0;
    const lean = action === 'WALK LEFT' ? -2 : action === 'WALK RIGHT' ? 2 : 0;
    const aim = action === 'AIM LEFT' || action === 'AIM RIGHT' || action === 'FIRE';
    const aimDir = action === 'AIM LEFT' ? -1 : 1;
    const bob = walking ? 1 : 0;

    if (action !== 'DEATH') {
      this.preview.fillStyle(0x3b2f28, 1).fillEllipse(lean, -20 + bob, 24, 18);
      this.preview.fillStyle(0xd8a66b, 1).fillEllipse(lean, -17 + bob, 13, 12);
      this.preview.fillStyle(0xd4a45d, 1)
        .fillCircle(-7 + lean, -17 + bob, 2.5)
        .fillCircle(7 + lean, -17 + bob, 2.5);
      this.preview.fillStyle(variant.hat, 1).fillEllipse(lean, -23 + bob, 25, 12);
      this.preview.fillStyle(0xd4a45d, 1).fillRoundedRect(-4 + lean, -8 + bob, 8, 7, 2);
      this.preview.fillStyle(variant.shirt, 1).fillRoundedRect(-15 + lean, -4 + bob, 30, 22, 8);
      this.preview.fillStyle(variant.shirtLight, 1).fillRoundedRect(-10 + lean, -1 + bob, 20, 14, 4);

      if (variant.gear === 'VEST') {
        this.preview.fillStyle(0x202522, 0.92).fillRoundedRect(-14 + lean, -2 + bob, 5, 18, 2).fillRoundedRect(9 + lean, -2 + bob, 5, 18, 2);
        this.preview.fillStyle(variant.accent, 1).fillRoundedRect(-4 + lean, 0 + bob, 8, 3, 1);
      } else if (variant.gear === 'BANDANA') {
        this.preview.fillStyle(variant.accent, 0.95).fillRoundedRect(-11 + lean, -6 + bob, 22, 4, 1);
      } else if (variant.gear === 'HOODIE') {
        this.preview.lineStyle(3, variant.shirtLight, 1).strokeCircle(0 + lean, -5 + bob, 11);
        this.preview.fillStyle(variant.accent, 0.95).fillRoundedRect(-2 + lean, 6 + bob, 4, 5, 1);
      } else {
        this.preview.fillStyle(variant.accent, 0.95).fillRoundedRect(-9 + lean, 7 + bob, 18, 2, 1);
      }

      if (variant.style === 'UTILITY') {
        this.preview.fillStyle(0x202522, 0.9).fillRoundedRect(-13 + lean, 0 + bob, 5, 13, 2);
        this.preview.fillStyle(0x202522, 0.9).fillRoundedRect(8 + lean, 0 + bob, 5, 13, 2);
      } else if (variant.style === 'TRAIL') {
        this.preview.lineStyle(3, variant.accent, 0.9);
        this.preview.strokeLineShape(new Phaser.Geom.Line(-12 + lean, -2 + bob, 12 + lean, 15 + bob));
      } else if (variant.style === 'URBAN') {
        this.preview.fillStyle(variant.accent, 0.9).fillRoundedRect(-9 + lean, 9 + bob, 18, 3, 1);
      }

      if (aim) {
        this.preview.fillStyle(0x2f6b4e, 1)
          .fillRoundedRect(-16 + lean, -2 + bob, 7, 17, 3)
          .fillRoundedRect(9 + lean, -9 + bob, 7, 20, 3);
        this.preview.fillStyle(0xd4a45d, 1)
          .fillCircle(-13 + lean, 14 + bob, 3)
          .fillCircle(15 + lean, -11 + bob, 3);
        this.drawMarkerPreview(aimDir, 15 + lean, -12 + bob, action === 'FIRE');
      } else {
        this.preview.fillStyle(0x2f6b4e, 1)
          .fillRoundedRect(-17 + lean, 0 + bob, 7, 15, 3)
          .fillRoundedRect(10 + lean, 0 + bob, 7, 15, 3);
        this.preview.fillStyle(0xd4a45d, 1)
          .fillCircle(-14 + lean, 15 + bob, 3)
          .fillCircle(14 + lean, 15 + bob, 3);
      }

      this.preview.fillStyle(0x29372f, 1).fillRoundedRect(-11 + lean, 16 + bob, 22, 7, 3);
      this.preview.fillStyle(variant.pants, 1)
        .fillRoundedRect(-10 + lean + step, 20 + bob, 8, 13, 2)
        .fillRoundedRect(2 + lean - step, 20 + bob, 8, 13, 2);

      if (variant.style === 'UTILITY') {
        this.preview.fillStyle(variant.accent, 0.95).fillRoundedRect(-11 + lean, 18 + bob, 3, 5, 1);
        this.preview.fillStyle(variant.accent, 0.95).fillRoundedRect(8 + lean, 18 + bob, 3, 5, 1);
      }
      this.preview.fillStyle(0x202522, 1)
        .fillRoundedRect(-12 + lean + step, 30 + bob, 10, 7, 2)
        .fillRoundedRect(2 + lean - step, 30 + bob, 10, 7, 2);
    } else {
      this.preview.setRotation(-0.95);
      this.preview.fillStyle(0x3b2f28, 1).fillEllipse(0, -20, 24, 18);
      this.preview.fillStyle(0xd8a66b, 1).fillEllipse(0, -17, 13, 12);
      this.preview.fillStyle(variant.hair, 1).fillEllipse(0, -20, 24, 18);
      this.preview.fillStyle(variant.skin, 1).fillEllipse(0, -17, 13, 12);
      this.preview.fillStyle(variant.hat, 1).fillEllipse(0, -23, 25, 12);
      this.preview.fillStyle(variant.shirt, 1).fillRoundedRect(-15, -4, 30, 22, 8);
      this.preview.fillStyle(variant.pants, 1).fillRoundedRect(-10, 20, 8, 13, 2).fillRoundedRect(2, 20, 8, 13, 2);
      this.preview.fillStyle(0x202522, 1).fillRoundedRect(-12, 30, 10, 7, 2).fillRoundedRect(2, 30, 10, 7, 2);
    }

    this.preview.fillStyle(variant.accent, 0.95);
    if (variant.style === 'FIELD') {
      this.preview.fillRoundedRect(-14, 2, 4, 7, 1);
      this.preview.fillRoundedRect(10, 2, 4, 7, 1);
    } else if (variant.style === 'TRAIL') {
      this.preview.fillCircle(-11, 6, 3);
    } else if (variant.style === 'URBAN') {
      this.preview.fillRoundedRect(-3, -5, 6, 2, 1);
    }

    if (action === 'BODY HIT') {
      this.preview.fillStyle(0xd66a3d, 0.9).fillCircle(-10, 2, 5).fillCircle(9, 7, 4);
      this.preview.lineStyle(2, 0xf0dfb6, 0.9).strokeCircle(-10, 2, 8).strokeCircle(9, 7, 7);
    }

    if (action === 'HEADSHOT') {
      this.preview.fillStyle(0xd66a3d, 0.95).fillCircle(3, -20, 5);
      this.preview.fillStyle(0xf0dfb6, 0.85).fillCircle(3, -20, 2);
    }
  }

  private drawMarkerPreview(direction: number, x: number, y: number, firing: boolean) {
    const length = firing ? 30 : 25;
    const endX = x + direction * length;
    this.preview.fillStyle(0x202522, 1).fillRoundedRect(x, y - 3, direction * length, 6, 2);
    this.preview.fillStyle(0x566052, 1).fillRoundedRect(endX - direction * 5, y - 5, 6, 10, 2);

    if (firing) {
      this.preview.fillStyle(0xf0dfb6, 1).fillTriangle(
        endX + direction * 12, y,
        endX + direction * 2, y - 7,
        endX + direction * 2, y + 7,
      );
      this.preview.fillStyle(0xd66a3d, 0.9).fillCircle(endX + direction * 5, y, 4);
    }
  }

  private describe(action: WardrobeAction) {
    const descriptions: Record<WardrobeAction, string> = {
      'IDLE': 'REFERENCE · neutral standing pose',
      'WALK': 'LOCOMOTION · alternating leg step',
      'WALK LEFT': 'DIRECTION · body leans left while walking',
      'WALK RIGHT': 'DIRECTION · body leans right while walking',
      'AIM LEFT': 'COMBAT · marker raised toward left',
      'AIM RIGHT': 'COMBAT · marker raised toward right',
      'FIRE': 'COMBAT · aim + marker + paintball muzzle flash',
      'BODY HIT': 'DAMAGE · visible paint impact on torso',
      'HEADSHOT': 'DAMAGE · visible paint impact on head',
      'DEATH': 'STATE CHANGE · character falls and rotates',
      'RESPAWN': 'RECOVERY · returns upright to neutral',
    };
    return descriptions[action];
  }

  private playActionMotion(action: WardrobeAction) {
    this.tweens.killTweensOf(this.character);
    this.tweens.killTweensOf(this.shadow);

    this.character.setRotation(0).setAlpha(1).setScale(
      Math.min(5.2, Math.max(3.2, Math.min(this.scale.width, this.scale.height) / 145))
    );
    this.shadow.setScale(1).setAlpha(0.28);

    if (action === 'WALK' || action === 'WALK LEFT' || action === 'WALK RIGHT') {
      this.tweens.add({
        targets: [this.character, this.shadow],
        x: '+=18',
        duration: 360,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: 1,
      });
    } else if (action === 'FIRE') {
      this.tweens.add({
        targets: this.character,
        x: '+=7',
        duration: 80,
        ease: 'Quad.out',
        yoyo: true,
        repeat: 1,
      });
    } else if (action === 'BODY HIT' || action === 'HEADSHOT') {
      this.tweens.add({
        targets: this.character,
        x: '+=5',
        duration: 70,
        yoyo: true,
        repeat: 2,
      });
    } else if (action === 'DEATH') {
      this.tweens.add({
        targets: this.character,
        y: '+=28',
        rotation: -0.95,
        alpha: 0.9,
        duration: 520,
        ease: 'Quad.in',
      });
      this.tweens.add({
        targets: this.shadow,
        scaleX: 1.25,
        scaleY: 0.75,
        duration: 520,
        ease: 'Quad.in',
      });
    } else if (action === 'RESPAWN') {
      this.character.setAlpha(0).setY(benchCenterY(this.scale.height));
      this.tweens.add({
        targets: this.character,
        alpha: 1,
        y: benchCenterY(this.scale.height) - 8,
        duration: 380,
        ease: 'Back.out',
      });
    }
  }

  private toggleFlow(button: Phaser.GameObjects.Text) {
    if (this.playing) {
      this.stopFlow();
      button.setText('▶ FLOW THROUGH ALL');
      return;
    }

    this.playing = true;
    button.setText('■ STOP FLOW');
    this.showAction(this.actionIndex, false);

    this.playTimer = this.time.addEvent({
      delay: 850,
      loop: true,
      callback: () => {
        if (!this.playing) return;
        this.actionIndex = (this.actionIndex + 1) % ACTIONS.length;
        this.showAction(this.actionIndex, false);
      },
    });
  }

  private stopFlow() {
    this.playing = false;
    this.playTimer?.remove(false);
    this.playTimer = undefined;
  }
}

function benchCenterY(height: number) {
  return height * 0.47 + 82;
}
