// PME Mobile — minimal cache-first service worker for offline/installable
// play. Precaches the app shell; everything else (data/*.json, sounds/*,
// images) is cached opportunistically the first time it's fetched.
var CACHE = 'pme-mobile-v16';
// Art and sounds live in their own cache, deliberately NOT keyed to the version
// above. activate() used to wipe every cache but the current one, so each code
// deploy also dumped ~7MB of portraits and mp3s and forced a full re-download —
// and any one of those re-fetches that failed on a flaky connection left that
// sound silently dead for the session. Bump this key by hand only when the
// media itself changes; a code-only deploy now leaves it alone.
var MEDIA_CACHE = 'pme-mobile-media-ed3d15038376';
// html2canvas.min.js is no longer a <script> tag in index.html — main.js injects
// it on the first Share tap. It stays precached deliberately: install runs in the
// background (off the boot critical path), and this keeps the share screenshot
// instant and working offline. Don't drop it as "unreferenced".
var CORE = [
  './index.html', './engine.js', './game.js', './ai.js', './main.js', './html2canvas.min.js', './manifest.json',
  './data/states_data.json', './data/policy-tags.json', './data/politicians-data.json', './data/game-config.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE && k !== MEDIA_CACHE;
      }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Big immutable-ish media (portraits, sounds, icons): serve from cache when
// present, only hit the network on a miss. Kept in MEDIA_CACHE so a code
// deploy doesn't evict it — see the note on that constant above.
var MEDIA_RE = /\.(png|jpg|jpeg|svg|webp|mp3|ogg|wav)$/i;

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  if (MEDIA_RE.test(new URL(e.request.url).pathname)) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        if (cached) return cached;
        return fetch(e.request).then(function (res) {
          // status 200, not res.ok: iOS Safari range-requests audio, and
          // cache.put() throws on the resulting 206.
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(MEDIA_CACHE).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        }).catch(function () {
          // Without this the rejection reaches respondWith() as a network
          // error and the <audio> element stays dead for the whole session.
          // One more cache look first — a parallel request may have filled it.
          return caches.match(e.request);
        });
      })
    );
    return;
  }

  // Everything else (app shell, code, JSON) is network-first so a deploy
  // reaches the phone immediately. cache:'reload' bypasses the browser's HTTP
  // cache too — GitHub Pages' 10-minute max-age on index.html/*.js would
  // otherwise keep serving stale code for up to 10 min after a deploy.
  //
  // The fetch is capped at 3.5s (AbortSignal.timeout): fully offline, fetch
  // rejects instantly and we fall to cache; on a flaky/captive connection it
  // used to hang the whole launch waiting on each request, so now it gives
  // up after 3.5s and serves the last cached copy instead. The next launch
  // on a good connection refreshes the cache as normal.
  var signal;
  try { signal = AbortSignal.timeout(3500); } catch (err) { /* older engine: no per-fetch timeout, keep prior behaviour */ }
  e.respondWith(
    fetch(e.request, { cache: 'reload', signal: signal }).then(function (res) {
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
