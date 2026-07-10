"use client";

export default function Sheet({ titre, onFermer, children }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-md">
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onFermer} />
      <div
        className="sheet-in absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[22px] bg-fond px-4 pt-3"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-voile" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titre}</h2>
          <button onClick={onFermer} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full bg-voile text-sourdine">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
