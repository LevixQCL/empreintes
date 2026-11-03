import numpy as np,cv2,json,os
from PIL import Image
from formes import BAS,HAUT
B=np.array(Image.open('bat.webp').convert('RGB')).astype(np.float32)
N=np.array(Image.open('nue.webp').convert('RGB')).astype(np.float32)
H,W=B.shape[:2];M=np.load('mid.npz');POS=json.load(open('zooms/positions.json'))
S=800/1643;ZF=np.load('zones.npy',allow_pickle=True).item();PY={'tour':1095,'labo':1215,'forge':1235,'clinique':1545,'comptoir':1630,'generateur':1705,'port':2340}
MD={j:cv2.dilate(M[j].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))>0 for j in M.files}
os.makedirs('calques',exist_ok=True)
out={};compo={'bas':B.copy(),'haut':B.copy()};regions={}
for pal,F in (('bas',BAS),('haut',HAUT)):
  for k in sorted(F,key=lambda k:PY[k]):
    x0,y0=POS[f'{k}-{pal}']
    Z=np.array(Image.open(f'zooms/{k}-{pal}.png'))
    A=np.array(Image.open(f'mj/{k}-{pal}.png').convert('RGB').resize((756,756),Image.LANCZOS)).astype(np.float32)
    zone=(Z[...,3]==0).astype(np.uint8)
    reg=zone.copy()
    if pal=='bas':
        mid=cv2.dilate(M[k].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(19,19)))[y0:y0+756,x0:x0+756]
        reg|=mid
    # ce que Midjourney a vraiment changé autour de la zone (ombres, raccords) : jusqu'à 30 px
    d=cv2.GaussianBlur(np.abs(A-Z[...,:3].astype(np.float32)).sum(2),(0,0),2)
    proche=cv2.dilate(reg,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(61,61)))
    reg=reg|((d>70)&(proche>0)).astype(np.uint8)
    reg=cv2.dilate(reg,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
    sl=(slice(y0,y0+756),slice(x0,x0+756))
    autres=np.zeros((756,756),bool);devant=np.zeros((756,756),bool)
    for j in M.files:
        if j==k: continue
        autres|=MD[j][sl]|ZF[f'{j}-bas'][sl]|ZF[f'{j}-haut'][sl]
        if PY[j]>PY[k]: devant|=MD[j][sl]
    zk=cv2.dilate(zone,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))>0
    reg=((zk&~devant)|((reg>0)&~autres)).astype(np.uint8)
    reg[:6]=0;reg[-6:]=0;reg[:,:6]=0;reg[:,-6:]=0
    a=np.clip((cv2.GaussianBlur(reg.astype(np.float32),(0,0),3.5)-.1)/.8,0,1)
    # dans le tableau complet
    full=np.zeros((H,W),np.float32);full[y0:y0+756,x0:x0+756]=a
    img=np.zeros((H,W,3),np.float32);img[y0:y0+756,x0:x0+756]=A
    regions[f'{k}-{pal}']=(full,img)
    c=compo[pal];c[:]=img*full[...,None]+c*(1-full[...,None])
    # en coordonnées du jeu (tableau 800 x 1200 = x 120..1763 de l'image complète)
    ys,xs=np.nonzero(full>0.01);bx0,bx1,by0,by1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    gx0=int(np.floor((bx0-120)*S));gy0=int(np.floor(by0*S));gx1=int(np.ceil((bx1-120)*S));gy1=int(np.ceil(by1*S))
    fx0=gx0/S+120;fy0=gy0/S;fx1=gx1/S+120;fy1=gy1/S
    # rééchantillonner la zone exacte
    rgba=np.dstack([img,full*255]).astype(np.float32)
    crop=cv2.resize(rgba[int(fy0):int(np.ceil(fy1)),int(fx0):int(np.ceil(fx1))],(gx1-gx0,gy1-gy0),interpolation=cv2.INTER_AREA)
    Image.fromarray(np.clip(crop,0,255).astype(np.uint8),'RGBA').save(f'calques/{k}-{pal}.webp',quality=90,method=6)
    out[f'{k}-{pal}']=(gx0,gy0,gx1-gx0,gy1-gy0)
json.dump(out,open('calques/positions.json','w'))
print(out)
for pal in compo: Image.fromarray(compo[pal].astype(np.uint8)).save(f'/tmp/compo-{pal}.png')
np.save('regions.npy',{k:(v[0]>0.01) for k,v in regions.items()},allow_pickle=True)
