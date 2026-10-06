"use client";

import { usePathname } from "next/navigation";
import { PiHardDrivesFill, PiSignOutBold } from "react-icons/pi";
import type { Owner } from "@/lib/session-token";
import { useNow } from "@/lib/use-now";
import { ThemeToggle } from "./theme-toggle";

const fmt = (d: Date) =>
  d
    .toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    .replace(",", "");

const SECTION: [string, string][] = [
  ["/akun", "Akun"],
  ["/brankas", "Brankas"],
  ["/nomor-hp", "Nomor HP"],
  ["/profil", "Profil"],
];

/** Menu bar macOS (desktop lebar saja). */
export function MenuBar({ owner, theme }: { owner: Owner; theme: "light" | "dark" }) {
  const now = useNow();
  const path = usePathname();
  const section = SECTION.find(([p]) => path.startsWith(p))?.[1] ?? "Ringkasan";

  return (
    <header className="fixed inset-x-0 top-0 z-20 hidden h-7 items-center justify-between bg-[var(--menubar)] px-4 text-[13px] shadow-[0_0.5px_0_var(--hairline)] backdrop-blur-2xl backdrop-saturate-150 lg:flex">
      <div className="flex items-center gap-5">
        <PiHardDrivesFill aria-hidden className="size-4" />
        <span className="font-bold">Drive Manager Surya</span>
        <span className="text-ink-2">{section}</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle theme={theme} compact />
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            title={`Keluar dari ${owner.login}`}
            className="grid h-6 place-items-center rounded-[5px] px-1.5 hover:bg-[var(--press)]"
          >
            <PiSignOutBold aria-hidden className="size-[15px]" />
            <span className="sr-only">Keluar</span>
          </button>
        </form>
        <span className="tnum ml-2 min-w-[11ch] text-right" suppressHydrationWarning>
          {now ? fmt(now) : ""}
        </span>
      </div>
    </header>
  );
}
