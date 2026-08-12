"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { aujourdhui, cleMois, dateCourte, euros, isoLocal, prochaineOccurrence } from "@/lib/format";
import { calculerProjection } from "@/lib/projection";

const joursMois = (mois) => {
  const [annee, numero] = mois.split("-").map(Number);
  return new Date(annee, numero, 0).getDate();
};

export default function CalendrierPage() {
  const { transactions, recurrentes, categories, comptes, soldes, profil } = useBudget();
  const [mois, setMois] = useState(cleMois(aujourdhui()));
  const [jourSelectionne, setJourSelectionne] = useState(aujourdhui());
  const evenements = useMemo(() => {
    const liste = transactions.filter((t) => cleMois(t.date) === mois).map((t) => ({ ...t, virtuel: false }));
    for (const r of recurrentes) {
      if (r.actif === false) continue;
      let date = r.prochaine;
      for (let n = 0; date && n < 24; n += 1) {
        if (cleMois(date) === mois) liste.push({ ...r, id: `${r.id}-${date}`, date, virtuel: true });
        if (date > `${mois}-31`) break;
        date = prochaineOccurrence(date, r.frequence, { mode: r.modeSalaire || "jour" });
      }
    }
    return liste.sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, recurrentes, mois]);
  const prochain = evenements.filter((e) => e.date >= aujourdhui()).slice(0, 8);
  const totalAVenir = prochain.reduce((total, e) => total + (e.montant < 0 ? Math.abs(e.montant) : 0), 0);
  const projection = useMemo(() => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }), [comptes, soldes, transactions, recurrentes, profil]);
  const timeline = projection.aVenir.slice(0, 5);
  const nombreJours = joursMois(mois);
  const premierJour = new Date(`${mois}-01T12:00:00`).getDay() || 7;
  const cellules = Array.from({ length: premierJour - 1 + nombreJours }, (_, index) => index < premierJour - 1 ? null : index - premierJour + 2);
  const changerMois = (offset) => { const d = new Date(`${mois}-01T12:00:00`); d.setMonth(d.getMonth() + offset); const prochainMois = cleMois(isoLocal(d)); setMois(prochainMois); setJourSelectionne(`${prochainMois}-01`); };
  const selection = evenements.filter((item) => item.date === jourSelectionne);

  return <div className="space-y-5">
    <header><p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">Ton mois en mouvement</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Calendrier financier</h1><p className="mt-2 text-sm leading-5 text-sourdine">Les opérations prévues sont pointillées : elles n’affectent pas ton solde tant qu’elles ne sont pas passées.</p></header>
    <section className="rounded-v3-l bg-ui-surface-floating p-4 shadow-v3-soft"><div className="flex items-center justify-between"><button onClick={() => changerMois(-1)} aria-label="Mois précédent" className="h-10 w-10 rounded-full bg-ui-surface-raised text-xl">‹</button><h2 className="font-semibold capitalize">{new Date(`${mois}-01T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2><button onClick={() => changerMois(1)} aria-label="Mois suivant" className="h-10 w-10 rounded-full bg-ui-surface-raised text-xl">›</button></div><div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-sourdine">{["L","M","M","J","V","S","D"].map((jour, i) => <span key={`${jour}-${i}`}>{jour}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{cellules.map((jour, index) => { const date = jour ? `${mois}-${String(jour).padStart(2, "0")}` : null; const items = date ? evenements.filter((e) => e.date === date) : []; const aujourd = date === aujourdhui(); const selectionne = date === jourSelectionne; return <button key={date || `blank-${index}`} disabled={!jour} onClick={() => date && setJourSelectionne(date)} className={`min-h-12 rounded-xl p-1 text-center transition ${selectionne ? "bg-marque text-white shadow-v3-soft" : aujourd ? "bg-marque-pale ring-1 ring-marque/25" : "bg-ui-surface-raised"}`}>{jour && <><span className={`text-xs ${selectionne ? "font-bold text-white" : aujourd ? "font-bold text-marque-texte" : "text-encre"}`}>{jour}</span><div className="mt-1 flex justify-center gap-0.5">{items.slice(0, 3).map((item) => <i key={item.id} title={item.libelle} className={`h-1.5 w-1.5 rounded-full ${item.virtuel ? "border border-marque bg-transparent" : item.montant < 0 ? "bg-corail" : "bg-menthe"}`} />)}</div></>}</button>; })}</div></section>
    {jourSelectionne && <section className="rounded-v3-l bg-ui-surface-floating p-4 shadow-v3-soft"><p className="text-xs font-semibold uppercase tracking-wide text-marque">{dateCourte(jourSelectionne)}</p>{selection.length ? selection.map((item) => { const cat = categories[item.categorie] || categories.autre; return <div key={item.id} className="mt-3 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marque-pale text-lg">{cat.icone}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.libelle}</strong><span className="text-xs text-sourdine">{item.virtuel ? "Prélèvement prévu" : "Opération enregistrée"}</span></span><strong className={`tnum ${item.montant < 0 ? "text-corail" : "text-menthe-texte"}`}>{item.montant < 0 ? "−" : "+"}{euros(Math.abs(item.montant))}</strong></div>; }) : <p className="mt-2 text-sm text-sourdine">Aucune opération ce jour-là.</p>}</section>}
    <section className="rounded-v3-m bg-beurre-pale p-4"><p className="text-sm font-semibold text-beurre-texte">À venir dans les prochains jours</p><p className="mt-1 text-sm text-beurre-texte">{prochain.length} échéance{prochain.length > 1 ? "s" : ""} · jusqu’à <strong>{euros(totalAVenir)}</strong> de sorties prévues</p></section>
    <section className="rounded-v3-l bg-ui-surface-floating p-4 shadow-v3-soft"><div className="flex items-baseline justify-between"><div><h2 className="font-semibold">Timeline jusqu’à la paie</h2><p className="mt-1 text-xs text-sourdine">L’impact des prochaines opérations sur ton disponible.</p></div><Link href="/previsions" className="text-sm font-semibold text-marque">Simuler</Link></div><div className="mt-4 space-y-3 border-l-2 border-marque-pale pl-4">{timeline.length ? timeline.map((operation) => <div key={operation.id} className="relative flex items-center justify-between gap-3"><i className={`absolute -left-[21px] h-2.5 w-2.5 rounded-full ${operation.montant < 0 ? "bg-corail" : "bg-menthe"}`} /><span className="min-w-0"><strong className="block truncate text-sm">{operation.libelle || "Échéance"}</strong><span className="text-xs text-sourdine">{dateCourte(operation.date)}</span></span><strong className={`tnum text-sm ${operation.montant < 0 ? "text-corail" : "text-menthe"}`}>{operation.montant < 0 ? "−" : "+"}{euros(Math.abs(operation.montant))}</strong></div>) : <p className="text-sm text-sourdine">Aucune opération prévue avant la paie.</p>}</div></section>
    <section><div className="mb-2 flex items-baseline justify-between"><h2 className="font-semibold">Échéances</h2><Link href="/transactions" className="text-sm font-semibold text-marque">Voir les opérations</Link></div><div className="space-y-2">{prochain.length ? prochain.map((item) => { const cat = categories[item.categorie] || categories.autre; return <div key={item.id} className="flex items-center gap-3 rounded-v3-m bg-ui-surface-floating p-3 shadow-v3-soft"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ui-surface-raised">{cat.icone}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.libelle}</strong><span className="text-xs text-sourdine">{dateCourte(item.date)}{item.virtuel ? " · prévu" : " · enregistré"}</span></span><span className={`tnum text-sm font-bold ${item.montant < 0 ? "text-corail" : "text-menthe"}`}>{item.montant < 0 ? "−" : "+"}{euros(Math.abs(item.montant))}</span></div>; }) : <p className="rounded-v3-m bg-ui-surface-floating p-4 text-sm text-sourdine shadow-v3-soft">Aucune échéance pour ce mois. Ajoute des récurrences pour visualiser tes charges fixes.</p>}</div></section>
  </div>;
}
