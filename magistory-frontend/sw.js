const CACHE_NAME = 'magistory-v1';
const toCache = [
  '/',
  '/index.html',
  '/idea.html',
  '/manual.html',
  '/style.css',
  '/idea.js',
  '/manual.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(toCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});