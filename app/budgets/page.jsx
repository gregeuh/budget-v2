"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { CATEGORIES, euros, cleMois, aujourdhui } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import Sheet from "@/components/Sheet";
import FicheProjet from "@/components/FicheProjet";

const REGLE = [
  { id: "besoin", label: "Besoins", cible: 50, couleur: "#3E9BFF" },
  { id: "envie", label: "Envies", cible: 30, couleur: "#FF9D5C" },
  { id: "epargne", label: "Épargne", cible: 20, couleur: "#2BB68C" },
];

function FicheBudget({ onFermer }) {
  const { budgets, sauverApp } = useBudget();
  const [locaux, setLocaux] = useState({ ...budgets });
  const cats = Object.entries(CATEGORIES).filter(([, c]) => c.type === "besoin" || c.type === "envie");

  const valider = async () => {
    const propres = Object.fromEntries(
      Object.entries(locaux)
        .map(([k, v]) => [k, parseFloat(String(v).replace(",", ".")) || 0])
        .filter(([, v]) => v > 0)
    );
    await sauverApp(propres, undefined);
    onFermer();
  };

  return (
    <Sheet titre="Définir mes budgets" onFermer={onFermer}>
      <p className="mb-3 text-sm text-sourdine">Fixe un plafond mensuel par catégorie. Laisse vide pour ne pas suivre.</p>
      <div className="max-h-[45dvh] space-y-2 overflow-y-auto pb-2">
        {cats.map(([id, c]) => (
          <label key={id} className="flex items-center justify-between gap-3 rounded-2xl bg-carte px-3 py-2.5 shadow-carte">
            <span className="text-sm font-medium">{c.icone} {c.label}</span>
            <span className="flex items-center gap-1">
              <input
                inputMode="decimal"
                placeholder="—"
                value={locaux[id] ?? ""}
                onChange={(e) => setLocaux({ ...locaux, [id]: e.target.value })}
                className="tnum w-20 rounded-xl border border-bordure px-2 py-1.5 text-right outline-none focus:border-menthe"
              />
              <span className="text-sm text-sourdine">€</span>
            </span>
          </label>
        ))}
      </div>
      <button onClick={valider} className="mt-3 w-full rounded-ios bg-encre py-3.5 font-semibold text-contraste">
        Enregistrer
      </button>
    </Sheet>
  );
}

export default function Budgets() {
  const { transactions, budgets, profil, projets } = useBudget();
  const [edition, setEdition] = useState(false);
  const [ficheProjet, setFicheProjet] = useState(null); // null | "nouveau" | projet
  const mois = cleMois(aujourdhui());
  const s = statsMois(transactions, mois);
  const revenu = s.revenus || profil.revenuMensuel || 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button onClick={() => setEdition(true)} className="rounded-pill bg-encre px-4 py-2 text-sm font-semibold text-contraste">
          Modifier
        </button>
      </header>

      {/* Règle 50/30/20 */}
      <section className="rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="font-semibold">Règle 50 / 30 / 20</h2>
        <p className="mb-3 text-xs text-sourdine">Part des revenus du mois consacrée à chaque poste.</p>
        {revenu === 0 ? (
          <p className="text-sm text-sourdine">Ajoute un revenu ce mois-ci (ou renseigne ton revenu mensuel dans les réglages) pour activer l'analyse.</p>
        ) : (
          <div className="space-y-3">
            {REGLE.map((r) => {
              const val = r.id === "epargne" ? Math.max(s.parType.epargne, revenu - s.depenses) : s.parType[r.id];
              const pct = Math.max(0, Math.round((val / revenu) * 100));
              return (
                <div key={r.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{r.label}</span>
                    <span className="tnum text-sourdine">{pct} % <span className="opacity-60">/ {r.cible} % visés</span></span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-voile">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: r.couleur }} />
                    <div className="absolute top-0 h-full w-0.5 bg-black/40" style={{ left: `${r.cible}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Budgets par catégorie */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sourdine">Plafonds par catégorie</h2>
        {Object.keys(budgets).length === 0 ? (
          <p className="rounded-ios bg-carte p-6 text-center text-sm text-sourdine shadow-carte">
            Aucun budget défini. Touche « Modifier » pour fixer tes plafonds mensuels.
          </p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(budgets).map(([cat, limite]) => {
              const c = CATEGORIES[cat] || CATEGORIES.autre;
              const reel = s.parCategorie[cat] || 0;
              const pct = limite > 0 ? (reel / limite) * 100 : 0;
              const couleur = pct >= 100 ? "#FF6B5E" : pct >= 80 ? "#F5B93E" : "#2BB68C";
              return (
                <li key={cat} className="rounded-ios bg-carte p-4 shadow-carte">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">{c.icone} {c.label}</span>
                    <span className="tnum text-sourdine">{euros(reel)} / {euros(limite)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-voile">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: couleur }} />
                  </div>
                  {pct >= 100 && <p className="mt-1.5 text-xs font-medium text-corail">Dépassé de {euros(reel - limite)}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Projets d'épargne */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Projets d'épargne</h2>
          <button onClick={() => setFicheProjet("nouveau")} className="text-sm font-medium text-ciel">+ Projet</button>
        </div>
        {projets.length === 0 ? (
          <button onClick={() => setFicheProjet("nouveau")} className="w-full rounded-ios border-2 border-dashed border-bordure p-5 text-center text-sm text-sourdine">
            Vacances, nouveau maillot vintage, PS5 Pro… crée ton premier objectif →
          </button>
        ) : (
          <ul className="space-y-2">
            {projets.map((p) => {
              const pct = p.objectif > 0 ? Math.min(100, (p.montantActuel / p.objectif) * 100) : 0;
              const atteint = pct >= 100;
              return (
                <li key={p.id}>
                  <button onClick={() => setFicheProjet(p)} className="w-full rounded-ios bg-carte p-4 text-left shadow-carte active:scale-[0.99] transition-transform">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{p.icone} {p.nom}{atteint ? " 🎉" : ""}</span>
                      <span className="tnum text-sm text-sourdine">{euros(p.montantActuel)} / {euros(p.objectif)}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-voile">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: atteint ? "#2BB68C" : "#8B7CF6" }} />
                    </div>
                    {p.echeance && !atteint && (
                      <p className="mt-1.5 text-xs text-sourdine">
                        Échéance : {new Date(p.echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {edition && <FicheBudget onFermer={() => setEdition(false)} />}
      {ficheProjet && <FicheProjet projet={ficheProjet === "nouveau" ? null : ficheProjet} onFermer={() => setFicheProjet(null)} />}
    </div>
  );
}
