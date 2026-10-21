import type { BatimentId, Effet, EnnemiDef, GesteDef, Lignee, ModuleDef, PorteurDef, Rarete } from './types';

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

/**
 * Quand on greffe une carte, ses Gestes REMPLACENT des Gestes de base du Porteur (ils ne s'ajoutent pas) :
 * le deck reste autour de 20 Gestes et chaque carte se sent. Voici l'ordre dans lequel les Gestes de base
 * cèdent leur place (index dans GESTES_PORTEUR) ; le Geste emblématique part en dernier.
 */
export const ORDRE_REMPLACEMENT: Record<string, number[]> = {
  ilka: [5, 2, 1, 3, 4, 0],
  doran: [5, 1, 4, 2, 0, 3],
  vela: [1, 5, 2, 4, 0, 3],
  coursier: [4, 1, 2, 3, 0, 5],
  docker: [4, 3, 1, 0, 2, 5],
  guetteur: [1, 4, 2, 3, 0, 5],
};

/** Les Gestes de base qui restent quand `n` Gestes de cartes sont greffés */
export function gestesDeBaseRestants(porteurId: string, n: number): GesteDef[] {
  const base = GESTES_PORTEUR[porteurId] ?? [];
  const partis = new Set((ORDRE_REMPLACEMENT[porteurId] ?? []).slice(0, n));
  return base.filter((_, i) => !partis.has(i));
}

/** Les Gestes de base qu'une carte remplacerait, si on la greffe en plus de celles déjà portées */
export function gestesRemplaces(porteurId: string, dejaGreffes: number, nouveaux: number): GesteDef[] {
  const base = GESTES_PORTEUR[porteurId] ?? [];
  return (ORDRE_REMPLACEMENT[porteurId] ?? []).slice(dejaGreffes, dejaGreffes + nouveaux).map((i) => base[i]!).filter(Boolean);
}

export const GESTES_SPECIAUX: GesteDef[] = [{ ...g(null, 'stimulant', 'Stimulant', 1, 'soin', 5), effet: { type: 'vague' } }, g(null, 'repli', 'Repli', 9, 'bouclier', 10)];

// ---------- Modules : les cartes de collection ----------
// Un Module se greffe sur un Porteur de sa lignée : ses Gestes remplacent une partie des Gestes de base du Porteur.
// Les raretés hautes apportent plus de Gestes et des Gestes lourds, pas seulement de plus gros chiffres.
type GM = ModuleDef['gestes'][number];
const x = (nom: string, f: number, type: GM['type'], v: number, lourd = false, effet?: Effet): GM =>
  ({ nom, f, type, v, ...(lourd ? { lourd: true } : {}), ...(effet ? { effet } : {}) });
const m = (id: string, nom: string, lignee: Lignee, rarete: Rarete, gestes: GM[]): ModuleDef => ({ id, nom, lignee, rarete, gestes });

