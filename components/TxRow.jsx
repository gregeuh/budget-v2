"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useBudget } from "@/lib/store";
import { euros, dateCourte } from "@/lib/format";
import LogoCommercant from "./LogoCommercant";

// Le formulaire complet d'édition (cartes, catégories, lieu et icônes) ne
// doit pas retarder l'affichage de la liste sur un réseau mobile.
const EditTxSheet = dynamic(() => import("./EditTxSheet"), { ssr: false });

const LARGEUR_ACTION = 88;   // largeur du bouton Supprimer révélé
const SEUIL_OUVERTURE = 44;  // au-delà, la ligne reste ouverte au relâchement
const SEUIL_TAP = 6;         // en deçà, c'est un tap, pas un glissement

export default function TxRow({ tx, avecCompte = false, retard = 0 }) {
  const { comptes, categories, supprimerTransaction } = useBudget();
  const [edition, setEdition] = useState(false);
  const [decalage, setDecalage] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const depart = useRef(null);

  const cat = categories[tx.categorie] || categories.autre;
  const compte = comptes.find((c) => c.id === tx.compteId);
  const versCompte = tx.versId ? comptes.find((c) => c.id === tx.versId) : null;
  const estVirement = Boolean(tx.versId);
  const positif = tx.montant > 0;

  const surDebut = (e) => {
    const t = e.touches[0];
    depart.current = { x: t.clientX, y: t.clientY, base: decalage, horizontal: null };
    setGlisse(true);
  };

  const surMouvement = (e) => {
    if (!depart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - depart.current.x;
    const dy = t.clientY - depart.current.y;

    // Détermine une seule fois si le geste est horizontal (sinon on laisse défiler la page)
    if (depart.current.horizontal === null) {
      if (Math.abs(dx) < SEUIL_TAP && Math.abs(dy) < SEUIL_TAP) return;
      depart.current.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!depart.current.horizontal) return;

    let d = depart.current.base + dx;
    d = Math.min(0, d);                                  // pas de glissement vers la droite
    if (d < -LARGEUR_ACTION) d = -LARGEUR_ACTION + (d + LARGEUR_ACTION) * 0.25; // résistance élastique
    setDecalage(d);
  };

  const surFin = () => {
    setGlisse(false);
    if (depart.current?.horizontal) {
      setDecalage(decalage < -SEUIL_OUVERTURE ? -LARGEUR_ACTION : 0);
    }
    depart.current = null;
  };

  const ouvrirEdition = () => {
    if (decalage !== 0) return setDecalage(0); // une ligne ouverte se referme au tap
    setEdition(true);
  };

  return (
    <>
      <li
        className="pop-in relative overflow-hidden rounded-2xl"
        style={{ animationDelay: `${Math.min(retard, 8) * 50}ms` }}
      >
        {/* Action révélée par le glissement */}
        <button
          onClick={() => { supprimerTransaction(tx.id); setDecalage(0); }}
          aria-label="Supprimer l'opération"
          className="absolute inset-y-0 right-0 flex min-h-11 items-center justify-center bg-corail-bouton text-xs font-bold text-white"
          style={{ width: LARGEUR_ACTION }}
        >
          🗑️ Supprimer
        </button>

        {/* Contenu glissant */}
        <div
          onTouchStart={surDebut}
          onTouchMove={surMouvement}
          onTouchEnd={surFin}
          onClick={ouvrirEdition}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              ouvrirEdition();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Modifier l'opération ${tx.libelle || cat.label} de ${euros(tx.montant, { precis: true })}`}
          className="tappable relative flex min-h-[72px] cursor-pointer items-center gap-3 rounded-[22px] border border-ui-hairline bg-ui-surface-floating px-3.5 py-3 shadow-v3-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marque focus-visible:ring-offset-2"
          style={{
            transform: `translateX(${decalage}px)`,
            transition: glisse ? "none" : "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <LogoCommercant nom={tx.libelle || ""} emoji={tx.icone || cat.icone} iconePersonnalisee={Boolean(tx.icone)} taille={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {tx.libelle || cat.label}
              {tx.horsSolde && <span className="ml-1.5 rounded-pill bg-voile px-1.5 py-0.5 align-middle text-[10px] font-medium text-sourdine">👻 hors solde</span>}
            </span>
            <span className="block text-xs text-sourdine">
              {dateCourte(tx.date)}
              {estVirement
                ? ` · ${compte?.nom || "?"} → ${versCompte?.nom || "?"}`
                : avecCompte && compte ? ` · ${compte.nom}` : ""}
              {tx.lieu && ` · 📍 ${tx.lieu}`}
            </span>
          </span>
          <span className={`tnum shrink-0 text-sm font-bold ${cat.type === "virement" ? "text-sourdine" : positif ? "text-menthe-texte" : "text-corail"}`}>
            {estVirement ? "⇄ " : positif ? "+" : ""}{euros(estVirement ? Math.abs(tx.montant) : tx.montant, { precis: true })}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEdition(true); }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`Actions pour ${tx.libelle || cat.label}`}
            className="tappable -mr-1 flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-lg text-sourdine hover:bg-voile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marque"
          >
            ⋯
          </button>
        </div>
      </li>
      {edition && <EditTxSheet tx={tx} onFermer={() => setEdition(false)} />}
    </>
  );
}
