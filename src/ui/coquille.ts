// La coquille des écrans du district : barre de ressources en haut, navigation en bas, notifications, menu.
// Tout l'affichage du district passe par ici pour rester cohérent d'un écran à l'autre.

import { ennemiDef, moduleDef, porteurDef } from '../core/donnees';
import { COLLECTION, doublonsRequis, multNiveau } from '../core/collection';
import { vestigeDef } from '../core/explorer';
import { faceCarte } from './carte';
import { CHAPITRES, chapitreOuvert } from '../core/chroniques';
import { ACCORD_OUVERT, ARCHIVE, CONFIANCE, NOMS_CONFIANCE, coutPompe, nomConfiance, pompesRestantes, semaineDe, type SourceHabitants, niveauConfiance, cartesNouvelles, porteursNouveaux, creuseursRequis, energieParHeure, logementCreuseurs, manquePourCreuser, objectifCourant, rapportALire, stockage, strateVaincue, PILLAGE, flecheOuverte, type Jeu, type RapportMission } from '../core/jeu';
import type { Lignee } from '../core/types';
import { miniature, portrait } from './art';
import { feuilleGuide, trouveesDe } from './guide';
import { ICO, icone, type Icone } from './icones';
import { feuilleNom } from './classements';
import { cristalAllume, cristalRail, entreeFiche, feuilleFiche } from './fiche';
import { COULEUR, panneauCompte, type Compte } from './vue';
import { echap, virgule } from './outils';

export type Vue = 'archipel' | 'coupe' | 'escouade' | 'rencontre' | 'briefing' | 'accueil' | 'codex' | 'cartes' | 'porteurs' | 'classements' | 'pillages' | 'fleche' | 'recruter';
/** filtre de la collection : une lignée, ou les cartes qui peuvent monter, ou celles que personne ne porte */
export type Filtre = 'tout' | Lignee | 'monter' | 'libres';

export interface EcranDistrict {
  j: Jeu;
  /** Forge (27 octobre 2026) : la rangée des Porteurs ouverte pour changer de forgeron, et toutes les cartes affichées */
  posteChanger?: boolean;
  forgeToutes?: boolean;
  /** Tour du Noyau (28 octobre 2026) : la liste des Porteurs ouverte pour changer celui qui s'entraîne */
  tourChanger?: boolean;
  /** Port, missions en mer (28 octobre 2026) : la destination du jour choisie */
  destination?: string | null;
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
  /** le rapport d'expédition à la remontée d'une descente, d'une fouille ou d'une Épreuve (31 octobre 2026) */
  expedition?: RapportExpedition | null;
  /** menu « Plus » ouvert */
  menu: boolean;
  /** la fiche du directeur ouverte (le cristal du rail, le médaillon du haut ; 29 octobre 2026) */
  fiche?: boolean;
  /** la lettre de l’Héritage : la lignée choisie à la première question, puis la carte reçue à montrer (27 octobre 2026) */
  legsLignee?: 'tech' | 'bio' | 'reso' | null;
  legsRevele?: boolean;
  /** carte ouverte en détail dans l'écran Cartes (clé module@métal) */
  carte: string | null;
  /** Porteur dont on construit le deck (feuille « Les cartes de… »), ou null */
  deck: string | null;
  /** dans cette feuille, la carte choisie pour un échange (portée ou à confier), en attente de la seconde */
  echange?: string | null;
  /** Porteur dont la fiche est ouverte (onglet Escouade, départ), ou null */
  porteur: string | null;
  /** lignée affichée dans l'écran Cartes */
  filtre: Filtre;
  /** Bibliothèque : onglet, chapitre ouvert, et écran où revenir */
  onglet: 'chroniques' | 'archives' | 'campagne' | 'bestiaire';
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
  /** l'escouade part piller cet archipel (pillages.ts) ; et l'archipel choisi sur la carte */
  pillage?: import('../core/jeu').Cible | null;
  pillageCible?: string | null;
  /** l'escouade part monter à la Flèche (fleche.ts) */
  fleche?: boolean;
  /** la présentation de la Flèche est rouverte (bouton « ? ») */
  flecheAide?: boolean;
  /** les gardiens de la Flèche lus en ligne : les plus hauts, et ceux des quais déjà atteints (max) */
  gardiens?: { top: import('../core/jeu').GardienQuai[]; portee: import('../core/jeu').GardienQuai[]; max: number; lu: number } | null;
  /** le défi préparé (écran de départ) */
  defi?: import('../core/jeu').GardienQuai | null;
  /** le Port : sa présentation rouverte, et le volet affiché (pillages ou missions en mer) */
  portAide?: boolean;
  voletPort?: 'pillages' | 'missions';
  /** les garnisons des vrais directeurs à portée, lues en ligne (vide sans compte) */
  pillagesEnLigne?: import('../core/jeu').Cible[];
  /** la feuille des Vestiges d'une Strate est ouverte (Tour, 31 octobre 2026) */
  vestiges?: number | null;
  /** la fiche d'une ressource du haut est ouverte (22 octobre 2026) */
  ressource?: Ressource | null;
  /** onglet Escouade : le volet « Porteurs » (tous les Porteurs) est affiché au lieu de l’escouade */
  reserve?: boolean;
  /** onglet Escouade : la place de l'escouade (0 à 2) dont on choisit le Porteur, volet ouvert */
  place?: number | null;
  /** le volet du Râtelier (cartes communes du district) est ouvert (30 octobre 2026) */
  ratelier?: boolean;
  /** onglet Escouade : l'escouade affichée (0 à 2) ; par défaut, celle qui descend */
  vueEscouade?: number;
  /** onglet Escouade ouvert depuis le départ ou le Port (27 octobre 2026) : le bouton pour y revenir */
  retourModif?: 'escouade' | 'pillages' | null;
  /** Tour du Noyau : le volet affiché sous la prochaine étape (par défaut, les Strates) */
  ongletTour?: 'strates' | 'epreuves' | 'missions';
  /** le mode d'emploi des cartes est ouvert, sur cet onglet (guide.ts) */
  guide: import('./guide').OngletGuide | null;
  /** l'ordre des cartes (écran Cartes, cartes d'un Porteur), retenu sur l'appareil */
  tri?: import('../core/collection').TriCartes;
  /** sur téléphone, le panneau du district (objectif, confiance, Archive, marché) est replié (par défaut) */
  panneauReplie?: boolean;
  /** sur téléphone, la bulle du district dépliée (28 octobre 2026) : l'objectif ou l'appel (ravitaillement, expédition…) */
  bulle?: 'objectif' | 'appel' | null;
  /** le Grand Tableau (classements.ts) et l'identifiant du compte connecté */
  grand?: import('./classements').GrandTableau;
  uid?: string | null;
}

