import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// base relative : le même build marche sur GitHub Pages (/empreintes/), en local et plus tard dans Electron/Capacitor.
// Deux pages : le jeu (index.html) et l'outil d'analyse (analyse.html), que le jeu ne charge jamais.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        analyse: resolve(__dirname, 'analyse.html'),
      },
    },
  },
});
