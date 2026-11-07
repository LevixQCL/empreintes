// Le contenu des Strates (31 octobre 2026, Bryan : « mettre le lore en évidence dans les Strates, pas juste des combats en chaîne »,
// « des points de passage obligatoires pour mettre le lore en place », puis « que les Strates aient plus d'intérêt »).
// Conception relue par un game designer (docs/strates-contenu.md) : tout se passe sur la carte, rien ne touche au combat.
// - les Haltes : une salle par où passent tous les chemins, au milieu de la Strate ; une Halte de plus à chaque descente ;
// - la particularité de chaque Strate : un réglage de sa carte, tiré de son lore ;
// - la quête longue de chaque Strate : une marque ✦ par descente, qui avance aussi pendant les fouilles ;
// - les passages secrets que seuls certains Porteurs repèrent, les portes à Fréquence (−5 et plus), la lampe à algues ;
// - le bestiaire : une fiche par ennemi, qui s'ouvre à force de le vaincre.
// Ce fichier ne contient que les textes et les réglages, sans DOM.

/** Une voix : un Porteur (s'il est debout dans l'escouade), ou le récit ('') quand personne n'est là pour parler */
export interface Voix { qui: string; texte: string; /** dite seulement si ce drapeau a été posé (un choix d'une Halte d'avant) */ si?: string }

/** Ce qu'apporte un choix de Halte : jamais de PV, jamais d'effet de combat (revue du game designer) */
export type EffetHalte = 'composants' | 'eclat' | 'lampe';

export interface ChoixHalte {
  texte: string;
  effet: EffetHalte;
  recit: string;
  /** un souvenir du choix, que les Haltes et les gardiens reprennent plus tard */
  drapeau?: string;
}

export interface DetailHalte {
  /** ce qu'on touche : « Les noms », « Une traînée qui brille » */
  nom: string;
  /** dans l'ordre : la première voix dont le Porteur est debout parle ; la dernière, sans Porteur, sert de secours */
  voix: Voix[];
}

export interface HalteDef {
  strate: number;
  /** 1, 2 ou 3 : la Halte de la 1re, 2e ou 3e descente dans la Strate */
  n: number;
  titre: string;
  recit: string;
  details: DetailHalte[];
  choix: [ChoixHalte, ChoixHalte];
  /** ce que le directeur en retient, écrit dans son carnet (Bibliothèque, onglet Campagne) */
  fait: string;
}

/** Nombre de Haltes d'une Strate : il faut environ autant de descentes que la profondeur, d'où 1 à −1, 2 à −2, 3 ensuite */
export const nombreHaltes = (strate: number) => (strate >= 1 && strate <= 10 ? Math.min(3, strate) : 0);

const H = (strate: number, n: number, titre: string, recit: string, details: DetailHalte[], choix: [ChoixHalte, ChoixHalte], fait: string): HalteDef =>
  ({ strate, n, titre, recit, details, choix, fait });
const d = (nom: string, ...voix: Voix[]): DetailHalte => ({ nom, voix });
const v = (qui: string, texte: string, si?: string): Voix => (si ? { qui, texte, si } : { qui, texte });

