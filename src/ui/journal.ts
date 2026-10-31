// Le journal du combat (27 octobre 2026, Bryan) : revoir les cartes jouées, la défausse et la pioche, et comprendre
// chaque dégât subi ou infligé. Une feuille discrète, ouverte depuis les piles (sous l'escouade), la dernière ligne
// du journal (au-dessus de la main) ou la fenêtre de fin. Aucune règle ici : le moteur note tout (`historique`).
// Chaque terme du jeu et chaque bonus d'un calcul porte un « ? » qui l'explique, dans la ligne même (rien ne s'empile).

import { porteurDef } from '../core/donnees';
import { LEXIQUE, termeDe, termesDe, type Terme } from '../core/lexique';
import type { CalculHisto, CarteHisto, CombatEtat, Geste, LigneeGeste, LigneHisto, Rarete, TourHisto } from '../core/types';
import { portrait } from './art';
import { corpsFace, styleFace, type Face } from './carte';
import { ICO } from './icones';
import { echap } from './outils';

export type OngletJournal = 'tours' | 'cartes';

const TEINTE: Record<LigneeGeste, string> = { tech: 'var(--tech)', bio: 'var(--bio)', reso: 'var(--reso)', neutre: 'var(--ivory)' };
const lignee = (porteur: string | null): LigneeGeste => (porteur ? porteurDef(porteur).lignee : 'neutre');
const pc = (x: number) => `${Math.round(x * 100)} %`;

// ---------- Le lexique : les « ? » (les termes vivent dans core/lexique.ts, partagés avec le glossaire) ----------

/** Un « ? » qui se déplie dans la ligne même : le nom en titre, l'explication en dessous */
const puceTerme = (t: Terme) => `<details class="jq"><summary aria-label="${echap(`Qu’est-ce que : ${t.nom} ?`)}"><i aria-hidden="true">?</i>${echap(t.nom)}</summary><p>${echap(t.texte)}</p></details>`;

// ---------- Les cartes en petit ----------

/** Une carte du journal ou des piles, en petit (sans action) */
function carteMini(c: CarteHisto | Geste, rang?: number): string {
  const l = lignee(c.porteur);
  const metal = (c.carte?.split('@')[1] as Rarete | undefined) ?? 'fer';
  const d: Face = {
    carte: c.carte, repli: c.porteur ? portrait(c.porteur) : null, metal, type: c.type, v: c.v,
    fs: 'fs' in c && c.fs?.length ? [c.f, ...c.fs.filter((f) => f !== c.f)] : [c.f], nom: c.nom,
    effet: c.effet, ...(c.effet2 ? { effet2: c.effet2 } : {}), lourd: c.lourd, lignee: TEINTE[l],
  };
  const qui = c.porteur ? porteurDef(c.porteur).nom : 'District';
  const eteinte = 'eteinte' in c && c.eteinte;
  return `<span class="jm${eteinte ? ' eteinte' : ''}" style="--c:${TEINTE[l]}" role="img" aria-label="${echap(`${rang !== undefined ? `${rang + 1}. ` : ''}${c.nom} (${qui}), Fréquence ${c.f}, force ${c.v}${eteinte ? ', éteinte' : ''}`)}">`
    + (rang !== undefined ? `<b class="jm-rang" aria-hidden="true">${rang + 1}</b>` : '')
    + `<span class="nf nf-${metal}" style="${styleFace(d)}" aria-hidden="true">${corpsFace(d)}</span></span>`;
}

// ---------- Un calcul ----------

/** La valeur d'un bonus ou d'un malus : +30 %, −15 %, −4 ; la Riposte est une part du bouclier ; l'Ombre annule le coup */
function valeur(l: { nom: string; m?: number; v?: number }): { txt: string; plus: boolean } {
  if (l.m !== undefined) {
    if (l.m === 0) return { txt: 'annulé', plus: false };
    if (/^Riposte/.test(l.nom)) return { txt: `× ${pc(l.m)}`, plus: true };
    const p = Math.round((l.m - 1) * 100);
    return { txt: `${p > 0 ? '+' : '−'}${Math.abs(p)} %`, plus: p > 0 };
  }
  if (l.v === 0) return { txt: 'ignore', plus: true };
  return { txt: `${(l.v ?? 0) > 0 ? '+' : '−'}${Math.abs(l.v ?? 0)}`, plus: (l.v ?? 0) > 0 };
}

