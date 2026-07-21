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
      },
      borderRadius: { ios: "18px", pill: "999px" },
      boxShadow: {
        carte: "var(--ombre-carte)",
        // Élévation réservée à ce qui flotte réellement (feuilles, menus)
        eleve: "0 0 0 1px var(--c-bordure), 0 12px 32px rgba(0,0,0,0.14)",
        flottant: "0 8px 30px rgba(0,0,0,0.25)",
      },
      fontFamily: {
        sf: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
