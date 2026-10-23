// La carte d'une Strate : l'escouade descend salle par salle jusqu'au gardien.
// Vue d'en haut : l'entrée en haut, le gardien tout en bas ; on touche une salle voisine pour y aller.
//
// Revue du 22 octobre 2026 (même équipe que la feuille de bâtiment et l'écran Escouade) :
// - lisibilité : plus aucun texte sous 12 px ; la carte a la hauteur de ses rangées (une fouille n'est plus étirée) ;
//   l'escouade montre ses vrais PV (« 10 / 38 ») ; la profondeur se lit d'un coup d'œil (« gardien dans 5 salles ») ;
// - direction artistique : plus de cartouches ni de plaques à coins coupés, plus de balayage ni de couronne d'ornement ;
//   deux accents seulement : glace pour les salles où l'on peut aller, or pour le chemin parcouru et le butin ;
//   le rouge doux ne marque que le gardien. Les ennemis des routes sont montrés en grand (portraits 3:4 qui se fondent) ;
// - UX : « Où aller ? » dit ce que chaque salle rapporte et coûte en vrais chiffres (PV de l'ennemi, composants,
//   PV rendus au campement), la sortie possible est chiffrée, le butin ne s'affiche qu'une fois.

import './exploration-refonte.css';
import { accessibles, butinCombat, forceStrate, peutRemonter, rangsDe, salleCourante, type Expedition, type Salle, type TypeSalle } from '../core/expedition';
import { PART_GROUPE } from '../core/combat';
import { CONDITIONS, NOMS_LIGNEE, ZONES, ennemiDef, porteurDef } from '../core/donnees';
import { BATTU_PAR } from '../core/regles';
import { CIBLES_FOUILLE, RENCONTRES, type Jeu } from '../core/jeu';
import { decorStrate, illustrationEnnemi, portrait } from './art';
import { COULEUR, echap, htmlLieu } from './vue';
import { ICO, icone } from './icones';

const NOMS: Record<TypeSalle, string> = {
  entree: 'Entrée', combat: 'Combat', elite: 'Salle scellée', cache: 'Cache', rencontre: 'Rencontre', camp: 'Campement', archive: 'Archives', gardien: 'Gardien', filon: 'Filon',
};

/** icônes peintes (public/art/icones/) des salles qui en ont une */
const baseIcones = new URL('art/icones/', document.baseURI).href;
const PEINTES: Partial<Record<TypeSalle, string>> = { entree: 'strate', cache: 'composants', archive: 'codex', filon: 'eclats' };

/** scènes peintes (public/art/salles/), recadrées dans le médaillon */
const baseSalles = new URL('art/salles/', document.baseURI).href;
const SCENES: Partial<Record<TypeSalle, { fichier: string; cadrage: [number, number, number] }>> = {
  camp: { fichier: 'campement', cadrage: [50, 56, 118] },
  rencontre: { fichier: 'rencontre', cadrage: [58, 52, 112] },
};

/** recadrage des portraits d'ennemis dans un médaillon : centre (x %, y %) et taille de l'image (%) */
const CADRAGE: Record<string, [number, number, number]> = {
  'automate-graveur': [36, 44, 170], brigadier: [50, 10, 170], confluence: [40, 30, 150], double: [48, 14, 170], 'echo-veilleur': [44, 10, 170],
  'essaim-ambre': [50, 28, 170], 'gardien-registres': [52, 10, 180], pilleur: [46, 18, 180], 'premier-porteur': [50, 6, 170], rampeur: [50, 16, 160],
  remanent: [40, 14, 160], 'remanent-faible': [40, 14, 160], 'sentinelle-verre': [50, 14, 180], tisseuse: [50, 30, 160], vigie: [52, 36, 170],
};

