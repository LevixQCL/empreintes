// Couche 1 — l'état d'une partie : réglages du district, types, expérience et Marques des Porteurs, Confiance, creuseurs, escouade.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, porteurDef, PORTEURS, deNom } from '../donnees';
import { PLACES_PORTEUR, chargeNiveau, poidsCarte, type CarteCollection } from '../collection';
import type { Expedition } from '../expedition';
import type { Palmares } from '../classements';
import type { BatimentId, GesteDef, BonusMarques, Rarete } from '../types';
import { FAMILLES_QUARTIER, familleDef } from '../familles';
import { t as tr, minuscule } from '../i18n';

export const VERSION_JEU = 13;

/** Réglages du district, au même endroit pour l'équilibrage */
export const DISTRICT = {
  /** Économie à cristal unique (9 novembre 2026, docs/economie-cristal.md) : le Générateur ne produit plus d'énergie,
   *  il taille le minerai rapporté en jouant (`Jeu.composants`) en cristaux (`Jeu.energie`), 1 pour 1.
   *  Relu par un game designer : il ne doit jamais freiner celui qui joue beaucoup. Son niveau fixe donc le temps qu'il met
   *  à tailler ce qui attend (chaque heure, une part `1/heures` du minerai, au moins `taillePlancher` cristaux) : 16 h au niveau 1,
   *  4 h au niveau 10. Rien ne se perd, il n'y a plus de réserve. Le lot d'une session est taillé en une nuit. */
  tailleHeures: [0, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4],
  /** en taillant, le Générateur recueille des Éclats dans le minerai (9 novembre 2026, à la place de la cristallisation) :
   *  un tous les `eclatTous` cristaux taillés, au plus `eclatsParJour[niveau]` par jour (rien avant le niveau 4) */
  eclatTous: 300,
  eclatsParJour: [0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3],
  taillePlancher: [0, 10, 14, 20, 26, 32, 40, 48, 58, 68, 80],
  /** points d'Usure soignés par heure selon le niveau de la Clinique */
  soinParHeure: [0, 6, 10, 16, 22, 30, 36, 42, 48, 55, 62],
  /** la Forge refabrique 25 % plus vite par niveau */
  forgeParNiveau: 0.25,
  /** La Tour ne monte à certains niveaux qu'une fois un gardien vaincu (niveau visé → Strate). 10 novembre 2026 (compte rendu de partie,
   *  validé par Bryan) : l'âge 2 du district arrivait le premier jour, après quelques heures. Niveau 4 après le gardien de −3 : jour 3 ou 4.
   *  Raison dans l'histoire : une contrainte technique, les nouvelles fondations s'ancrent dans la roche de cette Strate. */
  tourApresGardien: { 4: 3 } as Record<number, number>,
  /** durée du chantier pour atteindre un niveau, en minutes (index = niveau visé) */
  chantierMinutes: [0, 0, 0, 5, 30, 120, 240, 720, 1440, 2160, 2880],
  /** chantiers en même temps : 1, puis 2 à partir du Noyau niveau 4 */
  chantiersNoyau2: 4,
  /** bonus d'un Porteur posté : de la bonne lignée / d'une autre lignée */
  bonusAffinite: 2,
  bonusPoste: 1.5,
  /** Usure (30 octobre 2026, demande de Bryan) : les PV perdus en bas restent perdus au retour, la Clinique les rend au repos.
   *  En plus des PV perdus : un malus si le Porteur finit à terre, et un autre si l'escouade fuit (`usureFuite`). */
  usureATerre: 3,
  /** part de ses PV qu'un Porteur doit avoir retrouvée pour redescendre (un Porteur à terre reste d'abord à la Clinique) */
  pvMinDepart: 0.25,
  /** cartes qu'un Porteur peut porter (décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue) ;
   *  ce sont aussi ses places en combat, remplies ou vides (`PLACES_PORTEUR`) */
  cartesMax: PLACES_PORTEUR,
  /** cartes qu'il faut au deck de l'escouade (cartes du district comprises) pour descendre */
  deckMin: 12,
  /** part du butin gardée après une défaite (10 novembre 2026 : la moitié → un tiers, perdre ne coûtait presque rien) */
  butinDefaite: 1 / 3,
  /** fuir un combat jusqu'au district (22 octobre 2026) : part des composants gardée, et Usure en plus pour chaque Porteur */
  butinFuite: 0.75,
  usureFuite: 3,
  /** au départ : des cristaux (`energie`) et pas de brut (`composants`) (9 novembre 2026) */
  depart: { energie: 50, composants: 0 },
} as const;

/** Points d'Archive gagnés, et paliers de la semaine */
export const ARCHIVE = {
  points: { combat: 2, expedition: 5, chantier: 3, quotidien: 5 },
  /** le 4e palier récompense les joueurs assidus : un choix d'argent de plus et des Éclats */
  paliers: [30, 80, 160, 300],
  /** Butins de la semaine gardés au plus (audit du 7 novembre 2026 : avant, un Butin non ouvert était écrasé par le suivant) */
  empilesMax: 4,
  /** ce que contient le Butin : composants toujours, Éclats aux paliers 2 et 4 */
  composants: 40, eclatsPalier2: 3, eclatsPalier4: 5,
} as const;

/** Lundi 5 janvier 2026, 4 h du matin à Bruxelles : point de départ des jours et des semaines du jeu */
const EPOQUE = Date.UTC(2026, 0, 5, 3);
export const jourDe = (now: number) => Math.floor((now - EPOQUE) / 86_400_000);
export const semaineDe = (now: number) => Math.floor(jourDe(now) / 7);
/** Le début d'un jour du jeu, en ms (4 h du matin à Bruxelles) */
export const debutJour = (jour: number) => EPOQUE + jour * 86_400_000;
/** Début de la semaine suivante, en ms */
export const lundiSuivant = (now: number) => EPOQUE + (semaineDe(now) + 1) * 7 * 86_400_000;

/** Les postes du district : les trois bâtiments qui produisent (POSTES), et l'entraînement à la Tour du Noyau */
export type Poste = Exclude<BatimentId, 'comptoir' | 'cercle'>;
export const POSTES: Exclude<Poste, 'noyau'>[] = ['generateur', 'forge', 'clinique'];

export interface PorteurDistrict {
  usure: number;
  poste: Poste | null;
  /** les cartes qu'on lui a confiées (exemplaires « carte@métal ») : sa part du deck de combat */
  modules: string[];
  /** ce que le Porteur a vécu, pour ses Marques */
  faits?: Partial<Record<Fait, number>>;
  /** expérience gagnée en combattant et en mission (décision du 22 octobre 2026) */
  xp?: number;
}

