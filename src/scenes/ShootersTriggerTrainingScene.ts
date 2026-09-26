import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';
import { abandonShootersTriggerSession, beginShootersTriggerSession, completeShootersTriggerSession } from '../shooters-trigger-session';

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
  ageMs: number;
  impactHoldMs: number;
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
const ARENA_NEUTRAL_BASELINE = false;
const ARENA_BASE_SPEED = 170;
const ARENA_BASE_COOLDOWN = 240;
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
const ARENA_BASE_AIM_RANGE = 720;
const ARENA_BASE_RIVAL_FIRE_RANGE = 720;
const ARENA_RIVAL_OPENING_DELAY_MS = 0;
const ARENA_MAX_BODY_HITS = 2;
const ARENA_BODY_CORE_RADIUS = 34;
const ARENA_SCRAPE_RADIUS = 44;
const ARENA_PROJECTILE_MIN_VISIBLE_MS = 34;
const ARENA_HIDDEN_SEARCH_MS = 3200;

const TRAINING_STAGE_MS = 30000;
const TRAINING_PLAYER_SPAWN = new Phaser.Math.Vector2(620, 700);
const TRAINING_RIVAL_SPAWN = new Phaser.Math.Vector2(1740, 700);
const TRAINING_CAMERA_MIN_ZOOM = 0.62;
const TRAINING_CAMERA_MAX_ZOOM = 0.88;
const TRAINING_CQE_RANGE = 240;
const TRAINING_CQE_HARD_RANGE = 82;
const TRAINING_CQE_COOLDOWN = 240;
const TRAINING_PROJECTILE_SPEED = 400;
const TRAINING_SHOOTING_ENGAGEMENT_RANGE = 620;
const TRAINING_CLOSE_IMPACT_RANGE = 240;
// Never allow the two training fighters to occupy the same contact space.
// Point-blank overlap was causing the aggressive bot to physically collapse
// into the player during CQE and could restart the elimination lifecycle
// repeatedly on touch.
const TRAINING_MIN_SEPARATION = 72;

type TrainingStage = 'EVASION' | 'BREAK' | 'SHOOTING';

export class ShootersTriggerTrainingScene extends Phaser.Scene {
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
  private playerCloseHits = 0;
  private rivalCloseHits = 0;
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
  private rivalMode: 'PRESSURE' | 'FLANK' | 'SEARCH' | 'PATROL' | 'REGROUP' = 'PRESSURE';
  private rivalTargetPoint = new Phaser.Math.Vector2(0, 0);
  private rivalHiddenPatrolCenter = new Phaser.Math.Vector2(0, 0);
  private rivalWasPlayerHidden = false;
  private rivalHiddenSearchStartedAt = 0;
  private rivalHiddenPatrolAttempts = 0;
  private rivalSeekingAmmo = false;
  private trainingEdge: { overall: 'PLAYER' | 'BOT' | 'TIE'; evasion: 'PLAYER' | 'BOT' | 'TIE'; shooting: 'PLAYER' | 'BOT' | 'TIE' } = { overall: 'TIE', evasion: 'TIE', shooting: 'TIE' };
  private rivalAmmoStation = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private readonly rivalPatrolSpeed = 92;
  private stealthIndicators: Array<{ ring: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; x: number; y: number; radius: number }> = [];
  private locatorPanel?: HTMLDivElement;
  private locatorCanvas?: HTMLCanvasElement;
  private locatorCtx?: CanvasRenderingContext2D | null;
  private locatorArrow?: HTMLDivElement;
  private locatorDistance?: HTMLDivElement;

  private readonly trainingMode = true;
  private trainingStage: TrainingStage = 'EVASION';
  private trainingStartedAt = 0;
  private trainingDone = false;
  private trainingCoverBlocks = 0;
  private trainingEvasionStats?: any;
  private trainingEvasionSurvivalMs = 0;
  private trainingEvasionEliminations = 0;
  private trainingEvasionLifeStartedAt = 0;
  private trainingShootingBotSurvivalMs = 0;
  private trainingShootingBotLifeStartedAt = 0;
  private trainingShootingBotEliminations = 0;
  private trainingBreakPanel?: HTMLDivElement;
  private trainingCameraFocus?: Phaser.GameObjects.Zone;
  private trainingResultPanel?: HTMLDivElement;
  private trainingRespawnAt = 0;
  private trainingRespawnTimer?: number;
  private trainingStageFinishing = false;


  constructor() {
    super('ShootersTriggerTrainingScene');
  }

  create() {
    beginShootersTriggerSession('TRAINING CAMP');
    this.cameras.main.setBackgroundColor('#6f984b');
    this.drawField();

    this.trainingStage = 'EVASION';
    this.trainingStartedAt = Date.now();
    this.trainingDone = false;
    this.trainingStageFinishing = false;
    this.trainingCoverBlocks = 0;
    this.trainingEvasionStats = undefined;
    this.trainingEvasionSurvivalMs = 0;
    this.trainingEvasionEliminations = 0;
    this.trainingEvasionLifeStartedAt = Date.now();
    this.trainingShootingBotSurvivalMs = 0;
    this.trainingShootingBotLifeStartedAt = 0;
    this.trainingShootingBotEliminations = 0;
    this.trainingRespawnAt = 0;
    if (this.trainingRespawnTimer) window.clearTimeout(this.trainingRespawnTimer);
    this.trainingRespawnTimer = undefined;
    this.playerSkill = 50;
    this.evasionSkill = 50;
    this.trainingEdge = { overall: 'TIE', evasion: 'TIE', shooting: 'TIE' };
    this.rivalProfile = {
      id: 'all-rounder',
      operator: 'TRAINING BOT',
      shooting: 50,
      movement: 50,
      pressure: 50,
      coverUse: 50,
    };

    // Role is part of fighter construction, not a visual state applied a frame later.
    // This prevents the training player from ever spawning with the Arena weapon pose.
    this.player = this.createFighter(TRAINING_PLAYER_SPAWN.x, TRAINING_PLAYER_SPAWN.y, 0x2f6b4e, 'YOU', true, false);
    this.rival = this.createFighter(TRAINING_RIVAL_SPAWN.x, TRAINING_RIVAL_SPAWN.y, 0x9b3f3f, 'TRAINING BOT', false, true);

    this.player.speed = ARENA_BASE_SPEED;
    this.rival.speed = ARENA_BASE_SPEED;
    this.player.cooldown = 0;
    this.rival.cooldown = 0;

    // Evasion is authoritative: player unarmed, bot armed. No hiding and no ammo stations.
    this.applyTrainingRoleContract();
    this.player.ammo = Number.POSITIVE_INFINITY;
    this.rival.ammo = Number.POSITIVE_INFINITY;

    this.cameras.main.setBounds(0, 0, 2400, 1400);
    // Training is an evaluation, not an Arena traversal. Keep both combatants in
    // the mobile frame so trajectory, evasion and hit distance remain judgeable.
    this.trainingCameraFocus = this.add.zone(
      (this.player.body.x + this.rival.body.x) / 2,
      (this.player.body.y + this.rival.body.y) / 2,
      1,
      1,
    ).setVisible(false);
    this.cameras.main.startFollow(this.trainingCameraFocus, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(0, 0);

    this.createHud();
    this.createPauseButton();
    this.createEnemyLocator();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.cleanup = installShootersTriggerMobileControls();
    this.trainingStartedAt = Date.now();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.cleanup?.();
      this.pauseButton?.remove();
      this.pausePanel?.remove();
      this.resultPanel?.remove();
      this.trainingBreakPanel?.remove();
      if (this.trainingRespawnTimer) window.clearTimeout(this.trainingRespawnTimer);
      this.trainingRespawnTimer = undefined;
      this.clearSplatter();
      this.clearShots();
      this.player?.droppedWeapon?.destroy();
      this.rival?.droppedWeapon?.destroy();
      this.locatorPanel?.remove();
      this.locatorArrow?.remove();
      this.locatorDistance?.remove();
      this.locatorPanel = undefined;
      this.locatorCanvas = undefined;
      this.locatorCtx = undefined;
      this.locatorArrow = undefined;
      this.locatorDistance = undefined;
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time: number, delta: number) {
    // IMPORTANT: the respawn check must run before the normal combat early-return.
    // A player elimination intentionally leaves the fighter downed for a short
    // readable beat; if a lifecycle flag is raised during that beat, putting the
    // respawn check behind the guard can leave the scene looking frozen forever.
    if (this.trainingMode && !this.paused && !this.trainingDone && this.trainingStage !== 'BREAK') {
      if ((this.player.downed || this.rival.downed) && this.trainingRespawnAt <= 0) {
        this.scheduleTrainingRespawn();
      }
      if (this.trainingRespawnAt > 0 && Date.now() >= this.trainingRespawnAt) {
        this.finishTrainingRespawn();
      }
    }

    if (this.trainingDone || this.paused || this.trainingStage === 'BREAK' || this.roundTransition || this.resolvingRound) return;

    // Training roles are a hard gameplay contract. The unarmed side is always
    // visually and mechanically unarmed; the armed side may still lose its gun
    // through the normal Arena weapon-knockout mechanic and must recover it.
    this.applyTrainingRoleContract();
    this.movePlayer(delta);
    this.tryPickupWeapon(this.player);
    this.updateTrainingRival(delta);
    this.enforceTrainingSeparation();
    this.updateShots(delta);
    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    this.rival.cooldown = Math.max(0, this.rival.cooldown - delta);

    if (
      this.fire &&
      !this.manualAim &&
      !this.player.weaponDropped &&
      !this.player.downed &&
      this.rival &&
      !this.isRivalConcealed()
    ) {
      const dx = this.rival.body.x - this.player.body.x;
      const dy = this.rival.body.y - this.player.body.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 1 && distance <= ARENA_BASE_AIM_RANGE && this.hasLineOfSight(
        this.player.body.x, this.player.body.y, this.rival.body.x, this.rival.body.y,
      )) {
        this.aim.set(dx / distance, dy / distance);
      }
    }

    if (this.fire) this.playerFire();
    this.updatePlayerAwareness();
    this.updateAnimations(delta);
    this.updateWeaponPoses();
    this.updateHud();
    this.updateTrainingCamera(delta);
    this.updateEnemyLocator();

    if (Date.now() - this.trainingStartedAt >= TRAINING_STAGE_MS && !this.trainingStageFinishing) {
      this.trainingStageFinishing = true;
      this.finishTrainingStage();
      return;
    }
  }