// Les Haltes, réécrites le 3 novembre 2026 (Bryan : « il faut quelque chose de vraiment intéressant à lire, pas du blabla »).
// Chaque Strate mène une petite enquête : la Halte I pose une question, la II donne un indice, la III une révélation.
// Chaque zone fait tomber une certitude, avec le type de preuve de la Bible (« Les Strates zone par zone ») :
// les Seuils, une mesure qu'on peut refaire ; les Salles closes, des objets et leurs traces d'usage ; les Registres,
// des témoignages vrais mais incompatibles ; le Fond, le document. La vérité sur ceux d'avant n'est dite qu'à −10.
// Chaque souvenir posé par un choix revient plus tard (une Halte, une scène de gardien, la lettre d'Isaure).
export const HALTES: HalteDef[] = [
  // ---------- −1 · Les Pompes noyées ----------
  H(1, 1, 'Le mur des fouilleurs',
    'Un pilier des pompes, couvert de noms grattés au couteau. Les fouilleurs de Vertiga y écrivent le leur avant de descendre, et le barrent quand ils remontent.', [
      d('Les noms', v('doran', 'Le nom de mon père est là, daté de 2066. Jamais barré. Il est remonté, pourtant. Il n’a jamais voulu le barrer.'), v('', 'Des centaines de noms, barrés ou non. Les plus anciens datent de 2066.')),
      d('Le pied du pilier', v('sasha', 'Le plan dit : béton jusqu’au roc. Regarde : le pilier est posé sur une marche taillée, de niveau au millimètre. Personne chez nous ne taille comme ça.'), v('doran', 'Nos plans disent béton jusqu’au roc. Il n’y a pas de roc. Le pilier est posé sur une marche taillée. Une marche, directeur.'), v('', 'Le pilier ne repose pas sur la roche, mais sur une large marche de pierre taillée, parfaitement plane.')),
      d('Sous la marche', v('vela', 'Usée au milieu, comme les marches de la Tour, mais trop haute pour nos jambes. Des milliers de pieds sont passés là, et pas des nôtres. Et sous cette marche, il y en a une autre.'), v('ilka', 'Il y a une autre marche dessous. Et encore une. Un escalier. Sous nos pompes, il y a un escalier.'), v('', 'Sous la marche, une autre, puis une autre : un escalier aux marches trop hautes, qui s’enfonce dans l’eau noire.')),
    ], [
      { texte: 'Graver ton nom', effet: 'composants', drapeau: 'nom-grave', recit: 'Tu graves ton nom sous celui des autres. Juste en dessous, un fouilleur a laissé quelques pièces pour le suivant. Elles sont à toi.' },
      { texte: 'Mesurer la marche', effet: 'eclat', drapeau: 'mesure-marche', recit: 'Fil à plomb, mètre ruban : 2,10 m de large, de niveau parfait. Les Fondations de ton district reposent sur l’escalier de quelqu’un d’autre. Dans une fente de la marche, un Éclat.' },
    ],
    'Les piliers de mon district ne reposent pas sur la roche. Ils sont posés sur un escalier de pierre taillée, qui descend sous l’eau.'),

  // ---------- −2 · Les Abris murés ----------
  H(2, 1, 'Le registre des abris',
    'Un abri de 2060, entrouvert. Sur le mur, un registre peint : les quarante familles qui y ont dormi pendant les grandes crues.', [
      d('Le registre peint', v('ilka', 'La moitié de ces familles, je leur livre encore le pain. Aucune ne m’a jamais parlé de cet abri.'), v('', 'Quarante noms de familles, peints en blanc. Presque tous du quartier.')),
      d('Le plâtre fendu', v('sasha', 'Ça sonne creux. Derrière le plâtre, ce n’est pas de la brique : c’est un treillis de cristal. On a monté l’abri contre quelque chose qui était déjà là.'), v('doran', 'Derrière le plâtre, un treillis de cristal. Les maçons de 2060 l’ont couvert sans poser de questions. Pendant les crues, on n’en posait pas.'), v('', 'Par une fente du plâtre, on voit luire un treillis de cristal.')),
      d('Un cristal tombé', v('vela', 'Tombé d’un sac de pilleur. Il ne veut pas remonter avec nous. Il veut rejoindre les autres, plus bas. On dirait qu’il a peur de rester en haut.'), v('', 'Un petit cristal tombé d’un sac luit faiblement sur les marches.')),
    ], [
      { texte: 'Laisser descendre le cristal', effet: 'eclat', drapeau: 'cristal-libre', recit: 'Tu poses le cristal sur la dernière marche. Il roule vers le bas, plus vite que la pente ne le voudrait. Là où il était, un Éclat est resté.' },
      { texte: 'Le garder pour le district', effet: 'composants', recit: 'Tu le ranges dans le sac. Le district en tirera un bon prix. Il pèse plus lourd qu’il ne devrait.' },
    ],
    'Les abris de 2060 ont été montés contre un treillis de cristal. Pendant les crues, quarante familles ont dormi dans un Berceau sans le savoir.'),
  H(2, 2, 'La galerie des Chouettes',
    'La galerie effondrée de 2104. Six enfants mués pour les fouilles de nuit y ont guidé vingt adultes dans le noir, trois jours durant. L’éboulis est dégagé depuis longtemps. Les mains peintes sont restées.', [
      d('Les mains peintes', v('nuit', 'Six mains d’enfant, à hauteur de hanche. La promotion d’avant la mienne. On nous les montrait, petits, pour nous donner du courage.'), v('', 'Six petites mains peintes à hauteur de hanche, et une date : 2104.')),
      d('La cause', v('sasha', 'Les infos ont dit « infiltration ». Regarde les bords de l’éboulis : c’est du cristal brisé, pas de la roche. Ils ont percé un treillis, comme celui de l’abri. C’est le treillis qui a cédé.'), v('ilka', 'Les infos ont dit « infiltration ». Les bords sont en cristal cassé. Ils ont percé un treillis et tout est tombé. Ça, personne ne l’a dit.'), v('', 'Les bords de l’éboulis sont de cristal brisé, pas de roche.')),
      d('La gaine', v('doran', 'La gaine par où ils sont sortis. Elle n’était sur aucun plan. Ce n’est pas une gaine de chez nous : ronde, lisse, sans une trace d’outil. Et elle ne descend pas. Elle monte.'), v('', 'Une gaine ronde et lisse, qui n’était sur aucun plan, s’élève dans la roche.')),
    ], [
      { texte: 'Ajouter ta main', effet: 'eclat', drapeau: 'main-chouette', recit: 'Tu poses ta main dans la peinture, à côté des leurs, à ta hauteur à toi. Un jour, un enfant saura qu’un directeur est passé par là. Contre la plinthe, un Éclat.' },
      { texte: 'Explorer la gaine', effet: 'composants', drapeau: 'gaine', recit: 'La gaine monte en spirale, lisse comme l’intérieur d’un coquillage, sur des dizaines de mètres, sans une marche ni une prise. Au premier coude, du matériel oublié par les secours de 2104.' },
    ],
    'L’éboulement des Chouettes, en 2104, n’est pas venu de l’eau : on avait percé un treillis de cristal. Et la gaine qui les a sauvés n’est sur aucun plan : ronde, lisse, sans une trace d’outil.'),

  // ---------- −3 · La Galerie aux lueurs ----------
  H(3, 1, 'La dernière lampe',
    'Ici s’arrêtent les lampes humaines. Une lanterne de fouilleur pend à un clou, éteinte. Plus loin, tous les puits de Vertiga débouchent dans la même nuit.', [
      d('La lanterne', v('ilka', 'Personne n’a jamais accroché de lampe plus loin. Les fouilleurs disaient : « Après le clou, c’est le noir qui décide. »'), v('', 'Une lanterne à algues pend à un clou. Personne n’en a jamais accroché plus loin.')),
      d('Les autres puits', v('doran', 'Là, le puits des Hauts-Ponts. Là, celui du marché. Chaque district croit avoir son trou à lui. En bas, c’est le même noir pour tout le monde.'), v('', 'Des bouches de puits s’ouvrent dans la voûte, une par district. Toutes donnent ici.')),
      d('Une lueur au loin', v('nuit', 'La rampe en laiton du Puits Zéro. Les visiteurs y descendent depuis soixante ans, et ils regardent tous le plafond. Personne ne regarde le sol.'), v('vela', 'Le Puits Zéro, là-bas. On y vend des souvenirs en plastique. Tout le monde lève les yeux. Personne ne les baisse.'), v('', 'Au loin, la lueur de la rampe de visite du Puits Zéro.')),
    ], [
      { texte: 'Prendre la lanterne', effet: 'lampe', recit: 'Tu rallumes la lanterne avec une poignée d’algues. Sa lumière perce le brouillard des deux salles suivantes.' },
      { texte: 'Laisser le clou au noir', effet: 'eclat', drapeau: 'clou-respecte', recit: 'Tu laisses la lanterne à son clou, comme les fouilleurs avant toi. Sous le clou, un Éclat brille : quelqu’un d’autre l’y avait laissé, par respect.' },
    ],
    'À −3, tous les puits de Vertiga débouchent dans la même nuit. Au loin brille le Puits Zéro, où l’on descend depuis soixante ans pour regarder le plafond.'),
  H(3, 2, 'Le message des patrouilles',
    'Sur un pilier, des flèches tracées à la craie, et des chiffres. Les Brigades se sont repérées comme elles ont pu dans le noir.', [
      d('Les chiffres', v('ilka', '« 12 », puis « 11 », puis « 9 ». Ils se comptaient. Il en manque trois.'), v('', 'Des chiffres à la craie : 12, puis 11, puis 9.')),
      d('Une respiration', v('nuit', 'Neuf respirations, en bas, serrées les unes contre les autres. Ils ont peur du noir. Personne ne leur a appris à le traverser.', 'main-chouette'), v('nuit', 'Ils sont vivants, plus bas. Serrés. Ils ont froid. Je les entends.'), v('vela', 'Neuf voix, très loin en dessous. Elles ont peur, mais elles sont là.'), v('', 'Un souffle, très loin dans le noir. Ou le vent dans les puits.')),
      d('Sous la poussière', v('sasha', 'Des marches, sous la poussière. 2,10 m de large. Exactement la marche de −1. C’est le même escalier, directeur. Il passe sous tout Vertiga, et il monte vers le Puits Zéro.', 'mesure-marche'), v('doran', 'Il y a des marches sous la poussière. Larges, usées au milieu. Toute la galerie est un escalier. Et il monte vers le Puits Zéro.'), v('', 'Sous la poussière, des marches usées : la galerie entière est un escalier qui monte vers le Puits Zéro.')),
    ], [
      { texte: 'Laisser une marque pour Hald', effet: 'eclat', drapeau: 'craie-hald', recit: 'Tu ajoutes une flèche, la bonne, et la date. Si une patrouille repasse, elle trouvera le chemin. Dans une fente, un Éclat oublié par un soldat.' },
      { texte: 'Descendre quelques marches', effet: 'composants', recit: 'Vous descendez contre le sens de l’usure. À chaque palier, une niche vide, de la taille d’une couchette. Dans l’une, du matériel de patrouille abandonné.' },
    ],
    'La galerie de −3 est un escalier immense, usé par des milliers de pas, qui monte vers le Puits Zéro. C’est le même que sous mes pompes.'),
  H(3, 3, 'Le cœur qui compte',
    'L’escalier finit ici, juste sous la salle de 2062. Au-dessus, on devine la rampe en laiton du Puits Zéro. En bas des dernières marches, une flaque d’empreintes mêlées, immobile : la Confluence s’est reposée là.', [
      d('Le dernier palier', v('doran', 'La gaine des Chouettes débouche ici, dans la voûte. Ronde, lisse. Elle part de ce palier, et elle continue plus haut que la salle de 2062.', 'gaine'), v('sasha', 'Le palier du dessus, c’est le sol de la salle de 2062. Les visiteurs du Puits Zéro marchent sur la dernière marche de quelqu’un, et ils ne le savent pas.'), v('', 'Le dernier palier de l’escalier est le sol même de la salle de 2062, la Strate zéro.')),
      d('La forme', v('vela', 'Elle s’est roulée en boule autour d’une voix plus petite que les autres. Elle la protège.'), v('', 'Une forme creusée dans les cristaux, comme si quelque chose de grand s’était roulé en boule.')),
      d('Un murmure', v('vela', '« Compte. » Encore et encore. Je ne sais pas ce qu’elle compte. Ses voix, peut-être.'), v('joss', 'Quelqu’un répète un mot, au milieu de tous les autres. « Compte. » Il a peur de l’oublier.'), v('', 'Un murmure, toujours le même mot, trop bas pour qu’on le comprenne.')),
    ], [
      { texte: 'Écouter jusqu’au bout', effet: 'eclat', drapeau: 'compte-entendu', recit: 'Tu restes longtemps à écouter. Le mot finit par se détacher des autres, net : « Compte. » Un Éclat se forme dans la flaque, comme une goutte.' },
      { texte: 'Dégager l’éboulis', effet: 'composants', drapeau: 'eboulis', recit: 'Tu fais dégager le haut d’un éboulis voisin, derrière lequel s’arrêtent des traces de bottes. Les patrouilles entendront qu’on vient. Parmi les gravats, du matériel de patrouille.' },
    ],
    'Le Puits Zéro n’est pas le fond d’un trou : c’est le dernier palier d’un escalier. Et au pied des marches, une voix répète « Compte ».'),

  // ---------- −4 · Les Portes rondes ----------
  H(4, 1, 'Le seuil usé',
    'Des dizaines de portes rondes, toutes fermées. Une seule est entrouverte, de la largeur d’une main.', [
      d('La porte', v('sasha', 'Pas de serrure dehors. Seulement un loquet, dedans. Celui qui a fait ça ne voulait pas qu’on l’enferme. Il voulait pouvoir s’enfermer.'), v('kessa', 'Aucune trace de coup, aucune griffure. Personne n’a essayé de sortir.'), v('', 'Pas de serrure côté couloir : seulement un loquet, de l’autre côté.')),
      d('Le seuil', v('doran', 'Usé côté intérieur, intact côté couloir. Quelqu’un a fait les cent pas ici pendant des années, sans jamais repasser le seuil.'), v('', 'Le seuil est creusé côté intérieur, intact côté couloir.')),
      d('Par la fente', v('vela', 'Des cristaux en cercle, et une couche au milieu. Quelqu’un dormait entouré de ses pierres, comme on dort au milieu des siens.'), v('', 'Par la fente, des cristaux rangés en cercle autour d’une couche de pierre.')),
    ], [
      { texte: 'Compter les cristaux', effet: 'eclat', drapeau: 'vingt-trois', recit: 'Vingt-trois cristaux, rangés avec soin, et une seule couche. Tu notes le chiffre. Sur le seuil, un Éclat, comme une pièce laissée pour le passage.' },
      { texte: 'Prendre le bol du seuil', effet: 'composants', recit: 'Une main passée par la fente ramène un bol de pierre, poli par l’usage. Quelqu’un mangeait ici, seul, au milieu de ses voix. Odile la Brocante, au marché, en voudra.' },
    ],
    'Les portes rondes n’enferment rien. Quelqu’un s’est enfermé dedans, de son plein gré, au milieu de ses pierres.'),
  H(4, 2, 'La table des voix',
    'Une porte ronde s’est effondrée. Dedans, une table gravée en deux colonnes, et sous la table, des cristaux étiquetés.', [
      d('Les colonnes', v('vela', 'Un nom, puis un chiffre : 12, 19, 27, 31. Ce ne sont pas des âges. C’est le nombre de voix que chacun portait.'), v('', 'Deux colonnes : des noms, et des chiffres qui montent. 12, 19, 27, 31.')),
      d('La dernière ligne', v('ilka', 'Un nom, puis « 31 », barré. À côté, « 1 ». Il s’est ôté trente voix pour n’en garder qu’une. La sienne.'), v('', 'Sur la dernière ligne, « 31 » est barré. À côté, quelqu’un a gravé « 1 ».')),
      d('Sous la table', v('sasha', 'Vingt-trois cristaux, une couche, à la porte d’à côté. Ici, trente. Ils se les retiraient un par un, et ils les gardaient près d’eux.', 'vingt-trois'), v('doran', 'Trente cristaux, avec chacun son étiquette. Il ne les a pas jetés. Il les a rangés, et il s’est enfermé avec eux.'), v('', 'Trente cristaux, chacun avec son étiquette, rangés sous la table.')),
    ], [
      { texte: 'Relever la table', effet: 'eclat', drapeau: 'table-relevee', recit: 'Tu fais relever la table, nom par nom, chiffre par chiffre. Les Veilleurs n’en ont aucune aussi complète. Un Éclat dormait sous la dernière ligne.' },
      { texte: 'Prendre les étiquettes', effet: 'composants', recit: 'De fines plaques de métal, gravées d’un seul mot chacune. Personne ne sait les lire, mais le métal est bon. Le district en fera quelque chose.' },
    ],
    'Une table gravée compte les voix que chacun portait : 12, 19, 27, 31. Le dernier s’en est ôté trente pour n’en garder qu’une, la sienne.'),
  H(4, 3, 'Ce que garde le Gardien',
    'Le registre du Gardien, ouvert sur son lutrin de pierre. Des milliers de lignes. Les dernières pages sont gravées en marques que les Veilleurs savent lire : une date, un niveau, des noms.', [
      d('Les pages anciennes', v('vela', 'Pas des noms : des gestes. « Taille la pierre en biais. » « Chante pour endormir. » Il garde ce qu’ils savaient faire. Eux, il les a laissés partir.'), v('', 'Chaque ligne ancienne décrit un geste : tailler une pierre, endormir un enfant, réparer un toit. Jamais un nom.')),
      d('La page de 2066', v('doran', '« Niveau sept. Un cristal du cercle, sorti avant la fermeture. Ramassé par… » Et rien. Moi, je sais. Le porte-bonheur de mon père, qu’il gardait dans la poche gauche. Je l’ai sur moi depuis sa mort.'), v('', 'Une ligne récente : « 2066. Niveau sept. Un cristal du cercle, sorti avant la fermeture. Ramassé par… » La ligne s’arrête là.')),
      d('La ligne inachevée', v('ilka', 'Il n’a pas fini la ligne parce que le cristal n’est jamais revenu. Il attend qu’on le lui rapporte.'), v('', 'La ligne de 2066 s’arrête au milieu, comme une phrase en attente.')),
    ], [
      { texte: 'Promettre de le rapporter', effet: 'eclat', drapeau: 'promesse-cristal', recit: 'Une main à plat sur la page : « On le rapportera là où il a été pris. » Le lutrin vibre doucement, comme une gorge qui se racle. Un Éclat glisse d’entre les pages.' },
      { texte: 'Arracher la page', effet: 'composants', drapeau: 'page-arrachee', recit: 'La page se détache avec un bruit de verre. Les Veilleurs voudront la lire. Le Gardien, lui, saura qu’on l’a prise. Sur le lutrin, des outils de graveur.' },
    ],
    'Le Gardien ne garde pas des gens, il garde ce qu’ils savaient faire. En 2066, le père de Doran a ramassé un cristal du niveau 7 : le porte-bonheur que Doran porte encore.'),

  // ---------- −5 · Le Treillis ----------
  H(5, 1, 'Les niches vides',
    'Un treillis de cristal monte jusqu’au plafond, percé de niches. Presque toutes sont vides. Sur chacune, un sceau de cire blanche.', [
      d('Un sceau', v('aurel', 'Ce sceau, je l’ai vu sur les caisses qui montaient chez nous, quand j’étais enfant. On me disait que c’étaient des fruits.'), v('liane', 'Cire blanche. Les Hauts mettent ça sur tout ce qu’ils prennent. Même sur les gens.'), v('', 'Un sceau de cire blanche, marqué d’armoiries.')),
      d('Une niche pleine', v('vela', 'Celle-là, ils l’ont oubliée. Regarde le treillis autour : terni, fêlé, comme du verre trop chauffé. Ce n’est pas le cristal qui s’abîme. C’est son lit.'), v('', 'Une seule niche est encore pleine. Autour d’elle, le treillis est terni et fêlé.')),
      d('Un outil propre', v('doran', 'Le sceau de la Compagnie des Fondations. J’ai signé chez eux en 2094. On nous disait qu’on montait des îles. On ne nous disait pas avec quoi.'), v('sasha', 'Une pince de prélèvement, neuve, frappée au sceau de la Compagnie des Fondations. Rien à voir avec nos outils de fouille.'), v('', 'Une pince de prélèvement neuve, frappée au sceau de la Compagnie des Fondations.')),
    ], [
      { texte: 'Laisser dormir le cristal', effet: 'eclat', drapeau: 'berceau-laisse', recit: 'Tu ne touches pas à la dernière niche. En partant, tu sens le treillis se détendre, comme un merci. Un Éclat luit au bord de la niche.' },
      { texte: 'Prendre la pince', effet: 'composants', recit: 'La pince des Hauts se revendra une fortune au district. Le cristal, lui, reste où il est.' },
    ],
    'Les Berceaux du Treillis ont été vidés sous les sceaux des Orsève, avec les pinces de la Compagnie des Fondations. Et ce qui s’use, ce n’est pas le cristal : c’est le lit qui le garde.'),
  H(5, 2, 'Le campement blanc',
    'Un campement propre : tentes blanches, caisses scellées, une table pliante. Les gens des Hauts sont venus, ont travaillé, et sont repartis.', [
      d('Les caisses', v('ilka', 'Vides. Mais regarde les étiquettes : un numéro par niche. Ils ont tout compté.'), v('', 'Des caisses vides, numérotées une à une.')),
      d('Un carnet', v('liane', '« Trente-deux prélevés. Aucun refus. » L’écriture de ma mère. Elle a toujours aimé écrire ce mot-là.'), v('aurel', '« Trente-deux prélevés. Aucun refus. » L’écriture de ma tante. Les Berceaux ne refusent jamais.'), v('', 'Un carnet : « Trente-deux prélevés. Aucun refus. » Signé : I. O.')),
      d('Un sismographe', v('sasha', 'Un sismographe de poche, abandonné en marche. La courbe monte depuis trois ans. Chaque bond tombe à une date du carnet : un prélèvement, une secousse.'), v('kessa', 'La courbe monte à chaque date du carnet. Ils savaient que le treillis tremblait un peu plus à chaque fois. Ils ont continué.'), v('', 'Un sismographe abandonné : la courbe bondit à chaque date notée dans le carnet.')),
    ], [
      { texte: 'Garder le carnet', effet: 'eclat', drapeau: 'carnet-isaure', recit: 'Le carnet rejoindra les Veilleurs. Entre deux pages, un Éclat taillé que quelqu’un avait mis de côté pour soi.' },
      { texte: 'Récupérer le matériel', effet: 'composants', recit: 'Les Hauts ne reviendront pas pour des piquets de tente. Le district, si.' },
    ],
    'Les Hauts prélèvent les Berceaux en connaissant le prix : à chaque prélèvement, le treillis tremble un peu plus. Le carnet est signé « I. O. ».'),
  H(5, 3, 'Ce qu’il reste',
    'Au fond du Treillis, les dernières niches pleines se sont rapprochées autour d’une seule, scellée deux fois. Le Gardien des registres est en dessous.', [
      d('Les niches serrées', v('vela', 'La niche qu’on a laissée dormir, là-haut, a rejoint les autres. Elles se sont écartées pour nous laisser passer.', 'berceau-laisse'), v('vela', 'Elles se sont rangées autour de 5-1, comme une garde. Le Gardien les protège parce que personne d’autre ne le fait.'), v('', 'Les dernières niches se sont rapprochées autour de la niche 5-1, comme une garde.')),
      d('Le sceau de 5-1', v('aurel', 'Deux cires, l’une sur l’autre. Celle du dessus est datée de 2108, l’année où ma tante a pris la tête de la Maison.'), v('liane', '2108. L’année où ma mère a pris la Maison. Un an avant de m’effacer.'), v('', 'Deux sceaux de cire blanche, l’un sur l’autre. Le plus récent est daté de 2108.')),
      d('L’étiquette', v('vela', '« Original du fondateur. Ne pas ouvrir. Ne pas comparer. » Ne pas comparer à quoi ? À ses copies, je suppose.'), v('', 'Une étiquette sous la cire : « Original du fondateur. Ne pas ouvrir. Ne pas comparer. »')),
    ], [
      { texte: 'Ouvrir la niche 5-1', effet: 'eclat', drapeau: 'niche-fondateur', recit: 'La niche s’ouvre sans un bruit. L’original du fondateur dort là, net, sans une fêlure. Même endormi, on sent ce qu’il veut : protéger les siens. Pas les enfermer. Un Éclat roule du sceau brisé.' },
      { texte: 'Relever le sceau', effet: 'composants', recit: 'Tu relèves les deux cires, dates comprises. Les Veilleurs sauront quoi en faire. Au pied de la niche, du matériel de prélèvement abandonné.' },
    ],
    'Dans la niche 5-1 dort l’original de l’empreinte du fondateur des Orsève. Le sceau qui interdit de le comparer à ses copies date de 2108, l’année où Isaure a pris la Maison.'),

  // ---------- −6 · Le Mur de 2066 ----------
  H(6, 1, 'Le chantier',
    'Le chantier de 2066, laissé en plan : bétonnière, étais, une radio. Tout a été abandonné en une nuit.', [
      d('La radio', v('sasha', 'Encore réglée sur la fréquence du chantier. Si je la répare, on entendra leur dernière conversation.'), v('', 'Une radio de chantier, encore réglée sur sa fréquence.')),
      d('Le casque', v('doran', 'Le numéro de mon père. Il ne laissait jamais son casque. Ce soir-là, il a laissé son casque, et il a ramassé un cristal.', 'promesse-cristal'), v('doran', 'Le numéro de mon père. Il l’a laissé ici. Il ne laissait jamais son casque.'), v('', 'Un casque de chantier posé sur une caisse, avec un numéro.')),
      d('Le planning', v('ilka', 'L’ordre disait dix centimètres. Ils en ont coulé quarante, en une nuit, sans que personne le leur demande. Ce n’est pas un éboulement qui leur faisait peur. C’est ce qui pleurait.'), v('', 'Sur l’ordre de service : un mur de dix centimètres. Celui qu’on a coulé en fait quarante.')),
    ], [
      { texte: 'Réparer la radio', effet: 'eclat', drapeau: 'radio', recit: '« … on coule, on coule, il pleure… Attends. Tu entends ? Il ferme aussi. De son côté. » La voix se tait. Dans le boîtier, un Éclat servait de pile.' },
      { texte: 'Prendre le casque', effet: 'composants', drapeau: 'casque', recit: 'Le casque rejoint le sac de l’escouade. Personne ne dit rien pendant longtemps. Le chantier abandonné rend quelques outils.' },
    ],
    'En 2066, les ouvriers ont coulé un mur quatre fois plus épais que prévu, en une seule nuit. Et de l’autre côté, quelqu’un fermait aussi.'),
  H(6, 2, 'Les pleurs',
    'Plus près du mur, les pleurs. Il n’y a personne. Ils viennent du béton lui-même. Et entre deux sanglots, un petit bruit sec.', [
      d('Les pleurs', v('vela', 'Quelqu’un pleure parce qu’il ne sait plus qui il est. Ce n’est pas de la tristesse. C’est de la peur.'), v('', 'Des pleurs étouffés, qui semblent venir du mur lui-même.')),
      d('Le bruit sec', v('doran', 'Un loquet. Il le tire encore, toutes les quelques minutes, comme on vérifie qu’on a bien fermé. Mon père n’a enfermé personne. Il a répondu à quelqu’un qui fermait sa porte.'), v('', 'Un loquet qu’on tire, de l’autre côté, toutes les quelques minutes. Comme on vérifie qu’on a bien fermé.')),
      d('Ce qui a dérivé', v('aurel', 'L’original de 5-1 voulait protéger les siens. La copie de ma tante veut les enfermer. Trois copies ont suffi. Ce n’est pas le fondateur qui nous a rendus durs : ce sont ses copies.', 'niche-fondateur'), v('liane', 'Ma mère m’a effacée sans hésiter une seconde. Ici, au milieu de voix qui ne savent plus qui elles sont, je me demande pour la première fois si c’était seulement elle.'), v('aurel', 'Mon empreinte a été recopiée trois fois avant moi. Ici, j’entends ce que ça fait, une voix qui ne sait plus d’où elle vient.'), v('', 'Les pleurs changent de ton, sans cesse, comme plusieurs voix qui se disputent une seule gorge.')),
    ], [
      { texte: 'Poser la main contre le mur', effet: 'eclat', drapeau: 'main-posee', recit: 'Les pleurs se calment, un instant. De l’autre côté, le loquet ne bouge plus. Un Éclat suinte du béton.' },
      { texte: 'Relever le rythme du loquet', effet: 'composants', recit: 'Tu notes chaque bruit sec, montre en main : toutes les quatre minutes, sans faute, depuis cinquante-cinq ans. En longeant le mur, l’escouade trouve le matériel du chantier.' },
    ],
    'Derrière le mur, on tire encore un loquet : les ouvriers de 2066 n’ont enfermé personne, ils ont répondu à quelqu’un qui fermait. Et l’empreinte du fondateur des Orsève a dérivé de copie en copie.'),
  H(6, 3, 'La fissure',
    'Le mur de 2066 est fendu de haut en bas. La fissure est récente. Quelque chose pousse de l’autre côté.', [
      d('La fissure', v('sasha', 'La radio disait : « Il ferme aussi, de son côté. » Regarde d’où part la fissure : du loquet. Il essaie d’ouvrir ce qu’il a fermé.', 'radio'), v('sasha', 'Ce n’est pas le béton qui cède. C’est quelque chose qui le travaille de l’intérieur, depuis des années.'), v('', 'Une fissure de haut en bas, récente.')),
      d('Le cercle', v('vela', 'Des dizaines de cristaux d’un même être, rangés en cercle. Chacun se souvient d’une autre vie. Et il y a une place vide dans le cercle.'), v('', 'Par la fissure, des cristaux rangés en cercle. Une place est vide.')),
      d('La poche de Doran', v('doran', 'Le porte-bonheur de mon père chauffe dans ma poche. Sa place est là, dans le cercle. Je l’ai promis.', 'promesse-cristal'), v('doran', 'Le porte-bonheur de mon père chauffe dans ma poche. Il veut rentrer. Je ne sais pas si j’ai le droit de le rendre, ou celui de le garder.'), v('', 'Dans le cercle, la place vide a la taille d’un petit cristal.')),
    ], [
      { texte: 'Rendre le cristal de 2066', effet: 'eclat', drapeau: 'cristal-rendu', recit: 'Le cristal roule par la fissure jusqu’à sa place. Les pleurs ne s’arrêtent pas. Mais l’une des voix se tait, comme quelqu’un qui retrouve enfin la fin de sa phrase. Un Éclat tombe de la fissure.' },
      { texte: 'Le garder', effet: 'composants', drapeau: 'cristal-garde', recit: 'Le cristal reste dans la poche de Doran : « Mon père l’a gardé toute sa vie. Je le garde encore un peu. » La place reste vide. L’escouade dégage les étais pour la percée.' },
    ],
    'Derrière le mur, des dizaines de cristaux d’un même être, rangés en cercle. Une place était vide : celle du porte-bonheur du père de Doran.'),

  // ---------- −7 · Les Deux Rives ----------
  H(7, 1, 'Les deux passerelles',
    'Deux passerelles franchissent le même gouffre, côte à côte. L’une est neuve, l’autre a cédé. Les deux existent en même temps.', [
      d('La passerelle cassée', v('ilka', 'Celle des Hauts-Ponts. Celle qui a cédé sous moi. Elle n’a rien à faire ici.'), v('', 'Une passerelle cassée en son milieu, rouillée.')),
      d('La passerelle neuve', v('ilka', 'Et celle-là, c’est celle qui n’a jamais cédé. Celle où j’ai encore mes jambes. Je ne veux pas la regarder.'), v('', 'Une passerelle neuve, intacte, juste à côté de l’autre.')),
      d('Deux cristaux', v('vela', 'Deux cristaux du même être, au bord du gouffre. L’un se souvient d’avoir bâti cette passerelle. L’autre, de l’avoir vue tomber. Les deux sont sincères.'), v('', 'Deux cristaux identiques, posés de part et d’autre du gouffre.')),
    ], [
      { texte: 'Prendre la passerelle cassée', effet: 'eclat', drapeau: 'vraie-rive', recit: 'Vous traversez par la vraie, en sautant le trou. De l’autre côté, un Éclat, là où la passerelle neuve aurait dû arriver.' },
      { texte: 'Prendre la passerelle neuve', effet: 'lampe', recit: 'La passerelle neuve tient, bien sûr. Au bout, une lanterne qui n’existe que dans ce souvenir. Elle éclaire quand même.' },
    ],
    'À −7, deux souvenirs vrais peuvent se contredire. Un même être se souvient d’avoir bâti une passerelle, et de l’avoir vue tomber.'),
  H(7, 2, 'Ceux qui regravaient',
    'Un mur entier couvert de lignes d’eau, gravées l’une au-dessus de l’autre. Pas un mot sous aucune d’elles.', [
      d('La plus basse', v('vela', 'Gravée profond, à coups lents. On grave comme ça ce qu’on croit définitif.'), v('', 'La ligne la plus basse est gravée profond, d’un trait appliqué.')),
      d('Les écarts', v('sasha', 'Entre les lignes : une main, une main, deux, quatre. Ça accélère.'), v('doran', 'Une main d’écart, puis une main, puis deux, puis quatre. Ça ne monte pas. Ça accélère.'), v('', 'Les écarts entre les lignes grandissent : une main, une main, deux, quatre.')),
      d('La plus haute', v('doran', 'La dernière n’est qu’une rayure, faite au bout du bras, sur la pointe des pieds.'), v('ilka', 'La dernière, c’est à peine une rayure. Faite à bout de bras, vite.'), v('', 'La ligne la plus haute n’est qu’une rayure, tracée à bout de bras.')),
    ], [
      { texte: 'Graver une ligne', effet: 'eclat', drapeau: 'ligne-gravee', recit: 'Tu graves une ligne au-dessus de toutes les autres, profond, à coups lents. Un Éclat se décroche du mur.' },
      { texte: 'Recopier le mur', effet: 'composants', recit: 'Les Veilleurs paieront bien pour une copie de ce mur. L’escouade la fait au fusain, pierre par pierre.' },
    ],
    'Sur un mur de −7, des lignes d’eau gravées l’une au-dessus de l’autre. Les écarts grandissent : une main, une main, deux, quatre. La dernière n’est qu’une rayure.'),
  H(7, 3, 'Le relevé impossible',
    'Les deux passerelles se rejoignent sur une même pile. Une seule ligne d’eau en fait le tour, d’un seul trait.', [
      d('Depuis la rive neuve', v('sasha', '1,40 m au-dessus du tablier. Mesurée trois fois.'), v('doran', 'D’ici, la ligne est à 1,40 m du tablier. J’ai mesuré trois fois.'), v('', 'Depuis la rive neuve, la ligne passe à 1,40 m du tablier.')),
      d('Depuis la rive cassée', v('ilka', 'D’ici, la même ligne est à 2,60 m. Même trait, même pile. Ton mètre ne ment pas. Le mien non plus.'), v('', 'Depuis la rive cassée, la même ligne passe à 2,60 m.')),
      d('Les fils', v('vela', 'Des fils dans la pierre. Quelqu’un a cousu deux murs en un. Les deux sont vrais. C’est la Tisseuse.'), v('', 'Des fils fins comme des cheveux courent dans la pierre, à l’endroit où les deux rives se rejoignent.')),
    ], [
      { texte: 'Garder les deux relevés', effet: 'eclat', drapeau: 'deux-releves', recit: 'Tu notes les deux chiffres, sans en barrer aucun. Au pied de la pile, un Éclat t’attendait.' },
      { texte: 'Couper un fil', effet: 'lampe', recit: 'Tu coupes un fil. Les deux murs se séparent un instant, et une lumière passe entre eux, jusqu’aux salles suivantes.' },
    ],
    'À −7, la même ligne d’eau mesure 1,40 m d’une rive et 2,60 m de l’autre. Les deux relevés sont justes. Un mur entier ne dit pas où l’eau s’est arrêtée.'),

  // ---------- −8 · La Ruche d'ambre ----------
  H(8, 1, 'Le campement des Veilleurs',
    'Le campement des Veilleurs perdus est monté sur un plus ancien : celui de l’équipe dont une seule fouilleuse est remontée, il y a des années.', [
      d('Les piquets', v('nuit', 'Deux rangées de trous. Les neufs sont tombés pile dans les vieux. Personne ne leur avait donné le plan.'), v('kessa', 'Leurs piquets sont plantés dans les trous de l’ancien camp. Exactement dans les mêmes.'), v('', 'Les piquets neufs sont plantés pile dans les trous d’un campement plus ancien.')),
      d('Deux relevés', v('sasha', 'La même table, relevée par les deux équipes. Les anciens comptent quatorze lignes, les nouveaux onze. Signé, contresigné.'), v('doran', 'Deux relevés de la même table. Quatorze lignes pour les anciens, onze pour les nouveaux. Il en manque trois.'), v('', 'Deux relevés de la même table, à des années d’écart : quatorze lignes, puis onze.')),
      d('L’ambre', v('kessa', 'L’ambre suinte des murs. Il sent le miel et la cire. Mes parents parlaient de cette odeur, et de la glande qu’on leur a donnée pour le produire.'), v('', 'De l’ambre suinte des murs, épais, doré.')),
    ], [
      { texte: 'Rallumer leurs lampes', effet: 'lampe', drapeau: 'lampes-veilleurs', recit: 'Tu rallumes une à une les lampes des Veilleurs. Si l’un d’eux se réveille, il verra qu’on est venu. Tu en gardes une pour la route.' },
      { texte: 'Emporter les relevés', effet: 'eclat', recit: 'Les deux relevés remonteront chez les Veilleurs. Glissé dans une reliure, un Éclat qu’un Veilleur gardait pour lui.' },
    ],
    'Les Veilleurs perdus ont campé dans les trous d’un campement plus ancien. Les deux équipes ont relevé la même table : quatorze lignes pour l’une, onze pour l’autre.'),
  H(8, 2, 'La table de la Ruche',
    'Une table gravée, à demi prise dans l’ambre. Il manque un morceau, cassé net : celui que la fouilleuse remontée autrefois tenait dans la main.', [
      d('La cassure', v('doran', 'Le morceau qui manque fait trois lignes. Les trois qui manquent au relevé des nouveaux. La fouilleuse les a emportées, et les Veilleurs les gardent sous clé.'), v('', 'Il manque un morceau de la table, cassé net : la place de trois lignes.')),
      d('Les colonnes', v('sasha', 'À −4 : un nom, puis le nombre de voix. Ici, plus de nom. Juste l’empreinte, et combien de fois on l’a recopiée : 40, 112, 300. Ils recopiaient des copies.', 'table-relevee'), v('vela', 'Pas de colonne des noms. Juste des empreintes, et à côté de chacune, combien de fois elle a été recopiée. Trois cents, pour certaines.'), v('', 'La table n’a pas de colonne des noms : des empreintes, et un chiffre à côté de chacune, parfois trois cents.')),
      d('L’écriture', v('liane', 'Regarde le trait. Les tables de −4 sont gravées d’une main sûre. Celle-ci tremble, recommence, rature. Quelqu’un qui ne savait plus bien graver a essayé quand même.'), v('ilka', 'Ça tremble, ça rature, ça recommence. On dirait mon frère qui recopie ses devoirs sur ceux d’un autre.'), v('', 'Le trait est maladroit, raturé, repris : rien à voir avec les tables de −4.')),
    ], [
      { texte: 'Relever la table', effet: 'eclat', drapeau: 'copistes', recit: 'Tu relèves la table au fusain, ratures comprises. Les Veilleurs la poseront à côté de celle de −4. Un Éclat reste dans ta paume quand tu touches la cassure.' },
      { texte: 'Dégager l’ambre', effet: 'composants', recit: 'Vous dégagez la table de l’ambre. L’ambre se revend bien au district, et il y en a beaucoup.' },
    ],
    'À −8, les tables n’ont plus de colonne des noms : seulement des empreintes, recopiées des centaines de fois, d’une main qui ne savait plus graver.'),
  H(8, 3, 'Le souvenir heureux',
    'Au cœur de la Ruche, les Veilleurs perdus sont assis en cercle et sourient. Ils fêtent quelque chose qui n’a jamais eu lieu.', [
      d('Le cercle', v('joss', 'Six Veilleurs, sept verres. Le septième attend la fouilleuse qui est remontée, il y a des années.'), v('vela', 'Six Veilleurs, et sept verres. Il y en a un pour quelqu’un qui n’est pas là.'), v('', 'Six Veilleurs assis en cercle. Sept verres.')),
      d('La fête', v('ilka', 'Ils fêtent la fin de la montée des eaux. Un truc qui n’est jamais arrivé. C’est cruel.'), v('', 'Ils lèvent leurs verres à une fête qui n’a jamais eu lieu.')),
      d('Un fil', v('doran', 'Un fil d’ambre les relie tous à quelque chose, plus bas. La Tisseuse. On coupe le fil, ou on la bat.'), v('', 'Un fil doré relie chacun d’eux à quelque chose, plus bas.')),
    ], [
      { texte: 'Leur rappeler un vrai détail', effet: 'eclat', drapeau: 'vrai-detail', recit: 'Tu dis le nom de Tobin, et le prix du pain au marché. Un Veilleur cligne des yeux. Le souvenir tremble. Un Éclat tombe de son verre.' },
      { texte: 'Les laisser rêver', effet: 'composants', recit: 'Vous ne les dérangez pas : la Tisseuse d’abord. Leur campement rend des vivres et du matériel.' },
    ],
    'Dans le souvenir heureux des Veilleurs, il y a sept verres pour six. Le septième attend la fouilleuse qui est remontée autrefois, avec trois lignes de la table.'),

  // ---------- −9 · Le Ciel d'en bas ----------
  H(9, 1, 'Au dos de la lettre',
    'Aucun fouilleur n’a jamais dépassé cette salle. Tu ressors la lettre d’Ysé pour la ranger, et tu vois ce que tu n’avais pas vu : au dos, d’une écriture plus tremblée, un post-scriptum.', [
      d('Le post-scriptum', v('vela', '« Celle qui garde les noms des autres a souvent perdu le sien. Écoute-la avant de la combattre. » Elle savait déjà, pour la Tisseuse.'), v('', 'Au dos, un post-scriptum : « Celle qui garde les noms des autres a souvent perdu le sien. Écoute-la avant de la combattre. »')),
      d('La côte gravée', v('vela', 'Cette côte, je la connais. Je la vois en rêve depuis ma greffe. Je n’y suis jamais allée. Personne n’y est jamais allé.'), v('nuit', 'Une côte. Personne ne l’a jamais vue.'), v('', 'Tout un mur gravé d’une côte inconnue : criques, courants, récifs.')),
      d('Un fil sur le sol', v('kessa', 'Ses fils traînent partout, ici. Ils sont usés. Elle les tient depuis trop longtemps.'), v('', 'Des fils usés traînent sur le sol.')),
    ], [
      { texte: 'Garder la lettre sur toi', effet: 'eclat', drapeau: 'lettre-yse', recit: 'Tu ranges la lettre contre toi. Plus loin, un Éclat brille dans un nid de fils : la Tisseuse l’avait gardé pour quelqu’un.' },
      { texte: 'Suivre les fils', effet: 'lampe', recit: 'Les fils luisent faiblement quand on les suit. Ils éclairent le chemin vers le bas.' },
    ],
    'À −9, un mur entier montre une côte que personne n’a jamais vue. Véla la voit en rêve depuis sa greffe.'),
  H(9, 2, 'Les visages',
    'Des fils noués autour de petits cristaux, par milliers. Au mur, gravés dans la roche, des dragons, des esprits, des êtres sans nom.', [
      d('Les dragons', v('vela', 'Le même dragon que le mien, gravé dix fois. Le premier est net. Les autres tremblent, de plus en plus. Et le mien… je crois qu’il tremble un peu, lui aussi.'), v('', 'Le même dragon gravé dix fois : net la première fois, puis de plus en plus tremblé.')),
      d('Un nœud', v('vela', 'Un nom, à l’intérieur. Personne ne s’en souvient, sauf elle. Si elle meurt, il meurt avec.'), v('joss', 'Un nom, là-dedans. Elle est la seule à s’en souvenir. C’est lourd, d’être la seule.'), v('', 'Un petit cristal noué de fil murmure un nom.')),
      d('Un nœud défait', v('aurel', 'Un nœud défait, le fil vide. On a donné ce nom à quelqu’un. Chez nous, on grave le nom sous celui du porteur d’avant. Ici, on le donnait.'), v('joss', 'Un fil vide. Le nom n’est pas perdu : il est parti.'), v('', 'Un seul nœud est défait. Le fil est vide.')),
    ], [
      { texte: 'Renouer un nom', effet: 'eclat', drapeau: 'nom-renoue', recit: 'Tu refais le nœud d’un fil qui glissait. Le nom tient. Quelque part, plus bas, la Tisseuse a senti ta main. Un Éclat attend au bout du fil.' },
      { texte: 'Prendre quelques cristaux', effet: 'composants', recit: 'Les cristaux sans nom se revendront. Ceux qui en ont un, tu les laisses.' },
    ],
    'Le même dragon est gravé dix fois : net d’abord, puis de plus en plus tremblé. Plus on le recopie, moins on sait à quoi il ressemblait.'),
  H(9, 3, 'Le nid',
    'La Tisseuse est là, au fond, dans un nid de fils. Elle ne vous attaque pas encore. Ses mains tremblent.', [
      d('Ses mains', v('vela', 'Elle tient tous ses fils, mais elle tremble. Elle est fatiguée. Elle a peur de lâcher.'), v('', 'Ses mains tremblent, et ses fils avec.')),
      d('Ses yeux', v('kessa', 'Elle sait que tu as renoué un de ses fils. Elle te regarde comme on regarde quelqu’un qui a rendu service.', 'nom-renoue'), v('kessa', 'Elle nous regarde comme on regarde quelqu’un qu’on attendait depuis très longtemps.'), v('', 'Elle vous regarde, sans colère.')),
      d('La lettre', v('vela', 'Tu as gardé la lettre. Demande-lui, maintenant.', 'lettre-yse'), v('ilka', 'Une fois, on demande. Si elle répond par des coups, on répond pareil.'), v('', 'La lettre d’Ysé, dans ta poche, pèse lourd.')),
    ], [
      { texte: 'Lui demander son nom', effet: 'eclat', drapeau: 'nom-demande', recit: 'Elle ne répond pas. Pas encore. Mais elle sourit, et un Éclat roule jusqu’à tes pieds.' },
      { texte: 'Se préparer au combat', effet: 'composants', recit: 'L’escouade dépose ses sacs et se prépare. Au pied du nid, des restes de fouilles anciennes.' },
    ],
    'La Tisseuse tient tous les noms que les tables gravées ont perdus. Elle est fatiguée, et elle a peur de lâcher.'),

  // ---------- −10 · Le Puits d'avant ----------
  H(10, 1, 'Les portes nettes',
    'Ici, tout est net : les salles, les cristaux, les portes, mieux scellées que partout ailleurs. Rien n’a vieilli.', [
      d('Une porte', v('doran', 'Fermée de l’intérieur, comme à −4. J’ai le casque de mon père sur mon sac. Ici, il aurait compris ce qu’il a entendu.', 'casque'), v('doran', 'Fermée de l’intérieur, comme à −4. En 2066, mon père a entendu quelqu’un tirer un loquet. C’était ce geste-là.'), v('', 'Une porte scellée de l’intérieur, comme celles de −4.')),
      d('La poussière', v('sasha', 'Il n’y en a pas. Pas un grain. Quelqu’un entretient tout ça. Ou rien ne s’use, ici.'), v('', 'Pas un grain de poussière.')),
      d('Une voix', v('vela', 'Ici, les cristaux ne murmurent pas. Ils se taisent, tous, comme on se tait quand quelqu’un écoute.'), v('', 'Un silence épais, comme si quelqu’un retenait son souffle.')),
    ], [
      { texte: 'Frapper à une porte', effet: 'eclat', drapeau: 'frappe', recit: 'Tu frappes trois coups. Personne n’ouvre. Mais sous la porte, quelqu’un glisse un Éclat, comme on rend la monnaie.' },
      { texte: 'Passer sans bruit', effet: 'composants', recit: 'Vous passez sans bruit. Dans une alcôve, du matériel de ceux d’avant, intact.' },
    ],
    'Au fond, les portes sont fermées de l’intérieur, comme à −4. Mais ici, rien n’a vieilli : pas un grain de poussière.'),
  H(10, 2, 'La salle des tables',
    'Des tables gravées, alignées comme dans une école. Sur chacune, la même phrase, de plus en plus effacée.', [
      d('La phrase', v('vela', '« Que celui qui lit ceci compte les voix qu’il porte. » Compte. Le mot de la Confluence, à −3. Tu l’as écouté jusqu’au bout. Il venait d’ici.', 'compte-entendu'), v('vela', '« Que celui qui lit ceci compte les voix qu’il porte. » Compte. Le mot de la Confluence.'), v('', '« Que celui qui lit ceci compte les voix qu’il porte. »')),
      d('Les bancs', v('ilka', 'Ils apprenaient ça par cœur, comme une leçon. Plus haut, ils la récitaient encore, au milieu de mille autres choses à réciter.'), v('', 'Des bancs de pierre, usés par des générations.')),
      d('Une table à part', v('doran', 'Celle-là est plus récente, de la même écriture que les autres. Quelqu’un l’a portée au centre de la salle, et la garde près de lui.'), v('', 'Une table plus récente a été portée au centre de la salle.')),
    ], [
      { texte: 'Compter tes voix', effet: 'eclat', drapeau: 'voix-comptees', recit: 'Tu fais compter à l’escouade les voix qu’elle porte, cartes comprises. Chacun s’arrête à un chiffre, et personne ne dit le sien. Un Éclat luit sur une table.' },
      { texte: 'Relever les tables', effet: 'composants', recit: 'Tu relèves la phrase sur chaque table, de la plus nette à la plus effacée. Pour Ysé. Au fond de la salle, des outils de graveur.' },
    ],
    'Au fond, la même phrase sur toutes les tables : « Que celui qui lit ceci compte les voix qu’il porte. » Le « Compte » de la Confluence venait d’ici.'),
  H(10, 3, 'Il vous attendait',
    'Au centre de la dernière salle, quelqu’un est assis. Il ne se lève pas. Il vous attendait.', [
      d('Lui', v('vela', 'C’est lui qui a glissé l’Éclat sous la porte, tout à l’heure. Il nous a entendus frapper.', 'frappe'), v('vela', 'Le Premier Porteur. Il ne porte qu’une voix, et ce n’est pas la sienne. Il la porte si bien qu’on ne voit plus la différence.'), v('', 'Quelqu’un d’assis, plus grand que nous, très calme, qui vous regarde arriver.')),
      d('Ses mains', v('doran', 'Il a les mains d’un graveur. Il a regardé ma poche, puis il a souri. Il sait que le cercle de −6 est complet.', 'cristal-rendu'), v('doran', 'Il a les mains d’un graveur. Toutes ces tables ont son écriture.'), v('', 'Des mains abîmées, de graveur.')),
      d('Ton nom', v('ilka', 'Il connaît ton nom. Il l’a lu sur le mur des fouilleurs, tout en haut.', 'nom-grave'), v('ilka', 'On est venus jusqu’ici pour des réponses. Allons lui en demander.'), v('', 'Il te regarde comme s’il te connaissait déjà.')),
    ], [
      { texte: 'Lui dire qui tu es', effet: 'eclat', drapeau: 'presente', recit: 'Tu dis ton nom, ton district, et la mer qui monte. Il hoche la tête, lentement. Un Éclat tombe de la table devant lui.' },
      { texte: 'Préparer l’escouade', effet: 'composants', recit: 'L’escouade se met en place sans un mot. Au pied des marches, ce que ceux d’avant ont laissé.' },
    ],
    'Le Premier Porteur nous attendait au fond, assis. Il a des mains de graveur, et toutes les tables de la salle portent son écriture.'),
];

