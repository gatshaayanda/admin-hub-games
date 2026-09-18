import Phaser from 'phaser';
import './style.css';
import './mobile-controls';
import './audio';
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
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    expandParent: true,
    width: 960,
    height: 540,
    min: { width: 320, height: 180 },
    max: { width: 0, height: 0 },
  },
  scene: [BootScene, PublisherIntroScene, NameEntryScene, GameShellScene],
};

// Keep the publisher shell configuration centralized for every Admin Hub Games title.
const game = new Phaser.Game(config);
(window as Window & { __AHG_GAME__?: unknown }).__AHG_GAME__ = game;
