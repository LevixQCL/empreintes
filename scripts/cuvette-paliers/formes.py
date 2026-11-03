import numpy as np,cv2
def cyl(z,cx,cy,rx,top,k=.5):
    ry=int(rx*k);cv2.ellipse(z,(cx,cy),(rx,ry),0,0,360,255,-1);cv2.rectangle(z,(cx-rx,top),(cx+rx,cy),255,-1);cv2.ellipse(z,(cx,top),(rx,ry),0,0,360,255,-1)
def rect(z,x1,y1,x2,y2):cv2.rectangle(z,(x1,y1),(x2,y2),255,-1)
def ell(z,cx,cy,rx,ry,a=0):cv2.ellipse(z,(cx,cy),(rx,ry),a,0,360,255,-1)
def poly(z,pts):cv2.fillPoly(z,[np.array(pts,np.int32)],255)
# ---------- PALIER BAS (niv. 1-3) : petit, récupéré, chantier ----------
def tour_bas(z):   # chevalement en bois au-dessus du puits + cabane du treuil
    cyl(z,966,1120,125,1050); poly(z,[(900,1060),(950,820),(985,820),(1035,1060)]); ell(z,967,815,40,22); rect(z,1040,990,1105,1110)
def forge_bas(z):  # forge en plein air : petit fourneau, tuyau, auvent
    cyl(z,560,1250,115,1150); rect(z,500,980,535,1160); ell(z,517,980,26,14); poly(z,[(450,1150),(470,1075),(640,1060),(670,1140)])
def clinique_bas(z):  # conteneur de soin récupéré sous bâche + une capsule
    cyl(z,545,1530,125,1460,.45); poly(z,[(430,1470),(470,1400),(620,1395),(660,1465)]); cyl(z,630,1500,30,1390)
def labo_bas(z):   # petit caisson blindé + une cloche de verre
    cyl(z,1444,1215,110,1130); cyl(z,1420,1150,40,1050); ell(z,1420,1050,40,20)
def generateur_bas(z):  # petite dynamo rapiécée + une turbine + tige de cristal
    cyl(z,825,1690,120,1590); ell(z,700,1650,32,55); cyl(z,850,1610,18,1450); ell(z,850,1450,24,14)
def comptoir_bas(z):  # étal sous bâche + petit mât de levage
    cyl(z,1260,1630,115,1555); poly(z,[(1140,1560),(1170,1490),(1350,1485),(1380,1555)]); rect(z,1340,1360,1356,1560); rect(z,1340,1360,1420,1374); rect(z,1395,1374,1430,1420)
def port_bas(z):   # cabane de pêcheur sur le ponton + petite barque
    cyl(z,1430,2300,60,2200,.5); poly(z,[(1360,2215),(1395,2165),(1470,2160),(1500,2205)]); rect(z,1488,2120,1498,2230); ell(z,1493,2118,12,12); ell(z,1715,2195,70,22,27)
# ---------- PALIER HAUT (niv. 8-10) : plus grand, plus de machines et de cristal ----------
def tour_haut(z):  # mêmes bases, gros chevalement d'acier à droite, convoyeur à gauche, couronne de cristal
    cyl(z,966,1110,170,1000); rect(z,830,600,1105,1100); ell(z,967,600,110,40); poly(z,[(1100,1060),(1150,720),(1215,720),(1250,1060)]); ell(z,1182,712,48,24); poly(z,[(820,1000),(700,860),(735,830),(840,950)])
def forge_haut(z): # deux fourneaux, grande cheminée, marteau-pilon plus haut
    cyl(z,560,1250,160,1060); rect(z,455,760,545,1080); ell(z,500,760,58,26); rect(z,590,880,720,1080); rect(z,700,850,730,1000); rect(z,650,830,790,860)
def clinique_haut(z):  # grand dôme de verre, deux ailes à capsules, flèche-lanterne à gauche
    cyl(z,545,1520,175,1360,.45); ell(z,545,1370,130,80); cyl(z,445,1440,32,1170); ell(z,445,1170,36,20); cyl(z,660,1470,40,1300)
def labo_haut(z):  # bunker élargi, double cloche à hélice plus haute, bras de lentille, antennes
    cyl(z,1444,1210,150,1060); cyl(z,1400,1120,62,880); ell(z,1400,880,62,28); rect(z,1510,920,1535,1090); ell(z,1522,915,34,22); rect(z,1340,940,1352,1060)
def generateur_haut(z):  # grande dynamo, 3 turbines, haute colonne de cristal, câbles
    cyl(z,825,1680,170,1530); ell(z,655,1610,40,75); ell(z,1000,1610,40,75); ell(z,740,1500,34,55); cyl(z,850,1520,34,1240); ell(z,850,1240,48,24)
def comptoir_haut(z):  # halle couverte à deux étages, grande grue, étals
    cyl(z,1260,1625,165,1440); poly(z,[(1095,1450),(1140,1370),(1380,1365),(1425,1445)]); rect(z,1360,1190,1385,1450); rect(z,1200,1180,1470,1205); rect(z,1440,1205,1480,1290)
def port_haut(z):  # capitainerie à étage + phare de cristal, grande barque
    cyl(z,1430,2290,85,2080,.5); cyl(z,1430,2090,40,1990); ell(z,1430,1990,44,22); ell(z,1720,2190,125,36,27); rect(z,1712,2060,1726,2190)
BAS={'tour':tour_bas,'forge':forge_bas,'clinique':clinique_bas,'labo':labo_bas,'generateur':generateur_bas,'comptoir':comptoir_bas,'port':port_bas}
HAUT={'tour':tour_haut,'forge':forge_haut,'clinique':clinique_haut,'labo':labo_haut,'generateur':generateur_haut,'comptoir':comptoir_haut,'port':port_haut}