export const halteDef = (strate: number, n: number) => HALTES.find((h) => h.strate === strate && h.n === n);

/** La voix d'un détail de Halte : le premier Porteur debout qui a quelque chose à dire, sinon le récit */
export function voixDetail(dt: DetailHalte, debout: readonly string[], drapeaux: readonly string[]): Voix {
  const ok = dt.voix.filter((x) => x.texte && (!x.si || drapeaux.includes(x.si)));
  // une voix liée à un drapeau passe devant les autres
  const prio = ok.find((x) => x.si && (!x.qui || debout.includes(x.qui)));
  return prio ?? ok.find((x) => x.qui && debout.includes(x.qui)) ?? ok.find((x) => !x.qui) ?? ok[0]!;
}

// ---------- La particularité de chaque Strate ----------

export interface Particularite { strate: number; nom: string; texte: string }
export const PARTICULARITES: Particularite[] = [
  { strate: 2, nom: 'Caches murées', texte: 'Des caches murées : un Augmenté les force, et y trouve le double.' },
  { strate: 3, nom: 'Le noir complet', texte: 'Même un Résonant ne sent rien au-delà des salles voisines. Une lanterne attend à la Halte.' },
  { strate: 4, nom: 'Portes rondes', texte: 'Toutes closes : deux fois plus de salles scellées.' },
  { strate: 5, nom: 'Les niches', texte: 'Les caches sont des niches : parfois une carte y dort.' },
  { strate: 6, nom: 'Les pleurs', texte: 'Les archives sont plus nombreuses derrière le mur.' },
  { strate: 7, nom: 'Souvenirs doubles', texte: 'Certains combats ont deux occupants : choisis lequel affronter.' },
  { strate: 8, nom: 'Les Veilleurs perdus', texte: 'Un Veilleur égaré attend toujours quelque part sur le plan.' },
  { strate: 9, nom: 'Les fils', texte: 'Un fil relie deux salles côte à côte : on peut le suivre une fois.' },
  { strate: 10, nom: 'Le dernier verrou', texte: 'Les portes à Fréquence demandent une suite de 4.' },
];
export const particularite = (strate: number) => PARTICULARITES.find((p) => p.strate === strate);

