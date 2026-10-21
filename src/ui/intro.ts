// L'intro du premier lancement : on part d'aujourd'hui et on descend jusqu'en 2121.
// Aucun pays, personne ni conflit réel n'est nommé : chacun reconnaît notre époque sans qu'on la désigne.
// Chaque plan a une ambiance (fond) ; les illustrations Gemini pourront remplacer ces fonds plus tard.

import { echap } from './vue';

export interface Plan {
  epoque: string;
  titre: string;
  texte: string;
  ambiance: string;
}

export const PLANS: Plan[] = [
  {
    epoque: 'Aujourd’hui', titre: 'Le monde sait', ambiance: 'aube-grise',
    texte: 'Les glaciers reculent, les étés brûlent, les forêts partent en fumée. Les scientifiques préviennent depuis des décennies et chacun a entendu les chiffres. Beaucoup y pensent le soir, devant les informations, avec une boule au ventre.',
  },
  {
    epoque: 'Aujourd’hui', titre: 'On s’inquiète', ambiance: 'vert-tendre',
    texte: 'Il y a des marches, des sommets, des promesses, des petits gestes. Une génération entière grandit avec l’angoisse de l’avenir. Pendant quelques années, c’est le sujet de tout le monde.',
  },
  {
    epoque: 'Bientôt', titre: 'Puis on regarde ailleurs', ambiance: 'colere',
    texte: 'Les prix montent, la colère aussi. Dans des pays voisins, les extrêmes se répondent, les rues se divisent et l’on ne se parle plus qu’en camps. Les écrans débordent de rage, et la rage fait oublier le reste.',
  },
  {
    epoque: 'Bientôt', titre: 'Les guerres reviennent', ambiance: 'braise',
    texte: 'Aux quatre coins du monde, des frontières qu’on croyait figées s’embrasent. On compte les chars, les drones, les budgets militaires. Le climat devient une ligne en bas de page, puis plus rien du tout.',
  },
  {
    epoque: 'Sans que personne regarde', titre: 'La nature n’attend pas', ambiance: 'chaleur',
    texte: 'Un été plus chaud que tous les autres, puis un autre, puis un autre encore. Les récoltes échouent sur des continents entiers. Les fleuves s’assèchent ou débordent. Personne ne l’a vu venir, parce que plus personne ne regardait.',
  },
  {
    epoque: 'Les années 2040', titre: 'La mer se lève', ambiance: 'maree',
    texte: 'La glace des pôles cède bien plus vite que prévu. La mer ne monte plus de quelques millimètres, elle avale des quartiers en une saison. Des villes côtières se vident ; les voisins grimpent ensemble vers les étages, avec un sac, un chat, une plante en pot.',
  },
  {
    epoque: 'Les années 2040', titre: 'Les exodes', ambiance: 'crepuscule',
    texte: 'Des centaines de millions de personnes prennent la route. Les chaleurs mortelles, les famines et les épidémies font des morts par millions. Les frontières ne tiennent plus, et les vieilles querelles paraissent soudain dérisoires : il ne reste qu’à survivre ensemble.',
  },
  {
    epoque: 'Les années 2050', titre: 'Construire en hauteur', ambiance: 'aube-doree',
    texte: 'Ceux qui restent se serrent. On ne bâtit plus en largeur mais vers le ciel : des tours colossales, reliées par des passerelles, posées sur des piliers géants plantés dans la mer. Ainsi naissent les mégapoles verticales. La plus grande s’appelle Vertiga.',
  },
  {
    epoque: '2062', titre: 'Le Puits Zéro', ambiance: 'profondeur',
    texte: 'Il faut aussi des abris contre les tempêtes et les chaleurs, alors on creuse sous les Fondations. Au fond du Puits Zéro, une équipe d’ouvriers perce une paroi et découvre une salle immense que nul humain n’a construite : des formes courbes impossibles, et des cristaux qui brillent dans le faisceau des lampes.',
  },
  {
    epoque: '2062', titre: 'Les empreintes', ambiance: 'cristal',
    texte: 'Ces cristaux taillés gardent quelque chose : des données qui imitent une conscience, bien plus anciennes que l’humanité. Des dragons, des esprits, des êtres sans nom. Greffées sur un humain, ces empreintes éveillent des pouvoirs qu’aucune science n’explique. Sous la ville, les ruines continuent, couche après couche : les Strates.',
  },
  {
    epoque: 'Les années 2070', titre: 'L’Ascension', ambiance: 'or',
    texte: 'Les premiers greffés deviennent des êtres à part. On les reconnaît à une mèche d’or et à leur ombre, qui n’est pas la leur. Ces Résonants prennent la tête des villes, puis du monde. Leurs familles s’installent dans les Hauts, sur des îles qui flottent au-dessus des nuages.',
  },
  {
    epoque: 'Les années 2080', titre: 'La réponse du peuple', ambiance: 'atelier',
    texte: 'Le reste de l’humanité répond avec ses propres armes. La machine donne les Augmentés, aux greffes d’acier et de cristal. La génétique donne les Génés, qui changent leur propre corps. Trois lignées se font face, et le monde manque de basculer encore une fois.',
  },
  {
    epoque: '2101', titre: 'Les Accords de Vertiga', ambiance: 'aube-grise',
    texte: 'Une paix fragile est signée. Les Hauts gouvernent ; les districts, accrochés aux vieux piliers, élisent leurs directeurs. Pour s’agrandir, ils n’ont qu’une direction possible : vers le bas.',
  },
  {
    epoque: '2121', titre: 'On a oublié, encore', ambiance: 'nuit',
    texte: 'Les inquiétudes d’autrefois ont été oubliées une seconde fois. Les factions se disputent les empreintes. Pendant ce temps, les Fondations se fissurent et la mer remonte de quelques centimètres chaque année. Presque personne ne regarde.',
  },
  {
    epoque: '2121', titre: 'Toi', ambiance: 'foyer',
    texte: 'Tu viens d’être élu à la tête d’un district : quelques piliers, une vieille tour, et sous elle l’ancien puits d’un chantier des années 2060. Le lendemain de ton élection, les ouvriers ouvrent une chambre scellée depuis soixante ans. Ce qu’elle contient ne ressemble à rien de connu.',
  },
];

export function htmlIntro(i: number): string {
  const p = PLANS[i]!;
  const dernier = i === PLANS.length - 1;
  return `<section class="intro amb-${p.ambiance}" aria-label="Introduction" data-action="intro-suivant">`
    + `<div class="intro-haut"><span class="sous">${i + 1} / ${PLANS.length}</span><button type="button" class="btn-sec" data-action="intro-passer">Passer</button></div>`
    + `<div class="intro-corps"><span class="epoque">${echap(p.epoque)}</span><h2>${echap(p.titre)}</h2><p>${echap(p.texte)}</p></div>`
    + `<div class="intro-bas">${i > 0 ? '<button type="button" class="btn-sec" data-action="intro-precedent">Retour</button>' : '<span></span>'}`
    + `<button type="button" class="prim" data-action="${dernier ? 'intro-passer' : 'intro-suivant'}">${dernier ? 'Prendre la tête du district' : 'Continuer'}</button></div></section>`;
}
