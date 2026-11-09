// Réordonner la chaîne au doigt (25 octobre 2026, Bryan) : une carte posée se glisse le long du rail jusqu'à une
// autre place, sans repasser par la main. Un simple toucher la retire toujours ; c'est le glissé horizontal qui déplace.
// Les autres cartes s'écartent pendant le geste ; au lâcher, la règle (C.deplacer) range la chaîne et l'écran se redessine
// (le vol « FLIP » de toucher.ts fait atterrir la carte à sa place).

import * as C from '../core/combat';
import { vibrer } from '../ui/toucher';
import { app, K, racine } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';

/** un groupe = une place de la chaîne : la carte (ou son maillon) et, pour une carte lourde, sa deuxième place reliée */
interface Groupe { els: HTMLElement[]; centre: number; largeur: number }

interface Prise {
  uid: string;
  rail: HTMLElement;
  groupes: Groupe[];
  de: number;
  x0: number;
  y0: number;
  id: number;
  actif: boolean;
  vers: number;
}

const SEUIL = 8;
let prise: Prise | null = null;
let annulerClic = false;

function groupesDu(rail: HTMLElement): Groupe[] {
  const g: Groupe[] = [];
  for (const el of Array.from(rail.children) as HTMLElement[]) {
    if (el.classList.contains('place-liee') && g.length) { g[g.length - 1]!.els.push(el); continue; }
    if (!el.matches('.geste[data-uid], .maillon')) continue;
    g.push({ els: [el], centre: 0, largeur: 0 });
  }
  // positions dans le contenu du rail (indépendantes du défilement et des décalages en cours)
  for (const x of g) {
    const debut = x.els[0]!.offsetLeft, fin = x.els[x.els.length - 1]!.offsetLeft + x.els[x.els.length - 1]!.offsetWidth;
    x.centre = (debut + fin) / 2;
    x.largeur = fin - debut;
  }
  return g;
}

function decaler(p: Prise, dx: number, dy: number) {
  const ecart = p.groupes[p.de]!.largeur + 8;
  p.groupes.forEach((g, i) => {
    let t = '';
    if (i === p.de) t = `translate(${dx}px, ${dy * 0.25}px) scale(1.08)`;
    else if (p.vers > p.de && i > p.de && i <= p.vers) t = `translateX(${-ecart}px)`;
    else if (p.vers < p.de && i >= p.vers && i < p.de) t = `translateX(${ecart}px)`;
    for (const el of g.els) {
      el.style.transform = t;
      el.style.transition = i === p.de ? 'none' : 'transform .16s cubic-bezier(.2,.9,.3,1)';
      el.style.zIndex = i === p.de ? '6' : '';
    }
  });
}

function relacher(p: Prise) {
  for (const g of p.groupes) for (const el of g.els) { el.style.transform = ''; el.style.transition = ''; el.style.zIndex = ''; el.classList.remove('deplace'); }
}

export function brancherChaine(): void {
  racine.addEventListener('pointerdown', (ev) => {
    if (app.mode !== 'combat' || K.verrou || prise) return;
    const carte = (ev.target as HTMLElement).closest<HTMLElement>('.zone-chaine .rail .geste[data-uid]');
    const s = app.jeu.expedition?.combat;
    if (!carte || (carte as HTMLButtonElement).disabled || !s || s.chaine.length < 2) return;
    const rail = carte.closest<HTMLElement>('.rail')!;
    const groupes = groupesDu(rail);
    const de = groupes.findIndex((g) => g.els[0]!.contains(carte));
    if (de < 0) return;
    prise = { uid: carte.dataset.uid!, rail, groupes, de, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId, actif: false, vers: de };
  });

  racine.addEventListener('pointermove', (ev) => {
    const p = prise;
    if (!p || ev.pointerId !== p.id) return;
    const dx = ev.clientX - p.x0, dy = ev.clientY - p.y0;
    if (!p.actif) {
      if (Math.abs(dy) > SEUIL && Math.abs(dy) > Math.abs(dx)) { prise = null; return; } // c'est un défilement de la page
      if (Math.abs(dx) < SEUIL) return;
      p.actif = true;
      p.groupes[p.de]!.els[0]!.classList.add('deplace');
      vibrer(5);
    }
    ev.preventDefault();
    // près d'un bord, le rail défile pour atteindre les places cachées
    const r = p.rail.getBoundingClientRect();
    if (ev.clientX < r.left + 28) p.rail.scrollLeft -= 10;
    else if (ev.clientX > r.right - 28) p.rail.scrollLeft += 10;
    const x = ev.clientX - r.left + p.rail.scrollLeft;
    let vers = 0;
    p.groupes.forEach((g, i) => { if (i !== p.de && x > g.centre) vers++; });
    if (vers !== p.vers) vibrer(3);
    p.vers = vers;
    decaler(p, dx, dy);
  }, { passive: false });

  const fin = (ev: PointerEvent) => {
    const p = prise;
    if (!p || ev.pointerId !== p.id) return;
    prise = null;
    if (!p.actif) return;
    annulerClic = true;
    setTimeout(() => { annulerClic = false; }, 400);
    const s = app.jeu.expedition?.combat;
    if (ev.type === 'pointerup' && s && p.vers !== p.de && C.deplacer(s, p.uid, p.vers).ok) {
      // la carte repart de là où le doigt l'a lâchée : on ne remet que les autres à zéro avant de redessiner
      for (const [i, g] of p.groupes.entries()) if (i !== p.de) for (const el of g.els) { el.style.transition = 'none'; el.style.transform = ''; }
      sauver();
      afficher();
      return;
    }
    relacher(p);
  };
  racine.addEventListener('pointerup', fin);
  racine.addEventListener('pointercancel', fin);
  // le lâcher d'un glissé n'est pas un toucher : la carte ne doit pas repartir en main
  racine.addEventListener('click', (ev) => { if (annulerClic) { annulerClic = false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
}
