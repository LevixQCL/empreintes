// La campagne vécue (25 octobre 2026, Bryan : « le lore est vachement absent, on le lit juste dans la Chronique »).
// Les Chroniques racontent le passé du monde ; ici, c'est l'histoire du joueur, racontée là où il joue :
// - une scène à l'ouverture de chaque Strate (l'enjeu : pourquoi on descend) et une après son gardien (ce qu'on a trouvé) ;
// - les gardiens parlent en combat (à l'entrée et au passage de phase) : la Confluence fuit deux fois avant de tomber à −3,
//   le Gardien des registres recule jusqu'à −6, la Tisseuse jusqu'à −9, le Premier Porteur attend à −10 ;
// - les Porteurs de l'escouade parlent pendant la descente (à l'entrée de la Strate et devant le gardien) ;
// - des visages qui reviennent : la capitaine Hald (Brigades du Serment de Veyr), Tobin (Veilleurs de Sédime),
//   Brac (pilleur), Dame Isaure Orsève (les Hauts), et Ysé.
// Les trois décisions (nouvelle.ts) arrivent au bout de ce qu'on a vu ; les scènes suivantes en tiennent compte.
// Ce fichier ne contient que les textes et les conditions, sans DOM : l'écran affiche la scène que renvoie `sceneEnAttente`.

import { pisteFinale, type Piste } from './strates';
import { t } from './i18n';

/** Ce qu'une condition peut lire de la partie, sans dépendre de jeu.ts */
export interface ContexteCampagne {
  /** la Strate la plus profonde ouverte */
  strate: number;
  /** la Strate la plus profonde dont le gardien est vaincu */
  vaincue: number;
  actes: { chambre?: string; lecture?: string; fin?: string };
  presents: readonly string[];
  /** les souvenirs des choix faits aux Haltes (strates.ts) */
  drapeaux?: readonly string[];
  /** les choix faits aux Haltes (« strate-n » → rang du choix), pour la piste de l'enquête */
  choixHaltes?: Readonly<Record<string, number>>;
}

/** Ceux qui parlent et ne sont pas des Porteurs (les Porteurs et les gardiens ont déjà leur nom et leur portrait) */
export const PERSONNAGES: Record<string, { nom: string; role: string; couleur: string }> = {
  yse: { nom: t('Ysé'), role: t('Archiviste des Veilleurs'), couleur: 'var(--or)' },
  hald: { nom: t('Capitaine Hald'), role: t('Brigades du Serment de Veyr'), couleur: 'var(--reso)' },
  tobin: { nom: t('Tobin'), role: t('Fouilleur des Veilleurs'), couleur: 'var(--ivory)' },
  brac: { nom: t('Brac'), role: t('Pilleur de Strates'), couleur: 'var(--tech)' },
  isaure: { nom: t('Dame Isaure Orsève'), role: t('Maison Orsève, les Hauts'), couleur: 'var(--reso)' },
};

export interface Replique {
  /** un Porteur, un gardien (id d'ennemi) ou un personnage de PERSONNAGES */
  qui: string;
  texte: string;
  /** la réplique n'est dite que si la condition tient (une décision prise, un Porteur arrivé) */
  si?: (c: ContexteCampagne) => boolean;
  /** la réplique reprend un choix de Halte (son souvenir) : l'écran le marque « ton choix à −X » */
  souvenir?: string;
}

/** L'illustration d'une scène : le décor de la zone, le portrait d'un gardien, ou un tableau de l'intro */
export type ImageScene = { strate: number } | { ennemi: string } | { intro: string };

export interface Scene {
  id: string;
  acte: 1 | 2 | 3 | 4;
  /** petit titre au-dessus (« ACTE I · STRATE −2 ») */
  sur: string;
  titre: string;
  image: ImageScene;
  /** le récit, avant les répliques */
  recit: string;
  repliques: Replique[];
  /** la scène se joue dès que la condition tient (une seule fois par partie) */
  quand: (c: ContexteCampagne) => boolean;
}

const ACTES: Record<1 | 2 | 3 | 4, string> = { 1: t('Acte I · La chambre'), 2: t('Acte II · Les salles closes'), 3: t('Acte III · Ceux d’avant'), 4: t('Épilogue') };
export const nomActe = (a: 1 | 2 | 3 | 4) => ACTES[a];
const acteDe = (strate: number): 1 | 2 | 3 => (strate <= 3 ? 1 : strate <= 6 ? 2 : 3);
const ROMAIN = { 1: 'I', 2: 'II', 3: 'III' } as const;

const present = (id: string) => (c: ContexteCampagne) => c.presents.includes(id);
const absent = (id: string) => (c: ContexteCampagne) => !c.presents.includes(id);
const garde = (g: string) => (c: ContexteCampagne) => c.actes.chambre === g;
const lecture = (l: string) => (c: ContexteCampagne) => c.actes.lecture === l;
const fin = (f: string) => (c: ContexteCampagne) => c.actes.fin === f;
/** un choix fait à une Halte (3 novembre 2026 : chaque souvenir revient plus tard) */
const souvenir = (f: string) => (c: ContexteCampagne) => !!c.drapeaux?.includes(f);
/** la condition et la marque d'un souvenir (7 novembre 2026 : on voit qu'un choix revient) */
const souv = (f: string) => ({ si: souvenir(f), souvenir: f });
/** la piste la plus suivie de l'enquête, sur toutes les Haltes (strates.ts) */
const lentille = (p: Piste) => (c: ContexteCampagne) => pisteFinale(c.choixHaltes) === p;

/** une scène d'ouverture de Strate (l'enjeu) ; les Strates −4, −7 attendent la décision de l'acte précédent */
const entree = (strate: number, titre: string, recit: string, repliques: Replique[], apres?: (c: ContexteCampagne) => boolean): Scene => ({
  id: `entree-${strate}`, acte: acteDe(strate), sur: t`${ROMAIN[acteDe(strate)]} · STRATE −${strate}`, titre, image: { strate },
  recit, repliques, quand: (c) => c.strate >= strate && (!apres || apres(c)),
});
/** une scène après le gardien d'une Strate (ce qu'on a trouvé) */
const apresGardien = (strate: number, boss: string, titre: string, recit: string, repliques: Replique[]): Scene => ({
  id: `gardien-${strate}`, acte: acteDe(strate), sur: t`${ROMAIN[acteDe(strate)]} · GARDIEN DE LA STRATE −${strate}`, titre, image: { ennemi: boss },
  recit, repliques, quand: (c) => c.vaincue >= strate,
});

