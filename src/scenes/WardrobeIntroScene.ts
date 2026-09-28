import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

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
    this.load.spritesheet(
      'wardrobe-generated-player-atlas',
      '/assets/wardrobe/generated-v2/player-body-atlas.png',
      { frameWidth: 176, frameHeight: 192 },
    );
    this.load.image('wardrobe-generated-v2-arms', '/assets/wardrobe/generated-v2/player-arms.png');
    this.load.image('wardrobe-generated-v2-weapon', '/assets/wardrobe/generated-v2/player-weapon.png');
    this.load.image('wardrobe-generated-v2-muzzle', '/assets/wardrobe/generated-v2/player-muzzle.png');
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
    const shadow = this.add.ellipse(0, 0, 46, 13, 0x3d3025, 0.28);
    const sprite = this.add.sprite(0, 0, 'wardrobe-generated-player-atlas', 0)
      .setOrigin(0.5, 1)
      .setScale(60 / 160);
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

type WardrobeCharacterSource = 'gegx' | 'soldier' | 'robot' | 'generated' | 'arena';

type WardrobeCharacterDefinition = {
  id: string;
  name: string;
  source: WardrobeCharacterSource;
  basePath: string;
  displaySize: number;
  targetVisibleHeight: number;
  frameWidth: number;
  frameHeight: number;
  originY: number;
  embeddedWeapon: boolean;
  robotColor?: 'Blue' | 'Red';
};

const WARDROBE_PLAYER_DEFINITION: WardrobeCharacterDefinition = {
  id: 'arena_player',
  name: 'SHOOTERS TRIGGER PLAYER · GENERATED V2',
  source: 'generated',
  basePath: '/assets/wardrobe/generated-v2',
  displaySize: 80,
  targetVisibleHeight: 60,
  frameWidth: 176,
  frameHeight: 192,
  originY: 1,
  embeddedWeapon: false,
};

const WARDROBE_CHARACTER_DEFINITIONS: WardrobeCharacterDefinition[] = [
  {
    id: 'arena_player',
    name: 'SHOOTERS TRIGGER PLAYER · GENERATED V2 · 2.JPG',
    source: 'generated',
    basePath: '/assets/wardrobe/generated-v2',
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 176,
    frameHeight: 192,
    originY: 1,
    embeddedWeapon: false,
  },
  {
    id: 'arena_reference',
    name: 'SHOOTERS TRIGGER ARENA · REFERENCE COPY',
    source: 'arena',
    basePath: '',
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 1,
    frameHeight: 1,
    originY: 1,
    embeddedWeapon: true,
  },
  {
    id: 'soldier_01',
    name: 'Soldier 01 · CC BY · ARMED',
    source: 'soldier',
    basePath: '/assets/wardrobe/free-packs/a/export_folder/soldier_01',
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 16,
    frameHeight: 16,
    originY: 1,
    embeddedWeapon: true,
  },
  {
    id: 'soldier_02',
    name: 'Soldier 02 · CC BY · ARMED',
    source: 'soldier',
    basePath: '/assets/wardrobe/free-packs/a/export_folder/soldier_02',
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 16,
    frameHeight: 16,
    originY: 1,
    embeddedWeapon: true,
  },
  {
    id: 'robot_blue',
    name: 'Drone Robot · BLUE · CC0 · ARMED',
    source: 'robot',
    basePath: '/assets/wardrobe/free-packs/b/Free8DirRobot',
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 256,
    frameHeight: 256,
    originY: 0.90,
    embeddedWeapon: true,
    robotColor: 'Blue',
  },
  {
    id: 'robot_red',
    name: 'Drone Robot · RED · CC0 · ARMED',
    source: 'robot',
    basePath: '/assets/wardrobe/free-packs/b/Free8DirRobot',
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 256,
    frameHeight: 256,
    originY: 0.90,
    embeddedWeapon: true,
    robotColor: 'Red',
  },
  ...[
    'police_officer', 'firefighter', 'mechanic', 'teacher', 'butcher',
    'student', 'cook', 'priest', 'punk', 'biker', 'jogger', 'soldier',
    'nurse', 'child', 'heavyset', 'runner', 'bruiser', 'old_man', 'businessman',
  ].map((id) => ({
    id,
    name: id.replace(/_/g, ' ').replace(/\\b\\w/g, (letter) => letter.toUpperCase()),
    source: 'gegx' as const,
    basePath: '/assets/wardrobe/packs/x/gegx-free-walk-pixel-v1.1/' + id,
    displaySize: 80,
    targetVisibleHeight: 60,
    frameWidth: 192,
    frameHeight: 192,
    originY: 165 / 192,
    embeddedWeapon: false,
  })),
];

