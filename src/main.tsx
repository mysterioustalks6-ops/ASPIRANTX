import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwaRegister.ts';
import { initTactileTouchListener } from './lib/haptics.ts';

import { API_BASE_URL } from './lib/apiConfig';

// ── Native App Network Interceptor ───────────────────────────────────────────
// In standalone native APK build, WebView origin is https://localhost.
// Intercept relative `/api/*` and localhost `/api/*` fetch calls and route them directly to the configured production backend origin.
// Never intercept local files, assets (JS/CSS/images/fonts), UI routing, or root document.
const BACKEND_API_ROOT = API_BASE_URL || 'https://studyride.in';

if (Capacitor.isNativePlatform() && BACKEND_API_ROOT) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aspirantx_auth_token') : null;

    const prepareInit = (urlStr: string, baseInit?: RequestInit): RequestInit | undefined => {
      if (!urlStr.includes('/api/')) return baseInit;
      const nextInit: RequestInit = { ...(baseInit || {}), credentials: baseInit?.credentials || 'include' };
      const headers = new Headers(nextInit.headers || {});
      if (token && !headers.has('Authorization') && !headers.has('authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      nextInit.headers = headers;
      return nextInit;
    };

    if (typeof input === 'string') {
      if (input.startsWith('/api/')) {
        const targetUrl = `${BACKEND_API_ROOT}${input}`;
        return originalFetch(targetUrl, prepareInit(targetUrl, init));
      }
      if (/^https?:\/\/localhost(:\d+)?\/api\//.test(input)) {
        const targetUrl = input.replace(/^https?:\/\/localhost(:\d+)?\/api\//, `${BACKEND_API_ROOT}/api/`);
        return originalFetch(targetUrl, prepareInit(targetUrl, init));
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api/')) {
        const targetUrl = `${BACKEND_API_ROOT}${input.pathname}${input.search}`;
        return originalFetch(targetUrl, prepareInit(targetUrl, init));
      }
    } else if (input instanceof Request) {
      try {
        const parsedUrl = new URL(input.url, window.location.href);
        if (parsedUrl.pathname.startsWith('/api/')) {
          const targetUrl = `${BACKEND_API_ROOT}${parsedUrl.pathname}${parsedUrl.search}`;
          const newHeaders = new Headers(input.headers);
          if (token && !newHeaders.has('Authorization') && !newHeaders.has('authorization')) {
            newHeaders.set('Authorization', `Bearer ${token}`);
          }
          const newReq = new Request(targetUrl, {
            ...input,
            headers: newHeaders,
            credentials: input.credentials || 'include'
          });
          return originalFetch(newReq, init);
        }
      } catch {
        if (input.url.startsWith('/api/')) {
          const targetUrl = `${BACKEND_API_ROOT}${input.url}`;
          const newReq = new Request(targetUrl, input);
          return originalFetch(newReq, prepareInit(targetUrl, init));
        }
      }
    }
    return originalFetch(input, init);
  };

  // Hardware Android back button handler with contextual modal/sheet dismissal
  CapApp.addListener('backButton', ({ canGoBack }) => {
    const handled = window.dispatchEvent(new CustomEvent('studyride_back_pressed', { cancelable: true }));
    if (!handled) {
      return; // Handled by active sheet or modal
    }
    const openModals = document.querySelectorAll('[role="dialog"], [data-modal-open="true"], .fixed.inset-0.z-50, .fixed.inset-0.z-\\[100\\]');
    if (openModals.length > 0) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      return;
    }
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

