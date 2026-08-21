"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useBudget } from "@/lib/store";
import Sheet from "@/components/Sheet";

const estInstallee = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);

function cleVersUint8Array(base64) {
  const normalisee = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const texte = atob(normalisee);
  return Uint8Array.from(texte, (char) => char.charCodeAt(0));
}

export default function NotificationsPush({ onFermer }) {
  const { user, modeLocal } = useBudget();
  const [statut, setStatut] = useState("verification");
  const [message, setMessage] = useState("");

  const verifier = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatut("indisponible");
      return;
    }
    if (!estInstallee()) {
      setStatut("installer");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setStatut(Notification.permission === "granted" && subscription ? "active" : Notification.permission === "denied" ? "bloque" : "pret");
  };

  useEffect(() => { verifier().catch(() => setStatut("indisponible")); }, []);

  const jeton = async () => {
    const current = auth?.currentUser;
    if (!current) throw new Error("Connecte-toi d'abord pour associer les notifications à ton compte.");
    return current.getIdToken();
  };

  const enregistrerSurServeur = async (subscription, token = null) => {
    if (!subscription?.endpoint) throw new Error("Aucun abonnement iPhone n'a été trouvé.");
    const save = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token || await jeton()}` },
      body: JSON.stringify(subscription),
    });
    if (!save.ok) throw new Error((await save.json()).erreur || "Enregistrement impossible.");
  };

  const activer = async () => {
    try {
      setStatut("chargement");
      if (!user || modeLocal) throw new Error("Les notifications nécessitent la connexion à ton compte Pécule.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatut("bloque");
        return;
      }
      const res = await fetch("/api/push/vapid", { cache: "no-store" });
      if (!res.ok) throw new Error("Les clés de notifications ne sont pas encore configurées sur le serveur.");
      const { key } = await res.json();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: cleVersUint8Array(key),
      });
      await enregistrerSurServeur(subscription);
      setStatut("active");
      setMessage("Notifications activées sur cet iPhone.");
    } catch (error) {
      setStatut("pret");
      setMessage(error.message || "Activation impossible.");
    }
  };

  const tester = async () => {
    try {
      setMessage("Envoi en cours… ferme Pécule pour vérifier la notification.");
      const token = await jeton();
      let res = await fetch("/api/push/test", { method: "POST", headers: { authorization: `Bearer ${token}` } });

      // Une PWA peut garder une souscription locale créée avant une mise à jour
      // serveur. Si le serveur ne la connaît pas encore, on la réassocie puis
      // on rejoue le test : aucune manipulation supplémentaire côté iPhone.
      if (res.status === 404) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await enregistrerSurServeur(subscription, token);
          res = await fetch("/api/push/test", { method: "POST", headers: { authorization: `Bearer ${token}` } });
        }
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.erreur || "Envoi impossible.");
      setMessage("Notification envoyée. Elle doit apparaître même si Pécule est fermée.");
    } catch (error) {
      setMessage(error.message || "Test impossible.");
    }
  };

  const desactiver = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const token = await jeton();
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setStatut("pret");
      setMessage("Notifications désactivées sur cet appareil.");
    } catch {
      setMessage("Désactivation impossible. Réessaie depuis Réglages iPhone → Notifications → Pécule.");
    }
  };

  const contenu = {
    installer: {
      titre: "Installe Pécule d'abord",
      texte: "Dans Safari : Partager → Sur l'écran d'accueil. Ouvre ensuite Pécule depuis son icône, puis reviens ici.",
    },
    bloque: {
      titre: "Notifications bloquées",
      texte: "Réactive-les dans Réglages iPhone → Notifications → Pécule, puis reviens ici.",
    },
    indisponible: {
      titre: "Non disponible ici",
      texte: "Utilise l'app Pécule installée depuis Safari sur un iPhone à jour. Un onglet Safari ou localhost ne suffit pas.",
    },
  }[statut];

  return (
    <Sheet titre="Notifications" onFermer={onFermer}>
      <div className="space-y-4">
        <div className="rounded-ios bg-marque-pale p-4">
          <p className="text-base font-bold text-marque-texte">Des alertes utiles, pas du bruit.</p>
          <p className="mt-1 text-sm leading-relaxed text-sourdine">Paiement à venir, budget à surveiller et point mensuel : Pécule peut te prévenir même fermée.</p>
        </div>

        {contenu ? (
          <div className="rounded-ios bg-voile p-4">
            <p className="font-semibold">{contenu.titre}</p>
            <p className="mt-1 text-sm leading-relaxed text-sourdine">{contenu.texte}</p>
          </div>
        ) : statut === "active" ? (
          <div className="rounded-ios bg-menthe-pale p-4">
            <p className="font-semibold text-menthe-texte">✓ Activées sur cet iPhone</p>
            <p className="mt-1 text-sm text-menthe-texte/80">Les alertes arrivent sur l'écran verrouillé, même si Pécule est fermée.</p>
          </div>
        ) : (
          <div className="rounded-ios bg-voile p-4">
            <p className="font-semibold">Prête à les activer</p>
            <p className="mt-1 text-sm leading-relaxed text-sourdine">iOS te demandera l'autorisation une seule fois.</p>
          </div>
        )}

        {message && <p className="rounded-ios bg-voile px-3 py-2.5 text-sm text-sourdine">{message}</p>}

        {statut === "active" ? (
          <div className="space-y-2">
            <button onClick={tester} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Envoyer une notification test</button>
            <button onClick={desactiver} className="w-full rounded-ios bg-voile py-3 text-sm font-semibold text-sourdine">Désactiver sur cet iPhone</button>
          </div>
        ) : !contenu && (
          <button disabled={statut === "chargement"} onClick={activer} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-50">
            {statut === "chargement" ? "Activation…" : "Activer les notifications"}
          </button>
        )}

        <p className="text-xs leading-relaxed text-sourdine">Tu peux les modifier à tout moment dans Réglages iPhone → Notifications → Pécule.</p>
      </div>
    </Sheet>
  );
}
