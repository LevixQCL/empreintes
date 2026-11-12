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
    # la grande tour dehors : son orange est calmé (moins saturé, moins chaud) et elle s'efface un peu
    t = np.sqrt(((X - 735) / 210) ** 2 + ((Y - 110) / 280) ** 2)
    m = (np.clip(1 - t, 0, 1) ** 0.9)[..., None]
    l = rgb.mean(axis=2, keepdims=True)
    calme = (l + (rgb - l) * 0.45) * np.array([0.93, 0.98, 1.06])
    rgb = rgb * (1 - 0.5 * m) + calme * 0.5 * m
    rgb = rgb * (1 - P['tour'] * m)
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
