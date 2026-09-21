import Phaser from 'phaser';

type Location = { id: string; name: string; subtitle: string; x: number; y: number; color: number };

export class ShootersTriggerLobbyScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();
  private player!: Phaser.GameObjects.Container;
  private playerMoving = false;
  private target: Phaser.Math.Vector2 | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private joystickCleanup?: () => void;
  private locationPrompt?: HTMLButtonElement;
  private activeLocationId: string | null = null;
  private equipmentModal?: HTMLDivElement;

  private locations: Location[] = [
    { id: 'shooting', name: 'SHOOTING LOCATION', subtitle: 'AIM · HIT QUALITY · REWARD', x: 420, y: 620, color: 0x285d35 },
    { id: 'evasion', name: 'EVASION CAMP', subtitle: 'MOVE · COVER · SURVIVE', x: 1160, y: 360, color: 0x3d6332 },
    { id: 'media', name: 'MEDIA COVERAGE CENTER', subtitle: 'STATS · THOUGHTS · EQUIPMENT', x: 1870, y: 610, color: 0x5c5530 },
    { id: 'upgrades', name: 'EQUIPMENT STORE', subtitle: 'BUY UPGRADES · SPEND BUDGET', x: 430, y: 1110, color: 0x6a5030 },
    { id: 'arena', name: 'ARENA LOCATION', subtitle: '3v3 · FIRST TO 3 KILLS', x: 1190, y: 1080, color: 0x633a31 },
  ];

  constructor() { super('ShootersTriggerLobbyScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#567d42');
    this.drawWorld();
    this.player = this.createUnarmedPlayer(1190, 760);
    this.player.setDepth(20);
    this.cameras.main.setBounds(0, 0, 2400, 1400);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(Math.min(width * .28, 320), Math.min(height * .22, 150));
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.installWalkJoystick();
    this.createLocationPrompt();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.target = new Phaser.Math.Vector2(p.x, p.y);
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.joystickCleanup?.();
      this.locationPrompt?.remove();
      this.locationPrompt = undefined;
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
      this.activeLocationId = null;
    });
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
      dx = this.target.x - this.player.x; dy = this.target.y - this.player.y;
      if (Math.hypot(dx, dy) < 10) this.target = null;
    }
    this.playerMoving = !!(dx || dy);
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1, d = 175 * delta / 1000;
      this.player.x = Phaser.Math.Clamp(this.player.x + dx / len * d, 50, 2350);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy / len * d, 90, 1350);
    }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();
    this.updateLocationPrompt();
  }

  private getBudget() {
    try {
      return Number(localStorage.getItem('shooters-trigger:budget') || 100);
    } catch {
      return 100;
    }
  }

  private buyUpgrades() {
    const current = this.getBudget();
    const next = Math.max(0, current - 20);
    localStorage.setItem('shooters-trigger:budget', String(next));
    this.scene.start('ShootersTriggerMediaScene', { from: 'equipment', budget: next });
  }

  private interact() {
    const nearest = this.locations.reduce((a, b) =>
      Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y) <
      Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y) ? a : b);
    if (Phaser.Math.Distance.Between(this.player.x,this.player.y,nearest.x,nearest.y) > 130) return;

    const next: Record<string,string> = {
      shooting: 'ShootersTriggerTrainingScene',
      evasion: 'ShootersTriggerEvasionScene',
      media: 'ShootersTriggerMediaScene',
      arena: 'ShootersTriggerArenaScene',
    };

    if (nearest.id === 'upgrades') this.openEquipmentStore();
    else this.scene.start(next[nearest.id]);
  }

  private openEquipmentStore() {
    if (this.equipmentModal) return;

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '1500',
      display: 'grid',
      placeItems: 'center',
      padding: '24px',
      background: 'rgba(10,18,13,.72)',
      fontFamily: 'monospace',
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(460px, 92vw)',
      padding: '24px',
      border: '2px solid #e8c95c',
      borderRadius: '14px',
      background: '#172219',
      color: '#f4f1df',
      boxShadow: '0 10px 30px rgba(0,0,0,.35)',
      textAlign: 'center',
    });

    const title = document.createElement('div');
    title.textContent = 'EQUIPMENT STORE';
    title.style.cssText = 'font-size:18px;font-weight:800;color:#e8c95c;letter-spacing:1px;margin-bottom:12px;';
    const detail = document.createElement('div');
    detail.textContent = `UPGRADE PACKAGE · 20 BUDGET · AVAILABLE ${this.getBudget()}`;
    detail.style.cssText = 'font-size:11px;line-height:1.6;margin-bottom:20px;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';

    const makeButton = (label: string) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      Object.assign(button.style, {
        minWidth: '150px',
        minHeight: '48px',
        padding: '10px 14px',
        border: '2px solid #f4f1df',
        borderRadius: '10px',
        background: '#102018',
        color: '#f4f1df',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontWeight: '800',
        touchAction: 'manipulation',
      });
      return button;
    };

    const buy = makeButton('BUY UPGRADE · 20');
    const cancel = makeButton('CANCEL · HOME FIELD');
    buy.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
      this.buyUpgrades();
    });
    cancel.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.equipmentModal?.remove();
      this.equipmentModal = undefined;
    });

    actions.append(buy, cancel);
    card.append(title, detail, actions);
    modal.appendChild(card);
    document.body.appendChild(modal);
    this.equipmentModal = modal;
  }

  private createLocationPrompt() {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Enter nearby Shooters Trigger location');
    Object.assign(button.style, {
      position: 'fixed',
      left: '50%',
      bottom: 'max(22px, env(safe-area-inset-bottom))',
      transform: 'translateX(-50%) translateY(12px)',
      minWidth: 'min(340px, calc(100vw - 36px))',
      minHeight: '58px',
      padding: '12px 22px',
      border: '2px solid #f4f1df',
      borderRadius: '12px',
      background: '#102018',
      color: '#f4f1df',
      fontFamily: 'monospace',
      fontSize: '13px',
      fontWeight: '800',
      letterSpacing: '1px',
      boxShadow: '0 6px 0 rgba(0,0,0,.28)',
      zIndex: '1450',
      display: 'none',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    });
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.interact();
    });
    document.body.appendChild(button);
    this.locationPrompt = button;
  }

  private updateLocationPrompt() {
    const distances = this.locations.map((location) => ({
      location,
      distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y),
    }));
    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances[0];

    if (!nearest || nearest.distance > 150) {
      if (this.locationPrompt) this.locationPrompt.style.display = 'none';
      this.activeLocationId = null;
      return;
    }

    const action = nearest.location.id === 'upgrades' ? 'OPEN EQUIPMENT STORE' : `ENTER ${nearest.location.name}`;
    if (this.locationPrompt) {
      this.locationPrompt.textContent = action + '  ·  E';
      this.locationPrompt.style.display = 'block';
      this.locationPrompt.style.opacity = nearest.distance <= 130 ? '1' : '0.62';
      this.locationPrompt.style.transform = 'translateX(-50%) translateY(0)';
    }
    this.activeLocationId = nearest.location.id;
  }

  private installWalkJoystick() {
    if (!('ontouchstart' in window) && navigator.maxTouchPoints < 1) return;
    const root=document.createElement('div');
    Object.assign(root.style,{position:'fixed',left:'18px',bottom:'18px',width:'112px',height:'112px',border:'2px solid rgba(244,241,223,.7)',borderRadius:'50%',background:'rgba(16,32,24,.5)',zIndex:'1400',touchAction:'none'});
    const knob=document.createElement('div');
    Object.assign(knob.style,{position:'absolute',left:'50%',top:'50%',width:'48px',height:'48px',margin:'-24px',borderRadius:'50%',background:'#1f6b4b',border:'2px solid #f4f1df'});
    root.appendChild(knob); document.body.appendChild(root);
    let id:number|null=null;
    const reset=()=>{id=null;knob.style.transform='translate(0,0)';this.joystickVector.set(0,0);};
    const move=(e:PointerEvent)=>{if(id!==e.pointerId)return;const r=root.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy)||1,max=38,k=Math.min(1,max/len);knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;this.joystickVector.set(dx/len*Math.min(1,len/max),dy/len*Math.min(1,len/max));};
    root.onpointerdown=e=>{e.preventDefault();e.stopPropagation();id=e.pointerId;root.setPointerCapture?.(e.pointerId);move(e);};
    root.onpointermove=move; root.onpointerup=reset; root.onpointercancel=reset; root.onlostpointercapture=reset;
    this.joystickCleanup=()=>root.remove();
  }

  private drawWorld() {
    const g = this.add.graphics();
    g.fillStyle(0x6d934f,1).fillRect(0,0,2400,1400);
    g.lineStyle(6,0xd8e4c7,.65);
    g.strokeRect(34,70,2332,1290);
    g.lineStyle(2,0x9fba78,.5);
    for (let x=100;x<2350;x+=180) g.lineBetween(x,90,x,1340);
    for (let y=120;y<1340;y+=150) g.lineBetween(50,y,2350,y);
    this.locations.forEach(l => {
      g.fillStyle(l.color,1).fillRoundedRect(l.x-150,l.y-72,300,144,18);
      g.lineStyle(3,0xe8c95c,.7).strokeRoundedRect(l.x-150,l.y-72,300,144,18);
      this.add.text(l.x,l.y-8,l.name,{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:'#f4f1df',align:'center',wordWrap:{width:270}}).setOrigin(.5);
      this.add.text(l.x,l.y+45,l.subtitle,{fontFamily:'monospace',fontSize:'9px',color:'#e8c95c',align:'center'}).setOrigin(.5);
    });
    this.add.text(1200,105,'SHOOTERS TRIGGER · HOME FIELD',{fontFamily:'monospace',fontSize:'22px',fontStyle:'bold',color:'#f4f1df'}).setOrigin(.5);
    this.add.text(1200,140,`AYANDA · BUDGET ${this.getBudget()}`,{fontFamily:'monospace',fontSize:'11px',color:'#e8c95c'}).setOrigin(.5);
    this.add.text(1200,166,'WALK TO A LOCATION · TAP ENTER OR PRESS E',{fontFamily:'monospace',fontSize:'10px',color:'#f4f1df',alpha:0.78}).setOrigin(.5);
  }

  private createUnarmedPlayer(x:number,y:number) {
    const c=this.add.container(x,y);
    const body=this.add.graphics();
    body.fillStyle(0x263a2b,1).fillRoundedRect(-14,-9,28,32,8);
    body.fillStyle(0xd8a477,1).fillCircle(0,-22,10);
    body.fillStyle(0x243322,1).fillEllipse(0,-29,24,8);
    body.fillStyle(0x334f35,1).fillRoundedRect(-12,8,9,18,4).fillRoundedRect(3,8,9,18,4);
    c.add(body); return c;
  }
}
