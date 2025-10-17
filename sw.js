const CACHE_NAME = 'temperature-tracker-v48';
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'app.js',
  'styles.css',
  'favicon.ico',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests and non-http(s) requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // For navigation requests, always try to serve index.html from cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html')
        .then(cachedResponse => {
          // Return cached index.html immediately
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, try network but fall back to empty response
          return fetch(event.request).catch(() => new Response('', { status: 0 }));
        })
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return from cache if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise try network, but don't fail if offline
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for next time
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // For HTML requests, try to serve index.html if possible
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('index.html')
                .then(response => response || new Response('', { status: 0 }));
            }
            return new Response('', { status: 0 }); // Return empty response for non-HTML requests
          });
      })
  );
});
