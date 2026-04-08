// @ts-nocheck — Service Worker runs in a different global scope
// Gaurabda PWA Service Worker

import { setupServiceWorker } from '@builder.io/qwik-city/service-worker';

setupServiceWorker();

// Skip caching for external resources (map tiles, CDN assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
  }
});
