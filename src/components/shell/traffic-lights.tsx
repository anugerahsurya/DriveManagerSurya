/** Tiga lampu jendela macOS. Dekoratif; glyph muncul saat grup di-hover, seperti aslinya. */
export function TrafficLights() {
  const dot = "relative grid size-3 place-items-center rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.18)]";
  const glyph = "opacity-0 transition-opacity duration-100 group-hover:opacity-100";
  return (
    <div aria-hidden className="group flex items-center gap-2">
      <span className={dot} style={{ background: "#ff5f57" }}>
        <svg viewBox="0 0 8 8" className={`size-[6px] ${glyph}`} stroke="#7a1a12" strokeWidth="1.3">
          <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" />
        </svg>
      </span>
      <span className={dot} style={{ background: "#febc2e" }}>
        <svg viewBox="0 0 8 8" className={`size-[6px] ${glyph}`} stroke="#8a5a00" strokeWidth="1.3">
          <path d="M1 4h6" />
        </svg>
      </span>
      <span className={dot} style={{ background: "#28c840" }}>
        <svg viewBox="0 0 8 8" className={`size-[6px] ${glyph}`} fill="#0b5d1a">
          <path d="M1.5 1.5h3.5l-3.5 3.5zM6.5 6.5h-3.5l3.5-3.5z" />
        </svg>
      </span>
    </div>
  );
}
