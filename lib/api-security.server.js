import { NextResponse } from "next/server";

const RATE_LIMITS = globalThis.__peculeApiRateLimits || new Map();
globalThis.__peculeApiRateLimits = RATE_LIMITS;

function reponseErreur(erreur, status, headers = {}) {
  return NextResponse.json(
    { erreur },
    { status, headers: { "cache-control": "no-store", ...headers } }
  );
}

function verifierOrigine(request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    return origin === new URL(request.url).origin ? null : reponseErreur("Origine de requête non autorisée.", 403);
  } catch {
    return reponseErreur("Origine de requête non autorisée.", 403);
  }
}

async function verifierJetonFirebase(request) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!apiKey) return { response: reponseErreur("L’authentification sécurisée n’est pas configurée sur ce serveur.", 503) };
  if (!token) return { response: reponseErreur("Connecte-toi pour utiliser cette fonctionnalité.", 401) };

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    const uid = payload?.users?.[0]?.localId;
    if (!response.ok || !uid) return { response: reponseErreur("Ta session a expiré. Reconnecte-toi puis réessaie.", 401) };
    return { uid };
  } catch {
    return { response: reponseErreur("Impossible de vérifier ta session pour le moment.", 503) };
  }
}

function limiter(scope, uid, limit, windowMs) {
  const now = Date.now();
  const key = `${scope}:${uid}`;
  const current = RATE_LIMITS.get(key);
  const hits = current && now < current.resetAt ? current.hits : 0;
  const resetAt = current && now < current.resetAt ? current.resetAt : now + windowMs;
  if (hits >= limit) {
    return reponseErreur("Trop de demandes. Réessaie dans une minute.", 429, {
      "retry-after": String(Math.max(1, Math.ceil((resetAt - now) / 1000))),
    });
  }
  RATE_LIMITS.set(key, { hits: hits + 1, resetAt });
  return null;
}

/**
 * Garde commune des routes qui manipulent des données financières ou une clé payante.
 * La vérification est faite par Firebase Identity Toolkit côté serveur : l’ID token ne
 * suffit donc pas à lui seul s’il est expiré ou révoqué.
 */
export async function protegerRoute(request, { scope = "api", limit = 20, windowMs = 60_000 } = {}) {
  const origine = verifierOrigine(request);
  if (origine) return { response: origine };

  const session = await verifierJetonFirebase(request);
  if (session.response) return session;

  const bloque = limiter(scope, session.uid, limit, windowMs);
  if (bloque) return { response: bloque };
  return { uid: session.uid };
}

export function reponseSansCache(data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...(init.headers || {}) },
  });
}
