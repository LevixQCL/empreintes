// Les options du joueur, gardées sur l'appareil (31 octobre 2026). Rien ici ne touche aux règles du jeu.

const CLE_AUTO = 'empreintes.combatAuto';

/** Le combat automatique (Strates déjà vaincues) : désactivé tant que le joueur ne l'allume pas dans le menu */
export const autoActif = (): boolean => { try { return localStorage.getItem(CLE_AUTO) === '1'; } catch { return false; } };

export function basculerAuto(): void {
  try { localStorage.setItem(CLE_AUTO, autoActif() ? '0' : '1'); } catch { /* stockage indisponible */ }
}
