"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import Sheet from "./Sheet";

// Nombre de mensualités restantes (formule d'amortissement si taux fourni)
export function mensualitesRestantes(restant, mensualite, tauxAnnuel) {
  if (!restant || !mensualite || mensualite <= 0) return null;
  const r = (tauxAnnuel || 0) / 100 / 12;
  if (r === 0) return Math.ceil(restant / mensualite);
  if (mensualite <= restant * r) return null; // mensualité trop faible, dette infinie
  return Math.ceil(-Math.log(1 - (r * restant) / mensualite) / Math.log(1 + r));
}

export default function FicheCredit({ credit, onFermer }) {
  const { ajouterCredit, modifierCredit, supprimerCredit } = useBudget();
  const edition = Boolean(credit);
  const [nom, setNom] = useState(credit?.nom || "");
  const [restant, setRestant] = useState(credit ? String(credit.restant) : "");
  const [mensualite, setMensualite] = useState(credit ? String(credit.mensualite) : "");
  const [taux, setTaux] = useState(credit?.taux ? String(credit.taux) : "");
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);

  const num = (v) => parseFloat(String(v).replace(",", ".")) || 0;
  const apercu = mensualitesRestantes(num(restant), num(mensualite), num(taux));

  const valider = async () => {
    const donnees = {
      nom: nom.trim() || "Crédit",
      restant: num(restant),
      mensualite: num(mensualite),
      taux: num(taux),
    };
    if (edition) await modifierCredit(credit.id, donnees);
    else await ajouterCredit(donnees);
    onFermer();
  };

  return (
    <Sheet titre={edition ? "Modifier le crédit" : "Nouveau crédit"} onFermer={onFermer}>
      <div className="space-y-3">
        <input
          placeholder="Nom (ex : Prêt auto, Crédit conso…)"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Restant dû (€)</span>
            <input inputMode="decimal" placeholder="8500" value={restant} onChange={(e) => setRestant(e.target.value)}
              className="tnum w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none focus:border-menthe" />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Mensualité (€)</span>
            <input inputMode="decimal" placeholder="220" value={mensualite} onChange={(e) => setMensualite(e.target.value)}
              className="tnum w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none focus:border-menthe" />
          </label>
        </div>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Taux annuel % (option, pour affiner la durée)</span>
          <input inputMode="decimal" placeholder="4,5" value={taux} onChange={(e) => setTaux(e.target.value)}
            className="tnum w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none focus:border-menthe" />
        </label>
        {apercu !== null && num(restant) > 0 && (
          <p className="rounded-2xl bg-marque-pale px-3 py-2 text-sm text-marque-texte">
            ≈ {apercu} mensualité{apercu > 1 ? "s" : ""} restante{apercu > 1 ? "s" : ""}, fin estimée{" "}
            {new Date(Date.now() + apercu * 30.44 * 86400000).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        )}
        {apercu === null && num(restant) > 0 && num(mensualite) > 0 && (
          <p className="rounded-2xl bg-corail-pale px-3 py-2 text-sm text-corail-texte">
            ⚠️ Avec ce taux, la mensualité couvre à peine les intérêts : le crédit ne se rembourse pas.
          </p>
        )}
        <button onClick={valider} disabled={!num(restant) || !num(mensualite)} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-40">
          {edition ? "Enregistrer" : "Ajouter le crédit"}
        </button>
        {edition && (
          <button
            onClick={async () => {
              if (!confirmeSuppr) return setConfirmeSuppr(true);
              await supprimerCredit(credit.id);
              onFermer();
            }}
            className={`w-full rounded-ios py-3 text-sm font-semibold ${confirmeSuppr ? "bg-corail text-white" : "text-corail"}`}
          >
            {confirmeSuppr ? "Confirmer la suppression" : "Supprimer ce crédit"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
