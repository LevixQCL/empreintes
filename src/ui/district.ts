// Écrans du district : l'archipel (accueil), la coupe de la Tour du Noyau, le choix de l'escouade.
// Les bâtiments sont des illustrations Midjourney (public/art/batiments, 4 apparences selon le niveau) ; le fond est la mer peinte (jour ou nuit), le Chantier une esquisse en attendant son illustration.

import { libelleEffet } from '../core/effets';
import { MODULES, PORTEURS, batimentDef, carteId, gestesRemplaces, moduleDef, porteurDef } from '../core/donnees';
import {
  ARCHIVE, DISTRICT, POSTES, QUOTIDIENS, chantierDe, chantiersMax, coutAmelioration, coutRefabrication, disponibles,
  dureeChantier, dureeFabrication, energieParHeure, enExpedition, gestesDe, greffesDe, lundiSuivant, objectifCourant,
  porteursPresents, posteDe, pvMaxCombat, quotidienActif, quotidienFait, soinParHeure, stockage, usureMax, type Jeu, type Poste,
} from '../core/jeu';
import { COLLECTION, NOMS_RARETE, RARETES, composantsNiveau, doublonsRequis, multNiveau } from '../core/collection';
import type { Rarete } from '../core/types';
import { FRAGMENTS } from '../core/fragments';
import type { BatimentId } from '../core/types';
import { COULEUR, FONDS, echap, panneauCompte, type Compte } from './vue';
import { decor, fondCarte, illustrationBatiment, prochainVisuel, stylePastille, visuel } from './art';
import { faceCarte } from './carte';

export type Vue = 'archipel' | 'coupe' | 'escouade' | 'rencontre' | 'codex' | 'cartes';

export interface EcranDistrict {
  j: Jeu;
  vue: Vue;
  selection: BatimentId | null;
  escouade: string[];
  strateChoisie: number;
  message: string;
  compte: Compte;
  now: number;
  /** lignes du résumé « Pendant ton absence » (vide = rien à montrer) */
  retour: string[];
}

const ent = (n: number) => Math.floor(n).toLocaleString('fr-BE');
const duree = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 86_400) return `${Math.floor(s / 86_400)} j ${Math.floor((s % 86_400) / 3600)} h`;
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
  return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
};

export const COULEUR_RARETE: Record<Rarete, string> = { fer: '#8E949C', cuivre: '#C47A48', argent: '#B8C4CE', or: '#E2B44A', nacre: '#E6D3EE' };

// ---------- Archipel (SVG provisoire) ----------

const PILIERS: { id: BatimentId | 'chantier'; x: number; y: number; r: number }[] = [
  { id: 'generateur', x: 92, y: 188, r: 62 },
  { id: 'forge', x: 308, y: 196, r: 62 },
  { id: 'noyau', x: 200, y: 300, r: 82 },
  { id: 'clinique', x: 96, y: 432, r: 64 },
  { id: 'chantier', x: 306, y: 440, r: 60 },
];

/** Anneau d'écume au pied d'un îlot : seulement l'arc avant, l'arrière passe derrière la roche */
function ecume(x: number, y: number, rx: number, ry: number) {
  return `<path class="ecume" d="M${x - rx} ${y} A${rx} ${ry} 0 0 0 ${x + rx} ${y}"/>`;
}

/** Emplacement du Chantier en attendant son illustration : une nappe de brume et un échafaudage esquissé */
function emplacementChantier(x: number, y: number, r: number) {
  return ecume(x, y + 4, r * 0.75, r * 0.2)
    + `<g class="esquisse" transform="translate(${x} ${y})" stroke="#F2E6CC" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".75"><path d="M-22 0 V-46 M22 0 V-46 M-22 -23 H22 M-22 -46 H22 M-22 0 L22 -46"/><path d="M-34 2 H34" stroke-dasharray="3 5"/></g>`;
}

/** Illustration du bâtiment, posée sur son pilier : le haut de l'îlot tombe sur (x, y), le bas s'efface dans la brume. */
function spriteBatiment(id: BatimentId, x: number, y: number, r: number, niv: number) {
  const w = r * 2.4;
  const h = w * 1.25;
  const eau = y + h * 0.18;
  return `<ellipse class="ombre-eau" cx="${x + w * 0.04}" cy="${eau + 4}" rx="${w * 0.36}" ry="${h * 0.06}"/>`
    + `<image class="sprite v${visuel(niv)}" href="${illustrationBatiment(id, niv)}" x="${x - w / 2}" y="${y - h * 0.56}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" mask="url(#brume)"/>`
    + ecume(x, eau, w * 0.25, h * 0.035);
}

