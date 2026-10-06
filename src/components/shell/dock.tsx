"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APPS, AppIcon, type AppKind } from "./app-icon";

const ORDER: AppKind[] = ["overview", "vault", "phone", "profile"];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" || path.startsWith("/akun") : path.startsWith(href);
}

/** Dock macOS: navigasi utama di HP, peluncur di desktop. Magnifikasi murni CSS (hanya pointer halus). */
export function Dock() {
  const path = usePathname();
  const [bouncing, setBouncing] = useState<string | null>(null);

  const item = (kind: AppKind, external = false) => {
    const app = APPS[kind];
    const active = !external && isActive(path, app.href);
    const content = (
      <>
        <span
          className="dock-icon block"
          style={bouncing === kind ? { animation: "dock-bounce 620ms var(--ease-out)" } : undefined}
          onAnimationEnd={() => setBouncing(null)}
        >
          <span className="block size-[46px] md:size-[50px]">
            <AppIcon kind={kind} size={46} />
          </span>
        </span>
        <span className="dock-label pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[var(--menubar)] px-2 py-0.5 text-[12px] font-medium shadow-[var(--shadow-pop)] backdrop-blur-xl md:block">
          {app.label}
        </span>
        <span
          aria-hidden
          className={`absolute -bottom-[7px] left-1/2 size-[4px] -translate-x-1/2 rounded-full bg-ink/70 transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
        />
        <span className="sr-only md:hidden">{app.label}</span>
      </>
    );
    const props = {
      "aria-label": app.label,
      "aria-current": active ? ("page" as const) : undefined,
      className: "dock-item relative flex flex-col items-center",
      onClick: () => !active && setBouncing(kind),
    };
    return (
      <li key={kind}>
        {external ? (
          <a href={app.href} {...props}>
            {content}
          </a>
        ) : (
          <Link href={app.href} {...props}>
            {content}
          </Link>
        )}
      </li>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(10px,env(safe-area-inset-bottom))] md:pb-2"
    >
      <ul className="dock flex items-end gap-3 rounded-[22px] bg-[var(--dock)] px-3 pt-2.5 pb-3 shadow-[0_0_0_0.5px_var(--hairline),0_10px_30px_-8px_rgb(20_30_50/0.3)] backdrop-blur-2xl backdrop-saturate-150 md:gap-2 md:px-2 md:pt-2 md:pb-2.5">
        {ORDER.map((k) => item(k))}
        <li aria-hidden className="mx-0.5 h-11 w-px self-center bg-[var(--separator)]" />
        {item("add", true)}
      </ul>
      <style>{`
        .dock-icon { transform-origin: 50% 100%; transition: transform 220ms var(--ease-out); }
        .dock-item:active .dock-icon { transform: scale(0.92); transition-duration: 100ms; }
        .dock-label { opacity: 0; transition: opacity 120ms var(--ease-out); }
        @media (hover: hover) and (pointer: fine) {
          .dock-item:hover .dock-icon { transform: scale(1.32) translateY(-4px); }
          .dock li:has(+ li > .dock-item:hover) .dock-icon,
          .dock li:has(> .dock-item:hover) + li .dock-icon { transform: scale(1.14) translateY(-2px); }
          .dock-item:hover .dock-label { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dock-item:hover .dock-icon { transform: none; }
        }
      `}</style>
    </nav>
  );
}
