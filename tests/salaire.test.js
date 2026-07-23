import { describe, it, expect } from "vitest";
import { dernierJourOuvre, premierJourOuvre, estOuvre, feries, dateDePaie } from "@/lib/joursOuvres";
import { prochaineDateSalaire, prochaineOccurrence, salaireConfigure } from "@/lib/format";

/*
 * Salaires sans date fixe : « dernier jour ouvré du mois » change chaque mois
 * et dépend des week-ends et des jours fériés français.
 */

const jour = (d) => d.getDate();
const mois = (d) => d.getMonth();

describe("Jours fériés français", () => {
  it("connaît les fériés à date fixe", () => {
    for (const d of [new Date(2026, 0, 1), new Date(2026, 4, 1), new Date(2026, 4, 8),
                     new Date(2026, 6, 14), new Date(2026, 7, 15), new Date(2026, 10, 1),
                     new Date(2026, 10, 11), new Date(2026, 11, 25)]) {
      expect(estOuvre(d)).toBe(false);
    }
  });

  it("calcule les fériés mobiles liés à Pâques", () => {
    // Pâques 2026 : dimanche 5 avril → lundi de Pâques le 6
    expect(estOuvre(new Date(2026, 3, 6))).toBe(false);
    // Ascension 2026 : jeudi 14 mai
    expect(estOuvre(new Date(2026, 4, 14))).toBe(false);
    // Lundi de Pentecôte 2026 : 25 mai
    expect(estOuvre(new Date(2026, 4, 25))).toBe(false);
  });

  it("en compte onze par an", () => {
    for (const a of [2025, 2026, 2027]) expect(feries(a).size).toBe(11);
  });

  it("place correctement Pâques sur plusieurs années", () => {
    // Lundi de Pâques : 2025 → 21 avril, 2027 → 29 mars
    expect(estOuvre(new Date(2025, 3, 21))).toBe(false);
    expect(estOuvre(new Date(2027, 2, 29))).toBe(false);
  });
});

describe("Dernier jour ouvré du mois", () => {
  it("recule quand le mois finit un week-end", () => {
    // 31 mai 2026 = dimanche → vendredi 29
    expect(jour(dernierJourOuvre(2026, 4))).toBe(29);
    // 31 janvier 2026 = samedi → vendredi 30
    expect(jour(dernierJourOuvre(2026, 0))).toBe(30);
    // 28 février 2026 = samedi → vendredi 27
    expect(jour(dernierJourOuvre(2026, 1))).toBe(27);
  });

  it("garde le dernier jour quand il est ouvré", () => {
    // 31 juillet 2026 = vendredi
    expect(jour(dernierJourOuvre(2026, 6))).toBe(31);
    // 31 août 2026 = lundi
    expect(jour(dernierJourOuvre(2026, 7))).toBe(31);
    // 30 juin 2026 = mardi (correspond au vrai salaire du relevé)
    expect(jour(dernierJourOuvre(2026, 5))).toBe(30);
  });

  it("reste toujours dans le mois demandé", () => {
    for (let m = 0; m < 12; m++) {
      const d = dernierJourOuvre(2026, m);
      expect(mois(d)).toBe(m);
      expect(estOuvre(d)).toBe(true);
    }
  });
});

describe("Premier jour ouvré du mois", () => {
  it("saute le 1er janvier férié", () => {
    // 1er janvier 2026 = jeudi mais férié → vendredi 2
    expect(jour(premierJourOuvre(2026, 0))).toBe(2);
  });

  it("saute un week-end de début de mois", () => {
    // 1er août 2026 = samedi → lundi 3
    expect(jour(premierJourOuvre(2026, 7))).toBe(3);
  });

  it("tombe toujours un jour ouvré", () => {
    for (let m = 0; m < 12; m++) expect(estOuvre(premierJourOuvre(2026, m))).toBe(true);
  });
});

