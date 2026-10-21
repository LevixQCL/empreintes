// La carte d'une Strate : l'escouade descend salle par salle jusqu'au gardien.
// Vue d'en haut : l'entrée en haut, le gardien tout en bas ; on touche une salle voisine pour y aller.
// Le fond est une illustration par zone quand elle existe (art.ts), sinon un dégradé à la couleur de la zone.

import { accessibles, peutRemonter, salleCourante, type Expedition, type Salle, type TypeSalle } from '../core/expedition';
import { ZONES, porteurDef } from '../core/donnees';
import { RENCONTRES, type Jeu } from '../core/jeu';
import { decorStrate, portrait } from './art';
import { COULEUR, echap } from './vue';
import { ICO } from './icones';

const NOMS: Record<TypeSalle, string> = {
  entree: 'Entrée', combat: 'Combat', elite: 'Salle scellée', cache: 'Cache', rencontre: 'Rencontre', camp: 'Campement', archive: 'Archives', gardien: 'Gardien',
};
const ICONES: Record<TypeSalle, string> = {
  entree: ICO.descendre, combat: ICO.atk, elite: ICO.verrou, cache: ICO.coffre, rencontre: ICO.compte, camp: ICO.soin, archive: ICO.codex, gardien: ICO.porte,
};
const TEINTES = ['#3B3122', '#2B2638', '#33222C', '#1C1A2A'];

const RANGS = 7;
const posX = (s: Salle) => ((s.col + 1) / (s.nCol + 1)) * 100;
const posY = (s: Salle) => 7 + (s.rang * 86) / (RANGS - 1);

export function htmlExploration(j: Jeu): string {
  const x = j.expedition as Expedition;
  const c = x.carte!;
  const ici = salleCourante(x);
  const voisines = new Set(accessibles(x).map((s) => s.id));
  const bloque = !!x.rencontre;
  const zone = ZONES[c.zone]!;
  const fond = decorStrate(c.zone);

  let h = `<div class="ecran ecran-exploration" style="--teinte:${TEINTES[c.zone] ?? TEINTES[0]}">`;
  h += `<header class="combat-barre"><div class="puces"><span class="puce">${ICO.strate}Strate −${x.strate}</span><span class="puce">${echap(zone.nom)}</span></div>`
    + `<span class="puce">${ICO.composants}${x.butin}</span></header>`;

  // l'escouade et ses PV : ils ne remontent qu'aux campements
  h += '<section class="escouade-combat" aria-label="Escouade">';
  for (const p of x.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    const img = portrait(d.id);
    h += `<div class="combattant${ko ? ' ko' : ''}${!ko && p.pv / p.pvMax <= 0.3 ? ' bas' : ''}" style="--c:${COULEUR[d.lignee]}">`
      + `<span class="avatar${img ? '' : ' sans-portrait'}" style="--t:34px" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
      + `<div class="cb-infos"><span class="n">${echap(d.nom)}</span><div class="jauge-pv"><i class="pv" style="width:${Math.max(0, Math.round((100 * p.pv) / p.pvMax))}%"></i></div><span class="chiffre">${ko ? 'À TERRE' : `${p.pv}/${p.pvMax}`}</span></div></div>`;
  }
  h += '</section>';

  // la carte
  h += `<section class="carte-strate${fond ? ' illustree' : ''}" aria-label="Carte de la Strate"${fond ? ` style="--decor:url(${fond})"` : ''}>`;
  h += `<svg class="couloirs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">`;
  for (const s of c.salles) {
    for (const v of s.voisins) {
      const t = c.salles[v]!;
      const etat = s.id === ici.id && voisines.has(v) ? 'ouvert' : s.faite && t.faite ? 'parcouru' : '';
      h += `<line class="${etat}" x1="${posX(s)}" y1="${posY(s)}" x2="${posX(t)}" y2="${posY(t)}"/>`;
    }
  }
  h += `</svg>`;
  for (const s of c.salles) {
    const acces = voisines.has(s.id) && !bloque && x.phase === 'carte';
    const classes = ['salle', `s-${s.type}`, s.faite ? 'faite' : '', s.id === ici.id ? 'ici' : '', acces ? 'accessible' : ''].filter(Boolean).join(' ');
    const label = `${NOMS[s.type]}${s.id === ici.id ? ' (tu es ici)' : s.faite ? ' (visitée)' : ''}`;
    h += acces
      ? `<button type="button" class="${classes}" style="left:${posX(s)}%;top:${posY(s)}%" data-action="salle" data-id="${s.id}" aria-label="Aller : ${label}">${ICONES[s.type]}</button>`
      : `<span class="${classes}" style="left:${posX(s)}%;top:${posY(s)}%" role="img" aria-label="${label}">${ICONES[s.type]}</span>`;
  }
  h += `</section>`;

  // le panneau du bas : la rencontre en cours, ou le récit et les actions
  h += `<section class="panneau-exploration" aria-live="polite">`;
  if (x.rencontre) {
    const r = RENCONTRES[x.rencontre]!(j);
    h += `<span class="surtitre">${ICO.compte}RENCONTRE</span><h2>${echap(r.titre)}</h2><p>${echap(r.texte)}</p><div class="choix-rencontre">`
      + r.options.map((o, k) => `<button type="button" class="btn sec" data-action="repondre" data-id="${k}">${echap(o)}</button>`).join('') + `</div>`;
  } else {
    h += `<span class="surtitre">${ICONES[ici.type]}${echap(NOMS[ici.type].toUpperCase())}</span>`;
    if (x.recit) h += `<p>${echap(x.recit)}</p>`;
    h += `<p class="aide">Touche une salle éclairée pour avancer. Les PV ne remontent qu’aux campements.</p>`;
  }
  const g = x.gains;
  const cartes = (g?.elites ?? 0) + (g?.cartes ?? 0);
  h += `<div class="butin-exploration"><span>${ICO.composants}${x.butin} composants</span>`
    + (cartes ? `<span>${ICO.cartes}${cartes} carte${cartes > 1 ? 's' : ''}</span>` : '')
    + (g?.eclats ? `<span>${ICO.eclats}${g.eclats} Éclat${g.eclats > 1 ? 's' : ''}</span>` : '')
    + (g?.fragment ? `<span>${ICO.codex}archives</span>` : '') + `</div>`;
  if (peutRemonter(x)) h += `<button type="button" class="btn sec large" data-action="retraite">${ICO.retour}Remonter au district avec le butin</button>`;
  h += `</section>`;

  h += `<ul class="legende-salles" aria-label="Légende">${(['combat', 'elite', 'cache', 'rencontre', 'camp', 'archive', 'gardien'] as TypeSalle[])
    .map((t) => `<li class="s-${t}">${ICONES[t]}${NOMS[t]}</li>`).join('')}</ul>`;
  return h + `</div>`;
}
