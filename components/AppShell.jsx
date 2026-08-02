"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useBudget } from "@/lib/store";
import { brancherJournal } from "@/lib/journal";
import TabBar from "./TabBar";
import AddSheet from "./AddSheet";
import Login from "./Login";
import Onboarding from "./Onboarding";
import Toast from "./Toast";
import DrawerReglages from "./DrawerReglages";
import SqueletteAccueil from "./SqueletteAccueil";
import TirerPourRafraichir from "./TirerPourRafraichir";
import Confettis from "./Confettis";

export default function AppShell({ children }) {
  const { pret, user, modeLocal, profil, comptes, erreurInit, reglagesOuverts, celebration } = useBudget();
  const [fete, setFete] = useState(false);
  const [enLigne, setEnLigne] = useState(true);

  // Capte les erreurs dès le démarrage, pour qu'aucune ne passe inaperçue
  useEffect(() => { brancherJournal(); }, []);

  // Les données Firestore sont mises en cache par le SDK. Informer sans
  // bloquer permet de continuer à consulter l'app même sans réseau.
  useEffect(() => {
    const actualiser = () => setEnLigne(navigator.onLine);
    actualiser();
    window.addEventListener("online", actualiser);
    window.addEventListener("offline", actualiser);
    return () => {
      window.removeEventListener("online", actualiser);
      window.removeEventListener("offline", actualiser);
    };
  }, []);

  useEffect(() => {
    if (celebration > 0) setFete(true);
  }, [celebration]);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const chemin = usePathname();

  // La page entre du côté vers lequel on navigue, comme dans les apps natives.
  const ORDRE = ["/", "/comptes", "/budgets", "/statistiques", "/conseils"];
  const cheminPrecedent = useRef(chemin);
  const rang = (c) => {
    const i = ORDRE.indexOf(c);
    return i === -1 ? ORDRE.length : i;
  };
  const sens = rang(chemin) >= rang(cheminPrecedent.current) ? "page-droite" : "page-gauche";
  useEffect(() => { cheminPrecedent.current = chemin; }, [chemin]);

  if (!pret) return <SqueletteAccueil />;

  if (!modeLocal && erreurInit && !user) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl">🔌</div>
        <h1 className="mt-3 text-xl font-bold">Problème de configuration</h1>
        <p className="mt-2 text-sm text-sourdine">{erreurInit}</p>
        <button onClick={() => location.reload()} className="mt-5 rounded-ios bg-marque-bouton px-6 py-3 font-semibold text-surMarque">
          Réessayer
        </button>
      </div>
    );
  }
  if (!modeLocal && !user) return <Login />;
  if (!profil.onboarde && comptes.length === 0) return <Onboarding />;

  return (
    <div className="app-shell mx-auto min-h-dvh max-w-md" style={{ paddingTop: "var(--safe-top)" }}>
      <a href="#contenu-principal" className="lien-echappement">Aller au contenu</a>
      <div aria-hidden="true" className="app-shell__ambient" />
      <TirerPourRafraichir />
      <Toast />
      {!enLigne && (
        <div role="status" className="relative z-10 mx-4 mt-3 rounded-v3-s bg-beurre-pale px-3.5 py-2 text-xs font-medium text-beurre-texte shadow-v3-soft">
          📡 Hors connexion — tes données restent consultables. Les changements seront synchronisés dès le retour du réseau.
        </div>
      )}
      {erreurInit && (
        <div className="relative z-10 mx-4 mt-3 rounded-v3-s bg-corail-pale px-3.5 py-2 text-xs font-medium text-corail-texte shadow-v3-soft">
          ⚠️ {erreurInit}
        </div>
      )}
      <main id="contenu-principal" key={chemin} tabIndex={-1} className={`relative z-10 ${sens} px-4 pb-40 pt-6`}>{children}</main>
      <TabBar onAjouter={() => setAjoutOuvert(true)} ajoutOuvert={ajoutOuvert} />
      {ajoutOuvert && <AddSheet onFermer={() => setAjoutOuvert(false)} />}
      {reglagesOuverts && <DrawerReglages />}
      <Confettis actif={fete} onFini={() => setFete(false)} />
    </div>
  );
}
