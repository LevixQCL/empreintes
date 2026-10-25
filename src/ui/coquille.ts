// La coquille des écrans du district : barre de ressources en haut, navigation en bas, notifications, menu.
// Tout l'affichage du district passe par ici pour rester cohérent d'un écran à l'autre.

import { porteurDef } from '../core/donnees';
import { CHAPITRES, chapitreOuvert } from '../core/chroniques';
import { cartesNouvelles, porteursNouveaux, creuseursRequis, energieParHeure, logementCreuseurs, manquePourCreuser, objectifCourant, stockage, type Jeu } from '../core/jeu';
import type { Lignee } from '../core/types';
import { portrait } from './art';
import { ICO, icone, type Icone } from './icones';
import { feuilleNom } from './classements';
import { COULEUR, panneauCompte, type Compte } from './vue';
import { echap } from './outils';

export type Vue = 'archipel' | 'coupe' | 'escouade' | 'rencontre' | 'briefing' | 'accueil' | 'codex' | 'cartes' | 'porteurs' | 'classements';
/** filtre de la collection : une lignée, ou les cartes qui peuvent monter, ou celles que personne ne porte */
export type Filtre = 'tout' | Lignee | 'monter' | 'libres';

export interface EcranDistrict {
  j: Jeu;
  /** la feuille « Protège ta partie », proposée aux paliers tant que la partie n'est reliée à aucun compte */
  rappel?: boolean;
  vue: Vue;
  selection: import('../core/types').BatimentId | 'port' | 'labo' | null;
  escouade: string[];
  strateChoisie: number;
  message: string;
  compte: Compte;
  now: number;
  /** lignes du résumé « Pendant ton absence » (vide = rien à montrer) */
  retour: string[];
  /** menu « Plus » ouvert */
  menu: boolean;
  /** carte ouverte en détail dans l'écran Cartes (clé module@métal) */
  carte: string | null;
  /** Porteur dont on construit le deck (feuille « Les cartes de… »), ou null */
  deck: string | null;
  /** Porteur dont la fiche est ouverte (onglet Escouade, départ), ou null */
  porteur: string | null;
  /** lignée affichée dans l'écran Cartes */
  filtre: Filtre;
  /** Bibliothèque : onglet, chapitre ouvert, et écran où revenir */
  onglet: 'chroniques' | 'archives' | 'campagne';
  chapitre: string | null;
  retourBiblio: 'archipel' | 'coupe' | 'titre';
  /** rencontre : nombre de répliques affichées */
  bulles: number;
  /** scène de la campagne : nombre de répliques déjà dites ; et la scène rejouée depuis la Bibliothèque (campagne.ts) */
  scene?: number;
  revoir?: string | null;
  /** « Avant d'ouvrir » : écran d'explication affiché */
  etape: number;
  /** l'escouade part pour une fouille ciblée (et ce qu'elle cherche), ou pour une Épreuve de la semaine */
  fouille: import('../core/expedition').CibleFouille | null;
  epreuve: string | null;
  /** la fiche d'une ressource du haut est ouverte (22 octobre 2026) */
  ressource?: Ressource | null;
  /** onglet Escouade : le volet « Porteurs » (tous les Porteurs) est affiché au lieu de l’escouade */
  reserve?: boolean;
  /** onglet Escouade : la place de l'escouade (0 à 2) dont on choisit le Porteur, volet ouvert */
  place?: number | null;
  /** onglet Escouade : l'escouade affichée (0 à 2) ; par défaut, celle qui descend */
  vueEscouade?: number;
  /** le mode d'emploi des cartes est ouvert, sur cet onglet (guide.ts) */
  guide: import('./guide').OngletGuide | null;
  /** l'ordre des cartes (écran Cartes, cartes d'un Porteur), retenu sur l'appareil */
  tri?: import('../core/collection').TriCartes;
  /** sur téléphone, le panneau du district (objectif, confiance, Archive, marché) est replié (par défaut) */
  panneauReplie?: boolean;
  /** le Grand Tableau (classements.ts) et l'identifiant du compte connecté */
  grand?: import('./classements').GrandTableau;
  uid?: string | null;
}