function archipelSvg(j: Jeu): string {
  const pont = (a: (typeof PILIERS)[number], b: (typeof PILIERS)[number]) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + 26;
    return `<path d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" stroke="#7A5A3A" stroke-width="4" fill="none" stroke-dasharray="2 4"/>`;
  };
  const [gen, forge, noyau, clin, chant] = PILIERS as [typeof PILIERS[number], typeof PILIERS[number], typeof PILIERS[number], typeof PILIERS[number], typeof PILIERS[number]];
  const niv = (id: BatimentId | 'chantier') => (id === 'chantier' ? 1 : j.batiments[id]);
  const fond = fondCarte();
  return `<svg class="archipel-svg${fond.nuit ? ' nuit' : ''}" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="fondu" x1="0" y1="0" x2="0" y2="1"><stop offset=".7" stop-color="#fff"/><stop offset=".8" stop-color="#000"/></linearGradient>
    <mask id="brume" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#fondu)"/></mask>
  </defs>
  <image class="fond-carte" href="${fond.url}" width="400" height="600" preserveAspectRatio="xMidYMid slice"/>
  <rect class="voile" width="400" height="600"/>
  ${pont(gen, noyau)}${pont(forge, noyau)}${pont(clin, noyau)}${pont(chant, noyau)}${pont(gen, clin)}
  ${PILIERS.map((p) => (p.id === 'chantier' ? emplacementChantier(p.x, p.y, p.r) : spriteBatiment(p.id, p.x, p.y, p.r, niv(p.id)))).join('')}
</svg>`;
}

function etiquettes(e: EcranDistrict): string {
  const j = e.j;
  return PILIERS.map((p) => {
    const left = (p.x / 400) * 100, top = ((p.y + p.r * 0.62) / 600) * 100;
    if (p.id === 'chantier') {
      return `<button type="button" class="etiquette verrou" style="left:${left}%;top:${top}%" data-action="chantier"><span>Chantier</span><small>Labo génétique · bientôt</small></button>`;
    }
    const d = batimentDef(p.id);
    const prete = p.id === 'forge' && j.forge && e.now >= j.forge.fin;
    const ch = chantierDe(j, p.id);
    const vise = objectifCourant(j)?.pilier === p.id && !objectifCourant(j)!.fait(j);
    const occupe = p.id !== 'noyau' && posteDe(j, p.id as Poste);
    return `<button type="button" class="etiquette${e.selection === p.id ? ' choisie' : ''}${vise ? ' visee' : ''}" style="left:${left}%;top:${top}%" data-action="batiment" data-id="${p.id}">`
      + `<span>${echap(d.nom)}</span><small>${ch ? `Chantier · ${duree(ch.fin - e.now)}` : `Niv. ${j.batiments[p.id]}${occupe ? ' · ' + echap(porteurDef(occupe).nom) : ''}`}</small>${prete ? '<i class="point" aria-label="prêt"></i>' : ''}</button>`;
  }).join('');
}

function barreRessources(e: EcranDistrict): string {
  const j = e.j;
  return `<div class="ressources">`
    + `<span class="res"><b class="pastille-res en"></b>${ent(j.energie)}<small>/${ent(stockage(j))} · +${energieParHeure(j)}/h</small></span>`
    + `<span class="res"><b class="pastille-res co"></b>${ent(j.composants)}<small> composants</small></span>`
    + (j.eclats > 0 || j.strate >= 2 ? `<span class="res"><b class="pastille-res ec"></b>${ent(j.eclats)}<small> Éclats</small></span>` : '')
    + `<span class="res"><small>Strate</small> −${j.strate}</span></div>`;
}

function chipPorteur(j: Jeu, id: string, action: string, extra = '', actif = false, off = false): string {
  const d = porteurDef(id);
  const u = j.porteurs[id]!.usure;
  return `<button type="button" class="chip${actif ? ' actif' : ''}" style="--c:${COULEUR[d.lignee]};${stylePastille(id, FONDS[id])}" data-action="${action}" data-id="${id}"${extra}${off ? ' disabled' : ''}>`
    + `<span class="pastille" aria-hidden="true"></span><span>${echap(d.nom)}</span>${u >= 1 ? `<small>Usure ${Math.floor(u)}</small>` : ''}</button>`;
}

