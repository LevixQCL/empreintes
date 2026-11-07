"""Héberge les polices du jeu sur le site (7 novembre 2026) au lieu de Google Fonts.

Avant, chaque joueur envoyait son adresse IP à Google en ouvrant le jeu (un tribunal allemand l'a jugé contraire
au RGPD en 2022) et le jeu ne démarrait pas proprement hors ligne. On copie les fichiers des paquets Fontsource
(mêmes polices, même licence OFL) dans public/fonts/ et on écrit public/fonts/polices.css.

usage : python3 scripts/polices.py <dossier où les paquets ont été décompressés>
   les paquets : npm pack @fontsource/saira-semi-condensed @fontsource/ibm-plex-sans-condensed
                 @fontsource/marcellus-sc @fontsource-variable/literata, puis tar xzf chacun dans son dossier.
Seuls l'alphabet latin et le latin étendu sont gardés (le navigateur ne charge le second que s'il en a besoin).
"""
import re
import shutil
import sys
from pathlib import Path

SOURCE = Path(sys.argv[1])
RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / 'public' / 'fonts'
SOUS_ENSEMBLES = ('latin', 'latin-ext')

# (paquet, feuilles CSS du paquet, nom de famille voulu dans le jeu)
POLICES = [
    ('saira-semi-condensed', ['400.css', '500.css', '600.css', '700.css'], 'Saira Semi Condensed'),
    ('ibm-plex-sans-condensed', ['400.css', '500.css', '600.css'], 'IBM Plex Sans Condensed'),
    ('marcellus-sc', ['400.css'], 'Marcellus SC'),
    # Literata : la version variable (graisse et taille optique), droite et italique
    ('literata', ['opsz.css', 'opsz-italic.css'], 'Literata'),
]


def paquet(nom: str) -> Path:
    trouve = sorted(SOURCE.glob(f'fontsource*-{nom}-*/package'))
    if not trouve:
        sys.exit(f'paquet introuvable pour {nom} dans {SOURCE}')
    return trouve[-1]


def main() -> None:
    if SORTIE.exists():
        shutil.rmtree(SORTIE)
    SORTIE.mkdir(parents=True)
    blocs: list[str] = ['/* Polices du jeu, hébergées sur le site : écrit par scripts/polices.py, ne pas retoucher à la main. */']
    for nom, feuilles, famille in POLICES:
        dossier = paquet(nom)
        for feuille in feuilles:
            css = (dossier / feuille).read_text(encoding='utf-8')
            for bloc in re.findall(r'/\* ([^*]+) \*/\s*(@font-face\s*\{.*?\})', css, re.S):
                etiquette, regle = bloc
                if not any(etiquette.startswith(f'{nom}-{s}-') for s in SOUS_ENSEMBLES):
                    continue
                # on ne garde que le woff2 (tous les navigateurs actuels le lisent)
                fichiers = re.findall(r'url\(\./files/([^)]+\.woff2)\)', regle)
                for f in fichiers:
                    shutil.copy(dossier / 'files' / f, SORTIE / f)
                regle = re.sub(r"font-family: '[^']+';", f"font-family: '{famille}';", regle)
                regle = re.sub(r'src: [^;]+;', lambda m: 'src: ' + ', '.join(
                    f"url(./{f}) format('woff2')" for f in fichiers) + ';', regle)
                blocs.append(f'/* {etiquette} */\n{regle}')
    (SORTIE / 'polices.css').write_text('\n\n'.join(blocs) + '\n', encoding='utf-8')
    total = sum(p.stat().st_size for p in SORTIE.glob('*.woff2'))
    print(f'{len(blocs) - 1} @font-face, {len(list(SORTIE.glob("*.woff2")))} fichiers, {total // 1024} Ko')


if __name__ == '__main__':
    main()
