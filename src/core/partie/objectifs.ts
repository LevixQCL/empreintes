// Les objectifs guidés.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { moduleDe } from '../donnees';
import type { BatimentId } from '../types';
import { type Jeu, type Resultat, creuseursRequis, log, non, posteDe, stockage } from './etat';
import { creuser, gagnerCreuseurs } from './district';
import { escouadeDe } from './descentes';

// ---------- Objectifs guidés ----------

export interface Objectif {
  /** identifiant stable (l'interface s'en sert pour savoir quel onglet signaler) */
  id: 'district' | 'deck' | 'descendre' | 'creuseurs';
  titre: string;
  consigne: string;
  /** le bâtiment à signaler sur le district (null : l'objectif se fait ailleurs) */
  pilier: BatimentId | null;
  /** l'onglet du bas à signaler */
  onglet: 'archipel' | 'cartes' | 'coupe' | 'porteurs';
  recompense: { energie?: number; composants?: number; creuseurs?: number };
  fait: (j: Jeu) => boolean;
}

// Revus le 23 octobre 2026 après les grands changements (Mon escouade, les postes quittés au départ,
// l'exploration salle par salle et les creuseurs). Chaque objectif apprend une chose, dans l'ordre où on en a besoin :
// produire sans bloquer l'escouade, construire le deck, descendre, puis comprendre ce qui ouvre l'étage suivant.
export const OBJECTIFS: Objectif[] = [
  {
    id: 'district', titre: 'Allumer le district', pilier: 'generateur', onglet: 'archipel',
    consigne: 'Touche le Générateur et postes-y le Coursier, une recrue augmentée : il y produit deux fois plus. Garde Ilka, Doran et Véla pour l’escouade : en descendant, ils quitteraient leur poste.',
    recompense: { energie: 60 },
    fait: (j) => { const p = posteDe(j, 'generateur'); return !!p && !escouadeDe(j).includes(p); },
  },
  {
    id: 'deck', titre: 'Construire ton deck', pilier: null, onglet: 'cartes',
    consigne: 'Ouvre tes Cartes et confie l’Œil-relais, trouvé dans la chambre, à Ilka. Elle porte déjà 6 cartes : retires-en une. Les cartes de tes trois Porteurs forment ton deck.',
    recompense: { composants: 10 },
    fait: (j) => j.porteurs.ilka!.modules.some((k) => moduleDe(k) === 'oeil-relais'),
  },
  {
    id: 'descendre', titre: 'Vaincre la Strate −1', pilier: 'noyau', onglet: 'coupe',
    consigne: 'Ton escouade est prête (onglet Porteurs). Entre dans la Tour du Noyau et explore la Strate −1 salle par salle, jusqu’à son gardien.',
    recompense: { composants: 20 },
    fait: (j) => j.strate >= 2 || j.frontVaincu,
  },
  {
    id: 'creuseurs', titre: 'Trouver des creuseurs', pilier: 'noyau', onglet: 'coupe',
    consigne: `Pour percer la Strate −2, il faut ${creuseursRequis(2)} creuseurs : le gardien t’en a amené un. Dans la Tour, envoie une recrue en mission dans la Strate −1 : des volontaires suivront.`,
    recompense: { composants: 10, creuseurs: 1 },
    fait: (j) => j.strate >= 2 || j.missions.length > 0,
  },
];

export const objectifCourant = (j: Jeu): Objectif | null => (j.chambre ? OBJECTIFS[j.objectif] ?? null : null);

/** Récupère la récompense de l'objectif en cours s'il est rempli */
export function reclamer(j: Jeu): Resultat {
  const o = objectifCourant(j);
  if (!o || !o.fait(j)) return non('Objectif pas encore rempli.');
  j.energie = Math.min(stockage(j), j.energie + (o.recompense.energie ?? 0));
  j.composants += o.recompense.composants ?? 0;
  if (o.recompense.creuseurs && gagnerCreuseurs(j, o.recompense.creuseurs, 'des volontaires rejoignent le chantier')) creuser(j);
  j.objectif++;
  log(j, `Objectif rempli : ${o.titre}.`);
  return { ok: true };
}
