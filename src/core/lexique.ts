// Le lexique du jeu (31 octobre 2026, Luc : « faudrait le glossaire quelque part, je vois pas ce que c'est fissuré »).
// Une seule source pour tous les mots du jeu : les « ? » du journal, les mots touchables dans le texte des cartes,
// et le glossaire du mode d'emploi. Une règle qui change se corrige ici, et partout à la fois.
// Aucun affichage ici : seulement des noms, des textes et des motifs pour les reconnaître.

import { CHARGE } from './collection';
import { CONDITIONS, METAL_FREQ } from './donnees';
import { REGLES } from './regles';

export type ThemeTerme = 'cartes' | 'combat' | 'ennemi' | 'district' | 'marque' | 'effet';

export interface Terme {
  nom: string;
  texte: string;
  theme: ThemeTerme;
  /** comment le reconnaître dans une ligne du journal (absent : le terme n'y met pas de « ? ») */
  motif?: RegExp;
  /** comment le reconnaître dans le texte d'une carte ou d'une aide, pour le rendre touchable (absent : jamais souligné) */
  mots?: RegExp;
}

export const NOMS_THEMES: Record<ThemeTerme, string> = {
  cartes: 'Les cartes',
  combat: 'Le combat',
  ennemi: 'Les ennemis et les salles',
  district: 'Le district et les Strates',
  marque: 'Les Marques des Porteurs',
  effet: 'Les effets de cartes',
};

/** Un mot entier (les lettres accentuées comptent comme des lettres) */
const mot = (s: string, drapeaux = '') => new RegExp(`(?<!\\p{L})(?:${s})(?!\\p{L})`, `u${drapeaux}`);
const pc = (x: number) => `${Math.round(x * 100)} %`;
const suites = Object.entries(REGLES.multSuite).map(([n, m]) => `${n} = +${pc(m - 1)}`).join(', ');

