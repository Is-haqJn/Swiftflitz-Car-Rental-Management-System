/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST: { url: string; revision: string | null }[];
};

const CACHE = 'swiftflitz-offline-v1';

self.addEventListener('install', event => {
    const urls = self.__WB_MANIFEST.map(e => e.url);
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches
                .keys()
                .then(keys =>
                    Promise.all(
                        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
                    )
                ),
        ])
    );
});

self.addEventListener('fetch', event => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cached = await caches.match('/offline.html');
                return cached ?? new Response('Offline', { status: 503 });
            })
        );
    }
});
