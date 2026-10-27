// L'intro du premier lancement : 12 plans, on avance au toucher (aucune avance automatique).
// Au premier lancement, la version courte (14 phrases) ; « Revoir l’intro » joue la version complète.
// Chaque plan = une illustration (ou une scène animée en code tant qu'elle manque) et 2 à 4 phrases,
// affichées une à la fois, comme des sous-titres, pour laisser voir l'image.
// Le texte se place en haut ou en bas selon l'endroit où se trouve le sujet de l'illustration.
// Fils rouges : la ligne bleue peinte sur les murs (plans 1 et 10), les « vingt secondes entre la météo
// et le sport » (plans 2 et 10), le regard (on a regardé ailleurs… regarde tout), la porte (plans 4 et 12).
// Aucun pays, personne ni conflit réel n'est nommé. Source : Bible du lore et Chroniques d'Ysé.

import { echap } from './outils';

export interface Plan {
  epoque: string;
  titre: string;
  lignes: string[];
  /** la version courte du premier lancement (27 octobre 2026) : 1 ou 2 phrases ; la version complète se revoit depuis le titre ou le menu */
  court: string[];
  /** années du compteur : il défile de la première à la seconde ; d'un plan à l'autre, le temps n'avance jamais à rebours */
  annees: [number, number];
  scene: (k: number) => string;
  /** illustrations Midjourney du plan (public/intro/<id>.webp), chacune visible à partir de la ligne « des » (1 = début) */
  fonds?: { id: string; des: number }[];
  ambiance: string;
  /** mouvement de caméra sur l'illustration */
  /** porte : plan large à la première phrase, puis la caméra s'approche de la porte et s'arrête */
  camera: 'approche' | 'monte' | 'descend' | 'gauche' | 'droite' | 'recule' | 'porte';
  /** où poser le texte pour ne pas cacher le sujet de l'illustration (bas par défaut) */
  texte?: 'haut' | 'bas';
  /** position du sujet dans l'illustration, en % (x, y) : la caméra zoome autour de lui */
  foyer?: [number, number];
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
  ${[['#7FA7C9', 'AUGMENTÉ'], ['#8FAF6A', 'GÉNÉ'], ['#A98BDF', 'RÉSONANT']].map(([c, n], i) => `<g class="carte-l${k >= 2 ? ' rapproche' : ''}" style="--i:${i}"><rect x="${30 + i * 105}" y="120" width="90" height="128" rx="10" fill="#1C1F26" stroke="${c}" stroke-width="3"/><circle cx="${75 + i * 105}" cy="170" r="22" fill="${c}" opacity=".5"/><text x="${75 + i * 105}" y="225" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="${c}">${n}</text></g>`).join('')}`);

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

const strates = (k: number) => svg(`
  <rect width="360" height="400" fill="#120E0A"/>
  ${[0, 1, 2, 3].map((r) => `<rect x="0" y="${60 + r * 85}" width="360" height="80" fill="${['#2A2017', '#241B14', '#1E1711', '#19130E'][r]}"/><path d="M0 ${60 + r * 85} Q 90 ${52 + r * 85} 180 ${62 + r * 85} T 360 ${58 + r * 85}" stroke="#3A2E22" stroke-width="3" fill="none"/>`).join('')}
  <g class="cristaux">${([[70, 120], [300, 210], [120, 300], [250, 360]] as [number, number][]).map(([x, y]) => `<path d="M${x} ${y - 18} L${x + 8} ${y} L${x} ${y + 9} L${x - 8} ${y} Z" fill="#9F86E8"/>`).join('')}</g>
  <g transform="translate(205 120) rotate(-20)"><rect width="56" height="12" rx="5" fill="#7D8794"/><rect x="50" y="-2" width="18" height="16" rx="4" fill="#5E6874"/><circle cx="26" cy="6" r="4" fill="#7FB4D8" class="pulse"/></g>
  <g transform="translate(40 225)"><rect width="34" height="50" rx="8" fill="#2F4A2E" stroke="#8FAF6A" stroke-width="2"/><rect x="6" y="18" width="22" height="26" rx="5" fill="#8FAF6A" opacity=".55" class="pulse-lent"/></g>
  ${k >= 3 ? `<g class="arrivee" style="--i:0"><rect x="150" y="190" width="60" height="84" rx="7" fill="#1C1F26" stroke="#E8C25A" stroke-width="3"/><path d="M180 212 L192 232 L180 252 L168 232 Z" fill="#B9A6FF"/></g>` : ''}`);

// ---------- Les 12 plans ----------

const f = (id: string, des = 1) => ({ id, des });

export const PLANS: Plan[] = [
  { epoque: 'Au début du siècle', titre: 'On savait', annees: [2006, 2019], ambiance: 'chaleur', camera: 'approche', fonds: [f('01-on-savait')], scene: villeChaleur, court: ["On avait les chiffres, les cartes, presque les dates. Quand l’eau montait, on peignait une ligne bleue sur le mur, et on la montrait aux invités."], lignes: [
    'Un soir, un documentaire fait le tour du monde : des glaciers photographiés à trente ans d’écart, qui ont reculé comme une marée.',
    'Les savants ont les chiffres, les cartes, presque les dates. Des millions de jeunes marchent. Il y a des sommets, des promesses.',
    'Quand l’eau monte pour la première fois, on peint une ligne bleue sur le mur, là où elle s’est arrêtée. On la montre aux invités.'] },
  { epoque: 'Aujourd’hui', titre: 'On a regardé ailleurs', annees: [2020, 2026], ambiance: 'colere', camera: 'recule', texte: 'haut', foyer: [47, 84], fonds: [f('02-ailleurs')], scene: ecrans, court: ["Les prix montent, la colère cherche des visages, des guerres remplissent les écrans. Le climat glisse en fin de journal, vingt secondes entre la météo et le sport."], lignes: [
    'Les prix montent : le pain, le loyer, le chauffage. Quand on compte ses pièces, un glacier qu’on ne verra jamais pèse peu.',
    'La colère cherche des visages. À l’extrême gauche comme à l’extrême droite, chacun crie plus fort que l’autre.',
    'Des guerres reviennent remplir les écrans. Le climat glisse en fin de journal, vingt secondes entre la météo et le sport.',
    'Entre les deux foules, un enfant. Personne ne le regarde : c’est lui qui vivra la suite.'] },
  { epoque: 'Un quart de siècle', titre: 'La Fonte', annees: [2030, 2055], ambiance: 'maree', camera: 'gauche', fonds: [f('03-tempetes')], scene: (k) => nature(Math.min(k, 2)), court: ["Puis la mer monte pour de bon. Les côtes se vident, des centaines de millions de gens prennent la route. Les querelles d’avant paraissent soudain minuscules."], lignes: [
    'La mer ne monte que de trente centimètres. Mais un soir de tempête, c’est une digue qui cède, une rue qui devient rivière.',
    'Les côtes se vident, rue après rue. Des centaines de millions de gens prennent la route avec ce qu’ils peuvent porter.',
    'Il y aura des morts par millions. Les querelles qui remplissaient les écrans paraissent soudain minuscules. Elles l’étaient.'] },
  { epoque: 'Un matin', titre: 'La Fracture', annees: [2057, 2057], ambiance: 'fracture', camera: 'descend', texte: 'haut', fonds: [f('03-fracture')], scene: () => nature(3), court: ["Un matin de 2057, une partie de l’Antarctique se détache d’un bloc. Depuis, on dit « avant » et « après la Fracture »."], lignes: [
    'À six heures, toutes les radios se taisent au milieu d’une phrase.',
    'Au bout du monde, une partie de l’Antarctique se détache d’un bloc, comme une porte arrachée. Un marin la regarde glisser.',
    'La mer montera de plusieurs mètres en quelques décennies. Depuis, on dit « avant » et « après la Fracture ».'] },
  { epoque: 'Après la Fracture', titre: 'La Montée', annees: [2057, 2062], ambiance: 'aube-doree', camera: 'monte', fonds: [f('04-hauteur')], scene: tours, court: ["On commence par monter : des tours sur des piliers plantés dans l’eau, reliées par des passerelles. En une génération, elles forment une seule ville : Vertiga."], lignes: [
    'Quand on ne peut plus fuir sur les côtés, il reste deux directions. On commence par monter.',
    'Des tours de secours poussent sur des piliers plantés dans l’eau. On vit aux étages finis pendant qu’on coule ceux du dessus.',
    'Des passerelles les relient. En une génération, elles se mêleront jusqu’à former une seule ville : Vertiga.'] },
  { epoque: 'Sous les piliers', titre: 'Le Puits Zéro', annees: [2062, 2062], ambiance: 'profondeur', camera: 'descend', texte: 'haut', fonds: [f('05-puits-zero')], scene: puits, court: ["Puis on creuse des abris sous les piliers. Un soir, une foreuse débouche dans une salle aux murs lisses et courbes. Rien n’y est à la taille d’un humain.", "On l’appelle la Strate zéro. Il y en a d’autres."], lignes: [
    'Puis on creuse : il faut des abris contre les tempêtes, et on ne peut les mettre qu’en bas, sous les piliers des Fondations.',
    'Un soir, une foreuse débouche dans une salle aux murs lisses et courbes. Rien n’y est à la taille d’un humain.',
    '« Ça sentait comme une pièce d’où quelqu’un vient de sortir », dira un ouvrier. On l’appelle la Strate zéro. Il y en a d’autres.'] },
  { epoque: 'Six ans d’études', titre: 'Les empreintes', annees: [2062, 2068], ambiance: 'cristal', camera: 'approche', fonds: [f('06-empreintes')], scene: empreintes, court: ["Dans les murs, des cristaux. Chacun garde l’empreinte d’un être : ses gestes, sa force. Certains sont plus anciens que nous : dragons, esprits, sans-nom."], lignes: [
    'Dans les murs, des cristaux. Chacun garde l’empreinte d’un être : ses gestes, sa force, une part de ce qu’il était.',
    'En 2068, on apprend à graver nos propres empreintes et à les greffer. Le geste d’un vieux soudeur survit dans d’autres mains.',
    'Mais les cristaux des Strates sont déjà habités. Par des êtres plus anciens que nous : dragons, esprits, sans-nom.'] },
  { epoque: 'Vingt ans', titre: 'L’Ascension', annees: [2071, 2090], ambiance: 'or', camera: 'monte', fonds: [f('07-ascension')], scene: ascension, court: ["Greffés d’empreintes anciennes, quelques-uns deviennent les Résonants, une mèche d’or dans les cheveux. Leurs familles finissent au-dessus des nuages : les Hauts."], lignes: [
    'En 2071, sept volontaires reçoivent en secret des empreintes anciennes. Une mèche d’or leur pousse en une nuit. Leur ombre change.',
    'Ils sentent les tempêtes avant les machines, apaisent une foule d’un mot, et seuls savent éveiller les cristaux anciens : ce sont les Résonants. Certains sauvent des villes, d’autres les prennent.',
    'Leurs familles s’installent au sommet des tours. Bientôt, les Hauts s’en détacheront : des îles qui flottent au-dessus des nuages. Personne en bas ne demande comment.'] },
  { epoque: 'Pendant ce temps, en bas', titre: 'La Réponse', annees: [2090, 2100], ambiance: 'atelier', camera: 'droite', fonds: [f('08-reponse')], scene: lignees, court: ["En bas, on se refait autrement : la machine donne les Augmentés, la génétique les Génés. Trois lignées, nées de la même peur."], lignes: [
    'Les empreintes anciennes sont rares, et les Hauts gardent les meilleures. Alors le reste de l’humanité se refait autrement.',
    'La machine donne les Augmentés. Leurs premiers implants à cœur de cristal servent à une chose : brouiller les Résonants.',
    'La génétique donne les Génés, qui empruntent au vivant ce qui résiste à l’eau et au noir. Trois lignées, nées de la même peur.'] },
  { epoque: 'Vingt ans de calme', titre: 'On a oublié, encore', annees: [2101, 2121], ambiance: 'nuit', camera: 'recule', texte: 'haut', fonds: [f('09-oubli')], scene: oubli, court: ["Vingt ans de calme. Les districts élisent leurs directeurs, on se dispute ce qu’on a déterré… et les lignes bleues des vieux murs passent sous la marée."], lignes: [
    'En 2101, les Accords mettent fin à dix ans de grèves : les Hauts gouvernent, les districts élisent leurs directeurs.',
    'Une question reste « à préciser » : à qui appartient ce qui dort sous les piliers ? Les factions se la disputent encore.',
    'Pendant ce temps, les Fondations se fissurent. La mer remonte, et les lignes bleues des vieux murs passent sous la marée.',
    'On se dispute ce qu’on a déterré, et on oublie ce qui monte. Vingt secondes entre la météo et le sport. Comme avant.'] },
  { epoque: 'Vertiga', titre: 'Ce qui dort en dessous', annees: [2121, 2121], ambiance: 'profondeur', camera: 'descend', texte: 'haut', fonds: [f('10-dessous')], scene: strates, court: ["Sous chaque district, les Strates descendent, toujours plus anciennes. Plus on descend, plus les trouvailles sont puissantes, et plus il est difficile d’en remonter."], lignes: [
    'Sous chaque district, il y a d’abord les abris murés des années 2060. Plus bas, les Strates, toujours plus anciennes.',
    'On en remonte des cristaux d’empreinte. Greffés, ils font les Résonants ; gravés, ils font battre les implants des Augmentés. Chacun peut armer quelqu’un.',
    'Plus on descend, plus les trouvailles sont puissantes, et plus il est difficile d’en remonter.'] },
  { epoque: 'Ce matin', titre: 'Toi', annees: [2121, 2121], ambiance: 'foyer', camera: 'porte', texte: 'haut', fonds: [f('10-toi')], scene: toi, court: ["Hier, ton district t’a élu à sa tête. Ce matin, sous sa vieille tour, on a ouvert une porte scellée depuis soixante ans.", "Une coursière, un ancien des Fondations et une lectrice d’empreintes t’attendent en bas. Descends. Regarde tout."], lignes: [
    'Hier, ton district t’a élu à sa tête : quelques piliers reliés par des passerelles, une Forge au ralenti, une vieille tour.',
    'Ce matin, sous la tour, on a ouvert une porte scellée depuis soixante ans. Derrière, des dizaines d’empreintes, mêlées.',
    'Au même moment, dans les Hauts, des Résonants se réveillent sans savoir qui ils sont. Tout Vertiga va vouloir cette porte.',
    'Une coursière, un ancien des Fondations et une lectrice d’empreintes t’attendent en bas. Descends. Regarde tout.'] },
];

/** Illustrations Midjourney déjà déposées dans public/intro/ */
const IMAGES_DISPONIBLES = new Set<string>(['01-on-savait', '02-ailleurs', '03-tempetes', '03-fracture', '04-hauteur', '05-puits-zero', '06-empreintes', '07-ascension', '08-reponse', '09-oubli', '10-dessous', '10-toi']);
/** Plans qui ont aussi une courte vidéo en boucle (public/intro/<id>.mp4), l'image sert d'affiche.
 *  10-toi n'en a plus : sa boucle sautait ; l'image fixe et le zoom vers la porte la remplacent. */
const VIDEOS_DISPONIBLES = new Set<string>([]);

/** Illustration visible au plan i quand k lignes sont affichées (la dernière disponible dont le seuil est atteint) */
function fondActif(i: number, k: number): string | null {
  const dispo = (PLANS[i]?.fonds ?? []).filter((x) => IMAGES_DISPONIBLES.has(x.id));
  const atteints = dispo.filter((x) => x.des <= k);
  return (atteints[atteints.length - 1] ?? dispo[0])?.id ?? null;
}

/** Illustrations à précharger pour le plan i (toutes celles du plan) */
export const imagesPlan = (i: number): string[] =>
  (PLANS[i]?.fonds ?? []).filter((x) => IMAGES_DISPONIBLES.has(x.id)).map((x) => `./intro/${x.id}.webp`);

function fond(id: string, camera: string, mouvement: boolean, foyer?: [number, number]): string {
  const src = `./intro/${id}.webp`;
  const media = mouvement && VIDEOS_DISPONIBLES.has(id)
    ? `<video poster="${src}" autoplay muted loop playsinline preload="auto"><source src="./intro/${id}.webm" type="video/webm"><source src="./intro/${id}.mp4" type="video/mp4"></video>`
    : `<img src="${src}" alt="" decoding="async">`;
  const style = foyer ? ` style="--fx:${foyer[0]}%;--fy:${foyer[1]}%"` : '';
  return `<div class="intro-fond cam-${camera}" data-fond="${id}"${style} aria-hidden="true">${media}</div>`;
}

// ---------- Particules par ambiance (CSS seul, position et rythme déterministes) ----------

const PARTICULES: Record<string, { type: string; n: number }> = {
  chaleur: { type: 'poussiere', n: 18 }, colere: { type: 'cendre', n: 22 }, maree: { type: 'pluie', n: 46 },
  'aube-doree': { type: 'poussiere', n: 16 }, profondeur: { type: 'gravats', n: 20 }, cristal: { type: 'motes', n: 24 },
  or: { type: 'motes', n: 20 }, atelier: { type: 'etincelle', n: 18 }, nuit: { type: 'neige-lumiere', n: 16 }, foyer: { type: 'poussiere', n: 14 },
  fracture: { type: 'neige-lumiere', n: 20 },
};

/** Typographie française : espace insécable avant « : » et « » », fine insécable avant ; ? !, insécable après « */
const fr = (t: string) => t.replace(/ ([:»])/g, '\u00A0$1').replace(/ ([;?!])/g, '\u202F$1').replace(/« /g, '«\u00A0');

export function particules(ambiance: string): string {
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

/** i = plan, k = nombre de lignes déjà lues (la k-ième est affichée seule), texteCache = mode « admirer l'image » */
/** Les phrases d'un plan : la version courte au premier lancement, la complète quand on revoit l'intro */
export const lignesDe = (i: number, longue: boolean): string[] => (longue ? PLANS[i]!.lignes : PLANS[i]!.court);

export function htmlIntro(i: number, k: number, mouvement = true, texteCache = false, longue = false): string {
  const p = { ...PLANS[i]!, lignes: lignesDe(i, longue) };
  const dernier = i === PLANS.length - 1;
  const n = Math.min(Math.max(1, k), p.lignes.length);
  const complet = n >= p.lignes.length;
  const actif = fondActif(i, n);
  const [de, a] = p.annees;
  const progression = PLANS.map((_, m) => `<span class="${m < i ? 'fait' : m === i ? 'ici' : ''}"></span>`).join('');
  // une seule phrase à la fois, comme un sous-titre : l'image reste visible
  const pas = p.lignes.length > 1 ? `<div class="intro-pas" aria-hidden="true">${p.lignes.map((_, m) => `<span class="${m < n ? 'fait' : ''}"></span>`).join('')}</div>` : '';
  return `<section class="intro amb-${p.ambiance}${actif ? ' illustree' : ''}${texteCache ? ' admirer' : ''} texte-${p.texte ?? 'bas'}" data-plan="${i}" data-k="${n}"${actif ? ` style="--image:url(./intro/${actif}.webp)"` : ''} aria-label="Introduction" data-action="intro-suivant">`
    + (actif ? fond(actif, p.camera, mouvement, p.foyer) : '')
    + `<div class="intro-scene" aria-hidden="true">${p.scene(n)}</div>`
    + (mouvement ? particules(p.ambiance) : '')
    + `<div class="intro-voile" aria-hidden="true"></div>`
    + `<div class="intro-haut"><div class="intro-prog" role="img" aria-label="Plan ${i + 1} sur ${PLANS.length}">${progression}</div>`
    + `<div class="intro-outils"><button type="button" class="btn-sec rond" data-action="intro-oeil" aria-pressed="${texteCache}" aria-label="${texteCache ? 'Afficher le texte' : 'Masquer le texte pour voir l’image'}">${texteCache ? OEIL_BARRE : OEIL}</button>`
    + `<button type="button" class="btn-sec" data-action="intro-passer">Passer</button></div></div>`
    + `<div class="intro-corps${n === 1 ? ' entree' : ''}"><div class="intro-date"><span class="epoque">${echap(fr(p.epoque))}</span>${p.epoque.includes(String(a)) ? '' : compteur(de, a)}</div><h2>${echap(fr(p.titre))}</h2>`
    + `<p class="ligne neuve" aria-live="polite">${echap(fr(p.lignes[n - 1]!))}</p>${pas}`
    + `</div><div class="intro-bas">${i > 0 || n > 1 ? '<button type="button" class="btn-sec" data-action="intro-precedent">Retour</button>' : '<span></span>'}`
    + (i === 0 ? `<span class="intro-indice">Touche l’écran pour continuer</span>` : '<span></span>')
    + `<button type="button" class="prim" data-action="${dernier && complet ? 'intro-passer' : 'intro-suivant'}">${dernier && complet ? 'Descendre vers la porte' : complet ? 'Suite' : 'Continuer'}</button></div></section>`;
}

const OEIL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const OEIL_BARRE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/></svg>';
