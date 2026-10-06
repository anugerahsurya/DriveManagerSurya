# Design

Drive Manager meniru jendela macOS (System Settings + "About This Mac › Storage"), bukan dashboard SaaS. Pinned by owner: "seperti laman Mac", terang secara default.

## World

- **Desktop (≥1024px):** wallpaper statis (3 gradien radial) → menu bar 28px (vibrancy) → satu jendela putih melayang, sudut 12px, `--shadow-window` → Dock di bawah.
- **Tablet (768–1023px):** jendela memenuhi layar, sidebar tetap ada, tanpa menu bar.
- **HP (<768px):** tanpa bingkai jendela. Judul besar 30px, grup inset, Dock sebagai navigasi utama (safe-area aware).

## Tokens (`src/app/globals.css`)

| Peran | Terang | Catatan |
|---|---|---|
| `--content` | `#f5f5f7` | latar area konten |
| `--group` | `#ffffff` | kotak grup inset, hairline 0.5px |
| `--sidebar` | `rgb(236 238 242 / .72)` | + `backdrop-blur-2xl` (satu-satunya efek kaca, plus Dock & menu bar) |
| `--text` / `--text-2` / `--text-3` | `#1d1d1f` / `#55555c` / `#6e6e75` | semua ≥4.5:1 di `--group` |
| `--accent` | `#0a66d6` | biru sistem; item sidebar terpilih, tombol utama |
| `--critical` / `--warning` / `--good` | `#d70015` / `#a05a00` / `#1b7f3b` | status selalu dengan ikon + label |
| `--s0…--s7` | palet kategorikal dataviz tervalidasi | warna mengikuti **slot akun** (tetap seumur akun), akun ke-9+ dilipat ke `--s-other` |

Mode gelap: hanya lewat `data-theme="dark"` (cookie `dm_theme`), tidak pernah otomatis dari sistem.

## Type

Plus Jakarta Sans (next/font, self-hosted), 400–800. Body 15px di HP, 14px di desktop (skala macOS). Angka tabular (`.tnum`) untuk semua ukuran/persen. Judul HP 30/800 tracking −0.02em; judul toolbar desktop 15/700.

## Components

- `group-box` / `group-row` / `group-title`: grup inset ala System Settings. Tinggi baris 48px (HP) / 42px (desktop).
- `btn`, `btn-primary`, `btn-plain`, `btn-danger`: tombol macOS; `:active` scale 0.97.
- `field`: input 16px di HP (cegah zoom iOS), ring fokus aksen 3.5px.
- `AppIcon`: squircle (radius 27%) dengan gradien vertikal, dipakai di sidebar (20px) dan Dock (46px).
- `Sheet`: vaul. HP = drawer bawah yang bisa diseret; desktop = sheet macOS yang turun dari atas jendela.
- `SegmentBar` + `SegmentLegend`: bar penyimpanan bersegmen, celah 2px, tooltip hover/fokus, legenda selalu ada.
- `TrendChart`: SVG garis 2px, satu seri, crosshair + tooltip; label sumbu HTML.
- Aksi berbahaya (putuskan akun, hapus brankas) selalu di grupnya sendiri, teks merah, konfirmasi lewat sheet.

## Motion

Kurva `--ease-out: cubic-bezier(.23,1,.32,1)`. Hanya transform/opacity/clip-path.

- **Momen utama:** jendela terbuka (scale .965 → 1, 420ms) sekali saat aplikasi dimuat; bar penyimpanan terisi dari kiri (clip-path, 900ms).
- Dock: magnifikasi CSS murni (hanya `hover:hover and pointer:fine`), pantulan sekali saat ikon diklik (gerak asli Dock, sengaja dipertahankan walau detektor menandai "bounce").
- Layar kunci brankas: getar saat password salah (seperti login macOS).
- Segmented control: thumb bergeser 200ms.
- `prefers-reduced-motion`: semua durasi → 1ms.

## Copy

Bahasa Indonesia. Kontrol menyebut aksinya ("Sambungkan ulang", "Salin kode"). Tidak pernah mengklaim bisa mengganti nomor HP atau membaca daftar aplikasi otomatis: Google tidak menyediakan API itu untuk akun pribadi.
