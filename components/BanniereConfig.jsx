"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import AssistantConfig from "./AssistantConfig";

export default function BanniereConfig() {
  const { comptes, transactions, recurrentes, profil } = useBudget();
  const [ouvert, setOuvert] = useState(false);
  const [masque, setMasque] = useState(() => {
    try { return localStorage.getItem("config-masquee") === "1"; } catch { return false; }
  });

  // Rien à proposer tant qu'il n'y a pas de compte
  if (comptes.length === 0) return null;

  const aSalaireRecurrent = recurrentes.some((r) => r.actif !== false && r.montant > 0);
  const aRevenuDeclare = (profil.revenuMensuel || 0) > 0;
  const aChargesFixes = recurrentes.some((r) => r.actif !== false && r.montant < 0);

  // Configuration complète : rien à afficher
  if (aSalaireRecurrent && aRevenuDeclare && aChargesFixes) return null;
  if (masque && !ouvert) return null;

  const manque = !aSalaireRecurrent && !aRevenuDeclare
    ? "Ton salaire n'est pas configuré"
    : !aSalaireRecurrent
    ? "Ton salaire ne s'ajoute pas automatiquement"
    : "Tes charges fixes ne sont pas renseignées";

  const fermer = () => {
    setMasque(true);
    try { localStorage.setItem("config-masquee", "1"); } catch {}
  };

  return (
    <>
      <div className="pop-in relative overflow-hidden rounded-ios bg-carte p-3.5 shadow-carte ring-1 ring-menthe/30">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-menthe-pale text-lg">💼</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{manque}</p>
            <p className="mt-0.5 text-xs text-sourdine">
              Sans ça, ton reste à vivre, ton score et tes bilans sont faussés. 2 minutes suffisent.
            </p>
            <button
              onClick={() => setOuvert(true)}
              className="mt-2.5 rounded-pill bg-encre px-3.5 py-1.5 text-xs font-semibold text-contraste active:scale-95 transition-transform"
            >
              Configurer maintenant →
            </button>
          </div>
          <button onClick={fermer} aria-label="Masquer" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sourdine/50">
            ✕
          </button>
        </div>
      </div>

      {ouvert && <AssistantConfig onFermer={() => setOuvert(false)} />}
    </>
  );
}