export const ent = (n: number) => Math.floor(n).toLocaleString('fr-BE');
export const duree = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 86_400) return `${Math.floor(s / 86_400)} j ${Math.floor((s % 86_400) / 3600)} h`;
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
  return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`;
};

/**
 * Un compte à rebours que l'horloge du district (main.ts : majDecomptes) met à jour chaque seconde sans tout redessiner.
 * avant et apres font partie du même texte : la mise en page reste exactement celle d'un texte simple.
 */
export const decompte = (fin: number, now: number, avant = '', apres = '') =>
  `<span data-fin="${fin}"${avant ? ` data-avant="${avant}"` : ''}${apres ? ` data-apres="${apres}"` : ''}>${avant}${duree(fin - now)}${apres}</span>`;

/** Le remplissage d'une jauge de durée, mis à jour de la même façon */
export const jaugeTemps = (debut: number, fin: number, now: number) =>
  `<i data-debut="${debut}" data-fin="${fin}" style="width:${Math.min(1, (now - debut) / (fin - debut)) * 100}%"></i>`;

export const NOM_LIGNEE: Record<Lignee, string> = { tech: 'Augmenté', bio: 'Géné', reso: 'Résonant' };
export const NOM_LIGNEES: Record<Lignee, string> = { tech: 'Augmentés', bio: 'Génés', reso: 'Résonants' };

/**
 * Le portrait d'un Porteur : son illustration si elle existe, sinon son initiale sur un hexagone de sa lignée.
 * @param taille en pixels
 */
export function avatar(id: string, taille = 40, extra = ''): string {
  const d = porteurDef(id);
  const p = portrait(id);
  return `<span class="avatar${p ? '' : ' sans-portrait'}${extra ? ' ' + extra : ''}" style="--c:${COULEUR[d.lignee]};--t:${taille}px" aria-hidden="true">`
    + (p ? `<img src="${p}" alt="" decoding="async" loading="lazy">` : `<b>${echap(d.nom.charAt(0))}</b>`) + `</span>`;
}

/** Une ressource : icône, valeur ; en rouge si on n'en a pas assez */
export function prix(icone: Icone, v: number, assez = true, titre = ''): string {
  return `<span class="prix ${icone}${assez ? '' : ' manque'}"${titre ? ` title="${titre}"` : ''}>${ICO[icone]}${ent(v)}</span>`;
}

export function couts(j: Jeu, c: { energie?: number; composants?: number; eclats?: number }): string {
  return (c.energie ? prix('energie', c.energie, j.energie >= c.energie, 'énergie') : '')
    + (c.composants ? prix('composants', c.composants, j.composants >= c.composants, 'composants') : '')
    + (c.eclats ? prix('eclats', c.eclats, j.eclats >= c.eclats, 'Éclats') : '');
}

/** La barre des ressources, toujours en haut */
type Ressource = 'energie' | 'composants' | 'eclats' | 'strate';

function hud(j: Jeu, ouverte: Ressource | null = null): string {
  const max = stockage(j);
  const plein = j.energie >= max;
  const b = (r: Ressource, extra: string, label: string) =>
    `<button type="button" class="res ${r}${extra}" data-action="ressource" data-id="${r}" data-gain="${r}" aria-expanded="${ouverte === r}" aria-label="${label}">`;
  return `<header class="hud" aria-label="Ressources">`
    + b('energie', plein ? ' plein' : '', `Énergie : ${ent(j.energie)} sur ${ent(max)}. Détails`) + `${icone('energie')}<span class="v">${ent(j.energie)}</span>`
    + `<span class="jauge-res"><i style="width:${Math.min(100, (100 * j.energie) / Math.max(1, max))}%"></i></span><small>${plein ? 'plein' : `+${energieParHeure(j)}/h`}</small></button>`
    + b('composants', '', `Composants : ${ent(j.composants)}. Détails`) + `${icone('composants')}<span class="v">${ent(j.composants)}</span><small>comp.</small></button>`
    + b('eclats', '', `Éclats : ${ent(j.eclats)}. Détails`) + `${icone('eclats')}<span class="v">${ent(j.eclats)}</span><small>Éclats</small></button>`
    + b('strate', ' abysse', `Strate −${j.strate}. Détails`) + `${icone('strate')}<span class="v">−${j.strate}</span><small>Strate</small></button>`
    + `</header>`;
}

/** La fiche d'une ressource : ce que c'est, ce qu'on a, comment en gagner, à quoi elle sert */
function feuilleRessource(j: Jeu, r: Ressource | null | undefined): string {
  if (!r) return '';
  const max = stockage(j);
  const ligne = (ico: Icone, titre: string, texte: string) => `<li>${ICO[ico] ?? ''}<span><strong>${titre}</strong><small>${texte}</small></span></li>`;
  let surtitre = '', titre = '', resume = '', gagner: string[] = [], servir: string[] = [], etat = '';
  if (r === 'energie') {
    surtitre = 'RESSOURCE'; titre = 'L’énergie';
    resume = 'Le courant du district. Elle se produit toute seule, même quand tu ne joues pas, jusqu’à ce que le stockage soit plein.';
    etat = `<b>${ent(j.energie)}</b> / ${ent(max)}<small>${j.energie >= max ? 'Stockage plein : la production est perdue tant que tu ne dépenses pas' : `+${energieParHeure(j)} par heure`}</small>`;
    gagner = [ligne('boost', 'Le Générateur', 'Produit l’énergie chaque heure. Un Porteur posté dessus produit davantage.'),
      ligne('tour', 'La Tour du Noyau', 'Chaque niveau agrandit le stockage.'),
      ligne('cartes', 'Les premiers objectifs', 'Le premier en rapporte.')];
    servir = [ligne('marteau', 'Améliorer les bâtiments', 'C’est la dépense principale de chaque chantier.'),
      ligne('marteau', 'Faire tourner la Forge', 'Chaque carte refabriquée consomme de l’énergie, plus pour les métaux rares.'),
      ligne('monter', 'Entraîner un Porteur', 'À la Tour du Noyau, l’entraînement consomme de l’énergie chaque heure.'),
      ligne('porteurs', 'Équiper les missions', 'Vivres et lampes : un peu d’énergie au départ.')];
  } else if (r === 'composants') {
    surtitre = 'RESSOURCE'; titre = 'Les composants';
    resume = 'Les pièces récupérées dans les Strates : métal, mécanismes, cristaux brisés. On les rapporte des expéditions.';
    etat = `<b>${ent(j.composants)}</b><small>composants en réserve</small>`;
    gagner = [ligne('strate', 'Les expéditions', 'Chaque combat gagné, chaque cache et chaque salle d’archives en rapporte. Fuir en garde les trois quarts, une défaite la moitié.'),
      ligne('cristal', 'Les fouilles ciblées', 'Une descente courte qui peut viser les composants.'),
      ligne('cartes', 'Le ravitaillement du jour', 'Quelques composants chaque jour.'),
      ligne('porteurs', 'Les missions', 'Un Porteur envoyé dans une Strate vaincue en rapporte à son retour.'),
      ligne('recycler', 'Recycler des doublons', 'Chaque doublon recyclé rapporte quelques composants.'),
      ligne('coffre', 'L’Archive de la semaine', 'Chaque lundi, selon les paliers atteints.')];
    servir = [ligne('marteau', 'Améliorer les bâtiments', 'Avec l’énergie.'),
      ligne('cartes', 'Acheter au Comptoir', 'Des cartes précises, à prix fixe, renouvelées chaque jour.'),
      ligne('cartes', 'Monter une carte de niveau', 'Avec ses doublons.'),
      ligne('marteau', 'Refabriquer une carte à la Forge', 'De 25 composants (fer) à 1 250 (nacre).')];
  } else if (r === 'eclats') {
    surtitre = 'RESSOURCE RARE'; titre = 'Les Éclats';
    resume = 'Des fragments de cristal chargés d’empreintes. Rares, ils ne se trouvent qu’en profondeur ou en récompense.';
    etat = `<b>${ent(j.eclats)}</b><small>Éclats en réserve</small>`;
    gagner = [ligne('strate', 'Les gardiens', 'Chaque gardien vaincu en donne, davantage à partir de la Strate −5.'),
      ligne('coffre', 'Les caches et les rencontres', 'À partir de la Strate −3, une cache en cache parfois un.'),
      ligne('cristal', 'Les fouilles « Éclats » et les Archives de la semaine', 'Pour en gagner quand on bloque.')];
    servir = [ligne('marteau', 'Refabriquer les cartes rares', 'Argent, or et nacre en demandent à la Forge.'),
      ligne('cartes', 'Les cartes en argent du Comptoir', 'Elles coûtent aussi des Éclats.'),
      ligne('marteau', 'Les grands chantiers', 'Les derniers niveaux des bâtiments.')];
  } else {
    const manque = manquePourCreuser(j);
    surtitre = 'PROFONDEUR'; titre = `La Strate −${j.strate}`;
    resume = 'L’étage le plus profond que ton district a creusé sous la ville. Plus on descend, plus c’est ancien, dangereux et précieux.';
    etat = `<b>−${j.strate}</b><small>${j.frontVaincu ? (manque ? `Gardien vaincu : il manque ${[manque.creuseurs ? `${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}` : '', manque.noyau ? `${manque.noyau} niveau${manque.noyau > 1 ? 'x' : ''} de Tour du Noyau` : ''].filter(Boolean).join(' et ')} pour creuser plus bas` : 'Prête à être creusée plus bas') : `Bats son gardien pour pouvoir creuser l’étage suivant`}</small>`;
    gagner = [ligne('porte', 'Vaincre le gardien', `Le gardien de la Strate −${j.strate} garde l’accès à l’étage suivant.`),
      ligne('ouvrier', `Assez de creuseurs (${j.creuseurs ?? 0} / ${creuseursRequis(j.strate + 1)})`, `La Tour du Noyau en loge ${logementCreuseurs(j)}. On en gagne avec les fouilles, les missions, les Épreuves et les gardiens.`)];
    servir = [ligne('cartes', 'Des cartes de meilleur métal', 'Plus la Strate est profonde, plus les trouvailles sont rares.'),
      ligne('codex', 'Les Chroniques', 'Les chapitres profonds se débloquent en descendant.')];
  }
  return `<div class="voile-feuille" data-action="ressource" data-id="" aria-hidden="true"></div><section class="feuille ressource-fiche res-${r}" role="dialog" aria-modal="true" aria-labelledby="res-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${surtitre}</span><h2 id="res-titre">${titre}</h2></div><button type="button" class="btn-icone" data-action="ressource" data-id="" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps"><div class="res-etat">${icone(r === 'strate' ? 'strate' : r)}<span>${etat}</span></div><p class="res-resume">${resume}</p>`
    + `<h3 class="titre-bloc">Comment en obtenir</h3><ul class="res-liste">${gagner.join('')}</ul>`
    + `<h3 class="titre-bloc">À quoi ça sert</h3><ul class="res-liste">${servir.join('')}</ul>`
    + (r === 'strate' ? `<button type="button" class="btn sec large" data-action="classements" data-id="profondeur">${ICO.monter}Voir le classement des profondeurs</button>` : '')
    + `</div></section>`;
}

const ONGLETS: { vue: Vue | 'plus'; nom: string; icone: Icone }[] = [
  { vue: 'archipel', nom: 'District', icone: 'district' },
  { vue: 'coupe', nom: 'Tour', icone: 'tour' },
  // Porteurs et Cartes ne font plus qu'un onglet (25 octobre 2026) : l'escouade, ses Porteurs et leurs cartes au même endroit
  { vue: 'porteurs', nom: 'Escouade', icone: 'porteurs' },
  { vue: 'codex', nom: 'Chroniques', icone: 'codex' },
  { vue: 'plus', nom: 'Plus', icone: 'plus' },
];

/** La navigation du bas */
export function navigation(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  const alerte: Partial<Record<Vue | 'plus', boolean>> = {
    archipel: !!(j.forge && e.now >= j.forge.fin) || !!(o && (o.fait(j) || o.onglet === 'archipel')),
    porteurs: !!(o && (o.onglet === 'porteurs' || o.onglet === 'cartes') && !o.fait(j)) || porteursNouveaux(j).length > 0 || (j.chambre && cartesNouvelles(j).length > 0),
    coupe: !!j.expedition || !!(o && o.onglet === 'coupe' && !o.fait(j)),
    codex: CHAPITRES.some((c) => chapitreOuvert(c, j.strate) && !j.lus.includes(c.id)),
  };
  const actif = e.menu || e.vue === 'classements' ? 'plus' : e.vue === 'escouade' ? 'coupe' : e.vue === 'cartes' ? 'porteurs' : e.vue;
  // sur PC (rail.css) : le cristal seul en tête, et un filet de lumière qui relie les onglets au « Plus » du bas
  return `<nav class="nav" aria-label="Navigation"><span class="nav-embleme" aria-hidden="true"><img src="./art/embleme-cristal.webp" alt=""></span>` + ONGLETS.map((t) => {
    const action = t.vue === 'plus' ? 'menu' : t.vue;
    return (t.vue === 'plus' ? '<span class="nav-filet" aria-hidden="true"></span>' : '')
      + `<button type="button" class="onglet${actif === t.vue ? ' actif' : ''}" data-action="${action}"${actif === t.vue ? ' aria-current="page"' : ''}>`
      + `<span class="onglet-ico">${icone(t.icone)}${alerte[t.vue] ? '<i class="pastille-alerte" aria-label="nouveau"></i>' : ''}</span><span>${t.nom}</span></button>`;
  }).join('') + `</nav>`;
}

/**
 * Les trois volets de l'onglet Escouade (25 octobre 2026) : l'escouade et son deck, tous les Porteurs, toute la collection.
 * La collection reste fermée tant que la chambre scellée n'est pas ouverte.
 */
export function voletsEscouade(e: EcranDistrict): string {
  const j = e.j;
  const ici = e.vue === 'cartes' ? 'cartes' : e.reserve ? 'tous' : 'escouade';
  const neufsP = porteursNouveaux(j).length;
  const neufsC = j.chambre ? cartesNouvelles(j).length : 0;
  const seg = (id: string, action: string, nom: string, plus = '', ferme = false) =>
    `<button type="button" role="tab" class="seg${ici === id ? ' actif' : ''}" data-action="${action}" aria-selected="${ici === id}"${ferme ? ' disabled' : ''}>${ferme ? ICO.verrou : ''}${nom}${plus}</button>`;
  return `<div class="segments-choix trois volets-escouade" role="tablist" aria-label="Escouade, Porteurs ou cartes">`
    + seg('escouade', 'porteurs', 'Escouade')
    + seg('tous', 'porteurs-tous', 'Porteurs', neufsP ? ` <span class="pastille-n" aria-label="${neufsP} nouveau${neufsP > 1 ? 'x' : ''}">${neufsP}</span>` : '')
    + seg('cartes', 'cartes', 'Collection', neufsC ? ` <span class="pastille-n" aria-label="${neufsC} nouvelle${neufsC > 1 ? 's' : ''}">${neufsC}</span>` : '', !j.chambre)
    + `</div>`;
}

/** Le message du moment, posé au-dessus de la navigation ; on le touche pour le fermer */
export function toast(message: string): string {
  if (!message) return '';
  return `<button type="button" class="toast" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(message)}</span></button>`;
}

/** « Protège ta partie » (25 octobre 2026) : aux paliers, tant que la partie n'est reliée à aucun compte. Jamais bloquant. */
function feuilleRappel(e: EcranDistrict): string {
  if (!e.rappel) return '';
  return `<div class="voile-feuille" data-action="rappel-plus-tard" aria-hidden="true"></div><section class="feuille rappel-compte" role="dialog" aria-modal="true" aria-label="Protège ta partie">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">Strate −${e.j.strate} · ta partie grandit</span><h2>Protège ta partie</h2></div>`
    + `<button type="button" class="btn-icone" data-action="rappel-plus-tard" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<p class="rc-texte">Elle n’est sauvegardée que pour ce téléphone : s’il est perdu ou réinitialisé, elle disparaît. Relie-la à Google ou à un e-mail, en quelques secondes, et tu la retrouveras partout.</p>`
    + `<div class="rc-boutons"><button type="button" class="btn prim" data-action="rappel-proteger">${ICO.compte}Protéger ma partie</button>`
    + `<button type="button" class="btn sec" data-action="rappel-plus-tard">Plus tard</button></div></div></section>`;
}