function panneauBatiment(e: EcranDistrict): string {
  const j = e.j;
  const b = e.selection;
  if (!b) return '';
  const d = batimentDef(b);
  const cout = coutAmelioration(j, b);
  const bloque = b !== 'noyau' && j.batiments[b] >= j.batiments.noyau;
  let h = `<section class="feuille" aria-label="${echap(d.nom)}"><div class="feuille-tete"><div><h2>${echap(d.nom)}</h2><span class="sous">NIVEAU ${j.batiments[b]} / ${d.niveauMax}${d.affinite ? ' · IDÉAL : ' + (d.affinite === 'tech' ? 'AUGMENTÉ' : d.affinite === 'bio' ? 'GÉNÉ' : 'RÉSONANT') : ''}</span></div>`
    + `<button type="button" class="btn-sec" data-action="fermer">Fermer</button></div>`;
  const pv = prochainVisuel(j.batiments[b]);
  h += `<div class="apercu"><img src="${illustrationBatiment(b, j.batiments[b])}" alt="" decoding="async"><div><p class="role">${echap(d.role)}</p>`
    + (pv !== null && pv <= d.niveauMax ? `<small class="aide">Nouvelle apparence au niveau ${pv}.</small>` : '') + `</div></div>`;

  if (b === 'generateur') h += `<p class="stat"><b>+${energieParHeure(j)}</b> énergie par heure · stockage ${ent(stockage(j))}</p>`;
  if (b === 'clinique') h += `<p class="stat"><b>−${Math.round(soinParHeure(j) * 10) / 10}</b> Usure par heure pour chaque Porteur au repos</p>`;
  if (b === 'noyau') {
    h += `<p class="stat">Stockage <b>${ent(stockage(j))}</b> · les autres bâtiments ne dépassent pas son niveau.</p>`
      + `<button type="button" class="prim large" data-action="entrer">Entrer dans la tour</button>`;
  }

  if (b !== 'noyau') {
    const poste = b as Poste;
    const occupant = posteDe(j, poste);
    h += `<div class="bloc"><span class="label">AU TRAVAIL</span><div class="chips">`;
    if (occupant) h += chipPorteur(j, occupant, 'liberer', '', true) + `<small class="aide">Touche pour le libérer</small>`;
    else h += `<small class="aide">Personne. Un Porteur de la bonne lignée travaille deux fois mieux.</small>`;
    h += `</div><div class="chips">`;
    for (const p of PORTEURS) {
      if (p.id === occupant || enExpedition(j, p.id) || !porteursPresents(j).includes(p.id)) continue;
      const ailleurs = j.porteurs[p.id]!.poste;
      h += chipPorteur(j, p.id, 'poster', ` data-poste="${poste}"`, false) .replace('</button>', ailleurs ? `<small>${echap(batimentDef(ailleurs).nom)}</small></button>` : '</button>');
    }
    h += `</div></div>`;
  }

  if (b === 'forge') {
    h += `<div class="bloc"><span class="label">REFABRIQUER UNE CARTE DÉJÀ TROUVÉE</span>`;
    if (j.forge) {
      const m = moduleDef(j.forge.moduleId);
      const total = j.forge.fin - j.forge.debut;
      const fait = Math.min(1, (e.now - j.forge.debut) / total);
      h += `<p class="stat">${echap(m.nom)} · reste ${duree(j.forge.fin - e.now)}</p><div class="piste" style="--c:var(--gold)"><i style="width:${fait * 100}%"></i></div>`;
    } else {
      h += `<small class="aide">Un exemplaire de plus devient un doublon, pour faire monter la carte. Le recyclage se fait depuis tes Cartes.</small>`;
      const possedees = Object.keys(j.collection).map(moduleDef).sort((x, y) => RARETES.indexOf(y.rarete) - RARETES.indexOf(x.rarete) || x.nom.localeCompare(y.nom));
      for (const m of possedees) {
        const c = coutRefabrication(m.id);
        const assez = j.composants >= c.composants && j.eclats >= c.eclats;
        h += `<div class="module" style="--c:${COULEUR_RARETE[m.rarete]}"><div><strong>${echap(m.nom)}</strong><small>${NOMS_RARETE[m.rarete]} · ${c.composants} composants${c.eclats ? ` · ${c.eclats} Éclats` : ''} · ${duree(dureeFabrication(j, m.id))}</small></div>`
          + `<button type="button" class="chip petit" data-action="fabriquer" data-module="${m.id}"${assez && posteDe(j, 'forge') ? '' : ' disabled'}>Refabriquer</button></div>`;
      }
      if (!posteDe(j, 'forge')) h += `<small class="aide">Poste d’abord un Porteur à la Forge.</small>`;
    }
    h += `</div>`;
  }

  const ch = chantierDe(j, b);
  if (ch) {
    const fait = Math.min(1, (e.now - ch.debut) / (ch.fin - ch.debut));
    h += `<div class="bloc"><span class="label">CHANTIER VERS LE NIVEAU ${j.batiments[b] + 1}</span><p class="stat">Reste ${duree(ch.fin - e.now)}. Le chantier avance même jeu fermé.</p><div class="piste" style="--c:var(--gold)"><i style="width:${fait * 100}%"></i></div></div>`;
  } else   if (cout) {
    const assez = j.energie >= cout.energie && j.composants >= cout.composants && j.eclats >= (cout.eclats ?? 0);
    const plein = j.chantiers.length >= chantiersMax(j) || (b === 'noyau' && j.chantiers.length > 0);
    const d = dureeChantier(j, b);
    h += `<button type="button" class="sec large" data-action="ameliorer" data-id="${b}"${assez && !bloque && !plein ? '' : ' disabled'}>Améliorer au niveau ${j.batiments[b] + 1} · ${cout.energie} énergie · ${cout.composants} composants${cout.eclats ? ` · ${cout.eclats} Éclats` : ''} · ${d ? duree(d) : 'immédiat'}</button>`;
    if (bloque) h += `<small class="aide">Améliore d’abord la Tour du Noyau.</small>`;
    else if (plein) h += `<small class="aide">${b === 'noyau' && j.chantiers.length ? 'Attends la fin des chantiers en cours.' : `${chantiersMax(j) === 1 ? 'Un seul chantier à la fois (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.'}`}</small>`;
  } else h += `<small class="aide">Niveau maximum pour cette version.</small>`;
  return h + `</section>`;
}

