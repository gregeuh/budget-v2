/** @type {import('next').NextConfig} */
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
  // Proxy du gestionnaire d'authentification Firebase sur le domaine de l'app.
  // Indispensable pour que la connexion Google fonctionne sur tous les navigateurs
  // (Safari, Arc…) quand NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = domaine Vercel.
  async rewrites() {
    if (!projectId) return [];
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${projectId}.firebaseapp.com/__/auth/:path*`,
      },
      {
        source: "/__/firebase/:path*",
        destination: `https://${projectId}.firebaseapp.com/__/firebase/:path*`,
      },
    ];
  },
};
export default nextConfig;