/** l'intérieur d'un médaillon de la carte : portrait de l'ennemi, scène peinte ou icône peinte */
function medaillon(s: Pick<Salle, 'type' | 'ennemi'>): string {
  const ill = s.ennemi ? illustrationEnnemi(s.ennemi) : null;
  if (ill) {
    const [cx, cy, z] = CADRAGE[s.ennemi!] ?? [50, 28, 210];
    return `<span class="ex-med" style="--img:url(${ill});--pos:${cx}% ${cy}%;--zoom:${z}%"><i></i></span>`;
  }
  const scene = SCENES[s.type];
  if (scene) {
    const [cx, cy, z] = scene.cadrage;
    return `<span class="ex-med" style="--img:url(${baseSalles}${scene.fichier}.webp);--pos:${cx}% ${cy}%;--zoom:${z}%"><i></i></span>`;
  }
  const peinte = PEINTES[s.type];
  return `<span class="ex-med peinte">${peinte ? `<img src="${baseIcones}${peinte}.webp" alt="" decoding="async">` : ICO.cristal}</span>`;
}

/** la grande image d'une route : l'ennemi en portrait 3:4, sinon la scène ou l'icône peinte */
function visuel(s: Salle): string {
  const ill = s.ennemi ? illustrationEnnemi(s.ennemi) : null;
  if (ill) return `<span class="ex-visuel portrait"><img src="${ill}" alt="" decoding="async"></span>`;
  const scene = SCENES[s.type];
  if (scene) return `<span class="ex-visuel scene"><img src="${baseSalles}${scene.fichier}.webp" alt="" decoding="async"></span>`;
  const peinte = PEINTES[s.type];
  return `<span class="ex-visuel icone">${peinte ? `<img src="${baseIcones}${peinte}.webp" alt="" decoding="async">` : ICO.cristal}</span>`;
}

/** le nom affiché sous une salle */
const nomSalle = (s: Salle) => (s.escorte?.length ? 'Un groupe' : s.ennemi && s.type !== 'elite' ? ennemiDef(s.ennemi).nom : NOMS[s.type]);
const nomsGroupe = (s: Salle) => [s.ennemi!, ...(s.escorte ?? [])].map((id) => ennemiDef(id).nom).join(', ');
const composantsSalle = (strate: number) => Math.round(8 * (1 + 0.25 * (strate - 1)));

/** les PV réels des ennemis d'une salle (même calcul que le moteur : force de la Strate, renfort, part du groupe) */
function pvEnnemis(s: Salle, x: Expedition): number[] {
  const groupe = [s.ennemi!, ...(s.escorte ?? [])];
  const force = forceStrate(x.strate) * (x.facteur ?? 1) * (s.type === 'elite' ? 1.15 : 1) * (PART_GROUPE[groupe.length] ?? PART_GROUPE[3]!);
  return groupe.map((id) => Math.round(ennemiDef(id).pvMax * force));
}

