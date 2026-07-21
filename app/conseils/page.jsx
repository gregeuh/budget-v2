"use client";

import { useMemo, useRef, useState } from "react";
import { useBudget } from "@/lib/store";
import { genererConseils, resumePourCoach } from "@/lib/conseils";
import { calculerScore } from "@/lib/score";
import PointsSautillants from "@/components/PointsSautillants";
import ScoreSante from "@/components/ScoreSante";
import AnalyseDepenses from "@/components/AnalyseDepenses";

// Carte neutre par défaut : la couleur est réservée aux vraies alertes.
// Le ton reste lisible grâce à la pastille colorée autour de l'icône.
const TONS = {
  alerte: { carte: "bg-corail-pale", pastille: "bg-corail/15" },
  info: { carte: "bg-carte shadow-carte", pastille: "bg-marque-pale" },
  bravo: { carte: "bg-carte shadow-carte", pastille: "bg-menthe-pale" },
};

export default function Conseils() {
  const donnees = useBudget();
  const [tousConseils, setTousConseils] = useState(false);
  const conseils = useMemo(() => genererConseils(donnees), [donnees.transactions, donnees.comptes, donnees.budgets, donnees.soldes, donnees.profil]);

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
      const rep = await fetch("/api/coach", {
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
      <section className="rounded-ios bg-carte p-3.5 shadow-carte">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">Coach budgétaire ✨</h2>

        {messages.length === 0 && (
          <div className="mb-3 mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setSaisie(s)} className="rounded-pill border border-bordure bg-fond px-3 py-1.5 text-sm">
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
            className="min-w-0 flex-1 rounded-pill border border-bordure bg-fond px-4 py-2.5 text-sm outline-none focus:border-menthe"
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

      {/* Conseils automatiques : les 3 plus utiles, le reste sur demande */}
      {conseils.length > 0 && (
        <section className="space-y-2">
          {(tousConseils ? conseils : conseils.slice(0, 3)).map((c, i) => (
            <div key={i} className={`pop-in rounded-ios p-4 ${(TONS[c.ton] || TONS.info).carte}`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${(TONS[c.ton] || TONS.info).pastille}`}>{c.icone}</span>
                <div>
                  <h3 className="font-semibold leading-tight">{c.titre}</h3>
                  <p className="mt-0.5 text-sm text-encre opacity-75">{c.texte}</p>
                </div>
              </div>
            </div>
          ))}
          {conseils.length > 3 && (
            <button onClick={() => setTousConseils((v) => !v)} className="w-full py-1 text-xs font-medium text-sourdine">
              {tousConseils ? "Réduire" : `Voir les ${conseils.length - 3} autres conseils`}
            </button>
          )}
        </section>
      )}

      {conseils.length === 0 && (
        <p className="rounded-ios bg-carte p-6 text-center text-sm text-sourdine shadow-carte">
          Ajoute quelques opérations pour que l&apos;analyse démarre.
        </p>
      )}

      {/* Outils d'analyse : repliés, on les ouvre quand on veut creuser */}
      <ScoreSante />

      <AnalyseDepenses />
    </div>
  );
}
