// 缓存名称
const CACHE_NAME = 'e7-chess-cache-v1';

// 需要缓存的资源
const urlsToCache = [
  '/',
  '/index.html'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已缓存核心文件');
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 返回缓存或网络请求
        return response || fetch(event.request);
      })
  );
});