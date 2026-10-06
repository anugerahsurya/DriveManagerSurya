import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Drive Manager Surya", template: "%s · Drive Manager Surya" },
  description: "Pantau penyimpanan semua akun Google Drive, dan simpan password akun dalam brankas terenkripsi.",
  appleWebApp: { capable: true, title: "Drive", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f5f7",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get("dm_theme")?.value === "dark" ? "dark" : "light";
  return (
    <html lang="id" data-theme={theme} className={jakarta.variable}>
      <body className="min-h-dvh">
        {/*
          THESIS: Drive Manager adalah jendela macOS, bukan dashboard SaaS: System Settings + "About This Mac › Storage" untuk banyak akun Google. Menolak grid kartu statistik bergradien.
          OWN-WORLD: wallpaper terang statis, jendela putih bersudut 12px dengan traffic lights, sidebar vibrancy, grup inset bergaris hairline, aksen biru sistem, Dock beku di bawah. Plus Jakarta Sans, ikon Phosphor.
          STORY: pemilik membuka di HP, langsung melihat bar penyimpanan gabungan & akun yang hampir penuh, menyalin password dari brankas yang hanya terbuka di HP terdaftar.
          FIRST VIEWPORT: bar penyimpanan gabungan (seperti disk Macintosh HD) di atas, daftar akun bergaya System Settings di bawah; Dock sebagai navigasi.
          FORM: pin pengguna "seperti laman Mac" (menggantikan undian); seed 47975ac9.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        {children}
      </body>
    </html>
  );
}
