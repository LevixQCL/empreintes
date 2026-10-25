# Rapport du robot d'équilibrage

2026-10-25 · 300 expéditions par mesure · 447 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 61 % |
| −3 | 0 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.80 (le deck de départ y gagne 39 % des descentes ; ancienne Strate de référence en mode linéaire : −2).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | +13 | +0 | TROP FORTE |
| Œil-relais | Fer | Perçant | +1 | +1 |  |
| Grappin à câble | Fer | Élan | +6 | +3 |  |
| Cœur-turbine | Cuivre | Surcharge | +12 | +3 |  |
| Œil-brouilleur | Cuivre | Désarmer | +15 | +3 |  |
| Bras-grue | Argent | Perçant | +15 | +2 |  |
| Dorsale renforcée | Argent | Élan | +10 | +4 |  |
| Lames orbitales | Or | Crescendo | +33 | +2 |  |
| Cœur de reprise | Or | Perçant | +23 | +4 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −1 | +1 |  |
| Cuir de récif | Fer | Rempart | −3 | +2 |  |
| Yeux nocturnes | Fer | Fissure | +2 | +3 |  |
| Poumons d’abysse | Cuivre | Rempart | +13 | +3 |  |
| Branchies des Fondations | Cuivre | Rempart | +5 | +0 |  |
| Carapace-mère | Argent | Rempart | +11 | +3 |  |
| Sang d’ambre | Argent | Vague | +21 | +5 |  |
| Cœur de meute | Or | Siphon | +29 | +3 |  |
| Mue totale | Or | Vague | +30 | +6 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +1 | +3 |  |
| Encre ancienne | Fer | Fissure | +7 | +2 |  |
| Mèche d’or | Fer | Désarmer | +1 | +3 |  |
| Plume de givre | Cuivre | Désarmer | +18 | +3 |  |
| Ombre de serpent | Cuivre | Fissure | +13 | +1 |  |
| Ombre ailée | Argent | Fissure | +9 | +0 |  |
| Pressentiment | Argent | Désarmer | +18 | +2 |  |
| Chant des abysses | Or | Accord | +17 | +4 | trop faible |
| Souffle du wyrm | Or | Crescendo | +23 | +3 |  |

Moyenne par rareté, à la découverte : Fer +2 · Cuivre +13 · Argent +14 · Or +26. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.3, −3 ×1.7, −4 ×2, −5 ×2.3, −6 ×2.6, −7 ×2.7, −8 ×2.82, −9 ×2.9, −10 ×3.05, −11 ×3.25, −12 ×3.5, −13 ×3.68, −14 ×3.8, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 5.8 |
| −2 | ×1.30 | 57 % | 34 % | 5.0 |
| −3 | ×1.70 | 1 % | 0 % | 2.9 |
| −4 | ×2.00 | 0 % | 0 % | 0.8 |
| −5 | ×2.30 | 0 % | 0 % | 0.3 |
| −6 | ×2.60 | 0 % | 0 % | 0.0 |
| −7 | ×2.70 | 0 % | 0 % | 0.0 |
| −8 | ×2.82 | 0 % | 0 % | 0.0 |
| −9 | ×2.90 | 0 % | 0 % | 0.0 |
| −10 | ×3.05 | 0 % | 0 % | 0.0 |
| −11 | ×3.25 | 0 % | 0 % | 0.0 |
| −12 | ×3.50 | 0 % | 0 % | 0.0 |

## Le parcours d'un joueur

Une partie entière, jouée par le joueur moyen pendant 45 jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.

| Strate | Occasionnel (2 expéditions par jour) | Assidu (5 expéditions par jour) |
|---|---|---|
| −2 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −3 | jour 4 (5 exp.) | jour 2 (7 exp.) |
| −4 | jour 4 (2 exp.) | jour 3 (4 exp.) |
| −5 | jour 8 (8 exp.) | jour 5 (8 exp.) |
| −6 | jour 11 (8 exp.) | jour 8 (14 exp.) |
| −7 | jour 15 (8 exp.) | jour 10 (10 exp.) |
| −8 | jour 19 (6 exp.) | jour 13 (18 exp.) |
| −9 | jour 24 (9 exp.) | jour 17 (22 exp.) |
| −10 | jour 30 (11 exp.) | jour 23 (23 exp.) |
| −11 | — | jour 33 (33 exp.) |
| −12 | — | jour 39 (30 exp.) |

Victoires au front : Occasionnel 24 % · Assidu 16 %.
