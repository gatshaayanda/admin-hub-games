import Phaser from 'phaser';
import {
  createInitialStoryState,
  getEnding,
  PRESIDENTS_SHOES_STORY,
  type StoryChoice,
  type StoryState,
} from '../games/presidents-shoes/story';

const SAVE_KEY = 'admin-hub-games:presidents-shoes-save-v1';
const HISTORY_KEY = 'admin-hub-games:presidents-shoes-history-v1';

export class PresidentsShoesGameScene extends Phaser.Scene {
  private state: StoryState = createInitialStoryState();
  private playerName = 'President';
  private leaving = false;
  private contentObjects: Phaser.GameObjects.GameObject[] = [];
  private resizeHandler?: () => void;

  constructor() {
    super('PresidentsShoesGameScene');
  }

  create() {
    this.playerName = String(this.registry.get('presidentsShoesPlayer') || this.readName() || 'President');
    this.loadState();

    this.cameras.main.setBackgroundColor('#071018');
    this.renderScene();
    this.resizeHandler = () => this.renderScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
      this.resizeHandler = undefined;
      this.destroyContent();
    });
  }

  private renderScene() {
    this.destroyContent();

    const { width, height } = this.scale;
    const background = this.add.graphics();
    background.fillStyle(0x071018, 1).fillRect(0, 0, width, height);
    background.fillStyle(0x0d2b31, 1).fillRect(0, height * 0.72, width, height * 0.28);
    background.fillStyle(0x123c3b, 0.7).fillRect(0, height * 0.58, width, height * 0.14);
    this.contentObjects.push(background);

    const scene = PRESIDENTS_SHOES_STORY.scenes[this.state.sceneId as keyof typeof PRESIDENTS_SHOES_STORY.scenes];
    if (!scene) {
      this.finishStory();
      return;
    }

    const titleSize = Math.max(20, Math.min(34, Math.min(width, height) * 0.06));
    const bodySize = Math.max(14, Math.min(19, Math.min(width, height) * 0.032));

    const header = this.add.text(width * 0.06, height * 0.065, "PRESIDENT'S SHOES", {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#55d6c2',
      letterSpacing: 1.5,
    }).setOrigin(0, 0.5);
    this.contentObjects.push(header);

    const player = this.add.text(width * 0.94, height * 0.065, this.playerName.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#e0b65a',
      letterSpacing: 1,
    }).setOrigin(1, 0.5);
    this.contentObjects.push(player);

    const location = this.add.text(width / 2, height * 0.14, scene.location, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6f8fa1',
      letterSpacing: 1,
      align: 'center',
    }).setOrigin(0.5);
    this.contentObjects.push(location);

    const title = this.add.text(width / 2, height * 0.23, scene.title, {
      fontFamily: 'monospace',
      fontSize: titleSize + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      align: 'center',
      wordWrap: { width: width * 0.84 },
    }).setOrigin(0.5);
    this.contentObjects.push(title);

    const body = this.add.text(width / 2, height * 0.37, scene.body, {
      fontFamily: 'sans-serif',
      fontSize: bodySize + 'px',
      color: '#c7d4df',
      align: 'center',
      lineSpacing: 7,
      wordWrap: { width: Math.min(width * 0.82, 760) },
    }).setOrigin(0.5);
    this.contentObjects.push(body);

    if (scene.ending) {
      this.renderEnding(width, height, scene);
      return;
    }

    const choices = scene.choices ?? [];
    const startY = height * (choices.length === 3 ? 0.60 : 0.58);
    const gap = Math.min(76, height * 0.13);

    choices.forEach((choice, index) => {
      this.renderChoice(choice, index, startY + index * gap, width);
    });

    const stats = this.add.text(width / 2, height * 0.95,
      'TRUST ' + this.state.trust + '   SERVICE ' + this.state.service + '   RESERVE ' + this.state.budget,
      {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6f8fa1',
        letterSpacing: 1,
        align: 'center',
      }).setOrigin(0.5);
    this.contentObjects.push(stats);
  }

  private renderChoice(choice: StoryChoice, index: number, y: number, width: number) {
    const buttonWidth = Math.min(760, width * 0.84);
    const buttonHeight = 58;
    const button = this.add.rectangle(width / 2, y, buttonWidth, buttonHeight, 0x101b2d, 1)
      .setStrokeStyle(2, 0x55d6c2, 0.62)
      .setInteractive({ useHandCursor: false });
    const label = this.add.text(button.x - buttonWidth / 2 + 18, y - 9, (index + 1) + '. ' + choice.label, {
      fontFamily: 'monospace',
      fontSize: Math.max(10, Math.min(13, width * 0.013)) + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      wordWrap: { width: buttonWidth - 36 },
    }).setOrigin(0, 0.5);
    const hint = this.add.text(button.x - buttonWidth / 2 + 18, y + 14, choice.hint, {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#6f8fa1',
      wordWrap: { width: buttonWidth - 36 },
    }).setOrigin(0, 0.5);

    button.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.choose(choice);
    });

    this.contentObjects.push(button, label, hint);
  }

  private choose(choice: StoryChoice) {
    if (this.leaving) return;

    this.state = {
      ...this.state,
      trust: this.state.trust + (choice.effects.trust ?? 0),
      service: this.state.service + (choice.effects.service ?? 0),
      budget: this.state.budget + (choice.effects.budget ?? 0),
      decisions: this.state.decisions + 1,
      sceneId: choice.next,
    };

    this.saveState();
    this.renderScene();
  }

  private renderEnding(width: number, height: number, scene: { ending?: { title: string; summary: string } }) {
    if (!scene.ending) return;

    const ending = getEnding(this.state);
    const title = this.add.text(width / 2, height * 0.57, ending.title, {
      fontFamily: 'monospace',
      fontSize: Math.max(20, Math.min(30, Math.min(width, height) * 0.052)) + 'px',
      fontStyle: 'bold',
      color: '#e0b65a',
      align: 'center',
      wordWrap: { width: width * 0.82 },
    }).setOrigin(0.5);

    const summary = this.add.text(width / 2, height * 0.68, ending.summary, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#c7d4df',
      align: 'center',
      lineSpacing: 7,
      wordWrap: { width: Math.min(width * 0.80, 720) },
    }).setOrigin(0.5);

    const replay = this.add.rectangle(width * 0.35, height * 0.86, Math.min(240, width * 0.38), 54, 0x55d6c2, 1)
      .setInteractive({ useHandCursor: false });
    const replayText = this.add.text(replay.x, replay.y, 'PLAY AGAIN', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#071018',
      letterSpacing: 1,
    }).setOrigin(0.5);

    const menu = this.add.rectangle(width * 0.65, height * 0.86, Math.min(240, width * 0.38), 54, 0x101b2d, 1)
      .setStrokeStyle(2, 0x55d6c2, 0.7)
      .setInteractive({ useHandCursor: false });
    const menuText = this.add.text(menu.x, menu.y, 'GAME LIBRARY', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      letterSpacing: 1,
    }).setOrigin(0.5);

    replay.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.resetStory();
    });
    menu.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.returnToLibrary();
    });

    this.contentObjects.push(title, summary, replay, replayText, menu, menuText);

    this.recordHistory(ending.title);
    this.clearSavedState();

    const finalStats = this.add.text(width / 2, height * 0.78, 'DECISIONS ' + this.state.decisions + '   TRUST ' + this.state.trust + '   SERVICE ' + this.state.service + '   RESERVE ' + this.state.budget, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#6f8fa1',
      letterSpacing: 0.8,
      align: 'center',
    }).setOrigin(0.5);
    this.contentObjects.push(finalStats);
  }

  private resetStory() {
    this.state = createInitialStoryState();
    this.clearSavedState();
    this.renderScene();
  }

  private finishStory() {
    this.state.sceneId = 'ending-check';
    this.renderScene();
  }

  private saveState() {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {
      // Optional local storage.
    }
  }

  private loadState() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<StoryState>;
      if (typeof saved.sceneId === 'string') {
        this.state = {
          ...createInitialStoryState(),
          ...saved,
        };
      }
    } catch {
      this.state = createInitialStoryState();
    }
  }

  private clearSavedState() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      // Optional local storage.
    }
  }

  private recordHistory(ending: string) {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      const history = raw ? JSON.parse(raw) as Array<Record<string, string | number>> : [];
      history.unshift({
        ending,
        completedAt: new Date().toISOString(),
        decisions: this.state.decisions,
      });
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
    } catch {
      // Optional local storage.
    }
  }

  private readName() {
    try {
      return window.localStorage.getItem('admin-hub-games:presidents-shoes-player') ?? '';
    } catch {
      return '';
    }
  }

  private returnToLibrary() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 7, 16, 24);
    this.time.delayedCall(400, () => this.scene.start('PublisherIntroScene'));
  }

  private destroyContent() {
    for (const object of this.contentObjects) object.destroy();
    this.contentObjects = [];
  }
}
