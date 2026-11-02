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
- Emplacements (pixels de la Cuvette 1856 × 2464) : Tour (932, 1128) ; Générateur/Clinique quart gauche (420, 1150) ;
  Forge quart droit (1450, 1160) ; Comptoir devant (930, 1500) ; Port dehors devant le sas (≈ 1650, 1900) ; restent le quart du fond et deux places libres devant.
