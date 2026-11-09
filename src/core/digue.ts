// Les Basses (7 novembre 2026) : le flanc extérieur de la digue, où dorment les quartiers noyés et les familles restées en bas.
// Remplace les pompes du Générateur (Bryan : « toute la partie avec les habitants ne sert à rien, la partie pompage aussi »).
// Audit d'un game designer externe, choix retenus :
// - la vraie marée (cycle de 12 h 25, grandes marées aux nouvelles et pleines lunes) n'est que de l'AMBIANCE : la houle,
//   la bulle de l'écluse, la ligne d'eau des Basses. Aucun gain ne dépend de l'heure à laquelle on joue ;
// - chaque marée basse laisse un dépôt qui attend sans limite de temps (deux au plus) : rien ne se perd ;
// - le vrai choix : le batardeau, qu'on déplace une fois par semaine pour garder un secteur à sec ;
// - chaque lieu d'un secteur à sec cache une famille restée en bas : on envoie un Porteur la chercher.
// Ce fichier ne contient que le contenu et le calcul de la marée (sans état de partie) ; les règles sont dans partie/basses.ts.

/** La marée réelle, la même pour tous les joueurs, calculée sans serveur */
import { t as tr } from './i18n';

export const MAREE_REELLE = {
  /** une marée basse de référence (heure de Bruxelles, nuit du 1er janvier 2026) */
  epoque: Date.UTC(2026, 0, 1, 2, 0),
  /** la période d'une marée semi-diurne : 12 h 25 min 14 s */
  periode: 12.4206 * 3_600_000,
  /** une nouvelle lune de référence, et la durée d'un mois lunaire */
  nouvelleLune: Date.UTC(2000, 0, 6, 18, 14),
  lunaison: 29.530588853 * 86_400_000,
  /** coefficient à partir duquel on parle de grande marée */
  grande: 100,
} as const;

export interface EtatMaree {
  /** 0 = marée basse, 1 = marée haute */
  niveau: number;
  montante: boolean;
  /** coefficient, de 25 (mortes-eaux) à 115 (vives-eaux) */
  coef: number;
  grande: boolean;
  prochaineBasse: number;
  prochaineHaute: number;
}

const M = MAREE_REELLE;
const modulo = (x: number, m: number) => ((x % m) + m) % m;

/** Le numéro de la dernière marée basse passée (sert à compter les dépôts) */
export const indexBasse = (t: number) => Math.floor((t - M.epoque) / M.periode);

/** Le coefficient de la marée : grand aux nouvelles et pleines lunes, petit aux quartiers */
export function coefMaree(t: number): number {
  const phase = modulo(t - M.nouvelleLune, M.lunaison) / M.lunaison;
  return Math.round(70 + 45 * Math.cos(4 * Math.PI * phase));
}

/** L'état de la marée à l'instant t */
export function etatMaree(t: number): EtatMaree {
  const phase = modulo(t - M.epoque, M.periode) / M.periode;
  const niveau = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const debut = t - phase * M.periode;
  const coef = coefMaree(t);
  return {
    niveau, montante: phase < 0.5, coef, grande: coef >= M.grande,
    prochaineBasse: debut + M.periode,
    prochaineHaute: phase < 0.5 ? debut + M.periode / 2 : debut + 1.5 * M.periode,
  };
}

/** Un lieu des Basses : une corniche, une maison, une salle, à une certaine profondeur sur le flanc de la digue */
export interface LieuBasses {
  id: string;
  nom: string;
  /** la profondeur sur le flanc (0 = au ras de la digue, 1 = tout en bas) : sert à l'affichage */
  hauteur: number;
  /** la famille qui y vit encore (familles.ts) */
  famille: string;
  /** ce que le Porteur rapporte en plus de la famille : une trace de ceux qui vivaient là, ou de ceux d'avant */
  trace: string;
}

export interface SecteurBasses {
  id: string;
  nom: string;
  /** la Strate qu'il faut avoir vaincue pour l'atteindre (plus bas sur le flanc, plus ancien) */
  strate: number;
  ambiance: string;
  lieux: LieuBasses[];
}

const L = (id: string, nom: string, hauteur: number, famille: string, trace: string): LieuBasses => ({ id, nom, hauteur, famille, trace });

