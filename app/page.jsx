"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, moisLabel, aujourdhui, TYPES_COMPTE } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import { cleMois } from "@/lib/format";
import CarrouselComptes from "@/components/CarrouselComptes";
import SpendChart from "@/components/SpendChart";
import DonutCat from "@/components/DonutCat";
import TxRow from "@/components/TxRow";
import PatrimoineChart from "@/components/PatrimoineChart";
import CountUp from "@/components/CountUp";
import ChiffresRoulants from "@/components/ChiffresRoulants";
import MoisSelecteur from "@/components/MoisSelecteur";
import BilanMensuel from "@/components/BilanMensuel";
import PremiersPas from "@/components/PremiersPas";
import Reveler from "@/components/Reveler";
import { messageAccueil } from "@/lib/messagesAccueil";
import { calculerProjection } from "@/lib/projection";

export default function Accueil() {
  const { comptes, transactions, soldes, profil, credits, projets, recurrentes, setReglagesOuverts } = useBudget();
  const [mois, setMois] = useState(cleMois(aujourdhui()));
  const [compteActif, setCompteActif] = useState(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const surScroll = () => setCompact(window.scrollY > 96);
    window.addEventListener("scroll", surScroll, { passive: true });
    return () => window.removeEventListener("scroll", surScroll);
  }, []);

  const accueil = messageAccueil({ comptes, soldes, profil, transactions });
  const s = statsMois(transactions, mois);
  const totalCredits = credits.reduce((a, c) => a + (c.restant || 0), 0);
  const groupeDe = (c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe;
  const comptesPatrimoine = comptes.filter((c) => groupeDe(c) !== "avantages");
  const avantages = comptes.filter((c) => groupeDe(c) === "avantages").reduce((a, c) => a + (soldes[c.id] || 0), 0);
  const patrimoine = comptesPatrimoine.reduce((a, c) => a + (soldes[c.id] || 0), 0);
  const projetPhare = [...projets].sort((a, b) => (b.montantActuel / (b.objectif || 1)) - (a.montantActuel / (a.objectif || 1)))[0];
  const recentes = [...transactions]
    .filter((t) => !compteActif || t.compteId === compteActif || t.versId === compteActif)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const compteAffiche = comptes.find((c) => c.id === compteActif);

  // Compte à rebours du salaire + reste à vivre
  const projection = useMemo(
    () => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }),
    [comptes, soldes, transactions, recurrentes, profil]
  );
  const joursAvantSalaire = projection.salaireISO ? projection.jours : null;

  return (
    <div className="space-y-4">
      {/* En-tête compact au défilement */}
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto max-w-md transition-all duration-300 ${
          compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div
          className="border-b border-bordure bg-fond/85 px-4 pb-2 backdrop-blur-xl"
          style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">
              {accueil.mot}{profil.prenom ? ` ${profil.prenom}` : ""} {accueil.emoji}
            </span>
            <span className={`chiffres text-base font-bold ${patrimoine < 0 ? "text-corail" : ""}`}>{euros(patrimoine)}</span>
          </div>
        </div>
      </div>

      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-sourdine">
            <span className="font-medium text-encre">
              {accueil.mot}{profil.prenom ? ` ${profil.prenom}` : ""} {accueil.emoji}
            </span>
            {" "}· {accueil.phrase}
          </p>
          <h1 className={`chiffres text-4xl font-bold leading-tight ${patrimoine < 0 ? "text-corail" : ""}`}><ChiffresRoulants valeur={patrimoine} /></h1>
          <p className="text-sm text-sourdine">
            Patrimoine
            {avantages > 0 && ` · hors titres-resto (${euros(avantages)})`}
            {totalCredits > 0 && ` · hors crédits (−${euros(totalCredits)})`}
          </p>
        </div>
        <button onClick={() => setReglagesOuverts(true)} aria-label="Réglages" className="flex h-9 w-9 items-center justify-center rounded-full bg-carte text-base shadow-carte active:scale-95 transition-transform">⚙️</button>
      </header>

      <PremiersPas onAjouter={() => document.querySelector("[data-bouton-ajout]")?.click()} />

      <BilanMensuel />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Mes comptes</h2>
          <Link href="/comptes" className="text-sm font-medium text-ciel">Gérer</Link>
        </div>
        <CarrouselComptes onChange={setCompteActif} />
      </section>

      <MoisSelecteur mois={mois} onChanger={setMois} />

      <div key={mois} className="pop-in grid grid-cols-2 gap-3">
        <div className="rounded-ios bg-menthe-pale p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-menthe-texte">Entrées du mois</p>
          <p className="chiffres mt-0.5 text-lg font-bold text-menthe-texte">{euros(s.revenus)}</p>
        </div>
        <div className="rounded-ios bg-corail-pale p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-corail-texte">Sorties du mois</p>
          <p className="chiffres mt-0.5 text-lg font-bold text-corail-texte">{euros(s.depenses)}</p>
        </div>
      </div>

      {joursAvantSalaire !== null && (
        <Link href="/transactions" className={`block rounded-ios px-3.5 py-2.5 text-sm font-medium ${projection.reste < 0 ? "bg-corail-pale text-corail-texte" : "bg-ciel-pale text-ciel-texte"}`}>
          💼 {joursAvantSalaire === 0 ? "Jour de salaire ! 🎉" : `Salaire dans ${joursAvantSalaire} jour${joursAvantSalaire > 1 ? "s" : ""}`}
          {joursAvantSalaire > 0 && (
            <span className="block text-xs opacity-80">
              Reste à vivre : {euros(projection.reste)}, soit ~{euros(projection.parJour)} / jour
              {projection.prevu > 0 && ` (${euros(projection.prevu)} de prévus déduits)`}
            </span>
          )}
        </Link>
      )}

      {projetPhare && projetPhare.objectif > 0 && (
        <Link href="/budgets" className="block rounded-ios bg-lavande-pale px-4 py-3">
          <div className="flex items-center justify-between text-sm font-medium text-lavande-texte">
            <span>{projetPhare.icone} {projetPhare.nom}</span>
            <span className="tnum">{Math.min(100, Math.round((projetPhare.montantActuel / projetPhare.objectif) * 100))} %</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-carte/60">
            <div className="jauge-in h-full rounded-full bg-lavande" style={{ width: `${Math.min(100, (projetPhare.montantActuel / projetPhare.objectif) * 100)}%` }} />
          </div>
        </Link>
      )}

      <div className="pt-4">
        <Reveler><PatrimoineChart comptes={comptesPatrimoine} transactions={transactions} /></Reveler>
      </div>

      <Reveler retard={60}><SpendChart transactions={transactions} /></Reveler>

      <Reveler retard={120}><DonutCat transactions={transactions} mois={mois} /></Reveler>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">
            Dernières opérations
            {compteAffiche && <span className="ml-1.5 text-sm font-medium text-sourdine">· {compteAffiche.nom}</span>}
          </h2>
          <Link href="/transactions" className="text-sm font-medium text-ciel">Tout voir</Link>
        </div>
        {recentes.length === 0 ? (
          <p className="rounded-ios bg-carte p-5 text-center text-sm text-sourdine shadow-carte">
            {compteAffiche ? `Aucune opération sur ${compteAffiche.nom} pour l'instant.` : "Ajoute ta première opération avec le bouton +"}
          </p>
        ) : (
          <ul className="space-y-2">
            {recentes.map((t, i) => <TxRow key={t.id} tx={t} avecCompte retard={i} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
