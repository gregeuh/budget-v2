import { createHash } from "crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import webpush from "web-push";

function configurationManquante() {
  return !process.env.PUSH_VAPID_PUBLIC_KEY || !process.env.PUSH_VAPID_PRIVATE_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
}

function adminApp() {
  if (configurationManquante()) return null;
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
  });
}

export function pushPret() {
  return !configurationManquante();
}

export function clePushPublique() {
  return process.env.PUSH_VAPID_PUBLIC_KEY || "";
}

export async function utilisateurDepuisRequete(request) {
  const jeton = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cleFirebase = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!jeton || !cleFirebase || !adminApp()) return null;

  // La vérification est déléguée à Firebase Auth. Cela évite d'importer
  // firebase-admin/auth dans la Function Turbopack, qui échoue actuellement
  // sur Vercel à cause d'une dépendance CommonJS/ESM transitive.
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cleFirebase)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: jeton }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = await response.json();
  const uid = data?.users?.[0]?.localId;
  return uid ? { uid } : null;
}

export function identifiantSouscription(endpoint) {
  return createHash("sha256").update(endpoint).digest("hex");
}

export async function enregistrerSouscription(uid, subscription) {
  const app = adminApp();
  if (!app) throw new Error("PUSH_NON_CONFIGURE");
  const id = identifiantSouscription(subscription.endpoint);
  await getFirestore(app).doc(`users/${uid}/pushSubscriptions/${id}`).set({
    subscription,
    creeLe: new Date().toISOString(),
    misAJourLe: new Date().toISOString(),
  }, { merge: true });
  return id;
}

export async function supprimerSouscription(uid, endpoint) {
  const app = adminApp();
  if (!app || !endpoint) return;
  await getFirestore(app).doc(`users/${uid}/pushSubscriptions/${identifiantSouscription(endpoint)}`).delete();
}

export async function envoyerNotification(uid, message) {
  const app = adminApp();
  if (!app) throw new Error("PUSH_NON_CONFIGURE");
  webpush.setVapidDetails(
    process.env.PUSH_VAPID_SUBJECT || "mailto:bonjour@pecule.app",
    process.env.PUSH_VAPID_PUBLIC_KEY,
    process.env.PUSH_VAPID_PRIVATE_KEY
  );

  const firestore = getFirestore(app);
  const subscriptions = await firestore.collection(`users/${uid}/pushSubscriptions`).get();
  const payload = JSON.stringify({
    title: message.title || "Pécule",
    body: message.body || "Ton budget t'attend.",
    url: message.url || "/",
    tag: message.tag || "pecule",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });

  let envoyees = 0;
  await Promise.all(subscriptions.docs.map(async (doc) => {
    try {
      await webpush.sendNotification(doc.data().subscription, payload, { TTL: 60 * 60 });
      envoyees += 1;
    } catch (error) {
      // Une souscription expirée est retirée pour ne pas la réessayer indéfiniment.
      if (error?.statusCode === 404 || error?.statusCode === 410) await doc.ref.delete();
      else throw error;
    }
  }));
  return envoyees;
}
