// Écrans du district : l'archipel (accueil), la Tour du Noyau en coupe, l'escouade, les cartes, le Codex.
// Le district est un tableau Midjourney par âge (public/art/district/age-N), l'âge suit la Tour du Noyau ;
// les plaques cliquables des bâtiments sont posées dessus, le détail s'ouvre en feuille par le bas.

import { portOuvert } from './pillages';
import { PILLAGE, butinPillage, chanceVictoire, difficulte, etatPillage, forceEscouade, majJetons } from '../core/jeu';
import { NOMS_EFFET, texteEffet } from '../core/effets';
import { GESTES_SPECIAUX, MODULES, ORIGINE_PAQUETAGE, PORTEURS, ZONES as ZONES_STRATES, batimentDef, carteId, ennemiDef, moduleDe, moduleDef, porteurDef, zoneDe } from '../core/donnees';
import {
  contexteCampagne,
  OBJECTIFS, escouadeActive, escouadesDe, strateVaincue, ARCHIVE, CONFIANCE, CIBLES_FOUILLE, CREUSEURS, creuseursRequis, logementCreuseurs, manquePourCreuser, noyauRequis, DISTRICT, EPREUVE_DECK_MIN, MISSIONS, POSTES, QUOTIDIENS, epreuveDef, epreuvesDeLaSemaine, strateEpreuve, strateMission, chantierDe, chantiersMax, coutAmelioration, coutRefabrication, disponibles, dureeChantier, dureeFabrication, energieParHeure, enExpedition, deckEscouade, gestesDe, greffesDe, lundiSuivant, objectifCourant, porteursPresents, posteDe, posteQuitte, textePosteQuitte, colisDisponible, colisAvantChoix, RAVITAILLEMENT, pvMaxCombat, quotidienActif, quotidienFait, soinParHeure, stockage, type Jeu, type Poste, DECISIONS, decisionEnAttente, humeurDistrict, jourDe, progresMarque, type Acte, niveauPorteur, pvNiveau, gainsAmelioration, type GainNiveau,
  COMPTOIR, prixComptoir, plafondEntrainement, xpEntrainement, energieEntrainement, debutJour
} from '../core/jeu';
import { COLLECTION, NOMS_RARETE, RARETES, TRIS, composantsNiveau, doublonsRequis, multNiveau, trierCartes, type TriCartes } from '../core/collection';
import type { BatimentId, Lignee, ModuleDef, Rarete } from '../core/types';
import type { CibleFouille } from '../core/expedition';
import { FRAGMENTS } from '../core/fragments';
import { RANG_METAL, loreCarte } from '../core/lore-cartes';
import { rumeurDuJour } from '../core/rumeurs';
import { CHAPITRES, LIVRES, chapitreDef, chapitreOuvert } from '../core/chroniques';
import { chapitreCampagne } from '../core/campagne';
import { htmlListeScenes } from './campagne';
import { COULEUR } from './vue';
import { decor, decorStrate, illustrationBatiment, portrait, prochainVisuel, reflets, sceneDistrict, visuel, portraitYse, salleEntrainement } from './art';
import { COULEUR_RARETE, faceCarte, couleurFrequence } from './carte';
import { feuilleGuide, lienGuide, trouveesDe } from './guide';
import { feuillePorteur } from './porteurs';
import { bandeauTableau } from './classements';
import { ICO, icone, type Icone } from './icones';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, couts, decompte, duree, jaugeTemps, ent, entete, prix, voletsEscouade, type EcranDistrict, type Filtre } from './coquille';

import { echap, mouvementReduit, virgule } from './outils';

export type { EcranDistrict, Vue } from './coquille';

export { COULEUR_RARETE };

const gemme = (r: Rarete) => `<i class="gemme g-${r}" style="--r:${COULEUR_RARETE[r]}" title="${NOMS_RARETE[r]}" aria-hidden="true"></i>`;

// ---------- L'archipel ----------

/**
 * Les lieux de l'archipel (tableaux à 7 bâtiments, 23 octobre 2026) : les 5 bâtiments du jeu, et 2 lieux déjà peints
 * qui ouvriront plus tard (le Port et le Labo génétique). Bryan : pas de voile sur eux, le tableau reste beau partout ;
 * quand on les touche, une raison plausible, dans le lore, dit pourquoi ils ne sont pas encore ouverts.
 */
type LieuFutur = 'port' | 'labo';
type Lieu = BatimentId | LieuFutur;
const LIEUX_FUTURS: Record<LieuFutur, { nom: string; raison: string; promesse: string }> = {
  port: {
    nom: 'Port',
    raison: 'Le vieux bateau reste amarré au ponton : tant que le gardien de la Strate −1 tient le puits, personne ne laisse le district sans défense pour prendre la mer.',
    promesse: 'Le passage sûr, des équipages partiront d’ici vers les autres piliers, piller les archipels voisins.',
  },
  labo: {
    nom: 'Labo génétique',
    raison: 'Les cuves d’ambre sont vides. Pour les rallumer, il faudrait de l’ambre vivant, et on n’en trouve qu’au fond des Strates.',
    promesse: 'Les Génés du quartier y tailleront un jour de nouvelles greffes.',
  },
};
/**
 * Le Comptoir est déjà peint sur le tableau : tant qu'il n'est pas « construit » (niveau 0), on le dit fermé, avec une raison
 * tirée du lore, comme le port et le labo (23 octobre 2026, Bryan). Le construire, c'est le remettre en état.
 */
const COMPTOIR_FERME = 'Ses volets sont cloués depuis que le dernier marchand a quitté le district, et la balance a rouillé sur le comptoir. Les fouilleurs remontent des Strates les poches pleines, mais personne n’est là pour leur racheter quoi que ce soit.';
const estFutur = (id: string | null): id is LieuFutur => id === 'port' || id === 'labo';

/**
 * Où se trouve chaque plaque dans le tableau de chaque âge (repère 400 × 600, haut de la plaque) : dans l'eau, au pied de
 * son îlot, pour ne jamais cacher le bâtiment lui-même (Bryan : les bâtiments doivent se voir et se distinguer).
 */
const PLAQUES_234: Record<Lieu, { x: number; y: number }> = {
  noyau: { x: 200, y: 312 }, generateur: { x: 64, y: 184 }, forge: { x: 322, y: 228 }, clinique: { x: 62, y: 304 },
  comptoir: { x: 322, y: 382 }, labo: { x: 112, y: 538 }, port: { x: 326, y: 556 },
};
const LIEUX: Record<1 | 2 | 3 | 4, Record<Lieu, { x: number; y: number }>> = {
  1: { ...PLAQUES_234, noyau: { x: 196, y: 312 }, generateur: { x: 64, y: 194 }, forge: { x: 325, y: 238 }, port: { x: 322, y: 552 } },
  2: PLAQUES_234, 3: PLAQUES_234, 4: PLAQUES_234,
};
const ORDRE: Lieu[] = ['noyau', 'generateur', 'forge', 'clinique', 'comptoir', 'labo', 'port'];
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
  labo: '20,345 160,340 240,410 225,520 160,555 50,550 5,480 10,400',
  port: '265,450 350,425 385,470 385,550 300,565 265,520',
};
const ZONES: Record<1 | 2 | 3 | 4, Record<Lieu, string>> = {
  1: {
    noyau: '140,10 215,5 235,140 255,290 200,330 135,320 140,160 110,120',
    generateur: '20,70 80,70 125,150 125,210 60,225 0,210 0,140',
    forge: '260,130 375,125 400,200 400,250 300,255 245,220 245,175',
    clinique: '30,230 90,235 125,280 115,330 40,335 0,315 0,260',
    comptoir: '280,270 375,295 395,350 380,395 280,390 240,350 245,310',
    labo: '30,345 150,340 240,410 230,520 160,555 60,550 10,480 15,400',
    port: '270,480 340,460 370,500 375,545 300,560 270,520',
  },
  2: ZONES_234, 3: ZONES_234, 4: ZONES_234,
};

function zonesBatiments(age: 1 | 2 | 3 | 4, selection: string | null): string {
  return '<svg class="zones-bat" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">'
    + ORDRE.map((id) => `<polygon class="zone-bat${selection === id ? ' choisie' : ''}" points="${ZONES[age][id]}" data-action="batiment" data-id="${id}" data-lieu="${id}"/>`).join('')
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
 * Les plaques des bâtiments ne se chevauchent jamais : après chaque rendu, une plaque qui en recouvre
 * une autre, plus haut sur le tableau, descend juste en dessous (sur téléphone, les noms longs se touchaient).
 */
function degagerPlaques(racine: HTMLElement) {
  const ps = [...racine.querySelectorAll<HTMLElement>('.toile .plaque')];
  const places: DOMRect[] = [];
  for (const p of ps.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)) {
    const r = p.getBoundingClientRect();
    let dy = 0;
    for (let essai = 0; essai < 6; essai++) {
      const gene = places.find((q) => r.left < q.right + 4 && r.right > q.left - 4 && r.top + dy < q.bottom + 4 && r.bottom + dy > q.top - 4);
      if (!gene) break;
      dy = gene.bottom + 6 - r.top;
    }
    if (dy) p.style.marginTop = `${dy}px`;
    places.push(new DOMRect(r.left, r.top + dy, r.width, r.height));
  }
}

