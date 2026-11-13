// Couche 5 — l'Exode (10 novembre 2026, validé par Bryan) : le grand projet du district une fois le fond atteint.
// La Clause de la Flèche dit que le district dont l'escouade tient le sommet au passage d'une île y est reçu ; le Noyé avait
// ajouté en marge : « Pas les nôtres. Tout le monde. » L'Exode prépare tout le district à ce passage.
// - il s'ouvre une fois le gardien de la Strate −10 vaincu et la Tour du Noyau au niveau 10 : c'est là que les cristaux et les
//   Éclats n'avaient plus d'usage (audit du 10 novembre 2026 : 2 500 à 4 000 cristaux taillés par jour, ~15 Éclats) ;
// - cinq chantiers de dix étapes, une étape à la fois (un prix, un temps, comme un chantier de bâtiment) ;
// - le dernier chantier, le Passage, demande le sommet de la Flèche : elle donne le droit de passer, l'Exode prépare les gens ;
// - ensuite, sans fin : des convois qui font passer des familles des cuvettes voisines.
// Rien ne se perd et rien ne se dégrade si on ne joue pas : une étape lancée se termine seule, la suivante attend.

import { FLECHE } from '../classements';
import { gagnerPerles } from './perles';
import { log, non, strateVaincue, type Jeu, type Resultat } from './etat';
import { t as tr } from '../i18n';

export const EXODE = {
  /** ce qu'il faut pour l'ouvrir : le gardien de cette Strate vaincu, et la Tour du Noyau à ce niveau */
  strate: 10,
  noyau: 10,
  /** étapes par chantier */
  etapes: 10,
  /** le prix d'une étape (n : de 0 à 49) : 670 cristaux et 5 Éclats la première, 4 590 et 30 la dernière.
   *  13 novembre 2026 (validé par Bryan) : un tiers de moins qu'au 10 novembre. Avec le Fond fermé au jeu gratuit, l'ancien barème
   *  (197 000 cristaux) durait environ 100 jours pour un occasionnel ; `npx tsx scripts/exode.ts` donne la durée. */
  cristaux: { base: 670, parEtape: 80 },
  eclats: { base: 5, parEtape: 0.5 },
  /** la durée d'une étape, en heures : de la première à la dernière */
  heures: { debut: 2, fin: 12 },
  /** ceux qu'une étape inscrit au départ : 50 étapes, tout le district */
  habitantsParEtape: 12,
  /** un convoi, une fois les cinq chantiers finis : deux à trois jours de surplus, dix familles des cuvettes voisines */
  convoi: { cristaux: 5300, eclats: 40, heures: 12, familles: 10 },
} as const;

export interface ChantierExode { id: string; nom: string; texte: string; fini: string }
/** Les cinq chantiers, dans l'ordre */
export const CHANTIERS_EXODE: ChantierExode[] = [
  { id: 'registre', nom: tr('Le Registre'), texte: tr('On recense toutes les familles du district, rue par rue, sans en oublier une.'),
    fini: tr('Le Registre est clos : chaque famille du district y a son nom.') },
  { id: 'pontons', nom: tr('Les Pontons'), texte: tr('La digue s’ouvre vers la mer : des pontons où tout un district pourra embarquer.'),
    fini: tr('Les Pontons tiennent : la digue a désormais une porte sur la mer.') },
  { id: 'barges', nom: tr('Les Barges'), texte: tr('On construit de quoi transporter tout le monde jusqu’au pied de la Flèche.'),
    fini: tr('Les Barges sont à flot : il y a une place à bord pour chacun.') },
  { id: 'place', nom: tr('La Place là-haut'), texte: tr('Des abris et des jardins à monter sur l’île : la réponse à ceux qui disent qu’une île ne porte pas une vie de plus.'),
    fini: tr('La Place là-haut est prête : des abris et des jardins attendent d’être montés.') },
  { id: 'passage', nom: tr('Le Passage'), texte: tr('Le jour où l’île passe, tout le district monte. Il faut tenir le sommet de la Flèche.'),
    fini: tr('L’île est passée : tout le district est monté. Toi, tu restes, pour mener les convois des cuvettes voisines.') },
];
/** Le nombre d'étapes des cinq chantiers */
export const ETAPES_EXODE = CHANTIERS_EXODE.length * EXODE.etapes;

/** L'état du joueur ; absent tant que l'Exode n'est pas ouvert */
export interface EtatExode {
  /** étapes terminées (0 à 50) */
  etape: number;
  /** l'étape ou le convoi en cours se termine à cette heure */
  fin?: number;
  /** quand elle a été lancée (pour la jauge) */
  debut?: number;
  /** convois partis, une fois les cinq chantiers finis */
  convois: number;
  /** la présentation a été lue */
  vu?: boolean;
}

/** Le gardien de −10 est tombé : l'Exode se montre (il s'ouvre quand la Tour suit) */
export const exodeVisible = (j: Jeu) => strateVaincue(j) >= EXODE.strate;
export const exodeOuvert = (j: Jeu) => exodeVisible(j) && j.batiments.noyau >= EXODE.noyau;
export const etatExode = (j: Jeu): EtatExode => (j.exode ??= { etape: 0, convois: 0 });

