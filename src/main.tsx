import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwaRegister.ts';
import { initTactileTouchListener } from './lib/haptics.ts';

// ── Native App Network Interceptor ───────────────────────────────────────────
// In standalone native APK build, WebView origin is https://localhost.
// Intercept ONLY relative `/api/*` fetch calls and route them directly to the live backend server.
// Never intercept local files, assets (JS/CSS/images/fonts), UI routing, or root document.
const BACKEND_API_ROOT = 'https://aspirantx.app';

if (Capacitor.isNativePlatform()) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string') {
      if (input.startsWith('/api/')) {
        return originalFetch(`${BACKEND_API_ROOT}${input}`, init);
      }
      if (/^https?:\/\/localhost(:\d+)?\/api\//.test(input)) {
        const targetUrl = input.replace(/^https?:\/\/localhost(:\d+)?\/api\//, `${BACKEND_API_ROOT}/api/`);
        return originalFetch(targetUrl, init);
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api/')) {
        const targetUrl = `${BACKEND_API_ROOT}${input.pathname}${input.search}`;
        return originalFetch(targetUrl, init);
      }
    } else if (input instanceof Request) {
      try {
        const parsedUrl = new URL(input.url, window.location.href);
        if (parsedUrl.pathname.startsWith('/api/')) {
          const targetUrl = `${BACKEND_API_ROOT}${parsedUrl.pathname}${parsedUrl.search}`;
          const newReq = new Request(targetUrl, input);
          return originalFetch(newReq, init);
        }
      } catch {
        if (input.url.startsWith('/api/')) {
          const newReq = new Request(`${BACKEND_API_ROOT}${input.url}`, input);
          return originalFetch(newReq, init);
        }
      }
    }
    return originalFetch(input, init);
  };

  // Hardware Android back button handler for native app navigation
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });
}

// Initialize global haptic vibration & tactile touch feedback for mobile & desktop
initTactileTouchListener();

// Service Worker is for PWA Web only; native Android app loads local bundled assets
if (!Capacitor.isNativePlatform()) {
  registerServiceWorker();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

