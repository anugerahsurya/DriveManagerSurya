import Link from "next/link";
import { AppIcon } from "@/components/shell/app-icon";

export const metadata = { title: "Kebijakan Privasi", robots: { index: true, follow: false } };

const UPDATED = "6 Oktober 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-content px-4 py-12 md:py-16">
      <article className="mx-auto max-w-[680px] text-[15px] leading-relaxed">
        <header className="mb-8 flex items-center gap-3">
          <AppIcon kind="overview" size={44} />
          <div>
            <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">Kebijakan Privasi</h1>
            <p className="text-[13px] text-ink-2">Drive Manager Surya · diperbarui {UPDATED}</p>
          </div>
        </header>

        <div className="group-box space-y-5 p-5 md:p-6 [&_h2]:text-[16px] [&_h2]:font-bold [&_p]:text-ink-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-2">
          <section className="space-y-2">
            <h2>Siapa yang memakai aplikasi ini</h2>
            <p>
              Drive Manager Surya adalah aplikasi pribadi milik Anugerah Surya Atmaja untuk memantau penyimpanan akun
              Google miliknya sendiri. Hanya satu akun GitHub pemilik yang dapat masuk.
            </p>
          </section>

          <section className="space-y-2">
            <h2>Data Google yang diakses</h2>
            <ul>
              <li>Alamat email, nama, dan ID akun (scope openid, email, profile) untuk mengenali akun yang disambungkan.</li>
              <li>
                Kuota penyimpanan Google Drive (jumlah terpakai, batas, dan ukuran sampah) melalui scope{" "}
                <code>drive.file</code>.
              </li>
            </ul>
            <p>Aplikasi tidak membaca, mengubah, mengunduh, atau menghapus file apa pun di Google Drive.</p>
          </section>

          <section className="space-y-2">
            <h2>Cara data disimpan</h2>
            <ul>
              <li>Token akses Google disimpan dalam keadaan terenkripsi (AES-256-GCM).</li>
              <li>Angka kuota dan riwayat penggunaan harian disimpan untuk menampilkan grafik.</li>
              <li>
                Password di brankas dienkripsi di perangkat pemilik sebelum dikirim; server hanya menyimpan data terenkripsi
                yang tidak dapat dibaca.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2>Berbagi data</h2>
            <p>Data tidak dijual, tidak dibagikan, dan tidak dipakai untuk iklan atau melatih model AI.</p>
          </section>

          <section className="space-y-2">
            <h2>Menghapus data</h2>
            <p>
              Memutuskan akun di aplikasi akan mencabut akses Google dan menghapus riwayatnya. Akses juga dapat dicabut kapan
              saja dari{" "}
              <a
                href="https://myaccount.google.com/connections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2"
              >
                halaman Koneksi akun Google
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2>Kontak</h2>
            <p>
              <a href="mailto:atmajasuryaanugerah@gmail.com" className="text-accent underline underline-offset-2">
                atmajasuryaanugerah@gmail.com
              </a>
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-[13px]">
          <Link href="/" className="text-accent">
            Kembali ke Drive Manager
          </Link>
        </p>
      </article>
    </main>
  );
}
