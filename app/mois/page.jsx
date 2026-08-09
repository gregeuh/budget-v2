"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { calculerProjection } from "@/lib/projection";
import { dateCourte, euros } from "@/lib/format";
import { analyserQualiteDonnees } from "@/lib/qualiteDonnees";

export default function CeMoisPage() {
  const { comptes, soldes, transactions, recurrentes, profil, categories } = useBudget();
  const projection = calculerProjection({ comptes, soldes, transactions, recurrentes, profil });
  const priorites = useMemo(() => analyserQualiteDonnees(transactions, categories), [transactions, categories]);
  const prochaines = projection.aVenir.filter((operation) => operation.montant < 0).slice(0, 3);
  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-marque">Ton tableau de bord court</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Ce mois-ci</h1><p className="mt-2 text-sm leading-5 text-sourdine">L’essentiel jusqu’à ta prochaine paie, sans devoir parcourir toute l’application.</p></header>
    <Link href="/previsions" className="block rounded-v3-l bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))] p-5 text-white shadow-v3-medium"><div className="flex justify-between gap-3"><div><p className="text-sm text-white/75">Disponible jusqu’à la paie</p><p className="mt-1 tnum text-4xl font-bold">{euros(projection.reste)}</p></div><span className="h-fit rounded-pill bg-white/15 px-3 py-1.5 text-xs font-semibold">{projection.jours} j.</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, Math.min(100, (projection.reste / Math.max(1, projection.dispo)) * 100))}%` }} /></div><p className="mt-3 text-sm text-white/80">{euros(projection.parJour)} par jour · simuler une dépense ›</p></Link>
    <section><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">À ne pas oublier</h2><Link href="/calendrier" className="text-sm font-semibold text-marque">Calendrier</Link></div><div className="space-y-2">{prochaines.length ? prochaines.map((operation) => <Link key={operation.id} href="/calendrier" className="flex items-center gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-3.5 shadow-v3-soft"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-beurre-pale">{categories[operation.categorie]?.icone || "◌"}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{operation.libelle || "Échéance"}</strong><span className="block text-xs text-sourdine">{dateCourte(operation.date)}{operation.virtuel ? " · prévue" : ""}</span></span><strong className="tnum text-sm text-corail">−{euros(Math.abs(operation.montant))}</strong></Link>) : <p className="rounded-v3-m bg-ui-surface-floating p-4 text-sm text-sourdine shadow-v3-soft">Aucune sortie prévue avant la paie.</p>}</div></section>
    <section className="rounded-v3-m bg-ui-surface-floating p-4 shadow-v3-soft"><div className="flex items-center justify-between"><div><h2 className="font-semibold">À traiter</h2><p className="mt-1 text-sm text-sourdine">Quelques corrections qui fiabilisent ton suivi.</p></div><Link href="/inbox" className="rounded-pill bg-marque-pale px-3 py-2 text-sm font-semibold text-marque-texte">Ouvrir</Link></div><div className="mt-4 grid grid-cols-2 gap-2 border-t border-ui-hairline pt-3"><div><strong className="tnum text-xl">{priorites.sansCategorie.length}</strong><span className="ml-1 text-xs text-sourdine">à classer</span></div><div><strong className="tnum text-xl">{priorites.doublons.length}</strong><span className="ml-1 text-xs text-sourdine">doublon(s)</span></div></div></section>
    <div className="grid grid-cols-2 gap-2"><Link href="/transactions" className="rounded-v3-m bg-ui-surface-raised p-3.5 text-sm font-semibold">Voir mes opérations ›</Link><Link href="/cloture" className="rounded-v3-m bg-ui-surface-raised p-3.5 text-sm font-semibold">Clôturer le mois ›</Link></div>
  </div>;
}
