import Phaser from 'phaser';

type WardrobeAction =
  | 'IDLE'
  | 'WALK'
  | 'WALK LEFT'
  | 'WALK RIGHT'
  | 'AIM LEFT'
  | 'AIM RIGHT'
  | 'FIRE'
  | 'BODY HIT'
  | 'HEADSHOT'
  | 'DEATH'
  | 'RESPAWN';

const ACTIONS: WardrobeAction[] = [
  'IDLE',
  'WALK',
  'WALK LEFT',
  'WALK RIGHT',
  'AIM LEFT',
  'AIM RIGHT',
  'FIRE',
  'BODY HIT',
  'HEADSHOT',
  'DEATH',
  'RESPAWN',
];

type WardrobeVariant = {
  name: string;
  shirt: number;
  shirtLight: number;
  pants: number;
  accent: number;
  hat: number;
  skin: number;
  hair: number;
  style: 'FIELD' | 'UTILITY' | 'URBAN' | 'TRAIL';
  gear: 'BANDANA' | 'VEST' | 'HOODIE' | 'CAP';
};

const VARIANTS: WardrobeVariant[] = [
  { name: 'FIELD GREEN', shirt: 0x2f6b4e, shirtLight: 0x4f8b65, pants: 0x566052, accent: 0xe8c95c, hat: 0x5a7348, skin: 0xd4a45d, hair: 0x3b2f28, style: 'FIELD', gear: 'CAP' },
  { name: 'DUST TRAIL', shirt: 0x7b5a3b, shirtLight: 0xa47a4c, pants: 0x5d5145, accent: 0xd9b36c, hat: 0x6f593f, skin: 0xb9784e, hair: 0x2d211c, style: 'TRAIL', gear: 'BANDANA' },
  { name: 'DARK UTILITY', shirt: 0x30483f, shirtLight: 0x50685a, pants: 0x343b38, accent: 0xd66a3d, hat: 0x29342f, skin: 0x8f5d43, hair: 0x1e1815, style: 'UTILITY', gear: 'VEST' },
  { name: 'TEAL RUNNER', shirt: 0x24676a, shirtLight: 0x4b9291, pants: 0x46535a, accent: 0xe8c95c, hat: 0x315f62, skin: 0xc98d62, hair: 0x4a3025, style: 'URBAN', gear: 'HOODIE' },
];

