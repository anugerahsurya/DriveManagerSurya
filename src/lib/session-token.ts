import { SignJWT, jwtVerify } from "jose";

// Dipakai juga oleh proxy.ts, jadi tidak boleh mengimpor next/headers.

export const SESSION_COOKIE = "dm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type Owner = { id: string; login: string; name: string; avatar: string };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET minimal 32 karakter.");
  return new TextEncoder().encode(secret);
}

function isAllowed(id: string, login: string) {
  const allowedId = process.env.ALLOWED_GITHUB_ID;
  if (allowedId) return allowedId === id;
  return (process.env.ALLOWED_GITHUB_LOGIN ?? "").toLowerCase() === login.toLowerCase();
}

export async function signSession(owner: Owner) {
  return new SignJWT({ login: owner.login, name: owner.name, avatar: owner.avatar })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(owner.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<Owner | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const owner: Owner = {
      id: String(payload.sub),
      login: String(payload.login),
      name: String(payload.name ?? payload.login),
      avatar: String(payload.avatar ?? ""),
    };
    // Cek ulang: bila pemilik di env diganti, sesi lama langsung tidak berlaku.
    return isAllowed(owner.id, owner.login) ? owner : null;
  } catch {
    return null;
  }
}

export { isAllowed };
