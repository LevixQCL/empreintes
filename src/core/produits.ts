// Ce qui se vend en euros (11 novembre 2026, document « Ossyra — Monétisation ») : les Récits des origines, à l'unité ou les trois.
// Les prix sont en centimes. Le serveur a sa propre copie (functions/produits.json) : c'est elle qui fait foi au moment de payer,
// et tests/produits.test.ts vérifie que les deux disent la même chose.
// Un achat donne des « droits » (un par récit), inscrits sur le compte par le serveur une fois le paiement confirmé
// (achats/{uid} dans Firestore, que le joueur lit mais n'écrit jamais).

import { locale } from './i18n';

export interface Produit {
  /** en centimes d'euro */
  prix: number;
  /** les droits que l'achat inscrit sur le compte */
  droits: string[];
}

const RECITS_VENDUS = ['ilka', 'doran', 'vela'] as const;
/** le droit de lire un récit et d'en garder la carte d'origine */
export const droitRecit = (recit: string): string => `recit-${recit}`;
/** le lot des trois récits */
export const LOT_RECITS = 'recits-trio';

export const PRODUITS: Record<string, Produit> = {
  ...Object.fromEntries(RECITS_VENDUS.map((r) => [droitRecit(r), { prix: 299, droits: [droitRecit(r)] }])),
  [LOT_RECITS]: { prix: 599, droits: RECITS_VENDUS.map(droitRecit) },
};

/** Le droit au Fond (−11 à −15), qu'inscrira le pack Ossyra (12 novembre 2026) : pas encore en vente ; le compte
 *  d'administration l'a pour tester */
export const DROIT_FOND = 'fond-ossyra';

/** Ce récit est-il acquis sur ce compte ? */
export const aRecit = (achats: readonly string[], recit: string): boolean => achats.includes(droitRecit(recit));

/** Le lot n'est proposé que tant qu'aucun des trois récits n'est acquis : après, les récits restants coûtent moins cher à l'unité */
export const lotProposable = (achats: readonly string[]): boolean => !RECITS_VENDUS.some((r) => aRecit(achats, r));

/** « 2,99 € » en français, « €2.99 » en anglais */
export const prixEuros = (centimes: number): string =>
  new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }).format(centimes / 100);
