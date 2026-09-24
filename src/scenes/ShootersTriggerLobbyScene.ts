import Phaser from 'phaser';
import { getShootersTriggerPhoneAlert, markShootersTriggerPhoneAlertRead, recoverInterruptedShootersTriggerSession } from '../shooters-trigger-session';

type Location = {
  id: 'training' | 'upgrades' | 'arena';
  name: string;
  subtitle: string;
  x: number;
  y: number;
  color: number;
};

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1400;

export class ShootersTriggerLobbyScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();
  private player!: Phaser.GameObjects.Container;
  private target: Phaser.Math.Vector2 | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private joystickCleanup?: () => void;
  private activeLocationId: Location['id'] | null = null;
  private equipmentModal?: HTMLDivElement;
  private statusText?: Phaser.GameObjects.Text;
  private enterButton?: Phaser.GameObjects.Container;
  private phoneButton?: HTMLButtonElement;
  private phoneModal?: HTMLDivElement;
  private phoneHint?: HTMLDivElement;
  private phoneAlertAnimation?: Animation;
  private phoneLastSignature = '';
  private phoneUnread = false;
  private phoneLastAlertCreatedAt = 0;
  private phonePollClock = 0;
  private phoneAudioContext?: AudioContext;

  private locations: Location[] = [
    { id: 'training', name: 'TRAINING CAMP', subtitle: '01 · EVASION → SHOOTING · 30s + 30s', x: 780, y: 690, color: 0x2f7775 },
    { id: 'upgrades', name: 'ARMORY & OUTFITTER', subtitle: '02 · GEAR · UPGRADE · PREP', x: 760, y: 1080, color: 0xe8c95c },
    { id: 'arena', name: 'ARENA', subtitle: '03 · 1v1 · FIRST TO 3', x: 1180, y: 420, color: 0xd66a3d },
  ];

  private playerMoving = false;
  private walkClock = 0;

  constructor() { super('ShootersTriggerLobbyScene'); }

  create() {
    recoverInterruptedShootersTriggerSession();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#78a653');
    this.drawField();
    this.player = this.createPlayer(1180, 1040);
    this.player.setDepth(30);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(Math.min(width * .28, 320), Math.min(height * .22, 150));

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.installWalkJoystick();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.target = new Phaser.Math.Vector2(p.x, p.y);
    });

    this.statusText = this.add.text(width / 2, 78, '', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: '#fff4d4', backgroundColor: '#493526',
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
      align: 'center', wordWrap: { width: width * .78 },
    }).setOrigin(.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    this.enterButton = this.makeEnterButton(width / 2, height - Math.max(170, height * .22));
    this.createPhoneButton();
    this.add.text(width / 2, 22, 'SHOOTERS TRIGGER · FIELD HQ', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(.5).setScrollFactor(0).setDepth(190);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.joystickCleanup?.();
      this.equipmentModal?.remove();
      this.phoneModal?.remove();
      this.phoneButton?.remove();
      this.phoneHint?.remove();
      this.phoneAlertAnimation?.cancel();
      this.phoneAlertAnimation = undefined;
      this.phoneHint = undefined;
      this.equipmentModal = undefined;
      this.phoneModal = undefined;
      this.phoneButton = undefined;
      this.activeLocationId = null;
      this.enterButton?.destroy();
      this.enterButton = undefined;
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time: number, delta: number) {
    let dx = this.joystickVector.x, dy = this.joystickVector.y;
    if (Math.abs(dx) < .01 && Math.abs(dy) < .01) {
      if (this.cursors.left.isDown || this.keys.A.isDown) dx--;
      if (this.cursors.right.isDown || this.keys.D.isDown) dx++;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy--;
      if (this.cursors.down.isDown || this.keys.S.isDown) dy++;
    }

    if (!dx && !dy && this.target) {
      dx = this.target.x - this.player.x;
      dy = this.target.y - this.player.y;
      if (Math.hypot(dx, dy) < 12) this.target = null;
    }

    this.playerMoving = !!(dx || dy);
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      this.player.x = Phaser.Math.Clamp(this.player.x + dx / len * 175 * delta / 1000, 70, WORLD_WIDTH - 70);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy / len * 175 * delta / 1000, 120, WORLD_HEIGHT - 70);
    }
    this.walkClock += delta;
    this.updatePlayerAnimation();

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();
    this.updateLocationHint();

    this.phonePollClock += delta;
    if (this.phonePollClock >= 500) {
      this.phonePollClock = 0;
      this.refreshPhoneAlert();
    }
  }

  public setMoveVector(x: number, y: number) {
    this.joystickVector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
  }

  public isPhoneSession() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  private has(key: 'shooting' | 'evasion') {
    try { return !!localStorage.getItem('shooters-trigger:last-' + key); } catch { return false; }
  }

  private hasUpgrade() {
    try { return Number(localStorage.getItem('shooters-trigger:upgrade-level') || 0) > 0; } catch { return false; }
  }

  private getBudget() {
    try { return Number(localStorage.getItem('shooters-trigger:budget') || 0); } catch { return 0; }
  }

  private getNearbyLocation() {
    return this.locations
      .map(location => ({
        location,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
  }

  private isInsideLocation(location: Location) {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y) <= 125;
  }

  private makeEnterButton(x: number, y: number) {
    const button = this.add.container(x, y).setScrollFactor(0).setDepth(250).setVisible(false);
    const shape = this.add.rectangle(0, 0, Math.min(300, this.scale.width * .78), 46, 0x2f7775, .96)
      .setStrokeStyle(2, 0xf0dfb6, .9);
    const text = this.add.text(0, 0, 'ENTER LOCATION', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#fff4d4', align: 'center', letterSpacing: 1
    }).setOrigin(.5);
    button.add([shape, text]).setSize(shape.width, shape.height).setInteractive({ useHandCursor: false });
    button.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.interact();
    });
    return button;
  }

  private interact() {
    const nearby = this.getNearbyLocation();
    if (!nearby || nearby.distance > 145 || !this.isInsideLocation(nearby.location)) return;

    const location = nearby.location;
    switch (location.id) {
      case 'training':
        this.scene.start('ShootersTriggerTrainingScene');
        break;
      case 'upgrades':
        this.openEquipmentStore();
        break;
      case 'arena':
        this.scene.start('ShootersTriggerArenaScene');
        break;
    }
  }


  private createPhoneButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Open Field Phone');
    Object.assign(button.style, {
      position: 'fixed',
      right: 'max(18px, env(safe-area-inset-right, 0px))',
      bottom: 'max(18px, env(safe-area-inset-bottom, 0px))',
      width: '112px',
      height: '112px',
      padding: '0',
      border: '0',
      background: 'transparent',
      color: '#fff4d4',
      zIndex: '1450',
      touchAction: 'manipulation',
      display: 'grid',
      placeItems: 'center',
      WebkitTapHighlightColor: 'transparent',
    });

    button.innerHTML = `
      <span aria-hidden="true" style="position:relative;display:block;width:58px;height:88px;border:3px solid #f4f1df;border-radius:12px;background:#17251c;box-shadow:0 8px 18px rgba(0,0,0,.38),0 0 0 2px rgba(16,32,24,.7);">
        <span style="position:absolute;left:50%;top:8px;transform:translateX(-50%);width:18px;height:3px;border-radius:3px;background:#f4f1df;opacity:.8;"></span>
        <span style="position:absolute;left:6px;right:6px;top:17px;bottom:17px;border:1px solid #496556;border-radius:5px;background:linear-gradient(#263d2d,#102018);"></span>
        <span style="position:absolute;left:50%;bottom:6px;transform:translateX(-50%);width:8px;height:8px;border:1px solid #f4f1df;border-radius:50%;opacity:.85;"></span>
      </span>
      <span data-phone-badge="true" style="position:absolute;right:10px;top:10px;min-width:24px;height:24px;padding:0 6px;border-radius:12px;border:2px solid #151a16;background:#d66a3d;color:#fff4d4;font:800 11px/20px monospace;text-align:center;display:none;box-shadow:0 4px 10px rgba(0,0,0,.35);">!</span>
    `;

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openPhone();
    });
    document.body.appendChild(button);
    this.phoneButton = button;

    const hint = document.createElement('div');
    Object.assign(hint.style, {
      position: 'fixed',
      right: 'max(24px, env(safe-area-inset-right, 6px))',
      bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 116px)',
      minWidth: '108px',
      maxWidth: '150px',
      padding: '7px 9px',
      border: '1px solid #e8c95c',
      borderRadius: '7px',
      background: 'rgba(21,26,22,.94)',
      color: '#e8c95c',
      fontFamily: 'monospace',
      fontSize: '8px',
      fontWeight: '800',
      lineHeight: '1.35',
      textAlign: 'center',
      zIndex: '1449',
      pointerEvents: 'none',
      display: 'none',
      boxShadow: '0 6px 16px rgba(0,0,0,.3)',
    });
    document.body.appendChild(hint);
    this.phoneHint = hint;

    this.refreshPhoneAlert(true);
  }

  private getPhoneSignature() {
    const keys = [
      'shooters-trigger:last-shooting',
      'shooters-trigger:last-evasion',
      'shooters-trigger:last-arena',
      'shooters-trigger:budget',
      'shooters-trigger:upgrade-level',
    ];
    try {
      return keys.map(key => key + '=' + (localStorage.getItem(key) || '')).join('|');
    } catch {
      return 'unavailable';
    }
  }

  private getPhoneNextLabel() {
    const fieldAlert = getShootersTriggerPhoneAlert();
    let shooting: any = null, evasion: any = null, arena: any = null, training: any = null;
    try {
      shooting = JSON.parse(localStorage.getItem('shooters-trigger:last-shooting') || 'null');
      evasion = JSON.parse(localStorage.getItem('shooters-trigger:last-evasion') || 'null');
      arena = JSON.parse(localStorage.getItem('shooters-trigger:last-arena') || 'null');
      training = JSON.parse(localStorage.getItem('shooters-trigger:training-report') || 'null');
    } catch {}

    if (!shooting || !evasion) return 'PLAYER NEWS · TRAINING CAMP FIRST · EVASION → SHOOTING';
    if (!arena) return 'PLAYER NEWS · TRAINING COMPLETE · ARENA ODDS READY';
    if (arena?.result === 'WIN') return 'NEXT · ARMORY';
    return 'NEXT · RETRAIN';
  }

  private refreshPhoneAlert(initial = false) {
    const explicitAlert = getShootersTriggerPhoneAlert();
    if (explicitAlert) {
      this.phoneUnread = true;
      const createdAt = Number(explicitAlert.createdAt || 0);
      if (!initial && createdAt !== this.phoneLastAlertCreatedAt) this.playPhoneAlert();
      this.phoneLastAlertCreatedAt = createdAt;
      this.renderPhoneAlert();
      return;
    }
    this.phoneLastAlertCreatedAt = 0;

    const signature = this.getPhoneSignature();
    if (!signature || signature === 'unavailable') return;

    let seen = '';
    try { seen = localStorage.getItem('shooters-trigger:phone-seen-signature') || ''; } catch {}

    if (!this.phoneLastSignature) this.phoneLastSignature = signature;

    if (initial) {
      this.phoneUnread = seen !== signature;
    } else if (signature !== this.phoneLastSignature) {
      this.phoneUnread = true;
      this.playPhoneAlert();
    }

    this.phoneLastSignature = signature;
    this.renderPhoneAlert();
  }

  private renderPhoneAlert() {
    if (!this.phoneButton) return;
    const badge = this.phoneButton.querySelector('[data-phone-badge="true"]') as HTMLElement | null;
    if (badge) {
      badge.textContent = this.phoneUnread ? '!' : '';
      badge.style.display = this.phoneUnread ? 'block' : 'none';
    }

    if (this.phoneHint) {
      this.phoneHint.textContent = this.phoneUnread ? this.getPhoneNextLabel() : '';
      this.phoneHint.style.display = this.phoneUnread ? 'block' : 'none';
    }

    if (this.phoneUnread) {
      if (!this.phoneAlertAnimation) {
        this.phoneAlertAnimation = this.phoneButton.animate(
          [
            { transform: 'translateX(0) rotate(0deg)' },
            { transform: 'translateX(-3px) rotate(-4deg)' },
            { transform: 'translateX(3px) rotate(4deg)' },
            { transform: 'translateX(-2px) rotate(-2deg)' },
            { transform: 'translateX(0) rotate(0deg)' },
          ],
          { duration: 900, iterations: Infinity, easing: 'ease-in-out' },
        );
      }
    } else {
      this.phoneAlertAnimation?.cancel();
      this.phoneAlertAnimation = undefined;
    }
  }

  private playPhoneAlert() {
    // Visual notification always works; sound follows browser autoplay rules.
    this.phoneButton?.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' },
      ],
      { duration: 420, iterations: 2, easing: 'ease-out' },
    );

    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      this.phoneAudioContext ||= new AudioCtor();
      const ctx = this.phoneAudioContext;
      if (ctx.state === 'suspended') void ctx.resume();
      const now = ctx.currentTime;
      [0, 0.18].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(offset ? 920 : 760, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.055, now + offset + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.13);
      });
    } catch {}
  }

  private markPhoneRead() {
    const signature = this.getPhoneSignature();
    markShootersTriggerPhoneAlertRead();
    this.phoneLastAlertCreatedAt = 0;
    this.phoneUnread = false;
    this.phoneLastSignature = signature;
    try { localStorage.setItem('shooters-trigger:phone-seen-signature', signature); } catch {}
    this.renderPhoneAlert();
  }

  private openPhone() {
    if (this.phoneModal) return;
    const fieldAlert = getShootersTriggerPhoneAlert();
    this.markPhoneRead();

    let shooting: any = null, evasion: any = null, arena: any = null;
    try {
      shooting = JSON.parse(localStorage.getItem('shooters-trigger:last-shooting') || 'null');
      evasion = JSON.parse(localStorage.getItem('shooters-trigger:last-evasion') || 'null');
      arena = JSON.parse(localStorage.getItem('shooters-trigger:last-arena') || 'null');
    } catch {}

    const budget = this.getBudget();
    const upgradeLevel = Number(localStorage.getItem('shooters-trigger:upgrade-level') || 0);
    const shootingAccuracy = Number(shooting?.accuracy || 0);
    const shootingHits = Number(shooting?.targetHits || 0);
    const shootingSkill = !shooting ? 'UNTRAINED'
      : shootingAccuracy >= 75 && shootingHits >= 5 ? 'REALLY GOOD'
      : shootingAccuracy >= 45 && shootingHits >= 3 ? 'GOOD'
      : 'DEVELOPING';
    const evasionSurvived = Number(evasion?.survived || 0) / 1000;
    const evasionCover = Number(evasion?.coverBlocks || 0);
    const evasionSkill = !evasion ? 'UNTRAINED'
      : evasionSurvived >= 50 && evasionCover >= 3 ? 'REALLY GOOD'
      : evasionSurvived >= 30 || evasionCover >= 2 ? 'GOOD'
      : 'DEVELOPING';

    const readiness = !training && !arena ? 'NEW PLAYER'
      : training && !arena ? 'FIELD READY · ODDS READY' : arena?.result === 'WIN' ? 'PROVEN' : 'TESTED';

    const next = fieldAlert
      ? ['FIELD ALERT', fieldAlert.message || 'FIELD UPDATE · READ AND CONTINUE']
      : !training
      ? ['TRAINING CAMP FIRST', 'Start with EVASION, take the break, then switch roles for SHOOTING. Your phone will calculate the Arena edge.']
        : !arena
          ? ['FIELD READY', 'The ARENA is open. A win earns cash for upgrades. You can fight now or train again first.']
          : arena?.result === 'WIN'
            ? ['ARENA WIN · FIELD REPORT READY', 'Match complete. Review your headshots, paint hits and scrapes on the phone, then visit ARMORY & OUTFITTER or fight again.']
            : ['ARENA LOSS · FIELD REPORT READY', 'Match complete. Review what landed, what scraped and where you took hits, then retrain before the next Arena fight.'];

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100dvh',
      zIndex: '1550',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      padding: 'max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))',
      background: 'rgba(12,18,14,.72)',
      fontFamily: 'monospace',
      touchAction: 'manipulation',
      overflow: 'hidden',
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(440px, calc(100vw - 24px))',
      maxHeight: 'calc(100dvh - 24px)',
      minHeight: '0',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch',
      boxSizing: 'border-box',
      padding: '20px',
      background: '#151a16',
      color: '#f4f1df',
      border: '2px solid #e8c95c',
      borderRadius: '12px',
      boxShadow: '0 12px 34px rgba(0,0,0,.45)',
    });
    const title = document.createElement('div');
    title.textContent = 'FIELD PHONE';
    title.style.cssText = 'font-size:10px;font-weight:800;color:#9fbda8;letter-spacing:1px;margin-bottom:8px;';
    const headline = document.createElement('div');
    headline.textContent = next[0];
    headline.style.cssText = 'font-size:17px;font-weight:800;color:#e8c95c;letter-spacing:1px;margin-bottom:10px;';
    const message = document.createElement('div');
    message.textContent = next[1];
    message.style.cssText = 'font-size:11px;line-height:1.7;margin-bottom:16px;';

    const playerNews = document.createElement('div');
    playerNews.innerHTML = [
      '<b>PLAYER NEWS</b>',
      shooting ? 'Latest shooting record · ' + shooting.accuracy + '% accuracy · ' + shooting.targetHits + ' target hits.' : 'No shooting record yet · your first field report starts at SHOOTING.',
      evasion ? 'Latest evasion record · survived ' + (evasion.survived / 1000).toFixed(1) + 's · ' + evasion.coverBlocks + ' cover blocks.' : 'No evasion record yet · your next evidence comes from EVASION.',
      arena ? 'Latest Arena · ' + arena.result + ' · score ' + arena.score.join(' — ') + ' · budget earned ' + Number(arena.budgetEarned || 0) + '.' : 'No Arena result yet · your phone is tracking your progress, not a rival.'
    ].join('<br>');
    playerNews.style.cssText = 'font-size:10px;line-height:1.8;padding:12px;border:1px solid #496556;border-radius:8px;margin-bottom:12px;';

    const state = document.createElement('div');
    state.innerHTML = [
      '<b>PLAYER STATE</b>',
      'READINESS · ' + readiness,
      training ? 'EVASION EDGE · ' + training.edge.evasion + ' · SHOOTING EDGE · ' + training.edge.shooting + '<br>OVERALL EDGE · ' + training.edge.overall + ' · ODDS ONLY' : 'TRAINING EDGE · NOT SET',
      'SHOOTING SKILL · ' + shootingSkill,
      'EVASION SKILL · ' + evasionSkill,
      'BUDGET · ' + budget,
      'ARENA · ' + (arena?.result || 'UNTESTED'),
      'LOADOUT · ' + (upgradeLevel ? 'LEVEL ' + upgradeLevel : 'BASIC'),
    ].join('<br>');
    state.style.cssText = 'font-size:10px;line-height:1.8;padding:12px;border:1px solid #496556;border-radius:8px;margin-bottom:12px;';

    const records = document.createElement('div');
    records.innerHTML = [
      '<b>TRAINING RECORD</b>',
      shooting
        ? 'Shots ' + shooting.shots + ' · Hits ' + shooting.targetHits + ' · Accuracy ' + shooting.accuracy + '%'
          + '<br>Center-mass ' + Number(shooting.centerMassHits || 0)
          + ' · Exceptional ' + Number(shooting.exceptionalHits || 0)
          + ' · Misses ' + Number(shooting.misses || 0)
          + ' · Cover hits ' + Number(shooting.coverHits || 0)
        : 'No shooting record yet.',
      '<br><br><b>EVASION RECORD</b>',
      evasion
        ? 'Survived ' + (evasion.survived / 1000).toFixed(1) + 's · Incoming ' + evasion.incomingShots
          + '<br>Hits ' + evasion.hits + ' · Misses ' + evasion.misses + ' · Scrapes ' + evasion.scrapes
          + ' · Cover blocks ' + evasion.coverBlocks
        : 'No evasion record yet.',
      '<br><br><b>ARENA FIELD REPORT</b>',
      arena
        ? 'Result ' + arena.result + ' · Score ' + arena.score.join(' — ') +
          '<br>Headshots you ' + Number(arena.headshots?.player || 0) +
          ' · Body hits you ' + Number(arena.bodyHits?.player || 0) +
          '<br>Scrapes you ' + Number(arena.scrapes?.player || 0) +
          ' · Paint landed ' + Number(arena.paintCoverage?.player || 0) +
          '<br>Headshots received ' + Number(arena.headshots?.rival || 0) +
          ' · Body hits received ' + Number(arena.bodyHits?.rival || 0) +
          '<br>Rival scrapes ' + Number(arena.scrapes?.rival || 0) +
          ' · Budget earned ' + Number(arena.budgetEarned || 0)
        : 'No Arena field report yet.',
    ].join('<br>');
    records.innerHTML += [
      '<br><br><b>RIVAL INTEL · POST-MATCH ONLY</b>',
      arena
        ? 'Operator ' + arena.rival?.operator +
          ' · Profile ' + String(arena.rival?.profile || '').toUpperCase() +
          '<br>Shooting ' + Number(arena.rival?.shooting || 0) +
          ' · Movement ' + Number(arena.rival?.movement || 0) +
          '<br>Pressure ' + Number(arena.rival?.pressure || 0) +
          ' · Cover use ' + Number(arena.rival?.coverUse || 0) +
          '<br>Weapon knockouts you landed ' + Number(arena.weaponKnockouts?.player || 0)
        : 'Rival information appears only after a completed Arena match.',
    ].join('<br>');
    records.style.cssText = 'font-size:10px;line-height:1.8;padding:12px;border:1px solid #38493d;border-radius:8px;margin-bottom:12px;';

    const route = document.createElement('div');
    route.textContent = [
      'FIELD ROUTE',
      training ? 'TRAINING CAMP · COMPLETE' : 'TRAINING CAMP · START HERE · EVASION → SHOOTING',
      arena ? 'ARENA · ' + arena.result : 'ARENA · TRAINING EDGE APPLIES',
      'ARMORY · SPEND EARNED CASH ON UPGRADES',
    ].join('\n');
    route.style.cssText = 'white-space:pre-line;font-size:10px;line-height:1.8;color:#e8c95c;padding:12px;border:1px solid #695d32;border-radius:8px;margin-bottom:12px;';

    const freedom = document.createElement('div');
    freedom.textContent = 'FIELD AREA · TRAINING CAMP · ARMORY & OUTFITTER · ARENA';
    freedom.style.cssText = 'font-size:9px;color:#9fbda8;line-height:1.6;margin-bottom:16px;';

    const close = document.createElement('button');
    close.type='button'; close.textContent='CLOSE PHONE';
    Object.assign(close.style,{width:'100%',minHeight:'48px',border:'2px solid #f4f1df',borderRadius:'8px',background:'#102018',color:'#f4f1df',fontFamily:'monospace',fontSize:'10px',fontWeight:'800'});
    close.addEventListener('pointerdown',(event)=>{event.preventDefault();event.stopPropagation();modal.remove();this.phoneModal=undefined;});
    card.append(title,headline,message,playerNews,state,records,route,freedom,close);
    modal.appendChild(card); document.body.appendChild(modal); this.phoneModal=modal;
  }

  private openEquipmentStore() {
    if (this.equipmentModal) return;

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed', inset: '0', zIndex: '1500', display: 'grid',
      placeItems: 'center', padding: '24px', background: 'rgba(32,20,12,.72)',
      fontFamily: 'monospace', touchAction: 'manipulation',
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(460px,92vw)', padding: '24px', border: '3px solid #e8c95c',
      borderRadius: '14px', background: '#2b2118', color: '#fff4d4',
      textAlign: 'center', boxShadow: '0 12px 36px rgba(0,0,0,.4)',
    });

    const level = Number(localStorage.getItem('shooters-trigger:upgrade-level') || 0);
    const budget = this.getBudget();
    const title = document.createElement('div');
    title.textContent = 'ARMORY & OUTFITTER';
    title.style.cssText = 'font-size:18px;font-weight:800;color:#e8c95c;letter-spacing:1px;margin-bottom:12px;';
    const detail = document.createElement('div');
    detail.textContent = level
      ? `LOADOUT LEVEL ${level} · BUDGET ${budget}\nTraining results are ready. Improve the field kit before review.`
      : `STARTER LOADOUT · BUDGET ${budget}\nOne field upgrade costs 20 budget.`;
    detail.style.cssText = 'white-space:pre-line;font-size:11px;line-height:1.7;margin-bottom:20px;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';

    const makeButton = (label: string) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label;
      Object.assign(button.style, {
        minWidth:'150px', minHeight:'48px', padding:'10px 14px',
        border:'2px solid #f4f1df', borderRadius:'10px', background:'#102018',
        color:'#f4f1df', fontFamily:'monospace', fontSize:'11px', fontWeight:'800',
      });
      return button;
    };

    const upgrade = makeButton(budget >= 20 ? 'UPGRADE LOADOUT · 20' : 'NOT ENOUGH BUDGET');
    const close = makeButton('CLOSE FIELD STORE');

    upgrade.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      if (budget < 20) { this.showStatus('You need 20 budget for the field upgrade.'); return; }
      const next = level + 1;
      localStorage.setItem('shooters-trigger:budget', String(budget - 20));
      localStorage.setItem('shooters-trigger:upgrade-level', String(next));
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
      this.showStatus('LOADOUT UPDATED · WALK THE FIELD WHEN READY');
    });

    close.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      this.equipmentModal?.remove(); this.equipmentModal = undefined;
    });

    actions.append(upgrade, close);
    card.append(title, detail, actions);
    modal.appendChild(card);
    document.body.appendChild(modal);
    this.equipmentModal = modal;
  }

  private updateLocationHint() {
    const nearby = this.getNearbyLocation();
    if (!nearby || nearby.distance > 165) {
      this.activeLocationId = null;
      this.enterButton?.setVisible(false);
      return;
    }
    this.activeLocationId = nearby.location.id;
    if (this.enterButton) {
      this.enterButton.setVisible(true);
      const label = `ENTER ${nearby.location.name}`;
      (this.enterButton.getAt(1) as Phaser.GameObjects.Text).setText(label);
      const shape = this.enterButton.getAt(0) as Phaser.GameObjects.Rectangle;
      shape.setFillStyle(0x2f7775, 0.96);
      shape.setStrokeStyle(2, 0xf0dfb6, 0.9);
    }
  }

  private showStatus(message: string) {
    if (!this.statusText) return;
    this.statusText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.statusText);
    this.tweens.add({ targets: this.statusText, alpha: 0, delay: 1800, duration: 450 });
  }

  private installWalkJoystick() {
    if (!('ontouchstart' in window) && navigator.maxTouchPoints < 1) return;
    const root = document.createElement('div');
    Object.assign(root.style, {
      position:'fixed', left:'18px', bottom:'18px', width:'112px', height:'112px',
      border:'2px solid rgba(244,241,223,.7)', borderRadius:'50%',
      background:'rgba(16,32,24,.52)', zIndex:'1400', touchAction:'none',
    });
    const knob = document.createElement('div');
    Object.assign(knob.style, {
      position:'absolute', left:'50%', top:'50%', width:'48px', height:'48px',
      margin:'-24px', borderRadius:'50%', background:'#1f6b4b', border:'2px solid #f4f1df',
    });
    root.appendChild(knob); document.body.appendChild(root);

    let id: number | null = null;
    const reset = () => { id = null; knob.style.transform='translate(0,0)'; this.joystickVector.set(0,0); };
    const move = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      const r=root.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
      const dx=e.clientX-cx, dy=e.clientY-cy, len=Math.hypot(dx,dy)||1, max=38, k=Math.min(1,max/len);
      knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;
      this.joystickVector.set(dx/len*Math.min(1,len/max),dy/len*Math.min(1,len/max));
    };
    root.onpointerdown=e=>{e.preventDefault();e.stopPropagation();id=e.pointerId;root.setPointerCapture?.(e.pointerId);move(e);};
    root.onpointermove=move; root.onpointerup=reset; root.onpointercancel=reset; root.onlostpointercapture=reset;
    this.joystickCleanup=()=>root.remove();
  }

  private drawField() {
    const g = this.add.graphics();
    g.fillStyle(0x78a653, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // The lobby is a field headquarters: four playable destinations around a calm arrival area.
    g.fillStyle(0x8fb36b, 0.24).fillRoundedRect(760, 760, 880, 470, 34);
    g.fillStyle(0xd1b46c, 0.26).fillRect(1080, 180, 240, 1010);
    g.fillStyle(0xd1b46c, 0.18).fillRect(320, 730, 1760, 120);

    g.lineStyle(5, 0xf4f1df, 0.42);
    g.strokeRect(55, 70, WORLD_WIDTH - 110, WORLD_HEIGHT - 120);

    // Arrival / staging compound.
    this.drawShelter(1180, 1050, 330, 150, 'FIELD HQ');
    this.drawBench(930, 1035, 150);
    this.drawBench(1430, 1035, 150);
    this.drawCrates(1000, 1140, 3);
    this.drawCrates(1510, 1140, 2);
    this.drawInfoBoard(1180, 790, 'FIELD BOARD');

    // Shooting station: target stands and a short marked firing lane.
    this.drawFence(1400, 470, 420, 70);
    this.drawTargetStand(1540, 455);
    this.drawTargetStand(1690, 455);
    this.drawLane(1400, 560, 420, '01 · SHOOTING RANGE');

    // Evasion station: an irregular cover/movement course.
    this.drawBunker(430, 620, 230, 70, 0x76563b);
    this.drawBunker(680, 760, 170, 64, 0x5f6e69);
    this.drawTireStack(470, 870);
    this.drawTireStack(700, 950);
    this.drawCourseFence(380, 530, 560, 470);
    this.drawSign(780, 500, '02', 'EVASION YARD', 0x2f7775);

    // Armory: a physical equipment tent/rack area, not a building.
    this.drawShelter(580, 1110, 360, 150, 'ARMORY');
    this.drawEquipmentRack(580, 1310);
    this.drawCrates(800, 1310, 3);
    this.drawSign(760, 1060, '03', 'ARMORY & OUTFITTER', 0xe8c95c);

    // Arena: an open physical play field. There is no gate or artificial entry point.
    this.drawArenaField(980, 300, 400, 240);

    // Grounded wayfinding signs replace floating destination markers.
    this.drawSign(1580, 640, '01', 'SHOOTING', 0xd66a3d);
    this.drawSign(780, 640, '02', 'EVASION', 0x2f7775);
    this.drawSign(760, 1030, '03', 'ARMORY', 0xe8c95c);
    this.drawSign(1180, 560, '04', 'ARENA', 0xd66a3d);

    this.drawTree(300, 280, 1.15);
    this.drawTree(2110, 330, 0.95);
    this.drawTree(280, 1110, 0.90);
    this.drawTree(2140, 1110, 1.10);

    this.add.text(WORLD_WIDTH / 2, 30, 'SHOOTERS TRIGGER · FIELD HQ', {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);
    this.add.text(WORLD_WIDTH / 2, 56, 'ARRIVE · LOOK AROUND · CHOOSE YOUR NEXT STOP', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#f5d37a', stroke: '#315845', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
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
  }

  private drawTireStack(x: number, y: number) {
    const g = this.add.graphics();
    for (let i = 0; i < 4; i += 1) {
      g.fillStyle(0x2b302d, 1).fillCircle(x + i * 17, y - i * 3, 19);
      g.fillStyle(0x66706a, 1).fillCircle(x + i * 17, y - i * 3, 7);
    }
  }

  private drawShelter(x: number, y: number, width: number, height: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, 0.22).fillRoundedRect(x + 10, y + 12, width, height, 12);
    g.fillStyle(0xd7c08a, 1).fillRoundedRect(x, y, width, height, 12);
    g.fillStyle(0x6a533b, 1).fillTriangle(x - 10, y + 15, x + width / 2, y - 35, x + width + 10, y + 15);
    g.fillStyle(0x49654b, 1).fillRect(x + 22, y + 38, width - 44, height - 55);
    g.lineStyle(3, 0xf4f1df, 0.34).strokeRoundedRect(x, y, width, height, 12);
    this.add.text(x + width / 2, y + height / 2 + 4, label, {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(7);
  }

  private drawBench(x: number, y: number, width: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRoundedRect(x, y, width, 16, 5);
    g.fillStyle(0x493526, 1).fillRect(x + 16, y + 14, 10, 38).fillRect(x + width - 26, y + 14, 10, 38);
  }

  private drawCrates(x: number, y: number, count: number) {
    const g = this.add.graphics();
    for (let i = 0; i < count; i += 1) {
      g.fillStyle(0x9b7449, 1).fillRect(x + i * 34, y - (i % 2) * 18, 30, 30);
      g.lineStyle(2, 0x5c432e, 0.8).strokeRect(x + i * 34, y - (i % 2) * 18, 30, 30);
    }
  }

  private drawInfoBoard(x: number, y: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, 1).fillRect(x - 5, y + 34, 10, 90);
    g.fillStyle(0x24362d, 1).fillRoundedRect(x - 105, y - 25, 210, 70, 8);
    g.lineStyle(3, 0xf4f1df, 0.45).strokeRoundedRect(x - 105, y - 25, 210, 70, 8);
    this.add.text(x, y + 10, label + '\nOPEN FIELD · CHOOSE YOUR ROUTE', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#fff4d4', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(8);
  }

  private drawTargetStand(x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, 1).fillRect(x - 4, y + 28, 8, 55);
    g.fillStyle(0xf4f1df, 1).fillRect(x - 34, y - 8, 68, 48);
    g.fillStyle(0xd66a3d, 1).fillCircle(x, y + 15, 14);
    g.lineStyle(2, 0x493526, 0.65).strokeRect(x - 34, y - 8, 68, 48);
  }

  private drawFence(x: number, y: number, width: number, height: number) {
    const g = this.add.graphics();
    g.lineStyle(5, 0x315845, 0.8);
    g.strokeRect(x, y, width, height);
    for (let px = x; px <= x + width; px += 70) g.fillStyle(0x493526, 1).fillRect(px, y - 8, 8, height + 16);
  }

  private drawLane(x: number, y: number, width: number, label: string) {
    const g = this.add.graphics();
    g.lineStyle(3, 0xf4f1df, 0.35);
    g.strokeRect(x, y, width, 260);
    this.add.text(x + width / 2, y + 275, label, {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(7);
  }

  private drawCourseFence(x: number, y: number, width: number, height: number) {
    const g = this.add.graphics();
    g.lineStyle(4, 0x315845, 0.7).strokeRoundedRect(x, y, width, height, 18);
    for (let px = x; px <= x + width; px += 80) g.fillStyle(0x493526, 1).fillRect(px - 3, y - 8, 6, height + 16);
  }

  private drawEquipmentRack(x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, 1).fillRect(x, y, 180, 12);
    g.fillStyle(0x65472f, 1).fillRect(x + 10, y - 72, 8, 72).fillRect(x + 162, y - 72, 8, 72);
    for (let i = 0; i < 4; i += 1) {
      g.fillStyle(0x3f5f4c, 1).fillRoundedRect(x + 30 + i * 36, y - 62, 24, 48, 5);
    }
  }

  private drawMediaDesk(x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRoundedRect(x - 90, y, 180, 18, 5);
    g.fillStyle(0x493526, 1).fillRect(x - 76, y + 18, 10, 45).fillRect(x + 66, y + 18, 10, 45);
    this.add.text(x, y - 12, 'RESULTS / COVERAGE', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8);
  }

  private drawCamera(x: number, y: number) {
    const g = this.add.graphics();
    g.lineStyle(5, 0x493526, 1);
    g.strokeLineShape(new Phaser.Geom.Line(x, y + 8, x - 28, y + 58));
    g.strokeLineShape(new Phaser.Geom.Line(x, y + 8, x + 28, y + 58));
    g.strokeLineShape(new Phaser.Geom.Line(x, y + 8, x, y + 58));
    g.fillStyle(0x2b302d, 1).fillRoundedRect(x - 18, y - 12, 36, 25, 5);
    g.fillStyle(0x8fb39b, 1).fillCircle(x + 18, y, 8);
  }

  private drawArenaField(x: number, y: number, width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(0x679346, 0.45).fillRoundedRect(x, y, width, height, 18);
    g.lineStyle(4, 0xd66a3d, 0.55).strokeRoundedRect(x, y, width, height, 18);
    g.lineStyle(3, 0x315845, 0.55).strokeRoundedRect(x + 18, y + 18, width - 36, height - 36, 14);
    this.drawBunker(x + 45, y + 58, 100, 44, 0x76563b);
    this.drawBunker(x + 250, y + 55, 105, 46, 0x5f6e69);
  }

  private drawSign(x: number, y: number, number: string, label: string, color: number) {
    const g = this.add.graphics();
    g.fillStyle(0x493526, 1).fillRect(x - 3, y, 6, 70);
    g.fillStyle(0xf0dfb6, 1).fillRoundedRect(x - 78, y - 18, 156, 42, 7);
    g.lineStyle(2, color, 1).strokeRoundedRect(x - 78, y - 18, 156, 42, 7);
    this.add.text(x, y + 3, number + ' · ' + label, {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#315845', align: 'center',
    }).setOrigin(0.5).setDepth(9);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 34, 27, 10, 0x3d3025, 0.28);
    const makePose = (legOffset: number, bob: number) => {
      const g = this.add.graphics();
      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1).fillCircle(-7, -17 + bob, 2.5).fillCircle(7, -17 + bob, 2.5);
      g.fillStyle(0x5a7348, 1).fillEllipse(0, -23 + bob, 25, 12);
      // Visible neck + shoulder bridge prevents the head from reading as a
      // separate piece from the torso in the unarmed Home Field sprite.
      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8 + bob, 8, 7, 2);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1 + bob, 20, 14, 4);
      g.fillStyle(0x2f6b4e, 1)
        .fillRoundedRect(-17, 0 + bob, 7, 15, 3)
        .fillRoundedRect(10, 0 + bob, 7, 15, 3);
      g.fillStyle(0xd4a45d, 1)
        .fillCircle(-14, 15 + bob, 3)
        .fillCircle(14, 15 + bob, 3);
      g.fillStyle(0x29372f, 1).fillRoundedRect(-11, 16 + bob, 22, 7, 3);
      g.fillStyle(0x566052, 1).fillRoundedRect(-10 + legOffset, 20 + bob, 8, 13, 2).fillRoundedRect(2 - legOffset, 20 + bob, 8, 13, 2);
      g.fillStyle(0x202522, 1).fillRoundedRect(-12 + legOffset, 30 + bob, 10, 7, 2).fillRoundedRect(2 - legOffset, 30 + bob, 10, 7, 2);
      return g;
    };
    const poseA = makePose(0, 0);
    const poseB = makePose(2, 1).setVisible(false);
    container.add([shadow, poseA, poseB]);
    return container;
  }

  private updatePlayerAnimation() {
    const poseA = this.player.getAt(1) as Phaser.GameObjects.Graphics;
    const poseB = this.player.getAt(2) as Phaser.GameObjects.Graphics;
    if (!poseA || !poseB) return;
    if (!this.playerMoving) {
      poseA.setVisible(true);
      poseB.setVisible(false);
      return;
    }
    const step = Math.floor(this.walkClock / 120) % 2;
    poseA.setVisible(step === 0);
    poseB.setVisible(step === 1);
  }
}