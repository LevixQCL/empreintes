// Une expédition : une suite de combats dans une Strate, avec un peu de soin entre deux.
// C'est l'objet sauvegardé (localement et dans le compte).

import { creerCombat } from './combat';
import { ENNEMIS, PORTEURS, porteurDef } from './donnees';
import { REGLES } from './regles';
import { graine } from './rng';
import type { CombatEtat, PorteurEtat } from './types';

export const VERSION_SAUVEGARDE = 1;

export interface Expedition {
  version: number;
  strate: number;
  sequence: string[];
  index: number;
  porteurs: PorteurEtat[];
  combat: CombatEtat;
  /** victoire de l'expédition entière */
  terminee: boolean;
}

export function nouvelleExpedition(rng = graine()): Expedition {
  const porteurs = PORTEURS.map((p) => ({ id: p.id, pv: p.pvMax, aTerre: false }));
  const sequence = ENNEMIS.map((e) => e.id);
  return {
    version: VERSION_SAUVEGARDE,
    strate: 1,
    sequence,
    index: 0,
    porteurs,
    combat: creerCombat({ porteurs, ennemiId: sequence[0]!, rng }),
    terminee: false,
  };
}

/** Après une victoire : soin partiel puis combat suivant (ou fin d'expédition) */
export function combatSuivant(x: Expedition): Expedition {
  if (x.combat.issue !== 'victoire') return x;
  const porteurs = x.combat.porteurs.map((p) => {
    const max = porteurDef(p.id).pvMax;
    return { id: p.id, pv: Math.min(max, Math.max(p.pv, 0) + Math.round(max * REGLES.soinEntreCombats)), aTerre: false };
  });
  if (x.index >= x.sequence.length - 1) return { ...x, porteurs, terminee: true };
  const index = x.index + 1;
  return {
    ...x,
    index,
    porteurs,
    combat: creerCombat({ porteurs, ennemiId: x.sequence[index]!, rng: x.combat.rng }),
  };
}

export function estValide(x: unknown): x is Expedition {
  const e = x as Expedition | null;
  return !!e && e.version === VERSION_SAUVEGARDE && Array.isArray(e.sequence) && !!e.combat && Array.isArray(e.combat.main);
}
