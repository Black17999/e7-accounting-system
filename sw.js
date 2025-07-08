// 更新后的 sw.js
const CACHE_NAME = 'e7-chess-cache-v3'; // 更新版本号
const OFFLINE_URL = '/index.html';

// 需要缓存的资源
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.bootcdn.net/ajax/libs/vue/2.6.14/vue.min.js',
  'https://cdn.bootcdn.net/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.bootcdn.net/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
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
    }).then(() => {
      // 确保控制所有客户端
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // 处理导航请求
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 处理其他请求
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
