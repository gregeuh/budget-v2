"use client";

/**
 * Silhouette de l'accueil affichée pendant le chargement.
 * Une forme reconnaissable donne une impression de rapidité bien plus
 * qu'un écran vide, même à durée de chargement identique.
 */

const Bloc = ({ className = "" }) => (
  <div className={`rounded-ios bg-voile ${className}`} />
);

export default function SqueletteAccueil() {
  return (
    <div
      className="mx-auto min-h-dvh max-w-md px-4 pt-3"
      style={{ paddingTop: "var(--safe-top)" }}
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      <div className="pulse-doux space-y-6">
        {/* En-tête : salutation et patrimoine */}
        <div className="space-y-2 pt-3">
          <Bloc className="h-4 w-40" />
          <Bloc className="h-9 w-52" />
        </div>

        {/* Barre de recherche */}
        <Bloc className="h-11 w-full rounded-pill" />

        {/* Cartes de comptes */}
        <div className="space-y-2">
          <Bloc className="h-3 w-24" />
          <div className="flex gap-3 overflow-hidden">
            <Bloc className="h-28 w-44 shrink-0" />
            <Bloc className="h-28 w-44 shrink-0" />
          </div>
        </div>

        {/* Sélecteur de mois */}
        <Bloc className="h-20 w-full" />

        {/* Reste à vivre */}
        <Bloc className="h-12 w-full" />

        {/* Analyses */}
        <Bloc className="h-16 w-full" />

        {/* Dernières opérations */}
        <div className="space-y-2">
          <Bloc className="h-3 w-32" />
          <Bloc className="h-14 w-full" />
          <Bloc className="h-14 w-full" />
          <Bloc className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
