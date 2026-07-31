"use client";

import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { aujourdhui } from "@/lib/format";
import Sheet from "./Sheet";
import { nettoyerLibelle } from "@/lib/libelles";
import { construireMemoire, devinerDepuisHistorique, lieuxConnus, proposerLibelles } from "@/lib/habitudes";
import { lienCarte } from "@/lib/lieux";
import MiniCarte from "./MiniCarte";
import { suggererIcone } from "@/lib/icones";
import IconePicker from "./IconePicker";

export default function EditTxSheet({ tx, onFermer, niveau = 2 }) {
  const { comptes, categories, transactions, modifierTransaction, supprimerTransaction, ajouterTransaction } = useBudget();
  const [montant, setMontant] = useState(String(Math.abs(tx.montant)).replace(".", ","));
  const [sens, setSens] = useState(tx.montant < 0 ? "depense" : "revenu");
  const [libelle, setLibelle] = useState(tx.libelle || "");
  const [categorie, setCategorie] = useState(tx.categorie);
  const [compteId, setCompteId] = useState(tx.compteId);
  const [date, setDate] = useState(tx.date);
  const [horsSolde, setHorsSolde] = useState(Boolean(tx.horsSolde));
  const [lieu, setLieu] = useState(tx.lieu || "");
  const [icone, setIcone] = useState(tx.icone || "");
  const [iconeManuelle, setIconeManuelle] = useState(Boolean(tx.icone));
  const [iconeMemorisee, setIconeMemorisee] = useState(false);
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);

  const repeter = async () => {
    const val = parseFloat(String(montant).replace(",", "."));
    if (!val || val <= 0) return;
    await ajouterTransaction({
      compteId,
      montant: sens === "depense" ? -val : val,
      libelle: libelle.trim() || (categories[categorie]?.label ?? "Opération"),
      categorie,
      date: aujourdhui(),
      ...(lieu.trim() ? { lieu: lieu.trim() } : { lieu: null }),
      ...(icone ? { icone } : {}),
      // Si le lieu a été réécrit à la main, les anciennes coordonnées ne valent plus.
      ...(lieu.trim() === (tx.lieu || "").trim() ? {} : { lieuLat: null, lieuLon: null }),
    });
    onFermer();
  };

  // Jumeaux = même libellé nettoyé (rassemble les occurrences aux dates différentes)
  const origineNettoyee = nettoyerLibelle((tx.libelleBanque || tx.libelle || "").trim()).toLowerCase();
  const memesLibelles = origineNettoyee
    ? transactions.filter((t) => t.id !== tx.id && !t.versId && nettoyerLibelle((t.libelleBanque || t.libelle || "").trim()).toLowerCase() === origineNettoyee)
    : [];
  const [propager, setPropager] = useState(false);

  // Ce que l'app a appris : catégorie et lieu habituels par commerçant
  const memoire = useMemo(() => construireMemoire(transactions), [transactions]);
  const lieuxFrequents = useMemo(() => lieuxConnus(transactions, 8, lieu), [transactions, lieu]);
  const propositions = useMemo(() => proposerLibelles(libelle, memoire), [libelle, memoire]);
  const [habitude, setHabitude] = useState("");
  const iconeSuggeree = suggererIcone(libelle, categories[categorie]?.icone || "📦");

  // La suggestion accompagne la saisie tant que l'utilisateur ne l'a pas
  // remplacée. Un choix manuel reste toujours prioritaire.
  useEffect(() => {
    if (!iconeManuelle && !iconeMemorisee) setIcone(iconeSuggeree);
  }, [iconeSuggeree, iconeManuelle, iconeMemorisee]);

  const appliquerHabitude = (valeur) => {
    const trouve = devinerDepuisHistorique(valeur, memoire);
    if (!trouve) {
      setIconeMemorisee(false);
      return;
    }
    const applique = [];
    if (trouve.categorie && categories[trouve.categorie] && trouve.categorie !== categorie) {
      setCategorie(trouve.categorie);
      applique.push(categories[trouve.categorie].label);
    }
    if (trouve.lieu && !lieu.trim()) {
      setLieu(trouve.lieu);
      applique.push(trouve.lieu);
    }
    if (trouve.icone && !iconeManuelle) {
      setIcone(trouve.icone);
      setIconeMemorisee(true);
      applique.push(`icône ${trouve.icone}`);
    }
    setHabitude(applique.length ? `D'après tes habitudes : ${applique.join(" · ")}` : "");
  };

  const estVirement = Boolean(tx.versId);
  const [versId, setVersId] = useState(tx.versId || "");
  const cats = Object.entries(categories).filter(([, c]) =>
    estVirement ? c.type === "virement" : sens === "revenu" ? c.type === "revenu" : c.type !== "revenu" && c.type !== "virement"
  );
  const categorieActuelle = categories[categorie] || categories.autre;
  const compteActuel = comptes.find((c) => c.id === compteId);

  const valider = async () => {
    const val = parseFloat(String(montant).replace(",", "."));
    if (!val || val <= 0) return;
    await modifierTransaction(tx.id, {
      montant: estVirement ? Math.abs(val) : sens === "depense" ? -val : val,
      libelle: libelle.trim() || (categories[categorie]?.label ?? "Opération"),
      categorie,
      compteId,
      ...(estVirement ? { versId } : {}),
      date,
      horsSolde: horsSolde || false,
      lieu: lieu.trim() || null,
      ...(icone ? { icone } : {}),
    });
    // Propagation aux opérations de même libellé d'origine
    const nouveauLibelle = libelle.trim();
    if (propager && nouveauLibelle && memesLibelles.length > 0) {
      for (const t of memesLibelles) {
        await modifierTransaction(t.id, { libelle: nouveauLibelle }, { silencieux: true });
      }
    }
    onFermer();
  };

  return (
    <Sheet titre="Modifier l'opération" onFermer={onFermer} niveau={niveau}>
      <div className="space-y-3">
        <div className={`relative overflow-hidden rounded-v3-m p-4 text-white ${sens === "depense" ? "bg-[linear-gradient(145deg,var(--corail),var(--corail-bouton))]" : "bg-[linear-gradient(145deg,var(--menthe),var(--menthe-texte))]"}`}>
          <div className="reflet opacity-50" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">{icone || categorieActuelle.icone}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold">{libelle || categorieActuelle.label}</span><span className="block text-xs text-white/75">{date} · {compteActuel?.nom || "Compte"}</span></span>
            <span className="tnum text-lg font-bold">{sens === "depense" ? "−" : "+"}{montant} €</span>
          </div>
        </div>
        {!estVirement && (
          <div className="grid grid-cols-2 rounded-pill bg-voile p-1">
            {[["depense", "Dépense"], ["revenu", "Revenu"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSens(id)}
                className={`rounded-pill py-2 text-sm font-semibold transition-colors ${sens === id ? "bg-carte shadow-carte" : "text-sourdine"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-center gap-1">
          <input
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className={`tnum w-40 bg-transparent text-center text-3xl font-bold outline-none ${estVirement ? "text-encre" : sens === "depense" ? "text-corail" : "text-menthe"}`}
          />
          <span className="text-2xl font-semibold text-sourdine">€</span>
        </div>

        {/* Libellé exact de la banque (import), en sous-titre façon Wallet */}
        {tx.libelleBanque && tx.libelleBanque !== libelle && (
          <p className="-mt-1 text-center text-xs text-sourdine">{tx.libelleBanque}</p>
        )}

        <input
          placeholder="Libellé"
          value={libelle}
          onChange={(e) => { setLibelle(e.target.value); setIconeMemorisee(false); }}
          onBlur={(e) => appliquerHabitude(e.target.value)}
          className="w-full champ px-4 py-3 outline-none"
        />

        {propositions.length > 0 && (
          <div className="fade-in -mt-1 flex flex-wrap gap-1.5">
            {propositions.map((p) => (
              <button
                key={p.libelle}
                onClick={() => { setLibelle(p.libelle); appliquerHabitude(p.libelle); }}
                className="rounded-pill bg-fond px-2.5 py-1 text-[12px] font-medium ring-1 ring-bordure"
              >
                {p.libelle}
                {p.lieu ? <span className="text-sourdine"> · 📍 {p.lieu}</span> : null}
              </button>
            ))}
          </div>
        )}

        {habitude && (
          <p className="fade-in -mt-1 px-1 text-[11px] text-menthe-texte">✨ {habitude}</p>
        )}

        {!estVirement && (
          <IconePicker
            icone={icone}
            suggestion={iconeSuggeree}
            personnalisee={iconeManuelle || iconeMemorisee}
            message={iconeMemorisee ? "Mémorisée pour ce commerçant" : undefined}
            onChoisir={(emoji) => { setIcone(emoji); setIconeManuelle(true); setIconeMemorisee(false); }}
            onChoisirAuto={() => { setIcone(iconeSuggeree); setIconeManuelle(false); setIconeMemorisee(false); }}
          />
        )}

        {memesLibelles.length > 0 && libelle.trim() && libelle.trim() !== (tx.libelle || "") && (
          <label className="flex items-center gap-2.5 rounded-ios bg-menthe-pale px-3.5 py-2.5">
            <input type="checkbox" checked={propager} onChange={(e) => setPropager(e.target.checked)} className="h-4 w-4 accent-menthe" />
            <span className="text-xs text-menthe-texte">
              Appliquer aussi aux <strong>{memesLibelles.length}</strong> autre{memesLibelles.length > 1 ? "s" : ""} opération{memesLibelles.length > 1 ? "s" : ""} du même libellé
            </span>
          </label>
        )}

        {!estVirement && (
          <div className="flex flex-wrap gap-1.5">
            {cats.map(([id, c]) => (
              <button
                key={id}
                onClick={() => setCategorie(id)}
                className={`rounded-pill border px-2.5 py-1.5 text-[13px] font-medium ${categorie === id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}
              >
                {c.icone} {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">{estVirement ? "Depuis" : "Compte"}</span>
            <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full champ px-3 py-3 outline-none">
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
          {estVirement ? (
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Vers</span>
              <select value={versId} onChange={(e) => setVersId(e.target.value)} className="w-full champ px-3 py-3 outline-none">
                {comptes.filter((c) => c.id !== compteId).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          ) : (
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full champ px-3 py-3 outline-none" />
            </label>
          )}
        </div>
        {estVirement && (
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full champ px-3 py-3 outline-none" />
          </label>
        )}

        {!estVirement && (
          <button
            onClick={() => setHorsSolde(!horsSolde)}
            className={`flex w-full items-center justify-between rounded-ios border px-3.5 py-2.5 text-sm font-semibold ${horsSolde ? "border-menthe bg-menthe-pale" : "border-bordure bg-carte"}`}
          >
            👻 Hors solde
            <span className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${horsSolde ? "bg-menthe" : "bg-voile"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${horsSolde ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </span>
          </button>
        )}

        {/* Lieu, façon fiche Apple Wallet — ajoutable à la main, ouvrable dans Plans */}
        <div className="champ p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-voile text-sm">📍</span>
            <input
              placeholder="Ajouter un lieu (ex : La Cave, Bordeaux)"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {!lieu.trim() && lieuxFrequents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lieuxFrequents.slice(0, 5).map((l) => (
                <button key={l} onClick={() => setLieu(l)} className="rounded-pill bg-voile px-2.5 py-1 text-[11px] font-medium">
                  {l}
                </button>
              ))}
            </div>
          )}

          {tx.lieuLat && tx.lieuLon ? (
            <MiniCarte lat={tx.lieuLat} lon={tx.lieuLon} nom={lieu} adresse={tx.lieuAdresse || ""} />
          ) : lieu.trim() ? (
            <a
              href={lienCarte(null, null, lieu.trim())}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-pill bg-marque-pale py-2 text-sm font-semibold text-marque-texte"
            >
              🗺️ Chercher sur la carte
            </a>
          ) : null}
        </div>

        {!estVirement && (
          <button onClick={repeter} className="flex w-full items-center justify-center gap-2 rounded-ios bg-menthe-pale py-2.5 text-sm font-semibold text-menthe-texte active:scale-[0.99] transition-transform">
            🔁 Refaire cette opération aujourd'hui
          </button>
        )}

        <button onClick={valider} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque active:scale-[0.99] transition-transform">
          Enregistrer
        </button>
        <button
          onClick={async () => {
            if (!confirmeSuppr) return setConfirmeSuppr(true);
            await supprimerTransaction(tx.id);
            onFermer();
          }}
          className={`w-full rounded-ios py-3 text-sm font-semibold ${confirmeSuppr ? "bg-corail-bouton text-white" : "text-corail"}`}
        >
          {confirmeSuppr ? "Confirmer la suppression" : "Supprimer"}
        </button>
      </div>
    </Sheet>
  );
}
