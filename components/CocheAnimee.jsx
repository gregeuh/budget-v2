"use client";

export default function CocheAnimee({ taille = 56, couleur = "var(--menthe)" }) {
  return (
    <span className="coche-halo inline-flex items-center justify-center rounded-full" style={{ width: taille, height: taille, background: couleur + "22" }}>
      <svg viewBox="0 0 24 24" width={taille * 0.6} height={taille * 0.6} fill="none" aria-hidden="true">
        <path
          d="M4 12.5l5 5L20 6.5"
          stroke={couleur}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="coche-trace"
        />
      </svg>
    </span>
  );
}
