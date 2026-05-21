const CACHE_NAME = 'bookolaka-cache-v2';
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
  // Only cache GET requests and skip API requests
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
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
    icon: '/logo.png',
    badge: '/iconweb.png',
    tag: data.tag || 'bookolaka-notification',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/user/my-bookings'
    },
    actions: [
      {
        action: 'open',
        title: 'Buka Bookolaka',
      },
    ],
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
