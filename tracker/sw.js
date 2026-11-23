const CACHE = 'dwt-v3';
const SHELL = ['/tracker/', '/tracker/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only intercept same-origin GET requests (let Firebase/Google go to network)
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin + '/tracker/')) return;
  // Network-first so new deploys show up immediately; cache is the offline fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// "Pomodoro done" notification → focus the open tracker tab, or open one
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const tab = list.find(c => c.url.includes('/tracker/'));
      return tab ? tab.focus() : self.clients.openWindow('/tracker/');
    })
  );
});
