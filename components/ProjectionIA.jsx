"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";
import { resumePourCoach } from "@/lib/conseils";
import { calculerProjection } from "@/lib/projection";
import PointsSautillants from "./PointsSautillants";

const COULEURS = {
  vert: { fond: "bg-menthe-pale", texte: "text-menthe-texte", emoji: "🟢" },
  orange: { fond: "bg-beurre-pale", texte: "text-beurre-texte", emoji: "🟡" },
  rouge: { fond: "bg-corail-pale", texte: "text-corail-texte", emoji: "🔴" },
};

export default function ProjectionIA() {
  const budget = useBudget();
  const { comptes, transactions, soldes, budgets, profil, credits, projets, recurrentes, categories } = budget;
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");

  // Pas de projection utile sans salaire configuré ni historique
  const pretPourProjection = profil?.jourSalaire >= 1 && transactions.length >= 5;

  const lancer = async () => {
    setChargement(true);
    setErreur("");
    try {
      const resume = resumePourCoach({ comptes, transactions, soldes, budgets, profil, credits, projets, recurrentes, categories });
      const projection = calculerProjection({ comptes, soldes, transactions, recurrentes, profil });
      const r = await fetch("/api/projection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resume,
          projection: {
            reste: Math.round(projection.reste),
            parJour: Math.round(projection.parJour * 100) / 100,
            jours: projection.jours,
            prevu: Math.round(projection.prevu),
            attendu: Math.round(projection.attendu),
          },
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreur(r.status === 503 ? "Active l'IA (clé API) pour la projection." : d.erreur || "La projection a échoué.");
        return;
      }
      setResultat(await r.json());
    } catch {
      setErreur("Connexion impossible.");
    } finally {
      setChargement(false);
    }
  };

  if (!pretPourProjection) return null;

  const coul = resultat ? COULEURS[resultat.verdict] || COULEURS.orange : null;

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      {!resultat ? (
        <button onClick={lancer} disabled={chargement} className="flex w-full items-center gap-3 text-left disabled:opacity-60">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavande-pale text-xl">🔮</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Projection intelligente</span>
            <span className="block text-xs text-sourdine">
              {chargement ? "L'IA analyse ta fin de mois…" : "Comment vais-je finir le mois ? Demande à l'IA"}
            </span>
          </span>
          {chargement ? <PointsSautillants taille={5} /> : <span className="text-sourdine/50">›</span>}
        </button>
      ) : (
        <div className="fade-in space-y-3">
          {/* Verdict + estimation */}
          <div className={`rounded-2xl ${coul.fond} p-3.5`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{coul.emoji}</span>
              <span className={`text-sm font-bold ${coul.texte}`}>{resultat.phrase}</span>
            </div>
            {resultat.finMois?.estimation !== undefined && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`chiffres text-2xl font-bold ${coul.texte}`}>
                  {resultat.finMois.estimation >= 0 ? "+" : ""}{euros(resultat.finMois.estimation)}
                </span>
                <span className={`text-xs ${coul.texte} opacity-80`}>
                  fin de mois estimée · confiance {resultat.finMois.confiance}
                </span>
              </div>
            )}
          </div>

          {/* Alertes anticipées */}
          {resultat.alertes?.length > 0 && (
            <ul className="space-y-1.5">
              {resultat.alertes.map((a, i) => (
                <li key={i} className="flex gap-2 rounded-2xl bg-fond px-3 py-2 text-xs">
                  <span className="shrink-0">{a.icone}</span>
                  <span>{a.texte}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Projets */}
          {resultat.projets?.length > 0 && (
            <div className="space-y-1.5">
              {resultat.projets.map((p, i) => (
                <div key={i} className="rounded-2xl bg-lavande-pale px-3 py-2 text-xs text-lavande-texte">
                  🎯 <strong>{p.nom}</strong> — {p.phrase}
                </div>
              ))}
            </div>
          )}

          {/* Conseil */}
          {resultat.conseil && (
            <p className="rounded-2xl bg-ciel-pale px-3 py-2 text-xs text-ciel-texte">💡 {resultat.conseil}</p>
          )}

          <button onClick={() => setResultat(null)} className="w-full text-xs font-medium text-sourdine">
            Actualiser la projection
          </button>
        </div>
      )}
      {erreur && <p className="mt-2 text-xs text-corail">{erreur}</p>}
    </div>
  );
}
