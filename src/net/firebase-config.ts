// Configuration web Firebase. Ces valeurs ne sont pas secrètes (elles identifient le projet) :
// la sécurité vient des règles Firestore (firestore.rules) et des domaines autorisés.
// Tant que apiKey est vide, le jeu tourne hors ligne et le bouton « Compte » est masqué.

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const firebaseActif = () => firebaseConfig.apiKey !== '';
