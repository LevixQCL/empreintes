// Explorer ou fouiller (31 octobre 2026, Bryan : « la fonction explorer ne sert vraiment à rien pour l'instant puisque fouiller
// est plus rapide et plus rentable »). Fouiller sert à récolter ; Explorer sert à percer la Strate (docs/strates-explorer.md) :
// - les Vestiges : 5 par Strate, posés sur la carte des seules expéditions ; les 5 réunis, la Strate est « relevée » ;
// - les trois étoiles de chaque Strate (gardien, personne à terre, aucun campement), et leurs paliers ;
// - le gardien éveillé d'une Strate déjà vaincue ;
// - le Rôdeur de chaque zone : il se bat quelques tours puis s'enfuit, et garde ses blessures d'une descente à l'autre.
// Ce fichier ne contient que les textes et les réglages, sans DOM.

import type { Rarete } from './types';
import { t } from './i18n';

// ---------- Les Vestiges ----------

export interface VestigeDef { id: string; strate: number; nom: string; texte: string }
export interface ReleveDef { strate: number; titre: string; fin: string }

const V = (strate: number, k: number, nom: string, texte: string): VestigeDef => ({ id: `v${strate}-${k}`, strate, nom, texte });

export const VESTIGES: VestigeDef[] = [
  // −1 : les chantiers de 2066, les pompes, le registre des fouilleurs
  V(1, 1, t('Un casque de chantier'), t('Un casque jaune de 2066, fendu sur le côté. À l’intérieur, au feutre : « Si tu le trouves, rapporte-le au quai 4. »')),
  V(1, 2, t('Une clé de pompe'), t('Une clé en croix, polie par les mains. Elle ouvre encore la vanne d’une pompe noyée. La pompe repart une seconde, puis tousse.')),
  V(1, 3, t('Un ticket de cantine'), t('Un ticket de la cantine du chantier : « Soupe, pain, 14 octobre 2066 ». Jamais utilisé.')),
  V(1, 4, t('Une craie bleue'), t('Un bout de craie bleue. Sur le mur d’à côté, des flèches tracées avec, toutes vers le haut.')),
  V(1, 5, t('Une photo plastifiée'), t('Une équipe de six, devant la Tour du Noyau encore en chantier. Quelqu’un a entouré un visage au stylo.')),
  // −2 : les pilleurs, les cristaux, les murs de 2066
  V(2, 1, t('Une lampe de pilleur'), t('Une lampe frontale bricolée, la pile scotchée sur le côté. Elle marche encore, faiblement.')),
  V(2, 2, t('Un carnet de comptes'), t('Des colonnes de chiffres : cristaux pris, cristaux vendus. La dernière page dit seulement : « Celles-là, non. »')),
  V(2, 3, t('Une truelle'), t('Une truelle couverte de mortier sec, abandonnée au pied d’un mur de 2066. Le mur n’a jamais été fini.')),
  V(2, 4, t('Un cristal fêlé'), t('Un petit cristal fendu en deux. Les deux moitiés vibrent encore, chacune de leur côté.')),
  V(2, 5, t('Une gamelle gravée'), t('Une gamelle en fer, gravée « B. » au couteau. Dedans, des cailloux ronds, rangés par taille.')),
  // −3 : le noir complet, les patrouilles des Brigades
  V(3, 1, t('Une boussole morte'), t('Une boussole des Brigades. L’aiguille tourne sans s’arrêter, lentement, comme si le nord était partout.')),
  V(3, 2, t('Un sifflet'), t('Un sifflet de patrouille, accroché à une corde. Quand on souffle dedans, rien ne répond dans le noir.')),
  V(3, 3, t('Une ration entamée'), t('Une ration militaire ouverte, à moitié mangée. Le reste a été soigneusement remballé, pour plus tard.')),
  V(3, 4, t('Un fil d’Ariane'), t('Une bobine de fil rouge, presque vide. Le fil part dans le noir et s’arrête net, coupé proprement.')),
  V(3, 5, t('Une lettre pliée'), t('Une lettre d’un soldat à sa sœur, jamais envoyée : « Ici, on n’a pas peur du noir. On a peur de ce qui s’y habitue. »')),
  // −4 : les portes rondes, le veilleur solitaire
  V(4, 1, t('Un gond de cristal'), t('Un gond taillé dans le cristal, lisse comme du verre. Aucune rouille, après tout ce temps.')),
  V(4, 2, t('Une tasse'), t('Une tasse en grès, posée sur une marche. Le fond est encore taché. Quelqu’un prenait le temps de boire, ici.')),
  V(4, 3, t('Un calendrier gratté'), t('Des bâtons gravés dans la pierre, par groupes de sept. Il y en a des milliers.')),
  V(4, 4, t('Une couverture tissée'), t('Une couverture tissée main, aux motifs de vagues. Personne ne tisse plus comme ça, là-haut.')),
  V(4, 5, t('Une lampe éteinte'), t('Une lampe à huile minuscule, posée au pied d’une porte ronde. Comme si on en avait fabriqué une pour un enfant.')),
  // −5 : les Berceaux, la cire blanche de la Maison Orsève
  V(5, 1, t('Un bâton de cire blanche'), t('Un bâton de cire blanche, à moitié fondu. La cire des sceaux de la Maison Orsève.')),
  V(5, 2, t('Un gant de préleveur'), t('Un gant fin, doublé de soie. Taille enfant. Les préleveurs des Hauts descendent avec leurs apprentis.')),
  V(5, 3, t('Une étiquette'), t('Une étiquette de caisse : « Berceau 12, lot 3. Ne pas ouvrir avant l’arrivée. » L’arrivée où ?')),
  V(5, 4, t('Un berceau vide'), t('Une niche ronde, tapissée de mousse séchée. La forme d’un cristal y est encore imprimée.')),
  V(5, 5, t('Un sceau brisé'), t('Un sceau de cire brisé, et sous lui un autre, plus ancien. Et sous lui encore un autre. On rescelle ici depuis toujours.')),
  // −6 : les pleurs derrière le mur, la nuit du 14
  V(6, 1, t('Un bouchon d’oreille'), t('Un bouchon d’oreille en mousse, de ceux qu’on distribuait au chantier. Il y en a des dizaines, par terre.')),
  V(6, 2, t('Une main sur le mur'), t('L’empreinte d’une main dans le béton frais de 2066, côté chantier. De l’autre côté, à la même hauteur, une autre main.')),
  V(6, 3, t('Une radio de chantier'), t('Une radio de chantier, bloquée sur une fréquence. Quand on l’allume, on entend respirer.')),
  V(6, 4, t('Un plan du niveau 7'), t('Un plan du niveau 7, annoté au crayon rouge : « Ici. Et ici. Et là. Couler partout. »')),
  V(6, 5, t('Une berceuse'), t('Une feuille de papier, une berceuse écrite à la main. En marge : « Pour qu’ils arrêtent de pleurer. Ça marche. »')),
  // −7 : ceux d'avant et leurs lignes d'eau (rien sur l'Écluse ni les Berceaux : la révélation est à −10)
  V(7, 1, t('Une jauge de crue'), t('Une règle de bronze graduée, scellée au mur. Ses chiffres ne ressemblent à rien de connu, mais les traits montent.')),
  V(7, 2, t('Une rame de verre'), t('Une rame taillée dans un verre épais et léger. Ceux d’avant ont ramé, quand l’eau est montée.')),
  V(7, 3, t('Un cœur de Berceau'), t('Un cristal énorme, éteint, pris dans une monture d’or. Il a tenu quelque chose, autrefois. Quelque chose de lourd.')),
  V(7, 4, t('Une liste de noms'), t('Une plaque couverte de noms, ligne après ligne. Chacun a été rayé, un par un, avec soin.')),
  V(7, 5, t('Un jouet d’enfant'), t('Un petit bateau de bois, la voile en tissu. Ceux d’avant avaient des enfants, et des enfants qui jouaient à la mer.')),
  // −8 : la Ruche, les tables, les Veilleurs
  V(8, 1, t('Un éclat de table'), t('Un morceau de table de pierre, gravé de lignes fines. Les mêmes lignes que sur la paume d’une main.')),
  V(8, 2, t('Une lanterne de Veilleur'), t('Une lanterne des Veilleurs de Tobin, la mèche encore longue. Quelqu’un l’a éteinte pour dormir.')),
  V(8, 3, t('Un rêve écrit'), t('Une page couverte d’une écriture serrée : le récit d’un rêve, recopié trois fois, de trois mains différentes.')),
  V(8, 4, t('Une alvéole'), t('Une alvéole de la Ruche, assez grande pour s’y allonger. La pierre y est tiède, comme un lit qu’on vient de quitter.')),
  V(8, 5, t('Un compteur'), t('Un boulier de pierre. Les billes sont poussées jusqu’à mille deux cents, puis plus rien.')),
  // −9 : les fils, la Tisseuse, les noms oubliés
  V(9, 1, t('Une navette'), t('Une navette de tisserand, en os poli. Un fil y est encore enroulé, et ce fil murmure un nom.')),
  V(9, 2, t('Un nœud'), t('Un nœud serré sur lui-même, gros comme un poing. Dedans, on devine des dizaines de noms entortillés.')),
  V(9, 3, t('Une épingle de brigadier'), t('L’épingle d’un brigadier du Serment, prise dans la trame d’un mur de fils. Il est passé par ici, avant −5.')),
  V(9, 4, t('Un dé à coudre'), t('Un dé à coudre de cristal, usé jusqu’à la transparence. La Tisseuse a cousu ici, longtemps.')),
  V(9, 5, t('Une bobine vide'), t('Une bobine dont le fil a été tiré jusqu’au bout. Sur le bois, une seule lettre, presque effacée.')),
  // −10 : le Fond, les portes fermées de l'intérieur
  V(10, 1, t('Un trousseau'), t('Un trousseau d’une centaine de clés, toutes différentes. Une seule manque : la plus usée, à en croire l’anneau.')),
  V(10, 2, t('Un tabouret'), t('Un tabouret de pierre, placé face à une porte. La pierre est creusée là où on s’asseyait, des siècles durant.')),
  V(10, 3, t('Une empreinte de doigt'), t('Une empreinte de doigt gravée dans le cristal, si nette qu’on pourrait y poser le sien. Elle est à peine plus petite.')),
  V(10, 4, t('Un registre de garde'), t('Un registre de pierre : une seule colonne, un seul nom, répété ligne après ligne. Tous les jours. Toujours la même main.')),
  V(10, 5, t('Une lampe allumée'), t('Une lampe qui brûle encore, au fond d’une niche. Personne ne l’a allumée pour vous : elle n’a jamais été éteinte.')),
];