export class WardrobeIntroScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private poseClock = 0;
  private leaving = false;

  constructor() {
    super('WardrobeIntroScene');
  }

  preload() {
    const base = '/assets/wardrobe/field-operator-01/';
    this.load.image('field-operator-down', base + 'front-idle.svg');
    this.load.image('field-operator-up', base + 'back-idle.svg');
    this.load.image('field-operator-left', base + 'left-idle.svg');
    this.load.image('field-operator-right', base + 'right-idle.svg');
    this.load.image('field-operator-down-walk0', base + 'front-walk0.svg');
    this.load.image('field-operator-down-walk1', base + 'front-walk1.svg');
    this.load.image('field-operator-left-walk0', base + 'left-walk0.svg');
    this.load.image('field-operator-left-walk1', base + 'left-walk1.svg');
    this.load.image('field-operator-right-walk0', base + 'right-walk0.svg');
    this.load.image('field-operator-right-walk1', base + 'right-walk1.svg');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#171b19');

    const g = this.add.graphics();
    g.fillStyle(0x171b19, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x24352c, 1).fillRect(0, 0, width, 58);
    g.fillStyle(0x101512, 1).fillRect(0, height - 82, width, 82);

    this.add.text(28, 20, 'WARDROBE · CHARACTER LAB', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f4f1df',
    }).setOrigin(0, 0.5);

    this.add.text(width - 28, 20, 'SHOOTERS TRIGGER · PLAYER COPY', {
      fontFamily: 'monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#e8c95c',
    }).setOrigin(1, 0.5);

    const panelW = Math.min(width * 0.86, 760);
    const panelH = Math.min(height * 0.58, 410);
    const panel = this.add.rectangle(width / 2, height * 0.49, panelW, panelH, 0x202a24, 1)
      .setStrokeStyle(2, 0x526d5d, 1);

    this.add.text(panel.x, panel.y - panel.height * 0.38, 'THE CHARACTER WORKBENCH', {
      fontFamily: 'monospace',
      fontSize: Math.max(20, Math.min(34, Math.min(width, height) * 0.055)) + 'px',
      fontStyle: 'bold',
      color: '#e8c95c',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(panel.x, panel.y - panel.height * 0.22,
      'Exact Home Field copy first.\n\nNow the lab can play the character through discrete actions\nso we can judge the movement before touching the real game.',
      {
        fontFamily: 'monospace',
        fontSize: Math.max(11, Math.min(15, Math.min(width, height) * 0.024)) + 'px',
        color: '#d8dfd8',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: panelW * 0.82 },
      }).setOrigin(0.5);

    this.player = this.createCharacter(panel.x, panel.y + panel.height * 0.12);
    this.player.setScale(Math.min(2.8, Math.max(1.8, Math.min(width, height) / 220)));

    const toolLine = this.add.text(panel.x, panel.y + panel.height * 0.36,
      'REFERENCE COPY · OPEN THE LAB TO PLAY ACTIONS',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#8fb39b',
        align: 'center',
      }).setOrigin(0.5);

    const enter = this.add.text(width / 2, height - 40, 'TAP / ENTER · OPEN LAB', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f4f1df',
      backgroundColor: '#315845',
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });

    const continueLab = () => this.openLab();
    enter.on('pointerdown', continueLab);
    this.input.keyboard?.on('keydown-ENTER', continueLab);
    this.input.keyboard?.on('keydown-SPACE', continueLab);

    this.tweens.add({ targets: toolLine, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', continueLab);
      this.input.keyboard?.off('keydown-SPACE', continueLab);
      enter.destroy();
    });
  }

  update(_time: number, delta: number) {
    this.poseClock += delta;
    if (!this.player) return;
    const baseY = this.scale.height * 0.49 + Math.min(this.scale.height * 0.58, 410) * 0.12;
    this.player.setY(baseY + Math.sin(this.poseClock / 420) * 1.2);
  }

  private openLab() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('WardrobeLabScene');
  }

  private createCharacter(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 40, 34, 12, 0x000000, 0.28);
    const body = this.drawCharacter('IDLE');
    container.add([shadow, body]);
    return container;
  }

  private drawCharacter(action: WardrobeAction): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const walking = action === 'WALK' || action === 'WALK LEFT' || action === 'WALK RIGHT';
    const step = walking ? 2 : 0;
    const lean = action === 'WALK LEFT' ? -2 : action === 'WALK RIGHT' ? 2 : 0;
    const aim = action === 'AIM LEFT' || action === 'AIM RIGHT' || action === 'FIRE';
    const aimDir = action === 'AIM LEFT' ? -1 : 1;
    const hit = action === 'BODY HIT';
    const headshot = action === 'HEADSHOT';
    const dead = action === 'DEATH';

    const bob = walking ? 1 : 0;
    const legOffset = walking ? step : 0;
    const armDrop = aim ? -7 : 0;

    if (!dead) {
      g.fillStyle(0x3b2f28, 1).fillEllipse(0 + lean, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0 + lean, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1)
        .fillCircle(-7 + lean, -17 + bob, 2.5)
        .fillCircle(7 + lean, -17 + bob, 2.5);
      g.fillStyle(0x5a7348, 1).fillEllipse(0 + lean, -23 + bob, 25, 12);

      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4 + lean, -8 + bob, 8, 7, 2);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15 + lean, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10 + lean, -1 + bob, 20, 14, 4);

      if (aim) {
        g.fillStyle(0x2f6b4e, 1)
          .fillRoundedRect(-16 + lean, -2 + bob, 7, 17, 3)
          .fillRoundedRect(9 + lean, -9 + armDrop + bob, 7, 20, 3);
        g.fillStyle(0xd4a45d, 1)
          .fillCircle(-13 + lean, 14 + bob, 3)
          .fillCircle(15 + lean, -11 + armDrop + bob, 3);
        this.drawMarker(g, aimDir, 15 + lean, -12 + armDrop + bob, action === 'FIRE');
      } else {
        g.fillStyle(0x2f6b4e, 1)
          .fillRoundedRect(-17 + lean, 0 + bob, 7, 15, 3)
          .fillRoundedRect(10 + lean, 0 + bob, 7, 15, 3);
        g.fillStyle(0xd4a45d, 1)
          .fillCircle(-14 + lean, 15 + bob, 3)
          .fillCircle(14 + lean, 15 + bob, 3);
      }

      g.fillStyle(0x29372f, 1).fillRoundedRect(-11 + lean, 16 + bob, 22, 7, 3);
      g.fillStyle(0x566052, 1)
        .fillRoundedRect(-10 + lean + legOffset, 20 + bob, 8, 13, 2)
        .fillRoundedRect(2 + lean - legOffset, 20 + bob, 8, 13, 2);
      g.fillStyle(0x202522, 1)
        .fillRoundedRect(-12 + lean + legOffset, 30 + bob, 10, 7, 2)
        .fillRoundedRect(2 + lean - legOffset, 30 + bob, 10, 7, 2);
    } else {
      g.setRotation(-0.95);
      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17, 13, 12);
      g.fillStyle(0x5a7348, 1).fillEllipse(0, -23, 25, 12);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4, 30, 22, 8);
      g.fillStyle(0x566052, 1)
        .fillRoundedRect(-10, 20, 8, 13, 2)
        .fillRoundedRect(2, 20, 8, 13, 2);
      g.fillStyle(0x202522, 1)
        .fillRoundedRect(-12, 30, 10, 7, 2)
        .fillRoundedRect(2, 30, 10, 7, 2);
    }

    if (hit) {
      g.fillStyle(0xd66a3d, 0.9).fillCircle(-10, 2, 5).fillCircle(9, 7, 4);
      g.lineStyle(2, 0xf0dfb6, 0.9);
      g.strokeCircle(-10, 2, 8);
      g.strokeCircle(9, 7, 7);
    }

    if (headshot) {
      g.fillStyle(0xd66a3d, 0.95).fillCircle(3, -20, 5);
      g.fillStyle(0xf0dfb6, 0.85).fillCircle(3, -20, 2);
    }

    return g;
  }

  private drawMarker(
    g: Phaser.GameObjects.Graphics,
    direction: number,
    x: number,
    y: number,
    firing: boolean,
  ) {
    const markerLength = firing ? 30 : 25;
    const endX = x + direction * markerLength;
    g.fillStyle(0x202522, 1).fillRoundedRect(x, y - 3, direction * markerLength, 6, 2);
    g.fillStyle(0x566052, 1).fillRoundedRect(endX - direction * 5, y - 5, 6, 10, 2);

    if (firing) {
      g.fillStyle(0xf0dfb6, 1).fillTriangle(
        endX + direction * 12, y,
        endX + direction * 2, y - 7,
        endX + direction * 2, y + 7,
      );
      g.fillStyle(0xd66a3d, 0.9).fillCircle(endX + direction * 5, y, 4);
    }
  }
}

