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

## Lot 2 (8 novembre 2026, audit du soir, arbitré par le game designer)

Une seule carte change par paire, avec un effet qui existe déjà ; force, Fréquences et action inchangées. Mesuré en cuivre (les cartes de fer n'ont pas d'effet en fer), à la place d'une carte de départ de leur lignée, 100 à 150 descentes (±7 points).

| Carte | Avant | Après | La décision qu’elle apporte | Robot |
|---|---|---|---|---|
| Cuir de récif (fer, bouclier) | Riposte 40 % (comme Queue-massue) | **Secours 50 %** | se poser quand un camarade est tombé | +23 → +21 |
| Grappin à câble (fer, bouclier) | Élan (comme Bracelet de déviation) | **Amorce 40 %** | protéger tout en préparant la carte d’après | +0 → −1 |
| Gant à arc (fer, attaque) | Surcharge (comme Pistolet à faisceau) | **Crescendo 25 %** | se garder pour la fin de la chaîne | +19 → +15 |
| Verdict (argent, attaque) | Faille 45 % (comme Lame de doute) | **Amorce 50 %** | préparer la Sentence de la voie Lecture | +7 → +12 |
| Crocs fossiles (fer, attaque) | Siphon 60 % (comme la Lamproie, et au-dessus du lot) | **Désarmer 30 %** | mordre l’arme avant le coup | +31 → +15 |
| Œil-relais (fer, attaque) | Perçant (le troisième Perçant de fer) | **Curée 50 %** | achever ce qui saigne déjà | +16 → +18 |

Restent comme elles sont : Queue-massue (Riposte de la voie Carapace), Bracelet de déviation (Élan, carte de départ), Pistolet à faisceau (Surcharge de fer), Lame de doute (Faille de la Lecture), la Lamproie (Siphon d’argent), Plastron de choc et Canon à cristal (Perçant, cartes de départ aux Fréquences 3 et 6). On garde les 112 cartes.

## Lot 3 (9-10 novembre 2026, remarque de Luc : « beaucoup de cartes mais beaucoup de ressemblance, c'est du remplissage »)

Audit complet des 112 cartes (Claude Docs : « Ossyra — Audit des cartes : quasi-doublons et niveaux »). Constat : 33 effets, et des
« escaliers » — le même effet de métal en métal avec un pourcentage un peu plus haut, ce que le métal fait déjà. Quatre principes :

1. **Préparer, puis profiter** : chaque voie a des cartes qui créent un état et des cartes qui le dépensent (la Traque gagne un
   deuxième préparateur : Crocs de verre fissure).
2. **Un pourcentage par effet** : Fissure 25 %, Troubler 30 %, Siphon 50 %, Rempart 50 %, Riposte 50 %, Curée 60 %, Unisson 120 %,
   Contrepoint 25 %, Crescendo 30 %, Amorce 50 %, Sourdine 35 %, Faille 50 %. Le métal fait le reste. `tests/doublons.test.ts` le vérifie
   (hors Héritage, Décharge, Surtension, cartes lourdes et cartes à prix).
3. **Deux mots-clés sur l'ordre de pose** : Ouverture (effet doublé si la carte ouvre la chaîne) et Final (si elle la ferme) ; un soin
   à mot-clé gagne +50 %. Le robot essaie désormais aussi l'ordre « Ouverture en tête, Final au bout ».
4. **Les grandes cartes ont un prix** : très fortes dans le bon deck, moins ailleurs. Leur « Puissance » (tri des cartes, deck du
   joueur simulé) compte ×0,7 : sans ça, le joueur simulé les prenait partout et n'ouvrait plus la Strate −10 (7 parcours sur 32
   bloqués, contre 0 après).

