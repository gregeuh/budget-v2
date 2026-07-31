export default function PeculeLogo({ compact = false, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Pécule">
      <svg viewBox="0 0 48 48" role="img" aria-label="Logo Pécule" className="h-10 w-10 shrink-0 overflow-visible">
        <defs>
          <linearGradient id="pecule-bleu" x1="7" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse"><stop stopColor="#4E7DFF" /><stop offset=".48" stopColor="#3860EB" /><stop offset="1" stopColor="#253AC3" /></linearGradient>
          <linearGradient id="pecule-reflet" x1="14" y1="11" x2="35" y2="38" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity=".58" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
          <filter id="pecule-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#2B45C7" floodOpacity=".28" /></filter>
        </defs>
        <g filter="url(#pecule-ombre)">
          <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#pecule-bleu)" />
          <path d="M16 35V13h9.3c5.35 0 8.7 2.92 8.7 7.48 0 4.62-3.35 7.52-8.7 7.52h-4.15V35H16Zm5.15-11.42h3.52c2.58 0 4.12-1.13 4.12-3.1 0-1.94-1.54-3.06-4.12-3.06h-3.52v6.16Z" fill="white" />
          <path d="M8.5 34.7c7.9-5.6 14.2 3.3 22.1-1.5 3.6-2.18 5.1-5.5 8.9-7.35v12.1A6.05 6.05 0 0 1 33.45 44H14.55a6.05 6.05 0 0 1-6.05-6.05V34.7Z" fill="url(#pecule-reflet)" opacity=".75" />
          <path d="M9.5 34.2c7.9-5.1 14.1 3.2 21.9-1.4 3.45-2.04 5.08-5.28 8.1-6.9" fill="none" stroke="white" strokeOpacity=".44" strokeWidth="1.25" strokeLinecap="round" />
        </g>
      </svg>
      {!compact && <span className="font-serif text-[1.7rem] font-semibold tracking-[-.06em] text-[#3d5be8]">Pécule</span>}
    </div>
  );
}
