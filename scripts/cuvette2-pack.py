import numpy as np,cv2
from PIL import Image
a=np.array(Image.open('cuvette2-nue.png'));H,W=a.shape[:2]
def cyl(z,cx,cy,rx,top,k=.5):
    ry=int(rx*k);cv2.ellipse(z,(cx,cy),(rx,ry),0,0,360,255,-1);cv2.rectangle(z,(cx-rx,top),(cx+rx,cy),255,-1);cv2.ellipse(z,(cx,top),(rx,ry),0,0,360,255,-1)
def rect(z,x1,y1,x2,y2):cv2.rectangle(z,(x1,y1),(x2,y2),255,-1)
def ell(z,cx,cy,rx,ry):cv2.ellipse(z,(cx,cy),(rx,ry),0,0,360,255,-1)
B={}
def forge(z,cx,cy):   # corps trapu, grande cheminée à l'arrière, bras de marteau-pilon
    cyl(z,cx,cy,135,cy-150);rect(z,cx-95,cy-420,cx-45,cy-120);ell(z,cx-70,cy-420,40,20);rect(z,cx+60,cy-260,cx+85,cy-120);rect(z,cx+40,cy-275,cx+170,cy-250);rect(z,cx+140,cy-250,cx+170,cy-190)
def clinique(z,cx,cy):  # pavillon long et bas + petite tour-lanterne
    cyl(z,cx,cy,150,cy-90,.45);cyl(z,cx+85,cy-20,40,cy-230)
def labo(z,cx,cy):      # bunker large + cloche décalée + bras de lentille
    cyl(z,cx,cy,140,cy-110);cyl(z,cx-40,cy-80,55,cy-250);rect(z,cx+70,cy-220,cx+92,cy-90);ell(z,cx+81,cy-225,28,18)
def generateur(z,cx,cy):  # corps large et bas, turbines, colonne de cristal fine
    cyl(z,cx,cy,145,cy-120,.5);ell(z,cx-150,cy-70,36,62);ell(z,cx+150,cy-70,36,62);cyl(z,cx+20,cy-90,30,cy-330);ell(z,cx+20,cy-330,40,20)
def comptoir(z,cx,cy):  # comptoir + grue à contrepoids et caisse
    cyl(z,cx,cy,135,cy-95);rect(z,cx-120,cy-330,cx-90,cy-60);rect(z,cx-160,cy-345,cx+120,cy-315);rect(z,cx-190,cy-355,cx-140,cy-290);rect(z,cx+90,cy-315,cx+100,cy-260);rect(z,cx+65,cy-262,cx+125,cy-205)
def port(z,cx,cy):      # capitainerie sur le ponton + barque amarrée
    cyl(z,cx,cy,95,cy-200,.5);ell(z,cx-30,cy-205,70,35);ell(z,cx-150,cy+90,140,55);rect(z,cx-160,cy-60,cx-140,cy+80)
L=[('2-forge',forge,560,1235),('3-clinique',clinique,536,1545),('4-labo',labo,1444,1215),('5-generateur',generateur,830,1705),('6-comptoir',comptoir,1264,1630),('7-port',port,1640,2150)]
ap=[]
for nom,f,cx,cy in L:
    z=np.zeros((H,W),np.uint8);f(z,cx,cy)
    x0=int(np.clip(cx-378,0,W-756));y0=int(np.clip(cy-500,0,H-756))
    c=a[y0:y0+756,x0:x0+756];al=255-z[y0:y0+756,x0:x0+756]
    Image.fromarray(np.dstack([c,al])).save(f'pack/{nom}.png')
    v=c.copy();v[al==0]=(v[al==0]*0.3+np.array([255,60,200])*0.7).astype(np.uint8)
    ap.append(Image.fromarray(v).resize((378,378)))
    B[nom]=(x0,y0,cx,cy)
S=Image.new('RGB',(1134,756))
for i,im in enumerate(ap):S.paste(im,((i%3)*378,(i//3)*378))
S.save('pack-apercu.png');print(B)