export function brancherTableau(racine: HTMLElement) {
  degagerPlaques(racine);
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


function tableau(j: Jeu): string {
  const s = sceneDistrict(j.batiments.noyau);
  const nouveau = ageAffiche !== 0 && ageAffiche !== s.age;
  ageAffiche = s.age;
  return `<img class="tableau${s.nuit ? ' nuit' : ''}${nouveau ? ' nouvel-age' : ''}" src="${s.url}" alt="" draggable="false"/>`
    + (s.video ? `<div class="anime" data-video="${s.video}"></div>` : '')
    + `${s.nuit ? '<i class="nuit-voile" aria-hidden="true"></i>' : ''}`;
}

function plaques(e: EcranDistrict): string {
  const j = e.j;
  const lieux = LIEUX[visuel(j.batiments.noyau)];
  const o = objectifCourant(j);
  return ORDRE.map((id) => {
    const p = lieux[id];
    // une plaque près du bord droit ou gauche reste dans le tableau
    const left = Math.min(84, Math.max(16, (p.x / 400) * 100)), top = (p.y / 600) * 100;
    const pos = `style="left:${left}%;top:${top}%"`;
    // le Port s'ouvre avec les pillages (26 octobre 2026, Bryan : « il faut un bateau pour aller piller des gens »)
    if (id === 'port' && portOuvert(j)) {
      majJetons(j, e.now);
      const n = etatPillage(j).jetons;
      return `<button type="button" class="plaque" ${pos} data-action="pillages" data-lieu="port" aria-label="Port : archipels voisins, ${n} jeton${n > 1 ? 's' : ''} de pillage sur ${PILLAGE.jetonsMax}">`
        + `<span class="plaque-nom">${ICO.grappin}Port</span><small>${n} / ${PILLAGE.jetonsMax} jetons</small></button>`;
    }
    if (estFutur(id)) {
      return `<button type="button" class="plaque futur${e.selection === id ? ' choisie' : ''}" ${pos} data-action="batiment" data-id="${id}" data-lieu="${id}" aria-label="${echap(LIEUX_FUTURS[id].nom)}, pas encore ouvert">`
        + `<span class="plaque-nom">${echap(LIEUX_FUTURS[id].nom)}</span></button>`;
    }
    const d = batimentDef(id);
    if (id === 'comptoir' && !j.batiments.comptoir && !chantierDe(j, id)) {
      return `<button type="button" class="plaque futur${e.selection === id ? ' choisie' : ''}" ${pos} data-action="batiment" data-id="${id}" data-lieu="${id}" aria-label="${echap(d.nom)}, fermé">`
        + `<span class="plaque-nom">${echap(d.nom)}</span></button>`;
    }
    const prete = id === 'forge' && !!j.forge && e.now >= j.forge.fin;
    const ch = chantierDe(j, id);
    const vise = !!o && o.pilier === id && !o.fait(j);
    const occupant = id !== 'comptoir' ? posteDe(j, id) : null;
    let etat = '';
    if (ch) etat = `<small class="en-chantier">${ICO.marteau}${decompte(ch.fin, e.now)}</small>`;
    else if (id === 'comptoir') {
      // le Comptoir : à construire, ou ce qui reste en vente aujourd'hui
      const reste = j.comptoir.offres.length - j.comptoir.achetes.length;
      etat = !j.batiments.comptoir ? ''
        : reste > 0 ? `<small class="occupe">${ICO.cartes}${reste} en vente</small>` : `<small>${ICO.ok}Tout vendu</small>`;
    }
    else if (prete) etat = `<small class="pret">${ICO.ok}Prêt</small>`;
    else if (j.forge && id === 'forge') etat = `<small>${ICO.chrono}${decompte(j.forge.fin, e.now)}</small>`;
    // le travailleur : un petit médaillon, vide si personne, avec son visage sinon (23 octobre 2026, Bryan : les noms prenaient trop de place sur téléphone)
    const med = id === 'comptoir' || !j.batiments[id] || (id === 'noyau' && !occupant) ? ''
      : occupant ? `<span class="poste-med" title="${echap(porteurDef(occupant).nom)}">${avatar(occupant, 22)}</span>`
      : `<span class="poste-med vide" title="Personne au poste">${ICO.ouvrier}</span>`;
    return `<button type="button" class="plaque${e.selection === id ? ' choisie' : ''}${vise ? ' visee' : ''}" ${pos} data-action="batiment" data-id="${id}" data-lieu="${id}" aria-label="${echap(d.nom)}${j.batiments[id] ? `, niveau ${j.batiments[id]}` : ', à construire'}${occupant ? `, ${echap(porteurDef(occupant).nom)} au poste` : med ? ', personne au poste' : ''}">`
      + `<span class="plaque-nom">${j.batiments[id] ? `<b class="niv">${j.batiments[id]}</b>` : `<b class="niv a-construire" title="À construire">${ICO.marteau}</b>`}${echap(d.nom)}${med}</span>${etat}${prete || vise ? '<i class="pastille-alerte" aria-hidden="true"></i>' : ''}</button>`;
  }).join('');
}

/** La mission du moment, posée en haut du tableau */
function mission(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  if (o) {
    const fait = o.fait(j);
    const gain = `${o.recompense.energie ? prix('energie', o.recompense.energie) : ''}${o.recompense.composants ? prix('composants', o.recompense.composants) : ''}`
      + (o.recompense.creuseurs ? prix('ouvrier', o.recompense.creuseurs, true, 'creuseurs') : '');
    // sur téléphone, l'objectif guidé se replie en une barre comme celui du jour (25 octobre 2026, Bryan : « beaucoup trop de place ») :
    // la toucher emmène là où il se fait, la flèche déplie la consigne. Sur PC, il reste toujours ouvert.
    const replie = e.panneauReplie !== false && !fait;
    const barre = replie
      ? `<section class="mission jour replie barre guide" aria-label="Objectif">`
        + `<button type="button" class="mj-aller" data-action="objectif-guide" aria-label="Objectif ${j.objectif + 1} sur ${OBJECTIFS.length} : ${echap(o.titre)}. Y aller">`
        + `<span class="surtitre">Objectif</span><strong>${echap(o.titre)}</strong>${ICO.lancer}</button>`
        + `<button type="button" class="mj-plier" data-action="panneau" aria-expanded="false" aria-label="Lire la consigne"><i aria-hidden="true">▾</i></button></section>`
      : '';
    return barre + `<section class="mission guide${fait ? ' faite' : ''}${replie ? ' pc-seul' : ''}" aria-label="Objectif"><div class="mission-tete"><span class="surtitre">OBJECTIF ${j.objectif + 1} / ${OBJECTIFS.length}</span><span class="gains">${gain}</span></div>`
      + `<strong>${echap(o.titre)}</strong>`
      + (fait ? `<button type="button" class="btn prim" data-action="reclamer">${ICO.ok}Récupérer la récompense</button>` : `<p>${echap(o.consigne)}</p>`
        + `<button type="button" class="mj-plier mob" data-action="panneau" aria-expanded="true" aria-label="Réduire l’objectif">Réduire<i aria-hidden="true">▴</i></button>`)
      + `</section>`;
  }
  if (!j.chambre) return '';
  const q = j.quotidien;
  const def = QUOTIDIENS[q.type];
  const max = ARCHIVE.paliers[ARCHIVE.paliers.length - 1]!;
  const crans = ARCHIVE.paliers.map((p) => `<i class="cran${j.archive.points >= p ? ' atteint' : ''}" style="left:${(p / max) * 100}%"></i>`).join('');
  // Trois blocs : l'objectif, la confiance, l'Archive. Sur téléphone ils restent serrés dans un seul panneau ;
  // sur PC (panneau-district.css, 23 octobre 2026) chacun devient sa propre carte de verre, avec plus de détails.
  // Les éléments « pc » ne s'affichent que sur PC, les « mob » que sur téléphone.
  const points = Math.min(j.archive.points, max);
  const confiance = j.confiance ?? 50;
  // sur téléphone, le panneau se replie (23 octobre 2026, Bryan : « je ne sais pas fermer cette page ») : replié,
  // il ne garde que l'objectif du jour et sa jauge ; on le touche pour tout voir. Sur PC, il reste toujours ouvert.
  const replie = e.panneauReplie !== false;
  // replié, sur téléphone : une seule barre fine. Toucher l'objectif emmène là où il se remplit ; la flèche ouvre les détails.
  let barre = '';
  if (replie && quotidienActif(j) && !quotidienFait(j)) {
    barre = `<section class="mission jour replie barre" aria-label="Objectif du jour">`
      + `<button type="button" class="mj-aller" data-action="objectif-aller" data-id="${q.type}" aria-label="Objectif du jour : ${echap(def.titre)}, ${q.progres} sur ${def.objectif}. Y aller">`
      + `<span class="surtitre">Objectif</span><strong>${echap(def.titre)}</strong><b class="chiffre">${q.progres}/${def.objectif}</b>${ICO.lancer}</button>`
      + `<button type="button" class="mj-plier mob" data-action="panneau" aria-expanded="false" aria-label="Voir la confiance, l’Archive et le marché"><i aria-hidden="true">▾</i></button></section>`;
  }
  // avec la barre, le panneau complet n'est plus montré que sur PC (district.css)
  let h = barre + `<section class="mission jour${quotidienFait(j) ? ' faite' : ''}${replie ? ' replie' : ''}${barre ? ' pc-seul' : ''}" aria-label="Objectif du jour">`
    + `<button type="button" class="mj-plier mob" data-action="panneau" aria-expanded="${!replie}" aria-label="${replie ? 'Voir la confiance, l’Archive et le marché' : 'Réduire le panneau'}">${replie ? 'Détails' : 'Réduire'}<i aria-hidden="true">${replie ? '▾' : '▴'}</i></button><div class="mj-obj">`;
  if (quotidienActif(j)) {
    const reserve = q.reserve > 1
      ? `<span class="mj-reserve pc" title="${q.reserve} objectifs en réserve : ils s’accumulent jusqu’à 3 si tu ne joues pas">${Array.from({ length: 3 }, (_, i) => `<i class="${i < q.reserve ? 'plein' : ''}"></i>`).join('')}<small>${q.reserve} en réserve</small></span>`
      : '';
    h += `<div class="mission-tete"><span class="surtitre mob">OBJECTIF DU JOUR${q.reserve > 1 ? ` · ${q.reserve} EN RÉSERVE` : ''}</span><span class="surtitre pc">OBJECTIF DU JOUR</span>${reserve}<span class="chiffre mob">${q.progres} / ${def.objectif}</span></div><strong>${echap(def.titre)}</strong>`
      + (quotidienFait(j)
        ? `<button type="button" class="btn prim" data-action="reclamer-jour">${ICO.coffre}Récupérer : une carte ou 2 Éclats</button>`
        : `<div class="mj-progres"><div class="jauge"><i style="width:${(100 * q.progres) / def.objectif}%"></i></div><span class="chiffre pc"><b>${q.progres}</b> / ${def.objectif}</span></div>`
          + `<p class="mj-gain pc">${icone('coffre')}<span>Récompense : <b>une carte</b> ou <b>2 Éclats</b>, au choix</span></p>`);
  } else h += `<div class="mission-tete"><span class="surtitre">OBJECTIF DU JOUR</span></div><small class="aide">Tous faits : le prochain arrive demain.</small>`;
  h += `</div>`;
  const seuils = `<i class="seuil pc" style="left:${CONFIANCE.basse}%" title="En dessous : −10 % d’énergie"></i><i class="seuil pc" style="left:${CONFIANCE.haute}%" title="Au-dessus : +10 % d’énergie"></i>`;
  h += `<div class="confiance" title="${echap(humeurDistrict(j))}"><span class="surtitre mob">CONFIANCE · ${confiance}</span><span class="surtitre pc">CONFIANCE DU QUARTIER</span>`
    + `<span class="mj-valeur pc"><b>${confiance}</b>/100</span>`
    + `<div class="jauge">${seuils}<i style="width:${confiance}%"></i><b class="curseur pc" style="left:${confiance}%"></b></div><small>${echap(humeurDistrict(j))}</small></div>`
    + (j.chambre ? `<p class="rumeur"><b>Au marché</b> ${echap(rumeurDuJour(jourDe(Date.now()), j.strate))}</p>` : '');
  const reperes = ARCHIVE.paliers.map((p, i) => `<span class="${points >= p ? 'atteint' : ''}" style="left:${(p / max) * 100}%">${i === ARCHIVE.paliers.length - 1 ? '' : p}</span>`).join('');
  h += `<div class="archive"><span class="mj-ico pc">${icone('coffre')}</span>`
    + `<span class="surtitre mob">ARCHIVE · ${points}/${max}</span><span class="surtitre pc">ARCHIVE DE LA SEMAINE</span>`
    + `<span class="mj-valeur pc"><b>${points}</b>/${max}</span>`
    + `<div class="jauge reso">${crans}<i style="width:${Math.min(100, (100 * j.archive.points) / max)}%"></i></div>`
    + `<div class="mj-reperes pc" aria-hidden="true">${reperes}</div>`
    + `<small><span class="pc">S’ouvre </span>${decompte(lundiSuivant(e.now), e.now, 'lundi, dans ')}</small></div>`;
  return h + `</section>`;
}

/** Le grand bouton d'action posé en bas du tableau, quand une chose attend le joueur */
function appel(e: EcranDistrict): string {
  const j = e.j;
  if (j.expedition) {
    return `<button type="button" class="appel" data-action="reprendre">${ICO.descendre}<span><strong>${j.expedition.tutoriel ? 'La chambre scellée' : `Expédition · Strate −${j.expedition.strate}`}</strong><small>Le combat t’attend : reprendre</small></span></button>`;
  }
  if (!j.chambre) {
    return `<button type="button" class="appel reso" data-action="rencontre">${ICO.porte}<span><strong>La porte scellée</strong><small>Sous la Tour du Noyau, trois personnes t’attendent</small></span></button>`;
  }
  if (j.archive.aOuvrir && !objectifCourant(j)) {
    return `<button type="button" class="appel reso" data-action="ouvrir-archive">${icone('coffre')}<span><strong>L’Archive de la semaine est prête</strong><small>Palier ${j.archive.aOuvrir} sur ${ARCHIVE.paliers.length} atteint : ouvre-la</small></span></button>`;
  }
  if (colisDisponible(j)) {
    const reste = colisAvantChoix(j);
    return `<button type="button" class="appel colis" data-action="colis">${icone('coffre')}<span><strong>Ravitaillement du jour${j.ravitaillement.reserve > 1 ? ` · ${j.ravitaillement.reserve} colis` : ''}</strong>`
      + `<small>Composants et un doublon · ${reste === 1 ? 'celui-ci contient une carte au choix' : `carte au choix dans ${reste} colis`}</small></span>`
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
  if (b === 'generateur') { const v = energieParHeure(avecPorteur(j, b, id)); return { v, court: `${ent(v)}/h`, long: `${ent(v)} énergie/h` }; }
  if (b === 'clinique') { const v = Math.round(soinParHeure(avecPorteur(j, b, id)) * 10) / 10; return { v, court: `${virgule(v)}/h`, long: `${virgule(v)} Usure soignée/h` }; }
  const d = batimentDef(b);
  const v = !id ? 1 : porteurDef(id).lignee === d.affinite ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste;
  return { v, court: `×${virgule(v)}`, long: `vitesse ×${virgule(v)}` };
}

const multPoste = (b: Exclude<Poste, 'noyau'>, id: string) => {
  const ideal = porteurDef(id).lignee === batimentDef(b).affinite;
  return `<span class="fb-mult${ideal ? ' ideal' : ''}" title="${ideal ? 'Lignée idéale pour ce bâtiment' : 'Autre lignée'}">×${virgule(ideal ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste)}</span>`;
};

/** Un Porteur qu'on peut poster : son portrait, ce que donnerait le poste avec lui, et ce qu'il quitterait */
function candidat(j: Jeu, id: string, poste: Exclude<Poste, 'noyau'>, actuel: number): string {
  const d = porteurDef(id);
  const ailleurs = j.porteurs[id]!.poste;
  const r = rendement(j, poste, id);
  const ecart = Math.round((r.v - actuel) * 10) / 10;
  const signe = ecart > 0 ? 'plus' : ecart < 0 ? 'moins' : 'egal';
  const delta = poste === 'forge' ? '' : ecart === 0 ? '<i>=</i>' : `<i>${ecart > 0 ? '+' : '−'}${virgule(Math.abs(ecart))}</i>`;
  return `<button type="button" class="fb-cand ${signe}" style="--c:${COULEUR[d.lignee]}" data-action="poster" data-id="${id}" data-poste="${poste}" aria-label="Poster ${echap(d.nom)} : ${r.long}${ailleurs ? `, quitte ${echap(batimentDef(ailleurs).nom)}` : ''}">`
    + `<span class="fb-cand-portrait">${avatar(id, 56)}${multPoste(poste, id)}</span>`
    + `<strong>${echap(d.nom)}</strong>${poste === 'forge' ? '' : `<span class="fb-cand-eff">${r.court}${delta}</span>`}`
    + (ailleurs ? `<small class="fb-cand-ailleurs">quitte ${echap(batimentDef(ailleurs).nom)}</small>` : '')
    + `</button>`;
}

const ICONE_GAIN: Record<GainNiveau['quoi'] | 'apparence', Icone> = {
  energie: 'energie', soin: 'soin', stockage: 'coffre', creuseurs: 'ouvrier', strate: 'descendre', forge: 'chrono',
  plafond: 'tour', chantiers: 'marteau', porteur: 'porteurs', apparence: 'district', entrainement: 'monter', offres: 'cartes', argent: 'cristal',
};
const valeurGain = (v: number, unite?: string) => (v === Infinity ? '∞' : `${Number.isInteger(v) ? ent(v) : (Math.round(v * 10) / 10).toLocaleString('fr-BE')}${unite ? ` ${unite}` : ''}`);

/** Ce que change le niveau suivant : les chiffres qui montent (avant → après), ce qui se débloque, et la nouvelle apparence */
function gainsNiveau(j: Jeu, b: BatimentId): string {
  const niv = j.batiments[b];
  const gains: (GainNiveau | { quoi: 'apparence'; texte: string; detail?: string; avant?: undefined; apres?: undefined; unite?: undefined })[] = gainsAmelioration(j, b);
  const nouvelle = visuel(niv + 1) !== visuel(niv);
  if (nouvelle) gains.push(b === 'noyau' ? { quoi: 'apparence', texte: 'Le district change d’âge', detail: 'nouvelle vue d’ensemble' } : { quoi: 'apparence', texte: 'Nouvelle apparence', detail: 'le bâtiment se transforme' });
  if (!gains.length) return '';
  const dc = dureeChantier(j, b);
  return `<section class="fb-suivant"><div class="fb-suivant-tete"><span class="surtitre">Au niveau ${niv + 1}</span><span class="fb-duree">${ICO.chrono}${dc ? duree(dc) : 'immédiat'}</span></div><ul>`
    + gains.map((g) => {
      const chiffre = g.avant !== undefined && g.apres !== undefined;
      const vignette = g.quoi === 'apparence' && b !== 'noyau' ? `<img class="fb-apercu" src="${illustrationBatiment(b, niv + 1)}" alt="" decoding="async" loading="lazy">` : '';
      return `<li class="${chiffre ? '' : 'deblocage'}">${vignette || ICO[ICONE_GAIN[g.quoi]]}<span class="fb-g-txt">${echap(g.texte)}${g.detail ? `<small>${echap(g.detail)}</small>` : ''}</span>`
        + (chiffre ? `<span class="fb-g-val"><s>${valeurGain(g.avant!, g.unite)}</s><b>${valeurGain(g.apres!, g.unite)}</b></span>` : '')
        + `</li>`;
    }).join('') + `</ul></section>`;
}

/** Une ressource du coût, lue « ce que j'ai / ce qu'il faut » (23 octobre 2026) : pas de soustraction à faire, le rouge dit ce qui manque */
function coutDetail(icone: Icone, besoin: number, possede: number, nom: string): string {
  const court = possede < besoin;
  return `<span class="fb-prix${court ? ' court' : ''}" title="${nom} : ${ent(possede)} / ${ent(besoin)}" aria-label="${nom} : ${ent(possede)} sur ${ent(besoin)}">${ICO[icone]}<b>${ent(Math.min(possede, besoin))}</b><small>/ ${ent(besoin)}</small></span>`;
}

/** Une réserve : jauge remplie / maximum et ce qu'elle dit */
function reserve(j: Jeu, b: BatimentId): string {
  const max = stockage(j);
  const v = Math.min(j.energie, max);
  const eph = energieParHeure(j);
  const plein = v >= max;
  const note = plein ? (eph > 0 ? 'Pleine : ce que produit le Générateur est perdu.' : 'Pleine.')
    : eph > 0 ? decompte(Date.now() + ((max - v) / eph) * 3_600_000, Date.now(), 'Pleine dans ', '.') : '';
  return `<div class="fb-reserve${plein ? ' pleine' : ''}"><div class="fb-reserve-tete">${ICO.coffre}<span>Réserve d’énergie</span><b>${ent(v)}<small> / ${ent(max)}</small></b></div>`
    + `<div class="fb-jauge" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${v}" aria-label="Réserve d’énergie"><i style="width:${max ? (v / max) * 100 : 0}%"></i></div>`
    + `<small>${note}${b === 'generateur' ? ' La taille de la réserve dépend de la Tour du Noyau.' : ''}</small></div>`;
}

/**
 * L'entraînement à la Tour du Noyau (23 octobre 2026) : un Porteur qui ne descend pas gagne de l'XP avec le temps,
 * jusqu'à un plafond fixé par le niveau de la Tour. Même présentation que les postes des autres bâtiments.
 */
function blocEntrainement(j: Jeu): string {
  if (!j.chambre) return '';
  const occupant = posteDe(j, 'noyau');
  const plafond = plafondEntrainement(j);
  const xph = xpEntrainement(j);
  const eh = energieEntrainement(j);
  let h = `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.monter}Entraînement</h3><div class="fb-entrainement" aria-hidden="true"><img src="${salleEntrainement}" alt="" decoding="async"></div>`
    + `<p class="fb-vide">Un Porteur posté ici s’entraîne avec les creuseurs : <b>+${xph} XP par heure</b> pour <b>${eh} énergie par heure</b>, même jeu fermé, jusqu’au <b>niveau ${plafond}</b>. Sans énergie, il s’arrête. S’il rejoint l’escouade, il quitte l’entraînement.</p>`;
  const niveau = (id: string) => niveauPorteur(j, id).niveau;
  if (occupant) {
    const o = porteurDef(occupant);
    const n = niveauPorteur(j, occupant);
    const fini = n.niveau >= plafond;
    const reste = !fini && n.requis ? Math.ceil(((n.requis - n.xp) / xph) * 3_600_000) : 0;
    h += `<div class="fb-occupant" style="--c:${COULEUR[o.lignee]}"><span class="fb-cand-portrait">${avatar(occupant, 64)}</span><div><strong>${echap(o.nom)}</strong><span class="fb-lignee">Niveau ${n.niveau} · ${pvNiveau(j, occupant)} PV</span>`
      + `<span class="fb-apport">${fini ? `Plafond atteint : monte la Tour pour aller plus loin` : j.energie < 1 ? `En pause : plus d’énergie` : decompte(Date.now() + reste, Date.now(), `Niveau ${n.niveau + 1} dans `)}</span></div>`
      + `<button type="button" class="btn sec fb-liberer" data-action="liberer" data-id="${occupant}" aria-label="Arrêter l’entraînement de ${echap(o.nom)}">Arrêter</button></div>`;
  }
  const libres = PORTEURS.filter((p) => p.id !== occupant && porteursPresents(j).includes(p.id) && !enExpedition(j, p.id))
    .sort((x, y) => niveau(x.id) - niveau(y.id));
  if (libres.length) {
    h += `<p class="fb-consigne">${occupant ? 'Le remplacer' : 'Entraîner un Porteur'} <span>· les moins avancés d’abord</span></p><div class="fb-rangee">`
      + libres.map((p) => {
        const ailleurs = j.porteurs[p.id]!.poste;
        const n = niveau(p.id);
        return `<button type="button" class="fb-cand${n >= plafond ? ' egal' : ' plus'}" style="--c:${COULEUR[p.lignee]}" data-action="poster" data-id="${p.id}" data-poste="noyau"${n >= plafond ? ' disabled' : ''} aria-label="Entraîner ${echap(p.nom)}, niveau ${n}${ailleurs ? `, quitte ${echap(batimentDef(ailleurs).nom)}` : ''}">`
          + `<span class="fb-cand-portrait">${avatar(p.id, 56)}</span><strong>${echap(p.nom)}</strong><span class="fb-cand-eff">niv. ${n}${n >= plafond ? ' · max' : ''}</span>`
          + (ailleurs ? `<small class="fb-cand-ailleurs">quitte ${echap(batimentDef(ailleurs).nom)}</small>` : '') + `</button>`;
      }).join('') + `</div>`;
  }
  return h + `</section>`;
}

/**
 * Le Comptoir (23 octobre 2026) : les cartes du jour, à prix fixe. On voit la carte avant de payer ; chaque offre
 * ne s'achète qu'une fois, tout se renouvelle demain. L'or et la nacre restent à trouver dans les Strates.
 */
function blocComptoir(e: EcranDistrict): string {
  const j = e.j;
  if (!j.batiments.comptoir) {
    return `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.cartes}Une fois rouvert</h3><p class="fb-vide">Chaque jour, <b>${COMPTOIR.etals[1]!.length} cartes</b> en vente (fer et cuivre), une fois chacune. Il montera jusqu’à ${COMPTOIR.etals[5]!.length} cartes par jour, avec de l’argent après la Strate −${COMPTOIR.strateArgent}. L’or et la nacre restent à trouver dans les Strates.</p></section>`;
  }
  const c = j.comptoir;
  const demain = debutJour(c.jour + 1) - e.now;
  let h = `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.cartes}En vente aujourd’hui<span class="cp-renouv">${ICO.chrono}${decompte(e.now + demain, e.now, 'nouvelles cartes dans ')}</span></h3><div class="cp-etals">`;
  c.offres.forEach((id, i) => {
    const m = moduleDef(id);
    const possede = j.collection[id];
    const vendu = c.achetes.includes(i);
    const p = prixComptoir(id);
    const assez = j.composants >= p.composants && j.eclats >= p.eclats;
    const niveau = possede?.niveau ?? COLLECTION.niveauDepart[m.rarete];
    const ruban = possede ? `Doublon · niv. ${possede.niveau}` : 'Nouvelle';
    h += `<div class="cp-offre${vendu ? ' vendue' : ''}"><div class="cp-face">${faceCarte(m, niveau, multNiveau(id, niveau))}${vendu ? `<span class="cp-vendu">${ICO.ok}Achetée</span>` : ''}</div>`
      + `<span class="ruban${possede ? '' : ' neuve'}">${ruban}</span>`
      + (vendu ? '' : `<button type="button" class="btn ${assez ? 'prim' : 'sec'} petit cp-acheter" data-action="acheter" data-index="${i}"${assez ? '' : ' disabled'} aria-label="Acheter ${echap(m.nom)} (${NOMS_RARETE[m.rarete]})">${couts(j, { composants: p.composants, eclats: p.eclats })}</button>`)
      + `</div>`;
  });
  return h + `</div><small class="fb-absents">Un doublon fait monter une carte que tu as déjà. L’or et la nacre ne se vendent pas : ils se trouvent dans les Strates.</small></section>`;
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
    + `<span class="poignee" aria-hidden="true"></span><button type="button" class="btn-icone fb-fermer" data-action="fermer" aria-label="Fermer">${ICO.fermer}</button>`
    + `<div class="feuille-corps fb-corps"><header class="fb-heros"><div class="fb-scene" aria-hidden="true"><span class="fb-halo"></span><span class="ff-vue" style="${vue}"></span></div>`
    + `<div class="fb-titre"><span class="surtitre">Pas encore ouvert</span><h2 id="feuille-titre">${echap(l.nom)}</h2></div></header>`
    + `<p class="fb-role">${echap(l.raison)}</p><p class="ff-promesse">${echap(l.promesse)}</p></div></section>`;
}

function feuilleBatiment(e: EcranDistrict): string {
  const j = e.j;
  const sel = e.selection;
  if (!sel) return '';
  if (estFutur(sel)) return feuilleLieuFutur(e, sel);
  const b = sel;
  const d = batimentDef(b);
  const niv = j.batiments[b];
  const pv = prochainVisuel(niv);
  const crans = Array.from({ length: d.niveauMax }, (_, i) => `<i class="${i < niv ? 'plein' : ''}"></i>`).join('');
  const surtitre = niv ? `Niveau ${niv} <span class="fb-max">/ ${d.niveauMax}</span>` : b === 'comptoir' ? 'Fermé' : 'À construire';
  const ideal = d.affinite ? `<span class="fb-ideal" style="--c:${COULEUR[d.affinite]}">${ICO.porteurs}Idéal : ${NOM_LIGNEE[d.affinite]} <b>×${virgule(DISTRICT.bonusAffinite)}</b></span>` : '';
  let h = `<div class="voile-feuille" data-action="fermer" aria-hidden="true"></div><section class="feuille fiche-bat" role="dialog" aria-modal="true" aria-labelledby="feuille-titre">`
    + `<span class="poignee" aria-hidden="true"></span><button type="button" class="btn-icone fb-fermer" data-action="fermer" aria-label="Fermer">${ICO.fermer}</button>`
    + `<div class="feuille-corps fb-corps"><header class="fb-heros"><div class="fb-scene" aria-hidden="true"><span class="fb-halo"></span><img class="fb-ilot${niv ? '' : ' vide'}" src="${illustrationBatiment(b, Math.max(1, niv))}" alt="" decoding="async"></div>`
    + `<div class="fb-titre"><span class="surtitre">${surtitre}</span><h2 id="feuille-titre">${echap(d.nom)}</h2>`
    + `<span class="fb-crans" aria-hidden="true">${crans}</span>${ideal}</div></header>`;
  if (b === 'comptoir' && !niv) h += `<p class="fb-role">${echap(COMPTOIR_FERME)}</p>`;
  else h += `<p class="fb-role">${echap(d.role)}${pv !== null && pv <= d.niveauMax && pv > niv + 1 ? ` <span>Nouvelle apparence au niveau ${pv}.</span>` : ''}</p>`;

  // ce que le bâtiment rapporte
  if (b === 'generateur') h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.energie}<b>+${ent(energieParHeure(j))}</b><small>énergie par heure</small></div></div>${reserve(j, b)}`;
  if (b === 'clinique') h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.soin}<b>−${virgule(soinParHeure(j))}</b><small>Usure par heure, pour chaque Porteur présent au district</small></div></div>`;
  if (b === 'noyau') {
    h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.strate}<b>−${j.strate}</b><small>Strate ouverte</small></div><div class="fb-chiffre">${ICO.tour}<b>${niv}</b><small>niveau maximum des autres bâtiments</small></div></div>${reserve(j, b)}`
      + blocEntrainement(j);
  }
  if (b === 'comptoir') h += blocComptoir(e);

  // le Porteur au travail
  if (b !== 'noyau' && b !== 'comptoir') {
    const poste = b;
    const occupant = posteDe(j, poste);
    const actuel = rendement(j, poste, occupant);
    h += `<section class="fb-bloc"><h3 class="titre-bloc">${icone('ouvrier')}Au travail</h3>`;
    if (occupant) {
      const o = porteurDef(occupant);
      const vide = rendement(j, poste, null);
      const apport = poste === 'forge' ? `fabrique ${virgule(actuel.v)} fois plus vite`
        : poste === 'clinique' ? `+${virgule(actuel.v - vide.v)} Usure soignée/h grâce à ${echap(o.nom)}`
          : `+${ent(actuel.v - vide.v)} énergie/h grâce à ${echap(o.nom)}`;
      h += `<div class="fb-occupant" style="--c:${COULEUR[o.lignee]}"><span class="fb-cand-portrait">${avatar(occupant, 64)}${multPoste(poste, occupant)}</span><div><strong>${echap(o.nom)}</strong><span class="fb-lignee">${NOM_LIGNEE[o.lignee]}</span><span class="fb-apport">${apport}</span></div>`
        + `<button type="button" class="btn sec fb-liberer" data-action="liberer" data-id="${occupant}" aria-label="Libérer ${echap(o.nom)} (${poste === 'forge' ? 'vitesse normale' : vide.long})">Libérer</button></div>`;
    } else {
      const avec = (lignee: boolean) => { const id = PORTEURS.find((p) => (p.lignee === d.affinite) === lignee)?.id; return id ? rendement(j, poste, id).court : ''; };
      h += `<p class="fb-vide">Personne au poste${poste === 'forge' ? ' : la Forge ne peut pas fabriquer.' : ` : ${actuel.long}.`} Avec un Porteur ${d.affinite ? `<b style="color:${COULEUR[d.affinite]}">${NOM_LIGNEE[d.affinite]}</b>` : 'de la bonne lignée'} : <b>${avec(true)}</b>, un autre : ${avec(false)}.</p>`;
    }
    const libres = PORTEURS.filter((p) => p.id !== occupant && !enExpedition(j, p.id) && porteursPresents(j).includes(p.id))
      .sort((x, y) => Number(y.lignee === d.affinite) - Number(x.lignee === d.affinite) || Number(!!j.porteurs[x.id]!.poste) - Number(!!j.porteurs[y.id]!.poste));
    if (libres.length) {
      h += `<p class="fb-consigne">${occupant ? 'Le remplacer' : 'Poster un Porteur'} <span>· touche un portrait</span></p>`
        + `<div class="fb-rangee">${libres.map((p) => candidat(j, p.id, poste, actuel.v)).join('')}</div>`;
    }
    const absents = PORTEURS.filter((p) => porteursPresents(j).includes(p.id) && enExpedition(j, p.id));
    if (absents.length) h += `<small class="fb-absents">En expédition ou en mission : ${absents.map((p) => echap(p.nom)).join(', ')}.</small>`;
    h += `</section>`;
  }

  // la Forge
  if (b === 'forge') {
    h += `<section class="fb-bloc"><h3 class="titre-bloc">${icone('marteau')}Refabriquer une carte</h3>`;
    if (j.forge) {
      const m = moduleDef(j.forge.moduleId);
      h += `<div class="en-cours">${gemme(m.rarete)}<div><strong>${echap(m.nom)}</strong><small>${e.now >= j.forge.fin ? 'Prête : elle rejoint tes cartes' : decompte(j.forge.fin, e.now, 'Reste ')}</small><div class="jauge or">${jaugeTemps(j.forge.debut, j.forge.fin, e.now)}</div></div></div>`;
    } else {
      const forgeron = posteDe(j, 'forge');
      h += `<p class="aide">Un exemplaire de plus devient un doublon, pour faire monter la carte.${forgeron ? '' : ' <b>Poste d’abord un Porteur à la Forge.</b>'}</p><ul class="liste-forge">`;
      const possedees = Object.keys(j.collection).map(moduleDef).sort((x, y) => RARETES.indexOf(y.rarete) - RARETES.indexOf(x.rarete) || x.nom.localeCompare(y.nom));
      for (const m of possedees) {
        const c = coutRefabrication(m.id);
        const assez = j.energie >= c.energie && j.composants >= c.composants && j.eclats >= c.eclats;
        h += `<li style="--r:${COULEUR_RARETE[m.rarete]}">${gemme(m.rarete)}<div class="lf-nom"><strong>${echap(m.nom)}</strong><small>${ICO.chrono}${duree(dureeFabrication(j, m.id))}</small></div>`
          + `<span class="lf-prix">${couts(j, { energie: c.energie, composants: c.composants, eclats: c.eclats })}</span>`
          + `<button type="button" class="btn sec petit" data-action="fabriquer" data-module="${m.id}"${assez && forgeron ? '' : ' disabled'} aria-label="Refabriquer ${echap(m.nom)}">${ICO.marteau}</button></li>`;
      }
      h += `</ul>`;
    }
    h += `</section>`;
  }

  // Revue du 23 octobre 2026 : le pied fixe porte l'action qu'on fait le plus souvent. À la Tour du Noyau, c'est
  // « Entrer dans la tour » ; l'amélioration, rare, passe en bas de la feuille (un raccourci du pied y mène).
  // Ailleurs, l'amélioration reste au pied, mais sur une seule ligne : coût et bouton côte à côte.
  const a = amelioration(j, b);
  if (b === 'noyau') {
    h += `<section class="fb-amelio" id="fb-amelio">${a.ch || !a.cout ? '' : gainsNiveau(j, b)}${barreAmelioration(e, b, a, false)}</section>`;
  } else if (a.cout && !a.ch) h += gainsNiveau(j, b);
  h += `</div><footer class="feuille-pied fb-pied">`;
  if (b === 'noyau') {
    const raccourci = a.ch ? `${ICO.marteau}${decompte(a.ch.fin, e.now)}`
      : `${ICO.monter}<span>Niv. ${niv + 1}</span>`;
    h += `<div class="fb-barre">`
      + (a.cout || a.ch ? `<button type="button" class="btn sec fb-vers-amelio${a.pret ? ' pret' : ''}" data-action="vers-amelioration" aria-label="${a.ch ? 'Voir le chantier en cours' : `Améliorer au niveau ${niv + 1}${a.pret ? ' : possible' : ''}`}">${raccourci}</button>` : '')
      + `<button type="button" class="btn prim large fb-entrer" data-action="entrer">${ICO.tour}Entrer dans la tour</button></div>`;
  } else h += barreAmelioration(e, b, a, true);
  return h + `</footer></section>`;
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
  const raison = bloque ? `Il faut d’abord monter la Tour du Noyau (niveau ${j.batiments.noyau}).`
    : plein ? (b === 'noyau' && j.chantiers.length ? 'Attends la fin des chantiers en cours.' : chantiersMax(j) === 1 ? 'Un seul chantier à la fois (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.') : '';
  return { ch, cout, bloque, raison, pret: !ch && assez && !bloque && !plein };
}

/** Le coût et le bouton d'amélioration sur une ligne ; `pied` : la version du pied fixe (étiquette courte) */
function barreAmelioration(e: EcranDistrict, b: BatimentId, a: ReturnType<typeof amelioration>, pied: boolean): string {
  const j = e.j;
  const niv = j.batiments[b];
  if (a.ch) {
    return `<div class="chantier-cours">${icone('marteau')}<div><strong>${!niv && b === 'comptoir' ? 'Remise en état' : `Chantier vers le niveau ${niv + 1}`}</strong><small>${decompte(a.ch.fin, e.now, 'Reste ', ' · avance même jeu fermé')}</small><div class="jauge or">${jaugeTemps(a.ch.debut, a.ch.fin, e.now)}</div></div></div>`;
  }
  if (!a.cout) return `<small class="raison">Niveau maximum pour cette version.</small>`;
  const c = a.cout;
  const etiquette = !niv ? `${ICO.marteau}${b === 'comptoir' ? 'Rouvrir' : 'Construire'}` : pied ? `${ICO.monter}Niveau ${niv + 1}` : `${ICO.monter}Passer au niveau ${niv + 1}`;
  return (a.raison ? `<p class="fb-raison">${ICO.verrou}<span>${a.raison}</span>${a.bloque ? `<button type="button" class="fb-lien" data-action="batiment" data-id="noyau" data-amelio>Voir la Tour</button>` : ''}</p>` : '')
    + `<div class="fb-barre"><div class="fb-cout" aria-label="Coût">`
    + (c.energie ? coutDetail('energie', c.energie, j.energie, 'Énergie') : '')
    + (c.composants ? coutDetail('composants', c.composants, j.composants, 'Composants') : '')
    + (c.eclats ? coutDetail('eclats', c.eclats, j.eclats, 'Éclats') : '') + `</div>`
    + `<button type="button" class="btn ${a.pret ? 'prim' : 'sec'} fb-ameliorer" data-action="ameliorer" data-id="${b}"${a.pret ? '' : ' disabled'} aria-label="${niv ? `Passer au niveau ${niv + 1}` : b === 'comptoir' ? 'Remettre le Comptoir en état' : `Construire le ${echap(batimentDef(b).nom)}`}">${etiquette}</button></div>`;
}

/** Un grand choix de la campagne : la fenêtre ne se ferme qu'une fois la décision prise */
function fenetreDecision(acte: Acte): string {
  const d = DECISIONS[acte];
  const sur = acte === 'chambre' ? 'ACTE I · LA CHAMBRE' : acte === 'lecture' ? 'ACTE II · LE CRIME ANCIEN' : 'ACTE III · LA VÉRITÉ';
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="decision-titre"><div class="fenetre decision"><span class="surtitre">${sur}</span><h2 id="decision-titre">${echap(d.titre)}</h2><p>${echap(d.texte)}</p><div class="options-decision">`
    + d.options.map((o) => `<button type="button" class="option-decision" data-action="decider" data-acte="${acte}" data-id="${o.id}"><strong>${echap(o.nom)}</strong><em>« ${echap(o.phrase)} »</em><small>${echap(o.effet)}</small></button>`).join('')
    + `</div><small class="aide">Ce choix est définitif. Aucun n’est « le bon » : chacun règle une partie du problème et en aggrave une autre.</small></div></div>`;
}

/** Une icône qui dit de quoi parle chaque ligne de « Pendant ton absence » */
function iconeRetour(l: string): Icone {
  const t = l.toLowerCase();
  if (t.includes('clinique') || t.includes('soign')) return 'soin';
  if (t.includes('améliorer') || t.includes('niveau')) return 'monter';
  if (t.includes('chantier')) return 'marteau';
  if (t.includes('creuseur')) return 'ouvrier';
  if (t.includes('forge') || t.includes('carte')) return 'cartes';
  if (t.includes('énergie') || t.includes('stockage')) return 'energie';
  if (t.includes('mission') || t.includes('expédition')) return 'descendre';
  return 'cristal';
}

/** Les âges du district : il change de visage avec la Tour du Noyau (art.ts, visuel) */
const AGES: Record<1 | 2 | 3 | 4, { nom: string; texte: string }> = {
  1: { nom: 'Le campement', texte: 'Quelques cabanes sur les piliers, et une Tour qui tient debout.' },
  2: { nom: 'Le quartier s’éveille', texte: 'La Tour du Noyau tient bon : les habitants rallongent les pontons, réparent les toits et rouvrent les ateliers. Le district ressemble enfin à un quartier.' },
  3: { nom: 'Le district prospère', texte: 'L’énergie circule, les marchands reviennent, et des maisons neuves poussent sur chaque pilier. On parle de ton district jusque dans les autres quartiers.' },
  4: { nom: 'Le phare de Vertiga', texte: 'La Tour du Noyau illumine la mer. Ton district est devenu un repère, et même les Hauts le regardent.' },
};

/** La fenêtre du nouvel âge : le district a changé de visage (23 octobre 2026, Bryan : « rien ne l'indique du tout ») */
function fenetreAge(j: Jeu): string {
  const age = visuel(j.batiments.noyau);
  const a = AGES[age];
  const suivant = prochainVisuel(j.batiments.noyau);
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="age-titre"><div class="fenetre nouvel-age-fenetre">`
    + `<img class="age-tableau" src="${sceneDistrict(j.batiments.noyau).url}" alt="Ton district à l’âge ${age}" decoding="async">`
    + `<span class="surtitre">TOUR DU NOYAU NIVEAU ${j.batiments.noyau} · ÂGE ${age}</span><h2 id="age-titre">${a.nom}</h2><p>${a.texte}</p>`
    + (suivant ? `<small class="aide">Prochain âge : Tour du Noyau au niveau ${suivant}.</small>` : '')
    + `<button type="button" class="btn prim large" data-action="age-ok">${ICO.ok}Admirer le district</button></div></div>`;
}

export function htmlArchipel(e: EcranDistrict): string {
  const j = e.j;
  // le tableau garde ses proportions (les plaques sont placées en % de l'image) ; au-dessus, son ciel flouté prolonge l'écran.
  // Sur PC, la mer et le ciel du tableau continuent jusqu'aux bords de l'écran (.mer-fond, chargée seulement sur PC : bureau.css)
  const scene = sceneDistrict(j.batiments.noyau);
  let h = `<section class="archipel" aria-label="Ton district"><img class="tableau-fond" src="${scene.url}" alt="" aria-hidden="true">`
    + `<span class="mer-fond${scene.nuit ? ' nuit' : ''}" style="--mer:url(${scene.mer});--reflets:url(${reflets});--horizon:${scene.horizon}%" aria-hidden="true"><i class="mer-reflets"></i></span>`
    + `<div class="toile">${tableau(j)}${zonesBatiments(visuel(j.batiments.noyau), e.selection)}${plaques(e)}</div>`
    + `<div class="archipel-haut">${mission(e)}${appel(e)}</div></section>`;
  h += feuilleBatiment(e);
  const acte = decisionEnAttente(j);
  if (acte) h += fenetreDecision(acte);
  else if (j.choix.length) h += fenetreChoix(j);
  else if (visuel(j.batiments.noyau) > (j.ageVu ?? 1)) h += fenetreAge(j);
  else if (e.retour.length) {
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="retour-titre"><div class="fenetre retour"><span class="surtitre">BON RETOUR, DIRECTEUR</span><h2 id="retour-titre">Pendant ton absence</h2><ul>`
      + e.retour.map((l) => `<li>${ICO[iconeRetour(l)]}<span>${echap(l)}</span></li>`).join('') + `</ul><button type="button" class="btn prim large" data-action="retour-ok">Au travail</button></div></div>`;
  }
  return coquille(e, h, 'ecran-archipel');
}

