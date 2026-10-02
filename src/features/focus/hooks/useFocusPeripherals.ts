/**
 * FOCUS PERIPHERALS HOOK (Web Audio API, Screen WakeLock, & Mobile Haptics)
 * Zero external npm dependencies.
 * Coordinates tactile sensory feedback, keep-awake, and cosmic soundscapes.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CosmicAudioEngine, cosmicAudio } from '../services/cosmicAudio';

export type HapticType = 'light' | 'medium' | 'success' | 'warning';

export interface UseFocusPeripheralsOptions {
  isFocusActive?: boolean;
  autoDroneOnFocus?: boolean;
}

export interface UseFocusPeripheralsReturn {
  // Audio state & controls
  isMuted: boolean;
  toggleMute: () => boolean;
  masterVolume: number;
  setMasterVolume: (val: number) => void;
  droneVolume: number;
  setDroneVolume: (val: number) => void;
  isDroneActive: boolean;
  startDrone: () => void;
  stopDrone: () => void;
  playTap: () => void;
  playDustChime: () => void;
  playLevelUp: () => void;
  audioEngine: CosmicAudioEngine;

  // Screen WakeLock State
  isWakeLockActive: boolean;

  // Tactile Haptics
  triggerHaptic: (type?: HapticType) => void;

  // Unified Compound Handlers
  onSessionStart: () => void;
  onSessionPause: () => void;
  onSessionResume: () => void;
  onSessionComplete: (isLevelUp?: boolean) => void;
  onButtonTap: () => void;
}

// Definition for WakeLock API compatibility
interface WakeLockSentinelLike extends EventTarget {
  released: boolean;
  type: string;
  release: () => Promise<void>;
  onrelease: ((this: WakeLockSentinelLike, ev: Event) => void) | null;
}

export function useFocusPeripherals({
  isFocusActive = false,
  autoDroneOnFocus = true
}: UseFocusPeripheralsOptions = {}): UseFocusPeripheralsReturn {
  const [isMuted, setIsMuted] = useState<boolean>(() => cosmicAudio.isMuted());
  const [masterVolume, setMasterVolumeState] = useState<number>(() => cosmicAudio.getMasterVolume());
  const [droneVolume, setDroneVolumeState] = useState<number>(() => cosmicAudio.getDroneVolume());
  const [isDroneActive, setIsDroneActive] = useState<boolean>(() => cosmicAudio.isDroneRunning());
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);

  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const isFocusActiveRef = useRef<boolean>(isFocusActive);
  isFocusActiveRef.current = isFocusActive;

  // ══════════════════════════════════════════════════════════════════
  // 1. MOBILE HAPTICS (navigator.vibrate)
  // ══════════════════════════════════════════════════════════════════
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (typeof window === 'undefined' || !('navigator' in window)) return;
    if (typeof navigator.vibrate !== 'function') return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'success':
          // Rhythmic celebration pulse
          navigator.vibrate([30, 60, 40, 60, 80]);
          break;
        case 'warning':
          navigator.vibrate([40, 40, 40]);
          break;
        default:
          navigator.vibrate(15);
      }
    } catch {
      // Haptics not allowed or unsupported
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // 2. SCREEN WAKE LOCK (Keeps screen awake during active sprint)
  // ══════════════════════════════════════════════════════════════════
  const acquireWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!('wakeLock' in navigator)) return;

    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        setIsWakeLockActive(true);
        return;
      }

      const navigatorWithWakeLock = navigator as unknown as {
        wakeLock: {
          request: (type: 'screen') => Promise<WakeLockSentinelLike>;
        };
      };

      const sentinel = await navigatorWithWakeLock.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsWakeLockActive(true);

      sentinel.addEventListener('release', () => {
        setIsWakeLockActive(false);
        wakeLockRef.current = null;
      });
    } catch {
      setIsWakeLockActive(false);
      wakeLockRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
    setIsWakeLockActive(false);
  }, []);

  // Re-acquire WakeLock on visibility return if focus session is still active
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFocusActiveRef.current) {
        acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [acquireWakeLock]);

  // Sync wake lock & drone with isFocusActive prop
  useEffect(() => {
    if (isFocusActive) {
      acquireWakeLock();
      if (autoDroneOnFocus) {
        cosmicAudio.startDrone();
        setIsDroneActive(true);
      }
    } else {
      releaseWakeLock();
      if (autoDroneOnFocus) {
        cosmicAudio.stopDrone();
        setIsDroneActive(false);
      }
    }
  }, [isFocusActive, autoDroneOnFocus, acquireWakeLock, releaseWakeLock]);

  // ══════════════════════════════════════════════════════════════════
  // 3. AUDIO CONTROLS
  // ══════════════════════════════════════════════════════════════════
  const toggleMute = useCallback(() => {
    const nextMuted = cosmicAudio.toggleMute();
    setIsMuted(nextMuted);
    triggerHaptic('light');
    return nextMuted;
  }, [triggerHaptic]);

  const setMasterVolume = useCallback((val: number) => {
    cosmicAudio.setMasterVolume(val);
    setMasterVolumeState(cosmicAudio.getMasterVolume());
  }, []);

  const setDroneVolume = useCallback((val: number) => {
    cosmicAudio.setDroneVolume(val);
    setDroneVolumeState(cosmicAudio.getDroneVolume());
  }, []);

  const startDrone = useCallback(() => {
    cosmicAudio.startDrone();
    setIsDroneActive(true);
  }, []);

  const stopDrone = useCallback(() => {
    cosmicAudio.stopDrone();
    setIsDroneActive(false);
  }, []);

  const playTap = useCallback(() => {
    cosmicAudio.playTap();
  }, []);

  const playDustChime = useCallback(() => {
    cosmicAudio.playDustChime();
  }, []);

  const playLevelUp = useCallback(() => {
    cosmicAudio.playLevelUp();
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // 4. COMPOUND HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const onSessionStart = useCallback(() => {
    triggerHaptic('light');
    cosmicAudio.playTap();
    cosmicAudio.startDrone();
    setIsDroneActive(true);
    acquireWakeLock();
  }, [triggerHaptic, acquireWakeLock]);

  const onSessionPause = useCallback(() => {
    triggerHaptic('medium');
    cosmicAudio.playTap();
    cosmicAudio.stopDrone();
    setIsDroneActive(false);
    releaseWakeLock();
  }, [triggerHaptic, releaseWakeLock]);

  const onSessionResume = useCallback(() => {
    triggerHaptic('light');
    cosmicAudio.playTap();
    cosmicAudio.startDrone();
    setIsDroneActive(true);
    acquireWakeLock();
  }, [triggerHaptic, acquireWakeLock]);

  const onSessionComplete = useCallback((isLevelUp: boolean = false) => {
    // Stop ambient drone smoothly
    cosmicAudio.stopDrone();
    setIsDroneActive(false);

    // Release Screen Lock
    releaseWakeLock();

    // Trigger celebration SFX & Haptics
    triggerHaptic('success');
    if (isLevelUp) {
      cosmicAudio.playLevelUp();
    } else {
      cosmicAudio.playDustChime();
    }
  }, [triggerHaptic, releaseWakeLock]);

  const onButtonTap = useCallback(() => {
    triggerHaptic('light');
    cosmicAudio.playTap();
  }, [triggerHaptic]);

  // ══════════════════════════════════════════════════════════════════
  // 5. LIFECYCLE CLEANUP
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      // Immediate clean stop on unmount
      cosmicAudio.stopDrone();
      releaseWakeLock();
      cosmicAudio.suspend();
    };
  }, [releaseWakeLock]);

  return {
    isMuted,
    toggleMute,
    masterVolume,
    setMasterVolume,
    droneVolume,
    setDroneVolume,
    isDroneActive,
    startDrone,
    stopDrone,
    playTap,
    playDustChime,
    playLevelUp,
    audioEngine: cosmicAudio,
    isWakeLockActive,
    triggerHaptic,
    onSessionStart,
    onSessionPause,
    onSessionResume,
    onSessionComplete,
    onButtonTap
  };
}
