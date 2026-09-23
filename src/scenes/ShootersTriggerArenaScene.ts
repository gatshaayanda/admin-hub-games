import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

type Fighter = {
  body: Phaser.GameObjects.Container;
  hp: number;
  wounded: boolean;
  downed: boolean;
  damagePaint: Phaser.GameObjects.Graphics;
  droppedWeapon: Phaser.GameObjects.Graphics;
  weaponDropped: boolean;
  maxAmmo: number;
  ammo: number;
  refilling: boolean;
  refillElapsed: number;
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
const ARENA_NEUTRAL_BASELINE = true;
const ARENA_BASE_SPEED = 170;
const ARENA_BASE_COOLDOWN = 360;
const ARENA_AMMO_CAPACITY = 24;
const ARENA_REFILL_DURATION = 2500;
const ARENA_AMMO_STATIONS = [
  new Phaser.Geom.Rectangle(250, 640, 190, 130),
  new Phaser.Geom.Rectangle(1960, 640, 190, 130),
];
const ARENA_STEALTH_RADIUS = 78;
const ARENA_STEALTH_BREAK_MS = 1200;
const ARENA_PLAYER_SPAWN = new Phaser.Math.Vector2(360, 1040);
const ARENA_RIVAL_SPAWN = new Phaser.Math.Vector2(2040, 430);
const ARENA_RIVAL_FIRE_RANGE = 720;
const ARENA_RIVAL_OPENING_DELAY_MS = 0;
const ARENA_MAX_BODY_HITS = 2;
const ARENA_BODY_CORE_RADIUS = 30;
const ARENA_SCRAPE_RADIUS = 44;
const ARENA_CLOSE_IMPACT_RANGE = 220;

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
  private concealments: Phaser.Geom.Circle[] = [];
  private playerLastKnown = new Phaser.Math.Vector2(1180, 1040);
  private playerRevealedUntil = 0;
  private playerLastFiredAt = 0;
  private cleanup?: () => void;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private matchOver = false;
  private paused = false;
  private roundTransition = false;
  private resolvingRound = false;
  private pauseButton?: HTMLButtonElement;
  private pausePanel?: HTMLDivElement;
  private resultPanel?: HTMLDivElement;
  private splatter: Phaser.GameObjects.Graphics[] = [];
  private playerScrapes = 0;
  private rivalScrapes = 0;
  private playerPaintHits = 0;
  private rivalPaintHits = 0;
  private playerMoving = false;
  private rivalMoving = false;
  private playerFacing = 1;
  private rivalFacing = -1;
  private playerAnimTime = 0;
  private rivalAnimTime = 0;
  private aim = new Phaser.Math.Vector2(1, 0);
  private fire = false;
  private manualAim = false;
  private scoreHud?: Phaser.GameObjects.Text;
  private statusHud?: Phaser.GameObjects.Text;
  private playerHeadshots = 0;
  private playerBodyHits = 0;
  private playerMisses = 0;
  private rivalHeadshots = 0;
  private rivalBodyHits = 0;
  private rivalMisses = 0;
  private playerWeaponKnockouts = 0;
  private rivalWeaponKnockouts = 0;
  private playerShotsFired = 0;
  private rivalShotsFired = 0;
  private ammoHud?: Phaser.GameObjects.Text;
  private roundHits = 0;
  private roundRivalHits = 0;
  private playerSkill = 0;
  private evasionSkill = 0;
  private arenaStartedAt = 0;
  private rivalCanFireAt = 0;
  private rivalLastFiredAt = 0;
  private rivalRevealedUntil = 0;
  private rivalDecisionAt = 0;
  private rivalMode: 'PRESSURE' | 'FLANK' | 'HIDE' | 'SEARCH' = 'PRESSURE';
  private rivalTargetPoint = new Phaser.Math.Vector2(0, 0);
  private stealthIndicators: Array<{ ring: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; x: number; y: number; radius: number }> = [];
  private locatorPanel?: HTMLDivElement;
  private locatorCanvas?: HTMLCanvasElement;
  private locatorCtx?: CanvasRenderingContext2D | null;
  private locatorArrow?: HTMLDivElement;

  constructor() {
    super('ShootersTriggerArenaScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#6f984b');
    this.drawField();

    this.loadPreparation();
    this.rivalProfile = this.chooseRivalProfile();

    this.player = this.createFighter(ARENA_PLAYER_SPAWN.x, ARENA_PLAYER_SPAWN.y, 0x2f6b4e, 'YOU', true);
    this.rival = this.createFighter(ARENA_RIVAL_SPAWN.x, ARENA_RIVAL_SPAWN.y, 0x9b3f3f, this.rivalProfile.operator, false);

    this.player.speed = ARENA_NEUTRAL_BASELINE ? ARENA_BASE_SPEED : 170 + this.evasionSkill * 0.45;
    this.player.cooldown = ARENA_NEUTRAL_BASELINE ? ARENA_BASE_COOLDOWN : Math.max(130, 330 - this.playerSkill * 1.15);
    this.rival.speed = ARENA_NEUTRAL_BASELINE ? ARENA_BASE_SPEED : 145 + this.rivalProfile.movement * 0.55;
    this.rival.cooldown = ARENA_NEUTRAL_BASELINE ? ARENA_BASE_COOLDOWN : Math.max(360, 930 - this.rivalProfile.shooting * 5.4);

    this.cameras.main.setBounds(0, 0, 2400, 1400);
    this.cameras.main.startFollow(this.player.body, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(
      Math.min(this.scale.width * 0.28, 320),
      Math.min(this.scale.height * 0.22, 150),
    );

    this.createHud();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.cleanup = installShootersTriggerMobileControls();
    this.createPauseButton();
    this.createEnemyLocator();

    this.arenaStartedAt = Date.now();
    this.rivalCanFireAt = this.arenaStartedAt + ARENA_RIVAL_OPENING_DELAY_MS;
    this.rivalDecisionAt = this.arenaStartedAt + 900;

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.cleanup?.();
      this.pauseButton?.remove();
      this.pausePanel?.remove();
      this.resultPanel?.remove();
      this.clearSplatter();
      this.player?.droppedWeapon?.destroy();
      this.rival?.droppedWeapon?.destroy();
      this.stealthIndicators.forEach(({ ring, label }) => { ring.destroy(); label.destroy(); });
      this.stealthIndicators = [];
      this.locatorPanel?.remove();
      this.locatorArrow?.remove();
      this.locatorPanel = undefined;
      this.locatorCanvas = undefined;
      this.locatorCtx = undefined;
      this.locatorArrow = undefined;
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time: number, delta: number) {
    if (this.matchOver || this.paused || this.roundTransition || this.resolvingRound) return;

    this.movePlayer(delta);
    this.tryPickupWeapon(this.player);
    this.updatePlayerRefill(delta);
    this.updateRival(delta);
    this.updateShots(delta);
    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    this.rival.cooldown = Math.max(0, this.rival.cooldown - delta);

    if (this.fire && !this.manualAim && !this.player.weaponDropped && !this.player.downed && this.rival && !this.isRivalConcealed()) {
      const dx = this.rival.body.x - this.player.body.x;
      const dy = this.rival.body.y - this.player.body.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 1) this.aim.set(dx / distance, dy / distance);
    }
    if (this.fire) this.playerFire();
    this.updatePlayerAwareness();

    this.updateAnimations(delta);
    this.updateWeaponPoses();
    this.updateHud();
    this.updateStealthIndicators();
    this.updateEnemyLocator();  }

  public setMoveVector(x: number, y: number) {
    this.joystickVector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
  }

  public setFireHeld(value: boolean) {
    if (!value) {
      this.manualAim = false;
    } else if (!this.manualAim && !this.player.weaponDropped && !this.player.downed && this.rival && !this.isRivalConcealed()) {
      const dx = this.rival.body.x - this.player.body.x;
      const dy = this.rival.body.y - this.player.body.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 1) this.aim.set(dx / distance, dy / distance);
    }
    this.fire = value;
  }

  public setAimVector(x: number, y: number) {
    const length = Math.hypot(x, y);
    if (length > 0.05) {
      this.aim.set(x / length, y / length);
      this.manualAim = true;
    }
  }

  public isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  private loadPreparation() {
    if (ARENA_NEUTRAL_BASELINE) {
      this.playerSkill = 50;
      this.evasionSkill = 50;
      return;
    }
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
    if (ARENA_NEUTRAL_BASELINE) {
      return Phaser.Utils.Array.GetRandom([
        { id: 'marksman', operator: 'OPERATOR 12', shooting: 50, movement: 50, pressure: 50, coverUse: 45 },
        { id: 'runner', operator: 'OPERATOR 07', shooting: 50, movement: 50, pressure: 50, coverUse: 45 },
        { id: 'all-rounder', operator: 'OPERATOR 21', shooting: 50, movement: 50, pressure: 50, coverUse: 45 },
      ]);
    }
    return Phaser.Utils.Array.GetRandom([
      { id: 'marksman', operator: 'OPERATOR 12', shooting: clamp(this.playerSkill + 10, 38, 96), movement: clamp(this.evasionSkill - 8, 34, 88), pressure: clamp(this.playerSkill * 0.7 + 22, 35, 90), coverUse: clamp(this.evasionSkill * 0.45 + 25, 25, 82) },
      { id: 'runner', operator: 'OPERATOR 07', shooting: clamp(this.playerSkill - 6, 30, 88), movement: clamp(this.evasionSkill + 14, 48, 97), pressure: clamp(this.evasionSkill * 0.75 + 20, 40, 95), coverUse: clamp(this.evasionSkill * 0.65 + 28, 30, 92) },
      { id: 'all-rounder', operator: 'OPERATOR 21', shooting: clamp(this.playerSkill + 7, 36, 94), movement: clamp(this.evasionSkill + 7, 42, 94), pressure: clamp((this.playerSkill + this.evasionSkill) * 0.5 + 18, 38, 93), coverUse: clamp(this.evasionSkill * 0.55 + 30, 28, 88) },
    ]);
  }

  private movePlayer(delta: number) {
    if (this.player.refilling) {
      this.playerMoving = false;
      return;
    }

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
    const effectiveSpeed = this.player.wounded ? this.player.speed * 0.92 : this.player.speed;
    const nx = Phaser.Math.Clamp(this.player.body.x + (dx / length) * effectiveSpeed * delta / 1000, 42, 2358);
    const ny = Phaser.Math.Clamp(this.player.body.y + (dy / length) * this.player.speed * delta / 1000, 90, 1350);

    if (!this.inCover(nx, ny, 14)) {
      this.player.body.x = nx;
      this.player.body.y = ny;
    }
  }

  private moveRival(desiredX: number, desiredY: number, delta: number) {
    const length = Math.hypot(desiredX, desiredY);
    if (length < 0.01) {
      this.rivalMoving = false;
      return;
    }
    const baseAngle = Math.atan2(desiredY, desiredX);
    const speed = this.rival.wounded ? this.rival.speed * 0.92 : this.rival.speed;
    const step = speed * delta / 1000;
    const offsets = [0, 0.62, -0.62, 1.18, -1.18, 1.7, -1.7, Math.PI];
    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const nx = Phaser.Math.Clamp(this.rival.body.x + Math.cos(angle) * step, 42, 2358);
      const ny = Phaser.Math.Clamp(this.rival.body.y + Math.sin(angle) * step, 90, 1350);
      if (this.inCover(nx, ny, 14)) continue;
      this.rival.body.x = nx;
      this.rival.body.y = ny;
      this.rivalMoving = true;
      if (Math.abs(Math.cos(angle)) > 0.08) this.rivalFacing = Math.cos(angle) < 0 ? -1 : 1;
      return;
    }
    for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const nx = Phaser.Math.Clamp(this.rival.body.x + Math.cos(angle) * step, 42, 2358);
      const ny = Phaser.Math.Clamp(this.rival.body.y + Math.sin(angle) * step, 90, 1350);
      if (this.inCover(nx, ny, 10)) continue;
      this.rival.body.x = nx;
      this.rival.body.y = ny;
      this.rivalMoving = true;
      if (Math.abs(Math.cos(angle)) > 0.08) this.rivalFacing = Math.cos(angle) < 0 ? -1 : 1;
      return;
    }
    this.rivalMoving = false;
  }

  private updateRival(delta: number) {
    if (this.rival.weaponDropped) {
      this.rivalMoving = true;
      const dx = this.rival.droppedWeapon.x - this.rival.body.x;
      const dy = this.rival.droppedWeapon.y - this.rival.body.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance <= 38) { this.pickupWeapon(this.rival); return; }
      this.moveRival(dx, dy, delta); return;
    }
    if (this.rival.ammo <= 0 || this.rival.refilling) { this.updateRivalRefill(delta); return; }
    const now = Date.now();
    const playerHidden = this.isPlayerConcealed();
    const canSeePlayer = !playerHidden && this.hasLineOfSight(this.rival.body.x, this.rival.body.y, this.player.body.x, this.player.body.y);
    const distance = Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, this.player.body.x, this.player.body.y);
    if (now >= this.rivalDecisionAt) {
      this.rivalDecisionAt = now + Phaser.Math.Between(900, 1700);
      if (playerHidden) { this.rivalMode = 'SEARCH'; this.rivalTargetPoint.set(this.playerLastKnown.x, this.playerLastKnown.y); }
      else if (canSeePlayer && distance < 520 && Math.random() < 0.55) this.rivalMode = Math.random() < 0.62 ? 'FLANK' : 'PRESSURE';
      else if (Math.random() < 0.24) this.rivalMode = 'HIDE';
      else this.rivalMode = Math.random() < 0.58 ? 'FLANK' : 'PRESSURE';
      if (this.rivalMode === 'FLANK') {
        const angle = Math.atan2(this.player.body.y - this.rival.body.y, this.player.body.x - this.rival.body.x) + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        const flankDistance = Phaser.Math.Between(320, 560);
        this.rivalTargetPoint.set(Phaser.Math.Clamp(this.player.body.x + Math.cos(angle) * flankDistance, 90, 2310), Phaser.Math.Clamp(this.player.body.y + Math.sin(angle) * flankDistance, 110, 1290));
      } else if (this.rivalMode === 'HIDE') {
        const concealment = this.findRivalConcealment();
        if (concealment) {
          const angle = Math.atan2(this.rival.body.y - concealment.y, this.rival.body.x - concealment.x) || Phaser.Math.FloatBetween(-Math.PI, Math.PI);
          const radius = Math.min(concealment.radius * 0.72, concealment.radius - 12);
          this.rivalTargetPoint.set(Phaser.Math.Clamp(concealment.x + Math.cos(angle) * radius, 90, 2310), Phaser.Math.Clamp(concealment.y + Math.sin(angle) * radius, 110, 1290));
        } else this.rivalMode = 'FLANK';
      } else if (this.rivalMode === 'PRESSURE') this.rivalTargetPoint.set(this.player.body.x, this.player.body.y);
    }
    if (this.rivalMode === 'SEARCH') {
      const dx = this.rivalTargetPoint.x - this.rival.body.x, dy = this.rivalTargetPoint.y - this.rival.body.y;
      if (Math.hypot(dx, dy) < 85) { this.rivalMode = 'FLANK'; this.rivalDecisionAt = now + 350; }
      this.moveRival(dx, dy, delta);
    } else if (this.rivalMode === 'HIDE') {
      const dx = this.rivalTargetPoint.x - this.rival.body.x, dy = this.rivalTargetPoint.y - this.rival.body.y;
      if (Math.hypot(dx, dy) > 28) this.moveRival(dx, dy, delta); else this.rivalMoving = false;
    } else if (this.rivalMode === 'FLANK') {
      const dx = this.rivalTargetPoint.x - this.rival.body.x, dy = this.rivalTargetPoint.y - this.rival.body.y;
      if (Math.hypot(dx, dy) < 70) { this.rivalMode = 'PRESSURE'; this.rivalDecisionAt = now + 250; } else this.moveRival(dx, dy, delta);
    } else {
      const dx = this.player.body.x - this.rival.body.x, dy = this.player.body.y - this.rival.body.y;
      const d = Math.hypot(dx, dy) || 1, side = Math.random() < 0.5 ? 1 : -1;
      this.moveRival(d > 560 ? dx / d : (-dy / d) * side, d > 560 ? dy / d : (dx / d) * side, delta);
    }
    const rivalHidden = this.isRivalConcealed();
    const nowDistance = Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.rival.body.x, this.rival.body.y);
    if (!rivalHidden && !playerHidden && canSeePlayer && this.rival.cooldown <= 0 && now >= this.rivalCanFireAt && nowDistance < ARENA_RIVAL_FIRE_RANGE) {
      const direction = new Phaser.Math.Vector2(this.player.body.x - this.rival.body.x, this.player.body.y - this.rival.body.y).normalize();
      this.rivalFire(direction);
    }
    this.rival.body.setAlpha(rivalHidden ? 0.28 : this.rival.downed ? 0.68 : 1);
    const name = this.rival.body.getData('nameLabel') as Phaser.GameObjects.Text | undefined;
    name?.setAlpha(rivalHidden ? 0.18 : this.rival.downed ? 0.5 : 1);
  }

  private updatePlayerRefill(delta: number) {
    if (this.player.downed || this.player.weaponDropped || this.player.ammo > 0) {
      this.player.refilling = false;
      this.player.refillElapsed = 0;
      return;
    }

    const inStation = this.isInAmmoStation(this.player.body.x, this.player.body.y);
    if (!inStation) {
      this.player.refilling = false;
      this.player.refillElapsed = 0;
      return;
    }

    if (!this.player.refilling) {
      this.player.refilling = true;
      this.player.refillElapsed = 0;
      this.fire = false;
      this.statusHud?.setText('AMMO REFILLING  ·  HOLD POSITION');
      this.showCombatHighlight('AMMO STATION', '#e8c95c', this.player.body.x, this.player.body.y - 42, 0.9);
    }

    this.fire = false;
    this.player.refillElapsed += delta;
    if (this.player.refillElapsed >= ARENA_REFILL_DURATION) {
      this.player.ammo = this.player.maxAmmo;
      this.player.refilling = false;
      this.player.refillElapsed = 0;
      this.showCombatHighlight('AMMO REFILLED', '#9fbda8', this.player.body.x, this.player.body.y - 42, 0.95);
      this.statusHud?.setText('AMMO READY  ·  MOVE · AIM · FIRE');
    }
  }

  private updateRivalRefill(delta: number) {
    if (this.rival.downed || this.rival.weaponDropped) return;

    const station = this.getNearestAmmoStation(this.rival.body.x, this.rival.body.y);
    const dx = station.centerX - this.rival.body.x;
    const dy = station.centerY - this.rival.body.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (distance > 42) {
      this.rivalMoving = true;
      this.rivalRefillProgressReset();
      if (Math.abs(dx) > 0.08) this.rivalFacing = dx < 0 ? -1 : 1;
      this.moveRival(dx, dy, delta);
      return;
    }

    this.rivalMoving = false;
    if (!this.rival.refilling) {
      this.rival.refilling = true;
      this.rival.refillElapsed = 0;
      this.showCombatHighlight('RIVAL REFILLING', '#f0a05f', this.rival.body.x, this.rival.body.y - 42, 0.9);
    }
    this.rival.refillElapsed += delta;
    if (this.rival.refillElapsed >= ARENA_REFILL_DURATION) {
      this.rival.ammo = this.rival.maxAmmo;
      this.rival.refilling = false;
      this.rival.refillElapsed = 0;
    }
  }

  private rivalRefillProgressReset() {
    this.rival.refilling = false;
    this.rival.refillElapsed = 0;
  }

  private isRivalConcealed() {
    if (this.rival.downed || this.rival.weaponDropped) return false;
    if (Date.now() < this.rivalRevealedUntil) return false;
    if (Date.now() - this.rivalLastFiredAt < ARENA_STEALTH_BREAK_MS) return false;
    return this.concealments.some((zone) => Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, zone.x, zone.y) <= zone.radius);
  }

  private findRivalConcealment() {
    return this.concealments.map((zone) => ({ zone, distance: Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, zone.x, zone.y) }))
      .filter(({ zone }) => !this.inCover(zone.x, zone.y, 8))
      .sort((a, b) => a.distance - b.distance)[0]?.zone;
  }

  private findUsefulCover() {
    const playerX = this.isPlayerConcealed() ? this.playerLastKnown.x : this.player.body.x;
    const playerY = this.isPlayerConcealed() ? this.playerLastKnown.y : this.player.body.y;
    return this.covers
      .map((cover) => {
        const centerX = cover.x + cover.width / 2;
        const centerY = cover.y + cover.height / 2;
        const distance = Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, centerX, centerY);
        const toPlayer = Phaser.Math.Distance.Between(playerX, playerY, centerX, centerY);
        const tooClose = Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, playerX, playerY) < 360 && distance < 100;
        return { cover, score: distance + toPlayer * 0.18 + (tooClose ? 260 : 0) };
      })
      .sort((a, b) => a.score - b.score)[0]?.cover;
  }

  private playerFire() {
    if (this.player.weaponDropped || this.player.refilling || this.player.ammo <= 0 || this.player.cooldown > 0) return;
    const distance = Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.rival.body.x, this.rival.body.y);
    this.player.cooldown = ARENA_NEUTRAL_BASELINE ? ARENA_BASE_COOLDOWN : Math.max(130, 330 - this.playerSkill * 1.15);
    this.player.ammo -= 1;
    this.playerShotsFired += 1;
    this.playerLastFiredAt = Date.now();
    this.playerRevealedUntil = Date.now() + 1800;
    this.spawnShot(
      this.player.body.x + this.aim.x * 42,
      this.player.body.y + this.aim.y * 42,
      this.applyDistanceSpread(this.aim, distance, this.playerSkill),
      'player',
    );
  }

  private rivalFire(direction: Phaser.Math.Vector2) {
    const accuracy = this.rivalProfile.shooting;
    const distance = Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, this.rival.body.x, this.rival.body.y);
    const aim = this.applyDistanceSpread(direction, distance, accuracy);
    this.rival.cooldown = ARENA_NEUTRAL_BASELINE ? ARENA_BASE_COOLDOWN : Math.max(330, 930 - accuracy * 5.4);
    this.rival.ammo -= 1;
    this.rivalShotsFired += 1;
    this.rivalLastFiredAt = Date.now();
    this.rivalRevealedUntil = Date.now() + 1800;
    this.spawnShot(
      this.rival.body.x + aim.x * 42,
      this.rival.body.y + aim.y * 42,
      aim,
      'rival',
    );
  }

  private applyDistanceSpread(direction: Phaser.Math.Vector2, distance: number, skill: number) {
    const baseSpread = distance < 260 ? 2 : distance < 620 ? 5 : 9;
    const skillReduction = clamp((skill - 50) * 0.045, -1.5, 2.25);
    const spreadDegrees = clamp(baseSpread - skillReduction, 1, 10);
    const angle = Math.atan2(direction.y, direction.x) + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-spreadDegrees, spreadDegrees));
    return new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
  }

  private spawnShot(
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    owner: 'player' | 'rival',
  ) {
    // Paintball projectile: solid, small and readable — no tracer or fire trail.\n    const ball = this.add.circle(x, y, 4, owner === 'player' ? 0xf0dfb6 : 0xe44f3d).setDepth(25);
    this.shots.push({
      body: ball,
      vx: direction.x * 680,
      vy: direction.y * 680,
      owner,
      ttl: 1100,
    });
  }

  private updateShots(delta: number) {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const shot = this.shots[i];
      shot.ttl -= delta;

      const previousX = shot.body.x;
      const previousY = shot.body.y;
      const nx = previousX + shot.vx * delta / 1000;
      const ny = previousY + shot.vy * delta / 1000;

      if (
        shot.ttl <= 0 ||
        nx < 0 ||
        nx > 2400 ||
        ny < 0 ||
        ny > 1400
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
      if (target.downed) {
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }

      const shotLine = new Phaser.Geom.Line(previousX, previousY, shot.body.x, shot.body.y);
      // Cover must intercept the paintball before it can hit a fighter behind it.
      if (this.covers.some((cover) => Phaser.Geom.Intersects.LineToRectangle(shotLine, cover))) {
        if (shot.owner === 'player') this.playerMisses += 1;
        else this.rivalMisses += 1;
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }

      const targetHead = new Phaser.Geom.Circle(target.body.x, target.body.y - 25, 16);
      const targetBody = new Phaser.Geom.Circle(target.body.x, target.body.y + 1, 34);
      const weaponPoint = this.getWeaponPoint(target);
      const targetWeapon = new Phaser.Geom.Circle(weaponPoint.x, weaponPoint.y, 14);
      const hitsWeapon = !target.weaponDropped && Phaser.Geom.Intersects.LineToCircle(shotLine, targetWeapon);
      const hitsHead = Phaser.Geom.Intersects.LineToCircle(shotLine, targetHead);
      const hitsBody = Phaser.Geom.Intersects.LineToCircle(shotLine, targetBody);

      if (hitsWeapon || hitsHead || hitsBody) {
        const hitPoint = Phaser.Geom.Line.GetNearestPoint(shotLine, hitsWeapon ? weaponPoint : hitsHead ? new Phaser.Math.Vector2(target.body.x, target.body.y - 25) : new Phaser.Math.Vector2(target.body.x, target.body.y + 1));
        if (hitsWeapon) {
          this.resolveWeaponHit(shot.owner, target, hitPoint.x, hitPoint.y);
        } else {
          const headDistance = Phaser.Math.Distance.Between(hitPoint.x, hitPoint.y, target.body.x, target.body.y - 25);
          const bodyDistance = Phaser.Math.Distance.Between(hitPoint.x, hitPoint.y, target.body.x, target.body.y + 1);
          this.resolveHit(shot.owner, headDistance <= bodyDistance, hitPoint.x, hitPoint.y);
        }
        shot.body.destroy();
        this.shots.splice(i, 1);
        if (this.matchOver || this.roundTransition || this.resolvingRound) break;
        continue;
      }

      const nearestBodyPoint = Phaser.Geom.Line.GetNearestPoint(shotLine, new Phaser.Math.Vector2(target.body.x, target.body.y + 1));
      const nearestHeadPoint = Phaser.Geom.Line.GetNearestPoint(shotLine, new Phaser.Math.Vector2(target.body.x, target.body.y - 25));
      const nearestBodyDistance = Phaser.Math.Distance.Between(nearestBodyPoint.x, nearestBodyPoint.y, target.body.x, target.body.y + 1);
      const nearestHeadDistance = Phaser.Math.Distance.Between(nearestHeadPoint.x, nearestHeadPoint.y, target.body.x, target.body.y - 25);
      const scrapeDistance = Math.min(nearestBodyDistance, nearestHeadDistance);
      if (scrapeDistance <= ARENA_SCRAPE_RADIUS) {
        // One paintball = one event. A scrape cannot later become another hit.
        this.recordScrape(shot.owner, nearestBodyPoint.x, nearestBodyPoint.y);
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }
    }
  }

  private getWeaponPoint(target: Fighter) {
    const aim = target === this.player ? this.aim : new Phaser.Math.Vector2(this.player.body.x - target.body.x, this.player.body.y - target.body.y).normalize();
    return new Phaser.Math.Vector2(target.body.x + aim.x * 27, target.body.y + aim.y * 27 + 4);
  }

  private resolveWeaponHit(owner: 'player' | 'rival', target: Fighter, hitX: number, hitY: number) {
    if (this.matchOver || this.roundTransition || this.resolvingRound || target.weaponDropped || target.downed) return;
    if (owner === 'player') this.playerWeaponKnockouts += 1;
    else this.rivalWeaponKnockouts += 1;
    this.addSplatter(hitX, hitY, 0.7);
    this.showCombatHighlight(owner === 'player' ? 'GUN HIT · GUN DOWN' : 'YOUR GUN IS DOWN', '#e8c95c', hitX, hitY, 0.95);
    this.dropWeapon(target);
    this.statusHud?.setText(target === this.player ? 'GUN DOWN  ·  RECOVER OR REPOSITION' : 'RIVAL GUN DOWN  ·  PRESS THE RECOVERY');
  }

  private dropWeapon(target: Fighter) {
    if (target.weaponDropped || target.downed) return;
    target.weaponDropped = true;
    const bodyX = target.body.x;
    const bodyY = target.body.y;
    const side = target === this.player ? (this.aim.y >= 0 ? -1 : 1) : (this.player.body.y >= bodyY ? -1 : 1);
    const angle = target === this.player ? Math.atan2(this.aim.y, this.aim.x) : Math.atan2(this.player.body.y - bodyY, this.player.body.x - bodyX);
    const finalX = Phaser.Math.Clamp(bodyX + side * 46, 40, 2360);
    const finalY = Phaser.Math.Clamp(bodyY + 30, 90, 1350);
    target.droppedWeapon.setPosition(bodyX, bodyY + 8);
    target.droppedWeapon.setRotation(angle + Phaser.Math.DegToRad(90));
    target.droppedWeapon.setVisible(true);
    target.droppedWeapon.setScale(0.95).setDepth(55);
    this.updateWeaponVisibility(target, false);
    this.tweens.add({
      targets: target.droppedWeapon,
      x: finalX,
      y: finalY,
      angle: target.droppedWeapon.angle + Phaser.Math.Between(-110, 110),
      scale: 1,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => {
        target.droppedWeapon.setDepth(55);
      },
    });
    target.body.setData('combatState', target.wounded ? 'WOUNDED · UNARMED' : 'UNARMED');
  }

  private pickupWeapon(target: Fighter) {
    if (!target.weaponDropped || target.downed) return;
    target.weaponDropped = false;
    target.droppedWeapon.setVisible(false);
    this.updateWeaponVisibility(target, true);
    target.body.setData('combatState', target.wounded ? 'WOUNDED' : 'READY');
    this.showCombatHighlight(target === this.player ? 'GUN RECOVERED' : 'RIVAL GUN RECOVERED', '#9fbda8', target.body.x, target.body.y - 36, 0.9);
    this.statusHud?.setText(target === this.player ? 'GUN RECOVERED' : 'RIVAL HAS ITS GUN');
  }

  private tryPickupWeapon(target: Fighter) {
    if (!target.weaponDropped || target.downed) return;
    const distance = Phaser.Math.Distance.Between(target.body.x, target.body.y, target.droppedWeapon.x, target.droppedWeapon.y);
    if (distance <= 54) this.pickupWeapon(target);
  }

  private resolveHit(owner: 'player' | 'rival', headshot: boolean, hitX?: number, hitY?: number) {
    if (this.matchOver || this.roundTransition || this.resolvingRound) return;
    const target = owner === 'player' ? this.rival : this.player;
    const shooter = owner === 'player' ? this.player : this.rival;
    const x = hitX ?? target.body.x;
    const y = hitY ?? target.body.y;
    const distance = Phaser.Math.Distance.Between(shooter.body.x, shooter.body.y, target.body.x, target.body.y);
    const bodyDistance = Phaser.Math.Distance.Between(x, y, target.body.x, target.body.y + 1);

    if (!headshot && bodyDistance > ARENA_BODY_CORE_RADIUS) {
      this.recordScrape(owner, x, y);
      return;
    }

    if (owner === 'player') {
      if (headshot) this.playerHeadshots += 1;
      else this.playerBodyHits += 1;
      this.playerPaintHits += 1;
    } else if (headshot) {
      this.rivalHeadshots += 1;
      this.rivalPaintHits += 1;
    } else {
      this.rivalBodyHits += 1;
      this.rivalPaintHits += 1;
    }

    this.addSplatter(x, y, headshot ? 1.25 : 1);
    this.showCombatHighlight(
      owner === 'player'
        ? (headshot ? 'HEADSHOT!' : 'PAINT HIT')
        : (headshot ? 'HEADSHOT ON YOU' : 'PAINT HIT ON YOU'),
      headshot ? '#e8c95c' : '#d66a3d',
      x,
      y,
      headshot ? 1.12 : 1,
    );

    if (headshot) {
      if (owner === 'player') this.roundHits += 1;
      else this.roundRivalHits += 1;
      this.flash(target, headshot);
      this.showCombatHighlight(
        owner === 'player'
          ? (target.weaponDropped ? 'GUN DOWN + HEADSHOT!' : 'HEADSHOT!')
          : (target.weaponDropped ? 'GUN DOWN + HEADSHOT ON YOU' : 'HEADSHOT ON YOU'),
        '#e8c95c', x, y, 1.15,
      );
      this.eliminateFighter(target, owner);
      this.roundPoint(owner);
      return;
    }

    const closeImpact = distance <= ARENA_CLOSE_IMPACT_RANGE;
    const decisive = closeImpact || target.weaponDropped;
    target.hp = Math.max(0, target.hp - (decisive ? target.hp : 1));
    if (owner === 'player') this.roundHits += 1;
    else this.roundRivalHits += 1;

    this.flash(target, false);
    if (target.hp <= 0) {
      this.showCombatHighlight(
        owner === 'player'
          ? (target.weaponDropped ? 'GUN DOWN + FINISH' : closeImpact ? 'CLOSE HIT · ELIMINATED' : 'ELIMINATED')
          : (target.weaponDropped ? 'GUN DOWN + FINISH ON YOU' : closeImpact ? 'CLOSE HIT · ELIMINATED' : 'ELIMINATED'),
        '#d66a3d', x, y, 1.05,
      );
      this.eliminateFighter(target, owner);
      this.roundPoint(owner);
      return;
    }

    this.markFighterWounded(target);
  }

  private recordScrape(owner: 'player' | 'rival', x: number, y: number) {
    if (owner === 'player') this.playerScrapes += 1;
    else this.rivalScrapes += 1;
    this.addSplatter(x, y, 0.38);
    this.showCombatHighlight(owner === 'player' ? 'SCRAPE' : 'SCRAPE ON YOU', '#9fbda8', x, y, 0.72);
  }

  private addSplatter(x: number, y: number, scale = 1) {
    const splat = this.add.graphics().setDepth(12);
    splat.setPosition(x, y);

    // Organic paint mark: irregular blobs and small droplets, matching the
    // established shooting-range paint rather than a directional/trail effect.
    const marks = [
      [-8, -5, 4.2],
      [5, -7, 3.2],
      [10, 2, 2.5],
      [-4, 7, 2.8],
      [3, 2, 5.2],
    ];
    const mainColor = Phaser.Utils.Array.GetRandom([0xd66a3d, 0xb94d36, 0xe08a54]);
    splat.fillStyle(mainColor, 0.9);
    for (const [markX, markY, radius] of marks) {
      splat.fillCircle(
        (markX + Phaser.Math.Between(-2, 2)) * scale,
        (markY + Phaser.Math.Between(-2, 2)) * scale,
        radius * scale,
      );
    }
    splat.fillStyle(0xf27b4f, 0.72);
    splat.fillCircle(-12 * scale, 8 * scale, 2 * scale);
    splat.fillCircle(12 * scale, -9 * scale, 2 * scale);
    this.splatter.push(splat);
  }

  private markFighterWounded(target: Fighter) {
    if (target.wounded || target.downed) return;
    target.wounded = true;
    target.damagePaint.clear();
    target.damagePaint.fillStyle(0xd66a3d, 0.82);
    target.damagePaint.fillCircle(-9, -2, 5);
    target.damagePaint.fillCircle(4, 4, 4);
    target.damagePaint.fillCircle(8, 10, 3);
    target.damagePaint.fillStyle(0xf0a05f, 0.68);
    target.damagePaint.fillCircle(-2, 1, 2.5);
    target.damagePaint.fillCircle(12, 0, 2);
    target.damagePaint.setVisible(true);
    target.body.setData('combatState', 'WOUNDED');
    this.showCombatHighlight(
      target === this.player ? 'YOU ARE WOUNDED' : 'WOUNDED · ONE MORE',
      '#f0a05f',
      target.body.x,
      target.body.y - 34,
      0.95,
    );
    this.statusHud?.setText(
      target === this.player ? 'WOUNDED  ·  AVOID THE NEXT BODY HIT' : 'BOT WOUNDED  ·  ONE MORE BODY HIT',
    );
  }

  private eliminateFighter(target: Fighter, owner: 'player' | 'rival') {
    if (target.downed) return;
    target.downed = true;
    target.wounded = true;
    if (!target.damagePaint.visible) {
      target.damagePaint.fillStyle(0xd66a3d, 0.9);
      target.damagePaint.fillCircle(-8, -1, 6);
      target.damagePaint.fillCircle(4, 5, 5);
      target.damagePaint.fillCircle(10, 10, 3.5);
    }
    target.damagePaint.setVisible(true);
    target.body.setData('combatState', 'DOWNED');
    target.body.setRotation(owner === 'player' ? -0.28 : 0.28);
    target.body.y += 10;
    target.body.setAlpha(0.68);
    this.updateWeaponVisibility(target, false);
    const name = target.body.getData('nameLabel') as Phaser.GameObjects.Text | undefined;
    name?.setAlpha(0.5);
    this.showCombatHighlight('ELIMINATED', '#f4f1df', target.body.x, target.body.y - 46, 1.28);
    this.statusHud?.setText(owner === 'player' ? 'ELIMINATED  ·  ROUND POINT' : 'YOU ARE ELIMINATED  ·  ROUND POINT');
  }

  private updateWeaponVisibility(target: Fighter, visible: boolean) {
    if (target === this.player) {
      this.playerArms.setVisible(visible);
      this.playerWeapon.setVisible(visible);
      this.playerMuzzle.setVisible(visible);
    } else {
      this.rivalArms.setVisible(visible);
      this.rivalWeapon.setVisible(visible);
      this.rivalMuzzle.setVisible(visible);
    }
  }

  private resetFighter(target: Fighter, x: number, y: number) {
    target.hp = ARENA_MAX_BODY_HITS;
    target.wounded = false;
    target.downed = false;
    target.weaponDropped = false;
    target.ammo = target.maxAmmo;
    target.refilling = false;
    target.refillElapsed = 0;
    target.droppedWeapon.setVisible(false);
    target.damagePaint.clear();
    target.damagePaint.setVisible(false);
    target.body.setData('combatState', 'READY');
    target.body.setRotation(0);
    target.body.setAlpha(1);
    target.body.setPosition(x, y);
    const name = target.body.getData('nameLabel') as Phaser.GameObjects.Text | undefined;
    name?.setAlpha(1);
    this.updateWeaponVisibility(target, true);
  }

  private clearSplatter() {
    this.splatter.forEach((splat) => splat.destroy());
    this.splatter = [];
  }

  private showCombatHighlight(text: string, color: string, x: number, y: number, scale = 1) {
    const label = this.add.text(x, y - 34, text, {
      fontFamily: 'monospace',
      fontSize: Math.round(12 * scale) + 'px',
      fontStyle: 'bold',
      color,
      stroke: '#151a16',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(.5).setDepth(150);

    this.tweens.add({
      targets: label,
      y: y - 62,
      alpha: 0,
      scale: 0.92,
      duration: text.includes('HEADSHOT') ? 520 : 380,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private roundPoint(winner: 'player' | 'rival') {
    if (this.matchOver || this.roundTransition || this.resolvingRound) return;

    this.resolvingRound = true;
    this.fire = false;
    this.setMoveVector(0, 0);

    if (winner === 'player') this.player.score += 1;
    else this.rival.score += 1;

    this.clearShots();

    if (this.player.score >= 3 || this.rival.score >= 3) {
      this.matchOver = true;
      this.resolvingRound = false;
      this.showResult();
      return;
    }

    const eliminated = winner === 'player' ? this.rival : this.player;
    this.roundTransition = true;
    this.resolvingRound = false;
    this.statusHud?.setText(
      (winner === 'player' ? 'ELIMINATED  ·  YOU ' : 'YOU ARE ELIMINATED  ·  YOU ') +
      this.player.score + ' — ' + this.rival.score +
      '  ·  RESPAWN',
    );

    this.time.delayedCall(700, () => {
      if (this.matchOver || this.paused) return;
      this.clearSplatter();
      if (eliminated === this.player) {
        this.resetFighter(this.player, ARENA_PLAYER_SPAWN.x, ARENA_PLAYER_SPAWN.y);
      } else {
        this.resetFighter(this.rival, ARENA_RIVAL_SPAWN.x, ARENA_RIVAL_SPAWN.y);
      }
      eliminated.cooldown = 700;
      if (eliminated === this.rival) {
        this.rivalCanFireAt = Date.now() + ARENA_RIVAL_OPENING_DELAY_MS;
        this.rivalDecisionAt = Date.now() + 250;
        this.rivalMode = 'PRESSURE';
        this.rivalRevealedUntil = Date.now() + 700;
      }
      this.roundTransition = false;
      this.statusHud?.setText(
        this.player.score === 2 && this.rival.score === 2
          ? 'FINAL POINT  ·  FIRST TO 3'
          : 'FIGHT CONTINUES  ·  MOVE · AIM · FIRE',
      );
    });
  }

  private clearShots() {
    this.shots.forEach((shot) => shot.body.destroy());
    this.shots = [];
  }

  private flash(target: Fighter, headshot: boolean) {
    if (target.downed) return;
    target.body.setScale(headshot ? 1.28 : 1.16);
    this.time.delayedCall(headshot ? 160 : 90, () => {
      if (!target.downed) target.body.setScale(1);
    });
    this.statusHud?.setText(headshot ? 'HEADSHOT  ·  INSTANT ELIMINATION' : 'BODY HIT  ·  DAMAGE CONFIRMED');
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
          scrapes: {
            player: this.playerScrapes,
            rival: this.rivalScrapes,
          },
          paintCoverage: {
            player: this.playerPaintHits,
            rival: this.rivalPaintHits,
          },
          shotsFired: {
            player: this.playerShotsFired,
            rival: this.rivalShotsFired,
          },
          weaponKnockouts: {
            player: this.playerWeaponKnockouts,
            rival: this.rivalWeaponKnockouts,
          },
          mode: ARENA_NEUTRAL_BASELINE ? 'NEUTRAL' : 'PREPARED',
          completedAt,
          durationMs: Math.max(0, completedAt - this.arenaStartedAt),
          budgetEarned: reward,
        }),
      );
    } catch {}

    this.resultPanel?.remove();
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
      '<br>SCRAPES YOU ' + this.playerScrapes + ' · PAINT ' + this.playerPaintHits +
      '<br>BUDGET EARNED · ' + reward +
      '</div>';

    const actions = document.createElement('div');
    Object.assign(actions.style, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginTop: '20px',
    });

    const rematch = document.createElement('button');
    rematch.textContent = 'FIGHT AGAIN';
    Object.assign(rematch.style, {
      minHeight: '48px',
      padding: '10px 12px',
      background: '#e8c95c',
      border: 0,
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontWeight: '800',
      touchAction: 'manipulation',
    });
    rematch.onclick = () => {
      panel.remove();
      this.resultPanel = undefined;
      this.fire = false;
      this.setMoveVector(0, 0);
      this.pausePanel?.remove();
      this.locatorPanel?.remove();
      this.locatorArrow?.remove();
      this.locatorPanel = undefined;
      this.locatorCanvas = undefined;
      this.locatorCtx = undefined;
      this.locatorArrow = undefined;
      this.scene.stop();
      window.setTimeout(() => this.scene.start('ShootersTriggerArenaScene'), 0);
    };

    const button = document.createElement('button');
    button.textContent = 'RETURN TO HOME FIELD';
    Object.assign(button.style, {
      minHeight: '48px',
      padding: '10px 12px',
      background: '#102018',
      border: '2px solid #f4f1df',
      color: '#f4f1df',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontWeight: '800',
      touchAction: 'manipulation',
    });
    button.onclick = () => this.leaveArena();

    actions.appendChild(rematch);
    actions.appendChild(button);
    card.appendChild(actions);
    panel.appendChild(card);
    document.body.appendChild(panel);
    this.resultPanel = panel;
  }

  private createHud() {
    // Deliberately minimal: the fight stays visible; HUD only answers score and ammo.
    this.scoreHud = this.add.text(this.scale.width / 2, 16, 'YOU 0  ·  RIVAL 0', {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#f4f1df',
      backgroundColor: 'rgba(16,32,24,.62)', padding: { left: 8, right: 8, top: 5, bottom: 5 },
    }).setOrigin(.5, 0).setScrollFactor(0).setDepth(90);
    this.ammoHud = this.add.text(this.scale.width - 14, 16, 'GUN · 24/24', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#e8c95c',
      backgroundColor: 'rgba(16,32,24,.62)', padding: { left: 7, right: 7, top: 5, bottom: 5 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(90);
  }

  private updateHud() {
    this.scoreHud?.setText('YOU ' + this.player.score + '  ·  ' + this.rivalProfile.operator + ' ' + this.rival.score);
    const refillPercent = this.player.refilling ? Math.round((this.player.refillElapsed / ARENA_REFILL_DURATION) * 100) : 0;
    this.ammoHud?.setText(this.player.refilling ? 'REFILL ' + refillPercent + '%' : 'GUN · ' + this.player.ammo + '/' + this.player.maxAmmo);
  }

  private createPauseButton() {
    const button = document.createElement('button');
    button.textContent = 'Ⅱ';
    button.setAttribute('aria-label', 'Pause arena');
    Object.assign(button.style, {
      position: 'fixed', left: 'max(10px, env(safe-area-inset-left, 0px))', top: 'max(10px, env(safe-area-inset-top, 0px))',
      width: '38px', height: '38px', padding: '0', border: '1px solid rgba(244,241,223,.72)',
      borderRadius: '9px', background: 'rgba(16,32,24,.88)', color: '#f4f1df',
      fontFamily: 'monospace', fontSize: '14px', fontWeight: '900', zIndex: '1450',
      touchAction: 'manipulation', boxShadow: '0 2px 8px rgba(0,0,0,.22)',
    });
    button.onclick = () => this.togglePause();
    document.body.appendChild(button);
    this.pauseButton = button;
  }

  private createEnemyLocator() {
    this.locatorPanel?.remove();
    this.locatorArrow?.remove();

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed',
      top: 'calc(60px + env(safe-area-inset-top, 0px))',
      right: 'max(10px, env(safe-area-inset-right, 0px))',
      width: '108px',
      height: '108px',
      padding: '4px',
      boxSizing: 'border-box',
      border: '1px solid rgba(244,241,223,.52)',
      borderRadius: '10px',
      background: 'rgba(16,32,24,.82)',
      zIndex: '1440',
      pointerEvents: 'none',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,.22)',
    });

    const canvas = document.createElement('canvas');
    canvas.width = 98;
    canvas.height = 98;
    canvas.style.width = '98px';
    canvas.style.height = '98px';
    canvas.setAttribute('aria-label', 'Arena tactical map');
    panel.appendChild(canvas);

    const arrow = document.createElement('div');
    Object.assign(arrow.style, {
      position: 'fixed',
      width: '46px',
      minHeight: '28px',
      padding: '5px 6px',
      boxSizing: 'border-box',
      borderRadius: '7px',
      background: 'rgba(155,63,63,.94)',
      border: '1px solid #fff4d4',
      color: '#fff4d4',
      font: '800 8px/1 monospace',
      letterSpacing: '.4px',
      textAlign: 'center',
      zIndex: '1445',
      pointerEvents: 'none',
      transformOrigin: '50% 50%',
      display: 'none',
      whiteSpace: 'pre',
      boxShadow: '0 2px 8px rgba(0,0,0,.22)',
    });
    arrow.textContent = 'RIVAL';

    document.body.appendChild(panel);
    document.body.appendChild(arrow);
    this.locatorPanel = panel;
    this.locatorCanvas = canvas;
    this.locatorCtx = canvas.getContext('2d');
    this.locatorArrow = arrow;
    this.updateEnemyLocator();
  }

  private updateEnemyLocator() {
    const ctx = this.locatorCtx;
    const canvas = this.locatorCanvas;
    if (!ctx || !canvas || !this.player || !this.rival) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Keep the map tactical, not decorative: field boundary, major cover, player,
    // rival and orientation. No labels or UI furniture inside the map.
    ctx.fillStyle = '#263c2a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(244,241,223,.30)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    const sx = (w - 10) / 2400;
    const sy = (h - 10) / 1400;

    ctx.fillStyle = 'rgba(117,86,59,.82)';
    for (const cover of this.covers) {
      ctx.fillRect(
        5 + cover.x * sx,
        5 + cover.y * sy,
        Math.max(1.5, cover.width * sx),
        Math.max(1.5, cover.height * sy),
      );
    }

    for (const zone of this.concealments) {
      ctx.fillStyle = 'rgba(159,189,168,.10)';
      ctx.beginPath();
      ctx.arc(5 + zone.x * sx, 5 + zone.y * sy, Math.max(3, zone.radius * sx), 0, Math.PI * 2);
      ctx.fill();
    }

    const px = 5 + this.player.body.x * sx;
    const py = 5 + this.player.body.y * sy;
    const rx = 5 + this.rival.body.x * sx;
    const ry = 5 + this.rival.body.y * sy;

    ctx.fillStyle = '#f4f1df';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f4f1df';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + this.aim.x * 8, py + this.aim.y * 8);
    ctx.stroke();

    if (!this.isRivalConcealed()) {
      ctx.fillStyle = '#e44f3d';
      ctx.beginPath();
      ctx.moveTo(rx, ry - 5);
      ctx.lineTo(rx + 5, ry + 4);
      ctx.lineTo(rx - 5, ry + 4);
      ctx.closePath();
      ctx.fill();
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.body.x,
      this.player.body.y,
      this.rival.body.x,
      this.rival.body.y,
    );

    const camera = this.cameras.main;
    const viewLeft = camera.scrollX;
    const viewTop = camera.scrollY;
    const viewRight = viewLeft + camera.width;
    const viewBottom = viewTop + camera.height;
    const onScreen =
      this.rival.body.x >= viewLeft &&
      this.rival.body.x <= viewRight &&
      this.rival.body.y >= viewTop &&
      this.rival.body.y <= viewBottom;

    // The edge arrow only appears when the rival is outside the phone viewport.
    // This keeps the map useful without adding another permanent HUD panel.
    const arrow = this.locatorArrow;
    if (!arrow) return;
    if (this.isRivalConcealed() || onScreen) {
      arrow.style.display = 'none';
      return;
    }

    const centerX = viewLeft + camera.width / 2;
    const centerY = viewTop + camera.height / 2;
    const dx = this.rival.body.x - centerX;
    const dy = this.rival.body.y - centerY;
    const scale = 1 / Math.max(
      Math.abs(dx) / Math.max(1, camera.width / 2 - 34),
      Math.abs(dy) / Math.max(1, camera.height / 2 - 34),
      1,
    );
    const edgeX = camera.width / 2 + dx * scale;
    const edgeY = camera.height / 2 + dy * scale;

    arrow.style.display = 'block';
    arrow.style.left = Math.max(52, Math.min(window.innerWidth - 52, edgeX - 23)) + 'px';
    arrow.style.top = Math.max(82, Math.min(window.innerHeight - 90, edgeY - 14)) + 'px';
    arrow.style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI + 90) + 'deg)';
    arrow.textContent = 'RIVAL\\n' + Math.round(distance) + 'm';
  }

  private togglePause() {
    if (this.matchOver || this.roundTransition || this.resolvingRound) return;
    if (this.paused) {
      this.resumeArena();
    } else {
      this.pauseArena();
    }
  }

  private pauseArena() {
    if (this.paused || this.matchOver) return;
    this.fire = false;
    this.setMoveVector(0, 0);
    this.paused = true;
    this.scene.pause();
    this.showPausePanel();
  }

  private resumeArena() {
    if (!this.paused) return;
    this.pausePanel?.remove();
    this.pausePanel = undefined;
    this.paused = false;
    this.fire = false;
    this.setMoveVector(0, 0);
    this.scene.resume();
  }

  private showPausePanel() {
    this.pausePanel?.remove();

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '1550',
      display: 'grid',
      placeItems: 'center',
      padding: 'max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))',
      background: 'rgba(10,16,12,.72)',
      backdropFilter: 'blur(2px)',
      fontFamily: 'monospace',
      boxSizing: 'border-box',
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(360px, calc(100vw - 28px))',
      padding: '24px',
      background: '#151a16',
      border: '2px solid #e8c95c',
      borderRadius: '14px',
      textAlign: 'center',
      color: '#f4f1df',
      boxSizing: 'border-box',
    });

    const title = document.createElement('div');
    title.textContent = 'MATCH PAUSED';
    Object.assign(title.style, {
      color: '#e8c95c',
      fontSize: '20px',
      fontWeight: '900',
      marginBottom: '8px',
    });

    const note = document.createElement('div');
    note.textContent = 'THE FIELD IS FROZEN. YOUR POSITION AND ROUND ARE SAFE.';
    Object.assign(note.style, {
      fontSize: '10px',
      lineHeight: '1.6',
      opacity: '0.8',
      marginBottom: '18px',
    });

    const makeButton = (label: string, primary: boolean, onClick: () => void) => {
      const button = document.createElement('button');
      button.textContent = label;
      Object.assign(button.style, {
        width: '100%',
        minHeight: '48px',
        marginTop: '10px',
        padding: '10px 14px',
        background: primary ? '#e8c95c' : '#102018',
        border: primary ? '0' : '2px solid #f4f1df',
        borderRadius: '8px',
        color: primary ? '#151a16' : '#f4f1df',
        fontFamily: 'monospace',
        fontWeight: '800',
        touchAction: 'manipulation',
      });
      button.onclick = onClick;
      return button;
    };

    card.appendChild(title);
    card.appendChild(note);
    card.appendChild(makeButton('RESUME MATCH', true, () => this.resumeArena()));
    card.appendChild(makeButton('RESTART MATCH', false, () => {
      this.pausePanel?.remove();
      this.pausePanel = undefined;
      this.paused = false;
      this.fire = false;
      this.setMoveVector(0, 0);
      this.scene.restart();
    }));
    card.appendChild(makeButton('LEAVE ARENA', false, () => this.leaveArena()));

    panel.appendChild(card);
    document.body.appendChild(panel);
    this.pausePanel = panel;
  }

  private leaveArena() {
    this.fire = false;
    this.setMoveVector(0, 0);
    this.pausePanel?.remove();
    this.resultPanel?.remove();
    this.pausePanel = undefined;
    this.resultPanel = undefined;
    this.paused = false;
    this.scene.start('ShootersTriggerLobbyScene');
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
    // No flame/tracer visual — the weapon fires paintballs.
    muzzle.fillStyle(0xf0dfb6, 0.72);
    muzzle.fillCircle(0, 0, 3);
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
    const damagePaint = this.add.graphics().setDepth(35).setVisible(false);
    const droppedWeapon = this.add.graphics().setDepth(22).setVisible(false);
    droppedWeapon.fillStyle(0x151b18, 1).fillRoundedRect(-25, -5, 50, 10, 4);
    droppedWeapon.fillStyle(0x53635c, 1).fillRect(-9, -10, 14, 5);
    droppedWeapon.fillStyle(0x493b31, 1).fillRoundedRect(-22, 6, 13, 6, 2);
    droppedWeapon.lineStyle(2, 0xe8c95c, 0.8).strokeRoundedRect(-25, -5, 50, 10, 4);

    container.add([shadow, poseA, poseB, arms, weapon, muzzle, damagePaint]);

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
    container.setData('nameLabel', name);
    return {
      body: container,
      hp: ARENA_MAX_BODY_HITS,
      wounded: false,
      downed: false,
      damagePaint,
      droppedWeapon,
      weaponDropped: false,
      maxAmmo: ARENA_AMMO_CAPACITY,
      ammo: ARENA_AMMO_CAPACITY,
      refilling: false,
      refillElapsed: 0,
      score: 0,
      speed: 170,
      cooldown: 0,
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
    this.drawAmmoStation();
    this.drawFieldDetails();
  }

  private drawAmmoStation() {
    for (let index = 0; index < ARENA_AMMO_STATIONS.length; index += 1) {
      const station = ARENA_AMMO_STATIONS[index];
      const g = this.add.graphics().setDepth(5);
      g.fillStyle(0x493526, 0.26).fillRoundedRect(station.x + 8, station.y + 10, station.width, station.height, 12);
      g.fillStyle(0x344b3d, 1).fillRoundedRect(station.x, station.y, station.width, station.height, 12);
      g.fillStyle(0x1c2922, 1).fillRoundedRect(station.x + 18, station.y + 24, station.width - 36, station.height - 48, 8);
      g.lineStyle(3, 0xe8c95c, 0.82).strokeRoundedRect(station.x, station.y, station.width, station.height, 12);
      g.fillStyle(0xe8c95c, 0.9).fillRect(station.x + 26, station.y + 16, station.width - 52, 8);
      this.add.text(station.centerX, station.y + 42, 'AMMO', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#e8c95c',
      }).setOrigin(0.5).setDepth(6);
      this.add.text(station.centerX, station.y + 68, 'REFILL · 2.5 SEC', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#f4f1df',
      }).setOrigin(0.5).setDepth(6);
      this.add.text(station.centerX, station.y + 92, index === 0 ? 'LEFT ROUTE' : 'RIGHT ROUTE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#9fbda8',
      }).setOrigin(0.5).setDepth(6);
    }
  }

  private drawFieldDetails() {
    const g = this.add.graphics();

    // Small physical field details only: the existing battlefield stays intact.
    // These marks clarify lanes, staging space and the competition boundary
    // without becoming floating UI or changing the combat layout.
    g.lineStyle(3, 0xf4f1df, 0.20);
    g.strokeRoundedRect(930, 145, 500, 230, 24);
    g.strokeRoundedRect(900, 885, 560, 250, 24);

    g.lineStyle(2, 0xead8a0, 0.28);
    for (const x of [600, 900, 1200, 1500, 1800]) {
      g.lineBetween(x, 530, x, 585);
      g.lineBetween(x, 815, x, 870);
    }

    g.fillStyle(0x493526, 0.16);
    g.fillRoundedRect(1090, 405, 180, 36, 8);
    g.lineStyle(2, 0xf4f1df, 0.22).strokeRoundedRect(1090, 405, 180, 36, 8);

    this.add.text(1180, 423, 'FIELD LINE', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#fff4d4',
    }).setOrigin(0.5).setDepth(6).setAlpha(0.55);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1).fillCircle(x, y, 34 * scale).fillCircle(x - 28 * scale, y + 9 * scale, 28 * scale).fillCircle(x + 28 * scale, y + 9 * scale, 29 * scale);
    g.fillStyle(0x526d3c, 0.75).fillCircle(x + 5 * scale, y - 16 * scale, 23 * scale);
    this.concealments.push(new Phaser.Geom.Circle(x, y, ARENA_STEALTH_RADIUS * scale));
    this.covers.push(new Phaser.Geom.Rectangle(x - 8 * scale, y + 14 * scale, 16 * scale, 52 * scale));

    // World-space cue: concealment spots are obvious without adding another HUD/map widget.
    const ring = this.add.graphics().setDepth(7);
    ring.lineStyle(3, 0x9fbda8, 0.55).strokeCircle(x, y, Math.max(42, ARENA_STEALTH_RADIUS * scale * 0.72));
    const label = this.add.text(x, y + 58 * scale, 'HIDE', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#d8eadf', stroke: '#203326', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8);
    this.stealthIndicators.push({ ring, label, x, y, radius: ARENA_STEALTH_RADIUS * scale });
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
    this.scoreHud?.setPosition(width / 2, 16);
    this.ammoHud?.setPosition(width - 14, 16);
  }

  private updateStealthIndicators() {
    if (!this.player) return;
    const px = this.player.body.x, py = this.player.body.y;
    for (const indicator of this.stealthIndicators) {
      const distance = Phaser.Math.Distance.Between(px, py, indicator.x, indicator.y);
      const proximity = Phaser.Math.Clamp(1 - distance / 340, 0, 1);
      const concealed = distance <= indicator.radius && this.isPlayerConcealed();
      const visible = proximity > 0.02;
      indicator.ring.setVisible(visible);
      indicator.label.setVisible(visible);
      indicator.ring.setAlpha(concealed ? 0.9 : 0.18 + proximity * 0.55);
      indicator.label.setAlpha(concealed ? 1 : 0.25 + proximity * 0.75);
      indicator.label.setText(concealed ? 'HIDDEN' : 'HIDE');
      if (visible) indicator.ring.setScale(1 + Math.sin(Date.now() / 220) * 0.035 * proximity);
    }
  }

  private updatePlayerAwareness() {
    if (!this.isPlayerConcealed()) {
      this.playerLastKnown.set(this.player.body.x, this.player.body.y);
      this.playerRevealedUntil = Math.max(this.playerRevealedUntil, Date.now());
    }
  }

  private isPlayerConcealed() {
    if (this.player.downed || this.player.weaponDropped || Date.now() < this.playerRevealedUntil) return false;
    if (Date.now() - this.playerLastFiredAt < ARENA_STEALTH_BREAK_MS) return false;
    return this.concealments.some((zone) => Phaser.Math.Distance.Between(this.player.body.x, this.player.body.y, zone.x, zone.y) <= zone.radius);
  }

  private isInAmmoStation(x: number, y: number) {
    return ARENA_AMMO_STATIONS.some((station) => station.contains(x, y));
  }

  private getNearestAmmoStation(x: number, y: number) {
    return ARENA_AMMO_STATIONS
      .slice()
      .sort((a, b) => Phaser.Math.Distance.Between(x, y, a.centerX, a.centerY) - Phaser.Math.Distance.Between(x, y, b.centerX, b.centerY))[0];
  }

  private hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number) {
    const line = new Phaser.Geom.Line(fromX, fromY, toX, toY);
    return !this.covers.some((cover) => Phaser.Geom.Intersects.LineToRectangle(line, cover));
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