  private updateTrainingRival(delta: number) {
    if (this.trainingStage === 'EVASION') {
      if (this.rival.downed) return;
      const dx = this.player.body.x - this.rival.body.x;
      const dy = this.player.body.y - this.rival.body.y;
      const d = Math.hypot(dx, dy) || 1;
      const hasSight = this.hasLineOfSight(
        this.rival.body.x,
        this.rival.body.y,
        this.player.body.x,
        this.player.body.y,
      );

      // Evasion is a shooting test for the bot and an evasion test for the
      // player. If an obstacle breaks the shot, the bot does not sit there
      // shooting a wall: it picks the nearest usable corner that restores LOS.
      // This is deliberately lightweight pathing for Phaser's small training
      // arena, rather than introducing a full navigation system.
      if (!hasSight) {
        const route = this.getTrainingObstacleRoute();
        this.moveRival(route.x, route.y, delta, 205, false);
      } else if (d > TRAINING_CQE_RANGE) {
        // Close the distance aggressively so the training bot gets real
        // engagements instead of spending the 30 seconds jogging around.
        this.moveRival(dx / d, dy / d, delta, 205, false);
      } else {
        // Golden CQE: keep pressing straight into the direct engagement until
        // the physical 72px separation guard stops overlap. Do not park at
        // RANGE 1 or orbit the player while an easy clean firing line is open.
        // Hit geometry/resolution is locked; this changes movement only.
        const pressDistance = Math.max(0, d - TRAINING_MIN_SEPARATION);
        if (pressDistance > 0) {
          this.moveRival(dx / d, dy / d, delta, 205, false);
        } else {
          this.rivalMoving = false;
        }
      }

      if (this.rival.cooldown <= 0 && d <= ARENA_BASE_RIVAL_FIRE_RANGE && hasSight) {
        // CQE rewards getting close through better shot placement, not bonus
        // damage. Lead a moving player by a short, bounded amount so the bot
        // does not repeatedly fire at the position the player occupied a frame
        // ago and turn a point-blank exchange into meaningless scrapes.
        const aim = this.getTrainingRivalAim(d);
        this.rivalFire(aim, d);
      }
      return;
    }

    // Shooting stage: the bot is unarmed and evasive. It still has to behave
    // like a real target: if cover blocks the player's route, it works around it
    // instead of repeatedly walking into the obstacle.
    if (this.rival.downed) return;
    const dx = this.player.body.x - this.rival.body.x;
    const dy = this.player.body.y - this.rival.body.y;
    const d = Math.hypot(dx, dy) || 1;
    const hasSight = this.hasLineOfSight(
      this.rival.body.x,
      this.rival.body.y,
      this.player.body.x,
      this.player.body.y,
    );

    if (!hasSight) {
      const route = this.getTrainingObstacleRoute();
      this.moveRival(route.x, route.y, delta, 175, false);
      return;
    }

    // The unarmed target prioritizes creating real separation from the
    // armed player. Blend a strong radial retreat with lateral breaks so it
    // does not simply orbit inside the player's easy auto-aim band.
    // No concealment or hit/damage changes: this is movement behaviour only.
    // dx/dy point FROM the bot TO the player. Retreat must use the
    // opposite radial vector; the previous positive vector actually charged
    // the player. Keep lateral movement subordinate to the away vector.
    const side = Math.sin(Date.now() / 520) >= 0 ? 1 : -1;
    const retreatX = -dx / d;
    const retreatY = -dy / d;
    const lateralWeight = d < TRAINING_CQE_RANGE ? 0.32 : 0.22;
    const desiredX = retreatX + (-retreatY) * side * lateralWeight;
    const desiredY = retreatY + retreatX * side * lateralWeight;

    this.moveTrainingTargetAway(desiredX, desiredY, retreatX, retreatY, delta);
  }

