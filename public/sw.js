// Service worker d'EMPREINTES (7 novembre 2026) : le jeu reste installable et démarre même sans réseau.
// - la page (index.html) : réseau d'abord, la copie gardée seulement hors ligne → le jeu est toujours à jour ;
// - les fichiers du build (assets/…-empreinte.js/css) : jamais modifiés une fois publiés → gardés, servis tout de suite ;
// - les illustrations, polices, icônes : servies tout de suite depuis l'appareil, puis rafraîchies en arrière-plan
//   (une image remplacée par Bryan apparaît à la visite suivante) ;
// - tout ce qui n'est pas sur notre site (Firebase, Google) n'est pas touché.
// Avant, rien n'était gardé : les 36 Mo d'images repartaient au réseau dès que le cache du navigateur expirait
// (10 min sur GitHub Pages), d'où des cartes noires plusieurs secondes.
const VERSION = 'v2';
const PAGE = `empreintes-page-${VERSION}`;
const BUILD = `empreintes-build-${VERSION}`;
const ART = `empreintes-art-${VERSION}`;
const GARDES = [PAGE, BUILD, ART];
// au-delà, les plus anciens fichiers du build partent (ceux des versions précédentes du jeu)
const MAX_BUILD = 80;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGE).then((c) => c.add('./')).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k.startsWith('empreintes-') && !GARDES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function elaguer(nom, max) {
  const c = await caches.open(nom);
  const cles = await c.keys();
  for (let i = 0; i < cles.length - max; i++) await c.delete(cles[i]);
}

const reussie = (r) => r && r.ok && r.type === 'basic';

async function pageReseauDabord(req) {
  const c = await caches.open(PAGE);
  // le jeu (…/ ou …/index.html) est rangé sous une seule clé ; analyse.html et duel.html sous la leur
  const p = new URL(req.url).pathname;
  const cle = p.endsWith('/') || p.endsWith('/index.html') ? './' : req;
  try {
    const r = await fetch(req);
    if (reussie(r)) c.put(cle, r.clone());
    return r;
  } catch {
    return (await c.match(cle, { ignoreSearch: true })) || Response.error();
  }
}

async function buildGarde(req) {
  const c = await caches.open(BUILD);
  const garde = await c.match(req);
  if (garde) return garde;
  const r = await fetch(req);
  if (reussie(r)) { await c.put(req, r.clone()); elaguer(BUILD, MAX_BUILD); }
  return r;
}

async function artPuisRafraichi(req, e) {
  const c = await caches.open(ART);
  const garde = await c.match(req);
  const frais = fetch(req).then((r) => { if (reussie(r)) c.put(req, r.clone()); return r; });
  if (garde) { e.waitUntil(frais.catch(() => {})); return garde; }
  return frais;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // les vidéos se lisent par morceaux (Range) : le navigateur s'en charge
  if (req.headers.has('range')) return;
  if (req.mode === 'navigate') { e.respondWith(pageReseauDabord(req)); return; }
  if (url.pathname.includes('/assets/')) { e.respondWith(buildGarde(req)); return; }
  e.respondWith(artPuisRafraichi(req, e));
});
