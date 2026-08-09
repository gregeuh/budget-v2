"use client";

import Link from "next/link";
import { useBudget } from "@/lib/store";
import { calculerProjection } from "@/lib/projection";
import { euros } from "@/lib/format";

const OUTILS = [
  { href: "/previsions", icone: "🔮", titre: "Prévisions", detail: "Tester une dépense avant de l’engager", ton: "bg-menthe-pale" },
  { href: "/calendrier", icone: "🗓️", titre: "Calendrier", detail: "Voir les échéances et récurrences", ton: "bg-beurre-pale" },
  { href: "/budgets", icone: "🎯", titre: "Budgets & projets", detail: "Plafonds, objectifs et épargne", ton: "bg-marque-pale" },
  { href: "/statistiques", icone: "📊", titre: "Cockpit statistiques", detail: "Comprendre ce qui évolue", ton: "bg-ciel-pale" },
  { href: "/inbox", icone: "🧭", titre: "Boîte financière", detail: "Traiter les alertes et anomalies", ton: "bg-ui-surface-raised" },
  { href: "/cloture", icone: "📅", titre: "Clôture mensuelle", detail: "Conserver ton bilan de référence", ton: "bg-corail-pale" },
];

export default function PilotagePage() {
  const { comptes, soldes, transactions, recurrentes, profil } = useBudget();
  const projection = calculerProjection({ comptes, soldes, transactions, recurrentes, profil });
  const prochaines = recurrentes.filter((operation) => operation.active !== false).length;
  const transactionsSansCategorie = transactions.filter((operation) => !operation.categorie || operation.categorie === "autre").length;
  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">Tout au même endroit</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Pilotage</h1><p className="mt-2 text-sm leading-5 text-sourdine">Décide, anticipe et suis ton budget sans avoir à chercher les bons écrans.</p></header>
    <Link href="/mois" className="flex items-center gap-3 rounded-v3-m border border-marque/20 bg-marque-pale p-3.5 shadow-v3-soft"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ui-surface-floating text-lg">☀︎</span><span className="min-w-0 flex-1"><strong className="block text-sm text-marque-texte">Ce mois-ci</strong><span className="block text-xs text-ui-text-secondary">Tes échéances et priorités avant la paie.</span></span><span className="text-xl text-marque">›</span></Link>
    <Link href="/previsions" className="block rounded-v3-l bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))] p-5 text-white shadow-v3-medium"><div className="flex items-start justify-between"><div><p className="text-sm text-white/75">Reste à vivre projeté</p><p className="mt-1 tnum text-4xl font-bold">{euros(projection.reste)}</p></div><span className="rounded-pill bg-white/15 px-3 py-1.5 text-xs font-semibold">{projection.jours} j.</span></div><p className="mt-4 text-sm text-white/80">{euros(projection.parJour)} par jour jusqu’à la paie <span className="float-right font-semibold text-white">Voir la projection ›</span></p></Link>
    <section><div className="mb-2 flex items-baseline justify-between"><h2 className="font-semibold">Mes outils</h2><span className="text-xs text-sourdine">6 raccourcis</span></div><div className="grid grid-cols-2 gap-2">{OUTILS.map((outil) => { const badge = outil.href === "/calendrier" && prochaines ? `${prochaines} à venir` : outil.href === "/inbox" && transactionsSansCategorie ? `${transactionsSansCategorie} à classer` : null; return <Link key={outil.href} href={outil.href} className={`relative rounded-v3-m p-3.5 shadow-v3-soft transition-transform active:scale-[0.98] ${outil.ton}`}><span className="text-xl">{outil.icone}</span>{badge && <span className="absolute right-2 top-2 rounded-pill bg-ui-surface-floating px-1.5 py-0.5 text-[10px] font-semibold text-ui-text-primary shadow-sm">{badge}</span>}<strong className="mt-2 block text-sm">{outil.titre}</strong><span className="mt-1 block text-xs leading-4 text-sourdine">{outil.detail}</span></Link>; })}</div></section>
  </div>;
}
