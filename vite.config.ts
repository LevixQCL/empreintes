import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// base relative : le même build marche sur GitHub Pages (/empreintes/), en local et plus tard dans Electron/Capacitor.
// Deux pages : le jeu (index.html) et le teaser qui ne montre que l'intro (teaser.html).
// Le teaser reste à la racine : l'intro charge ses images en ./intro/…
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        teaser: resolve(__dirname, 'teaser.html'),
      },
    },
  },
});
