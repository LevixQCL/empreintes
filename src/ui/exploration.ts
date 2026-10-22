// La carte d'une Strate : l'escouade descend salle par salle jusqu'au gardien.
// Vue d'en haut : l'entrée en haut, le gardien tout en bas ; on touche une salle voisine pour y aller.
//
// Refonte du 22 octobre 2026 (Bryan : « le plus moche »). Avant : des hexagones gris à icône au trait, des pointillés,
// une illustration encadrée posée sur un fond uni, une légende en texte. Maintenant, un relevé de la Strate projeté dans la salle :
// - le décor n'a plus de cadre : l'illustration nette se fond dans la même salle floutée qui remplit l'écran (htmlLieu) ;
// - chaque salle est un médaillon de cristal qui montre ce qu'elle contient : le portrait de l'ennemi (combat, salle scellée,
//   gardien), une icône peinte (cache, archives, filon, entrée), une petite scène peinte (campement, rencontre) ;
//   l'anneau prend la couleur du type de salle ;
// - les couloirs sont des fils de lumière : or pour le chemin parcouru, glace qui coule vers les salles accessibles,
//   pointillés pour l'avenir, presque effacés pour les branches qu'on ne prendra plus ;
// - à côté : l'escouade en portraits (comme en combat), puis « Où aller ? », une carte par salle accessible,
//   avec ce qui l'attend (l'ennemi et sa faiblesse, le repos, la cache…).

import { accessibles, peutRemonter, rangsDe, salleCourante, type Expedition, type Salle, type TypeSalle } from '../core/expedition';
import { CONDITIONS, NOMS_LIGNEE, ZONES, ennemiDef, porteurDef } from '../core/donnees';
import { BATTU_PAR } from '../core/regles';
import { CIBLES_FOUILLE, RENCONTRES, type Jeu } from '../core/jeu';
import { decorStrate, illustrationEnnemi, portrait } from './art';
import { COULEUR, echap, htmlLieu, jauge } from './vue';
import { ICO, icone } from './icones';
import type { LigneeGeste } from '../core/types';

const NOMS: Record<TypeSalle, string> = {
  entree: 'Entrée', combat: 'Combat', elite: 'Salle scellée', cache: 'Cache', rencontre: 'Rencontre', camp: 'Campement', archive: 'Archives', gardien: 'Gardien', filon: 'Filon',
};

/** la couleur de l'anneau de chaque type de salle */
const TEINTE: Record<TypeSalle, string> = {
  entree: '#CDEFFF', combat: '#FF8A5C', elite: '#B88CFF', cache: '#F0C96A', rencontre: '#7FE3D2', camp: '#93DE8C', archive: '#8FC2FF', gardien: '#FF5D4D', filon: '#7FD4FF',
};

/** icônes peintes (public/art/icones/) des salles qui en ont une */
const baseIcones = new URL('art/icones/', document.baseURI).href;
const PEINTES: Partial<Record<TypeSalle, string>> = { entree: 'strate', cache: 'composants', archive: 'codex', filon: 'eclats' };

/**
 * Scènes peintes (public/art/salles/) : l'illustration entière, recadrée dans le médaillon comme un portrait d'ennemi.
 * Le feu de camp (Midjourney, 22 octobre 2026) est une scène pleine, sans fond uni : on ne le détoure pas, on le cadre.
 */
const baseSalles = new URL('art/salles/', document.baseURI).href;
const SCENES: Partial<Record<TypeSalle, { fichier: string; cadrage: [number, number, number] }>> = {
  camp: { fichier: 'campement', cadrage: [50, 56, 118] },
  rencontre: { fichier: 'rencontre', cadrage: [58, 52, 112] },
};

