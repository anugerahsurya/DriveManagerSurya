"use client";

import { useOptimistic, useTransition } from "react";
import { PiMoonBold, PiSunBold } from "react-icons/pi";
import { setTheme } from "@/app/actions";

type Theme = "light" | "dark";

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
}

/** Terang adalah default; gelap hanya bila dipilih di sini. */
export function ThemeToggle({ theme, compact = false }: { theme: Theme; compact?: boolean }) {
  const [current, setCurrent] = useOptimistic(theme);
  const [, start] = useTransition();

  const choose = (t: Theme) =>
    start(async () => {
      setCurrent(t);
      apply(t);
      await setTheme(t);
    });

  if (compact) {
    const next = current === "dark" ? "light" : "dark";
    return (
      <button
        type="button"
        onClick={() => choose(next)}
        title={current === "dark" ? "Pakai tampilan terang" : "Pakai tampilan gelap"}
        className="grid h-6 place-items-center rounded-[5px] px-1.5 hover:bg-[var(--press)]"
      >
        {current === "dark" ? <PiSunBold className="size-[15px]" /> : <PiMoonBold className="size-[15px]" />}
        <span className="sr-only">Ganti tampilan</span>
      </button>
    );
  }

  // Segmented control ala macOS
  return (
    <div role="radiogroup" aria-label="Tampilan" className="relative inline-grid grid-cols-2 rounded-[8px] bg-[var(--press)] p-[2px]">
      <span
        aria-hidden
        className="absolute top-[2px] bottom-[2px] left-[2px] w-[calc(50%-2px)] rounded-[6px] bg-control shadow-[var(--shadow-control)] transition-transform duration-200 ease-[var(--ease-out)]"
        style={{ transform: current === "dark" ? "translateX(100%)" : "none" }}
      />
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={current === t}
          onClick={() => choose(t)}
          className="relative z-10 flex h-8 items-center justify-center gap-1.5 px-4 text-[13px] font-medium md:h-7"
        >
          {t === "light" ? <PiSunBold aria-hidden /> : <PiMoonBold aria-hidden />}
          {t === "light" ? "Terang" : "Gelap"}
        </button>
      ))}
    </div>
  );
}