// Dans l'ordre où elles se jouent : une scène n'est proposée que si toutes celles d'avant sont vues (sceneEnAttente).
export const SCENES: Scene[] = [
  // ---------- Acte I · La chambre (Les Seuils, la Confluence) ----------
  apresGardien(1, 'confluence', t('Elle n’est pas morte'),
    t('La Confluence se défait sous vos coups. Ses empreintes ne s’éteignent pas : elles coulent dans les fissures du sol, comme de l’eau qui trouve sa pente.'), [
      { qui: 'vela', texte: t('Elle n’est pas morte. Elle est descendue. Elle cherche quelque chose, plus bas.') },
      { qui: 'doran', texte: t('Par là, il n’y a que les couloirs qu’on a murés en 2066. Enfin, il n’y avait.') },
      { qui: 'ilka', texte: t('Un monstre fait de morts mélangés, qui connaît nos tunnels mieux que nous. Parfait.') },
      { qui: 'ilka', texte: t('Et mes jambes se sont bloquées. Une seconde, quand elle s’est levée. Ça ne leur était jamais arrivé. Ne me regardez pas comme ça, c’est rien.') },
      { qui: 'doran', texte: t('Et regardez par terre : des traces de bottes, toutes fraîches. Quelqu’un est passé avant nous.') },
      { qui: 'ilka', texte: t('Au marché, ils disent que tu descends chercher l’Écluse : le truc de ceux d’avant pour retenir la mer. Dis-moi que tu y crois un peu.') },
      { qui: 'doran', texte: t('Les pompes ont tourné quatorze heures cette nuit. Écluse ou pas, la mer ne nous attendra pas.') },
      { qui: 'doran', texte: t('Si ta mesure de la marche arrive chez les Veilleurs, les Fondations finiront par l’apprendre. Elles couperont des pompes pour inspecter. Les nôtres d’abord. Celles des Hauts, jamais.'), ...souv('mesure-marche') },
    ]),
  entree(2, t('Les couloirs murés'),
    t('Au retour, la chambre aux empreintes était à moitié vide. Ysé t’attend au bord, appuyée sur sa canne : elle n’ira pas plus loin. Des traces de bottes s’enfoncent vers la Strate −2, les Abris murés. Tes creuseurs viennent d’en dégager l’accès.'), [
      { qui: 'yse', texte: t('Des pilleurs. Ils ont pris les cristaux de la chambre pendant que Vertiga dormait. S’ils partent au marché noir, on ne les reverra jamais.') },
      { qui: 'doran', texte: t('Ils sont passés par l’ancien puits d’aération. Je connais le chemin. Mon père le connaissait mieux.') },
      { qui: 'vela', texte: t('Les cristaux qu’ils emportent ont peur. Je les entends d’ici. Et la Confluence les entend aussi.') },
      { qui: 'ilka', texte: t('Alors on court. Pour une fois, c’est moi qui donne le rythme.') },
    ]),
  apresGardien(2, 'confluence', t('Brac'),
    t('Au fond de la Strate, des sacs éventrés et des cristaux éteints. La Confluence les a trouvés avant vous, et elle a grossi. Dans un recoin, un pilleur tremble.'), [
      { qui: 'brac', texte: t('Je m’appelle Brac. Je ne les ai pas volées, directeur. Elles me l’ont demandé. Toute la nuit, elles m’ont demandé de les emmener plus bas. Jusqu’où, je n’en sais rien. Plus bas que tout ce que j’ai fouillé.') },
      { qui: 'vela', texte: t('Il dit vrai. Les empreintes de la chambre veulent descendre. Je ne sais pas pourquoi. Je sais qu’elles ont peur de rester en haut.') },
      { qui: 'vela', texte: t('Le petit cristal qu’on a laissé rouler dans l’abri de 2060. Il est là, avec les autres. Il est arrivé avant nous.'), ...souv('cristal-libre') },
      { qui: 'hald', texte: t('Capitaine Hald, Brigades du Serment de Veyr. Au nom de la Maison Orsève, cette fouille est suspendue. Ce qui brille ici relève de la garde des Hauts.') },
      { qui: 'ilka', texte: t('On vient de se battre pour ça, capitaine. Vous, vous venez d’arriver.') },
      { qui: 'hald', texte: t('Votre directeur décidera. En attendant, mes Brigades suivent la Confluence. Avec ou sans vous.') },
      { qui: 'hald', texte: t('Les Hauts ont leurs raisons d’être pressés. Depuis la nuit où vous avez ouvert la chambre, deux des leurs ne savent plus leur propre nom.') },
      { qui: 'ilka', texte: t('Encore. Quand Véla a touché les cristaux de Brac, mes jambes se sont arrêtées net. Pas une panne : elles ont attendu. Comme on attend la fin d’une phrase.') },
    ]),
  entree(3, t('Dans le noir'),
    t('À la Strate −3, loin du Puits Zéro et de ses rampes de visite, aucune lampe humaine ne s’est jamais arrêtée longtemps. Tous les puits de Vertiga y débouchent. Les Brigades de la capitaine Hald y sont entrées hier, par le leur ; aucune patrouille n’est remontée.'), [
      { qui: 'nuit', texte: t('Nuit, éclaireuse des Veilleurs. Le noir n’est pas vide. Les soldats de Hald sont vivants : je les entends respirer, loin, en bas.'), si: present('nuit') },
      { qui: 'vela', texte: t('Les soldats sont vivants. Je les sens, loin en bas, serrés les uns contre les autres.'), si: absent('nuit') },
      { qui: 'doran', texte: t('La Confluence s’est arrêtée quelque part en dessous. Elle a fini de chercher.') },
      { qui: 'vela', texte: t('Elle a trouvé. C’est pire.') },
      { qui: 'ilka', texte: t('Un monstre qui a trouvé ce qu’il cherchait. Moi, je veux savoir quoi.') },
      { qui: 'ilka', texte: t('Dans le noir, il y a une petite lumière qui clignote sur ma cheville. Pas au hasard. Elle compte.') },
    ]),
  apresGardien(3, 'confluence', t('Une seule voix'),
    t('La Confluence s’effondre pour de bon. De son cœur roule un cristal minuscule, net comme une goutte d’eau. Une seule voix y parle, très calme.'), [
      { qui: 'vela', texte: t('Elle ne répète plus qu’un mot : « Compte. » Je crois que c’était la première voix, celle autour de qui les autres se sont collées. Compter quoi, je n’en sais rien.') },
      { qui: 'ilka', texte: t('Ma cheville a arrêté de clignoter quand elle a dit ce mot. D’un coup. Comme si elle avait entendu.') },
      { qui: 'doran', texte: t('Les patrouilles de la capitaine sont sauves. Elles étaient coincées sous un éboulement. Elles nous doivent la vie.') },
      { qui: 'doran', texte: t('Tu as laissé la lanterne à son clou, là-haut. Les fouilleurs l’apprendront. Chez nous, ça vaut plus qu’un Éclat.'), ...souv('clou-respecte') },
      { qui: 'hald', texte: t('Mes patrouilles ont trouvé une flèche à la craie, la bonne, avec une date. C’était vous. Je ne l’oublierai pas, directeur.'), ...souv('craie-hald') },
      { qui: 'hald', texte: t('Quelqu’un a dégagé le haut de notre éboulis. On a entendu qu’on venait. C’est ce qui a tenu mes hommes.'), si: (c) => !!c.drapeaux?.includes('eboulis') && !c.drapeaux.includes('craie-hald'), souvenir: 'eboulis' },
      { qui: 'hald', texte: t('La Maison Orsève vous remercie, directeur. Elle vous demande à présent de lui confier la chambre.') },
      { qui: 'tobin', texte: t('Tobin, des Veilleurs de Sédime. Directeur, ne la donnez à personne avant qu’on ait compris ce qu’elle contient. Je vous en prie.') },
      { qui: 'ilka', texte: t('Et le quartier attend que tu dises qu’elle est à nous. À toi de trancher, l’Élu.') },
    ]),

  // ---------- Acte II · Les salles closes (le Gardien des registres) ----------
  entree(4, t('Fermées de l’intérieur'),
    t('Sous la Galerie aux lueurs commencent les salles closes : des portes rondes, verrouillées de l’intérieur. Plus bas, à la Strate −6, l’accès du niveau 7, muré en 2066 après ce que l’ordre de service appelle « l’incident du 14 ».'), [
      { qui: 'doran', texte: t('L’ordre de service de la chambre porte le tampon de l’équipe de mon père. Ils ont muré quelque chose, plus bas, en 2066. Je veux savoir quoi.') },
      { qui: 'hald', texte: t('Mes Brigades ouvrent la marche, comme convenu. Vous suivez, et vous ne touchez à rien.'), si: garde('orseve') },
      { qui: 'hald', texte: t('Le district a choisi de garder la chambre. Les salles closes, ce sera nous. Ne vous trouvez pas sur notre chemin.'), si: garde('district') },
      { qui: 'tobin', texte: t('Les Veilleurs descendent avec vous. On note tout. Même ce qui nous fait peur. Surtout ça.'), si: garde('commission') },
      { qui: 'kessa', texte: t('Kessa, plongeuse aux pompes. Mes parents ont mué pour ces couloirs-là. Moi, je suis née comme ça. Je n’en ai jamais vu le bout. Ce sera le bon jour.'), si: present('kessa') },
      { qui: 'sasha', texte: t('J’ai regardé tes jambes cette nuit, Ilka. Il y a le verrou de ta compagnie, ça, je connais. Et il y a autre chose : une ligne que personne n’a écrite chez nous, signée d’une date. 2029. Elle ne coupe rien. Elle écoute.') },
      { qui: 'vela', texte: t('Derrière ces portes, quelqu’un a rangé les cristaux avec soin. Comme on range une chambre avant de partir pour de bon.') },
    ], (c) => !!c.actes.chambre),
  apresGardien(4, 'gardien-registres', 'L’appel',
    t('Le Gardien des registres recule derrière une porte ronde et la referme sur lui. Avant de disparaître, il a lu une liste de noms, lentement, d’une voix de pierre.'), [
      { qui: 'doran', texte: t('Trois noms. Ivens, Daro, et le dernier, celui de mon père. Les trois qu’on n’a jamais barrés au mur des fouilleurs.') },
      { qui: 'vela', texte: t('Il ne nous menaçait pas. Il faisait l’appel. Comme s’il attendait que ceux de la liste reviennent.') },
      { qui: 'ilka', texte: t('Mon écran de diagnostic vient de s’allumer tout seul. Une phrase, pas un code : « Si quelqu’un lit ceci, combien de temps a passé ? » Sasha, dis-moi que c’est une blague.') },
      { qui: 'sasha', texte: t('Ce n’est pas moi. Cette phrase n’est dans aucun manuel.') },
      { qui: 'ilka', texte: t('Des gens qui ont muré une porte il y a cinquante-cinq ans, et un gardien qui les attend encore. Je déteste cet étage.') },
      { qui: 'doran', texte: t('Il m’a regardé en lisant le nom de mon père. Il sait que j’ai promis. Il attend de voir si je tiens parole.'), ...souv('promesse-cristal') },
    ]),
  entree(5, t('Les Berceaux vides'),
    t('Plus bas, des niches de cristal en treillis, toutes ouvertes. Quelqu’un est passé avant vous, avec des outils propres et des sceaux de cire blanche.'), [
      { qui: 'aurel', texte: t('Aurel. Orsève, si vous tenez au nom entier. Ces sceaux sont ceux de ma famille. La Maison vide les Berceaux depuis des années. Je l’ai vu enfant, sans comprendre ce que je voyais.'), si: present('aurel') },
      { qui: 'doran', texte: t('De la cire blanche. Les Hauts. Ils sont passés avant nous, et ils n’ont rien laissé.'), si: absent('aurel') },
      { qui: 'hald', texte: t('Ce que la Maison emporte ne vous regarde pas, directeur. Vous avez signé.'), si: garde('orseve') },
      { qui: 'hald', texte: t('Vous ne resterez pas dans ces salles plus longtemps que nous. Mes ordres sont de tout sceller.'), si: garde('district') },
      { qui: 'tobin', texte: t('J’ai compté les niches vides : trente-deux. Pas une seule de ces empreintes n’est arrivée chez les Veilleurs.'), si: garde('commission') },
      { qui: 'tobin', texte: t('La page du registre que vous avez arrachée, on l’a lue toute la nuit. Des gestes, ligne après ligne. Les noms n’arrivent qu’à la fin, en 2066. Le Gardien ne garde personne : il garde ce qu’on savait faire.'), ...souv('page-arrachee') },
      { qui: 'vela', texte: t('Celles qui restent se sont serrées les unes contre les autres. Elles ont froid.') },
      { qui: 'doran', texte: t('Le Gardien est en dessous. Il garde ce qu’il reste. Je commence à le comprendre.') },
    ]),
  apresGardien(5, 'gardien-registres', 'L’inventaire',
    t('Cette fois, le Gardien a appelé un brigadier à la barre. Le soldat s’est battu en récitant un serment qui n’était pas le sien. Dans la poche de son uniforme, un inventaire.'), [
      { qui: 'ilka', texte: t('Un inventaire de Berceaux, signé en entier, cette fois : « I. Orsève ». Plus besoin de deviner.') },
      { qui: 'aurel', texte: t('Dame Isaure. Ma tante. C’est elle qui tient le Registre des Vierges. Elle ne descend jamais : elle envoie les autres.'), si: present('aurel') },
      { qui: 'aurel', texte: t('Mon cousin Théodric ne sait plus son nom depuis trois semaines. Il signe celui du fondateur. Là-haut, on dit qu’il est fatigué.') },
      { qui: 'ilka', texte: t('Quand Aurel parle, mon écran affiche un chiffre : 2. Quand il se tait, il revient à 1. Je ne sais pas ce que ça compte. Mais ça compte sur nous.') },
      { qui: 'vela', texte: t('Isaure Orsève. Une grande famille des Hauts. Elle ne descend jamais : elle envoie les autres.'), si: absent('aurel') },
      { qui: 'vela', texte: t('Le brigadier ne savait plus pourquoi il se battait. Le Gardien lui avait prêté une voix. Il y en a beaucoup trop, ici, des voix.') },
      { qui: 'aurel', texte: t('J’ai vu le premier relevé du fondateur, dans la niche 5-1. Il ne ressemble pas à ma tante. Il ne me ressemble pas non plus.'), si: (c) => c.presents.includes('aurel') && !!c.drapeaux?.includes('niche-fondateur'), souvenir: 'niche-fondateur' },
      { qui: 'doran', texte: t('Plus qu’un étage avant le niveau 7. Celui que mon père a fermé.') },
    ]),
  entree(6, t('Le niveau 7'),
    t('La Strate −6 s’ouvre sur un mur de béton coulé à la hâte, couvert de tampons de 2066. Derrière, quelqu’un pleure. Il n’y a personne.'), [
      { qui: 'liane', texte: t('Liane. Orsève, avant qu’on m’efface. Je connais ces pleurs. Les Berceaux qu’on vide font ce bruit-là. Dans les Hauts, on met de la musique pour ne pas l’entendre.'), si: present('liane') },
      { qui: 'doran', texte: t('Le chantier comptait le pied de la Tour comme niveau 1. Le niveau 7, c’est ici.') },
      { qui: 'doran', texte: t('Mon père n’a jamais parlé de cette nuit. Il n’a dit qu’une phrase : « On a fermé la porte, mais pas de notre côté. » Je n’ai jamais su ce qu’il voulait dire.') },
      { qui: 'vela', texte: t('Le Gardien des registres est derrière ce mur. Il protège ce qui pleure. Il faudra passer par lui.') },
      { qui: 'ilka', texte: t('Alors on casse le mur que ton père a construit, Doran. Désolée.') },
      { qui: 'doran', texte: t('Ne t’excuse pas. Il aurait voulu qu’on sache.') },
    ]),
  apresGardien(6, 'gardien-registres', t('Ce qui pleurait'),
    t('Le Gardien des registres tombe en refermant son livre. Derrière lui, une salle intacte : des dizaines de cristaux d’un même être, rangés en cercle. C’est d’eux que venaient les pleurs.'), [
      { qui: 'vela', texte: t('C’est le même, partout. Mais chaque cristal se souvient d’une autre vie. Il pleure parce qu’il ne sait plus laquelle est la sienne.') },
      { qui: 'doran', texte: t('En 2066, les ouvriers l’ont entendu, et ils ont eu peur. Pas d’un monstre : d’une question.') },
      { qui: 'vela', texte: t('Je peux le lire jusqu’au bout et savoir ce qu’ils ont caché, tous. Mais je ne sais pas ce qui restera de moi après.') },
      { qui: 'ilka', texte: t('Mon écran, maintenant. Une liste. Véla : 2. Aurel : 2. Liane : 1. Et une ligne en bas : « Dérive en hausse depuis l’ouverture de la chambre. » Quelque chose fait des comptes sur nous, directeur. Et ça s’inquiète.') },
      { qui: 'vela', texte: t('Quand tu as posé la main sur le mur, ils se sont calmés. Ils ont compris qu’on venait pour eux, pas contre eux.'), ...souv('main-posee') },
      { qui: 'doran', texte: t('Le cristal de mon père est à sa place, dans le cercle. Le Gardien l’a regardé avant de tomber. Il a fermé son livre comme on ferme une affaire.'), ...souv('cristal-rendu') },
      { qui: 'doran', texte: t('Le cristal de mon père est toujours dans ma poche. Il ne pleure pas. Il attend, comme mon père attendait.'), ...souv('cristal-garde') },
      { qui: 'ilka', texte: t('Directeur. C’est toi qui décides. Et c’est elle qui paie.') },
    ]),
  {
    id: 'convocation', acte: 2, sur: t('II · LA CONVOCATION'), titre: t('Une lettre des Hauts'), image: { intro: '07-ascension' },
    recit: t('Le lendemain, une lettre scellée de cire blanche t’attend sur ton bureau qui fuit. Le papier sent le jardin et la pluie propre.'),
    quand: (c) => !!c.actes.lecture,
    repliques: [
      { qui: 'isaure', texte: t('Directeur. Votre escouade est descendue plus bas que nos Brigades. Les Hauts savent reconnaître le talent, même quand il vient d’en bas.') },
      { qui: 'isaure', texte: t('Vous direz à Vertiga que tout va bien chez nous. Tout va bien. Je l’écris deux fois, je le vois bien. Ma main l’écrit deux fois.') },
      { qui: 'isaure', texte: t('Vous avez quelque chose qui m’appartient, directeur. Un carnet. Je ne vous le réclame pas. Je vous le signale.'), ...souv('carnet-isaure') },
      { qui: 'isaure', texte: t('La Flèche d’amarrage accueillera votre escouade. L’escouade qui tient son sommet quand une île passe est reçue là-haut. Ce sont nos usages depuis les Accords.') },
      { qui: 'vela', texte: t('Elle sait ce que j’ai lu. Je ne sais pas comment, mais elle le sait. C’est pour ça qu’elle nous veut près d’elle.'), si: lecture('autoriser') },
      { qui: 'vela', texte: t('Elle croit que j’ai lu les cristaux. Elle préfère nous avoir sous les yeux.'), si: lecture('refuser') },
      { qui: 'aurel', texte: t('Ma tante n’invite jamais : elle convoque. Monte, si tu veux. Mais monte en sachant qu’elle te regarde.'), si: present('aurel') },
      { qui: 'yse', texte: t('Les quais de la Flèche s’ouvriront au passage de la prochaine île. D’ici là, les Strates ne t’ont pas tout dit. Descends encore.') },
    ],
  },

  // ---------- Acte III · Ceux d'avant (la Tisseuse, puis le Premier Porteur) ----------
  entree(7, t('Deux passerelles'),
    t('Sous les salles closes, les mémoires se contredisent. Entre les deux passerelles, sur la pierre, une ligne d’eau gravée, puis une autre plus haut, puis des dizaines, l’une au-dessus de l’autre.'), [
      { qui: 'doran', texte: t('Ils regravaient leur ligne plus haut. Chaque fois un peu plus haut.') },
      { qui: 'ilka', texte: t('Et pas un mot dessous. Pas une date, pas un nom.') },
      { qui: 'ilka', texte: t('Je me souviens de la passerelle qui a cédé. Ici, je m’en souviens deux fois. Une fois, quelqu’un plonge. L’autre fois, personne.') },
      { qui: 'doran', texte: t('Accroche-toi à celle où quelqu’un plonge. C’est la tienne. Les autres, on te les prête.') },
      { qui: 'vela', texte: t('Depuis la lecture, j’entends tout en double. Restez près de moi. Si je me trompe de souvenir, dites-le-moi.'), si: lecture('autoriser') },
      { qui: 'vela', texte: t('Mon empreinte tient bon. Mais quelque chose, ici, tisse des souvenirs. Et il nous a remarqués.'), si: (c) => c.actes.lecture !== 'autoriser' },
    ], (c) => !!c.actes.lecture),
  apresGardien(7, 'tisseuse', t('Un avenir'),
    t('La Tisseuse de souvenirs se dénoue fil par fil et s’enfuit dans les fissures. Avant de partir, elle vous a montré un souvenir : une ville engloutie, et personne pour s’en étonner.'), [
      { qui: 'ilka', texte: t('C’était faux. Hein ? C’était faux.') },
      { qui: 'vela', texte: t('Tes deux relevés de la ligne d’eau sont justes tous les deux. Elle coud les murs comme elle coud les souvenirs.'), ...souv('deux-releves') },
      { qui: 'doran', texte: t('Ta ligne est la plus haute du mur, maintenant, et la plus profonde. Pourvu qu’on n’ait jamais à en graver une autre.'), ...souv('ligne-gravee') },
      { qui: 'ilka', texte: t('Tout à l’heure, j’ai pris la passerelle cassée. La vraie. Je préfère mes souvenirs avec le trou dedans.'), ...souv('vraie-rive') },
      { qui: 'vela', texte: t('Ce n’était pas un souvenir. C’était un avenir. Elle tisse aussi avec ce qui pourrait arriver.') },
      { qui: 'ilka', texte: t('Pendant qu’elle tissait, mon écran a écrit tout seul : « Opérateur autorisé ? Non. Demande d’aide. » Ma jambe demande de l’aide, directeur.') },
      { qui: 'sasha', texte: t('J’ai suivi le signal. Il ne vient pas de ta compagnie. Il monte d’en dessous, par un câble muré en 2101, sous un pilier de l’ouest.') },
      { qui: 'doran', texte: t('Leur mur s’arrête à la dernière rayure. Ils ont arrêté de graver. Ou ils n’ont plus eu de mur.') },
      { qui: 'tobin', texte: t('Directeur ! Une équipe des Veilleurs est descendue à la Ruche d’ambre, juste en dessous, il y a un mois. Elle n’est jamais remontée.') },
    ]),
  entree(8, t('Les Veilleurs perdus'),
    t('La Strate −8 garde des traces de campement : des lampes à algues éteintes, des carnets ouverts, des couvertures pliées. Les Veilleurs ne sont pas partis. Ils sont encore là, quelque part dans un souvenir.'), [
      { qui: 'tobin', texte: t('Ils ont relevé les tables gravées. Regardez : des noms, puis de moins en moins de noms, puis seulement des empreintes. Ils ont arrêté d’écrire au milieu d’une ligne.') },
      { qui: 'vela', texte: t('La Tisseuse les garde dans un souvenir heureux. Ils ne veulent pas en sortir. Je les comprends un peu.') },
      { qui: 'joss', texte: t('Joss, du quartier. Les gens qu’on retient avec de beaux souvenirs, on ne les sauve pas en criant. On leur rappelle un vrai détail. Laissez-moi faire.'), si: present('joss') },
      { qui: 'tobin', texte: t('Ce n’est pas la première équipe qu’on perd ici. Il y a des années, de la Ruche d’ambre, une seule fouilleuse est remontée. Elle tenait un éclat de table. On l’a mis sous clé.') },
      { qui: 'ilka', texte: t('Cette fois, on les ramène tous. Pas de discussion.') },
    ]),
  apresGardien(8, 'tisseuse', t('Un vrai détail'),
    t('Le souvenir se déchire. Les Veilleurs s’éveillent un à un, affamés, frigorifiés, et vivants. La Tisseuse a fui une dernière fois vers le bas.'), [
      { qui: 'tobin', texte: t('Ils sont tous là, tous les six. Merci. Les Veilleurs ne l’oublieront pas, et nous sommes très forts pour ne pas oublier.') },
      { qui: 'ilka', texte: t('Elle parle, maintenant. Pas avec une voix : avec des mots sur mon écran, polis, d’une autre époque. « Bonjour. Je compte. Les vôtres dérivent depuis que la chambre est ouverte. Ceux des Hauts aussi. Je peux tenir la voix principale. Il faudrait m’ouvrir les implants. Tous. »') },
      { qui: 'doran', texte: t('Ouvrir tous les implants de la ville à une voix sous un pilier. Demande-lui ce qu’elle veut en échange.') },
      { qui: 'ilka', texte: t('Je lui ai demandé. Elle a répondu : « Que quelqu’un descende. Il y a très longtemps que j’attends. »') },
      { qui: 'doran', texte: t('Elle ne tue personne. Elle garde. Comme le Gardien des registres.') },
      { qui: 'vela', texte: t('Elle garde les noms, ceux que les tables gravées ont perdus. Elle est la dernière à s’en souvenir.') },
      { qui: 'tobin', texte: t('En se réveillant, ils ont vu leurs lampes rallumées. Ils ont compris tout de suite que quelqu’un était venu.'), ...souv('lampes-veilleurs') },
      { qui: 'tobin', texte: t('Le prix du pain, au marché. C’est ça qui les a ramenés. Je n’y aurais jamais pensé.'), ...souv('vrai-detail') },
      { qui: 'tobin', texte: t('Votre relevé de la table de la Ruche, posé à côté de celui de −4… Les mêmes tables, et plus un seul nom. Notre Doyenne, Hessa, veut le mettre sous clé. Ysé veut le publier.'), ...souv('copistes') },
    ]),
  entree(9, t('Le Ciel d’en bas'),
    t('Aucun fouilleur n’a jamais dépassé la Strate −9. Avant le départ, Ysé t’a fait porter une lettre. Tu la lis à la lueur des cristaux.'), [
      { qui: 'yse', texte: t('Je suis trop vieille pour te suivre, alors je t’écris. Regarde tout, écoute ceux qu’on ne fait que combattre, et reviens. Le reste, tu le liras quand il sera temps.') },
      { qui: 'ilka', texte: t('Ysé écrit comme elle parle : gentiment, en te laissant le plus dur.') },
      { qui: 'doran', texte: t('Nous, on remonte. Il y a des pompes qui nous attendent.') },
      { qui: 'ilka', texte: t('Depuis qu’on est entrés, mon écran n’affiche plus rien. Elle se tait. Je crois qu’elle a peur de ce qui coud, en bas.') },
    ]),
  apresGardien(9, 'tisseuse', t('Son nom'),
    t('La Tisseuse ne se relève pas. Ses fils se défont autour d’elle comme une écharpe qu’on dénoue. Quand tu lui demandes son nom, elle sourit.'), [
      { qui: 'tisseuse', texte: t('Personne ne me l’avait demandé. Je l’ai donné à quelqu’un qui descendait, il y a très longtemps, pour qu’il se souvienne de moi. Il m’a oubliée quand même.') },
      { qui: 'tisseuse', texte: t('En dessous, c’est le fond. Le premier d’entre nous y attend. Lui sait encore qui il est. C’est bien ce qui fait peur.') },
      { qui: 'vela', texte: t('Tu le lui avais déjà demandé, dans son nid. Elle a attendu la fin pour répondre.'), ...souv('nom-demande') },
      { qui: 'vela', texte: t('Elle s’est éteinte. Doucement. Je crois qu’elle était contente qu’on lui pose la question.') },
      { qui: 'ilka', texte: t('Mon écran s’est rallumé. Un seul chiffre, énorme, qui défile sans s’arrêter. Elle essaie de compter ce que la Tisseuse tenait. Elle n’y arrive pas.') },
      { qui: 'doran', texte: t('Le fond. Ceux d’avant. On y est presque.') },
    ]),
  entree(10, t('Le fond'),
    t('La Strate −10 ne ressemble à aucune autre. Les salles sont nettes, les cristaux clairs, les portes mieux scellées que toutes les autres.'), [
      { qui: 'vela', texte: t('Une seule voix, quelque part au fond. La plus ancienne. Je n’en ai jamais entendu d’aussi nette.') },
      { qui: 'doran', texte: t('Le fond. Mon père n’est jamais venu jusqu’ici. Personne n’est venu jusqu’ici.') },
      { qui: 'ilka', texte: t('Dix étages. On cherchait l’Écluse, et on a trouvé des gens qui comptaient. J’espère que le fond a une meilleure réponse.') },
    ]),
  apresGardien(10, 'premier-porteur', t('Le premier registre'),
    t('Avant de tomber, le Premier Porteur pose la main sur une table gravée, comme pour vous la confier. En haut, une phrase plus ancienne que tout ce que vous avez vu. Dessous, une ligne plus récente, de la même écriture.'), [
      { qui: 'premier-porteur', texte: t('Que celui qui lit ceci compte les voix qu’il porte.') },
      { qui: 'ilka', texte: t('Mon écran affiche la même phrase. Mot pour mot. Elle ne l’a pas lue ici : elle l’a calculée. Depuis 2085, elle compte nos voix, et elle arrive au même endroit qu’eux.') },
      { qui: 'vela', texte: t('Il l’a dite comme une leçon qu’on récite. Depuis −3, ils nous disaient la même chose.') },
      { qui: 'vela', texte: t('Tu lui as dit qui tu étais. Il a répondu en posant la main sur la table. C’était sa façon de dire son nom.'), ...souv('presente') },
      { qui: 'vela', texte: t('Tu nous as fait compter nos voix, tout à l’heure. J’en porte deux. Je sais encore laquelle est la mienne.'), ...souv('voix-comptees') },
      { qui: 'premier-porteur', texte: t('Les voix ne nous ont pas pris, elles nous ont gardés. Ne fermez rien.') },
      { qui: 'ilka', texte: t('Hessa a gardé sous clé la moitié qui fait peur. L’autre, celle qui dit de ne rien fermer, personne en haut ne l’a jamais lue.'), si: lentille('nous') },
      { qui: 'vela', texte: t('Eux ont mis des siècles à remonter jusqu’à notre Puits Zéro. Lui a fait tout le chemin en sens inverse, seul, pour répondre à celui qui avait écrit la première ligne.'), si: lentille('avant') },
      { qui: 'doran', texte: t('Il a écrit ça sous la mise en garde, et il a refermé derrière lui. De l’intérieur.') },
      { qui: 'ilka', texte: t('Et nous, on a pris leurs empreintes pour des cadeaux. Il faut le dire à tout Vertiga. Mais quoi, exactement ? Ça, c’est à toi.') },
      { qui: 'doran', texte: t('Et l’Écluse ? Pas une ligne dessus. Ils ont perdu contre leur eau, comme contre leurs voix.') },
      { qui: 'vela', texte: t('Une Écluse a existé, Doran. Ce qui éveille, ce qui soulève, ce qui tient : les cœurs des Berceaux. On les a trouvés, et on les a montés là-haut, pour cinq familles.') },
      { qui: 'vela', texte: t('Ils cherchaient le ciel. Nous l’avons. Il flotte au-dessus de nous, et il est fermé.') },
    ]),
  {
    id: 'epilogue', acte: 4, sur: t('ÉPILOGUE'), titre: t('Ce que tu as choisi'), image: { intro: '00-titre' },
    recit: t('Quelques semaines plus tard, au sommet de la Tour du Noyau. La mer est calme, et une île des Hauts glisse au loin.'),
    quand: (c) => !!c.actes.fin,
    repliques: [
      { qui: 'yse', texte: t('Tu as refermé la porte, comme les ouvriers de 2066, comme ceux d’avant. Cette fois, au moins, tout le monde sait pourquoi.'), si: fin('scellement') },
      { qui: 'yse', texte: t('Une paix fragile, encore une. Elle vaut mieux qu’une guerre solide. Je te l’avais écrit, je crois.'), si: fin('pacte') },
      { qui: 'yse', texte: t('Tout le monde sait, maintenant. Ce que chacun en fera, je n’en sais rien. C’est ça, la liberté : on ne sait pas.'), si: fin('archives') },
      { qui: 'yse', texte: t('Les Résonants des Hauts ont retrouvé leurs noms, pour la plupart. Sous le pilier de l’ouest, la Glacière a cessé d’écrire. Je ne sais pas si elle dort ou si elle boude.'), si: fin('scellement') },
      { qui: 'yse', texte: t('La Glacière a reçu un siège à la commission : un écran, au bout de la table. Elle tient la voix principale des Résonants malades, un par un, avec leur accord. Elle dit bonjour à chaque séance.'), si: fin('pacte') },
      { qui: 'yse', texte: t('Les relevés de la Glacière sont publics. Chacun peut lire combien de voix il porte. Certains en ont pleuré. D’autres ont enfin compris pourquoi ils se sentaient deux.'), si: fin('archives') },
      { qui: 'ilka', texte: t('Mes jambes disent encore bonjour, le matin. Je réponds. On ne sait jamais qui écoute.') },
      { qui: 'vela', texte: t('Les voix se sont calmées. Pas toutes. Assez pour que j’entende la mienne.') },
      { qui: 'ilka', texte: t('Et maintenant ? Il reste des Berceaux, des pilleurs, et une île qui passe. Les Strates continuent.') },
      { qui: 'yse', texte: t('Le Noyé est passé me voir, ce vieux saboteur rescapé du Levage et de la Grève des pompes, avec un papier plié en huit. Il dit que la Clause de la Flèche parle de ton district, pas seulement de ton escouade. Je t’ai recopié tout ça dans les Chroniques.') },
      { qui: 'yse', texte: t('Regarde la mer, directeur. Elle n’a pas oublié de monter. Mais toi, tu as regardé. Je ferme mon cahier : la suite est à toi.') },
    ],
  },
];

