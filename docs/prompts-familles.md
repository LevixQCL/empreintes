# Prompt Midjourney — le Mur des empreintes (7 novembre 2026)

Bryan : 48 portraits pour des pastilles de 30 px, c'est trop. À la place, un seul tableau : le mur des habitations où chaque
famille a posé sa main. Claude le découpe en 48 cases (une empreinte par famille, ordre de `src/core/familles.ts`) : l'empreinte
s'allume quand la famille arrive, les autres restent dans l'ombre. Le souvenir porte l'histoire, pas le visage.

Générer en 4 variantes et garder celle où les mains sont le plus régulièrement alignées. À déposer dans Téléchargements :
Claude le range dans `public/art/district/mur-empreintes.webp` et fait le découpage.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Front view, flat and straight-on, of an old sandstone wall inside a sunken ring-dike district, covered with painted handprints neatly arranged in a regular grid of six rows and eight columns, forty-eight handprints in total, evenly spaced with clear stone between them, all the same size, each a different hand (adult, child, old, wide, slender) and a different warm or sea color (ochre, rust, teal, gold, coral, deep blue, sand, olive), some paint drips, a pale blue high-water line painted across the bottom of the wall, small cracks and moss in the joints, soft warm lamplight, no people, no text, no letters, no numbers, no religious motifs --ar 4:3 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 70
```

## Deuxième essai (7 novembre 2026)

Le premier rendu avait 5 rangées de 9 mains, en perspective (45 mains, 3 reprises en miroir). Ce prompt force une façade
plate, vue de face, qui remplit tout le cadre, et 6 × 8 cases nettes.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Orthographic front view of a perfectly flat sandstone wall, camera exactly parallel to the wall, no perspective, the wall fills the entire frame from edge to edge, divided into a neat grid of square stone tiles: exactly 6 rows and 8 columns, 48 tiles, each tile holding exactly one painted handprint centered in it, all handprints the same size and upright, each a different hand (adult, child, old, wide, slender) and a different warm or sea color (ochre, rust, teal, gold, coral, deep blue, sand, olive), thin dark joints between the tiles, a few paint drips, a faint pale blue high-water stain along the bottom row, soft even warm lamplight, no people, no text, no letters, no numbers, no religious motifs --ar 4:3 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 50 --no perspective, side wall, corner, lamp, building, street, sky, floor, person
```
