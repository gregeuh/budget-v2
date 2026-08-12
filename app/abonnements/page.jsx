"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { auditerDepenses } from "@/lib/audit";
import { euros } from "@/lib/format";

export default function AbonnementsPage() {
  const { transactions, recurrentes, profil } = useBudget();
  const audit = useMemo(
    () => auditerDepenses({ transactions, recurrentes }, { revenuMensuel: profil.revenuMensuel || 0 }),
    [transactions, recurrentes, profil.revenuMensuel]
  );
  const partDuRevenu = profil.revenuMensuel > 0 ? Math.min(100, Math.round((audit.totalMensuel / profil.revenuMensuel) * 100)) : 0;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-marque">Les dépenses qui reviennent</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Abonnements</h1>
        <p className="mt-2 text-sm leading-5 text-sourdine">Garde ce qui t’est utile. Le reste mérite au moins un regard.</p>
      </header>

      <section className="ritual-dark relative overflow-hidden rounded-v3-l p-5 text-white">
        <div className="reflet opacity-50" />
        <div className="relative">
          <p className="text-sm text-white/70">Coût récurrent mensuel</p>
          <p className="tnum mt-1 text-4xl font-bold">{euros(audit.totalMensuel)}<span className="text-lg text-white/60"> / mois</span></p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#a998ff]" style={{ width: `${Math.max(8, partDuRevenu)}%` }} /></div>
          <p className="mt-2 text-xs text-white/70">{profil.revenuMensuel ? `${partDuRevenu} % de tes revenus mensuels` : `${euros(audit.totalAnnuel)} estimés sur un an`} · {audit.items.length} service{audit.items.length > 1 ? "s" : ""}</p>
        </div>
      </section>

      {audit.economiePotentielle > 0 && (
        <section className="rounded-v3-m bg-beurre-pale p-4 shadow-v3-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-beurre-texte">À vérifier</p>
          <strong className="mt-1 block text-beurre-texte">Jusqu’à {euros(audit.economieAnnuelle)} / an à récupérer</strong>
          <p className="mt-1 text-sm text-beurre-texte">Des doublons ou services oubliés semblent pouvoir être revus.</p>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Mes services</h2><span className="text-xs text-sourdine">Touchez pour voir</span></div>
        <div className="overflow-hidden rounded-v3-l border border-ui-hairline bg-ui-surface-floating shadow-v3-soft">
          {audit.items.length ? audit.items.map((item, index) => (
            <Link key={`${item.libelle}-${index}`} href={`/transactions?recherche=${encodeURIComponent(item.libelle)}`} className="flex items-center gap-3 border-b border-ui-hairline p-3.5 last:border-b-0 active:bg-ui-surface-raised">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ui-surface-raised text-lg">{item.abonnement?.icone || "🔁"}</span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.libelle}</strong><span className="block text-xs text-sourdine">{item.dormant ? "À vérifier : plus prélevé récemment" : item.famille?.label || "Prélèvement récurrent"}</span></span>
              <strong className="tnum text-sm">{euros(item.montantMensuel)}</strong><span className="text-lg text-sourdine">›</span>
            </Link>
          )) : <p className="p-4 text-sm text-sourdine">Aucun abonnement détecté : ajoute deux mois d’historique pour améliorer la détection.</p>}
        </div>
      </section>

      <Link href="/regles" className="flex items-center justify-between rounded-v3-m bg-marque-pale p-4 text-sm font-semibold text-marque-texte shadow-v3-soft">Créer une règle pour classer automatiquement ces opérations <span className="text-lg">›</span></Link>
    </div>
  );
}
