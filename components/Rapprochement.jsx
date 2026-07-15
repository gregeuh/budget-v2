"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, dateCourte, toutesCategories } from "@/lib/format";
import { rapprocher, impactSolde } from "@/lib/rapprochement";

const STATUTS = {
  probable: { emoji: "🔗", label: "À fusionner", couleur: "bg-ciel-pale text-ciel-texte" },
  incertain: { emoji: "⚠️", label: "À vérifier", couleur: "bg-beurre-pale text-beurre-texte" },
  nouvelle: { emoji: "✅", label: "Nouvelle", couleur: "bg-menthe-pale text-menthe-texte" },
  importee: { emoji: "⏭️", label: "Déjà importée", couleur: "bg-voile text-sourdine" },
};

export default function Rapprochement({ lignes, compteId, soldeActuel, onValider, onRetour, enCours }) {
  const { transactions, comptes } = useBudget();
  const compte = comptes.find((c) => c.id === compteId);

  const initial = useMemo(() => rapprocher(lignes, transactions, compteId), [lignes, transactions, compteId]);
  const [decisions, setDecisions] = useState(initial);
  const [deplie, setDeplie] = useState(null);

  const choisir = (index, action, txId = null) => {
    setDecisions((l) => l.map((d) => (d.index === index ? { ...d, choix: { action, txId } } : d)));
  };

  const compte_ = (statut) => decisions.filter((d) => d.statut === statut).length;
  const aAjouter = decisions.filter((d) => d.choix.action === "ajouter").length;
  const aFusionner = decisions.filter((d) => d.choix.action === "fusionner").length;
  const aVerifier = decisions.filter((d) => d.choix.action === "verifier").length;
  const delta = impactSolde(decisions);

  return (
    <div className="space-y-3">
      {/* Récapitulatif */}
      <div className="rounded-ios bg-carte p-3.5 shadow-carte">
        <p className="text-sm font-semibold">Rapprochement avec tes opérations</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {compte_("nouvelle") > 0 && <span className="rounded-pill bg-menthe-pale px-2 py-1 font-medium text-menthe-texte">✅ {compte_("nouvelle")} nouvelle{compte_("nouvelle") > 1 ? "s" : ""}</span>}
          {compte_("probable") > 0 && <span className="rounded-pill bg-ciel-pale px-2 py-1 font-medium text-ciel-texte">🔗 {compte_("probable")} à fusionner</span>}
          {compte_("incertain") > 0 && <span className="rounded-pill bg-beurre-pale px-2 py-1 font-medium text-beurre-texte">⚠️ {compte_("incertain")} à vérifier</span>}
          {compte_("importee") > 0 && <span className="rounded-pill bg-voile px-2 py-1 font-medium text-sourdine">⏭️ {compte_("importee")} déjà là</span>}
        </div>

        {/* Impact prévisionnel */}
        <div className="mt-3 rounded-2xl bg-fond p-2.5">
          <p className="text-xs text-sourdine">Solde de {compte?.nom || "ce compte"} après import</p>
          <p className="tnum mt-0.5 text-sm">
            <span className="text-sourdine">{euros(soldeActuel)}</span>
            <span className="mx-1.5 text-sourdine">→</span>
            <span className={`text-lg font-bold ${soldeActuel + delta < 0 ? "text-corail" : ""}`}>{euros(soldeActuel + delta)}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-sourdine">
            {aAjouter} ajout{aAjouter > 1 ? "s" : ""} ({euros(delta)}) · {aFusionner} fusion{aFusionner > 1 ? "s" : ""} (sans impact)
            {aVerifier > 0 && ` · ${aVerifier} en attente`}
          </p>
        </div>

        {aVerifier > 0 && (
          <p className="mt-2 text-xs text-beurre-texte">
            ⚠️ {aVerifier} ligne{aVerifier > 1 ? "s" : ""} à trancher ci-dessous — elle{aVerifier > 1 ? "s ne seront" : " ne sera"} pas importée{aVerifier > 1 ? "s" : ""} tant que tu n&apos;auras pas choisi.
          </p>
        )}
      </div>

      {/* Les lignes */}
      <ul className="space-y-2">
        {decisions.map((d) => {
          const st = STATUTS[d.statut];
          const candidat = d.candidats.find((c) => c.tx.id === d.choix.txId) || d.candidats[0];
          const ouvert = deplie === d.index;
          const cat = toutesCategories[d.ligne.categorie] || toutesCategories.autre;

          return (
            <li key={d.index} className={`overflow-hidden rounded-2xl bg-carte shadow-carte ${d.choix.action === "ignorer" ? "opacity-50" : ""}`}>
              {/* Ligne du relevé */}
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <span className={`flex h-7 shrink-0 items-center rounded-pill px-2 text-[11px] font-semibold ${st.couleur}`}>
                  {st.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{d.ligne.libelle}</span>
                  <span className="block text-[11px] text-sourdine">
                    {dateCourte(d.ligne.date)} · {cat.icone} {cat.label}
                  </span>
                </span>
                <span className={`tnum shrink-0 text-sm font-bold ${d.ligne.montant > 0 ? "text-menthe" : ""}`}>
                  {euros(d.ligne.montant, { precis: true })}
                </span>
              </div>

              {/* Correspondance trouvée */}
              {candidat && d.statut !== "nouvelle" && (
                <div className="border-t border-bordure bg-fond px-3 py-2">
                  <p className="text-[11px] text-sourdine">↳ ressemble à ton opération :</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {(toutesCategories[candidat.tx.categorie] || toutesCategories.autre).icone} {candidat.tx.libelle || "Sans libellé"}
                      </span>
                      <span className="block text-[11px] text-sourdine">
                        {dateCourte(candidat.tx.date)} · {candidat.raison}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-sm font-semibold">{euros(candidat.tx.montant, { precis: true })}</span>
                  </div>

                  {/* Plusieurs candidats : choisir lequel */}
                  {d.candidats.length > 1 && (
                    <button onClick={() => setDeplie(ouvert ? null : d.index)} className="mt-1.5 text-[11px] font-semibold text-ciel">
                      {ouvert ? "Masquer" : `Voir les ${d.candidats.length} correspondances possibles`}
                    </button>
                  )}
                  {ouvert && (
                    <ul className="mt-1.5 space-y-1">
                      {d.candidats.map((c) => (
                        <li key={c.tx.id}>
                          <button
                            onClick={() => choisir(d.index, "fusionner", c.tx.id)}
                            className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs ${d.choix.txId === c.tx.id ? "bg-ciel-pale text-ciel-texte" : "bg-carte"}`}
                          >
                            <span className="min-w-0 flex-1 truncate">{c.tx.libelle} · {dateCourte(c.tx.date)}</span>
                            <span className="tnum shrink-0 font-semibold">{euros(c.tx.montant, { precis: true })}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Les 3 actions */}
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[
                      ["fusionner", "🔗 Fusionner", candidat.tx.id],
                      ["ajouter", "➕ Garder les deux", null],
                      ["ignorer", "⏭️ Ignorer", null],
                    ].map(([action, label, txId]) => (
                      <button
                        key={action}
                        onClick={() => choisir(d.index, action, txId)}
                        className={`truncate rounded-pill px-2 py-1.5 text-[11px] font-semibold ${
                          d.choix.action === action ? "bg-encre text-contraste" : "bg-carte text-sourdine ring-1 ring-bordure"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {d.choix.action === "fusionner" && (
                    <p className="mt-1.5 text-[11px] text-ciel-texte">
                      Ta ligne est conservée (catégorie, budget) et prend le libellé de la banque. Aucun impact sur le solde.
                    </p>
                  )}
                </div>
              )}

              {/* Nouvelle : simple bascule */}
              {d.statut === "nouvelle" && (
                <div className="border-t border-bordure bg-fond px-3 py-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[["ajouter", "✅ Ajouter"], ["ignorer", "⏭️ Ignorer"]].map(([action, label]) => (
                      <button
                        key={action}
                        onClick={() => choisir(d.index, action)}
                        className={`rounded-pill px-2 py-1.5 text-[11px] font-semibold ${
                          d.choix.action === action ? "bg-encre text-contraste" : "bg-carte text-sourdine ring-1 ring-bordure"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        onClick={() => onValider(decisions)}
        disabled={enCours || (aAjouter === 0 && aFusionner === 0)}
        className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40"
      >
        {enCours ? "Import en cours…" : `Importer (${aAjouter} ajout${aAjouter > 1 ? "s" : ""}, ${aFusionner} fusion${aFusionner > 1 ? "s" : ""})`}
      </button>
      <button onClick={onRetour} className="w-full py-2 text-sm font-medium text-sourdine">‹ Retour</button>
    </div>
  );
}
