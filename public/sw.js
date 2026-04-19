/**
 * UK Grocery Store - Service Worker
 * Production-ready PWA service worker for marketplace e-commerce
 *
 * Features:
 * - Cache-first for static assets
 * - Network-first for API calls
 * - Stale-while-revalidate for product images
 * - Offline fallback page
 * - Background sync for cart operations
 */

const CACHE_VERSION = 'v5.1.0';
const STATIC_CACHE = `ukgrocery-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ukgrocery-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `ukgrocery-images-${CACHE_VERSION}`;
const API_CACHE = `ukgrocery-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon.svg',
];

// API endpoints that should use network-first strategy
const API_ROUTES = [
  '/api/',
];

// Routes that should never be cached
const NO_CACHE_ROUTES = [
  '/api/auth/',
  '/api/checkout/',
  '/api/payment/',
  '/admin/',
  '/vendor/',
];

// Maximum items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_IMAGE_CACHE_ITEMS = 100;

// Network timeout for navigation requests (ms)
const NAVIGATION_TIMEOUT = 8000;

/**
 * Inline offline fallback HTML — zero dependencies, always works.
 * Used when network fails AND no cached page AND /offline isn't cached.
 */
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline — UK Grocery Store</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafafa;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{max-width:420px;width:100%;text-align:center;background:#fff;border-radius:16px;padding:48px 32px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .icon{width:72px;height:72px;margin:0 auto 24px;background:#FEF3E2;border-radius:50%;display:flex;align-items:center;justify-content:center}
    .icon svg{width:36px;height:36px;color:#E07B0A}
    h1{font-size:22px;font-weight:700;margin-bottom:8px;color:#111}
    p{font-size:15px;color:#666;line-height:1.5;margin-bottom:28px}
    .brand{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px}
    .brand-icon{width:32px;height:32px;background:#1B6B3A;border-radius:8px;display:flex;align-items:center;justify-content:center}
    .brand-icon svg{width:20px;height:20px;color:#fff}
    .brand span{font-size:18px;font-weight:700;color:#1B6B3A}
    button{width:100%;padding:14px;background:#1B6B3A;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;transition:background .2s}
    button:hover{background:#155a30}
    .status{margin-top:24px;font-size:13px;color:#999;display:flex;align-items:center;justify-content:center;gap:8px}
    .dot{width:8px;height:8px;border-radius:50%;background:#ef4444;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728m2.828 9.9a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
    </div>
    <div class="brand">
      <div class="brand-icon">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </div>
      <span>UK Grocery Store</span>
    </div>
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again. Your cart items are saved and will sync when you reconnect.</p>
    <button onclick="window.location.reload()">Try Again</button>
    <div class="status"><span class="dot"></span>Waiting for connection...</div>
  </div>
  <script>window.addEventListener('online',function(){window.location.reload()})</script>
</body>
</html>`;

/**
 * Install Event - Cache static assets
 * Caches each asset individually so one failure doesn't block the rest.
 * Always stores the inline offline fallback so we never show a blank page.
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('[ServiceWorker] Caching static assets');

        // Always store the inline offline fallback first — this never fails
        await cache.put(
          new Request('/_offline-fallback'),
          new Response(OFFLINE_FALLBACK_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })
        );

        // Cache each static asset individually — don't let one failure break all
        await Promise.allSettled(
          STATIC_ASSETS.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
              }
            } catch (err) {
              console.warn('[ServiceWorker] Failed to cache:', url, err);
            }
          })
        );

        console.log('[ServiceWorker] Static assets cached');
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('ukgrocery-') &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== IMAGE_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Handle all network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip routes that should never be cached
  if (NO_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
    return;
  }

  // Skip external domain requests (CDN images, fonts, etc.) — let browser handle directly
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Next.js image optimization endpoint — let Next.js handle directly
  if (url.pathname.startsWith('/_next/image')) {
    return;
  }

  // Handle different request types with appropriate strategies
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isImageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  } else if (isStaticAsset(url)) {
    // Use network-first for JS/CSS — Next.js uses content-hashed filenames,
    // so cache-first can serve stale bundles after a new deployment
    event.respondWith(networkFirstWithOffline(request));
  } else {
    event.respondWith(networkFirstWithOffline(request));
  }
});

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return API_ROUTES.some(route => url.pathname.startsWith(route));
}

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  const acceptHeader = request.headers.get('Accept') || '';
  return acceptHeader.includes('image') ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname.startsWith('/_next/static/');
}

/**
 * Cache-First Strategy
 * Best for static assets that rarely change.
 * Returns a proper error response on failure — never returns HTML for non-HTML requests.
 */
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first failed:', error);

    // Only return offline page for navigation requests — never for JS/CSS/assets
    if (request.mode === 'navigate') {
      return getOfflineFallback();
    }

    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Network-First Strategy
 * Best for API calls and dynamic content
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());

      // Limit cache size
      limitCacheSize(API_CACHE, MAX_DYNAMIC_CACHE_ITEMS);
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return empty JSON for API requests when offline
    return new Response(
      JSON.stringify({
        error: 'You are offline',
        offline: true,
        message: 'Please check your internet connection and try again.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Network-First with Offline Fallback
 * Best for HTML pages — includes timeout and guaranteed fallback
 */
async function networkFirstWithOffline(request) {
  const isNavigation = request.mode === 'navigate';

  try {
    // For navigation requests, add a timeout so users don't stare at a blank screen
    const networkResponse = isNavigation
      ? await fetchWithTimeout(request, NAVIGATION_TIMEOUT)
      : await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS);
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed for page:', request.url);

    // Try cached version first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, serve offline fallback
    if (isNavigation) {
      return getOfflineFallback();
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Fetch with timeout — rejects if network takes too long
 */
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Network timeout'));
    }, timeoutMs);

    fetch(request, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Get offline fallback — tries /offline page first, then inline HTML.
 * Guarantees a response is ALWAYS returned (never undefined/blank).
 */
async function getOfflineFallback() {
  // Try the cached Next.js offline page
  const offlinePage = await caches.match('/offline');
  if (offlinePage) {
    return offlinePage;
  }

  // Fall back to the inline HTML (always available — stored during install)
  const inlineFallback = await caches.match('/_offline-fallback');
  if (inlineFallback) {
    return inlineFallback;
  }

  // Absolute last resort — return inline HTML directly
  return new Response(OFFLINE_FALLBACK_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * Stale-While-Revalidate Strategy
 * Best for images and content that can be slightly stale
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const placeholderSvg = new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect fill="#f3f4f6" width="200" height="200"/>
      <text fill="#9ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="100" y="105">Image unavailable</text>
    </svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } }
  );

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        limitCacheSize(cacheName, MAX_IMAGE_CACHE_ITEMS);
      }
      return networkResponse;
    })
    .catch(() => placeholderSvg);

  return cachedResponse || fetchPromise;
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Background Sync - Sync cart and wishlist when back online
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }

  if (event.tag === 'sync-wishlist') {
    event.waitUntil(syncWishlist());
  }
});

async function syncCart() {
  try {
    const pendingCartItems = await getFromIndexedDB('pending-cart');
    if (pendingCartItems && pendingCartItems.length > 0) {
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingCartItems }),
      });
      await clearFromIndexedDB('pending-cart');
      console.log('[ServiceWorker] Cart synced successfully');
    }
  } catch (error) {
    console.error('[ServiceWorker] Cart sync failed:', error);
  }
}

async function syncWishlist() {
  try {
    const pendingWishlistItems = await getFromIndexedDB('pending-wishlist');
    if (pendingWishlistItems && pendingWishlistItems.length > 0) {
      await fetch('/api/wishlist/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingWishlistItems }),
      });
      await clearFromIndexedDB('pending-wishlist');
      console.log('[ServiceWorker] Wishlist synced successfully');
    }
  } catch (error) {
    console.error('[ServiceWorker] Wishlist sync failed:', error);
  }
}

/**
 * Push Notification Handler
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  let data = {
    title: 'UK Grocery Store',
    body: 'Fresh groceries delivered to your door.',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: 'ukgrocery-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: false,
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message Handler - Communication with main app
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('ukgrocery-'))
            .map(name => caches.delete(name))
        );
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      getCacheStatus().then((status) => {
        event.ports[0]?.postMessage(status);
      })
    );
  }
});

/**
 * Get cache status for debugging
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('ukgrocery-')) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
  }

  return {
    version: CACHE_VERSION,
    caches: status,
    timestamp: new Date().toISOString()
  };
}

/**
 * IndexedDB helpers for offline data storage
 */
function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ukgrocery-offline', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve(null);
        return;
      }
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-cart')) {
        db.createObjectStore('pending-cart', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-wishlist')) {
        db.createObjectStore('pending-wishlist', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function clearFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ukgrocery-offline', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

console.log('[ServiceWorker] Script loaded - Version:', CACHE_VERSION);
