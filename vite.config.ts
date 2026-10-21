import { defineConfig } from 'vite';

// base relative : le même build marche sur GitHub Pages (/empreintes/), en local et plus tard dans Electron/Capacitor.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
