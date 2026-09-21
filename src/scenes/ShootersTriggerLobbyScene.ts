import Phaser from 'phaser';

type Location = {
  id: 'shooting' | 'evasion' | 'upgrades' | 'media' | 'arena';
  name: string;
  subtitle: string;
  x: number;
  y: number;
  color: number;
  locked: () => boolean;
  lockedText: string;
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

  private locations: Location[] = [
    {
      id: 'shooting',
      name: 'SHOOTING RANGE',
      subtitle: '01 · AIM · FIRE · LEARN',
      x: 690, y: 930, color: 0x285d35,
      locked: () => false, lockedText: '',
    },
    {
      id: 'evasion',
      name: 'EVASION YARD',
      subtitle: '02 · MOVE · COVER · SURVIVE',
      x: 430, y: 620, color: 0x3d6332,
      locked: () => !this.has('shooting'), lockedText: 'COMPLETE SHOOTING FIRST',
    },
    {
      id: 'upgrades',
      name: 'ARMORY & OUTFITTER',
      subtitle: '03 · CHECK · UPGRADE · EQUIP',
      x: 870, y: 340, color: 0x6a5030,
      locked: () => !this.has('evasion'), lockedText: 'COMPLETE EVASION FIRST',
    },
    {
      id: 'media',
      name: 'MEDIA BUREAU',
      subtitle: '04 · REVIEW · REPORT · PREPARE',
      x: 1370, y: 360, color: 0x5c5530,
      locked: () => !this.has('evasion') || !this.hasUpgrade(), lockedText: 'CHECK YOUR TRAINING + LOADOUT FIRST',
    },
    {
      id: 'arena',
      name: 'ARENA GATE',
      subtitle: '05 · 1v1 · FIRST TO 3',
      x: 1780, y: 760, color: 0x633a31,
      locked: () => !this.hasMediaReview(), lockedText: 'REVIEW THE MEDIA BUREAU FIRST',
    },
  ];

  constructor() { super('ShootersTriggerLobbyScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#b58a55');
    this.drawTown();
    this.player = this.createPlayer(1200, 820);
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
      const nearby = this.getNearbyLocation();
      if (nearby.distance < 190 && this.isInsideLocation(nearby.location) && nearby.location.locked()) {
        this.showStatus(nearby.location.lockedText);
        return;
      }
      this.target = new Phaser.Math.Vector2(p.x, p.y);
    });

    this.statusText = this.add.text(width / 2, 78, '', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: '#fff4d4', backgroundColor: '#493526',
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
      align: 'center', wordWrap: { width: width * .78 },
    }).setOrigin(.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    this.add.text(width / 2, 22, 'SHOOTERS TRIGGER · SWEETWATER FIELD TOWN', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: '#fff4d4', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(.5).setScrollFactor(0).setDepth(190);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.joystickCleanup?.();
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
      this.activeLocationId = null;
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

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      this.player.x = Phaser.Math.Clamp(this.player.x + dx / len * 175 * delta / 1000, 70, WORLD_WIDTH - 70);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy / len * 175 * delta / 1000, 120, WORLD_HEIGHT - 70);
    }

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
    const dx = Math.abs(this.player.x - location.x);
    const dy = Math.abs(this.player.y - location.y);
    return dx <= 155 && dy <= 82;
  }

  private interact() {
    const nearby = this.getNearbyLocation();
    if (!nearby || nearby.distance > 230 || !this.isInsideLocation(nearby.location)) return;

    const location = nearby.location;
    if (location.locked()) {
      this.showStatus(location.lockedText);
      return;
    }

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
    if (!nearby || nearby.distance > 235) {
      this.activeLocationId = null;
      return;
    }
    this.activeLocationId = nearby.location.id;
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

  private drawTown() {
    const g=this.add.graphics();
    g.fillStyle(0xb88b57,1).fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);

    // Dust, scrub and fences give the field a western town silhouette without
    // copying a show asset or using a separate art dependency.
    for (let i=0;i<80;i++) {
      const x=(i*313)%WORLD_WIDTH, y=(i*197)%WORLD_HEIGHT, r=2+(i%4);
      g.fillStyle(i%3===0?0x7f8f4e:0x9d7748,.45).fillCircle(x,y,r);
    }

    // Main dirt street: the route itself explains the intended order.
    g.fillStyle(0x8a643f,1).fillRoundedRect(120,700,2060,210,70);
    g.fillStyle(0xa87b4d,1).fillRoundedRect(170,730,1960,150,55);
    g.lineStyle(3,0xc49b67,.7).lineBetween(210,805,2110,805);

    // Cross streets connect the town naturally but the five required stops stay
    // on the main progression road.
    g.fillStyle(0x946c43,1).fillRoundedRect(650,250,150,680,55);
    g.fillStyle(0x946c43,1).fillRoundedRect(1260,260,150,690,55);
    g.fillStyle(0x946c43,1).fillRoundedRect(1680,600,180,620,60);

    // Central square / spawn.
    g.fillStyle(0xc39a61,1).fillCircle(1200,805,170);
    g.lineStyle(5,0xe0bd7e,.65).strokeCircle(1200,805,170);
    this.drawTownBuilding(g,1200,805,260,150,0x5f4a36,'FIELD TOWN SQUARE');
    this.add.text(1200,895,'YOU ARRIVE HERE',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#fff4d4'}).setOrigin(.5);

    this.locations.forEach((l,index)=>{
      this.drawTownBuilding(g,l.x,l.y,300,150,l.color,l.name);
      this.add.text(l.x,l.y+52,l.subtitle,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#f5d37a',align:'center'}).setOrigin(.5);
      this.add.text(l.x,l.y-92,String(index+1).padStart(2,'0'),{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#fff4d4'}).setOrigin(.5);
    });

    // Directional signs are in-world, not floating HUD banners.
    const signs=[
      [920,650,'01 SHOOTING  →'],
      [590,510,'02 EVASION  →'],
      [1010,270,'03 ARMORY  →'],
      [1515,500,'04 MEDIA  →'],
      [1830,650,'05 ARENA  →'],
    ] as const;
    signs.forEach(([x,y,text])=>{
      g.fillStyle(0x4d3827,1).fillRoundedRect(x-78,y-18,156,36,5);
      g.fillStyle(0xd9bb7a,1).fillRect(x-72,y-13,144,26);
      this.add.text(x,y,text,{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#493526',align:'center'}).setOrigin(.5);
    });

    this.add.text(1200,115,'THE FIELD HAS AN ORDER',{fontFamily:'monospace',fontSize:'22px',fontStyle:'bold',color:'#fff4d4',stroke:'#493526',strokeThickness:6}).setOrigin(.5);
    this.add.text(1200,150,'TRAIN → EVADE → EQUIP → REVIEW → ARENA',{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#f5d37a',stroke:'#493526',strokeThickness:3}).setOrigin(.5);

    // Western-town silhouettes: saloon, marshal office, stable and water tower.
    this.drawSideBuilding(g,260,390,220,125,'THE SALOON',0x654632);
    this.drawSideBuilding(g,1900,360,230,125,'MARSHAL OFFICE',0x4f5c43);
    this.drawSideBuilding(g,350,1110,260,120,'STABLES',0x5b432f);
    g.lineStyle(8,0x654632,1).lineBetween(2050,250,2050,610);
    g.lineStyle(5,0x654632,1).strokeCircle(2050,230,70);
    this.add.text(2050,150,'WATER TOWER',{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#fff4d4',stroke:'#493526',strokeThickness:3}).setOrigin(.5);
  }

  private drawTownBuilding(g: Phaser.GameObjects.Graphics, x:number,y:number,w:number,h:number,color:number,label:string) {
    g.fillStyle(0x5b402d,.22).fillEllipse(x,y+h/2+12,w*.72,24);
    g.fillStyle(color,1).fillRoundedRect(x-w/2,y-h/2,w,h,12);
    g.fillStyle(0x493526,1).fillTriangle(x-w/2-8,y-h/2,x,y-h/2-70,x+w/2+8,y-h/2);
    g.fillStyle(0x2f241c,1).fillRect(x-24,y+8,48,72);
    g.fillStyle(0xe8c95c,.65).fillRect(x-8,y+22,16,20);
    this.add.text(x,y-12,label,{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#fff4d4',stroke:'#493526',strokeThickness:4,align:'center',wordWrap:{width:w*.82}}).setOrigin(.5);
  }

  private drawSideBuilding(g: Phaser.GameObjects.Graphics,x:number,y:number,w:number,h:number,label:string,color:number) {
    g.fillStyle(0x5b402d,.22).fillEllipse(x,y+h/2+10,w*.72,20);
    g.fillStyle(color,1).fillRoundedRect(x-w/2,y-h/2,w,h,10);
    g.fillStyle(0x3d2a20,1).fillTriangle(x-w/2-6,y-h/2,x,y-h/2-42,x+w/2+6,y-h/2);
    g.fillStyle(0x2f241c,1).fillRect(x-20,y+4,40,62);
    this.add.text(x,y-4,label,{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#fff4d4',stroke:'#493526',strokeThickness:3,align:'center',wordWrap:{width:w*.82}}).setOrigin(.5);
  }

  private createPlayer(x:number,y:number) {
    const c=this.add.container(x,y);
    const g=this.add.graphics();
    g.fillStyle(0x493526,1).fillEllipse(0,24,34,12);
    g.fillStyle(0x263a2b,1).fillRoundedRect(-14,-2,28,31,8);
    g.fillStyle(0xd8a477,1).fillCircle(0,-22,10);
    g.fillStyle(0x243322,1).fillEllipse(0,-29,26,8);
    g.fillStyle(0x334f35,1).fillRoundedRect(-12,25,9,18,4).fillRoundedRect(3,25,9,18,4);
    c.add(g);
    return c;
  }
}
