"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { firebaseActif, auth, db } from "./firebase";
import { aujourdhui, prochaineOccurrence } from "./format";

const Ctx = createContext(null);
export const useBudget = () => useContext(Ctx);

const CLE_LOCALE = "budget-v2-donnees";

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const donneesDemo = () => {
  const m = aujourdhui().slice(0, 7);
  return {
    comptes: [
      { id: "c1", nom: "Compte courant", type: "courant", soldeInitial: 1240, ordre: 0 },
      { id: "c2", nom: "Revolut", type: "revolut", soldeInitial: 310, ordre: 1 },
      { id: "c3", nom: "Swile", type: "swile", soldeInitial: 152, ordre: 2 },
      { id: "c4", nom: "Livret A", type: "livretA", soldeInitial: 6800, ordre: 3 },
    ],
    transactions: [
      { id: "t1", compteId: "c1", montant: 2350, categorie: "salaire", libelle: "Salaire", date: `${m}-02` },
      { id: "t2", compteId: "c1", montant: -890, categorie: "logement", libelle: "Loyer", date: `${m}-03` },
      { id: "t3", compteId: "c1", montant: -64.3, categorie: "courses", libelle: "Carrefour", date: `${m}-04` },
      { id: "t4", compteId: "c2", montant: -12.99, categorie: "abonnements", libelle: "Netflix", date: `${m}-05` },
      { id: "t5", compteId: "c3", montant: -11.5, categorie: "resto", libelle: "Déjeuner", date: `${m}-05` },
      { id: "t6", compteId: "c1", montant: -200, categorie: "virement", libelle: "Vers Livret A", date: `${m}-06` },
      { id: "t7", compteId: "c4", montant: 200, categorie: "virement", libelle: "Depuis compte courant", date: `${m}-06` },
    ],
    budgets: { courses: 350, resto: 150, shopping: 100 },
    profil: { prenom: "", revenuMensuel: 2350, jourSalaire: 2, theme: "auto" },
    recurrentes: [],
    projets: [
      { id: "p1", nom: "Vacances", icone: "🏖️", objectif: 2000, montantActuel: 650, echeance: "" },
    ],
    credits: [],
  };
};

