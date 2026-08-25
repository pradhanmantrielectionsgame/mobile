// PME Mobile — minimal cache-first service worker for offline/installable
// play. Precaches the app shell; everything else (data/*.json, sounds/*,
// images) is cached opportunistically the first time it's fetched.
var CACHE = 'pme-mobile-v4';
var CORE = [
  './index.html', './engine.js', './game.js', './main.js', './html2canvas.min.js', './manifest.json',
  './data/states_data.json', './data/policy-tags.json', './data/politicians-data.json', './data/game-config.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // Network-first: always prefer a live response so code/data changes reach
  // the phone immediately. Cache is purely the offline fallback.
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        // Bookmarked/typed URLs (bare origin, trailing slash, etc.) are a
        // different Request URL than the precached './index.html' entry —
        // fall back to the app shell for any offline navigation so those
        // still load instead of failing outright.
        if (cached) return cached;
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
