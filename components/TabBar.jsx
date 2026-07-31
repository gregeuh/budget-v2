"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", label: "Accueil", icone: "accueil", couleur: "#007AFF", pale: "rgba(0,122,255,.12)" },
  { href: "/comptes", label: "Comptes", icone: "comptes", couleur: "#5856D6", pale: "rgba(88,86,214,.13)" },
  { href: "AJOUT" },
  { href: "/budgets", label: "Budgets", icone: "budgets", couleur: "#FF9500", pale: "rgba(255,149,0,.14)" },
  { href: "/conseils", label: "Conseils", icone: "conseils", couleur: "#AF52DE", pale: "rgba(175,82,222,.13)" },
];

function IconeOnglet({ nom }) {
  const commun = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const dessins = {
    accueil: <><path {...commun} d="m3 10.5 9-7 9 7" /><path {...commun} d="M5.5 9.5V20h13V9.5M9.5 20v-5.5h5V20" /></>,
    comptes: <><rect {...commun} x="3" y="5" width="18" height="14" rx="3" /><path {...commun} d="M3 10h18M16.5 15h1" /></>,
    budgets: <><circle {...commun} cx="12" cy="12" r="8.5" /><circle {...commun} cx="12" cy="12" r="4" /><path {...commun} d="M12 3.5v2M20.5 12h-2" /></>,
    conseils: <><path {...commun} d="m12 3 1.45 4.05L17.5 8.5l-4.05 1.45L12 14l-1.45-4.05L6.5 8.5l4.05-1.45L12 3Z" /><path {...commun} d="m18.5 14 .75 2.05L21.5 17l-2.25.95L18.5 20l-.75-2.05L15.5 17l2.25-.95.75-2.05Z" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">{dessins[nom]}</svg>;
}

export default function TabBar({ onAjouter, ajoutOuvert = false }) {
  const chemin = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}
    >
      <div className="grid grid-cols-5 items-center rounded-v3-l border border-ui-hairline bg-ui-surface-glass px-2 py-2 shadow-v3-floating backdrop-blur-v3-glass">
        {ONGLETS.map((o) =>
          o.href === "AJOUT" ? (
            <button
              key="ajout"
              onClick={onAjouter}
              data-bouton-ajout
              aria-label="Ajouter une opération"
              className="mx-auto -mt-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-light text-white shadow-bouton ring-4 ring-[var(--v3-surface-1)] transition-transform duration-v3-normal ease-v3-spring active:scale-95"
              style={{ background: "linear-gradient(145deg, var(--marque), var(--marque-texte))" }}
            >
              <span className={`transition-transform duration-v3-normal ease-v3-standard ${ajoutOuvert ? "rotate-45" : ""}`}>+</span>
            </button>
          ) : (
            <Link
              key={o.href}
              href={o.href}
              onClick={() => {
                if (chemin === o.href) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-current={chemin === o.href ? "page" : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-v3-s py-1 text-[10px] font-semibold transition-all duration-v3-normal ease-v3-standard ${
                chemin === o.href ? "shadow-sm" : "text-ui-text-secondary"
              }`}
              style={chemin === o.href ? { color: o.couleur, backgroundColor: o.pale } : { color: o.couleur }}
            >
              <span key={chemin === o.href ? "actif" : "inactif"} className={chemin === o.href ? "saut-onglet" : "opacity-70"}><IconeOnglet nom={o.icone} /></span>
              {o.label}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