export function htmlArchipel(e: EcranDistrict): string {
  const j = e.j;
  let h = `<header class="top"><div><h1>EMPREINTES</h1><span class="sous">TON DISTRICT</span></div><div class="droite">`
    + (e.compte.actif ? `<button type="button" class="btn-sec" data-action="compte" aria-expanded="${e.compte.ouvert}">${e.compte.utilisateur ? 'Compte ✓' : 'Compte'}</button>` : '')
    + `<button type="button" class="btn-sec${objectifCourant(j)?.titre === 'Greffer une carte' && !objectifCourant(j)!.fait(j) ? ' visee' : ''}" data-action="cartes"${j.chambre ? '' : ' disabled'}>Cartes</button>`
    + `<button type="button" class="btn-sec" data-action="intro">Intro</button></div></header>`;
  h += panneauCompte(e.compte);
  h += barreRessources(e);
  if (!j.chambre && !j.expedition) {
    h += `<button type="button" class="bandeau porte" data-action="rencontre"><strong>La porte scellée</strong><span>Sous la Tour du Noyau, trois personnes t’attendent.</span></button>`;
  }
  if (j.expedition) h += `<button type="button" class="bandeau" data-action="reprendre">${j.expedition.tutoriel ? 'La chambre scellée · Reprendre' : `Expédition en cours dans la Strate −${j.expedition.strate} · Reprendre`}</button>`;
  const o = objectifCourant(j);
  if (o) {
    const fait = o.fait(j);
    const gain = [o.recompense.energie ? `+${o.recompense.energie} énergie` : '', o.recompense.composants ? `+${o.recompense.composants} composants` : ''].filter(Boolean).join(' · ');
    h += `<section class="objectif${fait ? ' fait' : ''}" aria-label="Objectif"><span class="label">OBJECTIF ${j.objectif + 1} / 3</span><strong>${echap(o.titre)}</strong><p>${echap(o.consigne)}</p>`
      + (fait ? `<button type="button" class="prim" data-action="reclamer">Récupérer · ${gain}</button>` : `<small class="aide">Récompense : ${gain}</small>`) + `</section>`;
  }
  h += blocQuotidien(e);
  h += `<section class="archipel" aria-label="Archipel">${archipelSvg(j)}${etiquettes(e)}</section>`;
  if (e.message) h += `<p class="message">${echap(e.message)}</p>`;
  h += panneauBatiment(e);
  h += `<div class="journal" aria-label="Journal">${j.journal.slice(0, 3).map((t) => `<p>${echap(t)}</p>`).join('')}</div>`;
  if (j.choix.length) h += fenetreChoix(j);
  else if (e.retour.length) {
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="retour-titre"><div class="fenetre retour"><h2 id="retour-titre">Pendant ton absence</h2><ul>`
      + e.retour.map((l) => `<li>${echap(l)}</li>`).join('') + `</ul><button type="button" data-action="retour-ok">Au travail</button></div></div>`;
  }
  return h;
}

// ---------- Objectif du jour et Archive de la semaine ----------

function blocQuotidien(e: EcranDistrict): string {
  const j = e.j;
  if (!j.chambre || objectifCourant(j)) return '';
  let h = '';
  if (j.archive.aOuvrir) {
    h += `<button type="button" class="bandeau archive-prete" data-action="ouvrir-archive"><strong>L’Archive de la semaine est prête</strong><span>Palier ${j.archive.aOuvrir} sur 3 atteint : ouvre-la.</span></button>`;
  }
  const q = j.quotidien;
  const def = QUOTIDIENS[q.type];
  const max = ARCHIVE.paliers[2];
  const paliers = ARCHIVE.paliers.map((p) => `<i class="cran${j.archive.points >= p ? ' atteint' : ''}" style="left:${(p / max) * 100}%"></i>`).join('');
  h += `<section class="objectif jour${quotidienFait(j) ? ' fait' : ''}" aria-label="Objectif du jour">`;
  if (quotidienActif(j)) {
    h += `<span class="label">OBJECTIF DU JOUR${q.reserve > 1 ? ` · ${q.reserve} EN RÉSERVE` : ''}</span><strong>${echap(def.titre)}</strong>`
      + (quotidienFait(j)
        ? `<button type="button" class="prim" data-action="reclamer-jour">Récupérer · une carte au choix ou 2 Éclats</button>`
        : `<div class="ligne-prog"><div class="piste"><i style="width:${(100 * q.progres) / def.objectif}%;--c:var(--gold)"></i></div><small>${q.progres} / ${def.objectif}</small></div>`);
  } else h += `<span class="label">OBJECTIF DU JOUR</span><small class="aide">Tous faits : le prochain arrive demain.</small>`;
  h += `<div class="archive-sem"><span class="label">ARCHIVE DE LA SEMAINE · ${Math.min(j.archive.points, max)} / ${max}</span><div class="jauge"><div class="piste"><i style="width:${Math.min(100, (100 * j.archive.points) / max)}%;--c:var(--reso)"></i></div>${paliers}</div>`
    + `<small class="aide">S’ouvre lundi, dans ${duree(lundiSuivant(e.now) - e.now)}. Tout ce que tu joues la remplit.</small></div></section>`;
  return h;
}

// ---------- Les cartes ----------

function carteMini(id: string, j: Jeu, attrs = ''): string {
  const m = moduleDef(id);
  const c = j.collection[id];
  const neuve = !c;
  const niveau = c?.niveau ?? COLLECTION.niveauDepart[m.rarete];
  return `<button type="button" class="carte-mini avec-face" ${attrs}>${faceCarte(m, niveau, multNiveau(id, niveau))}`
    + `<em>${neuve ? 'Nouvelle carte' : `Doublon · niveau ${c.niveau}`}</em></button>`;
}

/** Le texte des effets spéciaux de la carte, sous sa face */
function effetsCarte(m: ReturnType<typeof moduleDef>): string {
  const avec = m.gestes.filter((g) => g.effet);
  return avec.length ? `<ul class="effets-carte">${avec.map((g) => `<li><b>${echap(g.nom)}</b> · ${echap(libelleEffet(g.effet!))}</li>`).join('')}</ul>` : '';
}

function fenetreChoix(j: Jeu): string {
  const c = j.choix[0]!;
  const titre = c.source === 'boss' ? 'Le boss laisse des empreintes' : c.source === 'quotidien' ? 'Objectif du jour' : 'Archive de la semaine';
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="choix-titre"><div class="fenetre choix"><h2 id="choix-titre">${titre}</h2><p>Choisis une carte. Si tu l’as déjà, elle devient un doublon pour la faire monter.</p><div class="cartes-choix">`
    + c.options.map((id, k) => carteMini(id, j, `data-action="prendre" data-index="${k}"`)).join('')
    + `</div>${c.eclats ? `<button type="button" class="btn-sec" data-action="prendre" data-index="-1">Prendre ${c.eclats} Éclats à la place</button>` : ''}`
    + (j.choix.length > 1 ? `<small class="aide">Encore ${j.choix.length - 1} choix après celui-ci.</small>` : '') + `</div></div>`;
}

/** Les Gestes de base que la carte remplace (ou remplacerait) sur ce Porteur */
function remplace(j: Jeu, moduleId: string, porteurId: string | undefined): string {
  if (!porteurId) return '';
  const mods = j.porteurs[porteurId]?.modules ?? [];
  const k = mods.indexOf(moduleId);
  const avant = (k >= 0 ? mods.slice(0, k) : mods).reduce((n, id) => n + moduleDef(id).gestes.length, 0);
  const noms = gestesRemplaces(porteurId, avant, moduleDef(moduleId).gestes.length).map((g) => g.nom);
  if (!noms.length) return '';
  const qui = porteurDef(porteurId).nom;
  return `<small class="aide">${k >= 0 ? `Remplace sur ${echap(qui)}` : `Sur ${echap(qui)}, remplacerait`} : ${noms.map(echap).join(', ')}</small>`;
}

export function htmlCartes(e: EcranDistrict): string {
  const j = e.j;
  const exemplaires = (moduleId: string) => [...RARETES].reverse().map((r) => carteId(moduleId, r)).filter((k) => j.collection[k]);
  const trouvees = MODULES.filter((m) => exemplaires(m.id).length).length;
  let h = `<header class="top"><div><h1>Cartes</h1><span class="sous">${trouvees} / ${MODULES.length} TROUVÉES · ${DISTRICT.modulesMax} PAR PORTEUR</span></div><button type="button" class="btn-sec" data-action="archipel">Archipel</button></header>`;
  h += barreRessources(e);
  if (e.message) h += `<p class="message">${echap(e.message)}</p>`;
  h += `<p class="discret">Greffe une carte sur un Porteur de sa lignée : ses Gestes remplacent certains des siens, le deck garde sa taille. Les doublons la font monter (+${Math.round(COLLECTION.bonusNiveau * 100)} % de force par niveau).</p>`;
  for (const lignee of ['tech', 'bio', 'reso'] as const) {
    const porteurs = PORTEURS.filter((p) => p.lignee === lignee && porteursPresents(j).includes(p.id));
    h += `<h2 class="titre-lignee" style="--c:${COULEUR[lignee]}">${lignee === 'tech' ? 'Augmentés' : lignee === 'bio' ? 'Génés' : 'Résonants'}</h2><div class="grille-cartes">`;
    for (const base of MODULES.filter((x) => x.lignee === lignee)) {
      const cles = exemplaires(base.id);
      if (!cles.length) {
        h += `<div class="carte inconnue" style="--r:var(--line)"><strong>?</strong><small>Pas encore trouvée</small></div>`;
        continue;
      }
      // une carte par métal possédé, du plus rare au plus commun
      for (const cle of cles) {
        const m = moduleDef(cle);
        const c = j.collection[cle]!;
        const requis = doublonsRequis(m.id, c.niveau);
        const porte = greffesDe(j, m.id)[0];
        const mult = multNiveau(m.id, c.niveau);
        const cout = composantsNiveau(c.niveau + 1);
        h += `<article class="carte avec-face" style="--r:${COULEUR_RARETE[m.rarete]};--c:${COULEUR[lignee]}">${faceCarte(m, c.niveau, mult)}`
          + `${effetsCarte(m)}${remplace(j, m.id, porte ?? porteurs[0]?.id)}`
          + (requis === null ? `<small>Niveau maximum</small>` : `<div class="ligne-prog"><div class="piste"><i style="width:${Math.min(100, (100 * c.doublons) / requis)}%;--c:var(--r)"></i></div><small>${c.doublons} / ${requis}</small></div>`)
          + `<div class="chips">`
          + (requis !== null ? `<button type="button" class="chip petit" data-action="monter" data-module="${m.id}"${c.doublons >= requis && j.composants >= cout ? '' : ' disabled'}>Monter · ${cout} comp.</button>` : '')
          + (c.doublons > 0 ? `<button type="button" class="chip petit" data-action="recycler" data-module="${m.id}">Recycler 1 · +${COLLECTION.recyclage[m.rarete]}</button>` : '')
          + `</div><div class="chips">`
          + porteurs.map((p) => `<button type="button" class="chip petit${porte === p.id ? ' actif' : ''}" style="--c:${COULEUR[lignee]};${stylePastille(p.id, FONDS[p.id])}" data-action="${porte === p.id ? 'degreffer' : 'greffer'}" data-module="${m.id}" data-id="${p.id}"${enExpedition(j, p.id) ? ' disabled' : ''}><span class="pastille" aria-hidden="true"></span>${echap(p.nom)}${porte === p.id ? ' ✓' : ''}</button>`).join('')
          + `</div></article>`;
      }
    }
    h += `</div>`;
  }
  if (j.choix.length) h += fenetreChoix(j);
  return h;
}

// ---------- La rencontre, avant la chambre scellée ----------

const REPLIQUES: { id: string; texte: string }[] = [
  { id: 'ilka', texte: '« On attend quoi, l’Élu ? Qu’elle s’ouvre toute seule ? »' },
  { id: 'doran', texte: '« J’ai connu ce puits avant qu’on le mure. Je n’aimais pas son silence. »' },
  { id: 'vela', texte: '« Quelque chose a peur, derrière cette porte. Et ce n’est pas moi. »' },
];

export function htmlRencontre(): string {
  let h = `<header class="top"><div><h1>La porte scellée</h1><span class="sous">SOUS LA TOUR DU NOYAU</span></div><button type="button" class="btn-sec" data-action="archipel">Plus tard</button></header>`;
  h += `<section class="rencontre"><p class="intro-porte">Une porte ronde, scellée depuis les années 2060, luit faiblement. Trois personnes t’attendent devant.</p>`;
  REPLIQUES.forEach((r, i) => {
    const d = porteurDef(r.id);
    h += `<div class="replique" style="--c:${COULEUR[d.lignee]};${stylePastille(r.id, FONDS[r.id])};--i:${i}"><span class="pastille" aria-hidden="true"></span><div><strong>${echap(d.nom)}</strong><small>${d.lignee === 'tech' ? 'Augmentée · coursière' : d.lignee === 'bio' ? 'Géné · ancien des Fondations' : 'Résonante · lectrice d’empreintes'}</small><p>${echap(r.texte)}</p></div></div>`;
  });
  h += `<button type="button" class="prim large" data-action="ouvrir-chambre">Ouvrir la porte</button></section>`;
  return h;
}

// ---------- Le Codex ----------

export function htmlCodex(e: EcranDistrict): string {
  const j = e.j;
  let h = `<header class="top"><div><h1>Codex</h1><span class="sous">${j.fragments.length} / ${FRAGMENTS.length} FRAGMENTS D’ARCHIVES</span></div><button type="button" class="btn-sec" data-action="coupe">Retour</button></header>`;
  if (!j.fragments.length) h += `<p class="discret">Aucun fragment pour l’instant. On les trouve en ouvrant de nouvelles Strates.</p>`;
  for (const id of j.fragments) {
    const f = FRAGMENTS.find((x) => x.id === id);
    if (!f) continue;
    h += `<article class="fragment"><span class="label">${echap(f.support.toUpperCase())}</span><h2>${echap(f.titre)}</h2>${f.lignes.map((l) => `<p>${echap(l)}</p>`).join('')}</article>`;
  }
  const reste = FRAGMENTS.length - j.fragments.length;
  if (reste > 0) h += `<p class="discret">${reste} fragment${reste > 1 ? 's' : ''} encore enfoui${reste > 1 ? 's' : ''} dans les Strates.</p>`;
  return h;
}

// ---------- La coupe de la Tour du Noyau ----------

const NOMS_ETAGES = ['Salle de fouilles', 'Bunker des années 2060', 'Galerie aux formes courbes', 'Ruines lumineuses'];

export function htmlCoupe(e: EcranDistrict): string {
  const j = e.j;
  let h = `<header class="top"><div><h1>Tour du Noyau</h1><span class="sous">EN COUPE · ${j.strate} ÉTAGE${j.strate > 1 ? 'S' : ''} CREUSÉ${j.strate > 1 ? 'S' : ''}</span></div>`
    + `<button type="button" class="btn-sec" data-action="archipel">Archipel</button></header>`;
  h += barreRessources(e);
  h += `<section class="coupe illustree" aria-label="Coupe" style="--decor:url(${decor('coupe')})"><div class="etage tour"><div class="tete-tour"><span class="label">HABITATS</span><button type="button" class="btn-sec petit" data-action="codex">Codex · ${j.fragments.length}</button></div><div class="habitants">`;
  for (const p of PORTEURS) {
    if (!porteursPresents(j).includes(p.id)) continue;
    const d = j.porteurs[p.id]!;
    const etat = enExpedition(j, p.id) ? 'En expédition' : d.poste ? batimentDef(d.poste).nom : 'Au repos';
    const pv = pvMaxCombat(j, p.id);
    h += `<div class="habitant" style="--c:${COULEUR[p.lignee]};${stylePastille(p.id, FONDS[p.id])}"><span class="pastille" aria-hidden="true"></span><div><strong>${echap(p.nom)}</strong><small>${etat} · PV ${pv}/${p.pvMax}</small>`
      + (d.usure >= 1 ? `<div class="piste mini" style="--c:var(--danger)"><i style="width:${(100 * d.usure) / usureMax(p.id)}%"></i></div>` : '')
      + (d.modules.length ? `<small>${d.modules.map((m) => echap(moduleDef(m).nom)).join(', ')}</small>` : '') + `</div></div>`;
  }
  h += `</div></div><div class="puits" aria-hidden="true"></div>`;
  for (let n = 1; n <= j.strate; n++) {
    const front = n === j.strate;
    const nom = NOMS_ETAGES[Math.min(n - 1, NOMS_ETAGES.length - 1)];
    h += `<div class="etage strate${front ? ' front' : ''}" style="--p:${Math.min(1, (n - 1) / 4)}"><div><span class="label">STRATE −${n}</span><strong>${nom}</strong>`
      + `<small>${front ? 'Le front de fouille : la vaincre creuse un nouvel étage.' : 'Déjà explorée : on peut y retourner pour des composants.'}</small></div>`
      + `<button type="button" class="${front ? 'prim' : 'sec'}" data-action="descendre" data-strate="${n}"${j.expedition || !j.chambre ? ' disabled' : ''}>Descendre</button></div>`;
  }
  h += `<div class="etage roche"><small>Roche à creuser…</small></div></section>`;
  if (e.message) h += `<p class="message">${echap(e.message)}</p>`;
  return h;
}

// ---------- Choix de l'escouade ----------

export function htmlEscouade(e: EcranDistrict): string {
  const j = e.j;
  const dispo = disponibles(j);
  let h = `<header class="top"><div><h1>Escouade</h1><span class="sous">STRATE −${e.strateChoisie} · CHOISIS 3 PORTEURS</span></div>`
    + `<button type="button" class="btn-sec" data-action="coupe">Retour</button></header>`;
  h += `<section class="panneau"><div class="chips">`;
  for (const p of PORTEURS) {
    if (!porteursPresents(j).includes(p.id)) continue;
    const libre = dispo.includes(p.id);
    const choisi = e.escouade.includes(p.id);
    h += chipPorteur(j, p.id, 'choisir', '', choisi, !libre && !choisi).replace('</button>', `<small>PV ${pvMaxCombat(j, p.id)}${libre ? '' : ' · au travail'}</small></button>`);
  }
  const deck = e.escouade.reduce((n, id) => n + gestesDe(j, id).length, 0) + 2;
  h += `</div><p class="discret">Les Porteurs au travail restent au district. Chaque Porteur apporte ses Gestes, et ceux de ses Modules, au deck commun${e.escouade.length ? ` (${deck} Gestes)` : ''}.</p>`
    + `<p class="discret">Après l’expédition, chacun gagne de l’Usure : la Clinique la soigne pendant qu’il se repose.</p>`
    + `<button type="button" class="prim large" data-action="partir"${e.escouade.length === 3 ? '' : ' disabled'}>Partir</button></section>`;
  if (e.message) h += `<p class="message">${echap(e.message)}</p>`;
  return h;
}

export { POSTES };
