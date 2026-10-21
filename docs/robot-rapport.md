# Rapport du robot d'équilibrage

2026-10-21 · 200 expéditions par mesure · 438 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 100 % |
| −5 | 100 % |
| −6 | 100 % |
| −7 | 93 % |
| −8 | 76 % |
| −9 | 65 % |
| −10 | 42 % |
| −11 | 47 % |
| −12 | 51 % |
| −13 | 33 % |
| −14 | 22 % |

Strate de référence pour les cartes : **−12** (le deck de départ y gagne 44 % des expéditions).

## Ce que vaut chaque carte

Chaque carte est greffée en plus sur le Porteur de sa lignée (pour les 3 cartes de départ : ce qu'on perd en la retirant). Les chiffres sont des points de victoire à la Strate −12 (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | — | +2 | +9 |  |
| Gant à arc | Fer | — | +3 | +6 |  |
| Œil-relais | Fer | — | +4 | +12 |  |
| Cœur-turbine | Cuivre | Surcharge | +2 | +21 |  |
| Bras-grue | Argent | Perçant, Élan, Surcharge | +4 | +24 |  |
| Lames orbitales | Or | Perçant, Élan, Crescendo | +1 | +10 |  |
| Glande d’ambre | Fer | — | +41 | +48 | TROP FORTE |
| Crocs fossiles | Fer | — | −11 | −3 | trop faible |
| Cuir de récif | Fer | — | −2 | +9 |  |
| Poumons d’abysse | Cuivre | Rempart | +16 | +25 | TROP FORTE |
| Carapace-mère | Argent | Rempart, Fissure, Vague | +1 | +21 | trop faible |
| Cœur de meute | Or | Fissure, Siphon, Vague | +16 | +25 | TROP FORTE |
| Éclat qui chante | Fer | — | −2 | +2 |  |
| Miroir de brume | Fer | — | −4 | +0 |  |
| Encre ancienne | Fer | — | −2 | −1 |  |
| Plume de givre | Cuivre | Désarmer | +4 | +6 |  |
| Ombre ailée | Argent | Accord, Fissure, Vague | +3 | +9 | trop faible |
| Chant des abysses | Or | Accord, Crescendo, Désarmer | +4 | +0 |  |

Moyenne par rareté, à la découverte : Fer +3 · Cuivre +8 · Argent +3 · Or +7. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.

## Deck de départ : 3 cartes ou 6 cartes

| Strate | 3 cartes (actuel) | 6 cartes (document Économie) |
|---|---|---|
| −2 | 100 % | 100 % |
| −4 | 100 % | 100 % |
| −10 | 49 % | 53 % |
| −12 | 44 % | 34 % |
