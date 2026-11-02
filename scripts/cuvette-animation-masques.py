# Masques des animations de la Cuvette (2 novembre 2026), lus par src/ui/houle.ts.
# Tout est tiré du tableau lui-même (art/district/cuvette.webp, 800 × 1200), zone par zone, en repère 400 × 600 :
#   cuvette-anim-1.webp : R = mer (houle), G = eau qui coule (255 chute, 120 nappe qui avance), B = cristaux (leurs pixels)
#   cuvette-anim-2.webp : R = avancée dans la chute (0 en haut, 255 en bas, où naît l'écume), G = feu de la Forge,
#                         B = halo des cristaux (leurs pixels floutés)
#   cuvette-anim-3.webp : R = halo du feu
# usage : python3 scripts/cuvette-animation-masques.py   (depuis la racine du dépôt ; refait les trois fichiers)
import numpy as np
from PIL import Image, ImageFilter

D = 'public/art/district/'
im = np.asarray(Image.open(D + 'cuvette.webp').convert('RGB')).astype(float)
H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]
Y, X = np.mgrid[0:H, 0:W] / 2.0          # repère 400 × 600
lum = (r + g + b) / 3

def boite(x0, y0, x1, y1):
    return (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1)

def lisse(a, rayon):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rayon))).astype(float) / 255

# ---- l'eau : la nappe du déversoir, sa chute dans la mer, les deux filets sous la Clinique et leur bassin
eau_coul = (g > r + 25) & (b > r + 15)
blanc = (lum > 175) & (b > 140)
mouille = eau_coul | blanc
levre = 437 + 0.5 * (X - 50)                          # le bord du déversoir
chuteB = boite(45, 434, 80, 468) & (Y >= levre) & (Y <= levre + 16) & mouille
nappeB = boite(45, 420, 92, 448) & (Y < levre) & eau_coul
chuteA = (boite(96, 396, 104, 420) | boite(106, 399, 116, 418)) & mouille
bassinA = boite(78, 414, 120, 432) & eau_coul & ~chuteA
eau = np.zeros((H, W))
eau[nappeB | bassinA] = 120 / 255
eau[chuteA | chuteB] = 1
avance = np.zeros((H, W))
avance[chuteB] = np.clip((Y - levre)[chuteB] / 16, 0, 1)
avance[chuteA] = np.clip((Y[chuteA] - 397) / 22, 0, 1)
avance[bassinA & (Y < 426) & (X > 94)] = 1           # l'écume au pied des filets
# l'écume dans la mer, au pied du déversoir : une bande juste sous la chute
piedB = boite(44, 446, 84, 480) & (Y > levre + 13) & (Y < levre + 24) & ~chuteB & (lum > 40)
eau[piedB] = np.maximum(eau[piedB], 70 / 255)
avance[piedB] = np.clip(1 - (Y[piedB] - levre[piedB] - 13) / 11, 0, 1)

# ---- les cristaux : leurs pixels cyan, zone par zone (les canaux turquoise ne sont pas touchés)
zones = [boite(193, 134, 213, 160), boite(298, 222, 330, 262), boite(166, 332, 191, 374), boite(114, 320, 134, 348),
         boite(256, 360, 302, 388), boite(309, 506, 324, 531), boite(108, 292, 136, 310)]
cyan = np.clip(((b - r) - 40) / 60, 0, 1) * np.clip((np.maximum(g, b) - 100) / 80, 0, 1)
cristal = np.zeros((H, W))
for z in zones: cristal[z] = np.maximum(cristal[z], cyan[z])
# la cuve du Labo est plus sombre : sa spirale se lit à un seuil plus bas
labo = boite(300, 226, 326, 258)
cristal[labo] = np.maximum(cristal[labo], (np.clip(((b - r) - 25) / 50, 0, 1) * np.clip((np.maximum(g, b) - 60) / 60, 0, 1))[labo] * .8)

# ---- le feu de la Forge : les pixels orangés de son fourneau
orange = np.clip((r - 150) / 60, 0, 1) * np.clip((r - b - 90) / 60, 0, 1) * (g > 70)
feu = np.where(boite(110, 270, 136, 298) | boite(83, 193, 97, 207), orange, 0)   # le fourneau, et les braises dans la cage de la cheminée

# la mer, sans la chute ni la nappe (elles coulent, elles n'ondulent pas)
mer = np.asarray(Image.open(D + 'cuvette-houle.webp').convert('L').resize((W, H), Image.LANCZOS)).astype(float) / 255
mer[lisse((eau > 0).astype(float), 3) > .05] = 0

u8 = lambda a: (np.clip(a, 0, 1) * 255).astype(np.uint8)
Image.fromarray(np.dstack([u8(mer), u8(eau), u8(cristal)])).save(D + 'cuvette-anim-1.webp', lossless=True)
Image.fromarray(np.dstack([u8(avance), u8(feu), u8(lisse(cristal, 9) * 2.2)])).save(D + 'cuvette-anim-2.webp', lossless=True)
Image.fromarray(np.dstack([u8(lisse(feu, 12) * 2.5)] * 3)).save(D + 'cuvette-anim-3.webp', lossless=True)
print('eau', int((eau > 0).sum()), 'chute', int((chuteA | chuteB).sum()), 'cristal', int((cristal > .3).sum()), 'feu', int((feu > .3).sum()))
