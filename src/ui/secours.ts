// Secourir une famille (12 novembre 2026) : au Port, en tête du volet Missions. Remplace la feuille de l'écluse (les Basses
// du 7 novembre : batardeau, secteurs, dépôts), que Bryan ne comprenait pas : une mission en mer comme les autres.
// Une carte : la prochaine famille qui attend, le Porteur qu'on lui envoie, ou l'équipe déjà partie.
// Les règles sont dans src/core/partie/basses.ts, les lieux dans src/core/digue.ts.

import { porteurDef } from '../core/donnees';
import { lieuBassesDef, type LieuBasses, type SecteurBasses } from '../core/digue';
import { FAMILLES_DISTRICT } from '../core/familles';
import { flancBasses, planchEmpreintes } from './art';
import { BASSES, bassesDe, bassesOuvertes, famillesDesBasses, libresPourBasses, lieuFait, porteursPresents, prochainSecours, raisonHorsContrat, secteurSuivant, type Jeu } from '../core/jeu';
import { NOM_LIGNEE, avatar, choixConseille, decompte, tuilePorteur, jaugeTemps, type EcranDistrict } from './coquille';
import { ICO, icone } from './icones';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

/** Les Porteurs qu'on peut envoyer chercher la famille */
function choixPorteur(j: Jeu, e: EcranDistrict): string {
  const libres = libresPourBasses(j);
  const autres = porteursPresents(j).filter((p) => raisonHorsContrat(j, p));
  const escouade = new Set(j.escouade ?? []);
  // les Porteurs de l'escouade en dernier : partis, ils ne peuvent plus descendre
  libres.sort((a, b) => Number(escouade.has(a)) - Number(escouade.has(b)));
  // le plus indiqué en une ligne, les autres sur demande (12 novembre 2026, Bryan : la grille entière était trop lourde)
  const [premier, ...reste] = libres;
  const autresH = reste.map((p) => tuilePorteur(p, { action: 'basses-envoyer', data: { id: p }, aria: tr`Envoyer ${echap(porteurDef(p).nom)}`,
    badge: escouade.has(p) ? `<span class="tb-marque">${tr`Escouade`}</span>` : '', bas: `<span class="tb-eff">${NOM_LIGNEE[porteurDef(p).lignee]}</span>` })).join('')
    + autres.map((p) => tuilePorteur(p, { indispo: true, bas: `<small class="tb-raison">${echap(raisonHorsContrat(j, p)!)}</small>` })).join('');
  if (!premier) return `<div class="bs-choix"><div class="tb-cands">${autresH}</div></div>`;
  return `<div class="bs-choix">` + choixConseille({ id: premier, action: 'basses-envoyer', info: `${NOM_LIGNEE[porteurDef(premier).lignee]}${escouade.has(premier) ? tr(' · dans ton escouade') : ''}`,
    bouton: tr`Envoyer`, autres: autresH, nAutres: reste.length + autres.length, tous: !!e.choixTous }) + `</div>`;
}

/** La main d'une famille sur le Mur des empreintes (planche 8 × 6, dans l'ordre des familles) */
function main(famille: string): string {
  const k = Math.max(0, FAMILLES_DISTRICT.findIndex((f) => f.id === famille));
  return `<i class="mur-main" style="--x:${(k % 8) * (100 / 7)}%;--y:${Math.floor(k / 8) * 20}%" aria-hidden="true"></i>`;
}

/** Le quartier noyé en cours : ses familles en petites mains, éclairées quand elles sont rentrées, la prochaine en or */
function mainsDuSecteur(j: Jeu, s: SecteurBasses, prochaine: string | null): string {
  const faites = s.lieux.filter((l) => lieuFait(j, l.id)).length;
  return `<span class="sc-mains" role="img" aria-label="${tr`${echap(s.nom)} : ${faites} familles secourues sur ${s.lieux.length}`}">`
    + s.lieux.map((l) => `<i class="${lieuFait(j, l.id) ? 'faite' : l.id === prochaine ? 'prochaine' : ''}">${main(l.famille)}</i>`).join('')
    + `</span>`;
}

/** Le lieu peint : sa hauteur sur le flanc de la digue (Lavoirs en haut, Palier tout en bas) cadre l'image des Basses */
const vue = (l: LieuBasses) => `<span class="sc-vue" style="--h:${Math.round(l.hauteur * 100)}%" aria-hidden="true"></span>`;

/** La carte des secours, en tête des missions en mer (vide tant que les secours ne partent pas, ou quand tout le monde est rentré).
 *  14 novembre 2026 (retour de Luc : la grande carte cachait les destinations du jour, on croyait les missions bloquées) :
 *  un bandeau peint d'une ligne, la main de la famille à gauche, le bouton d'or à droite ; le choix du Porteur se déplie dessous. */
export function blocSecours(e: EcranDistrict): string {
  const j = e.j;
  if (!bassesOuvertes(j)) return '';
  const { faites, total } = famillesDesBasses(j);
  const x = bassesDe(j).expedition;
  const compte = `<span class="sc-sur">${ICO.porteurs}${tr`Famille à secourir`}<b>${faites} / ${total}</b></span>`;
  const decor = `style="--planche:url(${planchEmpreintes});--flanc:url(${flancBasses})"`;
  if (x) {
    const lieu = lieuBassesDef(x.lieu)!;
    return `<section class="sc-bloc" ${decor} aria-label="${tr`Famille à secourir`}"><div class="sc-carte en-mer">${vue(lieu)}`
      + `<span class="sc-tete">${avatar(x.porteur, 48)}</span>`
      + `<span class="sc-texte">${compte}<strong>${echap(lieu.nom)}</strong>`
      + `<small class="sc-meta">${tr`${echap(porteurDef(x.porteur).nom)} est en mer · ${decompte(x.fin, e.now, tr('retour dans '))}`}</small>`
      + `<span class="jauge">${jaugeTemps(x.debut, x.fin, e.now)}</span></span></div></section>`;
  }
  const s = prochainSecours(j);
  if (!s) {
    const suite = secteurSuivant(j);
    if (!suite) return '';
    return `<section class="sc-bloc sc-attente" ${decor}><p class="sc-note">${compte}<span>${tr`Toutes les familles à portée de barque sont rentrées. D’autres attendent plus bas sur le flanc de la digue : vaincs le gardien de la Strate −${suite.strate}.`}</span></p></section>`;
  }
  const ouvert = e.bassesLieu === s.lieu.id;
  return `<section class="sc-bloc" ${decor} aria-label="${tr`Famille à secourir`}">`
    + `<div class="bs-lieu sc-carte${ouvert ? ' ouvert' : ''}">`
    + `<button type="button" class="sc-lieu" data-action="basses-lieu" data-id="${s.lieu.id}" aria-expanded="${ouvert}">${vue(s.lieu)}`
    + `<span class="sc-tete">${main(s.lieu.famille)}</span>`
    + `<span class="sc-texte">${compte}<strong>${echap(s.lieu.nom)}</strong>`
    + `<span class="sc-meta">${mainsDuSecteur(j, s.secteur, s.lieu.id)}<span class="sc-gain">${ICO.chrono}${tr`${BASSES.heures} h`}</span>`
    + `<span class="sc-gain">${icone('composants')}</span><span class="sc-gain">${ICO.monter}${tr`XP`}</span></span></span>`
    + `<span class="sc-envoyer">${ouvert ? ICO.fermer : ICO.porteurs}<b>${ouvert ? tr('Fermer') : tr('Envoyer')}</b></span></button>`
    + (ouvert ? choixPorteur(j, e) : '')
    + `</div></section>`;
}
