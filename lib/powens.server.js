import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE = "pecule_powens_session";
const API_PREFIX = "/2.0";

export function powensConfig() {
  const domain = process.env.POWENS_DOMAIN?.trim();
  const clientId = process.env.POWENS_CLIENT_ID?.trim();
  const clientSecret = process.env.POWENS_CLIENT_SECRET?.trim();
  const redirectUri = process.env.POWENS_REDIRECT_URI?.trim() || "http://localhost:3013/connexion-bancaire/retour";

  if (!domain || !clientId || !clientSecret) return null;
  if (!/^[a-z0-9-]+\.biapi\.pro$/i.test(domain)) throw new Error("Domaine Powens invalide.");
  if (!/^https?:\/\//.test(redirectUri)) throw new Error("URL de retour Powens invalide.");

  return { domain, clientId, clientSecret, redirectUri };
}

export async function powensFetch(path, { token, method = "GET", body } = {}) {
  const config = powensConfig();
  if (!config) throw new Error("Powens n’est pas configuré sur ce serveur.");

  const response = await fetch(`https://${config.domain}${API_PREFIX}${path}`, {
    method,
    headers: {
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error_description || payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(typeof detail === "string" ? detail : "La connexion Powens a échoué.");
  }
  return payload;
}

function encryptionKey() {
  const config = powensConfig();
  if (!config) throw new Error("Powens n’est pas configuré sur ce serveur.");
  return createHash("sha256").update(config.clientSecret).digest();
}

// The permanent Powens token is kept in an encrypted, HttpOnly cookie for the Sandbox.
// Production will replace this browser-scoped storage with encrypted server-side persistence.
export function sealPowensSession(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const content = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, content].map((part) => part.toString("base64url")).join(".");
}

export function unsealPowensSession(value) {
  if (!value) return null;
  try {
    const [ivRaw, tagRaw, contentRaw] = value.split(".");
    if (!ivRaw || !tagRaw || !contentRaw) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const content = Buffer.concat([decipher.update(Buffer.from(contentRaw, "base64url")), decipher.final()]);
    const session = JSON.parse(content.toString("utf8"));
    return session?.token && session?.state ? session : null;
  } catch {
    return null;
  }
}

export function sameState(a, b) {
  if (!a || !b) return false;
  const one = Buffer.from(a);
  const two = Buffer.from(b);
  return one.length === two.length && timingSafeEqual(one, two);
}

export function sessionCookie(value) {
  return {
    name: COOKIE,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export function powensCookieName() {
  return COOKIE;
}
