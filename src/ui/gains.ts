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
  // au plus 4 nouvelles cartes de fer ou de cuivre en reçu ; au-delà, elles rejoignent le paquet des doublons
  // (une carte rare a toujours sa propre révélation, même dans un gros butin)
  const communes = reveles.filter((g): g is Extract<Gain, { kind: 'carte' }> => g.kind === 'carte' && palier(g) < 3);
  const surplus = communes.slice(4).map((g) => g.cle);
  let liste = reveles.filter((g) => !(g.kind === 'carte' && surplus.includes(g.cle)))
    .map((g) => (g.kind === 'doublons' ? { ...g, cles: [...surplus, ...g.cles] } : g));
  if (surplus.length && !liste.some((g) => g.kind === 'doublons')) liste.push({ kind: 'doublons', cles: surplus });
  // du plus modeste au plus précieux : le clou du butin arrive en dernier
  liste = liste.sort((a, b) => palier(a) - palier(b));
  for (const g of liste) {
    const p = palier(g);
    file = file.then(() => ((g.kind === 'carte' || g.kind === 'porteur') && p >= 3 ? grandeRevelation(g, p) : devoiler(g)));
  }
}

// ---------- L'importance d'un gain ----------
// Plus c'est rare, plus ça se voit (décision du 23 octobre 2026) :
// 1 fer, doublons, petites sommes · 2 cuivre, niveau, grosse somme, Éclats · 3 argent · 4 or, nouveau Porteur · 5 nacre.
const PALIER_METAL: Record<Rarete, number> = { fer: 1, cuivre: 2, argent: 3, or: 4, nacre: 5 };
export function palier(g: Gain): number {
  if (g.kind === 'carte') return PALIER_METAL[moduleDef(g.cle).rarete];
  if (g.kind === 'porteur') return 4;
  if (g.kind === 'niveaux') return 2;
  if (g.kind === 'doublons') return Math.max(1, Math.max(...g.cles.map((c) => PALIER_METAL[moduleDef(c).rarete])) - 1);
  if (g.r === 'eclats' || g.r === 'cartes') return 2;
  return g.n >= 100 ? 2 : 1;
}

// ---------- Les ressources qui volent jusqu'à leur compteur ----------

