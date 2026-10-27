# Le Legs du district : proposition (27 octobre 2026)

Rien n'est codé. Idée de Bryan : une dizaine de cartes en nacre, exclusives, qu'on ne peut utiliser qu'après avoir progressé.
Le but : donner envie de jouer pour enfin la porter.

> **Correction de Bryan (27 octobre 2026) : chaque joueur ne reçoit qu'UNE seule des dix cartes**, pour que tout le monde n'ait pas
> la même. Les sections 1 à 5 ci-dessous décrivaient dix cartes pour chacun : ce qui change est résumé en section 0.

## 0. Une seule carte par joueur : ce qui change

- **Le Legs devient une identité** : « tu as eu laquelle ? ». Il se voit dans la garnison (pillages) et pourra s'afficher au Grand Tableau.
- **Les dix doivent se valoir** : plus question d'en avoir une « meilleure ». Chacune est la pièce maîtresse d'une voie, réglée au
  robot pour que l'écart entre la plus forte et la plus faible reste petit (quelques points).
- **Le sceau, c'est le niveau du Porteur qui la porte** (Bryan : le joueur n'a pas de niveau, ses Porteurs si). Elle ne se confie qu'à
  un Porteur **de sa lignée** et **de niveau 8 au moins**. Elle grandit ensuite avec lui (« la vierge apprend son porteur ») :

  | Porteur | Le Legs | Joueur occasionnel | Joueur assidu |
  |---|---|---|---|
  | niveau 8 | se porte, niveau 8 | vers le jour 7-8 | vers le jour 5 |
  | niveau 12 | niveau 9 | vers le jour 22 | vers le jour 10 |
  | niveau 15 | niveau 10 | vers le jour 32 | vers le jour 15 |

  (Jours mesurés au parcours simulé, 6 parties par profil : le niveau du Porteur le plus avancé de l'escouade. Un Porteur en retard
  rattrape vite : il apprend 1,5 fois plus vite à deux niveaux d'écart.)
  Dès le départ, la carte est **visible** avec sa fiche complète, et l'écran montre la progression : « Doran niveau 5 / 8 ».
  Le joueur sait quel Porteur faire monter : c'est l'envie de jouer.
- **« Un seul Legs par Porteur » disparaît** (il n'y en a qu'un) ; la carte reste liée à sa lignée et pèse sa Charge.
- **Reste à décider : comment le joueur reçoit la sienne** (voir le message de Claude).

## 1. L'histoire

Les cartes en nacre sont des **vierges** : jamais portées par un humain, sorties d'un Berceau. Les Hauts (la Maison Orsève) vident
les Berceaux et les gardent pour eux (« le Registre des Vierges »).

**L'ancienne directrice du district en a caché dix.** Avant de partir, elle les a scellées dans un coffre, sous la Tour du Noyau :
**le Legs**. Une vierge ne se laisse pas porter par n'importe qui. Chaque sceau ne cède que lorsque le district a prouvé quelque
chose : descendre assez profond, tenir ses bâtiments, gagner la confiance des siens. À chaque sceau brisé, une lettre de la
directrice explique pourquoi elle a choisi cette carte pour ce moment.

C'est cohérent avec le lore (les vierges, les Hauts qui les accaparent) et ça donne une raison concrète au verrou : ce n'est
pas une règle de jeu arbitraire, c'est la carte qui choisit son moment.

## 2. Ce que voit le joueur

- **Dès le premier jour**, après la chambre scellée : une scène courte, le coffre du Legs s'ouvre et montre les **dix cartes,
  toutes visibles mais scellées**. Chacune affiche son sceau en clair (« Ouvre la Strate −5 ») et sa progression (« −3 / −5 »).
- **Un écran du Legs** (depuis la Tour du Noyau) : les dix cartes en grand, de la plus proche à la plus lointaine. Toucher une
  carte montre ce qu'elle fera, son sceau et la lettre de la directrice une fois ouverte.
- **Quand un sceau cède** : une notification, une petite scène (le sceau de nacre se fend), la lettre, et la carte entre dans
  la collection.
- Le plus proche sceau est rappelé sur la Tour du Noyau (« Prochain Legs : plus qu'une Strate »). C'est l'envie de rejouer.

## 3. Pourquoi elles sortent du lot

- **Les seules cartes à deux effets.** Toutes les autres cartes n'en ont qu'un : on les reconnaît immédiatement.
- **En nacre** : 3 Fréquences, effets renforcés (comme toute nacre).
- **Introuvables ailleurs** : jamais dans les trouvailles, le Comptoir, la Forge ou les choix de boss.
- **Une apparence à part** : le cadre de nacre avec un liseré propre au Legs, et un sceau de cire sur la carte tant qu'elle est
  scellée.
- **Elles progressent avec leur Porteur** : pas de doublons possibles (elles sont uniques). Elles arrivent au niveau 8 et
  montent aux niveaux 9 et 10 en gagnant des combats avec elles (« la vierge apprend son porteur »).

## 4. Garde-fous (équilibrage)

- **Un seul Legs par Porteur** : au plus 3 dans une escouade. On ne peut pas empiler toute la puissance dans un deck.
- **Elles pèsent leur Charge**, comme les autres cartes. Il faut un Porteur assez fort pour les porter avec 5 autres cartes.
- **Réglées au robot** : visées un peu au-dessus des meilleures cartes en or (environ +5 à +10 points), pas plus. Une carte du Legs
  doit être un plaisir, pas une obligation qui rend le reste de la collection inutile.
- **Tout le monde a les mêmes dix**, gagnées en jouant : rien à acheter, aucun hasard. Dans les pillages, c'est équitable.
- **Aucune date limite** : un sceau attend le joueur, aussi longtemps qu'il faut.

## 5. Les dix cartes

Une par Porteur nommé, pièce maîtresse de sa voie (`docs/familles-de-decks.md`), plus une carte du district.
Elles n'utilisent que des effets **qui existent déjà** : on peut les coder sans attendre les étapes 2 et 3 des voies.
Les sceaux suivent l'ordre d'arrivée des Porteurs et s'étalent sur le premier mois (jours estimés pour un joueur occasionnel,
d'après le parcours simulé du robot ; les sceaux qui ne dépendent pas d'une Strate sont à caler au robot).

| # | Carte | Porteur · voie | Action | Fréq. | Effets | Sceau | Vers le jour |
|---|---|---|---|---|---|---|---|
| 1 | **Foulée de la directrice** | Ilka · Cadence | attaque 16 | 4 · 3 · 5 | Élan + Crescendo | Ouvre la Strate −3 | 3 |
| 2 | **Carapace des Fondations** | Doran · Carapace | bouclier 24 | 2 · 3 · 1 | Rempart + Riposte | Tour du Noyau niveau 2 | 4-5 |
| 3 | **Lanterne de la première Lecture** | Véla · Harmonie | attaque 20 | 8 · 7 · 9 | Accord + Désarmer | Ouvre la Strate −5 | 6 |
| 4 | **Bras de la Fonderie** | Sasha · Machines | attaque 44 (lourde) | 5 · 6 · 4 | Perçant + Élan | Forge niveau 3 | à caler |
| 5 | **Œil de la Grande Nuit** | Nuit · Traque | attaque 18 | 3 · 2 · 4 | Fissure + Siphon | Un Porteur au niveau 10 | à caler |
| 6 | **Première mue** | Kessa · Sève | soin 14 | 1 · 2 · 3 | Vague + Rempart | Ouvre la Strate −6 | 13 |
| 7 | **Sceau volé aux Orsève** | Aurel · Lecture | attaque 18 | 7 · 6 · 8 | Désarmer + Fissure | Vaincre 6 gardiens | à caler |
| 8 | **Cœur de la Glacière** | Liane · Moteur | attaque 20 | 6 · 5 · 7 | Décharge + Surcharge | Ouvre la Strate −8 | 21 |
| 9 | **Voix du quartier** | Joss · Chœur | attaque 14 | 9 · 8 · 7 | Diapason + Unisson | Confiance du district à 90 | à caler |
| 10 | **Clé du Legs** | le district | bouclier 18 | libre | Accord + Rempart | Vaincre le Premier Porteur (−10) | 32 |

Quelques combinaisons qui font leur attrait :
- **Cœur de la Glacière** vide le Flux pour frapper, puis le remplit aussitôt (+2) : le Moteur tourne tout seul.
  C'est aussi le lien avec la Glacière, qui « attend » justement à la Strate −8.
- **Voix du quartier** reprend la Fréquence d'avant **et** gagne l'Unisson : elle fait toujours une paire, avec n'importe quelle carte.
- **Carapace des Fondations** garde le bouclier d'un tour à l'autre, puis frappe avec : la Carapace en une seule carte.
- **Clé du Legs** rejoint le paquetage du district : jouée par personne, elle reste quand un Porteur tombe. C'est la récompense de
  la fin de la campagne.

## 6. Ce que ça demande

- **Moteur** : un second effet par carte (`effet2`, appliqué après le premier). C'est le seul vrai changement de règles.
- **Données** : les 10 cartes et leurs sceaux (`LEGS` dans `donnees.ts`), les sceaux vérifiés à chaque tick comme les fils et les Marques.
- **Collection** : un Legs ne tombe jamais ailleurs, ne se recycle pas, ne se refabrique pas ; « un seul Legs par Porteur » au moment de confier.
- **Écrans** : la scène du coffre, l'écran du Legs, le sceau sur la carte, la notification.
- **Images** : 10 illustrations (je fais les prompts : nacre et lumière de la lignée, un sceau de cire comme détail commun) et
  10 lettres de la directrice.
- **Robot** : mesurer chaque Legs comme une carte, et le parcours complet pour vérifier que le premier mois ne devient pas trop facile.
