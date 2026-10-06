"use client";

import { useRef, useState } from "react";
import { PiArrowRightBold } from "react-icons/pi";
import type { Owner } from "@/lib/session-token";
import type { VaultBlob } from "@/lib/types";
import { WrongPassword, unlockVault, type loadDevice } from "@/lib/vault-crypto";
import type { Unlocked } from "./vault-app";

type Device = NonNullable<Awaited<ReturnType<typeof loadDevice>>>;

/** Layar kunci ala login macOS: avatar, nama, kolom password berbentuk pil; getar bila salah. */
export function LockScreen({
  owner,
  blob,
  device,
  onUnlock,
}: {
  owner: Owner;
  blob: VaultBlob;
  device: Device;
  onUnlock: (u: Unlocked) => void;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setError(null);
    try {
      onUnlock(await unlockVault(blob, pw, device));
    } catch (err) {
      setError(err instanceof WrongPassword ? "Password salah" : "Brankas gagal dibuka. Coba lagi.");
      setShake((n) => n + 1);
      setPw("");
      setBusy(false);
      requestAnimationFrame(() => input.current?.focus());
    }
  }

  return (
    <div className="flex flex-col items-center px-6 pt-14 pb-10 text-center md:pt-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={owner.avatar}
        alt=""
        width={96}
        height={96}
        className="size-24 rounded-full shadow-[0_0_0_0.5px_var(--hairline),0_8px_24px_-8px_rgb(0_0_0/0.3)]"
      />
      <h2 className="mt-4 text-[20px] font-bold">{owner.name}</h2>
      <form onSubmit={submit} className="mt-5 w-full max-w-[260px]">
        <div key={shake} className={`relative ${shake ? "shake" : ""}`}>
          <label htmlFor="master" className="sr-only">
            Master password
          </label>
          <input
            ref={input}
            id="master"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Master password"
            disabled={busy}
            className="h-11 w-full rounded-full bg-[var(--press)] pr-12 pl-5 text-[16px] outline-none backdrop-blur-xl placeholder:text-ink-2 focus:shadow-[0_0_0_3px_var(--focus)] md:h-9 md:text-[14px]"
          />
          <button
            type="submit"
            aria-label="Buka brankas"
            disabled={!pw || busy}
            className="press absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-control text-ink shadow-[var(--shadow-control)] disabled:opacity-40 md:size-6"
          >
            {busy ? (
              <span className="spin size-3.5 rounded-full border-2 border-ink-3 border-t-transparent" />
            ) : (
              <PiArrowRightBold aria-hidden className="size-4 md:size-3" />
            )}
          </button>
        </div>
        <p role="status" className={`mt-3 h-5 text-[13px] ${error ? "text-critical" : "text-ink-2"}`}>
          {error ?? (busy ? "Membuka…" : "Masukkan master password")}
        </p>
      </form>
    </div>
  );
}
