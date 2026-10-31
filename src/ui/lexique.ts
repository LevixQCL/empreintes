// Les mots du jeu, touchables (31 octobre 2026, Luc : « je vois pas ce que c'est fissuré »).
// Dans le texte d'une carte ou d'une aide, chaque terme du jeu est souligné d'un pointillé doré ; le toucher ouvre une petite
// bulle qui l'explique, sans quitter l'écran, avec un lien vers le glossaire complet (un onglet du mode d'emploi).
// Les termes eux-mêmes vivent dans core/lexique.ts. La bulle vit hors du rendu (dans <body>) : un redessin ne la ferme pas.

import { LEXIQUE, NOMS_THEMES, decouper, type ThemeTerme } from '../core/lexique';
import { NOMS_EFFET } from '../core/effets';
import type { TypeEffet } from '../core/types';
import { ICO } from './icones';
import { echap } from './outils';

/**
 * Un texte dont les mots du jeu deviennent touchables (le texte est échappé ici : ne pas l'échapper avant).
 * @param sauf les termes à ne pas souligner (celui qu'on est en train d'expliquer, par exemple)
 */
export function avecMots(texte: string, sauf: readonly string[] = []): string {
  return decouper(texte, new Set(sauf)).map((m) => m.terme
    ? `<span class="mot-jeu" role="button" tabindex="0" data-terme="${m.terme}" aria-label="${echap(`${m.texte} : qu’est-ce que c’est ?`)}">${echap(m.texte)}</span>`
    : echap(m.texte)).join('');
}

// ---------- La bulle ----------

let ouvrirGlossaire: (terme: string) => void = () => {};
let bulle: HTMLElement | null = null;

function fermerBulle() {
  bulle?.remove();
  bulle = null;
}

function montrerBulle(mot: HTMLElement) {
  const id = mot.dataset.terme ?? '';
  const t = LEXIQUE[id];
  if (!t) return;
  fermerBulle();
  const b = document.createElement('div');
  b.className = 'bulle-mot';
  b.dataset.cle = id;
  b.setAttribute('role', 'dialog');
  b.setAttribute('aria-label', t.nom);
  b.innerHTML = `<div class="bm-tete"><b>${echap(t.nom)}</b><button type="button" class="bm-fermer" aria-label="Fermer">${ICO.fermer}</button></div>`
    + `<p>${avecMots(t.texte, [id])}</p>`
    + `<button type="button" class="bm-glossaire">${ICO.aide}<span>Tout le glossaire</span></button>`;
  document.body.appendChild(b);
  bulle = b;
  // sous le mot si la place le permet, sinon au-dessus ; jamais hors de l'écran
  const r = mot.getBoundingClientRect();
  const marge = 10;
  const l = Math.min(320, innerWidth - 2 * marge);
  b.style.width = `${l}px`;
  b.style.left = `${Math.max(marge, Math.min(r.left + r.width / 2 - l / 2, innerWidth - l - marge))}px`;
  const h = b.offsetHeight;
  const dessous = r.bottom + 8 + h < innerHeight - marge;
  b.style.top = `${dessous ? r.bottom + 8 : Math.max(marge, r.top - 8 - h)}px`;
  b.classList.add(dessous ? 'dessous' : 'dessus');
  b.querySelector<HTMLElement>('.bm-fermer')?.focus({ preventScroll: true });
}

/** À brancher une fois au démarrage : `ouvrir` montre l'onglet Glossaire du mode d'emploi, positionné sur un terme */
export function brancherMots(ouvrir: (terme: string) => void) {
  ouvrirGlossaire = ouvrir;
  // en capture : un mot touché ne déclenche jamais le bouton ou la carte qui le contient
  document.addEventListener('click', (ev) => {
    const cible = ev.target as HTMLElement;
    const mot = cible.closest<HTMLElement>('[data-terme]');
    if (mot) { ev.stopPropagation(); ev.preventDefault(); montrerBulle(mot); return; }
    if (!bulle) return;
    if (cible.closest('.bm-glossaire')) {
      const id = bulle.dataset.cle ?? '';
      fermerBulle(); ev.stopPropagation(); ouvrirGlossaire(id); return;
    }
    if (cible.closest('.bm-fermer') || !cible.closest('.bulle-mot')) {
      fermerBulle();
      // toucher à côté ferme seulement la bulle (on ne déclenche pas ce qui est dessous par mégarde)
      if (!cible.closest('.bulle-mot')) { ev.stopPropagation(); ev.preventDefault(); }
    }
  }, true);
  document.addEventListener('keydown', (ev) => {
    const mot = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-terme]');
    if (mot && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ev.stopPropagation(); montrerBulle(mot); }
    else if (bulle && ev.key === 'Escape') { ev.stopPropagation(); fermerBulle(); }
  }, true);
  addEventListener('scroll', fermerBulle, { passive: true, capture: true });
  addEventListener('resize', fermerBulle);
  // la recherche du glossaire : filtre sur place, sans redessiner l'écran
  document.addEventListener('input', (ev) => {
    const champ = ev.target as HTMLInputElement;
    if (!champ.classList?.contains('gl-recherche')) return;
    recherche = champ.value;
    filtrer(champ.closest('.guide-corps'));
  });
}