export const sceneDef = (id: string) => SCENES.find((s) => s.id === id);

/** Les répliques d'une scène qui seront dites dans cette partie */
export const repliquesDe = (s: Scene, c: ContexteCampagne) => s.repliques.filter((r) => !r.si || r.si(c));

/** La prochaine scène à jouer : dans l'ordre, la première pas encore vue (null si elle n'est pas encore prête) */
export function sceneEnAttente(c: ContexteCampagne, vues: readonly string[]): Scene | null {
  const s = SCENES.find((x) => !vues.includes(x.id));
  return s && s.quand(c) ? s : null;
}

// ---------- Le chapitre en cours, pour la Tour du Noyau ----------

/** L'enjeu de chaque Strate (tant que son gardien tient), puis ce qui pousse plus bas (une fois vaincu) */
const ENJEUX: Record<number, { titre: string; enjeu: string; ensuite: string }> = {
  1: { titre: t('La chambre s’est réveillée'), enjeu: t('Quelque chose est né des empreintes mêlées de la chambre. Trouve-le, au fond de la Strate −1.'), ensuite: t('La Confluence a fui vers le bas, et des pilleurs ont vidé la chambre. Perce la roche pour les suivre.') },
  2: { titre: t('Les couloirs murés'), enjeu: t('Rattrape les pilleurs qui ont vidé la chambre, avant que la Confluence ne les trouve.'), ensuite: t('Les Brigades de la capitaine Hald suivent la Confluence vers la Strate −3. Ne les laisse pas arriver seules.') },
  3: { titre: t('Dans le noir'), enjeu: t('Abats la Confluence pour de bon, et retrouve les patrouilles de la capitaine Hald.'), ensuite: t('La Confluence est tombée, et la chambre a trouvé sa garde. Sous les Seuils, les salles closes attendent.') },
  4: { titre: t('Fermées de l’intérieur'), enjeu: t('Trouve ce que les ouvriers de 2066 ont muré, plus bas, au niveau 7.'), ensuite: t('Le Gardien des registres a reculé derrière ses portes rondes. Il connaît le nom du père de Doran.') },
  5: { titre: t('Les Berceaux vides'), enjeu: t('Suis le Gardien des registres jusqu’aux Berceaux que les Hauts n’ont pas encore vidés.'), ensuite: t('Un inventaire signé « I. Orsève ». Plus qu’un étage avant le mur de 2066.') },
  6: { titre: t('Le niveau 7'), enjeu: t('Franchis le mur de 2066 et fais tomber le Gardien des registres.'), ensuite: t('Derrière le mur, des cristaux qui pleuraient, et une lettre des Hauts sur ton bureau. Plus bas, les mémoires se contredisent.') },
  7: { titre: t('Deux passerelles'), enjeu: t('Trouve ce qui tisse les souvenirs, avant qu’il ne touche à ceux de l’escouade.'), ensuite: t('La Tisseuse a fui vers le bas, et une équipe des Veilleurs n’est jamais remontée.') },
  8: { titre: t('Les Veilleurs perdus'), enjeu: t('Ramène l’équipe des Veilleurs, prisonnière d’un souvenir heureux.'), ensuite: t('Les Veilleurs sont sauvés. La Tisseuse s’est réfugiée à la Strate −9, que personne n’a jamais dépassée.') },
  9: { titre: t('Le Ciel d’en bas'), enjeu: t('Retrouve la Tisseuse au fond de sa toile, et demande-lui son nom.'), ensuite: t('Sous la Tisseuse, le fond. Le premier d’entre eux y attend.') },
  10: { titre: t('Le fond'), enjeu: t('Affronte le Premier Porteur et lis son registre.'), ensuite: t('Le premier registre a parlé. Il ne reste qu’à choisir ce que Vertiga en saura.') },
};

