// Le Mur des empreintes (7 novembre 2026), dans la fiche « Ceux qui te suivent » (habitations, roue du haut).
// Les 48 familles du district : celles qui sont là montrent leur nom, les autres une silhouette (« 31 / 48 »).
// Toucher une famille ouvre son souvenir ; une famille peut le confier à une carte qui a atteint le palier Sillon
// (une ligne dans le journal de la carte, aucun effet en combat). Les règles : core/familles.ts, core/partie/vecu.ts.
// Ce fichier n'importe pas coquille.ts (coquille.ts l'importe) : pas de dépendance en boucle.

import { moduleDef } from '../core/donnees';
import { NOMS_RARETE } from '../core/collection';
import { FAMILLES_DISTRICT, familleDef, type FamilleDef } from '../core/familles';
import { lieuBassesDef, SECTEURS } from '../core/digue';
import { NOMS_PALIER, SOUVENIR, carteDuSouvenir, palierCarte, raisonSouvenir, rumeurVersFamille, type Jeu } from '../core/jeu';
import { ICO } from './icones';
import { echap } from './outils';
import { planchEmpreintes } from './art';
import type { Rarete } from '../core/types';

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « les Orlan » → « Orlan » ; « les Anciens du conseil » → « Anciens du conseil » */
const court = (f: FamilleDef) => (f.nom.startsWith('les ') ? f.nom.slice(4) : f.nom);

/** D'où vient une famille, en quelques mots */
function provenance(f: FamilleDef): string {
  if (f.arrivee === 'depart') return 'Là depuis ton arrivée';
  if (f.arrivee === 'quartier') return 'Venue par le bouche-à-oreille';
  const lieu = SECTEURS.flatMap((s) => s.lieux.map((l) => ({ s, l }))).find((x) => x.l.famille === f.id);
  return lieu ? `Ramenée des Basses · ${lieu.s.nom}` : 'Ramenée des Basses';
}

/** Une carte, lue « Nom (Métal) » */
function nomCarte(cle: string): string {
  const metal = cle.split('@')[1] as Rarete | undefined;
  return `${moduleDef(cle).nom}${metal ? ` (${NOMS_RARETE[metal]})` : ''}`;
}

/** Les cartes qui peuvent recevoir un souvenir : palier Sillon ou plus, sans souvenir */
const cartesDignes = (j: Jeu) => {
  const portees = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
  return Object.keys(j.collection).filter((cle) => !raisonSouvenir(j, cle))
    .sort((a, b) => Number(portees.has(b)) - Number(portees.has(a)) || palierCarte(j, b) - palierCarte(j, a));
};
/** Les cartes dignes montrées d'abord (celles que portent tes Porteurs en tête) ; le reste se déplie */
const MONTREES = 6;

/** Le Mur : la grille des 48 familles, et la famille ouverte */
export function blocMur(j: Jeu, ouverte: string | null | undefined): string {
  const la = new Set(j.foyers ?? []);
  const r = rumeurVersFamille(j);
  let h = `<section class="fb-bloc mur-empreintes" style="--planche:url(${planchEmpreintes})"><h3 class="titre-bloc">${ICO.mur}Le Mur des empreintes<b class="mur-compte">${la.size} / ${FAMILLES_DISTRICT.length}</b></h3>`
    + `<p class="fb-vide">Chaque famille qui te suit pose sa main sur le mur des habitations. Touche une famille pour lire son souvenir.</p>`
    + (r ? `<div class="mur-rumeur" aria-label="Bouche-à-oreille : ${r.points} sur ${r.seuil}"><span>On parle de toi au quartier</span><i style="--p:${Math.round((100 * r.points) / r.seuil)}%"></i><small>${r.points} / ${r.seuil} : une famille de plus</small></div>` : '')
    + `<ul class="mur-grille">`;
  FAMILLES_DISTRICT.forEach((f, k) => {
    const ici = la.has(f.id);
    // sa main sur le mur : peinte et éclairée si la famille est là, dans l'ombre sinon
    const main = `<i class="mur-main" style="--x:${(k % 8) * (100 / 7)}%;--y:${Math.floor(k / 8) * 20}%" aria-hidden="true"></i>`;
    const porte = ici && !!carteDuSouvenir(j, f.id);
    h += ici
      ? `<li><button type="button" class="mur-tuile ${f.arrivee}${ouverte === f.id ? ' ouverte' : ''}${porte ? ' gravee' : ''}" data-action="famille" data-id="${f.id}" aria-expanded="${ouverte === f.id}" aria-label="${echap(majuscule(f.nom))}${porte ? ', souvenir confié' : ''}">${main}<span>${echap(court(f))}</span></button></li>`
      : `<li><span class="mur-tuile vide" aria-label="Une famille qui ne te suit pas encore">${main}<span>${f.arrivee === 'basses' ? 'Basses' : 'Quartier'}</span></span></li>`;
  });
  h += `</ul>`;
  const f = ouverte ? familleDef(ouverte) : null;
  if (f && la.has(f.id)) h += ficheFamille(j, f);
  return h + `</section>`;
}

