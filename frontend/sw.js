const CACHE_NAME = 'crav-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/style.css',
    '/assets/icon.png',
    '/app.js',
    '/utils/store.js',
    '/utils/apiService.js',
    '/utils/router.js'
];

// Install event - caching basic assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - simple network-first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
