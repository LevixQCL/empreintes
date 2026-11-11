// L'écran de « Toutes les courses » (prototype du Récit d'Ilka, 11 novembre 2026) : la grille du district vue de dessus,
// la route tracée en or, Ilka qui avance, les cartes proposées en bas. Les règles sont dans core/course-ilka.ts.

import {
  CARTES, COURSE, avance, casesPosees, caseEn, directionsPossibles, etoilesCourse, raccourci,
  type Dir, type EtatCourse, type GenreCarte,
} from '../core/course-ilka';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

export interface EcranCourse {
  etat: EtatCourse;
  intro: boolean;
  /** la carte choisie (id de l'offre, ou « geste »), en attente d'une direction */
  choisie: string | null;
}

const NOMS_CASES: Record<string, string> = {
  '~': tr('eau'), '#': tr('tour'), R: tr('passerelle rouillée'), Q: tr('quai'), $: tr('pourboire'), D: tr('la tour d’Ilka'), A: tr('arrivée'),
};

function genreChoisi(r: EcranCourse): GenreCarte | null {
  if (!r.choisie) return null;
  if (r.choisie === 'geste') return 'cable';
  return r.etat.offre.find((c) => c.id === r.choisie)?.genre ?? null;
}

function grille(r: EcranCourse): string {
  const e = r.etat;
  const genre = genreChoisi(r);
  // les cases que la carte choisie poserait, par direction
  const cibles = new Map<string, Dir>();
  const fantomes = new Set<string>();
  if (genre) for (const d of directionsPossibles(e, genre)) {
    const cases = casesPosees(e, genre, d)!;
    cases.forEach((p) => fantomes.add(`${p.l},${p.c}`));
    const fin = cases[cases.length - 1]!;
    cibles.set(`${fin.l},${fin.c}`, d);
  }
  const iRoute = new Map(e.route.map((p, i) => [`${p.l},${p.c}`, i]));
  const fragiles = new Map(e.fragiles.map((f) => [`${f.p.l},${f.p.c}`, f.cede - e.tour]));
  const L = e.grille.length, C = e.grille[0]!.length;
  let h = `<div class="ci-grille" style="--cols:${C};--lignes:${L}">`;
  for (let l = 0; l < L; l++) for (let c = 0; c < C; c++) {
    const k = `${l},${c}`;
    const t = caseEn(e, { l, c })!;
    const i = iRoute.get(k);
    const classes = ['ci-case', `t-${t === '~' ? 'eau' : t === '#' ? 'tour' : t === 'R' ? 'rouillee' : t === 'Q' ? 'quai' : t === '$' ? 'pourboire' : t === 'D' ? 'depart' : 'arrivee'}`];
    if (i !== undefined) classes.push(i < e.ilka ? 'ci-passe' : 'ci-route');
    if (fantomes.has(k)) classes.push('ci-fantome');
    const d = cibles.get(k);
    if (d) classes.push('ci-cible');
    const contenu = (i === e.ilka ? `<span class="ci-ilka" aria-label="${tr`Ilka`}"></span>` : '')
      + (fragiles.has(k) && i !== undefined && i > e.ilka ? `<b class="ci-compte">${fragiles.get(k)}</b>` : '')
      + (t === 'Q' ? `<small>${tr`T${COURSE.fermetureQuais}`}</small>` : '');
    const attrs = `class="${classes.join(' ')}" aria-label="${NOMS_CASES[t]}"`;
    h += d ? `<button type="button" ${attrs} data-action="course-poser" data-id="${d}">${contenu}</button>` : `<div ${attrs}>${contenu}</div>`;
  }
  // la route, tracée en or par-dessus la grille
  const pts = e.route.map((p) => `${p.c + 0.5},${p.l + 0.5}`).join(' ');
  const deja = e.route.slice(0, e.ilka + 1).map((p) => `${p.c + 0.5},${p.l + 0.5}`).join(' ');
  h += `<svg class="ci-trace" viewBox="0 0 ${C} ${L}" preserveAspectRatio="none" aria-hidden="true">`
    + `<polyline class="devant" points="${pts}"/><polyline class="derriere" points="${deja}"/></svg>`;
  return h + `</div>`;
}

function intro(): string {
  return `<section class="ci-intro"><p class="surtitre">${tr`Récit d’Ilka · Toutes les courses · Prototype`}</p><h1>${tr`La nuit du colis`}</h1>`
    + `<div class="ci-lignes"><p>${tr`2121, la nuit de l’élection. Un colis payé triple, sans nom d’expéditeur, à livrer de l’autre côté du district avant l’aube.`}</p>`
    + `<p>${tr`Ilka ne sait plus marcher lentement. Ses jambes partent, et elles ne s’arrêtent pas.`}</p></div>`
    + `<ul class="ci-regles">`
    + `<li>${tr`À chaque tour, choisis une carte parmi trois et pose-la au bout de la route. Puis Ilka avance d’une case, quoi qu’il arrive.`}</li>`
    + `<li>${tr`Si la route s’arrête sous ses pieds, elle tombe. Garde de l’avance.`}</li>`
    + `<li>${tr`Les passerelles rouillées et les quais sont des raccourcis gratuits. Mais une rouillée cède deux tours plus tard, et les quais ferment au tour ${COURSE.fermetureQuais}.`}</li>`
    + `<li>${tr`Le colis doit arriver avant l’aube, au tour ${COURSE.aube}. Une fois par course, ses jambes connaissent une route de 2070 : un Câble offert.`}</li></ul>`
    + `<div class="ci-pied"><button type="button" class="btn sec" data-action="course-quitter">${tr`Plus tard`}</button>`
    + `<button type="button" class="btn prim" data-action="course-commencer">${tr`Courir`}</button></div></section>`;
}

