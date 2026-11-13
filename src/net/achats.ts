// Les achats en euros (11 novembre 2026) : ce que le compte a acquis, et l'ouverture de la page de paiement.
// - `achats/{uid}` : { droits: ['recit-ilka', …] }. Écrit par le serveur seulement, une fois le paiement confirmé
//   (functions/index.js, webhook Stripe) ; le joueur le lit, ne l'écrit jamais (firestore.rules).
// - `creerPaiement` : la fonction serveur qui prépare la page de paiement Stripe et renvoie son adresse.
// Chargé à la demande (import dynamique), après compte.ts qui initialise Firebase.

import { getApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { REGION_FONCTIONS } from './vente';

/** Les droits acquis par ce compte (liste vide : rien acheté) */
export async function lireAchats(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(getFirestore(getApp()), 'achats', uid));
  const droits = snap.exists() ? (snap.data() as { droits?: unknown }).droits : [];
  return Array.isArray(droits) ? droits.filter((d): d is string => typeof d === 'string') : [];
}

/** Prépare le paiement d'un produit (src/core/produits.ts) et renvoie l'adresse de la page de paiement.
 *  `retour` : l'adresse du jeu, où Stripe ramène le joueur ensuite. */
export async function ouvrirPaiement(produit: string, retour: string, langue: string): Promise<string> {
  const creer = httpsCallable<{ produit: string; retour: string; langue: string; renonce: true }, { url: string }>(
    getFunctions(getApp(), REGION_FONCTIONS), 'creerPaiement');
  // renonce : la case du droit de rétractation, cochée dans le jeu (le serveur refuse sans elle)
  const r = await creer({ produit, retour, langue, renonce: true });
  if (!r.data?.url) throw new Error('paiement-sans-adresse');
  return r.data.url;
}
