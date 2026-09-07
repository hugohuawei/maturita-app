/* Offline shell.

   Stratégia je network-first: keď je sieť, appka je vždy najnovšia; keď
   nie je (alebo je pomalá), do 3 sekúnd naskočí verzia z cache. Cache-first
   by znamenala, že nová verzia sa k telefónu nedostane, kým sa cache sama
   neprepíše — presne to sa raz stalo.

   Pri zmene súborov zvýš V aj BUILD v js/app.js. */
const V = 'maturita-v7';
const NET_TIMEOUT = 3000;
const ASSETS = [
  './', './index.html', './styles.css',
  './js/catalog.js', './js/app.js',
  './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/** Sieť s časovým stropom — po ňom padáme na cache. */
function fromNetwork(req) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), NET_TIMEOUT);
    // 'no-cache' = vždy sa spýtaj servera (ETag), ale prijmi 304.
    // Bez toho by HTTP cache prehliadača servírovala staré súbory —
    // GitHub Pages posiela max-age=600.
    fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(
      (res) => { clearTimeout(t); resolve(res); },
      (err) => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fromNetwork(e.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(V).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then((hit) => hit || caches.match('./index.html')))
  );
});
