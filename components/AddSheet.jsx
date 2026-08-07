"use client";

import { fetchSuivi } from "@/lib/journal";
import { useMemo, useState, useEffect, useRef } from "react";
import { useBudget } from "@/lib/store";
import { FREQUENCES, aujourdhui, euros, COULEURS } from "@/lib/format";
import LogoCommercant from "./LogoCommercant";
import Sheet from "./Sheet";
import PointsSautillants from "./PointsSautillants";
import { construireMemoire, devinerDepuisHistorique, lieuxConnus, proposerLibelles } from "@/lib/habitudes";
import { chercherLieux } from "@/lib/lieux";
import { lieuPersoProche, enregistrerLieuPerso } from "@/lib/lieuxPerso";
import { suggererIcone } from "@/lib/icones";
import IconePicker from "./IconePicker";
import CompteLogo from "./CompteLogo";

// Pictos dessinés maison (pas de logo de marque), un par mode.
const IconeMode = ({ id, className = "h-4 w-4", style }) => {
  if (id === "revenu")
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    );
  if (id === "virement")
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h13l-3-3M20 17H7l3 3" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10h18" />
    </svg>
  );
};

// Couleur de chaque mode, branchée sur les tokens (donc suit le thème clair/sombre).
const COULEUR_MODE = {
  depense: "var(--corail)",
  revenu: "var(--menthe)",
  virement: "var(--marque)",
};

const MODES = [
  { id: "depense", label: "Dépense" },
  { id: "revenu", label: "Revenu" },
  { id: "virement", label: "Virement" },
];

const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"];

