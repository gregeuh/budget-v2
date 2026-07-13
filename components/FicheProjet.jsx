"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";
import Sheet from "./Sheet";

const ICONES = ["🎯", "🏖️", "👕", "🎮", "🚗", "🏠", "💍", "🎓", "🐶", "📱", "✈️", "🎁"];

export default function FicheProjet({ projet, onFermer }) {
  const { ajouterProjet, modifierProjet, supprimerProjet } = useBudget();
  const edition = Boolean(projet);
  const [nom, setNom] = useState(projet?.nom || "");
  const [icone, setIcone] = useState(projet?.icone || "🎯");
  const [objectif, setObjectif] = useState(projet ? String(projet.objectif) : "");
  const [echeance, setEcheance] = useState(projet?.echeance || "");
  const [contribution, setContribution] = useState("");
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);

  const valider = async () => {
    const donnees = {
      nom: nom.trim() || "Mon projet",
      icone,
      objectif: parseFloat(String(objectif).replace(",", ".")) || 0,
      echeance,
    };
    if (edition) await modifierProjet(projet.id, donnees);
    else await ajouterProjet(donnees);
    onFermer();
  };

  const contribuer = async (signe) => {
    const val = parseFloat(String(contribution).replace(",", "."));
    if (!val || val <= 0) return;
    await modifierProjet(projet.id, { montantActuel: Math.max(0, (projet.montantActuel || 0) + signe * val) });
    onFermer();
  };

  // Rythme nécessaire si échéance définie
  let rythme = null;
  if (edition && echeance && projet.objectif > (projet.montantActuel || 0)) {
    const moisRestants = Math.max(1, Math.round((new Date(echeance) - new Date()) / (30.44 * 86400000)));
    rythme = { parMois: (projet.objectif - projet.montantActuel) / moisRestants, mois: moisRestants };
  }

  return (
    <Sheet titre={edition ? projet.nom : "Nouveau projet"} onFermer={onFermer}>
      <div className="space-y-3">
        {edition && (
          <div className="rounded-ios bg-lavande-pale p-4">
            <p className="text-sm font-medium text-lavande-texte">
              {euros(projet.montantActuel || 0)} épargnés sur {euros(projet.objectif)}
              {rythme && ` — il reste ${euros(projet.objectif - projet.montantActuel)}, soit ~${euros(rythme.parMois)} / mois pendant ${rythme.mois} mois`}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                inputMode="decimal"
                placeholder="Montant"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                className="tnum min-w-0 flex-1 rounded-xl border border-bordure bg-carte px-3 py-2.5 outline-none focus:border-menthe"
              />
              <button onClick={() => contribuer(1)} className="rounded-xl bg-menthe px-4 font-semibold text-white">+ Ajouter</button>
              <button onClick={() => contribuer(-1)} className="rounded-xl bg-voile px-3 font-semibold">−</button>
            </div>
            <p className="mt-1.5 text-xs text-sourdine">Astuce : fais le virement réel vers ton Livret A, puis note-le ici.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {ICONES.map((i) => (
            <button key={i} onClick={() => setIcone(i)} className={`rounded-xl p-2 text-xl ${icone === i ? "bg-encre" : "bg-carte shadow-carte"}`}>
              {i}
            </button>
          ))}
        </div>
        <input
          placeholder="Nom du projet (ex : Vacances en Corse)"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full rounded-ios border border-bordure bg-carte px-4 py-3 outline-none focus:border-menthe"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Objectif (€)</span>
            <input inputMode="decimal" placeholder="2000" value={objectif} onChange={(e) => setObjectif(e.target.value)}
              className="tnum w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none focus:border-menthe" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Échéance (option)</span>
            <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)}
              className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none" />
          </label>
        </div>
        <button onClick={valider} disabled={!objectif} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40">
          {edition ? "Enregistrer" : "Créer le projet"}
        </button>
        {edition && (
          <button
            onClick={async () => {
              if (!confirmeSuppr) return setConfirmeSuppr(true);
              await supprimerProjet(projet.id);
              onFermer();
            }}
            className={`w-full rounded-ios py-3 text-sm font-semibold ${confirmeSuppr ? "bg-corail text-white" : "text-corail"}`}
          >
            {confirmeSuppr ? "Confirmer la suppression" : "Supprimer ce projet"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