// Le fer n'a pas d'effet. Le cuivre en a un, l'argent et l'or en ont sur presque tous leurs Gestes.
// Chaque lignée a ses effets de prédilection :
// Augmentés = Perçant, Surcharge, Élan (la machine calcule) ;
// Génés = Siphon, Vague, Rempart (le corps encaisse et se refait) ;
// Résonants = Désarmer, Fissure, Accord, Crescendo (l'empreinte lit et amplifie).
export const MODULES: ModuleDef[] = [
  // Augmentés : Fréquences basses et moyennes
  m('jambes-ressort', 'Jambes à ressort', 'tech', 'fer', [x('Détente', 4, 'atk', 11), x('Saut d’appui', 5, 'bouclier', 8)]),
  m('gant-arc', 'Gant à arc', 'tech', 'fer', [x('Décharge', 6, 'atk', 10), x('Écran', 7, 'bouclier', 7)]),
  m('oeil-relais', 'Œil-relais', 'tech', 'fer', [x('Visée', 5, 'atk', 9), x('Diagnostic', 3, 'soin', 6)]),
  m('coeur-turbine', 'Cœur-turbine', 'tech', 'cuivre', [x('Surrégime', 7, 'atk', 11, false, { type: 'flux', v: 1 }), x('Refroidir', 6, 'bouclier', 10)]),
  m('bras-grue', 'Bras-grue', 'tech', 'argent', [x('Levage', 8, 'atk', 24, true, { type: 'percant' }), x('Étai', 6, 'bouclier', 13, false, { type: 'elan' }), x('Riveter', 4, 'atk', 12, false, { type: 'flux', v: 1 })]),
  m('lames-orbitales', 'Lames orbitales', 'tech', 'or', [x('Orbite', 3, 'atk', 11, false, { type: 'percant' }), x('Orbite basse', 2, 'bouclier', 12, false, { type: 'elan' }),
    x('Tourbillon', 9, 'atk', 22, true, { type: 'crescendo', part: 0.4 })]),
  // Génés : Fréquences basses
  m('glande-ambre', 'Glande d’ambre', 'bio', 'fer', [x('Sève', 3, 'soin', 7), x('Mue', 2, 'bouclier', 8)]),
  m('crocs-fossiles', 'Crocs fossiles', 'bio', 'fer', [x('Happer', 1, 'atk', 8), x('Ronger', 3, 'atk', 9)]),
  m('cuir-recif', 'Cuir de récif', 'bio', 'fer', [x('Écailles', 4, 'bouclier', 9), x('Barbillon', 5, 'atk', 8)]),
  m('poumons-abysse', 'Poumons d’abysse', 'bio', 'cuivre', [x('Apnée', 2, 'bouclier', 11, false, { type: 'rempart', part: 0.5 }), x('Remontée', 4, 'soin', 11)]),
  m('carapace-mere', 'Carapace-mère', 'bio', 'argent', [x('Rempart', 5, 'bouclier', 16, false, { type: 'rempart', part: 0.75 }), x('Bélier', 6, 'atk', 22, true, { type: 'fissure', part: 0.25 }),
    x('Mue rapide', 1, 'soin', 9, false, { type: 'vague' })]),
  m('coeur-meute', 'Cœur de meute', 'bio', 'or', [x('Hurlement', 4, 'atk', 11, false, { type: 'fissure', part: 0.4 }), x('Curée', 5, 'atk', 13, false, { type: 'siphon', part: 0.75 }),
    x('Instinct', 3, 'soin', 9, false, { type: 'vague' })]),
  // Résonants : Fréquences hautes
  m('eclat-chant', 'Éclat qui chante', 'reso', 'fer', [x('Note haute', 8, 'atk', 13), x('Note basse', 7, 'bouclier', 9)]),
  m('miroir-brume', 'Miroir de brume', 'reso', 'fer', [x('Reflet', 9, 'atk', 10), x('Voile', 8, 'bouclier', 8)]),
  m('encre-ancienne', 'Encre ancienne', 'reso', 'fer', [x('Glyphe', 6, 'atk', 9), x('Paume ouverte', 7, 'soin', 8)]),
  m('plume-givre', 'Plume de givre', 'reso', 'cuivre', [x('Givre', 9, 'atk', 12, false, { type: 'desarmer', part: 0.4 }), x('Cristal', 8, 'bouclier', 11)]),
  m('ombre-ailee', 'Ombre ailée', 'reso', 'argent', [x('Envol', 7, 'bouclier', 13, false, { type: 'accord' }), x('Piqué', 9, 'atk', 25, true, { type: 'fissure', part: 0.4 }),
    x('Battement', 8, 'soin', 10, false, { type: 'vague' })]),
  m('chant-abysses', 'Chant des abysses', 'reso', 'or', [x('Unisson', 7, 'atk', 13, false, { type: 'accord' }), x('Contre-chant', 8, 'atk', 13, false, { type: 'siphon', part: 0.75 }),
    x('Silence', 9, 'bouclier', 14, false, { type: 'desarmer', part: 0.6 })]),
];

// ---------- Un Module, cinq métaux ----------
// Décision du 21 octobre 2026 : une même carte peut exister dans les cinq métaux. Le métal est fixé quand on trouve
// l'exemplaire, il ne change jamais (pas de montée de métal). Un exemplaire se note « module@métal ».
// Les Gestes ci-dessus sont réglés pour le métal d'origine du Module (son champ `rarete`) ; dans un autre métal :
// - la force est multipliée par METAL_FORCE[métal] / METAL_FORCE[métal d'origine] ;
// - les effets sont gardés dans l'ordre des Gestes, au plus METAL_EFFETS[métal] (fer 0, cuivre 1, argent 2, or et nacre tous).
// Ces deux tables et la question « le métal ajoute-t-il des Gestes ? » sont à régler avec le robot d'équilibrage.
export const METAL_FORCE: Record<Rarete, number> = { fer: 1, cuivre: 1.12, argent: 1.25, or: 1.4, nacre: 1.55 };
export const METAL_EFFETS: Record<Rarete, number> = { fer: 0, cuivre: 1, argent: 2, or: Infinity, nacre: Infinity };
const METAUX: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];

