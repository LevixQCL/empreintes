# Masque de la mer de la Cuvette prolongée (9 novembre 2026), lu par src/ui/houle.ts sur PC.
# L'image large (art/district/cuvette-large.webp, 1911 × 1200) entoure le tableau, qui la recouvre de x = 566 à 1366 :
# seule la mer de part et d'autre bouge. R = mer (255 = la houle s'y applique, fondu vers les rochers, la digue, le ponton
# et le ciel). Le reste (sous le tableau, piliers, bateau, digue, ponton, ciel) vaut 0.
# usage : python3 scripts/cuvette-large-masque.py   (depuis la racine du dépôt)
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd

D = 'public/art/district/'
im = np.asarray(Image.open(D + 'cuvette-large.webp').convert('RGB')).astype(float)
H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]
lum = (r + g + b) / 3
Y, X = np.mgrid[0:H, 0:W]

terre = np.zeros((H, W), bool)
terre[:, 560:1372] = True                                   # sous le tableau (il a sa propre houle)
# la digue et les maisons qui dépassent du tableau à droite, puis le ponton du Port
poly = Image.new('L', (W, H), 0)
ImageDraw.Draw(poly).polygon([(1366, 0), (1515, 0), (1520, 120), (1560, 230), (1555, 330), (1585, 380), (1590, 560),
                              (1545, 590), (1545, 760), (1515, 800), (1495, 880), (1440, 950), (1385, 955), (1440, 975),
                              (1820, 1150), (1911, 1170), (1911, 1200), (1366, 1200)], fill=1)
terre |= np.asarray(poly) > 0
# le ciel du couchant, en haut à droite
terre |= (X > 1480) & (Y < 70 + (X - 1480) * .02)
# piliers et bateau : les pixels qui ne sont pas de l'eau, dans leur boîte
def boite(x0, y0, x1, y1, seuil=20):
    z = (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1)
    pierre = (g - r < seuil) | (lum < 45)
    a = nd.binary_closing(z & pierre, iterations=3)
    return nd.binary_fill_holes(nd.binary_opening(a, iterations=2))
terre |= boite(105, 50, 300, 245)                            # les deux piliers de gauche
# à droite, dans la lumière du couchant, l'eau a la couleur des pierres : bateau et piliers sont détourés à la main
formes = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(formes)
d.polygon([(1690, 64), (1714, 118), (1724, 150), (1702, 166), (1658, 160), (1666, 128)], fill=1)          # le bateau
d.polygon([(1758, 205), (1776, 196), (1803, 198), (1810, 232), (1816, 316), (1786, 324), (1756, 320)], fill=1)  # pilier
d.polygon([(1852, 226), (1880, 214), (1911, 212), (1911, 338), (1854, 333)], fill=1)                       # dernier pilier
terre |= np.asarray(formes) > 0
# une petite marge, puis un fondu : la houle s'éteint doucement contre ce qui ne bouge pas
terre = nd.binary_dilation(terre, iterations=3)
mer = np.asarray(Image.fromarray((~terre * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(float)
mer[:, 566:1366] = 0
out = np.zeros((H, W, 3), np.uint8)
out[..., 0] = mer.astype(np.uint8)
Image.fromarray(out).save(D + 'cuvette-large-mer.webp', lossless=True)
print('écrit', D + 'cuvette-large-mer.webp')
