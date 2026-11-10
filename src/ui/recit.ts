// L'écran de « Deux heures » (prototype du Récit d'Ilka, 10 novembre 2026) : Ilka dans l'eau qui monte, le souffle,
// le compte, la montée annoncée, la main de Doran et ses deux mains. Les règles sont dans core/recit-deux-heures.ts.

import { DEUX_HEURES, apercu, etoiles, heure, monteeAnnoncee, texteCarte, type CarteRecit, type EtatDeuxHeures } from '../core/recit-deux-heures';
import { portrait } from './art';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

export interface EcranRecit {
  etat: EtatDeuxHeures;
  /** l'écran d'avant l'épreuve (le récit qui y mène) */
  intro: boolean;
}

const R = DEUX_HEURES;

function carte(c: CarteRecit, e: EtatDeuxHeures, posee: boolean): string {
  const { nom, texte } = texteCarte(c);
  const suit = c.genre !== 'relancer' && c.frequence === e.compte + 1;
  const plein = !posee && e.posees.length >= R.mains && c.genre !== 'relancer';
  return `<button type="button" class="rc-carte ${c.genre}${posee ? ' rc-posee' : ''}${suit ? ' suit' : ''}" data-action="recit-carte" data-id="${c.id}"${plein ? ' aria-disabled="true"' : ''} aria-pressed="${posee}">`
    + (c.genre === 'relancer' ? `<span class="rc-lampe" aria-hidden="true"></span>` : `<b class="rc-freq" aria-label="${tr`Fréquence ${c.frequence}`}">${c.frequence}</b>`)
    + `<strong>${nom}</strong><small>${texte}</small>`
    + (suit ? `<em class="rc-suit">${tr`suit le compte`}</em>` : '')
    + `</button>`;
}

function jauge(n: number, max: number, classe: string, libelle: string): string {
  let h = `<div class="rc-jauge ${classe}" role="meter" aria-label="${libelle}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${n}">`;
  for (let i = 1; i <= max; i++) h += `<i class="${i <= n ? 'plein' : ''}"></i>`;
  return h + `</div>`;
}

function intro(): string {
  return `<section class="rc-recit">`
    + `<p class="surtitre">${tr`Récit d’Ilka · Chapitre 1 · Prototype`}</p>`
    + `<h1>${tr`Deux heures`}</h1>`
    + `<div class="rc-lignes">`
    + `<p>${tr`2111, les Hauts-Ponts. La passerelle a cédé. Ilka a quatorze ans, les jambes coincées sous le métal, et l’eau monte.`}</p>`
    + `<p>${tr`Doran a plongé. Il ne peut pas la dégager. Alors il lui tient la tête hors de l’eau, et ils attendent les pompes.`}</p>`
    + `<p>${tr`Ilka compte pour ne pas crier. Elle n’arrive jamais au bout de cent.`}</p>`
    + `</div>`
    + `<ul class="rc-regles">`
    + `<li>${tr`L’eau annonce sa montée à chaque tour. Si elle arrive en haut, c’est fini.`}</li>`
    + `<li>${tr`Doran a deux mains : deux cartes au plus par tour. Chaque carte jouée est perdue, et il n’en pioche qu’une par tour.`}</li>`
    + `<li>${tr`Une carte dont la Fréquence suit le compte d’Ilka (3 après 2) le prolonge et lui rend du souffle.`}</li>`
    + `<li>${tr`À 23 h 30, la station pourra relancer les pompes.`}</li>`
    + `</ul>`
    + `<div class="rc-pied"><button type="button" class="btn sec" data-action="recit-quitter">${tr`Plus tard`}</button>`
    + `<button type="button" class="btn prim" data-action="recit-commencer">${tr`Plonger`}</button></div>`
    + `</section>`;
}

function fin(e: EtatDeuxHeures): string {
  if (e.issue === 'victoire') {
    const n = etoiles(e);
    return `<div class="rc-voile"></div><section class="rc-fin victoire" role="dialog" aria-modal="true">`
      + `<p class="rc-etoiles" aria-label="${tr`${n} étoiles sur 3`}">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></p>`
      + `<div class="rc-lignes">`
      + `<p>${tr`Trois éclats vers la station. Là-bas, la mère d’Ilka relance, sans savoir pour qui.`}</p>`
      + `<p>${tr`Doran lui prend la main. « Quand ça repart, tu serres. Fort. »`}</p>`
      + `<p>${tr`Le courant arrache la passerelle vers le fond. L’eau descend. Ilka respire. Sous elle, il n’y a plus rien.`}</p>`
      + `</div>`
      + `<ul class="rc-bilan"><li class="${n >= 1 ? 'ok' : ''}">${tr`Tenir jusqu’à la relance`}</li>`
      + `<li class="${e.souffle >= R.etoileSouffle ? 'ok' : ''}">${tr`Finir avec au moins ${R.etoileSouffle} de souffle`}</li>`
      + `<li class="${e.compteMax >= R.etoileCompte ? 'ok' : ''}">${tr`Qu’Ilka compte jusqu’à ${R.etoileCompte} (elle est allée jusqu’à ${e.compteMax})`}</li></ul>`
      + `<div class="rc-pied"><button type="button" class="btn sec" data-action="recit-rejouer">${tr`Rejouer`}</button>`
      + `<button type="button" class="btn prim" data-action="recit-quitter">${tr`Retour au district`}</button></div></section>`;
  }
  const pourquoi = e.issue === 'noyade' ? tr('L’eau est passée au-dessus. Doran plonge, la remonte, mais il ne tiendra pas une deuxième fois.')
    : tr('Ilka panique et avale de l’eau. Doran n’arrive plus à la calmer.');
  return `<div class="rc-voile"></div><section class="rc-fin" role="dialog" aria-modal="true">`
    + `<h2>${tr`Pas comme ça`}</h2><p>${pourquoi}</p>`
    + `<p class="rc-conseil">${tr`Garde des cartes qui suivent le compte : il rend plus de souffle que « Respire avec moi ».`}</p>`
    + `<div class="rc-pied"><button type="button" class="btn sec" data-action="recit-quitter">${tr`Retour au district`}</button>`
    + `<button type="button" class="btn prim" data-action="recit-rejouer">${tr`Recommencer`}</button></div></section>`;
}