/** Une ligne de calcul : le nom, un « ? » quand le lexique l'explique, la valeur ; la toucher déplie l'explication */
function ligneCalcul(nom: string, val: string, classe: string): string {
  const t = termeDe(nom);
  const tete = `<span class="jc-nom">${echap(nom)}${t ? '<i class="jc-q" aria-hidden="true">?</i>' : ''}</span><b>${echap(val)}</b>`;
  return t
    ? `<li class="${classe}"><details><summary aria-label="${echap(`${nom} : ${val}. Toucher pour l’explication`)}">${tete}</summary><p>${echap(t.texte)}</p></details></li>`
    : `<li class="${classe}"><div class="jc-ligne">${tete}</div></li>`;
}

const QUOI: Record<LigneHisto['sorte'], string> = {
  coup: 'dégâts', blessure: 'dégâts', soin: 'PV soignés', protection: 'de bouclier', 'ennemi-soin': 'PV', 'ennemi-garde': 'de bouclier',
  flux: '', terre: '', effet: '', info: '',
};
const COMMENT = 'On part de la force, puis chaque bonus et malus s’applique l’un après l’autre (en pourcentage), on arrondit, on retire le blindage ; enfin, le bouclier de la cible absorbe ce qu’il peut. Le reste touche les PV.';

function blocCalcul(l: LigneHisto, c: CalculHisto, plusieurs: boolean): string {
  const riposte = /^Riposte/.test(c.lignes[0]?.nom ?? '');
  const base = l.camp === 'ennemi' ? 'Attaque de l’ennemi' : riposte ? 'Bouclier d’escouade' : 'Force de la carte';
  let h = `<ul class="jc">${plusieurs ? `<li class="jc-cible">Sur ${echap(c.cible)}</li>` : ''}<li class="base"><div class="jc-ligne"><span class="jc-nom">${base}</span><b>${c.base}</b></div></li>`;
  for (const x of c.lignes) { const v = valeur(x); h += ligneCalcul(x.nom, v.txt, v.plus ? 'plus' : 'moins'); }
  if (c.absorbe) {
    h += `<li class="sous"><div class="jc-ligne"><span class="jc-nom">Avant le bouclier</span><b>${c.brut}</b></div></li>`;
    h += ligneCalcul(l.camp === 'ennemi' ? 'Absorbé par le bouclier d’escouade' : 'Absorbé par son bouclier', `−${c.absorbe}`, 'moins');
  }
  const total = `${c.net} ${QUOI[l.sorte]}`.trim();
  h += `<li class="total"><details><summary aria-label="${echap(`Total : ${total}. Toucher pour savoir comment on calcule`)}"><span class="jc-nom">Total<i class="jc-q" aria-hidden="true">?</i></span><b>${echap(total)}</b></summary><p>${COMMENT}</p></details></li>`;
  return h + '</ul>';
}

// ---------- Une ligne, un tour ----------

/** Ce que la ligne change, en un chiffre coloré : rouge quand l'escouade perd, vert quand elle gagne */
function pastille(l: LigneHisto): string {
  if (!l.v) return '';
  const table: Partial<Record<LigneHisto['sorte'], [string, string]>> = {
    coup: [`${ICO.atk}${l.v}`, 'inflige'], blessure: [`−${l.v}`, 'subit'], soin: [`+${l.v}`, 'soigne'], protection: [`+${l.v}`, 'protege'],
    'ennemi-soin': [`+${l.v}`, 'subit'], 'ennemi-garde': [`+${l.v}`, 'subit'],
  };
  const x = table[l.sorte];
  return x ? `<b class="jl-v ${x[1]}">${x[0]}</b>` : '';
}

const ICONE: Record<LigneHisto['sorte'], string> = {
  coup: ICO.atk, blessure: ICO.atk, soin: ICO.soin, protection: ICO.bouclier, 'ennemi-soin': ICO.soin, 'ennemi-garde': ICO.bouclier,
  flux: ICO.flux, terre: ICO.fele, effet: ICO.cristal, info: ICO.journal,
};

