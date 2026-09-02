"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { aujourdhui, dateCourte, euros } from "@/lib/format";
import { calculerProjection } from "@/lib/projection";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function Semaine({ aujourd, echeances }) {
  const jours = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${aujourd}T12:00:00`);
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return { iso, nom: index === 0 ? "Auj." : JOURS[date.getDay()], numero: date.getDate(), actif: index === 0, aUneEcheance: echeances.some((item) => item.date === iso) };
  });
  return <div className="avenir-semaine" aria-label="Les sept prochains jours">{jours.map((jour) => <div key={jour.iso} className={jour.actif ? "is-active" : ""}><span>{jour.nom}</span><b>{jour.numero}</b>{jour.aUneEcheance && <i aria-label="Une échéance est prévue" />}</div>)}</div>;
}

export default function CalendrierPage() {
  const { transactions, recurrentes, categories, comptes, soldes, profil } = useBudget();
  const projection = useMemo(
    () => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }),
    [comptes, soldes, transactions, recurrentes, profil]
  );
  const aujourd = aujourdhui();
  const echeances = projection.aVenir.filter((item) => item.date >= aujourd).slice(0, 8);
  let solde = projection.dispo;
  const lignes = echeances.map((item) => {
    solde += item.montant;
    return { ...item, soldeApres: solde };
  });
  const prochaine = lignes[0];

  return (
    <div className="avenir-page space-y-7">
      <header>
        <p className="pecule-eyebrow">Ton calendrier</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">À venir</h1>
        <p className="mt-2 text-sm text-sourdine">{projection.reste >= 0 ? "Tu es tranquille jusqu’à la paie." : "Regardons les prochains paiements."}</p>
      </header>

      <Semaine aujourd={aujourd} echeances={echeances} />

      {prochaine ? <section className="avenir-prochain">
        <span>Prochaine sortie</span>
        <div><strong>{prochaine.libelle || "Paiement à venir"}</strong><b className="text-corail">−{euros(Math.abs(prochaine.montant))}</b></div>
        <small>{dateCourte(prochaine.date)} · après : {euros(prochaine.soldeApres)}</small>
      </section> : <section className="avenir-prochain avenir-prochain--calme"><strong>Aucun paiement à venir</strong><small>Ton agenda financier est calme pour le moment.</small></section>}

      <section>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Les prochains paiements</h2><Link href="/previsions" className="text-sm font-semibold text-marque-texte">Simuler</Link></div>
        {lignes.length ? <ol className="avenir-liste">{lignes.map((operation) => {
          const categorie = categories[operation.categorie] || categories.autre;
          return <li key={operation.id}><span className="avenir-liste__icone">{categorie.icone}</span><span className="min-w-0 flex-1"><strong>{operation.libelle || "Échéance"}</strong><small>{dateCourte(operation.date)}{operation.virtuel ? " · prévu" : ""}</small></span><span className="text-right"><b className={operation.montant < 0 ? "text-corail" : "text-menthe"}>{operation.montant < 0 ? "−" : "+"}{euros(Math.abs(operation.montant))}</b><small>Reste {euros(operation.soldeApres)}</small></span></li>;
        })}</ol> : <p className="rounded-v3-m border border-dashed border-bordure p-5 text-center text-sm text-sourdine">Ajoute des échéances récurrentes pour les retrouver ici.</p>}
      </section>

      <section className="avenir-apres"><span>Après ces paiements</span><strong>{euros(lignes.length ? lignes.at(-1).soldeApres : projection.dispo)}</strong><small>{projection.salaireISO ? `jusqu’au ${dateCourte(projection.salaireISO)}` : "sur les prochaines semaines"}</small></section>
    </div>
  );
}
