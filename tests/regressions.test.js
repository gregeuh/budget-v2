import { describe, it, expect } from "vitest";
import { calculerSoldes } from "@/lib/soldes";
import { detecterRecurrences } from "@/lib/detection";
import { nettoyerLibelle } from "@/lib/libelles";
import { construireMemoire, devinerDepuisHistorique, proposerLibelles, lieuxConnus } from "@/lib/habitudes";
import { devinerCategorieComplet } from "@/lib/categorisation";
import { rechercher } from "@/lib/recherche";
import { calculerProjection } from "@/lib/projection";
import { isoLocal, cleMoisLocal, moisDecaleLocal } from "@/lib/format";
import { analyserCSV } from "@/lib/csv";

/*
 * Ces tests reproduisent des bugs qui ont RÉELLEMENT eu lieu.
 * Ils existent pour qu'aucun ne revienne sans qu'on le sache.
 */

describe("Soldes", () => {
  const comptes = [{ id: "cc", soldeInitial: 1000 }, { id: "la", soldeInitial: 500 }];

  it("n'inclut pas les opérations datées dans le futur", () => {
    const txs = [
      { compteId: "cc", montant: -100, date: "2026-07-10" },
      { compteId: "cc", montant: -500, date: "2027-01-01" }, // futur
    ];
    expect(calculerSoldes(comptes, txs, "2026-07-21").cc).toBe(900);
  });

  it("ignore les opérations marquées hors solde", () => {
    const txs = [{ compteId: "cc", montant: -100, date: "2026-07-10", horsSolde: true }];
    expect(calculerSoldes(comptes, txs, "2026-07-21").cc).toBe(1000);
  });

  it("applique un virement aux deux comptes", () => {
    const txs = [{ compteId: "cc", versId: "la", montant: 200, date: "2026-07-10" }];
    const s = calculerSoldes(comptes, txs, "2026-07-21");
    expect(s.cc).toBe(800);
    expect(s.la).toBe(700);
  });
});

describe("Détection des récurrences", () => {
  it("résiste à un renommage manuel incohérent", () => {
    // Greg renomme 2 de ses 3 Bouygues différemment : la détection doit tenir
    // grâce au libellé bancaire, qui ne change jamais.
    const txs = [
      { id: "1", libelle: "Bouygues", libelleBanque: "PRLV SEPA Bouygues Telecom", montant: -34.99, categorie: "factures", date: "2026-05-05" },
      { id: "2", libelle: "Bouygues Telecom", libelleBanque: "PRLV SEPA Bouygues Telecom", montant: -34.99, categorie: "factures", date: "2026-06-05" },
      { id: "3", libelle: "PRLV SEPA Bouygues Telecom", libelleBanque: "PRLV SEPA Bouygues Telecom", montant: -34.99, categorie: "factures", date: "2026-07-06" },
    ];
    const r = detecterRecurrences(txs);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].occurrences).toBe(3);
  });
});

describe("Nettoyage des libellés LCL", () => {
  const cas = [
    ["CB  MP*CARREFOUR DAC 31/05/26", "Carrefour"],
    ["CB  MONOP4744        30/05/26", "Monoprix"],
    ["PRLV SEPA Bouygues Telecom", "Bouygues Telecom"],
    ["ECHEANCE PRET PERSONNEL 100626", "Prêt personnel"],
    ["CB  SQ *FRAN'S VERDU 29/05/26", "Fran's Verdu"],
    ["CB  L'ESTANQUET      17/06/26", "L'Estanquet"],
  ];
  it.each(cas)("%s → %s", (brut, attendu) => {
    expect(nettoyerLibelle(brut)).toBe(attendu);
  });
});

describe("Apprentissage des habitudes", () => {
  const txs = [
    { libelle: "Fran's Verdu", categorie: "resto", lieu: "Bordeaux", date: "2026-06-18" },
    { libelle: "Fran's Verdu", categorie: "resto", lieu: "Bordeaux", date: "2026-06-22" },
    { libelle: "Fran's Verdu", categorie: "courses", lieu: "Bordeaux", date: "2026-07-02" },
    { libelle: "Carrefour", categorie: "courses", lieu: "Bègles", date: "2026-07-07" },
  ];
  const memoire = construireMemoire(txs);

  it("retient la catégorie dominante, pas la dernière", () => {
    expect(devinerDepuisHistorique("Fran's Verdu", memoire).categorie).toBe("resto");
  });

  it("tolère les variantes d'écriture (apostrophes, casse)", () => {
    for (const v of ["Frans Verdu", "FRANS VERDU", "fran's verdu"]) {
      expect(devinerDepuisHistorique(v, memoire)?.lieu).toBe("Bordeaux");
    }
  });

  it("propose des libellés pendant la frappe", () => {
    expect(proposerLibelles("car", memoire).map((p) => p.libelle)).toContain("Carrefour");
  });

  it("renvoie tous les lieux quand la saisie est vide", () => {
    // A déjà échoué : nettoyerLibelle("") renvoie "Opération" et filtrait tout.
    expect(lieuxConnus(txs, 5, "").length).toBe(2);
  });

  it("filtre les lieux selon la saisie", () => {
    expect(lieuxConnus(txs, 5, "bor")).toEqual(["Bordeaux"]);
  });
});

