// La fiche du directeur (29 octobre 2026, Bryan : « le logo en haut, j'ai chaque fois envie de cliquer dessus »).
// Le cristal du rail (PC) et le médaillon de la barre du haut (téléphone) ouvrent toujours cette fiche ; un clic
// ne fait jamais qu'une chose. Ils s'allument quand une récompense importante attend (core/partie/attente.ts).
// Revue game design : en tête ce qui attend (récupéré un par un, chaque gain garde son animation), puis qui tu es,
// tes records personnels (jamais un rang qui baisse quand on ne joue pas), tes cartes marquantes et ton code.

import { valeurRegistre, profondeurDe, strateDe, gardienVaincu, zoneProfondeur } from '../core/classements';
import { multNiveau, NOMS_RARETE, RARETES } from '../core/collection';
import { moduleDef } from '../core/donnees';
import { aCosmetique, ARCHIVE, codeAffiche, colisAvantChoix, enAttente, flecheOuverte, appelDuCristal, objectifCourant, OBJECTIFS, palierCarte, NOMS_PALIER, porteursPresents, QUOTIDIENS, type Attente, type Jeu } from '../core/jeu';
import { faceCarte } from './carte';
import { ICO, baseIcones, icone, type Icone } from './icones';
import { echap } from './outils';
import type { EcranDistrict } from './coquille';

/** Le titre du joueur, écrit à un seul endroit (un renommage est en réflexion) */
export const TITRE_JOUEUR = 'Directeur';

const ent = (n: number) => Math.floor(n).toLocaleString('fr-BE');
const GEMME = `<img class="fj-gemme" src="${baseIcones}pastille.webp" alt="" aria-hidden="true">`;
const CRISTAL = './art/embleme-cristal.webp';

/** Le cristal s'allume ailleurs qu'au district : là, les panneaux et les bulles montrent déjà ce qui attend */
export const cristalAllume = (e: EcranDistrict): boolean => e.vue !== 'archipel' && appelDuCristal(e.j);

const libelle = (e: EcranDistrict) => `Ta fiche de ${TITRE_JOUEUR.toLowerCase()}${cristalAllume(e) ? ' : une récompense t’attend' : ''}`;

/** Le cristal en tête du rail, sur PC */
export function cristalRail(e: EcranDistrict): string {
  const allume = cristalAllume(e);
  return `<button type="button" class="nav-embleme${allume ? ' appelle' : ''}" data-action="fiche" aria-expanded="${!!e.fiche}" title="${echap(libelle(e))}" aria-label="${echap(libelle(e))}">`
    + `<img src="${CRISTAL}" alt="">${allume ? GEMME : ''}</button>`;
}

/**
 * Sur téléphone, le rail n'existe pas et la barre du haut n'a pas la place d'un médaillon (les chiffres se coupaient
 * dès 390 px) : la fiche s'ouvre depuis le haut du menu Plus, et l'onglet Plus porte la gemme quand une récompense attend.
 */
export function entreeFiche(e: EcranDistrict): string {
  if (!e.j.chambre) return '';
  const n = enAttente(e.j).length;
  const nom = e.j.directeur?.nom;
  return `<button type="button" class="fj-entree${cristalAllume(e) ? ' appelle' : ''}" data-action="fiche">`
    + `<span class="fj-sceau" aria-hidden="true"><img src="${CRISTAL}" alt="">${cristalAllume(e) ? GEMME : ''}</span>`
    + `<span class="fj-entree-txt"><span class="surtitre">TA FICHE DE ${echap(TITRE_JOUEUR.toUpperCase())}</span><strong>${nom ? echap(nom) : 'Sans pseudo'}</strong>`
    + `<small>${n ? `${n === 1 ? 'Une récompense t’attend' : `${n} récompenses t’attendent`}` : 'Tes records et tes cartes marquantes'}</small></span>${ICO.lancer}</button>`;
}

/** Une ligne de ce qui attend : ce que c'est, ce que ça donne, et le bouton qui le récupère */
function ligneAttente(j: Jeu, a: Attente): string {
  let ico: Icone = 'coffre', titre = '', detail = '', bouton = 'Récupérer';
  if (a.id === 'guide') {
    const o = objectifCourant(j)!;
    ico = 'objectif'; titre = `Objectif ${j.objectif + 1} sur ${OBJECTIFS.length} rempli`; detail = o.titre;
  } else if (a.id === 'jour') {
    ico = 'objectif'; titre = 'Objectif du jour rempli'; detail = `${QUOTIDIENS[j.quotidien.type].titre} · une carte ou 2 Éclats, au choix`;
  } else if (a.id === 'butin') {
    titre = 'Le Butin de la semaine est prêt'; detail = `Palier ${j.archive.aOuvrir} sur ${ARCHIVE.paliers.length} atteint`; bouton = 'Ouvrir';
  } else {
    const n = j.ravitaillement.reserve;
    const reste = colisAvantChoix(j);
    titre = `Ravitaillement du jour${n > 1 ? ` · ${n} colis` : ''}`;
    detail = reste === 1 ? 'Celui-ci contient une carte au choix' : `Composants et un doublon · carte au choix dans ${reste} colis`;
    bouton = 'Ouvrir';
  }
  return `<li class="fj-att${a.important ? ' important' : ''}"><span class="fj-att-ico">${icone(ico)}</span>`
    + `<span class="fj-att-txt"><strong>${echap(titre)}</strong><small>${echap(detail)}</small></span>`
    + `<button type="button" class="btn prim" data-action="fiche-prendre" data-id="${a.id}">${echap(bouton)}</button></li>`;
}

