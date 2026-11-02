# Prompts Midjourney — la Cuvette (carte du district, 1er novembre 2026)

Piste « Cuvette » : le district est une place à sec, plus basse que la mer, dans une digue en anneau. Les pompes la gardent au sec.
La mer est faite en code, animée, autour de l'image : la Cuvette est donc peinte **sur fond uni** pour un détourage propre.
Les lignes bleues de la paroi intérieure sont les nuits où l'eau est entrée (la Nuit des lignes).

Méthode : un décor fixe (la Cuvette vide) + un bâtiment = une image séparée, peinte avec son propre dallage rond, **même angle**.
Pour garder l'angle et le style, chaque bâtiment reprend la Cuvette validée en second `--sref` (remplacer `https://levixqcl.github.io/empreintes/art/district/cuvette-essai.webp` par son lien).

## 1. La Cuvette corrigée (décor)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Fixed isometric three-quarter top-down view, camera tilted 45 degrees, a large circular stone ring dike seen from above, enclosing a dry sunken paved sandstone plaza far below the top of the wall. Four paved paths radiate from an empty round stone foundation at the exact center of the plaza; the four quarters between the paths are flat, empty and clean, ready for buildings. Faint pale blue horizontal high-water lines painted on the inner face of the wall. The outer face of the wall is dark, wet and covered with seaweed and barnacles up to just below the rim, as if the sea stands high outside. On top of the wall: small wooden pump houses with red tile roofs and turning water wheels, pipes spilling water outward over the wall, clotheslines with laundry, flower boxes. At the lower right, a heavy watertight lock gate with two reinforced wooden doors and iron wheels, built into the wall, closed. Golden late afternoon light, cheerful and inviting, no people, no text, isolated on a plain flat solid light grey background --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette-essai.webp
```

## 2. Bâtiment test : la Tour du Noyau (posée sur la fondation centrale)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Fixed isometric three-quarter top-down view, camera tilted 45 degrees, a single building standing on its own round paved sandstone base: the Core Tower, a sturdy round tower of warm stone and brass built over a deep mine shaft, a big winch with cables and a lift cage at its foot, soft blue crystal glow rising from the shaft opening, red tile roof, small warm lit windows, a few miners' tools and crates around the base. Whole building visible and centered, nothing beyond the round base, golden late afternoon light, cheerful, no people, no text, isolated on a plain flat solid light grey background --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette-essai.webp
```

## Méthode retenue (2 novembre 2026)

- Décor : `art/district/cuvette-nue.webp` (validé). Les bâtiments sont peints **dans** la Cuvette avec l'éditeur de Midjourney (Edit),
  jamais à part : chaque image à part a sa propre perspective et le raccord se voit toujours.
- Claude prépare un **zoom** de la Cuvette (≈ 756 px autour de l'emplacement) avec la zone vidée : Midjourney a assez de pixels pour le détail.
  Pas d'Upscale : le zoom est réduit à sa taille réelle à l'intégration, l'Upscale ne fait que durcir le trait.
- **Midjourney remplit la forme vidée** : la zone a la silhouette voulue du bâtiment (plus haute pour un palier supérieur).
  Les chemins et les autres bâtiments sont protégés (jamais vidés).
- Un bâtiment par passe. Références : `--sref art/personnages/yse.webp art/district/cuvette-nue.webp --sw 100`.
- Direction : « technologie de récupération » — grès et cuivre de la Cuvette, machines récupérées, câbles, verre, cristal bleu des empreintes ;
  une silhouette unique par bâtiment. Pas de maisonnettes de village.
- Avancement : Forge (`art/district/cuvette-essai-forge.webp`), puis Tour du Noyau refaite en « récupération »
  (réservoir de tôle sur pied de câbles, treuil, fenêtre de cristal) : `art/district/cuvette-essai-tour.webp` contient les deux.
  Le zoom de la Tour couvrait (554, 560) → (1310, 1316) ; la sortie Midjourney (1024 px) est réduite à 756 px puis fondue
  sur un masque élargi (≈ 35 px) qui couvre l'ancienne et la nouvelle silhouette, pour qu'aucun fantôme ne reste.
- **3 paliers par bâtiment** (niveaux 1-3, 4-7, 8-10), chacun enregistré comme un calque séparé posé sur la Cuvette nue :
  aucune combinaison à peindre. Le palier du bas se fait en repassant le zoom du palier du milieu dans Edit.
- Plan des emplacements validé (2 nov. 2026, pixels de la Cuvette 1856 × 2464) — une seule Cuvette, jamais agrandie.
  Chaque emprise est réglée sur le **palier final** : les paliers inférieurs sont plus petits dedans, jamais plus grands.
  Centre au sol, demi-largeur, sommet maximal :
  - Tour du Noyau (930, 1140), 180, sommet 560 — faite ; ne monte plus, elle grandit en creusant (chevalement, puits, lueur).
  - Forge (1460, 1130), 170, sommet 700 — faite.
  - Générateur, quart gauche contre la digue (380, 1160), 165, sommet 900.
  - Clinique, devant, entre les deux chemins (860, 1430), 125, sommet 1295 — bas, pour ne pas cacher le pied de la Tour.
  - Comptoir, devant à droite, entre la Clinique et le chemin (1135, 1462), 125, sommet 1290 — fondation hors du chemin.
  - Labo génétique, fond à droite (1270, 830), 120, sommet 620 — trapu, en retrait.
  - Port : dehors, devant le sas (≈ 1640, 1960), sur la mer en code.
  - Plus aucune place libre au sol : les ajouts futurs se construisent **sur la digue** (chemin de ronde, à cheval sur le mur).
- Zoom du Générateur : `zoom-generateur.png`, coin haut gauche (10, 640), 756 px, zone vidée en transparence.
- Générateur fait (dynamo de cuivre rapiécée, turbines, colonne de cristal) : `art/district/cuvette-essai-generateur.webp`
  contient Forge + Tour + Générateur. À ajouter plus tard : câbles vers les pompes de la digue, lueur du cristal animée.
- Clinique faite (dôme de verre dépoli, capsules de soin, lanterne de cristal) : `art/district/cuvette-essai-clinique.webp`
  contient Forge + Tour + Générateur + Clinique. Intégration : `python3 scripts/cuvette-integrer.py base.png sortie.png x0 y0 cx cy rx sommet sortie.png`.
- Comptoir fait (kiosque hexagonal de cuivre, balance, éclats de cristal) : `art/district/cuvette-essai-comptoir.webp`
  contient Forge + Tour + Générateur + Clinique + Comptoir. Règle : un bâtiment peut cacher un chemin, sa fondation ne doit jamais être dessus.
