// Service Worker for "قطرة دم تنقذ حياة إنسان - قعطبة" PWA
const CACHE_NAME = 'qataba-blood-pwa-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png'
];

// 1. تثبيت الـ Service Worker وحفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. تفعيل الـ Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. اعتراض الطلبات وتقديم الملفات المخزنة أو صفحة وضع عدم الاتصال
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // السماح لطلبات API وقواعد البيانات بالمرور الشبكي المباشر أولاً
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firestore.googleapis.com')) {
    return;
  }

  // معالجة التنقل بين الصفحات
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // الاستراتيجية: Cache First مع التحديث في الخلفية (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // تحديث الكاش في الخلفية
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // في حال فشل جلب صورة
        if (event.request.destination === 'image') {
          return caches.match('/icon.svg');
        }
      });
    })
  );
});

// 4. دعم الإشعارات الفورية (Push Notifications) لحالات الطوارئ والتبرع
self.addEventListener('push', (event) => {
  let data = {
    title: 'نداء دم عاجل - قعطبة 🩸',
    body: 'هناك حالة طارئة تحتاج متبرعاً بالدم في قعطبة.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: '/?tab=urgent' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200],
      tag: 'urgent-blood-request',
      renotify: true,
      data: data.data
    })
  );
});

// 5. التفاعل عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. المزامنة في الخلفية (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-donor' || event.tag === 'sync-urgent-request') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[SW] Background sync triggered:', event.tag);
      })
    );
  }
});

// 7. المزامنة الدورية في الخلفية (Periodic Background Sync)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-urgent-blood-requests') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[SW] Periodic sync check for urgent cases');
      })
    );
  }
});
