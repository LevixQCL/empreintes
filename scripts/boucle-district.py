"""
Prépare la boucle animée d'un tableau du district (23 octobre 2026) à partir d'une animation Midjourney.

Les animations de Midjourney inventent des choses (un personnage, un objet qui apparaît) et vont trop vite. On ne garde donc
de la vidéo que ce qu'elle fait bien : la mer, le bateau, les ailes du moulin. Partout ailleurs (Tour, Forge, Clinique,
Comptoir, Labo), c'est le tableau fixe, net, qui reste affiché : rien d'inventé ne peut s'y glisser.

Étapes :
1. ralentir la vidéo (images intermédiaires calculées par ffmpeg, mouvement compensé) : LENTEUR fois plus lente ;
2. agrandir chaque image à la taille du tableau (800 x 1200) ;
3. composer : tableau fixe sur les bâtiments listés dans FIXES (contours de district.ts, élargis et fondus), vidéo ailleurs ;
4. boucler sans à-coup : la fin de la vidéo se fond dans son début (FONDU images).

Usage : python3 scripts/boucle-district.py AGE video.mp4   -> public/art/district/age-AGE.mp4
(ffmpeg, numpy, Pillow)
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RACINE = Path(__file__).resolve().parent.parent
DISTRICT = RACINE / 'public' / 'art' / 'district'
W, H = 800, 1200
LENTEUR = 2          # la vidéo dure LENTEUR fois plus longtemps
FONDU = 36           # images de fondu entre la fin et le début de la boucle
# les lieux qui restent le tableau fixe (le Générateur et le Port bougent : ailes du moulin, bateau)
FIXES = ['noyau', 'forge', 'clinique', 'comptoir', 'labo']


def zones(age: int) -> dict[str, list[tuple[float, float]]]:
    """Les contours des lieux, relus dans src/ui/district.ts (repère 400 x 600)"""
    src = (RACINE / 'src' / 'ui' / 'district.ts').read_text(encoding='utf-8')
    bloc = src[src.index('const ZONES_234'):src.index('function zonesBatiments')]
    if age == 1:
        bloc = bloc[bloc.index('  1: {'):]
        bloc = bloc[:bloc.index('},') + 1]
    else:
        bloc = bloc[:bloc.index('};')]
    out = {}
    for nom, pts in re.findall(r"(\w+): '([\d, ]+)'", bloc):
        out[nom] = [tuple(float(v) for v in p.split(',')) for p in pts.split()]
    return out


def masque(age: int) -> np.ndarray:
    """1 là où la vidéo s'affiche, 0 là où le tableau fixe reste (bords fondus)"""
    m = Image.new('L', (W, H), 255)
    d = ImageDraw.Draw(m)
    k = W / 400
    for nom, pts in zones(age).items():
        if nom in FIXES:
            d.polygon([(x * k, y * k) for x, y in pts], fill=0)
    m = m.filter(ImageFilter.MinFilter(9))           # le fixe déborde un peu des contours
    m = m.filter(ImageFilter.GaussianBlur(10))       # et se fond dans la mer
    return np.asarray(m, np.float32)[..., None] / 255


def main(age: int, video: str) -> None:
    tableau = np.asarray(Image.open(DISTRICT / f'age-{age}.webp').convert('RGB').resize((W, H), Image.LANCZOS), np.float32)
    mv = masque(age)
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        # 1. ralentir (images intermédiaires à mouvement compensé), garder 24 images/s
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf',
                        f'minterpolate=fps={24 * LENTEUR}:mi_mode=mci:mc_mode=aobmc:vsbmc=1,setpts={LENTEUR}*PTS,fps=24,scale={W}:{H}:flags=lanczos',
                        str(t / 'i%04d.png')], check=True)
        images = sorted(t.glob('i*.png'))
        n = len(images)
        lire = lambda i: np.asarray(Image.open(images[i]).convert('RGB'), np.float32)
        # la vidéo de Midjourney est un peu plus sombre que le tableau : on aligne sa couleur moyenne sur lui (côté mer)
        ref = lire(0)
        gain = ((tableau * mv).sum((0, 1)) / mv.sum()) / ((ref * mv).sum((0, 1)) / mv.sum())
        for i in range(n - FONDU):
            img = lire(i)
            if i < FONDU:
                a = (i + 1) / (FONDU + 1)
                img = lire(n - FONDU + i) * (1 - a) + img * a
            img = np.clip(img * gain, 0, 255)
            out = img * mv + tableau * (1 - mv)
            Image.fromarray(out.astype(np.uint8)).save(t / f'o{i:04d}.png')
        sortie = DISTRICT / f'age-{age}.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', str(t / 'o%04d.png'),
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', '-an',
                        str(sortie)], check=True)
        print(sortie.name, f'{(n - FONDU) / 24:.1f} s', sortie.stat().st_size // 1024, 'Ko')


if __name__ == '__main__':
    main(int(sys.argv[1]), sys.argv[2])
