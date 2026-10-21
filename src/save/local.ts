// Sauvegarde sur l'appareil. Le jeu solo marche entièrement sans réseau.

import { estValide, type Expedition } from '../core/expedition';

const CLE = 'empreintes.sauvegarde';

export interface Enveloppe {
  data: Expedition;
  /** millisecondes depuis 1970, pour garder la plus récente entre l'appareil et le compte */
  updatedAt: number;
}

export function charger(): Enveloppe | null {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return null;
    const env = JSON.parse(brut) as Enveloppe;
    return estValide(env.data) ? env : null;
  } catch {
    return null;
  }
}

export function enregistrer(data: Expedition, updatedAt = Date.now()): Enveloppe {
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
