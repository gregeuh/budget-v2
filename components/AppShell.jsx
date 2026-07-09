"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import TabBar from "./TabBar";
import AddSheet from "./AddSheet";
import Login from "./Login";
import Onboarding from "./Onboarding";

export default function AppShell({ children }) {
  const { pret, user, modeLocal, profil, comptes } = useBudget();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  if (!pret) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-bordure border-t-menthe" />
      </div>
    );
  }

  if (!modeLocal && !user) return <Login />;
  if (!modeLocal && user && !profil.onboarde && comptes.length === 0) return <Onboarding />;

  return (
    <div className="mx-auto min-h-dvh max-w-md" style={{ paddingTop: "var(--safe-top)" }}>
      {modeLocal && (
        <div className="mx-4 mt-3 rounded-pill bg-beurre-pale px-4 py-1.5 text-center text-xs font-medium text-[#B98A1B]">
          Mode démo — données stockées sur cet appareil
        </div>
      )}
      <main className="px-4 pb-36 pt-4">{children}</main>
      <TabBar onAjouter={() => setAjoutOuvert(true)} />
      {ajoutOuvert && <AddSheet onFermer={() => setAjoutOuvert(false)} />}
    </div>
  );
}
