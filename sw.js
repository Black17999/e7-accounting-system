// 更新后的 sw.js
const CACHE_NAME = 'e7-chess-cache-v2'; // 更新缓存版本
const OFFLINE_URL = '/index.html'; // 离线回退页面

// 需要缓存的资源（添加更多关键资源）
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js',
  'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 强制激活新SW
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即控制所有客户端
  );
});

self.addEventListener('fetch', event => {
  // 处理导航请求的离线回退
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 其他资源的网络优先策略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .then(response => {
            // 动态缓存重要资源
            if (event.request.url.startsWith('http') && 
                (event.request.url.includes('/icon') || 
                 event.request.url.includes('/manifest') ||
                 event.request.url.includes('cdn.jsdelivr.net'))) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          });
      })
  );
});