describe("Modes de date de paie", () => {
  it("respecte un jour fixe", () => {
    expect(jour(dateDePaie(2026, 6, "jour", 5))).toBe(5);
  });

  it("borne un jour trop grand à la fin du mois", () => {
    // Le 31 en février doit retomber sur le 28
    expect(jour(dateDePaie(2026, 1, "jour", 31))).toBe(28);
  });

  it("recule un jour fixe tombant un week-end", () => {
    // 2 août 2026 = dimanche → vendredi 31 juillet
    const d = dateDePaie(2026, 7, "ouvrePrecedent", 2);
    expect(estOuvre(d)).toBe(true);
    expect(d <= new Date(2026, 7, 2)).toBe(true);
  });

  it("distingue dernier jour ouvré et dernier jour calendaire", () => {
    expect(jour(dateDePaie(2026, 4, "dernierJour"))).toBe(31);
    expect(jour(dateDePaie(2026, 4, "dernierOuvre"))).toBe(29);
  });
});

describe("Prochaine date de salaire", () => {
  it("renvoie une date valide pour chaque mode", () => {
    for (const [mode, j] of [["jour", 2], ["ouvrePrecedent", 2], ["dernierOuvre", 0],
                             ["premierOuvre", 0], ["dernierJour", 0]]) {
      expect(prochaineDateSalaire(j, mode)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("n'exige pas de numéro de jour pour les modes sans date fixe", () => {
    expect(prochaineDateSalaire(0, "dernierOuvre")).toBeTruthy();
    expect(prochaineDateSalaire(0, "premierOuvre")).toBeTruthy();
    // Alors qu'un jour fixe sans numéro n'a pas de sens
    expect(prochaineDateSalaire(0, "jour")).toBeNull();
  });

  it("reste compatible avec l'ancien appel à un seul argument", () => {
    expect(prochaineDateSalaire(2)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(prochaineDateSalaire(0)).toBeNull();
  });

  it("ne renvoie jamais une date passée", () => {
    const auj = new Date();
    const ajd = `${auj.getFullYear()}-${String(auj.getMonth() + 1).padStart(2, "0")}-${String(auj.getDate()).padStart(2, "0")}`;
    for (const mode of ["jour", "dernierOuvre", "premierOuvre", "dernierJour"]) {
      const iso = prochaineDateSalaire(15, mode);
      if (iso) expect(iso >= ajd).toBe(true);
    }
  });
});

describe("Récurrence suivant une règle", () => {
  it("recalcule chaque mois au lieu de figer le numéro du jour", () => {
    // Un salaire au dernier jour ouvré ne doit pas rester bloqué sur « le 30 »
    let d = "2026-06-30";
    const suite = [];
    for (let i = 0; i < 4; i++) {
      d = prochaineOccurrence(d, "mensuelle", { mode: "dernierOuvre" });
      suite.push(d);
    }
    expect(suite).toEqual(["2026-07-31", "2026-08-31", "2026-09-30", "2026-10-30"]);
  });

  it("laisse les récurrences ordinaires inchangées", () => {
    expect(prochaineOccurrence("2026-07-15", "mensuelle")).toBe("2026-08-15");
    expect(prochaineOccurrence("2026-07-15", "mensuelle", { mode: "jour" })).toBe("2026-08-15");
  });
});

describe("Salaire renseigné", () => {
  it("accepte un jour fixe valide", () => {
    expect(salaireConfigure({ jourSalaire: 2 })).toBe(true);
    expect(salaireConfigure({ jourSalaire: 0 })).toBe(false);
  });

  it("accepte les modes sans date fixe même sans numéro", () => {
    expect(salaireConfigure({ modeSalaire: "dernierOuvre" })).toBe(true);
    expect(salaireConfigure({ modeSalaire: "premierOuvre", jourSalaire: 0 })).toBe(true);
  });

  it("reste faux sur un profil vide", () => {
    expect(salaireConfigure({})).toBe(false);
    expect(salaireConfigure()).toBe(false);
  });
});
