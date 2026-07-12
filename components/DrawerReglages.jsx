"use client";

import { useBudget } from "@/lib/store";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReglagesContenu from "./ReglagesContenu";

export default function DrawerReglages() {
  const { setReglagesOuverts } = useBudget();
  const fermer = () => setReglagesOuverts(false);
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    setMonte(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!monte) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] mx-auto max-w-md">
      <div className="fade-in absolute inset-0 bg-encre/30" onClick={fermer} />
      <aside
        className="drawer-in absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-fond px-4 shadow-flottant"
        style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
        role="dialog"
        aria-label="Réglages"
      >
        <div className="mb-3">
          <button onClick={fermer} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full bg-voile text-sourdine">✕</button>
        </div>
        <ReglagesContenu />
      </aside>
    </div>,
    document.body
  );
}
