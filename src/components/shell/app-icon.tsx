import type { IconType } from "react-icons";
import { PiHardDrivesFill, PiKeyFill, PiPhoneFill, PiPlusBold, PiUserFill } from "react-icons/pi";

export type AppKind = "overview" | "vault" | "phone" | "profile" | "add";

export const APPS: Record<AppKind, { label: string; href: string; icon: IconType; fill: string; glyph: string }> = {
  overview: { label: "Ringkasan", href: "/", icon: PiHardDrivesFill, fill: "linear-gradient(180deg,#4aa3ff,#1867e0)", glyph: "#fff" },
  vault: { label: "Brankas", href: "/brankas", icon: PiKeyFill, fill: "linear-gradient(180deg,#5d636e,#2c3038)", glyph: "#f6d36b" },
  phone: { label: "Nomor HP", href: "/nomor-hp", icon: PiPhoneFill, fill: "linear-gradient(180deg,#5fe07c,#1fae47)", glyph: "#fff" },
  profile: { label: "Profil", href: "/profil", icon: PiUserFill, fill: "linear-gradient(180deg,#ffb04a,#f07a12)", glyph: "#fff" },
  add: { label: "Tambah akun", href: "/api/google/connect", icon: PiPlusBold, fill: "linear-gradient(180deg,#ffffff,#eceef2)", glyph: "#1867e0" },
};

/** Ikon aplikasi berbentuk squircle, seperti ikon di System Settings dan Dock. */
export function AppIcon({ kind, size = 22 }: { kind: AppKind; size?: number }) {
  const app = APPS[kind];
  const Icon = app.icon;
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: app.fill,
        color: app.glyph,
        boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.14), inset 0 1px 0 rgb(255 255 255 / 0.25)",
      }}
    >
      <Icon style={{ width: size * 0.58, height: size * 0.58 }} />
    </span>
  );
}
