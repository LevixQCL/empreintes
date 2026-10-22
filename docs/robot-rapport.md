# Rapport du robot d'équilibrage

2026-10-22 · 300 expéditions par mesure · 872 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 81 % |
| −3 | 21 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.86 (le deck de départ y gagne 51 % des descentes ; ancienne Strate de référence en mode linéaire : −3).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | −16 | −3 | trop faible |
| Œil-relais | Fer | Perçant | −5 | −4 |  |
| Grappin à câble | Fer | Élan | +1 | +0 |  |
| Cœur-turbine | Cuivre | Surcharge | −5 | +0 | trop faible |
| Œil-brouilleur | Cuivre | Désarmer | +7 | −1 |  |
| Bras-grue | Argent | Perçant | +23 | −2 | TROP FORTE |
| Dorsale renforcée | Argent | Élan | +2 | −3 | trop faible |
| Lames orbitales | Or | Crescendo | +25 | −1 |  |
| Cœur de reprise | Or | Perçant | +21 | −3 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −10 | −5 |  |
| Cuir de récif | Fer | Rempart | +4 | −2 |  |
| Yeux nocturnes | Fer | Fissure | +3 | −5 |  |
| Poumons d’abysse | Cuivre | Rempart | +9 | −1 |  |
| Branchies des Fondations | Cuivre | Rempart | +1 | −1 |  |
| Carapace-mère | Argent | Rempart | +15 | −1 |  |
| Sang d’ambre | Argent | Vague | +14 | −2 |  |
| Cœur de meute | Or | Siphon | +38 | +1 | TROP FORTE |
| Mue totale | Or | Vague | +23 | −1 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +3 | −3 |  |
| Encre ancienne | Fer | Fissure | +1 | −2 |  |
| Mèche d’or | Fer | Désarmer | −8 | −1 |  |
| Plume de givre | Cuivre | Désarmer | +11 | −3 |  |
| Ombre de serpent | Cuivre | Fissure | +1 | −5 |  |
| Ombre ailée | Argent | Fissure | +5 | −4 |  |
| Pressentiment | Argent | Désarmer | +15 | −1 |  |
| Chant des abysses | Or | Accord | +23 | −1 |  |
| Souffle du wyrm | Or | Crescendo | +15 | +0 | trop faible |

Moyenne par rareté, à la découverte : Fer −2 · Cuivre +4 · Argent +12 · Or +24. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.3, −3 ×1.7, −4 ×2, −5 ×2.3, −6 ×2.6, −7 ×2.7, −8 ×2.82, −9 ×2.9, −10 ×3.05, −11 ×3.25, −12 ×3.5, −13 ×3.68, −14 ×3.8, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 4.0 |
| −2 | ×1.30 | 79 % | 81 % | 3.7 |
| −3 | ×1.70 | 20 % | 19 % | 2.9 |
| −4 | ×2.00 | 0 % | 0 % | 1.3 |
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
| −2 | jour 3 (4 exp.) | jour 1 (4 exp.) |
| −3 | jour 4 (1 exp.) | jour 3 (5 exp.) |
| −4 | jour 5 (3 exp.) | jour 4 (4 exp.) |
| −5 | jour 8 (4 exp.) | jour 5 (7 exp.) |
| −6 | jour 11 (6 exp.) | jour 8 (14 exp.) |
| −7 | jour 14 (8 exp.) | jour 10 (16 exp.) |
| −8 | jour 20 (10 exp.) | jour 13 (16 exp.) |
| −9 | jour 27 (14 exp.) | jour 18 (22 exp.) |
| −10 | jour 32 (11 exp.) | jour 25 (30 exp.) |
| −11 | jour 42 (17 exp.) | jour 30 (30 exp.) |
| −12 | — | jour 36 (27 exp.) |
| −13 | — | jour 42 (37 exp.) |

Victoires au front : Occasionnel 29 % · Assidu 27 %.
