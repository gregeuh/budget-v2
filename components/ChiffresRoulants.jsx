"use client";

import { useEffect, useState } from "react";
import { euros } from "@/lib/format";

function Roulette({ chiffre, delai }) {
  return (
    <span className="roulette">
      <span
        className="roulette-bande"
        style={{ transform: `translateY(-${chiffre}em)`, transitionDelay: `${delai}ms` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  );
}

// Affiche un montant en euros avec des chiffres qui roulent façon odomètre.
export default function ChiffresRoulants({ valeur }) {
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    // Départ à 0 puis roulement vers la vraie valeur au montage ; suit ensuite les mises à jour
    const t = setTimeout(() => setAffiche(valeur), 60);
    return () => clearTimeout(t);
  }, [valeur]);

  const texte = euros(affiche);
  let indexChiffre = 0;
  return (
    <span className="tnum leading-none" aria-label={euros(valeur)}>
      {texte.split("").map((c, i) =>
        /\d/.test(c) ? (
          <Roulette key={`d${i}`} chiffre={Number(c)} delai={indexChiffre++ * 60} />
        ) : (
          <span key={`s${i}`}>{c}</span>
        )
      )}
    </span>
  );
}
