# La lumière de la Cuvette (13 novembre 2026, Bryan : « un peu terne », puis « c'est mieux ») : intérieur éclairci, couleurs
# plus chaudes et plus saturées, lumière sur la Tour du Noyau et les bassins, grande tour du quartier calmée.
# Même réglage, au même endroit, pour le tableau, ses calques de paliers (positions lues dans src/ui/art.ts) et la mer large :
# rien ne se décale. Les images d'origine sont dans sources/art/district/lumiere-origine.
# usage : python3 scripts/cuvette-lumiere.py   (après avoir remplacé une image d'origine, ou pour changer un réglage)
# Un nouveau palier : copier sa version non retouchée dans lumiere-origine/paliers, puis relancer.
import sys, re
from pathlib import Path
from PIL import Image
import numpy as np

RACINE = Path(__file__).resolve().parent.parent
ART = RACINE / 'public/art/district'
ORIG = RACINE / 'sources/art/district/lumiere-origine'
P = dict(lift=0.9, sat=1.22, chaud=(1.05, 1.0, 0.93), halo=0.28, tour=0.2)

def grade(a, X, Y):
    rgb = a[..., :3]
    rgb = rgb + P['lift'] * rgb * (1 - rgb) ** 2                      # ombres relevées
    rgb = rgb * np.array(P['chaud'])                                   # plus chaud
    l = rgb.mean(axis=2, keepdims=True); rgb = l + (rgb - l) * P['sat']  # plus saturé
    d = np.sqrt(((X - 420) / 330) ** 2 + ((Y - 610) / 420) ** 2)
    halo = (np.clip(1 - d, 0, 1) ** 1.6)[..., None]
    rgb = rgb * (1 + P['halo'] * halo) + np.array([0.06, 0.04, 0.0]) * halo   # la Cuvette devient le point de lumière
    # la grande tour dehors et le ciel du coin haut droit (13 novembre 2026, Bryan : « cette moche lueur, fais-la venir uniquement
    # des fenêtres, pas sur tout le bâtiment ») : la pierre, les toits et l'eau perdent leur lavis orange et passent au bleu du
    # soir ; seules les fenêtres et les lanternes (petits points clairs et chauds) gardent leur lumière, et un peu de leur halo.
    hx = np.clip(1 - np.abs(X - 765) / 260, 0, 1) ** 0.7
    hy = np.clip((470 - Y) / 220, 0, 1)
    ciel = np.clip((X - 760) / 160, 0, 1) * np.clip((330 - Y) / 140, 0, 1)
    m = np.clip(np.maximum(hx * hy, ciel), 0, 1) ** 0.8
    m = m[..., None]
    l = rgb.mean(axis=2, keepdims=True)
    chaud = np.clip((rgb[..., :1] - rgb[..., 2:3] - 0.2) / 0.25, 0, 1)
    fen = np.clip((l - 0.42) / 0.2, 0, 1) * chaud                       # une fenêtre : claire ET chaude
    soir = l * np.array([0.62, 0.8, 0.92]) * 0.9 + np.array([0.02, 0.04, 0.06])   # la pierre sous le ciel du soir
    rgb = rgb * (1 - m * (1 - fen)) + soir * m * (1 - fen)
    a = a.copy(); a[..., :3] = np.clip(rgb, 0, 1); return a

def traiter(nom, ox=0.0, oy=0.0, ech=1.0):
    src = ORIG / nom
    im = Image.open(src); mode = im.mode
    a = np.asarray(im.convert('RGBA' if 'A' in mode else 'RGB')).astype(np.float32) / 255
    h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    out = grade(a, ox + xx * ech, oy + yy * ech)
    Image.fromarray((out * 255).round().astype('uint8')).save(ART / nom, quality=90)

traiter('cuvette.webp')
traiter('cuvette-large.webp', -568, 0)
traiter('cuvette-haute.webp', -568, -352)
art = (RACINE / 'src/ui/art.ts').read_text()   # positions des calques
for m in re.finditer(r"\{ lieu: '(\w+)', (.*?)eclats", art):
    lieu, corps = m.group(1), m.group(2)
    for q, x, y, w, h in re.findall(r"(bas|milieu|haut): \[(\d+), (\d+), (\d+), (\d+)\]", corps):
        nom = f'paliers/{lieu}-{q}.webp'
        if not (ORIG / nom).exists(): continue
        W = Image.open(ORIG / nom).size[0]
        traiter(nom, float(x), float(y), int(w) / W)
print('fait')
