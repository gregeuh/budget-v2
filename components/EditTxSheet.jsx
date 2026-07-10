"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import Sheet from "./Sheet";

export default function EditTxSheet({ tx, onFermer }) {
  const { comptes, categories, modifierTransaction, supprimerTransaction } = useBudget();
  const [montant, setMontant] = useState(String(Math.abs(tx.montant)).replace(".", ","));
  const [sens, setSens] = useState(tx.montant < 0 ? "depense" : "revenu");
  const [libelle, setLibelle] = useState(tx.libelle || "");
  const [categorie, setCategorie] = useState(tx.categorie);
  const [compteId, setCompteId] = useState(tx.compteId);
  const [date, setDate] = useState(tx.date);
  const [horsSolde, setHorsSolde] = useState(Boolean(tx.horsSolde));
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);

  const estVirement = Boolean(tx.versId);
  const [versId, setVersId] = useState(tx.versId || "");
  const cats = Object.entries(categories).filter(([, c]) =>
    estVirement ? c.type === "virement" : sens === "revenu" ? c.type === "revenu" : c.type !== "revenu" && c.type !== "virement"
  );

  const valider = async () => {
    const val = parseFloat(String(montant).replace(",", "."));
    if (!val || val <= 0) return;
    await modifierTransaction(tx.id, {
      montant: estVirement ? Math.abs(val) : sens === "depense" ? -val : val,
      libelle: libelle.trim() || (categories[categorie]?.label ?? "Opération"),
      categorie,
      compteId,
      ...(estVirement ? { versId } : {}),
      date,
      horsSolde: horsSolde || false,
    });
    onFermer();
  };

  return (
    <Sheet titre="Modifier l'opération" onFermer={onFermer}>
      <div className="space-y-3">
        {!estVirement && (
          <div className="grid grid-cols-2 rounded-pill bg-voile p-1">
            {[["depense", "Dépense"], ["revenu", "Revenu"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSens(id)}
                className={`rounded-pill py-2 text-sm font-semibold transition-colors ${sens === id ? "bg-carte shadow-carte" : "text-sourdine"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-center gap-1">
          <input
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className={`tnum w-40 bg-transparent text-center text-3xl font-bold outline-none ${estVirement ? "text-encre" : sens === "depense" ? "text-corail" : "text-menthe"}`}
          />
          <span className="text-2xl font-semibold text-sourdine">€</span>
        </div>

        <input
          placeholder="Libellé"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className="w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe"
        />

        {!estVirement && (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
            {cats.map(([id, c]) => (
              <button
                key={id}
                onClick={() => setCategorie(id)}
                className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium ${categorie === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}
              >
                {c.icone} {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">{estVirement ? "Depuis" : "Compte"}</span>
            <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
          {estVirement ? (
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
        {estVirement && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none" />
          </label>
        )}

        {!estVirement && (
          <button
            onClick={() => setHorsSolde(!horsSolde)}
            className={`flex w-full items-center justify-between rounded-ios border px-3.5 py-2.5 text-sm font-semibold ${horsSolde ? "border-menthe bg-menthe-pale" : "border-bordure bg-carte"}`}
          >
            👻 Hors solde
            <span className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${horsSolde ? "bg-menthe" : "bg-voile"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${horsSolde ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </span>
          </button>
        )}

        <button onClick={valider} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste active:scale-[0.99] transition-transform">
          Enregistrer
        </button>
        <button
          onClick={async () => {
            if (!confirmeSuppr) return setConfirmeSuppr(true);
            await supprimerTransaction(tx.id);
            onFermer();
          }}
          className={`w-full rounded-ios py-3 text-sm font-semibold ${confirmeSuppr ? "bg-corail text-white" : "text-corail"}`}
        >
          {confirmeSuppr ? "Confirmer la suppression" : "Supprimer"}
        </button>
      </div>
    </Sheet>
  );
}
