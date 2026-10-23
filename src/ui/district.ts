// Écrans du district : l'archipel (accueil), la Tour du Noyau en coupe, l'escouade, les cartes, le Codex.
// Le district est un tableau Midjourney par âge (public/art/district/age-N), l'âge suit la Tour du Noyau ;
// les plaques cliquables des bâtiments sont posées dessus, le détail s'ouvre en feuille par le bas.

import { NOMS_EFFET, texteEffet } from '../core/effets';
import { MODULES, PORTEURS, ZONES as ZONES_STRATES, batimentDef, carteId, ennemiDef, moduleDe, moduleDef, porteurDef, zoneDe } from '../core/donnees';
import {
  ARCHIVE, CIBLES_FOUILLE, CREUSEURS, creuseursRequis, logementCreuseurs, manquePourCreuser, noyauRequis, DISTRICT, EPREUVE_DECK_MIN, MISSIONS, POSTES, QUOTIDIENS, enMission, epreuveDef, epreuvesDeLaSemaine, strateEpreuve, strateMission, chantierDe, chantiersMax, coutAmelioration, coutRefabrication, disponibles, dureeChantier, dureeFabrication, energieParHeure, enExpedition, deckEscouade, gestesDe, greffesDe, lundiSuivant, objectifCourant, porteursPresents, posteDe, colisDisponible, colisAvantChoix, RAVITAILLEMENT, pvMaxCombat, quotidienActif, quotidienFait, soinParHeure, stockage, usureMax, type Jeu, type Poste, DECISIONS, decisionEnAttente, humeurDistrict, progresMarque, type Acte, niveauPorteur, pvNiveau, gainsAmelioration, type GainNiveau,
  COMPTOIR, prixComptoir, plafondEntrainement, xpEntrainement, debutJour
} from '../core/jeu';
import { COLLECTION, NOMS_RARETE, RARETES, composantsNiveau, doublonsRequis, multNiveau } from '../core/collection';
import type { BatimentId, Lignee, Rarete } from '../core/types';
import type { CibleFouille } from '../core/expedition';
import { FRAGMENTS } from '../core/fragments';
import { loreCarte } from '../core/lore-cartes';
import { CHAPITRES, LIVRES, chapitreDef, chapitreOuvert } from '../core/chroniques';
import { COULEUR, echap } from './vue';
import { decor, decorStrate, illustrationBatiment, portrait, prochainVisuel, reflets, sceneDistrict, visuel } from './art';
import { COULEUR_RARETE, faceCarte, couleurFrequence } from './carte';
import { feuilleGuide, lienGuide, trouveesDe } from './guide';
import { feuillePorteur } from './porteurs';
import { ICO, type Icone } from './icones';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, couts, duree, ent, entete, prix, type EcranDistrict, type Filtre } from './coquille';

import './district.css';

export type { EcranDistrict, Vue } from './coquille';

export { COULEUR_RARETE };

const gemme = (r: Rarete) => `<i class="gemme g-${r}" style="--r:${COULEUR_RARETE[r]}" title="${NOMS_RARETE[r]}" aria-hidden="true"></i>`;

// ---------- L'archipel ----------

type Lieu = BatimentId;
/** Où se trouve chaque bâtiment dans le tableau de chaque âge (repère 400 × 600, haut de la plaque) */
const LIEUX: Record<1 | 2 | 3 | 4, Record<Lieu, { x: number; y: number }>> = {
  1: { noyau: { x: 200, y: 232 }, generateur: { x: 322, y: 228 }, forge: { x: 128, y: 500 }, clinique: { x: 322, y: 345 }, comptoir: { x: 305, y: 470 } },
  2: { noyau: { x: 222, y: 205 }, generateur: { x: 92, y: 205 }, forge: { x: 332, y: 262 }, clinique: { x: 340, y: 385 }, comptoir: { x: 300, y: 478 } },
  3: { noyau: { x: 205, y: 212 }, generateur: { x: 78, y: 182 }, forge: { x: 328, y: 212 }, clinique: { x: 78, y: 430 }, comptoir: { x: 300, y: 470 } },
  4: { noyau: { x: 205, y: 248 }, generateur: { x: 62, y: 232 }, forge: { x: 322, y: 250 }, clinique: { x: 72, y: 452 }, comptoir: { x: 300, y: 505 } },
};
const ORDRE: Lieu[] = ['noyau', 'generateur', 'forge', 'clinique', 'comptoir'];
/**
 * Les bâtiments eux-mêmes sont cliquables (22 octobre 2026, Bryan : sur téléphone, les plaques seules faisaient de petites cibles
 * qui se chevauchaient). Le contour de chaque lieu dans le tableau de chaque âge, repère 400 × 600 (relevé sur les tableaux).
 */