const WARDROBE_TARGET_DEFINITION: WardrobeCharacterDefinition = {
  id: 'soldier_02_target',
  name: 'Training Target',
  source: 'soldier',
  basePath: '/assets/wardrobe/free-packs/a/export_folder/soldier_02',
  displaySize: 80,
  targetVisibleHeight: 60,
  frameWidth: 16,
  frameHeight: 16,
  originY: 1,
  embeddedWeapon: true,
};
export class WardrobeLabScene extends Phaser.Scene {
  private character!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  private weaponLayer!: Phaser.GameObjects.Graphics;
  private muzzleFlash!: Phaser.GameObjects.Graphics;
  // Arena reference rig: the body/pose stays independent from arms, weapon and muzzle,
  // exactly like ShootersTriggerArenaScene.createFighter().
  private arenaPoseA!: Phaser.GameObjects.Graphics;
  private arenaPoseB!: Phaser.GameObjects.Graphics;
  private arenaArms!: Phaser.GameObjects.Graphics;
  private arenaWeapon!: Phaser.GameObjects.Graphics;
  private arenaMuzzle!: Phaser.GameObjects.Graphics;
  private target!: Phaser.GameObjects.Container;
  private targetSprite!: Phaser.GameObjects.Sprite;
  private spriteLabel!: Phaser.GameObjects.Text;
  private directionLabel!: Phaser.GameObjects.Text;
  private combatLabel!: Phaser.GameObjects.Text;
  private move = new Phaser.Math.Vector2();
  private aim = new Phaser.Math.Vector2(1, 0);
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' = 'DOWN';
  private playerFacing = 1;
  private previewSprite!: Phaser.GameObjects.Sprite;
  private bodySprite!: Phaser.GameObjects.Sprite;
  private armsSprite!: Phaser.GameObjects.Sprite;
  private weaponSprite!: Phaser.GameObjects.Sprite;
  private muzzleSprite!: Phaser.GameObjects.Sprite;
  private covers: Phaser.Geom.Rectangle[] = [];
  private characterNameLabel!: Phaser.GameObjects.Text;
  private animationLabel!: Phaser.GameObjects.Text;
  private selectedCharacterIndex = 0;
  private fireHeld = false;
  private fireCooldown = 0;
  private muzzleUntil = 0;
  private generatedAction: 'ready' | 'aim' | 'shoot' | 'muzzle' | 'recoil' | 'hit' | 'headshot' | 'death' | 'dodge' | 'respawn' = 'ready';
  private generatedActionUntil = 0;
  private visualMove = new Phaser.Math.Vector2(0, 1);
  private targetBodyHits = 0;
  private targetDown = false;
  private pointerId = -1;
  private arenaAnimTime = 0;
  private pointerAimActive = false;
  private shots: Array<{
    graphics: Phaser.GameObjects.Arc;
    position: Phaser.Math.Vector2;
    velocity: Phaser.Math.Vector2;
    ageMs: number;
  }> = [];
  private cleanupMobileControls?: () => void;

  private readonly worldWidth = 2400;
  private readonly worldHeight = 1400;
  private readonly playerSpawn = new Phaser.Math.Vector2(360, 1040);
  private readonly targetSpawn = new Phaser.Math.Vector2(1820, 900);
  private readonly playerSpeed = 170;
  private readonly projectileSpeed = 520;
  private readonly projectileLifetimeMs = 1100;
  private readonly fireIntervalMs = 240;
  private readonly characterDefinitions = WARDROBE_CHARACTER_DEFINITIONS;
  private readonly targetVisibleCharacterHeight = 60;
  private readonly targetDefinition = WARDROBE_TARGET_DEFINITION;

  constructor() {
    super('WardrobeLabScene');
  }

  preload() {
    this.load.spritesheet(
      'wardrobe-generated-player-atlas',
      '/assets/wardrobe/generated-v2/player-body-atlas.png',
      { frameWidth: 176, frameHeight: 192 },
    );
    this.load.image('wardrobe-generated-v2-arms', '/assets/wardrobe/generated-v2/player-arms.png');
    this.load.image('wardrobe-generated-v2-weapon', '/assets/wardrobe/generated-v2/player-weapon.png');
    this.load.image('wardrobe-generated-v2-muzzle', '/assets/wardrobe/generated-v2/player-muzzle.png');
    for (const direction of ['DOWN', 'UP', 'LEFT', 'RIGHT'] as const) {
      this.load.spritesheet(
        this.spriteKey(this.targetDefinition, direction),
        this.targetDefinition.basePath + '/soldier_02_spritesheet_walking_' + direction.toLowerCase() + '.png',
        { frameWidth: this.targetDefinition.frameWidth, frameHeight: this.targetDefinition.frameHeight },
      );
    }
    for (const def of this.characterDefinitions) {
      for (const direction of ['DOWN', 'UP', 'LEFT', 'RIGHT'] as const) {
        if (def.source === 'generated' || def.source === 'arena') continue;
        if (def.source === 'gegx') {
          this.load.spritesheet(
            this.spriteKey(def, direction),
            def.basePath + '/strips/' + this.gegxDirection(direction) + '.png',
            { frameWidth: def.frameWidth, frameHeight: def.frameHeight },
          );
        } else if (def.source === 'soldier') {
          this.load.spritesheet(
            this.spriteKey(def, direction),
            def.basePath + '/soldier_' + def.id.slice(-2) + '_spritesheet_walking_' + direction.toLowerCase() + '.png',
            { frameWidth: def.frameWidth, frameHeight: def.frameHeight },
          );
        } else {
          const robotDir = this.robotDirection(direction);
          const color = def.robotColor!;
          this.load.spritesheet(
            this.spriteKey(def, direction, 'walk'),
            def.basePath + '/WalkingShoot/LowPolyManny_' + color + '_rig_WalkingShoot_dir' + robotDir + '.png',
            { frameWidth: def.frameWidth, frameHeight: def.frameHeight },
          );
          this.load.spritesheet(
            this.spriteKey(def, direction, 'shoot'),
            def.basePath + '/StandingShoot/LowPolyManny_' + color + '_rig_StandingShoot_dir' + robotDir + '.png',
            { frameWidth: def.frameWidth, frameHeight: def.frameHeight },
          );
        }
      }
    }
  }