// ---------- Les cartes ----------

function carteMini(id: string, j: Jeu, attrs = ''): string {
  const m = moduleDef(id);
  const c = j.collection[id];
  const niveau = c?.niveau ?? COLLECTION.niveauDepart[m.rarete];
  return `<button type="button" class="carte-choix" ${attrs}>${faceCarte(m, niveau, multNiveau(id, niveau))}`
    + `<span class="ruban${c ? '' : ' neuve'}">${c ? `Doublon · niv. ${c.niveau}` : 'Nouvelle'}</span></button>`;
}

/** L'effet de la carte, et ce que son métal lui ouvre */
function effetsCarte(m: ReturnType<typeof moduleDef>): string {
  const origine = MODULES.find((x) => x.id === (m.base ?? m.id));
  let h = '';
  if (m.effet) h += `<ul class="effets-carte"><li><b>${echap(NOMS_EFFET[m.effet.type])}</b> ${echap(texteEffet(m.effet))}</li></ul>`;
  else if (origine?.effet) h += `<p class="aide">En fer, pas d’effet. À partir du cuivre : <b>${echap(NOMS_EFFET[origine.effet.type])}</b>, ${echap(texteEffet(origine.effet).replace(/^./, (c) => c.toLowerCase()))}</p>`;
  if (m.f.length > 1 && m.effet?.type !== 'accord') h += `<p class="aide">Fréquences au choix : <b>${m.f.join(' ou ')}</b>. Posée, elle prend celle qui prolonge ta suite.</p>`;
  else if (origine && origine.f.length > m.f.length && m.effet?.type !== 'accord') h += `<p class="aide">Son métal ne lui ouvre qu’une Fréquence ; en argent et en or, elle en a 2, en nacre 3.</p>`;
  return h;
}

