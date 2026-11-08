// App Check (8 novembre 2026, audit de sécurité) : Firebase vérifie que les requêtes viennent du jeu publié, pas d'un script.
// Fournisseur : Fraud Defense (anciennement reCAPTCHA Enterprise), recommandé par Firebase (le reCAPTCHA v3 classique est obsolète).
// Seulement sur le site publié : en local, le jeton échouerait. Le badge reCAPTCHA est caché (styles.css, analyse.css) ;
// la mention obligatoire de Google est dans le panneau Compte (vue.ts) et sur la page Confidentialité.

import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { appCheckCle } from './firebase-config';

export function activerAppCheck(app: FirebaseApp): void {
  if (!appCheckCle || !location.hostname.endsWith('github.io')) return;
  try { initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(appCheckCle), isTokenAutoRefreshEnabled: true }); } catch { /* le jeu tourne quand même */ }
}
