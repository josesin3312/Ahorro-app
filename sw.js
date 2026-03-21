// Service Worker para PWA - Ahorro Mensual (Offline + Cache)
const CACHE_NAME = 'ahorro-mensual-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/export.js',
  './manifest.json',
  './icono app.jpeg',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalación: Cache inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar caches viejos
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
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first → Cache → Offline fallback
self.addEventListener('fetch', event => {
  if (event.request.url.includes('localStorage') || event.request.method !== 'GET') {
    return; // LocalStorage/data no cacheada (persiste en app)
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache exitoso
        if (event.request.destination === 'script' || 
            event.request.destination === 'style' || 
            event.request.destination === 'document' ||
            event.request.destination === 'image' ||
            event.request.destination === 'font') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Offline: Buscar en cache
        return caches.match(event.request)
          .then(response => response || createOfflineFallback());
      })
  );
});

// Fallback offline: Página básica
function createOfflineFallback() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Ahorro Mensual Offline</title></head>
    <body style="font-family:sans-serif;padding:40px;text-align:center;">
      <h1>💰 Ahorro Mensual</h1>
      <p>Estás offline. Tus datos están seguros en LocalStorage.</p>
      <p>Revisa conexión y recarga.</p>
      <script>localStorage.getItem('ahorroMensual') && alert('✅ Datos guardados OK!');</script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

console.log('SW registrado: Ahorro Mensual PWA v1.2 - Icono App agregado');

