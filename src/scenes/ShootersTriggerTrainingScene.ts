import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';
import { loadShootersProgress, recordShooting, finishShooting, saveShootersProgress } from '../shooters-trigger-state';
import { addFieldGuide, showShotAlert } from '../shooters-trigger-guidance';

type Paintball = {
  body: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  ttl: number;
};

type Target = {
  body: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Arc;
  splatter: Phaser.GameObjects.Graphics;
  kind: 'dummy' | 'bottle';
  x: number;
  y: number;
  hits: number;
};

export class ShootersTriggerTrainingScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();

  private player!: Phaser.GameObjects.Container;
  private playerPoseA!: Phaser.GameObjects.Graphics;
  private playerPoseB!: Phaser.GameObjects.Graphics;
  private playerWeapon!: Phaser.GameObjects.Graphics;
  private playerArms!: Phaser.GameObjects.Graphics;
  private muzzleFlash!: Phaser.GameObjects.Graphics;
  private playerMoving = false;
  private playerFacing = 1;
  private playerAnimTime = 0;
  private playerTarget: Phaser.Math.Vector2 | null = null;
  private playerName = 'Player';
  private progress = loadShootersProgress();
  private sessionElapsed = 0;
  private sessionFinished = false;
  private finishButton?: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paintballs: Paintball[] = [];
  private targets: Target[] = [];
  private covers: Phaser.Geom.Rectangle[] = [];

  private speed = 170;
  private readonly worldWidth = 2400;
  private readonly worldHeight = 1400;
  private readonly start = { x: 1180, y: 1080 };

  private aim = new Phaser.Math.Vector2(1, 0);
  private aimPoint?: Phaser.Math.Vector2;
  private hasAimInput = false;
  private fireHeld = false;
  private fireCooldown = 0;
  private recoilKick = 0;
  private muzzleFlashTimer = 0;
  private aimWasExplicitlySet = false;

  private statusText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private aimUi!: Phaser.GameObjects.Graphics;
  private controlsCleanup?: () => void;

  constructor() {
    super('ShootersTriggerTrainingScene');
  }

  create() {
    this.playerName = String(this.registry.get('shootersTriggerPlayer') || 'Player');
    this.progress = loadShootersProgress(this.playerName);
    this.progress.shootingTraining = { shots: 0, misses: 0, coverHits: 0, scrapes: 0, markerHits: 0, centerMass: 0, headshots: 0 };
    saveShootersProgress(this.progress);

    this.cameras.main.setBackgroundColor('#6f984b');
    this.drawField();

    this.player = this.createPlayer(this.start.x, this.start.y);
    this.player.setDepth(30);

    this.createTargets();
    this.createHud();
    addFieldGuide(this, 'SHOOTING LOCATION · FIELD GUIDE', ['Use the left MOVE control to walk. Movement never changes where the marker is aiming.','Use the right FIRE control to drag your aim and fire. You can move and shoot at the same time.','Train for 60 seconds. Learn the difference between a scrape, marker-hand hit, center-mass hit and exceptional head-level precision.','Cover can stop a paintball. Standing beside cover is not the same as being behind the useful face of it.','Your result becomes your shooting stat and changes what Media Coverage reports before the arena.']);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(
      Math.min(this.scale.width * 0.28, 320),
      Math.min(this.scale.height * 0.22, 150),
    );

    this.aimUi = this.add.graphics().setScrollFactor(0).setDepth(80);
    this.controlsCleanup = installShootersTriggerMobileControls();

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.controlsCleanup?.();
      this.controlsCleanup = undefined;
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  public isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  public setMoveVector(x: number, y: number) {
    this.joystickVector.set(
      Phaser.Math.Clamp(x, -1, 1),
      Phaser.Math.Clamp(y, -1, 1),
    );
  }

  public setFireHeld(held: boolean) {
    this.fireHeld = held;
  }

  public setAimVector(x: number, y: number) {
    const length = Math.hypot(x, y);
    if (length < 0.05) return;
    this.aim.set(x / length, y / length);
    this.hasAimInput = true;
    this.aimWasExplicitlySet = true;
    this.aimPoint = new Phaser.Math.Vector2(
      this.player.x + this.aim.x * 180,
      this.player.y + this.aim.y * 180,
    );
    this.updateWeaponPose();
  }

  update(_time: number, delta: number) {
    if (this.sessionFinished) return;
    this.sessionElapsed += delta;
    if (this.sessionElapsed >= 60000) { this.finishTraining(); return; }
    this.updateMovement(delta);
    this.updateAimAndFire(delta);
    this.updatePaintballs(delta);
    this.updatePlayerAnimation(delta);
    this.updateWeaponPose();
    this.updateHud();
  }

  private updateMovement(delta: number) {
    let dx = this.joystickVector.x;
    let dy = this.joystickVector.y;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
    }

    if (dx === 0 && dy === 0 && this.playerTarget) {
      const distanceToTarget = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.playerTarget.x,
        this.playerTarget.y,
      );

      if (distanceToTarget < 8) {
        this.playerTarget = null;
      } else {
        dx = this.playerTarget.x - this.player.x;
        dy = this.playerTarget.y - this.player.y;
      }
    }

    this.playerMoving = dx !== 0 || dy !== 0;

    // Movement never silently steals the combat direction. The player aims,
    // then movement remains free to strafe/retreat while the current aim drives fire.
    // If no explicit aim exists yet, keep the stable initial right-facing direction.

    if (Math.abs(dx) > 0.08) {
      this.playerFacing = dx < 0 ? -1 : 1;
    }

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy) || 1;
      const distance = this.speed * (delta / 1000);
      this.movePlayer((dx / length) * distance, (dy / length) * distance);

      if (
        this.playerTarget &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, this.playerTarget.x, this.playerTarget.y) < 8
      ) {
        this.playerTarget = null;
      }
    }
  }

  private movePlayer(dx: number, dy: number) {
    const nextX = Phaser.Math.Clamp(this.player.x + dx, 42, this.worldWidth - 42);
    const nextY = Phaser.Math.Clamp(this.player.y + dy, 90, this.worldHeight - 50);

    if (!this.hitCover(nextX, nextY, 14)) {
      this.player.x = nextX;
      this.player.y = nextY;
    }
  }

  private updateAimAndFire(delta: number) {
    this.fireCooldown = Math.max(0, this.fireCooldown - delta);
    if (this.keys.SPACE.isDown && !this.isPhoneSession()) {
      this.fire();
    }

    if (this.fireHeld) this.fire();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.isPhoneSession()) return;

    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.setAimPoint(point.x, point.y);
    this.fire();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isPhoneSession()) return;
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.setAimPoint(point.x, point.y);
  }

  private setAimPoint(x: number, y: number) {
    this.aimPoint = new Phaser.Math.Vector2(x, y);
    this.aim.set(x - this.player.x, y - this.player.y).normalize();
    this.hasAimInput = true;
    this.aimWasExplicitlySet = true;
    this.updateWeaponPose();
  }

  private fire() {
    if (this.fireCooldown > 0) return;
    this.fireCooldown = 240;
    this.recoilKick = 1;
    this.muzzleFlashTimer = 72;
    const speed = 520;
    const muzzleDistance = 42;
    const ball = this.add.circle(
      this.player.x + this.aim.x * muzzleDistance,
      this.player.y + this.aim.y * muzzleDistance,
      4,
      0xf0dfb6,
      1,
    ).setDepth(25);

    this.paintballs.push({
      body: ball,
      vx: this.aim.x * speed,
      vy: this.aim.y * speed,
      ttl: 1100,
    });

    this.statusText.setText('PAINTBALL AWAY  ·  AIM LOCKED');
  }

  private updatePaintballs(delta: number) {
    for (let i = this.paintballs.length - 1; i >= 0; i -= 1) {
      const ball = this.paintballs[i];
      ball.ttl -= delta;
      ball.body.x += ball.vx * delta / 1000;
      ball.body.y += ball.vy * delta / 1000;

      if (
        ball.ttl <= 0 ||
        ball.body.x < 0 ||
        ball.body.x > this.worldWidth ||
        ball.body.y < 0 ||
        ball.body.y > this.worldHeight
      ) {
        recordShooting(this.progress, 'misses');
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        continue;
      }

      if (this.hitCover(ball.body.x, ball.body.y)) {
        recordShooting(this.progress, 'coverHits');
        showShotAlert(this, 'SHOT RESULT · COVER BLOCKED');
        ball.body.destroy();
        this.paintballs.splice(i, 1);
        continue;
      }

      const target = this.targets.find((item) =>
        Phaser.Math.Distance.Between(ball.body.x, ball.body.y, item.x, item.y) < 30,
      );

      if (target) {
        const distance = Phaser.Math.Distance.Between(ball.body.x, ball.body.y, target.x, target.y);
        const hitType = distance < 8 ? 'headshots' : distance < 15 ? 'centerMass' : target.kind === 'bottle' ? 'markerHits' : 'scrapes';
        recordShooting(this.progress, hitType as 'headshots'|'centerMass'|'markerHits'|'scrapes');
        const readable = hitType === 'headshots' ? 'EXCEPTIONAL HIT' : hitType === 'centerMass' ? 'CENTER-MASS HIT' : hitType === 'markerHits' ? 'MARKER-HAND HIT' : 'SCRAPE';
        showShotAlert(this, 'SHOT RESULT · '+readable);
        target.hits += 1;
        target.plate.setFillStyle(0xe8c95c, 1);
        this.showTargetSplatter(target);
        this.time.delayedCall(130, () => {
          if (target.plate.active) target.plate.setFillStyle(0xe06a3d, 1);
        });
        this.statusText.setText(
          `${target.kind === 'bottle' ? 'BOTTLE HIT' : 'DUMMY HIT'}  ·  PAINT SPLAT  ·  ${target.hits}`,
        );
        ball.body.destroy();
        this.paintballs.splice(i, 1);
      }
    }
  }

  private updatePlayerAnimation(delta: number) {
    this.playerAnimTime += delta;
    this.recoilKick = Math.max(0, this.recoilKick - delta / 95);
    this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - delta);

    const step = this.playerMoving ? 120 : 650;
    const showB = Math.floor(this.playerAnimTime / step) % 2 === 1;

    this.playerPoseA.setVisible(!showB).setScale(this.playerFacing, 1);
    this.playerPoseB.setVisible(showB).setScale(this.playerFacing, 1);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 34, 27, 10, 0x3d3025, 0.28);

    const makePose = (legOffset: number, bob: number) => {
      const g = this.add.graphics();

      // The human body is deliberately brighter/separated from the equipment:
      // head -> mask -> neck -> jersey -> pants -> boots. Gear accents sit on
      // top of this person instead of becoming the person.
      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1)
        .fillCircle(-7, -17 + bob, 2.5)
        .fillCircle(7, -17 + bob, 2.5);
      g.fillStyle(0x5a7348, 1).fillEllipse(0, -23 + bob, 25, 12);
      g.fillStyle(0x111715, 1).fillRoundedRect(-13, -17 + bob, 26, 10, 4);
      g.fillStyle(0x9bb9b1, 0.88).fillRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.lineStyle(1, 0xe8f2dc, 0.42).strokeRoundedRect(-9, -15 + bob, 18, 6, 2);

      // Neck and shoulders make the human anatomy readable beneath the gear.
      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8 + bob, 8, 7, 2);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1 + bob, 20, 14, 4);
      g.fillStyle(0x17201c, 0.9)
        .fillRoundedRect(-15, 0 + bob, 6, 13, 2)
        .fillRoundedRect(9, 0 + bob, 6, 13, 2);

      // Chest rig / harness: clearly equipment worn by the body.
      g.fillStyle(0xc1a86c, 1).fillRect(-10, 8 + bob, 20, 4);
      g.fillStyle(0x1d2923, 1).fillRect(-12, 12 + bob, 24, 5);
      g.fillStyle(0x5e4936, 1)
        .fillRoundedRect(-15, 8 + bob, 5, 8, 2)
        .fillRoundedRect(10, 8 + bob, 5, 8, 2);

      // Hips, separated legs and boots provide the stable ground anchor.
      g.fillStyle(0x29372f, 1).fillRoundedRect(-11, 16 + bob, 22, 7, 3);
      g.fillStyle(0x566052, 1)
        .fillRoundedRect(-10 + legOffset, 20 + bob, 8, 13, 2)
        .fillRoundedRect(2 - legOffset, 20 + bob, 8, 13, 2);
      g.fillStyle(0x202522, 1)
        .fillRoundedRect(-12 + legOffset, 30 + bob, 10, 7, 2)
        .fillRoundedRect(2 - legOffset, 30 + bob, 10, 7, 2);
      return g;
    };

    this.playerPoseA = makePose(0, 0);
    this.playerPoseB = makePose(2, 1).setVisible(false);

    this.playerArms = this.add.graphics();
    this.playerWeapon = this.add.graphics();
    this.muzzleFlash = this.add.graphics();

    container.add([shadow, this.playerPoseA, this.playerPoseB, this.playerArms, this.playerWeapon, this.muzzleFlash]);
    this.playerWeapon.setDepth(31);

    this.nameText = this.add.text(x, y - 50, this.playerName, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fff4d4',
      stroke: '#2d5d35',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);

    return container;
  }

  private updateWeaponPose() {
    if (!this.playerWeapon) return;

    const angle = Math.atan2(this.aim.y, this.aim.x);
    const recoilOffset = this.recoilKick * 7;
    this.playerWeapon.setRotation(angle);
    this.playerWeapon.setPosition(5 - recoilOffset, 3);

    const arms = this.playerArms;
    arms.setRotation(angle);
    arms.setPosition(0, 0);
    arms.clear();
    // Braced forearms: shoulders stay on the torso, hands converge on the
    // marker. This keeps the gun visibly carried rather than floating.
    arms.lineStyle(5, 0x314b3c, 1);
    arms.lineBetween(-8, 5, 5, 2);
    arms.lineBetween(8, 5, 12, 4);
    arms.fillStyle(0xd4a45d, 1).fillCircle(5, 2, 3).fillCircle(12, 4, 3);

    const g = this.playerWeapon;
    g.clear();

    // Hopper, marker body, air line/tank, grip, stock, barrel and sight.
    g.lineStyle(3, 0x6c806f, 1).lineBetween(10, 5, 2, 12);
    g.fillStyle(0x151b18, 1).fillEllipse(13, -8, 9, 7);
    g.fillStyle(0x33423b, 1).fillRoundedRect(7, -4, 18, 9, 3);
    g.fillStyle(0x111715, 1).fillRect(22, -2, 15, 5);
    g.fillStyle(0x53635c, 1).fillRect(12, -9, 8, 4);
    g.fillStyle(0x171d1b, 1).fillRoundedRect(11, 4, 5, 10, 2);
    g.fillStyle(0x493b31, 1).fillRoundedRect(-5, 4, 10, 5, 2);
    g.lineStyle(3, 0x2a332f, 1).lineBetween(-2, 6, 8, 5);

    // Short sight line is deliberately subtle; the muzzle and projectile are
    // the authoritative direction cues.
    g.lineStyle(1, 0xe8c95c, 0.45).lineBetween(35, 0, 45, 0);

    this.muzzleFlash.clear();
    this.muzzleFlash.setRotation(angle);
    this.muzzleFlash.setPosition(42 - recoilOffset, 0);
    if (this.muzzleFlashTimer > 0) {
      const pulse = this.muzzleFlashTimer / 72;
      this.muzzleFlash.fillStyle(0xffe7a3, 0.92 * pulse);
      this.muzzleFlash.fillTriangle(0, 0, 16 + 5 * pulse, -5, 16 + 5 * pulse, 5);
      this.muzzleFlash.fillStyle(0xf3a94f, 0.8 * pulse);
      this.muzzleFlash.fillCircle(5, 0, 4 + 2 * pulse);
      this.muzzleFlash.setVisible(true);
    } else {
      this.muzzleFlash.setVisible(false);
    }
  }

  private drawField() {
    const g = this.add.graphics();

    // Same quiet broad-field philosophy as Hall, but unmistakably a paintball arena.
    g.fillStyle(0x78a653, 1).fillRect(0, 0, this.worldWidth, this.worldHeight);
    g.fillStyle(0x86ad5e, 0.42).fillRect(0, 0, this.worldWidth * 0.50, this.worldHeight);
    g.fillStyle(0x679346, 0.32).fillRect(this.worldWidth * 0.50, 0, this.worldWidth * 0.50, this.worldHeight);

    // Mown lanes.
    g.fillStyle(0xd1b46c, 0.30).fillRect(0, 510, this.worldWidth, 92);
    g.fillStyle(0xd1b46c, 0.22).fillRect(870, 0, 100, this.worldHeight);

    // Paintball field perimeter.
    g.lineStyle(5, 0xf4f1df, 0.48);
    g.strokeRect(55, 70, this.worldWidth - 110, this.worldHeight - 120);

    this.drawTree(300, 280, 1.15);
    this.drawTree(2050, 300, 0.95);
    this.drawTree(350, 1110, 0.90);
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

    this.drawFlag(1180, 860, 0x2f7775, 'START');
    this.drawFlag(1830, 930, 0xd66a3d, 'TARGETS');

    this.add.text(this.start.x, this.start.y + 52, 'YOUR START', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fff4d4',
      stroke: '#315845',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);

    // Field targets are objects, not extra characters.
    this.add.text(1880, 820, 'SHOOTING RANGE', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff4d4',
      stroke: '#493526',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1)
      .fillCircle(x, y, 34 * scale)
      .fillCircle(x - 28 * scale, y + 9 * scale, 28 * scale)
      .fillCircle(x + 28 * scale, y + 9 * scale, 29 * scale);
    g.fillStyle(0x526d3c, 0.75).fillCircle(x + 5 * scale, y - 16 * scale, 23 * scale);
  }

  private drawBunker(x: number, y: number, width: number, height: number, color: number) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, 0.24).fillRect(x + 8, y + 9, width, height);
    g.fillStyle(color, 1).fillRoundedRect(x, y, width, height, 10);
    g.fillStyle(0xffffff, 0.12).fillRect(x + 12, y + 10, width - 24, 5);
    g.lineStyle(2, 0xf4f1df, 0.28).strokeRoundedRect(x, y, width, height, 10);
    this.covers.push(new Phaser.Geom.Rectangle(x, y, width, height));
  }

  private drawTireStack(x: number, y: number) {
    const g = this.add.graphics();
    for (let i = 0; i < 4; i += 1) {
      g.fillStyle(0x2b302d, 1).fillCircle(x + i * 17, y - i * 3, 19);
      g.fillStyle(0x66706a, 1).fillCircle(x + i * 17, y - i * 3, 7);
    }
    this.covers.push(new Phaser.Geom.Rectangle(x - 20, y - 25, 90, 45));
  }

  private drawFlag(x: number, y: number, color: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(0x594838, 1).fillRect(x, y, 4, 78);
    g.fillStyle(color, 1).fillTriangle(x + 4, y + 4, x + 64, y + 18, x + 4, y + 32);
    this.add.text(x + 32, y + 50, label, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#fff4d4',
      stroke: '#493526',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
  }

  private createTargets() {
    const targets = [
      { x: 1820, y: 430, kind: 'dummy' as const },
      { x: 1970, y: 520, kind: 'bottle' as const },
      { x: 1880, y: 650, kind: 'dummy' as const },
      { x: 2050, y: 760, kind: 'bottle' as const },
      { x: 1740, y: 820, kind: 'dummy' as const },
      { x: 1940, y: 900, kind: 'bottle' as const },
    ];

    for (const target of targets) {
      const body = this.add.container(target.x, target.y).setDepth(15);
      const splatter = this.add.graphics().setDepth(1);
      const post = this.add.rectangle(0, 30, 7, 60, 0x594838, 1);

      let plate: Phaser.GameObjects.Arc;
      if (target.kind === 'bottle') {
        body.add(this.add.rectangle(0, 5, 18, 34, 0xddd8c2, 1));
        body.add(this.add.rectangle(0, -14, 8, 5, 0x5f6e69, 1));
        plate = this.add.circle(0, -1, 9, 0xf4f1df, 1).setStrokeStyle(2, 0xd66a3d, 0.9);
      } else {
        plate = this.add.circle(0, 0, 24, 0xd66a3d, 1)
          .setStrokeStyle(3, 0xf4f1df, 0.8);
        body.add(this.add.circle(0, 0, 8, 0xf4f1df, 1));
      }

      body.add([post, plate, splatter]);
      this.targets.push({
        body,
        plate,
        splatter,
        kind: target.kind,
        x: target.x,
        y: target.y,
        hits: 0,
      });
    }
  }

  private showTargetSplatter(target: Target) {
    const g = target.splatter;
    g.clear();

    // Paint remains on the target after the hit. It is feedback, not a
    // disappearing “hit effect”, so the range visibly records where the
    // player has been shooting.
    const marks = [
      [-8, -5, 4],
      [5, -7, 3],
      [10, 2, 2.5],
      [-4, 7, 2.5],
      [3, 2, 5],
    ];

    g.fillStyle(0xe94f46, 0.9);
    for (const [x, y, radius] of marks) {
      g.fillCircle(x + Phaser.Math.Between(-2, 2), y + Phaser.Math.Between(-2, 2), radius);
    }

    g.fillStyle(0xf27b4f, 0.72);
    g.fillCircle(-12, 8, 2);
    g.fillCircle(12, -9, 2);
    g.lineStyle(2, 0xe94f46, 0.72);
    g.lineBetween(-12, -2, -17, -7);
    g.lineBetween(10, 6, 16, 10);
  }

  private hitCover(x: number, y: number, padding = 12) {
    return this.covers.some((cover) =>
      x >= cover.x - padding &&
      x <= cover.x + cover.width + padding &&
      y >= cover.y - padding &&
      y <= cover.y + cover.height + padding,
    );
  }

  private createHud() {
    const plate = this.add.rectangle(12, 12, 205, 42, 0x2d241e, 0.78)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(70)
      .setStrokeStyle(1, 0xe7d6a4, 0.35);

    this.statusText = this.add.text(24, 20, 'FIELD TRAINING  ·  MOVE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fff4d4',
      letterSpacing: 0.8,
    }).setScrollFactor(0).setDepth(71);

    this.hintText = this.add.text(this.scale.width / 2, 18, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fff6dc',
      stroke: '#2c241d',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(71);

    this.finishButton = this.add.text(this.scale.width - 16, 52, 'END DRILL', { fontFamily: 'monospace', fontSize: '9px', color: '#102018', backgroundColor: '#e8c95c', padding: { left: 9, right: 9, top: 8, bottom: 8 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(72).setInteractive();
    this.finishButton.on('pointerdown', () => this.finishTraining());

    this.add.text(this.scale.width - 16, 16, 'SHOOTERS TRIGGER', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fff4d4',
      stroke: '#493526',
      strokeThickness: 4,
      letterSpacing: 1,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(71);

    plate.setData('hud', true);
    this.layoutUi(this.scale.width, this.scale.height);
  }

  private finishTraining() {
    if (this.sessionFinished) return;
    this.sessionFinished = true;
    finishShooting(this.progress);
    this.cameras.main.fadeOut(300, 16, 26, 19);
    this.time.delayedCall(300, () => this.scene.start('ShootersTriggerLobbyScene'));
  }

  private updateHud() {
    const distance = this.playerTarget
      ? Math.round(Phaser.Math.Distance.Between(this.player.x, this.player.y, this.playerTarget.x, this.playerTarget.y))
      : 0;

    this.hintText.setText(
      this.isPhoneSession()
        ? 'MOVE  ·  DRAG RIGHT TO AIM  ·  FIRE  ·  60s'

        : 'DRILL '+Math.max(0,60-Math.floor(this.sessionElapsed/1000))+'s  ·  HITS '+(this.progress.shootingTraining.scrapes+this.progress.shootingTraining.markerHits+this.progress.shootingTraining.centerMass+this.progress.shootingTraining.headshots)+'  ·  END DRILL'
        : distance > 0
          ? `WALKING TO MARKER  ·  ${distance}`
          : 'WASD / ARROWS  ·  MOUSE AIM  ·  LEFT CLICK / SPACE FIRE',
    );

    this.nameText.setPosition(this.player.x, this.player.y - 48);
    this.updateAimMarker();
  }

  private updateAimMarker() {
    this.aimUi.clear();
    if (!this.aimPoint) return;

    const camera = this.cameras.main;
    const x = (this.aimPoint.x - camera.scrollX) * camera.zoom;
    const y = (this.aimPoint.y - camera.scrollY) * camera.zoom;

    this.aimUi.lineStyle(1.5, 0xe8c95c, 0.72);
    this.aimUi.strokeCircle(x, y, 10);
    this.aimUi.lineBetween(x - 7, y, x - 2, y);
    this.aimUi.lineBetween(x + 2, y, x + 7, y);
    this.aimUi.lineBetween(x, y - 7, x, y - 2);
    this.aimUi.lineBetween(x, y + 2, x, y + 7);
  }

  private handleResize(width: number, height: number) {
    // Same responsive camera contract as Hall: full viewport, smooth follow,
    // no gameplay zoom or portrait-specific world rewrite.
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setDeadzone(
      Math.min(width * 0.28, 320),
      Math.min(height * 0.22, 150),
    );
    this.layoutUi(width, height);
  }

  private layoutUi(width: number, _height: number) {
    this.hintText?.setPosition(width / 2, 18);
  }
}
