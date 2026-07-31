"use client";

import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { genererConseils, statsMois } from "@/lib/conseils";
import { aujourdhui, cleMois, euros, toutesCategories } from "@/lib/format";
import { calculerScore } from "@/lib/score";

function Fleche() {
  return <span aria-hidden="true" className="text-2xl font-light leading-none text-ui-text-secondary/65">›</span>;
}

function Cercle({ valeur, couleur = "#2864f0" }) {
  const pct = Math.max(0, Math.min(valeur, 100));
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--c-voile)" strokeWidth="3.5" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={couleur} strokeWidth="3.5" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct} 100`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ui-text-primary">{Math.round(pct)}%</span>
    </div>
  );
}

export default function ConseilsPriorites({ onVoirTout }) {
  const donnees = useBudget();
  const apercu = useMemo(() => {
    const mois = cleMois(aujourdhui());
    const stats = statsMois(donnees.transactions, mois);
    const categories = toutesCategories;
    const budgets = Object.entries(donnees.budgets || {})
      .filter(([, limite]) => limite > 0)
      .map(([id, limite]) => ({ id, limite, depense: stats.parCategorie[id] || 0, ratio: ((stats.parCategorie[id] || 0) / limite) * 100, categorie: categories[id] || categories.autre }))
      .sort((a, b) => b.ratio - a.ratio);
    const conseils = genererConseils(donnees);
    const score = calculerScore(donnees);
    return { budgets, conseils, score };
  }, [donnees.transactions, donnees.budgets, donnees.comptes, donnees.soldes, donnees.profil, donnees.credits, donnees.projets, donnees.recurrentes]);

  const budgetDepasse = apercu.budgets.find((b) => b.ratio > 100);
  const budgetVigilance = apercu.budgets.find((b) => b.ratio >= 80);
  const bonneNouvelle = apercu.conseils.find((c) => c.ton === "bravo");
  const priorite = budgetDepasse || budgetVigilance || apercu.budgets[0];
  const conseilsSemaine = apercu.conseils.filter((c) => c.titre !== (priorite ? `Budget ${priorite.categorie.label} dépassé` : "")).slice(0, 2);
  const surveiller = [...apercu.score.piliers].sort((a, b) => a.points - b.points).slice(0, 2);
  const depassement = priorite ? Math.max(0, priorite.depense - priorite.limite) : 0;
  const estDepasse = depassement > 0;
  const estPositif = !budgetDepasse && !budgetVigilance && Boolean(bonneNouvelle);

  return (
    <section id="priorites-conseils" className="scroll-mt-5 space-y-7">
      <div className={`rounded-v3-l p-5 ${estPositif ? "border border-[#4bbf94]/20 bg-[linear-gradient(135deg,#fbfffd_0%,#effcf5_58%,#e8f9f1_100%)] shadow-[0_18px_40px_rgba(47,180,129,.13)]" : "border border-[#ff755d]/20 bg-[linear-gradient(135deg,#fffefd_0%,#fff5f1_58%,#fff0eb_100%)] shadow-[0_18px_40px_rgba(251,103,77,.14)]"}`}>
        {estPositif ? (
          <>
            <p className="text-sm font-semibold text-[#26986f]">Belle avancée ce mois-ci</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
              <div className="min-w-0">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#36b989]/12 text-xl">{bonneNouvelle.icone}</span><h2 className="text-xl font-semibold tracking-tight text-ui-text-primary">{bonneNouvelle.titre}</h2></div>
                <p className="mt-4 text-sm leading-relaxed text-ui-text-secondary">{bonneNouvelle.texte}</p>
                <button onClick={onVoirTout} className="mt-4 rounded-pill bg-[#36b989]/12 px-3 py-1.5 text-xs font-semibold text-[#26986f] transition-transform active:scale-95">↗ Voir ce qui fonctionne</button>
              </div>
              <div className="rounded-v3-m border border-[#4bbf94]/15 bg-white/60 p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#26986f]">Santé budgétaire</span>
                <p className="chiffres mt-1 text-3xl font-semibold text-ui-text-primary">{apercu.score.total}<span className="ml-1 text-base text-ui-text-secondary">/100</span></p>
                <p className="mt-0.5 text-xs text-ui-text-secondary">{apercu.score.niveau.label}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#36b989]/15"><div className="h-full rounded-full bg-[#36b989]" style={{ width: `${apercu.score.total}%` }} /></div>
                <p className="mt-2 text-[11px] leading-snug text-ui-text-secondary">Continue tes habitudes : elles portent leurs fruits.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-[#f05c45]">{estDepasse ? "À corriger ce mois-ci" : budgetVigilance ? "À surveiller cette semaine" : "À faire maintenant"}</p>
            {priorite ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
            <div className="min-w-0">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6b55]/10 text-xl">{priorite.categorie.icone}</span><h2 className="text-xl font-semibold tracking-tight text-ui-text-primary">{priorite.categorie.label}</h2></div>
              <p className="mt-4 text-sm text-ui-text-secondary">{estDepasse ? "Dépassement du budget" : "Budget mensuel restant"}</p>
              <p className="chiffres mt-0.5 text-[2rem] font-semibold tracking-tight text-[#f05c45]">{estDepasse ? `+${euros(depassement)}` : euros(priorite.limite - priorite.depense)}</p>
              <p className="mt-0.5 text-sm text-ui-text-secondary">{estDepasse ? `au-dessus de ton plafond de ${euros(priorite.limite)}` : `à dépenser sur ${euros(priorite.limite)}`}</p>
              <button onClick={onVoirTout} className="mt-4 rounded-pill bg-[#ff6b55]/10 px-3 py-1.5 text-xs font-semibold text-[#ef624b] transition-transform active:scale-95">{estDepasse ? "↗ Analyser mes dépenses" : "↗ Voir mes options"}</button>
            </div>
            <div className="rounded-v3-m border border-[#ff8d7a]/15 bg-white/55 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#ef624b]">Dépenses ce mois</span>
              <p className="chiffres mt-1 text-xl font-semibold text-ui-text-primary">{euros(priorite.depense)}</p>
              <p className="mt-0.5 text-xs text-ui-text-secondary">pour {euros(priorite.limite)} prévus</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#ff6b55]/15"><div className="h-full rounded-full bg-[#ff6b55]" style={{ width: `${Math.min(priorite.ratio, 100)}%` }} /></div>
              <p className="mt-2 text-xs font-semibold text-[#ef624b]">{Math.round(priorite.ratio)} % consommés</p>
              {estDepasse && <p className="mt-1 text-[11px] leading-snug text-ui-text-secondary">Objectif : ne plus engager de dépenses Shopping ce mois-ci.</p>}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6b55]/10 text-xl">🎯</span><div><h2 className="text-xl font-semibold tracking-tight">Définis ton premier budget</h2><p className="mt-1 text-sm leading-relaxed text-ui-text-secondary">Un plafond sur tes dépenses du quotidien suffit pour commencer à voir clair.</p><button onClick={onVoirTout} className="mt-3 rounded-pill bg-[#ff6b55]/10 px-3 py-1.5 text-xs font-semibold text-[#ef624b]">Voir mes conseils →</button></div></div>
        )}
          </>
        )}
      </div>

      <div>
        <p className="px-1 text-v3-caption font-semibold uppercase tracking-[.12em] text-[#5266e8]">Cette semaine</p>
        <div className="mt-3 overflow-hidden rounded-v3-l border border-ui-hairline bg-ui-surface-floating shadow-v3-soft">
          {conseilsSemaine.length ? conseilsSemaine.map((c, index) => {
            const estAlerte = c.ton === "alerte";
            const estBravo = c.ton === "bravo";
            const action = estAlerte ? "À ajuster" : estBravo ? "Bonne habitude" : "À regarder";
            const couleur = estAlerte ? "text-[#ef624b] bg-[#ff6b55]/10" : estBravo ? "text-[#26986f] bg-[#36b989]/10" : "text-[#5266e8] bg-[#5266e8]/10";
            return <button key={`${c.cle}-${index}`} onClick={onVoirTout} className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-ui-surface-2 ${index ? "border-t border-ui-hairline" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eff3ff] text-xl">{c.icone}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold text-ui-text-primary">{c.titre}</span><span className="mt-0.5 block line-clamp-2 text-sm leading-snug text-ui-text-secondary">{c.texte}</span><span className={`mt-2 inline-flex rounded-pill px-2 py-0.5 text-[10px] font-semibold ${couleur}`}>{action}</span></span>
              <Fleche />
            </button>;
          }) : <button onClick={onVoirTout} className="flex w-full items-center gap-3 px-4 py-4 text-left"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff3ff] text-xl">✨</span><span className="min-w-0 flex-1"><span className="block text-base font-semibold">Commence ton suivi</span><span className="mt-0.5 block text-sm text-ui-text-secondary">Ajoute quelques opérations pour recevoir des conseils personnalisés.</span><span className="mt-2 inline-flex rounded-pill bg-[#5266e8]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5266e8]">Première étape</span></span><Fleche /></button>}
        </div>
      </div>

      <div>
        <p className="px-1 text-v3-caption font-semibold uppercase tracking-[.12em] text-[#7557dc]">À surveiller</p>
        <div className="mt-3 overflow-hidden rounded-v3-l border border-ui-hairline bg-ui-surface-floating shadow-v3-soft">
          {surveiller.map((p, index) => {
            const couleur = p.points >= 14 ? "#36b989" : p.points >= 8 ? "#5375ed" : "#f0a637";
            return <button key={p.id} onClick={onVoirTout} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-ui-surface-2 ${index ? "border-t border-ui-hairline" : ""}`}>
              <Cercle valeur={(p.points / 20) * 100} couleur={couleur} />
              <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-ui-text-primary">{p.icone} {p.label}</span><span className="mt-0.5 block truncate text-sm text-ui-text-secondary">{p.detail}</span></span>
              <Fleche />
            </button>;
          })}
        </div>
      </div>
    </section>
  );
}
