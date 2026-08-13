"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { firebaseActif, auth, db } from "./firebase";
import { aujourdhui, prochaineOccurrence, CATEGORIES, definirCategoriesPerso, definirFormatAffichage, arrondir } from "./format";
import { appliquerAccent, ACCENT_DEFAUT } from "./themes";
import { calculerSoldes } from "./soldes";
import { estSauvegardePecule } from "./sauvegarde";
import { fetchSecurise } from "./api-client";
import { appliquerReglesAuto } from "./reglesAuto";

const Ctx = createContext(null);
export const useBudget = () => useContext(Ctx);

const CLE_LOCALE = "budget-v2-donnees";

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const donneesDemo = () => {
  const maintenant = new Date(`${aujourdhui()}T12:00:00`);
  const moisCourant = aujourdhui().slice(0, 7);
  const precedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
  const m = `${precedent.getFullYear()}-${String(precedent.getMonth() + 1).padStart(2, "0")}`;
  const date = (mois, jour) => `${mois}-${String(jour).padStart(2, "0")}`;
  return {
    comptes: [
      { id: "demo-courant", nom: "Compte courant", type: "courant", soldeInitial: 2860, ordre: 0 },
      { id: "demo-revolut", nom: "Revolut", type: "revolut", soldeInitial: 348.6, ordre: 1 },
      { id: "demo-swile", nom: "Swile", type: "swile", soldeInitial: 134.2, ordre: 2 },
      { id: "demo-livret", nom: "Livret A", type: "livretA", soldeInitial: 7420, ordre: 3 },
      { id: "demo-pea", nom: "PEA", type: "pea", soldeInitial: 2140, ordre: 4 },
    ],
    transactions: [
      { id: "demo-01", compteId: "demo-courant", montant: 2450, categorie: "salaire", libelle: "Salaire", date: date(m, 28) },
      { id: "demo-02", compteId: "demo-courant", montant: -895, categorie: "logement", libelle: "Loyer", date: date(m, 29) },
      { id: "demo-03", compteId: "demo-courant", montant: -58.74, categorie: "courses", libelle: "Carrefour", date: date(m, 30) },
      { id: "demo-04", compteId: "demo-revolut", montant: -13.49, categorie: "abonnements", libelle: "Netflix", date: date(m, 30) },
      { id: "demo-05", compteId: "demo-courant", montant: -10.99, categorie: "abonnements", libelle: "Apple Music", date: date(moisCourant, 2) },
      { id: "demo-06", compteId: "demo-courant", montant: -76.32, categorie: "courses", libelle: "Carrefour Market", date: date(moisCourant, 3), lieu: "Toulouse" },
      { id: "demo-07", compteId: "demo-swile", montant: -14.2, categorie: "resto", libelle: "Café Joyeux", date: date(moisCourant, 4) },
      { id: "demo-08", compteId: "demo-revolut", montant: -6.45, categorie: "resto", libelle: "Starbucks", date: date(moisCourant, 5) },
      { id: "demo-09", compteId: "demo-courant", montant: -42.8, categorie: "transport", libelle: "SNCF Connect", date: date(moisCourant, 6) },
      { id: "demo-10", compteId: "demo-courant", montant: -29.99, categorie: "abonnements", libelle: "Canal+", date: date(moisCourant, 7) },
      { id: "demo-11", compteId: "demo-courant", montant: -64, categorie: "shopping", libelle: "Decathlon", date: date(moisCourant, 8) },
      { id: "demo-12", compteId: "demo-courant", montant: -120, categorie: "virement", libelle: "Vers Livret A", versId: "demo-livret", date: date(moisCourant, 9) },
      { id: "demo-13", compteId: "demo-livret", montant: 120, categorie: "virement", libelle: "Depuis compte courant", versId: "demo-courant", date: date(moisCourant, 9) },
      { id: "demo-14", compteId: "demo-courant", montant: -21.5, categorie: "sante", libelle: "Pharmacie Lafayette", date: date(moisCourant, 10) },
      { id: "demo-15", compteId: "demo-revolut", montant: -17.9, categorie: "loisirs", libelle: "UGC Ciné Cité", date: date(moisCourant, 11) },
      { id: "demo-16", compteId: "demo-courant", montant: -850, categorie: "logement", libelle: "Loyer", date: date(moisCourant, 28), recurrenteId: "demo-r-loyer" },
      { id: "demo-17", compteId: "demo-courant", montant: -48.6, categorie: "factures", libelle: "Électricité", date: date(moisCourant, 20), recurrenteId: "demo-r-electricite" },
    ],
    budgets: { courses: 360, resto: 180, shopping: 140, abonnements: 70, transport: 120 },
    profil: { prenom: "Camille", revenuMensuel: 2450, jourSalaire: 28, modeSalaire: "jour", theme: "clair", accent: "indigo", reglesAuto: [{ id: "demo-rule", nom: "Netflix → Abonnements", mots: ["netflix"], categorie: "abonnements" }] },
    recurrentes: [
      { id: "demo-r-loyer", nom: "Loyer", compteId: "demo-courant", montant: -850, categorie: "logement", frequence: "mensuelle", jour: 28, actif: true },
      { id: "demo-r-electricite", nom: "Électricité", compteId: "demo-courant", montant: -48.6, categorie: "factures", frequence: "mensuelle", jour: 20, actif: true },
      { id: "demo-r-netflix", nom: "Netflix", compteId: "demo-revolut", montant: -13.49, categorie: "abonnements", frequence: "mensuelle", jour: 30, actif: true },
    ],
    projets: [
      { id: "demo-p-vacances", nom: "Voyage au Portugal", icone: "🌊", objectif: 2200, montantActuel: 1480, echeance: `${maintenant.getFullYear()}-10-01` },
      { id: "demo-p-securite", nom: "Coussin de sécurité", icone: "🛟", objectif: 3000, montantActuel: 2360, echeance: "" },
    ],
    credits: [{ id: "demo-credit", nom: "Prêt personnel", restant: 2140, mensualite: 108.61, taux: 3.2 }],
  };
};

