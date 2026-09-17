import Phaser from 'phaser';

export class NameEntryScene extends Phaser.Scene {
  private inputText = '';
  private label!: Phaser.GameObjects.Text;
  private caret!: Phaser.GameObjects.Text;

  constructor() {
    super('NameEntryScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.drawBackdrop(width, height);

    this.add.text(width / 2, height * 0.22, 'WELCOME', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#30251e',
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.30, 'What should we call you?', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#554335',
    }).setOrigin(0.5);

    const box = this.add.rectangle(width / 2, height * 0.45, 300, 58, 0xf0e4c6, 1)
      .setStrokeStyle(3, 0x624937, 1);

    this.label = this.add.text(box.x - 125, box.y, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#30251e',
    }).setOrigin(0, 0.5);

    this.caret = this.add.text(box.x - 125, box.y, '|', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#30251e',
    }).setOrigin(0, 0.5);

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this.caret.setVisible(!this.caret.visible),
    });

    this.add.text(width / 2, height * 0.60, 'TYPE YOUR NAME  ·  ENTER TO CONTINUE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#6a5140',
      letterSpacing: 1,
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (this.inputText.trim()) this.startGame();
        return;
      }

      if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
        this.refresh();
        return;
      }

      if (event.key.length === 1 && this.inputText.length < 18 && /[a-zA-Z0-9 _-]/.test(event.key)) {
        this.inputText += event.key;
        this.refresh();
      }
    });
  }

  private refresh() {
    this.label.setText(this.inputText);
    this.caret.x = this.label.x + this.label.width + 4;
  }

  private startGame() {
    this.registry.set('playerName', this.inputText.trim());
    this.cameras.main.fadeOut(450, 22, 18, 14);
    this.time.delayedCall(450, () => this.scene.start('GameShellScene'));
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
