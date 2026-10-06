"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { PiMagnifyingGlassBold, PiShuffleBold } from "react-icons/pi";
import { logoName, logoUrl } from "@/lib/format";
import type { Avatar } from "@/lib/types";

type Logo = [key: string, bg: string];

// Katalog (~150 KB) hanya diunduh saat pemilih dibuka, lalu disimpan untuk dipakai lagi.
let catalog: Promise<Logo[]> | null = null;
const loadCatalog = () =>
  (catalog ??= fetch("/logos.json", { cache: "force-cache" })
    .then((r) => r.json() as Promise<Logo[]>)
    .catch((e) => {
      catalog = null;
      throw e;
    }));

const PAGE = 48;

/** Memilih maskot dari ipaslogo.com. */
export function AvatarPicker({ value, onChange }: { value?: Avatar; onChange: (a: Avatar) => void }) {
  const [logos, setLogos] = useState<Logo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [seed, setSeed] = useState(0);
  const query = useDeferredValue(q.trim().toLowerCase());

  useEffect(() => {
    loadCatalog().then(setLogos, () => setFailed(true));
  }, []);

  const list = useMemo(() => {
    if (!logos) return [];
    if (query) return logos.filter(([k]) => k.slice(17).includes(query.replace(/\s+/g, "-")));
    if (!seed) return logos;
    // Acak deterministik per seed (Fisher–Yates dengan LCG sederhana).
    const out = [...logos];
    let s = seed;
    for (let i = out.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, [logos, query, seed]);

  return (
    <div>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Cari maskot</span>
          <PiMagnifyingGlassBold className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3 md:left-2.5 md:size-3.5" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Cari maskot, mis. fox, owl, robot"
            className="field !pl-9 md:!pl-8"
          />
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setQ("");
            setSeed((Math.random() * 2 ** 31) | 0 || 1);
            setLimit(PAGE);
          }}
        >
          <PiShuffleBold aria-hidden />
          <span className="hidden sm:inline">Acak</span>
          <span className="sr-only sm:hidden">Acak</span>
        </button>
      </div>

      <div className="mt-3 min-h-[200px]">
        {failed ? (
          <p className="py-8 text-center text-[13px] text-ink-2">Katalog maskot gagal dimuat. Periksa koneksi.</p>
        ) : !logos ? (
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-7">
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} className="aspect-square animate-pulse rounded-full bg-track" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-2">Tidak ada maskot “{q}”.</p>
        ) : (
          <>
            <ul role="listbox" aria-label="Maskot" className="grid grid-cols-5 gap-2.5 sm:grid-cols-7">
              {list.slice(0, limit).map(([key, bg]) => {
                const selected = value?.key === key;
                return (
                  <li key={key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      title={logoName(key)}
                      onClick={() => onChange({ key, bg })}
                      className={`press relative block aspect-square w-full overflow-hidden rounded-full transition-shadow duration-150 ${
                        selected
                          ? "shadow-[0_0_0_2.5px_var(--window),0_0_0_5px_var(--accent)]"
                          : "shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)] hover:shadow-[0_0_0_2px_var(--window),0_0_0_3.5px_var(--hairline)]"
                      }`}
                      style={{ background: bg }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl(key)} alt={logoName(key)} loading="lazy" decoding="async" className="size-full object-cover" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {limit < list.length && (
              <div className="mt-3 flex justify-center">
                <button type="button" className="btn btn-plain" onClick={() => setLimit((l) => l + PAGE)}>
                  Tampilkan lebih banyak ({list.length - limit} lagi)
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <p className="mt-2 text-[11px] text-ink-2">
        Maskot dari{" "}
        <a href="https://ipaslogo.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          ipaslogo.com
        </a>
        .
      </p>
    </div>
  );
}