/** ce qui attend l'escouade dans une salle accessible, en vrais chiffres */
function annonce(s: Salle, x: Expedition): { sur: string; titre: string; texte: string; faits: string[] } {
  const n = composantsSalle(x.strate);
  const or = (t: string) => `<b class="ex-or">${t}</b>`;
  if (s.ennemi) {
    const d = ennemiDef(s.ennemi);
    const faible = BATTU_PAR[d.lignee];
    const pv = pvEnnemis(s, x);
    const faits = [`<span class="ex-pv"><b>${pv.join(' + ')}</b> PV</span>`];
    if (!s.escorte?.length) faits.push(`faible contre <b class="ex-lignee" style="--c:${COULEUR[faible]}">${NOMS_LIGNEE[faible].nom}</b>`);
    if (s.type === 'gardien') return { sur: 'Gardien de la zone', titre: d.nom, texte: d.tag, faits: [...faits, `${or(`+${butinCombat(x.strate, 2)}`)} composants · fin de la Strate`] };
    if (s.type === 'elite') return { sur: 'Salle scellée', titre: d.nom, texte: 'Plus coriace, mais une carte dort derrière.', faits: [...faits, `${or(`+${Math.round(butinCombat(x.strate, 0) * 1.7)}`)} composants · ${or('1 carte')}`] };
    if (s.escorte?.length) return { sur: `Combat · ${s.escorte.length + 1} ennemis`, titre: 'Un groupe', texte: `${nomsGroupe(s)} : choisis qui frapper.`, faits: [...faits, `${or(`+${butinCombat(x.strate, 0)}`)} composants`] };
    return { sur: 'Combat', titre: d.nom, texte: d.tag, faits: [...faits, `${or(`+${butinCombat(x.strate, 0)}`)} composants`] };
  }
  switch (s.type) {
    case 'cache': return { sur: 'Cache', titre: 'Une cache de fouilleur', texte: 'Des composants oubliés sous les gravats, sans combat.', faits: [`${or(`+${n}`)} composants${x.strate >= 3 ? ' · parfois un Éclat' : ''}`] };
    case 'camp': {
      const rendus = x.porteurs.reduce((t, p) => t + Math.min(p.pvMax, Math.max(0, p.pv) + Math.round(p.pvMax * 0.35)) - Math.max(0, p.pv), 0);
      return { sur: 'Campement', titre: 'Un campement', texte: 'L’escouade souffle. On peut remonter d’ici avec tout le butin.', faits: [rendus ? `<span class="ex-vert">+${rendus} PV</span> pour l’escouade (+35 %)` : 'L’escouade est déjà en pleine forme'] };
    }
    case 'archive': return { sur: 'Archives', titre: 'Une salle d’archives', texte: 'Un fragment de l’histoire, à rapporter au district.', faits: [`${or(`+${Math.round(n / 2)}`)} composants · ${or('1 archive')}`] };
    case 'rencontre': return { sur: 'Rencontre', titre: 'Quelqu’un, dans le noir', texte: 'Un choix à faire. On ne sait pas encore qui.', faits: [] };
    case 'filon': return { sur: 'Filon', titre: 'Le filon', texte: 'Ce que tu cherchais : la fouille s’achève ici.', faits: x.fouille ? [echap(CIBLES_FOUILLE[x.fouille].texte)] : [] };
    default: return { sur: NOMS[s.type], titre: NOMS[s.type], texte: '', faits: [] };
  }
}

const CHEVRON = '<svg class="ico ex-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

