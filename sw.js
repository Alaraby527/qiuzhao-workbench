/* Service Worker — 秋招工作台 PWA */
const CACHE_NAME = 'qiuzhao-workbench-v3';
const APP_SHELL = [
  './',
  './workbench-desktop.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

/* install: pre-cache app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

/* activate: clean old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* fetch: cache-first for app shell, network-first for everything else */
self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* Never cache Firebase / Google API calls */
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) {
    return;
  }

  /* Only handle GET */
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        /* Cache successful responses */
        if (resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        /* Offline fallback */
        if (e.request.mode === 'navigate') {
          return caches.match('./workbench-desktop.html');
        }
      });
    })
  );
});
