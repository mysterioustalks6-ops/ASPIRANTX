/**
 * COSMIC AUDIO SYNTHESIZER ENGINE (Web Audio API)
 * Zero-Asset Architectural Synthesizer: 0 KB External Audio Files
 * Generates live mathematical waveforms, binaural drone, & celestial SFX.
 */

export class CosmicAudioEngine {
  private static instance: CosmicAudioEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Drone State & Audio Nodes
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private isDroneActiveState: boolean = false;
  private stopTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Configuration State
  private masterVol: number = 0.7;
  private droneVol: number = 0.35;
  private isMutedState: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedMuted = localStorage.getItem('aspirantx_cosmic_audio_muted');
        if (storedMuted !== null) {
          this.isMutedState = storedMuted === 'true';
        }
        const storedMasterVol = localStorage.getItem('aspirantx_cosmic_audio_master_vol');
        if (storedMasterVol !== null) {
          const parsed = parseFloat(storedMasterVol);
          if (!isNaN(parsed)) this.masterVol = Math.max(0, Math.min(1, parsed));
        }
        const storedDroneVol = localStorage.getItem('aspirantx_cosmic_audio_drone_vol');
        if (storedDroneVol !== null) {
          const parsed = parseFloat(storedDroneVol);
          if (!isNaN(parsed)) this.droneVol = Math.max(0, Math.min(1, parsed));
        }
      } catch {
        // Fallback gracefully if localStorage is restricted
      }

      // Handle Page Visibility for mobile battery efficiency
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        } else {
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
        }
      });

      // Browser Autoplay Policy: Resume on first user gesture
      const resumeOnGesture = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
      };
      window.addEventListener('pointerdown', resumeOnGesture, { once: true });
      window.addEventListener('keydown', resumeOnGesture, { once: true });
    }
  }

  public static getInstance(): CosmicAudioEngine {
    if (!CosmicAudioEngine.instance) {
      CosmicAudioEngine.instance = new CosmicAudioEngine();
    }
    return CosmicAudioEngine.instance;
  }

  /**
   * Initializes or returns the active AudioContext & Master Gain Node
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return null;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.isMutedState ? 0.0001 : this.masterVol,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Generates a 4-second looping Brownian Noise buffer for cosmic background radiation
   */
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const bufferLength = sampleRate * 4; // 4 seconds loop
    const buffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      // Leaky Brownian integration produces deep, cosmic rumble
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    return buffer;
  }

  // ══════════════════════════════════════════════════════════════════
  // 1. AMBIENT COSMIC DRONE (Binaural Theta Hum + Brown Noise)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Starts ambient cosmic drone with smooth 2.5s fade-in
   */
  public startDrone(): void {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    if (this.isDroneActiveState && this.droneGain) {
      // Already running, ensure target volume is maintained
      const now = ctx.currentTime;
      this.droneGain.gain.cancelScheduledValues(now);
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
      this.droneGain.gain.linearRampToValueAtTime(this.droneVol, now + 1.0);
      return;
    }

    try {
      const now = ctx.currentTime;

      // 1. Create Drone Master Gain Node
      this.droneGain = ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.0001, now);
      // Fade-in over 2.5 seconds
      this.droneGain.gain.linearRampToValueAtTime(this.droneVol, now + 2.5);
      this.droneGain.connect(this.masterGain);

      // 2. Dual Binaural Oscillators (55Hz and 58Hz -> 3Hz Theta focus pulse)
      this.droneOsc1 = ctx.createOscillator();
      this.droneOsc2 = ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc2.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, now); // A1 note
      this.droneOsc2.frequency.setValueAtTime(58, now); // 3Hz delta/theta beat

      // 3. Drone Filter (Lowpass 180Hz, Q: 2.0)
      this.droneFilter = ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(180, now);
      this.droneFilter.Q.setValueAtTime(2.0, now);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);

      // 4. Cosmic Background Brown Noise
      const noiseBuffer = this.createBrownNoiseBuffer(ctx);
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      this.noiseFilter = ctx.createBiquadFilter();
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.setValueAtTime(80, now); // Deep space sub-bass
      this.noiseFilter.Q.setValueAtTime(1.0, now);

      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.18, now);

      this.noiseSource.connect(this.noiseFilter);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.droneGain);

      // 5. Start audio nodes
      this.droneOsc1.start(now);
      this.droneOsc2.start(now);
      this.noiseSource.start(now);

      this.isDroneActiveState = true;
    } catch {
      // Handle blocked audio autoplay
    }
  }

  /**
   * Stops ambient cosmic drone with smooth 1.5s fade-out
   */
  public stopDrone(): void {
    if (!this.isDroneActiveState || !this.droneGain || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.droneGain.gain.cancelScheduledValues(now);
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
      // Smooth fade-out over 1.5s
      this.droneGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);

      this.stopTimeoutId = setTimeout(() => {
        try {
          this.droneOsc1?.stop();
          this.droneOsc2?.stop();
          this.noiseSource?.stop();

          this.droneOsc1?.disconnect();
          this.droneOsc2?.disconnect();
          this.noiseSource?.disconnect();
          this.droneFilter?.disconnect();
          this.noiseFilter?.disconnect();
          this.noiseGain?.disconnect();
          this.droneGain?.disconnect();
        } catch {
          // Ignore cleanup errors
        } finally {
          this.droneOsc1 = null;
          this.droneOsc2 = null;
          this.noiseSource = null;
          this.droneFilter = null;
          this.noiseFilter = null;
          this.noiseGain = null;
          this.droneGain = null;
          this.isDroneActiveState = false;
          this.stopTimeoutId = null;
        }
      }, 1550);
    } catch {
      this.isDroneActiveState = false;
    }
  }

  /**
   * Updates drone volume immediately or with gentle transition
   */
  public setDroneVolume(val: number): void {
    this.droneVol = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('aspirantx_cosmic_audio_drone_vol', this.droneVol.toString());
    } catch {}

    if (this.droneGain && this.ctx && this.isDroneActiveState) {
      const now = this.ctx.currentTime;
      this.droneGain.gain.cancelScheduledValues(now);
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
      this.droneGain.gain.linearRampToValueAtTime(this.droneVol, now + 0.3);
    }
  }

  public getDroneVolume(): number {
    return this.droneVol;
  }

  public isDroneRunning(): boolean {
    return this.isDroneActiveState;
  }

  // ══════════════════════════════════════════════════════════════════
  // 2. SOUND EFFECTS (SFX GENERATORS)
  // ══════════════════════════════════════════════════════════════════

  /**
   * playTap: Ultra-short sine wave blip at 480Hz fading to 240Hz in 40ms with exponential gain decay
   */
  public playTap(): void {
    if (this.isMutedState) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * playDustChime: Rapid arpeggio of 3 sine tones (523Hz, 659Hz, 783Hz - C Major chord)
   * staggered by 60ms with soft shimmer decay (400ms)
   */
  public playDustChime(): void {
    if (this.isMutedState) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99]; // C5, E5, G5

      chord.forEach((freq, idx) => {
        const noteTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.16, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(noteTime);
        osc.stop(noteTime + 0.42);
      });
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * playLevelUp: Resonant celestial burst - 4 harmonic oscillators
   * (220Hz, 440Hz, 880Hz, 1320Hz) fading over 1.8s with a resonant lowpass filter sweep
   */
  public playLevelUp(): void {
    if (this.isMutedState) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;

      // Resonant sweep filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(4500, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(500, now + 1.8);
      filter.Q.setValueAtTime(3.5, now);

      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.0001, now);
      burstGain.gain.exponentialRampToValueAtTime(0.24, now + 0.05);
      burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      filter.connect(burstGain);
      burstGain.connect(this.masterGain);

      // 4 Harmonics: 220Hz (A3), 440Hz (A4), 880Hz (A5), 1320Hz (E6)
      const harmonics = [
        { freq: 220, type: 'triangle' as OscillatorType, weight: 0.3 },
        { freq: 440, type: 'sine' as OscillatorType, weight: 0.35 },
        { freq: 880, type: 'sine' as OscillatorType, weight: 0.2 },
        { freq: 1320, type: 'triangle' as OscillatorType, weight: 0.15 }
      ];

      harmonics.forEach(({ freq, type, weight }) => {
        const osc = ctx.createOscillator();
        const harmGain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        harmGain.gain.setValueAtTime(weight, now);
        osc.connect(harmGain);
        harmGain.connect(filter);

        osc.start(now);
        osc.stop(now + 1.85);
      });
    } catch {
      // Ignore audio failure
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 3. MUTE & VOLUME CONTROLS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Toggles audio mute and persists setting
   */
  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    try {
      localStorage.setItem('aspirantx_cosmic_audio_muted', this.isMutedState.toString());
    } catch {}

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMutedState ? 0.0001 : this.masterVol,
        now + 0.1
      );
    }

    return this.isMutedState;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  /**
   * Sets master output volume (clamped 0 to 1)
   */
  public setMasterVolume(val: number): void {
    this.masterVol = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('aspirantx_cosmic_audio_master_vol', this.masterVol.toString());
    } catch {}

    if (!this.isMutedState && this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVol, now + 0.15);
    }
  }

  public getMasterVolume(): number {
    return this.masterVol;
  }

  /**
   * Suspends the audio context when app is unmounting or backgrounded
   */
  public suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  /**
   * Resumes the audio context
   */
  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
}

// Export singleton instance for convenience
export const cosmicAudio = CosmicAudioEngine.getInstance();
