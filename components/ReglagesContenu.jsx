"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { auth } from "@/lib/firebase";
import Sheet from "@/components/Sheet";
import CategoriesSheet from "@/components/CategoriesSheet";
import { toutesCategories as CATEGORIES, FREQUENCES, euros, dateCourte } from "@/lib/format";

const THEMES = [
  { id: "auto", label: "Automatique", detail: "Suit le réglage de l'iPhone", icone: "🌗" },
  { id: "clair", label: "Clair", detail: "Toujours lumineux", icone: "☀️" },
  { id: "sombre", label: "Sombre", detail: "Toujours sombre", icone: "🌙" },
];

/* ---- Ligne de réglage façon iOS/Revolut ---- */
function Ligne({ icone, label, detail, onClick, danger = false, droite = null, dernier = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-voile ${dernier ? "" : "border-b border-bordure"}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${danger ? "bg-corail-pale" : "bg-voile"}`}>
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-semibold ${danger ? "text-corail" : ""}`}>{label}</span>
        {detail && <span className="block truncate text-xs text-sourdine">{detail}</span>}
      </span>
      {droite ?? <span className="text-sourdine/50">›</span>}
    </button>
  );
}

/* ---- Fiche profil ---- */
function ProfilSheet({ onFermer }) {
  const { profil, sauverApp } = useBudget();
  const [prenom, setPrenom] = useState(profil.prenom || "");
  const [revenu, setRevenu] = useState(profil.revenuMensuel ? String(profil.revenuMensuel) : "");
  const [jourSalaire, setJourSalaire] = useState(profil.jourSalaire || 0);

  const enregistrer = async () => {
    await sauverApp(undefined, {
      ...profil,
      prenom: prenom.trim(),
      revenuMensuel: parseFloat(String(revenu).replace(",", ".")) || 0,
      jourSalaire: Number(jourSalaire) || 0,
    });
    onFermer();
  };

  return (
    <Sheet titre="Mon profil" onFermer={onFermer}>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Prénom</span>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Ton prénom"
            className="w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Revenu mensuel net</span>
            <input inputMode="decimal" value={revenu} onChange={(e) => setRevenu(e.target.value)} placeholder="ex : 2300"
              className="tnum w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Jour du salaire</span>
            <select value={jourSalaire} onChange={(e) => setJourSalaire(e.target.value)}
              className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
              <option value={0}>—</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>Le {j} du mois</option>
              ))}
              <option value={31}>Fin de mois</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-sourdine">Le jour du salaire alimente le compte à rebours de l'accueil et le budget restant par jour.</p>
        <button onClick={enregistrer} className="w-full rounded-ios bg-encre py-3.5 font-semibold text-contraste">Enregistrer</button>
      </div>
    </Sheet>
  );
}

/* ---- Fiche apparence ---- */
function ApparenceSheet({ onFermer }) {
  const { profil, sauverApp } = useBudget();
  const choisir = async (theme) => {
    await sauverApp(undefined, { ...profil, theme });
    onFermer();
  };
  return (
    <Sheet titre="Apparence" onFermer={onFermer}>
      <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
        {THEMES.map((t, i) => (
          <Ligne
            key={t.id}
            icone={t.icone}
            label={t.label}
            detail={t.detail}
            onClick={() => choisir(t.id)}
            dernier={i === THEMES.length - 1}
            droite={(profil.theme || "auto") === t.id ? <span className="font-bold text-menthe">✓</span> : <span />}
          />
        ))}
      </div>
    </Sheet>
  );
}

