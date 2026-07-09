"use client";

import { useEffect, useState } from "react";
import { useBudget } from "@/lib/store";

export default function Toast() {
  const { toast } = useBudget();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const minuterie = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(minuterie);
  }, [toast?.id]);

  if (!toast) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[60] mx-auto flex max-w-md justify-center px-4"
      style={{ top: "calc(var(--safe-top) + 14px)" }}
    >
      <div
        className={`flex items-center gap-2 rounded-pill bg-encre px-4 py-2.5 text-sm font-semibold text-contraste shadow-flottant transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <span>{toast.icone}</span>
        {toast.message}
      </div>
    </div>
  );
}
