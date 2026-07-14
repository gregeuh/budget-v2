"use client";

const decaler = (mois, n) => {
  const [a, m] = mois.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

import { cleMoisLocal } from "@/lib/format";

export default function MoisSelecteur({ mois, onChanger }) {
  const actuel = cleMoisLocal();
  const label = new Date(mois + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const auFutur = mois >= actuel;

  return (
    <div className="flex items-center justify-between rounded-pill bg-carte px-1.5 py-1 shadow-carte">
      <button onClick={() => onChanger(decaler(mois, -1))} aria-label="Mois précédent"
        className="flex h-7 w-7 items-center justify-center rounded-full text-base text-sourdine active:bg-voile">‹</button>
      <button onClick={() => mois !== actuel && onChanger(actuel)} className="text-sm font-semibold capitalize">
        {label}{mois !== actuel && <span className="ml-1.5 text-xs font-medium text-ciel">· aujourd'hui</span>}
      </button>
      <button onClick={() => !auFutur && onChanger(decaler(mois, 1))} aria-label="Mois suivant" disabled={auFutur}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-base ${auFutur ? "text-sourdine/30" : "text-sourdine active:bg-voile"}`}>›</button>
    </div>
  );
}
