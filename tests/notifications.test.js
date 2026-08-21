import { describe, expect, it } from "vitest";
import { alertesUtiles } from "../lib/notificationDigest";

describe("alertes utiles", () => {
  it("priorise un budget dépassé avant une échéance", () => {
    const alertes = alertesUtiles({
      budgets: { courses: 100 },
      transactions: [
        { date: "2026-08-20", montant: -120, categorie: "courses", libelle: "Carrefour" },
        { date: "2026-08-22", montant: -850, categorie: "logement", libelle: "Loyer" },
      ],
      recurrentes: [],
      profil: {},
    }, new Date("2026-08-21T08:00:00Z"));

    expect(alertes[0]).toMatchObject({ title: "Budget Courses dépassé", url: "/budgets" });
    expect(alertes[1]).toMatchObject({ title: "Échéance demain", url: "/calendrier" });
  });

  it("respecte les préférences de notification", () => {
    const alertes = alertesUtiles({
      budgets: { courses: 100 },
      transactions: [{ date: "2026-08-20", montant: -120, categorie: "courses", libelle: "Carrefour" }],
      recurrentes: [],
      profil: { notifications: { budgets: false } },
    }, new Date("2026-08-21T08:00:00Z"));

    expect(alertes).toEqual([]);
  });
});
