# Équilibre du duel (robot contre robot)

Généré par `npm run duel` (30 duels par ligne, côtés alternés). Voir docs/duel.md.

## 1. Durée à chaque étape (escouades mixtes, même étape)

| Étape | Tours (moyenne) | Plus long | Égalités |
|---|---|---|---|
| Début (niv. 3, fer-cuivre) | 10.3 | 14 | 0 % |
| Milieu (niv. 8, jusqu’à l’argent) | 10.3 | 17 | 0 % |
| Avancé (niv. 14, jusqu’à l’or) | 8.0 | 11 | 0 % |
| Fin (niv. 20, jusqu’à la nacre) | 9.6 | 15 | 0 % |

## 2. Une seule lignée contre une escouade mixte (milieu de jeu)

| Escouade | Victoires contre mixte | Tours |
|---|---|---|
| 3 Augmentés | 80 % | 7.6 |
| 3 Génés | 80 % | 14.0 |
| 3 Résonants | 53 % | 8.7 |

Lignées seules entre elles (le triangle : Augmentés > Résonants > Génés > Augmentés) :

| Escouade A | Escouade B | Victoires de A |
|---|---|---|
| 3 Génés | 3 Augmentés | 37 % |
| 3 Résonants | 3 Génés | 80 % |
| 3 Augmentés | 3 Résonants | 73 % |

## 3. Écarts de progression (escouades mixtes)

| Plus avancé | Moins avancé | Victoires du plus avancé | Tours |
|---|---|---|---|
| Milieu (niv. 8, jusqu’à l’argent) | Début (niv. 3, fer-cuivre) | 100 % | 7.8 |
| Avancé (niv. 14, jusqu’à l’or) | Milieu (niv. 8, jusqu’à l’argent) | 100 % | 6.9 |
| Fin (niv. 20, jusqu’à la nacre) | Avancé (niv. 14, jusqu’à l’or) | 77 % | 8.1 |

## 4. Les effets (escouades qui en portent 2 cartes ou plus, miroirs milieu à fin)

Une escouade au hasard gagne 50 % ; au-delà de 60 % ou en deçà de 40 % (sur 20 duels au moins), l’effet est à surveiller.

| Effet | Duels | Victoires |
|---|---|---|
| faille | 3 | 67 % |
| curee | 13 | 62 % |
| rappel | 12 | 58 % |
| rafale | 45 | 58 % |
| unisson | 65 | 57 % |
| debord | 112 | 55 % |
| surtension | 60 | 53 % |
| desarmer | 85 | 51 % |
| percant | 50 | 50 % |
| rapt | 4 | 50 % |
| accord | 24 | 50 % |
| decharge | 4 | 50 % |
| elan | 122 | 49 % |
| vague | 228 | 48 % |
| empreinte | 41 | 46 % |
| lecture | 11 | 45 % |
| flux | 72 | 42 % |
| diapason | 28 | 39 % ⚠ |
| crescendo | 56 | 39 % ⚠ |
| fissure | 11 | 36 % |
