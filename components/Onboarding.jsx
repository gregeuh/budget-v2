"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE } from "@/lib/format";

const SUGGESTIONS = ["courant", "revolut", "swile", "livretA"];

export default function Onboarding() {
  const { profil, sauverApp, ajouterCompte } = useBudget();
  const [etape, setEtape] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [revenu, setRevenu] = useState("");
  const [jourSalaire, setJourSalaire] = useState(0);
  const [choix, setChoix] = useState({ courant: { actif: true, solde: "" } });
  const [enCours, setEnCours] = useState(false);

  const num = (v) => parseFloat(String(v).replace(",", ".")) || 0;

  const basculer = (type) =>
    setChoix((c) => ({ ...c, [type]: { actif: !c[type]?.actif, solde: c[type]?.solde || "" } }));

  const terminer = async (passer = false) => {
    setEnCours(true);
    if (!passer) {
      for (const type of SUGGESTIONS) {
        if (choix[type]?.actif) {
          await ajouterCompte({ nom: TYPES_COMPTE[type].label, type, soldeInitial: num(choix[type].solde) });
        }
      }
    }
    await sauverApp(undefined, {
      ...profil,
      prenom: prenom.trim(),
      revenuMensuel: num(revenu),
      jourSalaire: Number(jourSalaire) || 0,
      onboarde: true,
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10" style={{ paddingTop: "calc(var(--safe-top) + 40px)" }}>
      {/* Progression */}
      <div className="mb-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= etape ? "bg-menthe" : "bg-voile"}`} />
        ))}
      </div>

      {etape === 0 && (
        <div className="pop-in flex-1">
          <div className="text-5xl">👋</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Bienvenue !</h1>
          <p className="mt-1 text-sourdine">Quelques infos pour personnaliser tes analyses — modifiable à tout moment dans le Profil.</p>
          <div className="mt-6 space-y-3">
            <input placeholder="Ton prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)}
              className="w-full rounded-ios border border-bordure bg-carte px-4 py-3.5 outline-none focus:border-menthe" />
            <input inputMode="decimal" placeholder="Revenu mensuel net (€)" value={revenu} onChange={(e) => setRevenu(e.target.value)}
              className="tnum w-full rounded-ios border border-bordure bg-carte px-4 py-3.5 outline-none focus:border-menthe" />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Jour d'arrivée du salaire</span>
              <select value={jourSalaire} onChange={(e) => setJourSalaire(e.target.value)}
                className="w-full rounded-ios border border-bordure bg-carte px-4 py-3.5 outline-none">
                <option value={0}>Non renseigné</option>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>Le {j} du mois</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {etape === 1 && (
        <div className="pop-in flex-1">
          <div className="text-5xl">💳</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Tes comptes</h1>
          <p className="mt-1 text-sourdine">Sélectionne ceux que tu utilises et indique leur solde actuel.</p>
          <div className="mt-6 space-y-2">
            {SUGGESTIONS.map((type) => {
              const t = TYPES_COMPTE[type];
              const actif = choix[type]?.actif;
              return (
                <div key={type} className={`rounded-ios border p-3.5 transition-colors ${actif ? "border-menthe bg-carte" : "border-bordure bg-carte/50"}`}>
                  <button onClick={() => basculer(type)} className="flex w-full items-center justify-between">
                    <span className="font-semibold">{t.icone} {t.label}</span>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${actif ? "bg-menthe text-white" : "bg-voile"}`}>
                      {actif ? "✓" : "+"}
                    </span>
                  </button>
                  {actif && (
                    <input
                      inputMode="decimal"
                      placeholder="Solde actuel (€)"
                      value={choix[type]?.solde || ""}
                      onChange={(e) => setChoix((c) => ({ ...c, [type]: { ...c[type], solde: e.target.value } }))}
                      className="tnum mt-2.5 w-full rounded-xl border border-bordure bg-fond px-3 py-2.5 outline-none focus:border-menthe"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-sourdine">Les autres types (LDDS, PEA, espèces…) s'ajoutent ensuite depuis l'onglet Comptes.</p>
        </div>
      )}

      {etape === 2 && (
        <div className="pop-in flex-1">
          <div className="text-5xl">🚀</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">C'est parti{prenom ? `, ${prenom.trim()}` : ""} !</h1>
          <p className="mt-1 text-sourdine">Tout est prêt. Trois réflexes pour bien démarrer :</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="rounded-ios bg-carte p-4 shadow-carte"><span className="font-semibold">➕ Le bouton central</span> — ajoute dépenses, revenus et virements en quelques secondes. Active « Chaque mois » pour le loyer ou le salaire.</li>
            <li className="rounded-ios bg-carte p-4 shadow-carte"><span className="font-semibold">⬇︎ Importer CSV</span> — depuis l'onglet Opérations, importe un relevé bancaire, tout est catégorisé automatiquement.</li>
            <li className="rounded-ios bg-carte p-4 shadow-carte"><span className="font-semibold">📲 Installer l'app</span> — dans Safari : Partager → « Sur l'écran d'accueil ».</li>
          </ul>
        </div>
      )}

      <div className="mt-8 space-y-2">
        <button
          onClick={() => (etape < 2 ? setEtape(etape + 1) : terminer())}
          disabled={enCours}
          className="w-full rounded-ios bg-encre py-3.5 font-semibold text-contraste disabled:opacity-40 active:scale-[0.99] transition-transform"
        >
          {etape < 2 ? "Continuer" : enCours ? "…" : "Ouvrir mon budget"}
        </button>
        {etape < 2 && (
          <button onClick={() => terminer(true)} disabled={enCours} className="w-full py-2 text-sm font-medium text-sourdine">
            Passer la configuration
          </button>
        )}
      </div>
    </div>
  );
}
