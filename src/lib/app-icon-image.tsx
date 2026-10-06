import { ImageResponse } from "next/og";

// Ikon aplikasi: squircle biru dengan dua drive bertumpuk, digambar sebagai SVG (tanpa aset raster).
export function appIcon(px: number, rounded: boolean) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg,#4aa3ff,#1867e0)",
          borderRadius: rounded ? px * 0.225 : 0,
        }}
      >
        <svg width={px * 0.56} height={px * 0.56} viewBox="0 0 256 256" fill="#fff">
          <path d="M208 136H48a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16v-48a16 16 0 0 0-16-16Zm-28 52a12 12 0 1 1 12-12 12 12 0 0 1-12 12Zm28-148H48a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16Zm-28 52a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
