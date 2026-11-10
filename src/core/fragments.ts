// Les fragments d'archives : de courts textes trouvés dans les Strates, rangés dans le Codex.
// Ils racontent, par des voix de l'époque, ce que l'intro ne fait qu'effleurer.
// Aucun pays, aucune personne, aucun conflit réel n'est nommé.

import { t } from './i18n';

export interface Fragment {
  id: string;
  titre: string;
  /** ce que c'est, dans le monde du jeu */
  support: string;
  lignes: string[];
}

export const FRAGMENTS: Fragment[] = [
  {
    id: 'mure', titre: t('Ce qui s’est muré'), support: t('Un ordre de service, tamponné deux fois'),
    lignes: [
      t('Chantier d’abris, niveau 7. Suite à l’incident du 14, l’accès est condamné jusqu’à nouvel ordre.'),
      t('Le personnel ne mentionne pas l’incident à l’extérieur. Les familles seront indemnisées.'),
      t('Tampon du 2 novembre : « Faute de fonds, l’indemnité est versée en nature. L’anneau du chantier et ses pompes sont cédés aux familles du personnel. »'),
      t('Note au crayon, en marge : « Ils ont entendu quelqu’un pleurer derrière la paroi. Il n’y avait personne. »'),
    ],
  },
  {
    id: 'ligne-eau', titre: t('La ligne d’eau'), support: t('Une photo de famille, annotée au dos'),
    lignes: [
      t('Nous quatre devant la maison, l’été avant qu’on parte.'),
      t('Papa a peint la ligne bleue sur le mur, là où l’eau s’est arrêtée la première fois.'),
      t('Il disait qu’on la regarderait en riant, plus tard. On ne l’a jamais revue.'),
    ],
  },
  {
    id: 'infos', titre: t('Les infos du soir'), support: t('Un extrait de journal intime'),
    lignes: [
      t('Ce soir, quarante minutes de journal. Les élections, les prix, la colère, encore les élections.'),
      t('La sécheresse dans le Sud : vingt secondes, à la fin, entre la météo et le sport.'),
      t('Je me suis surprise à zapper. Je crois que tout le monde zappe.'),
    ],
  },
  {
    id: 'colonne', titre: t('Colonne'), support: t('Une lettre jamais postée'),
    lignes: [
      t('On marche depuis onze jours. La route est pleine jusqu’à l’horizon, dans les deux sens.'),
      t('Hier, un homme que je ne connaissais pas a porté ma fille sur ses épaules pendant des heures.'),
      t('Personne ne demande plus d’où l’on vient. On demande seulement : « Il vous reste de l’eau ? »'),
    ],
  },
  {
    id: 'fracture', titre: t('Fracture'), support: t('Le carnet d’un marin d’un navire scientifique'),
    lignes: [
      t('Six heures du matin. Le bruit est arrivé avant la vague : un craquement grand comme le monde.'),
      t('Toute la falaise s’est mise à glisser, lentement, comme si elle avait décidé de partir.'),
      t('Le chef de mission a dit « peu probable » à voix haute. Puis il s’est tu jusqu’au soir.'),
    ],
  },
  {
    id: 'pierre', titre: t('Première pierre'), support: t('Un plan de chantier, très usé'),
    lignes: [
      t('Tour de secours n° 12 : fondations sur pilier ancien, quarante étages prévus, quatre-vingts possibles.'),
      t('Livraison des passerelles vers les tours 9 et 14 : dans six ans, si l’acier arrive.'),
      t('Quelqu’un a ajouté : « Mon petit-fils finira le toit. »'),
    ],
  },
  {
    id: 'puits-zero', titre: t('Puits Zéro, rapport 1'), support: t('Le rapport d’un chef d’équipe'),
    lignes: [
      t('A 23 h 40 la foreuse a traversé dans du vide. On a cru a une grotte.'),
      t('C’est pas une grotte. Les murs sont lisses et courbes, et il y a des pierres qui brillent toutes seules.'),
      t('Personne a voulu descendre en premier. Au final on y est allés tous ensemble.'),
    ],
  },
  {
    id: 'graveur', titre: t('Le Graveur'), support: t('Des notes de laboratoire'),
    lignes: [
      t('Échantillon 41 : le cristal réagit aux voix. Pas aux sons : aux voix.'),
      t('Hypothèse : il ne stocke pas une énergie, il stocke quelqu’un. Ou la forme de quelqu’un.'),
      t('Si l’on peut lire cette forme, on peut peut-être l’inscrire. Et alors, sur quoi ?'),
    ],
  },
  {
    id: 'sept', titre: t('Les Sept'), support: t('Un formulaire de volontaire'),
    lignes: [
      t('Nom : effacé. Motivation : « Ma ville est sur la côte. Si ça peut servir. »'),
      t('Risques expliqués au candidat : oui. Risques compris par le candidat : la case n’est pas cochée.'),
      t('Tampon final : « Retenu. Greffe prévue le 3. »'),
    ],
  },
  {
    id: 'voix', titre: t('La voix d’en dessous'), support: t('Un enregistrement à moitié effacé'),
    lignes: [
      t('[grésillement] … ce n’est pas un souvenir à moi. Je me rappelle une mer que je n’ai jamais vue.'),
      t('[grésillement] … ils ne sont pas morts, là-dessous. Ils attendent qu’on se souvienne d’eux.'),
      t('[fin de l’enregistrement]'),
    ],
  },
  {
    id: 'regle', titre: t('La règle aux deux échelles'), support: t('Une règle de niveau, trouvée dans un abri'),
    lignes: [
      t('Deux graduations sur la même tige de laiton : l’une gravée « relevé », l’autre « niveau officiel ».'),
      t('À la date du 3 mars, la première indique 1,20 m. La seconde, 41 cm. Les deux relevés ont été notés le même jour, de la même main.'),
      t('Au registre de l’abri, seul le second chiffre a été recopié. C’est celui qui ne demandait pas d’évacuer.'),
    ],
  },
  {
    id: 'seuil', titre: t('Au-dessus d’une porte'), support: t('Une inscription traduite par les Veilleurs'),
    lignes: [
      t('« Ici, on entre seul, et l’on ressort avec ce qu’on a apporté. »'),
      t('Note de traduction : le dernier verbe reste incertain. Il pourrait aussi vouloir dire « ce qu’on porte ».'),
      t('La porte est fermée de l’intérieur. Personne n’est ressorti.'),
    ],
  },
  {
    id: 'choses', titre: t('Inventaire, salle 4-C'), support: t('Une liste dressée par des fouilleurs des Veilleurs'),
    lignes: [
      t('1 poignée de porte, usée d’un seul côté. 1 sandale, ressemelée trois fois. 1 petit animal taillé, sans valeur.'),
      t('412 objets au total. Chacun porte un nom et une date gravés. Aucun ne porte d’histoire.'),
      t('En marge, l’écriture d’Ysé : « Ils gardaient ce que personne d’autre ne pouvait se rappeler à leur place. »'),
    ],
  },
  {
    id: 'brigade', titre: t('Rapport de sécurisation'), support: t('Un rapport du Serment de Veyr'),
    lignes: [
      t('Salle close n° 11 sécurisée à 4 h 20. Aucun civil présent. Cristaux inventoriés, mis sous scellés, transférés vers les Hauts.'),
      t('Le brigadier Tessel signale qu’une voix lui a donné un ordre dans une langue inconnue. Il dit l’avoir compris.'),
      t('Mesure prise : le brigadier Tessel est relevé de ses fonctions et mis au repos.'),
    ],
  },
  {
    id: 'deux-enfances', titre: t('Deux enfances'), support: t('Deux fiches de lecture des Veilleurs, agrafées ensemble'),
    lignes: [
      t('Cristal 7-114 : se souvient d’une enfance au bord d’une mer tiède, d’une sœur, d’un jardin de pierres.'),
      t('Cristal 7-115, même individu, signature identique : se souvient d’être né sous la glace, enfant unique, sans avoir jamais vu la mer.'),
      t('Lectrice : Véla. Commentaire : « Les deux sont sincères. »'),
    ],
  },
  {
    id: 'patient-5', titre: 'Patient 6', support: t('Une page arrachée au carnet d’un médecin'),
    lignes: [
      t('Troisième jour après la greffe. Le patient 6 me demande des nouvelles d’une mer dont personne ici n’a jamais entendu parler.'),
      t('Vingt ans plus tard, note de ses gardiens, au cœur de la première île : entre deux sommeils, il dessine toujours la même côte, avec ses criques et ses courants. Aucune carte ne la connaît.'),
      t('Ajout des Veilleurs, 2118 : son dessin correspond trait pour trait aux murs gravés d’une salle de la Strate −9.'),
    ],
  },
  {
    id: 'formes', titre: t('Ce qu’ils voulaient être'), support: t('Une note de travail des Veilleurs'),
    lignes: [
      t('Dans les couches profondes, les plus vieilles formes sont rares et nettes : un dragon entier, un grand esprit aux contours précis.'),
      t('À côté d’elles, et plus haut, on retrouve les mêmes dragons, mais recopiés cent fois, aux contours qui tremblent, et de plus en plus d’êtres sans nom.'),
      t('Hypothèse : ce ne sont pas leurs corps, mais les visages qu’ils se donnaient. Les derniers ne savaient plus lequel choisir.'),
    ],
  },
  {
    id: 'berceau', titre: t('Le Berceau 9-3'), support: t('Un relevé de stabilité, en double exemplaire'),
    lignes: [
      t('Fermé : vibrations en hausse dans les salles voisines, trois Rémanents éveillés en une semaine.'),
      t('Ouvert : les salles voisines se calment. Ses propres empreintes, elles, commencent à remuer.'),
      t('Sur la copie des Veilleurs, quelqu’un a ajouté : « Ils le savaient. Leurs consignes disaient quand même de fermer. »'),
    ],
  },
  {
    id: 'noms', titre: t('La colonne des noms'), support: t('Le relevé d’une table gravée'),
    lignes: [
      t('Colonne 1 : un nom. Colonne 2 : une date. Colonne 3 : les empreintes reçues, d’une à trente-deux.'),
      t('À côté, sur le même mur, d’autres tables, gravées plus tard et d’une main maladroite : la colonne des noms rétrécit, puis disparaît.'),
      t('Sur celles-là, il ne reste que les empreintes, et à côté de chacune, le nombre de fois où elle a été recopiée.'),
    ],
  },
  {
    id: 'porteurs', titre: t('Leur premier mot'), support: t('Une page de déchiffrement des Veilleurs'),
    lignes: [
      t('Le signe revient sur toutes les tables, en tête de chaque liste, au-dessus de chaque porte.'),
      t('Les empreintes le murmurent : « Ossyra ». Après onze ans de travail, c’est le premier signe que nous sachions traduire avec certitude : « ceux qui portent ».'),
      t('C’est ainsi qu’ils s’appelaient. C’est le mot que nous employons, depuis 2071, pour nos greffés.'),
    ],
  },
  {
    id: 'mise-en-garde', titre: t('La mise en garde'), support: t('La traduction de la plus ancienne table connue'),
    lignes: [
      t('« Nous gravons nos anciens pour ne rien perdre de ce qu’ils savaient. Un jour, nous voudrons graver tout le monde. »'),
      t('« Que celui qui lit ceci compte les voix qu’il porte. Quand elles seront plus nombreuses que la sienne, qu’il s’arrête. »'),
      t('« Nous l’écrivons tant que nous savons encore qui l’écrit. »'),
    ],
  },
  {
    id: 'passerelle', titre: t('Non prioritaire'), support: t('Trois fiches de signalement, agrafées ensemble'),
    lignes: [
      t('Printemps 2111. Passerelle des Hauts-Ponts, troisième travée : une fissure le long du rail, longue comme une main. Signalé par un coursier.'),
      t('Été 2111. Même endroit, la fissure a doublé. La rambarde bouge quand on s’y appuie. Signalé par une commerçante du marché.'),
      t('Automne 2111. J’ai mis la main dedans jusqu’au poignet. Signalé par un ouvrier des Fondations. Tampon sur les trois fiches : « non prioritaire, aucun Présage ».'),
    ],
  },
  {
    id: 'pas-notre-cote', titre: t('Pas de notre côté'), support: t('Un rapport de chantier de 2066, signé de quatre ouvriers'),
    lignes: [
      t('Chantier d’abris, niveau 7. Pose du mur de condamnation terminée à 4 h 10. Quatre ouvriers, deux tonnes de béton.'),
      t('Pendant la prise, des pleurs de l’autre côté. Puis un autre bruit. Pas un éboulement : un loquet qu’on tire, lentement, comme on ferme chez soi pour la nuit.'),
      t('Le contremaître a dit qu’on avait rêvé. On a signé quand même, tous les quatre. On a fermé la porte, mais pas de notre côté.'),
      t('Note des Veilleurs, en marge : « Le chantier comptait le pied de la Tour comme niveau 1. »'),
    ],
  },
];

