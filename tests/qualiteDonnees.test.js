import { describe, expect, it } from "vitest";
import { analyserQualiteDonnees } from "@/lib/qualiteDonnees";

const categories = { courses: { label: "Courses" }, autre: { label: "Autre" }, virement: { label: "Virement" } };

describe("Qualité des données", () => {
  it("signale les libellés et catégories à compléter sans compter un virement", () => {
    const bilan = analyserQualiteDonnees([
      { id: "a", compteId: "c", date: "2026-08-01", montant: -12, libelle: "Import CSV", categorie: "autre" },
      { id: "b", compteId: "c", date: "2026-08-01", montant: -12, libelle: "Import CSV", categorie: "autre" },
      { id: "c", compteId: "c", date: "2026-08-01", montant: -12, libelle: "Épargne", categorie: "virement", versId: "e" },
    ], categories);
    expect(bilan.sansCategorie).toHaveLength(2);
    expect(bilan.sansLibelle).toHaveLength(2);
    expect(bilan.doublons).toHaveLength(1);
  });
});
