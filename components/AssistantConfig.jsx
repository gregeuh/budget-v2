"use client";

import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, isoLocal, toutesCategories } from "@/lib/format";
import { detecterRecurrences } from "@/lib/detection";
import Sheet from "./Sheet";
import PointsSautillants from "./PointsSautillants";

const CHARGES_MANUELLES = [
  { cle: "loyer", icone: "🏠", label: "Loyer / crédit immo", categorie: "logement" },
  { cle: "energie", icone: "💡", label: "Électricité / gaz", categorie: "factures" },
  { cle: "internet", icone: "📶", label: "Internet / mobile", categorie: "abonnements" },
  { cle: "assurance", icone: "🛡️", label: "Assurances", categorie: "factures" },
  { cle: "streaming", icone: "🎬", label: "Streaming", categorie: "abonnements" },
  { cle: "transport", icone: "🚇", label: "Transport", categorie: "transport" },
];

function prochaineDuJour(jour) {
  const auj = new Date();
  const dernier = (a, m) => new Date(a, m + 1, 0).getDate();
  let d = new Date(auj.getFullYear(), auj.getMonth(), Math.min(jour, dernier(auj.getFullYear(), auj.getMonth())));
  if (d < new Date(auj.getFullYear(), auj.getMonth(), auj.getDate())) {
    d = new Date(auj.getFullYear(), auj.getMonth() + 1, Math.min(jour, dernier(auj.getFullYear(), auj.getMonth() + 1)));
  }
  return isoLocal(d);
}

// Nettoyage local du libellé (repli quand l'IA n'est pas utilisée)
function joliLibelle(brut = "") {
  const mots = brut
    .replace(/\d{2}[\/\-.]\d{2}([\/\-.]\d{2,4})?/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\b(PRLV|SEPA|VIR|CB|MANDAT|REF|FACTURE|PRELEVEMENT)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3);
  const s = mots.join(" ").toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Opération";
}

