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
      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-voile ${dernier ? "" : "border-b border-bordure"}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${danger ? "bg-corail-pale" : "bg-voile"}`}>
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
        <button onClick={enregistrer} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste">Enregistrer</button>
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

/* ---- Fiche données ---- */
function DonneesSheet({ onFermer }) {
  const { comptes, transactions, budgets, recurrentes, projets, credits, profil, categoriesPerso, importerDonnees, notifier } = useBudget();

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

  return (
    <Sheet titre="Sauvegarde & données" onFermer={onFermer}>
      <div className="space-y-3">
        <p className="text-sm text-sourdine">
          L'export JSON contient tout : comptes, opérations, budgets, projets, crédits, récurrences et catégories. C'est ta sauvegarde et ton ticket de migration.
        </p>
        <button onClick={exporter} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste">
          ⬇︎ Exporter mes données
        </button>
        <label className="block w-full cursor-pointer rounded-ios bg-voile py-3 text-center font-semibold">
          ⬆︎ Importer une sauvegarde
          <input type="file" accept=".json,application/json" className="hidden" onChange={importer} />
        </label>
      </div>
    </Sheet>
  );
}

/* ---- Rangée plate et aérée ---- */
function Rangee({ icone, label, onClick, danger = false, dernier = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 py-4 text-left active:opacity-60 ${dernier ? "" : "border-b border-bordure"}`}
    >
      <span className="w-7 text-center text-xl">{icone}</span>
      <span className={`flex-1 text-[16px] font-medium ${danger ? "text-corail" : ""}`}>{label}</span>
      {!danger && <span className="text-lg text-sourdine/40">›</span>}
    </button>
  );
}

/* ---- Panneau principal (style épuré) ---- */
export default function ReglagesContenu() {
  const { profil, modeLocal, user, recurrentes, categoriesPerso, reinitialiserDemo } = useBudget();
  const [fiche, setFiche] = useState(null);
  const [confirmeEffacer, setConfirmeEffacer] = useState(false);

  const deconnexion = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  const nbRecurrentes = recurrentes.filter((r) => r.actif !== false).length;
  const nbCategories = Object.keys(categoriesPerso || {}).length;

  return (
    <div className="flex min-h-full flex-col">
      {/* Salutation */}
      <h1 className="pb-5 pt-2 text-[26px] font-bold tracking-tight">
        Salut{profil.prenom ? ` ${profil.prenom}` : ""} !
      </h1>
      <div className="border-b border-bordure" />

      {/* Liste plate */}
      <nav className="pt-1">
        <Rangee icone="👤" label="Mon profil" onClick={() => setFiche("profil")} />
        <Rangee icone="🌗" label="Apparence" onClick={() => setFiche("apparence")} />
        <Rangee icone="🏷️" label={`Catégories${nbCategories > 0 ? ` (${nbCategories})` : ""}`} onClick={() => setFiche("categories")} />
        <Rangee icone="🔁" label={`Récurrentes${nbRecurrentes > 0 ? ` (${nbRecurrentes})` : ""}`} onClick={() => setFiche("recurrentes")} />
        <Rangee icone="💾" label="Sauvegarde & données" onClick={() => setFiche("donnees")} dernier />
      </nav>

      {/* Zone de sortie, séparée par une bande */}
      <div className="-mx-4 my-3 h-2 bg-voile" />
      {modeLocal ? (
        <Rangee
          icone="🗑️"
          label={confirmeEffacer ? "Confirmer l'effacement total ?" : "Tout effacer"}
          danger
          dernier
          onClick={() => {
            if (!confirmeEffacer) return setConfirmeEffacer(true);
            reinitialiserDemo();
            setConfirmeEffacer(false);
          }}
        />
      ) : (
        <Rangee icone="🚪" label="Se déconnecter" danger dernier onClick={deconnexion} />
      )}

      {/* Pied de panneau */}
      <div className="-mx-4 mt-auto bg-voile px-4 py-5">
        <p className="text-xs leading-relaxed text-sourdine">
          {modeLocal ? "Données stockées sur cet appareil — pense à exporter régulièrement." : `Connecté : ${user?.email}`}
        </p>
        <p className="mt-2 text-xs text-sourdine">
          📲 Astuce : Safari → Partager → « Sur l'écran d'accueil » pour installer l'app.
        </p>
        <p className="mt-2 text-xs font-semibold text-sourdine/60">Budget v2</p>
      </div>

      {fiche === "profil" && <ProfilSheet onFermer={() => setFiche(null)} />}
      {fiche === "apparence" && <ApparenceSheet onFermer={() => setFiche(null)} />}
      {fiche === "categories" && <CategoriesSheet onFermer={() => setFiche(null)} />}
      {fiche === "recurrentes" && <RecurrentesSheet onFermer={() => setFiche(null)} />}
      {fiche === "donnees" && <DonneesSheet onFermer={() => setFiche(null)} />}
    </div>
  );
}
