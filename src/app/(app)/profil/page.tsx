import { cookies } from "next/headers";
import { PiGithubLogoFill, PiSignOutBold } from "react-icons/pi";
import { ProfileList } from "@/components/profile-list";
import { PageHeader } from "@/components/shell/page-header";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { listAccounts } from "@/lib/accounts";
import { requireOwner } from "@/lib/session";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const [owner, accounts, jar] = await Promise.all([requireOwner(), listAccounts(), cookies()]);
  const theme = jar.get("dm_theme")?.value === "dark" ? "dark" : "light";

  return (
    <>
      <PageHeader title="Profil" />
      <div className="mx-auto max-w-[760px] space-y-7 px-4 pt-2 md:px-8 md:pt-7">
        {/* Akun induk: seperti baris Apple ID di System Settings */}
        <section className="group-box flex items-center gap-4 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={owner.avatar} alt="" width={64} height={64} className="size-16 rounded-full" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-bold">{owner.name}</h2>
            <p className="flex items-center gap-1.5 text-[13px] text-ink-2">
              <PiGithubLogoFill aria-hidden />@{owner.login} · Akun induk
            </p>
          </div>
        </section>

        <section aria-labelledby="look">
          <h2 id="look" className="group-title">
            Tampilan
          </h2>
          <div className="group-box">
            <div className="group-row justify-between">
              <span>Mode</span>
              <ThemeToggle theme={theme} />
            </div>
          </div>
        </section>

        <section aria-labelledby="profiles">
          <h2 id="profiles" className="group-title">
            Profil akun Drive
          </h2>
          <ProfileList accounts={accounts} />
          <p className="mt-2 px-1 text-[12px] text-ink-2">
            Nama panggilan dan avatar hanya berlaku di Drive Manager; akun Google Anda tidak diubah.
          </p>
        </section>

        <section className="pb-6">
          <form action="/api/auth/logout" method="post" className="group-box">
            <button type="submit" className="group-row justify-center gap-2 font-semibold text-critical">
              <PiSignOutBold aria-hidden />
              Keluar
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