// ---------- L'expérience des Porteurs (décision du 22 octobre 2026) ----------
// Les cartes montent avec les doublons ; les Porteurs, eux, montent en combattant : leurs PV suivent la force des cartes.
// Un niveau = +4 % des PV de base. Le niveau ne touche pas aux cartes : la force vient toujours de la collection.
export const XP = {
  /** par combat gagné dans une Strate, ×(1 + parStrate × (Strate − 1)) */
  combat: 10,
  /** l'XP gagnée monte de 15 % par Strate (25 % jusqu'au 3 nov. 2026 : niveau max atteint vers −7) */
  parStrate: 0.15,
  /** en plus pour une salle scellée vaincue, et pour le gardien */
  elite: 10,
  gardien: 30,
  /** par heure de mission */
  missionHeure: 4,
  /** un Porteur en retard de 2 niveaux ou plus sur le plus avancé du district apprend plus vite (×1,5) */
  rattrapage: 1.5,
  niveauMax: 20,
  pvParNiveau: 0.04,
};
/** XP pour passer du niveau n au niveau n+1 (courbe raidie le 3 nov. 2026 : n^1,6 → n^1,8, niveau ~19 vers −10) */
export const xpPourNiveau = (n: number) => Math.round(12 * n ** 1.8);
/** Multiplicateur d'XP d'une Strate (combats, missions, pillages) */
export const facteurXp = (strate: number) => 1 + XP.parStrate * (Math.max(1, strate) - 1);
/** Niveau d'un Porteur, et ce qu'il a déjà vers le suivant */
export function niveauPorteur(j: Pick<Jeu, 'porteurs'>, id: string): { niveau: number; xp: number; requis: number | null } {
  let reste = Math.floor(j.porteurs[id]?.xp ?? 0);
  let n = 1;
  while (n < XP.niveauMax && reste >= xpPourNiveau(n)) { reste -= xpPourNiveau(n); n++; }
  return { niveau: n, xp: reste, requis: n >= XP.niveauMax ? null : xpPourNiveau(n) };
}
/** PV de base d'un Porteur à son niveau (avant l'Usure et les choix d'histoire) */
export const pvNiveau = (j: Pick<Jeu, 'porteurs'>, id: string) => Math.round(porteurDef(id).pvMax * (1 + XP.pvParNiveau * (niveauPorteur(j, id).niveau - 1)));
/** La Charge qu'un Porteur peut porter à son niveau, et celle que pèsent ses cartes */
export const chargeMax = (j: Pick<Jeu, 'porteurs'>, id: string) => chargeNiveau(niveauPorteur(j, id).niveau);
export const chargePortee = (j: Pick<Jeu, 'porteurs'>, id: string) => (j.porteurs[id]?.modules ?? []).reduce((n, k) => n + poidsCarte(k), 0);
/** Donne de l'XP à un Porteur ; renvoie son nouveau niveau s'il en a pris un */
export function gagnerXp(j: Jeu, id: string, xp: number): number | null {
  const d = j.porteurs[id];
  if (!d || xp <= 0) return null;
  const avant = niveauPorteur(j, id).niveau;
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  d.xp = (d.xp ?? 0) + Math.round(xp * (tete - avant >= 2 ? XP.rattrapage : 1));
  const apres = niveauPorteur(j, id).niveau;
  if (apres > avant) {
    log(j, tr`${porteurDef(id).nom} passe au niveau ${apres} : ${pvNiveau(j, id)} PV.`);
    const m = MARQUES[id];
    const pal = palierAuNiveau(apres);
    if (m && pal > palierAuNiveau(avant)) {
      log(j, progresMarque(j, id)?.acquise
        ? tr`Marque ${minuscule(NOMS_PALIER_MARQUE[pal])} : ${m.nom} ${deNom(porteurDef(id).nom)} — ${m.paliers[pal - 1]!.court}.`
        : tr`Marque ${minuscule(NOMS_PALIER_MARQUE[pal])} en vue pour ${porteurDef(id).nom} : il lui reste à gagner ${m.nom}.`);
    }
    return apres;
  }
  return null;
}

// ---------- Les Marques des Porteurs (Bible) ----------
// Un seuil franchi laisse une Marque permanente, qui change le combat quand le Porteur est dans l'escouade.
// Depuis le 22 octobre 2026, chaque Porteur a la sienne (Bryan : choisir un Porteur doit changer quelque chose).
/** Ce que vit un Porteur et qu'on compte pour sa Marque */
type Fait = 'expeditions' | 'fondations' | 'anciens' | 'scellees' | 'abysses' | 'gardiens' | 'combats' | 'missions';
/** court : l'effet en quelques mots, pour l'écran de l'escouade */
interface MarqueDef { nom: string; fait: Fait; seuil: number; texte: string; court: string; quoi: string; bonus: BonusMarques;
  /** les paliers (1er novembre 2026) : affirmée au niveau PALIERS_MARQUE[0], gravée au niveau PALIERS_MARQUE[1] ; leurs bonus s'ajoutent au premier */
  paliers: [PalierMarque, PalierMarque] }
interface PalierMarque { court: string; texte: string; bonus: BonusMarques }