  private moveTrainingTargetAway(
    desiredX: number,
    desiredY: number,
    awayX: number,
    awayY: number,
    delta: number,
  ) {
    // A candidate is accepted only if its movement has a positive component
    // away from the player. Unlike generic obstacle fallback, this prevents
    // the evasive target from ever selecting a forward/charging step.
    const baseAngle = Math.atan2(desiredY, desiredX);
    const speed = this.rival.wounded ? this.rival.speed * 0.92 : 205;
    const step = speed * delta / 1000;
    const offsets = [0, 0.35, -0.35, 0.72, -0.72, 1.05, -1.05];
    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const moveX = Math.cos(angle);
      const moveY = Math.sin(angle);
      if (moveX * awayX + moveY * awayY <= 0.18) continue;
      const nx = Phaser.Math.Clamp(this.rival.body.x + moveX * step, 42, 2358);
      const ny = Phaser.Math.Clamp(this.rival.body.y + moveY * step, 90, 1350);
      if (this.inCover(nx, ny, 14)) continue;
      this.rival.body.setPosition(nx, ny);
      this.rivalMoving = true;
      if (Math.abs(moveX) > 0.08) this.rivalFacing = moveX < 0 ? -1 : 1;
      return;
    }
    // At a map edge or blocked retreat, stop rather than walk toward the player.
    this.rivalMoving = false;
  }

  private enforceTrainingSeparation() {
    if (!this.trainingMode || this.trainingStage === 'BREAK' || this.trainingDone) return;

    const dx = this.rival.body.x - this.player.body.x;
    const dy = this.rival.body.y - this.player.body.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= TRAINING_MIN_SEPARATION) return;

    // The rival is the aggressive mover, so resolve contact by backing it away
    // from the player. If both actors somehow land on the exact same point,
    // use a deterministic direction rather than normalizing a zero vector.
    const safeDistance = Math.max(distance, 1);
    const awayX = distance > 1 ? dx / safeDistance : 1;
    const awayY = distance > 1 ? dy / safeDistance : 0;
    const targetX = Phaser.Math.Clamp(
      this.player.body.x + awayX * TRAINING_MIN_SEPARATION,
      42,
      2358,
    );
    const targetY = Phaser.Math.Clamp(
      this.player.body.y + awayY * TRAINING_MIN_SEPARATION,
      90,
      1350,
    );

    if (!this.inCover(targetX, targetY, 14)) {
      this.rival.body.setPosition(targetX, targetY);
      return;
    }

    // If the direct escape point is inside cover, move the player back instead
    // of leaving the fighters overlapped. This is a safety net, not a combat
    // advantage: it only runs while the minimum contact distance is violated.
    const playerX = Phaser.Math.Clamp(
      this.rival.body.x - awayX * TRAINING_MIN_SEPARATION,
      42,
      2358,
    );
    const playerY = Phaser.Math.Clamp(
      this.rival.body.y - awayY * TRAINING_MIN_SEPARATION,
      90,
      1350,
    );
    if (!this.inCover(playerX, playerY, 14)) {
      this.player.body.setPosition(playerX, playerY);
    }
  }

  private applyTrainingRoleContract() {
    if (!this.player || !this.rival) return;
    const playerShouldBeArmed = this.trainingStage === 'SHOOTING';
    const rivalShouldBeArmed = this.trainingStage === 'EVASION';

    if (!playerShouldBeArmed) {
      this.player.weaponDropped = true;
      this.player.body.setData('combatState', 'UNARMED');
      this.updateWeaponVisibility(this.player, false);
      this.player.droppedWeapon.setVisible(false);
    } else if (this.player.weaponDropped) {
      this.updateWeaponVisibility(this.player, false);
    }

    if (!rivalShouldBeArmed) {
      this.rival.weaponDropped = true;
      this.rival.body.setData('combatState', 'UNARMED');
      this.updateWeaponVisibility(this.rival, false);
      this.rival.droppedWeapon.setVisible(false);
    } else if (this.rival.weaponDropped) {
      this.updateWeaponVisibility(this.rival, false);
    }
  }

  private setTrainingArmed(target: Fighter, armed: boolean) {
    target.weaponDropped = !armed;
    target.downed = false;
    target.wounded = false;
    target.ammo = Number.POSITIVE_INFINITY;
    target.refilling = false;
    target.refillElapsed = 0;
    target.droppedWeapon.setVisible(false);
    target.droppedWeapon.setPosition(target.body.x, target.body.y);
    target.body.setData('combatState', armed ? 'READY' : 'UNARMED');
    this.updateWeaponVisibility(target, armed);
  }

  private finishTrainingStage() {
    if (this.trainingDone) return;
    if (this.trainingStage === 'EVASION') this.recordCurrentEvasionLife();
    if (this.trainingStage === 'SHOOTING') this.recordCurrentShootingBotLife();
    this.clearShots();
    this.fire = false;
    this.setMoveVector(0, 0);

    if (this.trainingStage === 'EVASION') {
      const incoming = this.rivalShotsFired;
      const landed = this.rivalPaintHits;
      const headshots = this.rivalHeadshots;
      const misses = this.rivalMisses;
      const accuracy = incoming > 0 ? landed / incoming : 0;
      const survivalRatio = clamp(this.trainingEvasionSurvivalMs / TRAINING_STAGE_MS, 0, 1);
      const coverRatio = incoming > 0 ? clamp(this.trainingCoverBlocks / incoming, 0, 1) : 0;
      // These are two independent role scores, not one score viewed from two
      // angles. YOUR EVASION measures survival/avoidance; BOT SHOOTING measures
      // conversion of fired paint into meaningful hits. That makes the phone
      // comparison explain who was better at the job they were assigned.
      const score = clamp(
        Math.round(
          survivalRatio * 50 +
          (1 - accuracy) * 30 +
          coverRatio * 20 -
          this.trainingEvasionEliminations * 12,
        ),
        0,
        100,
      );
      const botShootingScore = clamp(
        Math.round(
          accuracy * 55 +
          clamp(this.trainingEvasionEliminations / 2, 0, 1) * 25 +
          (this.rivalHeadshots / Math.max(1, incoming)) * 10 +
          (this.rivalBodyHits / Math.max(1, incoming)) * 10,
        ),
        0,
        100,
      );
      // Evasion is stored independently. Its edge is decided after Shooting
      // because BOT EVASION is only measured in the reversed drill.
      const edge = 'TIE';
      this.trainingEvasionStats = {
        score,
        playerScore: score,
        botShootingScore,
        edge,
        shots: incoming,
        hits: this.rivalBodyHits + this.rivalHeadshots,
        headshots,
        coverBlocks: this.trainingCoverBlocks,
        scrapes: this.rivalScrapes,
        misses,
        survived: Math.round(this.trainingEvasionSurvivalMs),
        eliminations: this.trainingEvasionEliminations,
      };
      this.showTrainingBreak();
      return;
    }

    this.finishTraining();
  }

  private showTrainingBreak() {
    this.trainingStage = 'BREAK';
    this.fire = false;
    this.setMoveVector(0, 0);
    const panel = document.createElement('div');
    this.trainingBreakPanel = panel;
    Object.assign(panel.style, {
      position: 'fixed', inset: '0', zIndex: '1550', display: 'grid', placeItems: 'center',
      padding: 'max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))', background: 'rgba(12,18,14,.78)', fontFamily: 'monospace', boxSizing: 'border-box', overflow: 'auto',
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(420px, calc(100vw - 24px))', maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto', boxSizing: 'border-box', padding: '20px', background: '#151a16', color: '#f4f1df',
      border: '2px solid #e8c95c', borderRadius: '12px', textAlign: 'center',
    });
    card.innerHTML =
      '<div style="color:#e8c95c;font-size:20px;font-weight:800">BREAK · 30 SEC COMPLETE</div>' +
      '<div style="margin:16px 0;font-size:11px;line-height:1.7">Roles switch now.<br>You get the gun.<br>The training bot becomes the evasive target.</div>';
    const button = document.createElement('button');
    button.textContent = 'START SHOOTING · 30 SEC';
    Object.assign(button.style, {
      width:'100%', minHeight:'50px', background:'#e8c95c', border:0, borderRadius:'8px',
      fontFamily:'monospace', fontWeight:'800',
    });
    button.onclick = () => {
      panel.remove();
      this.trainingBreakPanel = undefined;
      this.trainingStageFinishing = false;
      this.trainingStage = 'SHOOTING';
      this.trainingStartedAt = Date.now();
      // Shooting is a clean second experiment. Evasion evidence is already
      // stored in trainingEvasionStats, so the reversed drill starts fresh.
      this.trainingStageFinishing = false;
      this.playerShotsFired = 0;
      this.playerBodyHits = 0;
      this.playerHeadshots = 0;
      this.playerScrapes = 0;
      this.playerMisses = 0;
      this.playerPaintHits = 0;
      this.rivalShotsFired = 0;
      this.rivalBodyHits = 0;
      this.rivalHeadshots = 0;
      this.rivalScrapes = 0;
      this.rivalMisses = 0;
      this.rivalPaintHits = 0;
      this.trainingShootingBotSurvivalMs = 0;
      this.trainingShootingBotEliminations = 0;
      this.trainingShootingBotLifeStartedAt = Date.now();
      this.player.body.setPosition(TRAINING_PLAYER_SPAWN.x, TRAINING_PLAYER_SPAWN.y);
      this.rival.body.setPosition(TRAINING_RIVAL_SPAWN.x, TRAINING_RIVAL_SPAWN.y);
      this.resetTrainingCombatant(this.player, false);
      this.resetTrainingCombatant(this.rival, true);
      // Shooting: player armed, bot unarmed. No hiding and no ammo stations.
      this.setTrainingArmed(this.player, true);
      this.setTrainingArmed(this.rival, false);
      this.player.ammo = Number.POSITIVE_INFINITY;
      this.rival.ammo = Number.POSITIVE_INFINITY;
      this.clearSplatter();
      this.clearShots();
      this.player.cooldown = 0;
      this.rival.cooldown = 0;
      this.applyTrainingRoleContract();
      this.statusHud?.setText('ROLES SWITCHED · YOU ARMED · BOT UNARMED · 30 SEC');
    };
    card.appendChild(button);
    panel.appendChild(card);
    document.body.appendChild(panel);
  }

  private resetTrainingCombatant(target: Fighter, keepArmed: boolean) {
    target.hp = ARENA_MAX_BODY_HITS;
    target.wounded = false;
    target.downed = false;
    target.weaponDropped = !keepArmed;
    target.ammo = Number.POSITIVE_INFINITY;
    target.refilling = false;
    target.refillElapsed = 0;
    target.droppedWeapon.setVisible(false);
    target.damagePaint.clear();
    target.damagePaint.setVisible(false);
    target.body.setAlpha(1).setScale(1).setRotation(0);
    const name = target.body.getData('nameLabel') as Phaser.GameObjects.Text | undefined;
    name?.setAlpha(1);
    this.updateWeaponVisibility(target, keepArmed);
    if (!keepArmed) target.droppedWeapon.setVisible(false);
  }

  private finishTraining() {
    this.trainingDone = true;
    this.trainingStageFinishing = false;
    const shootingShots = this.playerShotsFired;
    const shootingHits = this.playerBodyHits + this.playerHeadshots;
    const accuracy = shootingShots > 0 ? shootingHits / shootingShots : 0;
    const playerCleanShotRate = shootingShots > 0 ? shootingHits / shootingShots : 0;
    const playerHitQuality = shootingHits > 0
      ? (this.playerHeadshots * 1 + this.playerBodyHits * 0.65) / shootingHits
      : 0;
    // Grade shot-making from rates, not raw totals. The previous raw per-hit
    // bonus let a long spray inflate the score and made tiny samples erratic.
    // Accuracy dominates; confirmed hit quality is a modest secondary signal.
    const shootingScore = clamp(Math.round(
      playerCleanShotRate * 80 + playerHitQuality * 20,
    ), 0, 100);
    // Bot shooting uses the same normalized clean-hit-rate scale as player
    // shooting. Compare like-for-like accuracy evidence, not unlike weighted
    // composites from the two drills.
    const evasionIncoming = Number(this.trainingEvasionStats?.shots ?? 0);
    const evasionHits = Number(this.trainingEvasionStats?.hits ?? 0);
    const botCleanShotRate = evasionIncoming > 0 ? evasionHits / evasionIncoming : 0;
    const botHeadshots = Number(this.trainingEvasionStats?.headshots ?? 0);
    const botHitQuality = evasionHits > 0
      ? (botHeadshots * 1 + Math.max(0, evasionHits - botHeadshots) * 0.65) / evasionHits
      : 0;
    const botShootingScore = clamp(Math.round(
      botCleanShotRate * 80 + botHitQuality * 20,
    ), 0, 100);
    // Bot evasion mirrors the player's evasion score: longest uninterrupted
    // survival, share of incoming player shots avoided, and no-death bonus.
    const botEvasionSurvival = clamp(this.trainingShootingBotSurvivalMs / TRAINING_STAGE_MS, 0, 1);
    const botEvasionScore = clamp(Math.round(
      botEvasionSurvival * 50 +
      (1 - playerCleanShotRate) * 35 +
      (this.trainingShootingBotEliminations === 0 ? 15 : -Math.min(15, this.trainingShootingBotEliminations * 5)),
    ), 0, 100);
    const shootingEdge = shootingScore > botShootingScore + 5 ? 'PLAYER'
      : shootingScore < botShootingScore - 5 ? 'BOT' : 'TIE';
    const evasion = this.trainingEvasionStats || {
      score: 50, edge: 'TIE', shots: 0, hits: 0, headshots: 0, coverBlocks: 0, scrapes: 0, misses: 0, survived: TRAINING_STAGE_MS,
    };
    evasion.playerScore = Number(evasion.playerScore ?? evasion.score ?? 50);
    evasion.botShootingScore = botShootingScore;
    // The final profile is like-for-like:
    // EVASION = YOUR EVASION vs BOT EVASION.
    // SHOOTING = YOUR SHOOTING vs BOT SHOOTING.
    const evasionEdge = evasion.playerScore > botEvasionScore + 5 ? 'PLAYER'
      : evasion.playerScore < botEvasionScore - 5 ? 'BOT' : 'TIE';
    evasion.edge = evasionEdge;
    const playerOverallScore = Math.round((evasion.playerScore + shootingScore) / 2);
    const botOverallScore = Math.round((botEvasionScore + evasion.botShootingScore) / 2);
    const overall = playerOverallScore > botOverallScore + 5 ? 'PLAYER'
      : playerOverallScore < botOverallScore - 5 ? 'BOT' : 'TIE';

    const report = {
      durationMs: TRAINING_STAGE_MS * 2,
      evasion,
      shooting: {
        score: shootingScore,
        playerShootingScore: shootingScore,
        botEvasionScore,
        botSurvived: Math.round(this.trainingShootingBotSurvivalMs),
        edge: shootingEdge,
        shots: shootingShots,
        hits: shootingHits,
        headshots: this.playerHeadshots,
        bodyHits: this.playerBodyHits,
        closeHits: this.playerCloseHits,
        scrapes: this.playerScrapes,
        misses: this.playerMisses,
      },
      edge: { evasion: evasionEdge, shooting: shootingEdge, overall },
      profile: {
        playerOverallScore,
        botOverallScore,
        playerEvasionScore: evasion.playerScore,
        botEvasionScore,
        playerShootingScore: shootingScore,
        botShootingScore,
      },
      completedAt: Date.now(),
    };

    try {
      localStorage.setItem('shooters-trigger:last-evasion', JSON.stringify({
        survived: evasion.survived,
        incomingShots: evasion.shots,
        hits: evasion.hits,
        headshots: evasion.headshots,
        coverBlocks: evasion.coverBlocks,
        scrapes: evasion.scrapes,
        misses: evasion.misses,
        score: evasion.score,
        playerScore: evasion.playerScore,
        botShootingScore,
        botEvasionScore,
        eliminations: evasion.eliminations,
        edge: evasion.edge,
      }));
      localStorage.setItem('shooters-trigger:last-shooting', JSON.stringify({
        accuracy: accuracy * 100,
        targetHits: shootingHits,
        bodyHits: this.playerBodyHits,
        closeHits: this.playerCloseHits,
        headshots: this.playerHeadshots,
        scrapes: this.playerScrapes,
        misses: this.playerMisses,
        shotsFired: shootingShots,
        score: shootingScore,
        playerShootingScore: shootingScore,
        botEvasionScore,
        edge: shootingEdge,
      }));
      localStorage.setItem('shooters-trigger:training-report', JSON.stringify(report));
    } catch {}

    completeShootersTriggerSession('TRAINING CAMP COMPLETE · PHONE REPORT UPDATED · ARENA ODDS READY');
    this.showTrainingResult(report);
  }

  private showTrainingResult(report: any) {
    this.trainingResultPanel?.remove();
    const panel = document.createElement('div');
    this.trainingResultPanel = panel;
    Object.assign(panel.style, {
      position:'fixed', inset:'0', zIndex:'1600', display:'grid', placeItems:'center',
      padding:'max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))', background:'rgba(12,18,14,.82)', fontFamily:'monospace', boxSizing:'border-box', overflow:'auto',
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      width:'min(440px, calc(100vw - 24px))', maxHeight:'calc(100dvh - 24px)', overflowY:'auto', boxSizing:'border-box', padding:'20px', background:'#151a16', color:'#f4f1df',
      border:'2px solid #e8c95c', borderRadius:'12px', textAlign:'center',
    });
    const range = (score:number) => score < 40 ? '1' : score < 60 ? '2' : score < 80 ? '3' : '4';
    const read = (score:number, kind:'EVASION'|'SHOOTING') => {
      if (kind === 'EVASION') return score >= 80 ? 'CALM UNDER FIRE' : score >= 60 ? 'MOVES WITH INTENT' : score >= 40 ? 'STILL FINDING SPACE' : 'EXPOSED UNDER PRESSURE';
      return score >= 80 ? 'CLEAN FINISHER' : score >= 60 ? 'CONTROLLED PRESSURE' : score >= 40 ? 'FINDING THE RHYTHM' : 'WASTES TOO MUCH PAINT';
    };
    card.innerHTML =
      '<div style="color:#e8c95c;font-size:19px;font-weight:800">FIELD READOUT</div>' +
      '<div style="margin:8px 0 14px;font-size:10px;line-height:1.55;color:#b9c8bd">Two drills. Four field skills. Each side is measured on the job it was doing.</div>' +
      '<div style="padding:11px;border:1px solid #496556;border-radius:10px;background:#102018;text-align:left;margin-bottom:8px"><b>🛡️ EVASION</b><br><span style="font-size:10px;color:#b9c8bd">YOUR EVASION · '+range(report.profile?.playerEvasionScore ?? report.evasion.playerScore)+'/4 &nbsp; | &nbsp; BOT EVASION · '+range(report.profile?.botEvasionScore ?? 50)+'/4</span><br><span style="font-size:10px;color:#f4f1df">'+(report.edge.evasion==='PLAYER'?'🟢 YOU EVADED BETTER':report.edge.evasion==='BOT'?'🔴 BOT EVADED BETTER':'🟡 EVEN')+'</span></div>' +
      '<div style="padding:11px;border:1px solid #496556;border-radius:10px;background:#102018;text-align:left;margin-bottom:8px"><b>🎯 SHOOTING</b><br><span style="font-size:10px;color:#b9c8bd">YOUR SHOOTING · '+range(report.profile?.playerShootingScore ?? report.shooting.playerShootingScore)+'/4 &nbsp; | &nbsp; BOT SHOOTING · '+range(report.profile?.botShootingScore ?? report.evasion.botShootingScore)+'/4</span><br><span style="font-size:10px;color:#f4f1df">'+(report.edge.shooting==='PLAYER'?'🟢 YOU SHOT BETTER':report.edge.shooting==='BOT'?'🔴 BOT SHOT BETTER':'🟡 EVEN')+'</span></div>' +
      '<div style="margin-top:10px;padding:12px;border:2px solid #e8c95c;border-radius:10px;background:#182b20"><b>OVERALL · '+report.edge.overall+'</b><br><span style="font-size:9px;color:#b9c8bd">EDGE changes your Arena odds. It does not guarantee the result.</span></div>';
    const button = document.createElement('button');
    button.textContent = 'RETURN TO FIELD';
    Object.assign(button.style, {
      width:'100%', minHeight:'50px', background:'#e8c95c', border:0, borderRadius:'8px',
      fontFamily:'monospace', fontWeight:'800',
    });
    button.onclick = () => {
      panel.remove();
      this.trainingResultPanel = undefined;
      this.scene.start('ShootersTriggerLobbyScene');
    };
    card.appendChild(button);
    panel.appendChild(card);
    document.body.appendChild(panel);
  }

  public setMoveVector(x: number, y: number) {
    this.joystickVector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
  }

  public isFireAvailable() {
    return this.trainingStage === 'SHOOTING' && !this.trainingDone && !this.paused;
  }

  public setFireHeld(value: boolean) {
    if (!this.isFireAvailable()) {
      this.fire = false;
      this.manualAim = false;
      return;
    }
    if (!value) {
      this.manualAim = false;
    } else if (!this.manualAim && !this.player.weaponDropped && !this.player.downed && this.rival && !this.isRivalConcealed()) {
      const dx = this.rival.body.x - this.player.body.x;
      const dy = this.rival.body.y - this.player.body.y;
      const distance = Math.hypot(dx, dy);
      const aimRange = this.getPlayerAimRange();
      if (distance > 1 && distance <= aimRange && this.hasLineOfSight(this.player.body.x, this.player.body.y, this.rival.body.x, this.rival.body.y)) {
        this.aim.set(dx / distance, dy / distance);
      }
    }
    this.fire = value;
  }

  public setAimVector(x: number, y: number) {
    if (!this.isFireAvailable()) return;
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
    try {
      const report = JSON.parse(localStorage.getItem('shooters-trigger:training-report') || 'null');
      const profile = report?.profile;
      this.trainingEdge = {
        overall: report?.edge?.overall === 'PLAYER' || report?.edge?.overall === 'BOT' ? report.edge.overall : 'TIE',
        evasion: report?.edge?.evasion === 'PLAYER' || report?.edge?.evasion === 'BOT' ? report.edge.evasion : 'TIE',
        shooting: report?.edge?.shooting === 'PLAYER' || report?.edge?.shooting === 'BOT' ? report.edge.shooting : 'TIE',
      };

      // Arena receives the four like-for-like field skills directly:
      // YOUR EVASION, BOT EVASION, YOUR SHOOTING, BOT SHOOTING.
      // Do not reconstruct skill from legacy drill fields or from a win/loss
      // boost; that makes the phone read one thing while Arena plays another.
      this.playerSkill = clamp(Number(profile?.playerShootingScore ?? 50), 0, 100);
      this.evasionSkill = clamp(Number(profile?.playerEvasionScore ?? 50), 0, 100);
    } catch {
      this.trainingEdge = { overall: 'TIE', evasion: 'TIE', shooting: 'TIE' };
      this.playerSkill = 50;
      this.evasionSkill = 50;
    }
  }

  private chooseRivalProfile(): RivalProfile {
    if (this.trainingEdge.overall === 'TIE') {
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
    if (this.player.downed || this.player.refilling) {
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

  private moveRival(
    desiredX: number,
    desiredY: number,
    delta: number,
    speedOverride?: number,
    avoidConcealment = false,
  ) {
    const length = Math.hypot(desiredX, desiredY);
    if (length < 0.01) {
      this.rivalMoving = false;
      return;
    }
    const baseAngle = Math.atan2(desiredY, desiredX);
    const speed = speedOverride ?? (this.rival.wounded ? this.rival.speed * 0.92 : this.rival.speed);
    const step = speed * delta / 1000;
    const canStep = (nx: number, ny: number, padding: number) =>
      !this.inCover(nx, ny, padding) &&
      (!avoidConcealment || !this.inConcealment(nx, ny, 18));

    const offsets = [0, 0.62, -0.62, 1.18, -1.18, 1.7, -1.7, Math.PI];
    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const nx = Phaser.Math.Clamp(this.rival.body.x + Math.cos(angle) * step, 42, 2358);
      const ny = Phaser.Math.Clamp(this.rival.body.y + Math.sin(angle) * step, 90, 1350);
      if (!canStep(nx, ny, 14)) continue;
      this.rival.body.x = nx;
      this.rival.body.y = ny;
      this.rivalMoving = true;
      if (Math.abs(Math.cos(angle)) > 0.08) this.rivalFacing = Math.cos(angle) < 0 ? -1 : 1;
      return;
    }
    for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const nx = Phaser.Math.Clamp(this.rival.body.x + Math.cos(angle) * step, 42, 2358);
      const ny = Phaser.Math.Clamp(this.rival.body.y + Math.sin(angle) * step, 90, 1350);
      if (!canStep(nx, ny, 10)) continue;
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
    if (this.rival.ammo <= 0 || this.rival.refilling) {
      this.updateRivalRefill(delta);
      return;
    }

    const now = Date.now();
    const playerHidden = this.isPlayerConcealed();
    const canSeePlayer = !playerHidden && this.hasLineOfSight(
      this.rival.body.x,
      this.rival.body.y,
      this.player.body.x,
      this.player.body.y,
    );
    const distance = Phaser.Math.Distance.Between(
      this.rival.body.x,
      this.rival.body.y,
      this.player.body.x,
      this.player.body.y,
    );

    // Hidden-state transitions happen once. The old implementation re-entered
    // SEARCH every decision tick while the player stayed concealed, which meant
    // PATROL could never really persist and the rival kept returning to the same
    // last-known point. A hidden player now causes: search -> regroup -> patrol.
    if (playerHidden && !this.rivalWasPlayerHidden) {
      this.rivalMode = 'SEARCH';
      this.rivalHiddenPatrolCenter.set(this.playerLastKnown.x, this.playerLastKnown.y);
      this.rivalHiddenSearchStartedAt = now;
      this.rivalHiddenPatrolAttempts = 0;
      this.rivalTargetPoint.set(this.playerLastKnown.x, this.playerLastKnown.y);
    } else if (!playerHidden && this.rivalWasPlayerHidden) {
      this.rivalMode = canSeePlayer ? 'PRESSURE' : 'FLANK';
      this.rivalDecisionAt = now + 250;
      this.rivalHiddenSearchStartedAt = 0;
      this.rivalHiddenPatrolAttempts = 0;
    }
    this.rivalWasPlayerHidden = playerHidden;

    if (!playerHidden && now >= this.rivalDecisionAt) {
      this.rivalDecisionAt = now + Phaser.Math.Between(900, 1700);

      // Ammo is now a tactical resource, not a trigger to mindlessly empty the
      // magazine. When the rival gets low, it picks the safer of the two stations
      // rather than automatically taking whichever one is closest.
      if (this.trainingEdge.overall === 'BOT' && canSeePlayer && distance < 560) {
        this.rivalMode = Math.random() < 0.72 ? 'PRESSURE' : 'FLANK';
      } else if (this.trainingEdge.overall === 'PLAYER' && canSeePlayer) {
        this.rivalMode = Math.random() < 0.68 ? 'FLANK' : 'PRESSURE';
      }

      if (this.rival.ammo <= 7) {
        this.rivalSeekingAmmo = true;
        this.rivalAmmoStation = this.chooseSaferAmmoStation();
      } else if (this.rival.ammo >= 14) {
        this.rivalSeekingAmmo = false;
      }

      if (this.rivalSeekingAmmo) {
        this.rivalTargetPoint.set(this.rivalAmmoStation.centerX, this.rivalAmmoStation.centerY);
      } else if (this.trainingEdge.overall === 'BOT' && canSeePlayer && distance < 560) {
        this.rivalMode = Math.random() < 0.72 ? 'PRESSURE' : 'FLANK';
      } else if (this.trainingEdge.overall === 'PLAYER' && canSeePlayer) {
        this.rivalMode = Math.random() < 0.68 ? 'FLANK' : 'PRESSURE';
      } else if (canSeePlayer && distance < 520 && Math.random() < 0.55) {
        this.rivalMode = Math.random() < 0.62 ? 'FLANK' : 'PRESSURE';
      } else {
        this.rivalMode = Math.random() < 0.58 ? 'FLANK' : 'PRESSURE';
      }

      if (!this.rivalSeekingAmmo && this.rivalMode === 'FLANK') {
        const angle =
          Math.atan2(
            this.player.body.y - this.rival.body.y,
            this.player.body.x - this.rival.body.x,
          ) + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        const flankDistance = Phaser.Math.Between(320, 560);
        this.rivalTargetPoint.set(
          Phaser.Math.Clamp(this.player.body.x + Math.cos(angle) * flankDistance, 90, 2310),
          Phaser.Math.Clamp(this.player.body.y + Math.sin(angle) * flankDistance, 110, 1290),
        );
      } else if (!this.rivalSeekingAmmo) {
        this.rivalTargetPoint.set(this.player.body.x, this.player.body.y);
      }
    }

    if (playerHidden) {
      if (this.rivalMode === 'SEARCH') {
        const dx = this.rivalTargetPoint.x - this.rival.body.x;
        const dy = this.rivalTargetPoint.y - this.rival.body.y;
        const searchAge = now - this.rivalHiddenSearchStartedAt;

        if (Math.hypot(dx, dy) < 85 || searchAge >= ARENA_HIDDEN_SEARCH_MS) {
          this.rivalMode = 'REGROUP';
          this.chooseHiddenRegroupPoint();
        } else {
          this.moveRival(dx, dy, delta, this.rivalPatrolSpeed, true);
        }
      } else if (this.rivalMode === 'REGROUP') {
        const dx = this.rivalTargetPoint.x - this.rival.body.x;
        const dy = this.rivalTargetPoint.y - this.rival.body.y;
        if (Math.hypot(dx, dy) < 60) {
          this.rivalMode = 'PATROL';
          this.rivalHiddenPatrolCenter.set(this.rival.body.x, this.rival.body.y);
          this.rivalHiddenPatrolAttempts = 0;
          this.rivalDecisionAt = now + Phaser.Math.Between(700, 1200);
          this.chooseHiddenPatrolPoint();
        } else {
          // Regroup is an actual withdrawal, not the same search path at a
          // slower speed. It moves at active movement speed while still avoiding
          // natural concealment.
          this.moveRival(dx, dy, delta, undefined, true);
        }
      } else if (this.rivalMode === 'PATROL') {
        const dx = this.rivalTargetPoint.x - this.rival.body.x;
        const dy = this.rivalTargetPoint.y - this.rival.body.y;
        if (Math.hypot(dx, dy) < 55 || now >= this.rivalDecisionAt) {
          this.rivalHiddenPatrolAttempts += 1;
          this.rivalDecisionAt = now + Phaser.Math.Between(900, 1600);
          this.chooseHiddenPatrolPoint();
        }
        this.moveRival(dx, dy, delta, this.rivalPatrolSpeed, true);
      } else {
        // A hidden player should never leave the rival in a normal combat mode.
        this.rivalMode = 'SEARCH';
        this.rivalHiddenSearchStartedAt = now;
        this.rivalTargetPoint.set(this.playerLastKnown.x, this.playerLastKnown.y);
        this.moveRival(
          this.rivalTargetPoint.x - this.rival.body.x,
          this.rivalTargetPoint.y - this.rival.body.y,
          delta,
          this.rivalPatrolSpeed,
          true,
        );
      }
    } else if (this.rivalSeekingAmmo) {
      const dx = this.rivalAmmoStation.centerX - this.rival.body.x;
      const dy = this.rivalAmmoStation.centerY - this.rival.body.y;
      if (Math.hypot(dx, dy) < 42) {
        this.rivalSeekingAmmo = false;
        this.rivalMode = 'REGROUP';
      } else {
        // If the player is already threatening this station, do not walk into
        // the reload trap. Re-evaluate the other station on the next decision.
        if (canSeePlayer && Phaser.Math.Distance.Between(
          this.player.body.x, this.player.body.y,
          this.rivalAmmoStation.centerX, this.rivalAmmoStation.centerY,
        ) < 260) {
          this.rivalAmmoStation = this.chooseSaferAmmoStation(this.rivalAmmoStation.centerX, this.rivalAmmoStation.centerY);
        }
        this.moveRival(dx, dy, delta);
      }
    } else if (this.rivalMode === 'FLANK') {
      const dx = this.rivalTargetPoint.x - this.rival.body.x;
      const dy = this.rivalTargetPoint.y - this.rival.body.y;
      if (Math.hypot(dx, dy) < 70) {
        this.rivalMode = 'PRESSURE';
        this.rivalDecisionAt = now + 250;
      } else {
        this.moveRival(dx, dy, delta);
      }
    } else {
      const dx = this.player.body.x - this.rival.body.x;
      const dy = this.player.body.y - this.rival.body.y;
      const d = Math.hypot(dx, dy) || 1;
      const side = Math.random() < 0.5 ? 1 : -1;
      this.moveRival(
        d > 560 ? dx / d : (-dy / d) * side,
        d > 560 ? dy / d : (dx / d) * side,
        delta,
      );
    }

    // Reaching an ammo station is enough to begin a tactical refill;
    // the magazine does not have to be completely empty first.
    if (this.rival.ammo < this.rival.maxAmmo && this.isInAmmoStation(this.rival.body.x, this.rival.body.y)) {
      this.updateRivalRefill(delta);
      return;
    }

    const rivalHidden = this.isRivalConcealed();
    const nowDistance = Phaser.Math.Distance.Between(
      this.player.body.x,
      this.player.body.y,
      this.rival.body.x,
      this.rival.body.y,
    );

    if (
      !this.rivalSeekingAmmo &&
      !rivalHidden &&
      !playerHidden &&
      canSeePlayer &&
      this.rival.cooldown <= 0 &&
      now >= this.rivalCanFireAt &&
      nowDistance < this.getRivalFireRange() &&
      this.shouldRivalFire(nowDistance, now)
    ) {
      const direction = new Phaser.Math.Vector2(
        this.player.body.x - this.rival.body.x,
        this.player.body.y - this.rival.body.y,
      ).normalize();
      this.rivalFire(direction);
    }

    this.rival.body.setAlpha(rivalHidden ? 0.28 : this.rival.downed ? 0.68 : 1);
    const name = this.rival.body.getData('nameLabel') as Phaser.GameObjects.Text | undefined;
    name?.setAlpha(rivalHidden ? 0.18 : this.rival.downed ? 0.5 : 1);
  }

  private updatePlayerRefill(delta: number) {
    if (this.trainingMode) return;
    if (this.player.downed || this.player.weaponDropped || this.player.ammo >= this.player.maxAmmo) {
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
    if (this.trainingMode) return;
    if (this.rival.downed || this.rival.weaponDropped) return;

    const station = this.rivalSeekingAmmo
      ? this.rivalAmmoStation
      : this.getNearestAmmoStation(this.rival.body.x, this.rival.body.y);
    const stationCenterX = station.centerX;
    const stationCenterY = station.centerY;
    const dx = stationCenterX - this.rival.body.x;
    const dy = stationCenterY - this.rival.body.y;
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
      this.rivalSeekingAmmo = false;
      this.rivalDecisionAt = Date.now() + Phaser.Math.Between(700, 1200);
    }
  }

  private chooseSaferAmmoStation(excludeX?: number, excludeY?: number) {
    const playerX = this.player.body.x;
    const playerY = this.player.body.y;
    const candidates = ARENA_AMMO_STATIONS.filter((station) =>
      excludeX === undefined ||
      Phaser.Math.Distance.Between(station.centerX, station.centerY, excludeX, excludeY ?? 0) > 1
    );

    const scored = (candidates.length ? candidates : ARENA_AMMO_STATIONS).map((station) => {
      const rivalDistance = Phaser.Math.Distance.Between(
        this.rival.body.x, this.rival.body.y, station.centerX, station.centerY,
      );
      const playerDistance = Phaser.Math.Distance.Between(
        playerX, playerY, station.centerX, station.centerY,
      );
      const playerCanSeeStation = this.hasLineOfSight(
        playerX, playerY, station.centerX, station.centerY,
      );
      const danger = playerDistance < 320 ? 520 : playerDistance < 520 ? 220 : 0;
      const exposed = playerCanSeeStation ? 150 : 0;
      return { station, score: rivalDistance + danger + exposed };
    }).sort((a, b) => a.score - b.score);

    return scored[0].station;
  }

  private shouldRivalFire(distance: number, now: number) {
    if (this.rival.ammo <= 7) return false;

    // If the player is actively spending paint, the rival deliberately stops
    // feeding the exchange. This creates the counter-play: the player can no
    // longer bait an endless bot spray and then punish its forced reload.
    const playerRecentlyFired = now - this.playerLastFiredAt < 700;
    const playerNearlyEmpty = this.player.ammo <= 5;
    if (playerNearlyEmpty) return false;
    if (playerRecentlyFired && this.player.ammo <= 10) return Math.random() < 0.18;

    let chance = distance < 260 ? 0.72 : distance < 430 ? 0.48 : 0.28;
    if (this.rival.ammo <= 12) chance *= 0.68;
    if (this.rival.ammo <= 9) chance *= 0.55;

    return Math.random() < chance;
  }

  private rivalRefillProgressReset() {
    this.rival.refilling = false;
    this.rival.refillElapsed = 0;
  }

  private isRivalConcealed() {
    if (this.trainingMode) return false;
    if (this.rival.downed || this.rival.weaponDropped) return false;
    if (Date.now() < this.rivalRevealedUntil) return false;
    if (Date.now() - this.rivalLastFiredAt < ARENA_STEALTH_BREAK_MS) return false;
    return this.inConcealment(this.rival.body.x, this.rival.body.y);
  }

  private inConcealment(_x: number, _y: number, _padding = 0) {
    return false;
  }

  private chooseHiddenPatrolPoint() {
    const center = this.rivalHiddenPatrolCenter;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const radius = Phaser.Math.Between(210, 420);
      const candidateX = Phaser.Math.Clamp(center.x + Math.cos(angle) * radius, 110, 2290);
      const candidateY = Phaser.Math.Clamp(center.y + Math.sin(angle) * radius, 130, 1270);
      if (this.inCover(candidateX, candidateY, 14)) continue;
      if (this.inConcealment(candidateX, candidateY, 28)) continue;
      this.rivalTargetPoint.set(candidateX, candidateY);
      return;
    }

    // Deterministic fallback: leave the centre area rather than selecting a
    // tree/stealth zone just because the random sample was unlucky.
    const away = new Phaser.Math.Vector2(
      this.rival.body.x - center.x,
      this.rival.body.y - center.y,
    );
    if (away.lengthSq() < 1) away.set(1, 0);
    away.normalize();
    this.rivalTargetPoint.set(
      Phaser.Math.Clamp(center.x + away.x * 320, 110, 2290),
      Phaser.Math.Clamp(center.y + away.y * 320, 130, 1270),
    );
  }

  private chooseHiddenRegroupPoint() {
    const center = this.playerLastKnown;
    const candidates = [
      new Phaser.Math.Vector2(1180, 160),
      new Phaser.Math.Vector2(1180, 1240),
      new Phaser.Math.Vector2(520, 240),
      new Phaser.Math.Vector2(1840, 240),
      new Phaser.Math.Vector2(520, 1160),
      new Phaser.Math.Vector2(1840, 1160),
    ];

    const safe = candidates.filter((point) =>
      !this.inCover(point.x, point.y, 20) &&
      !this.inConcealment(point.x, point.y, 24)
    );

    const choices = safe.length ? safe : candidates;
    choices.sort(
      (a, b) =>
        Phaser.Math.Distance.Between(b.x, b.y, center.x, center.y) -
        Phaser.Math.Distance.Between(a.x, a.y, center.x, center.y),
    );

    this.rivalTargetPoint.copy(choices[0]);
  }

  private findRivalConcealment() {
    return this.concealments.map((zone) => ({ zone, distance: Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, zone.x, zone.y) }))
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
    if (!this.isFireAvailable() || this.player.weaponDropped || this.player.refilling || this.player.cooldown > 0) return;
    this.player.cooldown = this.trainingMode
      ? Math.max(240, 330 - this.playerSkill * 1)
      : ARENA_NEUTRAL_BASELINE ? ARENA_BASE_COOLDOWN : Math.max(130, 330 - this.playerSkill * 1.15);
    if (!this.trainingMode) this.player.ammo -= 1;
    this.playerShotsFired += 1;
    this.playerLastFiredAt = Date.now();
    this.playerRevealedUntil = Number.POSITIVE_INFINITY;
    // The fire control is also the aim control. When the player has not
    // explicitly dragged the aim, resolve the direction from the live target
    // at the exact moment of the shot. This keeps Shooting symmetrical with
    // the rival's live-direction fire and prevents a stale aim vector from
    // sending otherwise valid paintballs past a moving target.
    const shotAim = this.aim.clone();
    if (!this.manualAim && this.rival && !this.rival.downed) {
      const dx = this.rival.body.x - this.player.body.x;
      const dy = this.rival.body.y - this.player.body.y;
      const distance = Math.hypot(dx, dy);
      if (
        distance > 1 &&
        distance <= this.getPlayerAimRange() &&
        this.hasLineOfSight(this.player.body.x, this.player.body.y, this.rival.body.x, this.rival.body.y)
      ) {
        shotAim.set(dx / distance, dy / distance);
        this.aim.copy(shotAim);
      }
    }
    this.flashMuzzle(this.playerMuzzle);
    this.spawnShot(
      this.player.body.x + shotAim.x * 42,
      this.player.body.y + shotAim.y * 42,
      shotAim,
      'player',
    );
  }

  private rivalFire(direction: Phaser.Math.Vector2, engagementDistance = Number.POSITIVE_INFINITY) {
    const accuracy = this.rivalProfile.shooting;
    const aim = direction.clone().normalize();
    const trainingCooldown = engagementDistance <= TRAINING_CQE_RANGE
      ? TRAINING_CQE_COOLDOWN
      : Math.max(240, 300 - accuracy * 0.8);
    this.rival.cooldown = this.trainingMode ? trainingCooldown : ARENA_NEUTRAL_BASELINE ? ARENA_BASE_COOLDOWN : Math.max(330, 930 - accuracy * 5.4);
    if (!this.trainingMode) this.rival.ammo -= 1;
    this.rivalShotsFired += 1;
    this.rivalLastFiredAt = Date.now();
    this.rivalRevealedUntil = Number.POSITIVE_INFINITY;
    this.flashMuzzle(this.rivalMuzzle);
    this.spawnShot(
      this.rival.body.x + aim.x * 42,
      this.rival.body.y + aim.y * 42,
      aim,
      'rival',
    );
  }

  private getPlayerAimRange() {
    return ARENA_NEUTRAL_BASELINE ? ARENA_BASE_AIM_RANGE : clamp(620 + this.playerSkill * 2, 600, 840);
  }

  private getRivalFireRange() {
    return ARENA_NEUTRAL_BASELINE ? ARENA_BASE_RIVAL_FIRE_RANGE : clamp(560 + this.rivalProfile.shooting * 3.2, 600, 880);
  }


  private flashMuzzle(muzzle: Phaser.GameObjects.Graphics) {
    muzzle.setVisible(true).setAlpha(1).setScale(1.9);
    this.tweens.killTweensOf(muzzle);
    this.tweens.add({ targets: muzzle, alpha: 0.2, scale: 1, duration: 90, ease: 'Quad.easeOut' });
  }

  private spawnShot(
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    owner: 'player' | 'rival',
  ) {
    // Same proven projectile as Shooting Range: a discrete, visible paintball.
    const ball = this.add.circle(x, y, 4, 0xe44f3d).setDepth(50);
    this.shots.push({
      body: ball,
      vx: direction.x * (this.trainingMode ? TRAINING_PROJECTILE_SPEED : 520),
      vy: direction.y * (this.trainingMode ? TRAINING_PROJECTILE_SPEED : 520),
      owner,
      ttl: 1100,
      ageMs: 0,
      impactHoldMs: 0,
    });
  }

  private updateShots(delta: number) {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const shot = this.shots[i];
      shot.ageMs += delta;
      shot.ttl -= delta;

      if (shot.impactHoldMs > 0) {
        shot.impactHoldMs = Math.max(0, shot.impactHoldMs - delta);
        if (shot.impactHoldMs <= 0) {
          shot.body.destroy();
          this.shots.splice(i, 1);
        }
        continue;
      }

      // Paintballs are fast enough that checking only their new position can
      // tunnel through a fighter between frames. Sweep the whole movement
      // segment so close-range hits are reliable instead of depending on the
      // player walking into the projectile at exactly the right frame.
      const startX = shot.body.x;
      const startY = shot.body.y;
      const nextX = startX + shot.vx * delta / 1000;
      const nextY = startY + shot.vy * delta / 1000;
      const shotLine = new Phaser.Geom.Line(startX, startY, nextX, nextY);
      shot.body.setPosition(nextX, nextY);

      if (
        shot.ttl <= 0 ||
        nextX < 0 ||
        nextX > 2400 ||
        nextY < 0 ||
        nextY > 1400
      ) {
        if (shot.owner === 'player') this.playerMisses += 1;
        else this.rivalMisses += 1;
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }

      const target = shot.owner === 'player' ? this.rival : this.player;
      if (target.downed) {
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }

      const targetHeadCenter = new Phaser.Math.Vector2(target.body.x, target.body.y - 25);
      const targetBodyCenter = new Phaser.Math.Vector2(target.body.x, target.body.y + 1);
      // Training uses the same physical hit geometry as Arena. The projectile
      // segment is authoritative, but close range never enlarges the clean-hit
      // volume and never converts proximity into a hit.
      const weaponHit = null;
      const headHit = this.getSegmentCircleHit(
        shotLine,
        targetHeadCenter.x,
        targetHeadCenter.y,
        20,
      );
      const bodyHit = this.getSegmentCircleHit(
        shotLine,
        targetBodyCenter.x,
        targetBodyCenter.y,
        ARENA_BODY_CORE_RADIUS,
      );
      const headScrapeHit = this.getSegmentCircleHit(
        shotLine,
        targetHeadCenter.x,
        targetHeadCenter.y,
        ARENA_SCRAPE_RADIUS,
      );
      const bodyScrapeHit = this.getSegmentCircleHit(
        shotLine,
        targetBodyCenter.x,
        targetBodyCenter.y,
        ARENA_SCRAPE_RADIUS,
      );
      const scrapeHit = [headScrapeHit, bodyScrapeHit]
        .filter(Boolean)
        .sort((a, b) => a!.distance - b!.distance)[0] ?? null;

      const cleanHits = [
        weaponHit ? { kind: 'weapon' as const, hit: weaponHit } : null,
        headHit ? { kind: 'head' as const, hit: headHit } : null,
        bodyHit ? { kind: 'body' as const, hit: bodyHit } : null,
      ].filter(Boolean) as Array<{ kind: 'weapon' | 'head' | 'body'; hit: { x: number; y: number; distance: number } }>;
      cleanHits.sort((a, b) => a.hit.distance - b.hit.distance);

      const coverDistance = this.getFirstCoverIntersectionDistance(shotLine);
      const cleanHit = cleanHits[0];
      if (cleanHit && (coverDistance === null || cleanHit.hit.distance <= coverDistance)) {
        if (cleanHit.kind === 'weapon') {
          this.resolveWeaponHit(shot.owner, target, cleanHit.hit.x, cleanHit.hit.y);
        } else {
          this.resolveHit(
            shot.owner,
            cleanHit.kind === 'head',
            cleanHit.hit.x,
            cleanHit.hit.y,
          );
        }

        // resolveHit / resolveWeaponHit can end a training life and clear the
        // entire projectile array. updateShots is iterating that same array, so
        // continuing here would make the next loop iteration read an undefined
        // shot and kill the Phaser update step. Exit this frame and let the next
        // frame start cleanly after the respawn lifecycle.
        if (!this.shots.includes(shot) || !shot.body.active || this.matchOver || this.roundTransition || this.resolvingRound) {
          return;
        }
        this.holdShotAtImpact(shot, cleanHit.hit.x, cleanHit.hit.y);
        if (shot.impactHoldMs <= 0) {
          shot.body.destroy();
          this.shots.splice(i, 1);
        }
        continue;
      }

      // A cover intersection before the target is a real blocked shot.
      if (coverDistance !== null && (!cleanHit || coverDistance < cleanHit.hit.distance)) {
        if (this.trainingMode && this.trainingStage === 'EVASION' && shot.owner === 'rival') this.trainingCoverBlocks += 1;
        if (shot.owner === 'player') this.playerMisses += 1;
        else this.rivalMisses += 1;
        shot.body.destroy();
        this.shots.splice(i, 1);
        continue;
      }

      if (scrapeHit) {
        this.recordScrape(shot.owner, scrapeHit.x, scrapeHit.y);
        this.holdShotAtImpact(shot, scrapeHit.x, scrapeHit.y);
        if (shot.impactHoldMs <= 0) {
          shot.body.destroy();
          this.shots.splice(i, 1);
        }
        continue;
      }

      // No collision: continue the paintball until TTL/range expires.
    }
  }

  private getTrainingRivalAim(distance: number) {
    const dx = this.player.body.x - this.rival.body.x;
    const dy = this.player.body.y - this.rival.body.y;
    const direct = new Phaser.Math.Vector2(dx, dy).normalize();
    if (distance > TRAINING_CQE_RANGE || !this.playerMoving) return direct;

    const movement = new Phaser.Math.Vector2(this.joystickVector.x, this.joystickVector.y);
    if (movement.lengthSq() < 0.01) return direct;
    movement.normalize();

    // Paintball flight time is short at CQE range. A bounded lead keeps the
    // shot on the player's actual movement line without turning the bot into
    // a hitscan/auto-hit system.
    const flightTime = clamp(distance / TRAINING_PROJECTILE_SPEED, 0.05, 0.18);
    const lead = this.player.speed * flightTime * 0.82;
    const predictedX = this.player.body.x + movement.x * lead;
    const predictedY = this.player.body.y + movement.y * lead;
    return new Phaser.Math.Vector2(
      predictedX - this.rival.body.x,
      predictedY - this.rival.body.y,
    ).normalize();
  }

  private getSegmentCircleHit(
    line: Phaser.Geom.Line,
    centerX: number,
    centerY: number,
    radius: number,
  ) {
    const nearest = new Phaser.Math.Vector2();
    const circle = new Phaser.Geom.Circle(centerX, centerY, radius);
    if (!Phaser.Geom.Intersects.LineToCircle(line, circle, nearest)) return null;
    return {
      x: nearest.x,
      y: nearest.y,
      distance: Phaser.Math.Distance.Between(line.x1, line.y1, nearest.x, nearest.y),
    };
  }

  private getFirstCoverIntersectionDistance(line: Phaser.Geom.Line) {
    let nearest = Number.POSITIVE_INFINITY;
    for (const cover of this.covers) {
      const intersections = Phaser.Geom.Intersects.GetLineToRectangle(line, cover);
      for (const point of intersections) {
        const distance = Phaser.Math.Distance.Between(line.x1, line.y1, point.x, point.y);
        nearest = Math.min(nearest, distance);
      }
      if (cover.contains(line.x1, line.y1)) nearest = 0;
    }
    return Number.isFinite(nearest) ? nearest : null;
  }

  private holdShotAtImpact(shot: Shot, x: number, y: number) {
    const visibleRemaining = Math.max(0, ARENA_PROJECTILE_MIN_VISIBLE_MS - shot.ageMs);
    if (visibleRemaining <= 0) return;
    shot.body.setPosition(x, y);
    shot.vx = 0;
    shot.vy = 0;
    shot.impactHoldMs = visibleRemaining;
  }

  private getWeaponPoint(target: Fighter) {
    const aim = target === this.player ? this.aim : new Phaser.Math.Vector2(this.player.body.x - target.body.x, this.player.body.y - target.body.y).normalize();
    return new Phaser.Math.Vector2(target.body.x + aim.x * 27, target.body.y + aim.y * 27 + 4);
  }

  private resolveWeaponHit(owner: 'player' | 'rival', target: Fighter, hitX: number, hitY: number) {
    if (this.matchOver || this.roundTransition || this.resolvingRound || target.weaponDropped || target.downed) return;
    const knockoutChance = this.getWeaponKnockoutChance(owner);
    if (Math.random() > knockoutChance) {
      this.recordScrape(owner, hitX, hitY);
      return;
    }
    if (owner === 'player') this.playerWeaponKnockouts += 1;
    else this.rivalWeaponKnockouts += 1;
    this.addSplatter(hitX, hitY, 0.7);
    this.showCombatHighlight(owner === 'player' ? 'GUN HIT · GUN DOWN' : 'YOUR GUN IS DOWN', '#e8c95c', hitX, hitY, 0.95);
    this.dropWeapon(target);
    this.statusHud?.setText(target === this.player ? 'GUN DOWN  ·  RECOVER OR REPOSITION' : 'RIVAL GUN DOWN  ·  PRESS THE RECOVERY');
  }

  private getWeaponKnockoutChance(owner: 'player' | 'rival') {
    const edge = this.trainingEdge.shooting;
    const ownerHasEdge = (owner === 'player' && edge === 'PLAYER') || (owner === 'rival' && edge === 'BOT');
    const ownerHasDisadvantage = (owner === 'player' && edge === 'BOT') || (owner === 'rival' && edge === 'PLAYER');
    return clamp(0.50 + (ownerHasEdge ? 0.14 : 0) - (ownerHasDisadvantage ? 0.14 : 0), 0.34, 0.66);
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
    // Training role rules are strict: the unarmed participant cannot
    // accidentally pick up the hidden placeholder weapon at spawn.
    if (
      this.trainingMode &&
      ((target === this.player && this.trainingStage === 'EVASION') ||
       (target === this.rival && this.trainingStage === 'SHOOTING'))
    ) return;
    if (!target.weaponDropped || target.downed) return;
    const distance = Phaser.Math.Distance.Between(target.body.x, target.body.y, target.droppedWeapon.x, target.droppedWeapon.y);
    if (distance <= 54) this.pickupWeapon(target);
  }

  private resolveHit(
    owner: 'player' | 'rival',
    headshot: boolean,
    hitX?: number,
    hitY?: number,
  ) {
    if (!this.scene.isActive() || this.matchOver || this.roundTransition || this.resolvingRound) return;
    const target = owner === 'player' ? this.rival : this.player;
    if (!target?.body?.active || target.downed) return;
    const shooter = owner === 'player' ? this.player : this.rival;
    this.resolvingRound = true;
    const x = hitX ?? target.body.x;
    const y = hitY ?? target.body.y;
    const engagementDistance = Phaser.Math.Distance.Between(
      shooter.body.x,
      shooter.body.y,
      target.body.x,
      target.body.y,
    );
    const closeImpact = engagementDistance <= TRAINING_CLOSE_IMPACT_RANGE;

    if (owner === 'player') {
      if (headshot) this.playerHeadshots += 1;
      else this.playerBodyHits += 1;
      if (closeImpact) this.playerCloseHits += 1;
      this.playerPaintHits += 1;
    } else if (headshot) {
      this.rivalHeadshots += 1;
      this.rivalPaintHits += 1;
    } else {
      this.rivalBodyHits += 1;
      this.rivalPaintHits += 1;
    }

    this.addSplatter(x, y, headshot ? 1.25 : closeImpact ? 1.18 : 1);
    this.showCombatHighlight(
      owner === 'player'
        ? (headshot ? 'HEADSHOT!' : closeImpact ? 'CLOSE PAINT HIT · IMPACT' : 'PAINT HIT')
        : (headshot ? 'HEADSHOT ON YOU' : closeImpact ? 'CLOSE PAINT HIT ON YOU' : 'PAINT HIT ON YOU'),
      headshot ? '#e8c95c' : '#d66a3d',
      x,
      y,
      headshot ? 1.12 : closeImpact ? 1.08 : 1,
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
      this.resolvingRound = false;
      return;
    }

    // Arena body damage is exactly two clean body hits.
    // Headshots remain instant eliminations. Scrapes never reduce HP.
    target.hp = Math.max(0, target.hp - 1);
    if (owner === 'player') this.roundHits += 1;
    else this.roundRivalHits += 1;

    this.flash(target, false);
    if (target.hp <= 0) {
      this.showCombatHighlight(
        owner === 'player'
          ? (target.weaponDropped ? 'GUN DOWN + FINISH' : 'ELIMINATED')
          : (target.weaponDropped ? 'GUN DOWN + FINISH ON YOU' : 'ELIMINATED'),
        '#d66a3d',
        x,
        y,
        1.05,
      );
      this.eliminateFighter(target, owner);
      this.roundPoint(owner);
    } else {
      this.markFighterWounded(target);
    }
    this.resolvingRound = false;
  }

  private recordScrape(owner: 'player' | 'rival', x: number, y: number) {
    if (owner === 'player') this.playerScrapes += 1;
    else this.rivalScrapes += 1;
    this.addSplatter(x, y, 0.38);
    this.showCombatHighlight(owner === 'player' ? 'SCRAPE' : 'SCRAPE ON YOU', '#9fbda8', x, y, 0.72);
  }

  private addSplatter(x: number, y: number, scale = 1) {
    const splat = this.add.graphics();
    splat.setDepth(12);
    splat.x = x;
    splat.y = y;
    const colors = [0xd66a3d, 0xb94d36, 0xe08a54];
    const base = 7 * scale;
    splat.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.86);
    splat.fillCircle(0, 0, base);
    const drops = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < drops; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = base * (1.4 + Math.random() * 2.5);
      const radius = base * (0.16 + Math.random() * 0.28);
      splat.fillCircle(Math.cos(angle) * distance, Math.sin(angle) * distance, radius);
    }
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
    target.ammo = Number.POSITIVE_INFINITY;
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
    if (this.trainingMode) {
      this.fire = false;
      this.clearShots();
      const eliminated = winner === 'player' ? this.rival : this.player;
      const isPlayer = eliminated === this.player;
      if (this.trainingStage === 'EVASION' && isPlayer) {
        this.recordCurrentEvasionLife();
        this.trainingEvasionEliminations += 1;
      }
      if (this.trainingStage === 'SHOOTING' && !isPlayer) {
        this.recordCurrentShootingBotLife();
        this.trainingShootingBotEliminations += 1;
      }
      // Do not depend on the Phaser update loop to perform the reset. A hit can
      // occur during projectile resolution, and any lifecycle guard raised in
      // that same frame can otherwise make the downed state look like a freeze.
      this.scheduleTrainingRespawn();
      return;
    }
  }

  private scheduleTrainingRespawn() {
    this.trainingRespawnAt = Date.now() + 220;
    if (this.trainingRespawnTimer) window.clearTimeout(this.trainingRespawnTimer);

    // Use both Phaser's clock and a browser timer. Either path can recover the
    // drill; finishTrainingRespawn() is idempotent so the two paths cannot
    // double-respawn the fighters.
    this.time.delayedCall(220, () => {
      if (this.trainingRespawnAt > 0 && this.scene.isActive() && !this.paused) {
        this.finishTrainingRespawn();
      }
    });

    this.trainingRespawnTimer = window.setTimeout(() => {
      this.trainingRespawnTimer = undefined;
      if (this.trainingRespawnAt > 0 && this.scene.isActive() && !this.paused) {
        this.finishTrainingRespawn();
      }
    }, 260);
  }

  private finishTrainingRespawn() {
    if (this.trainingRespawnAt <= 0) {
      if (!this.trainingMode || this.trainingDone || this.paused || this.trainingStage === 'BREAK') return;
      if (!this.player.downed && !this.rival.downed) return;
    }
    if (this.trainingRespawnTimer) window.clearTimeout(this.trainingRespawnTimer);
    this.trainingRespawnTimer = undefined;
    this.trainingRespawnAt = 0;
    this.clearSplatter();

    const playerDown = this.player.downed;
    const rivalDown = this.rival.downed;

    if (playerDown) {
      this.resetTrainingCombatant(this.player, this.trainingStage === 'SHOOTING');
      this.player.body.setPosition(TRAINING_PLAYER_SPAWN.x, TRAINING_PLAYER_SPAWN.y);
      if (this.trainingStage === 'EVASION') this.trainingEvasionLifeStartedAt = Date.now();
    }

    if (rivalDown) {
      this.resetTrainingCombatant(this.rival, this.trainingStage === 'EVASION');
      this.rival.body.setPosition(TRAINING_RIVAL_SPAWN.x, TRAINING_RIVAL_SPAWN.y);
      if (this.trainingStage === 'SHOOTING') this.trainingShootingBotLifeStartedAt = Date.now();
    }

    // If the surviving fighter chased the eliminated fighter all the way to
    // its spawn, resetting only the downed side can create an immediate
    // point-blank re-engagement. Put the survivor back at its own side before
    // combat resumes so a respawn is always a clean new engagement.
    const trainingRespawnDistance = Phaser.Math.Distance.Between(
      this.player.body.x,
      this.player.body.y,
      this.rival.body.x,
      this.rival.body.y,
    );
    if (trainingRespawnDistance < 420) {
      if (playerDown && !rivalDown) {
        this.rival.body.setPosition(TRAINING_RIVAL_SPAWN.x, TRAINING_RIVAL_SPAWN.y);
      } else if (rivalDown && !playerDown) {
        this.player.body.setPosition(TRAINING_PLAYER_SPAWN.x, TRAINING_PLAYER_SPAWN.y);
      }
    }

    this.player.cooldown = 350;
    this.rival.cooldown = 350;
    this.rivalRevealedUntil = Date.now() + 350;
    this.statusHud?.setText(
      playerDown ? 'TAGGED · RESET · KEEP MOVING' : 'TARGET DOWN · RESET · KEEP ENGAGING',
    );
  }

  private recordCurrentEvasionLife() {
    if (this.trainingStage !== 'EVASION' || this.trainingEvasionLifeStartedAt <= 0) return;
    const elapsed = Math.max(0, Date.now() - this.trainingEvasionLifeStartedAt);
    // Use the longest clean life as the survival signal. Summing every life
    // would always approach the full 30 seconds because respawns keep the drill
    // running, which would hide repeated deaths instead of measuring them.
    this.trainingEvasionSurvivalMs = Math.max(this.trainingEvasionSurvivalMs, elapsed);
    this.trainingEvasionLifeStartedAt = Date.now();
  }

  private recordCurrentShootingBotLife() {
    if (this.trainingStage !== 'SHOOTING' || this.trainingShootingBotLifeStartedAt <= 0) return;
    const elapsed = Math.max(0, Date.now() - this.trainingShootingBotLifeStartedAt);
    // Same principle for the bot: best uninterrupted life, while eliminations
    // remain a separate penalty in the bot-evasion score.
    this.trainingShootingBotSurvivalMs = Math.max(this.trainingShootingBotSurvivalMs, elapsed);
    this.trainingShootingBotLifeStartedAt = Date.now();
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
          mode: 'PREPARED',
          trainingEdge: this.trainingEdge,
          completedAt,
          durationMs: Math.max(0, completedAt - this.arenaStartedAt),
          budgetEarned: reward,
        }),
      );
    } catch {}
    completeShootersTriggerSession(
      won
        ? 'ARENA WIN · RESULTS SAVED · BUDGET ADDED · FIELD PHONE UPDATED'
        : 'ARENA COMPLETE · RESULTS SAVED · FIELD PHONE UPDATED',
    );

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
      '<br>TRAINING EDGE · ' + this.trainingEdge.overall + ' · ODDS ONLY' +
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
      this.locatorDistance?.remove();
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

  private updateTrainingCamera(delta: number) {
    if (!this.trainingCameraFocus || !this.player || !this.rival) return;
    const px = this.player.body.x, py = this.player.body.y;
    const rx = this.rival.body.x, ry = this.rival.body.y;
    const dx = rx - px, dy = ry - py;
    const distance = Phaser.Math.Distance.Between(px, py, rx, ry);
    // Shooting is player-aimed: anchor the frame near the player so movement
    // and aim remain legible on phones. Give the target a capped directional
    // lead, rather than centering the midpoint (which can drag the camera
    // toward a fleeing bot and leave the player disoriented/off-center).
    const lead = Math.min(210, distance * 0.28);
    const leadX = distance > 1 ? (dx / distance) * lead : 0;
    const leadY = distance > 1 ? (dy / distance) * lead : 0;
    const shooting = this.trainingStage === 'SHOOTING';
    const focusX = shooting ? px + leadX : (px + rx) * 0.5;
    const focusY = shooting ? py + leadY : (py + ry) * 0.5;
    this.trainingCameraFocus.setPosition(focusX, focusY - 55);
    // Keep zoom changes gradual and avoid extreme zoom-out when the bot runs
    // far away; the on-screen locator remains available for targets off-frame.
    const targetZoom = shooting
      ? Phaser.Math.Clamp(900 / Math.max(850, distance + 180), 0.72, 0.9)
      : Phaser.Math.Clamp(1000 / Math.max(750, distance + 250), 0.62, 0.88);
    const smoothing = 1 - Math.pow(0.001, delta / 1000);
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, smoothing));
  }

  private createHud() {
    // Training already keeps both fighters in the camera. A radar and a second
    // role/ammo banner only compete with the combat view on a phone, so the
    // training HUD is intentionally reduced to one compact stage/timer readout.
    this.scoreHud = this.add.text(this.scale.width / 2, 14, 'EVASION · 30.0s', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#f4f1df',
      backgroundColor: 'rgba(16,32,24,.70)', padding: { left: 9, right: 9, top: 5, bottom: 5 },
    }).setOrigin(.5, 0).setScrollFactor(0).setDepth(90);
    this.ammoHud = undefined;
  }

  private updateHud() {
    const remaining = Math.max(0, TRAINING_STAGE_MS - (Date.now() - this.trainingStartedAt));
    const stageLabel = this.trainingStage === 'EVASION' ? 'EVASION' : 'SHOOTING';
    this.scoreHud?.setText(stageLabel + ' · ' + (remaining / 1000).toFixed(1) + 's');
  }

  private createPauseButton() {
    const button = document.createElement('button');
    button.textContent = 'Ⅱ';
    button.setAttribute('aria-label', 'Pause training');
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
    this.locatorDistance?.remove();

    // The radar is deliberately player-centred: people understand relative
    // position faster when the player stays fixed and the rival moves around
    // them. Concentric rings make the numeric distance meaningful rather than
    // leaving the player to decode a compressed full-field map.
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed',
      top: 'calc(60px + env(safe-area-inset-top, 0px))',
      right: 'max(10px, env(safe-area-inset-right, 0px))',
      width: '132px',
      height: '132px',
      padding: '5px',
      boxSizing: 'border-box',
      border: '1px solid rgba(244,241,223,.58)',
      borderRadius: '12px',
      background: 'rgba(16,32,24,.88)',
      zIndex: '1440',
      pointerEvents: 'none',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.26)',
    });

    const title = document.createElement('div');
    Object.assign(title.style, {
      position: 'absolute',
      left: '8px',
      top: '6px',
      right: '8px',
      color: '#f4f1df',
      font: '800 8px/1 monospace',
      letterSpacing: '.7px',
      textAlign: 'center',
      opacity: '.88',
      zIndex: '2',
    });
    title.textContent = 'RIVAL RADAR';
    panel.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    canvas.style.width = '120px';
    canvas.style.height = '120px';
    canvas.setAttribute('aria-label', 'Rival direction and distance radar');
    panel.appendChild(canvas);

    const arrow = document.createElement('div');
    Object.assign(arrow.style, {
      position: 'fixed',
      width: '0',
      height: '0',
      borderLeft: '9px solid transparent',
      borderRight: '9px solid transparent',
      borderBottom: '18px solid #e44f3d',
      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.45))',
      zIndex: '1445',
      pointerEvents: 'none',
      transformOrigin: '50% 100%',
      display: 'none',
    });

    const distance = document.createElement('div');
    Object.assign(distance.style, {
      position: 'fixed',
      minWidth: '74px',
      padding: '5px 7px',
      boxSizing: 'border-box',
      borderRadius: '7px',
      background: 'rgba(155,63,63,.96)',
      border: '1px solid #fff4d4',
      color: '#fff4d4',
      font: '800 9px/1 monospace',
      letterSpacing: '.3px',
      textAlign: 'center',
      zIndex: '1446',
      pointerEvents: 'none',
      display: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,.24)',
    });

    document.body.appendChild(panel);
    document.body.appendChild(arrow);
    document.body.appendChild(distance);
    this.locatorPanel = panel;
    this.locatorCanvas = canvas;
    this.locatorCtx = canvas.getContext('2d');
    this.locatorArrow = arrow;
    this.locatorDistance = distance;
    this.updateEnemyLocator();
  }

  private updateEnemyLocator() {
    const ctx = this.locatorCtx;
    const canvas = this.locatorCanvas;
    if (!ctx || !canvas || !this.player || !this.rival) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const radarCx = w / 2;
    const radarCy = h / 2 + 5;
    const radarRadius = 47;
    const maxRadarDistance = 720;

    // Player-centred tactical map: keep the useful physical field objects from
    // the old map, while making the rival direction much easier to read.
    ctx.fillStyle = '#263c2a';
    ctx.fillRect(0, 0, w, h);

    // Range is intentionally a simple 1–4 field scale, not metres.
    ctx.strokeStyle = 'rgba(244,241,223,.18)';
    ctx.lineWidth = 1;
    for (const level of [1, 2, 3, 4]) {
      const radius = radarRadius * (level / 4);
      ctx.beginPath();
      ctx.arc(radarCx, radarCy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(244,241,223,.10)';
    ctx.beginPath();
    ctx.moveTo(radarCx - radarRadius, radarCy);
    ctx.lineTo(radarCx + radarRadius, radarCy);
    ctx.moveTo(radarCx, radarCy - radarRadius);
    ctx.lineTo(radarCx, radarCy + radarRadius);
    ctx.stroke();

    const drawWorldPoint = (
      x: number,
      y: number,
      style: 'cover' | 'ammo' | 'hide',
      size = 3,
    ) => {
      const dx = x - this.player.body.x;
      const dy = y - this.player.body.y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxRadarDistance) return;
      const scale = distance / maxRadarDistance;
      const px = radarCx + (dx / Math.max(1, distance)) * radarRadius * scale;
      const py = radarCy + (dy / Math.max(1, distance)) * radarRadius * scale;

      if (style === 'cover') {
        ctx.fillStyle = 'rgba(181,140,88,.9)';
        ctx.fillRect(px - size * 1.8, py - size * .8, size * 3.6, size * 1.6);
      } else if (style === 'ammo') {
        ctx.fillStyle = '#e8c95c';
        ctx.fillRect(px - size, py - size, size * 2, size * 2);
        ctx.strokeStyle = 'rgba(244,241,223,.85)';
        ctx.strokeRect(px - size - 1, py - size - 1, size * 2 + 2, size * 2 + 2);
      } else {
        ctx.strokeStyle = '#9fbda8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, size + 1, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    for (const cover of this.covers) {
      drawWorldPoint(cover.x + cover.width / 2, cover.y + cover.height / 2, 'cover', 3);
    }
    const distanceValue = Phaser.Math.Distance.Between(
      this.player.body.x,
      this.player.body.y,
      this.rival.body.x,
      this.rival.body.y,
    );

    const concealed = false;
    const dx = this.rival.body.x - this.player.body.x;
    const dy = this.rival.body.y - this.player.body.y;
    const length = Math.hypot(dx, dy) || 1;
    const clampedDistance = Math.min(distanceValue, maxRadarDistance);
    const rivalX = radarCx + (dx / length) * radarRadius * (clampedDistance / maxRadarDistance);
    const rivalY = radarCy + (dy / length) * radarRadius * (clampedDistance / maxRadarDistance);

    // Player = white. Rival = red. Field objects stay visually secondary.
    ctx.fillStyle = '#f4f1df';
    ctx.beginPath();
    ctx.moveTo(radarCx, radarCy - 6);
    ctx.lineTo(radarCx + 5, radarCy + 5);
    ctx.lineTo(radarCx, radarCy + 2);
    ctx.lineTo(radarCx - 5, radarCy + 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e44f3d';
    ctx.beginPath();
    ctx.arc(rivalX, rivalY, 5, 0, Math.PI * 2);
    ctx.fill();

    if (!concealed) {
      ctx.strokeStyle = 'rgba(228,79,61,.72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rivalX, rivalY, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#f4f1df';
    ctx.font = '700 7px monospace';
    ctx.textAlign = 'left';
    for (const level of [1, 2, 3, 4]) {
      const radius = radarRadius * (level / 4);
      ctx.fillText(String(level), radarCx + radius + 2, radarCy - 2);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4f1df';
    ctx.font = '800 8px monospace';
    const distanceLevel = Math.max(1, Math.min(4, Math.ceil(distanceValue / (maxRadarDistance / 4))));
    ctx.fillText('RANGE ' + distanceLevel, radarCx, h - 4);

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

    const arrow = this.locatorArrow;
    const distanceLabel = this.locatorDistance;
    if (!arrow || !distanceLabel) return;

    if (onScreen) {
      arrow.style.display = 'none';
      distanceLabel.style.display = 'none';
      return;
    }

    const centerX = viewLeft + camera.width / 2;
    const centerY = viewTop + camera.height / 2;
    const directionAngle = Math.atan2(dy, dx);
    const scale = 1 / Math.max(
      Math.abs(dx) / Math.max(1, camera.width / 2 - 34),
      Math.abs(dy) / Math.max(1, camera.height / 2 - 34),
      1,
    );
    const edgeX = camera.width / 2 + dx * scale;
    const edgeY = camera.height / 2 + dy * scale;
    const screenX = Math.max(20, Math.min(window.innerWidth - 20, edgeX));
    const screenY = Math.max(88, Math.min(window.innerHeight - 72, edgeY));

    arrow.style.display = 'block';
    arrow.style.left = (screenX - 9) + 'px';
    arrow.style.top = (screenY - 18) + 'px';
    arrow.style.transform = 'rotate(' + (directionAngle * 180 / Math.PI + 90) + 'deg)';

    const dxScreen = this.rival.body.x - centerX;
    const dyScreen = this.rival.body.y - centerY;
    const horizontal = Math.abs(dxScreen) > Math.abs(dyScreen)
      ? (dxScreen < 0 ? 'LEFT' : 'RIGHT')
      : (dyScreen < 0 ? 'AHEAD' : 'BEHIND');

    distanceLabel.style.display = 'block';
    distanceLabel.style.left = Math.max(8, Math.min(window.innerWidth - 86, screenX - 38)) + 'px';
    distanceLabel.style.top = Math.max(66, Math.min(window.innerHeight - 48, screenY + 8)) + 'px';
    distanceLabel.textContent = horizontal + ' · RANGE ' + distanceLevel;
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
    title.textContent = 'TRAINING PAUSED';
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
    card.appendChild(makeButton('RESUME TRAINING', true, () => this.resumeArena()));
    card.appendChild(makeButton('RESTART TRAINING', false, () => {
      this.pausePanel?.remove();
      this.pausePanel = undefined;
      this.paused = false;
      this.fire = false;
      this.setMoveVector(0, 0);
      this.scene.restart();
    }));
    card.appendChild(makeButton('LEAVE TRAINING', false, () => this.leaveArena()));

    panel.appendChild(card);
    document.body.appendChild(panel);
    this.pausePanel = panel;
  }

  private leaveArena() {
    if (!this.matchOver) {
      abandonShootersTriggerSession('TRAINING QUIT · RESULTS NOT SAVED · PREVIOUS FIELD STATE RESTORED');
    }
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

  private createFighter(x: number, y: number, color: number, label: string, player: boolean, initiallyArmed: boolean) {
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
    // Do not construct an armed-looking fighter and fix it one frame later.
    arms.setVisible(initiallyArmed);
    weapon.setVisible(initiallyArmed);
    muzzle.setVisible(initiallyArmed);
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
      weaponDropped: !initiallyArmed,
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

    // Arena-scale combat field with physical cover only. Training has no trees, concealment, or hiding spots.
    const worldWidth = 2400;
    const worldHeight = 1400;

    g.fillStyle(0x78a653, 1).fillRect(0, 0, worldWidth, worldHeight);
    g.fillStyle(0x86ad5e, 0.42).fillRect(0, 0, worldWidth * 0.50, worldHeight);
    g.fillStyle(0x679346, 0.32).fillRect(worldWidth * 0.50, 0, worldWidth * 0.50, worldHeight);
    g.fillStyle(0xd1b46c, 0.30).fillRect(0, 510, worldWidth, 92);
    g.fillStyle(0xd1b46c, 0.22).fillRect(870, 0, 100, worldHeight);

    g.lineStyle(5, 0xf4f1df, 0.48);
    g.strokeRect(55, 70, worldWidth - 110, worldHeight - 120);

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
    this.cameras.main.setDeadzone(0, 0);
    if (this.trainingMode && this.trainingCameraFocus) this.cameras.main.setZoom(TRAINING_CAMERA_MIN_ZOOM);
    this.scoreHud?.setPosition(width / 2, 16);
    this.ammoHud?.setPosition(width - 14, 16);
  }

  private updateStealthIndicators() {
    if (this.trainingMode) return;
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
    if (this.trainingMode) {
      this.playerLastKnown.set(this.player.body.x, this.player.body.y);
      return;
    }
    if (!this.isPlayerConcealed()) {
      this.playerLastKnown.set(this.player.body.x, this.player.body.y);
      this.playerRevealedUntil = Math.max(this.playerRevealedUntil, Date.now());
    }
  }

  private isPlayerConcealed() {
    if (this.trainingMode) return false;
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

  private getTrainingObstacleRoute() {
    const dx = this.player.body.x - this.rival.body.x;
    const dy = this.player.body.y - this.rival.body.y;
    const blockers = this.covers.filter((cover) =>
      Phaser.Geom.Intersects.LineToRectangle(
        new Phaser.Geom.Line(this.rival.body.x, this.rival.body.y, this.player.body.x, this.player.body.y),
        cover,
      ),
    );
    if (!blockers.length) return { x: dx, y: dy };

    const blocker = blockers[0];
    const margin = 32;
    const candidates = [
      { x: blocker.x - margin, y: blocker.y - margin },
      { x: blocker.x + blocker.width + margin, y: blocker.y - margin },
      { x: blocker.x - margin, y: blocker.y + blocker.height + margin },
      { x: blocker.x + blocker.width + margin, y: blocker.y + blocker.height + margin },
    ].map((point) => ({
      x: Phaser.Math.Clamp(point.x, 42, 2358),
      y: Phaser.Math.Clamp(point.y, 90, 1350),
    })).filter((point) => !this.inCover(point.x, point.y, 16));

    const scored = candidates
      .map((point) => ({
        point,
        distance: Phaser.Math.Distance.Between(this.rival.body.x, this.rival.body.y, point.x, point.y),
        canShoot: this.hasLineOfSight(point.x, point.y, this.player.body.x, this.player.body.y),
      }))
      .sort((a, b) =>
        Number(b.canShoot) - Number(a.canShoot) || a.distance - b.distance,
      );

    const best = scored[0];
    return best ? {
      x: best.point.x - this.rival.body.x,
      y: best.point.y - this.rival.body.y,
    } : { x: dx, y: dy };
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

