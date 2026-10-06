import "server-only";
import { openToken } from "./crypto";
import { GoogleError, fetchQuota, refreshAccess } from "./google";
import { store } from "./store";
import type { AccountView, Snapshot } from "./types";

export type AccountRecord = AccountView & { googleSub: string; token: string };

const KEY = "accounts";
const STALE_MS = 15 * 60 * 1000;

export async function listRecords(): Promise<AccountRecord[]> {
  return (await store().get<AccountRecord[]>(KEY)) ?? [];
}

export async function saveRecords(records: AccountRecord[]) {
  await store().set(KEY, records);
}

export function toView(record: AccountRecord): AccountView {
  const view: Partial<AccountRecord> = { ...record };
  delete view.token;
  delete view.googleSub;
  return view as AccountView;
}

export async function listAccounts(): Promise<AccountView[]> {
  return (await listRecords()).map(toView);
}

export async function getAccount(id: string): Promise<AccountView | null> {
  const r = (await listRecords()).find((a) => a.id === id);
  return r ? toView(r) : null;
}

/** Ubah satu akun secara atomik di dalam dokumen akun. */
export async function patchAccount(id: string, patch: (a: AccountRecord) => AccountRecord | null) {
  const records = await listRecords();
  const i = records.findIndex((a) => a.id === id);
  if (i < 0) throw new Error("Akun tidak ditemukan.");
  const next = patch(records[i]);
  if (next) records[i] = next;
  else records.splice(i, 1);
  await saveRecords(records);
  return next;
}

/** Slot warna mengikuti akun selamanya (tidak dihitung ulang saat akun lain dihapus). */
export function nextSlot(records: AccountRecord[]) {
  const used = new Set(records.map((a) => a.slot));
  let s = 0;
  while (used.has(s)) s++;
  return s;
}

const jakartaDay = (t: number) => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

export async function getSnapshots(id: string): Promise<Snapshot[]> {
  return (await store().get<Snapshot[]>(`snaps:${id}`)) ?? [];
}

async function pushSnapshot(id: string, usage: number, limit: number | null, at: number) {
  const snaps = await getSnapshots(id);
  const d = jakartaDay(at);
  const last = snaps.at(-1);
  if (last?.d === d) snaps[snaps.length - 1] = { d, u: usage, l: limit };
  else snaps.push({ d, u: usage, l: limit });
  await store().set(`snaps:${id}`, snaps.slice(-90));
}

async function refreshOne(record: AccountRecord): Promise<AccountRecord> {
  try {
    const access = await refreshAccess(openToken(record.token));
    const q = await fetchQuota(access);
    const at = Date.now();
    await pushSnapshot(record.id, q.usage, q.limit, at);
    return { ...record, quota: { ...q, at }, quotaError: undefined };
  } catch (e) {
    const message =
      e instanceof GoogleError && e.revoked
        ? "Akses dicabut atau kedaluwarsa. Sambungkan ulang akun ini."
        : "Gagal membaca kuota dari Google. Coba lagi nanti.";
    console.error("refresh quota", record.email, e);
    return { ...record, quotaError: message };
  }
}

/** Segarkan akun yang datanya basi (atau semua bila force). Paralel, gagal satu tidak menggagalkan lainnya. */
export async function refreshAccounts(opts: { ids?: string[]; force?: boolean } = {}) {
  const records = await listRecords();
  const now = Date.now();
  const due = records.filter(
    (a) => (!opts.ids || opts.ids.includes(a.id)) && (opts.force || !a.quota || now - a.quota.at > STALE_MS),
  );
  if (due.length === 0) return { refreshed: 0, accounts: records.map(toView) };

  const updated = await Promise.all(due.map(refreshOne));
  // Baca ulang sebelum menulis supaya perubahan profil yang terjadi bersamaan tidak tertimpa.
  const latest = await listRecords();
  for (const u of updated) {
    const i = latest.findIndex((a) => a.id === u.id);
    if (i >= 0) latest[i] = { ...latest[i], quota: u.quota, quotaError: u.quotaError };
  }
  await saveRecords(latest);
  return { refreshed: due.length, accounts: latest.map(toView) };
}