function fenetreChoix(j: Jeu): string {
  const c = j.choix[0]!;
  const titre = c.source === 'boss' ? 'Le boss laisse des empreintes' : c.source === 'quotidien' ? 'Objectif du jour' : c.source === 'ravitaillement' ? 'Le septième colis' : c.source === 'fouille' ? 'Le filon de la fouille' : c.source === 'epreuve' ? 'Épreuve réussie' : 'Archive de la semaine';
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="choix-titre"><div class="fenetre choix"><span class="surtitre">RÉCOMPENSE${j.choix.length > 1 ? ` · ENCORE ${j.choix.length - 1} APRÈS` : ''}</span><h2 id="choix-titre">${titre}</h2><p>Choisis une carte. Si tu l’as déjà, elle devient un doublon pour la faire monter.</p><div class="cartes-choix">`
    + c.options.map((id, k) => carteMini(id, j, `data-action="prendre" data-index="${k}"`)).join('')
    + `</div>${c.eclats ? `<button type="button" class="btn sec large" data-action="prendre" data-index="-1">Prendre ${prix('eclats', c.eclats)} à la place</button>` : ''}</div></div>`;
}

const exemplaires = (j: Jeu, moduleId: string) => [...RARETES].reverse().map((r) => carteId(moduleId, r)).filter((k) => j.collection[k]);

export function feuilleCarte(e: EcranDistrict): string {
  const j = e.j;
  const cle = e.carte;
  if (!cle || !j.collection[cle]) return '';
  const m = moduleDef(cle);
  const c = j.collection[cle]!;
  const requis = doublonsRequis(m.id, c.niveau);
  const porte = greffesDe(j, m.id)[0];
  const cout = composantsNiveau(c.niveau + 1);
  const porteurs = PORTEURS.filter((p) => p.lignee === m.lignee && porteursPresents(j).includes(p.id));
  let h = `<div class="voile-feuille" data-action="carte-fermer" aria-hidden="true"></div><section class="feuille carte-detail" role="dialog" aria-modal="true" aria-label="${echap(m.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR_RARETE[m.rarete]}">${NOMS_RARETE[m.rarete].toUpperCase()} · ${NOM_LIGNEE[m.lignee].toUpperCase()} · NIVEAU ${c.niveau}</span><h2>${echap(m.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="effets" aria-label="Les cartes et leurs effets">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="carte-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="detail-haut"><div class="detail-face">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}</div><div class="detail-infos">${effetsCarte(m)}</div></div>`
    + (loreCarte(cle) ? `<blockquote class="lore-carte">${echap(loreCarte(cle)!)}</blockquote>` : '')
    + `<p class="rang-carte"><b style="color:${COULEUR_RARETE[m.rarete]}">${RANG_METAL[m.rarete].rang}</b> · ${echap(RANG_METAL[m.rarete].texte)}</p>`;
  // à qui la confier : la décision la plus fréquente, donc juste sous la carte
  h += `<section class="bloc fc-confier"><h3 class="titre-bloc">${ICO.greffe}${porte ? `Portée par ${echap(porteurDef(porte).nom)}` : 'Confier à'}</h3><p class="fc-aide">${porte ? 'Touche son portrait pour la reprendre, ou un autre Porteur pour la lui passer.' : `Elle entrera dans ton deck quand ce Porteur descendra (${DISTRICT.cartesMax} cartes au plus, de sa lignée).`}</p><div class="fc-porteurs">`
    + porteurs.map((p) => {
      const ici = porte === p.id;
      const n = j.porteurs[p.id]!.modules.length;
      const img = portrait(p.id);
      return `<button type="button" class="fc-porteur${ici ? ' actif' : ''}${n >= DISTRICT.cartesMax && !ici ? ' plein' : ''}" style="--c:${COULEUR[p.lignee]}" data-action="${ici ? 'degreffer' : 'greffer'}" data-module="${cle}" data-id="${p.id}"${enExpedition(j, p.id) ? ' disabled' : ''}>`
        + `<span class="fc-portrait">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : avatar(p.id, 48)}${ici ? `<span class="fc-coche">${ICO.ok}</span>` : ''}</span>`
        + `<strong>${echap(p.nom)}</strong><small>${ici ? 'la porte · reprendre' : n >= DISTRICT.cartesMax ? `${n} / ${DISTRICT.cartesMax} · échanger` : `${n} / ${DISTRICT.cartesMax} cartes`}</small></button>`;
    }).join('') + `</div></section>`;
  // progression : où on en est, et ce qui manque, en clair
  h += `<section class="bloc fc-prog"><h3 class="titre-bloc">${ICO.monter}Progression</h3>`;
  if (requis === null) h += `<p class="fc-etat or">Niveau maximum atteint.</p>`;
  else {
    const pret = c.doublons >= requis;
    const manqueD = Math.max(0, requis - c.doublons);
    const manqueC = Math.max(0, cout - j.composants);
    const etat = !pret ? `Encore <b>${manqueD} doublon${manqueD > 1 ? 's' : ''}</b> pour le niveau ${c.niveau + 1}. On en trouve en expédition, en mission, dans les colis du ravitaillement, au Comptoir et à la Forge.`
      : manqueC ? `Doublons réunis. Il manque <b>${manqueC} composant${manqueC > 1 ? 's' : ''}</b>.` : `Prête : elle peut passer au niveau ${c.niveau + 1}.`;
    h += `<div class="progression"><div class="jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></div><span class="chiffre">${c.doublons} / ${requis} doublons</span></div>`
      + `<p class="fc-etat${pret && !manqueC ? ' or' : ''}">${etat} <span>Niveau ${c.niveau + 1} : +${Math.round(COLLECTION.bonusNiveau * 100)} % de force.</span></p>`
      + `<div class="ligne-btn"><button type="button" class="btn prim" data-action="monter" data-module="${cle}"${pret && j.composants >= cout ? '' : ' disabled'}>${ICO.monter}Passer au niveau ${c.niveau + 1} · ${prix('composants', cout, j.composants >= cout)}</button>`;
    if (c.doublons > 0) h += `<button type="button" class="btn sec" data-action="recycler" data-module="${cle}">${ICO.recycler}Recycler 1 · +${COLLECTION.recyclage[m.rarete]}</button>`;
    h += `</div>`;
  }
  if (requis === null && c.doublons > 0) h += `<div class="ligne-btn"><button type="button" class="btn sec" data-action="recycler" data-module="${cle}">${ICO.recycler}Recycler 1 · +${COLLECTION.recyclage[m.rarete]}</button></div>`;
  h += `</section>`;
  return h + `</div></section>`;
}


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
    return `<button type="button" class="carte-tuile${sel ? ' dk-choisie' : ''}" data-action="${action}" data-module="${cle}" data-id="${id}"${parti ? ' disabled' : ''} aria-pressed="${sel}" aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}">${faceCarte(m, c.niveau, multNiveau(cle, c.niveau))}<span class="tuile-bas">${bas}</span></button>`;
  };
  const tri = e.tri ?? 'puissance';
  const libres = trierCartes(Object.keys(j.collection)
    .filter((k) => moduleDef(k).lignee === p.lignee && !porte.includes(k)), j.collection, tri);
  /** la carte qu'il porte déjà dans un autre métal : la confier la remplace */
  const remplace = (k: string) => porte.find((x) => moduleDe(x) === moduleDe(k));
  let h = `<div class="voile-feuille" data-action="deck-fermer" aria-hidden="true"></div><section class="feuille deck-porteur" role="dialog" aria-modal="true" aria-label="Les cartes de ${echap(p.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR[p.lignee]}">${NOM_LIGNEE[p.lignee].toUpperCase()} · ${porte.length} / ${DISTRICT.cartesMax} CARTES</span><h2>Les cartes de ${echap(p.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="deck" aria-label="Comment construire son deck">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="deck-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  if (parti) h += `<p class="aide">${echap(p.nom)} est en expédition : ses cartes changeront à son retour.</p>`;
  // le tri, en tête : il range les deux listes de la feuille
  h += choixTri(tri);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.greffe}Ce que ${echap(p.nom)} porte</h3><p class="aide">Ces cartes entrent dans ton deck quand ${echap(p.nom)} descend. Touche une carte pour l’échanger ou la reprendre.</p>`;
  const fs = [...new Set(gestesDe(j, id).flatMap((g) => g.fs ?? [g.f]))].sort((a, b) => a - b);
  if (fs.length) h += `<p class="dk-freq">Fréquences qu’il apporte : ${fs.map((f) => `<i style="--fc:${couleurFrequence(f)}">${f}</i>`).join('')}</p>`;
  h += porte.length ? `<div class="grille-cartes">${trierCartes(porte, j.collection, tri).map((k) => tuile(k, 'dk-porte', k === choisie ? `<span class="dk-action dk-remplace">${ICO.recycler}Choisie</span>` : choisie && !choixPorte ? `<span class="dk-action dk-remplace">${ICO.recycler}Échanger</span>` : `<span class="dk-action">${ICO.recycler}Échanger</span>`)).join('')}</div>` : `<p class="aide">Aucune carte pour l’instant.</p>`;
  h += `</section><section class="bloc"><h3 class="titre-bloc">${ICO.cartes}À lui confier</h3>`
    + `<p class="aide">${plein ? `${echap(p.nom)} porte déjà ${DISTRICT.cartesMax} cartes : touche une carte ici puis celle qu’elle remplace (ou l’inverse) pour les échanger.` : `Les cartes de sa lignée (${NOM_LIGNEES[p.lignee]}) dans ta collection. Une carte portée par un autre Porteur passe à ${echap(p.nom)}.`}</p>`;
  // les cartes libres d'abord, puis celles qu'un autre Porteur porte ; chaque groupe dans l'ordre du tri (sort est stable)
  const triees = [...libres].sort((a, b) => Number(!!greffesDe(j, a)[0]) - Number(!!greffesDe(j, b)[0]));
  h += libres.length ? `<div class="grille-cartes">${triees.map((k) => {
    const qui = greffesDe(j, k)[0];
    const r = remplace(k);
    const bas = k === choisie ? `<span class="dk-action dk-remplace">${ICO.recycler}Choisie</span>`
      : choixPorte ? `<span class="dk-action dk-remplace">${ICO.recycler}Échanger</span>`
      : r ? `<span class="dk-action dk-remplace">${ICO.recycler}Remplace celle en ${NOMS_RARETE[moduleDef(r).rarete].toLowerCase()}</span>`
      : qui ? `${avatar(qui, 20)}<span class="dk-chez">chez ${echap(porteurDef(qui).nom)}</span>` : `<span class="dk-action">${ICO.greffe}Confier</span>`;
    // pleine, il ne peut plus en recevoir de nouvelle ; une carte qui en remplace une autre reste possible
    return tuile(k, 'dk-libre', bas).replace('class="carte-tuile"', `class="carte-tuile${plein && !r && !choixPorte ? ' grisee' : ''}"`);
  }).join('')}</div>` : `<p class="aide">Aucune autre carte de sa lignée pour l’instant : les Strates en cachent d’autres.</p>`;
  h += `</section></div>`;
  // la carte choisie attend sa partenaire : le pied de la feuille le dit, toujours visible
  if (choisie && !parti) {
    const nom = echap(moduleDef(choisie).nom);
    h += `<footer class="feuille-pied dk-pied"><p class="dk-consigne">${ICO.recycler}<span><strong>${nom}</strong> ${choixPorte ? `: touche une carte de « À lui confier » pour l’échanger.` : `: touche la carte que ${echap(p.nom)} porte et qu’elle remplacera.`}</span></p>`
      + `<div class="ligne-btn">${choixPorte ? `<button type="button" class="btn sec" data-action="degreffer" data-module="${choisie}">${ICO.retour}Reprendre</button>` : ''}`
      + `<button type="button" class="btn sec" data-action="dk-annuler">Annuler</button></div></footer>`;
  }
  return h + `</section>`;
}

