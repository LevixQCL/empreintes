// Secourir une famille (12 novembre 2026) : au Port, en tête du volet Missions. Remplace la feuille de l'écluse (les Basses
// du 7 novembre : batardeau, secteurs, dépôts), que Bryan ne comprenait pas : une mission en mer comme les autres.
// Une carte : la prochaine famille qui attend, le Porteur qu'on lui envoie, ou l'équipe déjà partie.
// Les règles sont dans src/core/partie/basses.ts, les lieux dans src/core/digue.ts.

import { porteurDef } from '../core/donnees';
import { lieuBassesDef } from '../core/digue';
import { BASSES, bassesDe, bassesOuvertes, famillesDesBasses, libresPourBasses, porteursPresents, prochainSecours, raisonHorsContrat, secteurSuivant, type Jeu } from '../core/jeu';
import { NOM_LIGNEE, avatar, decompte, jaugeTemps, type EcranDistrict } from './coquille';
import { ICO } from './icones';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

/** Les Porteurs qu'on peut envoyer chercher la famille */
function choixPorteur(j: Jeu): string {
  const libres = libresPourBasses(j);
  const autres = porteursPresents(j).filter((p) => raisonHorsContrat(j, p));
  const escouade = new Set(j.escouade ?? []);
  // les Porteurs de l'escouade en dernier : partis, ils ne peuvent plus descendre
  libres.sort((a, b) => Number(escouade.has(a)) - Number(escouade.has(b)));
  return `<div class="bs-choix"><ul>`
    + libres.map((p) => `<li><button type="button" class="mr-cand" data-action="basses-envoyer" data-id="${p}">${avatar(p, 32)}<span><b>${echap(porteurDef(p).nom)}</b><small>${NOM_LIGNEE[porteurDef(p).lignee]}${escouade.has(p) ? tr(' · dans ton escouade') : ''}</small></span><em>${tr`Envoyer`}</em></button></li>`).join('')
    + autres.map((p) => `<li><span class="mr-cand indispo">${avatar(p, 32)}<span><b>${echap(porteurDef(p).nom)}</b><small>${echap(raisonHorsContrat(j, p)!)}</small></span></span></li>`).join('')
    + `</ul></div>`;
}

/** La carte des secours, en tête des missions en mer (vide tant que les secours ne partent pas, ou quand tout le monde est rentré) */
export function blocSecours(e: EcranDistrict): string {
  const j = e.j;
  if (!bassesOuvertes(j)) return '';
  const { faites, total } = famillesDesBasses(j);
  const x = bassesDe(j).expedition;
  const tete = `<h3 class="titre-bloc sc-titre">${ICO.porteurs}${tr`Famille à secourir`}<b class="mur-compte">${faites} / ${total}</b></h3>`;
  if (x) {
    const lieu = lieuBassesDef(x.lieu)!;
    return `<section class="sc-bloc">${tete}<div class="bs-expe">${avatar(x.porteur, 44)}<span><strong>${tr`${echap(porteurDef(x.porteur).nom)} est parti secourir une famille`}</strong>`
      + `<small>${echap(lieu.nom)} · ${decompte(x.fin, e.now, tr('retour dans '))}</small><span class="jauge">${jaugeTemps(x.debut, x.fin, e.now)}</span></span></div></section>`;
  }
  const s = prochainSecours(j);
  if (!s) {
    const suite = secteurSuivant(j);
    // tout le flanc est vide : plus rien à montrer
    if (!suite) return '';
    return `<section class="sc-bloc">${tete}<p class="sc-note">${tr`Toutes les familles à portée de barque sont rentrées. D’autres attendent plus bas sur le flanc de la digue : vaincs le gardien de la Strate −${suite.strate}.`}</p></section>`;
  }
  const ouvert = e.bassesLieu === s.lieu.id;
  return `<section class="sc-bloc"><div class="bs-lieu${ouvert ? ' ouvert' : ''}">${tete}`
    + `<button type="button" class="bs-lieu-btn" data-action="basses-lieu" data-id="${s.lieu.id}" aria-expanded="${ouvert}">`
    + `<b class="bs-silhouette" aria-hidden="true">?</b><span><strong>${echap(s.lieu.nom)}</strong><small>${tr`${echap(s.secteur.nom)} · ${BASSES.heures} h · la famille, du minerai et de l’XP`}</small></span>`
    + `<em>${ICO.porteurs}${tr`Envoyer`}</em></button>`
    + (ouvert ? choixPorteur(j) : `<p class="sc-note">${tr`Derrière la digue, des familles vivent encore dans les quartiers noyés. Un Porteur libre va en chercher une et la ramène au district : elle te suit désormais.`}</p>`)
    + `</div></section>`;
}
