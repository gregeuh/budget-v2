import { useMemo } from "react";
import { euros } from "@/lib/format";

export default function VariationsActionnables({ actuel, precedent, categories = {} }) {
  const variations = useMemo(() => {
    const ids = new Set([...Object.keys(actuel.parCategorie || {}), ...Object.keys(precedent.parCategorie || {})]);
    return [...ids].map((id) => {
      const maintenant = actuel.parCategorie?.[id] || 0;
      const avant = precedent.parCategorie?.[id] || 0;
      return { id, maintenant, avant, delta: maintenant - avant, categorie: categories[id] || categories.autre || {} };
    }).filter((v) => v.maintenant || v.avant).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  }, [actuel, precedent, categories]);
  if (!variations.length) return null;
  return <section className="space-y-2">
    <div className="px-1"><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Ce qui change vraiment</h2><p className="mt-0.5 text-xs text-ui-text-secondary">Les postes qui expliquent le plus l’écart avec le mois précédent.</p></div>
    <div className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft">{variations.map((v, index) => {
      const hausse = v.delta > 0;
      const pct = v.avant > 0 ? Math.round(Math.abs(v.delta / v.avant) * 100) : null;
      return <div key={v.id} className={`flex items-center gap-3 px-4 py-3 ${index ? "border-t border-ui-hairline" : ""}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${hausse ? "bg-corail-pale" : "bg-menthe-pale"}`}>{v.categorie.icone || "📦"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{v.categorie.label || "Autre"}</span><span className="block text-xs text-sourdine">{hausse ? "Plus dépensé" : "Moins dépensé"} que le mois dernier</span></span><span className={`tnum text-right text-sm font-bold ${hausse ? "text-corail" : "text-menthe"}`}>{hausse ? "+" : "−"}{euros(Math.abs(v.delta))}{pct !== null && <small className="ml-1 text-[11px] font-medium">({pct} %)</small>}</span></div>;
    })}</div>
  </section>;
}
