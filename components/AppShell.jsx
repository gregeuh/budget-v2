"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useBudget } from "@/lib/store";
import { brancherJournal } from "@/lib/journal";
import TabBar from "./TabBar";
import Toast from "./Toast";
import SqueletteAccueil from "./SqueletteAccueil";
import TirerPourRafraichir from "./TirerPourRafraichir";

// Ces écrans ne sont utiles qu'à la demande : les isoler évite de les inclure
// dans le premier rendu de chaque page, surtout sur réseau mobile.
const AddSheet = dynamic(() => import("./AddSheet"), { ssr: false });
const Login = dynamic(() => import("./Login"), { ssr: false });
const Onboarding = dynamic(() => import("./Onboarding"), { ssr: false });
const DrawerReglages = dynamic(() => import("./DrawerReglages"), { ssr: false });
const Confettis = dynamic(() => import("./Confettis"), { ssr: false });

export default function AppShell({ children }) {
  const { pret, user, modeLocal, profil, comptes, erreurInit, reglagesOuverts, celebration } = useBudget();
  const [fete, setFete] = useState(false);
  const [enLigne, setEnLigne] = useState(true);
  const [chargementLong, setChargementLong] = useState(false);

  // Capte les erreurs dès le démarrage, pour qu'aucune ne passe inaperçue
  useEffect(() => { brancherJournal(); }, []);

  // Les données Firestore sont mises en cache par le SDK. Informer sans
  // bloquer permet de continuer à consulter l'app même sans réseau.
  useEffect(() => {
    const actualiser = () => setEnLigne(navigator.onLine);
    actualiser();
    window.addEventListener("online", actualiser);
    window.addEventListener("offline", actualiser);
    return () => {
      window.removeEventListener("online", actualiser);
      window.removeEventListener("offline", actualiser);
    };
  }, []);

  // Une authentification ou un réseau bloqué ne doit jamais laisser une page
  // blanche sous un squelette indéfini. Après quelques secondes, on donne une
  // explication et une action de récupération.
  useEffect(() => {
    if (pret) {
      setChargementLong(false);
      return;
    }
    const minuterie = setTimeout(() => setChargementLong(true), 6000);
    return () => clearTimeout(minuterie);
  }, [pret]);

  useEffect(() => {
    if (celebration > 0) setFete(true);
  }, [celebration]);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const chemin = usePathname();

  // La page entre du côté vers lequel on navigue, comme dans les apps natives.
  const ORDRE = ["/", "/comptes", "/budgets", "/statistiques", "/conseils"];
  const cheminPrecedent = useRef(chemin);
  const rang = (c) => {
    const i = ORDRE.indexOf(c);
    return i === -1 ? ORDRE.length : i;
  };
  const sens = rang(chemin) >= rang(cheminPrecedent.current) ? "page-droite" : "page-gauche";
  useEffect(() => { cheminPrecedent.current = chemin; }, [chemin]);

  if (!pret) {
    if (!chargementLong) return <SqueletteAccueil />;
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-6 text-center">
        <section aria-live="polite" className="w-full rounded-v3-l border border-ui-hairline bg-ui-surface-floating p-7 shadow-v3-medium">
          <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-beurre-pale text-2xl">⏳</span>
          <h1 className="mt-4 text-v3-title font-semibold text-ui-text-primary">Le chargement prend plus de temps</h1>
          <p className="mt-2 text-sm leading-5 text-ui-text-secondary">
            {enLigne ? "Nous attendons la connexion sécurisée à tes données." : "Tu sembles hors connexion. Vérifie ton réseau puis réessaie."}
          </p>
          <button onClick={() => location.reload()} className="tappable mt-5 rounded-pill bg-marque-bouton px-5 py-3 text-sm font-semibold text-surMarque shadow-bouton">Réessayer</button>
        </section>
      </div>
    );
  }

  if (!modeLocal && erreurInit && !user) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl">🔌</div>
        <h1 className="mt-3 text-xl font-bold">Problème de configuration</h1>
        <p className="mt-2 text-sm text-sourdine">{erreurInit}</p>
        <button onClick={() => location.reload()} className="mt-5 rounded-ios bg-marque-bouton px-6 py-3 font-semibold text-surMarque">
          Réessayer
        </button>
      </div>
    );
  }
  if (!modeLocal && !user) return <Login />;
  if (!profil.onboarde && comptes.length === 0) return <Onboarding />;

  return (
    <div className="app-shell mx-auto min-h-dvh max-w-md" style={{ paddingTop: "var(--safe-top)" }}>
      <a href="#contenu-principal" className="lien-echappement">Aller au contenu</a>
      <div aria-hidden="true" className="app-shell__ambient" />
      <TirerPourRafraichir />
      <Toast />
      {!enLigne && (
        <div role="status" className="relative z-10 mx-4 mt-3 rounded-v3-s bg-beurre-pale px-3.5 py-2 text-xs font-medium text-beurre-texte shadow-v3-soft">
          📡 Hors connexion — tes données restent consultables. Les changements seront synchronisés dès le retour du réseau.
        </div>
      )}
      {erreurInit && (
        <div className="relative z-10 mx-4 mt-3 rounded-v3-s bg-corail-pale px-3.5 py-2 text-xs font-medium text-corail-texte shadow-v3-soft">
          ⚠️ {erreurInit}
        </div>
      )}
      <main id="contenu-principal" key={chemin} tabIndex={-1} className={`relative z-10 ${sens} px-4 pb-40 pt-6`}>{children}</main>
      <TabBar onAjouter={() => setAjoutOuvert(true)} ajoutOuvert={ajoutOuvert} />
      {ajoutOuvert && <AddSheet onFermer={() => setAjoutOuvert(false)} />}
      {reglagesOuverts && <DrawerReglages />}
      <Confettis actif={fete} onFini={() => setFete(false)} />
    </div>
  );
}