export function htmlExploration(j: Jeu): string {
  const x = j.expedition as Expedition;
  const c = x.carte!;
  const ici = salleCourante(x);
  const voisines = new Set(accessibles(x).map((s) => s.id));
  const libre = !x.rencontre && x.phase === 'carte' && !x.terminee;
  const zone = ZONES[c.zone]!;
  const rangs = rangsDe(c);
  const decor = decorStrate(c.zone);
  const posX = (s: Salle) => ((s.col + 1) / (s.nCol + 1)) * 100;
  const posY = (s: Salle) => (s.rang / Math.max(1, rangs - 1)) * 100;
  /** une salle qu'on ne visitera plus : sur une rangée déjà passée, ou au même niveau que l'escouade */
  const perdue = (s: Salle) => !s.faite && s.id !== ici.id && s.rang <= ici.rang;
  const reste = rangs - 1 - ici.rang;
  const fin = x.fouille ? 'le filon' : 'le gardien';

  let h = htmlLieu(x) + `<div class="ecran ecran-exploration ex z-${c.zone}">`;

  // ---------- la tête : où l'on est, combien il reste, ce qu'on rapporte ----------
  const g = x.gains;
  const cartes = (g?.elites ?? 0) + (g?.cartes ?? 0);
  h += `<header class="ex-tete"><div class="ex-lieu"><span class="ex-sur">${x.fouille ? `Fouille · ${echap(CIBLES_FOUILLE[x.fouille].nom)}` : `Strate −${x.strate}`}</span>`
    + `<h1>${echap(zone.nom)}</h1>`
    + `<span class="ex-profondeur">${reste > 0 ? `Salle <b>${ici.rang + 1}</b> sur ${rangs} · ${fin} dans <b>${reste}</b> salle${reste > 1 ? 's' : ''}` : `Tu es devant ${fin}`}</span></div>`
    + `<div class="ex-butin" aria-label="Butin de l’expédition"><span>${icone('composants')}<b>${x.butin}</b><small>compos.</small></span>`
    + (cartes ? `<span>${icone('cartes')}<b>${cartes}</b><small>carte${cartes > 1 ? 's' : ''}</small></span>` : '')
    + (g?.eclats ? `<span>${icone('eclats')}<b>${g.eclats}</b><small>Éclat${g.eclats > 1 ? 's' : ''}</small></span>` : '')
    + (g?.fragment ? `<span>${icone('codex')}<b>1</b><small>archive</small></span>` : '') + `</div></header>`;

  // ---------- l'escouade : trois portraits, les vrais PV ----------
  h += '<section class="ex-escouade" aria-label="Escouade">';
  for (const p of x.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    const img = portrait(d.id);
    const part = Math.max(0, Math.min(100, (Math.max(0, p.pv) / p.pvMax) * 100));
    const bas = !ko && part <= 30;
    h += `<div class="ex-porteur${ko ? ' ko' : ''}${bas ? ' bas' : ''}" data-porteur="${p.id}" style="--c:${COULEUR[d.lignee]}">`
      + `<span class="ex-portrait" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
      + `<span class="ex-p-infos"><strong>${echap(d.nom)}</strong>`
      + `<span class="ex-p-pv" aria-label="${ko ? 'À terre' : `${p.pv} PV sur ${p.pvMax}`}">${ko ? 'À terre' : `<b>${p.pv}</b> / ${p.pvMax}`}</span>`
      + `<span class="ex-barre" aria-hidden="true"><i style="width:${part.toFixed(1)}%"></i></span></span></div>`;
  }
  h += '</section>';

  // ---------- la carte ----------
  h += `<section class="ex-carte" aria-label="Carte de la Strate" style="--rangs:${rangs}${decor ? `;--decor:url(${decor})` : ''}"><span class="ex-decor" aria-hidden="true"></span><span class="ex-sur ex-carte-titre">Plan de la Strate</span><div class="ex-plan">`;
  let fils = '';
  let halos = '';
  for (const s of c.salles) {
    for (const v of s.voisins) {
      const t = c.salles[v]!;
      if (t.rang < s.rang) continue;
      const etat = s.id === ici.id && voisines.has(v) && libre ? 'ouvert' : s.faite && t.faite ? 'parcouru' : perdue(t) || perdue(s) ? 'perdu' : 'avenir';
      const x1 = posX(s), y1 = posY(s), x2 = posX(t), y2 = posY(t), ym = (y1 + y2) / 2;
      const d = `M${x1.toFixed(2)} ${y1.toFixed(2)}C${x1.toFixed(2)} ${ym.toFixed(2)} ${x2.toFixed(2)} ${ym.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
      if (etat === 'ouvert' || etat === 'parcouru') halos += `<path class="c-${etat} halo" d="${d}"/>`;
      fils += `<path class="c-${etat}" d="${d}"/>`;
    }
  }
  h += `<svg class="ex-couloirs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${halos}${fils}</svg>`;

  for (const s of c.salles) {
    const acces = voisines.has(s.id) && libre;
    const etat = s.id === ici.id ? 'ici' : acces ? 'accessible' : s.faite ? 'faite' : perdue(s) ? 'perdue' : 'loin';
    const classes = `ex-salle t-${s.type} ${etat}`;
    const label = `${s.condition && CONDITIONS[s.condition] ? `${CONDITIONS[s.condition]!.nom} · ` : ''}${NOMS[s.type]}${s.escorte?.length ? ` : un groupe (${nomsGroupe(s)})` : s.ennemi ? ` : ${ennemiDef(s.ennemi).nom}` : ''}${etat === 'ici' ? ' (tu es ici)' : s.faite ? ' (visitée)' : ''}`;
    let dedans = medaillon(s);
    if (s.type === 'elite') dedans += `<span class="ex-badge sceau" aria-hidden="true">${ICO.verrou}</span>`;
    if (s.escorte?.length) dedans += `<span class="ex-badge groupe" aria-hidden="true">×${s.escorte.length + 1}</span>`;
    if (s.condition) dedans += `<span class="ex-badge condition" aria-hidden="true">${ICO.cristal}</span>`;
    const nom = etat === 'ici' ? 'Vous êtes ici' : nomSalle(s);
    dedans += `<span class="ex-nom">${echap(nom)}</span>`;
    const style = `left:${posX(s).toFixed(2)}%;top:${posY(s).toFixed(2)}%`;
    h += acces
      ? `<button type="button" class="${classes}" style="${style}" data-action="salle" data-id="${s.id}" aria-label="Aller : ${echap(label)}">${dedans}</button>`
      : `<span class="${classes}" style="${style}" role="img" aria-label="${echap(label)}" title="${echap(label)}">${dedans}</span>`;
  }
  h += `</div></section>`;

  // ---------- le panneau : la rencontre en cours, ou la suite du chemin ----------
  h += `<section class="ex-panneau" aria-live="polite">`;
  if (x.rencontre) {
    const r = RENCONTRES[x.rencontre]!(j);
    h += `<div class="ex-rencontre"><span class="ex-visuel scene"><img src="${baseSalles}rencontre.webp" alt="" decoding="async"></span>`
      + `<div><span class="ex-sur">Rencontre</span><h2>${echap(r.titre)}</h2></div></div>`
      + `<p class="ex-recit">${echap(r.texte)}</p><div class="ex-choix">`
      + r.options.map((o, k) => `<button type="button" class="ex-choix-btn" data-action="repondre" data-id="${k}"><span>${echap(o)}</span>${CHEVRON}</button>`).join('') + `</div>`;
  } else {
    if (x.recit) h += `<p class="ex-recit">${echap(x.recit)}</p>`;
    if (libre) {
      const routes = accessibles(x);
      h += `<div class="ex-routes"><h2 class="ex-titre">${routes.length > 1 ? `Où aller ? <small>${routes.length} chemins</small>` : 'La suite'}</h2>`;
      for (const s of routes) {
        const a = annonce(s, x);
        const cond = s.condition && CONDITIONS[s.condition] ? CONDITIONS[s.condition]! : null;
        h += `<button type="button" class="ex-route t-${s.type}" data-action="salle" data-id="${s.id}">`
          + visuel(s)
          + `<span class="ex-route-txt"><span class="ex-sur">${echap(a.sur)}</span><strong>${echap(a.titre)}</strong>`
          + (a.texte ? `<em>${echap(a.texte)}</em>` : '')
          + (a.faits.length ? `<span class="ex-faits">${a.faits.map((f) => `<span>${f}</span>`).join('')}</span>` : '')
          + (cond ? `<span class="ex-condition">${ICO.cristal}<span><b>${echap(cond.nom)}</b> : ${echap(cond.texte)}</span></span>` : '')
          + `</span>${CHEVRON}</button>`;
      }
      h += `</div>`;
    }
  }
  if (x.terminee) h += `<button type="button" class="btn prim large ex-sortie" data-action="remonter">${ICO.cristal}Remonter avec le filon</button>`;
  else if (peutRemonter(x)) {
    h += `<div class="ex-remonter"><p>${ici.type === 'camp' ? 'Le campement est une sortie' : 'L’entrée est une sortie'} : tu peux rentrer maintenant avec tout ce que tu as trouvé.</p>`
      + `<button type="button" class="btn sec ex-retraite" data-action="retraite">${ICO.retour}${x.butin ? `Remonter avec ${x.butin} composant${x.butin > 1 ? 's' : ''}` : 'Remonter au district'}</button></div>`;
  } else if (libre) h += `<p class="ex-note">Les PV remontent surtout aux campements (et parfois lors d’une rencontre). On ne peut remonter que depuis l’entrée ou un campement.</p>`;
  h += `</section>`;

  return h + `</div>`;
}
