// Actions du district : bâtiments, Porteurs, cartes, escouade, départs, Chroniques.

import { cartePillages, portOuvert } from '../../ui/acces';
import { cibleRevanche, lireCiblesEnLigne, planifierGarnison, sousBouclier } from '../pillages';
import { lancerPillage } from '../duel';
import { relireVitrines, suivreCercle } from '../cercle';
import { afficher } from '../rendu';
import { cibleDefi, lireGardiensEnLigne, recevoirAssauts, synchroGarde } from '../fleche';
import { moduleDe, moduleDef, porteurDef, deNom } from '../../core/donnees';
import { NOMS_RARETE, estTri, poidsCarte } from '../../core/collection';
import * as J from '../../core/jeu';
import type { BatimentId } from '../../core/types';
import { visuel as ageDistrict } from '../../ui/art';
import { nbEtapes } from '../../ui/briefing';
import { VISITE, toucherVisite } from '../../ui/visite';
import { NB_REPLIQUES } from '../../ui/district';
import { contratAffiche, equipeAffichee } from '../../ui/marees';
import type { OngletGuide } from '../../ui/guide';
import { finPour } from '../combat';
import { rafraichirVille } from '../ville';
import { app, compteEtat, D, G, K, racine } from '../etat';
import { sauver } from '../synchro';
import { ouvrir, resultat, toucheAGauche, type Clic, type Suite } from './commun';
import { t } from '../../core/i18n';

/** Le pseudo, une fois, à une recrue connectée qui n'en a pas (la fenêtre s'ouvre par-dessus l'écran du moment) */
function demanderPseudo() {
  if (!app.uid || app.jeu.directeur?.nom || app.jeu.pseudoPropose || app.pseudoDemande) return;
  app.pseudoDemande = true; app.jeu.pseudoPropose = true; G.edition = true; G.accueil = true; G.erreur = '';
}

