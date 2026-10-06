import { redirect } from "next/navigation";
import { PiGithubLogoFill } from "react-icons/pi";
import { LockClock } from "@/components/lock-clock";
import { AppIcon } from "@/components/shell/app-icon";
import { getOwner } from "@/lib/session";

export const metadata = { title: "Masuk" };

const ERRORS: Record<string, string> = {
  not_allowed: "Akun GitHub ini tidak punya akses. Hanya akun induk yang bisa masuk.",
  state: "Sesi masuk kedaluwarsa. Coba lagi.",
  cancelled: "Masuk dibatalkan.",
  github: "GitHub tidak merespons. Coba lagi sebentar lagi.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getOwner()) redirect("/");
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-6 pt-[max(56px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))] [background-image:radial-gradient(70%_60%_at_15%_5%,var(--wall-a),transparent_70%),radial-gradient(60%_60%_at_95%_95%,var(--wall-b),transparent_70%),radial-gradient(45%_45%_at_70%_25%,var(--wall-c),transparent_70%)]">
      <LockClock />

      <div className="window-open mt-auto mb-auto flex w-full max-w-[300px] flex-col items-center pt-10 text-center">
        <AppIcon kind="overview" size={88} />
        <h1 className="mt-5 text-[22px] font-bold">Drive Manager</h1>
        <p className="mt-1 text-[14px] text-ink-2">Masuk dengan akun GitHub induk.</p>

        <a
          href="/api/auth/github"
          className="press mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[rgb(255_255_255/0.6)] font-semibold shadow-[0_0_0_0.5px_var(--hairline),0_6px_20px_-8px_rgb(20_30_50/0.35)] backdrop-blur-xl hover:bg-[rgb(255_255_255/0.75)] [:root[data-theme=dark]_&]:bg-[rgb(255_255_255/0.1)]"
        >
          <PiGithubLogoFill aria-hidden className="size-5" />
          Masuk dengan GitHub
        </a>
        <p role="alert" className="mt-4 min-h-10 text-[13px] text-critical">
          {message}
        </p>
      </div>

      <p className="text-[12px] text-ink-2">Data hanya untuk pemilik. Password dienkripsi di HP Anda.</p>
    </main>
  );
}
