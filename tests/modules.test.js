import { describe, it, expect } from "vitest";
import { rapprocher, impactSolde } from "@/lib/rapprochement";
import { statsMois, detecterAbonnements } from "@/lib/conseils";
import { analyserDepenses } from "@/lib/depenses";
import { calculerScore } from "@/lib/score";

/*
 * Modules qui n'avaient aucune couverture.
 * Le rapprochement est le plus sensible : une erreur y crée des doublons
 * ou fait disparaître des opérations.
 */

describe("Rapprochement bancaire", () => {
  const existantes = [
    { id: "a", compteId: "cc", montant: -28, libelle: "La Cave", date: "2026-07-09" },
    { id: "b", compteId: "cc", montant: -15.15, libelle: "Carrefour", date: "2026-07-07" },
    { id: "z", compteId: "autre", montant: -28, libelle: "La Cave", date: "2026-07-09" },
  ];

  it("reconnaît une opération déjà saisie à la main", () => {
    const l = [{ montant: -28, libelle: "SumUp La Cave", date: "2026-07-09" }];
    const r = rapprocher(l, existantes, "cc")[0];
    expect(r.statut).toBe("probable");
    expect(r.choix.action).toBe("fusionner");
    expect(r.choix.txId).toBe("a");
  });

  it("tolère quelques jours d'écart entre saisie et débit", () => {
    const l = [{ montant: -28, libelle: "La Cave", date: "2026-07-11" }];
    expect(rapprocher(l, existantes, "cc")[0].statut).toBe("probable");
  });

  it("ne rapproche jamais une opération d'un autre compte", () => {
    // Le doublon "z" est sur un autre compte : il ne doit pas être proposé.
    const l = [{ montant: -28, libelle: "La Cave", date: "2026-07-09" }];
    const r = rapprocher(l, existantes, "cc")[0];
    expect(r.candidats.every((c) => c.tx.compteId === "cc")).toBe(true);
  });

  it("n'utilise pas deux fois la même opération existante", () => {
    // Deux passages au même endroit le même jour ne doivent pas se rapprocher
    // tous les deux de l'unique opération déjà saisie.
    const l = [
      { montant: -28, libelle: "La Cave", date: "2026-07-09" },
      { montant: -28, libelle: "La Cave", date: "2026-07-09" },
    ];
    const r = rapprocher(l, existantes, "cc");
    expect(r[0].statut).toBe("probable");
    expect(r[1].choix.txId).not.toBe(r[0].choix.txId);
  });

  it("classe en nouvelle ce qui ne ressemble à rien de connu", () => {
    const l = [{ montant: -412.9, libelle: "Zzzz Inconnu", date: "2026-07-15" }];
    const r = rapprocher(l, existantes, "cc")[0];
    expect(r.statut).toBe("nouvelle");
    expect(r.choix.action).toBe("ajouter");
  });

  it("repère une ligne déjà importée pour ne pas la remettre", () => {
    const dejaLa = [{ id: "i", compteId: "cc", montant: -9.9, libelle: "Deliveroo", date: "2026-07-12", importe: true }];
    const l = [{ montant: -9.9, libelle: "Deliveroo", date: "2026-07-12" }];
    const r = rapprocher(l, dejaLa, "cc")[0];
    expect(r.statut).toBe("importee");
    expect(r.choix.action).toBe("ignorer");
  });

  it("ne compte dans le solde que les lignes réellement ajoutées", () => {
    const decisions = [
      { ligne: { montant: -50 }, choix: { action: "ajouter" } },
      { ligne: { montant: -28 }, choix: { action: "fusionner" } }, // existe déjà
      { ligne: { montant: -12 }, choix: { action: "ignorer" } },
      { ligne: { montant: -30.5 }, choix: { action: "ajouter" } },
    ];
    expect(impactSolde(decisions)).toBe(-80.5);
  });
});

