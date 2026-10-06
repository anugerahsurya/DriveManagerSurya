"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PiCaretLeftBold, PiCaretRightBold } from "react-icons/pi";

/**
 * Di HP: judul besar. Di desktop: toolbar jendela macOS dengan tombol kembali/maju.
 * Toolbar menempel di atas area konten yang bisa digulir.
 */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  const router = useRouter();
  const arrow =
    "grid size-7 place-items-center rounded-[6px] text-ink-2 transition-colors duration-100 hover:bg-[var(--press)] active:bg-[var(--press)]";
  return (
    <header className="sticky top-0 z-10 bg-content/85 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3 backdrop-blur-xl md:flex md:h-[52px] md:items-center md:gap-2 md:border-b md:border-[var(--hairline)] md:bg-window/80 md:px-4 md:py-0">
      <div className="hidden items-center gap-0.5 md:flex">
        <button type="button" aria-label="Kembali" onClick={() => router.back()} className={arrow}>
          <PiCaretLeftBold />
        </button>
        <button type="button" aria-label="Maju" onClick={() => router.forward()} className={arrow}>
          <PiCaretRightBold />
        </button>
      </div>
      <div className="flex items-end justify-between gap-3 md:min-w-0 md:flex-1 md:items-center">
        <div className="min-w-0">
          <h1 className="truncate text-[30px] leading-tight font-extrabold tracking-[-0.02em] md:text-[15px] md:font-bold md:tracking-normal">
            {title}
          </h1>
          {subtitle && <div className="mt-0.5 truncate text-[13px] text-ink-2 md:hidden">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1.5 pb-1 md:pb-0">{actions}</div>}
      </div>
    </header>
  );
}
