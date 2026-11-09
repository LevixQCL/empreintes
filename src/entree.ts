// L'entrée du jeu (9 novembre 2026) : choisit la langue et charge sa traduction AVANT le reste du jeu,
// parce que les Chroniques, les Strates et les autres textes sont traduits au moment où leurs modules se chargent.
// Ensuite seulement, main.ts démarre le jeu.
//   ?langue=en dans l'adresse : passe en anglais (et s'en souvient) ; ?langue=fr : revient au français.
//   Sans choix enregistré : la langue de l'appareil, si elle fait partie des langues publiées ; sinon le français.

import { definirLangue, LANGUES, LANGUES_PUBLIEES, type Langue } from './core/i18n';
import { chargerCatalogue } from './traduction';

const CLE = 'empreintes.langue';
const lire = (): string | null => { try { return localStorage.getItem(CLE); } catch { return null; } };
const retenir = (l: Langue) => { try { localStorage.setItem(CLE, l); } catch { /* stockage bloqué */ } };
const estLangue = (x: string | null | undefined): x is Langue => !!x && (LANGUES as readonly string[]).includes(x);

function choisirLangue(): Langue {
  const demandee = new URLSearchParams(location.search).get('langue');
  if (estLangue(demandee)) { retenir(demandee); return demandee; }
  const gardee = lire();
  if (estLangue(gardee)) return gardee;
  const appareil = (navigator.language || 'fr').slice(0, 2);
  return estLangue(appareil) && LANGUES_PUBLIEES.includes(appareil) ? appareil : 'fr';
}

async function demarrer(): Promise<void> {
  const l = choisirLangue();
  if (l !== 'fr') {
    try { definirLangue(l, await chargerCatalogue(l)); } catch { definirLangue('fr', null); }
  }
  document.documentElement.lang = l === 'fr' ? 'fr' : l;
  await import('./main');
}

void demarrer();
