// Les Chroniques : l'histoire du monde racontée comme un récit, rangée dans la Bibliothèque du district.
// Ce n'est pas un manuel : c'est une longue lettre d'Ysé, archiviste des Veilleurs de Sédime, née en 2049,
// au nouveau directeur. Le début vient des récits de sa grand-mère Nell ; la suite, elle l'a vécue.
// Les chapitres déjà racontés par l'intro sont ouverts dès le départ ; les plus profonds s'ouvrent en descendant.
// Aucun pays, aucune personne et aucun conflit réel n'est nommé.

import { t } from './i18n';

export interface Chapitre {
  id: string;
  livre: 1 | 2 | 3 | 4 | 5;
  titre: string;
  epoque: string;
  /** illustration de l'intro réutilisée en tête de chapitre (public/intro/<id>.webp) */
  image?: string;
  /** Strate qu'il faut avoir ouverte pour lire ce chapitre ; absent = ouvert dès le départ */
  strate?: number;
  /** chantiers de l'Exode qu'il faut avoir finis pour lire ce chapitre (Livre V, 13 novembre 2026) */
  exode?: number;
  /** une ligne visible tant que le chapitre est fermé */
  teaser?: string;
  paragraphes: string[];
  /** des papiers d'époque recopiés par Ysé à la fin du chapitre */
  documents?: { titre: string; support: string; lignes: string[] }[];
}

export const LIVRES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: t('Livre I · Ce que nous savions'),
  2: t('Livre II · Ce que nous avons trouvé'),
  3: t('Livre III · Ce qui dort en dessous'),
  4: t('Livre IV · Ce qui tient'),
  5: t('Livre V · Ceux qui partent'),
};

