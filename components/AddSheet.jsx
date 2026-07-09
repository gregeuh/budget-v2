"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { CATEGORIES, FREQUENCES, aujourdhui } from "@/lib/format";
import Sheet from "./Sheet";

const MODES = [
  { id: "depense", label: "Dépense" },
  { id: "revenu", label: "Revenu" },
  { id: "virement", label: "Virement" },
];

export default function AddSheet({ onFermer }) {
  const { comptes, ajouterTransaction, ajouterRecurrente, virement } = useBudget();
  const [mode, setMode] = useState("depense");
  const [montant, setMontant] = useState("");
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("courses");
  const [compteId, setCompteId] = useState(comptes[0]?.id || "");
  const [versId, setVersId] = useState(comptes[1]?.id || "");
  const [date, setDate] = useState(aujourdhui());
  const [frequence, setFrequence] = useState("unefois");
  const [horsSolde, setHorsSolde] = useState(false);

  const cats = Object.entries(CATEGORIES).filter(([, c]) =>
    mode === "revenu" ? c.type === "revenu" : c.type !== "revenu" && c.type !== "virement"
  );

  const valider = async () => {
    const val = parseFloat(String(montant).replace(",", "."));
    if (!val || val <= 0 || !compteId) return;
    if (mode === "virement") {
      if (!versId || versId === compteId) return;
      await virement(compteId, versId, val, date);
    } else {
      const base = {
        compteId,
        montant: mode === "depense" ? -val : val,
        categorie,
        libelle: libelle.trim() || (CATEGORIES[categorie]?.label ?? "Opération"),
        ...(horsSolde ? { horsSolde: true } : {}),
      };
      if (frequence === "unefois") {
        await ajouterTransaction({ ...base, date });
      } else {
        // Crée la règle : les occurrences échues (dont celle du jour) sont postées automatiquement
        await ajouterRecurrente({ ...base, frequence, prochaine: date });
      }
    }
    onFermer();
  };

  return (
    <Sheet titre="Nouvelle opération" onFermer={onFermer}>
      {/* Sélecteur de mode */}
      <div className="mb-5 grid grid-cols-3 rounded-pill bg-voile p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); if (m.id === "revenu") setCategorie("salaire"); else setCategorie("courses"); }}
            className={`rounded-pill py-2 text-sm font-semibold transition-colors ${mode === m.id ? "bg-carte shadow-carte" : "text-sourdine"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Montant */}
      <div className="mb-4 flex items-baseline justify-center gap-1">
        <input
          autoFocus
          inputMode="decimal"
          placeholder="0"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className={`tnum w-40 bg-transparent text-center text-5xl font-bold outline-none placeholder:text-sourdine placeholder:opacity-50 ${mode === "depense" ? "text-corail" : mode === "revenu" ? "text-menthe" : "text-encre"}`}
        />
        <span className="text-3xl font-semibold text-sourdine">€</span>
      </div>

      <div className="space-y-3">
        {mode !== "virement" && (
          <>
            <input
              placeholder="Libellé (ex : Carrefour, Loyer…)"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              className="w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe"
            />
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
              {cats.map(([id, c]) => (
                <button
                  key={id}
                  onClick={() => setCategorie(id)}
                  className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium ${categorie === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte text-encre"}`}
                >
                  {c.icone} {c.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">{mode === "virement" ? "Depuis" : "Compte"}</span>
            <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
          {mode === "virement" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Vers</span>
              <select value={versId} onChange={(e) => setVersId(e.target.value)} className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
                {comptes.filter((c) => c.id !== compteId).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none" />
            </label>
          )}
        </div>

        {comptes.length === 0 && (
          <p className="text-center text-sm text-sourdine">Crée d'abord un compte dans l'onglet Comptes.</p>
        )}

        {mode !== "virement" && (
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Répéter</span>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {[["unefois", "Une seule fois"], ...Object.entries(FREQUENCES).map(([id, f]) => [id, f.label])].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFrequence(id)}
                  className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium ${frequence === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {frequence !== "unefois" && (
              <p className="mt-1.5 text-xs text-sourdine">
                🔁 Sera ajoutée automatiquement {FREQUENCES[frequence].label.toLowerCase()} à partir du {new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. Gérable depuis Profil → Récurrentes.
              </p>
            )}
          </div>
        )}

        {mode !== "virement" && (
          <button
            onClick={() => setHorsSolde(!horsSolde)}
            className={`flex w-full items-center justify-between rounded-ios border p-3.5 text-left transition-colors ${horsSolde ? "border-menthe bg-menthe-pale" : "border-bordure bg-carte"}`}
          >
            <span>
              <span className="block text-sm font-semibold">👻 Hors solde</span>
              <span className="block text-xs text-sourdine">Comptée dans les statistiques et budgets, mais sans modifier le solde du compte (espèces, dépense déjà réajustée…)</span>
            </span>
            <span className={`relative ml-3 h-7 w-12 shrink-0 rounded-full transition-colors ${horsSolde ? "bg-menthe" : "bg-voile"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${horsSolde ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </span>
          </button>
        )}

        <button
          onClick={valider}
          disabled={!montant || !compteId || (mode === "virement" && (!versId || versId === compteId))}
          className="w-full rounded-ios bg-encre py-3.5 font-semibold text-contraste disabled:opacity-40 active:scale-[0.99] transition-transform"
        >
          Ajouter
        </button>
      </div>
    </Sheet>
  );
}
