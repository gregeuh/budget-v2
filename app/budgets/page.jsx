"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import FicheCategorie from "@/components/FicheCategorie";
import { euros, cleMois, aujourdhui } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import Sheet from "@/components/Sheet";
import FicheProjet from "@/components/FicheProjet";
import MoisSelecteur from "@/components/MoisSelecteur";
import Repliable from "@/components/Repliable";
import EtatVide from "@/components/EtatVide";
import { calculerProjection } from "@/lib/projection";

const REGLE = [
  { id: "besoin", label: "Besoins", cible: 50, couleur: "var(--marque)" },
  { id: "envie", label: "Envies", cible: 30, couleur: "var(--beurre)" },
  { id: "epargne", label: "Épargne", cible: 20, couleur: "var(--menthe)" },
];

function Anneau({ valeur, couleur }) {
  const pct = Math.max(0, Math.min(100, Math.round(valeur)));
  return <div className="budget-ring" style={{ "--ring-value": pct, "--ring-color": couleur }}><span>{pct}%</span></div>;
}

function FicheBudget({ onFermer }) {
  const { budgets, sauverApp, categories } = useBudget();
  const [locaux, setLocaux] = useState({ ...budgets });
  const cats = Object.entries(categories).filter(([, c]) => c.type === "besoin" || c.type === "envie");

  const valider = async () => {
    const propres = Object.fromEntries(
      Object.entries(locaux)
        .map(([k, v]) => [k, parseFloat(String(v).replace(",", ".")) || 0])
        .filter(([, v]) => v > 0)
    );
    await sauverApp(propres, undefined);
    onFermer();
  };

  return (
    <Sheet titre="Définir mes budgets" onFermer={onFermer}>
      <p className="mb-3 text-sm text-sourdine">Fixe un plafond mensuel par catégorie. Laisse vide pour ne pas suivre.</p>
      <div className="max-h-[45dvh] space-y-2 overflow-y-auto pb-2">
        {cats.map(([id, c]) => (
          <label key={id} className="flex items-center justify-between gap-3 rounded-2xl bg-carte px-3 py-2.5 shadow-carte">
            <span className="text-sm font-medium">{c.icone} {c.label}</span>
            <span className="flex items-center gap-1">
              <input
                inputMode="decimal"
                placeholder="—"
                value={locaux[id] ?? ""}
                onChange={(e) => setLocaux({ ...locaux, [id]: e.target.value })}
                className="tnum w-20 rounded-xl border border-bordure px-2 py-1.5 text-right outline-none"
              />
              <span className="text-sm text-sourdine">€</span>
            </span>
          </label>
        ))}
      </div>
      <button onClick={valider} className="mt-3 w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">
        Enregistrer
      </button>
    </Sheet>
  );
}

