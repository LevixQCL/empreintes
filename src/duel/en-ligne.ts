// Le transport en ligne du duel : sceller son choix, attendre le sceau de l'autre, révéler, vérifier (src/net/duel.ts).

import { autre, gagnant, type Camp, type ChoixTour } from '../core/duel';
import type { Transport } from './session';
import type { ChoixEnLigne } from '../net/duel';

type Net = typeof import('../net/duel');

export function transportEnLigne(net: Net, code: string, uid: string, camp: Camp, signaler: (message: string) => void): Transport {
  let recevoir: ((tour: number, choix: ChoixTour) => void) | null = null;
  const miens = new Map<number, { choix: ChoixTour; sel: string; revele: boolean }>();
  const recus = new Set<number>();
  /** le dernier tour où j'ai posé mon sceau (pour constater l'absence de l'autre) */
  let dernierTour = -1;
  const arreter = net.ecouterChoix(code, async (liste: ChoixEnLigne[]) => {
    const parTour = new Map<number, ChoixEnLigne[]>();
    for (const c of liste) parTour.set(c.tour, [...(parTour.get(c.tour) ?? []), c]);
    for (const [tour, cs] of parTour) {
      const sien = cs.find((c) => c.camp === autre(camp));
      const mien = cs.find((c) => c.camp === camp);
      const local = miens.get(tour);
      // les deux sceaux sont posés : je révèle mon choix
      if (sien && mien && local && !local.revele) {
        local.revele = true;
        net.reveler(code, tour, camp, local.choix, local.sel).catch(() => signaler('Connexion perdue : ton choix n’a pas pu être envoyé.'));
      }
      // son choix est révélé : je vérifie qu'il correspond à son sceau
      if (sien?.choix && sien.sel && !recus.has(tour)) {
        recus.add(tour);
        const attendu = await net.sceller(sien.choix, sien.sel);
        if (attendu !== sien.sceau) signaler('Le choix de l’adversaire ne correspond pas à son sceau : il est ignoré.');
        recevoir?.(tour, attendu === sien.sceau ? sien.choix : { repioches: 0, allonges: 0, chaine: [], cible: null });
      }
    }
  });
  return {
    brancher(r) { recevoir = r; },
    envoyer(tour, choix) {
      const sel = net.nouveauSel();
      miens.set(tour, { choix, sel, revele: false });
      dernierTour = tour;
      net.sceller(choix, sel)
        .then((sceau) => net.poserSceau(code, uid, tour, camp, sceau))
        .catch(() => signaler('Connexion perdue : ton choix n’a pas pu être envoyé.'));
    },
    // j'abandonne pour moi ; ou je constate que l'autre n'a rien posé au tour que j'ai verrouillé (firestore.rules le vérifie)
    quitter(qui) {
      if (qui === camp) net.abandonnerSalon(code, camp).catch(() => {});
      else if (dernierTour >= 0) net.constaterAbsence(code, camp, dernierTour).catch(() => {});
    },
    // mon verdict : le salon ne se dit « fini » que si celui de l'autre concorde
    finir(s) { if (s.abandon === undefined) net.finirSalon(code, camp, gagnant(s)).catch(() => {}); },
    fermer() { arreter(); },
  };
}
