"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { PiArrowClockwiseBold } from "react-icons/pi";
import { toast } from "sonner";
import { refreshAction } from "@/app/actions";

/**
 * Halaman langsung tampil dengan data tersimpan; kuota yang basi (>15 menit)
 * disegarkan di latar belakang setelah halaman terlihat, jadi muat awal tetap cepat.
 */
export function AutoRefresh() {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    refreshAction().then(({ refreshed }) => refreshed && router.refresh(), () => undefined);
  }, [router]);
  return null;
}

export function RefreshButton({ ids, label = "Segarkan" }: { ids?: string[]; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await refreshAction({ ids, force: true });
            router.refresh();
            toast.success("Data kuota diperbarui");
          } catch {
            toast.error("Gagal menyegarkan. Periksa koneksi lalu coba lagi.");
          }
        })
      }
      className="btn"
      title={label}
    >
      <PiArrowClockwiseBold aria-hidden className={pending ? "spin" : ""} />
      <span className="hidden sm:inline">{pending ? "Menyegarkan…" : label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}
