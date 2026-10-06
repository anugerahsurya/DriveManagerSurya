"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PiMagnifyingGlassBold, PiPlusBold, PiWarningCircleFill } from "react-icons/pi";
import { Avatar } from "@/components/avatar";
import { displayName, level, pct, percent } from "@/lib/format";
import type { Owner } from "@/lib/session-token";
import type { AccountView } from "@/lib/types";
import { APPS, AppIcon, type AppKind } from "./app-icon";
import { TrafficLights } from "./traffic-lights";

const NAV: AppKind[] = ["overview", "vault", "phone", "profile"];

/** Sidebar ala System Settings: traffic lights, pencarian, akun induk, navigasi, lalu akun Drive. */
export function Sidebar({ owner, accounts }: { owner: Owner; accounts: AccountView[] }) {
  const path = usePathname();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const shown = query
    ? accounts.filter((a) => `${displayName(a)} ${a.email}`.toLowerCase().includes(query))
    : accounts;

  const row = (active: boolean) =>
    `flex min-h-[30px] items-center gap-2 rounded-[7px] px-2 text-[13px] transition-colors duration-100 ${
      active ? "bg-accent text-white" : "hover:bg-[var(--press)]"
    }`;

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--sidebar)] backdrop-blur-2xl backdrop-saturate-150">
      <div className="flex h-[52px] shrink-0 items-center px-4">
        <TrafficLights />
      </div>

      <div className="scroll min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        <label className="relative mb-3 block">
          <span className="sr-only">Cari akun</span>
          <PiMagnifyingGlassBold className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari akun"
            className="h-[28px] w-full rounded-[7px] bg-[var(--press)] pr-2 pl-7 text-[13px] outline-none placeholder:text-ink-3 focus:shadow-[0_0_0_3px_var(--focus)]"
          />
        </label>

        <Link href="/profil" className={`${row(path === "/profil")} mb-3 min-h-[46px] py-1.5`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={owner.avatar} alt="" width={30} height={30} className="size-[30px] rounded-full" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-semibold">{owner.name}</span>
            <span className={`block truncate text-[11px] ${path === "/profil" ? "text-white/80" : "text-ink-2"}`}>
              Akun induk · GitHub
            </span>
          </span>
        </Link>

        <nav aria-label="Bagian" className="space-y-px">
          {NAV.filter((k) => k !== "profile").map((k) => {
            const active = k === "overview" ? path === "/" : path.startsWith(APPS[k].href);
            return (
              <Link key={k} href={APPS[k].href} aria-current={active ? "page" : undefined} className={row(active)}>
                <AppIcon kind={k} size={20} />
                {APPS[k].label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 mb-1 flex items-center justify-between px-2 text-[11px] font-semibold text-ink-2">
          <span>Akun Drive</span>
          <span className="tnum">{accounts.length}</span>
        </div>
        <ul className="space-y-px">
          {shown.map((a) => {
            const href = `/akun/${a.id}`;
            const active = path === href;
            const p = a.quota ? percent(a.quota.usage, a.quota.limit) : null;
            const lv = level(a);
            return (
              <li key={a.id}>
                <Link href={href} aria-current={active ? "page" : undefined} className={row(active)}>
                  <Avatar account={a} size={20} />
                  <span className="min-w-0 flex-1 truncate">{displayName(a)}</span>
                  {a.quotaError ? (
                    <PiWarningCircleFill
                      aria-label="Perlu disambung ulang"
                      className={active ? "text-white" : "text-critical"}
                    />
                  ) : p != null ? (
                    <span
                      className={`tnum text-[11px] ${
                        active ? "text-white/85" : lv === "critical" ? "font-semibold text-critical" : "text-ink-2"
                      }`}
                    >
                      {pct(p)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
          {query && shown.length === 0 && <li className="px-2 py-1 text-[12px] text-ink-2">Tidak ada akun cocok.</li>}
        </ul>
        <a href="/api/google/connect" className={`${row(false)} mt-1 text-accent`}>
          <span className="grid size-5 place-items-center">
            <PiPlusBold />
          </span>
          Sambungkan akun Google
        </a>
      </div>
    </aside>
  );
}
