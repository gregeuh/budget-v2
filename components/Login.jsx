"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

const MESSAGES = {
  "auth/invalid-credential": "Email ou mot de passe incorrect.",
  "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-email": "Adresse email invalide.",
};

export default function Login() {
  const [mode, setMode] = useState("connexion");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  const valider = async () => {
    setErreur("");
    setSucces("");
    const emailPropre = email.trim();
    if (!emailPropre.includes("@")) return setErreur("Saisis ton adresse email complète.");
    if (mdp.length < 6) return setErreur("Le mot de passe doit faire au moins 6 caractères.");
    setChargement(true);
    try {
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("firebase/auth");
      if (mode === "connexion") await signInWithEmailAndPassword(auth, emailPropre, mdp);
      else await createUserWithEmailAndPassword(auth, emailPropre, mdp);
      setSucces("Connecté ✓ Ouverture de l'app…");
    } catch (e) {
      setErreur(MESSAGES[e.code] || `Connexion impossible (${e.code || "erreur inconnue"}).`);
    }
    setChargement(false);
  };

  const connexionGoogle = async () => {
    setErreur("");
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
        setErreur(`Connexion Google impossible (${e.code || "erreur inconnue"}).`);
      }
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <div className="pop-in">
        <div className="mb-2 text-5xl">💶</div>
        <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
        <p className="mt-1 text-sourdine">Tes comptes, tes budgets, tes conseils.</p>
      </div>

      <div className="mt-8 space-y-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-ios border border-bordure bg-carte px-4 py-3.5 outline-none focus:border-menthe"
        />
        <input
          type="password"
          autoComplete={mode === "connexion" ? "current-password" : "new-password"}
          placeholder="Mot de passe"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          className="w-full rounded-ios border border-bordure bg-carte px-4 py-3.5 outline-none focus:border-menthe"
        />
        {erreur && <p className="text-sm text-corail">{erreur}</p>}
        {succes && <p className="text-sm font-medium text-menthe">{succes}</p>}
        <button
          onClick={valider}
          disabled={chargement}
          className="w-full rounded-ios bg-encre py-3.5 font-semibold text-contraste disabled:opacity-40 active:scale-[0.99] transition-transform"
        >
          {chargement ? "…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-bordure" />
          <span className="text-xs text-sourdine">ou</span>
          <div className="h-px flex-1 bg-bordure" />
        </div>

        <button
          onClick={connexionGoogle}
          className="flex w-full items-center justify-center gap-2.5 rounded-ios border border-bordure bg-carte py-3.5 font-semibold active:scale-[0.99] transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Continuer avec Google
        </button>
      </div>

      <button
        onClick={() => { setMode(mode === "connexion" ? "creation" : "connexion"); setErreur(""); setSucces(""); }}
        className="mt-5 text-sm font-medium text-sourdine"
      >
        {mode === "connexion" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>

      <p className="mt-6 text-center text-xs text-sourdine/70">
        Projet Firebase : {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "non configuré"}
      </p>
    </div>
  );
}
