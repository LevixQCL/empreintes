# Le contenu des Strates (31 octobre 2026)

Bryan a demandé de « mettre le lore en évidence dans les Strates pour que ce soit plus interactif et pas juste des combats en chaîne »,
avec « des points de passage obligatoires pour mettre le lore en place ». Il voulait aussi « ajouter du contenu, que les Strates aient
plus d'intérêt ». Il a validé toutes les pistes, à une condition : qu'elles ajoutent du contenu sans compliquer le jeu.
Un game designer a relu la conception. Tout se passe sur le plan de la Strate, entre les combats ; le combat lui-même ne change pas.

Les textes et les réglages sont dans `src/core/strates.ts`, la mécanique dans `src/core/expedition.ts` (carte, portes, passages)
et dans `src/core/partie/descentes.ts` (choix de Halte, quête au retour). L'écran est dans `src/ui/exploration.ts` et
`src/ui/strates-contenu.css`, le bestiaire dans `src/ui/bestiaire.ts`. Les tests sont dans `tests/strates-contenu.test.ts`.

## 1. Les Haltes : le point de passage obligatoire
- Avec une Halte, la carte a 10 rangées au lieu de 9. La rangée 5 n'a qu'une seule salle, la Halte : tous les chemins y passent.
  Le nombre de rangées tirées au hasard ne change pas, donc il y a toujours environ 6 combats par descente.
- Il faut à peu près autant de descentes que la profondeur pour vaincre une Strate. D'où le nombre de Haltes : 1 à −1, 2 à −2,
  puis 3 de −3 à −10, soit 27 Haltes en tout. Chaque descente ouvre la Halte suivante, même si elle échoue.
  La dernière Halte de chaque Strate prépare le gardien.
- Une fois toutes ses Haltes vues, la salle devient un « lieu connu », sans choix. Pas de Halte dans les fouilles, ni sous −10.
- Comment se joue une Halte :
  - le décor de la Strate en bandeau, puis 2 ou 3 détails à toucher ;
  - chaque détail fait parler un Porteur debout de l'escouade, ou le récit si aucun ne l'est. Ce qu'on apprend dépend donc de l'escouade ;
  - pour finir, un choix entre deux options.
- Ce que rapportent les choix (revue du game designer : jamais de PV, jamais d'effet en combat) :
  - des composants, autant qu'un combat (`butinCombat`) ;
  - ou un Éclat, ou la lampe à algues, qui éclaire les deux rangées après la Halte ;
  - certains choix laissent aussi un souvenir (`j.drapeaux`), que les Haltes suivantes reprennent : par exemple, ton nom gravé à −1
    revient devant le Premier Porteur à −10.
- La première visite d'une Halte rapporte l'XP d'une salle scellée.

## 2. La particularité de chaque Strate
C'est un réglage de la carte, jamais une règle de combat. Elle s'affiche sous le nom de la Strate et dans le récit d'entrée.
- −2, Murs de 2066 : 2 caches au plus sont murées. Un Augmenté debout les force et y trouve le double. Sinon, la cache est normale (aucune pénalité).
- −3, Le noir complet : même un Résonant ne sent rien au-delà des salles voisines. La Halte offre une lanterne.
- −4, Portes rondes : deux fois plus de salles scellées (poids 9 → 18).
- −5, Les niches : les caches donnent 20 % de chance de carte, au lieu de 30 % d'Éclat. Elles ne cachent aucune embuscade.
- −6, Les pleurs : plus d'archives (poids 5 → 10, pris aux rencontres).
- −7, Souvenirs doubles : 2 salles de combat au plus ont deux occupants. On les voit en arrivant devant, et on choisit lequel affronter.
- −8, Les Veilleurs perdus : il y a toujours une rencontre « Veilleur » sur le plan. Pas de second campement : il aurait rendu −8 plus facile que −7.
- −9, Les fils : un fil relie deux salles côte à côte. On peut le suivre une fois.
- −10, Fermé de l'intérieur : presque toutes les caches sont des portes à Fréquence, avec une suite de 4.

## 3. La quête de chaque Strate
- Il y a une quête par Strate : 3 étapes de −1 à −5, 4 de −6 à −10.
- À chaque descente, expédition ou fouille, une salle existante porte la marque ✦, visible même dans le brouillard.
- On relève l'étape en entrant dans la salle, ou en gagnant son combat. Elle compte au retour, même après une défaite.
- Une étape rapporte des composants (`butinCache`). La fin rapporte une carte (cuivre jusqu'à −4, argent ensuite),
  la moitié de l'XP d'un gardien et une ligne de lore.
- Une quête finie ne pose plus de marque. Les quêtes donnent ainsi une raison de redescendre dans une Strate déjà vaincue.

## 4. Les portes à Fréquence (à partir de −5)
- La moitié des caches deviennent des portes, et presque toutes à −10.
- On tire 5 cartes parmi celles des Porteurs debout. Il faut en choisir 3 dont les Fréquences se suivent (4 à −10).
  L'ordre n'importe pas, et l'Accord prolonge toute suite.
- On a droit à une seule nouvelle main. Rater ne coûte rien.
- Une porte ouverte rapporte 1 Éclat (2 à −10) et 1,5 fois les composants d'une cache, sans carte.

## 5. Les passages secrets (à partir de −2)
- Environ une descente sur 2,5 (40 %) en cache un. Seuls certains Porteurs debout le repèrent :
  - couloir de service : Doran, Kessa ;
  - passage dans le noir : Nuit, Véla ;
  - porte des Hauts : Aurel, Liane ;
  - marque de fouilleur : Sasha, Joss, Ilka.
- Une fois dans la salle, on peut suivre le passage. On y trouve une réplique du Porteur, ce qu'il y a derrière (selon la zone),
  les composants d'une cache et une archive.

## 6. Les objets de descente
Le game designer a conseillé de ne pas en faire un système : un inventaire de plus, et 3 objets sur 4 auraient rendu la descente
trop facile (corde, pierre fêlée, fiole). Seule la lampe à algues reste. On l'obtient dans certaines Haltes, et elle s'allume tout de suite.

## 7. Le bestiaire (Bibliothèque, 4ᵉ onglet)
- Chaque ennemi des Strates a une fiche, qui s'ouvre avec les victoires contre lui : d'où il vient (1 victoire),
  comment il se bat, avec un conseil concret (4 victoires), puis son secret (10 victoires).

## Garde-fous
- **Fragments.** Une descente rapporte au plus un fragment, toutes sources confondues (`gains.fragment`). Le lore des archives
  ne prend donc pas d'avance sur la campagne.
- **Parcours simulé** (20 parties, `simulerParcours`) : les repères restent dans la cible.

  | Profil | Strate −10, avant | Strate −10, après | Victoires au front, avant | Victoires au front, après |
  |---|---|---|---|---|
  | Occasionnel | jour 32 | jour 30 | 42 % | 42 % |
  | Assidu | jour 20 | jour 20 | 33 % | 37 % |

  Les indices du brouillard dès −3 avaient été essayés. Ils faisaient tomber les victoires au front à 33 % : ils sont restés à −4.
