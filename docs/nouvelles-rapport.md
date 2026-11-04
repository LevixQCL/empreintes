# Rapport des nouvelles cartes

2026-11-04 · `npm run nouvelles` (70 à 100 descentes par mesure) · Strate −3 entière, ennemis ×0,88 · deck de départ 56-57 %.

Chaque carte prend la place de la carte de départ de sa lignée, à son niveau de départ. Points de victoire par rapport au deck de
départ, comparés aux cartes de la même lignée et du même métal (en nacre : l’Héritage et les exclusives de la lignée).
Bruit de mesure : environ ±6 points.

| Carte | Métal | Effet | 1re mesure | Réglage | Mesure finale | Références (moyenne, plage) |
|---|---|---|---|---|---|---|
| Servo-bras | fer | Servo | +7 | — | +7 | +5 (−4 à +17) |
| Marteau-piston | fer | Troubler | +6 | — | +6 | +5 (−4 à +17) |
| Vérin hydraulique | cuivre | Servo | +13 | force 11 → 12 | +9 | +19 (+14 à +20) |
| Riveteuse | cuivre | Perçant | +16 | — | +16 | +19 (+14 à +20) |
| Suture vive | cuivre | Rempart | +17 | — | +17 | +15 (+10 à +21) |
| Contre-chant | cuivre | Contrepoint | +3 | force 11 → 12, 20 → 25 % | +10 | +10 (+6 à +14) |
| Exo de chantier | argent | Surcharge | +10 | force 30 → 33 | +9 | +17 (+7 à +27) |
| Lamproie des piliers | argent | Siphon | +29 | force 12 → 11 | +23 | +23 (+19 à +26) |
| Fil d’accord | argent | Contrepoint | +10 | 25 → 30 % | +11 | +14 (+1 à +23) |
| Foreuse des Strates | or | Élan | +27 (trop forte) | force 40 → 36 | +22 | +17 (+13 à +22) |
| Nuée chorale | or | Contrepoint | +22 | force 19 → 20 | +23 | +28 (+25 à +32) |
| Berceuse des Strates | or | Sourdine | +0 (soin 14) | soin 20 : +4 ; bouclier 20 : −1 ; **attaque** 20 : +32 → 19 | ≈ +30 | +28 (+25 à +32) |
| Couperet des Hauts | nacre | Exécution | +30 | — | +30 | +31 (+25 à +33) |
| Racines-mères | nacre | Ténacité | +22 | — | +22 | +24 (+16 à +34) |

Seule, une carte de voie est toujours sous-estimée : le Servo ne sert à rien sans carte lourde à côté, le Contrepoint sans suite
mêlée. D'où la mesure des voies entières (`npm run voies`, 100 descentes, mêmes conditions que `docs/voies-rapport.md`) :

| Voie | Métal | Deck classique | Deck de la voie | Écart |
|---|---|---|---|---|
| Les Machines | cuivre | 48 % | 43 % | −5 |
| Les Machines | or | 72 % | 83 % | +11 |
| L’Harmonie | cuivre | 74 % | 63 % | −11 |
| L’Harmonie | or | 77 % | 85 % | +8 |

Comme les autres voies (de −18 à +23 points) : faibles en cuivre, elles prennent leur sens en or. Aucune ne domine.

La Berceuse devait être le premier soin Résonant en or : en soin comme en bouclier, elle ne valait rien au robot (un Résonant
qui ne frappe pas affaiblit trop l’escouade, c’est le rôle des Génés de tenir). Elle devient une attaque qui endort (Sourdine).
