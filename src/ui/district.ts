// Écrans du district : l'archipel (accueil), la Tour du Noyau en coupe, l'escouade, les cartes, le Codex.
// Le district est un tableau Midjourney par âge (public/art/district/age-N), l'âge suit la Tour du Noyau ;
// chaque bâtiment y porte son cristal de niveau et, s'il y a quelque chose à faire, une bulle, le détail s'ouvre en feuille par le bas.

import { HALTES_FOND, PISTES, halteDef, nombreHaltes, queteDef, revelationDe } from '../core/strates';
import { ETOILES, releveDef, vestigesDe } from '../core/explorer';
import { htmlBestiaire } from './bestiaire';
import { visageGarde } from './acces';
import { pillagesOuverts, portOuvert } from './acces';
import { epitheteAffiche, epithetesDe, journalCarte, NOMS_PALIER, palierDe, vecuDe, versPalierSuivant, PILLAGE, butinPillage, chanceVictoire, difficulte, etatPillage, forceEscouade, majJetons, chanceQuai, etatFleche, FLECHE, gardiensQuai, pas } from '../core/jeu';
import { NOMS_EFFET, effetsDe, formuleEffet, texteEffet } from '../core/effets';
import { CLE_LEGS, VOIES, MODULES, MODULES_TIRABLES, ORIGINE_PAQUETAGE, PORTEURS, communeDef, forceCommune, type CarteCommuneDef, batimentDef, carteId, ennemiDef, moduleDe, moduleDef, porteurDef, zoneDe, deNom, ilElle } from '../core/donnees';
import {
  contexteCampagne, EVEIL_LEGS, EVEIL_ORIGINE, LETTRE_LEGS, legsEnAttente,
  OBJECTIFS, EPREUVES_STRATE, epreuvesOuvertes, vestigesOuverts, CARTES_COMMUNES, RATELIER, placesRatelier, communeOuverte, coutRatelier, type Sortie, gesteCommun, ratelierDe, ratelierPayable, escouadesAvecCommune, indiceEscouade, cleDuLegs, chargeMax, chargePortee, escouadeActive, escouadeDe, escouadesDe, strateVaincue, ARCHIVE, CIBLES_FOUILLE, CREUSEURS, chanceCreuseurFouille, creuseursRequis, logementCreuseurs, manquePourCreuser, noyauRequis, DISTRICT, EPREUVE_DECK_MIN, MISSIONS, barquesMax, BARQUES, placesEntrainement, seancesDe, seanceDe, ENTRAINEMENT, POSTES, QUOTIDIENS, epreuveDef, epreuvesDeLaSemaine, strateEpreuve, FELEE, hausseFelee, ESCOUADE_RECRUES, epreuveReussie, NOMS_FAMILLE, type EpreuveDef, lieuMission, bonusMission, composantsMission, destinationsDuJour, barquesVers, secoursPossible, profondeurMission, COEUR, naufragesDeLaStrate, chanceNouvelleMission, NOM_BUTIN, type Butin, type Destination, type DureeMission, lieuIdMission, chantierDe, chantiersMax, coutAmelioration, coutRefabrication, disponibles, dureeChantier, dureeFabrication, enExpedition, deckEscouade, gestesDe, greffesDe, lundiSuivant, objectifCourant, porteursPresents, posteDe, posteQuitte, textePosteQuitte, colisDisponible, colisAvantChoix, RAVITAILLEMENT, pvMaxCombat, tropBlesse, pvMinDepart, quotidienActif, quotidienFait, soinParHeure, type Jeu, type Poste, DECISIONS, decisionEnAttente, jourDe, progresMarque, type Acte, niveauPorteur, gainsAmelioration, type GainNiveau,
  COMPTOIR, eclatsAuComptoir, prixEclatComptoir, partPvClinique, prixComptoir, renouvelablesComptoir, plafondSeance, SOINS_INTENSIFS, gardienPourTour, prixSoins, plancherTaille, brutEnAttente, heuresDeTaille, plafondEntrainement, raffinageParHeure, apercuSeance, debutJour,
  etoilesDe, vestigesTrouves, totalEtoiles, prochainPalierEtoiles
} from '../core/jeu';
import { COLLECTION, NIVEAU_METAL, NOMS_RARETE, RARETES, TRIS, album, carteNiveau, composantsNiveau, doublonsRequis, multNiveau, niveauRequis, poidsCarte, trierCartes, type TriCartes } from '../core/collection';
import type { BatimentId, GesteDef, Lignee, ModuleDef, Rarete } from '../core/types';
import type { CibleFouille } from '../core/expedition';
import { DIFFICULTES_FOUILLE, type DifficulteFouille, pretAuFront, finCreuse, gainCreuseurs } from '../core/jeu';
import { bassesOuvertes, CONFIEE, REMUEE, apercuConfiee, confieesOuvertes, flecheOuverte, peutConfier, strateRemuee } from '../core/jeu';
import { particularite } from '../core/strates';
import { FAMILLES, FRAGMENTS } from '../core/fragments';
import { CONFIANCE, CERCLE, CERCLE_OUVERTURE, cercleOuvert, echangesParJour, metalMax, ouvertesMax, vitrineMax, niveauConfiance, nbFoyers } from '../core/jeu';
import { blocSecours } from './secours';
import { LECTURE_PROFONDE, premiersPas } from '../core/partie/etat';
import { RANG_METAL, loreCarte } from '../core/lore-cartes';
import { rumeurDuJour } from '../core/rumeurs';
import { CHAPITRES, LIVRES, chapitreDef, chapitreOuvert } from '../core/chroniques';
import { chapitreCampagne } from '../core/campagne';
import { frequenceLibre } from '../core/regles';
import { htmlListeScenes } from './campagne';
import { COULEUR } from './vue';
import type { Affinite } from '../core/lieux';
import { LIEUX_SLUGS, BARQUE_PEINTE, PILIERS_LARGE, barque, decorLieu, merLarge, vignetteDistrict, decor, decorStrate, illustrationBatiment, illustrationModule, interieurBatiment, portrait, prochainVisuel, prochainPalier, palierCuvette, type PalierCuvette, CALQUES_CUVETTE, calquePalier, FUMEE_FORGE, reflets, sceneDistrict, CUVETTE, visuel, portraitYse } from './art';
import { COULEUR_RARETE, faceCarte, couleurFrequence } from './carte';
import { feuilleGuide, lienGuide, trouveesDe } from './guide';
import { avecMots } from './lexique';
import { arriveeFuture, feuillePorteur } from './porteurs';
import { bandeauTableau } from './classements';
import { ICO, baseIcones, icone, type Icone } from './icones';
import { NOM_LIGNEE, NOM_LIGNEES, NOM_PHASE, etapeVoyage, avatar, avatarGarde, gardesGarnison, coquille, couts, decompte, gainsRapport, duree, jaugeTemps, ent, entete, prix, voletsEscouade, type EcranDistrict, type Filtre } from './coquille';

import { decimal, echap, mouvementReduit, virgule, texteReplie } from './outils';
import { ambianceLarge, ambianceTableau } from './ambiance';
import { brancherHoule } from './houle';
import { t as tr, locale, enumerer, minuscule } from '../core/i18n';

export type { EcranDistrict, Vue } from './coquille';

export { COULEUR_RARETE };

const gemme = (r: Rarete) => `<i class="gemme g-${r}" style="--r:${COULEUR_RARETE[r]}" title="${NOMS_RARETE[r]}" aria-hidden="true"></i>`;

// ---------- L'archipel ----------

/**
 * Les lieux de l'archipel (tableaux à 7 bâtiments, 23 octobre 2026) : les 5 bâtiments du jeu, et 2 lieux déjà peints
 * qui ouvriront plus tard (le Port et le Labo génétique). Bryan : pas de voile sur eux, le tableau reste beau partout ;
 * quand on les touche, une raison plausible, dans le lore, dit pourquoi ils ne sont pas encore ouverts.
 */
type LieuFutur = 'port';
type Lieu = BatimentId | LieuFutur;
const LIEUX_FUTURS: Record<LieuFutur, { nom: string; raison: string; promesse: string }> = {
  port: {
    nom: tr('Port'),
    raison: tr('Le bateau du passeur reste amarré sous les pilotis du Port, devant le sas de la digue : tant que le gardien de la Strate −1 tient le puits, personne ne laisse le district sans défense pour prendre la mer.'),
    promesse: tr('Le passage sûr : des équipages partiront d’ici vers les ruines au large et les cuvettes voisines.'),
  },
};
/**
 * Le Comptoir est déjà peint sur le tableau : tant qu'il n'est pas « construit » (niveau 0), on le dit fermé, avec une raison
 * tirée du lore, comme le port et le labo (23 octobre 2026, Bryan). Le construire, c'est le remettre en état.
 */
const COMPTOIR_FERME = tr('Ses volets sont cloués depuis que le dernier marchand a quitté le district, et la balance a rouillé sur le comptoir. Les fouilleurs remontent des Strates les poches pleines, mais personne n’est là pour leur racheter quoi que ce soit.');
const estFutur = (id: string | null): id is LieuFutur => id === 'port';
/**
 * Le Cercle des quais avant la Strate −5 (12 novembre 2026) : il a pris la place du Labo génétique, mis en réserve.
 * Sa raison d'être fermé, tirée du lore : aucun directeur ne traite avec un district qui n'a pas tenu son puits.
 */
const CERCLE_FERME = tr`Les bancs de l’estrade attendent sous la bâche. Les directeurs des autres districts ne traitent pas avec un district qui n’a pas encore tenu son puits : ils accosteront quand le gardien de la Strate −${CERCLE_OUVERTURE} sera tombé.`;

/**
 * Les repères des bâtiments sur le tableau (2 novembre 2026, Bryan : « des plaques toutes rassemblées », comme les autres jeux,
 * le bâtiment se reconnaît à son dessin). Repère 400 × 600 : `pied`, où se pose le petit cristal du niveau, au pied du bâtiment,
 * et `haut`, d'où part la bulle qui signale une action à faire (au-dessus du toit).
 */
type Balise = { pied: { x: number; y: number }; haut: { x: number; y: number } };
const BALISES_CUVETTE: Record<Lieu, Balise> = {
  noyau: { pied: { x: 207, y: 276 }, haut: { x: 207, y: 146 } },
  // 8 novembre 2026 (audit du 7) : un peu plus haut, pour que sa bulle, son niveau et son nom ne touchent plus la bulle de la Clinique
  forge: { pied: { x: 108, y: 300 }, haut: { x: 147, y: 262 } },
  clinique: { pied: { x: 96, y: 392 }, haut: { x: 140, y: 350 } },
  generateur: { pied: { x: 176, y: 430 }, haut: { x: 176, y: 364 } },
  comptoir: { pied: { x: 278, y: 412 }, haut: { x: 278, y: 352 } },
  cercle: { pied: { x: 322, y: 308 }, haut: { x: 318, y: 232 } },
  port: { pied: { x: 318, y: 584 }, haut: { x: 318, y: 516 } },
};
/** Les anciens tableaux d'âge (avant la Cuvette) : le repère au milieu de l'ancienne plaque, la bulle un peu plus haut */
const ANCIENS: Record<Lieu, { x: number; y: number }> = {
  noyau: { x: 200, y: 312 }, generateur: { x: 64, y: 184 }, forge: { x: 322, y: 228 }, clinique: { x: 62, y: 304 },
  comptoir: { x: 322, y: 382 }, cercle: { x: 112, y: 538 }, port: { x: 326, y: 556 },
};
const balise = (id: Lieu): Balise => CUVETTE ? BALISES_CUVETTE[id] : { pied: ANCIENS[id], haut: { x: ANCIENS[id].x, y: ANCIENS[id].y - 50 } };
const ORDRE: Lieu[] = ['noyau', 'generateur', 'forge', 'clinique', 'comptoir', 'cercle', 'port'];
/**
 * Les bâtiments eux-mêmes sont cliquables (22 octobre 2026, Bryan : sur téléphone, les plaques seules faisaient de petites cibles
 * qui se chevauchaient). Le contour de chaque lieu dans le tableau de chaque âge, repère 400 × 600 (relevé sur les tableaux).
 * Les âges 2 à 4 ont été peints à partir de l'âge 1 : même disposition, à quelques pixels près.
 */
const ZONES_234: Record<Lieu, string> = {
  generateur: '15,60 95,60 125,140 125,215 60,225 5,210 5,130',
  noyau: '165,5 225,10 255,120 255,290 230,325 150,325 135,250 140,130 130,100',
  forge: '255,90 345,80 400,150 400,240 300,245 235,215 240,160',
  clinique: '30,225 90,225 125,270 120,330 40,335 0,315 0,260',
  comptoir: '275,255 395,265 395,355 380,395 285,390 240,350 245,300',
  cercle: '20,345 160,340 240,410 225,520 160,555 50,550 5,480 10,400',
  port: '265,450 350,425 385,470 385,550 300,565 265,520',
};
const ZONES: Record<1 | 2 | 3 | 4, Record<Lieu, string>> = {
  1: {
    noyau: '140,10 215,5 235,140 255,290 200,330 135,320 140,160 110,120',
    generateur: '20,70 80,70 125,150 125,210 60,225 0,210 0,140',
    forge: '260,130 375,125 400,200 400,250 300,255 245,220 245,175',
    clinique: '30,230 90,235 125,280 115,330 40,335 0,315 0,260',
    comptoir: '280,270 375,295 395,350 380,395 280,390 240,350 245,310',
    cercle: '30,345 150,340 240,410 230,520 160,555 60,550 10,480 15,400',
    port: '270,480 340,460 370,500 375,545 300,560 270,520',
  },
  2: ZONES_234, 3: ZONES_234, 4: ZONES_234,
};
/** La Cuvette (2 novembre 2026) : un seul tableau pour tous les âges, mêmes repères 400 × 600 */
const ZONES_CUVETTE: Record<Lieu, string> = {
  noyau: '182,146 232,146 236,250 232,282 182,282 178,250',
  cercle: '325,228 361,261 359,298 353,305 337,310 299,308 286,299 283,261 318,230',
  forge: '72,232 144,228 148,300 120,322 74,318',
  clinique: '60,326 134,326 138,380 104,398 62,392',
  generateur: '138,354 212,354 216,420 176,438 140,430',
  comptoir: '240,312 312,312 314,400 280,420 240,410',
  port: '296,520 400,520 400,588 300,590',
};
if (CUVETTE) for (const a of [1, 2, 3, 4] as const) ZONES[a] = ZONES_CUVETTE;
/**
 * Les habitations du haut de la Cuvette (2 novembre 2026, Bryan : « c'est presque étrange qu'il ne soit pas cliquable ») :
 * le gros bâtiment aux fenêtres allumées, là où vit la population qui te suit. Il ouvre le même panneau que la roue de Confiance.
 */
const ZONE_HABITANTS = '318,40 356,0 400,0 400,200 372,214 330,192 300,150 304,90';
const BALISE_HABITANTS = { x: 356, y: 200 };
function zonesBatiments(age: 1 | 2 | 3 | 4, selection: string | null, p: Record<string, PalierCuvette> | null = null): string {
  // un bâtiment au palier haut a grandi : sa zone suit la silhouette peinte
  const zone = (id: Lieu) => (p?.[id] === 'haut' ? CALQUES_CUVETTE.find((c) => c.lieu === id)?.zoneHaut : null) ?? ZONES[age][id];
  return '<svg class="zones-bat" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">'
    + ORDRE.map((id) => `<polygon class="zone-bat${selection === id ? ' choisie' : ''}" points="${zone(id)}" data-action="batiment" data-id="${id}" data-lieu="${id}"/>`).join('')
    + (CUVETTE ? `<polygon class="zone-bat" points="${ZONE_HABITANTS}" data-action="ressource" data-id="confiance" data-lieu="habitants"/>` : '')
    + '</svg>';
}

/** Âge affiché au rendu précédent : un changement d'âge déclenche le fondu d'apparition */
let ageAffiche = 0;

/**
 * La vidéo du tableau survit aux redessins (l'écran est reconstruit chaque seconde) : on garde le même élément
 * et on le replace, il reprend là où il en était. Rien n'est joué si le joueur a réduit les animations.
 */
let video: HTMLVideoElement | null = null;
/**
 * Les noms et les bulles ne se chevauchent jamais : après chaque rendu, un élément qui en recouvre un autre, plus haut sur
 * le tableau, descend juste en dessous ; aucun ne sort de l'écran ni ne passe sous la barre de navigation
 * (28 octobre 2026, Bryan : « regarde les bords »).
 */
function degagerBalises(racine: HTMLElement) {
  const ps = [...racine.querySelectorAll<HTMLElement>('.toile :is(.balise,.bulle-bat)')];
  const places: DOMRect[] = [];
  for (const p of ps.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)) {
    const r = p.getBoundingClientRect();
    let dy = 0;
    for (let essai = 0; essai < 6; essai++) {
      const gene = places.find((q) => r.left < q.right + 3 && r.right > q.left - 3 && r.top + dy < q.bottom + 3 && r.bottom + dy > q.top - 3);
      if (!gene) break;
      dy = gene.bottom + 4 - r.top;
    }
    if (dy) p.style.marginTop = `${dy}px`;
    places.push(new DOMRect(r.left, r.top + dy, r.width, r.height));
  }
  const cadre = racine.querySelector<HTMLElement>('.archipel')?.getBoundingClientRect();
  if (!cadre) return;
  const nav = racine.querySelector<HTMLElement>('.nav');
  const navHaut = nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().top : Infinity;
  const bas = Math.min(cadre.bottom, navHaut) - 6, marge = 6;
  for (const p of ps) {
    const r = p.getBoundingClientRect();
    const dx = r.left < cadre.left + marge ? cadre.left + marge - r.left : r.right > cadre.right - marge ? cadre.right - marge - r.right : 0;
    if (dx) p.style.marginLeft = `${dx}px`;
    if (r.bottom > bas) p.style.marginTop = `${(parseFloat(p.style.marginTop) || 0) + bas - r.bottom}px`;
  }
}

export function brancherTableau(racine: HTMLElement) {
  degagerBalises(racine);
  if (!mouvementReduit()) brancherHoule(racine);
  const place = racine.querySelector<HTMLElement>('.archipel .anime');
  if (!place || mouvementReduit()) return;
  const src = place.dataset.video!;
  if (!video || video.dataset.src !== src) {
    video = document.createElement('video');
    video.dataset.src = src;
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';
    video.addEventListener('playing', () => video?.classList.add('prete'));
  }
  place.append(video);
  video.play().catch(() => { /* lecture auto refusée : le tableau fixe reste affiché */ });
}


/**
 * Les éclats des cristaux de la Cuvette : une étoile qui s'ouvre un instant sur une arête, puis se referme, chacune à son rythme
 * (la lumière des cristaux eux-mêmes est peinte par houle.ts). Repère 400 × 600 : position, période en secondes, décalage.
 */
const ECLATS: [number, number, number, number, Lieu][] = [
  [204, 141, 3.7, 0, 'noyau'], [199, 151, 5.3, 2.1, 'noyau'], // le cristal au sommet de la Tour
  [124, 327, 4.9, 1.2, 'clinique'], // la lanterne de la Clinique
  [179, 343, 4.1, .6, 'generateur'], [175, 365, 6.2, 3.4, 'generateur'], // le tube du Générateur
  [268, 371, 4.5, 2.7, 'comptoir'], [288, 377, 5.8, .9, 'comptoir'], // le bassin du Comptoir
  [316, 514, 4.3, 1.8, 'port'], // la lanterne du Port
  [313, 233, 6.6, 4.1, 'cercle'], // la lanterne du Cercle
  [127, 303, 5.1, 3.0, 'forge'], // les cristaux au pied de la Forge
];
/** Les étincelles qui montent du fourneau de la Forge */
const ETINCELLES: [number, number, number, number][] = [[121, 279, 2.4, 0], [125, 281, 2.9, .9], [118, 282, 2.2, 1.6], [123, 278, 3.3, 2.2], [127, 283, 2.6, .4]];

/**
 * Le palier de chaque bâtiment sur la Cuvette (3 novembre 2026). Le Port n'a pas de niveau à lui : ils suivent l'âge du
 * district (la Tour du Noyau). Un Comptoir pas encore ouvert reste un simple étal.
 */
function paliers(j: Jeu): Record<string, PalierCuvette> {
  const p: Record<string, PalierCuvette> = {};
  for (const { lieu } of CALQUES_CUVETTE) p[lieu] = palierCuvette(estFutur(lieu) ? j.batiments.noyau : j.batiments[lieu as BatimentId] ?? 0);
  return p;
}

/** Les éclats des cristaux des bâtiments repeints (relevés sur les calques) */
function eclatsPaliers(p: Record<string, PalierCuvette> | null): [number, number, number, number][] {
  if (!p) return [];
  return CALQUES_CUVETTE.flatMap((c) => {
    const q = p[c.lieu];
    const l = q === 'milieu' ? c.eclats.milieu : q ? c.eclats[q] : undefined;
    return l ? l.map(([x, y], i): [number, number, number, number] => [x!, y!, 4.2 + ((x! + i * 3) % 5) / 2, ((y! + i * 7) % 9) / 2]) : [];
  });
}

function tableau(j: Jeu): string {
  const s = sceneDistrict(j.batiments.noyau);
  const nouveau = ageAffiche !== 0 && ageAffiche !== s.age;
  ageAffiche = s.age;
  const p = CUVETTE ? paliers(j) : null;
  // les calques passent par-dessus la Cuvette animée : les éclats et les étincelles d'un bâtiment repeint ne tombent plus juste
  const garde = (lieu: Lieu) => !p || (p[lieu] === 'milieu' && !CALQUES_CUVETTE.find((c) => c.lieu === lieu)?.milieu);
  const fumee = p ? FUMEE_FORGE[p.forge!] : null;
  return `<img class="tableau${s.nuit ? ' nuit' : ''}${nouveau ? ' nouvel-age' : ''}" src="${s.url}" alt="" draggable="false"/>`
    + (s.video ? `<div class="anime" data-video="${s.video}"></div>` : '')
    + (s.houle && !mouvementReduit() ? `<div class="houle" data-image="${s.url}" data-masques="${s.houle}"${fumee ? ` data-fumee="${fumee.join(' ')}"` : ''}></div>` : '')
    + (p ? CALQUES_CUVETTE.map((c) => {
      const q = p[c.lieu]!;
      const b = q === 'milieu' ? c.milieu : c[q];
      if (!b) return '';
      const [x, y, w, h] = b;
      const boite = `left:${x! / 8}%;top:${y! / 12}%;width:${w! / 8}%;height:${h! / 12}%`;
      // les cristaux du bâtiment repeint respirent : un calque de lumière par-dessus, qui s'allume et s'éteint doucement
      return `<img class="palier" src="${calquePalier(c.lieu, q)}" style="${boite}" alt="" draggable="false" decoding="async">`
        + `<img class="palier lueur" src="${calquePalier(c.lieu, q, true)}" style="${boite};--p:${3.6 + (x! % 7) / 3}s;--d:${(y! % 11) / 4}s" alt="" draggable="false" decoding="async">`;
    }).join('') : '')
    + (CUVETTE ? [...ECLATS.filter((e) => garde(e[4])), ...eclatsPaliers(p)].map(([x, y, pe, d]) => `<i class="eclat" style="left:${x / 4}%;top:${y / 6}%;--p:${pe}s;--d:${d}s" aria-hidden="true"></i>`).join('')
      + (garde('forge') ? ETINCELLES.map(([x, y, pe, d]) => `<i class="etincelle" style="left:${x / 4}%;top:${y / 6}%;--p:${pe}s;--d:${d}s" aria-hidden="true"></i>`).join('') : '') : '')
    + (CUVETTE ? ambianceTableau(nbFoyers(j), s.nuit) : '')
    + `${s.nuit ? '<i class="nuit-voile" aria-hidden="true"></i>' : ''}`;
}

/**
 * Sur le tableau, chaque bâtiment ne porte plus qu'un petit cristal à son pied (son niveau) et, seulement quand il y a
 * quelque chose à faire, une bulle au-dessus de son toit (2 novembre 2026, Bryan : comme les autres jeux de gestion).
 * Le nom s'affiche au survol (PC), quand le bâtiment est choisi, et pour tous tant que le district est neuf (tutoriel,
 * Tour du Noyau au niveau 1) : les nouveaux venus apprennent la carte, puis elle se dégage.
 */
function balises(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  const libres = disponibles(j).length > 0;
  const pos = (p: { x: number; y: number }) => `style="left:${(p.x / 400) * 100}%;top:${(p.y / 600) * 100}%"`;
  let h = '';
  for (const id of ORDRE) {
    const b = balise(id);
    const choisie = e.selection === id ? ' choisie' : '';
    const bulle = (classe: string, contenu: string, label: string, action = 'batiment') =>
      `<button type="button" class="bulle-bat ${classe}" ${pos(b.pied)} data-action="${action}" data-id="${id}" data-lieu="${id}" aria-label="${label}">${contenu}</button>`;
    // le Port ouvert mène aux archipels voisins (26 octobre 2026, Bryan : « il faut un bateau pour aller piller des gens »)
    if (id === 'port' && portOuvert(j)) {
      majJetons(j, e.now);
      const pill = pillagesOuverts(j);
      const n = pill ? etatPillage(j).jetons : 0;
      h += `<button type="button" class="balise ouverte" ${pos(b.pied)} data-action="pillages" data-lieu="port" aria-label="${pill ? tr`Port : cuvettes voisines, ${n} jeton${n > 1 ? 's' : ''} de pillage sur ${PILLAGE.jetonsMax}` : tr('Port : missions en mer')}">`
        + `<b class="bal-cristal glace">${pill ? ICO.grappin : ICO.porteurs}</b><span class="bal-nom">${tr`Port`}</span></button>`;
      if (pill && n >= PILLAGE.jetonsMax) h += bulle('alerte', `${ICO.grappin}<em>${n}</em>`, tr`Jetons de pillage au complet : ${n}`, 'pillages');
      continue;
    }
    const ferme = estFutur(id) || (id === 'comptoir' && !j.batiments.comptoir && !chantierDe(j, id)) || (id === 'cercle' && !cercleOuvert(j));
    if (ferme) {
      const nom = estFutur(id) ? LIEUX_FUTURS[id].nom : batimentDef(id).nom;
      h += `<button type="button" class="balise fermee${choisie}" ${pos(b.pied)} data-action="batiment" data-id="${id}" data-lieu="${id}" aria-label="${tr`${echap(nom)}, pas encore ouvert`}">`
        // fermé : le cadenas seul, sans nom (12 novembre 2026, audit du début : 8 noms à la première seconde) ;
        // le nom et la raison s'affichent en le touchant
        + `<b class="bal-cristal glace">${ICO.verrou}</b></button>`;
      continue;
    }
    const d = batimentDef(id);
    const niv = j.batiments[id];
    const ch = chantierDe(j, id);
    const vise = !!o && o.pilier === id && !o.fait(j);
    const occupant = id !== 'comptoir' && id !== 'cercle' ? posteDe(j, id) : null;
    const prete = id === 'forge' && !!j.forge && e.now >= j.forge.fin;
    // un poste vide ne se signale que si quelqu'un peut le prendre, une fois la chambre ouverte (avant, le seul but est la porte ;
    // la Tour : l'entraînement reste un choix, pas un oubli)
    const vacant = j.chambre && !!niv && id !== 'noyau' && id !== 'comptoir' && id !== 'cercle' && !occupant && libres;
    h += `<button type="button" class="balise${choisie}${vise ? ' visee' : ''}" ${pos(b.pied)} data-action="batiment" data-id="${id}" data-lieu="${id}" aria-label="${echap(d.nom)}${niv ? tr`, niveau ${niv}` : tr(', à construire')}${occupant ? tr`, ${echap(porteurDef(occupant).nom)} au poste` : ''}">`
      + (niv && occupant ? cristalVisage(occupant, niv)
        : niv ? `<b class="bal-cristal">${niv}</b>` : `<b class="bal-cristal a-construire" title="${tr`À construire`}">${ICO.marteau}</b>`)
      + `<span class="bal-nom">${echap(d.nom)}</span></button>`;
    // une seule bulle par bâtiment, la plus urgente
    if (prete) h += bulle('alerte', ICO.ok, tr('Forge : la carte est prête'));
    else if (vise) h += bulle('alerte objectif', ICO.objectif, tr`${echap(d.nom)} : l’objectif se fait ici`);
    else if (ch) h += bulle('info', `${ICO.marteau}<em>${decompte(ch.fin, e.now)}</em>`, tr`${echap(d.nom)} : amélioration en cours`);
    else if (j.forge && id === 'forge') h += bulle('info', `${ICO.chrono}<em>${decompte(j.forge.fin, e.now)}</em>`, tr('Forge : fabrication en cours'));
    else if (vacant) h += bulle('vacant', ICO.posteLibre, tr`${echap(d.nom)} : personne au poste`);
    else if (id === 'comptoir') {
      const reste = j.comptoir.offres.length - j.comptoir.achetes.length;
      if (reste > 0) h += bulle('info', `${ICO.cartes}<em>${reste}</em>`, tr`Comptoir : ${reste} carte${reste > 1 ? 's' : ''} en vente`);
    } else if (id === 'cercle' && niv) {
      // le Cercle : un défi ou une proposition d'échange qui attend une réponse, une amitié à accepter
      const n = e.cercle?.aRepondre ?? 0;
      if (n > 0) h += bulle('alerte', `${ICO.cercle}<em>${n}</em>`, tr`Cercle des quais : ${n} réponse${n > 1 ? 's' : ''} attendue${n > 1 ? 's' : ''}`, 'cercle');
    }
  }
  // les habitations : pas un bâtiment à monter, donc pas de niveau ni de poste, seulement le palier de Confiance et la population
  // les habitations n'ont leur nom qu'avec les secours (après −2), comme la roue de la barre du haut
  if (CUVETTE && bassesOuvertes(j)) {
    const f = nbFoyers(j);
    const n = niveauConfiance(f);
    h += `<button type="button" class="balise habitants" ${pos(BALISE_HABITANTS)} data-action="ressource" data-id="confiance" data-lieu="habitants" aria-label="${tr`Habitations : ${f} familles sur ${CONFIANCE.population} te suivent, palier ${n.niveau}`}">`
      + `<b class="bal-cristal glace">${ICO.porteurs}</b><span class="bal-nom">${tr`Familles · ${f}`}</span></button>`;
  }
  return h;
}

/**
 * Quelqu'un au poste (2 novembre 2026, Luc : « on ne voit plus les gars dedans » ; Bryan : la tête du Porteur dans le repère).
 * Le cristal s'agrandit et montre son visage ; le niveau du bâtiment reste lisible sur un petit cristal d'or serti en bas à droite.
 */
function cristalVisage(occupant: string, niv: number): string {
  const img = portrait(occupant);
  const initiale = echap(porteurDef(occupant).nom.charAt(0));
  return `<b class="bal-cristal visage"${img ? ` style="--visage:url(${img})"` : ''}>${img ? '' : `<span class="bal-initiale">${initiale}</span>`}<i class="bal-niv">${niv}</i></b>`;
}

