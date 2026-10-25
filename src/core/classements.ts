// Le Grand Tableau (23 octobre 2026) : les classements entre directeurs de district.
// Sur les écrans des marchés de Vertiga, les districts sont comparés : qui creuse le plus profond, qui garde le plus riche
// registre d'empreintes. Ce fichier calcule les scores et les ordonne ; il n'utilise ni le navigateur ni le réseau
// (src/net/classement.ts publie et lit les entrées dans Firestore).
//
// Quatre tableaux :
//   - Profondeur : la Strate la plus profonde (gardien vaincu ou non), départagée par la date où on l'a atteinte ;
//   - Registre   : la valeur de la collection (métal et niveau de chaque carte, plus chaque carte découverte) ;
//   - Joutes     : les combats gagnés contre d'autres directeurs (grisé : arrive avec le multijoueur) ;
//   - La Flèche  : l'ascension de la flèche d'amarrage vers les Hauts, quai par quai (grisé : à venir, voir FLECHE).
// Deux périodes : depuis le début, et la semaine en cours (ce qu'on a gagné depuis lundi), pour qu'un nouveau venu
// puisse finir premier d'une semaine même face à quelqu'un qui joue depuis un mois.

import { MODULES, moduleDe, moduleDef, zoneDe } from './donnees';
import type { Rarete } from './types';
import { COLLECTION, RARETES } from './collection';

export type TableauId = 'profondeur' | 'registre' | 'joutes' | 'fleche';
export type Periode = 'total' | 'semaine';

/** Les tableaux dans l'ordre d'affichage ; `ouvert: false` = grisé, avec ce qui arrive */
export const TABLEAUX: { id: TableauId; nom: string; court: string; ouvert: boolean; texte: string }[] = [
  { id: 'profondeur', nom: 'Profondeur', court: 'Strates', ouvert: true,
    texte: 'L’étage le plus profond creusé sous le district. À profondeur égale, le premier arrivé passe devant.' },
  { id: 'registre', nom: 'Registre', court: 'Cartes', ouvert: true,
    texte: 'La valeur de ta collection : le métal et le niveau de chaque carte, et chaque carte découverte.' },
  { id: 'joutes', nom: 'Joutes', court: 'Duels', ouvert: false,
    texte: 'Les combats gagnés contre d’autres directeurs. Ouvre avec les combats entre joueurs.' },
  { id: 'fleche', nom: 'La Flèche', court: 'Tour', ouvert: false,
    texte: 'La seule route légale vers les Hauts : la Flèche, quai par quai, jusqu’aux Sièges du sommet. En préparation.' },
];

// ---------- Le Registre : la valeur d'une collection ----------

/** Ce que vaut un exemplaire au niveau où on le trouve : chaque métal vaut environ 2,5 fois le précédent,
 *  à peu près l'écart de rareté entre deux métaux (tableRarete) — une carte en or pèse comme vingt en fer, pas comme deux cents. */
export const VALEUR_METAL: Record<Rarete, number> = { fer: 10, cuivre: 25, argent: 60, or: 150, nacre: 400 };
/** chaque niveau gagné au-dessus du niveau de départ ajoute 10 % de la valeur de l'exemplaire */
export const VALEUR_NIVEAU = 0.1;
/** chaque carte découverte (au moins un métal) : récompense l'étendue de la collection, pas seulement l'empilement */
export const VALEUR_DECOUVERTE = 20;

export function valeurExemplaire(cle: string, niveau: number): number {
  const r = moduleDef(cle).rarete;
  const gagnes = Math.max(0, niveau - COLLECTION.niveauDepart[r]);
  return Math.round(VALEUR_METAL[r] * (1 + VALEUR_NIVEAU * gagnes));
}

interface ValeurRegistre {
  points: number;
  /** exemplaires possédés (une carte dans un métal) */
  exemplaires: number;
  /** cartes différentes découvertes, sur `total` */
  decouvertes: number;
  total: number;
  /** exemplaires par métal */
  parMetal: Record<Rarete, number>;
}