/** L'identifiant d'un exemplaire : un Module dans un métal */
export const carteId = (moduleId: string, metal: Rarete) => `${moduleId}@${metal}`;
/** Le Module de base d'un exemplaire (« jambes-ressort@or » → « jambes-ressort ») */
export const moduleDe = (cle: string) => cle.split('@')[0]!;

/** Les cartes de départ : une en fer par Porteur nommé, pas encore greffées */
export const COLLECTION_DEPART = ['jambes-ressort', 'glande-ambre', 'eclat-chant'].map((id) => carteId(id, 'fer'));

// ---------- Bâtiments ----------
export interface BatimentDef {
  id: BatimentId;
  nom: string;
  role: string;
  /** lignée qui y travaille le mieux (+50 %) */
  affinite: Lignee | null;
  /** coût pour passer au niveau n+1 (index = niveau actuel) */
  couts: { energie: number; composants: number; eclats?: number }[];
  niveauMax: number;
}

export const BATIMENTS: BatimentDef[] = [
  { id: 'noyau', nom: 'Tour du Noyau', role: 'Le cœur du district. Son niveau limite celui des autres bâtiments et la capacité de stockage.', affinite: null,
    couts: [{ energie: 0, composants: 0 }, { energie: 120, composants: 15 }, { energie: 300, composants: 40 }, { energie: 650, composants: 80, eclats: 3 }, { energie: 1300, composants: 160, eclats: 8 }], niveauMax: 5 },
  { id: 'generateur', nom: 'Générateur', role: 'Produit de l’énergie en continu, même quand tu ne joues pas.', affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 80, composants: 10 }, { energie: 200, composants: 25 }, { energie: 450, composants: 55, eclats: 2 }, { energie: 900, composants: 110, eclats: 5 }], niveauMax: 5 },
  { id: 'forge', nom: 'Forge', role: 'Recycle les cartes en trop et refabrique un exemplaire d’une carte déjà trouvée. Il faut un Porteur au travail.', affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 100, composants: 12 }, { energie: 240, composants: 30 }, { energie: 500, composants: 60, eclats: 2 }, { energie: 1000, composants: 120, eclats: 5 }], niveauMax: 5 },
  { id: 'clinique', nom: 'Clinique', role: 'Soigne l’Usure des Porteurs qui se reposent au district.', affinite: 'bio',
    couts: [{ energie: 0, composants: 0 }, { energie: 90, composants: 10 }, { energie: 220, composants: 28 }, { energie: 480, composants: 58, eclats: 2 }, { energie: 950, composants: 115, eclats: 5 }], niveauMax: 5 },
];

// ---------- Ennemis ----------
export const ENNEMIS: EnnemiDef[] = [
  {
    id: 'remanent-faible', nom: 'Rémanent affaibli', lignee: 'reso', tag: 'GARDIEN DE LA CHAMBRE', pvMax: 75,
    motif: [
      { type: 'atk', nom: 'Griffe', v: 4, cible: 'hasard' },
      { type: 'atk', nom: 'Griffe', v: 5, cible: 'faible' },
      { type: 'atk', nom: 'Lacération', v: 13, cible: 'doran' },
      { type: 'atk', nom: 'Griffe', v: 5, cible: 'hasard' },
    ],
  },
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

/** La séquence normale d'une Strate (le Rémanent affaibli est réservé à la chambre scellée) */
export const SEQUENCE_STRATE = ['remanent', 'vigie', 'confluence'];

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
const declinaisons = new Map<string, ModuleDef>();

/** Un Module dans son métal d'origine (« jambes-ressort ») ou un exemplaire dans un métal (« jambes-ressort@or ») */
export const moduleDef = (cle: string): ModuleDef => {
  const deja = declinaisons.get(cle);
  if (deja) return deja;
  const [id, metal] = cle.split('@') as [string, Rarete | undefined];
  const m = MODULES.find((x) => x.id === id);
  if (!m || (metal !== undefined && !METAUX.includes(metal))) throw new Error('Module inconnu : ' + cle);
  if (metal === undefined) return m;
  const k = METAL_FORCE[metal] / METAL_FORCE[m.rarete];
  let effets = METAL_EFFETS[metal];
  const gestes = m.gestes.map((g) => {
    const { effet, ...reste } = g;
    const garde = !!effet && effets > 0;
    if (garde) effets--;
    return { ...reste, v: Math.round(g.v * k), ...(garde ? { effet } : {}) };
  });
  const d: ModuleDef = { ...m, id: cle, base: id, rarete: metal, gestes };
  declinaisons.set(cle, d);
  return d;
};
