// Qui sont les Porteurs : un titre, quelques lignes et leur réplique, pour l'onglet Porteurs (22 octobre 2026).
// Ilka, Doran, Véla, Sasha, Nuit et Aurel suivent la Bible du lore (portraits et répliques).
// Les trois recrues n'ont pas de nom : leur texte reste court, à étoffer par Bryan.

interface PresentationPorteur {
  /** ce qu'il est, en quelques mots */
  titre: string;
  /** deux ou trois phrases */
  texte: string;
  replique?: string;
  /** pourquoi il fait partie de l'escouade (l'escouade de départ : ce qui l'a amené devant la porte) */
  pourquoi?: string;
  /** un encadré à part quand sa lignée appelle une explication (Véla : une Résonante qui n'est pas des Hauts) */
  aParte?: { titre: string; texte: string };
}

/**
 * Son histoire (23 octobre 2026, Bible « D'où viennent leurs dons ») : d'où vient son don, racontée en trois paliers.
 * Chaque palier s'ouvre quand le Porteur atteint son niveau : on apprend à le connaître en descendant avec lui.
 */
interface PalierOrigine { niveau: number; titre: string; texte: string }

export const ORIGINES: Record<string, PalierOrigine[]> = {
  ilka: [
    { niveau: 1, titre: 'La passerelle', texte: 'Ilka avait quatorze ans quand la passerelle des Hauts-Ponts a cédé sous elle. La rouille la rongeait depuis des années ; une fissure avait été signalée trois fois. Le Présage n’avait rien dit, puisque rien de soudain ne s’annonçait. Elle est tombée entre deux piliers, les jambes prises sous la passerelle, l’eau jusqu’au menton.' },
    { niveau: 4, titre: 'Celui qui a plongé', texte: 'Un ouvrier des Fondations a plongé sans hésiter : un Géné aux poumons d’amphibien, qui tient sous l’eau bien plus longtemps qu’un humain. Il lui a tenu la tête hors de l’eau pendant deux heures, jusqu’à ce qu’on relance les pompes. C’était Doran. Elle ne l’en a jamais remercié à voix haute. Elle lui garde la meilleure part de chaque marché.' },
    { niveau: 8, titre: 'Le goût de la pièce', texte: 'La Clinique n’a pas pu sauver ses jambes. Ilka a signé un prêt-de-vie avec la compagnie de transport : quinze ans de courses contre des jambes neuves. Leur cœur de cristal porte le geste d’une coursière des années 2070 qu’elle n’a jamais connue. Depuis, elle ne sait plus marcher lentement et parle aussi vite qu’elle court. « Je ne sais pas si c’est moi qui suis pressée, ou elle. » Ses cheveux ont blanchi en un an.' },
    { niveau: 12, titre: 'Pim', texte: 'Si Ilka meurt avant la fin du contrat, la clause de survivance fait passer la dette à son petit frère, Pim, douze ans. C’est pour lui qu’elle accepte toutes les courses, même celles qu’on ne devrait pas accepter. Même un colis qui contenait un cristal volé.' },
  ],
  doran: [
    { niveau: 1, titre: 'La porte murée', texte: 'Doran est né en 2069 dans une famille des chantiers d’abris. Son père a aidé à murer les accès sous le district en 2066, après « l’accident ». Il n’en a jamais dit qu’une phrase, répétée jusqu’à sa mort : « On a fermé la porte, mais pas de notre côté. »' },
    { niveau: 4, titre: 'La Mue sur contrat', texte: 'À vingt-cinq ans, Doran a signé un contrat de mue avec la Compagnie des Fondations : des poumons d’amphibien et de la chitine, contre quinze ans de service sous l’eau. Six mois dans une maison de mue des bas-fonds, à manger pour trois. Son corps a été dessiné pour le poste, pas pour lui. Il a fini son contrat en 2109.' },
    { niveau: 8, titre: 'Quarante jours dans l’eau', texte: 'Pendant la Grève des pompes de 2099, les Génés sont restés quarante jours dans l’eau des Fondations, là où personne d’autre ne pouvait tenir. Doran était de ceux-là. C’est de là que vient l’expression « têtus comme une marée ». Il n’en parle que si on lui sert à boire, et jamais pour s’en vanter.' },
    { niveau: 12, titre: 'Ses épaules', texte: 'Doran n’a pas d’enfant. « Je ne voulais pas qu’ils naissent avec mes épaules. » Un enfant sur dix des Génés de sa génération est né avec un trait de la Mue de ses parents. Il a vu ce que les Hauts voulaient faire de ces enfants-là : un registre.' },
  ],
  vela: [
    { niveau: 1, titre: 'La pierre orpheline', texte: 'À dix-neuf ans, apprentie fouilleuse, Véla a assisté à la mort d’un vieux Muet des bas-fonds, sans famille. Sa pierre, deuxième copie d’un dragon serpentin, n’intéressait pas les Hauts : une copie de district, pour eux, ça ne vaut rien.' },
    { niveau: 4, titre: 'L’Accord ouvert', texte: 'La Clinique a organisé un Accord ouvert : tout volontaire pouvait tenter la nuit avec la pierre contre la nuque. Soixante jeunes se sont présentés. Sa mère le lui avait interdit ; elle y est allée quand même. Au matin, la pierre était tiède contre sa peau, et contre la sienne seulement.' },
    { niveau: 8, titre: 'La lanterne', texte: 'Depuis la Nuit blanche, Véla n’a plus jamais eu peur du vide : elle travaille sur les câbles sans harnais. Elle porte toujours une lanterne. Son ombre de dragon ne se voit bien qu’à la lumière d’une flamme, et chaque soir, elle vérifie qu’elle est toujours la même.' },
    { niveau: 12, titre: 'Ce qu’elle doit', texte: 'Véla doit sa pierre au district, pas aux Hauts. Elle l’a promis à la Clinique : rendre ce qu’on lui a donné. Elle lit gratuitement pour les fouilleurs qui ne peuvent pas payer. C’est pour cela qu’une Résonante s’est mise au service d’un directeur de district.' },
  ],
  sasha: [
    { niveau: 1, titre: 'L’atelier de presses', texte: 'À seize ans, apprenti dans un atelier de presses, Sasha a perdu le bras droit dans un accident de machine.' },
    { niveau: 4, titre: 'Le bras dessiné', texte: 'Sur son lit de Clinique, il a dessiné son propre bras au dos des feuilles de soin. Odile la Brocante a vu les dessins et l’a fabriqué avec lui, en pièces de récupération, sans abonnement. C’est le premier bras « libre » du district.' },
    { niveau: 8, titre: 'La minute grise', texte: 'Sasha n’a jamais payé de mise à jour de sa vie. Son bras ne s’arrête pas pendant la minute grise, quand les implants loués du district se figent tous ensemble : chaque mardi à quatre heures, il est l’homme le plus demandé du quartier.' },
  ],
  nuit: [
    { niveau: 1, titre: 'La dernière promotion', texte: 'Nuit est née en 2101 dans une famille de fouilleurs. Ses parents ont accepté sa Mue à trois ans, dans la toute dernière promotion de Chouettes, parce que le programme nourrissait la famille.' },
    { niveau: 4, titre: 'Les Chouettes', texte: 'En 2104, une équipe de Chouettes a guidé une vingtaine d’adultes hors d’une galerie effondrée, trois jours dans le noir complet. Tout le monde est remonté vivant. Les écrans des marchés ont montré ces enfants aux yeux d’or, et l’année suivante, la Mue des enfants était interdite.' },
    { niveau: 8, titre: 'Trop clair', texte: 'Nuit a grandi entre les adultes qui regrettaient le programme et ceux qui en avaient honte. Elle ne reproche rien à ses parents. Mais elle n’a jamais mis les pieds dans les Hauts, « où il fait trop clair ».' },
  ],
  aurel: [
    { niveau: 1, titre: 'La Remise', texte: 'Chez les Orsève, la greffe d’un héritier s’appelle la Remise. Le jour de ses seize ans, on lui greffe l’empreinte relevée d’un aïeul, et l’on grave son nom sous celui du porteur précédent, sur l’écrin du cristal. Aurel a reçu celle de son arrière-grand-mère : la copie d’un être ailé, déjà portée trois fois.' },
    { niveau: 4, titre: 'Liane', texte: 'Sa cousine Liane avait tenté l’Accord avant lui. La pierre était morte dans la nuit. Liane a été envoyée « étudier ailleurs », et son nom ne figure plus dans aucun registre. Aurel avait dix ans. Il ne l’a jamais revue.' },
    { niveau: 8, titre: 'La signature', texte: 'Après la Remise, Aurel a cessé d’aimer la musique qu’il adorait, et s’est mis à classer les gens par utilité. À vingt ans, il a découvert qu’il avait fait renvoyer son ami d’enfance, un serviteur de la Maison, sans rien ressentir en signant. Il s’est enfui la semaine suivante.' },
  ],
  liane: [
    { niveau: 1, titre: 'Une pierre morte', texte: 'Liane Orsève avait seize ans quand elle a tenté l’Accord, l’âge permis par les Accords. Le matin, la pierre de la famille était ternie pour toujours. On l’a envoyée « étudier ailleurs », dans un district, avec une valise et une rente. Son nom a été effacé des registres de la Maison.' },
    { niveau: 4, titre: 'Ce qui remplace l’or', texte: 'Dans le district, une Refusée des Hauts n’est ni d’ici ni de là-haut. Liane a choisi les implants, un par un, comme on gagne des galons. Sa tête est presque blanche : on la compte parmi les Délavés. « Ils m’ont refusé la mèche d’or. J’ai fait pousser autre chose. »' },
    { niveau: 8, titre: 'Les Refusés', texte: 'Liane a retrouvé d’autres Refusés des Hauts, cachés dans les districts. Plusieurs sont devenus directeurs, sans le dire. Elle tient leur liste de mémoire, et ne l’écrit nulle part.' },
  ],
  kessa: [
    { niveau: 1, titre: 'Née de la Mue', texte: 'Kessa est née en 2097 avec une plaque de chitine à l’épaule et des yeux qui renvoient la lumière la nuit. Ses parents avaient mué tous les deux, en 2090, avec des sèves qui fixaient mal. On l’appelle une Née-de-mue.' },
    { niveau: 4, titre: 'Le registre', texte: 'Quand Kessa avait douze ans, les Brigades sont passées dans son école pour recenser les Nés-de-mue. Sa mère l’a cachée trois jours chez un teinturier de mèches. Le district n’a jamais rendu sa liste.' },
    { niveau: 8, titre: 'Une génération', texte: 'Les sèves modernes ne laissent plus rien passer : il n’y aura pas d’autres Nés-de-mue. Kessa le vit comme une singularité à protéger. « On n’a rien choisi. Mais on est les seuls à pouvoir dire ce que ça fait. »' },
  ],
  joss: [
    { niveau: 1, titre: 'Le teinturier', texte: 'Joss était apprenti teinturier de mèches : toutes les trois semaines, les Résonants du quartier venaient chez lui faire teindre l’or qui repousse. Il connaissait leurs noms, leurs secrets et l’heure de leur rendez-vous.' },
    { niveau: 4, titre: 'L’Accord ouvert', texte: 'Quand la Clinique a annoncé un Accord ouvert, Joss s’est présenté par curiosité, avec quarante autres. La pierre venait d’une Résonante du quartier qui l’avait laissée au district par testament. Elle a pris sur lui. Le lendemain, il a éclaté de rire en voyant sa première mèche d’or : pour une fois, il ne la teindrait pas.' },
    { niveau: 8, titre: 'La Nuit blanche', texte: 'Pendant ses trois nuits sans sommeil, le district entier est venu lui parler de son enfance, à tour de rôle, comme le veut la tradition. Il dit qu’il ne s’est jamais senti aussi entouré. Il dit aussi qu’il rêve maintenant d’un escalier qui monte sans fin.' },
  ],
  coursier: [
    { niveau: 1, titre: 'Un pas de trop', texte: 'Ses jambes ont un geste gravé d’occasion, celui d’un donneur pressé. Il le sent : il commence toujours à courir une seconde avant d’avoir décidé où aller.' },
  ],
  docker: [
    { niveau: 1, titre: 'Les quais', texte: 'Il a mué à trente ans pour décharger les barges des quais. Sa souche de chitine est de celles qu’on donnait aux dockers par lots entiers, sans demander leur avis.' },
  ],
  guetteur: [
    { niveau: 1, titre: 'Une brisure', texte: 'Sa mèche est à peine dorée : il porte une brisure, un morceau de cristal cassé acheté au marché. Un doré pâle. Elle ne lui donne qu’un peu du Présage, mais il l’écoute toujours.' },
  ],
};
/** Les paliers de son histoire, ouverts ou non selon son niveau */
export const origineDe = (id: string, niveau: number) => (ORIGINES[id] ?? []).map((p) => ({ ...p, ouvert: niveau >= p.niveau }));