/** Chaque terme : son nom, ce qu'il fait en une ou deux phrases, et comment le reconnaître */
export const LEXIQUE: Record<string, Terme> = {
  resonance: { nom: 'Résonance', motif: /Résonance/, texte: `Des Fréquences qui se suivent dans l’ordre dans la chaîne (3, 4, 5…). Suite de ${suites} : toutes les cartes de la chaîne sont renforcées d’autant, et le Flux monte de 1.`, theme: 'combat', mots: mot('Résonances?|(?<=(?:ta|une|la|sa|les|des|ses|tes|en) )suites?') },
  echo: { nom: 'Écho', motif: /Écho(?! ancien| de veilleur|-)/, texte: `Trois cartes de la même Fréquence dans la chaîne : ces trois cartes sont renforcées de +${Math.round((REGLES.echo - 1) * 100)} % (dégâts, protection ou soin) et l’escouade gagne 1 Flux.`, theme: 'combat', mots: mot('Échos?') },
  flux: { nom: 'Flux', motif: /Flux/, texte: `La réserve sous la chaîne (${REGLES.fluxMax} au plus). Elle se remplit par une Résonance, un Écho ou une Fêlure brisée dans une suite ; on la dépense pour une place de plus, une nouvelle main, ou un Coup d’éclat quand elle est pleine.`, theme: 'combat', mots: mot('Flux') },
  bouclier: { nom: 'Bouclier d’escouade', motif: /bouclier d’escouade|protégé/, texte: 'Commun aux trois Porteurs : il prend les coups ennemis avant leurs PV. Quand plusieurs Porteurs vont être touchés, il couvre d’abord celui marqué d’un bouclier : le plus menacé, ou celui que tu touches. Il retombe à zéro à la fin du tour ennemi (sauf Rempart ou Bras de quai).', theme: 'combat', mots: /bouclier d’escouade/ },
  absorbe: { nom: 'Absorbé', motif: /absorbés?/, texte: 'La part du coup prise par un bouclier : elle ne touche pas les PV. Perçant passe outre le bouclier de l’ennemi.', theme: 'combat' },
  lignee: { nom: 'Triangle des lignées', motif: /lignée/, texte: `Les Augmentés battent les Résonants, les Résonants battent les Génés, les Génés battent les Augmentés : +${pc(REGLES.bonusLignee - 1)} sur ce coup. Vrai pour toi comme pour l’ennemi.`, theme: 'combat', mots: /triangle des lignées/ },
  felure: { nom: 'Fêlure', motif: /Fêlure/, texte: 'Chaque ennemi montre une Fréquence fêlée. Une carte de cette Fréquence dans la chaîne affaiblit son attaque, son bouclier ou son soin (pas une Concentration ni une Dissonance) ; dans une suite qui résonne, elle donne aussi du Flux.', theme: 'combat', mots: /Fêlures?/ },
  fissure: { nom: 'Fissure', motif: /Fissure/, texte: 'Un ennemi touché par une carte à effet Fissure devient fissuré : il prend plus de dégâts de toutes les cartes posées après elle, ce tour-ci et le suivant. Certaines cartes (Curée) frappent encore plus fort un ennemi fissuré.', theme: 'effet', mots: mot('fissuré(?:e|s|es)?|Fissure') },
  desarme: { nom: 'Désarmer', motif: /Désarmé/, texte: 'La prochaine attaque de l’ennemi visé perd une part de sa force.', theme: 'effet' },
  elan: { nom: 'Élan', motif: /Élan/, texte: 'La chaîne du tour suivant a une place de plus.', theme: 'effet' },
  rempart: { nom: 'Rempart', motif: /Rempart/, texte: 'Une part du bouclier d’escouade qui reste après le tour ennemi est gardée pour le tour suivant.', theme: 'effet' },
  quai: { nom: 'Bras de quai', motif: /Bras de quai/, texte: 'La Marque de Docker : une part du bouclier d’escouade restant est gardée à chaque tour.', theme: 'marque' },
  dissonance: { nom: 'Dissonance', motif: /brouillé/, texte: 'L’ennemi brouille tes Fréquences : au tour suivant, aucune suite ne résonne. Les Échos comptent toujours.', theme: 'ennemi' },
  siphon: { nom: 'Siphon', motif: /Siphon/, texte: 'Le Porteur qui joue la carte récupère une part des dégâts qu’elle inflige.', theme: 'effet' },
  epines: { nom: 'Épines', motif: /Épines/, texte: 'Cet ennemi renvoie une part des coups au Porteur qui frappe, sans jamais le mettre à terre.', theme: 'ennemi' },
  concentration: { nom: 'Concentration', motif: /se concentre|Concentration/, texte: 'L’ennemi a passé un tour à se concentrer : sa prochaine attaque fait le double de dégâts.', theme: 'ennemi' },
  furie: { nom: 'Furie', motif: /Furie/, texte: 'Sous la moitié de ses PV, cet ennemi frappe 30 % plus fort.', theme: 'ennemi' },
  regeneration: { nom: 'Régénération', motif: /régénère/, texte: 'Cet ennemi regagne une part de ses PV à la fin de chacun de ses tours.', theme: 'ennemi' },
  vengeur: { nom: 'Vengeur', motif: /venge/, texte: 'Quand un allié tombe, la prochaine attaque de cet ennemi est doublée.', theme: 'ennemi' },
  aspire: { nom: 'Aspiration', motif: /aspire/, texte: 'Si son coup passe ton bouclier, cet ennemi te prend 1 Flux. Un coup entièrement bloqué ne prend rien.', theme: 'ennemi' },
  eboulis: { nom: 'Éboulis', motif: /Éboulis|pierres/, texte: 'Une condition de salle : à chaque tour ennemi, des pierres retirent quelques PV à tout le monde, sans mettre personne à terre.', theme: 'ennemi' },
  aTerre: { nom: 'À terre', motif: /à terre|Porteur à terre/, texte: `Un Porteur à 0 PV ne meurt pas : ses cartes restent dans le deck mais s’éteignent (−${pc(1 - REGLES.eteinte)} de force, sans effet). Elles comptent toujours pour les suites.`, theme: 'combat', mots: /à terre/ },
  seconde: { nom: 'Seconde chance', motif: /Seconde chance/, texte: 'La Marque de Sasha : le premier Porteur qui tombe se relève, une fois par combat.', theme: 'marque' },
  nuit: { nom: 'Nuit blanche', motif: /Nuit blanche/, texte: 'La Marque de Joss : après chaque tour ennemi, le Porteur le plus blessé récupère quelques PV.', theme: 'marque' },
  chitine: { nom: 'Née-de-mue', motif: /Née-de-mue/, texte: 'La Marque de Kessa : une part de ce que le bouclier d’escouade absorbe est renvoyée à l’ennemi qui frappe.', theme: 'marque' },
  debridage: { nom: 'Débridage', motif: /Débridage/, texte: `Coup d’éclat des Augmentés : les attaques de la chaîne de ce tour frappent ${pc(REGLES.eclat.debride - 1)} plus fort.`, theme: 'combat' },
  ombre: { nom: 'Ombre agissante', motif: /Ombre agissante|l’ombre/, texte: 'Coup d’éclat des Résonants : aucune attaque ennemie ne porte pendant le tour ennemi qui suit.', theme: 'combat' },
  sursaut: { nom: 'Sursaut', motif: /Sursaut/, texte: 'Coup d’éclat des Génés : toute l’escouade récupère une grosse part de ses PV, et un Porteur à terre se relève.', theme: 'combat' },
  surcharge: { nom: 'Surcharge', motif: /Surcharge/, texte: 'Un effet de carte : il remplit le Flux.', theme: 'effet' },
  decharge: { nom: 'Décharge', motif: /Décharge/, texte: 'Un effet de carte : il vide tout le Flux, et la carte gagne de la force pour chaque Flux vidé.', theme: 'effet' },
  riposte: { nom: 'Riposte', motif: /Riposte/, texte: 'Après son bouclier, la carte frappe d’une part de tout le bouclier d’escouade, sans le dépenser.', theme: 'effet' },
  crescendo: { nom: 'Crescendo', motif: /Crescendo/, texte: 'Plus la carte arrive tard dans la chaîne, plus elle frappe fort.', theme: 'effet' },
  unisson: { nom: 'Unisson', motif: /Unisson/, texte: 'La carte gagne de la force pour chaque autre carte de la même Fréquence dans la chaîne.', theme: 'effet' },
  curee: { nom: 'Curée', motif: /Curée/, texte: 'La carte frappe plus fort un ennemi fissuré, ou à moins de la moitié de ses PV.', theme: 'effet' },
  faille: { nom: 'Faille', motif: /Faille/, texte: 'La carte frappe plus fort un ennemi dont la Fêlure est déjà brisée.', theme: 'effet' },
  rafale: { nom: 'Rafale', motif: /Rafale/, texte: 'Dans une chaîne d’au moins 4 cartes, la carte frappe une seconde fois.', theme: 'effet' },
  debord: { nom: 'Débord', motif: /Débord/, texte: 'La carte soigne toute l’escouade ; le soin qui dépasse les PV max devient du bouclier d’escouade.', theme: 'effet' },
  rapt: { nom: 'Rapt', motif: /Rapt/, texte: 'Une carte exclusive : elle arrache tout le bouclier de l’ennemi visé et le donne à l’escouade.', theme: 'effet' },
  rappel: { nom: 'Rappel', motif: /Rappel/, texte: 'Une carte exclusive : la carte la plus forte de la chaîne revient en tête de pioche.', theme: 'effet' },
  surtension: { nom: 'Surtension', motif: /Surtension/, texte: 'Une carte exclusive : le Porteur brûle une part de ses PV (sans tomber) pour frapper beaucoup plus fort.', theme: 'effet' },
  empreinte: { nom: 'Empreinte', motif: /Empreinte/, texte: 'Une carte exclusive : elle copie l’effet de la carte posée juste avant elle.', theme: 'effet' },
  releve: { nom: 'Relève', motif: /Relève/, texte: 'Une carte exclusive : un Porteur à terre se relève avec tout le soin.', theme: 'effet' },
  blinde: { nom: 'Blindé', motif: /Blindé/, texte: 'Cet ennemi retire quelques points à chaque coup (un peu plus en profondeur). Perçant passe outre.', theme: 'ennemi' },
  percant: { nom: 'Perçant', motif: /Perçant|transpercé/, texte: 'Le coup ignore le bouclier et le blindage de l’ennemi.', theme: 'effet' },
  evanescent: { nom: 'Évanescent', motif: /Évanescent/, texte: 'Hors Résonance, cet ennemi ne prend qu’une part des coups : fais des suites.', theme: 'ennemi' },
  eternise: { nom: 'Combat qui s’éternise', motif: /s’éternise/, texte: 'À partir du tour 25, les attaques ennemies grossissent de 10 % par tour (et dès le tour 10, les ennemis se soignent de moins en moins) : aucun combat ne tourne en rond.', theme: 'combat' },
  pleins: { nom: 'PV déjà pleins', motif: /PV déjà pleins/, texte: 'Un soin ne dépasse jamais les PV max : le surplus est perdu.', theme: 'combat' },
  nouvelleMain: { nom: 'Nouvelle main', motif: /nouvelle main/, texte: 'Pour 1 Flux, la main et les cartes déjà posées partent à la défausse, et l’on pioche une main neuve.', theme: 'combat' },

  // ---- les mots de base, qui n'apparaissent pas dans les calculs du journal ----
  frequence: { nom: 'Fréquence', theme: 'cartes', mots: /Fréquences?/, texte: 'Le chiffre de 1 à 9 serti dans le cristal en haut à gauche de la carte. Des Fréquences qui se suivent dans la chaîne font une Résonance ; trois identiques font un Écho.' },
  force: { nom: 'Force', theme: 'cartes', texte: 'Le chiffre dans le socle en bas à droite de la carte : ses dégâts (étoile rouge), son bouclier (écu bleu) ou son soin (fleur émeraude), avant les bonus et les malus.' },
  metal: { nom: 'Métal', theme: 'cartes', mots: mot('métal'), texte: `La rareté d’une carte : fer, cuivre, argent, or, nacre. En fer, une carte n’a pas d’effet ; il s’ouvre en cuivre et se renforce en or et en nacre. Une carte a ${METAL_FREQ.argent} Fréquences en argent et en or, ${METAL_FREQ.nacre} en nacre. Une carte se trouve directement dans son métal.` },
  doublon: { nom: 'Doublon', theme: 'cartes', mots: /doublons?/, texte: 'Un exemplaire de plus d’une carte que tu as déjà. Les doublons font monter la carte de niveau ; ceux en trop se recyclent en composants.' },
  charge: { nom: 'Charge', theme: 'cartes', mots: mot('Charge'), texte: `Le poids d’une carte confiée à un Porteur : sa force divisée par ${CHARGE.diviseur} (1 au moins). Un Porteur porte ${CHARGE.base} de Charge au niveau 1, et ${CHARGE.parNiveau} de plus à chaque niveau.` },
  porteur: { nom: 'Porteur', theme: 'cartes', mots: mot('Porteurs?'), texte: 'Un des personnages qui descendent pour toi. Chacun a une lignée et porte des cartes de sa lignée : ensemble, les cartes de ton escouade forment ton deck.' },
  escouade: { nom: 'Escouade', theme: 'cartes', mots: mot('escouade'), texte: 'Les trois Porteurs qui descendent ensemble. On ne la change qu’au district, jamais pendant une descente.' },
  augmentes: { nom: 'Augmentés', theme: 'cartes', mots: mot('Augmentée?s?'), texte: 'La lignée qui frappe : de grosses attaques. Ils battent les Résonants.' },
  genes: { nom: 'Génés', theme: 'cartes', mots: mot('Génée?s?'), texte: 'La lignée qui tient : boucliers et soins. Ils battent les Augmentés.' },
  resonants: { nom: 'Résonants', theme: 'cartes', mots: mot('Résonante?s?'), texte: 'La lignée qui orchestre : Fréquences, suites, Échos, et affaiblir l’ennemi. Ils battent les Génés.' },
  chaine: { nom: 'Chaîne', theme: 'combat', mots: mot('chaîne'), texte: `Les cartes que tu poses ce tour-ci, dans l’ordre où elles agiront. Elle a ${REGLES.capaciteBase} places ; le Flux ou l’Élan en ajoutent, jusqu’à ${REGLES.capaciteMax}.` },
  defausse: { nom: 'Défausse', theme: 'combat', mots: mot('défausse'), texte: 'Les cartes déjà jouées ou rejetées depuis le dernier mélange. Quand la pioche est vide, la défausse est mélangée et devient la nouvelle pioche.' },
  pioche: { nom: 'Pioche', theme: 'combat', mots: mot('pioche'), texte: 'Les cartes qui restent à piocher avant le prochain mélange. Tu sais lesquelles, pas dans quel ordre elles viendront.' },
  eclat: { nom: 'Coup d’éclat', theme: 'combat', mots: /Coups? d’éclat/, texte: `Quand le Flux est plein (${REGLES.fluxMax}), on peut le dépenser pour le Coup d’éclat de sa lignée : Débridage (Augmentés), Sursaut (Génés) ou Ombre agissante (Résonants).` },
  gardien: { nom: 'Gardien', theme: 'district', mots: mot('gardiens?'), texte: 'L’ennemi le plus fort d’une Strate : il garde l’accès à l’étage suivant. Le vaincre permet de creuser plus bas.' },
  strate: { nom: 'Strate', theme: 'district', mots: mot('Strates?'), texte: 'Un étage creusé sous la ville, exploré salle par salle. Plus on descend, plus c’est ancien, dangereux et précieux.' },
  creuseurs: { nom: 'Creuseurs', theme: 'district', mots: mot('creuseurs?'), texte: 'Les ouvriers qui creusent l’étage suivant. Pour ouvrir une nouvelle Strate, il faut avoir vaincu son gardien, assez de creuseurs et le bon niveau de Tour du Noyau.' },
  usure: { nom: 'Usure', theme: 'district', mots: mot('Usure'), texte: 'Les PV perdus en bas restent perdus au retour au district. La Clinique soigne l’Usure pendant que le Porteur se repose.' },
  composants: { nom: 'Composants', theme: 'district', mots: mot('composants?'), texte: 'La monnaie de base du district. On en gagne en bas, en mission et en recyclant ses doublons ; ils servent au Comptoir, à monter les cartes de niveau et à la Forge.' },
  eclats: { nom: 'Éclats', theme: 'district', mots: mot('Éclats'), texte: 'Des fragments de cristal chargés d’empreintes, rares : gardiens, caches profondes, Butin de la semaine. Ils servent aux cartes rares de la Forge et du Comptoir, et aux grands chantiers.' },
  energie: { nom: 'Énergie', theme: 'district', mots: mot('énergie', 'i'), texte: 'Le courant produit par le Générateur. Il sert surtout à améliorer les bâtiments et à faire tourner les pompes.' },
  // Explorer ou fouiller (31 octobre 2026, explorer.ts)
  vestige: { nom: 'Vestige', theme: 'ennemi', mots: mot('Vestiges?'), texte: 'Un objet d’autrefois caché dans une Strate, 5 par Strate. On ne les trouve qu’en explorant (jamais en fouille), marqués d’un losange turquoise sur le plan. Les cinq réunis, la Strate est relevée : une carte au choix, et ses fouilles voient tout le plan avec un filon plus riche.' },
  rodeur: { nom: 'Rôdeur', theme: 'ennemi', mots: mot('Rôdeurs?'), texte: 'Une créature unique par zone, croisée en explorant une Strate déjà vaincue. Elle s’enfuit au bout de 4 tours, et garde ses blessures d’une descente à l’autre. Abattue, elle laisse un trophée : une carte au choix.' },
  etoiles: { nom: 'Étoiles de Strate', theme: 'ennemi', mots: mot('étoiles?', 'i'), texte: 'Trois par Strate, gagnées en explorant jusqu’au gardien : le vaincre, le vaincre sans qu’aucun Porteur ne tombe, le vaincre sans campement. Chaque étoile donne des Éclats, et tous les 5 étoiles, une carte au choix.' },
  eveille: { nom: 'Gardien éveillé', theme: 'ennemi', mots: mot('Gardien éveillé', 'i'), texte: 'Le gardien d’une Strate déjà vaincue, quand on y retourne explorer : un peu plus fort (+10 %), mais il laisse de meilleures cartes et un Éclat de plus.' },
  marque: { nom: 'Marque', theme: 'marque', mots: mot('Marques?'), texte: 'L’effet propre à un Porteur, gagné par ses exploits. Chaque Porteur a la sienne.' },
};
// les conditions de salle : leur nom dans le calcul, leur texte tel quel
for (const c of Object.values(CONDITIONS)) LEXIQUE[`salle-${c.id}`] = { nom: c.nom, texte: c.texte, theme: 'ennemi', motif: new RegExp(c.nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) };

