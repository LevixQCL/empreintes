// Les effets spéciaux des cartes : leur nom et leur texte, au même endroit pour l'affichage.
// Les règles elles-mêmes sont appliquées dans combat.ts (et l'Accord dans regles.ts).

import type { Effet, TypeEffet } from './types';
import { REGLES } from './regles';
import { t } from './i18n';

const pc = (x: number) => `${Math.round(x * 100)} %`;

export const NOMS_EFFET: Record<TypeEffet, string> = {
  percant: t('Perçant'),
  siphon: t('Siphon'),
  flux: t('Surcharge'),
  desarmer: t('Troubler'),
  fissure: t('Fissure'),
  elan: t('Élan'),
  crescendo: t('Crescendo'),
  accord: t('Accord'),
  vague: t('Vague'),
  rempart: t('Rempart'),
  riposte: t('Riposte'),
  decharge: t('Décharge'),
  diapason: t('Diapason'),
  unisson: t('Unisson'),
  curee: t('Curée'),
  lecture: t('Lecture'),
  faille: t('Faille'),
  rafale: t('Rafale'),
  debord: t('Débord'),
  rapt: t('Rapt'),
  rappel: t('Rappel'),
  pioche: t('Plan'),
  breche: t('Brèche'),
  secours: t('Secours'),
  surtension: t('Surtension'),
  empreinte: t('Empreinte'),
  releve: t('Relève'),
  sourdine: t('Sourdine'),
  amorce: t('Amorce'),
  servo: t('Servo'),
  contrepoint: t('Contrepoint'),
  execution: t('Exécution'),
  tenacite: t('Ténacité'),
};

/** Phrase courte qui explique l'effet au joueur */
export function texteEffet(e: Effet): string {
  switch (e.type) {
    case 'percant': return t('Ignore le bouclier et le blindage de l’ennemi.');
    case 'siphon': return t`Le Porteur qui la joue récupère ${pc(e.part)} des dégâts infligés.`;
    case 'flux': return t`Remplit le Flux (+${e.v}).`;
    case 'desarmer': return t`L’attaque annoncée par l’ennemi visé perd ${pc(e.part)} de sa force.`;
    case 'fissure': return t`L’ennemi subit ${pc(e.part)} de dégâts en plus, ce tour-ci et le suivant.`;
    case 'elan': return t('+1 place dans la chaîne au tour suivant.');
    case 'crescendo': return t`+${pc(e.part)} de force pour chaque carte posée avant elle.`;
    case 'accord': return t('Fréquence libre : prolonge toujours la suite.');
    case 'vague': return t('Soigne toute l’escouade.');
    case 'rempart': return t`Garde ${pc(e.part)} du bouclier d’escouade restant pour le tour suivant.`;
    case 'riposte': return t`Après son bouclier, frappe de ${pc(e.part)} du bouclier d’escouade.`;
    case 'decharge':
      if (e.max) return t`Prend ${e.max} Flux au plus : +${pc(e.part)} de force par Flux pris ; le reste est gardé.`;
      return t`Vide le Flux : +${pc(e.part)} de force par Flux vidé.${e.recharge ? t` S’il était déjà vide, le remplit (+${e.recharge}).` : ''}`;
    case 'diapason': return t('Fréquence libre : reprend celle de la carte posée juste avant.');
    case 'unisson': return t`+${pc(e.part)} de force pour chaque autre carte de la même Fréquence dans la chaîne.`;
    case 'curee': return t`+${pc(e.part)} de force si l’ennemi visé est fissuré ou à moins de la moitié de ses PV.`;
    case 'lecture': return t('Brise la Fêlure de l’ennemi visé, quelle que soit sa Fréquence.');
    case 'faille': return t`+${pc(e.part)} de force si la Fêlure de l’ennemi visé est brisée.`;
    case 'rafale': return t('Frappe une seconde fois si la chaîne compte au moins 4 cartes.');
    case 'debord': return t('Soigne toute l’escouade ; le soin en trop devient du bouclier d’escouade.');
    case 'rapt': return t('Arrache tout le bouclier de l’ennemi visé et le donne à l’escouade.');
    case 'rappel': return t('La carte la plus forte de la chaîne revient en tête de pioche.');
    case 'surtension': return t`Le Porteur brûle ${pc(e.cout)} de ses PV max (sans tomber) : +${pc(e.part)} de force.`;
    case 'empreinte': return t`Copie l’effet de la carte posée juste avant ; s’il n’y en a pas, +${pc(REGLES.empreinteSeule - 1)} de force.`;
    case 'releve': return t('Relève un Porteur à terre avec tout le soin ; sinon, soigne normalement.');
    case 'pioche': return t('Au tour suivant, ta main compte une carte de plus.');
    case 'breche': return t('Brise tout le bouclier de l’ennemi visé avant de frapper.');
    case 'secours': return t`+${pc(e.part)} de force pour chaque Porteur à terre.`;
    case 'sourdine': return t`L’ennemi visé perd ${pc(e.part)} de ce qu’il prépare : attaque, bouclier ou soin.`;
    case 'amorce': return t`La carte posée juste après elle gagne +${pc(e.part)} de force.`;
    case 'servo': return t('Une carte lourde de la chaîne ne prend qu’une place.');
    case 'contrepoint': return t`Dans une suite qui résonne : +${pc(e.part)} de force pour chaque autre lignée de la suite.`;
    case 'execution': return t`Après le coup, l’ennemi visé tombe s’il lui reste moins de ${pc(e.part)} de ses PV (jamais un gardien).`;
    case 'tenacite': return t('Au tour ennemi qui suit, aucun Porteur ne tombe : le coup fatal le laisse à 1 PV.');
  }
}

