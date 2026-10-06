"use client";

import { useState } from "react";
import { bytes, pct } from "@/lib/format";

export type Segment = { key: string; label: string; value: number; color: string };

type Props = {
  segments: Segment[];
  /** Kapasitas total. Sisa (total - jumlah segmen) digambar sebagai ruang kosong. */
  total: number;
  height?: number;
  label: string;
};

/** Bar penyimpanan bersegmen ala "About This Mac › Storage", dengan tooltip saat hover/fokus. */
export function SegmentBar({ segments, total, height = 22, label }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const safeTotal = Math.max(total, segments.reduce((s, x) => s + x.value, 0), 1);
  const visible = segments.filter((s) => s.value > 0);

  const placed = visible.map((s, i) => {
    const before = visible.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    return { ...s, left: (before / safeTotal) * 100, width: (s.value / safeTotal) * 100 };
  });
  const tip = active != null ? placed[active] : null;

  return (
    <div className="relative" onPointerLeave={() => setActive(null)}>
      <div
        role="img"
        aria-label={label}
        className="relative flex w-full overflow-hidden rounded-[6px] bg-track"
        style={{ height }}
      >
        <div className="bar-fill flex h-full w-full gap-[2px]">
          {placed.map((s, i) => (
            <span
              key={s.key}
              tabIndex={0}
              aria-label={`${s.label}: ${bytes(s.value)}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="h-full shrink-0 outline-none transition-[filter] duration-150 first:rounded-l-[6px] hover:brightness-110 focus-visible:brightness-110"
              style={{ width: `${s.width}%`, minWidth: 3, background: s.color }}
            />
          ))}
          {/* sisa ruang = track */}
          <span className="h-full flex-1" />
        </div>
      </div>
      {tip && (
        <div
          role="tooltip"
          className="pop-in pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-window px-2.5 py-1.5 text-[12px] shadow-[var(--shadow-pop)]"
          style={{ left: `clamp(60px, ${tip.left + tip.width / 2}%, calc(100% - 60px))` }}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="size-2 rounded-full" style={{ background: tip.color }} />
            {tip.label}
          </div>
          <div className="tnum text-ink-2">
            {bytes(tip.value)} · {pct((tip.value / safeTotal) * 100)}
          </div>
        </div>
      )}
    </div>
  );
}

/** Legenda + tabel nilai (identitas tidak pernah hanya lewat warna). */
export function SegmentLegend({ segments, free }: { segments: Segment[]; free?: number | null }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
      {segments.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
          <span className="max-w-[16ch] truncate">{s.label}</span>
          <span className="tnum text-ink-2">{bytes(s.value)}</span>
        </li>
      ))}
      {free != null && (
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-full bg-track shadow-[inset_0_0_0_0.5px_var(--hairline)]" />
          <span>Tersedia</span>
          <span className="tnum text-ink-2">{bytes(free)}</span>
        </li>
      )}
    </ul>
  );
}
