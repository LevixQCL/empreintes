// L'intro du premier lancement : 10 plans, on avance au toucher (aucune avance automatique).
// Chaque plan = une scène animée en code (SVG + CSS) et 2 ou 3 phrases courtes qui apparaissent une à une.
// Les illustrations Midjourney passent sous le texte ; tant qu'un plan n'a pas d'image, sa scène SVG la remplace.
// Aucun pays, personne ni conflit réel n'est nommé.

import { echap } from './vue';

export interface Plan {
  epoque: string;
  titre: string;
  lignes: string[];
  scene: (k: number) => string;
  /** illustrations Midjourney du plan (public/intro/<id>.webp), chacune visible à partir de la ligne « des » (1 = début) */
  fonds?: { id: string; des: number }[];
  ambiance: string;
  /** mouvement de caméra sur l'illustration */
  camera: 'approche' | 'monte' | 'descend' | 'gauche' | 'droite' | 'recule';
}

const svg = (contenu: string, cls = '') =>
  `<svg class="scene ${cls}" viewBox="0 0 360 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${contenu}</svg>`;

const compteur = (de: number, a: number) =>
  de === a ? `<span class="compteur fixe" aria-hidden="true">${de}</span>`
    : `<span class="compteur" data-de="${de}" data-a="${a}" aria-hidden="true">${de}</span>`;

// ---------- Scènes ----------

const villeChaleur = () => svg(`
  <defs><radialGradient id="soleil"><stop offset="0" stop-color="#FFD07A"/><stop offset=".55" stop-color="#F06A3A"/><stop offset="1" stop-color="#F06A3A" stop-opacity="0"/></radialGradient></defs>
  <circle cx="230" cy="190" r="120" fill="url(#soleil)" class="pulse-lent"/>
  <g class="brume">${[40, 85, 130, 175, 220, 265, 310].map((x, i) => `<rect x="${x}" y="${170 + (i % 3) * 25}" width="${30 + (i % 2) * 14}" height="${230 - (i % 3) * 25}" fill="#3B2A2E"/>`).join('')}</g>
  <rect x="0" y="0" width="360" height="400" fill="none" stroke="#1A1416" stroke-width="40"/>
  <rect x="176" y="0" width="8" height="400" fill="#1A1416"/>`);

const ecrans = () => svg(`
  <rect x="20" y="50" width="140" height="110" rx="6" fill="#3A6EA5" class="clignote"/>
  <rect x="200" y="50" width="140" height="110" rx="6" fill="#B5473A" class="clignote decale"/>
  <g fill="#1E2430">${Array.from({ length: 9 }, (_, i) => `<circle cx="${18 + i * 16}" cy="${300 + (i % 2) * 8}" r="9"/><rect x="${10 + i * 16}" y="${306 + (i % 2) * 8}" width="16" height="60" rx="6"/>`).join('')}</g>
  <g fill="#2E1E1C">${Array.from({ length: 9 }, (_, i) => `<circle cx="${214 + i * 16}" cy="${300 + (i % 2) * 8}" r="9"/><rect x="${206 + i * 16}" y="${306 + (i % 2) * 8}" width="16" height="60" rx="6"/>`).join('')}</g>
  <g class="efface"><path d="M180 360 V300 M180 320 L168 304 M180 312 L193 298" stroke="#8A6A48" stroke-width="3" fill="none"/></g>`);

const nature = (k: number) => svg(`
  <rect x="40" y="60" width="160" height="300" fill="#5E5A55"/>
  <rect x="40" y="230" height="130" class="eau-monte" width="160" fill="#3D7A8C" opacity=".85"/>
  <line x1="40" x2="200" y1="250" y2="250" stroke="#7FB4D8" stroke-width="3"/>
  <g class="pluie">${Array.from({ length: 26 }, (_, i) => `<line x1="${(i * 37) % 360}" y1="${(i * 53) % 400}" x2="${(i * 37) % 360 - 8}" y2="${(i * 53) % 400 + 22}" stroke="#BFD9E6" stroke-width="1.5" opacity=".6"/>`).join('')}</g>
  ${k >= 2 ? `<g class="colonne">${Array.from({ length: 14 }, (_, i) => `<g transform="translate(${220 + (i % 7) * 18} ${300 + Math.floor(i / 7) * 34})"><circle r="5" fill="#2A2228"/><rect x="-5" y="5" width="10" height="20" rx="4" fill="#2A2228"/></g>`).join('')}</g>` : ''}
  ${k >= 3 ? `<g class="glace"><path d="M200 120 L360 100 L360 260 L230 280 Z" fill="#DDEEF6"/><path class="bloc" d="M230 280 L300 190 L360 200 L360 260 Z" fill="#B9D6E6"/><path d="M200 120 L300 190 L230 280" stroke="#7FA7C9" stroke-width="2" fill="none"/></g>` : ''}`, k >= 3 ? 'froid' : '');