const duJournal = () => Object.values(LEXIQUE).filter((t): t is Terme & { motif: RegExp } => !!t.motif);

/** Le terme qui explique un nom (une ligne de calcul du journal) */
export const termeDe = (nom: string): Terme | undefined => duJournal().find((t) => t.motif.test(nom));

/** Les termes d'une ligne du journal, sans doublon, dans l'ordre où ils apparaissent (3 au plus) */
export function termesDe(texte: string): Terme[] {
  return duJournal().filter((t) => t.motif.test(texte))
    .sort((a, b) => texte.search(a.motif) - texte.search(b.motif)).slice(0, 3);
}

/** Un morceau de texte : soit du texte simple, soit un mot du jeu (avec l'id de son terme) */
export type Morceau = { texte: string; terme?: string };

/**
 * Découpe un texte en morceaux, pour rendre touchables les mots du jeu.
 * Chaque terme n'est marqué qu'une fois (sa première apparition), et jamais celui qu'on est en train d'expliquer.
 */
export function decouper(texte: string, sauf: ReadonlySet<string> = new Set()): Morceau[] {
  const trouves: { debut: number; fin: number; id: string }[] = [];
  for (const [id, t] of Object.entries(LEXIQUE)) {
    if (!t.mots || sauf.has(id)) continue;
    const m = new RegExp(t.mots.source, t.mots.flags.replace('g', '')).exec(texte);
    if (m) trouves.push({ debut: m.index, fin: m.index + m[0].length, id });
  }
  trouves.sort((a, b) => a.debut - b.debut || b.fin - a.fin);
  const morceaux: Morceau[] = [];
  let i = 0;
  for (const t of trouves) {
    if (t.debut < i) continue; // chevauche un mot déjà marqué
    if (t.debut > i) morceaux.push({ texte: texte.slice(i, t.debut) });
    morceaux.push({ texte: texte.slice(t.debut, t.fin), terme: t.id });
    i = t.fin;
  }
  if (i < texte.length) morceaux.push({ texte: texte.slice(i) });
  return morceaux;
}
