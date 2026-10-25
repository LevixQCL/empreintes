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

/** Ce qu'une condition peut lire de la partie, sans dépendre de jeu.ts */
export interface ContexteCampagne {
  /** la Strate la plus profonde ouverte */
  strate: number;
  /** la Strate la plus profonde dont le gardien est vaincu */
  vaincue: number;
  actes: { chambre?: string; lecture?: string; fin?: string };
  presents: readonly string[];
}

/** Ceux qui parlent et ne sont pas des Porteurs (les Porteurs et les gardiens ont déjà leur nom et leur portrait) */
export const PERSONNAGES: Record<string, { nom: string; role: string; couleur: string }> = {
  yse: { nom: 'Ysé', role: 'Archiviste des Veilleurs', couleur: 'var(--or)' },
  hald: { nom: 'Capitaine Hald', role: 'Brigades du Serment de Veyr', couleur: 'var(--reso)' },
  tobin: { nom: 'Tobin', role: 'Fouilleur des Veilleurs', couleur: 'var(--ivory)' },
  brac: { nom: 'Brac', role: 'Pilleur de Strates', couleur: 'var(--tech)' },
  isaure: { nom: 'Dame Isaure Orsève', role: 'Maison Orsève, les Hauts', couleur: 'var(--reso)' },
};

export interface Replique {
  /** un Porteur, un gardien (id d'ennemi) ou un personnage de PERSONNAGES */
  qui: string;
  texte: string;
  /** la réplique n'est dite que si la condition tient (une décision prise, un Porteur arrivé) */
  si?: (c: ContexteCampagne) => boolean;
}

/** L'illustration d'une scène : le décor de la zone, le portrait d'un gardien, ou un tableau de l'intro */
export type ImageScene = { zone: number } | { ennemi: string } | { intro: string };

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

const ACTES: Record<1 | 2 | 3 | 4, string> = { 1: 'Acte I · La chambre', 2: 'Acte II · Les salles closes', 3: 'Acte III · Ceux d’avant', 4: 'Épilogue' };
export const nomActe = (a: 1 | 2 | 3 | 4) => ACTES[a];
const acteDe = (strate: number): 1 | 2 | 3 => (strate <= 3 ? 1 : strate <= 6 ? 2 : 3);
const ROMAIN = { 1: 'I', 2: 'II', 3: 'III' } as const;

const present = (id: string) => (c: ContexteCampagne) => c.presents.includes(id);
const absent = (id: string) => (c: ContexteCampagne) => !c.presents.includes(id);
const garde = (g: string) => (c: ContexteCampagne) => c.actes.chambre === g;
const lecture = (l: string) => (c: ContexteCampagne) => c.actes.lecture === l;
const fin = (f: string) => (c: ContexteCampagne) => c.actes.fin === f;

/** une scène d'ouverture de Strate (l'enjeu) ; les Strates −4, −7 attendent la décision de l'acte précédent */
const entree = (strate: number, titre: string, recit: string, repliques: Replique[], apres?: (c: ContexteCampagne) => boolean): Scene => ({
  id: `entree-${strate}`, acte: acteDe(strate), sur: `${ROMAIN[acteDe(strate)]} · STRATE −${strate}`, titre, image: { zone: strate <= 3 ? 0 : strate <= 6 ? 1 : strate <= 9 ? 2 : 3 },
  recit, repliques, quand: (c) => c.strate >= strate && (!apres || apres(c)),
});
/** une scène après le gardien d'une Strate (ce qu'on a trouvé) */
const apresGardien = (strate: number, boss: string, titre: string, recit: string, repliques: Replique[]): Scene => ({
  id: `gardien-${strate}`, acte: acteDe(strate), sur: `${ROMAIN[acteDe(strate)]} · GARDIEN DE LA STRATE −${strate}`, titre, image: { ennemi: boss },
  recit, repliques, quand: (c) => c.vaincue >= strate,
});

