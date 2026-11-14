// Actions de l'écran titre et de l'intro.

import { installer } from '../../ui/installer';
import { changerLangue } from '../../ui/options';
import { finPour } from '../combat';
import { app, apresTitre, compteEtat, D, K, titrePret } from '../etat';
import { avancerIntro, filmActif, reculerIntro } from '../intro';
import { RECITS_ORIGINES, garderCarteRecit } from '../../core/jeu';
import { boutique, majCompteAchat, payer, recitOuvert } from '../boutique';
import { afficher } from '../rendu';
import { sauver } from '../synchro';
import { noterAge } from '../../save/age';
import { toucheAGauche, type Clic, type Suite } from './commun';
import { pleinEcran } from '../plein-ecran';

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
      if (app.mode === 'intro') { app.recit = null; app.introLongue = false; app.plan = 0; app.lignesVues = 1; app.texteCache = false; pleinEcran(true); }
      break;
    // toucher l'image : le premier tiers à gauche revient en arrière, le reste avance ; au tout dernier écran, on passe à la suite
    case 'intro-suivant': {
      if (app.texteCache) { app.texteCache = false; break; }
      if (c.b.classList.contains('intro') && toucheAGauche(c)) { reculerIntro(); break; }
      if (!avancerIntro()) return agirIntro('intro-passer', c);
      break;
    }
    case 'intro-precedent': app.texteCache = false; reculerIntro(); break;
    case 'intro-oeil': app.texteCache = !app.texteCache; break;
    case 'intro-passer':
      // la fin d'un Récit des origines : retour au district, sans toucher à l'intro
      // au bout du récit, la dernière scène : choisir la carte d'origine ; « Quitter » avant la fin ramène au district
      if (app.recit) {
        const fin = app.plan === (filmActif()?.plans.length ?? 1) - 1 && app.lignesVues >= (filmActif()?.plans[app.plan]?.lignes.length ?? 1);
        pleinEcran(false);
        if (fin && RECITS_ORIGINES[app.recit]) { app.recitChoix = true; window.scrollTo(0, 0); break; }
        app.recit = null; app.mode = 'district'; window.scrollTo(0, 0); break;
      }
      // la première fois, on reste en plein écran pour la rencontre, le briefing et le premier combat ; « Revoir l'intro » en sort
      if (app.introLongue) pleinEcran(false);
      app.jeu.introVue = true;
      app.mode = app.jeu.expedition ? 'combat' : 'district';
      D.vue = app.jeu.chambre ? 'archipel' : 'rencontre';
      D.bulles = 0;
      sauver();
      break;
    case 'titre-compte': if (compteEtat.ageDemande) { compteEtat.ageDemande = false; break; } compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; break;
    case 'titre-langue': ev.stopPropagation(); sauver(); changerLangue(c.b.dataset.langue === 'en' ? 'en' : 'fr'); return 'fin';
    case 'installer': ev.stopPropagation(); await installer(); afficher(); return 'fin';
    // un récit pas encore acquis (vente ouverte, src/app/boutique.ts) : ni lecture ni carte, la fiche déplie l'offre
    case 'recit-garder': if (app.recit && !recitOuvert(app.recit)) { app.recit = null; app.recitChoix = false; app.mode = 'district'; break; }
      if (app.recit) { const r = garderCarteRecit(app.jeu, app.recit, c.id); if (r.ok) sauver(); } break;
    case 'recit-quitter': app.recit = null; app.recitChoix = false; app.mode = 'district'; window.scrollTo(0, 0); break;
    case 'recit-acheter': if (!RECITS_ORIGINES[c.id] && c.id !== 'fond') break; majCompteAchat(); boutique.erreur = ''; boutique.offre = boutique.offre === c.id ? null : c.id; boutique.renonce = false; break;
    case 'achat-renonce': boutique.renonce = !boutique.renonce; boutique.erreur = ''; break;
    case 'achat-payer': await payer(c.id); break;
    case 'recit-fin': if (!recitOuvert(c.id)) { majCompteAchat(); boutique.offre = c.id; break; }
      app.recit = c.id; app.recitChoix = true; app.mode = 'intro'; D.menu = false; window.scrollTo(0, 0); break;
    case 'recit-lire': if (!RECITS_ORIGINES[c.id]) break;
      if (!recitOuvert(c.id)) { majCompteAchat(); boutique.offre = c.id; break; }
      app.recitChoix = false; app.recit = c.id; app.introLongue = true; app.plan = 0; app.lignesVues = 1; app.texteCache = false; app.mode = 'intro'; D.menu = false; pleinEcran(true); break;
    case 'intro': app.recit = null; app.introLongue = true; app.plan = 0; app.lignesVues = 1; app.texteCache = false; app.mode = 'intro'; D.menu = false; pleinEcran(true); break;
    default: return 'inconnu';
  }
  return 'afficher';
}
