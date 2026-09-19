import Phaser from 'phaser';

const PLAYER_KEY = 'admin-hub-games:presidents-shoes-player';

export class PresidentsShoesSetupScene extends Phaser.Scene {
  private name = '';
  private input?: HTMLInputElement;
  private status!: Phaser.GameObjects.Text;
  private leaving = false;

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

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.maxLength = 24;
    this.input.autocomplete = 'nickname';
    this.input.autocapitalize = 'words';
    this.input.spellcheck = false;
    this.input.placeholder = 'Your fictional presidential name';
    this.input.value = this.name;
    this.input.setAttribute('aria-label', 'Fictional presidential name');
    this.input.style.position = 'fixed';
    this.input.style.zIndex = '1200';
    this.input.style.boxSizing = 'border-box';
    this.input.style.padding = '0 16px';
    this.input.style.border = '0';
    this.input.style.outline = 'none';
    this.input.style.borderRadius = '4px';
    this.input.style.background = '#101b2d';
    this.input.style.color = '#f4f7ff';
    this.input.style.font = '700 18px monospace';
    this.input.style.caretColor = '#55d6c2';
    this.input.style.userSelect = 'text';
    this.input.style.touchAction = 'manipulation';
    document.getElementById('app')?.appendChild(this.input);

    this.input.addEventListener('input', () => {
      this.name = this.input?.value.replace(/[^a-zA-Z0-9 .'-]/g, '').slice(0, 24) ?? '';
      if (this.input && this.input.value !== this.name) this.input.value = this.name;
      this.status.setText('');
    });

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.startStory();
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
    const buttonText = this.add.text(button.x, button.y, 'START THE STORY', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#071018',
      letterSpacing: 1,
    }).setOrigin(0.5);

    button.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.startStory();
    });

    this.add.text(width / 2, height * 0.82, 'Your name and story progress stay on this device for V1.', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6f8fa1',
      align: 'center',
    }).setOrigin(0.5);

    this.positionInput(box.x, box.y, boxWidth);
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.positionInput(box.x, box.y, boxWidth), this);

    this.time.delayedCall(250, () => {
      this.input?.focus({ preventScroll: true });
      this.input?.select();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.positionInput, this);
      this.input?.remove();
      this.input = undefined;
    });

    void buttonText;
  }

  private positionInput(x: number, y: number, boxWidth: number) {
    const canvas = document.querySelector<HTMLCanvasElement>('#app canvas');
    if (!this.input || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / this.scale.width;
    const scaleY = rect.height / this.scale.height;
    this.input.style.left = rect.left + (x - boxWidth / 2) * scaleX + 'px';
    this.input.style.top = rect.top + (y - 28) * scaleY + 'px';
    this.input.style.width = boxWidth * scaleX + 'px';
    this.input.style.height = Math.max(52, 56 * scaleY) + 'px';
    this.input.style.fontSize = Math.max(16, Math.min(20, 18 * scaleY)) + 'px';
  }

  private readSavedName() {
    try {
      return window.localStorage.getItem(PLAYER_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private startStory() {
    if (this.leaving) return;
    const value = this.name.trim();
    if (!value) {
      this.status.setText('Choose a name first.');
      this.input?.focus({ preventScroll: true });
      return;
    }

    this.leaving = true;
    try {
      window.localStorage.setItem(PLAYER_KEY, value);
    } catch {
      // Optional local storage.
    }

    this.registry.set('presidentsShoesPlayer', value);
    this.input?.blur();
    this.cameras.main.fadeOut(400, 7, 16, 24);
    this.time.delayedCall(400, () => this.scene.start('PresidentsShoesGameScene'));
  }
}
