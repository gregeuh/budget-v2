"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { aujourdhui, cleMois, euros } from "@/lib/format";
import { statsMoisBudgetaire } from "@/lib/conseils";
import MoisSelecteur from "@/components/MoisSelecteur";
import SpendChart from "@/components/SpendChart";
import DonutCat from "@/components/DonutCat";
import Tendances from "@/components/Tendances";
import PatrimoineChart from "@/components/PatrimoineChart";
import CalendrierDepenses from "@/components/CalendrierDepenses";
import VariationsActionnables from "@/components/VariationsActionnables";

function Evolution({ valeur, precedent, inverse = false }) {
  if (!precedent) return <span className="text-[11px] text-ui-text-secondary"><span className="hidden min-[360px]:inline">Premier mois comparable</span><span className="min-[360px]:hidden" aria-label="Premier mois comparable">—</span></span>;
  const delta = valeur - precedent;
  const favorable = inverse ? delta <= 0 : delta >= 0;
  return <span className={`text-[11px] font-semibold ${favorable ? "text-menthe" : "text-corail"}`}>{delta >= 0 ? "+" : ""}{euros(delta)} vs mois dernier</span>;
}

const moisPrecedent = (mois) => {
  const [annee, numero] = mois.split("-").map(Number);
  const date = new Date(annee, numero - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function Statistiques() {
  const { transactions, comptes, profil, categories, budgets } = useBudget();
  const [mois, setMois] = useState(cleMois(aujourdhui()));
  const bilan = useMemo(() => {
    const actuel = statsMoisBudgetaire(transactions, mois, profil.jourSalaire);
    const precedent = statsMoisBudgetaire(transactions, moisPrecedent(mois), profil.jourSalaire);
    return { actuel, precedent, solde: actuel.revenus - actuel.depenses, soldePrec: precedent.revenus - precedent.depenses };
  }, [transactions, mois, profil.jourSalaire]);
  const cyclePaie = Number(profil.jourSalaire) >= 20;
  const cockpit = useMemo(() => {
    const revenuReference = Math.max(bilan.actuel.revenus, profil.revenuMensuel || 0, 1);
    const epargne = Math.max(0, bilan.solde);
    const taux = Math.max(0, Math.round((epargne / revenuReference) * 100));
    const budgetsAlertes = Object.entries(budgets || {}).filter(([id, limite]) => limite > 0 && (bilan.actuel.parCategorie[id] || 0) >= limite * 0.8).length;
    const score = Math.max(0, Math.min(100, 55 + Math.min(25, taux) - budgetsAlertes * 8 + (bilan.solde >= 0 ? 12 : -18)));
    return { taux, budgetsAlertes, score: Math.round(score) };
  }, [bilan, budgets, profil.revenuMensuel]);

  return (
    <div className="space-y-6">
      <header className="px-1">
        <p className="text-v3-caption font-medium text-ui-text-secondary">Comprendre tes habitudes</p>
        <h1 className="text-v3-title font-semibold">Statistiques</h1>
        <p className="mt-1 text-sm text-ui-text-secondary">Les chiffres essentiels, sans jargon.</p>
        {cyclePaie && <p className="mt-2 inline-flex rounded-pill bg-marque-pale px-2.5 py-1 text-[11px] font-semibold text-marque-texte">💼 Mois budgétaire calé sur ta paie du {profil.jourSalaire}</p>}
      </header>

      <div className="grid grid-cols-2 rounded-pill bg-voile p-1 text-sm font-semibold">
        <Link href="/budgets" className="rounded-pill py-2 text-center text-sourdine">Budgets</Link>
        <Link href="/statistiques" className="rounded-pill bg-carte py-2 text-center shadow-carte">Statistiques</Link>
      </div>

      <MoisSelecteur mois={mois} onChanger={setMois} revenus={bilan.actuel.revenus} depenses={bilan.actuel.depenses} />

      <section className="rounded-v3-l bg-ui-surface-floating p-4 shadow-v3-soft"><div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[7px] border-marque-pale"><span className="tnum text-lg font-bold text-marque-texte">{cockpit.score}</span></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Ton cockpit du mois</p><p className="mt-0.5 text-xs leading-5 text-sourdine">{cockpit.score >= 70 ? "Une trajectoire saine : garde ce rythme." : cockpit.score >= 45 ? "Situation maîtrisable : quelques leviers à surveiller." : "Mois sous tension : priorise les dépenses essentielles."}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 border-t border-bordure pt-3"><div><p className="tnum text-lg font-bold">{cockpit.taux} %</p><p className="text-xs text-sourdine">capacité d’épargne</p></div><div><p className="tnum text-lg font-bold">{cockpit.budgetsAlertes}</p><p className="text-xs text-sourdine">budget{cockpit.budgetsAlertes > 1 ? "s" : ""} à surveiller</p></div></div></section>

      <section className="grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-v3-m bg-menthe-pale p-3 shadow-v3-soft"><p className="truncate text-[10px] font-semibold uppercase tracking-wide text-menthe-texte">Revenus</p><p className="chiffres mt-1 truncate text-lg font-bold leading-tight text-menthe-texte">{euros(bilan.actuel.revenus)}</p><Evolution valeur={bilan.actuel.revenus} precedent={bilan.precedent.revenus} /></div>
        <div className="min-w-0 rounded-v3-m bg-corail-pale p-3 shadow-v3-soft"><p className="truncate text-[10px] font-semibold uppercase tracking-wide text-corail-texte">Dépenses</p><p className="chiffres mt-1 truncate text-lg font-bold leading-tight text-corail-texte">{euros(bilan.actuel.depenses)}</p><Evolution valeur={bilan.actuel.depenses} precedent={bilan.precedent.depenses} inverse /></div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-4 rounded-v3-m bg-ui-surface-floating p-3.5 shadow-v3-soft">
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-ui-text-secondary">Solde du mois</p><Evolution valeur={bilan.solde} precedent={bilan.soldePrec} /></div>
          <p className={`chiffres shrink-0 text-2xl font-bold leading-tight ${bilan.solde >= 0 ? "text-menthe" : "text-corail"}`}>{bilan.solde >= 0 ? "+" : ""}{euros(bilan.solde)}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="px-1"><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Évolution</h2><p className="mt-0.5 text-xs text-ui-text-secondary">Compare tes revenus et tes dépenses au fil des mois.</p></div>
        <SpendChart transactions={transactions} jourSalaire={profil.jourSalaire} />
        <Tendances nbMois={6} />
      </section>

      <VariationsActionnables actuel={bilan.actuel} precedent={bilan.precedent} categories={categories} />

      <section className="space-y-3">
        <div className="px-1"><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Où part ton argent</h2><p className="mt-0.5 text-xs text-ui-text-secondary">Répartition et rythme de tes dépenses sur le mois choisi.</p></div>
        <DonutCat transactions={transactions} mois={mois} />
        <CalendrierDepenses mois={mois} />
      </section>

      <section className="space-y-3">
        <div className="px-1"><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Patrimoine</h2><p className="mt-0.5 text-xs text-ui-text-secondary">La valeur cumulée de tes comptes dans le temps.</p></div>
        <PatrimoineChart comptes={comptes} transactions={transactions} />
      </section>
    </div>
  );
}
