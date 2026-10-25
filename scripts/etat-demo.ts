// Fabrique des sauvegardes de démonstration (milieu de partie) pour les captures d'écran.
// usage : npx tsx scripts/etat-demo.ts <dossier>  → district.json, combat.json
import { writeFileSync } from 'node:fs';
import * as J from '../src/core/jeu';
import { MODULES, carteId } from '../src/core/donnees';
import { FRAGMENTS } from '../src/core/fragments';
import { CHAPITRES } from '../src/core/chroniques';
import { SCENES } from '../src/core/campagne';

const dossier = process.argv[2] ?? '.';
const now = Date.now();
const j = J.nouveauJeu(now, 20261022);
j.introVue = true;
j.chambre = true; j.arrives = []; j.actes = { chambre: 'commission' };
j.recrues = true;
j.batiments = { noyau: 4, generateur: 4, forge: 3, clinique: 3 };
j.energie = 1840; j.composants = 620; j.eclats = 7;
j.strate = 5; j.objectif = 4; j.confiance = 64;
const metaux = ['fer', 'cuivre', 'argent', 'or', 'nacre'] as const;
MODULES.forEach((m, i) => {
  const r = metaux[Math.min(4, Math.floor(i / 9))]!;
  j.collection[carteId(m.id, i % 3 === 0 ? 'fer' : r)] = { niveau: 1 + (i % 5), doublons: i % 4 };
});
j.fragments = FRAGMENTS.slice(0, 12).map((f) => f.id);
j.lus = CHAPITRES.slice(0, 8).map((c) => c.id);
j.choix = [];
// la campagne vécue jusqu'au gardien de −4 : la scène d'ouverture de −5 attend au retour sur l'archipel
j.scenes = SCENES.slice(0, SCENES.findIndex((s) => s.id === 'entree-5')).map((s) => s.id);
const env = (data: unknown) => JSON.stringify({ data, updatedAt: now });
writeFileSync(`${dossier}/district.json`, env(j));
const k = structuredClone(j);
J.partir(k, J.disponibles(k).slice(0, 3), 3, 777);
writeFileSync(`${dossier}/combat.json`, env(k));
const d = J.nouveauJeu(now, 42); d.introVue = true;
writeFileSync(`${dossier}/debut.json`, env(d));
console.log('ok', Object.keys(j.collection).length, 'cartes', k.expedition ? 'expédition' : 'pas d’expédition');
