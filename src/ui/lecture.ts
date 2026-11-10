// L'écran d'une Lecture (prototype du 11 novembre 2026) : le fil du souvenir de haut en bas, les liens qui s'allument
// entre deux fragments, la réserve des fragments, le faux souvenir quand le fil est lu de travers.
// Les règles sont dans core/lectures.ts.

import { NOMS_MOTIFS, etoilesLecture, fragmentDe, liens, reserve, toutAllume, type EtatLecture, type Fragment, type Motif } from '../core/lectures';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

export interface EcranLecture {
  etat: EtatLecture;
  /** l'écran d'avant la Lecture */
  intro: boolean;
}

const puce = (m: Motif | null, cote: 'entree' | 'sortie') =>
  m ? `<span class="lc-motif ${cote}" data-motif="${m}">${NOMS_MOTIFS[m]}</span>` : `<span class="lc-motif ${cote} vide" aria-hidden="true">·</span>`;

function fragment(f: Fragment, action: string, id: string, extra = ''): string {
  return `<button type="button" class="lc-frag${extra}" data-action="${action}" data-id="${id}">`
    + puce(f.motifs[0], 'entree') + `<span class="lc-texte">${echap(f.texte)}</span>` + puce(f.motifs[1], 'sortie') + `</button>`;
}

function intro(e: EtatLecture): string {
  return `<section class="lc-intro"><p class="surtitre">${e.def.surtitre}</p><h1>${e.def.titre}</h1>`
    + `<div class="lc-lignes">${e.def.intro.map((l) => `<p>${l}</p>`).join('')}</div>`
    + `<div class="lc-pied"><button type="button" class="btn sec" data-action="lecture-quitter">${tr`Plus tard`}</button>`
    + `<button type="button" class="btn prim" data-action="lecture-commencer">${tr`Toucher le cristal`}</button></div></section>`;
}

function fin(e: EtatLecture): string {
  const n = etoilesLecture(e);
  return `<div class="lc-voile"></div><section class="lc-fin" role="dialog" aria-modal="true">`
    + `<p class="lc-etoiles" aria-label="${tr`${n} étoiles sur 3`}">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></p>`
    + `<h2>${tr`Le vrai souvenir`}</h2>`
    + `<div class="lc-lignes">${e.def.fin.map((l) => `<p>${l}</p>`).join('')}</div>`
    + `<p class="lc-bilan">${e.faux ? tr`${e.faux} faux souvenir${e.faux > 1 ? 's' : ''} lu${e.faux > 1 ? 's' : ''} avant le vrai.` : tr('Lu du premier coup.')}</p>`
    + `<div class="lc-pied"><button type="button" class="btn sec" data-action="lecture-rejouer">${tr`Relire`}</button>`
    + `<button type="button" class="btn prim" data-action="lecture-quitter">${tr`Retour au district`}</button></div></section>`;
}

export function htmlLecture(r: EcranLecture): string {
  const e = r.etat;
  if (r.intro) return `<div class="ecran lecture"><div class="lc-page">${intro(e)}</div></div>`;
  const l = liens(e);
  const allumes = l.filter(Boolean).length;
  let h = `<div class="ecran lecture"><div class="lc-page">`
    + `<header class="lc-tete"><div><span class="surtitre">${e.def.surtitre}</span><h1>${e.def.titre}</h1></div>`
    + `<button type="button" class="btn sec petit" data-action="lecture-quitter">${tr`Quitter`}</button></header>`
    + `<p class="lc-aide">${e.choisi !== null ? tr('Touche un autre moment pour échanger, un fragment pour le mettre à sa place, ou le même moment pour le retirer.') : tr('Touche un fragment pour le poser sur le fil. Touche un moment du fil pour le déplacer.')}</p>`
    + `<section class="lc-fil" aria-label="${tr`Le fil du souvenir`}">`
    + `<p class="lc-compteur">${tr`Liens allumés : ${allumes} sur ${l.length}`}</p>`;
  e.fil.forEach((id, i) => {
    if (i > 0) {
      const m = l[i - 1];
      h += `<div class="lc-lien${m ? ' allume' : ''}" aria-hidden="true"><i></i>${m ? `<span>${NOMS_MOTIFS[m]}</span>` : ''}<i></i></div>`;
    }
    h += id ? fragment(fragmentDe(e, id), 'lecture-fil', String(i), `${e.choisi === i ? ' choisi' : ''} pose`)
      : `<button type="button" class="lc-vide${e.choisi !== null ? ' cible' : ''}" data-action="lecture-fil" data-id="${i}">${tr`Moment ${i + 1}`}</button>`;
  });
  h += `</section>`;
  if (e.dernierFaux) {
    h += `<section class="lc-faux" role="status"><h2>${tr`Un faux souvenir`}</h2>`
      + `<div class="lc-recit">${e.dernierFaux.recit.map((p) => `<p>${echap(p)}</p>`).join('')}</div>`
      + `<p class="lc-raison">${e.dernierFaux.raison}</p></section>`;
  }
  const res = reserve(e);
  // le plateau reste en bas de l'écran : les fragments défilent de côté, le bouton de lecture est toujours à portée
  h += `<section class="lc-plateau">`
    + (res.length ? `<h2>${tr`Fragments`} <small>${res.length}</small></h2><div class="lc-rangee">${res.map((f) => fragment(f, 'lecture-poser', f.id)).join('')}</div>` : '')
    + `<button type="button" class="btn prim large lc-lire" data-action="lecture-lire"${toutAllume(e) && e.issue === 'en-cours' && !e.dernierFaux ? '' : ' disabled'}>${tr`Lire le fil`}</button></section>`;
  h += `</div>`;
  if (e.issue === 'lu') h += fin(e);
  return h + `</div>`;
}
