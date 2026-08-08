import { describe, expect, it } from "vitest";
import { appliquerReglesAuto } from "@/lib/reglesAuto";

describe("Règles automatiques", () => {
  it("applique la correction la plus récente à un libellé bancaire", () => {
    const categories = { courses: {}, transport: {} };
    const resultat = appliquerReglesAuto("CB UBER TRIP PARIS", [
      { mot: "uber", categorie: "courses", icone: "🛒" },
      { mot: "uber", categorie: "transport", icone: "🚕" },
    ], categories);
    expect(resultat).toEqual({ categorie: "transport", icone: "🚕", nom: "uber" });
  });
});
