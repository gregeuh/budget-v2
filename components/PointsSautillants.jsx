"use client";

export default function PointsSautillants({ taille = 10, couleur = "#2BB68C" }) {
  return (
    <span className="inline-flex items-end gap-1.5" role="status" aria-label="Chargement">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="point-saute rounded-full"
          style={{ width: taille, height: taille, background: couleur, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
