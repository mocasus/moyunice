/* MoyUNNES Service Worker — minimal offline cache.
   Strategi: stale-while-revalidate untuk asset statis. */
const CACHE = 'moyunnes-v3';
const ASSETS = [
  './',
  './index.html',
  './styles/style.css',
  './scripts/storage.js',
  './scripts/notifications.js',
  './scripts/dragdrop.js',
  './scripts/pomodoro.js',
  './scripts/app.js',
  './assets/favicon.svg',
  './assets/unnes-logo.jpg',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Hanya cache same-origin
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
