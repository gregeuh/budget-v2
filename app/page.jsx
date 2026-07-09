"use client";

import Link from "next/link";
import { useBudget } from "@/lib/store";
import { euros, moisLabel, aujourdhui, TYPES_COMPTE } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import { cleMois } from "@/lib/format";
import WalletStack from "@/components/WalletStack";
import SpendChart from "@/components/SpendChart";
import DonutCat from "@/components/DonutCat";
import TxRow from "@/components/TxRow";
import PatrimoineChart from "@/components/PatrimoineChart";
import CountUp from "@/components/CountUp";

export default function Accueil() {
  const { comptes, transactions, soldes, profil, credits, projets } = useBudget();
  const mois = cleMois(aujourdhui());
  const s = statsMois(transactions, mois);
  const totalCredits = credits.reduce((a, c) => a + (c.restant || 0), 0);
  const groupeDe = (c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe;
  const comptesPatrimoine = comptes.filter((c) => groupeDe(c) !== "avantages");
  const avantages = comptes.filter((c) => groupeDe(c) === "avantages").reduce((a, c) => a + (soldes[c.id] || 0), 0);
  const patrimoine = comptesPatrimoine.reduce((a, c) => a + (soldes[c.id] || 0), 0) - totalCredits;
  const projetPhare = [...projets].sort((a, b) => (b.montantActuel / (b.objectif || 1)) - (a.montantActuel / (a.objectif || 1)))[0];
  const recentes = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Compte à rebours du salaire + reste à vivre
  let joursAvantSalaire = null;
  let resteAVivre = null;
  if (profil.jourSalaire >= 1) {
    const auj = new Date();
    const dernierJourMois = new Date(auj.getFullYear(), auj.getMonth() + 1, 0).getDate();
    let prochaine = new Date(auj.getFullYear(), auj.getMonth(), Math.min(profil.jourSalaire, dernierJourMois));
    if (prochaine <= auj && prochaine.getDate() !== auj.getDate()) {
      const djm2 = new Date(auj.getFullYear(), auj.getMonth() + 2, 0).getDate();
      prochaine = new Date(auj.getFullYear(), auj.getMonth() + 1, Math.min(profil.jourSalaire, djm2));
    }
    joursAvantSalaire = Math.max(0, Math.round((prochaine - auj) / 86400000));
    const soldesCourants = comptes
      .filter((c) => !["livretA", "ldds", "pea"].includes(c.type))
      .reduce((a, c) => a + (soldes[c.id] || 0), 0);
    resteAVivre = Math.max(0, soldesCourants);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-sourdine">
            {new Date().getHours() < 6 || new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour"}
            {profil.prenom ? ` ${profil.prenom}` : ""} {new Date().getHours() < 6 || new Date().getHours() >= 18 ? "🌙" : "☀️"} · {moisLabel(aujourdhui())}
          </p>
          <h1 className="chiffres text-[44px] font-bold leading-tight"><CountUp valeur={patrimoine} /></h1>
          <p className="text-sm text-sourdine">
            Patrimoine net
            {totalCredits > 0 && ` · crédits déduits (${euros(totalCredits)})`}
            {avantages > 0 && ` · hors titres-resto (${euros(avantages)})`}
          </p>
        </div>
        <Link href="/reglages" aria-label="Réglages" className="flex h-10 w-10 items-center justify-center rounded-full bg-carte text-lg shadow-carte">⚙️</Link>
      </header>

      <div className="pop-in grid grid-cols-2 gap-3">
        <div className="rounded-ios bg-menthe-pale p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-menthe-texte">Entrées du mois</p>
          <p className="chiffres mt-0.5 text-xl font-bold text-menthe-texte">{euros(s.revenus)}</p>
        </div>
        <div className="rounded-ios bg-corail-pale p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-corail-texte">Sorties du mois</p>
          <p className="chiffres mt-0.5 text-xl font-bold text-corail-texte">{euros(s.depenses)}</p>
        </div>
      </div>

      {joursAvantSalaire !== null && (
        <div className="rounded-ios bg-ciel-pale px-4 py-3 text-sm font-medium text-ciel-texte">
          💼 {joursAvantSalaire === 0 ? "Jour de salaire !" : `Salaire dans ${joursAvantSalaire} jour${joursAvantSalaire > 1 ? "s" : ""}`}
          {resteAVivre !== null && joursAvantSalaire > 0 && (
            <span className="block text-xs opacity-80">
              Reste à vivre : {euros(resteAVivre)}, soit ~{euros(resteAVivre / joursAvantSalaire)} / jour
            </span>
          )}
        </div>
      )}

      {projetPhare && projetPhare.objectif > 0 && (
        <Link href="/budgets" className="block rounded-ios bg-lavande-pale px-4 py-3">
          <div className="flex items-center justify-between text-sm font-medium text-lavande-texte">
            <span>{projetPhare.icone} {projetPhare.nom}</span>
            <span className="tnum">{Math.min(100, Math.round((projetPhare.montantActuel / projetPhare.objectif) * 100))} %</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-carte/60">
            <div className="h-full rounded-full bg-lavande" style={{ width: `${Math.min(100, (projetPhare.montantActuel / projetPhare.objectif) * 100)}%` }} />
          </div>
        </Link>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Mes comptes</h2>
          <Link href="/comptes" className="text-sm font-medium text-ciel">Gérer</Link>
        </div>
        <WalletStack />
      </section>

      <div className="pt-4">
        <PatrimoineChart comptes={comptesPatrimoine} transactions={transactions} />
      </div>

      <SpendChart transactions={transactions} />

      <DonutCat transactions={transactions} mois={mois} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Dernières opérations</h2>
          <Link href="/transactions" className="text-sm font-medium text-ciel">Tout voir</Link>
        </div>
        {recentes.length === 0 ? (
          <p className="rounded-ios bg-carte p-5 text-center text-sm text-sourdine shadow-carte">
            Ajoute ta première opération avec le bouton +
          </p>
        ) : (
          <ul className="space-y-2">
            {recentes.map((t) => <TxRow key={t.id} tx={t} avecCompte />)}
          </ul>
        )}
      </section>
    </div>
  );
}
