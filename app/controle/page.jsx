"use client";

import Link from "next/link";

const BLOCS = [
  ["⌁", "Données & connexions", "Importer un relevé, connecter une banque ou gérer tes comptes.", "/reglages"],
  ["◌", "Confidentialité", "Masquer les montants d’un geste quand tu es en déplacement.", "/reglages"],
  ["⇩", "Sauvegarde", "Exporter tes données pour garder une copie à toi.", "/reglages"],
];
export default function ControlePage() {
  return <div className="space-y-5"><header><p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-marque">Préférences & données</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Centre de contrôle</h1><p className="mt-2 text-sm leading-5 text-sourdine">Tout ce qui concerne la sécurité, tes données et la personnalisation de Pécule.</p></header><div className="space-y-2">{BLOCS.map(([emoji, titre, detail, href]) => <Link key={titre} href={href} className="flex gap-3 rounded-v3-m border border-ui-hairline bg-ui-surface-floating p-4 shadow-v3-soft"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ui-surface-raised text-xl">{emoji}</span><span className="flex-1"><strong className="block">{titre}</strong><span className="mt-1 block text-sm leading-5 text-sourdine">{detail}</span></span><span className="self-center">›</span></Link>)}</div><Link href="/reglages" className="block rounded-v3-m bg-marque-bouton px-4 py-3.5 text-center text-sm font-semibold text-surMarque shadow-bouton">Ouvrir tous les réglages</Link></div>;
}
