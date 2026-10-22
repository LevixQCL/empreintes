# Rapport du robot d'équilibrage

2026-10-22 · 300 expéditions par mesure · 243 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 85 % |
| −5 | 6 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×1.30 (le deck de départ y gagne 49 % des descentes ; ancienne Strate de référence en mode linéaire : −4).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | −4 | −3 |  |
| Œil-relais | Fer | Perçant | −6 | −2 |  |
| Grappin à câble | Fer | Élan | −1 | +2 |  |
| Cœur-turbine | Cuivre | Surcharge | +1 | +1 |  |
| Œil-brouilleur | Cuivre | Désarmer | +9 | +4 |  |
| Bras-grue | Argent | Perçant | +1 | −1 | trop faible |
| Dorsale renforcée | Argent | Élan | +12 | +5 |  |
| Lames orbitales | Or | Crescendo | +13 | +3 |  |
| Cœur de reprise | Or | Perçant | +13 | +5 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −6 | −21 |  |
| Cuir de récif | Fer | Rempart | −8 | −1 |  |
| Yeux nocturnes | Fer | Fissure | −2 | −10 |  |
| Poumons d’abysse | Cuivre | Rempart | +9 | +3 |  |
| Branchies des Fondations | Cuivre | Rempart | +7 | +3 |  |
| Carapace-mère | Argent | Rempart | +13 | +1 |  |
| Sang d’ambre | Argent | Vague | +17 | +2 |  |
| Cœur de meute | Or | Siphon | +23 | +1 |  |
| Mue totale | Or | Vague | +19 | +5 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +3 | +7 |  |
| Encre ancienne | Fer | Fissure | +3 | −3 |  |
| Mèche d’or | Fer | Désarmer | +1 | +2 |  |
| Plume de givre | Cuivre | Désarmer | +7 | +3 |  |
| Ombre de serpent | Cuivre | Fissure | +4 | +1 |  |
| Ombre ailée | Argent | Fissure | +8 | −1 |  |
| Pressentiment | Argent | Désarmer | +12 | +4 |  |
| Chant des abysses | Or | Accord | +13 | +3 |  |
| Souffle du wyrm | Or | Crescendo | +14 | +4 |  |

Moyenne par rareté, à la découverte : Fer −2 · Cuivre +6 · Argent +10 · Or +16. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.3, −3 ×1.6, −4 ×1.9, −5 ×2.25, −6 ×2.6, −7 ×2.7, −8 ×2.82, −9 ×2.9, −10 ×3.05, −11 ×3.25, −12 ×3.5, −13 ×3.68, −14 ×3.8, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 4.0 |
| −2 | ×1.30 | 100 % | 100 % | 3.9 |
| −3 | ×1.60 | 97 % | 84 % | 3.7 |
| −4 | ×1.90 | 37 % | 1 % | 2.0 |
| −5 | ×2.25 | 0 % | 0 % | 1.2 |
| −6 | ×2.60 | 0 % | 0 % | 0.6 |
| −7 | ×2.70 | 0 % | 0 % | 0.4 |
| −8 | ×2.82 | 0 % | 0 % | 0.1 |
| −9 | ×2.90 | 0 % | 0 % | 0.1 |
| −10 | ×3.05 | 0 % | 0 % | 0.0 |
| −11 | ×3.25 | 0 % | 0 % | 0.0 |
| −12 | ×3.50 | 0 % | 0 % | 0.0 |

## Le parcours d'un joueur

Une partie entière, jouée par le joueur moyen pendant 45 jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.

| Strate | Occasionnel (2 expéditions par jour) | Assidu (5 expéditions par jour) |
|---|---|---|
| −2 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −3 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −4 | jour 2 (1 exp.) | jour 1 (1 exp.) |
| −5 | jour 4 (3 exp.) | jour 2 (4 exp.) |
| −6 | jour 6 (4 exp.) | jour 4 (10 exp.) |
| −7 | jour 9 (6 exp.) | jour 7 (14 exp.) |
| −8 | jour 17 (10 exp.) | jour 11 (22 exp.) |
| −9 | jour 23 (12 exp.) | jour 16 (27 exp.) |
| −10 | jour 29 (14 exp.) | jour 23 (32 exp.) |
| −11 | jour 36 (16 exp.) | jour 28 (25 exp.) |
| −12 | jour 43 (16 exp.) | jour 33 (28 exp.) |
| −13 | — | jour 39 (35 exp.) |

Victoires au front : Occasionnel 41 % · Assidu 41 %.
