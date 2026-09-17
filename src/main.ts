import Phaser from 'phaser';
import './style.css';
import './mobile-controls';
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
  input: { activePointers: 3 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
    min: { width: 320, height: 180 },
    max: { width: 1920, height: 1080 },
  },
  scene: [BootScene, PublisherIntroScene, NameEntryScene, GameShellScene],
};

new Phaser.Game(config);