export default function Budgets() {
  const { transactions, budgets, profil, projets, categories, comptes, soldes, recurrentes, modifierProjet, notifier, celebrer } = useBudget();
  const [ficheCat, setFicheCat] = useState(null);

  const contribuerProjet = (id, montant) => {
    const p = projets.find((x) => x.id === id);
    if (!p) return;
    const nouveau = (p.montantActuel || 0) + montant;
    modifierProjet(id, { montantActuel: nouveau });
    const atteint = nouveau >= (p.objectif || 0) && (p.montantActuel || 0) < (p.objectif || 0);
    if (atteint) celebrer();
    notifier(atteint ? `Objectif « ${p.nom} » atteint ! 🎉` : `+${montant} € sur « ${p.nom} »`, atteint ? "🏆" : "🐷");
  };
  const [edition, setEdition] = useState(false);
  const [ficheProjet, setFicheProjet] = useState(null); // null | "nouveau" | projet
  const [mois, setMois] = useState(cleMois(aujourdhui()));
  const s = statsMois(transactions, mois);
  const revenu = s.revenus || profil.revenuMensuel || 0;
  const projection = useMemo(
    () => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }),
    [comptes, soldes, transactions, recurrentes, profil]
  );
  const finDuMois = new Date(`${mois}-01T12:00:00`);
  finDuMois.setMonth(finDuMois.getMonth() + 1, 0);
  const joursRestants = Math.max(1, Math.ceil((finDuMois.getTime() - new Date(`${aujourdhui()}T12:00:00`).getTime()) / 86400000) + 1);
  const budgetPhare = Object.entries(budgets)
    .map(([id, limite]) => ({ id, limite, reel: s.parCategorie[id] || 0, ratio: limite > 0 ? (s.parCategorie[id] || 0) / limite : 0 }))
    .sort((a, b) => b.ratio - a.ratio)[0];

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("edit") === "1") setEdition(true);
  }, []);

  return (
    <div className="budgets-v4 space-y-6">
      <header className="flex items-center justify-between px-1">
        <div><p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-ui-primary">Ton plan du mois</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Budgets</h1></div>
        <button onClick={() => setEdition(true)} className="tappable rounded-pill bg-marque-bouton px-4 py-2.5 text-sm font-semibold text-surMarque shadow-bouton">
          Modifier
        </button>
      </header>

      <div className="grid grid-cols-2 rounded-pill bg-voile p-1 text-sm font-semibold">
        <Link href="/budgets" className="rounded-pill bg-carte py-2 text-center shadow-carte">Budgets</Link>
        <Link href="/statistiques" className="rounded-pill py-2 text-center text-sourdine">Statistiques</Link>
      </div>

      <MoisSelecteur mois={mois} onChanger={setMois} revenus={s.revenus} depenses={s.depenses} />

      {/* Règle 50/30/20 */}
      <Repliable icone="⚖️" titre="Règle 50 / 30 / 20" sousTitre="Part des revenus consacrée à chaque poste">
        {revenu === 0 ? (
          <p className="text-sm text-sourdine">Ajoute un revenu ce mois-ci (ou renseigne ton revenu mensuel dans les réglages) pour activer l'analyse.</p>
        ) : (
          <div className="space-y-3">
            {REGLE.map((r) => {
              const val = r.id === "epargne" ? Math.max(s.parType.epargne, revenu - s.depenses) : s.parType[r.id];
              const pct = Math.max(0, Math.round((val / revenu) * 100));
              return (
                <div key={r.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{r.label}</span>
                    <span className="tnum text-sourdine">{pct} % <span className="opacity-60">/ {r.cible} % visés</span></span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-voile">
                    <div className="jauge-in h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: r.couleur }} />
                    <div className="absolute top-0 h-full w-0.5 bg-black/40" style={{ left: `${r.cible}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Repliable>

      {ficheCat && <FicheCategorie categorieId={ficheCat} onFermer={() => setFicheCat(null)} />}

      {/* Budgets par catégorie */}
      <section>
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-sourdine">Plafonds par catégorie</h2>
        {Object.keys(budgets).length === 0 ? (
          <EtatVide
            icone="🎯"
            titre="Fixe tes premiers plafonds"
            description="Choisis les catégories à suivre et le montant maximum que tu souhaites leur consacrer chaque mois."
            actionLabel="Définir mes budgets"
            onAction={() => setEdition(true)}
          />
        ) : (
          <ul className="space-y-2">
            {Object.entries(budgets).map(([cat, limite]) => {
              const c = categories[cat] || categories.autre;
              const reel = s.parCategorie[cat] || 0;
              const pct = limite > 0 ? (reel / limite) * 100 : 0;
              const couleur = pct >= 100 ? "var(--corail)" : pct >= 80 ? "var(--beurre)" : "var(--menthe)";
              const restant = limite - reel;
              const couleurEtat = pct >= 100 ? "text-corail" : pct >= 80 ? "text-beurre-texte" : "text-menthe-texte";
              const rythmeHebdo = restant > 0 ? (restant / joursRestants) * 7 : 0;
              return (
                <li key={cat}>
                  <button onClick={() => setFicheCat(cat)} className="tappable w-full rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-3.5 text-left shadow-v3-soft">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${pct >= 100 ? "bg-corail-pale" : pct >= 80 ? "bg-ambre-pale" : "bg-menthe-pale"}`}>{c.icone}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.label}</span><span className="mt-0.5 block text-xs text-sourdine">Budget {euros(limite)}</span></span>
                    <Anneau valeur={pct} couleur={couleur} />
                    <span className="text-lg text-sourdine">›</span>
                  </div>
                  {pct >= 80 && <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${pct >= 100 ? "bg-corail-pale text-corail" : "bg-ambre-pale text-beurre-texte"}`}>{pct >= 100 ? `Dépassé de ${euros(Math.abs(restant))}` : `Attention : il reste ${euros(restant)}`}</p>}
                  {restant > 0 && <p className="mt-2 text-xs text-sourdine">Rythme conseillé : <strong className="tnum text-ui-text-primary">≈ {euros(rythmeHebdo)} / semaine</strong></p>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {budgetPhare && (
        <section className="dashboard-hero relative overflow-hidden rounded-v3-l p-5 text-white">
          <div className="reflet opacity-60" />
          <div className="relative max-w-[76%]"><p className="text-sm font-medium text-white/75">Ton prochain geste</p><h2 className="mt-2 text-xl font-semibold">{budgetPhare.ratio >= 0.8 ? `Optimise ton budget ${categories[budgetPhare.id]?.label || "ce mois-ci"}` : "Continue sur ton bon rythme"}</h2><p className="mt-2 text-sm text-white/75">Une action simple maintenant aide à garder ton mois confortable.</p><Link href={budgetPhare.ratio >= 0.8 ? `/transactions?categorie=${budgetPhare.id}` : "/conseils"} className="mt-4 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-marque-texte">Voir mes conseils <span>›</span></Link></div>
        </section>
      )}

      {/* Projets d'épargne */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-sourdine">Projets d'épargne</h2>
          <button onClick={() => setFicheProjet("nouveau")} className="text-sm font-medium text-marque">+ Projet</button>
        </div>
        {projets.length === 0 ? (
          <button onClick={() => setFicheProjet("nouveau")} className="w-full rounded-ios border-2 border-dashed border-bordure p-5 text-center text-sm text-sourdine">
            Vacances, nouveau maillot vintage, PS5 Pro… crée ton premier objectif →
          </button>
        ) : (
          <ul className="space-y-2">
            {projets.map((p) => {
              const pct = p.objectif > 0 ? Math.min(100, (p.montantActuel / p.objectif) * 100) : 0;
              const atteint = pct >= 100;
              const restant = Math.max(0, (p.objectif || 0) - (p.montantActuel || 0));
              const estimationMois = !atteint && p.versementMensuel > 0 ? Math.ceil(restant / p.versementMensuel) : null;
              return (
              <li key={p.id} className="overflow-hidden rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-4 shadow-v3-soft">
                  {/* Zone d'ouverture de la fiche (div cliquable : on ne peut pas imbriquer des boutons) */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setFicheProjet(p)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFicheProjet(p)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="min-w-0 flex-1 truncate pr-2 font-semibold">{p.icone} {p.nom}{atteint ? " 🎉" : ""}</span>
                      <span className="tnum shrink-0 text-sm text-sourdine">{euros(p.montantActuel)} / {euros(p.objectif)}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-voile">
                      <div className="jauge-in h-full rounded-full transition-all" style={{ width: `${pct}%`, background: atteint ? "var(--menthe)" : "var(--marque)" }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="tnum text-sourdine">{Math.round(pct)} % atteint</span>
                      <span className={`tnum truncate font-semibold ${atteint ? "text-menthe-texte" : "text-marque-texte"}`}>
                        {atteint ? "Objectif atteint" : `Encore ${euros(restant)}`}
                      </span>
                    </div>
                    {!atteint && p.versementMensuel > 0 && (
                      <div className="mt-3 rounded-v3-s bg-marque-pale/70 px-3 py-2.5 text-xs text-marque-texte">
                        <div className="flex items-center justify-between font-semibold"><span>Aujourd’hui</span><span>{p.echeance ? new Date(p.echeance).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : estimationMois ? `≈ ${estimationMois} mois` : "Objectif"}</span></div>
                        <div className="mt-2 flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-marque" /><span className="h-0.5 flex-1 bg-marque/30" /><i className="h-2.5 w-2.5 rounded-full border-2 border-marque bg-ui-surface-floating" /></div>
                        <p className="mt-2">Ton geste : <strong>{euros(p.versementMensuel)} / mois</strong>{estimationMois ? ` · objectif estimé dans ${estimationMois} mois` : ""}.</p>
                      </div>
                    )}
                  </div>

                  {/* Contribution rapide */}
                  {!atteint && (
                    <div className="mt-3 flex gap-1.5 border-t border-ui-hairline pt-3">
                      {[20, 50, 100].map((v) => (
                        <button
                          key={v}
                          onClick={() => contribuerProjet(p.id, v)}
                          className="flex-1 rounded-pill bg-marque-pale py-2 text-xs font-semibold text-marque-texte active:scale-95 transition-transform"
                        >
                          +{v} €
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {edition && <FicheBudget onFermer={() => setEdition(false)} />}
      {ficheProjet && <FicheProjet projet={ficheProjet === "nouveau" ? null : ficheProjet} onFermer={() => setFicheProjet(null)} />}
    </div>
  );
}
