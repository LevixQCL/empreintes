# Rapport du robot d'équilibrage

2026-10-26 · 300 expéditions par mesure · 1389 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 78 % |
| −3 | 9 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.85 (le deck de départ y gagne 56 % des descentes ; ancienne Strate de référence en mode linéaire : −2).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | −7 | −3 |  |
| Œil-relais | Fer | Perçant | −1 | −1 |  |
| Grappin à câble | Fer | Élan | −8 | −1 |  |
| Cœur-turbine | Cuivre | Surcharge | +2 | +1 |  |
| Œil-brouilleur | Cuivre | Désarmer | +0 | +1 |  |
| Bras-grue | Argent | Perçant | +9 | −1 |  |
| Dorsale renforcée | Argent | Élan | +9 | +1 |  |
| Lames orbitales | Or | Crescendo | +3 | −1 | trop faible |
| Cœur de reprise | Or | Perçant | +24 | +1 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −5 | −7 |  |
| Cuir de récif | Fer | Rempart | −7 | +1 |  |
| Yeux nocturnes | Fer | Fissure | −3 | −5 |  |
| Poumons d’abysse | Cuivre | Rempart | +8 | +0 |  |
| Branchies des Fondations | Cuivre | Rempart | +11 | −1 |  |
| Carapace-mère | Argent | Rempart | +10 | +1 |  |
| Sang d’ambre | Argent | Vague | +12 | +2 |  |
| Cœur de meute | Or | Siphon | +19 | +0 |  |
| Mue totale | Or | Vague | +20 | +1 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | −7 | −2 |  |
| Encre ancienne | Fer | Fissure | −7 | −1 |  |
| Mèche d’or | Fer | Désarmer | −9 | +1 |  |
| Plume de givre | Cuivre | Désarmer | +11 | −1 |  |
| Ombre de serpent | Cuivre | Fissure | +7 | −1 |  |
| Ombre ailée | Argent | Fissure | +7 | −1 |  |
| Pressentiment | Argent | Désarmer | +6 | −1 |  |
| Chant des abysses | Or | Accord | +19 | +1 |  |
| Souffle du wyrm | Or | Crescendo | +17 | −1 |  |

Moyenne par rareté, à la découverte : Fer −4 · Cuivre +7 · Argent +9 · Or +17. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.39, −3 ×1.818, −4 ×2.139, −5 ×2.46, −6 ×2.781, −7 ×2.888, −8 ×3.016, −9 ×3.102, −10 ×3.262, −11 ×3.475, −12 ×3.743, −13 ×3.936, −14 ×4.064, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 5.8 |
| −2 | ×1.39 | 77 % | 73 % | 5.5 |
| −3 | ×1.82 | 12 % | 3 % | 4.4 |
| −4 | ×2.14 | 0 % | 0 % | 2.1 |
| −5 | ×2.46 | 0 % | 0 % | 1.2 |
| −6 | ×2.78 | 0 % | 0 % | 0.5 |
| −7 | ×2.89 | 0 % | 0 % | 0.3 |
| −8 | ×3.02 | 0 % | 0 % | 0.3 |
| −9 | ×3.10 | 0 % | 0 % | 0.2 |
| −10 | ×3.26 | 0 % | 0 % | 0.2 |
| −11 | ×3.48 | 0 % | 0 % | 0.1 |
| −12 | ×3.74 | 0 % | 0 % | 0.0 |

## Le parcours d'un joueur

Une partie entière, jouée par le joueur moyen pendant 45 jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.

| Strate | Occasionnel (2 expéditions par jour) | Assidu (5 expéditions par jour) |
|---|---|---|
| −2 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −3 | jour 3 (4 exp.) | jour 3 (9 exp.) |
| −4 | jour 4 (2 exp.) | jour 3 (3 exp.) |
| −5 | jour 7 (5 exp.) | jour 5 (6 exp.) |
| −6 | jour 9 (5 exp.) | jour 7 (12 exp.) |
| −7 | jour 12 (8 exp.) | jour 10 (13 exp.) |
| −8 | jour 19 (10 exp.) | jour 13 (15 exp.) |
| −9 | jour 24 (12 exp.) | jour 18 (23 exp.) |
| −10 | jour 29 (12 exp.) | jour 22 (25 exp.) |
| −11 | jour 38 (16 exp.) | jour 28 (28 exp.) |
| −12 | — | jour 33 (28 exp.) |
| −13 | — | jour 41 (38 exp.) |

Victoires au front : Occasionnel 41 % · Assidu 37 %.
