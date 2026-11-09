// L'attente d'un duel lancé depuis le Cercle (3 novembre 2026) : le défi est parti, l'ami doit l'accepter.
// Le code du salon reste affiché : il peut aussi le taper lui-même.

import { DUEL } from '../core/duel';
import { ICO } from './icones';
import { echap } from './outils';
import { t } from '../core/i18n';

export function htmlAttenteDuel(o: { nom: string; code: string; mode: 'libre' | 'egal'; message: string }): string {
  return `<section class="duel-salon cr-attente-duel" aria-label="${t`Duel`}">`
    + `<header><span class="surtitre">${t`Cercle des quais · ${o.mode === 'egal' ? t('à armes égales') : 'vraies forces'}`}</span><h1>${t`Défi envoyé`}</h1>`
    + `<p class="aide">${t`${echap(o.nom)} le reçoit sur son Cercle. Le duel commence dès qu’il l’accepte : ${DUEL.chrono} secondes par tour, les deux chaînes partent en même temps.`}</p></header>`
    + `<div class="cr-attente-anim" aria-hidden="true"><i></i><i></i><i></i></div>`
    + (o.code ? `<div class="dl-code"><span class="label">${t`Code du duel`}</span><b>${echap(o.code)}</b><p class="aide">${t`Il peut aussi le rejoindre avec ce code.`}</p></div>` : '')
    + (o.message ? `<p class="dl-alerte">${echap(o.message)}</p>` : '')
    + `<button type="button" class="btn-sec" data-action="duel-retour">${ICO.retour}${t`Annuler le défi`}</button>`
    + `</section>`;
}
