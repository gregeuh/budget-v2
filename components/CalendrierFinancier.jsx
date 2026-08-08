import { useMemo } from "react";
import { euros, dateCourte } from "@/lib/format";

export default function CalendrierFinancier({ projection, categories = {} }) {
  const etapes = useMemo(() => {
    const soldeInitial = projection.dispo || 0;
    let solde = soldeInitial;
    return (projection.aVenir || []).slice(0, 8).map((operation) => {
      let impact = operation.montant || 0;
      if (operation.versId) impact = 0;
      solde += impact;
      return { ...operation, impact, solde };
    });
  }, [projection]);

  if (!etapes.length) return null;
  return <section className="space-y-2">
    <div className="flex items-end justify-between px-1"><div><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Calendrier financier</h2><p className="mt-0.5 text-xs text-ui-text-secondary">Ton solde projeté après chaque échéance.</p></div><span className="rounded-pill bg-marque-pale px-2 py-1 text-[11px] font-semibold text-marque-texte">Jusqu’à la paie</span></div>
    <div className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft">
      <div className="flex items-center justify-between border-b border-ui-hairline px-4 py-3 text-xs"><span className="text-sourdine">Disponible aujourd’hui</span><strong className="tnum">{euros(projection.dispo)}</strong></div>
      <ol>
        {etapes.map((t, index) => {
          const cat = categories[t.categorie] || categories.autre || {};
          return <li key={`${t.id}-${index}`} className={`flex items-center gap-3 px-4 py-3 ${index ? "border-t border-ui-hairline" : ""}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.impact < 0 ? "bg-corail-pale" : "bg-menthe-pale"}`}>{cat.icone || "🗓️"}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{t.libelle || "Échéance"}</span><span className="block text-xs text-sourdine">{dateCourte(t.date)}{t.virtuel ? " · prévu" : " · programmé"}</span></span>
            <span className="text-right"><span className={`tnum block text-sm font-bold ${t.impact < 0 ? "text-corail" : "text-menthe"}`}>{t.impact >= 0 ? "+" : ""}{euros(t.impact)}</span><span className={`tnum block text-[11px] ${t.solde < 0 ? "text-corail" : "text-sourdine"}`}>solde {euros(t.solde)}</span></span>
          </li>;
        })}
      </ol>
    </div>
  </section>;
}
