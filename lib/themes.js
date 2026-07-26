/**
 * Couleurs d'accent de l'app.
 *
 * Chaque accent définit trois valeurs par thème :
 *  - vif    : la teinte pleine (icônes, jauges, points)
 *  - bouton : fond des boutons — assez foncé pour du texte blanc (contraste ≥ 4.5)
 *  - texte  : la teinte pour du texte sur fond clair (contraste ≥ 4.5)
 *
 * Les contrastes ont été mesurés : un accent ne doit jamais rendre le texte illisible.
 */
export const ACCENTS = {
  bleu: {
    label: "Bleu",
    apercu: "#007AFF",
    clair: { vif: "#007AFF", bouton: "#0068D9", texte: "#0062CC", pale: "rgba(0,122,255,0.12)" },
    sombre: { vif: "#0A84FF", bouton: "#0A84FF", texte: "#64B5FF", pale: "rgba(10,132,255,0.20)" },
  },
  indigo: {
    label: "Indigo",
    apercu: "#5856D6",
    clair: { vif: "#5856D6", bouton: "#4F46E5", texte: "#4338CA", pale: "rgba(88,86,214,0.13)" },
    sombre: { vif: "#7D7AFF", bouton: "#5B52E8", texte: "#A9A8FF", pale: "rgba(94,92,230,0.22)" },
  },
  vert: {
    label: "Vert",
    apercu: "#34C759",
    clair: { vif: "#34C759", bouton: "#1E7A34", texte: "#1E7A34", pale: "rgba(52,199,89,0.14)" },
    sombre: { vif: "#30D158", bouton: "#248A3D", texte: "#5CE27F", pale: "rgba(48,209,88,0.20)" },
  },
  rose: {
    label: "Rose",
    apercu: "#FF2D55",
    clair: { vif: "#FF2D55", bouton: "#D70036", texte: "#C2003A", pale: "rgba(255,45,85,0.12)" },
    sombre: { vif: "#FF375F", bouton: "#E0304F", texte: "#FF6482", pale: "rgba(255,55,95,0.20)" },
  },
  orange: {
    label: "Orange",
    apercu: "#FF9500",
    clair: { vif: "#FF9500", bouton: "#AC5F00", texte: "#AC5F00", pale: "rgba(255,149,0,0.14)" },
    sombre: { vif: "#FF9F0A", bouton: "#C26C00", texte: "#FFBE57", pale: "rgba(255,159,10,0.20)" },
  },
  graphite: {
    label: "Graphite",
    apercu: "#48484A",
    clair: { vif: "#48484A", bouton: "#3A3A3C", texte: "#3A3A3C", pale: "rgba(72,72,74,0.12)" },
    sombre: { vif: "#98989D", bouton: "#636366", texte: "#AEAEB2", pale: "rgba(152,152,157,0.20)" },
  },
};

export const ACCENT_DEFAUT = "bleu";

/**
 * Applique un accent en surchargeant les variables CSS de marque.
 * Une seule source : toute l'app (boutons, focus, liens, jauges) suit --marque.
 */
export function appliquerAccent(idAccent, sombre) {
  const a = ACCENTS[idAccent] || ACCENTS[ACCENT_DEFAUT];
  const t = sombre ? a.sombre : a.clair;
  const r = document.documentElement.style;
  r.setProperty("--marque", t.vif);
  r.setProperty("--marque-bouton", t.bouton);
  r.setProperty("--marque-texte", t.texte);
  r.setProperty("--marque-pale", t.pale);
}
