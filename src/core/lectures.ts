// Les Lectures (prototype du 11 novembre 2026, piste retenue pour le Pack des origines) : lire un cristal à empreinte.
// Le cristal libère des fragments de souvenir ; on les pose sur un fil, du premier moment au dernier.
// Chaque fragment a un motif d'entrée (à gauche) et un motif de sortie (à droite), comme un domino : deux voisins
// s'allument quand la sortie de l'un est l'entrée de l'autre (« il fait froid » → « le froid… »).
// Un fil tout allumé se lit : dans le bon ordre et sans intrus, c'est le vrai souvenir ; sinon le joueur lit
// un faux souvenir, qui raconte l'histoire de travers, et il recommence. Les intrus viennent de l'empreinte d'avant
// (« des cristaux d'un même individu aux souvenirs incompatibles », Bible du lore) : ils s'emboîtent aussi bien
// que les vrais fragments, seul le texte les trahit.
// Pas de navigateur ici : l'écran est dans src/ui/lecture.ts, les gestes dans src/app/lecture.ts.

import { t } from './i18n';

export type Motif = 'froid' | 'lumiere' | 'main' | 'voix' | 'cheville' | 'pas' | 'eau';

export const NOMS_MOTIFS: Record<Motif, string> = {
  froid: t('froid'), lumiere: t('lumière'), main: t('main'), voix: t('voix'), cheville: t('cheville'), pas: t('pas'), eau: t('eau'),
};

export interface Fragment {
  id: string;
  texte: string;
  /** [entrée, sortie] : null au début ou à la fin d'un souvenir */
  motifs: [Motif | null, Motif | null];
  /** un fragment de l'empreinte d'avant, qui n'appartient pas à ce souvenir */
  intrus?: boolean;
}

export interface LectureDef {
  id: string;
  surtitre: string;
  titre: string;
  intro: string[];
  fragments: Fragment[];
  /** le vrai souvenir, dans l'ordre */
  ordre: string[];
  /** ce qui s'affiche quand le vrai souvenir est lu */
  fin: string[];
}

/** La première Lecture : le cœur de cristal des jambes d'Ilka. Le cristal n'était pas là au moment du signal : le secret de Doran reste entier. */
export const COEUR_DES_JAMBES: LectureDef = {
  id: 'coeur-des-jambes',
  surtitre: t('Lecture · Le cristal d’Ilka · Prototype'),
  titre: t('Le cœur des jambes'),
  intro: [
    t('Le cœur de cristal des jambes d’Ilka garde une nuit de 2111. Et autre chose, plus ancien.'),
    t('Pose les fragments sur le fil, du premier moment au dernier. Quand le motif de droite d’un fragment est celui de gauche du suivant, le lien s’allume.'),
    t('Attention : tous les fragments ne sont pas à elle. Quand le fil est tout allumé, le cristal le lit, vrai ou faux.'),
  ],
  fragments: [
    { id: 'porte', texte: t('Une porte d’acier s’ouvre. Derrière, il fait froid.'), motifs: [null, 'froid'] },
    { id: 'plafond', texte: t('Le froid vient d’en haut, où une lumière bleue respire, lente comme une marée.'), motifs: ['froid', 'lumiere'] },
    { id: 'lampe', texte: t('Une lampe penchée. Des mains de médecin qui ne tremblent pas.'), motifs: ['lumiere', 'main'] },
    { id: 'main', texte: t('Une grosse main serre la sienne. Une voix grave : « Je suis là. »'), motifs: ['main', 'voix'] },
    { id: 'murs', texte: t('Une autre voix parle tout bas, dans les murs. À sa cheville, une petite lumière répond.'), motifs: ['voix', 'cheville'] },
    { id: 'aube', texte: t('L’aube. La lumière de la cheville s’éteint. Au premier pas, les jambes partent toutes seules.'), motifs: ['cheville', 'pas'] },
    { id: 'course', texte: t('Ses pas la portent sur les quais. L’eau, en bas, ne la rattrape plus.'), motifs: ['pas', 'eau'] },
    { id: 'passerelle-2070', texte: t('Des pas sur une passerelle de 2070, détruite depuis longtemps. Sous elle, l’eau d’une autre époque.'), motifs: ['pas', 'eau'], intrus: true },
    { id: 'plus-vite', texte: t('Une voix de femme, plus vieille : « Plus vite. » Une cheville qui n’est pas la sienne.'), motifs: ['voix', 'cheville'], intrus: true },
  ],
  ordre: ['porte', 'plafond', 'lampe', 'main', 'murs', 'aube', 'course'],
  fin: [
    t('Le fil tient. Le cristal se tait, puis rend la nuit entière : la porte, le froid, la main qui ne lâche pas.'),
    t('Il garde aussi des pas qui ne sont pas les siens. Une coursière de 2070 court encore, quelque part dans ses jambes.'),
    t('Et cette petite lumière à la cheville, qui a répondu à quelqu’un dans les murs. Ilka ne s’en souvient pas.'),
  ],
};

