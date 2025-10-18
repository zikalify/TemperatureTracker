const CACHE_NAME = 'temperature-tracker-v50';
const ASSETS = [
  './',
  './index.html',
  'index.html',
  './app.js',
  'app.js',
  './styles.css',
  'styles.css',
  './favicon.ico',
  'favicon.ico',
  './manifest.json',
  'manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        // Don't wait for all assets to cache
        return Promise.all(
          ASSETS.map(asset => {
            return cache.add(asset).catch(err => {
              console.log('Failed to cache:', asset, err);
              return Promise.resolve(); // Don't fail the entire install if one asset fails
            });
          })
        );
      })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      ).then(() => self.clients.claim()); // Take control of all clients
    })
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and non-http(s) requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // For navigation requests, serve index.html from cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html')
        .then(cachedResponse => cachedResponse || fetch(event.request))
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return from cache if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise try network, but don't fail if offline
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for next time
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.log('Failed to cache response:', err));

            return response;
          })
          .catch(() => {
            // For HTML requests, try to serve index.html if possible
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('index.html');
            }
            return new Response('', { status: 0 }); // Return empty response for non-HTML requests
          });
      })
  );
});