/** La mission du moment, posée en haut du tableau */
function mission(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  if (o) {
    const fait = o.fait(j);
    const gain = (o.recompense.energie ?? 0) + (o.recompense.composants ?? 0) ? prix('energie', (o.recompense.energie ?? 0) + (o.recompense.composants ?? 0)) : ''
      + (o.recompense.creuseurs ? prix('ouvrier', o.recompense.creuseurs, true, 'creuseurs') : '');
    // sur téléphone, l'objectif guidé se replie en une barre comme celui du jour (25 octobre 2026, Bryan : « beaucoup trop de place ») :
    // la toucher emmène là où il se fait, la flèche déplie la consigne. Sur PC, il reste toujours ouvert.
    // 28 octobre 2026 : sur téléphone, l'objectif vit dans une bulle (bulles()) ; le panneau complet ne s'y montre que déplié
    const replie = false;
    const barre = replie
      ? `<section class="mission jour replie barre guide" aria-label="${tr`Objectif`}">`
        + `<button type="button" class="mj-aller" data-action="objectif-guide" aria-label="${tr`Objectif ${j.objectif + 1} sur ${OBJECTIFS.length} : ${echap(o.titre)}. Y aller`}">`
        + `<span class="surtitre">${tr`Objectif`}</span><strong>${echap(o.titre)}</strong>${ICO.lancer}</button>`
        + `<button type="button" class="mj-plier" data-action="panneau" aria-expanded="false" aria-label="${tr`Lire la consigne`}"><i aria-hidden="true">▾</i></button></section>`
      : '';
    return barre + `<section class="mission guide${fait ? ' faite' : ''}${replie ? ' pc-seul' : ''}" aria-label="${tr`Objectif`}"><div class="mission-tete"><span class="surtitre">${tr`OBJECTIF ${j.objectif + 1} / ${OBJECTIFS.length}`}</span><span class="gains">${gain}</span></div>`
      + `<strong>${echap(o.titre)}</strong>`
      + (fait ? `<button type="button" class="btn prim" data-action="reclamer">${ICO.ok}${tr`Récupérer la récompense`}</button>` : `<p>${echap(o.consigne)}</p>`
        + `<button type="button" class="btn sec mj-y-aller mob" data-action="objectif-guide">${ICO.lancer}${tr`Y aller`}</button>`)
      + `</section>`;
  }
  if (!j.chambre) return '';
  const q = j.quotidien;
  const def = QUOTIDIENS[q.type];
  const max = ARCHIVE.paliers[ARCHIVE.paliers.length - 1]!;
  const crans = ARCHIVE.paliers.map((p) => `<i class="cran${j.archive.points >= p ? ' atteint' : ''}" style="left:${(p / max) * 100}%"></i>`).join('');
  // Deux blocs : l'objectif et l'Archive (la Confiance est montée dans la barre du haut, 27 octobre 2026), et la rumeur du marché. Sur téléphone ils restent serrés dans un seul panneau ;
  // sur PC (panneau-district.css, 23 octobre 2026) chacun devient sa propre carte de verre, avec plus de détails.
  // Les éléments « pc » ne s'affichent que sur PC, les « mob » que sur téléphone.
  const points = Math.min(j.archive.points, max);
  // sur téléphone, le panneau se replie (23 octobre 2026, Bryan : « je ne sais pas fermer cette page ») : replié,
  // il ne garde que l'objectif du jour et sa jauge ; on le touche pour tout voir. Sur PC, il reste toujours ouvert.
  const replie = false;
  // replié, sur téléphone : une seule barre fine. Toucher l'objectif emmène là où il se remplit ; la flèche ouvre les détails.
  let barre = '';
  if (replie && quotidienActif(j) && !quotidienFait(j)) {
    barre = `<section class="mission jour replie barre" aria-label="${tr`Objectif du jour`}">`
      + `<button type="button" class="mj-aller" data-action="objectif-aller" data-id="${q.type}" aria-label="${tr`Objectif du jour : ${echap(def.titre)}, ${q.progres} sur ${def.objectif}. Y aller`}">`
      + `<span class="surtitre">${tr`Objectif`}</span><strong>${echap(def.titre)}</strong><b class="chiffre">${q.progres}/${def.objectif}</b>${ICO.lancer}</button>`
      + `<button type="button" class="mj-plier mob" data-action="panneau" aria-expanded="false" aria-label="${tr`Voir le butin et le marché`}"><i aria-hidden="true">▾</i></button></section>`;
  }
  // avec la barre, le panneau complet n'est plus montré que sur PC (district.css)
  let h = barre + `<section class="mission jour${quotidienFait(j) ? ' faite' : ''}${replie ? ' replie' : ''}${barre ? ' pc-seul' : ''}" aria-label="${tr`Objectif du jour`}">`
    + `<div class="mj-obj">`;
  if (quotidienActif(j)) {
    const reserve = q.reserve > 1
      ? `<span class="mj-reserve pc" title="${tr`${q.reserve} objectifs en réserve : ils s’accumulent jusqu’à 3 si tu ne joues pas`}">${Array.from({ length: 3 }, (_, i) => `<i class="${i < q.reserve ? 'plein' : ''}"></i>`).join('')}<small>${tr`${q.reserve} en réserve`}</small></span>`
      : '';
    h += `<div class="mission-tete"><span class="surtitre mob">${tr`OBJECTIF DU JOUR${q.reserve > 1 ? tr` · ${q.reserve} EN RÉSERVE` : ''}`}</span><span class="surtitre pc">${tr`OBJECTIF DU JOUR`}</span>${reserve}<span class="chiffre mob">${q.progres} / ${def.objectif}</span></div><strong>${echap(def.titre)}</strong>`
      + (quotidienFait(j)
        ? `<button type="button" class="btn prim" data-action="reclamer-jour">${ICO.coffre}${tr`Récupérer : une carte ou 2 Éclats`}</button>`
        : `<div class="mj-progres"><div class="jauge"><i style="width:${(100 * q.progres) / def.objectif}%"></i></div><span class="chiffre pc"><b>${q.progres}</b> / ${def.objectif}</span></div>`
          + `<button type="button" class="btn sec mj-y-aller mob" data-action="objectif-aller" data-id="${q.type}">${ICO.lancer}${tr`Y aller`}</button>`
          + `<p class="mj-gain pc">${icone('coffre')}<span>${tr`Récompense :`} <b>${tr`une carte`}</b> ${tr`ou`} <b>${tr`2 Éclats`}</b>${tr`, au choix`}</span></p>`);
  } else h += `<div class="mission-tete"><span class="surtitre">${tr`OBJECTIF DU JOUR`}</span></div><small class="aide">${tr`Tous faits : le prochain arrive demain.`}</small>`;
  h += `</div>`;
  h += (j.chambre ? `<p class="rumeur"><b>${tr`Au marché`}</b> ${echap(rumeurDuJour(jourDe(Date.now()), j.strate))}</p>` : '');
  const reperes = ARCHIVE.paliers.map((p, i) => `<span class="${points >= p ? 'atteint' : ''}" style="left:${(p / max) * 100}%">${i === ARCHIVE.paliers.length - 1 ? '' : p}</span>`).join('');
  // le Butin de la semaine (ex-« Archive », renommé le 28 octobre 2026 : on ne comprenait pas ce que c'était) : un toucher ouvre sa fiche
  h += `<div class="archive" role="button" tabindex="0" data-action="ressource" data-id="butin" aria-label="${tr`Butin de la semaine : ${points} sur ${max} points. Comment ça marche`}">`
    + `<span class="mj-ico pc">${icone('coffre')}</span>`
    + `<span class="surtitre mob">${tr`BUTIN`}<i class="info-butin" aria-hidden="true">?</i></span><span class="surtitre pc">${tr`BUTIN DE LA SEMAINE`}<i class="info-butin" aria-hidden="true">?</i></span>`
    + `<span class="mj-valeur pc"><b>${points}</b>/${max}</span>`
    + `<div class="jauge reso">${crans}<i style="width:${Math.min(100, (100 * j.archive.points) / max)}%"></i></div>`
    + `<div class="mj-reperes pc" aria-hidden="true">${reperes}</div>`
    + `<small><span class="mob"><b>${points}</b>/${max} · </span><span class="pc">${tr`S’ouvre`} </span>${decompte(lundiSuivant(e.now), e.now, tr('lundi, dans '))}</small></div>`;
  return h + `</section>`;
}

/**
 * Les bulles du district, sur téléphone (28 octobre 2026, Bryan : « dans la plupart des jeux actuels, ça fait une bulle
 * comme Messenger et en cliquant ça se déploie ») : l'objectif et l'appel du moment (ravitaillement, expédition, butin)
 * deviennent des médaillons de verre en haut à gauche ; un toucher déplie le panneau complet, un autre le replie.
 * La gemme orange dit qu'une chose attend (récompense prête, colis à ouvrir). Sur PC, les panneaux restent ouverts.
 */
function bulles(e: EcranDistrict): string {
  const j = e.j;
  const r: string[] = [];
  const gemme = `<img class="bulle-gemme" src="${baseIcones}pastille.webp" alt="" aria-hidden="true">`;
  const o = objectifCourant(j);
  let part = 0, pret = false, titre = '';
  // un objectif guidé (début de partie) respire aussi, pour qu'une recrue trouve la bulle
  if (o) { pret = o.fait(j); part = pret ? 1 : 0; titre = tr`Objectif ${j.objectif + 1} sur ${OBJECTIFS.length} : ${o.titre}`; }
  else if (j.chambre && quotidienActif(j)) {
    const def = QUOTIDIENS[j.quotidien.type];
    pret = quotidienFait(j); part = Math.min(1, j.quotidien.progres / def.objectif); titre = tr`Objectif du jour : ${def.titre}, ${j.quotidien.progres} sur ${def.objectif}`;
  } else if (j.chambre) titre = tr('Objectifs du jour faits, butin de la semaine');
  if (titre) {
    const ouvert = e.bulle === 'objectif';
    r.push(`<button type="button" class="bulle-d objectif${ouvert ? ' ouverte' : ''}${pret || o ? ' prete' : ''}" data-action="bulle" data-id="objectif" aria-expanded="${ouvert}" aria-label="${echap(titre)}${pret ? tr(' : récompense prête') : ''}" style="--p:${Math.round(part * 100)}">`
      + `<span class="bulle-med">${icone('objectif')}</span>${pret ? gemme : ''}</button>`);
  }
  // l'appel du moment : la porte scellée (début du jeu) reste une grande carte, le reste passe en bulle
  if (j.chambre && appel(e)) {
    const ouvert = e.bulle === 'appel';
    const ico = j.expedition ? icone('strate') : icone('coffre');
    const nom = j.expedition ? tr`Expédition en cours, Strate −${j.expedition.strate}` : j.archive.aOuvrir && !o ? tr('Le Butin de la semaine est prêt') : tr`Ravitaillement du jour${j.ravitaillement.reserve > 1 ? tr`, ${j.ravitaillement.reserve} colis` : ''}`;
    const nb = !j.expedition && j.ravitaillement.reserve > 1 ? `<b class="bulle-nb">${j.ravitaillement.reserve}</b>` : '';
    r.push(`<button type="button" class="bulle-d appel-bulle prete${ouvert ? ' ouverte' : ''}" data-action="bulle" data-id="appel" aria-expanded="${ouvert}" aria-label="${echap(nom)}">`
      + `<span class="bulle-med">${ico}</span>${nb || gemme}</button>`);
  }
  return r.length ? `<div class="bulles" role="group" aria-label="${tr`Objectif et ravitaillement`}">${r.join('')}</div>` : '';
}

/** Le grand bouton d'action posé en bas du tableau, quand une chose attend le joueur */
function appel(e: EcranDistrict): string {
  const j = e.j;
  if (j.expedition) {
    return `<button type="button" class="appel" data-action="reprendre">${ICO.descendre}<span><strong>${j.expedition.tutoriel ? tr('La chambre scellée') : tr`Expédition · Strate −${j.expedition.strate}`}</strong><small>${j.expedition.carte && j.expedition.phase === 'carte' ? tr`Ta descente t’attend là où tu l’as laissée : reprendre` : tr('Le combat t’attend : reprendre')}</small></span></button>`;
  }
  if (!j.chambre) {
    return `<button type="button" class="appel reso" data-action="rencontre">${ICO.porte}<span><strong>${tr`La porte scellée`}</strong><small>${tr`Sous la Tour du Noyau, trois personnes t’attendent`}</small></span></button>`;
  }
  if (j.archive.aOuvrir && !objectifCourant(j)) {
    return `<button type="button" class="appel reso" data-action="ouvrir-archive">${icone('coffre')}<span><strong>${tr`Le Butin de la semaine est prêt`}</strong><small>${tr`Palier ${j.archive.aOuvrir} sur ${ARCHIVE.paliers.length} atteint : ouvre-le`}</small></span></button>`;
  }
  if (colisDisponible(j)) {
    const reste = colisAvantChoix(j);
    return `<button type="button" class="appel colis" data-action="colis">${icone('coffre')}<span><strong>${tr`Ravitaillement du jour${j.ravitaillement.reserve > 1 ? tr` · ${j.ravitaillement.reserve} colis` : ''}`}</strong>`
      + `<small><b class="colis-ouvrir">${tr`Touche pour l’ouvrir`}</b> ${tr`· cristaux et un doublon · ${reste === 1 ? tr('celui-ci contient une carte au choix') : tr`carte au choix dans ${reste} colis`}`}</small></span>`
      + `<span class="crans-colis" aria-hidden="true">${Array.from({ length: RAVITAILLEMENT.cycle }, (_, i) => `<i class="${i < j.ravitaillement.ouverts % RAVITAILLEMENT.cycle ? 'plein' : ''}"></i>`).join('')}</span></button>`;
  }
  return '';
}

// ---------- La feuille d'un bâtiment ----------
// Revue du 22 octobre 2026 (lisibilité, direction artistique, game design) : l'îlot en grand en tête,
// des chiffres réels plutôt que des multiplicateurs (« +60 énergie/h », pas « ×2 »), des Porteurs qui
// tiennent dans l'écran, la réserve remplie / maximum, et le niveau suivant juste au-dessus du bouton.


/** Le district tel qu'il serait avec ce Porteur à ce poste (null : poste vide), pour comparer sans rien changer */
function avecPorteur(j: Jeu, b: Poste, id: string | null): Jeu {
  const porteurs: Jeu['porteurs'] = {};
  for (const [k, v] of Object.entries(j.porteurs)) porteurs[k] = { ...v, poste: v.poste === b ? null : v.poste };
  if (id && porteurs[id]) porteurs[id] = { ...porteurs[id]!, poste: b };
  return { ...j, porteurs };
}

/** Ce que rend le poste avec ce Porteur : une valeur comparable et sa forme lisible */
function rendement(j: Jeu, b: Exclude<Poste, 'noyau'>, id: string | null): { v: number; court: string; long: string } {
  // le Générateur : plus il taille vite, moins il lui faut d'heures (on compare des vitesses : 1 / heures)
  if (b === 'generateur') {
    // le temps réel pour tout tailler (10 novembre 2026, audit) : heuresDeTaille est la part taillée chaque heure, pas une durée
    const jp = avecPorteur(j, b, id); const h = heuresDeTaille(jp); const v = h ? Math.round(100 / h) / 100 : 0;
    const t = brutEnAttente(jp); const d = t.brut ? `${t.heures} h` : `${virgule(Math.round(h * 10) / 10)} h`;
    return { v, court: d, long: tr`tout taillé en ${d}` };
  }
  if (b === 'clinique') { const v = Math.round(soinParHeure(avecPorteur(j, b, id)) * 10) / 10; return { v, court: `${virgule(v)}/h`, long: tr`${virgule(v)} Usure soignée/h` }; }
  const d = batimentDef(b);
  const v = !id ? 1 : porteurDef(id).lignee === d.affinite ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste;
  return { v, court: `×${virgule(v)}`, long: tr`vitesse ×${virgule(v)}` };
}

const multPoste = (b: Exclude<Poste, 'noyau'>, id: string) => {
  const ideal = porteurDef(id).lignee === batimentDef(b).affinite;
  return `<span class="fb-mult${ideal ? ' ideal' : ''}" title="${ideal ? tr('Lignée idéale pour ce bâtiment') : tr('Autre lignée')}">×${virgule(ideal ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste)}</span>`;
};

/** Le petit marteau sur un portrait : ce Porteur travaille ailleurs et quittera son poste (28 octobre 2026) */
const badgePris = (j: Jeu, id: string) => { const b = j.porteurs[id]!.poste; return b ? `<span class="te-pris" title="${tr`Au travail : ${echap(batimentDef(b).nom)}`}">${ICO.marteau}</span>` : ''; };

/** Le portrait d'un Porteur en tuile (12 novembre 2026, refonte des feuilles de bâtiment) : l'image en haut, liseré de sa lignée */
function tuilePortrait(j: Jeu, id: string): string {
  const d = porteurDef(id);
  const p = portrait(id);
  return `<span class="tb-visage" style="--c:${COULEUR[d.lignee]}">${p ? `<img src="${p}" alt="" decoding="async" loading="lazy">` : `<b>${echap(d.nom.charAt(0))}</b>`}${badgePris(j, id)}</span>`;
}

/** Au-delà de six Porteurs, la liste se replie : deux rangées, puis un bouton pour voir les autres */
function tousPorteurs(e: EcranDistrict, n: number): string {
  if (n <= 6) return '';
  return `<button type="button" class="te-fermer tb-tous" data-action="bat-tous" aria-expanded="${e.porteursTous ? 'true' : 'false'}">${e.porteursTous ? tr('Moins de Porteurs') : tr`Voir les ${n - 6} autres`}</button>`;
}

/** Un Porteur qu'on peut poster : son portrait, ce que donnerait le poste avec lui (et l'écart), un marteau s'il travaille ailleurs */
function candidat(j: Jeu, id: string, poste: Exclude<Poste, 'noyau'>, actuel: number, conseille = false): string {
  const d = porteurDef(id);
  const ailleurs = j.porteurs[id]!.poste;
  const r = rendement(j, poste, id);
  const ecart = Math.round((r.v - actuel) * 10) / 10;
  const signe = ecart > 0 ? 'plus' : ecart < 0 ? 'moins' : 'egal';
  const delta = poste === 'forge' || poste === 'generateur' || ecart === 0 ? '' : `<i>${ecart > 0 ? '+' : '−'}${virgule(Math.abs(ecart))}</i>`;
  return `<button type="button" class="tb-cand ${signe}${conseille ? ' conseille' : ''}" data-action="poster" data-id="${id}" data-poste="${poste}" aria-label="${tr`Poster ${echap(d.nom)} : ${r.long}${ailleurs ? tr`, quitte ${echap(batimentDef(ailleurs).nom)}` : ''}`}">`
    + `${tuilePortrait(j, id)}${multPoste(poste, id)}${conseille ? `<span class="tb-conseil">${tr`Conseillé`}</span>` : ''}`
    + `<span class="tb-cand-txt"><strong>${echap(d.nom.split(' ')[0]!)}</strong><span class="tb-eff">${r.court}${delta}</span></span></button>`;
}

const ICONE_GAIN: Record<GainNiveau['quoi'] | 'apparence', Icone> = {
  energie: 'energie', soin: 'soin', stockage: 'coffre', creuseurs: 'ouvrier', strate: 'descendre', forge: 'chrono',
  plafond: 'tour', chantiers: 'marteau', porteur: 'porteurs', apparence: 'district', entrainement: 'monter', offres: 'cartes', argent: 'cristal',
  places: 'monter', barques: 'porteurs', commune: 'cartes', cercle: 'cercle', echanges: 'echange', ouvertes: 'chrono', vitrine: 'cartes', or: 'cristal', eclats: 'eclats', pv: 'soin',
};
const valeurGain = (v: number, unite?: string) => (v === Infinity ? '∞' : `${Number.isInteger(v) ? ent(v) : (Math.round(v * 10) / 10).toLocaleString(locale()).replace(/\u202f/g, '\u00a0')}${unite ? ` ${unite}` : ''}`);

/** Ce que change le niveau suivant : les chiffres qui montent (avant → après), ce qui se débloque, et la nouvelle apparence */
function gainsNiveau(j: Jeu, b: BatimentId): string {
  const niv = j.batiments[b];
  const gains: (GainNiveau | { quoi: 'apparence'; texte: string; detail?: string; avant?: undefined; apres?: undefined; unite?: undefined; carte?: undefined })[] = gainsAmelioration(j, b);
  const nouvelle = (b === 'noyau' || !CUVETTE ? prochainVisuel(niv) : prochainPalier(niv)) === niv + 1;
  if (nouvelle) gains.push(b === 'noyau' ? { quoi: 'apparence', texte: tr('Le district change d’âge'), detail: tr('nouvelle vue d’ensemble') } : { quoi: 'apparence', texte: tr('Nouvelle apparence'), detail: tr('le bâtiment se transforme') });
  if (!gains.length) return '';
  // des tuiles (12 novembre 2026, refonte des feuilles) : le chiffre d'abord, en grand, puis ce qu'il mesure
  return `<ul class="tb-gains">` + gains.map((g) => {
    const chiffre = g.avant !== undefined && g.apres !== undefined;
    const ecart = chiffre && Number.isFinite(g.avant) && Number.isFinite(g.apres) ? g.apres! - g.avant! : 0;
    const art = g.carte ? illustrationModule(g.carte) : g.quoi === 'apparence' && b !== 'noyau' ? illustrationBatiment(b, niv + 1) : null;
    const visuel = art ? `<img class="tb-g-art${g.carte ? ' carte' : ''}" src="${art}" alt="" decoding="async" loading="lazy">` : `<span class="tb-g-ico">${ICO[ICONE_GAIN[g.quoi]]}</span>`;
    const u = g.unite ? `<small>${g.unite}</small>` : '';
    const valeur = chiffre ? `<span class="tb-g-val"><s>${valeurGain(g.avant!)}</s><b>${valeurGain(g.apres!)}${u}</b>${ecart > 0 ? `<i>+${valeurGain(ecart)}${g.unite ? '\u00a0' + g.unite : ''}</i>` : ''}</span>` : '';
    return `<li class="tb-gain${chiffre ? '' : ' large'}${art ? ' illustre' : ''}">${visuel}<span class="tb-g-corps">${valeur}<span class="tb-g-txt">${echap(g.texte)}</span>${g.detail ? `<small>${echap(g.detail)}</small>` : ''}</span></li>`;
  }).join('') + `</ul>`;
}

/** Une ressource du coût, lue « ce que j'ai / ce qu'il faut » (23 octobre 2026) : pas de soustraction à faire, le rouge dit ce qui manque */
function coutDetail(icone: Icone, besoin: number, possede: number, nom: string): string {
  const court = possede < besoin;
  return `<span class="fb-prix${court ? ' court' : ''}" title="${nom} : ${ent(possede)} / ${ent(besoin)}" aria-label="${tr`${nom} : ${ent(possede)} sur ${ent(besoin)}`}">${ICO[icone]}<b>${ent(Math.min(possede, besoin))}</b><small>/ ${ent(besoin)}</small></span>`;
}

/** Les Éclats que la taille recueille chaque jour (9 novembre 2026), dès le niveau 4 */
function eclatsTailleTexte(j: Jeu): string {
  const max = DISTRICT.eclatsParJour[j.batiments.generateur] ?? 0;
  if (!max) return `<small>${ICO.eclats}${tr`Au niveau 4, il recueillera des Éclats dans le minerai qu’il taille.`}</small>`;
  const n = j.eclatsTaille?.jour === jourDe(Date.now()) ? j.eclatsTaille.n : 0;
  return `<small>${ICO.eclats}${tr`En taillant, il recueille un Éclat tous les ${DISTRICT.eclatTous} cristaux :`} <b>${n} / ${max}</b> ${tr`aujourd’hui.`}</small>`;
}

/**
 * La taille du minerai (9 novembre 2026, économie à cristal unique) : ce qui attend au Générateur, le temps qu'il faudra,
 * et une jauge qui se vide à mesure. Rien ne se perd : sans minerai, il attend.
 */
function taille(j: Jeu): string {
  const t = brutEnAttente(j);
  const h = heuresDeTaille(j);
  const note = t.brut
    ? decompte(Date.now() + t.heures * 3_600_000, Date.now(), tr('Tout taillé dans '), tr(' · continue même jeu fermé.'))
    : tr('Rien à tailler : descends ou envoie une barque, il taillera tout ce que tu rapportes.');
  // le détail du rythme passe en appui long (12 novembre 2026, audit du début : texte trop technique pour un premier coup d'œil)
  const rythme = tr`Chaque heure, il taille ${h ? (h === 4 ? tr('environ un quart') : tr`environ un ${virgule(Math.round(h * 10) / 10)}ᵉ`) : tr('une part')} de ce qui attend, au moins ${ent(plancherTaille(j))} : plus il monte, plus il va vite.`;
  return `<div class="fb-reserve" title="${echap(rythme)}"><div class="fb-reserve-tete">${ICO.composants}<span>${tr`Minerai en taille`}</span><b>${ent(t.brut)}</b></div>`
    + `<div class="fb-jauge" role="meter" aria-valuemin="0" aria-valuemax="${Math.max(1, t.brut + j.energie)}" aria-valuenow="${t.brut}" aria-label="${tr`Minerai en taille`}"><i style="width:${t.brut ? Math.min(100, Math.max(6, (100 * t.brut) / (t.brut + 20 * Math.max(1, raffinageParHeure(j))))) : 0}%"></i></div>`
    + `<small>${note}</small>${eclatsTailleTexte(j)}</div>`;
}

/** Les soins intensifs de la Clinique (27 octobre 2026) : des cristaux pour effacer l'Usure d'un Porteur tout de suite */
function blocSoinsIntensifs(j: Jeu): string {
  const blesses = PORTEURS.filter((p) => porteursPresents(j).includes(p.id) && !enExpedition(j, p.id) && j.porteurs[p.id]!.usure >= 1);
  const tarif = SOINS_INTENSIFS.usureParCristal > 1 ? tr`1 cristal pour ${SOINS_INTENSIFS.usureParCristal} points` : SOINS_INTENSIFS.usureParCristal < 1 ? tr`${prixSoins(1)} cristaux par point` : tr('1 cristal par point');
  let h = `<section class="fb-bloc fb-soins"><h3 class="titre-bloc">${ICO.soin}${tr`Soins intensifs`}</h3>`
    + (j.soinOffert ? `<p class="fb-vide">${tr`Efface l’Usure tout de suite :`} <b>${tarif}</b>.</p>`
      : `<p class="fb-vide">${tr`Efface l’Usure tout de suite.`} <b>${tr`La première fois, c’est offert`}</b> ${tr`; ensuite ${tarif}.`}</p>`);
  if (!blesses.length) return h + `<p class="fb-note">${tr`Personne n’a d’Usure en ce moment.`}</p></section>`;
  h += `<div class="fb-rangee">` + blesses.map((p) => {
    const u = Math.ceil(j.porteurs[p.id]!.usure);
    const cout = prixSoins(u);
    const offert = !j.soinOffert;
    const peut = offert || j.energie >= 1;
    return `<button type="button" class="fb-cand plus" style="--c:${COULEUR[p.lignee]}" data-action="soigner-vite" data-id="${p.id}"${peut ? '' : ' disabled'} aria-label="${tr`Soigner ${echap(p.nom)} : −${u} Usure ${offert ? tr('offert') : tr`pour ${cout} cristaux`}`}">`
      + `<span class="fb-cand-portrait">${avatar(p.id, 56)}</span><strong>${echap(p.nom.split(' ')[0]!)}</strong><span class="fb-cand-eff">${tr`−${u} Usure`}</span>`
      + (offert ? `<span class="te-prix offert">${tr`Offert`}</span></button>`
        : `<span class="te-prix${j.energie < cout ? ' manque' : ''}">${ICO.energie}${ent(Math.min(cout, Math.floor(j.energie)))}</span></button>`);
  }).join('') + `</div>`;
  return h + `</section>`;
}

/**
 * L'entraînement à la Tour (écran refait le 28 octobre 2026, modèle « laboratoire ») : une seule salle, au centre.
 * Occupée : qui, vers quel niveau, la jauge. Libre : relancer le dernier en un geste. Le choix d'un autre Porteur
 * ne s'ouvre qu'à la demande, et ne montre que ceux qui peuvent encore progresser ici.
 */
function blocEntrainement(e: EcranDistrict): string {
  const j = e.j;
  const now = e.now;
  if (!j.chambre) return '';
  // plusieurs places selon le niveau de la Tour (28 octobre 2026, Bryan) : 1 aux niveaux 1-2, 2 aux niveaux 3-4, 3 au dernier
  // refonte du 12 novembre 2026 : chaque place est un socle (le Porteur en séance, ou un « + » doré), les règles derrière un ⓘ
  const seances = seancesDe(j);
  const places = placesEntrainement(j);
  const libresN = Math.max(0, places - seances.length);
  const ps = plafondSeance(j);
  const plafond = ps.niveau;
  const niveau = (id: string) => niveauPorteur(j, id).niveau;
  const prixTe = (n: number, manque = false) => `<span class="te-prix${manque ? ' manque' : ''}">${icone('energie')}${ent(n)}</span>`;
  const presents = PORTEURS.filter((p) => !seanceDe(j, p.id) && porteursPresents(j).includes(p.id) && !enExpedition(j, p.id));
  const eligibles = presents.filter((p) => apercuSeance(j, p.id)).sort((x, y) => niveau(x.id) - niveau(y.id));
  const relance = libresN && j.derniereSeance ? eligibles.find((p) => p.id === j.derniereSeance) : undefined;
  const enCours = seances.length > 0 || !!relance;
  const ouvert = libresN > 0 && (!enCours || !!e.tourChanger);
  const auMax = presents.filter((p) => !apercuSeance(j, p.id)).length;

  // l'en-tête : le plafond en clair, le reste des règles se déplie
  const regles = [tr`Une séance = un niveau, jusqu’au niveau ${plafond}.`];
  if (ps.par === 'escouade') regles.push(tr`La Tour irait jusqu’au ${plafondEntrainement(j)}, mais ne fait pas dépasser ton meilleur Porteur d’escouade : il monte en combattant.`);
  if (auMax) regles.push(tr`${auMax} Porteur${auMax > 1 ? 's sont' : ' est'} déjà au niveau ${plafond}.`);
  regles.push(tr('Les cristaux se paient au lancement ; arrêter une séance rend ce qui n’a pas servi.'));
  let h = `<section class="fb-bloc te"><div class="tb-tete"><h3 class="titre-bloc">${ICO.monter}${tr`Entraînement`}</h3>`
    + `<details class="tb-info"><summary aria-label="${tr`Règles de l’entraînement`}">${tr`jusqu’au <b>niv. ${plafond}</b>`}<span class="tb-i" aria-hidden="true">i</span></summary><div>${regles.map((r) => `<p>${r}</p>`).join('')}</div></details></div>`;

  const socles: string[] = [];
  for (const s of seances) {
    const o = porteurDef(s.porteur);
    const debut = now - (s.xpGagnee / s.xpHeure) * 3_600_000;
    const fin = now + ((s.xpTotale - s.xpGagnee) / s.xpHeure) * 3_600_000;
    const rendu = Math.floor(s.energie * Math.max(0, 1 - s.xpGagnee / s.xpTotale));
    socles.push(`<div class="te-socle occ" style="--c:${COULEUR[o.lignee]}">${tuilePortrait(j, s.porteur)}`
      + `<button type="button" class="te-arret" data-action="liberer" data-id="${s.porteur}" aria-label="${tr`Arrêter la séance ${echap(deNom(o.nom))}${rendu ? tr` : ${rendu} cristaux rendus` : ''}`}"><span>${ICO.fermer}</span></button>`
      + `<span class="te-socle-txt"><strong>${echap(o.nom.split(' ')[0]!)}</strong><span class="te-niv">${niveau(s.porteur)} → <b>${s.cible}</b></span>`
      + `<span class="jauge or">${jaugeTemps(debut, fin, now)}</span><span class="te-temps">${decompte(fin, now)}</span></span></div>`);
  }
  if (relance) {
    const a = apercuSeance(j, relance.id)!;
    const peut = j.energie >= a.energie;
    socles.push(`<div class="te-socle fini" style="--c:${COULEUR[relance.lignee]}">${tuilePortrait(j, relance.id)}`
      + `<span class="te-socle-txt"><span class="te-etat">${tr`Terminé`}</span><strong>${echap(relance.nom.split(' ')[0]!)}</strong>`
      + `<button type="button" class="btn prim te-relancer" data-action="poster" data-id="${relance.id}" data-poste="noyau"${peut ? '' : ' disabled'} aria-label="${tr`Relancer ${echap(relance.nom)} vers le niveau ${a.cible} : ${a.energie} cristaux`}">${tr`Relancer`}${prixTe(a.energie, !peut)}</button></span></div>`);
  }
  const videsN = libresN - (relance ? 1 : 0);
  for (let i = 0; i < videsN; i++) {
    // une place libre se touche pour ouvrir la liste (quand elle est fermée)
    const touche = enCours && !e.tourChanger;
    socles.push(`<${touche ? 'button type="button" data-action="tour-changer" aria-expanded="false"' : 'div'} class="te-socle vide"><span class="te-plus" aria-hidden="true">+</span><small>${tr`Place libre`}</small></${touche ? 'button' : 'div'}>`);
  }
  // la place suivante, verrouillée, tant qu'il y a la place de la montrer
  const prochain = ENTRAINEMENT.places.findIndex((n) => n > places);
  if (prochain > 0 && socles.length < 3) socles.push(`<div class="te-socle verrou">${ICO.verrou}<small>${tr`Tour niv. ${prochain}`}</small></div>`);
  h += `<div class="te-socles">${socles.join('')}</div>`;

  if (relance && !videsN && !e.tourChanger) h += `<button type="button" class="te-fermer" data-action="tour-changer" aria-expanded="false">${tr('Un autre Porteur')}</button>`;
  if (ouvert) {
    const choix = eligibles.filter((p) => p.id !== relance?.id);
    if (choix.length) {
      h += `<div class="tb-cands">` + choix.slice(0, e.porteursTous ? undefined : 6).map((p) => {
        const a = apercuSeance(j, p.id)!;
        const peut = j.energie >= a.energie;
        const ailleurs = j.porteurs[p.id]!.poste;
        return `<button type="button" class="tb-cand" data-action="poster" data-id="${p.id}" data-poste="noyau"${peut ? '' : ' disabled'} aria-label="${tr`Entraîner ${echap(p.nom)}, niveau ${niveau(p.id)} vers ${a.cible}, ${duree(a.heures * 3_600_000)}, ${a.energie} cristaux${ailleurs ? tr`, quitte ${echap(batimentDef(ailleurs).nom)}` : ''}`}">`
          + `${tuilePortrait(j, p.id)}<span class="tb-cand-txt"><strong>${echap(p.nom.split(' ')[0]!)}</strong><span class="tb-eff">${niveau(p.id)} → <b>${a.cible}</b></span>${prixTe(a.energie, !peut)}</span></button>`;
      }).join('') + `</div>${tousPorteurs(e, choix.length)}`;
      if (choix.some((p) => j.porteurs[p.id]!.poste)) h += `<p class="te-note">${ICO.marteau}${tr`quitte son poste au district`}</p>`;
    } else if (!enCours) {
      h += `<p class="te-note">${tr`Personne à entraîner pour l’instant.`}</p>`;
    }
    if (enCours) h += `<button type="button" class="te-fermer" data-action="tour-changer" aria-expanded="true">${tr`Fermer`}</button>`;
  }
  return h + `</section>`;
}

