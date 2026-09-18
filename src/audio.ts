export class AdminHubAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private timer?: number;
  private started = false;
  private enabled = false;
  private scheduling = false;

  start() {
    if (this.started && this.context) {
      this.enabled = true;
      this.resume();
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      const context = new AudioContextClass();
      const master = context.createGain();
      master.gain.value = 0.11;
      master.connect(context.destination);

      this.context = context;
      this.master = master;
      this.started = true;
      this.enabled = true;

      context.addEventListener('statechange', () => {
        if (!this.enabled) return;
        if (context.state === 'running') this.ensureSchedule();
      });

      this.resume();
      this.ensureSchedule();
    } catch {
      this.context = undefined;
      this.master = undefined;
      this.started = false;
      this.enabled = false;
      this.scheduling = false;
    }
  }

  resume() {
    if (!this.started || !this.context) return;

    const state = this.context.state as AudioContextState | 'interrupted';
    if (state === 'suspended' || state === 'interrupted') {
      void this.context.resume().then(() => this.ensureSchedule()).catch(() => undefined);
      return;
    }

    if (state === 'running') this.ensureSchedule();
  }

  stop() {
    this.enabled = false;
    this.scheduling = false;

    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;

    this.master?.disconnect();
    this.master = undefined;

    const context = this.context;
    this.context = undefined;
    this.started = false;

    if (context && context.state !== 'closed') void context.close();
  }

  private ensureSchedule() {
    if (!this.enabled || !this.context || !this.master) return;
    if (this.context.state !== 'running') return;
    if (this.scheduling) return;

    this.scheduling = true;
    this.scheduleBar();
  }

  private scheduleBar() {
    if (!this.enabled || !this.context || !this.master) {
      this.scheduling = false;
      return;
    }

    const context = this.context;
    const master = this.master;
    const now = context.currentTime + 0.06;
    const notes = [146.83, 174.61, 220, 196, 146.83, 164.81, 196, 246.94];

    notes.forEach((frequency, index) => {
      const start = now + index * 0.58;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = index % 4 === 0 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.52);
    });

    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.scheduling = false;
      this.ensureSchedule();
    }, 4200);
  }
}

export const adminHubAudio = new AdminHubAudio();

// Browsers intentionally gate Web Audio until the user interacts with the page.
// Install the unlock path at the publisher level so audio can begin during the
// opening/Hall experience instead of waiting for GameShell to mount.
const unlockAudio = () => adminHubAudio.start();
const recoverAudio = () => {
  if (document.visibilityState === 'visible') adminHubAudio.resume();
};

window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio);
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('focus', recoverAudio);
window.addEventListener('pageshow', recoverAudio);
document.addEventListener('visibilitychange', recoverAudio);
