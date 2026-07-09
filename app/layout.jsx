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
  themeColor: "#F6F6FA",
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
