# Les nouvelles cartes (4 novembre 2026)

Bryan : « refaire des nouvelles cartes pour pouvoir sortir le jeu avec environ 100 cartes, équilibrées, qui respectent ce qu'on a
déjà mis en place (les familles). Pas plus fortes que d'autres. Une carte +14 et une carte +15 se valent, on choisira toujours +15 :
ce sont les effets qui doivent faire la différence. »

**88 → 102 cartes à trouver** (112 en comptant l’Héritage et la carte du parrainage). Quatorze cartes, quatre effets.

## La méthode, prise aux jeux de cartes qui sortent des extensions

1. **Finir les familles avant d'en ouvrir de nouvelles.** Deux voies de `familles-de-decks.md` restaient vides : les Machines
   (Sasha) et l'Harmonie (Véla). Une extension sert d'abord les decks qui existent déjà.
2. **Des cartes « de côté », pas « au-dessus ».** Aucune nouvelle carte n'a une force plus haute que les cartes de son métal et de
   sa lignée pour le même rôle. Elles se distinguent par une condition (Contrepoint), un coût (lourde), ou un rôle que la lignée
   n'avait pas dans ce métal (un soin ciblé chez les Génés en cuivre).
3. **Combler les trous.** Il manquait des Fréquences principales dans certains métaux (Résonants en cuivre : pas de 6 ni de 7 ;
   Augmentés en cuivre : pas de 3 ni de 4 ; Génés en argent : pas de 2…) et des effets absents d'un métal (Perçant en cuivre,
   Siphon en argent). Les nouvelles cartes les bouchent : plus de decks possibles, sans carte plus forte.
4. **Les règles de Bryan restent vraies** : une carte = un effet ; les meilleurs effets rendent les suites plus dures, pas plus
   faciles (le Contrepoint demande une suite qui passe par les trois lignées) ; chaque lignée garde son rôle (Augmentés frappent,
   Génés tiennent, Résonants orchestrent) ; aucune paire de quasi-doublons (`tests/doublons.test.ts`).

## Quatre effets

| Effet | Où | Texte joueur |
|---|---|---|
| **Servo** | Machines | Une carte lourde de la chaîne ne prend qu'une place (un Servo par carte lourde, où qu'il soit). |
| **Contrepoint** (X %) | Harmonie | Dans une suite qui résonne : +X % de force pour chaque autre lignée de la suite (2 au plus). |
| **Exécution** (X %) | exclusive nacre | Après le coup, l'ennemi visé tombe s'il lui reste moins de X % de ses PV. Jamais un gardien. |
| **Ténacité** | exclusive nacre | Au tour ennemi qui suit, aucun Porteur ne tombe : le coup fatal le laisse à 1 PV. |

## Les cartes

### Augmentés · Les Machines (Sasha)

Le plan : des cartes lourdes (2 places, gros chiffre), rendues légères par le Servo. Un gros coup **et** une suite de 3 dans la même
chaîne. Faiblesse : sans Servo en main, la chaîne est courte ; contre un Évanescent, peu de Résonances.

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Servo-bras | fer | bouclier | 8 | 4 · 5 · 3 | Servo |
| Marteau-piston | fer | attaque (lourde) | 21 | 5 · 6 · 4 | Troubler 30 % |
| Vérin hydraulique | cuivre | bouclier | 12 | 3 · 4 · 2 | Servo |
| Exo de chantier | argent | bouclier (lourde) | 33 | 5 · 7 · 4 | Surcharge +1 |
| Foreuse des Strates | or | attaque (lourde) | 36 | 5 · 4 · 6 | Élan |

Déjà là et qui servent la voie : Bras-grue, Lames orbitales, Noyau instable (lourdes).

### Résonants · L’Harmonie (Véla)

Le plan : les suites, mais celles qui passent par les trois lignées. Le Contrepoint ne rend aucune suite plus facile : il récompense
la plus dure à monter. Faiblesse : la Dissonance (pas de Résonance, pas de Contrepoint).

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Contre-chant | cuivre | attaque | 12 | 7 · 6 · 8 | Contrepoint 25 % |
| Fil d’accord | argent | attaque | 15 | 8 · 7 · 6 | Contrepoint 30 % |
| Nuée chorale | or | attaque | 20 | 6 · 8 · 7 | Contrepoint 30 % |

### Les cartes qui comblent un trou

| Carte | Lignée | Métal | Action | Force | Fréq. | Effet | Le trou |
|---|---|---|---|---|---|---|---|
| Riveteuse | Augmentés | cuivre | attaque | 13 | 4 · 3 · 5 | Perçant | pas de Perçant en cuivre, pas de 4 |
| Suture vive | Génés | cuivre | soin (un seul) | 13 | 5 · 1 · 4 | Rempart 40 % | tous les soins Génés soignaient toute l'escouade : celui-ci choisit son blessé |
| Lamproie des piliers | Génés | argent | attaque | 11 | 2 · 4 · 1 | Siphon 60 % | pas de Siphon en argent, pas de 2 |
| Berceuse des Strates | Résonants | or | attaque | 19 | 7 · 9 · 6 | Sourdine 35 % | pas de Sourdine en or, pas de 6 en or (d'abord prévue en soin : trop faible au robot, voir le rapport) |

### Les exclusives en nacre (deux par lignée désormais)

| Carte | Lignée | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Couperet des Hauts | Augmentés | attaque | 30 | 6 · 3 · 8 | Exécution 15 % (22 % avec le renfort de la nacre) |
| Racines-mères | Génés | bouclier | 22 | 5 · 2 · 4 | Ténacité |

Fréquences volontairement écartées, comme les autres exclusives.

## Mesure au robot

Résultats et réglages dans `docs/nouvelles-rapport.md`. `npm run nouvelles` (rapport dans `docs/nouvelles-rapport.md`) : chaque carte prend la place de la carte de départ de sa lignée,
dans son métal, comparée aux cartes de la même lignée et du même métal. `npm run voies -- --seule "Les Machines"` et
`--seule "L’Harmonie"` pour les deux voies.

## En duel

Le Servo et le Contrepoint marchent aussi en duel. L'Exécution et la Ténacité n'y font rien pour l'instant (le duel n'est pas
encore branché au jeu) : à régler quand on l'ouvrira, un Porteur adverse achevé d'un coup demande sa propre règle.