function ligne(l: LigneHisto, t: TourHisto, id: string): string {
  const carte = l.rang !== undefined ? t.chaine[l.rang] : undefined;
  const marque = carte
    ? `<b class="jl-rang" style="--c:${TEINTE[lignee(carte.porteur)]}" aria-label="Carte ${l.rang! + 1}">${l.rang! + 1}</b>`
    : `<span class="jl-ico" aria-hidden="true">${ICONE[l.sorte]}</span>`;
  // un calcul sans bonus, sans malus et sans bouclier ne dit rien de plus que la ligne : on ne le propose pas
  const utiles = (l.calculs ?? []).filter((c) => c.lignes.length || c.absorbe);
  const calculs = utiles.length
    ? `<details class="jl-calc" id="${id}"><summary><i aria-hidden="true">?</i>${l.camp === 'ennemi' ? 'Pourquoi ce chiffre' : 'Détail du calcul'}</summary>${(l.calculs ?? []).map((c) => blocCalcul(l, c, l.calculs!.length > 1)).join('')}</details>` : '';
  // les termes déjà expliqués par le calcul ne reviennent pas en puces
  const dansCalcul = new Set(utiles.flatMap((c) => c.lignes.map((x) => termeDe(x.nom)?.nom)));
  const termes = termesDe(l.texte).filter((x) => !dansCalcul.has(x.nom));
  const outils = termes.map(puceTerme).join('') + calculs;
  return `<li class="jl ${l.camp} s-${l.sorte}">${marque}<div class="jl-corps"><p class="jl-txt">${echap(l.texte)}</p>`
    + (outils ? `<div class="jl-outils">${outils}</div>` : '') + `</div>${pastille(l)}</li>`;
}

interface Totaux { inflige: number; subit: number; soigne: number; protege: number }
function totaux(lignes: LigneHisto[]): Totaux {
  const t: Totaux = { inflige: 0, subit: 0, soigne: 0, protege: 0 };
  for (const l of lignes) {
    if (l.sorte === 'coup') t.inflige += l.v ?? 0;
    else if (l.sorte === 'blessure') t.subit += l.v ?? 0;
    else if (l.sorte === 'soin') t.soigne += l.v ?? 0;
    else if (l.sorte === 'protection') t.protege += l.v ?? 0;
  }
  return t;
}
/** Les totaux en puces (seulement ceux qui ne sont pas nuls) */
function puces(t: Totaux, grand = false): string {
  const p = [
    t.inflige ? `<span class="jt inflige" title="Dégâts infligés">${ICO.atk}${grand ? '<em>Infligés</em>' : ''}${t.inflige}</span>` : '',
    t.subit ? `<span class="jt subit" title="Dégâts reçus">${ICO.atk}${grand ? '<em>Reçus</em>' : ''}−${t.subit}</span>` : '',
    t.soigne ? `<span class="jt soigne" title="PV soignés">${ICO.soin}${grand ? '<em>Soignés</em>' : ''}+${t.soigne}</span>` : '',
    t.protege ? `<span class="jt protege" title="Bouclier gagné">${ICO.bouclier}${grand ? '<em>Bouclier</em>' : ''}+${t.protege}</span>` : '',
  ].join('');
  return p ? `<span class="jt-puces">${p}</span>` : '';
}

/** Les lignes d'un tour, rangées par moment : avant le lancer, la chaîne, puis la riposte de l'ennemi */
function corpsTour(t: TourHisto, n: number): string {
  let h = '';
  if (t.chaine.length) {
    const reso = t.suite ? `<span class="jb reso">${ICO.flux}Résonance ×${String(t.mult).replace('.', ',')}</span>` : '';
    const echo = t.echo ? `<span class="jb echo">${ICO.boost}Écho</span>` : '';
    const brouille = t.brouille ? `<span class="jb brouille">Brouillée</span>` : '';
    h += `<div class="jt-chaine"><div class="jt-cartes">${t.chaine.map((c, i) => carteMini(c, i)).join('')}</div>${reso || echo || brouille ? `<div class="jt-badges">${reso}${echo}${brouille}</div>` : ''}</div>`;
  }
  // les moments du tour : tant que l'ennemi n'a pas joué, tout est « ton tour »
  let moment = '';
  let ul = '';
  t.lignes.forEach((l, i) => {
    const m = l.camp === 'ennemi' ? 'ennemi' : moment === 'ennemi' ? 'ennemi' : 'joueur';
    if (m !== moment) {
      if (ul) h += `<ul class="jl-liste">${ul}</ul>`;
      ul = '';
      h += `<h4 class="jt-moment ${m}">${m === 'ennemi' ? 'Tour ennemi' : 'Ton tour'}</h4>`;
      moment = m;
    }
    ul += ligne(l, t, `jc-${n}-${i}`);
  });
  if (ul) h += `<ul class="jl-liste">${ul}</ul>`;
  return h;
}

