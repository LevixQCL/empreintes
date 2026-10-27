# La carte optimale : lecture et Midjourney (proposition du 27 octobre 2026)

Pourquoi : les illustrations sont bonnes, mais la carte se lit mal. Le cadre fait le tour de l'image, l'effet est écrit
à la verticale en 8 px, le nom est coupé (« Dorsale renforcé… »), les Fréquences multiples défilent une par une, et le
niveau a le même poids que ce qui compte en combat. Avec des combos en plus, ça devient illisible.

Maquette (téléphone, 390 px) : `docs/carte-optimale-maquette.jpg`. Elle reprend les vraies illustrations ; les pièces
de cadre y sont dessinées en CSS en attendant celles de Midjourney.

## Le panel

Cinq points de vue de game designers seniors, chacun avec sa règle :

| Rôle | Ce qu'il a imposé |
|---|---|
| Design de combat (systèmes) | La Fréquence et la valeur sont les deux seules infos dont on a besoin pour jouer : même ligne, même hauteur, un seul coup d'œil. |
| Lisibilité mobile (UX) | Trois distances de lecture : en main, en collection, en zoom. Chaque info a sa distance, rien n'apparaît à toutes. |
| Direction artistique | Le haut de la carte est à l'illustration. Le métal se voit sans rien lire. |
| Design de cartes (TCG) | Un « budget d'encre » fixe : 2 chiffres, 1 nom, 2 lignes de règle au plus. Au-delà, ça part au zoom. |
| Collection / économie | Le niveau et la lignée sont des infos de collection : une roue de niveau dans la couleur de la lignée, aucun mot. |

## Anatomie (révisée le 27 octobre : l'image n'est plus rognée)

Première version : un socle opaque sur le bas coupait la moitié de l'illustration (remarque de Bryan). Version retenue :
**l'illustration entière occupe toute la carte**, sans aucune coupe ; le texte se pose sur un voile de verre fumé
qui ne couvre que le quart du bas, et l'image reste visible à travers.

```
┌──────────────────────────╲   liseré fin du métal tout autour
│ ⬡6 ⬡7 ⬡5                  │   en haut à gauche : la Fréquence (les autres à sa droite, plus petites)
│     ILLUSTRATION ENTIÈRE  │
│     (format 5:7, rien de  │   0 → 75 % : aucune autre interface
│      coupé)               │
│━━━━━━━━━━━━━━━━━━━━━━ ⬢12 │   75 % : la couture, et la valeur (chiffre + icône de couleur)
│░◌ Apaiser░░░░░░░░░░░░░░░░░│
╲░◆ Vague  soigne tous░░░░░░│   voile de verre fumé : 2 lignes seulement
 ╲──────────────────────────┘
```

1. **L'image entière.** Le cadre n'est plus qu'un liseré de métal fin (1,6 % de la largeur) tout autour : il dit le métal
   (fer, cuivre, argent, or, nacre irisée) sans rien cacher. Le badge « Nouvelle » passe en haut à droite, petit.
2. **La Fréquence en haut à gauche** (choix de Bryan : c'est là qu'on la cherche, et elle reste visible quand les cartes
   se chevauchent). La principale en grand ; les autres à sa droite, en ligne et plus petites — **plus d'animation qui
   les fait défiler**. En combat, le cristal d'une carte qui prolonge ta suite s'allume : le combo se lit par la lumière.
   **La valeur en bas à droite**, au-dessus de la couture (une fine bande de cristal à 75 % de la hauteur) : le chiffre et une petite
   icône de couleur — épée rouge (attaque), écu bleu (bouclier), croix « + » verte (soin).
3. **Le voile : deux lignes, pas une de plus.** Dégradé de verre fumé flouté, donc toujours clair sur foncé quel que soit
   le métal ou l'image.
   - Ligne 1 : **la roue de niveau** puis le nom en entier. La roue a 10 crans (`COLLECTION.niveauMax`), remplis jusqu'au
     niveau de la carte, **dans la couleur de la lignée** : plus besoin d'écrire « NIV 8 » ni « RÉSONANT ». Au niveau max,
     la roue devient dorée. (Idée de Bryan.)
   - Ligne 2 : l'effet (icône + mot + formule courte), et « 2 PL. » au bout si la carte est lourde. Une carte avec un combo
     affiche à la place « Lien Géné +4 » ; l'effet passe au zoom.
