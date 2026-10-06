import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env";

// Enkripsi refresh token Google saat disimpan (AES-256-GCM).
// Server memang perlu membacanya untuk mengambil kuota, jadi ini enkripsi at-rest,
// bukan zero-knowledge seperti brankas password.

function key() {
  const k = Buffer.from(env.tokenKey(), "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY harus 32 byte dalam base64.");
  return k;
}

export function sealToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function openToken(sealed: string): string {
  const [v, iv, tag, ct] = sealed.split(".");
  if (v !== "v1") throw new Error("Format token tidak dikenal.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}
