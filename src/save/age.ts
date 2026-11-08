// L'âge minimum (8 novembre 2026) : en Belgique, on consent seul au traitement de ses données en ligne à partir de 13 ans.
// Au premier lancement, le joueur dit s'il a 13 ans ou plus. En dessous, il joue quand même, mais sans rien en ligne :
// pas de compte (même invisible), pas de Grand Tableau, pas de Cercle ; sa partie reste sur l'appareil.
// Le choix est gardé sur l'appareil (pas dans la partie). Les joueurs d'avant cette règle, qui ont déjà un compte, ne sont pas redemandés.

const CLE = 'empreintes.age';

export type Age = 'majeur' | 'jeune';

export function lireAge(): Age | null {
  try { const v = localStorage.getItem(CLE); return v === 'majeur' || v === 'jeune' ? v : null; } catch { return null; }
}

export function noterAge(a: Age): void {
  try { localStorage.setItem(CLE, a); } catch { /* stockage indisponible */ }
}

/** Le jeu peut-il créer ou relier un compte en ligne ? (pas si le joueur a dit avoir moins de 13 ans) */
export const enLignePermis = () => lireAge() !== 'jeune';

/** Tout effacer de cet appareil (suppression du compte) : la partie, son secours et les réglages du jeu */
export function effacerAppareil(): void {
  try {
    const cles: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('empreintes')) cles.push(k); }
    for (const k of cles) localStorage.removeItem(k);
  } catch { /* stockage indisponible */ }
}