  create() {
    const { width, height } = this.scale;

    this.prepareGeneratedCharacterTextures();

    this.cameras.main.setBackgroundColor('#6f984b');
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.drawArenaField();

    this.character = this.add.container(this.playerSpawn.x, this.playerSpawn.y).setDepth(30);

    const current = this.currentDefinition();
    const arenaReference = current.source === 'arena';
    this.shadow = this.add.ellipse(
      0,
      arenaReference ? 34 : 0,
      arenaReference ? 27 : 46,
      arenaReference ? 10 : 13,
      0x3d3025,
      0.28,
    );

    // Keep the generic overlay hidden. The Arena reference gets its own exact
    // fighter rig below; the generated v2 operator uses the real separated
    // arms / weapon / muzzle artwork loaded above.
    this.weaponLayer = this.add.graphics().setVisible(false);
    this.muzzleFlash = this.add.graphics().setVisible(false);
    this.character.add([this.shadow]);

    // Build the Arena reference rig once, regardless of which character is
    // selected at startup. PREV/NEXT must be able to enter the Arena reference
    // safely from every visual-test character.
    this.createArenaReferenceRig();

    if (arenaReference) {
      this.previewSprite = this.add.sprite(0, 0, 'wardrobe-generated-player-atlas', 0)
        .setOrigin(0.5, 1)
        .setVisible(false);
    } else {
      this.previewSprite = this.add.sprite(0, 0, this.spriteKey(current, 'DOWN'), 0)
        .setOrigin(0.5, current.originY);
      this.fitCharacterSprite(this.previewSprite, current);
      this.previewSprite.setVisible(true);
    }
    this.bodySprite = this.previewSprite;
    this.armsSprite = this.add.sprite(0, 0, 'wardrobe-generated-v2-arms')
      .setOrigin(0.08, 0.5)
      .setVisible(false);
    this.weaponSprite = this.add.sprite(0, 0, 'wardrobe-generated-v2-weapon')
      .setOrigin(0.50, 0.5)
      .setVisible(false);
    this.muzzleSprite = this.add.sprite(0, 0, 'wardrobe-generated-v2-muzzle')
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.character.add([this.previewSprite, this.armsSprite, this.weaponSprite, this.muzzleSprite]);

    // The Arena reference rig must always be part of the character container.
    // It is hidden for other characters and revealed when PREV/NEXT selects it.
    this.character.add([
      this.arenaPoseA,
      this.arenaPoseB,
      this.arenaArms,
      this.arenaWeapon,
      this.arenaMuzzle,
    ]);

    if (!arenaReference) {
      this.arenaPoseA.setVisible(false);
      this.arenaPoseB.setVisible(false);
      this.arenaArms.setVisible(false);
      this.arenaWeapon.setVisible(false);
      this.arenaMuzzle.setVisible(false);
    }
    this.character.add([this.weaponLayer, this.muzzleFlash]);

    this.createCharacterAnimations();

    this.target = this.add.container(this.targetSpawn.x, this.targetSpawn.y).setDepth(29);
    const targetDef = this.targetDefinition;
    const targetShadow = this.add.ellipse(0, 0, 46, 13, 0x3d3025, 0.28);
    this.target.add(targetShadow);
    this.targetSprite = this.add.sprite(0, 0, this.spriteKey(targetDef, 'DOWN'), 0)
      .setOrigin(0.5, targetDef.originY);
    this.fitCharacterSprite(this.targetSprite, targetDef);
    this.target.add(this.targetSprite);
    this.target.setAlpha(0.96);

    this.cameras.main.startFollow(this.character, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(
      Math.min(width * 0.28, 320),
      Math.min(height * 0.22, 150),
    );

    this.add.rectangle(width / 2, 34, width, 68, 0x101512, 0.86)
      .setScrollFactor(0).setDepth(100);
    this.add.text(18, 18, 'WARDROBE · SHOOTERS TRIGGER PLAYER LAB', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setScrollFactor(0).setDepth(101);
    this.add.text(18, 42, 'ONE AUTHORITATIVE PLAYER · 1.JPG + OG.JPG SOURCE MATERIAL · AIM / FIRE TEST', {
      fontFamily: 'monospace',
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#8fb39b',
    }).setScrollFactor(0).setDepth(101);

    this.spriteLabel = this.add.text(width - 18, 18, '', {
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
    this.cleanupMobileControls = installShootersTriggerMobileControls();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-R', () => this.resetCharacter());
    this.input.keyboard?.on('keydown-H', () => this.triggerGeneratedAction('hit', 420));
    this.input.keyboard?.on('keydown-J', () => this.triggerGeneratedAction('headshot', 520));
    this.input.keyboard?.on('keydown-K', () => this.triggerGeneratedAction('death', 1200));
    this.input.keyboard?.on('keydown-L', () => this.triggerGeneratedAction('respawn', 700));
    this.input.keyboard?.on('keydown-D', () => this.triggerGeneratedAction('dodge', 520));
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.fireHeld = true;
      this.pointerAimActive = false;
    });
    this.input.keyboard?.on('keyup-SPACE', () => {
      this.fireHeld = false;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const bottomControls = pointer.y > this.scale.height - 180;
      const leftControl = pointer.x < 190;
      const rightControl = pointer.x > this.scale.width - 190;
      if (pointer.y < 76 || (bottomControls && (leftControl || rightControl))) return;
      this.pointerAimActive = true;
      this.updateAimFromWorldPointer(pointer);
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerAimActive || this.pointerId >= 0) return;
      this.updateAimFromWorldPointer(pointer);
    });
    this.input.on('pointerup', () => {
      if (this.pointerId < 0) {
        this.pointerAimActive = false;
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
      this.cleanupMobileControls?.();
      this.shots.forEach((shot) => shot.graphics.destroy());
      this.shots = [];
    });

    this.updateLabels();
    this.updateWeaponLayer();
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
      this.visualMove.set(dx, dy).normalize();
      if (Math.abs(dx) > 0.08) {
        this.direction = dx < 0 ? 'LEFT' : 'RIGHT';
        if (this.currentDefinition().source === 'arena') {
          this.playerFacing = dx < 0 ? -1 : 1;
        }
      } else if (Math.abs(dy) > 0.08) {
        this.direction = dy < 0 ? 'UP' : 'DOWN';
      }

      const length = Math.hypot(dx, dy) || 1;
      const speed = this.currentDefinition().source === 'arena'
        ? this.getArenaReferenceSpeed()
        : this.playerSpeed;
      const nx = Phaser.Math.Clamp(
        this.character.x + (dx / length) * speed * delta / 1000,
        42,
        2358,
      );
      const ny = Phaser.Math.Clamp(
        this.character.y + (dy / length) * speed * delta / 1000,
        90,
        1350,
      );

      if (!this.inCover(nx, ny, 14)) {
        this.character.setPosition(nx, ny);
      }
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - delta);
    this.muzzleUntil = Math.max(0, this.muzzleUntil - delta);
    this.generatedActionUntil = Math.max(0, this.generatedActionUntil - delta);
    // Arena's animation clock never stops; only its cadence changes between
    // moving (120ms) and idle (650ms). This mirrors ShootersTriggerArenaScene.
    if (this.currentDefinition().source === 'arena') this.arenaAnimTime += delta;
    else this.arenaAnimTime = 0;
    if (this.generatedActionUntil === 0 && this.generatedAction !== 'ready') {
      this.generatedAction = 'ready';
    }

    if (this.fireHeld && this.fireCooldown <= 0 && !this.targetDown) {
      this.fireShot();
    }

    this.updateShots(delta);
    this.updateTargetFacing();
    this.playCharacterAnimation(walking);
    this.updateWeaponLayer();
    this.updateLabels();
  }

  private prepareGeneratedCharacterTextures() {
    // Generated v2 is a real RGBA spritesheet. fitCharacterSprite() measures
    // the actual visible alpha bounds so every frame shares a grounded baseline.
  }

  private generatedKey(def: WardrobeCharacterDefinition, action: string) {
    return 'wardrobe-' + def.id + '-' + action;
  }

  private createArenaReferenceRig() {
    const makePose = (legOffset: number, bob: number) => {
      const g = this.add.graphics();

      // This is intentionally the same body construction as Shooter Trigger
      // Arena. The reference is a structural copy, not a baked screenshot.
      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1).fillCircle(-7, -17 + bob, 2.5).fillCircle(7, -17 + bob, 2.5);
      g.fillStyle(0x2f6b4e, 1).fillEllipse(0, -23 + bob, 25, 12);
      g.fillStyle(0x111715, 1).fillRoundedRect(-13, -17 + bob, 26, 10, 4);
      g.fillStyle(0x9bb9b1, 0.88).fillRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.lineStyle(1, 0xe8f2dc, 0.42).strokeRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8 + bob, 8, 7, 2);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1 + bob, 20, 14, 4);
      g.fillStyle(0x17201c, 0.9).fillRoundedRect(-15, 0 + bob, 6, 13, 2).fillRoundedRect(9, 0 + bob, 6, 13, 2);
      g.fillStyle(0xc1a86c, 1).fillRect(-10, 8 + bob, 20, 4);
      g.fillStyle(0x1d2923, 1).fillRect(-12, 12 + bob, 24, 5);
      g.fillStyle(0x5e4936, 1).fillRoundedRect(-15, 8 + bob, 5, 8, 2).fillRoundedRect(10, 8 + bob, 5, 8, 2);
      g.fillStyle(0x29372f, 1).fillRoundedRect(-11, 16 + bob, 22, 7, 3);
      g.fillStyle(0x566052, 1).fillRoundedRect(-10 + legOffset, 20 + bob, 8, 13, 2).fillRoundedRect(2 - legOffset, 20 + bob, 8, 13, 2);
      g.fillStyle(0x202522, 1).fillRoundedRect(-12 + legOffset, 30 + bob, 10, 7, 2).fillRoundedRect(2 - legOffset, 30 + bob, 10, 7, 2);
      return g;
    };

    this.arenaPoseA = makePose(0, 0);
    this.arenaPoseB = makePose(2, 1).setVisible(false);
    this.arenaArms = this.add.graphics();
    this.arenaWeapon = this.add.graphics();
    this.arenaMuzzle = this.add.graphics();
    this.updateArenaReferenceWeaponPose();
  }

  private updateArenaReferenceWeaponPose() {
    if (!this.arenaArms || !this.arenaWeapon || !this.arenaMuzzle) return;

    const angle = Math.atan2(this.aim.y, this.aim.x);

    // Exact Shooter Trigger Arena offsets and artwork.
    this.arenaWeapon.setRotation(angle).setPosition(5, 3);
    this.arenaArms.setRotation(angle).setPosition(0, 0);
    this.arenaArms.clear();
    this.arenaArms.lineStyle(5, 0x314b3c, 1);
    this.arenaArms.lineBetween(-8, 5, 5, 2);
    this.arenaArms.lineBetween(8, 5, 12, 4);
    this.arenaArms.fillStyle(0xd4a45d, 1).fillCircle(5, 2, 3).fillCircle(12, 4, 3);

    this.arenaWeapon.clear();
    this.arenaWeapon.lineStyle(3, 0x6c806f, 1).lineBetween(10, 5, 2, 12);
    this.arenaWeapon.fillStyle(0x151b18, 1).fillEllipse(13, -8, 9, 7);
    this.arenaWeapon.fillStyle(0x33423b, 1).fillRoundedRect(7, -4, 18, 9, 3);
    this.arenaWeapon.fillStyle(0x111715, 1).fillRect(22, -2, 15, 5);
    this.arenaWeapon.fillStyle(0x53635c, 1).fillRect(12, -9, 8, 4);
    this.arenaWeapon.fillStyle(0x171d1b, 1).fillRoundedRect(11, 4, 5, 10, 2);
    this.arenaWeapon.fillStyle(0x493b31, 1).fillRoundedRect(-5, 4, 10, 5, 2);
    this.arenaWeapon.lineStyle(3, 0x2a332f, 1).lineBetween(-2, 6, 8, 5);
    this.arenaWeapon.lineStyle(1, 0xe8c95c, 0.45).lineBetween(35, 0, 45, 0);

    this.arenaMuzzle.clear();
    this.arenaMuzzle.setRotation(angle).setPosition(42, 0);
    this.arenaMuzzle.fillStyle(0xf0dfb6, 0.72);
    this.arenaMuzzle.fillCircle(0, 0, 3);
    this.arenaMuzzle.setVisible(this.muzzleUntil > 0);
  }


  private currentDefinition() {
    return this.characterDefinitions[this.selectedCharacterIndex];
  }

  private displayCharacterName(def: WardrobeCharacterDefinition) {
    return def.name;
  }

  private gegxDirection(direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT') {
    return {
      DOWN: 'south',
      UP: 'north',
      LEFT: 'west',
      RIGHT: 'east',
    }[direction];
  }

  private robotDirection(direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT') {
    return {
      DOWN: 8,
      LEFT: 2,
      UP: 4,
      RIGHT: 6,
    }[direction];
  }

  private fitCharacterSprite(sprite: Phaser.GameObjects.Sprite, def: WardrobeCharacterDefinition) {
    const source = sprite.texture.getSourceImage() as CanvasImageSource;
    const frame = sprite.frame;
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      sprite.setDisplaySize(def.displaySize, def.displaySize).setOrigin(0.5, def.originY);
      return;
    }
    context.drawImage(source, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
    const pixels = context.getImageData(0, 0, frame.width, frame.height).data;
    let minY = frame.height;
    let maxY = -1;
    for (let y = 0; y < frame.height; y += 1) {
      for (let x = 0; x < frame.width; x += 1) {
        if (pixels[(y * frame.width + x) * 4 + 3] > 12) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxY < 0) {
      sprite.setDisplaySize(def.displaySize, def.displaySize).setOrigin(0.5, def.originY);
      return;
    }
    const visibleHeight = maxY - minY + 1;
    const scale = this.targetVisibleCharacterHeight / visibleHeight;
    sprite.setScale(scale);
    sprite.setOrigin(0.5, (maxY + 1) / frame.height);
  }

  private spriteKey(
    def: WardrobeCharacterDefinition,
    direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT',
    action: 'idle' | 'walk' | 'shoot' = 'walk',
  ) {
    return 'wardrobe-' + def.id + '-' + direction + '-' + action;
  }

  private createCharacterAnimations() {
    for (const def of this.characterDefinitions) {
      for (const direction of ['DOWN', 'UP', 'LEFT', 'RIGHT'] as const) {
        if (def.source === 'generated') continue;
        const walkKey = this.spriteKey(def, direction, 'walk');
        if (!this.anims.exists(walkKey)) {
          const texture = this.textures.get(walkKey);
          const frameCount = Math.max(1, texture.frameTotal - 1);
          this.anims.create({
            key: walkKey,
            frames: this.anims.generateFrameNumbers(walkKey, { start: 0, end: frameCount - 1 }),
            frameRate: def.source === 'robot' ? 12 : 10,
            repeat: -1,
          });
        }
        if (def.source === 'robot') {
          const shootKey = this.spriteKey(def, direction, 'shoot');
          if (!this.anims.exists(shootKey)) {
            const texture = this.textures.get(shootKey);
            const frameCount = Math.max(1, texture.frameTotal - 1);
            this.anims.create({
              key: shootKey,
              frames: this.anims.generateFrameNumbers(shootKey, { start: 0, end: frameCount - 1 }),
              frameRate: 12,
              repeat: 0,
            });
          }
        }
      }
    }

    const generatedAnimations: Array<[string, number, number]> = [
      ['DOWN', 0, 3],
      ['UP', 4, 7],
      ['LEFT', 8, 11],
      ['RIGHT', 12, 15],
      ['DOWN-RIGHT', 16, 19],
      ['UP-RIGHT', 24, 27],
    ];
    const atlasKey = 'wardrobe-generated-player-atlas';
    for (const def of this.characterDefinitions.filter((entry) => entry.source === 'generated')) {
      for (const [direction, start, end] of generatedAnimations) {
        const key = this.generatedKey(def, direction);
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(atlasKey, { start, end }),
            frameRate: 8,
            repeat: -1,
          });
        }
      }
    }
  }

  private playCharacterAnimation(walking: boolean) {
    const def = this.currentDefinition();
    const vx = this.visualMove.x;
    const vy = this.visualMove.y;

    this.previewSprite.setVisible(true);

    if (def.source === 'arena') {
      // Exact Arena animation contract: 120ms while moving, 650ms while idle.
      const poseB = Math.floor(this.arenaAnimTime / (walking ? 120 : 650)) % 2 === 1;
      this.previewSprite.setVisible(false);
      this.arenaPoseA.setVisible(!poseB).setScale(this.playerFacing, 1);
      this.arenaPoseB.setVisible(poseB).setScale(this.playerFacing, 1);
      this.arenaArms.setVisible(true);
      this.arenaWeapon.setVisible(true);
      this.arenaMuzzle.setVisible(this.muzzleUntil > 0);
      this.updateArenaReferenceWeaponPose();
      return;
    }

    if (def.source !== 'generated') {
      if (this.muzzleUntil > 0 && def.source === 'robot') {
        const shootKey = this.spriteKey(def, this.direction, 'shoot');
        if (this.previewSprite.texture.key !== shootKey) {
          this.previewSprite.setTexture(shootKey, 0);
          this.fitCharacterSprite(this.previewSprite, def);
        }
        this.previewSprite.play(shootKey, true);
      } else {
        const walkKey = this.spriteKey(def, this.direction, 'walk');
        if (this.previewSprite.texture.key !== walkKey) {
          this.previewSprite.setTexture(walkKey, 0);
          this.fitCharacterSprite(this.previewSprite, def);
        }
        if (walking) {
          this.previewSprite.play(walkKey, true);
        } else {
          this.previewSprite.stop();
          this.previewSprite.setFrame(0);
        }
      }
      this.previewSprite.setRotation(0);
      return;
    }

    const atlasKey = 'wardrobe-generated-player-atlas';
    const diagonal = walking && Math.abs(vx) > 0.35 && Math.abs(vy) > 0.35;
    let animation = 'DOWN';
    let flipX = false;

    if (diagonal) {
      animation = vy < 0 ? 'UP-RIGHT' : 'DOWN-RIGHT';
      flipX = vx < 0;
    } else if (this.direction === 'UP') {
      animation = 'UP';
    } else if (this.direction === 'LEFT') {
      animation = 'LEFT';
    } else if (this.direction === 'RIGHT') {
      animation = 'RIGHT';
    }

    // The generated body supplies the character artwork only. The armed pose
    // is driven by the same Arena arms/weapon rig used by Shooters Trigger,
    // so there is exactly one weapon representation and no second floating
    // extracted arm/gun layered over the body.
    const aiming = Math.abs(this.aim.x) > 0.2 || this.generatedAction === 'aim' || this.generatedAction === 'shoot';
    if (aiming && !walking) {
      animation = this.aim.x < 0 ? 'LEFT' : 'RIGHT';
      flipX = false;
    }

    const action = this.generatedAction;
    const hitState = action === 'hit' || action === 'headshot';
    const deadState = action === 'death';

    if (deadState) {
      this.previewSprite.setAlpha(0.42);
    } else {
      this.previewSprite.setAlpha(1);
    }

    if (this.previewSprite.texture.key !== atlasKey) {
      this.previewSprite.setTexture(atlasKey, 0);
      this.fitCharacterSprite(this.previewSprite, def);
    }

    this.previewSprite.setFlipX(flipX);
    this.previewSprite.setRotation(0);
    this.previewSprite.setTint(hitState ? 0xffd8c8 : 0xffffff);

    if (walking) {
      this.previewSprite.play(this.generatedKey(def, animation), true);
    } else {
      const idleFrames: Record<string, number> = {
        DOWN: 0,
        UP: 4,
        LEFT: 8,
        RIGHT: 12,
        'DOWN-RIGHT': 16,
        'UP-RIGHT': 24,
      };
      this.previewSprite.stop();
      this.previewSprite.setFrame(idleFrames[animation] ?? 0);
    }

  }

  private triggerGeneratedAction(action: 'aim' | 'shoot' | 'muzzle' | 'recoil' | 'hit' | 'headshot' | 'death' | 'dodge' | 'respawn', duration: number) {
    if (this.currentDefinition().source !== 'generated') return;
    this.generatedAction = action;
    this.generatedActionUntil = duration;
  }

  private updateWeaponLayer() {
    const def = this.currentDefinition();

    if (def.source === 'arena') {
      this.weaponLayer.clear().setVisible(false);
      this.muzzleFlash.clear().setVisible(false);
      this.armsSprite.setVisible(false);
      this.weaponSprite.setVisible(false);
      this.muzzleSprite.setVisible(false);
      this.arenaArms.setVisible(true);
      this.arenaWeapon.setVisible(true);
      this.arenaMuzzle.setVisible(this.muzzleUntil > 0);
      this.updateArenaReferenceWeaponPose();
      return;
    }

    this.arenaArms?.setVisible(false);
    this.arenaWeapon?.setVisible(false);
    this.arenaMuzzle?.setVisible(false);
    this.weaponLayer.clear().setVisible(false);
    this.muzzleFlash.clear().setVisible(false);

    if (def.source !== 'generated') {
      this.armsSprite.setVisible(false);
      this.weaponSprite.setVisible(false);
      this.muzzleSprite.setVisible(false);
      return;
    }

    // Generated player: use the authoritative Shooter Trigger Arena weapon
    // rig. The generated artwork remains the body; arms, weapon and muzzle
    // are not rendered from the extracted PNG layers, preventing duplicate
    // or floating weapon artwork.
    this.armsSprite.setVisible(false);
    this.weaponSprite.setVisible(false);
    this.muzzleSprite.setVisible(false);

    const angle = Math.atan2(this.aim.y, this.aim.x);
    this.arenaArms.setVisible(true);
    this.arenaWeapon.setVisible(true);
    this.arenaMuzzle.setVisible(this.muzzleUntil > 0);
    this.updateArenaReferenceWeaponPose();
  }

  private fireShot() {
    const def = this.currentDefinition();
    const origin = def.source === 'generated'
      ? new Phaser.Math.Vector2(
        this.character.x + this.aim.x * 42,
        this.character.y + this.aim.y * 42,
      )
      : new Phaser.Math.Vector2(
        this.character.x + this.aim.x * 42,
        this.character.y + (def.source === 'arena' ? 0 : 0),
      );
    const velocity = this.aim.clone().normalize().scale(this.projectileSpeed);
    const graphics = this.add.circle(origin.x, origin.y, 4, 0xf0dfb6, 1).setDepth(60);
    this.shots.push({
      graphics,
      position: origin.clone(),
      velocity,
      ageMs: 0,
    });
    this.fireCooldown = this.fireIntervalMs;
    this.muzzleUntil = 95;
    this.updateWeaponLayer();

    if (this.currentDefinition().source === 'robot') {
      const shootKey = this.spriteKey(this.currentDefinition(), this.direction, 'shoot');
      this.previewSprite.setTexture(shootKey, 0);
      this.previewSprite.setDisplaySize(this.currentDefinition().displaySize, this.currentDefinition().displaySize);
      this.previewSprite.setOrigin(0.5, this.currentDefinition().originY);
      this.previewSprite.play(shootKey, true);
    }
  }

  private updateShots(delta: number) {
    for (let index = this.shots.length - 1; index >= 0; index -= 1) {
      const shot = this.shots[index];
      const previous = shot.position.clone();
      shot.position.add(shot.velocity.clone().scale(delta / 1000));
      shot.graphics.setPosition(shot.position.x, shot.position.y);
      shot.ageMs += delta;

      const segment = new Phaser.Geom.Line(previous.x, previous.y, shot.position.x, shot.position.y);

      if (this.covers.some((cover) => Phaser.Geom.Intersects.LineToRectangle(segment, cover))) {
        this.showCombatMessage('COVER BLOCKED', '#e8c95c');
        this.removeShot(index);
        continue;
      }

      const head = new Phaser.Geom.Circle(this.target.x, this.target.y - 82, 12);
      const body = new Phaser.Geom.Circle(this.target.x, this.target.y - 45, 18);

      if (Phaser.Geom.Intersects.LineToCircle(segment, head)) {
        this.showCombatMessage('HEADSHOT · INSTANT', '#f0dfb6');
        this.targetBodyHits = 0;
        this.resetTargetSoon(520);
        this.removeShot(index);
        continue;
      }

      if (Phaser.Geom.Intersects.LineToCircle(segment, body)) {
        this.targetBodyHits += 1;
        const hits = this.targetBodyHits;
        this.showCombatMessage(hits >= 2 ? 'BODY HIT · ELIMINATED' : 'BODY HIT · ONE MORE', '#e06a3d');
        if (hits >= 2) this.resetTargetSoon(520);
        this.removeShot(index);
        continue;
      }

      if (shot.ageMs >= this.projectileLifetimeMs) {
        this.removeShot(index);
      }
    }
  }

  private resetTargetSoon(delay: number) {
    if (this.targetDown) return;
    this.targetDown = true;
    this.target.setAlpha(0.38);
    this.time.delayedCall(delay, () => {
      this.targetDown = false;
      this.targetBodyHits = 0;
      this.target.setAlpha(0.96);
    });
  }

  private updateTargetFacing() {
    if (!this.target || this.targetDown) return;
    const def = this.targetDefinition;
    const dx = this.character.x - this.target.x;
    const dy = this.character.y - this.target.y;
    let direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' = 'DOWN';
    if (Math.abs(dx) > Math.abs(dy)) direction = dx < 0 ? 'LEFT' : 'RIGHT';
    else direction = dy < 0 ? 'UP' : 'DOWN';
    const key = this.spriteKey(def, direction);
    if (this.targetSprite.texture.key !== key) {
      this.targetSprite.setTexture(key, 0);
      this.fitCharacterSprite(this.targetSprite, def);
      this.targetSprite.stop();
      this.targetSprite.setFrame(0);
    }
  }

  private updateAimFromWorldPointer(pointer: Phaser.Input.Pointer) {
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const aimOriginY = this.currentDefinition().source === 'arena' ? 0 : -40 * (this.previewSprite.scaleX || (this.targetVisibleCharacterHeight / 160));
    const dx = point.x - this.character.x;
    const dy = point.y - (this.character.y + aimOriginY);
    const length = Math.hypot(dx, dy);
    if (length > 2) this.aim.set(dx / length, dy / length);
  }

  private createCharacterSelector() {
    const width = this.scale.width;
    const y = 100;
    const compact = width < 520;
    const panelHeight = compact ? 88 : 76;

    this.add.rectangle(width / 2, y, Math.min(width - 18, 620), panelHeight, 0x101512, 0.92)
      .setScrollFactor(0).setDepth(100);

    this.characterNameLabel = this.add.text(width / 2, y - (compact ? 28 : 22), '', {
      fontFamily: 'monospace',
      fontSize: compact ? '9px' : '11px',
      fontStyle: 'bold',
      color: '#e8c95c',
      align: 'center',
      wordWrap: { width: Math.min(width - 120, 500) },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104);

    this.animationLabel = this.add.text(width / 2, y - (compact ? 12 : 5), 'ANIMATION · IDLE', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#8fb39b',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104);

    const makeButton = (x: number, label: string, deltaIndex: number) =>
      this.add.text(x, y + (compact ? 20 : 22), label, {
        fontFamily: 'monospace',
        fontSize: compact ? '9px' : '8px',
        fontStyle: 'bold',
        color: '#f4f1df',
        backgroundColor: '#315845',
        padding: { left: compact ? 14 : 10, right: compact ? 14 : 10, top: compact ? 8 : 5, bottom: compact ? 8 : 5 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(105)
        .setInteractive({ useHandCursor: false })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.preventDefault?.();
          this.fireHeld = false;
          this.pointerAimActive = false;
          this.targetDown = false;
          this.targetBodyHits = 0;
          this.clearShots();
          this.selectCharacter(this.selectedCharacterIndex + deltaIndex);
        });

    const sideOffset = compact ? Math.max(66, width * 0.22) : Math.min(210, width * 0.30);
    makeButton(width / 2 - sideOffset, '‹ PREV', -1);
    makeButton(width / 2 + sideOffset, 'NEXT ›', 1);

    this.add.text(width / 2, y + (compact ? 44 : 22), compact ? 'SWIPE/TOUCH TO COMPARE SPRITES' : 'OTHER SPRITES = VISUAL GAME TESTS · PLAYER = 1.JPG PIPELINE', {
      fontFamily: 'monospace',
      fontSize: compact ? '5px' : '6px',
      color: '#8fb39b',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);

    this.updateLabels();
  }

  private selectCharacter(index: number) {
    const count = this.characterDefinitions.length;
    this.selectedCharacterIndex = (index + count) % count;
    this.generatedAction = 'ready';
    this.generatedActionUntil = 0;
    this.fireHeld = false;
    this.pointerAimActive = false;
    this.clearShots();

    const def = this.currentDefinition();
    this.previewSprite.stop();

    const arenaReference = def.source === 'arena';
    this.shadow.setPosition(0, arenaReference ? 34 : 0);
    this.shadow.setSize(arenaReference ? 27 : 46, arenaReference ? 10 : 13);
    this.previewSprite.setVisible(!arenaReference);

    if (arenaReference) {
      this.arenaPoseA.setVisible(true).setScale(1, 1);
      this.arenaPoseB.setVisible(false).setScale(1, 1);
      this.arenaArms.setVisible(true);
      this.arenaWeapon.setVisible(true);
      this.arenaMuzzle.setVisible(false);
    } else {
      this.previewSprite.setTexture(this.spriteKey(def, 'DOWN'), 0);
      this.fitCharacterSprite(this.previewSprite, def);
      this.arenaPoseA.setVisible(false);
      this.arenaPoseB.setVisible(false);
      this.arenaArms.setVisible(false);
      this.arenaWeapon.setVisible(false);
      this.arenaMuzzle.setVisible(false);
    }
    this.previewSprite.setRotation(0);
    this.updateWeaponLayer();
    this.updateLabels();
  }

  private updateLabels() {
    const def = this.currentDefinition();
    this.characterNameLabel?.setText(def.id === 'arena_player' ? 'SHOOTERS TRIGGER PLAYER · GENERATED · AUTHORITATIVE' : def.name + ' · VISUAL TEST');
    const action = this.fireHeld ? 'FIRE' : this.pointerAimActive ? 'AIM' : 'READY';
    this.directionLabel?.setText(
      'FACING · ' + this.direction +
      ' · ' + action +
      ' · AIM VECTOR ' + Math.round(Phaser.Math.RadToDeg(Math.atan2(this.aim.y, this.aim.x))) + '°',
    );
    this.combatLabel?.setText(
      'TARGET · ' + (this.targetDown ? 'DOWN' : 'LIVE') +
      ' · BODY HITS ' + this.targetBodyHits + '/2 · HEADSHOT = INSTANT',
    );
  }

  public setMoveVector(x: number, y: number) {
    this.move.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
  }

  public setFireHeld(value: boolean) {
    this.fireHeld = value;
    if (!value) this.pointerAimActive = false;
  }

  public setAimVector(x: number, y: number) {
    const length = Math.hypot(x, y);
    if (length > 0.05) {
      this.aim.set(x / length, y / length);
      this.pointerAimActive = true;
      this.updateWeaponLayer();
      this.updateLabels();
    }
  }

  public isFireAvailable() {
    return true;
  }

  public isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  private clearShots() {
    this.shots.forEach((shot) => shot.graphics.destroy());
    this.shots = [];
  }

  private removeShot(index: number) {
    this.shots[index].graphics.destroy();
    this.shots.splice(index, 1);
  }

  private showCombatMessage(text: string, color: string) {
    const label = this.add.text(this.target.x, this.target.y - 116, text, {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color,
      stroke: '#151a16',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: label,
      y: label.y - 38,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private resetCharacter() {
    this.character.setPosition(this.playerSpawn.x, this.playerSpawn.y);
    const arenaReference = this.currentDefinition().source === 'arena';
    this.shadow.setPosition(0, arenaReference ? 34 : 0);
    this.shadow.setSize(arenaReference ? 27 : 46, arenaReference ? 10 : 13);
    this.move.set(0, 0);
    this.direction = 'DOWN';
    this.playerFacing = 1;
    this.visualMove.set(0, 1);
    this.aim.set(1, 0);
    this.generatedAction = 'ready';
    this.generatedActionUntil = 0;
    this.fireHeld = false;
    this.fireCooldown = 0;
    this.muzzleUntil = 0;
    this.pointerAimActive = false;
    this.pointerId = -1;
    this.clearShots();
    this.playCharacterAnimation(false);
    this.updateWeaponLayer();
  }

  private getArenaReferenceSpeed() {
    // Shooters Trigger Arena uses 170 + evasionSkill * 0.45 with a 50-point
    // fallback when no Training Camp profile exists. Use the same contract in
    // the reference lab so movement is not an approximation.
    try {
      const raw = JSON.parse(localStorage.getItem('shooters-trigger:training-report') || 'null');
      const score = Number(raw?.profile?.playerEvasionScore);
      const evasion = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50;
      return 170 + evasion * 0.45;
    } catch {
      return 170 + 50 * 0.45;
    }
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

    this.combatLabel = this.add.text(this.scale.width / 2, this.scale.height - 18, '', {
      fontFamily: 'monospace',
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#f4f1df',
      align: 'center',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(104);
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