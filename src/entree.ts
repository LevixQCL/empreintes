// L'entrée du jeu (9 novembre 2026) : choisit la langue et charge sa traduction AVANT le reste du jeu,
// parce que les Chroniques, les Strates et les autres textes sont traduits au moment où leurs modules se chargent.
// Ensuite seulement, main.ts démarre le jeu.
//   ?langue=en dans l'adresse : passe en anglais (et s'en souvient) ; ?langue=fr : revient au français.
//   Sans choix enregistré : la première langue de l'appareil que le jeu parle ; sinon l'anglais.

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
  // la première langue de l'appareil que le jeu parle (un téléphone « nl, fr » s'ouvre en français) ;
  // aucune (allemand, néerlandais seul…) : l'anglais, plus largement compris que le français
  const appareil = (navigator.languages?.length ? navigator.languages : [navigator.language || 'fr']).map((x) => x.slice(0, 2).toLowerCase());
  return appareil.find((x): x is Langue => estLangue(x) && LANGUES_PUBLIEES.includes(x)) ?? 'en';
}

async function demarrer(): Promise<void> {
  const l = choisirLangue();
  if (l !== 'fr') {
    try { definirLangue(l, await chargerCatalogue(l)); } catch { definirLangue('fr', null); }
  }
  document.documentElement.lang = l === 'fr' ? 'fr' : l;
  if (l === 'en') {
    // la description de la page (aperçus de lien, moteurs de recherche) suit la langue
    const description = '2121. Under the water, others still remember. Ossyra, a card and management game.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }
  await import('./main');
}

void demarrer();
