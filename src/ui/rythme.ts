// Le rythme commun du combat (12 novembre 2026).
// Chaque animation avait sa durée et sa courbe, choisies au cas par cas (17 durées et 10 courbes rien que pour les effets) :
// rien ne bougeait « pareil », d'où une impression de bricolage. Tout le combat partage maintenant trois durées et trois courbes.
// Les mêmes valeurs existent en CSS (combat.css : --vif, --net, --ample, --entree, --sortie, --ressort).

/** un geste sec : un appui, un éclair, une carte qui s'avance */
export const VIF = 140;
/** un geste normal : une carte qui glisse, un recul, une poussée de l'écran */
export const NET = 260;
/** un geste ample : une carte distribuée, une lueur qui retombe ; les grands moments durent deux fois plus */
export const AMPLE = 440;

/** ce qui arrive : part vite, se pose doucement */
export const ENTREE = 'cubic-bezier(.2,.8,.3,1)';
/** ce qui s'en va ou prend son élan : part doucement, file */
export const SORTIE = 'cubic-bezier(.55,0,.9,.45)';
/** ce qui se pose avec du poids : dépasse un peu, puis revient */
export const RESSORT = 'cubic-bezier(.3,1.45,.5,1)';
