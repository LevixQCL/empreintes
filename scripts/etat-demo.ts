// Fabrique des sauvegardes de démonstration (milieu de partie) pour les captures d'écran.
// usage : npx tsx scripts/etat-demo.ts <dossier>  → district.json, combat.json
import { writeFileSync } from 'node:fs';
import * as J from '../src/core/jeu';
import { MODULES_TIRABLES, carteId } from '../src/core/donnees';
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
MODULES_TIRABLES.forEach((m, i) => {
  const r = metaux[Math.min(4, Math.floor(i / 9))]!;
  // une exclusive n'existe que dans son métal
  j.collection[carteId(m.id, m.seul ? m.rarete : i % 3 === 0 ? 'fer' : r)] = { niveau: 1 + (i % 5), doublons: i % 4 };
});
// l'empreinte des cartes (28 octobre 2026) : quelques vétéranes, une par palier, et une carte au journal fourni
const vec = (v: number, a: number, f: number, g: number[], ga: number[], z: number, d = v * 40, b = v * 25, s = v * 20): J.VecuCarte => ({ o: 2, p: 'ilka', l: v * 7, v, d, b, s, a, f, z, g, ga });
const cles = Object.keys(j.collection);
j.vecu = {};
cles.forEach((k, i) => {
  if (i % 4 === 0) j.vecu![k] = vec(1100, 40, 200, [1, 2, 3, 4, 5, 6, 7, 8], [4, 8], 9);
  else if (i % 4 === 1) j.vecu![k] = vec(400, 12, 60, [1, 2, 3, 4, 5], [3], 6);
  else if (i % 4 === 2) j.vecu![k] = vec(100, 3, 10, [1, 2], [], 3);
});
j.fragments = FRAGMENTS.slice(0, 12).map((f) => f.id);
j.lus = CHAPITRES.slice(0, 8).map((c) => c.id);
j.choix = [];
// la campagne vécue jusqu'au gardien de −4 : la scène d'ouverture de −5 attend au retour sur l'archipel
j.scenes = SCENES.slice(0, SCENES.findIndex((s) => s.id === 'entree-5')).map((s) => s.id);
const env = (data: unknown) => JSON.stringify({ data, updatedAt: now });
// la lettre de l’Héritage attend (lettre.json), puis l’Héritage reçu : la Voix du quartier (pour que la lettre ne couvre pas les autres écrans)
writeFileSync(`${dossier}/lettre.json`, env(j));
J.choisirLegs(j, 'voix-quartier');
writeFileSync(`${dossier}/district.json`, env(j));
const k = structuredClone(j);
J.partir(k, J.disponibles(k).slice(0, 3), 3, 777);
writeFileSync(`${dossier}/combat.json`, env(k));
const d = J.nouveauJeu(now, 42); d.introVue = true;
writeFileSync(`${dossier}/debut.json`, env(d));
console.log('ok', Object.keys(j.collection).length, 'cartes', k.expedition ? 'expédition' : 'pas d’expédition');
