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

const WIDTH = 960;
const HEIGHT = 540;
const START = { x: 90, y: HEIGHT / 2 };

export class ShootersTriggerTrainingScene extends Phaser.Scene {
  private player!: Actor;
  private teammates: Actor[] = [];
  private enemies: Actor[] = [];
  private paintballs: Paintball[] = [];
  private covers: Phaser.Geom.Rectangle[] = [];
  private keys!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; fire: Phaser.Input.Keyboard.Key };
  private aim = { x: 1, y: 0 };
  private moveTouch?: { id: number; x: number; y: number };
  private lastShot = 0;
  private teamScore = 0;
  private opponentScore = 0;
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private respawnText?: Phaser.GameObjects.Text;
  private playerName = 'Player';
  private startedAt = 0;

  constructor() {
    super('ShootersTriggerTrainingScene');
  }

  create() {
    this.playerName = String(this.registry.get('shootersTriggerPlayer') || 'Player');
    this.startedAt = this.time.now;
    this.drawArena();
    this.createUi();

    this.keys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      fire: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.player = this.makeActor(START.x, START.y, 'green', 'player', this.playerName, 120);
    this.teammates = [
      this.makeActor(START.x + 30, START.y - 75, 'green', 'operator', 'Operator 12', 150),
      this.makeActor(START.x + 30, START.y + 75, 'green', 'heavy', 'The Heavy', 105),
    ];

    this.enemies = [
      this.makeActor(780, 180, 'orange', 'runner', 'Runner', 145),
      this.makeActor(800, 360, 'orange', 'anchor', 'Anchor', 95),
    ];

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
    });

    this.statusText.setText('TRAINING SCRIMMAGE · MOVE WITH YOUR TEAM');
  }

  update(_time: number, delta: number) {
    if (!this.player?.alive) return;
    this.updatePlayer(delta);
    this.updateTeammates(delta);
    this.updateEnemies(delta);
    this.updatePaintballs(delta);
    this.updateUi();

    if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
      this.fire(this.player, this.aim.x, this.aim.y);
    }

    if (this.time.now - this.startedAt > 300000) this.finish('TIME');
  }

  private drawArena() {
    const g = this.add.graphics();
    g.fillStyle(0x6b9b4c, 1).fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0x75a957, 0.55).fillRect(0, 0, WIDTH, HEIGHT * 0.50);
    g.fillStyle(0x56883f, 0.48).fillRect(0, HEIGHT * 0.50, WIDTH, HEIGHT * 0.50);

    for (let i = 0; i < 24; i += 1) {
      const x = (i * 173) % WIDTH;
      const y = 50 + ((i * 97) % (HEIGHT - 100));
      g.fillStyle(i % 2 ? 0x47733a : 0x86b765, 0.38).fillCircle(x, y, 2 + (i % 3));
    }

    const coverDefs = [
      [220, 120, 115, 32], [390, 235, 150, 34], [610, 120, 110, 32],
      [235, 380, 120, 34], [500, 395, 140, 34], [700, 285, 120, 34],
    ];

    for (const [x, y, w, h] of coverDefs) {
      g.fillStyle(0xc6b47b, 1).fillRect(x, y, w, h);
      g.fillStyle(0x9b8a5d, 1).fillRect(x, y + h - 6, w, 6);
      this.covers.push(new Phaser.Geom.Rectangle(x, y, w, h));
    }

    g.fillStyle(0x315a37, 0.8).fillCircle(470, 270, 52);
    g.lineStyle(3, 0xe8c95c, 0.8).strokeCircle(470, 270, 52);

    this.add.text(470, 270, 'TACTIC\nZONE', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#f4f1df', align: 'center',
    }).setOrigin(0.5);

    this.add.text(32, 28, 'GREEN BASE', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#eff6e8',
    });
    this.add.text(WIDTH - 32, 28, 'ORANGE SIDE', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#fff0dc',
    }).setOrigin(1, 0);
  }

  private createUi() {
    this.scoreText = this.add.text(20, 48, '', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#1a2c1e', padding: { left: 9, right: 9, top: 7, bottom: 7 },
    }).setScrollFactor(0).setDepth(50);

    this.statusText = this.add.text(WIDTH / 2, 22, '', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#1a2c1e', padding: { left: 10, right: 10, top: 7, bottom: 7 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    this.hintText = this.add.text(WIDTH / 2, HEIGHT - 22,
      'DESKTOP: WASD + MOUSE CLICK/SPACE · PHONE: LEFT SIDE MOVE + RIGHT SIDE AIM/FIRE',
      {
        fontFamily: 'monospace', fontSize: '8px', color: '#f4f1df',
        backgroundColor: '#1a2c1e', padding: { left: 9, right: 9, top: 6, bottom: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  private makeActor(x: number, y: number, team: Actor['team'], role: Actor['role'], name: string, hp: number): Actor {
    const size = role === 'heavy' || role === 'anchor' ? 26 : 21;
    const body = this.add.rectangle(x, y, size, size, team === 'green' ? 0x176b4b : 0xd66b32, 1)
      .setStrokeStyle(2, team === 'green' ? 0xdff6d4 : 0xffe2bf, 0.9)
      .setDepth(20);
    const label = this.add.text(x, y - size * 0.9, name, {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#203423', padding: { left: 4, right: 4, top: 2, bottom: 2 },
    }).setOrigin(0.5, 1).setDepth(21);

    return {
      body, label, team, role, hp, maxHp: hp,
      speed: role === 'heavy' ? 82 : role === 'operator' ? 125 : 108,
      startX: x, startY: y, alive: true, cooldown: 0,
    };
  }

  private updatePlayer(delta: number) {
    const pointer = this.input.activePointer;
    const keyboardX = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
    const keyboardY = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);
    let moveX = keyboardX;
    let moveY = keyboardY;

    if (this.moveTouch) {
      moveX = Phaser.Math.Clamp((pointer.x - this.moveTouch.x) / 65, -1, 1);
      moveY = Phaser.Math.Clamp((pointer.y - this.moveTouch.y) / 65, -1, 1);
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 0.05) {
      moveX /= Math.max(1, len);
      moveY /= Math.max(1, len);
      this.moveActor(this.player, moveX * this.player.speed * delta / 1000, moveY * this.player.speed * delta / 1000);
    }

    if (pointer.isDown && pointer.x > this.scale.width * 0.48) {
      const dx = pointer.x - this.player.body.x;
      const dy = pointer.y - this.player.body.y;
      const length = Math.hypot(dx, dy) || 1;
      this.aim = { x: dx / length, y: dy / length };
      if (this.time.now - this.lastShot > 360) this.fire(this.player, this.aim.x, this.aim.y);
    }
  }

  private updateTeammates(delta: number) {
    this.teammates.forEach((mate, index) => {
      if (!mate.alive) return;
      const targetX = this.player.body.x - 38;
      const targetY = this.player.body.y + (index === 0 ? -58 : 58);
      const dx = targetX - mate.body.x;
      const dy = targetY - mate.body.y;
      const len = Math.hypot(dx, dy) || 1;
      if (len > 30) this.moveActor(mate, dx / len * mate.speed * 0.55 * delta / 1000, dy / len * mate.speed * 0.55 * delta / 1000);

      mate.cooldown -= delta;
      const enemy = this.nearestEnemy(mate);
      if (enemy && mate.cooldown <= 0) {
        this.fire(mate, enemy.body.x - mate.body.x, enemy.body.y - mate.body.y);
        mate.cooldown = mate.role === 'operator' ? 950 : 1250;
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

      if (index === 0 || enemy.role === 'runner') {
        this.moveActor(enemy, dx / len * enemy.speed * 0.30 * delta / 1000, dy / len * enemy.speed * 0.30 * delta / 1000);
        if (enemy.body.x < 650) this.moveActor(enemy, enemy.speed * 0.20 * delta / 1000, 0);
      }

      if (enemy.cooldown <= 0 && len < 460) {
        this.fire(enemy, dx, dy);
        enemy.cooldown = enemy.role === 'anchor' ? 1450 : 1050;
      }
    });
  }

  private updatePaintballs(delta: number) {
    for (let i = this.paintballs.length - 1; i >= 0; i -= 1) {
      const ball = this.paintballs[i];
      ball.ttl -= delta;
      ball.body.x += ball.vx * delta / 1000;
      ball.body.y += ball.vy * delta / 1000;

      if (ball.ttl <= 0 || ball.body.x < -20 || ball.body.x > WIDTH + 20 || ball.body.y < -20 || ball.body.y > HEIGHT + 20 || this.hitCover(ball.body.x, ball.body.y)) {
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        continue;
      }

      const targets = ball.owner.team === 'green' ? this.enemies : [this.player, ...this.teammates];
      const target = targets.find((actor) => actor.alive && Phaser.Math.Distance.Between(ball.body.x, ball.body.y, actor.body.x, actor.body.y) < 15);
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
      this.respawnActor(target, target.startX, target.startY, 900);
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
    this.respawnText?.destroy();
    this.respawnText = this.add.text(WIDTH / 2, HEIGHT / 2, 'HIT · RESETTING TO START', {
      fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#9d3e2b', padding: { left: 14, right: 14, top: 10, bottom: 10 },
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(850, () => {
      if (this.teamScore >= 5 || this.opponentScore >= 5) return;
      this.player.body.setPosition(START.x, START.y);
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
      actor.body.setVisible(true);
      actor.label.setVisible(true);
    });
  }

  private finish(winner: string) {
    this.scene.pause();
    this.statusText.setText('TRAINING RESULT · ' + winner + ' WINS');
    this.hintText.setText('TAP / CLICK TO RESTART TRAINING');
    this.input.once('pointerdown', () => this.scene.restart());
    this.input.keyboard?.once('keydown', () => this.scene.restart());
  }

  private fire(owner: Actor, dx: number, dy: number) {
    const len = Math.hypot(dx, dy) || 1;
    const vx = dx / len * 410;
    const vy = dy / len * 410;
    const ball = this.add.circle(owner.body.x, owner.body.y, 4, owner.team === 'green' ? 0xdff6d4 : 0xffc58d, 1).setDepth(15);
    this.paintballs.push({ body: ball, vx, vy, owner, ttl: 1250 });
    this.lastShot = this.time.now;
  }

  private moveActor(actor: Actor, dx: number, dy: number) {
    const nextX = Phaser.Math.Clamp(actor.body.x + dx, 18, WIDTH - 18);
    const nextY = Phaser.Math.Clamp(actor.body.y + dy, 48, HEIGHT - 42);
    if (!this.hitCover(nextX, nextY, actor.body.width * 0.5)) {
      actor.body.setPosition(nextX, nextY);
      actor.label.setPosition(nextX, nextY - actor.body.height * 0.9);
    }
  }

  private hitCover(x: number, y: number, radius = 3) {
    return this.covers.some((cover) =>
      x >= cover.x - radius && x <= cover.x + cover.width + radius &&
      y >= cover.y - radius && y <= cover.y + cover.height + radius
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
    this.time.delayedCall(100, () => {
      if (!actor.body.active) return;
      actor.body.setFillStyle(actor.team === 'green' ? 0x176b4b : 0xd66b32, 1);
    });
  }

  private updateUi() {
    this.scoreText.setText('GREEN ' + this.teamScore + ' · ORANGE ' + this.opponentScore + ' · ' + this.playerName);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.x < this.scale.width * 0.48) {
      this.moveTouch = { id: pointer.id, x: pointer.x, y: pointer.y };
    } else {
      const dx = pointer.x - this.player.body.x;
      const dy = pointer.y - this.player.body.y;
      const len = Math.hypot(dx, dy) || 1;
      this.aim = { x: dx / len, y: dy / len };
      this.fire(this.player, this.aim.x, this.aim.y);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.moveTouch || pointer.id !== this.moveTouch.id) return;
    const dx = pointer.x - this.player.body.x;
    const dy = pointer.y - this.player.body.y;
    const len = Math.hypot(dx, dy) || 1;
    if (pointer.x > this.scale.width * 0.48) this.aim = { x: dx / len, y: dy / len };
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.moveTouch?.id === pointer.id) this.moveTouch = undefined;
  }
}
