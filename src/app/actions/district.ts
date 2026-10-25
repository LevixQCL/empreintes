// Actions du district : bâtiments, Porteurs, cartes, escouade, départs, Chroniques.

import { moduleDe, moduleDef, porteurDef } from '../../core/donnees';
import * as J from '../../core/jeu';
import type { BatimentId } from '../../core/types';
import { visuel as ageDistrict } from '../../ui/art';
import { nbEtapes } from '../../ui/briefing';
import { NB_REPLIQUES } from '../../ui/district';
import type { OngletGuide } from '../../ui/guide';
import { finPour } from '../combat';
import { app, compteEtat, D, K, reduit } from '../etat';
import { sauver } from '../synchro';
import { ouvrir, resultat, type Clic, type Suite } from './commun';

export function agirDistrict(a: string, c: Clic): Suite {
  const { b, id } = c;
  switch (a) {
    case 'batiment': D.selection = D.selection === id ? null : (id as typeof D.selection); D.menu = false;
      if (b.dataset.amelio !== undefined) requestAnimationFrame(() => document.getElementById('fb-amelio')?.scrollIntoView({ block: 'start' }));
      break;
    case 'ok-message': D.message = ''; break;
    case 'ressource': D.ressource = id && D.ressource !== id ? (id as typeof D.ressource) : null; D.menu = false; D.selection = null; break;
    case 'menu': D.ressource = null; D.menu = !D.menu; D.selection = null; D.carte = null; D.deck = null; D.guide = null; D.porteur = null; break;
    // le mode d'emploi des cartes : ouvrir sur un onglet, changer d'onglet, fermer (district et combat)
    case 'guide': if (app.mode === 'combat') { K.guide = id as OngletGuide; K.regles = false; } else D.guide = id as OngletGuide; break;
    case 'guide-fermer': if (app.mode === 'combat') { K.guide = null; K.regles = true; } else D.guide = null; break;
    case 'carte': D.carte = id; break;
    case 'carte-fermer': D.carte = null; break;
    case 'filtre': D.filtre = (id as typeof D.filtre) || 'tout'; window.scrollTo(0, 0); break;
    case 'fermer': D.selection = null; break;
    case 'ameliorer': resultat(J.ameliorer(app.jeu, id as BatimentId, Date.now())); break;
    case 'poster': resultat(J.poster(app.jeu, id, (b.dataset.poste as J.Poste) ?? null)); break;
    case 'liberer': resultat(J.poster(app.jeu, id, null)); break;
    case 'acheter': resultat(J.acheter(app.jeu, Number(b.dataset.index ?? -1), Date.now())); break;
    case 'fabriquer': resultat(J.fabriquer(app.jeu, b.dataset.module ?? '', Date.now())); break;
    case 'cartes': ouvrir('cartes'); break;
    case 'porteurs': ouvrir('porteurs'); break;
    case 'porteur': D.porteur = id; D.deck = null; D.place = null; break;
    // « Mon escouade » (23 octobre 2026) : l'onglet Porteurs s'ouvre sur l'escouade ; « Tous les Porteurs » à part
    case 'porteurs-tous': D.reserve = true; D.place = null; D.porteur = null; D.deck = null; window.scrollTo(0, 0); break;
    case 'porteurs-escouade': D.reserve = false; D.porteur = null; D.deck = null; window.scrollTo(0, 0); break;
    case 'escouade-place': D.place = Number(b.dataset.index ?? 0); D.porteur = null; D.deck = null; break;
    case 'escouade-fermer': D.place = null; break;
    case 'escouade-mettre': {
      const r = J.placerDansEscouade(app.jeu, Number(b.dataset.index ?? 0), id);
      if (r.ok) J.marquerVus(app.jeu, 'porteurs', [id]);
      resultat(r);
      if (r.ok) D.place = null;
      break;
    }
    case 'porteur-fermer': D.porteur = null; break;
    case 'greffer': {
      // un Porteur déjà plein : on ouvre ses cartes pour qu'il en rende une
      const r = J.greffer(app.jeu, b.dataset.module ?? '', id);
      resultat(r);
      const plein = !r.ok && !!r.message?.includes(`${J.DISTRICT.cartesMax} cartes`);
      if (plein) { D.carte = null; D.deck = id; D.echange = b.dataset.module ?? null; D.message = `${porteurDef(id).nom} porte déjà ${J.DISTRICT.cartesMax} cartes : touche celle que ${moduleDef(b.dataset.module ?? '').nom} remplacera.`; }
      break;
    }
    case 'deck': D.deck = id; D.carte = null; D.echange = null; break;
    case 'deck-fermer': D.deck = null; D.echange = null; break;
    case 'degreffer': D.echange = null; resultat(J.degreffer(app.jeu, b.dataset.module ?? '')); break;
    // la feuille d'un Porteur : on choisit deux cartes (une portée, une à confier) et elles s'échangent
    case 'dk-annuler': D.echange = null; break;
    case 'dk-porte': case 'dk-libre': {
      const cle = b.dataset.module ?? '';
      const porte = app.jeu.porteurs[id]?.modules ?? [];
      const choisie = D.echange && app.jeu.collection[D.echange] ? D.echange : null;
      if (choisie === cle) { D.echange = null; break; }
      const autreCote = choisie && (porte.includes(choisie) !== (a === 'dk-porte'));
      if (choisie && autreCote) {
        const [retire, ajoute] = a === 'dk-porte' ? [cle, choisie] : [choisie, cle];
        const r = J.echanger(app.jeu, retire, ajoute, id);
        resultat(r);
        if (r.ok) D.echange = null;
        break;
      }
      // une carte à confier passe tout de suite s'il a une place libre (ou si elle remplace son autre métal)
      const plein = porte.length >= J.DISTRICT.cartesMax;
      const autreMetal = porte.some((k) => moduleDe(k) === moduleDe(cle));
      if (a === 'dk-libre' && (!plein || autreMetal)) { D.echange = null; resultat(J.greffer(app.jeu, cle, id)); break; }
      D.echange = cle;
      break;
    }
    case 'monter': resultat(J.monter(app.jeu, b.dataset.module ?? '')); break;
    case 'recycler': resultat(J.recycler(app.jeu, b.dataset.module ?? '')); break;
    case 'prendre': resultat(J.prendre(app.jeu, Number(b.dataset.index ?? 0))); break;
    case 'reclamer-jour': resultat(J.reclamerQuotidien(app.jeu)); break;
    case 'colis': {
      const r = J.ouvrirColis(app.jeu);
      resultat(r);
      if (r.colis) D.message = `Ravitaillement : +${r.colis.composants} composants${r.colis.doublon ? `, un doublon de ${moduleDef(r.colis.doublon).nom}` : ''}.${r.colis.choix ? ' Et une carte au choix !' : ''}`;
      break;
    }
    case 'ouvrir-archive': resultat(J.ouvrirArchive(app.jeu)); break;
    case 'entrer': ouvrir('coupe'); break;
    case 'vers-amelioration': document.getElementById('fb-amelio')?.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' }); return 'fin';
    case 'archipel': ouvrir('archipel'); break;
    case 'coupe': ouvrir('coupe'); break;
    case 'descendre': D.deck = null; D.fouille = null; D.epreuve = null; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.escouadePourDepart(app.jeu); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0); break;
    case 'fouiller-choix': D.deck = null; D.fouille = 'composants'; D.epreuve = null; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.escouadePourDepart(app.jeu); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0); break;
    case 'cible': D.fouille = id as typeof D.fouille; break;
    case 'epreuve': {
      const ep = J.epreuveDef(id);
      D.deck = null; D.fouille = null; D.epreuve = id; D.strateChoisie = J.strateEpreuve(app.jeu);
      D.escouade = J.escouadePourDepart(app.jeu, ep?.interdits ?? []); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'mission': resultat(J.envoyerMission(app.jeu, id, (b.dataset.duree as J.DureeMission) ?? 'courte', Date.now())); break;
    case 'choisir':
      if (D.escouade.includes(id)) D.escouade = D.escouade.filter((p) => p !== id);
      else if (D.escouade.length < 3) D.escouade = [...D.escouade, id];
      else D.message = 'Trois Porteurs maximum : retires-en un d’abord.';
      break;
    case 'partir': {
      const r = D.epreuve ? J.partirEpreuve(app.jeu, D.escouade, D.epreuve, Date.now())
        : D.fouille ? J.fouiller(app.jeu, D.escouade, D.strateChoisie, D.fouille)
          : J.partir(app.jeu, D.escouade, D.strateChoisie);
      resultat(r);
      if (r.ok) { app.mode = 'combat'; K.fin = null; K.etat = null; window.scrollTo(0, 0); }
      break;
    }
    case 'reprendre': app.mode = 'combat'; K.fin = finPour(); break;
    case 'rencontre': D.vue = 'rencontre'; D.bulles = 0; break;
    case 'rencontre-suite': D.bulles = Math.min(D.bulles + 1, NB_REPLIQUES); break;
    case 'briefing': D.vue = 'briefing'; D.etape = 0; window.scrollTo(0, 0); break;
    case 'briefing-suite': D.etape = Math.min(D.etape + 1, nbEtapes('chambre') - 1); break;
    case 'briefing-retour': D.etape = Math.max(D.etape - 1, 0); break;
    // « Ton district » : à l'arrivée après la chambre, et depuis le menu
    case 'accueil': ouvrir('accueil'); D.etape = 0; window.scrollTo(0, 0); break;
    case 'accueil-suite': D.etape = Math.min(D.etape + 1, nbEtapes('district') - 1); break;
    case 'accueil-retour': D.etape = Math.max(D.etape - 1, 0); break;
    case 'accueil-fin': ouvrir('archipel'); if (id === 'generateur') D.selection = 'generateur'; window.scrollTo(0, 0); break;
    case 'codex':
    case 'bibliotheque':
      D.retourBiblio = app.mode === 'titre' ? 'titre' : D.vue === 'coupe' ? 'coupe' : 'archipel';
      if (app.mode === 'titre') app.mode = 'district';
      ouvrir('codex'); D.chapitre = null; window.scrollTo(0, 0);
      break;
    case 'biblio-onglet': D.onglet = id === 'archives' ? 'archives' : 'chroniques'; D.chapitre = null; break;
    case 'chapitre':
      D.onglet = 'chroniques'; D.chapitre = id;
      if (!app.jeu.lus.includes(id) || !app.jeu.luesRecompensees.includes(id)) {
        const carte = J.lireChapitre(app.jeu, id);
        if (carte) D.message = `Ysé glisse une carte entre les pages : ${moduleDef(carte).nom} (Fer) rejoint tes Cartes.`;
        sauver();
      }
      window.scrollTo(0, 0);
      break;
    case 'chapitre-fermer': D.chapitre = null; window.scrollTo(0, 0); break;
    case 'biblio-retour':
      D.chapitre = null;
      // revenu à l'écran titre, « Reprendre » doit ramener au district, pas à la Bibliothèque
      if (D.retourBiblio === 'titre') { app.mode = 'titre'; ouvrir('archipel'); }
      else ouvrir(D.retourBiblio);
      break;
    case 'ouvrir-chambre': {
      const r = J.ouvrirChambre(app.jeu);
      resultat(r);
      if (r.ok) { app.mode = 'combat'; K.fin = null; K.etat = null; window.scrollTo(0, 0); }
      break;
    }
    case 'reclamer': resultat(J.reclamer(app.jeu)); break;
    case 'decider': resultat(J.decider(app.jeu, b.dataset.acte ?? 'chambre', id)); break;
    case 'retour-ok': D.retour = []; break;
    case 'rappel-plus-tard': D.rappel = false; break;
    case 'rappel-proteger': D.rappel = false; D.menu = true; compteEtat.ouvert = true; compteEtat.erreur = ''; compteEtat.info = ''; break;

    case 'age-ok': app.jeu.ageVu = Math.max(app.jeu.ageVu ?? 1, ageDistrict(app.jeu.batiments.noyau)); sauver(); break;
    case 'objectif-aller':
      // l'objectif du jour emmène là où il se remplit
      if (id === 'chantier') { ouvrir('archipel'); D.selection = J.batimentConseille(app.jeu); }
      else ouvrir('coupe');
      break;
    case 'objectif-guide': {
      // l'objectif guidé emmène là où il se fait : son bâtiment sur le district, sinon son onglet
      const o = J.objectifCourant(app.jeu);
      if (!o) break;
      ouvrir(o.onglet);
      if (o.onglet === 'archipel' && o.pilier) D.selection = o.pilier;
      break;
    }
    case 'tri':
      if (id === 'puissance' || id === 'metal' || id === 'niveau') {
        D.tri = id;
        try { localStorage.setItem('empreintes.tri', id); } catch { /* stockage bloqué */ }
      }
      break;
    case 'panneau':
      D.panneauReplie = D.panneauReplie === false;
      try { localStorage.setItem('empreintes.panneau', D.panneauReplie ? 'replie' : 'ouvert'); } catch { /* stockage bloqué */ }
      break;
    default: return 'inconnu';
  }
  return 'afficher';
}