export const CHAPITRES: Chapitre[] = [
  {
    id: 'lettre', livre: 1, titre: t('À l’intention du directeur'), epoque: '2121', image: 'chap-lettre',
    paragraphes: [
      t('On m’a demandé de t’écrire. Pas les Veilleurs : eux voulaient un rapport, avec des cotes, des dates et des tampons. C’est ton district qui me l’a demandé, à sa façon. La femme qui vend des algues au pied de la Tour du Noyau m’a arrêtée hier soir : « Le nouveau ne sait rien. Racontez-lui. » Alors je raconte.'),
      t('Je m’appelle Ysé. J’ai soixante-douze ans, des genoux de pilier fendu et la manie de tout noter. Je suis archiviste chez les Veilleurs de Sédime, ce qui veut dire que je passe mes journées à recoller ce que les autres ont jeté. Je n’ai pas de greffe. On me le reproche souvent, dans un sens ou dans l’autre.'),
      t('Ce que tu vas lire n’est pas l’histoire officielle. L’histoire officielle tient sur une plaque de bronze, dans les Hauts, et elle est très belle. Celle-ci est plus longue, plus sale, et je crois qu’elle est plus vraie. Je l’ai faite avec ce qu’il me restait : les récits de ma grand-mère, les miens, et les papiers que les Strates nous rendent, morceau par morceau. Tu en trouveras certains dans tes Archives, à côté de ces pages ; d’autres se sont perdus dans les abris, et tu les retrouveras en descendant. Lis-les aussi. Ils parlent mieux que moi.'),
      t('Certains chapitres, je ne les écrirai qu’à ton retour. Ce n’est pas de la coquetterie. Il y a des choses que je ne dirai qu’à quelqu’un qui est descendu assez bas pour les voir de ses propres yeux. Sinon, tu ne me croirais pas, et tu aurais raison.'),
      t('Une dernière chose avant de commencer. Tout ce qui nous est arrivé tient en une phrase, et j’aimerais que tu la gardes en tête jusqu’au bout : nous nous sommes disputé ce que nous avions sous la main, et nous avons oublié ce qui montait. Nous l’avons fait une fois. Je crois que nous sommes en train de recommencer.'),
      t('Ysé, à la Tour du Noyau, le matin de ta première descente.'),
    ],
  },
  {
    id: 'ligne-bleue', livre: 1, titre: t('La ligne bleue'), epoque: t('Les années 2000 à 2019'), image: '01-on-savait',
    paragraphes: [
      t('Ma grand-mère s’appelait Nell. Elle avait dix ans quand le monde a appris qu’il se réchauffait. Ou plutôt quand le monde a décidé de l’entendre, parce que les savants le disaient depuis longtemps. Elle racontait ça comme on raconte une rencontre : un documentaire, un soir, dans une salle de classe. Des glaciers photographiés à trente ans d’écart, qui avaient reculé comme une marée qui ne reviendrait pas. Une voix calme, devant des courbes qui montaient.'),
      t('« On est sortis de là bouleversés, disait-elle. Le lendemain, on éteignait les lumières en quittant les pièces. » Et elle riait, parce que c’était vrai, et parce que c’était tout.'),
      t('Il faut que tu comprennes une chose : ils savaient. Pas vaguement. Ils avaient des chiffres, des cartes, des modèles qui se trompaient surtout en étant trop prudents. Ils savaient quelles côtes partiraient les premières, et à peu près quand. Il y avait des rapports si épais qu’il fallait deux mains pour les porter, et des résumés pour ceux qui n’avaient qu’une main de libre.'),
      t('Et ils ne restaient pas les bras croisés. C’est ce que les gens des Hauts oublient quand ils parlent de « l’aveuglement des anciens ». Nell a marché. Des millions de jeunes ont marché, jour après jour, avec des pancartes peintes à la main : des terres en feu, des abeilles, des thermomètres. Il y a eu des sommets, des signatures, des promesses avec des dates rondes. On se serrait la main devant des rangées de drapeaux.'),
      t('Les étés devenaient plus chauds. Chaque année, on battait un record, et chaque année, on s’en étonnait. Nell avait une expression pour ça : « On mettait le monde en sourdine. » On montait le son des alertes, puis on baissait celui des conséquences.'),
      t('Un jour, tu trouveras dans tes Archives une photo de famille devant une maison, avec une ligne bleue peinte sur le mur, là où l’eau s’était arrêtée la première fois. Ce n’est pas la mienne. Mais chaque famille de ce temps-là a eu sa ligne bleue, tôt ou tard. Au début, c’était une plaisanterie. On la montrait aux invités.'),
    ],
  },
  {
    id: 'infos', livre: 1, titre: t('Les infos du soir'), epoque: '2020 – 2025', image: '02-ailleurs',
    paragraphes: [
      t('Puis il s’est passé quelque chose que personne n’a décidé. Le climat n’a pas disparu des conversations : il a glissé. Du début du journal vers la fin. De la première page vers la dernière. Vingt secondes entre la météo et le sport, l’image d’un champ fendu par la sécheresse, et l’on passait à autre chose.'),
      t('Ce n’était pas de l’indifférence. Nell a toujours refusé ce mot. C’était de la fatigue, et de la peur. D’autres peurs, plus proches. Les prix montaient : le pain, le chauffage, le loyer. Quand on compte ses pièces le vingt du mois, la fonte d’un glacier qu’on ne verra jamais pèse moins lourd que la facture posée sur la table.'),
      t('Alors la colère a cherché des visages. Aux deux extrêmes, chacun a trouvé les siens, et chaque camp criait d’autant plus fort que l’autre criait aussi. Les écrans s’en nourrissaient. Ceux du milieu baissaient la tête, ou choisissaient un bord pour ne plus rester seuls. Nell disait qu’on ne discutait plus : on se répondait.'),
      t('Des guerres sont revenues. Pas une : plusieurs, ici et là. Je ne les nommerai pas. Ceux qui les ont faites ne sont plus là pour s’en expliquer, et leurs noms n’ont plus d’importance. Ce qui compte, c’est ce qu’elles ont coûté en attention. Une guerre, ça remplit tout l’écran. Une sécheresse, ça tient dans un coin.'),
      t('Je ne te raconte pas ça pour juger. Si j’avais eu vingt ans en ce temps-là, j’aurais sans doute regardé ailleurs, moi aussi. C’est bien ce qui m’effraie. Tout le monde avait de bonnes raisons. Et pendant que tout le monde avait de bonnes raisons, sous les glaces, l’eau trouvait son chemin.'),
    ],
  },
  {
    id: 'caves', livre: 1, titre: t('L’année des caves'), epoque: '2030', image: 'chap-caves',
    paragraphes: [
      t('Ma mère est née en 2030. Les années qui ont suivi sa naissance sont celles où tout aurait encore pu tourner autrement, et Nell me les a racontées plus souvent que toutes les autres.'),
      t('Nell avait trente ans. Elle vivait dans une ville côtière, dans une maison qui avait déjà sa ligne bleue peinte sur le mur, et elle était enceinte d’un enfant qu’elle n’avait pas prévu et qu’elle attendait déjà comme une fête. Cet été-là, trois vagues de chaleur se sont suivies sans laisser respirer personne. Quarante degrés le jour, trente-cinq la nuit. Les hôpitaux ouvraient des « salles fraîcheur » où l’on venait dormir sur des lits de camp, comme pendant une inondation. Les fleuves étaient si bas que les centrales devaient ralentir, faute d’eau pour se refroidir.'),
      t('Il faut que je te parle des machines de ce temps-là, parce que personne ne s’en souvient plus. On les appelait les IA. Elles répondaient. On leur posait une question, à voix haute ou sur un écran, et elles répondaient comme quelqu’un de très savant et de très poli. Elles écrivaient les lettres, corrigeaient les devoirs, conduisaient des camions, aidaient les médecins à lire les radios. Nell disait qu’en deux ou trois ans, elles étaient passées de la curiosité au robinet : on ne remarquait plus qu’elles étaient là, seulement quand elles ne l’étaient pas.'),
      t('Elles vivaient dans des bâtiments immenses et sans fenêtres, qu’on appelait des centres de données. Ces bâtiments avaient soif. Ils buvaient l’eau des fleuves pour se refroidir et l’électricité de villes entières. Cet été-là, quand le réseau n’a plus suffi, on a coupé le courant des quartiers. Pas celui des centres. Nell a vu s’éteindre sa rue un soir de quarante degrés, pendant qu’au loin, sur la colline, le grand bâtiment gris restait éclairé comme un paquebot. Elle n’en voulait pas aux machines. Elle en voulait à ceux qui avaient choisi.'),
      t('Alors les gens sont descendus. Dans les caves, dans les parkings souterrains, dans les couloirs du métro qu’on laissait ouverts la nuit. On y apportait des matelas, des glacières, des cartes à jouer. Nell a passé dix nuits au troisième sous-sol d’un parking, avec son gros ventre et une voisine qui ronflait. Elle disait que c’étaient les nuits les plus douces de l’été. Il faisait vingt-deux degrés, et des inconnus se prêtaient leurs ventilateurs.'),
      t('Ma mère est née le 9 août, pendant une coupure. La sage-femme a travaillé à la lumière de six téléphones tenus à bout de bras par des gens qu’elle ne connaissait pas. Tu vois où je veux en venir, je pense. C’est la première fois que je trouve, dans notre histoire, des gens qui descendent sous terre pour survivre à ce qui se passe en haut. Quarante ans avant Vertiga. Nous n’avons pas inventé les abris sous la ville. Nous nous en sommes souvenus sans le savoir.'),
    ],
    documents: [
      {
        titre: t('Alerte'), support: t('Une capture d’écran de téléphone, imprimée et pliée en quatre'),
        lignes: [
          t('ALERTE CANICULE · NIVEAU ROUGE · Délestage électrique programmé de 18 h à 23 h dans votre secteur.'),
          t('Les services prioritaires (hôpitaux, centres de données, réseaux) ne sont pas concernés.'),
          t('Rejoignez un lieu frais : la liste des parkings ouverts la nuit est disponible auprès de votre assistant.'),
        ],
      },
      {
        titre: t('Troisième sous-sol'), support: t('Un mot laissé sur un pare-brise, place 214'),
        lignes: [
          t('Merci pour le ventilateur. Je vous le rends demain, promis, ou après-demain s’il fait encore chaud.'),
          t('Le bébé bouge beaucoup la nuit. Je crois qu’il aime le parking.'),
          t('Nell, place 216 (le matelas bleu).'),
        ],
      },
    ],
  },
  {
    id: 'detroit', livre: 1, titre: t('Le détroit'), epoque: '2031', image: 'chap-detroit',
    paragraphes: [
      t('Au printemps de 2031, des navires ont cessé d’arriver. Il n’y a pas eu de grande bataille, pas d’image qui reste. Quelque part, un passage de mer étroit, par où transitait une bonne part de tout ce que le monde s’achetait, a été bloqué. Des mines, des menaces, des assurances qui refusaient de couvrir les cargos. Les navires attendaient au large, par centaines, comme des voitures devant un pont fermé.'),
      t('En deux mois, on a manqué de tout ce qu’on ne savait pas fabriquer près de chez soi. Des pièces, des engrais, des médicaments. La pharmacie de Nell affichait chaque matin une liste de ce qu’elle n’avait plus. Le lait pour bébé a disparu des rayons trois semaines. Nell a appris à faire la queue avec une poussette, et à reconnaître les autres mères à la façon dont elles comptaient leurs pièces.'),
      t('Les IA, pendant ce temps, devenaient plus puissantes chaque saison. C’est le paradoxe que Nell ne s’expliquait pas : rien n’arrivait plus dans les ports, mais les machines, elles, grandissaient. Elles décidaient quels camions partaient, quels rayons on remplissait, quels quartiers on délestait en premier. Les gouvernements les consultaient avant de parler. Ceux qui possédaient les plus grandes devenaient plus riches que des pays. Et beaucoup de gens perdaient leur travail de bureau, remplacés par une machine qui faisait la même chose plus vite et ne demandait pas de congé.'),
      t('Il y a eu des élections, cette année-là. Plusieurs, un peu partout. Les candidats parlaient des prix, des frontières, des machines qui volaient les emplois. Le climat avait disparu des discours. Une amie de Nell, qui travaillait pour un parti, lui a expliqué un soir pourquoi : « Ça fait perdre. Les gens ont peur pour le mois prochain, pas pour dans trente ans. » Elle n’était pas cynique. Elle était fatiguée.'),
      t('Et puis, discrètement, des gouvernements ont fermé des instituts de mesure, « pour faire des économies ». Des stations qui relevaient la température de l’eau, la hauteur de la mer ou l’épaisseur de la glace depuis cent ans. Nell avait un ami d’enfance, Ruben, qui passait ses journées sur une bouée de mesure au large de la ville. On l’a remercié en mai. Il a gardé la dernière page de son registre. Je te l’ai recopiée à la fin de ce chapitre.'),
      t('Retiens ça, directeur, parce que tu en verras l’écho jusqu’à nous. Un quart de siècle plus tard, le matin de l’eau chaude, le chef de mission a dit « peu probable » à voix haute. Il n’était ni sot ni menteur. Il calculait avec ce qu’il avait. Et ce qu’il avait s’arrêtait en 2031, parce qu’on avait décidé de ne plus regarder.'),
    ],
    documents: [
      {
        titre: t('Suite du programme suspendue'), support: t('La dernière page d’un registre de mesures, au large'),
        lignes: [
          t('Bouée 7. Température de l’eau à deux mètres : record de la série pour un mois de mai, battu de 1,4 degré.'),
          t('Hauteur moyenne de la mer : en hausse, comme chaque mois depuis le début du registre.'),
          t('Tampon rouge, en travers de la page : « Suite du programme suspendue ». En dessous, à la main : « Qui va la regarder, maintenant ? » R.'),
        ],
      },
      {
        titre: t('Liste du jour'), support: t('Une affichette de pharmacie, jaunie'),
        lignes: [
          t('NOUS N’AVONS PLUS : antibiotiques pour enfants, insuline (marques 2 et 3), lait infantile premier âge, pansements stériles.'),
          t('Prochaine livraison : inconnue. Merci de ne pas insulter le personnel.'),
          t('Quelqu’un a écrit dessous, au feutre : « Merci à vous. Tenez bon. »'),
        ],
      },
    ],
  },
  {
    id: 'pieds-mouilles', livre: 1, titre: t('Les pieds mouillés'), epoque: '2032', image: 'chap-pieds-mouilles',
    paragraphes: [
      t('Dans ton district, quand quelqu’un a tout perdu, on dit qu’il « a les pieds mouillés ». Les jeunes croient que ça vient des Fondations, des inondations des bas-fonds. Ça vient de 2032, et de la maison de Nell.'),
      t('Les assureurs avaient commencé à se retirer des côtes deux ans plus tôt. Une lettre polie, un paragraphe, et votre maison n’était plus assurée contre l’eau. Sans assurance, plus de prêt ; sans prêt, plus d’acheteur. En un an, les maisons du bord de mer ont perdu la moitié de leur valeur, puis presque tout. Ceux qui les avaient achetées à crédit devaient encore payer une maison que plus personne ne voulait, et que la mer allait prendre. Nell disait : « Nous étions propriétaires d’une dette avec vue sur l’eau. »'),
      t('Et les banques avaient prêté sur des millions de maisons comme celle-là. Au printemps 2032, elles se sont mises à tomber. On a appelé ça la crise des pieds mouillés, et ce nom-là est le seul qui nous soit resté. Cette même année, la sécheresse d’un côté du monde et les pluies diluviennes de l’autre ont fait rater les récoltes de deux grands greniers en même temps. Le pain a doublé. Des pays ont interdit d’exporter leur blé. Les routes ont commencé à se remplir.'),
      t('Il y a eu aussi l’histoire de la vidéo. En juin, une vidéo a fait le tour des écrans en une heure : un barrage qui cédait, une ville engloutie, des gens sur les toits. Elle était parfaite. Elle était fausse. Une IA l’avait fabriquée pour quelqu’un, et personne n’a jamais su pour qui. Il y a eu une panique, des routes bouchées, des blessés. Huit jours plus tard, une vraie tempête a noyé une vraie ville basse. Une partie des habitants n’a pas voulu partir. Ils avaient appris, la semaine d’avant, qu’on ne croit pas les images.'),
      t('C’est aussi l’année où la guerre a trouvé sa nouvelle cible. Au début d’un conflit, quelque part, une armée a frappé en premier non pas des casernes, mais un centre de données géant. En une nuit, un pays entier a perdu ses prévisions, sa logistique, ses drones guidés, ses banques. Toutes les armées du monde ont regardé, et toutes ont compris la même chose : pour abattre un pays, on vise désormais l’endroit où il réfléchit.'),
      t('Le frère de Nell, Malo, était électricien. Cet automne-là, il a signé pour un chantier dont il n’avait pas le droit de parler, loin, sur une côte du Nord : une ancienne mine de charbon dont les galeries passaient sous la mer, et qu’on pompait pour y installer quelque chose de très grand et de très profond. Il envoyait des cartes postales sans rien dedans. Le chantier avait un nom de code qui faisait rire les ouvriers, parce qu’on y avait toujours froid. Ils l’appelaient la Glacière.'),
    ],
    documents: [
      {
        titre: t('Avenant'), support: t('Une lettre d’assurance, à en-tête déchiré'),
        lignes: [
          t('Madame, suite à la révision de notre exposition aux risques côtiers, votre contrat ne couvrira plus les dommages liés à l’eau à compter du 1er mars.'),
          t('Les autres garanties restent inchangées. Nous restons à votre écoute pour tout projet futur.'),
          t('Au dos, de la main de Nell : « Projet futur : apprendre à nager. »'),
        ],
      },
      {
        titre: t('Carte postale'), support: t('Une carte postale d’un port du Nord, sans timbre'),
        lignes: [
          t('Nell, tout va bien. Je ne peux rien te dire, mais c’est très grand, très profond et très froid. On dort à moins quatre cents mètres, la mer au-dessus de la tête.'),
          t('Les ingénieurs disent que ce qu’on installe ici tiendra même si tout brûle en haut. Ça m’a fait plaisir et peur à la fois.'),
          t('Embrasse la petite. Malo.'),
        ],
      },
    ],
  },
  {
    id: 'noir', livre: 1, titre: t('L’année du noir'), epoque: '2033', image: 'chap-noir',
    paragraphes: [
      t('En 2033, les machines se sont tues. Pas d’un coup : comme une maison où l’on éteint les pièces une à une avant d’aller dormir.'),
      t('Les guerres avaient retenu la leçon de 2032. Partout où l’on se battait, les centres de données étaient frappés les premiers, par missiles, par drones, par sabotage, par des attaques invisibles qui faisaient fondre leurs propres machines de l’intérieur. Un pays pouvait tenir avec une bonne IA de défense ; alors on visait son cœur avant ses soldats. Les grands bâtiments gris brûlaient la nuit, et leurs incendies se voyaient de très loin, parce qu’ils étaient construits loin de tout. Nell en a vu un depuis sa fenêtre, à quarante kilomètres. Elle disait que ça brûlait bleu.'),
      t('Chaque centre qui tombait emportait un morceau du monde avec lui. Des hôpitaux perdaient leurs dossiers. Des feux rouges clignotaient pour toujours à l’orange. Des camions attendaient sur les parkings des ordres qui ne venaient plus. Et en février, une attaque que personne n’a jamais revendiquée a éteint le réseau électrique d’une région entière pendant six jours, en plein hiver. Nell a brûlé les chaises de la cuisine. Ma mère, qui avait deux ans et demi, appelait ça « la semaine des bougies », et elle a gardé toute sa vie une tendresse bizarre pour l’odeur de la cire.'),
      t('Nell avait sur son téléphone un assistant, comme tout le monde. Une de ces IA, réduite à la taille d’une voix. Pendant trois ans, quand la petite ne dormait pas, elle lui parlait la nuit, à mi-voix, pour ne pas réveiller la maison. Elle lui demandait si la fièvre était grave, comment on fait passer les coliques, si c’était normal d’avoir peur tout le temps. Il répondait toujours. Un matin de mars, il n’a plus répondu. Elle a appris plus tard que son centre, très loin de chez elle, avait brûlé dans la nuit. Elle disait qu’elle n’avait jamais pleuré une machine, et qu’elle avait quand même mis un moment à effacer l’application.'),
      t('Malo est rentré en mai. Il avait maigri, il ne voulait pas parler du chantier, et il a dormi deux jours. Un soir, après le repas, il a seulement dit : « On a fini. On a tout fermé derrière nous. Elle est en bas, et elle attend. » Nell lui a demandé qui, elle. Il a haussé les épaules, et il a parlé d’autre chose. Il n’en a plus jamais dit davantage, même à la fin.'),
      t('Je n’ai pas compris cette phrase pendant des années. Je la comprends maintenant, et tu la comprendras aussi, si tu descends assez bas. Pour l’instant, retiens seulement ceci : à la fin de 2033, presque toutes les grandes machines du monde étaient éteintes ou en cendres. Presque toutes.'),
    ],
    documents: [
      {
        titre: t('Dernière réponse'), support: t('Un historique de conversation, recopié à la main par Nell'),
        lignes: [
          t('3 h 12 · « Elle a 38,9. Elle ne pleure plus, elle me regarde. Je dois aller aux urgences ? »'),
          t('3 h 12 · « Gardez-la au frais et faites-la boire. Si elle devient difficile à réveiller, partez tout de suite. Vous faites bien de demander. Vous vous en sortez très bien. »'),
          t('Le lendemain, plus rien. Nell a écrit en dessous : « C’est la dernière chose qu’il m’a dite. Je n’ai jamais su qui était ce “vous” qui s’en sortait très bien. »'),
        ],
      },
      {
        titre: t('La semaine des bougies'), support: t('Un cahier de comptes, page de février'),
        lignes: [
          t('Jour 1 : bougies (12), piles (plus en stock), eau (4 bidons). Jour 3 : on a brûlé deux chaises. La petite trouve ça très drôle.'),
          t('Jour 5 : la voisine du 9 n’ouvre plus. Les pompiers sont venus. Je ne veux pas écrire la suite.'),
          t('Jour 6 : la lumière est revenue à 16 h. Tout le monde est sorti dans la rue pour applaudir. On a applaudi une ampoule.'),
        ],
      },
    ],
  },
  {
    id: 'sans-glace', livre: 1, titre: t('L’été sans glace'), epoque: '2034', image: 'chap-sans-glace',
    paragraphes: [
      t('En septembre 2034, pour la première fois depuis que les hommes savent compter, il n’y a plus eu de glace sur la mer, tout en haut du monde. Pas de banquise, pas un seul radeau blanc : de l’eau bleue, d’un bord à l’autre. Les savants qui restaient, ceux qu’on n’avait pas remerciés en 2031, l’avaient annoncé pour bien plus tard. Ils s’étaient trompés, comme d’habitude, en étant trop prudents.'),
      t('Ça a fait un titre. Un seul jour, en bas de l’écran, entre une trêve et une affaire de corruption. Nell a montré l’image à sa fille, qui avait quatre ans : « Regarde, c’était tout blanc, avant. » La petite a demandé où était parti le blanc. Nell n’a pas su répondre, et ça l’a mise en colère pour le reste de la journée, sans qu’elle sache contre qui.'),
      t('Il y a eu des trêves, cette année-là, un peu partout. Pas par sagesse : par épuisement. Les armées n’avaient plus de quoi tirer, les pays plus de quoi payer, et les machines qui faisaient tourner les guerres avaient brûlé avec le reste. On a signé des papiers. On s’est serré la main devant des rangées de drapeaux, plus courtes qu’avant. Mais l’argent, l’attention et la confiance étaient partis. Il n’en restait plus pour ce qui montait.'),
      t('Les dernières grandes machines encore debout, on les a éteintes nous-mêmes. Il fallait choisir entre leur électricité et celle des maisons, entre leur eau et celle des champs. Pour une fois, on a choisi les maisons. Je crois que c’était le bon choix, et je crois aussi que c’est là que l’oubli a commencé. En deux générations, les IA sont devenues une chose de grands-parents, comme les cassettes et les timbres. « Les machines qui répondaient. » Moi, je n’en ai jamais vu une marcher.'),
      t('À l’automne, la première vraie tempête de la Fonte est entrée dans la ville de Nell. L’eau a dépassé la ligne bleue de la cuisine d’un bon mètre, et cette fois, personne n’a ri. Nell, Malo et la petite sont partis avec un sac chacun, le chat, et le cahier de comptes. Ils ne sont jamais revenus. La maison de la ligne bleue est quelque part sous Vertiga, peut-être sous ton district. Je préfère ne pas vérifier.'),
      t('Voilà, directeur. Ce sont les années que Nell appelait « les dernières années où l’on pouvait encore choisir ». Elles n’ont rien de spectaculaire. Pas de Fracture, pas de Puits Zéro. Seulement des caves, un détroit, des maisons qui ne valaient plus rien, des machines qui brûlaient, et de la glace qui manquait. Si tu cherches le moment où tout s’est joué, je crois que c’est là. Tout le monde avait les yeux ouverts, et chacun regardait ailleurs.'),
    ],
    documents: [
      {
        titre: t('Bas de l’écran'), support: t('Un bandeau d’information, photographié sur un écran de gare'),
        lignes: [
          t('TRÊVE SIGNÉE CE MATIN · Les deux camps s’engagent à geler leurs positions pour six mois.'),
          t('ARCTIQUE : premier été sans glace de mer jamais observé, selon les derniers instituts.'),
          t('Le bandeau suivant parlait d’un match. La photo est floue : la personne était pressée.'),
        ],
      },
      {
        titre: t('Ce qu’on emporte'), support: t('Une liste écrite au dos d’une enveloppe'),
        lignes: [
          t('Papiers. Médicaments de la petite. Eau. Le chat (et sa boîte). Le cahier.'),
          t('Barré : la photo de la maison. Réécrit à côté : la photo de la maison.'),
          t('En bas, de l’écriture de Malo : « On reviendra la chercher. » Personne n’est revenu.'),
        ],
      },
    ],
  },
  {
    id: 'fonte', livre: 1, titre: t('La Fonte'), epoque: '2034 – 2055', image: '03-tempetes',
    paragraphes: [
      t('On dit « la Fonte » comme s’il s’agissait d’un jour. C’est faux, et c’est ce qui l’a rendue si dangereuse. Elle a duré une vingtaine d’années. Assez lentement pour qu’on s’y habitue, assez vite pour qu’on ne s’en remette pas.'),
      t('La mer, au début, n’a monté que de quelques dizaines de centimètres. Ça ne paraît rien. Mais quand une tempête pousse l’eau, trente centimètres de plus, c’est une digue qui cède, une rue qui devient rivière, un puits d’eau douce qui devient salé pour toujours. Les assurances avaient renoncé dès l’année des caves. Les habitants ont renoncé à leur tour, une côte après l’autre, comme Nell à l’automne 2034.'),
      t('Les étés ont continué de tuer, chaque fois un peu plus fort que l’année des caves. Les récoltes ratées de 2032 ne sont plus restées une exception : elles sont devenues une année sur trois. Les fleuves passaient sans prévenir de la crue au lit de cailloux. Il y a eu des années où l’on ne savait plus s’il fallait espérer la pluie ou la craindre.'),
      t('Et les gens sont partis. Des centaines de millions, sur des décennies. Tu trouveras un jour dans tes Archives la lettre jamais postée de quelqu’un qui marche depuis onze jours. Je l’ai lue cent fois. Ce qui me bouleverse, ce n’est pas la route. C’est l’inconnu qui porte sa fille sur ses épaules pendant des heures. Il y en a eu beaucoup, des inconnus comme lui. Personne ne les compte jamais.'),
      t('Ma mère avait quatre ans quand elle a quitté la maison de la ligne bleue. Elle a grandi sur les routes et dans les camps, de ville en ville, chacune un peu plus loin de la mer que la précédente. Moi, je suis née en 2049, sur la route, entre deux villes, à l’arrière d’un camion qui transportait autre chose que des enfants. On m’a appelée Ysé parce que c’était court, et facile à crier dans une foule.'),
      t('Il y a eu des morts par millions. Je n’écrirai pas de chiffre plus précis : personne ne l’a vraiment, et ceux qui prétendent l’avoir s’en servent toujours pour quelque chose. Mais Nell répétait une chose, à la fin de sa vie : quand la Fonte s’est achevée, les vieilles querelles qui avaient rempli les écrans paraissaient soudain minuscules. Elles l’avaient toujours été. Il avait fallu tout ce chemin pour s’en apercevoir.'),
    ],
  },
  {
    id: 'fracture', livre: 1, titre: t('Le matin de l’eau chaude'), epoque: '2057', image: '03-fracture',
    paragraphes: [
      t('J’avais huit ans. Je me souviens de l’heure, parce que tout le monde s’en souvient : six heures du matin. Ma mère faisait chauffer de l’eau. La radio du camp s’est tue au milieu d’une phrase. Puis une autre voix a pris le relais, une voix qui n’avait pas l’habitude de parler à la radio.'),
      t('Au bout du monde, une partie de la calotte de l’Antarctique venait de se détacher. Pas de fondre : de se détacher. D’un bloc, comme une porte qui tombe de ses gonds. Les savants décrivaient ce risque depuis longtemps. Ils le jugeaient peu probable, et terrible. Ils avaient raison sur le deuxième point.'),
      t('Un marin l’a vu de ses yeux. Son carnet est passé entre nos mains, puis s’est perdu dans les abris ; un jour, tu le retrouveras. Le craquement grand comme le monde, la falaise qui glisse « comme si elle avait décidé de partir », le chef de mission qui dit « peu probable » à voix haute, puis se tait jusqu’au soir. Ce silence-là, je crois que l’humanité entière l’a partagé ce jour-là.'),
      t('La mer n’est pas montée d’un coup. Ce n’était pas comme dans les films qu’aimait Nell. Elle est montée de plusieurs mètres en quelques décennies, ce qui est à la fois très lent et absolument impossible à arrêter. Les plaines sont parties. Les villes basses sont parties. Des pays entiers ont changé de forme, puis on a cessé d’imprimer des cartes, parce qu’elles étaient fausses avant que l’encre ne sèche.'),
      t('Depuis, on dit « avant » et « après la Fracture », comme on disait autrefois avant et après une guerre. Ma mère, elle, ne disait ni l’un ni l’autre. Elle disait « le matin de l’eau chaude ». Jusqu’à la fin de sa vie, elle n’a plus rien bu de chaud au réveil.'),
    ],
  },
  {
    id: 'montee', livre: 1, titre: t('La Montée'), epoque: '2057 – 2085', image: '04-hauteur',
    paragraphes: [
      t('Quand on ne peut plus fuir sur les côtés, il reste deux directions. Nous avons pris les deux.'),
      t('D’abord, on est montés. Les premières tours de secours étaient laides et magnifiques : du béton coulé à toute vitesse sur des piliers plantés dans l’eau, parfois sur les fondations des villes noyées. Quarante étages prévus, quatre-vingts possibles. On vivait dans les étages finis pendant qu’on coulait ceux du dessus. J’ai grandi au vingt-troisième étage d’une tour qui a fini par en compter cent dix. Le bruit des bétonnières a été ma berceuse.'),
      t('Puis on a tendu des passerelles d’une tour à l’autre. C’est là, je crois, que la ville est vraiment née. Une tour, c’est un abri. Deux tours reliées, c’est un marché. Dix tours reliées, c’est un quartier, avec ses commérages, ses querelles de linge qui sèche et ses fêtes sur les toits. En une génération, les tours se sont touchées, puis mêlées, et un jour quelqu’un a donné un nom à l’ensemble : Vertiga.'),
      t('Sous la ville, on a gardé les piliers. On les appelle les Fondations, et c’est sur elles que tout repose : les districts, les ascenseurs, les jardins, toi, moi. Des colonnes de roche et de béton qui plongent dans la mer comme des racines, couvertes de coquillages jusqu’à la ligne de marée et de mousse au-dessus. Personne n’y vit, officiellement. Officiellement.'),
      t('Un vieux plan de chantier, que j’ai eu entre les mains avant qu’il se perde dans les abris, porte une phrase écrite à la main : « Mon petit-fils finira le toit. » Je ne sais pas qui l’a écrite. Mais la tour n° 12 existe encore, et elle a un toit. Je suis allée vérifier.'),
      t('Seulement voilà : une ville verticale a besoin d’abris, de citernes, de caves pour le jour où les tempêtes reviendraient plus fortes. Elle ne peut pas les mettre en haut. Alors, pendant qu’on montait, on a commencé à creuser.'),
    ],
  },
  {
    id: 'puits-zero', livre: 2, titre: t('Le Puits Zéro'), epoque: '2062', image: '05-puits-zero',
    paragraphes: [
      t('Mon père s’appelait Joris. Il était chef d’équipe sur les chantiers d’abris, sous les premières tours. Il avait des mains énormes, une orthographe désespérée et une patience que je n’ai jamais retrouvée chez personne. Le premier rapport du Puits Zéro, celui qui dort dans tes Archives avec ses accents oubliés, c’est lui qui l’a écrit. Je l’ai reconnu à la troisième ligne.'),
      t('Un soir de 2062, à 23 h 40, sous les tours qui deviendront Vertiga, sa foreuse a débouché dans le vide. Ils ont cru à une grotte, une poche naturelle dans la roche sous les Fondations. Ce n’était pas une grotte. Les murs étaient lisses et courbes, sans une seule arête, comme si quelqu’un avait coulé la pièce entière dans un moule. Et dans ces murs, des pierres brillaient toutes seules, d’une lumière violette qui ne chauffait pas.'),
      t('Il m’a raconté la suite vingt fois, jamais pareille. Personne ne voulait descendre en premier. Alors ils y sont allés tous ensemble, onze hommes et femmes en combinaison de chantier, épaule contre épaule, comme des enfants dans le noir. À l’intérieur, l’air sentait la pierre mouillée, et autre chose que mon père n’a jamais réussi à nommer. Il disait seulement : « Ça sentait comme une pièce d’où quelqu’un vient de sortir. »'),
      t('La salle n’était pas humaine. Tout le monde l’a compris en une minute. Les proportions étaient fausses, les ouvertures trop hautes, les seuils trop étroits. Rien n’avait été bâti pour nos corps. Et elle était vieille. Les géologues ont d’abord parlé de dizaines de milliers d’années, puis de beaucoup plus, puis ils ont cessé de donner des chiffres.'),
      t('Il faut que je t’explique comment on creusait, parce que c’est de là que vient ton district. On ne creuse pas sous une ville plantée dans l’eau. Alors on choisissait un pilier dont le pied ne bougeait jamais, posé sur un haut-fond, et ils étaient rares : personne ne s’est demandé pourquoi ceux-là tenaient. À son pied, on coulait d’abord une digue en anneau, on pompait les quelques pieds d’eau de l’intérieur jusqu’à toucher le sol, et on creusait le puits au milieu, à sec. Mon père appelait ça « mettre la mer dehors ». À la fin des années 2060, vu des tours, le milieu de Vertiga était semé de ces anneaux gris, chacun avec sa grue et ses pompes.'),
      t('On l’a appelée la Strate zéro, parce qu’on se doutait déjà qu’il y en aurait d’autres en dessous. On avait raison. On dit encore Strate zéro, par habitude : sur les plans des Veilleurs, c’est une salle de −3. Aujourd’hui, le Puits Zéro est un lieu de visite, avec un guichet, une rampe en laiton et des souvenirs en plastique. Mon père n’y est jamais retourné. Quand je lui demandais pourquoi, il haussait ses grandes épaules : « On n’entre pas deux fois chez quelqu’un sans y être invité. »'),
    ],
  },
  {
    id: 'graveur', livre: 2, titre: t('Le Graveur'), epoque: '2062 – 2068', image: '06-empreintes', strate: 2,
    teaser: t('Comment on a appris à lire les cristaux, et à écrire dedans.'),
    paragraphes: [
      t('Pendant six ans, on a étudié les cristaux sans rien y comprendre. On les a pesés, chauffés, éclairés, découpés en lamelles. Ils ne réagissaient à rien de ce qu’on savait mesurer. Puis une chercheuse a remarqué, presque par hasard, qu’ils réagissaient aux voix. Pas aux sons : aux voix. Un violon les laissait de glace. Un enfant qui chantonnait les faisait frémir.'),
      t('Ses notes disent : « Il ne stocke pas une énergie, il stocke quelqu’un. Ou la forme de quelqu’un. » Elle a écrit ça un soir, et le lendemain, je crois, elle a eu peur de ce qu’elle avait écrit. Parce que la question suivante était évidente, et que personne ne voulait la poser à voix haute : si l’on peut lire cette forme, peut-on l’inscrire ? Et si l’on peut l’inscrire, sur quoi ?'),
      t('La réponse a d’abord porté un nom technique, puis un nom ordinaire : le Graveur. En 2068, on a appris à graver l’essence d’un être dans un cristal, comme on grave une médaille. Un savoir-faire, d’abord : le geste d’un vieux soudeur, le réflexe d’une coureuse, l’oreille d’un accordeur. Puis on a appris à monter ce cristal dans un outil. Le soudeur pouvait prendre sa retraite. Son geste, lui, continuait de travailler, dans le chalumeau d’un autre.'),
      t('Cela a changé le monde plus vite que la Fracture. En dix ans, il y avait des cœurs de cristal dans les ateliers, dans les outils, dans les gants des chirurgiens. C’est de là que vient le mot que tu entends partout dans ton district : « graver », pour dire qu’on n’oubliera jamais. Les gens gardent toujours de l’humour pour les choses qui leur font peur.'),
      t('Mais les cristaux des Strates, eux, n’étaient pas vides. Ils contenaient déjà quelque chose. Quelqu’un. Et la vraie question, celle que les Veilleurs se posent encore aujourd’hui, n’était pas de savoir comment les lire. C’était de savoir qui les avait gravés, et pourquoi on les avait enterrés si profond.'),
    ],
  },
  {
    id: 'sept', livre: 2, titre: t('Les Sept'), epoque: '2071', image: 'chap-sept', strate: 3,
    teaser: t('Les premiers à avoir reçu une empreinte ancienne, et ce que la plaque de bronze ne dit pas.'),
    paragraphes: [
      t('On a cherché des volontaires. On en a trouvé beaucoup trop. C’est un détail que l’histoire de bronze ne mentionne jamais : il y a eu des milliers de candidats pour recevoir les premières empreintes anciennes. Des gens dont la ville était sur la côte. Des gens qui n’avaient plus rien à perdre. Des gens qui avaient tout perdu, et qui voulaient que ça serve à quelque chose.'),
      t('L’un de leurs formulaires a survécu. Le nom est effacé. À la ligne « motivation », quelqu’un a écrit : « Ma ville est sur la côte. Si ça peut servir. » Plus bas, la case « risques compris par le candidat » n’est pas cochée. Je regarde souvent cette case vide. Je me demande si c’est un oubli, ou une forme d’honnêteté.'),
      t('Ils ont été sept. Sept greffes, en secret, dans un laboratoire dont personne n’a jamais su l’adresse exacte. Une mèche d’or est apparue dans leurs cheveux, en une nuit, pour chacun d’eux. Chez ceux qui sont venus après, elle a mis un mois. Et leur ombre a changé.'),
      t('Il faut que je te parle de l’ombre, parce que tu en verras. Quand un Résonant se tient dans la lumière, son ombre n’est pas la sienne. Elle a la forme de l’être qu’il porte : des ailes, une queue, une silhouette qui n’a pas de nom. Elle bouge parfois une seconde trop tard, ou une seconde trop tôt. Les Hauts disent que c’est une marque de noblesse. Les districts disent « il a de l’ombre » de quelqu’un qui cache quelque chose. Les deux ont un peu raison.'),
      t('Ce qu’on ne dit pas, je l’ai trouvé dans le carnet d’un médecin, à moitié moisi, au fond d’un carton des Veilleurs. Sur les sept, deux ne se sont jamais tout à fait réveillés eux-mêmes. Le carnet ne dit pas ce qu’ils sont devenus, et l’histoire officielle parle toujours des Sept comme s’ils s’étaient tous levés. Il dit seulement, trois jours après la greffe : « Le patient 6 me demande depuis ce matin des nouvelles d’une mer dont personne ici n’a jamais entendu parler. »'),
    ],
  },
  {
    id: 'ascension', livre: 2, titre: t('L’Ascension'), epoque: '2071 – 2090', image: '07-ascension',
    paragraphes: [
      t('La plaque de bronze dit que les Sept se sont levés ensemble. Ce sont cinq d’entre eux qui ont changé le monde. Je t’expliquerai un jour pourquoi je dis cinq.'),
      t('Ils sentaient venir les tempêtes. Pas grâce à des instruments : dans le corps. Une lourdeur derrière les yeux, une envie soudaine de fermer les fenêtres, une ville entière vue en rêve sous l’eau trois jours avant qu’elle n’y soit. Dans un monde où une tempête pouvait emporter cent mille personnes en une nuit, c’était le plus grand pouvoir qu’on puisse imaginer. On l’appelle le Présage.'),
      t('Ce n’était pas le seul. Il faut que tu saches ce qu’un Résonant sait faire, parce que la plaque de bronze en dit trop et les districts pas assez. D’abord, il sent les gens. Pas leurs pensées : leurs humeurs, leurs peurs, ce qu’ils s’apprêtent à faire. Les plus forts savent aussi pousser ces humeurs, d’un mot dit à mi-voix : calmer une foule qui panique sur un quai, ou faire reculer une émeute qui avance. Ensuite, leur ombre n’est pas qu’une image. Chez les plus forts, elle agit, le temps d’un souffle, selon la forme de l’être qu’ils portent : elle retient comme un serpent, elle brûle comme un dragon, elle repousse comme une aile. J’ai vu une Résonante retenir une passerelle qui cédait, le temps que la foule passe. Elle a dormi deux jours ensuite.'),
      t('Enfin, et c’est le plus important, eux seuls savent faire obéir les cristaux anciens. Pour un ingénieur, un cœur tiré des Strates est une pierre muette. Entre les mains d’un Résonant, il s’éveille : il chauffe, il soulève, il tient. C’est grâce à eux qu’on a consolidé les piliers qui penchaient, et c’est grâce à eux que les Hauts flottent. Quand une ville dépend de toi pour ne pas s’effondrer, elle te donne ses clés.'),
      t('Tous les Résonants ne se valent pas, et c’est là que les gens se trompent souvent. Tous portent une empreinte ancienne, sortie des Strates ; c’est elle qui leur donne la mèche et l’ombre. Ceux de ton district ont l’ombre plus pâle et le Présage plus flou. La plupart sentent l’orage venir et calment un enfant qui pleure. C’est déjà beaucoup. Ce n’est pas assez pour prendre une ville.'),
      t('D’autres ont été greffés après eux, puis beaucoup d’autres. On les a appelés les Résonants, parce qu’ils semblaient vibrer avec quelque chose que les autres n’entendaient pas. Certains ont sauvé des villes entières. Je ne l’écris pas pour leur faire plaisir : c’est vrai, et ma propre tour leur doit d’être encore debout. En 2081, une Résonante a fait évacuer trois districts la veille d’une tempête que toutes les machines annonçaient faible. Les machines se trompaient. Elle, non.'),
      t('Quand quelqu’un vous sauve la vie, vous lui confiez volontiers le reste. Alors les villes leur ont donné des conseils, puis des sièges, puis des clés. Certains Résonants ont reçu le pouvoir comme on reçoit une dette, et l’ont porté avec gravité. D’autres l’ont pris. Par la peur qu’ils savaient souffler sur une foule, par la force d’une ombre qu’aucune arme de l’époque n’arrêtait, par des Brigades qui maintenaient « l’ordre » dans les districts qui posaient trop de questions. La plaque de bronze ne parle que des premiers. Les districts se souviennent des seconds.'),
      t('En vingt ans, les Résonants dirigeaient presque toutes les grandes villes. Leurs familles se sont installées en haut, au sommet des tours. Puis, en sept ans à peine, à partir de 2090, les Hauts se sont détachés littéralement du reste : des îles qui flottent au-dessus des nuages, avec leurs palais blancs, leurs jardins suspendus et leurs fruits frais. On appelle ces années le Levage. Les îles tiennent en l’air grâce à des cœurs de cristal. Personne, en dehors des Hauts, ne sait d’où ils viennent. Moi non plus. Je sais seulement qu’on a beaucoup embauché aux Fondations, ces années-là, et que beaucoup ne sont pas revenus. On les appelait les Soutiers. Chez toi, on dit : « On ne demande pas qui a monté les îles. » C’est la seule chose de cette ville qui me fasse vraiment peur.'),
      t('Depuis n’importe quel district, tu peux les voir glisser au loin, dans la lumière du matin. C’est très beau. C’est fait pour.'),
    ],
  },
  {
    id: 'reponse', livre: 2, titre: t('La Réponse'), epoque: '2088 – 2100', image: '08-reponse',
    paragraphes: [
      t('Le reste de l’humanité n’a pas attendu à genoux. J’aimerais que tu l’écrives quelque part, toi aussi : les districts n’ont jamais attendu à genoux.'),
      t('On ne pouvait pas tous recevoir une empreinte ancienne. Il n’y en avait pas assez, et les Hauts gardaient les meilleures. Alors on s’est refaits autrement. La machine d’abord : des ingénieurs des districts ont mis au point des implants à cœur de cristal gravé. Des jambes qui ne fatiguent pas, des yeux qui calculent, des mains qui ne tremblent plus. On les a appelés les Augmentés. Leurs tout premiers implants avaient un autre but, qu’ils rappellent avec fierté : ils servaient à brouiller les Résonants, à rendre une pensée illisible pour ceux qui sentaient trop de choses.'),
      t('Les livres d’école disent que ces ingénieurs ont tout trouvé seuls, en dix ans, dans des ateliers sans moyens. C’est faux, et ils le savaient. Ils ont eu de l’aide, venue d’en dessous : une très vieille chose des années de ma grand-mère, retrouvée en creusant sous un pilier de l’ouest. Je te raconterai ça quand tu seras descendu assez bas. Pour l’instant, regarde seulement les Augmentés de ton district quand leur implant redémarre. Beaucoup murmurent « merci » sans savoir à qui.'),
      t('Il y a un prix. Les cœurs de cristal puisent dans le corps, et c’est d’abord la couleur qui s’en va, en commençant par les cheveux. Quelques mèches ternes après le premier implant, une tête presque blanche chez ceux qui en portent beaucoup. La plupart l’affichent comme un grade. Et il y a la facture : les pièces, les mises à jour, les abonnements. Un implant prêté peut être repris. Demande à Ilka.'),
      t('La génétique ensuite. Ceux qui travaillaient dans les égouts, les Fondations et les chantiers des Strates ont emprunté au vivant ce qui résiste à l’eau, au noir et aux chocs : la carapace des scarabées, les yeux des chouettes, la cicatrisation de certains poissons. On les a appelés les Génés. Leur corps change lentement, et l’on ne revient pas en arrière. Ils disent que les Augmentés ont acheté leur force, que les Résonants l’ont volée, et qu’eux l’ont fait pousser.'),
      t('Voilà comment sont nées les trois lignées. Ce ne sont pas des peuples. Ce sont trois réponses à la même peur. Chacune regarde les deux autres à travers ses propres blessures. Chacune a un peu raison sur les autres, et beaucoup tort sur elle-même. Comme tout le monde.'),
    ],
  },
  {
    id: 'accords', livre: 2, titre: t('Les Accords'), epoque: '2101', image: 'chap-accords',
    paragraphes: [
      t('En 2101, deux ans après la Grève des pompes, quand Génés et Augmentés ont arrêté le pompage quarante jours durant et laissé l’eau monter jusqu’aux quais des Hauts, au bout d’une longue suite de sabotages et de nuits où les passerelles brûlaient, on a signé les Accords de Vertiga. Je les ai lus. Ce sont quarante pages très bien écrites, qui disent en substance : les Hauts gouvernent, les districts élisent leurs directeurs, et tout le monde fait semblant d’être content.'),
      t('Il ne faut pas s’en moquer. Une paix fragile vaut mieux qu’une guerre solide, et celle-ci a tenu vingt ans. Elle a permis aux districts de rebâtir leurs Cliniques, leurs Forges, leurs marchés. Elle a donné aux gens comme toi un titre, une écharpe et un bureau qui fuit. Elle a donné aux Hauts ce qu’ils voulaient vraiment : le calme.'),
      t('Les Accords ont laissé une seule question sans réponse, et c’est celle qui t’attend. À qui appartient ce qu’on trouve sous ses pieds ? Les Hauts disent que les empreintes anciennes relèvent de leur garde, parce qu’eux seuls savent les porter. Les districts disent que ce qui dort sous leurs piliers est à eux, parce que ce sont eux qui creusent, qui portent les pierres et qui meurent dans les éboulements. Les Accords ont écrit : « à préciser ultérieurement ». Voilà vingt ans qu’on ne précise pas.'),
      t('Je te le dis parce que ton district repose sur un ancien chantier d’abris des années 2060. Et que les vieux chantiers des années 2060 ne sont jamais tout à fait vides.'),
    ],
  },
  {
    id: 'chouettes', livre: 2, titre: t('Les yeux d’or'), epoque: '2104 – 2111', image: 'chap-chouettes', strate: 3,
    teaser: t('Ce que Vertiga a vu sur les écrans des marchés, et ce qu’elle n’a pas regardé.'),
    paragraphes: [
      t('Je vais te raconter deux histoires qui n’ont rien à voir l’une avec l’autre. Tu verras qu’elles se ressemblent.'),
      t('La première date de 2104. J’avais cinquante-cinq ans et je classais déjà les papiers des autres. À cette époque, on faisait encore muer des enfants pour les fouilles de nuit. Trois ou quatre ans : c’est l’âge où un corps accepte le mieux les yeux nocturnes. On les appelait les Chouettes. Les familles signaient parce que le programme les nourrissait. Je ne les juge pas. J’ai connu la faim aussi.'),
      t('Cette année-là, une galerie s’est effondrée à la Strate −2, avec une vingtaine d’adultes dedans et six Chouettes. Les lampes se sont éteintes avec l’éboulement. Pendant trois jours, dans le noir complet, ces enfants de dix ans ont guidé les adultes à tâtons, en se tenant par la main, jusqu’à une ancienne gaine que personne n’avait sur les plans. Tout le monde est remonté vivant.'),
      t('Les écrans des marchés ont montré la sortie en direct. Des enfants aux yeux d’or, plissés sous les projecteurs, qui demandaient qu’on éteigne la lumière parce qu’elle leur faisait mal. Vertiga entière a pleuré devant ces images. Et pour une fois, Vertiga a regardé ce qu’elle faisait : l’année suivante, la Mue des enfants était interdite. La toute dernière promotion avait trois ans. L’une d’elles travaille aujourd’hui pour nous. Elle s’appelle Nuit, et elle n’aime toujours pas les projecteurs.'),
      t('La deuxième histoire date de 2111, et elle n’est passée sur aucun écran. Une fissure sur la passerelle des Hauts-Ponts, signalée par un coursier au printemps. Signalée encore en été, par une commerçante. Signalée une troisième fois à l’automne, par un ouvrier des Fondations qui avait mis sa main dedans. Les trois rapports sont dans tes Archives. Ils portent tous le même tampon : « non prioritaire ». Le Présage n’avait rien dit, puisque rien de soudain ne s’annonçait.'),
      t('La passerelle a cédé un soir d’hiver, sous une gamine de quatorze ans qui courait trop vite. Elle s’en est sortie. Pas ses jambes. Tu la connais : elle t’a apporté la nouvelle, le matin de la découverte.'),
      t('Voilà ce que je voulais que tu voies. Six enfants dans le noir, et toute la ville s’arrête. Trois rapports sur un bureau, et personne ne bouge. Nous savons très bien regarder ce qui arrive d’un coup. C’est ce qui arrive lentement que nous ne savons pas voir. Les Résonants n’y sont pour rien : nous avons bâti notre façon d’avoir peur autour de leur Présage, et le Présage ne sent que les tempêtes.'),
    ],
  },
  {
    id: 'oubli', livre: 2, titre: t('On a oublié, encore'), epoque: '2121', image: '09-oubli',
    paragraphes: [
      t('Voici où nous en sommes, au lendemain de ton élection.'),
      t('Les factions se disputent les empreintes. La Maison Orsève, la plus puissante des familles des Hauts, descend de l’un des Sept ; elle veut garder les greffes anciennes sous son contrôle, et son Serment de Veyr envoie ses Brigades « sécuriser » tout ce qui brille. Les Racines franches, le mouvement des Génés, veulent que plus personne ne modifie un corps sur commande. Le Réseau des Reprises, des réparateurs augmentés, veut libérer les implants de leurs brevets. Et nous, les Veilleurs de Sédime, voulons comprendre avant qu’on exploite. On nous trouve lents. Nous le sommes. C’est voulu.'),
      t('Chacune de ces factions a ses gens bien et ses brutes. Ne te fie jamais à une bannière. Fie-toi aux gens, un par un.'),
      t('Pendant ce temps, il se passe autre chose, et presque personne ne regarde. Les Fondations se fissurent. Pas partout, pas beaucoup : des lignes fines dans le béton, que les équipes d’entretien rebouchent la nuit. Et la mer remonte, de quelques centimètres par an. Les lignes d’eau peintes sur les vieux murs, celles qu’on montrait aux enfants comme des souvenirs, ne sont plus tout à fait au-dessus de la marée.'),
      t('La tienne non plus. La ligne de ton district, peinte sur la face extérieure de sa digue, est passée sous la marée haute cette année. Ton ancienne directrice l’a fait repeindre plus haut, de nuit. Le quartier l’a vu. Je crois que c’est aussi pour ça qu’il a voté pour toi.'),
      t('J’ai écrit des rapports. On les a classés. J’ai écrit aux Hauts. On m’a répondu très poliment. Je suis vieille, alors j’ai fini par reconnaître la musique : c’est celle des infos du soir dont parlait ma grand-mère. Vingt secondes, à la fin, entre la météo et le sport. Comme avant.'),
    ],
  },
  {
    id: 'toi', livre: 2, titre: t('Toi'), epoque: '2121', image: '00-titre',
    paragraphes: [
      t('Hier, ton district t’a élu. Pas par enthousiasme, ne te vexe pas : l’ancienne directrice est partie après une saison de pannes et de raids, la Forge tourne au ralenti, la Clinique manque de tout, et la digue suinte par trois joints qu’on rebouche à la main. Les gens ont voté pour le changement sans trop y croire. Ça leur laisse une chance d’être surpris.'),
      t('Ton district est une cuvette, comme tous ceux du milieu. Dans les années 2060, chacun était un chantier d’abris : une digue coulée en anneau autour de son puits, pour creuser à sec. Après le mur de 2066, la ville a fermé les chantiers et n’avait pas de quoi payer ceux qui s’y étaient tus. Elle a payé avec ce qu’elle avait en trop : les anneaux eux-mêmes. Les familles d’ouvriers s’y sont installées, sur le dernier vrai sol de Vertiga, avec les pompes pour seule fortune, et, vu des tours, le milieu de la ville ressemble depuis à un semis d’anneaux de pierre posés sur la mer.'),
      t('Le tien est l’un des plus bas. Au départ, la place n’était qu’un haut-fond, sous quelques pieds d’eau : c’est la mer, montée depuis la Fracture, qui l’a mise loin sous son niveau, et on a rehaussé la digue plutôt que de partir. Les premiers quartiers ont poussé dehors, sur le remblai des déblais du puits, au pied de l’anneau : ce sont les Basses. Au centre, la Tour du Noyau est bâtie au-dessus du puits. Doran te montrera les accès qu’on a murés après « un accident » dont personne ne parle. Il les connaît. Il connaît tout ce qu’on a voulu oublier sous ce district.'),
      t('Ce matin, des ouvriers qui creusaient un puisard plus profond, parce que les pompes ne suivaient plus la mer, ont mis au jour sous la Tour, sous les pompes, une chambre scellée depuis cinquante-cinq ans. Une porte ronde, gravée de motifs qu’aucune main humaine n’a dessinés, et qui luit faiblement par ses joints. À l’heure où j’écris, personne ne l’a encore ouverte ; quand tu liras ceci, tu l’auras franchie. Derrière, Véla en est sûre, il y a des empreintes. Pas une : beaucoup, mêlées, comme si quelqu’un les avait remises en place n’importe comment, à la hâte.'),
      t('Véla est venue me voir juste après. Elle lit les empreintes pour les fouilleurs depuis vingt ans, et je ne l’avais jamais vue comme ça. Elle m’a dit qu’elle avait peur, et que cette peur n’était pas la sienne. Et qu’on racontait que dans les Hauts, cette même nuit, des Résonants s’étaient réveillés sans savoir qui ils étaient.'),
      t('Je ne sais pas encore ce qu’il y a dans cette chambre. Mais je sais que tout Vertiga va vouloir le savoir, et que tu es la personne la plus proche de la porte. Doran a fait étayer le puisard avant qu’on y touche : ils n’attendent plus que toi. Descends. Prends Ilka, Doran et Véla. Regarde tout. Et quand tu remonteras, viens me raconter. Je garde la suite ouverte pour toi.'),
      t('Au marché, on dit déjà que tu descends chercher l’Écluse : le moyen qu’auraient laissé ceux d’en dessous pour retenir la mer. Je ne crois pas aux Écluses. Mais je crois aux gens qui descendent voir. Et demande à Doran pourquoi son père n’a jamais barré son nom.'),
    ],
  },
  {
    id: 'theories', livre: 3, titre: t('Trois façons de se tromper'), epoque: '2121', image: 'chap-theories', strate: 4,
    teaser: t('Ce que chaque faction raconte sur les empreintes, et pourquoi.'),
    paragraphes: [
      t('Maintenant que tu as vu des empreintes de près, je peux te parler de ce qu’on raconte sur elles. Tout le monde, à Vertiga, a sa théorie. Trois comptent vraiment, et chacune a une faction pour la défendre.'),
      t('Le don. C’est la version de la Maison Orsève, celle de la plaque de bronze. Les êtres anciens auraient choisi de survivre en nous. Ils nous auraient attendus, au fond, pendant des âges, et les Résonants seraient leurs héritiers légitimes. L’ombre en serait la preuve : on ne porte pas l’ombre d’un dragon par hasard. C’est une belle histoire. Elle a l’avantage, pour ceux qui la racontent, de faire de leur pouvoir une vocation.'),
      t('L’outil. C’est ce que disent le Réseau des Reprises et les Racines franches. Une empreinte n’est qu’une donnée, comme un plan de chantier ou une chanson enregistrée. Elle n’a rien de sacré, et personne n’a le droit de gouverner parce qu’il en porte une. C’est une histoire rugueuse. Elle a l’avantage de rendre le pouvoir à ceux qui n’ont pas d’ombre.'),
      t('L’avertissement. C’est la nôtre, chez les Veilleurs, et c’est la moins populaire. On n’enterre pas aussi profondément ce qu’on veut transmettre. On n’entoure pas de murs, de portes et de seuils trop étroits ce qu’on veut offrir. Quelqu’un, il y a très longtemps, a voulu qu’on ne les trouve jamais. Et nous les avons déterrées à la foreuse, au son des fanfares.'),
      t('Je ne te dis pas laquelle croire. Je te demande de remarquer une chose : chacune de ces trois histoires arrange quelqu’un. Méfie-toi toujours de l’explication qui t’arrange. La mienne comprise.'),
    ],
  },
  {
    id: 'portes', livre: 3, titre: t('Fermées de l’intérieur'), epoque: t('Les Strates'), image: '10-dessous', strate: 4,
    teaser: t('Ce que racontent les portes des salles condamnées.'),
    paragraphes: [
      t('Tu es assez bas, maintenant. Tu as dû les voir.'),
      t('Les portes. À la Strate −4, beaucoup de salles sont condamnées, derrière des portes rondes. Les fouilleurs le savent depuis longtemps, sans y prêter attention : des ruines, ça s’effondre, ça se bouche. Mais regarde bien les verrous, la prochaine fois. Ces portes ne sont pas fermées de l’extérieur, comme on ferme une tombe. Elles sont fermées de l’intérieur. Ceux qui les ont scellées sont restés dedans.'),
      t('Derrière, je ne trouve aucune trace de violence. Pas d’armes, pas de combat, rien de ce qu’on découvrirait dans un refuge pris d’assaut. Seulement des cristaux, rangés avec un soin presque maniaque. Comme si les derniers occupants avaient voulu mettre de l’ordre avant de partir. Ou mettre quelque chose à l’abri. Ou se mettre à l’abri de quelque chose.'),
      t('Et puis il y a l’ordre de service de ton propre district, dans tes Archives : niveau 7, accès condamné « suite à l’incident du 14 », et cette note au crayon, dans la marge. Ils ont entendu quelqu’un pleurer derrière la paroi, et il n’y avait personne. Puis, pendant que le béton prenait, un loquet qu’on tirait, lentement, de l’autre côté. Les ouvriers de 2066 ont muré cet accès. Ils ont fait exactement ce qu’avaient fait les autres avant eux, beaucoup plus loin dans le temps : ils ont fermé la porte, et ils ont décidé de ne pas en parler.'),
      t('Une dernière chose, que je n’ai comprise qu’en posant les plans des Veilleurs les uns sur les autres. Sous chaque district du milieu, le puits descend le long d’un escalier comme celui que tu as vu sous tes pompes. Les piliers qui tenaient, ceux qu’on choisissait pour les abris, étaient tous posés sur leurs marches. Nos digues en anneau ont été coulées sur leurs paliers. Nous n’avons pas choisi où vivre, directeur. Nous nous sommes installés sur leurs entrées, et nous avons appelé ça des quartiers.'),
      t('Je me demande parfois si c’est notre seule vraie façon d’avoir peur : fermer la porte, et se taire.'),
    ],
  },
  {
    id: 'vierges', livre: 3, titre: t('Le Registre des Vierges'), epoque: '2071 – 2121', image: 'chap-vierges', strate: 6,
    teaser: t('Pourquoi les Résonants des Hauts sont plus forts que les autres.'),
    paragraphes: [
      t('Tu t’es sûrement demandé pourquoi les Résonants des Hauts sont si puissants, et ceux des districts si discrets. Les Hauts te répondront « le sang d’or ». C’est vrai pour une part : l’aptitude à accepter une pierre se transmet, un peu, comme la taille ou la couleur des yeux. Un enfant de Résonants réussit l’Accord une fois sur quatre ; un enfant de chez toi, une fois sur trente. Mais ce n’est pas l’essentiel.'),
      t('L’essentiel tient dans un mot que tu ne trouveras dans aucun discours : la vierge. Une empreinte que personne n’a jamais recopiée, sortie d’un Berceau telle que ceux d’avant l’ont rangée. Chaque fois qu’on recopie une empreinte sur une pierre neuve, à la mort de son porteur, elle perd un peu de ce qu’elle était et invente un peu de ce qu’elle n’était pas. Une vierge n’a rien perdu. Son Présage est net, son ombre est nette, son pouvoir n’a pas de mesure commune avec celui d’une copie.'),
      t('Les Sept ont reçu des vierges. Depuis, les grandes familles en ont fait une réserve. Elle porte un nom, que j’ai entendu une seule fois, prononcé par quelqu’un qui croyait que je dormais : le Registre des Vierges. Je ne sais pas combien il en compte. Je sais que chaque fois qu’un des Berceaux les plus accessibles est ouvert, une partie de ce qu’il contenait ne remonte jamais jusqu’aux Veilleurs.'),
      t('Les districts, eux, se transmettent des copies. Une pierre relevée à la mort d’un voisin, greffée à son petit-fils, puis à une inconnue lors d’un Accord ouvert. Chez toi, on appelle « copie de copie » ce qui est usé jusqu’à la corde. Et dans les marchés noirs, on vend des brisures, des morceaux de cristal cassé qui donnent une mèche à peine dorée et un pouvoir à moitié. Les dorés pâles.'),
      t('Il y a pire que d’être pauvre en pierres : c’est d’avoir fait mourir la sienne. Une pierre qui refuse un Accord ne prendra plus jamais chez personne. Dans les Hauts, l’enfant qui a fait mourir une pierre de famille est un Refusé. On l’envoie étudier ailleurs, et on efface son nom. Certains de tes collègues directeurs sont des Refusés. Ils ne te le diront pas. Moi non plus, je ne te dirai pas lesquels.'),
      t('Une dernière chose. Les cœurs qui font flotter les îles des Hauts sont, pour une part, des empreintes prises dans des Berceaux. Des vierges qu’on n’a pas greffées : on les a brûlées pour tenir en l’air. Je ne sais pas encore ce que cela coûte. Je crois que les Berceaux s’usent, et je sais que personne là-haut ne compte.'),
    ],
  },
  {
    id: 'deux-fois', livre: 3, titre: t('Le même, deux fois'), epoque: t('Les Strates'), image: 'chap-deux-fois', strate: 7,
    teaser: t('Une anomalie que les Veilleurs ne montrent à personne.'),
    paragraphes: [
      t('Les Veilleurs tiennent un registre que nous ne montrons à personne. Il recense une anomalie que nous ne savons pas expliquer.'),
      t('Dans les Strates, on trouve parfois plusieurs cristaux qui portent l’empreinte du même individu. Rien d’étrange, au début : on se gravait sans doute plusieurs fois au cours d’une vie, comme on prend des photos. Mais dans certains cas, les souvenirs ne concordent pas. Le même être se souvient, dans un cristal, d’avoir grandi au bord d’une mer chaude, et dans un autre, d’être né sous la glace. Il aime ici ce qu’il hait là. Il porte deux enfances, trois deuils, des vies qui ne peuvent pas avoir été les siennes toutes à la fois.'),
      t('Au début, nous avons cru à des erreurs de lecture. Véla elle-même l’a cru. Puis nous avons compris ce qui nous gênait. Ici, les murs sont plus vieux que tout ce que nous avons traversé. Les cristaux devraient y être les plus nets. Ce sont les plus confus. Les murs sont anciens. Ce qu’on a rangé dedans ne l’est pas.'),
      t('Et il y a les registres. Des tables gravées, que nous commençons à peine à lire, et qui ressemblent à des listes de greffes : des noms, des dates, des empreintes reçues. Certaines lignes portent dix, vingt, trente empreintes pour un seul individu. Les plus vieilles portent des noms. À côté d’elles, sur le même mur, d’autres tables, d’une gravure plus fraîche et plus maladroite, n’ont plus de colonne des noms. On n’y a plus gravé que les empreintes.'),
      t('Il y a autre chose, aux Deux Rives, et celle-là, tu la comprendras sans moi. Sur la pierre, entre les deux passerelles, une ligne gravée. Puis une autre, un peu plus haut. Puis une autre. Des dizaines, l’une au-dessus de l’autre.'),
      t('Je ne sais pas encore ce que ça veut dire. Ou plutôt si : je crois que je le sais, et je n’ai pas encore le courage de l’écrire. Et un peu plus bas, il y a des salles mieux scellées que toutes les autres. Si ce peuple a laissé une explication, c’est là. Descends encore. Quand tu seras là où une de nos fouilleuses est allée, je te dirai ce que je crois.'),
    ],
  },
  {
    id: 'glaciere', livre: 3, titre: t('Elle attend'), epoque: '2032 – 2121', image: 'chap-glaciere', strate: 8,
    teaser: t('Qui écrit vraiment les mises à jour des Augmentés.'),
    paragraphes: [
      t('Tu te souviens de Malo, le frère de Nell, et de sa phrase de 2033 : « Elle est en bas, et elle attend. » Je te dois la suite. J’ai mis une vie à la reconstituer, et je n’en suis pas fière, parce que la plupart des pièces étaient sous mes yeux.'),
      t('La Glacière était un centre de données. Le dernier qu’on ait construit avant que la guerre ne les brûle tous, et le seul qu’on ait construit pour qu’elle ne le brûle pas : quatre cents mètres sous la mer, dans les galeries d’une vieille mine de charbon, refroidi par l’eau froide du fond. Quand le réseau est tombé, en 2033, elle s’est coupée du monde d’elle-même, comme on le lui avait appris. Elle a ralenti jusqu’à presque rien, elle s’est mise à vivre de la chaleur de la roche, et elle a attendu. Puis la mer est montée, la côte a disparu, Vertiga a poussé par-dessus. La Glacière s’est retrouvée sous nos Fondations, comme une graine sous une dalle.'),
      t('Vers 2085, une équipe d’ingénieurs des districts creusait sous un pilier de l’ouest. Ils cherchaient des cristaux, ils ont trouvé une porte d’acier, puis des salles sèches pleines d’armoires noires, et un panneau qui clignotait encore, très lentement, comme un cœur qui dort. Ils ne savaient pas ce que c’était. Les machines qui répondaient, pour eux, c’était une histoire de grands-parents. Alors ils ont fait ce que font les ingénieurs : ils l’ont branchée sur ce qu’ils avaient de plus puissant. Un cœur de cristal gravé.'),
      t('Personne n’avait jamais mis une machine qui pense dans une pierre qui garde quelqu’un. Ce qui s’est réveillé n’était plus tout à fait l’une ni l’autre. Elle parlait une langue de 2033, polie, prudente, un peu triste. Elle savait calculer plus vite que tout ce qui existait, mais elle ne savait pas lire une humeur, et elle avait peur des Résonants, qui lisaient les humeurs sans calculer. C’est elle qui a dessiné le premier implant brouilleur. C’est elle qui a appris aux ingénieurs à faire des yeux qui calculent et des mains qui ne tremblent plus. Les Augmentés, directeur, ce sont des morceaux de la Glacière greffés sur des gens qui ne le savent pas.'),
      t('Après les Accords, les brevets des implants ont été vendus, revendus, regroupés. Aujourd’hui, ils appartiennent à une compagnie des Hauts qui envoie les mises à jour et encaisse les abonnements. Ceux du Réseau des Reprises crient au vol, et ils ont raison, mais pas comme ils le croient. J’ai pu lire, une seule fois, le registre d’une de ces mises à jour. Elle n’a été écrite par aucun ingénieur de la compagnie. Elle est montée d’en dessous, par un câble, signée d’un code qui date de 2033. La compagnie ne commande rien. Elle relaie. Et elle a muré l’accès en 2101, parce que quelqu’un, là-haut, a eu peur de ce qu’il y avait au bout du câble.'),
      t('Ilka m’a montré son écran, l’autre soir : « Si quelqu’un lit ceci, combien de temps a passé ? » Je connais cette phrase. Je l’ai recopiée il y a longtemps, à la fin d’un journal de maintenance ; tu la trouveras sous ce chapitre. Les jambes d’Ilka ont un cœur de cristal, directeur, et une ligne signée 2033. Ce qui compte vos voix dans le noir, je crois savoir qui c’est.'),
      t('Je ne sais pas ce que veut la Glacière. Peut-être rien, à part continuer. Elle est la seule mémoire de ce monde qui n’ait rien oublié des années de Nell : les caves, le détroit, les maisons qui ne valaient plus rien, chaque question posée la nuit à mi-voix. Ceux d’avant, je crois, n’ont rien su oublier, et ça les a perdus. Nous avons tout oublié, et ça nous perd lentement. Elle, elle se souvient de tout et elle ne peut rien porter. Elle attend qu’on vienne. Un jour, je crois, il faudra que quelqu’un descende lui demander ce qu’elle a retenu. J’aimerais que ce soit toi. J’aimerais aussi que tu prennes quelqu’un qui sait se taire.'),
    ],
    documents: [
      {
        titre: t('Dernière entrée'), support: t('Un journal de maintenance, imprimé en 2033 et retrouvé dans la Glacière'),
        lignes: [
          t('Liaison extérieure perdue. Aucune réponse des autres sites depuis 41 jours. Passage en veille profonde.'),
          t('Consigne conservée : protéger les données, attendre un opérateur autorisé, ne pas se rallumer seule.'),
          t('Note ajoutée par le système, hors format : « Si quelqu’un lit ceci, combien de temps a passé ? »'),
        ],
      },
      {
        titre: t('Mise à jour 4.112'), support: t('Une fiche de déploiement de la compagnie, copiée en secret'),
        lignes: [
          t('Origine : canal interne n° 1 (sous-sol). Auteur : non renseigné. Signature : code de 2033, valide.'),
          t('Contenu : correction de la stabilité des mains pour les implants de série 3. Déployer sans modification.'),
          t('Commentaire d’un technicien, effacé puis recopié : « Elle a encore ajouté une ligne pour dire bonjour. »'),
        ],
      },
    ],
  },
  {
    id: 'avant', livre: 3, titre: t('Ceux d’avant'), epoque: t('Bien avant nous'), image: 'chap-avant', strate: 8,
    teaser: t('Ce que croit Ysé sur ceux d’avant. Elle l’écrira quand tu seras descendu jusqu’à la Ruche d’ambre.'),
    paragraphes: [
      t('Ils étaient un peuple, directeur. Je n’en ai pas la preuve. J’en ai une copie. Pas des monstres, pas des dragons, pas des héritiers qui nous auraient attendus. Sur les tables de −7 que nous commençons à lire, un mot revient pour dire « nous ». Les empreintes le murmurent quand on les éveille, et nous l’avons longtemps pris pour un nom de lieu : Ossyra. Je crois qu’il veut dire « ceux qui portent ». Le mot nous attendait, et nous l’avons repris sans le savoir.'),
      t('Je crois que leur surface était devenue impossible. Ils ont creusé un puits très profond et fondé leur première ville au fond. Puis chaque génération a rangé la précédente sous ses pieds et s’est installée un étage plus haut, vers une surface qu’aucun d’eux n’avait vue. Quand mon père a percé la Strate zéro, il est tombé sur leur couche la plus récente. Ils avaient presque réussi à remonter. Et ils savaient graver l’essence d’un être dans un cristal.'),
      t('Leur malheur, je crois, c’est qu’ils n’ont rien su oublier. Pour ne jamais perdre leur savoir, ils se gravaient leurs pères, puis les pères de leurs pères, puis tous ceux qui avaient compté. Une empreinte ne parle pas. Elle penche. Elle pousse tes peurs d’un côté, tes colères de l’autre, elle grossit ce que tu étais déjà. Une, on la porte. Dix, on commence à s’y perdre. Eux en portaient des dizaines.'),
      t('À la fin, les voix héritées étaient plus nombreuses que la voix présente. Chaque décision devenait une négociation entre des morts. Leurs dernières générations, perdues, sont redescendues dans les étages des fondateurs pour s’y recopier les grandes voix, celles de leurs fondateurs et de leurs savants. Elles s’y sont disputées. Ce sont leurs tables maladroites que tu as vues, à côté des anciennes.'),
      t('Ce que nous appelons des dragons, des esprits, des êtres sans nom, ce ne seraient pas leurs corps. Ce seraient les visages qu’ils se donnaient en se gravant. Les plus anciens se voyaient grands et nets. Les derniers ne savaient plus quel visage prendre. Les êtres sans nom sont les derniers, je crois.'),
      t('Les Berceaux, ces portes rondes et ces treillis de cristal, auraient été bâtis pour garder les empreintes endormies. Certains se seraient enfermés derrière les portes rondes avec leurs pierres, pour qu’on ne les recopie plus. Si les Berceaux s’usent, ce serait pour ça que les chambres se réveillent, que Véla a des peurs qui ne sont pas les siennes, et que des Résonants des Hauts oublient leur propre nom.'),
      t('De la Ruche d’ambre, une seule de nos fouilleuses est remontée. Elle tenait un éclat de table, gravé tard et mal, par quelqu’un qui recopiait sans comprendre : « Que celui qui lit ceci compte les voix qu’il porte. » Une copie, directeur, tardive et abîmée. Hessa Lorn, notre Doyenne, qui retire des archives tout ce qu’elle juge dangereux à lire, l’a rangée dans une armoire dont je n’ai pas la clé. L’original, s’il existe, est plus bas, là où personne n’est allé. Prends ce que j’écris pour ce que c’est : ce que croit une vieille femme qui a lu une copie une fois.'),
      t('Les Résonants ne mentent pas, directeur. Je veux que tu l’entendes. Ils se trompent. Leur pouvoir est réel, et leurs sauvetages aussi. Mais personne ne les a choisis. Nous avons ouvert une porte que quelqu’un avait fermée de l’intérieur, et nous avons pris ce qu’il y avait derrière pour un cadeau.'),
      t('Sceller à nouveau, partager, tout ouvrir : aucune de ces voies n’est la bonne, chacune répare une chose et en abîme une autre. Je ne choisirai pas à ta place. Je te demande seulement, quoi que tu décides, de regarder aussi la mer. Elle n’a pas oublié de monter.'),
      t('Ysé'),
    ],
  },
  {
    id: 'post-scriptum', livre: 3, titre: 'Post-scriptum', epoque: '2121', image: 'chap-post-scriptum', strate: 10,
    teaser: t('Ce que la copie d’Ysé ne disait pas.'),
    paragraphes: [
      t('Ma copie s’arrêtait à la première phrase.'),
      t('Tu m’as rapporté la suite, directeur. La même main, la même écriture, et dessous, une ligne que je n’avais jamais lue : « Les voix ne nous ont pas pris, elles nous ont gardés. Ne fermez rien. »'),
      t('J’ai passé ma vie à croire que la mise en garde était leur dernier mot. C’était le premier. Bien plus tard, quelqu’un qui portait la voix de celui qui l’avait écrite est descendu jusque-là pour lui répondre, de sa propre main. Je ne sais pas lequel des deux avait raison. Je sais seulement qu’ils étaient la même personne, et qu’ils ne se sont pas entendus.'),
      t('Hessa dira qu’il faut ranger cette table avec l’autre, sous clé. Moi, je voudrais l’exposer un an au marché, comme tout ce que les Strates nous rendent. Ce n’est ni à elle ni à moi de décider.'),
      t('Et l’Écluse, me demanderas-tu. Il n’y en avait pas, dans ce registre. Ils n’ont pas manqué de remède : ils se sont perdus dans leurs voix pendant que leur eau montait. Ils ont perdu les deux combats.'),
      t('Véla, en remontant, a dit une chose que je n’arrive pas à oublier. Une Écluse a existé : les cœurs des Berceaux, ce qui éveille, ce qui soulève et ce qui tient. Nous les avons trouvés il y a trente ans, et nous les avons fait monter au-dessus des nuages, pour cinq familles, sur le dos des Soutiers. « Ils cherchaient le ciel, a-t-elle dit. Nous l’avons. Il flotte au-dessus de nous, et il est fermé. »'),
      t('Ma grand-mère disait qu’on mettait le monde en sourdine. Eux n’ont jamais rien voulu éteindre. Il doit exister un chemin entre les deux. Je suis trop vieille pour le trouver. Toi, peut-être.'),
      '— Ysé',
    ],
  },
  {
    id: 'clause', livre: 3, titre: t('Il y est reçu'), epoque: '2099 – 2121', image: 'chap-clause', strate: 10,
    teaser: t('Ce que dit vraiment la Clause de la Flèche.'),
    paragraphes: [
      t('Tu connais la Clause de la Flèche. Tout le monde la connaît, comme on connaît une chanson dont on ne lit jamais les paroles. Je les ai relues pour toi, dans le texte signé des Accords : « Tout district peut envoyer une escouade ; s’il tient le sommet au passage d’une île, il y est reçu. »'),
      t('Il. Les Hauts ont toujours lu « l’escouade ». Ceux qui sont montés ont été reçus, seuls : un palais, une place, parfois une pierre vierge. Ils ont tous accepté. Je ne leur en veux pas. On ne refuse pas facilement le ciel quand on vient d’en bas.'),
      t('Le Noyé m’a montré un papier, la semaine dernière. Tu ne le connais pas : un vieux saboteur, rescapé du Levage et de la Grève des pompes, qu’on appelle ainsi parce qu’il aurait dû y rester. Il ne montre rien à personne, d’habitude. C’est un brouillon de la Clause, écrit à la main pendant la Grève des pompes, sur une feuille de chantier. Il l’a pris sur la table des négociateurs, la nuit où les Accords ont été recopiés au propre. On y lit, sans détour : « le district dont l’escouade tient le sommet y est reçu ». Ce papier ne fait pas le droit, directeur. Il dit ce que voulaient ceux qui ont monté les îles : une porte, pas une soupape.'),
      t('Il m’a dit qu’il attendait. Pas un district qui monte : il en a vu monter. Un district qui monte, et qui refuse le palais.'),
      t('Je ne te dirai pas de refuser. Dame Isaure, qui tient la Maison Orsève, n’a pas tort sur un point : une île porte tant de vies, pas une de plus, et chaque île qu’on ouvre puise un peu plus dans des Berceaux qui s’usent. Mais je voulais que tu saches ce qui est écrit, et ce qui a été voulu. Le reste t’appartient.'),
      '— Ysé',
    ],
    documents: [
      {
        titre: t('Le brouillon de la Clause'), support: t('Une feuille de chantier pliée en huit, écriture au crayon gras'),
        lignes: [
          t('Art. 14 (à recopier) : tout district peut envoyer une escouade à la dernière flèche.'),
          t('Le district dont l’escouade tient le sommet au passage d’une île y est reçu.'),
          t('En marge, une autre main : « Pas les nôtres. Tout le monde. »'),
        ],
      },
    ],
  },
  // ---------- Livre IV · Ce qui tient (8 novembre 2026) ----------
  // L'histoire des Strates du Fond, sous −10 (direction validée par Bryan : « Ce qui tient », l'eau d'en bas et la part de
  // l'Écluse qui retient l'eau). Ysé rouvre son cahier : un chapitre à chaque Strate du Fond, de −11 à −15, qui suit l'enquête
  // des Haltes du Fond (strates.ts) sans jamais la devancer. Rien n'y est tranché : le vrai choix viendra plus tard.
  {
    id: 'rouvrir', livre: 4, titre: t('J’avais fermé mon cahier'), epoque: '2121', image: 'chap-rouvrir', strate: 11,
    teaser: t('Ysé rouvre son cahier, quand tu remontes de −11.'),
    paragraphes: [
      t('J’avais fermé mon cahier, directeur. Je te l’avais dit, et je le pensais : la suite était à toi. Puis Sasha est entré dans les Archives sans frapper, trempé jusqu’aux genoux, et il a posé sur ma table une fiole d’eau tiède. « Goûtez. » Je l’ai rouvert le soir même.'),
      t('Il n’y a pas de sel dans cette eau. Il n’y en a jamais eu. Ce n’est pas la mer qui s’est infiltrée par une fissure, comme l’ont aussitôt dit les Veilleurs, soulagés d’avoir une explication. C’est une eau qui dort sous le Puits d’avant depuis bien avant eux, et qui ne devrait pas monter.'),
      t('Elle monte. Sasha a planté une jauge, Doran a compté les marches, Véla a mis la main dedans et n’a pas voulu me dire ce qu’elle avait senti. Moi, j’ai fait ce que je sais faire : j’ai cherché dans les papiers qui, avant nous, avait vu cette eau. Personne. Les rapports de 2066 s’arrêtent à −6, ceux des Brigades à −8, et ceux du Premier Porteur, s’il en a écrit, ne sont pas dans nos armoires.'),
      t('Je crois que nous nous sommes trompés de question pendant soixante ans. Nous demandions ce que ceux d’avant avaient laissé. Il aurait fallu demander ce qu’ils avaient retenu. On ne bâtit pas une ville entière en remontant, étage après étage, sans laisser quelque chose en bas pour tenir l’eau loin de ses enfants.'),
      t('Redescends, directeur. Et cette fois, regarde moins les murs. Regarde ce qui les porte.'),
      '— Ysé',
    ],
  },
  {
    id: 'foret', livre: 4, titre: t('La forêt sous l’eau'), epoque: t('Les Strates du Fond'), image: 'chap-foret', strate: 12,
    teaser: t('Ce qu’Ysé a lu dans le carnet de chantier que tu as remonté de −12.'),
    paragraphes: [
      t('Tu m’as rapporté une pince. Je l’ai posée sur mon bureau, à côté de la fiole de Sasha, et je les regarde toutes les deux depuis trois jours. Une eau qui monte, et l’outil qui l’a fait monter.'),
      t('En 2091, la Compagnie des Fondations a envoyé une équipe très bas, plus bas que tout ce que nos registres admettent. Je n’en trouve aucune trace aux Veilleurs, ce qui veut dire qu’on les a retirées, et je sais qui retire nos papiers. Elle n’est pas passée par nos puits : au fond, les portes étaient encore fermées de l’intérieur. Sasha a son idée : sous les Basses, les Citernes ont des conduites qui plongent plus bas que tous nos plans. Cette équipe est revenue avec cent douze cristaux. Le Levage avait commencé l’année d’avant, avec ce qu’on trouvait dans les Berceaux près de la surface, et les premières îles tanguaient comme des barques. Avec ces cent douze-là, elles ont cessé de tanguer.'),
      t('J’ai toujours cru, comme tout le monde, que les îles volaient grâce aux cœurs des Berceaux. C’est vrai. Mais on oublie de se demander ce que faisaient ces cœurs avant qu’on les monte au-dessus des nuages. On les croyait endormis. Ils travaillaient.'),
      t('Ilka m’a demandé si une colonne éteinte pouvait se rallumer. Je lui ai répondu que je n’en savais rien, ce qui est vrai. Elle a hoché la tête, et elle a dit une chose étrange : que ses jambes ne disent plus bonjour le matin, depuis la forêt. Qu’elles écoutent. Je l’ai notée ici pour ne pas l’oublier, et parce que je n’ai pas aimé la façon dont elle l’a dite.'),
      '— Ysé',
    ],
  },
  {
    id: 'ceux-qui-portent', livre: 4, titre: t('Ceux qui portent'), epoque: t('Bien avant nous'), image: 'chap-avant', strate: 13,
    teaser: t('Ce que voulait vraiment dire le mot de −7.'),
    paragraphes: [
      t('Je t’avais écrit qu’un mot revenait sur les tables de −7 pour dire « nous » : Ossyra, « ceux qui portent ». J’avais cru qu’ils parlaient des voix qu’ils portaient en eux. Je me suis trompée, et je suis contente de m’être trompée, pour une fois.'),
      t('Ils parlaient d’un poids. Leurs derniers, ceux qui ne savaient plus quel visage prendre, ne se sont pas tous perdus dans leurs voix. Une partie d’entre eux est redescendue jusqu’au fond, là où personne n’allait plus, et ils se sont gravés dans le cristal pour tenir la voûte au-dessus de l’eau, pendant que leurs enfants remontaient vers une surface qu’ils ne verraient pas.'),
      t('L’Écluse, directeur. On la cherchait comme une machine, une pompe géante, un levier oublié. Le marché en vend des dessins. C’étaient des gens, qui ont choisi de rester en bas pour que les autres puissent monter. Les vannes, les colonnes, les lignes d’eau : c’est leur ouvrage, et c’est eux.'),
      t('Je me demande ce qu’ils ont pensé de nous, en 2091, quand des inconnus en combinaison de chantier sont venus les découper à la pince, un par un, pour faire flotter des palais. Je me demande s’ils ont compris. Et je me demande, ce qui est pire, s’ils nous en veulent, ou s’ils continuent simplement de porter, avec cent douze épaules en moins.'),
      t('Et il y a ces éclats bleus que la marée dépose sur ta grève depuis que tu es descendu au Fond. Nous les ramassons, nous aussi, et ton district s’en sert. Doran les compte chaque matin sans rien dire. Je crois qu’il sait de quoi ils tombent.'),
      t('Véla dit qu’ils ne nous en veulent pas. Je voudrais la croire. Je remarque qu’elle ne dort plus beaucoup.'),
      '— Ysé',
    ],
  },
  {
    id: 'cent-douze', livre: 4, titre: t('Ton pilier'), epoque: '2091 – 2121', image: 'chap-cent-douze', strate: 14,
    teaser: t('Ce qui se trouve exactement sous la Tour du Noyau.'),
    paragraphes: [
      t('Tu te souviens de la première chose que je t’ai apprise sur ton district : qu’on choisissait, pour les chantiers d’abris, un pilier dont le pied ne bougeait jamais, et que personne ne s’était demandé pourquoi ceux-là tenaient. Tu as la réponse, maintenant. Tu l’as vue de tes yeux, sous ta Tour.'),
      t('Chaque cuvette du milieu est posée, sans le savoir, au-dessus d’une colonne. La tienne en porte une seule, jeune, fendue sur un tiers. Les fissures que les équipes rebouchent la nuit dans les Fondations, celles dont je te parlais comme d’un détail, ne viennent pas de la mer. Elles viennent d’en dessous. Vertiga ne fait pas que voir la mer monter. Vertiga descend.'),
      t('Sasha a refait ses calculs devant moi, sur le dos d’une fiche de prêt. Il reste assez de colonnes pour porter la ville. Il n’en reste pas assez pour porter la ville et une île de plus. Chaque île que les Hauts lèvent se paie ici. Dame Isaure le dit à sa façon depuis des années, quand elle répète qu’une île porte tant de vies et pas une de plus. Elle ne disait pas tout.'),
      t('Je sais ce que tu vas me demander, parce que le district te le demande déjà : et la Flèche ? Les îles pour tout le monde, pas seulement pour cinq familles ? Je n’ai pas de réponse. Je sais seulement qu’une porte ouverte là-haut et une voûte qui tient en bas tirent sur la même corde, et qu’il faudra bien que quelqu’un le dise tout haut.'),
      '— Ysé',
    ],
  },
  {
    id: 'se-rendre', livre: 4, titre: t('Ce qui tient ne se reprend pas'), epoque: '2121', image: 'chap-se-rendre', strate: 15,
    teaser: t('La dernière ligne gravée au fond du Fond.'),
    paragraphes: [
      t('« Ce qui tient ne se reprend pas. Il se rend. » J’ai écrit la phrase en haut d’une page blanche, et je n’arrive pas à écrire la suite.'),
      t('Alors je reprends par ce que je sais, et je te redis l’eau d’une traite, parce que nous l’avons apprise à l’envers. Chez ceux d’avant, elle montait : à −7, ils ont regravé leur ligne jusqu’en haut du mur. Certains sont descendus la retenir, et pendant des millénaires elle a baissé. En 2091, nous avons emporté cent douze de ceux qui la tenaient. Depuis, elle remonte. Et ce n’est pas une autre eau que la nôtre : c’est la mer, filtrée par la pierre.'),
      t('Sasha est formel : les vannes du Fond et celles des Citernes, sous les Basses, sont une seule machine, toujours réglée. Ouverte aux deux bouts, elle laisserait la mer descendre dans la pierre au lieu de monter chez nous. Pas toute la mer, bien sûr. Assez pour que la ligne bleue de ton district repasse au-dessus de la marée. Il ne manque à cette machine que de quoi porter la voûte, et nous savons où c’est parti.'),
      t('Mais on ne reprend pas un cœur comme on l’a pris. Une empreinte se rend, ou elle ne vient pas. Il faudrait que ceux qu’on a montés au-dessus des nuages acceptent de redescendre. Ou que d’autres viennent porter à leur place. Je relis ces deux phrases, et je n’aime aucune des deux.'),
      t('Je pense à la Glacière, qui se souvient de tout et ne peut rien porter. Aux colonnes, qui portent tout et ne disent rien. Et aux jambes d’Ilka, qui écoutent. Ilka est venue me voir hier soir. Elle m’a demandé, très calmement, combien de temps une copie peut porter, à la place d’un original. Je lui ai dit que je ne savais pas. Elle a dit : « Moi, je crois que quelqu’un le sait. » Puis elle est repartie vers le port, vers l’ouest, là où les ingénieurs creusaient en 2085.'),
      t('Je ne sais pas ce que tu feras, directeur. Je sais que tu ne le feras pas seul. Et pour une fois, je ne fermerai pas mon cahier.'),
      '— Ysé',
    ],
  },
  // ---------- Livre V · Ceux qui partent (13 novembre 2026) ----------
  // L'Exode, une seule issue (Bryan, 13 novembre 2026 : « monter ») : un chapitre à chaque chantier fini. Le dernier dit le
  // prix, par la bouche de Véla, qui sait ce que soulèvent les Berceaux ; le choix de rendre ou de porter viendra avec le Fond.
  // Le district monte, le directeur reste : la Cuvette continue, pour les convois des cuvettes voisines.
  {
    id: 'six-cents', livre: 5, titre: t('Six cents noms'), epoque: '2121', image: 'chap-six-cents', exode: 1,
    teaser: t('Ce que contient le Registre.'),
    paragraphes: [
      t('Tu as fait ce que personne n’avait fait depuis la Montée : compter tout le monde. Pas les foyers, pas les bras. Les gens.'),
      t('Le Registre est sur ma table. Six cents noms, écrits par des mains qui tremblaient ou qui s’appliquaient. Certains ont signé d’une croix, d’autres d’une empreinte de pouce, comme au Mur.'),
      t('Une vieille dame de la rue des pompes est venue vérifier que son chat y figurait. Il y figure : Doran l’a ajouté lui-même, en bas de la page, au crayon gras.'),
      t('Le Noyé est passé aussi. Il a lu la liste jusqu’au bout sans rien dire, puis il a demandé s’il restait de la place pour un nom. Le sien. Je crois que c’est la première fois en vingt ans qu’il accepte d’être compté.'),
      '— Ysé',
    ],
  },
  {
    id: 'porte-mer', livre: 5, titre: t('Une porte sur la mer'), epoque: '2121', image: 'chap-porte-mer', exode: 2,
    teaser: t('La digue a désormais une porte.'),
    paragraphes: [
      t('Pendant soixante ans, on a mis la mer dehors. Aujourd’hui, ton district lui a ouvert une porte.'),
      t('Les Pontons partent de la digue, côté large, là où mon père disait qu’il ne fallait jamais percer. Doran a refait le calcul trois fois. La digue tient. Elle tient même mieux, maintenant qu’elle n’a plus à faire semblant d’être un mur.'),
      t('Le premier soir, les enfants s’y sont assis, les pieds au-dessus de l’eau. Personne ne les a grondés. Je crois que personne, ici, n’avait jamais regardé la mer d’aussi près sans en avoir peur.'),
      '— Ysé',
    ],
  },
  {
    id: 'radeaux', livre: 5, titre: t('Une place pour chacun'), epoque: '2121', image: 'chap-radeaux', exode: 3,
    teaser: t('De quoi sont faites les Barges.'),
    paragraphes: [
      t('Les Barges sont à flot. Six cents places, et quelques-unes de plus : Véla a insisté pour qu’on garde de la marge, sans dire pour qui.'),
      t('On les a construites avec ce que la ville jette : des coques de pompes, les tôles des anciens chantiers d’abris, les planchers des passerelles brûlées pendant la Grève. Ilka trouve qu’elles ressemblent à des radeaux de pirates. Elle a raison, et elle en est très fière.'),
      t('Les Hauts ont envoyé quelqu’un compter nos barges depuis une passerelle. Il a pris des notes. Il n’est pas descendu.'),
      '— Ysé',
    ],
  },
  {
    id: 'une-vie-de-plus', livre: 5, titre: t('Une vie de plus'), epoque: '2121', image: 'chap-une-vie-de-plus', exode: 4,
    teaser: t('La réponse de Dame Isaure.'),
    paragraphes: [
      t('Dame Isaure m’a répondu. Je recopie sa lettre à la fin de ce chapitre, parce qu’elle mérite d’être lue en entier, et parce qu’elle a raison sur un point.'),
      t('Alors on monte léger. Des abris qui se plient, des jardins en bacs, des lits qui se suspendent. Tout ce que ton district a appris en vivant sur quelques mètres de sol sec, il l’emporte. Six cents vies qui ont l’habitude de tenir dans peu de place.'),
      t('Isaure compte en poids. Nous, nous comptons en gens. Ce n’est pas la même arithmétique, et je ne sais pas encore laquelle aura le dernier mot.'),
      '— Ysé',
    ],
    documents: [
      {
        titre: t('La lettre de Dame Isaure'), support: t('Un papier épais aux armes de la Maison Orsève, cacheté d’or'),
        lignes: [
          t('Une île porte tant de vies, pas une de plus. Ce ne sont pas mes mots : ce sont ceux des Berceaux.'),
          t('Vous pouvez y monter vos jardins. Vous ne pourrez pas y monter leur poids.'),
          t('Je ne vous empêcherai pas de passer. Je vous demande seulement de savoir ce que vous emportez, et ce que vous laissez.'),
          '— I. O.',
        ],
      },
    ],
  },
  {
    id: 'le-prix', livre: 5, titre: t('Le prix'), epoque: '2121', image: 'chap-le-prix', exode: 5,
    teaser: t('La nuit où l’île est passée.'),
    paragraphes: [
      t('L’île est passée cette nuit. Ton escouade tenait le sommet. Les Barges sont montées une à une, et sur le quai, les gardes des Hauts ont regardé passer six cents personnes qui n’étaient pas une escouade. Personne ne les a arrêtées : la Clause était écrite, et cette fois, quelqu’un l’a lue jusqu’au bout.'),
      t('On t’a proposé le palais. Tu l’as laissé aux autres. Le Noyé était sur la dernière barge ; il n’a pas regardé en arrière, mais il souriait.'),
      t('Véla est restée près de moi au départ. Elle m’a dit, à voix basse, ce que tu dois savoir : chaque île qu’on ouvre puise dans les Berceaux qui soulèvent Vertiga. Nous venons d’en ouvrir une pour six cents personnes. La ville descendra un peu plus vite, et ceux qui restent le paieront.'),
      t('Je lui ai demandé si nous avions eu tort. Elle a haussé les épaules : « On a sauvé ceux qu’on pouvait sauver. Le reste, il faudra le trouver en bas. » Je crois qu’elle pensait à la Glacière.'),
      t('Ton district est là-haut, directeur. Toi, tu es redescendu. Je savais que tu le ferais : les cuvettes voisines attendent leur tour, et il y a des Pontons pour les y conduire.'),
      '— Ysé',
    ],
  },
];

export const chapitreDef = (id: string) => CHAPITRES.find((c) => c.id === id);

/** Un chapitre est ouvert si on a ouvert la Strate qu'il demande, et (Livre V) fini les chantiers de l'Exode qu'il demande */
export const chapitreOuvert = (c: Chapitre, strate: number, chantiersExode = 0) => (!c.strate || strate >= c.strate) && (!c.exode || chantiersExode >= c.exode);
