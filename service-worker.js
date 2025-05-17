// Service worker pro offline přístup k aplikaci

const CACHE_NAME = 'bary-branik-v2';
const APP_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/data.js',
  '/js/export.js',
  '/js/history.js',
  '/js/invoice.js',
  '/js/settings.js',
  '/js/stats.js',
  '/js/theme.js',
  '/js/ui.js',
  '/js/utils.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalace service workeru
self.addEventListener('install', event => {
  console.log('Service Worker: Instalace');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Ukládání souborů do cache');
        return cache.addAll(APP_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Všechny soubory uloženy do cache');
        return self.skipWaiting();
      })
  );
});

// Aktivace service workeru
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktivace');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Mazání staré cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Aktivován a kontroluje požadavky');
      return self.clients.claim();
    })
  );
});

// Zpracování požadavků
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - vrátit odpověď z cache
        if (response) {
          return response;
        }
        
        // Jinak vyslat požadavek na server
        return fetch(event.request)
          .then(response => {
            // Vrátit odpověď, pokud není platná
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Klonovat odpověď, protože se bude používat jak pro cache, tak pro prohlížeč
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(error => {
        console.log('Service Worker: Chyba při načítání', error);
        // Můžete zde poskytnout fallback obsah pro offline režim
        // return caches.match('/offline.html');
      })
  );
});

// Periodická aktualizace cache (každých 24 hodin)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Funkce pro periodickou aktualizaci cache
function periodicCacheUpdate() {
  console.log('Service Worker: Kontrola aktualizací');
  
  // Aktualizace všech souborů v cache
  caches.open(CACHE_NAME).then(cache => {
    APP_ASSETS.forEach(url => {
      fetch(url, { cache: 'no-cache' }).then(response => {
        if (response.ok) {
          cache.put(url, response);
        }
      });
    });
  });
}

// Nastavení periodické aktualizace cache
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-update') {
    event.waitUntil(periodicCacheUpdate());
  }
});