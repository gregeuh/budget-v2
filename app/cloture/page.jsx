"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { cleMois, euros, moisDecaleLocal, moisLabel } from "@/lib/format";
import { statsMois } from "@/lib/conseils";

export default function CloturePage() {
  const { transactions, budgets, profil, sauverApp } = useBudget();
  const mois = moisDecaleLocal(-1);
  const stats = useMemo(() => statsMois(transactions, mois), [transactions, mois]);
  const [termine, setTermine] = useState(Boolean(profil.cloturesMensuelles?.[mois]));
  const cloturer = async () => {
    const clotures = { ...(profil.cloturesMensuelles || {}), [mois]: { clotureLe: new Date().toISOString(), revenus: stats.revenus, depenses: stats.depenses, solde: stats.solde, budgets: { ...budgets } } };
    await sauverApp(undefined, { ...profil, cloturesMensuelles: clotures });
    setTermine(true);
  };
  const budgetsRespectes = Object.entries(budgets).filter(([id, limite]) => (stats.parCategorie[id] || 0) <= limite).length;
  const totalBudgets = Object.keys(budgets).length;
  const score = totalBudgets ? Math.max(0, Math.min(100, Math.round(55 + (budgetsRespectes / totalBudgets) * 35 + (stats.solde >= 0 ? 10 : 0)))) : stats.solde >= 0 ? 80 : 60;
  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">Rituel mensuel</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Clôture de {moisLabel(`${mois}-01`)}</h1><p className="mt-2 text-sm leading-5 text-sourdine">Fige un bilan de référence avant de démarrer le mois suivant. Tes opérations restent toujours modifiables.</p></header>
    <section className="relative overflow-hidden rounded-v3-xl bg-marque-pale px-4 py-6 text-center"><p className="text-sm font-semibold text-marque-texte">{termine ? "Mois bouclé" : "Ton bilan du mois"}</p><div className="score-ring mx-auto mt-4" style={{ "--score": score }}><span><strong className="block text-5xl leading-none">{score}</strong><small className="mt-1 block text-sm font-semibold text-marque-texte">/ 100</small></span></div><p className="mt-4 text-sm text-sourdine">{score >= 80 ? "Tu es resté proche de tes objectifs. Beau mois." : "Quelques ajustements peuvent améliorer le mois suivant."}</p></section>
    <section className="grid grid-cols-2 gap-2"><div className="rounded-v3-m bg-menthe-pale p-4"><p className="text-xs text-menthe-texte">Revenus</p><p className="mt-1 tnum text-xl font-bold text-menthe-texte">{euros(stats.revenus)}</p></div><div className="rounded-v3-m bg-corail-pale p-4"><p className="text-xs text-corail-texte">Dépenses</p><p className="mt-1 tnum text-xl font-bold text-corail-texte">{euros(stats.depenses)}</p></div></section>
    <section className="rounded-v3-l bg-ui-surface-floating p-4 shadow-v3-soft"><p className="text-sm text-sourdine">Solde du mois</p><p className={`mt-1 tnum text-3xl font-bold ${stats.solde >= 0 ? "text-menthe-texte" : "text-corail"}`}>{stats.solde >= 0 ? "+" : ""}{euros(stats.solde)}</p><div className="mt-4 border-t border-bordure pt-3 text-sm"><div className="flex justify-between"><span className="text-sourdine">Budgets tenus</span><strong>{budgetsRespectes} / {Object.keys(budgets).length || 0}</strong></div><div className="mt-2 flex justify-between"><span className="text-sourdine">Opérations enregistrées</span><strong>{transactions.filter((t) => cleMois(t.date) === mois).length}</strong></div></div></section>
    {termine ? <section className="rounded-v3-m bg-menthe-pale p-4"><p className="font-semibold text-menthe-texte">✓ Mois clôturé</p><p className="mt-1 text-sm text-menthe-texte">Le bilan est conservé dans ton profil. Tu peux continuer à corriger des opérations si nécessaire.</p></section> : <button onClick={cloturer} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Clôturer ce mois</button>}
    <Link href="/budgets?edit=1" className="block rounded-ios bg-marque-bouton py-3 text-center text-sm font-semibold text-surMarque">Préparer {moisLabel(moisDecaleLocal(0))}</Link>
  </div>;
}