const ZONES: Record<1 | 2 | 3 | 4, Record<Lieu, string>> = {
  1: {
    noyau: '150,65 240,70 235,150 262,290 215,322 160,300 148,180',
    generateur: '245,130 380,115 392,240 330,252 245,232',
    forge: '80,358 222,368 242,522 130,548 58,470',
    clinique: '288,262 372,268 392,372 300,382 283,320',
    comptoir: '292,395 400,400 400,522 300,522',
  },
  2: {
    noyau: '155,55 282,55 292,230 262,282 165,272 150,170',
    generateur: '18,112 142,112 152,242 60,252 8,225',
    forge: '280,105 382,108 396,272 285,276 275,190',
    clinique: '285,305 392,312 396,398 290,402',
    comptoir: '238,428 372,432 378,502 244,502',
  },
  3: {
    noyau: '140,25 256,30 262,210 242,332 170,332 140,220',
    generateur: '8,75 132,75 142,200 60,248 4,200',
    forge: '262,120 400,130 400,332 300,322 262,232',
    clinique: '38,330 152,330 162,472 60,482 18,420',
    comptoir: '250,400 392,410 386,512 258,506',
  },
  4: {
    noyau: '160,5 246,5 252,210 272,382 150,372 130,252 165,200',
    generateur: '14,128 126,128 142,282 30,292 8,230',
    forge: '270,145 400,150 400,346 300,342 255,250',
    clinique: '18,335 152,345 157,522 50,532 4,460',
    comptoir: '255,420 392,425 392,522 260,522',
  },
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
export function degagerPlaques(racine: HTMLElement) {
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
  if (!place || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
 * L'âge légendaire n'a pas de boucle vidéo (celle de Midjourney ratait) : on l'anime en code.
 * La lueur du cristal pulse, des éclats tournent autour de lui, la mer scintille et un reflet doré passe lentement.
 */
const SCINTILLES: [number, number, number][] = [[12, 45, 0], [22, 52, 2.1], [38, 74, 4.3], [48, 81, 1.2], [55, 94, 3.4], [76, 62, 5.2], [91, 72, 2.7]];
const ANIMATION_LEGENDAIRE = '<i class="lueur-cristal" aria-hidden="true"></i>'
  // chaque éclat suit une ellipse : un va-et-vient horizontal et un vertical décalé d'un quart de tour
  + `<span class="orbite-cristal" aria-hidden="true">${[0, 3.2, 6.4, 9.6, 12.8].map((p) => `<span class="ox" style="animation-delay:-${p}s"><span class="oy" style="animation-delay:-${p + 4}s"><i></i></span></span>`).join('')}</span>`
  + `<span class="scintilles" aria-hidden="true">${SCINTILLES.map(([x, y, d]) => `<i style="left:${x}%;top:${y}%;animation-delay:${d}s"></i>`).join('')}</span>`
  + '<i class="reflet-dore" aria-hidden="true"></i>';

function tableau(j: Jeu): string {
  const s = sceneDistrict(j.batiments.noyau);
  const nouveau = ageAffiche !== 0 && ageAffiche !== s.age;
  ageAffiche = s.age;
  return `<img class="tableau${s.nuit ? ' nuit' : ''}${nouveau ? ' nouvel-age' : ''}" src="${s.url}" alt="" draggable="false"/>`
    + (s.video ? `<div class="anime" data-video="${s.video}"></div>` : '')
    + (s.age === 4 ? ANIMATION_LEGENDAIRE : '')
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
    const d = batimentDef(id);
    const prete = id === 'forge' && !!j.forge && e.now >= j.forge.fin;
    const ch = chantierDe(j, id);
    // l'objectif « Construire ton deck » se fait dans les Cartes, pas sur la Tour du Noyau
    const vise = !!o && o.pilier === id && !o.fait(j) && o.titre !== 'Construire ton deck';
    const occupant = id !== 'comptoir' ? posteDe(j, id) : null;
    let etat = '';
    if (ch) etat = `<small class="en-chantier">${ICO.marteau}${duree(ch.fin - e.now)}</small>`;
    else if (id === 'comptoir') {
      // le Comptoir : à construire, ou ce qui reste en vente aujourd'hui
      const reste = j.comptoir.offres.length - j.comptoir.achetes.length;
      etat = !j.batiments.comptoir ? `<small class="vacant">${ICO.marteau}À construire</small>`
        : reste > 0 ? `<small class="occupe">${ICO.cartes}${reste} en vente</small>` : `<small>${ICO.ok}Tout vendu</small>`;
    }
    else if (id === 'noyau') etat = occupant ? `<small class="occupe">${avatar(occupant, 14)}${echap(porteurDef(occupant).nom)} s’entraîne</small>` : '';
    else if (prete) etat = `<small class="pret">${ICO.ok}Prêt</small>`;
    else if (j.forge && id === 'forge') etat = `<small>${ICO.chrono}${duree(j.forge.fin - e.now)}</small>`;
    else if (!occupant) etat = `<small class="vacant">${ICO.ouvrier}Personne</small>`;
    else if (occupant) etat = `<small class="occupe">${avatar(occupant, 14)}${echap(porteurDef(occupant).nom)}</small>`;
    return `<button type="button" class="plaque${e.selection === id ? ' choisie' : ''}${vise ? ' visee' : ''}" ${pos} data-action="batiment" data-id="${id}" data-lieu="${id}" aria-label="${echap(d.nom)}${j.batiments[id] ? `, niveau ${j.batiments[id]}` : ', à construire'}">`
      + `<span class="plaque-nom">${j.batiments[id] ? `<b class="niv">${j.batiments[id]}</b>` : ''}${echap(d.nom)}</span>${etat}${prete || vise ? '<i class="pastille-alerte" aria-hidden="true"></i>' : ''}</button>`;
  }).join('');
}

/** La mission du moment, posée en haut du tableau */
function mission(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  if (o) {
    const fait = o.fait(j);
    const gain = `${o.recompense.energie ? prix('energie', o.recompense.energie) : ''}${o.recompense.composants ? prix('composants', o.recompense.composants) : ''}`;
    return `<section class="mission${fait ? ' faite' : ''}" aria-label="Objectif"><div class="mission-tete"><span class="surtitre">OBJECTIF ${j.objectif + 1} / 3</span><span class="gains">${gain}</span></div>`
      + `<strong>${echap(o.titre)}</strong>`
      + (fait ? `<button type="button" class="btn prim" data-action="reclamer">${ICO.ok}Récupérer la récompense</button>` : `<p>${echap(o.consigne)}</p>`)
      + `</section>`;
  }
  if (!j.chambre) return '';
  const q = j.quotidien;
  const def = QUOTIDIENS[q.type];
  const max = ARCHIVE.paliers[ARCHIVE.paliers.length - 1]!;
  const crans = ARCHIVE.paliers.map((p) => `<i class="cran${j.archive.points >= p ? ' atteint' : ''}" style="left:${(p / max) * 100}%"></i>`).join('');
  let h = `<section class="mission jour${quotidienFait(j) ? ' faite' : ''}" aria-label="Objectif du jour">`;
  if (quotidienActif(j)) {
    h += `<div class="mission-tete"><span class="surtitre">OBJECTIF DU JOUR${q.reserve > 1 ? ` · ${q.reserve} EN RÉSERVE` : ''}</span><span class="chiffre">${q.progres} / ${def.objectif}</span></div><strong>${echap(def.titre)}</strong>`
      + (quotidienFait(j)
        ? `<button type="button" class="btn prim" data-action="reclamer-jour">${ICO.coffre}Récupérer : une carte ou 2 Éclats</button>`
        : `<div class="jauge"><i style="width:${(100 * q.progres) / def.objectif}%"></i></div>`);
  } else h += `<div class="mission-tete"><span class="surtitre">OBJECTIF DU JOUR</span></div><small class="aide">Tous faits : le prochain arrive demain.</small>`;
  h += `<div class="confiance" title="${echap(humeurDistrict(j))}"><span class="surtitre">CONFIANCE · ${j.confiance}</span><div class="jauge"><i style="width:${j.confiance}%"></i></div><small>${echap(humeurDistrict(j))}</small></div>`;
  h += `<div class="archive"><span class="surtitre">ARCHIVE · ${Math.min(j.archive.points, max)}/${max}</span><div class="jauge reso">${crans}<i style="width:${Math.min(100, (100 * j.archive.points) / max)}%"></i></div><small>lundi, dans ${duree(lundiSuivant(e.now) - e.now)}</small></div>`;
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
    return `<button type="button" class="appel reso" data-action="ouvrir-archive">${ICO.coffre}<span><strong>L’Archive de la semaine est prête</strong><small>Palier ${j.archive.aOuvrir} sur ${ARCHIVE.paliers.length} atteint : ouvre-la</small></span></button>`;
  }
  if (colisDisponible(j)) {
    const reste = colisAvantChoix(j);
    return `<button type="button" class="appel colis" data-action="colis">${ICO.coffre}<span><strong>Ravitaillement du jour${j.ravitaillement.reserve > 1 ? ` · ${j.ravitaillement.reserve} colis` : ''}</strong>`
      + `<small>Composants et un doublon · ${reste === 1 ? 'celui-ci contient une carte au choix' : `carte au choix dans ${reste} colis`}</small></span>`
      + `<span class="crans-colis" aria-hidden="true">${Array.from({ length: RAVITAILLEMENT.cycle }, (_, i) => `<i class="${i < j.ravitaillement.ouverts % RAVITAILLEMENT.cycle ? 'plein' : ''}"></i>`).join('')}</span></button>`;
  }
  return '';
}

