import { NextResponse } from "next/server";
import { powensConfig, powensFetch, sealPowensSession, sessionCookie } from "@/lib/powens.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const config = powensConfig();
    if (!config) {
      return NextResponse.json({ erreur: "La connexion bancaire n’est pas encore configurée sur ce serveur." }, { status: 503 });
    }

    // Client credentials are used exclusively on this server to make the Powens user permanent.
    const user = await powensFetch("/auth/init", {
      method: "POST",
      body: { client_id: config.clientId, client_secret: config.clientSecret },
    });
    const temporary = await powensFetch("/auth/token/code?type=singleAccess", { token: user.auth_token });
    const state = crypto.randomUUID();
    const query = new URLSearchParams({
      domain: config.domain,
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      code: temporary.code,
      state,
    });
    const response = NextResponse.json({ url: `https://webview.powens.com/fr/connect?${query}` });
    const cookie = sessionCookie(sealPowensSession({ token: user.auth_token, idUser: user.id_user, state }));
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("Powens connect:", error);
    return NextResponse.json({ erreur: "Impossible de préparer la connexion bancaire. Réessaie dans un instant." }, { status: 502 });
  }
}
