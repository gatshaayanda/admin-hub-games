import Phaser from 'phaser';
import { advanceWorld, createInitialWorld } from '../games/living-world/simulation';
import { loadWorldState, saveWorldState } from '../games/living-world/save';
import { PawsWorldExperience } from '../games/paws-world/PawsWorldExperience';
import type { WorldState } from '../games/living-world/types';
export class LivingWorldGameScene extends Phaser.Scene {
 private world!:WorldState;private experience?:PawsWorldExperience;
 constructor(){super('LivingWorldGameScene')}
 create(){const now=Date.now();let loaded:WorldState|null=null;try{loaded=loadWorldState()}catch{loaded=null}this.world=advanceWorld(loaded??createInitialWorld(now),now).state;try{saveWorldState(this.world)}catch{}this.cameras.main.setBackgroundColor('#91bd70');const host=document.getElementById('app');if(!host){this.add.text(20,20,'Paws World surface unavailable.',{color:'#fff'});return}this.experience?.dispose();this.experience=new PawsWorldExperience(host);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.experience?.dispose();this.experience=undefined})}
}