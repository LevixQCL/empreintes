# Rapport du robot d'équilibrage

2026-11-03 · 300 expéditions par mesure · 10192 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 91 % |
| −3 | 16 % |

Mesure des cartes : une Strate −3 entière en exploration, ennemis ×0.91 (le deck de départ y gagne 47 % des descentes ; ancienne Strate de référence en mode linéaire : −3).

## Ce que vaut chaque carte

**Rééquilibrage du 4 novembre 2026** : 28 cartes réglées puis remesurées une à une (même méthode, 150 descentes par carte, ±5 points de bruit). Cloche des abysses, Boucle de mémoire et Silence d’avant passent de bouclier à attaque (rôle « orchestrer » des Résonants), effets inchangés. La colonne « Au niveau 10 » date de la mesure précédente.

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | +3 | +0 |  |
| Œil-relais | Fer | Perçant | +3 | +0 |  |
| Grappin à câble | Fer | Élan | −3 | +0 |  |
| Cœur-turbine | Cuivre | Élan | +15 | −1 |  |
| Œil-brouilleur | Cuivre | Troubler | +10 | +0 |  |
| Bras-grue | Argent | Perçant | +19 | +0 |  |
| Dorsale renforcée | Argent | Élan | +17 | +0 |  |
| Lames orbitales | Or | Crescendo | +23 | −1 |  |
| Cœur de reprise | Or | Perçant | +22 | +0 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −1 | +0 |  |
| Cuir de récif | Fer | Riposte | +5 | −1 |  |
| Yeux nocturnes | Fer | Fissure | −3 | +0 |  |
| Poumons d’abysse | Cuivre | Rempart | +15 | +0 |  |
| Branchies des Fondations | Cuivre | Vague | +9 | +0 |  |
| Carapace-mère | Argent | Rempart | +19 | +0 |  |
| Sang d’ambre | Argent | Vague | +17 | +0 |  |
| Cœur de meute | Or | Siphon | +20 | +0 |  |
| Mue totale | Or | Vague | +27 | +0 |  |
| Éclat qui chante | Fer | Diapason | +0 | +0 |  |
| Miroir de brume | Fer | Amorce | −4 | +0 |  |
| Encre ancienne | Fer | Fissure | +1 | +0 |  |
| Mèche d’or | Fer | Lecture | +0 | +0 |  |
| Plume de givre | Cuivre | Troubler | +11 | +0 |  |
| Ombre de serpent | Cuivre | Fissure | +7 | +0 |  |
| Ombre ailée | Argent | Fissure | +8 | +0 |  |
| Sablier inversé | Argent | Sourdine | +12 | +0 |  |
| Chant des abysses | Or | Accord | +23 | +0 |  |
| Souffle du wyrm | Or | Crescendo | +26 | +0 |  |
| Bobine de récupération | Fer | Surcharge | −6 | +0 |  |
| Condensateur | Cuivre | Surcharge | +12 | +0 |  |
| Décharge d’arc | Cuivre | Décharge | +11 | −1 |  |
| Éclair captif | Argent | Décharge | +19 | +0 |  |
| Noyau instable | Or | Décharge | +29 | +0 |  |
| Épaulière de roche | Fer | Riposte | +3 | −1 |  |
| Queue-massue | Cuivre | Riposte | +14 | +0 |  |
| Bélier d’os | Argent | Riposte | +15 | +0 |  |
| Coquille de marée | Or | Riposte | +28 | +0 |  |
| Diapason de cristal | Fer | Diapason | −5 | +0 |  |
| Voix basse | Fer | Unisson | −1 | +0 |  |
| Chorale des ombres | Cuivre | Unisson | +11 | +0 |  |
| Cloche des abysses | Argent | Diapason | +12 | −1 |  |
| Grand unisson | Or | Unisson | +23 | +0 |  |
| Flair | Fer | Fissure | +1 | +0 |  |
| Bond du prédateur | Fer | Curée | −1 | +0 |  |
| Crocs de verre | Cuivre | Curée | +7 | −1 |  |
| Chasse à l’aveugle | Argent | Curée | +18 | −1 |  |
| Hallali | Or | Curée | +23 | +0 |  |
| Regard en biais | Fer | Lecture | −1 | −1 |  |
| Lame de doute | Fer | Faille | +3 | +0 |  |
| Œil du Lecteur | Cuivre | Lecture | +11 | +0 |  |
| Verdict | Argent | Faille | +11 | +0 |  |
| Sentence muette | Or | Faille | +23 | +0 |  |
| Pollen d’ambre | Fer | Débord | +5 | +0 |  |
| Sève des piliers | Cuivre | Débord | +16 | +0 |  |
| Mue de verre | Argent | Débord | +12 | +0 |  |
| Floraison des Fondations | Or | Débord | +29 | +0 |  |
| Pas chassé | Fer | Élan | +0 | +0 |  |
| Lames jumelles | Fer | Rafale | +3 | +0 |  |
| Poings-pistons | Cuivre | Rafale | +10 | +0 |  |
| Mitraille de clous | Argent | Rafale | +19 | +0 |  |
| Cadence folle | Or | Rafale | +28 | +0 |  |
| Gantelet-pillard | Argent | Rapt | +13 | +0 |  |
| Mâchoire-miroir | Argent | Empreinte | +10 | −1 |  |
| Boucle de mémoire | Argent | Rappel | +15 | +0 |  |
| Cœur en surrégime | Or | Surtension | +21 | +0 |  |
| Peau de l’Ancêtre | Or | Rapt | +17 | −1 |  |
| Miroir des Hauts | Or | Empreinte | +23 | +0 |  |
| Cœur d’étoile | Nacre | Surtension | +30 | −1 | TROP FORTE |
| Seconde naissance | Nacre | Relève | +20 | +0 | trop faible |
| Empreinte vive | Nacre | Empreinte | +31 | +0 | TROP FORTE |
| Silence d’avant | Nacre | Rappel | +25 | −1 |  |
| Foulée de la directrice | Nacre | Élan | +32 | +0 | TROP FORTE |
| Bras de la Fonderie | Nacre | Perçant | +24 | +0 |  |
| Cœur de la Glacière | Nacre | Décharge | +24 | +0 |  |
| Carapace des Fondations | Nacre | Rempart | +33 | +0 | TROP FORTE |
| Œil de la Grande Nuit | Nacre | Fissure | +25 | −1 |  |
| Première mue | Nacre | Vague | +21 | +0 |  |
| Lanterne de la première Lecture | Nacre | Accord | +27 | +0 |  |
| Sceau volé aux Orsève | Nacre | Troubler | +29 | +0 |  |
| Voix du quartier | Nacre | Diapason | +26 | +0 |  |
| Empreinte jumelle | Cuivre | Accord | +9 | +0 |  |

