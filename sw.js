// Incrementa este número de versión cada vez que subas cambios al proyecto
const CACHE_NAME = 'lasser-beats-v16';

// Archivos principales para almacenar en caché
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://accounts.google.com/gsi/client'
];

// 1. INSTALACIÓN: Guarda los archivos en la nueva caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Guardando archivos en caché:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Fuerza al SW a activarse inmediatamente sin esperar a que la pestaña se cierre
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVACIÓN: Elimina las cachés antiguas para liberar espacio
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Reclama el control de todas las pestañas/ventanas abiertas inmediatamente
      return self.clients.claim();
    })
  );
});

// 3. INTERCEPCIÓN DE PETICIONES: Estrategia Network First / Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o esquemas no soportados
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la respuesta es válida, actualizamos la caché dinámicamente
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red (offline), sirve el archivo guardado en caché
        return caches.match(event.request);
      })
  );
});