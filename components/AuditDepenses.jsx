"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, toutesCategories } from "@/lib/format";
import { auditerDepenses } from "@/lib/audit";
import Sheet from "./Sheet";
import PointsSautillants from "./PointsSautillants";

const PRIORITE = {
  haute: { label: "Priorité", couleur: "bg-corail-pale text-corail-texte" },
  moyenne: { label: "À voir", couleur: "bg-beurre-pale text-beurre-texte" },
  basse: { label: "Bonus", couleur: "bg-voile text-sourdine" },
};

export default function AuditDepenses({ onFermer }) {
  const { transactions, recurrentes, profil } = useBudget();

  const audit = useMemo(
    () => auditerDepenses({ transactions, recurrentes }, { revenuMensuel: profil.revenuMensuel || 0 }),
    [transactions, recurrentes, profil]
  );

  const [recos, setRecos] = useState(null);
  const [resume, setResume] = useState("");
  const [analyse, setAnalyse] = useState(false);
  const [erreur, setErreur] = useState("");

  const lancerIA = async () => {
    setAnalyse(true);
    setErreur("");
    try {
      const r = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          audit: {
            totalMensuel: audit.totalMensuel,
            totalAnnuel: audit.totalAnnuel,
            items: audit.items.map((it) => ({
              libelle: it.libelle,
              montantMensuel: it.montantMensuel,
              famille: it.famille?.label || null,
              dormant: it.dormant || false,
            })),
            doublons: audit.doublons.map((d) => ({ famille: d.famille.label, services: d.items.map((x) => x.libelle), total: d.total })),
          },
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreur(r.status === 503 ? "Clé API non configurée sur Vercel." : d.erreur || "L'analyse a échoué.");
        return;
      }
      const data = await r.json();
      setRecos(data.recommandations || []);
      setResume(data.resume || "");
    } catch {
      setErreur("Connexion impossible.");
    } finally {
      setAnalyse(false);
    }
  };

  if (audit.items.length === 0) {
    return (
      <Sheet titre="Audit des abonnements" onFermer={onFermer}>
        <p className="rounded-ios bg-carte p-5 text-center text-sm text-sourdine shadow-carte">
          Aucun abonnement récurrent détecté pour l&apos;instant. Importe ton relevé bancaire (au moins 2 mois) : l&apos;app repèrera automatiquement tout ce qui te prélève chaque mois.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet titre="Audit des abonnements" onFermer={onFermer}>
      <div className="space-y-3">
        {/* Total */}
        <div className="rounded-ios p-4 text-center" style={{ background: "linear-gradient(135deg, #141A2B, #3A34A8)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Tes dépenses récurrentes</p>
          <p className="chiffres mt-1 text-3xl font-bold text-white">{euros(audit.totalMensuel)}<span className="text-lg font-medium text-white/60"> /mois</span></p>
          <p className="mt-0.5 text-sm text-white/70">
            soit {euros(audit.totalAnnuel)} par an
            {audit.partRevenu != null && ` · ${Math.round(audit.partRevenu * 100)} % de tes revenus`}
          </p>
        </div>

        {/* Économie potentielle */}
        {audit.economiePotentielle > 0 && (
          <div className="rounded-ios bg-menthe-pale p-3.5">
            <p className="text-sm font-bold text-menthe-texte">💰 Jusqu&apos;à {euros(audit.economieAnnuelle)}/an d&apos;économie possible</p>
            <p className="mt-0.5 text-xs text-menthe-texte/80">
              En traitant les doublons et abonnements dormants ci-dessous.
            </p>
          </div>
        )}

        {/* Doublons */}
        {audit.doublons.map((d) => (
          <div key={d.famille.cle} className="rounded-ios bg-beurre-pale p-3.5">
            <p className="text-sm font-semibold text-beurre-texte">⚠️ {d.items.length} abonnements « {d.famille.label} »</p>
            <p className="mt-0.5 text-xs text-beurre-texte/80">
              {d.items.map((x) => x.libelle).join(", ")} — {euros(d.total)}/mois au total. En garder un seul économiserait le reste.
            </p>
          </div>
        ))}

        {/* Liste des abonnements */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sourdine">Le détail ({audit.items.length})</p>
          <ul className="space-y-2">
            {audit.items.map((it, i) => {
              const cat = toutesCategories[it.categorie] || toutesCategories.autre;
              return (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-carte px-3 py-2.5 shadow-carte">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fond text-lg">{cat.icone}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {it.libelle}
                      {it.dormant && <span className="ml-1.5 rounded-pill bg-voile px-1.5 py-0.5 align-middle text-[10px] font-medium text-sourdine">💤 plus prélevé</span>}
                      {it.famille && <span className="ml-1.5 rounded-pill bg-lavande-pale px-1.5 py-0.5 align-middle text-[10px] font-medium text-lavande-texte">{it.famille.label}</span>}
                    </span>
                    <span className="block text-[11px] text-sourdine">
                      {euros(it.montantMensuel * 12)}/an{it.variable ? " · variable" : ""}
                    </span>
                  </span>
                  <span className="chiffres shrink-0 text-sm font-bold">{euros(it.montantMensuel)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Recommandations IA */}
        {recos ? (
          <div className="space-y-2">
            {resume && <p className="rounded-ios bg-ciel-pale px-3.5 py-2.5 text-sm text-ciel-texte">✨ {resume}</p>}
            {recos.map((r, i) => {
              const p = PRIORITE[r.priorite] || PRIORITE.moyenne;
              return (
                <div key={i} className="rounded-ios bg-carte p-3.5 shadow-carte">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold">{r.titre}</p>
                    <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-semibold ${p.couleur}`}>{p.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-sourdine">{r.detail}</p>
                  {r.economieAnnuelle > 0 && (
                    <p className="mt-1.5 text-xs font-semibold text-menthe-texte">💰 ~{euros(r.economieAnnuelle)}/an</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <button
            onClick={lancerIA}
            disabled={analyse}
            className="flex w-full items-center justify-center gap-2 rounded-ios bg-lavande-pale py-3 text-sm font-semibold text-lavande-texte disabled:opacity-60"
          >
            {analyse ? (
              <>
                <PointsSautillants taille={5} couleur="var(--lavande-texte)" />
                <span>Analyse en cours</span>
              </>
            ) : (
              <span>✨ Recommandations personnalisées (IA)</span>
            )}
          </button>
        )}
        {erreur && <p className="text-center text-xs text-corail">{erreur}</p>}

        <p className="px-2 text-center text-[11px] text-sourdine">
          L&apos;app repère les prélèvements réguliers mais ne peut pas résilier à ta place — elle te dit quoi regarder, tu gardes la main.
        </p>
      </div>
    </Sheet>
  );
}
