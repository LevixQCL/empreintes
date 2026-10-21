import type { BatimentId, EnnemiDef, GesteDef, Lignee, ModuleDef, PorteurDef } from './types';

// ---------- Porteurs ----------
// Trois Porteurs nommés + trois recrues anonymes, une par lignée.
export const PORTEURS: PorteurDef[] = [
  { id: 'ilka', nom: 'Ilka', lignee: 'tech', pvMax: 38, nomme: true },
  { id: 'doran', nom: 'Doran', lignee: 'bio', pvMax: 46, nomme: true },
  { id: 'vela', nom: 'Véla', lignee: 'reso', pvMax: 31, nomme: true },
  { id: 'coursier', nom: 'Coursier', lignee: 'tech', pvMax: 32, nomme: false },
  { id: 'docker', nom: 'Docker', lignee: 'bio', pvMax: 42, nomme: false },
  { id: 'guetteur', nom: 'Guetteur', lignee: 'reso', pvMax: 30, nomme: false },
];

export const NOMS_LIGNEE: Record<Lignee | 'neutre', { nom: string; court: string }> = {
  tech: { nom: 'Augmenté', court: 'TECH' },
  bio: { nom: 'Géné', court: 'GÉNÉ' },
  reso: { nom: 'Résonant', court: 'RÉSONANT' },
  neutre: { nom: 'Spécial', court: 'SPÉCIAL' },
};

// ---------- Gestes ----------
// Chaque Porteur apporte ses Gestes au deck commun. Une escouade de 3 = 18 Gestes + 2 spéciaux = 20.
const g = (porteur: string | null, id: string, nom: string, f: number, type: GesteDef['type'], v: number, lourd = false): GesteDef =>
  ({ id, porteur, nom, f, type, v, ...(lourd ? { lourd: true } : {}) });

export const GESTES_PORTEUR: Record<string, GesteDef[]> = {
  ilka: [g('ilka', 'ruee', 'Ruée', 3, 'atk', 8), g('ilka', 'ruee', 'Ruée', 3, 'atk', 8), g('ilka', 'bond', 'Bond', 4, 'atk', 6),
    g('ilka', 'esquive', 'Esquive', 5, 'bouclier', 6), g('ilka', 'tir', 'Tir', 6, 'atk', 10), g('ilka', 'tir-vif', 'Tir vif', 2, 'atk', 5)],
  doran: [g('doran', 'morsure', 'Morsure', 2, 'atk', 7), g('doran', 'morsure', 'Morsure', 2, 'atk', 7), g('doran', 'carapace', 'Carapace', 1, 'bouclier', 8),
    g('doran', 'regenerer', 'Régénérer', 4, 'soin', 9), g('doran', 'charge', 'Charge', 5, 'atk', 9), g('doran', 'grogner', 'Grogner', 3, 'bouclier', 5)],
  vela: [g('vela', 'murmure', 'Murmure', 7, 'bouclier', 7), g('vela', 'murmure', 'Murmure', 7, 'bouclier', 7), g('vela', 'echo', 'Écho', 9, 'atk', 8),
    g('vela', 'souffle', 'Souffle', 8, 'atk', 20, true), g('vela', 'apaiser', 'Apaiser', 6, 'soin', 7), g('vela', 'eclat', 'Éclat', 8, 'atk', 11)],
  coursier: [g('coursier', 'sprint', 'Sprint', 4, 'atk', 7), g('coursier', 'sprint', 'Sprint', 4, 'atk', 7), g('coursier', 'crochet', 'Crochet', 5, 'atk', 8),
    g('coursier', 'roulade', 'Roulade', 6, 'bouclier', 6), g('coursier', 'coup-bas', 'Coup bas', 3, 'atk', 6), g('coursier', 'relais', 'Relais', 7, 'soin', 5)],
  docker: [g('docker', 'poigne', 'Poigne', 2, 'atk', 8), g('docker', 'epaule', 'Épaule', 3, 'atk', 9), g('docker', 'cuir', 'Cuir épais', 1, 'bouclier', 9),
    g('docker', 'cuir', 'Cuir épais', 1, 'bouclier', 9), g('docker', 'soufflet', 'Soufflet', 4, 'atk', 7), g('docker', 'reprendre', 'Reprendre', 5, 'soin', 6)],
  guetteur: [g('guetteur', 'presage', 'Présage', 6, 'bouclier', 6), g('guetteur', 'presage', 'Présage', 6, 'bouclier', 6), g('guetteur', 'trait', 'Trait d’ombre', 7, 'atk', 9),
    g('guetteur', 'vigie', 'Vigie', 8, 'bouclier', 8), g('guetteur', 'chuchote', 'Chuchoter', 9, 'atk', 10), g('guetteur', 'veille', 'Veille', 5, 'soin', 6)],
};

