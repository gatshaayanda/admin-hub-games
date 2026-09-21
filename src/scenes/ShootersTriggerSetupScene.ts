import Phaser from 'phaser';

const PLAYER_KEY = 'admin-hub-games:shooters-trigger-player';

export class ShootersTriggerSetupScene extends Phaser.Scene {
  private name = '';
  private nameInput?: HTMLInputElement;
  private status?: Phaser.GameObjects.Text;
  private leaving = false;
  private resizeHandler?: () => void;

  constructor() {
    super('ShootersTriggerSetupScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#102018');
    const g = this.add.graphics();
    g.fillStyle(0x102018, 1).fillRect(0, 0, width, height);
    g.fillStyle(0x254b32, 1).fillRect(0, height * 0.66, width, height * 0.34);
    g.fillStyle(0xe8c95c, 1).fillRect(0, height * 0.66, width, Math.max(3, height * 0.008));

    this.add.text(width / 2, height * 0.10, 'SHOOTERS TRIGGER', {
      fontFamily: 'monospace', fontSize: Math.max(20, Math.min(34, Math.min(width, height) * 0.06)) + 'px',
      fontStyle: 'bold', color: '#f4f1df', letterSpacing: 1.2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.18, 'ENTER THE FIELD', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
      color: '#e8c95c', letterSpacing: 2,
    }).setOrigin(0.5);

    const boxWidth = Math.min(520, width * 0.82);
    const boxY = height * 0.34;
    const box = this.add.rectangle(width / 2, boxY, boxWidth, 60, 0x182d21, 1)
      .setStrokeStyle(2, 0x8ab56a, 0.85);

    this.name = this.readName();
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 24;
    this.nameInput.autocomplete = 'off';
    this.nameInput.autocapitalize = 'words';
    this.nameInput.spellcheck = false;
    this.nameInput.placeholder = 'Your player name';
    this.nameInput.value = this.name;
    this.nameInput.setAttribute('aria-label', 'Shooters Trigger player name');
    Object.assign(this.nameInput.style, {
      position: 'fixed', zIndex: '1200', boxSizing: 'border-box',
      padding: '0 16px', border: '0', outline: 'none', borderRadius: '4px',
      background: '#182d21', color: '#f4f1df', font: '700 18px monospace',
      caretColor: '#e8c95c', userSelect: 'text', touchAction: 'manipulation',
    });
    document.getElementById('app')?.appendChild(this.nameInput);

    this.nameInput.addEventListener('input', () => {
      this.name = this.nameInput?.value.replace(/[^a-zA-Z0-9 .'-]/g, '').slice(0, 24) ?? '';
      if (this.nameInput && this.nameInput.value !== this.name) this.nameInput.value = this.name;
      this.status?.setText('');
    });

    this.nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.startTraining();
      }
    });

    this.status = this.add.text(width / 2, height * 0.45, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#e8c95c',
      align: 'center', wordWrap: { width: width * 0.84 },
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.55,
      'ONE PLAYER\nYou\n\nONE FIELD\nWalk · Aim · Fire · Explore',
      {
        fontFamily: 'monospace',
        fontSize: Math.max(11, Math.min(16, Math.min(width, height) * 0.026)) + 'px',
        color: '#d6e2d1', align: 'center', lineSpacing: 5,
      }).setOrigin(0.5);

    const buttonWidth = Math.min(330, width * 0.72);
    const button = this.add.rectangle(width / 2, height * 0.76, buttonWidth, 58, 0xe8c95c, 1)
      .setStrokeStyle(2, 0xf4f1df, 0.8).setInteractive({ useHandCursor: false });

    this.add.text(button.x, button.y, 'START FIELD TRAINING', {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
      color: '#102018', letterSpacing: 1,
    }).setOrigin(0.5);

    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.startTraining();
    });

    this.positionInput(box.x, box.y, boxWidth);
    this.resizeHandler = () => this.positionInput(box.x, box.y, boxWidth);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
    this.time.delayedCall(250, () => this.nameInput?.focus({ preventScroll: true }));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
      this.resizeHandler = undefined;
      this.nameInput?.remove();
      this.nameInput = undefined;
    });
  }

  private startTraining() {
    if (this.leaving) return;
    const value = this.name.trim();
    if (!value) {
      this.status?.setText('Enter your name first.');
      this.nameInput?.focus({ preventScroll: true });
      return;
    }

    this.leaving = true;
    try { window.localStorage.setItem(PLAYER_KEY, value); } catch {}
    this.registry.set('shootersTriggerPlayer', value);
    this.nameInput?.blur();
    this.cameras.main.fadeOut(350, 16, 26, 19);
    this.time.delayedCall(350, () => this.scene.start('ShootersTriggerLobbyScene'));
  }

  private readName() {
    try { return window.localStorage.getItem(PLAYER_KEY) ?? ''; } catch { return ''; }
  }

  private positionInput(x: number, y: number, boxWidth: number) {
    const canvas = document.querySelector<HTMLCanvasElement>('#app canvas');
    if (!this.nameInput || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / this.scale.width;
    const scaleY = rect.height / this.scale.height;
    this.nameInput.style.left = rect.left + (x - boxWidth / 2) * scaleX + 'px';
    this.nameInput.style.top = rect.top + (y - 30) * scaleY + 'px';
    this.nameInput.style.width = boxWidth * scaleX + 'px';
    this.nameInput.style.height = Math.max(52, 60 * scaleY) + 'px';
    this.nameInput.style.fontSize = Math.max(16, Math.min(20, 18 * scaleY)) + 'px';
  }
}