export function DataProvider({ children }) {
  const [pret, setPret] = useState(false);
  const [erreurInit, setErreurInit] = useState("");
  const [user, setUser] = useState(null);
  const [comptes, setComptes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [profil, setProfil] = useState({ prenom: "", revenuMensuel: 0, jourSalaire: 0, theme: "auto" });
  const [recurrentes, setRecurrentes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [credits, setCredits] = useState([]);

  const modeLocal = !firebaseActif;

  // ------- Mode local (démo / sans Firebase) -------
  useEffect(() => {
    if (!modeLocal) return;
    try {
      const brut = localStorage.getItem(CLE_LOCALE);
      const d = brut ? JSON.parse(brut) : {};
      setComptes(d.comptes || []);
      setTransactions(d.transactions || []);
      setBudgets(d.budgets || {});
      setProfil({ theme: "auto", ...(d.profil || {}) });
      setRecurrentes(d.recurrentes || []);
      setProjets(d.projets || []);
      setCredits(d.credits || []);
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
    localStorage.setItem(CLE_LOCALE, JSON.stringify({ comptes, transactions, budgets, profil, recurrentes, projets, credits }));
  }, [modeLocal, pret, comptes, transactions, budgets, profil, recurrentes, projets, credits]);

  // ------- Mode Firebase -------
  useEffect(() => {
    if (modeLocal) return;
    let stops = [];
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
      const stopAuth = onAuthStateChanged(auth, async (u) => {
        demarre = true;
        clearTimeout(garde);
        stops.forEach((s) => s());
        stops = [];
        setUser(u);
        if (!u) {
          setComptes([]); setTransactions([]); setBudgets({}); setProfil({ prenom: "", revenuMensuel: 0, jourSalaire: 0, theme: "auto" }); setRecurrentes([]); setProjets([]); setCredits([]);
          setPret(true);
          return;
        }
        const { collection, onSnapshot, doc } = await import("firebase/firestore");
        const base = `users/${u.uid}`;
        stops.push(
          onSnapshot(collection(db, `${base}/comptes`), (s) =>
            setComptes(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)))
          ),
          onSnapshot(collection(db, `${base}/transactions`), (s) =>
            setTransactions(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          ),
          onSnapshot(collection(db, `${base}/recurrentes`), (s) =>
            setRecurrentes(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          ),
          onSnapshot(collection(db, `${base}/projets`), (s) =>
            setProjets(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          ),
          onSnapshot(collection(db, `${base}/credits`), (s) =>
            setCredits(s.docs.map((d) => ({ id: d.id, ...d.data() })))
          ),
          onSnapshot(doc(db, base, "app"), (s) => {
            const d = s.data() || {};
            setBudgets(d.budgets || {});
            setProfil({ theme: "auto", jourSalaire: 0, ...(d.profil || {}) });
          })
        );
        setPret(true);
      }, (e) => {
        demarre = true;
        clearTimeout(garde);
        setErreurInit(`Erreur d'authentification (${e?.code || e?.message || "inconnue"}).`);
        setPret(true);
      });
      stops.push(stopAuth);
    }).catch((e) => {
      clearTimeout(garde);
      setErreurInit(`Initialisation Firebase impossible (${e?.code || e?.message || "erreur inconnue"}).`);
      setPret(true);
    });
    return () => { clearTimeout(garde); stops.forEach((s) => s()); };
  }, [modeLocal]);

  // ------- CRUD unifié -------
  const fs = useCallback(async () => {
    const m = await import("firebase/firestore");
    return { ...m, base: `users/${auth.currentUser.uid}` };
  }, []);

  const ajouterCompte = useCallback(async (c) => {
    const nouveau = { soldeInitial: 0, ordre: comptes.length, ...c };
    if (modeLocal) return setComptes((l) => [...l, { id: genId(), ...nouveau }]);
    const { addDoc, collection, base } = await fs();
    await addDoc(collection(db, `${base}/comptes`), nouveau);
  }, [modeLocal, comptes.length, fs]);

  const modifierCompte = useCallback(async (id, maj) => {
    if (modeLocal) return setComptes((l) => l.map((c) => (c.id === id ? { ...c, ...maj } : c)));
    const { updateDoc, doc, base } = await fs();
    await updateDoc(doc(db, `${base}/comptes`, id), maj);
  }, [modeLocal, fs]);

  const supprimerCompte = useCallback(async (id) => {
    if (modeLocal) {
      setComptes((l) => l.filter((c) => c.id !== id));
      setTransactions((l) => l.filter((t) => t.compteId !== id));
      return;
    }
    const { deleteDoc, doc, getDocs, query, where, collection, base } = await fs();
    const q = query(collection(db, `${base}/transactions`), where("compteId", "==", id));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, `${base}/comptes`, id));
  }, [modeLocal, fs]);

  const ajouterTransaction = useCallback(async (t) => {
    const nouvelle = { date: aujourdhui(), ...t };
    if (modeLocal) return setTransactions((l) => [...l, { id: genId(), ...nouvelle }]);
    const { addDoc, collection, base } = await fs();
    await addDoc(collection(db, `${base}/transactions`), nouvelle);
  }, [modeLocal, fs]);

  const supprimerTransaction = useCallback(async (id) => {
    if (modeLocal) return setTransactions((l) => l.filter((t) => t.id !== id));
    const { deleteDoc, doc, base } = await fs();
    await deleteDoc(doc(db, `${base}/transactions`, id));
  }, [modeLocal, fs]);

  const sauverApp = useCallback(async (majBudgets, majProfil) => {
    const b = majBudgets ?? budgets;
    const p = majProfil ?? profil;
    setBudgets(b); setProfil(p);
    if (modeLocal) return;
    const { setDoc, doc, base } = await fs();
    await setDoc(doc(db, base, "app"), { budgets: b, profil: p }, { merge: true });
  }, [modeLocal, budgets, profil, fs]);


  // ------- Récurrentes -------
  const posterOccurrencesDues = useCallback(async (r) => {
    // Poste toutes les occurrences échues et renvoie la prochaine date à venir
    let date = r.prochaine;
    let n = 0;
    const auj = aujourdhui();
    while (date <= auj && n < 60) {
      await ajouterTransaction({ compteId: r.compteId, montant: r.montant, categorie: r.categorie, libelle: r.libelle, date, recurrenteId: r.id || "nouvelle" });
      date = prochaineOccurrence(date, r.frequence);
      n++;
    }
    return date;
  }, [ajouterTransaction]);

  const ajouterRecurrente = useCallback(async (r) => {
    const prochaine = await posterOccurrencesDues(r);
    const donnees = { actif: true, ...r, prochaine };
    if (modeLocal) return setRecurrentes((l) => [...l, { id: genId(), ...donnees }]);
    const { addDoc, collection, base } = await fs();
    await addDoc(collection(db, `${base}/recurrentes`), donnees);
  }, [modeLocal, fs, posterOccurrencesDues]);

  const modifierRecurrente = useCallback(async (id, maj) => {
    if (modeLocal) return setRecurrentes((l) => l.map((r) => (r.id === id ? { ...r, ...maj } : r)));
    const { updateDoc, doc, base } = await fs();
    await updateDoc(doc(db, `${base}/recurrentes`, id), maj);
  }, [modeLocal, fs]);

  const supprimerRecurrente = useCallback(async (id) => {
    if (modeLocal) return setRecurrentes((l) => l.filter((r) => r.id !== id));
    const { deleteDoc, doc, base } = await fs();
    await deleteDoc(doc(db, `${base}/recurrentes`, id));
  }, [modeLocal, fs]);

  // À l'ouverture de l'app : applique les récurrences arrivées à échéance
  const recurrentesTraitees = useRef(false);
  useEffect(() => {
    if (!pret || recurrentesTraitees.current || recurrentes.length === 0) return;
    recurrentesTraitees.current = true;
    (async () => {
      for (const r of recurrentes) {
        if (r.actif === false || !r.prochaine) continue;
        if (r.prochaine <= aujourdhui()) {
          const prochaine = await posterOccurrencesDues(r);
          await modifierRecurrente(r.id, { prochaine });
        }
      }
    })();
  }, [pret, recurrentes, posterOccurrencesDues, modifierRecurrente]);

  // ------- Projets d'épargne -------
  const ajouterProjet = useCallback(async (p) => {
    const donnees = { montantActuel: 0, icone: "🎯", ...p };
    if (modeLocal) return setProjets((l) => [...l, { id: genId(), ...donnees }]);
    const { addDoc, collection, base } = await fs();
    await addDoc(collection(db, `${base}/projets`), donnees);
  }, [modeLocal, fs]);

  const modifierProjet = useCallback(async (id, maj) => {
    if (modeLocal) return setProjets((l) => l.map((p) => (p.id === id ? { ...p, ...maj } : p)));
    const { updateDoc, doc, base } = await fs();
    await updateDoc(doc(db, `${base}/projets`, id), maj);
  }, [modeLocal, fs]);

  const supprimerProjet = useCallback(async (id) => {
    if (modeLocal) return setProjets((l) => l.filter((p) => p.id !== id));
    const { deleteDoc, doc, base } = await fs();
    await deleteDoc(doc(db, `${base}/projets`, id));
  }, [modeLocal, fs]);

  // ------- Crédits -------
  const ajouterCredit = useCallback(async (c) => {
    if (modeLocal) return setCredits((l) => [...l, { id: genId(), ...c }]);
    const { addDoc, collection, base } = await fs();
    await addDoc(collection(db, `${base}/credits`), c);
  }, [modeLocal, fs]);

  const modifierCredit = useCallback(async (id, maj) => {
    if (modeLocal) return setCredits((l) => l.map((c) => (c.id === id ? { ...c, ...maj } : c)));
    const { updateDoc, doc, base } = await fs();
    await updateDoc(doc(db, `${base}/credits`, id), maj);
  }, [modeLocal, fs]);

  const supprimerCredit = useCallback(async (id) => {
    if (modeLocal) return setCredits((l) => l.filter((c) => c.id !== id));
    const { deleteDoc, doc, base } = await fs();
    await deleteDoc(doc(db, `${base}/credits`, id));
  }, [modeLocal, fs]);

  // ------- Import par lot (CSV) -------
  const ajouterTransactionsLot = useCallback(async (liste) => {
    if (modeLocal) {
      setTransactions((l) => [...l, ...liste.map((t) => ({ id: genId(), ...t }))]);
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
  }, [modeLocal, fs]);

  const virement = useCallback(async (deId, versId, montant, date) => {
    const de = comptes.find((c) => c.id === deId);
    const vers = comptes.find((c) => c.id === versId);
    await ajouterTransaction({ compteId: deId, montant: -Math.abs(montant), categorie: "virement", libelle: `Vers ${vers?.nom || "compte"}`, date });
    await ajouterTransaction({ compteId: versId, montant: Math.abs(montant), categorie: "virement", libelle: `Depuis ${de?.nom || "compte"}`, date });
  }, [comptes, ajouterTransaction]);

  const reinitialiserDemo = useCallback(() => {
    if (!modeLocal) return;
    setComptes([]); setTransactions([]); setBudgets({}); setProfil({ prenom: "", revenuMensuel: 0 });
    setRecurrentes([]); setProjets([]); setCredits([]);
  }, [modeLocal]);


  // ------- Thème clair / sombre -------
  useEffect(() => {
    const pref = profil.theme || "auto";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const appliquer = () => {
      const sombre = pref === "sombre" || (pref === "auto" && media.matches);
      document.documentElement.classList.toggle("sombre", sombre);
      try { localStorage.setItem("budget-theme", pref); } catch {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", sombre ? "#10131F" : "#F6F6FA");
    };
    appliquer();
    media.addEventListener("change", appliquer);
    return () => media.removeEventListener("change", appliquer);
  }, [profil.theme]);

  const importerDonnees = useCallback(async (d) => {
    if (!d || typeof d !== "object") return false;
    const donnees = {
      comptes: Array.isArray(d.comptes) ? d.comptes : [],
      transactions: Array.isArray(d.transactions) ? d.transactions : [],
      recurrentes: Array.isArray(d.recurrentes) ? d.recurrentes : [],
      projets: Array.isArray(d.projets) ? d.projets : [],
      credits: Array.isArray(d.credits) ? d.credits : [],
      budgets: d.budgets && typeof d.budgets === "object" ? d.budgets : {},
      profil: d.profil && typeof d.profil === "object" ? d.profil : { prenom: "", revenuMensuel: 0 },
    };
    if (modeLocal) {
      setComptes(donnees.comptes);
      setTransactions(donnees.transactions);
      setRecurrentes(donnees.recurrentes);
      setProjets(donnees.projets);
      setCredits(donnees.credits);
      setBudgets(donnees.budgets);
      setProfil(donnees.profil);
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
    await setDoc(doc(db, base, "app"), { budgets: donnees.budgets, profil: { ...donnees.profil, onboarde: true } }, { merge: true });
    return true;
  }, [modeLocal, fs]);

  // ------- Soldes calculés -------
  const soldes = useMemo(() => {
    const map = {};
    for (const c of comptes) map[c.id] = c.soldeInitial || 0;
    for (const t of transactions) if (map[t.compteId] !== undefined && !t.horsSolde) map[t.compteId] += t.montant;
    return map;
  }, [comptes, transactions]);

  const valeur = {
    pret, user, modeLocal, erreurInit,
    comptes, transactions, budgets, profil, soldes, recurrentes, projets, credits,
    ajouterCompte, modifierCompte, supprimerCompte,
    ajouterTransaction, supprimerTransaction, ajouterTransactionsLot,
    ajouterRecurrente, modifierRecurrente, supprimerRecurrente,
    ajouterProjet, modifierProjet, supprimerProjet,
    ajouterCredit, modifierCredit, supprimerCredit,
    sauverApp, virement, reinitialiserDemo, importerDonnees,
  };

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}