export const GESTES_SPECIAUX: GesteDef[] = [g(null, 'stimulant', 'Stimulant', 1, 'soin', 6), g(null, 'repli', 'Repli', 9, 'bouclier', 10)];

// ---------- Modules (fabriqués à la Forge) ----------
// Un Module se greffe sur un Porteur de sa lignée et ajoute 2 Gestes au deck quand ce Porteur combat.
export const MODULES: ModuleDef[] = [
  { id: 'jambes-ressort', nom: 'Jambes à ressort', lignee: 'tech', cout: { energie: 60, composants: 8 }, minutes: 3,
    gestes: [{ nom: 'Détente', f: 4, type: 'atk', v: 11 }, { nom: 'Saut d’appui', f: 5, type: 'bouclier', v: 8 }] },
  { id: 'glande-amber', nom: 'Glande d’ambre', lignee: 'bio', cout: { energie: 60, composants: 8 }, minutes: 3,
    gestes: [{ nom: 'Sève', f: 3, type: 'soin', v: 10 }, { nom: 'Mue', f: 2, type: 'bouclier', v: 10 }] },
  { id: 'eclat-chant', nom: 'Éclat qui chante', lignee: 'reso', cout: { energie: 60, composants: 8 }, minutes: 3,
    gestes: [{ nom: 'Note haute', f: 8, type: 'atk', v: 13 }, { nom: 'Note basse', f: 7, type: 'bouclier', v: 9 }] },
];

// ---------- Bâtiments ----------
export interface BatimentDef {
  id: BatimentId;
  nom: string;
  role: string;
  /** lignée qui y travaille le mieux (+50 %) */
  affinite: Lignee | null;
  /** coût pour passer au niveau n+1 (index = niveau actuel) */
  couts: { energie: number; composants: number }[];
  niveauMax: number;
}

export const BATIMENTS: BatimentDef[] = [
  { id: 'noyau', nom: 'Tour du Noyau', role: 'Le cœur du district. Son niveau limite celui des autres bâtiments et la capacité de stockage.', affinite: null,
    couts: [{ energie: 0, composants: 0 }, { energie: 120, composants: 15 }, { energie: 300, composants: 40 }], niveauMax: 3 },
  { id: 'generateur', nom: 'Générateur', role: 'Produit de l’énergie en continu, même quand tu ne joues pas.', affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 80, composants: 10 }, { energie: 200, composants: 25 }], niveauMax: 3 },
  { id: 'forge', nom: 'Forge', role: 'Fabrique des Modules qui ajoutent de nouveaux Gestes au deck. Il faut un Porteur au travail.', affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 100, composants: 12 }, { energie: 240, composants: 30 }], niveauMax: 3 },
  { id: 'clinique', nom: 'Clinique', role: 'Soigne l’Usure des Porteurs qui se reposent au district.', affinite: 'bio',
    couts: [{ energie: 0, composants: 0 }, { energie: 90, composants: 10 }, { energie: 220, composants: 28 }], niveauMax: 3 },
];

// ---------- Ennemis ----------
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

/** Ancien deck fixe du prototype (Ilka, Doran, Véla + 2 spéciaux) */
export const DECK_DEPART: GesteDef[] = [...GESTES_PORTEUR.ilka!, ...GESTES_PORTEUR.doran!, ...GESTES_PORTEUR.vela!, ...GESTES_SPECIAUX];

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

export const batimentDef = (id: BatimentId): BatimentDef => BATIMENTS.find((b) => b.id === id)!;
export const moduleDef = (id: string): ModuleDef => {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error('Module inconnu : ' + id);
  return m;
};
