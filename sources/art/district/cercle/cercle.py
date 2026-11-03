import numpy as np,cv2,json
from PIL import Image
from formes import cyl,rect,ell,poly
B=np.array(Image.open('bat.webp').convert('RGB')).astype(np.float32)
N=np.array(Image.open('nue.webp').convert('RGB')).astype(np.float32)
H,W=B.shape[:2];M=np.load('mid.npz')
def bas(z):   # cercle tracé au sol, bancs de caisses, bâche sur perches, un mât
    cyl(z,1444,1218,130,1160); poly(z,[(1320,1150),(1350,1075),(1540,1070),(1570,1145)]); rect(z,1335,1075,1347,1180); rect(z,1543,1070,1555,1175); rect(z,1520,960,1532,1075); rect(z,1532,965,1580,995)
def milieu(z):  # pavillon ouvert : estrade ronde, piliers, large ombrelle de cuivre et verre, lanterne
    ell(z,1444,1218,150,60); rect(z,1294,1185,1594,1218); ell(z,1444,1185,150,55)
    for x in (1335,1392,1496,1553): rect(z,x-7,1050,x+7,1200)
    poly(z,[(1284,1075),(1444,990),(1604,1075)]); ell(z,1444,1075,160,32); cyl(z,1444,995,16,950); ell(z,1444,948,20,11)
def haut(z):  # grand pavillon : estrade large, six piliers, coupole haute, lanterne de cristal, deux mâts à bannières
    ell(z,1444,1218,168,66); rect(z,1276,1180,1612,1218); ell(z,1444,1180,168,60)
    for x in (1305,1360,1418,1470,1528,1583): rect(z,x-8,1030,x+8,1195)
    ell(z,1444,1040,178,36); poly(z,[(1270,1040),(1300,985),(1444,925),(1588,985),(1618,1040)]); ell(z,1444,960,95,50)
    cyl(z,1444,915,26,860); ell(z,1444,858,30,16)
    rect(z,1246,880,1258,1190); rect(z,1258,885,1290,960); rect(z,1630,880,1642,1190); rect(z,1598,885,1630,960)
mid=cv2.dilate(M['labo'].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(19,19)))
a=cv2.GaussianBlur(mid.astype(np.float32),(0,0),3)[...,None]
base=N*a+B*(1-a)
info={};ap=[]
for nom,f in (('bas',bas),('milieu',milieu),('haut',haut)):
    z=np.zeros((H,W),np.uint8);f(z);zone=cv2.morphologyEx(z,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))>0
    ys,xs=np.nonzero(zone);cx=(xs.min()+xs.max())//2;cy=(ys.min()+ys.max())//2
    x0=int(np.clip(cx-378,0,W-756));y0=int(np.clip(cy-400,0,H-756))
    assert xs.min()>=x0+15 and xs.max()<=x0+741 and ys.min()>=y0+15 and ys.max()<=y0+741
    c=base[y0:y0+756,x0:x0+756].astype(np.uint8);al=np.where(zone[y0:y0+756,x0:x0+756],0,255).astype(np.uint8)
    Image.fromarray(np.dstack([c,al])).save(f'cercle-{nom}.png')
    v=c.astype(np.float32).copy();v[al==0]=v[al==0]*0.25+np.array([255,40,200])*0.75
    ap.append(Image.fromarray(v.astype(np.uint8)).resize((300,300)));info[nom]=(x0,y0)
S=Image.new('RGB',(920,300));[S.paste(im,(i*310,0)) for i,im in enumerate(ap)];S.save('apercu.png')
json.dump(info,open('positions.json','w'));print(info)
