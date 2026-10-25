// L'intro : avancer et reculer dans les plans.

import { PLANS } from '../ui/intro';
import { app } from './etat';

// ---------- Intro : avance automatique ----------

export function avancerIntro(): boolean {
  if (app.lignesVues < PLANS[app.plan]!.lignes.length) { app.lignesVues++; return true; }
  if (app.plan < PLANS.length - 1) { app.plan++; app.lignesVues = 1; return true; }
  return false;
}
export function reculerIntro(): boolean {
  if (app.lignesVues > 1) { app.lignesVues--; return true; }
  if (app.plan > 0) { app.plan--; app.lignesVues = PLANS[app.plan]!.lignes.length; return true; }
  return false;
}
