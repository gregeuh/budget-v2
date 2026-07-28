"use client";

import { useState } from "react";
import { devinerDomaine, urlLogo } from "@/lib/logos";

/**
 * Affiche le vrai logo d'un commerçant si on le trouve, sinon une pastille
 * colorée avec son initiale. Si le logo échoue au chargement (domaine deviné
 * mais inexistant), on bascule automatiquement sur l'initiale : aucun trou.
 */
export default function LogoCommercant({ nom = "", couleur = "var(--marque)", taille = 36 }) {
  const domaine = devinerDomaine(nom);
  const [echec, setEchec] = useState(false);
  const initiale = (nom || "?").trim().charAt(0).toUpperCase();
  const rayon = Math.round(taille * 0.28);

  // Repli : pastille colorée à initiale
  if (!domaine || echec) {
    return (
      <span
        className="flex shrink-0 items-center justify-center font-bold text-white"
        style={{ width: taille, height: taille, borderRadius: rayon, background: couleur, fontSize: taille * 0.42 }}
      >
        {initiale}
      </span>
    );
  }

  // Vrai logo, sur fond blanc pour les logos transparents
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden border border-bordure bg-white"
      style={{ width: taille, height: taille, borderRadius: rayon }}
    >
      <img
        src={urlLogo(domaine, taille * 2)}
        alt=""
        width={taille}
        height={taille}
        loading="lazy"
        onError={() => setEchec(true)}
        style={{ width: "82%", height: "82%", objectFit: "contain" }}
      />
    </span>
  );
}
