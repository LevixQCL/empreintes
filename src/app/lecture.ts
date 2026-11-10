// Les Lectures (prototype du 11 novembre 2026) : ouvertes depuis le menu, elles ne touchent pas à la partie.
// Pendant une Lecture, l'application est en mode « lecture » ; « Quitter » ramène au district.

import { lire, nouvelleLecture, poser, toucherFil } from '../core/lectures';
import type { EcranLecture } from '../ui/lecture';
import type { Clic, Suite } from './actions/commun';
import { app, D } from './etat';

export const LC: EcranLecture = { etat: nouvelleLecture(), intro: true };

export async function agirLecture(a: string, c: Clic): Promise<Suite> {
  switch (a) {
    case 'lecture-ouvrir': LC.etat = nouvelleLecture(); LC.intro = true; D.menu = false; app.mode = 'lecture'; window.scrollTo(0, 0); return 'afficher';
    case 'lecture-commencer': LC.intro = false; window.scrollTo(0, 0); return 'afficher';
    case 'lecture-rejouer': LC.etat = nouvelleLecture(); LC.intro = false; window.scrollTo(0, 0); return 'afficher';
    case 'lecture-poser': poser(LC.etat, c.id); return 'afficher';
    case 'lecture-fil': toucherFil(LC.etat, Number(c.id)); return 'afficher';
    case 'lecture-lire': lire(LC.etat); return 'afficher';
    case 'lecture-quitter': app.mode = 'district'; window.scrollTo(0, 0); return 'afficher';
    default: return 'inconnu';
  }
}
