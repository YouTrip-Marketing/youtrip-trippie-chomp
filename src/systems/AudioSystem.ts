/**
 * Sound effects via Web Audio API oscillators (same as v1).
 * Background music: procedural 8-bit chiptune loop.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private bgmPlaying: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmTimeout: number | null = null;

  init(): void {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  play(type: 'dot' | 'power' | 'ghost' | 'die' | 'click' | 'levelup'): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'dot':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(784, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'power':
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'ghost':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'die':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        break;

      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.03);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'levelup': {
        // Cheerful ascending arpeggio
        osc.type = 'square';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        osc.frequency.setValueAtTime(1047, now + 0.3);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.setValueAtTime(0.18, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        // Second voice — harmony
        const osc2 = this.ctx!.createOscillator();
        const gain2 = this.ctx!.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx!.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(262, now);
        osc2.frequency.setValueAtTime(330, now + 0.1);
        osc2.frequency.setValueAtTime(392, now + 0.2);
        osc2.frequency.setValueAtTime(523, now + 0.3);
        gain2.gain.setValueAtTime(0.12, now);
        gain2.gain.setValueAtTime(0.12, now + 0.35);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.start(now);
        osc2.stop(now + 0.55);
        break;
      }
    }
  }

  startBGM(): void {
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;

    // Master gain for BGM (keep it quiet so SFX shine)
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.08;
    this.bgmGain.connect(this.ctx.destination);

    this.playLoop();
  }

  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmTimeout !== null) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.3);
    }
  }

  private playLoop(): void {
    if (!this.ctx || !this.bgmPlaying || !this.bgmGain) return;

    // Cute 8-bit melody — bouncy, Pacman-inspired chiptune
    // Notes in Hz (C major pentatonic + some fun chromatic touches)
    const melody = [
      // Bar 1 — bouncy ascending
      523, 587, 659, 784,  523, 587, 659, 784,
      // Bar 2 — playful descent
      880, 784, 659, 587,  523, 587, 659, 523,
      // Bar 3 — hop hop
      659, 0, 659, 0,  784, 0, 784, 0,
      // Bar 4 — resolution
      880, 784, 659, 784,  880, 1047, 880, 784,
      // Bar 5 — variation ascending
      392, 440, 523, 587,  659, 587, 523, 440,
      // Bar 6 — syncopated
      523, 0, 659, 523,  784, 0, 659, 784,
      // Bar 7 — high energy
      880, 988, 1047, 988,  880, 784, 659, 784,
      // Bar 8 — ending phrase
      880, 784, 659, 523,  587, 659, 523, 0,
    ];

    // Bass line (lower octave, simple root notes)
    const bass = [
      262, 262, 262, 262,  294, 294, 294, 294,
      330, 330, 330, 330,  262, 262, 262, 262,
      330, 330, 330, 330,  392, 392, 392, 392,
      440, 440, 440, 440,  392, 392, 392, 392,
      196, 196, 196, 196,  220, 220, 220, 220,
      262, 262, 262, 262,  294, 294, 294, 294,
      330, 330, 330, 330,  392, 392, 392, 392,
      440, 440, 330, 262,  294, 330, 262, 262,
    ];

    const bpm = 160;
    const noteLen = 60 / bpm / 2; // sixteenth notes
    const now = this.ctx.currentTime;

    // Play melody
    melody.forEach((freq, i) => {
      if (freq === 0) return; // rest
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.bgmGain!);

      const t = now + i * noteLen;
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + noteLen * 0.85);
      osc.start(t);
      osc.stop(t + noteLen * 0.9);
    });

    // Play bass
    bass.forEach((freq, i) => {
      if (freq === 0) return;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.bgmGain!);

      const t = now + i * noteLen;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + noteLen * 0.8);
      osc.start(t);
      osc.stop(t + noteLen * 0.85);
    });

    // Schedule next loop
    const loopDuration = melody.length * noteLen * 1000;
    this.bgmTimeout = window.setTimeout(() => {
      this.playLoop();
    }, loopDuration);
  }
}

export const audioSystem = new AudioSystem();
