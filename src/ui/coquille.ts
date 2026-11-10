// La coquille des écrans du district : barre de ressources en haut, navigation en bas, notifications, menu.
// Tout l'affichage du district passe par ici pour rester cohérent d'un écran à l'autre.

import { autoActif, langueReglable, NOMS_LANGUES } from './options';
import { texteGraphismes } from './graphismes';
import { sonActif } from './son';
import { animationsReduites } from './outils';
import { ennemiDef, moduleDef, porteurDef, deNom } from '../core/donnees';
import { COLLECTION, doublonsRequis, multNiveau } from '../core/collection';
import { vestigeDef } from '../core/explorer';
import { faceCarte } from './carte';
import { CHAPITRES, chapitreOuvert } from '../core/chroniques';
import { blocMur } from './mur';
import { CERCLE_OUVERTURE, MAREES, ACCORD_OUVERT, ARCHIVE, CONFIANCE, NOMS_CONFIANCE, nbFoyers, nomConfiance, semaineDe, type SourceHabitants, niveauConfiance, cartesNouvelles, chapitresALire, porteursNouveaux, creuseursRequis, brutEnAttente, logementCreuseurs, manquePourCreuser, objectifCourant, rapportALire, strateVaincue, PILLAGE, flecheOuverte, type Jeu, type RapportMission } from '../core/jeu';
import type { Lignee } from '../core/types';
import { miniature, portrait } from './art';
import { feuilleGuide, trouveesDe } from './guide';
import { ICO, icone, type Icone } from './icones';
import { feuilleNom } from './classements';
import { cristalAllume, cristalRail, entreeFiche, feuilleFiche } from './fiche';
import { COULEUR, ICONE_MUET, ICONE_SON, panneauCompte, type Compte } from './vue';
import { echap, virgule, texteReplie } from './outils';
import { langue, t as tr, locale, enumerer } from '../core/i18n';

export type Vue = 'archipel' | 'coupe' | 'escouade' | 'rencontre' | 'briefing' | 'accueil' | 'codex' | 'cartes' | 'porteurs' | 'classements' | 'pillages' | 'fleche' | 'recruter' | 'cercle';
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
  selection: import('../core/types').BatimentId | 'port' | null;
  /** le Cercle des quais (3 novembre 2026) : ce qui vient du réseau et l'état de son écran (src/app/cercle.ts) */
  cercle?: import('./cercle').CercleEcran;
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
  /** la difficulté de la fouille (1er novembre 2026) : normale par défaut */
  niveauFouille?: import('../core/jeu').DifficulteFouille;
  epreuve: string | null;
  /** l'Épreuve choisie est tentée au palier Fêlé */
  felee?: boolean;
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
  voletPort?: 'pillages' | 'missions' | 'marees';
  /** les contrats de marée (31 octobre 2026) : la marée affichée, l'équipe composée par contrat, l'épreuve dont on choisit le Porteur */
  mareeRang?: import('../core/jeu').RangMaree;
  mareeEquipe?: Record<string, (string | null)[]>;
  mareePlace?: number | null;
  /** les garnisons des vrais directeurs à portée, lues en ligne (vide sans compte) */
  pillagesEnLigne?: import('../core/jeu').Cible[];
  /** la feuille des Vestiges d'une Strate est ouverte (Tour, 31 octobre 2026) */
  vestiges?: number | null;
  /** la fiche d'une ressource du haut est ouverte (22 octobre 2026) */
  ressource?: Ressource | null;
  /** le Mur des empreintes : la famille ouverte (7 novembre 2026) */
  famille?: string | null;
  /** les Basses : la feuille de l'écluse est ouverte, et le lieu dont on choisit le Porteur */
  basses?: boolean;
  bassesLieu?: string | null;
  /** la présentation des Basses rouverte à la demande (« ? ») */
  bassesAide?: boolean;
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
  /** le bâtiment à ouvrir quand la feuille du pseudo se ferme (arrivée au district) */
  apresPseudo?: 'generateur' | null;
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

export const ent = (n: number) => Math.floor(n).toLocaleString(locale()).replace(/\u202f/g, '\u00a0');
export const duree = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 86_400) return `${Math.floor(s / 86_400)} ${langue() === 'en' ? 'd' : 'j'} ${Math.floor((s % 86_400) / 3600)} h`;
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
export const NOM_PHASE: Record<PhaseVoyage, string> = { aller: tr('En route'), fouille: tr('Fouille sur place'), retour: tr('Sur le retour'), quai: tr('À quai') };

export const NOM_LIGNEE: Record<Lignee, string> = { tech: tr('Augmenté'), bio: tr('Géné'), reso: tr('Résonant') };
export const NOM_LIGNEES: Record<Lignee, string> = { tech: tr('Augmentés'), bio: tr('Génés'), reso: tr('Résonants') };

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

/** Un prix en cristaux (et Éclats) : depuis le 9 novembre 2026, `energie` et `composants` d'un coût se paient tous deux en cristaux */
export function couts(j: Jeu, c: { energie?: number; composants?: number; eclats?: number }): string {
  const cr = (c.energie ?? 0) + (c.composants ?? 0);
  return (cr ? prix('energie', cr, j.energie >= cr, 'cristaux') : '')
    + (c.eclats ? prix('eclats', c.eclats, j.eclats >= c.eclats, tr('Éclats')) : '');
}

/** La barre des ressources, toujours en haut */
type Ressource = 'energie' | 'composants' | 'eclats' | 'strate' | 'confiance' | 'butin';

