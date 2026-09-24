import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';
import { abandonShootersTriggerSession, beginShootersTriggerSession, completeShootersTriggerSession } from '../shooters-trigger-session';

type Stage = 'EVASION' | 'BREAK' | 'SHOOTING';
type Shot = { body: Phaser.GameObjects.Arc; vx: number; vy: number; owner: 'player' | 'bot'; ttl: number };
type Fighter = { body: Phaser.GameObjects.Container; weapon: Phaser.GameObjects.Graphics; armed: boolean };
const W=2400,H=1400,MS=30000,FIRE=240,SPEED=520;
const P={x:360,y:1040}, B={x:2040,y:430};

export class ShootersTriggerTrainingScene extends Phaser.Scene {
 public joystickVector=new Phaser.Math.Vector2(); private stage:Stage='EVASION'; private started=0; private done=false;
 private player!:Fighter; private bot!:Fighter; private shots:Shot[]=[]; private covers:Phaser.Geom.Rectangle[]=[];
 private cleanup?:()=>void; private cursors!:Phaser.Types.Input.Keyboard.CursorKeys; private fireHeld=false;
 private aim=new Phaser.Math.Vector2(1,0); private cooldown=0; private playerShots=0; private playerHits=0; private playerHeadshots=0;
 private botShots=0; private botHits=0; private botHeadshots=0; private coverBlocks=0; private scrapes=0;
 private title?:Phaser.GameObjects.Text; private timer?:Phaser.GameObjects.Text; private status?:Phaser.GameObjects.Text; private breakPanel?:HTMLDivElement;

