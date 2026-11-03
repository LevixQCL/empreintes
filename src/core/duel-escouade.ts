// L'escouade qu'un directeur emmène en duel : son escouade active, PV pleins (niveau compris, sans l'Usure), ses cartes à leur niveau.
// À part de duel.ts pour que le moteur du duel n'ait pas besoin de toute la partie (il pourra tourner seul sur un serveur).

import { escouadeActive, escouadesDe, garnisonFleche, type Jeu } from './jeu';
import type { EscouadeDuel } from './duel';

export function escouadeDuelDe(j: Jeu, escouade: string[] = escouadesDe(j)[escouadeActive(j)] ?? []): EscouadeDuel {
  return { nom: j.directeur?.nom || 'Directeur', porteurs: garnisonFleche(j, escouade).porteurs };
}
