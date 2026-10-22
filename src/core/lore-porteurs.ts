// Qui sont les Porteurs : un titre, quelques lignes et leur réplique, pour l'onglet Porteurs (22 octobre 2026).
// Ilka, Doran, Véla, Sasha, Nuit et Aurel suivent la Bible du lore (portraits et répliques).
// Les trois recrues n'ont pas de nom : leur texte reste court, à étoffer par Bryan.

export interface PresentationPorteur {
  /** ce qu'il est, en quelques mots */
  titre: string;
  /** deux ou trois phrases */
  texte: string;
  replique?: string;
}

export const PRESENTATIONS: Record<string, PresentationPorteur> = {
  ilka: {
    titre: 'Coursière des Hauts-Ponts',
    texte: 'Vingt-quatre ans, la plus rapide coursière du district, et la plus bavarde. Ses jambes mécaniques sont louées à crédit : chaque course rembourse un peu la dette. Elle connaît tous les raccourcis entre les tours.',
    replique: 'Je livre tout, partout, sauf les mauvaises nouvelles. Celles-là, je les fais traîner.',
  },
  doran: {
    titre: 'Géné des égouts',
    texte: 'La cinquantaine, ancien ouvrier des Fondations, modifié pour respirer dans l’humidité et encaisser les chocs. Bourru, lent à parler et rapide à rendre service. Il connaît les accès murés sous le district.',
    replique: 'Sous la ville, on ne se perd pas. On se fait oublier.',
  },
  vela: {
    titre: 'Liseuse d’empreintes',
    texte: 'La quarantaine, Résonante des districts : elle lit les empreintes pour les fouilleurs et les Cliniques. Son empreinte ancienne est celle d’un dragon serpentin. Calme, bienveillante, et de plus en plus inquiète.',
    replique: 'Une empreinte ne ment jamais. C’est nous qui la lisons mal.',
  },
  sasha: {
    titre: 'Réparateur des Reprises',
    texte: 'Trente-cinq ans, mécanicien de génie du Réseau des Reprises. Il débride les implants de tout le quartier, dans un atelier où rien n’est rangé et où tout est à sa place.',
    replique: 'Si ça a une vis, ça a une seconde chance.',
  },
  nuit: {
    titre: 'Éclaireuse génée',
    texte: 'Vingt ans, modifiée dès l’enfance pour les fouilles de nuit : elle voit dans le noir comme en plein jour et déteste les lumières fortes. Elle parle peu, observe tout, et travaille pour les Veilleurs de Sédime.',
    replique: 'Le noir n’est pas vide. Il attend juste qu’on regarde mieux.',
  },
  aurel: {
    titre: 'L’héritier en fuite',
    texte: 'Vingt-deux ans, jeune héritier de la Maison Orsève. Il teint sa mèche d’or et vit incognito dans le district, persuadé que son empreinte le rend plus dur qu’il ne veut l’être. Sa famille le cherche.',
    replique: 'Mon ombre a de meilleures manières que moi. C’est bien ça, le problème.',
  },
  coursier: {
    titre: 'Recrue augmentée',
    texte: 'Un coursier du district, venu après l’ouverture de la chambre. Il court devant l’escouade et revient toujours avec des nouvelles.',
  },
  docker: {
    titre: 'Recrue génée',
    texte: 'Un ancien docker des quais de Vertiga. Il porte ce que les autres laissent, et ne lâche jamais une prise.',
  },
  guetteur: {
    titre: 'Recrue résonante',
    texte: 'Un guetteur des passerelles. Il sent venir les ennuis avant tout le monde, et le dit rarement.',
  },
};
