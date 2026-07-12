"use client";

import Link from "next/link";
import { useBudget } from "@/lib/store";

export default function PremiersPas({ onAjouter }) {
  const { comptes, transactions, budgets, profil } = useBudget();

  const etapes = [
    {
      id: "compte",
      fait: comptes.length > 0,
      icone: "🏦",
      titre: "Ajoute tes comptes",
      detail: "Compte courant, Revolut, Swile, Livret A…",
      action: { type: "lien", href: "/comptes", label: "Ajouter un compte" },
    },
    {
      id: "operation",
      fait: transactions.length > 0,
      icone: "✍️",
      titre: "Note ta première opération",
      detail: "Une dépense, un revenu, ou importe ton relevé bancaire",
      action: { type: "bouton", label: "Ajouter une opération" },
    },
    {
      id: "profil",
      fait: Boolean(profil.jourSalaire),
      icone: "💼",
      titre: "Renseigne ton salaire",
      detail: "Pour le reste à vivre et les projections jusqu'à ta paie",
      action: { type: "lien", href: "/reglages", label: "Compléter mon profil" },
    },
    {
      id: "budget",
      fait: Object.values(budgets || {}).some((v) => v > 0),
      icone: "🎯",
      titre: "Fixe tes premiers budgets",
      detail: "Des plafonds sur 2-3 catégories suffisent pour commencer",
      action: { type: "lien", href: "/budgets", label: "Définir mes budgets" },
    },
  ];

  const faites = etapes.filter((e) => e.fait).length;
  const prochaine = etapes.find((e) => !e.fait);

  if (!prochaine) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-ios bg-carte p-4 text-center shadow-carte">
        <span className="text-3xl">👋</span>
        <h2 className="mt-1 text-lg font-bold">Bienvenue{profil.prenom ? ` ${profil.prenom}` : ""} !</h2>
        <p className="mt-0.5 text-sm text-sourdine">
          Quelques minutes pour tout mettre en place, et l'app travaillera pour toi.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-voile">
            <div className="jauge-in h-full rounded-full bg-menthe" style={{ width: `${(faites / etapes.length) * 100}%` }} />
          </div>
          <span className="tnum text-xs font-semibold text-sourdine">{faites}/{etapes.length}</span>
        </div>
      </div>

      <ul className="space-y-2">
        {etapes.map((e, i) => {
          const active = e.id === prochaine.id;
          return (
            <li
              key={e.id}
              className={`pop-in flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-carte ${
                e.fait ? "bg-carte opacity-60" : active ? "bg-carte ring-2 ring-menthe" : "bg-carte"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${e.fait ? "bg-menthe-pale" : "bg-fond"}`}>
                {e.fait ? "✓" : e.icone}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${e.fait ? "line-through" : ""}`}>{e.titre}</span>
                {!e.fait && <span className="block text-xs text-sourdine">{e.detail}</span>}
              </span>
              {active && (
                e.action.type === "lien" ? (
                  <Link href={e.action.href} className="shrink-0 rounded-pill bg-encre px-3 py-1.5 text-xs font-semibold text-contraste">
                    Go →
                  </Link>
                ) : (
                  <button onClick={onAjouter} className="shrink-0 rounded-pill bg-encre px-3 py-1.5 text-xs font-semibold text-contraste">
                    Go →
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
