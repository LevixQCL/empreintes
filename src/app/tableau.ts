// Le Grand Tableau en ligne : lecture des classements et publication de son entrée.

import { aChange, entreeAPublier } from '../core/classements';
import * as J from '../core/jeu';
import { app, compteProtege, D, G } from './etat';
import { afficher } from './rendu';

// ---------- Le Grand Tableau en ligne ----------
// On publie son entrée quand un score change (au plus une fois toutes les 25 secondes, comme le veulent les règles Firestore),
// et on relit les classements à l'ouverture de l'écran (au plus une fois par minute, sauf « Actualiser »).

let tableauNet: typeof import('../net/classement') | null = null;
let dernierePublication = 0;
let minuteurPublication: number | undefined;

export async function reseauTableau() {
  tableauNet ??= await import('../net/classement');
  return tableauNet;
}

export async function lireTableau(force = false) {
  if (!app.compte || !app.uid) return;
  if (!force && G.etat === 'chargement') return;
  if (!force && G.lu && Date.now() - G.lu < 60_000) return;
  G.etat = 'chargement'; G.erreur = '';
  if (app.mode === 'district' && D.vue === 'classements') afficher();
  try {
    const net = await reseauTableau();
    G.entrees = await net.lire();
    app.monEntree = G.entrees.find((x) => x.uid === app.uid) ?? null;
    app.monEntreeLue = true;
    G.lu = Date.now(); G.etat = 'ok';
  } catch (e) {
    G.etat = 'erreur'; G.erreur = `Le Tableau ne répond pas pour l’instant (${(e as { code?: string })?.code ?? 'réseau'}).`;
    console.warn('Grand Tableau', e);
  }
  if (app.mode === 'district') afficher();
  planifierPublication();
}

export function planifierPublication(delai = 2000) {
  if (!app.compte || !app.uid || !compteProtege() || !app.jeu.directeur?.public) return;
  clearTimeout(minuteurPublication);
  const attente = Math.max(delai, dernierePublication + 25_000 - Date.now());
  minuteurPublication = window.setTimeout(publierTableau, attente);
}

async function publierTableau() {
  if (!app.compte || !app.uid || !compteProtege() || !app.jeu.directeur?.public || !app.jeu.directeur.nom) return;
  // l'entrée en ligne d'abord : sa profondeur et sa date décident de ce qu'on a le droit d'envoyer
  if (!app.monEntreeLue) { await lireTableau(true); return; }
  const e = entreeAPublier(app.jeu, app.uid, app.jeu.directeur.nom, app.monEntree, Date.now(), J.semaineDe(Date.now()));
  if (!e || !aChange(e, app.monEntree)) return;
  // le pseudo doit être réservé à ce compte (sauvegarde d'avant les réservations, ou autre appareil)
  if (app.pseudoReserve !== e.cle) {
    try {
      await (await reseauTableau()).reserver(app.uid, app.jeu.directeur.nom, null);
      app.pseudoReserve = e.cle;
    } catch (err) {
      const net = await reseauTableau();
      if (err instanceof net.PseudoPris) {
        G.edition = true; G.accueil = false;
        G.erreur = `« ${app.jeu.directeur.nom} » a été réservé par un autre directeur. Choisis un autre pseudo.`;
        app.jeu.directeur.change = 0;
        if (app.mode === 'district') afficher();
      } else planifierPublication(30_000);
      return;
    }
  }
  try {
    const net = await reseauTableau();
    await net.publier(e);
    dernierePublication = Date.now();
    app.monEntree = e;
    G.entrees = [...G.entrees.filter((x) => x.uid !== app.uid), e];
    if (app.mode === 'district' && D.vue === 'classements') afficher();
    // la profondeur ne monte que de deux Strates par publication : le reste suit à la prochaine
    if (app.jeu.palmares && e.profondeur < app.jeu.palmares.profondeur) planifierPublication(25_000);
  } catch {
    // refusée (trop tôt, ou l'entrée a changé ailleurs) : on relit, puis on réessaie plus tard
    app.monEntreeLue = false;
    dernierePublication = Date.now();
    planifierPublication(30_000);
  }
}
