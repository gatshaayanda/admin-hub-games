import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

type ActorRole = 'player' | 'operator' | 'heavy' | 'runner' | 'anchor';

type ActorParts = {
  shadow: Phaser.GameObjects.Ellipse;
  backpack: Phaser.GameObjects.Rectangle;
  leftLeg: Phaser.GameObjects.Rectangle;
  rightLeg: Phaser.GameObjects.Rectangle;
  leftBoot: Phaser.GameObjects.Rectangle;
  rightBoot: Phaser.GameObjects.Rectangle;
  torso: Phaser.GameObjects.Rectangle;
  vest: Phaser.GameObjects.Rectangle;
  belt: Phaser.GameObjects.Rectangle;
  leftArm: Phaser.GameObjects.Rectangle;
  rightArm: Phaser.GameObjects.Rectangle;
  leftShoulder: Phaser.GameObjects.Rectangle;
  rightShoulder: Phaser.GameObjects.Rectangle;
  helmet: Phaser.GameObjects.Arc;
  helmetBrim: Phaser.GameObjects.Rectangle;
  mask: Phaser.GameObjects.Rectangle;
  visor: Phaser.GameObjects.Rectangle;
  accent: Phaser.GameObjects.Rectangle;
  pouches: Phaser.GameObjects.Rectangle[];
  weapon: Phaser.GameObjects.Rectangle;
  weaponGrip: Phaser.GameObjects.Rectangle;
  muzzle: Phaser.GameObjects.Arc;
};

type Actor = {
  body: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  parts: ActorParts;
  team: 'green' | 'orange';
  role: ActorRole;
  hp: number;
  maxHp: number;
  speed: number;
  startX: number;
  startY: number;
  alive: boolean;
  cooldown: number;
  animTime: number;
  walkCycle: number;
  facingX: number;
  facingY: number;
  firePulse: number;
};

type Paintball = {
  body: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  owner: Actor;
  ttl: number;
};

