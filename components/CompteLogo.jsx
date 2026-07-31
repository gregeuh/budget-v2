const STYLES = {
  courant: { fond: "#E9F2FF", couleur: "#0A63FF" }, revolut: { fond: "#EEEAFE", couleur: "#5B43E8" }, swile: { fond: "#FFF0EB", couleur: "#F05C45" },
  livretA: { fond: "#E8F8F1", couleur: "#14956B" }, ldds: { fond: "#E8F8F1", couleur: "#14956B" }, pea: { fond: "#FFF7DF", couleur: "#C78000" },
  especes: { fond: "#FFF7DF", couleur: "#A66B00" }, autre: { fond: "#EEF2F7", couleur: "#536176" },
};

function Symbole({ type }) {
  if (type === "revolut") return <span className="font-sans text-[.92em] font-black tracking-[-.1em]">R</span>;
  if (type === "swile") return <span className="font-sans text-[.9em] font-black tracking-[-.12em]">S</span>;
  if (type === "livretA") return <span className="font-serif text-[.92em] font-bold">A</span>;
  if (type === "ldds") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[.72em] w-[.72em]"><path d="M19 4C11.5 4.2 6 7.8 6 14c0 3.1 2.2 5 4.8 5C17 19 19 12.4 19 4Z" /><path d="M4 20c2.5-3.5 5.5-6 10-8" /></svg>;
  if (type === "pea") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[.72em] w-[.72em]"><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /></svg>;
  if (type === "especes") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[.72em] w-[.72em]"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.4" /><path d="M7 9h.01M17 15h.01" /></svg>;
  if (type === "courant") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[.72em] w-[.72em]"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18" /><path d="M7 15h4" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[.72em] w-[.72em]"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7V5h8v2M8 12h8" /></svg>;
}

export default function CompteLogo({ type = "autre", taille = 40, className = "" }) {
  const style = STYLES[type] || STYLES.autre;
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-[30%] font-semibold ${className}`} style={{ width: taille, height: taille, color: style.couleur, background: `linear-gradient(145deg, ${style.fond}, rgba(255,255,255,.9))`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.8), 0 2px 6px rgba(36,51,82,.08)", fontSize: `${Math.max(16, taille * .5)}px` }}><Symbole type={type} /></span>;
}
