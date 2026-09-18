export class AdminHubAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private timer?: number;
  private started = false;
  private enabled = false;

  start() {
    if (this.started) {
      this.resume();
      return;
    }

    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.035;
      this.master.connect(this.context.destination);
      this.started = true;
      this.enabled = true;
      this.resume();
      this.scheduleBar();
    } catch {
      this.context = undefined;
      this.master = undefined;
      this.started = false;
      this.enabled = false;
    }
  }

  resume() {
    if (!this.started || !this.context) return;
    if (this.context.state === 'suspended') void this.context.resume();
  }

  stop() {
    if (!this.started) return;
    this.enabled = false;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
    this.master?.disconnect();
    this.master = undefined;
    void this.context?.close();
    this.context = undefined;
    this.started = false;
  }

  private scheduleBar() {
    if (!this.enabled) return;
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const now = context.currentTime + 0.04;
    const notes = [146.83, 174.61, 220, 196, 146.83, 164.81, 196, 246.94];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 4 === 0 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.58);
      gain.gain.setValueAtTime(0.0001, now + index * 0.58);
      gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.58 + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.58 + 0.48);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now + index * 0.58);
      oscillator.stop(now + index * 0.58 + 0.52);
    });

    this.timer = window.setTimeout(() => this.scheduleBar(), 4200);
  }
}

export const adminHubAudio = new AdminHubAudio();

