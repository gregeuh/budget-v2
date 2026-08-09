"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { calculerProjection } from "@/lib/projection";
import { euros, dateCourte } from "@/lib/format";

const SCENARIOS_INITIAUX = [
  { montant: 20, label: "Un café + déjeuner", icone: "☕" },
  { montant: 50, label: "Une sortie", icone: "🎟️" },
  { montant: 100, label: "Un achat plaisir", icone: "🛍️" },
];

export default function PrevisionsPage() {
  const { comptes, soldes, transactions, recurrentes, profil } = useBudget();
  const [scenarios, setScenarios] = useState(SCENARIOS_INITIAUX);
  const [selection, setSelection] = useState(null);
  const [montantLibre, setMontantLibre] = useState("");
  const scenario = selection == null ? (parseFloat(montantLibre.replace(",", ".")) || 0) : scenarios[selection]?.montant || 0;
  const projection = useMemo(
    () => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }),
    [comptes, soldes, transactions, recurrentes, profil]
  );
  const reste = projection.reste - scenario;
  const parJour = reste / projection.jours;
  const ton = reste < 0 ? "corail" : parJour < 15 ? "beurre" : "menthe";
  const etat = reste < 0 ? "Cette dépense te ferait passer sous zéro avant la paie." : parJour < 15 ? "C’est possible, mais ton rythme devient serré." : "Ton équilibre reste confortable jusqu’à la paie.";
  const couleurs = {
    corail: "bg-corail-pale text-corail-texte",
    beurre: "bg-beurre-pale text-beurre-texte",
    menthe: "bg-menthe-pale text-menthe-texte",
  };

  return <div className="space-y-5">
    <header>
      <p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">Avant d’agir</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Prévisions de trésorerie</h1>
      <p className="mt-2 text-sm leading-5 text-sourdine">Teste une décision avant de la faire. Ces simulations ne créent aucune opération.</p>
    </header>

    <section className="rounded-v3-l bg-ui-surface-floating p-5 shadow-v3-soft">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-sourdine">Disponible jusqu’à la paie</p><p className="mt-1 tnum text-4xl font-bold">{euros(reste)}</p></div><span className="rounded-pill bg-marque-pale px-3 py-1.5 text-xs font-semibold text-marque-texte">{projection.jours} j.</span></div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-voile"><div className="h-full rounded-full bg-marque transition-all" style={{ width: `${Math.max(4, Math.min(100, projection.dispo > 0 ? (Math.max(0, reste) / projection.dispo) * 100 : 0))}%` }} /></div>
      <div className="mt-3 flex justify-between text-sm"><span className="text-sourdine">Aujourd’hui</span><span className="font-semibold">{euros(parJour)} / jour</span><span className="text-sourdine">{dateCourte(projection.horizonISO)}</span></div>
    </section>

    <section><div className="mb-2 flex items-baseline justify-between"><h2 className="font-semibold">Simuler une dépense</h2><button onClick={() => { setSelection(null); setMontantLibre(""); }} className="text-sm font-semibold text-marque">Réinitialiser</button></div><p className="mb-2 text-xs text-sourdine">Modifie librement les repères selon tes habitudes.</p><div className="space-y-2">{scenarios.map((item, index) => <div key={item.label} className={`flex items-center gap-3 rounded-v3-m border p-3.5 shadow-v3-soft ${selection === index ? "border-marque bg-marque-pale" : "border-bordure bg-ui-surface-floating"}`}><button onClick={() => { setSelection(index); setMontantLibre(""); }} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="text-2xl">{item.icone}</span><span className="min-w-0"><strong className="block text-sm">{item.label}</strong><span className="text-xs text-sourdine">Impact unique sur ton reste à vivre</span></span></button><label className="flex shrink-0 items-center rounded-pill bg-carte px-2 py-1.5 shadow-sm"><input aria-label={`Montant pour ${item.label}`} inputMode="decimal" value={String(item.montant).replace(".", ",")} onFocus={() => { setSelection(index); setMontantLibre(""); }} onChange={(event) => { const valeur = parseFloat(event.target.value.replace(",", ".")); setScenarios((liste) => liste.map((s, i) => i === index ? { ...s, montant: Number.isFinite(valeur) ? Math.max(0, valeur) : 0 } : s)); }} className="tnum w-14 bg-transparent text-right text-sm font-bold outline-none" /><span className="text-sm font-bold">€</span></label></div>)}</div>
      <label className={`mt-2 flex items-center gap-3 rounded-v3-m border p-3.5 shadow-v3-soft ${selection == null && montantLibre ? "border-marque bg-marque-pale" : "border-bordure bg-ui-surface-floating"}`}><span className="text-2xl">✏️</span><span className="min-w-0 flex-1"><strong className="block text-sm">Mon montant</strong><span className="text-xs text-sourdine">Pour une dépense précise</span></span><span className="flex shrink-0 items-center rounded-pill bg-carte px-2 py-1.5 shadow-sm"><input aria-label="Mon montant à simuler" inputMode="decimal" value={montantLibre} placeholder="0" onFocus={() => setSelection(null)} onChange={(event) => setMontantLibre(event.target.value)} className="tnum w-16 bg-transparent text-right text-sm font-bold outline-none" /><span className="text-sm font-bold">€</span></span></label>
    </section>

    <section className={`rounded-v3-m p-4 ${couleurs[ton]}`}><p className="font-semibold">{scenario ? `Avec ${euros(scenario)} de dépense` : "Ta projection actuelle"}</p><p className="mt-1 text-sm leading-5">{etat}</p></section>

    <Link href="/transactions" className="block rounded-ios bg-marque-bouton py-3 text-center text-sm font-semibold text-surMarque">Ajouter une opération réelle</Link>
    <p className="text-center text-xs text-sourdine">Projection basée sur tes soldes, opérations à venir et récurrences déjà enregistrées.</p>
  </div>;
}
