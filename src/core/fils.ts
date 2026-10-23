// Les fils des Porteurs (23 octobre 2026, Bible « D'où viennent leurs dons ») : une petite histoire personnelle par Porteur,
// en trois étapes qui avancent toutes seules quand leur condition est remplie (niveau, arrivée, Strate, fragment, bâtiment).
// Chaque étape rapporte de l'XP au Porteur ; la dernière touche aussi au district. Aucune n'est obligatoire, aucune ne punit.
// Ce fichier ne contient que les textes et les conditions : `avancerFils` (jeu.ts) les applique.

/** Ce qu'une condition peut lire de la partie, sans dépendre de jeu.ts */
export interface ContexteFil {
  niveau: (id: string) => number;
  present: (id: string) => boolean;
  /** la Strate la plus profonde ouverte */
  strate: number;
  fragments: string[];
  batiments: Record<string, number>;
}

export interface EtapeFil {
  titre: string;
  /** la condition, en clair, pour la fiche du Porteur */
  quand: string;
  test: (c: ContexteFil) => boolean;
  recit: string;
  xp: number;
  /** Confiance du district gagnée à cette étape */
  confiance?: number;
}

export interface FilDef { titre: string; etapes: EtapeFil[] }

export const FILS: Record<string, FilDef> = {
  ilka: {
    titre: 'La dette de Pim',
    etapes: [
      { titre: 'Pim', quand: 'Ilka au niveau 3', test: (c) => c.niveau('ilka') >= 3, xp: 25,
        recit: 'Un gamin de douze ans attend Ilka au pied de la Tour, un sac de courses sur l’épaule. « Mon frère, Pim. Si je tombe, c’est lui qui paie mes jambes. Alors je ne tombe pas. » Elle le dit en riant. Pim, lui, ne rit pas.' },
      { titre: 'Le verrou', quand: 'Sasha au district', test: (c) => c.present('sasha') && c.niveau('ilka') >= 3, xp: 40,
        recit: 'Sasha démonte une jambe d’Ilka sur son établi et siffle entre ses dents : un verrou de coupure à distance, caché sous le cœur de cristal. Il le neutralise en dix minutes. « Ta compagnie ne pourra plus t’éteindre au milieu d’une course. » Ilka ne dit rien pendant une heure entière, ce qui ne lui était jamais arrivé.' },
      { titre: 'Le contrat racheté', quand: 'Comptoir au niveau 2 et Ilka au niveau 8', test: (c) => (c.batiments.comptoir ?? 0) >= 2 && c.niveau('ilka') >= 8, xp: 80, confiance: 5,
        recit: 'Le Comptoir du district rachète le prêt-de-vie d’Ilka à la compagnie de transport. La dette appartient désormais au district, et la clause de survivance tombe avec elle : Pim ne doit plus rien à personne. Ilka continue de courir. « Maintenant, je cours pour le plaisir. Enfin, presque. »' },
    ],
  },
  doran: {
    titre: 'La porte de son père',
    etapes: [
      { titre: 'L’écriture du contremaître', quand: 'La Strate −2 ouverte', test: (c) => c.strate >= 2 && c.fragments.includes('mure'), xp: 25,
        recit: 'Doran relit l’ordre de service trouvé dans la chambre, celui qui condamne l’accès du niveau 7. Il reconnaît le tampon. « Mon père avait le même sur sa fiche de paie. Il était là. »' },
      { titre: 'Quatre signatures', quand: 'Le rapport « Pas de notre côté » retrouvé', test: (c) => c.fragments.includes('pas-notre-cote'), xp: 40,
        recit: 'Quatre noms au bas du rapport de 2066. Le troisième est celui de son père. Doran plie la feuille en quatre et la range dans la poche de poitrine de sa veste, là où la chitine ne pousse pas. Il ne l’en ressortira plus.' },
      { titre: 'Une serrure', quand: 'La Strate −6 ouverte', test: (c) => c.strate >= 6 && c.fragments.includes('pas-notre-cote'), xp: 80, confiance: 3,
        recit: 'Devant les portes des salles closes, fermées de l’intérieur, Doran pose sa main à plat sur la pierre. « Ils n’ont pas muré une porte, en 2066. Ils ont répondu à quelqu’un qui fermait la sienne. » Pour la première fois, il raconte son père aux autres, longtemps. Le district l’apprend le soir même.' },
    ],
  },
  aurel: {
    titre: 'Retrouver Liane',
    etapes: [
      { titre: 'Les teinturiers', quand: 'Aurel au niveau 3', test: (c) => c.present('aurel') && c.niveau('aurel') >= 3, xp: 25,
        recit: 'Aurel fait le tour des teinturiers de mèches du district. Ils connaissent tous les Résonants du quartier. Aucun ne connaît de Liane : « Une Refusée ne vient pas chez nous, monsieur. Elle n’a rien à teindre. » Il n’y avait pas pensé.' },
      { titre: 'Une tête blanche', quand: 'Liane au district', test: (c) => c.present('aurel') && c.present('liane'), xp: 40,
        recit: 'Elle a les cheveux presque blancs et la voix de Dame Isaure, sa mère. « Tu as mis douze ans à descendre, cousin. » Il ne trouve rien à répondre. Son ombre ailée, elle, s’incline. Liane la regarde faire, et pour la première fois depuis longtemps, quelque chose ressemble à un sourire.' },
      { titre: 'Ce que la Maison a effacé', quand: 'Aurel au niveau 8 et Liane au niveau 5', test: (c) => c.niveau('aurel') >= 8 && c.niveau('liane') >= 5, xp: 80, confiance: 4,
        recit: 'Une nuit, Aurel recopie le nom de Liane à la main, sur une page arrachée au registre qu’il a emporté en fuyant, juste sous le sien. Il la lui donne. Elle la garde. Ni l’un ni l’autre n’en parle, mais le district les voit désormais descendre côte à côte.' },
    ],
  },
};

/** Les étapes d'un fil, faites ou non (n = nombre d'étapes déjà faites) */
export const etapesDe = (id: string, faites: number) => (FILS[id]?.etapes ?? []).map((e, i) => ({ ...e, faite: i < faites }));