export class WardrobeLabScene extends Phaser.Scene {
  private character!: Phaser.GameObjects.Container;
  private preview!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Ellipse;
  private actionText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private stepText!: Phaser.GameObjects.Text;
  private actionIndex = 0;
  private playing = false;
  private playTimer?: Phaser.Time.TimerEvent;
  private actionButtons: Phaser.GameObjects.Rectangle[] = [];
  private variantButtons: Phaser.GameObjects.Rectangle[] = [];
  private variantIndex = 0;
  private move = new Phaser.Math.Vector2();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private walkClock = 0;
  private spriteLabel!: Phaser.GameObjects.Text;
  private directionLabel!: Phaser.GameObjects.Text;
  private direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' = 'DOWN';
  private previewSprite!: Phaser.GameObjects.Image;
  private walkFrame = 0;
  private walkFrameClock = 0;

  constructor() {
    super('WardrobeLabScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#78a653');
    this.cameras.main.setBounds(0,0,2400,1400);
    this.drawWardrobeField();
    this.add.rectangle(width/2,34,width,68,0x101512,0.86).setScrollFactor(0).setDepth(100);
    this.add.text(18,18,'WARDROBE · FIELD LAB',{fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',color:'#f4f1df'}).setScrollFactor(0).setDepth(101);
    this.add.text(18,42,'MOVE THE COPY · SWAP SPRITES · JUDGE THE LOOK IN THE SHOOTERS FIELD',{fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#8fb39b'}).setScrollFactor(0).setDepth(101);
    this.spriteLabel=this.add.text(width-18,18,'',{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#e8c95c',align:'right'}).setOrigin(1,0).setScrollFactor(0).setDepth(101);
    this.directionLabel=this.add.text(width-18,42,'',{fontFamily:'monospace',fontSize:'7px',color:'#f4f1df',align:'right'}).setOrigin(1,0).setScrollFactor(0).setDepth(101);
    this.shadow=this.add.ellipse(1180,891,42,14,0x000000,0.25).setDepth(20);
    this.character=this.add.container(1180,860).setDepth(21);
    this.previewSprite=this.add.image(0,-2,'field-operator-down').setDisplaySize(58,76);
    this.character.add(this.previewSprite); this.setSprite();
    this.cameras.main.startFollow(this.character,true,0.12,0.12);
    this.cameras.main.setDeadzone(Math.min(width*0.28,300),Math.min(height*0.22,150));
    this.createFieldJoystick(); this.createSpriteStrip();
    this.cursors=this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-R',()=>this.resetCharacter());
    this.scale.on(Phaser.Scale.Events.RESIZE,this.handleResize,this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.scale.off(Phaser.Scale.Events.RESIZE,this.handleResize,this);this.input.keyboard?.removeAllListeners();});
    this.updateLabels(); window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }

  update(_time:number,delta:number) {
    const kx=(this.cursors.right.isDown?1:0)-(this.cursors.left.isDown?1:0), ky=(this.cursors.down.isDown?1:0)-(this.cursors.up.isDown?1:0);
    const x=Math.abs(this.move.x)>.05?this.move.x:kx, y=Math.abs(this.move.y)>.05?this.move.y:ky, len=Math.hypot(x,y);
    if(len>.05){
      const nx=x/Math.max(1,len),ny=y/Math.max(1,len);
      this.character.x=Phaser.Math.Clamp(this.character.x+nx*180*delta/1000,80,2320);
      this.character.y=Phaser.Math.Clamp(this.character.y+ny*180*delta/1000,80,1320);
      this.shadow.setPosition(this.character.x,this.character.y+31);
      this.direction=Math.abs(nx)>Math.abs(ny)*.65?(nx<0?'LEFT':'RIGHT'):(ny<0?'UP':'DOWN');
      this.walkClock+=delta;if(this.walkClock>=150){this.walkClock=0;this.walkFrame=this.walkFrame?0:1;this.setSprite();}
    }else{this.walkFrame=0;this.setSprite();}
    this.directionLabel.setText('FACING · '+this.direction+' · CAMERA FOLLOWS');
  }


  private setSprite(){const k=this.direction==='DOWN'?(this.walkFrame?'field-operator-down-walk'+this.walkFrame:'field-operator-down'):this.direction==='UP'?'field-operator-up':this.direction==='LEFT'?(this.walkFrame?'field-operator-left-walk'+this.walkFrame:'field-operator-left'):(this.walkFrame?'field-operator-right-walk'+this.walkFrame:'field-operator-right');this.previewSprite.setTexture(k).setDisplaySize(58,76);}
  private createSpriteStrip(){const y=this.scale.height-58;['01 · SWAP','02 · SWAP','03 · SWAP','04 · SWAP'].forEach((label,i)=>{const b=this.add.text(16+i*82,y,label,{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#f4f1df',backgroundColor:i===this.variantIndex?'#315845':'#202a24',padding:{left:8,right:8,top:7,bottom:7}}).setScrollFactor(0).setDepth(102).setInteractive();b.on('pointerdown',()=>this.selectVariant(i));});this.add.text(this.scale.width-16,y,'RESET POSITION',{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#f4f1df',backgroundColor:'#315845',padding:{left:10,right:10,top:7,bottom:7}}).setOrigin(1,0).setScrollFactor(0).setDepth(102).setInteractive().on('pointerdown',()=>this.resetCharacter());}
  private createFieldJoystick(){const x=72,y=this.scale.height-112,base=this.add.circle(x,y,48,0x101512,.48).setScrollFactor(0).setDepth(102).setStrokeStyle(2,0xe8c95c,.55),knob=this.add.circle(x,y,20,0x315845,.92).setScrollFactor(0).setDepth(103);let pid=-1;const reset=()=>{pid=-1;this.move.set(0,0);knob.setPosition(x,y);};this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.y<75||p.x>this.scale.width-180)return;if(Phaser.Math.Distance.Between(p.x,p.y,x,y)<=90)pid=p.id;});this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(p.id!==pid)return;const dx=p.x-x,dy=p.y-y,d=Math.min(48,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);knob.setPosition(x+Math.cos(a)*d,y+Math.sin(a)*d);this.move.set(Math.cos(a)*d/48,Math.sin(a)*d/48);});this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(p.id===pid)reset();});this.add.text(x,y+56,'MOVE',{fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#f4f1df'}).setOrigin(.5).setScrollFactor(0).setDepth(102);}
  private selectVariant(index:number){this.variantIndex=index;this.updateLabels();this.setSprite();}
  private updateLabels(){this.spriteLabel?.setText('SPRITE SLOT '+String(this.variantIndex+1).padStart(2,'0')+' · FIELD OPERATOR 01');}
  private resetCharacter(){this.character.setPosition(1180,860);this.shadow.setPosition(1180,891);this.move.set(0,0);this.direction='DOWN';this.walkFrame=0;this.setSprite();}
  private drawWardrobeField(){const g=this.add.graphics().setDepth(0);g.fillStyle(0x78a653,1).fillRect(0,0,2400,1400);g.fillStyle(0x86ad5e,.42).fillRect(0,0,1200,1400);g.fillStyle(0x679346,.32).fillRect(1200,0,1200,1400);g.fillStyle(0xd1b46c,.30).fillRect(0,510,2400,92);g.fillStyle(0xd1b46c,.22).fillRect(870,0,100,1400);g.lineStyle(5,0xf4f1df,.48).strokeRect(55,70,2290,1280);[[300,280,1.15],[2050,300,.95],[350,1110,.9],[2070,1090,1.1]].forEach(v=>this.drawWardrobeTree(v[0],v[1],v[2]));[[690,360,190,72],[1470,350,230,76],[520,760,250,70],[1570,760,220,68],[850,1030,260,74],[1420,1080,240,72]].forEach(v=>this.drawWardrobeBunker(v[0],v[1],v[2],v[3]));[[1080,300],[1900,650],[730,1170]].forEach(v=>this.drawWardrobeTires(v[0],v[1]));const f=this.add.graphics().setDepth(4);f.fillStyle(0x594838,1).fillRect(1180,860,4,78);f.fillStyle(0x2f7775,1).fillTriangle(1184,864,1244,878,1184,892);this.add.text(1212,910,'WARDROBE',{fontFamily:'monospace',fontSize:'9px',color:'#fff4d4',stroke:'#493526',strokeThickness:4}).setOrigin(.5).setDepth(5);}
  private drawWardrobeTree(x:number,y:number,s:number){const g=this.add.graphics().setDepth(2);g.fillStyle(0x65472f,1).fillRect(x-6*s,y+18*s,12*s,60*s);g.fillStyle(0x405638,1).fillCircle(x,y,34*s).fillCircle(x-28*s,y+9*s,28*s).fillCircle(x+28*s,y+9*s,29*s);g.fillStyle(0x526d3c,.75).fillCircle(x+5*s,y-16*s,23*s);}
  private drawWardrobeBunker(x:number,y:number,w:number,h:number){const g=this.add.graphics().setDepth(3);g.fillStyle(0x493526,.24).fillRect(x+8,y+9,w,h);g.fillStyle(0x76563b,1).fillRoundedRect(x,y,w,h,10);g.fillStyle(0xffffff,.12).fillRect(x+12,y+10,w-24,5);g.lineStyle(2,0xf4f1df,.28).strokeRoundedRect(x,y,w,h,10);}
  private drawWardrobeTires(x:number,y:number){const g=this.add.graphics().setDepth(3);for(let i=0;i<4;i++){g.fillStyle(0x2b302d,1).fillCircle(x+i*17,y-i*3,19);g.fillStyle(0x66706a,1).fillCircle(x+i*17,y-i*3,7);}}

  private makeButton(x: number, y: number, width: number, label: string) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f4f1df',
      backgroundColor: '#315845',
      padding: { left: 15, right: 15, top: 10, bottom: 10 },
      align: 'center',
      fixedWidth: width,
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });
    return button;
  }

  private showVariant(index: number) {
    this.variantIndex = (index + VARIANTS.length) % VARIANTS.length;
    this.variantButtons.forEach((button, i) => {
      button.setFillStyle(i === this.variantIndex ? 0x315845 : 0x202a24, 1);
      button.setStrokeStyle(i === this.variantIndex ? 2 : 1, i === this.variantIndex ? 0xe8c95c : 0x526d5d, 1);
    });
    this.drawPreview(ACTIONS[this.actionIndex]);
    this.detailText.setText(this.describe(ACTIONS[this.actionIndex]) + ' · ' + this.direction + ' · FIELD OPERATOR 01');
  }

  private showAction(index: number, stopPlayback = true) {
    this.actionIndex = (index + ACTIONS.length) % ACTIONS.length;
    const action = ACTIONS[this.actionIndex];

    if (stopPlayback) this.stopFlow();
    this.actionText.setText(action);
    this.stepText.setText(
      'DISCRETE ACTION ' + String(this.actionIndex + 1).padStart(2, '0') +
      ' / ' + String(ACTIONS.length).padStart(2, '0')
    );

    this.actionButtons.forEach((button, i) => {
      button.setFillStyle(i === this.actionIndex ? 0x315845 : 0x202a24, 1);
      button.setStrokeStyle(i === this.actionIndex ? 2 : 1, i === this.actionIndex ? 0xe8c95c : 0x526d5d, 1);
    });

    this.preview.clear();
    this.drawPreview(action);
    this.detailText.setText(this.describe(action) + ' · ' + this.direction + ' · FIELD OPERATOR 01');

    this.playActionMotion(action);
  }

  private drawPreview(action: WardrobeAction) {
    const walking = action === 'WALK' || action === 'WALK LEFT' || action === 'WALK RIGHT';
    const frame = walking ? this.walkFrame : 0;
    const key = this.getSpriteKey(frame);
    this.previewSprite.setTexture(key).setDisplaySize(48, 64).setOrigin(0.5, 0.5);
    this.preview.clear().setRotation(0);

    if (action === 'AIM LEFT' || action === 'AIM RIGHT' || action === 'FIRE') {
      const direction = action === 'AIM LEFT' ? -1 : 1;
      const y = this.direction === 'UP' ? -2 : this.direction === 'DOWN' ? 7 : 2;
      const x = this.direction === 'LEFT' ? -26 : this.direction === 'RIGHT' ? 26 : direction * 20;
      this.preview.fillStyle(0x202522, 1).fillRoundedRect(x - direction * 12, y - 2, direction * 24, 4, 2);
      this.preview.fillStyle(0x596a61, 1).fillCircle(x + direction * 14, y, 3);
    }

    if (action === 'FIRE') {
      const direction = this.direction === 'LEFT' ? -1 : 1;
      const x = this.direction === 'UP' || this.direction === 'DOWN' ? direction * 34 : direction * 38;
      this.preview.fillStyle(0xe8c95c, 1).fillTriangle(x, 0, x - direction * 10, -7, x - direction * 10, 7);
      this.preview.fillStyle(0xd66a3d, 0.95).fillCircle(x - direction * 3, 0, 4);
    }

    if (action === 'BODY HIT') {
      this.preview.fillStyle(0xd66a3d, 0.92).fillCircle(-11, 8, 5).fillCircle(10, 10, 4);
      this.preview.lineStyle(2, 0xf0dfb6, 0.9).strokeCircle(-11, 8, 8).strokeCircle(10, 10, 7);
    }

    if (action === 'HEADSHOT') {
      this.preview.fillStyle(0xd66a3d, 0.95).fillCircle(8, -22, 5);
      this.preview.fillStyle(0xf0dfb6, 0.85).fillCircle(8, -22, 2);
    }

    if (action === 'DEATH') {
      this.previewSprite.setRotation(-0.85);
      this.preview.setRotation(-0.85);
    }
  }

  private getSpriteKey(frame: number) {
    if (this.direction === 'UP') return 'field-operator-up';
    if (this.direction === 'LEFT') return frame ? 'field-operator-left-walk1' : 'field-operator-left-walk0';
    if (this.direction === 'RIGHT') return frame ? 'field-operator-right-walk1' : 'field-operator-right-walk0';
    return frame ? 'field-operator-down-walk1' : 'field-operator-down-walk0';
  }

  private setDirection(direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT') {
    this.direction = direction;
    this.walkFrame = 0;
    this.walkFrameClock = 0;
    this.drawPreview(ACTIONS[this.actionIndex]);
    this.detailText?.setText(this.describe(ACTIONS[this.actionIndex]) + ' · ' + direction + ' · FIELD OPERATOR 01');
  }


  private describe(action: WardrobeAction) {
    const descriptions: Record<WardrobeAction, string> = {
      'IDLE': 'REFERENCE · neutral standing pose',
      'WALK': 'LOCOMOTION · alternating leg step',
      'WALK LEFT': 'DIRECTION · body leans left while walking',
      'WALK RIGHT': 'DIRECTION · body leans right while walking',
      'AIM LEFT': 'COMBAT · marker raised toward left',
      'AIM RIGHT': 'COMBAT · marker raised toward right',
      'FIRE': 'COMBAT · aim + marker + paintball muzzle flash',
      'BODY HIT': 'DAMAGE · visible paint impact on torso',
      'HEADSHOT': 'DAMAGE · visible paint impact on head',
      'DEATH': 'STATE CHANGE · character falls and rotates',
      'RESPAWN': 'RECOVERY · returns upright to neutral',
    };
    return descriptions[action];
  }

  private playActionMotion(action: WardrobeAction) {
    this.tweens.killTweensOf(this.character);
    this.tweens.killTweensOf(this.shadow);

    this.character.setRotation(0).setAlpha(1).setScale(
      Math.min(5.2, Math.max(3.2, Math.min(this.scale.width, this.scale.height) / 145))
    );
    this.shadow.setScale(1).setAlpha(0.28);

    if (action === 'WALK' || action === 'WALK LEFT' || action === 'WALK RIGHT') {
      this.tweens.add({
        targets: [this.character, this.shadow],
        x: '+=18',
        duration: 360,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: 1,
      });
    } else if (action === 'FIRE') {
      this.tweens.add({
        targets: this.character,
        x: '+=7',
        duration: 80,
        ease: 'Quad.out',
        yoyo: true,
        repeat: 1,
      });
    } else if (action === 'BODY HIT' || action === 'HEADSHOT') {
      this.tweens.add({
        targets: this.character,
        x: '+=5',
        duration: 70,
        yoyo: true,
        repeat: 2,
      });
    } else if (action === 'DEATH') {
      this.tweens.add({
        targets: this.character,
        y: '+=28',
        rotation: -0.95,
        alpha: 0.9,
        duration: 520,
        ease: 'Quad.in',
      });
      this.tweens.add({
        targets: this.shadow,
        scaleX: 1.25,
        scaleY: 0.75,
        duration: 520,
        ease: 'Quad.in',
      });
    } else if (action === 'RESPAWN') {
      this.character.setAlpha(0).setY(benchCenterY(this.scale.height));
      this.tweens.add({
        targets: this.character,
        alpha: 1,
        y: benchCenterY(this.scale.height) - 8,
        duration: 380,
        ease: 'Back.out',
      });
    }
  }

  private toggleFlow(button: Phaser.GameObjects.Text) {
    if (this.playing) {
      this.stopFlow();
      button.setText('▶ FLOW THROUGH ALL');
      return;
    }

    this.playing = true;
    button.setText('■ STOP FLOW');
    this.showAction(this.actionIndex, false);

    this.playTimer = this.time.addEvent({
      delay: 850,
      loop: true,
      callback: () => {
        if (!this.playing) return;
        this.actionIndex = (this.actionIndex + 1) % ACTIONS.length;
        this.showAction(this.actionIndex, false);
      },
    });
  }

  private stopFlow() {
    this.playing = false;
    this.playTimer?.remove(false);
    this.playTimer = undefined;
  }
}

function benchCenterY(height: number) {
  return height * 0.47 + 82;
}
