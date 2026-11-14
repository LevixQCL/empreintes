// Une partie de duel en cours, côté joueur : l'état commun (ce que les deux joueurs voient pareil), le brouillon (la chaîne qu'on compose),
// le chrono du tour, et le transport qui apporte le choix de l'adversaire : un robot (entraînement) ou un ami en ligne (src/net/duel.ts).
// Aucun affichage ici : l'écran (src/ui/duel.ts) lit la session et appelle ses méthodes.

import type { Consigne } from '../core/duel';
import {
  CHOIX_VIDE, DUEL, abandonner, allongerDuel, appliquerChoix, autre, choixDe, choixRobot, deplacerDuel, poserDuel, repiocherDuel, reprendreDuel,
  resoudreTour, soignerDuel, viserDuel, gagnant, type Camp, type ChoixTour, type DuelEtat, type EvDuel, type Resultat,
} from '../core/duel';

export interface Transport {
  /** branche le récepteur des choix de l'adversaire */
  brancher(recevoir: (tour: number, choix: ChoixTour) => void): void;
  /** j'ai verrouillé mon choix pour ce tour */
  envoyer(tour: number, choix: ChoixTour): void;
  /** un nouveau tour commence (le robot s'en sert pour jouer) */
  nouveauTour?(s: DuelEtat): void;
  /** j'abandonne, ou je constate l'absence de l'adversaire (camp de celui qui part) */
  quitter?(camp: Camp): void;
  /** le duel est fini */
  finir?(s: DuelEtat): void;
  fermer?(): void;
}

const clone = <T>(x: T): T => structuredClone(x);

export class SessionDuel {
  commun: DuelEtat;
  brouillon: DuelEtat;
  /** la fin du chrono du tour (ms) */
  finTour: number;
  /** ce qui s'est passé au dernier tour résolu (l'écran l'anime une fois) */
  derniers: EvDuel[] = [];
  /** numéro du dernier tour résolu (l'écran sait ainsi qu'il y a du nouveau à animer) */
  resolu = 0;
  /** un choix adverse illisible a été remplacé par une chaîne vide */
  desynchro = false;
  private monChoix: ChoixTour | null = null;
  private adverses = new Map<number, ChoixTour>();

  constructor(etat: DuelEtat, readonly camp: Camp, private transport: Transport, private changer: () => void, debut = Date.now()) {
    this.commun = clone(etat);
    this.brouillon = clone(etat);
    this.finTour = debut + DUEL.chrono * 1000;
    transport.brancher((tour, choix) => { if (!this.adverses.has(tour)) { this.adverses.set(tour, choix); this.avancer(); this.changer(); } });
    transport.nouveauTour?.(clone(this.commun));
  }

  get tour() { return this.commun.tour; }
  get fini() { return this.commun.issue !== 'en-cours'; }
  get verrouille() { return this.monChoix !== null; }
  get adversairePret() { return this.adverses.has(this.commun.tour); }
  get gagne() { return gagnant(this.commun) === this.camp; }
  /** secondes restantes au chrono */
  restant(maintenant = Date.now()) { return Math.max(0, Math.ceil((this.finTour - maintenant) / 1000)); }
  /** l'adversaire n'a rien envoyé bien après la fin du chrono : on peut réclamer la victoire */
  absent(maintenant = Date.now()) { return !this.fini && this.verrouille && !this.adversairePret && maintenant > this.finTour + DUEL.grace * 1000; }

  // ---------- Composer (sur le brouillon) ----------

  private sur(f: (s: DuelEtat) => Resultat): Resultat {
    if (this.verrouille || this.fini) return { ok: false, message: 'Ta chaîne est verrouillée.' };
    const r = f(this.brouillon);
    this.changer();
    return r;
  }
  poser(uid: string, f?: number) { return this.sur((s) => poserDuel(s, this.camp, uid, f)); }
  reprendre(uid: string) { return this.sur((s) => reprendreDuel(s, this.camp, uid)); }
  deplacer(uid: string, vers: number) { return this.sur((s) => deplacerDuel(s, this.camp, uid, vers)); }
  viser(porteur: string | null) { return this.sur((s) => viserDuel(s, this.camp, porteur)); }
  soigner(uid: string, porteur: string) { return this.sur((s) => soignerDuel(s, this.camp, uid, porteur)); }
  allonger() { return this.sur((s) => allongerDuel(s, this.camp)); }
  repiocher() { return this.sur((s) => repiocherDuel(s, this.camp)); }

  /** Verrouille la chaîne composée et l'envoie */
  verrouiller(): void {
    if (this.verrouille || this.fini) return;
    this.monChoix = choixDe(this.brouillon, this.camp);
    this.transport.envoyer(this.commun.tour, this.monChoix);
    this.avancer();
    this.changer();
  }

  /** À appeler chaque seconde : le chrono tombé verrouille la chaîne telle qu'elle est */
  tick(maintenant = Date.now()): void {
    if (!this.fini && !this.verrouille && maintenant >= this.finTour) this.verrouiller();
  }

  /** Abandonner */
  quitter(): void {
    if (this.fini) return;
    abandonner(this.commun, this.camp);
    this.transport.quitter?.(this.camp);
    this.terminer();
  }

  /** L'adversaire ne joue plus : on réclame la victoire */
  reclamer(): void {
    if (!this.absent()) return;
    abandonner(this.commun, autre(this.camp));
    this.transport.quitter?.(autre(this.camp));
    this.terminer();
  }

  /** L'adversaire a quitté le duel (appris par le salon en ligne) */
  adversaireParti(): void {
    if (this.fini) return;
    abandonner(this.commun, autre(this.camp));
    this.terminer();
  }

  private terminer() {
    this.brouillon = clone(this.commun);
    this.transport.finir?.(this.commun);
    this.changer();
  }

  /** Les deux choix sont là : on les rejoue sur l'état commun, on résout, et le tour suivant commence */
  private avancer(): void {
    const t = this.commun.tour;
    const sien = this.adverses.get(t);
    if (!this.monChoix || !sien || this.fini) return;
    const mien = appliquerChoix(this.commun, this.camp, this.monChoix);
    if (!mien.ok) appliquerChoix(this.commun, this.camp, CHOIX_VIDE);
    if (!appliquerChoix(this.commun, autre(this.camp), sien).ok) { this.desynchro = true; appliquerChoix(this.commun, autre(this.camp), CHOIX_VIDE); }
    this.derniers = resoudreTour(this.commun);
    this.resolu = t;
    this.adverses.delete(t);
    this.monChoix = null;
    this.brouillon = clone(this.commun);
    this.finTour = Date.now() + DUEL.chrono * 1000;
    if (this.fini) this.terminer();
    else this.transport.nouveauTour?.(clone(this.commun));
  }
}

/** L'adversaire d'entraînement : le robot de duel, qui prend quelques secondes pour composer sa chaîne */
export function transportRobot(camp: Camp, delai: (tour: number) => number = (t) => 1500 + ((t * 2654435761) >>> 0) % 4000, consigne?: Consigne): Transport {
  let recevoir: ((tour: number, choix: ChoixTour) => void) | null = null;
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  return {
    brancher(r) { recevoir = r; },
    envoyer() {},
    nouveauTour(s) {
      clearTimeout(minuterie);
      const choix = choixRobot(s, camp, consigne);
      minuterie = setTimeout(() => recevoir?.(s.tour, choix), delai(s.tour));
    },
    fermer() { clearTimeout(minuterie); },
  };
}
