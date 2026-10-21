# Rapport du robot d'équilibrage

2026-10-21 · 150 expéditions par mesure · 1583 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 100 % |
| −5 | 100 % |
| −6 | 98 % |
| −7 | 59 % |
| −8 | 49 % |
| −9 | 29 % |
| −10 | 0 % |

Strate de référence pour les cartes : **−8** (le deck de départ y gagne 50 % des expéditions).

## Ce que vaut chaque carte

Chaque carte est greffée en plus sur le Porteur de sa lignée (pour les 3 cartes de départ : ce qu'on perd en la retirant). Les chiffres sont des points de victoire à la Strate −8 (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | — | +1 | +9 |  |
| Gant à arc | Fer | — | +4 | +23 | TROP FORTE |
| Œil-relais | Fer | — | +10 | +23 | TROP FORTE |
| Cœur-turbine | Cuivre | Surcharge | +15 | +23 | TROP FORTE |
| Bras-grue | Argent | Perçant, Élan, Surcharge | +28 | +29 | TROP FORTE |
| Lames orbitales | Or | Perçant, Élan, Crescendo | +31 | +28 | TROP FORTE |
| Glande d’ambre | Fer | — | +32 | +33 | TROP FORTE |
| Crocs fossiles | Fer | — | −4 | +13 |  |
| Cuir de récif | Fer | — | −3 | +18 |  |
| Poumons d’abysse | Cuivre | Rempart | −29 | +15 | trop faible |
| Carapace-mère | Argent | Rempart, Fissure, Vague | +21 | +27 |  |
| Cœur de meute | Or | Fissure, Siphon, Vague | +34 | +29 | TROP FORTE |
| Éclat qui chante | Fer | — | +7 | +1 | TROP FORTE |
| Miroir de brume | Fer | — | −7 | +3 | trop faible |
| Encre ancienne | Fer | — | −2 | +11 |  |
| Plume de givre | Cuivre | Désarmer | +6 | +9 |  |
| Ombre ailée | Argent | Accord, Fissure, Vague | +17 | +23 |  |
| Chant des abysses | Or | Accord, Siphon, Désarmer | +31 | +26 | TROP FORTE |
| Grappin à câble | Fer | — | −6 | +23 | trop faible |
| Œil-brouilleur | Cuivre | — | +1 | +21 |  |
| Dorsale renforcée | Argent | — | +23 | +27 |  |
| Cœur de reprise | Or | — | +9 | +25 | trop faible |
| Yeux nocturnes | Fer | — | +1 | +17 |  |
| Branchies des Fondations | Cuivre | — | −1 | +19 |  |
| Sang d’ambre | Argent | — | +9 | +23 |  |
| Mue totale | Or | — | +17 | +24 |  |
| Mèche d’or | Fer | — | −3 | +6 |  |
| Ombre de serpent | Cuivre | — | −2 | +13 | trop faible |
| Pressentiment | Argent | — | +1 | +14 | trop faible |
| Souffle du wyrm | Or | — | +0 | +7 | trop faible |

Moyenne par rareté, à la découverte : Fer +3 · Cuivre −2 · Argent +16 · Or +20. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.

## Deck de départ : 3 cartes ou 6 cartes

| Strate | 3 cartes (actuel) | 6 cartes (document Économie) |
|---|---|---|
| −2 | 100 % | 100 % |
| −4 | 100 % | 100 % |
| −6 | 98 % | 100 % |
| −8 | 50 % | 57 % |

## Un Module dans les cinq métaux

Chaque Module (hors cartes de départ) greffé en plus, à la découverte, dans chaque métal. Réglages actuels : force Fer ×1, Cuivre ×1.18, Argent ×1.32, Or ×1.46, Nacre ×1.6 ; effets gardés Fer 0, Cuivre 1, Argent 2, Or 3, Nacre tous.

| Module | Métal d'origine | Fer | Cuivre | Argent | Or | Nacre |
|---|---|---|---|---|---|---|
| Gant à arc | Fer | +4 | +15 | +30 | +35 | +37 |
| Œil-relais | Fer | +10 | +14 | +28 | +31 | +29 |
| Cœur-turbine | Cuivre | −5 | +15 | +28 | +35 | +33 |
| Bras-grue | Argent | −1 | +13 | +21 | +31 | +35 |
| Lames orbitales | Or | +0 | −1 | +11 | +31 | +34 |
| Crocs fossiles | Fer | −4 | +3 | +17 | +18 | +26 |
| Cuir de récif | Fer | −3 | +11 | +23 | +23 | +33 |
| Poumons d’abysse | Cuivre | −42 | −29 | −13 | −7 | −7 |
| Carapace-mère | Argent | +3 | +4 | +24 | +23 | +31 |
| Cœur de meute | Or | +0 | +7 | +24 | +34 | +34 |
| Miroir de brume | Fer | −7 | +0 | +9 | +5 | +9 |
| Encre ancienne | Fer | −2 | −1 | +19 | +21 | +21 |
| Plume de givre | Cuivre | −12 | +6 | +9 | +16 | +24 |
| Ombre ailée | Argent | −3 | +13 | +14 | +23 | +28 |
| Chant des abysses | Or | −5 | −6 | +5 | +31 | +35 |
| Grappin à câble | Fer | −6 | +13 | +24 | +28 | +29 |
| Œil-brouilleur | Cuivre | −10 | +12 | +26 | +33 | +39 |
| Dorsale renforcée | Argent | +15 | +22 | +25 | +33 | +39 |
| Cœur de reprise | Or | +7 | +9 | +10 | +29 | +43 |
| Yeux nocturnes | Fer | +1 | +5 | +21 | +15 | +16 |
| Branchies des Fondations | Cuivre | −3 | +5 | +11 | +17 | +21 |
| Sang d’ambre | Argent | −32 | +21 | +23 | +29 | +29 |
| Mue totale | Or | −39 | −5 | +7 | +29 | +34 |
| Mèche d’or | Fer | −3 | +5 | +2 | +1 | +17 |
| Ombre de serpent | Cuivre | −7 | +5 | +6 | +7 | +9 |
| Pressentiment | Argent | −4 | −1 | +9 | +17 | +15 |
| Souffle du wyrm | Or | −8 | −2 | +9 | +24 | +27 |
| **Moyenne** | | **−6** | **+6** | **+16** | **+23** | **+27** |
