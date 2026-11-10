// « Deux heures » (prototype du Récit d'Ilka, 10 novembre 2026) : ouvert depuis le menu, il ne touche pas à la partie.
// Pendant l'épreuve, l'application est en mode « recit » ; « Quitter » ramène au district.

import { basculer, nouvelleEpreuve, tenir } from '../core/recit-deux-heures';
import type { EcranRecit } from '../ui/recit';
import type { Clic, Suite } from './actions/commun';
import { app, D } from './etat';

export const RC: EcranRecit = { etat: nouvelleEpreuve(), intro: true };

export async function agirRecit(a: string, c: Clic): Promise<Suite> {
  switch (a) {
    case 'recit-ouvrir': RC.etat = nouvelleEpreuve(); RC.intro = true; D.menu = false; app.mode = 'recit'; window.scrollTo(0, 0); return 'afficher';
    case 'recit-commencer': RC.intro = false; window.scrollTo(0, 0); return 'afficher';
    case 'recit-rejouer': RC.etat = nouvelleEpreuve(); RC.intro = false; window.scrollTo(0, 0); return 'afficher';
    case 'recit-carte': basculer(RC.etat, c.id); return 'afficher';
    case 'recit-tenir': tenir(RC.etat); return 'afficher';
    case 'recit-quitter': app.mode = 'district'; window.scrollTo(0, 0); return 'afficher';
    default: return 'inconnu';
  }
}
