// Configuration web Firebase. Ces valeurs ne sont pas secrètes (elles identifient le projet) :
// la sécurité vient des règles Firestore (firestore.rules) et des domaines autorisés.
// Tant que apiKey est vide, le jeu tourne hors ligne et le bouton « Compte » est masqué.

export const firebaseConfig = {
  apiKey: 'AIzaSyDbXtyStGlgcEhNyKaYz0FdWhp6kxuH6YE',
  authDomain: 'empreintes-8e82d.firebaseapp.com',
  projectId: 'empreintes-8e82d',
  storageBucket: 'empreintes-8e82d.firebasestorage.app',
  messagingSenderId: '225950390316',
  appId: '1:225950390316:web:6f06bc0ebdd0ad702c5989',
};

export const firebaseActif = () => firebaseConfig.apiKey !== '';

/**
 * App Check (8 novembre 2026, audit de sécurité) : la clé de site reCAPTCHA v3 du jeu. Tant qu'elle est vide, App Check est éteint.
 * Une fois remplie, Firebase vérifie que les requêtes viennent bien du jeu publié (pas d'un script) ; on active ensuite
 * l'application stricte dans la console (App Check › Firestore et Authentication › Appliquer).
 */
export const appCheckCle = '';
