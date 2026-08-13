"use client";

import Link from "next/link";
import { useBudget } from "@/lib/store";
import { calculerScore } from "@/lib/score";

const ACCES = [
  ["/conseils", "✦", "Mes conseils", "Tes priorités, analyses et le coach budgétaire"],
  ["/inbox", "◉", "Boîte financière", "Les éléments qui attendent une décision"],
  ["/plan", "☷", "Plan mensuel", "Répartir ton revenu entre charges, enveloppes et projets"],
  ["/abonnements", "↻", "Mes abonnements", "Mesurer leur coût et repérer les services à revoir"],
  ["/regles", "⚡", "Règles automatiques", "Ranger les prochaines opérations sans y penser"],
  ["/cloture", "✓", "Clôturer mon mois", "Faire le point et repartir sur une base saine"],
  ["/reglages", "↗", "Réglages & données", "Importer, sauvegarder et régler l’application"],
];

export default function CoachPage() {
  const donnees = useBudget();
  const score = calculerScore(donnees).total;
  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-violet-texte">Ton espace personnel</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Coach</h1><p className="mt-2 text-sm leading-5 text-sourdine">Des repères simples pour décider et garder le cap chaque mois.</p></header>
    <Link href="/conseils" className="block rounded-v3-l p-5 text-white shadow-v3-medium" style={{ background: "linear-gradient(145deg, var(--marque-bouton), var(--marque))" }}><div className="flex items-start justify-between"><div><p className="text-sm text-white/75">Santé financière</p><p className="mt-1 text-4xl font-bold">{score}<span className="text-xl text-white/65">/100</span></p></div><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">Voir mon bilan</span></div><p className="mt-5 text-sm text-white/80">Ouvre tes recommandations personnalisées et les prochaines actions utiles.</p></Link>
    <section><h2 className="mb-2 font-semibold">Ce qui peut t’aider</h2><div className="space-y-2">{ACCES.map(([href, emoji, titre, detail]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-3.5 shadow-v3-soft"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-pale text-lg">{emoji}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{titre}</strong><span className="mt-0.5 block text-xs text-sourdine">{detail}</span></span><span>›</span></Link>)}</div></section>
  </div>;
}
