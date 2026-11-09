// Le lexique du jeu (31 octobre 2026, Luc : « faudrait le glossaire quelque part, je vois pas ce que c'est fissuré »).
// Une seule source pour tous les mots du jeu : les « ? » du journal, les mots touchables dans le texte des cartes,
// et le glossaire du mode d'emploi. Une règle qui change se corrige ici, et partout à la fois.
// Aucun affichage ici : seulement des noms, des textes et des motifs pour les reconnaître.

import { CHARGE } from './collection';
import { CONDITIONS, METAL_FREQ } from './donnees';
import { REGLES, pctEcho } from './regles';
import { langue, t } from './i18n';

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
  cartes: t('Les cartes'),
  combat: t('Le combat'),
  ennemi: t('Les ennemis et les salles'),
  district: t('Le district et les Strates'),
  marque: t('Les Marques des Porteurs'),
  effet: t('Les effets de cartes'),
};

/** Un mot entier (les lettres accentuées comptent comme des lettres) */
const mot = (s: string, drapeaux = '') => new RegExp(`(?<!\\p{L})(?:${s})(?!\\p{L})`, `u${drapeaux}`);
const pc = (x: number) => `${Math.round(x * 100)} %`;
const suites = Object.entries(REGLES.multSuite).map(([n, m]) => `${n} = +${pc(m - 1)}`).join(', ');

