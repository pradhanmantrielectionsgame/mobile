// Self-check for mobile/sw.js's caching rules. Runs sw.js inside a fake
// ServiceWorkerGlobalScope so the two failure modes that silently killed
// sounds after a deploy stay fixed:
//
//   1. activate() must not evict MEDIA_CACHE when the shell version bumps
//      (that eviction is what forced ~7MB of re-downloads on every deploy).
//   2. a media fetch that rejects must still resolve respondWith() — an
//      unhandled rejection there reaches the page as a network error and the
//      <audio> element stays dead for the rest of the session.
//
// ponytail: hand-rolled fakes, no service-worker test harness. Run: node mobile/sw-check.js

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function loadSW({ fetchImpl, cacheContents = {} }) {
  const stores = {};
  for (const [name, entries] of Object.entries(cacheContents)) stores[name] = new Map(Object.entries(entries));

  const openCache = name => {
    if (!stores[name]) stores[name] = new Map();
    const m = stores[name];
    return Promise.resolve({
      addAll: urls => { urls.forEach(u => m.set(u, { body: u })); return Promise.resolve(); },
      put: (req, res) => { m.set(String(req.url || req), res); return Promise.resolve(); },
      match: req => Promise.resolve(m.get(String(req.url || req))),
    });
  };

  const handlers = {};
  const self = {
    addEventListener: (t, fn) => { handlers[t] = fn; },
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };
  const caches = {
    open: openCache,
    keys: () => Promise.resolve(Object.keys(stores)),
    delete: k => { delete stores[k]; return Promise.resolve(true); },
    match: req => {
      const url = String(req.url || req);
      for (const m of Object.values(stores)) if (m.has(url)) return Promise.resolve(m.get(url));
      return Promise.resolve(undefined);
    },
  };

  const src = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
  new Function('self', 'caches', 'fetch', 'URL', 'AbortSignal', src)(self, caches, fetchImpl, URL, AbortSignal);
  return { handlers, stores };
}

const MP3 = 'https://example.test/sounds/fanfare.mp3';

// Read the keys out of sw.js rather than hardcoding them: scripts/deploy-mobile.js
// rewrites the media key to a content hash of assets/ + sounds/ on the way out,
// so a literal here would only ever describe the source copy.
const SW_SRC = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
const constOf = name => {
  const m = SW_SRC.match(new RegExp('var ' + name + " = '([^']+)'"));
  assert.ok(m, name + ' not found in sw.js');
  return m[1];
};
const MEDIA = constOf('MEDIA_CACHE');

async function run() {
  // --- 1. a version bump must not evict the media cache ---
  {
    const { handlers, stores } = loadSW({
      fetchImpl: () => Promise.reject(new Error('offline')),
      cacheContents: {
        'pme-mobile-v0-stale': { './index.html': { body: 'old shell' } },  // superseded shell
        [MEDIA]: { [MP3]: { body: 'cached audio' } },                     // art + sounds
      },
    });
    const waits = [];
    handlers.activate({ waitUntil: p => waits.push(p) });
    await Promise.all(waits);

    const names = Object.keys(stores);
    assert.ok(!names.includes('pme-mobile-v0-stale'), 'superseded shell cache should be evicted');
    assert.ok(names.includes(MEDIA),
      'MEDIA_CACHE must survive a shell version bump — otherwise every deploy re-downloads all art and sounds');
  }

  // --- 2. a failed media fetch must not reject respondWith() ---
  {
    const { handlers } = loadSW({ fetchImpl: () => Promise.reject(new Error('flaky network')) });
    let responded;
    handlers.fetch({ request: { method: 'GET', url: MP3, mode: 'no-cors' }, respondWith: p => { responded = p; } });
    await assert.doesNotReject(() => responded,
      'a rejected media fetch must be caught — an unhandled rejection kills that <audio> for the session');
  }

  // --- 3. a 206 range response must not be written to the cache ---
  {
    const { handlers, stores } = loadSW({
      fetchImpl: () => Promise.resolve({ status: 206, ok: true, clone: () => ({ body: 'partial' }) }),
    });
    let responded;
    handlers.fetch({ request: { method: 'GET', url: MP3, mode: 'no-cors' }, respondWith: p => { responded = p; } });
    await responded;
    await new Promise(r => setImmediate(r));
    const media = stores[MEDIA];
    assert.ok(!media || !media.has(MP3),
      'cache.put() throws on a 206 — iOS Safari range-requests audio, so guard on status 200');
  }

  // --- 4. a good media response is cached, and served from cache next time ---
  {
    let hits = 0;
    const { handlers } = loadSW({
      fetchImpl: () => { hits++; return Promise.resolve({ status: 200, ok: true, clone: () => ({ body: 'audio' }) }); },
    });
    for (let i = 0; i < 2; i++) {
      let responded;
      handlers.fetch({ request: { method: 'GET', url: MP3, mode: 'no-cors' }, respondWith: p => { responded = p; } });
      await responded;
      await new Promise(r => setImmediate(r));
    }
    assert.strictEqual(hits, 1, 'second request for the same media should be served from cache, not refetched');
  }

  console.log('mobile/sw-check.js: all assertions passed.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
