"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        // Quand une nouvelle version est prête, elle prend la main au prochain
        // rechargement. On évite un refresh forcé pendant une saisie en cours.
        registration.update().catch(() => {});
      }).catch(() => {});
    }
  }, []);
  return null;
}
