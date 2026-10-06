"use client";

import { useState, useSyncExternalStore } from "react";
import { PiCopyBold, PiDeviceMobileFill, PiFingerprintFill, PiLockKeyFill, PiWarningFill } from "react-icons/pi";
import { toast } from "sonner";
import { saveVault } from "@/app/actions";
import type { VaultBlob } from "@/lib/types";
import { createVault, encodeRecovery, enrollDevice, newDeviceSecret, type loadDevice } from "@/lib/vault-crypto";
import type { Unlocked } from "./vault-app";

type Device = NonNullable<Awaited<ReturnType<typeof loadDevice>>>;

const usePhone = () =>
  useSyncExternalStore(
    () => () => {},
    () => matchMedia("(pointer: coarse)").matches,
    () => true,
  );

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const LABELS = ["Terlalu lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"];

export function SetupVault({ onDone }: { onDone: (b: VaultBlob, d: Device, u: Unlocked) => void }) {
  const phone = usePhone();
  const [step, setStep] = useState<"intro" | "password" | "recovery">("intro");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; blob: VaultBlob; device: Device; unlocked: Unlocked } | null>(null);
  const [saved, setSaved] = useState(false);

  const s = strength(pw);
  const valid = pw.length >= 10 && pw === pw2;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      const raw = newDeviceSecret();
      const code = encodeRecovery(raw);
      const device = await enrollDevice(raw);
      raw.fill(0);
      const { key, blob, data } = await createVault(pw, device);
      setResult({ code, blob, device, unlocked: { key, data } });
      setPw("");
      setPw2("");
      setStep("recovery");
    } catch {
      toast.error("Browser ini tidak mendukung enkripsi yang dibutuhkan.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!result) return;
    setBusy(true);
    try {
      const res = await saveVault(result.blob, null);
      if (!res.ok) {
        toast.error("Brankas sudah dibuat dari perangkat lain. Muat ulang halaman.");
        return;
      }
      onDone({ ...result.blob, updatedAt: res.updatedAt }, result.device, result.unlocked);
      toast.success("Brankas siap");
    } catch {
      toast.error("Gagal menyimpan brankas. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[520px] px-4 pt-6 pb-10 md:pt-12">
      {step === "intro" && (
        <div className="text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-[20px] bg-[linear-gradient(180deg,#5d636e,#2c3038)] text-[#f6d36b] shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
            <PiLockKeyFill aria-hidden className="size-11" />
          </span>
          <h2 className="mt-5 text-[22px] font-bold">Siapkan brankas password</h2>
          <p className="mx-auto mt-2 max-w-[42ch] text-[14px] text-ink-2">
            Password akun dienkripsi di perangkat ini sebelum dikirim. Server hanya menyimpan data acak yang tidak bisa
            dibaca, termasuk oleh Vercel.
          </p>
          <ul className="group-box mt-6 text-left text-[14px]">
            <li className="group-row items-start">
              <PiFingerprintFill aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>Butuh dua hal untuk membuka: master password Anda dan kunci rahasia yang tersimpan di perangkat ini.</span>
            </li>
            <li className="group-row items-start">
              <PiDeviceMobileFill aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>Perangkat lain (mis. laptop) tidak bisa membuka brankas walau tahu master password-nya.</span>
            </li>
          </ul>
          {!phone && (
            <p className="mt-4 flex items-start gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] p-3 text-left text-[13px]">
              <PiWarningFill aria-hidden className="mt-0.5 shrink-0 text-warning" />
              <span>
                Anda sedang di komputer. Brankas akan terikat ke perangkat yang dipakai saat ini. Untuk akses lewat HP saja,
                buka halaman ini dari HP Anda.
              </span>
            </p>
          )}
          <button type="button" className="btn btn-primary mt-6 w-full sm:w-auto" onClick={() => setStep("password")}>
            Buat master password
          </button>
        </div>
      )}

      {step === "password" && (
        <form onSubmit={create} className="pop-in space-y-4">
          <div>
            <h2 className="text-[20px] font-bold">Master password</h2>
            <p className="mt-1 text-[14px] text-ink-2">
              Minimal 10 karakter. Tidak bisa dipulihkan oleh siapa pun bila lupa, jadi pakai kalimat yang mudah Anda ingat.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-2">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="field"
            />
          </label>
          <div aria-live="polite" className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-colors duration-200"
                  style={{
                    background:
                      pw && i < Math.max(1, s)
                        ? s <= 1
                          ? "var(--critical)"
                          : s === 2
                            ? "var(--warning)"
                            : "var(--good)"
                        : "var(--track)",
                  }}
                />
              ))}
            </div>
            <span className="w-[10ch] text-right text-[12px] text-ink-2">{pw ? LABELS[s] : ""}</span>
          </div>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-2">Ulangi password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="field"
              aria-invalid={!!pw2 && pw !== pw2}
            />
          </label>
          {pw2 && pw !== pw2 && <p className="text-[13px] text-critical">Password belum sama.</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn" onClick={() => setStep("intro")}>
              Kembali
            </button>
            <button type="submit" className="btn btn-primary" disabled={!valid || busy}>
              {busy ? "Membuat kunci…" : "Lanjut"}
            </button>
          </div>
        </form>
      )}

      {step === "recovery" && result && (
        <div className="pop-in space-y-4">
          <div>
            <h2 className="text-[20px] font-bold">Simpan kode pemulihan</h2>
            <p className="mt-1 text-[14px] text-ink-2">
              Bila HP ini hilang atau direset, kode ini satu-satunya cara mendaftarkan perangkat baru. Kode hanya
              ditampilkan sekali. Tulis di kertas atau simpan di password manager lain.
            </p>
          </div>
          <div className="group-box p-4">
            <p className="tnum grid grid-cols-4 gap-x-3 gap-y-2 text-center text-[17px] font-bold tracking-[0.08em] select-all md:text-[15px]">
              {result.code.split("-").map((g, i) => (
                <span key={i}>{g}</span>
              ))}
            </p>
          </div>
          <button
            type="button"
            className="btn w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result.code);
                toast.success("Kode pemulihan disalin");
              } catch {
                toast.error("Tidak bisa menyalin. Tulis kode secara manual.");
              }
            }}
          >
            <PiCopyBold aria-hidden />
            Salin kode
          </button>
          <label className="flex items-start gap-3 py-1 text-[14px]">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
            Saya sudah menyimpan kode ini di tempat yang aman.
          </label>
          <button type="button" className="btn btn-primary w-full" disabled={!saved || busy} onClick={finish}>
            {busy ? "Menyimpan…" : "Selesai"}
          </button>
        </div>
      )}
    </div>
  );
}