Moyenne par rareté, à la découverte : Fer +0 · Cuivre +11 · Argent +13 · Or +24 · Nacre +25. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Une Strate entière avec le deck de départ

La descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). Force des ennemis : −1 ×0.85, −2 ×1.39, −3 ×1.818, −4 ×2.139, −5 ×2.46, −6 ×2.781, −7 ×2.9, −8 ×3.05, −9 ×3.2, −10 ×3.38, −11 ×3.6, −12 ×3.85, −13 ×4.05, −14 ×4.2, puis ×1.04 par Strate.

| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |
|---|---|---|---|---|
| −1 | ×0.85 | 100 % | 100 % | 5.9 |
| −2 | ×1.39 | 89 % | 65 % | 5.5 |
| −3 | ×1.82 | 12 % | 2 % | 4.8 |
| −4 | ×2.14 | 0 % | 0 % | 2.2 |
| −5 | ×2.46 | 0 % | 0 % | 1.2 |
| −6 | ×2.78 | 0 % | 0 % | 0.7 |
| −7 | ×2.90 | 0 % | 0 % | 0.3 |
| −8 | ×3.05 | 0 % | 0 % | 0.2 |
| −9 | ×3.20 | 0 % | 0 % | 0.2 |
| −10 | ×3.38 | 0 % | 0 % | 0.1 |
| −11 | ×3.60 | 0 % | 0 % | 0.0 |
| −12 | ×3.85 | 0 % | 0 % | 0.0 |

## Le parcours d'un joueur

Une partie entière, jouée par le joueur moyen pendant 45 jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.

| Strate | Occasionnel (2 expéditions par jour) | Assidu (5 expéditions par jour) |
|---|---|---|
| −2 | jour 1 (1 exp.) | jour 1 (1 exp.) |
| −3 | jour 3 (4 exp.) | jour 2 (4 exp.) |
| −4 | jour 5 (3 exp.) | jour 3 (5 exp.) |
| −5 | jour 7 (4 exp.) | jour 4 (8 exp.) |
| −6 | jour 9 (6 exp.) | jour 7 (11 exp.) |
| −7 | jour 14 (8 exp.) | jour 8 (6 exp.) |
| −8 | jour 19 (12 exp.) | jour 10 (14 exp.) |
| −9 | jour 26 (8 exp.) | jour 14 (15 exp.) |
| −10 | jour 30 (11 exp.) | jour 18 (23 exp.) |
| −11 | jour 38 (12 exp.) | jour 21 (15 exp.) |
| −12 | jour 45 (22 exp.) | jour 26 (25 exp.) |
| −13 | — | jour 30 (22 exp.) |
| −14 | — | jour 35 (24 exp.) |
| −15 | — | jour 41 (30 exp.) |

Victoires au front : Occasionnel 45 % · Assidu 35 %.
