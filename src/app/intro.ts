// L'intro : avancer et reculer dans les plans.

import { PLANS, lignesDe } from '../ui/intro';
import { app } from './etat';

// ---------- Intro : avance automatique ----------

export function avancerIntro(): boolean {
  if (app.lignesVues < lignesDe(app.plan, app.introLongue).length) { app.lignesVues++; return true; }
  if (app.plan < PLANS.length - 1) { app.plan++; app.lignesVues = 1; return true; }
  return false;
}
export function reculerIntro(): boolean {
  if (app.lignesVues > 1) { app.lignesVues--; return true; }
  if (app.plan > 0) { app.plan--; app.lignesVues = lignesDe(app.plan, app.introLongue).length; return true; }
  return false;
}