export function valeurRegistre(collection: Record<string, { niveau: number }>): ValeurRegistre {
  const parMetal = Object.fromEntries(RARETES.map((r) => [r, 0])) as Record<Rarete, number>;
  const bases = new Set<string>();
  let points = 0;
  for (const [cle, c] of Object.entries(collection)) {
    let def;
    try { def = moduleDef(cle); } catch { continue; }
    parMetal[def.rarete]++;
    bases.add(moduleDe(cle));
    points += valeurExemplaire(cle, c.niveau);
  }
  points += bases.size * VALEUR_DECOUVERTE;
  return { points, exemplaires: Object.values(parMetal).reduce((a, b) => a + b, 0), decouvertes: bases.size, total: MODULES.length, parMetal };
}

// ---------- La Profondeur ----------

/** La profondeur en demi-étages : 2 par Strate ouverte, +1 quand son gardien est vaincu (−4 vaincue > −4 ouverte) */
export const profondeurDe = (j: { strate: number; frontVaincu: boolean }) => j.strate * 2 + (j.frontVaincu ? 1 : 0);
export const strateDe = (p: number) => Math.floor(p / 2);
export const gardienVaincu = (p: number) => p % 2 === 1;
export const zoneProfondeur = (p: number) => zoneDe(Math.max(1, strateDe(p))).nom;

// ---------- Le palmarès personnel, gardé dans la partie ----------

export interface Palmares {
  /** meilleure profondeur atteinte (demi-étages) et quand */
  profondeur: number;
  profondeurLe: number;
  /** meilleure valeur du Registre atteinte */
  registre: number;
  /** la semaine en cours (semaineDe) et les scores de son début, pour le tableau de la semaine */
  semaine: number;
  profondeurDebut: number;
  registreDebut: number;
}

/**
 * Met à jour le palmarès avec l'état de la partie. Appelé à chaque tick : bon marché, et ne change rien si rien n'a bougé.
 * Le score ne redescend jamais : recycler un doublon n'efface pas un record.
 * @returns true si quelque chose a changé (à publier)
 */
export function noterPalmares(j: { strate: number; frontVaincu: boolean; collection: Record<string, { niveau: number }>; palmares?: Palmares }, now: number, semaine: number): boolean {
  const p = profondeurDe(j);
  const r = valeurRegistre(j.collection).points;
  const avant = j.palmares;
  if (!avant) {
    // première fois (nouvelle partie ou ancienne sauvegarde) : la semaine part d'ici, la date d'arrivée est maintenant
    j.palmares = { profondeur: p, profondeurLe: now, registre: r, semaine, profondeurDebut: p, registreDebut: r };
    return true;
  }
  let change = false;
  if (avant.semaine !== semaine) {
    avant.semaine = semaine; avant.profondeurDebut = avant.profondeur; avant.registreDebut = avant.registre; change = true;
  }
  if (p > avant.profondeur) { avant.profondeur = p; avant.profondeurLe = now; change = true; }
  if (r > avant.registre) { avant.registre = r; change = true; }
  return change;
}

// ---------- Les entrées publiées et leur ordre ----------

/** Ce qu'un joueur publie sur le Grand Tableau. Aucun e-mail : seulement le nom de directeur qu'il a choisi. */
export interface Entree {
  uid: string;
  nom: string;
  /** la clé du pseudo réservé (`pseudos/{cle}`) : les règles Firestore vérifient que ce pseudo est bien à ce joueur */
  cle: string;
  /** le Porteur en tête de son escouade, dont on montre le portrait */
  porteur: string;
  profondeur: number;
  profondeurLe: number;
  registre: number;
  decouvertes: number;
  semaine: number;
  profondeurSemaine: number;
  registreSemaine: number;
  /** dernière publication (ms) */
  maj: number;
}

