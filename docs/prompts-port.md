# Prompts Midjourney — Le Port plus visuel (12 novembre 2026)

Le bandeau en haut du Port montre pour l'instant la mer du district (`district/mer-1.webp`). Une image dédiée le rendra
plus vivant. Déposer le rendu dans `public/art/district/port-bandeau.webp` (webp, environ 2400 × 800), puis faire pointer
le bandeau dessus dans `src/ui/pillages.ts` (`merLarge` → la nouvelle image, à ajouter dans `src/ui/art.ts`).
Composition : le port au centre, de l'eau calme des deux côtés (sur téléphone, l'image est recadrée au centre),
le titre se pose en bas à gauche, le bas de l'image reste sombre et calme.

## port-bandeau.webp

Le Port de la Cuvette (et non d'un archipel) : au pied de la digue, devant son sas, sur pilotis (retour de Bryan, 12 nov. 2026).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Seen from the sea, the outer face of a huge curved pale concrete ring dike that encloses a sunken district, stained and patched, with small salvaged houses, pipes and copper domes perched along its rim, a heavy round metal sluice gate set in the dike wall at water level, in front of it a small harbor on wooden stilts hugging the foot of the curved wall, plank pontoons, a rusty round copper watchtower topped with a glowing blue crystal lamp, a few moored salvaged rowing boats with warm lanterns, ropes and nets, retro-futuristic salvage details, calm turquoise sea, warm late afternoon light, the curve of the dike sweeping across the whole frame, dark calm water along the bottom edge, no rock pillars, no sea stacks, no people, family-friendly, no text, no letters, no numbers --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/district/cuvette.webp https://levixqcl.github.io/empreintes/art/batiments/port-3.webp --sw 70 --no text, letters, people, flag, rock pillars, sea stacks, cliffs
```

Le reste de l'écran n'a besoin d'aucune nouvelle image : la carte « Famille à secourir » cadre le flanc peint de la digue
(`district/basses.webp`) à la hauteur du lieu, les mains viennent du Mur des empreintes, les barques et les creuseurs
sont les images déjà peintes.
