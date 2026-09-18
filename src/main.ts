import Phaser from 'phaser';
import './style.css';
import './mobile-controls';
import './firebase/firebase';
import { BootScene } from './scenes/BootScene';
import { PublisherIntroScene } from './scenes/PublisherIntroScene';
import { NameEntryScene } from './scenes/NameEntryScene';
import { GameShellScene } from './scenes/GameShellScene';
import { InteractionModalScene } from './scenes/InteractionModalScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#16120f',
  input: { activePointers: 3 },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    expandParent: true,
    width: 960,
    height: 540,
    min: { width: 320, height: 180 },
    max: { width: 1920, height: 1080 },
  },
  scene: [BootScene, PublisherIntroScene, NameEntryScene, GameShellScene, InteractionModalScene],
};

const game = new Phaser.Game(config);
(window as Window & { __AHG_GAME__?: unknown }).__AHG_GAME__ = game;
