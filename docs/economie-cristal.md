# Économie à cristal unique (9 novembre 2026)

Décision de Bryan : l'énergie et les composants sont remplacés par **un seul cristal raffiné**, plus les Éclats.
Fiche relue par un game designer avant le code, puis réglée au robot.

## Pourquoi

- L'énergie était un stock passif plafonné : 39 % de la production perdue réserve pleine, même pour le robot qui dépense au mieux.
- Ses prix suivaient la production du Générateur (×41 entre les niveaux 1 et 10) : rien ne devenait jamais rare.
- Deux monnaies faisaient le même travail (plus de 1 100 composants en main au jour 10) ; onze dépenses d'énergie avaient été
  ajoutées en rustines (convertisseur, cristallisation, jetons, soins…) sans créer de vrais choix.

## Les trois matières

| Matière (code) | Lore | Comment on l'a | À quoi elle sert |
|---|---|---|---|
| **Minerai** (`Jeu.composants`) | la pierre bleue arrachée aux Strates et aux ruines, encore prise dans sa gangue | **en jouant** : descentes, fouilles, missions en mer, marées, pillages, Basses, doublons recyclés, duels | rien avant d'être taillé ; c'est aussi le seul « coffre » qu'un pillage peut prendre |
| **Cristaux** (`Jeu.energie`) | la pierre bleue taillée, qui tient le courant du district | le **Générateur taille** le minerai ; les **récompenses** arrivent déjà taillées (colis, Butin, objectifs, parrainage, gardiens, Flèche) | **tout** |
| **Éclats** | fragments chargés d'empreintes, rares | gardiens, étoiles, caches, Butin, **recueillis par le Générateur en taillant**, achetés au Comptoir | grands paliers, métaux rares |

Pour le joueur, une seule règle : *on rapporte du minerai en jouant, le Générateur le taille, les cristaux paient tout.*
La barre du haut montre les cristaux (et « ⛏ +N » quand du minerai attend) et les Éclats.

## Le Générateur taille, il ne remplit plus

- Chaque heure, il taille une part du minerai qui attend : 1/16 au niveau 1 … 1/4 au niveau 10 (`DISTRICT.tailleHeures`),
  et au moins son plancher (10 … 80 cristaux/h, `DISTRICT.taillePlancher`). Un Augmenté posté dessus va deux fois plus vite.
- Rien ne se perd, pas de réserve, pas de plafond ; pendant l'absence il finit ce qui reste.
- Il ne crée rien : sans minerai, il attend. Il ne freine jamais celui qui joue beaucoup (relu par le game designer).
- En taillant, il recueille un Éclat tous les 300 cristaux, au plus 1 à 3 par jour dès le niveau 4 (`DISTRICT.eclatsParJour`) :
  remplace la cristallisation.

## Les prix (tout en cristaux, aucun ne suit plus le Générateur)

| Dépense | Prix |
|---|---|
| Bâtiments | composants d'avant + énergie ÷ 40 (+ Éclats inchangés) : l'énergie ne freinait pas les chantiers |
| Forge | 27 / 81 / 215 / 535 / 1 330 selon le métal (+ Éclats inchangés) |
| Niveau de carte, cartes du Comptoir, échanges du Cercle | même chiffre qu'avant en composants |
| Éclat au Comptoir | 300, 450 puis 650 (avant 500 / 700 / 1 000 composants) |
| Séance à la Tour | 0,6 × niveau^1,8, au moins 5 |
| Soins intensifs | 1 cristal par point d'Usure |
| Cartes du Râtelier | 10 par exploration, 5 par sortie courte |
| Jeton de pillage | 30 (2 par jour au plus) |
| Missions en mer, marées, secours des familles | **gratuites** : le prix, c'est le temps et le Porteur immobilisé |
| Convertisseur, cristallisation | **supprimés** |

## Anciennes sauvegardes (version 10)

Composants → minerai 1 pour 1 (taillé dans la journée) ; énergie → cristaux ÷ 20 ; séances déjà payées remboursables ÷ 20
(pas d'exploit) ; compteurs du convertisseur et de la cristallisation effacés.

## Mesures au robot (joueur occasionnel moyen)

| | Avant | Après |
|---|---|---|
| Strate −10 (médiane de 32 parties) | jour 30, 3 parties bloquées avant le jour 40 | jour 31, 2 bloquées |
| Ressource perdue | 39 % de l'énergie | 0 |
| Monnaie en main | 1 100 à 2 700 composants qui dorment | 340 à 900 cristaux, dépensés au fil de l'eau |
| Attente du minerai à la session suivante | — | 5 h en médiane, 8 h au pire |

## Reste à faire

- Icônes peintes des cristaux et du minerai : prompts dans `docs/prompts-cristaux.md`.
- Les Éclats s'empilent encore chez l'assidu après −10 : leur trouver une vraie dépense de fin de jeu.