/**
 * Le Comptoir (23 octobre 2026) : les cartes du jour, à prix fixe. On voit la carte avant de payer ; chaque offre
 * ne s'achète qu'une fois, tout se renouvelle demain. L'or et la nacre restent à trouver dans les Strates.
 */
/** Le Cercle des quais dans sa feuille (3 novembre 2026) : ce qu'il permet à ce niveau, et la porte de l'écran du Cercle */
function blocCercle(e: EcranDistrict): string {
  const j = e.j;
  if (!cercleOuvert(j) || !j.batiments.cercle) return '';
  const n = e.cercle?.aRepondre ?? 0;
  return `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.echange}<b>${echangesParJour(j)}</b><small>${tr`échanges par jour`}</small></div>`
    + `<div class="fb-chiffre">${ICO.chrono}<b>${ouvertesMax(j)}</b><small>${tr`propositions en attente`}</small></div>`
    + `<div class="fb-chiffre">${ICO.cartes}<b>${vitrineMax(j)}</b><small>${tr`cartes en vitrine`}</small></div></div>`
    + `<p class="fb-note">${tr`Échanges jusqu’à l’${NOMS_RARETE[metalMax(j)].toLowerCase()}${metalMax(j) === 'argent' ? tr` (l’or au niveau ${CERCLE.orAuNiveau})` : ''} · jamais la nacre.`}</p>`
    + `<button type="button" class="btn prim large fb-entrer" data-action="cercle">${ICO.cercle}${tr`Entrer au Cercle`}${n ? ` <span class="pastille-n">${n}</span>` : ''}</button>`;
}

function blocComptoir(e: EcranDistrict): string {
  const j = e.j;
  if (!j.batiments.comptoir) {
    return `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.cartes}${tr`Une fois rouvert`}</h3><p class="fb-vide"><b>${tr`${COMPTOIR.etals[1]!.length} cartes`}</b> ${tr`en vente chaque jour (fer et cuivre), jusqu’à ${COMPTOIR.etals[COMPTOIR.etals.length - 1]!.length} avec les niveaux. L’or et la nacre ne se vendent pas.`}</p></section>`;
  }
  const c = j.comptoir;
  const demain = debutJour(c.jour + 1) - e.now;
  let h = `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.cartes}${tr`En vente aujourd’hui`}<span class="cp-renouv">${ICO.chrono}${decompte(e.now + demain, e.now, tr('nouvelles cartes dans '))}</span></h3><small class="aide choix-loupe">${tr`Reste appuyé sur une carte pour lire son effet.`}</small><div class="cp-etals">`;
  c.offres.forEach((id, i) => {
    const m = moduleDef(id);
    const possede = j.collection[id];
    const vendu = c.achetes.includes(i);
    const p = prixComptoir(id);
    const assez = j.energie >= p.composants && j.eclats >= p.eclats;
    const niveau = possede?.niveau ?? COLLECTION.niveauDepart[m.rarete];
    const ruban = possede ? tr`Doublon · niv. ${possede.niveau}` : tr('Nouvelle');
    h += `<div class="cp-offre${vendu ? ' vendue' : ''}" data-carte="${id}"><div class="cp-face">${faceCarte(m, niveau, multNiveau(id, niveau))}${vendu ? `<span class="cp-vendu">${ICO.ok}${tr`Achetée`}</span>` : ''}</div>`
      + `<span class="ruban${possede ? '' : ' neuve'}">${ruban}</span>`
      + (vendu ? '' : `<button type="button" class="btn ${assez ? 'prim' : 'sec'} petit cp-acheter" data-action="acheter" data-index="${i}"${assez ? '' : ' disabled'} aria-label="${tr`Acheter ${echap(m.nom)} (${NOMS_RARETE[m.rarete]})`}">${couts(j, { composants: p.composants, eclats: p.eclats })}</button>`)
      + `</div>`;
  });
  // renouveler les étals encore en vente, une fois par jour (1er novembre 2026)
  const places = renouvelablesComptoir(j).length;
  const assezR = j.energie >= COMPTOIR.renouveler;
  h += `</div><div class="cp-renouveler">`
    + (c.renouvele ? `<small class="aide">${ICO.ok}${tr`Étals déjà renouvelés aujourd’hui : nouvel arrivage demain.`}</small>`
      : !places ? `<small class="aide">${tr`Tout est vendu : nouvel arrivage demain.`}</small>`
      : `<small class="aide">${tr`Une fois par jour, les fouilleurs ressortent d’autres cartes du même métal à la place de ${places > 1 ? tr`celles encore en vente (${places})` : tr('celle encore en vente')}.`}</small>`
        + `<button type="button" class="btn sec petit" data-action="comptoir-renouveler"${assezR ? '' : ' disabled'} aria-label="${tr`Renouveler les étals pour ${COMPTOIR.renouveler} cristaux`}">${ICO.chrono}${tr`Renouveler les étals ${couts(j, { composants: COMPTOIR.renouveler, eclats: 0 })}`}</button>`)
    + `</div>`;
  // des Éclats contre des cristaux (audit du 7 novembre 2026), en petite quantité chaque jour
  const ec = eclatsAuComptoir(j);
  if (ec.max) {
    const prixE = prixEclatComptoir(j);
    const assezE = j.energie >= prixE;
    h += `<div class="cp-renouveler cp-eclats">`
      + (ec.restants
        ? `<small class="aide">${tr`Les fouilleurs revendent aussi les Éclats qu’ils remontent : encore`} <b>${tr`${ec.restants} sur ${ec.max}`}</b> ${tr`aujourd’hui.`}</small>`
          + `<button type="button" class="btn sec petit" data-action="comptoir-eclat"${assezE ? '' : ' disabled'} aria-label="${tr`Acheter un Éclat pour ${prixE} cristaux`}">${ICO.eclats}${tr`Acheter un Éclat ${couts(j, { composants: prixE, eclats: 0 })}`}</button>`
          + (ec.max > 1 ? `<small class="aide">${tr`Le prix monte avec les Éclats du jour : ${COMPTOIR.eclats.prix.join(', ')} cristaux.`}</small>` : '')
        : `<small class="aide">${ICO.ok}${tr`Plus d’Éclats à vendre aujourd’hui (${ec.max} par jour) : nouvel arrivage demain.`}</small>`)
      + `</div>`;
  }
  return h + `<small class="fb-absents">${tr`Un doublon fait monter une carte que tu as déjà. L’or et la nacre ne se vendent pas : ils se trouvent dans les Strates.`}</small></section>`;
}

/** Un lieu déjà peint mais pas encore ouvert : sa vue tirée du tableau, et la raison, dans le lore */
function feuilleLieuFutur(e: EcranDistrict, id: LieuFutur): string {
  const age = visuel(e.j.batiments.noyau);
  const pts = ZONES[age][id].split(' ').map((p) => p.split(',').map(Number) as [number, number]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  // le tableau, cadré sur le lieu : la vue tient dans un carré, le lieu au centre
  const cote = Math.max(x1 - x0, y1 - y0) * 1.15;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const taille = (400 / cote) * 100;
  const vue = `background-image:url(${sceneDistrict(e.j.batiments.noyau).url});background-size:${taille}% auto;`
    + `background-position:${((cx - cote / 2) / (400 - cote)) * 100}% ${((cy - cote / 2) / (600 - cote)) * 100}%`;
  const l = LIEUX_FUTURS[id];
  return `<div class="voile-feuille" data-action="fermer" aria-hidden="true"></div><section class="feuille fiche-bat fiche-futur" role="dialog" aria-modal="true" aria-labelledby="feuille-titre">`
    + `<span class="poignee" aria-hidden="true"></span><button type="button" class="btn-icone fb-fermer" data-action="fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button>`
    + `<div class="feuille-corps fb-corps"><header class="fb-heros"><div class="fb-scene" aria-hidden="true"><span class="fb-halo"></span><span class="ff-vue" style="${vue}"></span></div>`
    + `<div class="fb-titre"><span class="surtitre">${tr`Pas encore ouvert`}</span><h2 id="feuille-titre">${echap(l.nom)}</h2></div></header>`
    + `<p class="fb-role">${echap(l.raison)}</p><p class="ff-promesse">${echap(l.promesse)}</p></div></section>`;
}

/**
 * La Forge (refonte du 27 octobre 2026, Bryan : « super chargé et difficile à lire ») :
 * l'établi au centre, puis les cartes groupées par métal — le prix ne dépend que du métal, il n'est écrit qu'une fois —
 * avec leurs doublons. Par défaut, les cartes les plus proches de monter ; « Toutes » montre le reste.
 */
const FORGE_PROCHES = 6;
function blocForge(e: EcranDistrict): string {
  const j = e.j;
  const forgeron = posteDe(j, 'forge');
  let h = `<section class="fb-bloc"><h3 class="titre-bloc">${icone('marteau')}${tr`L’établi`}</h3>`;
  if (j.forge) {
    const m = moduleDef(j.forge.moduleId);
    const c = j.collection[j.forge.moduleId];
    const pret = e.now >= j.forge.fin;
    h += `<div class="fg-etabli occupe"><span class="fg-etabli-face">${faceCarte(m, c?.niveau ?? 1, multNiveau(m.id, c?.niveau ?? 1))}</span>`
      + `<div><small>${pret ? tr('Prête') : tr('Sur l’établi')}</small><strong>${echap(m.nom)}</strong><div class="jauge or">${jaugeTemps(j.forge.debut, j.forge.fin, e.now)}</div>`
      + `<small class="fg-reste">${pret ? tr('Elle rejoint tes cartes : un doublon de plus.') : decompte(j.forge.fin, e.now, tr('Prête dans '))}</small></div></div>`;
  } else {
    h += `<div class="fg-etabli vide"><span class="fg-etabli-face" aria-hidden="true">${ICO.marteau}</span><div><strong>${forgeron ? tr('L’établi est libre') : tr('Personne à la Forge')}</strong>`
      + `<small>${forgeron ? tr('Choisis une carte : elle revient en doublon, pour la faire monter.') : tr('Poste d’abord un Porteur pour refabriquer une carte.')}</small></div></div>`;
  }
  // les cartes : celles qui peuvent encore monter, les plus proches d'abord (moins de doublons manquants, puis moins chères)
  const ordre = (m: ModuleDef) => RARETES.indexOf(m.rarete);
  const cartes = Object.keys(j.collection).map((k) => ({ m: moduleDef(k), c: j.collection[k]! })).filter((x) => !x.m.legs && !x.m.origine)
    .map((x) => ({ ...x, requis: doublonsRequis(x.m.id, x.c.niveau) }));
  // une carte qui a déjà ses doublons n'a pas besoin de la Forge pour monter : elle passe après les autres
  const manque = (x: { requis: number | null; c: { doublons: number } }) => { const n = x.requis! - x.c.doublons; return n > 0 ? n : 1000 + n; };
  const utiles = cartes.filter((x) => x.requis !== null)
    .sort((a, b) => manque(a) - manque(b) || ordre(a.m) - ordre(b.m) || a.m.nom.localeCompare(b.m.nom));
  const toutes = e.forgeToutes === true;
  const montrees = toutes ? cartes : utiles.slice(0, FORGE_PROCHES);
  if (!cartes.length) return h + `</section>`;
  h += `<div class="fg-vues" role="tablist" aria-label="${tr`Cartes à refabriquer`}">`
    + `<button type="button" role="tab" class="es-cible${toutes ? '' : ' actif'}" data-action="forge-vue" data-id="proches" aria-selected="${!toutes}">${tr`Proches de monter`}</button>`
    + `<button type="button" role="tab" class="es-cible${toutes ? ' actif' : ''}" data-action="forge-vue" data-id="toutes" aria-selected="${toutes}">${tr`Toutes`} <b>${cartes.length}</b></button></div>`;
  if (!montrees.length) return h + `<p class="fb-vide">${tr`Toutes tes cartes sont au niveau maximum.`}</p></section>`;
  for (const r of RARETES) {
    const groupe = montrees.filter((x) => x.m.rarete === r);
    if (!groupe.length) continue;
    if (toutes) groupe.sort((a, b) => Number(a.requis === null) - Number(b.requis === null) || a.m.nom.localeCompare(b.m.nom));
    const prix = coutRefabrication(groupe[0]!.m.id);
    h += `<div class="fg-metal" style="--r:${COULEUR_RARETE[r]}"><span class="fg-metal-nom">${gemme(r)}${NOMS_RARETE[r]}</span>`
      + `<span class="fg-metal-prix">${couts(j, { energie: prix.energie, composants: prix.composants, eclats: prix.eclats })}<span class="fg-duree">${ICO.chrono}${duree(dureeFabrication(j, groupe[0]!.m.id))}</span></span></div>`
      + `<div class="fg-cartes">`;
    for (const { m, c, requis } of groupe) {
      const assez = j.energie >= prix.energie && j.composants >= prix.composants && j.eclats >= prix.eclats;
      const jauge = requis === null ? `<span class="fg-doublons max">${tr`Niveau max`}</span>`
        : c.doublons >= requis ? `<span class="fg-doublons pret">${ICO.monter}${tr`Peut monter`}</span>`
        : `<span class="fg-doublons"><span class="mini-jauge"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></span><span>${c.doublons}/${requis}</span></span>`;
      h += `<button type="button" class="fg-carte${assez && forgeron && !j.forge ? '' : ' attente'}" data-action="fabriquer" data-module="${m.id}" data-carte="${m.id}" aria-label="${tr`Refabriquer ${echap(m.nom)}${requis === null ? tr(', niveau maximum') : tr`, ${c.doublons} doublons sur ${requis}`}`}">`
        + `<span class="fg-face">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}</span>${jauge}</button>`;
    }
    h += `</div>`;
  }
  if (!toutes && utiles.length > FORGE_PROCHES) h += `<button type="button" class="btn sec fg-plus" data-action="forge-vue" data-id="toutes">${tr`Voir les ${cartes.length} cartes`}</button>`;
  return h + `</section>`;
}

/** Le nom de l'onglet du quotidien, selon le bâtiment (12 novembre 2026) */
function ongletSalle(b: BatimentId): string {
  return b === 'noyau' ? tr('Salle d’entraînement') : b === 'forge' ? tr('Établi') : b === 'comptoir' ? tr('Étals du jour') : tr('Au travail');
}

/** Le coût d'une amélioration en deux pastilles « ce que j'ai / ce qu'il faut » ; le rouge dit ce qui manque */
function coutsNiveau(j: Jeu, c: NonNullable<ReturnType<typeof coutAmelioration>>): string {
  const res = (ic: Icone, besoin: number, possede: number, nom: string) => {
    const court = possede < besoin;
    return `<span class="tb-res${court ? ' court' : ''}" aria-label="${tr`${nom} : ${ent(possede)} sur ${ent(besoin)}`}">${icone(ic)}<span><b>${ent(Math.min(possede, besoin))}</b><small>/ ${ent(besoin)} ${nom}</small></span></span>`;
  };
  const manque: string[] = [];
  if (c.energie > j.energie) manque.push(tr`${ent(c.energie - j.energie)} cristaux`);
  if ((c.eclats ?? 0) > j.eclats) manque.push(tr`${ent(c.eclats! - j.eclats)} Éclat${c.eclats! - j.eclats > 1 ? 's' : ''}`);
  return `<div class="tb-couts">${c.energie ? res('energie', c.energie, j.energie, tr('cristaux')) : ''}${c.eclats ? res('eclats', c.eclats, j.eclats, tr('Éclats')) : ''}</div>`
    + (manque.length ? `<p class="tb-manque">${tr`Il manque ${enumerer(manque)}.`}</p>` : '');
}

function feuilleBatiment(e: EcranDistrict): string {
  const j = e.j;
  const sel = e.selection;
  if (!sel) return '';
  if (estFutur(sel)) return feuilleLieuFutur(e, sel);
  const b = sel;
  const d = batimentDef(b);
  const niv = j.batiments[b];
  const pv = b === 'noyau' || !CUVETTE ? prochainVisuel(niv) : prochainPalier(niv);
  const a = amelioration(j, b);
  const ferme = (b === 'comptoir' && !niv) || (b === 'cercle' && !cercleOuvert(j));
  // refonte du 12 novembre 2026 (Bryan : « l'intérieur des bâtiments fait cheap ») : deux onglets au lieu d'une longue
  // colonne, le quotidien d'un côté, le niveau suivant de l'autre ; la scène peinte de l'intérieur en tête quand elle existe
  const onglets = niv > 0 && !ferme && !!(a.cout || a.ch);
  const onglet: 'salle' | 'niveau' = onglets ? (e.ongletBat ?? 'salle') : 'salle';
  const interieur = niv && onglet === 'salle' ? interieurBatiment(b) : null;
  const crans = Array.from({ length: d.niveauMax }, (_, i) => `<i class="${i < niv ? 'plein' : ''}"></i>`).join('');
  const surtitre = niv ? `${tr`Niveau ${niv}`} <span class="fb-max">/ ${d.niveauMax}</span>` : b === 'comptoir' || (b === 'cercle' && !cercleOuvert(j)) ? tr('Fermé') : tr('À construire');
  const ideal = d.affinite ? `<span class="fb-ideal" style="--c:${COULEUR[d.affinite]}">${ICO.porteurs}${tr`Idéal : ${NOM_LIGNEE[d.affinite]}`} <b>×${virgule(DISTRICT.bonusAffinite)}</b></span>` : '';
  let h = `<div class="voile-feuille" data-action="fermer" aria-hidden="true"></div><section class="feuille fiche-bat${interieur ? ' avec-salle' : ''}${onglets ? ' a-onglets' : ''}" role="dialog" aria-modal="true" aria-labelledby="feuille-titre">`
    + `<span class="poignee" aria-hidden="true"></span><button type="button" class="btn-icone fb-fermer" data-action="fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button>`
    + `<div class="feuille-corps fb-corps">`;
  if (onglet === 'niveau') {
    // l'onglet du niveau suivant : le bâtiment entre l'ancien et le nouveau niveau
    h += `<header class="fb-heros tb-vers"><span class="fb-halo"></span><span class="tb-n">${niv}</span><img class="fb-ilot" src="${illustrationBatiment(b, Math.max(1, niv))}" alt="" decoding="async"><span class="tb-n or">${niv + 1}</span>`
      + `<h2 id="feuille-titre">${echap(d.nom)}</h2></header>`;
  } else if (interieur) {
    const sous = b === 'noyau' ? tr`Strate −${j.strate} ouverte · bâtiments jusqu’au niv. ${niv}` : '';
    h += `<header class="fb-heros tb-salle"><img class="tb-interieur" src="${interieur}" alt="" decoding="async">`
      + `<span class="tb-niveau"><b>${niv}</b><span>${tr`Niveau ${niv}`} <i>/ ${d.niveauMax}</i></span></span>`
      + `<div class="fb-titre"><h2 id="feuille-titre">${echap(d.nom)}</h2>${sous ? `<p class="tb-sous">${sous}</p>` : ''}${ideal}</div></header>`;
  } else {
    h += `<header class="fb-heros"><div class="fb-scene" aria-hidden="true"><span class="fb-halo"></span><img class="fb-ilot${niv ? '' : ' vide'}" src="${illustrationBatiment(b, Math.max(1, niv))}" alt="" decoding="async"></div>`
      + `<div class="fb-titre"><span class="surtitre">${surtitre}</span><h2 id="feuille-titre">${echap(d.nom)}</h2>`
      + `<span class="fb-crans" aria-hidden="true">${crans}</span>${ideal}</div></header>`;
  }
  if (onglets) {
    const lib = a.ch ? tr('Chantier') : tr`Niveau ${niv + 1}`;
    h += `<div class="tb-onglets" role="tablist">`
      + `<button type="button" role="tab" aria-selected="${onglet === 'salle'}" data-action="onglet-bat" data-id="salle">${ongletSalle(b)}</button>`
      + `<button type="button" role="tab" aria-selected="${onglet === 'niveau'}" data-action="onglet-bat" data-id="niveau">${a.ch ? ICO.marteau : ''}${lib}${a.pret && onglet !== 'niveau' ? `<i class="tb-pret" aria-label="${tr`possible`}"></i>` : ''}</button></div>`;
  }

  if (onglet === 'niveau') {
    // ce que le niveau suivant apporte, le chantier en cours ou le coût
    if (a.ch) h += barreAmelioration(e, b, a, false);
    const gains = gainsNiveau(j, b);
    if (gains) h += `<section class="tb-niveau-corps"><div class="tb-tete"><h3 class="titre-bloc">${a.ch ? tr`Au niveau ${niv + 1}` : tr`Ce que tu gagnes`}</h3>${a.ch ? '' : `<span class="fb-duree">${ICO.chrono}${dureeChantier(j, b) ? duree(dureeChantier(j, b)) : tr('immédiat')}</span>`}</div>${gains}</section>`;
    if (pv !== null && pv <= d.niveauMax && pv > niv + 1) h += `<p class="te-note">${tr`Nouvelle apparence au niveau ${pv}.`}</p>`;
    if (!a.ch && a.cout) {
      h += coutsNiveau(j, a.cout);
      if (a.raison) h += `<p class="fb-raison">${ICO.verrou}<span>${a.raison}</span>${a.bloque ? `<button type="button" class="fb-lien" data-action="batiment" data-id="noyau" data-amelio>${tr`Voir la Tour`}</button>` : ''}</p>`;
    }
    h += `</div>`;
    const pied = !a.ch && a.cout
      ? `<button type="button" class="btn ${a.pret ? 'prim' : 'sec'} large tb-ameliorer" data-action="ameliorer" data-id="${b}"${a.pret ? '' : ' disabled'}>${ICO.monter}${tr`Passer au niveau ${niv + 1}`}</button>`
      : b === 'noyau' ? `<button type="button" class="btn prim large fb-entrer" data-action="entrer">${ICO.tour}${tr`Entrer dans la tour`}</button>` : '';
    return h + (pied ? `<footer class="feuille-pied fb-pied"><div class="fb-barre">${pied}</div></footer>` : '') + `</section>`;
  }

  if (b === 'comptoir' && !niv) h += `<p class="fb-role">${echap(COMPTOIR_FERME)}</p>`;
  else if (b === 'cercle' && !cercleOuvert(j)) h += `<p class="fb-role">${echap(CERCLE_FERME)}</p>`;
  else if (!interieur) h += `<p class="fb-role">${echap(d.role)}${!onglets && pv !== null && pv <= d.niveauMax && pv > niv + 1 ? ` <span>${tr`Nouvelle apparence au niveau ${pv}.`}</span>` : ''}</p>`;

  // le poste vide passe avant les chiffres (12 novembre 2026, audit du début : l'objectif 1 était caché sous la barre du bas)
  const avantChiffres = h.length;
  // ce que le bâtiment rapporte
  if (b === 'generateur') h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.energie}<b>${ent(j.energie)}</b><small>${tr`cristaux`}</small></div><div class="fb-chiffre">${ICO.chrono}<b>${brutEnAttente(j).brut ? `${brutEnAttente(j).heures} h` : '—'}</b><small>${tr`pour tailler ce qui attend`}</small></div></div>${taille(j)}`;
  if (b === 'clinique') h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.soin}<b>−${virgule(soinParHeure(j))}</b><small>${tr`Usure soignée par heure`}</small></div>`
    + (partPvClinique(j) ? `<div class="fb-chiffre">${ICO.porteurs}<b>+${Math.round(partPvClinique(j) * 100)} %</b><small>${tr`PV max. des Porteurs`}</small></div>` : '') + `</div>`;
  if (b === 'noyau') {
    if (!interieur) h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.strate}<b>−${j.strate}</b><small>${tr`Strate ouverte`}</small></div><div class="fb-chiffre">${ICO.tour}<b>${niv}</b><small>${tr`niveau maximum des autres bâtiments`}</small></div></div>`;
    h += blocEntrainement(e);
  }
  if (b === 'comptoir') h += blocComptoir(e);
  if (b === 'cercle') h += blocCercle(e);

  // le Porteur au travail (allégé le 28 octobre 2026) : une ligne pour l'occupant ; la liste ne s'ouvre que pour en changer,
  // et ne montre alors que ceux qui feraient mieux
  if (b !== 'noyau' && b !== 'comptoir' && b !== 'cercle') {
    const poste = b;
    const occupant = posteDe(j, poste);
    const actuel = rendement(j, poste, occupant);
    const vide = rendement(j, poste, null);
    const ouvert = !occupant || !!e.posteChanger;
    const debutTravail = h.length;
    h += `<section class="fb-bloc fb-travail${occupant ? '' : ' vide'}"><h3 class="titre-bloc">${icone('ouvrier')}${tr`Au travail`}</h3>`;
    if (occupant) {
      const o = porteurDef(occupant);
      const apport = poste === 'forge' ? (actuel.v === 1 ? tr('vitesse normale') : tr`fabrique ${virgule(actuel.v)} fois plus vite`)
        : poste === 'clinique' ? tr`+${virgule(actuel.v - vide.v)} Usure soignée/h` : tr`tout taillé en ${actuel.court} au lieu de ${vide.court}`;
      h += `<div class="fb-occupant fg-forgeron" style="--c:${COULEUR[o.lignee]}"><span class="fb-cand-portrait">${avatar(occupant, 44)}${multPoste(poste, occupant)}</span><div><strong>${echap(o.nom)}</strong><span class="fb-apport">${apport}</span></div>`
        + (ouvert ? `<button type="button" class="btn sec fb-liberer" data-action="liberer" data-id="${occupant}" aria-label="${tr`Libérer ${echap(o.nom)} (${vide.long})`}">${tr`Libérer`}</button>`
          : `<button type="button" class="btn sec fb-liberer" data-action="poste-changer" aria-expanded="false">${tr`Changer`}</button>`) + `</div>`;
    } else {
      h += `<p class="fb-vide">${tr`Personne au poste : ${poste === 'forge' ? tr('la Forge ne peut pas fabriquer') : actuel.long}.`}</p>`;
    }
    if (ouvert) {
      // les Porteurs de l'escouade en dernier (3 novembre 2026) : la recrue la mieux placée d'abord, comme le dit l'objectif
      const esc = escouadeDe(j);
      const libres = PORTEURS.filter((p) => p.id !== occupant && !enExpedition(j, p.id) && porteursPresents(j).includes(p.id))
        .map((p) => ({ p, v: rendement(j, poste, p.id).v }))
        .sort((x, y) => Number(esc.includes(x.p.id)) - Number(esc.includes(y.p.id)) || y.v - x.v || Number(!!j.porteurs[x.p.id]!.poste) - Number(!!j.porteurs[y.p.id]!.poste));
      // en place, seuls ceux qui feraient mieux ; poste vide, tout le monde (le meilleur en premier)
      const utiles = occupant ? libres.filter((x) => x.v > actuel.v) : libres;
      if (utiles.length) {
        // poste vide : le premier (la recrue la mieux placée) est mis en avant, c'est lui que l'objectif demande
        h += `<div class="tb-cands">${utiles.slice(0, e.porteursTous ? undefined : 6).map((x, i) => candidat(j, x.p.id, poste, actuel.v, !occupant && i === 0)).join('')}</div>${tousPorteurs(e, utiles.length)}`;
        if (utiles.some((x) => j.porteurs[x.p.id]!.poste)) h += `<p class="te-note">${ICO.marteau}${tr`quitte son poste au district`}</p>`;
      } else if (occupant) {
        h += `<p class="te-note">${tr`Personne de disponible ne ferait mieux que ${echap(porteurDef(occupant).nom)}.`}</p>`;
      }
      if (occupant) h += `<button type="button" class="te-fermer" data-action="poste-changer" aria-expanded="true">${tr`Fermer`}</button>`;
    }
    h += `</section>`;
    if (!occupant) { const bloc = h.slice(debutTravail); h = h.slice(0, avantChiffres) + bloc + h.slice(avantChiffres, debutTravail); }
  }
  // les gestes en plus du bâtiment, sous le Porteur au travail (qui, lui, change ce que le bâtiment rapporte)
  if (niv && b === 'clinique') h += blocSoinsIntensifs(j);

  if (b === 'forge') h += blocForge(e);

  // sans onglets (à construire, fermé) : le niveau suivant reste en bas de la feuille, l'amélioration au pied
  const gainsBas = !onglets && a.cout && !a.ch ? gainsNiveau(j, b) : '';
  if (gainsBas) h += `<section class="tb-niveau-corps"><div class="tb-tete"><h3 class="titre-bloc">${niv ? tr`Au niveau ${niv + 1}` : tr`Une fois construit`}</h3></div>${gainsBas}</section>`;
  h += `</div>`;
  // le pied : à la Tour, « Entrer dans la tour » ; ailleurs, rien quand l'amélioration a son onglet
  if (b === 'noyau') h += `<footer class="feuille-pied fb-pied"><div class="fb-barre"><button type="button" class="btn prim large fb-entrer" data-action="entrer">${ICO.tour}${tr`Entrer dans la tour`}</button></div></footer>`;
  else if (!onglets) h += `<footer class="feuille-pied fb-pied">${barreAmelioration(e, b, a, true)}</footer>`;
  return h + `</section>`;
}

/** Où en est l'amélioration d'un bâtiment : chantier en cours, coût, et ce qui la bloque */
function amelioration(j: Jeu, b: BatimentId) {
  const niv = j.batiments[b];
  const ch = chantierDe(j, b);
  const cout = coutAmelioration(j, b);
  const bloque = b !== 'noyau' && niv >= j.batiments.noyau;
  const assez = !!cout && j.energie >= cout.energie && j.composants >= cout.composants && j.eclats >= (cout.eclats ?? 0);
  const plein = j.chantiers.length >= chantiersMax(j) || (b === 'noyau' && j.chantiers.length > 0);
  // les ressources manquantes se lisent déjà en rouge dans le coût : la phrase ne sert que pour les autres blocages
  // le Cercle avant la Strate −5 (12 novembre 2026) : fermé, quelle que soit la Tour
  const ferme = b === 'cercle' && !cercleOuvert(j);
  // la Tour retenue par un gardien (10 novembre 2026) : ses fondations s'ancrent dans la roche de la Strate
  const gardien = b === 'noyau' ? gardienPourTour(j) : 0;
  const raison = ferme ? tr`Vaincs le gardien de la Strate −${CERCLE_OUVERTURE} pour le construire.`
    : gardien ? tr`Les nouvelles fondations s’ancrent dans la roche de la Strate −${gardien} : vaincs d’abord son gardien.`
    : bloque ? tr`Il faut d’abord monter la Tour du Noyau au niveau ${niv + 1}.`
    : plein ? (b === 'noyau' && j.chantiers.length ? tr('Attends la fin des chantiers en cours.') : chantiersMax(j) === 1 ? tr('Un seul chantier à la fois (deux au Noyau niveau 4).') : tr('Deux chantiers sont déjà en cours.')) : '';
  return { ch, cout, bloque, raison, pret: !ch && assez && !bloque && !plein && !ferme && !gardien };
}

/** Le coût et le bouton d'amélioration sur une ligne ; `pied` : la version du pied fixe (étiquette courte) */
function barreAmelioration(e: EcranDistrict, b: BatimentId, a: ReturnType<typeof amelioration>, pied: boolean): string {
  const j = e.j;
  const niv = j.batiments[b];
  if (a.ch) {
    return `<div class="chantier-cours">${icone('marteau')}<div><strong>${!niv && b === 'comptoir' ? tr('Remise en état') : tr`Chantier vers le niveau ${niv + 1}`}</strong><small>${decompte(a.ch.fin, e.now, tr('Reste '), tr(' · avance même jeu fermé'))}</small><div class="jauge or">${jaugeTemps(a.ch.debut, a.ch.fin, e.now)}</div></div></div>`;
  }
  if (!a.cout) return `<small class="raison">${tr`Niveau maximum pour cette version.`}</small>`;
  const c = a.cout;
  const etiquette = !niv ? `${ICO.marteau}${b === 'comptoir' ? tr('Rouvrir') : tr('Construire')}` : pied ? `${ICO.monter}${tr`Niveau ${niv + 1}`}` : tr`${ICO.monter}Passer au niveau ${niv + 1}`;
  return (a.raison ? `<p class="fb-raison">${ICO.verrou}<span>${a.raison}</span>${a.bloque ? `<button type="button" class="fb-lien" data-action="batiment" data-id="noyau" data-amelio>${tr`Voir la Tour`}</button>` : ''}</p>` : '')
    + `<div class="fb-barre"><div class="fb-cout" aria-label="${tr`Coût`}">`
    + (c.energie ? coutDetail('energie', c.energie, j.energie, tr('Cristaux')) : '')
    + (c.eclats ? coutDetail('eclats', c.eclats, j.eclats, tr('Éclats')) : '') + `</div>`
    + `<button type="button" class="btn ${a.pret ? 'prim' : 'sec'} fb-ameliorer" data-action="ameliorer" data-id="${b}"${a.pret ? '' : ' disabled'} aria-label="${niv ? tr`Passer au niveau ${niv + 1}` : b === 'comptoir' ? tr('Remettre le Comptoir en état') : tr`Construire le ${echap(batimentDef(b).nom)}`}">${etiquette}</button></div>`;
}

/** Un grand choix de la campagne : la fenêtre ne se ferme qu'une fois la décision prise */
function fenetreDecision(acte: Acte): string {
  const d = DECISIONS[acte];
  const sur = acte === 'chambre' ? tr('ACTE I · LA CHAMBRE') : acte === 'lecture' ? tr('ACTE II · LE CRIME ANCIEN') : tr('ACTE III · LA VÉRITÉ');
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="decision-titre"><div class="fenetre decision"><span class="surtitre">${sur}</span><h2 id="decision-titre">${echap(d.titre)}</h2><p>${echap(d.texte)}</p><div class="options-decision">`
    + d.options.map((o) => `<button type="button" class="option-decision" data-action="decider" data-acte="${acte}" data-id="${o.id}"><strong>${echap(o.nom)}</strong><em>« ${echap(o.phrase)} »</em><small>${echap(o.effet)}</small></button>`).join('')
    + `</div><small class="aide">${tr`Ce choix est définitif. Aucun n’est « le bon » : chacun règle une partie du problème et en aggrave une autre.`}</small></div></div>`;
}

