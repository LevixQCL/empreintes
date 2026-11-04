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

/**
 * Ce que contient l'emplacement de la partie sur l'appareil (4 novembre 2026, après l'incident de la version 8 :
 * une mise à jour qui ne savait plus lire les parties en cours proposait « Commencer », et une nouvelle partie les aurait écrasées).
 * Une sauvegarde présente mais illisible n'est JAMAIS écrasée : on s'arrête et on prévient.
 * `valide` reçoit une copie fraîche (estJeuValide complète la partie qu'on lui donne).
 */
export type EtatStocke = 'vide' | 'lisible' | 'trop-recente' | 'illisible';
export function etatStocke(brut: string | null, valide: (x: unknown) => boolean, version = VERSION_JEU): EtatStocke {
  if (!brut) return 'vide';
  let env: { data?: unknown };
  try { env = JSON.parse(brut) as { data?: unknown }; } catch { return 'illisible'; }
  if (!env || typeof env !== 'object' || !env.data) return 'illisible';
  if (tropRecente(env.data, version)) return 'trop-recente';
  return valide(env.data) ? 'lisible' : 'illisible';
}

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
