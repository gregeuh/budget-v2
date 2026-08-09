"use client";

import Link from "next/link";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";

export default function PatrimoinePage() {
  const { comptes, soldes } = useBudget();
  const total = comptes.reduce((s, compte) => s + (Number(soldes[compte.id]) || 0), 0);
  const credits = comptes.filter((compte) => compte.type === "credit" || compte.groupe === "credits");
  const epargne = comptes.filter((compte) => ["epargne", "invest"].includes(compte.groupe)).reduce((s, compte) => s + Math.max(0, Number(soldes[compte.id]) || 0), 0);
  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-marque">Tes espaces d’argent</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Patrimoine</h1><p className="mt-2 text-sm leading-5 text-sourdine">Une vue nette de ce que tu possèdes, épargnes et rembourses.</p></header>
    <section className="overflow-hidden rounded-v3-l bg-[linear-gradient(145deg,#172554,#3730a3)] p-5 text-white shadow-v3-medium"><p className="text-sm text-white/70">Patrimoine net</p><p className="mt-1 tnum text-4xl font-bold">{euros(total)}</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm"><span><span className="block text-white/60">Épargne</span><strong className="mt-1 block">{euros(epargne)}</strong></span><span><span className="block text-white/60">Crédits</span><strong className="mt-1 block">{credits.length} compte{credits.length > 1 ? "s" : ""}</strong></span></div></section>
    <section><h2 className="mb-2 font-semibold">Accès rapides</h2><div className="space-y-2">
      <Link href="/comptes" className="flex items-center gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-4 shadow-v3-soft"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marque-pale text-xl">▣</span><span className="flex-1"><strong className="block">Mes comptes</strong><span className="text-sm text-sourdine">{comptes.length} comptes et soldes à jour</span></span><span>›</span></Link>
      <Link href="/comptes#credits" className="flex items-center gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-4 shadow-v3-soft"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-corail-pale text-xl">◫</span><span className="flex-1"><strong className="block">Crédits & emprunts</strong><span className="text-sm text-sourdine">Suivre tes échéances et le capital restant</span></span><span>›</span></Link>
      <Link href="/reglages" className="flex items-center gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-4 shadow-v3-soft"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-menthe-pale text-xl">⌁</span><span className="flex-1"><strong className="block">Connexions & données</strong><span className="text-sm text-sourdine">Importer, connecter ou gérer tes données</span></span><span>›</span></Link>
    </div></section>
  </div>;
}
