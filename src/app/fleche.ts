// La Flèche en ligne (29 octobre 2026) : la garde qu'on publie quand on tient un quai, le directeur qui tient le quai
// d'où l'on monte, les assauts envoyés et subis. Hors ligne (ou règles pas encore publiées), tout échoue sans bruit :
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

// ---------- Le directeur qui tient le quai d'où l'on monte ----------

/** Une garnison qu'on sait jouer, et à la mesure du quai (les Hauts ne confient pas un quai bas à une escouade trop forte) */
function jouable(quai: number) {
  return (g: J.Garnison, force: number) => {
    try {
      for (const p of g.porteurs) porteurDef(p.id);
      const f = J.forceGarnison(g);
      return f > 0 && Math.abs(f - force) < 0.01 && f <= J.mesureQuai(quai) + 0.001;
    } catch {
      return false;
    }
  };
}

/** Relu en ouvrant l'onglet, au plus toutes les 2 minutes pour un même quai */
export async function lireGardienEnLigne(force = false) {
  const uid = app.uid;
  const f = app.jeu.fleche;
  if (!app.compte || !uid || !f || f.garde) return;
  const quai = f.quai;
  if (!force && D.gardienQuai?.quai === quai && Date.now() - D.gardienQuai.lu < 2 * 60_000) return;
  try {
    const g = await (await reseau()).lireGardien(uid, quai, jouable(quai));
    D.gardienQuai = { quai, gardien: g, lu: Date.now() };
    if (app.mode === 'district' && D.vue === 'fleche') afficher();
  } catch { /* hors ligne : les gardiens payés */ }
}

/** Le gardien connu du quai où se tient l'escouade (null : gardiens payés) */
export const gardienActuel = (): J.GardienQuai | null => {
  const q = app.jeu.fleche?.quai;
  return D.gardienQuai && D.gardienQuai.quai === q ? D.gardienQuai.gardien : null;
};

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
  // un gardien délogé ne doit plus être proposé
  D.gardienQuai = null;
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
