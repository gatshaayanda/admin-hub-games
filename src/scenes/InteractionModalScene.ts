import Phaser from 'phaser';

export type InteractionModalData = {
  title: string;
  subtitle: string;
  body: string;
  accent: number;
  onPrivateNote?: () => Promise<string | void> | string | void;
  onWorldNote?: () => Promise<string | void> | string | void;
};

export class InteractionModalScene extends Phaser.Scene {
  private closing = false;

  constructor() {
    super('InteractionModalScene');
  }

  create(data: InteractionModalData) {
    const { width, height } = this.scale;
    const portrait = height > width;
    const panelWidth = Math.min(width * (portrait ? 0.90 : 0.72), 720);
    const panelHeight = Math.min(height * (portrait ? 0.72 : 0.68), 430);

    this.input.topOnly = true;

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x100c09, 0.72)
      .setDepth(1)
      .setInteractive();

    backdrop.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.close();
    });

    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x241b16, 0.98)
      .setStrokeStyle(3, data.accent, 1)
      .setDepth(2)
      .setInteractive();

    panel.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });

    const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 32, data.title, {
      fontFamily: 'monospace',
      fontSize: `${Math.max(18, Math.min(28, panelWidth * 0.045))}px`,
      fontStyle: 'bold',
      color: '#fff4d4',
      align: 'center',
    }).setOrigin(0.5).setDepth(3);

    const subtitle = this.add.text(width / 2, height / 2 - panelHeight / 2 + 67, data.subtitle, {
      fontFamily: 'monospace',
      fontSize: portrait ? '9px' : '10px',
      color: '#d9bd87',
      align: 'center',
      wordWrap: { width: panelWidth * 0.78 },
    }).setOrigin(0.5).setDepth(3);

    const body = this.add.text(width / 2, height / 2 - panelHeight / 2 + 108, data.body, {
      fontFamily: 'monospace',
      fontSize: portrait ? '11px' : '12px',
      color: '#fff8e8',
      align: 'center',
      wordWrap: { width: panelWidth * 0.78 },
      lineSpacing: 7,
    }).setOrigin(0.5, 0).setDepth(3);

    const buttonWidth = Math.min(220, panelWidth * 0.34);
    const buttonY = height / 2 + panelHeight / 2 - (portrait ? 92 : 72);
    const gap = Math.min(panelWidth * 0.20, 145);

    const privateButton = this.makeButton(width / 2 - gap, buttonY, buttonWidth, 50, 'PRIVATE NOTE', 0xd6a84d);
    const worldButton = this.makeButton(width / 2 + gap, buttonY, buttonWidth, 50, 'LEAVE IN WORLD', 0x4d9b98);
    const closeButton = this.makeButton(width / 2, height / 2 + panelHeight / 2 - 24, Math.min(150, panelWidth * 0.30), 34, 'CLOSE', 0x6d5947);

    privateButton.on('pointerdown', async (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      await this.runAction(data.onPrivateNote);
    });

    worldButton.on('pointerdown', async (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      await this.runAction(data.onWorldNote);
    });

    closeButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.close();
    });

    this.input.keyboard?.once('keydown-E', () => this.close());
    this.input.keyboard?.once('keydown-SPACE', () => this.close());
    this.input.keyboard?.once('keydown-ESC', () => this.close());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.closing = true;
    });

    this.tweens.add({
      targets: [backdrop, panel, title, subtitle, body, privateButton, worldButton, closeButton],
      alpha: 0,
      duration: 0,
      onComplete: () => {
        this.tweens.add({
          targets: [backdrop, panel, title, subtitle, body, privateButton, worldButton, closeButton],
          alpha: 1,
          duration: 180,
          ease: 'Sine.easeOut',
        });
      },
    });
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, accent: number) {
    const button = this.add.container(x, y).setDepth(4);
    const shape = this.add.rectangle(0, 0, width, height, 0x493526, 0.96)
      .setStrokeStyle(2, accent, 0.95);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#fff4d4',
      align: 'center',
      letterSpacing: 0.7,
    }).setOrigin(0.5);

    button.add([shape, text]);
    button.setSize(width, height).setInteractive({ useHandCursor: false });
    return button;
  }

  private async runAction(action?: () => Promise<string | void> | string | void) {
    if (this.closing) return;
    let message: string | void;

    try {
      message = await action?.();
    } catch {
      message = 'Something went wrong. The world is still here.';
    }

    this.close();
    if (message) this.registry.set('modalMessage', message);
  }

  private close() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop('InteractionModalScene');
    this.scene.resume('GameShellScene');
  }
}
