# Prompts Midjourney de la campagne vécue

Pour les scènes de la campagne (`src/core/campagne.ts`, 25 octobre 2026). En attendant ces images, les scènes
réutilisent le décor de la zone, le portrait du gardien ou un tableau de l'intro, et les personnages sans portrait
s'affichent avec leur initiale.

Le code --sref du Manifeste des prompts n'a été retrouvé ni dans le dépôt ni dans son historique : la référence de style
est prise dans les illustrations déjà publiées du jeu (portraits d'Ysé et d'Ilka pour les portraits, une Strate et la Confluence
pour les scènes). Règle commune :
*no text, no letters, no numbers, no flags, no real country, no real person, no religious motifs, family-friendly, no blood, no gore.*

Préfixe commun (à mettre en tête de chaque prompt) :
> bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art.

## Portraits (600 × 800, `public/art/personnages/<id>.webp`)

| Fichier | Prompt (après le préfixe) |
|---|---|
| `hald.webp` | bust portrait of a stern woman captain in her forties, short cropped dark hair with a single gold streak, white and violet military coat with high collar, polished brass buckles, a faint winged shadow behind her shoulder, cold blue cave light, dark smoky background --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/porteurs/ilka.webp |
| `tobin.webp` | bust portrait of a young cheerful archivist explorer, messy curly hair, round brass goggles pushed up on the forehead, canvas coat covered with pockets, holding a sketchbook full of crystal drawings, warm lantern light, dark background --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/porteurs/ilka.webp |
| `brac.webp` | bust portrait of a wiry scavenger in his thirties, patched leather hood, mechanical left eye glowing pale blue, scarf over the chin, nervous wide eyes, purple crystal shards in a torn bag on his shoulder, dark tunnel background --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/porteurs/ilka.webp |
| `isaure.webp` | bust portrait of an elegant elderly noblewoman of the floating cities, silver hair braided with a gold streak, white high-necked gown with pearl-like nacre embroidery, calm cold smile, a huge serene winged shadow behind her, soft clouds and sunlight in the background --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/porteurs/ilka.webp |

## Scènes (816 × 1456, format portrait 9:16, `public/art/scenes/<id>.webp`)

Laisser le tiers bas de l'image calme et simple : le panneau de dialogue s'y pose.

| Fichier | Scène | Prompt (après le préfixe) |
|---|---|---|
| `entree-2.webp` | Les couloirs murés | a narrow underground maintenance corridor from the 2060s, old concrete walls with a broken brick wall-up, fresh boot prints in the dust leading down, a few purple glowing crystal shards dropped on the floor, three explorers with lamps seen from behind, eerie violet light --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `gardien-2.webp` | Brac | a frightened scavenger crouching in a corner of a cave, torn sacks of dull grey crystals around him, a squad of soldiers in white and violet coats arriving with lanterns in the background, tense atmosphere --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `gardien-3.webp` | Une seule voix | a tiny perfectly clear crystal like a water drop resting on an open palm, glowing softly, the collapsed remains of a huge creature made of tangled ghostly shapes dissolving into mist around it, deep cave --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `entree-4.webp` | Fermées de l'intérieur | a row of round ancient stone doors with strange engraved patterns, bolted from the inside, faint light leaking through the seams, an explorer touching one door with an open hand, dark blue cave --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `entree-5.webp` | Les Berceaux vides | an ancient chamber with lattice niches of crystal, all empty and open, white wax seals scattered on the floor, a few remaining small crystals huddled together glowing faintly, cold light --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `entree-6.webp` | Le niveau 7 | a hastily poured concrete wall covered with old stamps and warning stripes blocking a tunnel, faint violet glow and tear-like drops of light seeping through cracks, explorers with lamps facing it --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `convocation.webp` | Une lettre des Hauts | a sealed letter with white wax and a golden ribbon on a battered wooden desk with a small leak bucket, through the window floating islands with white palaces glide above the clouds at dawn --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `entree-8.webp` | Les Veilleurs perdus | an abandoned explorers' camp in a crystal cave, extinguished seaweed lamps, open notebooks, folded blankets, six sleeping figures wrapped in glowing golden threads like a cocoon of memories, dreamy warm light --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `gardien-9.webp` | Son nom | a tired weaver creature made of threads of amber light, sitting and slowly unravelling like a scarf being untied, smiling peacefully, threads floating upward, deep cave --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |
| `epilogue.webp` | Ce que tu as choisi | the top of a lighthouse tower above a small archipelago district on old pillars, calm sea at sunset, an old archivist woman and three companions looking at the horizon, a floating island far away --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/strates/zone-1.webp https://levixqcl.github.io/empreintes/art/ennemis/confluence.webp |

Une fois les images dans `public/art/`, dire à Claude lesquelles sont arrivées : il les branche dans `src/ui/campagne.ts`.
