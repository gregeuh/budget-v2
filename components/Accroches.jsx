"use client";

import { useEffect, useState } from "react";
import { useBudget } from "@/lib/store";
import { statsMois } from "@/lib/conseils";
import { moisDecaleLocal } from "@/lib/format";
import BanniereConfig from "./BanniereConfig";
import BilanMensuel from "./BilanMensuel";
import ProjectionIA from "./ProjectionIA";

/**
 * Une seule accroche à la fois, par ordre de priorité :
 *   1. Configuration incomplète (le plus actionnable)
 *   2. Bilan du mois écoulé (rendez-vous ponctuel)
 *   3. Projection intelligente (le quotidien)
 * Évite d'empiler trois cartes qui se concurrencent sur l'accueil.
 */
export default function Accroches() {
  const { comptes, profil, recurrentes, transactions } = useBudget();
  // localStorage n'existe pas au rendu serveur : on attend le montage.
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  if (!monte) return null;

  const lire = (cle) => {
    try {
      return localStorage.getItem(cle);
    } catch {
      return null;
    }
  };

  // 1. Configuration
  const aSalaireRecurrent = recurrentes.some((r) => r.actif !== false && r.montant > 0);
  const aRevenuDeclare = (profil.revenuMensuel || 0) > 0;
  const aChargesFixes = recurrentes.some((r) => r.actif !== false && r.montant < 0);
  const configIncomplete = comptes.length > 0 && !(aSalaireRecurrent && aRevenuDeclare && aChargesFixes);
  const configMasquee = lire("config-masquee") === "1";

  if (configIncomplete && !configMasquee) return <BanniereConfig />;

  // 2. Bilan du mois écoulé — visible seulement en début de mois (comme dans BilanMensuel)
  const moisPrec = moisDecaleLocal(-1);
  const jourDuMois = new Date().getDate();
  const s = statsMois(transactions, moisPrec);
  const bilanDispo = jourDuMois <= 10 && (s.revenus > 0 || s.depenses > 0);
  const bilanFerme = lire("bilan-ferme") === moisPrec;

  if (bilanDispo && !bilanFerme) return <BilanMensuel />;

  // 3. Projection intelligente
  return <ProjectionIA />;
}
