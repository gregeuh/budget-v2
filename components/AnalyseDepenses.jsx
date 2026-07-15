"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, toutesCategories } from "@/lib/format";
import { analyserDepenses } from "@/lib/depenses";
import PointsSautillants from "./PointsSautillants";

export default function AnalyseDepenses() {
  const { transactions, recurrentes, modifierRecurrente, notifier } = useBudget();
  const [ouvert, setOuvert] = useState(false);
  const [auditIA, setAuditIA] = useState(null);
  const [chargeIA, setChargeIA] = useState(false);
  const [erreurIA, setErreurIA] = useState("");

  const analyse = useMemo(() => analyserDepenses(transactions, recurrentes), [transactions, recurrentes]);

  if (analyse.items.length === 0) return null;

  const couper = (recurrenteId, libelle) => {
    modifierRecurrente(recurrenteId, { actif: false });
    notifier(`« ${libelle} » mis en pause`, "✂️");
  };

  const lancerAudit = async () => {
    setChargeIA(true);
    setErreurIA("");
    try {
      const r = await fetch("/api/audit-depenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          depenses: analyse.items.map((i) => ({ libelle: i.libelle, mensuel: i.mensuel, categorie: i.categorie })),
          totalMensuel: analyse.totalMensuel,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreurIA(r.status === 503 ? "Clé API non configurée." : d.erreur || "L'audit a échoué.");
        return;
      }
      const data = await r.json();
      setAuditIA(data);
    } catch {
      setErreurIA("Connexion impossible.");
    } finally {
      setChargeIA(false);
    }
  };

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      {/* En-tête */}
      <button onClick={() => setOuvert(!ouvert)} className="flex w-full items-center gap-3 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-corail-pale text-xl">🔍</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Chasse aux dépenses</span>
          <span className="block text-xs text-sourdine">
            {analyse.abonnements.length} abonnements · {euros(analyse.totalAbonnements)}/mois
            {analyse.economieMax > 0 && ` · jusqu'à ${euros(analyse.economieMax)}/an à récupérer`}
          </span>
        </span>
        <span className={`text-sourdine/50 transition-transform ${ouvert ? "rotate-90" : ""}`}>›</span>
      </button>

      {ouvert && (
        <div className="fade-in mt-3 space-y-3 border-t border-bordure pt-3">
          {/* Poids total */}
          <div className="rounded-2xl bg-fond p-3 text-center">
            <p className="text-xs text-sourdine">Tes charges récurrentes pèsent</p>
            <p className="chiffres text-2xl font-bold">{euros(analyse.totalAnnuel)}<span className="text-sm font-medium text-sourdine"> / an</span></p>
          </div>

          {/* Pistes d'économie */}
          {analyse.pistes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">Pistes d'économie</p>
              {analyse.pistes.map((p, i) => (
                <div key={i} className="rounded-2xl bg-menthe-pale p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-menthe-texte">{p.icone} {p.titre}</span>
                    <span className="tnum shrink-0 text-sm font-bold text-menthe-texte">−{euros(p.economieAnnuelle)}/an</span>
                  </div>
                  <p className="mt-0.5 text-xs text-menthe-texte/80">{p.detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Liste des abonnements, coupables en un tap */}
          {analyse.abonnements.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">Tes abonnements</p>
              <ul className="space-y-1.5">
                {analyse.abonnements.map((a, i) => (
                  <li key={i} className="flex items-center gap-2.5 rounded-2xl bg-fond px-3 py-2">
                    <span className="text-lg">{a.abonnement.icone}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.libelle}</span>
                      <span className="block text-[11px] text-sourdine">{euros(a.annuel)}/an</span>
                    </span>
                    <span className="tnum shrink-0 text-sm font-semibold">{euros(a.mensuel)}<span className="text-xs text-sourdine">/m</span></span>
                    {a.recurrenteId && (
                      <button
                        onClick={() => couper(a.recurrenteId, a.libelle)}
                        className="shrink-0 rounded-pill bg-corail-pale px-2.5 py-1 text-[11px] font-semibold text-corail-texte"
                      >
                        ✂️ Couper
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-sourdine">« Couper » met l'abonnement en pause (récupérable dans Réglages → Récurrentes).</p>
            </div>
          )}

          {/* Audit IA */}
          <div>
            <button
              onClick={lancerAudit}
              disabled={chargeIA}
              className="flex w-full items-center justify-center gap-2 rounded-ios bg-lavande-pale py-2.5 text-sm font-semibold text-lavande-texte disabled:opacity-60"
            >
              {chargeIA ? (
                <>
                  <PointsSautillants taille={5} couleur="var(--lavande-texte)" />
                  <span>Audit en cours</span>
                </>
              ) : (
                <span>✨ Audit détaillé par l'IA</span>
              )}
            </button>
            {erreurIA && <p className="mt-1 text-xs text-corail">{erreurIA}</p>}
            {auditIA && (
              <div className="mt-2 space-y-2">
                {auditIA.resume && <p className="rounded-2xl bg-ciel-pale px-3 py-2 text-xs text-ciel-texte">💡 {auditIA.resume}</p>}
                {(auditIA.suggestions || []).map((s, i) => (
                  <div key={i} className="rounded-2xl bg-fond p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{s.titre}</span>
                      {s.economieAnnuelle > 0 && <span className="tnum shrink-0 text-xs font-bold text-menthe">−{euros(s.economieAnnuelle)}/an</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-sourdine">{s.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
