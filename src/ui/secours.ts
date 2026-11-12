// Secourir une famille (12 novembre 2026) : au Port, en tête du volet Missions. Remplace la feuille de l'écluse (les Basses
// du 7 novembre : batardeau, secteurs, dépôts), que Bryan ne comprenait pas : une mission en mer comme les autres.
// Une carte : la prochaine famille qui attend, le Porteur qu'on lui envoie, ou l'équipe déjà partie.
// Les règles sont dans src/core/partie/basses.ts, les lieux dans src/core/digue.ts.

import { porteurDef } from '../core/donnees';
import { lieuBassesDef, type LieuBasses, type SecteurBasses } from '../core/digue';
import { FAMILLES_DISTRICT } from '../core/familles';
import { flancBasses, planchEmpreintes } from './art';
import { BASSES, bassesDe, bassesOuvertes, famillesDesBasses, libresPourBasses, lieuFait, porteursPresents, prochainSecours, raisonHorsContrat, secteurSuivant, type Jeu } from '../core/jeu';
import { NOM_LIGNEE, avatar, decompte, tuilePorteur, jaugeTemps, type EcranDistrict } from './coquille';
import { ICO, icone } from './icones';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

/** Les Porteurs qu'on peut envoyer chercher la famille */
function choixPorteur(j: Jeu): string {
  const libres = libresPourBasses(j);
  const autres = porteursPresents(j).filter((p) => raisonHorsContrat(j, p));
  const escouade = new Set(j.escouade ?? []);
  // les Porteurs de l'escouade en dernier : partis, ils ne peuvent plus descendre
  libres.sort((a, b) => Number(escouade.has(a)) - Number(escouade.has(b)));
  // en tuiles portrait (12 novembre 2026, refonte des fiches) : on touche celui qu'on envoie
  return `<div class="bs-choix"><div class="tb-cands">`
    + libres.map((p) => tuilePorteur(p, { action: 'basses-envoyer', data: { id: p }, aria: tr`Envoyer ${echap(porteurDef(p).nom)}`,
      badge: escouade.has(p) ? `<span class="tb-marque">${tr`Escouade`}</span>` : '', bas: `<span class="tb-eff">${NOM_LIGNEE[porteurDef(p).lignee]}</span><span class="tb-action">${tr`Envoyer`}</span>` })).join('')
    + autres.map((p) => tuilePorteur(p, { indispo: true, bas: `<small class="tb-raison">${echap(raisonHorsContrat(j, p)!)}</small>` })).join('')
    + `</div></div>`;
}

/** La main d'une famille sur le Mur des empreintes (planche 8 × 6, dans l'ordre des familles) */
function main(famille: string): string {
  const k = Math.max(0, FAMILLES_DISTRICT.findIndex((f) => f.id === famille));
  return `<i class="mur-main" style="--x:${(k % 8) * (100 / 7)}%;--y:${Math.floor(k / 8) * 20}%" aria-hidden="true"></i>`;
}

/** Le quartier noyé en cours : ses quatre familles, la main éclairée quand elle est rentrée, la prochaine en or */
function mainsDuSecteur(j: Jeu, s: SecteurBasses, prochaine: string | null): string {
  const faites = s.lieux.filter((l) => lieuFait(j, l.id)).length;
  return `<div class="sc-mains" aria-label="${tr`${echap(s.nom)} : ${faites} familles secourues sur ${s.lieux.length}`}"><span class="sc-secteur">${echap(s.nom)}<small>${faites} / ${s.lieux.length}</small></span><ol>`
    + s.lieux.map((l) => `<li class="${lieuFait(j, l.id) ? 'faite' : l.id === prochaine ? 'prochaine' : ''}">${main(l.famille)}</li>`).join('')
    + `</ol></div>`;
}

/** Le lieu peint : sa hauteur sur le flanc de la digue (Lavoirs en haut, Palier tout en bas) cadre l'image des Basses */
const vue = (l: LieuBasses) => `<span class="sc-vue" style="--h:${Math.round(l.hauteur * 100)}%" aria-hidden="true"></span>`;

/** La carte des secours, en tête des missions en mer (vide tant que les secours ne partent pas, ou quand tout le monde est rentré) */
export function blocSecours(e: EcranDistrict): string {
  const j = e.j;
  if (!bassesOuvertes(j)) return '';
  const { faites, total } = famillesDesBasses(j);
  const x = bassesDe(j).expedition;
  const tete = `<h3 class="titre-bloc sc-titre">${ICO.porteurs}${tr`Famille à secourir`}<b class="mur-compte">${faites} / ${total}</b></h3>`;
  // la planche des mains et le flanc peint, une fois pour tout le bloc (12 novembre 2026 : la carte devient une image)
  const decor = `style="--planche:url(${planchEmpreintes});--flanc:url(${flancBasses})"`;
  if (x) {
    const lieu = lieuBassesDef(x.lieu)!;
    return `<section class="sc-bloc" ${decor}>${tete}<div class="sc-carte en-mer">${vue(lieu)}`
      + `<span class="sc-legende"><small>${tr`En mer · ${decompte(x.fin, e.now, tr('retour dans '))}`}</small><strong>${echap(lieu.nom)}</strong></span>`
      + `<div class="bs-expe">${avatar(x.porteur, 44)}<span><strong>${tr`${echap(porteurDef(x.porteur).nom)} est parti secourir une famille`}</strong>`
      + `<span class="jauge">${jaugeTemps(x.debut, x.fin, e.now)}</span></span></div></div></section>`;
  }
  const s = prochainSecours(j);
  if (!s) {
    const suite = secteurSuivant(j);
    // tout le flanc est vide : plus rien à montrer
    if (!suite) return '';
    return `<section class="sc-bloc" ${decor}>${tete}<p class="sc-note">${tr`Toutes les familles à portée de barque sont rentrées. D’autres attendent plus bas sur le flanc de la digue : vaincs le gardien de la Strate −${suite.strate}.`}</p></section>`;
  }
  const ouvert = e.bassesLieu === s.lieu.id;
  // ce que la barque rapporte, en pastilles : la durée, la famille (sa main), du minerai et de l'XP
  const gains = `<span class="sc-gains">`
    + `<span class="sc-gain">${ICO.chrono}${tr`${BASSES.heures} h`}</span>`
    + `<span class="sc-gain famille">${main(s.lieu.famille)}${tr`la famille`}</span>`
    + `<span class="sc-gain">${icone('composants')}${tr`minerai`}</span>`
    + `<span class="sc-gain">${ICO.monter}${tr`XP`}</span></span>`;
  return `<section class="sc-bloc" ${decor}>${tete}${mainsDuSecteur(j, s.secteur, s.lieu.id)}`
    + `<div class="bs-lieu sc-carte${ouvert ? ' ouvert' : ''}">`
    + `<button type="button" class="sc-lieu" data-action="basses-lieu" data-id="${s.lieu.id}" aria-expanded="${ouvert}">${vue(s.lieu)}`
    + `<span class="sc-legende"><small>${tr`${echap(s.secteur.nom)} · flanc de la digue`}</small><strong>${echap(s.lieu.nom)}</strong></span>`
    + gains
    + `<span class="sc-envoyer">${ICO.porteurs}${ouvert ? tr('Choisis qui y va') : tr('Envoyer un Porteur')}</span></button>`
    + (ouvert ? choixPorteur(j) : '')
    + `</div></section>`;
}
