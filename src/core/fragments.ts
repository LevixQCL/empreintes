// Les fragments d'archives : de courts textes trouvés dans les Strates, rangés dans le Codex.
// Ils racontent, par des voix de l'époque, ce que l'intro ne fait qu'effleurer.
// Aucun pays, aucune personne, aucun conflit réel n'est nommé.

export interface Fragment {
  id: string;
  titre: string;
  /** ce que c'est, dans le monde du jeu */
  support: string;
  lignes: string[];
}

export const FRAGMENTS: Fragment[] = [
  {
    id: 'mure', titre: 'Ce qui s’est muré', support: 'Un ordre de service, tamponné deux fois',
    lignes: [
      'Chantier d’abris, niveau 7. Suite à l’incident du 14, l’accès est condamné jusqu’à nouvel ordre.',
      'Le personnel ne mentionne pas l’incident à l’extérieur. Les familles seront indemnisées.',
      'Note au crayon, en marge : « Ils ont entendu quelqu’un pleurer derrière la paroi. Il n’y avait personne. »',
    ],
  },
  {
    id: 'ligne-eau', titre: 'La ligne d’eau', support: 'Une photo de famille, annotée au dos',
    lignes: [
      'Nous quatre devant la maison, l’été avant qu’on parte.',
      'Papa a peint la ligne bleue sur le mur, là où l’eau s’est arrêtée la première fois.',
      'Il disait qu’on la regarderait en riant, plus tard. On ne l’a jamais revue.',
    ],
  },
  {
    id: 'infos', titre: 'Les infos du soir', support: 'Un extrait de journal intime',
    lignes: [
      'Ce soir, quarante minutes de journal. Les élections, les prix, la colère, encore les élections.',
      'La sécheresse dans le Sud : vingt secondes, à la fin, entre la météo et le sport.',
      'Je me suis surprise à zapper. Je crois que tout le monde zappe.',
    ],
  },
  {
    id: 'colonne', titre: 'Colonne', support: 'Une lettre jamais postée',
    lignes: [
      'On marche depuis onze jours. La route est pleine jusqu’à l’horizon, dans les deux sens.',
      'Hier, un homme que je ne connaissais pas a porté ma fille sur ses épaules pendant des heures.',
      'Personne ne demande plus d’où l’on vient. On demande seulement : « Il vous reste de l’eau ? »',
    ],
  },
  {
    id: 'fracture', titre: 'Fracture', support: 'Le carnet d’un marin d’un navire scientifique',
    lignes: [
      'Six heures du matin. Le bruit est arrivé avant la vague : un craquement grand comme le monde.',
      'Toute la falaise s’est mise à glisser, lentement, comme si elle avait décidé de partir.',
      'Le chef de mission a dit « peu probable » à voix haute. Puis il s’est tu jusqu’au soir.',
    ],
  },
  {
    id: 'pierre', titre: 'Première pierre', support: 'Un plan de chantier, très usé',
    lignes: [
      'Tour de secours n° 12 : fondations sur pilier ancien, quarante étages prévus, quatre-vingts possibles.',
      'Livraison des passerelles vers les tours 9 et 14 : dans six ans, si l’acier arrive.',
      'Quelqu’un a ajouté : « Mon petit-fils finira le toit. »',
    ],
  },
  {
    id: 'puits-zero', titre: 'Puits Zéro, rapport 1', support: 'Le rapport d’un chef d’équipe',
    lignes: [
      'A 23 h 40 la foreuse a traversé dans du vide. On a cru a une grotte.',
      'C’est pas une grotte. Les murs sont lisses et courbes, et il y a des pierres qui brillent toutes seules.',
      'Personne a voulu descendre en premier. Au final on y est allés tous ensemble.',
    ],
  },
  {
    id: 'graveur', titre: 'Le Graveur', support: 'Des notes de laboratoire',
    lignes: [
      'Échantillon 41 : le cristal réagit aux voix. Pas aux sons : aux voix.',
      'Hypothèse : il ne stocke pas une énergie, il stocke quelqu’un. Ou la forme de quelqu’un.',
      'Si l’on peut lire cette forme, on peut peut-être l’inscrire. Et alors, sur quoi ?',
    ],
  },
  {
    id: 'sept', titre: 'Les Sept', support: 'Un formulaire de volontaire',
    lignes: [
      'Nom : effacé. Motivation : « Ma ville est sur la côte. Si ça peut servir. »',
      'Risques expliqués au candidat : oui. Risques compris par le candidat : la case n’est pas cochée.',
      'Tampon final : « Retenu. Greffe prévue le 3. »',
    ],
  },
  {
    id: 'voix', titre: 'La voix d’en dessous', support: 'Un enregistrement à moitié effacé',
    lignes: [
      '[grésillement] … ce n’est pas un souvenir à moi. Je me rappelle une mer que je n’ai jamais vue.',
      '[grésillement] … ils ne sont pas morts, là-dessous. Ils attendent qu’on se souvienne d’eux.',
      '[fin de l’enregistrement]',
    ],
  },
  {
    id: 'regle', titre: 'La règle aux deux échelles', support: 'Une règle de niveau, trouvée dans un abri',
    lignes: [
      'Deux graduations sur la même tige de laiton : l’une gravée « relevé », l’autre « niveau officiel ».',
      'À la date du 3 mars, la première indique 1,20 m. La seconde, 41 cm. Les deux relevés ont été notés le même jour, de la même main.',
      'Au registre de l’abri, seul le second chiffre a été recopié. C’est celui qui ne demandait pas d’évacuer.',
    ],
  },
  {
    id: 'seuil', titre: 'Au-dessus d’une porte', support: 'Une inscription traduite par les Veilleurs',
    lignes: [
      '« Ici, on entre seul, et l’on ressort avec ce qu’on a apporté. »',
      'Note de traduction : le dernier verbe reste incertain. Il pourrait aussi vouloir dire « ce qu’on porte ».',
      'La porte est fermée de l’intérieur. Personne n’est ressorti.',
    ],
  },
  {
    id: 'choses', titre: 'Inventaire, salle 4-C', support: 'Une liste dressée par des fouilleurs des Veilleurs',
    lignes: [
      '1 poignée de porte, usée d’un seul côté. 1 sandale, ressemelée trois fois. 1 petit animal taillé, sans valeur.',
      '412 objets au total. Chacun porte un nom et une date gravés. Aucun ne porte d’histoire.',
      'En marge, l’écriture d’Ysé : « Ils gardaient ce que personne d’autre ne pouvait se rappeler à leur place. »',
    ],
  },
  {
    id: 'brigade', titre: 'Rapport de sécurisation', support: 'Un rapport du Serment de Veyr',
    lignes: [
      'Salle close n° 11 sécurisée à 4 h 20. Aucun civil présent. Cristaux inventoriés, mis sous scellés, transférés vers les Hauts.',
      'Le brigadier Tessel signale qu’une voix lui a donné un ordre dans une langue inconnue. Il dit l’avoir compris.',
      'Mesure prise : le brigadier Tessel est relevé de ses fonctions et mis au repos.',
    ],
  },
  {
    id: 'deux-enfances', titre: 'Deux enfances', support: 'Deux fiches de lecture des Veilleurs, agrafées ensemble',
    lignes: [
      'Cristal 7-114 : se souvient d’une enfance au bord d’une mer tiède, d’une sœur, d’un jardin de pierres.',
      'Cristal 7-115, même individu, signature identique : se souvient d’être né sous la glace, enfant unique, sans avoir jamais vu la mer.',
      'Lectrice : Véla. Commentaire : « Les deux sont sincères. »',
    ],
  },
  {
    id: 'patient-5', titre: 'Patient 6', support: 'Une page arrachée au carnet d’un médecin',
    lignes: [
      'Troisième jour après la greffe. Le patient 6 me demande des nouvelles d’une mer dont personne ici n’a jamais entendu parler.',
      'Vingt ans plus tard, note de ses gardiens, au cœur de la première île : entre deux sommeils, il dessine toujours la même côte, avec ses criques et ses courants. Aucune carte ne la connaît.',
      'Ajout des Veilleurs, 2118 : son dessin correspond trait pour trait aux murs gravés d’une salle de la Strate −9.',
    ],
  },
  {
    id: 'formes', titre: 'Ce qu’ils voulaient être', support: 'Une note de travail des Veilleurs',
    lignes: [
      'Dans les couches profondes, les plus vieilles formes sont rares et nettes : un dragon entier, un grand esprit aux contours précis.',
      'À côté d’elles, et plus haut, on retrouve les mêmes dragons, mais recopiés cent fois, aux contours qui tremblent, et de plus en plus d’êtres sans nom.',
      'Hypothèse : ce ne sont pas leurs corps, mais les visages qu’ils se donnaient. Les derniers ne savaient plus lequel choisir.',
    ],
  },
  {
    id: 'berceau', titre: 'Le Berceau 9-3', support: 'Un relevé de stabilité, en double exemplaire',
    lignes: [
      'Fermé : vibrations en hausse dans les salles voisines, trois Rémanents éveillés en une semaine.',
      'Ouvert : les salles voisines se calment. Ses propres empreintes, elles, commencent à remuer.',
      'Sur la copie des Veilleurs, quelqu’un a ajouté : « Ils le savaient. Leurs consignes disaient quand même de fermer. »',
    ],
  },
  {
    id: 'noms', titre: 'La colonne des noms', support: 'Le relevé d’une table gravée',
    lignes: [
      'Colonne 1 : un nom. Colonne 2 : une date. Colonne 3 : les empreintes reçues, d’une à trente-deux.',
      'À côté, sur le même mur, d’autres tables, gravées plus tard et d’une main maladroite : la colonne des noms rétrécit, puis disparaît.',
      'Sur celles-là, il ne reste que les empreintes, et à côté de chacune, le nombre de fois où elle a été recopiée.',
    ],
  },
  {
    id: 'porteurs', titre: 'Leur premier mot', support: 'Une page de déchiffrement des Veilleurs',
    lignes: [
      'Le signe revient sur toutes les tables, en tête de chaque liste, au-dessus de chaque porte.',
      'Après onze ans de travail, nous pouvons le traduire avec certitude. Il signifie : « ceux qui portent ».',
      'C’est ainsi qu’ils s’appelaient. C’est le mot que nous employons, depuis 2071, pour nos greffés.',
    ],
  },
  {
    id: 'mise-en-garde', titre: 'La mise en garde', support: 'La traduction de la plus ancienne table connue',
    lignes: [
      '« Nous gravons nos anciens pour ne rien perdre de ce qu’ils savaient. Un jour, nous voudrons graver tout le monde. »',
      '« Que celui qui lit ceci compte les voix qu’il porte. Quand elles seront plus nombreuses que la sienne, qu’il s’arrête. »',
      '« Nous l’écrivons tant que nous savons encore qui l’écrit. »',
    ],
  },
  {
    id: 'passerelle', titre: 'Non prioritaire', support: 'Trois fiches de signalement, agrafées ensemble',
    lignes: [
      'Printemps 2111. Passerelle des Hauts-Ponts, troisième travée : une fissure le long du rail, longue comme une main. Signalé par un coursier.',
      'Été 2111. Même endroit, la fissure a doublé. La rambarde bouge quand on s’y appuie. Signalé par une commerçante du marché.',
      'Automne 2111. J’ai mis la main dedans jusqu’au poignet. Signalé par un ouvrier des Fondations. Tampon sur les trois fiches : « non prioritaire, aucun Présage ».',
    ],
  },
  {
    id: 'pas-notre-cote', titre: 'Pas de notre côté', support: 'Un rapport de chantier de 2066, signé de quatre ouvriers',
    lignes: [
      'Chantier d’abris, niveau 7. Pose du mur de condamnation terminée à 4 h 10. Quatre hommes, deux tonnes de béton.',
      'Pendant la prise, des pleurs de l’autre côté. Puis un autre bruit. Pas un éboulement : un loquet qu’on tire, lentement, comme on ferme chez soi pour la nuit.',
      'Le contremaître a dit qu’on avait rêvé. On a signé quand même, tous les quatre. On a fermé la porte, mais pas de notre côté.',
      'Note des Veilleurs, en marge : « Le chantier comptait le pied de la Tour comme niveau 1. »',
    ],
  },
];

