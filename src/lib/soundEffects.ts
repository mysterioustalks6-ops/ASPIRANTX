/**
 * Web Audio API Sound Generator for Offline / Native Mobile Experience.
 * Produces crisp, delightful 8-bit / modern micro-sounds without any external audio asset dependency.
 */

class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = false; // Sound OFF by default
  private hapticsEnabled: boolean = true; // Haptics ON by default

  constructor() {
    // Check user preference for sound (default: false)
    try {
      const storedSound = localStorage.getItem('aspirantx_sound_enabled');
      if (storedSound !== null) {
        this.soundEnabled = storedSound === 'true';
      } else {
        this.soundEnabled = false;
      }

      const storedHaptics = localStorage.getItem('aspirantx_haptics_enabled');
      if (storedHaptics !== null) {
        this.hapticsEnabled = storedHaptics === 'true';
      } else {
        this.hapticsEnabled = true;
      }
    } catch {
      this.soundEnabled = false;
      this.hapticsEnabled = true;
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('aspirantx_sound_enabled', String(enabled));
    } catch {}
  }

  public isHaptics(): boolean {
    return this.hapticsEnabled;
  }

  public setHaptics(enabled: boolean) {
    this.hapticsEnabled = enabled;
    try {
      localStorage.setItem('aspirantx_haptics_enabled', String(enabled));
    } catch {}
  }

  public triggerHaptic(pattern: number | number[] = 15) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(pattern);
      } catch {}
    }
  }

  /**
   * Duolingo signature "DING / SUCCESS" chord
   * Ascending sweet marimba harmonic chime (C5 -> E5 -> G5 -> C6)
   */
  public playCorrect() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.36);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  public playSuccess() {
    this.playCorrect();
  }

  public playIncorrect() {
    this.playWrong();
  }

  /**
   * Duolingo gentle "WRONG / ERROR" soft thud chord
   * Two descending notes (F#3 -> D3) that encourage learning without being jarring
   */
  public playWrong() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const freqs = [220.0, 185.0]; // A3 -> F#3 soft saw/sine
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.32);
      });
    } catch {}
  }

  /**
   * Tactile button tap "click" sound
   */
  public playTap() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Lesson complete fanfare / Level Up celebration
   */
  public playVictory() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Arpeggio fanfare
      const melody = [
        { f: 523.25, d: 0.1 },  // C5
        { f: 659.25, d: 0.1 },  // E5
        { f: 783.99, d: 0.1 },  // G5
        { f: 1046.50, d: 0.25 },// C6
        { f: 880.00, d: 0.1 },  // A5
        { f: 1046.50, d: 0.4 }  // C6 long
      ];

      let t = now;
      melody.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + note.d + 0.05);
        t += note.d * 0.9;
      });
    } catch {}
  }

  /**
   * Treasure chest open / Mystery reward sound
   */
  public playChestOpen() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Magical shimmer
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + i * 200, now + i * 0.04);

        gain.gain.setValueAtTime(0.12, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.2);
      }
    } catch {}
  }
}

export const soundFx = new SoundFxEngine();
