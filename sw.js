// 更新后的 sw.js
const CACHE_NAME = 'e7-chess-cache-v12'; // 更新版本号以清除旧缓存（修复债务删除重复问题）
const OFFLINE_URL = '/index.html';
const SPLASH_SCREEN_URL = '/splash.html';

// 需要缓存的资源（移除 Supabase SDK，让它实时加载）
const urlsToCache = [
  '/',
  '/index.html',
  '/splash.html',
  '/auth.html',
  '/manifest.json',
  '/style.css',
  '/splash.css',
  '/main-modular.js',
  '/modules/supabase.js',
  '/modules/supabaseData.js',
  '/modules/dataManager.js',
  '/modules/tobacco.js',
  '/modules/categoryManager.js',
  '/modules/uiManager.js',
  '/modules/statistics.js',
  '/modules/moduleLoader.js',
  '/modules/mobileDatePicker.js',
  '/modules/icons/icons.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  // 移除 preview.png，因为该文件不存在
  'https://cdn.bootcdn.net/ajax/libs/vue/2.6.14/vue.min.js',
  'https://cdn.bootcdn.net/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  // Chart.js 改为可选缓存，在 fetch 事件中处理
  'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 可选缓存资源（缓存失败不影响核心功能）
const optionalCacheUrls = [
  'https://cdn.bootcdn.net/ajax/libs/Chart.js/3.9.1/chart.min.js'
];

// Supabase CDN 域名，不缓存这些请求
const SUPABASE_CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'esm.sh'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('开始缓存核心文件');
        // 核心文件缓存
        const corePromises = urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.warn('核心文件缓存失败:', url, err.message);
            return null;
          })
        );
        
        // 可选文件缓存（静默失败）
        const optionalPromises = optionalCacheUrls.map(url =>
          cache.add(url).catch(err => {
            console.log('可选文件缓存失败（忽略）:', url);
            return null;
          })
        );
        
        return Promise.allSettled([...corePromises, ...optionalPromises]);
      })
      .then(() => {
        console.log('文件缓存完成');
      })
      // 不再立即 skipWaiting()，等待主线程消息
  );
});

// --- 解决问题三：添加消息监听器 ---
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
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
  const requestUrl = new URL(event.request.url);
  
  // 跳过 Supabase CDN 请求，直接从网络获取
  if (SUPABASE_CDN_HOSTS.some(host => requestUrl.hostname.includes(host))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // 处理导航请求
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 处理其他请求：先查缓存，没有再从网络获取
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