// ---------- Le glossaire (onglet du mode d'emploi) ----------

/** Ce qu'on cherche dans le glossaire : gardé entre deux redessins */
let recherche = '';
/** Le terme à montrer en ouvrant le glossaire depuis une bulle */
let vise = '';

export const viserTerme = (id: string) => { vise = id; recherche = ''; };

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function filtrer(corps: Element | null) {
  if (!corps) return;
  const q = sansAccents(recherche.trim());
  let total = 0;
  corps.querySelectorAll<HTMLElement>('.gl-theme').forEach((sec) => {
    let n = 0;
    sec.querySelectorAll<HTMLElement>('.gl-terme').forEach((li) => {
      const ok = !q || (li.dataset.cherche ?? '').includes(q);
      li.hidden = !ok;
      if (ok) n++;
    });
    sec.hidden = n === 0;
    total += n;
  });
  const vide = corps.querySelector<HTMLElement>('.gl-vide');
  if (vide) vide.hidden = total > 0;
}

const ORDRE: ThemeTerme[] = ['cartes', 'combat', 'effet', 'ennemi', 'marque', 'district'];

/**
 * L'onglet Glossaire : tous les termes, rangés par thème, avec une recherche.
 * @param regleEffet le texte complet de chaque effet de carte (celui de l'onglet « Les effets »)
 */
export function ongletGlossaire(regleEffet: (t: TypeEffet) => string): string {
  const entrees: Record<ThemeTerme, { id: string; nom: string; texte: string }[]> = { cartes: [], combat: [], effet: [], ennemi: [], marque: [], district: [] };
  for (const [id, t] of Object.entries(LEXIQUE)) if (t.theme !== 'effet') entrees[t.theme].push({ id, nom: t.nom, texte: t.texte });
  // les effets : le texte complet du mode d'emploi, avec les chiffres réels
  for (const type of Object.keys(NOMS_EFFET) as TypeEffet[]) {
    const id = Object.entries(LEXIQUE).find(([, t]) => t.theme === 'effet' && t.nom === NOMS_EFFET[type])?.[0] ?? `effet-${type}`;
    entrees.effet.push({ id, nom: NOMS_EFFET[type], texte: regleEffet(type) + (type === 'fissure' ? ' Seules les cartes posées après elle en profitent. On dit alors que l’ennemi est « fissuré ».' : '') });
  }
  const q = sansAccents(recherche.trim());
  let h = `<p class="g-chapeau">Tous les mots du jeu. Dans le texte des cartes, un mot <span class="mot-jeu exemple">souligné ainsi</span> s’explique d’un toucher.</p>`
    + `<label class="gl-champ">${ICO.chercher}<input class="gl-recherche" type="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Chercher un mot (Fissure, Flux…)" aria-label="Chercher dans le glossaire" value="${echap(recherche)}"></label>`;
  let total = 0;
  for (const th of ORDRE) {
    const liste = entrees[th].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    let n = 0;
    const items = liste.map((e) => {
      const cherche = sansAccents(`${e.nom} ${e.texte}`);
      const ok = !q || cherche.includes(q);
      if (ok) n++;
      return `<li class="gl-terme${e.id === vise ? ' vise' : ''}" id="gl-${e.id}" data-cherche="${echap(cherche)}"${ok ? '' : ' hidden'}><b>${echap(e.nom)}</b><p>${avecMots(e.texte, [e.id])}</p></li>`;
    }).join('');
    total += n;
    h += `<section class="bloc gl-theme"${n ? '' : ' hidden'}><h3 class="titre-bloc">${NOMS_THEMES[th]}</h3><ul class="gl-liste">${items}</ul></section>`;
  }
  h += `<p class="gl-vide aide"${total ? ' hidden' : ''}>Aucun mot ne correspond.</p>`;
  if (vise) {
    const id = vise;
    vise = '';
    requestAnimationFrame(() => document.getElementById(`gl-${id}`)?.scrollIntoView({ block: 'center' }));
  }
  return h;
}
