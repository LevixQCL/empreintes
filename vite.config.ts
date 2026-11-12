/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// base relative : le même build marche sur GitHub Pages (/empreintes/), en local et plus tard dans Electron/Capacitor.
// Quatre pages : le jeu (index.html), l'outil d'analyse (analyse.html), l'essai du duel (duel.html) et le banc d'équilibrage
// (equilibrage.html), que le jeu ne charge jamais.
export default defineConfig({
  base: './',
  // les tests du robot et de la Charge jouent des centaines de combats : 5 s ne suffisent pas sur une machine chargée
  test: { testTimeout: 60000 },
  // le robot tourne dans des travailleurs (src/equilibrage/travailleur.ts) qui importent le moteur : format module
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        analyse: resolve(__dirname, 'analyse.html'),
        // le duel en temps réel (3 novembre 2026) : une page d'essai, sans lien depuis le jeu
        duel: resolve(__dirname, 'duel.html'),
        // le banc d'équilibrage (12 novembre 2026) : le robot des cartes dans le navigateur, sans Claude
        equilibrage: resolve(__dirname, 'equilibrage.html'),
      },
    },
  },
});