export default function AssistantConfig({ onFermer }) {
  const { comptes, transactions, recurrentes, profil, sauverApp, ajouterRecurrente, notifier } = useBudget();

  const compteParDefaut = comptes.find((c) => c.type === "courant")?.id || comptes[0]?.id || "";

  const [etape, setEtape] = useState(1);
  const [montantSalaire, setMontantSalaire] = useState(profil.revenuMensuel ? String(profil.revenuMensuel) : "");
  const [jourSalaire, setJourSalaire] = useState(profil.jourSalaire || 2);
  const [compteSalaire, setCompteSalaire] = useState(compteParDefaut);

  const [propositions, setPropositions] = useState([]);
  const [manuelles, setManuelles] = useState({});
  const [compteCharges, setCompteCharges] = useState(compteParDefaut);
  const [jourManuel, setJourManuel] = useState(5);
  const [analyseIA, setAnalyseIA] = useState(false);
  const [observation, setObservation] = useState("");
  const [erreurIA, setErreurIA] = useState("");
  const [enCours, setEnCours] = useState(false);

  const salaireExistant = recurrentes.some((r) => r.actif !== false && r.montant > 0);

  // Détection par règles : instantanée et gratuite
  const detectees = useMemo(() => detecterRecurrences(transactions), [transactions]);

  useEffect(() => {
    const charges = detectees.filter((d) => !d.revenu);
    setPropositions(
      charges.map((d, i) => ({
        id: `regle-${i}`,
        libelle: joliLibelle(d.libelle),
        montant: d.montantMedian,
        jour: d.jour,
        categorie: d.categorie,
        note: `${d.occurrences} fois détecté${d.variable ? " · montant variable" : ""}`,
        coche: d.confiance >= 0.6,
        source: "regles",
      }))
    );
    const revenu = detectees.find((d) => d.revenu);
    if (revenu && !profil.revenuMensuel) {
      setMontantSalaire(String(Math.abs(revenu.montantMedian)));
      setJourSalaire(revenu.jour);
      if (comptes.some((c) => c.id === revenu.compteId)) setCompteSalaire(revenu.compteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectees]);

  const lancerIA = async () => {
    setAnalyseIA(true);
    setErreurIA("");
    try {
      const recentes = [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 200)
        .map((t) => ({ date: t.date, montant: t.montant, libelle: (t.libelle || "").slice(0, 40), categorie: t.categorie }));

      const r = await fetch("/api/analyser", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          candidats: detectees.map((d) => ({
            libelle: d.libelle, montant: d.montantMedian, jour: d.jour,
            categorie: d.categorie, occurrences: d.occurrences,
          })),
          operations: recentes,
          categoriesDisponibles: Object.fromEntries(Object.entries(toutesCategories).map(([k, c]) => [k, c.label])),
        }),
      });

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreurIA(r.status === 503 ? "Clé API non configurée sur Vercel." : d.erreur || "L'analyse a échoué.");
        return;
      }

      const data = await r.json();
      const charges = (data.recurrences || []).filter((x) => x.type === "charge");
      if (charges.length > 0) {
        setPropositions(
          charges.map((x, i) => ({
            id: `ia-${i}`,
            libelle: x.libelle,
            montant: x.montant,
            jour: x.jour,
            categorie: toutesCategories[x.categorie] ? x.categorie : "autre",
            note: x.note || `Confiance ${Math.round(x.confiance * 100)} %`,
            coche: x.confiance >= 0.6,
            source: "ia",
          }))
        );
      }
      const revenu = (data.recurrences || []).find((x) => x.type === "revenu");
      if (revenu && !montantSalaire) {
        setMontantSalaire(String(revenu.montant));
        setJourSalaire(revenu.jour);
      }
      setObservation(data.observation || "");
    } catch {
      setErreurIA("Connexion impossible.");
    } finally {
      setAnalyseIA(false);
    }
  };

  const basculer = (id) => setPropositions((l) => l.map((p) => (p.id === id ? { ...p, coche: !p.coche } : p)));
  const majMontant = (id, v) =>
    setPropositions((l) => l.map((p) => (p.id === id ? { ...p, montant: -Math.abs(parseFloat(String(v).replace(",", ".")) || 0) } : p)));

  const valeurSalaire = parseFloat(String(montantSalaire).replace(",", ".")) || 0;
  const totalDetecte = propositions.filter((p) => p.coche).reduce((a, p) => a + Math.abs(p.montant), 0);
  const totalManuel = Object.values(manuelles).reduce((a, v) => a + (parseFloat(String(v).replace(",", ".")) || 0), 0);
  const totalCharges = totalDetecte + totalManuel;
  const reste = valeurSalaire - totalCharges;

  const terminer = async () => {
    setEnCours(true);
    try {
      await sauverApp(undefined, {
        ...profil,
        revenuMensuel: valeurSalaire || profil.revenuMensuel || 0,
        jourSalaire: Number(jourSalaire) || profil.jourSalaire || 0,
      });

      if (valeurSalaire > 0 && !salaireExistant && compteSalaire) {
        await ajouterRecurrente(
          {
            compteId: compteSalaire,
            montant: valeurSalaire,
            categorie: "salaire",
            libelle: "Salaire",
            frequence: "mensuelle",
            prochaine: prochaineDuJour(Number(jourSalaire)),
          },
          { silencieux: true }
        );
      }

      for (const p of propositions.filter((x) => x.coche && Math.abs(x.montant) > 0)) {
        await ajouterRecurrente(
          {
            compteId: compteCharges,
            montant: -Math.abs(p.montant),
            categorie: toutesCategories[p.categorie] ? p.categorie : "autre",
            libelle: p.libelle,
            frequence: "mensuelle",
            prochaine: prochaineDuJour(p.jour),
          },
          { silencieux: true }
        );
      }

      for (const c of CHARGES_MANUELLES) {
        const val = parseFloat(String(manuelles[c.cle] || "").replace(",", ".")) || 0;
        if (val <= 0) continue;
        await ajouterRecurrente(
          {
            compteId: compteCharges,
            montant: -val,
            categorie: c.categorie,
            libelle: c.label.split(" / ")[0],
            frequence: "mensuelle",
            prochaine: prochaineDuJour(Number(jourManuel)),
          },
          { silencieux: true }
        );
      }

      notifier("Configuration enregistrée 🎉", "✓");
      onFermer();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Sheet titre={etape === 1 ? "Ton salaire" : "Tes charges fixes"} onFermer={onFermer}>
      {etape === 1 ? (
        <div className="pop-in space-y-3">
          <p className="text-sm text-sourdine">
            Sans tes revenus, l&apos;app ne peut calculer ni ton reste à vivre, ni ton taux d&apos;épargne, ni ton score. Une fois réglé, ton salaire s&apos;ajoutera <strong>tout seul</strong> chaque mois.
          </p>

          {detectees.some((d) => d.revenu) && (
            <p className="rounded-ios bg-menthe-pale px-3.5 py-2.5 text-xs text-menthe-texte">
              ✨ J&apos;ai repéré un revenu récurrent dans ton historique et pré-rempli les champs — vérifie-les.
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Montant net mensuel</span>
            <input
              inputMode="decimal"
              value={montantSalaire}
              onChange={(e) => setMontantSalaire(e.target.value)}
              placeholder="ex : 1840"
              className="chiffres w-full min-w-0 rounded-ios border border-bordure bg-carte px-4 py-3 text-2xl font-bold outline-none focus:border-menthe"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Versé le</span>
              <select value={jourSalaire} onChange={(e) => setJourSalaire(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>{j} du mois</option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Sur</span>
              <select value={compteSalaire} onChange={(e) => setCompteSalaire(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
                {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          </div>

          <button onClick={() => setEtape(2)} disabled={valeurSalaire <= 0} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40">
            Continuer
          </button>
          <button onClick={onFermer} className="w-full py-2 text-sm font-medium text-sourdine">Plus tard</button>
        </div>
      ) : (
        <div className="pop-in space-y-3">
          {propositions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {propositions[0].source === "ia" ? "✨ Analysé par l'IA" : "🔍 Trouvé dans ton historique"}
                </p>
                <span className="text-xs text-sourdine">{propositions.filter((p) => p.coche).length} sélectionnée(s)</span>
              </div>

              <ul className="space-y-2">
                {propositions.map((p) => (
                  <li key={p.id} className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 shadow-carte ${p.coche ? "bg-carte ring-1 ring-menthe/40" : "bg-carte opacity-60"}`}>
                    <button
                      onClick={() => basculer(p.id)}
                      aria-label={p.coche ? "Décocher" : "Cocher"}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${p.coche ? "bg-menthe text-white" : "bg-voile text-sourdine"}`}
                    >
                      {p.coche ? "✓" : ""}
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {(toutesCategories[p.categorie] || toutesCategories.autre).icone} {p.libelle}
                      </span>
                      <span className="block truncate text-[11px] text-sourdine">le {p.jour} · {p.note}</span>
                    </span>
                    <input
                      inputMode="decimal"
                      value={Math.abs(p.montant)}
                      onChange={(e) => majMontant(p.id, e.target.value)}
                      className="tnum w-16 shrink-0 rounded-lg border border-bordure bg-fond px-1.5 py-1 text-right text-sm outline-none focus:border-menthe"
                    />
                    <span className="shrink-0 text-xs text-sourdine">€</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-ios bg-carte p-3.5 text-sm text-sourdine shadow-carte">
              Aucune récurrence détectée dans ton historique — normal si tu débutes. Saisis tes charges ci-dessous, ou importe ton relevé bancaire puis relance l&apos;assistant.
            </p>
          )}

          {transactions.length >= 5 && (
            <div>
              <button
                onClick={lancerIA}
                disabled={analyseIA}
                className="flex w-full items-center justify-center gap-2 rounded-ios bg-lavande-pale py-2.5 text-sm font-semibold text-lavande-texte disabled:opacity-60"
              >
                {analyseIA ? (
                  <>
                    <PointsSautillants taille={5} couleur="var(--lavande-texte)" />
                    <span>Analyse en cours</span>
                  </>
                ) : (
                  <span>✨ Affiner avec l&apos;IA</span>
                )}
              </button>
              {erreurIA && <p className="mt-1 text-xs text-corail">{erreurIA}</p>}
              {observation && <p className="mt-1.5 rounded-ios bg-ciel-pale px-3 py-2 text-xs text-ciel-texte">💡 {observation}</p>}
            </div>
          )}

          <details className="rounded-ios bg-carte p-3.5 shadow-carte">
            <summary className="cursor-pointer text-sm font-semibold">➕ Ajouter à la main</summary>
            <div className="mt-2.5 space-y-2">
              {CHARGES_MANUELLES.map((c) => (
                <label key={c.cle} className="flex items-center gap-2.5">
                  <span className="w-7 shrink-0 text-center text-lg">{c.icone}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{c.label}</span>
                  <input
                    inputMode="decimal"
                    value={manuelles[c.cle] || ""}
                    onChange={(e) => setManuelles({ ...manuelles, [c.cle]: e.target.value })}
                    placeholder="—"
                    className="tnum w-16 shrink-0 rounded-lg border border-bordure bg-fond px-1.5 py-1 text-right text-sm outline-none focus:border-menthe"
                  />
                  <span className="shrink-0 text-xs text-sourdine">€</span>
                </label>
              ))}
              <label className="block min-w-0 pt-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Prélevées le</span>
                <select value={jourManuel} onChange={(e) => setJourManuel(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-fond px-3 py-2.5 outline-none">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((j) => (
                    <option key={j} value={j}>{j} du mois</option>
                  ))}
                </select>
              </label>
            </div>
          </details>

          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Compte prélevé</span>
            <select value={compteCharges} onChange={(e) => setCompteCharges(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>

          {valeurSalaire > 0 && (
            <div className="rounded-ios bg-menthe-pale p-3.5">
              <p className="tnum text-sm text-menthe-texte">
                {euros(valeurSalaire)} de revenus − {euros(totalCharges)} de charges fixes
              </p>
              <p className={`chiffres mt-0.5 text-2xl font-bold ${reste < 0 ? "text-corail" : "text-menthe-texte"}`}>{euros(reste)}</p>
              <p className="text-xs text-menthe-texte/80">disponibles chaque mois pour le reste</p>
            </div>
          )}

          <button onClick={terminer} disabled={enCours} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-50">
            {enCours ? "Enregistrement…" : "Terminer la configuration"}
          </button>
          <button onClick={() => setEtape(1)} className="w-full py-2 text-sm font-medium text-sourdine">‹ Retour</button>
        </div>
      )}
    </Sheet>
  );
}
