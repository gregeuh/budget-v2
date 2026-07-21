import "./globals.css";
import { DataProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import SWRegister from "@/components/SWRegister";

export const metadata = {
  title: "Budget",
  description: "Gestion de budget multi-comptes avec conseils intelligents",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budget",
    startupImage: [
      { url: "/icons/splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/icons/splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  const antiFlash = `try{var p=localStorage.getItem("budget-theme")||"auto";var s=p==="sombre"||(p==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);if(s)document.documentElement.classList.add("sombre");}catch(e){}`;
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: antiFlash }} />
        <SWRegister />
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
