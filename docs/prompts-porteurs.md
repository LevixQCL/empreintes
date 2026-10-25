# Prompts Midjourney des portraits de Porteurs (une lumière par lignée)

Pourquoi (25 octobre 2026) : les 12 portraits de `public/art/porteurs/` sont tous éclairés à la lanterne orange,
si bien qu'on ne distingue pas les trois lignées. Chaque lignée reçoit donc sa propre lumière dominante :

| Lignée | Lumière | Accent gardé |
|---|---|---|
| Augmentés (tech) | bleu acier froid, cyan électrique, lueur bleue des implants | métal |
| Génés (bio) | vert émeraude et mousse, lueur bioluminescente des eaux et des algues | chitine sarcelle |
| Résonants (reso) | améthyste et violet, éclat de cristal, ombres indigo | mèche d'or |

Le préfixe imposé contient « vibrant warm palette » : la lumière de lignée doit donc être écrite clairement dans le
prompt, et `--no` écarte l'orange. Le `--sref` reprend le portrait d'Ysé (même trait que les Porteurs) avec un poids
réduit (`--sw 60`), pour garder le style sans rapporter la lumière orange.

Règle commune : *no text, no letters, no numbers, no flags, no real country, no real person, no religious motifs, family-friendly, no blood, no gore.*

Préfixe commun (à mettre en tête de chaque prompt) :
> bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art.

Fin commune (à coller à la fin de chaque prompt) :
> --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no orange, amber, sunset, fire glow, text

Format : 600 × 800, à enregistrer sous le même nom dans `public/art/porteurs/<id>.webp` (remplace l'ancien portrait).

## Augmentés : lumière bleu acier

| Fichier | Prompt (après le préfixe, avant la fin commune) |
|---|---|
| `ilka.webp` | young woman courier in her twenties, short spiky white hair, freckles, wide cheeky grin, thin metal circuit lines at her temple, slate-blue hooded scarf and worn utility jacket, sleek mechanical legs with glowing blue crystal cores at the knees, leaping across rusty suspension bridge cables high above a city at dusk, dominant cold steel-blue and electric cyan lighting, blue glow from her implants, cool blue-grey sky, deep navy shadows |
| `coursier.webp` | young runner in his late teens, messy black hair, determined look, dark teal hooded scarf, second-hand mechanical arm with a glowing blue palm, crouched mid-sprint on a metal walkway, motion lines, dominant cold steel-blue and electric cyan lighting, blue rim light, cool night city haze, deep navy shadows |
| `sasha.webp` | strong repairman in his thirties, short hair, trimmed beard, brass goggles pushed up on his forehead, heavy work apron, homemade mechanical right arm built from salvaged plates and cables, repairing a machine on a cluttered workbench, blue-white welding sparks, dominant cold steel-blue and cyan lighting, workshop lit by blue work lamps, deep navy shadows |
| `liane.webp` | elegant cold woman in her thirties, hair almost entirely white, aloof proud gaze, long black high-collared coat, discreet implants with glowing blue nodes along her arm and neck, standing in a narrow alley between tall buildings, dominant cold steel-blue and pale cyan lighting, blue mist, moonlit blue-grey background, deep navy shadows |

## Génés : lumière verte bioluminescente

| Fichier | Prompt (après le préfixe, avant la fin commune) |
|---|---|
| `doran.webp` | broad-shouldered man in his fifties, grey hair and thick grey beard, warm tired smile, teal-green chitin plates on his shoulder and forearm, faint gill lines on his neck, rolled-up work shirt, climbing an iron ladder in a flooded underground sewer, dominant emerald and moss-green lighting, soft bioluminescent green glow from the water and algae, teal reflections, deep green-black shadows |
| `docker.webp` | cheerful broad-shouldered dock worker in his thirties, big laugh, short tousled hair, teal-green chitin plates covering his hands and shoulders, leaning on a cargo crate on a canal barge at night, dominant emerald and moss-green lighting, glowing green algae on the water, teal mist, deep green-black shadows |
| `nuit.webp` | young woman scout in her twenties, dark hood and scarf, large owl-like glowing golden eyes, crouched on a rooftop edge above a sleeping district at night, dominant emerald and moss-green lighting, soft bioluminescent green glow from moss on the stones, teal night sky, deep green-black shadows |
| `kessa.webp` | young woman in her late twenties, curly dark hair tied up, a natural chitin plate on one shoulder, eyes that reflect light like a cat, practical leather gear with tools at the belt, standing among dripping pipes and hanging vines, dominant emerald and moss-green lighting, bioluminescent green glow from plants, teal reflections, deep green-black shadows |

## Résonants : lumière améthyste

| Fichier | Prompt (après le préfixe, avant la fin commune) |
|---|---|
| `vela.webp` | young woman in her twenties, shoulder-length dark hair with a thin gold streak, calm attentive face, hooded travel cloak, raising a lantern with a cold violet flame, a huge serpentine dragon shadow cast on the stone wall behind her, dominant amethyst and violet lighting, glowing purple crystal light, lavender rim light, deep indigo shadows |
| `guetteur.webp` | weathered older man in his sixties, grey beard, a pale gold streak in his grey hair, long worn coat, holding an old brass spyglass, standing on a high lookout above the rooftops, dominant amethyst and violet lighting, a faint purple crystal glow at his neck, lavender sky, deep indigo shadows |
| `aurel.webp` | young nobleman in his early twenties, wavy dark hair with a bright gold streak, gentle guarded smile, white noble coat with a hood thrown back, a faint winged shadow behind him, on a dark district street far from home, dominant amethyst and violet lighting, glowing purple crystal light, lavender rim light, deep indigo shadows |
| `joss.webp` | cheerful young man around twenty, messy brown hair with one fresh gold streak, laughing, dyer's apron covered in colourful stains, holding out an open hand, in a small dye workshop with hanging cloth, dominant amethyst and violet lighting, glowing purple crystal light, lavender rim light, deep indigo shadows |
