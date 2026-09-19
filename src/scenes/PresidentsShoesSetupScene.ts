import Phaser from 'phaser';

const PLAYER_KEY = 'admin-hub-games:presidents-shoes-player';
const SAVE_KEY = 'admin-hub-games:presidents-shoes-save-v1';

export class PresidentsShoesSetupScene extends Phaser.Scene {
  private name = '';
  private nameInput?: HTMLInputElement;
  private status!: Phaser.GameObjects.Text;
  private leaving = false;
  private hasSavedStory = false;
  private resizeHandler?: () => void;

  constructor() {
    super('PresidentsShoesSetupScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#071018');

    const g = this.add.graphics();
    g.fillStyle(0x071018, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x123c3b, 1).fillRect(0, height * 0.62, width, height * 0.38);

    this.add.text(width / 2, height * 0.14, 'YOUR PRESIDENCY', {
      fontFamily: 'monospace',
      fontSize: Math.max(22, Math.min(38, Math.min(width, height) * 0.07)) + 'px',
      fontStyle: 'bold',
      color: '#f4f7ff',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.25, 'Choose the name you will use in this fictional story.', {
      fontFamily: 'sans-serif',
      fontSize: Math.max(13, Math.min(18, Math.min(width, height) * 0.03)) + 'px',
      color: '#a9b8d6',
      align: 'center',
      wordWrap: { width: width * 0.82 },
    }).setOrigin(0.5);

    const boxWidth = Math.min(520, width * 0.82);
    const box = this.add.rectangle(width / 2, height * 0.40, boxWidth, 62, 0x101b2d, 1)
      .setStrokeStyle(2, 0x55d6c2, 0.9);

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
    this.nameInput.style.position = 'fixed';
    this.nameInput.style.zIndex = '1200';
    this.nameInput.style.boxSizing = 'border-box';
    this.nameInput.style.padding = '0 16px';
    this.nameInput.style.border = '0';
    this.nameInput.style.outline = 'none';
    this.nameInput.style.borderRadius = '4px';
    this.nameInput.style.background = '#101b2d';
    this.nameInput.style.color = '#f4f7ff';
    this.nameInput.style.font = '700 18px monospace';
    this.nameInput.style.caretColor = '#55d6c2';
    this.nameInput.style.userSelect = 'text';
    this.nameInput.style.touchAction = 'manipulation';
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

    this.status = this.add.text(width / 2, height * 0.55, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#e0b65a',
      align: 'center',
      wordWrap: { width: width * 0.82 },
    }).setOrigin(0.5);

    const buttonWidth = Math.min(310, width * 0.70);
    const button = this.add.rectangle(width / 2, height * 0.67, buttonWidth, 58, 0x55d6c2, 1)
      .setStrokeStyle(2, 0xdffbf6, 0.75)
      .setInteractive({ useHandCursor: false });
    const buttonText = this.add.text(button.x, button.y, this.hasSavedStory ? 'NEW STORY' : 'START THE STORY', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#071018',
      letterSpacing: 1,
    }).setOrigin(0.5);

    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.startStory(false);
    });

    if (this.hasSavedStory) {
      const continueButton = this.add.rectangle(width / 2, height * 0.76, buttonWidth, 50, 0x101b2d, 1)
        .setStrokeStyle(2, 0x55d6c2, 0.7)
        .setInteractive({ useHandCursor: false });
      const continueText = this.add.text(continueButton.x, continueButton.y, 'CONTINUE STORY', {
        fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#f4f7ff', letterSpacing: 1,
      }).setOrigin(0.5);
      continueButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.startStory(true);
      });
      void continueText;
    }

    this.add.text(width / 2, height * 0.88, 'Your name and story progress stay on this device for V1.', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6f8fa1',
      align: 'center',
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
    });

    void buttonText;
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

  private readSavedName() {
    try {
      return window.localStorage.getItem(PLAYER_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private hasSavedProgress() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw) as { sceneId?: unknown };
      return typeof saved.sceneId === 'string' && saved.sceneId !== 'ending-check';
    } catch {
      return false;
    }
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
    } catch {
      // Optional local storage.
    }

    this.registry.set('presidentsShoesPlayer', value);
    this.registry.set('presidentsShoesResume', resume);
    this.nameInput?.blur();
    this.cameras.main.fadeOut(400, 7, 16, 24);
    this.time.delayedCall(400, () => this.scene.start('PresidentsShoesGameScene'));
  }
}
