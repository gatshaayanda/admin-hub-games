import Phaser from 'phaser';
import './style.css';
import './firebase/firebase';
import { BootScene } from './scenes/BootScene';
import { PublisherIntroScene } from './scenes/PublisherIntroScene';
import { NameEntryScene } from './scenes/NameEntryScene';
import { GameShellScene } from './scenes/GameShellScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#16120f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  scene: [BootScene, PublisherIntroScene, NameEntryScene, GameShellScene],
};

new Phaser.Game(config);
