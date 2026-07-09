"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import TabBar from "./TabBar";
import AddSheet from "./AddSheet";
import Login from "./Login";
import Onboarding from "./Onboarding";
import Toast from "./Toast";

export default function AppShell({ children }) {
  const { pret, user, modeLocal, profil, comptes, erreurInit } = useBudget();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  if (!pret) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-bordure border-t-menthe" />
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
      <main className="px-4 pb-36 pt-4">{children}</main>
      <TabBar onAjouter={() => setAjoutOuvert(true)} />
      {ajoutOuvert && <AddSheet onFermer={() => setAjoutOuvert(false)} />}
    </div>
  );
}
