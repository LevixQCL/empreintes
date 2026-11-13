// Le Gardien de la ville, côté réseau (13 novembre 2026). Chargé à la demande, après compte.ts qui initialise Firebase.
// Sans serveur (offre gratuite de Firebase) : chaque directeur écrit sa fiche `gardien/{semaine}/directeurs/{uid}`,
// bornée par firestore.rules, et la jauge de la ville est la somme de toutes les fiches (requêtes d'agrégation :
// une lecture pour mille fiches). Le classement des dégâts (dégâts purs, 13 novembre 2026) lit les 10 premières fiches.
// La Cloud Function `compterFrappes` (functions/gardien.js, qui rejoue les combats) attend en réserve.

import { getApp } from 'firebase/app';
import { collection, count, doc, getAggregateFromServer, getCountFromServer, getDoc, getDocs, getFirestore, limit, orderBy, query, runTransaction, sum, where } from 'firebase/firestore';
import { ficheApres, pvDeLaVille, type FicheGardien, type FrappeGardien, type LigneClassementGardien, type VilleGardien } from '../core/jeu';

const db = () => getFirestore(getApp());
const fiches = (semaine: number) => collection(db(), 'gardien', String(semaine), 'directeurs');

/** Une fiche lue en ligne (les champs manquants valent zéro) */
function ficheDe(d: Record<string, unknown> | undefined): FicheGardien | null {
  if (!d) return null;
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
  return { nom: typeof d.nom === 'string' ? d.nom : null, strate: n(d.strate), parts: n(d.parts), frappes: n(d.frappes), meilleure: n(d.meilleure), degats: n(d.degats), record: n(d.record), dernier: n(d.dernier), maj: n(d.maj) };
}

/** La jauge seule (PV, parts, directeurs) : trois lectures, quel que soit le nombre de directeurs */
export async function jaugeVille(semaine: number): Promise<VilleGardien> {
  const [cette, avant] = await Promise.all([
    getAggregateFromServer(fiches(semaine), { parts: sum('parts'), frappeurs: count() }),
    getCountFromServer(fiches(semaine - 1)),
  ]);
  const a = cette.data();
  return { semaine, pv: pvDeLaVille(avant.data().count), parts: Math.round((a.parts ?? 0) * 10) / 10, frappeurs: a.frappeurs };
}

/** La jauge, le classement des 10 premiers et le rang de ce directeur */
export async function lireVille(semaine: number, uid: string): Promise<VilleGardien> {
  const [v, top, moi] = await Promise.all([
    jaugeVille(semaine),
    getDocs(query(fiches(semaine), orderBy('degats', 'desc'), limit(10))),
    getDoc(doc(fiches(semaine), uid)),
  ]);
  const classement: LigneClassementGardien[] = top.docs.map((d) => {
    const f = ficheDe(d.data())!;
    return { uid: d.id, nom: f.nom, strate: f.strate, parts: f.parts, frappes: f.frappes, degats: f.degats };
  });
  const mienne = ficheDe(moi.data());
  let rang = 0;
  if (mienne) {
    const i = classement.findIndex((l) => l.uid === uid);
    rang = i >= 0 ? i + 1 : (await getCountFromServer(query(fiches(semaine), where('degats', '>', mienne.degats)))).data().count + 1;
  }
  return { ...v, classement, rang, moi: uid };
}

/** Inscrit une frappe jouée dans la fiche de ce directeur ; rend sa fiche de la semaine (null : frappe déjà comptée ou de trop) */
export async function inscrireFrappe(uid: string, qui: { nom: string | null; strate: number }, frappe: FrappeGardien): Promise<FicheGardien | null> {
  const ref = doc(fiches(frappe.semaine), uid);
  return runTransaction(db(), async (t) => {
    const avant = ficheDe((await t.get(ref)).data());
    const apres = ficheApres(avant, frappe, qui, Date.now());
    if (!apres) return null;
    t.set(ref, apres);
    return apres;
  });
}

/** La fiche déjà inscrite pour ce directeur (après une frappe refusée ou déjà comptée) */
export async function maFiche(semaine: number, uid: string): Promise<FicheGardien> {
  return ficheDe((await getDoc(doc(fiches(semaine), uid))).data()) ?? { nom: null, strate: 1, parts: 0, frappes: 0, meilleure: 0, degats: 0, record: 0, dernier: 0, maj: 0 };
}
