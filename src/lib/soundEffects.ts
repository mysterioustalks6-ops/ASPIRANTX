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
   * Calm Highway signature "DING / SUCCESS" chord
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
   * Gentle "WRONG / ERROR" soft thud chord
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

  // ── AMBIENT HIGHWAY SOUND GENERATOR (100% OFFLINE WEB AUDIO) ──
  private ambientType: 'off' | 'rain' | 'wind' | 'engine' = 'off';
  private ambientGainNode: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];

  public getAmbientType(): 'off' | 'rain' | 'wind' | 'engine' {
    return this.ambientType;
  }

  public setAmbient(type: 'off' | 'rain' | 'wind' | 'engine') {
    this.stopAmbient();
    if (type === 'off') {
      this.ambientType = 'off';
      return;
    }
    this.ambientType = type;
    this.initContext();
    if (!this.ctx) return;

    try {
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.28, this.ctx.currentTime + 1.0);
      masterGain.connect(this.ctx.destination);
      this.ambientGainNode = masterGain;

      if (type === 'rain') {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.32;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        this.ambientNodes = [whiteNoise, filter, masterGain];
      } else if (type === 'wind') {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.35;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(420, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.4, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.22, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);

        lfo.connect(filter.frequency);
        noise.connect(filter);
        filter.connect(masterGain);

        noise.start();
        lfo.start();
        this.ambientNodes = [noise, filter, lfo, lfoGain, masterGain];
      } else if (type === 'engine') {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const engineFilter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(52, this.ctx.currentTime);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(104, this.ctx.currentTime);

        engineFilter.type = 'lowpass';
        engineFilter.frequency.setValueAtTime(200, this.ctx.currentTime);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

        osc1.connect(engineFilter);
        osc2.connect(engineFilter);
        engineFilter.connect(subGain);
        subGain.connect(masterGain);

        osc1.start();
        osc2.start();
        this.ambientNodes = [osc1, osc2, engineFilter, subGain, masterGain];
      }
    } catch (err) {
      console.warn('Ambient sound error:', err);
    }
  }

  public stopAmbient() {
    if (this.ambientGainNode && this.ctx) {
      try {
        const gain = this.ambientGainNode;
        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      } catch {}
    }
    const nodes = this.ambientNodes;
    this.ambientNodes = [];
    this.ambientGainNode = null;
    this.ambientType = 'off';

    setTimeout(() => {
      nodes.forEach((n) => {
        try {
          if ('stop' in n && typeof (n as any).stop === 'function') {
            (n as any).stop();
          }
          n.disconnect();
        } catch {}
      });
    }, 500);
  }
}

export const soundFx = new SoundFxEngine();

