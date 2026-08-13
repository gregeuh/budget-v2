import { euros } from "@/lib/format";

export default function CourbeProjection({ evolution = [], horizonISO }) {
  const points = evolution.length > 1 ? evolution : [...evolution, { date: horizonISO, solde: evolution[0]?.solde || 0 }];
  const valeurs = points.map((point) => point.solde);
  const minimum = Math.min(...valeurs, 0);
  const maximum = Math.max(...valeurs, 1);
  const amplitude = Math.max(1, maximum - minimum);
  const largeur = 320;
  const hauteur = 68;
  const x = (index) => (points.length === 1 ? largeur : (index / (points.length - 1)) * largeur);
  const y = (valeur) => 8 + ((maximum - valeur) / amplitude) * (hauteur - 18);
  const ligne = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point.solde).toFixed(1)}`).join(" ");
  const aire = `${ligne} L ${largeur} ${hauteur} L 0 ${hauteur} Z`;
  const final = points.at(-1)?.solde || 0;
  const positif = final >= 0;

  return (
    <div className="courbe-projection mt-3" aria-label={`Projection du disponible : ${euros(points[0]?.solde || 0)} aujourd’hui, ${euros(final)} à l’horizon`}>
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="h-11 w-full overflow-visible" role="img" aria-label="Évolution prévisionnelle du reste à vivre">
        <defs>
          <linearGradient id="projection-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="white" stopOpacity=".28" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={aire} fill="url(#projection-area)" />
        <path d={ligne} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(points.length - 1)} cy={y(final)} r="4" fill="white" />
      </svg>
      <div className="mt-1 flex items-center justify-between text-v3-caption text-white/65">
        <span>Aujourd’hui</span>
        <span className={positif ? "text-white" : "text-white/80"}>{positif ? "Projection stable" : "À ajuster"}</span>
        <span>{horizonISO ? new Date(`${horizonISO}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Horizon"}</span>
      </div>
    </div>
  );
}
