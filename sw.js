/* Service worker — DISABLED / self-destruct.
   The previous SW cache-first served stale cinema assets after deploys, so
   visitors kept seeing the old site. This version caches NOTHING, clears all
   old caches, unregisters itself, and reloads any controlled pages so the
   live deploy always wins. (Re-introduce a properly versioned SW later.) */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    } catch (e) { /* no-op */ }
  })());
});

// No fetch handler — every request goes straight to the network/CDN.
