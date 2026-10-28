// L'état de l'application : la partie en cours (app.jeu), l'écran affiché, et l'état de chaque écran (district, combat, Grand Tableau, compte).
// Tout ce qui change pendant la partie est dans `app` : les autres modules le lisent et le modifient.

import type { Entree } from '../core/classements';
import { estTri } from '../core/collection';
import * as J from '../core/jeu';
import type { CombatEtat } from '../core/types';
import { charger } from '../save/local';
import { firebaseActif } from '../net/firebase-config';
import { tableauVide, type GrandTableau } from '../ui/classements';
import type { EcranDistrict } from '../ui/district';
import type { OngletGuide } from '../ui/guide';
import type { OngletJournal } from '../ui/journal';
import { mouvementReduit } from '../ui/outils';
import type { Compte, Ecran as EcranCombat, Fin } from '../ui/vue';

export const racine = document.getElementById('app') as HTMLElement;
export const reduit = mouvementReduit();
export const pause = (ms: number) => new Promise((r) => setTimeout(r, reduit ? Math.min(ms, 120) : ms));

// ---------- État ----------

const sauvegarde = charger();

type Mode = 'titre' | 'intro' | 'district' | 'combat';

/** Ce qui change pendant la partie, partagé par tous les modules de l'application */
export const app: {
  jeu: J.Jeu;
  /** l'écran titre s'affiche à chaque lancement */
  mode: Mode;
  plan: number;
  lignesVues: number;
  /** l'intro complète (revue depuis le titre ou le menu) plutôt que la courte du premier lancement */
  introLongue: boolean;
  /** intro : texte masqué pour admirer l'illustration */
  texteCache: boolean;
  compte: typeof import('../net/compte') | null;
  uid: string | null;
  /** la feuille du pseudo ne s'ouvre d'elle-même qu'une fois par lancement */
  pseudoDemande: boolean;
  /** la clé du pseudo dont la réservation en ligne est confirmée pendant ce lancement */
  pseudoReserve: string | null;
  /** l'entrée telle qu'elle est en ligne (null = pas encore lue ou absente) */
  monEntree: Entree | null;
  monEntreeLue: boolean;
  /** un toucher pendant l'animation la fait passer plus vite */
  rapide: boolean;
  /** le dernier endroit touché : les gains en jaillissent */
  touche: { x: number; y: number; };
  dernierRendu: number;
  /** le dernier contact ou défilement du joueur : le redessin automatique attend qu'il ait fini */
  dernierGeste: number;
} = {
  jeu: sauvegarde?.data ?? J.nouveauJeu(Date.now()),
  mode: 'titre',
  plan: 0,
  lignesVues: 1,
  introLongue: false,
  texteCache: false,
  compte: null,
  uid: null,
  pseudoDemande: false,
  pseudoReserve: null,
  monEntree: null,
  monEntreeLue: false,
  rapide: false,
  touche: { x: 0, y: 0 },
  dernierRendu: 0,
  dernierGeste: 0,
};
const absence = Date.now() - app.jeu.dernierTick;
const avantAbsence: J.Jeu = structuredClone(app.jeu);
const nouvellesAbsence = J.tick(app.jeu, Date.now());
/** résumé « Pendant ton absence », seulement après plus de 10 minutes */
const retourInitial = sauvegarde && absence > 10 * 60_000 && app.jeu.introVue ? J.resumeAbsence(avantAbsence, app.jeu, nouvellesAbsence) : [];

export const apresTitre = (): Mode => !app.jeu.introVue ? 'intro' : app.jeu.expedition ? 'combat' : 'district';

export const compteEtat: Compte = { actif: firebaseActif(), ouvert: false, utilisateur: null, occupe: false, erreur: '', info: '', synchro: 'aucune', pret: false };
/** connecté avec Google ou un e-mail (pas le compte invisible) : c'est ce compte-là qui apparaît sur le Grand Tableau */
export const compteProtege = () => !!compteEtat.utilisateur && !compteEtat.utilisateur.anonyme;
/** l'écran titre n'ouvre la partie qu'une fois celle du compte récupérée : sinon, on ouvrirait celle de l'appareil */
export const titrePret = () => !compteEtat.actif || !!compteEtat.pret;
export const D: EcranDistrict = { j: app.jeu, vue: app.jeu.chambre && !app.jeu.accueilVu && !app.jeu.expedition && app.jeu.objectif === 0 ? 'accueil' : 'archipel', selection: null, escouade: [], strateChoisie: 1, message: '', compte: compteEtat, now: Date.now(), retour: retourInitial, menu: false, carte: null, deck: null, porteur: null, filtre: 'tout', onglet: 'chroniques', chapitre: null, retourBiblio: 'archipel', bulles: 0, etape: 0, fouille: null, epreuve: null, guide: null };
/** le Grand Tableau : lecture des classements en ligne, et ce qu'on a publié */
export const G: GrandTableau = tableauVide();
try { const t = localStorage.getItem('empreintes.tri'); if (estTri(t)) D.tri = t; } catch { /* stockage bloqué */ }
D.grand = G;
export const K: { verrou: boolean; regles: boolean; fuite: boolean; eclats: boolean; tuile?: string; guide: OngletGuide | null; journal: OngletJournal | null; pops: EcranCombat['pops']; fin: Fin | null; etat: CombatEtat | null; traces: Record<string, number>; actif?: number; decouverteTour?: string; phaseTour?: number; decouverteId?: string; decouverteLot?: number; salleVue?: number } = {
  verrou: false, regles: false, fuite: false, eclats: false, guide: null, journal: null, pops: [], fin: null, etat: null, traces: {},
};
