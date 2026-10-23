// Le Grand Tableau en ligne : chaque directeur publie une entrée `classement/{uid}`, et lit celles des autres.
// Les pseudos sont réservés dans `pseudos/{clé}` (une fiche par pseudo, à un seul compte) : c'est ce qui les rend uniques,
// même si deux joueurs valident le même nom à la même seconde. Chargé avec compte.ts (import dynamique).
// Les règles (firestore.rules) n'acceptent que sa propre entrée, avec le pseudo qu'on a réservé, des bornes plausibles,
// une profondeur qui ne redescend jamais et une publication toutes les 20 secondes au plus.

import { collection, deleteDoc, doc, getDocs, getFirestore, limit, query, runTransaction, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { clePseudo, type Entree } from '../core/classements';

const db = () => getFirestore(getApp());

/** Les champs publiés (l'uid est l'identifiant du document) */
type Publie = Omit<Entree, 'uid'>;

export async function publier(e: Entree): Promise<void> {
  const { uid, ...champs } = e;
  const d: Publie = champs;
  await setDoc(doc(db(), 'classement', uid), d);
}

export async function retirer(uid: string): Promise<void> {
  await deleteDoc(doc(db(), 'classement', uid));
}

/** Le pseudo est déjà pris par un autre joueur */
export class PseudoPris extends Error {}

/**
 * Réserve un pseudo pour ce joueur, et libère l'ancien, en une seule fois (transaction).
 * Sans effet si le pseudo est déjà à lui. Lève PseudoPris s'il appartient à quelqu'un d'autre.
 */
export async function reserver(uid: string, nom: string, ancien: string | null): Promise<void> {
  const cle = clePseudo(nom);
  const cleAncienne = ancien ? clePseudo(ancien) : null;
  await runTransaction(db(), async (t) => {
    const ref = doc(db(), 'pseudos', cle);
    const deja = await t.get(ref);
    const vieux = cleAncienne && cleAncienne !== cle ? await t.get(doc(db(), 'pseudos', cleAncienne)) : null;
    if (deja.exists() && deja.data().uid !== uid) throw new PseudoPris(nom);
    if (deja.exists()) {
      // le même pseudo, écrit autrement (« bryan » → « Bryan ») : on garde la fiche, avec la nouvelle écriture
      if (deja.data().nom !== nom) t.update(ref, { nom });
    } else t.set(ref, { uid, nom, le: Date.now() });
    if (vieux?.exists() && vieux.data().uid === uid) t.delete(vieux.ref);
  });
}

/** Toutes les entrées (la bêta compte quelques dizaines de directeurs ; au-delà, passer à des requêtes triées et indexées) */
export async function lire(): Promise<Entree[]> {
  const snap = await getDocs(query(collection(db(), 'classement'), limit(500)));
  const l: Entree[] = [];
  snap.forEach((s) => {
    const d = s.data() as Partial<Publie>;
    if (typeof d.nom !== 'string' || typeof d.profondeur !== 'number' || typeof d.registre !== 'number') return;
    l.push({
      uid: s.id, nom: d.nom, cle: d.cle ?? clePseudo(d.nom), porteur: typeof d.porteur === 'string' ? d.porteur : 'ilka',
      profondeur: d.profondeur, profondeurLe: d.profondeurLe ?? 0, registre: d.registre, decouvertes: d.decouvertes ?? 0,
      semaine: d.semaine ?? 0, profondeurSemaine: d.profondeurSemaine ?? 0, registreSemaine: d.registreSemaine ?? 0, maj: d.maj ?? 0,
    });
  });
  return l;
}
