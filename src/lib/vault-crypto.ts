// Kriptografi brankas, berjalan HANYA di browser.
//
// kunci = HKDF(ikm = rahasia perangkat, salt = PBKDF2(master password, 600k), info)
// - Rahasia perangkat (160 bit) disimpan di IndexedDB sebagai CryptoKey non-extractable,
//   jadi skrip tidak bisa membaca byte-nya kembali.
// - Tanpa perangkat terdaftar (atau kode pemulihan), master password saja tidak cukup.
// - Server hanya menerima ciphertext.

import type { VaultBlob } from "./types";

export const ITERATIONS = 600_000;
const INFO = new TextEncoder().encode("drive-manager/vault/v1");
const CHECK = "drive-manager:ok";

export type VaultEntry = { password?: string; recovery?: string; note?: string; updatedAt?: number };
export type VaultData = { entries: Record<string, VaultEntry> };

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: ArrayBuffer) => new TextDecoder().decode(b);

function toB64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

// ---------- kode pemulihan (Crockford base32) ----------
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function encodeRecovery(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out.match(/.{1,4}/g)!.join("-");
}

export function decodeRecovery(code: string): Uint8Array | null {
  const clean = code
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (clean.length !== 32) return null;
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const c of clean) {
    const v = ALPHABET.indexOf(c);
    if (v < 0) return null;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out.slice(0, 20));
}

// ---------- penyimpanan kunci perangkat (IndexedDB) ----------
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("drive-manager", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("keys");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbDo<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction("keys", mode).objectStore("keys"));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

type StoredDevice = { key: CryptoKey; hash: string };

export const loadDevice = () => idbDo<StoredDevice | undefined>("readonly", (s) => s.get("device"));
export const forgetDevice = () => idbDo("readwrite", (s) => s.delete("device"));

async function hashSecret(raw: Uint8Array) {
  const h = await crypto.subtle.digest("SHA-256", raw as BufferSource);
  return toB64(new Uint8Array(h).slice(0, 12));
}

/** Simpan rahasia perangkat sebagai kunci non-extractable. Byte mentah dibuang setelahnya. */
export async function enrollDevice(raw: Uint8Array): Promise<StoredDevice> {
  const key = await crypto.subtle.importKey("raw", raw as BufferSource, "HKDF", false, ["deriveKey"]);
  const device = { key, hash: await hashSecret(raw) };
  await idbDo("readwrite", (s) => s.put(device, "device"));
  return device;
}

export function newDeviceSecret() {
  return crypto.getRandomValues(new Uint8Array(20));
}

export async function deviceHashOf(raw: Uint8Array) {
  return hashSecret(raw);
}

// ---------- kunci & enkripsi ----------
export async function deriveKey(password: string, salt: Uint8Array, device: CryptoKey, iterations = ITERATIONS) {
  const pw = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, ["deriveBits"]);
  const stretched = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    pw,
    256,
  );
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: stretched, info: INFO },
    device,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function seal(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc(text));
  return { iv: toB64(iv), ct: toB64(ct) };
}

async function open(key: CryptoKey, box: { iv: string; ct: string }) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(box.iv) as BufferSource }, key, fromB64(box.ct) as BufferSource);
  return dec(pt);
}

export async function createVault(password: string, device: StoredDevice) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, device.key);
  const data: VaultData = { entries: {} };
  const blob: VaultBlob = {
    v: 1,
    salt: toB64(salt),
    iter: ITERATIONS,
    deviceHash: device.hash,
    check: await seal(key, CHECK),
    data: await seal(key, JSON.stringify(data)),
    updatedAt: 0,
  };
  return { key, blob, data };
}

export class WrongPassword extends Error {}

export async function unlockVault(blob: VaultBlob, password: string, device: StoredDevice) {
  const key = await deriveKey(password, fromB64(blob.salt), device.key, blob.iter);
  try {
    if ((await open(key, blob.check)) !== CHECK) throw new WrongPassword();
  } catch {
    throw new WrongPassword();
  }
  const data = JSON.parse(await open(key, blob.data)) as VaultData;
  return { key, data };
}

export async function resealVault(blob: VaultBlob, key: CryptoKey, data: VaultData): Promise<VaultBlob> {
  return { ...blob, data: await seal(key, JSON.stringify(data)) };
}
