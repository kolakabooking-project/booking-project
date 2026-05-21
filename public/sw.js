const CACHE_NAME = 'bookolaka-cache-v1';
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

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Ada notifikasi baru dari sistem BOOKOLAKA.',
      icon: '/logo.png', // Ikon notifikasi
      badge: '/favicon.svg', // Ikon status bar
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/user/my-bookings'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'BOOKOLAKA', options)
    );
  } catch (err) {
    console.error('Failed to show push notification:', err);
  }
});

// Mendengarkan Klik pada Notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data.url;

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