/** Du haut vers le bas du flanc : plus on descend, plus c'est ancien (comme les Strates) */
export const SECTEURS: readonly SecteurBasses[] = [
  {
    id: 'lavoirs', nom: tr('Les Lavoirs'), strate: 1,
    ambiance: tr('Le premier quartier englouti, au pied de l’écluse. À marée basse, les bacs de pierre affleurent encore, pleins de coquillages.'),
    lieux: [
      L('bac-cordes', tr('Le bac aux cordes'), 0.08, 'pellan', tr('Des cordes à linge tendues sous l’eau, encore chargées de draps que personne n’est venu décrocher.')),
      L('maison-eclusier', tr('La maison de l’éclusier'), 0.12, 'ardoin', tr('Le registre de l’écluse, tenu jusqu’au dernier jour : « Fermée pour la nuit. Rouvrira demain. »')),
      L('passerelle-linge', tr('La passerelle à linge'), 0.16, 'sauvel', tr('Une passerelle où l’on a gravé des tailles d’enfants, chaque trait un peu plus haut que l’eau de l’année.')),
      L('escalier-blanchisseuses', tr('L’escalier des blanchisseuses'), 0.2, 'lunel', tr('Sous la dernière marche, une boîte de savon pleine de boutons dépareillés, rangés par couleur.')),
    ],
  },
  {
    id: 'treuils', nom: tr('La Rue des Treuils'), strate: 3,
    ambiance: tr('Les ateliers qui hissaient les pierres de la digue. Les grues dorment couchées dans la vase, bras tendus vers le haut.'),
    lieux: [
      L('atelier-chaines', tr('L’atelier des chaînes'), 0.28, 'kerval', tr('Un tableau de commandes au crayon gras : « Chaînes pour la digue, quatrième anneau. Payées en nature. »')),
      L('grue-couchee', tr('La grue couchée'), 0.32, 'mirande', tr('Dans la cabine de la grue, un poste de radio réglé sur une fréquence qui n’émet plus que de la mer.')),
      L('forge-froide', tr('La forge froide'), 0.36, 'ibarre', tr('Une enclume marquée d’un sigle de chantier que personne au district ne reconnaît, plus vieux que la digue.')),
      L('cabine-pontier', tr('La cabine du pontier'), 0.4, 'nalis', tr('Un plan de la digue où l’on a entouré, au crayon rouge, un endroit sous l’anneau marqué « ne pas creuser ».')),
    ],
  },
  {
    id: 'ecole', nom: tr('L’École noyée'), strate: 5,
    ambiance: tr('L’école du quartier bas. Le préau s’est effondré, la cloche est restée accrochée, et sonne seule les nuits de houle.'),
    lieux: [
      L('preau', tr('Le préau'), 0.48, 'haudry', tr('Une marelle peinte au sol, intacte sous un doigt de sable, la case du ciel juste à la ligne d’eau.')),
      L('classe-haute', tr('La classe du haut'), 0.52, 'prevel', tr('Au tableau, une leçon jamais effacée : « La mer monte de trois centimètres par an. Calcule dans cent ans. »')),
      L('bibliotheque-ecole', tr('La bibliothèque de l’école'), 0.56, 'casset', tr('Des livres séchés un à un, pages raides, rangés par ordre de ceux qui les avaient empruntés.')),
      L('cour-cloche', tr('La cour de la cloche'), 0.6, 'berot', tr('La corde de la cloche descend dans un trou du sol, plus profond qu’une cave, d’où monte un air tiède.')),
    ],
  },
  {
    id: 'citernes', nom: tr('Les Citernes'), strate: 7,
    ambiance: tr('Sous les quartiers bas, des réservoirs voûtés que la digue a recouverts. Ceux qui les ont creusés n’ont laissé aucun nom.'),
    lieux: [
      L('citerne-seche', tr('La citerne sèche'), 0.68, 'tessier', tr('Des marches taillées trop hautes pour un pas d’homme, polies au milieu comme par des siècles de passages.')),
      L('galerie-voutes', tr('La galerie des voûtes'), 0.72, 'okane', tr('Des voûtes sans joint, d’une seule pierre, avec ce même éclat bleu que les cristaux des Strates.')),
      L('chambre-vannes', tr('La chambre des vannes'), 0.76, 'varenne', tr('Des vannes d’un métal qui ne rouille pas, réglées sur une marée qui ne correspond à aucune d’aujourd’hui.')),
      L('puisard', tr('Le puisard'), 0.8, 'aumont', tr('Au fond du puisard, des empreintes de mains dans la pierre, à hauteur d’enfant, tournées vers le bas.')),
    ],
  },
  {
    id: 'palier', nom: tr('Le Palier'), strate: 9,
    ambiance: tr('Tout en bas du flanc, sous l’anneau de la digue : l’escalier de ta première Halte, pris par son autre bout. Il passe sous la Cuvette et ressort ici, dehors, à la mer.'),
    lieux: [
      L('premieres-marches', tr('Les premières marches'), 0.86, 'roustan', tr('Les marches descendent sous la Cuvette. La digue a été posée dessus comme un couvercle, sans que personne le sache.')),
      L('niche-lampes', tr('La niche aux lampes'), 0.9, 'falgue', tr('Des lampes de pierre qui s’allument quand on approche, de la même lueur que le pouls de la lampe du phare couché.')),
      L('palier-graves', tr('Le palier gravé'), 0.94, 'demare', tr('Des milliers d’empreintes digitales gravées au mur, une par personne, comme un registre. Il reste de la place en bas du mur.')),
      L('seuil', tr('Le seuil'), 0.98, 'veilleurs', tr('Une porte sans poignée. De l’autre côté, on entend l’eau du puits du district, celle qui descend vers les Strates.')),
    ],
  },
];

export const secteurDef = (id: string) => SECTEURS.find((s) => s.id === id);
export const lieuBassesDef = (id: string) => SECTEURS.flatMap((s) => s.lieux).find((l) => l.id === id);
export const secteurDuLieu = (id: string) => SECTEURS.find((s) => s.lieux.some((l) => l.id === id));