4. **Formule courte de chaque effet** (15 signes au plus, la phrase entière va au zoom) :

   | Effet | Formule |
   |---|---|
   | Perçant | ignore bouclier |
   | Siphon | rend 30 % |
   | Surcharge | Flux +2 |
   | Désarmer | −30 % ennemi |
   | Fissure | +25 % dégâts |
   | Élan | +1 place |
   | Crescendo | +10 % / carte |
   | Accord | Fréquence libre |
   | Vague | soigne tous |
   | Rempart | garde 50 % |

   (les pourcentages viennent de la carte, comme aujourd'hui dans `texteEffet`)
5. **Règle pour les prochaines illustrations** : garder l'objet principal dans les trois quarts du haut, le dernier quart
   étant le plateau de l'établi. Les illustrations actuelles passent déjà (objet centré) ; on ajoute aux prompts
   `the object placed in the upper part of the image, the lower quarter is the plain surface of the workbench`.

## Les trois distances de lecture

| | En main (≈ 70 px) | Collection (≈ 170 px) | Zoom (appui long) |
|---|---|---|---|
| Fréquence(s) | la principale | toutes | toutes + « prend celle qui prolonge ta suite » |
| Valeur + forme de l'action | oui | oui | oui |
| Effet | l'icône seule | mot + formule | phrase entière |
| Combo (Lien) | l'icône seule | mot + gain | phrase entière |
| Nom, roue de niveau (couleur = lignée), lourd | non | oui | oui + « Niveau 8 / 10 · Résonant » en clair |

En main, le voile se réduit à la couture : il ne reste que l'image, les Fréquences et la valeur.

## Midjourney : abandonné pour le cadre (test du 27 octobre)

Le test de l'étape 0 n'est pas utilisable : cadres épais, intérieur texturé, perspective, couture mal placée. Les
socles peints actuels (éclat, écu, couronne de feuilles) ont aussi été écartés : trop imposants, ils écrasent l'image.

**Décision : la carte n'a plus besoin d'aucune image Midjourney en dehors de l'illustration.** Tout le reste est dessiné
par le code, net à toutes les tailles :
- le cadre dans la matière du métal (texture `public/art/metaux/`, 2,8 % de la largeur) ; **la Nacre n'a aucun cadre** (règle de Bryan) : l'image va jusqu'aux bords, le texte sur un voile
  sombre à peine irisé, et ses effets holographiques actuels suffisent à la reconnaître : on reconnaît le
  métal d'un coup d'œil ; son arête intérieure et la couture prennent la couleur de l'action (rouge attaque, bleu
  bouclier, vert soin) : on reconnaît l'action aussi (demande de Bryan : « les deux ») ;
- les Fréquences dans une capsule de verre fumé en haut à gauche (police Oxanium) : la principale en segment plein de sa
  couleur, les autres à sa droite, plus petites, soulignées de leur couleur ;
- le bas de la carte (sous le nom et l'effet) dans la même matière du métal, assombrie pour garder le texte lisible
  (demande de Bryan : le métal se lisait encore mal avec le seul cadre) ;
- la valeur dans une capsule de verre de la même famille, liseré de la couleur de l'action, icônes au trait
  (épée, écu, +) ; ancienne description : le chiffre seul, avec une petite icône de couleur posée à sa gauche — épée rouge (attaque), écu bleu
  (bouclier), croix « + » verte (soin) — sur une pastille de verre fumé, au-dessus de la couture à droite ;
- l'effet : une icône dorée au trait par effet, devant son nom en collection, et **en main une pastille dorée à gauche
  de la valeur** (demande de Bryan : on doit voir en main qu'une carte a un effet, et lequel). Icônes : Vague (deux
  vagues), Élan (double chevron), Surcharge (éclair), Perçant (flèche qui traverse une ligne) ; à dessiner : Siphon
  (flèche qui revient), Désarmer (lame brisée), Fissure (trait en zigzag), Crescendo (trois barres montantes),
  Accord (diapason), Rempart (créneaux) ; Lien (combo) : deux maillons ;
- la roue de niveau, le voile et ses deux lignes.

Proposition de Bryan (27 octobre) : demander seulement **une plaque fine en bas**, un rectangle qui intègre le symbole
de l'action à droite. Le code écrit le nom, l'effet et la valeur dessus. Test d'abord avec l'attaque :

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a single thin horizontal nameplate for a game card, flat front view, orthographic, perfectly straight and level, not tilted, no perspective, a long narrow rectangle with a very thin elegant polished gold rim and small cut corners, the inside is plain smooth dark smoked glass with no pattern, at the right end the rim widens into a small round gold socket holding {SYMBOLE}, the rest of the plate empty for text, crystal and light, icy edges, isolated on a pure flat black background, family-friendly, no text, no letters, no numbers --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, perspective, tilt, thick frame, pattern, person
```

| Action | `{SYMBOLE}` |
|---|---|
| attaque | `a small sharp red crystal blade emblem` |
| bouclier | `a small blue crystal shield emblem, no heraldry` |
| soin | `a small green crystal drop emblem with a tiny leaf` |

Midjourney reste réservé aux illustrations, avec la règle de composition du point 5.

## Ordre de travail

1. Bryan valide la maquette.
2. Je code la nouvelle face dans `src/ui/carte.ts` / `face-carte.css` (mêmes unités `cqw`, les trois distances par
   requêtes de conteneur), puis vérification au téléphone et sur PC, et `npm run visuel`.
