"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";
import TxRow from "@/components/TxRow";
import ChiffresRoulants from "@/components/ChiffresRoulants";
import { calculerProjection } from "@/lib/projection";

const RechercheSheet = dynamic(() => import("@/components/RechercheSheet"), { ssr: false });

function Initiale({ prenom = "" }) {
  return <span className="pecule-avatar" aria-hidden="true">{(prenom.trim()[0] || "P").toUpperCase()}</span>;
}

export default function Accueil() {
  const { comptes, transactions, soldes, profil, projets, recurrentes, setReglagesOuverts } = useBudget();
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const projetPhare = [...projets].filter((projet) => projet.objectif > 0).sort((a, b) => (b.montantActuel / b.objectif) - (a.montantActuel / a.objectif))[0];
  const progressionProjet = projetPhare ? Math.min(100, Math.round((projetPhare.montantActuel / projetPhare.objectif) * 100)) : 0;
  const recentes = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const projection = useMemo(() => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }), [comptes, soldes, transactions, recurrentes, profil]);
  const prochaineEcheance = projection.aVenir?.find((transaction) => transaction.montant < 0);
  const resteProjet = projetPhare ? Math.max(0, projetPhare.objectif - projetPhare.montantActuel) : 0;
  const segments = Array.from({ length: 12 }, (_, index) => index < Math.ceil(progressionProjet / (100 / 12)));

  const ouvrirAjout = (mode = "depense") => window.dispatchEvent(new CustomEvent("pecule:ajouter", { detail: { mode } }));

  return (
    <div className="pecule-home pecule-home--focus space-y-8">
      <header className="pecule-home__header">
        <div className="flex min-w-0 items-center gap-3"><Initiale prenom={profil.prenom} /><div className="min-w-0"><p className="truncate text-sm text-ui-text-secondary">Bonjour</p><h1 className="truncate text-xl font-semibold tracking-[-.045em]">{profil.prenom || "Bienvenue"}</h1></div></div>
        <div className="flex items-center gap-2"><button onClick={() => setRechercheOuverte(true)} aria-label="Rechercher" className="pecule-icon-button">⌕</button><button onClick={() => setReglagesOuverts(true)} aria-label="Ouvrir les réglages" className="pecule-icon-button">⚙</button></div>
      </header>

      <section className="pecule-balance" aria-label="Reste à vivre"><div className="flex items-center justify-between gap-3"><span className="pecule-eyebrow">Reste jusqu’à la paie</span><Link className="pecule-link" href="/comptes">Comptes</Link></div><div className="pecule-balance__amount chiffres"><ChiffresRoulants valeur={projection.reste} /></div><p className="pecule-balance__label">{projection.joursRestants || 0} jours · {euros(Math.max(0, projection.reste / Math.max(1, projection.joursRestants || 1)))} / jour</p></section>

      <section className="pecule-actions pecule-actions--simple" aria-label="Actions rapides"><button onClick={() => ouvrirAjout("depense")} className="pecule-action pecule-action--primary"><span className="pecule-action__icon">＋</span><span>Ajouter une dépense</span></button><Link href="/calendrier" className="pecule-action"><span className="pecule-action__icon">□</span><span>Voir le calendrier</span></Link></section>

      {prochaineEcheance && <Link href="/calendrier" className="pecule-next-payment"><span className="pecule-next-payment__kicker">Prochain paiement</span><span className="pecule-next-payment__name">{prochaineEcheance.libelle || "Paiement à venir"}</span><span className="pecule-next-payment__date">{new Date(`${prochaineEcheance.date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span><strong>{euros(Math.abs(prochaineEcheance.montant))}</strong></Link>}

      {projetPhare ? <Link href="/budgets" className="pecule-goal block"><div className="relative min-w-0"><span className="pecule-eyebrow">Objectif en cours</span><div className="mt-1 flex items-baseline justify-between gap-3"><h2 className="truncate text-xl font-semibold tracking-[-.04em]">{projetPhare.nom}</h2><span className="tnum shrink-0 text-sm font-semibold">{progressionProjet} %</span></div><p className="mt-1 text-sm">{resteProjet > 0 ? `Encore ${euros(resteProjet)} pour y arriver.` : "Objectif atteint — bravo !"}</p><div className="pecule-goal__segments mt-5" aria-label={`${progressionProjet} % de l'objectif atteint`}>{segments.map((active, index) => <i key={index} className={active ? "is-active" : ""} />)}</div><div className="mt-2 flex items-center justify-between text-xs"><span>{euros(projetPhare.montantActuel)} épargnés</span><span>{euros(projetPhare.objectif)}</span></div></div></Link> : <Link href="/budgets" className="pecule-goal pecule-goal--empty block"><span className="text-2xl">✦</span><span><strong>Donne une direction à ton épargne</strong><small>Créer mon premier objectif →</small></span></Link>}

      <section className="pecule-activity"><div className="mb-3 flex items-center justify-between"><div><span className="pecule-eyebrow">Ce qui vient de se passer</span><h2 className="mt-1 text-xl font-semibold tracking-[-.04em]">Activité</h2></div><Link href="/transactions" className="pecule-link">Voir tout</Link></div>{recentes.length ? <ul className="pecule-activity__list">{recentes.map((transaction, index) => <TxRow key={transaction.id} tx={transaction} avecCompte retard={index} />)}</ul> : <p className="pecule-empty">Commence par ajouter une dépense ou un revenu.</p>}</section>
      {rechercheOuverte && <RechercheSheet onFermer={() => setRechercheOuverte(false)} />}
    </div>
  );
}
