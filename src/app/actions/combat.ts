// Actions du combat et de l'exploration des Strates.

import { envoyerPillages } from '../pillages';
import { envoyerAssauts, synchroGarde } from '../fleche';
import * as C from '../../core/combat';
import * as J from '../../core/jeu';
import { suitePorte } from '../../core/expedition';
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
  // le choix « protéger ou soigner » d'une tuile se referme dès qu'on fait autre chose
  if (a !== 'tuile') K.tuile = undefined;
  switch (a) {
    case 'ajouter': if (s && !K.verrou) { C.ajouter(s, id || b.dataset.uid || ''); vibrer(5); sauver(); } break;
    case 'retirer': if (s && !K.verrou) { C.retirer(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'accorder': if (s && !K.verrou) { C.accorder(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'proteger': if (s && !K.verrou) { C.proteger(s, id || b.dataset.id || ''); K.tuile = undefined; vibrer(5); sauver(); } break;
    case 'soigner': if (s && !K.verrou) { C.soignerVers(s, id || b.dataset.id || ''); K.tuile = undefined; vibrer(5); sauver(); } break;
    // bouclier et soin à répartir : le toucher ouvre un petit choix sur la tuile (toucher à nouveau le referme)
    case 'tuile': if (s && !K.verrou) { const p = id || b.dataset.id || ''; K.tuile = K.tuile === p ? undefined : p; } break;
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
    case 'lancer': if (s && !K.verrou) { debloquerSon(); J.noterChaine(app.jeu, s.chaine); await jouer(C.lancer(s)); if (avantGains) montrer(comparer(avantGains, relever(app.jeu))); return 'fin'; } break;
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
    // le plan de la Strate : toucher une salle ouvre sa fiche (ou la referme), « Entrer » y va
    case 'salle-voir': { const n = Number(id); K.salleVue = n >= 0 && K.salleVue !== n ? n : undefined; break; }
    case 'salle': {
      K.salleVue = undefined; K.halteVus = []; K.porteChoix = [];
      const r = J.entrer(app.jeu, Number(id), b.dataset.second === '1');
      if (!r.ok && app.jeu.expedition) app.jeu.expedition.recit = r.message ?? '';
      K.fin = null; K.etat = null; sauver(); window.scrollTo(0, 0);
      break;
    }
    // le contenu des Strates (31 octobre 2026) : la Halte, les portes à Fréquence, les passages secrets
    case 'halte-detail': { const k = Number(id); if (!(K.halteVus ??= []).includes(k)) K.halteVus.push(k); vibrer(5); break; }
    case 'halte-choix': {
      const r = J.choisirHalte(app.jeu, Number(id));
      if (!r.ok && app.jeu.expedition) app.jeu.expedition.recit = r.message ?? '';
      K.halteVus = []; sauver(); window.scrollTo(0, 0);
     
      break;
    }
    case 'porte-carte': {
      const k = Number(id);
      const n = x ? suitePorte(x.strate) : 3;
      const l = (K.porteChoix ??= []);
      if (l.includes(k)) K.porteChoix = l.filter((i) => i !== k);
      else if (l.length < n) l.push(k);
      vibrer(5);
      break;
    }
    case 'porte-ouvrir': {
      const r = J.ouvrirPorte(app.jeu, K.porteChoix ?? []);
      if (!r.ok) { if (app.jeu.expedition) app.jeu.expedition.recit = r.message ?? ''; D.message = r.message ?? ''; }
      else { K.porteChoix = []; vibrer([10, 30, 20]); sauver(); }
      break;
    }
    case 'porte-relancer': if (J.relancerPorte(app.jeu).ok) { K.porteChoix = []; sauver(); } break;
    case 'porte-passer': if (J.passerPorte(app.jeu).ok) { K.porteChoix = []; sauver(); } break;
    case 'passage': {
      const r = J.suivrePassage(app.jeu);
      if (r.ok) { sauver(); window.scrollTo(0, 0); }
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
      // pour le rapport d'expédition : ce que le joueur avait avant de remonter
      const avant = { cartes: new Set(Object.keys(app.jeu.collection)), choix: app.jeu.choix.length, creuseurs: app.jeu.creuseurs ?? 0 };
      const xr = app.jeu.expedition;
      const issue = !xr ? 'retraite' : xr.fuite ? 'fuite' : xr.retraite ? 'retraite' : xr.combat.issue === 'defaite' ? 'defaite' : xr.terminee && xr.combat.issue === 'victoire' ? 'victoire' : 'retraite';
      const type = !xr ? 'Descente' : xr.fouille ? `Fouille · ${J.CIBLES_FOUILLE[xr.fouille].nom.toLowerCase()}` : xr.epreuve ? `Épreuve · ${J.epreuveDef(xr.epreuve)?.nom ?? ''}` : 'Descente';
      const strate = xr?.strate ?? 1;
      const r = J.remonter(app.jeu);
      K.fin = null;
      app.mode = 'district';
      if (r.tutoriel) {
        D.vue = r.victoire ? 'accueil' : 'archipel';
        D.etape = 0;
        D.message = r.victoire
          ? 'La chambre est ouverte. Derrière la porte, une carte : l’Œil-relais. Trois recrues rejoignent le district, et un premier fragment d’archives attend dans les Chroniques (onglet Archives).'
          : 'L’escouade se repose. La porte scellée t’attend toujours.';
      } else if (r.fleche) {
        const f = r.fleche;
        D.vue = 'fleche'; D.fleche = false;
        D.defi = null;
        envoyerAssauts();
        if (f.defi) synchroGarde();
        D.message = f.defi ? (f.victoire ? `${f.defi.nom} est battu : ton escouade tient désormais le quai ${f.defi.quai}.` : `${f.defi.nom} garde le quai ${f.defi.quai}. Ta montée ne bouge pas.`)
          : f.victoire
          ? `Quai ${f.a} atteint${f.record ? ' : nouveau record' : ''}.${f.paliers.map((p) => ` Quai gravé ${p.quai} : +${p.composants} composants, +${p.eclats} Éclats.`).join('')}`
          : f.a < f.de ? `Repoussés au quai ${f.de} : l’escouade redescend au quai ${f.a}.` : `Repoussés au quai ${f.de} : l’escouade garde son quai.`;
      } else if (r.pillage) {
        const p = r.pillage;
        D.vue = 'pillages';
        envoyerPillages();
        D.message = p.victoire ? `Pillage réussi à ${p.nom} : +${p.gain} composants, rangés dans ton coffre.`
          : `Repoussés à ${p.nom}.${p.perte ? ` L’escouade a laissé ${p.perte} composants de son coffre.` : ''}`;
      } else {
        D.vue = app.jeu.choix.length ? 'archipel' : 'coupe';
        const manque = J.manquePourCreuser(app.jeu);
        const note = (r.fuite ? `L’escouade a fui : elle rentre épuisée (+${J.DISTRICT.usureFuite} d’Usure chacun). ` : '')
          + (r.nouvelleStrate ? `Un nouvel étage est creusé : la Strate −${app.jeu.strate} est ouverte.`
          : r.victoire && manque && app.jeu.frontVaincu && J.strateVaincue(app.jeu) === app.jeu.strate
            ? `Le gardien est vaincu, mais l’étage suivant attend : ${manque.creuseurs ? `il manque ${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}` : ''}${manque.creuseurs && manque.noyau ? ' et ' : ''}${manque.noyau ? `la Tour du Noyau doit passer au niveau ${J.noyauRequis(app.jeu.strate + 1)}` : ''}.`
            : '')
          + (r.quete?.finie && r.quete.fin ? ` ${r.quete.fin}` : '');
        // le rapport d'expédition (31 octobre 2026) remplace la longue phrase du bandeau
        D.message = '';
        D.expedition = {
          type, strate, issue, retour: r, note: note.trim(),
          nouvelles: [...new Set(r.cartes)].filter((c) => !avant.cartes.has(c)),
          choix: Math.max(0, app.jeu.choix.length - avant.choix),
          creuseurs: Math.max(0, (app.jeu.creuseurs ?? 0) - avant.creuseurs),
        };
      }
      sauver();
      window.scrollTo(0, 0);
      break;
    }
    default: return 'inconnu';
  }
  return 'afficher';
}

