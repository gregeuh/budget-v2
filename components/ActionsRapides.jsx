"use client";

import Link from "next/link";
import Sheet from "./Sheet";

const ACTIONS = [
  { id: "depense", emoji: "−", titre: "Ajouter une dépense", detail: "Un achat, une facture ou une sortie", ton: "bg-corail-pale text-corail-texte" },
  { id: "revenu", emoji: "+", titre: "Ajouter un revenu", detail: "Salaire, remboursement ou autre entrée", ton: "bg-menthe-pale text-menthe-texte" },
  { id: "virement", emoji: "↔", titre: "Faire un virement", detail: "Déplacer de l’argent entre tes comptes", ton: "bg-marque-pale text-marque-texte" },
];

export default function ActionsRapides({ onFermer, onChoisir }) {
  return <Sheet titre="Nouvelle action" onFermer={onFermer}>
    <p className="-mt-2 text-sm text-ui-text-secondary">Ajoute une opération, ou accède directement au bon outil.</p>
    <div className="mt-4 space-y-2">
      {ACTIONS.map((action) => <button key={action.id} onClick={() => onChoisir(action.id)} className="flex w-full items-center gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-3.5 text-left shadow-v3-soft transition-transform active:scale-[.98]">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold ${action.ton}`}>{action.emoji}</span>
        <span className="min-w-0 flex-1"><strong className="block text-sm">{action.titre}</strong><span className="mt-0.5 block text-xs text-ui-text-secondary">{action.detail}</span></span>
        <span className="text-xl text-ui-text-secondary">›</span>
      </button>)}
    </div>
    <div className="mt-5 border-t border-ui-hairline pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-text-secondary">Raccourcis utiles</p>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/inbox" onClick={onFermer} className="rounded-v3-s bg-marque-pale px-3 py-3 text-center text-sm font-semibold text-marque-texte">Boîte de réception</Link>
        <Link href="/previsions" onClick={onFermer} className="rounded-v3-s bg-ui-surface-raised px-3 py-3 text-center text-sm font-semibold">Prévisions</Link>
        <Link href="/abonnements" onClick={onFermer} className="rounded-v3-s bg-ui-surface-raised px-3 py-3 text-center text-sm font-semibold">Abonnements</Link>
        <Link href="/plan" onClick={onFermer} className="rounded-v3-s bg-ui-surface-raised px-3 py-3 text-center text-sm font-semibold">Préparer mon mois</Link>
      </div>
    </div>
  </Sheet>;
}