export interface EtatLecture {
  def: LectureDef;
  /** le fil : un emplacement par moment du vrai souvenir */
  fil: (string | null)[];
  /** l'emplacement du fil touché, prêt à être échangé */
  choisi: number | null;
  /** les faux souvenirs déjà lus */
  faux: number;
  /** le dernier faux souvenir lu, pour l'écran */
  dernierFaux: { recit: string[]; raison: string } | null;
  issue: 'en-cours' | 'lu';
}

export function nouvelleLecture(def: LectureDef = COEUR_DES_JAMBES): EtatLecture {
  return { def, fil: def.ordre.map(() => null), choisi: null, faux: 0, dernierFaux: null, issue: 'en-cours' };
}

export const fragmentDe = (e: EtatLecture, id: string): Fragment => e.def.fragments.find((f) => f.id === id)!;

/** Les fragments pas encore posés */
export const reserve = (e: EtatLecture): Fragment[] => e.def.fragments.filter((f) => !e.fil.includes(f.id));

/** Le motif qui relie deux voisins (la sortie de l'un est l'entrée de l'autre), ou null */
export function motifCommun(a: Fragment, b: Fragment): Motif | null {
  return a.motifs[1] && a.motifs[1] === b.motifs[0] ? a.motifs[1] : null;
}

/** Les liens du fil : pour chaque paire de voisins, le motif qui les relie (null : éteint ou vide) */
export function liens(e: EtatLecture): (Motif | null)[] {
  return e.fil.slice(1).map((id, i) => {
    const a = e.fil[i];
    return a && id ? motifCommun(fragmentDe(e, a), fragmentDe(e, id)) : null;
  });
}

/** Le fil est plein et tout allumé : le cristal peut le lire */
export const toutAllume = (e: EtatLecture): boolean => e.fil.every(Boolean) && liens(e).every(Boolean);

/** Toucher un fragment de la réserve : il va au moment choisi (en remplaçant celui qui y était), sinon au premier emplacement libre */
export function poser(e: EtatLecture, id: string): boolean {
  if (e.issue !== 'en-cours' || e.fil.includes(id)) return false;
  // un moment du fil est choisi : le fragment prend sa place, l'ancien retourne aux fragments
  const i = e.choisi ?? e.fil.indexOf(null);
  if (i < 0) return false;
  e.fil[i] = id;
  e.choisi = null;
  e.dernierFaux = null;
  return true;
}

/** Toucher un emplacement du fil : le choisir, l'échanger avec le choisi, ou le rendre à la réserve (deuxième toucher) */
export function toucherFil(e: EtatLecture, i: number): void {
  if (e.issue !== 'en-cours' || i < 0 || i >= e.fil.length) return;
  e.dernierFaux = null;
  if (e.choisi === null) { if (e.fil[i]) e.choisi = i; return; }
  if (e.choisi === i) { e.fil[i] = null; e.choisi = null; return; }
  const a = e.fil[e.choisi]!;
  e.fil[e.choisi] = e.fil[i] ?? null;
  e.fil[i] = a;
  e.choisi = null;
}

/** Le cristal lit le fil tout allumé : vrai souvenir, ou faux souvenir raconté tel quel */
export function lire(e: EtatLecture): 'vrai' | 'faux' | 'impossible' {
  if (e.issue !== 'en-cours' || !toutAllume(e)) return 'impossible';
  const ids = e.fil as string[];
  if (ids.every((id, i) => id === e.def.ordre[i])) { e.issue = 'lu'; e.dernierFaux = null; return 'vrai'; }
  e.faux += 1;
  const intrus = ids.filter((id) => fragmentDe(e, id).intrus).length;
  e.dernierFaux = {
    recit: ids.map((id) => fragmentDe(e, id).texte),
    raison: intrus > 1 ? t('Le fil se tient, mais quelqu’un d’autre y court. Plusieurs fragments ne sont pas à Ilka.')
      : intrus ? t('Le fil se tient, mais quelqu’un d’autre y court. Un fragment n’est pas à Ilka.')
      : t('Ce sont bien ses souvenirs, mais le temps s’y emmêle.'),
  };
  return 'faux';
}

/** Les étoiles d'une Lecture réussie : 3 sans faux souvenir, 2 avec un seul, 1 au-delà */
export const etoilesLecture = (e: EtatLecture): number => (e.issue !== 'lu' ? 0 : e.faux === 0 ? 3 : e.faux === 1 ? 2 : 1);