/** dessins de secours, si l'image d'une scène manque */
const GLYPHES: Partial<Record<TypeSalle, string>> = {
  camp: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-feu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".45" stop-color="#FFB547"/><stop offset="1" stop-color="#D2552A"/></linearGradient></defs>'
    + '<path fill="url(#g-feu)" d="M12 2.5c1.2 3.6 5 5.2 5 10a5 5 0 0 1-10 0c0-2.3 1.1-3.6 2.2-4.5.2 1.8 1.1 2.8 2.2 3.2.3-3.2-1.1-5.8.6-8.7z"/>'
    + '<path fill="#FFF6D8" opacity=".85" d="M12 11.5c.6 1.6 2 2.3 2 4a2 2 0 0 1-4 0c0-1 .5-1.6 1-2 .1.7.5 1.1 1 1.3.1-1.3-.5-2.3 0-3.3z"/>'
    + '<path stroke="#6B3A1E" stroke-width="1.6" stroke-linecap="round" d="M5.5 21l13-3M18.5 21l-13-3"/></svg>',
  rencontre: '<span class="sa-glyphe-texte" aria-hidden="true">?</span>',
};

/** recadrage des portraits d'ennemis dans un médaillon : centre (x %, y %) et taille de l'image (%) */
const CADRAGE: Record<string, [number, number, number]> = {
  'automate-graveur': [36, 44, 170], brigadier: [50, 10, 170], confluence: [40, 30, 150], double: [48, 14, 170], 'echo-veilleur': [44, 10, 170],
  'essaim-ambre': [50, 28, 170], 'gardien-registres': [52, 10, 180], pilleur: [46, 18, 180], 'premier-porteur': [50, 6, 170], rampeur: [50, 16, 160],
  remanent: [40, 14, 160], 'remanent-faible': [40, 14, 160], 'sentinelle-verre': [50, 14, 180], tisseuse: [50, 30, 160], vigie: [52, 36, 170],
};

const posX = (s: Salle) => ((s.col + 1) / (s.nCol + 1)) * 100;
/** la carte d'une fouille est plus courte (4 rangées) : on l'étale sur la même hauteur */
let rangs = 7;
const posY = (s: Salle) => 7.5 + (s.rang * 78.5) / (rangs - 1);

/** l'intérieur d'un médaillon : portrait de l'ennemi, icône peinte ou dessin */
function medaillon(s: Salle, classe = ''): string {
  const ill = s.ennemi ? illustrationEnnemi(s.ennemi) : null;
  if (ill) {
    const [cx, cy, z] = CADRAGE[s.ennemi!] ?? [50, 28, 210];
    return `<span class="sa-medaillon ennemi ${classe}" style="--img:url(${ill});--pos:${cx}% ${cy}%;--zoom:${z}%"><span class="sa-image"></span></span>`;
  }
  const scene = SCENES[s.type];
  if (scene) {
    const [cx, cy, z] = scene.cadrage;
    return `<span class="sa-medaillon scene ${classe}" style="--img:url(${baseSalles}${scene.fichier}.webp);--pos:${cx}% ${cy}%;--zoom:${z}%"><span class="sa-image"></span></span>`;
  }
  const peinte = PEINTES[s.type];
  if (peinte) return `<span class="sa-medaillon peinte ${classe}"><img src="${baseIcones}${peinte}.webp" alt="" decoding="async"></span>`;
  return `<span class="sa-medaillon glyphe ${classe}">${GLYPHES[s.type] ?? ICO.cristal}</span>`;
}

/** le nom affiché sous une salle */
const nomSalle = (s: Salle) => (s.escorte?.length ? 'Un groupe' : s.ennemi && s.type !== 'elite' ? ennemiDef(s.ennemi).nom : NOMS[s.type]);
/** les ennemis d'une salle de groupe, pour l'annonce : « Pilleur de Strates, Vigie de dépôt » */
const nomsGroupe = (s: Salle) => [s.ennemi!, ...(s.escorte ?? [])].map((id) => ennemiDef(id).nom).join(', ');

