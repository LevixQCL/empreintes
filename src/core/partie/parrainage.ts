// Couche 5 — le parrainage (décision du 29 octobre 2026) : faire venir des amis, sans réseaux sociaux.
// Bryan voulait un parrainage « qui se sente, sans être exagéré » : un départ un peu boosté pour le filleul, des récompenses
// pour le parrain quand son filleul joue vraiment (pas à l'inscription : un compte vide ne rapporte rien), plafonnées
// à 5 recrues récompensées, et des distinctions purement cosmétiques à 3 et 5 recrues actives.
// Le réseau (src/net/parrainage.ts) ne fait que transporter : le code du parrain, et les paliers atteints par chaque filleul.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { carteId, moduleDe, moduleDef, PARRAINAGE_CARTE } from '../donnees';
import { ajouterCarte, tirerCarte } from '../collection';
import { jourDe, log, non, strateVaincue, type Jeu, type Resultat } from './etat';
import { noterLien } from './vecu';
import { COLIS_DOUBLES_JOURS } from './recompenses';

/** Les paliers d'un filleul : ce qu'il a atteint en jouant, publié en ligne pour son parrain */
export type PalierId = 'strate1' | 'strate3' | 'noyau3';
export type Cosmetique = 'dos-partage' | 'recruteur';

export const PARRAINAGE = {
  /** l'alphabet des codes : ni 0/O, ni 1/I/L, pour qu'on puisse le dicter */
  alphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  longueur: 6,
  /** on ne peut plus entrer de code une fois la Strate −2 vaincue : le parrainage, c'est pour les débuts */
  strateMaxPourCode: 2,
  /** le départ du filleul : des composants, une carte au choix (au moins du cuivre), et des colis doublés pendant 3 jours */
  depart: { composants: 100, joursColisDoubles: COLIS_DOUBLES_JOURS },
  /** les recrues qui rapportent au parrain (au-delà, seules les distinctions continuent de compter) */
  recruesRecompensees: 5,
  paliers: [
    { id: 'strate1', titre: 'Strate −1 vaincue', parrain: 'Un paquet de composants (≈ une journée de jeu)', filleul: '' },
    { id: 'strate3', titre: 'Strate −3 atteinte', parrain: 'Une carte au choix, dont une d’argent', filleul: 'Une carte au choix, dont une d’argent' },
    { id: 'noyau3', titre: 'Tour du Noyau niveau 3', parrain: 'La carte « Empreinte jumelle », à son nom', filleul: 'La carte « Empreinte jumelle », au nom du parrain' },
  ] as { id: PalierId; titre: string; parrain: string; filleul: string }[],
  /** le palier « Strate −1 » : des composants et des Éclats */
  strate1: { composants: 150, eclats: 2 },
  /** une recrue est « active » quand elle a vaincu la Strate −1 : c'est ce qui compte pour les distinctions */
  distinctions: [
    { id: 'dos-partage', recrues: 3, nom: 'Dos « Empreinte partagée »', gain: 'le dos de carte « Empreinte partagée »', texte: 'Le dos de tes cartes, quand elles se révèlent : deux empreintes qui se répondent, dans l’or.' },
    { id: 'recruteur', recrues: 5, nom: 'Titre « Recruteur »', gain: 'le titre « Recruteur »', texte: 'À côté de ton pseudo, sur le Grand Tableau.' },
  ] as { id: Cosmetique; recrues: number; nom: string; gain: string; texte: string }[],
} as const;

/** Une recrue telle que le parrain la lit en ligne */
export interface Recrue { uid: string; nom: string; paliers: PalierId[] }

export interface EtatParrainage {
  /** son propre code (réservé en ligne à ce compte) */
  code?: string;
  /** s'il a été recommandé : le compte, le code et le pseudo du parrain, et le jour du jeu où il est arrivé */
  parrain?: { uid: string; code: string; nom: string; jour: number };
  /** les paliers que ce joueur (filleul) a déjà publiés, et ceux dont il a déjà reçu sa part */
  publies: PalierId[];
  recus: PalierId[];
  /** côté parrain : pour chaque recrue (uid), les paliers déjà récompensés */
  reclames: Record<string, PalierId[]>;
  /** les distinctions gagnées (elles ne se perdent jamais) */
  cosmetiques: Cosmetique[];
}

export const etatParrainage = (j: Jeu): EtatParrainage => (j.parrainage ??= { publies: [], recus: [], reclames: {}, cosmetiques: [] });