/** Le menu « Plus » : compte, intro, journal */
export function menu(e: EcranDistrict): string {
  if (!e.menu) return '';
  const c = e.compte;
  let h = `<div class="voile-feuille" data-action="menu" aria-hidden="true"></div><section class="feuille menu" role="dialog" aria-modal="true" aria-label="Menu">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">EMPREINTES · ALPHA</span><h2>Menu</h2></div>`
    + `<button type="button" class="btn-icone" data-action="menu" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  h += `<div class="liste-menu">`
    + `<button type="button" class="ligne-menu gt-menu" data-action="classements">${ICO.monter}<span><strong>Le Grand Tableau</strong><small>Les classements des directeurs : profondeur, Registre, et bientôt les Joutes et la Flèche</small></span></button>`
    + (c.actif ? `<button type="button" class="ligne-menu" data-action="compte" aria-expanded="${c.ouvert}">${ICO.compte}<span><strong>Compte</strong><small>${c.utilisateur?.anonyme ? 'Protège ta partie : relie-la à Google ou à un e-mail' : c.utilisateur ? `Connecté${c.pseudo ? ` : ${echap(c.pseudo)}` : ' · choisis ton pseudo'}` : 'Retrouver ta progression sur un autre appareil'}</small></span></button>` : '')
    + (e.j.chambre ? `<button type="button" class="ligne-menu" data-action="accueil">${icone('district')}<span><strong>Comment marche le district</strong><small>Les ressources, l’escouade et le but : creuser plus bas</small></span></button>` : '')
    + `<button type="button" class="ligne-menu" data-action="intro">${ICO.film}<span><strong>Revoir l’intro</strong><small>L’histoire de 2121, depuis le début</small></span></button></div>`;
  h += panneauCompte(c);
  h += `<section class="bloc"><h3 class="titre-bloc">${icone('journal')}Journal du district</h3><ol class="journal-liste">${e.j.journal.map((t) => `<li>${echap(t)}</li>`).join('')}</ol></section>`;
  return h + `</div></section>`;
}

/** Entête d'un écran : sur-titre, titre, et un bouton à droite */
export function entete(surtitre: string, titre: string, droite = ''): string {
  return `<header class="entete"><div class="titres"><span class="surtitre">${surtitre}</span><h1>${titre}</h1></div>${droite}</header>`;
}

/** L'écran complet du district : ressources, contenu, message, navigation, menu */
export function coquille(e: EcranDistrict, contenu: string, classe = ''): string {
  const pseudo = e.grand?.edition ? feuilleNom(e.j, e.compte.utilisateur?.nom ?? '', e.grand.erreur, !!e.grand.accueil) : '';
  return `<div class="ecran ${classe}">${hud(e.j, e.ressource ?? null)}<main class="contenu">${contenu}</main>${toast(e.message)}${navigation(e)}${menu(e)}${feuilleRessource(e.j, e.ressource)}${pseudo}${feuilleRappel(e)}</div>`;
}
