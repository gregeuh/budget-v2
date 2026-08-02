"use client";

export default function ErreurGlobale({ reset }) {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md items-center px-5">
      <section className="w-full rounded-v3-l border border-ui-hairline bg-ui-surface-floating p-7 text-center shadow-v3-medium">
        <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-corail-pale text-2xl">⚠️</span>
        <h1 className="mt-4 text-v3-title font-semibold text-ui-text-primary">Une page a trébuché</h1>
        <p className="mt-2 text-sm leading-5 text-ui-text-secondary">Tes données ne sont pas supprimées. Réessaie simplement de charger cette page.</p>
        <button onClick={reset} className="tappable mt-5 rounded-pill bg-marque-bouton px-5 py-3 text-sm font-semibold text-surMarque shadow-bouton">
          Réessayer
        </button>
      </section>
    </main>
  );
}
