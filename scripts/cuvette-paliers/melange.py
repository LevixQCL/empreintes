# compose un tableau avec un palier au choix par bâtiment, comme le jeu (calques posés sur cuvette.webp)
import json,sys
from PIL import Image
P=json.load(open('calques/positions.json'));PY=['tour','labo','forge','clinique','comptoir','generateur','port']
T=Image.open('/home/claude/empreintes/public/art/district/cuvette.webp').convert('RGBA')
choix=dict(a.split('=') for a in sys.argv[2:])
for k in PY:
  p=choix.get(k,'milieu')
  if p=='milieu': continue
  x,y,w,h=P[f'{k}-{p}'];T.alpha_composite(Image.open(f'calques/{k}-{p}.webp').convert('RGBA'),(x,y))
T.convert('RGB').save(sys.argv[1])
