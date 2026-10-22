// Écrans du district : l'archipel (accueil), la Tour du Noyau en coupe, l'escouade, les cartes, le Codex.
// Le district est un tableau Midjourney par âge (public/art/district/age-N), l'âge suit la Tour du Noyau ;
// les plaques cliquables des bâtiments sont posées dessus, le détail s'ouvre en feuille par le bas.

import { NOMS_EFFET, texteEffet } from '../core/effets';
import { MODULES, PORTEURS, batimentDef, carteId, ennemiDef, moduleDe, moduleDef, porteurDef, zoneDe } from '../core/donnees';
import {
  ARCHIVE, CIBLES_FOUILLE, creuseursRequis, logementCreuseurs, manquePourCreuser, noyauRequis, DISTRICT, EPREUVE_DECK_MIN, MISSIONS, POSTES, QUOTIDIENS, enMission, epreuveDef, epreuvesDeLaSemaine, strateEpreuve, strateMission, chantierDe, chantiersMax, coutAmelioration, coutRefabrication, disponibles, dureeChantier, dureeFabrication, energieParHeure, enExpedition, deckEscouade, gestesDe, greffesDe, lundiSuivant, objectifCourant, porteursPresents, posteDe, colisDisponible, colisAvantChoix, RAVITAILLEMENT, pvMaxCombat, quotidienActif, quotidienFait, soinParHeure, stockage, usureMax, type Jeu, type Poste, DECISIONS, decisionEnAttente, humeurDistrict, progresMarque, type Acte,
} from '../core/jeu';
import { COLLECTION, NOMS_RARETE, RARETES, composantsNiveau, doublonsRequis, multNiveau } from '../core/collection';
import type { BatimentId, Lignee, Rarete } from '../core/types';
import type { CibleFouille } from '../core/expedition';
import { FRAGMENTS } from '../core/fragments';
import { loreCarte } from '../core/lore-cartes';
import { CHAPITRES, LIVRES, chapitreDef, chapitreOuvert } from '../core/chroniques';
import { COULEUR, echap } from './vue';
import { decor, illustrationBatiment, prochainVisuel, reflets, sceneDistrict, visuel } from './art';
import { faceCarte, couleurFrequence } from './carte';
import { ICO } from './icones';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, couts, duree, ent, entete, prix, type EcranDistrict } from './coquille';

export type { EcranDistrict, Vue } from './coquille';

export const COULEUR_RARETE: Record<Rarete, string> = { fer: '#8E949C', cuivre: '#C47A48', argent: '#B8C4CE', or: '#E2B44A', nacre: '#E6D3EE' };

const gemme = (r: Rarete) => `<i class="gemme g-${r}" style="--r:${COULEUR_RARETE[r]}" title="${NOMS_RARETE[r]}" aria-hidden="true"></i>`;

// ---------- L'archipel ----------

type Lieu = BatimentId | 'chantier';
/** Où se trouve chaque bâtiment dans le tableau de chaque âge (repère 400 × 600, haut de la plaque) */
const LIEUX: Record<1 | 2 | 3 | 4, Record<Lieu, { x: number; y: number }>> = {
  1: { noyau: { x: 200, y: 232 }, generateur: { x: 322, y: 228 }, forge: { x: 128, y: 500 }, clinique: { x: 322, y: 345 }, chantier: { x: 305, y: 470 } },
  2: { noyau: { x: 222, y: 205 }, generateur: { x: 92, y: 205 }, forge: { x: 332, y: 262 }, clinique: { x: 340, y: 385 }, chantier: { x: 300, y: 478 } },
  3: { noyau: { x: 205, y: 212 }, generateur: { x: 78, y: 182 }, forge: { x: 328, y: 212 }, clinique: { x: 78, y: 430 }, chantier: { x: 300, y: 470 } },
  4: { noyau: { x: 205, y: 248 }, generateur: { x: 62, y: 232 }, forge: { x: 322, y: 250 }, clinique: { x: 72, y: 452 }, chantier: { x: 300, y: 505 } },
};
const ORDRE: Lieu[] = ['noyau', 'generateur', 'forge', 'clinique', 'chantier'];

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
    if (id === 'chantier') {
      return `<button type="button" class="plaque verrou" ${pos} data-action="chantier"><span class="plaque-nom">${ICO.verrou}Labo génétique</span><small>Bientôt</small></button>`;
    }
    const d = batimentDef(id);
    const prete = id === 'forge' && !!j.forge && e.now >= j.forge.fin;
    const ch = chantierDe(j, id);
    // l'objectif « Construire ton deck » se fait dans les Cartes, pas sur la Tour du Noyau
    const vise = !!o && o.pilier === id && !o.fait(j) && o.titre !== 'Construire ton deck';
    const occupant = id !== 'noyau' ? posteDe(j, id as Poste) : null;
    let etat = '';
    if (ch) etat = `<small class="en-chantier">${ICO.marteau}${duree(ch.fin - e.now)}</small>`;
    else if (prete) etat = `<small class="pret">${ICO.ok}Prêt</small>`;
    else if (j.forge && id === 'forge') etat = `<small>${ICO.chrono}${duree(j.forge.fin - e.now)}</small>`;
    else if (id !== 'noyau' && !occupant) etat = `<small class="vacant">${ICO.ouvrier}Personne</small>`;
    else if (occupant) etat = `<small class="occupe">${avatar(occupant, 14)}${echap(porteurDef(occupant).nom)}</small>`;
    return `<button type="button" class="plaque${e.selection === id ? ' choisie' : ''}${vise ? ' visee' : ''}" ${pos} data-action="batiment" data-id="${id}" aria-label="${echap(d.nom)}, niveau ${j.batiments[id]}">`
      + `<span class="plaque-nom"><b class="niv">${j.batiments[id]}</b>${echap(d.nom)}</span>${etat}${prete || vise ? '<i class="pastille-alerte" aria-hidden="true"></i>' : ''}</button>`;
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

