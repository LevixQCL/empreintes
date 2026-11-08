// Les familles du district (7 novembre 2026) : les habitants ne sont plus un compteur de 600, ce sont 48 foyers nommés.
// Audit d'un game designer externe : un nombre fini de familles écrites à la main, un Mur des empreintes dans les habitations
// (« 31 / 48 »), et un souvenir que chaque famille peut confier à une carte (une ligne de son journal, AUCUN effet en combat).
// Trois façons d'arriver :
// - depart : les ouvriers qui ont envoyé Ilka chercher le directeur (déjà là au début) ;
// - quartier : le bouche-à-oreille, quand on protège des gens (gardiens vaincus, naufragés, rencontres, Port, Flèche) ;
// - basses : une famille restée en bas, qu'un Porteur va chercher dans un lieu des Basses (digue.ts).
// Les familles des souvenirs d'Archives (fragments.ts, un par palier) en font partie : elles arrivent au plus tard à leur palier.

export type ArriveeFamille = 'depart' | 'quartier' | 'basses';

export interface FamilleDef {
  id: string;
  /** « les Orlan » */
  nom: string;
  arrivee: ArriveeFamille;
  /** qui elle est, en une ligne */
  qui: string;
  /** le souvenir qu'elle peut confier à une carte : une phrase, gravée dans le journal de la carte */
  souvenir: string;
  /** le souvenir d'Archives qu'elle apporte à un palier (fragments.ts) */
  fragment?: string;
}

const F = (id: string, nom: string, arrivee: ArriveeFamille, qui: string, souvenir: string, fragment?: string): FamilleDef =>
  ({ id, nom, arrivee, qui, souvenir, ...(fragment ? { fragment } : {}) });

