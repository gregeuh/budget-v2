"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";
import { construireMemoire } from "@/lib/habitudes";
import { devinerCategorieComplet } from "@/lib/categorisation";
import Sheet from "./Sheet";
import PointsSautillants from "./PointsSautillants";

export default function CategoriserSheet({ onFermer }) {
  const { transactions, categories, modifierTransaction, notifier } = useBudget();
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(0);
  const [ignores, setIgnores] = useState(() => new Set());
  const [choix, setChoix] = useState({}); // { cleGroupe: categorieId }
  const [viaIA, setViaIA] = useState({}); // { cleGroupe: categorieId } trouvés par l'IA
  const [iaEnCours, setIaEnCours] = useState(false);
  const [erreurIA, setErreurIA] = useState("");

  const memoire = useMemo(() => construireMemoire(transactions), [transactions]);
  const cats = Object.entries(categories).filter(([, c]) => c.type !== "virement");


  // Opérations non rangées (autre / autresRevenus), groupées par commerçant
  const groupes = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.versId) continue;
      if (t.categorie !== "autre" && t.categorie !== "autresRevenus") continue;

      const nom = (t.libelle || t.libelleBanque || "").trim();
      if (!nom) continue;
      const trouve = devinerCategorieComplet(nom, t.montant, memoire, t.libelleBanque || "");
      const propose = trouve && categories[trouve.categorie] ? trouve.categorie : null;

      const cle = nom.toLowerCase();
      if (!map.has(cle)) {
        map.set(cle, { cle, nom, propose, source: trouve?.source || null, ids: [], total: 0, montant: t.montant });
      }
      const g = map.get(cle);
      g.ids.push(t.id);
      g.total += Math.abs(t.montant);
    }
    return [...map.values()].sort((a, b) => b.ids.length - a.ids.length || b.total - a.total);
  }, [transactions, memoire, categories]);

  const categorieDe = (g) => choix[g.cle] || viaIA[g.cle] || g.propose;

  // Groupes que ni les règles ni tes habitudes n'ont su ranger
  const inconnus = groupes.filter((g) => !categorieDe(g));
  const rangeables = groupes.filter((g) => categorieDe(g));

  const nbAActiver = rangeables.filter((g) => !ignores.has(g.cle)).reduce((n, g) => n + g.ids.length, 0);

  const rangerAvecIA = async () => {
    if (inconnus.length === 0 || iaEnCours) return;
    setIaEnCours(true);
    setErreurIA("");
    try {
      const r = await fetch("/api/categoriser", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operations: inconnus.map((g) => ({ nom: g.nom, montant: g.montant })),
          categories: Object.fromEntries(cats.map(([k, c]) => [k, c.label])),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreurIA(r.status === 503 ? "Active l'IA (clé API) pour cette fonction." : d.erreur || "Le rangement IA a échoué.");
        return;
      }
      const d = await r.json();
      const maj = {};
      for (const res of d.resultats || []) {
        const g = inconnus.find((x) => x.nom === res.nom);
        if (g && categories[res.categorie]) maj[g.cle] = res.categorie;
      }
      if (Object.keys(maj).length === 0) setErreurIA("L'IA n'a rien pu ranger de plus.");
      setViaIA((v) => ({ ...v, ...maj }));
    } catch {
      setErreurIA("Connexion impossible.");
    } finally {
      setIaEnCours(false);
    }
  };

  const appliquer = async () => {
    setEnCours(true);
    try {
      let n = 0;
      for (const g of rangeables) {
        if (ignores.has(g.cle)) continue;
        const cat = categorieDe(g);
        if (!cat || !categories[cat]) continue;
        for (const id of g.ids) {
          await modifierTransaction(id, { categorie: cat }, { silencieux: true });
          n++;
        }
      }
      setTermine(n);
      notifier(`${n} opération${n > 1 ? "s" : ""} rangée${n > 1 ? "s" : ""}`, "🏷️");
    } finally {
      setEnCours(false);
    }
  };


  return (
    <Sheet titre="Ranger mes opérations" onFermer={onFermer}>
      {termine > 0 ? (
        <div className="py-8 text-center">
          <div className="text-4xl">🏷️</div>
          <p className="mt-2 font-semibold">{termine} opération{termine > 1 ? "s" : ""} rangée{termine > 1 ? "s" : ""}</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Fermer</button>
        </div>
      ) : groupes.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-2 text-sm text-sourdine">Tout est déjà rangé, rien à faire ici.</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-voile py-3 font-semibold">Fermer</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-sourdine">
            {nbAActiver} opération{nbAActiver > 1 ? "s" : ""} sans catégorie peuvent être rangées. Change la catégorie proposée si besoin, ou décoche.
          </p>

          <ul className="space-y-2">
            {rangeables.map((g) => {
              const actif = !ignores.has(g.cle);
              const cat = categorieDe(g);
              return (
                <li key={g.cle} className={`rounded-2xl px-3 py-2.5 shadow-carte ${actif ? "bg-carte ring-1 ring-menthe/40" : "bg-carte opacity-60"}`}>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIgnores((s) => { const n = new Set(s); n.has(g.cle) ? n.delete(g.cle) : n.add(g.cle); return n; })}
                      aria-label={actif ? "Ne pas ranger" : "Ranger"}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${actif ? "bg-menthe text-white" : "bg-voile text-sourdine"}`}
                    >
                      {actif ? "✓" : ""}
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {g.nom}
                        {g.ids.length > 1 && <span className="ml-1 text-[11px] font-semibold text-menthe-texte">· {g.ids.length}×</span>}
                      </span>
                      <span className="block text-[11px] text-sourdine">
                        {euros(g.total)}
                        {g.source === "habitude" && " · d'après tes habitudes"}
                        {viaIA[g.cle] && !choix[g.cle] && " · ✨ trouvé par l'IA"}
                      </span>
                    </span>
                    <select
                      value={cat}
                      onChange={(e) => setChoix((c) => ({ ...c, [g.cle]: e.target.value }))}
                      disabled={!actif}
                      className="shrink-0 rounded-lg border border-bordure bg-fond px-2 py-1.5 text-xs font-medium outline-none disabled:opacity-50"
                    >
                      {cats.map(([id, c]) => (
                        <option key={id} value={id}>{c.icone} {c.label}</option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>

          {inconnus.length > 0 && (
            <div>
              <button
                onClick={rangerAvecIA}
                disabled={iaEnCours}
                className="flex w-full items-center justify-center gap-2 rounded-ios bg-marque-pale py-2.5 text-sm font-semibold text-marque-texte disabled:opacity-60"
              >
                {iaEnCours ? (
                  <>
                    <PointsSautillants taille={5} couleur="var(--marque-texte)" />
                    <span>L&apos;IA cherche…</span>
                  </>
                ) : (
                  <span>✨ Ranger les {inconnus.length} inconnu{inconnus.length > 1 ? "s" : ""} avec l&apos;IA</span>
                )}
              </button>
              <p className="mt-1 px-1 text-[11px] text-sourdine">
                {inconnus.slice(0, 4).map((g) => g.nom).join(", ")}{inconnus.length > 4 ? "…" : ""}
              </p>
              {erreurIA && <p className="mt-1 px-1 text-xs text-corail">{erreurIA}</p>}
            </div>
          )}

          <button
            onClick={appliquer}
            disabled={enCours || nbAActiver === 0}
            className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-40"
          >
            {enCours ? "Rangement…" : `Ranger ${nbAActiver} opération${nbAActiver > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </Sheet>
  );
}