/** Un Porteur qu'on peut poster au travail */
function candidat(j: Jeu, id: string, poste: Poste, affinite: Lignee | undefined): string {
  const d = porteurDef(id);
  const ailleurs = j.porteurs[id]!.poste;
  const bonus = affinite === d.lignee ? `×${DISTRICT.bonusAffinite}` : `×${String(DISTRICT.bonusPoste).replace('.', ',')}`;
  return `<button type="button" class="tuile-porteur" style="--c:${COULEUR[d.lignee]}" data-action="poster" data-id="${id}" data-poste="${poste}">`
    + `${avatar(id, 48)}<strong>${echap(d.nom)}</strong><small>${ailleurs ? echap(batimentDef(ailleurs).nom) : 'Libre'}</small>`
    + `<span class="bonus${affinite === d.lignee ? ' ideal' : ''}">${bonus}</span></button>`;
}

function feuilleBatiment(e: EcranDistrict): string {
  const j = e.j;
  const b = e.selection;
  if (!b) return '';
  const d = batimentDef(b);
  const niv = j.batiments[b];
  const pv = prochainVisuel(niv);
  const pips = Array.from({ length: d.niveauMax }, (_, i) => `<i class="${i < niv ? 'plein' : ''}"></i>`).join('');
  let h = `<div class="voile-feuille" data-action="fermer" aria-hidden="true"></div><section class="feuille" role="dialog" aria-modal="true" aria-labelledby="feuille-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><img class="vignette" src="${illustrationBatiment(b, niv)}" alt="" decoding="async"><div class="titres"><span class="surtitre">NIVEAU ${niv} / ${d.niveauMax}${d.affinite ? ` · IDÉAL : ${NOM_LIGNEE[d.affinite].toUpperCase()}` : ''}</span><h2 id="feuille-titre">${echap(d.nom)}</h2><span class="pips" aria-hidden="true">${pips}</span></div>`
    + `<button type="button" class="btn-icone" data-action="fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  h += `<p class="role">${echap(d.role)}${pv !== null && pv <= d.niveauMax ? ` <span class="aide">Nouvelle apparence au niveau ${pv}.</span>` : ''}</p>`;

  // ce que le bâtiment rapporte
  const stats: string[] = [];
  if (b === 'generateur') stats.push(`<div class="stat">${ICO.energie}<b>+${energieParHeure(j)}</b><small>énergie / h</small></div>`);
  if (b === 'clinique') stats.push(`<div class="stat">${ICO.soin}<b>−${Math.round(soinParHeure(j) * 10) / 10}</b><small>Usure / h au repos</small></div>`);
  if (b === 'noyau' || b === 'generateur') stats.push(`<div class="stat">${ICO.coffre}<b>${ent(stockage(j))}</b><small>stockage</small></div>`);
  if (b === 'noyau') stats.push(`<div class="stat">${ICO.strate}<b>−${j.strate}</b><small>Strate ouverte</small></div>`);
  if (stats.length) h += `<div class="stats">${stats.join('')}</div>`;
  if (b === 'noyau') {
    h += `<p class="aide">Les autres bâtiments ne dépassent pas son niveau.</p><button type="button" class="btn prim large" data-action="entrer">${ICO.tour}Entrer dans la tour</button>`;
  }

  // le Porteur au travail
  if (b !== 'noyau') {
    const poste = b as Poste;
    const occupant = posteDe(j, poste);
    h += `<section class="bloc"><h3 class="titre-bloc">${ICO.ouvrier}Au travail</h3>`;
    if (occupant) {
      const o = porteurDef(occupant);
      h += `<div class="occupant" style="--c:${COULEUR[o.lignee]}">${avatar(occupant, 52)}<div><strong>${echap(o.nom)}</strong><small>${NOM_LIGNEE[o.lignee]} · rendement ×${String(d.affinite === o.lignee ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste).replace('.', ',')}</small></div>`
        + `<button type="button" class="btn sec" data-action="liberer" data-id="${occupant}">Libérer</button></div>`;
    } else {
      h += `<p class="vide-poste">Personne au poste. Un Porteur ${d.affinite ? `<b style="color:${COULEUR[d.affinite]}">${NOM_LIGNEE[d.affinite]}</b>` : 'de la bonne lignée'} travaille deux fois mieux.</p>`;
    }
    const libres = PORTEURS.filter((p) => p.id !== occupant && !enExpedition(j, p.id) && porteursPresents(j).includes(p.id))
      .sort((x, y) => Number(y.lignee === d.affinite) - Number(x.lignee === d.affinite));
    if (libres.length) h += `<div class="rangee">${libres.map((p) => candidat(j, p.id, poste, d.affinite ?? undefined)).join('')}</div>`;
    h += `</section>`;
  }

  // la Forge
  if (b === 'forge') {
    h += `<section class="bloc"><h3 class="titre-bloc">${ICO.marteau}Refabriquer une carte</h3>`;
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
  h += `</div>`;

  // le pied : l'amélioration, toujours visible
  const ch = chantierDe(j, b);
  const cout = coutAmelioration(j, b);
  h += `<footer class="feuille-pied">`;
  if (ch) {
    const fait = Math.min(1, (e.now - ch.debut) / (ch.fin - ch.debut));
    h += `<div class="chantier-cours">${ICO.marteau}<div><strong>Chantier vers le niveau ${niv + 1}</strong><small>Reste ${duree(ch.fin - e.now)} · avance même jeu fermé</small><div class="jauge or"><i style="width:${fait * 100}%"></i></div></div></div>`;
  } else if (cout) {
    const bloque = b !== 'noyau' && niv >= j.batiments.noyau;
    const assez = j.energie >= cout.energie && j.composants >= cout.composants && j.eclats >= (cout.eclats ?? 0);
    const plein = j.chantiers.length >= chantiersMax(j) || (b === 'noyau' && j.chantiers.length > 0);
    const dc = dureeChantier(j, b);
    const raison = bloque ? 'Améliore d’abord la Tour du Noyau.'
      : plein ? (b === 'noyau' && j.chantiers.length ? 'Attends la fin des chantiers en cours.' : chantiersMax(j) === 1 ? 'Un seul chantier à la fois (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.')
        : !assez ? 'Ressources insuffisantes.' : '';
    h += `<div class="cout-ligne"><span class="surtitre">NIVEAU ${niv + 1}</span>${couts(j, cout)}<span class="prix duree">${ICO.chrono}${dc ? duree(dc) : 'immédiat'}</span></div>`
      + `<button type="button" class="btn prim large" data-action="ameliorer" data-id="${b}"${assez && !bloque && !plein ? '' : ' disabled'}>${ICO.monter}Améliorer</button>`
      + (raison ? `<small class="raison">${raison}</small>` : '');
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

export function htmlArchipel(e: EcranDistrict): string {
  const j = e.j;
  // le tableau garde ses proportions (les plaques sont placées en % de l'image) ; au-dessus, son ciel flouté prolonge l'écran.
  // Sur PC, la mer et le ciel du tableau continuent jusqu'aux bords de l'écran (.mer-fond, chargée seulement sur PC : bureau.css)
  const scene = sceneDistrict(j.batiments.noyau);
  let h = `<section class="archipel" aria-label="Ton district"><img class="tableau-fond" src="${scene.url}" alt="" aria-hidden="true">`
    + `<span class="mer-fond${scene.nuit ? ' nuit' : ''}" style="--mer:url(${scene.mer});--reflets:url(${reflets});--horizon:${scene.horizon}%" aria-hidden="true"><i class="mer-reflets"></i></span>`
    + `<div class="toile">${tableau(j)}${plaques(e)}</div>`
    + `<div class="archipel-haut">${mission(e)}${appel(e)}</div></section>`;
  h += feuilleBatiment(e);
  const acte = decisionEnAttente(j);
  if (acte) h += fenetreDecision(acte);
  else if (j.choix.length) h += fenetreChoix(j);
  else if (e.retour.length) {
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="retour-titre"><div class="fenetre retour"><span class="surtitre">BON RETOUR, DIRECTEUR</span><h2 id="retour-titre">Pendant ton absence</h2><ul>`
      + e.retour.map((l) => `<li>${ICO.cristal}<span>${echap(l)}</span></li>`).join('') + `</ul><button type="button" class="btn prim large" data-action="retour-ok">Au travail</button></div></div>`;
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
    + `<button type="button" class="btn-icone" data-action="carte-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="detail-haut"><div class="detail-face">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}</div><div class="detail-infos">${effetsCarte(m)}</div></div>`
    + (loreCarte(cle) ? `<blockquote class="lore-carte">${echap(loreCarte(cle)!)}</blockquote>` : '');
  // progression
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.monter}Progression</h3>`;
  if (requis === null) h += `<p class="aide">Niveau maximum atteint.</p>`;
  else {
    const pret = c.doublons >= requis;
    h += `<div class="progression"><div class="jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></div><span class="chiffre">${c.doublons} / ${requis} doublons</span></div>`
      + `<p class="aide">Niveau ${c.niveau + 1} : +${Math.round(COLLECTION.bonusNiveau * 100)} % de force.</p>`
      + `<div class="ligne-btn"><button type="button" class="btn prim" data-action="monter" data-module="${cle}"${pret && j.composants >= cout ? '' : ' disabled'}>${ICO.monter}Monter · ${prix('composants', cout, j.composants >= cout)}</button>`;
    if (c.doublons > 0) h += `<button type="button" class="btn sec" data-action="recycler" data-module="${cle}">${ICO.recycler}Recycler 1 · +${COLLECTION.recyclage[m.rarete]}</button>`;
    h += `</div>`;
  }
  if (requis === null && c.doublons > 0) h += `<div class="ligne-btn"><button type="button" class="btn sec" data-action="recycler" data-module="${cle}">${ICO.recycler}Recycler 1 · +${COLLECTION.recyclage[m.rarete]}</button></div>`;
  h += `</section>`;
  // à qui la confier : elle prend une place dans le deck de combat
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.greffe}Confier à</h3><p class="aide">Une carte confiée à un Porteur entre dans ton deck de combat quand il descend. ${DISTRICT.cartesMax} cartes au plus par Porteur, de sa lignée.</p><div class="rangee">`
    + porteurs.map((p) => {
      const ici = porte === p.id;
      const n = j.porteurs[p.id]!.modules.length;
      return `<button type="button" class="tuile-porteur${ici ? ' actif' : ''}" style="--c:${COULEUR[p.lignee]}" data-action="${ici ? 'degreffer' : 'greffer'}" data-module="${cle}" data-id="${p.id}"${enExpedition(j, p.id) ? ' disabled' : ''}>`
        + `${avatar(p.id, 48)}<strong>${echap(p.nom)}</strong><small>${ici ? 'La porte · reprendre' : `${n} / ${DISTRICT.cartesMax}`}</small>${ici ? `<span class="bonus ideal">${ICO.ok}</span>` : ''}</button>`;
    }).join('') + `</div></section>`;
  return h + `</div></section>`;
}

/** Les cartes de chaque Porteur : une rangée de raccourcis vers la construction de son deck */
function decksPorteurs(j: Jeu): string {
  const ids = PORTEURS.filter((p) => porteursPresents(j).includes(p.id)).map((p) => p.id);
  return `<section class="bloc decks-porteurs"><h3 class="titre-bloc">${ICO.cartes}Construire le deck</h3><div class="rangee">`
    + ids.map((id) => {
      const p = porteurDef(id);
      const n = j.porteurs[id]!.modules.length;
      return `<button type="button" class="tuile-porteur" style="--c:${COULEUR[p.lignee]}" data-action="deck" data-id="${id}">${avatar(id, 44)}<strong>${echap(p.nom)}</strong><small>${n} / ${DISTRICT.cartesMax} cartes</small></button>`;
    }).join('') + `</div></section>`;
}

/** La feuille d'un Porteur : les cartes qu'il porte (touche pour reprendre), puis celles qu'on peut lui confier */
function feuilleDeck(e: EcranDistrict): string {
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
    + `<button type="button" class="btn-icone" data-action="deck-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  if (parti) h += `<p class="aide">${echap(p.nom)} est en expédition : ses cartes changeront à son retour.</p>`;
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.greffe}Ce que ${echap(p.nom)} porte</h3><p class="aide">Ces cartes entrent dans ton deck quand ${echap(p.nom)} descend. Touche une carte pour la reprendre.</p>`;
  h += porte.length ? `<div class="grille-cartes">${porte.map((k) => tuile(k, 'degreffer', '<span class="libre">reprendre</span>')).join('')}</div>` : `<p class="aide">Aucune carte pour l’instant.</p>`;
  h += `</section><section class="bloc"><h3 class="titre-bloc">${ICO.cartes}À lui confier</h3>`
    + `<p class="aide">${plein ? `${echap(p.nom)} porte déjà ${DISTRICT.cartesMax} cartes : reprends-en une d’abord.` : `Les cartes ${NOM_LIGNEE[p.lignee].toLowerCase()}s de ta collection. Une carte portée par un autre Porteur passe à ${echap(p.nom)}.`}</p>`;
  h += libres.length ? `<div class="grille-cartes${plein ? ' grisee' : ''}">${libres.map((k) => { const qui = greffesDe(j, k)[0]; return tuile(k, 'greffer', qui ? `${avatar(qui, 20)}<span class="libre">${echap(porteurDef(qui).nom)}</span>` : '<span class="libre">libre</span>'); }).join('')}</div>` : `<p class="aide">Aucune autre carte de sa lignée pour l’instant : les Strates en cachent d’autres.</p>`;
  return h + `</section></div></section>`;
}

export function htmlCartes(e: EcranDistrict): string {
  const j = e.j;
  const trouvees = MODULES.filter((m) => exemplaires(j, m.id).length).length;
  const lignees: Lignee[] = e.filtre === 'tout' ? ['tech', 'bio', 'reso'] : [e.filtre];
  let h = entete(`COLLECTION · ${trouvees} / ${MODULES.length} TROUVÉES`, 'Cartes');
  h += `<div class="segments-choix" role="tablist">` + (['tout', 'tech', 'bio', 'reso'] as const).map((f) =>
    `<button type="button" role="tab" class="seg${e.filtre === f ? ' actif' : ''}"${f !== 'tout' ? ` style="--c:${COULEUR[f]}"` : ''} data-action="filtre" data-id="${f}" aria-selected="${e.filtre === f}">${f === 'tout' ? 'Toutes' : NOM_LIGNEES[f]}</button>`).join('') + `</div>`;
  h += `<p class="aide intro-ecran">Ta collection, c’est ton deck. Chaque carte confiée à un Porteur entre dans ton deck de combat quand il descend (${DISTRICT.cartesMax} cartes par Porteur). Les chiffres dans les octogones sont ses Fréquences : des Fréquences qui se suivent font les Résonances. Touche une carte pour la confier ou la faire monter avec ses doublons.</p>`;
  h += decksPorteurs(j);
  for (const lignee of lignees) {
    h += `<h2 class="titre-section" style="--c:${COULEUR[lignee]}">${NOM_LIGNEES[lignee]}</h2><div class="grille-cartes">`;
    for (const base of MODULES.filter((x) => x.lignee === lignee)) {
      const cles = exemplaires(j, base.id);
      if (!cles.length) { h += `<div class="carte-dos" aria-label="Carte pas encore trouvée">${gemme(base.rarete)}<span>?</span><small>À trouver</small></div>`; continue; }
      for (const cle of cles) {
        const m = moduleDef(cle);
        const c = j.collection[cle]!;
        const requis = doublonsRequis(m.id, c.niveau);
        const porte = greffesDe(j, m.id)[0];
        const pret = requis !== null && c.doublons >= requis && j.composants >= composantsNiveau(c.niveau + 1);
        h += `<button type="button" class="carte-tuile" data-action="carte" data-id="${cle}" aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${c.niveau}">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}`
          + `<span class="tuile-bas">${porte ? avatar(porte, 20) : '<span class="libre">libre</span>'}`
          + (requis === null ? `<span class="chiffre">MAX</span>` : `<span class="mini-jauge" style="--jc:${COULEUR_RARETE[m.rarete]}"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%"></i></span><span class="chiffre">${c.doublons}/${requis}</span>`)
          + `</span>${pret ? `<i class="pastille-alerte" aria-label="peut monter"></i>` : ''}</button>`;
      }
    }
    h += `</div>`;
  }
  h += feuilleCarte(e);
  h += feuilleDeck(e);
  if (j.choix.length) h += fenetreChoix(j);
  return coquille(e, h, 'ecran-cartes');
}

