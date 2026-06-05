const CACHE_NAME = 'bookolaka-cache-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/iconweb.png',
  '/logo.png',
  '/logocolor.png',
  '/logoweb.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Langsung aktifkan SW baru tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// Activate — ambil alih kontrol halaman segera dan bersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Skip API requests and non-GET requests
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(e.request.url);

  // Network First strategy for HTML navigation requests (to always get the latest chunks)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Stale-While-Revalidate for other assets (JS, CSS, images)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        // Only cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[SW] Fetch failed, returning cache if available', err);
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Mendengarkan Push Event dari Server Vendor
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // Fallback jika payload bukan JSON
    data = {
      title: 'BOOKOLAKA',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'Ada notifikasi baru dari sistem BOOKOLAKA.',
    icon: '/logoweb.png',
    badge: '/iconweb.png',
    visibility: 'public',
    tag: data.tag || 'bookolaka-notification',
    data: {
      url: data.url || '/user/my-bookings'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BOOKOLAKA', options)
  );
});

// Mendengarkan Klik pada Notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Jika tab aplikasi sudah terbuka, fokuskan dan arahkan URL-nya
      for (let client of windowClients) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(targetUrl, self.location.origin);
        if (clientUrl.origin === targetUrlObj.origin && 'focus' in client) {
          return client.focus().then(() => {
            if (client.navigate) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // Jika aplikasi belum terbuka, buka tab baru menuju URL target
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