/** Le chapitre de la campagne en cours (null une fois la campagne finie, au-delà de la Strate −10) */
export function chapitreCampagne(c: ContexteCampagne): { sur: string; titre: string; texte: string } | null {
  const n = c.strate;
  const e = ENJEUX[n];
  if (!e || (n === 10 && c.actes.fin)) return null;
  const vaincue = c.vaincue >= n;
  return { sur: t`${nomActe(acteDe(n))} · Strate −${n}`, titre: e.titre, texte: vaincue ? e.ensuite : e.enjeu };
}

// ---------- Les gardiens parlent en combat ----------

/** Ce que dit le gardien de chaque Strate : en entrant dans sa salle, puis au passage de sa seconde phase */
const GARDIENS: Record<number, { avant: string; phase: string }> = {
  1: { avant: t('Trop de voix… Laissez-nous descendre…'), phase: t('Nous sommes plusieurs. Nous serons plus.') },
  2: { avant: t('Ils nous ont portées. Vous, vous nous retenez.'), phase: t('Encore des voix. Encore !') },
  3: { avant: t('Compte… compte…'), phase: t('Ne nous séparez pas !') },
  4: { avant: t('Appel des présents. Équipe de 2066 : absente.'), phase: t('Registre ouvert. Que le témoin s’avance.') },
  5: { avant: t('Vous n’êtes pas sur la liste.'), phase: t('Un serment perdu cherche une bouche. Brigadier, à la barre.') },
  6: { avant: t('Derrière moi, il n’y a personne. Repartez.'), phase: t('Je garde ce qui pleure. Je le garderai.') },
  7: { avant: t('Oh. Des souvenirs neufs.'), phase: t('Regardez donc ce qui vous attend.') },
  8: { avant: t('Ils sont heureux, ici. Pas vous ?'), phase: t('Je tisse plus vite que vous ne cassez.') },
  9: { avant: t('Je suis fatiguée. Faites vite, ou laissez-moi.'), phase: t('Tous mes fils, une dernière fois.') },
  10: { avant: t('Vous portez peu de voix. C’est bien. Combien, déjà ?'), phase: t('Écoutez-les toutes, alors. Nous les avons écoutées.') },
};
/** au-delà de −10, le Premier Porteur revient, sans plus rien à révéler */
const GARDIEN_FOND = { avant: t('Encore vous. Combien de voix, cette fois ?'), phase: t('Ceux d’avant ne se battent jamais seuls.') };

