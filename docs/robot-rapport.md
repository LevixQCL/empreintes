# Rapport du robot d'équilibrage

2026-10-27 · 300 expéditions par mesure · 2468 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 80 % |
| −3 | 13 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.88 (le deck de départ y gagne 48 % des descentes ; ancienne Strate de référence en mode linéaire : −2).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | +3 | −1 |  |
| Œil-relais | Fer | Perçant | −1 | +1 |  |
| Grappin à câble | Fer | Élan | −2 | −1 |  |
| Cœur-turbine | Cuivre | Surcharge | +2 | +3 |  |
| Œil-brouilleur | Cuivre | Désarmer | +3 | +5 |  |
| Bras-grue | Argent | Perçant | +13 | +3 |  |
| Dorsale renforcée | Argent | Élan | +9 | +5 |  |
| Lames orbitales | Or | Crescendo | +2 | +2 | trop faible |
| Cœur de reprise | Or | Perçant | +21 | +5 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −7 | −2 |  |
| Cuir de récif | Fer | Rempart | −5 | −1 |  |
| Yeux nocturnes | Fer | Fissure | +4 | +3 |  |
| Poumons d’abysse | Cuivre | Rempart | +3 | +3 |  |
| Branchies des Fondations | Cuivre | Rempart | +5 | +3 |  |
| Carapace-mère | Argent | Rempart | +11 | +4 |  |
| Sang d’ambre | Argent | Vague | +5 | +5 |  |
| Cœur de meute | Or | Siphon | +21 | +4 |  |
| Mue totale | Or | Vague | +30 | +6 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +3 | +2 |  |
| Encre ancienne | Fer | Fissure | −1 | +3 |  |
| Mèche d’or | Fer | Désarmer | +1 | +4 |  |
| Plume de givre | Cuivre | Désarmer | +15 | +3 | TROP FORTE |
| Ombre de serpent | Cuivre | Fissure | +11 | +4 |  |
| Ombre ailée | Argent | Fissure | +9 | −1 |  |
| Pressentiment | Argent | Désarmer | +13 | +5 |  |
| Chant des abysses | Or | Accord | +33 | +6 | TROP FORTE |
| Souffle du wyrm | Or | Crescendo | +29 | +5 |  |
| Bobine de récupération | Fer | Surcharge | +5 | +1 |  |
| Condensateur | Cuivre | Surcharge | +1 | +1 |  |
| Décharge d’arc | Cuivre | Décharge | +1 | −1 |  |
| Éclair captif | Argent | Décharge | +9 | +1 |  |
| Noyau instable | Or | Décharge | +25 | +1 |  |
| Coup d’épaule | Fer | Riposte | +0 | +3 |  |
| Queue-massue | Cuivre | Riposte | +11 | −1 |  |
| Bélier d’os | Argent | Riposte | +26 | +5 | TROP FORTE |
| Retour de marée | Or | Riposte | +23 | +5 |  |
| Diapason de cristal | Fer | Diapason | −4 | −1 |  |
| Voix basse | Fer | Unisson | −2 | +1 |  |
| Chorale des ombres | Cuivre | Unisson | +9 | +1 |  |
| Cloche des abysses | Argent | Diapason | +7 | +4 |  |
| Grand unisson | Or | Unisson | +21 | +3 |  |
| Foulée de la directrice | Nacre | Élan | +23 | +5 | trop faible |
| Bras de la Fonderie | Nacre | Perçant | +34 | +4 |  |
| Cœur de la Glacière | Nacre | Décharge | +37 | +7 | TROP FORTE |
| Carapace des Fondations | Nacre | Rempart | +38 | +6 | TROP FORTE |
| Œil de la Grande Nuit | Nacre | Fissure | +43 | +5 | TROP FORTE |
| Première mue | Nacre | Vague | +27 | +7 |  |
| Lanterne de la première Lecture | Nacre | Accord | +37 | +6 | TROP FORTE |
| Sceau volé aux Orsève | Nacre | Désarmer | +31 | +5 |  |
| Voix du quartier | Nacre | Diapason | +27 | +2 |  |

Moyenne par rareté, à la découverte : Fer −0 · Cuivre +6 · Argent +11 · Or +23 · Nacre +33. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.39, −3 ×1.818, −4 ×2.139, −5 ×2.46, −6 ×2.781, −7 ×2.888, −8 ×3.016, −9 ×3.102, −10 ×3.262, −11 ×3.475, −12 ×3.743, −13 ×3.936, −14 ×4.064, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 5.8 |
| −2 | ×1.39 | 80 % | 70 % | 5.5 |
| −3 | ×1.82 | 16 % | 2 % | 4.4 |
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
| −3 | jour 3 (4 exp.) | jour 2 (6 exp.) |
| −4 | jour 4 (3 exp.) | jour 3 (3 exp.) |
| −5 | jour 8 (6 exp.) | jour 5 (5 exp.) |
| −6 | jour 12 (11 exp.) | jour 7 (12 exp.) |
| −7 | jour 15 (8 exp.) | jour 10 (11 exp.) |
| −8 | jour 20 (8 exp.) | jour 13 (15 exp.) |
| −9 | jour 24 (10 exp.) | jour 17 (22 exp.) |
| −10 | jour 32 (15 exp.) | jour 23 (25 exp.) |
| −11 | jour 41 (16 exp.) | jour 29 (35 exp.) |
| −12 | — | jour 36 (30 exp.) |
| −13 | — | jour 43 (40 exp.) |

Victoires au front : Occasionnel 30 % · Assidu 20 %.
