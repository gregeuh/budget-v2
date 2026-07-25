"use client";

import { euros } from "@/lib/format";

/**
 * Affiche un montant avec une hiérarchie typographique :
 * le nombre principal domine, les centimes et le symbole € reculent d'un cran.
 * C'est ce qui donne aux montants un air « produit fini » plutôt que du texte brut.
 *
 * Usage : <Montant valeur={1234.56} /> pour les montants proéminents.
 * Pour le texte courant, continuer d'utiliser euros() directement.
 */
export default function Montant({ valeur, precis = true, className = "" }) {
  const texte = euros(valeur, precis ? { precis: true } : {});

  // Sépare la partie entière (avec le signe et les espaces) des décimales + €.
  // Format fr-FR : "1 234,56 €" ou "1 234 €" (sans décimales au-delà de 1000).
  const match = texte.match(/^(-?[\d\s ]+)(,\d+)?(\s*€)$/);

  if (!match) {
    return <span className={`chiffres ${className}`} aria-label={texte}>{texte}</span>;
  }

  const [, entier, decimales, symbole] = match;

  return (
    <span className={`chiffres ${className}`} aria-label={texte}>
      {entier.trim()}
      {decimales && <span className="unite">{decimales}</span>}
      <span className="unite">{symbole}</span>
    </span>
  );
}
