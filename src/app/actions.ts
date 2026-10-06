"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { listRecords, patchAccount, refreshAccounts, saveRecords } from "@/lib/accounts";
import { openToken } from "@/lib/crypto";
import { revoke } from "@/lib/google";
import { requireOwner } from "@/lib/session";
import { store } from "@/lib/store";
import type { Avatar, VaultBlob } from "@/lib/types";

const clip = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export async function refreshAction(opts: { ids?: string[]; force?: boolean } = {}) {
  await requireOwner();
  const { refreshed } = await refreshAccounts(opts);
  if (refreshed) revalidatePath("/", "layout");
  return { refreshed };
}

export async function updateProfile(id: string, input: { nickname?: string; note?: string; avatar?: Avatar | null }) {
  await requireOwner();
  const avatar =
    input.avatar && /^[0-9a-z-]{4,80}$/.test(input.avatar.key) && /^#[0-9a-f]{6}$/i.test(input.avatar.bg)
      ? { key: input.avatar.key, bg: input.avatar.bg }
      : undefined;
  await patchAccount(id, (a) => ({
    ...a,
    nickname: clip(input.nickname, 40) || undefined,
    note: clip(input.note, 280) || undefined,
    avatar: input.avatar === null ? undefined : (avatar ?? a.avatar),
  }));
  revalidatePath("/", "layout");
}

export async function removeAccount(id: string) {
  await requireOwner();
  const records = await listRecords();
  const target = records.find((a) => a.id === id);
  if (!target) return;
  await revoke(openToken(target.token));
  await saveRecords(records.filter((a) => a.id !== id));
  await store().del(`snaps:${id}`);
  revalidatePath("/", "layout");
}

export async function setPhoneDone(id: string, done: boolean) {
  await requireOwner();
  await patchAccount(id, (a) => ({ ...a, phoneDoneAt: done ? Date.now() : null }));
  revalidatePath("/nomor-hp");
}

export async function resetPhoneChecklist() {
  await requireOwner();
  const records = await listRecords();
  await saveRecords(records.map((a) => ({ ...a, phoneDoneAt: null })));
  revalidatePath("/nomor-hp");
}

export async function addLinkedApp(id: string, name: string, note?: string) {
  await requireOwner();
  const clean = clip(name, 60);
  if (!clean) return;
  await patchAccount(id, (a) => ({
    ...a,
    apps: [...a.apps, { id: randomUUID().slice(0, 8), name: clean, note: clip(note, 140) || undefined, at: Date.now() }],
  }));
  revalidatePath(`/akun/${id}`);
}

export async function removeLinkedApp(id: string, appId: string) {
  await requireOwner();
  await patchAccount(id, (a) => ({ ...a, apps: a.apps.filter((x) => x.id !== appId) }));
  revalidatePath(`/akun/${id}`);
}

const b64 = /^[A-Za-z0-9+/=_-]+$/;
function validVault(v: VaultBlob) {
  return (
    v?.v === 1 &&
    typeof v.iter === "number" &&
    v.iter >= 100_000 &&
    [v.salt, v.deviceHash, v.check?.iv, v.check?.ct, v.data?.iv, v.data?.ct].every(
      (s) => typeof s === "string" && b64.test(s),
    ) &&
    v.data.ct.length < 400_000
  );
}

/** Server hanya menyimpan ciphertext; tidak pernah melihat master password atau isinya. */
export async function saveVault(blob: VaultBlob, expectedUpdatedAt: number | null) {
  await requireOwner();
  if (!validVault(blob)) throw new Error("Data brankas tidak valid.");
  const current = await store().get<VaultBlob>("vault");
  // Cegah perangkat lain menimpa versi yang lebih baru tanpa sadar.
  if ((current?.updatedAt ?? null) !== expectedUpdatedAt) {
    return { ok: false as const, reason: "conflict" as const };
  }
  const next = { ...blob, updatedAt: Date.now() };
  await store().set("vault", next);
  return { ok: true as const, updatedAt: next.updatedAt };
}

export async function getVault() {
  await requireOwner();
  return store().get<VaultBlob>("vault");
}

export async function deleteVault(confirmation: string) {
  await requireOwner();
  if (confirmation !== "HAPUS BRANKAS") throw new Error("Konfirmasi tidak cocok.");
  await store().del("vault");
}

export async function setTheme(theme: "light" | "dark") {
  await requireOwner();
  (await cookies()).set("dm_theme", theme === "dark" ? "dark" : "light", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