// ---------- La feuille d'un bâtiment ----------
// Revue du 22 octobre 2026 (lisibilité, direction artistique, game design) : l'îlot en grand en tête,
// des chiffres réels plutôt que des multiplicateurs (« +60 énergie/h », pas « ×2 »), des Porteurs qui
// tiennent dans l'écran, la réserve remplie / maximum, et le niveau suivant juste au-dessus du bouton.

const virgule = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

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

/** Une ressource du coût : ce qu'il faut, et ce qui manque s'il en manque */
function coutDetail(icone: Icone, besoin: number, possede: number, nom: string): string {
  const manque = Math.max(0, besoin - possede);
  return `<span class="fb-prix${manque ? ' court' : ''}" title="${nom} : ${ent(possede)} / ${ent(besoin)}">${ICO[icone]}<b>${ent(besoin)}</b>${manque ? `<small>manque ${ent(manque)}</small>` : ''}</span>`;
}

/** Une réserve : jauge remplie / maximum et ce qu'elle dit */
function reserve(j: Jeu, b: BatimentId): string {
  const max = stockage(j);
  const v = Math.min(j.energie, max);
  const eph = energieParHeure(j);
  const plein = v >= max;
  const note = plein ? (eph > 0 ? 'Pleine : ce que produit le Générateur est perdu.' : 'Pleine.')
    : eph > 0 ? `Pleine dans ${duree(((max - v) / eph) * 3_600_000)}.` : '';
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
  let h = `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.monter}Entraînement</h3>`
    + `<p class="fb-vide">Un Porteur posté ici s’entraîne avec les creuseurs : <b>+${xph} XP par heure</b>, même jeu fermé, jusqu’au <b>niveau ${plafond}</b>. Il ne descend pas pendant ce temps.</p>`;
  const niveau = (id: string) => niveauPorteur(j, id).niveau;
  if (occupant) {
    const o = porteurDef(occupant);
    const n = niveauPorteur(j, occupant);
    const fini = n.niveau >= plafond;
    const reste = !fini && n.requis ? Math.ceil(((n.requis - n.xp) / xph) * 3_600_000) : 0;
    h += `<div class="fb-occupant" style="--c:${COULEUR[o.lignee]}"><span class="fb-cand-portrait">${avatar(occupant, 64)}</span><div><strong>${echap(o.nom)}</strong><span class="fb-lignee">Niveau ${n.niveau} · ${pvNiveau(j, occupant)} PV</span>`
      + `<span class="fb-apport">${fini ? `Plafond atteint : monte la Tour pour aller plus loin` : `Niveau ${n.niveau + 1} dans ${duree(reste)}`}</span></div>`
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
    return `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.cartes}Une fois construit</h3><p class="fb-vide">Chaque jour, <b>${COMPTOIR.etals[1]!.length} cartes</b> en vente (fer et cuivre), une fois chacune. Il montera jusqu’à ${COMPTOIR.etals[5]!.length} cartes par jour, avec de l’argent après la Strate −${COMPTOIR.strateArgent}. L’or et la nacre restent à trouver dans les Strates.</p></section>`;
  }
  const c = j.comptoir;
  const demain = debutJour(c.jour + 1) - e.now;
  let h = `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.cartes}En vente aujourd’hui<span class="cp-renouv">${ICO.chrono}nouvelles cartes dans ${duree(demain)}</span></h3><div class="cp-etals">`;
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

function feuilleBatiment(e: EcranDistrict): string {
  const j = e.j;
  const b = e.selection;
  if (!b) return '';
  const d = batimentDef(b);
  const niv = j.batiments[b];
  const pv = prochainVisuel(niv);
  const crans = Array.from({ length: d.niveauMax }, (_, i) => `<i class="${i < niv ? 'plein' : ''}"></i>`).join('');
  const surtitre = niv ? `Niveau ${niv} <span class="fb-max">/ ${d.niveauMax}</span>` : 'À construire';
  const ideal = d.affinite ? `<span class="fb-ideal" style="--c:${COULEUR[d.affinite]}">${ICO.porteurs}Idéal : ${NOM_LIGNEE[d.affinite]} <b>×${virgule(DISTRICT.bonusAffinite)}</b></span>` : '';
  let h = `<div class="voile-feuille" data-action="fermer" aria-hidden="true"></div><section class="feuille fiche-bat" role="dialog" aria-modal="true" aria-labelledby="feuille-titre">`
    + `<span class="poignee" aria-hidden="true"></span><button type="button" class="btn-icone fb-fermer" data-action="fermer" aria-label="Fermer">${ICO.fermer}</button>`
    + `<div class="feuille-corps fb-corps"><header class="fb-heros"><div class="fb-scene" aria-hidden="true"><span class="fb-halo"></span><img class="fb-ilot${niv ? '' : ' vide'}" src="${illustrationBatiment(b, Math.max(1, niv))}" alt="" decoding="async"></div>`
    + `<div class="fb-titre"><span class="surtitre">${surtitre}</span><h2 id="feuille-titre">${echap(d.nom)}</h2>`
    + `<span class="fb-crans" aria-hidden="true">${crans}</span>${ideal}</div></header>`;
  h += `<p class="fb-role">${echap(d.role)}${pv !== null && pv <= d.niveauMax && pv > niv + 1 ? ` <span>Nouvelle apparence au niveau ${pv}.</span>` : ''}</p>`;

  // ce que le bâtiment rapporte
  if (b === 'generateur') h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.energie}<b>+${ent(energieParHeure(j))}</b><small>énergie par heure</small></div></div>${reserve(j, b)}`;
  if (b === 'clinique') h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.soin}<b>−${virgule(soinParHeure(j))}</b><small>Usure par heure, pour chaque Porteur au repos</small></div></div>`;
  if (b === 'noyau') {
    h += `<div class="fb-chiffres"><div class="fb-chiffre">${ICO.strate}<b>−${j.strate}</b><small>Strate ouverte</small></div><div class="fb-chiffre">${ICO.tour}<b>${niv}</b><small>niveau maximum des autres bâtiments</small></div></div>${reserve(j, b)}`
      + `<button type="button" class="btn prim large" data-action="entrer">${ICO.tour}Entrer dans la tour</button>`
      + blocEntrainement(j);
  }
  if (b === 'comptoir') h += blocComptoir(e);

  // le Porteur au travail
  if (b !== 'noyau' && b !== 'comptoir') {
    const poste = b;
    const occupant = posteDe(j, poste);
    const actuel = rendement(j, poste, occupant);
    h += `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.ouvrier}Au travail</h3>`;
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
    h += `<section class="fb-bloc"><h3 class="titre-bloc">${ICO.marteau}Refabriquer une carte</h3>`;
    if (j.forge) {
      const m = moduleDef(j.forge.moduleId);
      const fait = Math.min(1, (e.now - j.forge.debut) / (j.forge.fin - j.forge.debut));
      h += `<div class="en-cours">${gemme(m.rarete)}<div><strong>${echap(m.nom)}</strong><small>${e.now >= j.forge.fin ? 'Prête : elle rejoint tes cartes' : `Reste ${duree(j.forge.fin - e.now)}`}</small><div class="jauge or"><i style="width:${fait * 100}%"></i></div></div></div>`;
    } else {
      const forgeron = posteDe(j, 'forge');
      h += `<p class="aide">Un exemplaire de plus devient un doublon, pour faire monter la carte.${forgeron ? '' : ' <b>Poste d’abord un Porteur à la Forge.</b>'}</p><ul class="liste-forge">`;
      const possedees = Object.keys(j.collection).map(moduleDef).sort((x, y) => RARETES.indexOf(y.rarete) - RARETES.indexOf(x.rarete) || x.nom.localeCompare(y.nom));
      for (const m of possedees) {
        const c = coutRefabrication(m.id);
        const assez = j.composants >= c.composants && j.eclats >= c.eclats;
        h += `<li style="--r:${COULEUR_RARETE[m.rarete]}">${gemme(m.rarete)}<div class="lf-nom"><strong>${echap(m.nom)}</strong><small>${ICO.chrono}${duree(dureeFabrication(j, m.id))}</small></div>`
          + `<span class="lf-prix">${couts(j, { composants: c.composants, eclats: c.eclats })}</span>`
          + `<button type="button" class="btn sec petit" data-action="fabriquer" data-module="${m.id}"${assez && forgeron ? '' : ' disabled'} aria-label="Refabriquer ${echap(m.nom)}">${ICO.marteau}</button></li>`;
      }
      h += `</ul>`;
    }
    h += `</section>`;
  }

  const ch = chantierDe(j, b);
  const cout = coutAmelioration(j, b);
  if (cout && !ch) h += gainsNiveau(j, b);
  h += `</div>`;

  // le pied : l'amélioration, toujours visible
  h += `<footer class="feuille-pied fb-pied">`;
  if (ch) {
    const fait = Math.min(1, (e.now - ch.debut) / (ch.fin - ch.debut));
    h += `<div class="chantier-cours">${ICO.marteau}<div><strong>Chantier vers le niveau ${niv + 1}</strong><small>Reste ${duree(ch.fin - e.now)} · avance même jeu fermé</small><div class="jauge or"><i style="width:${fait * 100}%"></i></div></div></div>`;
  } else if (cout) {
    const bloque = b !== 'noyau' && niv >= j.batiments.noyau;
    const assez = j.energie >= cout.energie && j.composants >= cout.composants && j.eclats >= (cout.eclats ?? 0);
    const plein = j.chantiers.length >= chantiersMax(j) || (b === 'noyau' && j.chantiers.length > 0);
    const raison = bloque ? `Il faut d’abord monter la Tour du Noyau (niveau ${j.batiments.noyau}).`
      : plein ? (b === 'noyau' && j.chantiers.length ? 'Attends la fin des chantiers en cours.' : chantiersMax(j) === 1 ? 'Un seul chantier à la fois (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.')
        : !assez ? 'Il manque des ressources.' : '';
    h += `<div class="fb-cout"><span class="surtitre">Coût</span>`
      + (cout.energie ? coutDetail('energie', cout.energie, j.energie, 'Énergie') : '')
      + (cout.composants ? coutDetail('composants', cout.composants, j.composants, 'Composants') : '')
      + (cout.eclats ? coutDetail('eclats', cout.eclats, j.eclats, 'Éclats') : '') + `</div>`;
    if (raison) h += `<p class="fb-raison">${ICO.verrou}<span>${raison}</span>${bloque ? `<button type="button" class="fb-lien" data-action="batiment" data-id="noyau">Voir la Tour</button>` : ''}</p>`;
    h += `<button type="button" class="btn prim large fb-ameliorer" data-action="ameliorer" data-id="${b}"${assez && !bloque && !plein ? '' : ' disabled'}>${niv ? `${ICO.monter}Passer au niveau ${niv + 1}` : `${ICO.marteau}Construire le ${echap(d.nom)}`}</button>`;
  } else h += `<small class="raison">Niveau maximum pour cette version.</small>`;
  return h + `</footer></section>`;
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

function feuilleCarte(e: EcranDistrict): string {
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
    + (loreCarte(cle) ? `<blockquote class="lore-carte">${echap(loreCarte(cle)!)}</blockquote>` : '');
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
    const etat = !pret ? `Encore <b>${manqueD} doublon${manqueD > 1 ? 's' : ''}</b> pour le niveau ${c.niveau + 1}. On en trouve en fouillant et dans les colis du ravitaillement.`
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
  const tuile = (cle: string, action: string, bas: string) => {
    const m = moduleDef(cle);
    const c = j.collection[cle]!;
    return `<button type="button" class="carte-tuile" data-action="${action}" data-module="${cle}" data-id="${id}"${parti ? ' disabled' : ''} aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}">${faceCarte(m, c.niveau, multNiveau(cle, c.niveau))}<span class="tuile-bas">${bas}</span></button>`;
  };
  const libres = Object.keys(j.collection)
    .filter((k) => moduleDef(k).lignee === p.lignee && !porte.includes(k) && !porte.some((x) => moduleDe(x) === moduleDe(k)))
    .sort((a, b) => moduleDef(a).nom.localeCompare(moduleDef(b).nom, 'fr'));
  let h = `<div class="voile-feuille" data-action="deck-fermer" aria-hidden="true"></div><section class="feuille deck-porteur" role="dialog" aria-modal="true" aria-label="Les cartes de ${echap(p.nom)}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR[p.lignee]}">${NOM_LIGNEE[p.lignee].toUpperCase()} · ${porte.length} / ${DISTRICT.cartesMax} CARTES</span><h2>Les cartes de ${echap(p.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide" data-id="deck" aria-label="Comment construire son deck">${ICO.aide}</button>`
    + `<button type="button" class="btn-icone" data-action="deck-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  if (parti) h += `<p class="aide">${echap(p.nom)} est en expédition : ses cartes changeront à son retour.</p>`;
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.greffe}Ce que ${echap(p.nom)} porte</h3><p class="aide">Ces cartes entrent dans ton deck quand ${echap(p.nom)} descend. Touche une carte pour la reprendre.</p>`;
  const fs = [...new Set(gestesDe(j, id).flatMap((g) => g.fs ?? [g.f]))].sort((a, b) => a - b);
  if (fs.length) h += `<p class="dk-freq">Fréquences qu’il apporte : ${fs.map((f) => `<i style="--fc:${couleurFrequence(f)}">${f}</i>`).join('')}</p>`;
  h += porte.length ? `<div class="grille-cartes">${porte.map((k) => tuile(k, 'degreffer', `<span class="dk-action">${ICO.retour}Reprendre</span>`)).join('')}</div>` : `<p class="aide">Aucune carte pour l’instant.</p>`;
  h += `</section><section class="bloc"><h3 class="titre-bloc">${ICO.cartes}À lui confier</h3>`
    + `<p class="aide">${plein ? `${echap(p.nom)} porte déjà ${DISTRICT.cartesMax} cartes : reprends-en une d’abord.` : `Les cartes de sa lignée (${NOM_LIGNEES[p.lignee]}) dans ta collection. Une carte portée par un autre Porteur passe à ${echap(p.nom)}.`}</p>`;
  const triees = [...libres].sort((a, b) => Number(!!greffesDe(j, a)[0]) - Number(!!greffesDe(j, b)[0]));
  h += libres.length ? `<div class="grille-cartes${plein ? ' grisee' : ''}">${triees.map((k) => { const qui = greffesDe(j, k)[0]; return tuile(k, 'greffer', qui ? `${avatar(qui, 20)}<span class="dk-chez">chez ${echap(porteurDef(qui).nom)}</span>` : `<span class="dk-action">${ICO.greffe}Confier</span>`); }).join('')}</div>` : `<p class="aide">Aucune autre carte de sa lignée pour l’instant : les Strates en cachent d’autres.</p>`;
  return h + `</section></div></section>`;
}

// La collection (revue du 22 octobre 2026, même équipe) : les cartes arrivent tout de suite, des filtres utiles
// (« peuvent monter », « libres ») en plus des lignées, et l'équipement des Porteurs se fait depuis l'onglet Porteurs
// ou en touchant une carte (la rangée « Construire le deck » faisait doublon).
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
  let h = entete(`COLLECTION · ${trouvees} / ${MODULES.length} TROUVÉES`, 'Cartes', `<div class="cl-guides">${lienGuide('deck', 'Construire son deck')}${lienGuide('carte', 'Les effets')}</div>`);
  const filtres: { id: Filtre; nom: string; n?: number; c?: string; classe?: string }[] = [
    { id: 'tout', nom: 'Toutes' }, { id: 'tech', nom: NOM_LIGNEES.tech, c: COULEUR.tech }, { id: 'bio', nom: NOM_LIGNEES.bio, c: COULEUR.bio }, { id: 'reso', nom: NOM_LIGNEES.reso, c: COULEUR.reso },
    { id: 'monter', nom: 'Peuvent monter', n: nMonter, classe: 'or' }, { id: 'libres', nom: 'Libres', n: nLibres },
  ];
  h += `<div class="cl-filtres" role="tablist" aria-label="Filtrer la collection">` + filtres.map((x) =>
    `<button type="button" role="tab" class="es-cible${f === x.id ? ' actif' : ''}${x.classe ? ` ${x.classe}` : ''}"${x.c ? ` style="--c:${x.c}"` : ''} data-action="filtre" data-id="${x.id}" aria-selected="${f === x.id}">${x.nom}${x.n !== undefined ? ` <b>${x.n}</b>` : ''}</button>`).join('') + `</div>`;
  h += `<p class="cl-intro">En expédition, ton deck réunit les cartes des 3 Porteurs emmenés (6 chacun au plus). Touche une carte pour la confier ou la faire monter.</p>`;

  const tuileCarte = (cle: string) => {
    const m = moduleDef(cle);
    const c = j.collection[cle]!;
    const requis = doublonsRequis(m.id, c.niveau);
    const porte = greffesDe(j, m.id)[0];
    const pret = peutMonter(cle);
    return `<button type="button" class="carte-tuile cl-carte${pret ? ' pret' : ''}" data-action="carte" data-id="${cle}" aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}${porte ? `, portée par ${echap(porteurDef(porte).nom)}` : ', libre'}${pret ? ', peut monter' : ''}">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}`
      + `<span class="cl-bas"><span class="cl-porteur">${porte ? `${avatar(porte, 20)}<span>${echap(porteurDef(porte).nom)}</span>` : '<span class="cl-libre">Libre</span>'}</span>`
      + (requis === null ? `<span class="cl-max">Niveau max</span>` : `<span class="cl-doublons" title="Doublons pour le niveau ${c.niveau + 1}"><span class="mini-jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></span><span>${c.doublons}/${requis}</span></span>`)
      + `</span>${pret ? `<span class="cl-monter">${ICO.monter}Peut monter</span>` : ''}</button>`;
  };

  if (f === 'monter' || f === 'libres') {
    const liste = toutes.filter(f === 'monter' ? peutMonter : estLibre);
    h += `<h2 class="titre-section">${f === 'monter' ? 'Peuvent monter' : 'Libres : personne ne les porte'}</h2>`
      + (liste.length ? `<div class="grille-cartes">${liste.map(tuileCarte).join('')}</div>`
        : `<p class="cl-vide">${f === 'monter' ? 'Aucune carte n’a encore assez de doublons et de composants pour monter.' : 'Toutes tes cartes sont confiées à un Porteur.'}</p>`);
  } else {
    const lignees: Lignee[] = f === 'tout' ? ['tech', 'bio', 'reso'] : [f];
    for (const lignee of lignees) {
      h += `<h2 class="titre-section" style="--c:${COULEUR[lignee]}">${NOM_LIGNEES[lignee]}</h2><div class="grille-cartes">`;
      for (const base of MODULES.filter((x) => x.lignee === lignee)) {
        const cles = exemplaires(j, base.id);
        if (!cles.length) { h += `<div class="carte-dos cl-dos" aria-label="Carte pas encore trouvée">${gemme(base.rarete)}<span>?</span><small>À trouver</small><em>Fouille « ${echap(CIBLES_FOUILLE[lignee].nom)} »</em></div>`; continue; }
        for (const cle of cles) h += tuileCarte(cle);
      }
      h += `</div>`;
    }
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
export const chapitresNouveaux = (j: Jeu) => CHAPITRES.filter((c) => chapitreOuvert(c, j.strate) && !j.lus.includes(c.id)).length;

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
  h += `<div class="segments-choix deux" role="tablist">`
    + `<button type="button" role="tab" class="seg${e.onglet === 'chroniques' ? ' actif' : ''}" aria-selected="${e.onglet === 'chroniques'}" data-action="biblio-onglet" data-id="chroniques">Chroniques${nouveaux ? ` <span class="pastille-n">${nouveaux}</span>` : ''}</button>`
    + `<button type="button" role="tab" class="seg${e.onglet === 'archives' ? ' actif' : ''}" aria-selected="${e.onglet === 'archives'}" data-action="biblio-onglet" data-id="archives">Archives</button></div>`;
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
  h += `<p class="chroniques-intro">Les Chroniques d’Ysé, archiviste des Veilleurs de Sédime, écrites pour toi la troisième nuit après ton élection.</p>`;
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

/** Le niveau d'un Porteur et sa barre d'expérience (décision du 22 octobre 2026) */
export function niveauDe(j: EcranDistrict['j'], id: string): string {
  const n = niveauPorteur(j, id);
  const part = n.requis ? Math.round((100 * n.xp) / n.requis) : 100;
  return `<span class="niv-porteur" title="${n.requis ? `${n.xp} / ${n.requis} XP vers le niveau ${n.niveau + 1}` : 'Niveau maximum'}"><b>Niv. ${n.niveau}</b><i class="xp"><i style="width:${part}%"></i></i></span>`;
}

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
        + `<li>${ICO.porteurs}<span>Mission${j.strate >= 2 ? '' : ' <em>(dès la Strate −2)</em>'}</span><b>${Math.round(CREUSEURS.missionCourte * 100)} à ${Math.round(CREUSEURS.missionLongue * 100)} %</b></li>`
        + `<li>${ICO.boost}<span>Épreuve${j.strate >= 2 ? '' : ' <em>(dès la Strate −2)</em>'}</span><b>assuré</b></li></ul>` : '')
      + `<div class="tr-boutons">${manque.creuseurs ? `<button type="button" class="btn prim" data-action="fouiller-choix" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.cristal}Fouiller la Strate −${j.strate}</button>` : ''}`
      + `${manque.noyau ? `<button type="button" class="btn ${manque.creuseurs ? 'sec' : 'prim'}" data-action="batiment" data-id="noyau">${ICO.tour}Améliorer la Tour</button>` : ''}</div>`;
  } else {
    etape = `<strong>La roche cède : la Strate −${cible} va s’ouvrir</strong><small>Tout est prêt. Descends pour découvrir le nouvel étage.</small>`
      + `<div class="tr-boutons"><button type="button" class="btn prim" data-action="descendre" data-strate="${j.strate}"${off ? ' disabled' : ''}>${ICO.descendre}Descendre</button></div>`;
  }
  if (j.expedition) h += `<button type="button" class="appel tr-reprendre" data-action="reprendre">${ICO.descendre}<span><strong>Expédition en cours</strong><small>Strate −${j.expedition.strate} : reprendre le combat</small></span></button>`;
  h += `<section class="tr-etape"><span class="surtitre">Prochaine étape</span>${etape}</section>`;

  // les Strates, de −1 à la roche
  h += `<section class="tr-strates" aria-label="Les Strates"><h3 class="titre-bloc">${ICO.strate}Les Strates</h3><ol>`;
  for (let n = 1; n <= j.strate; n++) {
    const front = n === j.strate;
    const vaincue = !front || j.frontVaincu;
    const nom = NOMS_ETAGES[Math.min(n - 1, NOMS_ETAGES.length - 1)];
    const zone = zoneDe(n);
    const img = decorStrate(ZONES_STRATES.indexOf(zone));
    h += `<li class="tr-strate${front ? ' front' : ''}${vaincue ? ' vaincue' : ''}">`
      + `<span class="tr-vignette">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : ''}<b>−${n}</b></span>`
      + `<div class="tr-infos"><strong>${nom}</strong><small>${echap(zone.nom)} · ${vaincue ? 'vaincue : fouille ciblée ou expédition' : 'front de fouille : son gardien t’attend'}</small>`
      + `<div class="tr-actions">${vaincue ? `<button type="button" class="btn sec" data-action="fouiller-choix" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.cristal}Fouiller</button>` : ''}`
      + `<button type="button" class="btn ${front && !j.frontVaincu ? 'prim' : 'sec'}" data-action="descendre" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.descendre}${front ? 'Descendre' : 'Y aller'}</button></div></div></li>`;
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
  if (j.chambre && j.strate >= 2) h += htmlEpreuves(e) + htmlMissions(e);
  else if (j.chambre) h += `<p class="tr-note">${ICO.verrou}Les Épreuves et les missions s’ouvrent quand la Strate −2 est creusée.</p>`;
  h += feuilleBatiment(e);
  return coquille(e, h, 'ecran-coupe tr');
}

