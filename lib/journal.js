/**
 * Journal d'erreurs.
 *
 * Objectif : ne plus dépendre du hasard pour découvrir un problème.
 * (Le bug du coach n'avait été élucidé que parce qu'un débit de 3 centimes
 * avait été remarqué par hasard.)
 *
 * Tout reste sur l'appareil : rien n'est envoyé nulle part.
 * On ne consigne JAMAIS de contenu financier (montants, libellés, soldes),
 * uniquement la nature technique de l'erreur.
 */

const CLE = "journal-erreurs";
const MAX = 50;

const nettoyer = (v, taille = 300) =>
  String(v ?? "")
    .slice(0, taille)
    // Retire ce qui ressemble à un montant ou à un identifiant long
    .replace(/\b\d+[.,]\d{2}\b/g, "«montant»")
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, "«id»");

export function lireJournal() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

export function viderJournal() {
  try {
    localStorage.removeItem(CLE);
  } catch {}
}

export function consigner(type, message, details = {}) {
  try {
    const entree = {
      date: new Date().toISOString(),
      type: nettoyer(type, 40),
      message: nettoyer(message),
      ...(details.ou ? { ou: nettoyer(details.ou, 80) } : {}),
      ...(details.statut ? { statut: Number(details.statut) || null } : {}),
    };
    const liste = [entree, ...lireJournal()].slice(0, MAX);
    localStorage.setItem(CLE, JSON.stringify(liste));
    return entree;
  } catch {
    return null;
  }
}

/** Enveloppe fetch pour consigner automatiquement les appels qui échouent. */
export async function fetchSuivi(url, options) {
  try {
    const rep = await fetch(url, options);
    if (!rep.ok) {
      consigner("reseau", `Réponse ${rep.status}`, { ou: url, statut: rep.status });
    }
    return rep;
  } catch (e) {
    consigner("reseau", e?.message || "Appel impossible", { ou: url });
    throw e;
  }
}

let branche = false;

/** Capte les erreurs qui remontent jusqu'au navigateur. */
export function brancherJournal() {
  if (branche || typeof window === "undefined") return;
  branche = true;

  window.addEventListener("error", (e) => {
    consigner("plantage", e?.message || "Erreur inconnue", {
      ou: e?.filename ? `${e.filename}:${e.lineno}` : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const r = e?.reason;
    consigner("promesse", r?.message || String(r || "Promesse rejetée"));
  });
}
