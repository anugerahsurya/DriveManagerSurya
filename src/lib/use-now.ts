"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 5_000);
  return () => clearInterval(t);
};
// Snapshot per menit supaya tidak me-render ulang tiap tick.
const minute = () => Math.floor(Date.now() / 60_000);

/** Waktu sekarang dibulatkan ke menit; null saat render di server. */
export function useNow(): Date | null {
  const m = useSyncExternalStore(subscribe, minute, () => null);
  return m == null ? null : new Date(m * 60_000);
}
