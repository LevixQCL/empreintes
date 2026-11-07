/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// base relative : le même build marche sur GitHub Pages (/empreintes/), en local et plus tard dans Electron/Capacitor.
// Trois pages : le jeu (index.html), l'outil d'analyse (analyse.html) et l'essai du duel (duel.html), que le jeu ne charge jamais.
export default defineConfig({
  base: './',
  // les tests du robot et de la Charge jouent des centaines de combats : 5 s ne suffisent pas sur une machine chargée
  test: { testTimeout: 60000 },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        analyse: resolve(__dirname, 'analyse.html'),
        // le duel en temps réel (3 novembre 2026) : une page d'essai, sans lien depuis le jeu
        duel: resolve(__dirname, 'duel.html'),
      },
    },
  },
});
