"use client";

import { useEffect, useRef } from "react";

const COULEURS = ["#35C79A", "#8B7CF6", "#3E9BFF", "#F5B93E", "#FF8A7A", "#FFD9A0"];

// Confettis légers en canvas (aucune bibliothèque). Se nettoie tout seul.
export default function Confettis({ actif, onFini }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!actif) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onFini?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const L = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = L * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const particules = Array.from({ length: 90 }, () => ({
      x: L / 2 + (Math.random() - 0.5) * L * 0.3,
      y: H * 0.42 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 7,
      vy: -6 - Math.random() * 7,
      taille: 5 + Math.random() * 6,
      couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      vie: 1,
    }));

    let brut;
    const debut = performance.now();
    const boucle = (t) => {
      const age = t - debut;
      ctx.clearRect(0, 0, L, H);
      let vivantes = 0;
      for (const p of particules) {
        p.vy += 0.28;          // gravité
        p.vx *= 0.995;         // frottement
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vie = Math.max(0, 1 - age / 2200);
        if (p.vie <= 0 || p.y > H + 20) continue;
        vivantes++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.vie;
        ctx.fillStyle = p.couleur;
        ctx.fillRect(-p.taille / 2, -p.taille / 4, p.taille, p.taille / 2);
        ctx.restore();
      }
      if (vivantes > 0) brut = requestAnimationFrame(boucle);
      else onFini?.();
    };
    brut = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(brut);
  }, [actif, onFini]);

  if (!actif) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[130] mx-auto h-full w-full max-w-md"
    />
  );
}
