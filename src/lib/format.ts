import type { AccountView } from "./types";

const nf1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** Ukuran gaya macOS: basis 1000 (seperti Finder), satu desimal. */
export function bytes(n: number | null | undefined): string {
  if (n == null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let v = n;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${i >= 3 ? nf2.format(v) : nf1.format(v)} ${units[i]}`;
}

export function percent(used: number, limit: number | null | undefined) {
  if (!limit) return null;
  return Math.min(100, (used / limit) * 100);
}

export const pct = (p: number) => `${nf1.format(p)}%`;

const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
export function ago(t: number, now = Date.now()) {
  const s = Math.round((t - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 45) return "baru saja";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}

export const dateLong = (t: number) =>
  new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

export const displayName = (a: Pick<AccountView, "nickname" | "googleName" | "email">) =>
  a.nickname?.trim() || a.googleName || a.email.split("@")[0];

export type Level = "ok" | "warn" | "critical" | "unknown";
export function level(a: AccountView): Level {
  const p = a.quota ? percent(a.quota.usage, a.quota.limit) : null;
  if (p == null) return "unknown";
  if (p >= 90) return "critical";
  if (p >= 75) return "warn";
  return "ok";
}

// Tautan langsung ke halaman Google untuk akun tertentu.
const u = (email: string) => encodeURIComponent(email);
export const googleLinks = {
  drive: (e: string) => `https://drive.google.com/drive/my-drive?authuser=${u(e)}`,
  storage: (e: string) => `https://one.google.com/storage?authuser=${u(e)}`,
  phone: (e: string) => `https://myaccount.google.com/phone?authuser=${u(e)}`,
  recoveryPhone: (e: string) => `https://myaccount.google.com/signinoptions/rescuephone?authuser=${u(e)}`,
  connections: (e: string) => `https://myaccount.google.com/connections?authuser=${u(e)}`,
  security: (e: string) => `https://myaccount.google.com/security?authuser=${u(e)}`,
};

export const logoUrl = (key: string) => `https://cdn.ipaslogo.com/display-512/${key}.webp`;
/** "a746787047a05c50-quokka-2" -> "Quokka 2" */
export const logoName = (key: string) =>
  key
    .replace(/^[0-9a-f]{16}-/, "")
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
