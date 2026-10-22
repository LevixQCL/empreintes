"""
Prolonge chaque tableau du district (public/art/district/age-N.webp, 800 x 1200) par une grande mer, pour l'écran PC
(22 octobre 2026). Bryan trouvait laid le flou autour du tableau : à la place, le ciel et la mer du tableau continuent
de chaque côté, jusqu'au bord de l'écran.

Principe :
- chaque ligne du ciel est prolongée avec la couleur des bords du tableau, qui rejoint peu à peu la couleur moyenne de la ligne ;
- sous l'horizon, la mer reprend la couleur de l'eau de chaque ligne (relevée sur les pixels d'eau, pas sur les îlots),
  et reçoit en perspective des aplats plus clairs et plus sombres (le cel-shading du tableau), des reflets fins près de
  l'horizon et quelques rides à l'encre ;
- le tableau est posé au centre et fondu dans la mer sur ses bords ;
- au-dessus du tableau, le ciel continue en s'assombrissant (utile si l'écran est plus haut que le tableau).

Sortie : public/art/district/mer-N.webp (4000 x 1500 ; le tableau occupe x 1600-2400, y 300-1500).
Usage : python3 scripts/mer-district.py   (numpy, scipy, Pillow)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter, map_coordinates, median_filter

RACINE = Path(__file__).resolve().parent.parent / 'public' / 'art' / 'district'
W, H = 4000, 1500           # la toile complète
PW, PH = 800, 1200          # le tableau
X0, Y0 = (W - PW) // 2, H - PH
# l'horizon de chaque tableau (en pixels du tableau), relevé à l'œil sur ses bords
HORIZONS = {1: 77, 2: 206, 3: 192, 4: 231}
RELAX = 300                 # distance (px) sur laquelle la couleur du bord rejoint la couleur moyenne de la ligne
FONDU = 170                 # largeur du fondu du tableau dans la mer


def bruit_tuile(n: int, sigma: float, graine: int) -> np.ndarray:
    """Bruit lisse qui se répète sans couture (n x n), normalisé dans [-1, 1]"""
    r = np.random.default_rng(graine).standard_normal((n, n))
    b = gaussian_filter(r, sigma, mode='wrap')
    return b / np.abs(b).max()


def couleurs_lignes(p: np.ndarray, horizon: int):
    """
    Couleur de chaque ligne.
    Ciel : la couleur des bords gauche et droit (le ciel est presque uni d'un côté à l'autre).
    Mer : une seule couleur par ligne, prise sur les pixels d'eau de toute la ligne (sans les îlots ni leurs reflets sombres),
    puis très lissée en profondeur : copier les bords donnait des bandes étirées.
    """
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    eau = (g > r + 6) & (b > r + 6)
    lum = p.mean(2)
    gauche = np.zeros((PH, 3)); droite = np.zeros((PH, 3)); ligne = np.zeros((PH, 3))
    for y in range(PH):
        rangee = p[y]
        if y < horizon:
            gauche[y] = np.median(rangee[:30], axis=0)
            droite[y] = np.median(rangee[-30:], axis=0)
            ligne[y] = (gauche[y] + droite[y]) / 2
        else:
            m = eau[y]
            if m.sum() > 30:
                px = rangee[m]
                # sans les reflets sombres des îlots : on garde l'eau entre les 35e et 85e centiles de luminosité
                l = lum[y][m]
                lo, hi = np.percentile(l, [35, 85])
                sel = (l >= lo) & (l <= hi)
                ligne[y] = px[sel].mean(axis=0) if sel.sum() > 10 else np.median(px, axis=0)
            else:
                ligne[y] = np.nan
    # la mer : les lignes sans eau reprennent leurs voisines, puis un lissage large en profondeur
    mer = ligne[horizon:]
    for c in range(3):
        col = mer[:, c]
        ok = ~np.isnan(col)
        col[~ok] = np.interp(np.flatnonzero(~ok), np.flatnonzero(ok), col[ok])
    # en profondeur, la couleur suit une courbe douce (polynôme de degré 2, pondéré vers le large) : plus de bandes ;
    # tout près de l'horizon on garde la mesure lissée, pour la brume claire du large
    n = len(mer)
    t = np.linspace(0, 1, n)
    lisse_mer = gaussian_filter(mer, sigma=(4, 0), mode='nearest')
    courbe = np.stack([np.polyval(np.polyfit(t, mer[:, c], 2), t) for c in range(3)], axis=1)
    poids = np.clip((np.arange(n) - 20) / 70, 0, 1)[:, None]
    ligne[horizon:] = lisse_mer * (1 - poids) + courbe * poids
    gauche[horizon:] = ligne[horizon:]
    droite[horizon:] = ligne[horizon:]
    # le ciel : un léger lissage, l'horizon reste net
    for c in (gauche, droite):
        c[:horizon] = gaussian_filter(median_filter(c[:horizon], size=(7, 1), mode='nearest'), sigma=(3, 0), mode='nearest')
    ligne[:horizon] = (gauche[:horizon] + droite[:horizon]) / 2
    return gauche, droite, ligne



def mer(age: int) -> Image.Image:
    tableau = Image.open(RACINE / f'age-{age}.webp').convert('RGB')
    p = np.asarray(tableau).astype(np.float32)
    horizon = HORIZONS[age]
    gauche, droite, ligne = couleurs_lignes(p, horizon)

    # ---------- 1. les aplats : chaque ligne du tableau continue sur les côtés ----------
    xs = np.arange(W)
    dist_g = np.clip(X0 - xs, 0, None)          # distance au bord gauche du tableau (0 dedans)
    dist_d = np.clip(xs - (X0 + PW - 1), 0, None)
    a_g = np.exp(-dist_g / RELAX)[None, :, None]
    a_d = np.exp(-dist_d / RELAX)[None, :, None]
    # dedans (au-dessus du tableau) : on passe d'un bord à l'autre ; dehors : chaque bord rejoint peu à peu la moyenne
    t = np.clip((xs - X0) / (PW - 1), 0, 1)[None, :, None]
    dedans = gauche[:, None, :] * (1 - t) + droite[:, None, :] * t
    dehors = np.where((xs < X0)[None, :, None], ligne[:, None, :] + (gauche[:, None, :] - ligne[:, None, :]) * a_g,
                      ligne[:, None, :] + (droite[:, None, :] - ligne[:, None, :]) * a_d)
    base_tab = np.where(((xs >= X0) & (xs < X0 + PW))[None, :, None], dedans, dehors)
    toile = np.zeros((H, W, 3), np.float32)
    toile[Y0:] = base_tab

    # sous l'horizon, près du tableau, la mer prend un peu de la couleur de ses bords (îlots et reflets compris, très lissée) :
    # la couture entre le tableau et la mer s'efface. Sous le tableau (caché, sauf dans son fondu), on passe d'un bord à l'autre.
    bord_g = gaussian_filter(p[:, :48].mean(axis=1), sigma=(30, 0), mode='nearest')
    bord_d = gaussian_filter(p[:, -48:].mean(axis=1), sigma=(30, 0), mode='nearest')
    tt = np.clip((xs - X0) / (PW - 1), 0, 1)[None, :, None]
    bord = np.where((xs < X0)[None, :, None], bord_g[:, None, :],
                    np.where((xs >= X0 + PW)[None, :, None], bord_d[:, None, :], bord_g[:, None, :] * (1 - tt) + bord_d[:, None, :] * tt))
    dist = np.maximum(dist_g, dist_d)
    poids = (0.6 * np.exp(-dist / 170))[None, :, None]
    sous_h = (np.arange(PH) >= horizon + 6)[:, None, None]
    toile[Y0:] = np.where(sous_h, toile[Y0:] * (1 - poids) + bord * poids, toile[Y0:])

    # au-dessus du tableau : le ciel continue et s'assombrit vers le zénith
    haut = toile[Y0].copy()
    zenith = haut * np.array([0.62, 0.7, 0.86]) + np.array([4, 10, 26])
    for y in range(Y0):
        t = ((Y0 - y) / Y0) ** 1.1
        toile[y] = haut * (1 - t) + zenith * t

    # ---------- 2. la mer en perspective : aplats clairs et sombres, comme le cel-shading du tableau ----------
    cy = Y0 + horizon                            # l'horizon sur la toile
    cx = W / 2
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dy = np.maximum(yy - cy, 0.5)
    sous = yy > cy
    # coordonnées au sol : la profondeur et la position latérale ; les vagues s'étirent de côté
    z = 9000.0 / dy
    X = (xx - cx) / dy * 90.0
    n1 = bruit_tuile(512, 14, 10 + age)
    n2 = bruit_tuile(512, 4, 30 + age)
    u = (X * 0.020) % 512                        # le long des vagues : basse fréquence
    v = (z * 0.55) % 512                         # en profondeur : plus serré
    a = map_coordinates(n1, [v.ravel(), u.ravel()], order=1, mode='wrap').reshape(H, W)
    b = map_coordinates(n2, [(z * 1.6 % 512).ravel(), (X * 0.05 % 512).ravel()], order=1, mode='wrap').reshape(H, W)
    champ = 0.75 * a + 0.35 * b
    # deux seuils, bords doux : des aplats nets plutôt qu'un dégradé
    lisse = lambda e0, e1, t: np.clip((t - e0) / (e1 - e0), 0, 1)
    clair = lisse(0.18, 0.42, champ)
    sombre = lisse(-0.20, -0.46, champ)
    # près de l'horizon le bruit devient trop fin : on l'efface sur les premiers pixels
    proche = lisse(4, 26, dy)
    teinte = (1 + 0.085 * clair - 0.09 * sombre)
    teinte = 1 + (teinte - 1) * proche
    toile = np.where(sous[..., None], toile * teinte[..., None], toile)

    img = Image.fromarray(np.clip(toile, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img, 'RGBA')
    rng = np.random.default_rng(100 + age)

    # ---------- 3. les reflets près de l'horizon : des traits qui s'effilent aux deux bouts ----------
    lueur = np.clip(np.median(p[max(0, horizon - 14):horizon - 2].reshape(-1, 3), axis=0) * 1.05 + 10, 0, 255)
    reflets = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(reflets)
    for _ in range(1100):
        prof = rng.uniform(0, 1) ** 2.2          # surtout tout près de l'horizon
        y = cy + 3 + prof * (H - cy) * 0.5
        x = rng.uniform(0, W)
        if X0 - 20 < x < X0 + PW + 20:
            continue
        long = (16 + rng.uniform(0, 120)) * (0.35 + prof * 2.4)
        alpha = 170 * (1 - prof) ** 1.4 * rng.uniform(0.35, 1)
        if alpha < 10:
            continue
        ep = 1 if prof < 0.2 else 2
        # trois tronçons : le cœur plus lumineux, les bouts plus pâles
        for k, (f0, f1, fa) in enumerate(((0, 1, 0.35), (0.18, 0.82, 0.65), (0.36, 0.64, 1.0))):
            dr.line([(x - long / 2 + long * f0, y), (x - long / 2 + long * f1, y)], fill=(*map(int, lueur), int(alpha * fa)), width=ep)
    reflets = reflets.filter(ImageFilter.GaussianBlur(0.7))
    img = Image.alpha_composite(img.convert('RGBA'), reflets).convert('RGB')
    d = ImageDraw.Draw(img, 'RGBA')

    # ---------- 4. quelques rides à l'encre, plus grandes au premier plan ----------
    for _ in range(420):
        prof = rng.uniform(0.08, 1) ** 1.3
        y = cy + prof * (H - cy)
        x = rng.uniform(0, W)
        if X0 - 60 < x < X0 + PW + 60:
            continue
        long = (10 + rng.uniform(0, 40)) * (0.4 + prof * 3)
        haut_ride = long * rng.uniform(0.04, 0.09)
        c = np.array(img.getpixel((int(np.clip(x, 0, W - 1)), int(np.clip(y, 0, H - 1)))), float)
        encre = tuple(int(v) for v in c * 0.7) + (int(150 * (0.35 + prof * 0.65)),)
        reflet = tuple(int(v) for v in np.clip(c * 1.16 + 10, 0, 255)) + (int(90 * (0.4 + prof * 0.6)),)
        larg = 1 if prof < 0.5 else 2
        d.arc([x - long / 2, y - haut_ride, x + long / 2, y + haut_ride], 200, 340, fill=encre, width=larg)
        d.arc([x - long / 2, y - haut_ride + larg + 1, x + long / 2, y + haut_ride + larg + 1], 205, 335, fill=reflet, width=1)

    img = img.filter(ImageFilter.GaussianBlur(0.6))

    # ---------- 5. le tableau au centre, fondu dans la mer sur ses bords ----------
    m = np.ones((PH, PW), np.float32)
    rampe = np.clip(np.arange(PW) / FONDU, 0, 1)
    rampe = rampe * rampe * (3 - 2 * rampe)
    m *= rampe[None, :] * rampe[::-1][None, :]
    haut_t = np.clip(np.arange(PH) / 70, 0, 1)
    m *= (haut_t * haut_t * (3 - 2 * haut_t))[:, None]
    masque = Image.fromarray((m * 255).astype(np.uint8))
    img.paste(tableau, (X0, Y0), masque)
    return img


def reflets() -> Image.Image:
    """
    Les reflets qui glissent sur la mer prolongée (calque transparent, se répète en largeur sans couture) :
    des traits clairs qui s'effilent, serrés et fins en haut (le large), plus longs et plus rares en bas.
    Posé en CSS de l'horizon jusqu'en bas, il défile lentement (bureau.css, .mer-reflets).
    """
    TW, TH = 1600, 600
    im = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rng = np.random.default_rng(7)
    for _ in range(900):
        prof = rng.uniform(0, 1) ** 1.8
        y = 2 + prof * (TH - 4)
        x = rng.uniform(0, TW)
        long = (14 + rng.uniform(0, 90)) * (0.35 + prof * 2.2)
        alpha = 150 * (1 - prof * 0.75) * rng.uniform(0.3, 1)
        ep = 1 if prof < 0.35 else 2
        for f0, f1, fa in ((0, 1, 0.3), (0.2, 0.8, 0.6), (0.38, 0.62, 1.0)):
            for dx in (0, -TW, TW):           # sans couture d'un bord à l'autre
                d.line([(x + dx - long / 2 + long * f0, y), (x + dx - long / 2 + long * f1, y)], fill=(255, 250, 235, int(alpha * fa)), width=ep)
    return im.filter(ImageFilter.GaussianBlur(0.6))


if __name__ == '__main__':
    r = reflets()
    r.save(RACINE / 'mer-reflets.webp', 'WEBP', quality=80, method=6)
    print('mer-reflets.webp', r.size, (RACINE / 'mer-reflets.webp').stat().st_size // 1024, 'Ko')
    for age in HORIZONS:
        im = mer(age)
        sortie = RACINE / f'mer-{age}.webp'
        im.save(sortie, 'WEBP', quality=78, method=6)
        print(sortie.name, im.size, sortie.stat().st_size // 1024, 'Ko')