/** Une icône qui dit de quoi parle chaque ligne de « Pendant ton absence » */
function iconeRetour(l: string): Icone {
  const t = l.toLowerCase();
  // les mots du français et de l'anglais (la ligne est déjà traduite)
  if (/clinique|soign|clinic|heal/.test(t)) return 'soin';
  if (/améliorer|niveau|upgrade|level/.test(t)) return 'monter';
  if (/chantier|project/.test(t)) return 'marteau';
  if (/creuseur|digger/.test(t)) return 'ouvrier';
  if (/forge|carte|card/.test(t)) return 'cartes';
  if (/cristaux|minerai|taill|crystal|ore\b|cut/.test(t)) return 'energie';
  if (/mission|expédition|expedition/.test(t)) return 'descendre';
  return 'cristal';
}

/** Les âges du district : il change de visage avec la Tour du Noyau (art.ts, visuel) */
const AGES: Record<1 | 2 | 3 | 4, { nom: string; texte: string }> = {
  1: { nom: tr('Le campement'), texte: tr('Quelques cabanes au fond de la cuvette, et une Tour qui tient debout.') },
  2: { nom: tr('Le quartier s’éveille'), texte: tr('La Tour du Noyau tient bon : les habitants consolident la digue, réparent les toits et rouvrent les ateliers. Le district ressemble enfin à un quartier.') },
  3: { nom: tr('Le district prospère'), texte: tr('Le courant circule, les marchands reviennent, et des maisons neuves montent contre la digue. On parle de ton district jusque dans les autres quartiers.') },
  4: { nom: tr('Le phare de Vertiga'), texte: tr('La Tour du Noyau illumine la mer. Ton district est devenu un repère, et même les Hauts le regardent.') },
};

/** La fenêtre du nouvel âge : le district a changé de visage (23 octobre 2026, Bryan : « rien ne l'indique du tout ») */
function fenetreAge(j: Jeu): string {
  const age = visuel(j.batiments.noyau);
  const a = AGES[age];
  const suivant = prochainVisuel(j.batiments.noyau);
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="age-titre"><div class="fenetre nouvel-age-fenetre">`
    + `<img class="age-tableau" src="${sceneDistrict(j.batiments.noyau).url}" alt="${tr`Ton district à l’âge ${age}`}" decoding="async">`
    + `<span class="surtitre">${tr`TOUR DU NOYAU NIVEAU ${j.batiments.noyau} · ÂGE ${age}`}</span><h2 id="age-titre">${a.nom}</h2><p>${a.texte}</p>`
    + (suivant ? `<small class="aide">${tr`Prochain âge : Tour du Noyau au niveau ${suivant}.`}</small>` : '')
    + `<button type="button" class="btn prim large" data-action="age-ok">${ICO.ok}${tr`Admirer le district`}</button></div></div>`;
}

export function htmlArchipel(e: EcranDistrict): string {
  const j = e.j;
  // le tableau garde ses proportions (les repères des bâtiments sont placés en % de l'image) ; au-dessus, son ciel flouté prolonge l'écran.
  // Sur PC, la mer et le ciel du tableau continuent jusqu'aux bords de l'écran (.mer-fond, chargée seulement sur PC : bureau.css)
  const scene = sceneDistrict(j.batiments.noyau);
  let h = `<section class="archipel${CUVETTE ? ' cuvette' : ''}" aria-label="${tr`Ton district`}"><img class="tableau-fond" src="${scene.url}" alt="" aria-hidden="true">`
    + `<span class="mer-fond${scene.nuit ? ' nuit' : ''}" style="--mer:url(${scene.mer});--reflets:url(${reflets});--horizon:${scene.horizon}%" aria-hidden="true"><i class="mer-reflets"></i>${scene.merMasque && !mouvementReduit() ? `<i class="houle-large" data-image="${scene.mer}" data-masque="${scene.merMasque}"></i>` : ''}</span>`
    + `<div class="toile${j.batiments.noyau < 2 ? ' noms' : ''}">${tableau(j)}${zonesBatiments(visuel(j.batiments.noyau), e.selection, CUVETTE ? paliers(j) : null)}${balises(e)}</div>`
    + (CUVETTE ? ambianceLarge(scene.nuit) : '')
    + bulles(e)
    + (e.bulle ? `<button type="button" class="bulle-voile" data-action="bulle" data-id="" aria-label="${tr`Replier`}"></button>` : '')
    + `<div class="archipel-haut"${e.bulle ? ` data-bulle="${e.bulle}"` : ''}${!e.j.chambre ? ' data-porte' : ''}>${mission(e)}${appel(e)}</div></section>`;
  h += feuilleBatiment(e);
  const acte = decisionEnAttente(j);
  // le rapport d'expédition passe d'abord : la carte au choix s'ouvre une fois qu'il est lu
  if (e.expedition) { /* rien d'autre par-dessus */ }
  else if (acte) h += fenetreDecision(acte);
  else if (legsEnAttente(j) || e.legsRevele) h += fenetreLegs(e);
  else if (j.choix.length) h += fenetreChoix(j);
  else if (visuel(j.batiments.noyau) > (j.ageVu ?? 1)) h += fenetreAge(j);
  else if (e.retour.length) {
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="retour-titre"><div class="fenetre retour"><span class="surtitre">${tr`BON RETOUR, DIRECTEUR`}</span><h2 id="retour-titre">${tr`Pendant ton absence`}</h2><ul>`
      + e.retour.map((l) => `<li>${ICO[iconeRetour(l)]}<span>${echap(l)}</span></li>`).join('') + `</ul><button type="button" class="btn prim large" data-action="retour-ok">${tr`Au travail`}</button></div></div>`;
  }
  return coquille(e, h, 'ecran-archipel');
}

// ---------- Les cartes ----------

function carteMini(id: string, j: Jeu, attrs = '', utile = false): string {
  const m = moduleDef(id);
  const c = j.collection[id];
  const niveau = c?.niveau ?? COLLECTION.niveauDepart[m.rarete];
  // un doublon qui complète le niveau suivant se dit tout de suite
  const requis = c ? doublonsRequis(id, c.niveau) : null;
  const monte = c && requis !== null && c.doublons + 1 >= requis;
  return `<button type="button" class="carte-choix" ${attrs}>${faceCarte(m, niveau, multNiveau(id, niveau))}`
    + `<span class="ruban${c ? (monte ? ' monte' : '') : ' neuve'}">${c ? (monte ? tr`Niv. ${c.niveau + 1} prêt` : tr`Doublon · niv. ${c.niveau}`) : tr('Nouvelle')}</span>`
    + (utile ? `<span class="pour-qui">${pourQui(id, j)}</span>` : '') + `</button>`;
}

/**
 * Une carte faite pour un Porteur pas encore arrivé (4 novembre 2026, Bryan : c'est voulu, mais il faut l'expliquer) :
 * qui elle attend, quand il arrive, et qu'elle patiente dans la collection d'ici là.
 */
function aVenir(options: string[], j: Jeu): string {
  const lignes = options.map((id) => {
    const m = moduleDef(id);
    const voie = VOIES.find((v) => v.cartes.includes(m.base ?? m.id));
    if (!voie || porteursPresents(j).includes(voie.porteur)) return '';
    const p = porteurDef(voie.porteur);
    const quand = arriveeFuture(p);
    return `<p class="choix-avenir">${ICO.cristal}<span><b>${echap(m.nom)}</b> ${tr`est faite pour`} <b>${echap(p.nom.split(' ')[0]!)}</b>${tr`, qui rejoindra le district ${echap(quand)}. Prise maintenant, elle t’attend dans ta collection et sera prête le jour de son arrivée (voie « ${echap(voie.nom)} »).`}</span></p>`;
  }).filter(Boolean);
  return lignes.join('');
}

/**
 * Pour qui est une carte proposée (27 octobre 2026 : une récompense ne doit pas tomber à plat) : les Porteurs présents
 * qui peuvent la porter, le niveau qu'il manque, ou, pour une carte de voie, le Porteur qui arrivera.
 */
function pourQui(id: string, j: Jeu): string {
  const m = moduleDef(id);
  const presents = PORTEURS.filter((p) => p.lignee === m.lignee && porteursPresents(j).includes(p.id));
  const voie = VOIES.find((v) => v.cartes.includes(m.base ?? m.id));
  if (voie && !porteursPresents(j).includes(voie.porteur)) {
    const p = porteurDef(voie.porteur);
    return tr`Pour ${echap(p.nom.split(' ')[0]!)} · à venir`;
  }
  const requis = niveauRequis(id);
  const prets = presents.filter((p) => niveauPorteur(j, p.id).niveau >= requis);
  if (!prets.length) return tr`Porteur ${minuscule(NOM_LIGNEE[m.lignee])} niv. ${requis} requis`;
  // un seul nom (celui de l'escouade d'abord), et combien d'autres pourraient la porter
  const esc = j.escouade ?? [];
  const tri = prets.slice().sort((a, b) => Number(esc.includes(b.id)) - Number(esc.includes(a.id)));
  const qui = `${echap(tri[0]!.nom.split(' ')[0]!)}${tri.length > 1 ? ` +${tri.length - 1}` : ''}`;
  return voie ? `${echap(voie.nom)} · ${qui}` : tr`Pour ${qui}`;
}

/** L'effet de la carte, et ce que son métal lui ouvre */
function effetsCarte(m: ReturnType<typeof moduleDef>): string {
  const origine = MODULES.find((x) => x.id === (m.base ?? m.id));
  let h = '';
  if (m.effet) h += `<ul class="effets-carte">${effetsDe(m).map((x) => `<li><b>${echap(NOMS_EFFET[x.type])}</b> ${avecMots(texteEffet(x), [x.type])}</li>`).join('')}</ul>`;
  else if (origine?.effet) h += `<p class="aide">${tr`En fer, pas d’effet. À partir du cuivre :`} <b>${echap(NOMS_EFFET[origine.effet.type])}</b>, ${avecMots(texteEffet(origine.effet).replace(/^./, (c) => c.toLowerCase()), [origine.effet.type])}</p>`;
  if (origine?.seul) h += `<p class="aide"><b>${tr`Exclusive`}</b> ${tr`: cette empreinte refuse la copie. Elle n’existe qu’en ${echap(NOMS_RARETE[origine.rarete].toLowerCase())}, et son effet ne se trouve sur aucune autre carte.`}</p>`;
  if (m.f.length > 1 && !frequenceLibre(m.effet)) h += `<p class="aide">${avecMots(tr('Fréquences au choix'))} : <b>${m.f.join(tr(' ou '))}</b>. ${avecMots(tr('Posée, elle prend celle qui prolonge ta suite.'))}</p>`;
  else if (origine && origine.f.length > m.f.length && !frequenceLibre(m.effet)) h += `<p class="aide">${avecMots(tr('Son métal ne lui ouvre qu’une Fréquence ; en argent et en or, elle en a 2, en nacre 3.'))}</p>`;
  return h;
}

/**
 * L’Héritage du district (27 octobre 2026) : la lettre de l'ancienne directrice, deux questions sans un chiffre, puis la vierge reçue.
 * Le choix est définitif ; la carte reste scellée jusqu'à un Porteur de niveau 10 (la nacre), puis s'éveille avec lui.
 */
function fenetreLegs(e: EcranDistrict): string {
  const j = e.j;
  const L = LETTRE_LEGS;
  const option = (action: string, id: string, nom: string, phrase: string) =>
    `<button type="button" class="option-decision" data-action="${action}" data-id="${id}"><strong>${echap(nom)}</strong><em>« ${echap(phrase)} »</em></button>`;
  let corps: string;
  if (e.legsRevele && j.legs) {
    const cle = j.legs === 'cle';
    const m: ModuleDef = cle
      ? { id: CLE_LEGS.id, nom: CLE_LEGS.nom, lignee: 'tech', rarete: 'nacre', type: CLE_LEGS.type, v: CLE_LEGS.v, f: [CLE_LEGS.f], effet: CLE_LEGS.effet!, effet2: CLE_LEGS.effet2!, legs: true }
      : moduleDef(carteId(j.legs, 'nacre'));
    const qui = cle ? tr('un Porteur de ton escouade') : tr`un Porteur ${minuscule(NOM_LIGNEE[m.lignee])}`;
    corps = `<span class="surtitre">${tr`L’HÉRITAGE DU DISTRICT`}</span><h2 id="legs-titre">${echap(m.nom)}</h2>`
      + `<div class="legs-carte">${faceCarte(m, COLLECTION.niveauDepart.nacre, 1, cle ? { origine: ORIGINE_PAQUETAGE['cle-legs']!.batiment } : {})}</div>`
      + (loreCarte(m.id) ? `<blockquote class="lore-carte">${echap(loreCarte(m.id)!)}</blockquote>` : cle ? `<blockquote class="lore-carte">${echap(ORIGINE_PAQUETAGE['cle-legs']!.texte)}</blockquote>` : '')
      + `<p class="legs-sceau">${ICO.cristal}<span>${tr`Scellée : elle se portera avec ${qui} de`} <b>${tr`niveau ${NIVEAU_METAL.nacre}`}</b>${tr`${cle ? tr(', et rejoindra alors le paquetage de chaque escouade') : ''}. Elle s’éveillera ensuite avec lui, aux niveaux ${enumerer(EVEIL_LEGS.map((x) => String(x.porteur)))}.`}</span></p>`
      + `<button type="button" class="btn prim large" data-action="legs-ok">${tr`Je la garde`}</button>`;
  } else if (e.legsLignee) {
    const v = L.voies[e.legsLignee];
    corps = `<span class="surtitre">${tr`L’HÉRITAGE DU DISTRICT · 2 / 2`}</span><h2 id="legs-titre">${echap(v.question)}</h2><div class="options-decision">`
      + v.options.map((o) => option('legs-choisir', o.id, moduleDef(o.id).nom, o.phrase)).join('')
      + `</div><div class="ligne-btn"><button type="button" class="btn sec" data-action="legs-retour">${tr`Revenir à la première question`}</button></div>`;
  } else {
    corps = `<span class="surtitre">${tr`L’HÉRITAGE DU DISTRICT · 1 / 2`}</span><h2 id="legs-titre">${echap(L.titre)}</h2><p>${echap(L.texte)}</p><blockquote class="lore-carte legs-lettre">${echap(L.lettre)}</blockquote><h3 class="legs-question">${echap(L.question)}</h3><div class="options-decision">`
      + L.lignees.map((o) => option(o.id === 'cle' ? 'legs-choisir' : 'legs-lignee', o.id, o.nom, o.phrase)).join('') + `</div>`;
  }
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="legs-titre"><div class="fenetre decision legs">${corps}`
    + (e.legsRevele ? '' : `<small class="aide">${tr`Une seule vierge par directeur, et ce choix est définitif : aucune n’est meilleure que les autres, chacune ouvre une façon de jouer.`}</small>`)
    + `</div></div>`;
}

function fenetreChoix(j: Jeu): string {
  const c = j.choix[0]!;
  const titre = c.source === 'releve' ? tr('La Strate est complète') : c.source === 'etoiles' ? tr('Les étoiles des Strates') : c.source === 'rodeur' ? tr('Le trophée du Rôdeur') : c.source === 'boss' ? tr('Le boss laisse des empreintes') : c.source === 'quotidien' ? tr('Objectif du jour') : c.source === 'ravitaillement' ? tr('Le septième colis') : c.source === 'fouille' ? tr('Le filon de la fouille') : c.source === 'epreuve' ? tr('Épreuve réussie') : c.source === 'parrainage' ? tr('Le parrainage') : c.source === 'maree' ? tr('La prise de la marée') : c.source === 'remuee' ? tr('La prime de la Strate remuée') : c.source === 'fleche' ? tr('Un quai gravé de la Flèche') : tr('Butin de la semaine');
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="choix-titre"><div class="fenetre choix"><span class="surtitre">${tr`RÉCOMPENSE${j.choix.length > 1 ? tr` · ENCORE ${j.choix.length - 1} APRÈS` : ''}`}</span><h2 id="choix-titre">${titre}</h2><p>${tr`Choisis une carte. Si tu l’as déjà, elle devient un doublon pour la faire monter.`}</p><small class="aide choix-loupe">${tr`Reste appuyé sur une carte pour lire son effet.`}</small><div class="cartes-choix">`
    + c.options.map((id, k) => carteMini(id, j, `data-action="prendre" data-index="${k}" data-carte="${id}"`, true)).join('')
    + `</div>${aVenir(c.options, j)}${c.eclats ? `<button type="button" class="btn sec large" data-action="prendre" data-index="-1">${tr`Prendre ${prix('eclats', c.eclats)} à la place`}</button>` : ''}</div></div>`;
}

/**
 * La loupe des récompenses (27 octobre 2026, Bryan) : un appui prolongé sur une carte proposée la montre en grand avec ses effets,
 * pour choisir en connaissance de cause ; lever le doigt la referme sans prendre la carte (main.ts).
 */
export function loupeCarte(id: string, j: Jeu): string | null {
  // une carte du paquetage (fournie à chaque escouade) n'est pas un Module : on la reconstruit comme dans l'écran Cartes
  const c0 = CARTES_COMMUNES.find((x) => x.geste.id === id);
  const g = c0 ? gesteCommun(j, c0) : undefined;
  let m: ModuleDef;
  if (g) m = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) };
  else try { m = moduleDef(id); } catch { return null; }
  const c = j.collection[id];
  const niveau = c?.niveau ?? COLLECTION.niveauDepart[m.rarete];
  const origine = MODULES.find((x) => x.id === (m.base ?? m.id));
  const lignes = m.effet
    ? effetsDe(m).map((x) => `<li><b>${echap(NOMS_EFFET[x.type])}</b> ${echap(texteEffet(x))}</li>`).join('')
    : origine?.effet ? `<li>${tr`En fer, pas d’effet. À partir du cuivre :`} <b>${echap(NOMS_EFFET[origine.effet.type])}</b>, ${echap(texteEffet(origine.effet).replace(/^./, (x) => x.toLowerCase()))}</li>`
    : `<li>${tr`Pas d’effet : sa force seule.`}</li>`;
  if (g) return `<div class="loupe" aria-hidden="true"><div class="loupe-face">${faceCarte(m, 1, 1, { origine: ORIGINE_PAQUETAGE[g.id]!.batiment })}</div>`
    + `<ul class="loupe-effets"><li class="lc-nom"><b>${echap(m.nom)}</b> ${tr`· paquetage`}</li>${lignes}</ul><p class="loupe-qui">${echap(ORIGINE_PAQUETAGE[g.id]!.texte)}</p></div>`;
  const freq = m.f.length > 1 && !frequenceLibre(m.effet) ? `<li>${tr`Fréquences au choix :`} <b>${m.f.join(tr(' ou '))}</b></li>` : '';
  return `<div class="loupe" aria-hidden="true"><div class="loupe-face">${faceCarte(m, niveau, multNiveau(m.id, niveau))}</div>`
    + `<ul class="loupe-effets"><li class="lc-nom"><b>${echap(m.nom)}</b> · ${NOMS_RARETE[m.rarete].toLowerCase()} · ${minuscule(NOM_LIGNEE[m.lignee])}</li>${lignes}${freq}</ul>`
    + `<p class="loupe-qui">${pourQui(id, j)}</p></div>`;
}

const exemplaires = (j: Jeu, moduleId: string) => [...RARETES].reverse().map((r) => carteId(moduleId, r)).filter((k) => j.collection[k]);

export function feuilleCarte(e: EcranDistrict): string {
  const j = e.j;
  const cle = e.carte;
  const commune = cle ? communeDef(cle) : undefined;
  if (commune) return feuilleCommune(e, commune);
  if (cle === CLE_LEGS.id && j.legs === 'cle') return feuilleCle(e);
  if (cle === LECTURE_PROFONDE.id && j.actes.lecture === 'autoriser') return feuilleLecture();
  if (!cle || !j.collection[cle]) return '';
  const m = moduleDef(cle);
  const c = j.collection[cle]!;
  const requis = doublonsRequis(m.id, c.niveau);
  const porte = greffesDe(j, m.id)[0];
  const cout = composantsNiveau(c.niveau + 1);
  const porteurs = PORTEURS.filter((p) => p.lignee === m.lignee && porteursPresents(j).includes(p.id));
  let h = `<div class="voile-feuille" data-action="carte-fermer" aria-hidden="true"></div><section class="feuille carte-detail" role="dialog" aria-modal="true" aria-label="${echap(m.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR_RARETE[m.rarete]}">${tr`${NOMS_RARETE[m.rarete].toUpperCase()} · ${NOM_LIGNEE[m.lignee].toUpperCase()} · NIVEAU ${c.niveau}`}</span><h2>${echap(m.nom)}</h2>${epitheteAffiche(cle, vecuDe(j, cle)) ? `<span class="fc-epithete">${echap(epitheteAffiche(cle, vecuDe(j, cle))!)}</span>` : ''}</div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="effets" aria-label="${tr`Les cartes et leurs effets`}">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="carte-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="detail-haut"><div class="detail-face">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}</div><div class="detail-infos">${effetsCarte(carteNiveau(m, c.niveau))}</div></div>`
    + (loreCarte(cle) ? `<blockquote class="lore-carte">${echap(loreCarte(cle)!)}</blockquote>` : '')
    + `<p class="rang-carte"><b style="color:${COULEUR_RARETE[m.rarete]}">${RANG_METAL[m.rarete].rang}</b> · ${echap(RANG_METAL[m.rarete].texte)}</p>`;
  // à qui la confier : la décision la plus fréquente, donc juste sous la carte
  h += `<section class="bloc fc-confier"><h3 class="titre-bloc">${ICO.greffe}${porte ? tr`Portée par ${echap(porteurDef(porte).nom)}` : tr('Confier à')}</h3><p class="fc-aide">${niveauRequis(cle) > 1 ? `${tr`Elle demande un Porteur de`} <b>${tr`niveau ${niveauRequis(cle)}`}</b>. ` : ''}${porte ? tr('Touche son portrait pour la reprendre, ou un autre Porteur pour la lui passer.') : tr`Elle entrera dans ton deck quand ce Porteur descendra (${DISTRICT.cartesMax} cartes au plus, de sa lignée).`}</p><div class="fc-porteurs">`
    + porteurs.map((p) => {
      const ici = porte === p.id;
      const n = j.porteurs[p.id]!.modules.length;
      const img = portrait(p.id);
      // la Charge qui lui reste (s'il porte cette carte dans un autre métal, elle prendra sa place)
      const autre = j.porteurs[p.id]!.modules.find((k) => k !== cle && moduleDe(k) === m.id);
      const libre = chargeMax(j, p.id) - chargePortee(j, p.id) + (autre ? poidsCarte(autre) : 0);
      const lourde = !ici && poidsCarte(cle) > libre;
      const niv = niveauPorteur(j, p.id).niveau;
      const bas = !ici && niv < niveauRequis(cle);
      return `<button type="button" class="fc-porteur${ici ? ' actif' : ''}${(n >= DISTRICT.cartesMax || lourde || bas) && !ici ? ' plein' : ''}" style="--c:${COULEUR[p.lignee]}" data-action="${ici ? 'degreffer' : 'greffer'}" data-module="${cle}" data-id="${p.id}"${enExpedition(j, p.id) ? ' disabled' : ''}>`
        + `<span class="fc-portrait">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : avatar(p.id, 48)}${ici ? `<span class="fc-coche">${ICO.ok}</span>` : ''}</span>`
        + `<strong>${echap(p.nom)}</strong><small>${ici ? tr('la porte · reprendre') : bas ? tr`niveau ${niv} / ${niveauRequis(cle)}` : lourde ? tr`trop lourde · ${libre} libre${libre > 1 ? 's' : ''}` : n >= DISTRICT.cartesMax && !autre ? tr`${n} / ${DISTRICT.cartesMax} · échanger` : tr`Charge ${libre} libre${libre > 1 ? 's' : ''}`}</small></button>`;
    }).join('') + `</div></section>`;
  // progression : où on en est, et ce qui manque, en clair
  h += `<section class="bloc fc-prog"><h3 class="titre-bloc">${ICO.monter}${tr`Progression`}</h3>`;
  if (m.legs) h += `<p class="fc-etat or">${tr`Une vierge de l’Héritage du district : unique, elle ne monte pas avec des doublons. Elle s’éveille avec le Porteur qui la porte : ${EVEIL_LEGS.map((x) => tr`niveau ${x.niveau} avec un Porteur de niveau ${x.porteur}`).join(', ')}.`}</p>`;
  else if (m.origine) h += `<p class="fc-etat or">${tr`Une carte d’origine : exclusive, elle ne monte pas avec des doublons. Elle grandit avec le Porteur qui la porte : ${EVEIL_ORIGINE.map((x) => tr`niveau ${x.niveau} avec un Porteur de niveau ${x.porteur}`).join(', ')}. Face à un autre directeur (duel, défi d’un quai), elle joue sans son effet « ${NOMS_EFFET[m.origine]} ».`}</p>`;
  else if (requis === null) h += `<p class="fc-etat or">${tr`Niveau maximum : la carte est maîtrisée, un liseré de lumière parcourt son cadre.`}</p>`;
  else {
    const pret = c.doublons >= requis;
    const manqueD = Math.max(0, requis - c.doublons);
    const manqueC = Math.max(0, cout - j.energie);
    const etat = !pret ? `${tr`Encore`} <b>${tr`${manqueD} doublon${manqueD > 1 ? 's' : ''}`}</b> ${tr`pour le niveau ${c.niveau + 1}. On en trouve en expédition, en mission, dans les colis du ravitaillement, au Comptoir et à la Forge.`}`
      : manqueC ? `${tr`Doublons réunis. Il manque`} <b>${tr`${manqueC} cristal${manqueC > 1 ? 'x' : ''}`}</b>.` : tr`Prête : elle peut passer au niveau ${c.niveau + 1}.`;
    h += `<div class="progression"><div class="jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></div><span class="chiffre">${tr`${c.doublons} / ${requis} doublons`}</span></div>`
      + `<p class="fc-etat${pret && !manqueC ? ' or' : ''}">${etat} <span>${gainSuivant(m, c.niveau)}${c.niveau + 1 >= COLLECTION.niveauMax ? tr(', et la carte est maîtrisée') : ''}.</span></p>`
      + `<div class="ligne-btn"><button type="button" class="btn prim" data-action="monter" data-module="${cle}"${pret && j.energie >= cout ? '' : ' disabled'}>${ICO.monter}${tr`Passer au niveau ${c.niveau + 1} · ${prix('energie', cout, j.energie >= cout)}`}</button>`;
    if (c.doublons > 0) h += `<button type="button" class="btn sec" data-action="recycler" data-module="${cle}">${ICO.recycler}${tr`Recycler 1 · +${COLLECTION.recyclage[m.rarete]} minerai`}</button>`;
    h += `</div>`;
  }
  if (requis === null && c.doublons > 0) h += `<div class="ligne-btn"><button type="button" class="btn sec" data-action="recycler" data-module="${cle}">${ICO.recycler}${tr`Recycler 1 · +${COLLECTION.recyclage[m.rarete]} minerai`}</button></div>`;
  h += `</section>`;
  h += blocEmpreinte(j, cle);
  return h + `</div></section>`;
}

/**
 * Le détail d'une carte commune du district (31 octobre 2026, retours de Luc) : on la touche comme les autres pour voir ses effets,
 * on voit comment l'améliorer (en montant son bâtiment, niveau par niveau) et on la met au Râtelier ou l'en retire d'ici.
 * Une fois au Râtelier, elle y reste d'une descente à l'autre : rien à refaire à chaque partie.
 */
