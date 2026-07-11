"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", label: "Accueil", icone: "🏡" },
  { href: "/comptes", label: "Comptes", icone: "💳" },
  { href: "AJOUT" },
  { href: "/budgets", label: "Budgets", icone: "🎯" },
  { href: "/conseils", label: "Conseils", icone: "✨" },
];

export default function TabBar({ onAjouter, ajoutOuvert = false }) {
  const chemin = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}
    >
      <div className="grid grid-cols-5 items-center rounded-[22px] border border-bordure bg-carte/80 px-1.5 py-1.5 shadow-flottant backdrop-blur-xl">
        {ONGLETS.map((o) =>
          o.href === "AJOUT" ? (
            <button
              key="ajout"
              onClick={onAjouter}
              aria-label="Ajouter une opération"
              className="mx-auto -mt-6 flex h-12 w-12 items-center justify-center rounded-full text-xl font-light text-white shadow-flottant active:scale-95 transition-transform"
              style={{ background: "linear-gradient(145deg, #35C79A, #1E9B77)" }}
            >
              <span className={`transition-transform duration-300 ${ajoutOuvert ? "rotate-45" : ""}`}>+</span>
            </button>
          ) : (
            <Link
              key={o.href}
              href={o.href}
              onClick={() => {
                if (chemin === o.href) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition-colors ${
                chemin === o.href ? "bg-voile text-encre" : "text-sourdine"
              }`}
            >
              <span className={`text-lg transition-transform ${chemin === o.href ? "scale-110" : "grayscale opacity-60"}`}>{o.icone}</span>
              {o.label}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
