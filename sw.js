const CACHE_NAME = 'temperature-tracker-v58';
// Network timeout (ms) for flaky mobile connections — fall back to cache after this
const NETWORK_TIMEOUT = 5000;
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
  ,
  './offline.html'
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
// Helper: fetch with timeout so we can fall back to cache quickly on flaky connections
function fetchWithTimeout(request, timeout = NETWORK_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, timeout);

    fetch(request).then(response => {
      clearTimeout(timer);
      resolve(response);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and non-http(s) requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // For core assets (app.js/styles.css), prefer the network so soft refreshes pick up
  // updated logic. Fall back to cache when offline.
  try {
    const url = new URL(event.request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isCoreAsset = isSameOrigin && (url.pathname.endsWith('/app.js') || url.pathname.endsWith('/styles.css'));

    if (isCoreAsset) {
      event.respondWith(
        (async () => {
          const cache = await caches.open(CACHE_NAME);
          try {
            const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone()).catch(() => { });
            }
            return networkResponse;
          } catch (e) {
            return (await cache.match(event.request)) || Response.error();
          }
        })()
      );
      return;
    }
  } catch (e) {
    // If URL parsing fails for any reason, fall through to existing behavior.
  }

  // For navigation requests, serve the app shell from cache first (stale-while-revalidate)
  // This makes sure the app opens instantly and works even on flaky/half-connected mobile networks.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Try to serve a cached navigation response first
        const cachedIndex = await cache.match('index.html');
        if (cachedIndex) {
          // Kick off a background update of index.html when we're online
          event.waitUntil(
            fetchWithTimeout(event.request, NETWORK_TIMEOUT)
              .then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                  const copy = networkResponse.clone();
                  return cache.put('index.html', copy);
                }
              })
              .catch(() => {
                // Ignore network errors during background update
              })
          );
          return cachedIndex;
        }

        // No cached shell yet: try network, then fall back to offline page
        try {
          const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            await cache.put('index.html', copy);
            return networkResponse;
          }
        } catch (e) {
          // ignore and fall through to cache/offline fallback
        }

        // Final fallback: cached index.html or offline.html if available
        return (await cache.match('index.html')) || (await cache.match('offline.html')) || Response.error();
      })()
    );
    return;
  }

  // For other requests: try cache first, otherwise network (with timeout) and cache it; if network fails, try cache again.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then(networkResponse => {
          // If the response is valid, cache a copy (including CORS responses)
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache)).catch(() => { });
            return networkResponse;
          }
          // Bad network response -> try cache fallback
          return caches.match(event.request);
        })
        .catch(() => {
          // Network failed: try cache fallback (match by request) or serve offline.html for navigations
          return caches.match(event.request).then(cached => cached || caches.match('offline.html'));
        });
    })
  );
});