// Le bandeau d'annonce des gardiens (27 octobre 2026) : Bryan voulait qu'on sache qu'on affronte un boss, et que sa seconde
// phase (avec la créature qu'il appelle) soit un vrai moment au lieu d'un petit rond qui apparaît sans prévenir.
// Le bandeau peint (cristal et or, centre noir) se fond dans l'écran par la lumière ; le titre se pose dans son cœur sombre.
// Il ne bloque rien (on peut toucher à travers) et s'efface seul.

import { ennemiDef } from '../core/donnees';
import { artGardien, illustrationEnnemi } from './art';
import { echap } from './outils';

let courant: HTMLElement | null = null;

function montrer(cls: string, html: string, duree: number, reduit: boolean) {
  courant?.remove();
  const el = document.createElement('div');
  el.className = `bandeau-gardien ${cls}`;
  el.setAttribute('role', 'status');
  el.style.setProperty('--bandeau', `url(${artGardien('bandeau')})`);
  el.innerHTML = `<span class="bg-voile"></span><span class="bg-fond"></span><div class="bg-texte">${html}</div>`;
  document.body.appendChild(el);
  courant = el;
  const fin = () => { if (courant === el) courant = null; el.remove(); };
  if (reduit) { setTimeout(fin, duree); return; }
  const fond = el.querySelector('.bg-fond') as HTMLElement;
  const texte = el.querySelector('.bg-texte') as HTMLElement;
  const voile = el.querySelector('.bg-voile') as HTMLElement;
  const t = { duration: duree, easing: 'cubic-bezier(.2,.7,.3,1)' };
  voile.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.78 }, { opacity: 0 }], t);
  fond.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scaleX(.15) scaleY(.6)' },
    { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1.04) scaleY(1)', offset: 0.14 },
    { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1)', offset: 0.78 },
    { opacity: 0, transform: 'translate(-50%,-50%) scaleX(1.12) scaleY(.85)' },
  ], t);
  texte.animate([
    { opacity: 0, transform: 'scale(1.35)', filter: 'blur(6px)' },
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: 0.16 },
    { opacity: 1, transform: 'scale(1.02)', offset: 0.78 },
    { opacity: 0, transform: 'scale(.96) translateY(-10px)' },
  ], t).finished.then(fin, fin);
}

/** L'entrée du gardien, une fois au début du combat */
export function annoncerGardien(id: string, strate: number | null, reduit: boolean): void {
  const d = ennemiDef(id);
  montrer('entree', `<span class="bg-sur">${strate ? `Gardien · Strate −${strate}` : 'Gardien'}</span>`
    + `<span class="bg-titre">${echap(d.nom)}</span>`
    + `<span class="bg-sous">${echap(d.tag.replace(/^BOSS · /, ''))}</span>`, 2600, reduit);
}

/** La seconde phase : son nom, ce qui se passe, et la créature appelée, montrée en grand avant de prendre sa place */
export function annoncerPhase(id: string, reduit: boolean): void {
  const ph = ennemiDef(id).phase;
  if (!ph) return;
  const renfort = ph.renforts?.[0];
  const ill = renfort ? illustrationEnnemi(renfort) : null;
  montrer('phase', `<span class="bg-sur">${echap(ennemiDef(id).nom)} · seconde phase</span>`
    + `<span class="bg-titre">${echap(ph.nom)}</span>`
    + `<span class="bg-sous">${echap(ph.texte)}</span>`
    + (ill && renfort ? `<img class="bg-renfort" src="${ill}" alt=""><span class="bg-nom">${echap(ennemiDef(renfort).nom)} entre dans le combat</span>` : ''), 3000, reduit);
}
