import Phaser from 'phaser';
import { savePlayerProfile } from '../firebase/firebase';

const PLAYER_NAME_KEY = 'admin-hub-games:player-name';
const GAMEBOOK_KEY = 'admin-hub-games:gamebook';

export class NameEntryScene extends Phaser.Scene {
  private inputText = '';
  private label!: Phaser.GameObjects.Text;
  private caret!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container;
  private nameInput?: HTMLInputElement;
  private resizeHandler?: () => void;

  constructor() {
    super('NameEntryScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.drawBackdrop(width, height);

    this.add.text(width / 2, height * 0.15, 'WELCOME', {
      fontFamily: 'monospace', fontSize: `${Math.max(16, Math.min(24, width * 0.024))}px`, fontStyle: 'bold', color: '#30251e', letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.24, 'What should we call you?', {
      fontFamily: 'monospace', fontSize: `${Math.max(13, Math.min(19, width * 0.018))}px`, color: '#554335',
    }).setOrigin(0.5);

    const boxWidth = Math.min(440, width * 0.72);
    const box = this.add.rectangle(width / 2, height * 0.37, boxWidth, 58, 0xf0e4c6, 1)
      .setStrokeStyle(3, 0x624937, 1);

    this.label = this.add.text(box.x - boxWidth / 2 + 18, box.y, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#30251e',
    }).setOrigin(0, 0.5);

    this.caret = this.add.text(box.x - boxWidth / 2 + 18, box.y, '|', {
      fontFamily: 'monospace', fontSize: '20px', color: '#30251e',
    }).setOrigin(0, 0.5);

    this.time.addEvent({ delay: 500, loop: true, callback: () => this.caret.setVisible(!this.caret.visible) });

    this.add.text(width / 2, height * 0.49, 'TYPE YOUR NAME  ·  ENTER TO CONTINUE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#6a5140', letterSpacing: 1,
    }).setOrigin(0.5);

    this.startButton = this.add.container(width / 2, height * 0.59).setDepth(10);
    const buttonWidth = Math.min(260, width * 0.58);
    const button = this.add.rectangle(0, 0, buttonWidth, 54, 0x493526, 0.95)
      .setStrokeStyle(3, 0xf0dfb6, 0.95);
    const buttonText = this.add.text(0, 0, 'ENTER THE WORLD', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fff4d4', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.startButton.add([button, buttonText]);
    this.startButton.setSize(buttonWidth, 54).setInteractive({ useHandCursor: false });
    this.startButton.on('pointerdown', () => this.startGame());

    this.status = this.add.text(width / 2, height * 0.69, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#6a5140', align: 'center',
      wordWrap: { width: width * 0.82 },
    }).setOrigin(0.5);

    const reset = this.add.text(width / 2, height * 0.82, 'RESET LOCAL GAME DATA', {
      fontFamily: 'monospace', fontSize: '10px', color: '#6f3f32',
      backgroundColor: '#f0dfb6', padding: { left: 14, right: 14, top: 9, bottom: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });
    reset.on('pointerdown', () => this.resetLocalGameData());

    this.loadSavedName();
    this.installNativeNameInput(box.x, box.y, boxWidth);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.nameInput && document.activeElement === this.nameInput) return;
      this.handleTextInput(event);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeNativeNameInput());
  }

  private handleTextInput(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.inputText.trim()) this.startGame();
      return;
    }
    if (event.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
      this.refresh();
      this.syncNativeInput();
      return;
    }
    if (event.key.length === 1 && this.inputText.length < 18 && /[a-zA-Z0-9 _-]/.test(event.key)) {
      this.inputText += event.key;
      this.refresh();
      this.syncNativeInput();
    }
  }

  private installNativeNameInput(x: number, y: number, boxWidth: number) {
    if (!window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints === 0) return;

    const input = document.createElement('input');
    input.id = 'ahg-name-input';
    input.type = 'text';
    input.setAttribute('autocomplete', 'nickname');
    input.autocapitalize = 'words';
    input.spellcheck = false;
    input.maxLength = 18;
    input.inputMode = 'text';
    input.setAttribute('aria-label', 'Player name');

    input.addEventListener('input', () => {
      this.inputText = input.value.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 18);
      if (input.value !== this.inputText) input.value = this.inputText;
      this.refresh();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (this.inputText.trim()) this.startGame();
      }
    });

    document.getElementById('app')?.appendChild(input);
    this.nameInput = input;
    this.positionNativeNameInput(x, y, boxWidth);
    this.resizeHandler = () => this.positionNativeNameInput(x, y, boxWidth);
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    window.addEventListener('orientationchange', this.resizeHandler, { passive: true });

    input.focus({ preventScroll: true });
  }

  private positionNativeNameInput(x: number, y: number, boxWidth: number) {
    const input = this.nameInput;
    const canvas = document.querySelector<HTMLCanvasElement>('#app canvas');
    if (!input || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / this.scale.width;
    const scaleY = rect.height / this.scale.height;
    const fontSize = Math.max(16, Math.min(20, 20 * scaleY));

    input.style.left = `${rect.left + (x - boxWidth / 2 + 12) * scaleX}px`;
    input.style.top = `${rect.top + (y - 26) * scaleY}px`;
    input.style.width = `${Math.max(80, (boxWidth - 24) * scaleX)}px`;
    input.style.height = `${Math.max(38, 52 * scaleY)}px`;
    input.style.fontSize = `${fontSize}px`;
  }

  private syncNativeInput() {
    if (this.nameInput && this.nameInput.value !== this.inputText) this.nameInput.value = this.inputText;
  }

  private removeNativeNameInput() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
    }
    this.nameInput?.remove();
    this.nameInput = undefined;
    this.resizeHandler = undefined;
  }

  private loadSavedName() {
    try {
      const saved = window.localStorage.getItem(PLAYER_NAME_KEY);
      if (saved) {
        this.inputText = saved;
        this.refresh();
        this.status.setText('Your name is remembered on this device. Tap ENTER THE WORLD to continue.');
      }
    } catch {
      // Local storage is optional.
    }
  }

  private refresh() {
    this.label.setText(this.inputText);
    this.caret.x = this.label.x + this.label.width + 4;
  }

  private async startGame() {
    const playerName = this.inputText.trim();
    if (!playerName) {
      this.status.setText('Choose a name first.');
      this.nameInput?.focus({ preventScroll: true });
      return;
    }

    this.nameInput?.blur();
    this.registry.set('playerName', playerName);
    try {
      window.localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // Local storage is optional.
    }

    this.status.setText('Saving your player identity…');
    await savePlayerProfile(playerName);
    this.cameras.main.fadeOut(450, 22, 18, 14);
    this.time.delayedCall(450, () => this.scene.start('GameShellScene'));
  }

  private resetLocalGameData() {
    try {
      window.localStorage.removeItem(PLAYER_NAME_KEY);
      window.localStorage.removeItem(GAMEBOOK_KEY);
    } catch {
      // Ignore storage failures.
    }
    this.registry.remove('playerName');
    this.inputText = '';
    this.syncNativeInput();
    this.refresh();
    this.status.setText('Local name and private Gamebook cleared. World Notes are not deleted.');
  }

  private drawBackdrop(width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(0xe8d6a8, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xd0ad70, 1).fillRect(0, height * 0.58, width, height * 0.42);
    g.fillStyle(0xa76545, 1);
    g.beginPath();
    g.moveTo(0, height * 0.72);
    g.lineTo(width * 0.35, height * 0.62);
    g.lineTo(width * 0.72, height * 0.67);
    g.lineTo(width, height * 0.58);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fillPath();
  }
}
