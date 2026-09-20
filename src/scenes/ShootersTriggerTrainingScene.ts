import Phaser from 'phaser';

type Actor = {
  body: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  team: 'green' | 'orange';
  role: 'player' | 'operator' | 'heavy' | 'runner' | 'anchor';
  hp: number;
  maxHp: number;
  speed: number;
  startX: number;
  startY: number;
  alive: boolean;
  cooldown: number;
};

type Paintball = {
  body: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  owner: Actor;
  ttl: number;
};

type TouchState = {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
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
  private moveTouch?: TouchState;
  private aimTouch?: { id: number; x: number; y: number };
  private lastShot = 0;
  private teamScore = 0;
  private opponentScore = 0;
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private respawnText?: Phaser.GameObjects.Text;
  private touchUi!: Phaser.GameObjects.Graphics;
  private playerName = 'Player';
  private startedAt = 0;
  private worldWidth = 1800;
  private worldHeight = 1000;
  private isPhoneLayout = false;
  private readonly start = { x: 150, y: 500 };

  constructor() {
    super('ShootersTriggerTrainingScene');
  }

  create() {
    this.configureWorld();
    this.playerName = String(this.registry.get('shootersTriggerPlayer') || 'Player');
    this.startedAt = this.time.now;

    this.drawArena();
    this.createUi();
    this.touchUi = this.add.graphics().setDepth(200).setScrollFactor(0);

    this.keys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      fire: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.player = this.makeActor(this.start.x, this.start.y, 'green', 'player', this.playerName, 120);
    this.teammates = [
      this.makeActor(this.start.x + 65, this.start.y - this.teamSpacing(), 'green', 'operator', 'Operator 12', 150),
      this.makeActor(this.start.x + 65, this.start.y + this.teamSpacing(), 'green', 'heavy', 'The Heavy', 105),
    ];

    this.enemies = [
      this.makeActor(this.worldWidth - 270, this.worldHeight * 0.40, 'orange', 'runner', 'Runner', 145),
      this.makeActor(this.worldWidth - 270, this.worldHeight * 0.60, 'orange', 'anchor', 'Anchor', 95),
    ];

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player.body, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(this.isPhoneLayout ? this.scale.width * 0.18 : this.scale.width * 0.30, this.isPhoneLayout ? this.scale.height * 0.18 : this.scale.height * 0.28);
    this.cameras.main.setZoom(this.isPhoneLayout ? 1.12 : 1);

    this.input.addPointer(2);
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointercancel', this.handlePointerUp, this);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.off('pointercancel', this.handlePointerUp, this);
    });

    this.statusText.setText('TEAM TRAINING · MOVE WITH YOUR TEAM');
    this.updateUi();
    this.renderTouchUi();
  }

  private configureWorld() {
    this.isPhoneLayout = this.scale.height > this.scale.width * 1.12;
    this.worldWidth = this.isPhoneLayout ? 1450 : 1900;
    this.worldHeight = this.isPhoneLayout ? 2300 : 1080;
    this.start.x = this.worldWidth * 0.12;
    this.start.y = this.worldHeight * 0.50;
  }

  private handleResize(width: number, height: number) {
    const wasPhone = this.isPhoneLayout;
    const nextPhone = height > width * 1.12;
    if (wasPhone !== nextPhone) {
      this.scene.restart();
      return;
    }

    this.cameras.main.setDeadzone(nextPhone ? width * 0.18 : width * 0.30, nextPhone ? height * 0.18 : height * 0.28);
    this.cameras.main.setZoom(nextPhone ? 1.12 : 1);
    this.updateUiPositions();
  }

  update(_time: number, delta: number) {
    if (!this.player?.alive) return;

    this.updatePlayer(delta);
    this.updateTeammates(delta);
    this.updateEnemies(delta);
    this.updatePaintballs(delta);
    this.updateUi();
    this.renderTouchUi();

    if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
      this.fire(this.player, this.aim.x, this.aim.y);
    }

    if (this.time.now - this.startedAt > 300000) this.finish('TIME');
  }

  private drawArena() {
    const g = this.add.graphics();
    const w = this.worldWidth;
    const h = this.worldHeight;

    g.fillStyle(0x6f9e4d, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x83ad5d, 0.45).fillRect(0, 0, w, h * 0.50);
    g.fillStyle(0x5d8d43, 0.45).fillRect(0, h * 0.50, w, h * 0.50);

    // Grass variation makes the field read as an outdoor place rather than a flat green board.
    for (let i = 0; i < 180; i += 1) {
      const x = (i * 173.7) % w;
      const y = (i * 97.3) % h;
      g.lineStyle(i % 3 === 0 ? 2 : 1, i % 2 ? 0x47763a : 0x9abe70, 0.28);
      g.lineBetween(x, y, x + 4, y - 7);
    }

    // White boundary posts and a simple rope/fence line, matching the field language from the real session.
    for (let i = 0; i < 12; i += 1) {
      const x = 80 + i * ((w - 160) / 11);
      this.drawPost(g, x, 55);
      this.drawPost(g, x, h - 55);
    }
    g.lineStyle(3, 0xf4f1df, 0.45);
    g.lineBetween(80, 55, w - 80, 55);
    g.lineBetween(80, h - 55, w - 80, h - 55);

    // Green and orange starting areas.
    g.fillStyle(0x175c43, 0.24).fillRect(50, h * 0.34, w * 0.17, h * 0.32);
    g.lineStyle(3, 0xcde7bd, 0.55).strokeRect(50, h * 0.34, w * 0.17, h * 0.32);
    g.fillStyle(0x9b4b29, 0.18).fillRect(w - 50 - w * 0.17, h * 0.34, w * 0.17, h * 0.32);
    g.lineStyle(3, 0xffd4b7, 0.45).strokeRect(w - 50 - w * 0.17, h * 0.34, w * 0.17, h * 0.32);

    this.add.text(78, h * 0.34 + 18, 'GREEN BASE', {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#ecf8e8'
    }).setDepth(3);
    this.add.text(w - 78, h * 0.34 + 18, 'ORANGE BASE', {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#fff0df'
    }).setOrigin(1, 0).setDepth(3);

    this.drawBunkers();
    this.drawTrees();
    this.drawCylinders();
    this.drawTacticZone();
  }

  private drawPost(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x7b6d58, 1).fillRect(x - 3, y, 6, 26);
    g.fillStyle(0xf4f1df, 1).fillRect(x - 5, y - 10, 10, 13);
  }

  private drawBunkers() {
    const defs = this.isPhoneLayout
      ? [
          [0.22, 0.16, 0.46, 0.035, 0x9d754d],
          [0.08, 0.27, 0.58, 0.045, 0x6e8190],
          [0.48, 0.36, 0.40, 0.042, 0xb58c58],
          [0.10, 0.48, 0.46, 0.045, 0x6e8190],
          [0.44, 0.59, 0.48, 0.040, 0xb58c58],
          [0.08, 0.72, 0.56, 0.045, 0x6e8190],
          [0.24, 0.84, 0.52, 0.035, 0x9d754d],
        ]
      : [
          [0.21, 0.23, 0.12, 0.09, 0x9d754d],
          [0.35, 0.42, 0.16, 0.10, 0x6e8190],
          [0.52, 0.22, 0.13, 0.08, 0xb58c58],
          [0.65, 0.62, 0.15, 0.09, 0x6e8190],
          [0.79, 0.40, 0.12, 0.08, 0xb58c58],
          [0.51, 0.76, 0.16, 0.09, 0x6e8190],
        ];

    for (const [nx, ny, nw, nh, color] of defs) {
      const x = Number(nx) * this.worldWidth;
      const y = Number(ny) * this.worldHeight;
      const cw = Number(nw) * this.worldWidth;
      const ch = Math.max(28, Number(nh) * this.worldHeight);
      const g = this.add.graphics();
      g.fillStyle(Number(color), 1).fillRect(x, y, cw, ch);
      g.fillStyle(0x554a3e, 0.40).fillRect(x, y + ch - 7, cw, 7);
      g.lineStyle(2, 0xf0d7aa, 0.45).strokeRect(x, y, cw, ch);
      this.covers.push(new Phaser.Geom.Rectangle(x, y, cw, ch));
    }
  }

  private drawTrees() {
    const positions = this.isPhoneLayout
      ? [
          [0.12, 0.12, 1.1], [0.82, 0.12, 0.9], [0.90, 0.31, 0.75],
          [0.14, 0.43, 0.9], [0.86, 0.52, 1.05], [0.13, 0.67, 0.8],
          [0.88, 0.77, 0.9], [0.12, 0.90, 1.0],
        ]
      : [
          [0.15, 0.20, 1.1], [0.39, 0.16, 0.75], [0.60, 0.86, 0.85],
          [0.88, 0.27, 0.9], [0.92, 0.78, 1.0], [0.08, 0.78, 0.8],
        ];

    for (const [nx, ny, scale] of positions) {
      this.drawTree(Number(nx) * this.worldWidth, Number(ny) * this.worldHeight, Number(scale));
    }
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x715437, 1).fillRect(x - 6 * scale, y + 17 * scale, 12 * scale, 45 * scale);
    g.fillStyle(0x315f39, 1).fillCircle(x, y, 31 * scale);
    g.fillStyle(0x47733a, 1).fillCircle(x - 22 * scale, y + 9 * scale, 23 * scale);
    g.fillStyle(0x56883f, 1).fillCircle(x + 23 * scale, y + 8 * scale, 25 * scale);
    g.fillStyle(0x7ba95a, 0.65).fillCircle(x + 5 * scale, y - 10 * scale, 12 * scale);
  }

  private drawCylinders() {
    const points = this.isPhoneLayout
      ? [[0.77, 0.22], [0.27, 0.35], [0.77, 0.47], [0.26, 0.63], [0.73, 0.78]]
      : [[0.28, 0.68], [0.45, 0.30], [0.70, 0.72], [0.77, 0.28]];

    for (const [nx, ny] of points) {
      const x = Number(nx) * this.worldWidth;
      const y = Number(ny) * this.worldHeight;
      const g = this.add.graphics();
      g.fillStyle(0x7d5d40, 1).fillEllipse(x, y, 34, 24);
      g.fillStyle(0xb58a58, 1).fillEllipse(x, y - 10, 34, 24);
      g.lineStyle(2, 0x4d3b2b, 0.7).strokeEllipse(x, y - 10, 34, 24);
      this.covers.push(new Phaser.Geom.Rectangle(x - 17, y - 20, 34, 30));
    }
  }

  private drawTacticZone() {
    const x = this.worldWidth * 0.50;
    const y = this.worldHeight * 0.50;
    const r = Math.min(this.worldWidth, this.worldHeight) * 0.10;
    const g = this.add.graphics();
    g.fillStyle(0x315a37, 0.72).fillCircle(x, y, r);
    g.lineStyle(4, 0xe8c95c, 0.8).strokeCircle(x, y, r);
    this.add.text(x, y, 'TACTIC\nZONE', {
      fontFamily: 'monospace', fontSize: this.isPhoneLayout ? '15px' : '18px',
      fontStyle: 'bold', color: '#f4f1df', align: 'center'
    }).setOrigin(0.5).setDepth(4);
  }

  private createUi() {
    this.scoreText = this.add.text(this.scale.width * 0.50, 12, '', {
      fontFamily: 'monospace', fontSize: this.uiFont(12), fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#17261b',
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(180);

    this.statusText = this.add.text(this.scale.width * 0.50, this.isPhoneLayout ? 56 : 20, '', {
      fontFamily: 'monospace', fontSize: this.uiFont(10), fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#17261b',
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(180);

    this.hintText = this.add.text(this.scale.width * 0.50, this.scale.height - (this.isPhoneLayout ? 32 : 20),
      this.isPhoneLayout ? 'TOUCH LEFT TO MOVE  ·  TOUCH RIGHT TO AIM + FIRE' : 'DESKTOP: WASD + MOUSE CLICK/SPACE',
      {
        fontFamily: 'monospace', fontSize: this.uiFont(8), color: '#f4f1df',
        backgroundColor: '#17261b', padding: { left: 9, right: 9, top: 6, bottom: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(180);

    this.updateUiPositions();
  }

  private updateUiPositions() {
    if (!this.scoreText) return;
    this.scoreText.setPosition(this.scale.width * 0.50, 12);
    this.statusText.setPosition(this.scale.width * 0.50, this.isPhoneLayout ? 56 : 20);
    this.hintText.setPosition(this.scale.width * 0.50, this.scale.height - (this.isPhoneLayout ? 32 : 20));
  }

  private makeActor(x: number, y: number, team: Actor['team'], role: Actor['role'], name: string, hp: number): Actor {
    const size = this.actorSize(role);
    const body = this.add.container(x, y).setDepth(30);
    this.drawSuit(body, team, role, size);

    const label = this.add.text(x, y - size * 0.95, name, {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '10px' : '11px',
      fontStyle: 'bold', color: '#ffffff', backgroundColor: '#203423',
      padding: { left: 5, right: 5, top: 3, bottom: 3 },
    }).setOrigin(0.5, 1).setDepth(31);

    return {
      body, label, team, role, hp, maxHp: hp,
      speed: role === 'heavy' ? 78 : role === 'operator' ? 118 : 104,
      startX: x, startY: y, alive: true, cooldown: 0,
    };
  }

  private drawSuit(container: Phaser.GameObjects.Container, team: Actor['team'], role: Actor['role'], size: number) {
    const g = this.add.graphics();
    const teamMain = team === 'green' ? 0x176b4b : 0xc85d2e;
    const teamLight = team === 'green' ? 0x55a878 : 0xe58a52;
    const vest = team === 'green' ? 0x214e3f : 0x71402f;
    const skin = 0xc99262;
    const mask = 0x17201e;

    // Shadow, boots, trousers, protective vest, arms, helmet and paintball mask.
    g.fillStyle(0x243323, 0.30).fillEllipse(0, size * 0.54, size * 1.35, size * 0.45);
    g.fillStyle(0x20282a, 1).fillRect(-size * 0.38, size * 0.25, size * 0.28, size * 0.38);
    g.fillStyle(0x20282a, 1).fillRect(size * 0.10, size * 0.25, size * 0.28, size * 0.38);
    g.fillStyle(0x3c4b43, 1).fillRect(-size * 0.36, size * 0.02, size * 0.30, size * 0.30);
    g.fillStyle(0x3c4b43, 1).fillRect(size * 0.06, size * 0.02, size * 0.30, size * 0.30);
    g.fillStyle(vest, 1).fillRect(-size * 0.46, -size * 0.12, size * 0.92, size * 0.48);
    g.fillStyle(teamMain, 1).fillRect(-size * 0.40, -size * 0.08, size * 0.80, size * 0.35);
    g.fillStyle(teamLight, 0.8).fillRect(-size * 0.08, -size * 0.08, size * 0.16, size * 0.35);
    g.fillStyle(skin, 1).fillRect(-size * 0.64, -size * 0.03, size * 0.18, size * 0.35);
    g.fillStyle(skin, 1).fillRect(size * 0.46, -size * 0.03, size * 0.18, size * 0.35);
    g.fillStyle(0x111715, 1).fillRect(-size * 0.56, -size * 0.42, size * 1.12, size * 0.18);
    g.fillStyle(0x37433f, 1).fillCircle(0, -size * 0.42, size * 0.31);
    g.fillStyle(mask, 1).fillRect(-size * 0.34, -size * 0.43, size * 0.68, size * 0.23);
    g.fillStyle(0x9bc4bd, 0.65).fillRect(-size * 0.27, -size * 0.39, size * 0.54, size * 0.10);
    g.fillStyle(teamLight, 0.95).fillRect(-size * 0.47, -size * 0.17, size * 0.18, size * 0.09);

    // Role silhouettes: Heavy has a broader vest/shoulder profile; Operator is slimmer.
    if (role === 'heavy' || role === 'anchor') {
      g.fillStyle(vest, 1).fillRect(-size * 0.58, -size * 0.16, size * 1.16, size * 0.15);
    }
    if (role === 'operator' || role === 'runner') {
      g.fillStyle(teamLight, 0.75).fillRect(-size * 0.52, -size * 0.08, size * 0.12, size * 0.28);
      g.fillStyle(teamLight, 0.75).fillRect(size * 0.40, -size * 0.08, size * 0.12, size * 0.28);
    }

    container.add(g);
  }

  private actorSize(role?: Actor['role']) {
    const base = Phaser.Math.Clamp(Math.min(this.scale.width, this.scale.height) * (this.isPhoneLayout ? 0.105 : 0.055), 30, 48);
    return role === 'heavy' || role === 'anchor' ? base * 1.16 : base;
  }

  private teamSpacing() {
    return Phaser.Math.Clamp(this.worldHeight * 0.055, 62, 100);
  }

  private updatePlayer(delta: number) {
    const pointer = this.input.activePointer;
    let moveX = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
    let moveY = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);

    if (this.moveTouch) {
      moveX = Phaser.Math.Clamp((this.moveTouch.x - this.moveTouch.startX) / this.touchRadius(), -1, 1);
      moveY = Phaser.Math.Clamp((this.moveTouch.y - this.moveTouch.startY) / this.touchRadius(), -1, 1);
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 0.05) {
      moveX /= Math.max(1, len);
      moveY /= Math.max(1, len);
      this.moveActor(this.player, moveX * this.player.speed * delta / 1000, moveY * this.player.speed * delta / 1000);
    }

    const aimPoint = this.aimTouch
      ? this.cameraWorldPoint(this.aimTouch.x, this.aimTouch.y)
      : (pointer.isDown && pointer.x > this.scale.width * 0.50
        ? this.cameraWorldPoint(pointer.x, pointer.y)
        : undefined);

    if (aimPoint) {
      const dx = aimPoint.x - this.player.body.x;
      const dy = aimPoint.y - this.player.body.y;
      const length = Math.hypot(dx, dy) || 1;
      this.aim = { x: dx / length, y: dy / length };

      if (this.time.now - this.lastShot > 280) {
        this.fire(this.player, this.aim.x, this.aim.y);
      }
    }
  }

  private cameraWorldPoint(x: number, y: number) {
    return this.cameras.main.getWorldPoint(x, y);
  }

  private updateTeammates(delta: number) {
    this.teammates.forEach((mate, index) => {
      if (!mate.alive) return;

      const followDistance = this.isPhoneLayout ? 80 : 105;
      const targetX = this.player.body.x - 85;
      const targetY = this.player.body.y + (index === 0 ? -followDistance : followDistance);
      const dx = targetX - mate.body.x;
      const dy = targetY - mate.body.y;
      const len = Math.hypot(dx, dy) || 1;

      if (len > 36) {
        this.moveActor(mate, dx / len * mate.speed * 0.55 * delta / 1000, dy / len * mate.speed * 0.55 * delta / 1000);
      }

      mate.cooldown -= delta;
      const enemy = this.nearestEnemy(mate);
      if (enemy && mate.cooldown <= 0) {
        this.fire(mate, enemy.body.x - mate.body.x, enemy.body.y - mate.body.y);
        mate.cooldown = mate.role === 'operator' ? 850 : 1150;
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
      const len = Math.hypot(dx, dy) || 1;
      const advance = this.isPhoneLayout ? 0.22 : 0.28;

      if (index === 0 || enemy.role === 'runner') {
        this.moveActor(enemy, dx / len * enemy.speed * advance * delta / 1000, dy / len * enemy.speed * advance * delta / 1000);
      }

      if (enemy.cooldown <= 0 && len < this.worldWidth * 0.44) {
        this.fire(enemy, dx, dy);
        enemy.cooldown = enemy.role === 'anchor' ? 1350 : 950;
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
        ball.body.x < -20 || ball.body.x > this.worldWidth + 20 ||
        ball.body.y < -20 || ball.body.y > this.worldHeight + 20 ||
        this.hitCover(ball.body.x, ball.body.y)
      ) {
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        continue;
      }

      const targets = ball.owner.team === 'green' ? this.enemies : [this.player, ...this.teammates];
      const target = targets.find((actor) =>
        actor.alive && Phaser.Math.Distance.Between(ball.body.x, ball.body.y, actor.body.x, actor.body.y) < this.actorSize() * 0.72
      );

      if (target) {
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        this.hitActor(target, ball.owner);
      }
    }
  }

  private hitActor(target: Actor, shooter: Actor) {
    target.hp -= 40;

    this.tweens.add({ targets: target.body, alpha: 0.35, duration: 80, yoyo: true, repeat: 2 });
    if (target === this.player) this.cameras.main.shake(120, 0.004);

    if (target.hp > 0) {
      this.statusText.setText(target === this.player ? 'PAINT HIT · BREAK LINE' : target.label.text + ' HIT');
      return;
    }

    if (target === this.player) {
      this.opponentScore += 1;
      this.respawnPlayer();
    } else {
      if (target.team === 'orange') this.teamScore += 1;
      this.respawnActor(target, target.startX, target.startY, 750);
    }

    if (this.teamScore >= 5 || this.opponentScore >= 5) {
      this.finish(this.teamScore >= 5 ? 'GREEN TEAM' : 'ORANGE TEAM');
    }

    this.statusText.setText(shooter.label.text + ' TAGGED ' + target.label.text);
  }

  private respawnPlayer() {
    this.player.alive = false;
    this.player.body.setVisible(false);
    this.player.label.setVisible(false);
    this.moveTouch = undefined;
    this.aimTouch = undefined;

    this.respawnText?.destroy();
    this.respawnText = this.add.text(this.scale.width / 2, this.scale.height * 0.50, 'HIT · RESETTING TO START', {
      fontFamily: 'monospace', fontSize: this.isPhoneLayout ? '15px' : '19px',
      fontStyle: 'bold', color: '#ffffff', backgroundColor: '#9d3e2b',
      padding: { left: 14, right: 14, top: 10, bottom: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

    this.time.delayedCall(this.isPhoneLayout ? 700 : 850, () => {
      if (this.teamScore >= 5 || this.opponentScore >= 5) return;

      this.player.body.setPosition(this.start.x, this.start.y);
      this.player.label.setPosition(this.start.x, this.start.y - this.actorSize('player') * 0.95);
      this.player.hp = this.player.maxHp;
      this.player.alive = true;
      this.player.body.setVisible(true);
      this.player.label.setVisible(true);
      this.cameras.main.startFollow(this.player.body, true, 0.12, 0.12);
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
      actor.label.setPosition(x, y - this.actorSize(actor.role) * 0.95);
      actor.body.setVisible(true);
      actor.label.setVisible(true);
    });
  }

  private finish(winner: string) {
    this.scene.pause();
    this.statusText.setText('TRAINING RESULT · ' + winner + ' WINS');
    this.hintText.setText(this.isPhoneLayout ? 'TAP TO RESTART TRAINING' : 'TAP / CLICK TO RESTART TRAINING');
    this.input.once('pointerdown', () => this.scene.restart());
    this.input.keyboard?.once('keydown', () => this.scene.restart());
  }

  private fire(owner: Actor, dx: number, dy: number) {
    const len = Math.hypot(dx, dy) || 1;
    const speed = this.isPhoneLayout ? 430 : 500;
    const radius = this.isPhoneLayout ? 5 : 5;

    const ball = this.add.circle(owner.body.x, owner.body.y, radius,
      owner.team === 'green' ? 0xe6f5d9 : 0xffbd86, 1
    ).setDepth(25);

    this.paintballs.push({
      body: ball,
      vx: dx / len * speed,
      vy: dy / len * speed,
      owner,
      ttl: 1250,
    });
    this.lastShot = this.time.now;
  }

  private moveActor(actor: Actor, dx: number, dy: number) {
    const margin = this.actorSize(actor.role) * 0.60;
    const nextX = Phaser.Math.Clamp(actor.body.x + dx, margin, this.worldWidth - margin);
    const nextY = Phaser.Math.Clamp(actor.body.y + dy, margin + 8, this.worldHeight - margin - 8);

    if (!this.hitCover(nextX, nextY, margin)) {
      actor.body.setPosition(nextX, nextY);
      actor.label.setPosition(nextX, nextY - this.actorSize(actor.role) * 0.95);
    }
  }

  private hitCover(x: number, y: number, radius = 3) {
    return this.covers.some((cover) =>
      x >= cover.x - radius &&
      x <= cover.x + cover.width + radius &&
      y >= cover.y - radius &&
      y <= cover.y + cover.height + radius
    );
  }

  private nearestEnemy(actor: Actor) {
    return this.enemies.filter((item) => item.alive).sort((a, b) =>
      Phaser.Math.Distance.Between(actor.body.x, actor.body.y, a.body.x, a.body.y) -
      Phaser.Math.Distance.Between(actor.body.x, actor.body.y, b.body.x, b.body.y)
    )[0];
  }

  private nearestGreen(actor: Actor) {
    return [this.player, ...this.teammates].filter((item) => item.alive).sort((a, b) =>
      Phaser.Math.Distance.Between(actor.body.x, actor.body.y, a.body.x, a.body.y) -
      Phaser.Math.Distance.Between(actor.body.x, actor.body.y, b.body.x, b.body.y)
    )[0];
  }

  private updateUi() {
    if (!this.scoreText) return;
    this.scoreText.setText('GREEN ' + this.teamScore + ' · ORANGE ' + this.opponentScore + ' · ' + this.playerName);
  }

  private renderTouchUi() {
    if (!this.touchUi) return;
    this.touchUi.clear();

    if (!this.isPhoneLayout) return;

    const radius = this.touchRadius();

    // The game follows Hall's mobile-first principle: controls appear where the thumbs are,
    // rather than permanently covering the arena.
    if (this.moveTouch) {
      this.touchUi.lineStyle(3, 0xf4f1df, 0.65).strokeCircle(this.moveTouch.startX, this.moveTouch.startY, radius);
      this.touchUi.fillStyle(0x176b4b, 0.85).fillCircle(this.moveTouch.x, this.moveTouch.y, radius * 0.38);
      this.touchUi.lineStyle(2, 0xf4f1df, 0.90).strokeCircle(this.moveTouch.x, this.moveTouch.y, radius * 0.38);
    }

    if (this.aimTouch) {
      this.touchUi.lineStyle(3, 0xe8c95c, 0.85).strokeCircle(this.aimTouch.x, this.aimTouch.y, radius * 0.32);
      this.touchUi.lineStyle(2, 0xe8c95c, 0.25).lineBetween(
        this.scale.width * 0.52,
        this.scale.height * 0.50,
        this.aimTouch.x,
        this.aimTouch.y
      );
    }
  }

  private touchRadius() {
    return Phaser.Math.Clamp(Math.min(this.scale.width, this.scale.height) * 0.15, 56, 84);
  }

  private uiFont(base: number) {
    if (!this.isPhoneLayout) return base + 'px';
    return Phaser.Math.Clamp(base * (this.scale.width / 360), 8, 14).toFixed(1) + 'px';
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.isPhoneLayout) {
      if (pointer.x > this.scale.width * 0.50) {
        const world = this.cameraWorldPoint(pointer.x, pointer.y);
        this.aim = this.directionTo(this.player.body.x, this.player.body.y, world.x, world.y);
        this.fire(this.player, this.aim.x, this.aim.y);
      }
      return;
    }

    if (pointer.x < this.scale.width * 0.48 && !this.moveTouch) {
      this.moveTouch = { id: pointer.id, startX: pointer.x, startY: pointer.y, x: pointer.x, y: pointer.y };
      return;
    }

    if (pointer.x >= this.scale.width * 0.48 && !this.aimTouch) {
      this.aimTouch = { id: pointer.id, x: pointer.x, y: pointer.y };
      const world = this.cameraWorldPoint(pointer.x, pointer.y);
      this.aim = this.directionTo(this.player.body.x, this.player.body.y, world.x, world.y);
      this.fire(this.player, this.aim.x, this.aim.y);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isPhoneLayout) return;

    if (this.moveTouch?.id === pointer.id) {
      this.moveTouch.x = pointer.x;
      this.moveTouch.y = pointer.y;
    }

    if (this.aimTouch?.id === pointer.id) {
      this.aimTouch.x = pointer.x;
      this.aimTouch.y = pointer.y;
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.moveTouch?.id === pointer.id) this.moveTouch = undefined;
    if (this.aimTouch?.id === pointer.id) this.aimTouch = undefined;
  }

  private directionTo(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }
}
