// Le parrainage en ligne (29 octobre 2026). Deux collections, rien de plus :
// - `parrains/{code}` : à qui est ce code (uid), et le pseudo à afficher au filleul. Une fiche par code, comme les pseudos :
//   deux joueurs ne peuvent pas avoir le même.
// - `recrues/{uid du filleul}` : son parrain (une seule fois, définitif), son pseudo et les paliers qu'il a atteints.
//   Le parrain les lit avec une requête sur son uid, et en tire ses récompenses (src/core/partie/parrainage.ts).
// Les règles (firestore.rules) : un seul parrain par compte, jamais soi-même, des paliers qui ne font que s'ajouter.
// Chargé avec compte.ts (import dynamique).

import { collection, doc, getDoc, getDocs, getFirestore, limit, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { codeDe, PARRAINAGE, type PalierId, type Recrue } from '../core/jeu';

const db = () => getFirestore(getApp());
const PALIERS = PARRAINAGE.paliers.map((p) => p.id) as string[];

/** Le code n'existe pas, ou c'est le sien : messages pour le joueur */
export class CodeRefuse extends Error {}

/**
 * Réserve le code de ce compte (ou le retrouve) et met son pseudo à jour. Le code vient de l'uid ; s'il est déjà pris
 * par un autre compte (rarissime), on essaie le suivant.
 */
export async function monCode(uid: string, nom: string, connu?: string): Promise<string> {
  const essais = connu ? [connu] : [];
  for (let sel = 0; sel < 6; sel++) essais.push(codeDe(uid, sel));
  for (const code of essais) {
    const ok = await runTransaction(db(), async (t) => {
      const ref = doc(db(), 'parrains', code);
      const d = await t.get(ref);
      if (d.exists()) {
        if (d.data().uid !== uid) return false;
        if (d.data().nom !== nom) t.update(ref, { nom });
        return true;
      }
      t.set(ref, { uid, nom, le: Date.now() });
      return true;
    });
    if (ok) return code;
  }
  throw new Error('code');
}

/** Le parrain d'un code (null s'il n'existe pas) */
export async function lireParrain(code: string): Promise<{ uid: string; nom: string } | null> {
  const d = await getDoc(doc(db(), 'parrains', code));
  if (!d.exists()) return null;
  const x = d.data() as { uid?: unknown; nom?: unknown };
  return typeof x.uid === 'string' ? { uid: x.uid, nom: typeof x.nom === 'string' ? x.nom : 'Un directeur' } : null;
}

/** Devient la recrue de ce parrain (une seule fois : les règles refusent un second parrain) */
export async function rejoindre(uid: string, code: string, parrain: string, nom: string): Promise<void> {
  if (parrain === uid) throw new CodeRefuse('C’est ton propre code.');
  const ref = doc(db(), 'recrues', uid);
  const deja = await getDoc(ref);
  if (deja.exists()) throw new CodeRefuse('Ce compte a déjà un parrain.');
  const le = Date.now();
  await setDoc(ref, { parrain, code, nom, paliers: [], le, maj: le });
}

/** Publie les paliers atteints (ils s'ajoutent à ceux déjà publiés) et le pseudo du moment */
export async function publierPaliers(uid: string, nom: string, paliers: PalierId[]): Promise<void> {
  const ref = doc(db(), 'recrues', uid);
  const d = await getDoc(ref);
  if (!d.exists()) return;
  const avant = ((d.data().paliers ?? []) as string[]).filter((p) => PALIERS.includes(p));
  const tous = PALIERS.filter((p) => avant.includes(p) || paliers.includes(p as PalierId));
  await updateDoc(ref, { paliers: tous, nom, maj: Date.now() });
}

/** Les recrues de ce parrain, dans l'ordre d'arrivée */
export async function lireRecrues(uid: string): Promise<(Recrue & { le: number })[]> {
  const snap = await getDocs(query(collection(db(), 'recrues'), where('parrain', '==', uid), limit(100)));
  const l: (Recrue & { le: number })[] = [];
  snap.forEach((s) => {
    const d = s.data() as { nom?: unknown; paliers?: unknown; le?: unknown };
    const paliers = (Array.isArray(d.paliers) ? d.paliers : []).filter((p): p is PalierId => PALIERS.includes(p as string));
    l.push({ uid: s.id, nom: typeof d.nom === 'string' ? d.nom : 'Une recrue', paliers, le: typeof d.le === 'number' ? d.le : 0 });
  });
  return l.sort((a, b) => a.le - b.le);
}
