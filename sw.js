const CACHE_NAME = 'ahorros-app-v6'; // Subimos a v7 para forzar la actualización
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-512x512.png'
];

// Instalación: Guarda los nuevos archivos y salta la espera
self.addEventListener('install', e => {
  self.skipWaiting(); // Fuerza a que este Service Worker tome el control de inmediato
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activación: Limpia los cachés antiguos de versiones pasadas (como la v5 o anteriores)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Borrando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de red
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});;