const tours = () => svg(`
  <rect x="0" y="330" width="360" height="70" fill="#2F5C72"/>
  ${[30, 95, 160, 225, 290].map((x, i) => `<g class="tour" style="--i:${i}"><rect x="${x}" y="${120 + (i % 2) * 40}" width="40" height="${210 - (i % 2) * 40}" fill="#C9A37A"/>${[0, 1, 2, 3, 4, 5].map((r) => `<rect x="${x + 8}" y="${140 + (i % 2) * 40 + r * 28}" width="8" height="10" fill="#FFD98A"/><rect x="${x + 24}" y="${140 + (i % 2) * 40 + r * 28}" width="8" height="10" fill="#FFD98A"/>`).join('')}<rect x="${x - 6}" y="320" width="52" height="40" fill="#7D7C86"/></g>`).join('')}
  <g class="passerelles" stroke="#7A5A3A" stroke-width="3"><line x1="70" y1="190" x2="95" y2="200"/><line x1="135" y1="210" x2="160" y2="200"/><line x1="200" y1="190" x2="225" y2="200"/><line x1="265" y1="215" x2="290" y2="200"/></g>`);

const puits = () => svg(`
  <rect x="0" y="0" width="360" height="400" fill="#140F0B"/>
  <rect x="140" y="0" width="80" height="400" fill="#241A12"/>
  <g class="descente"><g class="faisceau"><path d="M170 120 L120 300 L220 300 Z" fill="#FFE2A0" opacity=".25"/></g>
  ${[0, 1, 2].map((i) => `<circle cx="${160 + i * 20}" cy="${110 + i * 4}" r="4" fill="#FFD27A"/>`).join('')}
  <g class="cristaux">${([[110, 330], [180, 350], [250, 320], [140, 370], [220, 375]] as [number, number][]).map(([x, y]) => `<path d="M${x} ${y - 22} L${x + 9} ${y} L${x} ${y + 10} L${x - 9} ${y} Z" fill="#9F86E8"/>`).join('')}</g></g>`);

const empreintes = () => svg(`
  <rect width="360" height="400" fill="#120E24"/>
  <circle cx="180" cy="240" r="90" fill="#6B55C8" opacity=".18" class="pulse"/>
  <path d="M180 170 L210 240 L180 300 L150 240 Z" fill="#B9A6FF" class="pulse"/>
  <path class="fantome" d="M40 120 C 100 60, 160 160, 220 100 S 330 60, 340 140" stroke="#E7DEFF" stroke-width="10" fill="none" stroke-linecap="round" opacity=".35"/>
  <path class="fantome decale" d="M300 330 C 250 280, 230 360, 180 320" stroke="#E7DEFF" stroke-width="6" fill="none" stroke-linecap="round" opacity=".3"/>`);

const ascension = () => svg(`
  <rect width="360" height="400" fill="#F3E2B8"/>
  <rect x="190" y="40" width="170" height="360" fill="#FFFFFF" opacity=".75"/>
  <path class="aile" d="M240 330 C 200 220, 230 120, 330 80 C 300 160, 340 230, 300 330 Z" fill="#6B5A45" opacity=".35"/>
  <g transform="translate(120 230)"><circle r="16" fill="#3A2E28"/><path d="M-4 -16 C 6 -10, 4 4, 10 10" stroke="#E8C25A" stroke-width="5" fill="none"/><rect x="-16" y="16" width="32" height="120" rx="10" fill="#E9E2D0"/><rect x="-16" y="40" width="32" height="96" rx="10" fill="#2F5A3F"/></g>
  ${([[60, 70], [150, 40], [300, 25]] as [number, number][]).map(([x, y], i) => `<g class="ile" style="--i:${i}"><ellipse cx="${x}" cy="${y}" rx="30" ry="8" fill="#8FB886"/><path d="M${x - 26} ${y} L${x} ${y + 26} L${x + 26} ${y} Z" fill="#9B8C7A"/><rect x="${x - 8}" y="${y - 16}" width="16" height="14" fill="#FFFFFF"/></g>`).join('')}`);

