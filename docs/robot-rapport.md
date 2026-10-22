# Rapport du robot d'équilibrage

2026-10-22 · 200 expéditions par mesure · 343 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 85 % |
| −5 | 6 % |

Strate de référence pour les cartes : **−4** (le deck de départ y gagne 82 % des expéditions).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire à la Strate −4 (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | −5 | −1 |  |
| Œil-relais | Fer | Perçant | −9 | −1 |  |
| Grappin à câble | Fer | Élan | −13 | +0 |  |
| Cœur-turbine | Cuivre | Surcharge | +6 | −1 |  |
| Œil-brouilleur | Cuivre | Désarmer | +8 | +0 |  |
| Bras-grue | Argent | Perçant | +0 | +0 |  |
| Dorsale renforcée | Argent | Élan | +9 | −1 |  |
| Lames orbitales | Or | Crescendo | +9 | +0 |  |
| Cœur de reprise | Or | Perçant | +4 | +0 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −11 | +0 |  |
| Cuir de récif | Fer | Rempart | −9 | +0 |  |
| Yeux nocturnes | Fer | Fissure | −8 | +0 |  |
| Poumons d’abysse | Cuivre | Rempart | +6 | +0 |  |
| Branchies des Fondations | Cuivre | Rempart | −0 | +0 |  |
| Carapace-mère | Argent | Rempart | +7 | +0 |  |
| Sang d’ambre | Argent | Vague | +5 | +0 |  |
| Cœur de meute | Or | Siphon | +5 | +0 |  |
| Mue totale | Or | Vague | +7 | +0 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | −2 | +0 |  |
| Encre ancienne | Fer | Fissure | −10 | −1 |  |
| Mèche d’or | Fer | Désarmer | −8 | +0 |  |
| Plume de givre | Cuivre | Désarmer | +3 | +0 |  |
| Ombre de serpent | Cuivre | Fissure | −1 | +0 |  |
| Ombre ailée | Argent | Fissure | +1 | +0 |  |
| Pressentiment | Argent | Désarmer | +7 | −1 |  |
| Chant des abysses | Or | Accord | +3 | +0 |  |
| Souffle du wyrm | Or | Crescendo | +5 | +0 |  |

Moyenne par rareté, à la découverte : Fer −6 · Cuivre +3 · Argent +5 · Or +5. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.3, −3 ×1.6, −4 ×1.9, −5 ×2.25, −6 ×2.6, −7 ×2.7, −8 ×2.82, −9 ×2.9, −10 ×3.05, −11 ×3.25, −12 ×3.5, −13 ×3.68, −14 ×3.8, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 3.9 |
| −2 | ×1.30 | 100 % | 100 % | 3.8 |
| −3 | ×1.60 | 97 % | 81 % | 3.6 |
| −4 | ×1.90 | 36 % | 2 % | 1.9 |
| −5 | ×2.25 | 2 % | 0 % | 1.1 |
| −6 | ×2.60 | 0 % | 0 % | 0.6 |
| −7 | ×2.70 | 0 % | 0 % | 0.4 |
| −8 | ×2.82 | 0 % | 0 % | 0.1 |
| −9 | ×2.90 | 0 % | 0 % | 0.1 |
| −10 | ×3.05 | 0 % | 0 % | 0.1 |
| −11 | ×3.25 | 0 % | 0 % | 0.0 |
| −12 | ×3.50 | 0 % | 0 % | 0.0 |

## Le parcours d'un joueur

Une partie entière, jouée par le joueur moyen pendant 45 jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.

| Strate | Occasionnel (2 expéditions par jour) | Assidu (5 expéditions par jour) |
|---|---|---|
| −2 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −3 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −4 | jour 2 (1 exp.) | jour 1 (1 exp.) |
| −5 | jour 4 (4 exp.) | jour 1 (2 exp.) |
| −6 | jour 7 (6 exp.) | jour 3 (8 exp.) |
| −7 | jour 9 (6 exp.) | jour 6 (12 exp.) |
| −8 | jour 13 (4 exp.) | jour 7 (10 exp.) |
| −9 | jour 16 (8 exp.) | jour 9 (4 exp.) |
| −10 | jour 21 (4 exp.) | jour 11 (10 exp.) |
| −11 | jour 31 (8 exp.) | jour 12 (6 exp.) |
| −12 | jour 31 (4 exp.) | jour 12 (2 exp.) |
| −13 | jour 37 (12 exp.) | jour 14 (4 exp.) |
| −14 | jour 39 (10 exp.) | jour 22 (14 exp.) |
| −15 | jour 44 (24 exp.) | jour 28 (16 exp.) |
| −16 | — | jour 33 (16 exp.) |

Victoires au front : Occasionnel 24 % · Assidu 12 %.
