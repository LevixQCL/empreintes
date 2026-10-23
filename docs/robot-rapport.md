# Rapport du robot d'équilibrage

2026-10-23 · 300 expéditions par mesure · 947 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 81 % |
| −3 | 21 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.85 (le deck de départ y gagne 52 % des descentes ; ancienne Strate de référence en mode linéaire : −3).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | −8 | −1 |  |
| Œil-relais | Fer | Perçant | −10 | −3 | trop faible |
| Grappin à câble | Fer | Élan | −9 | +2 |  |
| Cœur-turbine | Cuivre | Surcharge | +0 | −1 |  |
| Œil-brouilleur | Cuivre | Désarmer | +11 | +0 |  |
| Bras-grue | Argent | Perçant | +20 | +0 |  |
| Dorsale renforcée | Argent | Élan | +13 | +1 |  |
| Lames orbitales | Or | Crescendo | +31 | −1 |  |
| Cœur de reprise | Or | Perçant | +22 | +1 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | +4 | −6 |  |
| Cuir de récif | Fer | Rempart | +6 | −1 |  |
| Yeux nocturnes | Fer | Fissure | +6 | −5 |  |
| Poumons d’abysse | Cuivre | Rempart | +9 | +0 |  |
| Branchies des Fondations | Cuivre | Rempart | +7 | −1 |  |
| Carapace-mère | Argent | Rempart | +13 | +0 |  |
| Sang d’ambre | Argent | Vague | +10 | +1 |  |
| Cœur de meute | Or | Siphon | +31 | +2 |  |
| Mue totale | Or | Vague | +17 | +3 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | −5 | −2 |  |
| Encre ancienne | Fer | Fissure | +3 | −5 |  |
| Mèche d’or | Fer | Désarmer | +1 | −1 |  |
| Plume de givre | Cuivre | Désarmer | +12 | +1 |  |
| Ombre de serpent | Cuivre | Fissure | +2 | −1 |  |
| Ombre ailée | Argent | Fissure | +6 | −1 |  |
| Pressentiment | Argent | Désarmer | +13 | +1 |  |
| Chant des abysses | Or | Accord | +23 | +3 |  |
| Souffle du wyrm | Or | Crescendo | +22 | −1 |  |

Moyenne par rareté, à la découverte : Fer −1 · Cuivre +7 · Argent +13 · Or +24. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.3, −3 ×1.7, −4 ×2, −5 ×2.3, −6 ×2.6, −7 ×2.7, −8 ×2.82, −9 ×2.9, −10 ×3.05, −11 ×3.25, −12 ×3.5, −13 ×3.68, −14 ×3.8, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 5.8 |
| −2 | ×1.30 | 78 % | 80 % | 5.5 |
| −3 | ×1.70 | 10 % | 13 % | 4.0 |
| −4 | ×2.00 | 0 % | 0 % | 1.4 |
| −5 | ×2.30 | 0 % | 0 % | 0.6 |
| −6 | ×2.60 | 0 % | 0 % | 0.2 |
| −7 | ×2.70 | 0 % | 0 % | 0.1 |
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
| −3 | jour 3 (4 exp.) | jour 3 (10 exp.) |
| −4 | jour 4 (2 exp.) | jour 3 (4 exp.) |
| −5 | jour 7 (6 exp.) | jour 5 (6 exp.) |
| −6 | jour 11 (6 exp.) | jour 7 (12 exp.) |
| −7 | jour 15 (8 exp.) | jour 9 (10 exp.) |
| −8 | jour 20 (8 exp.) | jour 12 (15 exp.) |
| −9 | jour 24 (10 exp.) | jour 17 (25 exp.) |
| −10 | jour 31 (14 exp.) | jour 22 (23 exp.) |
| −11 | jour 38 (16 exp.) | jour 27 (35 exp.) |
| −12 | jour 45 (17 exp.) | jour 33 (32 exp.) |
| −13 | — | jour 40 (33 exp.) |

Victoires au front : Occasionnel 32 % · Assidu 25 %.
