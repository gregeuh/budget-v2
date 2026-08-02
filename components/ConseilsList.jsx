"use client";

import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { genererConseils, resumePourCoach } from "@/lib/conseils";
import { fetchSuivi } from "@/lib/journal";
import PointsSautillants from "./PointsSautillants";

const TONS = {
  alerte: { carte: "bg-corail-pale", pastille: "bg-corail/15" },
  info: { carte: "bg-carte shadow-carte", pastille: "bg-marque-pale" },
  bravo: { carte: "bg-carte shadow-carte", pastille: "bg-menthe-pale" },
};

const CLE_MASQUES = "conseils-masques";

const lireMasques = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLE_MASQUES) || "[]"));
  } catch {
    return new Set();
  }
};

// Clé stable d'un conseil IA à partir de son titre (pour le masquage).
const cleDe = (c) =>
  c.cle || (c.titre || "").toLowerCase().replace(/[0-9%€.,\s]+/g, "-").replace(/^-|-$/g, "");

export default function ConseilsList() {
  const donnees = useBudget();

  const conseilsAuto = useMemo(
    () => genererConseils(donnees),
    [donnees.transactions, donnees.comptes, donnees.budgets, donnees.soldes, donnees.profil]
  );

  const [masques, setMasques] = useState(new Set());
  const [tout, setTout] = useState(false);
  const [gererMasques, setGererMasques] = useState(false);

  // IA
  const [conseilsIA, setConseilsIA] = useState(null);
  const [chargeIA, setChargeIA] = useState(false);
  const [erreurIA, setErreurIA] = useState("");
  const [source, setSource] = useState("auto"); // "auto" | "ia"

  useEffect(() => setMasques(lireMasques()), []);

  const persister = (set) => {
    setMasques(new Set(set));
    try {
      localStorage.setItem(CLE_MASQUES, JSON.stringify([...set]));
    } catch {}
  };

  const masquer = (cle) => {
    const s = new Set(masques);
    s.add(cle);
    persister(s);
  };
  const reafficher = (cle) => {
    const s = new Set(masques);
    s.delete(cle);
    persister(s);
  };
  const toutReafficher = () => persister(new Set());

  const base = source === "ia" && conseilsIA ? conseilsIA : conseilsAuto;
  const visibles = base.filter((c) => !masques.has(cleDe(c)));
  const affiches = tout ? visibles : visibles.slice(0, 3);

  // Retrouver les titres masqués pour l'écran de gestion
  const tousConnus = useMemo(() => {
    const map = new Map();
    for (const c of [...conseilsAuto, ...(conseilsIA || [])]) map.set(cleDe(c), c.titre);
    return map;
  }, [conseilsAuto, conseilsIA]);
  const listeMasques = [...masques].map((cle) => ({ cle, titre: tousConnus.get(cle) || cle }));

  const genererIA = async () => {
    if (chargeIA) return;
    setSource("ia");
    setChargeIA(true);
    setErreurIA("");
    try {
      const resume = resumePourCoach({ ...donnees, categories: donnees.categories || {} });
      const r = await fetchSuivi("/api/conseils", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreurIA(r.status === 503 ? "Active l'IA (clé API) pour cette fonction." : d.erreur || "L'analyse a échoué.");
        return;
      }
      const d = await r.json();
      if (!d.conseils?.length) {
        setErreurIA("Pas encore assez de données pour une analyse fine.");
        return;
      }
      setConseilsIA(d.conseils);
      setSource("ia");
      setTout(false);
    } catch {
      setErreurIA("Connexion impossible.");
    } finally {
      setChargeIA(false);
    }
  };

  return (
    <section className="space-y-3">
      {/* Bascule règles / IA */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-pill bg-voile p-0.5 text-sm">
          <button
            onClick={() => setSource("auto")}
            className={`tappable rounded-pill px-3 py-1 font-medium transition-colors ${source === "auto" ? "bg-carte shadow-carte" : "text-sourdine"}`}
          >
            Automatiques
          </button>
          <button
            onClick={() => (conseilsIA ? setSource("ia") : genererIA())}
            disabled={chargeIA}
            aria-busy={chargeIA}
            className={`tappable flex items-center gap-1 rounded-pill px-3 py-1 font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${source === "ia" ? "bg-carte shadow-carte" : "text-sourdine"}`}
          >
            {chargeIA ? "✨ Analyse…" : "✨ Conseils IA"}
          </button>
        </div>
        {masques.size > 0 && (
          <button onClick={() => setGererMasques((v) => !v)} className="ml-auto text-xs font-medium text-sourdine">
            {masques.size} masqué{masques.size > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Écran de gestion des conseils masqués */}
      {gererMasques && listeMasques.length > 0 && (
        <div className="fade-in rounded-ios bg-carte p-3 shadow-carte">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sourdine">Conseils masqués</p>
          <ul className="space-y-1.5">
            {listeMasques.map((m) => (
              <li key={m.cle} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-sourdine">{m.titre}</span>
                <button onClick={() => reafficher(m.cle)} className="shrink-0 text-xs font-semibold text-marque">
                  Réafficher
                </button>
              </li>
            ))}
          </ul>
          <button onClick={toutReafficher} className="mt-2 w-full rounded-ios bg-voile py-2 text-xs font-semibold">
            Tout réafficher
          </button>
        </div>
      )}

      {/* Génération IA en cours */}
      {source === "ia" && chargeIA && (
        <div className="flex items-center gap-2 rounded-ios bg-carte px-4 py-4 shadow-carte">
          <PointsSautillants taille={6} couleur="var(--marque)" />
          <span className="text-sm text-sourdine">L&apos;IA analyse tes 6 derniers mois…</span>
        </div>
      )}

      {source === "ia" && erreurIA && !chargeIA && (
        <div className="rounded-ios bg-carte px-4 py-3 text-sm text-corail shadow-carte">{erreurIA}</div>
      )}

      {/* Liste des conseils */}
      {!chargeIA && affiches.map((c, i) => {
        const cle = cleDe(c);
        const st = TONS[c.ton] || TONS.info;
        return (
          <div key={cle + i} className={`pop-in rounded-ios p-4 ${st.carte}`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${st.pastille}`}>{c.icone}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{c.titre}</h3>
                  <button
                    onClick={() => masquer(cle)}
                    aria-label="Masquer ce conseil"
                    className="-mt-1 -mr-1 shrink-0 rounded-full p-1 text-sourdine/50 active:bg-voile"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                <p className="mt-0.5 text-sm text-encre opacity-75">{c.texte}</p>
                {c.parIA && <p className="mt-1 text-[11px] font-medium text-marque">✨ Écrit pour toi</p>}
              </div>
            </div>
          </div>
        );
      })}

      {!chargeIA && visibles.length > 3 && (
        <button onClick={() => setTout((v) => !v)} className="w-full py-1 text-xs font-medium text-sourdine">
          {tout ? "Réduire" : `Voir les ${visibles.length - 3} autres conseils`}
        </button>
      )}

      {!chargeIA && visibles.length === 0 && base.length > 0 && (
        <p className="rounded-ios bg-carte p-5 text-center text-sm text-sourdine shadow-carte">
          Tous les conseils sont masqués.{" "}
          <button onClick={toutReafficher} className="font-semibold text-marque">Tout réafficher</button>
        </p>
      )}

      {!chargeIA && base.length === 0 && (
        <p className="rounded-ios bg-carte p-6 text-center text-sm text-sourdine shadow-carte">
          Ajoute quelques opérations pour que l&apos;analyse démarre.
        </p>
      )}

      {source === "ia" && conseilsIA && !chargeIA && (
        <button onClick={genererIA} className="w-full py-1 text-xs font-medium text-marque">
          ↻ Régénérer
        </button>
      )}
    </section>
  );
}