function hud(j: Jeu, ouverte: Ressource | null = null): string {
  const taille = Math.floor(j.composants);
  const b = (r: Ressource, extra: string, label: string) =>
    `<button type="button" class="res ${r}${extra}" data-action="ressource" data-id="${r}" data-gain="${r}" aria-expanded="${ouverte === r}" aria-label="${label}">`;
  return `<header class="hud" aria-label="${tr`Ressources`}">`
    + b('energie', '', tr`Cristaux : ${ent(j.energie)}${taille ? tr`, et ${ent(taille)} de minerai en taille au Générateur` : ''}. Détails`) + `${icone('energie')}<span class="v">${ent(j.energie)}</span>`
    + `<small${taille ? ' class="taille"' : ''}>${taille ? `${ICO.composants}+${ent(taille)}` : 'cristaux'}</small></button>`
    + b('eclats', '', tr`Éclats : ${ent(j.eclats)}. Détails`) + `${icone('eclats')}<span class="v">${ent(j.eclats)}</span><small>${tr`Éclats`}</small></button>`
    + b('strate', ' abysse', tr`Strate −${j.strate}. Détails`) + `${icone('strate')}<span class="v">−${j.strate}</span><small>${tr`Strate`}</small></button>`
    + roueConfiance(j, b)
    + `</header>`;
}

/**
 * Les familles qui te suivent, dans la barre du haut (30 octobre 2026 ; des familles nommées depuis le 7 novembre 2026) :
 * le nombre de familles au centre d'une roue qui se remplit vers le palier suivant, le palier dessous. Elle ne fait que monter.
 */
function roueConfiance(j: Jeu, b: (r: Ressource, extra: string, label: string) => string): string {
  if (!j.chambre) return '';
  const f = nbFoyers(j);
  const n = niveauConfiance(f);
  const p = n.requis ? Math.round((100 * n.dans) / n.requis) : 100;
  return b('confiance', '', tr`${f} familles sur ${CONFIANCE.population} te suivent, palier ${n.niveau}. Détails`)
    + `<span class="roue-confiance" style="--p:${p}%" aria-hidden="true"><b>${f}</b></span><small>${tr`palier ${n.niveau}`}</small></button>`;
}

/** D'où viennent les familles, pour le bilan de la Nuit des lignes (points de bouche-à-oreille) */
const NOMS_SOURCE: Record<SourceHabitants, string> = {
  pompes: tr('Les pompes ont tenu'), basses: tr('Des familles ramenées des Basses'), naufrages: tr('Des naufragés recueillis'), gardiens: tr('Des gardiens vaincus'), rencontres: tr('Des choix justes en bas'),
  defense: tr('Des pillages repoussés'), fleche: tr('Des quais gagnés sur la Flèche'), histoire: tr('L’histoire du district'),
};

/** Ce que chaque palier apporte en plus du creuseur volontaire et du souvenir de famille */
const PALIERS_CONFIANCE: Record<number, string> = {
  [ACCORD_OUVERT.confiance]: tr`L’Accord ouvert : avec la Clinique au niveau ${ACCORD_OUVERT.clinique}, un nouveau Résonant rejoint le district.`,
  [CONFIANCE.comptoir]: tr('Un marchand du quartier rouvre son étal : une carte de plus chaque jour au Comptoir.'),
  8: tr('Tout le district te suit. Le jour où tu réclameras l’île, personne ne restera en bas.'),
};

