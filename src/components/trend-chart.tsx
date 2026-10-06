"use client";

import { useRef, useState } from "react";
import { bytes } from "@/lib/format";
import type { Snapshot } from "@/lib/types";

const W = 600;
const H = 160;
const PAD = { t: 12, r: 8, b: 22, l: 8 };

const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });

/** Garis penggunaan harian. Satu seri: tanpa legenda, judul grup yang menamainya. */
export function TrendChart({ data }: { data: Snapshot[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <p className="px-1 py-6 text-center text-[13px] text-ink-2">
        Grafik muncul setelah data terkumpul minimal 2 hari. Data diambil otomatis setiap hari.
      </p>
    );
  }

  const values = data.map((d) => d.u);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max - min < 1) {
    min -= 1e9;
    max += 1e9;
  }
  const span = max - min;
  min = Math.max(0, min - span * 0.15);
  max = max + span * 0.15;

  const x = (i: number) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.u).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${H - PAD.b}L${x(0)},${H - PAD.b}Z`;
  const ticks = [max - (max - min) * 0.1, (max + min) / 2, min + (max - min) * 0.1];

  function onMove(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const h = hover != null ? data[hover] : null;
  const prev = hover ? data[hover - 1] : null;
  const delta = h && prev ? h.u - prev.u : null;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[160px] w-full touch-pan-y"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Penggunaan penyimpanan ${data.length} hari terakhir, dari ${bytes(values[0])} ke ${bytes(values.at(-1))}`}
      >
        {ticks.map((t) => (
          <line
            key={t}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--separator)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill="var(--s0)" opacity={0.08} />
        <path d={line} fill="none" stroke="var(--s0)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="var(--text-3)"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Label sumbu sebagai HTML agar tidak ikut tergencet preserveAspectRatio. */}
      <div className="pointer-events-none absolute inset-x-2 top-0 h-[138px] text-[11px] text-ink-3">
        {ticks.map((t) => (
          <span key={t} className="tnum absolute right-0 -translate-y-full pb-0.5" style={{ top: `${(y(t) / H) * 160}px` }}>
            {bytes(t)}
          </span>
        ))}
      </div>
      <div className="flex justify-between px-2 text-[11px] text-ink-3">
        <span>{dayLabel(data[0].d)}</span>
        <span>{dayLabel(data.at(-1)!.d)}</span>
      </div>

      {h && hover != null && (
        <>
          <span
            className="pointer-events-none absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-window"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.u) / H) * 160}px`, background: "var(--s0)" }}
          />
          <div
            role="tooltip"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-window px-2.5 py-1.5 text-[12px] shadow-[var(--shadow-pop)]"
            style={{ left: `clamp(64px, ${(x(hover) / W) * 100}%, calc(100% - 64px))` }}
          >
            <div className="font-semibold">{dayLabel(h.d)}</div>
            <div className="tnum">{bytes(h.u)}</div>
            {delta != null && (
              <div className="tnum text-ink-2">
                {delta >= 0 ? "+" : "−"}
                {bytes(Math.abs(delta))} dari hari sebelumnya
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
