// Service worker minimal : il rend le jeu installable sur l'écran d'accueil (Android/Chrome).
// Il ne met rien en cache : chaque requête part au réseau, le jeu reste toujours à jour.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request));
});
