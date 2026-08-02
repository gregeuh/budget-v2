export default function EtatVide({
  icone = "✨",
  titre,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div className={`rounded-v3-m border border-dashed border-ui-hairline bg-ui-surface-floating text-center shadow-v3-soft ${compact ? "px-4 py-5" : "px-5 py-7"}`}>
      <span aria-hidden="true" className={`mx-auto flex items-center justify-center rounded-full bg-marque-pale ${compact ? "mb-2 h-10 w-10 text-lg" : "mb-3 h-12 w-12 text-2xl"}`}>
        {icone}
      </span>
      <h3 className="text-sm font-semibold text-ui-text-primary">{titre}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-5 text-ui-text-secondary">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="tappable mt-4 rounded-pill bg-marque-bouton px-4 py-2.5 text-sm font-semibold text-surMarque shadow-bouton">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