/** ce qui attend l'escouade dans une salle accessible : pour choisir sa route en connaissance de cause */
function annonce(s: Salle, x: Expedition): { sur: string; titre: string; texte: string; tag?: boolean; faible?: LigneeGeste } {
  if (s.ennemi) {
    const d = ennemiDef(s.ennemi);
    const faible = BATTU_PAR[d.lignee];
    if (s.type === 'gardien') return { sur: 'GARDIEN DE LA ZONE', titre: d.nom, texte: d.tag, tag: true, faible };
    if (s.type === 'elite') return { sur: 'SALLE SCELLÉE', titre: d.nom, texte: 'Plus coriace, mais une carte dort derrière', faible };
    if (s.escorte?.length) return { sur: `COMBAT · ${s.escorte.length + 1} ENNEMIS`, titre: 'Un groupe', texte: `${nomsGroupe(s)} : choisis qui frapper` };
    return { sur: 'COMBAT', titre: d.nom, texte: d.tag, tag: true, faible };
  }
  switch (s.type) {
    case 'cache': return { sur: 'CACHE', titre: 'Une cache de fouilleur', texte: x.strate >= 3 ? 'Des composants, parfois un Éclat' : 'Des composants oubliés sous les gravats' };
    case 'camp': return { sur: 'CAMPEMENT', titre: 'Un campement', texte: 'L’escouade souffle : +35 % de PV. On peut remonter d’ici.' };
    case 'archive': return { sur: 'ARCHIVES', titre: 'Une salle d’archives', texte: 'Un fragment de l’histoire, et quelques composants' };
    case 'rencontre': return { sur: 'RENCONTRE', titre: 'Quelqu’un, dans le noir', texte: 'Un choix à faire. On ne sait pas encore qui.' };
    case 'filon': return { sur: 'FILON', titre: 'Le filon', texte: 'Ce que tu cherchais : la fouille s’achève ici.' };
    default: return { sur: NOMS[s.type].toUpperCase(), titre: NOMS[s.type], texte: '' };
  }
}

const CHEVRON = '<svg class="ico route-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