export const PRESENTATIONS: Record<string, PresentationPorteur> = {
  ilka: {
    titre: 'Coursière des Hauts-Ponts',
    texte: 'Vingt-quatre ans, la plus rapide coursière du district, et la plus bavarde. Ses jambes mécaniques lui ont été posées en prêt-de-vie après une chute, à quatorze ans : chaque course rembourse un peu sa dette à la compagnie de transport. Elle connaît tous les raccourcis entre les tours.',
    replique: 'Je livre tout, partout, sauf les mauvaises nouvelles. Celles-là, je les fais traîner.',
    pourquoi: 'Le matin de l’ouverture, ce sont les ouvriers qui l’ont envoyée chercher le nouveau directeur : quand ça presse, c’est toujours Ilka qu’on envoie. Elle aurait pu repartir. Elle est restée, parce qu’elle connaît tous les raccourcis entre les tours et qu’une course pareille ne se refuse pas. Ses jambes d’Augmentée la portent là où les autres n’osent pas sauter.',
  },
  doran: {
    titre: 'Géné des égouts',
    texte: 'La cinquantaine, ancien ouvrier des Fondations, modifié pour respirer dans l’humidité et encaisser les chocs. Bourru, lent à parler et rapide à rendre service. Il connaît les accès murés sous le district.',
    replique: 'Sous la ville, on ne se perd pas. On se fait oublier.',
    pourquoi: 'Son père travaillait dans le puits de chantier des années 2060, sous la Tour, avant qu’on le mure après « un accident » dont personne ne parle. Doran est le dernier à savoir où passent ces couloirs. Et son corps de Géné, fait pour l’humidité et les chocs, tient là où un humain ne tiendrait pas.',
  },
  vela: {
    titre: 'Liseuse d’empreintes',
    texte: 'La quarantaine, Résonante des districts : elle lit les empreintes pour les fouilleurs et les Cliniques. Son empreinte ancienne est celle d’un dragon serpentin. Calme, bienveillante, et de plus en plus inquiète.',
    replique: 'Une empreinte ne ment jamais. C’est nous qui la lisons mal.',
    pourquoi: 'Depuis que la chambre est ouverte, Véla ressent des peurs qui ne sont pas les siennes. Personne ne l’a appelée : elle est venue d’elle-même, parce qu’elle est la seule du district à savoir lire une empreinte, et qu’elle veut comprendre ce qui a peur là-dessous avant que quelqu’un d’autre ne s’en serve.',
    aParte: {
      titre: 'Une Résonante des districts',
      texte: 'Les Résonants qu’on voit sur les écrans vivent dans les Hauts et gouvernent Vertiga. Mais les empreintes anciennes ne sont pas toutes restées là-haut, et ceux qui les portent dans les districts vivent comme leurs voisins : ils ont plus en commun avec eux qu’avec les Hauts. Beaucoup teignent leur mèche d’or pour qu’on les laisse tranquilles. Véla ne la cache plus. Le district la connaît depuis vingt ans : c’est elle qu’on va chercher quand un fouilleur remonte un cristal, ou quand la Clinique ne comprend pas ce qui arrive à un malade.',
    },
  },
  sasha: {
    titre: 'Réparateur des Reprises',
    texte: 'Trente-cinq ans, mécanicien de génie du Réseau des Reprises. Il débride les implants de tout le quartier, dans un atelier où rien n’est rangé et où tout est à sa place.',
    replique: 'Si ça a une vis, ça a une seconde chance.',
  },
  nuit: {
    titre: 'Éclaireuse génée',
    texte: 'Vingt ans, modifiée dès l’enfance pour les fouilles de nuit : elle voit dans le noir comme en plein jour et déteste les lumières fortes. Elle parle peu, observe tout, et travaille pour les Veilleurs de Sédime.',
    replique: 'Le noir n’est pas vide. Il attend juste qu’on regarde mieux.',
  },
  aurel: {
    titre: 'L’héritier en fuite',
    texte: 'Vingt-deux ans, jeune héritier de la Maison Orsève. Il teint sa mèche d’or et vit incognito dans le district, persuadé que son empreinte le rend plus dur qu’il ne veut l’être. Sa famille le cherche.',
    replique: 'Mon ombre a de meilleures manières que moi. C’est bien ça, le problème.',
  },
  liane: {
    titre: 'La Refusée des Hauts',
    texte: 'Vingt-huit ans, cousine d’Aurel, effacée des registres de la Maison Orsève le jour où sa pierre est morte. La mèche d’or ne lui est jamais venue ; elle a choisi des implants, un par un : sa tête est presque blanche. Elle connaît les Hauts de l’intérieur, et les districts mieux que les Hauts.',
    replique: 'Ils m’ont refusé la mèche d’or. J’ai fait pousser autre chose.',
  },
  kessa: {
    titre: 'Née-de-mue',
    texte: 'Vingt-quatre ans, née avec une plaque de chitine à l’épaule et des yeux qui brillent la nuit, héritage de la Mue de ses parents. Plongeuse aux pompes, porte-parole discrète des Nés-de-mue du district.',
    replique: 'On n’a rien choisi. Mais on est les seuls à pouvoir dire ce que ça fait.',
  },
  joss: {
    titre: 'Le Résonant de l’Accord ouvert',
    texte: 'Dix-neuf ans, ancien apprenti teinturier de mèches. La Clinique du district lui a donné sa pierre lors d’un Accord ouvert, et le quartier entier a veillé sa Nuit blanche. Il porte sa mèche d’or sans la teindre, et il en est fier.',
    replique: 'J’ai passé des années à cacher l’or des autres. Le mien, je le laisse briller.',
  },
  coursier: {
    titre: 'Recrue augmentée',
    texte: 'Un coursier du district, venu après l’ouverture de la chambre. Il court devant l’escouade et revient toujours avec des nouvelles.',
  },
  docker: {
    titre: 'Recrue génée',
    texte: 'Un ancien docker des quais de Vertiga. Il porte ce que les autres laissent, et ne lâche jamais une prise.',
  },
  guetteur: {
    titre: 'Recrue résonante',
    texte: 'Un guetteur des passerelles. Il sent venir les ennuis avant tout le monde, et le dit rarement.',
  },
};