/** Les trois cartes qui racontent le mieux la partie : le plus de vécu d'abord, puis le métal le plus rare, puis le niveau */
function cartesMarquantes(j: Jeu): string[] {
  return Object.keys(j.collection)
    .map((cle) => ({ cle, p: palierCarte(j, cle), r: RARETES.indexOf(moduleDef(cle).rarete), n: j.collection[cle]!.niveau }))
    .sort((a, b) => b.p - a.p || b.r - a.r || b.n - a.n || a.cle.localeCompare(b.cle))
    .slice(0, 3).map((x) => x.cle);
}

/** Un record : sa valeur, ce qu'elle veut dire, et où le comparer */
const record = (ico: Icone, valeur: string, nom: string, sous: string, tableau: string | null) =>
  (tableau ? `<button type="button" class="fj-rec" data-action="classements" data-id="${tableau}" title="${echap(sous)}" aria-label="${echap(`${nom} : ${valeur}. ${sous}. Voir le classement`)}">` : `<div class="fj-rec" title="${echap(sous)}">`)
  + `${icone(ico)}<b>${valeur}</b><span>${echap(nom)}</span>`
  + (tableau ? `</button>` : `</div>`);

export function feuilleFiche(e: EcranDistrict): string {
  if (!e.fiche) return '';
  const j = e.j;
  const nom = j.directeur?.nom;
  const attentes = enAttente(j);
  const recruteur = aCosmetique(j, 'recruteur');

  let h = `<div class="voile-feuille" data-action="fiche" aria-hidden="true"></div><section class="feuille fiche-joueur" role="dialog" aria-modal="true" aria-labelledby="fj-titre">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete fj-tete">`
    + `<span class="fj-sceau" aria-hidden="true"><img src="${CRISTAL}" alt=""></span>`
    + `<div class="titres"><span class="surtitre">${echap(TITRE_JOUEUR.toUpperCase())} DU DISTRICT</span>`
    + `<h2 id="fj-titre">${nom ? echap(nom) : 'Sans pseudo'}</h2>`
    + (recruteur ? `<em class="insigne-recruteur">Recruteur</em>` : '')
    + (!nom && e.compte.actif ? `<button type="button" class="lien fj-pseudo" data-action="gt-nom">Choisir mon pseudo</button>` : '')
    + `</div><button type="button" class="btn-icone" data-action="fiche" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;

  // ---------- Ce qui attend ----------
  if (attentes.length) {
    h += `<section class="bloc fj-attentes" aria-label="Ce qui t’attend"><h3 class="titre-bloc">${icone('coffre')}Ce qui t’attend</h3><ul>${attentes.map((a) => ligneAttente(j, a)).join('')}</ul></section>`;
  }

  // ---------- Les records ----------
  const p = Math.max(j.palmares?.profondeur ?? 0, profondeurDe(j));
  const s = strateDe(p);
  const reg = Math.max(j.palmares?.registre ?? 0, valeurRegistre(j.collection).points);
  const jours = j.stats?.jours.length ?? 0;
  h += `<section class="bloc" aria-label="Tes records"><div class="fj-recs-tete"><h3 class="titre-bloc">${ICO.monter}Tes records</h3>`
    + `<button type="button" class="lien" data-action="classements" data-id="profondeur">Grand Tableau →</button></div><div class="fj-recs">`
    + record('strate', s ? `−${s}` : '—', 'Strate record', s ? `${zoneProfondeur(p)}${gardienVaincu(p) ? ' · gardien vaincu' : ''}` : 'Pas encore descendu', 'profondeur')
    + record('cartes', ent(reg), 'Registre', `${Object.keys(j.collection).length} cartes · ${porteursPresents(j).length} Porteurs`, 'registre')
    + (flecheOuverte(j) ? record('fleche', `${j.fleche?.record ?? 1}`, 'Étage Flèche', 'Ton meilleur étage', 'fleche') : '')
    + record('chrono', `${jours}`, jours > 1 ? 'Jours de jeu' : 'Jour de jeu', 'Depuis ton arrivée', null)
    + `</div></section>`;

  // ---------- Les cartes marquantes ----------
  const marquantes = cartesMarquantes(j);
  if (marquantes.length) {
    h += `<section class="bloc" aria-label="Tes cartes marquantes"><h3 class="titre-bloc">${icone('cartes')}Tes cartes marquantes</h3><div class="fj-cartes">`
      + marquantes.map((cle) => {
        const m = moduleDef(cle);
        const c = j.collection[cle]!;
        const pal = palierCarte(j, cle);
        return `<button type="button" class="fj-carte" data-action="cartes" data-carte="${cle}" aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, voir la collection">${faceCarte(m, c.niveau, multNiveau(m.id, c.niveau))}`
          + `<small>${pal ? `<b>${NOMS_PALIER[pal]}</b>` : NOMS_RARETE[m.rarete]}</small></button>`;
      }).join('')
      + `</div></section>`;
  }

  // ---------- Le parrainage ----------
  if (e.compte.actif && j.parrainage?.code) {
    h += `<button type="button" class="ligne-menu fj-code" data-action="recruter">${ICO.porteurs}<span><strong>Ton code : <b>${codeAffiche(j.parrainage.code)}</b></strong><small>Recrute tes amis : vous êtes récompensés tous les deux</small></span></button>`;
  }
  return h + `</div></section>`;
}