function feuilleCommune(e: EcranDistrict, c: CarteCommuneDef): string {
  const j = e.j;
  const g = gesteCommun(j, c);
  const bat = batimentDef(c.batiment);
  const niv = j.batiments[c.batiment] ?? 0;
  const ouverte = communeOuverte(j, c);
  const m: ModuleDef = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) };
  const places = placesRatelier(j);
  const effets = g.effet ? `<ul class="effets-carte">${effetsDe(m).map((x) => `<li><b>${echap(NOMS_EFFET[x.type])}</b> ${avecMots(texteEffet(x), [x.type])}</li>`).join('')}</ul>` : `<p class="aide">${tr`Pas d’effet : sa force seule.`}</p>`;
  let h = `<div class="voile-feuille" data-action="carte-fermer" aria-hidden="true"></div><section class="feuille carte-detail cm-detail" role="dialog" aria-modal="true" aria-label="${echap(g.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:#CDEFFF">${tr`CARTE COMMUNE · ${echap(bat.nom.toUpperCase())}${ouverte ? tr` · NIVEAU ${niv}` : ''}`}</span><h2>${echap(g.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="carte-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="detail-haut"><div class="detail-face">${faceCarte(m, 1, 1, { origine: bat.nom })}</div><div class="detail-infos">${effets}`
    + `<p class="aide">${tr`Sans lignée ni métal, portée par personne : elle ne s’éteint jamais quand un Porteur tombe.${g.unique ? tr(' Une fois par combat.') : ''}`}</p></div></div>`
    + `<blockquote class="lore-carte">${echap(c.texte)}</blockquote>`;
  // l'améliorer : c'est son bâtiment qui la fait grandir
  h += `<section class="bloc fc-prog"><h3 class="titre-bloc">${ICO.monter}${tr`L’améliorer`}</h3>`;
  if (!ouverte) {
    h += `<p class="fc-etat">${tr`${echap(bat.nom)} niveau ${c.niveau} (aujourd’hui ${niv}) : ${echap(raisonCommune(c.batiment))}`}</p>`;
  } else {
    const max = bat.niveauMax;
    // le premier niveau du bâtiment où sa force monte vraiment (l'arrondi en saute parfois un)
    const prochain = Array.from({ length: max - niv }, (_, i) => niv + 1 + i).find((n) => forceCommune(c, n) > forceCommune(c, niv));
    const echelle = Array.from({ length: max - c.niveau + 1 }, (_, i) => c.niveau + i)
      .map((n) => `<li class="${n === niv ? 'ici' : n < niv ? 'fait' : ''}"><small>${tr`niv. ${n}`}</small><b>${forceCommune(c, n)}</b></li>`).join('');
    h += `<p class="fc-aide">${tr`Elle grandit avec`} <b>${echap(bat.nom)}</b> ${tr`: améliore le bâtiment, et sa force monte.`}</p>`
      + `<ol class="cm-echelle ${g.type}" aria-label="${tr`Force selon le niveau de ${echap(bat.nom)}`}">${echelle}</ol>`
      + (prochain ? `<p class="fc-etat">${tr`Prochain gain : au niveau ${prochain} de ${echap(bat.nom)}, force ${forceCommune(c, niv)} →`} <b>${forceCommune(c, prochain)}</b>.</p>` : `<p class="fc-etat or">${tr`${echap(bat.nom)} au niveau maximum : la carte a toute sa force.`}</p>`)
      + `<div class="ligne-btn"><button type="button" class="btn sec" data-action="commune-batiment" data-id="${c.batiment}">${ICO.district}${tr`Voir ${echap(bat.nom)}`}</button></div>`;
  }
  h += `</section>`;
  // le Râtelier : une carte commune se met dans autant d'escouades qu'on veut (31 octobre 2026, Bryan), une ligne par escouade
  const toutes = escouadesDe(j);
  const dans = escouadesAvecCommune(j, g.id);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.district}${tr`Râtelier des escouades${dans.length ? tr` · dans ${dans.length}` : ''}`}</h3>`;
  if (!ouverte) h += `<p class="fc-aide">${tr`Elle pourra rejoindre un Râtelier quand ${echap(bat.nom)} aura le niveau ${c.niveau}.`}</p>`;
  else {
    h += `<p class="fc-aide">${tr`Chaque escouade a son Râtelier : mets-la dans toutes celles qui en ont besoin, elle y reste d’une descente à l’autre.`}</p><div class="cm-escouades">`;
    h += toutes.map((l, k) => {
      const choisies = ratelierDe(j, k);
      const rang = choisies.indexOf(g.id);
      const pris = rang >= 0;
      const plein = !pris && choisies.length >= places;
      const payee = ratelierPayable(j, k).includes(g.id);
      // le prix du départ ne dépend pas du nombre de cartes : on rappelle seulement si l'énergie manque
      const etat = pris ? (payee ? tr('Dans le Râtelier') : `<b class="cm-cout">${tr`Cristaux insuffisants`}</b>`)
        : plein ? tr`Plein (${choisies.length} / ${places})` : `${choisies.length} / ${places}`;
      const visages = l.length ? `<span class="cm-esc-visages">${l.map((id) => avatar(id, 22)).join('')}</span>` : '';
      return `<button type="button" class="cm-esc${pris ? ' pris' : ''}" data-action="ratelier-basculer" data-id="${g.id}" data-index="${k}"${j.expedition || plein ? ' disabled' : ''} aria-pressed="${pris}">`
        + `<span class="cm-esc-coche" aria-hidden="true">${pris ? ICO.ok : ''}</span><span class="cm-esc-txt"><strong>${tr`Escouade ${k + 1}`}</strong><small>${etat}</small></span>${visages}`
        + `<span class="me-prendre${pris ? ' retirer' : ''}">${pris ? tr('Retirer') : tr('Ajouter')}</span></button>`;
    }).join('') + `</div>`;
    if (toutes.some((_, k) => !ratelierDe(j, k).includes(g.id) && ratelierDe(j, k).length >= places) && RATELIER.places.find((p) => p.n > places)) h += `<p class="fc-aide">${tr`Un emplacement de plus au niveau ${RATELIER.places.find((p) => p.n > places)!.noyau} de la Tour du Noyau.`}</p>`;
  }
  if (j.expedition) h += `<p class="fc-aide">${tr`L’escouade est en descente : les Râteliers se changent au district.`}</p>`;
  return h + `</section></div></section>`;
}

/**
 * Le détail de la Clé de l’Héritage (31 octobre 2026, Bryan : « on ne sait pas cliquer dessus comme les autres ») :
 * ses effets, son histoire, ce qui la descelle et la fait grandir, et les escouades avec qui elle descend.
 */
/**
 * La Lecture profonde de Véla (1er novembre 2026, Luc : « j'arrive pas à voir ce qu'elle fait ») : la carte gagnée à la
 * dernière lecture n'est pas dans la collection (elle est liée à Véla), on la montre donc ici, comme la Clé de l'Héritage.
 */
function feuilleLecture(): string {
  const g = LECTURE_PROFONDE;
  const m: ModuleDef = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], effet: g.effet! };
  const vela = porteurDef('vela');
  return `<div class="voile-feuille" data-action="carte-fermer" aria-hidden="true"></div><section class="feuille carte-detail cm-detail" role="dialog" aria-modal="true" aria-label="${echap(g.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`CARTE UNIQUE · ${echap(vela.nom.toUpperCase())}`}</span><h2>${echap(g.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="effets" aria-label="${tr`Les cartes et leurs effets`}">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="carte-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="detail-haut"><div class="detail-face">${faceCarte(m, 1, 1)}</div><div class="detail-infos">`
    + `<ul class="effets-carte"><li><b>${tr`Attaque ${g.v}`}</b> ${tr`Une des plus fortes attaques du jeu, fixe (elle ne monte pas de niveau).`}</li>`
    + `<li><b>${echap(NOMS_EFFET.accord)}</b> ${tr`${avecMots(texteEffet(g.effet!), ['accord'])} Elle prend toujours le chiffre qui manque : un vrai joker pour finir une Résonance.`}</li></ul>`
    + `<p class="aide">${tr`Elle n’appartient qu’à ${echap(vela.nom)} : on ne peut pas la confier à un autre Porteur. Elle entre dans le deck dès que ${echap(vela.nom)} est dans l’escouade, en plus de ses cartes.`}</p></div></div>`
    + `<blockquote class="lore-carte">${tr`Sous les salles closes, ${echap(vela.nom)} a lu jusqu’au bout ce que cachaient les cristaux. Elle en est revenue plus fragile, mais elle sait désormais entendre n’importe quelle suite et s’y glisser.`}</blockquote>`
    + `</div></section>`;
}

function feuilleCle(e: EcranDistrict): string {
  const j = e.j;
  const o = ORIGINE_PAQUETAGE[CLE_LEGS.id]!;
  const toutes = escouadesDe(j);
  // la force qu'elle a dans l'escouade la plus avancée (celle qu'on montre sur la face)
  const forces = toutes.map((l) => cleDuLegs(j, l));
  const meilleure = forces.reduce<GesteDef | null>((a, g) => (g && (!a || g.v > a.v) ? g : a), null);
  const g = meilleure ?? CLE_LEGS;
  const m: ModuleDef = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'nacre', type: g.type, v: g.v, f: [g.f], effet: g.effet!, effet2: g.effet2!, legs: true };
  const niv = Math.max(0, ...Object.keys(j.porteurs).filter((id) => porteursPresents(j).includes(id)).map((id) => niveauPorteur(j, id).niveau));
  const paliers = [{ porteur: NIVEAU_METAL.nacre, niveau: COLLECTION.niveauDepart.nacre }, ...EVEIL_LEGS];
  let h = `<div class="voile-feuille" data-action="carte-fermer" aria-hidden="true"></div><section class="feuille carte-detail cm-detail" role="dialog" aria-modal="true" aria-label="${echap(g.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR_RARETE.nacre}">${tr`NACRE · HÉRITAGE DU DISTRICT`}</span><h2>${echap(g.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="effets" aria-label="${tr`Les cartes et leurs effets`}">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="carte-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="detail-haut"><div class="detail-face">${faceCarte(m, COLLECTION.niveauDepart.nacre, 1, { origine: o.batiment })}</div><div class="detail-infos">${effetsCarte(m)}`
    + `<p class="aide">${tr`Portée par personne : elle descend avec chaque escouade qui compte un Porteur de niveau ${NIVEAU_METAL.nacre}, et ne s’éteint jamais quand un Porteur tombe.`}</p></div></div>`
    + `<blockquote class="lore-carte">${echap(o.texte)}</blockquote>`;
  // ce qui la descelle, puis la fait grandir : le niveau du Porteur le plus avancé de l'escouade
  h += `<section class="bloc fc-prog"><h3 class="titre-bloc">${ICO.monter}${meilleure ? tr('Son éveil') : tr('La desceller')}</h3>`
    + `<p class="fc-aide">${meilleure ? tr`Elle grandit avec le Porteur le plus avancé de l’escouade.` : `${ICO.cristal}<b>${tr`Scellée`}</b> ${tr`: elle s’ouvre quand un Porteur de l’escouade atteint le`} <b>${tr`niveau ${NIVEAU_METAL.nacre}`}</b> ${tr`(aujourd’hui, ton plus avancé est niveau ${niv}).`}`}</p>`
    + `<ol class="cm-echelle ${g.type}" aria-label="${tr`Niveau de la carte selon le niveau du Porteur`}">${paliers.map((p, k) => {
      const atteint = niv >= p.porteur;
      const ici = atteint && (k === paliers.length - 1 || niv < paliers[k + 1]!.porteur);
      return `<li class="${ici ? 'ici' : atteint ? 'fait' : ''}"><small>${tr`Porteur ${p.porteur}`}</small><b>${tr`niv. ${p.niveau}`}</b></li>`;
    }).join('')}</ol></section>`;
  // les escouades avec qui elle descend : rien à choisir, elle suit toute seule
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.district}${tr`Dans tes escouades`}</h3><div class="cm-escouades">`
    + toutes.map((l, k) => {
      const f = forces[k];
      const etat = !l.length ? tr('Escouade vide') : f ? tr`Descend avec elle · force ${f.v}` : tr`Scellée : aucun Porteur niv. ${NIVEAU_METAL.nacre}`;
      return `<div class="cm-esc fixe${f ? ' pris' : ''}"><span class="cm-esc-coche" aria-hidden="true">${f ? ICO.ok : ICO.verrou}</span><span class="cm-esc-txt"><strong>${tr`Escouade ${k + 1}`}</strong><small>${etat}</small></span>`
        + (l.length ? `<span class="cm-esc-visages">${l.map((id) => avatar(id, 22)).join('')}</span>` : '') + `</div>`;
    }).join('') + `</div><p class="fc-aide">${tr`Elle s’ajoute au deck en plus des cartes des Porteurs et du Râtelier : un deck peut donc compter une carte de plus que d’habitude.`}</p></section>`;
  return h + `</div></section>`;
}

/**
 * Les cartes du district qui descendent, au moment du départ (31 octobre 2026, Luc : « un message avant de débuter :
 * vous avez telle carte de district, le coût est de tant », marqué en rouge sur chaque carte). Fouille, Strate ou Épreuve :
 * toutes passent par cet écran. Chaque carte montre sa face et son prix ; celle qu'on ne peut pas payer reste au district.
 */
function departRatelier(j: Jeu, k: number, sortie: Sortie = 'explorer'): string {
  const prevues = ratelierDe(j, k);
  if (!prevues.length) return '';
  const payees = ratelierPayable(j, k, sortie);
  const total = coutRatelier(j, sortie, k);
  const cartes = prevues.map((id) => {
    const g = gesteCommun(j, communeDef(id)!);
    const paye = payees.includes(id);
    const etiquette = paye ? '' : `<em class="es-rt-prix reste">${tr`Reste au district`}</em>`;
    return `<li class="${paye ? '' : 'reste'}"><button type="button" class="es-rt-carte" data-action="carte" data-id="${g.id}" aria-label="${tr`${echap(g.nom)}${!paye ? tr(', reste au district faute de cristaux') : ''}. Voir la carte`}">${tuileFace(g)}</button>${etiquette}</li>`;
  }).join('');
  const manque = prevues.length - payees.length;
  const phrase = `${tr`Toutes ensemble, elles coûtent`} <b class="es-rt-total">${ICO.energie}${tr`${ent(total)} cristaux`}</b> ${tr`à ce départ${sortie === 'explorer' ? tr(' pour une exploration') : tr(' pour une sortie courte')} (tu en as ${ent(Math.floor(j.energie))}).`}`;
  return `<div class="es-ratelier"><span class="surtitre">${ICO.district}${tr`Cartes du district · ${payees.length}`}</span><ul class="es-rt">${cartes}</ul>`
    + `<p class="es-freq-aide">${tr`${phrase}${manque ? tr` Il manque des cristaux : elles restent au district, l’escouade part sans elles.` : ''} Elles restent au Râtelier de l’escouade ${k + 1} d’une descente à l’autre ; tu les changes dans l’onglet Escouade.`}</p></div>`;
}

/** La face d'une carte commune, en petit */
function tuileFace(g: GesteDef): string {
  const o = ORIGINE_PAQUETAGE[g.id];
  return faceCarte({ id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) } as ModuleDef, 1, 1, o ? { origine: o.batiment } : {});
}

/** Pourquoi une carte commune n'est pas encore prête : une raison du district (comme dans l'onglet Escouade) */
function raisonCommune(b: BatimentId): string {
  return ({
    noyau: tr('les creuseurs n’ont pas encore relevé ces galeries.'),
    generateur: tr('le courant ne suffit pas encore pour équiper une équipe.'),
    forge: tr('le forgeron n’a pas encore l’outillage pour ça.'),
    clinique: tr('la Clinique n’a pas encore le matériel.'),
    comptoir: tr('les fouilleurs n’en ont pas encore rapporté.'),
  } as Record<BatimentId, string>)[b];
}

/**
 * L'empreinte de la carte (28 octobre 2026) : son palier, ce qui manque pour le suivant, ses épithètes à choisir et son journal.
 * Pur prestige : la section le dit, pour qu'aucun joueur ne croie qu'une carte neuve est plus faible.
 */
function blocEmpreinte(j: Jeu, cle: string): string {
  const x = vecuDe(j, cle);
  const p = palierDe(x);
  const suite = versPalierSuivant(x);
  const ep = epithetesDe(cle, x);
  const affiche = epitheteAffiche(cle, x);
  const journal = journalCarte(x);
  let h = `<section class="bloc fc-emp"><h3 class="titre-bloc">${ICO.cristal}${tr`Empreinte`}</h3>`
    + `<div class="emp-tete"><span class="emp-palier p${p}"><i aria-hidden="true"></i><span><small>${p ? tr`Palier ${p} / 3` : tr('Aucun palier')}</small><b>${p ? NOMS_PALIER[p] : tr('Vierge')}</b></span></span>${affiche ? `<span class="emp-epithete">${echap(affiche)}</span>` : ''}</div>`;
  if (suite) {
    const part = Math.min(100, (100 * (suite.points - suite.depart)) / Math.max(1, suite.seuil - suite.depart));
    h += `<div class="progression"><div class="jauge" style="--jc:${['#8fd0f0', '#e8be5e', '#c9a8ff'][suite.palier - 1]}"><i style="width:${part}%"></i></div><span class="chiffre">${NOMS_PALIER[suite.palier]} · ${Math.min(suite.points, suite.seuil)} / ${suite.seuil}</span></div>`
      + `<ul class="emp-exploits" aria-label="${tr`Exploits demandés pour ${NOMS_PALIER[suite.palier]}`}">${suite.exploits.map((e) => `<li class="${e.fait ? 'fait' : ''}" aria-label="${echap(e.texte)}${e.fait ? tr(', fait') : tr(', à faire')}"><i aria-hidden="true"></i>${echap(e.texte)}</li>`).join('')}</ul>`;
  }
  h += `<p class="emp-aide">${tr`${p ? tr('Un trophée gagné au fil des descentes : ') : tr('Un trophée, pas un dû : il faut des semaines de combats avec la même carte, et des exploits qu’elle seule a vécus. ')}chaque palier allume son filigrane. Pur souvenir : aucun effet en combat.`}</p>`;
  if (ep.length > 1) h += `<div class="emp-epithetes" role="group" aria-label="${tr`Épithète affichée`}">${ep.map((e) => `<button type="button" class="emp-choix" data-action="epithete" data-module="${cle}" data-id="${e.id}" aria-pressed="${e.texte === affiche}">${echap(e.texte)}</button>`).join('')}</div>`;
  else if (!ep.length) h += `<p class="emp-aide">${tr`Épithètes : des exploits rares, comme porter le dernier coup à un Gardien.`}</p>`;
  if (journal.length) h += `<ul class="emp-journal">${journal.map((l) => `<li>${echap(l)}</li>`).join('')}</ul>`;
  return h + `</section>`;
}


/** Le poids d'une carte, en pastille de glace sur sa tuile */
// 12 novembre 2026 : la Charge ne limite plus le deck, les tuiles n'affichent plus le poids des cartes
export const pastillePoids = (_cle: string) => '';


/** La feuille d'un Porteur : les cartes qu'il porte (touche pour reprendre), puis celles qu'on peut lui confier */
export function feuilleDeck(e: EcranDistrict): string {
  const j = e.j;
  const id = e.deck;
  if (!id || !j.porteurs[id]) return '';
  const p = porteurDef(id);
  const porte = j.porteurs[id]!.modules.filter((k) => j.collection[k]);
  const plein = porte.length >= DISTRICT.cartesMax;
  const parti = enExpedition(j, id);
  // l'échange (25 octobre 2026) : on choisit une carte portée puis une à confier (ou l'inverse), et elles changent de place
  const choisie = e.echange && j.collection[e.echange] && moduleDef(e.echange).lignee === p.lignee ? e.echange : null;
  const choixPorte = !!choisie && porte.includes(choisie);
  const tuile = (cle: string, action: string, bas: string) => {
    const m = moduleDef(cle);
    const c = j.collection[cle]!;
    const sel = cle === choisie;
    return `<button type="button" class="carte-tuile${sel ? ' dk-choisie' : ''}" data-action="${action}" data-module="${cle}" data-id="${id}" data-carte="${cle}"${parti ? ' disabled' : ''} aria-pressed="${sel}" aria-label="${tr`${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}, pèse ${poidsCarte(cle)}`}">${faceCarte(m, c.niveau, multNiveau(cle, c.niveau))}<span class="tuile-bas">${bas}${pastillePoids(cle)}</span></button>`;
  };
  // la Charge (26 octobre 2026) : ce qu'il peut encore porter ; une carte qui prend la place d'une autre libère son poids
  const max = chargeMax(j, id);
  const portee = chargePortee(j, id);
  const tient = (k: string, retire?: string) => poidsCarte(k) <= max - portee + (retire ? poidsCarte(retire) : 0);
  /** même en prenant la place de la plus lourde qu'il porte, elle ne tiendrait pas */
  const plusLourde = Math.max(0, ...porte.map(poidsCarte));
  const jamais = (k: string) => poidsCarte(k) > max - portee + plusLourde;
  const tri = e.tri ?? 'puissance';
  const libres = trierCartes(Object.keys(j.collection)
    .filter((k) => moduleDef(k).lignee === p.lignee && !porte.includes(k)), j.collection, tri, j.vus.cartes);
  /** la carte qu'il porte déjà dans un autre métal : la confier la remplace */
  const remplace = (k: string) => porte.find((x) => moduleDe(x) === moduleDe(k));
  let h = `<div class="voile-feuille" data-action="deck-fermer" aria-hidden="true"></div><section class="feuille deck-porteur" role="dialog" aria-modal="true" aria-label="${tr`Les cartes ${echap(deNom(p.nom))}`}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR[p.lignee]}">${tr`${NOM_LIGNEE[p.lignee].toUpperCase()} · ${porte.length} / ${DISTRICT.cartesMax} CARTES`}</span><h2>${tr`Les cartes ${echap(deNom(p.nom))}`}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="deck" aria-label="${tr`Comment construire son deck`}">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="deck-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`;
  if (parti) h += `<p class="aide">${tr`${echap(p.nom)} est en expédition : ses cartes changeront à son retour.`}</p>`;
  // 12 novembre 2026 : la Charge ne limite plus le deck (les places et le niveau demandé par le métal suffisent) : plus de jauge
  // le tri, en tête : il range les deux listes de la feuille
  h += choixTri(tri);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.greffe}${tr`Ce que ${echap(p.nom)} porte`}</h3><p class="aide">${tr`Ces cartes entrent dans ton deck quand ${echap(p.nom)} descend. Touche une carte pour l’échanger ou la reprendre.`}</p>`;
  const fs = [...new Set(gestesDe(j, id).flatMap((g) => g.fs ?? [g.f]))].sort((a, b) => a - b);
  if (fs.length) h += `<p class="dk-freq">${tr`Fréquences qu’${ilElle(p)} apporte : ${fs.map((f) => `<i style="--fc:${couleurFrequence(f)}">${f}</i>`).join('')}`}</p>`;
  h += porte.length ? `<div class="grille-cartes">${trierCartes(porte, j.collection, tri, j.vus.cartes).map((k) => {
    // une carte à confier est choisie : celles qu'elle ne peut pas remplacer (trop légères pour lui faire de la place) se grisent
    const bloque = !!choisie && !choixPorte && !tient(choisie, k);
    const bas = k === choisie ? `<span class="dk-action dk-remplace">${ICO.recycler}${tr`Choisie`}</span>` : bloque ? `<span class="dk-action dk-lourd">${ICO.cristal}${tr`Trop lourd`}</span>` : choisie && !choixPorte ? `<span class="dk-action dk-remplace">${ICO.recycler}${tr`Échanger`}</span>` : `<span class="dk-action">${ICO.recycler}${tr`Échanger`}</span>`;
    return tuile(k, 'dk-porte', bas).replace('class="carte-tuile"', `class="carte-tuile${bloque ? ' grisee' : ''}"`);
  }).join('')}</div>` : `<p class="aide">${tr`Aucune carte pour l’instant.`}</p>`;
  h += `</section><section class="bloc"><h3 class="titre-bloc">${ICO.cartes}${tr`À lui confier`}</h3>`
    + `<p class="aide">${plein ? tr`${echap(p.nom)} porte déjà ${DISTRICT.cartesMax} cartes : touche une carte ici puis celle qu’elle remplace (ou l’inverse) pour les échanger.` : tr`Les cartes de sa lignée (${NOM_LIGNEES[p.lignee]}) dans ta collection. Une carte portée par un autre Porteur passe à ${echap(p.nom)}.`}</p>`;
  // les cartes libres d'abord, puis celles qu'un autre Porteur porte ; chaque groupe dans l'ordre du tri (sort est stable)
  // celles que son niveau ne permet pas encore de porter passent en dernier (10 novembre 2026, audit : le tri « Puissance » les mettait en tête)
  const rang = (k: string) => (niveauRequis(k) > niveauPorteur(j, id).niveau ? 2 : 0) + Number(!!greffesDe(j, k)[0]);
  const triees = [...libres].sort((a, b) => rang(a) - rang(b));
  h += libres.length ? `<div class="grille-cartes">${triees.map((k) => {
    const qui = greffesDe(j, k)[0];
    const r = remplace(k);
    // trop lourde : elle ne tient pas dans la Charge qui reste (en prenant la place de la carte choisie ou de son autre métal)
    // le métal demande un niveau qu'il n'a pas encore (NIVEAU_METAL)
    const haute = niveauRequis(k) > niveauPorteur(j, id).niveau;
    const lourde = !haute && k !== choisie && (choixPorte ? !tient(k, choisie!) : r ? !tient(k, r) : jamais(k));
    // elle tient seulement à la place d'une carte plus lourde : on l'échange
    const aEchanger = !lourde && !choixPorte && !r && !tient(k);
    const bas = k === choisie ? `<span class="dk-action dk-remplace">${ICO.recycler}${tr`Choisie`}</span>`
      : haute ? `<span class="dk-action dk-lourd">${ICO.cristal}${tr`Niveau ${niveauRequis(k)} requis`}</span>`
      : lourde ? `<span class="dk-action dk-lourd">${ICO.cristal}${tr`Trop lourde`}</span>`
      : choixPorte || aEchanger ? `<span class="dk-action dk-remplace">${ICO.recycler}${tr`Échanger`}</span>`
      : r ? `<span class="dk-action dk-remplace">${ICO.recycler}<span>${tr`Remplace`}<br>${tr`celle en ${NOMS_RARETE[moduleDef(r).rarete].toLowerCase()}`}</span></span>`
      : qui ? `${avatar(qui, 20)}<span class="dk-chez">${tr`chez ${echap(porteurDef(qui).nom)}`}</span>` : `<span class="dk-action">${ICO.greffe}${tr`Confier`}</span>`;
    // qui la porte reste visible quel que soit l'état de la carte (retour de Luc, 31 octobre 2026) : avant, « Échanger »,
    // « Remplace… » ou « Trop lourde » cachaient le Porteur, et certaines cartes portées semblaient libres
    const chez = qui && !bas.includes('dk-chez') ? `<span class="dk-qui" title="${tr`Portée par ${echap(porteurDef(qui).nom)}`}">${avatar(qui, 18)}</span>` : '';
    // pleine, il ne peut plus en recevoir de nouvelle ; une carte qui en remplace une autre reste possible
    return tuile(k, 'dk-libre', chez + bas).replace('class="carte-tuile"', `class="carte-tuile${(plein && !r && !choixPorte) || lourde || haute ? ' grisee' : ''}"`);
  }).join('')}</div>` : `<p class="aide">${tr`Aucune autre carte de sa lignée pour l’instant : les Strates en cachent d’autres.`}</p>`;
  h += `</section></div>`;
  // la carte choisie attend sa partenaire : le pied de la feuille le dit, toujours visible
  if (choisie && !parti) {
    const nom = echap(moduleDef(choisie).nom);
    h += `<footer class="feuille-pied dk-pied"><p class="dk-consigne">${ICO.recycler}<span><strong>${nom}</strong> ${choixPorte ? tr`: touche une carte de « À lui confier » pour l’échanger.` : tr`: touche la carte que ${echap(p.nom)} porte et qu’elle remplacera.`}</span></p>`
      + `<div class="ligne-btn">${choixPorte ? `<button type="button" class="btn sec" data-action="degreffer" data-module="${choisie}">${ICO.retour}${tr`Reprendre`}</button>` : ''}`
      + `<button type="button" class="btn sec" data-action="dk-annuler">${tr`Annuler`}</button></div></footer>`;
  }
  return h + `</section>`;
}

// La collection (revue du 22 octobre 2026, même équipe) : les cartes arrivent tout de suite, des filtres utiles
// (« peuvent monter », « libres ») en plus des lignées, et l'équipement des Porteurs se fait depuis le volet Escouade
// ou en touchant une carte. Depuis le 25 octobre 2026, c'est le troisième volet de l'onglet Escouade.
/** Le choix du tri des cartes (24 octobre 2026) : le même partout où l'on voit une liste de cartes, et retenu d'un écran à l'autre */
function choixTri(tri: TriCartes): string {
  return `<div class="tri-cartes" role="radiogroup" aria-label="${tr`Trier les cartes`}"><span class="tri-label">${ICO.journal}${tr`Trier`}</span>`
    + TRIS.map((t) => `<button type="button" role="radio" class="tri-choix${t.id === tri ? ' actif' : ''}" data-action="tri" data-id="${t.id}" aria-checked="${t.id === tri}" title="${echap(t.texte)}">${t.nom}</button>`).join('')
    + `</div>`;
}

export function htmlCartes(e: EcranDistrict): string {
  const j = e.j;
  // l’Héritage n'entre pas dans le compte : chacun n'en reçoit qu'une sur dix
  const trouvees = MODULES_TIRABLES.filter((m) => exemplaires(j, m.id).length).length;
  const toutes = MODULES.flatMap((m) => exemplaires(j, m.id));
  const peutMonter = (cle: string) => {
    const m = moduleDef(cle); const c = j.collection[cle]!; const requis = doublonsRequis(m.id, c.niveau);
    return requis !== null && c.doublons >= requis && j.energie >= composantsNiveau(c.niveau + 1);
  };
  const portees = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
  const estLibre = (cle: string) => !portees.has(cle);
  const nMonter = toutes.filter(peutMonter).length;
  const nLibres = toutes.filter(estLibre).length;
  const f = e.filtre;
  let h = entete(tr`${trouvees} / ${MODULES_TIRABLES.length} TROUVÉES`, tr('Collection'), `<div class="cl-guides">${lienGuide('deck', tr('Construire son deck'))}${lienGuide('carte', tr('Les effets'))}</div>`);
  h += voletsEscouade(e);
  const filtres: { id: Filtre; nom: string; n?: number; c?: string; classe?: string }[] = [
    { id: 'tout', nom: tr('Toutes') }, { id: 'tech', nom: NOM_LIGNEES.tech, c: COULEUR.tech }, { id: 'bio', nom: NOM_LIGNEES.bio, c: COULEUR.bio }, { id: 'reso', nom: NOM_LIGNEES.reso, c: COULEUR.reso },
    { id: 'monter', nom: tr('Peuvent monter'), n: nMonter, classe: 'or' }, { id: 'libres', nom: tr('Libres'), n: nLibres },
  ];
  h += `<div class="cl-filtres" role="tablist" aria-label="${tr`Filtrer la collection`}">` + filtres.map((x) =>
    `<button type="button" role="tab" class="es-cible${f === x.id ? ' actif' : ''}${x.classe ? ` ${x.classe}` : ''}"${x.c ? ` style="--c:${x.c}"` : ''} data-action="filtre" data-id="${x.id}" aria-selected="${f === x.id}">${x.nom}${x.n !== undefined ? ` <b>${x.n}</b>` : ''}</button>`).join('') + `</div>`;
  const tri = e.tri ?? 'puissance';
  h += choixTri(tri);
  h += `<p class="cl-intro">${tr`Toutes tes cartes. Touches-en une pour la confier à un Porteur ou la faire monter ; ton deck est dans le volet Escouade.`}</p>`;

  const tuileCarte = (cle: string) => {
    const m = moduleDef(cle);
    const c = j.collection[cle]!;
    const requis = doublonsRequis(m.id, c.niveau);
    const porte = greffesDe(j, m.id)[0];
    const pret = peutMonter(cle);
    return `<button type="button" class="carte-tuile cl-carte${pret ? ' pret' : ''}" data-action="carte" data-id="${cle}" data-carte="${cle}" aria-label="${tr`${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}${porte ? tr`, portée par ${echap(porteurDef(porte).nom)}` : tr(', libre')}${pret ? tr(', peut monter') : ''}`}">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}`
      + `<span class="cl-bas"><span class="cl-porteur">${porte ? `${avatar(porte, 20)}<span>${echap(porteurDef(porte).nom)}</span>` : `<span class="cl-libre">${tr`Libre`}</span>`}</span>`
      + `<span class="cl-niv" title="${tr`Niveau ${c.niveau}`}">${tr`Niv. ${c.niveau}`}</span>`
      + (m.legs ? `<span class="cl-max cl-legs">${tr`Héritage`}</span>` : m.origine ? `<span class="cl-max cl-legs">${tr`Origine`}</span>` : requis === null ? `<span class="cl-max">${tr`Max`}</span>` : `<span class="cl-doublons" title="${tr`Doublons pour le niveau ${c.niveau + 1}`}"><span class="mini-jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></span><span>${c.doublons}/${requis}</span></span>`)
      + `</span>${pret ? `<span class="cl-monter">${ICO.monter}${tr`Peut monter`}</span>` : ''}${e.j.vus.cartes.includes(cle) ? '' : `<span class="gemme-nouveau" role="img" aria-label="${tr`Nouvelle`}"></span>`}</button>`;
  };

  if (f === 'monter' || f === 'libres') {
    const liste = trierCartes(toutes.filter(f === 'monter' ? peutMonter : estLibre), j.collection, tri, j.vus.cartes);
    h += `<h2 class="titre-section">${f === 'monter' ? tr('Peuvent monter') : tr('Libres : personne ne les porte')}</h2>`
      + (liste.length ? `<div class="grille-cartes">${liste.map(tuileCarte).join('')}</div>`
        : `<p class="cl-vide">${f === 'monter' ? tr('Aucune carte n’a encore assez de doublons et de cristaux pour monter.') : tr('Toutes tes cartes sont confiées à un Porteur.')}</p>`);
  } else {
    const lignees: Lignee[] = f === 'tout' ? ['tech', 'bio', 'reso'] : [f];
    for (const lignee of lignees) {
      h += `<h2 class="titre-section" style="--c:${COULEUR[lignee]}">${NOM_LIGNEES[lignee]}</h2><div class="grille-cartes">`;
      // les cartes trouvées, triées ; celles qui restent à trouver à la fin
      // l’Héritage, le parrainage et les cartes d'origine ne sont jamais « à trouver » : on ne les montre que possédées (album)
      const a = album(j.collection, lignee);
      for (const cle of trierCartes(a.possedees.flatMap((b) => exemplaires(j, b.id)), j.collection, tri, j.vus.cartes)) h += tuileCarte(cle);
      for (const base of a.aTrouver) h += `<div class="carte-dos cl-dos" aria-label="${tr`Carte pas encore trouvée`}">${gemme(base.rarete)}<span>?</span><small>${tr`À trouver`}</small><em>${tr`Fouille « ${echap(CIBLES_FOUILLE[lignee].nom)} »`}</em></div>`;
      h += `</div>`;
    }
  }
  // les cartes communes du district (Râtelier, 30 octobre 2026) : jamais dans la collection, on les montre pour qu'on sache d'où elles viennent
  if (f === 'tout') {
    const ou = (id: string) => escouadesAvecCommune(j, id).map((k) => k + 1);
    h += `<h2 class="titre-section" style="--c:#CDEFFF">${tr`Cartes communes du district`}</h2>`
      + `${texteReplie(tr('Préparées par tes bâtiments, sans lignée ni métal. Elles ne s’éteignent jamais quand un Porteur tombe et gagnent de la force quand leur bâtiment monte. Chaque escouade a son Râtelier : une même carte peut descendre avec plusieurs.'), 'communes', 'cl-intro')}`
      + `<div class="grille-cartes">` + CARTES_COMMUNES.map((c) => {
        const g = gesteCommun(j, c);
        const o = ORIGINE_PAQUETAGE[g.id]!;
        const ouverte = communeOuverte(j, c);
        const m: ModuleDef = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) };
        const esc = ou(g.id);
        const bas = !ouverte ? `${ICO.cristal}<b>${tr`${echap(o.batiment)} niveau ${c.niveau}`}</b>` : esc.length ? `<b>${tr`Escouade${esc.length > 1 ? 's' : ''} ${esc.join(', ')}`}</b> · ${echap(o.texte)}` : echap(o.texte);
        // on la touche comme les autres pour voir ses effets et comment l'améliorer (31 octobre 2026, Luc)
        return `<button type="button" class="carte-tuile cl-carte cl-paquetage${ouverte ? '' : ' cl-scellee'}" data-action="carte" data-id="${g.id}" data-carte="${g.id}" aria-label="${tr`${echap(g.nom)}, carte commune${esc.length ? tr`, au Râtelier de l’escouade ${esc.join(', ')}` : ''}. Voir la carte`}">${faceCarte(m, 1, 1, { origine: o.batiment })}<span class="cl-bas"><span class="cl-origine">${bas}</span></span></button>`;
      }).join('') + (j.legs === 'cle' ? carteCle(j) : '') + `</div>`;
  }
  // le mode d'emploi prend la place des autres feuilles ; en le fermant, on retrouve celle d'où on venait
  if (e.guide) h += feuilleGuide(e.guide, trouveesDe(j.collection));
  else h += feuilleCarte(e) + feuilleDeck(e);
  if (j.choix.length) h += fenetreChoix(j);
  return coquille(e, h, 'ecran-cartes cl');
}

