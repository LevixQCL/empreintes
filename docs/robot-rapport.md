# Rapport du robot d'équilibrage

2026-10-21 · 200 expéditions par mesure · 404 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 100 % |
| −5 | 100 % |
| −6 | 99 % |
| −7 | 97 % |
| −8 | 83 % |
| −9 | 68 % |
| −10 | 60 % |
| −11 | 55 % |
| −12 | 41 % |
| −13 | 32 % |
| −14 | 12 % |

Strate de référence pour les cartes : **−11** (le deck de départ y gagne 53 % des expéditions).

## Ce que vaut chaque carte

Chaque carte est greffée en plus sur le Porteur de sa lignée (pour les 3 cartes de départ : ce qu'on perd en la retirant). Les chiffres sont des points de victoire à la Strate −11 (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | — | +10 | +5 | TROP FORTE |
| Gant à arc | Fer | — | −10 | +6 | trop faible |
| Œil-relais | Fer | — | +1 | +16 |  |
| Cœur-turbine | Cuivre | Surcharge | −3 | +23 | trop faible |
| Bras-grue | Argent | Perçant, Élan, Surcharge | +1 | +33 |  |
| Lames orbitales | Or | Perçant, Élan, Crescendo | +8 | +35 |  |
| Glande d’ambre | Fer | — | +37 | +43 | TROP FORTE |
| Crocs fossiles | Fer | — | −9 | −6 | trop faible |
| Cuir de récif | Fer | — | −6 | +21 |  |
| Poumons d’abysse | Cuivre | Rempart | +8 | +24 | TROP FORTE |
| Carapace-mère | Argent | Rempart, Fissure, Vague | +10 | +26 |  |
| Cœur de meute | Or | Fissure, Siphon, Vague | +16 | +29 |  |
| Éclat qui chante | Fer | — | +4 | +7 |  |
| Miroir de brume | Fer | — | −1 | −2 |  |
| Encre ancienne | Fer | — | −5 | +2 |  |
| Plume de givre | Cuivre | Désarmer | −6 | +4 | trop faible |
| Ombre ailée | Argent | Accord, Fissure, Vague | +4 | +10 |  |
| Chant des abysses | Or | Accord, Siphon, Désarmer | +8 | +24 |  |

Moyenne par rareté, à la découverte : Fer +2 · Cuivre −0 · Argent +5 · Or +11. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.

## Deck de départ : 3 cartes ou 6 cartes

| Strate | 3 cartes (actuel) | 6 cartes (document Économie) |
|---|---|---|
| −2 | 100 % | 100 % |
| −4 | 100 % | 100 % |
| −9 | 65 % | 65 % |
| −11 | 53 % | 43 % |
