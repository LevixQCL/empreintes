// Un « travailleur » du banc d'équilibrage : il joue un paquet de descentes avec le vrai moteur, à côté de la page,
// pour que plusieurs paquets tournent en même temps (un par cœur du processeur) sans figer l'écran.

import { jouerTour, tauxExploration, type Escouade } from '../core/robot';

export interface Paquet { n: number; escouade: Escouade; strate: number; parties: number; graine: number; facteur: number }
export interface Reponse { n: number; victoires: number; parties: number; ms: number; erreur?: string }

self.onmessage = (ev: MessageEvent<Paquet>) => {
  const p = ev.data;
  const t0 = performance.now();
  try {
    const r = tauxExploration(p.escouade, p.strate, p.parties, p.graine, jouerTour, p.facteur);
    const rep: Reponse = { n: p.n, victoires: Math.round(r.victoire * p.parties), parties: p.parties, ms: performance.now() - t0 };
    self.postMessage(rep);
  } catch (e) {
    self.postMessage({ n: p.n, victoires: 0, parties: 0, ms: 0, erreur: String(e) } satisfies Reponse);
  }
};
