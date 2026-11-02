import numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
o=304
m=np.load('mbat.npy')
D=np.array(Image.open('district-vide.png').convert('RGB')).astype(np.float32)
H,W=m.shape
lab,n=ndi.label(m)
ombre=np.zeros((H,W),np.uint8);contact=np.zeros((H,W),np.float32)
for i in range(1,n+1):
    c=(lab==i)
    ys,xs=np.nonzero(c)
    # bas de la silhouette par colonne = sol
    bas=np.full(W,-1);np.maximum.at(bas,xs,ys)
    h=bas[xs]-ys
    gx=xs-0.75*h; gy=bas[xs]+0.12*h
    pts=np.stack([gx,gy],1).astype(np.int32)
    s=np.zeros((H,W),np.uint8)
    s[np.clip(pts[:,1],0,H-1),np.clip(pts[:,0],0,W-1)]=1
    s=cv2.morphologyEx(s,cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))
    # relier au pied
    pied=np.zeros_like(s);pied[bas[bas>=0],np.nonzero(bas>=0)[0]]=1
    s=cv2.dilate(s|pied,np.ones((5,5),np.uint8))
    s=ndi.binary_fill_holes(cv2.morphologyEx(s,cv2.MORPH_CLOSE,np.ones((25,25),np.uint8))).astype(np.uint8)
    ombre|=s
    cb=np.zeros((H,W),np.float32);cv2.ellipse(cb,(0,0),(0,0),0,0,0,0)
    xm=np.nonzero(bas>=0)[0];
    for x in xm[::2]: cv2.circle(cb,(int(x),int(bas[x])),9,1,-1)
    contact=np.maximum(contact,cb)
libre=1-cv2.dilate(m,np.ones((3,3),np.uint8))
a=cv2.GaussianBlur(ombre.astype(np.float32),(0,0),7)*0.55
a=np.maximum(a,cv2.GaussianBlur(contact,(0,0),6)*0.7)*libre
C=D[:,o:o+1856]
teinte=np.array([0.55,0.5,0.55])
C[:]=C*(1-a[...,None])+C*teinte*a[...,None]
D[:,o:o+1856]=C
Image.fromarray(D.astype(np.uint8)).save('district-ombres.png')
Image.fromarray(D.astype(np.uint8)).crop((304+200,600,304+1700,1650)).resize((900,630)).save('ombres-vue.png')
