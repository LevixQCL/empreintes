# Rapport du robot d'équilibrage

2026-10-22 · 150 expéditions par mesure · 323 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 88 % |
| −5 | 4 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×1.30 (le deck de départ y gagne 43 % des descentes ; ancienne Strate de référence en mode linéaire : −4).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | +0 | −3 |  |
| Œil-relais | Fer | Perçant | −1 | −3 |  |
| Grappin à câble | Fer | Élan | +11 | +5 | TROP FORTE |
| Cœur-turbine | Cuivre | Surcharge | +7 | −1 |  |
| Œil-brouilleur | Cuivre | Désarmer | +16 | +3 |  |
| Bras-grue | Argent | Perçant | +10 | −1 | trop faible |
| Dorsale renforcée | Argent | Élan | +40 | +6 | TROP FORTE |
| Lames orbitales | Or | Crescendo | +8 | +2 | trop faible |
| Cœur de reprise | Or | Perçant | +16 | +4 | trop faible |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | +1 | −21 |  |
| Cuir de récif | Fer | Rempart | −1 | −1 |  |
| Yeux nocturnes | Fer | Fissure | +3 | −10 |  |
| Poumons d’abysse | Cuivre | Rempart | +19 | +4 |  |
| Branchies des Fondations | Cuivre | Rempart | +15 | +4 |  |
| Carapace-mère | Argent | Rempart | +25 | +2 | TROP FORTE |
| Sang d’ambre | Argent | Vague | +21 | +4 |  |
| Cœur de meute | Or | Siphon | +26 | +1 |  |
| Mue totale | Or | Vague | +25 | +4 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +8 | +6 |  |
| Encre ancienne | Fer | Fissure | +7 | −5 |  |
| Mèche d’or | Fer | Désarmer | +2 | +1 |  |
| Plume de givre | Cuivre | Désarmer | +11 | +2 |  |
| Ombre de serpent | Cuivre | Fissure | +11 | +2 |  |
| Ombre ailée | Argent | Fissure | +19 | +1 |  |
| Pressentiment | Argent | Désarmer | +20 | +3 |  |
| Chant des abysses | Or | Accord | +12 | −1 | trop faible |
| Souffle du wyrm | Or | Crescendo | +21 | +4 |  |

Moyenne par rareté, à la découverte : Fer +3 · Cuivre +13 · Argent +22 · Or +18. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×1, −2 ×1.3, −3 ×1.6, −4 ×1.9, −5 ×2.25, −6 ×2.6, −7 ×2.7, −8 ×2.82, −9 ×2.9, −10 ×3.05, −11 ×3.25, −12 ×3.5, −13 ×3.68, −14 ×3.8, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×1.00 | 100 % | 100 % | 4.0 |
| −2 | ×1.30 | 100 % | 100 % | 3.9 |
| −3 | ×1.60 | 97 % | 87 % | 3.7 |
| −4 | ×1.90 | 40 % | 0 % | 2.0 |
| −5 | ×2.25 | 0 % | 0 % | 1.2 |
| −6 | ×2.60 | 0 % | 0 % | 0.5 |
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
| −5 | jour 3 (2 exp.) | jour 1 (2 exp.) |
| −6 | jour 6 (6 exp.) | jour 3 (6 exp.) |
| −7 | jour 10 (8 exp.) | jour 6 (14 exp.) |
| −8 | jour 15 (6 exp.) | jour 7 (6 exp.) |
| −9 | jour 18 (4 exp.) | jour 8 (2 exp.) |
| −10 | jour 19 (2 exp.) | jour 9 (4 exp.) |
| −11 | jour 23 (4 exp.) | jour 12 (12 exp.) |
| −12 | jour 26 (4 exp.) | jour 12 (2 exp.) |
| −13 | jour 30 (2 exp.) | jour 13 (6 exp.) |
| −14 | jour 33 (2 exp.) | jour 19 (14 exp.) |
| −15 | jour 38 (14 exp.) | jour 21 (18 exp.) |
| −16 | jour 43 (8 exp.) | jour 25 (12 exp.) |
| −17 | — | jour 44 (54 exp.) |

Victoires au front : Occasionnel 26 % · Assidu 13 %.
