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
      'Deux graduations sur la même tige de laiton : l’une gravée « relevé », l’autre « prévision ».',
      'Pour le 3 mars, la première marque 41 cm. La seconde, 1,20 m. Les deux ont été notées le même jour, de la même main.',
      'Au registre de l’abri, seul le second chiffre a été recopié.',
    ],
  },
  {
    id: 'seuil', titre: 'Au-dessus d’une porte', support: 'Une inscription traduite par les Veilleurs',
    lignes: [
      '« Ici, on entre seul, et l’on ressort avec ce qu’on a apporté. »',
      'Note de traduction : dans leur langue, le verbe « apporter » désigne aussi le fait de porter une empreinte.',
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
      'Mesure prise : le brigadier Tessel est relevé de ses fonctions, pour repos.',
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
    id: 'patient-5', titre: 'Patient 5', support: 'Une page arrachée au carnet d’un médecin',
    lignes: [
      'Troisième jour après la greffe. Le patient 5 me demande des nouvelles d’une mer dont personne ici n’a jamais entendu parler.',
      'Il la décrit avec précision : sa couleur, son odeur, le nom de ses courants. Aucune carte ne la connaît.',
      'Il pleure quand je lui dis qu’elle n’existe pas. Il me répond que c’est nous qui l’avons perdue.',
    ],
  },
  {
    id: 'formes', titre: 'Ce qu’ils voulaient être', support: 'Une note de travail des Veilleurs',
    lignes: [
      'Plus on descend, plus les formes sont nettes : dragons entiers, grands esprits aux contours précis.',
      'Plus on remonte vers les couches récentes, plus elles se brouillent. Les dernières n’ont plus de forme du tout.',
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
      'Colonne 1 : un nom. Colonne 2 : une date. Colonne 3 : les empreintes reçues, de une à trente-deux.',
      'Sur les tables suivantes, la colonne des noms rétrécit, puis disparaît.',
      'Sur la dernière, il ne reste que les empreintes, et à côté de chacune, le nombre de fois où elle a été portée.',
    ],
  },
  {
    id: 'orseve', titre: 'Note interne', support: 'Une copie qui n’aurait jamais dû sortir des Hauts',
    lignes: [
      'Prélèvement 2079-12, cœur de levage de l’île de l’Aube : extraction réussie. Incident dans la Strate −3, deux ouvriers évacués.',
      'Prélèvement 2084-03 : extraction réussie. Le lien avec les incidents des salles voisines n’est pas établi.',
      'Classement : à ne pas transmettre. Paraphe : I. O.',
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
      '« Nous avons gravé nos pères pour ne rien perdre. Nous gravons maintenant nos enfants pour ne pas les perdre. »',
      '« Que celui qui lit ceci compte ses voix. Quand elles seront plus nombreuses que lui, qu’il s’arrête. »',
      '« Nous l’écrivons tant que nous savons encore qui l’écrit. »',
    ],
  },
  {
    id: 'annotation', titre: 'De la même main', support: 'Une ligne gravée sous la mise en garde',
    lignes: [
      'Même trait, même outil, même usure. La ligne date d’avant la fermeture des salles.',
      '« Nous nous sommes trompés. Les voix ne nous ont pas pris, elles nous ont gardés. Ne fermez rien. »',
      'Note d’Ysé : « Je ne sais pas qui a écrit cette ligne. Je crains que lui non plus. »',
    ],
  },
];

/**
 * Le premier fragment vient de la chambre scellée ; les autres, un par nouvelle Strate conquise.
 * D'abord les papiers humains des abris (les Chroniques y renvoient), puis, plus profond,
 * les traces de ceux d'avant et les secrets d'aujourd'hui : plus on descend, plus c'est ancien et secret.
 */
export const ORDRE_FRAGMENTS = [
  'mure', 'puits-zero', 'ligne-eau', 'regle', 'colonne', 'fracture', 'pierre', 'infos', 'graveur', 'sept',
  'voix', 'seuil', 'choses', 'brigade', 'deux-enfances', 'patient-5', 'formes', 'berceau', 'noms', 'orseve',
  'porteurs', 'mise-en-garde', 'annotation',
];
export const fragmentDef = (id: string) => FRAGMENTS.find((f) => f.id === id);
