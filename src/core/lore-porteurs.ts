// Qui sont les Porteurs : un titre, quelques lignes et leur réplique, pour l'onglet Porteurs (22 octobre 2026).
// Ilka, Doran, Véla, Sasha, Nuit et Aurel suivent la Bible du lore (portraits et répliques).
// Les trois recrues n'ont pas de nom : leur texte reste court, à étoffer par Bryan.

export interface PresentationPorteur {
  /** ce qu'il est, en quelques mots */
  titre: string;
  /** deux ou trois phrases */
  texte: string;
  replique?: string;
  /** pourquoi il fait partie de l'escouade (l'escouade de départ : ce qui l'a amené devant la porte) */
  pourquoi?: string;
  /** un encadré à part quand sa lignée appelle une explication (Véla : une Résonante qui n'est pas des Hauts) */
  aParte?: { titre: string; texte: string };
}

export const PRESENTATIONS: Record<string, PresentationPorteur> = {
  ilka: {
    titre: 'Coursière des Hauts-Ponts',
    texte: 'Vingt-quatre ans, la plus rapide coursière du district, et la plus bavarde. Ses jambes mécaniques sont louées à crédit : chaque course rembourse un peu la dette. Elle connaît tous les raccourcis entre les tours.',
    replique: 'Je livre tout, partout, sauf les mauvaises nouvelles. Celles-là, je les fais traîner.',
    pourquoi: 'Le matin de l’ouverture, ce sont les ouvriers qui l’ont envoyée chercher le nouveau directeur : quand ça presse, c’est toujours Ilka qu’on envoie. Elle aurait pu repartir. Elle est restée, parce qu’elle connaît tous les raccourcis entre les tours et qu’une course pareille ne se refuse pas. Ses jambes d’Augmentée la portent là où les autres n’osent pas sauter.',
  },
  doran: {
    titre: 'Géné des égouts',
    texte: 'La cinquantaine, ancien ouvrier des Fondations, modifié pour respirer dans l’humidité et encaisser les chocs. Bourru, lent à parler et rapide à rendre service. Il connaît les accès murés sous le district.',
    replique: 'Sous la ville, on ne se perd pas. On se fait oublier.',
    pourquoi: 'Son père travaillait dans le puits de chantier des années 2060, sous la Tour, avant qu’on le mure après « un accident » dont personne ne parle. Doran est le dernier à savoir où passent ces couloirs. Et son corps de Géné, fait pour l’humidité et les chocs, tient là où un humain ne tiendrait pas.',
  },
  vela: {
    titre: 'Liseuse d’empreintes',
    texte: 'La quarantaine, Résonante des districts : elle lit les empreintes pour les fouilleurs et les Cliniques. Son empreinte ancienne est celle d’un dragon serpentin. Calme, bienveillante, et de plus en plus inquiète.',
    replique: 'Une empreinte ne ment jamais. C’est nous qui la lisons mal.',
    pourquoi: 'Depuis que la chambre est ouverte, Véla ressent des peurs qui ne sont pas les siennes. Personne ne l’a appelée : elle est venue d’elle-même, parce qu’elle est la seule du district à savoir lire une empreinte, et qu’elle veut comprendre ce qui a peur là-dessous avant que quelqu’un d’autre ne s’en serve.',
    aParte: {
      titre: 'Une Résonante des districts',
      texte: 'Les Résonants qu’on voit sur les écrans vivent dans les Hauts et gouvernent Vertiga. Mais les empreintes anciennes ne sont pas toutes restées là-haut, et ceux qui les portent dans les districts vivent comme leurs voisins : ils ont plus en commun avec eux qu’avec les Hauts. Beaucoup teignent leur mèche d’or pour qu’on les laisse tranquilles. Véla ne la cache plus. Le district la connaît depuis quinze ans : c’est elle qu’on va chercher quand un fouilleur remonte un cristal, ou quand la Clinique ne comprend pas ce qui arrive à un malade.',
    },
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
