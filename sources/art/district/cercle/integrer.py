# Intègre les trois paliers du Cercle des quais peints par Bryan (3 novembre 2026) : calques du tableau, lueurs, éclats, feuilles.
import numpy as np,cv2,json
from PIL import Image
B=np.array(Image.open('bat.webp').convert('RGB')).astype(np.float32)
H,W=B.shape[:2];M=np.load('mid.npz');POS=json.load(open('positions.json'))
S=800/1643;R='/home/claude/empreintes/public/art/'
PY={'tour':1095,'labo':1215,'forge':1235,'clinique':1545,'comptoir':1630,'generateur':1705,'port':2340}
MD={j:cv2.dilate(M[j].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))>0 for j in M.files}
labo=cv2.dilate(M['labo'].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(19,19)))
out={};feuilles={}
for pal in ('bas','milieu','haut'):
    x0,y0=POS[pal];sl=(slice(y0,y0+756),slice(x0,x0+756))
    Z=np.array(Image.open(f'cercle-{pal}.png'))
    A=np.array(Image.open(f'mj/{pal}.png').convert('RGB').resize((756,756),Image.LANCZOS)).astype(np.float32)
    zone=(Z[...,3]==0).astype(np.uint8)
    reg=zone|labo[sl]
    d=cv2.GaussianBlur(np.abs(A-Z[...,:3].astype(np.float32)).sum(2),(0,0),2)
    proche=cv2.dilate(reg,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(61,61)))
    reg=reg|((d>70)&(proche>0)).astype(np.uint8)
    reg=cv2.dilate(reg,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
    autres=np.zeros((756,756),bool);devant=np.zeros((756,756),bool)
    for j in M.files:
        if j=='labo': continue
        autres|=MD[j][sl]
        if PY[j]>1215: devant|=MD[j][sl]
    zk=cv2.dilate(zone,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))>0
    reg=((zk&~devant)|((reg>0)&~autres)).astype(np.uint8)
    reg[:6]=0;reg[-6:]=0;reg[:,:6]=0;reg[:,-6:]=0
    a=np.clip((cv2.GaussianBlur(reg.astype(np.float32),(0,0),3.5)-.1)/.8,0,1)
    full=np.zeros((H,W),np.float32);full[sl]=a
    img=np.zeros((H,W,3),np.float32);img[sl]=A
    ys,xs=np.nonzero(full>0.01);bx0,bx1,by0,by1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    gx0=int(np.floor((bx0-120)*S));gy0=int(np.floor(by0*S));gx1=int(np.ceil((bx1-120)*S));gy1=int(np.ceil(by1*S))
    fx0=gx0/S+120;fy0=gy0/S;fx1=gx1/S+120;fy1=gy1/S
    rgba=np.dstack([img,full*255]).astype(np.float32)
    crop=cv2.resize(rgba[int(fy0):int(np.ceil(fy1)),int(fx0):int(np.ceil(fx1))],(gx1-gx0,gy1-gy0),interpolation=cv2.INTER_AREA)
    Image.fromarray(np.clip(crop,0,255).astype(np.uint8),'RGBA').save(f'{R}district/paliers/cercle-{pal}.webp',quality=90,method=6)
    out[pal]=[gx0,gy0,gx1-gx0,gy1-gy0]
    # la lueur des cristaux (comme extras.py) : seulement dans la silhouette du bâtiment
    c=crop.astype(np.float32);r,g,b,al=[c[...,i] for i in range(4)]
    zc=np.zeros((H,W),np.uint8);zc[sl]=zone
    zc=zc[int(fy0):int(np.ceil(fy1)),int(fx0):int(np.ceil(fx1))]
    zc=cv2.resize(cv2.dilate(zc,np.ones((9,9),np.uint8)),(gx1-gx0,gy1-gy0),interpolation=cv2.INTER_NEAREST)
    m=((al>200)&(b>150)&(b>r+60)&(g>110)).astype(np.uint8)*zc
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
    n,lab,st,cen=cv2.connectedComponentsWithStats(m)
    blobs=sorted([i for i in range(1,n) if st[i,4]>=12],key=lambda i:-st[i,4])
    keep=np.isin(lab,blobs).astype(np.float32)
    coeur=cv2.GaussianBlur(keep,(0,0),.8);halo=cv2.GaussianBlur(keep,(0,0),5)*1.6
    alp=np.clip(np.maximum(coeur,halo*.55),0,1)
    col=np.clip(c[...,:3]*keep[...,None]*1.25+np.array([120,230,255])*(1-keep[...,None]),0,255)
    Image.fromarray(np.dstack([col,alp*255]).astype(np.uint8),'RGBA').save(f'{R}district/paliers/cercle-{pal}-lueur.webp',quality=88,method=6)
    out[pal+'-eclats']=[[round((gx0+cen[i][0])/2),round((gy0+cen[i][1])/2)] for i in blobs[:2]]
    # la zone cliquable (repère 400 x 600) : l'enveloppe de la silhouette
    cs,_=cv2.findContours(zone,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    big=max(cs,key=cv2.contourArea).reshape(-1,2).astype(np.float32)
    pts=np.stack([(big[:,0]+x0-120)*S/2,(big[:,1]+y0)*S/2],1)
    hull=cv2.approxPolyDP(cv2.convexHull(pts).reshape(-1,1,2),2.5,True).reshape(-1,2)
    out[pal+'-zone']=' '.join(f'{round(x)},{round(y)}' for x,y in hull)
    # la feuille du bâtiment : la sortie Midjourney détourée par sa silhouette
    sil=cv2.dilate(zone,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13))).astype(np.float32)
    sa=np.clip((cv2.GaussianBlur(sil,(0,0),2.2)-.15)/.7,0,1)
    yy,xx=np.where(sa>0.02);im=Image.fromarray(np.dstack([A,sa*255]).astype(np.uint8)[yy.min():yy.max()+1,xx.min():xx.max()+1],'RGBA')
    cc=max(im.size)+40;can=Image.new('RGBA',(cc,cc));can.paste(im,((cc-im.width)//2,(cc-im.height)//2));can=can.resize((520,520),Image.LANCZOS)
    for v in {'bas':[1],'milieu':[2],'haut':[3,4]}[pal]: can.save(f'{R}batiments/cercle-{v}.webp',quality=90,method=6)
    if pal=='milieu': can.save(f'{R}batiments/cercle.webp',quality=90,method=6)
json.dump(out,open('calques.json','w'),indent=1);print(json.dumps(out))
# aperçu : les trois paliers posés sur le tableau du jeu
T=Image.open('/home/claude/empreintes/public/art/district/cuvette.webp').convert('RGBA')
ap=[]
for pal in ('bas','milieu','haut'):
    t=T.copy();x,y,w,h=out[pal];t.alpha_composite(Image.open(f'{R}district/paliers/cercle-{pal}.webp'),(x,y))
    ap.append(t.crop((420,330,800,760)))
S2=Image.new('RGB',(380*3+20,430));[S2.paste(im,(i*390,0)) for i,im in enumerate(ap)];S2.save('/tmp/apercu-cercle.png')
