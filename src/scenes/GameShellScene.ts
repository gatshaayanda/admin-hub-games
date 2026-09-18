import Phaser from 'phaser';
import { createWorldNote, deleteWorldNote, getAnonymousPlayerId, isFounderAdmin, loadWorldNotes, type WorldNote } from '../firebase/firebase';
import { type InteractionModalData } from './InteractionModalScene';

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
  private playerLabel!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private gamebookOpen = false;
  private interactionModalOpen = false;
  private homeTriggerArmed = false;
  private gamebookOverlay?: Phaser.GameObjects.Container;
  private activeVillage?: Village;
  private privateNotes: PrivateNote[] = [];
  private worldNotes: WorldNote[] = [];
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain?: GainNode;

  private villages: Village[] = [
    { id: 'story', name: 'STORY VILLAGE', subtitle: 'Where choices become games', x: 420, y: 350, color: 0x6e5a9b, note: 'Ideas for dialogue, characters, choices, quests and endings live here.' },
    { id: 'adventure', name: 'ADVENTURE VILLAGE', subtitle: 'Go somewhere and find out', x: 1000, y: 300, color: 0x4d7b5b, note: 'Exploration, maps, inventory, items, puzzles and secrets.' },
    { id: 'management', name: 'MANAGEMENT VILLAGE', subtitle: 'Build something that keeps moving', x: 1610, y: 380, color: 0xb67a43, note: 'Money, resources, schedules, people, upgrades and simulation.' },
    { id: 'strategy', name: 'STRATEGY VILLAGE', subtitle: 'Think ahead', x: 380, y: 930, color: 0x496a8a, note: 'Turns, territory, cards, resources, opponents and objectives.' },
    { id: 'arcade', name: 'ARCADE VILLAGE', subtitle: 'One more run', x: 980, y: 900, color: 0x8d4f58, note: 'Score, timers, enemies, waves, power-ups and increasingly difficult challenges.' },
    { id: 'simulation', name: 'SIMULATION VILLAGE', subtitle: 'Watch a little world live', x: 1610, y: 930, color: 0x6d7650, note: 'Virtual pets, businesses, towns, football management and living systems.' },
    { id: 'puzzle', name: 'PUZZLE VILLAGE', subtitle: 'There must be a way', x: 2100, y: 650, color: 0x8b6b3f, note: 'Grid rules, objects, logic, moves, undo, hints and satisfying solutions.' },
  ];

  constructor() {
    super('GameShellScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.drawWorld();

    this.player = this.createPlayer(1180, 1120);
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
    this.createHud();
    this.layoutViewport();

    const escapeHandler = () => {
      if (this.gamebookOpen) this.closeGamebook();
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

    if (this.hintText) {
      this.hintText.setPosition(width / 2, 18);
      this.hintText.setFontSize(portrait ? 12 : 10);
    }
    if (this.statusText) {
      this.statusText.setPosition(18, 18);
      this.statusText.setFontSize(portrait ? 12 : 10);
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
    g.fillStyle(0xe7d6a4, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0xc59a60, 1).fillRect(0, 360, WORLD_WIDTH, WORLD_HEIGHT - 360);

    g.lineStyle(56, 0xb18456, 1);
    g.beginPath();
    g.moveTo(1180, 1350); g.lineTo(1180, 760); g.lineTo(420, 350);
    g.moveTo(1180, 760); g.lineTo(1000, 300);
    g.moveTo(1180, 760); g.lineTo(1610, 380);
    g.moveTo(1180, 760); g.lineTo(380, 930);
    g.moveTo(1180, 760); g.lineTo(980, 900);
    g.moveTo(1180, 760); g.lineTo(1610, 930);
    g.moveTo(1180, 760); g.lineTo(2100, 650);
    g.strokePath();
    g.lineStyle(4, 0x9a7248, 0.7).strokeCircle(1180, 760, 125);

    g.fillStyle(0x7da3a3, 0.9).fillEllipse(1980, 1160, 260, 130);
    g.fillStyle(0xd5bd84, 1).fillEllipse(1980, 1160, 190, 80);

    for (let i = 0; i < 70; i += 1) {
      const x = 45 + ((i * 173) % 2260);
      const y = 130 + ((i * 97) % 1160);
      if (Phaser.Math.Distance.Between(x, y, 1180, 760) < 180) continue;
      this.drawGrass(x, y, 0.65 + (i % 4) * 0.1);
    }

    this.drawTree(150, 180, 1.5);
    this.drawTree(2250, 180, 1.1);
    this.drawTree(2280, 1180, 1.35);
    this.drawTree(160, 1160, 1);
    this.drawBuilding(1180, 1160, 190, 100, 0xeee1c2, 0x53635c, 'HOME / STUDIO');
    this.add.text(1180, 1088, 'YOUR LITTLE PLACE', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '16px' : '13px', color: '#4b3829', stroke: '#f0dfb6', strokeThickness: 5 }).setOrigin(0.5).setDepth(6);

    this.drawBuilding(1180, 760, 190, 104, 0xe9dfc4, 0x2f7775, 'SYSTEMS HALL');
    this.add.circle(1180, 760, 38, 0x0f5a60, 0.18).setStrokeStyle(3, 0x2f7775, 0.8).setDepth(4);
    this.add.text(1180, 760, '✦', { fontFamily: 'sans-serif', fontSize: '34px', color: '#f2d27b' }).setOrigin(0.5).setDepth(5);
    this.add.text(1180, 704, 'SYSTEMS HALL', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '18px' : '16px', color: '#2e241e', stroke: '#e7d6a4', strokeThickness: 5 }).setOrigin(0.5).setDepth(6);
    this.add.text(1180, 724, 'the village crossroads', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '12px' : '10px', color: '#594838' }).setOrigin(0.5).setDepth(6);

    this.drawBuilding(1180, 585, 150, 92, 0xe9dfc4, 0x5d5548, 'CHESS HOUSE');
    this.drawChessBoard(1180, 585);
    this.add.text(1180, 505, 'CHESS HOUSE', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '18px' : '16px', color: '#2e241e', stroke: '#e7d6a4', strokeThickness: 5 }).setOrigin(0.5).setDepth(6);
    this.add.text(1180, 526, 'you + the other you', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '12px' : '10px', color: '#594838' }).setOrigin(0.5).setDepth(6);

    this.villages.forEach((village) => this.drawVillage(village));
  }

  private drawVillage(village: Village) {
    const g = this.add.graphics();
    g.fillStyle(village.color, 0.16).fillCircle(village.x, village.y, 105);
    g.lineStyle(3, village.color, 0.6).strokeCircle(village.x, village.y, 105);
    this.drawBuilding(village.x, village.y, 130, 78, 0xf0dfb6, village.color, village.name.replace(' VILLAGE', ''));
    this.add.text(village.x, village.y + 64, village.name, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '19px' : '14px', color: '#342a22', stroke: '#e7d6a4', strokeThickness: 5 }).setOrigin(0.5).setDepth(7);
    this.add.text(village.x, village.y + 86, village.subtitle, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '12px' : '9px', stroke: '#e7d6a4', strokeThickness: 3 }).setOrigin(0.5).setDepth(7);
    this.add.text(village.x + 72, village.y - 72, '✦', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff1bd', stroke: '#493526', strokeThickness: 4 }).setOrigin(0.5).setDepth(8);
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
    const startY = y - 16;
    for (let row = 0; row < 4; row += 1) for (let col = 0; col < 4; col += 1) {
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

    const brand = this.add.text(this.scale.width - 16, 16, 'ADMIN HUB GAMES', { fontFamily: 'monospace', fontSize: '10px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4, letterSpacing: 1.2 }).setOrigin(1, 0).setScrollFactor(0).setDepth(40);
    brand.setData('brand', true);

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

    const locations = [...this.villages, this.getHomeLocation()];
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

    const chessDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1180, 585);
    if (chessDistance < nearestDistance) {
      nearest = {
        id: 'chess',
        name: 'CHESS HOUSE',
        subtitle: 'you + the other you',
        x: 1180,
        y: 585,
        color: 0x73533a,
        note: 'Your real chess life meets this little world here. One you plays on Chess.com. This one wanders, notices things and leaves ideas behind.',
      };
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
      onWorldNote: () => this.writeWorldNote(location),
    };

    this.scene.pause('GameShellScene');
    this.scene.launch('InteractionModalScene', data);
  }

  private buildSystemsHallText() {
    const villages = this.villages.map((village) => '• ' + village.name + ' — ' + village.subtitle).join('\n');
    return 'THE SYSTEMS OF ADMIN HUB GAMES\n\n' + villages + '\n\nLeave a thought for this world. Apple saves it to the shared world. Banana is the cleanup command for notes you own.';
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
    const text = window.prompt(`Private note for ${village.name}:`, '')?.trim();
    if (!text) return 'Private note cancelled.';
    this.privateNotes.push({ village: village.id, text: text.slice(0, 500) });
    this.savePrivateNotes();
    return 'Saved privately in your Gamebook.';
  }

  private async writeWorldNote(village: Village) {
    const text = window.prompt('Write a note for ' + village.name + '. Other players will see it:', '')?.trim();
    if (!text) return 'World note cancelled.';

    const keyword = window.prompt('Type APPLE to save this note in the shared world:', '')?.trim().toLowerCase();
    if (keyword !== 'apple') return 'Note discarded. Nothing was saved.';

    const authorName = String(this.registry.get('playerName') || 'Player');
    const note = await createWorldNote(village.id, authorName, text.slice(0, 500));

    if (note) {
      this.worldNotes = [note, ...this.worldNotes];
      return 'APPLE accepted. Your note is now part of the world.';
    }

    return 'Could not reach the shared world. Nothing was saved.';
  }

  private showTransientMessage(message: string) {
    const text = this.add.text(this.scale.width / 2, this.scale.height - 128, message, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '14px' : '10px', color: '#fff4d4', backgroundColor: '#493526', padding: { left: 12, right: 12, top: 9, bottom: 9 } }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
    this.tweens.add({ targets: text, alpha: 0, delay: 1800, duration: 500, onComplete: () => text.destroy() });
  }

  private toggleGamebook() {
    if (this.gamebookOpen) { this.closeGamebook(); return; }
    this.gamebookOpen = true;
    this.target = null;
    this.gamebookOverlay = this.add.container(this.scale.width / 2, this.scale.height / 2).setScrollFactor(0).setDepth(200);
    const w = Math.min(this.scale.width * 0.94, 760);
    const h = Math.min(this.scale.height * (this.scale.height > this.scale.width ? 0.82 : 0.78), 500);
    const backdrop = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x17110e, 0.74);
    const book = this.add.rectangle(0, 0, w, h, 0xd8bd83, 1).setStrokeStyle(6, 0x5a402d, 1);
    const inner = this.add.rectangle(0, 0, w - 34, h - 34, 0xeee0ba, 1).setStrokeStyle(2, 0x9a744c, 1);
    const title = this.add.text(0, -h / 2 + 38, 'MY GAMEBOOK', { fontFamily: 'monospace', fontSize: `${Math.max(this.scale.height > this.scale.width ? 24 : 20, Math.min(this.scale.height > this.scale.width ? 32 : 28, w * 0.045))}px`, color: '#493526' }).setOrigin(0.5);
    const intro = this.add.text(0, -h / 2 + 72, 'Private discoveries and ideas. World Notes are separate.', { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '13px' : '10px', color: '#73533a' }).setOrigin(0.5);
    const noteLines = this.privateNotes.length ? this.privateNotes.map((note) => `✦ ${note.village.toUpperCase()}\n  ${note.text}`).join('\n\n') : 'No private notes yet.\n\nVisit a village and choose PRIVATE NOTE.';
    const notes = this.add.text(-w / 2 + 34, -h / 2 + 112, noteLines, { fontFamily: 'monospace', fontSize: this.scale.height > this.scale.width ? '14px' : '11px', color: '#493526', wordWrap: { width: w - 68 }, lineSpacing: 6 });
    const worldButton = this.makePanelButton(0, h / 2 - 54, 'VIEW WORLD NOTES');
    const deleteButton = this.makePanelButton(0, h / 2 + 2, 'BANANA · DELETE MY NOTE');
    const close = this.makePanelButton(0, h / 2 + 38, 'CLOSE GAMEBOOK');
    this.gamebookOverlay.add([backdrop, book, inner, title, intro, notes, worldButton, deleteButton, close]);
    worldButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.viewWorldNotes();
    });
    deleteButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.deleteOwnWorldNote();
    });
    close.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.closeGamebook();
    });
    this.gamebookOverlay.setAlpha(0);
    this.tweens.add({ targets: this.gamebookOverlay, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-B', () => this.closeGamebook());
    this.input.keyboard?.once('keydown-ESC', () => this.closeGamebook());
  }

  private async viewWorldNotes() {
    const village = this.activeVillage || this.getSystemsHallLocation();
    this.worldNotes = await loadWorldNotes(village.id);
    const lines = this.worldNotes.length ? this.worldNotes.map((note) => `✦ ${note.authorName}\n  ${note.text}`).join('\n\n') : 'No shared notes here yet.\n\nBe the first person to leave one.';
    this.showTransientMessage(lines.slice(0, 180));
  }

  private async deleteOwnWorldNote() {
    const village = this.activeVillage || this.getSystemsHallLocation();
    const keyword = window.prompt('Type BANANA to open world-note cleanup:', '')?.trim().toLowerCase();
    if (keyword !== 'banana') return 'Cleanup cancelled. Nothing was deleted.';

    const notes = await loadWorldNotes(village.id);
    const founderAdmin = await isFounderAdmin();

    if (founderAdmin) {
      if (!notes.length) return 'BANANA accepted. There are no world notes here to clean up.';

      const choice = window.prompt(
        notes.map((note, index) => (index + 1) + '. ' + note.authorName + ': ' + note.text).join('\n\n') +
        '\n\nEnter the note number to delete:',
      );
      if (choice === null) return 'Cleanup cancelled.';
      const index = Number(choice) - 1;
      const note = notes[index];
      if (!note) return 'That note was not found.';

      const confirmation = window.prompt(
        'Delete this world note?\n\n' +
        note.authorName + ': ' + note.text +
        '\n\nType BANANA again to confirm founder cleanup:',
      );
      if (confirmation?.trim().toLowerCase() !== 'banana') return 'Cleanup cancelled. Nothing was deleted.';

      const deleted = await deleteWorldNote(note.id);
      return deleted
        ? 'BANANA accepted. The selected world note was removed from the shared world.'
        : 'Could not delete that note.';
    }

    const myId = await getAnonymousPlayerId();
    const mine = notes.filter((note) => note.authorId === myId);
    if (!mine.length) return 'BANANA accepted. You have no world notes here.';

    const choice = window.prompt(
      mine.length === 1
        ? 'Delete this note?\n\n' + mine[0].text + '\n\nType BANANA again to confirm.'
        : mine.map((note, index) => (index + 1) + '. ' + note.text).join('\n\n') + '\n\nEnter the note number to delete:',
    );
    if (choice === null) return 'Cleanup cancelled.';
    if (mine.length === 1 && choice.trim().toLowerCase() !== 'banana') return 'Cleanup cancelled. Nothing was deleted.';
    const index = mine.length === 1 ? 0 : Number(choice) - 1;
    const note = mine[index];
    if (!note) return 'That note was not found.';
    const deleted = await deleteWorldNote(note.id);
    return deleted ? 'BANANA accepted. Your world note was deleted.' : 'Could not delete that note.';
  }

  private closeGamebook() {
    if (!this.gamebookOpen || !this.gamebookOverlay) return;
    this.gamebookOpen = false;
    const overlay = this.gamebookOverlay;
    this.gamebookOverlay = undefined;
    this.tweens.add({ targets: overlay, alpha: 0, duration: 140, onComplete: () => overlay.destroy() });
  }

  private savePrivateNotes() {
    try { window.localStorage.setItem(GAMEBOOK_KEY, JSON.stringify(this.privateNotes)); } catch { /* optional */ }
  }

  private loadPrivateNotes() {
    try {
      const raw = window.localStorage.getItem(GAMEBOOK_KEY);
      if (raw) this.privateNotes = JSON.parse(raw) as PrivateNote[];
    } catch { this.privateNotes = []; }
  }

  private createAmbientSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const gain = context.createGain();
      gain.gain.value = 0.018;
      gain.connect(context.destination);
      this.ambientGain = gain;
      const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(context.currentTime + index * 0.55);
        oscillator.stop(context.currentTime + 0.55 * notes.length + 0.8);
        this.ambientOscillators.push(oscillator);
      });
      context.resume().catch(() => undefined);
    } catch { /* audio is optional */ }
  }

  private stopAmbientSound() {
    this.ambientGain?.disconnect();
    this.ambientOscillators = [];
    this.ambientGain = undefined;
  }
}
