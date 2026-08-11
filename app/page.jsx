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
import CourbeProjection from "@/components/CourbeProjection";

const RechercheSheet = dynamic(() => import("@/components/RechercheSheet"), { ssr: false });

export default function Accueil() {
  const { comptes, transactions, soldes, profil, credits, projets, recurrentes, budgets, categories, setReglagesOuverts } = useBudget();
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
  const tauxReste = projection.dispo > 0 ? Math.max(0, Math.min(100, Math.round((projection.reste / projection.dispo) * 100))) : 0;
  const rythme = projection.reste < 0
    ? { titre: "Reste à protéger", detail: "Tes échéances dépassent le disponible", couleur: "text-corail", fond: "bg-corail-pale", icone: "◔" }
    : projection.parJour < 15
      ? { titre: "Rythme à surveiller", detail: `${euros(projection.parJour)} par jour jusqu’à la paie`, couleur: "text-ambre-texte", fond: "bg-ambre-pale", icone: "◔" }
      : { titre: "Rythme confortable", detail: `${euros(projection.parJour)} par jour jusqu’à la paie`, couleur: "text-menthe-texte", fond: "bg-menthe-pale", icone: "◔" };
  const progressionProjet = projetPhare?.objectif > 0
    ? Math.min(100, Math.round((projetPhare.montantActuel / projetPhare.objectif) * 100))
    : null;
  const budgetVigilance = Object.entries(budgets || {})
    .map(([id, limite]) => ({ id, limite, depense: s.parCategorie[id] || 0, ratio: limite > 0 ? (s.parCategorie[id] || 0) / limite : 0 }))
    .filter((b) => b.limite > 0 && b.ratio >= 0.8)
    .sort((a, b) => b.ratio - a.ratio)[0];
  const prochaineEcheance = [...(projection.aVenir || [])].sort((a, b) => a.date.localeCompare(b.date))[0];
  const actionsDuJour = [
    budgetVigilance && {
      href: "/budgets",
      icone: categories[budgetVigilance.id]?.icone || "🎯",
      titre: budgetVigilance.ratio >= 1 ? `Budget ${categories[budgetVigilance.id]?.label || ""} dépassé` : `Surveiller ${categories[budgetVigilance.id]?.label || "ce budget"}`,
      detail: budgetVigilance.ratio >= 1 ? `Dépassement de ${euros(budgetVigilance.depense - budgetVigilance.limite)}` : `${Math.round(budgetVigilance.ratio * 100)} % déjà utilisé`,
      ton: "corail",
    },
    prochaineEcheance && {
      href: "/transactions",
      icone: "🗓️",
      titre: prochaineEcheance.libelle || "Échéance à venir",
      detail: `Prévu le ${new Date(prochaineEcheance.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${euros(Math.abs(prochaineEcheance.montant))}`,
      ton: "marque",
    },
    projetPhare && progressionProjet !== null && progressionProjet < 100 && {
      href: "/budgets",
      icone: projetPhare.icone || "🎯",
      titre: `Faire avancer ${projetPhare.nom}`,
      detail: `Encore ${euros(Math.max(0, projetPhare.objectif - projetPhare.montantActuel))}`,
      ton: "menthe",
    },
  ].filter(Boolean).slice(0, 3);

  return (
    <div className="dashboard-v3 space-y-5 sm:space-y-6">
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
              {accueil.mot}{profil.prenom ? ` ${profil.prenom}` : ""} ✦
            </span>
            <span className={`chiffres shrink-0 pl-2 text-base font-bold ${patrimoine < 0 ? "text-corail" : ""}`}>{euros(patrimoine)}</span>
          </div>
        </div>
      </div>

      <header className="flex items-center justify-between px-1">
        <div>
          <p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">Ton mois en un regard</p>
          <h1 className="mt-0.5 text-v3-title font-semibold tracking-tight">{accueil.mot}{profil.prenom ? ` ${profil.prenom.slice(0, 20)}` : ""} ✦</h1>
        </div>
        <button onClick={() => setReglagesOuverts(true)} aria-label="Ouvrir les réglages" className="tappable flex h-11 w-11 items-center justify-center rounded-full border border-ui-hairline bg-ui-surface-floating text-lg shadow-v3-soft backdrop-blur-v3-glass">⚙️</button>
      </header>

      <section className="dashboard-in relative overflow-hidden rounded-v3-xl bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))] px-5 py-5 sm:px-6 sm:py-6 text-white shadow-v3-medium">
        <div className="reflet opacity-70" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-v3-caption font-medium text-white/70">Reste à vivre</p>
              <div className="chiffres mt-2 text-v3-hero"><ChiffresRoulants valeur={projection.reste} /></div>
            </div>
            <span className="rounded-pill bg-white/15 px-3 py-1.5 text-v3-caption font-semibold backdrop-blur-v3-glass">{joursAvantSalaire === null ? "30 jours" : joursAvantSalaire === 0 ? "Jour de paie" : `${joursAvantSalaire} j.`}</span>
          </div>
          <p className="mt-2 text-v3-caption text-white/75">{projection.reste < 0 ? "Tes échéances à venir dépassent le disponible." : `Tu as environ ${euros(projection.parJour)} par jour jusqu’à la paie.`}</p>
          <CourbeProjection evolution={projection.evolution} horizonISO={projection.horizonISO} />
          <div className="mt-3 border-t border-white/20 pt-3">
            <div className="mb-1.5 flex items-center justify-between text-v3-caption text-white/70">
              <span>{joursAvantSalaire === null ? "Horizon de 30 jours" : "Budget préservé jusqu’à la paie"}</span>
              <span className="tnum font-semibold text-white">{tauxReste} %</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className={`jauge-in h-full rounded-full ${projection.reste < 0 ? "bg-corail" : "bg-white"}`} style={{ width: `${tauxReste}%` }} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
            <div><p className="text-v3-caption text-white/65">Disponible</p><p className="tnum mt-0.5 text-sm font-semibold">{euros(projection.dispo)}</p></div>
            <div className="border-l border-white/20 pl-4"><p className="text-v3-caption text-white/65">À venir</p><p className="tnum mt-0.5 text-sm font-semibold">−{euros(projection.prevu)}</p></div>
          </div>
          <Link href="/transactions" className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-sm font-semibold text-white/90 active:text-white">
            <span>Voir les prévisions</span>
            <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      {(avantages > 0 || totalCredits > 0) && <p className="px-1 text-v3-caption text-ui-text-secondary">{avantages > 0 && `Hors titres-resto (${euros(avantages)})`}{avantages > 0 && totalCredits > 0 && " · "}{totalCredits > 0 && `Hors crédits (−${euros(totalCredits)})`}</p>}

      {actionsDuJour.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1"><h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">À faire aujourd’hui</h2><Link href="/conseils" className="text-sm font-medium text-marque">Voir le coach</Link></div>
          <div className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft">
            {actionsDuJour.map((action, index) => (
              <Link key={`${action.titre}-${index}`} href={action.href} className={`tappable flex items-center gap-3 px-4 py-3.5 ${index ? "border-t border-ui-hairline" : ""}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${action.ton === "corail" ? "bg-corail-pale" : action.ton === "menthe" ? "bg-menthe-pale" : "bg-marque-pale"}`}>{action.icone}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{action.titre}</span><span className="block truncate text-xs text-sourdine">{action.detail}</span></span>
                <span className="text-sourdine">›</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-v3-l border border-ui-hairline bg-ui-surface-floating p-4 shadow-v3-soft">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-marque">Ton espace d’organisation</p><h2 className="mt-1 font-semibold">Décider plus vite</h2><p className="mt-1 text-xs leading-4 text-sourdine">Prépare le mois, traite les alertes et automatise ce qui revient.</p></div><Link href="/pilotage" className="shrink-0 rounded-pill bg-marque-pale px-3 py-2 text-xs font-semibold text-marque-texte">Tout voir</Link></div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Link href="/plan" className="rounded-v3-s bg-ui-surface-raised p-2.5 text-center active:scale-[.98]"><span className="block text-lg">☷</span><span className="mt-1 block text-[11px] font-semibold">Plan</span></Link>
          <Link href="/inbox" className="rounded-v3-s bg-ui-surface-raised p-2.5 text-center active:scale-[.98]"><span className="block text-lg">◉</span><span className="mt-1 block text-[11px] font-semibold">À traiter</span></Link>
          <Link href="/abonnements" className="rounded-v3-s bg-ui-surface-raised p-2.5 text-center active:scale-[.98]"><span className="block text-lg">↻</span><span className="mt-1 block text-[11px] font-semibold">Abonnements</span></Link>
        </div>
      </section>

      <button
        onClick={() => setRechercheOuverte(true)}
        className="flex w-full items-center gap-2.5 rounded-pill border border-bordure bg-carte px-4 py-2.5 text-left text-sm text-sourdine shadow-carte active:scale-[0.99] transition-transform"
      >
        <span>🔍</span>
        <span>Rechercher une opération, un montant…</span>
      </button>

      {rechercheOuverte && <RechercheSheet onFermer={() => setRechercheOuverte(false)} />}

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
            {recentes.slice(0, 3).map((t, i) => <TxRow key={t.id} tx={t} avecCompte retard={i} />)}
          </ul>
        )}
      </section>

      <PremiersPas onAjouter={() => document.querySelector("[data-bouton-ajout]")?.click()} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Mes comptes</h2>
          <Link href="/comptes" className="text-sm font-medium text-marque">Gérer</Link>
        </div>
        <CarrouselComptes onChange={setCompteActif} />
      </section>

      <section className="dashboard-in space-y-2" style={{ animationDelay: "70ms" }}>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Ton rythme</h2>
          <Link href="/transactions" className="text-sm font-medium text-marque">Prévisions</Link>
        </div>
        <div className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft">
          <Link href="/transactions" className="flex items-center gap-3 px-4 py-3.5 active:bg-ui-surface-raised">
            <span className="relative grid h-12 w-12 shrink-0 place-items-center" aria-label={`${tauxReste} % du disponible préservé`}>
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90" aria-hidden="true">
                <path d="M18 3.9a14.1 14.1 0 1 1 0 28.2a14.1 14.1 0 1 1 0-28.2" fill="none" stroke="var(--c-voile)" strokeWidth="3.2" />
                <path className="dashboard-ring" d="M18 3.9a14.1 14.1 0 1 1 0 28.2a14.1 14.1 0 1 1 0-28.2" fill="none" stroke={projection.reste < 0 ? "var(--corail)" : "var(--menthe)"} strokeWidth="3.2" strokeLinecap="round" pathLength="100" strokeDasharray={`${tauxReste} 100`} />
              </svg>
              <span className={`absolute text-[10px] font-bold ${rythme.couleur}`}>{tauxReste}%</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{rythme.titre}</span>
              <span className="mt-0.5 block truncate text-v3-caption text-ui-text-secondary">{rythme.detail}</span>
            </span>
            <span className={`tnum text-sm font-bold ${rythme.couleur}`}>{tauxReste} %</span>
            <span className="text-ui-text-secondary">›</span>
          </Link>
          {projetPhare && progressionProjet !== null && (
            <Link href="/budgets" className="flex items-center gap-3 border-t border-ui-hairline px-4 py-3.5 active:bg-ui-surface-raised">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marque-pale text-xl">{projetPhare.icone}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{projetPhare.nom}</span>
                <span className="mt-0.5 block text-v3-caption text-ui-text-secondary">Objectif d’épargne</span>
              </span>
              <span className="tnum text-sm font-bold text-marque-texte">{progressionProjet} %</span>
              <span className="text-ui-text-secondary">›</span>
            </Link>
          )}
        </div>
        <Link href="/conseils" className="flex items-center gap-3 rounded-v3-m bg-[linear-gradient(135deg,var(--marque-pale),var(--ui-surface-floating))] px-4 py-3.5 shadow-v3-soft active:scale-[0.99] transition-transform">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--marque),var(--marque-texte))] text-2xl text-white shadow-v3-soft">✦</span>
          <span className="min-w-0 flex-1">
            <span className="text-v3-caption font-semibold uppercase tracking-[0.12em] text-marque">Conseil du jour</span>
            <span className="mt-0.5 block text-sm font-semibold">{projection.reste < 0 ? "Réduire les dépenses à venir en priorité" : "Garde ce rythme pour préserver ton épargne"}</span>
            <span className="mt-0.5 block text-v3-caption text-ui-text-secondary">Recommandations personnalisées <span className="text-marque">›</span></span>
          </span>
        </Link>
      </section>

      <Accroches />

      <MoisSelecteur mois={mois} onChanger={setMois} revenus={s.revenus} depenses={s.depenses} />

      <Analyses comptes={comptesPatrimoine} transactions={transactions} mois={mois} />

    </div>
  );
}
