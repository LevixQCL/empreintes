# Rapport du robot d'équilibrage

2026-10-21 · 200 expéditions par mesure · 389 s de calcul. Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.

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
| Gant à arc | Fer | Surcharge | −2 | +1 |  |
| Œil-relais | Fer | Perçant | +1 | −2 |  |
| Grappin à câble | Fer | Élan | +3 | −2 |  |
| Cœur-turbine | Cuivre | Surcharge | +3 | +1 |  |
| Œil-brouilleur | Cuivre | Désarmer | +11 | +4 |  |
| Bras-grue | Argent | Perçant | −0 | −2 | trop faible |
| Dorsale renforcée | Argent | Élan | +16 | +4 |  |
| Lames orbitales | Or | Crescendo | +12 | +3 |  |
| Cœur de reprise | Or | Perçant | +5 | +0 | trop faible |
| Glande d’ambre | Fer | Vague | +0 | +0 |  |
| Crocs fossiles | Fer | Siphon | −14 | −11 | trop faible |
| Cuir de récif | Fer | Rempart | −7 | −1 |  |
| Yeux nocturnes | Fer | Fissure | −13 | −9 | trop faible |
| Poumons d’abysse | Cuivre | Rempart | +0 | −4 |  |
| Branchies des Fondations | Cuivre | Rempart | +2 | −1 |  |
| Carapace-mère | Argent | Rempart | +4 | +1 |  |
| Sang d’ambre | Argent | Vague | +9 | +3 |  |
| Cœur de meute | Or | Siphon | +15 | +3 |  |
| Mue totale | Or | Vague | +18 | +2 |  |
| Éclat qui chante | Fer | Crescendo | +0 | +0 |  |
| Miroir de brume | Fer | Désarmer | +7 | +2 | TROP FORTE |
| Encre ancienne | Fer | Fissure | +0 | +0 |  |
| Mèche d’or | Fer | Désarmer | +5 | +1 |  |
| Plume de givre | Cuivre | Désarmer | +7 | +4 |  |
| Ombre de serpent | Cuivre | Fissure | +6 | +1 |  |
| Ombre ailée | Argent | Fissure | +10 | +0 |  |
| Pressentiment | Argent | Désarmer | +18 | +5 | TROP FORTE |
| Chant des abysses | Or | Accord | +13 | +1 |  |
| Souffle du wyrm | Or | Crescendo | +16 | −1 |  |

Moyenne par rareté, à la découverte : Fer −2 · Cuivre +5 · Argent +9 · Or +13. Une carte est signalée quand elle s'écarte de plus de 8 points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.


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