export const ent = (n: number) => Math.floor(n).toLocaleString('fr-BE').replace(/\u202f/g, '\u00a0');
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

/**
 * Où en est la barque d'une mission en mer : l'aller (45 % du temps), la fouille sur place (10 %), le retour (45 %).
 * x va de 0 (le port du district) à 1 (le lieu de la mission).
 */
export type PhaseVoyage = 'aller' | 'fouille' | 'retour' | 'quai';
export function etapeVoyage(debut: number, fin: number, now: number): { x: number; phase: PhaseVoyage } {
  const p = Math.max(0, (now - debut) / Math.max(1, fin - debut));
  if (p >= 1) return { x: 0, phase: 'quai' };
  if (p < 0.45) return { x: p / 0.45, phase: 'aller' };
  if (p < 0.55) return { x: 1, phase: 'fouille' };
  return { x: 1 - (p - 0.55) / 0.45, phase: 'retour' };
}
export const NOM_PHASE: Record<PhaseVoyage, string> = { aller: 'En route', fouille: 'Fouille sur place', retour: 'Sur le retour', quai: 'À quai' };

export const NOM_LIGNEE: Record<Lignee, string> = { tech: 'Augmenté', bio: 'Géné', reso: 'Résonant' };
export const NOM_LIGNEES: Record<Lignee, string> = { tech: 'Augmentés', bio: 'Génés', reso: 'Résonants' };

/**
 * Le portrait d'un Porteur : son illustration si elle existe, sinon son initiale sur un hexagone de sa lignée.
 * @param taille en pixels
 */
export function avatar(id: string, taille = 40, extra = ''): string {
  const d = porteurDef(id);
  // jusqu'à 60 px, la miniature suffit (nette sur un écran de téléphone) et arrive tout de suite : plus d'hexagones vides
  const p = taille <= 60 ? miniature(id) : portrait(id);
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
type Ressource = 'energie' | 'composants' | 'eclats' | 'strate' | 'confiance' | 'butin';

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
    + roueConfiance(j, b)
    + `</header>`;
}

/**
 * Les habitants qui te suivent, dans la barre du haut (30 octobre 2026) : le palier au centre d'une roue qui se remplit
 * vers le suivant, et le nombre d'habitants dessous. Elle ne fait que monter.
 */
function roueConfiance(j: Jeu, b: (r: Ressource, extra: string, label: string) => string): string {
  if (!j.chambre) return '';
  const n = niveauConfiance(j.confiance ?? 0);
  const p = n.requis ? Math.round((100 * n.dans) / n.requis) : 100;
  return b('confiance', '', `${j.confiance} habitants sur ${CONFIANCE.population} te suivent, palier ${n.niveau}. Détails`)
    + `<span class="roue-confiance" style="--p:${p}%" aria-hidden="true"><b>${n.niveau}</b></span><small>${j.confiance} hab.</small></button>`;
}

