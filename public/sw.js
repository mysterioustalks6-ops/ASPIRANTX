const CACHE_VERSION = 'v3.2.1';
const CACHE_NAME = `studyride-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `studyride-api-${CACHE_VERSION}`;

// Only cache essential offline fallbacks, NEVER cache-lock index.html
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log('[StudyRide SW] Deleting stale cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Force update & cache purge handlers
self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data === 'SKIP_WAITING' || event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    if (event.data === 'PURGE_CACHE' || event.data.type === 'PURGE_CACHE') {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        self.skipWaiting();
      });
    }
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. Never intercept chrome-extension or non-http requests
  if (!url.protocol.startsWith('http')) return;

  // 2. Navigation / HTML pages (index.html, root): ALWAYS Network-First
  // This guarantees users immediately receive new deployments without getting stuck on old versions
  const isHtmlNavigation = event.request.mode === 'navigate' || 
                           event.request.destination === 'document' ||
                           url.pathname === '/' || 
                           url.pathname.endsWith('.html');

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 3. API endpoints: Network-first with short-lived cache fallback for offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Static assets (hashed JS, CSS, fonts, images): Cache-first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
