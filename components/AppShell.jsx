"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useBudget } from "@/lib/store";
import TabBar from "./TabBar";
import AddSheet from "./AddSheet";
import Login from "./Login";
import Onboarding from "./Onboarding";
import Toast from "./Toast";
import DrawerReglages from "./DrawerReglages";
import PointsSautillants from "./PointsSautillants";

export default function AppShell({ children }) {
  const { pret, user, modeLocal, profil, comptes, erreurInit, reglagesOuverts } = useBudget();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const chemin = usePathname();

  if (!pret) {
    return (
      <div className="flex h-dvh items-center justify-center bg-fond">
        <PointsSautillants taille={12} />
      </div>
    );
  }

  if (!modeLocal && erreurInit && !user) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl">🔌</div>
        <h1 className="mt-3 text-xl font-bold">Problème de configuration</h1>
        <p className="mt-2 text-sm text-sourdine">{erreurInit}</p>
        <button onClick={() => location.reload()} className="mt-5 rounded-ios bg-encre px-6 py-3 font-semibold text-contraste">
          Réessayer
        </button>
      </div>
    );
  }
  if (!modeLocal && !user) return <Login />;
  if (!profil.onboarde && comptes.length === 0) return <Onboarding />;

  return (
    <div className="mx-auto min-h-dvh max-w-md" style={{ paddingTop: "var(--safe-top)" }}>
      <Toast />
      {erreurInit && (
        <div className="mx-4 mt-3 rounded-ios bg-corail-pale px-3.5 py-2 text-xs font-medium text-corail-texte">
          ⚠️ {erreurInit}
        </div>
      )}
      <main key={chemin} className="page-in px-4 pb-32 pt-3">{children}</main>
      <TabBar onAjouter={() => setAjoutOuvert(true)} ajoutOuvert={ajoutOuvert} />
      {ajoutOuvert && <AddSheet onFermer={() => setAjoutOuvert(false)} />}
      {reglagesOuverts && <DrawerReglages />}
    </div>
  );
}
