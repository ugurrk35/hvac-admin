// Minimal no-op service worker to prevent 404s and enable future enhancements.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients so updates take effect immediately.
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler (no caching by default)
self.addEventListener('fetch', () => {});
