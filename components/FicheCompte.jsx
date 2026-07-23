"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE, COULEURS, PLAFONDS, arrondir, euros, cleMois, aujourdhui, dateCourte } from "@/lib/format";
import Sheet from "./Sheet";
import CocheAnimee from "./CocheAnimee";
import TxRow from "./TxRow";

function LigneStat({ label, valeur, couleur = "", dernier = false }) {
  return (
    <div className={`flex items-center justify-between px-3.5 py-3 ${dernier ? "" : "border-b border-bordure"}`}>
      <span className="text-sm text-sourdine">{label}</span>
      <span className={`chiffres text-sm font-bold ${couleur}`}>{valeur}</span>
    </div>
  );
}

export default function FicheCompte({ compte, onFermer }) {
  const { transactions, soldes, ajouterTransaction, notifier } = useBudget();
  const [ajustOuvert, setAjustOuvert] = useState(false);
  const [soldeReel, setSoldeReel] = useState("");
  const [succes, setSucces] = useState(false);
  const minuterie = useRef(null);
  useEffect(() => () => clearTimeout(minuterie.current), []);

  const t = TYPES_COMPTE[compte.type] || TYPES_COMPTE.autre;
  const coul = COULEURS[t.couleur];
  const solde = soldes[compte.id] || 0;
  const plafond = compte.type === "livretA" ? PLAFONDS.livretA : compte.type === "ldds" ? PLAFONDS.ldds : null;

  const stats = useMemo(() => {
    const mois = cleMois(aujourdhui());
    let entrees = 0, sorties = 0;
    const liees = [];
    for (const tx of transactions) {
      const concerne = tx.compteId === compte.id || tx.versId === compte.id;
      if (!concerne) continue;
      liees.push(tx);
      if (!tx.date.startsWith(mois) || tx.horsSolde) continue;
      if (tx.versId) {
        const val = Math.abs(tx.montant);
        if (tx.compteId === compte.id) sorties += val;
        else entrees += val;
      } else if (tx.montant > 0) entrees += tx.montant;
      else sorties += -tx.montant;
    }
    liees.sort((a, b) => b.date.localeCompare(a.date));
    return { entrees, sorties, liees, dernier: liees[0] || null };
  }, [transactions, compte.id]);

  const recentes = stats.liees.filter((tx) => tx.date <= aujourdhui()).slice(0, 15);

  const reel = parseFloat(String(soldeReel).replace(",", "."));
  const ecart = Number.isFinite(reel) ? Math.round((reel - solde) * 100) / 100 : null;

  const ajuster = async () => {
    if (ecart === null || Math.abs(ecart) < 0.005) return;
    await ajouterTransaction({
      compteId: compte.id,
      montant: ecart,
      categorie: "ajustement",
      libelle: "Ajustement de solde",
      date: aujourdhui(),
    }, { silencieux: true });
    notifier(`Solde ajusté (${ecart > 0 ? "+" : ""}${euros(ecart, { precis: true })})`, "⚖️");
    setSoldeReel("");
    setAjustOuvert(false);
    setSucces(true);
    minuterie.current = setTimeout(() => setSucces(false), 1600);
  };

  return (
    <Sheet titre={compte.nom} onFermer={onFermer}>
      <div className="space-y-3">
        {/* La carte, au premier plan */}
        <div
          className="relative overflow-hidden rounded-ios p-4 shadow-flottant"
          style={{
            background: `linear-gradient(135deg, ${coul.fond}, transparent 70%)`,
            backgroundColor: "var(--c-carte)",
            border: `1px solid ${coul.vif}33`,
            viewTransitionName: "carte-active",
          }}
        >
          <div className="reflet" />
          <div className="relative flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: coul.vif + "26" }}>
              {t.icone}
            </span>
            <span className="rounded-pill bg-voile px-2 py-0.5 text-[11px] font-semibold text-sourdine">{t.label}</span>
          </div>
          <div className="relative mt-4">
            <div className={`chiffres font-bold leading-none ${Math.abs(solde) >= 100000 ? "text-[24px]" : Math.abs(solde) >= 10000 ? "text-[28px]" : "text-[34px]"} ${solde < 0 ? "text-corail" : ""}`}>
              {euros(solde, { precis: true })}
            </div>
            <div className="mt-1 text-[13px] text-sourdine">Solde actuel</div>
          </div>
          {plafond && (
            <div className="relative mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-voile">
                <div
                  className="jauge-in h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (solde / plafond) * 100))}%`, background: coul.vif }}
                />
              </div>
              <p className="mt-1 text-[11px] text-sourdine">
                {Math.max(0, Math.round((solde / plafond) * 100))} % du plafond ({euros(plafond)}) · reste {euros(Math.max(0, plafond - solde))}
              </p>
            </div>
          )}
        </div>

        {/* Détails, en lignes groupées façon Wallet */}
        <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
          <LigneStat label="Entrées ce mois-ci" valeur={`+${euros(stats.entrees)}`} couleur="text-menthe" />
          <LigneStat label="Sorties ce mois-ci" valeur={`−${euros(stats.sorties)}`} couleur="text-corail" />
          <LigneStat
            label="Variation du mois"
            valeur={`${stats.entrees - stats.sorties >= 0 ? "+" : ""}${euros(stats.entrees - stats.sorties)}`}
            couleur={stats.entrees - stats.sorties >= 0 ? "text-menthe" : "text-corail"}
          />
          <LigneStat
            label="Dernier mouvement"
            valeur={stats.dernier ? dateCourte(stats.dernier.date) : "—"}
            dernier
          />
        </div>

        {/* Ajustement du solde */}
        {succes ? (
          <div className="fade-in flex items-center justify-center gap-3 rounded-ios bg-menthe-pale py-4">
            <CocheAnimee taille={40} />
            <span className="text-sm font-semibold text-menthe-texte">Solde à jour</span>
          </div>
        ) : !ajustOuvert ? (
          <button
            onClick={() => { setAjustOuvert(true); setSoldeReel(arrondir(solde).toFixed(2).replace(".", ",")); }}
            className="flex w-full items-center justify-between rounded-ios bg-carte px-3.5 py-3 shadow-carte active:bg-voile"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-voile text-sm">⚖️</span>
              Ajuster le solde
            </span>
            <span className="text-sourdine/50">›</span>
          </button>
        ) : (
          <div className="fade-in rounded-ios bg-menthe-pale p-3.5">
            <p className="text-sm font-semibold text-menthe-texte">Solde réel de ta banque</p>
            <p className="mt-0.5 text-xs text-sourdine">
              L'app calcule {euros(solde, { precis: true })}. Saisis le vrai solde : l'écart sera enregistré comme un ajustement, sans fausser tes statistiques.
            </p>
            <div className="mt-2.5 flex gap-2">
              <input
                inputMode="decimal"
                autoFocus
                value={soldeReel}
                onChange={(e) => setSoldeReel(e.target.value)}
                placeholder="ex : 612,40"
                className="tnum min-w-0 flex-1 rounded-xl border border-bordure bg-carte px-3 py-2.5 outline-none focus:border-menthe"
              />
              <button
                onClick={ajuster}
                disabled={ecart === null || Math.abs(ecart) < 0.005}
                className="rounded-xl bg-menthe-bouton px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                Ajuster
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              {ecart !== null && Math.abs(ecart) >= 0.005 ? (
                <p className="tnum text-xs font-semibold text-menthe-texte">
                  Écart : {ecart > 0 ? "+" : ""}{euros(ecart, { precis: true })}
                </p>
              ) : <span />}
              <button onClick={() => { setAjustOuvert(false); setSoldeReel(""); }} className="text-xs font-medium text-sourdine">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Opérations du compte */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sourdine">
            Opérations {stats.liees.length > 15 && <span className="font-medium normal-case">· 15 dernières</span>}
          </h3>
          {recentes.length === 0 ? (
            <p className="rounded-ios bg-carte p-4 text-center text-sm text-sourdine shadow-carte">
              Aucune opération sur ce compte.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentes.map((tx, i) => <TxRow key={tx.id} tx={tx} retard={i} />)}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
