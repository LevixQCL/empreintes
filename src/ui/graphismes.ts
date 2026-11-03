// Les graphismes (3 novembre 2026). Bryan : « vachement lourd pour certains portables ».
// Deux réglages, gardés sur l'appareil, et un mode « Auto » qui choisit seul :
//  - Complets : tout ce qui bouge et brille (la Cuvette vivante, les paillettes des cartes, le verre flouté) ;
//  - Légers : les mêmes écrans, sans ce qui coûte le plus au processeur et à la carte graphique (la Cuvette reste peinte,
//    immobile ; les lueurs qui pulsent restent allumées mais ne pulsent plus ; le verre n'est plus flouté mais plus sombre).
// En Auto, le jeu passe en Légers sur un appareil qui dessine sans vraie carte graphique (WebGL logiciel), sur un appareil
// très modeste, ou quand il voit que l'écran n'arrive pas à suivre (moins de ~20 images par seconde au district).
// Le constat est gardé une semaine, puis l'appareil est remesuré (un pilote mis à jour, un portable branché…).
// Quel que soit le réglage, ce qui boucle sans fin s'arrête quand c'est hors de l'écran (une liste de cartes qu'on fait défiler).

export type Graphismes = 'auto' | 'complets' | 'legers';

const CLE = 'empreintes.graphismes';
const CLE_CONSTAT = 'empreintes.graphismes.constat';
const SEMAINE = 7 * 86_400_000;

const lire = (cle: string) => { try { return localStorage.getItem(cle); } catch { return null; } };
const ecrire = (cle: string, v: string | null) => { try { if (v === null) localStorage.removeItem(cle); else localStorage.setItem(cle, v); } catch { /* stockage indisponible */ } };

let reglage: Graphismes | null = null;
export const reglageGraphismes = (): Graphismes => {
  if (reglage) return reglage;
  const v = lire(CLE);
  return (reglage = v === 'complets' || v === 'legers' ? v : 'auto');
};

/** WebGL sans vraie carte graphique (dessiné par le processeur) : « major performance caveat » */
function webglLogiciel(): boolean {
  try {
    const c = document.createElement('canvas');
    const sans = c.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    if (sans) { (sans.getExtension('WEBGL_lose_context'))?.loseContext(); return false; }
    const avec = document.createElement('canvas').getContext('webgl');
    if (!avec) return false;
    (avec.getExtension('WEBGL_lose_context'))?.loseContext();
    return true;
  } catch { return false; }
}

