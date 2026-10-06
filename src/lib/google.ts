import "server-only";
import { env } from "./env";

const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";

export function googleAuthUrl(redirectUri: string, state: string, loginHint?: string) {
  const params = new URLSearchParams({
    client_id: env.googleId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["openid", "email", "profile", env.driveScope()].join(" "),
    access_type: "offline",
    // consent memaksa Google mengirim refresh_token setiap kali, juga saat menyambung ulang.
    prompt: "consent select_account",
    include_granted_scopes: "true",
    state,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `${AUTH}?${params}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; error?: string };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.googleId(), client_secret: env.googleSecret(), ...body }),
    cache: "no-store",
  });
  const json = (await res.json()) as TokenResponse & { error_description?: string };
  if (!res.ok) throw new GoogleError(json.error ?? `HTTP ${res.status}`, json.error_description);
  return json;
}

export class GoogleError extends Error {
  constructor(public code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
  }
  /** Token dicabut / kedaluwarsa: pengguna harus menyambungkan ulang. */
  get revoked() {
    return this.code === "invalid_grant" || this.code === "unauthorized_client";
  }
}

export const exchangeCode = (code: string, redirectUri: string) =>
  tokenRequest({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });

export const refreshAccess = (refreshToken: string) =>
  tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" }).then((t) => t.access_token);

export async function userInfo(accessToken: string) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleError(`userinfo ${res.status}`);
  return (await res.json()) as { sub: string; email: string; name?: string; picture?: string };
}

export type RawQuota = { limit: number | null; usage: number; drive: number; trash: number };

export async function fetchQuota(accessToken: string): Promise<RawQuota> {
  const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleError(`drive ${res.status}`, await res.text());
  const { storageQuota: q } = (await res.json()) as {
    storageQuota: { limit?: string; usage?: string; usageInDrive?: string; usageInDriveTrash?: string };
  };
  return {
    // limit tidak ada pada akun tanpa batas (sebagian akun Workspace).
    limit: q.limit ? Number(q.limit) : null,
    usage: Number(q.usage ?? 0),
    drive: Number(q.usageInDrive ?? 0),
    trash: Number(q.usageInDriveTrash ?? 0),
  };
}

export async function revoke(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(
    () => undefined,
  );
}
