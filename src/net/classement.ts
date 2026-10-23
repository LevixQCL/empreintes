// Le Grand Tableau en ligne : chaque directeur publie une entrée `classement/{uid}`, et lit celles des autres.
// Chargé avec compte.ts (import dynamique), seulement si Firebase est configuré.
// Les règles (firestore.rules) n'acceptent que sa propre entrée, des champs connus, des bornes plausibles,
// une profondeur qui ne redescend jamais et une publication toutes les 20 secondes au plus.

import { collection, deleteDoc, doc, getDocs, getFirestore, limit, query, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import type { Entree } from '../core/classements';

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

/** Toutes les entrées (la bêta compte quelques dizaines de directeurs ; au-delà, passer à des requêtes triées et indexées) */
export async function lire(): Promise<Entree[]> {
  const snap = await getDocs(query(collection(db(), 'classement'), limit(500)));
  const l: Entree[] = [];
  snap.forEach((s) => {
    const d = s.data() as Partial<Publie>;
    if (typeof d.nom !== 'string' || typeof d.profondeur !== 'number' || typeof d.registre !== 'number') return;
    l.push({
      uid: s.id, nom: d.nom, porteur: typeof d.porteur === 'string' ? d.porteur : 'ilka',
      profondeur: d.profondeur, profondeurLe: d.profondeurLe ?? 0, registre: d.registre, decouvertes: d.decouvertes ?? 0,
      semaine: d.semaine ?? 0, profondeurSemaine: d.profondeurSemaine ?? 0, registreSemaine: d.registreSemaine ?? 0, maj: d.maj ?? 0,
    });
  });
  return l;
}
