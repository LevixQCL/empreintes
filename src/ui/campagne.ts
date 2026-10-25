// Les scènes de la campagne (campagne.ts) : l'illustration en plein écran, le récit, puis les répliques une par une,
// avec le portrait et le nom de qui parle. Un toucher fait parler le suivant ; « Passer » saute au bout.
// Elles se rejouent dans la Bibliothèque, onglet Campagne (même écran, avec « Retour »).

import { PERSONNAGES, SCENES, nomActe, repliquesDe, type ContexteCampagne, type ImageScene, type Scene } from '../core/campagne';
import { ENNEMIS, PORTEURS, ennemiDef, porteurDef } from '../core/donnees';
import { decorStrate, illustrationEnnemi, illustrationScene, portrait, portraitPersonnage } from './art';
import { NOM_LIGNEE } from './coquille';
import { ICO } from './icones';
import { echap } from './outils';
import { COULEUR } from './vue';

// URL absolue : elle sert aussi dans une variable CSS (le fond flouté sur PC), qui se résoudrait depuis la feuille de style
const intro = (id: string) => new URL(`intro/${id}.webp`, document.baseURI).href;
const imageDecor = (i: ImageScene): string =>
  'zone' in i ? decorStrate(i.zone) ?? intro('10-dessous') : 'ennemi' in i ? illustrationEnnemi(i.ennemi) ?? intro('10-dessous') : intro(i.intro);

/** l'illustration propre à la scène, sinon le décor qu'elle reprend */
const imageScene = (s: Scene): string => illustrationScene(s.id) ?? imageDecor(s.image);

/** Qui parle : son nom, ce qu'il est, sa couleur et son portrait (une initiale s'il n'en a pas) */
function orateur(qui: string): { nom: string; role: string; couleur: string; img: string | null } {
  if (PORTEURS.some((p) => p.id === qui)) {
    const d = porteurDef(qui);
    return { nom: d.nom, role: NOM_LIGNEE[d.lignee], couleur: COULEUR[d.lignee], img: portrait(qui) };
  }
  if (ENNEMIS.some((e) => e.id === qui)) {
    const d = ennemiDef(qui);
    return { nom: d.nom, role: 'Gardien', couleur: COULEUR[d.lignee], img: illustrationEnnemi(qui) };
  }
  const p = PERSONNAGES[qui];
  return { nom: p?.nom ?? qui, role: p?.role ?? '', couleur: p?.couleur ?? 'var(--ivory)', img: portraitPersonnage(qui) };
}

/**
 * Une scène, avec `n` répliques déjà dites (0 : seulement le récit).
 * `revoir` : rejouée depuis la Bibliothèque (le bouton du haut ramène à la liste au lieu de passer).
 */
export function htmlScene(s: Scene, c: ContexteCampagne, n: number, revoir = false): string {
  const repliques = repliquesDe(s, c);
  const dites = Math.min(n, repliques.length);
  const fini = dites >= repliques.length;
  const r = dites ? repliques[dites - 1]! : null;
  const o = r ? orateur(r.qui) : null;
  const img = imageScene(s);
  let h = `<div class="voile scene-voile" role="dialog" aria-modal="true" aria-labelledby="scene-titre" style="--sc-img:url(${img})">`
    + `<section class="scene-campagne${fini ? ' finie' : ''}" data-action="scene-suite" aria-label="${echap(s.titre)}">`
    + `<div class="sc-fond" aria-hidden="true"><img src="${img}" alt="" decoding="async"></div>`
    + `<header class="sc-haut"><div><span class="surtitre">${echap(s.sur)}</span><h1 id="scene-titre">${echap(s.titre)}</h1></div>`
    + (revoir
      ? `<button type="button" class="btn-sec sc-passer" data-action="scene-fin">${ICO.retour}Retour</button>`
      : fini ? '' : `<button type="button" class="btn-sec sc-passer" data-action="scene-fin">Passer</button>`)
    + `</header>`
    + `<p class="sc-recit${dites ? ' replie' : ''}">${echap(s.recit)}</p>`
    + `<div class="sc-espace"></div>`;
  if (r && o) {
    h += `<div class="sc-replique" style="--c:${o.couleur}" aria-live="polite" data-k="${dites}">`
      + `<span class="sc-portrait" aria-hidden="true">${o.img ? `<img src="${o.img}" alt="" decoding="async">` : `<b>${echap(o.nom.replace(/^(Capitaine|Dame) /, '').charAt(0))}</b>`}</span>`
      + `<div class="sc-paroles"><strong>${echap(o.nom)}${o.role ? `<small>${echap(o.role)}</small>` : ''}</strong><p>${echap(r.texte)}</p></div></div>`;
  }
  h += `<footer class="sc-bas"><span class="sc-points" aria-label="Réplique ${dites} sur ${repliques.length}">`
    + repliques.map((_, i) => `<i${i < dites ? ' class="vu"' : ''}></i>`).join('') + `</span>`
    + (fini
      ? `<button type="button" class="btn prim large sc-continuer" data-action="scene-fin">${ICO.ok}${revoir ? 'Fermer' : 'Continuer'}</button>`
      : `<span class="indice-bulle">${dites ? 'Touche l’écran pour la suite' : 'Touche l’écran pour les écouter'}</span>`)
    + `</footer></section></div>`;
  return h;
}

/** dans la liste, les scènes sont déjà rangées par acte : « II · STRATE −5 » devient « STRATE −5 » */
const sansActe = (sur: string) => sur.replace(/^[IV]+ · /, '');

/** L'onglet Campagne de la Bibliothèque : les scènes déjà jouées, à revoir ; les suivantes restent cachées */
export function htmlListeScenes(vues: readonly string[]): string {
  let h = `<p class="aide intro-ecran">Ton histoire, scène après scène. Touche une scène pour la revoir.</p>`;
  let acte = 0;
  for (const s of SCENES) {
    if (s.acte !== acte) {
      if (acte) h += `</div></section>`;
      acte = s.acte;
      h += `<section class="livre"><header class="livre-tete"><span class="surtitre">${echap(nomActe(s.acte).split(' · ')[0]!.toUpperCase())}</span><h2>${echap(nomActe(s.acte).split(' · ')[1] ?? nomActe(s.acte))}</h2></header><div class="sc-liste">`;
    }
    const vue = vues.includes(s.id);
    const img = `<img src="${imageScene(s)}" alt="" loading="lazy" decoding="async">`;
    h += vue
      ? `<button type="button" class="sc-tuile" data-action="scene-revoir" data-id="${s.id}">${img}<span><small>${echap(sansActe(s.sur))}</small><strong>${echap(s.titre)}</strong></span>${ICO.film}</button>`
      : `<div class="sc-tuile fermee" aria-disabled="true"><span class="sc-verrou" aria-hidden="true">${ICO.verrou}</span><span><small>${echap(sansActe(s.sur))}</small><strong>À vivre</strong></span></div>`;
  }
  return h + `</div></section>`;
}
