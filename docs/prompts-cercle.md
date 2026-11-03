# Prompts Midjourney — le Cercle des quais (3 novembre 2026)

Le bâtiment social (amis, duels, échanges) remplace le Labo génétique, mis en réserve, sur son socle de la Cuvette (1444, 1215).
Méthode des paliers (docs/prompts-paliers.md) : un zoom 756 px par palier, le Labo effacé, la zone à peindre vidée en transparence.
Zooms : `sources/art/district/cercle/cercle-<bas|milieu|haut>.png` (positions dans `positions.json`, formes dans `cercle.py`).
Bryan peint chaque zoom dans l'éditeur de Midjourney (Edit), sans Upscale. Silhouettes : estrade ronde, piliers, ombrelle de cuivre et de verre.

## Bas (niveaux 1-3) — zoom `cercle-bas.png`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Fixed isometric three-quarter top-down view, same camera angle, same scale and same warm evening light as the surrounding sunken stone district. Inside the erased area stands the EARLY, MODEST version: small, makeshift and freshly started, patched scrap, canvas tarps, a bit of wooden scaffolding, only a faint touch of blue crystal: the Quay Circle, an open-air meeting pavilion where district directors from across the sea come to duel with their cards and to trade: a round duelling ring chalked on the old paving with a thin faint blue crystal line, two low benches of salvaged crates facing each other across the ring, a patched canvas tarp stretched on two poles at the back, a thin mast with a small blank pennant, a chalkboard leaning on a crate. Salvage technology style: weathered sandstone, riveted copper, reclaimed machine parts, cables, glass and glowing blue crystal. One single building, it fills the erased silhouette exactly, its foot sits on its round stone platform, it blends seamlessly with the paved ground, paths and stairs around it. No people, no text, no letters, no village cottage, no cute house --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 100
```

## Milieu (niveaux 4-7) — zoom `cercle-milieu.png`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Fixed isometric three-quarter top-down view, same camera angle, same scale and same warm evening light as the surrounding sunken stone district. Inside the erased area stands the Quay Circle, an open-air meeting pavilion where district directors from across the sea come to duel with their cards and to trade: an open round pavilion on a raised circular stone dais, a glowing blue crystal duelling ring inlaid in the dais floor, slender riveted copper pillars holding a wide umbrella roof of copper ribs and frosted glass panels, a small blue crystal lantern on the tip of the roof, two facing benches on the dais, a wooden notice board pinned with blank paper slips. Salvage technology style: weathered sandstone, riveted copper, reclaimed machine parts, cables, glass and glowing blue crystal. One single building, it fills the erased silhouette exactly, its foot sits on its round stone platform, it blends seamlessly with the paved ground, paths and stairs around it. No people, no text, no letters, no village cottage, no cute house --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 100
```

## Haut (niveaux 8-10) — zoom `cercle-haut.png`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Fixed isometric three-quarter top-down view, same camera angle, same scale and same warm evening light as the surrounding sunken stone district. Inside the erased area stands the FULLY DEVELOPED, GRAND version: bigger, prouder and more elaborate than before, polished copper, extra machinery, bright glowing blue crystal, warm lit windows: the Quay Circle, an open-air meeting pavilion where district directors from across the sea come to duel with their cards and to trade: a grand open round pavilion on a wide circular stone dais, six polished copper pillars, a high dome of copper ribs and amber and blue stained glass crowned by a large glowing blue crystal lantern, a bright blue crystal duelling ring inlaid in the floor, tiered benches for spectators, two tall copper masts at the sides flying long blank orange banners, a large notice board of blank trade slips. Salvage technology style: weathered sandstone, riveted copper, reclaimed machine parts, cables, glass and glowing blue crystal. One single building, it fills the erased silhouette exactly, its foot sits on its round stone platform, it blends seamlessly with the paved ground, paths and stairs around it. No people, no text, no letters, no village cottage, no cute house --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 100
```

## Écran d'ouverture du Cercle (9:16, comme la Flèche)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Inside an open round pavilion of riveted copper pillars and a frosted glass umbrella roof, standing on a raised sandstone dais at the bottom of a sunken district surrounded by a high ring dike, eye-level view across a glowing blue crystal duelling ring inlaid in the floor, two empty benches facing each other on each side of the ring, a wooden notice board covered with blank paper slips and small wax seals, through the pillars the top of the dike with pump houses and small boats of visiting districts moored at a lock gate, a few blank orange pennants, warm golden evening light, inviting and lively, no people, no text, no letters, no numbers, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 80 --no text, letters, numbers, person, character
```
## Intégré (3 novembre 2026, soir)

Bryan a peint les trois zooms et l'écran d'ouverture. Sorties gardées dans `sources/art/district/cercle/mj-<palier>.webp` ;
intégration par `sources/art/district/cercle/integrer.py` (dossier de travail avec `bat.webp`, `nue.webp`, `mid.npz`, les zooms et `mj/`).
- Les trois paliers sont des **calques**, le milieu compris (`CALQUES_CUVETTE`, entrée `cercle` avec `milieu`) : le tableau `cuvette.webp`
  montre encore l'ancien Labo dessous, entièrement recouvert. Lueurs : `paliers/cercle-<palier>-lueur.webp`.
- Feuilles du bâtiment : `art/batiments/cercle-1` à `4.webp` et `cercle.webp`. Écran d'ouverture : `art/scenes/cercle.webp`.