// La collection (revue du 22 octobre 2026, même équipe) : les cartes arrivent tout de suite, des filtres utiles
// (« peuvent monter », « libres ») en plus des lignées, et l'équipement des Porteurs se fait depuis le volet Escouade
// ou en touchant une carte. Depuis le 25 octobre 2026, c'est le troisième volet de l'onglet Escouade.
/** Le choix du tri des cartes (24 octobre 2026) : le même partout où l'on voit une liste de cartes, et retenu d'un écran à l'autre */
function choixTri(tri: TriCartes): string {
  return `<div class="tri-cartes" role="radiogroup" aria-label="Trier les cartes"><span class="tri-label">${ICO.journal}Trier</span>`
    + TRIS.map((t) => `<button type="button" role="radio" class="tri-choix${t.id === tri ? ' actif' : ''}" data-action="tri" data-id="${t.id}" aria-checked="${t.id === tri}" title="${echap(t.texte)}">${t.nom}</button>`).join('')
    + `</div>`;
}

export function htmlCartes(e: EcranDistrict): string {
  const j = e.j;
  const trouvees = MODULES.filter((m) => exemplaires(j, m.id).length).length;
  const toutes = MODULES.flatMap((m) => exemplaires(j, m.id));
  const peutMonter = (cle: string) => {
    const m = moduleDef(cle); const c = j.collection[cle]!; const requis = doublonsRequis(m.id, c.niveau);
    return requis !== null && c.doublons >= requis && j.composants >= composantsNiveau(c.niveau + 1);
  };
  const portees = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
  const estLibre = (cle: string) => !portees.has(cle);
  const nMonter = toutes.filter(peutMonter).length;
  const nLibres = toutes.filter(estLibre).length;
  const f = e.filtre;
  let h = entete(`${trouvees} / ${MODULES.length} TROUVÉES`, 'Collection', `<div class="cl-guides">${lienGuide('deck', 'Construire son deck')}${lienGuide('carte', 'Les effets')}</div>`);
  h += voletsEscouade(e);
  const filtres: { id: Filtre; nom: string; n?: number; c?: string; classe?: string }[] = [
    { id: 'tout', nom: 'Toutes' }, { id: 'tech', nom: NOM_LIGNEES.tech, c: COULEUR.tech }, { id: 'bio', nom: NOM_LIGNEES.bio, c: COULEUR.bio }, { id: 'reso', nom: NOM_LIGNEES.reso, c: COULEUR.reso },
    { id: 'monter', nom: 'Peuvent monter', n: nMonter, classe: 'or' }, { id: 'libres', nom: 'Libres', n: nLibres },
  ];
  h += `<div class="cl-filtres" role="tablist" aria-label="Filtrer la collection">` + filtres.map((x) =>
    `<button type="button" role="tab" class="es-cible${f === x.id ? ' actif' : ''}${x.classe ? ` ${x.classe}` : ''}"${x.c ? ` style="--c:${x.c}"` : ''} data-action="filtre" data-id="${x.id}" aria-selected="${f === x.id}">${x.nom}${x.n !== undefined ? ` <b>${x.n}</b>` : ''}</button>`).join('') + `</div>`;
  const tri = e.tri ?? 'puissance';
  h += choixTri(tri);
  h += `<p class="cl-intro">Toutes tes cartes. Touche-en une pour la confier à un Porteur ou la faire monter ; ton deck est dans le volet Escouade.</p>`;

  const tuileCarte = (cle: string) => {
    const m = moduleDef(cle);
    const c = j.collection[cle]!;
    const requis = doublonsRequis(m.id, c.niveau);
    const porte = greffesDe(j, m.id)[0];
    const pret = peutMonter(cle);
    return `<button type="button" class="carte-tuile cl-carte${pret ? ' pret' : ''}" data-action="carte" data-id="${cle}" aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}${porte ? `, portée par ${echap(porteurDef(porte).nom)}` : ', libre'}${pret ? ', peut monter' : ''}">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}`
      + `<span class="cl-bas"><span class="cl-porteur">${porte ? `${avatar(porte, 20)}<span>${echap(porteurDef(porte).nom)}</span>` : '<span class="cl-libre">Libre</span>'}</span>`
      + (requis === null ? `<span class="cl-max">Niveau max</span>` : `<span class="cl-doublons" title="Doublons pour le niveau ${c.niveau + 1}"><span class="mini-jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></span><span>${c.doublons}/${requis}</span></span>`)
      + `</span>${pret ? `<span class="cl-monter">${ICO.monter}Peut monter</span>` : ''}${e.j.vus.cartes.includes(cle) ? '' : `<span class="ruban-nouveau">Nouvelle</span>`}</button>`;
  };

  if (f === 'monter' || f === 'libres') {
    const liste = trierCartes(toutes.filter(f === 'monter' ? peutMonter : estLibre), j.collection, tri);
    h += `<h2 class="titre-section">${f === 'monter' ? 'Peuvent monter' : 'Libres : personne ne les porte'}</h2>`
      + (liste.length ? `<div class="grille-cartes">${liste.map(tuileCarte).join('')}</div>`
        : `<p class="cl-vide">${f === 'monter' ? 'Aucune carte n’a encore assez de doublons et de composants pour monter.' : 'Toutes tes cartes sont confiées à un Porteur.'}</p>`);
  } else {
    const lignees: Lignee[] = f === 'tout' ? ['tech', 'bio', 'reso'] : [f];
    for (const lignee of lignees) {
      h += `<h2 class="titre-section" style="--c:${COULEUR[lignee]}">${NOM_LIGNEES[lignee]}</h2><div class="grille-cartes">`;
      // les cartes trouvées, triées ; celles qui restent à trouver à la fin
      const bases = MODULES.filter((x) => x.lignee === lignee);
      for (const cle of trierCartes(bases.flatMap((b) => exemplaires(j, b.id)), j.collection, tri)) h += tuileCarte(cle);
      for (const base of bases.filter((b) => !exemplaires(j, b.id).length)) h += `<div class="carte-dos cl-dos" aria-label="Carte pas encore trouvée">${gemme(base.rarete)}<span>?</span><small>À trouver</small><em>Fouille « ${echap(CIBLES_FOUILLE[lignee].nom)} »</em></div>`;
      h += `</div>`;
    }
  }
  // le paquetage du district : dans chaque deck, jamais dans la collection (on le montre pour qu'on sache d'où il vient)
  if (f === 'tout') {
    h += `<h2 class="titre-section" style="--c:#CDEFFF">Paquetage du district</h2>`
      + `<p class="cl-intro">Fourni à chaque escouade qui descend, en plus des cartes de tes Porteurs. Ces cartes restent même si un Porteur tombe ; elles n’ont pas de métal et ne montent pas de niveau.</p>`
      + `<div class="grille-cartes">` + GESTES_SPECIAUX.map((g) => {
        const o = ORIGINE_PAQUETAGE[g.id]!;
        const m: ModuleDef = { id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) };
        return `<div class="carte-tuile cl-carte cl-paquetage">${faceCarte(m, 1, 1, { origine: o.batiment })}<span class="cl-bas"><span class="cl-origine">${echap(o.texte)}</span></span></div>`;
      }).join('') + `</div>`;
  }
  // le mode d'emploi prend la place des autres feuilles ; en le fermant, on retrouve celle d'où on venait
  if (e.guide) h += feuilleGuide(e.guide, trouveesDe(j.collection));
  else h += feuilleCarte(e) + feuilleDeck(e);
  if (j.choix.length) h += fenetreChoix(j);
  return coquille(e, h, 'ecran-cartes cl');
}

