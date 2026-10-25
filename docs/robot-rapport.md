# Rapport du robot d'équilibrage

2026-10-25 · 300 expéditions par mesure · 792 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 75 % |
| −3 | 1 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.81 (le deck de départ y gagne 49 % des descentes ; ancienne Strate de référence en mode linéaire : −2).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | +5 | +1 |  |
| Œil-relais | Fer | Perçant | +2 | +1 |  |
| Grappin à câble | Fer | Élan | −3 | +1 |  |
| Cœur-turbine | Cuivre | Surcharge | +13 | −2 |  |
| Œil-brouilleur | Cuivre | Désarmer | +8 | +0 |  |
| Bras-grue | Argent | Perçant | +19 | +1 |  |
| Dorsale renforcée | Argent | Élan | +1 | +1 | trop faible |
| Lames orbitales | Or | Crescendo | +39 | +1 | TROP FORTE |
| Cœur de reprise | Or | Perçant | +21 | +1 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | +20 | +1 | TROP FORTE |
| Cuir de récif | Fer | Rempart | −3 | +0 |  |
| Yeux nocturnes | Fer | Fissure | +15 | +1 | TROP FORTE |
| Poumons d’abysse | Cuivre | Rempart | +12 | +0 |  |
| Branchies des Fondations | Cuivre | Rempart | +7 | +0 |  |
| Carapace-mère | Argent | Rempart | +13 | +1 |  |
| Sang d’ambre | Argent | Vague | +11 | +0 |  |
| Cœur de meute | Or | Siphon | +19 | +2 | trop faible |
| Mue totale | Or | Vague | +14 | +2 | trop faible |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +3 | −1 |  |
| Encre ancienne | Fer | Fissure | +1 | −1 |  |
| Mèche d’or | Fer | Désarmer | −5 | −3 | trop faible |
| Plume de givre | Cuivre | Désarmer | +20 | +1 | TROP FORTE |
| Ombre de serpent | Cuivre | Fissure | +20 | +1 | TROP FORTE |
| Ombre ailée | Argent | Fissure | +35 | +0 | TROP FORTE |
| Pressentiment | Argent | Désarmer | +11 | +0 |  |
| Chant des abysses | Or | Accord | +35 | +1 |  |
| Souffle du wyrm | Or | Crescendo | +41 | +2 | TROP FORTE |

Moyenne par rareté, à la découverte : Fer +3 · Cuivre +13 · Argent +15 · Or +28. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.495, −3 ×1.955, −4 ×2.3, −5 ×2.645, −6 ×2.99, −7 ×3.105, −8 ×3.243, −9 ×3.335, −10 ×3.507, −11 ×3.737, −12 ×4.025, −13 ×4.232, −14 ×4.37, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 5.8 |
| −2 | ×1.50 | 79 % | 85 % | 5.6 |
| −3 | ×1.96 | 3 % | 5 % | 4.4 |
| −4 | ×2.30 | 0 % | 0 % | 2.7 |
| −5 | ×2.65 | 0 % | 0 % | 1.2 |
| −6 | ×2.99 | 0 % | 0 % | 0.6 |
| −7 | ×3.10 | 0 % | 0 % | 0.3 |
| −8 | ×3.24 | 0 % | 0 % | 0.3 |
| −9 | ×3.33 | 0 % | 0 % | 0.3 |
| −10 | ×3.51 | 0 % | 0 % | 0.2 |
| −11 | ×3.74 | 0 % | 0 % | 0.1 |
| −12 | ×4.03 | 0 % | 0 % | 0.1 |

## Le parcours d'un joueur

Une partie entière, jouée par le joueur moyen pendant 45 jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.

| Strate | Occasionnel (2 expéditions par jour) | Assidu (5 expéditions par jour) |
|---|---|---|
| −2 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −3 | jour 3 (4 exp.) | jour 3 (9 exp.) |
| −4 | jour 4 (2 exp.) | jour 3 (3 exp.) |
| −5 | jour 6 (4 exp.) | jour 4 (5 exp.) |
| −6 | jour 8 (5 exp.) | jour 6 (10 exp.) |
| −7 | jour 12 (5 exp.) | jour 9 (12 exp.) |
| −8 | jour 17 (10 exp.) | jour 12 (15 exp.) |
| −9 | jour 22 (10 exp.) | jour 15 (23 exp.) |
| −10 | jour 28 (12 exp.) | jour 21 (23 exp.) |
| −11 | jour 35 (16 exp.) | jour 26 (25 exp.) |
| −12 | jour 45 (18 exp.) | jour 32 (30 exp.) |
| −13 | — | jour 38 (30 exp.) |
| −14 | — | jour 44 (33 exp.) |

Victoires au front : Occasionnel 39 % · Assidu 33 %.
