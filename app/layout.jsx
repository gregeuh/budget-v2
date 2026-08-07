import "./globals.css";
import { DataProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import SWRegister from "@/components/SWRegister";

export const metadata = {
  title: "Pécule",
  description: "Ton budget, au calme.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pécule",
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
    icon: "/pecule-mark.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F2F7",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  const antiFlash = `try{var p=localStorage.getItem("budget-theme")||"auto";var s=p==="sombre"||(p==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);if(s)document.documentElement.classList.add("sombre");var a=localStorage.getItem("budget-accent");if(a){var M={bleu:["#007AFF","#0068D9","#0062CC","rgba(0,122,255,0.12)","#0A84FF","#0A84FF","#64B5FF","rgba(10,132,255,0.20)"],indigo:["#5856D6","#4F46E5","#4338CA","rgba(88,86,214,0.13)","#7D7AFF","#5B52E8","#A9A8FF","rgba(94,92,230,0.22)"],vert:["#34C759","#1E7A34","#1E7A34","rgba(52,199,89,0.14)","#30D158","#248A3D","#5CE27F","rgba(48,209,88,0.20)"],rose:["#FF2D55","#D70036","#C2003A","rgba(255,45,85,0.12)","#FF375F","#E0304F","#FF6482","rgba(255,55,95,0.20)"],orange:["#FF9500","#AC5F00","#AC5F00","rgba(255,149,0,0.14)","#FF9F0A","#C26C00","#FFBE57","rgba(255,159,10,0.20)"],graphite:["#48484A","#3A3A3C","#3A3A3C","rgba(72,72,74,0.12)","#98989D","#636366","#AEAEB2","rgba(152,152,157,0.20)"]};var v=M[a];if(v){var o=s?4:0;var st=document.documentElement.style;st.setProperty("--marque",v[o]);st.setProperty("--marque-bouton",v[o+1]);st.setProperty("--marque-texte",v[o+2]);st.setProperty("--marque-pale",v[o+3]);}}}catch(e){}`;
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