export function htmlRecit(r: EcranRecit): string {
  if (r.intro) return `<div class="ecran recit">${intro()}</div>`;
  const e = r.etat;
  const montee = monteeAnnoncee(e);
  const p = e.posees.length ? apercu(e) : null;
  const relance = e.main.some((c) => c.genre === 'relancer') || e.posees.some((c) => c.genre === 'relancer');
  const niveau = Math.min(100, (e.eau / R.eauMax) * 100);
  const ilka = portrait('ilka');
  let h = `<div class="ecran recit">`
    + `<header class="rc-tete"><div><span class="surtitre">${tr`Récit d’Ilka · Deux heures`}</span>`
    + `<h1><span class="rc-heure">${heure(e.tour)}</span> <small>${tr`tour ${Math.min(e.tour, R.tours)} sur ${R.tours}`}</small></h1></div>`
    + `<button type="button" class="btn sec petit" data-action="recit-quitter">${tr`Quitter`}</button></header>`
    + `<section class="rc-scene">`
    + `<div class="rc-ilka${e.eau >= R.levres ? ' levres' : ''}" style="--eau:${niveau}%">${ilka ? `<img src="${ilka}" alt="" draggable="false">` : ''}<span class="rc-eau" aria-hidden="true"></span>`
    + `<b class="rc-niveau">${tr`Eau ${e.eau} / ${R.eauMax}`}</b></div>`
    + `<div class="rc-etat">`
    + `<div class="rc-intention${relance ? ' relance' : ''}"><small>${tr`Ce tour`}</small><strong>${montee ? tr`L’eau monte de ${montee}` : tr('L’eau ne monte pas')}</strong>`
    + (e.calage ? `<em>${tr`calée : −1`}</em>` : '') + `</div>`
    + `<div class="rc-ligne"><small>${tr`Souffle d’Ilka`} <b>${Math.max(0, e.souffle)} / ${R.souffleMax}</b></small>${jauge(Math.max(0, e.souffle), R.souffleMax, 'souffle', tr`Souffle ${e.souffle} sur ${R.souffleMax}`)}</div>`
    + `<div class="rc-compte"><small>${tr`Ilka compte`}</small><strong>${e.compte || '…'}</strong><em>${tr`prochain : ${e.compte + 1}`}</em></div>`
    + `</div></section>`;
  if (e.journal.length) h += `<p class="rc-journal" role="status">${e.journal.map(echap).join(' ')}</p>`;
  if (relance) h += `<p class="rc-alerte">${tr`La station peut relancer. Tu sais ce que le courant emportera. Chaque tour d’attente coûte ${R.coutAttente} de souffle à Ilka.`}</p>`;
  h += `<section class="rc-table"><div class="rc-mains" aria-label="${tr`Les deux mains de Doran`}">`;
  for (let i = 0; i < R.mains; i++) {
    const c = e.posees[i];
    h += c ? carte(c, e, true) : `<div class="rc-vide">${tr`Main libre`}</div>`;
  }
  h += `</div>`
    + (p ? `<p class="rc-apercu">${tr`Après ce tour : eau ${p.eau}, souffle ${Math.max(0, p.souffle)}`}${p.eau >= R.eauMax || p.souffle <= 0 ? ` <b>${tr`Ilka ne tiendra pas.`}</b>` : ''}</p>` : `<p class="rc-apercu">${tr`Pose jusqu’à deux cartes, ou tiens sans rien jouer.`}</p>`)
    + `<div class="rc-main">${e.main.map((c) => carte(c, e, false)).join('') || `<p class="rc-vide-main">${tr`Doran n’a plus rien. Il tient.`}</p>`}</div>`
    + `<p class="rc-pioche">${tr`Pioche : ${e.pioche.length} carte${e.pioche.length > 1 ? 's' : ''}`}</p>`
    + `<button type="button" class="btn prim large rc-tenir" data-action="recit-tenir"${e.issue !== 'en-cours' ? ' disabled' : ''}>${e.posees.some((c) => c.genre === 'relancer') ? tr('Relancer les pompes') : tr('Tenir')}</button>`
    + `</section>`;
  if (e.issue !== 'en-cours') h += fin(e);
  return h + `</div>`;
}
