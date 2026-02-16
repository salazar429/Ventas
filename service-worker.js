const CACHE_NAME = 'vendedora-cache-v1';
const urlsToCache = [
  '/Ventas/',
  '/Ventas/index.html',
  '/Ventas/styles.css',
  '/Ventas/app_vendedora.js',
  '/Ventas/manifest.json',
  '/Ventas/icons/icon-192.png',
  '/Ventas/icons/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación y limpieza de caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network first, fallback a cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red funciona, actualizar cache y devolver respuesta
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si la red falla, buscar en cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          // Si no está en cache y es una página HTML, mostrar offline.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/Ventas/offline.html');
          }
        });
      })
  );
});

// Manejo de sincronización en segundo plano (para ventas offline)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-ventas') {
    console.log('🔄 Sincronizando ventas pendientes...');
    event.waitUntil(syncPendingSales());
  }
});

// Función para sincronizar ventas (se ejecutará desde la app)
async function syncPendingSales() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_PENDING_SALES'
      });
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}
