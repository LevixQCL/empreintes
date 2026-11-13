// L'Exode, sur la digue (10 novembre 2026) : la feuille du grand projet du district, une fois le fond atteint.
// En haut, ceux qui partent avec toi (le compteur qui grandit à chaque étape) ; puis le chantier en cours, son étape
// (à lancer, ou qui avance toute seule) ; puis les cinq chantiers, du Registre au Passage. Ensuite, les convois.
// Les règles sont dans src/core/partie/exode.ts.

import { CHANTIERS_EXODE, ETAPES_EXODE, EXODE, FLECHE, avancementExode, etapeExode, exodeOuvert, raisonExode, sommetTenu, type Jeu } from '../core/jeu';
import { decompte, jaugeTemps, prix, type EcranDistrict } from './coquille';
import { ICO, perle } from './icones';
import { echap, texteReplie } from './outils';
import { bloc, cle, etape, replie } from './presentation';
import { t as tr, locale } from '../core/i18n';

const ent = (n: number) => Math.round(n).toLocaleString(locale());
const ROMAIN = ['I', 'II', 'III', 'IV', 'V'];

/** Ceux qui partent avec toi : le compteur du district, et les familles des cuvettes voisines une fois les convois lancés */
function compteur(j: Jeu): string {
  const a = avancementExode(j);
  const part = Math.round((a.habitants / a.habitantsMax) * 100);
  return `<section class="xo-compteur" aria-label="${tr`Ceux qui partent avec toi : ${a.habitants} habitants sur ${a.habitantsMax}`}">`
    + `<span class="surtitre">${ICO.porteurs}${tr`Ceux qui partent avec toi`}</span>`
    + `<p class="xo-nombre"><b>${ent(a.habitants)}</b><small>${tr`sur ${ent(a.habitantsMax)} habitants`}</small></p>`
    + `<span class="xo-barre" aria-hidden="true"><i style="width:${part}%"></i></span>`
    + (a.familles ? `<p class="xo-voisins">${ICO.monter}<span>${tr`et ${a.familles} familles des cuvettes voisines, en ${a.convois} convoi${a.convois > 1 ? 's' : ''}`}</span></p>` : '')
    + `</section>`;
}

/** Les dix étapes d'un chantier, en crans */
const crans = (faits: number, enCours: boolean) => `<span class="xo-crans" aria-hidden="true">${Array.from({ length: EXODE.etapes }, (_, k) =>
  `<i class="${k < faits ? 'fait' : k === faits && enCours ? 'cours' : ''}"></i>`).join('')}</span>`;

/** Le chantier en cours : son étape qui avance, ou celle qu'on peut lancer */
function enCours(e: EcranDistrict): string {
  const j = e.j;
  const a = avancementExode(j);
  const x = j.exode;
  const raison = raisonExode(j);
  const assezC = j.energie >= a.cout.cristaux, assezE = j.eclats >= a.cout.eclats;
  const titre = a.fini ? tr('Les convois') : a.def.nom;
  const texte = a.fini ? tr`Ton district est monté sur l’île. Les Pontons servent maintenant aux cuvettes voisines : chaque convoi fait passer ${EXODE.convoi.familles} familles de plus.` : a.def.texte;
  let h = `<section class="fb-bloc xo-chantier"><header><span class="surtitre">${a.fini ? tr`APRÈS LE PASSAGE` : tr`CHANTIER ${ROMAIN[a.chantier]} SUR ${ROMAIN[CHANTIERS_EXODE.length - 1]}`}</span><h3>${echap(titre)}</h3></header>`
    + `<p class="xo-texte">${echap(texte)}</p>`;
  if (!a.fini) h += `<div class="xo-etapes">${crans(a.dans, a.enCours)}<b>${tr`Étape ${Math.min(EXODE.etapes, a.dans + 1)} sur ${EXODE.etapes}`}</b></div>`;
  if (a.enCours && x?.fin !== undefined) {
    h += `<div class="xo-avance"><strong>${a.fini ? tr('Un convoi se prépare aux Pontons') : tr('L’étape avance')}</strong>`
      + `<small>${decompte(x.fin, e.now, tr('encore '))}${tr` · continue même jeu fermé`}</small>`
      + `<span class="jauge">${jaugeTemps(x.debut ?? x.fin - a.cout.heures * 3_600_000, x.fin, e.now)}</span></div>`;
  } else {
    // seul un vrai blocage se dit en phrase : les ressources manquantes se lisent déjà en rouge dans le prix
    const bloque = raison && (assezC && assezE || (!a.fini && a.chantier === CHANTIERS_EXODE.length - 1 && !sommetTenu(j)));
    h += `<div class="xo-lancer"><span class="xo-prix">${prix('energie', a.cout.cristaux, assezC)}${prix('eclats', a.cout.eclats, assezE)}<span class="xo-duree">${ICO.chrono}${a.cout.heures} h</span></span>`
      + `<button type="button" class="btn prim" data-action="exode-lancer"${raison ? ' disabled' : ''}>${ICO.marteau}${a.fini ? tr`Lancer un convoi` : tr`Lancer l’étape`}</button></div>`
      + (bloque ? `<p class="xo-raison">${ICO.verrou}<span>${echap(raison!)}</span></p>` : '');
  }
  return h + `</section>`;
}

