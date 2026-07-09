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
        menthe: { DEFAULT: "#2BB68C", pale: "var(--menthe-pale)", texte: "var(--menthe-texte)" },
        corail: { DEFAULT: "#FF6B5E", pale: "var(--corail-pale)", texte: "var(--corail-texte)" },
        lavande: { DEFAULT: "#8B7CF6", pale: "var(--lavande-pale)", texte: "var(--lavande-texte)" },
        ciel: { DEFAULT: "#3E9BFF", pale: "var(--ciel-pale)", texte: "var(--ciel-texte)" },
        peche: { DEFAULT: "#FF9D5C", pale: "var(--peche-pale)", texte: "var(--peche-texte)" },
        beurre: { DEFAULT: "#F5B93E", pale: "var(--beurre-pale)", texte: "var(--beurre-texte)" },
      },
      borderRadius: { ios: "22px", pill: "999px" },
      boxShadow: {
        carte: "var(--ombre-carte)",
        flottant: "0 8px 30px rgba(0,0,0,0.25)",
      },
      fontFamily: {
        sf: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