/**
 * Les souvenirs des familles (30 octobre 2026) : à chaque palier de Confiance, une famille du district rejoint son directeur
 * et confie aux Archives ce qu'elle a gardé de plus précieux. Des voix d'aujourd'hui, autour de papiers d'hier.
 */
export const FAMILLES: Fragment[] = [
  {
    id: 'famille-pompes', titre: 'Le carnet des pompes', support: 'Apporté par la famille Orlan : un carnet de quart, taché d’huile',
    lignes: [
      'Trois générations ont tenu ce carnet. Une ligne par nuit : l’heure, le niveau, « tenu » ou « pas tenu ».',
      'Les premières pages disent presque toujours « tenu ». Les dernières, de moins en moins.',
      'La dernière ligne est d’hier : « Le directeur a fait tourner les pompes. Tenu. »',
    ],
  },
  {
    id: 'famille-route', titre: 'Les noms de la route', support: 'Apporté par les Méric : une couverture brodée',
    lignes: [
      'Sur la bordure, un nom brodé par ville traversée, chacune un peu plus loin de la mer que la précédente.',
      'Les fils changent de couleur au fil des haltes : on brodait avec ce qu’on trouvait.',
      'Le dernier nom est celui du district. La grand-mère a laissé de la place après, au cas où.',
    ],
  },
  {
    id: 'famille-fondations', titre: 'Le premier pilier', support: 'Apporté par la famille Sorne : une photo de chantier',
    lignes: [
      'Des ouvriers en rang devant une colonne fraîche, les pieds dans l’eau jusqu’aux chevilles.',
      'Au dos : « On coule le pilier douze. Ceux d’en haut disent que ça tiendra cent ans. »',
      'Une autre main a ajouté, plus tard : « Soixante ans plus tard, il tient. Nous aussi. »',
    ],
  },
  {
    id: 'famille-ligne', titre: 'La ligne de la cuisine', support: 'Apporté par les Taverne : un morceau de carrelage',
    lignes: [
      'Un carreau bleu, découpé au burin dans le mur d’une cuisine noyée, avec un trait de peinture dessus.',
      'Chaque Nuit des lignes, la famille le pose sur la table et raconte d’où il vient.',
      'Ils disent que le trait n’était qu’à hauteur de genou, la première fois. On riait, à l’époque.',
    ],
  },
  {
    id: 'famille-accords', titre: 'Le ticket de l’hiver', support: 'Apporté par la famille Vey : un ticket de rationnement jamais utilisé',
    lignes: [
      'Un ticket de pain de l’année des Accords, au nom d’un aïeul qui ne l’a jamais échangé.',
      'Cet hiver-là, il a donné sa part à une voisine qui attendait un enfant.',
      'La famille garde le ticket plié en quatre. Elle dit qu’il n’a jamais servi, et qu’il a servi quand même.',
    ],
  },
  {
    id: 'famille-semis', titre: 'Les graines du toit', support: 'Apporté par les Halde : une boîte en fer de semences',
    lignes: [
      'Des sachets cousus main, chacun avec une date et un nom de plante qui ne pousse plus au bord de l’eau.',
      'Le sel a gagné les potagers bas un par un. Les Halde ont remonté leurs bacs d’un étage à chaque fois.',
      'Sur le couvercle, gravé à la pointe : « Là-haut, il y aura de la terre. On plantera tout. »',
    ],
  },
  {
    id: 'famille-veille', titre: 'La lampe de veille', support: 'Apporté par la famille Doucet : une lampe à algues cabossée',
    lignes: [
      'La lampe qu’on allumait à la fenêtre quand quelqu’un était encore en mer.',
      'Elle est restée allumée onze nuits, une fois. Le pêcheur est rentré la douzième.',
      'Depuis que tes barques ramènent des naufragés, disent les Doucet, la lampe ne s’éteint plus.',
    ],
  },
  {
    id: 'famille-tous', titre: 'Tout le monde à la fois', support: 'Apporté par le conseil des anciens : le registre du district',
    lignes: [
      'Le registre de tous les foyers du district, recopié à chaque génération, sans en oublier un seul.',
      'Pour la première fois, aucune page n’a de nom barré au crayon rouge : celui des familles qui restaient en bas.',
      'En marge de la dernière page, les anciens ont écrit : « Ils montent tous. Le directeur l’a promis. »',
    ],
  },
];

