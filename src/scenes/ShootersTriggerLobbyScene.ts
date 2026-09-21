import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';
import { loadShootersProgress, resetShootersProgress } from '../shooters-trigger-state';
import { addFieldGuide } from '../shooters-trigger-guidance';

type Location = {
  key: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  color: number;
  scene: string;
};

const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 1400;

export class ShootersTriggerLobbyScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();
  private player!: Phaser.GameObjects.Container;
  private target: Phaser.Math.Vector2 | null = null;
  private moving = false;
  private speed = 185;
  private controlsCleanup?: () => void;
  private locations: Location[] = [];
  private prompt?: Phaser.GameObjects.Container;
  private activeLocation?: Location;
  private playerName = 'Player';
  private progress = loadShootersProgress();\n  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;\n  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super('ShootersTriggerLobbyScene');
  }

  create() {
    const p = loadShootersProgress(String(this.registry.get('shootersTriggerPlayer') || 'Player'));
    this.progress = p;
    this.playerName = p.playerName;

    this.cameras.main.setBackgroundColor('#6f984b');
    this.drawWorld();

    this.player = this.createPlayer(1100, 1110);
    this.player.setDepth(30);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.10, 0.10);
    this.cameras.main.setDeadzone(
      Math.min(this.scale.width * 0.28, 300),
      Math.min(this.scale.height * 0.22, 145),
    );

    this.cursors = this.input.keyboard!.createCursorKeys();\n    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;\n    this.createHud();
    this.controlsCleanup = installShootersTriggerMobileControls('ShootersTriggerLobbyScene', false);
    addFieldGuide(this, 'SHOOTERS TRIGGER · FIELD GUIDE', [
      'This is the Home Field. Walk around it instead of selecting a flat menu.',
      'Shooting Location teaches aim and hit quality. Evasion Camp teaches movement, cover and survival.',
      'Media Coverage Center is the preparation desk: read your results, write your thought and buy upgrades.',
      'Arena Location is the competitive field: 3v3, first team to 3 kills. After the match, the report returns you to the preparation loop.',
      'Walk up to a location and press ENTER LOCATION. The same player and world-state continue through every scene.',
    ]);

    this.locations = [
      { key: 'shooting', title: 'SHOOTING LOCATION', subtitle: 'AIM · HIT QUALITY · REWARD', x: 560, y: 500, color: 0xd66a3d, scene: 'ShootersTriggerTrainingScene' },
      { key: 'evasion', title: 'EVASION CAMP', subtitle: 'MOVE · COVER · SURVIVE', x: 1640, y: 500, color: 0x4f7fa0, scene: 'ShootersTriggerEvasionScene' },
      { key: 'media', title: 'MEDIA COVERAGE CENTER', subtitle: 'STATS · THOUGHTS · EQUIPMENT', x: 560, y: 920, color: 0xe8c95c, scene: 'ShootersTriggerMediaScene' },
      { key: 'arena', title: 'ARENA LOCATION', subtitle: '3v3 · FIRST TO 3 KILLS', x: 1640, y: 920, color: 0xa95c62, scene: 'ShootersTriggerArenaScene' },
    ];

    for (const location of this.locations) this.drawLocation(location);

    this.input.on('pointerdown', this.handleWorldTap, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutViewport, this);
    this.layoutViewport();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controlsCleanup?.();
      this.controlsCleanup = undefined;
      this.input.off('pointerdown', this.handleWorldTap, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutViewport, this);
      this.prompt?.destroy();
      this.prompt = undefined;
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  setMoveVector(x: number, y: number) {
    this.joystickVector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
  }

  setFireHeld(_held: boolean) {}
  setAimVector(_x: number, _y: number) {}
  isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  update(_time: number, delta: number) {
    if (!this.player || this.prompt) return;

    let dx = this.joystickVector.x;
    let dy = this.joystickVector.y;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 && !this.isPhoneSession()) {
      const keyboard = this.input.keyboard;
      if (keyboard) {
        if (keyboard.addKey('A').isDown || keyboard.createCursorKeys().left.isDown) dx -= 1;
        if (keyboard.addKey('D').isDown || keyboard.createCursorKeys().right.isDown) dx += 1;
        if (keyboard.addKey('W').isDown || keyboard.createCursorKeys().up.isDown) dy -= 1;
        if (keyboard.addKey('S').isDown || keyboard.createCursorKeys().down.isDown) dy += 1;
      }
    }

    if (dx === 0 && dy === 0 && this.target) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y);
      if (distance < 10) this.target = null;
      else { dx = this.target.x - this.player.x; dy = this.target.y - this.player.y; }
    }

    this.moving = dx !== 0 || dy !== 0;
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy) || 1;
      const distance = this.speed * delta / 1000;
      this.player.x = Phaser.Math.Clamp(this.player.x + dx / length * distance, 55, WORLD_WIDTH - 55);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy / length * distance, 120, WORLD_HEIGHT - 60);
      if (this.target && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y) < 10) this.target = null;
    }

    this.checkLocations();
  }

  private handleWorldTap(pointer: Phaser.Input.Pointer) {
    if (this.prompt || this.isInReservedUi(pointer.y)) return;
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.target = new Phaser.Math.Vector2(point.x, point.y);
  }

  private checkLocations() {
    let nearest: Location | undefined;
    let distance = Infinity;
    for (const location of this.locations) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y);
      if (d < 105 && d < distance) { nearest = location; distance = d; }
    }
    if (nearest && this.activeLocation?.key !== nearest.key) {
      this.activeLocation = nearest;
      this.showLocationPrompt(nearest);
    } else if (!nearest && this.activeLocation) {
      this.activeLocation = undefined;
      this.prompt?.destroy();
      this.prompt = undefined;
    }
  }

  private showLocationPrompt(location: Location) {
    this.prompt?.destroy();
    const w = Math.min(430, this.scale.width * 0.82);
    const h = 88;
    const x = this.scale.width / 2;
    const y = this.scale.height - 128;
    const c = this.add.container(x, y).setScrollFactor(0).setDepth(120);
    const bg = this.add.rectangle(0, 0, w, h, 0x102018, 0.96).setStrokeStyle(2, location.color, 0.9).setInteractive();
    const title = this.add.text(-w / 2 + 16, -24, location.title, { fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#f4f1df' });
    const sub = this.add.text(-w / 2 + 16, 2, location.subtitle, { fontFamily: 'monospace', fontSize: '8px', color: '#bcd1b7' });
    const enter = this.add.text(w / 2 - 14, 20, 'ENTER LOCATION', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#102018',
      backgroundColor: '#e8c95c', padding: { left: 9, right: 9, top: 8, bottom: 8 },
    }).setOrigin(1, 0.5).setInteractive();
    enter.on('pointerdown', (event: Phaser.Input.Pointer) => {
      event.event?.stopPropagation?.();
      this.enterLocation(location);
    });
    bg.on('pointerdown', (event: Phaser.Input.Pointer) => {
      event.event?.stopPropagation?.();
      this.enterLocation(location);
    });
    c.add([bg, title, sub, enter]);
    this.prompt = c;
  }

  private enterLocation(location: Location) {
    this.progress = loadShootersProgress(this.playerName);
    this.registry.set('shootersTriggerProgress', this.progress);
    this.prompt?.destroy();
    this.prompt = undefined;
    this.cameras.main.fadeOut(280, 16, 26, 19);
    this.time.delayedCall(280, () => this.scene.start(location.scene));
  }

  private createHud() {
    const status = this.add.text(18, 16,
      `SHOOTERS TRIGGER · HOME FIELD\n${this.playerName} · BUDGET ${this.progress.budget}`,
      { fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#fff4d4', backgroundColor: '#183322', padding: { left: 9, right: 9, top: 7, bottom: 7 } },
    ).setScrollFactor(0).setDepth(100);

    this.add.text(this.scale.width / 2, 18, 'WALK · EXPLORE · CHOOSE YOUR NEXT FIELD', {
      fontFamily: 'monospace', fontSize: '9px', color: '#f4f1df',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.add.text(this.scale.width - 18, 18, 'RESET DATA', {
      fontFamily: 'monospace', fontSize: '8px', color: '#f4f1df', backgroundColor: '#493526',
      padding: { left: 9, right: 9, top: 7, bottom: 7 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100).setInteractive().on('pointerdown', () => {
      resetShootersProgress(this.playerName);
      this.scene.restart();
    });

    this.add.text(this.scale.width / 2, this.scale.height - 24,
      'WALK THE FIELD · EVERY TRAINING SESSION CHANGES THE STORY',
      { fontFamily: 'monospace', fontSize: '8px', color: '#fff4d4' },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    void status;
  }

  private layoutViewport() {
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);
  }

  private isInReservedUi(y: number) {
    return this.isPhoneSession() && y > this.scale.height - 155;
  }

  private drawWorld() {
    const g = this.add.graphics();
    g.fillStyle(0xe8d6a8, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0x78a653, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0x6a9549, 1).fillRect(0, WORLD_HEIGHT * 0.64, WORLD_WIDTH, WORLD_HEIGHT * 0.36);

    // Main paths make the four places readable from the starting area.
    g.lineStyle(46, 0xb48b58, 0.72);
    g.lineBetween(1100, 1110, 560, 920);
    g.lineBetween(1100, 1110, 1640, 920);
    g.lineBetween(560, 920, 560, 500);
    g.lineBetween(1640, 920, 1640, 500);

    for (const [x, y, s] of [[220, 260, 1], [1040, 280, .8], [1980, 300, 1], [260, 1180, .9], [1940, 1160, .9], [1100, 680, .7]] as const) this.drawTree(x, y, s);

    this.add.circle(1100, 1110, 74, 0x102018, 0.10).setStrokeStyle(3, 0xe8c95c, 0.55).setDepth(5);
    this.add.text(1100, 1185, 'HOME FIELD', { fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#fff4d4', stroke: '#493526', strokeThickness: 5 }).setOrigin(0.5).setDepth(6);
    this.add.text(1100, 1212, 'YOUR TRAINING BASE', { fontFamily: 'monospace', fontSize: '8px', color: '#fff4d4', stroke: '#493526', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);

    this.add.text(1100, 560, 'SHOOTERS TRIGGER · HOME FIELD', {
      fontFamily: 'monospace', fontSize: '22px', fontStyle: 'bold', color: '#fff4d4', stroke: '#493526', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(6);
    this.add.text(1100, 595, 'TRAIN · PREPARE · COMPETE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#e8c95c', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
  }

  private drawLocation(location: Location) {
    const w = 300;
    const h = 160;
    this.add.ellipse(location.x, location.y + 92, w * .68, 22, 0x493526, .22).setDepth(4);
    this.add.rectangle(location.x, location.y + 10, w, h, 0x183322, .97)
      .setStrokeStyle(4, location.color, .9).setDepth(6);
    this.add.rectangle(location.x, location.y - 36, w * .72, 34, location.color, .92).setDepth(7);
    this.add.text(location.x, location.y - 36, location.title, {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#102018',
      align: 'center', wordWrap: { width: w * .64 },
    }).setOrigin(.5).setDepth(8);
    this.add.text(location.x, location.y + 10, location.subtitle, {
      fontFamily: 'monospace', fontSize: '9px', color: '#cbd9c4', align: 'center',
      wordWrap: { width: w * .82 },
    }).setOrigin(.5).setDepth(8);
    this.add.circle(location.x, location.y + 52, 22, location.color, .25).setStrokeStyle(2, location.color, .85).setDepth(8);
  }

  private drawTree(x: number, y: number, scale: number) {
    this.add.ellipse(x, y + 28 * scale, 18 * scale, 42 * scale, 0x493526, .55).setDepth(3);
    this.add.circle(x - 18 * scale, y, 30 * scale, 0x2e6b43, .92).setDepth(3);
    this.add.circle(x + 16 * scale, y - 6 * scale, 32 * scale, 0x3d7d4c, .92).setDepth(3);
    this.add.circle(x, y - 26 * scale, 28 * scale, 0x4b8c55, .92).setDepth(3);
  }

  private createPlayer(x: number, y: number) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x493526, .25).fillEllipse(0, 32, 28, 10);
    g.fillStyle(0x5a7348, 1).fillEllipse(0, -18, 25, 13);
    g.fillStyle(0x111715, 1).fillRoundedRect(-12, -14, 24, 10, 4);
    g.fillStyle(0xd4a45d, 1).fillCircle(0, -15, 8);
    g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -5, 30, 25, 7);
    g.fillStyle(0x566052, 1).fillRoundedRect(-10, 18, 8, 14, 2).fillRoundedRect(2, 18, 8, 14, 2);
    g.fillStyle(0x202522, 1).fillRoundedRect(-12, 30, 10, 7, 2).fillRoundedRect(2, 30, 10, 7, 2);
    c.add(g);
    return c;
  }
}