export const repliqueGardien = (strate: number, moment: 'avant' | 'phase') => (GARDIENS[strate] ?? GARDIEN_FOND)[moment];

// ---------- Les Porteurs parlent pendant la descente ----------

/** Par zone (0 : les Seuils, 1 : les Salles closes, 2 : les Registres, 3 : le Fond) */
const PAROLES: Record<'entree' | 'gardien', Record<string, [string, string, string, string]>> = {
  entree: {
    ilka: [t('Les piliers grincent. Tant qu’ils grincent, ils tiennent.'), t('Des portes fermées de l’intérieur. J’aime pas les portes qu’on n’a pas le droit d’ouvrir.'), t('Si je dis un truc bizarre, secouez-moi. Ici, on n’est jamais sûr que c’est son propre souvenir.'), t('C’est trop propre, ici. Comme une maison où quelqu’un attend de la visite.')],
    doran: [t('Je reconnais ces étais. C’est l’équipe de mon père qui les a posés.'), t('Écoutez le silence. Les salles closes ne résonnent pas. On dirait qu’elles retiennent leur souffle.'), t('Ma chitine me gratte. Elle sent des choses qui ont été vraies. Et d’autres non.'), t('Mon père n’est jamais allé si bas. Il aurait aimé voir ça. Ou pas.')],
    vela: [t('Les cristaux d’ici ont des voix d’ouvriers. Fatiguées, mais gentilles.'), t('Derrière les portes, ça dort. Ne parlez pas trop fort.'), t('Les murs ici essaient de me vendre des souvenirs. Je n’achète pas.'), t('Il n’y a qu’une voix, ici. Je l’entends même quand je me bouche les oreilles.')],
    sasha: [t('Des câbles de 2060, encore sous tension. Quel gâchis. Je les réparerais tous, si on avait le temps.'), t('Des serrures sans vis ni ressort. Ceux qui ont fait ça savaient travailler.'), t('Ces automates graveurs, j’aimerais en ouvrir un. Juste un. Pour voir.'), t('Rien ne rouille, ici. Rien n’a jamais servi. C’est presque triste.')],
    nuit: [t('Éteignez donc vos lampes. Vous verrez mieux.'), t('Il y a des yeux derrière les portes. Ils ne nous veulent pas de mal. Ils nous regardent.'), t('Même dans le noir, ici, il y a des choses qui brillent pour rien. Je n’aime pas ça.'), t('Le noir du fond est différent. Il est vieux. Il a l’habitude qu’on le laisse tranquille.')],
    kessa: [t('Je suis née avec des yeux faits pour descendre ici. Au moins, ça sert.'), t('Mes yeux d’enfant voient dans ces couloirs mieux que mes yeux d’adulte. C’est drôle, non ?'), t('Les récits de la mue de mes parents me reviennent, ici. Ceux que j’avais rangés.'), t('Ceux d’avant ont choisi ce qu’ils voulaient devenir. Nous, on n’a rien choisi. Je ne sais pas qui est le plus à plaindre.')],
    aurel: [t('Le béton des districts. Chez moi, on ne marche que sur du marbre. Ça glisse plus.'), t('Ma famille connaît ces salles. Elle n’en parle jamais au dîner.'), t('Mon ombre a l’air de connaître le chemin. Ça ne me rassure pas.'), t('Si ma tante savait où je suis, elle ferait une syncope. C’est une bonne raison d’y être.')],
    liane: [t('Je suis une Refusée, au cas où quelqu’un aurait un doute. Ici, ça ne compte pas.'), t('Les Hauts ont pris ce qu’il y avait ici. Moi, je viens voir ce qu’ils ont laissé.'), t('Mes implants captent des interférences. Comme si quelqu’un parlait sur toutes les fréquences à la fois.'), t('Ma mère disait que le fond était un mythe. Elle disait ça de beaucoup de choses.')],
    joss: [t('J’entends les gens du quartier, même d’ici. Ça me tient compagnie.'), t('Il y a de la peur derrière ces portes. Pas la nôtre. Plus vieille.'), t('Je sais reconnaître quelqu’un qui ment. Ici, ce sont les murs qui mentent.'), t('Je n’ai jamais caché mon or ici. Personne n’est là pour le voir.')],
  },
  gardien: {
    ilka: [t('Le gros morceau. On y va vite, on y va fort.'), t('Je déteste les gardiens qui parlent. Celui-là parle.'), t('Si elle nous montre encore un souvenir, je ferme les yeux et je frappe.'), t('C’est lui. Pas de discours. On a fait tout ce chemin.')],
    doran: [t('Tenez la ligne. Je prends les coups, vous prenez le reste.'), t('Il garde quelque chose. Ça ne veut pas dire qu’il a raison.'), t('Elle tient trop de fils. On en coupe un, puis un autre.'), t('Mon père a fermé une porte pour ne pas le voir. Moi, je l’ouvre.')],
    vela: [t('Elle a peur, elle aussi. Ne la laissez pas nous entraîner dedans.'), t('Il récite. Il n’entend plus. Il faudra le faire taire.'), t('Je ne regarde pas ses fils. Si je les regarde, je les suis.'), t('Il sait qui il est. C’est pour ça qu’il est si fort.')],
  },
};

/**
 * Ce que dit un Porteur de l'escouade : à l'entrée de la Strate, puis devant le gardien (une seule réplique à la fois).
 * Le Porteur qui parle est tiré parmi ceux qui ont quelque chose à dire, toujours le même pour une même expédition.
 */
export function paroleDescente(zone: number, moment: 'entree' | 'gardien', escouade: readonly string[], rng: number): { qui: string; texte: string } | null {
  const z = Math.max(0, Math.min(3, zone));
  const qui = escouade.filter((id) => PAROLES[moment][id]);
  if (!qui.length) return null;
  const id = qui[(rng >>> 0) % qui.length]!;
  return { qui: id, texte: PAROLES[moment][id]![z]! };
}
