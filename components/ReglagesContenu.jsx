"use client";

import { useState, useEffect, useRef } from "react";
import { useBudget } from "@/lib/store";
import { MODES_SALAIRE } from "@/lib/joursOuvres";
import { ACCENTS, ACCENT_DEFAUT, appliquerAccent } from "@/lib/themes";
import { auth } from "@/lib/firebase";
import Sheet from "@/components/Sheet";
import CategoriesSheet from "@/components/CategoriesSheet";
import AssistantConfig from "@/components/AssistantConfig";
import ImportCSV from "@/components/ImportCSV";
import RenommerSheet from "@/components/RenommerSheet";
import CategoriserSheet from "@/components/CategoriserSheet";
import JournalSheet from "@/components/JournalSheet";
import { toutesCategories as CATEGORIES, FREQUENCES, euros, dateCourte, isoLocal, prochaineDateSalaire } from "@/lib/format";
import { estSauvegardePecule, resumeSauvegarde } from "@/lib/sauvegarde";

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
  const [modeSalaire, setModeSalaire] = useState(profil.modeSalaire || "jour");
  const modeAvecJour = MODES_SALAIRE.find((m) => m.id === modeSalaire)?.avecJour;
  const apercuISO = prochaineDateSalaire(Number(jourSalaire) || 0, modeSalaire);
  const apercuSalaire = apercuISO ? dateCourte(apercuISO) : null;

  const enregistrer = async () => {
    await sauverApp(undefined, {
      ...profil,
      prenom: prenom.trim(),
      revenuMensuel: parseFloat(String(revenu).replace(",", ".")) || 0,
      jourSalaire: Number(jourSalaire) || 0,
      modeSalaire,
    });
    onFermer();
  };

  return (
    <Sheet titre="Mon profil" onFermer={onFermer}>
      <div className="space-y-3">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Prénom</span>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Ton prénom"
            className="w-full champ px-4 py-3 outline-none" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Revenu mensuel net</span>
            <input inputMode="decimal" value={revenu} onChange={(e) => setRevenu(e.target.value)} placeholder="ex : 2300"
              className="tnum w-full champ px-4 py-3 outline-none" />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Quand tombe ton salaire</span>
            <select value={modeSalaire} onChange={(e) => setModeSalaire(e.target.value)}
              className="w-full champ px-3 py-3 outline-none">
              {MODES_SALAIRE.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>

          {modeAvecJour && (
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Jour du mois</span>
              <select value={jourSalaire} onChange={(e) => setJourSalaire(e.target.value)}
                className="w-full champ px-3 py-3 outline-none">
                <option value={0}>—</option>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>Le {j} du mois</option>
                ))}
                <option value={31}>Fin de mois</option>
              </select>
            </label>
          )}

          {apercuSalaire && (
            <p className="rounded-ios bg-marque-pale px-3 py-2 text-xs text-marque-texte">
              Prochaine paie prévue le <strong>{apercuSalaire}</strong>
            </p>
          )}
        </div>
        <p className="text-xs text-sourdine">Le jour du salaire alimente le compte à rebours de l'accueil et le budget restant par jour.</p>
        <button onClick={enregistrer} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Enregistrer</button>
      </div>
    </Sheet>
  );
}