// ---------- La quête longue de chaque Strate ----------

export interface QueteDef {
  strate: number;
  nom: string;
  /** ce qu'on cherche, en une phrase (fiche de la Tour, en-tête du plan) */
  but: string;
  /** le récit de chaque étape trouvée, dans l'ordre */
  etapes: string[];
  /** la ligne de lore de la fin */
  fin: string;
}
export const QUETES: QueteDef[] = [
  { strate: 1, nom: 'Les noms du mur', but: 'Relever les noms des fouilleurs jamais barrés.', etapes: [
    'Un nom gravé sur un étai : « Mar. Ivens, 2066 ». Jamais barré.',
    'Un deuxième, sur une pompe noyée : « T. Daro ». Pas barré non plus.',
    'Le dernier, à moitié effacé : le nom du père de Doran. Les trois noms du registre de 2066.',
  ], fin: 'Trois noms de 2066 ne sont jamais barrés. Deux de ces ouvriers ne sont jamais remontés. Le père de Doran, lui, est remonté, seul, et n’a jamais voulu barrer le sien.' },
  { strate: 2, nom: 'Les sacs volés', but: 'Retrouver les sacs de cristaux tombés des pilleurs.', etapes: [
    'Un sac éventré, trois cristaux encore dedans. Ils tremblent.',
    'Un deuxième sac, posé avec soin contre un mur. Quelqu’un l’a laissé exprès.',
    'Le dernier sac, avec un mot : « Pour le directeur. Elles voulaient descendre. Je les ai aidées. B. »',
  ], fin: 'Brac n’a pas tout volé : il a laissé derrière lui les cristaux qui ne voulaient pas descendre. Ceux-là rentrent à la chambre.' },
  { strate: 3, nom: 'Les patrouilles de Hald', but: 'Retrouver les traces des soldats perdus dans le noir.', etapes: [
    'Une gourde des Brigades, vide, et une flèche à la craie.',
    'Une couverture militaire, et neuf encoches dans un pilier.',
    'L’insigne de la capitaine Hald. Elle l’a laissé pour qu’on la suive.',
  ], fin: 'La capitaine Hald a laissé son insigne pour qu’on retrouve ses hommes. Elle ne le dira jamais, mais elle te doit ça.' },
  { strate: 4, nom: 'Les clés rondes', but: 'Rassembler les clés qui ferment les portes rondes.', etapes: [
    'Un disque de cristal, lisse, de la taille d’une paume. Il s’emboîte dans une porte.',
    'Un deuxième disque, gravé d’un seul nom.',
    'Le troisième disque. Ensemble, ils ouvrent la porte entrouverte : derrière, rien qu’une chaise, et une lampe éteinte.',
  ], fin: 'Les clés n’ouvraient qu’une pièce vide : une chaise, une lampe. Quelqu’un a veillé ici, longtemps, puis il est descendu.' },
  { strate: 5, nom: 'Les sceaux de cire', but: 'Relever les sceaux de la Maison Orsève sur les niches vidées.', etapes: [
    'Un sceau, daté de cette année. Les Hauts sont encore venus récemment.',
    'Un sceau plus ancien, d’il y a vingt ans. Ça ne date pas d’hier.',
    'Un sceau de 2094, posé pendant le Levage. La Maison Orsève vidait déjà les Berceaux.',
  ], fin: 'La Maison Orsève vide les Berceaux depuis au moins 2094, pendant le Levage. Le mur de 2066 n’a rien arrêté. Il a juste fermé une porte de plus.' },
  { strate: 6, nom: 'Les tampons de 2066', but: 'Retrouver les ordres de service du chantier de la nuit du 14.', etapes: [
    'Un ordre de service : « Couler le mur, niveau 7. Urgent. »',
    'Un deuxième : « Ne pas écouter. Ne pas répondre. »',
    'Un troisième, signé du chef de chantier : « Sur ordre du bureau des abris. »',
    'Le dernier, de la main du père de Doran : « J’ai entendu le loquet. Ce n’était pas nous. »',
  ], fin: 'En 2066, l’ordre de murer le niveau 7 est venu du bureau des abris. Le loquet, lui, a été tiré de l’autre côté.' },
  { strate: 7, nom: 'Les lignes d’eau', but: 'Relever les lignes d’eau de ceux d’avant, de la plus basse à la plus haute.', etapes: [
    'La ligne la plus basse, gravée profond, presque effacée par l’eau.',
    'Une ligne plus haut, d’une autre main, plus pressée.',
    'Plus haut encore, des dizaines de lignes serrées, à quelques doigts l’une de l’autre.',
    'La dernière, tout en haut. Personne n’a gravé au-dessus.',
  ], fin: 'Ils regravaient leur ligne plus haut, chaque fois. Rien ne dit ce qu’ils comptaient faire de l’eau.' },
  { strate: 8, nom: 'Les six Veilleurs', but: 'Retrouver les Veilleurs de Tobin égarés dans les souvenirs de la Ruche.', etapes: [
    'Une Veilleuse, endormie contre un pilier. Elle se réveille en demandant l’heure.',
    'Deux Veilleurs, qui se tenaient la main dans le même rêve.',
    'Un Veilleur qui comptait les tables. Il en était à mille deux cents.',
    'Le dernier, le chef d’équipe. Il tient un éclat de table, le même que celui de la fouilleuse d’autrefois.',
  ], fin: 'Les six Veilleurs sont rentrés. Leur chef a remis à Ysé un second éclat de table, gravé de la même main pressée : « Que celui qui lit ceci compte les voix qu’il porte. »' },
  { strate: 9, nom: 'Les fils dénoués', but: 'Renouer les fils qui gardent des noms oubliés.', etapes: [
    'Un fil renoué : le nom d’une enfant de 2060, de la pièce aux lits.',
    'Un fil renoué : le nom d’un brigadier du Serment, perdu à −5.',
    'Un fil renoué : un nom de ceux d’avant, très long, que personne ne sait prononcer.',
    'Le dernier fil : un fil vide. Celui de la Tisseuse elle-même.',
  ], fin: 'Tous les fils sont renoués, sauf un. La Tisseuse a donné son propre nom pour qu’on se souvienne d’elle. Il est quelque part, plus bas.' },
  { strate: 10, nom: 'Les loquets', but: 'Trouver qui a fermé les portes du fond de l’intérieur.', etapes: [
    'Un loquet tiré, avec une seule empreinte de doigt.',
    'Un deuxième loquet, la même empreinte.',
    'Un troisième. Toujours la même. Une seule personne a fermé toutes les portes.',
    'Le dernier loquet, encore tiède. Il l’a tiré en vous entendant arriver.',
  ], fin: 'Toutes les portes du fond ont été fermées par la même main, de l’intérieur. Il ne se cachait pas. Il gardait quelque chose dehors.' },
];
export const queteDef = (strate: number) => QUETES.find((q) => q.strate === strate);

