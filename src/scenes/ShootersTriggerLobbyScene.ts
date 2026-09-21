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
  private buyUpgrades() {
    const current = Number(localStorage.getItem('shooters-trigger:budget') || 100);
    const next = Math.max(0, current - 20);
    localStorage.setItem('shooters-trigger:budget', String(next));
    this.scene.start('ShootersTriggerMediaScene', { from: 'equipment', budget: next });
  }

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

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.target = new Phaser.Math.Vector2(p.x, p.y);
    });

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.joystickCleanup?.());
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
    this.locations.forEach(l => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, l.x, l.y) < 90) this.showPrompt(l);
    });
  }

  private interact() {
    const nearest = this.locations.reduce((a, b) =>
      Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y) <
      Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y) ? a : b);
    if (Phaser.Math.Distance.Between(this.player.x,this.player.y,nearest.x,nearest.y) > 110) return;
    const next: Record<string,string> = {
      upgrades: 'buy',
      shooting: 'ShootersTriggerTrainingScene',
      evasion: 'ShootersTriggerEvasionScene',
      media: 'ShootersTriggerMediaScene',
      arena: 'ShootersTriggerArenaScene',
    };
    if (next[nearest.id] === 'buy') this.buyUpgrades(); else this.scene.start(next[nearest.id]);
  }

  private showPrompt(l: Location) {
    if (!this.registry.get('shootersLobbyPrompt')) {
      this.registry.set('shootersLobbyPrompt', l.id);
      this.time.delayedCall(900, () => this.registry.remove('shootersLobbyPrompt'));
    }
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
    this.add.text(1200,140,'AYANDA · BUDGET 100',{fontFamily:'monospace',fontSize:'11px',color:'#e8c95c'}).setOrigin(.5);
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