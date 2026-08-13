export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[AspirantX PWA] Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.error('[AspirantX PWA] Service Worker registration failed:', err);
        });
    });
  }
}

export function setupOnlineListener(onStatusChange?: (isOnline: boolean) => void) {
  const updateStatus = () => {
    const isOnline = navigator.onLine;
    if (onStatusChange) onStatusChange(isOnline);
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  return () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  };
}
