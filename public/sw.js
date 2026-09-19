const CACHE_NAME = 'bookolaka-cache-v11';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/iconweb.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-180x180.png',
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
  // 1. Lewatkan request non-GET atau request ke API backend
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(e.request.url);

  // 2. Hanya tangani request yang ditujukan ke domain yang sama (same-origin)
  // Jangan intercept request ke layanan luar (Ably, Google Fonts, Sheets, dll.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Lewatkan langsung ke network jika di local development agar tidak bentrok dengan Vite dev server & HMR
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // 4. Deteksi apakah ini request navigasi halaman / rute SPA HTML
  // Termasuk request mode navigate, dokumen HTML, atau path rute SPA tanpa ekstensi file
  const isHtmlNavigation =
    e.request.mode === 'navigate' ||
    e.request.destination === 'document' ||
    e.request.headers.get('accept')?.includes('text/html') ||
    (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));

  if (isHtmlNavigation) {
    // Network First strategy untuk halaman HTML: selalu coba ambil yang terbaru dari server
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Simpan shell HTML ke cache /index.html
              cache.put('/index.html', responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Jika offline atau jaringan gagal, fallback ke index.html yang ada di cache
          const cached = await caches.match('/index.html') || await caches.match('/');
          if (cached) {
            return cached;
          }
          // Jika index.html belum ada di cache, tampilkan pesan offline informatif
          return new Response(
            '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offline</title></head><body style="font-family: sans-serif; text-align: center; padding: 2rem; color: #333;"><h2>Aplikasi Sedang Offline</h2><p>Pastikan koneksi internet Anda aktif. Sistem tidak dapat memuat data saat ini.</p><button onclick="window.location.reload()" style="padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 5px; cursor: pointer;">Coba Lagi</button></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        })
    );
    return;
  }

  // 5. Stale-While-Revalidate untuk static assets (JS, CSS, images, icons)
  e.respondWith(
    caches.match(e.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        // Di-background, ambil data terbaru untuk mengupdate cache
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const contentType = networkResponse.headers.get('content-type');
            if (e.request.url.match(/\.(js|css)$/) && contentType && contentType.includes('text/html')) {
              return; // Abaikan, ini file HTML fallback dari SPA
            }
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => { /* Abaikan error background fetch */ });
        return cachedResponse;
      }

      // Jika tidak ada di cache, fetch dari jaringan
      try {
        const networkResponse = await fetch(e.request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const contentType = networkResponse.headers.get('content-type');
          if (e.request.url.match(/\.(js|css)$/) && contentType && contentType.includes('text/html')) {
            return new Response('Not Found', { status: 404, statusText: 'Not Found' });
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      } catch (err) {
        // Jika aset statis gagal dimuat, kembalikan 404 bukan 503
        return new Response('Asset Not Found', { status: 404, statusText: 'Not Found' });
      }
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

  // Gunakan iconweb.png (ikon persegi PWA) agar gambar tidak ter-stretch di Android/iOS
  const options = {
    body: data.body || 'Ada notifikasi baru dari sistem BOOKOLAKA.',
    icon: '/iconweb.png',
    badge: '/iconweb.png',
    vibrate: [200, 100, 200, 100, 200],
    renotify: true, // Wajib agar notifikasi dengan tag sama tetap bergetar & berbunyi di Android/iOS
    visibility: 'public',
    tag: data.tag || 'bookolaka-' + Date.now(), // Tag unik agar tidak menimpa notifikasi sebelumnya secara bisu
    data: {
      url: data.url || '/user/my-bookings'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BOOKOLAKA', options)
      .catch((err) => console.error('[SW] Gagal menampilkan notifikasi:', err))
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
