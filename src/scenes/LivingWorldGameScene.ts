import Phaser from 'phaser';
import { advanceWorld, createInitialWorld } from '../games/living-world/simulation';
import { loadWorldState, saveWorldState } from '../games/living-world/save';
import { LivingWorldExperience } from '../games/living-world/LivingWorldExperience';
import type { WorldState } from '../games/living-world/types';

export class LivingWorldGameScene extends Phaser.Scene {
  private world!: WorldState;
  private experience?: LivingWorldExperience;
  constructor(){super('LivingWorldGameScene');}
  create(){
    const now=Date.now();let loaded:WorldState|null=null;
    try{loaded=loadWorldState();}catch{loaded=null;}
    this.world=advanceWorld(loaded??createInitialWorld(now),now).state;
    try{saveWorldState(this.world);}catch{}
    this.cameras.main.setBackgroundColor('#172b22');
    const host=document.getElementById('app');
    if(!host){this.add.text(20,20,'Living World game surface unavailable.',{color:'#ffffff'});return;}
    this.experience?.dispose();
    this.experience=new LivingWorldExperience(host,this.world,(w)=>{this.world=w;try{saveWorldState(w);}catch{}});
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.experience?.dispose();this.experience=undefined;});
  }
}