/** Le code d'un compte : 6 caractères tirés de son identifiant (le sel change le code si, par malchance, il est déjà pris) */
export function codeDe(uid: string, sel = 0): string {
  let h = 2166136261 ^ sel;
  let h2 = 5381 + sel * 7919;
  for (let i = 0; i < uid.length; i++) {
    h = Math.imul(h ^ uid.charCodeAt(i), 16777619);
    h2 = Math.imul(h2, 33) ^ uid.charCodeAt(i);
  }
  const A = PARRAINAGE.alphabet;
  let n = (h >>> 0) * 4096 + ((h2 >>> 0) & 4095);
  let s = '';
  for (let i = 0; i < PARRAINAGE.longueur; i++) { s += A[n % A.length]; n = Math.floor(n / A.length); }
  return s;
}

/** Un code saisi par le joueur, remis en forme (« emp-7kq2x9 » → « 7KQ2X9 ») ; null s'il ne peut pas en être un */
export function lireCode(saisie: string): string | null {
  const s = saisie.toUpperCase().replace(/^EMP[-\s]?/, '').replace(/[\s-]/g, '');
  const ok = s.length === PARRAINAGE.longueur && [...s].every((c) => PARRAINAGE.alphabet.includes(c));
  return ok ? s : null;
}

/** Le code tel qu'on l'affiche */
export const codeAffiche = (code: string) => `EMP-${code}`;

/** Peut-il encore entrer le code d'un parrain ? */
export function peutEtreParraine(j: Jeu): boolean {
  return !j.parrainage?.parrain && strateVaincue(j) < PARRAINAGE.strateMaxPourCode;
}

/**
 * Il est recommandé par un parrain (code vérifié en ligne) : son départ boosté.
 * Une carte au choix (au moins du cuivre), des composants, et ses colis de Ravitaillement doublés pendant 3 jours.
 */
export function devenirFilleul(j: Jeu, parrain: { uid: string; code: string; nom: string }, now: number): Resultat {
  if (!peutEtreParraine(j)) return non(j.parrainage?.parrain ? 'Tu as déjà un parrain.' : 'Le parrainage, c’est pour les débuts : ton district est déjà trop avancé.');
  const e = etatParrainage(j);
  if (e.code && e.code === parrain.code) return non('C’est ton propre code.');
  e.parrain = { ...parrain, jour: jourDe(now) };
  j.composants += PARRAINAGE.depart.composants;
  j.choix.push({ source: 'parrainage', options: choixDeCartes(j, 'cuivre') });
  log(j, `Recommandé par ${parrain.nom} : +${PARRAINAGE.depart.composants} composants, une carte au choix, et des colis doublés pendant ${PARRAINAGE.depart.joursColisDoubles} jours.`);
  return { ok: true };
}

/** Les colis doublés du filleul : vrai pendant ses 3 premiers jours de parrainage */
export function colisDoubles(j: Jeu): boolean {
  const p = j.parrainage?.parrain;
  return !!p && j.ravitaillement.jour < p.jour + PARRAINAGE.depart.joursColisDoubles;
}

/** Trois cartes différentes : la première au moins dans le métal demandé, les autres au moins en cuivre */
function choixDeCartes(j: Jeu, minimum: 'cuivre' | 'argent'): string[] {
  const l: string[] = [];
  let garde = 0;
  while (l.length < 3 && garde++ < 40) {
    const id = tirerCarte(j, j.strate, l.length === 0 ? minimum : 'cuivre');
    if (!l.some((c) => moduleDe(c) === moduleDe(id))) l.push(id);
  }
  return l;
}

/** Les paliers que ce joueur a atteints (comme filleul, ils sont publiés pour son parrain) */
export function paliersAtteints(j: Jeu): PalierId[] {
  const l: PalierId[] = [];
  if (strateVaincue(j) >= 1) l.push('strate1');
  if (j.strate >= 3) l.push('strate3');
  if ((j.batiments.noyau ?? 0) >= 3) l.push('noyau3');
  return l;
}

/** Les paliers atteints mais pas encore publiés en ligne (rien si on n'a pas de parrain) */
export function paliersAPublier(j: Jeu): PalierId[] {
  if (!j.parrainage?.parrain) return [];
  return paliersAtteints(j).filter((p) => !j.parrainage!.publies.includes(p));
}

export function notePublies(j: Jeu, paliers: PalierId[]): void {
  const e = etatParrainage(j);
  e.publies = [...new Set([...e.publies, ...paliers])];
}

