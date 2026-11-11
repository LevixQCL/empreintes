// Actions de l'écran titre et de l'intro.

import { installer } from '../../ui/installer';
import { changerLangue } from '../../ui/options';
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
      // moins de 13 ans avec une session déjà ouverte (8 novembre 2026, après-midi) : on la ferme, plus rien ne part en ligne ;
      // la partie reste sur l'appareil
      if (a === 'age-jeune' && compteEtat.utilisateur && app.compte) await app.compte.deconnexion().catch(() => {});
      return agirIntro('titre-jouer', c);
    case 'titre-jouer':
      if (!titrePret()) return 'fin';
      // l'âge, demandé une fois à tous (8 novembre 2026, après-midi : aussi aux joueurs déjà en route, compte ouvert ou non)
      if (compteEtat.actif && !compteEtat.age) { compteEtat.ageDemande = true; compteEtat.ouvert = false; break; }
      app.mode = apresTitre();
      if (app.mode === 'combat') K.fin = finPour();
      if (app.mode === 'intro') { app.recit = null; app.introLongue = false; app.plan = 0; app.lignesVues = 1; app.texteCache = false; }
      break;
    case 'intro-suivant': if (app.texteCache) app.texteCache = false; else avancerIntro(); break;
    case 'intro-precedent': app.texteCache = false; reculerIntro(); break;
    case 'intro-oeil': app.texteCache = !app.texteCache; break;
    case 'intro-passer':
      // la fin d'un Récit des origines : retour au district, sans toucher à l'intro
      if (app.recit) { app.recit = null; app.mode = 'district'; window.scrollTo(0, 0); break; }
      app.jeu.introVue = true;
      app.mode = app.jeu.expedition ? 'combat' : 'district';
      D.vue = app.jeu.chambre ? 'archipel' : 'rencontre';
      D.bulles = 0;
      sauver();
      break;
    case 'titre-compte': if (compteEtat.ageDemande) { compteEtat.ageDemande = false; break; } compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; break;
    case 'titre-langue': ev.stopPropagation(); sauver(); changerLangue(c.b.dataset.langue === 'en' ? 'en' : 'fr'); return 'fin';
    case 'installer': ev.stopPropagation(); await installer(); afficher(); return 'fin';
    case 'recit-ilka': app.recit = 'ilka'; app.introLongue = true; app.plan = 0; app.lignesVues = 1; app.texteCache = false; app.mode = 'intro'; D.menu = false; break;
    case 'intro': app.recit = null; app.introLongue = true; app.plan = 0; app.lignesVues = 1; app.texteCache = false; app.mode = 'intro'; D.menu = false; break;
    default: return 'inconnu';
  }
  return 'afficher';
}
