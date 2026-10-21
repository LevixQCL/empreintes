# Rapport du robot d'équilibrage

2026-10-21 · 200 expéditions par mesure · 386 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

## Le deck de départ selon la profondeur

| Strate | Victoire |
|---|---|
| −1 | 100 % |
| −2 | 100 % |
| −3 | 100 % |
| −4 | 100 % |
| −5 | 100 % |
| −6 | 98 % |
| −7 | 63 % |
| −8 | 48 % |
| −9 | 23 % |

Strate de référence pour les cartes : **−8** (le deck de départ y gagne 41 % des expéditions).

## Ce que vaut chaque carte

Chaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. Les chiffres sont des points de victoire à la Strate −8 (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.

| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |
|---|---|---|---|---|---|
| Jambes à ressort | Fer | Élan | +0 | +0 |  |
| Gant à arc | Fer | Surcharge | +5 | +3 |  |
| Œil-relais | Fer | Perçant | +3 | −1 |  |
| Grappin à câble | Fer | Élan | +12 | +3 |  |
| Cœur-turbine | Cuivre | Surcharge | +10 | +3 |  |
| Œil-brouilleur | Cuivre | Désarmer | +12 | +4 |  |
| Bras-grue | Argent | Perçant | +0 | +0 | trop faible |
| Dorsale renforcée | Argent | Élan | +15 | +4 |  |
| Lames orbitales | Or | Crescendo | +10 | +4 |  |
| Cœur de reprise | Or | Perçant | +12 | +0 |  |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −3 | −2 |  |
| Cuir de récif | Fer | Rempart | +0 | −1 |  |
| Yeux nocturnes | Fer | Fissure | −1 | −3 |  |
| Poumons d’abysse | Cuivre | Rempart | +1 | −1 |  |
| Branchies des Fondations | Cuivre | Rempart | +3 | +0 |  |
| Carapace-mère | Argent | Rempart | +5 | +1 | trop faible |
| Sang d’ambre | Argent | Vague | +15 | +3 |  |
| Cœur de meute | Or | Siphon | +13 | +1 |  |
| Mue totale | Or | Vague | +12 | +2 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +10 | +3 |  |
| Encre ancienne | Fer | Fissure | +9 | +1 |  |
| Mèche d’or | Fer | Désarmer | +12 | +3 |  |
| Plume de givre | Cuivre | Désarmer | +17 | +3 | TROP FORTE |
| Ombre de serpent | Cuivre | Fissure | +10 | +2 |  |
| Ombre ailée | Argent | Fissure | +10 | +1 |  |
| Pressentiment | Argent | Désarmer | +16 | +5 |  |
| Chant des abysses | Or | Accord | +13 | +1 |  |
| Souffle du wyrm | Or | Crescendo | +20 | +1 |  |

Moyenne par rareté, à la découverte : Fer +4 · Cuivre +9 · Argent +10 · Or +13. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


## Exploration (deck de départ)

La descente salle par salle, jouée par le robot jusqu'au gardien.

| Strate | Victoire | Combats gagnés en moyenne |
|---|---|---|
| −1 | 100 % | 3.9 |
| −3 | 100 % | 3.9 |
| −5 | 88 % | 3.7 |
| −7 | 42 % | 2.8 |
| −9 | 18 % | 2.0 |
| −11 | 0 % | 1.5 |
