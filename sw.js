/* App shell only. Never caches call data: API requests go to the private backend and are not intercepted.
   Network-first (bypassing the HTTP cache) for every shell request; cache is only an offline fallback. */
var V = 'calls-v3-1', SHELL = ['./', 'index.html', 'app.css', 'app.js', 'config.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (p) { return fetch(new Request(p, { cache: 'no-store' })).then(function (r) { if (r.ok) return c.put(p, r); }); }));
  }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); })
    .then(function () { return self.clients.matchAll({ type: 'window' }); })
    .then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: 'sw-updated', v: V }); try { c.navigate(c.url).catch(function () {}); } catch (x) {} }); }));
});
self.addEventListener('message', function (e) { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  var nav = req.mode === 'navigate';
  var net = nav ? fetch(req.url.split('#')[0], { cache: 'no-store', credentials: 'same-origin' }) : fetch(req, { cache: 'no-store' });
  e.respondWith(net.then(function (r) {
    if (r && r.ok) { var c = r.clone(); caches.open(V).then(function (ca) { ca.put(nav ? 'index.html' : req, c); }); }
    return r;
  }).catch(function () {
    return caches.match(nav ? 'index.html' : req, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); });
  }));
});
