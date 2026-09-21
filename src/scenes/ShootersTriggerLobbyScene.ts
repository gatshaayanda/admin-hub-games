import Phaser from 'phaser';

type Location = {
  id: 'shooting' | 'evasion' | 'upgrades' | 'media' | 'arena';
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

  private locations: Location[] = [
    { id: 'shooting', name: 'SHOOTING RANGE', subtitle: '01 · AIM · FIRE · TRAIN', x: 1880, y: 820, color: 0xd66a3d },
    { id: 'evasion', name: 'EVASION YARD', subtitle: '02 · MOVE · COVER · SURVIVE', x: 1420, y: 1080, color: 0x2f7775 },
    { id: 'upgrades', name: 'ARMORY & OUTFITTER', subtitle: '03 · GEAR · UPGRADE · PREP', x: 1080, y: 300, color: 0xe8c95c },
    { id: 'media', name: 'MEDIA BUREAU', subtitle: '04 · REVIEW · REPORT · REFLECT', x: 1900, y: 650, color: 0x8fb39b },
    { id: 'arena', name: 'ARENA GATE', subtitle: '05 · 1v1 · FIRST TO 3', x: 1180, y: 860, color: 0xd66a3d },
  ];

  private playerMoving = false;
  private walkClock = 0;

  constructor() { super('ShootersTriggerLobbyScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#78a653');
    this.drawField();
    this.player = this.createPlayer(1180, 1080);
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
    this.add.text(width / 2, 22, 'SHOOTERS TRIGGER · FIELD TOWN', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(.5).setScrollFactor(0).setDepth(190);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.joystickCleanup?.();
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
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

  private hasMediaReview() {
    try { return !!localStorage.getItem('shooters-trigger:media-reviewed'); } catch { return false; }
  }

  private getBudget() {
    try { return Number(localStorage.getItem('shooters-trigger:budget') || 100); } catch { return 100; }
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
      case 'shooting':
        this.scene.start('ShootersTriggerTrainingScene');
        break;
      case 'evasion':
        this.scene.start('ShootersTriggerEvasionScene');
        break;
      case 'upgrades':
        this.openEquipmentStore();
        break;
      case 'media':
        this.scene.start('ShootersTriggerMediaScene');
        break;
      case 'arena':
        this.scene.start('ShootersTriggerArenaScene');
        break;
    }
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
    const close = makeButton('BACK TO TOWN');

    upgrade.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      if (budget < 20) { this.showStatus('You need 20 budget for the field upgrade.'); return; }
      const next = level + 1;
      localStorage.setItem('shooters-trigger:budget', String(budget - 20));
      localStorage.setItem('shooters-trigger:upgrade-level', String(next));
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
      this.showStatus('LOADOUT UPDATED · NOW WALK TO THE MEDIA BUREAU');
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
    g.fillStyle(0x86ad5e, 0.42).fillRect(0, 0, WORLD_WIDTH * 0.50, WORLD_HEIGHT);
    g.fillStyle(0x679346, 0.32).fillRect(WORLD_WIDTH * 0.50, 0, WORLD_WIDTH * 0.50, WORLD_HEIGHT);
    g.fillStyle(0xd1b46c, 0.30).fillRect(0, 510, WORLD_WIDTH, 92);
    g.fillStyle(0xd1b46c, 0.22).fillRect(870, 0, 100, WORLD_HEIGHT);
    g.lineStyle(5, 0xf4f1df, 0.48);
    g.strokeRect(55, 70, WORLD_WIDTH - 110, WORLD_HEIGHT - 120);

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

    this.drawStation(1880, 820, '01', 'SHOOTING RANGE', 0xd66a3d);
    this.drawStation(1420, 1080, '02', 'EVASION YARD', 0x2f7775);
    this.drawStation(1080, 300, '03', 'ARMORY', 0xe8c95c);
    this.drawStation(1900, 650, '04', 'MEDIA', 0x8fb39b);
    this.drawStation(1180, 860, '05', 'ARENA GATE', 0xd66a3d);
    this.drawFlag(1180, 860, 0xd66a3d, 'ARENA');
    this.drawFlag(1830, 930, 0xd66a3d, 'SHOOTING');

    g.fillStyle(0xf4f1df, 0.10).fillCircle(1180, 1080, 74);
    g.lineStyle(3, 0xf4f1df, 0.38).strokeCircle(1180, 1080, 74);
    this.add.text(1180, 1132, 'FIELD ENTRY · SAFE AREA', {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);

    this.add.text(WORLD_WIDTH / 2, 30, 'SHOOTERS TRIGGER · FIELD', {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);
    this.add.text(WORLD_WIDTH / 2, 56, 'WALK THE FIELD · CHOOSE WHAT TO DO NEXT', {
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

  private drawFlag(x: number, y: number, color: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(0x594838, 1).fillRect(x, y, 4, 78);
    g.fillStyle(color, 1).fillTriangle(x + 4, y + 4, x + 64, y + 18, x + 4, y + 32);
    this.add.text(x + 32, y + 50, label, {
      fontFamily: 'monospace', fontSize: '9px', color: '#fff4d4',
      stroke: '#493526', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
  }

  private drawStation(x: number, y: number, number: string, label: string, color: number) {
    const g = this.add.graphics();
    g.fillStyle(0x315845, 0.16).fillCircle(x, y, 86);
    g.lineStyle(3, color, 0.70).strokeCircle(x, y, 64);
    g.fillStyle(color, 0.95).fillCircle(x, y - 42, 18);
    this.add.text(x, y - 42, number, {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#1d2923',
    }).setOrigin(0.5).setDepth(8);
    this.add.text(x, y + 3, label, {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#315845', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8);
    this.add.text(x, y + 20, 'ENTER', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold',
      color: '#f5d37a', stroke: '#315845', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8);
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
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1 + bob, 20, 14, 4);
      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8 + bob, 8, 7, 2);
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