describe("Statistiques du mois", () => {
  const txs = [
    { montant: 2253.94, categorie: "salaire", date: "2026-07-02", compteId: "cc" },
    { montant: -80, categorie: "courses", date: "2026-07-08", compteId: "cc" },
    { montant: -28, categorie: "resto", date: "2026-07-09", compteId: "cc" },
    { montant: -500, categorie: "epargne", date: "2026-07-10", compteId: "cc", versId: "la" },
    { montant: -999, categorie: "courses", date: "2026-06-08", compteId: "cc" }, // autre mois
  ];

  it("sépare correctement entrées et sorties", () => {
    const s = statsMois(txs, "2026-07");
    expect(s.revenus).toBe(2253.94);
    expect(s.depenses).toBe(108);
  });

  it("ignore les mois voisins", () => {
    expect(statsMois(txs, "2026-06").depenses).toBe(999);
  });

  it("exclut les virements des dépenses", () => {
    // Un virement vers l'épargne n'est pas une dépense : l'argent reste à soi.
    expect(statsMois(txs, "2026-07").depenses).not.toContain(500);
    expect(statsMois(txs, "2026-07").depenses).toBe(108);
  });

  it("ne plante pas sur un mois vide", () => {
    const s = statsMois(txs, "2020-01");
    expect(s.revenus).toBe(0);
    expect(s.depenses).toBe(0);
  });
});

describe("Chasse aux dépenses", () => {
  const recurrentes = [
    { id: "1", libelle: "Netflix", montant: -19.99, actif: true, categorie: "abonnements" },
    { id: "2", libelle: "Disney+", montant: -11.99, actif: true, categorie: "abonnements" },
    { id: "3", libelle: "Spotify", montant: -10.99, actif: true, categorie: "abonnements" },
    { id: "4", libelle: "Loyer", montant: -746.95, actif: true, categorie: "logement" },
    { id: "5", libelle: "Ancien abo", montant: -9.99, actif: false, categorie: "abonnements" },
  ];

  const a = analyserDepenses([], recurrentes);

  it("repère les abonnements parmi les charges", () => {
    expect(a.abonnements.map((x) => x.libelle)).toEqual(
      expect.arrayContaining(["Netflix", "Disney+", "Spotify"])
    );
  });

  it("ignore les charges mises en pause", () => {
    expect(a.items.some((i) => i.libelle === "Ancien abo")).toBe(false);
  });

  it("détecte les doublons de même nature", () => {
    const streaming = a.doublons.find((d) => d.items.length >= 3);
    expect(streaming).toBeTruthy();
  });

  it("chiffre l'économie possible sans compter le loyer", () => {
    expect(a.economieMax).toBeGreaterThan(0);
    expect(a.economieMax).toBeLessThan(746.95 * 12);
  });

  it("calcule un coût annuel cohérent", () => {
    expect(a.totalAnnuel).toBe(a.totalMensuel * 12);
  });
});

describe("Score de santé", () => {
  const base = {
    comptes: [{ id: "cc", type: "courant" }, { id: "la", type: "livretA" }],
    soldes: { cc: 800, la: 6000 },
    transactions: [
      { montant: 2253.94, categorie: "salaire", date: "2026-07-02", compteId: "cc" },
      { montant: -400, categorie: "courses", date: "2026-07-08", compteId: "cc" },
    ],
    budgets: {},
    credits: [],
    recurrentes: [],
    profil: { revenuMensuel: 2253.94, jourSalaire: 2 },
  };

  it("reste dans les bornes 0-100", () => {
    const s = calculerScore(base);
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.total).toBeLessThanOrEqual(100);
  });

  it("note chaque pilier sur 20", () => {
    for (const p of calculerScore(base).piliers) {
      expect(p.points).toBeGreaterThanOrEqual(0);
      expect(p.points).toBeLessThanOrEqual(20);
    }
  });

  it("ne plante pas sur une app vierge", () => {
    const vide = { comptes: [], soldes: {}, transactions: [], budgets: {}, credits: [], recurrentes: [], profil: {} };
    const s = calculerScore(vide);
    expect(Number.isFinite(s.total)).toBe(true);
  });

  it("récompense une meilleure situation", () => {
    const fragile = { ...base, soldes: { cc: 40, la: 0 } };
    expect(calculerScore(base).total).toBeGreaterThan(calculerScore(fragile).total);
  });
});

describe("Détection d'abonnements", () => {
  it("repère un prélèvement mensuel régulier", () => {
    const txs = [
      { montant: -19.99, libelle: "Netflix", categorie: "abonnements", date: "2026-05-06" },
      { montant: -19.99, libelle: "Netflix", categorie: "abonnements", date: "2026-06-06" },
      { montant: -19.99, libelle: "Netflix", categorie: "abonnements", date: "2026-07-06" },
    ];
    expect(detecterAbonnements(txs).length).toBeGreaterThan(0);
  });
});
