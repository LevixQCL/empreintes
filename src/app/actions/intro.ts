// Actions de l'écran titre et de l'intro.

import { installer } from '../../ui/installer';
import { finPour } from '../combat';
import { app, apresTitre, compteEtat, D, K, titrePret } from '../etat';
import { avancerIntro, reculerIntro } from '../intro';
import { afficher } from '../rendu';
import { sauver } from '../synchro';
import type { Clic, Suite } from './commun';

export async function agirIntro(a: string, c: Clic): Promise<Suite> {
  const { ev } = c;
  switch (a) {
    // intro
    case 'titre-jouer':
      if (!titrePret()) return 'fin';
      app.mode = apresTitre();
      if (app.mode === 'combat') K.fin = finPour();
      if (app.mode === 'intro') { app.introLongue = false; app.plan = 0; app.lignesVues = 1; app.texteCache = false; }
      break;
    case 'intro-suivant': if (app.texteCache) app.texteCache = false; else avancerIntro(); break;
    case 'intro-precedent': app.texteCache = false; reculerIntro(); break;
    case 'intro-oeil': app.texteCache = !app.texteCache; break;
    case 'intro-passer':
      app.jeu.introVue = true;
      app.mode = app.jeu.expedition ? 'combat' : 'district';
      D.vue = app.jeu.chambre ? 'archipel' : 'rencontre';
      D.bulles = 0;
      sauver();
      break;
    case 'titre-compte': compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; break;
    case 'installer': ev.stopPropagation(); await installer(); afficher(); return 'fin';
    case 'intro': app.introLongue = true; app.plan = 0; app.lignesVues = 1; app.texteCache = false; app.mode = 'intro'; D.menu = false; break;
    default: return 'inconnu';
  }
  return 'afficher';
}
