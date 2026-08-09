"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";

export default function RetourConnexionBancaire() {
  const searchParams = useSearchParams();
  const [etat, setEtat] = useState("chargement");
  const [data, setData] = useState(null);
  const [importEnCours, setImportEnCours] = useState(false);
  const [importe, setImporte] = useState(null);
  const { importerDonneesPowens, comptes, transactions } = useBudget();
  const erreurPowens = searchParams.get("error");

  const apercu = useMemo(() => {
    if (!data) return { nouveauxComptes: [], nouvellesTransactions: [] };
    const comptesConnus = new Set(comptes.filter((c) => c.powensId).map((c) => String(c.powensId)));
    const operationsConnues = new Set(transactions.filter((t) => t.powensId).map((t) => String(t.powensId)));
    return {
      nouveauxComptes: data.accounts.filter((a) => !comptesConnus.has(String(a.id))),
      nouvellesTransactions: data.transactions.filter((t) => !operationsConnues.has(String(t.id))),
    };
  }, [data, comptes, transactions]);

  useEffect(() => {
    if (erreurPowens) { setEtat("erreur"); return; }
    const state = searchParams.get("state") || "";
    fetch(`/api/powens/sync?state=${encodeURIComponent(state)}`)
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => { if (!ok) throw new Error(body.erreur); setData(body); setEtat("succes"); })
      .catch(() => setEtat("attente"));
  }, [erreurPowens, searchParams]);

  const importer = async () => {
    if (!data || importEnCours) return;
    setImportEnCours(true);
    try {
      const resultat = await importerDonneesPowens(data);
      setImporte(resultat);
    } finally {
      setImportEnCours(false);
    }
  };

  return <main className="mx-auto flex min-h-dvh max-w-lg items-center px-5 py-10">
    <section className="w-full rounded-v3-l bg-ui-surface-floating p-6 text-center shadow-v3-medium">
      {etat === "chargement" && <><p className="text-3xl">⌛</p><h1 className="mt-3 text-xl font-bold">Synchronisation en cours</h1><p className="mt-2 text-sm text-sourdine">Pécule récupère tes comptes sélectionnés…</p></>}
      {etat === "succes" && <>
        <p className="text-3xl">✓</p>
        <h1 className="mt-3 text-xl font-bold">Banque connectée</h1>
        {!importe ? <>
          <p className="mt-2 text-sm text-sourdine">Vérifie le contenu avant de l’ajouter à Pécule. Rien n’est importé automatiquement.</p>
          <div className="mt-5 rounded-v3-m border border-bordure bg-ui-surface p-4 text-left">
            <p className="text-sm font-semibold">À importer</p>
            <p className="mt-1 text-sm text-sourdine">{apercu.nouveauxComptes.length} nouveau{apercu.nouveauxComptes.length > 1 ? "x" : ""} compte{apercu.nouveauxComptes.length > 1 ? "s" : ""} · {apercu.nouvellesTransactions.length} opération{apercu.nouvellesTransactions.length > 1 ? "s" : ""}</p>
            {apercu.nouveauxComptes.length > 0 && <ul className="mt-3 space-y-2 border-t border-bordure pt-3">
              {apercu.nouveauxComptes.slice(0, 5).map((compte) => <li key={compte.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">🏦 {compte.name}</span><strong>{euros(compte.balance)}</strong></li>)}
            </ul>}
            {apercu.nouvellesTransactions.length > 0 && <p className="mt-3 border-t border-bordure pt-3 text-xs text-sourdine">Les opérations sont importées avec la catégorie « Autre », à ajuster au besoin depuis la liste.</p>}
          </div>
          {apercu.nouveauxComptes.length + apercu.nouvellesTransactions.length > 0 ? <button type="button" onClick={importer} disabled={importEnCours} className="mt-4 w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-60">{importEnCours ? "Import en cours…" : "Importer dans Pécule"}</button> : <p className="mt-4 rounded-ios bg-ui-surface-raised px-4 py-3 text-sm text-sourdine">Tout est déjà à jour : aucun doublon ne sera créé.</p>}
          <Link href="/comptes" className="mt-3 block py-2 text-sm font-semibold text-marque">Pas maintenant</Link>
        </> : <>
          <p className="mt-2 text-sm text-sourdine">Import terminé : {importe.comptes} compte{importe.comptes > 1 ? "s" : ""} et {importe.transactions} opération{importe.transactions > 1 ? "s" : ""} ajoutés.</p>
          <Link href="/comptes" className="mt-5 block rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Voir mes comptes</Link>
        </>}
      </>}
      {etat === "attente" && <><p className="text-3xl">⏳</p><h1 className="mt-3 text-xl font-bold">La banque prépare les données</h1><p className="mt-2 text-sm text-sourdine">Le lien est créé. La première synchronisation peut prendre quelques instants.</p><Link href="/reglages" className="mt-5 block rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Retour aux réglages</Link></>}
      {etat === "erreur" && <><p className="text-3xl">⚠️</p><h1 className="mt-3 text-xl font-bold">Connexion interrompue</h1><p className="mt-2 text-sm text-sourdine">Tu peux reprendre la connexion depuis les réglages.</p><Link href="/reglages" className="mt-5 block rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Retour aux réglages</Link></>}
    </section>
  </main>;
}
