import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { ConnectNotice } from "@/components/connect-notice";
import { Dock } from "@/components/shell/dock";
import { MenuBar } from "@/components/shell/menubar";
import { Sidebar } from "@/components/shell/sidebar";
import { listAccounts } from "@/lib/accounts";
import { requireOwner } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const owner = await requireOwner();
  const [accounts, jar] = await Promise.all([listAccounts(), cookies()]);
  const theme = jar.get("dm_theme")?.value === "dark" ? "dark" : "light";

  return (
    <>
      <MenuBar owner={owner} theme={theme} />

      {/*
        HP: tanpa bingkai jendela, konten mengalir, Dock di bawah.
        md: jendela memenuhi layar dengan sidebar.
        lg: jendela melayang di atas wallpaper, di antara menu bar dan Dock.
      */}
      <div className="window-open md:fixed md:inset-0 md:flex md:overflow-hidden md:bg-window lg:inset-x-6 lg:top-[44px] lg:bottom-[92px] lg:mx-auto lg:max-w-[1180px] lg:rounded-[12px] lg:shadow-[var(--shadow-window)] lg:[contain:paint]">
        <div className="hidden md:flex">
          <Sidebar owner={owner} accounts={accounts} />
        </div>
        <main className="scroll min-h-dvh bg-content pb-[calc(96px+env(safe-area-inset-bottom))] md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <Dock />
      <ConnectNotice />
      <Toaster
        position="top-center"
        offset={16}
        toastOptions={{
          className:
            "!rounded-[14px] !border-0 !bg-[var(--menubar)] !text-ink !shadow-[var(--shadow-pop)] !backdrop-blur-2xl !font-sans",
        }}
      />
    </>
  );
}
