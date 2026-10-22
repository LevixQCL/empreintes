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
  }
}

export const libelleEffet = (e: Effet) => `${NOMS_EFFET[e.type]} : ${texteEffet(e)}`;
