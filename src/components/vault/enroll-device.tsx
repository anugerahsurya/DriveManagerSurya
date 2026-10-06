"use client";

import { useState } from "react";
import { PiDeviceMobileFill } from "react-icons/pi";
import type { VaultBlob } from "@/lib/types";
import { decodeRecovery, deviceHashOf, enrollDevice, type loadDevice } from "@/lib/vault-crypto";

type Device = NonNullable<Awaited<ReturnType<typeof loadDevice>>>;

/** Perangkat belum terdaftar: hanya bisa didaftarkan dengan kode pemulihan. */
export function EnrollDevice({ blob, stale, onEnrolled }: { blob: VaultBlob; stale: boolean; onEnrolled: (d: Device) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw = decodeRecovery(code);
    if (!raw) return setError("Kode harus 32 karakter (8 grup × 4).");
    setBusy(true);
    try {
      if ((await deviceHashOf(raw)) !== blob.deviceHash) {
        setError("Kode pemulihan tidak cocok dengan brankas ini.");
        return;
      }
      onEnrolled(await enrollDevice(raw));
    } finally {
      raw.fill(0);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[460px] px-6 pt-12 pb-10 text-center md:pt-20">
      <span className="mx-auto grid size-20 place-items-center rounded-[20px] bg-[linear-gradient(180deg,#eef0f3,#d5d9df)] text-[#5b6170] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)]">
        <PiDeviceMobileFill aria-hidden className="size-11" />
      </span>
      <h2 className="mt-5 text-[20px] font-bold">Perangkat ini belum terdaftar</h2>
      <p className="mx-auto mt-2 max-w-[40ch] text-[14px] text-ink-2">
        {stale
          ? "Brankas telah dibuat ulang sejak perangkat ini didaftarkan."
          : "Brankas hanya bisa dibuka dari HP yang dipakai saat membuatnya."}{" "}
        Buka dari HP tersebut, atau daftarkan perangkat ini dengan kode pemulihan.
      </p>

      {show ? (
        <form onSubmit={submit} className="pop-in mt-6 space-y-3 text-left">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-2">Kode pemulihan</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="field tnum tracking-wider uppercase"
            />
          </label>
          {error && <p className="text-[13px] text-critical">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !code.trim()}>
            {busy ? "Memeriksa…" : "Daftarkan perangkat ini"}
          </button>
        </form>
      ) : (
        <button type="button" className="btn mt-6" onClick={() => setShow(true)}>
          Saya punya kode pemulihan
        </button>
      )}
    </div>
  );
}
