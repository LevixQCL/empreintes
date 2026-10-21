// L'intro du premier lancement : on part d'aujourd'hui et on descend jusqu'en 2121.
// Aucun pays, personne ni conflit réel n'est nommé : chacun reconnaît notre époque sans qu'on la désigne.
// Chaque plan = une illustration + 2 ou 3 phrases courtes qui apparaissent une à une, comme des sous-titres.

import { echap } from './vue';

export interface Plan {
  epoque: string;
  titre: string;
  lignes: string[];
  /** fichier dans public/intro/ ; à défaut, le fond de couleur `ambiance` */
  image: string;
  ambiance: string;
}

export const PLANS: Plan[] = [
  { epoque: 'Aujourd’hui', titre: 'Le monde sait', image: '01-monde-sait', ambiance: 'aube-grise', lignes: [
    'Les glaciers reculent. Les étés brûlent.',
    'Les scientifiques préviennent depuis des décennies.',
    'Le soir, devant les informations, on a une boule au ventre.'] },
  { epoque: 'Aujourd’hui', titre: 'On s’inquiète', image: '02-inquiete', ambiance: 'vert-tendre', lignes: [
    'Il y a des marches, des sommets, des promesses.',
    'Une génération grandit avec l’angoisse de l’avenir.',
    'Pendant quelques années, c’est le sujet de tout le monde.'] },
  { epoque: 'Bientôt', titre: 'Puis on regarde ailleurs', image: '03-ailleurs', ambiance: 'colere', lignes: [
    'Les prix montent. La colère aussi.',
    'Dans des pays voisins, les extrêmes se répondent. On ne se parle plus qu’en camps.',
    'La colère fait oublier le reste.'] },
  { epoque: 'Bientôt', titre: 'Les guerres reviennent', image: '04-guerres', ambiance: 'braise', lignes: [
    'Aux quatre coins du monde, des frontières s’embrasent.',
    'On compte les chars, les drones, les budgets militaires.',
    'Le climat devient une ligne en bas de page. Puis plus rien.'] },
  { epoque: 'Sans que personne regarde', titre: 'La nature n’attend pas', image: '05-nature', ambiance: 'chaleur', lignes: [
    'Un été plus chaud que tous les autres. Puis un autre.',
    'Les récoltes échouent sur des continents entiers.',
    'Personne ne l’a vu venir : plus personne ne regardait.'] },
  { epoque: 'Les années 2040', titre: 'Les tempêtes', image: '06-tempetes', ambiance: 'maree', lignes: [
    'La mer n’a monté que de quelques dizaines de centimètres.',
    'Mais avec les tempêtes, les vagues entrent dans les rues.',
    'Des côtes entières se vident. On part ensemble, avec un sac, un chat, une plante.'] },
  { epoque: 'Les années 2040', titre: 'Les exodes', image: '07-exodes', ambiance: 'crepuscule', lignes: [
    'Des centaines de millions de personnes prennent la route.',
    'La chaleur, la faim et les épidémies tuent par millions.',
    'Les vieilles querelles paraissent dérisoires. Il ne reste qu’à survivre ensemble.'] },
  { epoque: '2057', titre: 'La Fracture', image: '08-fracture', ambiance: 'fracture', lignes: [
    'Un matin, une partie de la calotte de l’Antarctique glisse dans l’océan.',
    'En quelques décennies, la mer monte de plusieurs mètres.',
    'On dira longtemps « avant » et « après la Fracture ».'] },
  { epoque: '2050 – 2085', titre: 'Construire en hauteur', image: '09-hauteur', ambiance: 'aube-doree', lignes: [
    'D’abord des tours de secours, sur des piliers plantés dans la mer.',
    'Puis on les relie, on bâtit par-dessus, on comble les vides.',
    'En une génération naissent les villes verticales. La plus grande s’appelle Vertiga.'] },
  { epoque: '2062', titre: 'Le Puits Zéro', image: '10-puits-zero', ambiance: 'profondeur', lignes: [
    'Il faut aussi des abris. On creuse sous les Fondations.',
    'Au fond du Puits Zéro, des ouvriers percent une paroi.',
    'Derrière : une salle que nul humain n’a construite.'] },
  { epoque: '2062 – 2068', titre: 'Les empreintes', image: '11-empreintes', ambiance: 'cristal', lignes: [
    'Ses cristaux gardent quelque chose de plus ancien que l’humanité.',
    'Des dragons, des esprits, des êtres sans nom : des empreintes.',
    'Greffées sur un humain, elles éveillent des pouvoirs qu’aucune science n’explique.'] },
  { epoque: '2071 – 2090', titre: 'L’Ascension', image: '12-ascension', ambiance: 'or', lignes: [
    'Sept volontaires reçoivent en secret les premières empreintes.',
    'Mèche d’or, ombre qui n’est pas la leur : ce sont les Résonants.',
    'En vingt ans, ils prennent la tête des villes. Leurs familles s’installent dans les Hauts, qui flottent.'] },
  { epoque: '2088 – 2100', titre: 'La réponse du peuple', image: '13-reponse', ambiance: 'atelier', lignes: [
    'Le reste de l’humanité répond avec ses propres armes.',
    'La machine donne les Augmentés. La génétique donne les Génés.',
    'Trois lignées se font face.'] },
  { epoque: '2101', titre: 'Les Accords de Vertiga', image: '14-accords', ambiance: 'aube-grise', lignes: [
    'Une paix fragile est signée.',
    'Les Hauts gouvernent. Les districts, accrochés aux vieux piliers, élisent leurs directeurs.',
    'Pour s’agrandir, ils n’ont qu’une direction : vers le bas.'] },
  { epoque: '2121', titre: 'On a oublié, encore', image: '15-oubli', ambiance: 'nuit', lignes: [
    'Les factions se disputent les empreintes.',
    'Les Fondations se fissurent. La mer remonte, centimètre après centimètre.',
    'Presque personne ne regarde.'] },
  { epoque: '2121', titre: 'Toi', image: '16-toi', ambiance: 'foyer', lignes: [
    'Tu viens d’être élu à la tête d’un district : quelques piliers, une vieille tour.',
    'Sous elle, le puits d’un chantier des années 2060.',
    'Le lendemain de ton élection, les ouvriers ouvrent une chambre scellée depuis soixante ans.'] },
];

