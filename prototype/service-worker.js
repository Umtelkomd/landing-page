// Kill switch. The current site registers no service worker. Browsers that still run the worker of the
// pre-November site keep showing that site from its cache; when they check for an update they get this
// file, which empties the caches, unregisters itself and reloads the open tabs onto the current site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) await caches.delete(key);
  await self.registration.unregister();
  for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
})()));
