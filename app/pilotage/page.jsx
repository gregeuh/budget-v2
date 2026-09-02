"use client";

import Link from "next/link";
import { useBudget } from "@/lib/store";
import { calculerProjection } from "@/lib/projection";
import { euros } from "@/lib/format";

const SECTIONS = [
  { titre: "Préparer", detail: "Anticiper plutôt que subir", outils: [
    { href: "/previsions", icone: "◔", titre: "Prévisions", detail: "Tester une dépense avant de la faire" },
    { href: "/calendrier", icone: "□", titre: "Calendrier", detail: "Échéances et paiements à venir" },
    { href: "/plan", icone: "☷", titre: "Plan du mois", detail: "Répartir revenus, charges et épargne" },
  ] },
  { titre: "Organiser", detail: "Garder les choses simples", outils: [
    { href: "/inbox", icone: "✓", titre: "À traiter", detail: "Les alertes qui méritent ton attention" },
    { href: "/abonnements", icone: "↻", titre: "Abonnements", detail: "Les dépenses qui reviennent" },
    { href: "/regles", icone: "⚡", titre: "Automatisations", detail: "Classer les prochaines opérations" },
  ] },
  { titre: "Aller plus loin", detail: "Quand tu en as besoin", outils: [
    { href: "/comptes", icone: "▣", titre: "Mes comptes", detail: "Soldes, crédits et connexions" },
    { href: "/statistiques", icone: "↗", titre: "Statistiques", detail: "Comprendre tes habitudes" },
    { href: "/conseils", icone: "✦", titre: "Conseils", detail: "Des pistes personnalisées" },
    { href: "/cloture", icone: "◫", titre: "Clôture mensuelle", detail: "Faire le point sur le mois" },
  ] },
];

export default function PilotagePage() {
  const { comptes, soldes, transactions, recurrentes, profil } = useBudget();
  const projection = calculerProjection({ comptes, soldes, transactions, recurrentes, profil });
  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">Le reste, sans le bruit</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Outils</h1><p className="mt-2 text-sm leading-5 text-sourdine">Les fonctions utiles, rangées par moment plutôt que par jargon.</p></header>
    <Link href="/previsions" className="block rounded-v3-l bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))] p-5 text-white shadow-v3-medium"><div className="flex items-start justify-between"><div><p className="text-sm text-white/75">Disponible jusqu’à la paie</p><p className="mt-1 tnum text-4xl font-bold">{euros(projection.reste)}</p></div><span className="rounded-pill bg-white/15 px-3 py-1.5 text-xs font-semibold">{projection.jours} j.</span></div><p className="mt-4 text-sm text-white/80">Voir mes prévisions <span className="float-right font-semibold text-white">›</span></p></Link>
    {SECTIONS.map((section) => <section key={section.titre}><div className="mb-2 px-1"><h2 className="font-semibold">{section.titre}</h2><p className="mt-0.5 text-xs text-sourdine">{section.detail}</p></div><div className="overflow-hidden rounded-v3-m border border-ui-hairline bg-ui-surface-floating shadow-v3-soft">{section.outils.map((outil, index) => <Link key={outil.href} href={outil.href} className={`flex items-center gap-3 px-3.5 py-3.5 active:bg-ui-surface-raised ${index ? "border-t border-ui-hairline" : ""}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marque-pale text-lg text-marque-texte">{outil.icone}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{outil.titre}</strong><span className="block truncate text-xs text-sourdine">{outil.detail}</span></span><span className="text-lg text-sourdine">›</span></Link>)}</div></section>)}
  </div>;
}
