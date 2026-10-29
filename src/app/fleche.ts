// La Flèche en ligne (29 octobre 2026) : la garde qu'on publie quand on tient un quai, les gardiens des autres
// (les plus hauts, ceux à portée), les défis envoyés et subis. Hors ligne (ou règles pas encore publiées), tout échoue sans bruit :
// les quais restent gardés par les gardiens payés des Hauts.

import * as J from '../core/jeu';
import { porteurDef } from '../core/donnees';
import { app, D } from './etat';
import { afficher } from './rendu';
import { nomPublic } from './pillages';

let net: typeof import('../net/fleche') | null = null;
const reseau = async () => (net ??= await import('../net/fleche'));

// ---------- La garde publiée ----------

let publiee = '';

/** Publie la garde si elle a changé, la retire si on ne tient plus de quai */
export async function synchroGarde() {
  const uid = app.uid;
  if (!app.compte || !uid) return;
  const g = app.jeu.fleche?.garde;
  const cle = g ? JSON.stringify([nomPublic(), g.quai, g.depuis, g.garnison]) : '';
  if (cle === publiee) return;
  try {
    const n = await reseau();
    if (g) await n.publierGarde(uid, { nom: nomPublic(), quai: g.quai, force: J.forceGarnison(g.garnison), depuis: g.depuis, garnison: g.garnison });
    else await n.retirerGarde(uid);
    publiee = cle;
  } catch { /* on réessaiera au prochain passage */ }
}

// ---------- Les gardiens de la Flèche ----------

/** Une garnison qu'on sait jouer : des Porteurs que ce jeu connaît, une force qui correspond à ses cartes */
function jouable(g: J.Garnison, force: number): boolean {
  try {
    for (const p of g.porteurs) porteurDef(p.id);
    const f = J.forceGarnison(g);
    return f > 0 && Math.abs(f - force) < 0.01;
  } catch {
    return false;
  }
}

/** Relus en ouvrant l'onglet, au plus toutes les 2 minutes (ou tout de suite après un changement) */
export async function lireGardiensEnLigne(force = false) {
  const uid = app.uid;
  if (!app.compte || !uid || !app.jeu.fleche) return;
  const max = J.quaiMaxTenable(app.jeu);
  if (!force && D.gardiens && D.gardiens.max === max && Date.now() - D.gardiens.lu < 2 * 60_000) return;
  try {
    const r = await (await reseau()).lireGardiens(uid, max, jouable);
    D.gardiens = { ...r, max, lu: Date.now() };
    if (app.mode === 'district' && D.vue === 'fleche') afficher();
  } catch { /* hors ligne, ou règles pas encore publiées */ }
}

/** Le gardien qu'on peut défier : le plus haut à portée, au-dessus du quai qu'on tient */
export const cibleDefi = (): J.GardienQuai | null => J.cibleDefiDe(app.jeu, D.gardiens?.portee ?? []);

// ---------- Les assauts envoyés et subis ----------

export async function envoyerAssauts() {
  const uid = app.uid;
  const f = app.jeu.fleche;
  if (!app.compte || !uid || !f?.aEnvoyer?.length) return;
  const n = await reseau();
  for (const a of [...f.aEnvoyer]) {
    try {
      await n.envoyerAssaut(uid, nomPublic(), a);
      f.aEnvoyer = f.aEnvoyer.filter((x) => x !== a);
    } catch (e) {
      // refusé (le gardien a quitté son quai entre-temps) ou trop vieux : on l'abandonne
      if ((e as { code?: string })?.code === 'permission-denied' || Date.now() - a.le > 48 * 3_600_000) f.aEnvoyer = f.aEnvoyer.filter((x) => x !== a);
    }
  }
  // le gardien battu a disparu, et l'on tient peut-être un nouveau quai
  await synchroGarde();
  lireGardiensEnLigne(true);
}

/** À l'ouverture : les assauts subis sur son quai. Renvoie vrai si la partie a changé */
export async function recevoirAssauts(): Promise<boolean> {
  const uid = app.uid;
  if (!app.compte || !uid || !app.jeu.fleche) return false;
  try {
    const n = await reseau();
    const avant = Date.now() - 48 * 3_600_000;
    const lignes = J.subirAssauts(app.jeu, await n.lireAssauts(uid, avant));
    n.nettoyerAssauts(uid, avant).catch(() => {});
    await synchroGarde();
    if (!lignes.length) return false;
    D.retour = [...D.retour, ...lignes];
    if (app.mode === 'district') afficher();
    return true;
  } catch {
    return false;
  }
}
