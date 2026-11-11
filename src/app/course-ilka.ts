// « Toutes les courses » (prototype du Récit d'Ilka, 11 novembre 2026) : ouverte depuis le menu, elle ne touche pas à la partie.
// Pendant la course, l'application est en mode « course » ; « Quitter » ramène au district.

import { laisserPasser, nouvelleCourse, poserCarte, prendreRaccourci, type Dir } from '../core/course-ilka';
import type { EcranCourse } from '../ui/course-ilka';
import type { Clic, Suite } from './actions/commun';
import { app, D } from './etat';

export const CI: EcranCourse = { etat: nouvelleCourse(), intro: true, choisie: null };

export async function agirCourse(a: string, c: Clic): Promise<Suite> {
  switch (a) {
    case 'course-ouvrir': CI.etat = nouvelleCourse(); CI.intro = true; CI.choisie = null; D.menu = false; app.mode = 'course'; window.scrollTo(0, 0); return 'afficher';
    case 'course-commencer': CI.intro = false; window.scrollTo(0, 0); return 'afficher';
    case 'course-rejouer': CI.etat = nouvelleCourse(); CI.intro = false; CI.choisie = null; window.scrollTo(0, 0); return 'afficher';
    case 'course-choisir': CI.choisie = CI.choisie === c.id ? null : c.id; return 'afficher';
    case 'course-poser': if (CI.choisie) poserCarte(CI.etat, CI.choisie, c.id as Dir); CI.choisie = null; return 'afficher';
    case 'course-raccourci': prendreRaccourci(CI.etat); CI.choisie = null; return 'afficher';
    case 'course-passer': laisserPasser(CI.etat); CI.choisie = null; return 'afficher';
    case 'course-quitter': app.mode = 'district'; window.scrollTo(0, 0); return 'afficher';
    default: return 'inconnu';
  }
}
