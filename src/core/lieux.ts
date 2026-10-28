// Les lieux des missions en mer (28 octobre 2026, Bryan : « développe la thématique au max »).
// Douze ruines au large, quatre par lignée : chaque ruine garde l'empreinte de ce qu'elle était.
// Les machines d'avant s'ouvrent aux Augmentés, le vivant se laisse approcher des Génés, les lieux qui résonnent répondent
// aux Résonants. Le mauvais Porteur au mauvais endroit, c'est l'inverse (même triangle qu'en combat).
// Chaque lieu a aussi une spécialité : ce qu'on y trouve le plus (composants, pierres ou rescapés).

import type { Lignee } from './types';
import { BATTU_PAR } from './regles';

export type SpecialiteLieu = 'composants' | 'cartes' | 'rescapes';
export type Affinite = 'bon' | 'neutre' | 'mauvais';

export interface LieuDef {
  id: string;
  nom: string;
  lignee: Lignee;
  specialite: SpecialiteLieu;
  /** ce que raconte la fiche du lieu (une ou deux phrases) */
  lore: string;
  /** l'arrivée sur place, dans le rapport ({nom} = le Porteur) */
  arrivee: string;
}

export const LIEUX: readonly LieuDef[] = [
  // ---- Augmentés : les machines d'avant ----
  { id: 'pompage', nom: 'la station de pompage engloutie', lignee: 'tech', specialite: 'composants',
    lore: 'Elle pompait la mer hors des rues basses, jusqu’au jour où la mer a gagné. Ses vannes tournent encore quand la marée tire dessus.',
    arrivee: 'Les grandes vannes de la station dépassaient de l’eau verte : la barque s’est glissée entre deux tuyaux, et {nom} a pris pied sur une roue rouillée.' },
  { id: 'dessalement', nom: 'l’usine de dessalement abandonnée', lignee: 'tech', specialite: 'composants',
    lore: 'Elle rendait l’eau douce à trois piliers. Ses cuves blanches sont couvertes d’un sel qui brille à midi, et ses pompes n’attendent qu’un courant pour repartir.',
    arrivee: 'Les cuves blanches de l’usine brillaient de sel en plein soleil ; {nom} a sauté sur une passerelle tiède.' },
  { id: 'gare', nom: 'la gare suspendue à demi noyée', lignee: 'tech', specialite: 'cartes',
    lore: 'Les trains des Hauts y passaient au-dessus des toits. Un wagon pend encore au-dessus de l’eau, plein de bagages que personne n’est venu chercher.',
    arrivee: 'La barque s’est arrêtée sous les pieds de fer de la gare ; {nom} a grimpé jusqu’au quai par une échelle de service.' },
  { id: 'transbordeur', nom: 'l’épave du transbordeur Héron', lignee: 'tech', specialite: 'rescapes',
    lore: 'Il faisait la navette entre les piliers, cent passagers par traversée. Échoué sur un banc de sable, il abrite encore ceux qui n’ont jamais trouvé d’autre toit.',
    arrivee: 'Le Héron gisait sur son banc de sable, sa proue tendue vers le large ; {nom} est entré par une écoutille entrouverte.' },
  // ---- Génés : le vivant ----
  { id: 'serres', nom: 'les serres noyées du Jardin d’Hiver', lignee: 'bio', specialite: 'cartes',
    lore: 'Sous le dôme brisé, les plantes ont tout repris. Les jardiniers d’avant y cachaient des pierres au pied des arbres, pour qu’elles poussent avec eux.',
    arrivee: 'Sous le dôme brisé, l’air sentait la terre mouillée ; {nom} a écarté les lianes pour entrer.' },
  { id: 'marche', nom: 'les toits du vieux marché des Basses-Eaux', lignee: 'bio', specialite: 'rescapes',
    lore: 'Les auvents rayés flottent au ras de l’eau. Des lanternes y brûlent encore chaque soir, entretenues par des familles qui n’ont jamais voulu partir.',
    arrivee: 'Les auvents rayés du vieux marché flottaient au ras de l’eau, et quelques lanternes brûlaient encore pour accueillir la barque.' },
  { id: 'criee', nom: 'les quais morts de l’ancienne criée', lignee: 'bio', specialite: 'composants',
    lore: 'Ici se vendait le poisson de toute la côte. Les filets pendent toujours, les chambres froides sont intactes, et les mouettes ne sont jamais parties.',
    arrivee: 'Sur les quais de la criée, les filets pendaient toujours, et les mouettes ont salué la barque à grands cris.' },
  { id: 'silos', nom: 'les silos de la digue rompue', lignee: 'bio', specialite: 'cartes',
    lore: 'Les silos gardaient le grain de tout un quartier. La digue a cédé, le grain a germé : des épis sortent des fentes du béton, et des pierres dorment dans les semences.',
    arrivee: 'Des épis sortaient des fentes des silos ; {nom} a longé la digue rompue, de l’eau jusqu’aux genoux.' },
  // ---- Résonants : les échos ----
  { id: 'clocher', nom: 'le clocher de verre sous la marée', lignee: 'reso', specialite: 'cartes',
    lore: 'Quand la houle frappe le verre, la cloche de bronze sonne seule. Les Résonants disent qu’elle sonne juste, comme une voix qu’on aurait gardée.',
    arrivee: 'En approchant, {nom} a entendu la cloche de verre sonner seule, au rythme de la houle.' },
  { id: 'pilier-sans-nom', nom: 'le pilier sans nom au large de Brume-Haute', lignee: 'reso', specialite: 'cartes',
    lore: 'Aucune carte ne le nomme, et aucun passeur n’y accoste deux fois de la même façon. Dans le brouillard, des lumières s’allument et s’éteignent, sans personne pour les tenir.',
    arrivee: 'Le brouillard s’est ouvert juste le temps d’accoster ; derrière la barque, plus rien, ni le district ni la mer.' },
  { id: 'phare', nom: 'le phare couché de Basse-Lune', lignee: 'reso', specialite: 'rescapes',
    lore: 'Il s’est couché dans la mer sans s’éteindre tout à fait. Sa lampe pulse encore, comme un cœur qui dort, et les naufragés suivent sa lueur.',
    arrivee: 'La lampe du phare couché pulsait sous l’eau, comme un cœur endormi ; le passeur s’est guidé sur elle.' },
  { id: 'pilier-effondre', nom: 'le pilier effondré de Sombreverse', lignee: 'reso', specialite: 'composants',
    lore: 'Un pilier-cité cassé en deux. Ses étages hauts ont glissé dans l’eau avec leurs ateliers, et l’on y entend encore travailler des voix sans corps.',
    arrivee: 'Les étages tombés du pilier formaient un escalier dans la mer ; {nom} l’a descendu marche après marche.' },
];

