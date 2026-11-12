# Prompts Midjourney — Le Port plus visuel (12 novembre 2026)

Le bandeau en haut du Port montre pour l'instant la mer du district (`district/mer-1.webp`). Une image dédiée le rendra
plus vivant. Déposer le rendu dans `public/art/district/port-bandeau.webp` (webp, environ 2400 × 800), puis faire pointer
le bandeau dessus dans `src/ui/pillages.ts` (`merLarge` → la nouvelle image, à ajouter dans `src/ui/art.ts`).
Composition : le port au centre, de l'eau calme des deux côtés (sur téléphone, l'image est recadrée au centre),
le titre se pose en bas à gauche, le bas de l'image reste sombre et calme.

## port-bandeau.webp

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. A small harbor built on tall weathered stone pillars rising from a calm turquoise sea, wooden jetties and pontoons on stilts, a few moored rowing boats each with a glowing lantern, a little wooden crane with fishing nets, rope bridges between the pillars, warm lantern lights at dusk, the harbor centered in the frame, open calm water on both sides, horizon in the upper third, dark calm water along the bottom edge, no people, family-friendly, no text, no letters, no numbers --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/district/mer-1.webp https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, people, flag
```

Le reste de l'écran n'a besoin d'aucune nouvelle image : la carte « Famille à secourir » cadre le flanc peint de la digue
(`district/basses.webp`) à la hauteur du lieu, les mains viennent du Mur des empreintes, les barques et les creuseurs
sont les images déjà peintes.