// ---------- Le front de taille : les creuseurs ----------


// ---------- Épreuves de la semaine et missions ----------

function htmlEpreuves(e: EcranDistrict): string {
  const j = e.j;
  const st = strateEpreuve(j);
  const gardien = ennemiDef(zoneDe(st).boss).nom;
  let h = `<section class="bloc"><h3 class="titre-bloc">${ICO.boost}Épreuves de la semaine</h3>`
    + `<p class="aide">Un combat contre ${echap(gardien)} (Strate −${st}), avec une règle qui change ta façon de jouer. La première victoire de chaque Épreuve rapporte une carte au choix, dont une en argent au moins. Nouvelles Épreuves lundi, dans ${duree(lundiSuivant(e.now) - e.now)}.</p><div class="epreuves">`;
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
  let h = `<section class="bloc"><h3 class="titre-bloc">${ICO.ouvrier}Missions</h3>`
    + `<p class="aide">Un Porteur qui ne travaille pas peut partir en mission dans la Strate −${st}. La mission avance même jeu fermé : il rapporte des composants et des doublons de cartes de sa lignée, et un peu d’Usure.</p>`;
  for (const m of j.missions) {
    const p = porteurDef(m.porteur);
    const fait = Math.min(1, (e.now - m.debut) / (m.fin - m.debut));
    h += `<div class="en-cours" style="--c:${COULEUR[p.lignee]}">${avatar(p.id, 36)}<div><strong>${echap(p.nom)} · Strate −${m.strate}</strong><small>${e.now >= m.fin ? 'Sur le retour' : `Retour dans ${duree(m.fin - e.now)}`}</small><div class="jauge or"><i style="width:${fait * 100}%"></i></div></div></div>`;
  }
  const libres = disponibles(j);
  if (j.missions.length >= MISSIONS.max) h += `<small class="aide">${MISSIONS.max} missions au plus en même temps.</small>`;
  else if (!libres.length) h += `<small class="aide">Tous les Porteurs travaillent ou sont partis : libère-en un d’un bâtiment pour l’envoyer.</small>`;
  else {
    h += `<ul class="missions-libres">`;
    for (const id of libres) {
      const p = porteurDef(id);
      h += `<li style="--c:${COULEUR[p.lignee]}">${avatar(id, 36)}<span><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]} · PV ${pvMaxCombat(j, id)}</small></span>`
        + `<button type="button" class="btn sec" data-action="mission" data-id="${id}" data-duree="courte">${MISSIONS.courte.heures} h</button>`
        + `<button type="button" class="btn sec" data-action="mission" data-id="${id}" data-duree="longue">${MISSIONS.longue.heures} h</button></li>`;
    }
    h += `</ul>`;
  }
  return h + `</section>`;
}

