"use client";

import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { PiArrowSquareOutBold, PiCheckBold, PiCopyBold, PiInfoBold } from "react-icons/pi";
import { toast } from "sonner";
import { resetPhoneChecklist, setPhoneDone } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { displayName, googleLinks } from "@/lib/format";
import type { AccountView } from "@/lib/types";

// Nomor baru disimpan hanya di perangkat ini (localStorage), tidak dikirim ke server.
const LOCAL_KEY = "dm:new-phone";
let memory = "";
const listeners = new Set<() => void>();
const subscribeLocal = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const readLocal = () => {
  try {
    return localStorage.getItem(LOCAL_KEY) ?? memory;
  } catch {
    return memory;
  }
};
const saveNumber = (v: string) => {
  memory = v;
  try {
    localStorage.setItem(LOCAL_KEY, v);
  } catch {}
  listeners.forEach((l) => l());
};

/**
 * Google tidak punya API untuk mengganti nomor akun pribadi. Jadi ini alur cepat:
 * salin nomor baru → buka halaman telepon akun itu → tempel → centang selesai.
 */
export function PhoneChecklist({ accounts }: { accounts: AccountView[] }) {
  const number = useSyncExternalStore(subscribeLocal, readLocal, () => "");
  const [done, setDone] = useOptimistic(
    Object.fromEntries(accounts.map((a) => [a.id, !!a.phoneDoneAt])),
    (state, [id, v]: [string, boolean]) => ({ ...state, [id]: v }),
  );
  const [, start] = useTransition();


  const total = accounts.length;
  const finished = accounts.filter((a) => done[a.id]).length;
  const next = accounts.find((a) => !done[a.id]);

  const toggle = (id: string, v: boolean) =>
    start(async () => {
      setDone([id, v]);
      await setPhoneDone(id, v);
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number.trim());
      toast.success("Nomor baru disalin");
    } catch {
      toast.error("Tidak bisa menyalin. Salin manual dari kolom.");
    }
  };

  if (total === 0) {
    return <div className="group-box p-4 text-[14px] text-ink-2">Belum ada akun untuk diperbarui.</div>;
  }

  return (
    <div className="space-y-7 pb-6">
      <div className="group-box flex gap-3 p-4 text-[13px]">
        <PiInfoBold aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-ink-2">
          Google tidak mengizinkan aplikasi lain mengganti nomor akun Anda. Tombol <b className="text-ink">Buka</b> membawa
          Anda langsung ke halaman nomor telepon akun yang tepat; Anda cukup tempel nomor baru dan verifikasi kode SMS di
          sana.
        </p>
      </div>

      <section aria-labelledby="newnum">
        <h2 id="newnum" className="group-title">
          Nomor baru
        </h2>
        <div className="group-box flex items-center gap-2 p-3">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={number}
            onChange={(e) => saveNumber(e.target.value)}
            placeholder="+62 8xx xxxx xxxx"
            className="field tnum flex-1"
          />
          <button type="button" className="btn" disabled={!number.trim()} onClick={copy}>
            <PiCopyBold aria-hidden />
            Salin
          </button>
        </div>
        <p className="mt-2 px-1 text-[12px] text-ink-2">Disimpan hanya di perangkat ini.</p>
      </section>

      <section aria-labelledby="progress">
        <div className="flex items-baseline justify-between px-1 pb-2">
          <h2 id="progress" className="text-[13px] font-semibold text-ink-2">
            Akun
          </h2>
          <span className="tnum text-[13px] text-ink-2">
            <b className="text-ink">{finished}</b> dari {total} selesai
          </span>
        </div>
        <div className="mb-3 h-[6px] overflow-hidden rounded-full bg-track">
          <div
            className="h-full origin-left rounded-full bg-good transition-transform duration-500 ease-[var(--ease-out)]"
            style={{ transform: `scaleX(${total ? finished / total : 0})` }}
          />
        </div>

        <div className="group-box">
          {accounts.map((a) => {
            const isDone = done[a.id];
            const isNext = next?.id === a.id;
            return (
              <div key={a.id} className={`group-row ${isNext ? "bg-accent-soft" : ""}`}>
                {/* Checkbox ala macOS */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`Tandai ${displayName(a)} selesai`}
                  onClick={() => toggle(a.id, !isDone)}
                  className={`press grid size-[22px] shrink-0 place-items-center rounded-[6px] transition-colors duration-150 md:size-[18px] md:rounded-[5px] ${
                    isDone ? "bg-accent text-white" : "bg-field shadow-[inset_0_0_0_1px_var(--hairline),0_1px_1px_rgb(0_0_0/0.06)]"
                  }`}
                >
                  <PiCheckBold
                    aria-hidden
                    className={`size-3.5 transition-[opacity,transform] duration-150 ease-[var(--ease-out)] md:size-3 ${
                      isDone ? "scale-100 opacity-100" : "scale-50 opacity-0"
                    }`}
                  />
                </button>
                <Avatar account={a} size={32} />
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-semibold ${isDone ? "text-ink-2 line-through decoration-[1.5px]" : ""}`}>
                    {displayName(a)}
                  </div>
                  <div className="truncate text-[12px] text-ink-2">{a.email}</div>
                </div>
                <a
                  href={googleLinks.phone(a.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn shrink-0 ${isNext ? "btn-primary" : ""}`}
                >
                  Buka
                  <PiArrowSquareOutBold aria-hidden className="size-3.5" />
                </a>
              </div>
            );
          })}
        </div>
        <p className="mt-2 px-1 text-[12px] text-ink-2">
          Nomor pemulihan diatur terpisah:{" "}
          {next ? (
            <a
              href={googleLinks.recoveryPhone(next.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              buka untuk {displayName(next)}
            </a>
          ) : (
            "buka dari halaman tiap akun."
          )}
        </p>
      </section>

      {finished > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-plain"
            onClick={() =>
              start(async () => {
                await resetPhoneChecklist();
                toast("Daftar diulang dari awal");
              })
            }
          >
            Ulangi daftar dari awal
          </button>
        </div>
      )}
    </div>
  );
}
