"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { FREQUENCES, aujourdhui, euros } from "@/lib/format";
import Sheet from "./Sheet";
import PointsSautillants from "./PointsSautillants";
import { construireMemoire, devinerDepuisHistorique, lieuxConnus, proposerLibelles } from "@/lib/habitudes";

const MODES = [
  { id: "depense", label: "Dépense" },
  { id: "revenu", label: "Revenu" },
  { id: "virement", label: "Virement" },
];

const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"];

export default function AddSheet({ onFermer }) {
  const { comptes, transactions, categories, ajouterTransaction, ajouterRecurrente, virement } = useBudget();
  const [etape, setEtape] = useState(1);
  const [mode, setMode] = useState("depense");
  const [montant, setMontant] = useState("");
  const [impulsion, setImpulsion] = useState(0);
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("courses");
  const [compteId, setCompteId] = useState(comptes[0]?.id || "");
  const [versId, setVersId] = useState(comptes[1]?.id || "");
  const [date, setDate] = useState(aujourdhui());
  const [frequence, setFrequence] = useState("unefois");
  const [horsSolde, setHorsSolde] = useState(false);
  const [secousse, setSecousse] = useState(0);
  // Saisie en langage naturel
  const [phrase, setPhrase] = useState("");
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [noteIA, setNoteIA] = useState("");
  const [erreurIA, setErreurIA] = useState("");
  const [lieu, setLieu] = useState("");
  const [autoApplique, setAutoApplique] = useState(null); // ce que l'app a deviné toute seule

  const secouer = () => setSecousse((s) => s + 1);

  // Interprète une phrase ("15€ courses carrefour hier") et pré-remplit le formulaire
  const interpreter = async () => {
    if (!phrase.trim() || analyseEnCours) return;
    setAnalyseEnCours(true);
    setErreurIA("");
    setNoteIA("");
    try {
      const r = await fetch("/api/saisie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phrase: phrase.trim(),
          categories: Object.fromEntries(Object.entries(categories).map(([k, c]) => [k, c.label])),
          comptes: comptes.map((c) => c.nom),
          dateDuJour: aujourdhui(),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErreurIA(r.status === 503 ? "Active l'IA (clé API) pour la saisie intelligente." : d.erreur || "Interprétation impossible.");
        return;
      }
      const d = await r.json();
      if (d.montant > 0) setMontant(String(d.montant).replace(".", ","));
      if (d.type) setMode(d.type);
      if (d.libelle) setLibelle(d.libelle);
      if (d.categorie && categories[d.categorie]) setCategorie(d.categorie);
      if (d.date) setDate(d.date);
      if (d.compte) {
        const trouve = comptes.find((c) => c.nom.toLowerCase() === String(d.compte).toLowerCase());
        if (trouve) setCompteId(trouve.id);
      }
      if (d.lieu) setLieu(d.lieu);
      setNoteIA(d.note || "");
      setPhrase("");
      // Si le montant est identifié, on saute directement à l'étape de vérification
      if (d.montant > 0) setEtape(2);
      else secouer();
    } catch {
      setErreurIA("Connexion impossible.");
    } finally {
      setAnalyseEnCours(false);
    }
  };

  const valeur = parseFloat(String(montant).replace(",", ".")) || 0;
  const couleurMontant = mode === "depense" ? "text-corail" : mode === "revenu" ? "text-menthe" : "text-encre";

  // ---- Pavé numérique ----
  const taper = (t) => {
    setMontant((m) => {
      if (t === "⌫") return m.slice(0, -1);
      if (t === ",") {
        if (m.includes(",")) return m;
        return m === "" ? "0," : m + ",";
      }
      // chiffre
      const [ent, dec] = m.split(",");
      if (dec !== undefined && dec.length >= 2) return m;       // 2 décimales max
      if (dec === undefined && ent.length >= 7) return m;       // 9 999 999 max
      if (m === "0") return t;                                   // pas de zéro en tête
      return m + t;
    });
    setImpulsion((i) => i + 1);
  };

  // ---- Suggestions (libellés fréquents) ----
  // Ce que l'app a appris de tes habitudes (catégorie + lieu par commerçant)
  const memoire = useMemo(() => construireMemoire(transactions), [transactions]);
  const lieuxFrequents = useMemo(() => lieuxConnus(transactions, 8, lieu), [transactions, lieu]);
  const propositions = useMemo(() => proposerLibelles(libelle, memoire), [libelle, memoire]);

  // Quand tu tapes un libellé déjà connu : catégorie et lieu proposés automatiquement
  const appliquerHabitude = (valeurLibelle) => {
    const trouve = devinerDepuisHistorique(valeurLibelle, memoire);
    if (!trouve) { setAutoApplique(null); return; }
    let applique = null;
    if (trouve.categorie && categories[trouve.categorie]) {
      setCategorie(trouve.categorie);
      applique = { categorie: categories[trouve.categorie]?.label };
    }
    if (trouve.lieu && !lieu.trim()) {
      setLieu(trouve.lieu);
      applique = { ...(applique || {}), lieu: trouve.lieu };
    }
    setAutoApplique(applique);
  };

  const suggestions = useMemo(() => {
    if (mode === "virement") return [];
    const map = new Map();
    for (const t of transactions) {
      const lib = (t.libelle || "").trim();
      if (!lib) continue;
      const cat = categories[t.categorie] || categories.autre;
      if (cat.type === "virement") continue;
      if (mode === "revenu" ? t.montant <= 0 : t.montant >= 0) continue;
      const cle = lib.toLowerCase();
      const e = map.get(cle) || { libelle: lib, n: 0, date: "", categorie: t.categorie, compteId: t.compteId, montant: t.montant };
      e.n++;
      if (t.date > e.date) { e.date = t.date; e.categorie = t.categorie; e.compteId = t.compteId; e.montant = t.montant; }
      map.set(cle, e);
    }
    return [...map.values()].filter((e) => e.n >= 2).sort((a, b) => b.n - a.n).slice(0, 6);
  }, [transactions, mode, categories]);

  const appliquerSuggestion = (sug) => {
    setLibelle(sug.libelle);
    setCategorie(sug.categorie);
    if (comptes.some((c) => c.id === sug.compteId)) setCompteId(sug.compteId);
    if (!montant) { setMontant(String(Math.abs(sug.montant)).replace(".", ",")); setImpulsion((i) => i + 1); }
    setEtape(2);
  };

  // Doublon probable : même compte, même montant, même jour (± libellé proche)
  const doublon = useMemo(() => {
    if (mode === "virement" || valeur <= 0 || !compteId) return null;
    const signe = mode === "depense" ? -1 : 1;
    return transactions.find(
      (t) =>
        t.date === date &&
        t.compteId === compteId &&
        Math.abs(t.montant - signe * valeur) < 0.005 &&
        !t.versId
    ) || null;
  }, [transactions, mode, valeur, compteId, date]);

  const cats = Object.entries(categories).filter(([, c]) =>
    mode === "revenu" ? c.type === "revenu" : c.type !== "revenu" && c.type !== "virement"
  );

  const valider = async () => {
    if (!valeur || valeur <= 0 || !compteId) return;
    if (mode === "virement") {
      if (!versId || versId === compteId) return;
      await virement(compteId, versId, valeur, date);
    } else {
      const base = {
        compteId,
        montant: mode === "depense" ? -valeur : valeur,
        categorie,
        libelle: libelle.trim() || (categories[categorie]?.label ?? "Opération"),
        ...(lieu.trim() ? { lieu: lieu.trim() } : {}),
        ...(horsSolde ? { horsSolde: true } : {}),
      };
      if (frequence === "unefois") await ajouterTransaction({ ...base, date });
      else await ajouterRecurrente({ ...base, frequence, prochaine: date });
    }
    onFermer();
  };

  const tailleMontant =
    montant.length <= 5 ? "text-[54px]" : montant.length <= 7 ? "text-[44px]" : "text-[36px]";

  return (
    <Sheet titre="Nouvelle opération" onFermer={onFermer}>
      {etape === 1 ? (
        <div key="e1" className="pop-in">
          {/* Saisie en langage naturel */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && interpreter()}
                placeholder="Décris ta dépense : « 15€ courses Carrefour hier »"
                className="min-w-0 flex-1 rounded-pill border border-bordure bg-carte px-4 py-2.5 text-sm outline-none focus:border-lavande"
              />
              <button
                onClick={interpreter}
                disabled={!phrase.trim() || analyseEnCours}
                aria-label="Interpréter"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavande-pale text-lavande-texte disabled:opacity-40"
              >
                {analyseEnCours ? <PointsSautillants taille={4} couleur="var(--lavande-texte)" /> : "✨"}
              </button>
            </div>
            {erreurIA && <p className="mt-1 px-1 text-xs text-corail">{erreurIA}</p>}
            {!erreurIA && !phrase && (
              <p className="mt-1 px-1 text-[11px] text-sourdine">
                Ou dicte-la avec le micro de ton clavier 🎤
              </p>
            )}
          </div>

          {/* Mode */}
          <div className="mb-4 grid grid-cols-3 rounded-pill bg-voile p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setCategorie(m.id === "revenu" ? "salaire" : "courses"); }}
                className={`rounded-pill py-2 text-sm font-semibold transition-colors ${mode === m.id ? "bg-carte shadow-carte" : "text-sourdine"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Montant géant animé */}
          <div key={`sec-${secousse}`} className={`flex h-[76px] items-center justify-center ${secousse ? "secousse" : ""}`}>
            <span key={impulsion} className={`rebond chiffres font-bold leading-none ${tailleMontant} ${montant ? couleurMontant : "text-sourdine/40"}`}>
              {montant || "0"}
              <span className="ml-1 text-[0.55em] font-semibold text-sourdine">€</span>
            </span>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {suggestions.map((sug) => (
                <button key={sug.libelle} onClick={() => appliquerSuggestion(sug)}
                  className="rounded-pill bg-voile px-2.5 py-1.5 text-[13px] font-medium">
                  {(categories[sug.categorie] || categories.autre).icone} {sug.libelle}
                </button>
              ))}
            </div>
          )}

          {/* Pavé numérique */}
          <div className="grid grid-cols-3 gap-2">
            {TOUCHES.map((t, i) => (
              <button
                key={t}
                onClick={() => taper(t)}
                style={{ animationDelay: `${i * 22}ms` }}
                className={`pop-in chiffres h-14 rounded-2xl text-2xl font-semibold transition-transform duration-100 active:scale-90 ${
                  t === "⌫" ? "bg-voile text-sourdine" : "bg-carte shadow-carte active:bg-voile"
                }`}
                aria-label={t === "⌫" ? "Effacer" : t}
              >
                {t}
              </button>
            ))}
          </div>

          {comptes.length === 0 ? (
            <p className="mt-3 text-center text-sm text-sourdine">Crée d'abord un compte dans l'onglet Comptes.</p>
          ) : (
            <button
              onClick={() => (valeur > 0 ? setEtape(2) : secouer())}
              className={`mt-3 w-full rounded-ios bg-encre py-3 font-semibold text-contraste active:scale-[0.99] transition-transform ${valeur <= 0 ? "opacity-40" : ""}`}
            >
              Continuer
            </button>
          )}
        </div>
      ) : (
        <div key="e2" className="pop-in space-y-3">
          {/* Rappel du montant, tap = retour */}
          <button onClick={() => setEtape(1)} className="flex w-full items-center gap-3 rounded-ios bg-voile px-3.5 py-2.5">
            <span className="text-sourdine">‹</span>
            <span className={`chiffres flex-1 text-left text-xl font-bold ${couleurMontant}`}>{euros(valeur, { precis: true })}</span>
            <span className="text-xs font-medium text-sourdine">Modifier</span>
          </button>

          {mode !== "virement" && (
            <>
              <input
                placeholder="Libellé (ex : Carrefour, Loyer…)"
                value={libelle}
                onChange={(e) => { setLibelle(e.target.value); setAutoApplique(null); }}
                onBlur={(e) => appliquerHabitude(e.target.value)}
                className="w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe"
              />

              {propositions.length > 0 && (
                <div className="fade-in -mt-1 flex flex-wrap gap-1.5">
                  {propositions.map((p) => (
                    <button
                      key={p.libelle}
                      onClick={() => { setLibelle(p.libelle); appliquerHabitude(p.libelle); }}
                      className="rounded-pill bg-carte px-2.5 py-1 text-[12px] font-medium shadow-carte ring-1 ring-bordure"
                    >
                      {p.libelle}
                      {p.lieu ? <span className="text-sourdine"> · 📍 {p.lieu}</span> : null}
                    </button>
                  ))}
                </div>
              )}

              {autoApplique && (
                <p className="fade-in -mt-1 px-1 text-[11px] text-menthe-texte">
                  ✨ D&apos;après tes habitudes :
                  {autoApplique.categorie ? ` ${autoApplique.categorie}` : ""}
                  {autoApplique.categorie && autoApplique.lieu ? " ·" : ""}
                  {autoApplique.lieu ? ` 📍 ${autoApplique.lieu}` : ""}
                </p>
              )}

              {/* Lieu, avec les lieux déjà utilisés */}
              <div>
                <div className="flex items-center gap-2 rounded-ios border border-bordure bg-carte px-3.5 py-2.5">
                  <span className="shrink-0 text-sm">📍</span>
                  <input
                    placeholder="Lieu (optionnel)"
                    value={lieu}
                    onChange={(e) => setLieu(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  {lieu && (
                    <button onClick={() => setLieu("")} aria-label="Effacer le lieu" className="shrink-0 text-xs text-sourdine">✕</button>
                  )}
                </div>
                {!lieu && lieuxFrequents.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {lieuxFrequents.slice(0, 5).map((l) => (
                      <button key={l} onClick={() => setLieu(l)} className="rounded-pill bg-voile px-2.5 py-1 text-[12px] font-medium">
                        📍 {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cats.map(([id, c]) => (
                  <button key={id} onClick={() => setCategorie(id)}
                    className={`rounded-pill border px-2.5 py-1.5 text-[13px] font-medium ${categorie === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte text-encre"}`}>
                    {c.icone} {c.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">{mode === "virement" ? "Depuis" : "Compte"}</span>
              <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
                {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
            {mode === "virement" ? (
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Vers</span>
                <select value={versId} onChange={(e) => setVersId(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
                  {comptes.filter((c) => c.id !== compteId).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
            ) : (
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-2 py-3 text-[15px] outline-none" />
              </label>
            )}
          </div>

          {mode === "virement" && (
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-w-0 rounded-ios border border-bordure bg-carte px-2 py-3 text-[15px] outline-none" />
            </label>
          )}

          {mode !== "virement" && (
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Répéter</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[["unefois", "Une seule fois"], ...Object.entries(FREQUENCES).map(([id, f]) => [id, f.label])].map(([id, label]) => (
                  <button key={id} onClick={() => setFrequence(id)}
                    className={`truncate rounded-pill border px-2.5 py-1.5 text-[13px] font-medium ${frequence === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {frequence !== "unefois" && (
                <p className="mt-1.5 text-xs text-sourdine">
                  🔁 Sera ajoutée automatiquement {FREQUENCES[frequence].label.toLowerCase()} à partir du {new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.
                </p>
              )}
            </div>
          )}

          {mode !== "virement" && (
            <button onClick={() => setHorsSolde(!horsSolde)}
              className={`flex w-full items-center justify-between rounded-ios border px-3.5 py-2.5 text-left transition-colors ${horsSolde ? "border-menthe bg-menthe-pale" : "border-bordure bg-carte"}`}>
              <span className="text-sm font-semibold">👻 Hors solde</span>
              <span className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${horsSolde ? "bg-menthe" : "bg-voile"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${horsSolde ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </span>
            </button>
          )}

          {noteIA && (
            <div className="fade-in rounded-ios bg-lavande-pale px-3.5 py-2.5 text-xs text-lavande-texte">
              ✨ {noteIA}
            </div>
          )}

          {doublon && (
            <div className="fade-in rounded-ios bg-beurre-pale px-3.5 py-2.5 text-xs text-beurre-texte">
              ⚠️ Une opération identique existe déjà ce jour-là ({doublon.libelle || "sans libellé"}, {euros(doublon.montant, { precis: true })}). Doublon ?
            </div>
          )}

          <button
            key={`btn-${secousse}`}
            onClick={() => {
              const invalide = !valeur || !compteId || (mode === "virement" && (!versId || versId === compteId));
              if (invalide) return secouer();
              valider();
            }}
            className={`w-full rounded-ios bg-encre py-3 font-semibold text-contraste active:scale-[0.99] transition-transform ${
              !valeur || !compteId || (mode === "virement" && (!versId || versId === compteId)) ? "opacity-40" : ""
            } ${secousse ? "secousse" : ""}`}
          >
            Ajouter {euros(valeur, { precis: true })}
          </button>
        </div>
      )}
    </Sheet>
  );
}