export class ShootersTriggerTrainingScene extends Phaser.Scene {
  private player!: Actor;
  private teammates: Actor[] = [];
  private enemies: Actor[] = [];
  private paintballs: Paintball[] = [];
  private covers: Phaser.Geom.Rectangle[] = [];
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
  };

  private aim = { x: 1, y: 0 };
  private aimPoint?: { x: number; y: number };
  private moveInput = { x: 0, y: 0 };
  private fireHeld = false;
  private lastHitAt = 0;
  private teamScore = 0;
  private opponentScore = 0;

  private headerBg!: Phaser.GameObjects.Rectangle;
  private baseText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private radar!: Phaser.GameObjects.Graphics;
  private touchUi!: Phaser.GameObjects.Graphics;
  private respawnText?: Phaser.GameObjects.Text;
  private hitOverlay!: Phaser.GameObjects.Rectangle;
  private startedAt = 0;
  private worldWidth = 1600;
  private worldHeight = 900;
  private isPhoneLayout = false;
  private controlsCleanup?: () => void;

  private readonly start = { x: 400, y: 400 };

  constructor() {
    super('ShootersTriggerTrainingScene');
  }

  create() {
    this.configureWorld();
    this.playerName = String(this.registry.get('shootersTriggerPlayer') || 'Player');
    this.startedAt = this.time.now;

    this.drawArena();
    this.createActors();
    this.createUi();

    this.keys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      fire: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player.body, true, 0.12, 0.12);
    this.applyCamera();

    this.touchUi = this.add.graphics().setScrollFactor(0).setDepth(240);
    this.controlsCleanup = installShootersTriggerMobileControls();

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointercancel', this.handlePointerUp, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.off('pointercancel', this.handlePointerUp, this);
      this.controlsCleanup?.();
      this.controlsCleanup = undefined;
    });

    this.statusText = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '10px' }).setVisible(false);
    this.updateUi();
  }

  private playerName = 'Player';
  private statusText!: Phaser.GameObjects.Text;

  public isPhoneSession() {
    return this.isPhoneLayout;
  }

  public setMoveVector(x: number, y: number) {
    if (!this.isPhoneLayout) return;
    this.moveInput.x = Phaser.Math.Clamp(x, -1, 1);
    this.moveInput.y = Phaser.Math.Clamp(y, -1, 1);
  }

  public setFireHeld(held: boolean) {
    if (!this.isPhoneLayout) return;
    this.fireHeld = held;
  }

  private configureWorld() {
    this.isPhoneLayout = this.scale.height > this.scale.width * 1.05;
    this.worldWidth = this.isPhoneLayout ? 980 : 1600;
    this.worldHeight = this.isPhoneLayout ? 1850 : 900;
    this.start.x = this.isPhoneLayout ? this.worldWidth * 0.44 : this.worldWidth * 0.25;
    this.start.y = this.isPhoneLayout ? this.worldHeight * 0.24 : this.worldHeight * 0.50;
  }

  private handleResize(width: number, height: number) {
    const wasPhone = this.isPhoneLayout;
    const nextPhone = height > width * 1.05;
    if (wasPhone !== nextPhone) {
      this.scene.restart();
      return;
    }
    this.applyCamera();
    this.layoutUi(width, height);
  }

  private applyCamera() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setDeadzone(this.isPhoneLayout ? width * 0.12 : width * 0.24, this.isPhoneLayout ? height * 0.12 : height * 0.20);
    this.cameras.main.setZoom(this.isPhoneLayout ? 1.22 : 1);
  }

  private createActors() {
    this.player = this.makeActor(this.start.x, this.start.y, 'green', 'player', this.playerName, 100);

    this.teammates = [
      this.makeActor(this.start.x + 56, this.start.y - 70, 'green', 'operator', 'Operator 12', 120),
      this.makeActor(this.start.x + 62, this.start.y + 74, 'green', 'heavy', 'The Heavy', 140),
    ];

    this.enemies = [
      this.makeActor(this.worldWidth * (this.isPhoneLayout ? 0.72 : 0.82), this.worldHeight * (this.isPhoneLayout ? 0.62 : 0.42), 'orange', 'runner', 'Runner', 100),
      this.makeActor(this.worldWidth * (this.isPhoneLayout ? 0.66 : 0.78), this.worldHeight * (this.isPhoneLayout ? 0.76 : 0.58), 'orange', 'anchor', 'Anchor', 120),
    ];
  }

  private drawArena() {
    const g = this.add.graphics();
    const w = this.worldWidth;
    const h = this.worldHeight;

    // Hall's ground language: broad, quiet colour fields first; gameplay decoration sits on top.
    // Keep the grass readable at phone scale instead of filling it with noisy texture marks.
    g.fillStyle(0x78a653, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x86ad5e, 0.92).fillRect(0, 0, w * 0.50, h);
    g.fillStyle(0x679346, 0.78).fillRect(w * 0.50, 0, w * 0.50, h);

    g.fillStyle(0x5f8d43, 0.24).fillRect(w * 0.08, h * 0.10, w * 0.24, h * 0.72);
    g.fillStyle(0x9abd70, 0.16).fillRect(w * 0.66, h * 0.08, w * 0.23, h * 0.78);

    const left = this.isPhoneLayout ? 48 : 70;
    const right = w - left;
    g.lineStyle(3, 0xf4f1df, 0.68);
    g.lineBetween(left, 0, left, h);
    g.lineBetween(right, 0, right, h);

    for (const y of [70, h - 70]) {
      this.drawPost(g, left, y);
      this.drawPost(g, right, y);
    }

    // Team start area and the first readable training vignette.
    g.fillStyle(0x195e45, 0.24).fillRect(w * 0.31, h * 0.17, w * 0.20, h * 0.17);
    g.lineStyle(2, 0xd5efc9, 0.50).strokeRect(w * 0.31, h * 0.17, w * 0.20, h * 0.17);

    this.drawTree(w * 0.34, h * 0.15, this.isPhoneLayout ? 1.05 : 1.2);

    const platformX = w * 0.54;
    const platformY = h * 0.19;
    const platformW = this.isPhoneLayout ? w * 0.30 : w * 0.22;
    const platformH = this.isPhoneLayout ? h * 0.07 : h * 0.12;
    this.drawCover(platformX, platformY, platformW, platformH, 0x737b79, 0x414846);

    // Secondary field cover creates routes without turning the phone screen into a wall of obstacles.
    this.drawCover(w * 0.17, h * 0.43, w * 0.24, h * 0.042, 0x9d754d, 0x5a4633);
    this.drawCover(w * 0.58, h * 0.50, w * 0.28, h * 0.046, 0x6e8190, 0x4d5961);
    this.drawCover(w * 0.26, h * 0.67, w * 0.22, h * 0.042, 0xb58c58, 0x5b432f);
    this.drawCover(w * 0.60, h * 0.78, w * 0.24, h * 0.045, 0x6e8190, 0x4d5961);

    const cylinders = [
      [w * 0.78, h * 0.36],
      [w * 0.22, h * 0.56],
      [w * 0.82, h * 0.64],
    ];

    for (const [x, y] of cylinders) this.drawCylinder(x, y);

    // Small white field markers/collectibles make the arena legible without becoming an inventory system.
    for (const [x, y] of [
      [w * 0.76, h * 0.23],
      [w * 0.72, h * 0.39],
      [w * 0.84, h * 0.53],
      [w * 0.72, h * 0.70],
    ]) {
      const marker = this.add.circle(x, y, 4, 0xf4f1df, 0.9).setDepth(5);
      this.tweens.add({ targets: marker, alpha: 0.35, scale: 1.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Opponent base / training end point.
    g.fillStyle(0xa34f2d, 0.17).fillRect(w * 0.72, h * 0.72, w * 0.18, h * 0.16);
    g.lineStyle(2, 0xffceb5, 0.44).strokeRect(w * 0.72, h * 0.72, w * 0.18, h * 0.16);
  }

  private drawPost(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x6f604f, 1).fillRect(x - 3, y, 6, 23);
    g.fillStyle(0xf4f1df, 1).fillRect(x - 5, y - 9, 10, 12);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x6d4d32, 1).fillRect(x - 5 * scale, y + 17 * scale, 10 * scale, 38 * scale);
    g.fillStyle(0x2d5d35, 1).fillCircle(x, y, 28 * scale);
    g.fillStyle(0x477a3a, 1).fillCircle(x - 20 * scale, y + 8 * scale, 22 * scale);
    g.fillStyle(0x5b8c46, 1).fillCircle(x + 21 * scale, y + 8 * scale, 23 * scale);
  }

  private drawCover(x: number, y: number, width: number, height: number, color: number, shadow: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 1).fillRect(x, y, width, height);
    g.fillStyle(shadow, 0.58).fillRect(x, y + height - 7, width, 7);
    g.lineStyle(2, 0xf4f1df, 0.35).strokeRect(x, y, width, height);
    this.covers.push(new Phaser.Geom.Rectangle(x, y, width, height));
  }

  private drawCylinder(x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(0x765638, 1).fillEllipse(x, y, 34, 24);
    g.fillStyle(0xb48a55, 1).fillEllipse(x, y - 10, 34, 24);
    g.lineStyle(2, 0x4d3b2b, 0.75).strokeEllipse(x, y - 10, 34, 24);
    this.covers.push(new Phaser.Geom.Rectangle(x - 17, y - 20, 34, 30));
  }

  private createUi() {
    this.headerBg = this.add.rectangle(0, 0, this.scale.width, this.isPhoneLayout ? 60 : 58, 0x18231d, 0.94)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(180);

    this.baseText = this.add.text(16, 13, 'GREEN BASE', {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '11px' : '13px',
      fontStyle: 'bold',
      color: '#9fd37d',
      letterSpacing: 1.1,
    }).setScrollFactor(0).setDepth(181);

    this.instructionText = this.add.text(this.scale.width * 0.52, 13, 'TEAM TRAINING · MOVE WITH YOUR TEAM', {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '8px' : '10px',
      fontStyle: 'bold',
      color: '#f4f1df',
      letterSpacing: 0.5,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(181);

    this.scoreText = this.add.text(16, this.isPhoneLayout ? 34 : 37, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#cbd9c4',
    }).setScrollFactor(0).setDepth(181);

    this.radar = this.add.graphics().setScrollFactor(0).setDepth(182);
    this.hitOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xd8473e, 0)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(190);

    this.layoutUi(this.scale.width, this.scale.height);
  }

  private layoutUi(width: number, height: number) {
    const compact = width < 520 || height > width;
    const headerHeight = this.isPhoneLayout ? 60 : 58;
    this.headerBg.setSize(width, headerHeight);
    this.instructionText.setPosition(width * (compact ? 0.56 : 0.50), 13);
    this.scoreText.setText(`GREEN ${this.teamScore} · ORANGE ${this.opponentScore}`);

    this.hitOverlay.setSize(width, height);
    this.renderRadar();
  }

  private renderRadar() {
    if (!this.radar || !this.player) return;
    const width = this.scale.width;
    const radius = this.isPhoneLayout ? 24 : 28;
    const cx = width - radius - 14;
    const cy = 30;

    this.radar.clear();
    this.radar.fillStyle(0x0e1914, 0.78).fillCircle(cx, cy, radius);
    this.radar.lineStyle(2, 0x88a96e, 0.72).strokeCircle(cx, cy, radius);
    this.radar.lineStyle(1, 0x557356, 0.45);
    this.radar.lineBetween(cx - radius + 5, cy, cx + radius - 5, cy);
    this.radar.lineBetween(cx, cy - radius + 5, cx, cy + radius - 5);

    const plot = (actor: Actor, color: number) => {
      const dx = actor.body.x - this.player.body.x;
      const dy = actor.body.y - this.player.body.y;
      const scale = radius / 210;
      const px = Phaser.Math.Clamp(dx * scale, -radius + 5, radius - 5);
      const py = Phaser.Math.Clamp(dy * scale, -radius + 5, radius - 5);
      this.radar.fillStyle(color, actor.alive ? 1 : 0.22).fillCircle(cx + px, cy + py, actor === this.player ? 3 : 2.5);
    };

    plot(this.player, 0xe8c95c);
    this.teammates.forEach((actor) => plot(actor, 0x68c984));
    this.enemies.forEach((actor) => plot(actor, 0xe58a52));
    this.radar.lineStyle(1, 0xe8c95c, 0.38).strokeCircle(cx, cy, 5);
  }

  private makeActor(x: number, y: number, team: Actor['team'], role: ActorRole, name: string, hp: number): Actor {
    const size = this.actorSize(role);
    const body = this.add.container(x, y).setDepth(30);
    const parts = this.drawCharacter(body, team, role, size);

    const label = this.add.text(x, y - size * 1.30, name, {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '9px' : '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#0f1d16',
      padding: { left: 5, right: 5, top: 3, bottom: 3 },
    }).setOrigin(0.5, 1).setDepth(80);

    return {
      body,
      label,
      parts,
      team,
      role,
      hp,
      maxHp: hp,
      speed:
        role === 'heavy' ? 78 :
        role === 'operator' ? 118 :
        role === 'runner' ? 108 :
        role === 'anchor' ? 84 : 128,
      startX: x,
      startY: y,
      alive: true,
      cooldown: 0,
      animTime: 0,
      walkCycle: Math.random() * Math.PI * 2,
      facingX: 0,
      facingY: -1,
      firePulse: 0,
    };
  }

  private drawCharacter(container: Phaser.GameObjects.Container, team: Actor['team'], role: ActorRole, size: number): ActorParts {
    const green = team === 'green';
    const teamMain = green ? 0x287a50 : 0xb65332;
    const teamLight = green ? 0x6fca82 : 0xe78958;
    const teamDark = green ? 0x174b35 : 0x54271f;
    const fabric = green ? 0x315845 : 0x713c2e;
    const fabricLight = green ? 0x456d57 : 0x87503e;
    const helmetColor = 0x27322f;
    const helmetHighlight = 0x3e4c46;
    const visorColor = 0x9bc8bf;
    const skin = 0xb97e55;
    const boot = 0x171d1b;
    const weaponColor = 0x222925;
    const isHeavy = role === 'heavy';
    const isAnchor = role === 'anchor';
    const isRunner = role === 'runner';
    const isOperator = role === 'operator';
    const roleScale =
      isHeavy ? 1.16 :
      isAnchor ? 1.09 :
      isRunner ? 0.88 :
      isOperator ? 0.95 : 1;
    const shoulderScale = isHeavy ? 1.16 : isAnchor ? 1.08 : isRunner ? 0.90 : 1;
    const packScale = isHeavy ? 1.12 : isAnchor ? 1.02 : isRunner ? 0.72 : isOperator ? 0.88 : 0.96;
    const limbWidth = size * (isHeavy || isAnchor ? 0.19 : isRunner ? 0.145 : 0.16);

    // The feet are the character's ground anchor. Everything else reads as equipment
    // carried by a person, not as a single rotating "spaceship" silhouette.
    const shadow = this.add.ellipse(0, size * 0.55, size * 1.42 * roleScale, size * 0.42, 0x102018, 0.30).setOrigin(0.5);
    const backpack = this.add.rectangle(0, size * 0.12, size * 0.72 * packScale, size * (isHeavy || isAnchor ? 0.48 : isRunner ? 0.30 : 0.36), teamDark, 1).setOrigin(0.5);
    const packTop = this.add.rectangle(0, -size * 0.02, size * 0.48 * packScale, size * 0.18, fabricLight, 0.92).setOrigin(0.5);

    const leftLeg = this.add.rectangle(-size * 0.19, size * 0.27, limbWidth, size * 0.38, fabric, 1).setOrigin(0.5);
    const rightLeg = this.add.rectangle(size * 0.19, size * 0.27, limbWidth, size * 0.38, fabric, 1).setOrigin(0.5);
    const leftBoot = this.add.rectangle(-size * 0.19, size * 0.49, size * 0.25, size * 0.13, boot, 1).setOrigin(0.5);
    const rightBoot = this.add.rectangle(size * 0.19, size * 0.49, size * 0.25, size * 0.13, boot, 1).setOrigin(0.5);

    const torso = this.add.rectangle(0, 0, size * 0.78 * roleScale, size * (isHeavy ? 0.47 : isRunner ? 0.40 : 0.44), teamDark, 1).setOrigin(0.5);
    const vest = this.add.rectangle(0, -size * 0.01, size * 0.64 * roleScale, size * (isHeavy ? 0.35 : isRunner ? 0.29 : 0.32), teamMain, 1).setOrigin(0.5);
    const belt = this.add.rectangle(0, size * 0.16, size * 0.66 * roleScale, size * 0.075, 0x1b2924, 1).setOrigin(0.5);

    const leftShoulder = this.add.rectangle(-size * 0.39 * shoulderScale, -size * 0.11, size * 0.19 * shoulderScale, size * 0.18, fabricLight, 1).setOrigin(0.5);
    const rightShoulder = this.add.rectangle(size * 0.39 * shoulderScale, -size * 0.11, size * 0.19 * shoulderScale, size * 0.18, fabricLight, 1).setOrigin(0.5);

    // A normal paintball-ready carry: both hands are forward on the marker.
    // The marker begins at the chest, crosses the forearms, and extends ahead of the mask.
    const leftArm = this.add.rectangle(-size * 0.27, -size * 0.18, limbWidth * 0.78, size * 0.34, skin, 1)
      .setOrigin(0.5).setRotation(-0.58);
    const rightArm = this.add.rectangle(size * 0.27, -size * 0.18, limbWidth * 0.78, size * 0.34, skin, 1)
      .setOrigin(0.5).setRotation(0.58);

    const weapon = this.add.rectangle(0, -size * 0.48, size * (isHeavy ? 0.14 : isRunner ? 0.12 : 0.13), size * (isRunner ? 0.48 : 0.54), weaponColor, 1).setOrigin(0.5);
    const weaponGrip = this.add.rectangle(0, -size * 0.24, size * 0.18, size * 0.13, 0x111715, 1).setOrigin(0.5);
    const muzzle = this.add.circle(0, -size * 0.77, size * 0.075, 0xe8c95c, 1).setVisible(false);

    const helmet = this.add.circle(0, -size * 0.43, size * 0.29, helmetColor, 1);
    const helmetBrim = this.add.rectangle(0, -size * 0.32, size * 0.50, size * 0.08, helmetHighlight, 1).setOrigin(0.5);
    const maskRect = this.add.rectangle(0, -size * 0.37, size * 0.63, size * 0.18, 0x17211e, 1).setOrigin(0.5);
    const visor = this.add.rectangle(0, -size * 0.395, size * (isRunner ? 0.36 : 0.42), size * 0.055, visorColor, 0.82).setOrigin(0.5);

    const accent = this.add.rectangle(0, -size * 0.035, size * 0.10, size * 0.28, teamLight, 0.94).setOrigin(0.5);
    const pouches = [
      this.add.rectangle(-size * 0.22, size * 0.10, size * 0.13, size * 0.13, teamDark, 1).setOrigin(0.5),
      this.add.rectangle(size * 0.22, size * 0.10, size * 0.13, size * 0.13, teamDark, 1).setOrigin(0.5),
      this.add.rectangle(0, size * 0.11, size * 0.13, size * 0.13, teamLight, 0.82).setOrigin(0.5),
    ];

    container.add([
      shadow, backpack, packTop, leftLeg, rightLeg, leftBoot, rightBoot,
      torso, vest, belt, leftArm, rightArm, leftShoulder, rightShoulder,
      helmet, helmetBrim, maskRect, visor, accent, ...pouches,
      weapon, weaponGrip, muzzle,
    ]);

    return {
      shadow, backpack, leftLeg, rightLeg, leftBoot, rightBoot, torso, vest, belt,
      leftArm, rightArm, leftShoulder, rightShoulder, helmet, helmetBrim,
      mask: maskRect, visor, accent, pouches, weapon, weaponGrip, muzzle,
    };
  }

  private actorSize(role?: ActorRole) {
    const base = Phaser.Math.Clamp(
      Math.min(this.scale.width, this.scale.height) * (this.isPhoneLayout ? 0.105 : 0.055),
      30,
      46,
    );
    return role === 'heavy' || role === 'anchor' ? base * 1.18 : role === 'operator' || role === 'runner' ? base * 0.92 : base;
  }

  private updatePlayer(delta: number) {
    let moveX = 0;
    let moveY = 0;

    if (this.isPhoneLayout) {
      moveX = this.moveInput.x;
      moveY = this.moveInput.y;
    } else {
      moveX = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
      moveY = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);
    }

    const length = Math.hypot(moveX, moveY);
    if (length > 0.05) {
      this.moveActor(
        this.player,
        (moveX / Math.max(1, length)) * this.player.speed * delta / 1000,
        (moveY / Math.max(1, length)) * this.player.speed * delta / 1000,
      );
    }

    if (!this.isPhoneLayout) {
      const pointer = this.input.activePointer;
      if (pointer.isDown && pointer.x > this.scale.width * 0.42) {
        const aimPoint = this.cameraWorldPoint(pointer.x, pointer.y);
        this.setAimFromPoint(aimPoint.x, aimPoint.y);
        if (this.player.cooldown <= 0) this.fire(this.player, this.aim.x, this.aim.y);
      }
    }

    this.player.cooldown -= delta;

    if (this.isPhoneLayout && this.fireHeld && this.player.cooldown <= 0) {
      this.fire(this.player, this.aim.x, this.aim.y);
    }

    const moving = length > 0.05;
    this.animateActor(this.player, delta, moving);

    if (moving) {
      this.faceActor(this.player, moveX, moveY);
    }
  }

  private updateTeammates(delta: number) {
    this.teammates.forEach((mate, index) => {
      if (!mate.alive) return;

      mate.cooldown -= delta;
      const followDistance = this.isPhoneLayout ? 64 : 96;
      const targetX = this.player.body.x - 66;
      const targetY = this.player.body.y + (index === 0 ? -followDistance : followDistance);
      const dx = targetX - mate.body.x;
      const dy = targetY - mate.body.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (distance > 30) {
        this.moveActor(mate, dx / distance * mate.speed * 0.60 * delta / 1000, dy / distance * mate.speed * 0.60 * delta / 1000);
        this.faceActor(mate, dx, dy);
      }

      this.animateActor(mate, delta, distance > 30);

      const enemy = this.nearestEnemy(mate);
      if (enemy && mate.cooldown <= 0) {
        this.faceActor(mate, enemy.body.x - mate.body.x, enemy.body.y - mate.body.y);
        if (this.fire(mate, enemy.body.x - mate.body.x, enemy.body.y - mate.body.y)) {
          mate.cooldown = mate.role === 'operator' ? 760 : 1120;
        }
      }
    });
  }

  private updateEnemies(delta: number) {
    this.enemies.forEach((enemy, index) => {
      if (!enemy.alive) return;

      enemy.cooldown -= delta;
      const target = this.nearestGreen(enemy);
      if (!target) return;

      const dx = target.body.x - enemy.body.x;
      const dy = target.body.y - enemy.body.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (enemy.role === 'runner') {
        this.moveActor(enemy, dx / distance * enemy.speed * 0.24 * delta / 1000, dy / distance * enemy.speed * 0.24 * delta / 1000);
        this.faceActor(enemy, dx, dy);
        this.animateActor(enemy, delta, true);
      } else {
        this.faceActor(enemy, dx, dy);
        this.animateActor(enemy, delta, false);
      }

      const range = this.isPhoneLayout ? 640 : 760;
      if (distance < range && enemy.cooldown <= 0) {
        if (this.fire(enemy, dx, dy)) {
          enemy.cooldown = enemy.role === 'anchor' ? 1320 : 960;
        }
      }

      // The Anchor holds space instead of relentlessly chasing. The Runner advances and pressures lanes.
      if (index === 1 && distance > 300 && this.time.now % 1400 < 20) {
        this.moveActor(enemy, dx / distance * enemy.speed * 0.10 * delta / 1000, dy / distance * enemy.speed * 0.10 * delta / 1000);
      }
    });
  }

  private updatePaintballs(delta: number) {
    for (let i = this.paintballs.length - 1; i >= 0; i -= 1) {
      const ball = this.paintballs[i];
      ball.ttl -= delta;
      ball.body.x += ball.vx * delta / 1000;
      ball.body.y += ball.vy * delta / 1000;

      if (
        ball.ttl <= 0 ||
        ball.body.x < 0 || ball.body.x > this.worldWidth ||
        ball.body.y < 0 || ball.body.y > this.worldHeight ||
        this.hitCover(ball.body.x, ball.body.y)
      ) {
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        continue;
      }

      const targets = ball.owner.team === 'green' ? this.enemies : [this.player, ...this.teammates];
      const radius = this.actorSize(ball.owner.role) * 0.68;
      const target = targets.find((actor) =>
        actor.alive && Phaser.Math.Distance.Between(ball.body.x, ball.body.y, actor.body.x, actor.body.y) < radius
      );

      if (target) {
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        this.hitActor(target, ball.owner);
      }
    }
  }

  private hitCover(x: number, y: number, padding = 3) {
    return this.covers.some((cover) =>
      x >= cover.x - padding &&
      x <= cover.x + cover.width + padding &&
      y >= cover.y - padding &&
      y <= cover.y + cover.height + padding
    );
  }

  private hitActor(target: Actor, shooter: Actor) {
    target.hp -= 50;
    this.lastHitAt = this.time.now;

    this.tweens.add({
      targets: target.body,
      alpha: 0.35,
      duration: 70,
      yoyo: true,
      repeat: 2,
    });

    this.spawnPaintBurst(target.body.x, target.body.y, shooter.team === 'green' ? 0x79d89a : 0xe78b58);

    if (target === this.player) {
      this.hitOverlay.setAlpha(0.24);
      this.tweens.add({ targets: this.hitOverlay, alpha: 0, duration: 220 });
      this.cameras.main.shake(110, 0.0035);
      this.statusText.setText(target.hp > 0 ? 'PAINT HIT · BREAK LINE' : 'PAINT HIT · RESETTING');
    }

    if (target.hp > 0) {
      if (target !== this.player) {
        target.label.setText(target.label.text.replace(/ HIT$/, '') + ' HIT');
      }
      return;
    }

    if (target === this.player) {
      this.opponentScore += 1;
      this.respawnPlayer();
    } else {
      if (target.team === 'orange') this.teamScore += 1;
      this.respawnActor(target, target.startX, target.startY, 700);
    }

    if (this.teamScore >= 5 || this.opponentScore >= 5) {
      this.finish(this.teamScore >= 5 ? 'GREEN TEAM' : 'ORANGE TEAM');
      return;
    }

    this.statusText.setText(shooter.label.text + ' TAGGED ' + target.label.text);
  }

  private respawnPlayer() {
    this.player.alive = false;
    this.player.body.setVisible(false);
    this.player.label.setVisible(false);
    this.setMoveVector(0, 0);
    this.setFireHeld(false);

    this.respawnText?.destroy();
    this.respawnText = this.add.text(this.scale.width / 2, this.scale.height * 0.50, 'HIT · RESETTING TO GREEN BASE', {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '14px' : '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#9d3e2b',
      padding: { left: 14, right: 14, top: 10, bottom: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(260);

    this.time.delayedCall(this.isPhoneLayout ? 650 : 850, () => {
      if (this.teamScore >= 5 || this.opponentScore >= 5) return;

      this.player.body.setPosition(this.start.x, this.start.y);
      this.player.label.setPosition(this.start.x, this.start.y - this.actorSize('player') * 1.30);
      this.player.hp = this.player.maxHp;
      this.player.alive = true;
      this.player.body.setVisible(true);
      this.cameras.main.startFollow(this.player.body, true, 0.14, 0.14);
      this.respawnText?.destroy();
      this.respawnText = undefined;
      this.statusText.setText('BACK IN · TAKE A NEW ROUTE');
    });
  }

  private respawnActor(actor: Actor, x: number, y: number, delay: number) {
    actor.alive = false;
    actor.body.setVisible(false);
    actor.label.setVisible(false);

    this.time.delayedCall(delay, () => {
      actor.hp = actor.maxHp;
      actor.alive = true;
      actor.body.setPosition(x, y);
      actor.label.setPosition(x, y - this.actorSize(actor.role) * 1.30);
      actor.body.setVisible(true);
    });
  }

  private fire(owner: Actor, dx: number, dy: number) {
    if (owner.cooldown > 0) return false;

    const len = Math.hypot(dx, dy) || 1;
    const size = this.actorSize(owner.role);
    const color = owner.team === 'green' ? 0xe6f5d9 : 0xffbd86;

    const ball = this.add.circle(
      owner.body.x + (dx / len) * size * 0.85,
      owner.body.y + (dy / len) * size * 0.85,
      this.isPhoneLayout ? 4.5 : 5,
      color,
      1,
    ).setDepth(50);

    this.paintballs.push({
      body: ball,
      vx: (dx / len) * (this.isPhoneLayout ? 470 : 530),
      vy: (dy / len) * (this.isPhoneLayout ? 470 : 530),
      owner,
      ttl: 1250,
    });

    owner.cooldown = 300;
    owner.firePulse = 1;

    owner.parts.weapon.y += 4;
    owner.parts.muzzle.setVisible(true).setAlpha(1);
    this.tweens.add({
      targets: owner.parts.weapon,
      y: owner.parts.weapon.y - 4,
      duration: 85,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: owner.parts.muzzle,
      alpha: 0,
      duration: 90,
      onComplete: () => owner.parts.muzzle.setVisible(false),
    });

    return true;
  }

  private updateActorPresentation(actor: Actor, delta: number, moving: boolean) {
    if (!actor.alive) return;

    actor.animTime += delta;
    const heavy = actor.role === 'heavy' || actor.role === 'anchor';
    const size = this.actorSize(actor.role);
    const strideSpeed = moving ? (heavy ? 0.0105 : 0.0145) : 0.0042;
    actor.walkCycle += delta * strideSpeed;

    const stride = moving ? Math.sin(actor.walkCycle) : Math.sin(actor.walkCycle) * 0.08;
    const gait = heavy ? 0.68 : actor.role === 'runner' ? 1.10 : 1;

    // Real walking read: alternating leg placement and boot travel, with the torso
    // staying planted. No whole-body bob, pitch or "swimming" motion.
    actor.parts.leftLeg.y = size * 0.27 + stride * size * 0.075 * gait;
    actor.parts.rightLeg.y = size * 0.27 - stride * size * 0.075 * gait;
    actor.parts.leftBoot.y = size * 0.49 + stride * size * 0.11 * gait;
    actor.parts.rightBoot.y = size * 0.49 - stride * size * 0.11 * gait;
    actor.parts.leftBoot.x = -size * 0.19 + stride * size * 0.035 * gait;
    actor.parts.rightBoot.x = size * 0.19 - stride * size * 0.035 * gait;

    // Hands stay on the marker while moving. Shoulders and elbows absorb only
    // a small amount of stride so the weapon remains readable and steady.
    actor.parts.leftArm.rotation = -0.58 - stride * 0.045 * gait;
    actor.parts.rightArm.rotation = 0.58 + stride * 0.045 * gait;
    actor.parts.leftShoulder.rotation = -stride * 0.035;
    actor.parts.rightShoulder.rotation = stride * 0.035;

    const breath = moving
      ? Math.sin(actor.animTime * 0.006) * 0.004
      : Math.sin(actor.animTime * 0.0032) * 0.009;
    actor.parts.torso.scaleY = 1 + breath;
    actor.parts.vest.scaleY = 1 + breath;
    actor.parts.helmet.scaleY = 1 + breath * 0.55;
    actor.parts.backpack.y = size * 0.12 + breath * size * 0.35;

    actor.firePulse = Math.max(0, actor.firePulse - delta / 120);
    if (actor.firePulse <= 0 && actor.parts.muzzle.visible) actor.parts.muzzle.setVisible(false);

    actor.label.setPosition(actor.body.x, actor.body.y - size * 1.30);
  }

  private animateActor(actor: Actor, delta: number, moving: boolean) {
    this.updateActorPresentation(actor, delta, moving);
  }

  private moveActor(actor: Actor, dx: number, dy: number) {
    const margin = this.actorSize(actor.role) * 0.66;
    const nextX = Phaser.Math.Clamp(actor.body.x + dx, 58 + margin, this.worldWidth - 58 - margin);
    const nextY = Phaser.Math.Clamp(actor.body.y + dy, 18 + margin, this.worldHeight - 18 - margin);

    if (!this.hitCover(nextX, nextY, margin)) {
      actor.body.setPosition(nextX, nextY);
      actor.label.setPosition(nextX, nextY - this.actorSize(actor.role) * 1.30);
    }
  }

  private faceActor(actor: Actor, dx: number, dy: number) {
    const len = Math.hypot(dx, dy) || 1;
    actor.facingX = dx / len;
    actor.facingY = dy / len;

    // Character art is authored facing north. Rotate the complete figure toward
    // the aim/movement vector, but keep the weapon mounted to the chest rather
    // than the helmet.
    actor.body.rotation = Math.atan2(actor.facingY, actor.facingX) + Math.PI / 2;
  }

  private setAimFromPoint(x: number, y: number) {
    const dx = x - this.player.body.x;
    const dy = y - this.player.body.y;
    const len = Math.hypot(dx, dy) || 1;
    this.aim.x = dx / len;
    this.aim.y = dy / len;
    this.aimPoint = { x, y };
    this.faceActor(this.player, dx, dy);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.isPhoneLayout) {
      if (pointer.x > this.scale.width * 0.42) {
        const point = this.cameraWorldPoint(pointer.x, pointer.y);
        this.setAimFromPoint(point.x, point.y);
        this.fire(this.player, this.aim.x, this.aim.y);
      }
      return;
    }

    // The HTML movement/fire controls live above the canvas. Any canvas touch
    // in the playable area is therefore an aim tap only.
    if (pointer.y < this.scale.height - 132) {
      const point = this.cameraWorldPoint(pointer.x, pointer.y);
      this.setAimFromPoint(point.x, point.y);
    }
  }

  private handlePointerUp(_pointer: Phaser.Input.Pointer) {
    // Touch buttons release themselves in the DOM control layer.
  }

  private cameraWorldPoint(x: number, y: number) {
    return this.cameras.main.getWorldPoint(x, y);
  }

  private updateAimMarker() {
    this.touchUi.clear();
    if (!this.aimPoint) return;

    const camera = this.cameras.main;
    const screenX = (this.aimPoint.x - camera.scrollX) * camera.zoom;
    const screenY = (this.aimPoint.y - camera.scrollY) * camera.zoom;

    this.touchUi.lineStyle(2, 0xe8c95c, 0.82);
    this.touchUi.strokeCircle(screenX, screenY, 12);
    this.touchUi.lineBetween(screenX - 9, screenY, screenX + 9, screenY);
    this.touchUi.lineBetween(screenX, screenY - 9, screenX, screenY + 9);
    this.touchUi.fillStyle(0xe8c95c, 0.85);
    this.touchUi.fillCircle(screenX, screenY, 2.5);
  }

  private spawnPaintBurst(x: number, y: number, color: number) {
    for (let i = 0; i < 7; i += 1) {
      const angle = (Math.PI * 2 * i) / 7;
      const distance = 8 + i * 1.5;
      const dot = this.add.circle(x, y, i % 2 === 0 ? 2.4 : 1.6, color, 0.95).setDepth(55);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 180 + i * 12,
        onComplete: () => dot.destroy(),
      });
    }
  }

  public update(_time: number, delta: number) {
    if (!this.player?.alive) return;

    this.updatePlayer(delta);
    this.updateTeammates(delta);
    this.updateEnemies(delta);
    this.updatePaintballs(delta);
    this.updateAimMarker();
    this.renderRadar();
    this.updateUi();

    if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
      this.fire(this.player, this.aim.x, this.aim.y);
    }

    if (this.time.now - this.startedAt > 300000) {
      this.finish('TIME');
    }
  }

  private updateUi() {
    if (!this.player) return;
    this.scoreText?.setText(`GREEN ${this.teamScore} · ORANGE ${this.opponentScore}`);
    this.layoutUi(this.scale.width, this.scale.height);
  }

  private finish(winner: string) {
    this.statusText?.setVisible(true).setText('TRAINING RESULT · ' + winner + ' WINS');
    const banner = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, Math.min(this.scale.width * 0.84, 520), 150, 0x102018, 0.96)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(3, 0xe8c95c, 0.8);
    const title = this.add.text(banner.x, banner.y - 30, 'TRAINING COMPLETE', {
      fontFamily: 'monospace', fontSize: this.isPhoneLayout ? '15px' : '19px',
      fontStyle: 'bold', color: '#f4f1df',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    const hint = this.add.text(banner.x, banner.y + 18, 'TAP TO PLAY AGAIN', {
      fontFamily: 'monospace', fontSize: this.isPhoneLayout ? '9px' : '10px',
      color: '#e8c95c',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    this.scene.pause();
    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
    this.input.keyboard?.once('keydown', () => {
      this.scene.restart();
    });
  }

  private nearestEnemy(actor: Actor) {
    return this.enemies
      .filter((item) => item.alive)
      .sort((a, b) =>
        Phaser.Math.Distance.Between(actor.body.x, actor.body.y, a.body.x, a.body.y) -
        Phaser.Math.Distance.Between(actor.body.x, actor.body.y, b.body.x, b.body.y)
      )[0];
  }

  private nearestGreen(actor: Actor) {
    return [this.player, ...this.teammates]
      .filter((item) => item.alive)
      .sort((a, b) =>
        Phaser.Math.Distance.Between(actor.body.x, actor.body.y, a.body.x, a.body.y) -
        Phaser.Math.Distance.Between(actor.body.x, actor.body.y, b.body.x, b.body.y)
      )[0];
  }
}
