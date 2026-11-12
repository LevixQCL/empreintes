// Couche 5 ter — la fouille confiée (12 novembre 2026).
// Bryan : « deux séances sur trois se passent à refouiller du contenu déjà vaincu ». Une Strate déjà vaincue ne se rejoue plus
// forcément à la main : une escouade y part seule, pendant que le joueur descend au front, monte à la Flèche ou ferme le jeu.
// Trois règles simples, sans hasard caché :
// - il faut une escouade complète et assez forte pour la Strate (la force « jouable » du conseil de départ, pillages.ts) ;
// - une seule fouille confiée à la fois, pour un temps fixe ;
// - elle rapporte moins qu'une fouille jouée (« plus on joue, plus on est récompensé ») : ni creuseur, ni Vestige, ni prime de la
//   Strate remuée. Ce qu'elle rapportera est affiché avant le départ, et c'est ce qu'elle rapporte.
// Fonctions pures : le temps est toujours passé en paramètre.

import { porteurDef, moduleDef } from '../donnees';
import { ajouterCarte, metalTranche, tirerTrouvaille } from '../collection';
import { butinCombat, type CibleFouille } from '../expedition';
import type { Rarete } from '../types';
import { ESCOUADES_STRATE, XP, enMission, escouadeActive, escouadesDe, escouadesOuvertes, facteurXp, gagnerXp, log, non, strateVaincue, usureMax, type FouilleConfiee, type Jeu, type RapportMission, type Resultat } from './etat';
import { quitterPostes } from './recompenses';
import { CIBLES_FOUILLE, FILON_COMPOSANTS, choisirEscouade, escouadePrete, estLignee, indiceEscouade, rangerRapport } from './descentes';
import { CONSEIL, forceConseillee, forceEscouade } from './pillages';
import { t as tr } from '../i18n';

export const CONFIEE = {
  /** la durée d'une fouille confiée : un joueur qui passe deux fois par jour en lance deux, un assidu trois */
  heures: 8,
  /** les combats d'une fouille normale (5 rangées : trois salles avant le filon) */
  combats: 3,
  /** la part d'une fouille normale jouée qu'elle rapporte (minerai et expérience) */
  part: 0.7,
  /** la part du filon de minerai d'une fouille normale (DIFFICULTES_FOUILLE.normale.gain) */
  filon: 0.9,
  /** l'Éclat du filon « Éclats » : un, à coup sûr (une fouille jouée en trouve un peu plus d'un en moyenne) */
  eclats: 1,
  /** l'Usure de chaque Porteur au retour */
  usure: 6,
} as const;

/** Les fouilles confiées s'ouvrent avec les 2ᵉ et 3ᵉ escouades (après le gardien de −5) */
export const confieesOuvertes = (j: Jeu): boolean => !!j.chambre && escouadesOuvertes(j) > 1;

/** La force qu'il faut pour fouiller seul cette Strate : la force « jouable » du départ */
export const forceConfiee = (strate: number): number => Math.round(CONSEIL.jouable * forceConseillee(strate) * 10) / 10;

/** Ce qu'une fouille confiée rapportera : exactement ce qui est affiché avant le départ */
export function apercuConfiee(strate: number, cible: CibleFouille): { minerai: number; metal: Rarete | null; eclats: number; xp: number; heures: number } {
  const combats = CONFIEE.combats * butinCombat(strate, 0);
  const filon = cible === 'composants' ? CONFIEE.combats * FILON_COMPOSANTS * (1 + 0.25 * (strate - 1)) * CONFIEE.filon : 0;
  return {
    minerai: Math.round((combats + filon) * CONFIEE.part),
    metal: estLignee(cible) ? metalTranche(strate) : null,
    eclats: cible === 'eclats' ? CONFIEE.eclats : 0,
    xp: Math.round(CONFIEE.combats * XP.combat * facteurXp(strate) * 0.75 * CONFIEE.part),
    heures: CONFIEE.heures,
  };
}

/** Peut-on confier cette fouille à cette escouade ? (le message dit ce qui manque) */
export function peutConfier(j: Jeu, escouade: string[], strate: number, cible: CibleFouille): Resultat {
  if (!confieesOuvertes(j)) return non(tr`Les fouilles confiées s’ouvrent avec la 2ᵉ escouade, quand le gardien de la Strate −${ESCOUADES_STRATE} est vaincu.`);
  if (j.confiee) return non(tr`Une escouade fouille déjà seule la Strate −${j.confiee.strate} : une seule fouille confiée à la fois.`);
  if (!CIBLES_FOUILLE[cible]) return non(tr('Cible inconnue.'));
  if (strate < 1 || strate > strateVaincue(j)) return non(tr('On ne fouille que les Strates déjà vaincues.'));
  const e = escouadePrete(j, escouade, undefined, undefined, 'courte');
  if (!e.ok) return e;
  const force = Math.round(forceEscouade(j, escouade) * 10) / 10, requise = forceConfiee(strate);
  if (force < requise) return non(tr`Cette escouade est trop juste pour fouiller seule la Strate −${strate} (force ${Math.round(force * 100)} sur ${Math.round(requise * 100)}) : renforce-la, ou confie-lui une Strate moins profonde.`);
  return { ok: true };
}

