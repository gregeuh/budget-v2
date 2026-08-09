"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBudget } from "@/lib/store";
import Sheet from "./Sheet";

const DESTINATIONS = [
  { href: "/", titre: "Accueil", detail: "Vue du mois et reste à vivre", icone: "⌂", mots: "accueil mois reste vivre" },
  { href: "/patrimoine", titre: "Patrimoine", detail: "Comptes, épargne et crédits", icone: "▣", mots: "comptes epargne livret credit revolut swile" },
  { href: "/pilotage", titre: "Pilotage", detail: "Prévisions, calendrier et statistiques", icone: "◉", mots: "budget calendrier statistiques prevision cloture" },
  { href: "/coach", titre: "Coach", detail: "Conseils, alertes et règles", icone: "✦", mots: "conseil coach alerte regle abonnement boite" },
  { href: "/transactions", titre: "Toutes les opérations", detail: "Rechercher ou modifier une opération", icone: "↕", mots: "transaction operation depense revenu virement" },
  { href: "/reglages", titre: "Réglages", detail: "Données, import et confidentialité", icone: "⚙", mots: "reglage importer csv confidentialite sauvegarde" },
];

export default function RechercheGlobale({ onFermer }) {
  const router = useRouter();
  const { comptes, transactions } = useBudget();
  const [recherche, setRecherche] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { window.setTimeout(() => inputRef.current?.focus(), 80); }, []);
  const terme = recherche.trim().toLocaleLowerCase("fr");
  const resultats = useMemo(() => {
    if (!terme) return DESTINATIONS.slice(0, 4).map((item) => ({ ...item, type: "page" }));
    const pages = DESTINATIONS.filter((item) => `${item.titre} ${item.detail} ${item.mots}`.toLocaleLowerCase("fr").includes(terme)).map((item) => ({ ...item, type: "page" }));
    const comptesTrouves = comptes.filter((compte) => compte.nom?.toLocaleLowerCase("fr").includes(terme)).slice(0, 3).map((compte) => ({ type: "compte", titre: compte.nom, detail: "Ouvrir dans mes comptes", icone: "▣", href: "/comptes" }));
    const operations = transactions.filter((operation) => `${operation.libelle || ""} ${operation.categorie || ""}`.toLocaleLowerCase("fr").includes(terme)).slice(0, 4).map((operation) => ({ type: "operation", titre: operation.libelle || "Opération", detail: "Voir dans les opérations", icone: "↕", href: `/transactions?recherche=${encodeURIComponent(operation.libelle || "")}` }));
    return [...pages, ...comptesTrouves, ...operations].slice(0, 8);
  }, [comptes, terme, transactions]);
  const ouvrir = (href) => { onFermer(); router.push(href); };
  return <Sheet titre="Rechercher" onFermer={onFermer}>
    <label className="block"><span className="sr-only">Rechercher dans Pécule</span><input ref={inputRef} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Compte, opération, outil…" className="w-full rounded-v3-m border border-ui-hairline bg-ui-surface-raised px-4 py-3 text-base outline-none focus:border-marque" /></label>
    <p className="mt-2 text-xs text-sourdine">Exemples : « Livret A », « Netflix », « prévisions », « importer ».</p>
    <div className="mt-4 space-y-1.5">{resultats.map((resultat, index) => <button key={`${resultat.type}-${resultat.titre}-${index}`} onClick={() => ouvrir(resultat.href)} className="flex w-full items-center gap-3 rounded-v3-s p-3 text-left hover:bg-ui-surface-raised active:scale-[.99]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marque-pale text-lg">{resultat.icone}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{resultat.titre}</strong><span className="block truncate text-xs text-sourdine">{resultat.detail}</span></span><span className="text-sourdine">›</span></button>)}</div>
    {terme && resultats.length === 0 && <p className="py-8 text-center text-sm text-sourdine">Aucun résultat. Essaie le nom d’un compte, d’un commerçant ou d’un outil.</p>}
  </Sheet>;
}
