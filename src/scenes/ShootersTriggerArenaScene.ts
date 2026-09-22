import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

type Fighter = {
  body: Phaser.GameObjects.Container;
  hp: number;
  score: number;
  speed: number;
  cooldown: number;
  accuracy: number;
  movement: number;
  pressure: number;
  coverUse: number;
};

type Shot = {
  body: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  owner: 'player' | 'rival';
  ttl: number;
};

type RivalProfile = {
  id: 'marksman' | 'runner' | 'all-rounder';
  operator: string;
  shooting: number;
  movement: number;
  pressure: number;
  coverUse: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class ShootersTriggerArenaScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();

  private player!: Fighter;
  private rival!: Fighter;
  private rivalProfile!: RivalProfile;
  private playerPoseA!: Phaser.GameObjects.Graphics;
  private playerPoseB!: Phaser.GameObjects.Graphics;
  private playerWeapon!: Phaser.GameObjects.Graphics;
  private playerArms!: Phaser.GameObjects.Graphics;
  private playerMuzzle!: Phaser.GameObjects.Graphics;
  private rivalPoseA!: Phaser.GameObjects.Graphics;
  private rivalPoseB!: Phaser.GameObjects.Graphics;
  private rivalWeapon!: Phaser.GameObjects.Graphics;
  private rivalArms!: Phaser.GameObjects.Graphics;
  private rivalMuzzle!: Phaser.GameObjects.Graphics;
  private shots: Shot[] = [];
  private covers: Phaser.Geom.Rectangle[] = [];
  private cleanup?: () => void;
  private exitButton?: HTMLButtonElement;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private matchOver = false;
  private playerMoving = false;
  private rivalMoving = false;
  private playerFacing = 1;
  private rivalFacing = -1;
  private playerAnimTime = 0;
  private rivalAnimTime = 0;
  private aim = new Phaser.Math.Vector2(1, 0);
  private fire = false;
  private scoreHud?: Phaser.GameObjects.Text;
  private statusHud?: Phaser.GameObjects.Text;
  private profileHud?: Phaser.GameObjects.Text;
  private playerHeadshots = 0;
  private playerBodyHits = 0;
  private playerMisses = 0;
  private rivalHeadshots = 0;
  private rivalBodyHits = 0;
  private rivalMisses = 0;
  private roundHits = 0;
  private roundRivalHits = 0;
  private playerSkill = 0;
  private evasionSkill = 0;
  private arenaStartedAt = 0;

  constructor() {
    super('ShootersTriggerArenaScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#6f984b');
    this.drawField();

    this.loadPreparation();
    this.rivalProfile = this.chooseRivalProfile();

    this.player = this.createFighter(1180, 1040, 0x2f6b4e, 'YOU', true);
    this.rival = this.createFighter(1180, 330, 0x9b3f3f, this.rivalProfile.operator, false);

    this.player.speed = 170 + this.evasionSkill * 0.45;
    this.player.cooldown = Math.max(130, 330 - this.playerSkill * 1.15);

    this.rival.speed = 145 + this.rivalProfile.movement * 0.55;
    this.rival.cooldown = Math.max(360, 930 - this.rivalProfile.shooting * 5.4);

    this.cameras.main.setBounds(0, 0, 2400, 1400);
    this.cameras.main.startFollow(this.player.body, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(
      Math.min(this.scale.width * 0.28, 320),
      Math.min(this.scale.height * 0.22, 150),
    );

    this.createHud();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.cleanup = installShootersTriggerMobileControls();
    this.createExitButton();

    this.arenaStartedAt = Date.now();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.cleanup?.();
      this.exitButton?.remove();
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time: number, delta: number) {
    if (this.matchOver) return;

    this.movePlayer(delta);
    this.updateRival(delta);
    this.updateShots(delta);
    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    this.rival.cooldown = Math.max(0, this.rival.cooldown - delta);

    if (this.fire) this.playerFire();

    this.updateAnimations(delta);
    this.updateWeaponPoses();
    this.updateHud();
  }

  public setMoveVector(x: number, y: number) {
    this.joystickVector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
  }

  public setFireHeld(value: boolean) {
    this.fire = value;
  }

  public setAimVector(x: number, y: number) {
    const length = Math.hypot(x, y);
    if (length > 0.05) this.aim.set(x / length, y / length);
  }

  public isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  private loadPreparation() {
    try {
      const shooting = JSON.parse(localStorage.getItem('shooters-trigger:last-shooting') || 'null');
      const evasion = JSON.parse(localStorage.getItem('shooters-trigger:last-evasion') || 'null');
      this.playerSkill = clamp(Number(shooting?.accuracy || 0), 0, 100);
      const survived = clamp(Number(evasion?.survived || 0) / 600, 0, 100);
      const cover = clamp(Number(evasion?.coverBlocks || 0) * 8, 0, 35);
      const scrapeAvoidance = clamp(Number(evasion?.scrapes || 0) * 1.5, 0, 20);
      this.evasionSkill = clamp(survived + cover + scrapeAvoidance, 0, 100);
    } catch {
      this.playerSkill = 0;
      this.evasionSkill = 0;
    }
  }

  private chooseRivalProfile(): RivalProfile {
    const profiles: RivalProfile[] = [
      {
        id: 'marksman',
        operator: 'OPERATOR 12',
        shooting: clamp(this.playerSkill + 10, 38, 96),
        movement: clamp(this.evasionSkill - 8, 34, 88),
        pressure: clamp(this.playerSkill * 0.7 + 22, 35, 90),
        coverUse: clamp(this.evasionSkill * 0.45 + 25, 25, 82),
      },
      {
        id: 'runner',
        operator: 'OPERATOR 07',
        shooting: clamp(this.playerSkill - 6, 30, 88),
        movement: clamp(this.evasionSkill + 14, 48, 97),
        pressure: clamp(this.evasionSkill * 0.75 + 20, 40, 95),
        coverUse: clamp(this.evasionSkill * 0.65 + 28, 30, 92),
      },
      {
        id: 'all-rounder',
        operator: 'OPERATOR 21',
        shooting: clamp(this.playerSkill + 7, 36, 94),
        movement: clamp(this.evasionSkill + 7, 42, 94),
        pressure: clamp((this.playerSkill + this.evasionSkill) * 0.5 + 18, 38, 93),
        coverUse: clamp(this.evasionSkill * 0.55 + 30, 28, 88),
      },
    ];

    return Phaser.Utils.Array.GetRandom(profiles);
  }

  private movePlayer(delta: number) {
    let dx = this.joystickVector.x;
    let dy = this.joystickVector.y;

    if (!dx && !dy) {
      dx = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
      dy = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
    }

    this.playerMoving = Boolean(dx || dy);
    if (!dx && !dy) return;

    if (Math.abs(dx) > 0.08) this.playerFacing = dx < 0 ? -1 : 1;

    const length = Math.hypot(dx, dy) || 1;
    const nx = Phaser.Math.Clamp(this.player.body.x + (dx / length) * this.player.speed * delta / 1000, 42, 2358);
    const ny = Phaser.Math.Clamp(this.player.body.y + (dy / length) * this.player.speed * delta / 1000, 90, 1350);

    if (!this.inCover(nx, ny, 14)) {
      this.player.body.x = nx;
      this.player.body.y = ny;
    }
  }

  private updateRival(delta: number) {
    const dx = this.player.body.x - this.rival.body.x;
    const dy = this.player.body.y - this.rival.body.y;
    const distance = Math.hypot(dx, dy) || 1;
    const direction = new Phaser.Math.Vector2(dx / distance, dy / distance);

    let moveX = 0;
    let moveY = 0;

    if (this.rivalProfile.id === 'marksman') {
      if (distance < 470) {
        moveX = -direction.x;
        moveY = -direction.y;
      } else if (distance > 760) {
        moveX = direction.x;
        moveY = direction.y;
      } else {
        moveX = -direction.y * 0.5;
        moveY = direction.x * 0.5;
      }
    } else if (this.rivalProfile.id === 'runner') {
      if (distance > 260) {
        moveX = direction.x;
        moveY = direction.y;
      } else {
        moveX = -direction.y;
        moveY = direction.x;
      }
    } else {
      if (distance > 540) {
        moveX = direction.x;
        moveY = direction.y;
      } else if (distance < 360) {
        moveX = -direction.x;
        moveY = -direction.y;
      } else {
        moveX = -direction.y * 0.65;
        moveY = direction.x * 0.65;
      }
    }

    const moveLength = Math.hypot(moveX, moveY) || 1;
    this.rivalMoving = Boolean(moveX || moveY);
    if (Math.abs(moveX) > 0.08) this.rivalFacing = moveX < 0 ? -1 : 1;

    const nextX = Phaser.Math.Clamp(
      this.rival.body.x + (moveX / moveLength) * this.rival.speed * delta / 1000,
      42,
      2358,
    );
    const nextY = Phaser.Math.Clamp(
      this.rival.body.y + (moveY / moveLength) * this.rival.speed * delta / 1000,
      90,
      1350,
    );

    if ((Math.random() * 100) < this.rivalProfile.coverUse * delta / 1000 * 0.9) {
      const cover = this.findUsefulCover();
      if (cover) {
        const cx = cover.x + cover.width / 2;
        const cy = cover.y + cover.height / 2;
        const toCover = new Phaser.Math.Vector2(cx - this.rival.body.x, cy - this.rival.body.y).normalize();
        if (!this.inCover(nextX, nextY, 14)) {
          this.rival.body.x += toCover.x * this.rival.speed * delta / 1000;
          this.rival.body.y += toCover.y * this.rival.speed * delta / 1000;
        }
      }
    } else if (!this.inCover(nextX, nextY, 14)) {
      this.rival.body.x = nextX;
      this.rival.body.y = nextY;
    }

    if (this.rival.cooldown <= 0 && distance < 980) this.rivalFire(direction);
  }

  private findUsefulCover() {
    return this.covers
      .map((cover) => ({
        cover,
        distance: Phaser.Math.Distance.Between(
          this.rival.body.x,
          this.rival.body.y,
          cover.x + cover.width / 2,
          cover.y + cover.height / 2,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.cover;
  }

  private playerFire() {
    if (this.player.cooldown > 0) return;

    this.player.cooldown = Math.max(130, 330 - this.playerSkill * 1.15);
    this.spawnShot(
      this.player.body.x + this.aim.x * 42,
      this.player.body.y + this.aim.y * 42,
      this.aim,
      'player',
    );
  }

  private rivalFire(direction: Phaser.Math.Vector2) {
    const accuracy = this.rivalProfile.shooting;
    const spreadDegrees = clamp(22 - accuracy * 0.17, 5, 22);
    const angle = Math.atan2(direction.y, direction.x) + Phaser.Math.DegToRad(
      Phaser.Math.FloatBetween(-spreadDegrees, spreadDegrees),
    );
    const aim = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));

    this.rival.cooldown = Math.max(330, 930 - accuracy * 5.4);
    this.spawnShot(
      this.rival.body.x + aim.x * 42,
      this.rival.body.y + aim.y * 42,
      aim,
      'rival',
    );
  }

  private spawnShot(
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    owner: 'player' | 'rival',
  ) {
    const ball = this.add.circle(x, y, 4, owner === 'player' ? 0xf0dfb6 : 0xe44f3d).setDepth(25);
    this.shots.push({
      body: ball,
      vx: direction.x * 520,
      vy: direction.y * 520,
      owner,
      ttl: 1100,
    });
  }

  private updateShots(delta: number) {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const shot = this.shots[i];
      shot.ttl -= delta;

      const nx = shot.body.x + shot.vx * delta / 1000;
      const ny = shot.body.y + shot.vy * delta / 1000;

      if (
        shot.ttl <= 0 ||
        nx < 0 ||
        nx > 2400 ||
        ny < 0 ||
        ny > 1400 ||
        this.inCover(nx, ny)
      ) {
        if (shot.owner === 'player') this.playerMisses += 1;
        else this.rivalMisses += 1;
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }

      shot.body.x = nx;
      shot.body.y = ny;

      const target = shot.owner === 'player' ? this.rival : this.player;
      const headDistance = Phaser.Math.Distance.Between(shot.body.x, shot.body.y, target.body.x, target.body.y - 25);
      const bodyDistance = Phaser.Math.Distance.Between(shot.body.x, shot.body.y, target.body.x, target.body.y + 1);

      if (headDistance < 14 || bodyDistance < 24) {
        const headshot = headDistance < 14 && headDistance < bodyDistance;
        this.resolveHit(shot.owner, headshot);
        shot.body.destroy();
        this.shots.splice(i, 1);
      }
    }
  }

  private resolveHit(owner: 'player' | 'rival', headshot: boolean) {
    const target = owner === 'player' ? this.rival : this.player;

    if (owner === 'player') {
      if (headshot) this.playerHeadshots += 1;
      else this.playerBodyHits += 1;
    } else if (headshot) {
      this.rivalHeadshots += 1;
    } else {
      this.rivalBodyHits += 1;
    }

    if (headshot) {
      if (owner === 'player') this.roundHits += 1;
      else this.roundRivalHits += 1;
      this.flash(target, headshot);
      this.roundPoint(owner);
      return;
    }

    target.hp -= 1;
    if (owner === 'player') this.roundHits += 1;
    else this.roundRivalHits += 1;

    this.flash(target, false);

    if (target.hp <= 0) this.roundPoint(owner);
  }

  private roundPoint(winner: 'player' | 'rival') {
    if (winner === 'player') this.player.score += 1;
    else this.rival.score += 1;

    this.shots.forEach((shot) => shot.body.destroy());
    this.shots = [];

    if (this.player.score >= 3 || this.rival.score >= 3) {
      this.matchOver = true;
      this.showResult();
      return;
    }

    this.player.hp = 2;
    this.rival.hp = 2;
    this.player.body.setPosition(1180, 1040);
    this.rival.body.setPosition(1180, 330);
    this.rival.cooldown = 700;
    this.statusHud?.setText('ROUND RESET  ·  FIRST TO 3');
  }

  private flash(target: Fighter, headshot: boolean) {
    target.body.setScale(headshot ? 1.28 : 1.16);
    this.time.delayedCall(headshot ? 160 : 90, () => target.body.setScale(1));
    this.statusHud?.setText(headshot ? 'HEADSHOT  ·  ROUND POINT' : 'BODY HIT  ·  ONE MORE TO ELIMINATE');
  }

  private showResult() {
    const won = this.player.score > this.rival.score;
    const reward = won ? 25 : 0;
    const completedAt = Date.now();

    try {
      const current = Number(localStorage.getItem('shooters-trigger:budget') || 0);
      localStorage.setItem('shooters-trigger:budget', String(current + reward));
      localStorage.setItem(
        'shooters-trigger:last-arena',
        JSON.stringify({
          result: won ? 'WIN' : 'LOSS',
          score: [this.player.score, this.rival.score],
          rival: {
            operator: this.rivalProfile.operator,
            profile: this.rivalProfile.id,
            shooting: this.rivalProfile.shooting,
            movement: this.rivalProfile.movement,
            pressure: this.rivalProfile.pressure,
            coverUse: this.rivalProfile.coverUse,
          },
          player: {
            shooting: this.playerSkill,
            movement: this.evasionSkill,
          },
          headshots: {
            player: this.playerHeadshots,
            rival: this.rivalHeadshots,
          },
          bodyHits: {
            player: this.playerBodyHits,
            rival: this.rivalBodyHits,
          },
          misses: {
            player: this.playerMisses,
            rival: this.rivalMisses,
          },
          completedAt,
          durationMs: Math.max(0, completedAt - this.arenaStartedAt),
          budgetEarned: reward,
        }),
      );
    } catch {}

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '1600',
      display: 'grid',
      placeItems: 'center',
      padding: 'max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))',
      background: 'rgba(12,18,14,.78)',
      fontFamily: 'monospace',
      boxSizing: 'border-box',
      overflow: 'auto',
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(430px, calc(100vw - 24px))',
      maxHeight: 'calc(100dvh - 24px)',
      overflowY: 'auto',
      padding: '24px',
      background: '#151a16',
      border: '2px solid #e8c95c',
      borderRadius: '14px',
      textAlign: 'center',
      color: '#f4f1df',
      boxSizing: 'border-box',
    });

    card.innerHTML =
      '<div style="color:#e8c95c;font-size:20px;font-weight:800">ARENA COMPLETE</div>' +
      '<div style="margin:14px 0;font-size:14px">' +
      (won ? 'MATCH WON' : 'MATCH LOST') +
      ' · YOU ' + this.player.score + ' — ' + this.rival.score + ' ' + this.rivalProfile.operator +
      '</div>' +
      '<div style="font-size:11px;line-height:1.7">' +
      this.rivalProfile.id.toUpperCase() + ' · SHOOTING ' + Math.round(this.rivalProfile.shooting) +
      ' · MOVEMENT ' + Math.round(this.rivalProfile.movement) +
      '<br>HEADSHOTS YOU ' + this.playerHeadshots +
      ' · BODY HITS YOU ' + this.playerBodyHits +
      '<br>BUDGET EARNED · ' + reward +
      '</div>';

    const button = document.createElement('button');
    button.textContent = 'RETURN TO HOME FIELD';
    Object.assign(button.style, {
      marginTop: '20px',
      minHeight: '48px',
      padding: '10px 18px',
      background: '#e8c95c',
      border: 0,
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontWeight: '800',
      touchAction: 'manipulation',
    });
    button.onclick = () => {
      panel.remove();
      this.scene.start('ShootersTriggerLobbyScene');
    };

    card.appendChild(button);
    panel.appendChild(card);
    document.body.appendChild(panel);
  }

  private createHud() {
    this.add.text(18, 18, 'ARENA · FIRST TO 3', {
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setScrollFactor(0).setDepth(90);

    this.scoreHud = this.add.text(this.scale.width / 2, 18, 'YOU 0  ·  RIVAL 0', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setOrigin(.5, 0).setScrollFactor(0).setDepth(90);

    this.profileHud = this.add.text(18, 43, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#e8c95c',
    }).setScrollFactor(0).setDepth(90);

    this.statusHud = this.add.text(this.scale.width / 2, 43, 'MOVE · AIM · FIRE · USE COVER', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#f4f1df',
    }).setOrigin(.5, 0).setScrollFactor(0).setDepth(90);
  }

  private updateHud() {
    this.scoreHud?.setText('YOU ' + this.player.score + '  ·  ' + this.rivalProfile.operator + ' ' + this.rival.score);
    this.profileHud?.setText(
      this.rivalProfile.operator + ' · ' +
      this.rivalProfile.id.toUpperCase() + ' · S ' +
      Math.round(this.rivalProfile.shooting) + ' · M ' +
      Math.round(this.rivalProfile.movement),
    );
  }

  private createExitButton() {
    const button = document.createElement('button');
    button.textContent = 'EXIT ARENA · HOME FIELD';
    Object.assign(button.style, {
      position: 'fixed',
      right: '18px',
      top: '18px',
      minHeight: '44px',
      padding: '9px 14px',
      border: '2px solid #f4f1df',
      borderRadius: '10px',
      background: '#102018',
      color: '#f4f1df',
      fontFamily: 'monospace',
      fontSize: '10px',
      fontWeight: '800',
      zIndex: '1450',
      touchAction: 'manipulation',
    });
    button.onclick = () => this.scene.start('ShootersTriggerLobbyScene');
    document.body.appendChild(button);
    this.exitButton = button;
  }

  private updateAnimations(delta: number) {
    this.playerAnimTime += delta;
    this.rivalAnimTime += delta;

    const playerStep = this.playerMoving ? 120 : 650;
    const rivalStep = this.rivalMoving ? 115 : 650;

    const playerB = Math.floor(this.playerAnimTime / playerStep) % 2 === 1;
    const rivalB = Math.floor(this.rivalAnimTime / rivalStep) % 2 === 1;

    this.playerPoseA.setVisible(!playerB).setScale(this.playerFacing, 1);
    this.playerPoseB.setVisible(playerB).setScale(this.playerFacing, 1);
    this.rivalPoseA.setVisible(!rivalB).setScale(this.rivalFacing, 1);
    this.rivalPoseB.setVisible(rivalB).setScale(this.rivalFacing, 1);
  }

  private updateWeaponPoses() {
    this.updateWeaponPose(this.playerWeapon, this.playerArms, this.playerMuzzle, this.aim);
    const rivalAim = new Phaser.Math.Vector2(
      this.player.body.x - this.rival.body.x,
      this.player.body.y - this.rival.body.y,
    ).normalize();
    this.updateWeaponPose(this.rivalWeapon, this.rivalArms, this.rivalMuzzle, rivalAim);
  }

  private updateWeaponPose(
    fighter: Fighter,
    weapon: Phaser.GameObjects.Graphics,
    arms: Phaser.GameObjects.Graphics,
    muzzle: Phaser.GameObjects.Graphics,
    aim: Phaser.Math.Vector2,
  ) {
    const angle = Math.atan2(aim.y, aim.x);
    weapon.setRotation(angle).setPosition(5, 3);
    arms.setRotation(angle).setPosition(0, 0);
    arms.clear();
    arms.lineStyle(5, 0x314b3c, 1);
    arms.lineBetween(-8, 5, 5, 2);
    arms.lineBetween(8, 5, 12, 4);
    arms.fillStyle(0xd4a45d, 1).fillCircle(5, 2, 3).fillCircle(12, 4, 3);

    weapon.clear();
    weapon.lineStyle(3, 0x6c806f, 1).lineBetween(10, 5, 2, 12);
    weapon.fillStyle(0x151b18, 1).fillEllipse(13, -8, 9, 7);
    weapon.fillStyle(0x33423b, 1).fillRoundedRect(7, -4, 18, 9, 3);
    weapon.fillStyle(0x111715, 1).fillRect(22, -2, 15, 5);
    weapon.fillStyle(0x53635c, 1).fillRect(12, -9, 8, 4);
    weapon.fillStyle(0x171d1b, 1).fillRoundedRect(11, 4, 5, 10, 2);
    weapon.fillStyle(0x493b31, 1).fillRoundedRect(-5, 4, 10, 5, 2);
    weapon.lineStyle(3, 0x2a332f, 1).lineBetween(-2, 6, 8, 5);
    weapon.lineStyle(1, 0xe8c95c, 0.45).lineBetween(35, 0, 45, 0);

    muzzle.clear();
    muzzle.setRotation(angle).setPosition(42, 0);
    muzzle.fillStyle(0xffe7a3, 0.7);
    muzzle.fillTriangle(0, 0, 13, -4, 13, 4);
  }

  private createFighter(x: number, y: number, color: number, label: string, player: boolean) {
    const container = this.add.container(x, y).setDepth(30);
    const shadow = this.add.ellipse(0, 34, 27, 10, 0x3d3025, 0.28);

    const makePose = (legOffset: number, bob: number) => {
      const g = this.add.graphics();

      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1).fillCircle(-7, -17 + bob, 2.5).fillCircle(7, -17 + bob, 2.5);
      g.fillStyle(color, 1).fillEllipse(0, -23 + bob, 25, 12);
      g.fillStyle(0x111715, 1).fillRoundedRect(-13, -17 + bob, 26, 10, 4);
      g.fillStyle(0x9bb9b1, 0.88).fillRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.lineStyle(1, 0xe8f2dc, 0.42).strokeRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8 + bob, 8, 7, 2);
      g.fillStyle(color, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
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

    const poseA = makePose(0, 0);
    const poseB = makePose(2, 1).setVisible(false);
    const arms = this.add.graphics();
    const weapon = this.add.graphics();
    const muzzle = this.add.graphics();

    container.add([shadow, poseA, poseB, arms, weapon, muzzle]);

    const name = this.add.text(x, y - 50, label, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fff4d4',
      stroke: '#2d5d35',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);

    if (player) {
      this.playerPoseA = poseA;
      this.playerPoseB = poseB;
      this.playerArms = arms;
      this.playerWeapon = weapon;
      this.playerMuzzle = muzzle;
    } else {
      this.rivalPoseA = poseA;
      this.rivalPoseB = poseB;
      this.rivalArms = arms;
      this.rivalWeapon = weapon;
      this.rivalMuzzle = muzzle;
    }

    name.setData('fighter', player ? 'player' : 'rival');
    return {
      body: container,
      hp: 2,
      score: 0,
      speed: 170,
      cooldown: 500,
      accuracy: player ? this.playerSkill : this.rivalProfile?.shooting || 0,
      movement: player ? this.evasionSkill : this.rivalProfile?.movement || 0,
      pressure: player ? this.playerSkill : this.rivalProfile?.pressure || 0,
      coverUse: player ? this.evasionSkill : this.rivalProfile?.coverUse || 0,
    };
  }

  private drawField() {
    const g = this.add.graphics();

    // Deliberately mirrors the Shooting Training field: same scale, ground,
    // lanes, perimeter, trees, bunkers and tire stacks. Arena removes targets
    // and uses the open space for the rival match.
    const worldWidth = 2400;
    const worldHeight = 1400;

    g.fillStyle(0x78a653, 1).fillRect(0, 0, worldWidth, worldHeight);
    g.fillStyle(0x86ad5e, 0.42).fillRect(0, 0, worldWidth * 0.50, worldHeight);
    g.fillStyle(0x679346, 0.32).fillRect(worldWidth * 0.50, 0, worldWidth * 0.50, worldHeight);
    g.fillStyle(0xd1b46c, 0.30).fillRect(0, 510, worldWidth, 92);
    g.fillStyle(0xd1b46c, 0.22).fillRect(870, 0, 100, worldHeight);

    g.lineStyle(5, 0xf4f1df, 0.48);
    g.strokeRect(55, 70, worldWidth - 110, worldHeight - 120);

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

    this.drawFlag(1180, 860, 0x2f7775, 'ARENA');
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1).fillCircle(x, y, 34 * scale).fillCircle(x - 28 * scale, y + 9 * scale, 28 * scale).fillCircle(x + 28 * scale, y + 9 * scale, 29 * scale);
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

  private handleResize(width: number, height: number) {
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setDeadzone(
      Math.min(width * 0.28, 320),
      Math.min(height * 0.22, 150),
    );
    this.scoreHud?.setPosition(width / 2, 18);
    this.statusHud?.setPosition(width / 2, 43);
  }

  private inCover(x: number, y: number, padding = 12) {
    return this.covers.some((cover) =>
      x >= cover.x - padding &&
      x <= cover.x + cover.width + padding &&
      y >= cover.y - padding &&
      y <= cover.y + cover.height + padding
    );
  }
}
