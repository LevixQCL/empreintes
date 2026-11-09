// Les options du joueur, gardées sur l'appareil (31 octobre 2026). Rien ici ne touche aux règles du jeu.

import { LANGUES, LANGUES_PUBLIEES, langue, type Langue } from '../core/i18n';

const CLE_AUTO = 'empreintes.combatAuto';

/** Le combat automatique (Strates déjà vaincues) : désactivé tant que le joueur ne l'allume pas dans le menu */
export const autoActif = (): boolean => { try { return localStorage.getItem(CLE_AUTO) === '1'; } catch { return false; } };

export function basculerAuto(): void {
  try { localStorage.setItem(CLE_AUTO, autoActif() ? '0' : '1'); } catch { /* stockage indisponible */ }
}

/**
 * La langue (9 novembre 2026) : le réglage n'apparaît que quand une autre langue est publiée, ou qu'on joue déjà
 * dans une autre (un testeur arrivé par ?langue=en peut revenir au français). Changer recharge la page :
 * les textes sont traduits au chargement des modules (voir src/entree.ts).
 */
export const langueReglable = (): boolean => LANGUES_PUBLIEES.length > 1 || langue() !== 'fr';
export const NOMS_LANGUES: Record<Langue, string> = { fr: 'Français', en: 'English' };
export function changerLangue(): void {
  const suivante = LANGUES[(LANGUES.indexOf(langue()) + 1) % LANGUES.length]!;
  const url = new URL(location.href);
  url.searchParams.set('langue', suivante);
  location.replace(url.toString());
}