const lignees = (k: number) => svg(`
  <rect width="360" height="400" fill="#17191F"/>
  ${[['#7FA7C9', 'TECH'], ['#8FAF6A', 'GÉNÉ'], ['#A98BDF', 'RÉSONANT']].map(([c, n], i) => `<g class="carte-l${k >= 2 ? ' rapproche' : ''}" style="--i:${i}"><rect x="${30 + i * 105}" y="120" width="90" height="128" rx="10" fill="#1C1F26" stroke="${c}" stroke-width="3"/><circle cx="${75 + i * 105}" cy="170" r="22" fill="${c}" opacity=".5"/><text x="${75 + i * 105}" y="225" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="${c}">${n}</text></g>`).join('')}`);

const oubli = () => svg(`
  <rect width="360" height="400" fill="#0C0F18"/>
  ${Array.from({ length: 40 }, (_, i) => `<rect class="lumiere" style="--i:${i % 7}" x="${(i * 47) % 340 + 8}" y="${(i * 29) % 220 + 20}" width="5" height="6" fill="#FFD98A"/>`).join('')}
  <rect x="130" y="250" width="100" height="150" fill="#3A3A44"/>
  <path d="M175 252 L182 290 L170 320 L180 360" stroke="#0C0F18" stroke-width="3" fill="none"/>
  <rect x="0" y="352" width="360" height="48" fill="#1C3A4C" class="maree"/>`);