/** L'histoire d'une Strate complète (ses 5 Vestiges) : son titre, et la ligne qui la conclut */
export const RELEVES: ReleveDef[] = [
  { strate: 1, titre: t('Le quai 4'), fin: t('Une équipe de six est descendue le 14 octobre 2066, entre la soupe et le pain. Quatre d’entre eux couleraient le mur, plus bas. Elle a marqué le chemin du retour à la craie bleue.') },
  { strate: 2, titre: t('Les cailloux de Brac'), fin: t('Brac comptait ses cristaux comme ses cailloux : un par un, rangés. Il a su lesquels il ne fallait pas vendre.') },
  { strate: 3, titre: t('Ce qui s’habitue'), fin: t('Les patrouilles de −3 n’ont pas eu peur du noir. Coincées sous l’éboulis, elles ont coupé leur propre fil pour que rien ne le suive, et elles ont attendu qu’on vienne.') },
  { strate: 4, titre: t('Le veilleur et l’enfant'), fin: t('Derrière les portes rondes, quelqu’un a compté les semaines, tissé, bu son thé. Et il n’était pas seul : il y avait une petite lampe.') },
  { strate: 5, titre: 'L’arrivée', fin: t('La Maison Orsève emporte les cristaux des Berceaux « avant l’arrivée ». Elle ne dit pas l’arrivée de qui, ni d’où.') },
  { strate: 6, titre: t('La berceuse du niveau 7'), fin: t('En 2066, on a coulé le mur sur des voix. Une ouvrière leur chantait une berceuse pour qu’elles se taisent. Elles se sont tues.') },
  { strate: 7, titre: t('Les enfants de ceux d’avant'), fin: t('Ceux d’avant avaient des enfants qui jouaient à la mer. Ils ont gravé leur ligne plus haut, et laissé les jouets en bas.') },
  { strate: 8, titre: t('Mille deux cents tables'), fin: t('Chaque table de la Ruche garde un rêve. Les Veilleurs les comptaient pour ne pas s’y perdre, jusqu’à ce qu’ils s’y perdent.') },
  { strate: 9, titre: t('La lettre sur la bobine'), fin: t('La Tisseuse a tissé jusqu’au dernier fil. Il ne reste de son nom qu’une lettre, sur le bois d’une bobine.') },
  { strate: 10, titre: t('Celui qui garde'), fin: t('Une seule personne veille au Fond depuis très longtemps. Elle n’a jamais éteint sa lampe. Elle attendait qu’on descende.') },
];

