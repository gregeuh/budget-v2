"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import Sheet from "./Sheet";

const EMOJIS = ["🏷️", "👕", "🐶", "🎮", "⚽", "🍺", "☕", "💇", "🎁", "🚿", "📚", "🎾", "🧸", "🚬", "💊", "🎨"];
const TYPES = [
  { id: "besoin", label: "Besoin" },
  { id: "envie", label: "Envie" },
  { id: "epargne", label: "Épargne" },
  { id: "revenu", label: "Revenu" },
];

export default function CategoriesSheet({ onFermer }) {
  const { categoriesPerso, sauverCategoriesPerso } = useBudget();
  const [nom, setNom] = useState("");
  const [icone, setIcone] = useState("🏷️");
  const [type, setType] = useState("envie");
  const [enEdition, setEnEdition] = useState(null); // clé en cours d'édition

  const ajouter = async () => {
    const label = nom.trim();
    if (!label) return;
    const cle = enEdition || "perso_" + label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").slice(0, 20) + "_" + Date.now().toString(36).slice(-4);
    await sauverCategoriesPerso({ ...categoriesPerso, [cle]: { label, icone, type } });
    setNom(""); setIcone("🏷️"); setType("envie"); setEnEdition(null);
  };

  const editer = (cle) => {
    const c = categoriesPerso[cle];
    setEnEdition(cle); setNom(c.label); setIcone(c.icone || "🏷️"); setType(c.type || "envie");
  };

  const supprimer = async (cle) => {
    const copie = { ...categoriesPerso };
    delete copie[cle];
    await sauverCategoriesPerso(copie);
    if (enEdition === cle) { setEnEdition(null); setNom(""); }
  };

  const liste = Object.entries(categoriesPerso);

  return (
    <Sheet titre="Mes catégories" onFermer={onFermer}>
      <div className="space-y-4">
        {/* Formulaire */}
        <div className="space-y-3 rounded-ios bg-carte p-3.5 shadow-carte">
          <p className="text-sm font-semibold">{enEdition ? "Modifier la catégorie" : "Nouvelle catégorie"}</p>
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setIcone(e)}
                className={`shrink-0 rounded-xl p-2 text-xl ${icone === e ? "bg-encre" : "bg-fond"}`}>{e}</button>
            ))}
          </div>
          <input
            placeholder="Nom (ex : Maillots vintage)"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-ios border border-bordure bg-fond px-4 py-3 outline-none focus:border-menthe"
          />
          <div className="grid grid-cols-4 gap-1.5">
            {TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`rounded-pill py-1.5 text-xs font-semibold ${type === t.id ? "bg-encre text-contraste" : "bg-fond text-sourdine"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-sourdine">Le type sert à l'analyse 50/30/20 (Besoins / Envies / Épargne).</p>
          <div className="flex gap-2">
            <button onClick={ajouter} disabled={!nom.trim()}
              className="flex-1 rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40">
              {enEdition ? "Enregistrer" : "Créer"}
            </button>
            {enEdition && (
              <button onClick={() => { setEnEdition(null); setNom(""); }} className="rounded-ios bg-voile px-4 text-sm font-semibold">
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        {liste.length > 0 && (
          <ul className="space-y-2">
            {liste.map(([cle, c]) => (
              <li key={cle} className="flex items-center gap-3 rounded-2xl bg-carte px-3 py-2.5 shadow-carte">
                <span className="text-xl">{c.icone || "🏷️"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.label}</span>
                  <span className="text-xs capitalize text-sourdine">{c.type}</span>
                </span>
                <button onClick={() => editer(cle)} className="rounded-pill bg-voile px-3 py-1.5 text-xs font-semibold">Modifier</button>
                <button onClick={() => supprimer(cle)} aria-label="Supprimer" className="flex h-7 w-7 items-center justify-center rounded-full text-sourdine/60 active:bg-corail-pale active:text-corail">✕</button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-sourdine">
          Les opérations d'une catégorie supprimée restent dans l'historique, classées « Autre ».
        </p>
      </div>
    </Sheet>
  );
}
