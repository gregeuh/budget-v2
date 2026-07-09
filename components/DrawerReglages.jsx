"use client";

import { useBudget } from "@/lib/store";
import ReglagesContenu from "./ReglagesContenu";

export default function DrawerReglages() {
  const { setReglagesOuverts } = useBudget();
  const fermer = () => setReglagesOuverts(false);

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-md">
      <div className="fade-in absolute inset-0 bg-encre/30" onClick={fermer} />
      <aside
        className="drawer-in absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto bg-fond px-4 pb-10 shadow-flottant"
        style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
        role="dialog"
        aria-label="Réglages"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-sourdine">Menu</span>
          <button onClick={fermer} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full bg-voile text-sourdine">✕</button>
        </div>
        <ReglagesContenu />
      </aside>
    </div>
  );
}