/** D'où viennent les habitants, pour le bilan de la Nuit des lignes */
const NOMS_SOURCE: Record<SourceHabitants, string> = {
  pompes: 'Les pompes ont tenu', naufrages: 'Des naufragés recueillis', gardiens: 'Des gardiens vaincus', rencontres: 'Des choix justes en bas',
  defense: 'Des pillages repoussés', fleche: 'Des quais gagnés sur la Flèche', histoire: 'L’histoire du district',
};

/** Ce que chaque palier apporte en plus du creuseur volontaire et du souvenir de famille */
const PALIERS_CONFIANCE: Record<number, string> = {
  [ACCORD_OUVERT.confiance]: `L’Accord ouvert : avec la Clinique au niveau ${ACCORD_OUVERT.clinique}, un nouveau Résonant rejoint le district.`,
  [CONFIANCE.comptoir]: 'Un marchand du quartier rouvre son étal : une carte de plus chaque jour au Comptoir.',
  8: 'Tout le district te suit. Le jour où tu réclameras l’île, personne ne restera en bas.',
};

/** Les pompes du Générateur, dans la fiche des habitants */
function blocPompes(j: Jeu): string {
  const restantes = pompesRestantes(j, Date.now());
  const cout = coutPompe(j);
  const plein = j.confiance >= CONFIANCE.population;
  const peut = j.batiments.generateur > 0 && restantes > 0 && j.energie >= cout && !plein;
  const raison = plein ? 'Tout le district te suit déjà.' : j.batiments.generateur < 1 ? 'Le Générateur est à l’arrêt.' : !restantes ? 'Assez pompé cette semaine : les pompes repartent lundi, après la Nuit des lignes.'
    : j.energie < cout ? `Il manque ${ent(cout - j.energie)} énergie.` : `${restantes} pompage${restantes > 1 ? 's' : ''} sur ${CONFIANCE.pompesSemaine} encore possible${restantes > 1 ? 's' : ''} cette semaine.`;
  const crans = Array.from({ length: CONFIANCE.pompesSemaine }, (_, k) => `<i class="${k < CONFIANCE.pompesSemaine - restantes ? 'fait' : ''}"></i>`).join('');
  return `<section class="fb-bloc pompes"><h3 class="titre-bloc">${ICO.energie}Les pompes du Générateur</h3>`
    + `<p class="fb-vide">Le courant envoyé aux pompes retient l’eau des quais bas. Le quartier le voit, et ceux qui doutaient te rejoignent.</p>`
    + `<div class="pompes-crans" aria-label="${CONFIANCE.pompesSemaine - restantes} pompages faits cette semaine sur ${CONFIANCE.pompesSemaine}">${crans}</div>`
    + `<button type="button" class="btn prim large" data-action="pomper"${peut ? '' : ' disabled'}>${ICO.energie}Pomper : ${ent(cout)} ${icone('energie')} → +${CONFIANCE.pompe} habitants</button>`
    + `<small class="fb-note">${raison}</small></section>`;
}

