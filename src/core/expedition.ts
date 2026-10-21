// Une expédition : l'escouade descend dans une Strate et enchaîne trois combats,
// avec un peu de soin entre deux. Le district reprend la main à la fin.

import { creerCombat } from './combat';
import { sequenceStrate } from './donnees';
import { REGLES } from './regles';
import type { CombatEtat, GesteDef, PorteurEtat } from './types';

export interface Expedition {
  strate: number;
  sequence: string[];
  index: number;
  porteurs: PorteurEtat[];
  deck: GesteDef[];
  combat: CombatEtat;
  /** composants trouvés pendant l'expédition (versés au district au retour) */
  butin: number;
  /** l'expédition est finie (victoire finale ou défaite) */
  terminee: boolean;
  /** le combat courant a déjà été clôturé (évite de compter deux fois le butin) */
  cloture: boolean;
  /** la chambre scellée : combat guidé du premier lancement */
  tutoriel?: boolean;
}

/** Puissance des ennemis selon la profondeur */
export const forceStrate = (strate: number) => 1 + 0.15 * (strate - 1);
/** Composants gagnés par victoire */
export const butinCombat = (strate: number, index: number) => Math.round((index === 2 ? 14 : 6) * (1 + 0.25 * (strate - 1)));

export function nouvelleExpedition(opts: {
  porteurs: PorteurEtat[]; deck: GesteDef[]; strate: number; rng: number;
  sequence?: string[]; force?: number; tutoriel?: boolean;
}): Expedition {
  const sequence = opts.sequence ?? sequenceStrate(opts.strate, opts.rng);
  return {
    strate: opts.strate,
    sequence,
    index: 0,
    porteurs: opts.porteurs,
    deck: opts.deck,
    combat: creerCombat({
      porteurs: opts.porteurs, ennemiId: sequence[0]!, rng: opts.rng, deck: opts.deck,
      force: opts.force ?? forceStrate(opts.strate), ordonne: opts.tutoriel,
    }),
    butin: 0,
    terminee: false,
    cloture: false,
    ...(opts.tutoriel ? { tutoriel: true } : {}),
  };
}

/** À appeler une fois quand un combat se termine : butin, et fin d'expédition en cas de défaite */
export function cloturerCombat(x: Expedition): Expedition {
  if (x.cloture) return x;
  if (x.combat.issue === 'victoire') {
    const fin = x.index >= x.sequence.length - 1;
    return { ...x, butin: x.butin + butinCombat(x.strate, x.index), terminee: fin, cloture: true };
  }
  if (x.combat.issue === 'defaite') return { ...x, terminee: true, cloture: true };
  return x;
}

/** Après une victoire : soin partiel puis combat suivant */
export function combatSuivant(x: Expedition): Expedition {
  if (x.combat.issue !== 'victoire' || x.terminee) return x;
  const porteurs = x.combat.porteurs.map((p) => ({
    ...p,
    pv: Math.min(p.pvMax, Math.max(p.pv, 0) + Math.round(p.pvMax * REGLES.soinEntreCombats)),
    aTerre: false,
  }));
  const index = x.index + 1;
  return {
    ...x,
    index,
    porteurs,
    cloture: false,
    combat: creerCombat({ porteurs, ennemiId: x.sequence[index]!, rng: x.combat.rng, deck: x.deck, force: forceStrate(x.strate) }),
  };
}
