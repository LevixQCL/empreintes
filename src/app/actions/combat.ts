// Actions du combat et de l'exploration des Strates.

import { envoyerPillages } from '../pillages';
import { NOMS_RARETE } from '../../core/collection';
import * as C from '../../core/combat';
import { moduleDef, porteurDef } from '../../core/donnees';
import * as J from '../../core/jeu';
import { comparer, montrer, relever } from '../../ui/gains';
import { basculerSon, debloquerSon } from '../../ui/impact';
import { vibrer } from '../../ui/toucher';
import { jouer, jouerFuite } from '../combat';
import { app, D, K } from '../etat';
import { afficher } from '../rendu';
import { sauver } from '../synchro';
import type { Clic, Suite } from './commun';

export async function agirCombat(a: string, c: Clic): Promise<Suite> {
  const { b, id, x, s, avantGains } = c;
  switch (a) {
    case 'ajouter': if (s && !K.verrou) { C.ajouter(s, id || b.dataset.uid || ''); vibrer(5); sauver(); } break;
    case 'retirer': if (s && !K.verrou) { C.retirer(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'accorder': if (s && !K.verrou) { C.accorder(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'cibler': if (s && !K.verrou) { C.cibler(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'viser': if (s && !K.verrou) { C.viser(s, Number(b.dataset.id)); sauver(); } break;
    case 'eclats': K.eclats = !K.eclats; break;
    case 'eclat': if (s && !K.verrou) {
      K.eclats = false; debloquerSon(); vibrer([20, 40, 30]);
      const lignee = C.eclatsPossibles(s).find((x) => x.porteur === b.dataset.id)?.lignee;
      if (lignee) J.noterEclat(app.jeu, s, lignee);
      await jouer(C.eclater(s, b.dataset.id ?? '')); sauver();
    } break;
    case 'decouverte-ok': { const id = b.dataset.id ?? ''; if (id && !(app.jeu.decouvertes ??= []).includes(id)) app.jeu.decouvertes.push(id); sauver(); break; }
    case 'vider': if (s && !K.verrou) { C.viderChaine(s); sauver(); } break;
    case 'allonger': if (s && !K.verrou) { C.allonger(s); sauver(); } break;
    case 'relancer': if (s && !K.verrou) { C.relancerMain(s); vibrer(8); sauver(); } break;
    case 'repiocher': if (s && !K.verrou) { C.repiocher(s); sauver(); } break;
    case 'lancer': if (s && !K.verrou) { debloquerSon(); J.noterChaine(app.jeu, s.chaine); await jouer(C.lancer(s)); montrer(comparer(avantGains, relever(app.jeu))); return 'fin'; } break;
    case 'regles': K.regles = !K.regles; K.fuite = false; K.guide = null; K.journal = null; break;
    case 'fuir': if (!K.verrou) { K.fuite = !K.fuite; K.regles = false; K.guide = null; K.journal = null; } break;
    // le journal du combat : les piles l'ouvrent sur la défausse, la dernière ligne du journal et la fin du combat sur les tours
    case 'journal': if (!K.verrou) { K.journal = K.journal ? null : id === 'cartes' ? 'cartes' : 'tours'; K.regles = false; K.fuite = false; K.guide = null; K.eclats = false; } break;
    case 'journal-onglet': if (K.journal) K.journal = id === 'cartes' ? 'cartes' : 'tours'; break;
    case 'fuir-salle': {
      if (K.verrou || !x) break;
      await jouerFuite();
      const r = J.fuirSalle(app.jeu);
      if (!r.ok) { D.message = r.message ?? ''; afficher(); return 'fin'; }
      K.fin = null; K.etat = null; sauver(); window.scrollTo(0, 0);
      break;
    }
    case 'son': basculerSon(); break;
    case 'suivant': J.continuer(app.jeu); K.fin = null; sauver(); window.scrollTo(0, 0); break;
    case 'salle': {
      const r = J.entrer(app.jeu, Number(id));
      if (!r.ok && app.jeu.expedition) app.jeu.expedition.recit = r.message ?? '';
      K.fin = null; K.etat = null; sauver(); window.scrollTo(0, 0);
      break;
    }
    case 'repondre': {
      const r = J.repondre(app.jeu, Number(id));
      if (!r.ok && app.jeu.expedition) app.jeu.expedition.recit = r.message ?? '';
      K.fin = null; K.etat = null; sauver();
      break;
    }
    case 'retraite':
      if (!J.retraite(app.jeu).ok) break;
    // falls through : remonter avec le butin
    case 'fuir-district':
      if (a === 'fuir-district') {
        if (K.verrou || !x) break;
        await jouerFuite();
        if (!J.fuir(app.jeu).ok) break;
      }
    // falls through : remonter avec 75 % du butin
    case 'remonter': {
      const r = J.remonter(app.jeu);
      K.fin = null;
      app.mode = 'district';
      if (r.tutoriel) {
        D.vue = r.victoire ? 'accueil' : 'archipel';
        D.etape = 0;
        D.message = r.victoire
          ? 'La chambre est ouverte. Derrière la porte, une carte : l’Œil-relais. Trois recrues rejoignent le district, et un premier fragment d’archives attend dans les Chroniques (onglet Archives).'
          : 'L’escouade se repose. La porte scellée t’attend toujours.';
      } else if (r.pillage) {
        const p = r.pillage;
        D.vue = 'pillages';
        envoyerPillages();
        D.message = p.victoire ? `Pillage réussi à ${p.nom} : +${p.gain} composants, rangés dans ton coffre.`
          : `Repoussés à ${p.nom}.${p.perte ? ` L’escouade a laissé ${p.perte} composants de son coffre.` : ''}`;
      } else {
        const fuite = r.fuite ? `L’escouade a fui : elle rentre épuisée (+${J.DISTRICT.usureFuite} d’Usure chacun). ` : '';
        D.vue = app.jeu.choix.length ? 'archipel' : 'coupe';
        const manque = J.manquePourCreuser(app.jeu);
        D.message = fuite + (r.nouvelleStrate ? `Un nouvel étage est creusé : la Strate −${app.jeu.strate} est ouverte.`
          : r.victoire && manque && app.jeu.frontVaincu && r.butin >= 0 && J.strateVaincue(app.jeu) === app.jeu.strate
            ? `Le gardien est vaincu, mais l’étage suivant attend : ${manque.creuseurs ? `il manque ${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}` : ''}${manque.creuseurs && manque.noyau ? ' et ' : ''}${manque.noyau ? `la Tour du Noyau doit passer au niveau ${J.noyauRequis(app.jeu.strate + 1)}` : ''}. +${r.butin} composants rapportés.`
            : `+${r.butin} composants rapportés.`)
          + (r.cartes.length ? ` Carte${r.cartes.length > 1 ? 's' : ''} trouvée${r.cartes.length > 1 ? 's' : ''} : ${r.cartes.map((c) => `${moduleDef(c).nom} (${NOMS_RARETE[moduleDef(c).rarete]})`).join(', ')}.` : '')
          + (r.eclats ? ` +${r.eclats} Éclat${r.eclats > 1 ? 's' : ''}.` : '')
          + (r.fragment ? ' Un fragment d’archives rejoint le Codex.' : '')
          + (r.xp?.length ? ` +${r.xp[0]!.xp} XP pour l’escouade.${r.xp.filter((e) => e.niveau).map((e) => ` ${porteurDef(e.id).nom} passe au niveau ${e.niveau} !`).join('')}` : '');
      }
      sauver();
      window.scrollTo(0, 0);
      break;
    }
    default: return 'inconnu';
  }
  return 'afficher';
}
