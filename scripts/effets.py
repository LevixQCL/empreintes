# Prépare les textures d'effets de combat peintes sur Midjourney (fond noir) pour le jeu :
# le noir devient transparent (la lumière garde sa couleur), l'image est recadrée sur l'effet, réduite, et rangée
# dans public/art/effets/<nom>-1.webp, <nom>-2.webp… (voir docs/prompts-effets.md et VARIANTES dans src/ui/impact.ts).
# Usage : python3 scripts/effets.py dossier_des_images nom      (ex. : python3 scripts/effets.py ~/Téléchargements/ecu ecu)
import sys, glob, os
import numpy as np
from PIL import Image

LARGES = {'rempart', 'vague', 'lance', 'tech', 'e-tech'}  # effets tout en longueur : 720 px de large, les autres 560 px de côté

def detourer(chemin, nom, n):
    im = np.array(Image.open(chemin).convert('RGB')).astype(np.float32)
    mx = im.max(-1)
    # l'opacité suit la lumière : le noir du fond disparaît, les bords s'estompent sans liseré sombre
    a = np.clip((mx - 10) / 190, 0, 1)
    rgb = np.clip(im / np.maximum(a, 0.05)[..., None], 0, 255)
    ys, xs = np.where(a > 0.04)
    if not len(xs):
        print('image vide :', chemin); return
    m = 6
    x0, x1, y0, y1 = max(0, xs.min() - m), min(im.shape[1], xs.max() + m), max(0, ys.min() - m), min(im.shape[0], ys.max() + m)
    out = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8)[y0:y1, x0:x1], 'RGBA')
    cote = 720 if nom in LARGES else 560
    k = min(1, cote / max(out.size))
    out = out.resize((max(1, round(out.width * k)), max(1, round(out.height * k))), Image.LANCZOS)
    sortie = os.path.join(os.path.dirname(__file__), '..', 'public', 'art', 'effets', f'{nom}-{n}.webp')
    out.save(sortie, quality=88, method=6)
    print(f'{nom}-{n}.webp', out.size)

if __name__ == '__main__':
    dossier, nom = sys.argv[1], sys.argv[2]
    images = sorted(f for f in glob.glob(os.path.join(os.path.expanduser(dossier), '*')) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
    for i, f in enumerate(images, 1):
        detourer(f, nom, i)
