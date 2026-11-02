// Sauvegarde sur l'appareil. Le jeu solo marche entièrement sans réseau.

import { estJeuValide, type Jeu } from '../core/jeu';
import { tropRecente } from './garde';

const CLE = 'empreintes.jeu.v2';

export interface Enveloppe {
  data: Jeu;
  /** millisecondes depuis 1970, pour garder la plus récente entre l'appareil et le compte */
  updatedAt: number;
}

export function charger(): Enveloppe | null {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return null;
    const env = JSON.parse(brut) as Enveloppe;
    return estJeuValide(env.data) ? env : null;
  } catch {
    return null;
  }
}

/** La partie de l'appareil a été faite par une version plus récente du jeu (cet onglet est resté ouvert sur une ancienne version) */
export function stockeeTropRecente(): boolean {
  try {
    const brut = localStorage.getItem(CLE);
    return !!brut && tropRecente((JSON.parse(brut) as Enveloppe).data);
  } catch {
    return false;
  }
}

/** La clé de la partie : un autre onglet qui l'écrit est repéré par l'événement `storage` */
export const CLE_PARTIE = CLE;

export function enregistrer(data: Jeu, updatedAt = Date.now()): Enveloppe {
  const env = { data, updatedAt };
  // jamais par-dessus une partie d'une version plus récente : elle serait perdue
  if (stockeeTropRecente()) return env;
  try {
    localStorage.setItem(CLE, JSON.stringify(env));
  } catch {
    /* stockage plein ou bloqué : le jeu continue */
  }
  return env;
}

const SECOURS = 'empreintes.jeu.secours';

/** Garde une copie d'une sauvegarde qu'on va remplacer : rien n'est jamais perdu en changeant d'appareil */
export function garderSecours(env: Enveloppe): void {
  try { localStorage.setItem(SECOURS, JSON.stringify(env)); } catch { /* stockage plein ou bloqué */ }
}
export function lireSecours(): Enveloppe | null {
  try {
    const brut = localStorage.getItem(SECOURS);
    if (!brut) return null;
    const env = JSON.parse(brut) as Enveloppe;
    return estJeuValide(env.data) ? env : null;
  } catch { return null; }
}
