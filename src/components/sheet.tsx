"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Drawer } from "vaul";

const query = "(min-width: 768px)";
function useDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Lebar sheet di desktop. */
  width?: number;
};

/**
 * Di HP: drawer dari bawah yang bisa diseret (vaul).
 * Di desktop: "sheet" macOS yang turun dari atas jendela.
 */
export function Sheet({ open, onOpenChange, title, description, children, width = 520 }: Props) {
  const desktop = useDesktop();
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={desktop ? "top" : "bottom"}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25 md:bg-black/15" />
        <Drawer.Content
          className={
            desktop
              ? "fixed inset-x-0 top-0 z-50 mx-auto flex max-h-[86dvh] flex-col rounded-b-[14px] bg-window shadow-[var(--shadow-window)] outline-none"
              : "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[16px] bg-window pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-window)] outline-none"
          }
          style={desktop ? { width: `min(${width}px, 94vw)` } : undefined}
        >
          {!desktop && <Drawer.Handle className="mt-2.5 !h-[5px] !w-9 !bg-[var(--hairline)]" />}
          <div className="px-5 pt-4 pb-2 md:pt-5">
            <Drawer.Title className="text-[17px] font-bold md:text-[15px]">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="mt-1 text-[13px] text-ink-2">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
