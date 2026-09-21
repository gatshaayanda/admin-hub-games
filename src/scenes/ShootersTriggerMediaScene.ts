import Phaser from 'phaser';

export class ShootersTriggerMediaScene extends Phaser.Scene {
  constructor(){super('ShootersTriggerMediaScene');}

  create(){
    const {width,height}=this.scale;
    this.cameras.main.setBackgroundColor('#151a16');
    this.add.text(width/2,height*.10,'MEDIA BUREAU',{fontFamily:'monospace',fontSize:'24px',fontStyle:'bold',color:'#e8c95c'}).setOrigin(.5);
    this.add.text(width/2,height*.18,'REVIEW THE RECORD · THEN RETURN TO THE TOWN',{fontFamily:'monospace',fontSize:'10px',color:'#f4f1df',align:'center'}).setOrigin(.5);

    let shooting='NOT RECORDED',evasion='NOT RECORDED',budget='100',upgrade='STARTER';
    try{
      const s=JSON.parse(localStorage.getItem('shooters-trigger:last-shooting')||'null');
      if(s) shooting=s.targetHits+' hits · '+s.accuracy+'% accuracy';
      const e=JSON.parse(localStorage.getItem('shooters-trigger:last-evasion')||'null');
      if(e) evasion=(e.survived/1000).toFixed(1)+'s · '+e.coverBlocks+' cover blocks · '+e.scrapes+' scrapes';
      budget=localStorage.getItem('shooters-trigger:budget')||'100';
      const level=Number(localStorage.getItem('shooters-trigger:upgrade-level')||0);
      upgrade=level?'LEVEL '+level:'STARTER';
      localStorage.setItem('shooters-trigger:media-reviewed',String(Date.now()));
    }catch{}

    const lines=[
      ['SHOOTING',shooting],
      ['EVASION',evasion],
      ['LOADOUT',upgrade],
      ['BUDGET',budget],
    ];
    lines.forEach(([label,value],i)=>{
      this.add.text(width/2,height*(.31+i*.095),label+'  ·  '+value,{
        fontFamily:'monospace',fontSize:'12px',color:'#f4f1df',align:'center',wordWrap:{width:width*.86}
      }).setOrigin(.5);
    });

    this.add.text(width/2,height*.70,
      'READINESS INPUT\nTraining records and the current loadout now travel with you into the Arena.',{
      fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#e8c95c',align:'center',wordWrap:{width:width*.82},lineSpacing:7
    }).setOrigin(.5);

    const b=this.add.rectangle(width/2,height*.84,Math.min(420,width*.78),52,0xe8c95c,1).setInteractive();
    this.add.text(b.x,b.y,'RETURN TO FIELD TOWN',{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#102018'}).setOrigin(.5);
    b.on('pointerdown',()=>this.scene.start('ShootersTriggerLobbyScene'));

    window.dispatchEvent(new Event('admin-hub-games:game-ready'));
  }
}
