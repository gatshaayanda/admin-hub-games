import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

export class ShootersTriggerEvasionScene extends Phaser.Scene {
  public joystickVector = new Phaser.Math.Vector2();
  private player!: Phaser.GameObjects.Container;
  private bullets: Phaser.GameObjects.Arc[] = [];
  private covers: Phaser.Geom.Rectangle[] = [];
  private elapsed=0; private hits=0; private cleanup?:()=>void; private completed=false; private sessionButton?:HTMLButtonElement;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(){super('ShootersTriggerEvasionScene');}
  create(){
    this.cameras.main.setBackgroundColor('#5f8a47');
    const g=this.add.graphics(); g.fillStyle(0x6f984b,1).fillRect(0,0,2400,1400);
    this.covers=[new Phaser.Geom.Rectangle(500,400,280,70),new Phaser.Geom.Rectangle(1050,720,300,70),new Phaser.Geom.Rectangle(1700,430,260,70),new Phaser.Geom.Rectangle(1500,1000,320,70)];
    this.covers.forEach(r=>{g.fillStyle(0x6b4930,1).fillRect(r.x,r.y,r.width,r.height);});
    this.player=this.createPlayer(1200,1120); this.cameras.main.setBounds(0,0,2400,1400); this.cameras.main.startFollow(this.player,true,.08,.08);
    this.add.text(18,18,'EVASION CAMP · 60s',{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#f4f1df'}).setScrollFactor(0).setDepth(90);
    this.add.text(18,43,'MOVE · COVER · SURVIVE',{fontFamily:'monospace',fontSize:'10px',color:'#e8c95c'}).setScrollFactor(0).setDepth(90);
    this.cursors=this.input.keyboard!.createCursorKeys();
    this.cleanup=installShootersTriggerMobileControls();
    this.createSessionButton();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.cleanup?.();this.sessionButton?.remove();this.sessionButton=undefined;});
    this.time.addEvent({delay:700,loop:true,callback:()=>this.fireIncoming()});
    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }
  update(_t: number, delta: number){
    this.elapsed+=delta;
    let dx=this.joystickVector.x,dy=this.joystickVector.y;
    if(!dx&&!dy){dx=(this.cursors.right.isDown?1:0)-(this.cursors.left.isDown?1:0);dy=(this.cursors.down.isDown?1:0)-(this.cursors.up.isDown?1:0);}
    if(dx||dy){const l=Math.hypot(dx,dy)||1;this.player.x=Phaser.Math.Clamp(this.player.x+dx/l*175*delta/1000,40,2360);this.player.y=Phaser.Math.Clamp(this.player.y+dy/l*175*delta/1000,90,1350);}
    for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i];b.x+=b.getData('vx')*delta/1000;b.y+=b.getData('vy')*delta/1000;if(b.x<0||b.x>2400||b.y<0||b.y>1400){b.destroy();this.bullets.splice(i,1);continue;}if(Phaser.Math.Distance.Between(b.x,b.y,this.player.x,this.player.y)<20){this.hits++;b.destroy();this.bullets.splice(i,1);}}
    if(this.elapsed>=60000&&!this.completed)this.finish();
  }
  private fireIncoming(){for(let i=0;i<3;i++){const x=Phaser.Math.Between(250,2150),y=Phaser.Math.Between(180,600);const b=this.add.circle(x,y,5,0xe44f3d).setDepth(25);const v=new Phaser.Math.Vector2(this.player.x-x,this.player.y-y).normalize();b.setData('vx',v.x*250);b.setData('vy',v.y*250);this.bullets.push(b);}}
  public setMoveVector(x:number,y:number){this.joystickVector.set(Phaser.Math.Clamp(x,-1,1),Phaser.Math.Clamp(y,-1,1));}
  public isPhoneSession(){return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints>0;}
  private createSessionButton(){const button=document.createElement('button');button.type='button';button.textContent='CLOSE SESSION · SAVE';Object.assign(button.style,{position:'fixed',right:'18px',bottom:'max(18px, env(safe-area-inset-bottom))',minHeight:'48px',padding:'10px 16px',border:'2px solid #f4f1df',borderRadius:'10px',background:'#102018',color:'#f4f1df',fontFamily:'monospace',fontSize:'11px',fontWeight:'800',letterSpacing:'.8px',zIndex:'1450',touchAction:'manipulation'});button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();this.finish();});document.body.appendChild(button);this.sessionButton=button;}
  private finish(){ this.completed=true;this.cleanup?.();this.sessionButton?.remove();try{localStorage.setItem('shooters-trigger:last-evasion',JSON.stringify({hits:this.hits,survived:60000}));}catch{}this.scene.start('ShootersTriggerMediaScene',{from:'evasion',hits:this.hits});}
  private createPlayer(x:number,y:number){const c=this.add.container(x,y).setDepth(30);const g=this.add.graphics();g.fillStyle(0x263a2b,1).fillRoundedRect(-14,-5,28,28,7);g.fillStyle(0xd8a477,1).fillCircle(0,-18,9);g.fillStyle(0x283d2c,1).fillEllipse(0,-24,22,8);g.fillStyle(0x334f35,1).fillRoundedRect(-12,18,9,16,3).fillRoundedRect(3,18,9,16,3);c.add(g);return c;}
}