/** Images présentes dans public/intro/ (remplie au fur et à mesure) */
export const IMAGES_DISPONIBLES = new Set<string>([]);

/** i = plan, k = nombre de lignes affichées */
export function htmlIntro(i: number, k: number): string {
  const p = PLANS[i]!;
  const dernier = i === PLANS.length - 1;
  const complet = k >= p.lignes.length;
  const fond = IMAGES_DISPONIBLES.has(p.image) ? ` style="background-image:url('./intro/${p.image}.webp')"` : '';
  return `<section class="intro amb-${p.ambiance}${fond ? ' illustree' : ''}"${fond} aria-label="Introduction" data-action="intro-suivant">`
    + `<div class="intro-haut"><span class="sous">${i + 1} / ${PLANS.length}</span><button type="button" class="btn-sec" data-action="intro-passer">Passer</button></div>`
    + `<div class="intro-corps"><span class="epoque">${echap(p.epoque)}</span><h2>${echap(p.titre)}</h2>`
    + p.lignes.slice(0, Math.max(1, k)).map((l, n) => `<p class="ligne${n === k - 1 ? ' neuve' : ''}">${echap(l)}</p>`).join('')
    + `</div><div class="intro-bas">${i > 0 ? '<button type="button" class="btn-sec" data-action="intro-precedent">Retour</button>' : '<span></span>'}`
    + `<button type="button" class="prim" data-action="${dernier && complet ? 'intro-passer' : 'intro-suivant'}">${dernier && complet ? 'Prendre la tête du district' : 'Continuer'}</button></div></section>`;
}