/** Le constat de l'appareil (Auto) : déjà mesuré cette semaine, sinon deviné tout de suite et affiné en jouant */
let constat: boolean | null = null;
function appareilModeste(): boolean {
  if (constat !== null) return constat;
  const garde = lire(CLE_CONSTAT);
  if (garde) {
    const [v, le] = garde.split(':');
    if (Date.now() - Number(le) < SEMAINE) return (constat = v === 'leger');
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  constat = webglLogiciel() || (navigator.hardwareConcurrency || 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
  if (constat) ecrire(CLE_CONSTAT, `leger:${Date.now()}`);
  return constat;
}

/** Les graphismes allégés sont-ils en cours ? */
export const leger = (): boolean => {
  const r = reglageGraphismes();
  return r === 'legers' || (r === 'auto' && appareilModeste());
};

/** Applique le réglage à la page (classe « leger » sur <html>) */
export function appliquerGraphismes(): void {
  document.documentElement.classList.toggle('leger', leger());
}

/** Le bouton des Paramètres : Auto → Complets → Légers → Auto */
export function basculerGraphismes(): void {
  const suite: Record<Graphismes, Graphismes> = { auto: 'complets', complets: 'legers', legers: 'auto' };
  const v = suite[reglageGraphismes()];
  reglage = v;
  ecrire(CLE, v === 'auto' ? null : v);
  // repasser en Auto remesure l'appareil
  if (v === 'auto') { ecrire(CLE_CONSTAT, null); constat = null; }
  appliquerGraphismes();
}

/** Le texte du bouton : ce qui est choisi et, en Auto, ce que le jeu a décidé pour cet appareil */
export function texteGraphismes(): { valeur: string; detail: string } {
  const r = reglageGraphismes();
  if (r === 'complets') return { valeur: 'Complets', detail: 'Tout bouge et brille : la Cuvette vivante, les reflets des cartes, le verre flouté' };
  if (r === 'legers') return { valeur: 'Légers', detail: 'Pour un appareil qui chauffe ou rame : la Cuvette reste peinte, les lueurs ne pulsent plus' };
  return { valeur: 'Auto', detail: leger() ? 'Allégés sur cet appareil, qui peinait à suivre' : 'Complets sur cet appareil ; allégés tout seuls si l’écran peine à suivre' };
}

/**
 * Auto : l'écran n'arrive pas à suivre (relevé par la Cuvette vivante ou la mesure des images). On passe en Légers
 * pour la semaine, sans rien demander ; le joueur peut toujours choisir Complets dans les Paramètres.
 */
export function signalerLenteur(): void {
  if (reglageGraphismes() !== 'auto' || constat) return;
  constat = true;
  ecrire(CLE_CONSTAT, `leger:${Date.now()}`);
  appliquerGraphismes();
}

/** Auto, sans constat cette semaine : un appareil fluide est noté comme tel (on ne remesure plus avant une semaine) */
export function signalerFluide(): void {
  if (reglageGraphismes() !== 'auto' || constat || lire(CLE_CONSTAT)) return;
  constat = false;
  ecrire(CLE_CONSTAT, `complet:${Date.now()}`);
}

/**
 * La mesure des images (Auto) : au district, pendant ~4 secondes où rien d'autre ne se passe, on compte les images.
 * Moins de ~20 par seconde en moyenne (médiane des intervalles au-delà de 50 ms) : l'appareil peine.
 */
let mesureFaite = false;
export function mesurerFluidite(): void {
  if (mesureFaite || reglageGraphismes() !== 'auto' || appareilModeste() || lire(CLE_CONSTAT)) return;
  mesureFaite = true;
  const intervalles: number[] = [];
  let prec = 0;
  const debut = performance.now();
  const pas = (t: number) => {
    if (document.hidden) { mesureFaite = false; return; }
    // la première seconde ne compte pas (chargement des images, premier dessin)
    if (prec && t - debut > 1000) intervalles.push(t - prec);
    prec = t;
    if (t - debut < 5000) { requestAnimationFrame(pas); return; }
    if (intervalles.length < 10) { signalerLenteur(); return; }
    const tri = [...intervalles].sort((a, b) => a - b);
    const mediane = tri[Math.floor(tri.length / 2)]!;
    if (mediane > 50) signalerLenteur(); else signalerFluide();
  };
  requestAnimationFrame(pas);
}

// ---------- Ce qui boucle sans fin s'arrête hors de l'écran ----------

let veille: IntersectionObserver | null = null;

/**
 * Après chaque rendu : chaque animation CSS sans fin (lueurs, reflets, étincelles) est suspendue tant que la boîte qui la
 * porte est hors de l'écran. On observe le parent de l'élément animé : sa boîte ne bouge pas avec l'animation
 * (une étincelle qui monte hors de l'écran ne se figerait pas là-haut).
 */
let attente = 0;
export function suspendreHorsEcran(racine: HTMLElement): void {
  if (typeof IntersectionObserver === 'undefined' || typeof document.getAnimations !== 'function') return;
  // juste après l'image suivante : les styles sont alors à jour, la liste des animations ne coûte presque rien
  // (appelée tout de suite, elle forçait le navigateur à tout recalculer une fois de plus)
  const n = ++attente;
  requestAnimationFrame(() => setTimeout(() => { if (n === attente) suspendre(racine); }, 0));
}

function suspendre(racine: HTMLElement): void {
  veille?.disconnect();
  veille = new IntersectionObserver((entrees) => {
    for (const e of entrees) e.target.classList.toggle('hors-ecran', !e.isIntersecting);
  }, { rootMargin: '150px' });
  const boites = new Set<Element>();
  const figer = leger();
  for (const a of document.getAnimations()) {
    if (typeof CSSAnimation === 'undefined' || !(a instanceof CSSAnimation)) continue;
    const effet = a.effect as KeyframeEffect | null;
    const cible = effet?.target;
    if (!cible || effet.getComputedTiming().iterations !== Infinity || !racine.contains(cible)) continue;
    // graphismes légers : ce qui boucle s'arrête à mi-course, là où une lueur qui pulse est allumée (l'appel reste visible,
    // il ne pulse plus) ; seul le petit anneau d'attente tourne encore (sinon on croirait le jeu bloqué)
    if (figer && !cible.closest('.titre-anneau')) {
      const t = effet.getComputedTiming();
      const duree = Number(t.duration) || 0, retard = t.delay ?? 0;
      // un retard négatif (étincelles décalées) : on retombe dans un cycle, au même point du cycle
      a.currentTime = !duree ? 0 : retard >= 0 ? retard + duree / 2 : (((retard + duree / 2) % duree) + duree) % duree;
      a.pause();
      continue;
    }
    const boite = cible.parentElement;
    if (boite && boite !== racine && racine.contains(boite)) boites.add(boite);
  }
  boites.forEach((b) => veille!.observe(b));
}
