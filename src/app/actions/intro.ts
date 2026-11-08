// Actions de l'écran titre et de l'intro.

import { installer } from '../../ui/installer';
import { finPour } from '../combat';
import { app, apresTitre, compteEtat, D, K, titrePret } from '../etat';
import { avancerIntro, reculerIntro } from '../intro';
import { afficher } from '../rendu';
import { sauver } from '../synchro';
import { noterAge } from '../../save/age';
import type { Clic, Suite } from './commun';

export async function agirIntro(a: string, c: Clic): Promise<Suite> {
  const { ev } = c;
  switch (a) {
    // intro
    // l'âge, demandé une fois avant la toute première partie (8 novembre 2026)
    case 'age-debut-majeur': case 'age-jeune':
      noterAge(a === 'age-debut-majeur' ? 'majeur' : 'jeune');
      compteEtat.age = a === 'age-debut-majeur' ? 'majeur' : 'jeune';
      compteEtat.ageDemande = false;
      return agirIntro('titre-jouer', c);
    case 'titre-jouer':
      if (!titrePret()) return 'fin';
      if (!app.jeu.introVue && compteEtat.actif && !compteEtat.age && !compteEtat.utilisateur) { compteEtat.ageDemande = true; compteEtat.ouvert = false; break; }
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
    case 'titre-compte': if (compteEtat.ageDemande) { compteEtat.ageDemande = false; break; } compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; break;
    case 'installer': ev.stopPropagation(); await installer(); afficher(); return 'fin';
    case 'intro': app.introLongue = true; app.plan = 0; app.lignesVues = 1; app.texteCache = false; app.mode = 'intro'; D.menu = false; break;
    default: return 'inconnu';
  }
  return 'afficher';
}
