"use client";

import { fetchSuivi } from "@/lib/journal";
import { useRef, useState } from "react";
import { useBudget } from "@/lib/store";
import { resumePourCoach } from "@/lib/conseils";
import { calculerScore } from "@/lib/score";
import PointsSautillants from "@/components/PointsSautillants";
import ScoreSante from "@/components/ScoreSante";
import AnalyseDepenses from "@/components/AnalyseDepenses";
import ConseilsList from "@/components/ConseilsList";

export default function Conseils() {
  const donnees = useBudget();

  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const finRef = useRef(null);

  const envoyer = async () => {
    const texte = saisie.trim();
    if (!texte || enCours) return;
    const nouveaux = [...messages, { role: "user", content: texte }];
    setMessages(nouveaux);
    setSaisie("");
    setEnCours(true);
    try {
      const rep = await fetchSuivi("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nouveaux.slice(-10),
          resume: { ...resumePourCoach(donnees), scoreSante: (({ total, piliers }) => ({ total, piliers: piliers.map((p) => ({ pilier: p.label, points: p.points, sur: 20 })) }))(calculerScore(donnees)) },
        }),
      });
      let data = {};
      try { data = await rep.json(); } catch { /* réponse non-JSON */ }
      const contenu = data.reponse || data.erreur || (rep.ok ? "Réponse vide." : `Erreur ${rep.status}. Réessaie dans un instant.`);
      setMessages((m) => [...m, { role: "assistant", content: contenu }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Le coach est injoignable pour le moment. Vérifie ta connexion et réessaie." }]);
    }
    setEnCours(false);
    setTimeout(() => finRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const suggestions = [
    "Analyse mon mois en cours",
    "Vais-je finir le mois dans le vert ?",
    "Où puis-je économiser sans me priver ?",
    "Comment améliorer mon score santé ?",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Conseils</h1>

      {/* Coach IA : c'est ce qu'on vient chercher, donc en premier */}
      <section className="rounded-ios bg-carte p-4 shadow-carte">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Coach budgétaire ✨</h2>

        {messages.length === 0 && (
          <div className="mb-3 mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setSaisie(s)} className="champ px-3 py-1.5 text-sm">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[45dvh] space-y-2 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "ml-auto bg-encre text-contraste" : "bg-fond"}`}>
              {m.content}
            </div>
          ))}
          {enCours && <div className="w-fit rounded-2xl bg-fond px-3.5 py-3"><PointsSautillants taille={6} couleur="var(--c-sourdine)" /></div>}
          <div ref={finRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyer()}
            placeholder="Pose ta question…"
            className="min-w-0 flex-1 champ px-4 py-2.5 text-sm outline-none"
          />
          <button
            onClick={envoyer}
            disabled={!saisie.trim() || enCours}
            aria-label={enCours ? "Le coach réfléchit" : "Envoyer"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-encre text-contraste disabled:opacity-40"
          >
            {enCours ? <PointsSautillants taille={4} couleur="var(--c-contraste)" /> : "↑"}
          </button>
        </div>

        <details className="mt-2.5">
          <summary className="cursor-pointer text-[11px] text-sourdine">Quelles données reçoit le coach ?</summary>
          <p className="mt-1 text-[11px] leading-relaxed text-sourdine">
            Via ta propre clé API : soldes, 6 mois d&apos;historique, opérations récentes, récurrences, projets et score.
            Informations générales à visée pédagogique, pas un conseil financier personnalisé.
          </p>
        </details>
      </section>

      <ConseilsList />

      {/* Outils d'analyse : repliés, on les ouvre quand on veut creuser */}
      <ScoreSante />

      <AnalyseDepenses />
    </div>
  );
}
