self.addEventListener('install', (e) => {
    console.log('Service Worker Installed');
});

self.addEventListener('fetch', (e) => {
    // Basic fetch handler for PWA offline capability
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
