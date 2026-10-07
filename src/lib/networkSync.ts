import { Network, ConnectionStatus } from '@capacitor/network';
import { App as CapApp } from '@capacitor/app';

/**
 * Universal Native & Web Offline Synchronizer (Single Source of Truth)
 * 
 * Rules:
 * 1. Global "offline" comes ONLY from @capacitor/network getStatus().connected
 *    (window online/offline events as web fallback).
 * 2. A failed fetch must NOT set the global offline flag; per-request error only.
 * 3. Debounce: show offline banner only after 2 consecutive failures within 10s
 *    AND getStatus().connected === false.
 * 4. Recovery: clear the flag automatically when connectivity returns (listener,
 *    plus getStatus() every 15s while flagged) and on app resume.
 */

let isInitialized = false;
let isFlaggedOffline = false;
let failureTimestamps: number[] = [];
let recoveryIntervalId: any = null;

const listeners: Set<(isOnline: boolean) => void> = new Set();

function applyOnlineState(connected: boolean) {
  isFlaggedOffline = !connected;
  try {
    Object.defineProperty(navigator, 'onLine', {
      value: connected,
      configurable: true,
      writable: true
    });
  } catch (e) {
    // Non-fatal if browser blocks property redefine
  }
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(connected ? 'online' : 'offline'));
  }

  listeners.forEach(fn => {
    try { fn(connected); } catch {}
  });

  // Manage recovery interval: check every 15s while flagged offline
  if (!connected) {
    if (!recoveryIntervalId) {
      recoveryIntervalId = setInterval(async () => {
        try {
          const status = await Network.getStatus();
          if (status.connected) {
            handleConnectivityChange(true);
          }
        } catch {}
      }, 15000);
    }
  } else {
    if (recoveryIntervalId) {
      clearInterval(recoveryIntervalId);
      recoveryIntervalId = null;
    }
  }
}

/**
 * Handle incoming connectivity updates from native listener or active check.
 */
export async function handleConnectivityChange(connected: boolean): Promise<void> {
  const now = Date.now();

  if (connected) {
    // Immediate recovery: clear failure queue and clear offline flag immediately
    failureTimestamps = [];
    applyOnlineState(true);
    return;
  }

  // Double-check with native plugin to avoid false disconnect events
  try {
    const status = await Network.getStatus();
    if (status.connected) {
      failureTimestamps = [];
      applyOnlineState(true);
      return;
    }
  } catch {}

  // Disconnect detected: apply 10s debounce rule
  // Keep only failure timestamps within the last 10 seconds
  failureTimestamps = failureTimestamps.filter(t => now - t <= 10000);
  failureTimestamps.push(now);

  // Show the offline banner only after 2 consecutive failures within 10s AND getStatus().connected === false
  if (failureTimestamps.length >= 2) {
    applyOnlineState(false);
  } else {
    // Wait for second confirmation within 10s window (scheduled check after 3s)
    setTimeout(async () => {
      try {
        const checkStatus = await Network.getStatus();
        if (!checkStatus.connected) {
          const checkNow = Date.now();
          failureTimestamps = failureTimestamps.filter(t => checkNow - t <= 10000);
          if (failureTimestamps.length >= 1) {
            applyOnlineState(false);
          }
        }
      } catch {}
    }, 3000);
  }
}

export async function initNetworkMonitoring(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // 1. Initial status query via Capacitor Native plugin
    const status = await Network.getStatus();
    if (status.connected) {
      applyOnlineState(true);
    } else {
      failureTimestamps = [Date.now()];
      // Verify once before flagging
      setTimeout(async () => {
        const s = await Network.getStatus();
        if (!s.connected) applyOnlineState(false);
      }, 2000);
    }

    // 2. Native listener for real-time airplane mode / wifi changes
    Network.addListener('networkStatusChange', (s: ConnectionStatus) => {
      handleConnectivityChange(s.connected);
    });
  } catch (err) {
    // Web fallback if Capacitor native bridge is unavailable
    if (typeof navigator !== 'undefined') {
      applyOnlineState(navigator.onLine);
    }
  }

  // 3. Web browser standard listeners as fallback
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => handleConnectivityChange(true));
    window.addEventListener('offline', () => handleConnectivityChange(false));

    // 4. Recovery on app resume / window focus / tab visibility
    const handleResume = async () => {
      try {
        const status = await Network.getStatus();
        if (status.connected) {
          handleConnectivityChange(true);
        }
      } catch {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          handleConnectivityChange(true);
        }
      }
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    });

    try {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleResume();
        }
      });
    } catch {}
  }
}

/**
 * Neutralized: Per-request fetch failures must NEVER set the global offline flag.
 * Global offline state comes ONLY from native Network.getStatus().connected.
 */
export function reportFetchFailure(_url?: string, _error?: any): void {
  // Intentionally NO-OP. Failed API requests do NOT trigger global offline banner.
}

export function isDeviceOnline(): boolean {
  return !isFlaggedOffline && (typeof navigator === 'undefined' || navigator.onLine !== false);
}

export function subscribeNetworkChanges(fn: (isOnline: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
