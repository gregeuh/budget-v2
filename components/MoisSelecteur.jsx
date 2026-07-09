"use client";

const decaler = (mois, n) => {
  const [a, m] = mois.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function MoisSelecteur({ mois, onChanger }) {
  const actuel = new Date().toISOString().slice(0, 7);
  const label = new Date(mois + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const auFutur = mois >= actuel;

  return (
    <div className="flex items-center justify-between rounded-pill bg-carte px-2 py-1.5 shadow-carte">
      <button onClick={() => onChanger(decaler(mois, -1))} aria-label="Mois précédent"
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-sourdine active:bg-voile">‹</button>
      <button onClick={() => mois !== actuel && onChanger(actuel)} className="text-sm font-semibold capitalize">
        {label}{mois !== actuel && <span className="ml-1.5 text-xs font-medium text-ciel">· aujourd'hui</span>}
      </button>
      <button onClick={() => !auFutur && onChanger(decaler(mois, 1))} aria-label="Mois suivant" disabled={auFutur}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${auFutur ? "text-sourdine/30" : "text-sourdine active:bg-voile"}`}>›</button>
    </div>
  );
}