// ---------- Les passages secrets ----------

/** Ce que voit un Porteur qui repère un passage, et ce qu'on trouve derrière (selon la zone : Seuils, Salles closes, Registres, Fond) */
export interface SecretDef {
  id: string;
  /** les Porteurs qui le repèrent, et ce qu'ils disent */
  voix: Record<string, string>;
  nom: string;
  /** ce qu'on trouve derrière, par zone */
  derriere: [string, string, string, string];
}
export const SECRETS: SecretDef[] = [
  { id: 'service', nom: 'Un couloir de service', voix: {
    doran: 'Un couloir de service, derrière cette plaque. L’équipe de mon père les marquait d’une croix. Regarde : la croix.',
    kessa: 'De l’air passe par là. Un couloir. Mes yeux le voient mieux que les vôtres.',
  }, derriere: [
    'Un abri d’ouvrier : un lit, une gamelle, et un calendrier de 2066 arrêté au 14.',
    'Un local technique scellé. Des plans des salles closes, roulés dans un tube.',
    'Une galerie de graveur, étroite. Les murs sont couverts d’esquisses de visages.',
    'Un couloir parfaitement propre, qui mène à une petite pièce : une seule chaise, face au mur.',
  ] },
  { id: 'noir', nom: 'Un passage dans le noir', voix: {
    nuit: 'Il y a un passage là, dans le noir. Vous ne le voyez pas : il n’y a pas de lumière qui y entre. Moi, je n’en ai pas besoin.',
    vela: 'Quelqu’un chante, derrière la paroi. Doucement. Il y a un passage.',
  }, derriere: [
    'Une grotte où les cristaux s’allument un à un à votre approche, comme pour vous accueillir.',
    'Une niche oubliée par les Hauts, encore pleine. Elle dort.',
    'Une cavité pleine d’ambre où un insecte immense, figé, garde un éclat de table.',
    'Une chambre noire où une seule voix récite, très bas, la liste de ceux d’avant.',
  ] },
  { id: 'hauts', nom: 'Une porte des Hauts', voix: {
    aurel: 'Une porte de service des Hauts. On les fait toujours de la même façon : il suffit de pousser là, en haut à gauche.',
    liane: 'Les Hauts ont une porte ici. Je reconnais leurs charnières : dorées, même sous terre.',
  }, derriere: [
    'Un réduit où les Brigades stockent leurs rations. Personne ne viendra les compter.',
    'Un vestiaire des préleveurs : blouses blanches, gants, et une liste de niches cochées.',
    'Un dépôt des Hauts, vide, sauf une lettre jamais envoyée, adressée à « Liane ».',
    'Un escalier de marbre qui ne mène nulle part. Les Hauts ont essayé de venir jusqu’ici.',
  ] },
  { id: 'fouilleur', nom: 'Une marque de fouilleur', voix: {
    sasha: 'Une marque de fouilleur sur la pierre : « cache derrière ». Je connais ce signe, je l’ai assez utilisé.',
    joss: 'Quelqu’un a caché quelque chose ici et en a encore honte. Ça se sent.',
    ilka: 'Une flèche gravée, toute petite. Les coursiers marquent leurs raccourcis comme ça.',
  }, derriere: [
    'La cachette d’un fouilleur, avec son carnet : « Si tu trouves ça, rends-le à ma fille. »',
    'Une cache de pilleur, avec un plan des portes rondes tracé à la main.',
    'Un trou de fouilleur, et au fond, un carnet de relevés des Veilleurs perdus.',
    'Une marque de fouilleur, très ancienne. Quelqu’un est déjà venu jusqu’ici, bien avant 2066.',
  ] },
];
export const secretDef = (id: string) => SECRETS.find((s) => s.id === id);
/** Les Porteurs debout qui repèrent un passage */
export const reperent = (s: SecretDef, debout: readonly string[]) => debout.filter((id) => s.voix[id]);