function ongletTours(s: CombatEtat): string {
  const tours = (s.historique ?? []).filter((t) => t.chaine.length || t.lignes.length);
  if (!tours.length) return '<p class="j-vide">Aucune chaîne lancée pour l’instant. Chaque tour joué s’ajoutera ici, avec le calcul de chaque coup.</p>';
  const tout = totaux(tours.flatMap((t) => t.lignes));
  let h = `<div class="j-bilan" aria-label="Depuis le début du combat"><span class="surtitre">Depuis le début</span>${puces(tout, true)}</div>`;
  if ((s.historique?.[0]?.tour ?? 1) > 1) h += `<p class="j-note">Les tours avant le ${s.historique![0]!.tour}e ne sont plus gardés.</p>`;
  // le plus récent d'abord, déplié ; les autres se déplient d'un toucher
  const recents = tours.slice().reverse();
  h += recents.map((t, k) => {
    const enCours = t.tour === s.tour && s.issue === 'en-cours';
    return `<details class="j-tour${enCours ? ' en-cours' : ''}" id="jt-${t.tour}"${k === 0 ? ' open' : ''}>`
      + `<summary><span class="jt-titre">Tour ${t.tour}${enCours ? '<small>en cours</small>' : ''}</span>${puces(totaux(t.lignes))}<i class="jt-chevron" aria-hidden="true"></i></summary>`
      + `<div class="jt-corps">${corpsTour(t, t.tour)}</div></details>`;
  }).join('');
  return h;
}

// ---------- Les piles ----------

/** Les cartes d'une pile, rangées par Porteur puis par Fréquence (l'ordre de la pioche reste secret) */
const rangees = (gs: Geste[]) => gs.filter((g) => !g.vide)
  .sort((a, b) => (a.porteur ?? '~').localeCompare(b.porteur ?? '~') || a.f - b.f || a.nom.localeCompare(b.nom));

function pile(titre: string, icone: string, gs: Geste[], vide: string, terme: Terme, note: string, ordre: 'recent' | 'range'): string {
  const vides = gs.filter((g) => g.vide).length;
  // la défausse se lit dans l'ordre où les cartes y sont tombées, la plus récente d'abord ; la pioche, rangée (son ordre est secret)
  const cartes = ordre === 'recent' ? gs.filter((g) => !g.vide).reverse() : rangees(gs);
  return `<section class="j-pile"><h3>${icone}${titre}<b>${gs.length}</b></h3>${puceTerme(terme)}`
    + (note ? `<p class="j-note">${note}</p>` : '')
    + (cartes.length ? `<div class="jp-cartes">${cartes.map((g) => carteMini(g)).join('')}</div>` : `<p class="j-vide">${vide}</p>`)
    + (vides ? `<p class="j-note">Et ${vides} place${vides > 1 ? 's' : ''} vide${vides > 1 ? 's' : ''} (des Porteurs qui n’ont pas leurs 6 cartes).</p>` : '')
    + '</section>';
}

const DEFAUSSE: Terme = { ...LEXIQUE.defausse!, nom: 'La défausse' };
const PIOCHE: Terme = { ...LEXIQUE.pioche!, nom: 'La pioche' };

function ongletCartes(s: CombatEtat): string {
  return pile('Défausse', ICO.recycler, s.defausse, 'Vide : elle vient d’être mélangée dans la pioche.', DEFAUSSE, 'La plus récente d’abord.', 'recent')
    + pile('Pioche', ICO.cartes, s.pioche, 'Vide : la défausse sera mélangée au prochain tirage.', PIOCHE, 'Rangée par Porteur : l’ordre du tirage reste secret.', 'range');
}

// ---------- La feuille ----------

export function feuilleJournal(s: CombatEtat, onglet: OngletJournal): string {
  const tours = (s.historique ?? []).filter((t) => t.chaine.length).length;
  const onglets: [OngletJournal, string][] = [['tours', `Tours joués${tours ? ` · ${tours}` : ''}`], ['cartes', `Défausse et pioche`]];
  return `<div class="voile-feuille" data-action="journal" aria-hidden="true"></div>`
    + `<section class="feuille journal-combat" role="dialog" aria-modal="true" aria-labelledby="journal-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">JOURNAL</span><h2 id="journal-titre">Le combat, coup par coup</h2></div>`
    + `<button type="button" class="btn-icone" data-action="journal" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<div class="segments-choix j-onglets" role="tablist">${onglets.map(([id, nom]) => `<button type="button" role="tab" class="seg${id === onglet ? ' actif' : ''}" data-action="journal-onglet" data-id="${id}" aria-selected="${id === onglet}">${nom}</button>`).join('')}</div>`
    + `<div class="feuille-corps j-corps" data-onglet="${onglet}">${onglet === 'tours' ? ongletTours(s) : ongletCartes(s)}</div></section>`;
}
