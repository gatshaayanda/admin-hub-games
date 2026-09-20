import Phaser from 'phaser';
import {
  createInitialStoryState,
  getCountryPack,
  getEnding,
  getStoryPack,
  type StoryChoice,
  type StoryState,
  type StoryScene,
} from '../games/presidents-shoes/story';

const COUNTRY_KEY = 'admin-hub-games:presidents-shoes-country';
const SAVE_KEY_PREFIX = 'admin-hub-games:presidents-shoes-save-v2:';
const HISTORY_KEY = 'admin-hub-games:presidents-shoes-history-v2';

export class PresidentsShoesGameScene extends Phaser.Scene {
  private state: StoryState = createInitialStoryState();
  private playerName = 'President';
  private countryId = 'botswana';
  private leaving = false;
  private contentObjects: Phaser.GameObjects.GameObject[] = [];
  private resizeHandler?: () => void;
  private historyRecorded = false;

  constructor() {
    super('PresidentsShoesGameScene');
  }

  create() {
    this.playerName = String(this.registry.get('presidentsShoesPlayer') || this.readName() || 'President');
    this.countryId = String(this.registry.get('presidentsShoesCountry') || this.readCountry());
    if (this.registry.get('presidentsShoesResume') === true) this.loadState();
    else this.clearSavedState();

    this.cameras.main.setBackgroundColor('#f7fafc');
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

    const country = getCountryPack(this.countryId);
    const story = getStoryPack(this.countryId);
    const { width, height } = this.scale;
    const background = this.add.graphics();
    background.fillStyle(this.toColor(country.surface), 1).fillRect(0, 0, width, height);
    background.fillStyle(this.toColor(country.primary), 1).fillRect(0, height * 0.82, width, height * 0.18);
    background.fillStyle(0xffffff, 1).fillRect(0, height * 0.82, width, Math.max(3, height * 0.012));
    background.fillStyle(this.toColor(country.secondary), 1).fillRect(0, height * 0.832, width, Math.max(8, height * 0.035));
    this.contentObjects.push(background);

    const scene = story.scenes[this.state.sceneId];
    if (!scene) {
      this.finishStory();
      return;
    }

    const titleSize = Math.max(20, Math.min(34, Math.min(width, height) * 0.06));
    const bodySize = Math.max(15, Math.min(20, Math.min(width, height) * 0.034));

    const brand = this.add.text(width * 0.05, height * 0.055, "PRESIDENT'S SHOES", {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', fontStyle: 'bold',
      color: country.ink, letterSpacing: 1.4,
    }).setOrigin(0, 0.5);
    const countryLabel = this.add.text(width * 0.95, height * 0.055, country.shortName, {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: country.secondary, letterSpacing: 1.4,
    }).setOrigin(1, 0.5);
    this.contentObjects.push(brand, countryLabel);

    const stripe = this.add.rectangle(width / 2, height * 0.10, Math.min(620, width * 0.72), 4, this.toColor(country.primary), 1);
    this.contentObjects.push(stripe);

    if (this.state.pendingConsequence) {
      this.renderConsequence(width, height, country, scene);
      return;
    }

    const location = this.add.text(width / 2, height * 0.145, scene.location, {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px',
      color: country.muted, letterSpacing: 0.8, align: 'center',
    }).setOrigin(0.5);
    this.contentObjects.push(location);

    const title = this.add.text(width / 2, height * 0.235, scene.title, {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: titleSize + 'px', fontStyle: 'bold',
      color: country.ink, align: 'center', wordWrap: { width: width * 0.84 },
    }).setOrigin(0.5);
    this.contentObjects.push(title);

    const body = this.add.text(width / 2, height * 0.37, scene.body, {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: bodySize + 'px',
      color: country.muted, align: 'center', lineSpacing: 8,
      wordWrap: { width: Math.min(width * 0.82, 760) },
    }).setOrigin(0.5);
    this.contentObjects.push(body);

    if (scene.ending) {
      this.renderEnding(width, height, country, scene);
      return;
    }

    const choices = scene.choices ?? [];
    const startY = height * (choices.length === 3 ? 0.62 : 0.60);
    const gap = Math.min(82, height * 0.145);

    choices.forEach((choice: StoryChoice, index: number) => {
      this.renderChoice(choice, index, startY + index * gap, width, country);
    });

    const stats = this.add.text(width / 2, height * 0.96,
      'TRUST ' + this.state.trust + '   SERVICE ' + this.state.service + '   RESERVE ' + this.state.budget + '   DECISIONS ' + this.state.decisions,
      { fontFamily: 'monospace', fontSize: '9px', color: country.muted, letterSpacing: 0.8, align: 'center' }
    ).setOrigin(0.5);
    this.contentObjects.push(stats);
  }