// ---------- La rencontre, avant la chambre scellée ----------

const REPLIQUES: { id: string; texte: string }[] = [
  { id: 'ilka', texte: '« On attend quoi, l’Élu ? Qu’elle s’ouvre toute seule ? »' },
  { id: 'doran', texte: '« Mon père a travaillé dans ce puits, avant qu’on le mure. Il n’a jamais aimé son silence. »' },
  { id: 'vela', texte: '« Quelque chose a peur, derrière cette porte. Et ce n’est pas moi. »' },
];

/** Où parle chacun : position de la bulle à l'écran et direction de sa pointe vers le personnage */
const BULLES: Record<string, string> = { ilka: 'b-ilka', doran: 'b-doran', vela: 'b-vela' };

/** La rencontre en scène : l'illustration du trio devant la porte, et les répliques en bulles, une par toucher */
export function htmlRencontre(n = 0): string {
  const fini = n >= REPLIQUES.length;
  let h = `<section class="scene-rencontre${fini ? ' finie' : ''}" data-action="rencontre-suite" style="--image:url(./intro/00-titre.webp)" aria-label="La porte scellée">`
    + `<div class="rencontre-fond" aria-hidden="true"><div class="rencontre-image"><img src="./intro/00-titre.webp" alt="" decoding="async"><span class="t-porte"></span><span class="t-flamme"></span><span class="t-halo"></span></div></div>`
    + `<header class="rencontre-haut"><div><span class="label">SOUS LA TOUR DU NOYAU</span><h1>La porte scellée</h1></div><button type="button" class="btn-sec" data-action="archipel">Plus tard</button></header>`
    + `<p class="recitatif">Une porte ronde, scellée depuis les années 2060, luit faiblement. Trois personnes t’attendent devant.</p>`;
  REPLIQUES.slice(0, n).forEach((r, i) => {
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
    h += `<section class="livre"><h2 class="titre-bloc">${ICO.codex}${echap(LIVRES[livre])}</h2>`;
    for (const c of CHAPITRES.filter((x) => x.livre === livre)) {
      const n = CHAPITRES.indexOf(c) + 1;
      if (chapitreOuvert(c, j.strate)) {
        const neuf = !j.lus.includes(c.id);
        h += `<button type="button" class="chapitre-ligne${neuf ? ' neuf' : ''}" data-action="chapitre" data-id="${c.id}">`
          + `<span class="num">${n}</span><span class="txt"><strong>${echap(c.titre)}</strong><small>${echap(c.epoque)}</small></span>`
          + (!j.luesRecompensees.includes(c.id) ? `<span class="marque-neuf">+1 carte</span>` : `<span class="lu" aria-label="Lu">${ICO.ok}</span>`) + `</button>`;
      } else {
        h += `<div class="chapitre-ligne ferme" aria-disabled="true"><span class="num">${n}</span><span class="txt"><strong>${echap(c.titre)}</strong>`
          + `<small>${echap(c.teaser ?? '')}</small><em>${ICO.strate}S’ouvre à la Strate −${c.strate}</em></span><span class="lu" aria-hidden="true">${ICO.verrou}</span></div>`;
      }
    }
    h += `</section>`;
  }
  return coquille(e, h, 'ecran-codex');
}

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
  let h = `<article class="lecture">`;
  h += `<header class="lecture-tete${c.image ? ' illustree' : ''}">`
    + (c.image ? `<div class="lecture-fond" aria-hidden="true"><img src="./intro/${c.image}.webp" alt="" decoding="async"></div>` : '')
    + `<button type="button" class="btn sec petit" data-action="chapitre-fermer">${ICO.retour}Sommaire</button>`
    + `<div class="lecture-titre"><span class="surtitre">${echap(LIVRES[c.livre].split(' · ')[0]!.toUpperCase())} · CHAPITRE ${i + 1}</span><h1>${echap(c.titre)}</h1><span class="epoque">${echap(c.epoque)}</span></div></header>`;
  h += `<div class="lecture-texte">`;
  c.paragraphes.forEach((p, n) => {
    const signature = n === c.paragraphes.length - 1 && p.startsWith('Ysé') && p.length < 80;
    h += `<p${signature ? ' class="signature"' : n === 0 ? ' class="lettrine"' : ''}>${typo(echap(p))}</p>`;
  });
  h += `</div><nav class="lecture-nav">`
    + (prec ? `<button type="button" class="btn sec" data-action="chapitre" data-id="${prec.id}">${ICO.retour}<span>${echap(prec.titre)}</span></button>` : '<span></span>')
    + (suiv ? `<button type="button" class="btn prim" data-action="chapitre" data-id="${suiv.id}"><span>${echap(suiv.titre)}</span>${ICO.lancer}</button>`
      : prochainFerme ? `<p class="aide">La suite s’ouvrira à la Strate −${prochainFerme.strate}.</p>` : `<p class="aide">Fin des Chroniques. Pour l’instant.</p>`)
    + `</nav></article>`;
  return h;
}

