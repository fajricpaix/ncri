// Ornamen dekoratif murni (aria-hidden): langit senja + siluet candi di header, motif batik di sidebar.

export function HeaderArt() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-y-0 right-0 h-full w-[46%] min-w-[360px]" viewBox="0 0 600 90" preserveAspectRatio="xMaxYMid slice">
      <defs>
        <radialGradient id="sunset" cx="72%" cy="100%" r="80%">
          <stop offset="0" stopColor="#f6b24a" stopOpacity=".55" />
          <stop offset=".45" stopColor="#c8622e" stopOpacity=".25" />
          <stop offset="1" stopColor="#0b1f4b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stopColor="#0b1f4b" /><stop offset=".5" stopColor="#0b1f4b" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="600" height="90" fill="url(#sunset)" />
      <g fill="#071636" opacity=".85">
        <path d="M330 90V74h40v-8h30v-8h30v-10h22v-14l6-12 6 12v14h22v10h30v8h30v8h40v16z" />
        <path d="M455 22l5-20 5 20z" />
        <circle cx="400" cy="58" r="0" />
      </g>
      <g fill="#0b1f4b" opacity=".9"><path d="M300 90V80h40v10zM560 90V78h40v12z" /></g>
      <rect width="600" height="90" fill="url(#fade)" />
    </svg>
  );
}

export function BatikOrnament() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-44 w-full opacity-[.22]">
      <defs>
        <pattern id="batik-side" width="44" height="44" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#e7b94a" strokeWidth="1.4">
            <path d="M22 4c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10zM22 24c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10z" />
            <path d="M4 22c0-6 4-10 10-10s10 4 10 10-4 10-10 10S4 28 4 22zM24 22c0-6 4-10 10-10s10 4 10 10-4 10-10 10-10-4-10-10z" />
          </g>
        </pattern>
        <linearGradient id="batik-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" /></linearGradient>
        <mask id="batik-mask"><rect width="100%" height="100%" fill="url(#batik-fade)" /></mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#batik-side)" mask="url(#batik-mask)" />
    </svg>
  );
}