/** Un nom de directeur : 3 à 18 caractères, lettres (accents compris), chiffres, espace, point, tiret, apostrophe */
const NOM_VALIDE = /^[\p{L}\p{N}][\p{L}\p{N} .'’_-]{1,16}[\p{L}\p{N}.]$/u;
export function nettoyerNom(nom: string): string { return nom.replace(/\s+/g, ' ').trim(); }
export function nomValide(nom: string): boolean { return NOM_VALIDE.test(nettoyerNom(nom)) && /^[a-z0-9]{3,24}$/.test(clePseudo(nom)); }

/**
 * La clé d'un pseudo : ce qui le rend unique. Minuscules, sans accents ni séparateurs, et les chiffres qui imitent
 * des lettres ramenés à ces lettres : « Bryan », « bryan », « Bryän », « B.r-y_a n » et « BRYAN » sont le même pseudo.
 * Seuls les pseudos en alphabet latin sont acceptés (une clé hors de a-z et 0-9 est refusée) : pas de sosie en cyrillique.
 */
export function clePseudo(nom: string): string {
  // la même table que firestore.rules (fonction clePseudo) : les deux doivent donner exactement la même clé
  let c = nettoyerNom(nom).toLowerCase().replace(/[ .'’_-]/g, '');
  for (const [de, vers] of ACCENTS) c = c.replace(de, vers);
  return c;
}
/** Les accents ramenés à leur lettre (l'ordre et le contenu sont recopiés tels quels dans firestore.rules) */
const ACCENTS: [RegExp, string][] = [
  [/[àáâãäå]/g, 'a'], [/[èéêë]/g, 'e'], [/[ìíîï]/g, 'i'], [/[òóôõöø]/g, 'o'], [/[ùúûü]/g, 'u'],
  [/[ýÿ]/g, 'y'], [/ç/g, 'c'], [/ñ/g, 'n'], [/œ/g, 'oe'], [/æ/g, 'ae'], [/ß/g, 'ss'],
];

/** La clé vue par le filtre : les chiffres-lettres (0→o, 1→i, 3→e, 4→a, 5→s, 7→t) et les lettres doublées réduites */
function cleFiltre(cle: string): string {
  return cle.replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/l/g, 'i').replace(/(.)\1+/g, '$1');
}

/** Les mots interdits dans un pseudo : grossièretés courantes, haine, et noms qui imitent l'équipe du jeu.
 *  Écrits comme le filtre les voit (l → i, lettres doublées réduites). Trois listes pour ne pas bloquer des prénoms :
 *  « Dominique » contient « nique », « Nazim » commence par « nazi », « Montenegro » contient « negro ». */
const PARTOUT = ['conard', 'conase', 'saiope', 'encuie', 'batard', 'couie', 'merde', 'bordei', 'pedophi', 'hitier', 'bougnou', 'youpin',
  'fagot', 'fuck', 'shit', 'bitch', 'cunt', 'whore', 'terorist', 'jihad', 'admin', 'moderat', 'anthropic', 'oficiei'];
const AU_DEBUT = ['suport', 'equipe', 'systeme', 'empreinte', 'staf', 'modo'];
const SEULS = ['pute', 'putes', 'bite', 'ntm', 'fdp', 'pd', 'tg', 'cui', 'sex', 'sexe', 'porn', 'xxx', 'vioi', 'rape', 'pedo', 'nique', 'niker',
  'nazi', 'nazis', 'negro', 'negre', 'raton'];

/** Le pseudo contient-il un mot interdit ? */
export function pseudoInterdit(nom: string): boolean {
  const c = cleFiltre(clePseudo(nom));
  return PARTOUT.some((m) => c.includes(m)) || AU_DEBUT.some((m) => c.startsWith(m)) || SEULS.includes(c);
}

/** Changer de pseudo : au plus une fois par semaine, pour qu'on ne puisse pas se faire passer pour quelqu'un en jouant avec les noms */
export const DELAI_PSEUDO = 7 * 86_400_000;

/** La valeur d'une entrée dans un tableau et une période (null = n'apparaît pas : cette semaine, il n'a pas joué) */
export function valeur(e: Entree, t: TableauId, per: Periode, semaine: number): number | null {
  if (t === 'profondeur') return per === 'total' ? e.profondeur : e.semaine === semaine ? e.profondeurSemaine : null;
  if (t === 'registre') return per === 'total' ? e.registre : e.semaine === semaine ? e.registreSemaine : null;
  return null;
}

/** Ordonne les entrées : la plus haute valeur d'abord ; à profondeur égale, le premier arrivé ; sinon le nom */
export function classer(entrees: Entree[], t: TableauId, per: Periode, semaine: number): { e: Entree; v: number; rang: number }[] {
  const l = entrees.map((e) => ({ e, v: valeur(e, t, per, semaine) })).filter((x): x is { e: Entree; v: number } => x.v !== null && (per === 'total' || x.v > 0));
  l.sort((a, b) => b.v - a.v || (t === 'profondeur' && per === 'total' ? a.e.profondeurLe - b.e.profondeurLe : 0) || a.e.nom.localeCompare(b.e.nom, 'fr'));
  // ex æquo affichés au même rang, sauf en profondeur totale où la date départage toujours
  let rang = 0;
  return l.map((x, i) => {
    const prec = l[i - 1];
    if (!prec || prec.v !== x.v || (t === 'profondeur' && per === 'total')) rang = i + 1;
    return { ...x, rang };
  });
}

/** Ce qu'il manque pour dépasser le joueur juste devant (null si on est premier ou absent) */
export function ecartDevant(l: { e: Entree; v: number; rang: number }[], uid: string): { nom: string; manque: number } | null {
  const i = l.findIndex((x) => x.e.uid === uid);
  if (i <= 0) return null;
  const moi = l[i]!;
  const devant = l.slice(0, i).reverse().find((x) => x.rang < moi.rang);
  if (!devant) return null;
  return { nom: devant.e.nom, manque: devant.v - moi.v + 1 };
}

/**
 * Les lignes à montrer : tout le monde s'il y a peu de joueurs ; sinon le podium, puis le joueur entouré de ses voisins
 * (« toi et ceux qui t'entourent » : on se compare à qui on peut rattraper, pas seulement au premier).
 */
export function fenetre<T extends { e: Entree }>(l: T[], uid: string | null, voisins = 2, tous = 12): (T | 'ellipse')[] {
  if (l.length <= tous) return l;
  const i = uid ? l.findIndex((x) => x.e.uid === uid) : -1;
  const garde = new Set<number>([0, 1, 2]);
  if (i >= 0) {
    for (let k = i - voisins; k <= i + voisins; k++) if (k >= 0 && k < l.length) garde.add(k);
  } else {
    for (let k = 3; k < Math.min(l.length, 10); k++) garde.add(k);
  }
  const r: (T | 'ellipse')[] = [];
  let prec = -1;
  for (const k of [...garde].sort((a, b) => a - b)) { if (k > prec + 1) r.push('ellipse'); r.push(l[k]!); prec = k; }
  if (prec < l.length - 1) r.push('ellipse');
  return r;
}

/** Des demi-étages en Strates : 3 → « 1½ », 1 → « ½ » */
export const demiStrates = (v: number) => `${Math.floor(v / 2) || (v % 2 ? '' : '0')}${v % 2 ? '½' : ''}`;

/** Le texte de la valeur d'un tableau */
export function texteValeur(t: TableauId, per: Periode, v: number): string {
  if (t === 'profondeur') return per === 'total' ? `−${strateDe(v)}` : `+${demiStrates(v)}`;
  return (per === 'semaine' ? '+' : '') + Math.round(v).toLocaleString('fr-BE');
}

/**
 * L'entrée à publier, à partir de la partie et de l'entrée déjà en ligne (null s'il n'y en a pas encore).
 * Suit les règles Firestore : la profondeur ne monte que de deux Strates par publication (le reste suivra à la suivante),
 * et la date d'arrivée n'est « maintenant » que si la profondeur monte, sinon elle reste celle déjà publiée.
 */
export function entreeAPublier(
  j: { strate: number; frontVaincu: boolean; collection: Record<string, { niveau: number }>; palmares?: Palmares; escouade?: string[] },
  uid: string, nom: string, enLigne: Entree | null, now: number, semaine: number,
): Entree | null {
  const pal = j.palmares;
  if (!pal) return null;
  const r = valeurRegistre(j.collection);
  const registre = Math.round(Math.max(pal.registre, r.points));
  let profondeur = Math.max(2, pal.profondeur);
  let profondeurLe = Math.round(pal.profondeurLe);
  if (enLigne) {
    profondeur = Math.min(Math.max(profondeur, enLigne.profondeur), enLigne.profondeur + 4);
    profondeurLe = profondeur > enLigne.profondeur ? now : enLigne.profondeurLe;
  }
  const memeSemaine = pal.semaine === semaine;
  return {
    uid, nom: nettoyerNom(nom), cle: clePseudo(nom), porteur: j.escouade?.[0] ?? 'ilka',
    profondeur, profondeurLe, registre, decouvertes: r.decouvertes,
    semaine,
    profondeurSemaine: memeSemaine ? Math.max(0, Math.min(profondeur, profondeur - pal.profondeurDebut)) : 0,
    registreSemaine: memeSemaine ? Math.max(0, Math.min(registre, registre - pal.registreDebut)) : 0,
    maj: now,
  };
}

/** Faut-il republier ? (un score, le nom ou le Porteur de tête a changé) */
export function aChange(a: Entree, b: Entree | null): boolean {
  if (!b) return true;
  return a.nom !== b.nom || a.cle !== b.cle || a.porteur !== b.porteur || a.profondeur !== b.profondeur || a.registre !== b.registre || a.decouvertes !== b.decouvertes
    || a.semaine !== b.semaine || a.profondeurSemaine !== b.profondeurSemaine || a.registreSemaine !== b.registreSemaine;
}

// ---------- La Flèche (à venir) ----------
// La dernière flèche d'amarrage des Hauts (lore validé le 25 octobre 2026) : depuis la Clause de la Flèche des Accords
// de 2101, tout district peut y envoyer une escouade ; celle qui tient le sommet quand une île passe est reçue là-haut.
// Chaque victoire fait monter de plusieurs quais en bas, d'un seul en haut ; une défaite fait redescendre, jamais sous
// le dernier quai gravé. Au sommet, le temps d'un passage d'île (une saison) : trois défaites éliminent (retour au quai
// gravé, record gardé), sept victoires ouvrent le droit de défier un Siège. Les Sièges sont tenus par des joueurs,
// défendus par un fantôme de leur deck. Le tableau classe le quai atteint, puis le premier arrivé.
// Chiffres choisis pour ne rappeler aucune tour d'arène connue (101 quais : l'année des Accords).
export const FLECHE = {
  quais: 101,
  /** quais gagnés par victoire selon la hauteur : vite en bas, lentement en haut (56 victoires sans défaite pour le sommet) */
  montee: [{ jusqua: 40, quais: 4 }, { jusqua: 70, quais: 2 }, { jusqua: 101, quais: 1 }],
  /** quais gravés : une défaite n'en fait jamais redescendre, et chacun donne une récompense une fois */
  paliers: [20, 40, 50, 60, 70, 80, 90, 101],
  /** au-delà du dernier quai : les Sièges, tenus par des joueurs, qu'on défie */
  sieges: 5,
  /** au sommet, pendant un passage d'île : défaites qui éliminent, victoires qui ouvrent un défi de Siège */
  defaitesMax: 3,
  victoiresDefi: 7,
} as const;