export const vestigeDef = (id: string) => VESTIGES.find((v) => v.id === id);
export const vestigesDe = (strate: number) => VESTIGES.filter((v) => v.strate === strate);
export const releveDef = (strate: number) => RELEVES.find((r) => r.strate === strate);

// ---------- Les Rôdeurs ----------

export interface RodeurDef {
  /** l'ennemi (donnees.ts) */
  id: string;
  /** la zone où il rôde (index dans ZONES) */
  zone: number;
  /** son nom dans une phrase (« qui a abattu la Sentinelle orpheline ») */
  dans: string;
  /** ce que montrent ses traces sur le plan */
  traces: string;
  /** ce que dit le récit quand il s'enfuit, et quand il tombe */
  fuite: string;
  chute: string;
  /** la carte du trophée */
  trophee: Rarete;
}

export const RODEURS: RodeurDef[] = [
  { id: 'maree-basse', zone: 0, dans: 'Marée-Basse', trophee: 'argent',
    traces: t('De longues traînées humides sur la roche, larges comme un couloir. Marée-Basse est passée par ici.'),
    fuite: t('Marée-Basse se laisse glisser dans une fissure noyée. Elle reviendra : les fouilleurs disent qu’elle revient toujours.'),
    chute: t('Marée-Basse s’affaisse dans l’eau tiède des pompes. Elle ne remontera plus jamais vers les piliers.') },
  { id: 'sentinelle-orpheline', zone: 1, dans: t('la Sentinelle orpheline'), trophee: 'argent',
    traces: t('Des éclats de verre posés en ligne, comme pour marquer une porte qui n’est plus là. La Sentinelle orpheline cherche toujours.'),
    fuite: t('La Sentinelle orpheline recule, se recompose en éclats, et disparaît vers une porte qu’elle seule voit.'),
    chute: t('La Sentinelle orpheline se fige, enfin. Ses éclats dessinent au sol le contour d’une porte. Elle l’a retrouvée.') },
  { id: 'liseur', zone: 2, dans: t('le Liseur'), trophee: 'or',
    traces: t('Des noms gravés à moitié effacés, tout du long du couloir. Le Liseur a lu ici à voix haute.'),
    fuite: t('Le Liseur se tait au milieu d’un nom, et s’efface dans la pierre. Plus loin, la lecture reprend.'),
    chute: t('Le Liseur prononce un dernier nom, le sien peut-être, puis se dissout. Les noms qu’il n’a pas lus restent gravés.') },
  { id: 'plongeur', zone: 3, dans: t('le Plongeur'), trophee: 'or',
    traces: t('Des empreintes de bottes lestées, qui montent. Toujours vers le haut. Le Plongeur cherche la surface.'),
    fuite: t('Le Plongeur se détourne, lourd et lent, et reprend sa marche vers le haut. Il ne vous cherchait pas : vous étiez sur son chemin.'),
    chute: t('Le scaphandre s’assoit contre la roche, le hublot tourné vers le haut. Il est vide. Il l’a toujours été.') },
];

