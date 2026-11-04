// Sauvegarde sur l'appareil. Le jeu solo marche entièrement sans réseau.

import { estJeuValide, type Jeu } from '../core/jeu';
import { etatStocke, tropRecente } from './garde';

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

let ecriteIci = false;

/** Une partie est là, mais cette version du jeu ne sait pas la lire : on n'écrit jamais par-dessus */
export function stockeeIllisible(): boolean {
  try { return etatStocke(localStorage.getItem(CLE), estJeuValide) === 'illisible'; } catch { return false; }
}

/** Dernier recours, choisi par le joueur : la partie illisible part à l'abri sous une autre clé (jamais effacée), l'emplacement se libère */
export function mettreDeCoteIllisible(): void {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return;
    localStorage.setItem(`${CLE}.illisible.${Date.now()}`, brut);
    localStorage.removeItem(CLE);
  } catch { /* stockage bloqué : on ne touche à rien */ }
}

/** La clé de la partie : un autre onglet qui l'écrit est repéré par l'événement `storage` */
export const CLE_PARTIE = CLE;

export function enregistrer(data: Jeu, updatedAt = Date.now()): Enveloppe {
  const env = { data, updatedAt };
  // jamais par-dessus une partie d'une version plus récente : elle serait perdue
  // la vérification complète (relire la partie stockée) une seule fois : ensuite, c'est cette page qui l'a écrite
  if (stockeeTropRecente() || (!ecriteIci && stockeeIllisible())) return env;
  try {
    localStorage.setItem(CLE, JSON.stringify(env));
    ecriteIci = true;
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
