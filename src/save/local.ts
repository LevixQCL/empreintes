// Sauvegarde sur l'appareil. Le jeu solo marche entièrement sans réseau.

import { estJeuValide, type Jeu } from '../core/jeu';

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

export function enregistrer(data: Jeu, updatedAt = Date.now()): Enveloppe {
  const env = { data, updatedAt };
  try {
    localStorage.setItem(CLE, JSON.stringify(env));
  } catch {
    /* stockage plein ou bloqué : le jeu continue */
  }
  return env;
}

export function effacer(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
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