/** Chaque terme : son nom, ce qu'il fait en une ou deux phrases, et comment le reconnaître */
export const LEXIQUE: Record<string, Terme> = {
  resonance: { nom: t('Résonance'), motif: /Résonance/, texte: t`Au moins trois Fréquences qui se suivent dans l’ordre dans la chaîne (3, 4, 5…) ; deux ne suffisent pas. Suite de ${suites} : toutes les cartes de la chaîne sont renforcées d’autant, et le Flux monte de 1.`, theme: 'combat', mots: mot('Résonances?|(?<=(?:ta|une|la|sa|les|des|ses|tes|en) )suites?') },
  echo: { nom: t('Écho'), motif: /Écho(?! ancien| de veilleur|-)/, texte: t`Trois cartes de la même Fréquence dans la chaîne : ces cartes sont renforcées de +${Math.round((REGLES.echo - 1) * 100)} % (dégâts, protection ou soin) et l’escouade gagne 1 Flux. Quatre : ${pctEcho(4)} (Écho ×4) ; cinq : ${pctEcho(5)} et 1 Flux de plus (Écho ×5).`, theme: 'combat', mots: mot('Échos?') },
  flux: { nom: t('Flux'), motif: /Flux/, texte: t`La réserve sous la chaîne (${REGLES.fluxMax} au plus). Elle se remplit par une Résonance, un Écho ou une Fêlure brisée dans une suite ; on la dépense pour une place de plus, une nouvelle main, ou un Coup d’éclat quand elle est pleine.`, theme: 'combat', mots: mot('Flux') },
  bouclier: { nom: t('Bouclier d’escouade'), motif: /bouclier d’escouade|protégé/, texte: t('Commun aux trois Porteurs : il prend les coups ennemis avant leurs PV. Quand plusieurs Porteurs vont être touchés, il couvre d’abord celui marqué d’un bouclier : le plus menacé, ou celui que tu touches. Il retombe à zéro à la fin du tour ennemi (sauf Rempart ou Bras de quai).'), theme: 'combat', mots: /bouclier d’escouade/ },
  absorbe: { nom: t('Absorbé'), motif: /absorbés?/, texte: t('La part du coup prise par un bouclier : elle ne touche pas les PV. Perçant passe outre le bouclier de l’ennemi.'), theme: 'combat' },
  lignee: { nom: t('Triangle des lignées'), motif: /lignée/, texte: t`Les Augmentés battent les Résonants, les Résonants battent les Génés, les Génés battent les Augmentés : +${pc(REGLES.bonusLignee - 1)} sur ce coup. Vrai pour toi comme pour l’ennemi.`, theme: 'combat', mots: /triangle des lignées/ },
  felure: { nom: t('Fêlure'), motif: /Fêlure/, texte: t('Chaque ennemi montre une Fréquence fêlée. Une carte de cette Fréquence dans la chaîne affaiblit son attaque, son bouclier ou son soin (pas une Concentration ni une Dissonance) ; dans une suite qui résonne, elle donne aussi du Flux.'), theme: 'combat', mots: /Fêlures?/ },
  fissure: { nom: t('Fissure'), motif: /Fissure/, texte: t('Un ennemi touché par une carte à effet Fissure devient fissuré : il prend plus de dégâts de toutes les cartes posées après elle, ce tour-ci et le suivant. Certaines cartes (Curée) frappent encore plus fort un ennemi fissuré.'), theme: 'effet', mots: mot('fissuré(?:e|s|es)?|Fissure') },
  desarme: { nom: t('Troubler'), motif: /Troublé/, texte: t('L’attaque déjà annoncée par l’ennemi visé perd une part de sa force (rien s’il prépare autre chose).'), theme: 'effet' },
  elan: { nom: t('Élan'), motif: /Élan/, texte: t('La chaîne du tour suivant a une place de plus.'), theme: 'effet' },
  rempart: { nom: t('Rempart'), motif: /Rempart/, texte: t('Une part du bouclier d’escouade qui reste après le tour ennemi est gardée pour le tour suivant.'), theme: 'effet' },
  quai: { nom: t('Bras de quai'), motif: /Bras de quai/, texte: t('La Marque de Docker : une part du bouclier d’escouade restant est gardée à chaque tour.'), theme: 'marque' },
  dissonance: { nom: t('Dissonance'), motif: /brouillé/, texte: t('L’ennemi brouille tes Fréquences : au tour suivant, ni suite ni Écho ne résonne.'), theme: 'ennemi', mots: mot('Dissonances?') },
  siphon: { nom: t('Siphon'), motif: /Siphon/, texte: t('Le Porteur qui joue la carte récupère une part des dégâts qu’elle inflige.'), theme: 'effet' },
  epines: { nom: t('Épines'), motif: /Épines/, texte: t('Cet ennemi renvoie une part des coups au Porteur qui frappe, sans jamais le mettre à terre.'), theme: 'ennemi' },
  concentration: { nom: t('Concentration'), motif: /se concentre|Concentration/, texte: t('L’ennemi a passé un tour à se concentrer : sa prochaine attaque fait le double de dégâts.'), theme: 'ennemi' },
  furie: { nom: t('Furie'), motif: /Furie/, texte: t('Sous la moitié de ses PV, cet ennemi frappe 30 % plus fort.'), theme: 'ennemi' },
  regeneration: { nom: t('Régénération'), motif: /régénère/, texte: t('Cet ennemi regagne une part de ses PV à la fin de chacun de ses tours.'), theme: 'ennemi' },
  vengeur: { nom: t('Vengeur'), motif: /venge/, texte: t('Quand un allié tombe, la prochaine attaque de cet ennemi est doublée.'), theme: 'ennemi' },
  aspire: { nom: t('Aspiration'), motif: /aspire/, texte: t('Si son coup passe ton bouclier, cet ennemi te prend 1 Flux. Un coup entièrement bloqué ne prend rien.'), theme: 'ennemi' },
  eboulis: { nom: t('Éboulis'), motif: /Éboulis|pierres/, texte: t('Une condition de salle : à chaque tour ennemi, des pierres retirent quelques PV à tout le monde, sans mettre personne à terre.'), theme: 'ennemi' },
  aTerre: { nom: t('À terre'), motif: /à terre|Porteur à terre/, texte: t`Un Porteur à 0 PV ne meurt pas : ses cartes restent dans le deck mais s’éteignent (−${pc(1 - REGLES.eteinte)} de force, sans effet). Elles comptent toujours pour les suites.`, theme: 'combat', mots: /à terre/ },
  seconde: { nom: t('Seconde chance'), motif: /Seconde chance/, texte: t('La Marque de Sasha : le premier Porteur qui tombe se relève, une fois par combat.'), theme: 'marque' },
  nuit: { nom: t('Nuit blanche'), motif: /Nuit blanche/, texte: t('La Marque de Joss : après chaque tour ennemi, le Porteur le plus blessé récupère quelques PV.'), theme: 'marque' },
  chitine: { nom: t('Née-de-mue'), motif: /Née-de-mue/, texte: t('La Marque de Kessa : une part de ce que le bouclier d’escouade absorbe est renvoyée à l’ennemi qui frappe.'), theme: 'marque' },
  debridage: { nom: t('Débridage'), motif: /Débridage/, texte: t`Coup d’éclat des Augmentés : les attaques de la chaîne de ce tour frappent ${pc(REGLES.eclat.debride - 1)} plus fort.`, theme: 'combat' },
  ombre: { nom: t('Ombre agissante'), motif: /Ombre agissante|l’ombre/, texte: t('Coup d’éclat des Résonants : aucune attaque ennemie ne porte pendant le tour ennemi qui suit.'), theme: 'combat' },
  sursaut: { nom: t('Sursaut'), motif: /Sursaut/, texte: t('Coup d’éclat des Génés : toute l’escouade récupère une grosse part de ses PV, et un Porteur à terre se relève.'), theme: 'combat' },
  surcharge: { nom: t('Surcharge'), motif: /Surcharge/, texte: t('Un effet de carte : il remplit le Flux.'), theme: 'effet' },
  decharge: { nom: t('Décharge'), motif: /Décharge/, texte: t('Un effet de carte : il vide tout le Flux, et la carte gagne de la force pour chaque Flux vidé.'), theme: 'effet' },
  riposte: { nom: t('Riposte'), motif: /Riposte/, texte: t('Après son bouclier, la carte frappe d’une part de tout le bouclier d’escouade, sans le dépenser.'), theme: 'effet' },
  crescendo: { nom: t('Crescendo'), motif: /Crescendo/, texte: t('Plus la carte arrive tard dans la chaîne, plus elle frappe fort.'), theme: 'effet' },
  unisson: { nom: t('Unisson'), motif: /Unisson/, texte: t('La carte gagne de la force pour chaque autre carte de la même Fréquence dans la chaîne.'), theme: 'effet' },
  curee: { nom: t('Curée'), motif: /Curée/, texte: t('La carte frappe plus fort un ennemi fissuré, ou à moins de la moitié de ses PV.'), theme: 'effet' },
  faille: { nom: t('Faille'), motif: /Faille/, texte: t('La carte frappe plus fort un ennemi dont la Fêlure est déjà brisée.'), theme: 'effet' },
  rafale: { nom: t('Rafale'), motif: /Rafale/, texte: t('Dans une chaîne d’au moins 4 cartes, la carte frappe une seconde fois.'), theme: 'effet' },
  debord: { nom: t('Débord'), motif: /Débord/, texte: t('La carte soigne toute l’escouade ; le soin qui dépasse les PV max devient du bouclier d’escouade.'), theme: 'effet' },
  rapt: { nom: t('Rapt'), motif: /Rapt/, texte: t('Une carte exclusive : elle arrache tout le bouclier de l’ennemi visé et le donne à l’escouade.'), theme: 'effet' },
  rappel: { nom: t('Rappel'), motif: /Rappel/, texte: t('Une carte exclusive : la carte la plus forte de la chaîne revient en tête de pioche.'), theme: 'effet' },
  surtension: { nom: t('Surtension'), motif: /Surtension/, texte: t('Une carte exclusive : le Porteur brûle une part de ses PV (sans tomber) pour frapper beaucoup plus fort.'), theme: 'effet' },
  empreinte: { nom: t('Empreinte'), motif: /Empreinte/, texte: t('Une carte exclusive : elle copie l’effet de la carte posée juste avant elle.'), theme: 'effet' },
  releve: { nom: t('Relève'), motif: /Relève/, texte: t('Une carte exclusive : un Porteur à terre se relève avec tout le soin.'), theme: 'effet' },
  blinde: { nom: t('Blindé'), motif: /Blindé/, texte: t('Cet ennemi retire quelques points à chaque coup (un peu plus en profondeur). Perçant passe outre.'), theme: 'ennemi' },
  percant: { nom: t('Perçant'), motif: /Perçant|transpercé/, texte: t('Le coup ignore le bouclier et le blindage de l’ennemi.'), theme: 'effet' },
  evanescent: { nom: t('Évanescent'), motif: /Évanescent/, texte: t('Hors Résonance, cet ennemi ne prend qu’une part des coups : fais des suites.'), theme: 'ennemi' },
  eternise: { nom: t('Combat qui s’éternise'), motif: /s’éternise/, texte: t('À partir du tour 12, les attaques ennemies grossissent de 15 % par tour (et dès le tour 10, les ennemis se soignent de moins en moins) : aucun combat ne tourne en rond, même avec une escouade qui ne fait que tenir.'), theme: 'combat' },
  pleins: { nom: t('PV déjà pleins'), motif: /PV déjà pleins/, texte: t('Un soin ne dépasse jamais les PV max : le surplus est perdu.'), theme: 'combat' },
  nouvelleMain: { nom: t('Nouvelle main'), motif: /nouvelle main/, texte: t('Pour 1 Flux, la main et les cartes déjà posées partent à la défausse, et l’on pioche une main neuve.'), theme: 'combat' },

  // ---- les mots de base, qui n'apparaissent pas dans les calculs du journal ----
  frequence: { nom: t('Fréquence'), theme: 'cartes', mots: /Fréquences?/, texte: t('Le chiffre de 1 à 9 serti dans le cristal en haut à gauche de la carte. Des Fréquences qui se suivent dans la chaîne font une Résonance ; trois identiques font un Écho.') },
  force: { nom: t('Force'), theme: 'cartes', texte: t('Le chiffre dans le socle en bas à droite de la carte : ses dégâts (étoile rouge), son bouclier (écu bleu) ou son soin (fleur émeraude), sa valeur de base. En combat, la carte affiche le chiffre final, tous bonus et malus compris.') },
  metal: { nom: t('Métal'), theme: 'cartes', mots: mot('métal'), texte: t`La rareté d’une carte : fer, cuivre, argent, or, nacre. En fer, une carte n’a pas d’effet ; il s’ouvre en cuivre et se renforce en or et en nacre. Une carte a ${METAL_FREQ.argent} Fréquences en argent et en or, ${METAL_FREQ.nacre} en nacre. Une carte se trouve directement dans son métal.` },
  doublon: { nom: t('Doublon'), theme: 'cartes', mots: /doublons?/, texte: t('Un exemplaire de plus d’une carte que tu as déjà. Les doublons font monter la carte de niveau ; ceux en trop se recyclent en minerai.') },
  charge: { nom: t('§poids§Charge'), theme: 'cartes', mots: mot('Charge'), texte: t`Le poids d’une carte confiée à un Porteur : sa puissance (force, effet, deux places, Fréquences) divisée par ${CHARGE.diviseur} (1 au moins). Un Porteur porte ${CHARGE.base} de Charge au niveau 1, et ${CHARGE.parNiveau} de plus à chaque niveau.` },
  porteur: { nom: t('Porteur'), theme: 'cartes', mots: mot('Porteurs?'), texte: t('Un des personnages qui descendent pour toi. Chacun a une lignée et porte des cartes de sa lignée : ensemble, les cartes de ton escouade forment ton deck.') },
  escouade: { nom: t('Escouade'), theme: 'cartes', mots: mot('escouade'), texte: t('Les trois Porteurs qui descendent ensemble. On ne la change qu’au district, jamais pendant une descente.') },
  augmentes: { nom: t('Augmentés'), theme: 'cartes', mots: mot('Augmentée?s?'), texte: t('La lignée qui frappe : de grosses attaques. Une carte Augmentée qui termine une suite de 3 ou plus frappe encore plus fort (Finisseur). Ils battent les Résonants.') },
  genes: { nom: t('Génés'), theme: 'cartes', mots: mot('Génée?s?'), texte: t('La lignée qui tient : boucliers et soins. Ils battent les Augmentés.') },
  resonants: { nom: t('Résonants'), theme: 'cartes', mots: mot('Résonante?s?'), texte: t('La lignée qui orchestre : Fréquences, suites, Échos et affaiblissement de l’ennemi. Ils battent les Génés.') },
  chaine: { nom: t('Chaîne'), theme: 'combat', mots: mot('chaîne'), texte: t`Les cartes que tu poses ce tour-ci, dans l’ordre où elles agiront. Elle a ${REGLES.capaciteBase} places ; le Flux ou l’Élan en ajoutent, jusqu’à ${REGLES.capaciteMax}.` },
  defausse: { nom: t('Défausse'), theme: 'combat', mots: mot('défausse'), texte: t('Les cartes déjà jouées ou rejetées depuis le dernier mélange. Quand la pioche est vide, la défausse est mélangée et devient la nouvelle pioche.') },
  pioche: { nom: t('Pioche'), theme: 'combat', mots: mot('pioche'), texte: t('Les cartes qui restent à piocher avant le prochain mélange. Tu sais lesquelles, pas dans quel ordre elles viendront.') },
  eclat: { nom: t('Coup d’éclat'), theme: 'combat', mots: /Coups? d’éclat/, texte: t`Quand le Flux est plein (${REGLES.fluxMax}), on peut le dépenser pour le Coup d’éclat de sa lignée : Débridage (Augmentés), Sursaut (Génés) ou Ombre agissante (Résonants).` },
  gardien: { nom: t('Gardien'), theme: 'district', mots: mot('gardiens?'), texte: t('L’ennemi le plus fort d’une Strate : il garde l’accès à l’étage suivant. Le vaincre permet de creuser plus bas.') },
  strate: { nom: t('Strate'), theme: 'district', mots: mot('Strates?'), texte: t('Un étage creusé sous la ville, exploré salle par salle. Plus on descend, plus c’est ancien, dangereux et précieux.') },
  creuseurs: { nom: t('Creuseurs'), theme: 'district', mots: mot('creuseurs?'), texte: t('Les ouvriers qui creusent l’étage suivant. Pour ouvrir une nouvelle Strate, il faut avoir vaincu son gardien, et disposer d’assez de creuseurs et du bon niveau de Tour du Noyau.') },
  usure: { nom: t('Usure'), theme: 'district', mots: mot('Usure'), texte: t('Les PV perdus en bas restent perdus au retour au district. La Clinique soigne l’Usure pendant que le Porteur se repose.') },
  composants: { nom: t('Minerai'), theme: 'district', mots: mot('minerai'), texte: t('La pierre bleue rapportée en jouant (descentes, missions, marées, pillages), encore prise dans sa gangue. Le Générateur la taille en cristaux, même quand tu ne joues pas ; rien ne se perd.') },
  eclats: { nom: t('Éclats'), theme: 'district', mots: mot('Éclats'), texte: t('Des fragments de cristal chargés d’empreintes, rares : gardiens, caches profondes, Butin de la semaine. Ils servent aux cartes rares de la Forge et du Comptoir, et aux grands chantiers.') },
  energie: { nom: t('Cristaux'), theme: 'district', mots: mot('cristaux', 'i'), texte: t('La monnaie du district : la pierre bleue taillée par le Générateur. Elle paie tout : bâtiments, niveaux des cartes, Forge, Comptoir, entraînement, soins. Les récompenses (colis, Butin, objectifs, gardiens) arrivent déjà en cristaux.') },
  // Explorer ou fouiller (31 octobre 2026, explorer.ts)
  vestige: { nom: t('Vestige'), theme: 'ennemi', mots: mot('Vestiges?'), texte: t('Un objet d’autrefois caché dans une Strate, 5 par Strate. On ne les trouve qu’en explorant (jamais en fouille), marqués d’un losange turquoise sur le plan. Les cinq réunis, la Strate est complète : une carte au choix, et ses fouilles voient tout le plan avec un filon plus riche.') },
  rodeur: { nom: t('Rôdeur'), theme: 'ennemi', mots: mot('Rôdeurs?'), texte: t('Une créature unique par zone, croisée en explorant une Strate déjà vaincue. Elle s’enfuit au bout de 4 tours, et garde ses blessures d’une descente à l’autre. Abattue, elle laisse un trophée : une carte au choix.') },
  etoiles: { nom: t('Étoiles de Strate'), theme: 'ennemi', mots: mot('étoiles?', 'i'), texte: t('Trois par Strate, gagnées en explorant jusqu’au gardien : le vaincre, le vaincre sans qu’aucun Porteur ne tombe, le vaincre sans campement. Chaque étoile donne des Éclats, et toutes les 5 étoiles, une carte au choix.') },
  eveille: { nom: t('Gardien éveillé'), theme: 'ennemi', mots: mot('Gardien éveillé', 'i'), texte: t('Le gardien d’une Strate déjà vaincue, quand on y retourne explorer : un peu plus fort (+10 %), mais il laisse de meilleures cartes et un Éclat de plus.') },
  marque: { nom: t('Marque'), theme: 'marque', mots: mot('Marques?'), texte: t('L’effet propre à un Porteur, gagné par ses exploits. Chaque Porteur a la sienne.') },
};
// En anglais, les mêmes termes se reconnaissent à leurs mots anglais (9 novembre 2026) : le journal et le texte
// des cartes sont traduits, les motifs aussi. Un terme absent ici garde son motif français (il ne trouvera rien).
const MOTIFS_EN: Record<string, Pick<Terme, 'motif' | 'mots'>> = {
  resonance: { motif: /Resonance/, mots: mot('Resonances?') },
  echo: { motif: /Echo(?!-)/, mots: mot('Echoe?s?') },
  flux: { motif: /Flux/, mots: mot('Flux') },
  bouclier: { motif: /squad shield|protected/ },
  absorbe: { motif: /[Aa]bsorbed/ },
  lignee: { motif: /[Ll]ineage/ },
  felure: { motif: /Flaw/ },
  fissure: { motif: /Fissure/, mots: mot('fissured|Fissure') },
  desarme: { motif: /Unsettled/ },
  elan: { motif: /Momentum/ },
  rempart: { motif: /Rampart/ },
  quai: { motif: /Dock arm/ },
  dissonance: { motif: /[Ss]crambled/, mots: mot('Dissonances?') },
  siphon: { motif: /Siphon/ },
  epines: { motif: /Thorns/ },
  concentration: { motif: /focuses|Focus/ },
  furie: { motif: /Fury/ },
  regeneration: { motif: /regenerates/ },
  vengeur: { motif: /avenges/ },
  aspire: { motif: /drains/ },
  eboulis: { motif: /Rockfall|stones/ },
  aTerre: { motif: /is down|Bearer down| down\)/ },
  seconde: { motif: /Second chance/ },
  nuit: { motif: /White Night/ },
  chitine: { motif: /Moltborn/ },
  debridage: { motif: /Unleashed/ },
  ombre: { motif: /Active Shadow|the shadow/ },
  sursaut: { motif: /Rally/ },
  surcharge: { motif: /Overcharge/ },
  decharge: { motif: /Discharge/ },
  riposte: { motif: /Riposte/ },
  crescendo: { motif: /Crescendo/ },
  unisson: { motif: /Unison/ },
  curee: { motif: /Pounce/ },
  faille: { motif: /Rift/ },
  rafale: { motif: /Flurry/ },
  debord: { motif: /Overflow/ },
  rapt: { motif: /Seize/ },
  rappel: { motif: /Recall/ },
  surtension: { motif: /Overvolt/ },
  empreinte: { motif: /Imprint/ },
  releve: { motif: /Second Wind/ },
  blinde: { motif: /Armored/ },
  percant: { motif: /Piercing|pierced/ },
  evanescent: { motif: /Evanescent/ },
  eternise: { motif: /Drawn-out/ },
  pleins: { motif: /HP already full/ },
  nouvelleMain: { motif: /new hand/ },
  frequence: { mots: /Frequenc(?:y|ies)/ },
  metal: { mots: mot('metal') },
  doublon: { mots: /duplicates?/ },
  charge: { mots: mot('Load') },
  porteur: { mots: mot('Bearers?') },
  escouade: { mots: mot('squad') },
  augmentes: { mots: mot('Augmented') },
  genes: { mots: mot('Spliced') },
  resonants: { mots: mot('Resonants?') },
  chaine: { mots: mot('chain') },
  defausse: { mots: mot('discard') },
  pioche: { mots: mot('draw pile') },
  eclat: { mots: /Masterstrokes?/ },
  gardien: { mots: mot('guardians?') },
  strate: { mots: mot('Strat(?:um|a)') },
  creuseurs: { mots: mot('diggers?') },
  usure: { mots: mot('Strain') },
  composants: { mots: mot('ore') },
  eclats: { mots: mot('Shards') },
  energie: { mots: mot('crystals', 'i') },
  vestige: { mots: mot('Relics?') },
  rodeur: { mots: mot('Prowlers?') },
  etoiles: { mots: mot('stars?', 'i') },
  eveille: { mots: mot('Awakened guardian', 'i') },
  marque: { mots: mot('Marks?') },
};
if (langue() === 'en') {
  for (const [id, m] of Object.entries(MOTIFS_EN)) {
    const terme = LEXIQUE[id];
    if (!terme) continue;
    if (terme.motif) terme.motif = m.motif ?? terme.motif;
    if (terme.mots) terme.mots = m.mots ?? terme.mots;
  }
}

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
