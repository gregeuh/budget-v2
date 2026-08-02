"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, moisLabel, aujourdhui, TYPES_COMPTE } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import { cleMois } from "@/lib/format";
import CarrouselComptes from "@/components/CarrouselComptes";
import TxRow from "@/components/TxRow";
import ChiffresRoulants from "@/components/ChiffresRoulants";
import MoisSelecteur from "@/components/MoisSelecteur";
import PremiersPas from "@/components/PremiersPas";
import Analyses from "@/components/Analyses";
import Accroches from "@/components/Accroches";
import { messageAccueil } from "@/lib/messagesAccueil";
import { calculerProjection } from "@/lib/projection";

const RechercheSheet = dynamic(() => import("@/components/RechercheSheet"), { ssr: false });

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
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
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
    <div className="space-y-6">
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
            <span className="min-w-0 truncate text-sm font-semibold">
              {accueil.mot}{profil.prenom ? ` ${profil.prenom}` : ""} {accueil.emoji}
            </span>
            <span className={`chiffres shrink-0 pl-2 text-base font-bold ${patrimoine < 0 ? "text-corail" : ""}`}>{euros(patrimoine)}</span>
          </div>
        </div>
      </div>

      <header className="flex items-center justify-between px-1">
        <div>
          <p className="text-v3-caption font-medium text-ui-text-secondary">{moisLabel(mois)}</p>
          <h1 className="mt-0.5 text-v3-title font-semibold tracking-tight">{accueil.mot}{profil.prenom ? ` ${profil.prenom.slice(0, 20)}` : ""} {accueil.emoji}</h1>
        </div>
        <button onClick={() => setReglagesOuverts(true)} aria-label="Ouvrir les réglages" className="tappable flex h-11 w-11 items-center justify-center rounded-full border border-ui-hairline bg-ui-surface-floating text-lg shadow-v3-soft backdrop-blur-v3-glass">⚙️</button>
      </header>

      <section className="relative overflow-hidden rounded-v3-xl bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))] px-6 py-6 text-white shadow-v3-medium">
        <div className="reflet opacity-70" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-v3-caption font-medium text-white/70">Patrimoine net</p>
              <div className={`chiffres mt-2 text-v3-hero ${patrimoine < 0 ? "text-white" : ""}`}><ChiffresRoulants valeur={patrimoine} /></div>
            </div>
            <span className="rounded-pill bg-white/15 px-3 py-1.5 text-v3-caption font-semibold backdrop-blur-v3-glass">Ce mois-ci</span>
          </div>
          <p className="mt-2 text-v3-caption text-white/75">{accueil.phrase}</p>
          <svg viewBox="0 0 320 68" className="mt-5 h-16 w-full" role="img" aria-label="Tendance décorative du patrimoine">
            <defs><linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity=".26"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient></defs>
            <path d="M0 53 C36 45 52 54 83 39 S130 45 159 30 S214 37 242 18 S285 26 320 7 L320 68 L0 68 Z" fill="url(#hero-area)" />
            <path d="M0 53 C36 45 52 54 83 39 S130 45 159 30 S214 37 242 18 S285 26 320 7" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="320" cy="7" r="4" fill="white" />
          </svg>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
            <div><p className="text-v3-caption text-white/65">Revenus</p><p className="tnum mt-0.5 text-sm font-semibold">+{euros(s.revenus)}</p></div>
            <div className="border-l border-white/20 pl-4"><p className="text-v3-caption text-white/65">Dépenses</p><p className="tnum mt-0.5 text-sm font-semibold">−{euros(s.depenses)}</p></div>
          </div>
        </div>
      </section>

      {(avantages > 0 || totalCredits > 0) && <p className="px-1 text-v3-caption text-ui-text-secondary">{avantages > 0 && `Hors titres-resto (${euros(avantages)})`}{avantages > 0 && totalCredits > 0 && " · "}{totalCredits > 0 && `Hors crédits (−${euros(totalCredits)})`}</p>}

      <button
        onClick={() => setRechercheOuverte(true)}
        className="flex w-full items-center gap-2.5 rounded-pill border border-bordure bg-carte px-4 py-2.5 text-left text-sm text-sourdine shadow-carte active:scale-[0.99] transition-transform"
      >
        <span>🔍</span>
        <span>Rechercher une opération, un montant…</span>
      </button>

      {rechercheOuverte && <RechercheSheet onFermer={() => setRechercheOuverte(false)} />}

      <PremiersPas onAjouter={() => document.querySelector("[data-bouton-ajout]")?.click()} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Mes comptes</h2>
          <Link href="/comptes" className="text-sm font-medium text-marque">Gérer</Link>
        </div>
        <CarrouselComptes onChange={setCompteActif} />
      </section>

      <Accroches />

      <MoisSelecteur mois={mois} onChanger={setMois} revenus={s.revenus} depenses={s.depenses} />

      {joursAvantSalaire !== null && (
        <Link href="/transactions" className={`block rounded-ios px-3.5 py-2.5 text-sm font-medium shadow-carte ${projection.reste < 0 ? "bg-corail-pale text-corail-texte" : "bg-carte"}`}>
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
        <Link href="/budgets" className="block rounded-ios bg-carte px-4 py-3 shadow-carte">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{projetPhare.icone} {projetPhare.nom}</span>
            <span className="tnum">{Math.min(100, Math.round((projetPhare.montantActuel / projetPhare.objectif) * 100))} %</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-voile">
            <div className="jauge-in h-full rounded-full bg-marque" style={{ width: `${Math.min(100, (projetPhare.montantActuel / projetPhare.objectif) * 100)}%` }} />
          </div>
        </Link>
      )}

      <Analyses comptes={comptesPatrimoine} transactions={transactions} mois={mois} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">
            Dernières opérations
            {compteAffiche && <span className="ml-1.5 text-sm font-medium text-sourdine">· {compteAffiche.nom}</span>}
          </h2>
          <Link href="/transactions" className="text-sm font-medium text-marque">Tout voir</Link>
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
