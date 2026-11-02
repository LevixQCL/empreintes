// La garde de la sauvegarde (2 novembre 2026) : ce qui empêche une partie d'en écraser une autre.
// Trois cas, tous sans réseau ni navigateur ici (règles pures, testées dans tests/garde-sauvegarde.test.ts) :
// - une version plus ancienne du jeu (un onglet resté ouvert depuis hier) tombe sur une sauvegarde d'une version plus récente :
//   elle ne doit jamais l'écraser, ni sur l'appareil ni sur le compte ;
// - un autre appareil a écrit sur le compte depuis notre dernière lecture : on n'écrase pas, on recharge
//   (la partie la plus avancée est gardée, l'autre part en secours) ;
// - un autre onglet du même appareil joue la même partie : un seul onglet écrit.

import { VERSION_JEU } from '../core/jeu';

/** La version enregistrée dans une sauvegarde (0 si elle n'en a pas) */
export function versionDe(x: unknown): number {
  const v = (x as { version?: unknown } | null)?.version;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** Une sauvegarde faite par une version du jeu plus récente que celle qui tourne */
export const tropRecente = (x: unknown, version = VERSION_JEU): boolean => versionDe(x) > version;

/** Ce qu'on sait du document du compte au moment d'écrire */
export interface DocDistant {
  existe: boolean;
  /** la version écrite à côté de la partie (champ `version` du document) */
  version: number;
  /** le jeton de la dernière écriture (updatedAt en millisecondes), null si absent */
  jeton: number | null;
}

export type Decision = 'ecrire' | 'trop-recente' | 'autre-appareil';

/**
 * Peut-on écrire sur le compte ?
 * `attendu` : le jeton lu ou écrit en dernier par cet appareil (null = on a lu qu'il n'y avait rien ;
 * undefined = on n'a encore rien lu, et alors on n'écrit pas : la réconciliation doit passer d'abord).
 */
export function decisionEcriture(d: DocDistant, attendu: number | null | undefined, version = VERSION_JEU): Decision {
  if (d.existe && d.version > version) return 'trop-recente';
  if (attendu === undefined) return 'autre-appareil';
  const actuel = d.existe ? d.jeton : null;
  return actuel === attendu ? 'ecrire' : 'autre-appareil';
}

/** Le jeton de la nouvelle écriture : toujours plus grand que le précédent, même si l'horloge de l'appareil retarde */
export const prochainJeton = (actuel: number | null, maintenant: number): number => Math.max(Math.round(maintenant), (actuel ?? 0) + 1);