// ---------- La Tour du Noyau en coupe ----------

const NOMS_ETAGES = ['Salle de fouilles', 'Bunker des années 2060', 'Galerie aux formes courbes', 'Ruines lumineuses'];

function jaugePv(pv: number, max: number, usure = 0, usureM = 1): string {
  return `<div class="jauge-pv"><i class="pv" style="width:${(100 * pv) / max}%"></i>${usure >= 1 ? `<i class="usure" style="width:${(100 * Math.min(usure, usureM)) / max}%"></i>` : ''}</div>`;
}

export function htmlCoupe(e: EcranDistrict): string {
  const j = e.j;
  let h = entete(`EN COUPE · ${j.strate} ÉTAGE${j.strate > 1 ? 'S' : ''} CREUSÉ${j.strate > 1 ? 'S' : ''}`, 'Tour du Noyau');
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.ouvrier}Habitants</h3><div class="habitants">`;
  for (const p of PORTEURS) {
    if (!porteursPresents(j).includes(p.id)) continue;
    const d = j.porteurs[p.id]!;
    const exp = enExpedition(j, p.id);
    const etat = enMission(j, p.id) ? 'En mission' : exp ? 'En expédition' : d.poste ? batimentDef(d.poste).nom : 'Au repos';
    const pv = pvMaxCombat(j, p.id);
    h += `<div class="habitant${exp ? ' parti' : ''}" style="--c:${COULEUR[p.lignee]}">${avatar(p.id, 40)}<div class="hab-infos"><div class="hab-ligne"><strong>${echap(p.nom)}</strong><span class="chiffre">${pv}/${p.pvMax}</span></div>`
      + jaugePv(pv, p.pvMax, d.usure, usureMax(p.id))
      + `<small>${d.poste && !exp ? ICO.ouvrier : ''}${etat}${d.usure >= 1 ? ` · Usure ${Math.floor(d.usure)}` : ''}</small>`
      + `<small class="greffes">${ICO.greffe}${d.modules.length} / ${DISTRICT.cartesMax} cartes</small>` + `</div></div>`;
  }
  h += `</div></section>`;
  h += `<section class="puits" style="--decor:url(${decor('coupe')})" aria-label="Les Strates"><h3 class="titre-bloc">${ICO.strate}Les Strates</h3><ol class="strates">`;
  // la roche à creuser en tête : c'est le prochain étage, juste sous le front
  h += htmlFrontDeTaille(j);
  for (let n = j.strate; n >= 1; n--) {
    const front = n === j.strate;
    const vaincue = !front || j.frontVaincu;
    const nom = NOMS_ETAGES[Math.min(n - 1, NOMS_ETAGES.length - 1)];
    const off = j.expedition || !j.chambre;
    h += `<li class="strate${front ? ' front' : ''}" style="--p:${Math.min(1, (n - 1) / 4)}"><span class="profondeur">−${n}</span><div class="strate-infos"><strong>${nom}</strong>`
      + `<small>${front && !j.frontVaincu ? 'Front de fouille : vaincs son gardien pour préparer l’étage suivant' : 'Vaincue : fouille ciblée ou expédition'}</small></div>`
      + `<div class="strate-actions">`
      + (!vaincue ? '' : `<button type="button" class="btn sec" data-action="fouiller-choix" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.cristal}Fouiller</button>`)
      + `<button type="button" class="btn ${front ? 'prim' : 'sec'}" data-action="descendre" data-strate="${n}"${off ? ' disabled' : ''}>${ICO.descendre}${front ? 'Descendre' : 'Y aller'}</button></div></li>`;
  }
  h += `</ol>`;
  if (j.expedition) h += `<button type="button" class="appel" data-action="reprendre">${ICO.descendre}<span><strong>Expédition en cours</strong><small>Strate −${j.expedition.strate} : reprendre le combat</small></span></button>`;
  h += `</section>`;
  if (j.chambre && j.strate >= 2) h += htmlEpreuves(e) + htmlMissions(e);
  return coquille(e, h, 'ecran-coupe');
}

// ---------- Le front de taille : les creuseurs ----------

function htmlFrontDeTaille(j: Jeu): string {
  const cible = j.strate + 1;
  const requis = creuseursRequis(cible);
  const loge = logementCreuseurs(j);
  const manque = manquePourCreuser(j);
  const jauge = requis ? `<div class="jauge or"><i style="width:${Math.min(100, (100 * j.creuseurs) / requis)}%"></i></div>` : '';
  let etat: string;
  if (!j.frontVaincu) etat = `Vaincs d’abord le gardien de la Strate −${j.strate}.${requis ? ` Il faudra ensuite ${requis} creuseurs.` : ''}`;
  else if (!manque) etat = 'Tout est prêt : la roche cède.';
  else etat = [manque.creuseurs ? `il manque ${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}` : '', manque.noyau ? `la Tour du Noyau doit passer au niveau ${noyauRequis(cible)} pour les loger` : ''].filter(Boolean).join(' et ') + '.';
  return `<li class="strate roche front-taille${j.frontVaincu ? ' prete' : ''}"><span class="profondeur">−${cible}</span><div class="strate-infos"><strong>Roche à creuser</strong>`
    + `<small>${ICO.ouvrier}Creuseurs ${j.creuseurs} / ${requis} · logés ${j.creuseurs} / ${loge} (Noyau niveau ${j.batiments.noyau})</small>${jauge}`
    + `<small>${etat.charAt(0).toUpperCase() + etat.slice(1)}</small>`
    + (j.frontVaincu && manque?.creuseurs ? `<small class="aide">Des creuseurs se trouvent en fouillant les Strates vaincues, en mission, avec les Épreuves et quand le district a confiance en toi.</small>` : '')
    + `</div></li>`;
}

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
function marqueDe(j: Jeu, id: string): string {
  const m = progresMarque(j, id);
  if (!m) return '';
  return m.acquise
    ? `<small class="marque acquise" title="${echap(m.texte)}">${ICO.ok}Marque ${echap(m.nom)}</small>`
    : `<small class="marque" title="${echap(m.texte)}">${echap(m.nom)} · ${Math.min(m.n, m.seuil)}/${m.seuil} ${echap(m.quoi)}</small>`;
}

export function htmlEscouade(e: EcranDistrict): string {
  const j = e.j;
  const dispo = disponibles(j);
  const ep = e.epreuve ? epreuveDef(e.epreuve) ?? null : null;
  const fouille = ep ? null : e.fouille;
  const deck = deckEscouade(j, e.escouade).filter((g) => !ep?.filtre || g.porteur === null || ep.filtre(g)).length;
  const deckMin = ep ? EPREUVE_DECK_MIN : DISTRICT.deckMin;
  const titre = ep ? `ÉPREUVE · ${ep.nom.toUpperCase()}` : `${fouille ? 'FOUILLE · ' : ''}STRATE −${e.strateChoisie} · ${NOMS_ETAGES[Math.min(e.strateChoisie - 1, 3)]!.toUpperCase()}`;
  let h = `<div class="ecran ecran-escouade"><main class="contenu">`
    + entete(titre, 'Escouade', `<button type="button" class="btn-icone" data-action="coupe" aria-label="Retour">${ICO.retour}</button>`);
  h += `<div class="emplacements" aria-label="Escouade choisie">` + [0, 1, 2].map((i) => {
    const id = e.escouade[i];
    return id ? `<button type="button" class="emplacement plein" style="--c:${COULEUR[porteurDef(id).lignee]}" data-action="choisir" data-id="${id}" aria-label="Retirer ${echap(porteurDef(id).nom)}">${avatar(id, 56)}<small>${echap(porteurDef(id).nom)}</small></button>`
      : `<div class="emplacement"><span>${i + 1}</span><small>Libre</small></div>`;
  }).join('') + `</div>`;
  // les Fréquences du deck de l'escouade : un trou dans la suite coupe les Résonances
  if (e.escouade.length) {
    const cartes = deckEscouade(j, e.escouade);
    // une carte à plusieurs Fréquences compte pour chacune
    const n = Array.from({ length: 9 }, (_, i) => cartes.filter((g) => (g.fs ?? [g.f]).includes(i + 1) && g.effet?.type !== 'accord').length);
    const libres = cartes.filter((g) => g.effet?.type === 'accord').length;
    const max = Math.max(...n, 1);
    h += `<div class="frequences-deck" aria-label="Fréquences du deck"><span class="surtitre">FRÉQUENCES DU DECK</span><div class="barres">`
      + n.map((k, i) => `<span class="barre${k ? '' : ' trou'}" style="--fc:${couleurFrequence(i + 1)};--h:${Math.round((100 * k) / max)}%"><i></i><b>${i + 1}</b><small>${k}</small></span>`).join('')
      + `</div><small class="aide">Des chiffres qui se suivent font des Résonances. Un chiffre absent coupe les suites${libres ? ` · ${libres} carte${libres > 1 ? 's' : ''} ∗ comble${libres > 1 ? 'nt' : ''} n’importe quel trou` : ''}.</small></div>`;
  }
  const zone = zoneDe(e.strateChoisie);
  if (ep) {
    h += `<p class="zone-strate">${ICO.boost}<span><strong>${echap(ep.nom)}</strong><small>${echap(ep.regle)} Un seul combat, contre ${echap(ennemiDef(zone.boss).nom)}.</small></span></p>`;
  } else if (fouille) {
    h += `<p class="zone-strate">${ICO.cristal}<span><strong>Fouille ciblée · ${echap(zone.nom)}</strong><small>Une descente courte, sans gardien : quelques salles, puis le filon. Que cherches-tu ?</small></span></p>`;
    h += `<div class="segments-choix cibles" role="tablist">` + (Object.keys(CIBLES_FOUILLE) as CibleFouille[]).map((c) =>
      `<button type="button" role="tab" class="seg${fouille === c ? ' actif' : ''}"${c === 'tech' || c === 'bio' || c === 'reso' ? ` style="--c:${COULEUR[c]}"` : ''} data-action="cible" data-id="${c}" aria-selected="${fouille === c}">${echap(CIBLES_FOUILLE[c].nom)}</button>`).join('') + `</div>`;
    h += `<p class="aide">${echap(CIBLES_FOUILLE[fouille].texte)}</p>`;
  } else {
    h += `<p class="zone-strate">${ICO.strate}<span><strong>${echap(zone.nom)}</strong><small>Une carte à explorer salle par salle : combats, caches, rencontres, campement, puis le gardien de la zone : ${echap(ennemiDef(zone.boss).nom)}</small></span></p>`;
  }
  h += `<p class="aide intro-ecran">Choisis 3 Porteurs. Chacun apporte au deck les cartes que tu lui as confiées : changer d’escouade change ton deck. Les Porteurs au travail restent au district.</p><div class="grille-porteurs">`;
  for (const p of PORTEURS) {
    if (!porteursPresents(j).includes(p.id)) continue;
    const libre = dispo.includes(p.id) && !ep?.interdits?.includes(p.id);
    const choisi = e.escouade.includes(p.id);
    const d = j.porteurs[p.id]!;
    const pv = pvMaxCombat(j, p.id);
    h += `<button type="button" class="carte-porteur${choisi ? ' choisi' : ''}" style="--c:${COULEUR[p.lignee]}" data-action="choisir" data-id="${p.id}"${!libre && !choisi ? ' disabled' : ''} aria-pressed="${choisi}">`
      + `${avatar(p.id, 72)}${choisi ? `<span class="rang">${e.escouade.indexOf(p.id) + 1}</span>` : ''}<strong>${echap(p.nom)}</strong><small class="lignee">${NOM_LIGNEE[p.lignee]}</small>`
      + jaugePv(pv, p.pvMax, d.usure, usureMax(p.id)) + `<small>${libre || choisi ? `PV ${pv} · ${gestesDe(j, p.id).length} cartes` : ep?.interdits?.includes(p.id) ? 'Pas pour cette Épreuve' : enMission(j, p.id) ? 'En mission' : d.poste ? `Au travail · ${echap(batimentDef(d.poste).nom)}` : 'Absent'}</small>`
      + marqueDe(j, p.id) + `</button>`;
  }
  h += `</div>`;
  // les cartes de chaque Porteur choisi : un raccourci vers sa feuille de deck
  if (e.escouade.length) {
    h += `<section class="bloc decks-porteurs"><h3 class="titre-bloc">${ICO.cartes}Le deck de l’escouade</h3><p class="aide">Touche un Porteur pour changer ses cartes.</p><div class="rangee">`
      + e.escouade.map((id) => `<button type="button" class="tuile-porteur" style="--c:${COULEUR[porteurDef(id).lignee]}" data-action="deck" data-id="${id}">${avatar(id, 44)}<strong>${echap(porteurDef(id).nom)}</strong><small>${j.porteurs[id]!.modules.length} / ${DISTRICT.cartesMax} cartes</small></button>`).join('')
      + `</div></section>`;
  }
  h += `<p class="aide">Après l’expédition, chacun gagne de l’Usure : la Clinique la soigne pendant qu’il se repose.</p></main>`;
  const maigre = e.escouade.length === 3 && deck < deckMin;
  h += `<footer class="pied-fixe"><div class="pied-info"><span class="chiffre">${e.escouade.length} / 3</span><small${maigre ? ' class="alerte"' : ''}>${e.escouade.length ? `${deck} cartes dans le deck${maigre ? ` · ${deckMin} au moins` : ''}` : 'Personne pour l’instant'}</small></div>`
    + `<button type="button" class="btn prim large" data-action="partir"${e.escouade.length === 3 ? '' : ' disabled'}>${ep ? `${ICO.boost}Tenter l’Épreuve` : fouille ? `${ICO.cristal}Fouiller` : `${ICO.descendre}Partir`}</button></footer>`;
  h += feuilleDeck(e);
  h += e.message ? `<button type="button" class="toast seul" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(e.message)}</span></button>` : '';
  return h + `</div>`;
}

export { POSTES };