const toi = (k: number) => svg(`
  <rect width="360" height="400" fill="#F3D9A8"/>
  ${([[70, 210, 40], [290, 220, 40], [180, 260, 60]] as [number, number, number][]).map(([x, y, r]) => `<path d="M${x - r * 0.8} ${y} L${x - r * 0.6} 400 L${x + r * 0.6} 400 L${x + r * 0.8} ${y} Z" fill="#9A8A74"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.4}" fill="#86B86A"/>`).join('')}
  <rect x="168" y="160" width="24" height="100" rx="4" fill="#C9A37A"/><path d="M180 132 L188 148 L180 158 L172 148 Z" fill="#BFE6FF"/>
  <circle cx="180" cy="300" r="22" fill="#2A2238"/><circle cx="180" cy="300" r="22" fill="none" stroke="#A98BDF" stroke-width="3" class="pulse"/>
  ${k >= 2 ? ([['#7FA7C9', 140], ['#8FAF6A', 180], ['#A98BDF', 220]] as [string, number][]).map(([c, x], i) => `<g class="arrivee" style="--i:${i}"><circle cx="${x}" cy="350" r="12" fill="${c}"/><rect x="${x - 10}" y="362" width="20" height="30" rx="8" fill="${c}"/></g>`).join('') : ''}`);

// ---------- Les 10 plans ----------

const f = (id: string, des = 1) => ({ id, des });

export const PLANS: Plan[] = [
  { epoque: 'Aujourd’hui', titre: 'On savait', ambiance: 'chaleur', camera: 'approche', fonds: [f('01-on-savait')], scene: villeChaleur, lignes: [
    'Les glaciers reculent, les étés brûlent. On le sait, on s’inquiète.',
    'Il y a des marches, des sommets, des promesses.'] },
  { epoque: 'Bientôt', titre: 'On a regardé ailleurs', ambiance: 'colere', camera: 'recule', fonds: [f('02-ailleurs')], scene: ecrans, lignes: [
    'Les prix montent. Dans des pays voisins, les extrêmes se répondent.',
    'Des guerres s’embrasent. Le climat devient une ligne en bas de page.'] },
  { epoque: 'Les années 2040 à 2057', titre: 'La nature a frappé', ambiance: 'maree', camera: 'gauche', fonds: [f('03-tempetes'), f('03-fracture', 3)], scene: nature, lignes: [
    'Les tempêtes rendent des côtes entières inhabitables.',
    'Des centaines de millions de personnes prennent la route. On meurt par millions.',
    'En 2057, une partie de l’Antarctique glisse dans l’océan : la Fracture.'] },
  { epoque: 'Après la Fracture', titre: 'Construire en hauteur', ambiance: 'aube-doree', camera: 'monte', fonds: [f('04-hauteur')], scene: tours, lignes: [
    'La mer monte de plusieurs mètres. On bâtit vers le ciel, sur des piliers.',
    'En une génération naissent les villes verticales. La plus grande : Vertiga.'] },
  { epoque: '2062', titre: 'Le Puits Zéro', ambiance: 'profondeur', camera: 'descend', fonds: [f('05-puits-zero')], scene: puits, lignes: [
    'Il faut aussi des abris. On creuse sous les Fondations.',
    'Au fond du Puits Zéro : une salle que nul humain n’a construite.'] },
  { epoque: '2062 – 2068', titre: 'Les empreintes', ambiance: 'cristal', camera: 'approche', fonds: [f('06-empreintes')], scene: empreintes, lignes: [
    'Ses cristaux gardent des êtres plus anciens que nous : dragons, esprits, sans-nom.',
    'Greffés sur un humain, ils éveillent des pouvoirs qu’aucune science n’explique.'] },
  { epoque: '2071 – 2090', titre: 'L’Ascension', ambiance: 'or', camera: 'monte', fonds: [f('07-ascension')], scene: ascension, lignes: [
    'Les premiers greffés sentent venir les tempêtes et sauvent des villes entières.',
    'Mèche d’or, ombre qui n’est pas la leur : les Résonants prennent la tête du monde.',
    'Leurs familles s’installent dans les Hauts, sur des îles qui flottent.'] },
  { epoque: '2088 – 2101', titre: 'La réponse', ambiance: 'atelier', camera: 'droite', fonds: [f('08-reponse')], scene: lignees, lignes: [
    'Le peuple répond : la machine donne les Augmentés, la génétique les Génés.',
    'En 2101, les Accords : les Hauts gouvernent, les districts élisent leurs directeurs.'] },
  { epoque: '2121', titre: 'On a oublié, encore', ambiance: 'nuit', camera: 'recule', fonds: [f('09-oubli')], scene: oubli, lignes: [
    'Les factions se disputent les empreintes. Les Fondations se fissurent.',
    'La mer remonte, centimètre après centimètre. Presque personne ne regarde.'] },
  { epoque: '2121', titre: 'Toi', ambiance: 'foyer', camera: 'approche', fonds: [f('10-toi')], scene: toi, lignes: [
    'Tu viens d’être élu à la tête d’un district : quelques piliers, une vieille tour.',
    'Sous elle, une porte scellée depuis soixante ans. Trois personnes t’attendent.'] },
];

/** Années affichées par le compteur de chaque plan (de, à) */
const ANNEES: [number, number][] = [[2026, 2026], [2026, 2034], [2040, 2057], [2057, 2085], [2062, 2062], [2062, 2068], [2071, 2090], [2088, 2101], [2121, 2121], [2121, 2121]];

/** Illustrations Midjourney déjà déposées dans public/intro/ */
export const IMAGES_DISPONIBLES = new Set<string>(['01-on-savait', '02-ailleurs', '05-puits-zero', '06-empreintes', '07-ascension', '09-oubli', '10-toi']);
/** Plans qui ont aussi une courte vidéo en boucle (public/intro/<id>.mp4), l'image sert d'affiche */
export const VIDEOS_DISPONIBLES = new Set<string>(['10-toi']);

/** Illustration visible au plan i quand k lignes sont affichées (la dernière disponible dont le seuil est atteint) */
export function fondActif(i: number, k: number): string | null {
  const dispo = (PLANS[i]?.fonds ?? []).filter((x) => IMAGES_DISPONIBLES.has(x.id));
  const atteints = dispo.filter((x) => x.des <= k);
  return (atteints[atteints.length - 1] ?? dispo[0])?.id ?? null;
}

/** Illustrations à précharger pour le plan i (toutes celles du plan) */
export const imagesPlan = (i: number): string[] =>
  (PLANS[i]?.fonds ?? []).filter((x) => IMAGES_DISPONIBLES.has(x.id)).map((x) => `./intro/${x.id}.webp`);

function fond(id: string, camera: string, mouvement: boolean): string {
  const src = `./intro/${id}.webp`;
  const media = mouvement && VIDEOS_DISPONIBLES.has(id)
    ? `<video poster="${src}" autoplay muted loop playsinline preload="auto"><source src="./intro/${id}.webm" type="video/webm"><source src="./intro/${id}.mp4" type="video/mp4"></video>`
    : `<img src="${src}" alt="" decoding="async">`;
  return `<div class="intro-fond cam-${camera}" data-fond="${id}" aria-hidden="true">${media}</div>`;
}

// ---------- Particules par ambiance (CSS seul, position et rythme déterministes) ----------

const PARTICULES: Record<string, { type: string; n: number }> = {
  chaleur: { type: 'poussiere', n: 18 }, colere: { type: 'cendre', n: 22 }, maree: { type: 'pluie', n: 46 },
  'aube-doree': { type: 'poussiere', n: 16 }, profondeur: { type: 'gravats', n: 20 }, cristal: { type: 'motes', n: 24 },
  or: { type: 'motes', n: 20 }, atelier: { type: 'etincelle', n: 18 }, nuit: { type: 'neige-lumiere', n: 16 }, foyer: { type: 'poussiere', n: 14 },
};

function particules(ambiance: string): string {
  const def = PARTICULES[ambiance];
  if (!def) return '';
  const span = Array.from({ length: def.n }, (_, i) => {
    const x = (i * 61 + 13) % 100;
    const y = (i * 37 + 7) % 100;
    const d = 0.7 + ((i * 29) % 10) / 10; // 0.7 à 1.6
    const t = -((i * 17) % 40) / 10; // décalage négatif : déjà en mouvement à l'ouverture
    const s = 0.6 + ((i * 13) % 9) / 10;
    return `<i style="--x:${x}%;--y:${y}%;--d:${d.toFixed(2)};--t:${t.toFixed(1)}s;--s:${s.toFixed(2)}"></i>`;
  }).join('');
  return `<div class="intro-particules p-${def.type}" aria-hidden="true">${span}</div>`;
}

/** i = plan, k = nombre de lignes affichées, texteCache = mode « admirer l'image » */
export function htmlIntro(i: number, k: number, mouvement = true, texteCache = false): string {
  const p = PLANS[i]!;
  const dernier = i === PLANS.length - 1;
  const complet = k >= p.lignes.length;
  const actif = fondActif(i, k);
  const [de, a] = ANNEES[i]!;
  const progression = PLANS.map((_, n) => `<span class="${n < i ? 'fait' : n === i ? 'ici' : ''}"></span>`).join('');
  return `<section class="intro amb-${p.ambiance}${actif ? ' illustree' : ''}${texteCache ? ' admirer' : ''}" data-plan="${i}" aria-label="Introduction" data-action="intro-suivant">`
    + (actif ? fond(actif, p.camera, mouvement) : '')
    + `<div class="intro-scene" aria-hidden="true">${p.scene(k)}</div>`
    + (mouvement ? particules(p.ambiance) : '')
    + `<div class="intro-voile" aria-hidden="true"></div>`
    + `<div class="intro-haut"><div class="intro-prog" role="img" aria-label="Plan ${i + 1} sur ${PLANS.length}">${progression}</div>`
    + `<div class="intro-outils"><button type="button" class="btn-sec rond" data-action="intro-oeil" aria-pressed="${texteCache}" aria-label="${texteCache ? 'Afficher le texte' : 'Masquer le texte pour voir l’image'}">${texteCache ? OEIL_BARRE : OEIL}</button>`
    + `<button type="button" class="btn-sec" data-action="intro-passer">Passer</button></div></div>`
    + `<div class="intro-corps${k === 1 ? ' entree' : ''}"><div class="intro-date"><span class="epoque">${echap(p.epoque)}</span>${compteur(de, a)}</div><h2>${echap(p.titre)}</h2>`
    + p.lignes.slice(0, Math.max(1, k)).map((l, n) => `<p class="ligne${n === k - 1 ? ' neuve' : ' lue'}">${echap(l)}</p>`).join('')
    + `</div><div class="intro-bas">${i > 0 || k > 1 ? '<button type="button" class="btn-sec" data-action="intro-precedent">Retour</button>' : '<span></span>'}`
    + (i === 0 ? `<span class="intro-indice">Touche l’écran pour continuer</span>` : '<span></span>')
    + `<button type="button" class="prim" data-action="${dernier && complet ? 'intro-passer' : 'intro-suivant'}">${dernier && complet ? 'Descendre vers la porte' : complet ? 'Suite' : 'Continuer'}</button></div></section>`;
}

const OEIL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const OEIL_BARRE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/></svg>';
