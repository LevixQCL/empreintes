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
];

/** Le premier fragment vient de la chambre scellée ; les autres, un par nouvelle Strate conquise */
export const ORDRE_FRAGMENTS = FRAGMENTS.map((f) => f.id);
export const fragmentDef = (id: string) => FRAGMENTS.find((f) => f.id === id);
