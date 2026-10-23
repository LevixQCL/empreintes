// Les gains visibles (23 octobre 2026) : chaque fois que le joueur reçoit quelque chose, il le voit arriver.
// - les ressources (énergie, composants, Éclats, butin d'expédition) jaillissent de l'endroit touché en petites icônes peintes
//   et volent jusqu'à leur compteur, qui s'illumine et compte jusqu'à sa nouvelle valeur ;
// - les cartes, les Porteurs et les niveaux se dévoilent l'un après l'autre en bas de l'écran (nouvelle carte, doublons,
//   nouveau Porteur, niveau supérieur), puis filent vers leur onglet.
// On compare deux relevés de la partie, avant et après une action : rien à brancher dans les règles du jeu.
// Tout vit dans un calque posé sur <body>, hors de #app : le rendu du jeu (innerHTML) ne l'interrompt pas.

import type { Jeu } from '../core/jeu';
import { niveauPorteur } from '../core/jeu';
import { moduleDef, porteurDef } from '../core/donnees';
import { NOMS_RARETE } from '../core/collection';
import type { Rarete } from '../core/types';
import { illustrationModule, portrait } from './art';
import { icone } from './icones';
import { vibrer } from './toucher';

type Res = 'energie' | 'composants' | 'eclats';

export interface Releve {
  energie: number;
  composants: number;
  eclats: number;
  /** ce que porte l'expédition en cours (versé au district au retour) */
  x: { butin: number; cartes: number; eclats: number } | null;
  cartes: Record<string, { niveau: number; doublons: number }>;
  porteurs: string[];
  niveaux: Record<string, number>;
}

export function relever(j: Jeu): Releve {
  const x = j.expedition;
  const niveaux: Record<string, number> = {};
  for (const id of Object.keys(j.porteurs)) niveaux[id] = niveauPorteur(j, id).niveau;
  return {
    energie: Math.floor(j.energie),
    composants: Math.floor(j.composants),
    eclats: j.eclats,
    x: x ? { butin: x.butin, cartes: (x.gains?.elites ?? 0) + (x.gains?.cartes ?? 0), eclats: x.gains?.eclats ?? 0 } : null,
    cartes: Object.fromEntries(Object.entries(j.collection).map(([k, c]) => [k, { niveau: c.niveau, doublons: c.doublons }])),
    porteurs: Object.keys(j.porteurs),
    niveaux,
  };
}

export type Gain =
  | { kind: 'res'; r: Res | 'cartes'; n: number; avant: number; cible: string }
  | { kind: 'carte'; cle: string }
  | { kind: 'doublons'; cles: string[] }
  | { kind: 'porteur'; id: string }
  | { kind: 'niveaux'; ids: { id: string; niveau: number }[] };

/**
 * Ce qui a été reçu entre deux relevés. Les dépenses ne s'affichent pas.
 * `energie: false` pour le temps qui passe : la production du Générateur coule toute seule, ce n'est pas un cadeau.
 */
export function comparer(a: Releve, b: Releve, o: { energie?: boolean } = {}): Gain[] {
  const g: Gain[] = [];
  const res = (r: Res) => { const n = b[r] - a[r]; if (n >= 1) g.push({ kind: 'res', r, n, avant: a[r], cible: r }); };
  if (o.energie !== false) res('energie');
  res('composants');
  res('eclats');
  // le butin de l'expédition, tant qu'on est en bas
  if (a.x && b.x) {
    if (b.x.butin > a.x.butin) g.push({ kind: 'res', r: 'composants', n: b.x.butin - a.x.butin, avant: a.x.butin, cible: 'x-composants' });
    if (b.x.eclats > a.x.eclats) g.push({ kind: 'res', r: 'eclats', n: b.x.eclats - a.x.eclats, avant: a.x.eclats, cible: 'x-eclats' });
    if (b.x.cartes > a.x.cartes) g.push({ kind: 'res', r: 'cartes', n: b.x.cartes - a.x.cartes, avant: a.x.cartes, cible: 'x-cartes' });
  }
  for (const id of b.porteurs) if (!a.porteurs.includes(id)) g.push({ kind: 'porteur', id });
  const doublons: string[] = [];
  for (const [cle, c] of Object.entries(b.cartes)) {
    const v = a.cartes[cle];
    if (!v) g.push({ kind: 'carte', cle });
    else if (c.niveau === v.niveau && c.doublons > v.doublons) for (let i = v.doublons; i < c.doublons; i++) doublons.push(cle);
  }
  if (doublons.length) g.push({ kind: 'doublons', cles: doublons });
  const niv = Object.entries(b.niveaux).filter(([id, n]) => a.niveaux[id] !== undefined && n > a.niveaux[id]!).map(([id, niveau]) => ({ id, niveau }));
  if (niv.length) g.push({ kind: 'niveaux', ids: niv });
  return g;
}

