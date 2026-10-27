// Les rumeurs du marché (23 octobre 2026, Bible « Petites histoires des districts ») : une par jour, dans le panneau du district.
// La vie du quartier autour du directeur : teinturiers de mèches, maisons de mue, minute grise, le boulanger des toits.
// Certaines n'apparaissent qu'une fois la chambre ouverte, ou qu'à partir d'une Strate.

interface Rumeur { texte: string; strate?: number }

export const RUMEURS: Rumeur[] = [
  { texte: 'Le boulanger de la rue des Filets a encore dormi sur le toit. Son pain est toujours excellent. Personne n’ose lui demander pourquoi.' },
  { texte: 'Le teinturier de mèches a affiché « complet » toute la semaine. Les dorés du quartier ont l’air de tenir à leur tranquillité.' },
  { texte: 'Une maison de mue des bas-fonds cherche des bras pour la soupe : trois mués cette saison, et chacun mange pour trois.' },
  { texte: 'Mardi, quatre heures : la minute grise. La moitié du marché s’est assise par terre, et un voleur a filé avec un panier d’algues.' },
  { texte: 'Une Délavée s’est teint les cheveux en noir pour son mariage. Les invités ont mis un moment à la reconnaître.' },
  { texte: 'On vend des « pierres vierges » à la sortie des ascenseurs. Elles sont ternes. Toutes. La Clinique conseille de passer son chemin.' },
  { texte: 'Les enfants du quartier comptent les cheveux blancs des passants pour deviner leurs implants. Le record de la semaine : sept.' },
  { texte: 'Une Nuit blanche ce soir chez une voisine greffée : on cherche des gens qui ont des souvenirs d’enfance à lui raconter.' },
  { texte: 'Un vieux Géné siffle doucement en respirant au marché. « L’air est trop sec ici », dit-il. Il vient d’un chantier sous l’eau.' },
  { texte: 'Les lanternes sur les terrasses des Hauts étaient nombreuses avant l’aube. Une tempête, dit-on. Le Présage ne se trompe jamais sur celles-là.' },
  { texte: 'Un Augmenté du quai a fait redémarrer son implant devant tout le monde. Il a murmuré « merci », puis il a eu l’air gêné. « C’est ce qu’on dit, chez nous », a-t-il expliqué.' },
  { texte: 'Le vieux brocanteur du pont nord a vendu une « machine qui répondait » d’avant la Fonte : une plaque noire et froide. Elle n’a rien répondu. Il l’a reprise contre un bocal de sel.' },
  { texte: 'Pendant la canicule, la Clinique a rouvert sa « cave fraîche » au pied du Noyau. Les anciens y descendent avec leur matelas. Ils disent que c’est une tradition, et personne ne sait plus d’où elle vient.' },
  { texte: 'Le fils du marchand d’algues a été ruiné aux dés. « Il a les pieds mouillés », soupire sa mère. Les plus jeunes croient que c’est une histoire d’inondation.' },
  { texte: 'Quelqu’un a vu une Résonante marcher sur un câble sans harnais, une lanterne à la main. Tout le monde sait de qui il s’agit.', strate: 1 },
  { texte: 'Une fissure de plus sur un pilier de l’est. Quelqu’un l’a rebouchée pendant la nuit. Le Présage n’a rien dit.', strate: 2 },
  { texte: 'Une île des Hauts passait au-dessus du marché. Un vieux Géné a craché par terre. « On ne demande pas qui les a montées », a dit sa voisine, et elle a changé de sujet.', strate: 3 },
  { texte: 'Les Brigades sont passées à l’école demander combien d’enfants « ont des yeux qui brillent ». Les parents ont répondu : aucun.', strate: 4 },
  { texte: 'Le Réseau des Reprises colle des affiches la nuit : « Vos implants, vos mains. » Ce matin, quelqu’un avait ajouté au crayon : « Et qui écrit les mises à jour ? »', strate: 6 },
  { texte: 'Des ouvriers de l’ouest disent qu’un vieux mur d’acier, sous un pilier, est tiède au toucher en plein hiver. Le chef d’équipe leur a interdit d’y poser l’oreille.', strate: 8 },
  { texte: 'On raconte qu’une famille des Hauts a envoyé une fille « étudier ailleurs », il y a longtemps. Dans quel district, personne ne le dit.', strate: 5 },
];

/** La rumeur du jour : une seule, la même toute la journée */
export function rumeurDuJour(jour: number, strate: number): string {
  const possibles = RUMEURS.filter((r) => !r.strate || strate >= r.strate);
  return possibles[((jour % possibles.length) + possibles.length) % possibles.length]!.texte;
}
