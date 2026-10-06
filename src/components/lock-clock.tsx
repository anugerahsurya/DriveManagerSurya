"use client";

import { useNow } from "@/lib/use-now";

/** Jam besar di layar kunci macOS. Dirender di klien supaya memakai zona waktu perangkat. */
export function LockClock() {
  const now = useNow();
  return (
    <div className="h-[118px] text-center" aria-hidden>
      {now && (
        <div className="pop-in">
          <div className="text-[17px] font-semibold text-ink-2">
            {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="tnum text-[76px] leading-none font-extrabold tracking-[-0.04em] text-ink/85">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}
    </div>
  );
}