export const lieuDef = (id: string): LieuDef | undefined => LIEUX.find((l) => l.id === id);

/** Bon type : même lignée que le lieu ; mauvais : la lignée que celle du lieu bat ; sinon neutre */
export function affinite(lieu: Lignee, porteur: Lignee): Affinite {
  if (lieu === porteur) return 'bon';
  return BATTU_PAR[porteur] === lieu ? 'mauvais' : 'neutre';
}

export const NOM_SPECIALITE: Record<SpecialiteLieu, string> = { composants: 'Composants', cartes: 'Pierres', rescapes: 'Rescapés' };

/** Ce que le Porteur vit sur place selon son affinité avec le lieu (lignée du lieu → phrase) */
export const RECIT_BON: Record<Lignee, string> = {
  tech: '{nom} a posé la main sur une console morte : ses greffes ont parlé aux machines, et les portes se sont ouvertes une à une.',
  bio: 'Les plantes se sont écartées devant {nom} : un Géné sent les sèves, et sait où le vivant cache ce qu’il garde.',
  reso: 'Les échos du lieu ont reconnu la pierre de {nom}, et les voix l’ont guidé jusqu’aux cachettes.',
};
export const RECIT_MAUVAIS: Record<Lignee, string> = {
  tech: 'Les machines n’ont rien voulu entendre de la pierre de {nom} : les vannes sont restées grippées, il a fallu tout forcer.',
  bio: 'Les ronces se sont refermées sur les greffes de {nom}, et l’humidité a grippé ses articulations : une fouille lente et pénible.',
  reso: 'Les échos ont égaré {nom}, qui a tourné des heures dans des couloirs qui changeaient de forme.',
};
export const RECIT_NEUTRE = 'Rien ne l’a aidé, rien ne l’a gêné : une fouille honnête, à la lampe.';
