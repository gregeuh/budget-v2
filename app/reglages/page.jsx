"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { CATEGORIES, FREQUENCES, euros, dateCourte } from "@/lib/format";

const THEMES = [
  { id: "auto", label: "Auto", icone: "🌗" },
  { id: "clair", label: "Clair", icone: "☀️" },
  { id: "sombre", label: "Sombre", icone: "🌙" },
];

export default function Profil() {
  const {
    profil, sauverApp, modeLocal, user,
    comptes, transactions, budgets,
    recurrentes, modifierRecurrente, supprimerRecurrente, projets, credits,
    reinitialiserDemo, importerDonnees,
  } = useBudget();

  const [prenom, setPrenom] = useState(profil.prenom || "");
  const [revenu, setRevenu] = useState(profil.revenuMensuel ? String(profil.revenuMensuel) : "");
  const [jourSalaire, setJourSalaire] = useState(profil.jourSalaire || 0);
  const [sauve, setSauve] = useState(false);

  const enregistrer = async (extras = {}) => {
    await sauverApp(undefined, {
      ...profil,
      prenom: prenom.trim(),
      revenuMensuel: parseFloat(String(revenu).replace(",", ".")) || 0,
      jourSalaire: Number(jourSalaire) || 0,
      ...extras,
    });
    setSauve(true);
    setTimeout(() => setSauve(false), 1500);
  };

  const changerTheme = (theme) => enregistrer({ theme });

  const exporter = () => {
    const blob = new Blob([JSON.stringify({ comptes, transactions, budgets, recurrentes, projets, credits, profil }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifier("Export téléchargé", "⬇︎");
  };

  const deconnexion = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Profil</h1>

      {/* Identité et revenus */}
      <section className="space-y-3 rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="font-semibold">Mes infos</h2>
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
        <button onClick={() => enregistrer()} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste">
          {sauve ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </section>

      {/* Apparence */}
      <section className="rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="mb-3 font-semibold">Apparence</h2>
        <div className="grid grid-cols-3 rounded-pill bg-voile p-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => changerTheme(t.id)}
              className={`rounded-pill py-2 text-sm font-semibold transition-colors ${(profil.theme || "auto") === t.id ? "bg-carte shadow-carte" : "text-sourdine"}`}
            >
              {t.icone} {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Récurrentes */}
      <section className="rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="font-semibold">Opérations récurrentes</h2>
        {recurrentes.length === 0 ? (
          <p className="mt-1 text-sm text-sourdine">
            Aucune pour l'instant. Lors de l'ajout d'une opération (bouton +), choisis « Chaque mois » par exemple : ton loyer, ton salaire ou tes abonnements s'ajouteront tout seuls.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {recurrentes.map((r) => {
              const cat = CATEGORIES[r.categorie] || CATEGORIES.autre;
              const compte = comptes.find((c) => c.id === r.compteId);
              const actif = r.actif !== false;
              return (
                <li key={r.id} className={`rounded-2xl bg-fond px-3 py-2.5 ${actif ? "" : "opacity-50"}`}>
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
                    <button
                      onClick={() => modifierRecurrente(r.id, { actif: !actif })}
                      className="flex-1 rounded-pill bg-voile py-1.5 text-xs font-semibold"
                    >
                      {actif ? "⏸ Mettre en pause" : "▶️ Réactiver"}
                    </button>
                    <button
                      onClick={() => supprimerRecurrente(r.id)}
                      className="flex-1 rounded-pill bg-corail-pale py-1.5 text-xs font-semibold text-corail-texte"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Données */}
      <section className="space-y-2 rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="font-semibold">Données</h2>
        <button onClick={exporter} className="w-full rounded-ios bg-voile py-3 text-sm font-semibold">
          Exporter mes données (JSON)
        </button>
        {modeLocal && (
          <button onClick={reinitialiserDemo} className="w-full rounded-ios bg-voile py-3 text-sm font-semibold text-corail">
            Tout effacer
          </button>
        )}
      </section>

      {/* Compte */}
      <section className="rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="font-semibold">Compte</h2>
        {modeLocal ? (
          <p className="mt-1 text-sm text-sourdine">
            Mode démo : les données restent sur cet appareil. Pour la synchronisation multi-appareils et la connexion Google, configure Firebase (voir le README du projet).
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-sourdine">Connecté : {user?.email}</p>
            <button onClick={deconnexion} className="mt-3 w-full rounded-ios bg-corail-pale py-3 text-sm font-semibold text-corail-texte">
              Se déconnecter
            </button>
          </>
        )}
      </section>

      <p className="px-2 text-center text-xs text-sourdine">
        Astuce iPhone : dans Safari, touche Partager → « Sur l'écran d'accueil » pour installer l'app en plein écran.
      </p>
    </div>
  );
}
