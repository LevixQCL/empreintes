import numpy as np,cv2
from PIL import Image
from formes import *
B=np.array(Image.open('bat.webp').convert('RGB')).astype(np.float32)
N=np.array(Image.open('nue.webp').convert('RGB')).astype(np.float32)
H,W=B.shape[:2];M=np.load('mid.npz')
os=__import__('os');os.makedirs('zooms',exist_ok=True);os.makedirs('apercus',exist_ok=True)
info={}
for pal,F in (('bas',BAS),('haut',HAUT)):
  for k,f in F.items():
    z=np.zeros((H,W),np.uint8);f(z)
    mid=cv2.dilate(M[k].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(19,19)))
    if pal=='bas':
        a=cv2.GaussianBlur(mid.astype(np.float32),(0,0),3)[...,None]
        base=N*a+B*(1-a); zone=z>0
    else:
        base=B; zone=(z>0)|(cv2.dilate(M[k].astype(np.uint8),np.ones((15,15),np.uint8))>0)
    zone=cv2.morphologyEx(zone.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))>0
    ys,xs=np.nonzero(zone);cx=(xs.min()+xs.max())//2;cy=(ys.min()+ys.max())//2
    x0=int(np.clip(cx-378,0,W-756));y0=int(np.clip(cy-400,0,H-756))
    assert xs.min()>=x0+15 and xs.max()<=x0+741 and ys.min()>=y0+15 and ys.max()<=y0+741,(k,pal,xs.min()-x0,xs.max()-x0,ys.min()-y0,ys.max()-y0)
    c=base[y0:y0+756,x0:x0+756].astype(np.uint8);al=np.where(zone[y0:y0+756,x0:x0+756],0,255).astype(np.uint8)
    Image.fromarray(np.dstack([c,al])).save(f'zooms/{k}-{pal}.png')
    v=c.astype(np.float32).copy();v[al==0]=v[al==0]*0.25+np.array([255,40,200])*0.75
    Image.fromarray(v.astype(np.uint8)).resize((378,378)).save(f'apercus/{k}-{pal}.png')
    info[f'{k}-{pal}']=(x0,y0)
print(info)
import json;json.dump(info,open('zooms/positions.json','w'),indent=1)
# planche
ks=list(BAS)
S=Image.new('RGB',(378*2+10,378*7+60),(20,20,20))
for i,k in enumerate(ks):
  for j,p in enumerate(('bas','haut')): S.paste(Image.open(f'apercus/{k}-{p}.png'),(j*388,i*(378+8)))
S.save('/tmp/planche.png')
