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

  preload() {
    this.load.spritesheet('wardrobe-enemy', '/assets/wardrobe/enemy/enemy.png', {
      frameWidth: 34,
      frameHeight: 54,
    });
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

    const toolLine = this.add.text(panel.x, panel.y + panel.height * 0.36,
      'REFERENCE COPY · OPEN THE LAB TO PLAY ACTIONS',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#8fb39b',
        align: 'center',
      }).setOrigin(0.5);

    const enter = this.add.text(width / 2, height - 40, 'TAP ANYWHERE · OPEN FIELD LAB', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f4f1df',
      backgroundColor: '#315845',
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });

    const continueLab = () => this.openLab();
    enter.on('pointerdown', continueLab);
    this.input.on('pointerdown', continueLab);
    this.input.keyboard?.on('keydown-ENTER', continueLab);
    this.input.keyboard?.on('keydown-SPACE', continueLab);

    this.tweens.add({ targets: toolLine, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', continueLab);
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
    const shadow = this.add.ellipse(0, 58, 58, 16, 0x000000, 0.28);
    const sprite = this.add.image(0, 0, 'wardrobe-enemy', 0)
      .setDisplaySize(85, 135)
      .setOrigin(0.5, 0.5);
    container.add([shadow, sprite]);
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
  private shadow!: Phaser.GameObjects.Ellipse;
  private spriteLabel!: Phaser.GameObjects.Text;
  private directionLabel!: Phaser.GameObjects.Text;
  private move = new Phaser.Math.Vector2();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' = 'DOWN';
  private previewSprite!: Phaser.GameObjects.Sprite;
  private covers: Phaser.Geom.Rectangle[] = [];
  private characterNameLabel!: Phaser.GameObjects.Text;
  private animationLabel!: Phaser.GameObjects.Text;
  private selectedCharacterIndex = 0;
  private readonly characterNames = [
    'police_officer', 'firefighter', 'mechanic', 'teacher', 'butcher',
    'student', 'cook', 'priest', 'punk', 'biker',
    'jogger', 'soldier', 'nurse', 'child', 'heavyset',
    'runner', 'bruiser', 'old_man', 'businessman',
  ];
  private joystickReset?: () => void;

  private readonly worldWidth = 2400;
  private readonly worldHeight = 1400;
  private readonly playerSpawn = new Phaser.Math.Vector2(360, 1040);
  private readonly playerSpeed = 170;

  constructor() {
    super('WardrobeLabScene');
  }

  preload() {
    this.load.spritesheet('wardrobe-enemy', '/assets/wardrobe/enemy/enemy.png', {
      frameWidth: 34,
      frameHeight: 54,
    });
  }

  create() {
    const { width, height } = this.scale;

    // Wardrobe is now a character-only copy of the live Arena:
    // same world size, field layout, camera behavior, movement speed and cover
    // collision. Only the player presentation is replaced by the real sprite.
    this.cameras.main.setBackgroundColor('#6f984b');
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.drawArenaField();

    this.character = this.add.container(this.playerSpawn.x, this.playerSpawn.y).setDepth(30);
    this.shadow = this.add.ellipse(0, 0, 46, 13, 0x3d3025, 0.28).setDepth(29);

    // The free pack uses one shared 192x192 canvas and one shared foot line.
    // Keep the container on the Arena ground point and let the sprite origin
    // place every character's feet on that exact point.
    this.previewSprite = this.add.sprite(0, 0, this.spriteKey(this.currentCharacter(), 'south'), 0)
      .setDisplaySize(128, 128)
      .setOrigin(0.5, 165 / 192);
    this.character.add(this.previewSprite);
    this.createCharacterAnimations();
    this.playCharacterAnimation(false);

    this.cameras.main.startFollow(this.character, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(
      Math.min(width * 0.28, 320),
      Math.min(height * 0.22, 150),
    );

    this.add.rectangle(width / 2, 34, width, 68, 0x101512, 0.86)
      .setScrollFactor(0).setDepth(100);
    this.add.text(18, 18, 'WARDROBE · ARENA CHARACTER LAB', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setScrollFactor(0).setDepth(101);
    this.add.text(18, 42, 'EXACT ARENA FIELD · SAME MOVEMENT · REAL SPRITE ONLY', {
      fontFamily: 'monospace',
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#8fb39b',
    }).setScrollFactor(0).setDepth(101);

    this.spriteLabel = this.add.text(width - 18, 18, 'FREE TOP-DOWN CHARACTER PACK', {
      fontFamily: 'monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#e8c95c',
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

    this.directionLabel = this.add.text(width - 18, 42, '', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#f4f1df',
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

    this.createCharacterSelector();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-R', () => this.resetCharacter());

    this.createFieldJoystick();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
      this.joystickReset?.();
    });

    this.updateLabels();
    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time: number, delta: number) {
    let dx = this.move.x;
    let dy = this.move.y;

    if (!dx && !dy) {
      dx = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
      dy = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
    }

    let walking = false;
    if (dx || dy) {
      walking = true;
      if (Math.abs(dx) > 0.08) {
        this.direction = dx < 0 ? 'LEFT' : 'RIGHT';
      } else if (Math.abs(dy) > 0.08) {
        this.direction = dy < 0 ? 'UP' : 'DOWN';
      }

      const length = Math.hypot(dx, dy) || 1;
      const nx = Phaser.Math.Clamp(
        this.character.x + (dx / length) * this.playerSpeed * delta / 1000,
        42,
        2358,
      );
      const ny = Phaser.Math.Clamp(
        this.character.y + (dy / length) * this.playerSpeed * delta / 1000,
        90,
        1350,
      );

      // Exact Arena cover collision rule for the player body.
      if (!this.inCover(nx, ny, 14)) {
        this.character.setPosition(nx, ny);
      }
    }

    this.directionLabel.setText('FACING · ' + this.direction + ' · ' + (walking ? 'WALK' : 'IDLE') + ' · ARENA CAMERA');
    this.playCharacterAnimation(walking);
  }

  private createFieldJoystick() {
    const x = 72;
    const y = this.scale.height - 112;
    const base = this.add.circle(x, y, 48, 0x101512, 0.48)
      .setScrollFactor(0).setDepth(102).setStrokeStyle(2, 0xe8c95c, 0.55);
    const knob = this.add.circle(x, y, 20, 0x315845, 0.92)
      .setScrollFactor(0).setDepth(103);

    let pointerId = -1;
    const reset = () => {
      pointerId = -1;
      this.move.set(0, 0);
      knob.setPosition(x, y);
    };
    this.joystickReset = reset;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 75 || pointer.x > this.scale.width - 180) return;
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y) <= 90) {
        pointerId = pointer.id;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== pointerId) return;
      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const distance = Math.min(48, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      knob.setPosition(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
      this.move.set(
        Math.cos(angle) * distance / 48,
        Math.sin(angle) * distance / 48,
      );
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === pointerId) reset();
    });

    this.add.text(x, y + 56, 'MOVE', {
      fontFamily: 'monospace',
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    this.add.text(this.scale.width - 16, this.scale.height - 58, 'RESET POSITION', {
      fontFamily: 'monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f4f1df',
      backgroundColor: '#315845',
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(102)
      .setInteractive()
      .on('pointerdown', () => this.resetCharacter());
  }

  private updateLabels() {
    const current = this.currentCharacter();
    this.spriteLabel.setText('FREE PACK · 4 DIRECTIONS · WALK CYCLE');
    this.characterNameLabel?.setText(this.displayCharacterName(current));
  }

  private currentCharacter() {
    return this.characterNames[this.selectedCharacterIndex];
  }

  private displayCharacterName(name: string) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private spriteKey(character: string, direction: string) {
    return `wardrobe-pack-${character}-${direction}`;
  }

  private directionKey() {
    return {
      DOWN: 'south',
      UP: 'north',
      LEFT: 'west',
      RIGHT: 'east',
    }[this.direction];
  }

  private createCharacterAnimations() {
    for (const character of this.characterNames) {
      for (const direction of ['south', 'north', 'east', 'west']) {
        const key = this.spriteKey(character, direction);
        if (this.anims.exists(key)) continue;
        const texture = this.textures.get(key);
        const frameCount = Math.max(1, texture.frameTotal - 1);
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: frameCount - 1 }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }
  }

  private playCharacterAnimation(walking: boolean) {
    const key = this.spriteKey(this.currentCharacter(), this.directionKey());
    if (this.previewSprite.texture.key !== key) {
      this.previewSprite.setTexture(key, 0);
      this.previewSprite.setOrigin(0.5, 165 / 192);
    }

    if (walking) {
      this.previewSprite.play(key, true);
    } else {
      this.previewSprite.stop();
      this.previewSprite.setFrame(0);
    }

    this.animationLabel?.setText(walking ? 'ANIMATION · WALK' : 'ANIMATION · IDLE / FIRST WALK FRAME');
  }

  private selectCharacter(index: number) {
    const count = this.characterNames.length;
    this.selectedCharacterIndex = (index + count) % count;
    this.playCharacterAnimation(false);
    this.updateLabels();
  }

  private createCharacterSelector() {
    const width = this.scale.width;
    const y = 100;

    this.add.rectangle(width / 2, y, Math.min(width - 28, 520), 68, 0x101512, 0.90)
      .setScrollFactor(0).setDepth(100);

    this.characterNameLabel = this.add.text(width / 2, y - 20, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#e8c95c',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104);

    this.animationLabel = this.add.text(width / 2, y - 4, 'ANIMATION · IDLE', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#8fb39b',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104);

    const makeButton = (x: number, label: string, deltaIndex: number) => {
      return this.add.text(x, y + 19, label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f4f1df',
        backgroundColor: '#315845',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(104)
        .setInteractive({ useHandCursor: false })
        .on('pointerdown', () => this.selectCharacter(this.selectedCharacterIndex + deltaIndex));
    };

    makeButton(width / 2 - 108, '‹ PREV', -1);
    makeButton(width / 2 + 108, 'NEXT ›', 1);
    this.updateLabels();
  }

  private resetCharacter() {
    this.character.setPosition(this.playerSpawn.x, this.playerSpawn.y);
    this.shadow.setPosition(this.playerSpawn.x, this.playerSpawn.y);
    this.move.set(0, 0);
    this.direction = 'DOWN';
    this.playCharacterAnimation(false);
  }

  private inCover(x: number, y: number, padding = 12) {
    return this.covers.some((cover) =>
      x >= cover.x - padding &&
      x <= cover.x + cover.width + padding &&
      y >= cover.y - padding &&
      y <= cover.y + cover.height + padding
    );
  }

  private drawArenaField() {
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(0x78a653, 1).fillRect(0, 0, this.worldWidth, this.worldHeight);
    g.fillStyle(0x86ad5e, 0.42).fillRect(0, 0, this.worldWidth * 0.50, this.worldHeight);
    g.fillStyle(0x679346, 0.32).fillRect(this.worldWidth * 0.50, 0, this.worldWidth * 0.50, this.worldHeight);
    g.fillStyle(0xd1b46c, 0.30).fillRect(0, 510, this.worldWidth, 92);
    g.fillStyle(0xd1b46c, 0.22).fillRect(870, 0, 100, this.worldHeight);

    g.lineStyle(5, 0xf4f1df, 0.48);
    g.strokeRect(55, 70, this.worldWidth - 110, this.worldHeight - 120);

    this.drawTree(300, 280, 1.15);
    this.drawTree(2050, 300, 0.95);
    this.drawTree(350, 1110, 0.90);
    this.drawTree(2070, 1090, 1.10);

    this.drawBunker(690, 360, 190, 72);
    this.drawBunker(1470, 350, 230, 76);
    this.drawBunker(520, 760, 250, 70);
    this.drawBunker(1570, 760, 220, 68);
    this.drawBunker(850, 1030, 260, 74);
    this.drawBunker(1420, 1080, 240, 72);

    this.drawTireStack(1080, 300);
    this.drawTireStack(1900, 650);
    this.drawTireStack(730, 1170);

    this.drawFlag(1180, 860);
    this.drawFieldDetails();
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1)
      .fillCircle(x, y, 34 * scale)
      .fillCircle(x - 28 * scale, y + 9 * scale, 28 * scale)
      .fillCircle(x + 28 * scale, y + 9 * scale, 29 * scale);
    g.fillStyle(0x526d3c, 0.75).fillCircle(x + 5 * scale, y - 16 * scale, 23 * scale);
    this.covers.push(new Phaser.Geom.Rectangle(x - 8 * scale, y + 14 * scale, 16 * scale, 52 * scale));
  }

  private drawBunker(x: number, y: number, width: number, height: number) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x493526, 0.24).fillRect(x + 8, y + 9, width, height);
    g.fillStyle(0x76563b, 1).fillRoundedRect(x, y, width, height, 10);
    g.fillStyle(0xffffff, 0.12).fillRect(x + 12, y + 10, width - 24, 5);
    g.lineStyle(2, 0xf4f1df, 0.28).strokeRoundedRect(x, y, width, height, 10);
    this.covers.push(new Phaser.Geom.Rectangle(x, y, width, height));
  }

  private drawTireStack(x: number, y: number) {
    const g = this.add.graphics().setDepth(3);
    for (let i = 0; i < 4; i += 1) {
      g.fillStyle(0x2b302d, 1).fillCircle(x + i * 17, y - i * 3, 19);
      g.fillStyle(0x66706a, 1).fillCircle(x + i * 17, y - i * 3, 7);
    }
    this.covers.push(new Phaser.Geom.Rectangle(x - 20, y - 25, 90, 45));
  }

  private drawFlag(x: number, y: number) {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x594838, 1).fillRect(x, y, 4, 78);
    g.fillStyle(0x2f7775, 1).fillTriangle(x + 4, y + 4, x + 64, y + 18, x + 4, y + 32);
    this.add.text(x + 32, y + 50, 'ARENA', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#fff4d4',
      stroke: '#493526',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
  }

  private drawFieldDetails() {
    const g = this.add.graphics().setDepth(4);
    g.lineStyle(3, 0xf4f1df, 0.20);
    g.strokeRoundedRect(930, 145, 500, 230, 24);
    g.strokeRoundedRect(900, 885, 560, 250, 24);

    g.lineStyle(2, 0xead8a0, 0.28);
    for (const x of [600, 900, 1200, 1500, 1800]) {
      g.lineBetween(x, 530, x, 585);
      g.lineBetween(x, 815, x, 870);
    }

    g.fillStyle(0x493526, 0.16);
    g.fillRoundedRect(1090, 405, 180, 36, 8);
    g.lineStyle(2, 0xf4f1df, 0.22).strokeRoundedRect(1090, 405, 180, 36, 8);

    this.add.text(1180, 423, 'FIELD LINE', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#fff4d4',
    }).setOrigin(0.5).setDepth(6).setAlpha(0.55);
  }
}

function benchCenterY(height: number) {
  return height * 0.47 + 82;
}