// ---------- La rencontre, avant la chambre scellée ----------

const REPLIQUES: { id: string; texte: string }[] = [
  { id: 'ilka', texte: '« On attend quoi, l’Élu ? Qu’elle s’ouvre toute seule ? »' },
  { id: 'doran', texte: '« Mon père a travaillé dans ce puits, avant qu’on le mure. Il n’a jamais aimé son silence. »' },
  { id: 'vela', texte: '« Quelque chose a peur, derrière cette porte. Et ce n’est pas moi. »' },
  // pourquoi ces trois-là : chacun dit ce qui l'amène (22 octobre 2026, Bryan : « c'est à expliquer dans le jeu »)
  { id: 'ilka', texte: '« Les ouvriers m’ont envoyée te chercher à l’aube. Quand ça presse, c’est moi qu’on envoie. Et là, ça presse. »' },
  { id: 'doran', texte: '« En dessous, il y a les couloirs qu’on a murés en 2060. Je suis le dernier à savoir où ils passent. »' },
  { id: 'vela', texte: '« Oui, j’ai une mèche d’or. Mais je suis d’ici, pas des Hauts. Ce qui dort derrière, je l’entends : vous ne descendrez pas sans moi. »' },
];

/** nombre de répliques de la rencontre (main.ts avance d'une à chaque toucher) */
export const NB_REPLIQUES = REPLIQUES.length;

/** Où parle chacun : position de la bulle à l'écran et direction de sa pointe vers le personnage */
const BULLES: Record<string, string> = { ilka: 'b-ilka', doran: 'b-doran', vela: 'b-vela' };

/** La rencontre en scène : l'illustration du trio devant la porte, et les répliques en bulles, une par toucher */
export function htmlRencontre(n = 0): string {
  const fini = n >= REPLIQUES.length;
  let h = `<section class="scene-rencontre${fini ? ' finie' : ''}" data-action="rencontre-suite" style="--image:url(./intro/00-titre.webp)" aria-label="La porte scellée">`
    + `<div class="rencontre-fond" aria-hidden="true"><div class="rencontre-image"><img src="./intro/00-titre.webp" alt="" decoding="async"><span class="t-porte"></span><span class="t-flamme"></span><span class="t-halo"></span></div></div>`
    + `<header class="rencontre-haut"><div><span class="label">SOUS LA TOUR DU NOYAU</span><h1>La porte scellée</h1></div><button type="button" class="btn-sec" data-action="archipel">Plus tard</button></header>`
    + `<p class="recitatif">Une porte ronde, scellée depuis les années 2060, luit faiblement. Trois personnes t’attendent devant.</p>`;
  // une bulle par personnage : sa dernière réplique remplace la précédente, pour ne pas couvrir l'image
  const vues = REPLIQUES.slice(0, n);
  vues.forEach((r, i) => {
    if (vues.slice(i + 1).some((x) => x.id === r.id)) return;
    const d = porteurDef(r.id);
    h += `<div class="bulle ${BULLES[r.id]}${i === n - 1 ? ' neuve' : ''}" style="--c:${COULEUR[d.lignee]}"><strong>${echap(d.nom)}</strong><p>${echap(r.texte.replace(/^« | »$/g, ''))}</p></div>`;
  });
  h += `<footer class="rencontre-bas">${fini ? '' : `<span class="indice-bulle">Touche l’écran pour les écouter</span>`}`
    + `<button type="button" class="btn prim large appel-porte${fini ? '' : ' discrete'}" data-action="briefing">${ICO.porte}Ouvrir la porte</button></footer></section>`;
  return h;
}

// ---------- La Bibliothèque : Chroniques et Archives ----------

/** Chapitres des Chroniques ouverts mais pas encore lus (pour la pastille « nouveau ») */
const chapitresNouveaux = (j: Jeu) => CHAPITRES.filter((c) => chapitreOuvert(c, j.strate) && !j.lus.includes(c.id)).length;

