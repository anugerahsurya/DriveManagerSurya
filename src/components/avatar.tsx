import { displayName, logoUrl } from "@/lib/format";
import type { AccountView } from "@/lib/types";

type Props = {
  account: Pick<AccountView, "avatar" | "nickname" | "googleName" | "email">;
  size?: number;
  className?: string;
};

/** Avatar akun: maskot ipaslogo bila dipilih, selain itu inisial abu ala Kontak macOS. */
export function Avatar({ account, size = 32, className = "" }: Props) {
  const style = { width: size, height: size };
  if (account.avatar) {
    return (
      <span
        className={`inline-block shrink-0 overflow-hidden rounded-full shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)] ${className}`}
        style={{ ...style, background: account.avatar.bg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- CDN pihak ketiga, sudah WebP 512px; optimasi Next tidak perlu */}
        <img
          src={logoUrl(account.avatar.key)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </span>
    );
  }
  const initials = displayName(account)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ${className}`}
      style={{ ...style, fontSize: size * 0.4, background: "linear-gradient(180deg,#a7acb7,#81858f)" }}
    >
      {initials}
    </span>
  );
}