/* ---- Fiche apparence ---- */
function ApparenceSheet({ onFermer }) {
  const { profil, sauverApp } = useBudget();
  // Aperçu en direct : on applique tout de suite, on enregistre au choix.
  const [theme, setTheme] = useState(profil.theme || "auto");
  const [accent, setAccent] = useState(profil.accent || ACCENT_DEFAUT);
  const [centimes, setCentimes] = useState(profil.afficherCentimes !== false);
  const [arrondi, setArrondi] = useState(profil.arrondiGrandsNombres !== false);

  const estSombre = () =>
    theme === "sombre" ||
    (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Applique l'aperçu à la volée
  useEffect(() => {
    document.documentElement.classList.toggle("sombre", estSombre());
    appliquerAccent(accent, estSombre());
  }, [theme, accent]);

  const enregistrer = async () => {
    await sauverApp(undefined, { ...profil, theme, accent, afficherCentimes: centimes, arrondiGrandsNombres: arrondi });
    onFermer();
  };

  // Restaure l'état enregistré si on ferme sans valider
  const annuler = () => {
    document.documentElement.classList.toggle("sombre", (profil.theme || "auto") === "sombre" ||
      ((profil.theme || "auto") === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches));
    appliquerAccent(profil.accent || ACCENT_DEFAUT, document.documentElement.classList.contains("sombre"));
    onFermer();
  };

  return (
    <Sheet titre="Apparence" onFermer={annuler}>
      <div className="space-y-4">
        {/* Aperçu en direct */}
        <div className="rounded-ios bg-fond p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sourdine">Aperçu</p>
          <div className="rounded-ios bg-carte p-3 shadow-carte">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Compte courant</span>
              <span className="chiffres text-sm font-bold text-marque">1 144 €</span>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full bg-marque-pale px-2.5 py-0.5 text-xs font-medium text-marque-texte">Courses</span>
              <button className="ml-auto rounded-pill bg-marque-bouton px-3 py-1 text-xs font-semibold text-surMarque">
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Thème clair / sombre / auto */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-sourdine">Thème</p>
          <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
            {THEMES.map((t, i) => (
              <Ligne
                key={t.id}
                icone={t.icone}
                label={t.label}
                detail={t.detail}
                onClick={() => setTheme(t.id)}
                dernier={i === THEMES.length - 1}
                droite={theme === t.id ? <span className="font-bold text-marque">✓</span> : <span />}
              />
            ))}
          </div>
        </div>

        {/* Couleur d'accent */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-sourdine">Couleur</p>
          <div className="grid grid-cols-6 gap-2 rounded-ios bg-carte p-3 shadow-carte">
            {Object.entries(ACCENTS).map(([id, a]) => (
              <button
                key={id}
                onClick={() => setAccent(id)}
                aria-label={a.label}
                className="tappable flex aspect-square items-center justify-center rounded-full"
                style={{
                  background: a.apercu,
                  boxShadow: accent === id ? "0 0 0 2px var(--c-carte), 0 0 0 4px " + a.apercu : "none",
                }}
              >
                {accent === id && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Format des montants */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-sourdine">Montants</p>
          <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
            <label className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">Afficher les centimes</span>
              <input
                type="checkbox"
                checked={centimes}
                onChange={(e) => setCentimes(e.target.checked)}
                className="h-6 w-6 accent-marque"
              />
            </label>
            <div className="mx-4 border-t border-bordure" />
            <label className="flex items-center justify-between px-4 py-3">
              <span className="min-w-0 pr-3 text-sm">
                Arrondir les gros montants
                <span className="block text-xs text-sourdine">Au-delà de 1 000 € (ex : 1 234 € au lieu de 1 234,56 €)</span>
              </span>
              <input
                type="checkbox"
                checked={arrondi}
                onChange={(e) => setArrondi(e.target.checked)}
                className="h-6 w-6 shrink-0 accent-marque"
              />
            </label>
          </div>
        </div>

        <button onClick={enregistrer} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">
          Enregistrer
        </button>
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
  const { comptes, transactions, budgets, recurrentes, projets, credits, profil, categoriesPerso, importerDonnees, notifier, dernierImport, annulerImport, modeLocal } = useBudget();
  const [annulation, setAnnulation] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(null);
  const [erreurSauvegarde, setErreurSauvegarde] = useState("");
  const [restaurationEnCours, setRestaurationEnCours] = useState(false);
  const fichierRef = useRef(null);

  const exporter = () => {
    const blob = new Blob(
      [JSON.stringify({ format: "pecule-sauvegarde", version: 1, exporteLe: new Date().toISOString(), comptes, transactions, budgets, recurrentes, projets, credits, profil, categoriesPerso }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-export-${isoLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifier("Export téléchargé", "⬇︎");
  };

  const importer = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const l = new FileReader();
    l.onload = () => {
      try {
        const contenu = JSON.parse(String(l.result));
        if (!estSauvegardePecule(contenu)) throw new Error("format");
        setSauvegarde(contenu);
        setErreurSauvegarde("");
      } catch {
        setSauvegarde(null);
        setErreurSauvegarde("Fichier non reconnu. Choisis une sauvegarde Pécule au format JSON.");
      }
    };
    l.readAsText(f);
  };

  const restaurer = async () => {
    if (!sauvegarde) return;
    setRestaurationEnCours(true);
    try {
      const ok = await importerDonnees(sauvegarde);
      if (ok) {
        notifier("Sauvegarde importée", "✓");
        setSauvegarde(null);
      } else {
        setErreurSauvegarde("La sauvegarde ne contient aucune donnée Pécule exploitable.");
      }
    } catch {
      setErreurSauvegarde("Restauration impossible. Tes données actuelles sont inchangées.");
    } finally {
      setRestaurationEnCours(false);
    }
  };

  return (
    <Sheet titre="Sauvegarde & données" onFermer={onFermer}>
      <div className="space-y-3">
        <p className="text-sm text-sourdine">
          L'export JSON contient tout : comptes, opérations, budgets, projets, crédits, récurrences et catégories. C'est ta sauvegarde et ton ticket de migration.
        </p>
        {dernierImport && (
          <div className="rounded-ios bg-corail-pale p-3.5">
            <p className="text-sm font-semibold text-corail-texte">Dernier import CSV</p>
            <p className="mt-0.5 text-xs text-corail-texte/80">
              {dernierImport.ajouts} opération{dernierImport.ajouts > 1 ? "s" : ""} ajoutée{dernierImport.ajouts > 1 ? "s" : ""}
              {dernierImport.fusions > 0 && ` · ${dernierImport.fusions} fusionnée${dernierImport.fusions > 1 ? "s" : ""}`}
            </p>
            <button
              onClick={async () => {
                if (!annulation) return setAnnulation(true);
                const r = await annulerImport(dernierImport.id);
                notifier(`Import annulé (${r.ajouts} supprimée${r.ajouts > 1 ? "s" : ""})`, "↩️");
                setAnnulation(false);
              }}
              className="mt-2 w-full rounded-ios bg-corail-bouton py-2.5 text-sm font-semibold text-white"
            >
              {annulation ? "Confirmer l'annulation ?" : "↩️ Annuler ce dernier import"}
            </button>
            {annulation && (
              <button onClick={() => setAnnulation(false)} className="mt-1.5 w-full text-xs font-medium text-corail-texte">
                Non, garder
              </button>
            )}
          </div>
        )}

        <button onClick={exporter} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">
          ⬇︎ Exporter mes données
        </button>
        {sauvegarde ? (() => {
          const resume = resumeSauvegarde(sauvegarde);
          return (
            <div className="rounded-ios border border-beurre/30 bg-beurre-pale p-3.5">
              <p className="text-sm font-semibold text-beurre-texte">Vérifier la sauvegarde</p>
              <p className="mt-0.5 text-xs text-beurre-texte/80">
                {resume.exporteLe ? `Exportée le ${new Date(resume.exporteLe).toLocaleDateString("fr-FR", { dateStyle: "long" })}.` : "Sauvegarde Pécule détectée."}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-beurre-texte">
                <span className="rounded-pill bg-carte/70 px-2 py-1">{resume.comptes} compte{resume.comptes > 1 ? "s" : ""}</span>
                <span className="rounded-pill bg-carte/70 px-2 py-1">{resume.transactions} opération{resume.transactions > 1 ? "s" : ""}</span>
                <span className="rounded-pill bg-carte/70 px-2 py-1">{resume.budgets} budget{resume.budgets > 1 ? "s" : ""}</span>
                <span className="rounded-pill bg-carte/70 px-2 py-1">{resume.recurrentes} récurrence{resume.recurrentes > 1 ? "s" : ""}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-beurre-texte/90">
                {modeLocal ? "Cette restauration remplacera les données stockées sur cet appareil." : "Les éléments de même identifiant seront mis à jour ; les autres données de ton compte restent conservées."}
              </p>
              <button onClick={restaurer} disabled={restaurationEnCours} className="mt-3 w-full rounded-ios bg-beurre-bouton py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {restaurationEnCours ? "Restauration…" : "Restaurer cette sauvegarde"}
              </button>
              <button onClick={() => { setSauvegarde(null); if (fichierRef.current) fichierRef.current.value = ""; }} className="mt-2 w-full text-xs font-semibold text-beurre-texte">Annuler</button>
            </div>
          );
        })() : (
          <label className="block w-full cursor-pointer rounded-ios bg-voile py-3 text-center font-semibold">
            ⬆︎ Choisir une sauvegarde à restaurer
            <input ref={fichierRef} type="file" accept=".json,application/json" className="hidden" onChange={importer} />
          </label>
        )}
        {erreurSauvegarde && <p role="alert" className="rounded-ios bg-corail-pale px-3 py-2.5 text-xs font-medium text-corail-texte">⚠️ {erreurSauvegarde}</p>}
      </div>
    </Sheet>
  );
}

/* ---- Rangée plate et aérée ---- */
function Rangee({ icone, label, detail, onClick, danger = false, dernier = false }) {
  return (
    <button
      onClick={onClick}
      className={`tappable flex w-full items-center gap-4 px-4 py-4 text-left ${dernier ? "" : "border-b border-ui-hairline"}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-v3-xs text-lg ${danger ? "bg-corail-pale" : "bg-ui-surface-2"}`}>{icone}</span>
      <span className="min-w-0 flex-1"><span className={`block text-[16px] font-medium ${danger ? "text-corail" : ""}`}>{label}</span>{detail && <span className="mt-0.5 block truncate text-v3-caption text-ui-text-secondary">{detail}</span>}</span>
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
  const prochainePaie = prochaineDateSalaire(Number(profil.jourSalaire) || 0, profil.modeSalaire || "jour");
  const detailProfil = profil.revenuMensuel
    ? `${euros(profil.revenuMensuel)} / mois${prochainePaie ? ` · prochaine paie ${dateCourte(prochainePaie)}` : ""}`
    : "Revenu, jour de paie et préférences";

  return (
    <div className="flex min-h-full flex-col">
      {/* Salutation */}
      <header className="px-1 pb-5 pt-2"><p className="text-v3-caption font-medium text-ui-text-secondary">Préférences & données</p><h1 className="mt-0.5 text-[26px] font-bold tracking-tight">Réglages</h1></header>
      <button onClick={() => setFiche("profil")} className="surface-lift mb-6 flex w-full items-center gap-4 rounded-v3-m bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))] p-5 text-left text-white shadow-v3-medium"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl backdrop-blur-v3-glass">{profil.prenom ? profil.prenom.slice(0, 1).toUpperCase() : "👤"}</span><span className="min-w-0 flex-1"><span className="block text-v3-caption text-white/70">Mon profil</span><span className="block truncate text-xl font-semibold">{profil.prenom || "Personnaliser mon profil"}</span><span className="mt-1 block truncate text-v3-caption text-white/75">{detailProfil}</span></span><span className="text-2xl text-white/70">›</span></button>

      <section className="mb-5"><h2 className="mb-2 px-1 text-v3-caption font-semibold uppercase tracking-wide text-ui-text-secondary">Personnalisation</h2><nav className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft"><Rangee icone="🌗" label="Apparence" detail="Thème, accent et montants" onClick={() => setFiche("apparence")} /><Rangee icone="🏷️" label="Catégories" detail={nbCategories > 0 ? `${nbCategories} catégories personnalisées` : "Organiser mes dépenses"} onClick={() => setFiche("categories")} dernier /></nav></section>

      <section className="mb-5"><h2 className="mb-2 px-1 text-v3-caption font-semibold uppercase tracking-wide text-ui-text-secondary">Organisation</h2><nav className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft"><Rangee icone="🔁" label="Récurrentes" detail={nbRecurrentes > 0 ? `${nbRecurrentes} opérations actives` : "Anticiper les prochaines échéances"} onClick={() => setFiche("recurrentes")} /><Rangee icone="💼" label="Salaire & charges fixes" detail="Projection et reste à vivre" onClick={() => setFiche("assistant")} /><Rangee icone="📥" label="Importer un relevé bancaire" detail="Ajouter un fichier CSV" onClick={() => setFiche("import")} /><Rangee icone="✨" label="Nettoyer les libellés" detail="Uniformiser les intitulés" onClick={() => setFiche("renommer")} /><Rangee icone="🏷️" label="Ranger mes opérations" detail="Catégoriser les transactions" onClick={() => setFiche("categoriser")} dernier /></nav></section>

      <section><h2 className="mb-2 px-1 text-v3-caption font-semibold uppercase tracking-wide text-ui-text-secondary">Données</h2><nav className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft"><Rangee icone="💾" label="Sauvegarde & données" detail="Exporter ou restaurer mes informations" onClick={() => setFiche("donnees")} /><Rangee icone="🩺" label="Journal technique" detail="Diagnostic de l’application" onClick={() => setFiche("journal")} dernier /></nav></section>

      {/* Zone de sortie, séparée par une bande */}
      <div className="my-5 h-px bg-ui-hairline" />
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
      <div className="-mx-4 mt-auto rounded-t-v3-m bg-ui-surface-2 px-5 py-5">
        <p className="text-xs leading-relaxed text-sourdine">
          {modeLocal ? "Données stockées sur cet appareil — pense à exporter régulièrement." : `Connecté : ${user?.email}`}
        </p>
        <p className="mt-2 text-xs text-sourdine">
          📲 Astuce : Safari → Partager → « Sur l'écran d'accueil » pour installer l'app.
        </p>
        <p className="mt-2 text-xs font-semibold text-sourdine/60">Pécule · v2</p>
      </div>

      {fiche === "profil" && <ProfilSheet onFermer={() => setFiche(null)} />}
      {fiche === "apparence" && <ApparenceSheet onFermer={() => setFiche(null)} />}
      {fiche === "categories" && <CategoriesSheet onFermer={() => setFiche(null)} />}
      {fiche === "recurrentes" && <RecurrentesSheet onFermer={() => setFiche(null)} />}
      {fiche === "donnees" && <DonneesSheet onFermer={() => setFiche(null)} />}
      {fiche === "assistant" && <AssistantConfig onFermer={() => setFiche(null)} />}
      {fiche === "import" && <ImportCSV onFermer={() => setFiche(null)} />}
      {fiche === "renommer" && <RenommerSheet onFermer={() => setFiche(null)} />}
      {fiche === "categoriser" && <CategoriserSheet onFermer={() => setFiche(null)} />}
      {fiche === "journal" && <JournalSheet onFermer={() => setFiche(null)} />}
    </div>
  );
}