const dizaine = (n: number) => Math.round(n / 10) * 10;
/** Le prix et la durée de l'étape n (de 0 à 49) */
export function etapeExode(n: number): { cristaux: number; eclats: number; heures: number } {
  const k = Math.min(ETAPES_EXODE - 1, Math.max(0, n));
  return {
    cristaux: dizaine(EXODE.cristaux.base + k * EXODE.cristaux.parEtape),
    eclats: Math.round(EXODE.eclats.base + k * EXODE.eclats.parEtape),
    heures: Math.round(EXODE.heures.debut + (k * (EXODE.heures.fin - EXODE.heures.debut)) / (ETAPES_EXODE - 1)),
  };
}

/** Où en est le projet : le chantier en cours, l'étape dans ce chantier, et ce que coûte la suite */
export function avancementExode(j: Jeu) {
  const x = j.exode ?? { etape: 0, convois: 0 };
  const fini = x.etape >= ETAPES_EXODE;
  const chantier = Math.min(CHANTIERS_EXODE.length - 1, Math.floor(x.etape / EXODE.etapes));
  const cout = fini ? { cristaux: EXODE.convoi.cristaux, eclats: EXODE.convoi.eclats, heures: EXODE.convoi.heures } : etapeExode(x.etape);
  return {
    fini, chantier, def: CHANTIERS_EXODE[chantier]!, cout,
    /** étapes faites dans le chantier en cours (10 quand tout est fini) */
    dans: fini ? EXODE.etapes : x.etape % EXODE.etapes,
    enCours: x.fin !== undefined,
    habitants: Math.min(ETAPES_EXODE, x.etape) * EXODE.habitantsParEtape,
    habitantsMax: ETAPES_EXODE * EXODE.habitantsParEtape,
    familles: x.convois * EXODE.convoi.familles,
    convois: x.convois,
  };
}

/** Le sommet de la Flèche est tenu (il le faut pour le Passage) */
export const sommetTenu = (j: Jeu) => (j.fleche?.record ?? 0) >= FLECHE.quais;

/** Ce qui empêche de lancer la suite (null : on peut) */
export function raisonExode(j: Jeu): string | null {
  if (!exodeVisible(j)) return tr`L’Exode se décidera quand le gardien de la Strate −${EXODE.strate} sera tombé.`;
  if (!exodeOuvert(j)) return tr`Un projet pareil se dirige depuis une Tour du Noyau au niveau ${EXODE.noyau} : il lui faut toute sa hauteur pour voir la mer et la Flèche à la fois.`;
  const a = avancementExode(j);
  if (a.enCours) return a.fini ? tr('Un convoi est déjà en route.') : tr('Une étape est déjà en cours.');
  if (!a.fini && a.chantier === CHANTIERS_EXODE.length - 1 && !sommetTenu(j))
    return tr`Le Passage se prépare depuis le sommet de la Flèche : ton escouade doit avoir atteint le quai ${FLECHE.quais}.`;
  if (j.energie < a.cout.cristaux || j.eclats < a.cout.eclats) return tr('Pas assez de cristaux ou d’Éclats.');
  return null;
}

/** Lance l'étape suivante, ou un convoi une fois les cinq chantiers finis */
export function lancerExode(j: Jeu, now = j.dernierTick): Resultat {
  const raison = raisonExode(j);
  if (raison) return non(raison);
  const a = avancementExode(j);
  const x = etatExode(j);
  j.energie -= a.cout.cristaux;
  j.eclats -= a.cout.eclats;
  x.debut = now;
  x.fin = now + a.cout.heures * 3_600_000;
  const message = a.fini ? tr('Un convoi se prépare aux Pontons.') : tr`${a.def.nom} : l’étape ${a.dans + 1} sur ${EXODE.etapes} est lancée.`;
  log(j, message);
  return { ok: true, message };
}

/** Le temps passe : l'étape ou le convoi en cours se termine. Un chantier fini donne une Perle de nacre (13 novembre 2026 :
 *  plus de carte de nacre au choix, pour que la nacre reste rare). */
export function avancerExode(j: Jeu, now: number): string[] {
  const x = j.exode;
  if (!x || x.fin === undefined || now < x.fin) return [];
  delete x.fin; delete x.debut;
  if (x.etape >= ETAPES_EXODE) {
    x.convois++;
    const m = tr`Le convoi est passé : ${EXODE.convoi.familles} familles des cuvettes voisines ont embarqué.`;
    log(j, m);
    return [m];
  }
  x.etape++;
  if (x.etape % EXODE.etapes) return [tr`L’Exode avance : ${EXODE.habitantsParEtape} habitants de plus sont prêts à partir.`];
  const def = CHANTIERS_EXODE[x.etape / EXODE.etapes - 1]!;
  log(j, def.fini);
  return [def.fini, gagnerPerles(j, 1, def.nom)];
}

/** Sur la carte du district : une étape peut être lancée, ou une est en cours */
export function bulleExode(j: Jeu): { pret: boolean; enCours: boolean } {
  if (!exodeOuvert(j)) return { pret: false, enCours: false };
  return { pret: raisonExode(j) === null, enCours: j.exode?.fin !== undefined };
}