/** Ce que le prochain niveau change : la force (niveaux 2 et 4) ou l'effet (niveaux 3 et 5), en clair (10 novembre 2026) */
function gainSuivant(m: ModuleDef, niveau: number): string {
  const avant = carteNiveau(m, niveau), apres = carteNiveau(m, niveau + 1);
  const e1 = avant.effet, e2 = apres.effet;
  if (e1 && e2 && JSON.stringify(e1) !== JSON.stringify(e2)) return `${tr`Niveau ${niveau + 1} : ${NOMS_EFFET[e1.type]} ${formuleEffet(e1)} →`} <b>${formuleEffet(e2)}</b>`;
  return `${tr`Niveau ${niveau + 1} : force ${avant.v} →`} <b>${apres.v}</b>`;
}

/**
 * La Clé de l’Héritage dans l'écran Cartes (29 octobre 2026, Luc ne la trouvait nulle part) : elle n'est pas dans la collection
 * (elle rejoint le paquetage), on la montre donc ici, scellée tant qu'aucun Porteur n'a le niveau de la nacre.
 */
function carteCle(j: Jeu): string {
  const g = CLE_LEGS;
  const o = ORIGINE_PAQUETAGE['cle-legs']!;
  const m: ModuleDef = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'nacre', type: g.type, v: g.v, f: [g.f], effet: g.effet!, effet2: g.effet2!, legs: true };
  const pret = Object.keys(j.porteurs).some((id) => niveauPorteur(j, id).niveau >= NIVEAU_METAL.nacre);
  const bas = pret ? `<span class="cl-origine">${tr`Ton Héritage : dans chaque escouade qui compte un Porteur de niveau ${NIVEAU_METAL.nacre}.`}</span>`
    : `<span class="cl-origine">${ICO.cristal}<b>${tr`Scellée`}</b> ${tr`: elle rejoindra le paquetage quand un Porteur de l’escouade aura le niveau ${NIVEAU_METAL.nacre}.`}</span>`;
  // on la touche comme les autres (31 octobre 2026, Bryan), scellée ou non
  return `<button type="button" class="carte-tuile cl-carte cl-paquetage${pret ? '' : ' cl-scellee'}" data-action="carte" data-id="${g.id}" data-carte="${g.id}" aria-label="${tr`${echap(g.nom)}, ton Héritage${pret ? '' : tr(', scellée')}. Voir la carte`}">${faceCarte(m, COLLECTION.niveauDepart.nacre, 1, { origine: o.batiment })}<span class="cl-bas">${bas}</span></button>`;
}

// ---------- La rencontre, avant la chambre scellée ----------

const REPLIQUES: { id: string; texte: string }[] = [
  { id: 'ilka', texte: tr('« On attend quoi, directeur ? Qu’elle s’ouvre toute seule ? »') },
  { id: 'doran', texte: tr('« Mon père a travaillé dans ce puits, avant qu’on le mure. Il n’a jamais aimé son silence. »') },
  { id: 'vela', texte: tr('« Quelque chose a peur, derrière cette porte. Et ce n’est pas moi. »') },
  // pourquoi ces trois-là : chacun dit ce qui l'amène (22 octobre 2026, Bryan : « c'est à expliquer dans le jeu »)
  { id: 'ilka', texte: tr('« Les ouvriers m’ont envoyée te chercher à l’aube. Quand ça presse, c’est moi qu’on envoie. Et là, ça presse. »') },
  { id: 'doran', texte: tr('« En dessous, il y a les couloirs qu’on a murés en 2066. Je suis le dernier à savoir où ils passent. »') },
  { id: 'vela', texte: tr('« Oui, j’ai une mèche d’or. Mais je suis d’ici, pas des Hauts. Ce qui dort derrière, je l’entends : vous ne descendrez pas sans moi. »') },
];

/** nombre de répliques de la rencontre (main.ts avance d'une à chaque toucher) */
export const NB_REPLIQUES = REPLIQUES.length;

/** Où parle chacun : position de la bulle à l'écran et direction de sa pointe vers le personnage */
const BULLES: Record<string, string> = { ilka: 'b-ilka', doran: 'b-doran', vela: 'b-vela' };

/** La rencontre en scène : l'illustration du trio devant la porte, et les répliques en bulles, une par toucher */
export function htmlRencontre(n = 0): string {
  const fini = n >= REPLIQUES.length;
  let h = `<section class="scene-rencontre${fini ? ' finie' : ''}" data-action="rencontre-suite" style="--image:url(./intro/00-titre.webp)" aria-label="${tr`La porte scellée`}">`
    + `<div class="rencontre-fond" aria-hidden="true"><div class="rencontre-image"><img src="./intro/00-titre.webp" alt="" decoding="async"><span class="t-porte"></span><span class="t-flamme"></span><span class="t-halo"></span></div></div>`
    + `<header class="rencontre-haut"><div><span class="label">${tr`SOUS LA TOUR DU NOYAU`}</span><h1>${tr`La porte scellée`}</h1></div><button type="button" class="btn-sec" data-action="archipel">${tr`Plus tard`}</button></header>`
    + `<p class="recitatif">${tr`Une porte ronde, scellée depuis les années 2060, luit faiblement. Trois personnes t’attendent devant.`}</p>`;
  // une bulle par personnage : sa dernière réplique remplace la précédente, pour ne pas couvrir l'image
  const vues = REPLIQUES.slice(0, n);
  vues.forEach((r, i) => {
    if (vues.slice(i + 1).some((x) => x.id === r.id)) return;
    const d = porteurDef(r.id);
    h += `<div class="bulle ${BULLES[r.id]}${i === n - 1 ? ' neuve' : ''}" style="--c:${COULEUR[d.lignee]}"><strong>${echap(d.nom)}</strong><p>${echap(r.texte.replace(/^« | »$/g, ''))}</p></div>`;
  });
  // 12 novembre 2026 (audit du début) : « Ouvrir la porte » n'arrive qu'après les répliques, qui disent pourquoi ces trois-là.
  // Avant, le gros bouton faisait passer la seule explication du trio. Un petit « Passer » reste pour qui rejoue.
  h += `<footer class="rencontre-bas">`
    + (fini
      ? `<button type="button" class="btn prim large appel-porte" data-action="briefing">${ICO.porte}${tr`Ouvrir la porte`}</button>`
      : `<button type="button" class="btn prim large appel-porte" data-action="rencontre-suite">${n ? tr`Écouter la suite` : tr`Les écouter`}<small class="compte-repliques">${n} / ${REPLIQUES.length}</small></button>`
        + `<button type="button" class="lien-passer" data-action="briefing">${tr`Passer`}</button>`)
    + `</footer></section>`;
  return h;
}

// ---------- La Bibliothèque : Chroniques et Archives ----------

/** Chapitres des Chroniques ouverts mais pas encore lus (pour la pastille « nouveau ») */
const chapitresNouveaux = (j: Jeu) => CHAPITRES.filter((c) => chapitreOuvert(c, j.strate) && !j.lus.includes(c.id)).length;

/** Le carnet du directeur (3 novembre 2026) : ce qu'il a appris à chaque Halte, et ce qu'il y a choisi, Strate par Strate */
function htmlCarnet(j: Jeu): string {
  let pages = '';
  let vues = 0;
  let total = 0;
  // les Haltes du Fond (−11 à −15) n'entrent au carnet qu'une fois la Strate atteinte
  for (let s = 1; s <= HALTES_FOND.a; s++) {
    if (s > 10 && j.strate < s) break;
    const n = nombreHaltes(s);
    total += n;
    const lues = Math.min(n, j.haltes?.[s] ?? 0);
    vues += lues;
    for (let k = 1; k <= lues; k++) {
      const h = halteDef(s, k);
      if (!h) continue;
      const c = j.choixHaltes?.[`${s}-${k}`];
      const choix = c !== undefined ? h.choix[c]?.texte : undefined;
      const rev = revelationDe(j.choixHaltes, s, k);
      pages += `<article class="fragment carnet"><span class="surtitre">${tr`STRATE −${s} · HALTE ${['I', 'II', 'III'][k - 1]}`}</span><h2>${echap(h.titre)}</h2>`
        + `<p>${echap(h.fait)}</p>${rev ? `<p class="carnet-enquete"><b>◆ ${echap(PISTES[rev.piste])} · ${echap(rev.r.nom)}</b>${echap(rev.r.fait)}</p>` : ''}`
        + `${choix ? `<p class="carnet-choix">${tr`Ce que j’ai fait : ${echap(choix.charAt(0).toLowerCase() + choix.slice(1))}.`}</p>` : ''}</article>`;
    }
  }
  const r = `<section class="livre"><header class="livre-tete"><span class="surtitre">${tr`CARNET DU DIRECTEUR · ${vues} / ${total} HALTES`}</span><h2>${tr`Ce que j’ai appris en bas`}</h2></header>`;
  if (!vues) return r + `<p class="vide-ecran">${ICO.halte}${tr`Rien encore. Chaque Halte des Strates ajoute une page à ce carnet.`}</p></section>`;
  if (vues < total) pages += `<div class="fragment enfoui">${ICO.verrou}<span>${tr`${total - vues} Halte${total - vues > 1 ? 's' : ''} encore à découvrir, une par descente`}</span></div>`;
  return r + `<div class="carnet-pages">${pages}</div></section>`;
}

/** La Bibliothèque du district : les Chroniques d'Ysé et les Archives trouvées dans les Strates */
export function htmlCodex(e: EcranDistrict): string {
  const j = e.j;
  if (e.onglet === 'chroniques' && e.chapitre) {
    const c = chapitreDef(e.chapitre);
    if (c && chapitreOuvert(c, j.strate)) return coquille(e, htmlChapitre(e, c.id), 'ecran-lecture');
  }
  const ouverts = CHAPITRES.filter((c) => chapitreOuvert(c, j.strate)).length;
  const retour = e.retourBiblio === 'titre' ? `<button type="button" class="btn-icone" data-action="biblio-retour" aria-label="${tr`Retour à l’écran titre`}">${ICO.retour}</button>` : '';
  let h = entete(tr`${ouverts} / ${CHAPITRES.length} CHAPITRES · ${j.fragments.filter((f) => FRAGMENTS.some((x) => x.id === f)).length} / ${FRAGMENTS.length} ARCHIVES`, tr('Bibliothèque'), retour);
  const nouveaux = chapitresNouveaux(j);
  h += `<div class="segments-choix" role="tablist">`
    + `<button type="button" role="tab" class="seg${e.onglet === 'chroniques' ? ' actif' : ''}" aria-selected="${e.onglet === 'chroniques'}" data-action="biblio-onglet" data-id="chroniques">${tr`Chroniques`}${nouveaux ? ` <span class="pastille-n">${nouveaux}</span>` : ''}</button>`
    + `<button type="button" role="tab" class="seg${e.onglet === 'archives' ? ' actif' : ''}" aria-selected="${e.onglet === 'archives'}" data-action="biblio-onglet" data-id="archives">${tr`Archives`}</button>`
    + `<button type="button" role="tab" class="seg${e.onglet === 'campagne' ? ' actif' : ''}" aria-selected="${e.onglet === 'campagne'}" data-action="biblio-onglet" data-id="campagne">${tr`Campagne`}</button>`
    + `<button type="button" role="tab" class="seg${e.onglet === 'bestiaire' ? ' actif' : ''}" aria-selected="${e.onglet === 'bestiaire'}" data-action="biblio-onglet" data-id="bestiaire">${tr`Bestiaire`}</button></div>`;
  if (e.onglet === 'campagne') return coquille(e, h + htmlListeScenes(j.scenes ?? []) + htmlCarnet(j), 'ecran-codex');
  if (e.onglet === 'bestiaire') return coquille(e, h + htmlBestiaire(j), 'ecran-codex');
  if (e.onglet === 'archives') {
    h += `<p class="aide intro-ecran">${tr`Des papiers d’époque, trouvés un à un dans les Strates. Ysé y renvoie souvent dans ses Chroniques.`}</p>`;
    const papiers = j.fragments.filter((f) => FRAGMENTS.some((x) => x.id === f));
    if (!papiers.length) h += `<p class="vide-ecran">${ICO.codex}${tr`Aucun fragment pour l’instant. On les trouve en ouvrant de nouvelles Strates.`}</p>`;
    papiers.forEach((id, i) => {
      const f = FRAGMENTS.find((x) => x.id === id);
      if (!f) return;
      h += `<article class="fragment"><span class="surtitre">N° ${String(i + 1).padStart(2, '0')} · ${echap(f.support.toUpperCase())}</span><h2>${echap(f.titre)}</h2>${f.lignes.map((l) => `<p>${echap(l)}</p>`).join('')}</article>`;
    });
    const reste = FRAGMENTS.length - papiers.length;
    if (reste > 0) h += `<div class="fragment enfoui">${ICO.verrou}<span>${tr`${reste} fragment${reste > 1 ? 's' : ''} encore enfoui${reste > 1 ? 's' : ''} dans les Strates`}</span></div>`;
    // les souvenirs des familles (30 octobre 2026) : un par palier de 75 habitants qui te suivent
    const souvenirs = FAMILLES.filter((f) => j.fragments.includes(f.id));
    h += `<h2 class="titre-bloc archives-familles">${ICO.district}${tr`Souvenirs des familles · ${souvenirs.length} / ${FAMILLES.length}`}</h2>`
      + `<p class="aide">${tr`Chaque fois que ${CONFIANCE.palier} familles de plus te suivent, l’une d’elles confie aux Archives ce qu’elle a gardé de plus précieux.`}</p>`;
    for (const f of souvenirs) h += `<article class="fragment famille"><span class="surtitre">${echap(f.support.toUpperCase())}</span><h2>${echap(f.titre)}</h2>${f.lignes.map((l) => `<p>${echap(l)}</p>`).join('')}</article>`;
    const restent = FAMILLES.length - souvenirs.length;
    if (restent > 0) h += `<div class="fragment enfoui">${ICO.verrou}<span>${tr`Prochain souvenir à ${(souvenirs.length + 1) * CONFIANCE.palier} familles qui te suivent`}</span></div>`;
    return coquille(e, h, 'ecran-codex');
  }
  h += `<p class="chroniques-intro"><img class="yse-medaillon" src="${portraitYse}" alt="${tr`Ysé`}" decoding="async">${tr`Les Chroniques d’Ysé, archiviste des Veilleurs de Sédime, écrites pour toi le matin de ta première descente, à lire en remontant.`}</p>`;
  for (const livre of [1, 2, 3, 4] as const) {
    const chapitres = CHAPITRES.filter((x) => x.livre === livre);
    const lus = chapitres.filter((c) => chapitreOuvert(c, j.strate) && j.lus.includes(c.id)).length;
    const [numLivre, nomLivre] = LIVRES[livre].split(' · ');
    h += `<section class="livre"><header class="livre-tete"><span class="surtitre">${echap(numLivre!.toUpperCase())}</span><h2>${echap(nomLivre ?? '')}</h2>`
      + `<span class="livre-compte">${tr`${lus} / ${chapitres.length} lus`}</span></header><div class="rayon">`;
    for (const c of chapitres) {
      const n = String(CHAPITRES.indexOf(c) + 1).padStart(2, '0');
      const img = `<img src="./intro/${imageChapitre(c)}.webp" alt="" loading="lazy" decoding="async">`;
      if (chapitreOuvert(c, j.strate)) {
        const neuf = !j.lus.includes(c.id);
        h += `<button type="button" class="chapitre-tuile${neuf ? ' neuf' : ''}" data-action="chapitre" data-id="${c.id}">${img}`
          + `<span class="chap-num">${tr`CH. ${n}`}</span>`
          + (!j.luesRecompensees.includes(c.id) ? `<span class="chap-don">${tr`+1 carte`}</span>` : `<span class="chap-lu" aria-label="${tr`Lu`}">${ICO.ok}</span>`)
          + `<span class="chap-bas"><strong>${echap(c.titre)}</strong><small>${echap(c.epoque)}</small></span></button>`;
      } else {
        h += `<div class="chapitre-tuile ferme" aria-disabled="true">${img}<span class="chap-num">${tr`CH. ${n}`}</span><span class="chap-verrou" aria-hidden="true">${ICO.verrou}</span>`
          + `<span class="chap-bas"><strong>${echap(c.titre)}</strong>${c.teaser ? `<small>${echap(c.teaser)}</small>` : ''}<em>${ICO.strate}${tr`Strate −${c.strate}`}</em></span></div>`;
      }
    }
    h += `</div></section>`;
  }
  return coquille(e, h, 'ecran-codex');
}

/** L'illustration d'un chapitre (public/intro/) */
const imageChapitre = (c: { id: string; image?: string }) => c.image ?? '10-dessous';

/** Typographie française : espace fine insécable avant : ; ? ! » et après « */
const typo = (t: string) => t.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ').replace(/n° /g, 'n° ').replace(/(\d) h (\d)/g, '$1 h $2');

function htmlChapitre(e: EcranDistrict, id: string): string {
  const j = e.j;
  const c = chapitreDef(id)!;
  const i = CHAPITRES.indexOf(c);
  const lisibles = CHAPITRES.filter((x) => chapitreOuvert(x, j.strate));
  const k = lisibles.indexOf(c);
  const prec = lisibles[k - 1];
  const suiv = lisibles[k + 1];
  const prochainFerme = CHAPITRES.slice(i + 1).find((x) => !chapitreOuvert(x, j.strate));
  const suite = (x: typeof c, sens: 'prec' | 'suiv') => `<button type="button" class="lecture-suite ${sens}" data-action="chapitre" data-id="${x.id}">`
    + `<img src="./intro/${imageChapitre(x)}.webp" alt="" loading="lazy" decoding="async">`
    + `<span><small>${sens === 'prec' ? tr('Chapitre précédent') : tr('Chapitre suivant')}</small><strong>${echap(x.titre)}</strong></span>${sens === 'prec' ? ICO.retour : ICO.lancer}</button>`;
  let h = `<article class="lecture"><div class="lecture-progres" aria-hidden="true"></div>`;
  h += `<figure class="lecture-planche" aria-hidden="true"><img src="./intro/${imageChapitre(c)}.webp" alt="" decoding="async"></figure>`;
  h += `<div class="lecture-page"><button type="button" class="btn sec petit lecture-retour" data-action="chapitre-fermer">${ICO.retour}${tr`Sommaire`}</button>`
    + `<header class="lecture-titre"><span class="surtitre">${tr`${echap(LIVRES[c.livre].split(' · ')[0]!.toUpperCase())} · CHAPITRE ${i + 1}`}</span><h1>${echap(c.titre)}</h1><span class="epoque">${echap(c.epoque)}</span></header>`;
  h += `<div class="lecture-texte">`;
  c.paragraphes.forEach((p, n) => {
    const signature = n === c.paragraphes.length - 1 && p.startsWith('Ysé') && p.length < 80;
    h += `<p${signature ? ' class="signature"' : n === 0 ? ' class="lettrine"' : ''}>${typo(echap(p))}</p>`;
  });
  h += `</div>`;
  if (c.documents?.length) {
    h += `<section class="lecture-docs"><span class="surtitre">${tr`RECOPIÉ PAR YSÉ`}</span>`
      + c.documents.map((d) => `<article class="fragment"><span class="surtitre">${echap(d.support.toUpperCase())}</span><h2>${echap(d.titre)}</h2>${d.lignes.map((l) => `<p>${typo(echap(l))}</p>`).join('')}</article>`).join('')
      + `</section>`;
  }
  h += `<nav class="lecture-nav">`
    + (suiv ? suite(suiv, 'suiv')
      : `<p class="aide">${prochainFerme ? tr`La suite s’ouvrira à la Strate −${prochainFerme.strate}.` : tr('Fin des Chroniques. Pour l’instant.')}</p>`)
    + (prec ? suite(prec, 'prec') : '')
    + `</nav></div></article>`;
  return h;
}

// ---------- La Tour du Noyau en coupe ----------

/** Les dix Strates nommées (décisions du 28 octobre 2026) ; au-delà de −10, un seul libellé pour tout le Fond */
const NOMS_ETAGES = [tr('Les Pompes noyées'), tr('Les Abris murés'), tr('La Galerie aux lueurs'), tr('Les Portes rondes'), tr('Le Treillis'),
  tr('Le Mur de 2066'), tr('Les Deux Rives'), tr('La Ruche d’ambre'), tr('Le Ciel d’en bas'), tr('Le Puits d’avant'), tr('Sous le Puits d’avant')];

/** la barre d'expérience, fine et dorée, sous la jauge de PV */
export function barreXp(j: EcranDistrict['j'], id: string): string {
  const n = niveauPorteur(j, id);
  return `<div class="barre-xp" title="${n.requis ? tr`${n.xp} / ${n.requis} XP vers le niveau ${n.niveau + 1}` : tr('Niveau maximum')}"><i style="width:${n.requis ? Math.round((100 * n.xp) / n.requis) : 100}%"></i></div>`;
}

export function jaugePv(pv: number, max: number, usure = 0, usureM = 1): string {
  return `<div class="jauge-pv"><i class="pv" style="width:${(100 * pv) / max}%"></i>${usure >= 1 ? `<i class="usure" style="width:${(100 * Math.min(usure, usureM)) / max}%"></i>` : ''}</div>`;
}

// La Tour du Noyau en coupe (revue du 22 octobre 2026, même équipe que la feuille de bâtiment et l'Escouade) :
// la coupe peinte en tête avec les habitants en bande, la prochaine étape avec ses boutons, puis les Strates
// qui descendent dans le bon sens (−1 en haut, la roche à creuser tout en bas).
export function htmlCoupe(e: EcranDistrict): string {
  const j = e.j;
  let h = entete(tr`EN COUPE · ${j.strate} ÉTAGE${j.strate > 1 ? 'S' : ''} CREUSÉ${j.strate > 1 ? 'S' : ''}`, tr('Tour du Noyau'));
  const presents = PORTEURS.filter((p) => porteursPresents(j).includes(p.id));
  const libres = presents.filter((p) => disponibles(j).includes(p.id)).length;
  // la coupe est une image en hauteur (720 × 1285) : sur PC elle tient une colonne entière à gauche, à sa vraie forme,
  // au lieu d'un bandeau qui l'agrandissait et n'en gardait qu'une tranche floue (10 novembre 2026, capture de Bryan)
  h += `<div class="tr-cadre"><section class="tr-heros"><img class="tr-coupe" src="${decor('coupe')}" alt="" decoding="async">`
    + `<button type="button" class="tr-habitants" data-action="porteurs" aria-label="${tr`Porteurs : ${presents.length} au district, ${libres} disponibles. Voir les Porteurs`}">`
    + `<span class="tr-hab-avatars">${presents.map((p) => {
      const d = j.porteurs[p.id]!;
      const etat = enExpedition(j, p.id) ? 'parti' : d.poste ? 'travail' : 'libre';
      return `<span class="tr-hab ${etat}">${avatar(p.id, 36)}<i></i></span>`;
    }).join('')}</span><span class="tr-hab-txt"><b>${tr`${libres} disponible${libres > 1 ? 's' : ''}`}</b> ${tr`sur ${presents.length} · Voir les Porteurs`} ${ICO.retour}</span></button></section><div class="tr-col">`;

  // la prochaine étape, avec de quoi la faire tout de suite
  const off = !!j.expedition || !j.chambre;
  const cible = j.strate + 1;
  const manque = manquePourCreuser(j);
  let etape = '';
  if (!j.frontVaincu) {
    etape = `<strong>${tr`Vaincs le gardien de la Strate −${j.strate}`}</strong><small>${tr`C’est lui qui garde le passage : une fois vaincu, tes creuseurs pourront attaquer la roche.`}</small>`
      + `<div class="tr-boutons"><button type="button" class="btn prim" data-action="descendre" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.descendre}${tr`Descendre à −${j.strate}`}</button></div>`;
  } else if (manque) {
    const morceaux: string[] = [];
    const auPort = !!manque.creuseurs && portOuvert(j) && naufragesDeLaStrate(j).restants > 0;
    if (manque.creuseurs) morceaux.push(`${tr`trouve`} <b>${tr`${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}`}</b>`);
    if (manque.noyau) morceaux.push(`${tr`monte la Tour du Noyau au`} <b>${tr`niveau ${noyauRequis(cible)}`}</b> ${tr`pour les loger`}`);
    etape = `<strong>${tr`Pour ouvrir la Strate −${cible}`}</strong><small>${morceaux.join(', puis ').replace(/^./, (c) => c.toUpperCase())}.</small>`
      + (manque.creuseurs ? `<ul class="tr-sources">`
        // les naufragés du Port en ramènent un à coup sûr : la Tour le dit en premier (10 novembre 2026, compte rendu de partie : quatre fouilles pour un creuseur qu'une barque ramenait)
        + (auPort ? `<li>${ICO.ouvrier}<span>${tr`Naufragés, au Port`} <em>${tr`(1re barque du jour)`}</em></span><b>${tr`assuré`}</b></li>` : '')
        + `<li>${ICO.cristal}<span>${tr`Fouille ciblée`}</span><b>${Math.round(chanceCreuseurFouille(j.strate) * 100)} %</b></li>`
        + `<li>${ICO.porteurs}<span>${auPort ? tr`Autre mission en mer` : tr`Mission`}</span><b>${Math.round(CREUSEURS.missionCourte * 100)} à ${Math.round(CREUSEURS.missionLongue * 100)} %</b></li>`
        // les Épreuves n'ouvrent qu'après la Strate −EPREUVES_STRATE : on ne les cite qu'à partir de là (test critique du 4 novembre 2026)
        + (j.chambre && epreuvesOuvertes(j) ? `<li>${ICO.boost}<span>${tr`Épreuve`} <em>${tr`(1re victoire de la semaine)`}</em></span><b>${tr`assuré`}</b></li>` : '') + `</ul>` : '')
      + `<div class="tr-boutons">${auPort ? `<button type="button" class="btn prim" data-action="batiment" data-id="port">${ICO.ouvrier}${tr`Aller au Port`}</button>` : ''}${manque.creuseurs ? `<button type="button" class="btn ${auPort ? 'sec' : 'prim'}" data-action="fouiller-choix" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.cristal}${tr`Fouiller la Strate −${j.strate}`}</button>` : ''}`
      + `${manque.noyau ? `<button type="button" class="btn ${manque.creuseurs ? 'sec' : 'prim'}" data-action="batiment" data-id="noyau" data-amelio>${ICO.tour}${tr`Améliorer la Tour`}</button>` : ''}</div>`;
  } else if (j.frontVaincu && (finCreuse(j) ?? 0) > e.now) {
    // la creuse (12 novembre 2026) : un temps fixe et affiché, pendant lequel on joue à autre chose
    const fin = finCreuse(j)!, debut = j.creuseDebut ?? j.dernierTick;
    const gain = Math.round(100 * gainCreuseurs(j.creuseurs ?? 0));
    etape = `<strong>${tr`Les creuseurs percent la galerie vers la Strate −${cible}`}</strong>`
      + `<small>${tr`Ouverture dans`} <b>${decompte(fin, e.now)}</b>. ${j.creuseurs ? tr`${j.creuseurs} creuseur${j.creuseurs > 1 ? 's' : ''} au travail : la creuse va ${gain} % plus vite.` : ''}</small>`
      + `<div class="tr-creuse" aria-hidden="true">${jaugeTemps(debut, fin, e.now)}</div>`
      + `<small class="tr-creuse-aide">${tr`En attendant, renforce l’escouade : fouilles, missions en mer, niveaux des cartes. Des creuseurs en plus raccourcissent la creuse.`}</small>`
      + `<div class="tr-boutons"><button type="button" class="btn prim" data-action="fouiller-choix" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.cristal}${tr`Fouiller la Strate −${j.strate}`}</button>`
      + `${portOuvert(j) ? `<button type="button" class="btn sec" data-action="batiment" data-id="port">${ICO.ouvrier}${tr`Aller au Port`}</button>` : ''}</div>`;
  } else {
    etape = `<strong>${tr`La roche cède : la Strate −${cible} va s’ouvrir`}</strong><small>${tr`Tout est prêt. Descends pour découvrir le nouvel étage.`}</small>`
      + `<div class="tr-boutons"><button type="button" class="btn prim" data-action="descendre" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.descendre}${tr`Descendre`}</button></div>`;
  }
  if (j.expedition) h += `<button type="button" class="appel tr-reprendre" data-action="reprendre">${ICO.descendre}<span><strong>${tr`Expédition en cours`}</strong><small>${tr`Strate −${j.expedition.strate} : ${j.expedition.carte && j.expedition.phase === 'carte' ? tr('reprendre là où tu t’es arrêté') : tr('reprendre le combat')}`}</small></span></button>`;
  // une seule carte en tête (refonte du 25 octobre 2026) : le chapitre en cours (pourquoi on descend), puis ce qu'il faut faire
  const chap = j.chambre ? chapitreCampagne(contexteCampagne(j)) : null;
  const derniere = j.scenes?.at(-1);
  h += `<section class="tr-etape">`
    + (chap ? `<div class="tr-chapitre"><span class="surtitre">${echap(chap.sur)} · ${echap(chap.titre)}</span>`
      + (derniere ? `<button type="button" class="tr-revoir" data-action="scene-revoir" data-id="${derniere}" aria-label="${tr`Revoir la dernière scène`}">${ICO.film}${tr`Revoir`}</button>` : '')
      + `<p>${echap(chap.texte)}</p></div>` : '')
    + `<span class="surtitre tr-prochaine">${tr`Prochaine étape`}</span>${etape}</section>`;
  // avant le premier gardien (12 novembre 2026, audit du début) : la Tour n'a qu'une chose à dire, « Descendre à −1 ».
  // Fouiller, Explorer, Vestiges, étoiles, Rôdeurs, Grand Tableau et Épreuves arrivent une fois −1 vaincue.
  if (premiersPas(j)) {
    h += `</div></div>` + feuilleBatiment(e);
    return coquille(e, h, 'ecran-coupe tr');
  }
  h += blocAutour(e, off);
  // le Grand Tableau : ton rang en profondeur, et l'entrée vers les classements
  if (j.chambre && e.grand) h += bandeauTableau(e, e.grand, e.uid ?? null);

  // deux volets : les Strates et les Épreuves (les missions partent du Port depuis le 28 octobre 2026)
  const ouvert = j.chambre && epreuvesOuvertes(j);
  const volet = ouvert && e.ongletTour === 'epreuves' ? 'epreuves' : 'strates';
  if (ouvert) {
    const faites = epreuvesDeLaSemaine(e.now, j).filter((ep) => j.epreuves.faites.includes(ep.id)).length;
    const nEp = epreuvesDeLaSemaine(e.now, j).length;
    const seg = (id: typeof volet, nom: string, plus: string) =>
      `<button type="button" role="tab" class="seg${volet === id ? ' actif' : ''}" data-action="tour-volet" data-id="${id}" aria-selected="${volet === id}">${nom}<small>${plus}</small></button>`;
    h += `<div class="segments-choix deux tr-volets" role="tablist" aria-label="${tr`Strates ou Épreuves`}">`
      + seg('strates', tr('Strates'), tr`${j.strate} creusée${j.strate > 1 ? 's' : ''}`)
      + seg('epreuves', tr('Épreuves'), tr`${faites} / ${nEp} cette semaine`)
      + `</div>`;
  }
  if (volet === 'epreuves') h += htmlEpreuves(e);
  else h += htmlStrates(e, off, manque);
  if (j.chambre && !ouvert) h += `<p class="tr-note">${ICO.verrou}${tr`Les Épreuves de la semaine s’ouvrent quand le gardien de la Strate −${EPREUVES_STRATE} est vaincu : les Veilleurs ne mettent à l’épreuve que ceux qui ont passé le couloir muré.`}</p>`;
  h += `</div></div>` + feuilleBatiment(e) + feuilleVestiges(e);
  return coquille(e, h, 'ecran-coupe tr');
}

