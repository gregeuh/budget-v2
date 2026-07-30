/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fond: "var(--c-fond)",
        carte: "var(--c-carte)",
        encre: "var(--c-encre)",
        sourdine: "var(--c-sourdine)",
        contraste: "var(--c-contraste)",
        bordure: "var(--c-bordure)",
        voile: "var(--c-voile)",
        // Couleur de marque : tout ce qui est interactif
        marque: { DEFAULT: "var(--marque)", pale: "var(--marque-pale)", texte: "var(--marque-texte)", bouton: "var(--marque-bouton)" },
        surMarque: "var(--sur-marque)",
        // Trois rôles sémantiques
        menthe: { DEFAULT: "var(--menthe)", pale: "var(--menthe-pale)", texte: "var(--menthe-texte)", bouton: "var(--menthe-bouton)" },
        beurre: { DEFAULT: "var(--beurre)", pale: "var(--beurre-pale)", texte: "var(--beurre-texte)" },
        corail: { DEFAULT: "var(--corail)", pale: "var(--corail-pale)", texte: "var(--corail-texte)", bouton: "var(--corail-bouton)" },
        // Alias conservés pour ne rien casser dans l'existant
        lavande: { DEFAULT: "var(--marque)", pale: "var(--marque-pale)", texte: "var(--marque-texte)" },
        ciel: { DEFAULT: "var(--marque)", pale: "var(--marque-pale)", texte: "var(--marque-texte)" },
        peche: { DEFAULT: "var(--beurre)", pale: "var(--beurre-pale)", texte: "var(--beurre-texte)" },
        ui: {
          surface: {
            1: "var(--v3-surface-1)",
            2: "var(--v3-surface-2)",
            3: "var(--v3-surface-3)",
            floating: "var(--v3-surface-floating)",
            glass: "var(--v3-surface-glass)",
          },
          primary: { DEFAULT: "var(--v3-primary)", accent: "var(--v3-primary-accent)" },
          positive: "var(--v3-positive)",
          negative: "var(--v3-negative)",
          text: { primary: "var(--v3-text-primary)", secondary: "var(--v3-text-secondary)" },
          hairline: "var(--v3-border-hairline)",
        },
      },
      spacing: {
        "v3-1": "var(--v3-space-1)", "v3-2": "var(--v3-space-2)", "v3-3": "var(--v3-space-3)",
        "v3-4": "var(--v3-space-4)", "v3-5": "var(--v3-space-5)", "v3-6": "var(--v3-space-6)",
        "v3-8": "var(--v3-space-8)", "v3-10": "var(--v3-space-10)", "v3-12": "var(--v3-space-12)",
      },
      borderRadius: {
        ios: "18px", pill: "999px",
        "v3-xs": "var(--v3-radius-xs)", "v3-s": "var(--v3-radius-s)", "v3-m": "var(--v3-radius-m)",
        "v3-l": "var(--v3-radius-l)", "v3-xl": "var(--v3-radius-xl)", "v3-xxl": "var(--v3-radius-xxl)",
      },
      boxShadow: {
        carte: "var(--ombre-carte)",
        // Élévation réservée à ce qui flotte réellement (feuilles, menus)
        eleve: "var(--ombre-flottant)",
        flottant: "var(--ombre-flottant)",
        bouton: "var(--ombre-bouton)",
        "v3-soft": "var(--v3-shadow-soft)",
        "v3-medium": "var(--v3-shadow-medium)",
        "v3-floating": "var(--v3-shadow-floating)",
      },
      fontFamily: {
        sf: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'sans-serif'],
        "v3-display": "var(--v3-font-display)",
      },
      fontSize: {
        "v3-caption": ["var(--v3-text-caption)", { lineHeight: "1rem" }],
        "v3-body": ["var(--v3-text-body)", { lineHeight: "1.35rem" }],
        "v3-title": ["var(--v3-text-title)", { lineHeight: "1.75rem", letterSpacing: "-0.02em" }],
        "v3-hero": ["var(--v3-text-hero)", { lineHeight: "0.96", letterSpacing: "-0.05em" }],
      },
      transitionDuration: {
        "v3-fast": "var(--v3-duration-fast)",
        "v3-normal": "var(--v3-duration-normal)",
        "v3-slow": "var(--v3-duration-slow)",
      },
      transitionTimingFunction: {
        "v3-standard": "var(--v3-ease-standard)",
        "v3-spring": "var(--v3-ease-spring)",
      },
      backdropBlur: { "v3-glass": "var(--v3-glass-blur)" },
    },
  },
  plugins: [],
};