/** Dans l'ordre où le bouche-à-oreille les amène (les familles des Basses, elles, arrivent quand on va les chercher) */
export const FAMILLES_DISTRICT: readonly FamilleDef[] = [
  // ---- le départ
  F('ruel', 'les Ruel', 'depart', 'Ouvriers de l’écluse. Ce sont eux qui ont envoyé Ilka chercher un directeur.',
    'Le jour où Ilka est partie, les Ruel ont laissé une lampe à la fenêtre. Ils ne l’ont éteinte qu’en te voyant arriver.'),
  F('abady', 'les Abady', 'depart', 'Une famille de soudeurs de la digue, qui a voté pour qu’on rouvre le puits.',
    'Le père Abady a soudé la plaque du directeur lui-même, avec ce qui restait d’une rambarde. Elle est un peu de travers. Il dit que c’est exprès.'),

  // ---- le quartier (bouche-à-oreille), avec les familles des souvenirs d’Archives à leur place
  F('orlan', 'les Orlan', 'quartier', 'Gardiens des pompes depuis trois générations.',
    'Dans le carnet des Orlan, une ligne par nuit : « tenu » ou « pas tenu ». Ils ont écrit ton nom à côté du dernier « tenu ».', 'famille-pompes'),
  F('gaudet', 'les Gaudet', 'quartier', 'Des passeurs de barque, qui connaissent chaque courant de l’anneau.',
    'La grand-mère Gaudet dit qu’on reconnaît un bon passeur à ce qu’il ramène toujours quelqu’un. Même quand il rentre les mains vides.'),
  F('hollen', 'les Hollen', 'quartier', 'Une famille de cuisiniers : la soupe du quai, c’est eux.',
    'Les Hollen ont toujours une louche de plus dans la marmite. Pour celui qui n’a pas osé demander.'),
  F('marsac', 'les Marsac', 'quartier', 'Des réparateurs de filets, réfugiés d’une cuvette voisine.',
    'Les Marsac ont quitté leur cuvette avec un seul filet. Ils l’ont réparé tant de fois qu’il ne reste plus un fil d’origine. C’est toujours le leur.'),
  F('trelan', 'les Trélan', 'quartier', 'Une mère et ses trois filles, vitrières.',
    'Les Trélan ont posé un carreau bleu dans chaque fenêtre qu’elles ont réparée. Le district en compte deux cent douze.'),
  F('meric', 'les Méric', 'quartier', 'Une famille venue de loin, de ville en ville, toujours plus loin de la mer.',
    'Sur la couverture des Méric, un nom brodé par ville traversée. La grand-mère a laissé de la place après celui du district.', 'famille-route'),
  F('cazal', 'les Cazal', 'quartier', 'Des sonneurs : ce sont eux qui donnent l’alerte quand l’eau passe la ligne.',
    'Les Cazal ont sonné l’alerte quarante fois en un hiver. La quarante et unième, ils ont sonné pour rien, juste pour entendre qu’on était encore là.'),
  F('dumay', 'les Dumay', 'quartier', 'Un vieux couple d’horlogers.',
    'Toutes les horloges des Dumay retardent de onze minutes : l’heure exacte où la mer a franchi l’ancienne digue. Ils refusent de les remettre.'),
  F('esquer', 'les Esquer', 'quartier', 'Des pêcheurs de lumière, qui ramassent les algues qui brillent.',
    'Les Esquer ramassent les algues qui brillent la nuit. Ils en laissent toujours une sur la marche de ceux qui n’ont plus de lampe.'),
  F('sorne', 'les Sorne', 'quartier', 'Des bâtisseurs : le grand-père a coulé le pilier douze.',
    'Sur la photo des Sorne, des ouvriers dans l’eau jusqu’aux chevilles devant le pilier douze. Au dos : « Soixante ans plus tard, il tient. Nous aussi. »', 'famille-fondations'),
  F('lebrun', 'les Lebrun', 'quartier', 'Une famille de couturiers qui habille tout le quai.',
    'Les Lebrun cousent un fil bleu dans l’ourlet de chaque vêtement. Pour qu’on sache, s’il faut un jour se retrouver, qu’on vient d’ici.'),
  F('auzan', 'les Auzan', 'quartier', 'Un frère et une sœur, conteurs de la Nuit des lignes.',
    'Les Auzan racontent la même histoire à chaque Nuit des lignes, et la changent un peu à chaque fois. Ils disent que c’est comme ça qu’elle reste vivante.'),
  F('peyrol', 'les Peyrol', 'quartier', 'Des apiculteurs qui gardent leurs ruches sur les toits.',
    'Les abeilles des Peyrol ne vont jamais vers la mer. Le vieux Peyrol dit qu’elles savent, elles aussi.'),
  F('taverne', 'les Taverne', 'quartier', 'Une famille de cuisiniers chassés d’une maison noyée.',
    'Les Taverne ont un carreau bleu de leur ancienne cuisine, avec un trait de peinture : la première hauteur de l’eau. Elle n’était qu’au genou.', 'famille-ligne'),
  F('rosel', 'les Rosel', 'quartier', 'Des musiciens de rue, qui jouent sur des tuyaux de pompe.',
    'Les Rosel jouent sur de vieux tuyaux de pompe. Chaque tuyau a la note de la profondeur d’où il vient.'),
  F('valade', 'les Valade', 'quartier', 'Une famille de guetteurs, perchée tout en haut de l’anneau.',
    'Depuis le toit des Valade, on voit les îles des Hauts par temps clair. Les enfants leur ont donné des noms. Pas les mêmes que là-haut.'),
  F('crozet', 'les Crozet', 'quartier', 'Des tisserands de corde, pour les pontons et les barques.',
    'Les Crozet tressent un fil de chaque famille du quai dans les cordes des barques. Ils disent qu’une corde de tout le monde ne casse pas.'),
  F('vey', 'les Vey', 'quartier', 'Une famille modeste, connue pour donner plus qu’elle n’a.',
    'Les Vey gardent un ticket de pain de l’hiver des Accords, jamais utilisé : l’aïeul avait donné sa part. « Il n’a jamais servi, et il a servi quand même. »', 'famille-accords'),
  F('morvan', 'les Morvan', 'quartier', 'Des charpentiers de barque.',
    'Les Morvan gravent la date de chaque barque sous son banc. La plus vieille qui flotte encore a cent onze ans.'),
  F('bastide', 'les Bastide', 'quartier', 'Une famille d’infirmiers, qui a ouvert la première Clinique dans une cave.',
    'La première Clinique des Bastide tenait dans une cave, avec une seule lampe. Ils ont gardé l’ampoule, grillée, sur l’étagère d’honneur.'),
  F('lacour', 'les Lacour', 'quartier', 'Des jardiniers de toit, qui font pousser des tomates dans du sel lavé.',
    'Les tomates des Lacour sont petites et un peu salées. Tout le quai jure que ce sont les meilleures du monde.'),
  F('marbel', 'les Marbel', 'quartier', 'Des jardiniers qui ont remonté leurs bacs d’un étage à chaque crue.',
    'Sur la boîte de semences des Marbel, gravé à la pointe : « Là-haut, il y aura de la terre. On plantera tout. »', 'famille-semis'),
  F('servan', 'les Servan', 'quartier', 'Un ancien greffier des Hauts et sa famille, descendus par choix.',
    'Le vieux Servan a renoncé à sa place là-haut pour rester avec sa fille, en bas. Il dit qu’il a gagné au change. Il le dit chaque jour, pour s’en convaincre.'),
  F('pradel', 'les Pradel', 'quartier', 'Des boulangers qui cuisent au four de la Forge, la nuit.',
    'Les Pradel cuisent le pain au four de la Forge, la nuit, quand il refroidit. Au matin, tout le quai sent le pain et le métal.'),
  F('doucet', 'les Doucet', 'quartier', 'Une famille de pêcheurs, gardienne de la lampe de veille.',
    'La lampe de veille des Doucet est restée allumée onze nuits, une fois. Le pêcheur est rentré la douzième. Depuis tes barques, elle ne s’éteint plus.', 'famille-veille'),
  F('anciens', 'les Anciens du conseil', 'quartier', 'Les doyens du district, gardiens du registre des foyers.',
    'Dans le registre des Anciens, aucune page n’a plus de nom barré au crayon rouge. En marge : « Ils montent tous. Le directeur l’a promis. »', 'famille-tous'),

  // ---- les Basses : une famille par lieu (digue.ts), restée en bas quand la digue s’est refermée
  F('pellan', 'les Pellan', 'basses', 'Des lavandières restées aux Lavoirs, sur les bacs les plus hauts.',
    'Les Pellan lavaient le linge des Hauts, autrefois. Ils ont gardé un drap brodé d’un blason qu’aucun d’eux ne sait lire.'),
  F('ardoin', 'les Ardoin', 'basses', 'La famille du dernier éclusier, qui n’a jamais quitté sa maison.',
    'Le père Ardoin a fermé l’écluse le dernier soir, de ses mains. Il a attendu dix-neuf ans qu’on vienne lui dire de la rouvrir.'),
  F('sauvel', 'les Sauvel', 'basses', 'Une famille nombreuse qui vivait sur la passerelle à linge.',
    'Les enfants Sauvel gravaient leur taille sur la passerelle, à côté de la hauteur de l’eau. Ils ont arrêté le jour où l’eau a grandi plus vite qu’eux.'),
  F('lunel', 'les Lunel', 'basses', 'Deux sœurs âgées, dans l’escalier des blanchisseuses.',
    'Les sœurs Lunel triaient des boutons par couleur pour passer les nuits de houle. Il leur manque un seul bleu pour finir la boîte.'),
  F('kerval', 'les Kerval', 'basses', 'Des forgerons de chaînes, à l’atelier de la Rue des Treuils.',
    'Les Kerval ont forgé les chaînes du quatrième anneau. On ne les a jamais payés. Ils disent que la digue tient, et que c’est un salaire.'),
  F('mirande', 'les Mirande', 'basses', 'Une grutière et son fils, réfugiés dans la cabine de la grue couchée.',
    'La radio des Mirande n’attrape que la mer. Le fils jure qu’une nuit, une voix y a dit son prénom.'),
  F('ibarre', 'les Ibarre', 'basses', 'Des ferronniers, gardiens de la forge froide.',
    'L’enclume des Ibarre porte un sigle plus vieux que la digue. Ils frappent dessus chaque matin, pour qu’elle ne s’ennuie pas.'),
  F('nalis', 'les Nalis', 'basses', 'La famille du pontier, avec un plan de la digue que personne n’a jamais vu.',
    'Sur le plan des Nalis, un cercle rouge sous l’anneau : « ne pas creuser ». Le grand-père n’a jamais dit pourquoi. Il a juste dit : « Plus tard. »'),
  F('haudry', 'les Haudry', 'basses', 'L’ancien concierge de l’école et ses petits-enfants.',
    'Le vieux Haudry repeint la marelle du préau chaque été, sous un doigt d’eau. La case du ciel touche la ligne de la mer.'),
  F('prevel', 'les Prével', 'basses', 'L’institutrice de l’École noyée et sa famille.',
    'Madame Prével n’a jamais effacé sa dernière leçon. Ses élèves ont calculé : trois mètres en cent ans, plus haut que le préau. Ils avaient raison, et en avance.'),
  F('casset', 'les Casset', 'basses', 'Des lecteurs, qui ont sauvé la bibliothèque de l’école livre par livre.',
    'Les Casset ont séché trois mille livres, une page à la fois. Ils ont rangé chacun par le nom du dernier enfant qui l’avait emprunté.'),
  F('berot', 'les Bérot', 'basses', 'Une famille de sonneurs, qui veille sur la cloche de la cour.',
    'La cloche des Bérot sonne seule les nuits de houle. Ils ont compté : jamais deux fois le même nombre de coups.'),
  F('tessier', 'les Tessier', 'basses', 'Des puisatiers, installés dans la citerne sèche.',
    'Les Tessier montent les marches trop hautes de la citerne chaque jour. Les enfants ont appris à marcher dessus avant de marcher droit.'),
  F('okane', 'les Tavel', 'basses', 'Un tailleur de pierre et sa fille, sous la galerie des voûtes.',
    'Le père Tavel cherche le joint des voûtes depuis vingt ans. Il n’y en a pas. Il dit que c’est la plus belle pierre qu’il ait jamais touchée.'),
  F('varenne', 'les Varenne', 'basses', 'Des mécaniciens, qui font tourner les vannes des Citernes.',
    'Les Varenne règlent des vannes qui suivent une marée d’un autre temps. Ils ne savent pas pour qui. Ils les règlent quand même.'),
  F('aumont', 'les Aumont', 'basses', 'Une famille au fond du puisard, la plus discrète des Basses.',
    'La petite Aumont a posé sa main dans les empreintes du puisard. Elles étaient exactement à sa taille.'),
  F('roustan', 'les Roustan', 'basses', 'Des gardiens de marches, sur les premières marches du Palier.',
    'Les Roustan balaient les premières marches du Palier chaque matin. Ils disent que quelqu’un doit bien le faire, depuis le temps.'),
  F('falgue', 'les Falgue', 'basses', 'Une famille de lampistes, dans la niche aux lampes.',
    'Les lampes de pierre s’allument quand un Falgue approche. Pour les autres, il faut attendre. Personne ne sait pourquoi.'),
  F('demare', 'les Démare', 'basses', 'Des copistes, qui recopient les empreintes du palier gravé.',
    'Les Démare ont recopié neuf mille empreintes du palier gravé. Ils disent qu’aucune ne se ressemble, et qu’aucune ne leur est étrangère.'),
  F('veilleurs', 'les Huisset', 'basses', 'Trois générations assises devant une porte sans poignée.',
    'Les Huisset écoutent l’eau du puits derrière la porte. Ils disent qu’elle a le bruit d’une respiration. Celle de tout le district.'),
];

export const familleDef = (id: string) => FAMILLES_DISTRICT.find((f) => f.id === id);
/** La famille qui apporte un souvenir d'Archives */
export const familleDuFragment = (fragment: string) => FAMILLES_DISTRICT.find((f) => f.fragment === fragment);
/** Les familles du bouche-à-oreille, dans l'ordre */
export const FAMILLES_QUARTIER = FAMILLES_DISTRICT.filter((f) => f.arrivee === 'quartier');
export const FAMILLES_DEPART = FAMILLES_DISTRICT.filter((f) => f.arrivee === 'depart');
