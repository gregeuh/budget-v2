"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { aujourdhui, euros, moisLabel } from "@/lib/format";
import { statsMoisBudgetaire } from "@/lib/conseils";

export default function PlanPage() {
  const { transactions, budgets, profil, categories, projets, recurrentes } = useBudget();
  const mois = aujourdhui().slice(0, 7);
  const stats = useMemo(() => statsMoisBudgetaire(transactions, mois, profil.jourSalaire), [transactions, mois, profil.jourSalaire]);
  const revenu = stats.revenus || profil.revenuMensuel || 0;
  const charges = recurrentes.filter((r) => r.active !== false && r.montant < 0).reduce((s, r) => s + Math.abs(r.montant), 0);
  const enveloppes = Object.entries(budgets).map(([id, limite]) => ({ id, limite, depense: stats.parCategorie[id] || 0, categorie: categories[id] || categories.autre })).sort((a, b) => (b.depense / Math.max(1, b.limite)) - (a.depense / Math.max(1, a.limite)));
  const epargne = projets.reduce((s, p) => s + (Number(p.versementMensuel) || 0), 0);
  const disponible = revenu - charges - epargne;
  return <div className="space-y-5"><header><p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-marque">Ton point de départ</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Plan de {moisLabel(mois)}</h1><p className="mt-2 text-sm leading-5 text-sourdine">Revenus, charges, enveloppes et objectifs regroupés avant de commencer le mois.</p></header>
    <section className="rounded-v3-l bg-ui-surface-floating p-5 shadow-v3-medium"><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-sourdine">Revenu de référence</p><strong className="tnum mt-1 block text-2xl">{euros(revenu)}</strong></div><div><p className="text-xs text-sourdine">Charges prévues</p><strong className="tnum mt-1 block text-2xl text-corail">−{euros(charges)}</strong></div></div><div className="mt-4 border-t border-ui-hairline pt-4"><p className="text-sm text-sourdine">À répartir entre tes enveloppes et tes envies</p><p className={`tnum mt-1 text-3xl font-bold ${disponible < 0 ? "text-corail" : "text-menthe-texte"}`}>{euros(disponible)}</p>{epargne > 0 && <p className="mt-1 text-xs text-sourdine">dont {euros(epargne)} déjà prévus pour tes objectifs.</p>}</div></section>
    <section><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Enveloppes du mois</h2><Link href="/budgets?edit=1" className="text-sm font-semibold text-marque">Ajuster</Link></div><div className="space-y-2">{enveloppes.length ? enveloppes.slice(0, 5).map((item) => { const restant = item.limite - item.depense; const ratio = Math.min(100, Math.round((item.depense / Math.max(1, item.limite)) * 100)); return <Link key={item.id} href="/budgets" className="block rounded-v3-m bg-ui-surface-floating p-3.5 shadow-v3-soft"><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{item.categorie.icone} {item.categorie.label}</span><span className={`tnum font-semibold ${restant < 0 ? "text-corail" : ""}`}>{restant >= 0 ? `${euros(restant)} restant` : `+${euros(-restant)}`}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ui-surface-raised"><div className={`h-full rounded-full ${ratio >= 100 ? "bg-corail" : ratio >= 80 ? "bg-beurre" : "bg-menthe"}`} style={{ width: `${ratio}%` }} /></div></Link>; }) : <p className="rounded-v3-m bg-ui-surface-floating p-4 text-sm text-sourdine shadow-v3-soft">Crée tes premières enveloppes pour rendre ce plan actionnable.</p>}</div></section>
    <section className="grid grid-cols-2 gap-2"><Link href="/budgets" className="rounded-v3-m bg-marque-pale p-4"><strong className="block text-sm text-marque-texte">Objectifs d’épargne</strong><span className="mt-1 block text-xs text-ui-text-secondary">{projets.length ? `${projets.length} objectif${projets.length > 1 ? "s" : ""} en cours` : "Créer un objectif"} ›</span></Link><Link href="/cloture" className="rounded-v3-m bg-ui-surface-raised p-4"><strong className="block text-sm">Clôture mensuelle</strong><span className="mt-1 block text-xs text-sourdine">Préparer le bilan ›</span></Link></section>
  </div>;
}
