import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

async function utilisateurCourant() {
  if (!auth || auth.currentUser) return auth?.currentUser || null;
  return new Promise((resolve) => {
    let stop = () => {};
    const timeout = window.setTimeout(() => {
      stop();
      resolve(auth.currentUser || null);
    }, 2_000);
    stop = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timeout);
      stop();
      resolve(user);
    });
  });
}

/** Ajoute un ID token Firebase aux appels protégés, sans jamais stocker le jeton. */
export async function fetchSecurise(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const user = await utilisateurCourant();
  if (user) headers.set("authorization", `Bearer ${await user.getIdToken()}`);
  return fetch(url, { ...options, headers });
}
