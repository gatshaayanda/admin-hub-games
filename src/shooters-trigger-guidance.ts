import Phaser from 'phaser';

export type SignalSource = { x:number; y:number; name:string; color?:number };

export function addFieldGuide(
  scene: Phaser.Scene,
  title: string,
  pages: string[],
) {
  const button = scene.add.text(18, scene.scale.height - 18, 'FIELD GUIDE', {
    fontFamily:'monospace', fontSize:'9px', fontStyle:'bold',
    color:'#102018', backgroundColor:'#e8c95c',
    padding:{left:9,right:9,top:7,bottom:7},
  }).setOrigin(0,1).setScrollFactor(0).setDepth(220).setInteractive();

  let panel: Phaser.GameObjects.Container | undefined;
  const close = () => { panel?.destroy(true); panel = undefined; };

  const open = () => {
    if (panel) return;
    const w=scene.scale.width, h=scene.scale.height;
    const shade=scene.add.rectangle(w/2,h/2,w,h,0x07100b,.84).setScrollFactor(0);
    const box=scene.add.rectangle(w/2,h/2,Math.min(w*.88,720),Math.min(h*.72,520),0x102018,1)
      .setStrokeStyle(2,0xe8c95c,.9).setScrollFactor(0);
    const heading=scene.add.text(box.x,box.y-box.height*.39,title,{
      fontFamily:'monospace',fontSize:'16px',fontStyle:'bold',color:'#f4f1df',align:'center',
      wordWrap:{width:box.width*.8},
    }).setOrigin(.5).setScrollFactor(0);
    const body=scene.add.text(box.x,box.y-box.height*.08,pages.map((p,i)=>`${i+1}. ${p}`).join('\n\n'),{
      fontFamily:'monospace',fontSize:'11px',color:'#d6e2d1',lineSpacing:7,
      wordWrap:{width:box.width*.78},
    }).setOrigin(.5).setScrollFactor(0);
    const done=scene.add.text(box.x,box.y+box.height*.38,'CLOSE GUIDE',{
      fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#102018',
      backgroundColor:'#e8c95c',padding:{left:12,right:12,top:9,bottom:9},
    }).setOrigin(.5).setScrollFactor(0).setInteractive();
    panel=scene.add.container(0,0,[shade,box,heading,body,done]).setDepth(250);
    done.on('pointerdown',close);
    shade.setInteractive();
    shade.on('pointerdown',close);
  };
  button.on('pointerdown',open);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{panel?.destroy(true);button.destroy();});
  return button;
}

export function createOffscreenSignal(scene: Phaser.Scene) {
  const root=scene.add.container(0,0).setScrollFactor(0).setDepth(210).setVisible(false);
  const arrow=scene.add.text(0,0,'➤',{
    fontFamily:'Arial',fontSize:'30px',fontStyle:'bold',color:'#e85b3f',
    stroke:'#102018',strokeThickness:5,
  }).setOrigin(.5);
  const label=scene.add.text(0,24,'RIVAL',{
    fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#f4f1df',
    backgroundColor:'#183322',padding:{left:6,right:6,top:5,bottom:5},
  }).setOrigin(.5);
  root.add([arrow,label]);
  return {root,arrow,label};
}

export function updateOffscreenSignal(
  scene: Phaser.Scene,
  signal: ReturnType<typeof createOffscreenSignal>,
  origin: {x:number;y:number},
  sources: SignalSource[],
) {
  const w=scene.scale.width,h=scene.scale.height, pad=34;
  const camera=scene.cameras.main;
  let best: SignalSource|undefined, bestDistance=Infinity;
  for(const source of sources){
    const sx=(source.x-camera.scrollX)*camera.zoom, sy=(source.y-camera.scrollY)*camera.zoom;
    const visible=sx>=pad&&sx<=w-pad&&sy>=pad&&sy<=h-pad;
    if(visible) continue;
    const d=Phaser.Math.Distance.Between(origin.x,origin.y,source.x,source.y);
    if(d<bestDistance){best=source;bestDistance=d;}
  }
  if(!best){signal.root.setVisible(false);return;}
  const dx=best.x-origin.x, dy=best.y-origin.y;
  const angle=Math.atan2(dy,dx);
  const cx=Phaser.Math.Clamp(w/2+Math.cos(angle)*(w/2-pad),pad,w-pad);
  const cy=Phaser.Math.Clamp(h/2+Math.sin(angle)*(h/2-pad),pad,h-pad);
  signal.root.setPosition(cx,cy).setVisible(true);
  signal.arrow.setRotation(angle);
  signal.label.setText(best.name+' · OFF SCREEN');
}

export function showShotAlert(
  scene: Phaser.Scene,
  text: string,
  direction?: string,
) {
  const message=direction ? text+' · '+direction : text;
  const previous=scene.data.get('shooters-trigger-active-alert') as Phaser.GameObjects.Text | undefined;
  previous?.destroy();
  const alert=scene.add.text(scene.scale.width/2,58,message,{
    fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#f4f1df',
    backgroundColor:'#8f3e2f',padding:{left:10,right:10,top:7,bottom:7},
  }).setOrigin(.5).setScrollFactor(0).setDepth(230);
  scene.data.set('shooters-trigger-active-alert',alert);
  scene.tweens.add({targets:alert,alpha:0,y:38,duration:850,onComplete:()=>{if(scene.data.get('shooters-trigger-active-alert')===alert)scene.data.remove('shooters-trigger-active-alert');alert.destroy();}});
}
