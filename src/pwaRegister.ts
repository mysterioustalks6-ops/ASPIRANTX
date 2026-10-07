import { Capacitor } from '@capacitor/core';
import { CANONICAL_APP_RELEASE } from './config/appRelease';

export function registerServiceWorker() {
  // 1. On Native Mobile (Android/iOS WebView):
  // Never run a Service Worker in native apps because Capacitor has its own native asset pipeline.
  // Unregister any legacy service workers that might have gotten registered previously.
  if (Capacitor.isNativePlatform()) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().then(() => {
            console.log('[StudyRide Native] Unregistered legacy service worker on native device');
          });
        }
      }).catch(() => {});
    }
    // Clean any old webview caches
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) caches.delete(key);
      }).catch(() => {});
    }
    return;
  }

  // 2. On Web / PWA
  if ('serviceWorker' in navigator) {
    // Purge caches if local stored version is older than canonical version
    const lastInstalledVer = localStorage.getItem('studyride_sw_version');
    if (lastInstalledVer && lastInstalledVer !== CANONICAL_APP_RELEASE.version) {
      if ('caches' in window) {
        caches.keys().then((keys) => {
          return Promise.all(keys.map((k) => caches.delete(k)));
        }).catch(() => {});
      }
    }
    localStorage.setItem('studyride_sw_version', CANONICAL_APP_RELEASE.version);

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[StudyRide PWA] Service Worker registered scope:', reg.scope);

          // Check for worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[StudyRide PWA] New update available, broadcasting event');
                  window.dispatchEvent(new CustomEvent('studyride:check-update'));
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[StudyRide PWA] Service Worker registration failed:', err);
        });
    });
  }
}

import { isOnline } from './lib/networkSync';

export function setupOnlineListener(onStatusChange?: (online: boolean) => void) {
  const updateStatus = () => {
    const current = isOnline();
    if (onStatusChange) onStatusChange(current);
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  return () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  };
}