  private renderChoice(choice: StoryChoice, index: number, y: number, width: number, country: ReturnType<typeof getCountryPack>) {
    const buttonWidth = Math.min(760, width * 0.84);
    const buttonHeight = 72;
    const button = this.add.rectangle(width / 2, y, buttonWidth, buttonHeight, this.toColor(country.surface), 1)
      .setStrokeStyle(2, this.toColor(country.primary), 0.9)
      .setInteractive({ useHandCursor: false });

    const label = this.add.text(button.x - buttonWidth / 2 + 18, y - 10, (index + 1) + '. ' + choice.label, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(14, Math.min(18, width * 0.017)) + 'px',
      fontStyle: 'bold',
      color: country.ink,
      wordWrap: { width: buttonWidth - 36 },
    }).setOrigin(0, 0.5);

    const hint = this.add.text(button.x - buttonWidth / 2 + 18, y + 15, choice.hint, {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px',
      color: country.muted, wordWrap: { width: buttonWidth - 36 },
    }).setOrigin(0, 0.5);

    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.choose(choice);
    });

    this.contentObjects.push(button, label, hint);
  }

  private choose(choice: StoryChoice) {
    if (this.leaving || this.state.pendingConsequence) return;

    this.state = {
      ...this.state,
      trust: this.state.trust + (choice.effects.trust ?? 0),
      service: this.state.service + (choice.effects.service ?? 0),
      budget: this.state.budget + (choice.effects.budget ?? 0),
      decisions: this.state.decisions + 1,
      sceneId: choice.next,
      pendingConsequence: choice.consequence,
      lastEffects: choice.effects,
    };

    this.saveState();
    this.renderScene();
  }

  private renderConsequence(width: number, height: number, country: ReturnType<typeof getCountryPack>, scene: StoryScene) {
    const panelWidth = Math.min(760, width * 0.86);
    const panel = this.add.rectangle(width / 2, height * 0.49, panelWidth, Math.min(height * 0.50, 300), this.toColor(country.secondary), 0.97)
      .setStrokeStyle(3, this.toColor(country.primary), 0.95);

    const heading = this.add.text(width / 2, height * 0.35, 'DECISION RECORDED', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: country.primary, letterSpacing: 1.8, align: 'center',
    }).setOrigin(0.5);

    const consequence = this.add.text(width / 2, height * 0.49, this.state.pendingConsequence ?? '', {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: Math.max(16, Math.min(22, Math.min(width, height) * 0.037)),
      fontStyle: 'bold', color: '#ffffff', align: 'center', lineSpacing: 8,
      wordWrap: { width: panelWidth * 0.82 },
    }).setOrigin(0.5);

    const changes = this.add.text(width / 2, height * 0.64, this.describeLatestChanges(), {
      fontFamily: 'monospace', fontSize: '10px', color: '#d7e6ef',
      align: 'center', lineSpacing: 6, wordWrap: { width: panelWidth * 0.82 },
    }).setOrigin(0.5);

    const next = this.add.rectangle(width / 2, height * 0.76, Math.min(320, width * 0.64), 54, this.toColor(country.primary), 1)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: false });
    const nextText = this.add.text(next.x, next.y, 'CONTINUE', {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: country.secondary, letterSpacing: 1.2,
    }).setOrigin(0.5);

    next.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.state = { ...this.state, pendingConsequence: undefined, lastEffects: undefined };
      this.saveState();
      this.renderScene();
    });

    this.contentObjects.push(panel, heading, consequence, changes, next, nextText);
    void scene;
  }

  private describeLatestChanges() {
    const effect = (label: string, value: number | undefined) => {
      if (!value) return label + ' 0';
      return label + ' ' + (value > 0 ? '+' : '') + value;
    };
    const changes = [
      effect('TRUST', this.state.lastEffects?.trust),
      effect('SERVICE', this.state.lastEffects?.service),
      effect('RESERVE', this.state.lastEffects?.budget),
    ];
    return changes.join('   ·   ') + '\nCURRENT: TRUST ' + this.state.trust + '   ·   SERVICE ' + this.state.service + '   ·   RESERVE ' + this.state.budget;
  }

  private renderEnding(width: number, height: number, country: ReturnType<typeof getCountryPack>, scene: StoryScene) {
    if (!scene.ending) return;

    const ending = getEnding(this.state);
    const panel = this.add.rectangle(width / 2, height * 0.56, Math.min(width * 0.86, 820), Math.min(height * 0.58, 340), this.toColor(country.secondary), 0.97)
      .setStrokeStyle(3, this.toColor(country.primary), 0.95);

    const result = this.add.text(width / 2, height * 0.38, ending.result, {
      fontFamily: 'monospace', fontSize: Math.max(18, Math.min(28, Math.min(width, height) * 0.05)),
      fontStyle: 'bold', color: country.primary, letterSpacing: 1.3, align: 'center',
    }).setOrigin(0.5);

    const title = this.add.text(width / 2, height * 0.48, ending.title, {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: Math.max(21, Math.min(32, Math.min(width, height) * 0.055)),
      fontStyle: 'bold', color: '#ffffff', align: 'center', wordWrap: { width: width * 0.76 },
    }).setOrigin(0.5);

    const summary = this.add.text(width / 2, height * 0.62, ending.summary, {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: Math.max(13, Math.min(17, Math.min(width, height) * 0.029)),
      color: '#d7e6ef', align: 'center', lineSpacing: 7, wordWrap: { width: Math.min(width * 0.76, 700) },
    }).setOrigin(0.5);

    const finalStats = this.add.text(width / 2, height * 0.74,
      'DECISIONS ' + this.state.decisions + '   ·   TRUST ' + this.state.trust + '   ·   SERVICE ' + this.state.service + '   ·   RESERVE ' + this.state.budget,
      { fontFamily: 'monospace', fontSize: '9px', color: '#a7bac7', letterSpacing: 0.7, align: 'center' }
    ).setOrigin(0.5);

    const replay = this.add.rectangle(width * 0.35, height * 0.87, Math.min(240, width * 0.38), 54, this.toColor(country.primary), 1)
      .setInteractive({ useHandCursor: false });
    const replayText = this.add.text(replay.x, replay.y, 'PLAY AGAIN', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: country.secondary, letterSpacing: 1,
    }).setOrigin(0.5);

    const menu = this.add.rectangle(width * 0.65, height * 0.87, Math.min(240, width * 0.38), 54, 0x101b2d, 1)
      .setStrokeStyle(2, this.toColor(country.primary), 0.7)
      .setInteractive({ useHandCursor: false });
    const menuText = this.add.text(menu.x, menu.y, 'GAME LIBRARY', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: '#ffffff', letterSpacing: 1,
    }).setOrigin(0.5);

    replay.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.resetStory(); });
    menu.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.returnToLibrary(); });

    this.contentObjects.push(panel, result, title, summary, finalStats, replay, replayText, menu, menuText);

    if (!this.historyRecorded) {
      this.recordHistory(ending.result);
      this.clearSavedState();
      this.historyRecorded = true;
    }
  }

  private resetStory() {
    this.state = createInitialStoryState(getStoryPack(this.countryId));
    this.historyRecorded = false;
    this.clearSavedState();
    this.renderScene();
  }

  private finishStory() {
    this.state.sceneId = 'ending-check';
    this.renderScene();
  }

  private saveState() {
    try { window.localStorage.setItem(this.saveKey(), JSON.stringify(this.state)); } catch {}
  }

  private loadState() {
    try {
      const raw = window.localStorage.getItem(this.saveKey());
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<StoryState>;
      if (typeof saved.sceneId === 'string') this.state = { ...createInitialStoryState(getStoryPack(this.countryId)), ...saved };
    } catch {
      this.state = createInitialStoryState(getStoryPack(this.countryId));
    }
  }

  private clearSavedState() {
    try { window.localStorage.removeItem(this.saveKey()); } catch {}
  }

  private recordHistory(ending: string) {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      const history = raw ? JSON.parse(raw) as Array<Record<string, string | number>> : [];
      history.unshift({ countryId: this.countryId, ending, completedAt: new Date().toISOString(), decisions: this.state.decisions });
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
    } catch {}
  }

  private readName() {
    try { return window.localStorage.getItem('admin-hub-games:presidents-shoes-player') ?? ''; } catch { return ''; }
  }

  private readCountry() {
    try { return window.localStorage.getItem(COUNTRY_KEY) ?? 'botswana'; } catch { return 'botswana'; }
  }

  private saveKey() {
    return SAVE_KEY_PREFIX + this.countryId;
  }

  private toColor(hex: string) {
    return Number.parseInt(hex.replace('#', ''), 16);
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
