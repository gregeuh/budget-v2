"use client";

import { lienCarte } from "@/lib/lieux";

/**
 * Vignette de lieu façon Apple Wallet : pas de tuiles OpenStreetMap (rendu daté),
 * mais un fond épuré dessiné en SVG, aux couleurs de l'app, avec un pin.
 *
 * Les « rues » sont décoratives (dérivées des coordonnées pour être stables
 * d'un lieu à l'autre), pas une vraie cartographie — le but est une jolie
 * confirmation visuelle, et le bouton ouvre la vraie carte en grand.
 */
export default function MiniCarte({ lat, lon, nom = "", adresse = "" }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  // Graine déterministe tirée des coordonnées : mêmes rues pour un même lieu.
  const graine = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453);
  const frac = (n) => n - Math.floor(n);
  const r = (i) => frac(graine * (i + 1) * 1.618);

  // Quelques routes horizontales/verticales décalées pseudo-aléatoirement
  const vLines = [0, 1, 2].map((i) => 40 + i * 90 + r(i) * 40);
  const hLines = [0, 1].map((i) => 60 + i * 80 + r(i + 5) * 30);
  const diagonale = 30 + r(9) * 40;

  return (
    <a
      href={lienCarte(lat, lon, nom)}
      target="_blank"
      rel="noopener noreferrer"
      className="tappable relative mt-2 block overflow-hidden rounded-ios border border-bordure"
      aria-label={`Ouvrir ${nom || "le lieu"} sur la carte`}
    >
      <svg viewBox="0 0 320 130" className="block h-32 w-full" preserveAspectRatio="xMidYMid slice">
        {/* Fond façon plan iOS */}
        <rect width="320" height="130" fill="var(--c-voile)" />

        {/* Bloc "parc" doux */}
        <rect
          x={200 + r(3) * 40}
          y={10 + r(4) * 30}
          width="90"
          height="70"
          rx="10"
          fill="var(--menthe-pale)"
        />

        {/* Rues */}
        <g stroke="var(--c-carte)" strokeWidth="7" strokeLinecap="round">
          {vLines.map((x, i) => (
            <line key={`v${i}`} x1={x} y1="-5" x2={x - 12} y2="135" />
          ))}
          {hLines.map((y, i) => (
            <line key={`h${i}`} x1="-5" y1={y} x2="325" y2={y + 6} />
          ))}
          <line x1="-5" y1={diagonale} x2="180" y2={diagonale + 90} />
        </g>

        {/* Fines lignes centrales sur les rues, pour le détail */}
        <g stroke="var(--c-bordure)" strokeWidth="1.5" strokeDasharray="6 6">
          {hLines.map((y, i) => (
            <line key={`hd${i}`} x1="0" y1={y} x2="320" y2={y + 6} />
          ))}
        </g>

        {/* Pin au centre, à la couleur d'accent */}
        <g transform="translate(160, 58)">
          <ellipse cx="0" cy="34" rx="9" ry="3" fill="rgba(0,0,0,0.15)" />
          <path
            d="M0 34 C0 34 -13 14 -13 4 A13 13 0 1 1 13 4 C13 14 0 34 0 34 Z"
            fill="var(--marque)"
          />
          <circle cx="0" cy="1" r="5" fill="var(--c-carte)" />
        </g>
      </svg>

      {/* Bandeau nom + action */}
      <div className="flex items-center justify-between gap-2 bg-carte px-3 py-2">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{nom || "Lieu enregistré"}</span>
          {adresse && <span className="block truncate text-xs text-sourdine">{adresse}</span>}
        </span>
        <span className="shrink-0 text-sm font-semibold text-marque-texte">Ouvrir ›</span>
      </div>
    </a>
  );
}
