import Phaser from 'phaser';
import { adminHubAudio } from '../audio';
import { createWorldNote, deleteWorldNote, getAnonymousPlayerId, isFounderAdmin, loadWorldNotes, loadWorldNoteReports, reportWorldNote, type WorldNote } from '../firebase/firebase';
import { type InteractionModalData } from './InteractionModalScene';
import { openNativeNoteComposer } from '../ui/nativeNoteComposer';

type Village = {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  color: number;
  note: string;
};

type PrivateNote = { village: string; text: string };

const GAMEBOOK_KEY = 'admin-hub-games:gamebook';
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1400;
const DESKTOP_DOCK = 82;
const PORTRAIT_DOCK = 120;

export class GameShellScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerPoseA!: Phaser.GameObjects.Graphics;
  private playerPoseB!: Phaser.GameObjects.Graphics;
  private playerAnimTime = 0;
  private playerMoving = false;
  private playerFacing = 1;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private speed = 170;
  private target: Phaser.Math.Vector2 | null = null;
  public joystickVector = new Phaser.Math.Vector2();
  private interactKey!: Phaser.Input.Keyboard.Key;
  private gamebookKey!: Phaser.Input.Keyboard.Key;
  private gamebookButton!: Phaser.GameObjects.Container;
  private hintText!: Phaser.GameObjects.Text;
  private brandText!: Phaser.GameObjects.Text;
  private playerLabel!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private gamebookOpen = false;
  private interactionModalOpen = false;
  private homeTriggerArmed = false;
  private gamebookOverlay?: Phaser.GameObjects.Container;
  private activeVillage?: Village;
  private privateNotes: PrivateNote[] = [];
  private worldNotes: WorldNote[] = [];
  private gamebookInputOverlay?: Phaser.GameObjects.Container;
  private lobbyManualOverlay?: Phaser.GameObjects.Container;
  private gamebookEscapeHandler?: () => void;
  private gamebookBusy = false;

  private villages: Village[] = [
    { id: 'systems-hall', name: 'SYSTEMS HALL', subtitle: 'The shared lobby of Admin Hub Games', x: 1180, y: 760, color: 0x2f7775, note: 'The first lobby. The systems once imagined as separate houses are gathered here while the foundation is being built.' },
  ];

  constructor() {
    super('GameShellScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.drawWorld();

    this.player = this.createPlayer(1180, 1040);
    this.player.setDepth(20);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(Math.min(width * 0.24, 280), Math.min(height * 0.20, 140));

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.gamebookKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.loadPrivateNotes();
    this.createWorldInteractions();
    this.installAmbientAudioGesture();
    this.createHud();
    this.layoutViewport();

    const escapeHandler = () => {
      if (this.gamebookOpen) {
        this.closeGamebook();
      } else if (this.lobbyManualOverlay) {
        this.closeLobbyManual();
      }
    };
    window.addEventListener('ahg:escape', escapeHandler);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutViewport, this);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gamebookOpen || this.interactionModalOpen) return;
      if (this.isInReservedUi(pointer.x, pointer.y)) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.target = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutViewport, this);
      window.removeEventListener('ahg:escape', escapeHandler);
      this.gamebookInputOverlay?.destroy();
      this.gamebookInputOverlay = undefined;
      this.lobbyManualOverlay?.destroy();
      this.lobbyManualOverlay = undefined;
      if (this.gamebookEscapeHandler) {
        this.input.keyboard?.off('keydown-ESC', this.gamebookEscapeHandler);
        this.gamebookEscapeHandler = undefined;
      }
      adminHubAudio.stop();
    });
  }

  update(_time: number, delta: number) {
    if (!this.player || this.gamebookOpen || this.interactionModalOpen) return;

    const modalMessage = this.registry.get('modalMessage');
    if (typeof modalMessage === 'string' && modalMessage) {
      this.registry.remove('modalMessage');
      this.showTransientMessage(modalMessage);
    }

    let dx = this.joystickVector.x;
    let dy = this.joystickVector.y;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
    }

    if (dx === 0 && dy === 0 && this.target) {
      const distanceToTarget = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y);
      if (distanceToTarget < 8) this.target = null;
      else {
        dx = this.target.x - this.player.x;
        dy = this.target.y - this.player.y;
      }
    }

    this.playerMoving = dx !== 0 || dy !== 0;
    if (Math.abs(dx) > 0.08) this.playerFacing = dx < 0 ? -1 : 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy) || 1;
      const distance = this.speed * (delta / 1000);
      this.player.x = Phaser.Math.Clamp(this.player.x + (dx / length) * distance, 42, WORLD_WIDTH - 42);
      this.player.y = Phaser.Math.Clamp(this.player.y + (dy / length) * distance, 90, WORLD_HEIGHT - 50);
      if (this.target && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y) < 8) this.target = null;
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.gamebookKey)) this.toggleGamebook();

    this.updateNearbyPrompt();

    const homeDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1180, 1160);
    if (homeDistance > 125) this.homeTriggerArmed = true;
    if (this.homeTriggerArmed && homeDistance < 52 && !this.interactionModalOpen && !this.gamebookOpen) {
      this.homeTriggerArmed = false;
      this.interactAt(this.getHomeLocation());
    }

    this.playerAnimTime += delta;
    this.updatePlayerAnimation();
    this.playerLabel.setPosition(this.player.x, this.player.y - 48);
  }

  private layoutViewport() {
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;

    // Mobile controls are a transparent overlay above the world. Keep the camera
    // full-screen so the game never creates a letterboxed separator beneath them.
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setDeadzone(Math.min(width * 0.28, 320), Math.min(height * 0.22, 150));

    const touchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const compactHeader = touchDevice || width < 560;

    if (this.statusText) {
      this.statusText.setPosition(compactHeader ? 18 : 24, compactHeader ? 18 : 20);
      this.statusText.setFontSize(compactHeader ? 9 : (portrait ? 12 : 10));
      this.statusText.setWordWrapWidth(compactHeader ? Math.min(150, width * 0.36) : 174);
    }
    if (this.brandText) {
      this.brandText.setVisible(!compactHeader);
      this.brandText.setPosition(width - 16, compactHeader ? 16 : 16);
    }
    if (this.hintText) {
      this.hintText.setPosition(width / 2, compactHeader ? 48 : 18);
      this.hintText.setFontSize(compactHeader ? 9 : (portrait ? 12 : 10));
      this.hintText.setFixedSize(Math.min(width * (compactHeader ? 0.84 : 0.74), 760), compactHeader ? 30 : 24);
      this.hintText.setAlign('center');
      this.hintText.setWordWrapWidth(Math.min(width * (compactHeader ? 0.84 : 0.74), 760));
    }
    if (this.gamebookButton) this.gamebookButton.setPosition(width - 74, 28);
  }

  public isGamebookOpen() {
    return this.gamebookOpen;
  }

  private isInReservedUi(_x: number, y: number) {
    const touchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    if (!touchDevice) return false;
    const dock = this.scale.height > this.scale.width ? PORTRAIT_DOCK : DESKTOP_DOCK;
    return y >= this.scale.height - dock;
  }

  private drawWorld() {
    const g = this.add.graphics();
    g.fillStyle(0xe8d6a8, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0xd0ad70, 1).fillRect(0, WORLD_HEIGHT * 0.58, WORLD_WIDTH, WORLD_HEIGHT * 0.42);
    g.fillStyle(0xa76545, 1);
    g.beginPath();
    g.moveTo(0, 980); g.lineTo(520, 840); g.lineTo(980, 900); g.lineTo(1420, 820); g.lineTo(1900, 900); g.lineTo(WORLD_WIDTH, 820);
    g.lineTo(WORLD_WIDTH, WORLD_HEIGHT); g.lineTo(0, WORLD_HEIGHT); g.closePath(); g.fillPath();

    // Lobby foundation: one readable Systems Hall first. Former system houses are intentionally absent.
    this.drawBuilding(1180, 760, 300, 170, 0xe9dfc4, 0x2f7775, 'SYSTEMS HALL');
    this.add.circle(1180, 760, 68, 0x0f5a60, 0.14).setStrokeStyle(4, 0x2f7775, 0.9).setDepth(4);
    this.add.text(1180, 760, '✦', { fontFamily: 'sans-serif', fontSize: '54px', color: '#f2d27b' }).setOrigin(0.5).setDepth(5);
    this.add.text(1180, 652, 'SYSTEMS HALL', { fontFamily: 'monospace', fontSize: '24px', color: '#2e241e', stroke: '#e7d6a4', strokeThickness: 6 }).setOrigin(0.5).setDepth(6);
    this.add.text(1180, 875, 'THE LOBBY · ONE PLACE TO BEGIN', { fontFamily: 'monospace', fontSize: '16px', color: '#594838' }).setOrigin(0.5).setDepth(6);
    this.add.text(1180, 920, 'EXPLORE SYSTEMS  ·  LEAVE A NOTE  ·  BUILD GAMES', { fontFamily: 'monospace', fontSize: '13px', color: '#594838' }).setOrigin(0.5).setDepth(6);

    // The Hall is one place, but it has distinct stations so exploration has purpose.
    for (const [x, y, title, verb, accent] of [
      [860, 760, 'IDEA WALL', 'NOTES', 0xd6a84d],
      [1500, 760, 'BUILD CHAMBER', 'PLAN', 0x4d9b98],
      [1180, 470, 'GAME GATE', 'PLAY', 0x7353a6],
    ] as const) {
      this.add.circle(x, y, 38, 0xeee0ba, 1).setStrokeStyle(4, accent, 0.95).setDepth(7);
      this.add.circle(x, y, 22, accent, 0.18).setDepth(7);
      this.add.text(x, y - 1, verb, { fontFamily: 'monospace', fontSize: '10px', color: '#493526', fontStyle: 'bold' }).setOrigin(0.5).setDepth(8);
      this.add.text(x, y + 52, title, { fontFamily: 'monospace', fontSize: '11px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4 }).setOrigin(0.5).setDepth(8);
    }

    // Small moving motes make the Hall feel inhabited without becoming visual noise.
    for (const [x, y, radius] of [[1010, 670, 4], [1350, 680, 3], [1090, 840, 3], [1290, 835, 4]] as const) {
      const mote = this.add.circle(x, y, radius, 0xf2d27b, 0.65).setDepth(7);
      this.tweens.add({ targets: mote, y: y - 18, alpha: 0.12, duration: 1800 + radius * 140, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: radius * 120 });
    }

    // Simple paths converge on the Hall instead of branching into separate houses.
    g.lineStyle(22, 0xb48b58, 0.7);
    g.lineBetween(1180, 1180, 1180, 900);
    g.lineBetween(1180, 760, 650, 760);
    g.lineBetween(1180, 760, 1710, 760);
    g.lineBetween(1180, 760, 1180, 360);

    for (const [x, y] of [[420, 430], [1940, 430], [420, 1090], [1940, 1090]] as const) this.drawTree(x, y, 1);
    this.drawTree(760, 420, 0.8); this.drawTree(1600, 420, 0.8);
    this.drawBuilding(1180, 1120, 180, 100, 0xf0e4c6, 0x493526, 'PLAYER CAMP');
  }

  private drawBuilding(x: number, y: number, w: number, h: number, wall: number, roof: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(0x513c2c, 0.22).fillRect(x - w / 2 + 8, y - h / 2 + 12, w, h);
    g.fillStyle(wall, 1).fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle(roof, 1);
    g.beginPath(); g.moveTo(x - w / 2 - 12, y - h / 2); g.lineTo(x, y - h / 2 - 38); g.lineTo(x + w / 2 + 12, y - h / 2); g.closePath(); g.fillPath();
    g.fillStyle(0x5b4433, 1).fillRect(x - 15, y + 5, 30, h / 2 - 5);
    g.fillStyle(0x7d9a9b, 1).fillRect(x - w / 2 + 18, y - 5, 22, 20).fillRect(x + w / 2 - 40, y - 5, 22, 20);
    this.add.text(x, y - h / 2 - 16, label, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '10px' : '8px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4 }).setOrigin(0.5).setDepth(6);
  }

  private drawChessBoard(x: number, y: number) {
    const g = this.add.graphics();
    const startX = x - 24;
    const startY = y - 16;    for (let row = 0; row < 4; row += 1) for (let col = 0; col < 4; col += 1) {
      g.fillStyle((row + col) % 2 === 0 ? 0xe8d4a7 : 0x73533a, 1).fillRect(startX + col * 12, startY + row * 12, 12, 12);
    }
    g.fillStyle(0x2e241e, 1).fillCircle(x - 12, y - 4, 4);
    g.fillStyle(0xf0dfb6, 1).fillCircle(x + 12, y + 8, 4);
  }

  private drawGrass(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x687846, 0.75).fillRect(x, y, 12 * scale, 4 * scale);
    g.fillStyle(0x879154, 0.65).fillRect(x + 4 * scale, y - 7 * scale, 4 * scale, 7 * scale);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1).fillRect(x - 48 * scale, y, 96 * scale, 20 * scale).fillRect(x - 34 * scale, y - 15 * scale, 68 * scale, 20 * scale).fillRect(x - 17 * scale, y - 28 * scale, 34 * scale, 16 * scale);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 33, 24, 9, 0x4a3524, 0.28);
    const makePose = (legOffset: number, bob: number) => {
      const g = this.add.graphics();
      g.fillStyle(0x2e241e, 1).fillRect(-9, -20 + bob, 18, 10);
      g.fillStyle(0x6e432c, 1).fillRect(-8, -13 + bob, 16, 13);
      g.fillStyle(0x1f6b68, 1).fillRect(-10, bob, 20, 19);
      g.fillStyle(0xd4a45d, 1).fillRect(-9 + legOffset, 19 + bob, 7, 12).fillRect(2 - legOffset, 19 + bob, 7, 12);
      g.fillStyle(0x263b3a, 1).fillRect(-11 + legOffset, 29 + bob, 9, 5).fillRect(2 - legOffset, 29 + bob, 9, 5);
      g.fillStyle(0x5b3d2a, 1).fillRect(9, 3 + bob, 6, 16);
      return g;
    };
    this.playerPoseA = makePose(0, 0);
    this.playerPoseB = makePose(2, 1).setVisible(false);
    container.add([shadow, this.playerPoseA, this.playerPoseB]);
    return container;
  }

  private updatePlayerAnimation() {
    if (!this.playerPoseA || !this.playerPoseB) return;
    const step = this.playerMoving ? 120 : 650;
    const showB = Math.floor(this.playerAnimTime / step) % 2 === 1;
    this.playerPoseA.setVisible(!showB).setScale(this.playerFacing, 1);
    this.playerPoseB.setVisible(showB).setScale(this.playerFacing, 1);
  }

  private createHud() {
    const name = String(this.registry.get('playerName') || 'Player');
    this.playerLabel = this.add.text(this.player.x, this.player.y - 48, name, { fontFamily: 'monospace', fontSize: '10px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4 }).setOrigin(0.5).setDepth(30);

    const plate = this.add.rectangle(12, 12, 174, 38, 0x2f251e, 0.76).setOrigin(0).setScrollFactor(0).setDepth(39).setStrokeStyle(1, 0xe7d6a4, 0.35);
    this.statusText = this.add.text(24, 20, 'FREE ROAM  ·  LEVEL 01', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '12px' : '10px', color: '#fff4d4', letterSpacing: 1 }).setScrollFactor(0).setDepth(40);
    this.statusText.setData('plate', plate);

    this.brandText = this.add.text(this.scale.width - 16, 16, 'ADMIN HUB GAMES', { fontFamily: 'monospace', fontSize: '10px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4, letterSpacing: 1.2 }).setOrigin(1, 0).setScrollFactor(0).setDepth(40);
    this.brandText.setData('brand', true);

    this.hintText = this.add.text(this.scale.width / 2, 18, 'WASD / ARROWS  ·  TAP TO WALK  ·  E EXPLORE', { fontFamily: 'monospace', fontSize: '10px', color: '#fff6dc', stroke: '#2c241d', strokeThickness: 4 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(40).setAlpha(0.9);

    this.gamebookButton = this.makeHudButton(this.scale.width - 74, 28, 116, 42, 'GAMEBOOK');
    this.gamebookButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggleGamebook();
    });

    const touchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    if (touchDevice) this.gamebookButton.setVisible(false);
  }

  private makeHudButton(x: number, y: number, w: number, h: number, label: string) {
    const button = this.add.container(x, y).setScrollFactor(0).setDepth(50);
    const shape = this.add.rectangle(0, 0, w, h, 0x493526, 0.92).setStrokeStyle(2, 0xf0dfb6, 0.82);
    const text = this.add.text(0, 0, label, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '11px' : '8px', color: '#fff4d4', align: 'center', letterSpacing: 1 }).setOrigin(0.5);
    button.add([shape, text]);
    button.setSize(w, h).setInteractive({ useHandCursor: false });
    return button;
  }

  private createWorldInteractions() {
    // Discovery is earned by walking into the space. Tap-to-walk must not teleport the player.
  }

  private updateNearbyPrompt() {
    const nearest = this.findNearestLocation(145);
    this.activeVillage = nearest;
    if (nearest) {
      this.hintText.setText(`${nearest.name}  ·  E / EXPLORE`);
    } else {
      this.hintText.setText('WANDER  ·  TAP / DRAG TO MOVE  ·  EXPLORE  ·  BOOK');
    }
  }

  private getSystemsHallLocation(): Village {
    return {
      id: 'systems-hall',
      name: 'SYSTEMS HALL',
      subtitle: 'The crossroads of Admin Hub Games',
      x: 1180,
      y: 760,
      color: 0x2f7775,
      note: 'Every game begins here. Explore the villages to see the systems we build, leave a thought for the world, or read what other players have left behind.',
    };
  }

  private getHomeLocation(): Village {
    return {
      id: 'home',
      name: 'YOUR LITTLE PLACE',
      subtitle: 'Your room in the world',
      x: 1180,
      y: 1160,
      color: 0x53635c,
      note: 'This is your little place inside Admin Hub Games. It is the home base for your player, your discoveries and the games you build over time.',
    };
  }

  private findNearestLocation(radius: number): Village | undefined {
    let nearest: Village | undefined;
    let nearestDistance = radius;

    const locations = [
      this.getSystemsHallLocation(),
      this.getHomeLocation(),
      { id: 'idea-wall', name: 'IDEA WALL', subtitle: 'Capture what you want to build next', x: 860, y: 760, color: 0xd6a84d, note: 'Bring a game idea here. Write it privately first if you are still thinking, or use LEAVE IN WORLD when you want the idea to become part of the shared world.' },
      { id: 'build-chamber', name: 'BUILD CHAMBER', subtitle: 'Turn an idea into a playable slice', x: 1500, y: 760, color: 0x4d9b98, note: 'The development rhythm is simple: one small playable goal, build it, test it, push it, then return here and decide what comes next.' },
      { id: 'game-gate', name: 'GAME GATE', subtitle: 'The games we finish will live here', x: 1180, y: 470, color: 0x7353a6, note: 'This gate stays quiet until real games exist. Finished Admin Hub Games titles can eventually gain an entrance here.' },
    ];
    for (const location of locations) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y);
      if (distance < nearestDistance) {
        nearest = location;
        nearestDistance = distance;
      }
    }

    const hallDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1180, 760);
    if (hallDistance < nearestDistance) {
      nearest = this.getSystemsHallLocation();
      nearestDistance = hallDistance;
    }

    return nearest;
  }

  private interact() {
    if (this.gamebookOpen || this.interactionModalOpen) return;
    const location = this.findNearestLocation(170);
    if (!location) {
      this.showTransientMessage('Nothing here yet. Keep wandering.');
      return;
    }
    this.interactAt(location);
  }

  private interactAt(location: Village) {
    if (this.gamebookOpen || this.interactionModalOpen) return;

    this.target = null;
    this.interactionModalOpen = true;

    const modal = this.scene.get('InteractionModalScene') as Phaser.Scene;
    modal.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.interactionModalOpen = false;
    });

    const data: InteractionModalData = {
      title: location.name,
      subtitle: location.subtitle,
      body: location.id === 'systems-hall' ? this.buildSystemsHallText() : location.note,
      accent: location.color,
      onPrivateNote: () => this.writePrivateNote(location),
      onWorldNote: (text) => this.writeWorldNote(location, text),
    };

    // Keep GameShell running while the modal owns input. Pausing the parent scene
    // makes browser prompt-based actions fragile on some browsers; the explicit
    // interactionModalOpen guard already prevents gameplay input underneath it.
    this.scene.launch('InteractionModalScene', data);
  }

  private buildSystemsHallText() {
    return [
      'THE SYSTEMS HALL',
      '',
      'This is the shared home of Admin Hub Games — a place to wander, think, write and build.',
      '',
      'IDEA WALL',
      'Capture mechanics, questions, experiments and game ideas. Private notes stay in your Gamebook; LEAVE IN WORLD makes a note visible to everyone.',
      '',
      'BUILD CHAMBER',
      'Turn an idea into one small playable slice. Build it, test it, push it, then return and decide what comes next.',
      '',
      'GAME GATE',
      'Finished Admin Hub Games titles will eventually have entrances here. The gate stays quiet while the catalogue grows.',
      '',
      'PLAYER CAMP',
      'Your little place in the world — your player, discoveries and the games you build over time.',
      '',
      'Keep wandering. The Hall is the studio loop: WANDER → DISCOVER → THINK → WRITE → BUILD → RETURN.'
    ].join('\n');
  }

  private makePanelButton(x: number, y: number, label: string) {
    const button = this.add.container(x, y).setScrollFactor(0).setDepth(101);
    const shape = this.add.rectangle(0, 0, Math.min(280, this.scale.width * 0.72), Math.max(50, this.scale.height > this.scale.width ? 58 : 50), 0x493526, 0.95).setStrokeStyle(2, 0xf0dfb6, 0.9);
    const text = this.add.text(0, 0, label, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '12px' : '9px', color: '#fff4d4', align: 'center' }).setOrigin(0.5);
    button.add([shape, text]);
    button.setSize(shape.width, shape.height).setInteractive({ useHandCursor: false });
    return button;
  }

  private async writePrivateNote(village: Village) {
    const text = await this.openTextComposer(
      'PRIVATE NOTE',
      `Private note for ${village.name}. Only you can see this in your Gamebook.`,
      'Your private note…',
      500,
    );
    if (!text) return 'Private note cancelled.';
    this.privateNotes.push({ village: village.id, text });
    this.savePrivateNotes();
    return 'Saved privately in your Gamebook.';
  }

  private openTextComposer(titleText: string, hintText: string, placeholder: string, maxLength: number): Promise<string | null> {
    return openNativeNoteComposer({
      title: titleText,
      hint: hintText,
      placeholder,
      maxLength,
      actionLabel: 'SAVE NOTE',
    });
  }

  private openChoicePanel(titleText: string, hintText: string, choices: { label: string; value: string }[]): Promise<string | null> {
    return new Promise((resolve) => {
      const width = this.scale.width;
      const height = this.scale.height;
      const portrait = height > width;
      const panelWidth = Math.min(width * 0.92, 680);
      const panelHeight = Math.min(height * 0.82, portrait ? 600 : 500);
      const overlay = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(320);
      this.gamebookInputOverlay = overlay;
      const backdrop = this.add.rectangle(0, 0, width, height, 0x17110e, 0.78).setInteractive();
      backdrop.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => event.stopPropagation());
      const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xeee0ba, 1).setStrokeStyle(4, 0x5a402d, 1);
      const title = this.add.text(0, -panelHeight / 2 + 28, titleText, { fontFamily: 'monospace', fontSize: portrait ? '18px' : '22px', fontStyle: 'bold', color: '#493526', align: 'center' }).setOrigin(0.5);
      const hint = this.add.text(0, -panelHeight / 2 + 60, hintText, { fontFamily: 'monospace', fontSize: portrait ? '10px' : '11px', color: '#73533a', align: 'center', wordWrap: { width: panelWidth - 44 } }).setOrigin(0.5);
      const visible = choices.slice(0, 8);
      const buttonHeight = Math.min(50, Math.max(42, (panelHeight - 120) / Math.max(1, visible.length)));
      let finished = false;
      const finish = (value: string | null) => { if (finished) return; finished = true; overlay.destroy(); if (this.gamebookInputOverlay === overlay) this.gamebookInputOverlay = undefined; resolve(value); };
      const buttons = visible.map((choice, index) => {
        const button = this.makePanelButton(0, -panelHeight / 2 + 96 + index * (buttonHeight + 6), choice.label.slice(0, 72));
        button.setSize(Math.min(520, panelWidth - 64), buttonHeight);
        const shape = button.list[0] as Phaser.GameObjects.Rectangle;
        shape.setSize(Math.min(520, panelWidth - 64), buttonHeight);
        button.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.time.delayedCall(0, () => finish(choice.value)); });
        return button;
      });
      const cancel = this.makePanelButton(0, panelHeight / 2 - 32, 'CANCEL');
      cancel.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.time.delayedCall(0, () => finish(null)); });
      overlay.add([backdrop, panel, title, hint, ...buttons, cancel]);
      this.input.keyboard?.once('keydown-ESC', () => finish(null));
    });
  }

  private async writeWorldNote(village: Village, text?: string) {
    const cleanText = text?.trim().slice(0, 500);
    if (!cleanText) return 'World note cancelled.';

    const authorName = String(this.registry.get('playerName') || 'Player');
    this.showTransientMessage('Publishing your note to the shared world…');
    try {
      const note = await createWorldNote(village.id, authorName, cleanText);
      if (note) {
        this.worldNotes = [note, ...this.worldNotes];
        return 'Your note is now part of the shared world.';
      }
      return 'Could not reach the shared world. Nothing was saved.';
    } catch {
      return 'Could not reach the shared world. Nothing was saved.';
    }
  }

  private showTransientMessage(message: string) {
    const text = this.add.text(this.scale.width / 2, this.scale.height - 128, message, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '14px' : '10px', color: '#fff4d4', backgroundColor: '#493526', padding: { left: 12, right: 12, top: 9, bottom: 9 } }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
    this.tweens.add({ targets: text, alpha: 0, delay: 1800, duration: 500, onComplete: () => text.destroy() });
  }

  private showLobbyManual() {
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const panelWidth = Math.min(width * 0.92, 680);
    const panelHeight = Math.min(height * 0.86, portrait ? 620 : 500);

    const overlay = this.add.container(width / 2, height / 2)
      .setScrollFactor(0)
      .setDepth(260);
    this.lobbyManualOverlay?.destroy();
    this.lobbyManualOverlay = overlay;

    const backdrop = this.add.rectangle(0, 0, width, height, 0x17110e, 0.82).setInteractive();
    backdrop.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => event.stopPropagation());

    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xeee0ba, 1)
      .setStrokeStyle(5, 0x5a402d, 1);

    const title = this.add.text(0, -panelHeight / 2 + 30, 'HOW TO PLAY THE LOBBY', {
      fontFamily: 'monospace', fontSize: portrait ? '18px' : '22px', fontStyle: 'bold',
      color: '#493526', align: 'center', wordWrap: { width: panelWidth - 60 }
    }).setOrigin(0.5);

    const body = this.add.text(0, -panelHeight / 2 + 72, [
      '1 · WANDER',
      'Walk around the Hall. Tap to move on mobile, or use WASD / arrows.',
      '',
      '2 · DISCOVER',
      'Approach a station until its name appears, then choose EXPLORE.',
      '',
      '3 · THINK',
      'Read the space and decide what you want to make or remember.',
      '',
      '4 · WRITE',
      'PRIVATE NOTE saves to your Gamebook. LEAVE IN WORLD publishes a shared note.',
      '',
      '5 · BUILD',
      'Use the BUILD CHAMBER to turn one idea into a small playable slice.',
      '',
      '6 · RETURN',
      'Come back after building. The Hall is your studio home, not a checklist.',
      '',
      'GAMEBOOK',
      'Your private notes, shared-world tools and this manual live here.'
    ].join('\n'), {
      fontFamily: 'monospace', fontSize: portrait ? '10px' : '11px', color: '#493526',
      wordWrap: { width: panelWidth - 60 }, lineSpacing: portrait ? 3 : 4,
      align: 'left'
    }).setOrigin(0.5, 0);

    body.setFixedSize(panelWidth - 60, panelHeight - 128);
    body.setMaxLines(portrait ? 28 : 24);

    const close = this.makePanelButton(0, panelHeight / 2 - 34, 'BACK TO GAMEBOOK');
    close.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.time.delayedCall(0, () => {
        this.closeLobbyManual();
        this.toggleGamebook();
      });
    });

    overlay.add([backdrop, panel, title, body, close]);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 140 });
  }

  private toggleGamebook() {
    if (this.gamebookOpen) { this.closeGamebook(); return; }

    this.gamebookOpen = true;
    this.target = null;

    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const panelWidth = Math.min(width * 0.94, 760);
    const panelHeight = Math.min(height * 0.90, portrait ? 640 : 560);
    const buttonHeight = portrait ? 44 : 48;
    const buttonGap = 7;
    const top = -panelHeight / 2;

    this.gamebookOverlay = this.add.container(width / 2, height / 2)
      .setScrollFactor(0)
      .setDepth(200);

    const backdrop = this.add.rectangle(0, 0, width, height, 0x17110e, 0.78)
      .setInteractive();
    backdrop.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });

    const book = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xd8bd83, 1)
      .setStrokeStyle(6, 0x5a402d, 1);
    const inner = this.add.rectangle(0, 0, panelWidth - 34, panelHeight - 34, 0xeee0ba, 1)
      .setStrokeStyle(2, 0x9a744c, 1);

    const title = this.add.text(0, top + 30, 'MY GAMEBOOK', {
      fontFamily: 'monospace',      fontSize: portrait ? '24px' : '28px',
      fontStyle: 'bold',
      color: '#493526',
      align: 'center',
    }).setOrigin(0.5);

    const intro = this.add.text(0, top + 62, 'Private discoveries and ideas. World Notes are separate.', {
      fontFamily: 'monospace',
      fontSize: portrait ? '10px' : '11px',
      color: '#73533a',
      align: 'center',
      wordWrap: { width: panelWidth - 64 },
    }).setOrigin(0.5);

    const noteLines = this.privateNotes.length
      ? this.privateNotes.slice(-3).map((note) => '✦ ' + note.village.toUpperCase() + ' — ' + note.text).join('\\n')
      : 'No private notes yet. Visit a place and choose PRIVATE NOTE.';

    const notesHeight = Math.max(48, Math.min(72, panelHeight * 0.15));
    const notes = this.add.text(-panelWidth / 2 + 34, top + 84, noteLines, {
      fontFamily: 'monospace',
      fontSize: portrait ? '10px' : '11px',
      color: '#493526',
      wordWrap: { width: panelWidth - 68 },
      lineSpacing: 4,
    }).setOrigin(0, 0);
    notes.setFixedSize(panelWidth - 68, notesHeight);
    notes.setMaxLines(portrait ? 3 : 4);

    const buttonAreaTop = top + 172;
    const buttonAreaBottom = panelHeight / 2 - 38;
    const fittedButtonHeight = Math.min(buttonHeight, Math.max(34, (buttonAreaBottom - buttonAreaTop - buttonGap * 5) / 6));
    const firstButtonY = buttonAreaTop + fittedButtonHeight / 2;
    const buttons = [
      ['VIEW WORLD NOTES', () => { this.closeGamebook(); return this.viewWorldNotes(); }],
      ['DELETE A WORLD NOTE', () => { this.closeGamebook(); return this.deleteOwnWorldNote(); }],
      ['REPORT A WORLD NOTE', () => { this.closeGamebook(); return this.reportWorldNoteFlow(); }],
      ['WORLD NOTE REPORTS', () => { this.closeGamebook(); return this.viewAdminReports(); }],
      ['HOW TO PLAY THE LOBBY', () => { this.closeGamebook(); this.showLobbyManual(); return undefined; }],
      ['CLOSE GAMEBOOK', () => { this.closeGamebook(); return undefined; }],
    ] as const;

    const actionButtons = buttons.map(([label, action], index) => {
      const button = this.makePanelButton(0, firstButtonY + index * (fittedButtonHeight + buttonGap), label);
      button.setSize(Math.min(280, panelWidth * 0.72), fittedButtonHeight);
      const shape = button.list[0] as Phaser.GameObjects.Rectangle;
      shape.setSize(Math.min(280, panelWidth * 0.72), fittedButtonHeight);
      const text = button.list[1] as Phaser.GameObjects.Text;
      text.setFontSize(portrait ? '9px' : '8px');
      button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.time.delayedCall(0, () => { void this.runGamebookAction(action); });
      });
      return button;
    });

    this.gamebookOverlay.add([backdrop, book, inner, title, intro, notes, ...actionButtons]);
    this.gamebookOverlay.setAlpha(0);

    this.tweens.add({ targets: this.gamebookOverlay, alpha: 1, duration: 180 });
    // B is handled by GameShell.update(). Do not register a second B handler here:
    // the same key event would open and immediately close the Gamebook.
    this.gamebookEscapeHandler = () => this.closeGamebook();
    this.input.keyboard?.on('keydown-ESC', this.gamebookEscapeHandler);
  }
  private async runGamebookAction(action: () => Promise<string | void> | string | void) {
    if (this.gamebookBusy) return;
    this.gamebookBusy = true;
    try {
      const message = await action();
      if (message) this.showTransientMessage(message);
    } catch {
      this.showTransientMessage('Something went wrong. The Hall is still here.');
    } finally {
      this.gamebookBusy = false;
    }
  }

  private async reportWorldNoteFlow() {
    const village = this.activeVillage || this.getSystemsHallLocation();
    const notes = await loadWorldNotes(village.id);
    if (!notes.length) return 'There are no world notes here to report.';
    const choices = notes.slice(0, 8).map((note) => ({ value: note.id, label: note.authorName + ': ' + note.text }));
    const noteId = await this.openChoicePanel('REPORT A WORLD NOTE', 'Choose the note you want the admin system to review.', choices);
    if (!noteId) return 'Report cancelled.';
    const note = notes.find((item) => item.id === noteId);
    if (!note) return 'That note was not found.';
    const reason = await this.openTextComposer('REPORT REASON', 'Explain what should be reviewed (max 300 characters).', 'Why are you reporting this note?', 300);
    if (!reason) return 'Report cancelled. Please give a reason so the admin system can understand what is happening.';
    const reporterName = String(this.registry.get('playerName') || 'Player');
    const reported = await reportWorldNote(note, reporterName, reason);
    return reported ? 'Report submitted. The admin system has recorded it for review.' : 'Could not submit the report. Please try again later.';
  }

  private async viewAdminReports() {
    const founderAdmin = await isFounderAdmin();
    if (!founderAdmin) return 'Admin reports are only available to the founder/admin identity.';
    const reports = await loadWorldNoteReports();
    if (!reports.length) return 'ADMIN REPORTS · No reports have been recorded yet.';
    const lines = reports.slice(0, 12).map((report, index) =>
      `${index + 1}. ${report.reporterName} reported note ${report.noteId}\n  Village: ${report.villageId}\n  Reason: ${report.reason}`,
    ).join('\n\n');
    return `ADMIN REPORTS · ${reports.length} recorded\n\n${lines}`.slice(0, 1800);
  }

  private async viewWorldNotes() {
    const village = this.activeVillage || this.getSystemsHallLocation();
    this.worldNotes = await loadWorldNotes(village.id);
    const lines = this.worldNotes.length ? this.worldNotes.map((note) => `✦ ${note.authorName}\n  ${note.text}`).join('\n\n') : 'No shared notes here yet.\n\nBe the first person to leave one.';
    this.showTransientMessage(lines.slice(0, 180));
  }

  private async deleteOwnWorldNote() {
    const village = this.activeVillage || this.getSystemsHallLocation();
    const notes = await loadWorldNotes(village.id);
    if (!notes.length) return 'There are no world notes here to remove.';
    const founderAdmin = await isFounderAdmin();
    const myId = founderAdmin ? null : await getAnonymousPlayerId();
    const visibleNotes = founderAdmin ? notes : notes.filter((note) => note.authorId === myId);
    if (!visibleNotes.length) return 'You have no world notes here to remove.';
    const choices = visibleNotes.slice(0, 8).map((note) => ({ value: note.id, label: note.authorName + ': ' + note.text }));
    const noteId = await this.openChoicePanel(founderAdmin ? 'REMOVE WORLD NOTE' : 'REMOVE YOUR WORLD NOTE', 'Choose the note to remove from the shared world.', choices);
    if (!noteId) return 'Cleanup cancelled.';
    const note = visibleNotes.find((item) => item.id === noteId);
    if (!note) return 'That note was not found.';
    const deleted = await deleteWorldNote(note.id);
    return deleted ? 'The selected world note was removed from the shared world.' : 'Could not delete that note.';
  }

  private closeGamebook() {
    if (!this.gamebookOpen || !this.gamebookOverlay) return;
    this.gamebookOpen = false;
    this.gamebookBusy = false;
    const overlay = this.gamebookOverlay;
    this.gamebookOverlay = undefined;
    if (this.gamebookEscapeHandler) {
      this.input.keyboard?.off('keydown-ESC', this.gamebookEscapeHandler);
      this.gamebookEscapeHandler = undefined;
    }
    // Android browsers can still be inside Phaser's pointer dispatch when a
    // Container is destroyed. Hide and disable it first, then let the browser
    // tear it down outside the Phaser input event.
    overlay.disableInteractive();
    overlay.setVisible(false);
    window.setTimeout(() => overlay.destroy(), 0);
  }

  private closeLobbyManual() {
    if (!this.lobbyManualOverlay) return;
    const overlay = this.lobbyManualOverlay;
    this.lobbyManualOverlay = undefined;
    overlay.disableInteractive();
    overlay.setVisible(false);
    window.setTimeout(() => overlay.destroy(), 0);
  }

  private savePrivateNotes() {
    try { window.localStorage.setItem(GAMEBOOK_KEY, JSON.stringify(this.privateNotes)); } catch { /* optional */ }
  }

  private loadPrivateNotes() {
    try {
      const raw = window.localStorage.getItem(GAMEBOOK_KEY);
      if (!raw) { this.privateNotes = []; return; }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) { this.privateNotes = []; return; }
      this.privateNotes = parsed
        .filter((item): item is { village?: unknown; text?: unknown } => typeof item === 'object' && item !== null)
        .map((item) => ({
          village: typeof item.village === 'string' ? item.village.slice(0, 40) : 'unknown',
          text: typeof item.text === 'string' ? item.text.trim().slice(0, 500) : '',
        }))
        .filter((item) => item.text.length > 0)
        .slice(-50);
    } catch { this.privateNotes = []; }
  }

  private installAmbientAudioGesture() {
    const start = () => {
      adminHubAudio.start();
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
  }
}
