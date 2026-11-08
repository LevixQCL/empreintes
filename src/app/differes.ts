// Les écrans qui ne partent plus au démarrage (8 novembre 2026) : Pillages, Flèche, Cercle et le duel.
// Le premier écran s'affiche sans eux ; ils arrivent juste après, en arrière-plan (prechargerDifferes),
// ou tout de suite si le joueur les ouvre avant. En attendant, l'écran garde sa barre et affiche « Chargement… ».
// Le service worker les garde ensuite sur l'appareil : hors ligne, ils s'ouvrent comme avant.

import { coquille, entete, type EcranDistrict } from '../ui/coquille';

type Ecrans = typeof import('./ecrans-differes');

let ecrans: Ecrans | null = null;
let charge: Promise<Ecrans> | null = null;
let rate = false;
/** un écran attend son module : on redessine quand il arrive */
let attendu = false;
let redessiner: () => void = () => {};

export function brancherDifferes(afficher: () => void): void { redessiner = afficher; }

export function chargerEcrans(): Promise<Ecrans> {
  charge ??= import('./ecrans-differes').then((m) => {
    ecrans = m; rate = false;
    if (attendu) { attendu = false; redessiner(); }
    return m;
  }).catch((err) => {
    // sans réseau (et pas encore gardé sur l'appareil) : on réessaiera au prochain dessin
    charge = null; rate = true;
    if (attendu) { attendu = false; redessiner(); }
    throw err;
  });
  return charge;
}

/** Le module des écrans, ou null s'il n'est pas encore là (son chargement est alors lancé) */
export function ecransDifferes(): Ecrans | null {
  if (ecrans) return ecrans;
  attendu = true;
  chargerEcrans().catch(() => {});
  return null;
}

/** Ce qui s'affiche le temps que l'écran arrive (souvent moins d'une seconde, et une seule fois) */
export function htmlChargement(e: EcranDistrict, surtitre: string, titre: string): string {
  const texte = rate ? 'Pas de réseau : cet écran s’ouvrira dès que la connexion revient.' : 'Chargement…';
  return coquille(e, entete(surtitre, titre) + `<p class="chargement-ecran" role="status">${texte}</p>`, 'chargement');
}

/** Après le premier écran : les écrans différés et les animations du combat, sans gêner le démarrage */
export function prechargerDifferes(autres: () => Promise<unknown>): void {
  const lancer = () => { chargerEcrans().catch(() => {}); autres().catch(() => {}); };
  const ric = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  // dès que le navigateur souffle après le premier dessin : le temps de toucher « Entrer », ils sont là
  if (ric) ric(lancer, { timeout: 1500 }); else setTimeout(lancer, 300);
}