function volerRessource(g: Extract<Gain, { kind: 'res' }>, d: { x: number; y: number }, retard: number) {
  const c = calque();
  const cible = compteur(g.cible);
  const fin = cible ? centreDe(cible) : null;
  const ico = icone(g.r === 'cartes' ? 'cartes' : g.r);
  const nom = NOMS[g.r][g.n > 1 ? 1 : 0];

  // l'étiquette « +12 composants » : elle jaillit, puis monte doucement et s'efface
  const fort = palier(g) >= 2;
  const lab = document.createElement('div');
  lab.className = `gain-etiquette g-${g.r}${fort ? ' fort' : ''}`;
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
  const nb = Math.max(3, Math.min(fort ? 14 : 8, Math.round(2 + Math.log2(g.n + 1)) + (fort ? 4 : 0)));
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
    el.className = `gain-revele ${classe} p${palier(g)}`;
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

// ---------- La grande révélation : carte d'argent, d'or, de nacre, nouveau Porteur ----------
// Le voile tombe, la carte arrive face cachée, tremble de plus en plus longtemps selon sa rareté, puis un éclair :
// elle se retourne dans une gerbe d'éclats, des ondes de choc (or, nacre) et une secousse de l'écran.
// On la range d'un toucher (ou toute seule après quelques secondes).

/**
 * L'empreinte qui se dépose sur le dos pendant le suspense : des sillons dorés qui se tracent du cœur vers le bord,
 * comme un doigt qu'on presse sur le cristal (durée = celle du suspense, --charge).
 */
const EMPREINTE = (() => {
  const sillons: string[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const rx = 4 + i * 4.6, ry = rx * 1.25;
    const cy = 56 + i * 0.6;
    // des bouts inégaux, comme une vraie empreinte
    const bg = cy + 8 + ((i * 7) % 5) * 4 + i * 2.2, bd = cy + 4 + ((i * 3) % 4) * 5 + i * 2.6;
    sillons.push(`<path pathLength="1" style="--k:${(i / n).toFixed(3)}" d="M${(50 - rx).toFixed(1)} ${bg.toFixed(1)} V${cy} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${(50 + rx).toFixed(1)} ${cy} V${bd.toFixed(1)}"/>`);
  }
  // le petit tourbillon du cœur
  sillons.unshift('<path pathLength="1" style="--k:0" d="M48 62 C46 56 54 54 54 60 C54 64 50 66 49 63"/>');
  // par-dessus, le même dessin parcouru par des impulsions de lumière : l'empreinte vit et transmet
  const flux = sillons.map((d, i) => d.replace('style="--k:', `style="--f:${((i * 0.37) % 1).toFixed(2)};--k:`)).join('');
  return `<svg class="gr-empreinte" viewBox="0 0 100 130" aria-hidden="true"><g class="trace">${sillons.join('')}</g><g class="flux">${flux}</g></svg>`;
})();

const NOM_PALIER: Record<number, string> = { 3: 'Rare', 4: 'Très rare', 5: 'Légendaire' };
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function grandeRevelation(g: Extract<Gain, { kind: 'carte' | 'porteur' }>, p: number): Promise<void> {
  return new Promise((fini) => {
    const c = calque();
    const carte = g.kind === 'carte' ? moduleDef(g.cle) : null;
    const accent = carte ? COULEUR_METAL[carte.rarete] : '#7FD4FF';
    const img = carte ? illustrationModule(g.kind === 'carte' ? g.cle : '') : portrait(g.kind === 'porteur' ? g.id : '');
    const nom = carte ? carte.nom : porteurDef((g as { id: string }).id).nom;
    const sur = carte ? `Carte ${carte.rarete === 'or' ? 'd’or' : carte.rarete === 'argent' ? 'd’argent' : 'de nacre'} · ${NOM_PALIER[p]}` : 'Nouveau Porteur';
    const sous = carte ? 'Nouvelle carte' : 'rejoint le district';
    const el = document.createElement('div');
    el.className = `gr p${p}${carte ? ` metal-${carte.rarete}` : ' porteur'}`;
    el.style.setProperty('--accent', accent);
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', `${sur} : ${nom}`);
    el.innerHTML = `<div class="gr-voile"></div><div class="gr-rayons"></div><div class="gr-halo"></div><div class="gr-flash"></div>`
      + `<div class="gr-pose"><div class="gr-carte${carte ? '' : ' rond'}">`
      + `<div class="gr-face gr-dos">${EMPREINTE}<img src="./art/embleme.webp" alt=""></div>`
      + `<div class="gr-face gr-recto">${img ? `<img src="${img}" alt="">` : `<i>${echap(nom.charAt(0))}</i>`}</div></div></div>`
      + `<div class="gr-texte"><small>${echap(sur)}</small><strong>${echap(nom)}</strong><em>${echap(sous)}</em><span class="gr-suite">Touche pour continuer</span></div>`;
    c.appendChild(el);
    const carteEl = el.querySelector<HTMLElement>('.gr-carte')!;
    const pose = el.querySelector<HTMLElement>('.gr-pose')!;
    let pret = false, parti = false;

    const ranger = () => {
      if (!pret || parti) return;
      parti = true;
      clearTimeout(auto);
      const tab = document.querySelector(`#app .nav [data-action="${carte ? 'cartes' : 'porteurs'}"]`);
      const r = pose.getBoundingClientRect();
      const fin = tab && !reduit() ? centreDe(tab) : null;
      el.classList.add('sort');
      const a = fin
        ? pose.animate([{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: `translate(calc(-50% + ${fin.x - (r.left + r.width / 2)}px), calc(-50% + ${fin.y - (r.top + r.height / 2)}px)) scale(.08)`, opacity: 0.3 }],
          { duration: 520, easing: 'cubic-bezier(.5,0,.75,.3)', fill: 'forwards' })
        : pose.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
      a.finished.then(() => {
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished.then(() => el.remove(), () => el.remove());
        if (tab) { tab.classList.remove('gain-recu'); void (tab as HTMLElement).offsetWidth; tab.classList.add('gain-recu'); setTimeout(() => tab.classList.remove('gain-recu'), 900); }
        fini();
      }, () => { el.remove(); fini(); });
    };
    el.addEventListener('click', ranger);
    let auto = 0;

    (async () => {
      if (reduit()) {
        carteEl.classList.add('ouverte');
        el.classList.add('revelee');
        pret = true;
        auto = window.setTimeout(ranger, 6000);
        return;
      }
      // 1. la carte arrive face cachée
      pose.animate([{ transform: 'translate(-50%, 40vh) scale(.5) rotate(-8deg)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1) rotate(0)', opacity: 1 }],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1.1)', fill: 'both' });
      await pause(560);
      // 2. le suspense : elle tremble et s'illumine, plus longtemps pour les plus rares
      const suspense = p >= 5 ? 1800 : p >= 4 ? 1300 : 850;
      el.classList.add('charge');
      carteEl.style.setProperty('--charge', `${suspense}ms`);
      const amp = p >= 5 ? 5 : p >= 4 ? 3.5 : 2;
      const pas: Keyframe[] = [];
      for (let i = 0; i <= 12; i++) { const k = i / 12; const a = amp * (0.3 + k) * (i % 2 ? 1 : -1); pas.push({ transform: `rotate(${a}deg) scale(${1 + 0.06 * k})`, offset: k }); }
      carteEl.animate(pas, { duration: suspense, easing: 'ease-in', fill: 'forwards' });
      const ticks = Math.round(suspense / 260);
      for (let i = 0; i < ticks; i++) setTimeout(() => vibrer(8 + i * 4), i * 260);
      await pause(suspense);
      // 3. l'éclair, le retournement, la gerbe
      carteEl.getAnimations().forEach((a) => a.cancel());
      el.classList.remove('charge');
      el.querySelector<HTMLElement>('.gr-flash')!.animate([{ opacity: 0 }, { opacity: p >= 4 ? 0.95 : 0.7, offset: 0.25 }, { opacity: 0 }], { duration: p >= 4 ? 700 : 450, easing: 'ease-out' });
      carteEl.classList.add('ouverte');
      el.classList.add('revelee');
      vibrer(p >= 5 ? [60, 40, 90, 40, 140] : p >= 4 ? [50, 40, 100] : [40, 30, 60]);
      eclats(el, p, accent);
      for (let i = 0; i < p - 3; i++) onde(el, i * 220);
      if (p >= 4) secouer(p);
      await pause(900);
      pret = true;
      auto = window.setTimeout(ranger, p >= 5 ? 9000 : 7000);
    })();
  });
}

/** la gerbe d'éclats, à la couleur du métal (toutes les couleurs pour la nacre) */
function eclats(el: HTMLElement, p: number, accent: string) {
  const n = p >= 5 ? 70 : p >= 4 ? 46 : 26;
  const cx = innerWidth / 2, cy = innerHeight * 0.42;
  for (let i = 0; i < n; i++) {
    const e = document.createElement('i');
    e.className = 'gr-eclat';
    const couleur = p >= 5 ? `hsl(${Math.round(Math.random() * 360)} 90% 78%)` : Math.random() < 0.3 ? '#FFF6DA' : accent;
    e.style.background = couleur;
    e.style.boxShadow = `0 0 8px ${couleur}`;
    e.style.left = `${cx}px`;
    e.style.top = `${cy}px`;
    const taille = 5 + Math.random() * (p >= 4 ? 10 : 7);
    e.style.width = `${taille}px`;
    e.style.height = `${taille * (Math.random() < 0.5 ? 2.4 : 1)}px`;
    el.appendChild(e);
    const angle = Math.random() * Math.PI * 2;
    const loin = (0.25 + Math.random() * 0.5) * Math.min(innerWidth, innerHeight) * (p >= 4 ? 1 : 0.75);
    const x = Math.cos(angle) * loin, y = Math.sin(angle) * loin;
    const t = 1300 + Math.random() * 1200;
    const rot = Math.round(Math.random() * 720 - 360);
    e.animate([
      { transform: 'translate(-50%, -50%) scale(.2) rotate(0)', opacity: 1 },
      { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45, easing: 'cubic-bezier(.3,.6,.5,1)' },
      { transform: `translate(calc(-50% + ${x * 1.1}px), calc(-50% + ${y + 120}px)) scale(.6) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: t, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' }).finished.then(() => e.remove(), () => e.remove());
  }
}

/** une onde de choc qui part de la carte (or et nacre) */
function onde(el: HTMLElement, retard: number) {
  const o = document.createElement('i');
  o.className = 'gr-onde';
  el.appendChild(o);
  o.animate([{ transform: 'translate(-50%, -50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%, -50%) scale(3.2)', opacity: 0 }],
    { duration: 900, delay: retard, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).finished.then(() => o.remove(), () => o.remove());
}

/** l'écran tremble un instant (or et nacre) */
function secouer(p: number) {
  const app = document.getElementById('app');
  if (!app) return;
  const a = p >= 5 ? 9 : 6;
  app.animate([0, 1, 2, 3, 4, 5, 6].map((i) => ({ transform: i === 6 ? 'none' : `translate(${(i % 2 ? 1 : -1) * a * (1 - i / 6)}px, ${(i % 3 - 1) * a * 0.6 * (1 - i / 6)}px)` })),
    { duration: 380, easing: 'ease-out' });
}