/** La famille ouverte : qui elle est, son souvenir, et la carte qui le porte (ou celles qui peuvent le recevoir) */
function ficheFamille(j: Jeu, f: FamilleDef): string {
  const carte = carteDuSouvenir(j, f.id);
  let h = `<article class="mur-fiche"><header>${(() => { const k = FAMILLES_DISTRICT.indexOf(f); return `<i class="mur-main" style="--x:${(k % 8) * (100 / 7)}%;--y:${Math.floor(k / 8) * 20}%" aria-hidden="true"></i>`; })()}<span><strong>${echap(majuscule(f.nom))}</strong><small>${echap(provenance(f))}</small></span>`
    + `<button type="button" class="btn-icone" data-action="famille" data-id="${f.id}" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<p class="mur-qui">${echap(f.qui)}</p><blockquote class="mur-souvenir">${echap(f.souvenir)}</blockquote>`;
  if (carte) {
    h += `<p class="mur-porte">${ICO.cartes}<span>Ce souvenir est gravé dans <b>${echap(nomCarte(carte))}</b>.</span></p>`;
  } else {
    const dignes = cartesDignes(j);
    h += `<h4 class="mur-titre">Confier ce souvenir à une carte</h4>`
      + `<p class="fb-note">Une seule carte, pour toujours : une ligne de plus dans son journal, rien de plus en combat. Seules les cartes au palier ${NOMS_PALIER[SOUVENIR.palier]} de leur empreinte ou plus en sont dignes.</p>`
      + (dignes.length
        ? (() => {
          const li = (cle: string) => `<li><button type="button" class="btn sec" data-action="souvenir-confier" data-id="${echap(cle)}">${ICO.cartes}${echap(nomCarte(cle))}<small>${NOMS_PALIER[palierCarte(j, cle)]}</small></button></li>`;
          const reste = dignes.slice(MONTREES);
          return `<ul class="mur-cartes">${dignes.slice(0, MONTREES).map(li).join('')}</ul>`
            + (reste.length ? `<details class="mur-plus"><summary>${reste.length} autre${reste.length > 1 ? 's' : ''} carte${reste.length > 1 ? 's' : ''} digne${reste.length > 1 ? 's' : ''}</summary><ul class="mur-cartes">${reste.map(li).join('')}</ul></details>` : '');
        })()
        : `<p class="fb-vide">Aucune de tes cartes n’a encore atteint le palier ${NOMS_PALIER[SOUVENIR.palier]}. Descends avec elles : le souvenir attendra.</p>`);
  }
  return h + `</article>`;
}

/** Le nom d'une famille ramenée des Basses, avec son lieu (rapport de mission) */
export const ligneBasses = (lieu: string, famille: string) => {
  const l = lieuBassesDef(lieu);
  const f = familleDef(famille);
  return l && f ? `${majuscule(f.nom)} · ${l.nom}` : '';
};