/** La Bibliothèque du district : les Chroniques d'Ysé et les Archives trouvées dans les Strates */
export function htmlCodex(e: EcranDistrict): string {
  const j = e.j;
  if (e.onglet === 'chroniques' && e.chapitre) {
    const c = chapitreDef(e.chapitre);
    if (c && chapitreOuvert(c, j.strate)) return coquille(e, htmlChapitre(e, c.id), 'ecran-lecture');
  }
  const ouverts = CHAPITRES.filter((c) => chapitreOuvert(c, j.strate)).length;
  const retour = e.retourBiblio === 'titre' ? `<button type="button" class="btn-icone" data-action="biblio-retour" aria-label="Retour à l’écran titre">${ICO.retour}</button>` : '';
  let h = entete(`${ouverts} / ${CHAPITRES.length} CHAPITRES · ${j.fragments.length} / ${FRAGMENTS.length} ARCHIVES`, 'Bibliothèque', retour);
  const nouveaux = chapitresNouveaux(j);
  h += `<div class="segments-choix trois" role="tablist">`
    + `<button type="button" role="tab" class="seg${e.onglet === 'chroniques' ? ' actif' : ''}" aria-selected="${e.onglet === 'chroniques'}" data-action="biblio-onglet" data-id="chroniques">Chroniques${nouveaux ? ` <span class="pastille-n">${nouveaux}</span>` : ''}</button>`
    + `<button type="button" role="tab" class="seg${e.onglet === 'archives' ? ' actif' : ''}" aria-selected="${e.onglet === 'archives'}" data-action="biblio-onglet" data-id="archives">Archives</button>`
    + `<button type="button" role="tab" class="seg${e.onglet === 'campagne' ? ' actif' : ''}" aria-selected="${e.onglet === 'campagne'}" data-action="biblio-onglet" data-id="campagne">Campagne</button></div>`;
  if (e.onglet === 'campagne') return coquille(e, h + htmlListeScenes(j.scenes ?? []), 'ecran-codex');
  if (e.onglet === 'archives') {
    h += `<p class="aide intro-ecran">Des papiers d’époque, trouvés un à un dans les Strates. Ysé y renvoie souvent dans ses Chroniques.</p>`;
    if (!j.fragments.length) h += `<p class="vide-ecran">${ICO.codex}Aucun fragment pour l’instant. On les trouve en ouvrant de nouvelles Strates.</p>`;
    j.fragments.forEach((id, i) => {
      const f = FRAGMENTS.find((x) => x.id === id);
      if (!f) return;
      h += `<article class="fragment"><span class="surtitre">N° ${String(i + 1).padStart(2, '0')} · ${echap(f.support.toUpperCase())}</span><h2>${echap(f.titre)}</h2>${f.lignes.map((l) => `<p>${echap(l)}</p>`).join('')}</article>`;
    });
    const reste = FRAGMENTS.length - j.fragments.length;
    if (reste > 0) h += `<div class="fragment enfoui">${ICO.verrou}<span>${reste} fragment${reste > 1 ? 's' : ''} encore enfoui${reste > 1 ? 's' : ''} dans les Strates</span></div>`;
    return coquille(e, h, 'ecran-codex');
  }
  h += `<p class="chroniques-intro"><img class="yse-medaillon" src="${portraitYse}" alt="Ysé" decoding="async">Les Chroniques d’Ysé, archiviste des Veilleurs de Sédime, écrites pour toi la troisième nuit après ton élection.</p>`;
  for (const livre of [1, 2, 3] as const) {
    const chapitres = CHAPITRES.filter((x) => x.livre === livre);
    const lus = chapitres.filter((c) => chapitreOuvert(c, j.strate) && j.lus.includes(c.id)).length;
    const [numLivre, nomLivre] = LIVRES[livre].split(' · ');
    h += `<section class="livre"><header class="livre-tete"><span class="surtitre">${echap(numLivre!.toUpperCase())}</span><h2>${echap(nomLivre ?? '')}</h2>`
      + `<span class="livre-compte">${lus} / ${chapitres.length} lus</span></header><div class="rayon">`;
    for (const c of chapitres) {
      const n = String(CHAPITRES.indexOf(c) + 1).padStart(2, '0');
      const img = `<img src="./intro/${imageChapitre(c)}.webp" alt="" loading="lazy" decoding="async">`;
      if (chapitreOuvert(c, j.strate)) {
        const neuf = !j.lus.includes(c.id);
        h += `<button type="button" class="chapitre-tuile${neuf ? ' neuf' : ''}" data-action="chapitre" data-id="${c.id}">${img}`
          + `<span class="chap-num">CH. ${n}</span>`
          + (!j.luesRecompensees.includes(c.id) ? `<span class="chap-don">+1 carte</span>` : `<span class="chap-lu" aria-label="Lu">${ICO.ok}</span>`)
          + `<span class="chap-bas"><strong>${echap(c.titre)}</strong><small>${echap(c.epoque)}</small></span></button>`;
      } else {
        h += `<div class="chapitre-tuile ferme" aria-disabled="true">${img}<span class="chap-num">CH. ${n}</span><span class="chap-verrou" aria-hidden="true">${ICO.verrou}</span>`
          + `<span class="chap-bas"><strong>${echap(c.titre)}</strong>${c.teaser ? `<small>${echap(c.teaser)}</small>` : ''}<em>${ICO.strate}Strate −${c.strate}</em></span></div>`;
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
    + `<span><small>${sens === 'prec' ? 'Chapitre précédent' : 'Chapitre suivant'}</small><strong>${echap(x.titre)}</strong></span>${sens === 'prec' ? ICO.retour : ICO.lancer}</button>`;
  let h = `<article class="lecture"><div class="lecture-progres" aria-hidden="true"></div>`;
  h += `<figure class="lecture-planche" aria-hidden="true"><img src="./intro/${imageChapitre(c)}.webp" alt="" decoding="async"></figure>`;
  h += `<div class="lecture-page"><button type="button" class="btn sec petit lecture-retour" data-action="chapitre-fermer">${ICO.retour}Sommaire</button>`
    + `<header class="lecture-titre"><span class="surtitre">${echap(LIVRES[c.livre].split(' · ')[0]!.toUpperCase())} · CHAPITRE ${i + 1}</span><h1>${echap(c.titre)}</h1><span class="epoque">${echap(c.epoque)}</span></header>`;
  h += `<div class="lecture-texte">`;
  c.paragraphes.forEach((p, n) => {
    const signature = n === c.paragraphes.length - 1 && p.startsWith('Ysé') && p.length < 80;
    h += `<p${signature ? ' class="signature"' : n === 0 ? ' class="lettrine"' : ''}>${typo(echap(p))}</p>`;
  });
  h += `</div><nav class="lecture-nav">`
    + (suiv ? suite(suiv, 'suiv')
      : `<p class="aide">${prochainFerme ? `La suite s’ouvrira à la Strate −${prochainFerme.strate}.` : 'Fin des Chroniques. Pour l’instant.'}</p>`)
    + (prec ? suite(prec, 'prec') : '')
    + `</nav></div></article>`;
  return h;
}

// ---------- La Tour du Noyau en coupe ----------

const NOMS_ETAGES = ['Salle de fouilles', 'Bunker des années 2060', 'Galerie aux formes courbes', 'Ruines lumineuses'];

/** la barre d'expérience, fine et dorée, sous la jauge de PV */
export function barreXp(j: EcranDistrict['j'], id: string): string {
  const n = niveauPorteur(j, id);
  return `<div class="barre-xp" title="${n.requis ? `${n.xp} / ${n.requis} XP vers le niveau ${n.niveau + 1}` : 'Niveau maximum'}"><i style="width:${n.requis ? Math.round((100 * n.xp) / n.requis) : 100}%"></i></div>`;
}

export function jaugePv(pv: number, max: number, usure = 0, usureM = 1): string {
  return `<div class="jauge-pv"><i class="pv" style="width:${(100 * pv) / max}%"></i>${usure >= 1 ? `<i class="usure" style="width:${(100 * Math.min(usure, usureM)) / max}%"></i>` : ''}</div>`;
}

// La Tour du Noyau en coupe (revue du 22 octobre 2026, même équipe que la feuille de bâtiment et l'Escouade) :
// la coupe peinte en tête avec les habitants en bande, la prochaine étape avec ses boutons, puis les Strates
// qui descendent dans le bon sens (−1 en haut, la roche à creuser tout en bas).
export function htmlCoupe(e: EcranDistrict): string {
  const j = e.j;
  let h = entete(`EN COUPE · ${j.strate} ÉTAGE${j.strate > 1 ? 'S' : ''} CREUSÉ${j.strate > 1 ? 'S' : ''}`, 'Tour du Noyau');
  const presents = PORTEURS.filter((p) => porteursPresents(j).includes(p.id));
  const libres = presents.filter((p) => disponibles(j).includes(p.id)).length;
  h += `<section class="tr-heros"><img class="tr-coupe" src="${decor('coupe')}" alt="" decoding="async">`
    + `<button type="button" class="tr-habitants" data-action="porteurs" aria-label="Habitants : ${presents.length} Porteurs, ${libres} disponibles. Voir les Porteurs">`
    + `<span class="tr-hab-avatars">${presents.map((p) => {
      const d = j.porteurs[p.id]!;
      const etat = enExpedition(j, p.id) ? 'parti' : d.poste ? 'travail' : 'libre';
      return `<span class="tr-hab ${etat}">${avatar(p.id, 36)}<i></i></span>`;
    }).join('')}</span><span class="tr-hab-txt"><b>${libres} disponible${libres > 1 ? 's' : ''}</b> sur ${presents.length} · Voir les Porteurs ${ICO.retour}</span></button></section>`;

  // la prochaine étape, avec de quoi la faire tout de suite
  const off = !!j.expedition || !j.chambre;
  const cible = j.strate + 1;
  const manque = manquePourCreuser(j);
  let etape = '';
  if (!j.frontVaincu) {
    etape = `<strong>Vaincs le gardien de la Strate −${j.strate}</strong><small>C’est lui qui garde le passage : une fois vaincu, tes creuseurs pourront attaquer la roche.</small>`
      + `<div class="tr-boutons"><button type="button" class="btn prim" data-action="descendre" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.descendre}Descendre à −${j.strate}</button></div>`;
  } else if (manque) {
    const morceaux: string[] = [];
    if (manque.creuseurs) morceaux.push(`trouve <b>${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}</b>`);
    if (manque.noyau) morceaux.push(`monte la Tour du Noyau au <b>niveau ${noyauRequis(cible)}</b> pour les loger`);
    etape = `<strong>Pour ouvrir la Strate −${cible}</strong><small>${morceaux.join(', puis ').replace(/^./, (c) => c.toUpperCase())}.</small>`
      + (manque.creuseurs ? `<ul class="tr-sources"><li>${ICO.cristal}<span>Fouille ciblée</span><b>${Math.round(CREUSEURS.fouille * 100)} %</b></li>`
        + `<li>${ICO.porteurs}<span>Mission</span><b>${Math.round(CREUSEURS.missionCourte * 100)} à ${Math.round(CREUSEURS.missionLongue * 100)} %</b></li>`
        + `<li>${ICO.boost}<span>Épreuve <em>(1re victoire de la semaine)</em></span><b>assuré</b></li></ul>` : '')
      + `<div class="tr-boutons">${manque.creuseurs ? `<button type="button" class="btn prim" data-action="fouiller-choix" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.cristal}Fouiller la Strate −${j.strate}</button>` : ''}`
      + `${manque.noyau ? `<button type="button" class="btn ${manque.creuseurs ? 'sec' : 'prim'}" data-action="batiment" data-id="noyau" data-amelio>${ICO.tour}Améliorer la Tour</button>` : ''}</div>`;
  } else {
    etape = `<strong>La roche cède : la Strate −${cible} va s’ouvrir</strong><small>Tout est prêt. Descends pour découvrir le nouvel étage.</small>`
      + `<div class="tr-boutons"><button type="button" class="btn prim" data-action="descendre" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.descendre}Descendre</button></div>`;
  }
  if (j.expedition) h += `<button type="button" class="appel tr-reprendre" data-action="reprendre">${ICO.descendre}<span><strong>Expédition en cours</strong><small>Strate −${j.expedition.strate} : reprendre le combat</small></span></button>`;
  // une seule carte en tête (refonte du 25 octobre 2026) : le chapitre en cours (pourquoi on descend), puis ce qu'il faut faire
  const chap = j.chambre ? chapitreCampagne(contexteCampagne(j)) : null;
  const derniere = j.scenes?.at(-1);
  h += `<section class="tr-etape">`
    + (chap ? `<div class="tr-chapitre"><span class="surtitre">${echap(chap.sur)} · ${echap(chap.titre)}</span>`
      + (derniere ? `<button type="button" class="tr-revoir" data-action="scene-revoir" data-id="${derniere}" aria-label="Revoir la dernière scène">${ICO.film}Revoir</button>` : '')
      + `<p>${echap(chap.texte)}</p></div>` : '')
    + `<span class="surtitre tr-prochaine">Prochaine étape</span>${etape}</section>`;
  // le Grand Tableau : ton rang en profondeur, et l'entrée vers les classements
  if (j.chambre && e.grand) h += bandeauTableau(e, e.grand, e.uid ?? null);

  // trois volets au lieu d'une page sans fin : les Strates, les Épreuves, les missions
  const ouvert = j.chambre && strateVaincue(j) >= 1;
  const volet = ouvert ? e.ongletTour ?? 'strates' : 'strates';
  if (ouvert) {
    const faites = epreuvesDeLaSemaine(e.now).filter((ep) => j.epreuves.faites.includes(ep.id)).length;
    const nEp = epreuvesDeLaSemaine(e.now).length;
    const seg = (id: typeof volet, nom: string, plus: string) =>
      `<button type="button" role="tab" class="seg${volet === id ? ' actif' : ''}" data-action="tour-volet" data-id="${id}" aria-selected="${volet === id}">${nom}<small>${plus}</small></button>`;
    h += `<div class="segments-choix trois tr-volets" role="tablist" aria-label="Strates, Épreuves ou missions">`
      + seg('strates', 'Strates', `${j.strate} creusée${j.strate > 1 ? 's' : ''}`)
      + seg('epreuves', 'Épreuves', `${faites} / ${nEp} cette semaine`)
      + seg('missions', 'Missions', `${j.missions.length} / ${MISSIONS.max} en cours`)
      + `</div>`;
  }
  if (volet === 'epreuves') h += htmlEpreuves(e);
  else if (volet === 'missions') h += htmlMissions(e);
  else h += htmlStrates(e, off, manque);
  if (j.chambre && !ouvert) h += `<p class="tr-note">${ICO.verrou}Les Épreuves et les missions s’ouvrent quand le gardien de la Strate −1 est vaincu.</p>`;
  h += feuilleBatiment(e);
  return coquille(e, h, 'ecran-coupe tr');
}

/** Les Strates, de −1 à la roche : ce qu'on peut y faire, expliqué une fois en tête plutôt qu'à chaque ligne */
function htmlStrates(e: EcranDistrict, off: boolean, manque: ReturnType<typeof manquePourCreuser>): string {
  const j = e.j;
  const cible = j.strate + 1;
  let h = `<section class="tr-strates" aria-label="Les Strates">`
    + `<ul class="tr-legende"><li>${ICO.cristal}<span><b>Fouiller</b> : une descente courte, sans gardien, vers un filon (cartes, composants ou Éclats).</span></li>`
    + `<li>${ICO.descendre}<span><b>Explorer</b> : toute la Strate, salle par salle, jusqu’à son gardien.</span></li></ul><ol>`;
  for (let n = 1; n <= j.strate; n++) {
    const front = n === j.strate;
    const vaincue = !front || j.frontVaincu;
    const nom = NOMS_ETAGES[Math.min(n - 1, NOMS_ETAGES.length - 1)];
    const zone = zoneDe(n);
    const img = decorStrate(ZONES_STRATES.indexOf(zone));
    h += `<li class="tr-strate${front ? ' front' : ''}${vaincue ? ' vaincue' : ''}">`
      + `<span class="tr-vignette">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : ''}<b>−${n}</b></span>`
      + `<div class="tr-infos"><strong>${nom}</strong><small>${echap(zone.nom)}${vaincue ? ` · ${ICO.ok}vaincue` : ' · <em>front : son gardien t’attend</em>'}</small>`
      + `<div class="tr-actions">${vaincue ? `<button type="button" class="btn sec" data-action="fouiller-choix" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.cristal}Fouiller</button>` : ''}`
      + `<button type="button" class="btn ${front && !j.frontVaincu ? 'prim' : 'sec'}" data-action="descendre" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.descendre}Explorer</button></div></div></li>`;
  }
  // la roche, tout en bas
  const requis = creuseursRequis(cible);
  const loge = logementCreuseurs(j);
  const logementBloque = !!manque?.noyau;
  h += `<li class="tr-strate roche${j.frontVaincu && !manque ? ' prete' : ''}"><span class="tr-vignette"><b>−${cible}</b></span><div class="tr-infos"><strong>Roche à creuser</strong>`
    + (requis ? `<span class="tr-creuseurs"><b>${Math.min(j.creuseurs, requis)} / ${requis}</b> creuseurs</span><div class="tr-jauge"><i style="width:${Math.min(100, (100 * j.creuseurs) / requis)}%"></i></div>` : '')
    + `<small>${!j.frontVaincu ? `S’ouvre après le gardien de la Strate −${j.strate}.` : manque ? 'Il manque encore de quoi la percer : voir « Prochaine étape ».' : 'Tout est prêt.'}</small>`
    + (logementBloque ? `<small class="tr-loge">La Tour loge ${loge} creuseurs au niveau ${j.batiments.noyau} : il en faut la place pour ${requis}.</small>` : '')
    + `</div></li></ol></section>`;
  return h;
}

// ---------- Le front de taille : les creuseurs ----------


// ---------- Épreuves de la semaine et missions ----------

function htmlEpreuves(e: EcranDistrict): string {
  const j = e.j;
  const st = strateEpreuve(j);
  const gardien = ennemiDef(zoneDe(st).boss).nom;
  let h = `<section class="bloc tr-volet"><p class="aide">Un combat contre ${echap(gardien)} (Strate −${st}), avec une règle qui change ta façon de jouer. La première victoire de chaque Épreuve rapporte une carte au choix, dont une en argent au moins. ${decompte(lundiSuivant(e.now), e.now, 'Nouvelles Épreuves lundi, dans ', '.')}</p><div class="epreuves">`;
  for (const ep of epreuvesDeLaSemaine(e.now)) {
    const faite = j.epreuves.faites.includes(ep.id);
    h += `<div class="epreuve${faite ? ' faite' : ''}"><div><strong>${echap(ep.nom)}</strong><small>${echap(ep.regle)}</small>`
      + `<small class="gain">${faite ? `${ICO.ok}Réussie cette semaine` : `${ICO.cartes}1 carte au choix, argent au moins`}</small></div>`
      + `<button type="button" class="btn ${faite ? 'sec' : 'prim'}" data-action="epreuve" data-id="${ep.id}"${j.expedition ? ' disabled' : ''}>${faite ? 'Rejouer' : 'Tenter'}</button></div>`;
  }
  return h + `</div></section>`;
}

function htmlMissions(e: EcranDistrict): string {
  const j = e.j;
  const st = strateMission(j);
  let h = `<section class="bloc tr-volet"><p class="aide">Un Porteur qui ne travaille pas peut partir en mission dans la Strate −${st}, équipé d’un peu d’énergie. La mission avance même jeu fermé : il rapporte des composants et des doublons de cartes de sa lignée, et un peu d’Usure.</p>`;
  for (const m of j.missions) {
    const p = porteurDef(m.porteur);
    h += `<div class="en-cours" style="--c:${COULEUR[p.lignee]}">${avatar(p.id, 36)}<div><strong>${echap(p.nom)} · Strate −${m.strate}</strong><small>${e.now >= m.fin ? 'Sur le retour' : decompte(m.fin, e.now, 'Retour dans ')}</small><div class="jauge or">${jaugeTemps(m.debut, m.fin, e.now)}</div></div></div>`;
  }
  const libres = disponibles(j);
  if (j.missions.length >= MISSIONS.max) h += `<small class="aide">${MISSIONS.max} missions au plus en même temps.</small>`;
  else if (!libres.length) h += `<small class="aide">Tous les Porteurs travaillent ou sont partis : libère-en un d’un bâtiment pour l’envoyer.</small>`;
  else {
    h += `<ul class="missions-libres">`;
    for (const id of libres) {
      const p = porteurDef(id);
      h += `<li style="--c:${COULEUR[p.lignee]}">${avatar(id, 36)}<span><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]} · PV ${pvMaxCombat(j, id)}</small></span>`
        + (['courte', 'longue'] as const).map((d) => `<button type="button" class="btn sec mission-duree" data-action="mission" data-id="${id}" data-duree="${d}"${j.energie >= MISSIONS[d].energie ? '' : ' disabled'} aria-label="Mission de ${MISSIONS[d].heures} heures, ${MISSIONS[d].energie} énergie"><span>${MISSIONS[d].heures} h</span>${prix('energie', MISSIONS[d].energie, j.energie >= MISSIONS[d].energie)}</button>`).join('') + `</li>`;
    }
    h += `</ul>`;
  }
  return h + `</section>`;
}

// ---------- Choix de l'escouade ----------

/** Les Fréquences d'une liste de cartes (une carte à plusieurs Fréquences compte pour chacune ; les cartes ∗ à part) */
export function frequencesDe(cartes: { f: number; fs?: number[]; effet?: { type: string } }[]): number[] {
  return Array.from({ length: 9 }, (_, i) => cartes.filter((g) => (g.fs ?? [g.f]).includes(i + 1) && g.effet?.type !== 'accord').length);
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
  const bref = lignee ? '3 cartes au choix au filon' : c === 'composants' ? 'selon les combats gagnés' : '2 à 3 Éclats au filon';
  return `<button type="button" role="radio" class="es-tuile${choisie === c ? ' actif' : ''}${lignee ? ' carte' : ''}" style="--c:${lignee ? COULEUR[c] : c === 'eclats' ? 'var(--reso)' : '#8FB8DA'}" data-action="cible" data-id="${c}" aria-checked="${choisie === c}">`
    + `${ico}<strong>${echap(CIBLES_FOUILLE[c].nom)}</strong><small>${bref}</small></button>`;
}

export function htmlEscouade(e: EcranDistrict): string {
  const j = e.j;
  const ep = e.epreuve ? epreuveDef(e.epreuve) ?? null : null;
  const fouille = ep ? null : e.fouille;
  const deck = deckEscouade(j, e.escouade).filter((g) => !ep?.filtre || g.porteur === null || ep.filtre(g)).length;
  const deckMin = ep ? EPREUVE_DECK_MIN : DISTRICT.deckMin;
  const zone = zoneDe(e.strateChoisie);
  const pi = !ep && !fouille ? e.pillage ?? null : null;
  const titre = pi ? `PILLAGE · ${pi.nom.toUpperCase()}` : ep ? `ÉPREUVE · ${ep.nom.toUpperCase()}` : `${fouille ? 'FOUILLE · ' : ''}STRATE −${e.strateChoisie} · ${NOMS_ETAGES[Math.min(e.strateChoisie - 1, 3)]!.toUpperCase()}`;
  let h = `<div class="ecran ecran-escouade es"><main class="contenu">`
    + entete(titre, 'Escouade', `<button type="button" class="btn-icone" data-action="${pi ? 'pillages' : 'coupe'}" aria-label="Retour">${ICO.retour}</button>`);

  // 1. ce qu'on part faire
  h += `<section class="es-mission">`;
  if (pi) {
    // la cible : sa garnison, et les chances de l'escouade choisie (elles changent avec l'escouade)
    const ecart = pi.force / Math.max(0.01, forceEscouade(j, e.escouade));
    const d = difficulte(ecart);
    const b = butinPillage(pi, ecart);
    h += `<p class="es-but">${ICO.grappin}<span><strong>Pillage · ${echap(pi.nom)}</strong>Un seul combat contre sa garnison : ${pi.porteurs.map((id) => echap(porteurDef(id).nom)).join(', ')}.</span></p>`
      + `<div class="es-pillage d${d.niveau}"><span class="es-pillage-visages">${pi.porteurs.map((id) => avatar(id, 34)).join('')}</span>`
      + `<span><b>${d.nom}</b><small>${e.escouade.length === 3 ? `${Math.round(chanceVictoire(ecart) * 100)} % de chances avec cette escouade` : 'Choisis 3 Porteurs'}</small></span>`
      + `<span class="es-pillage-butin">${ICO.composants}<b>+${ent(b.base + b.vol)}</b></span></div>`;
  } else if (ep) {
    h += `<p class="es-but">${ICO.boost}<span><strong>${echap(ep.nom)}</strong>${echap(ep.regle)} Un seul combat, contre ${echap(ennemiDef(zone.boss).nom)}.</span></p>`;
  } else if (fouille) {
    h += `<p class="es-but">${ICO.cristal}<span><strong>Fouille ciblée · ${echap(zone.nom)}</strong>Une descente courte, sans gardien : quelques salles, puis le filon.</span></p>`
      // ce que l'on cherche : des tuiles toujours visibles, en deux groupes (24 octobre 2026 : la fouille de cartes passait inaperçue,
      // cachée au bout d'une rangée qui défilait et commençait sur « Composants »)
      + `<h3 class="es-cibles-titre">Que cherches-tu ?</h3>`
      + `<div class="es-cibles-grille" role="radiogroup" aria-label="Ce que tu cherches">`
      + (['tech', 'bio', 'reso'] as CibleFouille[]).map((c) => tuileCible(c, fouille)).join('')
      + (['composants', 'eclats'] as CibleFouille[]).map((c) => tuileCible(c, fouille)).join('') + `</div>`
      + `<p class="es-cible-texte">${echap(CIBLES_FOUILLE[fouille].texte)}</p>`;
  } else {
    h += `<p class="es-but">${ICO.strate}<span><strong>${echap(zone.nom)}</strong>Une carte à explorer salle par salle : combats, caches, rencontres, campement, puis le gardien : ${echap(ennemiDef(zone.boss).nom)}.</span></p>`;
  }
  h += `</section>`;

  // 2. quelle escouade part (25 octobre 2026) : on choisit une des trois escouades composées dans l'onglet Escouade,
  // on ne compose plus ici (la grille de tous les Porteurs prenait l'écran)
  const toutes = escouadesDe(j);
  const active = escouadeActive(j);
  h += `<section class="es-equipes" aria-label="Escouade qui part"><div class="es-equipes-tete"><span class="surtitre">Quelle escouade part ?</span>`
    + `<button type="button" class="es-modifier" data-action="escouade-modifier">${ICO.porteurs}Modifier</button></div>`
    + `<div class="es-equipes-choix" role="radiogroup" aria-label="Escouade qui part">`
    + toutes.map((l, k) => {
      const n = deckEscouade(j, l).length;
      return `<button type="button" role="radio" class="es-equipe${k === active ? ' actif' : ''}${l.length ? '' : ' vide'}" data-action="depart-escouade" data-index="${k}" aria-checked="${k === active}"${l.length ? '' : ' disabled'}>`
        + `<strong>Escouade ${k + 1}</strong><span class="es-equipe-visages">${[0, 1, 2].map((i) => (l[i] ? avatar(l[i]!, 30) : '<i class="es-pastille-vide"></i>')).join('')}</span>`
        + `<small>${l.length ? `${l.length < 3 ? `${l.length} / 3 · ` : ''}${n} cartes` : 'Vide'}</small></button>`;
    }).join('') + `</div></section>`;

  // les trois Porteurs qui partent : toucher un portrait ouvre sa fiche
  h += `<section class="es-trio" aria-label="Porteurs qui partent">` + [0, 1, 2].map((i) => {
    const id = e.escouade[i];
    if (!id) return `<button type="button" class="es-place vide" data-action="escouade-modifier"><span class="es-silhouette" aria-hidden="true"></span><b>${i + 1}</b><small>Place libre · compléter l’escouade</small></button>`;
    const p = porteurDef(id);
    const img = portrait(id);
    const nCartes = j.porteurs[id]!.modules.length;
    const m = progresMarque(j, id);
    const pv = pvMaxCombat(j, id);
    return `<div class="es-place" style="--c:${COULEUR[p.lignee]}">`
      + `<button type="button" class="es-portrait" data-action="porteur" data-id="${id}" aria-label="Fiche de ${echap(p.nom)}">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 72)}`
      + `<span class="es-nom"><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]} · PV ${pv}</small></span></button>`
      + `<button type="button" class="es-cartes${nCartes ? '' : ' aucune'}${nCartes >= DISTRICT.cartesMax ? ' pleine' : ''}" data-action="deck" data-id="${id}">${ICO.cartes}<span>${nCartes} / ${DISTRICT.cartesMax} cartes</span></button>`
      + (m ? `<button type="button" class="es-marque${m.acquise ? ' acquise' : ''}" data-action="porteur" data-id="${id}" title="${echap(m.texte)}">${m.acquise ? ICO.ok : ICO.verrou}<span><b>${echap(m.nom)}</b> ${m.acquise ? echap(m.court) : `${Math.min(m.n, m.seuil)} / ${m.seuil} ${echap(m.quoi)}`}</span></button>` : '')
      + (posteQuitte(j, id) ? `<span class="es-quitte">${ICO.ouvrier}<span>${echap(textePosteQuitte(j, id)!)}</span></span>` : '')
      + `</div>`;
  }).join('') + `</section>`;

  // 3. ce que donne leur deck
  const maigre = e.escouade.length === 3 && deck < deckMin;
  if (e.escouade.length) {
    const cartes = deckEscouade(j, e.escouade);
    const n = frequencesDe(cartes);
    const jokers = cartes.filter((g) => g.effet?.type === 'accord').length;
    const suite = plusLongueSuite(n, jokers);
    h += `<section class="es-deck" aria-label="Le deck de l’escouade"><div class="es-deck-tete"><span class="surtitre">Le deck · ${deck} cartes</span>${lienGuide('deck', 'Bien construire son deck')}</div>`
      + `<div class="es-freq" role="img" aria-label="Fréquences du deck : ${n.map((k, i) => `${i + 1} : ${k}`).join(', ')}">`
      + n.map((k, i) => `<span class="es-f${k ? '' : ' trou'}${suite.includes(i + 1) ? ' suite' : ''}${i && n[i - 1] && k ? ' lie' : ''}" style="--fc:${couleurFrequence(i + 1)}"><b>${i + 1}</b><small>${k ? `×${k}` : '—'}</small></span>`).join('')
      + `</div><p class="es-freq-aide">Des chiffres qui se suivent font des Résonances${suite.length >= 2 ? ` : ta plus longue suite va de <b>${suite[0]} à ${suite[suite.length - 1]}</b>` : ''}. Un chiffre absent coupe la suite${jokers ? ` · ${jokers} carte${jokers > 1 ? 's' : ''} ∗ comble${jokers > 1 ? 'nt' : ''} n’importe quel trou` : ''}.</p>`;
    if (maigre) {
      const aRemplir = e.escouade.filter((id) => j.porteurs[id]!.modules.length < DISTRICT.cartesMax);
      const cible = aRemplir.sort((x, y) => j.porteurs[x]!.modules.length - j.porteurs[y]!.modules.length)[0];
      h += `<div class="es-alerte">${ICO.cartes}<span><strong>Il manque ${deckMin - deck} carte${deckMin - deck > 1 ? 's' : ''}</strong> (${deckMin} au moins). `
        + `${aRemplir.length ? `Confie des cartes à ${aRemplir.map((id) => `${echap(porteurDef(id).nom)} (${j.porteurs[id]!.modules.length}/${DISTRICT.cartesMax})`).join(', ')}.` : 'Choisis des Porteurs qui portent plus de cartes.'}</span>`
        + (cible ? `<button type="button" class="btn sec" data-action="deck" data-id="${cible}">Confier</button>` : '') + `</div>`;
    }
    h += `</section>`;
  }

  const vacants = e.escouade.filter((id) => posteQuitte(j, id));
  if (vacants.length) {
    const et = (l: string[]) => l.length > 1 ? `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}` : l[0]!;
    const lieux = vacants.map((id) => posteQuitte(j, id) === 'noyau' ? 'l’entraînement à la Tour' : batimentDef(posteQuitte(j, id)!).nom);
    const pl = vacants.length > 1;
    h += `<p class="es-note es-note-poste">${ICO.ouvrier}<span>Au départ, ${et(vacants.map((id) => `<b>${echap(porteurDef(id).nom)}</b>`))} quitte${pl ? 'nt leur' : ' son'} poste : ${et(lieux)} ${lieux.length > 1 ? 'resteront' : 'restera'} sans Porteur jusqu’à ce que tu y remettes quelqu’un.</span></p>`;
  }
  h += `<p class="es-note">${ICO.soin}Après l’expédition, chacun gagne de l’Usure : la Clinique la soigne pendant qu’il se repose.</p></main>`;

  const pret = e.escouade.length === 3 && !maigre;
  h += `<footer class="pied-fixe es-pied"><div class="es-pied-info"><span class="es-avatars">${[0, 1, 2].map((i) => e.escouade[i] ? avatar(e.escouade[i]!, 30) : '<i class="es-pastille-vide"></i>').join('')}</span>`
    + `<span><b>${e.escouade.length} / 3</b><small class="${maigre ? 'alerte' : e.escouade.length === 3 ? 'ok' : ''}">${e.escouade.length < 3 ? `Encore ${3 - e.escouade.length} Porteur${3 - e.escouade.length > 1 ? 's' : ''}` : maigre ? `${deck} cartes · ${deckMin} au moins` : `${deck} cartes, prêt`}</small></span></div>`
    + `<button type="button" class="btn prim large" data-action="partir"${pret ? '' : ' disabled'}>${pi ? `${ICO.grappin}Piller` : ep ? `${ICO.boost}Tenter l’Épreuve` : fouille ? `${ICO.cristal}Fouiller` : `${ICO.descendre}Partir`}</button></footer>`;
  h += e.guide ? feuilleGuide(e.guide, trouveesDe(j.collection)) : e.deck ? feuilleDeck(e) : feuillePorteur(e);
  h += e.message ? `<button type="button" class="toast seul" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(e.message)}</span></button>` : '';
  return h + `</div>`;
}

export { POSTES };
