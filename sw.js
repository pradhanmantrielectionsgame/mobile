// PME Mobile — minimal cache-first service worker for offline/installable
// play. Precaches the app shell; everything else (data/*.json, sounds/*,
// images) is cached opportunistically the first time it's fetched.
var CACHE = 'pme-mobile-v8';
// html2canvas.min.js is no longer a <script> tag in index.html — main.js injects
// it on the first Share tap. It stays precached deliberately: install runs in the
// background (off the boot critical path), and this keeps the share screenshot
// instant and working offline. Don't drop it as "unreferenced".
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

// Big immutable-ish media (portraits, sounds, icons): serve from cache when
// present, only hit the network on a miss. A content change ships under a new
// CACHE version, which wipes the old entries in activate().
var MEDIA_RE = /\.(png|jpg|jpeg|svg|webp|mp3|ogg|wav)$/i;

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  if (MEDIA_RE.test(new URL(e.request.url).pathname)) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        return cached || fetch(e.request).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  // Everything else (app shell, code, JSON) is network-first so a deploy
  // reaches the phone immediately. cache:'reload' bypasses the browser's HTTP
  // cache too — GitHub Pages' 10-minute max-age on index.html/*.js would
  // otherwise keep serving stale code for up to 10 min after a deploy.
  e.respondWith(
    fetch(e.request, { cache: 'reload' }).then(function (res) {
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
