import { Network } from '@capacitor/network';

/**
 * Universal Native & Web Offline Synchronizer
 * Bridges Android native network state to window.navigator.onLine
 * and dispatches 'online' / 'offline' window events.
 */

let isInitialized = false;

function applyOnlineState(connected: boolean) {
  try {
    Object.defineProperty(navigator, 'onLine', {
      value: connected,
      configurable: true,
      writable: true
    });
  } catch (e) {
    // Non-fatal if browser blocks property redefine
  }
  window.dispatchEvent(new Event(connected ? 'online' : 'offline'));
}

export async function initNetworkMonitoring(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // 1. Initial status query via Capacitor Native plugin
    const status = await Network.getStatus();
    applyOnlineState(status.connected);

    // 2. Native listener for real-time airplane mode / wifi changes
    Network.addListener('networkStatusChange', (s) => {
      applyOnlineState(s.connected);
    });
  } catch (err) {
    // Fallback in environments where Capacitor native bridge is unavailable
  }

  // 3. Global active fetch failure observer: if an external fetch fails with TypeError, flag offline
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => applyOnlineState(true));
    window.addEventListener('offline', () => applyOnlineState(false));
  }
}

export function reportFetchFailure(): void {
  applyOnlineState(false);
}
