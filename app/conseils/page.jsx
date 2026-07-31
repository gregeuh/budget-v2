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
import ConseilsHero from "@/components/ConseilsHero";
import ConseilsPriorites from "@/components/ConseilsPriorites";
import Sheet from "@/components/Sheet";

export default function Conseils() {
  const donnees = useBudget();

  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [coachOuvert, setCoachOuvert] = useState(false);
  const finRef = useRef(null);
  const analyseRef = useRef(null);

  const ouvrirAnalyse = () => {
    if (analyseRef.current) analyseRef.current.open = true;
    requestAnimationFrame(() => analyseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

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
      <ConseilsHero onVoirPriorites={ouvrirAnalyse} />
      <ConseilsPriorites onVoirTout={ouvrirAnalyse} />

      <details ref={analyseRef} id="tous-les-conseils" className="group scroll-mt-5 rounded-v3-l border border-ui-hairline bg-ui-surface-floating shadow-v3-soft">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:hidden">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff3ff] text-xl">🧭</span>
          <span className="min-w-0 flex-1"><span className="block font-semibold tracking-tight">Analyse complète</span><span className="mt-0.5 block text-sm text-ui-text-secondary">Toutes tes recommandations et analyses.</span></span>
          <span className="text-2xl font-light text-ui-text-secondary transition-transform group-open:rotate-90">›</span>
        </summary>
        <div className="border-t border-ui-hairline p-4">
          <ConseilsList />
          <div className="mt-5 space-y-3 border-t border-ui-hairline pt-5">
            <ScoreSante />
            <AnalyseDepenses />
          </div>
        </div>
      </details>

      {coachOuvert && <Sheet titre="Coach budgétaire" onFermer={() => setCoachOuvert(false)} clair>
        <p className="-mt-2 text-sm text-[#667085]">Une analyse bienveillante basée sur tes données du mois.</p>

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
      </Sheet>}

      <button onClick={() => setCoachOuvert(true)} aria-label="Ouvrir le coach budgétaire" className="fixed bottom-[calc(var(--safe-bottom)+5.75rem)] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(145deg,#7655ef,#5d44dc)] text-2xl text-white shadow-[0_12px_28px_rgba(100,72,220,.4)] transition-transform active:scale-90">✦</button>
    </div>
  );
}
