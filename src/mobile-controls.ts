type GameShell = {
  joystickVector?: { set: (x: number, y: number) => unknown };
  interact?: () => unknown;
  toggleGamebook?: () => unknown;
};
type PhaserSceneManager = {
  getScene?: (key: string) => GameShell & { scene?: unknown };
  isActive?: (key: string) => boolean;
};
type PhaserGame = { scene?: PhaserSceneManager };
declare global { interface Window { __AHG_GAME__?: PhaserGame; } }

const TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
function getScene() { return window.__AHG_GAME__?.scene?.getScene?.('GameShellScene'); }
function isGameplayVisible() {
  const manager = window.__AHG_GAME__?.scene;
  if (!manager) return false;
  return manager.isActive ? manager.isActive('GameShellScene') && !manager.isActive('InteractionModalScene') : Boolean(getScene());
}
function setVector(x: number, y: number) {
  const scene = getScene();
  if (!scene?.joystickVector || !isGameplayVisible()) return;
  scene.joystickVector.set(x, y);
}
function makeJoystick() {
  const base=document.createElement('div'); base.className='ahg-joystick'; base.setAttribute('aria-label','Virtual movement joystick');
  const knob=document.createElement('div'); knob.className='ahg-joystick-knob';
  const label=document.createElement('div'); label.className='ahg-joystick-label'; label.textContent='MOVE';
  base.append(knob,label);
  let pointerId:number|null=null;
  const reset=()=>{ pointerId=null; knob.style.transform='translate3d(0,0,0)'; setVector(0,0); };
  const update=(event:PointerEvent)=>{
    if(pointerId!==event.pointerId) return;
    const rect=base.getBoundingClientRect(), cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const maxRadius=Math.max(1,Math.min(rect.width,rect.height)*.34);
    const rawX=event.clientX-cx, rawY=event.clientY-cy, distance=Math.hypot(rawX,rawY)||1;
    const scale=Math.min(1,maxRadius/distance), knobX=rawX*scale, knobY=rawY*scale;
    const deadZone=Math.min(10,maxRadius*.2), active=Math.max(0,distance-deadZone);
    const normalized=Math.min(1,active/Math.max(1,maxRadius-deadZone));
    const x=distance<=deadZone?0:(rawX/distance)*normalized, y=distance<=deadZone?0:(rawY/distance)*normalized;
    knob.style.transform=`translate3d(${knobX}px,${knobY}px,0)`; setVector(x,y);
  };
  base.addEventListener('pointerdown',(event)=>{event.preventDefault(); if(!isGameplayVisible())return; pointerId=event.pointerId; base.setPointerCapture?.(event.pointerId); update(event);});
  base.addEventListener('pointermove',update);
  base.addEventListener('pointerup',(event)=>{if(pointerId===event.pointerId)reset();});
  base.addEventListener('pointercancel',(event)=>{if(pointerId===event.pointerId)reset();});
  base.addEventListener('lostpointercapture',reset);
  return base;
}
function makeActionButton(label:string,action:'interact'|'book'){
  const button=document.createElement('button'); button.type='button'; button.className='ahg-action-button'; button.setAttribute('aria-label',label); button.innerHTML=`<span>${label}</span>`;
  button.addEventListener('pointerdown',(event)=>{event.preventDefault(); if(!isGameplayVisible())return; const scene=getScene(); if(action==='interact')scene?.interact?.();else scene?.toggleGamebook?.(); button.classList.add('is-pressed');});
  button.addEventListener('pointerup',()=>button.classList.remove('is-pressed')); button.addEventListener('pointercancel',()=>button.classList.remove('is-pressed')); return button;
}
function install(){
  if(!TOUCH_DEVICE||document.getElementById('ahg-touch-controls'))return;
  const root=document.createElement('div'); root.id='ahg-touch-controls'; root.setAttribute('aria-label','Admin Hub Games mobile controls');
  const actions=document.createElement('div'); actions.className='ahg-actions'; actions.append(makeActionButton('EXPLORE','interact'),makeActionButton('BOOK','book'));
  const hint=document.createElement('div'); hint.className='ahg-touch-hint'; hint.textContent='DRAG TO MOVE';
  root.append(makeJoystick(),actions,hint); document.body.appendChild(root);
}
function syncVisibility(){const root=document.getElementById('ahg-touch-controls'); if(!root)return; const visible=isGameplayVisible(); root.classList.toggle('is-hidden',!visible); if(!visible)setVector(0,0);}
install(); syncVisibility(); window.addEventListener('resize',syncVisibility,{passive:true}); window.setInterval(syncVisibility,150);