function fin(e: EtatCourse): string {
  if (e.issue === 'arrivee') {
    const n = etoilesCourse(e);
    return `<div class="ci-voile"></div><section class="ci-fin" role="dialog" aria-modal="true">`
      + `<p class="ci-etoiles" aria-label="${tr`${n} étoiles sur 3`}">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></p>`
      + `<h2>${tr`Colis livré`}</h2><p>${tr`Elle ne pose jamais de question aux colis payés triple. C’est pour ça qu’on les lui confie.`}</p>`
      + `<ul class="ci-bilan"><li class="ok">${tr`Livrer avant l’aube`}</li><li class="${e.pourboire ? 'ok' : ''}">${tr`Empocher le pourboire`}</li>`
      + `<li class="${e.geste ? 'ok' : ''}">${tr`Ne pas avoir eu besoin du geste d’une autre`}</li></ul>`
      + `<div class="ci-pied"><button type="button" class="btn sec" data-action="course-rejouer">${tr`Recourir`}</button>`
      + `<button type="button" class="btn prim" data-action="course-quitter">${tr`Retour au district`}</button></div></section>`;
  }
  const pourquoi = e.issue === 'chute' ? tr('La route s’est arrêtée sous ses pieds. Elle se rattrape à un câble, mais le colis est tombé.')
    : tr('L’aube se lève avant qu’elle arrive. Le colis est en retard, et la compagnie retiendra la course sur sa dette.');
  return `<div class="ci-voile"></div><section class="ci-fin" role="dialog" aria-modal="true"><h2>${tr`Course ratée`}</h2><p>${pourquoi}</p>`
    + `<p class="ci-conseil">${tr`Les Câbles et les Grands ponts donnent de l’avance : garde-les pour les moments où un raccourci se coupe.`}</p>`
    + `<div class="ci-pied"><button type="button" class="btn sec" data-action="course-quitter">${tr`Retour au district`}</button>`
    + `<button type="button" class="btn prim" data-action="course-rejouer">${tr`Recourir`}</button></div></section>`;
}

export function htmlCourse(r: EcranCourse): string {
  if (r.intro) return `<div class="ecran course-ilka"><div class="ci-page">${intro()}</div></div>`;
  const e = r.etat;
  const av = avance(e);
  const rc = raccourci(e);
  const genre = genreChoisi(r);
  const bloquee = genre !== null && directionsPossibles(e, genre).length === 0;
  let h = `<div class="ecran course-ilka"><div class="ci-page">`
    + `<header class="ci-tete"><div><span class="surtitre">${tr`Récit d’Ilka · Prototype`}</span><h1>${tr`La nuit du colis`}</h1></div>`
    + `<button type="button" class="btn sec petit" data-action="course-quitter">${tr`Quitter`}</button></header>`
    + `<div class="ci-infos"><span>${tr`Tour ${e.tour}`}<small>${tr`aube au tour ${COURSE.aube}`}</small></span>`
    + `<span class="${av <= 0 ? 'danger' : av === 1 ? 'juste' : ''}">${tr`Avance : ${av}`}<small>${av <= 0 ? tr('elle tombe si rien n’est posé') : tr('case(s) de route devant elle')}</small></span></div>`
    + grille(r);
  if (e.journal.length) h += `<p class="ci-journal" role="status">${e.journal.map(echap).join(' ')}</p>`;
  h += `<section class="ci-plateau"><p class="ci-aide">${genre ? (bloquee ? tr('Cette carte ne peut aller nulle part. Choisis-en une autre.') : tr('Touche une case dorée sur la grille pour poser la carte.')) : tr('Choisis une carte, puis touche une case dorée sur la grille.')}</p>`
    + `<div class="ci-offre">${e.offre.map((c) => `<button type="button" class="ci-carte g-${c.genre}${r.choisie === c.id ? ' choisie' : ''}" data-action="course-choisir" data-id="${c.id}" aria-pressed="${r.choisie === c.id}">`
      + `<strong>${CARTES[c.genre].nom}</strong><small>${CARTES[c.genre].texte}</small><b>+${CARTES[c.genre].longueur}</b></button>`).join('')}</div>`
    + `<div class="ci-actions">`
    + (e.geste ? `<button type="button" class="btn sec petit ci-geste${r.choisie === 'geste' ? ' choisie' : ''}" data-action="course-choisir" data-id="geste">${tr`Le geste d’une autre`}</button>` : '')
    + (rc ? `<button type="button" class="btn sec petit ci-raccourci" data-action="course-raccourci">${rc.genre === 'R' ? tr`Prendre la rouillée (+${rc.cases.length})` : tr`Prendre les quais (+${rc.cases.length})`}</button>` : '')
    + `<button type="button" class="btn sec petit" data-action="course-passer">${tr`Ne rien poser`}</button></div></section>`;
  h += `</div>`;
  if (e.issue !== 'en-cours') h += fin(e);
  return h + `</div>`;
}

