import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwaRegister.ts';
import { initTactileTouchListener } from './lib/haptics.ts';

// ── Native App Network Interceptor ───────────────────────────────────────────
// In standalone native APK build, window.location.origin is http://localhost (Capacitor WebView).
// Intercept all relative `/api/*` fetch calls and route them directly to the live backend server.
const BACKEND_API_ROOT = 'https://aspirantx.app';

if (Capacitor.isNativePlatform() || window.location.hostname === 'localhost') {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string') {
      if (input.startsWith('/api/')) {
        return originalFetch(`${BACKEND_API_ROOT}${input}`, init);
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api/')) {
        return originalFetch(`${BACKEND_API_ROOT}${input.pathname}${input.search}`, init);
      }
    } else if (input instanceof Request) {
      if (input.url.startsWith('/') || input.url.includes('localhost/api/')) {
        const fullUrl = input.url.startsWith('/') 
          ? `${BACKEND_API_ROOT}${input.url}` 
          : input.url.replace(/https?:\/\/localhost/, BACKEND_API_ROOT);
        const newReq = new Request(fullUrl, input);
        return originalFetch(newReq, init);
      }
    }
    return originalFetch(input, init);
  };
}

// Initialize global haptic vibration & tactile touch feedback for mobile & desktop
initTactileTouchListener();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
