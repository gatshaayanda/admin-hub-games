import Phaser from 'phaser';
import { openNativeNoteComposer } from '../ui/nativeNoteComposer';

export type InteractionModalData = {
  title: string;
  subtitle: string;
  body: string;
  accent: number;
  onPrivateNote?: () => Promise<string | void> | string | void;
  onWorldNote?: (text?: string) => Promise<string | void> | string | void;
};

export class InteractionModalScene extends Phaser.Scene {
  private closing = false;

  constructor() {
    super('InteractionModalScene');
  }

  create(data: InteractionModalData) {
    const { width, height } = this.scale;
    const portrait = height > width;
    const compact = height < 430;
    const panelWidth = Math.min(width * 0.94, 720);
    const panelHeight = Math.min(height * (compact ? 0.92 : 0.88), portrait ? 640 : 560);

    this.input.topOnly = true;
    this.input.enabled = true;

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x100c09, 0.78)
      .setDepth(1)
      .setInteractive();

    const pointerHandler = (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      window.setTimeout(() => this.close(), 0);
    };

    backdrop.on('pointerdown', pointerHandler);

    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x241b16, 0.98)
      .setStrokeStyle(3, data.accent, 1)
      .setDepth(2)
      .setInteractive();

    panel.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
    });

    const top = height / 2 - panelHeight / 2;
    const title = this.add.text(width / 2, top + 28, data.title, {
      fontFamily: 'monospace',
      fontSize: portrait ? '22px' : '28px',
      fontStyle: 'bold',
      color: '#fff4d4',
      align: 'center',
      wordWrap: { width: panelWidth * 0.82 },
    }).setOrigin(0.5).setDepth(3);

    const subtitle = this.add.text(width / 2, top + 62, data.subtitle, {
      fontFamily: 'monospace',
      fontSize: compact ? '10px' : (portrait ? '12px' : '10px'),
      color: '#d9bd87',
      align: 'center',
      wordWrap: { width: panelWidth * 0.78 },
    }).setOrigin(0.5).setDepth(3);

    const buttonY = height / 2 + panelHeight / 2 - (portrait ? 104 : 86);
    const bodyTop = top + 94;
    const bodyHeight = Math.max(92, buttonY - bodyTop - 34);

    const body = this.add.text(width / 2, bodyTop, data.body, {
      fontFamily: 'monospace',
      fontSize: compact ? '12px' : (portrait ? '14px' : '12px'),
      color: '#fff8e8',
      align: 'center',
      wordWrap: { width: panelWidth * 0.78 },
      lineSpacing: compact ? 5 : 7,
    }).setOrigin(0.5, 0).setDepth(3);

    body.setFixedSize(panelWidth * 0.78, bodyHeight);
    body.setMaxLines(compact ? 5 : (portrait ? 9 : 8));

    const buttonWidth = Math.min(250, panelWidth * (portrait ? 0.38 : 0.34));
    const gap = Math.min(panelWidth * (portrait ? 0.18 : 0.20), 120);
    const privateButton = this.makeButton(width / 2 - gap, buttonY, buttonWidth, 50, 'PRIVATE NOTE', 0xd6a84d);
    const worldButton = this.makeButton(width / 2 + gap, buttonY, buttonWidth, 50, 'LEAVE IN WORLD', 0x4d9b98);
    const closeButton = this.makeButton(
      width / 2,
      height / 2 + panelHeight / 2 - 28,
      Math.min(180, panelWidth * 0.38),
      44,
      'CLOSE',
      0x6d5947,
    );

    privateButton.on('pointerdown', async (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      window.setTimeout(() => { void this.runAction(data.onPrivateNote); }, 0);
    });

    worldButton.on('pointerdown', async (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      window.setTimeout(() => this.openWorldNoteComposer(data.onWorldNote), 0);
    });

    closeButton.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      this.time.delayedCall(0, () => this.close());
    });

    this.registry.set('activeInteractionModal', data);

    // E/SPACE are gameplay/interact keys and can be the same event that opened
    // this modal. Registering listeners for them here can immediately close a
    // freshly opened modal. ESC remains the explicit keyboard close action.
    this.input.keyboard?.once('keydown-ESC', () => this.close());

    const escapeHandler = () => this.close();
    window.addEventListener('ahg:escape', escapeHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.closing = true;
      window.removeEventListener('ahg:escape', escapeHandler);
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
    const portrait = this.scale.height > this.scale.width;
    const button = this.add.container(x, y).setDepth(4);
    const shape = this.add.rectangle(0, 0, width, height, 0x493526, 0.96)
      .setStrokeStyle(2, accent, 0.95);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: portrait ? '12px' : '9px',
      fontStyle: 'bold',
      color: '#fff4d4',
      align: 'center',
      letterSpacing: 0.7,
    }).setOrigin(0.5);

    button.add([shape, text]);
    button.setSize(width, height).setInteractive({ useHandCursor: false });
    return button;
  }

  private actionRunning = false;

  private async openWorldNoteComposer(action?: (text?: string) => Promise<string | void> | string | void) {
    if (this.closing) return;

    const text = await openNativeNoteComposer({
      title: 'LEAVE IN WORLD',
      hint: 'Write something other players can see.',
      placeholder: 'Your note…',
      maxLength: 500,
      actionLabel: 'PUBLISH',
    });

    if (this.closing) return;

    // Close the Phaser modal before starting the Firestore write. The Android
    // browser must not keep a Phaser Scene alive while a native touch action
    // waits on Firebase/network I/O.
    const publish = action;
    this.close();
    if (!publish) return;

    window.setTimeout(() => {
      void publish(text || undefined);
    }, 0);
  }

  private async runAction(action?: () => Promise<string | void> | string | void) {
    if (this.closing || this.actionRunning) return;
    this.actionRunning = true;
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

    // GameShellScene intentionally stays RUNNING while this modal is open.
    // Do not call resume() on a scene that was never paused: on touch devices
    // that creates an unnecessary SceneManager mutation during modal teardown.
    window.setTimeout(() => {
      this.input.enabled = false;
      this.registry.remove('activeInteractionModal');
      this.scene.stop('InteractionModalScene');
    }, 0);
  }
}