// La vente des Récits des origines (11 novembre 2026).
// Tant que VENTE_OUVERTE est faux, rien ne change pour le joueur : les récits restent ouverts à tous, en aperçu.
// Pour ouvrir la vente (docs/paiement.md) : le serveur de paiement est déployé (functions/), la règle `achats` est publiée
// dans la console Firebase, un achat d'essai est passé ; alors seulement, mettre vrai ici et pousser.

export const VENTE_OUVERTE = false;

/** la région des fonctions serveur (functions/index.js) */
export const REGION_FONCTIONS = 'europe-west1';

/** En développement seulement (jamais sur le jeu publié) : « ?vente » montre le jeu comme si la vente était ouverte,
 *  et « ?vente=ilka,doran » comme si ces récits étaient acquis. Sert aux captures et aux essais. */
export function venteEssai(): { ouverte: boolean; achats: string[] } | null {
  if (!import.meta.env.DEV) return null;
  const v = new URLSearchParams(location.search).get('vente');
  return v === null ? null : { ouverte: true, achats: v ? v.split(',').map((r) => `recit-${r}`) : [] };
}
