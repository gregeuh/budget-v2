"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE, COULEURS, euros, PLAFONDS, dateCourte } from "@/lib/format";
import Sheet from "@/components/Sheet";
import FicheCredit, { mensualitesRestantes } from "@/components/FicheCredit";
import CompteLogo from "@/components/CompteLogo";
import FicheCompteDetail from "@/components/FicheCompte";
import EtatVide from "@/components/EtatVide";

const GROUPES = [
  { id: "courant", label: "Au quotidien" },
  { id: "avantages", label: "Avantages salariés" },
  { id: "epargne", label: "Épargne" },
  { id: "invest", label: "Investissement" },
  { id: "credits", label: "Crédits et prêts" },
];

function FicheCompte({ compte, onFermer }) {
  const { ajouterCompte, modifierCompte, supprimerCompte, ajouterTransaction, soldes } = useBudget();
  const edition = Boolean(compte);
  const [nom, setNom] = useState(compte?.nom || "");
  const [type, setType] = useState(compte?.type || "courant");
  const [solde, setSolde] = useState(compte ? String(compte.soldeInitial) : "");
  const [soldeReel, setSoldeReel] = useState("");
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);

  const soldeCalcule = edition ? (soldes[compte.id] || 0) : 0;
  const diff = soldeReel === "" ? null : (parseFloat(String(soldeReel).replace(",", ".")) || 0) - soldeCalcule;

  const reajuster = async () => {
    if (diff === null || Math.abs(diff) < 0.005) return;
    await ajouterTransaction({
      compteId: compte.id,
      montant: Math.round(diff * 100) / 100,
      categorie: "ajustement",
      libelle: "Ajustement de solde",
    });
    onFermer();
  };

  const valider = async () => {
    const donnees = {
      nom: nom.trim() || TYPES_COMPTE[type].label,
      type,
      soldeInitial: parseFloat(String(solde).replace(",", ".")) || 0,
    };
    if (edition) await modifierCompte(compte.id, donnees);
    else await ajouterCompte(donnees);
    onFermer();
  };

  return (
    <Sheet titre={edition ? "Modifier le compte" : "Nouveau compte"} onFermer={onFermer}>
      <div className="space-y-3">
        {edition && (
          <div className="rounded-ios bg-carte p-4 shadow-carte ring-1 ring-menthe/30">
            <p className="text-sm font-semibold">⚖️ Réajuster le solde</p>
            <p className="mt-0.5 text-xs text-sourdine">
              Solde calculé par l'app : <span className="tnum font-semibold">{euros(soldeCalcule, { precis: true })}</span>.
              Saisis le solde réel de ta banque, l'écart sera enregistré comme un ajustement (sans fausser tes statistiques).
            </p>
            <div className="mt-2.5 flex gap-2">
              <input
                inputMode="decimal"
                placeholder="Solde réel"
                value={soldeReel}
                onChange={(e) => setSoldeReel(e.target.value)}
                className="tnum min-w-0 flex-1 champ px-3 py-2.5 outline-none"
              />
              <button
                onClick={reajuster}
                disabled={diff === null || Math.abs(diff) < 0.005}
                className="rounded-xl bg-menthe-bouton px-4 font-semibold text-white disabled:opacity-40"
              >
                Réajuster
              </button>
            </div>
            {diff !== null && Math.abs(diff) >= 0.005 && (
              <p className="tnum mt-1.5 text-xs font-medium text-menthe-texte">
                Écart : {diff > 0 ? "+" : ""}{euros(diff, { precis: true })}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TYPES_COMPTE).map(([id, t]) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`rounded-pill border px-2.5 py-1.5 text-[13px] font-medium ${type === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}
            >
              {t.icone} {t.label}
            </button>
          ))}
        </div>
        <input
          placeholder={`Nom (ex : ${TYPES_COMPTE[type].label})`}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full champ px-4 py-3 outline-none"
        />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">
            {edition ? "Solde initial (les opérations s'ajoutent dessus)" : "Solde actuel"}
          </span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={solde}
            onChange={(e) => setSolde(e.target.value)}
            className="tnum w-full champ px-4 py-3 outline-none"
          />
        </label>
        <button onClick={valider} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque active:scale-[0.99] transition-transform">
          {edition ? "Enregistrer" : "Créer le compte"}
        </button>
        {edition && (
          <button
            onClick={async () => {
              if (!confirmeSuppr) return setConfirmeSuppr(true);
              await supprimerCompte(compte.id);
              onFermer();
            }}
            className={`w-full rounded-ios py-3 text-sm font-semibold ${confirmeSuppr ? "bg-corail text-contraste" : "text-corail"}`}
          >
            {confirmeSuppr ? "Confirmer la suppression (opérations incluses)" : "Supprimer ce compte"}
          </button>
        )}
      </div>
    </Sheet>
  );
}

export default function Comptes() {
  const { comptes, soldes, credits, transactions } = useBudget();
  const [fiche, setFiche] = useState(null); // null | "nouveau" | compte
  const [detailCompte, setDetailCompte] = useState(null);
  const [ficheCredit, setFicheCredit] = useState(null); // null | "nouveau" | credit

  const total = comptes.reduce((a, c) => a + (soldes[c.id] || 0), 0);
  const totalCredits = credits.reduce((a, c) => a + (c.restant || 0), 0);
  const avantages = comptes
    .filter((c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe === "avantages")
    .reduce((a, c) => a + (soldes[c.id] || 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Espaces</h1>
          <p className="tnum text-sm text-sourdine">
            Total : {euros(total)}{avantages > 0 && ` · hors titres-resto : ${euros(total - avantages)}`}
          </p>
        </div>
        <button onClick={() => setFiche("nouveau")} className="rounded-pill bg-marque-bouton px-4 py-2 text-sm font-semibold text-surMarque">
          + Ajouter
        </button>
      </header>

      {GROUPES.map((g) => {
        const liste = comptes.filter((c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe === g.id);
        if (liste.length === 0) return null;
        const sousTotal = liste.reduce((a, c) => a + (soldes[c.id] || 0), 0);
        return (
          <section key={g.id}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">{g.label}</h2>
              <span className="tnum text-sm font-semibold text-sourdine">{euros(sousTotal)}</span>
            </div>
            <ul className="space-y-2">
              {liste.map((c) => {
                const t = TYPES_COMPTE[c.type] || TYPES_COMPTE.autre;
                const coul = COULEURS[t.couleur];
                const plafond = c.type === "livretA" ? PLAFONDS.livretA : c.type === "ldds" ? PLAFONDS.ldds : null;
                const solde = soldes[c.id] || 0;
                const dernierMouvement = transactions
                  .filter((tx) => tx.compteId === c.id || tx.versId === c.id)
                  .sort((a, b) => b.date.localeCompare(a.date))[0];
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setDetailCompte(c)}
                      className="group w-full rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-4 text-left shadow-v3-soft transition-all active:scale-[0.99]"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: coul.vif,
                        backgroundImage: `linear-gradient(135deg, ${coul.fond}, transparent 58%)`,
                        boxShadow: `0 2px 4px rgba(64, 45, 137, 0.05), 0 12px 28px ${coul.vif}1c`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CompteLogo type={c.type} taille={40} />
                          <div>
                            <div className="truncate font-semibold">{c.nom}</div>
                            <div className="text-xs" style={{ color: coul.texte }}>{t.label}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`chiffres text-lg font-bold ${solde < 0 ? "text-corail" : ""}`}>{euros(solde)}</span>
                          <span aria-hidden="true" className="text-lg text-sourdine transition-transform group-active:translate-x-0.5">›</span>
                        </div>
                      </div>
                      {plafond && (
                        <div className="mt-3">
                          <div className="h-1.5 overflow-hidden rounded-full bg-voile">
                            <div className="jauge-in h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (solde / plafond) * 100))}%`, background: coul.vif }} />
                          </div>
                          <p className="mt-1 text-xs text-sourdine">{Math.max(0, Math.round((solde / plafond) * 100))} % du plafond ({euros(plafond)})</p>
                        </div>
                      )}
                      {dernierMouvement && (
                        <p className="mt-3 truncate border-t border-bordure pt-2 text-xs text-sourdine">
                          Dernier mouvement · {dernierMouvement.libelle || "Opération"} · {dateCourte(dernierMouvement.date)}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {comptes.length === 0 && (
        <EtatVide
          icone="💳"
          titre="Ajoute ton premier compte"
          description="Compte courant, Revolut, Swile ou Livret A : tout ton patrimoine sera ensuite visible au même endroit."
          actionLabel="Ajouter un compte"
          onAction={() => setFiche("nouveau")}
        />
      )}

      {/* Crédits */}
      <section id="credits" className="scroll-mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Crédits en cours</h2>
          <button onClick={() => setFicheCredit("nouveau")} className="text-sm font-medium text-marque">+ Crédit</button>
        </div>
        {credits.length === 0 ? (
          <EtatVide
            compact
            icone="🏦"
            titre="Aucun crédit suivi"
            description="Ajoute un prêt pour suivre le restant dû et sa date de fin."
            actionLabel="Ajouter un crédit"
            onAction={() => setFicheCredit("nouveau")}
          />
        ) : (
          <ul className="space-y-2">
            {credits.map((c) => {
              const n = mensualitesRestantes(c.restant, c.mensualite, c.taux);
              return (
                <li key={c.id}>
                  <button onClick={() => setFicheCredit(c)} className="w-full rounded-ios bg-carte p-4 text-left shadow-carte active:scale-[0.99] transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-corail-pale text-xl">🏦</span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{c.nom}</div>
                          <div className="text-xs text-sourdine">
                            {euros(c.mensualite)} / mois{n ? ` · fin ≈ ${new Date(Date.now() + n * 30.44 * 86400000).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : ""}
                          </div>
                        </div>
                      </div>
                      <span className="chiffres text-lg font-bold text-corail-texte">−{euros(c.restant)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {fiche && <FicheCompte compte={fiche === "nouveau" ? null : fiche} onFermer={() => setFiche(null)} />}
      {detailCompte && (
        <FicheCompteDetail
          compte={detailCompte}
          onFermer={() => setDetailCompte(null)}
          onModifier={() => { setDetailCompte(null); setFiche(detailCompte); }}
        />
      )}
      {ficheCredit && <FicheCredit credit={ficheCredit === "nouveau" ? null : ficheCredit} onFermer={() => setFicheCredit(null)} />}
    </div>
  );
}
