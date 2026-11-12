# Prépare les textures d'effets de combat peintes sur Midjourney (fond noir) pour le jeu :
# le noir devient transparent (la lumière garde sa couleur), l'image est recadrée sur l'effet, réduite, et rangée
# dans public/art/effets/<nom>-1.webp, <nom>-2.webp… (voir docs/prompts-effets.md et VARIANTES dans src/ui/impact.ts).
# Usage : python3 scripts/effets.py dossier_des_images nom      (ex. : python3 scripts/effets.py ~/Téléchargements/ecu ecu)
#
# Détourage soigné (12 novembre 2026) : le « noir » de Midjourney n'est jamais noir (gris 5 à 15, parfois une texture de
# grotte jusqu'à 50). Le fond est donc mesuré sur place (carte de fond lissée) puis retiré, au lieu d'un seuil fixe qui
# laissait un voile rectangulaire autour de l'effet. Les poussières sombres isolées sont effacées (les étincelles vives
# restent), et un effet qui touchait le bord de l'image s'y estompe au lieu d'être coupé net.
import sys, glob, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

LARGES = {'rempart', 'vague', 'lance', 'tech', 'e-tech'}  # effets tout en longueur : 720 px de large, les autres 560 px de côté


def carte_de_fond(im):
    """Le fond local : le plus sombre de chaque zone, élargi puis lissé (ignore l'effet, suit les dégradés du fond)."""
    h, w, _ = im.shape
    lum = im.max(-1)
    pas = 16
    hh, ww = h // pas, w // pas
    blocs = lum[:hh * pas, :ww * pas].reshape(hh, pas, ww, pas).transpose(0, 2, 1, 3).reshape(hh, ww, -1)
    bas = np.percentile(blocs, 10, axis=-1)
    bas = ndimage.minimum_filter(bas, size=15)         # l'effet (même large et plein) ne « remonte » pas le fond
    bas = ndimage.gaussian_filter(bas, 4)
    fond = np.array(Image.fromarray(bas.astype(np.float32)).resize((w, h), Image.BILINEAR))
    # plafond : le fond n'est jamais plus clair que le cadre de l'image (là où l'effet n'est pas)
    b = 24
    cadre = np.concatenate([lum[:b].ravel(), lum[-b:].ravel(), lum[:, :b].ravel(), lum[:, -b:].ravel()])
    return np.minimum(fond, np.percentile(cadre, 60) + 6)


def detourer(chemin, nom, n):
    im = np.array(Image.open(chemin).convert('RGB')).astype(np.float32)
    h, w, _ = im.shape
    fond = carte_de_fond(im)
    # bruit du fond : écart des pixels sombres autour de leur fond
    lum = im.max(-1)
    ecart = lum - fond
    bruit = float(np.percentile(np.abs(ecart[ecart < 12]), 90)) if (ecart < 12).any() else 3.0
    seuil = 4 + 1.5 * bruit
    sig = np.clip((ecart - seuil) / (200 - seuil), 0, 1)
    a = sig * sig * (3 - 2 * sig) * 0.35 + sig * 0.65   # courbe douce : pas de liseré gris, cœur bien plein

    # poussières : on ne garde que les zones qui comptent (assez grandes, ou vraiment lumineuses)
    masque = a > 0.03
    lab, nb = ndimage.label(masque, structure=np.ones((3, 3)))
    if nb:
        idx = np.arange(1, nb + 1)
        aire = ndimage.sum(masque, lab, idx)
        pic = ndimage.maximum(a, lab, idx)
        grand = aire.max()
        garder = (aire >= max(40, grand * 0.002)) | (pic >= 0.55)
        # un amas sombre et large loin de l'effet (texture de grotte) part aussi
        garder &= ~((pic < 0.25) & (aire < grand * 0.2))
        a = a * np.isin(lab, idx[garder])

    # la couleur de la lumière, sans le fond ni l'assombrissement du bord
    fond_rgb = np.minimum(im, fond[..., None])
    rgb = np.clip((im - fond_rgb * (1 - a[..., None])) / np.maximum(a, 0.04)[..., None], 0, 255)

    # un effet coupé par le bord de l'image s'estompe sur 6 % au lieu de finir net
    marge = int(0.06 * min(h, w))
    rampe_y = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None]
    rampe_x = np.minimum(np.arange(w), np.arange(w)[::-1])[None, :]
    a = a * np.clip(np.minimum(rampe_y, rampe_x) / marge, 0, 1) ** 0.8

    ys, xs = np.where(a > 0.02)
    if not len(xs):
        print('image vide :', chemin); return
    m = 6
    x0, x1, y0, y1 = max(0, xs.min() - m), min(w, xs.max() + m), max(0, ys.min() - m), min(h, ys.max() + m)
    out = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8)[y0:y1, x0:x1], 'RGBA')
    cote = 720 if nom in LARGES else 560
    k = min(1, cote / max(out.size))
    out = out.resize((max(1, round(out.width * k)), max(1, round(out.height * k))), Image.LANCZOS)
    sortie = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art', 'effets', f'{nom}-{n}.webp')
    out.save(sortie, quality=90, method=6)
    print(f'{nom}-{n}.webp', out.size, f'fond≈{fond.mean():.0f} bruit≈{bruit:.1f}')


if __name__ == '__main__':
    dossier, nom = sys.argv[1], sys.argv[2]
    images = sorted(f for f in glob.glob(os.path.join(os.path.expanduser(dossier), '*')) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
    for i, f in enumerate(images, 1):
        detourer(f, nom, i)