describe("Catégorisation automatique", () => {
  const memoire = construireMemoire([{ libelle: "Fran's Verdu", categorie: "resto", date: "2026-06-18" }]);

  it("fait primer l'historique sur les règles", () => {
    const r = devinerCategorieComplet("Fran's Verdu", -12, memoire);
    expect(r.source).toBe("habitude");
    expect(r.categorie).toBe("resto");
  });

  it.each([
    ["Carrefour", -80, "courses"],
    ["Bouygues Telecom", -34.99, "factures"],
    ["Autoroute ASF", -2, "transport"],
    ["Airbnb", -207, "voyages"],
    ["Everping", 2253.94, "salaire"],
  ])("range %s en %s", (libelle, montant, attendue) => {
    expect(devinerCategorieComplet(libelle, montant, null).categorie).toBe(attendue);
  });

  it("n'invente rien pour un libellé inconnu", () => {
    expect(devinerCategorieComplet("Zzzz Qqqq", -12, null)).toBeNull();
  });
});

describe("Recherche", () => {
  const comptes = [{ id: "cc", nom: "Compte courant" }];
  const txs = [
    { id: "1", libelle: "Carrefour", montant: -80, categorie: "courses", date: "2026-07-08", compteId: "cc" },
    { id: "2", libelle: "Carrefour", montant: -15.15, categorie: "courses", date: "2026-07-07", compteId: "cc", lieu: "Bordeaux" },
    { id: "3", libelle: "Salaire", montant: 2253.94, categorie: "salaire", date: "2026-06-30", compteId: "cc" },
    { id: "4", libelle: "Virement", montant: 100, versId: "la", date: "2026-07-01", compteId: "cc" },
  ];

  it("trouve par texte", () => expect(rechercher("carrefour", txs, comptes).length).toBe(2));
  it("filtre par montant supérieur", () => expect(rechercher("> 50", txs, comptes).length).toBe(2));
  it("filtre par montant exact", () => expect(rechercher("=15,15", txs, comptes).length).toBeLessThanOrEqual(1));
  it("filtre par type", () => expect(rechercher("revenu", txs, comptes).length).toBe(1));
  it("trouve par lieu", () => expect(rechercher("bordeaux", txs, comptes).length).toBe(1));
  it("exclut les virements", () => expect(rechercher("virement", txs, comptes).length).toBe(0));
  it("ne renvoie rien sur une requête vide", () => {
    expect(rechercher("", txs, comptes).length).toBe(0);
    expect(rechercher("   ", txs, comptes).length).toBe(0);
  });
});

describe("Dates locales", () => {
  it("accepte une Date comme une chaîne", () => {
    // A déjà planté l'accueil : isoLocal recevait la chaîne "9999-12-31".
    expect(isoLocal("2026-07-21")).toBe("2026-07-21");
    expect(isoLocal(new Date(2026, 6, 21))).toBe("2026-07-21");
  });

  it("décale les mois sans déborder sur l'année", () => {
    // Le décalage part toujours du mois courant.
    const [a, m] = cleMoisLocal().split("-").map(Number);
    const attenduPrec = m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
    expect(moisDecaleLocal(-1)).toBe(attenduPrec);
    expect(moisDecaleLocal(0)).toBe(cleMoisLocal());
  });

  it("renvoie un mois au bon format", () => {
    expect(cleMoisLocal()).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("Projection du reste à vivre", () => {
  const donnees = {
    comptes: [{ id: "cc", type: "courant" }, { id: "la", type: "livretA" }],
    soldes: { cc: 600, la: 2000 },
    transactions: [],
    recurrentes: [{ id: "r", libelle: "Loyer", montant: -700, frequence: "mensuelle", prochaine: "2026-07-28", compteId: "cc", actif: true }],
    profil: { jourSalaire: 2 },
  };

  it("exclut l'épargne du disponible", () => {
    expect(calculerProjection(donnees).dispo).toBe(600);
  });

  it("donne toujours le même résultat (source unique)", () => {
    expect(calculerProjection(donnees).reste).toBe(calculerProjection(donnees).reste);
  });
});

describe("Import CSV au format LCL", () => {
  // Extrait réel du relevé : pas d'en-tête, lignes de solde, libellé en colonne variable.
  const releve = [
    "01/06/2026;1489,65;;00451 098285A",
    "01/06/2026;-10;Carte;;CB  Revolut**7050*   29/05/26;;0;Divers",
    "01/06/2026;-7,2;Carte;;CB  SQ *FRAN'S VERDU 29/05/26;;0;Divers",
    "01/06/2026;350;Virement;;;VIR.PERMANENT Mlle SOULLIER ROS;;",
    "02/06/2026;-16,97;Virement;;PRLV SEPA ASSURANCE LCL;;;",
    "30/06/2026;2253,94;Virement;;;VIREMENT Everping;;",
    "14/07/2026;43,15;;00451 098285A",
  ].join("\n");

  const r = analyserCSV(releve);

  it("lit le fichier sans en-tête", () => {
    expect(r.erreur).toBeUndefined();
    expect(r.operations.length).toBe(5);
  });

  it("écarte les lignes de solde", () => {
    expect(r.operations.some((o) => /098285A/.test(o.libelle))).toBe(false);
  });

  it("lit le libellé même quand il change de colonne", () => {
    // Cartes : 5e colonne. Virements : 6e colonne.
    expect(r.operations.find((o) => /Everping/.test(o.libelleBanque))).toBeTruthy();
    expect(r.operations.find((o) => /REVOLUT/i.test(o.libelleBanque))).toBeTruthy();
  });

  it("conserve le signe des montants", () => {
    expect(r.operations.some((o) => o.montant < 0)).toBe(true);
    expect(r.operations.find((o) => /Everping/.test(o.libelleBanque)).montant).toBe(2253.94);
  });

  it("ne plante pas sur un fichier vide ou illisible", () => {
    expect(analyserCSV("").erreur).toBeTruthy();
    expect(analyserCSV("nawak\nnawak").erreur).toBeTruthy();
  });
});
