"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";

export default function ConnexionBancaire({ onFermer }) {
  const [etat, setEtat] = useState("repos");
  const [erreur, setErreur] = useState("");

  const connecter = async () => {
    setEtat("chargement"); setErreur("");
    try {
      const response = await fetch("/api/powens/connect", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.erreur || "Connexion indisponible.");
      // Full-page navigation is recommended by Powens for iPhone app-to-app authentication.
      window.location.assign(data.url);
    } catch (error) {
      setErreur(error.message || "Connexion indisponible.");
      setEtat("repos");
    }
  };

  return <Sheet titre="Connecter ma banque" onFermer={onFermer}>
    <div className="space-y-4">
      <div className="rounded-ios bg-marque-pale p-4">
        <p className="text-sm font-semibold text-marque-texte">Synchronisation bancaire sécurisée</p>
        <p className="mt-1 text-xs leading-relaxed text-sourdine">Tu choisiras ta banque dans le parcours sécurisé Powens. Pécule ne voit jamais tes identifiants ni ton mot de passe.</p>
      </div>
      <div className="rounded-ios bg-carte p-4 shadow-carte">
        <p className="text-sm font-semibold">Ce qui sera synchronisé</p>
        <ul className="mt-2 space-y-1.5 text-sm text-sourdine"><li>• Comptes et soldes sélectionnés</li><li>• Opérations récentes, y compris celles à venir</li><li>• Consentement révocable depuis ta banque</li></ul>
      </div>
      {erreur && <p role="alert" className="rounded-ios bg-corail-pale px-3 py-2.5 text-sm font-medium text-corail-texte">{erreur}</p>}
      <button onClick={connecter} disabled={etat === "chargement"} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-60">
        {etat === "chargement" ? "Ouverture sécurisée…" : "Choisir ma banque"}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-sourdine">Environnement Sandbox : utilise le connecteur de démonstration, pas tes identifiants bancaires réels.</p>
    </div>
  </Sheet>;
}