export const rodeurDef = (id: string) => RODEURS.find((r) => r.id === id);
export const rodeurDeZone = (zone: number) => RODEURS.find((r) => r.zone === zone);

// ---------- Les étoiles ----------

export type EtoileId = 1 | 2 | 3;
export const ETOILES: Record<EtoileId, { nom: string; texte: string; eclats: number }> = {
  1: { nom: t('Le gardien'), texte: t('Vaincre le gardien.'), eclats: 1 },
  2: { nom: t('Personne à terre'), texte: t('Vaincre le gardien sans qu’aucun Porteur ne tombe pendant la descente.'), eclats: 2 },
  3: { nom: t('Sans repos'), texte: t('Vaincre le gardien sans entrer dans un campement.'), eclats: 2 },
};
/** Les paliers du total d'étoiles : une carte au choix, d'un métal de plus en plus rare */
export const PALIERS_ETOILES: { etoiles: number; metal: Rarete }[] = [
  // revue du game designer : tous les 5 (★1 versé d'office aux anciennes sauvegardes, un premier palier à 6 passait inaperçu)
  { etoiles: 5, metal: 'cuivre' }, { etoiles: 10, metal: 'cuivre' }, { etoiles: 15, metal: 'argent' },
  { etoiles: 20, metal: 'argent' }, { etoiles: 25, metal: 'or' }, { etoiles: 30, metal: 'or' },
];

// ---------- Les réglages ----------

export const EXPLORER = {
  /** Vestiges par carte d'expédition : jusqu'à −5, puis au-delà */
  vestiges: { haut: 2, bas: 3 },
  /** une Strate relevée : au filon d'une lignée, la première carte au moins en cuivre ; composants +25 % ; Éclats plus fréquents (FILON_ECLATS) */
  releve: { metal: 'cuivre' as Rarete, composants: 1.25 },
  /** le gardien éveillé d'une Strate déjà vaincue : force (×1,1 après revue, ×1,2 rendait ★2 trop dure), et Éclats en plus */
  eveille: { force: 1.1, eclats: 1 },
  /** le Rôdeur : chance d'en croiser un par descente, tours avant de fuir */
  rodeur: { chance: 0.5, tours: 4 },
};

/** Le butin du gardien éveillé : la première carte au moins en cuivre à −1 et −2, en argent de −3 à −8, en or à −9 et plus bas */
export const metalEveille = (strate: number): Rarete => (strate <= 2 ? 'cuivre' : strate <= 8 ? 'argent' : 'or');
/** La Strate dont le Rôdeur prend la force : la plus profonde de sa zone (sinon on irait le chasser là où c'est le plus facile) */
export const STRATE_RODEUR = [3, 6, 9, 10] as const;
