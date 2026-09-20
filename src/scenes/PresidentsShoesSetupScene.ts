import Phaser from 'phaser';
import { COUNTRY_PACKS, getCountryPack } from '../games/presidents-shoes/story';

const PLAYER_KEY = 'admin-hub-games:presidents-shoes-player';
const COUNTRY_KEY = 'admin-hub-games:presidents-shoes-country';
const SAVE_KEY_PREFIX = 'admin-hub-games:presidents-shoes-save-v2:';

export class PresidentsShoesSetupScene extends Phaser.Scene {
  private name = '';
  private countryId = 'botswana';
  private nameInput?: HTMLInputElement;
  private status!: Phaser.GameObjects.Text;
  private leaving = false;
  private hasSavedStory = false;
  private resizeHandler?: () => void;
  private countryObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('PresidentsShoesSetupScene');
  }

  create() {
    const { width, height } = this.scale;
    const country = getCountryPack(this.readCountryId());
    this.countryId = country.id;
    this.cameras.main.setBackgroundColor(country.secondary);

    const g = this.add.graphics();
    g.fillStyle(0x071018, 1).fillRect(0, 0, width, height);
    g.fillStyle(this.toColor(country.primary), 1).fillRect(0, height * 0.60, width, height * 0.40);
    g.fillStyle(0xffffff, 1).fillRect(0, height * 0.60, width, Math.max(3, height * 0.012));
    g.fillStyle(this.toColor(country.secondary), 1).fillRect(0, height * 0.612, width, Math.max(8, height * 0.035));

    this.add.text(width / 2, height * 0.09, "PRESIDENT'S SHOES", {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: Math.max(20, Math.min(34, Math.min(width, height) * 0.06)) + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      letterSpacing: 1.5,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.16, 'CHOOSE YOUR COUNTRY STORY', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: country.primary,
      letterSpacing: 1.8,
    }).setOrigin(0.5);

    this.renderCountryOptions(width, height);

    const boxWidth = Math.min(520, width * 0.82);
    const boxY = height * 0.49;
    const box = this.add.rectangle(width / 2, boxY, boxWidth, 58, 0x101b2d, 1)
      .setStrokeStyle(2, this.toColor(country.primary), 0.9);

    const saved = this.readSavedName();
    if (saved) this.name = saved;
    this.hasSavedStory = this.hasSavedProgress();

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 24;
    this.nameInput.autocomplete = 'off';
    this.nameInput.autocapitalize = 'words';
    this.nameInput.spellcheck = false;
    this.nameInput.placeholder = 'Your fictional presidential name';
    this.nameInput.value = this.name;
    this.nameInput.setAttribute('aria-label', 'Fictional presidential name');
    Object.assign(this.nameInput.style, {
      position: 'fixed', zIndex: '1200', boxSizing: 'border-box',
      padding: '0 16px', border: '0', outline: 'none', borderRadius: '4px',
      background: '#101b2d', color: '#f4f7ff', font: '700 18px monospace',
      caretColor: country.primary, userSelect: 'text', touchAction: 'manipulation',
    });
    document.getElementById('app')?.appendChild(this.nameInput);

    this.nameInput.addEventListener('input', () => {
      this.name = this.nameInput?.value.replace(/[^a-zA-Z0-9 .'-]/g, '').slice(0, 24) ?? '';
      if (this.nameInput && this.nameInput.value !== this.name) this.nameInput.value = this.name;
      this.status.setText('');
    });

    this.nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.startStory(false);
      }
    });

    this.status = this.add.text(width / 2, height * 0.57, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#e0b65a',
      align: 'center', wordWrap: { width: width * 0.82 },
    }).setOrigin(0.5);

    const buttonWidth = Math.min(310, width * 0.70);
    const button = this.add.rectangle(width / 2, height * 0.71, buttonWidth, 56, this.toColor(country.primary), 1)
      .setStrokeStyle(2, 0xffffff, 0.72)
      .setInteractive({ useHandCursor: false });
    const buttonText = this.add.text(button.x, button.y, this.hasSavedStory ? 'NEW STORY' : 'START THE STORY', {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: '#071018', letterSpacing: 1,
    }).setOrigin(0.5);

    button.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation();
      this.startStory(false);
    });

    if (this.hasSavedStory) {
      const continueButton = this.add.rectangle(width / 2, height * 0.81, buttonWidth, 48, 0x101b2d, 1)
        .setStrokeStyle(2, this.toColor(country.primary), 0.7)
        .setInteractive({ useHandCursor: false });
      const continueText = this.add.text(continueButton.x, continueButton.y, 'CONTINUE STORY', {
        fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
        color: '#f4f7ff', letterSpacing: 1,
      }).setOrigin(0.5);
      continueButton.on('pointerdown', (_pointer, _x, _y, event) => {
        event.stopPropagation();
        this.startStory(true);
      });
      this.countryObjects.push(continueButton, continueText);
    }

    this.add.text(width / 2, height * 0.91, 'Your country, name and story progress stay on this device for V1.', {
      fontFamily: 'monospace', fontSize: '8px', color: '#8ea4b2', align: 'center',
    }).setOrigin(0.5);

    this.positionInput(box.x, box.y, boxWidth);
    this.resizeHandler = () => this.positionInput(box.x, box.y, boxWidth);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);

    this.time.delayedCall(250, () => {
      this.nameInput?.focus({ preventScroll: true });
      this.nameInput?.select();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
      this.resizeHandler = undefined;
      this.nameInput?.remove();
      this.nameInput = undefined;
      this.countryObjects = [];
    });

    void buttonText;
  }

  private renderCountryOptions(width: number, height: number) {
    const available = COUNTRY_PACKS.filter((pack) => pack.available);
    const gap = 12;
    const maxWidth = Math.min(760, width * 0.88);
    const itemWidth = Math.min(220, (maxWidth - gap * (available.length - 1)) / Math.max(1, available.length));
    const startX = width / 2 - ((itemWidth * available.length) + gap * (available.length - 1)) / 2 + itemWidth / 2;

    available.forEach((pack, index) => {
      const selected = pack.id === this.countryId;
      const x = startX + index * (itemWidth + gap);
      const card = this.add.rectangle(x, height * 0.31, itemWidth, 82, selected ? this.toColor(pack.primary) : 0x101b2d, 1)
        .setStrokeStyle(2, selected ? 0xffffff : this.toColor(pack.primary), selected ? 0.95 : 0.55)
        .setInteractive({ useHandCursor: false });
      const title = this.add.text(x, height * 0.30, pack.shortName, {
        fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
        color: selected ? '#071018' : '#f4f7ff', letterSpacing: 1,
      }).setOrigin(0.5);
      const state = this.add.text(x, height * 0.35, selected ? 'SELECTED' : 'SELECT', {
        fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold',
        color: selected ? '#071018' : pack.primary, letterSpacing: 1,
      }).setOrigin(0.5);
      card.on('pointerdown', (_pointer, _x, _y, event) => {
        event.stopPropagation();
        this.selectCountry(pack.id);
      });
      this.countryObjects.push(card, title, state);
    });

    if (available.length === 1) {
      const note = this.add.text(width / 2, height * 0.405, 'MORE COUNTRY STORY PACKS CAN BE ADDED WITHOUT CHANGING THE GAME ENGINE.', {
        fontFamily: 'monospace', fontSize: '7px', color: '#7f98a8', align: 'center',
        wordWrap: { width: width * 0.86 },
      }).setOrigin(0.5);
      this.countryObjects.push(note);
    }
  }

  private selectCountry(countryId: string) {
    const country = getCountryPack(countryId);
    this.countryId = country.id;
    try { window.localStorage.setItem(COUNTRY_KEY, country.id); } catch {}
    this.scene.restart();
  }

  private readCountryId() {
    try { return window.localStorage.getItem(COUNTRY_KEY) ?? 'botswana'; } catch { return 'botswana'; }
  }

  private saveKey() {
    return SAVE_KEY_PREFIX + this.countryId;
  }

  private readSavedName() {
    try { return window.localStorage.getItem(PLAYER_KEY) ?? ''; } catch { return ''; }
  }

  private hasSavedProgress() {
    try {
      const raw = window.localStorage.getItem(this.saveKey());
      if (!raw) return false;
      const saved = JSON.parse(raw) as { sceneId?: unknown };
      return typeof saved.sceneId === 'string' && saved.sceneId !== 'ending-check';
    } catch { return false; }
  }

  private startStory(resume: boolean) {
    if (this.leaving) return;
    const value = this.name.trim();
    if (!value) {
      this.status.setText('Choose a name first.');
      this.nameInput?.focus({ preventScroll: true });
      return;
    }

    this.leaving = true;
    try {
      window.localStorage.setItem(PLAYER_KEY, value);
      window.localStorage.setItem(COUNTRY_KEY, this.countryId);
    } catch {}

    this.registry.set('presidentsShoesPlayer', value);
    this.registry.set('presidentsShoesCountry', this.countryId);
    this.registry.set('presidentsShoesResume', resume);
    this.nameInput?.blur();
    this.cameras.main.fadeOut(400, 7, 16, 24);
    this.time.delayedCall(400, () => this.scene.start('PresidentsShoesGameScene'));
  }

  private positionInput(x: number, y: number, boxWidth: number) {
    const canvas = document.querySelector<HTMLCanvasElement>('#app canvas');
    if (!this.nameInput || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / this.scale.width;
    const scaleY = rect.height / this.scale.height;
    this.nameInput.style.left = rect.left + (x - boxWidth / 2) * scaleX + 'px';
    this.nameInput.style.top = rect.top + (y - 28) * scaleY + 'px';
    this.nameInput.style.width = boxWidth * scaleX + 'px';
    this.nameInput.style.height = Math.max(52, 56 * scaleY) + 'px';
    this.nameInput.style.fontSize = Math.max(16, Math.min(20, 18 * scaleY)) + 'px';
  }

  private toColor(hex: string) {
    return Number.parseInt(hex.replace('#', ''), 16);
  }
}