 constructor(){super('ShootersTriggerTrainingScene');}
 create(){
  beginShootersTriggerSession('TRAINING CAMP'); this.drawField();
  this.player=this.createFighter(P.x,P.y,0x2f6b4e,'YOU'); this.bot=this.createFighter(B.x,B.y,0x9b3f3f,'TRAINING BOT');
  this.setArmed(this.player,false); this.setArmed(this.bot,true);
  this.cameras.main.setBounds(0,0,W,H); this.cameras.main.startFollow(this.player.body,true,.08,.08);
  this.cameras.main.setDeadzone(Math.min(this.scale.width*.28,320),Math.min(this.scale.height*.22,150));
  this.cameras.main.setZoom(this.isPhoneSession() ? .84 : .92);
  this.cursors=this.input.keyboard!.createCursorKeys(); this.cleanup=installShootersTriggerMobileControls();
  this.input.on('pointerdown',this.handlePointer,this); this.input.on('pointermove',this.handlePointer,this);
  this.scale.on(Phaser.Scale.Events.RESIZE,this.resize,this); this.createHud(); this.started=Date.now();
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.destroyUi()); window.dispatchEvent(new Event('admin-hub-games:game-ready'));
 }
 update(_t:number,delta:number){
  if(this.done||this.stage==='BREAK')return; const elapsed=Date.now()-this.started;
  this.movePlayer(delta); this.stage==='EVASION'?this.updateEvasionBot(delta):this.updateShootingBot(delta);
  this.cooldown=Math.max(0,this.cooldown-delta); if(this.stage==='SHOOTING'&&this.fireHeld)this.firePlayer(); this.updateShots(delta); this.updateHud();
  if(elapsed>=MS)this.finishStage();
 }
 setMoveVector(x:number,y:number){this.joystickVector.set(Phaser.Math.Clamp(x,-1,1),Phaser.Math.Clamp(y,-1,1));}
 setFireHeld(v:boolean){this.fireHeld=v;}
 setAimVector(x:number,y:number){const l=Math.hypot(x,y);if(l>.05)this.aim.set(x/l,y/l);}
 isPhoneSession(){return window.matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;}

 private movePlayer(delta:number){
  let dx=this.joystickVector.x,dy=this.joystickVector.y;
  if(!dx&&!dy){dx=(this.cursors.right.isDown?1:0)-(this.cursors.left.isDown?1:0);dy=(this.cursors.down.isDown?1:0)-(this.cursors.up.isDown?1:0);}
  if(!dx&&!dy)return; const l=Math.hypot(dx,dy)||1,nx=Phaser.Math.Clamp(this.player.body.x+dx/l*175*delta/1000,42,W-42),ny=Phaser.Math.Clamp(this.player.body.y+dy/l*175*delta/1000,90,H-50);
  if(!this.inCover(nx,ny,14)){this.player.body.x=nx;this.player.body.y=ny;}
 }
 private updateEvasionBot(delta:number){this.moveBot(this.player.body.x-this.bot.body.x,this.player.body.y-this.bot.body.y,delta,150);if(this.cooldown<=0){this.fireBot();this.cooldown=FIRE;}}
 private updateShootingBot(delta:number){
  const dx=this.player.body.x-this.bot.body.x,dy=this.player.body.y-this.bot.body.y,d=Math.hypot(dx,dy)||1,side=Math.sin(Date.now()/420)>=0?1:-1;
  this.moveBot(-dy/d*side*420+dx/d*80,dx/d*side*420+dy/d*80,delta,175);
 }
 private moveBot(dx:number,dy:number,delta:number,speed:number){
  const l=Math.hypot(dx,dy)||1,step=speed*delta/1000,nx=Phaser.Math.Clamp(this.bot.body.x+dx/l*step,42,W-42),ny=Phaser.Math.Clamp(this.bot.body.y+dy/l*step,90,H-50);
  if(!this.inCover(nx,ny,14)){this.bot.body.x=nx;this.bot.body.y=ny;return;}
  const a=Math.atan2(dy,dx);for(const o of [Math.PI/2,-Math.PI/2,Math.PI]){const x=Phaser.Math.Clamp(this.bot.body.x+Math.cos(a+o)*step,42,W-42),y=Phaser.Math.Clamp(this.bot.body.y+Math.sin(a+o)*step,90,H-50);if(!this.inCover(x,y,12)){this.bot.body.x=x;this.bot.body.y=y;return;}}
 }
 private fireBot(){const dx=this.player.body.x-this.bot.body.x,dy=this.player.body.y-this.bot.body.y,d=Math.hypot(dx,dy)||1;if(d>950)return;const v=new Phaser.Math.Vector2(dx/d,dy/d);this.botShots++;this.spawnShot(this.bot.body.x+v.x*42,this.bot.body.y+v.y*42,v,'bot');}
 private firePlayer(){if(this.cooldown>0)return;this.cooldown=FIRE;this.playerShots++;this.spawnShot(this.player.body.x+this.aim.x*42,this.player.body.y+this.aim.y*42,this.aim,'player');}
 private spawnShot(x:number,y:number,v:Phaser.Math.Vector2,owner:'player'|'bot'){this.shots.push({body:this.add.circle(x,y,4,owner==='player'?0xf0dfb6:0xe44f3d,1).setDepth(25),vx:v.x*SPEED,vy:v.y*SPEED,owner,ttl:1100});}
 private updateShots(delta:number){
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.ttl-=delta;const x=s.body.x+s.vx*delta/1000,y=s.body.y+s.vy*delta/1000;
   if(s.ttl<=0||x<0||x>W||y<0||y>H){s.body.destroy();this.shots.splice(i,1);continue;}
   if(this.inCover(x,y)){this.coverBlocks++;s.body.destroy();this.shots.splice(i,1);continue;}s.body.setPosition(x,y);
   const target=s.owner==='player'?this.bot:this.player,head=Phaser.Math.Distance.Between(x,y-15,target.body.x,target.body.y)<20,body=Phaser.Math.Distance.Between(x,y,target.body.x,target.body.y)<28;
   const scrape=Math.min(Phaser.Math.Distance.Between(x,y-15,target.body.x,target.body.y),Phaser.Math.Distance.Between(x,y,target.body.x,target.body.y))<44;
   if(head||body){if(s.owner==='player'){this.playerHits++;if(head)this.playerHeadshots++;}else{this.botHits++;if(head)this.botHeadshots++;}this.paint(x,y,head);s.body.destroy();this.shots.splice(i,1);continue;}
   if(scrape){this.scrapes++;this.paint(x,y,false,true);s.body.destroy();this.shots.splice(i,1);}
  }
 }
 private paint(x:number,y:number,head:boolean,scrape=false){const g=this.add.graphics().setDepth(12),base=scrape?4:head?9:7;g.fillStyle(scrape?0xe08a54:0xd66a3d,.86).fillCircle(x,y,base);for(let i=0;i<(scrape?3:7);i++){const a=Math.random()*Math.PI*2,d=base*(1.4+Math.random()*2.2);g.fillCircle(x+Math.cos(a)*d,y+Math.sin(a)*d,base*.2);}this.time.delayedCall(900,()=>g.destroy());}
 private handlePointer(pointer:Phaser.Input.Pointer){if(this.isPhoneSession()||this.stage!=='SHOOTING')return;const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);this.aim.set(p.x-this.player.body.x,p.y-this.player.body.y).normalize();}
 private finishStage(){if(this.done)return;this.clearShots();if(this.stage==='EVASION'){this.showBreak();return;}this.finishTraining();}
 private showBreak(){this.stage='BREAK';const p=document.createElement('div');this.breakPanel=p;Object.assign(p.style,{position:'fixed',inset:'0',zIndex:'1550',display:'grid',placeItems:'center',padding:'20px',background:'rgba(12,18,14,.76)',fontFamily:'monospace'});const c=document.createElement('div');Object.assign(c.style,{width:'min(420px,92vw)',padding:'24px',background:'#151a16',color:'#f4f1df',border:'2px solid #e8c95c',borderRadius:'12px',textAlign:'center'});c.innerHTML='<div style="color:#e8c95c;font-size:20px;font-weight:800">BREAK · 30 SEC COMPLETE</div><div style="margin:16px 0;font-size:11px;line-height:1.7">Roles switch now.<br>You get the gun.<br>The training bot becomes the evasive target.</div>';const b=document.createElement('button');b.textContent='START SHOOTING · 30 SEC';Object.assign(b.style,{width:'100%',minHeight:'50px',background:'#e8c95c',border:0,borderRadius:'8px',fontFamily:'monospace',fontWeight:'800'});b.onclick=()=>this.startShooting();c.appendChild(b);p.appendChild(c);document.body.appendChild(p);}
 private startShooting(){this.breakPanel?.remove();this.breakPanel=undefined;this.stage='SHOOTING';this.started=Date.now();this.cooldown=0;this.setArmed(this.player,true);this.setArmed(this.bot,false);this.player.body.setPosition(P.x,P.y);this.bot.body.setPosition(B.x,B.y);this.status?.setText('ROLES SWITCHED · AIM · FIRE · 30 SEC');}
 private finishTraining(){
  this.done=true;const er=this.botShots?this.botHits/this.botShots:0,sr=this.playerShots?this.playerHits/this.playerShots:0;
  const es=Phaser.Math.Clamp(Math.round((1-er)*100+Math.min(15,this.coverBlocks*2)),0,100),ss=Phaser.Math.Clamp(Math.round(sr*100+Math.min(15,this.playerHeadshots*3)),0,100);
  const ee=es>55?'PLAYER':es<45?'BOT':'TIE',se=ss>55?'PLAYER':ss<45?'BOT':'TIE',pe=[ee,se].filter(x=>x==='PLAYER').length,be=[ee,se].filter(x=>x==='BOT').length,overall=pe>be?'PLAYER':be>pe?'BOT':'TIE';
  const rec={durationMs:MS,evasion:{score:es,edge:ee,shots:this.botShots,hits:this.botHits,headshots:this.botHeadshots,coverBlocks:this.coverBlocks,scrapes:this.scrapes},shooting:{score:ss,edge:se,shots:this.playerShots,hits:this.playerHits,headshots:this.playerHeadshots},edge:{evasion:ee,shooting:se,overall},completedAt:Date.now()};
  try{
   localStorage.setItem('shooters-trigger:last-evasion',JSON.stringify({survived:MS,incomingShots:this.botShots,hits:this.botHits,headshots:this.botHeadshots,coverBlocks:this.coverBlocks,scrapes:this.scrapes,score:es,edge:ee}));
   localStorage.setItem('shooters-trigger:last-shooting',JSON.stringify({accuracy:sr*100,targetHits:this.playerHits,headshots:this.playerHeadshots,shotsFired:this.playerShots,score:ss,edge:se}));
   localStorage.setItem('shooters-trigger:training-report',JSON.stringify(rec));
  }catch{}
  completeShootersTriggerSession('TRAINING CAMP COMPLETE · PHONE REPORT UPDATED · ARENA ODDS READY');this.showResult(rec);
 }
 private showResult(r:any){const p=document.createElement('div');Object.assign(p.style,{position:'fixed',inset:'0',zIndex:'1600',display:'grid',placeItems:'center',padding:'16px',background:'rgba(12,18,14,.82)',fontFamily:'monospace'});const c=document.createElement('div');Object.assign(c.style,{width:'min(440px,94vw)',padding:'22px',background:'#151a16',color:'#f4f1df',border:'2px solid #e8c95c',borderRadius:'12px',textAlign:'center'});c.innerHTML='<div style="color:#e8c95c;font-size:19px;font-weight:800">TRAINING REPORT</div><div style="margin:12px 0;font-size:11px;line-height:1.8"><b>EVASION</b> · '+r.evasion.edge+' EDGE · '+r.evasion.score+'<br><b>SHOOTING</b> · '+r.shooting.edge+' EDGE · '+r.shooting.score+'<br><br><b>OVERALL EDGE · '+r.edge.overall+'</b><br><span style="color:#9fbda8">EDGE = ODDS, NOT A GUARANTEED WIN.</span></div>';const b=document.createElement('button');b.textContent='RETURN TO FIELD';Object.assign(b.style,{width:'100%',minHeight:'50px',background:'#e8c95c',border:0,borderRadius:'8px',fontFamily:'monospace',fontWeight:'800'});b.onclick=()=>{p.remove();this.scene.start('ShootersTriggerLobbyScene');};c.appendChild(b);p.appendChild(c);document.body.appendChild(p);}
 private createHud(){this.title=this.add.text(this.scale.width/2,18,'TRAINING CAMP · EVASION FIRST',{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#fff4d4',stroke:'#315845',strokeThickness:4}).setOrigin(.5).setScrollFactor(0).setDepth(100);this.timer=this.add.text(this.scale.width/2,42,'30.0s',{fontFamily:'monospace',fontSize:'11px',color:'#e8c95c'}).setOrigin(.5).setScrollFactor(0).setDepth(100);this.status=this.add.text(this.scale.width/2,this.scale.height-18,'RUN · USE COVER · NO HIDING · UNLIMITED AMMO',{fontFamily:'monospace',fontSize:'9px',color:'#f4f1df'}).setOrigin(.5).setScrollFactor(0).setDepth(100);}
 private updateHud(){this.timer?.setText(((Math.max(0,MS-(Date.now()-this.started)))/1000).toFixed(1)+'s');this.title?.setText(this.stage==='EVASION'?'TRAINING CAMP · EVASION FIRST':'TRAINING CAMP · SHOOTING');}
 private createFighter(x:number,y:number,color:number,label:string):Fighter{const c=this.add.container(x,y).setDepth(30),g=this.add.graphics();g.fillStyle(0x3b2f28,1).fillEllipse(0,-20,24,18);g.fillStyle(0xd8a66b,1).fillEllipse(0,-17,13,12);g.fillStyle(color,1).fillEllipse(0,-23,25,12);g.fillStyle(0x111715,1).fillRoundedRect(-13,-17,26,10,4);g.fillStyle(0x9bb9b1,.88).fillRoundedRect(-9,-15,18,6,2);g.fillStyle(0xd4a45d,1).fillRoundedRect(-4,-8,8,7,2);g.fillStyle(color,1).fillRoundedRect(-15,-4,30,22,8);g.fillStyle(0x4f8b65,1).fillRoundedRect(-10,-1,20,14,4);g.fillStyle(0x566052,1).fillRoundedRect(-10,20,8,13,2).fillRoundedRect(2,20,8,13,2);g.fillStyle(0x202522,1).fillRoundedRect(-12,30,10,7,2).fillRoundedRect(2,30,10,7,2);const w=this.add.graphics();c.add([g,w]);this.add.text(x,y-50,label,{fontFamily:'monospace',fontSize:'10px',color:'#fff4d4',stroke:'#315845',strokeThickness:4}).setOrigin(.5).setDepth(40);return{body:c,weapon:w,armed:true};}
 private setArmed(f:Fighter,a:boolean){f.armed=a;f.weapon.clear();f.weapon.setVisible(a);if(a)f.weapon.fillStyle(0x151b18,1).fillRoundedRect(2,-4,34,8,3).fillRoundedRect(8,4,9,5,2);}
 private inCover(x:number,y:number,p=0){return this.covers.some(r=>x>=r.x-p&&x<=r.x+r.width+p&&y>=r.y-p&&y<=r.y+r.height+p);}
 private clearShots(){this.shots.forEach(s=>s.body.destroy());this.shots=[];}
 private drawField(){const g=this.add.graphics();g.fillStyle(0x78a653,1).fillRect(0,0,W,H);g.fillStyle(0xd1b46c,.3).fillRect(0,510,W,92);g.fillStyle(0xd1b46c,.22).fillRect(870,0,100,H);g.lineStyle(5,0xf4f1df,.48).strokeRect(55,70,W-110,H-120);this.bunker(690,360,190,72,0x76563b);this.bunker(1470,350,230,76,0x5f6e69);this.bunker(520,760,250,70,0x9d754d);this.bunker(1570,760,220,68,0x6e8190);this.bunker(850,1030,260,74,0xb58c58);this.bunker(1420,1080,240,72,0x737b79);this.tires(1080,300);this.tires(1900,650);this.tires(730,1170);}
 private bunker(x:number,y:number,w:number,h:number,c:number){const g=this.add.graphics();g.fillStyle(0x493526,.24).fillRect(x+8,y+9,w,h);g.fillStyle(c,1).fillRoundedRect(x,y,w,h,10);g.lineStyle(2,0xf4f1df,.28).strokeRoundedRect(x,y,w,h,10);this.covers.push(new Phaser.Geom.Rectangle(x,y,w,h));}
 private tires(x:number,y:number){const g=this.add.graphics();for(let i=0;i<4;i++){g.fillStyle(0x2b302d,1).fillCircle(x+i*17,y-i*3,19);g.fillStyle(0x66706a,1).fillCircle(x+i*17,y-i*3,7);}this.covers.push(new Phaser.Geom.Rectangle(x-20,y-25,90,45));}
 private resize(w:number,h:number){this.cameras.main.setViewport(0,0,w,h);this.title?.setPosition(w/2,18);this.timer?.setPosition(w/2,42);this.status?.setPosition(w/2,h-18);}
 private destroyUi(){this.scale.off(Phaser.Scale.Events.RESIZE,this.resize,this);this.input.off('pointerdown',this.handlePointer,this);this.input.off('pointermove',this.handlePointer,this);this.cleanup?.();this.breakPanel?.remove();this.clearShots();}
}