"use client";

const decaler = (mois, n) => {
  const [a, m] = mois.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

import { cleMoisLocal, euros } from "@/lib/format";

export default function MoisSelecteur({ mois, onChanger, revenus, depenses }) {
  const actuel = cleMoisLocal();
  const label = new Date(mois + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const auFutur = mois >= actuel;

  const avecChiffres = typeof revenus === "number" && typeof depenses === "number";

  return (
    <div className="rounded-ios bg-carte shadow-carte">
      <div className="flex items-center justify-between px-1.5 py-1">
      <button onClick={() => onChanger(decaler(mois, -1))} aria-label="Mois précédent"
        className="flex h-7 w-7 items-center justify-center rounded-full text-base text-sourdine active:bg-voile">‹</button>
      <button onClick={() => mois !== actuel && onChanger(actuel)} className="text-sm font-semibold capitalize">
        {label}{mois !== actuel && <span className="ml-1.5 text-xs font-medium text-ciel">· aujourd'hui</span>}
      </button>
      <button onClick={() => !auFutur && onChanger(decaler(mois, 1))} aria-label="Mois suivant" disabled={auFutur}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-base ${auFutur ? "text-sourdine/30" : "text-sourdine active:bg-voile"}`}>›</button>
      </div>

      {avecChiffres && (
        <div key={mois} className="fade-in flex items-center justify-between border-t border-bordure px-4 py-2.5 text-sm">
          <span className="flex items-baseline gap-1.5">
            <span className="text-xs text-sourdine">Entrées</span>
            <span className="chiffres font-semibold text-menthe">{euros(revenus)}</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-xs text-sourdine">Sorties</span>
            <span className="chiffres font-semibold text-corail">{euros(depenses)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