/** Les cinq chantiers, du premier au dernier */
function liste(j: Jeu): string {
  const a = avancementExode(j);
  const faites = j.exode?.etape ?? 0;
  return `<h3 class="titre-bloc">${ICO.strate}${tr`Les cinq chantiers`}<b class="mur-compte">${Math.min(ETAPES_EXODE, faites)} / ${ETAPES_EXODE}</b></h3><ol class="xo-liste">`
    + CHANTIERS_EXODE.map((c, k) => {
      const fait = faites >= (k + 1) * EXODE.etapes;
      const ici = !fait && k === a.chantier;
      const dans = fait ? EXODE.etapes : ici ? a.dans : 0;
      const etat = fait ? `${ICO.ok}${tr`Fini`}` : ici ? `${dans} / ${EXODE.etapes}` : k === CHANTIERS_EXODE.length - 1 && !sommetTenu(j) ? `${ICO.verrou}${tr`Sommet de la Flèche`}` : tr('À venir');
      return `<li class="${fait ? 'fait' : ici ? 'ici' : 'apres'}"><b class="xo-rang">${ROMAIN[k]}</b><span><strong>${echap(c.nom)}</strong><small>${echap(fait ? c.fini : c.texte)}</small>`
        + `<em>${perle('ico peinte xo-perle')}${fait ? tr('Perle de nacre reçue') : tr('Une Perle de nacre')}</em></span><i class="xo-etat">${etat}</i></li>`;
    }).join('') + `</ol>`;
}

/** Ce qu'est l'Exode : à la première visite, puis à la demande */
function presentation(premiere: boolean): string {
  const total = Array.from({ length: ETAPES_EXODE }, (_, i) => etapeExode(i)).reduce((n, x) => n + x.cristaux, 0);
  return `<div class="xo-presentation">`
    + `<p class="xo-accroche">${tr`La Clause de la Flèche dit que le district dont l’escouade tient le sommet, quand une île passe, y est reçu. Quelqu’un avait ajouté en marge : « Pas les nôtres. Tout le monde. »`}</p>`
    + bloc(ICO.porteurs, tr('Préparer tout le district'), tr('Tu sais maintenant ce qu’il y a au fond. Reste à faire monter les gens : tous, pas seulement une escouade.'), [
      cle(ICO.marteau, `${CHANTIERS_EXODE.length}`, tr('chantiers')),
      cle(ICO.porteurs, ent(ETAPES_EXODE * EXODE.habitantsParEtape), tr('habitants à préparer')),
      cle(perle('ico peinte xo-perle'), `${CHANTIERS_EXODE.length}`, tr('Perles de nacre')),
    ])
    + replie(tr('Comment ça marche'), `<ul class="fl-pr-etapes">`
      + etape(ICO.marteau, tr('Une étape à la fois'), tr`Chaque chantier compte ${EXODE.etapes} étapes. Une étape se paie en cristaux et en Éclats, puis avance toute seule, même jeu fermé.`)
      + etape(perle('ico peinte xo-perle'), tr('Un chantier fini'), tr('Il donne une Perle de nacre et une lettre d’Ysé, à lire dans les Chroniques.'))
      + etape(ICO.fleche, tr('Le Passage'), tr`Le dernier chantier demande le sommet de la Flèche (quai ${FLECHE.quais}) : elle donne le droit de passer, l’Exode prépare les gens.`)
      + etape(ICO.energie, tr('Rien ne presse'), tr`Rien ne se perd et rien ne s’abîme si tu ne joues pas. En tout, environ ${ent(total)} cristaux : un projet de plusieurs semaines.`)
      + `</ul>`, ICO.aide)
    + (premiere ? `<button type="button" class="btn prim large" data-action="exode-entrer">${ICO.marteau}${tr`Ouvrir le premier chantier`}</button>` : '') + `</div>`;
}

/** La feuille de l'Exode */
export function feuilleExode(e: EcranDistrict): string {
  if (!e.exode) return '';
  const j = e.j;
  const fermer = `<button type="button" class="btn-icone" data-action="exode" aria-label="${tr`Fermer`}">${ICO.fermer}</button>`;
  const tete = `<div class="voile-feuille" data-action="exode" aria-hidden="true"></div><section class="feuille bs-feuille xo-feuille" role="dialog" aria-modal="true" aria-labelledby="xo-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`LE PROJET DU DISTRICT`}</span><h2 id="xo-titre">${tr`L’Exode`}</h2></div>${fermer}</header><div class="feuille-corps">`;
  if (!exodeOuvert(j)) return tete + presentation(false) + `<p class="xo-raison">${ICO.verrou}<span>${echap(raisonExode(j) ?? '')}</span></p></div></section>`;
  if (!j.exode?.vu || e.exodeAide) return tete + presentation(!j.exode?.vu)
    + (e.exodeAide && j.exode?.vu ? `<button type="button" class="btn sec large" data-action="exode-aide">${ICO.retour}${tr`Retour à l’Exode`}</button>` : '') + `</div></section>`;
  return tete
    + `<button type="button" class="lien bs-aide" data-action="exode-aide">${ICO.aide}${tr`Comment marche l’Exode`}</button>`
    + texteReplie(tr('Le fond a parlé, et l’eau ne s’arrêtera pas. Les îles passent encore au-dessus de la Flèche : le district se prépare à y monter en entier, famille après famille.'), 'exode', 'res-resume')
    + compteur(j) + enCours(e) + liste(j)
    + `</div></section>`;
}
