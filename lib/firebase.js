import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase est considéré configuré si la clé API est renseignée.
export const firebaseActif = Boolean(config.apiKey);

let app = null;
if (firebaseActif) {
  app = getApps().length ? getApps()[0] : initializeApp(config);
}

export const auth = firebaseActif ? getAuth(app) : null;

// Cache hors-ligne : l'app fonctionne sans réseau (métro, avion),
// la synchronisation reprend automatiquement au retour de la connexion.
let firestore = null;
if (firebaseActif) {
  try {
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    firestore = getFirestore(app);
  }
}
export const db = firestore;
