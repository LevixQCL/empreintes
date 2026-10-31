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
}

/** Nombre de Haltes d'une Strate : il faut environ autant de descentes que la profondeur, d'où 1 à −1, 2 à −2, 3 ensuite */
export const nombreHaltes = (strate: number) => (strate >= 1 && strate <= 10 ? Math.min(3, strate) : 0);

const H = (strate: number, n: number, titre: string, recit: string, details: DetailHalte[], choix: [ChoixHalte, ChoixHalte]): HalteDef =>
  ({ strate, n, titre, recit, details, choix });
const d = (nom: string, ...voix: Voix[]): DetailHalte => ({ nom, voix });
const v = (qui: string, texte: string, si?: string): Voix => (si ? { qui, texte, si } : { qui, texte });

export const HALTES: HalteDef[] = [
  // ---------- −1 · Les Pompes noyées ----------
  H(1, 1, 'Le mur des fouilleurs',
    'Un pilier couvert de noms grattés au couteau. Les fouilleurs de Vertiga y écrivent le leur avant de descendre, et le barrent quand ils remontent.', [
      d('Les noms', v('doran', 'Le nom de mon père est là, daté de 2066. Il n’est jamais barré. Il est remonté, pourtant. Il n’a jamais voulu le barrer.'), v('', 'Des centaines de noms. Certains sont barrés, d’autres non. Les plus anciens datent de 2066.')),
      d('Une traînée qui brille', v('vela', 'La Confluence s’est frottée ici. Elle a lu les noms, un par un, comme on cherche quelqu’un sur une liste.'), v('', 'Une traînée bleue, encore tiède, court le long du pilier, à hauteur de visage.')),
      d('Des lignes d’eau', v('ilka', 'Comme à la Nuit des lignes. Sauf que celles-là sont bien trop bas. Ici, la mer est déjà passée.'), v('', 'Des traits horizontaux gravés dans la pierre, avec des dates. Le plus haut est au-dessus de ta tête.')),
    ], [
      { texte: 'Graver ton nom', effet: 'composants', drapeau: 'nom-grave', recit: 'Tu graves ton nom sous celui des autres. En dessous, un fouilleur a laissé des pièces pour le suivant. Elles sont à toi.' },
      { texte: 'Ne rien laisser', effet: 'composants', drapeau: 'sans-nom', recit: 'Tu passes sans graver ton nom. Au pied du pilier, un sac oublié : la Confluence ne saura pas qui l’a pris.' },
    ]),

  // ---------- −2 · Les Abris murés ----------
  H(2, 1, 'Le registre des abris',
    'Une porte d’abri de 2060, entrouverte. Sur le mur, un registre peint : les familles qui y ont dormi pendant les grandes crues.', [
      d('Le registre peint', v('ilka', 'Quarante familles. Des noms du quartier. Ma grand-mère connaissait sûrement certains d’entre eux.'), v('', 'Quarante noms de familles, peints en blanc. Des noms du quartier, pour la plupart.')),
      d('Des traces de bottes', v('doran', 'Des pilleurs, chargés : les traces s’enfoncent. Ils portaient lourd. Les cristaux de la chambre, sûrement.'), v('', 'Des traces de bottes, profondes, qui s’enfoncent vers le bas.')),
      d('Un cristal tombé', v('vela', 'Un des nôtres, de la chambre. Il est tombé d’un sac. Il ne veut pas remonter. Il veut suivre les autres.'), v('', 'Un petit cristal, tombé d’un sac, qui luit faiblement.')),
    ], [
      { texte: 'Garder le cristal', effet: 'composants', recit: 'Tu le ranges dans le sac. Au district, il se revendra pour des composants : il n’a pas de voix assez nette pour une carte.' },
      { texte: 'Le laisser descendre', effet: 'composants', drapeau: 'cristal-libre', recit: 'Tu poses le cristal au bas des marches. Il roule tout seul vers le bas. Doran ramasse ce que les pilleurs ont laissé tomber à côté.' },
    ]),
  H(2, 2, 'La pièce aux lits',
    'Des lits de camp alignés, des couvertures pliées au carré. Les pilleurs ont dormi ici cette nuit. Ils ont laissé un mot sur un oreiller.', [
      d('Le mot', v('ilka', '« Elles nous parlent toute la nuit. On les emmène plus bas, c’est ce qu’elles veulent. » Signé : B. Super. Des pilleurs poètes.'), v('', '« Elles nous parlent toute la nuit. On les emmène plus bas. » Signé : B.')),
      d('Un dessin d’enfant', v('doran', 'Un dessin de 2060 : une maison sur l’eau, un soleil, et une grande porte tout en bas. Les enfants des abris dessinaient l’Écluse.'), v('', 'Un dessin d’enfant, punaisé au mur : une maison sur l’eau et une grande porte tout en bas.')),
      d('Les couvertures', v('vela', 'Elles sentent la peur. Pas celle des pilleurs. Celle des cristaux qu’ils portaient.', ), v('', 'Les couvertures sont encore chaudes. Les pilleurs sont partis il y a peu.')),
    ], [
      { texte: 'Fouiller leurs affaires', effet: 'composants', recit: 'Dans un sac, des outils de fouille et quelques pièces. Brac, ou qui que ce soit, n’en aura plus besoin.' },
      { texte: 'Garder le dessin', effet: 'composants', drapeau: 'dessin-ecluse', recit: 'Tu plies le dessin dans ta poche. Ysé voudra le voir. Sous le lit, quelques composants roulés dans un chiffon.' },
    ]),

  // ---------- −3 · La Galerie aux lueurs ----------
  H(3, 1, 'La dernière lampe',
    'Ici s’arrêtent les lampes humaines. Une lanterne de fouilleur pend à un clou, éteinte. Au-delà, la galerie ne brille que de ses propres cristaux.', [
      d('La lanterne', v('ilka', 'Personne n’a jamais accroché de lampe plus loin. Les fouilleurs disaient : « Après le clou, c’est le noir qui décide. »'), v('', 'Une lanterne à algues pend à un clou. Personne n’en a jamais accroché plus loin.')),
      d('Des lueurs au plafond', v('nuit', 'Ce ne sont pas des cristaux. Ce sont des yeux. Petits. Ils ont peur de nous plus que nous d’eux.'), v('vela', 'Des cristaux qui s’allument quand on passe. Ils suivent nos pas. Ils n’ont plus vu personne depuis longtemps.'), v('', 'Des lueurs s’allument au plafond quand l’escouade passe, puis s’éteignent derrière elle.')),
      d('Un insigne des Brigades', v('doran', 'Un insigne du Serment de Veyr, arraché. Les patrouilles de Hald sont passées par là. En courant.'), v('', 'Un insigne des Brigades du Serment de Veyr, arraché, au milieu du couloir.')),
    ], [
      { texte: 'Prendre la lanterne', effet: 'lampe', recit: 'Doran rallume la lanterne avec une poignée d’algues. Sa lumière perce le brouillard des deux salles suivantes.' },
      { texte: 'Laisser le clou au noir', effet: 'eclat', drapeau: 'clou-respecte', recit: 'Tu laisses la lanterne à son clou, comme les fouilleurs avant toi. Au pied du mur, un Éclat brille : quelqu’un d’autre l’y avait laissé, par respect.' },
    ]),
  H(3, 2, 'Le message des patrouilles',
    'Sur un pilier, des flèches tracées à la craie, et des chiffres. Les Brigades se sont repérées comme elles ont pu dans le noir.', [
      d('Les flèches', v('doran', 'Elles tournent en rond. Trois fois le même pilier. Ils étaient perdus, et ils le savaient.'), v('', 'Des flèches à la craie, qui reviennent trois fois au même pilier.')),
      d('Les chiffres', v('ilka', '« 12 », puis « 11 », puis « 9 ». Ils se comptaient. Il en manque trois.'), v('', 'Des chiffres à la craie : 12, puis 11, puis 9.')),
      d('Une respiration', v('nuit', 'Ils sont vivants, plus bas. Serrés. Ils ont froid. Je les entends.'), v('vela', 'Neuf voix, très loin en dessous. Elles ont peur, mais elles sont là.'), v('', 'Un souffle, très loin dans le noir. Ou le vent dans les puits.')),
    ], [
      { texte: 'Laisser une marque pour Hald', effet: 'eclat', drapeau: 'craie-hald', recit: 'Tu ajoutes une flèche, la bonne, et la date. Si une patrouille repasse, elle trouvera le chemin. Dans une fente, un Éclat oublié par un soldat.' },
      { texte: 'Effacer les flèches fausses', effet: 'composants', recit: 'Tu effaces les cercles. Personne ne se perdra plus ici. Au pied du pilier, du matériel de patrouille abandonné.' },
    ]),
  H(3, 3, 'Le cœur qui compte',
    'La galerie s’ouvre sur une salle ronde. Au centre, une flaque d’empreintes mêlées, immobile. La Confluence s’est reposée ici. Il reste sa forme.', [
      d('La forme', v('vela', 'Elle s’est roulée en boule autour de quelque chose. Une voix plus petite que les autres. Elle la protège.'), v('', 'Une forme creusée dans les cristaux, comme si quelque chose de grand s’était roulé en boule.')),
      d('Un murmure', v('vela', '« Compte. » Encore et encore. Je ne sais pas ce qu’elle compte. Ses voix, peut-être.'), v('joss', 'Quelqu’un répète un mot, au milieu de tous les autres. « Compte. » Il a peur de l’oublier.'), v('', 'Un murmure, toujours le même mot, trop bas pour qu’on le comprenne.')),
      d('Des bottes, du côté', v('doran', 'Les patrouilles sont en dessous, coincées sous un éboulement. Elle garde l’entrée. Elle ne les attaque pas. Elle attend.'), v('', 'Des traces de bottes s’arrêtent devant un éboulis.')),
    ], [
      { texte: 'Écouter jusqu’au bout', effet: 'eclat', drapeau: 'compte-entendu', recit: 'Tu restes longtemps à écouter. Le mot finit par se détacher des autres, net. Un Éclat se forme dans la flaque, comme une goutte.' },
      { texte: 'Dégager l’éboulis', effet: 'composants', recit: 'Tu fais dégager le haut de l’éboulis. Les patrouilles entendront qu’on vient. Parmi les gravats, des composants de 2060.' },
    ]),

  // ---------- −4 · Les Portes rondes ----------
  H(4, 1, 'La porte entrouverte',
    'Des dizaines de portes rondes, toutes fermées de l’intérieur. Une seule est entrouverte, de la largeur d’une main.', [
      d('La porte', v('sasha', 'Pas de serrure, pas de charnière visible. Elle tourne sur elle-même. Celui qui a fait ça n’avait pas besoin de vis.'), v('ilka', 'Une porte qu’on a oublié de fermer. Ou qu’on a laissée ouverte exprès.'), v('', 'Une porte ronde, entrouverte de la largeur d’une main. De la lumière bleue passe par la fente.')),
      d('Le tampon de 2066', v('doran', 'Le tampon de l’équipe de mon père. Ils sont venus jusqu’ici. Ils ont regardé par cette fente.'), v('', 'Un tampon de chantier de 2066, sur le cadre de la porte.')),
      d('Derrière la fente', v('vela', 'Des cristaux rangés en rond, avec soin. Comme une chambre qu’on range avant de partir pour de bon.'), v('', 'Derrière la fente, des cristaux rangés en cercle, avec soin.')),
    ], [
      { texte: 'Refermer la porte', effet: 'eclat', drapeau: 'porte-refermee', recit: 'Tu refermes doucement. Un déclic, de l’autre côté : quelqu’un a tiré le loquet. Sur le seuil, un Éclat, comme un remerciement.' },
      { texte: 'Glisser la main', effet: 'composants', recit: 'Ilka glisse la main par la fente et ramène ce qui traînait au pied de la porte : de vieux composants, rien de plus. La porte ne bouge pas.' },
    ]),
  H(4, 2, 'L’appel',
    'Une voix de pierre lit une liste, quelque part derrière les portes. Elle s’arrête à chaque nom, comme si elle attendait une réponse.', [
      d('La liste', v('doran', 'Des ouvriers de 2066. Elle lit leurs noms, un par un. Elle attend qu’ils répondent « présent ».'), v('', 'Une voix lit des noms. Elle s’arrête après chacun, et reprend.')),
      d('Un silence', v('vela', 'Après un nom, elle attend plus longtemps. Celui-là, elle l’aimait bien.'), v('', 'Après un des noms, le silence dure plus longtemps.')),
      d('Une réponse', v('ilka', 'Si quelqu’un répond « présent », elle s’arrête, tu crois ?'), v('', 'La voix semble attendre une réponse qui ne vient jamais.')),
    ], [
      { texte: 'Répondre « présent »', effet: 'eclat', drapeau: 'present', recit: 'Ta voix porte loin. La liste s’arrête net, puis reprend, plus lentement. Une porte s’entrouvre juste assez pour laisser rouler un Éclat.' },
      { texte: 'Se taire et passer', effet: 'composants', recit: 'Vous passez sans un mot. La voix continue sa liste. Dans le couloir, un coffre de chantier de 2066, pas tout à fait vide.' },
    ]),
  H(4, 3, 'Le registre ouvert',
    'Sur un lutrin de pierre, un registre immense, ouvert. Les pages sont des plaques de cristal gravées. La dernière ligne est inachevée.', [
      d('La dernière ligne', v('doran', 'Le nom de mon père. Écrit à moitié. Le Gardien ne l’a pas fini. Il attend de savoir s’il revient.'), v('', 'La dernière ligne est un nom, gravé à moitié.')),
      d('Les pages', v('vela', 'Chaque page est une voix. Le Gardien ne garde pas des cristaux. Il garde les gens qui sont passés.'), v('sasha', 'Gravé au burin, au centième de millimètre. Aucune machine de Vertiga ne fait ça.'), v('', 'Des plaques de cristal gravées, des milliers de lignes.')),
      d('Le lutrin', v('ilka', 'Il y a l’empreinte de deux mains, usée. Il lit ce registre depuis des siècles.'), v('', 'La pierre du lutrin est usée à l’endroit où l’on pose les mains.')),
    ], [
      { texte: 'Finir la ligne', effet: 'eclat', drapeau: 'ligne-finie', recit: 'Doran grave la fin du nom de son père, lentement. Le registre se referme tout seul. Un Éclat glisse d’entre ses pages.' },
      { texte: 'Ne pas y toucher', effet: 'composants', recit: 'Vous laissez le registre comme il est. Le Gardien saura que quelqu’un l’a lu, et l’a respecté. Au pied du lutrin, des outils de graveur.' },
    ]),

  // ---------- −5 · Le Treillis ----------
  H(5, 1, 'Les niches vides',
    'Un treillis de cristal monte jusqu’au plafond, percé de niches. Presque toutes sont vides. Sur chacune, un sceau de cire blanche.', [
      d('Un sceau', v('aurel', 'Les armes de ma famille. La Maison Orsève vide les Berceaux depuis des années. Je l’ai vu enfant sans comprendre.'), v('liane', 'Cire blanche. Les Hauts mettent ça sur tout ce qu’ils prennent. Même sur les gens.'), v('', 'Un sceau de cire blanche, marqué d’armoiries.')),
      d('Une niche pleine', v('vela', 'Celle-là, ils l’ont oubliée. Elle dort. Elle ne sait pas que les autres sont parties.'), v('', 'Une seule niche est encore pleine. Un cristal y dort.')),
      d('Un outil propre', v('sasha', 'Une pince de prélèvement. Neuve, stérile, chère. Rien à voir avec nos outils de fouille.'), v('', 'Une pince de prélèvement, neuve, oubliée sur une marche.')),
    ], [
      { texte: 'Laisser dormir le cristal', effet: 'eclat', drapeau: 'berceau-laisse', recit: 'Tu ne touches pas à la dernière niche. En partant, Véla y glisse la main. « Elle dit merci. » Un Éclat s’en détache.' },
      { texte: 'Prendre la pince', effet: 'composants', recit: 'La pince des Hauts se revendra une fortune au district. Le cristal, lui, reste où il est.' },
    ]),
  H(5, 2, 'Le campement blanc',
    'Un campement propre : tentes blanches, caisses scellées, une table pliante. Les gens des Hauts sont venus, ont travaillé, et sont repartis.', [
      d('Les caisses', v('ilka', 'Vides. Mais regarde les étiquettes : un numéro par niche. Ils ont tout compté.'), v('', 'Des caisses vides, numérotées une à une.')),
      d('Un carnet', v('aurel', 'L’écriture de ma tante. « Trente-deux prélevés. Aucun refus. » Les Berceaux ne refusent jamais, c’est pour ça qu’ils les prennent.'), v('', 'Un carnet : « Trente-deux prélevés. Aucun refus. » Signé : I. O.')),
      d('La table', v('doran', 'Une nappe. Ils ont mis une nappe, ici, dans les Strates.'), v('', 'Une table pliante, couverte d’une nappe blanche.')),
    ], [
      { texte: 'Garder le carnet', effet: 'eclat', drapeau: 'carnet-isaure', recit: 'Le carnet rejoindra les Veilleurs. Entre deux pages, un Éclat taillé, que quelqu’un avait mis de côté pour soi.' },
      { texte: 'Récupérer le matériel', effet: 'composants', recit: 'Les Hauts ne reviendront pas pour des piquets de tente. Le district, si.' },
    ]),
  H(5, 3, 'Ce qu’il reste',
    'Au fond du Treillis, les niches qui restent se sont serrées les unes contre les autres. Le Gardien des registres est en dessous.', [
      d('Les niches serrées', v('vela', 'Elles ont froid. Elles se sont rapprochées. Le Gardien les protège parce que personne d’autre ne le fait.'), v('', 'Les dernières niches se sont rapprochées, comme pour se tenir chaud.')),
      d('Un brigadier endormi', v('ilka', 'Un soldat du Serment, assis contre le mur. Il récite un serment qui n’est pas le sien, en dormant.'), v('', 'Un brigadier dort contre le mur et murmure dans son sommeil.')),
      d('L’inventaire', v('aurel', 'Signé « I. Orsève ». Ma tante tient le Registre des Vierges. Elle ne descend jamais. Elle envoie les autres.'), v('', 'Un inventaire de Berceaux dépasse de la poche du soldat, signé « I. Orsève ».')),
    ], [
      { texte: 'Réveiller le brigadier', effet: 'eclat', drapeau: 'brigadier-reveille', recit: 'Il se réveille en sursaut, ne sait plus où il est, et vous remercie. En partant, il vous laisse un Éclat de sa ration.' },
      { texte: 'Prendre l’inventaire', effet: 'composants', recit: 'L’inventaire passe dans ta poche. Le soldat continue de réciter. Sur lui, quelques composants de solde.' },
    ]),

  // ---------- −6 · Le Mur de 2066 ----------
  H(6, 1, 'Le chantier',
    'Un chantier de 2066, laissé en plan : bétonnière, étais, une radio. Tout a été abandonné en une nuit.', [
      d('La radio', v('sasha', 'Encore réglée sur la fréquence du chantier. Si je la répare, on entendra leur dernière conversation.'), v('', 'Une radio de chantier, encore réglée sur sa fréquence.')),
      d('Un casque', v('doran', 'Le numéro de mon père. Il l’a laissé ici. Il ne laissait jamais son casque.'), v('', 'Un casque de chantier, posé sur une caisse, avec un numéro.')),
      d('Le béton', v('ilka', 'Coulé à la hâte, en pleine nuit. On voit les traces des mains dedans.'), v('', 'Du béton coulé à la hâte. Des empreintes de mains y sont restées.')),
    ], [
      { texte: 'Réparer la radio', effet: 'eclat', drapeau: 'radio', recit: '« … on ferme, on ferme, elle pleure, on ferme quand même… » La voix grésille et se tait. Dans le boîtier, un Éclat servait de pile.' },
      { texte: 'Prendre le casque', effet: 'composants', drapeau: 'casque', recit: 'Doran attache le casque à son sac. Il ne dit rien pendant longtemps. Le chantier abandonné rend quelques outils.' },
    ]),
  H(6, 2, 'Les pleurs',
    'Plus près du mur, les pleurs. Il n’y a personne. Les pleurs viennent du béton lui-même.', [
      d('Les pleurs', v('liane', 'Les Berceaux qu’on vide font ce bruit-là. Dans les Hauts, on met de la musique pour ne pas l’entendre.'), v('vela', 'Quelqu’un pleure parce qu’il ne sait plus qui il est. Ce n’est pas de la tristesse. C’est de la peur.'), v('', 'Des pleurs, étouffés, qui semblent venir du mur lui-même.')),
      d('Une main peinte', v('joss', 'Une main, peinte de l’autre côté et qui a traversé le béton. Quelqu’un voulait dire au revoir.'), v('', 'Une main, dessinée en bleu, dépasse du béton comme si elle l’avait traversé.')),
      d('La phrase', v('doran', '« On a fermé la porte, mais pas de notre côté. » C’est ce que disait mon père. Il l’a écrit ici.'), v('', 'Une phrase écrite au crayon : « On a fermé la porte, mais pas de notre côté. »')),
    ], [
      { texte: 'Poser la main contre le mur', effet: 'eclat', drapeau: 'main-posee', recit: 'Les pleurs se calment, un instant. Quelque chose, de l’autre côté, a senti la main. Un Éclat suinte du béton.' },
      { texte: 'Relever la phrase', effet: 'composants', recit: 'Tu recopies la phrase pour Ysé. En longeant le mur, l’escouade trouve le matériel du chantier.' },
    ]),
  H(6, 3, 'La fissure',
    'Le mur de 2066 a une fissure, de haut en bas. Elle est récente. Quelque chose pousse de l’autre côté.', [
      d('La fissure', v('sasha', 'Ce n’est pas le béton qui cède. C’est quelque chose qui le travaille de l’intérieur, depuis des années.'), v('', 'Une fissure de haut en bas, récente.')),
      d('Ce qu’on voit', v('vela', 'Des dizaines de cristaux, tous du même être. Il pleure parce que chaque cristal se souvient d’une autre vie.'), v('', 'Par la fissure, on devine des cristaux rangés en cercle.')),
      d('Le Gardien', v('doran', 'Il est là, juste derrière. Il ne nous attend pas pour se battre. Il attend pour savoir si on va le casser, ce mur.'), v('', 'Une ombre immense se tient derrière la fissure, immobile.')),
    ], [
      { texte: 'Parler au Gardien', effet: 'eclat', drapeau: 'parle-gardien', recit: 'Tu dis qui tu es, et pourquoi tu viens. L’ombre ne répond pas, mais elle recule d’un pas. Un Éclat tombe de la fissure.' },
      { texte: 'Préparer la percée', effet: 'composants', recit: 'L’escouade dégage des étais du chantier pour la percée. Ils serviront, et le reste se revendra.' },
    ]),

  // ---------- −7 · Les Deux Rives ----------
  H(7, 1, 'Les deux passerelles',
    'Deux passerelles franchissent le même gouffre, côte à côte. L’une est neuve, l’autre a cédé. Les deux existent en même temps.', [
      d('La passerelle cassée', v('ilka', 'Celle des Hauts-Ponts. Celle qui a cédé sous moi. Elle n’a rien à faire ici.'), v('', 'Une passerelle cassée en son milieu, rouillée.')),
      d('La passerelle neuve', v('ilka', 'Et celle-là, c’est celle qui n’a jamais cédé. Celle où j’ai encore mes jambes. Je ne veux pas la regarder.'), v('', 'Une passerelle neuve, intacte, juste à côté de l’autre.')),
      d('Les lignes d’eau', v('doran', 'Ils regravaient leur ligne plus haut, chaque année. Comme nous à la Nuit des lignes.'), v('', 'Des dizaines de lignes d’eau gravées, l’une au-dessus de l’autre.')),
    ], [
      { texte: 'Prendre la passerelle cassée', effet: 'eclat', drapeau: 'vraie-rive', recit: 'Vous traversez par la vraie, en sautant le trou. Ilka passe la première. De l’autre côté, un Éclat, là où la passerelle neuve aurait dû arriver.' },
      { texte: 'Prendre la passerelle neuve', effet: 'lampe', recit: 'La passerelle neuve tient, bien sûr. Au bout, une lanterne qui n’existe que dans ce souvenir. Elle éclaire quand même.' },
    ]),
  H(7, 2, 'Ceux qui regravaient',
    'Un mur entier couvert de lignes d’eau, et sous chaque ligne, une phrase. Ceux d’avant écrivaient ce qu’ils espéraient encore.', [
      d('La première ligne', v('vela', '« L’Écluse tiendra. » Tout en bas, la plus vieille. Ils y croyaient.'), v('', 'Sous la ligne la plus basse : « L’Écluse tiendra. »')),
      d('Une ligne au milieu', v('ilka', '« On montera plus haut. » Alors eux non plus, ils ne l’avaient pas, leur Écluse.'), v('', 'Plus haut : « On montera plus haut. »')),
      d('La dernière ligne', v('doran', 'Il n’y a rien sous la dernière. Juste une empreinte de main.'), v('', 'Sous la ligne la plus haute, pas de phrase. Une empreinte de main.')),
    ], [
      { texte: 'Graver une ligne', effet: 'eclat', drapeau: 'ligne-gravee', recit: 'Tu graves une ligne au-dessus de toutes les autres, et dessous : « On ne la laissera pas monter seule. » Un Éclat se détache du mur.' },
      { texte: 'Recopier le mur', effet: 'composants', recit: 'Les Veilleurs paieront bien pour une copie de ce mur. Doran la fait au fusain, pierre par pierre.' },
    ]),
  H(7, 3, 'Le souvenir à venir',
    'Une salle où l’eau monte et redescend sans bruit. Dans les reflets, on voit Vertiga. Puis ton district, sous l’eau.', [
      d('Le reflet', v('ilka', 'C’est faux. Hein ? C’est faux.'), v('', 'Dans l’eau, ton district englouti. Personne ne s’en étonne.')),
      d('Les fils', v('vela', 'Elle tisse avec ce qui pourrait arriver, pas seulement avec ce qui est arrivé. La Tisseuse est tout près.'), v('', 'Des fils fins comme des cheveux tendent l’eau comme un tissu.')),
      d('Une main tendue', v('joss', 'Elle veut nous faire peur pour qu’on reste ici. Les gens qui veulent nous garder font toujours ça.'), v('', 'Dans le reflet, quelqu’un te tend la main pour te faire entrer dans l’eau.')),
    ], [
      { texte: 'Regarder jusqu’au bout', effet: 'eclat', drapeau: 'avenir-vu', recit: 'Tu regardes ton district sous l’eau jusqu’à ce que l’image se brouille. Tu sais ce que tu dois empêcher. Un Éclat remonte à la surface.' },
      { texte: 'Troubler l’eau', effet: 'lampe', recit: 'Tu frappes l’eau. Le reflet se brise, et les fils se défont en lueurs qui éclairent le chemin.' },
    ]),

  // ---------- −8 · La Ruche d'ambre ----------
  H(8, 1, 'Le campement des Veilleurs',
    'Des lampes à algues éteintes, des carnets ouverts, des couvertures pliées. Les Veilleurs ne sont pas partis : ils sont encore là, quelque part dans un souvenir.', [
      d('Les carnets', v('doran', 'Ils ont relevé les tables gravées. Des noms, puis de moins en moins de noms, puis seulement des empreintes.'), v('', 'Des carnets de relevés, ouverts sur des tables gravées.')),
      d('Une ligne inachevée', v('vela', 'Ils ont arrêté d’écrire au milieu d’un mot. La Tisseuse les a pris là, en plein travail, dans un souvenir heureux.'), v('', 'Le dernier carnet s’arrête au milieu d’une ligne.')),
      d('L’ambre', v('kessa', 'L’ambre suinte des murs. Elle sent le miel et la cire. Mes parents en parlaient, de cette odeur.'), v('', 'De l’ambre suinte des murs, épaisse, dorée.')),
    ], [
      { texte: 'Rallumer leurs lampes', effet: 'lampe', drapeau: 'lampes-veilleurs', recit: 'Tu rallumes une à une les lampes des Veilleurs. Si l’un d’eux se réveille, il verra qu’on est venu. Tu en gardes une pour la route.' },
      { texte: 'Emporter les carnets', effet: 'eclat', recit: 'Les carnets remonteront chez les Veilleurs. Entre deux pages, un Éclat qu’un fouilleur gardait comme marque-page.' },
    ]),
  H(8, 2, 'La table de la Ruche',
    'Une table gravée, à demi prise dans l’ambre. Il manque un morceau, cassé net. La fouilleuse qui est remontée autrefois tenait cet éclat.', [
      d('La cassure', v('doran', 'Il manque un morceau. Celui que les Veilleurs gardent sous clé, au district. Elle l’a rapporté seule.'), v('', 'Il manque un morceau de la table, cassé net.')),
      d('Ce qui est gravé', v('liane', 'Ce n’est pas une langue. C’est un schéma. Des implants, avant les implants. Quelqu’un les a dessinés ici, il y a très longtemps.'), v('sasha', 'Un schéma de câblage. Plus vieux que tout ce que je connais, et pourtant je le comprends.'), v('', 'Des lignes gravées, comme un schéma de câblage.')),
      d('Une phrase', v('vela', '« Elle attend. » C’est tout ce qui reste au bord de la cassure. Je ne sais pas qui est « elle ».'), v('', 'Au bord de la cassure : « Elle attend. »')),
    ], [
      { texte: 'Relever le schéma', effet: 'eclat', drapeau: 'schema', recit: 'Tu relèves le schéma au fusain. La Glacière, les implants, l’ambre : tout se tient. Un Éclat tombe de la table quand tu la touches.' },
      { texte: 'Dégager la table', effet: 'composants', recit: 'Vous dégagez la table de l’ambre. L’ambre se revend bien au district, et il y en a beaucoup.' },
    ]),
  H(8, 3, 'Le souvenir heureux',
    'Au cœur de la Ruche, les Veilleurs perdus sont assis en cercle et sourient. Ils fêtent quelque chose qui n’a jamais eu lieu.', [
      d('Le cercle', v('joss', 'On ne les sauve pas en criant. On leur rappelle un vrai détail. Laissez-moi faire.'), v('vela', 'Ils sont heureux. Ils ne veulent pas en sortir. Je les comprends un peu.'), v('', 'Six Veilleurs, assis en cercle, sourient à quelque chose que vous ne voyez pas.')),
      d('La fête', v('ilka', 'Ils fêtent la fin de la montée des eaux. Un truc qui n’arrivera jamais. C’est cruel.'), v('', 'Ils lèvent leurs verres à une fête qui n’a jamais eu lieu.')),
      d('Un fil', v('doran', 'Un fil d’ambre les relie tous à quelque chose, plus bas. La Tisseuse. On coupe le fil, ou on la bat.'), v('', 'Un fil doré relie chacun d’eux à quelque chose, plus bas.')),
    ], [
      { texte: 'Leur rappeler un vrai détail', effet: 'eclat', drapeau: 'vrai-detail', recit: 'Tu dis le nom de Tobin, et le prix du pain au marché. Un Veilleur cligne des yeux. Le souvenir tremble. Un Éclat tombe de son verre.' },
      { texte: 'Les laisser rêver', effet: 'composants', recit: 'Vous ne les dérangez pas : la Tisseuse d’abord. Leur campement rend des vivres et du matériel.' },
    ]),

  // ---------- −9 · Le Ciel d'en bas ----------
  H(9, 1, 'La lettre d’Ysé',
    'Aucun fouilleur n’a jamais dépassé cette salle. Avant de partir, tu as glissé dans ton sac la lettre d’Ysé. Tu la relis à la lueur des cristaux.', [
      d('La lettre', v('vela', '« Si la Tisseuse garde des noms, demande-lui le sien. » Ysé a toujours su ce qu’il fallait demander.'), v('', '« Si la Tisseuse garde des noms, demande-lui le sien. »')),
      d('Le plafond', v('nuit', 'Le plafond est plein d’étoiles. Ce ne sont pas des étoiles. Ce sont des cristaux, très loin au-dessus. On dirait un ciel.'), v('', 'Le plafond est si haut qu’il ressemble à un ciel étoilé.')),
      d('Un fil sur le sol', v('kessa', 'Ses fils traînent partout, ici. Ils sont usés. Elle les tient depuis trop longtemps.'), v('', 'Des fils usés traînent sur le sol.')),
    ], [
      { texte: 'Garder la lettre sur toi', effet: 'eclat', drapeau: 'lettre-yse', recit: 'Tu ranges la lettre contre toi. Plus loin, un Éclat brille dans un nid de fils : la Tisseuse l’avait gardé pour quelqu’un.' },
      { texte: 'Suivre les fils', effet: 'lampe', recit: 'Les fils luisent faiblement quand on les suit. Ils éclairent le chemin vers le bas.' },
    ]),
  H(9, 2, 'Les noms perdus',
    'Des fils noués autour de petits cristaux, des milliers. Chacun garde un nom que les tables gravées ont perdu.', [
      d('Un nœud', v('vela', 'Un nom, à l’intérieur. Personne ne s’en souvient, sauf elle. Si elle meurt, il meurt avec.'), v('', 'Un petit cristal, noué de fil, murmure un nom.')),
      d('Un nom connu', v('doran', 'Celui-là, je le connais. C’est un des ouvriers de 2066. Elle l’a gardé, lui aussi.'), v('', 'Un des noms est gravé dans le registre de −4.')),
      d('Un nœud défait', v('joss', 'Celui-ci, elle l’a dénoué. Elle a donné son nom à quelqu’un, il y a longtemps, pour qu’il se souvienne d’elle.'), v('', 'Un seul nœud est défait. Le fil est vide.')),
    ], [
      { texte: 'Renouer un nom', effet: 'eclat', drapeau: 'nom-renoue', recit: 'Tu refais le nœud d’un fil qui glissait. Le nom tient. Quelque part, plus bas, la Tisseuse a senti ta main. Un Éclat se détache.' },
      { texte: 'Prendre quelques cristaux', effet: 'composants', recit: 'Les cristaux sans nom se revendront. Ceux qui en ont un, tu les laisses.' },
    ]),
  H(9, 3, 'Le nid',
    'La Tisseuse est là, au fond, dans un nid de fils. Elle ne vous attaque pas encore. Ses mains tremblent.', [
      d('Ses mains', v('vela', 'Elle tient tous ses fils, mais elle tremble. Elle est fatiguée. Elle a peur de lâcher.'), v('', 'Ses mains tremblent, et ses fils avec.')),
      d('Ses yeux', v('kessa', 'Elle nous regarde comme on regarde quelqu’un qu’on attendait depuis très longtemps.'), v('', 'Elle vous regarde, sans colère.')),
      d('La lettre', v('ilka', 'Une fois, on demande. Si elle répond par des coups, on répond pareil.'), v('', 'La lettre d’Ysé, dans ta poche, pèse lourd.'), v('vela', 'Tu as gardé la lettre. Demande-lui, maintenant.', 'lettre-yse')),
    ], [
      { texte: 'Lui demander son nom', effet: 'eclat', drapeau: 'nom-demande', recit: 'Elle ne répond pas. Pas encore. Mais elle sourit, et un Éclat roule jusqu’à tes pieds.' },
      { texte: 'Se préparer au combat', effet: 'composants', recit: 'L’escouade dépose ses sacs et se prépare. Au pied du nid, des restes de fouilles anciennes.' },
    ]),

  // ---------- −10 · Le Puits d'avant ----------
  H(10, 1, 'Les portes nettes',
    'Ici, tout est net : les salles, les cristaux, les portes, mieux scellées que partout ailleurs. Rien n’a vieilli.', [
      d('Une porte', v('doran', 'Fermée de l’intérieur, comme toutes les autres. En 2066, mon père a entendu quelqu’un tirer un loquet. C’était ici.'), v('', 'Une porte scellée de l’intérieur.')),
      d('La poussière', v('sasha', 'Il n’y en a pas. Pas un grain. Quelqu’un entretient tout ça. Ou rien ne s’use, ici.'), v('', 'Pas un grain de poussière.')),
      d('Une voix', v('vela', 'Une seule voix, la plus ancienne. Pas de mélange. Celui qui la porte sait exactement qui il est.'), v('', 'Un silence épais, comme si quelqu’un retenait son souffle.')),
    ], [
      { texte: 'Frapper à une porte', effet: 'eclat', drapeau: 'frappe', recit: 'Tu frappes trois coups. Personne n’ouvre. Mais sous la porte, quelqu’un glisse un Éclat, comme on rend la monnaie.' },
      { texte: 'Passer sans bruit', effet: 'composants', recit: 'Vous passez sans bruit. Dans une alcôve, du matériel de ceux d’avant, intact.' },
    ]),
  H(10, 2, 'La salle des tables',
    'Des tables gravées, alignées comme dans une école. Sur chacune, la même phrase, de plus en plus effacée.', [
      d('La phrase', v('vela', '« Que celui qui lit ceci compte les voix qu’il porte. » Compte. Le mot de la Confluence.'), v('', '« Que celui qui lit ceci compte les voix qu’il porte. »')),
      d('Les bancs', v('ilka', 'Ils apprenaient ça par cœur. Comme une leçon. Comme nous la Nuit des lignes.'), v('', 'Des bancs de pierre, usés par des générations.')),
      d('Une table neuve', v('doran', 'Celle-là est plus récente. Même écriture que les autres. Il a ajouté quelque chose dessous, puis il l’a effacé.'), v('', 'Une table plus récente, dont la dernière ligne a été effacée.')),
    ], [
      { texte: 'Compter tes voix', effet: 'eclat', drapeau: 'voix-comptees', recit: 'Tu fais compter à l’escouade les voix qu’elle porte. Véla s’arrête à un chiffre et sourit. Un Éclat se détache d’une table.' },
      { texte: 'Relever la table effacée', effet: 'composants', recit: 'Tu relèves ce qui reste de la ligne effacée. Pour Ysé. Au fond de la salle, des outils de graveur.' },
    ]),
  H(10, 3, 'Il vous attendait',
    'Au centre de la dernière salle, quelqu’un est assis. Il ne se lève pas. Il vous attendait.', [
      d('Lui', v('vela', 'Le Premier Porteur. Il n’a jamais mélangé sa voix à une autre. C’est pour ça qu’il est si fort.'), v('', 'Un homme assis, très calme, qui vous regarde arriver.')),
      d('Ses mains', v('doran', 'Il a les mains d’un graveur. Il a écrit toutes ces tables. Lui seul.'), v('', 'Des mains abîmées, de graveur.')),
      d('Ton nom', v('ilka', 'Il connaît ton nom. Il l’a lu sur le mur des fouilleurs, tout en haut.', 'nom-grave'), v('ilka', 'On est venus jusqu’ici pour des réponses. Allons lui en demander.'), v('', 'Il te regarde comme s’il te connaissait déjà.')),
    ], [
      { texte: 'Lui dire qui tu es', effet: 'eclat', drapeau: 'presente', recit: 'Tu dis ton nom, ton district, et la mer qui monte. Il hoche la tête, lentement. Un Éclat tombe de la table devant lui.' },
      { texte: 'Préparer l’escouade', effet: 'composants', recit: 'L’escouade se met en place sans un mot. Au pied des marches, ce que ceux d’avant ont laissé.' },
    ]),
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
  { strate: 2, nom: 'Murs de 2066', texte: 'Des caches murées : un Augmenté les force, et y trouve le double.' },
  { strate: 3, nom: 'Le noir complet', texte: 'Même un Résonant ne sent rien au-delà des salles voisines. Une lanterne attend à la Halte.' },
  { strate: 4, nom: 'Portes rondes', texte: 'Fermé de l’intérieur : deux fois plus de salles scellées.' },
  { strate: 5, nom: 'Les niches', texte: 'Les caches sont des niches : parfois une carte y dort.' },
  { strate: 6, nom: 'Les pleurs', texte: 'Les archives sont plus nombreuses derrière le mur.' },
  { strate: 7, nom: 'Souvenirs doubles', texte: 'Certains combats ont deux occupants : choisis lequel affronter.' },
  { strate: 8, nom: 'Les Veilleurs perdus', texte: 'Un Veilleur égaré attend toujours quelque part sur le plan.' },
  { strate: 9, nom: 'Les fils', texte: 'Un fil relie deux salles côte à côte : on peut le suivre une fois.' },
  { strate: 10, nom: 'Fermé de l’intérieur', texte: 'Les portes à Fréquence demandent une suite de 4.' },
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
    'Un deuxième, sur une pompe noyée : « T. Daro ». Lui non plus n’est jamais remonté.',
    'Le dernier, à moitié effacé : le nom du père de Doran. Les trois noms du registre de 2066.',
  ], fin: 'Trois ouvriers de 2066 sont descendus et ne sont jamais revenus barrer leur nom. Le père de Doran, lui, est remonté. Seul.' },
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
    'Un sceau de 2066. La Maison Orsève vidait les Berceaux avant même l’incident du 14.',
  ], fin: 'La Maison Orsève vide les Berceaux depuis au moins 2066. L’incident du 14 n’a rien arrêté. Il a juste fermé une porte de plus.' },
  { strate: 6, nom: 'Les tampons de 2066', but: 'Retrouver les ordres de service du chantier de la nuit du 14.', etapes: [
    'Un ordre de service : « Couler le mur, niveau 7. Urgent. »',
    'Un deuxième : « Ne pas écouter. Ne pas répondre. »',
    'Un troisième, signé de la direction du district de l’époque : « Sur demande de la Maison Orsève. »',
    'Le dernier, de la main du père de Doran : « J’ai entendu le loquet. Ce n’était pas nous. »',
  ], fin: 'En 2066, c’est la Maison Orsève qui a demandé au district de murer le niveau 7. Le loquet, lui, a été tiré de l’autre côté.' },
  { strate: 7, nom: 'Les lignes d’eau', but: 'Relever les lignes d’eau de ceux d’avant, de la plus basse à la plus haute.', etapes: [
    'La ligne la plus basse : « L’Écluse tiendra. »',
    'Une ligne plus haut : « L’Écluse a cédé. On montera. »',
    'Plus haut encore : « Les cœurs des Berceaux soulèvent. Les familles montent. »',
    'La dernière : « Cinq familles. Les autres restent. »',
  ], fin: 'Ceux d’avant ont soulevé leurs villes avec les cœurs des Berceaux. Pas pour tout le monde : pour cinq familles. Comme les Hauts.' },
  { strate: 8, nom: 'Les six Veilleurs', but: 'Retrouver les Veilleurs de Tobin égarés dans les souvenirs de la Ruche.', etapes: [
    'Une Veilleuse, endormie contre un pilier. Elle se réveille en demandant l’heure.',
    'Deux Veilleurs, qui se tenaient la main dans le même rêve.',
    'Un Veilleur qui comptait les tables. Il en était à mille deux cents.',
    'Le dernier, le chef d’équipe. Il tient un éclat de table, le même que celui de la fouilleuse d’autrefois.',
  ], fin: 'Les six Veilleurs sont rentrés. Leur chef a remis à Ysé un éclat de table : la pièce qui manquait, gravée « Elle attend ».' },
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
    origine: 'L’écho d’un Veilleur mort en service, qui fait encore sa ronde dans les salles closes.',
    conseil: 'Fêlures cachées, et il prend la lignée de la dernière carte qui le frappe : varie tes coups, et termine par celle qu’il craint.',
    secret: 'Les échos de veilleurs connaissent encore les mots de passe des Veilleurs de Sédime. Tobin les a tous notés.',
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
    secret: 'L’ambre de la Ruche ne vient pas des insectes. Il suinte de quelque chose d’enfoui, plus bas : la Glacière.',
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
