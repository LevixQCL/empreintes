// Les effets spéciaux des cartes : leur nom et leur texte, au même endroit pour l'affichage.
// Les règles elles-mêmes sont appliquées dans combat.ts (et l'Accord dans regles.ts).

import type { Effet, TypeEffet } from './types';

const pc = (x: number) => `${Math.round(x * 100)} %`;

export const NOMS_EFFET: Record<TypeEffet, string> = {
  percant: 'Perçant',
  siphon: 'Siphon',
  flux: 'Surcharge',
  desarmer: 'Désarmer',
  fissure: 'Fissure',
  elan: 'Élan',
  crescendo: 'Crescendo',
  accord: 'Accord',
  vague: 'Vague',
  rempart: 'Rempart',
  riposte: 'Riposte',
  decharge: 'Décharge',
  diapason: 'Diapason',
  unisson: 'Unisson',
};

/** Phrase courte qui explique l'effet au joueur */
export function texteEffet(e: Effet): string {
  switch (e.type) {
    case 'percant': return 'Ignore le bouclier et le blindage de l’ennemi.';
    case 'siphon': return `Le Porteur qui la joue récupère ${pc(e.part)} des dégâts infligés.`;
    case 'flux': return `Remplit le Flux (+${e.v}).`;
    case 'desarmer': return `La prochaine attaque ennemie perd ${pc(e.part)} de sa force.`;
    case 'fissure': return `L’ennemi subit ${pc(e.part)} de dégâts en plus, ce tour-ci et le suivant.`;
    case 'elan': return '+1 place dans la chaîne au tour suivant.';
    case 'crescendo': return `+${pc(e.part)} de force pour chaque carte posée avant elle.`;
    case 'accord': return 'Fréquence libre : prolonge toujours la suite.';
    case 'vague': return 'Soigne toute l’escouade.';
    case 'rempart': return `Garde ${pc(e.part)} du bouclier d’escouade restant pour le tour suivant.`;
    case 'riposte': return `Après son bouclier, frappe de ${pc(e.part)} du bouclier d’escouade.`;
    case 'decharge': return `Vide le Flux : +${pc(e.part)} de force par Flux vidé.`;
    case 'diapason': return 'Fréquence libre : reprend celle de la carte posée juste avant.';
    case 'unisson': return `+${pc(e.part)} de force pour chaque autre carte de la même Fréquence dans la chaîne.`;
  }
}

/** Formule courte (15 signes au plus) posée sur la carte à côté du nom de l'effet ; la phrase entière va dans le détail */
export function formuleEffet(e: Effet): string {
  switch (e.type) {
    case 'percant': return 'ignore bouclier';
    case 'siphon': return `rend ${pc(e.part)}`;
    case 'flux': return `Flux +${e.v}`;
    case 'desarmer': return `−${pc(e.part)} ennemi`;
    case 'fissure': return `+${pc(e.part)} dégâts`;
    case 'elan': return '+1 place';
    case 'crescendo': return `+${pc(e.part)} / carte`;
    case 'accord': return 'Fréquence libre';
    case 'vague': return 'soigne tous';
    case 'rempart': return `garde ${pc(e.part)}`;
    case 'riposte': return `frappe ${pc(e.part)} du bouclier`;
    case 'decharge': return `+${pc(e.part)} / Flux vidé`;
    case 'diapason': return 'Fréq. d’avant';
    case 'unisson': return `+${pc(e.part)} / pareille`;
  }
}

export const libelleEffet = (e: Effet) => `${NOMS_EFFET[e.type]} : ${texteEffet(e)}`;

/** Les effets d'une carte (deux pour une carte de l’Héritage) */
export const effetsDe = (c: { effet?: Effet; effet2?: Effet }): Effet[] => [c.effet, c.effet2].filter((e): e is Effet => !!e);
/** Leurs noms, à la suite (« Accord · Désarmer ») */
export const nomsEffets = (c: { effet?: Effet; effet2?: Effet }) => effetsDe(c).map((e) => NOMS_EFFET[e.type]).join(' · ');