// ---------- Choix de l'escouade ----------

/** La Marque d'un Porteur : acquise, ou la progression vers elle */
export function marqueDe(j: Jeu, id: string): string {
  const m = progresMarque(j, id);
  if (!m) return '';
  return m.acquise
    ? `<small class="marque acquise" title="${echap(m.texte)}">${ICO.ok}<span><b>${echap(m.nom)}</b> ${echap(m.court)}</span></small>`
    : `<small class="marque" title="${echap(m.texte)}"><span><b>${echap(m.nom)}</b> ${Math.min(m.n, m.seuil)}/${m.seuil}</span></small>`;
}

/** Les Fréquences d'une liste de cartes (une carte à plusieurs Fréquences compte pour chacune ; les cartes ∗ à part) */
function frequencesDe(cartes: { f: number; fs?: number[]; effet?: { type: string } }[]): number[] {
  return Array.from({ length: 9 }, (_, i) => cartes.filter((g) => (g.fs ?? [g.f]).includes(i + 1) && g.effet?.type !== 'accord').length);
}

/** La plus longue suite de Fréquences présentes (les cartes ∗ comblent des trous) */
function plusLongueSuite(n: number[], jokers: number): number[] {
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
export function htmlEscouade(e: EcranDistrict): string {
  const j = e.j;
  const dispo = disponibles(j);
  const ep = e.epreuve ? epreuveDef(e.epreuve) ?? null : null;
  const fouille = ep ? null : e.fouille;
  const deck = deckEscouade(j, e.escouade).filter((g) => !ep?.filtre || g.porteur === null || ep.filtre(g)).length;
  const deckMin = ep ? EPREUVE_DECK_MIN : DISTRICT.deckMin;
  const zone = zoneDe(e.strateChoisie);
  const titre = ep ? `ÉPREUVE · ${ep.nom.toUpperCase()}` : `${fouille ? 'FOUILLE · ' : ''}STRATE −${e.strateChoisie} · ${NOMS_ETAGES[Math.min(e.strateChoisie - 1, 3)]!.toUpperCase()}`;
  let h = `<div class="ecran ecran-escouade es"><main class="contenu">`
    + entete(titre, 'Escouade', `<button type="button" class="btn-icone" data-action="coupe" aria-label="Retour">${ICO.retour}</button>`);

  // 1. ce qu'on part faire
  h += `<section class="es-mission">`;
  if (ep) {
    h += `<p class="es-but">${ICO.boost}<span><strong>${echap(ep.nom)}</strong>${echap(ep.regle)} Un seul combat, contre ${echap(ennemiDef(zone.boss).nom)}.</span></p>`;
  } else if (fouille) {
    h += `<p class="es-but">${ICO.cristal}<span><strong>Fouille ciblée · ${echap(zone.nom)}</strong>Une descente courte, sans gardien : quelques salles, puis le filon.</span></p>`
      + `<div class="es-cibles" role="tablist" aria-label="Ce que tu cherches">` + (Object.keys(CIBLES_FOUILLE) as CibleFouille[]).map((c) =>
        `<button type="button" role="tab" class="es-cible${fouille === c ? ' actif' : ''}"${c === 'tech' || c === 'bio' || c === 'reso' ? ` style="--c:${COULEUR[c]}"` : ''} data-action="cible" data-id="${c}" aria-selected="${fouille === c}">${echap(CIBLES_FOUILLE[c].nom)}</button>`).join('') + `</div>`
      + `<p class="es-cible-texte">${echap(CIBLES_FOUILLE[fouille].texte)}</p>`;
  } else {
    h += `<p class="es-but">${ICO.strate}<span><strong>${echap(zone.nom)}</strong>Une carte à explorer salle par salle : combats, caches, rencontres, campement, puis le gardien : ${echap(ennemiDef(zone.boss).nom)}.</span></p>`;
  }
  h += `</section>`;

  // 2. les trois places, en grand
  h += `<section class="es-trio" aria-label="Escouade choisie">` + [0, 1, 2].map((i) => {
    const id = e.escouade[i];
    if (!id) return `<div class="es-place vide"><span class="es-silhouette" aria-hidden="true"></span><b>${i + 1}</b><small>Choisis un Porteur plus bas</small></div>`;
    const p = porteurDef(id);
    const img = portrait(id);
    const nCartes = j.porteurs[id]!.modules.length;
    const m = progresMarque(j, id);
    const pv = pvMaxCombat(j, id);
    return `<div class="es-place" style="--c:${COULEUR[p.lignee]}">`
      + `<button type="button" class="es-portrait" data-action="choisir" data-id="${id}" aria-label="Retirer ${echap(p.nom)} de l’escouade">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 72)}<span class="es-retirer" aria-hidden="true">${ICO.fermer}</span>`
      + `<span class="es-nom"><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]} · PV ${pv}</small></span></button>`
      + `<button type="button" class="es-cartes${nCartes ? '' : ' aucune'}${nCartes >= DISTRICT.cartesMax ? ' pleine' : ''}" data-action="deck" data-id="${id}">${ICO.cartes}<span>${nCartes} / ${DISTRICT.cartesMax} cartes</span></button>`
      + (m ? `<button type="button" class="es-marque${m.acquise ? ' acquise' : ''}" data-action="porteur" data-id="${id}" title="${echap(m.texte)}">${m.acquise ? ICO.ok : ICO.verrou}<span><b>${echap(m.nom)}</b> ${m.acquise ? echap(m.court) : `${Math.min(m.n, m.seuil)} / ${m.seuil} ${echap(m.quoi)}`}</span></button>` : '')
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

  // 4. les Porteurs disponibles, puis ceux qui ne peuvent pas partir
  const presents = PORTEURS.filter((p) => porteursPresents(j).includes(p.id));
  const libre = (id: string) => dispo.includes(id) && !ep?.interdits?.includes(id);
  const tuile = (pid: string) => {
    const p = porteurDef(pid);
    const ok = libre(pid);
    const choisi = e.escouade.includes(pid);
    const d = j.porteurs[pid]!;
    const pv = pvMaxCombat(j, pid);
    const pvM = pvNiveau(j, pid);
    const img = portrait(pid);
    const nc = d.modules.length;
    const fs = [...new Set(gestesDe(j, pid).flatMap((g) => g.fs ?? [g.f]))].sort((a, b) => a - b);
    const raison = ep?.interdits?.includes(pid) ? 'Pas pour cette Épreuve' : enMission(j, pid) ? 'En mission' : d.poste ? `Au travail · ${echap(batimentDef(d.poste).nom)}` : 'Absent';
    const blesse = d.usure >= usureMax(pid) * 0.5;
    return `<button type="button" class="es-tuile${choisi ? ' choisi' : ''}${ok || choisi ? '' : ' indispo'}" style="--c:${COULEUR[p.lignee]}" data-action="choisir" data-id="${pid}"${!ok && !choisi ? ' disabled' : ''} aria-pressed="${choisi}">`
      + `<span class="es-vignette">${img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : avatar(pid, 64)}${choisi ? `<span class="es-rang">${e.escouade.indexOf(pid) + 1}</span>` : ''}${blesse && ok ? '<span class="es-blesse">Blessé</span>' : ''}</span>`
      + `<strong>${echap(p.nom)}</strong><small class="es-lignee">${NOM_LIGNEE[p.lignee]}${ok || choisi ? ` · Niv. ${niveauPorteur(j, pid).niveau}` : ''}</small>`
      + (ok || choisi
        ? jaugePv(pv, pvM, d.usure, usureMax(pid)) + `<small class="es-stats">PV ${pv}/${pvM}</small><small class="es-stats${nc ? '' : ' zero'}">${nc} carte${nc > 1 ? 's' : ''}</small>`
          + (fs.length ? `<span class="es-puces" aria-label="Fréquences de ses cartes">${fs.map((f) => `<i style="--fc:${couleurFrequence(f)}">${f}</i>`).join('')}</span>` : '')
        : `<small class="es-raison">${raison}</small>`)
      + `</button>`;
  };
  // les trois choisis sont déjà en grand plus haut : la grille ne montre que les autres
  const prets = presents.filter((p) => libre(p.id) && !e.escouade.includes(p.id));
  const absents = presents.filter((p) => !libre(p.id) && !e.escouade.includes(p.id));
  h += `<section class="es-porteurs"><div class="es-titre"><h3 class="titre-bloc">${ICO.porteurs}${e.escouade.length ? 'Autres Porteurs disponibles' : 'Porteurs disponibles'}</h3><small>${e.escouade.length === 3 ? 'Pour en faire entrer un, retire d’abord un Porteur de l’escouade (la croix sur son portrait).' : 'Touche un Porteur pour l’ajouter · chacun apporte ses cartes au deck.'}</small></div>`
    + (prets.length ? `<div class="es-grille">${prets.map((p) => tuile(p.id)).join('')}</div>` : `<p class="es-note">Tous les Porteurs libres sont dans l’escouade.</p>`)
    + (absents.length ? `<div class="es-titre"><h3 class="titre-bloc discret">Ne peuvent pas partir</h3></div><div class="es-grille petite">${absents.map((p) => tuile(p.id)).join('')}</div>` : '')
    + `</section>`;
  h += `<p class="es-note">${ICO.soin}Après l’expédition, chacun gagne de l’Usure : la Clinique la soigne pendant qu’il se repose.</p></main>`;

  const pret = e.escouade.length === 3 && !maigre;
  h += `<footer class="pied-fixe es-pied"><div class="es-pied-info"><span class="es-avatars">${[0, 1, 2].map((i) => e.escouade[i] ? avatar(e.escouade[i]!, 30) : '<i class="es-pastille-vide"></i>').join('')}</span>`
    + `<span><b>${e.escouade.length} / 3</b><small class="${maigre ? 'alerte' : e.escouade.length === 3 ? 'ok' : ''}">${e.escouade.length < 3 ? `Encore ${3 - e.escouade.length} Porteur${3 - e.escouade.length > 1 ? 's' : ''}` : maigre ? `${deck} cartes · ${deckMin} au moins` : `${deck} cartes, prêt`}</small></span></div>`
    + `<button type="button" class="btn prim large" data-action="partir"${pret ? '' : ' disabled'}>${ep ? `${ICO.boost}Tenter l’Épreuve` : fouille ? `${ICO.cristal}Fouiller` : `${ICO.descendre}Partir`}</button></footer>`;
  h += e.guide ? feuilleGuide(e.guide, trouveesDe(j.collection)) : e.deck ? feuilleDeck(e) : feuillePorteur(e);
  h += e.message ? `<button type="button" class="toast seul" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(e.message)}</span></button>` : '';
  return h + `</div>`;
}

export { POSTES };
