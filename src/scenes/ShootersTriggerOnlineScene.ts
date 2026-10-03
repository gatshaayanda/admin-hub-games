import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1400;
const PLAYER_KEY = 'admin-hub-games:shooters-trigger-player';

type RemotePlayer = {
  body: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  poseA: Phaser.GameObjects.Graphics;
  poseB: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Ellipse;
  color: number;
  lastX: number;
  lastY: number;
};

export class ShootersTriggerOnlineScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();

  private client: any;
  private room: any;
  private localSessionId = '';
  private players = new Map<string, RemotePlayer>();
  private cleanupControls?: () => void;
  private moveVector = new Phaser.Math.Vector2();
  private aim = new Phaser.Math.Vector2(1, 0);
  private fire = false;
  private sendClock = 0;
  private modal?: HTMLDivElement;
  private status?: Phaser.GameObjects.Text;
  private scoreHud?: Phaser.GameObjects.Text;
  private roundState = 'CONNECTING';
  private lastRoomId = '';
  private name = 'PLAYER';
  private animClock = 0;
  private phaseGuide?: Phaser.GameObjects.Container;

  constructor() {
    super('ShootersTriggerOnlineScene');
  }

  create() {
    this.name = this.readName();
    this.cameras.main.setBackgroundColor('#78a653');
    this.drawField();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setScroll(0, 0);

    this.status = this.add.text(this.scale.width / 2, 74, 'ONLINE ARENA · CONNECTING', {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: '#fff4d4', backgroundColor: '#2b2118',
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
    }).setOrigin(.5).setScrollFactor(0).setDepth(200);

    this.drawOnlinePhaseGuide();

    this.scoreHud = this.add.text(this.scale.width / 2, 22, '', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#2b2118', strokeThickness: 4,
    }).setOrigin(.5).setScrollFactor(0).setDepth(200);

    this.installLobbyModal();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.fire = false;
      this.joystickVector.set(0, 0);
      this.cleanupControls?.();
      this.cleanupControls = undefined;
      this.modal?.remove();
      this.modal = undefined;
      this.room?.leave?.();
      this.room = undefined;
      this.players.forEach((player) => this.destroyRemote(player));
      this.players.clear();
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time: number, delta: number) {
    this.animClock += delta;
    this.sendClock += delta;
    this.updateLocalPrediction(delta);
    this.updateRemotePlayers(delta);

    if (this.room && this.sendClock >= 50) {
      this.sendClock = 0;
      this.room.send('input', {
        moveX: this.moveVector.x,
        moveY: this.moveVector.y,
        aimX: this.aim.x,
        aimY: this.aim.y,
        fire: this.fire,
      });
    }

    this.updateHud();
  }

  public setMoveVector(x: number, y: number) {
    this.moveVector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
    this.joystickVector.copy(this.moveVector);
  }

  public setFireHeld(value: boolean) {
    this.fire = value;
  }

  public setAimVector(x: number, y: number) {
    const length = Math.hypot(x, y);
    if (length > 0.05) this.aim.set(x / length, y / length);
  }

  public isFireAvailable() {
    return Boolean(this.room) && this.roundState === 'LIVE';
  }

  public isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  private async connect(create: boolean, roomId = '') {
    try {
      this.status?.setText(create ? 'ONLINE ARENA · CREATING MATCH' : 'ONLINE ARENA · JOINING MATCH');
      const module = await this.loadColyseus();
      this.client = new module.Client(this.serverUrl());
      this.room = create
        ? await this.client.create('shooters_online', { name: this.name })
        : await this.client.joinById(roomId.trim(), { name: this.name });

      this.localSessionId = this.room.sessionId;
      this.lastRoomId = this.room.id;
      this.roundState = this.room.state.status || 'WAITING';
      this.modal?.remove();
      this.modal = undefined;
      this.status?.setText('ONLINE ARENA · WAITING FOR OPPONENT');
      const localPlayer = this.createWorldPlayerIfNeeded(this.localSessionId);
      this.cameras.main.startFollow(localPlayer.body, true, 0.12, 0.12);
      this.cameras.main.setDeadzone(Math.min(this.scale.width * .28, 320), Math.min(this.scale.height * .22, 150));
      this.status?.setText('ROOM CODE · ' + this.lastRoomId + ' · SHARE THIS CODE');

      this.room.onStateChange((state: any) => {
        this.roundState = state.status || 'WAITING';
        for (const [id, player] of state.players) {
          const remote = this.players.get(id) ?? this.createWorldPlayerIfNeeded(id);
          if (!remote) continue;
          remote.lastX = Number(player.x);
          remote.lastY = Number(player.y);
          remote.color = Number(player.color);
          remote.label.setText(String(player.name || 'PLAYER'));
          if (id === this.localSessionId) {
            remote.body.x = remote.lastX;
            remote.body.y = remote.lastY;
          }
        }
        this.updateHud();
      });

      this.room.onLeave(() => {
        this.roundState = 'DISCONNECTED';
        this.status?.setText('ONLINE ARENA · CONNECTION LOST');
        this.fire = false;
      });
      this.room.onError(() => {
        this.roundState = 'ERROR';
        this.status?.setText('ONLINE ARENA · CONNECTION ERROR');
      });

      this.cleanupControls = installShootersTriggerMobileControls();
      this.createDesktopControls();
    } catch (error) {
      console.error(error);
      this.status?.setText('ONLINE ARENA · COULD NOT CONNECT');
      this.showConnectionError(error instanceof Error ? error.message : 'Connection failed');
    }
  }

  private serverUrl() {
    const configured = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_COLYSEUS_URL;
    return configured || 'http://localhost:2567';
  }

  private async loadColyseus() {
    const importer = new Function('url', 'return import(url)') as (url: string) => Promise<any>;
    return importer('https://esm.sh/@colyseus/sdk@0.18.4');
  }

  private installLobbyModal() {
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed', inset: '0', zIndex: '1500', display: 'grid', placeItems: 'center',
      padding: '22px', background: 'rgba(12,18,14,.78)', fontFamily: 'monospace', touchAction: 'manipulation',
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(460px,92vw)', padding: '24px', border: '2px solid #4fc3b1',
      borderRadius: '14px', background: '#151a16', color: '#f4f1df',
      textAlign: 'center', boxShadow: '0 12px 36px rgba(0,0,0,.4)',
    });

    const title = document.createElement('div');
    title.textContent = 'ONLINE ARENA';
    Object.assign(title.style, { fontSize: '20px', fontWeight: '900', color: '#4fc3b1', letterSpacing: '1px' });

    const identity = document.createElement('div');
    identity.textContent = 'PLAYER · ' + this.name;
    Object.assign(identity.style, { marginTop: '9px', fontSize: '10px', color: '#e8c95c', fontWeight: '800' });

    const note = document.createElement('div');
    note.textContent = 'Your game name is already loaded. No second name entry.';
    Object.assign(note.style, { margin: '14px 0 18px', fontSize: '10px', lineHeight: '1.55', opacity: '.82' });

    const create = this.makeButton('CREATE MATCH', true, () => void this.connect(true));
    const divider = document.createElement('div');
    divider.textContent = 'OR JOIN A FRIEND';
    Object.assign(divider.style, { margin: '16px 0 8px', fontSize: '8px', opacity: '.55', letterSpacing: '1px' });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'ROOM CODE';
    input.autocomplete = 'off';
    input.spellcheck = false;
    Object.assign(input.style, {
      width: '100%', boxSizing: 'border-box', minHeight: '48px', padding: '0 12px',
      border: '1px solid #4fc3b1', borderRadius: '8px', background: '#102018',
      color: '#f4f1df', font: '800 15px monospace', textAlign: 'center',
    });

    const join = this.makeButton('JOIN MATCH', false, () => {
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      void this.connect(false, input.value);
    });

    const back = this.makeButton('BACK TO FIELD', false, () => this.scene.start('ShootersTriggerLobbyScene'));

    card.append(title, identity, note, create, divider, input, join, back);
    modal.appendChild(card);
    document.body.appendChild(modal);
    this.modal = modal;
  }

  private makeButton(label: string, primary: boolean, onClick: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    Object.assign(button.style, {
      width: '100%', minHeight: '48px', marginTop: '9px', borderRadius: '8px',
      border: primary ? '0' : '2px solid #f4f1df',
      background: primary ? '#e8c95c' : '#102018',
      color: primary ? '#151a16' : '#f4f1df',
      fontFamily: 'monospace', fontSize: '10px', fontWeight: '900',
      touchAction: 'manipulation',
    });
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  private createDesktopControls() {
    this.input.keyboard?.on('keydown-W', () => this.setMoveVector(this.moveVector.x, -1));
    this.input.keyboard?.on('keydown-S', () => this.setMoveVector(this.moveVector.x, 1));
    this.input.keyboard?.on('keydown-A', () => this.setMoveVector(-1, this.moveVector.y));
    this.input.keyboard?.on('keydown-D', () => this.setMoveVector(1, this.moveVector.y));
    this.input.keyboard?.on('keyup-W', () => this.setMoveVector(this.moveVector.x, 0));
    this.input.keyboard?.on('keyup-S', () => this.setMoveVector(this.moveVector.x, 0));
    this.input.keyboard?.on('keyup-A', () => this.setMoveVector(0, this.moveVector.y));
    this.input.keyboard?.on('keyup-D', () => this.setMoveVector(0, this.moveVector.y));
  }

  private updateLocalPrediction(delta: number) {
    const local = this.players.get(this.localSessionId);
    if (!local || !this.room) return;
    const length = this.moveVector.length();
    if (!length) return;
    const speed = 170 * delta / 1000;
    const nextX = Phaser.Math.Clamp(local.body.x + (this.moveVector.x / length) * speed, 42, WORLD_WIDTH - 42);
    const nextY = Phaser.Math.Clamp(local.body.y + (this.moveVector.y / length) * speed, 90, WORLD_HEIGHT - 50);
    local.body.x = nextX;
    local.body.y = nextY;
    local.shadow.setPosition(local.body.x, local.body.y + 34);
    local.label.setPosition(local.body.x, local.body.y - 50);
  }

  private updateRemotePlayers(_delta: number) {
    for (const [id, player] of this.players) {
      if (id === this.localSessionId) continue;
      player.body.x = Phaser.Math.Linear(player.body.x, player.lastX, 0.24);
      player.body.y = Phaser.Math.Linear(player.body.y, player.lastY, 0.24);
      player.shadow.setPosition(player.body.x, player.body.y + 34);
      player.label.setPosition(player.body.x, player.body.y - 50);
      const step = player.lastX !== player.body.x || player.lastY !== player.body.y ? 115 : 650;
      const poseB = Math.floor(this.animClock / step) % 2 === 1;
      player.poseA.setVisible(!poseB);
      player.poseB.setVisible(poseB);
    }
  }

  private createWorldPlayerIfNeeded(id: string): RemotePlayer {
    const existing = this.players.get(id);
    if (existing) return existing;

    const placeholderColor = id === this.localSessionId ? 0x2f6b4e : 0x9b3f3f;
    const body = this.add.container(id === this.localSessionId ? 360 : 2040, id === this.localSessionId ? 1040 : 430).setDepth(30);
    const shadow = this.add.ellipse(0, 34, 27, 10, 0x3d3025, 0.28);
    const poseA = this.makePose(placeholderColor, 0);
    const poseB = this.makePose(placeholderColor, 1).setVisible(false);
    body.add([shadow, poseA, poseB]);
    const label = this.add.text(body.x, body.y - 50, id === this.localSessionId ? this.name : 'OPPONENT', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#2d5d35', strokeThickness: 4,
    }).setOrigin(.5).setDepth(40);
    const player: RemotePlayer = { body, label, poseA, poseB, shadow, color: placeholderColor, lastX: body.x, lastY: body.y };
    this.players.set(id, player);
    return player;
  }

  private makePose(color: number, bob: number) {
    const g = this.add.graphics();
    g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20 + bob, 24, 18);
    g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17 + bob, 13, 12);
    g.fillStyle(color, 1).fillEllipse(0, -23 + bob, 25, 12);
    g.fillStyle(0x111715, 1).fillRoundedRect(-13, -17 + bob, 26, 10, 4);
    g.fillStyle(0x9bb9b1, 0.88).fillRoundedRect(-9, -15 + bob, 18, 6, 2);
    g.fillStyle(color, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
    g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1 + bob, 20, 14, 4);
    g.fillStyle(0x1d2923, 1).fillRect(-12, 12 + bob, 24, 5);
    g.fillStyle(0x566052, 1).fillRoundedRect(-10, 20 + bob, 8, 13, 2).fillRoundedRect(2, 20 + bob, 8, 13, 2);
    g.fillStyle(0x202522, 1).fillRoundedRect(-12, 30 + bob, 10, 7, 2).fillRoundedRect(2, 30 + bob, 10, 7, 2);
    return g;
  }

  private drawField() {
    const g = this.add.graphics();
    g.fillStyle(0x78a653, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0x86ad5e, 0.42).fillRect(0, 0, WORLD_WIDTH * .5, WORLD_HEIGHT);
    g.fillStyle(0x679346, 0.32).fillRect(WORLD_WIDTH * .5, 0, WORLD_WIDTH * .5, WORLD_HEIGHT);
    g.fillStyle(0xd1b46c, .30).fillRect(0, 510, WORLD_WIDTH, 92);
    g.fillStyle(0xd1b46c, .22).fillRect(870, 0, 100, WORLD_HEIGHT);
    g.lineStyle(5, 0xf4f1df, .48).strokeRect(55, 70, WORLD_WIDTH - 110, WORLD_HEIGHT - 120);

    this.drawTree(300, 280, 1.15);
    this.drawTree(2050, 300, .95);
    this.drawTree(350, 1110, .90);
    this.drawTree(2070, 1090, 1.10);
    this.drawBunker(690, 360, 190, 72, 0x76563b);
    this.drawBunker(1470, 350, 230, 76, 0x5f6e69);
    this.drawBunker(520, 760, 250, 70, 0x9d754d);
    this.drawBunker(1570, 760, 220, 68, 0x6e8190);
    this.drawBunker(850, 1030, 260, 74, 0xb58c58);
    this.drawBunker(1420, 1080, 240, 72, 0x737b79);
    this.drawTireStack(1080, 300);
    this.drawTireStack(1900, 650);
    this.drawTireStack(730, 1170);

    this.drawOnlineLandscape();

    this.add.text(1180, 118, 'ONLINE ARENA · TWO PLAYER FIELD', {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#2d5d35', strokeThickness: 5,
    }).setOrigin(.5).setDepth(10);
  }

  private drawOnlineLandscape() {
    // Presentation only. Existing movement/combat geometry remains unchanged.
    const ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x8f754d, 0.18).fillEllipse(1180, 710, 760, 180);
    ground.fillStyle(0x5f7445, 0.14).fillEllipse(1180, 710, 1100, 360);

    this.drawDirtTrack(1180, 0, 1400);
    this.drawBush(170, 470, 1.2);
    this.drawBush(430, 260, 0.8);
    this.drawBush(2190, 470, 1.1);
    this.drawBush(2280, 900, 0.85);
    this.drawBush(250, 880, 0.95);
    this.drawBush(1160, 1260, 1.1);
    this.drawBush(1330, 220, 0.7);

    this.drawFenceLine(120, 190, 520);
    this.drawFenceLine(1760, 190, 520);
    this.drawFenceLine(120, 1210, 520);
    this.drawFenceLine(1760, 1210, 520);

    this.drawStartMarker(360, 1040, 0x2f6b4e, 'PLAYER 1');
    this.drawStartMarker(2040, 430, 0x9b3f3f, 'PLAYER 2');
    this.drawCenterMarker(1200, 700);
  }

  private drawDirtTrack(x: number, y: number, height: number) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0xb69a68, 0.18).fillRoundedRect(x - 62, y, 124, height, 62);
    g.lineStyle(2, 0xd8bf8a, 0.18);
    for (let offset = 70; offset < height; offset += 120) {
      g.lineBetween(x - 38, offset, x - 18, offset + 26);
      g.lineBetween(x + 22, offset + 34, x + 42, offset + 62);
    }
  }

  private drawBush(x: number, y: number, scale: number) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x56633e, 0.72)
      .fillCircle(x, y, 22 * scale)
      .fillCircle(x - 18 * scale, y + 5 * scale, 16 * scale)
      .fillCircle(x + 20 * scale, y + 7 * scale, 18 * scale);
    g.fillStyle(0x6f7b4b, 0.5).fillCircle(x - 3 * scale, y - 10 * scale, 13 * scale);
  }

  private drawFenceLine(x: number, y: number, width: number) {
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(2, 0x725f43, 0.45);
    g.lineBetween(x, y, x + width, y);
    for (let post = x; post <= x + width; post += 65) {
      g.fillStyle(0x725f43, 0.7).fillRect(post - 2, y - 12, 4, 24);
    }
  }

  private drawStartMarker(x: number, y: number, color: number, label: string) {
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(3, color, 0.72).strokeCircle(x, y, 48);
    g.lineStyle(1, 0xf4f1df, 0.35).strokeCircle(x, y, 62);
    this.add.text(x, y + 66, label, {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#493526', strokeThickness: 3,
    }).setOrigin(.5).setDepth(7);
  }

  private drawCenterMarker(x: number, y: number) {
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(2, 0xf4f1df, 0.24).strokeCircle(x, y, 72);
    g.lineStyle(1, 0xf4f1df, 0.18).strokeCircle(x, y, 90);
    this.add.text(x, y + 96, 'DUEL ZONE', {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#493526', strokeThickness: 3,
    }).setOrigin(.5).setDepth(7);
  }

  private drawOnlinePhaseGuide() {
    const panel = this.add.rectangle(0, 0, 1, 1, 0x151a16, 0.92)
      .setOrigin(.5).setStrokeStyle(1, 0x4fc3b1, 0.65);
    const title = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#4fc3b1', align: 'center',
    }).setOrigin(.5);
    const steps = this.add.text(0, 0, '1 CREATE  ·  2 SHARE CODE  ·  3 FRIEND JOINS  ·  4 FIGHT', {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
      color: '#f4f1df', align: 'center',
    }).setOrigin(.5);
    this.phaseGuide = this.add.container(this.scale.width / 2, 104, [panel, title, steps])
      .setScrollFactor(0).setDepth(205);
    const resize = () => {
      const width = Math.min(this.scale.width - 24, 640);
      panel.setSize(width, 58);
      title.setPosition(0, -15);
      steps.setPosition(0, 9);
      steps.setWordWrapWidth(width - 24);
    };
    resize();
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resize);
      this.phaseGuide?.destroy();
      this.phaseGuide = undefined;
    });
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1).fillCircle(x, y, 34 * scale).fillCircle(x - 28 * scale, y + 9 * scale, 28 * scale).fillCircle(x + 28 * scale, y + 9 * scale, 29 * scale);
    g.fillStyle(0x526d3c, .75).fillCircle(x + 5 * scale, y - 16 * scale, 23 * scale);
  }

  private drawBunker(x: number, y: number, width: number, height: number, color: number) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, .24).fillRect(x + 8, y + 9, width, height);
    g.fillStyle(color, 1).fillRoundedRect(x, y, width, height, 10);
    g.fillStyle(0xffffff, .12).fillRect(x + 12, y + 10, width - 24, 5);
    g.lineStyle(2, 0xf4f1df, .28).strokeRoundedRect(x, y, width, height, 10);
  }

  private drawTireStack(x: number, y: number) {
    const g = this.add.graphics();
    for (let index = 0; index < 3; index += 1) {
      g.fillStyle(0x202622, 1).fillCircle(x + index * 22, y, 25);
      g.lineStyle(4, 0x4b554d, 1).strokeCircle(x + index * 22, y, 17);
      g.fillStyle(0x141916, 1).fillCircle(x + index * 22, y, 7);
    }
  }

  private updateHud() {
    const local = this.players.get(this.localSessionId);
    const others = [...this.players.entries()].filter(([id]) => id !== this.localSessionId);
    const opponent = others[0]?.[1];
    const opponentName = opponent?.label.text || 'WAITING';
    this.scoreHud?.setText(
      this.roundState === 'FINISHED'
        ? 'MATCH FINISHED'
        : (this.roundState === 'LIVE' ? this.name + '  VS  ' + opponentName : this.name + '  ·  WAITING FOR PLAYER 2')
    );
    if (this.roundState === 'LIVE') {
      this.status?.setText('ONLINE ARENA · LIVE · FIRST TO 3');
    } else if (this.roundState === 'WAITING') {
      this.status?.setText(this.lastRoomId
        ? 'ROOM CODE · ' + this.lastRoomId + ' · WAITING FOR PLAYER 2'
        : 'ONLINE ARENA · CREATE OR JOIN A MATCH');
    }
    const guideTitle = this.phaseGuide?.list?.[1] as Phaser.GameObjects.Text | undefined;
    guideTitle?.setText(
      this.roundState === 'LIVE'
        ? 'PHASE 4 · MATCH LIVE · FIRST TO 3'
        : this.roundState === 'FINISHED'
          ? 'MATCH COMPLETE · RETURN TO FIELD'
          : 'PHASE 2–3 · GET YOUR FRIEND INTO THE SAME ROOM'
    );
  }

  private destroyRemote(player: RemotePlayer) {
    player.body.destroy();
    player.label.destroy();
    player.poseA.destroy();
    player.poseB.destroy();
    player.shadow.destroy();
  }

  private readName() {
    try {
      return localStorage.getItem(PLAYER_KEY)?.trim() || 'PLAYER';
    } catch {
      return 'PLAYER';
    }
  }

  private showConnectionError(message: string) {
    if (!this.modal) {
      const modal = document.createElement('div');
      Object.assign(modal.style, { position: 'fixed', inset: '0', zIndex: '1500', display: 'grid', placeItems: 'center', padding: '22px', background: 'rgba(12,18,14,.78)', fontFamily: 'monospace' });
      const card = document.createElement('div');
      Object.assign(card.style, { width: 'min(460px,92vw)', padding: '24px', border: '2px solid #d66a3d', borderRadius: '14px', background: '#151a16', color: '#f4f1df', textAlign: 'center' });
      card.innerHTML = '<div style="font-size:18px;font-weight:900;color:#d66a3d">ONLINE CONNECTION FAILED</div>';
      const note = document.createElement('div');
      note.textContent = message || 'The online server is not reachable.';
      note.style.cssText = 'font-size:10px;line-height:1.6;margin:14px 0;opacity:.8;';
      const back = this.makeButton('BACK TO FIELD', false, () => this.scene.start('ShootersTriggerLobbyScene'));
      card.append(note, back);
      modal.appendChild(card);
      document.body.appendChild(modal);
      this.modal = modal;
    }
  }
}