Mesure : `npm run refonte` (scripts/refonte.ts), chaque carte à la place de la carte de départ de sa lignée, dans son métal d'origine
(cuivre pour une carte de fer), Strate −3 entière, 120 descentes (bruit d'environ ±8 points). Deck de départ : 54 % de victoires.

| Carte | Avant | Après | Robot |
|---|---|---|---|
| Queue-massue (cuivre) | Riposte 60 % | Riposte 50 % | +23 → +18 |
| Bélier d’os (argent, lourde) | Riposte 60 %, force 16 | Riposte 50 %, **force 20** | +14 → +25 |
| Coquille de marée (or) | Riposte 65 % | **Riposte 130 %, puis vide le bouclier** | +35 → +24 |
| Œil-relais (fer) | Curée 50 % | Curée 60 % | +14 → +18 |
| Crocs de verre (cuivre) | Curée 60 % | **Fissure Final** (prépare la Curée du tour suivant) | +13 → +15 |
| Chasse à l’aveugle (argent) | Curée 70 % | **Curée 60 %, sinon +30 % quand même** | +22 → +27 |
| Hallali (or) | Curée 80 % | **Curée 200 %, seulement si fissuré ET sous la moitié** | +26 → +17 |
| Poings-pistons (cuivre) | Rafale | **Rafale dès 3 cartes** | +13 → +17 |
| Mitraille de clous (argent) | Rafale | **seconde salve sur tout le groupe** | +17 → +18 |
| Cadence folle (or) | Rafale | **un coup de plus par carte au-delà de 3 ; sous 4 cartes, demi-force** | +24 → +23 |
| Pas chassé (fer) | Élan | **Élan Final** (+2 places) | +15 → +18 |
| Sève des piliers (cuivre) | Débord | **Débord Ouverture** | +18 → +15 |
| Mue de verre (argent) | Débord | **Débord Final** | +17 → +13 |
| Floraison des Fondations (or) | Débord | **le soin en trop compte double en bouclier** | +23 → +21 |
| Chorale des ombres (cuivre) | Unisson 130 % | **Unisson Final** (120 %) | +13 → +19 |
| Grand unisson (or) | Unisson 140 % | **Unisson 250 %, seulement si toute la chaîne a la même Fréquence** | +28 → +28 |
| Cloche des abysses (argent) | Diapason | **reprend la Fréquence de la première carte** | +19 → +18 |
| Condensateur (cuivre) | Surcharge +1 | **Surcharge Ouverture** | +14 → +21 |
| Fil d’accord (argent) | Contrepoint 30 % | **Contrepoint Final** (25 %) | +12 → +15 |
| Nuée chorale (or) | Contrepoint 30 % | **Contrepoint 50 % ; sans les trois lignées, demi-force** | +18 → +18 |
| Œil du Lecteur (cuivre) | Lecture | **brise la Fêlure de tous les ennemis** | +13 → +13 |
| Flair (fer, bouclier) | Fissure 30 % | Fissure 25 % | +16 → +17 |
| Yeux nocturnes (fer) | Fissure 25 % | **Fissure Ouverture** | +16 → +10 |
| Ombre de serpent (cuivre) | Fissure 30 % | **Fissure 25 % sur tout le groupe** | +11 → +12 |
| Ombre ailée (argent, lourde) | Fissure 40 % | **Fissure 25 % pendant 3 tours** | +23 → +15 |
| Œil-brouilleur (cuivre) | Troubler 30 % | **chaque attaque du groupe −15 %** | +18 → +13 |
| Plume de givre (cuivre) | Troubler 40 % | **annule toute l’attaque annoncée, frappe à moitié** | +8 → +10 |
| Glande d’ambre (fer) | Vague | **Vague Ouverture** | +14 → +23 |
| Sang d’ambre (argent) | Vague | **Vague Final** | +18 → +24 |
| Cœur de reprise (or) | Perçant | **Secours 50 %** | +31 → +30 |
| Lamproie des piliers (argent) | Siphon 60 % | **Siphon 50 % ; le trop va au plus blessé** | +13 → +25 |
| Cœur de meute (or) | Siphon 50 % | **Siphon partagé entre toute l’escouade** | +24 → +26 |
| Poumons d’abysse (cuivre) | Rempart 40 % | **Rempart Final** (50 %) | +16 → +19 |
| Suture vive (cuivre, soin) | Rempart 40 % | Rempart 50 % | +13 → +13 |
| Carapace-mère (argent) | Rempart 75 % | **Rempart Ouverture** (50 %) | +16 → +17 |
| Souffle du wyrm (or) | Crescendo | **frappe aussi les autres ennemis, à moitié** | +19 → +26 |
| Gant à arc (fer) / Lames orbitales (or) | Crescendo 25 % | Crescendo 30 % | +8 → +13 / +23 → +26 |
| Grappin à câble (fer) | Amorce 40 % | Amorce 50 % | +1 → +2 |
| Sentence muette (or) | Faille 55 % | Faille 50 % | +22 → +18 |
| Sablier inversé (argent) | Sourdine 40 % | Sourdine 35 % | — |
| Empreinte vive (nacre) | Empreinte | **copie l’effet de la carte la plus forte de la chaîne** | +21 → +20 |

Essais écartés au robot : Glande d’ambre en Secours (+3), Mue totale, Floraison et Carapace-mère en cartes lourdes (le joueur simulé
n'ouvrait plus −10 avant le jour 35), Cadence folle et Nuée chorale à force nulle hors condition (−12 et +5), Plume de givre sans dégâts.

Restent assumées (listées dans le test) : cartes de départ aux Fréquences différentes, Riveteuse et Vérin (trous de métal), Mue totale
(la grande Vague d'or), les exclusives Rappel, et les paires tranchées aux lots 1 et 2. Le mode duel (`duel.ts`, pas encore branché)
lit les effets de base : il ignore pour l'instant mots-clés et variantes.
