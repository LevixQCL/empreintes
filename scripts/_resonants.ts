// Quand un joueur peut-il réunir trois Résonants et assez de cartes Résonantes ? (29 octobre 2026)
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
import { porteursPresents } from '../src/core/partie/etat';
import { moduleDef, porteurDef } from '../src/core/donnees';
const JOURS = 60;
for (const k of ['occasionnel', 'assidu'] as const) {
  const lignes: Record<number, { jour: number; reso: number; cartes: number; niv: number }[]> = {};
  for (let i = 0; i < 12; i++) {
    simulerParcours(PROFILS[k], JOURS, 1000 + i * 7919, {
      joueur: 'moyen',
      trace: (j, jour) => {
        const reso = porteursPresents(j).filter((id) => porteurDef(id).lignee === 'reso').length;
        const cs = Object.entries(j.collection).filter(([id]) => moduleDef(id.split('@')[0]!).lignee === 'reso');
        const noms = new Set(cs.map(([id]) => id.split('@')[0]));
        const niv = cs.length ? cs.reduce((n, [, c]) => n + c.niveau, 0) / cs.length : 0;
        (lignes[j.strate] ??= []).push({ jour, reso, cartes: noms.size, niv });
      },
    });
  }
  console.log(`\n${PROFILS[k].nom}`);
  for (const st of Object.keys(lignes).map(Number).sort((a, b) => a - b)) {
    const l = lignes[st]!;
    console.log(`Strate −${st} : jour ${mediane(l.map((x) => x.jour))} · Résonants ${mediane(l.map((x) => x.reso))} · cartes Résonantes différentes ${mediane(l.map((x) => x.cartes))} · niveau moyen ${mediane(l.map((x) => x.niv)).toFixed(1)}`);
  }
}
