import Phaser from 'phaser';

export class ShootersTriggerMediaScene extends Phaser.Scene {
  constructor(){super('ShootersTriggerMediaScene');}
  create(data:{from?:string;hits?:number}={}){
    const {width,height}=this.scale; this.cameras.main.setBackgroundColor('#151a16');
    this.add.text(width/2,height*.12,'MEDIA COVERAGE CENTER',{fontFamily:'monospace',fontSize:'24px',fontStyle:'bold',color:'#e8c95c'}).setOrigin(.5);
    this.add.text(width/2,height*.20,'WHAT YOU DID BECOMES THE STORY',{fontFamily:'monospace',fontSize:'11px',color:'#f4f1df'}).setOrigin(.5);
    let evasion='NOT YET RECORDED'; try{const r=JSON.parse(localStorage.getItem('shooters-trigger:last-evasion')||'null'); if(r)evasion=`${r.hits} incoming hits · 60s survived`;}catch{}
    let budget='100'; try{budget=localStorage.getItem('shooters-trigger:budget')||'100';}catch{}
    const lines=['SHOOTING  ·  TRAINING RECORD SAVED','EVASION   ·  '+evasion,'COVER     ·  POSITIONING IS NOW PART OF YOUR READINESS','BUDGET    ·  '+budget,'EQUIPMENT ·  BUY UPGRADES BEFORE ARENA'];
    lines.forEach((t,i)=>this.add.text(width/2,height*(.33+i*.09),t,{fontFamily:'monospace',fontSize:'12px',color:'#f4f1df',align:'center',wordWrap:{width:width*.82}}).setOrigin(.5));
    const buttons=[['RETURN TO HOME FIELD',.70,'ShootersTriggerLobbyScene'],['ENTER ARENA',.80,'ShootersTriggerArenaScene']];
    buttons.forEach(([label,y,scene])=>{const b=this.add.rectangle(width/2,height*(y as number),Math.min(420,width*.78),52,0xe8c95c,1).setInteractive();this.add.text(b.x,b.y,label as string,{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#102018'}).setOrigin(.5);b.on('pointerdown',()=>this.scene.start(scene as string));});
    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }
}