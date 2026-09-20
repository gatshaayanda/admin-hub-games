import Phaser from 'phaser';

type Actor = {
  body: Phaser.GameObjects.Rectangle;
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
  private keys!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; fire: Phaser.Input.Keyboard.Key };
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
  private fieldWidth = 960;
  private fieldHeight = 540;
  private isPhoneLayout = false;
  private readonly start = { x: 90, y: 270 };

  constructor() {
    super('ShootersTriggerTrainingScene');
  }

  create() {
    this.configureField();
    this.playerName = String(this.registry.get('shootersTriggerPlayer') || 'Player');
    this.startedAt = this.time.now;

    this.drawArena();
    this.createUi();
    this.touchUi = this.add.graphics().setDepth(60).setScrollFactor(0);

    this.keys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      fire: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.player = this.makeActor(this.start.x, this.start.y, 'green', 'player', this.playerName, 120);
    this.teammates = [
      this.makeActor(this.start.x + this.actorSize(), this.start.y - this.teamSpacing(), 'green', 'operator', 'Operator 12', 150),
      this.makeActor(this.start.x + this.actorSize(), this.start.y + this.teamSpacing(), 'green', 'heavy', 'The Heavy', 105),
    ];

    this.enemies = [
      this.makeActor(this.fieldWidth - this.fieldWidth * 0.18, this.fieldHeight * 0.34, 'orange', 'runner', 'Runner', 145),
      this.makeActor(this.fieldWidth - this.fieldWidth * 0.18, this.fieldHeight * 0.66, 'orange', 'anchor', 'Anchor', 95),
    ];

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

    this.statusText.setText('TRAINING SCRIMMAGE · STAY WITH YOUR TEAM');
    this.renderTouchUi();
  }

  private configureField() {
    // RESIZE gives us the actual playable viewport. The arena follows it instead
    // of drawing a fixed 960x540 world into a portrait phone viewport.
    this.fieldWidth = Math.max(320, this.scale.width);
    this.fieldHeight = Math.max(180, this.scale.height);
    this.isPhoneLayout = this.fieldHeight > this.fieldWidth * 1.12;

    this.start.x = this.isPhoneLayout ? this.fieldWidth * 0.14 : this.fieldWidth * 0.095;
    this.start.y = this.fieldHeight * 0.50;
  }

  private handleResize(width: number, height: number) {
    if (!this.player) return;
    const wasPhone = this.isPhoneLayout;
    this.fieldWidth = Math.max(320, width);
    this.fieldHeight = Math.max(480, height);
    this.isPhoneLayout = this.fieldHeight > this.fieldWidth * 1.12;

    if (wasPhone !== this.isPhoneLayout) {
      this.scene.restart();
      return;
    }

    this.cameras.main.setViewport(0, 0, width, height);
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
    const w = this.fieldWidth;
    const h = this.fieldHeight;

    g.fillStyle(0x6b9b4c, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x75a957, 0.55).fillRect(0, 0, w, h * 0.50);
    g.fillStyle(0x56883f, 0.48).fillRect(0, h * 0.50, w, h * 0.50);

    for (let i = 0; i < (this.isPhoneLayout ? 34 : 24); i += 1) {
      const x = (i * 173) % w;
      const y = 42 + ((i * 97) % Math.max(80, h - 84));
      g.fillStyle(i % 2 ? 0x47733a : 0x86b765, 0.38).fillCircle(x, y, 2 + (i % 3));
    }

    const coverDefs = this.isPhoneLayout
      ? [
          [0.22, 0.15, 0.56, 0.035],
          [0.08, 0.30, 0.44, 0.040],
          [0.48, 0.39, 0.44, 0.040],
          [0.10, 0.53, 0.45, 0.040],
          [0.46, 0.67, 0.44, 0.040],
          [0.18, 0.82, 0.55, 0.035],
        ]
      : [
          [0.23, 0.22, 0.12, 0.06],
          [0.40, 0.43, 0.16, 0.065],
          [0.63, 0.22, 0.12, 0.06],
          [0.24, 0.70, 0.13, 0.065],
          [0.52, 0.73, 0.15, 0.065],
          [0.73, 0.53, 0.13, 0.065],
        ];

    for (const [nx, ny, nw, nh] of coverDefs) {
      const x = nx * w;
      const y = ny * h;
      const cw = nw * w;
      const ch = Math.max(18, nh * h);
      g.fillStyle(0xc6b47b, 1).fillRect(x, y, cw, ch);
      g.fillStyle(0x9b8a5d, 1).fillRect(x, y + ch - 6, cw, 6);
      this.covers.push(new Phaser.Geom.Rectangle(x, y, cw, ch));
    }

    if (this.isPhoneLayout) {
      this.drawTree(g, w * 0.83, h * 0.13, 0.72);
      this.drawTree(g, w * 0.14, h * 0.76, 0.62);
      this.drawTree(g, w * 0.82, h * 0.87, 0.70);
    } else {
      this.drawTree(g, w * 0.16, h * 0.28, 0.90);
      this.drawTree(g, w * 0.42, h * 0.24, 0.66);
      this.drawTree(g, w * 0.92, h * 0.42, 0.64);
    }

    g.fillStyle(0x315a37, 0.8).fillCircle(w * 0.50, h * 0.50, Math.min(w, h) * 0.095);
    g.lineStyle(Math.max(2, Math.min(w, h) * 0.005), 0xe8c95c, 0.8)
      .strokeCircle(w * 0.50, h * 0.50, Math.min(w, h) * 0.095);

    this.add.text(w * 0.50, h * 0.50, 'TACTIC\nZONE', {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '8px' : '9px',
      fontStyle: 'bold',
      color: '#f4f1df',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(18, 18, 'GREEN BASE', {
      fontFamily: 'monospace',
      fontSize: this.uiFont(9),
      fontStyle: 'bold',
      color: '#eff6e8',
    });

    this.add.text(w - 18, 18, 'ORANGE SIDE', {
      fontFamily: 'monospace',
      fontSize: this.uiFont(9),
      fontStyle: 'bold',
      color: '#fff0dc',
    }).setOrigin(1, 0);
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    g.fillStyle(0x315a37, 0.9).fillCircle(x, y, 22 * scale);
    g.fillStyle(0x47733a, 0.95).fillCircle(x - 15 * scale, y + 7 * scale, 17 * scale);
    g.fillStyle(0x56883f, 0.95).fillCircle(x + 14 * scale, y + 7 * scale, 18 * scale);
    g.fillStyle(0x765b3d, 1).fillRect(x - 4 * scale, y + 14 * scale, 8 * scale, 24 * scale);
  }

  private createUi() {
    this.scoreText = this.add.text(this.fieldWidth * 0.50, 14, '', {
      fontFamily: 'monospace',
      fontSize: this.uiFont(12),
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#1a2c1e',
      padding: { left: 9, right: 9, top: 7, bottom: 7 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    this.statusText = this.add.text(this.fieldWidth * 0.50, this.isPhoneLayout ? 58 : 20, '', {
      fontFamily: 'monospace',
      fontSize: this.uiFont(10),
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#1a2c1e',
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    this.hintText = this.add.text(this.fieldWidth * 0.50, this.fieldHeight - (this.isPhoneLayout ? 38 : 22),
      this.isPhoneLayout ? 'LEFT THUMB MOVE  ·  RIGHT THUMB AIM + FIRE' : 'DESKTOP: WASD + MOUSE CLICK/SPACE',
      {
        fontFamily: 'monospace',
        fontSize: this.uiFont(8),
        color: '#f4f1df',
        backgroundColor: '#1a2c1e',
        padding: { left: 9, right: 9, top: 6, bottom: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  private makeActor(x: number, y: number, team: Actor['team'], role: Actor['role'], name: string, hp: number): Actor {
    const size = this.actorSize(role);
    const body = this.add.rectangle(x, y, size, size, team === 'green' ? 0x176b4b : 0xd66b32, 1)
      .setStrokeStyle(Math.max(2, size * 0.09), team === 'green' ? 0xdff6d4 : 0xffe2bf, 0.95)
      .setDepth(20);

    const label = this.add.text(x, y - size * 0.9, name, {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '7px' : '8px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#203423',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    }).setOrigin(0.5, 1).setDepth(21);

    return {
      body, label, team, role, hp, maxHp: hp,
      speed: role === 'heavy' ? 82 : role === 'operator' ? 125 : 108,
      startX: x, startY: y, alive: true, cooldown: 0,
    };
  }

  private actorSize(role?: Actor['role']) {
    const base = Phaser.Math.Clamp(Math.min(this.fieldWidth, this.fieldHeight) * 0.048, 20, 30);
    return role === 'heavy' || role === 'anchor' ? base * 1.18 : base;
  }

  private teamSpacing() {
    return Phaser.Math.Clamp(this.fieldHeight * 0.11, 48, 74);
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

    const aimPoint = this.aimTouch ?? (pointer.isDown && pointer.x > this.fieldWidth * 0.50
      ? { id: pointer.id, x: pointer.x, y: pointer.y }
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

  private updateTeammates(delta: number) {
    this.teammates.forEach((mate, index) => {
      if (!mate.alive) return;

      const followDistance = this.isPhoneLayout ? 42 : 58;
      const targetX = this.player.body.x - this.actorSize() * 1.8;
      const targetY = this.player.body.y + (index === 0 ? -followDistance : followDistance);
      const dx = targetX - mate.body.x;
      const dy = targetY - mate.body.y;
      const len = Math.hypot(dx, dy) || 1;

      if (len > 28) {
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

      const advance = this.isPhoneLayout ? 0.24 : 0.30;
      if (index === 0 || enemy.role === 'runner') {
        this.moveActor(enemy, dx / len * enemy.speed * advance * delta / 1000, dy / len * enemy.speed * advance * delta / 1000);
        if (enemy.body.x < this.fieldWidth * 0.68) {
          this.moveActor(enemy, enemy.speed * 0.18 * delta / 1000, 0);
        }
      }

      if (enemy.cooldown <= 0 && len < this.fieldWidth * 0.52) {
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
        ball.body.x < -20 || ball.body.x > this.fieldWidth + 20 ||
        ball.body.y < -20 || ball.body.y > this.fieldHeight + 20 ||
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
    this.flashActor(target);

    if (target.hp > 0) {
      this.statusText.setText(target === this.player ? 'PAINT HIT · KEEP MOVING' : target.label.text + ' HIT');
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
      this.finish(this.teamScore >= 5 ? 'TEAM GREEN' : 'TEAM ORANGE');
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
    this.respawnText = this.add.text(this.fieldWidth / 2, this.fieldHeight * 0.50, 'HIT · RESETTING TO START', {
      fontFamily: 'monospace',
      fontSize: this.isPhoneLayout ? '13px' : '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#9d3e2b',
      padding: { left: 14, right: 14, top: 10, bottom: 10 },
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(this.isPhoneLayout ? 650 : 850, () => {
      if (this.teamScore >= 5 || this.opponentScore >= 5) return;

      this.player.body.setPosition(this.start.x, this.start.y);
      this.player.label.setPosition(this.start.x, this.start.y - this.player.body.height * 0.9);
      this.player.hp = this.player.maxHp;
      this.player.alive = true;
      this.player.body.setVisible(true);
      this.player.label.setVisible(true);
      this.respawnText?.destroy();
      this.respawnText = undefined;
      this.statusText.setText('BACK IN · WATCH YOUR ANGLE');
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
      actor.label.setPosition(x, y - actor.body.height * 0.9);
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
    const speed = this.isPhoneLayout ? 330 : 410;
    const vx = dx / len * speed;
    const vy = dy / len * speed;
    const radius = this.isPhoneLayout ? 3.5 : 4;

    const ball = this.add.circle(owner.body.x, owner.body.y, radius,
      owner.team === 'green' ? 0xdff6d4 : 0xffc58d, 1
    ).setDepth(15);

    this.paintballs.push({ body: ball, vx, vy, owner, ttl: 1250 });
    this.lastShot = this.time.now;
  }

  private moveActor(actor: Actor, dx: number, dy: number) {
    const margin = this.actorSize(actor.role) * 0.60;
    const nextX = Phaser.Math.Clamp(actor.body.x + dx, margin, this.fieldWidth - margin);
    const nextY = Phaser.Math.Clamp(actor.body.y + dy, margin + 8, this.fieldHeight - margin - 8);

    if (!this.hitCover(nextX, nextY, margin)) {
      actor.body.setPosition(nextX, nextY);
      actor.label.setPosition(nextX, nextY - actor.body.height * 0.9);
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

  private flashActor(actor: Actor) {
    actor.body.setFillStyle(0xffffff, 1);
    this.time.delayedCall(90, () => {
      if (!actor.body.active) return;
      actor.body.setFillStyle(actor.team === 'green' ? 0x176b4b : 0xd66b32, 1);
    });
  }

  private updateUi() {
    this.scoreText.setText('GREEN ' + this.teamScore + ' · ORANGE ' + this.opponentScore + ' · ' + this.playerName);
  }

  private renderTouchUi() {
    if (!this.touchUi) return;

    this.touchUi.clear();

    if (!this.isPhoneLayout) return;

    if (this.moveTouch) {
      const radius = this.touchRadius();
      this.touchUi.lineStyle(2, 0xf4f1df, 0.60).strokeCircle(this.moveTouch.startX, this.moveTouch.startY, radius);
      this.touchUi.fillStyle(0x1f6b68, 0.78).fillCircle(this.moveTouch.x, this.moveTouch.y, radius * 0.34);
      this.touchUi.lineStyle(2, 0xf4f1df, 0.85).strokeCircle(this.moveTouch.x, this.moveTouch.y, radius * 0.34);
    }

    if (this.aimTouch) {
      this.touchUi.lineStyle(2, 0xe8c95c, 0.78).strokeCircle(this.aimTouch.x, this.aimTouch.y, this.touchRadius() * 0.28);
      this.touchUi.lineStyle(2, 0xe8c95c, 0.35).lineBetween(
        this.player.body.x,
        this.player.body.y,
        this.aimTouch.x,
        this.aimTouch.y
      );
    }
  }

  private touchRadius() {
    return Phaser.Math.Clamp(Math.min(this.fieldWidth, this.fieldHeight) * 0.12, 48, 70);
  }

  private uiFont(base: number) {
    if (!this.isPhoneLayout) return base + 'px';
    return Phaser.Math.Clamp(base * (this.fieldWidth / 360), 8, 13).toFixed(1) + 'px';
  }
}