/** La carte « Empreinte jumelle » : un exemplaire de plus, dont le journal retient le nom de l'autre directeur */
function donnerCarteLiee(j: Jeu, avec: string): string {
  const cle = carteId(PARRAINAGE_CARTE, moduleDef(PARRAINAGE_CARTE).rarete);
  ajouterCarte(j, cle);
  noterLien(j, cle, avec);
  return cle;
}

/**
 * La part du filleul (appelée à chaque battement) : à la Strate −3 et à la Tour du Noyau niveau 3, il reçoit lui aussi
 * sa récompense, sans attendre le réseau. Renvoie les nouvelles à annoncer.
 */
export function recompenserFilleul(j: Jeu): string[] {
  const p = j.parrainage?.parrain;
  if (!p) return [];
  const e = j.parrainage!;
  const nouvelles: string[] = [];
  for (const id of paliersAtteints(j)) {
    if (e.recus.includes(id)) continue;
    e.recus.push(id);
    if (id === 'strate3') {
      j.choix.push({ source: 'parrainage', options: choixDeCartes(j, 'argent') });
      nouvelles.push(`Parrainage : la Strate −3 est atteinte, une carte au choix t’attend. ${p.nom} reçoit la sienne.`);
    } else if (id === 'noyau3') {
      donnerCarteLiee(j, p.nom);
      nouvelles.push(`Parrainage : la carte « ${moduleDef(PARRAINAGE_CARTE).nom} » rejoint ta collection, liée à ${p.nom}.`);
    }
  }
  for (const t of nouvelles) log(j, t);
  return nouvelles;
}

/** Une recrue compte pour les distinctions dès qu'elle a vaincu la Strate −1 */
export const recrueActive = (r: Pick<Recrue, 'paliers'>) => r.paliers.includes('strate1');

/** Les recrues déjà récompensées au moins une fois (les 5 places du plafond) */
export const recruesRecompensees = (j: Jeu): string[] => Object.keys(j.parrainage?.reclames ?? {}).filter((uid) => (j.parrainage!.reclames[uid] ?? []).length > 0);

/** Une recrue peut-elle encore rapporter ? (elle a déjà une place, ou il en reste) */
export function recruePayee(j: Jeu, uid: string): boolean {
  const deja = recruesRecompensees(j);
  return deja.includes(uid) || deja.length < PARRAINAGE.recruesRecompensees;
}

/**
 * Le parrain relit ses recrues (en ligne) : chaque palier nouveau rapporte une fois, dans la limite de 5 recrues.
 * Les distinctions comptent toutes les recrues actives, au-delà du plafond. Renvoie les nouvelles à annoncer.
 */
export function reclamerRecrues(j: Jeu, recrues: Recrue[]): string[] {
  const e = etatParrainage(j);
  const nouvelles: string[] = [];
  // dans l'ordre d'arrivée : les premières recrues prennent les places
  for (const r of recrues) {
    const faits = e.reclames[r.uid] ?? [];
    const neufs = PARRAINAGE.paliers.map((p) => p.id).filter((id) => r.paliers.includes(id) && !faits.includes(id));
    if (!neufs.length || !recruePayee(j, r.uid)) continue;
    for (const id of neufs) {
      if (id === 'strate1') {
        j.composants += PARRAINAGE.strate1.composants;
        j.eclats += PARRAINAGE.strate1.eclats;
        nouvelles.push(`${r.nom} a vaincu la Strate −1 : +${PARRAINAGE.strate1.composants} composants et +${PARRAINAGE.strate1.eclats} Éclats.`);
      } else if (id === 'strate3') {
        j.choix.push({ source: 'parrainage', options: choixDeCartes(j, 'argent') });
        nouvelles.push(`${r.nom} a atteint la Strate −3 : une carte au choix t’attend.`);
      } else {
        donnerCarteLiee(j, r.nom);
        nouvelles.push(`${r.nom} a monté sa Tour du Noyau au niveau 3 : la carte « ${moduleDef(PARRAINAGE_CARTE).nom} » rejoint ta collection.`);
      }
    }
    e.reclames[r.uid] = [...faits, ...neufs];
  }
  const actives = recrues.filter(recrueActive).length;
  for (const d of PARRAINAGE.distinctions) {
    if (actives >= d.recrues && !e.cosmetiques.includes(d.id)) {
      e.cosmetiques.push(d.id);
      nouvelles.push(`${actives} recrues actives : tu gagnes ${d.gain}.`);
    }
  }
  for (const t of nouvelles) log(j, t);
  return nouvelles;
}

export const aCosmetique = (j: Jeu, c: Cosmetique) => !!j.parrainage?.cosmetiques.includes(c);
