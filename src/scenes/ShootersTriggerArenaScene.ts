import Phaser from 'phaser';
import { installShootersTriggerMobileControls } from '../shooters-trigger-mobile-controls';

export class ShootersTriggerArenaScene extends Phaser.Scene {
  public joystickVector=new Phaser.Math.Vector2(); private player!:Phaser.GameObjects.Container; private aim=new Phaser.Math.Vector2(1,0); private fire=false; private bullets:Phaser.GameObjects.Arc[]=[]; private cleanup?:()=>void; private score=0;
  constructor(){super('ShootersTriggerArenaScene');}
  create(){
    this.cameras.main.setBackgroundColor('#557a43'); const g=this.add.graphics();g.fillStyle(0x6f984b,1).fillRect(0,0,2400,1400);g.fillStyle(0x704a31,1).fillRect(850,500,500,80).fillRect(850,850,500,80);g.lineStyle(4,0xf4f1df,.6).lineBetween(1200,80,1200,1320);
    this.player=this.createPlayer(500,1050); const allies=[[380,1120],[520,1180]]; allies.forEach(p=>this.createUnit(p[0],p[1],0x47a6a1,'ALLY')); [[1850,280],[1950,500],[1750,700]].forEach(p=>this.createUnit(p[0],p[1],0xd84b42,'RIVAL'));
    this.add.text(18,18,'ARENA · FIRST TO 3 KILLS',{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#f4f1df'}).setScrollFactor(0).setDepth(90);
    this.add.text(18,43,'3v3 · MOVE + AIM + FIRE',{fontFamily:'monospace',fontSize:'10px',color:'#e8c95c'}).setScrollFactor(0).setDepth(90);
    this.cleanup=installShootersTriggerMobileControls(); window.dispatchEvent(new Event('admin-hub-games:game-ready');
  }
  update(_t,delta){
    let dx=this.joystickVector.x,dy=this.joystickVector.y; if(dx||dy){const l=Math.hypot(dx,dy)||1;this.player.x+=dx/l*175*delta/1000;this.player.y+=dy/l*175*delta/1000;}
    if(this.fire){const b=this.add.circle(this.player.x+this.aim.x*35,this.player.y+this.aim.y*35,4,0xf0dfb6);b.setData('vx',this.aim.x*520);b.setData('vy',this.aim.y*520);this.bullets.push(b);this.fire=false;}
    for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i];b.x+=b.getData('vx')*delta/1000;b.y+=b.getData('vy')*delta/1000;if(b.x>2400||b.y>1400||b.x<0||b.y<0){b.destroy();this.bullets.splice(i,1);}}
  }
  setFireHeld(v:boolean){this.fire=v;} setAimVector(x:number,y:number){const l=Math.hypot(x,y);if(l>.05)this.aim.set(x/l,y/l);}
  private createPlayer(x:number,y:number){const c=this.createUnit(x,y,0xe8c95c,'YOU');return c;}
  private createUnit(x:number,y:number,color:number,label:string){const c=this.add.container(x,y).setDepth(30);const g=this.add.graphics();g.fillStyle(color,1).fillCircle(0,0,22);this.add.text(x,y+30,label,{fontFamily:'monospace',fontSize:'9px',color:'#f4f1df'}).setOrigin(.5).setDepth(31);c.add(g);return c;}
}