export function DataProvider({ children }) {
  const [pret, setPret] = useState(false);
  const [, setTick] = useState(0);
  const [erreurInit, setErreurInit] = useState("");
  const [toast, setToast] = useState(null);
  const [categoriesPerso, setCategoriesPerso] = useState({});
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const celebrer = useCallback(() => setCelebration((n) => n + 1), []);

  // Projection IA : l'état vit dans le store pour survivre à la navigation entre pages.
  const [projIA, setProjIA] = useState({ chargement: false, resultat: null, erreur: "" });
  const lancerProjectionIA = useCallback(async (charge) => {
    setProjIA({ chargement: true, resultat: null, erreur: "" });
    try {
      const r = await fetchSecurise("/api/projection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(charge),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        const msg = r.status === 503 ? "Active l'IA (clé API) pour la projection." : d.erreur || `Erreur ${r.status}.`;
        setProjIA({ chargement: false, resultat: null, erreur: msg });
        return;
      }
      const data = await r.json();
      setProjIA({ chargement: false, resultat: data, erreur: "" });
    } catch {
      setProjIA({ chargement: false, resultat: null, erreur: "Connexion impossible." });
    }
  }, []);
  const reinitProjectionIA = useCallback(() => setProjIA({ chargement: false, resultat: null, erreur: "" }), []);
  const notifier = useCallback((message, icone = "✓", action = null) => {
    setToast({ id: Date.now(), message, icone, action });
  }, []);
  const [user, setUser] = useState(null);
  const [comptes, setComptes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [profil, setProfil] = useState({ prenom: "", revenuMensuel: 0, jourSalaire: 0, modeSalaire: "jour", theme: "auto" });
  const [recurrentes, setRecurrentes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [credits, setCredits] = useState([]);

  const modeLocal = !firebaseActif;

  // ------- Mode local (démo / sans Firebase) -------
  useEffect(() => {
    if (!modeLocal) return;
    try {
      const chargerDemo = new URLSearchParams(window.location.search).get("demo") === "1";
      const brut = localStorage.getItem(CLE_LOCALE);
      const sauvegarde = brut ? JSON.parse(brut) : {};
      // Le serveur de test doit toujours être immédiatement exploitable. Une
      // base locale vide reçoit donc le jeu fictif, mais une base déjà remplie
      // n'est jamais remplacée sans l'action explicite de l'utilisateur.
      const baseVide = !Array.isArray(sauvegarde.comptes) || sauvegarde.comptes.length === 0;
      const d = (chargerDemo || baseVide) ? donneesDemo() : sauvegarde;
      setComptes(d.comptes || []);
      setTransactions(d.transactions || []);
      setBudgets(d.budgets || {});
      setProfil({ theme: "auto", ...(d.profil || {}) });
      setRecurrentes(d.recurrentes || []);
      setProjets(d.projets || []);
      setCredits(d.credits || []);
      setCategoriesPerso(d.categoriesPerso || {});
      if (chargerDemo) window.history.replaceState({}, "", window.location.pathname);
    } catch {
      const d = {};
      setComptes([]);
      setTransactions([]);
      setBudgets({});
      setProfil({ prenom: "", revenuMensuel: 0 });
      setRecurrentes(d.recurrentes || []);
      setProjets(d.projets || []);
      setCredits(d.credits || []);
    }
    setPret(true);
  }, [modeLocal]);

  useEffect(() => {
    if (!modeLocal || !pret) return;
    localStorage.setItem(CLE_LOCALE, JSON.stringify({ comptes, transactions, budgets, profil, recurrentes, projets, credits, categoriesPerso }));
  }, [modeLocal, pret, comptes, transactions, budgets, profil, recurrentes, projets, credits, categoriesPerso]);

  // ------- Mode Firebase -------
  useEffect(() => {
    if (modeLocal) return;
    let stopsSnapshots = [];
    let stopAuth = null;
    let demarre = false;
    const garde = setTimeout(() => {
      if (!demarre) {
        setErreurInit("Firebase ne répond pas (délai dépassé). Vérifie les variables NEXT_PUBLIC_FIREBASE_* sur Vercel — en particulier API_KEY et AUTH_DOMAIN — puis redéploie.");
        setPret(true);
      }
    }, 8000);
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      if (!auth) {
        clearTimeout(garde);
        setErreurInit("Configuration Firebase incomplète : une ou plusieurs variables NEXT_PUBLIC_FIREBASE_* manquent sur Vercel.");
        setPret(true);
        return;
      }
      stopAuth = onAuthStateChanged(auth, async (u) => {
        demarre = true;
        clearTimeout(garde);
        stopsSnapshots.forEach((s) => s());
        stopsSnapshots = [];
        setUser(u);
        setPret(true); // afficher l'app immédiatement, les données arrivent ensuite
        if (!u) {
          setComptes([]); setTransactions([]); setBudgets({}); setProfil({ prenom: "", revenuMensuel: 0, jourSalaire: 0, theme: "auto" }); setRecurrentes([]); setProjets([]); setCredits([]);
          setPret(true);
          return;
        }
        try {
        const { collection, onSnapshot, doc } = await import("firebase/firestore");
        const base = `users/${u.uid}`;
        const surErreur = (e) => {
          console.error("Firestore:", e?.code || e?.message || e);
          const message = e?.code === "permission-denied"
            ? "L'accès à tes données est refusé. Vérifie les règles Firestore ou reconnecte-toi."
            : "Certaines données ne sont pas accessibles pour le moment. Vérifie ta connexion puis réessaie.";
          setErreurInit(message);
        };
        stopsSnapshots.push(
          onSnapshot(collection(db, `${base}/comptes`), (s) =>
            setComptes(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)))
          , surErreur),
          onSnapshot(collection(db, `${base}/transactions`), (s) =>
            setTransactions(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          , surErreur),
          onSnapshot(collection(db, `${base}/recurrentes`), (s) =>
            setRecurrentes(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          , surErreur),
          onSnapshot(collection(db, `${base}/projets`), (s) =>
            setProjets(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          , surErreur),
          onSnapshot(collection(db, `${base}/credits`), (s) =>
            setCredits(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          , surErreur),
          onSnapshot(doc(db, `${base}/parametres/app`), (s) => {
            const d = s.data() || {};
            setBudgets(d.budgets || {});
            setProfil({ theme: "auto", jourSalaire: 0, modeSalaire: "jour", ...(d.profil || {}) });
            setCategoriesPerso(d.categoriesPerso || {});
          }, surErreur)
        );
        } catch (e) {
          console.error("Initialisation Firestore:", e);
          setErreurInit(`Chargement des données impossible (${e?.code || e?.message || "erreur inconnue"}).`);
        }
      }, (e) => {
        demarre = true;
        clearTimeout(garde);
        setErreurInit(`Erreur d'authentification (${e?.code || e?.message || "inconnue"}).`);
        setPret(true);
      });
    }).catch((e) => {
      clearTimeout(garde);
      setErreurInit(`Initialisation Firebase impossible (${e?.code || e?.message || "erreur inconnue"}).`);
      setPret(true);
    });
    return () => {
      clearTimeout(garde);
      stopsSnapshots.forEach((s) => s());
      if (stopAuth) stopAuth();
    };
  }, [modeLocal]);

  // ------- CRUD unifié -------
  const fs = useCallback(async () => {
    const m = await import("firebase/firestore");
    return { ...m, base: `users/${auth.currentUser.uid}` };
  }, []);

  const ajouterCompte = useCallback(async (c) => {
    const nouveau = { soldeInitial: 0, ordre: comptes.length, ...c };
    if (modeLocal) setComptes((l) => [...l, { id: genId(), ...nouveau }]);
    else {
      const { addDoc, collection, base } = await fs();
      addDoc(collection(db, `${base}/comptes`), nouveau).catch((e) => console.error("Écriture:", e));
    }
    notifier(`Compte « ${nouveau.nom} » créé`);
  }, [modeLocal, comptes.length, fs, notifier]);

  const modifierCompte = useCallback(async (id, maj) => {
    if (modeLocal) setComptes((l) => l.map((c) => (c.id === id ? { ...c, ...maj } : c)));
    else {
      const { updateDoc, doc, base } = await fs();
      updateDoc(doc(db, `${base}/comptes`, id), maj).catch((e) => console.error("Écriture:", e));
    }
    notifier("Compte enregistré");
  }, [modeLocal, fs, notifier]);

  const supprimerCompte = useCallback(async (id) => {
    if (modeLocal) {
      setComptes((l) => l.filter((c) => c.id !== id));
      setTransactions((l) => l.filter((t) => t.compteId !== id));
      setRecurrentes((l) => l.filter((r) => r.compteId !== id));
      notifier("Compte supprimé", "🗑️");
      return;
    }
    const { deleteDoc, doc, getDocs, query, where, collection, base } = await fs();
    const qTx = query(collection(db, `${base}/transactions`), where("compteId", "==", id));
    const snapTx = await getDocs(qTx);
    snapTx.docs.forEach((d) => deleteDoc(d.ref).catch((e) => console.error("Écriture:", e)));
    // Les récurrentes du compte supprimé partiraient sinon en orphelines (invisibles dans les calculs)
    const qRec = query(collection(db, `${base}/recurrentes`), where("compteId", "==", id));
    const snapRec = await getDocs(qRec);
    snapRec.docs.forEach((d) => deleteDoc(d.ref).catch((e) => console.error("Écriture:", e)));
    deleteDoc(doc(db, `${base}/comptes`, id)).catch((e) => console.error("Écriture:", e));
    notifier("Compte supprimé", "🗑️");
  }, [modeLocal, fs]);

  const ajouterTransaction = useCallback(async (t, opts = {}) => {
    const regle = appliquerReglesAuto(t.libelle, profil.reglesAuto || [], categories);
    const nouvelle = {
      date: aujourdhui(),
      ...t,
      ...((!t.categorie || t.categorie === "autre") && regle ? { categorie: regle.categorie, regleAuto: regle.nom } : {}),
    };
    if (modeLocal) setTransactions((l) => [...l, { id: genId(), ...nouvelle }]);
    else {
      const { addDoc, collection, base } = await fs();
      addDoc(collection(db, `${base}/transactions`), nouvelle).catch((e) => console.error("Écriture:", e));
    }
    if (!opts.silencieux) notifier(nouvelle.montant >= 0 ? "Revenu ajouté" : "Dépense ajoutée");
  }, [modeLocal, fs, notifier, profil.reglesAuto]);

  const modifierTransaction = useCallback(async (id, maj, opts = {}) => {
    if (modeLocal) setTransactions((l) => l.map((t) => (t.id === id ? { ...t, ...maj } : t)));
    else {
      // Mise à jour immédiate de l'interface : le choix d'icône (comme tout
      // autre changement) est visible sans attendre le retour du listener
      // Firestore. Le listener reste la source de vérité ensuite.
      setTransactions((l) => l.map((t) => (t.id === id ? { ...t, ...maj } : t)));
      const { updateDoc, doc, base } = await fs();
      updateDoc(doc(db, `${base}/transactions`, id), maj).catch((e) => console.error("Écriture:", e));
    }
    if (!opts.silencieux) notifier("Opération modifiée");
  }, [modeLocal, fs, notifier]);

  // Fusion : la transaction existante est CONSERVÉE (même id, même catégorie, même impact
  // budgétaire) et enrichie du libellé exact de la banque. Le solde ne bouge pas.
  const fusionnerTransactions = useCallback(async (paires, lotId = null) => {
    for (const { id, libelle, date } of paires) {
      const avant = transactions.find((t) => t.id === id);
      const maj = {
        libelleBanque: libelle,
        importe: true,
        ...(lotId ? { lotImport: lotId } : {}),
        // Mémorise l'état antérieur pour permettre l'annulation
        avantFusion: { date: avant?.date ?? null, libelleBanque: avant?.libelleBanque ?? null },
      };
      if (date) maj.date = date;
      if (modeLocal) {
        setTransactions((l) => l.map((t) => (t.id === id ? { ...t, ...maj } : t)));
      } else {
        const { updateDoc, doc, base } = await fs();
        updateDoc(doc(db, `${base}/transactions`, id), maj).catch((e) => console.error("Écriture:", e));
      }
    }
  }, [modeLocal, fs, transactions]);

  // ------- Annulation d'un import (ajouts supprimés, fusions rétablies) -------
  const annulerImport = useCallback(async (lotId) => {
    if (!lotId) return { ajouts: 0, fusions: 0 };
    const ajouts = transactions.filter((t) => t.lotImport === lotId && !t.avantFusion);
    const fusions = transactions.filter((t) => t.lotImport === lotId && t.avantFusion);

    if (modeLocal) {
      const idsAjouts = new Set(ajouts.map((t) => t.id));
      setTransactions((l) =>
        l
          .filter((t) => !idsAjouts.has(t.id))
          .map((t) => {
            if (t.lotImport !== lotId || !t.avantFusion) return t;
            const { avantFusion, lotImport, libelleBanque, importe, ...reste } = t;
            return {
              ...reste,
              date: avantFusion.date || t.date,
              ...(avantFusion.libelleBanque ? { libelleBanque: avantFusion.libelleBanque } : {}),
            };
          })
      );
    } else {
      const { deleteDoc, updateDoc, doc, base, deleteField } = await fs();
      for (const t of ajouts) {
        deleteDoc(doc(db, `${base}/transactions`, t.id)).catch((e) => console.error("Écriture:", e));
      }
      for (const t of fusions) {
        updateDoc(doc(db, `${base}/transactions`, t.id), {
          date: t.avantFusion?.date || t.date,
          libelleBanque: t.avantFusion?.libelleBanque ?? deleteField(),
          lotImport: deleteField(),
          avantFusion: deleteField(),
          importe: deleteField(),
        }).catch((e) => console.error("Écriture:", e));
      }
    }

    notifier(`Import annulé (${ajouts.length} supprimée${ajouts.length > 1 ? "s" : ""}, ${fusions.length} rétablie${fusions.length > 1 ? "s" : ""})`, "↩️");
    return { ajouts: ajouts.length, fusions: fusions.length };
  }, [modeLocal, fs, transactions, notifier]);

  // Le dernier lot d'import présent dans les données
  const dernierImport = useMemo(() => {
    const lots = new Map();
    for (const t of transactions) {
      if (!t.lotImport) continue;
      const e = lots.get(t.lotImport) || { id: t.lotImport, ajouts: 0, fusions: 0, date: t.dateImport || "" };
      if (t.avantFusion) e.fusions++;
      else e.ajouts++;
      if (t.dateImport && t.dateImport > e.date) e.date = t.dateImport;
      lots.set(t.lotImport, e);
    }
    const tous = [...lots.values()].sort((a, b) => (b.id > a.id ? 1 : -1));
    return tous[0] || null;
  }, [transactions]);

  const supprimerTransaction = useCallback(async (id, opts = {}) => {
    const sauvegarde = transactions.find((t) => t.id === id);
    if (modeLocal) setTransactions((l) => l.filter((t) => t.id !== id));
    else {
      const { deleteDoc, doc, base } = await fs();
      deleteDoc(doc(db, `${base}/transactions`, id)).catch((e) => console.error("Écriture:", e));
    }
    if (!opts.silencieux) notifier("Opération supprimée", "🗑️", sauvegarde ? {
      label: "Annuler",
      executer: () => {
        const { id: _ignore, ...reste } = sauvegarde;
        ajouterTransaction(reste, { silencieux: true });
      },
    } : null);
  }, [modeLocal, fs, notifier, transactions, ajouterTransaction]);

  const sauverApp = useCallback(async (majBudgets, majProfil) => {
    const b = majBudgets ?? budgets;
    const p = majProfil ?? profil;
    setBudgets(b); setProfil(p);
    if (modeLocal) return;
    const { setDoc, doc, base } = await fs();
    setDoc(doc(db, `${base}/parametres/app`), { budgets: b, profil: p }, { merge: true }).catch((e) => console.error("Écriture:", e));
    notifier("Enregistré");
  }, [modeLocal, budgets, profil, fs, notifier]);


  // ------- Récurrentes -------
  const posterOccurrencesDues = useCallback(async (r) => {
    // Poste toutes les occurrences échues et renvoie la prochaine date à venir
    let date = r.prochaine;
    let n = 0;
    const auj = aujourdhui();
    while (date <= auj && n < 60) {
      await ajouterTransaction({ compteId: r.compteId, montant: r.montant, categorie: r.categorie, libelle: r.libelle, date, recurrenteId: r.id || "nouvelle" }, { silencieux: true });
      // Une récurrente peut suivre une règle (dernier jour ouvré…) plutôt qu'un
      // numéro de jour figé : on la transmet au moteur.
      date = prochaineOccurrence(date, r.frequence, { mode: r.modeSalaire || "jour" });
      n++;
    }
    return date;
  }, [ajouterTransaction]);

  const ajouterRecurrente = useCallback(async (r, opts = {}) => {
    const prochaine = await posterOccurrencesDues(r);
    const donnees = { actif: true, ...r, prochaine };
    if (modeLocal) {
      setRecurrentes((l) => [...l, { id: genId(), ...donnees }]);
      if (!opts.silencieux) notifier("Récurrence créée", "🔁");
      return;
    }
    const { addDoc, collection, base } = await fs();
    addDoc(collection(db, `${base}/recurrentes`), donnees).catch((e) => console.error("Écriture:", e));
    if (!opts.silencieux) notifier("Récurrence créée", "🔁");
  }, [modeLocal, fs, posterOccurrencesDues, notifier]);

  const modifierRecurrente = useCallback(async (id, maj) => {
    if (modeLocal) return setRecurrentes((l) => l.map((r) => (r.id === id ? { ...r, ...maj } : r)));
    const { updateDoc, doc, base } = await fs();
    updateDoc(doc(db, `${base}/recurrentes`, id), maj).catch((e) => console.error("Écriture:", e));
  }, [modeLocal, fs]);

  const supprimerRecurrente = useCallback(async (id) => {
    if (modeLocal) return setRecurrentes((l) => l.filter((r) => r.id !== id));
    const { deleteDoc, doc, base } = await fs();
    deleteDoc(doc(db, `${base}/recurrentes`, id)).catch((e) => console.error("Écriture:", e));
    notifier("Récurrence supprimée", "🗑️");
  }, [modeLocal, fs, notifier]);

  // À l'ouverture de l'app : applique les récurrences arrivées à échéance
  const recurrentesTraitees = useRef(false);
  useEffect(() => {
    if (!pret || recurrentesTraitees.current || recurrentes.length === 0) return;
    recurrentesTraitees.current = true;
    (async () => {
      for (const r of recurrentes) {
        if (r.actif === false || !r.prochaine) continue;
        if (!comptes.some((c) => c.id === r.compteId)) continue; // compte supprimé : rien à poster
        if (r.prochaine <= aujourdhui()) {
          const prochaine = await posterOccurrencesDues(r);
          await modifierRecurrente(r.id, { prochaine });
        }
      }
    })();
  }, [pret, recurrentes, comptes, posterOccurrencesDues, modifierRecurrente]);

  // Rejoue le moteur à la demande. Utile car une PWA reste souvent ouverte
  // plusieurs jours : sans cela, les échéances du jour n'arrivent qu'au
  // prochain démarrage complet.
  const rafraichir = useCallback(async () => {
    let postees = 0;
    for (const r of recurrentes) {
      if (r.actif === false || !r.prochaine) continue;
      if (!comptes.some((c) => c.id === r.compteId)) continue;
      if (r.prochaine <= aujourdhui()) {
        const prochaine = await posterOccurrencesDues(r);
        await modifierRecurrente(r.id, { prochaine });
        postees++;
      }
    }
    return postees;
  }, [recurrentes, comptes, posterOccurrencesDues, modifierRecurrente]);

  // ------- Projets d'épargne -------
  const ajouterProjet = useCallback(async (p) => {
    const donnees = { montantActuel: 0, icone: "🎯", ...p };
    if (modeLocal) return setProjets((l) => [...l, { id: genId(), ...donnees }]);
    const { addDoc, collection, base } = await fs();
    addDoc(collection(db, `${base}/projets`), donnees).catch((e) => console.error("Écriture:", e));
    notifier("Projet créé", "🎯");
  }, [modeLocal, fs, notifier]);

  const modifierProjet = useCallback(async (id, maj) => {
    if (modeLocal) return setProjets((l) => l.map((p) => (p.id === id ? { ...p, ...maj } : p)));
    const { updateDoc, doc, base } = await fs();
    updateDoc(doc(db, `${base}/projets`, id), maj).catch((e) => console.error("Écriture:", e));
    notifier("Projet mis à jour");
  }, [modeLocal, fs, notifier]);

  const supprimerProjet = useCallback(async (id) => {
    if (modeLocal) return setProjets((l) => l.filter((p) => p.id !== id));
    const { deleteDoc, doc, base } = await fs();
    deleteDoc(doc(db, `${base}/projets`, id)).catch((e) => console.error("Écriture:", e));
    notifier("Projet supprimé", "🗑️");
  }, [modeLocal, fs, notifier]);

  // ------- Crédits -------
  const ajouterCredit = useCallback(async (c) => {
    if (modeLocal) return setCredits((l) => [...l, { id: genId(), ...c }]);
    const { addDoc, collection, base } = await fs();
    addDoc(collection(db, `${base}/credits`), c).catch((e) => console.error("Écriture:", e));
    notifier("Crédit ajouté", "🏦");
  }, [modeLocal, fs, notifier]);

  const modifierCredit = useCallback(async (id, maj) => {
    if (modeLocal) return setCredits((l) => l.map((c) => (c.id === id ? { ...c, ...maj } : c)));
    const { updateDoc, doc, base } = await fs();
    updateDoc(doc(db, `${base}/credits`, id), maj).catch((e) => console.error("Écriture:", e));
    notifier("Crédit enregistré");
  }, [modeLocal, fs, notifier]);

  const supprimerCredit = useCallback(async (id) => {
    if (modeLocal) return setCredits((l) => l.filter((c) => c.id !== id));
    const { deleteDoc, doc, base } = await fs();
    deleteDoc(doc(db, `${base}/credits`, id)).catch((e) => console.error("Écriture:", e));
    notifier("Crédit supprimé", "🗑️");
  }, [modeLocal, fs, notifier]);

  // ------- Import par lot (CSV) -------
  const ajouterTransactionsLot = useCallback(async (liste) => {
    if (modeLocal) {
      setTransactions((l) => [...l, ...liste.map((t) => ({ id: genId(), ...t }))]);
      notifier(`${liste.length} opération${liste.length > 1 ? "s" : ""} importée${liste.length > 1 ? "s" : ""}`, "⬇︎");
      return;
    }
    const { writeBatch, doc, collection, base } = await fs();
    // Firestore limite un batch à 500 écritures
    for (let i = 0; i < liste.length; i += 450) {
      const batch = writeBatch(db);
      for (const t of liste.slice(i, i + 450)) {
        batch.set(doc(collection(db, `${base}/transactions`)), t);
      }
      await batch.commit();
    }
    notifier(`${liste.length} opération${liste.length > 1 ? "s" : ""} importée${liste.length > 1 ? "s" : ""}`, "⬇︎");
  }, [modeLocal, fs, notifier]);

  // ------- Import bancaire Powens -------
  // Le solde Powens est le solde d'aujourd'hui. Pour qu'il reste exact une fois
  // l'historique importé, on initialise le compte au solde moins ses opérations
  // déjà passées. Les opérations à venir ne modifient pas le solde courant.
  const importerDonneesPowens = useCallback(async ({ accounts = [], transactions: transactionsPowens = [] }) => {
    const dateImport = new Date().toISOString();
    const existants = new Map(comptes.filter((c) => c.powensId).map((c) => [String(c.powensId), c]));
    const typeCompte = (type, nom) => {
      const texte = `${type || ""} ${nom || ""}`.toLowerCase();
      if (/loan|credit|cr[eé]dit|pr[êe]t|emprunt|mortgage/.test(texte)) return "credit";
      if (/livret\s*a|savings|épargne|epargne|deposit/.test(texte)) return "livretA";
      if (/ldds/.test(texte)) return "ldds";
      if (/pea|securit|investment|market/.test(texte)) return "pea";
      if (/cash|esp[eè]ces/.test(texte)) return "especes";
      return "courant";
    };
    const aujourdHui = aujourdhui();
    const nouveauxComptes = accounts.filter((a) => !existants.has(String(a.id)));
    const idLocalParPowens = new Map(existants);
    const preparations = nouveauxComptes.map((a, index) => {
      const id = genId();
      idLocalParPowens.set(String(a.id), { id });
      const mouvementsPasses = transactionsPowens
        .filter((t) => String(t.accountId) === String(a.id) && t.date && t.date <= aujourdHui && !t.coming)
        .reduce((total, t) => total + Number(t.amount || 0), 0);
      return {
        id,
        nom: a.name,
        type: typeCompte(a.type, a.name),
        soldeInitial: arrondir(Number(a.balance || 0) - mouvementsPasses),
        ordre: comptes.length + index,
        powensId: String(a.id),
        source: "powens",
        derniereSyncPowens: dateImport,
      };
    });
    const dejaImportees = new Set(transactions.filter((t) => t.powensId).map((t) => String(t.powensId)));
    const nouvellesTransactions = transactionsPowens
      .filter((t) => !dejaImportees.has(String(t.id)) && idLocalParPowens.has(String(t.accountId)) && t.date)
      .map((t) => ({
        compteId: idLocalParPowens.get(String(t.accountId)).id,
        montant: arrondir(Number(t.amount || 0)),
        categorie: "autre",
        libelle: t.label || "Opération bancaire",
        libelleBanque: t.label || "Opération bancaire",
        date: t.date,
        powensId: String(t.id),
        source: "powens",
        importe: true,
        dateImport,
        ...(t.coming ? { aVenirBanque: true } : {}),
      }));

    if (modeLocal) {
      setComptes((liste) => [...liste, ...preparations]);
      setTransactions((liste) => [...liste, ...nouvellesTransactions]);
    } else {
      const { writeBatch, doc, collection, base } = await fs();
      const operations = [
        ...preparations.map((compte) => ({ collection: "comptes", id: compte.id, data: (() => { const { id, ...reste } = compte; return reste; })() })),
        ...nouvellesTransactions.map((transaction) => ({ collection: "transactions", data: transaction })),
      ];
      for (let i = 0; i < operations.length; i += 450) {
        const batch = writeBatch(db);
        for (const operation of operations.slice(i, i + 450)) {
          const ref = operation.id ? doc(db, `${base}/${operation.collection}/${operation.id}`) : doc(collection(db, `${base}/${operation.collection}`));
          batch.set(ref, operation.data);
        }
        await batch.commit();
      }
    }
    notifier(`${preparations.length} compte${preparations.length > 1 ? "s" : ""} et ${nouvellesTransactions.length} opération${nouvellesTransactions.length > 1 ? "s" : ""} importés`, "🏦");
    return { comptes: preparations.length, transactions: nouvellesTransactions.length };
  }, [comptes, transactions, modeLocal, fs, notifier]);

  const virement = useCallback(async (deId, versId, montant, date) => {
    const de = comptes.find((c) => c.id === deId);
    const vers = comptes.find((c) => c.id === versId);
    await ajouterTransaction({ compteId: deId, montant: -Math.abs(montant), categorie: "virement", libelle: `Vers ${vers?.nom || "compte"}`, date }, { silencieux: true });
    await ajouterTransaction({ compteId: versId, montant: Math.abs(montant), categorie: "virement", libelle: `Depuis ${de?.nom || "compte"}`, date }, { silencieux: true });
    notifier("Virement effectué", "🔁");
  }, [comptes, ajouterTransaction]);

  const reinitialiserDemo = useCallback(() => {
    if (!modeLocal) return;
    setComptes([]); setTransactions([]); setBudgets({}); setProfil({ prenom: "", revenuMensuel: 0 });
    setRecurrentes([]); setProjets([]); setCredits([]);
  }, [modeLocal]);

  const chargerDonneesDemo = useCallback(() => {
    if (!modeLocal) return;
    const d = donneesDemo();
    setComptes(d.comptes);
    setTransactions(d.transactions);
    setBudgets(d.budgets);
    setProfil(d.profil);
    setRecurrentes(d.recurrentes);
    setProjets(d.projets);
    setCredits(d.credits);
    setCategoriesPerso({});
    notifier("Jeu de démonstration chargé", "✨");
  }, [modeLocal, notifier]);


  // ------- Format d'affichage (centimes, arrondis) -------
  useEffect(() => {
    definirFormatAffichage({
      centimes: profil.afficherCentimes !== false,
      arrondiGrandsNombres: profil.arrondiGrandsNombres !== false,
    });
    // Force un recalcul de l'affichage en touchant un état neutre
    setTick((t) => t + 1);
  }, [profil.afficherCentimes, profil.arrondiGrandsNombres]);

  // ------- Thème clair / sombre -------
  useEffect(() => {
    const pref = profil.theme || "auto";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const appliquer = () => {
      const sombre = pref === "sombre" || (pref === "auto" && media.matches);
      document.documentElement.classList.toggle("sombre", sombre);
      appliquerAccent(profil.accent || ACCENT_DEFAUT, sombre);
      try { localStorage.setItem("budget-theme", pref); localStorage.setItem("budget-accent", profil.accent || ACCENT_DEFAUT); } catch {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", sombre ? "#000000" : "#F2F2F7");
    };
    appliquer();
    media.addEventListener("change", appliquer);
    return () => media.removeEventListener("change", appliquer);
  }, [profil.theme, profil.accent]);

  const importerDonnees = useCallback(async (d) => {
    if (!estSauvegardePecule(d)) return false;
    const donnees = {
      comptes: Array.isArray(d.comptes) ? d.comptes : [],
      transactions: Array.isArray(d.transactions) ? d.transactions : [],
      recurrentes: Array.isArray(d.recurrentes) ? d.recurrentes : [],
      projets: Array.isArray(d.projets) ? d.projets : [],
      credits: Array.isArray(d.credits) ? d.credits : [],
      budgets: d.budgets && typeof d.budgets === "object" ? d.budgets : {},
      profil: d.profil && typeof d.profil === "object" ? d.profil : { prenom: "", revenuMensuel: 0 },
      categoriesPerso: d.categoriesPerso && typeof d.categoriesPerso === "object" ? d.categoriesPerso : {},
    };
    if (modeLocal) {
      setComptes(donnees.comptes);
      setTransactions(donnees.transactions);
      setRecurrentes(donnees.recurrentes);
      setProjets(donnees.projets);
      setCredits(donnees.credits);
      setBudgets(donnees.budgets);
      setProfil(donnees.profil);
      setCategoriesPerso(donnees.categoriesPerso);
      return true;
    }
    // Mode Firebase : on écrit chaque document avec son ID d'origine
    // pour préserver les liens transactions ↔ comptes. Les listeners
    // Firestore mettront l'état à jour automatiquement.
    const { writeBatch, doc, setDoc, base } = await fs();
    const collections = [
      ["comptes", donnees.comptes],
      ["transactions", donnees.transactions],
      ["recurrentes", donnees.recurrentes],
      ["projets", donnees.projets],
      ["credits", donnees.credits],
    ];
    const ecritures = [];
    for (const [nomCol, liste] of collections) {
      for (const element of liste) {
        const { id, ...reste } = element;
        if (!id) continue;
        ecritures.push([`${base}/${nomCol}/${id}`, reste]);
      }
    }
    for (let i = 0; i < ecritures.length; i += 450) {
      const batch = writeBatch(db);
      for (const [chemin, valeurs] of ecritures.slice(i, i + 450)) {
        batch.set(doc(db, chemin), valeurs);
      }
      await batch.commit();
    }
    await setDoc(doc(db, `${base}/parametres/app`), { budgets: donnees.budgets, profil: { ...donnees.profil, onboarde: true }, categoriesPerso: donnees.categoriesPerso }, { merge: true });
    return true;
  }, [modeLocal, fs]);

  // ------- Migration : fusion des anciens virements (deux écritures -> une) -------
  const migrationVirements = useRef(false);
  useEffect(() => {
    if (!pret || migrationVirements.current || transactions.length === 0) return;
    const sortants = transactions.filter((t) => t.categorie === "virement" && !t.versId && t.montant < 0);
    if (sortants.length === 0) { migrationVirements.current = true; return; }
    const entrants = transactions.filter((t) => t.categorie === "virement" && !t.versId && t.montant > 0);
    const utilisees = new Set();
    const paires = [];
    for (const sortie of sortants) {
      const entree = entrants.find(
        (e) => !utilisees.has(e.id) && e.date === sortie.date && Math.abs(e.montant + sortie.montant) < 0.005 && e.compteId !== sortie.compteId
      );
      if (entree) { utilisees.add(entree.id); paires.push([sortie, entree]); }
    }
    migrationVirements.current = true;
    if (paires.length === 0) return;
    (async () => {
      for (const [sortie, entree] of paires) {
        const de = comptes.find((c) => c.id === sortie.compteId);
        const vers = comptes.find((c) => c.id === entree.compteId);
        await modifierTransaction(sortie.id, {
          montant: Math.abs(sortie.montant),
          versId: entree.compteId,
          libelle: `${de?.nom || "Compte"} → ${vers?.nom || "Compte"}`,
        }, { silencieux: true });
        await supprimerTransaction(entree.id, { silencieux: true });
      }
    })();
  }, [pret, transactions, comptes, modifierTransaction, supprimerTransaction]);

  // Registre fusionné (réactif pour l'UI + module pour les fonctions pures)
  useEffect(() => { definirCategoriesPerso(categoriesPerso); }, [categoriesPerso]);
  const categories = useMemo(() => {
    const fusion = { ...CATEGORIES };
    for (const [cle, c] of Object.entries(categoriesPerso)) {
      if (!CATEGORIES[cle] && c?.label) fusion[cle] = { label: c.label, icone: c.icone || "🏷️", type: c.type || "envie", perso: true };
    }
    return fusion;
  }, [categoriesPerso]);

  const sauverCategoriesPerso = useCallback(async (perso) => {
    setCategoriesPerso(perso);
    if (!modeLocal) {
      const { setDoc, doc, base } = await fs();
      setDoc(doc(db, `${base}/parametres/app`), { categoriesPerso: perso }, { merge: true }).catch((e) => console.error("Écriture:", e));
    }
    notifier("Catégories enregistrées", "🏷️");
  }, [modeLocal, fs, notifier]);

  // Les règles ne sont pas qu'une suggestion dans l'écran d'ajout : elles peuvent
  // aussi remettre à niveau l'historique, sans écraser une catégorie déjà choisie.
  const appliquerReglesExistantes = useCallback(async () => {
    const candidates = transactions
      .map((transaction) => ({ transaction, regle: appliquerReglesAuto(transaction.libelle, profil.reglesAuto || [], categories) }))
      .filter(({ transaction, regle }) => regle && (!transaction.categorie || transaction.categorie === "autre") && transaction.categorie !== regle.categorie);
    for (const { transaction, regle } of candidates) {
      await modifierTransaction(transaction.id, { categorie: regle.categorie, regleAuto: regle.nom }, { silencieux: true });
    }
    if (candidates.length) notifier(`${candidates.length} opération${candidates.length > 1 ? "s" : ""} classée${candidates.length > 1 ? "s" : ""} automatiquement`, "⚡");
    else notifier("Aucune opération à mettre à jour", "✓");
    return candidates.length;
  }, [transactions, profil.reglesAuto, categories, modifierTransaction, notifier]);

  // ------- Soldes calculés -------
  const soldes = useMemo(() => calculerSoldes(comptes, transactions, aujourdhui()), [comptes, transactions]);

  const valeur = {
    pret, user, modeLocal, erreurInit, toast, notifier,
    categories, categoriesPerso, sauverCategoriesPerso,
    reglagesOuverts, setReglagesOuverts,
    celebration, celebrer,
    projIA, lancerProjectionIA, reinitProjectionIA,
    rafraichir,
    comptes, transactions, budgets, profil, soldes, recurrentes, projets, credits,
    ajouterCompte, modifierCompte, supprimerCompte,
    ajouterTransaction, modifierTransaction, supprimerTransaction, ajouterTransactionsLot, fusionnerTransactions, importerDonneesPowens, appliquerReglesExistantes,
    annulerImport, dernierImport,
    ajouterRecurrente, modifierRecurrente, supprimerRecurrente,
    ajouterProjet, modifierProjet, supprimerProjet,
    ajouterCredit, modifierCredit, supprimerCredit,
    sauverApp, virement, reinitialiserDemo, chargerDonneesDemo, importerDonnees,
  };

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}