/** Les Vestiges d'une Strate (31 octobre 2026, explorer.ts) : ceux trouvés et leur ligne, ceux qui manquent ; relevée, son histoire */
function feuilleVestiges(e: EcranDistrict): string {
  const n = e.vestiges;
  if (!n) return '';
  const j = e.j;
  const tous = vestigesDe(n);
  const trouves = new Set(vestigesTrouves(j, n).map((v) => v.id));
  const r = releveDef(n);
  const fini = trouves.size >= tous.length;
  const fermer = `data-action="vestiges-voir" data-strate=""`;
  return `<div class="voile-feuille" ${fermer} aria-hidden="true"></div><section class="feuille vestiges-fiche" role="dialog" aria-modal="true" aria-labelledby="vs-titre">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`Strate −${n} · Vestiges ${trouves.size} / ${tous.length}`}</span><h2 id="vs-titre">${fini && r ? echap(r.titre) : tr('Ce que la Strate garde')}</h2></div>`
    + `<button type="button" class="btn-icone" ${fermer} aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + (fini ? '' : `<p class="aide">${tr`Les Vestiges ne se trouvent qu’en`} <b>${tr`explorant`}</b> ${tr`la Strate : ${n <= 5 ? 'deux' : 'trois'} par descente, marqués ${ICO.vestige} sur le plan, même dans le brouillard. Les cinq réunis, la Strate est complète : une carte au choix, et tes fouilles y verront tout le plan, avec un filon plus riche.`}</p>`)
    + `<ol class="vs-liste">` + tous.map((v) => (trouves.has(v.id)
      ? `<li class="trouve">${ICO.vestige}<p><b>${echap(v.nom)}</b>${echap(v.texte)}</p></li>`
      : `<li class="manque">${ICO.vestige}<p><b>${tr`Un Vestige à trouver`}</b>${tr`Quelque part dans la Strate −${n}.`}</p></li>`)).join('') + `</ol>`
    + (fini && r ? `<p class="vs-fin">${echap(r.fin)}</p>` : '')
    + `</div></section>`;
}

/** Le contenu d'une Strate (31 octobre 2026, strates.ts) : sa quête (●●○) et ses Haltes déjà vues, sur une ligne */
function contenuStrate(j: EcranDistrict['j'], n: number): string {
  const q = queteDef(n);
  const nh = nombreHaltes(n);
  if (!q && !nh) return '';
  // Explorer (31 octobre 2026) : les étoiles de la Strate, ses Vestiges (le losange ouvre leur histoire)
  const et = etoilesDe(j, n);
  const nv = vestigesTrouves(j, n).length;
  const explo = `<span class="tr-etoiles" title="${[1, 2, 3].map((k) => `${et.includes(k as 1) ? '★' : '☆'} ${ETOILES[k as 1].texte}`).join('\n')}" aria-label="${tr`${et.length} étoile${et.length > 1 ? 's' : ''} sur 3`}">${[1, 2, 3].map((k) => (et.includes(k as 1) ? ICO.etoile : ICO.etoileVide)).join('')}</span>`
    + (vestigesOuverts(j) && vestigesDe(n).length ? `<button type="button" class="tr-vestiges${nv >= 5 ? ' complet' : ''}" data-action="vestiges-voir" data-strate="${n}" aria-label="${tr`Vestiges : ${nv} sur 5`}">${ICO.vestige}${tr`Vestiges ${nv} / 5`}</button>` : '');
  const faites = j.quetes?.[n] ?? 0;
  const vues = Math.min(nh, j.haltes?.[n] ?? 0);
  return `<span class="tr-contenu">${explo}`
    + (q ? `<span class="tr-quete${faites >= q.etapes.length ? ' finie' : ''}" title="${echap(q.but)}">${ICO.quete}<b>${echap(q.nom)}</b><i class="tr-points">${q.etapes.map((_, k) => `<i${k < faites ? ' class="ok"' : ''}></i>`).join('')}</i></span>` : '')
    + (nh ? `<span class="tr-haltes" title="${tr`Haltes vues`}">${ICO.halte}${tr`Haltes ${vues} / ${nh}`}</span>` : '')
    + `</span>`;
}

/** Les Strates, de −1 à la roche : ce qu'on peut y faire, expliqué une fois en tête plutôt qu'à chaque ligne */
function htmlStrates(e: EcranDistrict, off: boolean, manque: ReturnType<typeof manquePourCreuser>): string {
  const j = e.j;
  const cible = j.strate + 1;
  const remuee = strateRemuee(j, e.now);
  let h = `<section class="tr-strates" aria-label="${tr`Les Strates`}">`
    + `<ul class="tr-legende"><li>${ICO.cristal}<span><b>${tr`Fouiller`}</b>${tr` : une descente courte, sans gardien, vers un filon (cartes, minerai ou Éclats).`}</span></li>`
    // les Vestiges et ce qui va avec ne sont nommés qu'une fois ouverts (après −2), comme le reste des nouveautés par Strate
    + `<li>${ICO.descendre}<span><b>${tr`Explorer`}</b>${vestigesOuverts(j) ? tr` : toute la Strate jusqu’à son gardien, éveillé s’il est déjà vaincu (meilleures cartes). Seul endroit où trouver les Vestiges, les étoiles et les Rôdeurs.` : tr` : toute la Strate jusqu’à son gardien, éveillé s’il est déjà vaincu (meilleures cartes).`}</span></li></ul>`
    + `<p class="tr-etoiles-total">${ICO.etoile}<b>${totalEtoiles(j)}</b> ${tr`étoile${totalEtoiles(j) > 1 ? 's' : ''}${prochainPalierEtoiles(j) ? tr` · prochaine récompense à ${prochainPalierEtoiles(j)!.etoiles} (une carte au choix, dont une en ${NOMS_RARETE[prochainPalierEtoiles(j)!.metal]})` : tr(' · toutes les récompenses sont prises')}`}</p><ol><li class="tr-sommet" aria-hidden="true"><img src="${decor('coupe')}" alt="" loading="lazy" decoding="async"><span>${tr`Surface · la Tour`}</span></li>`;
  for (let n = 1; n <= j.strate; n++) {
    const front = n === j.strate;
    const vaincue = !front || j.frontVaincu;
    const nom = NOMS_ETAGES[Math.min(n - 1, NOMS_ETAGES.length - 1)];
    const zone = zoneDe(n);
    const img = decorStrate(n);
    // sur téléphone, les étages déjà vaincus au-dessus de l'avant-dernier restent fins : on les déplie d'un toucher (10 novembre 2026)
    const fin = vaincue && n < j.strate - 1;
    const ouvert = e.etageOuvert === n;
    h += `<li class="tr-strate${front ? ' front' : ''}${vaincue ? ' vaincue' : ''}${fin ? ` fin${ouvert ? ' ouvert' : ''}` : ''}">`
      + (fin ? `<button type="button" class="tr-deplier" data-action="tr-etage" data-strate="${n}" aria-expanded="${ouvert}" aria-label="${ouvert ? tr`Replier la Strate −${n}` : tr`Déplier la Strate −${n}`}"></button>` : '')
      + `<span class="tr-vignette">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : ''}<b>−${n}</b></span>`
      + `<div class="tr-infos"><strong>${nom}</strong><small>${echap(zone.nom)}${vaincue ? tr` · ${ICO.ok}vaincue` : ` · <em>${tr`front : son gardien t’attend`}</em>`}</small>`
      + (remuee?.strate === n ? `<small class="tr-remuee">${ICO.strate}${tr`Remuée aujourd’hui`}${particularite(remuee.modele) ? ` : ${echap(particularite(remuee.modele)!.nom.charAt(0).toLowerCase() + particularite(remuee.modele)!.nom.slice(1))}` : ''}</small>` : '')
      + contenuStrate(j, n)
      + `<div class="tr-actions">${vaincue ? `<button type="button" class="btn sec" data-action="fouiller-choix" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.cristal}${tr`Fouiller`}</button>` : ''}`
      + `<button type="button" class="btn ${front && !j.frontVaincu ? 'prim' : 'sec'}" data-action="descendre" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.descendre}${tr`Explorer`}</button></div></div></li>`;
  }
  // la roche, tout en bas
  const requis = creuseursRequis(cible);
  const loge = logementCreuseurs(j);
  const logementBloque = !!manque?.noyau;
  h += `<li class="tr-strate roche${j.frontVaincu && !manque ? ' prete' : ''}"><span class="tr-vignette"><b>−${cible}</b></span><div class="tr-infos"><strong>${tr`Roche à creuser`}</strong>`
    + (requis ? `<span class="tr-creuseurs"><b>${Math.min(j.creuseurs, requis)} / ${requis}</b> ${tr`creuseurs`}</span><div class="tr-jauge"><i style="width:${Math.min(100, (100 * j.creuseurs) / requis)}%"></i></div>` : '')
    + `<small${!j.frontVaincu ? ' class="tr-ferme"' : ''}>${!j.frontVaincu ? tr`${ICO.verrou}S’ouvre après le gardien de la Strate −${j.strate}.` : manque ? tr('Il manque encore de quoi la percer : voir « Prochaine étape ».') : tr('Tout est prêt.')}</small>`
    + (logementBloque ? `<small class="tr-loge">${tr`La Tour loge ${loge} creuseurs au niveau ${j.batiments.noyau} : il faut de la place pour ${requis}.`}</small>` : '')
    + `</div></li></ol></section>`;
  return h;
}

// ---------- Le front de taille : les creuseurs ----------


// ---------- Épreuves de la semaine et missions ----------

function htmlEpreuves(e: EcranDistrict): string {
  const j = e.j;
  const st = strateEpreuve(j);
  const gardien = ennemiDef(zoneDe(st).boss).nom;
  let h = `<section class="bloc tr-volet"><p class="aide">${tr`Trois défis contre ${echap(gardien)} (Strate −${st}), chacun avec sa règle. Plus dur encore : la`} <b>${tr`Fêlée`}</b>${tr`, ennemis +${Math.round((FELEE.force - 1) * 100)} %, une carte de plus et ${FELEE.eclats} Éclats. ${decompte(lundiSuivant(e.now), e.now, tr('Nouvelles Épreuves lundi, dans '), '.')}`}</p><div class="epreuves">`;
  for (const ep of epreuvesDeLaSemaine(e.now, j)) {
    const faite = epreuveReussie(j, ep.id);
    const felee = epreuveReussie(j, ep.id, true);
    const gain = felee ? tr`${ICO.ok}Réussie, et en Fêlée` : faite ? tr`${ICO.ok}Réussie · la Fêlée t’attend` : tr`${ICO.cartes}1 carte au choix, argent au moins`;
    h += `<div class="epreuve${faite && felee ? ' faite' : ''}"><div><span class="ep-famille">${NOMS_FAMILLE[ep.famille]}</span><strong>${echap(ep.nom)}</strong><small>${echap(ep.regle)}</small>`
      + `<small class="gain${faite && !felee ? ' felee' : ''}">${gain}</small></div>`
      + `<button type="button" class="btn ${faite && felee ? 'sec' : 'prim'}" data-action="epreuve" data-id="${ep.id}"${j.expedition ? ' disabled' : ''}>${faite && felee ? tr('Rejouer') : tr('Tenter')}</button></div>`;
  }
  return h + `</div></section>`;
}

/** Ce qu'on affronte dans une Épreuve, en une phrase */
function formatEpreuve(ep: EpreuveDef, strate: number): string {
  const z = zoneDe(strate);
  const g = echap(ennemiDef(z.boss).nom);
  if (ep.imposee) return tr`Un combat contre ${echap(ennemiDef(zoneDe(1).boss).nom)}, à la même force pour tous : seule ton adresse compte.`;
  if (ep.enchainement) return tr`Trois combats d’affilée dans ${echap(z.nom)}, le dernier contre ${g}.`;
  if (ep.meute) return tr`Un combat contre ${g} et deux bêtes de ${echap(z.nom)}.`;
  return tr`Un seul combat, contre ${g}.`;
}

/** Le palier de l'Épreuve : normale, ou Fêlée */
function tuilePalier(j: Jeu, ep: EpreuveDef, felee: boolean, choisi: boolean, strate: number): string {
  const fait = epreuveReussie(j, ep.id, felee);
  const bref = fait ? tr('déjà réussie cette semaine') : felee ? tr`+${hausseFelee(ep)} % de force · 1 carte${strate >= FELEE.orDes ? tr(' en or') : ''} et ${FELEE.eclats} Éclats` : tr('1 carte au choix, argent au moins');
  return `<button type="button" role="radio" class="es-tuile${choisi ? ' actif' : ''}" style="--c:${felee ? 'var(--gold)' : '#8FB8DA'}" data-action="palier" data-id="${felee ? 'felee' : 'normale'}" aria-checked="${choisi}">`
    + `${felee ? ICO.cristal : ICO.boost}<strong>${felee ? tr('Fêlée') : tr('Épreuve')}</strong><small>${bref}</small></button>`;
}

/**
 * Une barque en mer (28 octobre 2026, Bryan : « cet écran gagnerait à être plus joli ») : la carte est une fenêtre sur le large,
 * le décor peint du lieu (ou, en attendant, la mer du district et ses piliers abandonnés), et la jauge est la route du passeur :
 * la barque quitte le port du district, accoste au lieu, y fouille, puis revient, son sillage derrière elle.
 */
function voyage(e: EcranDistrict, m: Jeu['missions'][number]): string {
  const p = porteurDef(m.porteur);
  const lieu = lieuMission(m);
  const lid = lieuIdMission(m);
  const i = Math.max(0, LIEUX_SLUGS.indexOf((lid ?? '') as typeof LIEUX_SLUGS[number]));
  const bm = lid ? bonusMission(e.j, m.porteur, lid) : null;
  const pct = bm ? Math.round((bm.mult - 1) * 100) : 0;
  const peint = decorLieu(i);
  const pil = PILIERS_LARGE[i % PILIERS_LARGE.length]!;
  const { x, phase } = etapeVoyage(m.debut, m.fin, e.now);
  const fond = peint ? `--decor:url(${peint})` : `--decor:url(${merLarge});--px:${pil.miroir ? 4000 - pil.x : pil.x};--mx:${pil.x};--my:${pil.y};--flip:${pil.miroir ? -1 : 1}`;
  const age = sceneDistrict(e.j.batiments.noyau).age;
  return `<div class="voyage ph-${phase}${peint ? ' peint' : ''}" style="--c:${COULEUR[p.lignee]};--x:${x.toFixed(4)};${fond}" data-vdebut="${m.debut}" data-vfin="${m.fin}">`
    + `<span class="vg-fond" aria-hidden="true"><i class="vg-pano"></i><i class="vg-reflets" style="--reflets:url(${reflets})"></i></span>`
    + `<div class="vg-tete">${avatar(p.id, 40)}<span class="vg-qui"><strong>${echap(p.nom)}</strong><small>${tr`${m.butin ? `<span class="vg-butin">${ICO[ICONE_BUTIN[m.butin]]}</span>` : ''}Vers ${echap(lieu)}${bm && pct ? ` · <span class="vg-af af-${bm.affinite}">${pct >= 0 ? '+' : '−'}${Math.abs(pct)} %</span>` : ''}`}</small></span>`
    + `<span class="vg-etat"><b data-phase>${NOM_PHASE[phase]}</b><small>${e.now >= m.fin ? tr('rentre au district') : decompte(m.fin, e.now, tr('retour dans '))}</small></span></div>`
    + `<div class="vg-route" role="img" aria-label="${tr`${NOM_PHASE[phase]}, vers ${echap(lieu)}`}">`
    + `<span class="vg-port"><img src="${vignetteDistrict(age)}" alt="" decoding="async" loading="lazy"></span>`
    + `<span class="vg-eau"><i class="vg-trace"></i><i class="vg-sillage"></i>`
    + `<span class="vg-barque">${BARQUE_PEINTE ? `<img src="${barque}" alt="" decoding="async">` : ''}<i class="vg-lampe"></i><i class="vg-reflet-lampe"></i></span></span>`
    + `<span class="vg-lieu"><i class="vg-onde"></i><i class="vg-onde"></i></span>`
    + `</div></div>`;
}

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const NOM_AFFINITE: Record<Affinite, string> = { bon: tr('Bon type'), neutre: tr('Neutre'), mauvais: tr('Mauvais type') };
const ICONE_BUTIN: Record<Butin, Icone> = { cargaison: 'composants', pierre: 'cartes', naufrages: 'ouvrier', eclats: 'eclats' };
const TEXTE_BUTIN: Record<Butin, string> = {
  cargaison: tr('Une cargaison oubliée : beaucoup de minerai, mais aucune pierre.'),
  pierre: tr('Une pierre attend quelqu’un : une carte à coup sûr, nouvelle ou en doublon (du cuivre possible en 8 h), mais peu de minerai.'),
  naufrages: tr('Des naufragés guettent une barque : la première du jour les ramène, et ils deviennent creuseurs (un à coup sûr, parfois deux en 8 h).'),
  eclats: tr('Des Éclats affleurent dans la ruine : un en 2 h, un ou deux en 8 h.'),
};
/** Ce que rapporterait une mission, pour son bouton : le butin principal en grand */
function gainMission(j: Jeu, id: string, d: Destination, duree: DureeMission, mult: number, now: number): { html: string; texte: string } {
  const pf = profondeurMission(j, d.cle, now);
  const rd = pf.mult;
  const coeur = pf.niveau === COEUR;
  const secours = secoursPossible(j, d, now);
  const c = composantsMission(j, id, d.lieu.id, duree, d.butin, undefined, rd, secours);
  // 3 novembre 2026 (Bryan : « les récompenses ne sont pas celles affichées ») : le bouton montre tout le butin,
  // composants compris, et le métal de la carte (fer en 2 h, cuivre en 8 h)
  const metal = duree === 'longue' ? 'cuivre' : 'fer';
  const nbCartes = (d.butin === 'pierre' ? 1 : 0) + (coeur ? 1 : 0);
  const carte = nbCartes ? `<i class="ds-g-carte m-${metal}">${ICO.cartes}+${nbCartes}</i>` : '';
  const compo = `<i>${ICO.composants}${c}</i>`;
  const tCartes = nbCartes ? tr`${nbCartes > 1 ? tr`deux cartes en ${metal}` : tr`une carte en ${metal}`} (${Math.round(chanceNouvelleMission(mult, duree) * 100)} % de chances qu’elle soit nouvelle, sinon un doublon)` : '';
  let extra = '';
  let tExtra = '';
  if (d.butin === 'naufrages' && secours) { const k = MISSIONS.butins.naufrages.creuseurs[duree]; extra = `<i>${ICO.ouvrier}${k > 1 ? '1+' : '1'}</i>`; tExtra = k > 1 ? tr('un creuseur, parfois deux') : tr('un creuseur'); }
  if (d.butin === 'eclats') { const k = virgule(Math.round(MISSIONS.butins.eclats.eclats[duree] * mult * rd * 10) / 10); extra = `<i>${ICO.eclats}${k}</i>`; tExtra = tr`environ ${k} Éclats`; }
  const texte = [tExtra, tCartes, tr`${c} minerai`].filter(Boolean).join(', ');
  return { html: extra + carte + compo, texte };
}

/** Les missions en mer (au Port depuis le 28 octobre 2026) : qui est en mer, les destinations du jour, qui part, et les derniers rapports */
export function htmlMissions(e: EcranDistrict): string {
  const j = e.j;
  // allégé le 4 novembre 2026 : une phrase, le reste se déplie ; la jauge de fouille attend le premier retour de barque
  const debutant = !(j.rapports ?? []).length;
  let h = `<section class="bloc tr-volet pl-missions">`
    + texteReplie(tr`Choisis une destination, puis le Porteur libre qui y part : il revient chargé, même jeu fermé. Chaque jour, le passeur connaît de 2 à 5 ruines et ce qu’on y trouvera (une cargaison, une pierre oubliée, des naufragés ou des Éclats). Plus tu retournes au même endroit, plus tu descends : la Surface, puis les Cales (+25 %), puis le Cœur de la ruine (+60 % et une carte en plus). Le bon Porteur au bon endroit rapporte plus (sa lignée, son niveau). Une barque ne coûte rien : seulement le temps du Porteur.`, 'missions', 'aide');
  if (j.missions.length) h += `<div class="voyages">${j.missions.map((m) => voyage(e, m)).join('')}</div>`;
  // secourir une famille (12 novembre 2026) : une mission comme les autres, en tête de liste
  h += blocSecours(e);

  // les destinations du jour : de 2 à 5, chacune avec son butin annoncé ; on y retourne autant qu'on veut (28 octobre 2026)
  const offre = destinationsDuJour(e.now);
  // sans choix, les naufragés d'abord tant qu'ils ramènent un creuseur (10 novembre 2026, audit : « Cargaison » était proposée par défaut)
  const choisie = offre.find((d) => d.cle === e.destination) ?? offre.find((d) => d.butin === 'naufrages' && secoursPossible(j, d, e.now)) ?? offre[0] ?? null;
  // deux jauges claires : la fouille de la destination choisie (Surface, Cales, Cœur), et les naufragés de la Strate
  const nf = naufragesDeLaStrate(j);
  const pf = choisie ? profondeurMission(j, choisie.cle, e.now) : { niveau: 0, mult: 1 };
  const PF = MISSIONS.profondeurs;
  // les crans de la fouille en barques peintes (12 novembre 2026) : allumées pour les passages faits, en or pour la prochaine
  const crans = PF.map((x, k) => `<img class="ds-barque ${pf.niveau === null || k < pf.niveau ? 'fait' : k === pf.niveau ? 'ici' : ''}" src="${barque}" alt="" title="${x.nom}" decoding="async">`).join('');
  h += `<div class="ds-jauges${debutant ? ' seule' : ''}">`
    + (debutant ? '' : `<div class="ds-jauge ds-fouille${pf.niveau === COEUR ? ' coeur' : ''}" title="${tr`Chaque barque vers la même destination descend plus profond : Surface, Cales, puis le Cœur et sa trouvaille.`}">${ICO.composants}<span><small>${tr`Prochaine fouille ici`}</small><strong>${pf.niveau === null ? tr('Ruine fouillée à fond') : `${PF[pf.niveau]!.nom}${pf.mult > 1 ? ` · +${Math.round((pf.mult - 1) * 100)} %` : ''}`}</strong><small class="ds-crans">${crans}${pf.niveau === null ? tr('butin plein, jusqu’à demain 4 h') : pf.niveau === COEUR ? tr('une carte en plus') : tr`Cœur dans ${COEUR - pf.niveau} barque${COEUR - pf.niveau > 1 ? 's' : ''}`}</small></span></div>`)
    + `<div class="ds-jauge${nf.restants ? '' : ' basse'}" title="${tr`Les naufragés ne fournissent qu’une partie des creuseurs de chaque Strate : le reste se gagne au front (gardien, fouilles, Épreuves).`}">${ICO.ouvrier}<span><small>${tr`Naufragés · Strate −${j.strate}`}</small><strong>${tr`${nf.ramenes} / ${nf.plafond} creuseur${nf.plafond > 1 ? 's' : ''}`}</strong>`
    // un creuseur peint par place : éclairé quand il est ramené (12 novembre 2026)
    + `<span class="ds-creuseurs" aria-hidden="true">${Array.from({ length: Math.min(8, Math.max(nf.plafond, nf.ramenes)) }, (_, k) => `<img class="${k < nf.ramenes ? 'la' : ''}" src="${baseIcones}ouvrier.webp" alt="" decoding="async">`).join('')}</span><small>${nf.restants ? tr`encore ${nf.restants} en mer` : tr('le reste se gagne au front')}</small></span></div>`
    + `</div>`;
  h += `<div class="ds-tete"><h3 class="titre-bloc">${icone('carte')}${tr`Destinations du jour`}</h3><small>${decompte(debutJour(jourDe(e.now) + 1), e.now, tr('Nouvelles dans '))}</small></div>`
    + `<div class="ds-lieux n${offre.length}" role="radiogroup" aria-label="${tr`Destinations du jour`}">`
    + offre.map((d) => {
      const l = d.lieu;
      const img = decorLieu(LIEUX_SLUGS.indexOf(l.id as typeof LIEUX_SLUGS[number]));
      const sel = choisie?.cle === d.cle;
      const enRoute = barquesVers(j, d);
      // des naufragés déjà recueillis aujourd'hui (ou plafond de la Strate atteint) : le lieu reste ouvert, pour ses composants
      const vide = d.butin === 'naufrages' && !secoursPossible(j, d, e.now);
      const niv = profondeurMission(j, d.cle, e.now).niveau;
      const etat = enRoute ? tr`${ICO.ok}${enRoute > 1 ? `${enRoute} barques` : tr('Barque')} en route` : vide ? tr('Plus de naufragés') : niv ? MISSIONS.profondeurs[niv]!.nom : niv === null ? tr('Fouillée à fond') : '';
      return `<button type="button" role="radio" aria-checked="${sel}" class="ds-lieu b-${d.butin}${sel ? ' choisi' : ''}${vide ? ' vide' : ''}" style="--c:${COULEUR[l.lignee]}${img ? `;--decor:url(${img})` : ''}" data-action="mission-lieu" data-id="${d.cle}">`
        + `<span class="ds-butin">${ICO[ICONE_BUTIN[d.butin]]}${NOM_BUTIN[d.butin]}</span>`
        + `<span class="ds-lignee">${NOM_LIGNEES[l.lignee]}</span><strong>${echap(majuscule(l.nom))}</strong>`
        + (etat ? `<span class="ds-prise">${etat}</span>` : '') + `</button>`;
    }).join('') + `</div>`;
  if (choisie) {
    const vide = choisie.butin === 'naufrages' && !secoursPossible(j, choisie, e.now);
    const coeurIci = pf.niveau === COEUR ? tr(' du minerai, et la trouvaille du Cœur : une carte en plus') : tr(' seulement du minerai');
    const texte = vide ? (nf.restants ? tr`Les naufragés d’ici ont déjà été recueillis aujourd’hui : une barque y trouvera${coeurIci}.` : tr`Les naufragés ont fourni leur part de creuseurs pour la Strate −${j.strate} : le reste se gagne au front. Une barque y trouvera${coeurIci}.`) : TEXTE_BUTIN[choisie.butin] + (pf.niveau === COEUR ? tr(' Au Cœur, une carte en plus.') : '');
    h += `<p class="ds-lore" style="--c:${COULEUR[choisie.lieu.lignee]}"><b>${echap(majuscule(choisie.lieu.nom))}.</b> ${echap(choisie.lieu.lore)} <em>${ICO[vide ? 'composants' : ICONE_BUTIN[choisie.butin]]}${texte}</em></p>`;
  }

  const libres = disponibles(j);
  if (!choisie) h += `<small class="aide">${tr`Aucune destination aujourd’hui : de nouvelles s’ouvrent demain à 4 h.`}</small>`;
  else if (j.missions.length >= barquesMax(j)) h += `<small class="aide">${tr`${barquesMax(j) > 1 ? tr`Tes ${barquesMax(j)} barques sont en mer` : tr('Ta barque est en mer')} : attends son retour${barquesMax(j) < BARQUES[BARQUES.length - 1]! ? tr(', ou monte la Tour du Noyau pour en armer une de plus') : ''}.`}</small>`;
  else if (!libres.length) h += `<small class="aide">${tr`Tous les Porteurs travaillent ou sont partis : libères-en un d’un bâtiment pour l’envoyer.`}</small>`;
  else {
    // le meilleur choix d'abord : affinité, puis niveau
    const rang = { bon: 0, neutre: 1, mauvais: 2 } as const;
    // les Porteurs de l'escouade en dernier (4 novembre 2026) : partis en mer, ils ne peuvent plus descendre
    const dansEscouade = escouadeDe(j);
    const tries = libres.map((id) => ({ id, b: bonusMission(j, id, choisie.lieu.id) })).sort((a, b) => Number(dansEscouade.includes(a.id)) - Number(dansEscouade.includes(b.id)) || rang[a.b.affinite] - rang[b.b.affinite] || b.b.niveau - a.b.niveau);
    h += `<ul class="missions-libres">`;
    for (const { id, b } of tries) {
      const p = porteurDef(id);
      const pct = Math.round((b.mult - 1) * 100);
      h += `<li class="af-${b.affinite}" style="--c:${COULEUR[p.lignee]}">${avatar(id, 36)}<span><strong>${echap(p.nom)}</strong><small>${tr`${NOM_LIGNEE[p.lignee]} · niv. ${b.niveau}`}</small>`
        + `<span class="ds-affinite">${NOM_AFFINITE[b.affinite]}${pct ? `<b>${pct > 0 ? '+' : '−'}${Math.abs(pct)} %</b>` : ''}</span></span>`
        + (['courte', 'longue'] as const).map((d) => {
          const g = gainMission(j, id, choisie, d, b.mult, e.now);
          return `<button type="button" class="btn sec mission-duree" data-action="mission" data-id="${id}" data-cle="${choisie.cle}" data-duree="${d}" aria-label="${tr`Mission de ${MISSIONS[d].heures} heures vers ${echap(choisie.lieu.nom)} : ${g.texte}`}"><span>${MISSIONS[d].heures} h</span><span class="ds-gain">${g.html}</span></button>`;
        }).join('') + `</li>`;
    }
    h += `</ul>`;
  }
  // les derniers rapports, à relire (le plus récent en haut)
  const lus = (j.rapports ?? []).filter((r) => r.lu).reverse();
  if (lus.length) {
    h += `<h3 class="titre-bloc rm-histo-titre">${icone('journal')}${tr`Derniers rapports`}</h3><div class="rm-histo">`;
    for (const r of lus) {
      const p = porteurDef(r.porteur);
      h += `<details class="rm-ligne" style="--c:${COULEUR[p.lignee]}"><summary>${avatar(r.porteur, 32)}<span><strong>${r.confiee ? tr`Escouade ${r.confiee.escouade + 1} · fouille confiée, Strate −${r.confiee.strate}` : `${echap(p.nom)} · ${echap(lieuMission(r))}`}</strong><small>${tr`+${r.composants} minerai${r.cartes.length ? tr` · ${r.cartes.length} carte${r.cartes.length > 1 ? 's' : ''}` : ''}${r.creuseurs ? tr` · +${r.creuseurs} creuseur${r.creuseurs > 1 ? 's' : ''}` : ''}`}</small></span></summary>`
        + `<div class="rm-recit">${r.recit.map((l) => `<p>${echap(l)}</p>`).join('')}</div>${gainsRapport(r)}</details>`;
    }
    h += `</div>`;
  }
  return h + `</section>`;
}

// ---------- Autour du front (12 novembre 2026) ----------

/**
 * Ce qu'il y a à faire d'autre que retenter le front ou refouiller la même Strate (12 novembre 2026, Bryan : « deux séances sur
 * trois se passent à refouiller du contenu déjà vaincu ») : la Strate remuée du jour, la fouille confiée, et la Flèche.
 * Trois lignes au plus, chacune avec son bouton ; rien tant que la Strate −3 n'est pas vaincue.
 */
function blocAutour(e: EcranDistrict, off: boolean): string {
  const j = e.j;
  const rem = strateRemuee(j, e.now);
  if (!rem) return '';
  const lignes: string[] = [];
  const p = particularite(rem.modele);
  lignes.push(`<li class="tr-autour-ligne${rem.faite ? ' faite' : ''}">${ICO.strate}<span><strong>${tr`Strate remuée du jour · −${rem.strate}`}</strong>`
    + `<small>${p ? `${echap(p.nom)} ${tr`(empruntée à −${rem.modele})`}. ` : ''}${rem.faite ? tr('Prime prise aujourd’hui.') : tr`Première sortie réussie : ${REMUEE.eclats} Éclats et une carte au choix.`}</small></span>`
    + `<button type="button" class="btn ${rem.faite ? 'sec' : 'prim'}" data-action="fouiller-choix" data-strate="${rem.strate}"${off ? ' disabled' : ''}>${tr`Y aller`}</button></li>`);
  if (j.confiee) {
    const f = j.confiee;
    lignes.push(`<li class="tr-autour-ligne en-cours">${ICO.porteurs}<span><strong>${tr`L’escouade ${f.escouade + 1} fouille seule la Strate −${f.strate}`}</strong>`
      + `<small>${tr`Retour dans`} <b>${decompte(f.fin, e.now)}</b></small><span class="jauge or" aria-hidden="true">${jaugeTemps(f.debut, f.fin, e.now)}</span></span></li>`);
  } else if (confieesOuvertes(j)) {
    lignes.push(`<li class="tr-autour-ligne">${ICO.porteurs}<span><strong>${tr`Fouille confiée`}</strong>`
      + `<small>${tr`Une escouade fouille seule une Strate vaincue (${CONFIEE.heures} h) pendant que tu joues avec une autre.`}</small></span>`
      + `<button type="button" class="btn sec" data-action="fouiller-choix" data-strate="${strateVaincue(j)}"${off ? ' disabled' : ''}>${tr('§fouille§Confier')}</button></li>`);
  }
  if (flecheOuverte(j)) {
    const f = etatFleche(j);
    const esc = escouadesDe(j)[escouadeActive(j)] ?? [];
    const c = esc.length === 3 ? Math.round(chanceQuai(forceEscouade(j, esc), f.quai) * 100) : null;
    // trop haut pour l'escouade (moins d'une chance sur cinq) : on le dit, plutôt que d'inviter à un combat perdu d'avance
    const tropHaut = c !== null && c < 20;
    lignes.push(`<li class="tr-autour-ligne${tropHaut ? ' faite' : ''}">${ICO.fleche}<span><strong>${tr`La Flèche · quai ${f.quai}`}</strong>`
      + `<small>${c === null ? tr('Un seul combat contre les gardiens des Hauts.') : tropHaut ? tr('Trop haut pour ton escouade pour l’instant : renforce-la d’abord.') : tr`Un seul combat : ${c} % de chances avec ton escouade.`}</small></span>`
      + `<button type="button" class="btn sec" data-action="fleche">${tropHaut ? tr('Voir') : tr('Monter')}</button></li>`);
  }
  const creuse = j.frontVaincu && (finCreuse(j) ?? 0) > e.now;
  return `<section class="tr-autour" aria-label="${tr`Autour du front`}"><span class="surtitre">${creuse ? tr('En attendant la galerie') : tr('Aujourd’hui en bas')}</span><ul>${lignes.join('')}</ul></section>`;
}

// ---------- Choix de l'escouade ----------

/** Les Fréquences d'une liste de cartes (une carte à plusieurs Fréquences compte pour chacune ; les cartes ∗ à part) */
export function frequencesDe(cartes: { f: number; fs?: number[]; effet?: { type: string } }[]): number[] {
  return Array.from({ length: 9 }, (_, i) => cartes.filter((g) => (g.fs ?? [g.f]).includes(i + 1) && !frequenceLibre(g.effet)).length);
}

/** La plus longue suite de Fréquences présentes (les cartes ∗ comblent des trous) */
export function plusLongueSuite(n: number[], jokers: number): number[] {
  let best: number[] = [];
  for (let a = 0; a < 9; a++) {
    let j = jokers; const suite: number[] = [];
    for (let i = a; i < 9; i++) {
      if (n[i]) suite.push(i + 1);
      else if (j > 0) { j--; suite.push(i + 1); } else break;
    }
    if (suite.length > best.length) best = suite;
  }
  return best;
}

// L'écran Escouade (revue du 22 octobre 2026, même équipe que la feuille de bâtiment) :
// d'abord ce qu'on part chercher, puis les trois Porteurs en grand sur la ligne de départ, ce que donne leur deck,
// puis les Porteurs disponibles. Plus de doublons (emplacements + grille + tuiles de deck) ; le deck trop maigre dit quoi faire.
/** Une tuile de cible de fouille : son icône, son nom, ce qu'elle rapporte en bref */
function tuileCible(c: CibleFouille, choisie: CibleFouille): string {
  const lignee = c === 'tech' || c === 'bio' || c === 'reso';
  const ico = lignee ? ICO.cartes : c === 'composants' ? ICO.composants : ICO.eclats;
  const bref = lignee ? tr('leurs cartes, et une au filon') : c === 'composants' ? tr('selon les combats gagnés') : tr('selon les combats gagnés');
  return `<button type="button" role="radio" class="es-tuile${choisie === c ? ' actif' : ''}${lignee ? ' carte' : ''}" style="--c:${lignee ? COULEUR[c] : c === 'eclats' ? 'var(--reso)' : '#8FB8DA'}" data-action="cible" data-id="${c}" aria-checked="${choisie === c}">`
    // le nom de la lignée seul sur les tuiles de cartes : « Cartes augmentées » était coupé sur téléphone (10 novembre 2026, audit)
    + `${ico}<strong>${echap(lignee ? NOM_LIGNEES[c] : CIBLES_FOUILLE[c].nom)}</strong><small>${bref}</small></button>`;
}

/**
 * Une tuile de difficulté de fouille (1er novembre 2026, Bryan : « facile, normal, difficile, des récompenses proportionnelles ») :
 * ce que la difficulté change, dit pour la cible choisie. Les chiffres viennent de DIFFICULTES_FOUILLE.
 */
function tuileNiveau(n: DifficulteFouille, choisi: DifficulteFouille, cible: CibleFouille): string {
  const d = DIFFICULTES_FOUILLE[n];
  const lignee = cible === 'tech' || cible === 'bio' || cible === 'reso';
  const force = d.force === 1 ? tr('ennemis normaux') : tr`ennemis ${d.force < 1 ? '−' : '+'}${Math.round(Math.abs(d.force - 1) * 100)} %`;
  const filon = lignee
    ? (d.carte < 1 ? tr`${Math.round(d.carte * 100)} % de chances d’une carte` : d.choix > 1 ? tr`${d.choix} cartes au choix, ${d.metal} au moins` : tr('1 carte assurée'))
    : tr`filon ×${decimal(d.gain)}`;
  const salles = d.rangs - 2;
  const coul = n === 'facile' ? '#8FD6A8' : n === 'normale' ? '#8FB8DA' : '#E79A72';
  return `<button type="button" role="radio" class="es-tuile${choisi === n ? ' actif' : ''}" style="--c:${coul}" data-action="niveau-fouille" data-id="${n}" aria-checked="${choisi === n}">`
    + `${n === 'facile' ? ICO.soin : n === 'normale' ? ICO.strate : ICO.boost}<strong>${d.nom}</strong><small>${tr`${salles} rangée${salles > 1 ? 's' : ''} · ${force}`}</small><small class="es-tuile-filon">${filon}</small></button>`;
}

/**
 * Prêt à descendre ? (12 novembre 2026, Bryan : la progression vient de la force du deck, et le joueur doit voir quand il est prêt.)
 * La force de l'escouade sur la force conseillée de la Strate (la même échelle que les pillages et la Flèche, ×100), un état en
 * trois mots, et ce qui la renforcerait tout de suite. Rien n'est interdit : on peut toujours tenter.
 */
function blocForce(j: Jeu, escouade: string[], strate: number): string {
  const p = pretAuFront(j, escouade, strate);
  const f = Math.round(p.force * 100), c = Math.round(p.conseillee * 100);
  const nom = p.etat === 'pret' ? tr('Prêt') : p.etat === 'jouable' ? tr('Jouable') : tr('Risqué');
  const conseils: string[] = [];
  if (p.etat !== 'pret') {
    if (p.fatigues.length) conseils.push(tr`${p.fatigues.map((id) => echap(porteurDef(id).nom)).join(', ')} ${p.fatigues.length > 1 ? tr('sont fatigués') : tr('est fatigué')} : la Clinique soigne l’Usure.`);
    if (p.aMonter.length) conseils.push(tr`${p.aMonter.length} carte${p.aMonter.length > 1 ? 's' : ''} de l’escouade ${p.aMonter.length > 1 ? tr('peuvent') : tr('peut')} monter d’un niveau.`);
    if (strate > 1) conseils.push(tr`Une fouille dans la Strate −${strate - 1} rapporte des cartes et des doublons.`);
  }
  return `<section class="es-force es-force-${p.etat}" aria-label="${tr`Force de l’escouade : ${f} sur ${c} conseillés, ${nom}`}">`
    + `<div class="es-force-tete"><span class="surtitre">${tr`Force de l’escouade`}</span><b class="es-force-etat">${nom}</b></div>`
    + `<div class="es-force-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((100 * f) / Math.max(1, c)))}%"></i></div>`
    + `<p class="es-force-chiffres"><b>${f}</b> ${tr`sur`} <b>${c}</b> ${tr`conseillés pour la Strate −${strate}`}</p>`
    + (conseils.length ? `<ul class="es-force-conseils">${conseils.map((x) => `<li>${x}</li>`).join('')}</ul>` : '')
    + `</section>`;
}

/** La Strate choisie est la Strate remuée du jour : ce qu'elle emprunte, et sa prime */
function noteRemuee(e: EcranDistrict): string {
  const rem = strateRemuee(e.j, e.now);
  if (!rem || rem.strate !== e.strateChoisie) return '';
  const p = particularite(rem.modele);
  return `<p class="es-remuee${rem.faite ? ' faite' : ''}">${ICO.strate}<span><strong>${tr`Strate remuée aujourd’hui`}</strong>`
    + `${p ? `${echap(p.nom)} : ${echap(p.texte.charAt(0).toLowerCase() + p.texte.slice(1))} ` : ''}`
    + `${rem.faite ? tr('La prime du jour est déjà prise.') : tr`Première sortie réussie du jour : ${REMUEE.eclats} Éclats et une carte au choix (pas en fouille facile).`}</span></p>`;
}

/** Confier la fouille à l'escouade choisie : ce qu'elle rapportera, et pourquoi elle ne peut pas partir s'il manque quelque chose */
function blocConfier(e: EcranDistrict, cible: CibleFouille): string {
  const j = e.j;
  if (j.confiee) {
    return `<section class="es-confier en-cours"><div class="es-confier-tete"><span class="surtitre">${tr`Fouille confiée`}</span><b>${decompte(j.confiee.fin, e.now)}</b></div>`
      + `<p>${tr`L’escouade ${j.confiee.escouade + 1} fouille déjà seule la Strate −${j.confiee.strate}. Une seule fouille confiée à la fois.`}</p></section>`;
  }
  const a = apercuConfiee(e.strateChoisie, cible);
  const r = e.escouade.length === 3 ? peutConfier(j, e.escouade, e.strateChoisie, cible) : { ok: false as const, message: tr('Choisis 3 Porteurs.') };
  const gains = [`<b>+${a.minerai}</b> ${tr`minerai`}`,
    ...(a.metal ? [`<b>${tr`une carte en ${NOMS_RARETE[a.metal].toLowerCase()}`}</b>`] : []),
    ...(a.eclats ? [`<b>${a.eclats > 1 ? tr`${a.eclats} Éclats` : tr('un Éclat')}</b>`] : []),
    `<b>+${a.xp} XP</b> ${tr`chacun`}`];
  return `<section class="es-confier"><div class="es-confier-tete"><span class="surtitre">${tr`Ou la confier à cette escouade`}</span><b>${a.heures} h</b></div>`
    + `<p>${tr`Elle part seule et rapporte`} ${gains.join(', ')}. ${tr`Pendant ce temps, tu joues avec une autre escouade. C’est moins qu’une fouille jouée : ni creuseur, ni prime de Strate remuée.`}</p>`
    + (r.ok ? '' : `<p class="es-confier-non">${ICO.verrou}<span>${echap(r.message ?? '')}</span></p>`)
    + `<button type="button" class="btn sec" data-action="confier-fouille"${r.ok ? '' : ' disabled'}>${ICO.porteurs}${tr`Confier la fouille (${a.heures} h)`}</button></section>`;
}

export function htmlEscouade(e: EcranDistrict): string {
  const j = e.j;
  const ep = e.epreuve ? epreuveDef(e.epreuve) ?? null : null;
  const fouille = ep ? null : e.fouille;
  // une fouille ne paie qu'un tiers du Râtelier (1er novembre 2026)
  // le prix des cartes du district : 30 min de Générateur pour explorer, 15 min pour une sortie courte (1er novembre 2026)
  const sortie: Sortie = fouille || ep || e.fleche || e.pillage ? 'courte' : 'explorer';
  const deck = deckEscouade(j, e.escouade, indiceEscouade(j, e.escouade), sortie).length;
  const deckMin = ep ? EPREUVE_DECK_MIN : DISTRICT.deckMin;
  const zone = zoneDe(e.strateChoisie);
  const fl = !ep && !fouille && e.fleche ? etatFleche(j) : null;
  const pi = !ep && !fouille && !fl ? e.pillage ?? null : null;
  const df = fl ? e.defi ?? null : null;
  const titre = df ? tr`FLÈCHE · DÉFI DU QUAI ${df.quai}` : fl ? tr`FLÈCHE · QUAI ${fl.quai}` : pi ? tr`PILLAGE · ${pi.nom.toUpperCase()}` : ep ? tr`ÉPREUVE · ${ep.nom.toUpperCase()}` : tr`${fouille ? tr('FOUILLE · ') : ''}STRATE −${e.strateChoisie} · ${NOMS_ETAGES[Math.min(e.strateChoisie - 1, NOMS_ETAGES.length - 1)]!.toUpperCase()}`;
  let h = `<div class="ecran ecran-escouade es"><main class="contenu">`
    + entete(titre, tr('Escouade'), `<button type="button" class="btn-icone" data-action="${fl ? 'fleche' : pi ? 'pillages' : 'coupe'}" aria-label="${tr`Retour`}">${ICO.retour}</button>`);

  // 1. ce qu'on part faire
  h += `<section class="es-mission">`;
  if (df) {
    // un défi (29 octobre 2026) : la garnison figée du directeur qui tient le quai
    const c = chanceVictoire(df.force / Math.max(0.01, forceEscouade(j, e.escouade)));
    const d = difficulte(c >= 0.85 ? 0.9 : c >= 0.5 ? 1 : c >= 0.15 ? 1.05 : 1.2);
    h += `<p class="es-but">${ICO.bouclier}<span><strong>${tr`Défi · quai ${df.quai}`}</strong>${tr`Un seul combat contre l’escouade de ${echap(df.nom)}. Gagné, le quai est à toi ; perdu, ta montée ne bouge pas.`}</span></p>`
      + `<div class="es-pillage d${d.niveau}"><span class="es-pillage-visages">${df.porteurs.map((id) => avatar(id, 34)).join('')}</span>`
      + `<span><b>${d.nom}</b><small>${e.escouade.length === 3 ? tr`${Math.round(c * 100)} % de chances avec cette escouade` : tr('Choisis 3 Porteurs')}</small></span>`
      + `<span class="es-pillage-butin">${ICO.bouclier}<b>${df.quai}</b></span></div>`;
  } else if (fl) {
    // le quai suivant : ses gardiens, et les chances de l'escouade choisie (elles changent avec l'escouade)
    const g = gardiensQuai(fl.quai);
    const c = chanceQuai(forceEscouade(j, e.escouade), fl.quai);
    const d = difficulte(c >= 0.85 ? 0.9 : c >= 0.5 ? 1 : c >= 0.15 ? 1.05 : 1.2);
    h += `<p class="es-but">${ICO.fleche}<span><strong>${tr`La Flèche · quai ${fl.quai}`}</strong>${tr`Un seul combat contre les gardiens des Hauts : ${g.map((id) => echap(ennemiDef(id).nom)).join(', ')}.`}</span></p>`
      + `<div class="es-pillage d${d.niveau}"><span class="es-pillage-visages">${g.map((id) => visageGarde(id, 34)).join('')}</span>`
      + `<span><b>${d.nom}</b><small>${e.escouade.length === 3 ? tr`${Math.round(c * 100)} % de chances avec cette escouade` : tr('Choisis 3 Porteurs')}</small></span>`
      + `<span class="es-pillage-butin">${ICO.monter}<b>${Math.min(FLECHE.quais, fl.quai + pas(fl.quai))}</b></span></div>`;
  } else if (pi) {
    // la cible : sa garnison, et les chances de l'escouade choisie (elles changent avec l'escouade)
    const ecart = pi.force / Math.max(0.01, forceEscouade(j, e.escouade));
    const d = difficulte(ecart);
    const b = butinPillage(pi, ecart);
    h += `<p class="es-but">${ICO.grappin}<span><strong>${tr`Pillage · ${echap(pi.nom)}`}</strong>${tr`Un seul combat contre sa garnison : ${gardesGarnison(pi.porteurs).map((g) => echap(g.nom)).join(', ')}.`}</span></p>`
      + `<div class="es-pillage d${d.niveau}"><span class="es-pillage-visages">${gardesGarnison(pi.porteurs).map((g) => avatarGarde(g, 34)).join('')}</span>`
      + `<span><b>${d.nom}</b><small>${e.escouade.length === 3 ? tr`${Math.round(chanceVictoire(ecart) * 100)} % de chances avec cette escouade` : tr('Choisis 3 Porteurs')}</small></span>`
      + `<span class="es-pillage-butin">${ICO.composants}<b>+${ent(b.base + b.vol)}</b></span></div>`;
  } else if (ep) {
    h += `<p class="es-but">${ICO.boost}<span><strong>${echap(ep.nom)}</strong>${echap(ep.regle)} ${formatEpreuve(ep, e.strateChoisie)}</span></p>`
      + `<div class="es-cibles-grille es-paliers" role="radiogroup" aria-label="${tr`Palier de l’Épreuve`}">${tuilePalier(j, ep, false, !e.felee, e.strateChoisie)}${tuilePalier(j, ep, true, !!e.felee, e.strateChoisie)}</div>`;
  } else if (fouille) {
    h += `<p class="es-but">${ICO.cristal}<span><strong>${tr`Fouille ciblée · ${echap(zone.nom)}`}</strong>${tr`Une descente courte, sans gardien : quelques salles, puis le filon.`}</span></p>`
      // ce que l'on cherche : des tuiles toujours visibles, en deux groupes (24 octobre 2026 : la fouille de cartes passait inaperçue,
      // cachée au bout d'une rangée qui défilait et commençait sur « Composants »)
      + `<h3 class="es-cibles-titre">${tr`Que cherches-tu ?`}</h3>`
      + `<div class="es-cibles-grille" role="radiogroup" aria-label="${tr`Ce que tu cherches`}">`
      + (['tech', 'bio', 'reso'] as CibleFouille[]).map((c) => tuileCible(c, fouille)).join('')
      + (['composants', 'eclats'] as CibleFouille[]).map((c) => tuileCible(c, fouille)).join('') + `</div>`
      + `<p class="es-cible-texte">${echap(CIBLES_FOUILLE[fouille].texte)}</p>`
      + `<h3 class="es-cibles-titre">${tr`Difficulté`}</h3>`
      + `<div class="es-cibles-grille es-niveaux" role="radiogroup" aria-label="${tr`Difficulté de la fouille`}">`
      + (Object.keys(DIFFICULTES_FOUILLE) as DifficulteFouille[]).map((n) => tuileNiveau(n, e.niveauFouille ?? 'normale', fouille)).join('') + `</div>`
      + noteRemuee(e);
  } else {
    h += `<p class="es-but">${ICO.strate}<span><strong>${echap(zone.nom)}</strong>${tr`Une carte à explorer salle par salle : combats, caches, rencontres, campement, puis le gardien : ${echap(ennemiDef(zone.boss).nom)}.`}</span></p>`
      + noteRemuee(e);
  }
  h += `</section>`;

  // « Les recrues » (31 octobre 2026) : l'escouade est imposée, rien à composer ; trois portraits et on part
  if (ep?.imposee) {
    const ids = Object.keys(ESCOUADE_RECRUES);
    h += `<section class="es-trio" aria-label="${tr`Escouade imposée`}">` + ids.map((id) => {
      const p = porteurDef(id);
      const img = portrait(id);
      return `<div class="es-place" style="--c:${COULEUR[p.lignee]}"><span class="es-portrait">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 72)}`
        + `<span class="es-nom"><strong>${echap(p.nom)}</strong><small>${tr`${NOM_LIGNEE[p.lignee]} · PV ${p.pvMax}`}</small></span></span>`
        + `<span class="es-cartes pleine">${ICO.cartes}<span>${tr`${ESCOUADE_RECRUES[id]!.length} cartes de départ`}</span></span></div>`;
    }).join('') + `</section>`
      + `<p class="es-note">${ICO.soin}${tr`Un exercice : niveau 1, cartes en fer, ni Usure ni poste quitté.`}</p></main>`
      + `<footer class="pied-fixe es-pied"><div class="es-pied-info"><span class="es-avatars">${ids.map((id) => avatar(id, 30)).join('')}</span>`
      + `<span><b>${tr`Imposée`}</b><small class="ok">${tr`prête`}</small></span></div>`
      + `<button type="button" class="btn prim large" data-action="partir"${j.expedition ? ' disabled' : ''}>${ICO.boost}${e.felee ? tr('Tenter la Fêlée') : tr('Tenter l’Épreuve')}</button></footer>`;
    h += e.message ? `<button type="button" class="toast seul" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(e.message)}</span></button>` : '';
    return h + `</div>`;
  }

  // 2. quelle escouade part (25 octobre 2026) : on choisit une des trois escouades composées dans l'onglet Escouade,
  // on ne compose plus ici (la grille de tous les Porteurs prenait l'écran)
  const toutes = escouadesDe(j);
  const active = escouadeActive(j);
  h += `<section class="es-equipes" aria-label="${tr`Escouade qui part`}"><div class="es-equipes-tete"><span class="surtitre">${toutes.length > 1 ? tr('Quelle escouade part ?') : tr('L’escouade qui part')}</span>`
    + `<button type="button" class="es-modifier" data-action="escouade-modifier">${ICO.porteurs}${tr`Modifier`}</button></div>`
    + `<div class="es-equipes-choix" role="radiogroup" aria-label="${tr`Escouade qui part`}">`
    + toutes.map((l, k) => {
      const n = deckEscouade(j, l).length;
      return `<button type="button" role="radio" class="es-equipe${k === active ? ' actif' : ''}${l.length ? '' : ' vide'}" data-action="depart-escouade" data-index="${k}" aria-checked="${k === active}"${l.length ? '' : ' disabled'}>`
        + `<strong>${tr`Escouade ${k + 1}`}</strong>${l.length ? `<span class="es-equipe-visages">${[0, 1, 2].map((i) => (l[i] ? avatar(l[i]!, 30) : '<i class="es-pastille-vide"></i>')).join('')}</span>` : '<span class="esc-serti" aria-hidden="true"></span>'}`
        + `<small>${l.length ? `${l.length < 3 ? `${l.length} / 3 · ` : ''}${tr`${n} cartes`}` : tr('À former')}</small></button>`;
    }).join('') + `</div></section>`;

  // les trois Porteurs qui partent : toucher un portrait ouvre sa fiche
  h += `<section class="es-trio" aria-label="${tr`Porteurs qui partent`}">` + [0, 1, 2].map((i) => {
    const id = e.escouade[i];
    if (!id) return `<button type="button" class="es-place vide" data-action="escouade-modifier"><span class="es-silhouette" aria-hidden="true"></span><b>${i + 1}</b><small>${tr`Place libre · compléter l’escouade`}</small></button>`;
    const p = porteurDef(id);
    const img = portrait(id);
    const nCartes = j.porteurs[id]!.modules.length;
    // les Marques (0 / 30 expéditions…) attendent le premier gardien vaincu
    const m = premiersPas(j) ? null : progresMarque(j, id);
    const pv = pvMaxCombat(j, id);
    const blesse = !!tropBlesse(j, id);
    return `<div class="es-place${blesse ? ' blesse' : ''}" style="--c:${COULEUR[p.lignee]}">`
      + `<button type="button" class="es-portrait" data-action="porteur" data-id="${id}" aria-label="${tr`Fiche ${echap(deNom(p.nom))}`}">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 72)}`
      + `<span class="es-nom"><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]} · ${blesse ? `<b class="es-pv-bas">${tr`PV ${pv} → ${pvMinDepart(j, id)}`}</b>` : `PV ${pv}`}</small></span></button>`
      + `<button type="button" class="es-cartes${nCartes ? '' : ' aucune'}${nCartes >= DISTRICT.cartesMax ? ' pleine' : ''}" data-action="deck" data-id="${id}">${ICO.cartes}<span>${tr`${nCartes} / ${DISTRICT.cartesMax} cartes`}</span></button>`
      + (m ? `<button type="button" class="es-marque${m.acquise ? ' acquise' : ''}" data-action="porteur" data-id="${id}" title="${echap(m.texte)}">${m.acquise ? ICO.ok : ICO.verrou}<span><b>${echap(m.nom)}</b> ${m.acquise ? echap(m.courtEffectif) : `${Math.min(m.n, m.seuil)} / ${m.seuil} ${echap(m.quoi)}`}</span></button>` : '')
      + (posteQuitte(j, id) ? `<span class="es-quitte">${ICO.ouvrier}<span>${echap(textePosteQuitte(j, id)!)}</span></span>` : '')
      + `</div>`;
  }).join('') + `</section>`;

  // la fouille confiée (12 novembre 2026) : la même fouille, sans la jouer, par l'escouade choisie ci-dessus
  if (fouille && confieesOuvertes(j)) h += blocConfier(e, fouille);

  // la force de l'escouade face à la Strate (12 novembre 2026) : on voit avant de partir si on est prêt, et quoi faire sinon
  if (!ep && !fouille && !fl && !pi && e.escouade.length === 3) h += blocForce(j, e.escouade, e.strateChoisie);

  // 3. ce que donne leur deck
  const maigre = e.escouade.length === 3 && deck < deckMin;
  // au premier départ, ni histogramme ni Râtelier : l'escouade, sa force et « Partir » (audit du 12 novembre 2026). L'alerte d'un deck trop maigre reste
  if (e.escouade.length && (!premiersPas(j) || maigre)) {
    const cartes = deckEscouade(j, e.escouade, indiceEscouade(j, e.escouade), sortie);
    const n = frequencesDe(cartes);
    const jokers = cartes.filter((g) => g.effet?.type === 'accord').length;
    const suite = plusLongueSuite(n, jokers);
    h += `<section class="es-deck" aria-label="${tr`Le deck de l’escouade`}"><div class="es-deck-tete"><span class="surtitre">${tr`Le deck · ${deck} cartes`}</span>${lienGuide('deck', tr('Bien construire son deck'))}</div>`
      // la même échelle de cristaux que l'onglet Escouade (30 octobre 2026)
      + `<div class="eq-freqs es-freq" role="img" aria-label="${tr`Fréquences du deck : ${n.map((k, i) => `${i + 1} : ${k}`).join(', ')}`}">`
      + n.map((k, i) => `<span class="eq-col${k ? '' : ' trou'}${suite.includes(i + 1) ? ' suite' : ''}" style="--fc:${couleurFrequence(i + 1)};--n:${Math.min(1, k / Math.max(1, ...n))}"><b class="eq-cristal">${i + 1}</b><small>${k ? `×${k}` : '—'}</small></span>`).join('')
      + `</div><p class="es-freq-aide">${tr`Des chiffres qui se suivent font des Résonances${suite.length >= 2 ? ` ${tr`: ta plus longue suite va de`} <b>${tr`${suite[0]} à ${suite[suite.length - 1]}`}</b>` : ''}. Un chiffre absent coupe la suite${jokers ? tr` · ${jokers} carte${jokers > 1 ? 's' : ''} ∗ comble${jokers > 1 ? 'nt' : ''} n’importe quel trou` : ''}.`}</p>`;
    h += departRatelier(j, indiceEscouade(j, e.escouade), sortie);
    if (maigre) {
      const aRemplir = e.escouade.filter((id) => j.porteurs[id]!.modules.length < DISTRICT.cartesMax);
      const cible = aRemplir.sort((x, y) => j.porteurs[x]!.modules.length - j.porteurs[y]!.modules.length)[0];
      h += `<div class="es-alerte">${ICO.cartes}<span><strong>${tr`Il manque ${deckMin - deck} carte${deckMin - deck > 1 ? 's' : ''}`}</strong> ${tr`(${deckMin} au moins).`} `
        + `${aRemplir.length ? tr`Confie des cartes à ${aRemplir.map((id) => `${echap(porteurDef(id).nom)} (${j.porteurs[id]!.modules.length}/${DISTRICT.cartesMax})`).join(', ')}.` : tr('Choisis des Porteurs qui portent plus de cartes.')}</span>`
        + (cible ? `<button type="button" class="btn sec" data-action="deck" data-id="${cible}">${tr`Confier`}</button>` : '') + `</div>`;
    }
    h += `</section>`;
  }

  const vacants = e.escouade.filter((id) => posteQuitte(j, id));
  if (vacants.length) {
    const et = (l: string[]) => l.length > 1 ? tr`${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}` : l[0]!;
    const lieux = vacants.map((id) => posteQuitte(j, id) === 'noyau' ? tr('l’entraînement à la Tour') : batimentDef(posteQuitte(j, id)!).nom);
    const pl = vacants.length > 1;
    h += `<p class="es-note es-note-poste">${ICO.ouvrier}<span>${(() => {
      const qui = et(vacants.map((id) => `<b>${echap(porteurDef(id).nom)}</b>`)), ou = et(lieux);
      if (pl) return lieux.length > 1 ? tr`Au départ, ${qui} quittent leur poste : ${ou} resteront sans Porteur jusqu’à ce que tu y remettes quelqu’un.` : tr`Au départ, ${qui} quittent leur poste : ${ou} restera sans Porteur jusqu’à ce que tu y remettes quelqu’un.`;
      return lieux.length > 1 ? tr`Au départ, ${qui} quitte son poste : ${ou} resteront sans Porteur jusqu’à ce que tu y remettes quelqu’un.` : tr`Au départ, ${qui} quitte son poste : ${ou} restera sans Porteur jusqu’à ce que tu y remettes quelqu’un.`;
    })()}</span></p>`;
  }
  // trop blessés pour repartir (3 novembre 2026 : l'écran disait « prêt » et le refus n'arrivait qu'en touchant Partir)
  const blesses = e.escouade.filter((id) => tropBlesse(j, id));
  if (blesses.length) {
    const soin = Math.max(0.1, soinParHeure(j));
    const heures = Math.max(...blesses.map((id) => (pvMinDepart(j, id) - pvMaxCombat(j, id)) / soin));
    const attente = heures < 1 ? `${Math.max(1, Math.ceil(heures * 60))} min` : `${Math.floor(heures)} h ${String(Math.ceil((heures % 1) * 60) % 60).padStart(2, '0')}`;
    const noms = blesses.map((id) => `<b>${echap(porteurDef(id).nom)}</b>`);
    h += `<div class="es-alerte es-blesses">${ICO.soin}<span><strong>${tr`${blesses.length > 1 ? tr`${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]} se remettent` : tr`${noms[0]} se remet`} à la Clinique`}</strong>`
      + `${tr`Il faut au moins un quart de ${blesses.length > 1 ? tr('§pv§leurs') : tr('§pv§ses')} PV pour redescendre : encore ${attente} environ au rythme actuel. Poste une recrue Géné à la Clinique pour aller plus vite, ou ${j.soinOffert ? tr('paie des soins intensifs') : `<b>${tr`profite des premiers soins intensifs, offerts`}</b>`}.`}</span>`
      + `<button type="button" class="btn sec" data-action="depart-clinique">${tr`Clinique`}</button></div>`;
  }
  h += `<p class="es-note">${ICO.soin}${tr`Après l’expédition, chacun gagne de l’Usure : la Clinique la soigne pendant qu’il se repose.`}</p></main>`;

  const pret = e.escouade.length === 3 && !maigre && !blesses.length;
  // l'énergie des cartes du Râtelier, rappelée sur le bouton (31 octobre 2026, Luc)
  const coutDepart = e.escouade.length ? (ratelierPayable(j, indiceEscouade(j, e.escouade), sortie).length ? coutRatelier(j, sortie, indiceEscouade(j, e.escouade)) : 0) : 0;
  h += `<footer class="pied-fixe es-pied"><div class="es-pied-info"><span class="es-avatars">${[0, 1, 2].map((i) => e.escouade[i] ? avatar(e.escouade[i]!, 30) : '<i class="es-pastille-vide"></i>').join('')}</span>`
    + `<span><b>${e.escouade.length} / 3</b><small class="${maigre || blesses.length ? 'alerte' : e.escouade.length === 3 ? 'ok' : ''}">${e.escouade.length < 3 ? tr`Encore ${3 - e.escouade.length} Porteur${3 - e.escouade.length > 1 ? 's' : ''}` : maigre ? tr`${deck} cartes · ${deckMin} au moins` : blesses.length ? tr`${blesses.length} blessé${blesses.length > 1 ? 's' : ''} · au repos` : tr`${deck} cartes, prêt`}</small></span></div>`
    + `<button type="button" class="btn prim large" data-action="partir"${pret ? '' : ' disabled'}>${fl ? `${ICO.monter}${tr('Monter')}` : pi ? `${ICO.grappin}${tr('Piller')}` : ep ? `${ICO.boost}${e.felee ? tr('Tenter la Fêlée') : tr('Tenter l’Épreuve')}` : fouille ? `${ICO.cristal}${tr('Fouiller')}` : `${ICO.descendre}${tr('Partir')}`}${coutDepart ? `<span class="es-btn-cout">${ICO.energie}−${ent(coutDepart)}</span>` : ''}</button></footer>`;
  h += e.guide ? feuilleGuide(e.guide, trouveesDe(j.collection)) : e.deck ? feuilleDeck(e) : e.carte ? feuilleCarte(e) : feuillePorteur(e);
  h += e.message ? `<button type="button" class="toast seul" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(e.message)}</span></button>` : '';
  return h + `</div>`;
}

export { POSTES };