export async function agirDistrict(a: string, c: Clic): Promise<Suite> {
  // une bulle dépliée se replie dès qu'on fait autre chose (sauf la toucher elle-même)
  if (a !== 'bulle') D.bulle = null;
  const { b, id } = c;
  switch (a) {
    // le Port ouvert (plaque ou bateau peint) : le bateau part vers les archipels voisins
    case 'batiment': if (id === 'port' && portOuvert(app.jeu)) { ouvrir('pillages'); D.portAide = false; lireCiblesEnLigne(); break; }
      // le Cercle des quais construit : son écran directement (le bâtiment s'ouvre de là, bouton du haut)
      if (id === 'cercle' && J.cercleOuvert(app.jeu) && app.jeu.batiments.cercle && D.selection !== 'cercle') { ouvrir('cercle'); afficher(); await suivreCercle(); relireVitrines(); return 'fin'; }
      D.selection = D.selection === id ? null : (id as typeof D.selection); D.menu = false; D.posteChanger = false; D.tourChanger = false; D.porteursTous = false;
      // « Voir la Tour », « Améliorer la Tour » : la feuille s'ouvre sur l'onglet du niveau suivant
      D.ongletBat = b.dataset.amelio !== undefined ? 'niveau' : 'salle';
      break;
    case 'ok-message': D.message = ''; break;
    // la moitié pétrifiée du médaillon (12 novembre 2026) : la Flèche existe, mais elle dort encore
    case 'fleche-scellee': D.message = t('La Flèche dort encore au-dessus de la ville. Continue de descendre : elle se réveillera.'); break;
    case 'ressource': D.ressource = id && D.ressource !== id ? (id as typeof D.ressource) : null; D.menu = false; D.selection = null; break;
    // la fiche du directeur (29 octobre 2026) : le cristal du rail, le médaillon de la barre du haut
    case 'fiche': D.fiche = !D.fiche; D.ressource = null; D.menu = false; D.selection = null; D.bulle = null; break;
    // récupérer depuis la fiche : on revient au district, où la récompense se montre (carte au choix, animation des gains)
    case 'fiche-prendre':
      ouvrir('archipel');
      if (id === 'guide') resultat(J.reclamer(app.jeu));
      else if (id === 'jour') resultat(J.reclamerQuotidien(app.jeu));
      else if (id === 'butin') resultat(J.ouvrirArchive(app.jeu));
      else if (id === 'colis') {
        const r = J.ouvrirColis(app.jeu);
        resultat(r);
        if (r.colis) D.message = t`Ravitaillement : +${r.colis.composants} cristaux${r.colis.doublon ? t`, un doublon ${deNom(moduleDef(r.colis.doublon).nom)}` : ''}.${r.colis.choix ? t(' Et une carte au choix !') : ''}`;
      }
      break;
    case 'menu': D.ressource = null; D.menu = !D.menu; D.selection = null; D.carte = null; D.deck = null; D.guide = null; D.porteur = null; break;
    // le mode d'emploi des cartes : ouvrir sur un onglet, changer d'onglet, fermer (district et combat)
    case 'guide': if (app.mode === 'combat') { K.guide = id as OngletGuide; K.regles = false; } else { D.guide = id as OngletGuide; D.menu = false; D.ressource = null; } break;
    case 'guide-fermer': if (app.mode === 'combat') { K.guide = null; K.regles = true; } else D.guide = null; break;
    case 'carte': D.carte = id; D.ongletFiche = null; break;
    case 'carte-fermer': D.carte = null; break;
    // depuis le détail d'une carte commune : le bâtiment qui la fait grandir (31 octobre 2026)
    case 'commune-batiment': ouvrir('archipel'); D.selection = id as typeof D.selection; break;
    case 'filtre': D.filtre = (id as typeof D.filtre) || 'tout'; window.scrollTo(0, 0); break;
    case 'fermer': D.selection = null; D.confirmeSeance = null; if (D.pseudoApresPoste) { D.pseudoApresPoste = false; demanderPseudo(); } break;
    case 'ameliorer': resultat(J.ameliorer(app.jeu, id as BatimentId, Date.now())); break;
    case 'poster':
      // à l'entraînement : on prévient avant d'arrêter la séance (14 novembre 2026)
      if ((b.dataset.poste ?? 'noyau') !== 'noyau' && J.seanceDe(app.jeu, id) && !b.dataset.confirme) { D.confirmeSeance = id; break; }
      D.confirmeSeance = null;
      if (D.pseudoApresPoste) { D.pseudoApresPoste = false; demanderPseudo(); }
      resultat(J.poster(app.jeu, id, (b.dataset.poste as J.Poste) ?? null)); D.posteChanger = false; D.tourChanger = false; break;
    case 'seance-garder': D.confirmeSeance = null; break;
    case 'liberer': resultat(J.poster(app.jeu, id, null)); break;
    // secourir une famille, au Port (12 novembre 2026)
    case 'basses-lieu': D.bassesLieu = D.bassesLieu === id ? null : id; D.choixTous = false; break;
    case 'basses-envoyer': if (D.bassesLieu) { const r = J.envoyerBasses(app.jeu, D.bassesLieu, id, Date.now()); resultat(r); if (r.ok) { D.bassesLieu = null; D.message = t`${porteurDef(id).nom} part secourir une famille.`; } } break;
    // l'Exode, sur la digue (10 novembre 2026)
    case 'exode': D.exode = !D.exode; D.exodeAide = false; D.selection = null; D.ressource = null; D.menu = false; break;
    case 'exode-entrer': J.etatExode(app.jeu).vu = true; D.exodeAide = false; sauver(); break;
    case 'exode-aide': D.exodeAide = !D.exodeAide; break;
    case 'exode-lancer': { const r = J.lancerExode(app.jeu, Date.now()); resultat(r); if (r.ok) D.message = r.message ?? ''; break; }
    // le Mur des empreintes : ouvrir une famille, confier son souvenir à une carte
    // une famille touchée : la fiche défile jusqu'à son histoire (14 novembre 2026, Bryan : « on a l'impression qu'il ne se passe rien »)
    case 'famille': D.famille = D.famille === id ? null : id;
      if (D.famille) requestAnimationFrame(() => document.querySelector('.mur-fiche')?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
      break;
    case 'souvenir-confier': if (D.famille && J.confierSouvenir(app.jeu, id, D.famille)) { D.message = t('Le souvenir est gravé dans le journal de la carte.'); sauver(); } break;
    case 'soigner-vite': { const r = J.soignerVite(app.jeu, id); resultat(r); if (r.ok) D.message = r.message ?? ''; break; }
    case 'acheter': resultat(J.acheter(app.jeu, Number(b.dataset.index ?? -1), Date.now())); break;
    case 'comptoir-renouveler': resultat(J.renouvelerComptoir(app.jeu, Date.now())); break;
    case 'comptoir-eclat': { const r = J.acheterEclat(app.jeu, Date.now()); resultat(r); if (r.ok) D.message = r.message ?? ''; break; }
    case 'poste-changer': D.posteChanger = !D.posteChanger; D.confirmeSeance = null; break;
    case 'tour-changer': D.tourChanger = !D.tourChanger; break;
    case 'forge-vue': D.forgeVue = id === 'toutes' || id === 'pretes' ? id : 'proches'; break;
    case 'fabriquer': resultat(J.fabriquer(app.jeu, b.dataset.module ?? '', Date.now())); break;
    case 'cartes': ouvrir('cartes'); if (b.dataset.carte) D.carte = b.dataset.carte; break;
    case 'porteurs': ouvrir('porteurs'); break;
    case 'porteur': D.porteur = id; D.deck = null; D.place = null; D.ongletFiche = null; break;
    // l'onglet Escouade (25 octobre 2026) s'ouvre sur l'escouade ; « Porteurs » et « Collection » sont ses deux autres volets
    case 'porteurs-tous': ouvrir('porteurs'); D.reserve = true; window.scrollTo(0, 0); break;
    case 'porteurs-escouade': D.reserve = false; D.porteur = null; D.deck = null; window.scrollTo(0, 0); break;
    case 'escouade-place': D.place = Number(b.dataset.index ?? 0); D.porteur = null; D.deck = null; break;
    case 'escouade-fermer': D.place = null; break;
    // le Râtelier du district (30 octobre 2026) : changer les cartes communes du deck
    case 'ratelier': D.ratelier = true; D.place = null; D.porteur = null; D.deck = null; break;
    case 'ratelier-fermer': D.ratelier = false; break;
    // le Râtelier d'une escouade précise (31 octobre 2026) : celle de l'onglet ouvert, ou celle choisie dans le détail de la carte
    case 'ratelier-basculer': resultat(J.basculerRatelier(app.jeu, id, b.dataset.index !== undefined ? Number(b.dataset.index) : J.escouadeActive(app.jeu))); break;
    // les trois escouades (25 octobre 2026) : en voir une, la faire descendre
    case 'escouade-voir': D.vueEscouade = Number(b.dataset.index ?? 0); D.place = null; D.porteur = null; D.deck = null; D.carte = null; break;
    case 'depart-escouade': {
      const r = J.choisirEscouade(app.jeu, Number(b.dataset.index ?? 0));
      resultat(r);
      if (r.ok) { D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; }
      break;
    }
    // l'absent du départ (14 novembre 2026) : ouvrir la liste des remplaçants, puis en prendre un à sa place
    case 'depart-remplacer': { const n = Number(b.dataset.index ?? 0); D.remplace = D.remplace === n ? null : n; break; }
    case 'depart-prendre': {
      if (D.remplace === null || D.remplace === undefined) break;
      const l = [...D.escouade];
      const k = D.remplace;
      if (k < l.length) l[k] = id; else l.push(id);
      D.escouade = l.slice(0, 3); D.remplace = null;
      break;
    }
    case 'escouade-active': resultat(J.choisirEscouade(app.jeu, Number(b.dataset.index ?? 0))); break;
    case 'escouade-mettre': {
      const r = J.placerDansEscouade(app.jeu, Number(b.dataset.index ?? 0), id, D.vueEscouade ?? J.escouadeActive(app.jeu));
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
      const plein = !r.ok && !!(r.message?.includes(`${J.DISTRICT.cartesMax} cartes`) || r.message?.includes(`${J.DISTRICT.cartesMax} cards`));
      if (plein) { D.carte = null; D.deck = id; D.echange = b.dataset.module ?? null; D.message = t`${porteurDef(id).nom} porte déjà ${J.DISTRICT.cartesMax} cartes : touche celle que ${moduleDef(b.dataset.module ?? '').nom} remplacera.`; }
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
      // trop lourde pour s'ajouter, mais elle tiendrait à la place d'une carte plus lourde : on passe à l'échange
      const tient = poidsCarte(cle) <= J.chargeMax(app.jeu, id) - J.chargePortee(app.jeu, id);
      if (a === 'dk-libre' && (autreMetal || (!plein && tient))) { D.echange = null; resultat(J.greffer(app.jeu, cle, id)); break; }
      D.echange = cle;
      break;
    }
    case 'monter': resultat(J.monter(app.jeu, b.dataset.module ?? '')); break;
    case 'promouvoir': {
      // la carte change de clé en changeant de métal : sa fiche reste ouverte sur la nouvelle
      const r = J.promouvoir(app.jeu, b.dataset.module ?? '');
      resultat(r);
      if (r.ok && r.cle && D.carte === b.dataset.module) D.carte = r.cle;
      break;
    }
    case 'recycler': resultat(J.recycler(app.jeu, b.dataset.module ?? '')); break;
    case 'fondre-perle': resultat(J.fondrePerle(app.jeu)); break;
    case 'epithete': J.choisirEpithete(app.jeu, b.dataset.module ?? '', b.dataset.id ?? ''); break;
    case 'prendre': resultat(J.prendre(app.jeu, Number(b.dataset.index ?? 0))); break;
    case 'reclamer-jour': resultat(J.reclamerQuotidien(app.jeu)); break;
    case 'colis': {
      const r = J.ouvrirColis(app.jeu);
      resultat(r);
      if (r.colis) D.message = t`Ravitaillement : +${r.colis.composants} cristaux${r.colis.doublon ? t`, un doublon ${deNom(moduleDef(r.colis.doublon).nom)}` : ''}.${r.colis.choix ? t(' Et une carte au choix !') : ''}`;
      break;
    }
    case 'ouvrir-archive': resultat(J.ouvrirArchive(app.jeu)); break;
    case 'entrer': ouvrir('coupe'); break;
    case 'vers-amelioration': D.ongletBat = 'niveau'; requestAnimationFrame(() => document.querySelector('.fb-corps')?.scrollTo(0, 0)); break;
    case 'onglet-fiche': D.ongletFiche = id; requestAnimationFrame(() => document.querySelectorAll('.feuille .feuille-corps').forEach((c) => c.scrollTo(0, 0))); break;
    case 'bat-tous': D.porteursTous = !D.porteursTous; break;
    case 'onglet-bat': D.ongletBat = id === 'niveau' ? 'niveau' : 'salle'; requestAnimationFrame(() => document.querySelector('.fb-corps')?.scrollTo(0, 0)); break;
    case 'archipel': ouvrir('archipel'); break;
    case 'exode-voir': ouvrir('archipel'); D.exode = true; D.selection = null; break;
    // le Gardien de la ville (13 novembre 2026) : sa feuille s'ouvre sur la Cuvette, depuis sa bulle ou depuis la Tour
    case 'ville': {
      const ouvre = !D.villeOuverte || D.vue !== 'archipel';
      if (D.vue !== 'archipel') ouvrir('archipel');
      D.villeOuverte = ouvre; D.exode = false; D.selection = null; D.bulle = null;
      if (ouvre) void rafraichirVille();
      break;
    }
    case 'ville-preparer': {
      const r = J.peutFrapper(app.jeu, Date.now());
      if (!r.ok) { resultat(r); break; }
      D.deck = null; D.fouille = null; D.epreuve = null; D.pillage = null; D.fleche = false; D.defi = null;
      D.villeDepart = true; D.villeOuverte = false;
      D.escouade = J.trioGardien(app.jeu); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    // le trio du Gardien (13 novembre 2026) : on prend ou on repose un Porteur, sans toucher aux escouades enregistrées
    case 'gv-trio': {
      const non = J.raisonHorsGardien(app.jeu, id);
      if (D.escouade.includes(id)) D.escouade = D.escouade.filter((x) => x !== id);
      else if (non) D.message = non;
      else if (D.escouade.length >= 3) D.message = t('Le trio est complet : touche d’abord un Porteur pour le reposer.');
      else D.escouade = [...D.escouade, id];
      break;
    }
    case 'ville-retour': ouvrir('archipel'); D.villeDepart = false; D.villeOuverte = true; break;
    case 'coupe': ouvrir('coupe'); break;
    // les pillages (26 octobre 2026) : la carte des archipels, la fiche d'un archipel, puis le départ
    case 'pillages': ouvrir('pillages'); D.portAide = false; if (portOuvert(app.jeu)) lireCiblesEnLigne(); break;
    // le Port (28 octobre 2026) : sa présentation, ses deux volets
    case 'port-aide': D.portAide = true; window.scrollTo(0, 0); break;
    case 'port-entrer': app.jeu.portVu = true; D.portAide = false; sauver(); window.scrollTo(0, 0); break;
    case 'port-volet': D.voletPort = id === 'pillages' || id === 'marees' ? id : 'missions'; D.mareePlace = null; break;
    // les contrats de marée (31 octobre 2026) : la marée affichée, le Porteur de chaque épreuve, puis le départ de la gabare
    case 'maree-rang': D.mareeRang = id as J.RangMaree; D.mareePlace = null; break;
    case 'maree-place': { const k = Number(b.dataset.index ?? 0); D.mareePlace = D.mareePlace === k ? null : k; D.choixTous = false; break; }
    case 'choix-tous': D.choixTous = !D.choixTous; break;
    case 'maree-choisir': {
      const c = contratAffiche(app.jeu, D.mareeRang, Date.now());
      if (D.mareePlace == null) break;
      const eq = equipeAffichee(app.jeu, c, D.mareeEquipe?.[c.id]);
      const k = D.mareePlace;
      const ailleurs = eq.indexOf(id);
      // un Porteur déjà posté ailleurs échange sa place avec celui de l'épreuve choisie
      if (ailleurs >= 0 && ailleurs !== k) eq[ailleurs] = eq[k] ?? null;
      eq[k] = id;
      D.mareeEquipe = { ...(D.mareeEquipe ?? {}), [c.id]: eq };
      D.mareePlace = null;
      break;
    }
    case 'maree-conseil': {
      const c = contratAffiche(app.jeu, D.mareeRang, Date.now());
      if (D.mareeEquipe) delete D.mareeEquipe[c.id];
      D.mareePlace = null;
      break;
    }
    case 'maree-partir': {
      const c = J.contratsDuMoment(app.jeu, Date.now()).find((x) => x.id === id);
      if (!c) break;
      const eq = equipeAffichee(app.jeu, c, D.mareeEquipe?.[c.id]);
      resultat(J.envoyerContrat(app.jeu, id, eq.filter((x): x is string => !!x), Date.now()));
      D.mareePlace = null;
      break;
    }
    // la Flèche (28 octobre 2026) : son onglet, puis le départ de l'escouade vers le quai suivant
    case 'fleche': ouvrir('fleche'); D.flecheAide = false; lireGardiensEnLigne(); recevoirAssauts().then((c) => { if (c) sauver(); }); break;
    // tenir un quai (29 octobre 2026)
    case 'fleche-tenir': {
      // la compétition (29 octobre 2026) : un quai libre déjà atteint ; sa liberté se revérifie en ligne juste avant
      const quai = Number(b.dataset.quai ?? 0);
      await lireGardiensEnLigne(true);
      if (D.gardiens?.portee.some((g) => g.quai === quai)) { D.message = t`Le quai ${quai} vient d’être pris : défie son gardien, ou tiens un autre quai.`; break; }
      const r = J.tenirQuai(app.jeu, J.escouadePourDepart(app.jeu), quai, Date.now());
      resultat(r);
      if (r.ok) { D.message = t`Ton escouade tient le quai ${quai}. Les Hauts te versent un gage tant qu’elle y reste ; toi, tu peux continuer de monter.`; await synchroGarde(); lireGardiensEnLigne(true); }
      break;
    }
    case 'fleche-defier': {
      const c = cibleDefi();
      const r = J.peutDefier(app.jeu, c);
      if (!r.ok || !c) { resultat(r); break; }
      D.deck = null; D.villeDepart = false; D.fouille = null; D.epreuve = null; D.pillage = null; D.fleche = true; D.defi = c;
      D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'fleche-gage': {
      const g = J.recevoirGage(app.jeu, Date.now());
      if (g.composants || g.eclats) { D.message = t`Gage du quai : +${g.composants} cristaux${g.eclats ? t`, +${g.eclats} Éclat${g.eclats > 1 ? 's' : ''}` : ''}.`; sauver(); }
      break;
    }
    case 'fleche-quitter': {
      const q = app.jeu.fleche?.garde?.quai;
      const g = J.quitterQuai(app.jeu, Date.now());
      if (g) { D.message = t`L’escouade quitte le quai ${q}.${g.composants ? t` Gage versé : +${g.composants} cristaux${g.eclats ? t`, +${g.eclats} Éclats` : ''}.` : ''}`; sauver(); await synchroGarde(); lireGardiensEnLigne(true); }
      break;
    }
    case 'fleche-aide': D.flecheAide = true; window.scrollTo(0, 0); break;
    case 'fleche-entrer': J.etatFleche(app.jeu); D.flecheAide = false; sauver(); window.scrollTo(0, 0); break;
    case 'fleche-preparer': {
      const r = J.peutMonter(app.jeu);
      if (!r.ok) { resultat(r); break; }
      D.deck = null; D.villeDepart = false; D.fouille = null; D.epreuve = null; D.pillage = null; D.fleche = true; D.defi = null;
      D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'pillage-voir': D.pillageCible = id; break;
    case 'pillage-jeton': { const r = J.acheterJeton(app.jeu, Date.now()); resultat(r); if (r.ok) D.message = r.message ?? ''; break; }
    case 'pavillon': {
      const r = J.changerPavillon(app.jeu, id === 'pirate' ? 'pirate' : 'neutre', Date.now());
      resultat(r); if (r.ok) { D.message = r.message ?? ''; planifierGarnison(); }
      break;
    }
    case 'pavillon-avis': D.pavillonAvis = null; break;
    case 'consigne': resultat(J.choisirConsigne(app.jeu, id as J.Consigne)); planifierGarnison(); break;
    case 'pillage-revanche': {
      const c = await cibleRevanche(id);
      if (!c) { D.message = t('Impossible de retrouver ce district pour l’instant : réessaie dans un moment.'); break; }
      D.deck = null; D.villeDepart = false; D.fouille = null; D.epreuve = null; D.fleche = false; D.pillage = c; D.strateChoisie = c.strate;
      D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'pillage-preparer': {
      const c = cartePillages(app.jeu, Date.now(), D.pillagesEnLigne ?? [], D.monId).cibles.find((x) => x.id === id);
      if (!c) break;
      // un neutre qui vise un directeur : on prévient d'abord que son pavillon passera pirate
      if (!c.bot && J.pavillonDe(app.jeu) === 'neutre' && D.pavillonAvis !== c.id) { D.pavillonAvis = c.id; break; }
      D.pavillonAvis = null;
      // un vrai directeur : son bouclier se vérifie en ligne juste avant
      const bouclier = await sousBouclier(c);
      if (bouclier !== false) { D.message = bouclier ? t`${c.nom} est sous bouclier pour l’instant : choisis un autre district.` : t`Impossible de joindre ${c.nom} pour l’instant : réessaie dans un moment.`; break; }
      D.deck = null; D.villeDepart = false; D.fouille = null; D.epreuve = null; D.fleche = false; D.pillage = c; D.strateChoisie = c.strate;
      D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'tr-etage': { const n = Number(b.dataset.strate ?? 0); D.etageOuvert = D.etageOuvert === n ? null : n; break; }
    case 'tour-volet': D.ongletTour = id === 'epreuves' || id === 'missions' ? id : 'strates'; break;
    case 'descendre': D.deck = null; D.villeDepart = false; D.fouille = null; D.epreuve = null; D.pillage = null; D.fleche = false; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0); break;
    case 'vestiges-voir': D.vestiges = b.dataset.strate ? Number(b.dataset.strate) : null; break;
    case 'fouiller-choix': D.deck = null; D.fouille = 'composants'; D.epreuve = null; D.pillage = null; D.fleche = false; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0); break;
    case 'cible': D.fouille = id as typeof D.fouille; break;
    case 'niveau-fouille': D.niveauFouille = id as typeof D.niveauFouille; break;
    case 'palier': D.felee = id === 'felee'; break;
    case 'epreuve': {
      D.deck = null; D.villeDepart = false; D.fouille = null; D.epreuve = id; D.felee = false; D.pillage = null; D.fleche = false; D.strateChoisie = J.strateEpreuve(app.jeu);
      D.escouade = J.escouadePourDepart(app.jeu); D.remplace = null; D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'mission': resultat(J.envoyerMission(app.jeu, id, (b.dataset.duree as J.DureeMission) ?? 'courte', Date.now(), b.dataset.cle)); break;
    case 'mission-lieu': D.destination = id; break;
    // depuis l'écran de départ : on compose les escouades dans l'onglet Escouade, sur celle qui descend
    // l'escouade est trop blessée pour partir : droit à la Clinique, sur le district
    case 'depart-clinique': ouvrir('archipel'); D.expedition = null; D.selection = 'clinique'; break;
    case 'escouade-modifier': ouvrir('porteurs'); D.retourModif = 'escouade'; D.vueEscouade = J.escouadeActive(app.jeu); window.scrollTo(0, 0); break;
    // la garnison du port (27 octobre 2026) : choisir l'escouade qui défend, la composer, et revenir là d'où l'on vient
    case 'defense-escouade': resultat(J.choisirDefense(app.jeu, Number(b.dataset.index ?? 0))); break;
    case 'garnison-modifier': ouvrir('porteurs'); D.retourModif = 'pillages'; D.vueEscouade = J.escouadeDefense(app.jeu); window.scrollTo(0, 0); break;
    case 'escouade-revenir': {
      const v = D.retourModif;
      if (v === 'escouade') {
        ouvrir('escouade');
        D.escouade = J.escouadePourDepart(app.jeu);
      } else ouvrir('pillages');
      window.scrollTo(0, 0);
      break;
    }
    case 'partir': {
      // un directeur se pille en duel contre sa vraie escouade (14 novembre 2026)
      if (D.pillage && !D.pillage.bot) {
        const r = J.lancerPillageDuel(app.jeu, D.escouade, D.pillage, Date.now());
        resultat(r);
        if (r.ok && r.depart) { sauver(); lancerPillage(r.depart, !!D.pillage.revanche); D.pillage = null; }
        break;
      }
      const r = D.villeDepart ? J.frapperGardien(app.jeu, D.escouade, Date.now()) : D.fleche ? (D.defi ? J.defierGardien(app.jeu, D.escouade, D.defi) : J.monterFleche(app.jeu, D.escouade))
        : D.pillage ? J.piller(app.jeu, D.escouade, D.pillage, Date.now())
        : D.epreuve ? J.partirEpreuve(app.jeu, D.escouade, D.epreuve, Date.now(), undefined, !!D.felee)
        : D.fouille ? J.fouiller(app.jeu, D.escouade, D.strateChoisie, D.fouille, undefined, D.niveauFouille ?? 'normale')
          : J.partir(app.jeu, D.escouade, D.strateChoisie);
      resultat(r);
      if (r.ok) { app.mode = 'combat'; K.fin = null; K.etat = null; window.scrollTo(0, 0); }
      break;
    }
    // la fouille confiée (12 novembre 2026) : l'escouade choisie part seule, on revient à la Tour
    case 'confier-fouille': {
      if (!D.fouille) break;
      const r = J.confierFouille(app.jeu, D.escouade, D.strateChoisie, D.fouille, Date.now());
      resultat(r);
      if (r.ok) { ouvrir('coupe'); D.message = t`L’escouade est partie fouiller seule la Strate −${D.strateChoisie} : retour dans ${J.CONFIEE.heures} h.`; window.scrollTo(0, 0); }
      break;
    }
    case 'reprendre': app.mode = 'combat'; K.fin = finPour(); break;
    case 'rencontre': D.vue = 'rencontre'; D.bulles = 0; break;
    // la rencontre, le briefing et les scènes se lisent au toucher : à gauche on revient, ailleurs on avance (14 novembre 2026)
    case 'rencontre-suite':
      if (c.b.classList.contains('scene-rencontre') && toucheAGauche(c)) { D.bulles = Math.max(D.bulles - 1, 0); break; }
      D.bulles = Math.min(D.bulles + 1, NB_REPLIQUES); break;
    case 'briefing': D.vue = 'briefing'; D.etape = 0; window.scrollTo(0, 0); break;
    case 'briefing-suite':
      if (c.b.classList.contains('scene-briefing') && toucheAGauche(c)) { D.etape = Math.max(D.etape - 1, 0); break; }
      D.etape = Math.min(D.etape + 1, nbEtapes('chambre') - 1); break;
    case 'briefing-retour': D.etape = Math.max(D.etape - 1, 0); break;
    // « Ton district » : à l'arrivée après la chambre, et depuis le menu
    case 'accueil': ouvrir('accueil'); D.etape = 0; window.scrollTo(0, 0); break;
    case 'accueil-suite': {
      const avancer = () => { D.etape = Math.min(D.etape + 1, VISITE.length - 1); };
      if (toucherVisite(racine, () => { avancer(); afficher(); })) return 'fin';
      avancer();
      break;
    }
    case 'accueil-fin': {
      const fin = () => {
        app.jeu.accueilVu = true; ouvrir('archipel'); window.scrollTo(0, 0);
        // le pseudo (3 novembre 2026 : une recrue restait « Sans pseudo ») : plus jamais entre la visite et le Générateur
        // (13 novembre 2026, game designer) ; il vient après la première action au Générateur, ou quand on le referme
        if (id === 'generateur') { D.selection = 'generateur'; D.pseudoApresPoste = true; }
        else demanderPseudo();
        sauver();
      };
      if (id === 'generateur' && toucherVisite(racine, () => { fin(); afficher(); })) return 'fin';
      fin();
      break;
    }
    case 'codex':
    case 'bibliotheque':
      D.retourBiblio = app.mode === 'titre' ? 'titre' : D.vue === 'coupe' ? 'coupe' : 'archipel';
      if (app.mode === 'titre') app.mode = 'district';
      ouvrir('codex'); D.chapitre = null; window.scrollTo(0, 0);
      break;
    case 'biblio-onglet': D.onglet = id === 'archives' || id === 'campagne' || id === 'bestiaire' ? id : 'chroniques'; D.chapitre = null; break;
    // les scènes de la campagne : la suivante réplique, la fin (vue pour de bon), et revoir depuis la Bibliothèque
    case 'scene-suite':
      if (toucheAGauche(c)) { D.scene = Math.max((D.scene ?? 0) - 1, 0); break; }
      D.scene = (D.scene ?? 0) + 1; break;
    case 'scene-fin': {
      if (D.revoir) D.revoir = null;
      else { const s = J.sceneCampagne(app.jeu); if (s && J.voirScene(app.jeu, s.id)) sauver(); }
      D.scene = 0;
      break;
    }
    case 'scene-revoir': D.revoir = id; D.scene = 0; break;
    case 'chapitre':
      // le message d'un chapitre ne reste plus affiché sur le suivant (10 novembre 2026, audit)
      D.onglet = 'chroniques'; D.chapitre = id; D.message = '';
      if (!app.jeu.lus.includes(id) || !app.jeu.luesRecompensees.includes(id)) {
        const avant = new Set(Object.keys(app.jeu.collection));
        const carte = J.lireChapitre(app.jeu, id);
        if (carte) {
          const m = moduleDef(carte);
          D.message = avant.has(carte)
            ? t`Ysé glisse une carte entre les pages : un doublon ${deNom(m.nom)} (${NOMS_RARETE[m.rarete]}).`
            : t`Ysé glisse une carte entre les pages : ${m.nom} (${NOMS_RARETE[m.rarete]}) rejoint tes Cartes.`;
        }
        sauver();
      }
      window.scrollTo(0, 0);
      break;
    case 'chapitre-fermer': D.chapitre = null; D.message = ''; window.scrollTo(0, 0); break;
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
    // l’Héritage du district : la première question choisit la lignée, la seconde la carte ; puis on la montre
    case 'legs-lignee': D.legsLignee = id === 'tech' || id === 'bio' || id === 'reso' ? id : null; break;
    case 'legs-retour': D.legsLignee = null; break;
    case 'legs-choisir': { const r = J.choisirLegs(app.jeu, id); resultat(r); if (r.ok) { D.legsLignee = null; D.legsRevele = true; } break; }
    case 'legs-ok': D.legsRevele = false; break;
    case 'retour-ok': D.retour = []; break;
    case 'expedition-lu': D.expedition = null; break;
    case 'rapport-chroniques': D.expedition = null; D.retourBiblio = 'archipel'; ouvrir('codex'); D.onglet = 'chroniques'; D.chapitre = null; break;
    case 'rappel-plus-tard': D.rappel = false; break;
    case 'rapport-lu': if (J.lireRapport(app.jeu).ok) sauver(); break;
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
      if (o.onglet === 'pillages') D.voletPort = 'missions';
      if (o.onglet === 'codex') { D.retourBiblio = 'archipel'; D.onglet = 'chroniques'; D.chapitre = null; }
      // construire le deck : droit aux cartes d'Ilka, où attend l'Œil-relais
      if (o.id === 'deck') D.deck = 'ilka';
      break;
    }
    case 'tri':
      if (estTri(id)) {
        D.tri = id;
        try { localStorage.setItem('empreintes.tri', id); } catch { /* stockage bloqué */ }
      }
      break;
    case 'panneau': D.bulle = null; break;
    // les bulles du district (téléphone) : un toucher déplie, un autre replie ; une seule ouverte à la fois
    case 'bulle': D.bulle = id === 'objectif' || id === 'appel' ? (D.bulle === id ? null : id) : null; break;
    default: return 'inconnu';
  }
  return 'afficher';
}