/**
 * Les souvenirs des familles (30 octobre 2026) : à chaque palier de Confiance, une famille du district rejoint son directeur
 * et confie aux Archives ce qu'elle a gardé de plus précieux. Des voix d'aujourd'hui, autour de papiers d'hier.
 */
export const FAMILLES: Fragment[] = [
  {
    id: 'famille-pompes', titre: t('Le carnet des pompes'), support: t('Apporté par la famille Orlan : un carnet de quart, taché d’huile'),
    lignes: [
      t('Trois générations ont tenu ce carnet. Une ligne par nuit : l’heure, le niveau, « tenu » ou « pas tenu ».'),
      t('Les premières pages disent presque toujours « tenu ». Les dernières, de moins en moins.'),
      t('La dernière ligne est d’hier, d’une autre main : « Le directeur est remonté des Strates. Il a demandé le niveau. Tenu. »'),
    ],
  },
  {
    id: 'famille-route', titre: t('Les noms de la route'), support: t('Apporté par les Méric : une couverture brodée'),
    lignes: [
      t('Sur la bordure, un nom brodé par ville traversée, chacune un peu plus loin de la mer que la précédente.'),
      t('Les fils changent de couleur au fil des haltes : on brodait avec ce qu’on trouvait.'),
      t('Le dernier nom est celui du district. La grand-mère a laissé de la place après, au cas où.'),
    ],
  },
  {
    id: 'famille-fondations', titre: t('Le premier pilier'), support: t('Apporté par la famille Sorne : une photo de chantier'),
    lignes: [
      t('Des ouvriers en rang devant une colonne fraîche, les pieds dans l’eau jusqu’aux chevilles.'),
      t('Au dos : « On coule le pilier douze. Ceux d’en haut disent que ça tiendra cent ans. »'),
      t('Une autre main a ajouté, plus tard : « Soixante ans plus tard, il tient. Nous aussi. »'),
    ],
  },
  {
    id: 'famille-ligne', titre: t('La ligne de la cuisine'), support: t('Apporté par les Taverne : un morceau de carrelage'),
    lignes: [
      t('Un carreau bleu, découpé au burin dans le mur d’une cuisine noyée, avec un trait de peinture dessus.'),
      t('Chaque Nuit des lignes, la famille le pose sur la table et raconte d’où il vient.'),
      t('Ils disent que le trait n’était qu’à hauteur de genou, la première fois. On riait, à l’époque.'),
    ],
  },
  {
    id: 'famille-accords', titre: t('Le ticket de l’hiver'), support: t('Apporté par la famille Vey : un ticket de rationnement jamais utilisé'),
    lignes: [
      t('Un ticket de pain de l’année des Accords, au nom d’un aïeul qui ne l’a jamais échangé.'),
      t('Cet hiver-là, il a donné sa part à une voisine qui attendait un enfant.'),
      t('La famille garde le ticket plié en quatre. Elle dit qu’il n’a jamais servi, et qu’il a servi quand même.'),
    ],
  },
  {
    id: 'famille-semis', titre: t('Les graines du toit'), support: t('Apporté par les Marbel : une boîte en fer de semences'),
    lignes: [
      t('Des sachets cousus main, chacun avec une date et un nom de plante qui ne pousse plus au bord de l’eau.'),
      t('Le sel a gagné les potagers bas un par un. Les Marbel ont remonté leurs bacs d’un étage à chaque fois.'),
      t('Sur le couvercle, gravé à la pointe : « Là-haut, il y aura de la terre. On plantera tout. »'),
    ],
  },
  {
    id: 'famille-veille', titre: t('La lampe de veille'), support: t('Apporté par la famille Doucet : une lampe à algues cabossée'),
    lignes: [
      t('La lampe qu’on allumait à la fenêtre quand quelqu’un était encore en mer.'),
      t('Elle est restée allumée onze nuits, une fois. Le pêcheur est rentré la douzième.'),
      t('Depuis que tes barques ramènent des naufragés, disent les Doucet, la lampe ne s’éteint plus.'),
    ],
  },
  {
    id: 'famille-tous', titre: t('Tout le monde à la fois'), support: t('Apporté par le conseil des anciens : le registre du district'),
    lignes: [
      t('Le registre de tous les foyers du district, recopié à chaque génération, sans en oublier un seul.'),
      t('Pour la première fois, aucune page n’a de nom barré au crayon rouge : celui des familles qui restaient en bas.'),
      t('En marge de la dernière page, les anciens ont écrit : « Ils montent tous. Le directeur l’a promis. »'),
    ],
  },
];

/** L'ordre des souvenirs des familles, un par palier de Confiance (6, 12… 48 familles) */
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