/** Confie la fouille : l'escouade part seule, et une autre escouade prend la descente si c'était elle qui descendait */
export function confierFouille(j: Jeu, escouade: string[], strate: number, cible: CibleFouille, now: number): Resultat {
  const p = peutConfier(j, escouade, strate, cible);
  if (!p.ok) return p;
  quitterPostes(j, escouade);
  const k = indiceEscouade(j, escouade);
  j.confiee = { porteurs: [...escouade], escouade: k, strate, cible, debut: now, fin: now + CONFIEE.heures * 3_600_000 };
  log(j, tr`L’escouade ${k + 1} part fouiller seule la Strate −${strate} (${CIBLES_FOUILLE[cible].nom.toLowerCase()}, ${CONFIEE.heures} h).`);
  // celle qui descendait est partie : la première escouade encore au district prend sa place
  if (escouadesDe(j)[escouadeActive(j)]!.some((id) => escouade.includes(id))) {
    const autre = escouadesDe(j).findIndex((l, n) => n !== escouadeActive(j) && l.length > 0 && !l.some((id) => enMission(j, id)));
    if (autre >= 0) choisirEscouade(j, autre);
  }
  return { ok: true };
}

/** Le récit du retour : court, et il dit ce qui a été trouvé */
function recitConfiee(f: FouilleConfiee, cartes: string[], niveaux: { id: string; niveau: number }[]): string[] {
  const noms = f.porteurs.map((id) => porteurDef(id).nom);
  const recit = [tr`${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]} sont descendus seuls dans la Strate −${f.strate}. Personne pour choisir le chemin à leur place : ils ont pris le plus sûr, et l’ont tenu.`];
  if (cartes.length) recit.push(tr`Au filon, la roche tenait encore une carte : ${moduleDef(cartes[0]!).nom}. Ils l’ont dégagée au couteau, sans l’abîmer.`);
  else if (f.cible === 'eclats') recit.push(tr('Au fond du filon, un Éclat brillait dans sa gangue. Il a fallu le reste de la journée pour l’en sortir entier.'));
  else recit.push(tr('Ils ont vidé le filon veine après veine, et remonté le minerai à dos, en trois voyages.'));
  for (const n of niveaux) recit.push(tr`${porteurDef(n.id).nom} en revient au niveau ${n.niveau}.`);
  recit.push(tr('Ils rentrent fourbus : la Clinique s’en occupe.'));
  return recit;
}

/** Le retour de la fouille confiée (appelé par tick) : verse le butin, range un rapport à lire et renvoie l'annonce */
export function retourConfiee(j: Jeu): string {
  const f = j.confiee!;
  j.confiee = null;
  const a = apercuConfiee(f.strate, f.cible);
  j.composants += a.minerai;
  j.eclats += a.eclats;
  const cartes = a.metal && estLignee(f.cible) ? [tirerTrouvaille(j, f.strate, a.metal, f.cible)] : [];
  const trouvees = cartes.map((c) => ({ id: c, nouvelle: ajouterCarte(j, c) }));
  const niveaux: { id: string; niveau: number }[] = [];
  let usure = 0;
  for (const id of f.porteurs) {
    const q = j.porteurs[id];
    if (!q) continue;
    const monte = gagnerXp(j, id, a.xp);
    if (monte) niveaux.push({ id, niveau: monte });
    const avant = q.usure;
    q.usure = Math.min(usureMax(j, id), q.usure + CONFIEE.usure);
    usure = Math.max(usure, q.usure - avant);
    q.faits = { ...q.faits, combats: (q.faits?.combats ?? 0) + CONFIEE.combats };
  }
  const texte = tr`L’escouade ${f.escouade + 1} rentre de la Strate −${f.strate} : +${a.minerai} minerai, +${a.xp} XP chacun${cartes.length ? `, ${cartes.map((c) => moduleDef(c).nom).join(', ')}` : ''}${a.eclats ? tr`, +${a.eclats} Éclat${a.eclats > 1 ? 's' : ''}` : ''}.`;
  log(j, texte);
  const rapport: RapportMission = {
    porteur: f.porteurs[0]!, strate: f.strate, duree: 'longue', fin: f.fin, recit: recitConfiee(f, cartes, niveaux),
    composants: a.minerai, xp: a.xp, niveau: null, cartes: trouvees, creuseurs: 0, ...(a.eclats ? { eclats: a.eclats } : {}),
    usure: Math.round(usure * 10) / 10, marque: null, lu: false,
    confiee: { strate: f.strate, cible: f.cible, porteurs: [...f.porteurs], escouade: f.escouade },
  };
  rangerRapport(j, rapport);
  return texte;
}
