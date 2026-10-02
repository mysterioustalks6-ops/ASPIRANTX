/**
 * ADAPTIVE DEVICE OPTIMIZATION & BATTERY SAVER HOOK
 * Automatically throttles WebGL rendering, particle counts, and rotation
 * when the device battery is low (< 20% and discharging) or manually enabled.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

interface BatteryManagerLike extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManagerLike, ev: Event) => void) | null;
  onlevelchange: ((this: BatteryManagerLike, ev: Event) => void) | null;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>;
}

export interface DeviceOptimizationState {
  isBatterySaverMode: boolean;      // True if active (manual or automatic)
  isManualBatterySaver: boolean;    // User's manual override state
  isBatteryLow: boolean;            // Level < 0.20 and not charging
  isCharging: boolean;              // Device is plugged into power
  batteryLevel: number;             // 0.0 to 1.0
  targetFps: number;                // 30 (saver) or 60 (standard)
  starParticleCount: number;        // 250 (saver) or 800 (standard)
  allowIdleRotation: boolean;       // False in battery saver to rest GPU
  devicePixelRatio: number;         // Clamped DPR (1.0 in saver, up to 1.5 standard)
  toggleBatterySaver: () => void;
  setBatterySaverMode: (enabled: boolean) => void;
}

export function useDeviceOptimization(): DeviceOptimizationState {
  // 1. Manual user override from localStorage
  const [manualOverride, setManualOverride] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('aspirantx_battery_saver_mode');
      if (stored !== null) return stored === 'true';
    } catch {}
    return null;
  });

  // 2. Hardware Battery State
  const [batteryLevel, setBatteryLevel] = useState<number>(1.0);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [isBatterySupported, setIsBatterySupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery !== 'function') return;

    let batteryInstance: BatteryManagerLike | null = null;

    const updateBatteryStatus = (battery: BatteryManagerLike) => {
      setBatteryLevel(battery.level);
      setIsCharging(battery.charging);
      setIsBatterySupported(true);
    };

    nav.getBattery()
      .then((battery) => {
        batteryInstance = battery;
        updateBatteryStatus(battery);

        const onLevelChange = () => updateBatteryStatus(battery);
        const onChargingChange = () => updateBatteryStatus(battery);

        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);

        return () => {
          battery.removeEventListener('levelchange', onLevelChange);
          battery.removeEventListener('chargingchange', onChargingChange);
        };
      })
      .catch(() => {
        // Battery API permission denied or unsupported
      });
  }, []);

  // 3. Automatic detection: Battery < 20% and not charging
  const isBatteryLow = useMemo(() => {
    return isBatterySupported && !isCharging && batteryLevel < 0.20;
  }, [isBatterySupported, isCharging, batteryLevel]);

  // 4. Effective Battery Saver State
  const isBatterySaverMode = useMemo(() => {
    if (manualOverride !== null) return manualOverride;
    return isBatteryLow;
  }, [manualOverride, isBatteryLow]);

  // 5. Actions
  const toggleBatterySaver = useCallback(() => {
    setManualOverride((prev) => {
      const next = prev === null ? !isBatteryLow : !prev;
      try {
        localStorage.setItem('aspirantx_battery_saver_mode', String(next));
      } catch {}
      return next;
    });
  }, [isBatteryLow]);

  const setBatterySaverMode = useCallback((enabled: boolean) => {
    setManualOverride(enabled);
    try {
      localStorage.setItem('aspirantx_battery_saver_mode', String(enabled));
    } catch {}
  }, []);

  // 6. Tuned WebGL Performance Constraints
  const targetFps = isBatterySaverMode ? 30 : 60;
  const starParticleCount = isBatterySaverMode ? 250 : 800;
  const allowIdleRotation = !isBatterySaverMode;
  const devicePixelRatio = isBatterySaverMode ? 1.0 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);

  return {
    isBatterySaverMode,
    isManualBatterySaver: manualOverride ?? false,
    isBatteryLow,
    isCharging,
    batteryLevel,
    targetFps,
    starParticleCount,
    allowIdleRotation,
    devicePixelRatio,
    toggleBatterySaver,
    setBatterySaverMode
  };
}
