// L'intro du premier lancement : 10 plans animés, environ 90 secondes.
// Chaque plan = une scène animée en code (SVG + CSS) et 2 ou 3 phrases courtes qui apparaissent une à une.
// Les illustrations Midjourney viendront se glisser sous les scènes (image de fond) sans changer ce fichier.
// Aucun pays, personne ni conflit réel n'est nommé.

import { echap } from './vue';

export interface Plan {
  epoque: string;
  titre: string;
  lignes: string[];
  scene: (k: number) => string;
  /** fichier attendu dans public/intro/ (illustration Midjourney), facultatif */
  image?: string;
  ambiance: string;
}

const svg = (contenu: string, cls = '') =>
  `<svg class="scene ${cls}" viewBox="0 0 360 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${contenu}</svg>`;

const compteur = (de: number, a: number, duree: number) =>
  `<span class="compteur" style="--de:${de};--a:${a};--d:${duree}s" aria-hidden="true"></span>`;

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

export const PLANS: Plan[] = [
  { epoque: 'Aujourd’hui', titre: 'On savait', ambiance: 'chaleur', image: '01-on-savait', scene: villeChaleur, lignes: [
    'Les glaciers reculent, les étés brûlent. On le sait, on s’inquiète.',
    'Il y a des marches, des sommets, des promesses.'] },
  { epoque: 'Bientôt', titre: 'On a regardé ailleurs', ambiance: 'colere', image: '02-ailleurs', scene: ecrans, lignes: [
    'Les prix montent. Dans des pays voisins, les extrêmes se répondent.',
    'Des guerres s’embrasent. Le climat devient une ligne en bas de page.'] },
  { epoque: 'Les années 2040 à 2057', titre: 'La nature a frappé', ambiance: 'maree', scene: nature, lignes: [
    'Les tempêtes rendent des côtes entières inhabitables.',
    'Des centaines de millions de personnes prennent la route. On meurt par millions.',
    'En 2057, une partie de l’Antarctique glisse dans l’océan : la Fracture.'] },
  { epoque: 'Après la Fracture', titre: 'Construire en hauteur', ambiance: 'aube-doree', scene: tours, lignes: [
    'La mer monte de plusieurs mètres. On bâtit vers le ciel, sur des piliers.',
    'En une génération naissent les villes verticales. La plus grande : Vertiga.'] },
  { epoque: '2062', titre: 'Le Puits Zéro', ambiance: 'profondeur', image: '05-puits-zero', scene: puits, lignes: [
    'Il faut aussi des abris. On creuse sous les Fondations.',
    'Au fond du Puits Zéro : une salle que nul humain n’a construite.'] },
  { epoque: '2062 – 2068', titre: 'Les empreintes', ambiance: 'cristal', image: '06-empreintes', scene: empreintes, lignes: [
    'Ses cristaux gardent des êtres plus anciens que nous : dragons, esprits, sans-nom.',
    'Greffés sur un humain, ils éveillent des pouvoirs qu’aucune science n’explique.'] },
  { epoque: '2071 – 2090', titre: 'L’Ascension', ambiance: 'or', image: '07-ascension', scene: ascension, lignes: [
    'Les premiers greffés sentent venir les tempêtes et sauvent des villes entières.',
    'Mèche d’or, ombre qui n’est pas la leur : les Résonants prennent la tête du monde.',
    'Leurs familles s’installent dans les Hauts, sur des îles qui flottent.'] },
  { epoque: '2088 – 2101', titre: 'La réponse', ambiance: 'atelier', scene: lignees, lignes: [
    'Le peuple répond : la machine donne les Augmentés, la génétique les Génés.',
    'En 2101, les Accords : les Hauts gouvernent, les districts élisent leurs directeurs.'] },
  { epoque: '2121', titre: 'On a oublié, encore', ambiance: 'nuit', image: '09-oubli', scene: oubli, lignes: [
    'Les factions se disputent les empreintes. Les Fondations se fissurent.',
    'La mer remonte, centimètre après centimètre. Presque personne ne regarde.'] },
  { epoque: '2121', titre: 'Toi', ambiance: 'foyer', image: '10-toi', scene: toi, lignes: [
    'Tu viens d’être élu à la tête d’un district : quelques piliers, une vieille tour.',
    'Sous elle, une porte scellée depuis soixante ans. Trois personnes t’attendent.'] },
];

/** Années affichées par le compteur de chaque plan (de, à) */
const ANNEES: [number, number][] = [[2026, 2026], [2026, 2034], [2040, 2057], [2057, 2085], [2062, 2062], [2062, 2068], [2071, 2090], [2088, 2101], [2121, 2121], [2121, 2121]];

/** Illustrations Midjourney déjà déposées dans public/intro/ */
export const IMAGES_DISPONIBLES = new Set<string>([]);

/** Durée d'affichage d'une ligne avant la suivante (avance automatique) */
export const DUREE_LIGNE = 3200;

/** i = plan, k = nombre de lignes affichées */
export function htmlIntro(i: number, k: number): string {
  const p = PLANS[i]!;
  const dernier = i === PLANS.length - 1;
  const complet = k >= p.lignes.length;
  const img = p.image && IMAGES_DISPONIBLES.has(p.image) ? ` style="--img:url('./intro/${p.image}.webp')"` : '';
  const [de, a] = ANNEES[i]!;
  return `<section class="intro amb-${p.ambiance}${img ? ' illustree' : ''}"${img} aria-label="Introduction" data-action="intro-suivant">`
    + `<div class="intro-scene" aria-hidden="true">${p.scene(k)}</div>`
    + `<div class="intro-haut"><span class="sous">${i + 1} / ${PLANS.length}</span>${compteur(de, a, 2.4)}<button type="button" class="btn-sec" data-action="intro-passer">Passer</button></div>`
    + `<div class="intro-corps"><span class="epoque">${echap(p.epoque)}</span><h2>${echap(p.titre)}</h2>`
    + p.lignes.slice(0, Math.max(1, k)).map((l, n) => `<p class="ligne${n === k - 1 ? ' neuve' : ''}">${echap(l)}</p>`).join('')
    + `</div><div class="intro-bas">${i > 0 ? '<button type="button" class="btn-sec" data-action="intro-precedent">Retour</button>' : '<span></span>'}`
    + `<button type="button" class="prim" data-action="${dernier && complet ? 'intro-passer' : 'intro-suivant'}">${dernier && complet ? 'Descendre vers la porte' : 'Continuer'}</button></div></section>`;
}