// ---------- Le bestiaire ----------

/** Victoires contre un ennemi pour ouvrir chaque ligne de sa fiche : d'où il vient, comment il se bat, son secret */
export const PALIERS_BESTIAIRE = [1, 4, 10] as const;
export interface FicheBestiaire { origine: string; conseil: string; secret: string }
export const BESTIAIRE: Record<string, FicheBestiaire> = {
  // les Rôdeurs (31 octobre 2026, explorer.ts) : un par zone, croisé seulement en Explorer
  'maree-basse': {
    origine: 'Un Rampeur qui n’a jamais cessé de grandir, né dans les eaux chaudes des pompes de 2066. Les fouilleurs l’entendent respirer sous les piliers.',
    conseil: 'Elle s’enfuit au bout de quatre tours : frappe fort dès le premier. Ses Ressacs touchent toute l’escouade, garde du bouclier.',
    secret: 'Marée-Basse ne s’approche jamais des piliers qui tiennent. Elle suit l’eau qui monte, comme tout le monde.',
  },
  'sentinelle-orpheline': {
    origine: 'Une Sentinelle de verre dont la porte a été murée en 2066. Elle cherche depuis une porte à garder.',
    conseil: 'Blindée : mise sur des cartes fortes ou sur Perçant. Elle fuit au bout de quatre tours, ne garde rien pour la fin.',
    secret: 'Elle ne frappe jamais quelqu’un qui se tient dans l’encadrement d’une porte. Personne ne sait pourquoi.',
  },
  liseur: {
    origine: 'Un Écho qui lit à voix haute les noms gravés des Registres. Là où il est passé, les noms s’effacent.',
    conseil: 'Hors Résonance, tes coups glissent sur lui : enchaîne des suites. Il brouille tes Fréquences un tour sur quatre.',
    secret: 'Il ne lit jamais deux fois le même nom. Ceux qu’il a lus, la Tisseuse les avait déjà oubliés.',
  },
  plongeur: {
    origine: 'Un scaphandre de ceux d’avant, lesté, qui marche encore vers la surface. Il ne s’est jamais arrêté.',
    conseil: 'Très blindé, et ses Poids morts font mal : protège le plus faible, et frappe gros avant qu’il reparte.',
    secret: 'Sur son casque, quelqu’un a gravé des vagues, les mêmes que sur la couverture tissée de −4. Il est passé par les portes rondes, un jour.',
  },
  remanent: {
    origine: 'Une empreinte trop vieille pour se souvenir de son porteur. Elle erre dans les Seuils en cherchant un corps qui n’existe plus.',
    conseil: 'Ses Fêlures sont cachées : sans suite de Fréquences, tes coups glissent sur lui. Enchaîne 3, 4, 5.',
    secret: 'Certains Rémanents répètent la même phrase en boucle. Ysé en a noté une : « Ne fermez pas, il reste quelqu’un. »',
  },
  vigie: {
    origine: 'Une machine de surveillance des dépôts de 2060. Personne ne lui a dit que les dépôts étaient vides.',
    conseil: 'Blindée, elle vise les Résonants et vole ton Flux à chaque coup qui passe : protège Véla et frappe fort.',
    secret: 'Sa mémoire contient encore la liste des employés du dépôt. Le dernier badge enregistré est celui du père de Doran.',
  },
  rampeur: {
    origine: 'Une bête des piliers, née dans les eaux chaudes des pompes noyées. Elle mange la rouille.',
    conseil: 'Il se régénère à chaque tour : ne le laisse pas souffler, finis-le vite.',
    secret: 'Les Rampeurs ne mangent que la rouille des piliers qui vont céder. Les fouilleurs les suivent pour savoir où ne pas marcher.',
  },
  pilleur: {
    origine: 'Un fouilleur sans licence. La plupart descendent pour nourrir une famille, quelques-uns pour le marché noir.',
    conseil: 'Vengeur : si tu abats son allié, il frappe double au tour suivant. Abats-le en premier.',
    secret: 'Les pilleurs ont leur propre mur des noms, plus bas, à −2. Brac y a gravé le sien deux fois.',
  },
  sauvage: {
    origine: 'Un greffé sans Clinique ni Lecture : une brisure achetée au marché noir, et un penchant qui n’est pas le sien.',
    conseil: 'Vengeur, comme les pilleurs : quand il est en groupe, c’est lui qu’il faut viser d’abord.',
    secret: 'Une Lecture bien faite guérit la plupart des Sauvages. La Clinique du district en a déjà sauvé plusieurs.',
  },
  confluence: {
    origine: 'Des empreintes mêlées, collées autour d’une seule voix. Elle cherche quelque chose, toujours plus bas.',
    conseil: 'Elle se régénère et appelle un Rampeur à mi-vie : garde de quoi finir le renfort sans la laisser remonter.',
    secret: 'La voix autour de qui les autres se sont collées ne dit qu’un mot : « Compte. »',
  },
  brigadier: {
    origine: 'Un soldat des Brigades du Serment de Veyr, la garde de la Maison Orsève dans les Strates.',
    conseil: 'Furie : sous la moitié de ses PV, il frappe beaucoup plus fort. Achève-le d’un coup.',
    secret: 'Les brigadiers prêtent serment sur une empreinte de la Maison. Certains récitent, en combat, un serment qui n’est pas le leur.',
  },
  'echo-veilleur': {
    origine: 'Le rémanent d’un Veilleur mort en service, qui fait encore sa ronde dans les salles closes.',
    conseil: 'Fêlures cachées, et il prend la lignée de la dernière carte qui le frappe : varie tes coups, et termine par celle qu’il craint.',
    secret: 'Les rémanents de veilleurs connaissent encore les mots de passe des Veilleurs de Sédime. Tobin les a tous notés.',
  },
  'sentinelle-verre': {
    origine: 'Une machine de ceux d’avant, en verre trempé, qui garde les portes rondes.',
    conseil: 'Épines : chaque coup te coûte un peu. Préfère quelques gros coups, et méfie-toi de ses rayons sur les Génés.',
    secret: 'Les sentinelles ne s’allument que si quelqu’un approche d’une porte entrouverte. Elles protègent ceux qui sont dedans.',
  },
  'gardien-registres': {
    origine: 'Le gardien des salles closes. Il fait l’appel de ceux qui sont passés, et attend qu’ils reviennent.',
    conseil: 'Blindé, il appelle un brigadier à la barre à mi-vie : garde tes plus gros coups pour la seconde phase.',
    secret: 'Il ne garde pas des cristaux. Il garde le registre de tous ceux qui sont descendus, ouvriers de 2066 compris.',
  },
  double: {
    origine: 'Un souvenir dédoublé : la même personne, dans deux versions de sa vie qui se contredisent.',
    conseil: 'Il revient plus petit quand il tombe, et change de lignée : garde de quoi finir son rejeton.',
    secret: 'Les Doubles ne se battent pas entre eux. Chacun croit que l’autre est le faux.',
  },
  'essaim-ambre': {
    origine: 'Des insectes nés dans l’ambre de la Ruche. Ils gardent les tables gravées comme une reine.',
    conseil: 'Ses piqûres touchent toute l’escouade et il revient plus petit : un bouclier d’escouade vaut mieux qu’un soin.',
    secret: 'L’ambre ne vient pas des insectes : il remonte des empreintes que la Ruche couve.',
  },
  'automate-graveur': {
    origine: 'Une machine de ceux d’avant, qui grave les tables. Elle continue, même quand plus personne ne lit.',
    conseil: 'Blindé, il vise les Résonants puis se polit : frappe fort, et ne lui laisse pas le temps de se soigner.',
    secret: 'Les automates graveurs ne gravent qu’une phrase : « Que celui qui lit ceci compte les voix qu’il porte. »',
  },
  tisseuse: {
    origine: 'Elle tisse des souvenirs, vrais ou à venir, et garde les noms que les tables ont perdus.',
    conseil: 'Épines, et un essaim à mi-vie : préfère quelques gros coups, et garde un soin pour la fin.',
    secret: 'Elle a donné son propre nom à quelqu’un, il y a très longtemps, pour qu’il se souvienne d’elle. Il l’a oubliée.',
  },
  'premier-porteur': {
    origine: 'Le premier d’entre ceux d’avant à avoir porté une empreinte. Le seul à n’avoir jamais mêlé sa voix à une autre.',
    conseil: 'Fêlures cachées, et il rappelle son double à mi-vie : la suite est la seule façon de le toucher pleinement.',
    secret: 'Sous la mise en garde, il a gravé une ligne plus récente : « Les voix ne nous ont pas pris, elles nous ont gardés. »',
  },
};
/** Les lignes ouvertes de la fiche d'un ennemi, selon ses victoires */
export function lignesBestiaire(id: string, victoires: number): { origine?: string; conseil?: string; secret?: string; prochain?: number } {
  const f = BESTIAIRE[id];
  if (!f) return {};
  const [a, b, c] = PALIERS_BESTIAIRE;
  const prochain = victoires < a ? a : victoires < b ? b : victoires < c ? c : undefined;
  return {
    ...(victoires >= a ? { origine: f.origine } : {}),
    ...(victoires >= b ? { conseil: f.conseil } : {}),
    ...(victoires >= c ? { secret: f.secret } : {}),
    ...(prochain ? { prochain } : {}),
  };
}

// ---------- Les réglages ----------

export const CONTENU = {
  /** chance qu'une descente (Strate −2 et plus) cache un passage secret */
  secret: 0.4,
  /** les portes à Fréquence : à partir de cette Strate, chance qu'une cache devienne une porte ; cartes tirées ; suite demandée */
  porte: { depuis: 5, chance: 0.5, main: 5, suite: 3, suiteFond: 4, eclats: 1, eclatsFond: 2, composants: 1.5 },
  /** la lampe à algues : rangées éclairées au-delà de la salle où on l'allume */
  lampe: 2,
  /** −2 : caches murées (au plus) ; −5 : chance de carte dans une niche ; −7 : salles à deux occupants (au plus) */
  murs: 2, niche: 0.2, doubles: 2,
};