/** L'ordre dans lequel les familles arrivent, un souvenir par palier de Confiance (75, 150… 600 habitants) */
export const ORDRE_FAMILLES = FAMILLES.map((f) => f.id);

/**
 * Le premier fragment vient de la chambre scellée ; les autres, un par nouvelle Strate conquise (deux dans les Seuils).
 * D'abord les papiers humains des abris et des Archives du district (les Chroniques y renvoient), puis, plus profond,
 * les traces de ceux d'avant et les secrets d'aujourd'hui : plus on descend, plus c'est ancien et secret.
 */
export const ORDRE_FRAGMENTS = [
  // la chambre, puis deux par Strate dans les Seuils (les papiers des abris auxquels renvoient les Chroniques)
  'mure', 'puits-zero', 'ligne-eau', 'graveur', 'regle', 'sept', 'colonne', 'passerelle',
  // les Salles closes (−4 à −6)
  'seuil', 'pas-notre-cote', 'choses', 'brigade',
  // les Registres (−7 à −9)
  'deux-enfances', 'voix', 'noms',
  // le Fond (−10 et plus)
  'mise-en-garde', 'porteurs', 'formes', 'patient-5', 'berceau',
  // trois papiers humains restés dans les abris, retrouvés tard (les déplacer avancerait tout l'ordre : laissés ici)
  'fracture', 'pierre', 'infos',
];
export const fragmentDef = (id: string) => FRAGMENTS.find((f) => f.id === id) ?? FAMILLES.find((f) => f.id === id);
