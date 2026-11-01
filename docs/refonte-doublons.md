# Refonte des quasi-doublons

1er novembre 2026. Luc a remarqué en jeu que plusieurs cartes « sont quasiment des doublons » (capture : Noyau instable, Décharge d’arc, Gant à arc).
Bryan a tranché : **on ne supprime aucune carte** (chacune a son image et son lore), on refond celles qui font la même chose qu’une autre en plus gros.

## Le principe

Le métal augmente déjà la force d’une carte. Une « grande sœur » qui porte le même effet avec un pourcentage un peu plus haut fait donc doublon avec une montée de niveau.
Une carte refondue garde son nom, son image, sa lignée et son rôle ; elle change d’effet (ou de Fréquences) pour donner au joueur **une autre décision à prendre**.
Les nouveaux effets restent dans le rôle de leur lignée (Augmentés frappent, Génés tiennent, Résonants orchestrent et affaiblissent) et ne s’ajoutent pas aux règles générales : une seule phrase, sur la carte.

## Lot 1 (1er novembre 2026)

| Carte | Avant | Après | La décision qu’elle apporte |
|---|---|---|---|
| Décharge d’arc (cuivre) | Décharge +50 % | inchangée | la Décharge de référence : tout vider d’un coup |
| Éclair captif (argent) | Décharge +55 % | **ne prend qu’1 Flux : +90 %**, garde le reste | frapper fort sans renoncer au Coup d’éclat ni à la place en plus |
| Noyau instable (or, lourde) | Décharge +65 % | Décharge +65 %, **et s’il trouve le Flux vide, le remplit (+2)** | jamais une carte morte : elle vide ou elle prépare |
| Gant à arc (fer) | Surcharge | inchangé | il remplit le Flux que les Décharges vident |
| Cœur-turbine (cuivre) | Surcharge, Fréquences 7-6-8 (celles du Gant à arc) | **Élan**, Fréquences 8-7-6 | une attaque de cuivre qui allonge la chaîne suivante |
| Éclat qui chante (fer, départ de Véla) | Crescendo, Fréquences 8-7-9 (celles d’Éclat) | **Diapason** (attaque), Fréquences 7-9-8 | reprendre la note d’avant pour faire un Écho |
| Voile du murmure (fer) | Désarmer 30 % | inchangé | casser une attaque annoncée |
| Miroir de brume (fer) | Désarmer 30 % | **Amorce 50 %** (nouvel effet) | préparer la carte d’après : la poser juste avant la plus forte |
| Mèche d’or (fer) | Désarmer 30 % | **Lecture** (force 8 → 9) | briser la Fêlure sans chercher sa Fréquence |
| Sablier inversé (argent) | Désarmer 40 % (le double de Plume de givre) | **Sourdine 40 %** (nouvel effet), Fréquences 6-8-7 | affaiblir aussi un bouclier ou un soin annoncé |
| Plume de givre (cuivre) | Désarmer 40 % | inchangée | le gros Désarmer |
| Branchies des Fondations (cuivre) | bouclier Rempart (comme Poumons d’abysse) | **soin Vague**, force 7 | le seul soin de groupe en cuivre |
| Cuir de récif (fer) | bouclier Rempart (comme Carapace) | **bouclier Riposte 40 %** | qui la frappe s’y écorche |
| Jambes à ressort (fer, départ d’Ilka) | Fréquences 4-5-3 (celles de Talon de cristal) | Fréquences **7-8-6** | Ilka couvre maintenant les Fréquences 2 à 7 dès le départ |

Le lore de chaque carte refondue a été ajusté d’une phrase pour coller à son effet.

### Les deux nouveaux effets

- **Sourdine** (Résonants) : l’ennemi visé perd une part de ce qu’il prépare, quoi que ce soit (attaque, bouclier ou soin). Moins fort que Désarmer contre une attaque, utile quand Désarmer ne ferait rien.
- **Amorce** (Résonants) : la carte posée juste après elle gagne une part de force. Pas de chiffre à suivre, juste un ordre de pose.

## Mesure au robot

Chaque carte remplace une carte de départ de sa lignée, Strate −3 explorée en entier, ennemis réglés pour que le deck de départ gagne une fois sur deux.
Points de victoire par rapport au deck de départ (+10 = une descente gagnée de plus sur dix) ; 100 descentes par carte (bruit d’environ ±8 points), 300 pour celles marquées ∗.

| Carte | Avant | Après |
|---|---|---|
| Décharge d’arc (inchangée) | −4 | −5 |
| Éclair captif | −11 | +7 (∗ +4) |
| Noyau instable | −9 | +7 (∗ +3) |
| Gant à arc (inchangé) | +0 | −4 |
| Cœur-turbine | +9 | +7 |
| Miroir de brume | −5 | ∗ −1 |
| Mèche d’or | +2 | −4 |
| Sablier inversé | +16 | ∗ +7 (Sourdine 35 %, puis 40 %) |
| Branchies des Fondations | +3 | +7 (∗ +3) |
| Cuir de récif | +4 | +0 |

Le Moteur (Éclair captif, Noyau instable) était la voie la plus faible ; ses deux grandes cartes passent enfin au-dessus de la Décharge d’arc.
Le Sablier inversé, qui était presque une carte « trop forte », revient dans la moyenne de l’argent. Une Amorce à 40 puis 80 % sur le Sablier
restait sans effet mesurable (+0, +3) : elle va mieux à une carte de fer, le Miroir de brume.

## Pour les lots suivants

- **Lot 2 : cartes de départ et cartes de fer trouvées.** Plusieurs cartes de fer trouvées tôt font encore la même chose qu’une carte de départ, en plus fort :
  Plastron de choc / Canon à cristal / Œil-relais (Perçant), Talon de cristal / Jambes à ressort / Pas chassé (Élan), Pistolet à faisceau / Gant à arc (Surcharge),
  Bracelet de déviation / Grappin à câble (bouclier Élan), Bol de sève / Glande d’ambre (Vague), Front de roche / Yeux nocturnes (Fissure), Cor de brume / Encre ancienne (Fissure).
  `tests/doublons.test.ts` en tient la liste : chaque refonte la raccourcit, et aucune nouvelle paire ne peut apparaître sans faire échouer le test.
- **Lot 3 : les familles des voies.** Riposte, Curée, Faille, Débord, Rafale et Unisson ont chacune 4 ou 5 cartes du même effet, de plus en plus fort.
  Règle proposée : la carte de fer garde l’effet simple, celle d’argent y ajoute une variante, celle d’or une condition qui lui est propre. Une famille à la fois, mesurée au robot.
