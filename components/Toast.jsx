"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBudget } from "@/lib/store";

export default function Toast() {
  const { toast } = useBudget();
  const [visible, setVisible] = useState(false);
  const [monte, setMonte] = useState(false);

  useEffect(() => setMonte(true), []);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const minuterie = setTimeout(() => setVisible(false), toast.action ? 4000 : 2200);
    return () => clearTimeout(minuterie);
  }, [toast?.id]);

  if (!toast || !monte) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[120] mx-auto flex max-w-md justify-center px-4"
      style={{ top: "calc(var(--safe-top) + 14px)" }}
    >
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-pill bg-encre px-4 py-2.5 text-sm font-semibold text-contraste shadow-flottant transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <span>{toast.icone}</span>
        {toast.message}
        {toast.action && (
          <button
            onClick={() => { toast.action.executer(); setVisible(false); }}
            className="ml-1 rounded-pill bg-contraste/15 px-2.5 py-1 text-xs font-bold underline-offset-2"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
