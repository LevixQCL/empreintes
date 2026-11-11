// Les Récits des origines (Pack des origines, 11 novembre 2026, document « Ossyra — Monétisation ») :
// à la fin d'un récit, le joueur choisit ce que le personnage garde de cette histoire, et reçoit sa carte d'origine.
// Le choix se change en relisant la dernière scène : l'ancienne carte devient la nouvelle, au même niveau et dans les mêmes decks.
// Chaque carte d'origine est exclusive : en or, à deux effets, elle grandit avec son Porteur (donnees.ts, tests/recits.test.ts).
// Ce qu'elle a en plus ne joue qu'en PVE : face à un autre joueur, cet effet s'éteint (collection.ts, sansBonusOrigine).
// Le récit lui-même (ses plans) est dans src/ui/recits.ts ; le paiement est dans ../produits.ts et src/net/achats.ts ;
// tant que la vente n'est pas ouverte (src/net/vente.ts), tout reste ouvert en aperçu.

import { carteId, moduleDef } from '../donnees';
import { t } from '../i18n';
import { log, non, type Jeu, type Resultat } from './etat';

export interface ChoixRecit {
  /** la carte d'origine (id de la carte, en or) */
  carte: string;
  /** ce que le personnage garde de cette histoire, dit en une phrase */
  phrase: string;
}

export const RECITS_ORIGINES: Record<string, { porteur: string; question: string; choix: ChoixRecit[] }> = {
  ilka: {
    porteur: 'ilka',
    question: t('Ce qu’Ilka garde de cette nuit'),
    choix: [
      { carte: 'cle-des-pompes', phrase: t('La clé des pompes de sa mère, qu’elle porte autour du cou. Tant qu’on entend les pompes, on dort tranquille.') },
      { carte: 'toutes-les-courses', phrase: t('Sa règle : accepter toutes les courses, et toujours arriver en avance.') },
    ],
  },
  // Doran est un Géné (« tenir ») : un bouclier qui dure et un soin pour toute l'escouade (11 novembre 2026)
  doran: {
    porteur: 'doran',
    question: t('Ce que Doran garde de ces années'),
    choix: [
      { carte: 'quarante-jours', phrase: t('Quarante jours dans le noir sous les Fondations, et des contrats qui restent à quinze ans. Têtus comme une marée.') },
      { carte: 'berceuse-a-compter', phrase: t('La berceuse à compter les jours. Quelqu’un la commence dans le noir, et tout le monde la reprend.') },
    ],
  },
  // Véla est une Résonante (« troubler ») : son ombre de dragon fissure tout le groupe, la Nuit blanche désarme (11 novembre 2026)
  vela: {
    porteur: 'vela',
    question: t('Ce que Véla garde de ces années'),
    choix: [
      { carte: 'ombre-nette', phrase: t('Chaque soir, la lanterne et l’ombre sur le mur. Toujours la même. Presque.') },
      { carte: 'nuit-blanche', phrase: t('Les deux nuits où sa mère lui a raconté son enfance. « C’est toujours toi. »') },
    ],
  },
};

/** La carte d'origine gardée à la fin d'un récit (null : pas encore lu jusqu'au bout) */
export const carteDuRecit = (j: Jeu, recit: string): string | null => j.recits?.[recit]?.carte ?? null;

/** Garder une carte d'origine à la fin du récit, ou changer celle qu'on avait gardée */
export function garderCarteRecit(j: Jeu, recit: string, carte: string): Resultat {
  const r = RECITS_ORIGINES[recit];
  if (!r || !r.choix.some((c) => c.carte === carte)) return non(t('Cette carte ne vient pas de ce récit.'));
  const avant = carteDuRecit(j, recit);
  if (avant === carte) return { ok: true };
  const m = moduleDef(carte);
  const cle = carteId(carte, m.rarete);
  if (avant) {
    // l'ancienne carte devient la nouvelle : même niveau, mêmes places dans les decks
    const ancienne = carteId(avant, moduleDef(avant).rarete);
    const c = j.collection[ancienne];
    delete j.collection[ancienne];
    j.collection[cle] = c ?? { niveau: 1, doublons: 0 };
    for (const p of Object.values(j.porteurs)) p.modules = p.modules.map((x) => (x === ancienne ? cle : x));
    log(j, t`Récit des origines : « ${moduleDef(avant).nom} » devient « ${m.nom} ».`);
  } else {
    j.collection[cle] ??= { niveau: 1, doublons: 0 };
    log(j, t`Récit des origines : la carte « ${m.nom} » rejoint ta collection.`);
  }
  (j.recits ??= {})[recit] = { carte };
  return { ok: true };
}