// Dans l'ordre où elles se jouent : une scène n'est proposée que si toutes celles d'avant sont vues (sceneEnAttente).
export const SCENES: Scene[] = [
  // ---------- Acte I · La chambre (Les Fondations, la Confluence) ----------
  apresGardien(1, 'confluence', 'Elle n’est pas morte',
    'La Confluence se défait sous vos coups. Ses empreintes ne s’éteignent pas : elles coulent dans les fissures du sol, comme de l’eau qui trouve sa pente.', [
      { qui: 'vela', texte: 'Elle n’est pas morte. Elle est descendue. Elle cherche quelque chose, plus bas.' },
      { qui: 'doran', texte: 'Par là, il n’y a que les couloirs qu’on a murés en 2060. Enfin, il n’y avait.' },
      { qui: 'ilka', texte: 'Un monstre fait de morts mélangés, qui connaît nos tunnels mieux que nous. Parfait.' },
      { qui: 'doran', texte: 'Et regardez par terre : des traces de bottes, toutes fraîches. Quelqu’un est passé avant nous.' },
    ]),
  entree(2, 'Les couloirs murés',
    'Au retour, la chambre aux empreintes était à moitié vide. Des traces de bottes mènent vers la Strate −2, que tes creuseurs viennent d’ouvrir.', [
      { qui: 'yse', texte: 'Des pilleurs. Ils ont pris les cristaux de la chambre pendant que Vertiga dormait. S’ils partent au marché noir, on ne les reverra jamais.' },
      { qui: 'doran', texte: 'Ils sont passés par l’ancien puits d’aération. Je connais le chemin. Mon père le connaissait mieux.' },
      { qui: 'vela', texte: 'Les cristaux qu’ils emportent ont peur. Je les entends d’ici. Et la Confluence les entend aussi.' },
      { qui: 'ilka', texte: 'Alors on court. Pour une fois, c’est moi qui donne le rythme.' },
    ]),
  apresGardien(2, 'confluence', 'Brac',
    'Au fond de la Strate, des sacs éventrés et des cristaux éteints. La Confluence les a trouvés avant vous, et elle a grossi. Dans un recoin, un pilleur tremble.', [
      { qui: 'brac', texte: 'Je m’appelle Brac. Je ne les ai pas volées, directeur. Elles me l’ont demandé. Toute la nuit, elles m’ont demandé de les emmener plus bas.' },
      { qui: 'vela', texte: 'Il dit vrai. Les empreintes de la chambre veulent descendre. Je ne sais pas pourquoi. Je sais qu’elles ont peur de rester en haut.' },
      { qui: 'hald', texte: 'Capitaine Hald, Brigades du Serment de Veyr. Au nom de la Maison Orsève, cette fouille est suspendue. Ce qui brille ici relève de la garde des Hauts.' },
      { qui: 'ilka', texte: 'On vient de se battre pour ça, capitaine. Vous, vous venez d’arriver.' },
      { qui: 'hald', texte: 'Votre directeur décidera. En attendant, mes Brigades suivent la Confluence. Avec ou sans vous.' },
    ]),
  entree(3, 'Dans le noir',
    'La Strate −3 n’a jamais vu une lampe. Les Brigades de la capitaine Hald y sont entrées hier ; aucune patrouille n’est remontée.', [
      { qui: 'nuit', texte: 'Le noir n’est pas vide. Vos soldats sont vivants : je les entends respirer, loin, en bas.', si: present('nuit') },
      { qui: 'vela', texte: 'Les soldats sont vivants. Je les sens, loin en bas, serrés les uns contre les autres.', si: absent('nuit') },
      { qui: 'doran', texte: 'La Confluence s’est arrêtée quelque part en dessous. Elle a fini de chercher.' },
      { qui: 'vela', texte: 'Elle a trouvé. C’est pire.' },
      { qui: 'ilka', texte: 'Les Hauts, les pilleurs, et maintenant un monstre : tout le monde veut cette chambre. On finit le travail, et ensuite, Vertiga écoutera ce qu’on en dit.' },
    ]),
  apresGardien(3, 'confluence', 'Une seule voix',
    'La Confluence s’effondre pour de bon. De son cœur roule un cristal minuscule, net comme une goutte d’eau. Une seule voix y parle, très calme.', [
      { qui: 'vela', texte: 'Elle répète un mot, toujours le même : « Compte. » Je crois que c’était la première, celle autour de qui les autres se sont collées.' },
      { qui: 'doran', texte: 'Les patrouilles de la capitaine sont sauves. Elles étaient coincées sous un éboulement. Elles nous doivent la vie.' },
      { qui: 'hald', texte: 'La Maison Orsève vous remercie, directeur. Elle vous demande à présent de lui confier la chambre.' },
      { qui: 'tobin', texte: 'Tobin, des Veilleurs de Sédime. Directeur, ne la donnez à personne avant qu’on ait compris ce qu’elle contient. Je vous en prie.' },
      { qui: 'ilka', texte: 'Et le quartier attend que tu dises qu’elle est à nous. À toi de trancher, l’Élu.' },
    ]),

  // ---------- Acte II · Les salles closes (le Gardien des registres) ----------
  entree(4, 'Fermées de l’intérieur',
    'Sous les Fondations commencent les salles closes : des portes rondes, verrouillées de l’intérieur. Quelque part en dessous, l’accès du niveau 7, que le district a muré après « l’incident du 14 ».', [
      { qui: 'doran', texte: 'L’ordre de service de la chambre porte le tampon de l’équipe de mon père. Ils ont muré quelque chose, ici, en 2066. Je veux savoir quoi.' },
      { qui: 'hald', texte: 'Mes Brigades ouvrent la marche, comme convenu. Les Hauts paient bien ceux qui ne posent pas de questions.', si: garde('orseve') },
      { qui: 'hald', texte: 'Le district a choisi de garder la chambre. Les salles closes, ce sera nous. Ne vous trouvez pas sur notre chemin.', si: garde('district') },
      { qui: 'tobin', texte: 'Les Veilleurs descendent avec vous. On note tout. Même ce qui nous fait peur. Surtout ça.', si: garde('commission') },
      { qui: 'kessa', texte: 'On m’a fait muer pour ces couloirs-là, quand j’étais petite. Je n’en ai jamais vu le bout. Ce sera le bon jour.', si: present('kessa') },
      { qui: 'vela', texte: 'Derrière ces portes, quelqu’un a rangé les cristaux avec soin. Comme on range une chambre avant de partir pour de bon.' },
    ], (c) => !!c.actes.chambre),
  apresGardien(4, 'gardien-registres', 'L’appel',
    'Le Gardien des registres recule derrière une porte ronde et la referme sur lui. Avant de disparaître, il a lu une liste de noms, lentement, d’une voix de pierre.', [
      { qui: 'doran', texte: 'Quatre noms. Des ouvriers de 2066. Le troisième, c’était celui de mon père.' },
      { qui: 'vela', texte: 'Il ne nous menaçait pas. Il faisait l’appel. Comme s’il attendait que ceux de la liste reviennent.' },
      { qui: 'ilka', texte: 'Des gens qui ont muré une porte il y a cinquante-cinq ans, et un gardien qui les attend encore. Je déteste cet étage.' },
    ]),
  entree(5, 'Les Berceaux vides',
    'Plus bas, des niches de cristal en treillis, toutes ouvertes. Quelqu’un est passé avant vous, avec des outils propres et des sceaux de cire blanche.', [
      { qui: 'aurel', texte: 'Ces sceaux sont ceux de ma famille. La Maison Orsève vide les Berceaux depuis des années. Je l’ai vu enfant, sans comprendre ce que je voyais.', si: present('aurel') },
      { qui: 'doran', texte: 'De la cire blanche. Les Hauts. Ils sont passés avant nous, et ils n’ont rien laissé.', si: absent('aurel') },
      { qui: 'hald', texte: 'Ce que la Maison emporte ne vous regarde pas, directeur. Vous avez signé.', si: garde('orseve') },
      { qui: 'hald', texte: 'Vous ne resterez pas dans ces salles plus longtemps que nous. Mes ordres sont de tout sceller.', si: garde('district') },
      { qui: 'tobin', texte: 'J’ai compté les niches vides : trente-deux. Pas une seule de ces empreintes n’est arrivée chez les Veilleurs.', si: garde('commission') },
      { qui: 'vela', texte: 'Celles qui restent se sont serrées les unes contre les autres. Elles ont froid.' },
      { qui: 'doran', texte: 'Le Gardien est en dessous. Il garde ce qu’il reste. Je commence à le comprendre.' },
    ]),
  apresGardien(5, 'gardien-registres', 'L’inventaire',
    'Cette fois, le Gardien a appelé un brigadier à la barre. Le soldat s’est battu en récitant un serment qui n’était pas le sien. Dans la poche de son uniforme, un inventaire.', [
      { qui: 'ilka', texte: 'Un inventaire de Berceaux, signé « I. Orsève ». Ça dit quelque chose à quelqu’un ?' },
      { qui: 'aurel', texte: 'Dame Isaure. Ma tante. C’est elle qui tient le Registre des Vierges. Elle ne descend jamais : elle envoie les autres.', si: present('aurel') },
      { qui: 'vela', texte: 'Isaure Orsève. Une grande famille des Hauts. Elle ne descend jamais : elle envoie les autres.', si: absent('aurel') },
      { qui: 'vela', texte: 'Le brigadier ne savait plus pourquoi il se battait. Le Gardien lui avait prêté une voix. Il y en a beaucoup trop, ici, des voix.' },
      { qui: 'doran', texte: 'Plus qu’un étage avant le niveau 7. Celui que mon père a fermé.' },
    ]),
  entree(6, 'Le niveau 7',
    'La Strate −6 s’ouvre sur un mur de béton coulé à la hâte, couvert de tampons de 2066. Derrière, quelqu’un pleure. Il n’y a personne.', [
      { qui: 'liane', texte: 'Je connais ces pleurs. Les Berceaux qu’on vide font ce bruit-là. Dans les Hauts, on met de la musique pour ne pas l’entendre.', si: present('liane') },
      { qui: 'doran', texte: 'Mon père n’a jamais parlé de cette nuit. Il disait seulement : « On a répondu à quelqu’un. » Je crois qu’il a muré la réponse.' },
      { qui: 'vela', texte: 'Le Gardien des registres est derrière ce mur. Il protège ce qui pleure. Il faudra passer par lui.' },
      { qui: 'ilka', texte: 'Alors on casse le mur que ton père a construit, Doran. Désolée.' },
      { qui: 'doran', texte: 'Ne t’excuse pas. Il aurait voulu qu’on sache.' },
    ]),
  apresGardien(6, 'gardien-registres', 'Ce qui pleurait',
    'Le Gardien des registres tombe en refermant son livre. Derrière lui, une salle intacte : des dizaines de cristaux d’un même être, rangés en cercle. C’est d’eux que venaient les pleurs.', [
      { qui: 'vela', texte: 'C’est le même, partout. Mais chaque cristal se souvient d’une autre vie. Il pleure parce qu’il ne sait plus laquelle est la sienne.' },
      { qui: 'doran', texte: 'En 2066, les ouvriers l’ont entendu, et ils ont eu peur. Pas d’un monstre : d’une question.' },
      { qui: 'vela', texte: 'Je peux le lire jusqu’au bout et savoir ce qu’ils ont caché, tous. Mais je ne sais pas ce qui restera de moi après.' },
      { qui: 'ilka', texte: 'Directeur. C’est toi qui décides. Et c’est elle qui paie.' },
    ]),
  {
    id: 'convocation', acte: 2, sur: 'II · LA CONVOCATION', titre: 'Une lettre des Hauts', image: { intro: '07-ascension' },
    recit: 'Le lendemain, une lettre scellée de cire blanche t’attend sur ton bureau qui fuit. Le papier sent le jardin et la pluie propre.',
    quand: (c) => !!c.actes.lecture,
    repliques: [
      { qui: 'isaure', texte: 'Directeur. Votre escouade est descendue plus bas que nos Brigades. Les Hauts savent reconnaître le talent, même quand il vient d’en bas.' },
      { qui: 'isaure', texte: 'La Flèche d’amarrage accueillera votre escouade. Le district qui tient son sommet quand une île passe est reçu là-haut. Ce sont nos usages depuis les Accords.' },
      { qui: 'vela', texte: 'Elle sait ce que j’ai lu. Je ne sais pas comment, mais elle le sait. C’est pour ça qu’elle nous veut près d’elle.', si: lecture('autoriser') },
      { qui: 'vela', texte: 'Elle croit que j’ai lu les cristaux. Elle préfère nous avoir sous les yeux.', si: lecture('refuser') },
      { qui: 'aurel', texte: 'Ma tante n’invite jamais : elle convoque. Monte, si tu veux. Mais monte en sachant qu’elle te regarde.', si: present('aurel') },
      { qui: 'yse', texte: 'Les quais de la Flèche s’ouvriront au passage de la prochaine île. D’ici là, les Strates ne t’ont pas tout dit. Descends encore.' },
    ],
  },

  // ---------- Acte III · Ceux d'avant (la Tisseuse, puis le Premier Porteur) ----------
  entree(7, 'Deux passerelles',
    'Sous les salles closes, les mémoires se contredisent. Les murs montrent des souvenirs qui ne sont à personne. Et parfois, ils montrent les vôtres.', [
      { qui: 'ilka', texte: 'Je me souviens de la passerelle qui a cédé. Ici, je m’en souviens deux fois. Une fois, quelqu’un plonge. L’autre fois, personne.' },
      { qui: 'doran', texte: 'Accroche-toi à celle où quelqu’un plonge. C’est la tienne. Les autres, on te les prête.' },
      { qui: 'vela', texte: 'Depuis la lecture, j’entends tout en double. Restez près de moi. Si je me trompe de souvenir, dites-le-moi.', si: lecture('autoriser') },
      { qui: 'vela', texte: 'Mon empreinte tient bon. Mais quelque chose, ici, tisse des souvenirs. Et il nous a remarqués.', si: (c) => c.actes.lecture !== 'autoriser' },
    ], (c) => !!c.actes.lecture),
  apresGardien(7, 'tisseuse', 'Un avenir',
    'La Tisseuse de souvenirs se dénoue fil par fil et s’enfuit dans les fissures. Avant de partir, elle vous a montré un souvenir : ton district englouti, et personne pour s’en étonner.', [
      { qui: 'ilka', texte: 'C’était faux. Hein ? C’était faux.' },
      { qui: 'vela', texte: 'Ce n’était pas un souvenir. C’était un avenir. Elle tisse aussi avec ce qui pourrait arriver.' },
      { qui: 'doran', texte: 'Les lignes d’eau sur les vieux murs. Ysé en parle depuis des années. Personne ne l’écoute.' },
      { qui: 'tobin', texte: 'Directeur ! Une équipe des Veilleurs est descendue ici il y a un mois. Elle n’est jamais remontée.' },
    ]),
  entree(8, 'Les Veilleurs perdus',
    'La Strate −8 garde des traces de campement : des lampes à algues éteintes, des carnets ouverts, des couvertures pliées. Les Veilleurs ne sont pas partis. Ils sont encore là, quelque part dans un souvenir.', [
      { qui: 'tobin', texte: 'Ils ont relevé les tables gravées. Regardez : des noms, puis de moins en moins de noms, puis seulement des empreintes. Ils ont arrêté d’écrire au milieu d’une ligne.' },
      { qui: 'vela', texte: 'La Tisseuse les garde dans un souvenir heureux. Ils ne veulent pas en sortir. Je les comprends un peu.' },
      { qui: 'joss', texte: 'Les gens qu’on retient avec de beaux souvenirs, on ne les sauve pas en criant. On leur rappelle un vrai détail. Laissez-moi faire.', si: present('joss') },
      { qui: 'ilka', texte: 'On les ramène tous. Pas de discussion.' },
    ]),
  apresGardien(8, 'tisseuse', 'Un vrai détail',
    'Le souvenir se déchire. Les Veilleurs s’éveillent un à un, affamés, frigorifiés, et vivants. La Tisseuse a fui une dernière fois vers le bas.', [
      { qui: 'tobin', texte: 'Ils sont tous là, tous les six. Merci. Les Veilleurs ne l’oublieront pas, et nous sommes très forts pour ne pas oublier.' },
      { qui: 'doran', texte: 'Elle ne tue personne. Elle garde. Comme le Gardien des registres. Tout, ici, garde quelque chose.' },
      { qui: 'vela', texte: 'Elle garde les noms, ceux que les tables gravées ont perdus. Elle est la dernière à s’en souvenir.' },
    ]),
  entree(9, 'Là où personne n’est allé',
    'Aucun fouilleur n’a jamais dépassé la Strate −9. Avant le départ, Ysé t’a fait porter une lettre. Tu la lis à la lueur des cristaux.', [
      { qui: 'yse', texte: 'Je suis trop vieille pour te suivre, alors je t’écris. Si la Tisseuse garde des noms, demande-lui le sien. Personne ne le lui a demandé depuis longtemps, j’en suis sûre.' },
      { qui: 'vela', texte: 'Elle est là, au fond. Fatiguée. Elle tient encore tous ses fils, mais ses mains tremblent.' },
      { qui: 'ilka', texte: 'Une fois, on demande. Si elle répond par des coups, on répond pareil.' },
    ]),
  apresGardien(9, 'tisseuse', 'Son nom',
    'La Tisseuse ne se relève pas. Ses fils se défont autour d’elle comme une écharpe qu’on dénoue. Quand tu lui demandes son nom, elle sourit.', [
      { qui: 'tisseuse', texte: 'Personne ne me l’avait demandé. Je l’ai donné à quelqu’un d’autre, il y a très longtemps, pour qu’il se souvienne de moi. Il m’a oubliée quand même.' },
      { qui: 'tisseuse', texte: 'En dessous, c’est le fond. Le premier d’entre nous y attend. Lui sait encore qui il est. C’est bien ce qui fait peur.' },
      { qui: 'vela', texte: 'Elle s’est éteinte. Doucement. Je crois qu’elle était contente qu’on lui pose la question.' },
      { qui: 'doran', texte: 'Le fond. Ceux d’avant. On y est presque.' },
    ]),
  entree(10, 'Le fond',
    'La Strate −10 ne ressemble à aucune autre. Les salles sont nettes, les cristaux clairs, les portes mieux scellées que toutes les autres. Au centre, quelqu’un est assis. Il vous attendait.', [
      { qui: 'vela', texte: 'Une seule voix. Pas de mélange, pas de double. C’est le plus ancien de tous, et il sait exactement qui il est.' },
      { qui: 'doran', texte: 'En 2066, mon père a répondu à quelqu’un. Je crois que c’était à lui.' },
      { qui: 'ilka', texte: 'On est venus jusqu’ici pour des réponses. Allons lui en demander.' },
    ]),
  apresGardien(10, 'premier-porteur', 'Le premier registre',
    'Avant de tomber, le Premier Porteur pose la main sur une table gravée, comme pour vous la confier. Une phrase y court, plus ancienne que tout ce que vous avez vu.', [
      { qui: 'premier-porteur', texte: 'Que celui qui lit ceci compte les voix qu’il porte.' },
      { qui: 'vela', texte: '« Compte. » Le mot de la Confluence, tout en haut. Depuis le début, ils nous disaient la même chose.' },
      { qui: 'doran', texte: 'Ils étaient comme nous. Ils se sont gravé leurs morts pour ne rien oublier, et ils se sont perdus dedans.' },
      { qui: 'ilka', texte: 'Et nous, on a pris leurs empreintes pour des cadeaux. Il faut le dire à tout Vertiga. Mais quoi, exactement ? Ça, c’est à toi.' },
    ]),
  {
    id: 'epilogue', acte: 4, sur: 'ÉPILOGUE', titre: 'Ce que tu as choisi', image: { intro: '00-titre' },
    recit: 'Quelques semaines plus tard, au sommet de la Tour du Noyau. La mer est calme, et une île des Hauts glisse au loin.',
    quand: (c) => !!c.actes.fin,
    repliques: [
      { qui: 'yse', texte: 'Tu as refermé la porte, comme les ouvriers de 2066, comme ceux d’avant. Cette fois, au moins, tout le monde sait pourquoi.', si: fin('scellement') },
      { qui: 'yse', texte: 'Une paix fragile, encore une. Elle vaut mieux qu’une guerre solide. Je te l’avais écrit, je crois.', si: fin('pacte') },
      { qui: 'yse', texte: 'Tout le monde sait, maintenant. Ce que chacun en fera, je n’en sais rien. C’est ça, la liberté : on ne sait pas.', si: fin('archives') },
      { qui: 'vela', texte: 'Les voix se sont calmées. Pas toutes. Assez pour que j’entende la mienne.' },
      { qui: 'ilka', texte: 'Et maintenant ? Il reste des Berceaux, des pilleurs, et une île qui passe. Les Strates continuent.' },
      { qui: 'yse', texte: 'Regarde la mer, directeur. Elle n’a pas oublié de monter. Mais toi, tu as regardé. Je ferme mon cahier : la suite est à toi.' },
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
  1: { titre: 'La chambre s’est réveillée', enjeu: 'Quelque chose est né des empreintes mêlées de la chambre. Trouve-le, au fond de la Strate −1.', ensuite: 'La Confluence a fui vers le bas, et des pilleurs ont vidé la chambre. Perce la roche pour les suivre.' },
  2: { titre: 'Les couloirs murés', enjeu: 'Rattrape les pilleurs qui ont vidé la chambre, avant que la Confluence ne les trouve.', ensuite: 'Les Brigades de la capitaine Hald suivent la Confluence vers la Strate −3. Ne les laisse pas arriver seules.' },
  3: { titre: 'Dans le noir', enjeu: 'Abats la Confluence pour de bon, et retrouve les patrouilles de la capitaine Hald.', ensuite: 'La Confluence est tombée, et la chambre a trouvé sa garde. Sous les Fondations, les salles closes attendent.' },
  4: { titre: 'Fermées de l’intérieur', enjeu: 'Trouve ce que les ouvriers de 2066 ont muré, plus bas, au niveau 7.', ensuite: 'Le Gardien des registres a reculé derrière ses portes rondes. Il connaît le nom du père de Doran.' },
  5: { titre: 'Les Berceaux vides', enjeu: 'Suis le Gardien des registres jusqu’aux Berceaux que les Hauts n’ont pas encore vidés.', ensuite: 'Un inventaire signé « I. Orsève ». Plus qu’un étage avant le mur de 2066.' },
  6: { titre: 'Le niveau 7', enjeu: 'Franchis le mur de 2066 et fais tomber le Gardien des registres.', ensuite: 'Derrière le mur, des cristaux qui pleuraient, et une lettre des Hauts sur ton bureau. Plus bas, les mémoires se contredisent.' },
  7: { titre: 'Deux passerelles', enjeu: 'Trouve ce qui tisse les souvenirs, avant qu’il ne touche à ceux de l’escouade.', ensuite: 'La Tisseuse a fui vers le bas, et une équipe des Veilleurs n’est jamais remontée.' },
  8: { titre: 'Les Veilleurs perdus', enjeu: 'Ramène l’équipe des Veilleurs, prisonnière d’un souvenir heureux.', ensuite: 'Les Veilleurs sont sauvés. La Tisseuse s’est réfugiée là où personne n’est jamais allé.' },
  9: { titre: 'Là où personne n’est allé', enjeu: 'Retrouve la Tisseuse au fond de sa toile, et demande-lui son nom.', ensuite: 'Sous la Tisseuse, le fond. Le premier d’entre eux y attend.' },
  10: { titre: 'Le fond', enjeu: 'Affronte le Premier Porteur et lis son registre.', ensuite: 'Le premier registre a parlé. Il ne reste qu’à choisir ce que Vertiga en saura.' },
};

/** Le chapitre de la campagne en cours (null une fois la campagne finie, au-delà de la Strate −10) */
export function chapitreCampagne(c: ContexteCampagne): { sur: string; titre: string; texte: string } | null {
  const n = c.strate;
  const e = ENJEUX[n];
  if (!e || (n === 10 && c.actes.fin)) return null;
  const vaincue = c.vaincue >= n;
  return { sur: `${nomActe(acteDe(n))} · Strate −${n}`, titre: e.titre, texte: vaincue ? e.ensuite : e.enjeu };
}

// ---------- Les gardiens parlent en combat ----------

/** Ce que dit le gardien de chaque Strate : en entrant dans sa salle, puis au passage de sa seconde phase */
const GARDIENS: Record<number, { avant: string; phase: string }> = {
  1: { avant: 'Trop de voix… Laissez-nous descendre…', phase: 'Nous sommes plusieurs. Nous serons plus.' },
  2: { avant: 'Ils nous ont portées. Vous, vous nous retenez.', phase: 'Encore des voix. Encore !' },
  3: { avant: 'Compte… compte…', phase: 'Ne nous séparez pas !' },
  4: { avant: 'Appel des présents. Équipe de 2066 : absente.', phase: 'Registre ouvert. Que le témoin s’avance.' },
  5: { avant: 'Vous n’êtes pas sur la liste.', phase: 'Un serment perdu cherche une bouche. Brigadier, à la barre.' },
  6: { avant: 'Derrière moi, il n’y a personne. Repartez.', phase: 'Je garde ce qui pleure. Je le garderai.' },
  7: { avant: 'Oh. Des souvenirs neufs.', phase: 'Regardez donc ce qui vous attend.' },
  8: { avant: 'Ils sont heureux, ici. Pas vous ?', phase: 'Je tisse plus vite que vous ne cassez.' },
  9: { avant: 'Je suis fatiguée. Faites vite, ou laissez-moi.', phase: 'Tous mes fils, une dernière fois.' },
  10: { avant: 'Vous portez peu de voix. C’est bien. Combien, déjà ?', phase: 'Écoutez-les toutes, alors. Comme nous.' },
};
/** au-delà de −10, le Premier Porteur revient, sans plus rien à révéler */
const GARDIEN_FOND = { avant: 'Encore vous. Combien de voix, cette fois ?', phase: 'Ceux d’avant ne se battent jamais seuls.' };

export const repliqueGardien = (strate: number, moment: 'avant' | 'phase') => (GARDIENS[strate] ?? GARDIEN_FOND)[moment];

// ---------- Les Porteurs parlent pendant la descente ----------

/** Par zone (0 : les Fondations, 1 : les salles closes, 2 : les mémoires contradictoires, 3 : le fond) */
const PAROLES: Record<'entree' | 'gardien', Record<string, [string, string, string, string]>> = {
  entree: {
    ilka: ['Les piliers grincent. Tant qu’ils grincent, ils tiennent.', 'Des portes fermées de l’intérieur. J’aime pas les portes qu’on n’a pas le droit d’ouvrir.', 'Si je dis un truc bizarre, secouez-moi. Ici, on n’est jamais sûr que c’est son propre souvenir.', 'C’est trop propre, ici. Comme une maison où quelqu’un attend de la visite.'],
    doran: ['Je reconnais ces étais. C’est l’équipe de mon père qui les a posés.', 'Écoutez le silence. Les salles closes ne résonnent pas. On dirait qu’elles retiennent leur souffle.', 'Ma chitine me gratte. Elle sent des choses qui ont été vraies. Et d’autres non.', 'Mon père n’est jamais allé si bas. Il aurait aimé voir ça. Ou pas.'],
    vela: ['Les cristaux d’ici ont des voix d’ouvriers. Fatiguées, mais gentilles.', 'Derrière les portes, ça dort. Ne parlez pas trop fort.', 'Les murs ici essaient de me vendre des souvenirs. Je n’achète pas.', 'Il n’y a qu’une voix, ici. Je l’entends même quand je me bouche les oreilles.'],
    sasha: ['Des câbles de 2060, encore sous tension. Quel gâchis. Je les réparerais tous, si on avait le temps.', 'Des serrures sans vis ni ressort. Ceux qui ont fait ça savaient travailler.', 'Ces automates graveurs, j’aimerais en ouvrir un. Juste un. Pour voir.', 'Rien ne rouille, ici. Rien n’a jamais servi. C’est presque triste.'],
    nuit: ['Éteignez donc vos lampes. Vous verrez mieux.', 'Il y a des yeux derrière les portes. Ils ne nous veulent pas de mal. Ils nous regardent.', 'Même dans le noir, ici, il y a des choses qui brillent pour rien. Je n’aime pas ça.', 'Le noir du fond est différent. Il est vieux. Il a l’habitude qu’on le laisse tranquille.'],
    kessa: ['On m’a fait muer pour descendre ici. Au moins, ça sert.', 'Mes yeux d’enfant voient dans ces couloirs mieux que mes yeux d’adulte. C’est drôle, non ?', 'Mes souvenirs de mue reviennent, ici. Ceux que j’avais rangés.', 'Ceux d’avant ont choisi ce qu’ils voulaient devenir. Nous, on n’a rien choisi. Je ne sais pas qui est le plus à plaindre.'],
    aurel: ['Le béton des districts. Chez moi, on ne marche que sur du marbre. Ça glisse plus.', 'Ma famille connaît ces salles. Elle n’en parle jamais au dîner.', 'Mon ombre a l’air de connaître le chemin. Ça ne me rassure pas.', 'Si ma tante savait où je suis, elle ferait une syncope. C’est une bonne raison d’y être.'],
    liane: ['Je suis une Refusée, au cas où quelqu’un aurait un doute. Ici, ça ne compte pas.', 'Les Hauts ont pris ce qu’il y avait ici. Moi, je viens voir ce qu’ils ont laissé.', 'Mes implants captent des interférences. Comme si quelqu’un parlait sur toutes les fréquences à la fois.', 'Ma mère disait que le fond était un mythe. Elle disait ça de beaucoup de choses.'],
    joss: ['J’entends les gens du quartier, même d’ici. Ça me tient compagnie.', 'Il y a de la peur derrière ces portes. Pas la nôtre. Plus vieille.', 'Je sais reconnaître quelqu’un qui ment. Ici, ce sont les murs qui mentent.', 'Je n’ai jamais caché mon or ici. Personne n’est là pour le voir.'],
  },
  gardien: {
    ilka: ['Le gros morceau. On y va vite, on y va fort.', 'Je déteste les gardiens qui parlent. Celui-là parle.', 'Si elle nous montre encore un souvenir, je ferme les yeux et je frappe.', 'C’est lui. Pas de discours. On a fait tout ce chemin.'],
    doran: ['Tenez la ligne. Je prends les coups, vous prenez le reste.', 'Il garde quelque chose. Comme nous. Ça ne veut pas dire qu’il a raison.', 'Elle tient trop de fils. On en coupe un, puis un autre.', 'Mon père a fermé une porte pour ne pas le voir. Moi, je l’ouvre.'],
    vela: ['Elle a peur, elle aussi. Ne la laissez pas nous entraîner dedans.', 'Il récite. Il n’entend plus. Il faudra le faire taire.', 'Je ne regarde pas ses fils. Si je les regarde, je les suis.', 'Il sait qui il est. C’est pour ça qu’il est si fort.'],
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
