// L'intro : avancer et reculer dans les plans.

import { PLANS, lignesDe, type Film } from '../ui/intro';
import { RECITS } from '../ui/recits';
import { app } from './etat';

/** Le film joué : un Récit des origines, ou l'intro (undefined) */
export const filmActif = (): Film | undefined => (app.recit ? RECITS[app.recit] : undefined);
const plans = () => filmActif()?.plans ?? PLANS;

// ---------- Intro : avance automatique ----------

export function avancerIntro(): boolean {
  if (app.lignesVues < lignesDe(app.plan, app.introLongue, plans()).length) { app.lignesVues++; return true; }
  if (app.plan < plans().length - 1) { app.plan++; app.lignesVues = 1; return true; }
  return false;
}
export function reculerIntro(): boolean {
  if (app.lignesVues > 1) { app.lignesVues--; return true; }
  if (app.plan > 0) { app.plan--; app.lignesVues = lignesDe(app.plan, app.introLongue, plans()).length; return true; }
  return false;
}