// ---------- L'affichage ----------

const reduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const echap = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const ent = (n: number) => Math.floor(n).toLocaleString('fr-BE');
const COULEUR_METAL: Record<Rarete, string> = { fer: '#A7B0BA', cuivre: '#D88A55', argent: '#DDE3EC', or: '#E8BE5E', nacre: '#E6D6F5' };
const NOMS: Record<Res | 'cartes', [string, string]> = {
  energie: ['énergie', 'énergie'], composants: ['composant', 'composants'], eclats: ['Éclat', 'Éclats'], cartes: ['carte', 'cartes'],
};

function calque(): HTMLElement {
  let c = document.getElementById('gains');
  if (!c) {
    c = document.createElement('div');
    c.id = 'gains';
    c.setAttribute('aria-live', 'polite');
    document.body.appendChild(c);
  }
  return c;
}

const centreDe = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
/** le compteur visible d'une ressource (barre du haut, ou butin de l'expédition) */
function compteur(cible: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(`#app [data-gain="${cible}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.bottom > 0 && r.top < innerHeight ? el : null;
}

/** les reçus s'enchaînent : un dévoilement à la fois */
let file: Promise<void> = Promise.resolve();

export function montrer(gains: Gain[], depart?: { x: number; y: number }) {
  if (!gains.length) return;
  const d = depart && depart.x > 0 ? depart : { x: innerWidth / 2, y: innerHeight * 0.45 };
  let retard = 0;
  for (const g of gains) if (g.kind === 'res') { volerRessource(g, d, retard); retard += 160; }
  const reveles = gains.filter((g) => g.kind !== 'res');
  if (!reveles.length) { vibrer(12); return; }
  vibrer([14, 40, 22]);
  // au plus 4 nouvelles cartes en grand ; au-delà, elles rejoignent le paquet des doublons
  const nouvelles = reveles.filter((g): g is Extract<Gain, { kind: 'carte' }> => g.kind === 'carte');
  const surplus = nouvelles.slice(4).map((g) => g.cle);
  for (const g of reveles) {
    if (g.kind === 'carte' && surplus.includes(g.cle)) continue;
    const r = g.kind === 'doublons' ? { ...g, cles: [...surplus, ...g.cles] } : g;
    file = file.then(() => devoiler(r));
  }
  if (surplus.length && !reveles.some((g) => g.kind === 'doublons')) file = file.then(() => devoiler({ kind: 'doublons', cles: surplus }));
}

// ---------- Les ressources qui volent jusqu'à leur compteur ----------

function volerRessource(g: Extract<Gain, { kind: 'res' }>, d: { x: number; y: number }, retard: number) {
  const c = calque();
  const cible = compteur(g.cible);
  const fin = cible ? centreDe(cible) : null;
  const ico = icone(g.r === 'cartes' ? 'cartes' : g.r);
  const nom = NOMS[g.r][g.n > 1 ? 1 : 0];

  // l'étiquette « +12 composants » : elle jaillit, puis monte doucement et s'efface
  const lab = document.createElement('div');
  lab.className = `gain-etiquette g-${g.r}`;
  lab.innerHTML = `${ico}<b>+${ent(g.n)}</b><span>${nom}</span>`;
  lab.style.left = `${d.x}px`;
  lab.style.top = `${d.y}px`;
  c.appendChild(lab);
  const decale = retard * 0.22;
  lab.animate(reduit()
    ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }]
    : [
      { opacity: 0, transform: `translate(-50%, calc(-50% + ${decale}px)) scale(.5)` },
      { opacity: 1, transform: `translate(-50%, calc(-90% + ${decale}px)) scale(1.18)`, offset: 0.14, easing: 'cubic-bezier(.2,.9,.3,1.4)' },
      { opacity: 1, transform: `translate(-50%, calc(-110% + ${decale}px)) scale(1)`, offset: 0.7 },
      { opacity: 0, transform: `translate(-50%, calc(-170% + ${decale}px)) scale(.92)` },
    ], { duration: 1500, delay: retard, fill: 'both' }).finished.then(() => lab.remove(), () => lab.remove());

  if (!fin || reduit()) { if (cible) setTimeout(() => recevoir(cible, g), retard + 300); return; }

  // une gerbe de petites icônes peintes, qui s'égaillent puis filent vers le compteur
  const nb = Math.max(3, Math.min(8, Math.round(2 + Math.log2(g.n + 1))));
  let arrivees = 0;
  for (let i = 0; i < nb; i++) {
    const p = document.createElement('div');
    p.className = `gain-piece g-${g.r}`;
    p.innerHTML = ico;
    p.style.left = `${d.x}px`;
    p.style.top = `${d.y}px`;
    c.appendChild(p);
    const angle = (i / nb) * Math.PI * 2 + Math.random() * 0.8;
    const rayon = 38 + Math.random() * 34;
    const ex = Math.cos(angle) * rayon, ey = Math.sin(angle) * rayon - 24;
    const dx = fin.x - d.x, dy = fin.y - d.y;
    // une courbe : l'icône part sur le côté avant de rejoindre le compteur
    const mx = ex + (dx - ex) * 0.45 + (i % 2 ? 40 : -40), my = ey + (dy - ey) * 0.35;
    const t = 760 + Math.random() * 220;
    p.animate([
      { transform: 'translate(-50%, -50%) scale(.3)', opacity: 0 },
      { transform: `translate(calc(-50% + ${ex}px), calc(-50% + ${ey}px)) scale(1.1)`, opacity: 1, offset: 0.26, easing: 'cubic-bezier(.3,.6,.4,1)' },
      { transform: `translate(calc(-50% + ${ex}px), calc(-50% + ${ey + 6}px)) scale(1)`, opacity: 1, offset: 0.38, easing: 'cubic-bezier(.55,0,.8,.4)' },
      { transform: `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px)) scale(.85)`, opacity: 1, offset: 0.7 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.45)`, opacity: 0.9 },
    ], { duration: t, delay: retard + 120 + i * 55, fill: 'both' }).finished.then(() => {
      p.remove();
      if (++arrivees === 1) recevoir(cible!, g);
      else cible!.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 160 });
    }, () => p.remove());
  }
}