/** Le bilan de la dernière Nuit des lignes */
function blocNuit(j: Jeu): string {
  const n = j.lignes?.derniere;
  const cette = j.lignes && j.lignes.semaine === semaineDe(Date.now()) ? Object.values(j.lignes.sources).reduce((x, v) => x + (v ?? 0), 0) : 0;
  const lignes = n ? (Object.entries(n.sources) as [SourceHabitants, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<li><span>${NOMS_SOURCE[k]}</span><b>+${v}</b></li>`).join('') + (n.bonus ? `<li class="nuit-bonus"><span>Ceux qui ont vu, cette nuit-là</span><b>+${n.bonus}</b></li>` : '') : '';
  return `<section class="fb-bloc nuit-lignes"><h3 class="titre-bloc">${ICO.district}La Nuit des lignes</h3>`
    + `<p class="fb-vide">Chaque lundi, le district repeint sa ligne bleue un peu plus haut et fait le bilan. Ceux qui ont vu ce que tu as fait en entraînent d’autres : ${Math.round(CONFIANCE.nuit * 100)} % de plus que les habitants gagnés dans la semaine. Une semaine sans rien ne fait rien perdre.</p>`
    + `<p class="nuit-semaine">Cette semaine : <b>+${cette}</b> habitant${cette > 1 ? 's' : ''} pour l’instant.</p>`
    + (n ? `<h4 class="nuit-titre">La dernière Nuit · +${n.gagnes + n.bonus} habitants</h4><ul class="nuit-liste">${lignes}</ul>` : '')
    + `</section>`;
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
    etat = `<b>${ent(j.energie)}</b> / ${ent(max)}<small>${j.energie >= max ? 'Stockage plein : la production est perdue. Le convertisseur du Générateur en fait des composants' : `+${energieParHeure(j)} par heure`}</small>`;
    gagner = [ligne('boost', 'Le Générateur', 'Produit l’énergie chaque heure. Un Porteur posté dessus produit davantage.'),
      ligne('tour', 'La Tour du Noyau', 'Chaque niveau agrandit le stockage.'),
      ligne('cartes', 'Les premiers objectifs', 'Le premier en rapporte.')];
    servir = [ligne('marteau', 'Améliorer les bâtiments', 'C’est la dépense principale de chaque chantier.'),
      ligne('marteau', 'Faire tourner la Forge', 'Chaque carte refabriquée consomme de l’énergie, plus pour les métaux rares.'),
      ligne('monter', 'Entraîner un Porteur', 'À la Tour du Noyau : une séance = un niveau, payée en énergie au lancement, à relancer ensuite.'),
      ligne('porteurs', 'Équiper les missions', 'Vivres et lampes : un peu d’énergie au départ.'),
      ligne('boost', 'Le convertisseur du Générateur', 'L’énergie en trop devient des composants : 10 par lot de 100, puis moins, 20 lots par jour au plus.'),
      ligne('soin', 'Les soins intensifs', 'À la Clinique, effacer l’Usure d’un Porteur tout de suite.')];
  } else if (r === 'composants') {
    surtitre = 'RESSOURCE'; titre = 'Les composants';
    resume = 'Les pièces récupérées dans les Strates : métal, mécanismes, cristaux brisés. On les rapporte des expéditions.';
    etat = `<b>${ent(j.composants)}</b><small>composants en réserve</small>`;
    gagner = [ligne('strate', 'Les expéditions', 'Chaque combat gagné, chaque cache et chaque salle d’archives en rapporte. Fuir en garde les trois quarts, une défaite la moitié.'),
      ligne('cristal', 'Les fouilles ciblées', 'Une descente courte qui peut viser les composants.'),
      ligne('cartes', 'Le ravitaillement du jour', 'Quelques composants chaque jour.'),
      ligne('porteurs', 'Les missions en mer', 'Un Porteur envoyé depuis le Port vers les ruines noyées en rapporte à son retour.'),
      ligne('recycler', 'Recycler des doublons', 'Chaque doublon recyclé rapporte quelques composants.'),
      ligne('coffre', 'Le Butin de la semaine', 'Chaque lundi, selon les paliers atteints.')];
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
      ligne('cristal', 'Les fouilles « Éclats » et le Butin de la semaine', 'Pour en gagner quand on bloque.')];
    servir = [ligne('marteau', 'Refabriquer les cartes rares', 'Argent, or et nacre en demandent à la Forge.'),
      ligne('cartes', 'Les cartes en argent du Comptoir', 'Elles coûtent aussi des Éclats.'),
      ligne('marteau', 'Les grands chantiers', 'Les derniers niveaux des bâtiments.')];
  } else if (r === 'confiance') {
    const n = niveauConfiance(j.confiance ?? 0);
    surtitre = 'LE DISTRICT'; titre = 'Ceux qui te suivent';
    resume = 'L’eau monte, et tout le district le sait. Chaque fois que tu protèges des gens, d’autres décident de te suivre, et ils ne te quittent plus. Le jour où tu réclameras l’île, ils monteront avec toi.';
    etat = `<b>${j.confiance}</b> / ${CONFIANCE.population}<small>${nomConfiance(n.niveau)}${n.requis ? ` · encore ${n.requis - n.dans} pour le palier ${n.niveau + 1}` : ''}</small>`;
    gagner = [ligne('energie', 'Faire tourner les pompes', `+${CONFIANCE.pompe} par pompage, ${CONFIANCE.pompesSemaine} par semaine (plus haut).`),
      ligne('porteurs', 'Recueillir des naufragés', `Une mission « Naufragés » depuis le Port : +${CONFIANCE.naufrages.courte} (courte) ou +${CONFIANCE.naufrages.longue} (longue) quand la barque en ramène.`),
      ligne('porte', 'Vaincre les gardiens', `+${CONFIANCE.gardien} pour chaque gardien vaincu de −1 à −10 : l’espoir de l’Écluse grandit.`),
      ligne('cristal', 'Les choix justes en bas', 'Aider ceux qu’on croise se sait au quartier.'),
      ligne('boost', 'Repousser un pillage', `+${CONFIANCE.defense} quand la garnison du Port tient.`),
      ligne('monter', 'Gagner des quais sur la Flèche', `+${CONFIANCE.quaiGrave} par quai gravé : de la place sur les îles.`)];
    servir = Array.from({ length: CONFIANCE.population / CONFIANCE.palier }, (_, k) => {
      const p = k + 1;
      const fait = n.niveau >= p;
      return `<li class="${fait ? 'fait' : ''}">${ICO[fait ? 'ouvrier' : 'verrou'] ?? ''}<span><strong>${p * CONFIANCE.palier} habitants${NOMS_CONFIANCE[p] ? ` · ${NOMS_CONFIANCE[p]}` : ''}</strong><small>${PALIERS_CONFIANCE[p] ? `${PALIERS_CONFIANCE[p]} Avec` : 'Un'} creuseur volontaire et un souvenir de famille.</small></span></li>`;
    });
  } else if (r === 'butin') {
    // 28 octobre 2026 (Bryan : « c'est quoi en fait l'Archive de la semaine ») : la fiche explique tout, sans rien à deviner
    const pts = j.archive.points;
    const prochain = ARCHIVE.paliers.find((p) => pts < p);
    const atteints = ARCHIVE.paliers.filter((p) => pts >= p).length;
    surtitre = 'CHAQUE SEMAINE'; titre = 'Le Butin de la semaine';
    resume = 'Tout ce que tu fais cette semaine remplit un coffre. Chaque cran atteint y ajoute des récompenses. Lundi, le coffre s’ouvre au district et une nouvelle semaine repart de zéro. Rien n’est jamais perdu : un cran atteint reste acquis.';
    etat = `<b>${pts}</b> / ${ARCHIVE.paliers[ARCHIVE.paliers.length - 1]}<small>${prochain ? `Encore ${prochain - pts} points pour le cran ${atteints + 1}` : 'Tous les crans sont atteints : bravo'} · s’ouvre lundi</small>`;
    gagner = [ligne('porte', 'Gagner un combat en bas', `+${ARCHIVE.points.combat} points.`),
      ligne('strate', 'Finir une descente', `+${ARCHIVE.points.expedition} points.`),
      ligne('marteau', 'Finir un chantier', `+${ARCHIVE.points.chantier} points.`),
      ligne('cartes', 'Remplir l’objectif du jour', `+${ARCHIVE.points.quotidien} points.`)];
    const d = ARCHIVE.paliers;
    servir = [ligne('coffre', `Cran 1 · ${d[0]} points`, '40 composants et une carte au choix parmi trois.'),
      ligne('cristal', `Cran 2 · ${d[1]} points`, '3 Éclats en plus.'),
      ligne('cartes', `Cran 3 · ${d[2]} points`, 'Une deuxième carte au choix, dont au moins une en argent.'),
      ligne('boost', `Cran 4 · ${d[3]} points`, 'Une troisième carte au choix avec de l’argent, et 5 Éclats de plus. Pour les plus assidus.')];
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
    + `<div class="feuille-corps"><div class="res-etat">${icone(r === 'confiance' ? 'district' : r === 'butin' ? 'coffre' : r)}<span>${etat}</span></div><p class="res-resume">${resume}</p>`
    + (r === 'confiance' ? blocPompes(j) + blocNuit(j) : '')
    + `<h3 class="titre-bloc">${r === 'butin' ? 'Comment gagner des points' : 'Comment en obtenir'}</h3><ul class="res-liste">${gagner.join('')}</ul>`
    + `<h3 class="titre-bloc">${r === 'butin' ? 'Ce que contient le coffre' : r === 'confiance' ? 'Les paliers' : 'À quoi ça sert'}</h3>`
    + (r === 'confiance' ? `<p class="res-resume">Chaque palier amène un creuseur volontaire et une famille qui confie un souvenir aux Archives.</p>` : '') + `<ul class="res-liste">${servir.join('')}</ul>`
    + (r === 'strate' ? `<button type="button" class="btn sec large" data-action="classements" data-id="profondeur">${ICO.monter}Voir le classement des profondeurs</button>` : '')
    + `</div></section>`;
}

const ONGLETS: { vue: Vue | 'plus'; nom: string; icone: Icone }[] = [
  { vue: 'archipel', nom: 'District', icone: 'district' },
  { vue: 'coupe', nom: 'Tour', icone: 'tour' },
  // Porteurs et Cartes ne font plus qu'un onglet (25 octobre 2026) : l'escouade, ses Porteurs et leurs cartes au même endroit
  { vue: 'porteurs', nom: 'Escouade', icone: 'porteurs' },
  // les Pillages et la Flèche ont leur onglet (28 octobre 2026, Bryan) : la carte des archipels voisins ne passe plus par le Port
  { vue: 'pillages', nom: 'Port', icone: 'carte' },
  { vue: 'fleche', nom: 'Flèche', icone: 'fleche' },
  // les Chroniques juste avant Plus (28 octobre 2026, Bryan) : on y va moins souvent qu'au reste
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
    // une pastille quand l'onglet vient de s'ouvrir et qu'on n'y est jamais allé
    pillages: (!!j.chambre && strateVaincue(j) >= PILLAGE.strateMin && !j.portVu) || !!(o && o.onglet === 'pillages' && !o.fait(j)),
    fleche: flecheOuverte(j) && !j.fleche,
  };
  const actif = e.menu || e.vue === 'classements' || e.vue === 'recruter' ? 'plus' : e.vue === 'escouade' ? (e.fleche ? 'fleche' : e.pillage ? 'pillages' : 'coupe') : e.vue === 'cartes' ? 'porteurs' : e.vue;
  // sur PC (rail.css) : le cristal en tête (il ouvre la fiche du directeur et s'allume quand une récompense attend : 29 octobre 2026), puis les sept onglets ; la jauge des Strates a cédé sa place aux Pillages
  // et à la Flèche (28 octobre 2026) : la Strate reste dans la barre du haut
  return `<nav class="nav" aria-label="Navigation">${cristalRail(e)}` + ONGLETS.map((t) => {
    const action = t.vue === 'plus' ? 'menu' : t.vue;
    return `<button type="button" class="onglet${actif === t.vue ? ' actif' : ''}" data-action="${action}"${actif === t.vue ? ' aria-current="page"' : ''}>`
      + `<span class="onglet-ico">${icone(t.icone)}${alerte[t.vue] ? '<i class="pastille-alerte" aria-label="nouveau"></i>'
        // sur téléphone, le cristal n'existe pas : c'est l'onglet Plus (où vit la fiche) qui porte l'appel
        : t.vue === 'plus' && cristalAllume(e) ? '<i class="pastille-alerte appel-fiche" aria-label="une récompense t’attend"></i>' : ''}</span><span class="onglet-nom">${t.nom}</span></button>`;
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

const METAL = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

/** Ce qu'une mission a rapporté, en pastilles (fenêtre du rapport et historique de la Tour) */
export function gainsRapport(r: RapportMission): string {
  return `<ul class="rm-gains">`
    + `<li>${ICO.composants}<b>+${r.composants}</b><small>composants</small></li>`
    + `<li>${ICO.monter}<b>+${r.xp}</b><small>XP${r.niveau ? ` · niveau ${r.niveau}` : ''}</small></li>`
    + r.cartes.map((c) => `<li class="rm-carte${c.nouvelle ? ' nouvelle' : ''}">${ICO.cartes}<b>${echap(moduleDef(c.id).nom)}</b><small>${METAL(moduleDef(c.id).rarete)}${c.nouvelle ? ' · nouvelle' : ' · doublon'}</small></li>`).join('')
    + (r.creuseurs ? `<li>${ICO.ouvrier}<b>+${r.creuseurs}</b><small>creuseur${r.creuseurs > 1 ? 's' : ''}</small></li>` : '')
    + (r.usure ? `<li class="rm-usure">${ICO.soin}<b>+${virgule(r.usure)}</b><small>Usure</small></li>` : '')
    + `</ul>`;
}

/** Le rapport de mission (28 octobre 2026) : il s'ouvre au district tant qu'un retour n'a pas été lu */
function feuilleRapport(e: EcranDistrict): string {
  const autreChose = e.retour.length || e.menu || e.fiche || e.rappel || e.ressource || e.selection || e.carte || e.deck || e.porteur || e.guide;
  const r = autreChose ? null : rapportALire(e.j);
  if (!r) return '';
  const p = porteurDef(r.porteur);
  const reste = (e.j.rapports ?? []).filter((x) => !x.lu).length - 1;
  return `<div class="voile-feuille" data-action="rapport-lu" aria-hidden="true"></div><section class="feuille rapport-mission" role="dialog" aria-modal="true" aria-labelledby="rm-titre" style="--c:${COULEUR[p.lignee]}">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete">${avatar(r.porteur, 48)}<div class="titres"><span class="surtitre">Mission en mer</span><h2 id="rm-titre">Retour de ${echap(p.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="rapport-lu" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="rm-recit">${r.recit.map((l) => `<p>${echap(l)}</p>`).join('')}</div>`
    + gainsRapport(r)
    + `<button type="button" class="btn prim large" data-action="rapport-lu">${reste > 0 ? `Rapport suivant (${reste})` : 'Bien reçu'}</button>`
    + `</div></section>`;
}

/** Le rapport d'expédition (31 octobre 2026, Bryan : « j'ai gagné des cartes mais je sais pas c'est lesquelles ») :
 *  tout ce que la descente a rapporté, d'un coup d'œil, sans aller fouiller l'onglet Cartes */
export interface RapportExpedition {
  /** « Descente », « Fouille · cartes augmentées », « Épreuve · Le fer seulement » */
  type: string;
  strate: number;
  issue: 'victoire' | 'retraite' | 'fuite' | 'defaite';
  retour: import('../core/jeu').Retour;
  /** les cartes que le joueur n'avait pas avant de descendre */
  nouvelles: string[];
  /** les cartes au choix qui attendent au district (gardien, filon, Épreuve, étoiles) */
  choix: number;
  creuseurs: number;
  /** une précision (fuite, étage qui attend des creuseurs…) */
  note: string;
}

/** la face d'une carte trouvée, à son niveau actuel */
function faceRapport(j: Jeu, id: string): string {
  const m = moduleDef(id);
  const n = j.collection[id]?.niveau ?? COLLECTION.niveauDepart[m.rarete];
  return faceCarte(m, n, multNiveau(id, n));
}

const ISSUE_EXPEDITION: Record<RapportExpedition['issue'], [string, string]> = {
  victoire: ['Mission accomplie', 'victoire'],
  retraite: ['Retour au district', 'retraite'],
  fuite: ['Repli précipité', 'fuite'],
  defaite: ['L’escouade a été repoussée', 'defaite'],
};

function feuilleExpedition(e: EcranDistrict): string {
  const r = e.expedition;
  if (!r) return '';
  const g = r.retour;
  const [titre, cls] = ISSUE_EXPEDITION[r.issue];
  const ligne = (ico: string, n: string, txt: string, c = '') => `<li${c ? ` class="${c}"` : ''}>${ico}<b>${n}</b><small>${txt}</small></li>`;
  const ex = g.explorer;
  let h = `<div class="voile-feuille" data-action="expedition-lu" aria-hidden="true"></div><section class="feuille rapport-expedition rx-${cls}" role="dialog" aria-modal="true" aria-labelledby="rx-titre">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><span class="rx-sceau" aria-hidden="true">${ICO.descendre}<b>−${r.strate}</b></span>`
    + `<div class="titres"><span class="surtitre">Rapport · ${echap(r.type)}</span><h2 id="rx-titre">${titre}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="expedition-lu" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  if (r.note) h += `<p class="rx-note">${echap(r.note)}</p>`;
  // les ressources
  h += `<ul class="rm-gains rx-res">`
    + ligne(ICO.composants, `+${virgule(g.butin)}`, 'composants')
    + (g.eclats ? ligne(ICO.eclats, `+${g.eclats}`, `Éclat${g.eclats > 1 ? 's' : ''}`) : '')
    + (r.creuseurs ? ligne(ICO.ouvrier, `+${r.creuseurs}`, `creuseur${r.creuseurs > 1 ? 's' : ''}`) : '')
    + (g.fragment ? ligne(ICO.journal, '+1', 'fragment d’archives') : '')
    + (g.nouvelleStrate ? ligne(ICO.descendre, `−${e.j.strate}`, 'nouvelle Strate ouverte', 'nouvelle') : '')
    + `</ul>`;
  // les cartes trouvées, avec leur face : nouvelle, doublon, ou niveau suivant prêt
  if (g.cartes.length) {
    h += `<h3 class="rx-titre">${ICO.cartes}${g.cartes.length > 1 ? `${g.cartes.length} cartes trouvées` : 'Une carte trouvée'}</h3><div class="rx-cartes">`;
    const vues = new Set<string>();
    for (const id of g.cartes) {
      const c = e.j.collection[id];
      const neuve = r.nouvelles.includes(id) && !vues.has(id);
      vues.add(id);
      const requis = c ? doublonsRequis(id, c.niveau) : null;
      const pret = !neuve && c && requis !== null && c.doublons >= requis;
      h += `<div class="rx-carte${neuve ? ' neuve' : ''}">`
        + faceRapport(e.j, id) + `<span class="ruban">${neuve ? 'Nouvelle' : pret ? `Niv. ${c!.niveau + 1} prêt` : 'Doublon'}</span></div>`;
    }
    h += `</div>`;
  }
  if (r.choix) h += `<p class="rx-choix">${ICO.cartes}<span><b>${r.choix > 1 ? `${r.choix} cartes au choix` : 'Une carte au choix'}</b> t’attend${r.choix > 1 ? 'ent' : ''} au district : tu la choisis juste après.</span></p>`;
  // l'escouade : l'XP de chacun, et les niveaux pris
  if (g.xp?.length) {
    h += `<h3 class="rx-titre">${ICO.monter}L’escouade · +${g.xp[0]!.xp} XP</h3><ul class="rx-escouade">`
      + g.xp.map((x) => `<li class="${x.niveau ? 'monte' : ''}">${avatar(x.id, 40)}<span><b>${echap(porteurDef(x.id).nom)}</b><small>${x.niveau ? `Niveau ${x.niveau} !` : `+${x.xp} XP`}</small></span></li>`).join('')
      + `</ul>`;
  }
  // la Strate : quête, Vestiges, étoiles, Rôdeur
  const strate: string[] = [];
  if (g.quete) strate.push(ligne(ICO.quete, g.quete.finie ? 'Achevée' : `${g.quete.etape} / ${g.quete.total}`, `quête « ${echap(g.quete.nom)} »`, g.quete.finie ? 'nouvelle' : ''));
  if (ex?.vestiges.length) strate.push(ligne(ICO.vestige, `+${ex.vestiges.length}`, `Vestige${ex.vestiges.length > 1 ? 's' : ''} : ${echap(ex.vestiges.map((v) => vestigeDef(v)?.nom ?? '').join(', '))}`));
  if (ex?.releve) strate.push(ligne(ICO.vestige, `−${ex.releve}`, 'Strate relevée', 'nouvelle'));
  if (ex?.etoiles.length) strate.push(ligne(ICO.etoile, `+${ex.etoiles.length}`, `étoile${ex.etoiles.length > 1 ? 's' : ''} de Strate`, 'nouvelle'));
  if (ex?.rodeur) strate.push(ligne(ICO.griffes, ex.rodeur.part ? `${Math.round(ex.rodeur.part * 100)} %` : 'Abattu', `${echap(ennemiDef(ex.rodeur.id).nom)}${ex.rodeur.part ? ' s’est enfui' : ''}`));
  if (strate.length) h += `<h3 class="rx-titre">${ICO.strate}Dans la Strate</h3><ul class="rm-gains">${strate.join('')}</ul>`;
  return h + `<button type="button" class="btn prim large" data-action="expedition-lu">${r.choix ? 'Choisir ma carte' : 'Bien reçu'}</button></div></section>`;
}

/** Le menu « Plus » : compte, intro, journal */
export function menu(e: EcranDistrict): string {
  if (!e.menu) return '';
  const c = e.compte;
  let h = `<div class="voile-feuille" data-action="menu" aria-hidden="true"></div><section class="feuille menu" role="dialog" aria-modal="true" aria-label="Menu">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">EMPREINTES · ALPHA</span><h2>Menu</h2></div>`
    + `<button type="button" class="btn-icone" data-action="menu" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  h += entreeFiche(e) + `<div class="liste-menu">`
    + `<button type="button" class="ligne-menu gt-menu" data-action="classements">${ICO.monter}<span><strong>Le Grand Tableau</strong><small>Les classements des directeurs : profondeur, Registre, et bientôt les Joutes et la Flèche</small></span></button>`
    + (c.actif ? `<button type="button" class="ligne-menu rc-menu" data-action="recruter">${ICO.porteurs}<span><strong>Recruter des amis</strong><small>Ton code de parrainage : vous êtes récompensés tous les deux quand ton ami joue</small></span></button>` : '')
    + (c.actif ? `<button type="button" class="ligne-menu" data-action="compte" aria-expanded="${c.ouvert}">${ICO.compte}<span><strong>Compte</strong><small>${c.utilisateur?.anonyme ? 'Protège ta partie : relie-la à Google ou à un e-mail' : c.utilisateur ? `Connecté${c.pseudo ? ` : ${echap(c.pseudo)}` : ' · choisis ton pseudo'}` : 'Retrouver ta progression sur un autre appareil'}</small></span></button>` : '')
    + (e.j.chambre ? `<button type="button" class="ligne-menu" data-action="accueil">${icone('district')}<span><strong>Comment marche le district</strong><small>Les ressources, l’escouade et le but : creuser plus bas</small></span></button>` : '')
    // le glossaire (31 octobre 2026, Luc) : tous les mots du jeu, avec une recherche
    + `<button type="button" class="ligne-menu" data-action="guide" data-id="glossaire">${ICO.aide}<span><strong>Glossaire</strong><small>Tous les mots du jeu expliqués : Fissure, Flux, Résonance, Charge…</small></span></button>`
    + `<button type="button" class="ligne-menu" data-action="intro">${ICO.film}<span><strong>Revoir l’intro complète</strong><small>L’histoire de 2121, en entier</small></span></button></div>`;
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
  // le mode d'emploi ouvert depuis un écran qui ne le montre pas lui-même (le Glossaire du menu, une bulle de mot)
  const guide = e.guide && !contenu.includes('class="feuille guide"') ? feuilleGuide(e.guide, trouveesDe(e.j.collection)) : '';
  return `<div class="ecran ${classe}">${hud(e.j, e.ressource ?? null)}<main class="contenu">${contenu}</main>${guide}${toast(e.message)}${navigation(e)}${menu(e)}${feuilleRessource(e.j, e.ressource)}${pseudo}${feuilleRappel(e)}${e.expedition ? feuilleExpedition(e) : feuilleRapport(e)}${feuilleFiche(e)}</div>`;
}
