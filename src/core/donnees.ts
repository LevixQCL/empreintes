import type { EnnemiDef, GesteDef, Lignee, PorteurDef } from './types';

export const PORTEURS: PorteurDef[] = [
  { id: 'ilka', nom: 'Ilka', lignee: 'tech', pvMax: 38 },
  { id: 'doran', nom: 'Doran', lignee: 'bio', pvMax: 46 },
  { id: 'vela', nom: 'Véla', lignee: 'reso', pvMax: 31 },
];

export const NOMS_LIGNEE: Record<Lignee | 'neutre', { nom: string; court: string }> = {
  tech: { nom: 'Augmenté', court: 'TECH' },
  bio: { nom: 'Géné', court: 'GÉNÉ' },
  reso: { nom: 'Résonant', court: 'RÉSONANT' },
  neutre: { nom: 'Spécial', court: 'SPÉCIAL' },
};

// Deck de départ : 20 Gestes partagés par les trois Porteurs.
export const DECK_DEPART: GesteDef[] = [
  { id: 'ruee', porteur: 'ilka', nom: 'Ruée', f: 3, type: 'atk', v: 8 },
  { id: 'ruee', porteur: 'ilka', nom: 'Ruée', f: 3, type: 'atk', v: 8 },
  { id: 'bond', porteur: 'ilka', nom: 'Bond', f: 4, type: 'atk', v: 6 },
  { id: 'esquive', porteur: 'ilka', nom: 'Esquive', f: 5, type: 'bouclier', v: 6 },
  { id: 'tir', porteur: 'ilka', nom: 'Tir', f: 6, type: 'atk', v: 10 },
  { id: 'tir-vif', porteur: 'ilka', nom: 'Tir vif', f: 2, type: 'atk', v: 5 },
  { id: 'morsure', porteur: 'doran', nom: 'Morsure', f: 2, type: 'atk', v: 7 },
  { id: 'morsure', porteur: 'doran', nom: 'Morsure', f: 2, type: 'atk', v: 7 },
  { id: 'carapace', porteur: 'doran', nom: 'Carapace', f: 1, type: 'bouclier', v: 8 },
  { id: 'regenerer', porteur: 'doran', nom: 'Régénérer', f: 4, type: 'soin', v: 9 },
  { id: 'charge', porteur: 'doran', nom: 'Charge', f: 5, type: 'atk', v: 9 },
  { id: 'grogner', porteur: 'doran', nom: 'Grogner', f: 3, type: 'bouclier', v: 5 },
  { id: 'murmure', porteur: 'vela', nom: 'Murmure', f: 7, type: 'bouclier', v: 7 },
  { id: 'murmure', porteur: 'vela', nom: 'Murmure', f: 7, type: 'bouclier', v: 7 },
  { id: 'echo', porteur: 'vela', nom: 'Écho', f: 9, type: 'atk', v: 8 },
  { id: 'souffle', porteur: 'vela', nom: 'Souffle', f: 8, type: 'atk', v: 20, lourd: true },
  { id: 'apaiser', porteur: 'vela', nom: 'Apaiser', f: 6, type: 'soin', v: 7 },
  { id: 'eclat', porteur: 'vela', nom: 'Éclat', f: 8, type: 'atk', v: 11 },
  { id: 'stimulant', porteur: null, nom: 'Stimulant', f: 1, type: 'soin', v: 6 },
  { id: 'repli', porteur: null, nom: 'Repli', f: 9, type: 'bouclier', v: 10 },
];

export const ENNEMIS: EnnemiDef[] = [
  {
    id: 'remanent', nom: 'Rémanent', lignee: 'reso', tag: 'ANCIEN', pvMax: 72,
    motif: [
      { type: 'atk', nom: 'Griffe', v: 8, cible: 'hasard' },
      { type: 'atk', nom: 'Griffe', v: 10, cible: 'faible' },
      { type: 'bouclier', v: 8 },
      { type: 'atk', nom: 'Lacération', v: 14, cible: 'hasard' },
    ],
  },
  {
    id: 'vigie', nom: 'Vigie de dépôt', lignee: 'tech', tag: 'ANCIENNE MACHINE', pvMax: 95,
    motif: [
      { type: 'atk', nom: 'Rayon', v: 10, cible: 'reso' },
      { type: 'atk', nom: 'Balayage', v: 5, zone: true },
      { type: 'atk', nom: 'Rayon', v: 11, cible: 'reso' },
      { type: 'bouclier', v: 10 },
    ],
  },
  {
    id: 'confluence', nom: 'Confluence', lignee: 'bio', tag: 'BOSS · EMPREINTES MÊLÉES', pvMax: 165,
    motif: [
      { type: 'atk', nom: 'Ressac', v: 12, cible: 'hasard' },
      { type: 'atk', nom: 'Débordement', v: 7, zone: true },
      { type: 'boost' },
      { type: 'atk', nom: 'Fracture', v: 9, cible: 'faible' },
      { type: 'bouclier', v: 12 },
    ],
  },
];

export const porteurDef = (id: string): PorteurDef => {
  const p = PORTEURS.find((x) => x.id === id);
  if (!p) throw new Error('Porteur inconnu : ' + id);
  return p;
};

export const ennemiDef = (id: string): EnnemiDef => {
  const e = ENNEMIS.find((x) => x.id === id);
  if (!e) throw new Error('Ennemi inconnu : ' + id);
  return e;
};