/** Le bilan de la dernière Nuit des lignes */
function blocNuit(j: Jeu): string {
  const n = j.lignes?.derniere;
  const cette = j.lignes && j.lignes.semaine === semaineDe(Date.now()) ? (j.lignes.familles?.length ?? 0) : 0;
  const lignes = n ? (Object.entries(n.sources) as [SourceHabitants, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([k]) => `<li><span>${NOMS_SOURCE[k]}</span></li>`).join('') : '';
  // un bilan d'avant le 7 novembre 2026 comptait des habitants : on n'en garde que la liste des raisons
  const venues = n?.familles ? n.gagnes + n.bonus : null;
  return `<section class="fb-bloc nuit-lignes"><h3 class="titre-bloc">${ICO.district}${tr`La Nuit des lignes`}</h3>`
    + texteReplie(tr`Chaque lundi, le district repeint sa ligne bleue un peu plus haut et fait le bilan. Ceux qui ont vu ce que tu as fait en parlent : ${Math.round(CONFIANCE.nuit * 100)} % de bouche-à-oreille en plus. Une semaine sans rien ne fait rien perdre.`, 'nuit-lignes', 'fb-vide')
    + `<p class="nuit-semaine">${tr`Cette semaine :`} <b>${cette}</b> ${tr`famille${cette > 1 ? 's' : ''} arrivée${cette > 1 ? 's' : ''} pour l’instant.`}</p>`
    + (n ? `<h4 class="nuit-titre">${tr`La dernière Nuit${venues !== null ? tr` · ${venues} famille${venues > 1 ? 's' : ''}` : ''}`}</h4><ul class="nuit-liste">${lignes}${n.bonus && n.familles ? `<li class="nuit-bonus"><span>${tr`Ceux qui ont vu, cette nuit-là`}</span><b>+${n.bonus}</b></li>` : ''}</ul>` : '')
    + `</section>`;
}

/** La fiche d'une ressource : ce que c'est, ce qu'on a, comment en gagner, à quoi elle sert */
function feuilleRessource(j: Jeu, r: Ressource | null | undefined, famille: string | null = null): string {
  if (!r) return '';
  const ligne = (ico: Icone, titre: string, texte: string) => `<li>${ICO[ico] ?? ''}<span><strong>${titre}</strong><small>${texte}</small></span></li>`;
  let surtitre = '', titre = '', resume = '', gagner: string[] = [], servir: string[] = [], etat = '';
  // 9 novembre 2026 : l'économie à cristal unique. Une seule fiche : les cristaux, et le minerai qui attend d'être taillé
  if (r === 'energie' || r === 'composants') {
    const t = brutEnAttente(j);
    surtitre = tr('LA MONNAIE DU DISTRICT'); titre = tr('Les cristaux');
    resume = tr('La pierre bleue des profondeurs, taillée par le Générateur. Tout ce que tu rapportes en jouant arrive en minerai ; le Générateur le taille en cristaux, même quand tu ne joues pas. Rien ne se perd. Les cristaux paient tout.');
    etat = `<b>${ent(j.energie)}</b> ${tr`cristaux`}<small>${t.brut ? tr`+${ent(t.brut)} de minerai en taille · tout taillé dans ${t.heures} h` : tr('Aucun minerai en attente : descends ou envoie une barque pour en rapporter')}</small>`;
    gagner = [ligne('strate', tr('Les expéditions'), tr('Chaque combat gagné, chaque cache et chaque salle d’archives rapportent du minerai. Fuir en garde les trois quarts, une défaite la moitié.')),
      ligne('porteurs', tr('Les missions en mer et les marées'), tr('Les barques reviennent chargées des ruines noyées.')),
      ligne('cristal', tr('Les fouilles ciblées'), tr('Une descente courte qui peut viser le minerai.')),
      ligne('recycler', tr('Recycler des doublons'), tr('Chaque doublon recyclé rend un peu de minerai.')),
      ligne('boost', tr('Le Générateur taille le minerai'), tr('Plus il est haut, plus il taille vite. Un Augmenté posté dessus taille deux fois plus vite. Dès le niveau 4, il y recueille aussi quelques Éclats.')),
      ligne('coffre', tr('Les récompenses arrivent taillées'), tr('Ravitaillement du jour, Butin de la semaine, objectifs, gardiens, Flèche : des cristaux tout prêts.'))];
    servir = [ligne('marteau', tr('Améliorer les bâtiments'), tr('La plus grosse dépense ; les derniers niveaux demandent aussi des Éclats.')),
      ligne('cartes', tr('Monter les cartes de niveau'), tr('Avec leurs doublons.')),
      ligne('cartes', tr('Acheter au Comptoir'), tr('Des cartes précises à prix fixe, et quelques Éclats chaque jour.')),
      ligne('marteau', tr('Refabriquer une carte à la Forge'), tr('De 27 cristaux (fer) à 1 330 (nacre).')),
      ligne('monter', tr('Entraîner un Porteur'), tr('À la Tour du Noyau : une séance = un niveau, payée au lancement.')),
      ligne('soin', tr('Les soins intensifs'), tr('À la Clinique : 1 cristal par point d’Usure effacé tout de suite.')),
      ligne('grappin', tr('Un jeton de pillage de plus'), tr('Deux fois par jour au plus.'))];
  } else if (r === 'eclats') {
    surtitre = tr('RESSOURCE RARE'); titre = tr('Les Éclats');
    resume = tr('Des fragments de cristal chargés d’empreintes. Rares, ils ne se trouvent qu’en profondeur ou en récompense.');
    etat = `<b>${ent(j.eclats)}</b><small>${tr`Éclats en réserve`}</small>`;
    gagner = [ligne('strate', tr('Les gardiens'), tr('Chaque gardien vaincu en donne, davantage à partir de la Strate −5.')),
      ligne('coffre', tr('Les caches et les rencontres'), tr('À partir de la Strate −3, une cache en cache parfois un.')),
      ligne('cristal', tr('Les fouilles « Éclats » et le Butin de la semaine'), tr('Pour en gagner quand on bloque.'))];
    servir = [ligne('marteau', tr('Refabriquer les cartes rares'), tr('Argent, or et nacre en demandent à la Forge.')),
      ligne('cartes', tr('Les cartes en argent du Comptoir'), tr('Elles coûtent aussi des Éclats.')),
      ligne('marteau', tr('Les grands chantiers'), tr('Les derniers niveaux des bâtiments.'))];
  } else if (r === 'confiance') {
    const f = nbFoyers(j);
    const n = niveauConfiance(f);
    surtitre = tr('LE DISTRICT'); titre = tr('Ceux qui te suivent');
    resume = tr('L’eau monte, et tout le district le sait. Chaque famille que tu protèges décide de te suivre, et ne te quitte plus. Le jour où tu réclameras l’île, elles monteront avec toi.');
    etat = `<b>${f}</b> ${tr`/ ${CONFIANCE.population} familles`}<small>${nomConfiance(n.niveau)}${n.requis ? tr` · encore ${n.requis - n.dans} pour le palier ${n.niveau + 1}` : ''}</small>`;
    gagner = [ligne('district', tr('Aller les chercher dans les Basses'), tr('À l’écluse, garde un secteur à sec avec le batardeau et envoie un Porteur : chaque lieu cache une famille restée en bas.')),
      ligne('porteurs', tr('Recueillir des naufragés'), tr('Une mission « Naufragés » depuis le Port : le quartier voit la barque rentrer.')),
      ligne('porte', tr('Vaincre les gardiens'), tr('Chaque gardien vaincu de −1 à −10 : l’espoir de l’Écluse grandit.')),
      ligne('cristal', tr('Les choix justes en bas'), tr('Aider ceux qu’on croise se sait au quartier.')),
      ligne('boost', tr('Repousser un pillage'), tr('Quand la garnison du Port tient.')),
      ligne('monter', tr('Gagner des quais sur la Flèche'), tr('De la place sur les îles.'))];
    servir = Array.from({ length: CONFIANCE.population / CONFIANCE.palier }, (_, k) => {
      const p = k + 1;
      const fait = n.niveau >= p;
      return `<li class="${fait ? 'fait' : ''}">${ICO[fait ? 'ouvrier' : 'verrou'] ?? ''}<span><strong>${tr`${p * CONFIANCE.palier} familles${NOMS_CONFIANCE[p] ? ` · ${NOMS_CONFIANCE[p]}` : ''}`}</strong><small>${PALIERS_CONFIANCE[p] ? tr`${PALIERS_CONFIANCE[p]} Avec un creuseur volontaire et un souvenir pour les Archives.` : tr('Un creuseur volontaire et un souvenir pour les Archives.')}</small></span></li>`;
    });
  } else if (r === 'butin') {
    // 28 octobre 2026 (Bryan : « c'est quoi en fait l'Archive de la semaine ») : la fiche explique tout, sans rien à deviner
    const pts = j.archive.points;
    const prochain = ARCHIVE.paliers.find((p) => pts < p);
    const atteints = ARCHIVE.paliers.filter((p) => pts >= p).length;
    surtitre = tr('CHAQUE SEMAINE'); titre = tr('Le Butin de la semaine');
    resume = tr`Tout ce que tu fais cette semaine remplit un coffre. Chaque cran atteint y ajoute des récompenses. Lundi, le coffre s’ouvre au district et une nouvelle semaine repart de zéro. Rien n’est jamais perdu : un cran atteint reste acquis, et un coffre pas encore ouvert attend le suivant (jusqu’à ${ARCHIVE.empilesMax}).`;
    etat = `<b>${pts}</b> / ${ARCHIVE.paliers[ARCHIVE.paliers.length - 1]}<small>${tr`${prochain ? tr`Encore ${prochain - pts} points pour le cran ${atteints + 1}` : tr('Tous les crans sont atteints : bravo')} · s’ouvre lundi`}</small>`;
    gagner = [ligne('porte', tr('Gagner un combat en bas'), tr`+${ARCHIVE.points.combat} points.`),
      ligne('strate', tr('Finir une descente'), tr`+${ARCHIVE.points.expedition} points.`),
      ligne('marteau', tr('Finir un chantier'), tr`+${ARCHIVE.points.chantier} points.`),
      ligne('cartes', tr('Remplir l’objectif du jour'), tr`+${ARCHIVE.points.quotidien} points.`)];
    const d = ARCHIVE.paliers;
    servir = [ligne('coffre', tr`Cran 1 · ${d[0]} points`, tr`${ARCHIVE.composants} cristaux et une carte au choix parmi trois.`),
      ligne('cristal', tr`Cran 2 · ${d[1]} points`, tr`${ARCHIVE.eclatsPalier2} Éclats en plus.`),
      ligne('cartes', tr`Cran 3 · ${d[2]} points`, tr('Une deuxième carte au choix, dont au moins une en argent.')),
      ligne('boost', tr`Cran 4 · ${d[3]} points`, tr`Une troisième carte au choix avec de l’argent, et ${ARCHIVE.eclatsPalier4} Éclats de plus. Pour les plus assidus.`)];
  } else {
    const manque = manquePourCreuser(j);
    surtitre = 'PROFONDEUR'; titre = tr`La Strate −${j.strate}`;
    resume = tr('L’étage le plus profond que ton district a creusé sous la ville. Plus on descend, plus c’est ancien, dangereux et précieux.');
    etat = `<b>−${j.strate}</b><small>${j.frontVaincu ? (manque ? tr`Gardien vaincu : il manque ${enumerer([manque.creuseurs ? tr`${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}` : '', manque.noyau ? tr`${manque.noyau} niveau${manque.noyau > 1 ? 'x' : ''} de Tour du Noyau` : ''].filter(Boolean))} pour creuser plus bas` : tr('Prête à être creusée plus bas')) : tr`Bats son gardien pour pouvoir creuser l’étage suivant`}</small>`;
    gagner = [ligne('porte', tr('Vaincre le gardien'), tr`Le gardien de la Strate −${j.strate} garde l’accès à l’étage suivant.`),
      ligne('ouvrier', tr`Assez de creuseurs (${j.creuseurs ?? 0} / ${creuseursRequis(j.strate + 1)})`, tr`La Tour du Noyau en loge ${logementCreuseurs(j)}. On en gagne avec les fouilles, les missions, les Épreuves et les gardiens.`)];
    servir = [ligne('cartes', tr('Des cartes de meilleur métal'), tr('Plus la Strate est profonde, plus les trouvailles sont rares.')),
      ligne('codex', tr('Les Chroniques'), tr('Les chapitres profonds se débloquent en descendant.'))];
  }
  return `<div class="voile-feuille" data-action="ressource" data-id="" aria-hidden="true"></div><section class="feuille ressource-fiche res-${r}" role="dialog" aria-modal="true" aria-labelledby="res-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${surtitre}</span><h2 id="res-titre">${titre}</h2></div><button type="button" class="btn-icone" data-action="ressource" data-id="" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps"><div class="res-etat">${icone(r === 'confiance' ? 'district' : r === 'butin' ? 'coffre' : r)}<span>${etat}</span></div>${texteReplie(resume, `res-${r}`, 'res-resume')}`
    + (r === 'confiance' ? blocMur(j, famille) + blocNuit(j) : '')
    + `<h3 class="titre-bloc">${r === 'butin' ? tr('Comment gagner des points') : tr('Comment en obtenir')}</h3><ul class="res-liste">${gagner.join('')}</ul>`
    + `<h3 class="titre-bloc">${r === 'butin' ? tr('Ce que contient le coffre') : r === 'confiance' ? tr('Les paliers') : tr('À quoi ça sert')}</h3>`
    + (r === 'confiance' ? `<p class="res-resume">${tr`Toutes les 6 familles, un palier : un creuseur volontaire, et une famille confie un souvenir aux Archives.`}</p>` : '') + `<ul class="res-liste">${servir.join('')}</ul>`
    + (r === 'strate' ? `<button type="button" class="btn sec large" data-action="classements" data-id="profondeur">${ICO.monter}${tr`Voir le classement des profondeurs`}</button>` : '')
    + `</div></section>`;
}

/** la Strate vaincue à partir de laquelle l'onglet de la Flèche se montre (fermé jusqu'à −6) */
const FLECHE_VISIBLE = 3;

const ONGLETS: { vue: Vue | 'plus'; nom: string; icone: Icone }[] = [
  { vue: 'archipel', nom: tr('District'), icone: 'district' },
  { vue: 'coupe', nom: tr('Tour'), icone: 'tour' },
  // Porteurs et Cartes ne font plus qu'un onglet (25 octobre 2026) : l'escouade, ses Porteurs et leurs cartes au même endroit
  { vue: 'porteurs', nom: tr('Escouade'), icone: 'porteurs' },
  // les Pillages et la Flèche ont leur onglet (28 octobre 2026, Bryan) : la carte des archipels voisins ne passe plus par le Port
  { vue: 'pillages', nom: tr('Port'), icone: 'carte' },
  { vue: 'fleche', nom: tr('Flèche'), icone: 'fleche' },
  // les Chroniques juste avant Plus (28 octobre 2026, Bryan) : on y va moins souvent qu'au reste
  { vue: 'codex', nom: tr('Chroniques'), icone: 'codex' },
  { vue: 'plus', nom: tr('Plus'), icone: 'plus' },
];

/**
 * Une pastille « nouveau » ne reste pas allumée tant qu'on n'a pas tout lu ou tout regardé (audit du 7 novembre 2026 :
 * presque tous les onglets en portaient une) : elle s'éteint dès qu'on ouvre l'onglet, et ne revient que si quelque chose
 * de nouveau arrive depuis (un nouveau chapitre, une nouvelle carte). Retenu sur l'appareil.
 */
function nouveau(onglet: 'porteurs' | 'codex', signature: string, e: EcranDistrict): boolean {
  if (!signature) return false;
  const cle = `empreintes.vu.${onglet}`;
  const ouvert = onglet === 'porteurs' ? e.vue === 'porteurs' || e.vue === 'cartes' : e.vue === 'codex';
  try {
    const vus = new Set((localStorage.getItem(cle) ?? '').split(',').filter(Boolean));
    if (ouvert) { for (const x of signature.split(',')) vus.add(x); localStorage.setItem(cle, [...vus].slice(-300).join(',')); return false; }
    return signature.split(',').some((x) => !vus.has(x));
  } catch { return !ouvert; }
}

/** La navigation du bas */
export function navigation(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  const alerte: Partial<Record<Vue | 'plus', boolean>> = {
    archipel: !!(j.forge && e.now >= j.forge.fin) || !!(o && (o.fait(j) || o.onglet === 'archipel')),
    porteurs: !!(o && (o.onglet === 'porteurs' || o.onglet === 'cartes') && !o.fait(j))
      || nouveau('porteurs', [...porteursNouveaux(j), ...(j.chambre ? cartesNouvelles(j) : [])].join(','), e),
    coupe: !!j.expedition || !!(o && o.onglet === 'coupe' && !o.fait(j)),
    codex: nouveau('codex', CHAPITRES.filter((c) => chapitreOuvert(c, j.strate) && !j.lus.includes(c.id)).map((c) => c.id).join(','), e),
    // une pastille quand l'onglet vient de s'ouvrir et qu'on n'y est jamais allé
    pillages: (!!j.chambre && strateVaincue(j) >= PILLAGE.strateDuPort && !j.portVu) || !!(o && o.onglet === 'pillages' && !o.fait(j)),
    fleche: flecheOuverte(j) && !j.fleche,
  };
  const actif = e.menu || e.vue === 'classements' || e.vue === 'recruter' ? 'plus' : e.vue === 'escouade' ? (e.fleche ? 'fleche' : e.pillage ? 'pillages' : 'coupe') : e.vue === 'cartes' ? 'porteurs' : e.vue;
  // sur PC (rail.css) : le cristal en tête (il ouvre la fiche du directeur et s'allume quand une récompense attend : 29 octobre 2026), puis les sept onglets ; la jauge des Strates a cédé sa place aux Pillages
  // et à la Flèche (28 octobre 2026) : la Strate reste dans la barre du haut
  // le premier jour désencombré (4 novembre 2026, après le test critique : sept onglets dont deux fermés dès la première minute) :
  // le Port n'apparaît qu'une fois ouvert (après −1), la Flèche à partir de −3 (on la voit venir avant qu'elle ouvre à −6) ;
  // tant qu'il y a 5 onglets ou moins, chacun garde son nom sous l'icône (classe « noms »)
  const visibles = ONGLETS.filter((t) => (t.vue === 'pillages' ? (!!j.chambre && strateVaincue(j) >= PILLAGE.strateDuPort) || actif === 'pillages'
    : t.vue === 'fleche' ? (!!j.chambre && strateVaincue(j) >= FLECHE_VISIBLE) || flecheOuverte(j) || actif === 'fleche' : true));
  return `<nav class="nav${visibles.length <= 5 ? ' noms' : ''}" style="--onglets:${visibles.length}" aria-label="${tr`Navigation`}">${cristalRail(e)}` + visibles.map((t) => {
    const action = t.vue === 'plus' ? 'menu' : t.vue;
    return `<button type="button" class="onglet${actif === t.vue ? ' actif' : ''}" data-action="${action}"${actif === t.vue ? ' aria-current="page"' : ''}>`
      + `<span class="onglet-ico">${icone(t.icone)}${alerte[t.vue] ? '<i class="pastille-alerte" aria-label="nouveau"></i>'
        // sur téléphone, le cristal n'existe pas : c'est l'onglet Plus (où vit la fiche) qui porte l'appel
        : t.vue === 'plus' && cristalAllume(e) ? `<i class="pastille-alerte appel-fiche" aria-label="${tr('une récompense t’attend')}"></i>` : ''}</span><span class="onglet-nom">${t.nom}</span></button>`;
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
  return `<div class="segments-choix trois volets-escouade" role="tablist" aria-label="${tr`Escouade, Porteurs ou cartes`}">`
    + seg('escouade', 'porteurs', tr('Escouade'))
    + seg('tous', 'porteurs-tous', tr('Porteurs'), neufsP ? ` <span class="pastille-n" aria-label="${tr`${neufsP} nouveau${neufsP > 1 ? 'x' : ''}`}">${neufsP}</span>` : '')
    + seg('cartes', 'cartes', tr('Collection'), neufsC ? ` <span class="pastille-n" aria-label="${tr`${neufsC} nouvelle${neufsC > 1 ? 's' : ''}`}">${neufsC}</span>` : '', !j.chambre)
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
  return `<div class="voile-feuille" data-action="rappel-plus-tard" aria-hidden="true"></div><section class="feuille rappel-compte" role="dialog" aria-modal="true" aria-label="${tr`Protège ta partie`}">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`Strate −${e.j.strate} · ta partie grandit`}</span><h2>${tr`Protège ta partie`}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="rappel-plus-tard" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<p class="rc-texte">${tr`Elle n’est sauvegardée que pour ce téléphone : s’il est perdu ou réinitialisé, elle disparaît. Relie-la à Google ou à un e-mail, en quelques secondes, et tu la retrouveras partout.`}</p>`
    + `<div class="rc-boutons"><button type="button" class="btn prim" data-action="rappel-proteger">${ICO.compte}${tr`Protéger ma partie`}</button>`
    + `<button type="button" class="btn sec" data-action="rappel-plus-tard">${tr`Plus tard`}</button></div></div></section>`;
}

const METAL = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

/** Ce qu'une mission a rapporté, en pastilles (fenêtre du rapport et historique de la Tour) */
export function gainsRapport(r: RapportMission): string {
  return `<ul class="rm-gains">`
    + `<li>${ICO.composants}<b>+${r.composants}</b><small>${tr`minerai`}</small></li>`
    + `<li>${ICO.monter}<b>+${r.xp}</b><small>${tr`XP${r.niveau ? tr` · niveau ${r.niveau}` : ''}`}</small></li>`
    + r.cartes.map((c) => `<li class="rm-carte${c.nouvelle ? ' nouvelle' : ''}">${ICO.cartes}<b>${echap(moduleDef(c.id).nom)}</b><small>${METAL(moduleDef(c.id).rarete)}${c.nouvelle ? tr(' · nouvelle') : tr(' · doublon')}</small></li>`).join('')
    + (r.creuseurs ? `<li>${ICO.ouvrier}<b>+${r.creuseurs}</b><small>${tr`creuseur${r.creuseurs > 1 ? 's' : ''}`}</small></li>` : '')
    + (r.contrat?.choix ? `<li class="rm-carte nouvelle">${ICO.cartes}<b>${tr`3 cartes`}</b><small>${tr`au choix, au district`}</small></li>` : '')
    + (r.contrat && !r.contrat.reussi ? `<li>${ICO.lueur}<b>${tr`+1 Indice`}</b><small>${tr`pour la prochaine tentative`}</small></li>` : '')
    + (r.usure ? `<li class="rm-usure">${ICO.soin}<b>+${virgule(r.usure)}</b><small>${tr`Usure`}</small></li>` : '')
    + `</ul>`;
}

/** Le rapport de mission (28 octobre 2026) : il s'ouvre au district tant qu'un retour n'a pas été lu */
function feuilleRapport(e: EcranDistrict): string {
  const autreChose = e.retour.length || e.menu || e.fiche || e.rappel || e.ressource || e.selection || e.carte || e.deck || e.porteur || e.guide;
  const r = autreChose ? null : rapportALire(e.j);
  if (!r) return '';
  const p = porteurDef(r.porteur);
  const reste = (e.j.rapports ?? []).filter((x) => !x.lu).length - 1;
  const ct = r.contrat;
  const tete = ct
    ? `<span class="rm-equipe">${ct.porteurs.map((x) => avatar(x, 36)).join('')}</span><div class="titres"><span class="surtitre">${tr`${MAREES[ct.rang].nom} · ${ct.taux} % de chances`}</span><h2 id="rm-titre">${echap(ct.titre)} : ${ct.reussi ? tr('réussi') : tr('manqué')}</h2></div>`
    : `${avatar(r.porteur, 48)}<div class="titres"><span class="surtitre">${r.basses ? tr('Les Basses') : tr('Mission en mer')}</span><h2 id="rm-titre">${tr`Retour ${echap(deNom(p.nom))}`}</h2></div>`;
  return `<div class="voile-feuille" data-action="rapport-lu" aria-hidden="true"></div><section class="feuille rapport-mission${ct ? ` rm-contrat${ct.reussi ? ' reussi' : ' manque'}` : ''}" role="dialog" aria-modal="true" aria-labelledby="rm-titre" style="--c:${COULEUR[p.lignee]}">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete">${tete}`
    + `<button type="button" class="btn-icone" data-action="rapport-lu" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="rm-recit">${r.recit.map((l) => `<p>${echap(l)}</p>`).join('')}</div>`
    + gainsRapport(r)
    + `<button type="button" class="btn prim large" data-action="rapport-lu">${reste > 0 ? tr`Rapport suivant (${reste})` : tr('Bien reçu')}</button>`
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
  victoire: [tr('Mission accomplie'), 'victoire'],
  retraite: [tr('Retour au district'), 'retraite'],
  fuite: [tr('Repli précipité'), 'fuite'],
  defaite: [tr('L’escouade a été repoussée'), 'defaite'],
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
    + `<div class="titres"><span class="surtitre">${tr`Rapport · ${echap(r.type)}`}</span><h2 id="rx-titre">${titre}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="expedition-lu" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`;
  if (r.note) h += `<p class="rx-note">${echap(r.note)}</p>`;
  // les ressources
  h += `<ul class="rm-gains rx-res">`
    + ligne(ICO.composants, `+${virgule(g.butin)}`, 'minerai')
    + (g.eclats ? ligne(ICO.eclats, `+${g.eclats}`, tr`Éclat${g.eclats > 1 ? 's' : ''}`) : '')
    + (r.creuseurs ? ligne(ICO.ouvrier, `+${r.creuseurs}`, `creuseur${r.creuseurs > 1 ? 's' : ''}`) : '')
    + (g.fragment ? ligne(ICO.journal, '+1', tr('fragment d’archives')) : '')
    + (g.nouvelleStrate ? ligne(ICO.descendre, `−${e.j.strate}`, tr('nouvelle Strate ouverte'), 'nouvelle') : '')
    + `</ul>`;
  // les cartes trouvées, avec leur face : nouvelle, doublon, ou niveau suivant prêt
  if (g.cartes.length) {
    h += `<h3 class="rx-titre">${ICO.cartes}${g.cartes.length > 1 ? tr`${g.cartes.length} cartes trouvées` : tr('Une carte trouvée')}</h3><div class="rx-cartes">`;
    const vues = new Set<string>();
    for (const id of g.cartes) {
      const c = e.j.collection[id];
      const neuve = r.nouvelles.includes(id) && !vues.has(id);
      vues.add(id);
      const requis = c ? doublonsRequis(id, c.niveau) : null;
      const pret = !neuve && c && requis !== null && c.doublons >= requis;
      h += `<div class="rx-carte${neuve ? ' neuve' : ''}">`
        + faceRapport(e.j, id) + `<span class="ruban">${neuve ? tr('Nouvelle') : pret ? tr`Niv. ${c!.niveau + 1} prêt` : tr('Doublon')}</span></div>`;
    }
    h += `</div>`;
  }
  if (r.choix) h += `<p class="rx-choix">${ICO.cartes}<span><b>${r.choix > 1 ? tr`${r.choix} cartes au choix` : tr('Une carte au choix')}</b> ${tr`t’attend${r.choix > 1 ? 'ent' : ''} au district : le choix se fait juste après.`}</span></p>`;
  // l'escouade : l'XP de chacun, et les niveaux pris
  if (g.xp?.length) {
    h += `<h3 class="rx-titre">${ICO.monter}${tr`L’escouade · +${g.xp[0]!.xp} XP`}</h3><ul class="rx-escouade">`
      + g.xp.map((x) => `<li class="${x.niveau ? 'monte' : ''}">${avatar(x.id, 40)}<span><b>${echap(porteurDef(x.id).nom)}</b><small>${x.niveau ? tr`Niveau ${x.niveau} !` : `+${x.xp} XP`}</small></span></li>`).join('')
      + `</ul>`;
  }
  // la Strate : quête, Vestiges, étoiles, Rôdeur
  const strate: string[] = [];
  if (g.quete) strate.push(ligne(ICO.quete, g.quete.finie ? tr('Achevée') : `${g.quete.etape} / ${g.quete.total}`, tr`quête « ${echap(g.quete.nom)} »`, g.quete.finie ? 'nouvelle' : ''));
  if (ex?.vestiges.length) strate.push(ligne(ICO.vestige, `+${ex.vestiges.length}`, tr`Vestige${ex.vestiges.length > 1 ? 's' : ''} : ${echap(ex.vestiges.map((v) => vestigeDef(v)?.nom ?? '').join(', '))}`));
  if (ex?.releve) strate.push(ligne(ICO.vestige, `−${ex.releve}`, tr('Strate complète'), 'nouvelle'));
  if (ex?.etoiles.length) strate.push(ligne(ICO.etoile, `+${ex.etoiles.length}`, tr`étoile${ex.etoiles.length > 1 ? 's' : ''} de Strate`, 'nouvelle'));
  if (ex?.rodeur) strate.push(ligne(ICO.griffes, ex.rodeur.part ? `${Math.round(ex.rodeur.part * 100)} %` : tr('Abattu'), `${echap(ennemiDef(ex.rodeur.id).nom)}${ex.rodeur.part ? tr(' s’est enfui') : ''}`));
  if (strate.length) h += `<h3 class="rx-titre">${ICO.strate}${tr`Dans la Strate`}</h3><ul class="rm-gains">${strate.join('')}</ul>`;
  // après une défaite ou un repli (3 novembre 2026) : que faire maintenant, au lieu d'un simple « +0 composants »
  if (r.issue === 'defaite' || r.issue === 'fuite') {
    const nonLus = chapitresALire(e.j);
    h += `<h3 class="rx-titre">${ICO.soin}${tr`Et maintenant ?`}</h3><ul class="rx-conseils">`
      + `<li><b>${tr`Soigner l’escouade.`}</b> ${tr`Elle se remet à la Clinique ; une recrue Géné postée là soigne deux fois plus vite.`}</li>`
      + (nonLus ? `<li><b>${tr`Renforcer le deck.`}</b> ${tr`Chaque chapitre des Chroniques lu pour la première fois glisse une carte entre les pages (${nonLus} à lire) : confie-la ensuite à un Porteur, dans l’onglet Escouade.`}</li>` : `<li><b>${tr`Revoir le deck.`}</b> ${tr`Cherche des suites de Fréquences et quelques boucliers pour les grosses attaques annoncées.`}</li>`)
      + `<li><b>${tr`Se protéger.`}</b> ${tr`Les boucliers protègent toute l’escouade : garde-les pour les attaques fortes annoncées par l’ennemi.`}</li></ul>`
      + `<div class="rx-actions"><button type="button" class="btn sec" data-action="depart-clinique">${ICO.soin}${tr`Clinique`}</button>`
      + (nonLus ? `<button type="button" class="btn sec" data-action="rapport-chroniques">${ICO.journal}${tr`Chroniques`}</button>` : '') + `</div>`;
  }
  return h + `<button type="button" class="btn prim large" data-action="expedition-lu">${r.choix ? tr('Choisir ma carte') : tr('Bien reçu')}</button></div></section>`;
}

/** Le menu « Plus » : compte, intro, journal */
export function menu(e: EcranDistrict): string {
  if (!e.menu) return '';
  const c = e.compte;
  let h = `<div class="voile-feuille" data-action="menu" aria-hidden="true"></div><section class="feuille menu" role="dialog" aria-modal="true" aria-label="${tr`Menu`}">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`OSSYRA · ALPHA`}</span><h2>${tr`Menu`}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="menu" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`;
  h += entreeFiche(e) + `<div class="liste-menu">`
    + `<button type="button" class="ligne-menu gt-menu" data-action="classements">${ICO.monter}<span><strong>${tr`Le Grand Tableau`}</strong><small>${tr`Les classements des directeurs : profondeur, Registre, Joutes et Flèche`}</small></span></button>`
    // le Cercle des quais (3 novembre 2026) : un raccourci, une fois la Strate −2 vaincue (le bâtiment reste sur la Cuvette)
    + (c.actif && strateVaincue(e.j) >= CERCLE_OUVERTURE ? `<button type="button" class="ligne-menu cr-menu" data-action="${e.j.batiments.cercle ? 'cercle' : 'cercle-batiment'}">${ICO.cercle}<span><strong>${tr`Le Cercle des quais`}</strong><small>${e.j.batiments.cercle ? tr('Tes amis, les duels entre directeurs et les échanges de cartes') : tr('À construire : amis, duels et échanges de cartes')}</small></span>${e.cercle?.aRepondre ? `<span class="pastille-n">${e.cercle.aRepondre}</span>` : ''}</button>` : '')
    + (c.actif ? `<button type="button" class="ligne-menu rc-menu" data-action="recruter">${ICO.porteurs}<span><strong>${tr`Recruter des amis`}</strong><small>${tr`Ton code de parrainage : vous êtes récompensés tous les deux quand ton ami joue`}</small></span></button>` : '')
    + (c.actif ? `<button type="button" class="ligne-menu" data-action="compte" aria-expanded="${c.ouvert}">${ICO.compte}<span><strong>${tr`Compte`}</strong><small>${c.utilisateur?.anonyme ? tr('Protège ta partie : relie-la à Google ou à un e-mail') : c.utilisateur ? `${tr('Connecté')}${c.pseudo ? ` : ${echap(c.pseudo)}` : tr(' · choisis ton pseudo')}` : tr('Retrouver ta progression sur un autre appareil')}</small></span></button>` : '')
    + (e.j.chambre ? `<button type="button" class="ligne-menu" data-action="accueil">${icone('district')}<span><strong>${tr`Comment marche le district`}</strong><small>${tr`Les ressources, l’escouade et le but : creuser plus bas`}</small></span></button>` : '')
    // le glossaire (31 octobre 2026, Luc) : tous les mots du jeu, avec une recherche
    + `<button type="button" class="ligne-menu" data-action="guide" data-id="glossaire">${ICO.aide}<span><strong>${tr`Glossaire`}</strong><small>${tr`Tous les mots du jeu expliqués : Fissure, Flux, Résonance, Charge…`}</small></span></button>`
    + `<button type="button" class="ligne-menu" data-action="intro">${ICO.film}<span><strong>${tr`Revoir l’intro complète`}</strong><small>${tr`L’histoire de 2121, en entier`}</small></span></button></div>`;
  // les paramètres (31 octobre 2026) : le combat automatique est une option, éteinte au départ
  const auto = autoActif();
  h += `<section class="bloc parametres"><h3 class="titre-bloc">${ICO.cristal}${tr`Paramètres`}</h3><div class="liste-menu">`
    + `<button type="button" class="ligne-menu option" data-action="option-auto" role="switch" aria-checked="${auto}">${ICO.lancer}<span><strong>${tr`Combat automatique`}</strong><small>${tr`Un bouton « Auto » dans les combats ordinaires des Strates déjà vaincues : l’escouade joue seule, en accéléré`}</small></span><i class="interrupteur" aria-hidden="true"></i></button>`
    // les graphismes (3 novembre 2026) : Auto, Complets ou Légers, pour les appareils qui peinent
    + (() => { const g = texteGraphismes(); return `<button type="button" class="ligne-menu option" data-action="option-graphismes" aria-label="${tr`Graphismes : ${g.valeur}. Toucher pour changer`}">${ICO.lueur}<span><strong>${tr`Graphismes`}</strong><small>${g.detail}</small></span><b class="valeur-option">${g.valeur}</b></button>`; })()
    // le son et les animations (audit du 7 novembre 2026) : réglables hors combat
    + `<button type="button" class="ligne-menu option" data-action="option-son" role="switch" aria-checked="${sonActif()}">${sonActif() ? ICONE_SON : ICONE_MUET}<span><strong>${tr`Son`}</strong><small>${tr`Les sons du combat et de l’interface`}</small></span><b class="valeur-option">${sonActif() ? tr('Activé') : tr('Coupé')}</b></button>`
    + `<button type="button" class="ligne-menu option" data-action="option-animations" role="switch" aria-checked="${!animationsReduites()}">${ICO.lueur}<span><strong>${tr`Animations`}</strong><small>${animationsReduites() ? tr('Réduites : presque rien ne bouge, les combats vont droit au résultat') : tr('Complètes : la houle, les lueurs, les coups animés')}</small></span><b class="valeur-option">${animationsReduites() ? tr('Réduites') : tr('Complètes')}</b></button>`
    // la langue (9 novembre 2026) : écrite dans les deux langues, pour qu'on la retrouve même sans lire celle affichée
    + (langueReglable() ? `<button type="button" class="ligne-menu option" data-action="option-langue" aria-label="Langue · Language : ${NOMS_LANGUES[langue()]}">${ICO.carte}<span><strong>Langue · Language</strong><small>${tr`Le jeu se recharge dans l’autre langue ; ta partie ne change pas`}</small></span><b class="valeur-option">${NOMS_LANGUES[langue()]}</b></button>` : '')
    + `</div></section>`;
  h += panneauCompte(c);
  // le journal du district est passé dans la fiche du directeur (audit du 7 novembre 2026) : le menu ne garde que les réglages et les raccourcis
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
  return `<div class="ecran ${classe}">${hud(e.j, e.ressource ?? null)}<main class="contenu">${contenu}</main>${guide}${toast(e.message)}${navigation(e)}${menu(e)}${feuilleRessource(e.j, e.ressource, e.famille ?? null)}${pseudo}${feuilleRappel(e)}${e.expedition ? feuilleExpedition(e) : feuilleRapport(e)}${feuilleFiche(e)}</div>`;
}