/** Formule courte (15 signes au plus) posée sur la carte à côté du nom de l'effet ; la phrase entière va dans le détail */
export function formuleEffet(e: Effet): string {
  switch (e.type) {
    case 'percant': return 'ignore bouclier';
    case 'siphon': return `rend ${pc(e.part)}`;
    case 'flux': return t`Flux +${e.v}`;
    case 'desarmer': return t`−${pc(e.part)} ennemi`;
    case 'fissure': return t`+${pc(e.part)} dégâts`;
    case 'elan': return '+1 place';
    case 'crescendo': return t`+${pc(e.part)} / carte`;
    case 'accord': return t('Fréquence libre');
    case 'vague': return 'soigne tous';
    case 'rempart': return `garde ${pc(e.part)}`;
    case 'riposte': return t`frappe ${pc(e.part)} du bouclier`;
    case 'decharge': return e.max ? t`+${pc(e.part)}, ${e.max} Flux` : e.recharge ? t`+${pc(e.part)} / Flux, recharge` : t`+${pc(e.part)} / Flux vidé`;
    case 'diapason': return t('Fréq. d’avant');
    case 'unisson': return t`+${pc(e.part)} / pareille`;
    case 'curee': return t`+${pc(e.part)} proie blessée`;
    case 'lecture': return t('brise la Fêlure');
    case 'faille': return t`+${pc(e.part)} si Fêlure`;
    case 'rafale': return t('×2 dès 4 cartes');
    case 'debord': return t('tous, trop → bouclier');
    case 'rapt': return t('vole le bouclier');
    case 'rappel': return t('repioche la + forte');
    case 'surtension': return `+${pc(e.part)}, −PV`;
    case 'empreinte': return t('copie l’effet');
    case 'releve': return 'remet debout';
    case 'pioche': return t('+1 carte au tour suivant');
    case 'breche': return t('brise le bouclier');
    case 'secours': return t`+${pc(e.part)} / Porteur à terre`;
    case 'sourdine': return t`−${pc(e.part)} intention`;
    case 'amorce': return t`+${pc(e.part)} suivante`;
    case 'servo': return t('lourde = 1 place');
    case 'contrepoint': return t`+${pc(e.part)} / lignée`;
    case 'execution': return t`achève sous ${pc(e.part)}`;
    case 'tenacite': return 'personne ne tombe';
  }
}

export const libelleEffet = (e: Effet) => `${NOMS_EFFET[e.type]} : ${texteEffet(e)}`;

/** Les effets d'une carte (deux pour une carte de l’Héritage) */
export const effetsDe = (c: { effet?: Effet; effet2?: Effet }): Effet[] => [c.effet, c.effet2].filter((e): e is Effet => !!e);
/** Leurs noms, à la suite (« Accord · Troubler ») */
export const nomsEffets = (c: { effet?: Effet; effet2?: Effet }) => effetsDe(c).map((e) => NOMS_EFFET[e.type]).join(' · ');