export function htmlExploration(j: Jeu): string {
  const x = j.expedition as Expedition;
  const c = x.carte!;
  const ici = salleCourante(x);
  const voisines = new Set(accessibles(x).map((s) => s.id));
  const libre = !x.rencontre && x.phase === 'carte' && !x.terminee;
  const zone = ZONES[c.zone]!;
  rangs = rangsDe(c);
  const decor = decorStrate(c.zone);
  /** une salle qu'on ne visitera plus : sur une rangée déjà passée, ou au même niveau que l'escouade */
  const perdue = (s: Salle) => !s.faite && s.id !== ici.id && s.rang <= ici.rang;

  let h = htmlLieu(x) + `<div class="ecran ecran-jeu ecran-exploration z-${c.zone}">`;
  h += `<header class="combat-barre"><div class="puces"><span class="puce">${ICO.strate}Strate −${x.strate}</span>`
    + (x.fouille ? `<span class="puce">Fouille · ${echap(CIBLES_FOUILLE[x.fouille].nom)}</span>` : '')
    + `</div><span class="puce butin-puce">${icone('composants')}${x.butin}</span></header>`;

  // ---------- la carte ----------
  h += `<section class="carte-strate" aria-label="Carte de la Strate"${decor ? ` style="--decor:url(${decor})"` : ''}>`
    + `<span class="cs-decor" aria-hidden="true"></span><span class="cs-voile" aria-hidden="true"></span><span class="cs-releve" aria-hidden="true"><i></i></span>`;

  // les couloirs : une courbe douce d'une salle à l'autre ; un halo sous le chemin parcouru et sous les couloirs ouverts
  let fils = '';
  let halos = '';
  for (const s of c.salles) {
    for (const v of s.voisins) {
      const t = c.salles[v]!;
      if (t.rang < s.rang) continue;
      const etat = s.id === ici.id && voisines.has(v) && libre ? 'ouvert' : s.faite && t.faite ? 'parcouru' : perdue(t) || perdue(s) ? 'perdu' : 'avenir';
      const x1 = posX(s), y1 = posY(s), x2 = posX(t), y2 = posY(t), ym = (y1 + y2) / 2;
      const d = `M${x1} ${y1}C${x1} ${ym} ${x2} ${ym} ${x2} ${y2}`;
      if (etat === 'ouvert' || etat === 'parcouru') halos += `<path class="c-${etat} halo" d="${d}"/>`;
      fils += `<path class="c-${etat}" d="${d}"/>`;
    }
  }
  h += `<svg class="couloirs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${halos}${fils}</svg>`;

  for (const s of c.salles) {
    const acces = voisines.has(s.id) && libre;
    const etat = s.id === ici.id ? 'ici' : acces ? 'accessible' : s.faite ? 'faite' : perdue(s) ? 'perdue' : 'loin';
    const classes = `salle s-${s.type} ${etat}`;
    const nom = nomSalle(s);
    const label = `${s.condition && CONDITIONS[s.condition] ? `${CONDITIONS[s.condition]!.nom} · ` : ''}${NOMS[s.type]}${s.escorte?.length ? ` : un groupe (${nomsGroupe(s)})` : s.ennemi ? ` : ${ennemiDef(s.ennemi).nom}` : ''}${etat === 'ici' ? ' (tu es ici)' : s.faite ? ' (visitée)' : ''}`;
    let dedans = medaillon(s);
    if (s.type === 'elite') dedans += `<span class="sa-sceau" aria-hidden="true">${ICO.verrou}</span>`;
    if (s.escorte?.length) dedans += `<span class="sa-groupe" aria-hidden="true">×${s.escorte.length + 1}</span>`;
    if (s.condition) dedans += `<span class="sa-condition" aria-hidden="true" title="${echap(CONDITIONS[s.condition]?.nom ?? '')}">${ICO.cristal}</span>`;
    if (etat === 'ici') {
      dedans += `<span class="sa-escouade" aria-hidden="true">${x.porteurs.map((p) => {
        const img = portrait(p.id);
        const d = porteurDef(p.id);
        return `<i style="--c:${COULEUR[d.lignee]}"${p.pv <= 0 ? ' class="ko"' : ''}>${img ? `<img src="${img}" alt="">` : echap(d.nom.charAt(0))}</i>`;
      }).join('')}</span>`;
    }
    dedans += `<span class="sa-nom">${echap(nom)}</span>`;
    const style = `left:${posX(s).toFixed(2)}%;top:${posY(s).toFixed(2)}%;--t:${TEINTE[s.type]}`;
    h += acces
      ? `<button type="button" class="${classes}" style="${style}" data-action="salle" data-id="${s.id}" aria-label="Aller : ${echap(label)}">${dedans}</button>`
      : `<span class="${classes}" style="${style}" role="img" aria-label="${echap(label)}" title="${echap(label)}">${dedans}</span>`;
  }
  h += `<div class="cs-titre"><span class="surtitre">${x.fouille ? 'FOUILLE · ' : ''}STRATE −${x.strate}</span><strong>${echap(zone.nom)}</strong></div>`;
  h += `</section>`;

  // ---------- l'escouade : les mêmes portraits qu'en combat ; les PV ne remontent qu'aux campements ----------
  h += '<section class="escouade-combat" aria-label="Escouade">';
  for (const p of x.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    const img = portrait(d.id);
    h += `<div class="combattant${ko ? ' ko' : ''}${!ko && p.pv / p.pvMax <= 0.3 ? ' bas' : ''}" data-porteur="${p.id}" style="--c:${COULEUR[d.lignee]}">`
      + (img ? `<span class="cb-fond" style="background-image:url(${img})" aria-hidden="true"></span>` : '')
      + `<span class="avatar${img ? '' : ' sans-portrait'}" style="--t:34px" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
      + `<div class="cb-infos"><span class="n">${echap(d.nom)}</span><span class="cb-lignee" aria-hidden="true">${ko ? 'À terre' : NOMS_LIGNEE[d.lignee].nom}</span>`
      + `<div class="cb-vie">${jauge('jp', Math.max(0, p.pv), p.pvMax, { pas: 5 })}<span class="chiffre" aria-label="${ko ? 'À terre' : `${p.pv} PV sur ${p.pvMax}`}">${ko ? '0' : p.pv}<small aria-hidden="true">/ ${p.pvMax}</small></span></div></div></div>`;
  }
  h += '</section>';

  // ---------- le panneau : la rencontre en cours, ou la salle où l'on est et les routes possibles ----------
  h += `<section class="panneau-exploration" aria-live="polite">`;
  if (x.rencontre) {
    const r = RENCONTRES[x.rencontre]!(j);
    h += `<div class="ici-tete" style="--t:${TEINTE.rencontre}">${medaillon({ ...ici, type: 'rencontre', ennemi: undefined }, 'petit')}<div><span class="surtitre">RENCONTRE</span><h2>${echap(r.titre)}</h2></div></div>`
      + `<p class="recit">${echap(r.texte)}</p><div class="choix-rencontre">`
      + r.options.map((o, k) => `<button type="button" class="route choix" data-action="repondre" data-id="${k}"><span class="route-txt"><strong>${echap(o)}</strong></span>${CHEVRON}</button>`).join('') + `</div>`;
  } else {
    h += `<div class="ici-tete" style="--t:${TEINTE[ici.type]}">${medaillon(ici, 'petit')}<div><span class="surtitre">TU ES ICI</span><h2>${echap(ici.type === 'entree' ? 'L’entrée de la Strate' : NOMS[ici.type])}</h2></div></div>`;
    if (x.recit) h += `<p class="recit">${echap(x.recit)}</p>`;
    if (libre) {
      const routes = accessibles(x);
      h += `<div class="routes"><span class="surtitre">${routes.length > 1 ? 'OÙ ALLER ?' : 'LA SUITE'}</span>`;
      for (const s of routes) {
        const a = annonce(s, x);
        h += `<button type="button" class="route s-${s.type}" style="--t:${TEINTE[s.type]}" data-action="salle" data-id="${s.id}">`
          + medaillon(s, 'petit')
          + `<span class="route-txt"><small>${a.sur}</small><strong>${echap(a.titre)}</strong>`
          + (a.texte ? `<em>${a.tag ? `<span class="tag-ennemi">${echap(a.texte)}</span>` : echap(a.texte)}${a.faible ? ` · <span class="faible" style="--c:${COULEUR[a.faible]}">faible contre <b>${NOMS_LIGNEE[a.faible].court}</b></span>` : ''}</em>` : '')
          + (s.condition && CONDITIONS[s.condition] ? `<em class="condition-salle">${ICO.cristal}<b>${echap(CONDITIONS[s.condition]!.nom)}</b> : ${echap(CONDITIONS[s.condition]!.texte)}</em>` : '')
          + `</span>${CHEVRON}</button>`;
      }
      h += `</div>`;
    }
  }
  const g = x.gains;
  const cartes = (g?.elites ?? 0) + (g?.cartes ?? 0);
  h += `<div class="butin-exploration"><span class="surtitre">BUTIN</span><span>${icone('composants')}<b>${x.butin}</b> composants</span>`
    + (cartes ? `<span>${icone('cartes')}<b>${cartes}</b> carte${cartes > 1 ? 's' : ''}</span>` : '')
    + (g?.eclats ? `<span>${icone('eclats')}<b>${g.eclats}</b> Éclat${g.eclats > 1 ? 's' : ''}</span>` : '')
    + (g?.fragment ? `<span>${icone('codex')}archives</span>` : '') + `</div>`;
  if (x.terminee) h += `<button type="button" class="btn prim large" data-action="remonter">${ICO.cristal}Remonter avec le filon</button>`;
  else if (peutRemonter(x)) h += `<button type="button" class="btn sec large" data-action="retraite">${ICO.retour}Remonter au district avec le butin</button>`;
  else if (libre) h += `<p class="aide">Les PV ne remontent qu’aux campements. On ne peut remonter que depuis l’entrée ou un campement.</p>`;
  h += `</section>`;

  return h + `</div>`;
}
