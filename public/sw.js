/* Skochko service worker.
 * - Navigations: network-first, fall back to cached app shell (so deploys show up on next load, offline still opens).
 * - Hashed bundles (/_next/static/*) and fonts: cache-first (immutable).
 * - Map style + tiles (OpenFreeMap): stale-while-revalidate, capped, so the last viewed area works offline.
 * - Supabase API: never cached (always live data, auth stays correct).
 */
const VERSION = 'light-v2';
const SHELL = `skochko-shell-${VERSION}`;
const STATIC = `skochko-static-${VERSION}`;
const TILES = `skochko-tiles-${VERSION}`;
const TILE_LIMIT = 600;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.webmanifest', '/map/skochko-light.json'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('skochko-') && !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('supabase.co')) return; // live data only

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin && !url.search) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match('/')) ?? Response.error()),
    );
    return;
  }

  if (url.origin === location.origin && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/assets/'))) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  if (url.hostname === 'tiles.openfreemap.org' || url.pathname.startsWith('/map/')) {
    event.respondWith(
      caches.open(TILES).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) { cache.put(req, res.clone()); trim(TILES, TILE_LIMIT); }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      }),
    );
  }
});
