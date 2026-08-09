"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { analyserQualiteDonnees } from "@/lib/qualiteDonnees";
import { auditerDepenses } from "@/lib/audit";
import { euros, moisDecaleLocal } from "@/lib/format";
import { statsMoisBudgetaire } from "@/lib/conseils";

function Ligne({ icone, titre, detail, ton = "neutre", href }) {
  const couleurs = {
    neutre: "bg-ui-surface-floating border-bordure",
    attention: "bg-beurre-pale border-beurre/20",
    urgent: "bg-corail-pale border-corail/20",
    positif: "bg-menthe-pale border-menthe/20",
  };
  const contenu = <>
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/55 text-xl sombre:bg-black/10">{icone}</span>
    <span className="min-w-0 flex-1"><strong className="block text-sm">{titre}</strong><span className="mt-0.5 block text-xs leading-5 text-sourdine">{detail}</span></span>
    <span aria-hidden="true" className="text-xl text-sourdine">›</span>
  </>;
  return href ? <Link href={href} className={`flex items-center gap-3 rounded-v3-m border p-3.5 shadow-v3-soft transition-transform active:scale-[0.99] ${couleurs[ton]}`}>{contenu}</Link> : <div className={`flex items-center gap-3 rounded-v3-m border p-3.5 shadow-v3-soft ${couleurs[ton]}`}>{contenu}</div>;
}

export default function InboxPage() {
  const { transactions, categories, recurrentes, profil } = useBudget();
  const qualite = useMemo(() => analyserQualiteDonnees(transactions, categories), [transactions, categories]);
  const abonnements = useMemo(() => auditerDepenses({ transactions, recurrentes }, { revenuMensuel: profil.revenuMensuel || 0 }), [transactions, recurrentes, profil.revenuMensuel]);
  const signal = useMemo(() => {
    const actuel = statsMoisBudgetaire(transactions, moisDecaleLocal(0), profil.jourSalaire);
    const precedent = statsMoisBudgetaire(transactions, moisDecaleLocal(-1), profil.jourSalaire);
    const ecart = actuel.depenses - precedent.depenses;
    if (precedent.depenses > 0 && ecart > 40) return { icone: "📈", titre: "Dépenses en hausse", detail: `+${euros(ecart)} par rapport au mois dernier. Regarde les catégories qui expliquent l’écart.`, href: "/statistiques", ton: "attention" };
    if (precedent.depenses > 0 && ecart < -40) return { icone: "🌱", titre: "Rythme de dépense en baisse", detail: `${euros(Math.abs(ecart))} de moins que le mois dernier à la même période.`, href: "/statistiques", ton: "positif" };
    return { icone: "🧠", titre: "Signal financier local", detail: "Tes prochaines alertes apparaîtront ici selon tes habitudes, budgets et échéances.", href: "/statistiques", ton: "neutre" };
  }, [transactions, profil.jourSalaire]);
  const priorites = [];
  if (qualite.sansCategorie.length) priorites.push({ icone: "🏷️", titre: `${qualite.sansCategorie.length} opération${qualite.sansCategorie.length > 1 ? "s" : ""} à classer`, detail: "Une catégorie précise rend tes budgets et conseils fiables.", ton: "attention", href: "/transactions?categorie=autre" });
  if (qualite.doublons.length) priorites.push({ icone: "👯", titre: `${qualite.doublons.length} doublon${qualite.doublons.length > 1 ? "s" : ""} possible${qualite.doublons.length > 1 ? "s" : ""}`, detail: "Vérifie-les avant qu’ils ne faussent ton suivi.", ton: "urgent", href: "/transactions" });
  if (abonnements.doublons.length) priorites.push({ icone: "🔁", titre: "Abonnements à comparer", detail: `${abonnements.doublons.length} famille${abonnements.doublons.length > 1 ? "s" : ""} semble${abonnements.doublons.length > 1 ? "nt" : ""} faire doublon.`, ton: "attention", href: "/reglages" });
  if (abonnements.items.some((item) => item.dormant)) priorites.push({ icone: "💤", titre: "Abonnement possiblement oublié", detail: "Un prélèvement récurrent n’a plus été observé récemment.", ton: "attention", href: "/reglages" });

  return <div className="space-y-5">
    <header>
      <p className="text-v3-caption font-semibold uppercase tracking-[0.14em] text-marque">À traiter</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Ta boîte financière</h1>
      <p className="mt-2 max-w-sm text-sm leading-5 text-sourdine">Les quelques décisions qui améliorent vraiment la qualité de ton budget.</p>
    </header>

    {priorites.length ? <section className="space-y-2.5">{priorites.map((item) => <Ligne key={item.titre} {...item} />)}</section> : <section className="rounded-v3-l bg-menthe-pale p-5 shadow-v3-soft"><p className="text-2xl">✨</p><h2 className="mt-2 font-semibold">Tout est sous contrôle</h2><p className="mt-1 text-sm leading-5 text-menthe-texte">Tes opérations sont rangées et aucune anomalie importante n’attend ton attention.</p></section>}

    <section><p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-sourdine">Ce que tes données racontent</p><Ligne {...signal} /></section>

    <section className="rounded-v3-l bg-ui-surface-floating p-4 shadow-v3-soft">
      <div className="flex items-baseline justify-between gap-3"><h2 className="font-semibold">Tes automatisations</h2><Link href="/reglages" className="text-sm font-semibold text-marque">Gérer</Link></div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-bordure pt-3">
        <div><p className="text-2xl font-bold tnum">{(profil.reglesAuto || []).length}</p><p className="mt-0.5 text-xs text-sourdine">règle{(profil.reglesAuto || []).length > 1 ? "s" : ""} active{(profil.reglesAuto || []).length > 1 ? "s" : ""}</p></div>
        <div><p className="text-2xl font-bold tnum">{abonnements.items.length}</p><p className="mt-0.5 text-xs text-sourdine">abonnement{abonnements.items.length > 1 ? "s" : ""} détecté{abonnements.items.length > 1 ? "s" : ""}</p></div>
      </div>
      {abonnements.totalMensuel > 0 && <p className="mt-3 rounded-v3-s bg-ui-surface-raised px-3 py-2 text-sm text-sourdine">Dépenses récurrentes estimées : <strong className="text-ui-text-primary">{euros(abonnements.totalMensuel)} / mois</strong></p>}
    </section>

    <section className="space-y-2.5">
      <Ligne icone="🔮" titre="Prévisions actionnables" detail="Teste l’impact d’une dépense avant de la faire, sans toucher à tes données." ton="positif" href="/previsions" />
      <Ligne icone="🗓️" titre="Calendrier financier" detail="Visualise tes dépenses, échéances et récurrences jour par jour." href="/calendrier" />
      <Ligne icone="📅" titre="Clôturer le mois précédent" detail="Conserve un bilan de référence et repars avec des budgets à jour." href="/cloture" />
      <Ligne icone="🔁" titre="Centre des abonnements" detail="Repère les doublons, les services dormants et leur coût annuel." href="/reglages" />
      <Ligne icone="🎯" titre="Projets d’épargne" detail="Relie tes objectifs à une contribution concrète chaque mois." href="/budgets" />
    </section>
  </div>;
}
