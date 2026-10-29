// Les pillages en ligne : la garnison qu'on publie, les archipels des autres directeurs, les pillages envoyés et subis.
// Tant que les règles Firestore des garnisons ne sont pas publiées (ou hors ligne), tout échoue sans bruit :
// la carte garde ses archipels sans directeur.

import * as J from '../core/jeu';
import { porteurDef } from '../core/donnees';
import { app, D } from './etat';
import { afficher } from './rendu';

let net: typeof import('../net/pillages') | null = null;
const reseau = async () => (net ??= await import('../net/pillages'));

/** Le nom montré aux autres : le pseudo du Grand Tableau s'il est public, sinon rien qui permette de reconnaître le joueur */
export const nomPublic = () => (app.jeu.directeur?.public && app.jeu.directeur.nom ? app.jeu.directeur.nom : 'Directeur anonyme');

// ---------- La garnison publiée ----------
// Une écriture quand elle change, au plus toutes les 5 minutes (comme le Grand Tableau).

const PUBLIER_APRES = 5 * 60_000;
let publiee = '';
let publieeLe = 0;
let minuteur: number | undefined;

export function planifierGarnison(delai = 5000) {
  if (!app.compte || !app.uid || J.strateVaincue(app.jeu) < J.PILLAGE.strateMin) return;
  clearTimeout(minuteur);
  minuteur = window.setTimeout(publierGarnison, Math.max(delai, publieeLe + PUBLIER_APRES - Date.now()));
}

async function publierGarnison() {
  const uid = app.uid;
  if (!app.compte || !uid) return;
  const g = J.garnisonDe(app.jeu);
  const nom = nomPublic();
  const cle = JSON.stringify([nom, g]);
  if (cle === publiee) return;
  publieeLe = Date.now();
  try {
    await (await reseau()).publierGarnison(uid, { ...g, nom, force: J.forceGarnison(g), maj: Date.now() });
    publiee = cle;
  } catch { /* règles pas encore publiées, ou hors ligne : on réessaiera au prochain changement */ }
}

// ---------- Les archipels des autres directeurs ----------

/** Relus au plus toutes les 10 minutes en ouvrant la carte (une douzaine de lectures) */
const RELIRE_APRES = 10 * 60_000;
let luesLe = 0;

/** Une garnison qu'on sait jouer : des Porteurs et des cartes que ce jeu connaît */
function jouable(g: J.Garnison): boolean {
  try {
    for (const p of g.porteurs) porteurDef(p.id);
    return J.forceGarnison(g) > 0;
  } catch {
    return false;
  }
}

export async function lireCiblesEnLigne(force = false) {
  const uid = app.uid;
  if (!app.compte || !uid || (!force && Date.now() - luesLe < RELIRE_APRES)) return;
  luesLe = Date.now();
  const f = J.forceEscouade(app.jeu, J.escouadePourDepart(app.jeu));
  try {
    D.pillagesEnLigne = await (await reseau()).lireCibles(uid, f * J.PILLAGE.ecartMin, f * J.PILLAGE.ecartMax, jouable);
    if (app.mode === 'district' && D.vue === 'pillages') afficher();
  } catch { /* règles pas encore publiées, ou hors ligne : archipels sans directeur seulement */ }
}

/** Avant d'attaquer un vrai directeur : est-il sous bouclier ? (null si on ne peut pas le savoir) */
export async function sousBouclier(c: J.Cible): Promise<boolean | null> {
  if (c.bot || !app.compte) return false;
  try {
    const subis = await (await reseau()).lireSubis(c.id, Date.now() - 24 * 3_600_000);
    return J.protege(subis, Date.now());
  } catch {
    return null;
  }
}

// ---------- Les pillages envoyés et subis ----------

/** Envoie les pillages joués contre de vrais directeurs ; ceux qui échouent repartiront plus tard */
export async function envoyerPillages() {
  const uid = app.uid;
  const etat = app.jeu.pillage;
  if (!app.compte || !uid || !etat?.aEnvoyer.length) return;
  const n = await reseau();
  for (const p of [...etat.aEnvoyer]) {
    try {
      await n.envoyerPillage(uid, nomPublic(), p);
      etat.aEnvoyer = etat.aEnvoyer.filter((x) => x !== p);
    } catch (e) {
      const refuse = (e as { code?: string })?.code === 'permission-denied';
      // le coffre du défenseur a fondu depuis (les règles refusent un vol de plus d'un dixième) : la victoire part sans vol ;
      // trop vieux (plus de deux jours hors ligne) : on l'abandonne
      if (refuse && p.vol > 0) p.vol = 0;
      else if (Date.now() - p.le > 48 * 3_600_000) etat.aEnvoyer = etat.aEnvoyer.filter((x) => x !== p);
    }
  }
}

/** À l'ouverture : les attaques subies pendant l'absence, ajoutées au résumé « Pendant ton absence ». Renvoie vrai si la partie a changé */
export async function recevoirPillages(): Promise<boolean> {
  const uid = app.uid;
  if (!app.compte || !uid) return false;
  try {
    const n = await reseau();
    const avant = Date.now() - 48 * 3_600_000;
    const lignes = J.subirPillages(app.jeu, await n.lireSubis(uid, avant));
    n.nettoyerSubis(uid, avant).catch(() => {});
    if (!lignes.length) return false;
    D.retour = [...D.retour, ...lignes];
    if (app.mode === 'district') afficher();
    return true;
  } catch {
    return false;
  }
}