/* ---- Fiche récurrentes ---- */
function RecurrentesSheet({ onFermer }) {
  const { recurrentes, comptes, modifierRecurrente, supprimerRecurrente } = useBudget();
  return (
    <Sheet titre="Opérations récurrentes" onFermer={onFermer}>
      {recurrentes.length === 0 ? (
        <p className="rounded-ios bg-carte p-5 text-center text-sm text-sourdine shadow-carte">
          Aucune pour l'instant. Lors de l'ajout d'une opération (bouton +), choisis « Chaque mois » : ton loyer, ton salaire ou tes abonnements s'ajouteront tout seuls.
        </p>
      ) : (
        <ul className="space-y-2">
          {recurrentes.map((r) => {
            const cat = CATEGORIES[r.categorie] || CATEGORIES.autre;
            const compte = comptes.find((c) => c.id === r.compteId);
            const actif = r.actif !== false;
            return (
              <li key={r.id} className={`rounded-2xl bg-carte px-3 py-2.5 shadow-carte ${actif ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.icone}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.libelle}</div>
                    <div className="text-xs text-sourdine">
                      {FREQUENCES[r.frequence]?.label}{compte ? ` · ${compte.nom}` : ""} · prochaine le {dateCourte(r.prochaine)}
                    </div>
                  </div>
                  <span className={`tnum text-sm font-bold ${r.montant > 0 ? "text-menthe" : ""}`}>
                    {r.montant > 0 ? "+" : ""}{euros(r.montant, { precis: true })}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => modifierRecurrente(r.id, { actif: !actif })} className="flex-1 rounded-pill bg-voile py-1.5 text-xs font-semibold">
                    {actif ? "⏸ Mettre en pause" : "▶️ Réactiver"}
                  </button>
                  <button onClick={() => supprimerRecurrente(r.id)} className="flex-1 rounded-pill bg-corail-pale py-1.5 text-xs font-semibold text-corail-texte">
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

/* ---- Panneau principal ---- */
export default function ReglagesContenu() {
  const {
    profil, modeLocal, user, comptes, transactions, budgets,
    recurrentes, projets, credits, categoriesPerso,
    reinitialiserDemo, importerDonnees, notifier,
  } = useBudget();

  const [fiche, setFiche] = useState(null); // "profil" | "apparence" | "categories" | "recurrentes"
  const [confirmeEffacer, setConfirmeEffacer] = useState(false);

  const exporter = () => {
    const blob = new Blob(
      [JSON.stringify({ comptes, transactions, budgets, recurrentes, projets, credits, profil, categoriesPerso }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifier("Export téléchargé", "⬇︎");
  };

  const importer = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const l = new FileReader();
    l.onload = async () => {
      try {
        const ok = await importerDonnees(JSON.parse(String(l.result)));
        notifier(ok ? "Sauvegarde importée" : "Fichier non reconnu", ok ? "✓" : "⚠️");
      } catch {
        notifier("Import impossible — fichier invalide", "⚠️");
      }
    };
    l.readAsText(f);
  };

  const deconnexion = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  const initiale = (profil.prenom || "").trim().charAt(0).toUpperCase();
  const nbRecurrentes = recurrentes.filter((r) => r.actif !== false).length;
  const nbCategories = Object.keys(categoriesPerso || {}).length;

  return (
    <div className="space-y-5 pb-6">
      {/* En-tête profil */}
      <button onClick={() => setFiche("profil")} className="mx-auto block text-center">
        <span
          className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl font-bold text-white shadow-flottant"
          style={{ background: "linear-gradient(145deg, #35C79A, #17203A)" }}
        >
          {initiale || "👤"}
        </span>
        <span className="mt-3 block text-xl font-bold">{profil.prenom || "Mon profil"}</span>
        <span className="mt-0.5 block text-sm text-sourdine">
          {modeLocal ? "Données sur cet appareil" : user?.email}
        </span>
      </button>

      {/* Tuiles d'accès rapide */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setFiche("categories")} className="rounded-ios bg-carte p-4 text-left shadow-carte active:scale-[0.98] transition-transform">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavande-pale text-xl">🏷️</span>
          <span className="mt-6 block font-bold">Catégories</span>
          <span className="block text-xs text-sourdine">{nbCategories > 0 ? `${nbCategories} personnalisée${nbCategories > 1 ? "s" : ""}` : "Personnalise tes libellés"}</span>
        </button>
        <button onClick={() => setFiche("recurrentes")} className="relative rounded-ios bg-carte p-4 text-left shadow-carte active:scale-[0.98] transition-transform">
          {nbRecurrentes > 0 && (
            <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-corail px-1.5 text-xs font-bold text-white">
              {nbRecurrentes}
            </span>
          )}
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ciel-pale text-xl">🔁</span>
          <span className="mt-6 block font-bold">Récurrentes</span>
          <span className="block text-xs text-sourdine">Tes opérations automatiques</span>
        </button>
      </div>

      {/* Groupe : préférences */}
      <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
        <Ligne icone="👤" label="Mon profil" detail="Prénom, revenu, jour du salaire" onClick={() => setFiche("profil")} />
        <Ligne
          icone="🌗"
          label="Apparence"
          detail={THEMES.find((t) => t.id === (profil.theme || "auto"))?.label}
          onClick={() => setFiche("apparence")}
          dernier
        />
      </div>

      {/* Groupe : données */}
      <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
        <Ligne icone="⬇︎" label="Exporter mes données" detail="Fichier JSON à conserver" onClick={exporter} droite={<span />} />
        <label className="block cursor-pointer">
          <Ligne icone="⬆︎" label="Importer une sauvegarde" detail="Restaurer un export JSON" onClick={() => {}} droite={<span />} dernier={modeLocal ? false : true} />
          <input type="file" accept=".json,application/json" className="hidden" onChange={importer} />
        </label>
        {modeLocal && (
          <Ligne
            icone="🗑️"
            label={confirmeEffacer ? "Confirmer l'effacement total ?" : "Tout effacer"}
            detail={confirmeEffacer ? "Touche à nouveau pour confirmer" : undefined}
            danger
            droite={<span />}
            dernier
            onClick={() => {
              if (!confirmeEffacer) return setConfirmeEffacer(true);
              reinitialiserDemo();
              setConfirmeEffacer(false);
            }}
          />
        )}
      </div>

      {/* Groupe : compte */}
      <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
        {modeLocal ? (
          <Ligne icone="📱" label="Sans connexion" detail="Les données restent sur cet appareil — exporte régulièrement" onClick={() => {}} droite={<span />} dernier />
        ) : (
          <Ligne icone="🚪" label="Se déconnecter" detail={user?.email} danger onClick={deconnexion} droite={<span />} dernier />
        )}
      </div>

      <p className="px-4 text-center text-xs text-sourdine">
        Astuce iPhone : Safari → Partager → « Sur l'écran d'accueil » pour installer l'app en plein écran.
      </p>

      {fiche === "profil" && <ProfilSheet onFermer={() => setFiche(null)} />}
      {fiche === "apparence" && <ApparenceSheet onFermer={() => setFiche(null)} />}
      {fiche === "categories" && <CategoriesSheet onFermer={() => setFiche(null)} />}
      {fiche === "recurrentes" && <RecurrentesSheet onFermer={() => setFiche(null)} />}
    </div>
  );
}