/** le compteur reçoit : il s'illumine, rebondit et compte jusqu'à sa nouvelle valeur */
function recevoir(cible: HTMLElement, g: Extract<Gain, { kind: 'res' }>) {
  cible.classList.remove('gain-recu');
  void cible.offsetWidth;
  cible.classList.add('gain-recu');
  setTimeout(() => cible.classList.remove('gain-recu'), 900);
  const v = cible.querySelector<HTMLElement>('.v, b');
  if (!v || reduit()) return;
  const de = g.avant, a = g.avant + g.n, t0 = performance.now(), duree = Math.min(900, 380 + g.n * 6);
  const pas = (t: number) => {
    if (!v.isConnected) return;
    const k = Math.min(1, (t - t0) / duree);
    v.textContent = ent(de + (a - de) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

// ---------- Les dévoilements : cartes, Porteurs, niveaux ----------

function vignetteCarte(cle: string, petite = false): string {
  const m = moduleDef(cle);
  const ill = illustrationModule(cle);
  return `<span class="gv-carte${petite ? ' petite' : ''}" style="--metal:${COULEUR_METAL[m.rarete]}">${ill ? `<img src="${ill}" alt="" decoding="async">` : `<i>${echap(m.nom.charAt(0))}</i>`}</span>`;
}
function vignettePorteur(id: string): string {
  const p = portrait(id);
  return `<span class="gv-porteur">${p ? `<img src="${p}" alt="" decoding="async">` : `<i>${echap(porteurDef(id).nom.charAt(0))}</i>`}</span>`;
}

function contenu(g: Exclude<Gain, { kind: 'res' }>): { html: string; onglet: string; classe: string } {
  if (g.kind === 'carte') {
    const m = moduleDef(g.cle);
    return {
      classe: `metal-${m.rarete}`, onglet: 'cartes',
      html: `${vignetteCarte(g.cle)}<span class="gv-texte"><small>Nouvelle carte</small><strong>${echap(m.nom)}</strong><em style="color:${COULEUR_METAL[m.rarete]}">${echap(NOMS_RARETE[m.rarete])}</em></span>`,
    };
  }
  if (g.kind === 'doublons') {
    const uniques = [...new Set(g.cles)];
    const titre = uniques.length === 1 ? `${moduleDef(uniques[0]!).nom}${g.cles.length > 1 ? ` ×${g.cles.length}` : ''}` : `${g.cles.length} cartes`;
    return {
      classe: 'doublons', onglet: 'cartes',
      html: `<span class="gv-pile">${uniques.slice(0, 4).map((c) => vignetteCarte(c, true)).join('')}</span><span class="gv-texte"><small>+${g.cles.length} doublon${g.cles.length > 1 ? 's' : ''}</small><strong>${echap(titre)}</strong><em>vers le niveau suivant</em></span>`,
    };
  }
  if (g.kind === 'porteur') {
    const p = porteurDef(g.id);
    return { classe: 'porteur', onglet: 'porteurs', html: `${vignettePorteur(g.id)}<span class="gv-texte"><small>Nouveau Porteur</small><strong>${echap(p.nom)}</strong><em>rejoint le district</em></span>` };
  }
  const un = g.ids.length === 1 ? g.ids[0]! : null;
  return {
    classe: 'niveau', onglet: 'porteurs',
    html: `<span class="gv-pile">${g.ids.slice(0, 3).map((e) => vignettePorteur(e.id)).join('')}</span><span class="gv-texte"><small>Niveau supérieur</small><strong>${un ? `${echap(porteurDef(un.id).nom)} · niv. ${un.niveau}` : g.ids.map((e) => `${echap(porteurDef(e.id).nom)} ${e.niveau}`).join(' · ')}</strong><em>plus de PV en combat</em></span>`,
  };
}

function devoiler(g: Exclude<Gain, { kind: 'res' }>): Promise<void> {
  return new Promise((fini) => {
    const c = calque();
    const { html, onglet, classe } = contenu(g);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `gain-revele ${classe}`;
    el.innerHTML = `<span class="gv-rayons" aria-hidden="true"></span>${html}`;
    c.appendChild(el);
    let parti = false;
    const partir = () => {
      if (parti) return;
      parti = true;
      clearTimeout(minuteur);
      const tab = document.querySelector(`#app .nav [data-action="${onglet}"]`);
      const r = el.getBoundingClientRect();
      const fin = tab && !reduit() ? centreDe(tab) : null;
      const a = fin
        ? el.animate([
          { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${fin.x - (r.left + r.width / 2)}px), ${fin.y - (r.top + r.height / 2)}px) scale(.18)`, opacity: 0.2 },
        ], { duration: 480, easing: 'cubic-bezier(.5,0,.75,.3)', fill: 'forwards' })
        : el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, 12px)' }], { duration: 260, fill: 'forwards' });
      a.finished.then(() => {
        el.remove();
        if (tab) { tab.classList.remove('gain-recu'); void (tab as HTMLElement).offsetWidth; tab.classList.add('gain-recu'); setTimeout(() => tab.classList.remove('gain-recu'), 900); }
        fini();
      }, () => { el.remove(); fini(); });
    };
    // toucher le reçu le range tout de suite ; sinon il part tout seul
    el.addEventListener('click', partir);
    el.animate(reduit()
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
        { transform: 'translate(-50%, 70px) scale(.7)', opacity: 0 },
        { transform: 'translate(-50%, -8px) scale(1.05)', opacity: 1, offset: 0.6 },
        { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
      ], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'both' });
    const minuteur = window.setTimeout(partir, g.kind === 'doublons' ? 1700 : 2300);
  });
}