// ---------- Les paliers des Marques (1er novembre 2026, Bryan : monter un Porteur doit changer quelque chose) ----------
// La Marque se gagne toujours par l'exploit (sans lui, le niveau ne débloque rien : elle reste un trophée).
// Affirmée au niveau 10 : le même effet, plus fort. Gravée au niveau 20 : l'effet change de nature.
// Chaque palier gravé suit le rôle de la lignée : Augmentés frappent, Génés tiennent, Résonants orchestrent.
export const PALIERS_MARQUE = [10, 20] as const;
export const NOMS_PALIER_MARQUE = [tr('Gagnée'), tr('Affirmée'), tr('Gravée')] as const;
export const MARQUES: Record<string, MarqueDef> = {
  ilka: { nom: tr('Raccourci'), fait: 'expeditions', seuil: 30, quoi: tr('expéditions réussies'), court: tr('+1 place au premier tour'), bonus: { places: 1 },
    texte: tr('Elle connaît tous les raccourcis : +1 place dans la chaîne au premier tour de chaque combat.'),
    paliers: [{ court: tr('+1 place aussi au 2ᵉ tour'), texte: tr('Elle a ses repères : la place en plus revient au deuxième tour.'), bonus: { places2: 1 } },
      { court: tr('+2 places au 1er tour, +1 au 2ᵉ'), texte: tr('Elle ouvre la voie : 2 places de plus au premier tour, et 1 au deuxième.'), bonus: { places: 2 } }] },
  doran: { nom: tr('Fondations'), fait: 'fondations', seuil: 20, quoi: tr('combats dans les Seuils'), court: tr('8 de bouclier au départ'), bonus: { bouclier: 8 },
    texte: tr('Il couvre les siens : chaque combat commence avec 8 de bouclier d’escouade.'),
    paliers: [{ court: tr('12 de bouclier au départ'), texte: tr('Il tient plus large : chaque combat commence avec 12 de bouclier d’escouade.'), bonus: { bouclier: 12 } },
      { court: tr('le bouclier se reforme une fois'), texte: tr('Il relève le mur : une fois par combat, quand l’escouade passe sous la moitié de ses PV, 12 de bouclier se reforment.'), bonus: { rempart: 12 } }] },
  vela: { nom: tr('Lectrice'), fait: 'anciens', seuil: 10, quoi: 'empreintes anciennes vaincues', court: tr('insensible à la Dissonance'), bonus: { lucide: true },
    texte: tr('Elle lit les Échos : la Dissonance n’a plus de prise sur l’escouade.'),
    paliers: [{ court: tr('lit la 1re intention dans le brouillard'), texte: tr('Elle lit à travers la brume : sous le brouillard, ce que prépare chaque ennemi au premier tour se voit en entier.'), bonus: { lecture: true } },
      { court: tr('renvoie la Dissonance'), texte: tr('Elle retourne le brouillage : un ennemi qui tente une Dissonance perd 30 % de sa prochaine attaque.'), bonus: { retourne: 0.3 } }] },
  sasha: { nom: tr('Seconde chance'), fait: 'scellees', seuil: 10, quoi: tr('salles scellées ouvertes'), court: tr('relève le premier qui tombe'), bonus: { releve: 0.25 },
    texte: tr('Il remet tout le monde d’aplomb : une fois par combat, le premier Porteur qui tombe se relève avec 25 % de ses PV.'),
    paliers: [{ court: tr('relève à 35 % des PV'), texte: tr('Il remet d’aplomb plus solidement : le premier qui tombe se relève avec 35 % de ses PV.'), bonus: { releve: 0.35 } },
      { court: tr('relève deux fois par combat'), texte: tr('Personne ne reste au sol : la Seconde chance sert deux fois par combat.'), bonus: { releveFois: 2 } }] },
  nuit: { nom: tr('Œil de nuit'), fait: 'abysses', seuil: 25, quoi: tr('combats gagnés sous la Strate −3'), court: tr('l’ennemi commence fissuré'), bonus: { fissure: 0.25 },
    texte: tr('Elle voit la faille dans le noir : l’ennemi visé commence chaque combat fissuré (+25 % de dégâts pendant deux tours).'),
    paliers: [{ court: tr('fissure de 3 tours'), texte: tr('La faille reste ouverte : la Fissure du départ dure trois tours.'), bonus: { fissureTours: 3 } },
      { court: tr('tout le groupe commence fissuré'), texte: tr('Elle voit toutes les failles : chaque ennemi du groupe commence le combat fissuré.'), bonus: { fissureGroupe: true } }] },
  aurel: { nom: tr('Ombre courtoise'), fait: 'gardiens', seuil: 6, quoi: 'gardiens vaincus', court: tr('1re attaque ennemie −40 %'), bonus: { desarme: 0.4 },
    texte: tr('Son ombre retient le premier coup : la première attaque de chaque ennemi perd 40 % de sa force, quel que soit le tour où elle tombe.'),
    paliers: [{ court: tr('1re attaque ennemie −50 %'), texte: tr('Son ombre pèse plus : la première attaque de chaque ennemi perd 50 % de sa force.'), bonus: { desarme: 0.5 } },
      { court: tr('le coup retenu donne 1 Flux'), texte: tr('Il retourne la politesse : chaque coup retenu par son ombre donne 1 Flux à l’escouade.'), bonus: { retenueFlux: 1 } }] },
  coursier: { nom: tr('Foulée'), fait: 'combats', seuil: 40, quoi: tr('combats gagnés'), court: tr('1 Flux au départ'), bonus: { flux: 1 },
    texte: tr('Il court devant l’escouade : chaque combat commence avec 1 Flux.'),
    paliers: [{ court: tr('2 Flux au départ contre un gardien'), texte: tr('Il a repéré l’antre : contre un gardien, le combat commence avec 2 Flux.'), bonus: { fluxGardien: 2 } },
      { court: tr('fuir ne coûte plus de butin'), texte: tr('Il connaît la route du retour : remonter en fuyant ne fait plus perdre de minerai.'), bonus: { fuiteSure: true } }] },
  docker: { nom: tr('Bras de quai'), fait: 'missions', seuil: 8, quoi: 'missions accomplies', court: tr('garde 25 % du bouclier'), bonus: { garde: 0.25 },
    texte: tr('Il ne lâche rien : à chaque tour, l’escouade garde 25 % de son bouclier pour le tour suivant.'),
    paliers: [{ court: tr('garde 35 % du bouclier'), texte: tr('Il serre plus fort : l’escouade garde 35 % de son bouclier d’un tour à l’autre.'), bonus: { garde: 0.35 } },
      { court: tr('le bouclier restant soigne'), texte: tr('Rien ne se perd au quai : à la victoire, la moitié du bouclier restant soigne le Porteur le plus blessé.'), bonus: { soinQuai: 0.5 } }] },
  guetteur: { nom: tr('Guet'), fait: 'anciens', seuil: 12, quoi: 'empreintes anciennes vaincues', court: tr('+1 carte au premier tour'), bonus: { main: 1 },
    texte: tr('Il voit venir de loin : au premier tour de chaque combat, ta main compte une carte de plus.'),
    paliers: [{ court: tr('voit l’intention d’après'), texte: tr('Il voit plus loin : à côté de l’intention, une petite pastille montre ce que l’ennemi visé prépare au tour d’après.'), bonus: { presage: true } },
      { court: tr('+1 carte à chaque phase de gardien'), texte: tr('Rien ne le surprend : quand un gardien change de phase, ta main prend une carte de plus.'), bonus: { phaseMain: 1 } }] },
  kessa: { nom: tr('Née-de-mue'), fait: 'fondations', seuil: 25, quoi: tr('combats dans les Seuils'), court: tr('le bouclier renvoie 30 % des coups'), bonus: { chitine: 0.3 },
    texte: tr('Sa chitine pique qui la frappe : quand le bouclier d’escouade encaisse un coup, 30 % de ce qu’il absorbe revient à l’ennemi.'),
    paliers: [{ court: tr('le bouclier renvoie 40 %'), texte: tr('Sa chitine durcit : 40 % de ce que le bouclier d’escouade absorbe revient à l’ennemi.'), bonus: { chitine: 0.4 } },
      { court: tr('le renvoi peut achever'), texte: tr('Sa mue est complète : le renvoi de la chitine peut achever l’ennemi qui frappe.'), bonus: { chitineAcheve: true } }] },
  liane: { nom: tr('Galons blancs'), fait: 'scellees', seuil: 12, quoi: tr('salles scellées ouvertes'), court: tr('+1 Flux par Fêlure résonnante'), bonus: { felureFlux: 1 },
    texte: tr('Chaque implant est un galon : une Fêlure brisée par une chaîne qui résonne donne 1 Flux de plus.'),
    paliers: [{ court: tr('+2 Flux par Fêlure contre un gardien'), texte: tr('Ses galons pèsent face aux grands : contre un gardien, chaque Fêlure brisée en résonance donne 2 Flux de plus.'), bonus: { felureFluxGardien: 2 } },
      { court: tr('Fêlure résonnante : +1 carte'), texte: tr('Chaque galon ouvre une porte : une Fêlure brisée en résonance fait aussi piocher une carte.'), bonus: { felurePioche: 1 } }] },
  joss: { nom: tr('Nuit blanche'), fait: 'combats', seuil: 35, quoi: tr('combats gagnés'), court: tr('soigne le plus blessé chaque tour'), bonus: { veille: 0.06 },
    texte: tr('Le quartier entier l’a veillé, il veille à son tour : à la fin de chaque tour ennemi, le Porteur le plus blessé récupère 6 % de ses PV.'),
    paliers: [{ court: tr('soigne le plus blessé de 8 %'), texte: tr('Il veille plus fort : à la fin de chaque tour ennemi, le plus blessé récupère 8 % de ses PV.'), bonus: { veille: 0.08 } },
      { court: tr('veille sur les deux plus blessés'), texte: tr('Il ne dort plus : à la fin de chaque tour ennemi, les deux Porteurs les plus blessés récupèrent chacun 8 % de leurs PV.'), bonus: { veilleDeux: true } }] },
};
/** Le palier d'une Marque à un niveau : 0 gagnée, 1 affirmée (niv. 10), 2 gravée (niv. 20) */
export const palierAuNiveau = (niveau: number) => PALIERS_MARQUE.filter((n) => niveau >= n).length as 0 | 1 | 2;
export const progresMarque = (j: Jeu, id: string) => {
  const m = MARQUES[id];
  if (!m) return null;
  const n = j.porteurs[id]?.faits?.[m.fait] ?? 0;
  const acquise = n >= m.seuil;
  const niveau = j.porteurs[id] ? niveauPorteur(j, id).niveau : 1;
  // le palier atteint par le niveau ; il ne joue qu'une fois la Marque gagnée
  const palier = palierAuNiveau(niveau);
  const bonus: BonusMarques = { ...m.bonus };
  if (acquise) for (const p of m.paliers.slice(0, palier)) Object.assign(bonus, p.bonus);
  // l'effet en cours, en court (écrans) : celui du dernier palier atteint, une fois la Marque gagnée
  const courtEffectif = acquise && palier ? m.paliers[palier - 1]!.court : m.court;
  return { ...m, n, acquise, palier, niveau, bonusEffectif: bonus, courtEffectif };
};
/** Les Marques acquises des Porteurs de l'escouade : chacune apporte son bonus au combat, paliers compris */
export function bonusEscouade(j: Jeu, escouade: string[]): BonusMarques {
  const b: BonusMarques = {};
  for (const id of escouade) { const m = progresMarque(j, id); if (m?.acquise) Object.assign(b, m.bonusEffectif); }
  return b;
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée */
interface Fabrication {
  moduleId: string;
  debut: number;
  fin: number;
}

export interface Chantier {
  batiment: BatimentId;
  debut: number;
  fin: number;
}

/** Un choix de carte en attente (boss, objectif du jour, Archive) */
export interface Choix {
  source: 'boss' | 'quotidien' | 'archive' | 'ravitaillement' | 'fouille' | 'epreuve' | 'parrainage' | 'releve' | 'etoiles' | 'rodeur' | 'maree' | 'fleche';
  options: string[];
  /** le joueur peut prendre des Éclats à la place */
  eclats?: number;
}

type TypeQuotidien = 'combats' | 'expedition' | 'chantier';
export const QUOTIDIENS: Record<TypeQuotidien, { titre: string; objectif: number }> = {
  combats: { titre: tr('Gagner 4 combats'), objectif: 4 },
  expedition: { titre: tr('Vaincre un gardien, réussir une fouille ou une Épreuve'), objectif: 1 },
  chantier: { titre: tr('Lancer une amélioration de bâtiment'), objectif: 1 },
};

/** Une séance d'entraînement à la Tour du Noyau : un niveau, payé au lancement (refonte du 28 octobre 2026) */
export interface Seance {
  porteur: string;
  /** le niveau que la séance fait atteindre */
  cible: number;
  xpTotale: number;
  xpGagnee: number;
  xpHeure: number;
  /** énergie payée au lancement (0 pour une séance reprise d'une ancienne sauvegarde) */
  energie: number;
}

export interface Jeu {
  version: number;
  energie: number;
  composants: number;
  batiments: Record<BatimentId, number>;
  porteurs: Record<string, PorteurDistrict>;
  forge: Fabrication | null;
  /** les séances d'entraînement en cours à la Tour, une par place (28 octobre 2026 : plusieurs places selon le niveau de la Tour) */
  seances?: Seance[];
  /** ancienne sauvegarde : une seule place, reprise dans seances au chargement */
  seance?: Seance | null;
  /** le dernier Porteur à avoir fini une séance, proposé en premier pour la relancer */
  derniereSeance?: string;
  /** Strate la plus profonde ouverte (le prochain étage à creuser) */
  strate: number;
  dernierTick: number;
  expedition: Expedition | null;
  journal: string[];
  /** l'intro du premier lancement a été vue */
  introVue: boolean;
  /** le tuto « Ton district » (après la chambre) a été lu jusqu'au bout : tant qu'il ne l'est pas, il revient à l'ouverture */
  accueilVu?: boolean;
  /** la chambre scellée a été ouverte (fin du combat guidé) */
  chambre: boolean;
  /** les trois recrues anonymes ont rejoint le district */
  recrues: boolean;
  /** les Porteurs de l'histoire arrivés plus tard (Sasha, Nuit, Aurel) */
  arrives: string[];
  /** les grands choix de la campagne (Bible : un choix important par acte) */
  actes: { chambre?: GardeChambre; lecture?: LectureVela; fin?: FinCampagne };
  /** le bouche-à-oreille (7 novembre 2026) : les points gagnés en protégeant des gens ; tous les `CONFIANCE.rumeur` points,
   *  une famille du quartier rejoint le district (avant : les habitants qui suivaient le directeur, sur 600) */
  confiance: number;
  /** les familles arrivées au district, dans l'ordre (familles.ts) : le palier se lit avec `niveauConfiance(nbFoyers(j))` */
  foyers?: string[];
  /** les Basses (partie/basses.ts) : le batardeau, les dépôts de la marée, l'expédition en cours, les lieux visités */
  basses?: EtatBasses;
  /** 2 : la Confiance compte des habitants (30 octobre 2026) ; absent : une sauvegarde aux anciens points, convertie au chargement */
  confianceV?: 2;
  /** 2 = XP convertie à la courbe du 3 nov. 2026 (niveaux conservés) */
  xpV?: 2;
  /** paliers de Confiance déjà récompensés (un creuseur volontaire et une famille par palier) */
  confianceRecue?: number;
  /** la semaine des lignes : familles arrivées, points de bouche-à-oreille par source, et le bilan de la dernière Nuit des lignes
   *  (`pompes` : ancienne sauvegarde, plus utilisé) */
  lignes?: { semaine: number; pompes?: number; familles?: string[]; sources: Partial<Record<SourceHabitants, number>>; derniere?: NuitDesLignes };
  /** les mécaniques de combat déjà expliquées la première fois qu'elles sont apparues (decouvertes.ts) */
  decouvertes?: string[];
  /** les scènes de la campagne déjà jouées, dans l'ordre (campagne.ts) */
  scenes?: string[];
  /** le contenu des Strates (31 octobre 2026, strates.ts) : Haltes vues et étapes de quête trouvées par Strate, souvenirs des choix */
  haltes?: Record<number, number>;
  quetes?: Record<number, number>;
  drapeaux?: string[];
  /** le choix fait à chaque Halte (« strate-n » → 0 ou 1), pour le carnet du directeur (3 novembre 2026) */
  choixHaltes?: Record<string, number>;
  /** Explorer ou fouiller (31 octobre 2026, explorer.ts) : les Vestiges trouvés, les étoiles gagnées par Strate (★1 est aussi
   *  compté d'office pour toute Strate vaincue), les paliers d'étoiles déjà récompensés, et l'état de chaque Rôdeur */
  vestiges?: string[];
  etoiles?: Record<number, number[]>;
  paliersEtoiles?: number;
  rodeurs?: Record<string, { part: number; rencontres: number; abattu?: boolean }>;
  /** index de l'objectif guidé en cours (OBJECTIFS.length = tous faits) */
  objectif: number;
  /** fragments d'archives trouvés, dans l'ordre */
  fragments: string[];
  /** chapitres des Chroniques déjà lus */
  lus: string[];
  /** chapitres dont la première lecture a déjà rapporté sa carte */
  luesRecompensees: string[];
  /** les recrues ont reçu leur kit de départ (3 cartes chacune) */
  kitRecrues: boolean;
  /** Ravitaillement du jour : colis en réserve (3 au plus, rien ne se perd), dernier jour compté, colis déjà ouverts */
  ravitaillement: { jour: number; reserve: number; ouverts: number };
  /** les pillages : jetons, coffre et attaques à envoyer (pillages.ts) ; absent avant le premier */
  pillage?: import('./pillages').EtatPillage;
  /** la présentation du Port a été lue (28 octobre 2026) : elle s'affiche à la première visite */
  portVu?: boolean;
  /** la présentation des Basses a été vue (8 novembre 2026, audit : un paragraphe ne suffisait pas) */
  bassesVu?: boolean;
  /** les premiers soins intensifs ont été offerts par la Clinique (4 novembre 2026) */
  soinOffert?: boolean;
  /** la Flèche : le quai atteint, le record, les quais gravés reçus (fleche.ts) ; absente avant la première montée */
  fleche?: import('./fleche').EtatFleche;
  eclats: number;
  /** les cartes possédées */
  collection: Record<string, CarteCollection>;
  /** ce que chaque carte a vécu : son empreinte (vecu.ts, 28 octobre 2026) ; absent avant le premier combat */
  vecu?: Record<string, import('./vecu').VecuCarte>;
  /** cartes tirées depuis la dernière de chaque rareté, pour les garanties */
  sans: { argent: number; or: number; nacre: number };
  /** hasard des trouvailles (déterministe, sauvegardé) */
  rng: number;
  chantiers: Chantier[];
  choix: Choix[];
  /** objectif du jour : jours en réserve (3 au plus) et progression */
  quotidien: { jour: number; reserve: number; type: TypeQuotidien; progres: number };
  /** Archive de la semaine : points de la semaine en cours, paliers à ouvrir de la semaine passée */
  archive: { semaine: number; points: number; aOuvrir: number; /** les Butins des semaines suivantes, pas encore ouverts */ enAttente?: number[] };
  /** les Éclats recueillis en taillant (9 novembre 2026) : le jour du jeu, ceux trouvés ce jour-là, et les cristaux taillés vers le prochain */
  eclatsTaille?: { jour: number; n: number; reste: number };
  /** les Porteurs partis en mission en mer, depuis le Port (le niveau de la mission est celui de la dernière Strate vaincue) */
  missions: Mission[];
  /** les contrats de marée (31 octobre 2026) : la gabare en mer, les contrats remplis, les Indices laissés par les échecs */
  marees?: { contrat: ContratEnMer | null; reussis: string[]; indices: Record<string, number> };
  /** (ancien, jusqu'au 28 octobre 2026) les destinations du jour déjà prises au Port : les missions sont maintenant illimitées */
  missionsJour?: { jour: number; cles: string[] };
  /** les creuseurs ramenés par les naufragés pendant la Strate en cours (plafonnés par Strate, idée de Luc du 28 octobre 2026) */
  naufrages?: { strate: number; n: number };
  /** le jour de la dernière exploration du front (la première de la journée rapporte double, 8 novembre 2026) */
  premiereExploration?: number;
  /** les creuseurs ramenés des fouilles aujourd'hui (fouilleurs du jour, 8 novembre 2026) */
  fouilleurs?: { jour: number; n: number };
  /** les barques parties aujourd'hui (les premières reviennent pleines, les suivantes moins : les ruines proches s'épuisent) */
  departsJour?: { jour: number; n: number };
  /** les barques parties aujourd'hui vers chaque destination (fouille en profondeur, 2 novembre 2026) */
  fouillesJour?: { jour: number; cles: Record<string, number> };
  /** les destinations dont les naufragés ont déjà été recueillis aujourd'hui */
  secoursJour?: { jour: number; cles: string[] };
  /** les rapports des missions rentrées : ceux pas encore lus s'ouvrent au district, les derniers lus restent consultables */
  rapports?: RapportMission[];
  /** Épreuves de la semaine déjà réussies (une récompense par Épreuve et par semaine) */
  epreuves: { semaine: number; faites: string[] };
  /** le Comptoir du jour : ses offres, celles déjà achetées, et son propre hasard (il ne touche pas aux trouvailles) */
  comptoir: Comptoir;
  /** « Mon escouade » (décision du 23 octobre 2026) : les trois Porteurs qui descendent. Elle ne change qu'au district,
   *  jamais pendant une descente (sinon c'est trop facile). Ancienne sauvegarde : complétée par `migrer`. */
  escouade: string[];
  /** les trois escouades enregistrées (25 octobre 2026) : un Porteur n'est que dans une seule. Celle d'indice
   *  `escouadeActive` est celle qui descend, et `escouade` en est toujours la copie (c'est elle qui fait foi). */
  escouades: string[][];
  escouadeActive: number;
  /** l'escouade qui garde le port contre les pillages (27 octobre 2026) ; absente : celle qui descend */
  escouadeDefense?: number;
  /** les Porteurs et les cartes déjà vus par le joueur : le reste porte une pastille « Nouveau » (23 octobre 2026) */
  vus: { porteurs: string[]; cartes: string[] };
  /** les creuseurs du front de taille : il en faut assez pour creuser l'étage suivant (logés selon le niveau du Noyau) */
  creuseurs: number;
  /** le gardien de la Strate la plus profonde est vaincu : l'étage suivant attend d'être creusé */
  frontVaincu: boolean;
  /** les fils des Porteurs : nombre d'étapes faites par Porteur (23 octobre 2026) */
  fils?: Record<string, number>;
  /** l’Héritage du district choisi dans la lettre de la directrice (27 octobre 2026) : une carte de l’Héritage, ou « cle » (la Clé de l’Héritage) */
  legs?: string;
  /** le Râtelier du district (30 octobre 2026) : les cartes communes choisies pour descendre ; absent : celles de départ */
  ratelier?: string[];
  /** un Râtelier par escouade (31 octobre 2026) : une même carte commune peut être dans plusieurs ; absent : l'ancien `ratelier` commun */
  rateliers?: string[][];
  /** le dernier âge du district montré au joueur (fenêtre « nouvel âge », 23 octobre 2026) */
  ageVu?: number;
  /** la dernière Strate où le jeu a proposé de protéger la partie (compte invisible) : une seule fois par palier */
  rappelCompte?: number;
  /** les statistiques pour l'équilibrage (partie/stats.ts) */
  stats?: import('./stats').Stats;
  /** le Grand Tableau (23 octobre 2026) : records personnels et scores du début de semaine (classements.ts) */
  palmares?: Palmares;
  /** le parrainage (29 octobre 2026, parrainage.ts) : son code, son parrain, les récompenses reçues ; absent avant le premier usage */
  parrainage?: import('./parrainage').EtatParrainage;
  /** les Récits des origines (11 novembre 2026, recits.ts) : par récit, la carte d'origine gardée à la fin */
  recits?: Record<string, { carte?: string }>;
  /** le Cercle des quais (3 novembre 2026, cercle.ts) : souhaits, vitrine, échanges du jour et en attente, duels de la semaine */
  cercle?: import('./cercle').EtatCercle;
  /** le nom de directeur choisi pour le Grand Tableau, et si on y apparaît (jamais l'e-mail du compte) */
  /** le pseudo a déjà été proposé à ce joueur sans compte protégé (une seule fois, 3 novembre 2026) */
  pseudoPropose?: boolean;
  directeur?: { nom: string; public: boolean; /** dernier changement de pseudo (ms) : un par semaine au plus */ change?: number };
}

/** Acte I, le choix : qui garde la chambre ? */
export type GardeChambre = 'orseve' | 'district' | 'commission';
/** Acte II, le choix : autoriser Véla à une dernière lecture profonde, au risque de briser le lien avec son empreinte */
export type LectureVela = 'autoriser' | 'refuser';
/** Acte III, la vérité : trois fins, aucune n'est « la bonne » (Bible) */
export type FinCampagne = 'scellement' | 'pacte' | 'archives';
/** Ce que la dernière lecture a changé chez Véla */
export const bonusPv = (j: Jeu, id: string) => (id === 'vela' ? (j.actes.lecture === 'autoriser' ? -4 : j.actes.lecture === 'refuser' ? 4 : 0) : 0) + bonusClinique(j, id);
/**
 * La Clinique renforce les Porteurs (audit du 7 novembre 2026 : elle ne servait plus à rien après le niveau 3, les soins
 * suffisant déjà) : +2 % de PV max par niveau au-delà du 3e, soit +14 % au niveau 10.
 */
export const CLINIQUE_PV = { des: 3, parNiveau: 0.02 } as const;
export const partPvClinique = (j: Pick<Jeu, 'batiments'>) => CLINIQUE_PV.parNiveau * Math.max(0, (j.batiments?.clinique ?? 0) - CLINIQUE_PV.des);
export const bonusClinique = (j: Jeu, id: string) => Math.round(pvNiveau(j, id) * partPvClinique(j));
/** la carte que Véla gagne après la dernière lecture : la sienne, en plus de ses 6 cartes */
export const LECTURE_PROFONDE: GesteDef = { id: 'lecture-profonde', porteur: 'vela', nom: tr('Lecture profonde'), f: 8, type: 'atk', v: 16, effet: { type: 'accord' } };

export interface Resultat {
  ok: boolean;
  message?: string;
}

export const non = (message: string): Resultat => ({ ok: false, message });

/** Le Cercle des quais (3 novembre 2026) se construit une fois la Strate −2 vaincue (le reste : partie/cercle.ts) */
export const CERCLE_OUVERTURE = 2;
/**
 * Les réglages du Cercle (index = niveau du bâtiment, 0 = pas encore construit). Leçons des autres jeux (3 novembre 2026) :
 * échanges seulement entre amis, de même métal, sans monnaie à part (Pokémon TCG Pocket a dû retirer la sienne) ;
 * duels entre amis sans butin par duel (Marvel Snap : on choisit son adversaire, donc on pourrait s'arranger).
 */
export const CERCLE = {
  /** échanges conclus par jour */
  echangesJour: [0, 2, 3, 3, 4, 4, 5, 6, 7, 7, 8],
  /** propositions envoyées qui attendent une réponse en même temps */
  ouvertes: [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
  /** cartes exposées dans la vitrine */
  vitrine: [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3],
  /** le métal le plus rare qu'on peut échanger : l'argent dès le niveau 1, l'or au niveau 5 ; la nacre, jamais */
  orAuNiveau: 5,
  /** ce que coûte un échange, à chacun des deux directeurs (en composants) */
  cout: { fer: 0, cuivre: 0, argent: 40, or: 150, nacre: 0 } as Record<Rarete, number>,
  /** une amitié doit avoir quelques jours avant le premier échange (contre les comptes créés pour se donner des cartes) */
  amitieJours: 3,
  /** une proposition sans réponse revient à son auteur au bout de 48 h */
  propositionHeures: 48,
  /** souhaits au plus */
  souhaitsMax: 30,
  /** chaque semaine, les premières victoires en duel contre des amis différents rapportent (jamais deux fois le même ami) */
  duelsSemaine: 3,
  recompenseDuel: { composants: 60, eclats: 1 },
} as const;

export const typeDuJour = (jour: number): TypeQuotidien => (['combats', 'expedition', 'chantier'] as const)[((jour % 3) + 3) % 3]!;

/**
 * Jusqu'où une partie est allée, pour choisir entre deux sauvegardes (appareil ou compte) sans jamais faire reculer
 * le joueur (25 octobre 2026 : une partie neuve sur PC, plus « récente », écrasait celle avancée sur le téléphone).
 * Profondeur d'abord, puis l'expérience des Porteurs, puis les niveaux des bâtiments, puis la collection.
 */
export function avancement(j: Jeu): number[] {
  const xp = Object.values(j.porteurs ?? {}).reduce((n, p) => n + (p.xp ?? 0), 0);
  const bat = Object.values(j.batiments ?? {}).reduce((n, v) => n + v, 0);
  return [j.strate * 2 + (j.frontVaincu ? 1 : 0), Math.floor(xp), bat, Object.keys(j.collection ?? {}).length];
}
/** 1 si a est plus avancée que b, -1 si moins, 0 si à égalité */
export function compareAvancement(a: Jeu, b: Jeu): number {
  const x = avancement(a), y = avancement(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i]! > y[i]! ? 1 : -1;
  return 0;
}

export function log(j: Jeu, t: string) {
  j.journal.unshift(t);
  j.journal = j.journal.slice(0, 8);
}

// ---------- Lecture ----------

export const enExpedition = (j: Jeu, id: string) => (!!j.expedition && j.expedition.porteurs.some((p) => p.id === id)) || enMission(j, id);
/** en mer : sur une barque, ou sur la gabare d'un contrat de marée (31 octobre 2026) */
export const enMission = (j: Jeu, id: string) => !!j.missions?.some((m) => m.porteur === id) || !!j.marees?.contrat?.porteurs.includes(id) || j.basses?.expedition?.porteur === id;
export const posteDe = (j: Jeu, b: Poste) => Object.keys(j.porteurs).find((id) => j.porteurs[id]!.poste === b) ?? null;
export const pvMaxCombat = (j: Jeu, id: string) => pvNiveau(j, id) + bonusPv(j, id) - Math.floor(j.porteurs[id]!.usure);
/** L'Usure ne peut pas dépasser tous les PV du Porteur */
export const usureMax = (j: Jeu, id: string) => pvNiveau(j, id) + bonusPv(j, id);
/** Les PV qu'il faut avoir retrouvés pour redescendre */
export const pvMinDepart = (j: Jeu, id: string) => Math.ceil(usureMax(j, id) * DISTRICT.pvMinDepart);
/** Trop blessé pour redescendre : il se repose à la Clinique (null = il peut partir) */
export function tropBlesse(j: Jeu, id: string): string | null {
  const manque = pvMinDepart(j, id) - pvMaxCombat(j, id);
  return manque > 0 ? tr`${porteurDef(id).nom} se remet à la Clinique : il lui faut ${pvMinDepart(j, id)} PV pour redescendre (encore ${manque}).` : null;
}
/** L'Usure au retour d'un combat : les PV perdus, plus les malus (à terre, fuite, Coup d'éclat) */
export function usureAuRetour(j: Jeu, p: { id: string; pv: number; pvMax: number; usureEclat?: number }, malus = 0): void {
  const d = j.porteurs[p.id]!;
  const perdus = Math.max(0, p.pvMax - Math.max(0, p.pv));
  const extra = (p.pv <= 0 ? DISTRICT.usureATerre : 0) + malus + (p.usureEclat ?? 0);
  d.usure = Math.min(usureMax(j, p.id), d.usure + perdus + extra * (j.actes.fin === 'archives' ? 1.5 : 1));
}

export function multiplicateur(j: Jeu, b: Exclude<Poste, 'noyau'>): number {
  const id = posteDe(j, b);
  if (!id) return 1;
  return porteurDef(id).lignee === batimentDef(b).affinite ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste;
}

/** Les cristaux que le Générateur taille par heure (9 novembre 2026 : il raffine le brut, il ne produit plus rien de lui-même) */
/** Les heures que met le Générateur à tailler le minerai qui attend (un Porteur posté l'accélère) */
export const heuresDeTaille = (j: Jeu) => (DISTRICT.tailleHeures[j.batiments.generateur] ?? 0) / multiplicateur(j, 'generateur');
/** Ce que le Générateur taille dans l'heure qui vient, avec ce minerai en attente */
/** Le moins que taille le Générateur en une heure, tant qu'il reste du minerai */
export const plancherTaille = (j: Jeu) => Math.round((DISTRICT.taillePlancher[j.batiments.generateur] ?? 0) * multiplicateur(j, 'generateur'));
const debit = (j: Jeu, reste: number) => Math.min(reste, Math.max(plancherTaille(j), reste / Math.max(1, heuresDeTaille(j))));
/** Les cristaux taillés par heure en ce moment (0 si rien n'attend) */
export const raffinageParHeure = (j: Jeu) => (j.batiments.generateur > 0 ? Math.round(debit(j, j.composants)) : 0);
/** Le minerai qui attend d'être taillé, et le temps qu'il faudra pour tout tailler (en heures ; 0 si rien n'attend) */
export function brutEnAttente(j: Jeu): { brut: number; heures: number } {
  if (j.batiments.generateur < 1) return { brut: Math.floor(j.composants), heures: Infinity };
  let reste = j.composants, h = 0;
  while (reste >= 1 && h < 200) { reste -= debit(j, reste); h++; }
  return { brut: Math.floor(j.composants), heures: h };
}
/** Les Éclats recueillis par la taille : `n` cristaux viennent d'être taillés (appelé par tick) ; renvoie les Éclats trouvés */
export function eclatsDeTaille(j: Jeu, n: number, now: number): number {
  const max = DISTRICT.eclatsParJour[j.batiments.generateur] ?? 0;
  if (!max || n <= 0) return 0;
  const e = j.eclatsTaille?.jour === jourDe(now) ? j.eclatsTaille : { jour: jourDe(now), n: 0, reste: j.eclatsTaille?.reste ?? 0 };
  e.reste += n;
  let trouves = 0;
  while (e.reste >= DISTRICT.eclatTous && e.n < max) { e.reste -= DISTRICT.eclatTous; e.n++; trouves++; }
  if (e.n >= max) e.reste = Math.min(e.reste, DISTRICT.eclatTous);
  j.eclatsTaille = e;
  j.eclats += trouves;
  return trouves;
}
/** Taille le minerai pendant `heures`, heure par heure : renvoie les cristaux taillés */
export function raffiner(j: Jeu, heures: number): number {
  if (j.batiments.generateur < 1) return 0;
  let n = 0;
  for (let h = Math.max(0, heures); h > 0 && j.composants - n > 0; h -= 1) n += debit(j, j.composants - n) * Math.min(1, h);
  j.composants -= n;
  j.energie += n;
  return n;
}

// ---------- La Confiance du quartier : les familles qui te suivent ----------
// Refaite le 30 octobre 2026 (Bryan : la Confiance doit être liée à l'implication du joueur pour sauver les habitants
// de la montée des eaux), puis le 7 novembre 2026 (« toute la partie avec les habitants ne sert à rien ») : le district compte
// 48 familles nommées (familles.ts), plus un compteur de 600 habitants. Elles arrivent de trois façons : au départ, par le
// bouche-à-oreille (`j.confiance` : points gagnés en protégeant des gens, une famille du quartier tous les `rumeur` points),
// ou parce qu'un Porteur est allé les chercher dans les Basses (partie/basses.ts). Rien ne baisse jamais.
// Chaque palier de 6 familles amène un creuseur volontaire et un souvenir pour les Archives (mêmes paliers qu'avant :
// 6 familles = 75 anciens habitants).
export const CONFIANCE = {
  /** le district entier : 48 familles, « tout le monde à la fois » */
  population: 48,
  /** un palier toutes les 6 familles (8 jusqu'à 48) */
  palier: 6,
  /** points de bouche-à-oreille qu'il faut pour qu'une famille du quartier rejoigne (26 familles : 390 points en tout) */
  rumeur: 15,
  /** gardien du front vaincu la première fois, de −1 à −10 (l'espoir de l'Écluse) ; plus bas, un peu moins */
  gardien: 10, gardienProfond: 5,
  /** naufragés recueillis en mer (seulement quand la barque en ramène vraiment) */
  naufrages: { courte: 3, longue: 5 },
  /** un pillage repoussé par la garnison du Port */
  defense: 5,
  /** un quai gravé de la Flèche atteint (de la place gagnée sur les îles) */
  quaiGrave: 25,
  /** la Nuit des lignes, chaque lundi : part des points gagnés pendant la semaine qui s'ajoutent en plus */
  nuit: 0.15,
  /** palier qu'il faut pour l'Accord ouvert (avec la Clinique) : 12 familles */
  accord: 2,
  /** palier qui ajoute un étal au Comptoir (18 familles) */
  comptoir: 3,
} as const;

/** Les grands paliers, nommés */
export const NOMS_CONFIANCE: Record<number, string> = { 0: tr('Ils t’observent'), 1: tr('Ils t’écoutent'), 4: tr('Ils t’aident'), 8: tr('Tout le district te suit') };
export const nomConfiance = (palier: number) => NOMS_CONFIANCE[Object.keys(NOMS_CONFIANCE).map(Number).filter((n) => n <= palier).pop() ?? 0]!;

/** Les familles arrivées au district */
export const nbFoyers = (j: Pick<Jeu, 'foyers'>) => j.foyers?.length ?? 0;

/** Le palier atteint, les familles dans ce palier et celles qu'il faut pour le suivant (requis = 0 quand tout le district suit) */
export function niveauConfiance(foyers: number): { niveau: number; dans: number; requis: number } {
  const h = Math.min(CONFIANCE.population, Math.max(0, foyers));
  const max = Math.floor(CONFIANCE.population / CONFIANCE.palier);
  const niveau = Math.min(max, Math.floor(h / CONFIANCE.palier));
  return niveau >= max ? { niveau, dans: CONFIANCE.palier, requis: 0 } : { niveau, dans: h - niveau * CONFIANCE.palier, requis: CONFIANCE.palier };
}

/** D'où viennent les familles de la semaine (pour le récit de la Nuit des lignes) ; `pompes` : anciennes sauvegardes */
export type SourceHabitants = 'pompes' | 'basses' | 'naufrages' | 'gardiens' | 'rencontres' | 'defense' | 'fleche' | 'histoire';

/** La semaine des lignes en cours (une semaine passée se referme d'abord : son bonus est compté) */
function semaineDesLignes(j: Jeu, now: number): NonNullable<Jeu['lignes']> {
  nuitDesLignes(j, now);
  const s = semaineDe(now);
  if (!j.lignes || j.lignes.semaine < s) j.lignes = { semaine: s, familles: [], sources: {}, ...(j.lignes?.derniere ? { derniere: j.lignes.derniere } : {}) };
  return j.lignes;
}

/** Une famille rejoint le district (une seule fois) ; renvoie vrai si elle vient d'arriver */
export function accueillirFamille(j: Jeu, id: string, now = j.dernierTick): boolean {
  const f = familleDef(id);
  if (!f || (j.foyers ??= []).includes(id)) return false;
  j.foyers.push(id);
  const l = semaineDesLignes(j, now);
  l.familles = [...(l.familles ?? []), id];
  log(j, tr`${f.nom.charAt(0).toUpperCase()}${f.nom.slice(1)} rejoignent le district.`);
  return true;
}

/** Le bouche-à-oreille fait venir les familles du quartier qui attendaient, dans l'ordre */
function bouche(j: Jeu, now: number): string[] {
  const venues: string[] = [];
  for (const f of FAMILLES_QUARTIER) {
    if (j.confiance < CONFIANCE.rumeur) break;
    if (j.foyers?.includes(f.id)) continue;
    j.confiance -= CONFIANCE.rumeur;
    if (accueillirFamille(j, f.id, now)) venues.push(f.id);
  }
  return venues;
}

/** Les familles du quartier qui ne sont pas encore venues */
export const quartierRestant = (j: Pick<Jeu, 'foyers'>) => FAMILLES_QUARTIER.filter((f) => !j.foyers?.includes(f.id)).length;

/** Où en est le bouche-à-oreille avant la prochaine famille du quartier (null : elles sont toutes venues) */
export const rumeurVersFamille = (j: Jeu): { points: number; seuil: number } | null =>
  quartierRestant(j) ? { points: Math.min(CONFIANCE.rumeur, j.confiance ?? 0), seuil: CONFIANCE.rumeur } : null;

/**
 * Le quartier entend parler de ce que tu as fait : des points de bouche-à-oreille (jamais perdus : un nombre négatif ou nul
 * ne fait rien). Renvoie le nombre de familles qui viennent de rejoindre le district.
 */
export function confier(j: Jeu, delta: number, source: SourceHabitants = 'histoire', now = j.dernierTick): number {
  if (!(delta > 0)) return 0;
  const l = semaineDesLignes(j, now);
  l.sources[source] = (l.sources[source] ?? 0) + Math.round(delta);
  // une fois tout le quartier venu, le bouche-à-oreille ne s'accumule plus pour rien
  j.confiance = quartierRestant(j) ? (j.confiance ?? 0) + Math.round(delta) : 0;
  const venues = bouche(j, now).length;
  if (!quartierRestant(j)) j.confiance = 0;
  return venues;
}

/**
 * La Nuit des lignes (chaque lundi) : le district repeint sa ligne bleue un peu plus haut et fait le bilan de la semaine.
 * Ceux qui ont vu ce que tu as fait en parlent : +15 % des points gagnés. Une semaine sans rien ne coûte rien.
 */
export function nuitDesLignes(j: Jeu, now: number): string | null {
  const s = semaineDe(now);
  const l = j.lignes;
  if (!l || l.semaine >= s) return null;
  const points = Object.values(l.sources).reduce((n, v) => n + (v ?? 0), 0);
  const venues = [...(l.familles ?? [])];
  const derniere = l.derniere;
  j.lignes = { semaine: s, familles: [], sources: {}, ...(derniere ? { derniere } : {}) };
  if (points <= 0 && !venues.length) return null;
  const sources = { ...l.sources };
  const bonus = quartierRestant(j) ? Math.round(points * CONFIANCE.nuit) : 0;
  if (bonus > 0) j.confiance = (j.confiance ?? 0) + bonus;
  const deLaNuit = bouche(j, now);
  if (!quartierRestant(j)) j.confiance = 0;
  // le bonus de la nuit ne compte pas dans la semaine qui commence
  j.lignes.familles = [];
  j.lignes.derniere = { semaine: l.semaine, sources, gagnes: venues.length, bonus: deLaNuit.length, total: nbFoyers(j), familles: [...venues, ...deLaNuit] };
  const n = venues.length + deLaNuit.length;
  const t = tr`La Nuit des lignes : la ligne bleue est repeinte plus haut. ${n ? `${n > 1 ? tr`${n} familles t’ont rejoint cette semaine` : tr('1 famille t’a rejoint cette semaine')}${deLaNuit.length ? tr`, dont ${deLaNuit.length} cette nuit` : ''}.` : tr('Le quartier parle de toi.')}`;
  log(j, t);
  return t;
}

/** Ce que coûte un déplacement du batardeau des Basses : six heures de ce que produit le Générateur (les anciennes pompes) */
/** Déplacer le batardeau : un prix fixe en cristaux (9 novembre 2026 : plus aucun prix ne suit le Générateur) */
export const coutBatardeau = (j: Jeu) => 20 * Math.max(1, strateVaincue(j));

/** Une expédition dans les Basses : un Porteur va chercher la famille d'un lieu */
export interface ExpeditionBasses { lieu: string; porteur: string; debut: number; fin: number; strate: number }
/** L'état des Basses dans la sauvegarde */
export interface EtatBasses {
  /** le secteur gardé à sec (null : pas encore dressé) */
  batardeau: string | null;
  /** la semaine du dernier déplacement (un par semaine) */
  semaine: number;
  /** la dernière marée basse comptée, et les dépôts qui attendent (deux au plus) */
  vu: number;
  depots: number;
  expedition: ExpeditionBasses | null;
  /** les lieux déjà visités (leur famille est au district) */
  faits: string[];
}

/**
 * L'Accord ouvert (Bible, 23 octobre 2026) : quand le quartier fait confiance à son directeur et que la Clinique
 * sait greffer, elle offre une pierre relevée à tout volontaire du quartier. Un nouveau Résonant rejoint le district.
 */
export const ACCORD_OUVERT = { clinique: 3, confiance: CONFIANCE.accord } as const;

/** Le bilan d'une Nuit des lignes : la semaine écoulée, ce qui a fait venir les habitants, et le bonus de la nuit */
export interface NuitDesLignes {
  semaine: number; sources: Partial<Record<SourceHabitants, number>>;
  /** familles arrivées dans la semaine, et celles que la nuit a amenées en plus ; total : familles au district */
  gagnes: number; bonus: number; total: number;
  /** les familles arrivées (absent : bilan d'une ancienne sauvegarde, compté en habitants) */
  familles?: string[];
  lue?: boolean;
}

export const CREUSEURS = {
  /** creuseurs logés selon le niveau du Noyau (index = niveau). Audit du 7 novembre 2026 : avant 4, 7, 10, 14, 24… le Noyau 3
   *  logeait déjà les creuseurs de −10 et ne freinait plus rien ; étalé, chaque niveau ouvre un étage de plus :
   *  Noyau 5 pour −7, 6 pour −8 et −9, 7 pour −10. (Un Noyau 10 obligatoire pour −10 faisait 18 sessions d'attente : écarté.) */
  logement: [0, 3, 4, 5, 6, 7, 8, 9, 10, 12, 60],
  /** creuseurs qu'il faut pour ouvrir la Strate −n, qui y restent (au-delà de la table : +1 par Strate, au plus le logement) */
  // −8 à −10 : 8, 8, 9 au lieu de 9, 11, 13 (3 novembre 2026, validé par Bryan) : moins d'attente, plus de défi (FORCE.table relevée).
  // 12 novembre 2026 (Bryan : « je roule sur tout le monde, mais je dois attendre mes creuseurs ») : plus de verrou après le gardien,
  // la Strate suivante s'ouvre dès qu'il est vaincu (avant : 0, 0, 2, 3, 4, 5, 6, 7, 8, 8, 9)
  requis: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as number[],
  parStrateEnsuite: 1,
  gardien: 1,
  /** chances de ramener un fouilleur perdu : fouille ciblée, mission courte, mission longue */
  fouille: 0.25,
  /** audit du 7 novembre 2026 (mur de −7 à −10 : 15 sessions sur 18 à attendre) : une chance sur deux à partir de −6 */
  fouilleProfonde: { des: 6, chance: 0.5 },
  /**
   * Les fouilleurs du jour (8 novembre 2026, audit : −10 au jour 16 à cinq sessions par jour, au jour 40 à une seule) :
   * à partir de −6, la première fouille réussie de la journée ramène un creuseur à coup sûr ; une fois `parJour` creuseurs
   * ramenés des fouilles dans la journée, les suivantes n'en ramènent plus qu'avec `chanceEnsuite`.
   * Celui qui passe une fois par jour avance plus sûrement ; celui qui enchaîne garde l'avance, en moins grand.
   */
  fouilleursDuJour: { garantis: 1, parJour: 2, chanceEnsuite: 0.2 },
  missionCourte: 0.1,
  missionLongue: 0.3,
  epreuve: 1,
  /**
   * Les missions en mer sont illimitées (28 octobre 2026, idée de Luc) : on peut farmer composants, cartes et XP autant
   * qu'on veut, mais les naufragés ne ramènent au plus que cette part des creuseurs de l'étage suivant, par Strate.
   * Le reste vient du front (gardien, fouilles, Épreuves, Confiance) : on ne peut pas avancer plus vite dans l'histoire en mer.
   */
  naufragesParStrate: 0.65, // ≈ deux tiers (réglé au robot : le rythme de descente reste celui d'avant)
  /** creuseurs volontaires par palier de Confiance atteint */
  confiance: 1,
} as const;

/** La chance qu'une fouille ciblée réussie dans cette Strate ramène un creuseur */
export const chanceCreuseurFouille = (strate: number) => (strate >= CREUSEURS.fouilleProfonde.des ? CREUSEURS.fouilleProfonde.chance : CREUSEURS.fouille);

/** Les creuseurs déjà ramenés des fouilles aujourd'hui */
export const fouilleursDuJour = (j: Pick<Jeu, 'fouilleurs'>, now: number) => (j.fouilleurs?.jour === jourDe(now) ? j.fouilleurs.n : 0);

/** La chance qu'une fouille réussie ramène un creuseur, compte tenu de ceux déjà ramenés aujourd'hui (1 = à coup sûr) */
export function chanceCreuseurDuJour(j: Pick<Jeu, 'fouilleurs'>, strate: number, now: number): number {
  const base = chanceCreuseurFouille(strate);
  if (strate < CREUSEURS.fouilleProfonde.des) return base;
  const n = fouilleursDuJour(j, now), r = CREUSEURS.fouilleursDuJour;
  return n < r.garantis ? 1 : n < r.parJour ? base : r.chanceEnsuite;
}

/** Les creuseurs que les naufragés peuvent encore ramener pendant la Strate en cours (plafond et déjà ramenés) */
export function naufragesDeLaStrate(j: Pick<Jeu, 'strate' | 'naufrages'>): { plafond: number; ramenes: number; restants: number } {
  const plafond = Math.max(1, Math.round(creuseursRequis(j.strate + 1) * CREUSEURS.naufragesParStrate));
  const ramenes = j.naufrages?.strate === j.strate ? j.naufrages.n : 0;
  return { plafond, ramenes, restants: Math.max(0, plafond - ramenes) };
}

export function creuseursRequis(strate: number): number {
  const t = CREUSEURS.requis;
  const max = CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
  return Math.min(max, strate < t.length ? t[strate]! : t[t.length - 1]! + CREUSEURS.parStrateEnsuite * (strate - t.length + 1));
}

/** Les Porteurs présents au district (les recrues n'arrivent qu'après la chambre scellée) */
export function porteursPresents(j: Jeu): string[] {
  return PORTEURS.filter((p) => (p.arrivee ? j.arrives.includes(p.id) : p.nomme || j.recrues)).map((p) => p.id);
}

/** L'escouade enregistrée (les Porteurs présents seulement, trois au plus) */
export function escouadeDe(j: Jeu): string[] {
  const presents = porteursPresents(j);
  return [...new Set(j.escouade ?? [])].filter((id) => presents.includes(id)).slice(0, 3);
}

/** Combien d'escouades on peut enregistrer */
export const NB_ESCOUADES = 3;

/** les 2ᵉ et 3ᵉ escouades s'ouvrent après le gardien de −4 (2 novembre 2026, Bryan : « par étapes douces ») ; avant, une seule */
export const ESCOUADES_STRATE = 4;

/** Combien d'escouades on peut composer maintenant : une, puis trois après le gardien de −4 */
export const escouadesOuvertes = (j: Jeu): number => (strateVaincue(j) >= ESCOUADES_STRATE ? NB_ESCOUADES : 1);

/** L'indice de l'escouade qui descend (0 à 2) */
export const escouadeActive = (j: Jeu): number => (Number.isInteger(j.escouadeActive) && j.escouadeActive >= 0 && j.escouadeActive < escouadesOuvertes(j) ? j.escouadeActive : 0);

/** L'indice de l'escouade qui défend le port (27 octobre 2026) : celle choisie, ou celle qui descend si elle est vide */
export function escouadeDefense(j: Jeu): number {
  const d = j.escouadeDefense;
  if (Number.isInteger(d) && d! >= 0 && d! < escouadesOuvertes(j) && escouadesDe(j)[d!]!.length) return d!;
  return escouadeActive(j);
}

/** Les trois escouades enregistrées (25 octobre 2026) : celle qui descend d'abord rangée à sa place,
 * puis les autres, chacune sans les Porteurs déjà pris par une autre (un Porteur n'est que dans une seule) */
export function escouadesDe(j: Jeu): string[][] {
  const presents = porteursPresents(j);
  const a = escouadeActive(j);
  const pris = new Set(escouadeDe(j));
  // une seule escouade avant −4 : les autres restent enregistrées, mais pas montrées
  return Array.from({ length: escouadesOuvertes(j) }, (_, k) => {
    if (k === a) return escouadeDe(j);
    const liste = [...new Set(j.escouades?.[k] ?? [])].filter((id) => presents.includes(id) && !pris.has(id)).slice(0, 3);
    liste.forEach((id) => pris.add(id));
    return liste;
  });
}

/** La Strate vaincue la plus profonde (le front compte s'il a été vaincu) */
export const strateVaincue = (j: Jeu) => (j.frontVaincu ? j.strate : j.strate - 1);

/** lieu : l'id du lieu choisi (src/core/lieux.ts) ; absent sur les missions parties avant le 28 octobre 2026 */
export interface Mission { porteur: string; strate: number; duree: DureeMission; debut: number; fin: number; lieu?: string; butin?: 'cargaison' | 'pierre' | 'naufrages' | 'eclats';
  /** la part du butin (1 = plein) : les ruines proches s'épuisent au fil des départs du jour */
  rendement?: number;
  /** le niveau de fouille atteint (0 Surface, 1 Cales, 2 Cœur) ; absent quand la ruine était déjà fouillée à fond */
  profondeur?: number;
  /** des naufragés ont été recueillis (la première barque du jour vers ce lieu, dans le plafond de la Strate) */
  secours?: boolean }

/** Le rapport d'une mission rentrée (demande de Luc, 28 octobre 2026) : un petit récit et tout ce qu'elle a rapporté */
export interface RapportMission {
  porteur: string; strate: number; duree: DureeMission; fin: number; lieu?: string; butin?: Mission['butin']; eclats?: number;
  /** l'affinité du Porteur avec le lieu, et le bonus total (niveau × affinité) appliqué aux gains */
  affinite?: 'bon' | 'neutre' | 'mauvais'; mult?: number;
  recit: string[];
  composants: number; xp: number; niveau: number | null;
  /** la part du butin rapportée (1 = pleine cargaison, plus en profondeur) */
  rendement?: number;
  /** le niveau de fouille atteint (0 Surface, 1 Cales, 2 Cœur) */
  profondeur?: number;
  cartes: { id: string; nouvelle: boolean }[];
  creuseurs: number; usure: number; marque: string | null;
  /** les familles du quartier que le retour de la barque a convaincues (avant le 7 novembre 2026 : des habitants) */
  habitants?: number;
  /** une expédition dans les Basses : le lieu et la famille ramenée (7 novembre 2026) */
  basses?: { lieu: string; famille: string };
  /** un contrat de marée (31 octobre 2026) : toute l'équipe, réussi ou non, et l'épreuve qui a cédé */
  contrat?: { rang: 'montante' | 'vive' | 'grande'; titre: string; reussi: boolean; porteurs: string[]; taux: number; choix: boolean; cedee?: string };
  lu: boolean;
}

/** Un contrat de marée en mer : un Porteur par épreuve, dans l'ordre ; le taux est fixé au départ */
export interface ContratEnMer { id: string; rang: 'montante' | 'vive' | 'grande'; porteurs: string[]; debut: number; fin: number; taux: number; strate: number }
/** rapports lus gardés pour les relire (les non lus ne sont jamais effacés) */
export const RAPPORTS_LUS_MAX = 5;

/** renouvele : les étals ont déjà été renouvelés aujourd'hui (1er novembre 2026) */
export interface Comptoir { jour: number; offres: string[]; achetes: number[]; rng: number; renouvele?: boolean; /** Éclats achetés aujourd'hui */ eclats?: number }

export type DureeMission = 'courte' | 'longue';