export default function AddSheet({ onFermer }) {
  const { comptes, transactions, categories, profil, sauverApp, ajouterTransaction, ajouterRecurrente, virement } = useBudget();
  const [etape, setEtape] = useState(1);
  const [mode, setMode] = useState("depense");
  const [montant, setMontant] = useState("");
  const [impulsion, setImpulsion] = useState(0);
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("courses");
  const [icone, setIcone] = useState("");
  const [iconeManuelle, setIconeManuelle] = useState(false);
  const [iconeMemorisee, setIconeMemorisee] = useState(false);
  const [compteId, setCompteId] = useState(comptes[0]?.id || "");
  const [choixCompteOuvert, setChoixCompteOuvert] = useState(false);
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
  const [lieuCoords, setLieuCoords] = useState(null);
  const [renommer, setRenommer] = useState(false);
  const [nomPerso, setNomPerso] = useState("");
  const [suggestionsLieu, setSuggestionsLieu] = useState([]);
  const [chercheLieu, setChercheLieu] = useState(false);
  const rechercheLieuRef = useRef(null);
  const libelleRef = useRef(null);
  const [autoApplique, setAutoApplique] = useState(null); // ce que l'app a deviné toute seule
  const [confirmationDoublon, setConfirmationDoublon] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState("");

  const secouer = () => setSecousse((s) => s + 1);

  // Interprète une phrase ("15€ courses carrefour hier") et pré-remplit le formulaire
  const interpreter = async () => {
    if (!phrase.trim() || analyseEnCours) return;
    setAnalyseEnCours(true);
    setErreurIA("");
    setNoteIA("");
    try {
      const r = await fetchSuivi("/api/saisie", {
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
      if (d.libelle) {
        setLibelle(d.libelle);
        appliquerHabitude(d.libelle);
      }
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
  const lieuxFrequents = useMemo(() => {
    const histo = lieuxConnus(transactions, 8, lieu);
    // Les lieux que tu as renommés apparaissent en premier
    const persos = (profil.lieuxPerso || []).map((l) => l.nom).filter((n) => !histo.includes(n));
    const q = lieu.trim().toLowerCase();
    const filtres = q ? [...persos, ...histo].filter((n) => n.toLowerCase().includes(q)) : [...persos, ...histo];
    return [...new Set(filtres)];
  }, [transactions, lieu, profil.lieuxPerso]);

  // Recherche d'un lieu réel (OpenStreetMap) après une courte pause de frappe.
  // Anti-rebond de 450 ms pour ne pas marteler le service gratuit.
  useEffect(() => {
    if (rechercheLieuRef.current) clearTimeout(rechercheLieuRef.current);
    const q = lieu.trim();
    // Si le lieu correspond exactement à une coordonnée déjà choisie, on ne recherche pas
    if (q.length < 3 || (lieuCoords && lieuCoords.nom === q)) {
      setSuggestionsLieu([]);
      setChercheLieu(false);
      return;
    }
    setChercheLieu(true);
    const ctrl = new AbortController();
    rechercheLieuRef.current = setTimeout(async () => {
      const res = await chercherLieux(q, { signal: ctrl.signal });
      setSuggestionsLieu(res);
      setChercheLieu(false);
    }, 450);
    return () => { clearTimeout(rechercheLieuRef.current); ctrl.abort(); };
  }, [lieu]);

  const choisirLieu = (s) => {
    // Ce lieu a-t-il déjà été renommé par toi ? (ex : "Coiffeur")
    const perso = lieuPersoProche(profil.lieuxPerso || [], s.lat, s.lon);
    const nomFinal = perso ? perso.nom : s.nom;
    setLieu(nomFinal);
    setLieuCoords({ nom: nomFinal, lat: s.lat, lon: s.lon, adresse: perso ? perso.adresse : s.adresse, adresseReelle: s.nom });
    setSuggestionsLieu([]);
    setRenommer(false);
    setNomPerso("");
  };

  // Enregistre un nom personnalisé pour l'adresse choisie
  const validerRenommage = async () => {
    const nom = nomPerso.trim();
    if (!nom || !lieuCoords) return;
    const carnet = enregistrerLieuPerso(profil.lieuxPerso || [], {
      nom, lat: lieuCoords.lat, lon: lieuCoords.lon, adresse: lieuCoords.adresseReelle || lieuCoords.adresse || "",
    });
    await sauverApp(undefined, { ...profil, lieuxPerso: carnet });
    setLieu(nom);
    setLieuCoords({ ...lieuCoords, nom });
    setRenommer(false);
    setNomPerso("");
  };
  const propositions = useMemo(() => proposerLibelles(libelle, memoire), [libelle, memoire]);

  // Quand tu tapes un libellé déjà connu : catégorie et lieu proposés automatiquement
  const appliquerHabitude = (valeurLibelle) => {
    const trouve = devinerDepuisHistorique(valeurLibelle, memoire);
    if (!trouve) { setAutoApplique(null); setIconeMemorisee(false); return; }
    let applique = null;
    if (trouve.categorie && categories[trouve.categorie]) {
      setCategorie(trouve.categorie);
      applique = { categorie: categories[trouve.categorie]?.label };
    }
    if (trouve.lieu && !lieu.trim()) {
      setLieu(trouve.lieu);
      applique = { ...(applique || {}), lieu: trouve.lieu };
    }
    if (trouve.icone && !iconeManuelle) {
      setIcone(trouve.icone);
      setIconeMemorisee(true);
      applique = { ...(applique || {}), icone: trouve.icone };
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
    appliquerHabitude(sug.libelle);
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

  useEffect(() => {
    setConfirmationDoublon(false);
  }, [doublon?.id]);

  useEffect(() => {
    if (etape !== 2 || mode === "virement") return;
    const timer = window.setTimeout(() => libelleRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [etape, mode]);

  const cats = Object.entries(categories).filter(([, c]) =>
    mode === "revenu" ? c.type === "revenu" : c.type !== "revenu" && c.type !== "virement"
  );
  const iconeSuggeree = suggererIcone(libelle, categories[categorie]?.icone || "📦");

  useEffect(() => {
    if (!iconeManuelle && !iconeMemorisee) setIcone(iconeSuggeree);
  }, [iconeSuggeree, iconeManuelle, iconeMemorisee]);

  const valider = async () => {
    if (!valeur || valeur <= 0 || !compteId) {
      setErreurFormulaire("Indique un montant et le compte concerné.");
      return;
    }
    if (mode === "virement") {
      if (!versId || versId === compteId) {
        setErreurFormulaire("Choisis deux comptes différents pour le virement.");
        return;
      }
      await virement(compteId, versId, valeur, date);
    } else {
      if (doublon && !confirmationDoublon) {
        setConfirmationDoublon(true);
        setErreurFormulaire("Une opération similaire existe déjà. Confirme si tu souhaites vraiment l’ajouter.");
        return;
      }
      const base = {
        compteId,
        montant: mode === "depense" ? -valeur : valeur,
        categorie,
        libelle: libelle.trim() || (categories[categorie]?.label ?? "Opération"),
        ...(icone ? { icone } : {}),
        ...(lieu.trim() ? { lieu: lieu.trim() } : {}),
        ...(lieuCoords && lieuCoords.nom === lieu.trim() ? { lieuLat: lieuCoords.lat, lieuLon: lieuCoords.lon, lieuAdresse: lieuCoords.adresse || "" } : {}),
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
      <p role="status" aria-live="polite" className="sr-only">{erreurFormulaire}</p>
      {etape === 1 ? (
        <div key="e1" data-add-step className="pop-in">
          {/* Saisie en langage naturel */}
          {erreurIA && <p className="mb-2 px-1 text-xs text-corail">{erreurIA}</p>}

          {/* Mode : trois cartes avec picto, la sélectionnée prend sa couleur */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            {MODES.map((m) => {
              const actif = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMode(m.id); setCategorie(m.id === "revenu" ? "salaire" : "courses"); }}
                  aria-pressed={actif}
                  className={`tappable flex flex-col items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold transition-all duration-200 ${
                    actif ? "text-white shadow-bouton" : "bg-ui-surface-floating text-ui-text-secondary shadow-v3-soft"
                  }`}
                  style={actif ? { background: COULEUR_MODE[m.id] } : undefined}
                >
                  <IconeMode id={m.id} className="h-4 w-4" style={!actif ? { color: COULEUR_MODE[m.id] } : undefined} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Montant : priorité visuelle, décliné via les tokens clair/sombre. */}
          <div
            key={`sec-${secousse}`}
            className={`relative mb-5 px-4 pb-3 pt-1 text-center ${secousse ? "secousse" : ""}`}
          >
            <p className="relative sr-only" aria-live="polite">Montant {montant || "0"} euros</p>
            <div className="relative mt-1 flex h-[70px] items-center justify-center">
              <span key={impulsion} className={`rebond chiffres flex items-center font-bold leading-none ${tailleMontant} ${montant ? "text-ui-text-primary" : "text-ui-text-secondary"}`}>
                {montant && mode !== "virement" && <span className="mr-0.5 opacity-60" style={{ color: COULEUR_MODE[mode] }}>{mode === "depense" ? "−" : "+"}</span>}
                {montant || "0"}
                <span className="unite ml-1 text-[0.5em] text-sourdine">€</span>
                {montant && <span className="curseur ml-0.5 inline-block h-[0.8em] w-[3px] rounded-full align-middle" style={{ background: COULEUR_MODE[mode] }} />}
              </span>
            </div>
            {comptes[0] && (
              <div className="relative mx-auto w-fit">
              <button type="button" onClick={() => setChoixCompteOuvert((v) => !v)} aria-expanded={choixCompteOuvert} className="flex items-center gap-2 rounded-pill bg-ui-surface-floating px-3 py-2 text-xs font-semibold text-ui-text-primary shadow-v3-soft">
                <CompteLogo type={comptes.find((c) => c.id === compteId)?.type || comptes[0].type} taille={24} />
                <span>{comptes.find((c) => c.id === compteId)?.nom || comptes[0].nom}</span>
                <span aria-hidden="true" className={`text-sm leading-none transition-transform ${choixCompteOuvert ? "rotate-180" : ""}`}>⌄</span>
              </button>
              {choixCompteOuvert && (
                <div className="absolute left-1/2 z-20 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-2xl bg-ui-surface-floating p-1.5 text-left shadow-v3-floating ring-1 ring-ui-hairline">
                {comptes.map((c) => <button key={c.id} type="button" onClick={() => { setCompteId(c.id); setChoixCompteOuvert(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm ${c.id === compteId ? "bg-marque-pale font-semibold text-marque-texte" : "text-ui-text-primary"}`}><span className="flex min-w-0 items-center gap-2"><CompteLogo type={c.type} taille={28} /><span className="truncate">{c.nom}</span></span>{c.id === compteId && <span>✓</span>}</button>)}
                </div>
              )}
              </div>
            )}
          </div>

          {/* Raccourcis de commerçants : ligne légère à la manière de Wallet */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">Récents</p>
                <span className="text-xs font-medium text-marque">Tout afficher ›</span>
              </div>
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {suggestions.slice(0, 4).map((sug) => {
                  const cat = categories[sug.categorie] || categories.autre;
                  const teinte = COULEURS[cat.couleur]?.vif || "var(--marque)";
                  return (
                    <button
                      key={sug.libelle}
                      onClick={() => appliquerSuggestion(sug)}
                      className="tappable flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-ui-surface-floating px-2 py-2 shadow-v3-soft"
                    >
                      <LogoCommercant nom={sug.libelle} couleur={teinte} taille={36} />
                      <span className="w-full truncate text-center text-[11px] font-semibold">{sug.libelle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pavé numérique : touches en relief, tactiles */}
          <div className="grid grid-cols-3 gap-2.5">
            {TOUCHES.map((t, i) => {
              const backspace = t === "⌫";
              return (
                <button
                  key={t}
                  onClick={() => taper(t)}
                  style={{ animationDelay: `${i * 22}ms` }}
                  className={`pop-in chiffres tappable h-14 rounded-2xl text-[26px] transition-all duration-100 active:scale-90 ${
                    backspace
                      ? "bg-ui-surface-3 text-ui-text-primary active:bg-ui-surface-2"
                      : "bg-ui-surface-floating text-ui-text-primary shadow-v3-soft active:bg-ui-surface-2"
                  }`}
                  aria-label={backspace ? "Effacer" : t}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {comptes.length === 0 ? (
            <p className="mt-3 text-center text-sm text-sourdine">Crée d'abord un compte dans l'onglet Comptes.</p>
          ) : (
            <button
              onClick={() => (valeur > 0 ? setEtape(2) : secouer())}
              type="button"
              className={`sticky bottom-0 z-10 mt-5 w-full rounded-ios bg-marque-bouton py-3.5 font-semibold text-surMarque shadow-bouton active:scale-[0.99] transition-transform ${valeur <= 0 ? "opacity-40" : ""}`}
            >
              Continuer
            </button>
          )}

          {/* Voie secondaire : décrire en langage naturel */}
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-bordure" />
            <span className="text-xs font-medium text-sourdine">ou décris-la ✨</span>
            <span className="h-px flex-1 bg-bordure" />
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={phrase}
              inputMode="text"
              enterKeyHint="done"
              aria-label="Décrire une opération en langage naturel"
              onChange={(e) => setPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && interpreter()}
              placeholder="« 15€ courses Carrefour hier »"
              className="min-w-0 flex-1 champ champ-pill px-4 py-2.5 text-sm outline-none"
            />
            <button
              onClick={interpreter}
              disabled={!phrase.trim() || analyseEnCours}
              aria-label="Interpréter"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marque-pale text-marque-texte disabled:opacity-40"
            >
              {analyseEnCours ? <PointsSautillants taille={4} couleur="var(--marque-texte)" /> : "✨"}
            </button>
          </div>
        </div>
      ) : (
        <div key="e2" className="pop-in space-y-3">
          {erreurFormulaire && <p className="rounded-ios bg-corail-pale px-3 py-2 text-xs font-medium text-corail-texte" role="alert">{erreurFormulaire}</p>}
          {/* Rappel du montant, tap = retour */}
          <button onClick={() => setEtape(1)} className="flex w-full items-center gap-3 rounded-ios bg-voile px-3.5 py-2.5">
            <span className="text-sourdine">‹</span>
            <span className={`chiffres flex-1 text-left text-xl font-bold ${couleurMontant}`}>{euros(valeur, { precis: true })}</span>
            <span className="text-xs font-medium text-sourdine">Modifier</span>
          </button>

          {mode !== "virement" && (
            <>
              <input
                ref={libelleRef}
                placeholder="Libellé (ex : Carrefour, Loyer…)"
                value={libelle}
                enterKeyHint="next"
                autoCapitalize="words"
                onChange={(e) => { setLibelle(e.target.value); setAutoApplique(null); setIconeMemorisee(false); }}
                onBlur={(e) => appliquerHabitude(e.target.value)}
                className="w-full champ px-4 py-3 outline-none"
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
                  {autoApplique.icone ? ` ${autoApplique.icone}` : ""}
                </p>
              )}

              <IconePicker
                icone={icone}
                suggestion={iconeSuggeree}
                personnalisee={iconeManuelle || iconeMemorisee}
                message={iconeMemorisee ? "Mémorisée pour ce commerçant" : undefined}
                onChoisir={(emoji) => { setIcone(emoji); setIconeManuelle(true); setIconeMemorisee(false); }}
                onChoisirAuto={() => { setIcone(iconeSuggeree); setIconeManuelle(false); setIconeMemorisee(false); }}
              />

              {/* Lieu, avec les lieux déjà utilisés */}
              <div>
                <div className="flex items-center gap-2 champ px-3.5 py-2.5">
                  <span className="shrink-0 text-sm">📍</span>
                  <input
                    placeholder="Lieu (optionnel)"
                    value={lieu}
                    onChange={(e) => { setLieu(e.target.value); setLieuCoords(null); }}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  {chercheLieu && <PointsSautillants taille={4} couleur="var(--c-sourdine)" />}
                  {lieuCoords && !chercheLieu && (
                    <span className="shrink-0 text-xs text-menthe" title="Lieu confirmé">✓</span>
                  )}
                  {lieu && (
                    <button onClick={() => { setLieu(""); setLieuCoords(null); setRenommer(false); }} aria-label="Effacer le lieu" className="shrink-0 text-xs text-sourdine">✕</button>
                  )}
                </div>

                {/* Renommer l'adresse confirmée (ex : "86 Quai des Chartrons" → "Coiffeur") */}
                {lieuCoords && lieuCoords.adresseReelle && lieuCoords.nom === lieuCoords.adresseReelle && !renommer && (
                  <button
                    onClick={() => { setRenommer(true); setNomPerso(""); }}
                    className="mt-1.5 text-xs font-medium text-marque"
                  >
                    ✏️ Donner un nom à ce lieu
                  </button>
                )}
                {lieuCoords && lieuCoords.nom !== lieuCoords.adresseReelle && lieuCoords.adresseReelle && !renommer && (
                  <p className="mt-1.5 text-[11px] text-sourdine">
                    « {lieuCoords.nom} » · {lieuCoords.adresseReelle}
                    <button onClick={() => { setRenommer(true); setNomPerso(lieuCoords.nom); }} className="ml-1.5 font-medium text-marque">Modifier</button>
                  </p>
                )}
                {renommer && (
                  <div className="fade-in mt-1.5 flex gap-2">
                    <input
                      autoFocus
                      value={nomPerso}
                      onChange={(e) => setNomPerso(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && validerRenommage()}
                      placeholder="Ex : Coiffeur, Mon resto…"
                      className="min-w-0 flex-1 champ px-3 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={validerRenommage}
                      disabled={!nomPerso.trim()}
                      className="shrink-0 rounded-ios bg-marque-bouton px-3 text-sm font-semibold text-surMarque disabled:opacity-40"
                    >
                      OK
                    </button>
                  </div>
                )}

                {/* Lieux réels trouvés (OpenStreetMap) */}
                {suggestionsLieu.length > 0 && (
                  <div className="fade-in mt-1.5 overflow-hidden champ">
                    {suggestionsLieu.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => choisirLieu(s)}
                        className="tappable flex w-full items-start gap-2 border-b border-bordure px-3 py-2 text-left last:border-0 active:bg-voile"
                      >
                        <span className="mt-0.5 shrink-0 text-sm">📍</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{s.nom}</span>
                          {s.adresse && <span className="block truncate text-xs text-sourdine">{s.adresse}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Lieux déjà utilisés (instantané, depuis l'historique) */}
                {!lieu && lieuxFrequents.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {lieuxFrequents.slice(0, 5).map((l) => (
                      <button key={l} onClick={() => {
                        const perso = (profil.lieuxPerso || []).find((p) => p.nom === l);
                        setLieu(l);
                        if (perso) setLieuCoords({ nom: perso.nom, lat: perso.lat, lon: perso.lon, adresse: perso.adresse, adresseReelle: perso.adresse });
                      }} className="tappable rounded-pill bg-voile px-2.5 py-1 text-[12px] font-medium">
                        📍 {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cats.map(([id, c]) => (
                  <button key={id} onClick={() => setCategorie(id)}
                    aria-pressed={categorie === id}
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
              <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full min-w-0 champ px-3 py-3 outline-none">
                {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
            {mode === "virement" ? (
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Vers</span>
                <select value={versId} onChange={(e) => setVersId(e.target.value)} className="w-full min-w-0 champ px-3 py-3 outline-none">
                  {comptes.filter((c) => c.id !== compteId).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
            ) : (
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-w-0 champ px-2 py-3 text-[15px] outline-none" />
              </label>
            )}
          </div>

          {mode === "virement" && (
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-w-0 champ px-2 py-3 text-[15px] outline-none" />
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
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-carte shadow transition-transform ${horsSolde ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </span>
            </button>
          )}

          {noteIA && (
            <div className="fade-in rounded-ios bg-marque-pale px-3.5 py-2.5 text-xs text-marque-texte">
              ✨ {noteIA}
            </div>
          )}

          {doublon && (
            <div className="fade-in rounded-ios bg-beurre-pale px-3.5 py-2.5 text-xs text-beurre-texte" role="alert">
              ⚠️ Une opération similaire existe déjà ce jour-là ({doublon.libelle || "sans libellé"}, {euros(doublon.montant, { precis: true })}). {confirmationDoublon ? "Appuie une seconde fois sur Ajouter pour confirmer." : "Vérifie avant de l’ajouter."}
            </div>
          )}

          <button
            key={`btn-${secousse}`}
            onClick={() => {
              const invalide = !valeur || !compteId || (mode === "virement" && (!versId || versId === compteId));
              if (invalide) secouer();
              setErreurFormulaire("");
              valider();
            }}
            className={`w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque active:scale-[0.99] transition-transform ${
              !valeur || !compteId || (mode === "virement" && (!versId || versId === compteId)) ? "opacity-40" : ""
            } ${secousse ? "secousse" : ""}`}
          >
            {doublon && confirmationDoublon ? "Ajouter quand même" : "Ajouter"} {euros(valeur, { precis: true })}
          </button>
        </div>
      )}
    </Sheet>
  );
}
