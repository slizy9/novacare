/* NOVACARE — offline cache so the app opens with no signal.
   Bump VERSION whenever you change the app files. */
const VERSION = 'novacare-v37';
const ASSETS = ['./', 'index.html', 'css/styles.css', 'js/data.js', 'js/osdr.js', 'js/icons.js', 'js/art.js', 'js/config.js', 'js/vendor/supabase.js', 'js/auth.js', 'js/engine.js', 'js/crew.js', 'js/missions.js', 'js/sections.js', 'js/medical.js', 'js/kb.js', 'js/rules.js', 'js/llm.js', 'js/status.js', 'js/reminders.js', 'js/predict.js', 'js/log.js', 'js/earth.js', 'js/coach.js', 'js/insight.js', 'js/app.js',
  'img/station.jpg', 'img/logo.svg', 'fonts/inter-latin-wght-normal.woff2', 'fonts/inter-latin-ext-wght-normal.woff2', 'fonts/fraunces-latin-wght-normal.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// tapping a reminder notification opens NovaCare on that reminder
self.addEventListener('notificationclick', (e) => {
  e.notification.close(); const id = e.notification.data && e.notification.data.id;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const c = list[0]; if (c) { c.focus(); c.postMessage({ reminder: id }); return; }
    return self.clients.openWindow('./?reminder=' + encodeURIComponent(id || ''));
  }));
});
// app files: network first (fresh when online), cache when there is no signal.
// Database calls (the cloud, or the ship server under /ship/ on this origin) are never cached.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || /\/ship\/|\/(rest|auth)\/v1\//.test(url.pathname)) return;
  e.respondWith(
    // 'no-cache': always ask the server whether the file changed, so a new version shows up on the next load
    fetch(e.request, { cache: 'no-cache' }).catch(() => fetch(e.request)).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
